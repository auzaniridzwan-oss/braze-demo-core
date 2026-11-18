// Field and value types shared by the Braze demo apps.

export type LeafType = "string" | "number" | "boolean" | "date";
/**
 * Leaves plus composite types:
 * - array: array of primitives drawn from `values`
 * - object: nested object built from `children`
 * - object_array: array of objects, each built from `children`
 * - json: a literal JSON value picked from `values`
 */
export type DataType = LeafType | "array" | "object" | "object_array" | "json";
export type ValueMode = "pick" | "range";

export const COMPOSITE_TYPES: DataType[] = ["array", "object", "object_array", "json"];
export const MAX_DEPTH = 5;

/** A custom attribute, standard-attribute override, or event property. */
export interface FieldSpec {
  id: string;
  name: string;
  type: DataType;
  enabled: boolean;
  mode: ValueMode;
  /** Listed values (raw strings) used in "pick" mode. */
  values: string[];
  /** Relative weight per listed value (same length as values). */
  weights: number[];
  /** Range bounds: numbers for "number", ISO dates (YYYY-MM-DD) for "date". */
  min?: string;
  max?: string;
  /** Decimal places for number ranges (0 = integer). */
  decimals: number;
  /** % of users (or event occurrences) that get this field, 0-100. */
  coverage: number;
  /** array: element type. */
  itemType?: "string" | "number";
  /** array / object_array: number of items per user. */
  minItems?: number;
  maxItems?: number;
  /** array: no repeated items (default true). */
  unique?: boolean;
  /** object / object_array: sub-fields (recursive). */
  children?: FieldSpec[];
  /** object_array: optional field set to 1..k on each item. */
  idKey?: string;
}

/** Any value Braze stores on a profile: primitives, arrays, objects and arrays of objects. */
export type AttrValue = string | number | boolean | null | AttrValue[] | { [key: string]: AttrValue };
