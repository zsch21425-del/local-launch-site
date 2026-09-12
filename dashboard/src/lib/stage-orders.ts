/**
 * Stage work-orders + run-bound completion capabilities (the "approve → run →
 * evidence → advance" model, replacing autonomous orchestration).
 *
 * Design authority: Astra simplify pass (Sep 11 2026). The model:
 *   - Zach (PIN-auth) is the ONLY approver. He triggers a "run" and later an
 *     "advance". He never delegates stage-transition or approval authority.
 *   - Hermes (local) does the work + double-checks, then submits EVIDENCE via a
 *     short-lived, run-bound capability token. That token lets Hermes submit
 *     evidence for ONE company + ONE stage + ONE revision — never advance a
 *     stage, never approve, never touch another company.
 *   - The dashboard is the ONLY writer of stage transitions, and it re-verifies
 *     the gates atomically at Zach's "advance" click.
 *
 * The capability is a signed token (HMAC) so it can be validated server-side
 * without a shared principal hierarchy. The secret is server-only.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SECRET = process.env.STAGE_RUN_SECRET || "";
const CAP_TTL_MS = 1000 * 60 * 60 * 24; // 24h

/** The single work-order shape the dashboard sends to Hermes. */
export interface StageWorkOrder {
  runId: string;
  companyId: string;
  stage: string; // the stage whose exit-work is being done (e.g. "audit")
  inputRevision: string; // content hash of the company at dispatch (freeze inputs)
  operation: "audit" | "build-demo" | "write-pitch" | "quality-check" | "monthly-seo";
  requiredChecks: string[]; // e.g. ["visual-8.5", "blind-critic-9.5", "six-pass-audit"]
  callbackUrl: string; // where Hermes POSTs completion evidence
  requestedAt: string;
}

/** A signed, run-bound completion capability. */
export interface CompletionCapability {
  runId: string;
  companyId: string;
  stage: string;
  inputRevision: string;
  expiresAt: number;
  signature: string;
}

/** The evidence Hermes submits on completion (validated strictly). */
export interface StageResultEvidence {
  runId: string;
  companyId: string;
  stage: string;
  status: "completed" | "failed";
  resultDigest: string; // content hash of the produced artifact
  artifacts?: {
    kind: "demo" | "pitch" | "audit" | "seo";
    version: number;
    contentHash: string;
    location: string;
  }[];
  attestations?: {
    reviewerRole: "ux" | "product" | "security" | "visual" | "audit";
    reviewerId: string;
    blind: boolean;
    scores: Record<string, number>;
    verdict: "pass" | "fail";
    notes: string;
    artifactHash: string;
  }[];
  error?: string;
}

function sign(data: string): string {
  if (!SECRET) return "";
  return createHmac("sha256", SECRET).update(data).digest("hex");
}

function verifySignature(data: string, sig: string): boolean {
  if (!SECRET || !sig) return false;
  const expected = sign(data);
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}

/** Issue a run-bound capability so Hermes can submit evidence (and only that). */
export function issueCompletionCapability(
  runId: string,
  companyId: string,
  stage: string,
  inputRevision: string,
): CompletionCapability | null {
  if (!SECRET) return null;
  const expiresAt = Date.now() + CAP_TTL_MS;
  const payload = `${runId}|${companyId}|${stage}|${inputRevision}|${expiresAt}`;
  return { runId, companyId, stage, inputRevision, expiresAt, signature: sign(payload) };
}

/** Validate a capability against its claimed scope. */
export function validateCompletionCapability(
  cap: Partial<CompletionCapability> | null | undefined,
  expected: { runId: string; companyId: string; stage: string; inputRevision: string },
): boolean {
  if (!cap || !SECRET) return false;
  if (cap.runId !== expected.runId) return false;
  if (cap.companyId !== expected.companyId) return false;
  if (cap.stage !== expected.stage) return false;
  if (cap.inputRevision !== expected.inputRevision) return false;
  if (typeof cap.expiresAt !== "number" || cap.expiresAt < Date.now()) return false;
  const payload = `${cap.runId}|${cap.companyId}|${cap.stage}|${cap.inputRevision}|${cap.expiresAt}`;
  return verifySignature(payload, cap.signature ?? "");
}

/** New run id. */
export function newRunId(): string {
  return `run-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

/**
 * Deterministic input-revision hash for a company (freeze the inputs a work
 * order was dispatched against). This is NOT a security boundary — it's for
 * detecting staleness — so a stable, non-cryptographic hash is fine.
 */
export function hashCompanyInputs(c: any): string {
  const stable = {
    id: c?.id,
    name: c?.name,
    stage: c?.stage,
    website: c?.website,
    email: c?.email,
    phone: c?.phone,
    offer: c?.offer,
    ownerName: c?.ownerName,
    pitchBody: String(c?.pitchDraft?.body ?? "").slice(0, 2000),
    demoUrl: c?.demo?.url ?? c?.demoUrl ?? "",
  };
  return createHmac("sha256", SECRET || "no-secret")
    .update(JSON.stringify(stable))
    .digest("hex")
    .slice(0, 16);
}
