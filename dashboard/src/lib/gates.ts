/**
 * Stage-transition policy + gate evaluator (the "hard rules" in code).
 *
 * This is the SINGLE source of truth for what it takes to legally advance a
 * company from one funnel stage to the next. Every mutation path — the batch
 * button, POST /api/pipeline/move, and the autonomous proposal executor —
 * MUST consult `evaluateTransition()` before writing a stage. Auth + ETag
 * alone do not enforce workflow correctness; these gates do.
 *
 * Design authority: `references/autonomous-work-and-gates.md` (Astra, Sep 11 2026).
 *
 * Two tiers, per Astra:
 *  - CHEAP gates (below): deterministic, serverless-safe, run on EVERY action.
 *  - DELIVERABLE gates (9.5 critic / 8.5 visual / blind critic / 6-pass audit):
 *    those run on the Supervisor/workers (they have vision + fresh-context
 *    reviewer jobs); their OUTPUT lands here as evidence fields, and the
 *    deterministic evaluator only checks that the evidence EXISTS and is
 *    consistent — it never re-runs the subjective review.
 */

export const FUNNEL_ORDER = [
  "prospect",
  "audit",
  "pitch",
  "quality-check",
  "approval",
  "outreach",
  "follow-up",
] as const;

export type FunnelStage = (typeof FUNNEL_ORDER)[number];

/** Terminal stage (won clients) — not part of the forward funnel order. */
export const TERMINAL_STAGE = "sale";

export interface TransitionResult {
  ok: boolean;
  /** Reason a legal forward move is blocked (missing evidence / wrong source). */
  error?: string;
  /** Human-readable list of what evidence is still missing. */
  missing?: string[];
}

/**
 * Deterministic evidence check for ONE company moving from its current stage
 * to `toStage`. `toStage` MUST be the immediate next stage in FUNNEL_ORDER
 * (forward-only) — callers check adjacency separately or rely on this returning
 * a clear error for non-adjacent targets.
 */
