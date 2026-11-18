// Helpers shared by the parser, generator, validation and UI for composite (nested/array/json) fields.

import type { AttrValue, FieldSpec } from "./types";

/** Braze key rules for nested attributes: no spaces, "." or "$", at most 255 characters. */
export function keyProblem(name: string): string | null {
  if (!name) return "is empty";
  if (/\s/.test(name)) return "contains a space";
  if (name.includes(".")) return "contains a dot";
  if (name.includes("$")) return "contains $";
  if (name.length > 255) return "is longer than 255 characters";
  return null;
}

export function isContainer(f: FieldSpec): boolean {
  return f.type === "object" || f.type === "object_array";
}

/** A JSON literal must parse to an object, or to an array of objects. */
export function jsonLiteralProblem(raw: string): string | null {
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch (e) {
    return e instanceof Error ? e.message : "invalid JSON";
  }
  const isObj = (x: unknown) => typeof x === "object" && x !== null && !Array.isArray(x);
  if (isObj(v)) return null;
  if (Array.isArray(v) && v.length > 0 && v.every(isObj)) return null;
  return "must be a JSON object or an array of objects";
}

/** Visit every field with its dotted path (array-of-objects segments end in "[]"). */
export function walkFields(fields: FieldSpec[], visit: (f: FieldSpec, path: string, depth: number) => void, prefix = "", depth = 1) {
  for (const f of fields) {
    const path = prefix ? `${prefix}.${f.name}` : f.name;
    visit(f, path, depth);
    if (isContainer(f) && f.children) {
      walkFields(f.children, visit, f.type === "object_array" ? `${path}[]` : path, depth + 1);
    }
  }
}

/** Byte size of a value once serialized, as Braze measures object/array limits. */
export function byteSize(v: AttrValue | unknown): number {
  return new TextEncoder().encode(JSON.stringify(v)).length;
}

/** Number of keys (data points) a value writes: every nested key counts once. */
export function dataPoints(v: AttrValue): number {
  if (Array.isArray(v)) {
    const objects = v.filter((x) => x && typeof x === "object");
    return objects.length ? objects.reduce<number>((a, x) => a + dataPoints(x), 0) : 1;
  }
  if (v && typeof v === "object" && !("$time" in v)) {
    return Object.values(v).reduce<number>((a, x) => a + dataPoints(x), 0);
  }
  return 1;
}

/** Read a path from generated attributes. "[]" segments fan out over array items (any-item semantics). */
export function getPath(attrs: Record<string, AttrValue>, path: string): AttrValue[] {
  let cur: AttrValue[] = [attrs as AttrValue];
  for (const raw of path.split(".")) {
    const fan = raw.endsWith("[]");
    const key = fan ? raw.slice(0, -2) : raw;
    const next: AttrValue[] = [];
    for (const c of cur) {
      if (!c || typeof c !== "object" || Array.isArray(c)) continue;
      const v = (c as Record<string, AttrValue>)[key];
      if (v === undefined) continue;
      if (fan) {
        if (Array.isArray(v)) next.push(...v);
      } else {
        next.push(v);
      }
    }
    cur = next;
  }
  // Unwrap nested dates for comparison.
  return cur.map((v) => (v && typeof v === "object" && !Array.isArray(v) && "$time" in v ? (v.$time as AttrValue) : v));
}
