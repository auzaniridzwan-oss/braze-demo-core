import { describe, expect, it } from "vitest";
import { byteSize, dataPoints, getPath, jsonLiteralProblem, keyProblem, walkFields } from "../src/fields";
import type { FieldSpec } from "../src/types";

const leaf = (name: string, extra: Partial<FieldSpec> = {}): FieldSpec => ({
  id: name, name, type: "string", enabled: true, mode: "pick", values: ["a"], weights: [1], decimals: 0, coverage: 100, ...extra,
});

describe("keyProblem", () => {
  it("applies Braze key rules", () => {
    expect(keyProblem("tier")).toBeNull();
    expect(keyProblem("")).toBe("is empty");
    expect(keyProblem("a b")).toBe("contains a space");
    expect(keyProblem("a.b")).toBe("contains a dot");
    expect(keyProblem("$a")).toBe("contains $");
    expect(keyProblem("x".repeat(256))).toBe("is longer than 255 characters");
  });
});

describe("jsonLiteralProblem", () => {
  it("accepts objects and arrays of objects only", () => {
    expect(jsonLiteralProblem('{"a":1}')).toBeNull();
    expect(jsonLiteralProblem('[{"a":1},{"b":2}]')).toBeNull();
    expect(jsonLiteralProblem("[1,2]")).toMatch(/must be/);
    expect(jsonLiteralProblem("{bad")).not.toBeNull();
  });
});

describe("walkFields", () => {
  it("visits nested and array-of-object paths", () => {
    const tree = [leaf("loyalty", { type: "object", children: [leaf("tier")] }), leaf("pets", { type: "object_array", children: [leaf("type")] })];
    const paths: string[] = [];
    walkFields(tree, (_f, p) => paths.push(p));
    expect(paths).toEqual(["loyalty", "loyalty.tier", "pets", "pets[].type"]);
  });
});

describe("values", () => {
  const attrs = { loyalty: { tier: "gold", since: { $time: "2024-01-01" } }, pets: [{ type: "dog" }, { type: "cat" }], tags: ["a", "b"] };
  it("reads paths with any-item fan-out and unwraps $time", () => {
    expect(getPath(attrs, "loyalty.tier")).toEqual(["gold"]);
    expect(getPath(attrs, "loyalty.since")).toEqual(["2024-01-01"]);
    expect(getPath(attrs, "pets[].type")).toEqual(["dog", "cat"]);
    expect(getPath(attrs, "missing.x")).toEqual([]);
  });
  it("counts data points and bytes", () => {
    expect(dataPoints(attrs.loyalty)).toBe(2);
    expect(dataPoints(attrs.pets)).toBe(2);
    expect(dataPoints(attrs.tags)).toBe(1);
    expect(byteSize({ a: "é" })).toBe(10);
  });
});
