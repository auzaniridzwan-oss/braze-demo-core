// Turns "value before" → "value after" for a live profile into the smallest correct set of
// Braze /users/track attribute objects, using Braze's update operators where they're safe:
//
// - primitive changed / type changed       → set the new value
// - attribute removed                      → null (top level only)
// - nested object, keys added or changed   → partial object with "_merge_objects": true
// - nested object, a key removed           → full replace (Braze has no per-key delete)
// - array of primitives                    → {"add": [...], "remove": [...]} when that reproduces
//                                            the new array exactly, else full replace
// - array of objects with a stable id key  → "$remove", "$update", "$add" operations, else full replace
//
// Objects that must be replaced go in an attribute object WITHOUT "_merge_objects", because that
// flag applies to every object in the same attribute object.

import { byteSize, keyProblem } from "../fields";
import { DEFAULT_ARRAY_LENGTH, KB, MAX_OBJECT_BYTES, MAX_STRING_LENGTH } from "../rules";
import type { AttrValue } from "../types";
import { isPlainObject, isTimeValue } from "./values";

type Obj = { [key: string]: AttrValue };
export type BrazeAttributeObject = Record<string, unknown>;

export type ChangeKind =
  | "set" | "delete" | "merge" | "replace_object"
  | "array_ops" | "replace_array"
  | "object_array_ops" | "replace_object_array";

export interface AttributeChange {
  key: string;
  kind: ChangeKind;
  /** Plain-language description for the confirm dialog. */
  summary: string;
  /** Why a full replace was used instead of an operator, when it was. */
  note?: string;
}

export interface UpdatePlan {
  changes: AttributeChange[];
  /** Attribute objects to send, in order, in one /users/track request. */
  attributes: BrazeAttributeObject[];
  errors: string[];
  warnings: string[];
}

export interface PlanOptions {
  /** Identifier fields added to every attribute object, e.g. { external_id: "u1" }. */
  identifier: Record<string, string>;
  /** Adds "_update_existing_only": true (don't create the user if missing). */
  updateExistingOnly?: boolean;
  /** Per-attribute id key for arrays of objects; otherwise detected ("id", "*_id", …). */
  identifierKeys?: Record<string, string>;
  /** Per-attribute override: always replace objects / arrays instead of using operators. */
  forceReplace?: string[];
}

// ---------- small helpers ----------

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bb = b as unknown[];
    return a.length === bb.length && a.every((x, i) => deepEqual(x, bb[i]));
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual((a as Obj)[k], (b as Obj)[k]));
}

const isObj = (v: unknown): v is Obj => isPlainObject(v) && !isTimeValue(v);
const isObjArray = (v: unknown): v is Obj[] => Array.isArray(v) && v.length > 0 && v.every(isObj);
const isPrimArray = (v: unknown): v is AttrValue[] => Array.isArray(v) && v.every((x) => x === null || typeof x !== "object");
const show = (v: unknown) => {
  const s = JSON.stringify(v);
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
};

/** True when some key exists in `a` but not in `b`, at any depth of nested objects. */
function removesKeys(a: Obj, b: Obj): boolean {
  return Object.keys(a).some((k) => !(k in b) || (isObj(a[k]) && isObj(b[k]) && removesKeys(a[k] as Obj, b[k] as Obj)));
}

/** Only the keys that are new or changed, recursing into nested objects. */
function partialObject(a: Obj, b: Obj): Obj {
  const out: Obj = {};
  for (const [k, v] of Object.entries(b)) {
    if (deepEqual(a[k], v)) continue;
    out[k] = isObj(a[k]) && isObj(v) ? partialObject(a[k] as Obj, v) : v;
  }
  return out;
}

