// Smoke test for the pure logic that's cheap to exercise without a bundler or
// a browser: revision hashing, runtime body validators, and the date/URL/region
// helpers touched in the L05 fixes. Run with `npm test`.
//
// The "@/..." alias and the bundler-style JSON import in src/lib/data.ts are
// handled by ./alias-register.mjs (wired in via the `test` script).
import test from "node:test";
import assert from "node:assert/strict";
import { Circle } from "lucide-react";

import { hashRevision } from "../src/lib/revision.ts";
import {
  isObject,
  str,
  strMax,
  bool,
  num,
  optional,
  oneOf,
  badField,
} from "../src/lib/validate.ts";
import {
  formatDate,
  daysSince,
  toHref,
  regionOfLocation,
  resolveDemoUrl,
} from "../src/lib/data.ts";
import { stageIcon } from "../src/lib/stages.ts";

test("hashRevision is deterministic, 8 hex chars, order-sensitive", () => {
  assert.match(hashRevision("subject", "body"), /^[0-9a-f]{8}$/);
  assert.equal(hashRevision("a", "b"), hashRevision("a", "b"));
  assert.notEqual(hashRevision("a", "b"), hashRevision("b", "a"));
  // null / undefined coalesce to "" but the join separator still matters.
  assert.equal(hashRevision(null, "x"), hashRevision(undefined, "x"));
  assert.notEqual(hashRevision("", "x"), hashRevision("x", ""));
});

test("validate predicates", () => {
  assert.equal(isObject({}), true);
  assert.equal(isObject([]), false);
  assert.equal(isObject(null), false);
  assert.equal(str("x"), true);
  assert.equal(str(1), false);
  assert.equal(strMax("abc", 3), true);
  assert.equal(strMax("abcd", 3), false);
  assert.equal(bool(true), true);
  assert.equal(bool("true"), false);
  assert.equal(num(1.5), true);
  assert.equal(num(NaN), false);
  assert.equal(optional(undefined, str), true);
  assert.equal(optional(null, str), true);
  assert.equal(optional(2, str), false);
  assert.equal(oneOf("a", ["a", "b"]), true);
  assert.equal(oneOf("c", ["a", "b"]), false);
});

test("badField returns the first offending key or null", () => {
  const schema = { name: (v) => strMax(v, 10), count: num };
  assert.equal(badField({ name: "ok", count: 3 }, schema), null);
  assert.equal(badField({ name: 5, count: 3 }, schema), "name");
  assert.equal(badField({ name: "ok", count: "3" }, schema), "count");
});

test("formatDate parses date-only strings in UTC (no local shift)", () => {
  assert.equal(formatDate("2026-08-07"), "Aug 7, 2026");
  // Jan 1 must not slip to Dec 31 of the prior year west of GMT.
  assert.equal(formatDate("2026-01-01"), "Jan 1, 2026");
  assert.equal(formatDate(""), null);
  assert.equal(formatDate("not-a-date"), null);
});

test("daysSince is a non-negative integer or null", () => {
  assert.equal(daysSince(""), null);
  assert.equal(daysSince("garbage"), null);
  const d = daysSince("2000-01-01");
  assert.ok(Number.isInteger(d) && d > 0);
  assert.equal(daysSince("2999-01-01"), 0); // clamped, not negative
});

test("toHref allow-lists http(s) and rejects junk schemes", () => {
  assert.equal(toHref("example.com"), "https://example.com");
  assert.equal(toHref("example.com (broken)"), "https://example.com");
  assert.equal(toHref("https://x.io/path"), "https://x.io/path");
  assert.equal(toHref("  "), null);
  assert.equal(toHref(undefined), null);
  assert.equal(toHref("javascript:alert(1)"), null);
  assert.equal(toHref("ftp://host/file"), null);
});

test("regionOfLocation returns unknown for ambiguous/empty, not out-of-state", () => {
  assert.equal(regionOfLocation("Greenville, SC"), "upstate");
  assert.equal(regionOfLocation("Charleston, SC"), "sc");
  assert.equal(regionOfLocation("Portland, OR"), "out-of-state");
  assert.equal(regionOfLocation("Austin, Texas"), "out-of-state");
  assert.equal(regionOfLocation(""), "unknown");
  assert.equal(regionOfLocation(null), "unknown");
  assert.equal(regionOfLocation("Narnia"), "unknown");
});

test("resolveDemoUrl skips a blank demo.url and falls back to legacy demoUrl", () => {
  assert.equal(resolveDemoUrl({ demo: { url: "" }, demoUrl: "https://legacy.app" }), "https://legacy.app");
  assert.equal(resolveDemoUrl({ demo: { url: "  https://new.app  " } }), "https://new.app");
  assert.equal(resolveDemoUrl({}), null);
});

test("stageIcon resolves the fallback-registry aliases instead of a bare Circle", () => {
  for (const name of ["Send", "Message", "Dollar"]) {
    assert.notEqual(stageIcon(name), Circle, `${name} should map to a real icon`);
  }
  assert.equal(stageIcon("no-such-icon"), Circle);
});
