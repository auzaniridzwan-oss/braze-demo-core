import { describe, expect, it } from "vitest";
import { localizeIdentity, mobileNumber, renderEmail } from "../src/identity";
import { LOCALES, LOCALE_MAP } from "../src/locales";
import { createRng } from "../src/rng";

describe("locales", () => {
  it("has 13 packs, each with a currency and valid weights", () => {
    expect(LOCALES).toHaveLength(13);
    for (const l of LOCALES) {
      expect(l.currency).toMatch(/^[A-Z]{3}$/);
      expect(l.cities.length).toBeGreaterThan(0);
      expect(l.names.male.length && l.names.female.length && l.names.last.length).toBeTruthy();
    }
  });
});

describe("localizeIdentity", () => {
  it("is deterministic per seed", () => {
    expect(localizeIdentity("VN", createRng(1, "x"))).toEqual(localizeIdentity("VN", createRng(1, "x")));
    expect(localizeIdentity("VN", createRng(1, "x"))).not.toEqual(localizeIdentity("VN", createRng(2, "x")));
  });
  it("gives a consistent identity for every locale", () => {
    for (const l of LOCALES) {
      for (let s = 0; s < 20; s++) {
        const id = localizeIdentity(l.code, createRng(s, l.code), { gender: "F", emailDomain: "demo.test" });
        expect(id.country).toBe(l.country);
        expect(id.language).toBe(l.language);
        expect(id.currency).toBe(l.currency);
        expect(l.names.female).toContain(id.first_name);
        expect(l.cities.map((c) => c.name)).toContain(id.home_city);
        expect(id.phone).toMatch(new RegExp(`^\\+${l.dialCode}\\d{7,12}$`));
        expect(id.email).toMatch(/^[a-z0-9.]+@demo\.test$/);
        expect(id.time_zone).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+$/);
      }
    }
  });
  it("throws for unknown locales", () => {
    expect(() => localizeIdentity("XX", createRng(1, 1))).toThrow(/Unknown locale/);
  });
});

describe("renderEmail / mobileNumber", () => {
  it("transliterates names and fills tokens", () => {
    const rng = createRng(1, 1);
    expect(renderEmail("{first}.{last}@{domain}", "x.com", "Đức", "Nguyễn", "ID_1", 1, rng)).toBe("duc.nguyen@x.com");
    expect(renderEmail("{id}+{n}@{domain}", "x.com", "", "", "ID_1", 7, rng)).toBe("id_1+7@x.com");
    expect(renderEmail("{first}{nnn}@{domain}", "x.com", "A", "B", "", 0, rng)).toMatch(/^a\d{3}@x\.com$/);
  });
  it("uses the locale's dial code", () => {
    expect(mobileNumber(LOCALE_MAP.SG, createRng(1, 1))).toMatch(/^\+65[89]\d{7}$/);
  });
});