/** Keys whose values identify each item: present on every item, primitive and unique. */
export function detectIdentifierKey(...lists: Obj[][]): string | null {
  const items = lists.flat();
  if (!items.length) return null;
  const candidates = Object.keys(items[0]).filter((k) =>
    items.every((it) => k in it && (typeof it[k] === "string" || typeof it[k] === "number")));
  const unique = (k: string) => lists.every((l) => new Set(l.map((it) => it[k])).size === l.length);
  const rank = (k: string) => (k === "id" ? 0 : /(^|_)id$/i.test(k) ? 1 : /id/i.test(k) ? 2 : 3);
  const ok = candidates.filter(unique).sort((x, y) => rank(x) - rank(y));
  return ok.length && rank(ok[0]) < 3 ? ok[0] : null;
}

// ---------- validation of values Braze will receive ----------

/** Problems Braze would reject (errors) or silently change (warnings) for one top-level value. */
export function valueProblems(key: string, v: AttrValue): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const walk = (x: AttrValue, path: string, inObject: boolean) => {
    if (x === null) {
      if (inObject) errors.push(`${path}: null isn't allowed inside an object (Braze drops the whole update); remove the key instead`);
      return;
    }
    if (typeof x === "string" && x.length > MAX_STRING_LENGTH) warnings.push(`${path}: longer than ${MAX_STRING_LENGTH} characters`);
    if (Array.isArray(x)) {
      if (x.length > DEFAULT_ARRAY_LENGTH) warnings.push(`${path}: ${x.length} items; Braze keeps ${DEFAULT_ARRAY_LENGTH} by default`);
      x.forEach((it, i) => walk(it, `${path}[${i}]`, inObject || isObj(it)));
      return;
    }
    if (isObj(x)) {
      for (const [k, child] of Object.entries(x)) {
        const p = keyProblem(k);
        if (p) errors.push(`${path}.${k}: key ${p}`);
        walk(child, `${path}.${k}`, true);
      }
    }
  };
  walk(v, key, false);
  if (v !== null && typeof v === "object") {
    const size = byteSize(v);
    if (size > MAX_OBJECT_BYTES) errors.push(`${key}: ${(size / KB).toFixed(0)} KB, over Braze's 100 KB limit`);
  }
  return { errors, warnings };
}

// ---------- the planner ----------

