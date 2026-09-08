/**
 * Deterministic, client-safe revision hashing for approval binding (H06).
 *
 * `hashRevision` MUST produce identical output in Node and the browser: it uses
 * only arithmetic over `charCodeAt` (UTF-16 code units) — no crypto, no Date,
 * no Buffer/atob. The panel hashes what the reviewer saw; the approval route
 * re-hashes the current artifact inside the atomic mutation and rejects the
 * write (HTTP 409) if they diverge.
 *
 * Algorithm: FNV-1a, 32-bit, over UTF-16 code units, joined on U+0000, returned
 * as 8 lowercase hex chars. `Math.imul` keeps the multiply in 32-bit space on
 * every engine.
 */
export function hashRevision(...parts: (string | undefined | null)[]): string {
  const joined = parts.map((p) => p ?? "").join("\u0000");
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < joined.length; i++) {
    hash ^= joined.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
