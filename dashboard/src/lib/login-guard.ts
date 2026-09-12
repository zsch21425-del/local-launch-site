/**
 * Durable, account-wide login lockout (fixes the per-instance rate-limiter gap).
 *
 * The old limiter was an in-memory Map per serverless instance — useless across
 * instances and across cold starts. A 4-digit PIN is only ~10k combinations, so
 * an attacker spreading requests across instances could brute-force it in
 * minutes.
 *
 * This replaces it with a GLOBAL failed-attempt budget stored in a dedicated
 * Vercel Blob key (`login-guard.json`) written with optimistic concurrency
 * (ifMatch), so it is shared across every instance. After MAX_ATTEMPTS failed
 * attempts the whole account locks for an escalating duration — which turns
 * brute-force from "minutes" into "impossible" (10k PINs × 15min lockout each).
 *
 * Tradeoff (accepted): an attacker CAN lock Zach out by burning 10 bad PINs.
 * That is deliberate — a short lockout beats an account takeover. Zach can clear
 * it by waiting out the lock (successful login resets the counter).
 */

import { put, get, BlobPreconditionFailedError } from "@vercel/blob";

const BLOB_PATH = "login-guard.json";
const MAX_ATTEMPTS = 10;
// Escalating lock durations: 15 min, 1 hour, 6 hours, then repeat the last.
const LOCK_STEPS_MS = [15 * 60 * 1000, 60 * 60 * 1000, 6 * 60 * 60 * 1000];

interface GuardState {
  fails: number;
  lockStep: number; // index into LOCK_STEPS_MS
  lockedUntil: number;
}

function getToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || undefined;
}

async function readBlobStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(buf);
}

async function readGuard(): Promise<{ state: GuardState; etag: string | null }> {
  const token = getToken();
  if (!token) return { state: { fails: 0, lockStep: 0, lockedUntil: 0 }, etag: null };
  try {
    const res = await get(BLOB_PATH, { access: "private", token, useCache: false });
    if (!res || !res.stream) return { state: { fails: 0, lockStep: 0, lockedUntil: 0 }, etag: null };
    const text = await readBlobStream(res.stream);
    const state = JSON.parse(text) as GuardState;
    const strongEtag = (res.blob?.etag ?? "").replace(/^W\//, "");
    return { state, etag: strongEtag || null };
  } catch {
    // Missing or garbled → treat as clean slate (fail open for the counter;
    // the DASHBOARD_TOKEN check still gates actual auth).
    return { state: { fails: 0, lockStep: 0, lockedUntil: 0 }, etag: null };
  }
}

async function writeGuard(
  state: GuardState,
  etag: string | null,
): Promise<{ ok: boolean; conflict: boolean }> {
  const token = getToken();
  if (!token) return { ok: true, conflict: false }; // local-only: skip durable guard
  try {
    await put(BLOB_PATH, JSON.stringify(state), {
      access: "private",
      allowOverwrite: true,
      token,
      ...(etag ? { ifMatch: etag } : {}),
    });
    return { ok: true, conflict: false };
  } catch (e: any) {
    const conflict =
      e instanceof BlobPreconditionFailedError ||
      e?.name === "BlobPreconditionFailedError" ||
      e?.statusCode === 412;
    return { ok: false, conflict: !!conflict };
  }
}

/** Retry a read-modify-write of the guard state up to N times on CAS conflict. */
async function mutateGuard(
  fn: (s: GuardState) => GuardState,
): Promise<GuardState> {
  for (let i = 0; i < 5; i++) {
    const { state, etag } = await readGuard();
    const next = fn(state);
    const w = await writeGuard(next, etag);
    if (w.ok) return next;
    if (!w.conflict) return next; // non-conflict error → best-effort, return next
  }
  // Couldn't commit after retries — return the last computed state (best-effort).
  const { state } = await readGuard();
  return state;
}

/**
 * Record a failed attempt. Returns "locked" if the account is (now) locked,
 * otherwise "allow".
 */
export async function recordFailure(): Promise<"allow" | "locked"> {
  const now = Date.now();
  const next = await mutateGuard((s) => {
    // If currently locked, keep the lock (and don't extend it — that's enough).
    if (now < s.lockedUntil) return s;
    const fails = s.fails + 1;
    if (fails < MAX_ATTEMPTS) return { ...s, fails };
    // Hit the budget → lock out, escalate the duration, reset the counter.
    const step = Math.min(s.lockStep, LOCK_STEPS_MS.length - 1);
    const lockedUntil = now + LOCK_STEPS_MS[step];
    return { fails: 0, lockStep: Math.min(step + 1, LOCK_STEPS_MS.length - 1), lockedUntil };
  });
  return now < next.lockedUntil ? "locked" : "allow";
}

/** True when the account is currently locked out. */
export async function isLocked(): Promise<boolean> {
  const { state } = await readGuard();
  return Date.now() < state.lockedUntil;
}

/** Clear the counter + lock on a successful login. */
export async function recordSuccess(): Promise<void> {
  await mutateGuard(() => ({ fails: 0, lockStep: 0, lockedUntil: 0 }));
}