export function evaluateTransition(c: any, toStage: string): TransitionResult {
  const from = c?.stage;
  const fromIdx = FUNNEL_ORDER.indexOf(from);
  const toIdx = FUNNEL_ORDER.indexOf(toStage as FunnelStage);

  if (fromIdx === -1) {
    return {
      ok: false,
      error: `cannot advance from non-funnel stage "${from}"`,
    };
  }
  if (toIdx === -1) {
    return { ok: false, error: `not a funnel stage: "${toStage}"` };
  }
  if (toIdx !== fromIdx + 1) {
    return {
      ok: false,
      error: `expected next stage "${FUNNEL_ORDER[fromIdx + 1]}", got "${toStage}"`,
    };
  }

  const missing: string[] = [];
  const demoUrl = String(c?.demo?.url ?? c?.demoUrl ?? "").trim();
  const pitchBody = String(c?.pitchDraft?.body ?? "").trim();
  const pitchStatus = c?.pitchDraft?.status;
  const demoStatus = c?.demo?.status;
  const zachApproval = c?.zachApproval;
  const auditData = c?.auditData;

  // Terminal transition: follow-up → sale (won). This is NOT a funnel-adjacency
  // move (sale is outside FUNNEL_ORDER), so it must be handled explicitly.
  if (toStage === TERMINAL_STAGE) {
    if (from !== "follow-up") {
      return { ok: false, error: `can only enter ${TERMINAL_STAGE} (Clients) from follow-up` };
    }
    // Won evidence must be a real, positive monetary amount — not an empty
    // string, false, zero, or arbitrary text (Astra recheck).
    const mrr = c?.revenue?.mrr;
    const oneTime = c?.revenue?.oneTime;
    const saleValue = c?.saleValue;
    const hasMrr = typeof mrr === "number" && mrr > 0;
    const hasOneTime = typeof oneTime === "number" && oneTime > 0;
    const hasSale = typeof saleValue === "number" && saleValue > 0;
    if (!(hasMrr || hasOneTime || hasSale)) {
      return {
        ok: false,
        error: "missing evidence to advance follow-up → sale",
        missing: ["won evidence (positive revenue.mrr / revenue.oneTime / saleValue)"],
      };
    }
    return { ok: true };
  }

  // Per-transition evidence. Each gate is what the WORK must have produced —
  // the gate evaluator only verifies the evidence landed, it does not re-do
  // the work.
  switch (toStage) {
    case "audit":
      // Entering audit = "start gathering everything." No prior evidence needed.
      return { ok: true };

    case "pitch":
      // Audit → Pitch requires the audit deliverable: gathered business info.
      // A mere `{}` does not demonstrate a completed audit — require at least
      // one populated field (issues/competitors/gScore/topFixes).
      const hasAudit =
        auditData &&
        typeof auditData === "object" &&
        (Array.isArray(auditData.issues) && auditData.issues.length > 0 ||
          Array.isArray(auditData.competitors) && auditData.competitors.length > 0 ||
          typeof auditData.gScore === "number" ||
          Array.isArray(auditData.topFixes) && auditData.topFixes.length > 0);
      if (!hasAudit) {
        missing.push("audit data (website/contact/competitors gathered)");
      }
      break;

    case "quality-check":
      // Pitch → Quality check: demo + pitch must both exist (built TOGETHER).
      if (!demoUrl) missing.push("demo built (demo.url)");
      if (!pitchBody) missing.push("pitch draft written (pitchDraft.body)");
      break;

    case "approval":
      // Quality check → Approval: demo approved AND pitch reviewer-approved
      // (the deliverable gates — visual 8.5 + critic 9.5 — passed upstream).
      if (demoStatus !== "approved") missing.push("demo approved (visual QA passed)");
      if (pitchStatus !== "supervisor-approved" && pitchStatus !== "zach-approved") {
        missing.push("pitch reviewer-approved (critic passed)");
      }
      break;

    case "outreach":
      // Approval → Outreach: Zach's explicit sign-off on the exact artifacts.
      if (zachApproval !== "approved" && pitchStatus !== "zach-approved") {
        missing.push("Zach's approval");
      }
      break;

    case "follow-up":
      // Outreach → Follow up: a confirmed send exists (not just a drafted pitch).
      // `responseStatus` presence is too loose — only a QUALIFYING terminal
      // enum counts (sent, replied, won, bounced, opted-out). Default/negative/
      // unrelated values do not prove a send happened.
      const qualifyingResponses = ["sent", "replied", "reply", "won", "bounced", "opted-out", "opt-out", "unsubscribed"];
      const rs = String(c?.responseStatus ?? "").toLowerCase();
      const hasSend = pitchStatus === "sent" || qualifyingResponses.includes(rs);
      if (!hasSend) {
        missing.push("confirmed send (pitch sent / qualifying response recorded)");
      }
      break;

    default:
      return { ok: false, error: `no transition policy for "${toStage}"` };
  }

  if (missing.length) {
    return {
      ok: false,
      error: `missing evidence to advance ${from} → ${toStage}`,
      missing,
    };
  }
  return { ok: true };
}

/**
 * What a stage needs to produce before its occupants may advance. Used to tell
 * the worker (via proposal/relay) what to DO, and to tell Zach what's missing.
 */
export const STAGE_EXIT_REQUIREMENTS: Record<FunnelStage, string[]> = {
  prospect: ["none — any prospect may be selected to begin audit work"],
  audit: ["gather website / contact / Facebook / competitors (auditData)"],
  pitch: ["build demo (demo.url)", "write pitch draft (pitchDraft.body)"],
  "quality-check": [
    "demo approved (visual QA 8.5 @ 1280+390)",
    "pitch reviewer-approved (critic 9.5)",
  ],
  approval: ["Zach's explicit sign-off (zachApproval=approved)"],
  outreach: ["confirmed send recorded (pitch sent / responseStatus)"],
  "follow-up": ["reply / opt-out / bounce / won — then advance to Clients"],
};
