/**
 * Tiny runtime JSON-body validation (M06).
 *
 * `await request.json()` is wrapped in try/catch in every route, but a body that
 * parses fine yet has the wrong shape — `null`, a numeric `message`, an
 * object-valued `feedback` — slips past the catch and blows up later on
 * destructuring / `.trim()`, OUTSIDE the handler → an uncaught 500 instead of a
 * useful 400. TypeScript `as { ... }` assertions do nothing at runtime.
 *
 * These are pure, dependency-free predicates. Routes run `badField(body, schema)`
 * BEFORE destructuring and return `400 { error, field }` on the first failure.
 */

/** Plain non-null object (rejects arrays). */
export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** `typeof v === "string"`. */
export function str(v: unknown): boolean {
  return typeof v === "string";
}

/** String no longer than `n` characters. */
export function strMax(v: unknown, n: number): boolean {
  return typeof v === "string" && v.length <= n;
}

/** Strict boolean — rejects truthy strings like `"true"`. */
export function bool(v: unknown): boolean {
  return typeof v === "boolean";
}

/** Finite number. */
export function num(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v);
}

/** `v` is absent (`null`/`undefined`) or passes `fn`. */
export function optional(v: unknown, fn: (v: unknown) => boolean): boolean {
  return v == null || fn(v);
}

/** `v` is one of `list`. */
export function oneOf<T>(v: unknown, list: readonly T[]): boolean {
  return list.includes(v as T);
}

export type Validator = (v: unknown) => boolean;
export type BodySchema = Record<string, Validator>;

/**
 * Returns the name of the first field in `schema` whose validator rejects the
 * corresponding value on `body`, or `null` if every field passes. `body` MUST
 * already be a plain object (check with `isObject` first).
 */
export function badField(
  body: Record<string, unknown>,
  schema: BodySchema,
): string | null {
  for (const [field, fn] of Object.entries(schema)) {
    if (!fn(body[field])) return field;
  }
  return null;
}
