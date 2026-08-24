"use client";

import { useState } from "react";
import { Check, ExternalLink, MonitorPlay, Send, X } from "lucide-react";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { resolveDemoUrl } from "@/lib/data";

interface ApprovalPanelProps {
  company: any;
}

/**
 * Unified pitch + demo approval for a client profile. Shows the pitch draft
 * and the demo link together, with one Approve and one Disapprove (with
 * reason) control. Approval or rejection is sent to the Supervisor as a single
 * combined decision via /api/approve-combined.
 */
export function ClientApprovalPanel({ company }: ApprovalPanelProps) {
  const pitch = company.pitchDraft;
  const demoUrl = resolveDemoUrl(company);
  const hasDemo = !!(demoUrl && (company.demoUrl || company.demo?.url));
  const hasPitch = !!pitch;

  const pitchStatus = pitch?.status;
  const demoStatus = company.demo?.status ?? (company.demoUrl ? "pending" : "none");

  // Combined result reflects the latest decision on either pitch or demo.
  const storedResult: "approved" | "rejected" | "rework" | null =
    demoStatus === "approved" || pitchStatus === "zach-approved" || pitchStatus === "sent"
      ? "approved"
      : demoStatus === "rework" || pitchStatus === "rework"
        ? "rework"
        : demoStatus === "rejected" || pitchStatus === "rejected"
          ? "rejected"
          : null;

  const [mode, setMode] = useState<"review" | "deny">("review");
  const [reason, setReason] = useState(pitch?.reviewFeedback?.reason ?? "");
  const [suggestedFix, setSuggestedFix] = useState(pitch?.reviewFeedback?.suggestedFix ?? "");
  const [loading, setLoading] = useState(false);
  const [actionResult, setActionResult] = useState<"approved" | "rejected" | null>(
    storedResult === "approved" ? "approved" : storedResult === "rejected" ? "rejected" : null,
  );

  if (!hasPitch && !hasDemo) {
    return null; // nothing to approve yet
  }

  async function act(action: "approve" | "reject") {
    setLoading(true);
    try {
      const res = await fetch("/api/approve-combined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          action,
          reason: action === "reject" ? reason.trim() : undefined,
          suggestedFix: action === "reject" ? suggestedFix.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (json.ok) setActionResult(action === "approve" ? "approved" : "rejected");
    } catch {
      // Persist local state even if relay hiccups; agent will catch up.
      setActionResult(action === "approve" ? "approved" : "rejected");
    } finally {
      setLoading(false);
    }
  }

  const result = actionResult ?? storedResult;
  const pending =
    pitchStatus === "pending" ||
    pitchStatus === "supervisor-approved" ||
    demoStatus === "pending";

  return (
    <div className={cn(glassCard, "overflow-hidden", pending ? "ring-1 ring-sky-200" : "")}>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={cn("grid size-8 place-items-center rounded-lg", result === "approved" ? "bg-emerald-500/10 text-emerald-700" : result === "rejected" ? "bg-rose-500/10 text-rose-700" : result === "rework" ? "bg-violet-500/10 text-violet-700" : "bg-sky-500/10 text-sky-700")}>
            <Send className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Approval</p>
            <p className="text-[11px] text-slate-500">
              {[hasPitch && "Pitch", hasDemo && "Demo"].filter(Boolean).join(" + ")}
            </p>
          </div>
        </div>
        {result === "approved" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
            <Check className="size-3" /> Approved
          </span>
        ) : result === "rejected" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-500/20">
            <X className="size-3" /> Rejected
          </span>
        ) : result === "rework" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-500/20">
            Rework
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-500/20">
            Awaiting review
          </span>
        )}
      </div>

      {/* Pitch block */}
      {hasPitch ? (
        <div className="px-5 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pitch</p>
          {pitch.subject ? (
            <p className="mt-1 text-sm font-medium text-slate-800">{pitch.subject}</p>
          ) : null}
          <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{pitch.body}</p>
          </div>
          {pitch.reviewFeedback?.reason ? (
            <p className="mt-2 text-xs italic text-rose-600">Prior feedback: {pitch.reviewFeedback.reason}</p>
          ) : null}
        </div>
      ) : null}

      {/* Demo block */}
      {hasDemo ? (
        <div className="px-5 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Demo</p>
          <a
            href={demoUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
          >
            <MonitorPlay className="size-4" /> Open demo <ExternalLink className="size-3.5 text-slate-400" />
          </a>
          <p className="mt-1 truncate text-xs text-slate-400">{demoUrl}</p>
        </div>
      ) : null}

      {/* Actions */}
      {!result ? (
        <div className="mt-3 border-t border-slate-100 px-5 py-3.5">
          {mode === "review" ? (
            <div className="flex gap-2">
              <button
                onClick={() => act("approve")}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="size-4" /> {loading ? "Sending…" : "Approve & Send"}
              </button>
              <button
                onClick={() => setMode("deny")}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="size-4" /> Disapprove
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-800">Why are you disapproving? What should change?</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (required)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                rows={2}
              />
              <textarea
                value={suggestedFix}
                onChange={(e) => setSuggestedFix(e.target.value)}
                placeholder="Suggested fix (optional)"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                rows={2}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => act("reject")}
                  disabled={loading || !reason.trim()}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Disapprove & Send"}
                </button>
                <button
                  onClick={() => { setMode("review"); }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={cn("border-t px-5 py-4 text-sm", result === "approved" ? "bg-emerald-50/50 text-emerald-800" : result === "rejected" ? "bg-rose-50/50 text-rose-800" : "bg-violet-50/50 text-violet-800")}>
          {result === "approved" ? (
            <p className="font-medium">✅ Approved — the Supervisor will send the email and update the playbook.</p>
          ) : result === "rework" ? (
            <p className="font-medium">🔄 Rework requested — sent back to the builder/Closer. Will reappear for review when rebuilt.</p>
          ) : (
            <p className="font-medium">❌ Disapproved — feedback sent back to the Closer/builder for rework.</p>
          )}
          {result === "rejected" && reason ? <p className="mt-1 text-xs italic">&ldquo;{reason}&rdquo;</p> : null}
        </div>
      )}
    </div>
  );
}