export function planAttributeUpdate(before: Record<string, AttrValue>, after: Record<string, AttrValue>, opts: PlanOptions): UpdatePlan {
  const plan: UpdatePlan = { changes: [], attributes: [], errors: [], warnings: [] };
  const base: BrazeAttributeObject = {};
  const merge: BrazeAttributeObject = {};
  const removes: BrazeAttributeObject[] = [];
  const updates: BrazeAttributeObject[] = [];
  const adds: BrazeAttributeObject[] = [];
  const force = new Set(opts.forceReplace ?? []);

  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  for (const key of keys) {
    const a = before[key];
    const has = Object.prototype.hasOwnProperty.call(after, key);
    const b = after[key];
    if (has && deepEqual(a, b)) continue;

    if (!has || b === null) {
      if (a === undefined || a === null) continue;
      base[key] = null;
      plan.changes.push({ key, kind: "delete", summary: `Remove ${key}` });
      continue;
    }

    const problems = valueProblems(key, b);
    plan.errors.push(...problems.errors);
    plan.warnings.push(...problems.warnings);

    // Nested object
    if (isObj(b)) {
      if (isObj(a) && !force.has(key)) {
        if (removesKeys(a, b)) {
          base[key] = b;
          plan.changes.push({ key, kind: "replace_object", summary: `Replace object ${key}`, note: "a key was removed, and Braze can't delete a single key, so the whole object is replaced" });
        } else {
          merge[key] = partialObject(a, b);
          plan.changes.push({ key, kind: "merge", summary: `Merge into ${key}: ${show(merge[key])}` });
        }
      } else {
        base[key] = b;
        plan.changes.push({ key, kind: "replace_object", summary: `Set object ${key}`, note: isObj(a) ? "replace requested" : undefined });
      }
      continue;
    }

    // Array of objects
    if (isObjArray(b) || (Array.isArray(b) && b.length === 0 && isObjArray(a))) {
      const newItems = b as Obj[];
      const oldItems = isObjArray(a) ? a : null;
      const idKey = oldItems ? opts.identifierKeys?.[key] ?? detectIdentifierKey(oldItems, newItems) : null;
      const reason =
        !oldItems ? undefined
          : force.has(key) ? "replace requested"
          : !idKey ? "no id-like key identifies the items"
          : !newItems.every((it) => idKey in it) || new Set(newItems.map((it) => it[idKey])).size !== newItems.length
            ? `"${idKey}" is missing or repeated on some items`
          : undefined;
      if (!oldItems || reason) {
        base[key] = newItems;
        plan.changes.push({ key, kind: "replace_object_array", summary: `Replace ${key} (${newItems.length} items)`, note: reason });
        if (reason && oldItems) plan.warnings.push(`${key}: whole array of objects replaced (${reason})`);
        continue;
      }
      const id = idKey as string;
      const oldById = new Map(oldItems.map((it) => [it[id], it]));
      const newById = new Map(newItems.map((it) => [it[id], it]));
      const removed = oldItems.filter((it) => !newById.has(it[id]));
      const added = newItems.filter((it) => !oldById.has(it[id]));
      const changed = newItems.filter((it) => oldById.has(it[id]) && !deepEqual(oldById.get(it[id]), it));
      // $update merges into the item, so an item that lost a key must be removed and re-added.
      const lostKeys = changed.filter((it) => removesKeys(oldById.get(it[id]) as Obj, it));
      const merged = changed.filter((it) => !lostKeys.includes(it));
      const sameOrder = (() => {
        const kept = oldItems.filter((it) => newById.has(it[id]) && !lostKeys.some((l) => l[id] === it[id])).map((it) => it[id]);
        const expected = [...kept, ...[...lostKeys, ...added].map((it) => it[id])];
        return deepEqual(expected, newItems.map((it) => it[id]));
      })();
      if (!sameOrder) {
        base[key] = newItems;
        plan.changes.push({ key, kind: "replace_object_array", summary: `Replace ${key} (${newItems.length} items)`, note: "items were reordered, which operators can't express" });
        continue;
      }
      const ident = (it: Obj) => ({ $identifier_key: id, $identifier_value: it[id] });
      const toRemove = [...removed, ...lostKeys];
      const toAdd = [...lostKeys.map((it) => newById.get(it[id]) as Obj), ...added];
      if (toRemove.length) removes.push({ [key]: { $remove: toRemove.map(ident) } });
      if (merged.length) {
        updates.push({
          [key]: { $update: merged.map((it) => ({ ...ident(it), $new_object: partialObject(oldById.get(it[id]) as Obj, it) })) },
          _merge_objects: true,
        });
      }
      if (toAdd.length) adds.push({ [key]: { $add: toAdd } });
      const parts = [
        toRemove.length && `remove ${toRemove.length}`,
        merged.length && `update ${merged.length}`,
        toAdd.length && `add ${toAdd.length}`,
      ].filter(Boolean);
      plan.changes.push({ key, kind: "object_array_ops", summary: `${key} by "${id}": ${parts.join(", ")}` });
      continue;
    }

    // Array of primitives
    if (isPrimArray(b)) {
      const oldArr = isPrimArray(a) ? a : null;
      if (oldArr && !force.has(key)) {
        const uniq = (xs: AttrValue[]) => new Set(xs.map((x) => JSON.stringify(x))).size === xs.length;
        const has = (xs: AttrValue[], x: AttrValue) => xs.some((y) => deepEqual(x, y));
        const remove = oldArr.filter((x) => !has(b, x));
        const add = b.filter((x) => !has(oldArr, x));
        const expected = [...oldArr.filter((x) => has(b, x)), ...add];
        if (uniq(oldArr) && uniq(b) && deepEqual(expected, b)) {
          const op: Record<string, AttrValue[]> = {};
          if (add.length) op.add = add;
          if (remove.length) op.remove = remove;
          base[key] = op;
          plan.changes.push({ key, kind: "array_ops", summary: [add.length && `${key} add ${show(add)}`, remove.length && `remove ${show(remove)}`].filter(Boolean).join(", ") });
          continue;
        }
        base[key] = b;
        plan.changes.push({ key, kind: "replace_array", summary: `Replace ${key} with ${show(b)}`, note: "order or duplicates changed, which add/remove can't express" });
        continue;
      }
      base[key] = b;
      plan.changes.push({ key, kind: "replace_array", summary: `Set ${key} to ${show(b)}`, note: oldArr ? "replace requested" : undefined });
      continue;
    }

    // Primitive or {"$time"} or type change
    base[key] = b;
    plan.changes.push({ key, kind: "set", summary: `Set ${key} to ${show(b)}` });
  }

  const wrap = (o: BrazeAttributeObject): BrazeAttributeObject => ({
    ...opts.identifier,
    ...(opts.updateExistingOnly ? { _update_existing_only: true } : {}),
    ...o,
  });
  if (Object.keys(base).length) plan.attributes.push(wrap(base));
  if (Object.keys(merge).length) plan.attributes.push(wrap({ ...merge, _merge_objects: true }));
  for (const o of [...removes, ...updates, ...adds]) plan.attributes.push(wrap(o));
  return plan;
}

