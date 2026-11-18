import { describe, expect, it } from "vitest";
import { checkField, maxBytes, topLevelCtx, type Validation } from "../src/rules";
import type { FieldSpec } from "../src/types";

const f = (extra: Partial<FieldSpec>): FieldSpec => ({
  id: "x", name: "x", type: "string", enabled: true, mode: "pick", values: ["a"], weights: [1], decimals: 0, coverage: 100, ...extra,
});
const check = (field: FieldSpec, eventProperty = false) => {
  const v: Validation = { errors: [], warnings: [] };
  checkField(field, topLevelCtx("Attribute", eventProperty), v);
  return v;
};

describe("checkField", () => {
  it("rejects bad nested keys and arrays of objects in event properties", () => {
    const obj = f({ name: "pets", type: "object_array", children: [f({ name: "bad key" })] });
    expect(check(obj).errors.join()).toMatch(/contains a space/);
    expect(check(obj, true).errors.join()).toMatch(/aren't supported in event properties/);
  });
  it("warns about arrays beyond 500 items and catches oversized values", () => {
    expect(check(f({ type: "array", maxItems: 600 })).warnings.join()).toMatch(/keeps 500/);
    const big = f({ type: "array", values: ["x".repeat(250)], maxItems: 450 });
    expect(maxBytes(big)).toBeGreaterThan(100 * 1024);
    expect(check(big).errors.join()).toMatch(/over Braze's 100 KB limit/);
  });
  it("rejects depth beyond 5", () => {
    let node = f({ name: "leaf" });
    for (let i = 0; i < 6; i++) node = f({ name: `l${i}`, type: "object", children: [node] });
    expect(check(node).errors.join()).toMatch(/deeper than 5/);
  });
  it("passes a valid field", () => {
    expect(check(f({}))).toEqual({ errors: [], warnings: [] });
  });
});
