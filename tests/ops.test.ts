import { describe, expect, it } from "vitest";
import { applyAttributeObjects, detectIdentifierKey, planAttributeUpdate, valueProblems } from "../src/braze/ops";
import type { AttrValue } from "../src/types";

type P = Record<string, AttrValue>;
const ID = { identifier: { external_id: "u1" } };
const plan = (a: P, b: P, extra = {}) => planAttributeUpdate(a, b, { ...ID, ...extra });
/** The plan must turn `a` into exactly `b`. */
const roundTrip = (a: P, b: P, extra = {}) => {
  const p = plan(a, b, extra);
  expect(applyAttributeObjects(a, p.attributes)).toEqual(b);
  return p;
};

describe("planAttributeUpdate: one case per row of the build plan", () => {
  it("no change → nothing to send", () => {
    expect(plan({ a: 1, o: { x: 1 } }, { a: 1, o: { x: 1 } }).attributes).toEqual([]);
  });

  it("edit one leaf in a nested object → partial object with _merge_objects", () => {
    const a = { loyalty: { tier: "silver", points: 10, since: { $time: "2024-01-01" } } };
    const b = { loyalty: { tier: "gold", points: 10, since: { $time: "2024-01-01" } } };
    const p = roundTrip(a, b);
    expect(p.attributes).toEqual([{ external_id: "u1", loyalty: { tier: "gold" }, _merge_objects: true }]);
    expect(p.changes[0].kind).toBe("merge");
  });

  it("deep edits merge only the changed branch", () => {
    const a = { o: { x: { y: 1, z: 2 }, k: "same" } };
    const b = { o: { x: { y: 5, z: 2 }, k: "same", added: true } };
    const p = roundTrip(a, b);
    expect(p.attributes[0]).toEqual({ external_id: "u1", o: { x: { y: 5 }, added: true }, _merge_objects: true });
  });

  it("remove a key from a nested object → full replace, kept apart from merges", () => {
    const a = { o: { x: 1, y: 2 }, m: { a: 1 } };
    const b = { o: { x: 1 }, m: { a: 2 } };
    const p = roundTrip(a, b);
    expect(p.attributes).toEqual([
      { external_id: "u1", o: { x: 1 } },
      { external_id: "u1", m: { a: 2 }, _merge_objects: true },
    ]);
    expect(p.changes.find((c) => c.key === "o")?.note).toMatch(/can't delete a single key/);
  });

  it("add / remove items in a plain array → add/remove operators", () => {
    const p = roundTrip({ tags: ["a", "b", "c"] }, { tags: ["a", "c", "d"] });
    expect(p.attributes).toEqual([{ external_id: "u1", tags: { add: ["d"], remove: ["b"] } }]);
  });

  it("reordered array → full replace", () => {
    const p = roundTrip({ tags: ["a", "b"] }, { tags: ["b", "a"] });
    expect(p.attributes).toEqual([{ external_id: "u1", tags: ["b", "a"] }]);
    expect(p.changes[0].kind).toBe("replace_array");
  });

  it("array of objects with an id key → $remove, $update, $add", () => {
    const a = { pets: [{ id: 1, type: "dog", name: "Mochi" }, { id: 2, type: "cat", name: "Pixel" }] };
    const b = { pets: [{ id: 1, type: "dog", name: "Mochi II" }, { id: 3, type: "fish", name: "Bun" }] };
    const p = roundTrip(a, b);
    expect(p.attributes).toEqual([
      { external_id: "u1", pets: { $remove: [{ $identifier_key: "id", $identifier_value: 2 }] } },
      { external_id: "u1", pets: { $update: [{ $identifier_key: "id", $identifier_value: 1, $new_object: { name: "Mochi II" } }] }, _merge_objects: true },
      { external_id: "u1", pets: { $add: [{ id: 3, type: "fish", name: "Bun" }] } },
    ]);
  });

  it("array of objects item that lost a key → removed and re-added", () => {
    const a = { pets: [{ id: 1, type: "dog", name: "Mochi" }] };
    const b = { pets: [{ id: 1, type: "dog" }] };
    const p = roundTrip(a, b);
    expect(p.attributes.map((o) => Object.keys(o.pets as object)[0])).toEqual(["$remove", "$add"]);
  });

  it("array of objects without a stable key → full replace with a warning", () => {
    const a = { pets: [{ type: "dog" }, { type: "dog" }] };
    const b = { pets: [{ type: "dog" }, { type: "cat" }] };
    const p = roundTrip(a, b);
    expect(p.attributes).toEqual([{ external_id: "u1", pets: b.pets }]);
    expect(p.warnings.join()).toMatch(/whole array of objects replaced/);
  });

  it("delete an attribute → null at top level", () => {
    const p = roundTrip({ a: 1, o: { x: 1 } }, { a: 1 });
    expect(p.attributes).toEqual([{ external_id: "u1", o: null }]);
  });

  it("dates inside objects pass through as {$time}", () => {
    const p = roundTrip({ o: { d: { $time: "2024-01-01" } } }, { o: { d: { $time: "2025-02-02" } } });
    expect(p.attributes[0]).toEqual({ external_id: "u1", o: { d: { $time: "2025-02-02" } }, _merge_objects: true });
  });

  it("primitive and type changes set the value", () => {
    roundTrip({ a: "1", b: true, c: [1] }, { a: 1, b: false, c: { now: "object" } });
  });

  it("forceReplace and updateExistingOnly", () => {
    const p = plan({ o: { x: 1 } }, { o: { x: 2 } }, { forceReplace: ["o"], updateExistingOnly: true });
    expect(p.attributes).toEqual([{ external_id: "u1", _update_existing_only: true, o: { x: 2 } }]);
  });
});

describe("validation of values sent to Braze", () => {
  it("rejects null inside objects and bad keys, warns on long arrays", () => {
    expect(valueProblems("o", { a: null }).errors.join()).toMatch(/null isn't allowed/);
    expect(valueProblems("o", { "a.b": 1 }).errors.join()).toMatch(/contains a dot/);
    expect(valueProblems("t", Array.from({ length: 501 }, (_, i) => i)).warnings.join()).toMatch(/keeps 500/);
    expect(valueProblems("big", { s: "x".repeat(101 * 1024) }).errors.join()).toMatch(/100 KB/);
    expect(plan({}, { o: { a: null } }).errors).toHaveLength(1);
  });
});

describe("detectIdentifierKey", () => {
  it("prefers id, then *_id, and needs unique values", () => {
    expect(detectIdentifierKey([{ id: 1, pet_id: "a" }, { id: 2, pet_id: "b" }])).toBe("id");
    expect(detectIdentifierKey([{ pet_id: "a", n: 1 }, { pet_id: "b", n: 1 }])).toBe("pet_id");
    expect(detectIdentifierKey([{ id: 1 }, { id: 1 }])).toBeNull();
    expect(detectIdentifierKey([{ name: "a" }])).toBeNull();
  });
});

describe("round trip on random edits", () => {
  it("always reproduces the edited profile", () => {
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
    for (let n = 0; n < 300; n++) {
      const pets = [1, 2, 3, 4].filter(() => rnd() > 0.4).map((id) => ({ id, type: pick(["dog", "cat"]), ...(rnd() > 0.5 ? { name: pick(["A", "B"]) } : {}) }));
      const mk = (): P => ({
        tier: pick(["gold", "silver"]),
        tags: ["a", "b", "c", "d"].filter(() => rnd() > 0.5),
        loyalty: { points: pick([1, 2]), ...(rnd() > 0.5 ? { tier: pick(["x", "y"]) } : {}), nested: { deep: pick([true, false]) } },
        pets: rnd() > 0.2 ? pets.map((p) => ({ ...p, type: pick(["dog", "cat"]) })) : pets,
        ...(rnd() > 0.5 ? { maybe: 1 } : {}),
      });
      roundTrip(mk(), mk());
    }
  });
});