// ---------- applying a plan locally (for the mock server and tests) ----------

function deepMerge(a: AttrValue | undefined, b: AttrValue): AttrValue {
  if (isObj(a) && isObj(b)) {
    const out: Obj = { ...a };
    for (const [k, v] of Object.entries(b)) out[k] = deepMerge(a[k], v);
    return out;
  }
  return b;
}

/**
 * Applies attribute objects to a stored profile the way Braze does (as far as these operators go).
 * Used by the mock Braze server and by tests to check that a plan reproduces the edited profile.
 */
export function applyAttributeObjects(profile: Record<string, AttrValue>, objects: BrazeAttributeObject[]): Record<string, AttrValue> {
  const out: Record<string, AttrValue> = JSON.parse(JSON.stringify(profile));
  const meta = new Set(["external_id", "braze_id", "user_alias", "_update_existing_only", "_merge_objects"]);
  for (const o of objects) {
    const mergeObjects = o._merge_objects === true;
    for (const [k, raw] of Object.entries(o)) {
      if (meta.has(k)) continue;
      const v = raw as AttrValue;
      if (v === null) { delete out[k]; continue; }
      if (isPlainObject(v) && ("add" in v || "remove" in v) && Object.keys(v).every((x) => x === "add" || x === "remove")) {
        let arr = Array.isArray(out[k]) ? [...(out[k] as AttrValue[])] : [];
        const rm = (v.remove as AttrValue[] | undefined) ?? [];
        arr = arr.filter((x) => !rm.some((y) => deepEqual(x, y)));
        for (const x of (v.add as AttrValue[] | undefined) ?? []) if (!arr.some((y) => deepEqual(x, y))) arr.push(x);
        out[k] = arr;
        continue;
      }
      if (isPlainObject(v) && ("$add" in v || "$remove" in v || "$update" in v)) {
        let arr = (Array.isArray(out[k]) ? [...(out[k] as AttrValue[])] : []) as Obj[];
        for (const r of (v.$remove as Obj[] | undefined) ?? []) {
          arr = arr.filter((it) => it[r.$identifier_key as string] !== r.$identifier_value);
        }
        for (const u of (v.$update as Obj[] | undefined) ?? []) {
          arr = arr.map((it) => (it[u.$identifier_key as string] === u.$identifier_value
            ? (mergeObjects ? deepMerge(it, u.$new_object) : u.$new_object) as Obj : it));
        }
        for (const x of (v.$add as Obj[] | undefined) ?? []) arr.push(x);
        out[k] = arr;
        continue;
      }
      out[k] = mergeObjects && isObj(v) ? deepMerge(out[k], v) : v;
    }
  }
  return out;
}
