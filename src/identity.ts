// Locale-aware identity pieces (names, city, email, phone) shared by bulk generation and
// single-profile localization. Each helper draws from the given Rng in a fixed order, so
// callers that use the same order get the same values for the same seed.

import { LOCALE_MAP, type City, type LocalePack } from "./locales";
import type { Rng } from "./rng";
import { toAscii } from "./text";

export type Gender = "M" | "F" | "O";
export interface NameLists { male: string[]; female: string[]; last: string[] }

export const DEFAULT_EMAIL_TEMPLATE = "{first}.{last}{nn}@{domain}";

/** First and last name for a gender; "O" picks from either list. Draws: [chance], pick, pick. */
export function pickName(names: NameLists, gender: Gender, rng: Rng): { first: string; last: string } {
  const firstPool = gender === "M" ? names.male : gender === "F" ? names.female : rng.chance(50) ? names.male : names.female;
  const first = rng.pick(firstPool);
  const last = rng.pick(names.last);
  return { first, last };
}

/** Weighted city from the locale pack. Draws: weighted. */
export function pickCity(locale: LocalePack, rng: Rng): City {
  return rng.weighted(locale.cities, locale.cities.map((c) => c.weight));
}

/**
 * Email from a template. Tokens: {first} {last} {f} {id} {n} {domain}, and {nn…} for random digits.
 * Names are transliterated to ASCII.
 */
export function renderEmail(template: string, domain: string, first: string, last: string, externalId: string, n: number, rng: Rng): string {
  const out = template
    .replace(/\{first\}/g, toAscii(first))
    .replace(/\{last\}/g, toAscii(last))
    .replace(/\{f\}/g, toAscii(first).slice(0, 1))
    .replace(/\{id\}/g, externalId.toLowerCase())
    .replace(/\{n\}/g, String(n))
    .replace(/\{(n+)\}/g, (_, ns: string) => String(rng.int(0, 10 ** ns.length - 1)).padStart(ns.length, "0"))
    .replace(/\{domain\}/g, domain);
  return out.replace(/\.{2,}/g, ".").replace(/\.@/, "@").replace(/^\./, "");
}

/** E.164 mobile number with a realistic prefix for the locale. */
export function mobileNumber(locale: LocalePack, rng: Rng): string {
  let digits = String(rng.int(2, 9));
  for (let i = 1; i < locale.subscriberDigits; i++) digits += String(rng.int(0, 9));
  return `+${locale.dialCode}${rng.pick(locale.mobilePrefixes)}${digits}`;
}

/** Standard Braze attributes that localization sets. */
export interface LocalizedIdentity {
  first_name: string;
  last_name: string;
  gender: Gender;
  email: string;
  phone: string;
  home_city: string;
  country: string;
  language: string;
  time_zone: string;
  /** Not a Braze standard attribute; offered for mapping to a custom attribute. */
  currency: string;
}

export interface LocalizeOptions {
  /** Gender to keep; when omitted one is drawn 50/50 from M/F. */
  gender?: Gender;
  /** Email domain to use (default example.com). */
  emailDomain?: string;
  emailTemplate?: string;
  externalId?: string;
  /** Replaces the locale pack's name lists. */
  names?: NameLists;
}

/** A complete, consistent identity for one locale. Throws for an unknown locale code. */
export function localizeIdentity(localeCode: string, rng: Rng, opts: LocalizeOptions = {}): LocalizedIdentity {
  const locale = LOCALE_MAP[localeCode];
  if (!locale) throw new Error(`Unknown locale "${localeCode}"`);
  const gender: Gender = opts.gender ?? rng.weighted<Gender>(["M", "F"], [1, 1]);
  const { first, last } = pickName(opts.names ?? locale.names, gender, rng);
  const city = pickCity(locale, rng);
  const email = renderEmail(
    opts.emailTemplate ?? DEFAULT_EMAIL_TEMPLATE, opts.emailDomain ?? "example.com",
    first, last, opts.externalId ?? "", 0, rng,
  );
  return {
    first_name: first,
    last_name: last,
    gender,
    email,
    phone: mobileNumber(locale, rng),
    home_city: city.name,
    country: locale.country,
    language: locale.language,
    time_zone: city.tz ?? locale.timeZone,
    currency: locale.currency,
  };
}
