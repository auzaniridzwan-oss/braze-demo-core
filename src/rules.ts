// Braze rules for a single field definition: key names, nesting depth, item counts and size limits.

import { byteSize, isContainer, jsonLiteralProblem, keyProblem } from "./fields";
import { MAX_DEPTH, type FieldSpec } from "./types";

export interface Validation {
  errors: string[];
  warnings: string[];
}

export const KB = 1024;
/** Braze's limit for one object, array of objects or array attribute. */
export const MAX_OBJECT_BYTES = 100 * KB;
/** Items Braze keeps in an array by default (raise Max Length in the dashboard for more). */
export const DEFAULT_ARRAY_LENGTH = 500;
/** Braze's limit for string values. */
export const MAX_STRING_LENGTH = 255;

/** Upper bound of a field's serialized size, used to check Braze's 100 KB object/array limit. */
export function maxBytes(f: FieldSpec): number {
  const longest = (vals: string[]) => vals.reduce((m, x) => Math.max(m, byteSize(x)), 2);
  switch (f.type) {
    case "array":
      return 2 + (f.maxItems ?? 3) * (longest(f.values) + 1);
    case "object":
      return 2 + (f.children ?? []).filter((c) => c.enabled).reduce((a, c) => a + byteSize(c.name) + 1 + maxBytes(c) + 1, 0);
    case "object_array": {
      const item = 2 + (f.children ?? []).filter((c) => c.enabled).reduce((a, c) => a + byteSize(c.name) + 1 + maxBytes(c) + 1, 0)
        + (f.idKey ? byteSize(f.idKey) + 8 : 0);
      return 2 + (f.maxItems ?? 3) * (item + 1);
    }
    case "json":
      return f.values.reduce((m, x) => Math.max(m, byteSize(JSON.parse(x))), 2);
    case "date":
      return 30;
    default:
      return f.mode === "range" ? 24 : longest(f.values);
  }
}

export interface FieldCtx {
  /** Label prefix for messages, e.g. `Attribute` or `Event "purchase" property`. */
  where: string;
  depth: number;
  nested: boolean;
  inObjectArray: boolean;
  eventProperty: boolean;
}

/** Context for a top-level attribute or event property. */
export function topLevelCtx(where: string, eventProperty = false): FieldCtx {
  return { where, depth: 1, nested: false, inObjectArray: false, eventProperty };
}

/** Checks one field definition (recursively for children) and appends problems to `v`. */
export function checkField(f: FieldSpec, ctx: FieldCtx, v: Validation) {
  if (!f.enabled) return;
  const label = `${ctx.where} "${f.name}"`;
  if (!f.name.trim()) v.errors.push(`${ctx.where}: name is empty`);
  if (ctx.nested) {
    const problem = keyProblem(f.name);
    if (problem) v.errors.push(`${label}: key ${problem} (not allowed inside objects)`);
  }
  if (ctx.depth > MAX_DEPTH) v.errors.push(`${label}: nested deeper than ${MAX_DEPTH} levels`);
  if (f.coverage === 0) v.warnings.push(`${label}: coverage is 0%, it will never be set`);

  if (isContainer(f)) {
    const kids = (f.children ?? []).filter((c) => c.enabled);
    if (!kids.length) v.errors.push(`${label}: has no enabled sub-fields`);
    if (f.type === "object_array") {
      if (ctx.eventProperty) v.errors.push(`${label}: arrays of objects aren't supported in event properties`);
      if (ctx.inObjectArray) v.errors.push(`${label}: an array of objects can't contain another array of objects`);
      if ((f.minItems ?? 0) > (f.maxItems ?? 0)) v.errors.push(`${label}: min items is greater than max items`);
      if (f.idKey) {
        const problem = keyProblem(f.idKey);
        if (problem) v.errors.push(`${label}: id key ${problem}`);
        if (kids.some((c) => c.name === f.idKey)) v.errors.push(`${label}: id key "${f.idKey}" clashes with a sub-field`);
      }
    }
    const seen = new Set<string>();
    for (const c of f.children ?? []) {
      if (seen.has(c.name)) v.errors.push(`${label}: duplicate sub-field "${c.name}"`);
      seen.add(c.name);
      checkField(c, {
        where: `${ctx.where} "${f.name}" ›`, depth: ctx.depth + 1, nested: true,
        inObjectArray: ctx.inObjectArray || f.type === "object_array", eventProperty: ctx.eventProperty,
      }, v);
    }
  } else if (f.type === "json") {
    if (!f.values.length) v.errors.push(`${label}: no JSON values`);
    f.values.forEach((x, i) => {
      const problem = jsonLiteralProblem(x);
      if (problem) v.errors.push(`${label}: JSON value ${i + 1} ${problem}`);
    });
  } else if (f.type === "array") {
    if (!f.values.length) v.errors.push(`${label}: no values to pick from`);
    if (f.itemType === "number" && f.values.some((x) => Number.isNaN(Number(x)))) v.errors.push(`${label}: non-numeric item in array<number>`);
    if ((f.minItems ?? 0) > (f.maxItems ?? 0)) v.errors.push(`${label}: min items is greater than max items`);
    if ((f.maxItems ?? 0) > DEFAULT_ARRAY_LENGTH) {
      v.warnings.push(`${label}: up to ${f.maxItems} items; Braze keeps ${DEFAULT_ARRAY_LENGTH} by default (raise Max Length in the dashboard)`);
    }
    if (f.unique !== false && (f.minItems ?? 0) > f.values.length) {
      v.warnings.push(`${label}: min items (${f.minItems}) is more than the ${f.values.length} distinct values; users get at most ${f.values.length}`);
    }
  } else {
    const rangeOk = f.mode === "range" && (f.type === "number" || f.type === "date");
    if (rangeOk) {
      if (!f.min || !f.max) v.errors.push(`${label}: range needs min and max`);
      else if (f.type === "number" && Number(f.min) > Number(f.max)) v.errors.push(`${label}: min is greater than max`);
    } else if (!f.values.length) {
      v.errors.push(`${label}: no values to pick from`);
    } else if (f.weights.every((w) => w <= 0)) {
      v.errors.push(`${label}: all weights are 0`);
    }
    if (f.type === "number" && f.mode === "pick" && f.values.some((x) => Number.isNaN(Number(x)))) {
      v.errors.push(`${label}: non-numeric value in a number field`);
    }
  }
  if (f.type === "string" || f.type === "array") {
    const long = f.values.find((x) => x.length > MAX_STRING_LENGTH);
    if (long) v.errors.push(`${label}: value "${long.slice(0, 20)}…" is longer than ${MAX_STRING_LENGTH} characters`);
  }

  // Size limit applies to each top-level object / array attribute or property.
  if (ctx.depth === 1 && (isContainer(f) || f.type === "array" || f.type === "json")) {
    let size = 0;
    try { size = maxBytes(f); } catch { size = 0; }
    if (size > MAX_OBJECT_BYTES) v.errors.push(`${label}: can reach ${(size / KB).toFixed(0)} KB, over Braze's 100 KB limit`);
    else if (size > 0.8 * MAX_OBJECT_BYTES) v.warnings.push(`${label}: can reach ${(size / KB).toFixed(0)} KB, close to Braze's 100 KB limit`);
  }
}
