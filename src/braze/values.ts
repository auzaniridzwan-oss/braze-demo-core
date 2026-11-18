// Braze value helpers: dates inside objects must be sent as {"$time": "..."}.

import type { AttrValue } from "../types";

export type TimeValue = { $time: string };

export function timeValue(isoDate: string): TimeValue {
  return { $time: isoDate };
}

export function isTimeValue(v: unknown): v is TimeValue {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "$time" in v;
}

/** The date string of a {"$time"} value; other values unchanged. */
export function unwrapTime<T extends AttrValue>(v: T): T | string {
  return isTimeValue(v) ? String(v.$time) : v;
}

export function isPlainObject(v: unknown): v is { [key: string]: AttrValue } {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
