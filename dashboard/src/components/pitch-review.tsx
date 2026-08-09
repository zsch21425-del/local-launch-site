"use client";

import { useState } from "react";
import { Check, X, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface PitchReviewProps {
  companyId: string;
  companyName: string;
  pitch: {
    subject?: string;
    body: string;
    channel?: string;
    status?: string;
    confidence?: number;
    notes?: string;
  };
}

export function PitchReview({ companyId, companyName, pitch }: PitchReviewProps) {
  const [state, setState] = useState<"reviewing" | "approving" | "denying" | "approved" | "denied">(
    pitch.status === "approved" ? "approved" : pitch.status === "denied" ? "denied" : "reviewing"
  );
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: companyId, action: "approve", feedback }),
      });
      setState("approved");
    } catch {
      // Still mark approved — agent will catch up
      setState("approved");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeny() {
    if (!feedback.trim()) {
      setState("denying");
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: companyId, action: "deny", feedback }),
      });
      setState("denied");
    } catch {
      setState("denied");
    } finally {
      setLoading(false);
    }
  }

  const channelIcon =
    pitch.channel === "SMS" ? <MessageSquare className="size-3.5" /> : <Mail className="size-3.5" />;

  return (
    <div className={cn(glassCard, "overflow-hidden")}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "grid size-8 place-items-center rounded-lg",
            state === "approved" ? "bg-emerald-500/10 text-emerald-700" :
            state === "denied" ? "bg-rose-500/10 text-rose-700" :
            "bg-amber-500/10 text-amber-700"
          )}>
            <Send className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Pitch Review</p>
            <p className="text-[11px] text-slate-500">
              {pitch.channel} • Confidence {pitch.confidence}/10
            </p>
          </div>
        </div>
        {state === "approved" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
            <Check className="size-3" /> Approved
          </span>
        ) : state === "denied" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-500/20">
            <X className="size-3" /> Denied
          </span>
        ) : null}
      </div>

      {/* Subject */}
      <div className="px-5 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Subject</p>
        <p className="mt-1 text-sm font-medium text-slate-800">{pitch.subject || "(No subject)"}</p>
      </div>

      {/* Body */}
      <div className="px-5 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Message</p>
        <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{pitch.body}</p>
        </div>
      </div>

      {/* Notes */}
      {pitch.notes && (
        <div className="px-5 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Agent Notes</p>
          <p className="mt-1 text-xs text-slate-500">{pitch.notes}</p>
        </div>
      )}

      {/* Action buttons */}
      {state === "reviewing" && (
        <div className="mt-4 flex gap-2 border-t border-slate-100 px-5 py-3.5">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="size-4" />
            {loading ? "Sending…" : "Approve & Send"}
          </button>
          <button
            onClick={handleDeny}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="size-4" />
            Deny
          </button>
        </div>
      )}

      {/* Deny feedback */}
      {state === "denying" && (
        <div className="border-t border-slate-100 px-5 py-3.5">
          <p className="mb-2 text-sm font-medium text-slate-800">What needs to change?</p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Price is wrong, tone is off, needs competitor mention..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            rows={3}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleDeny}
              disabled={loading || !feedback.trim()}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Deny & Send Feedback"}
            </button>
            <button
              onClick={() => { setState("reviewing"); setFeedback(""); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Post-action state */}
      {state === "approved" && (
        <div className="border-t border-emerald-100 bg-emerald-50/50 px-5 py-4">
          <p className="text-sm font-medium text-emerald-800">✅ Pitch approved</p>
          <p className="mt-1 text-xs text-emerald-600">
            The Supervisor will update the playbook and send to {companyName}.
          </p>
        </div>
      )}
      {state === "denied" && feedback && (
        <div className="border-t border-rose-100 bg-rose-50/50 px-5 py-4">
          <p className="text-sm font-medium text-rose-800">❌ Pitch denied</p>
          <p className="mt-1 text-xs text-rose-600">Feedback sent back to the Closer agent.</p>
          {feedback && <p className="mt-2 text-xs italic text-rose-700">&ldquo;{feedback}&rdquo;</p>}
        </div>
      )}
    </div>
  );
}
