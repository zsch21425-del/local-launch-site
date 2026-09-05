"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, MonitorPlay, RefreshCw, Send, X } from "lucide-react";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { resolveDemoUrl } from "@/lib/data";

interface ApprovalPanelProps {
  company: any;
}

/**
 * Unified pitch + demo approval on the client page.
 * Reject/rework REQUIRES a reason — saved on the record + relayed to the agent
 * (same contract as /demos and /approvals). No Telegram needed for the note.
 */
export function ClientApprovalPanel({ company }: ApprovalPanelProps) {
  const pitch = company.pitchDraft;
  const demoUrl = resolveDemoUrl(company);
  const hasDemo = !!(demoUrl && (company.demoUrl || company.demo?.url));
  const hasPitch = !!pitch;

  const pitchStatus = pitch?.status;
  const demoStatus =
    company.demo?.status ?? (company.demoUrl || company.demo?.url ? "pending" : "none");

  const pitchFb = pitch?.reviewFeedback;
  const demoFb = company.demo?.reviewFeedback;
  const anyFb = demoFb?.reason ? demoFb : pitchFb?.reason ? pitchFb : null;

  const storedResult: "approved" | "rejected" | "rework" | null =
    demoStatus === "approved" ||
    pitchStatus === "zach-approved" ||
    pitchStatus === "sent"
      ? "approved"
      : demoStatus === "rework" || pitchStatus === "rework"
        ? "rework"
        : demoStatus === "rejected" || pitchStatus === "rejected"
          ? "rejected"
          : null;

  const [mode, setMode] = useState<"review" | "deny" | "rework">("review");
  const [reason, setReason] = useState(anyFb?.reason ?? "");
  const [suggestedFix, setSuggestedFix] = useState(anyFb?.suggestedFix ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [relayNote, setRelayNote] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<
    "approved" | "rejected" | "rework" | null
  >(
    storedResult === "approved"
      ? "approved"
      : storedResult === "rejected"
        ? "rejected"
        : storedResult === "rework"
          ? "rework"
          : null,
  );
  const [savedFb, setSavedFb] = useState<{
    reason: string;
    suggestedFix?: string;
  } | null>(
    anyFb?.reason
      ? { reason: anyFb.reason, suggestedFix: anyFb.suggestedFix }
      : null,
  );

  if (!hasPitch && !hasDemo) {
    return null;
  }

  async function act(action: "approve" | "reject" | "rework") {
    setError("");
    setRelayNote(null);
    if ((action === "reject" || action === "rework") && !reason.trim()) {
      setError("A reason is required so the agent knows what to fix.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/approve-combined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          action,
          reason: action !== "approve" ? reason.trim() : undefined,
          suggestedFix: action !== "approve" ? suggestedFix.trim() : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || "Request failed");
        return;
      }
      if (action === "approve") {
        setActionResult("approved");
        setSavedFb(null);
      } else {
        setActionResult(action === "rework" ? "rework" : "rejected");
        setSavedFb({
          reason: reason.trim(),
          suggestedFix: suggestedFix.trim() || undefined,
        });
        setMode("review");
      }
      setRelayNote(
        json.relayed
          ? "Saved + sent to the agent. No need to repeat this in Telegram."
          : "Saved on the record. Agent relay lagged — notes are still stored.",
      );
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  const result = actionResult ?? storedResult;
  const pending =
    !result &&
    (pitchStatus === "pending" ||
      pitchStatus === "pending-review" ||
      pitchStatus === "pending-supervisor-review" ||
      pitchStatus === "supervisor-approved" ||
      demoStatus === "pending" ||
      demoStatus === "rework");

  const displayFb = savedFb ?? (anyFb?.reason ? anyFb : null);

  return (
    <div
      className={cn(
        glassCard,
        "overflow-hidden",
        pending ? "ring-1 ring-sky-200" : "",
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg",
              result === "approved"
                ? "bg-emerald-500/10 text-emerald-700"
                : result === "rejected"
                  ? "bg-rose-500/10 text-rose-700"
                  : result === "rework"
                    ? "bg-violet-500/10 text-violet-700"
                    : "bg-sky-500/10 text-sky-700",
            )}
          >
            <Send className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Approval</p>
            <p className="text-[11px] text-slate-500">
              {[hasPitch && "Pitch", hasDemo && "Demo"]
                .filter(Boolean)
                .join(" + ")}
              {" · notes go to the agent"}
            </p>
          </div>
        </div>
        {result === "approved" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            <Check className="size-3" /> Approved
          </span>
        ) : result === "rejected" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-500/20 ring-inset">
            <X className="size-3" /> Rejected
          </span>
        ) : result === "rework" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-500/20 ring-inset">
            Rework
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-500/20 ring-inset">
            Awaiting review
          </span>
        )}
      </div>

      {hasPitch ? (
        <div className="px-5 pt-4">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Pitch
          </p>
          {pitch.subject ? (
            <p className="mt-1 text-sm font-medium text-slate-800">
              {pitch.subject}
            </p>
          ) : null}
          <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-slate-700">
              {pitch.body}
            </p>
          </div>
        </div>
      ) : null}

      {hasDemo ? (
        <div className="px-5 pt-3">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Demo
          </p>
          <a
            href={demoUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
          >
            <MonitorPlay className="size-4" /> Open demo{" "}
            <ExternalLink className="size-3.5 text-slate-400" />
          </a>
          <p className="mt-1 truncate text-xs text-slate-400">{demoUrl}</p>
        </div>
      ) : null}

      {/* Always show stored feedback */}
      {displayFb?.reason ? (
        <div className="mx-5 mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
          <p className="text-xs font-semibold text-amber-900">
            Your notes to the agent
          </p>
          <p className="mt-1 text-sm text-slate-800">
            <span className="font-medium text-slate-600">Reason:</span>{" "}
            {displayFb.reason}
          </p>
          {displayFb.suggestedFix ? (
            <p className="mt-1 text-sm text-slate-800">
              <span className="font-medium text-slate-600">Fix:</span>{" "}
              {displayFb.suggestedFix}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="px-5 pt-2 text-xs text-rose-600">{error}</p>
      ) : null}
      {relayNote ? (
        <p className="px-5 pt-2 text-xs text-emerald-700">{relayNote}</p>
      ) : null}

      {!result || mode === "deny" || mode === "rework" ? (
        <div className="mt-3 border-t border-slate-100 px-5 py-3.5">
          {mode === "review" && !result ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void act("approve")}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="size-4" />{" "}
                {loading ? "Sending…" : "Approve"}
              </button>
              <button
                type="button"
                onClick={() => setMode("rework")}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:opacity-50"
              >
                <RefreshCw className="size-4" /> Rework
              </button>
              <button
                type="button"
                onClick={() => setMode("deny")}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="size-4" /> Disapprove
              </button>
            </div>
          ) : mode === "deny" || mode === "rework" ? (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-800">
                {mode === "rework"
                  ? "What needs rework? What should the agent change?"
                  : "Why are you disapproving? What should the agent change?"}
              </p>
              <p className="mb-2 text-[11px] text-slate-500">
                Required. Saved on this company and sent to the agent — skip
                Telegram for the same note.
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (required) — e.g. hero too dark, wrong city, AI slop copy…"
                className={cn(
                  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none",
                  mode === "rework"
                    ? "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    : "focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20",
                )}
                rows={2}
                autoFocus
              />
              <textarea
                value={suggestedFix}
                onChange={(e) => setSuggestedFix(e.target.value)}
                placeholder="Suggested fix (optional)"
                className={cn(
                  "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none",
                  mode === "rework"
                    ? "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    : "focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20",
                )}
                rows={2}
              />
              <div className="mt-2 flex gap-2">
                {mode === "rework" ? (
                  <button
                    type="button"
                    onClick={() => void act("rework")}
                    disabled={loading || !reason.trim()}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                  >
                    {loading ? "Sending to agent…" : "Rework & send notes"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void act("reject")}
                    disabled={loading || !reason.trim()}
                    className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                  >
                    {loading ? "Sending to agent…" : "Disapprove & send notes"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMode("review");
                    setError("");
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={cn(
            "border-t px-5 py-4 text-sm",
            result === "approved"
              ? "bg-emerald-50/50 text-emerald-800"
              : result === "rejected"
                ? "bg-rose-50/50 text-rose-800"
                : "bg-violet-50/50 text-violet-800",
          )}
        >
          {result === "approved" ? (
            <p className="flex items-center gap-1.5 font-medium">
              <Check className="size-4" /> Approved — agent can proceed
              (send / next steps).
            </p>
          ) : result === "rework" ? (
            <p className="flex items-center gap-1.5 font-medium">
              <RefreshCw className="size-4" /> Rework — agent has the notes
              on this record.
            </p>
          ) : (
            <p className="flex items-center gap-1.5 font-medium">
              <X className="size-4" /> Disapproved — feedback is on the
              record for the agent.
            </p>
          )}
          {result !== "approved" ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionResult(null);
                  setMode(result === "rework" ? "rework" : "deny");
                }}
                className="text-xs font-medium underline"
              >
                Edit notes / re-send
              </button>
              <Link
                href={`/client/${company.id}`}
                className="text-xs font-medium underline"
              >
                Stay on client · use agent chat below
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
