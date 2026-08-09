"use client";

import { useState } from "react";

import { glassCard } from "@/lib/ui";

interface PitchDraft {
  subject?: string | null;
  body: string;
  channel: string;
  status: "pending" | "approved" | "rejected" | "conditional";
  confidence: number;
  notes?: string | null;
}

interface Props {
  companyId: string;
  pitchDraft: PitchDraft;
}

export function PitchApproval({ companyId, pitchDraft: initial }: Props) {
  const [pitchDraft, setPitchDraft] = useState<PitchDraft>(initial);
  const [loading, setLoading] = useState(false);

  async function handleApprove(status: "approved" | "rejected") {
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, status }),
      });
      const json = await res.json();
      if (json.ok) {
        setPitchDraft((prev) => ({ ...prev, status }));
      }
    } catch {
      // silently ignore — status stays unchanged
    } finally {
      setLoading(false);
    }
  }

  const isPending = pitchDraft.status === "pending";

  return (
    <div className={glassCard}>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Pitch Draft</h2>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              pitchDraft.status === "approved"
                ? "bg-emerald-100 text-emerald-700"
                : pitchDraft.status === "rejected"
                  ? "bg-rose-100 text-rose-700"
                  : pitchDraft.status === "conditional"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
            }`}
          >
            {pitchDraft.status}
          </span>
        </div>

        {pitchDraft.subject ? (
          <p className="mb-2 text-sm font-medium text-slate-800">
            Subject: {pitchDraft.subject}
          </p>
        ) : null}

        <div className="mb-2 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>Channel: {pitchDraft.channel}</span>
          <span>·</span>
          <span>Confidence: {pitchDraft.confidence}/10</span>
        </div>

        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 font-sans">
          {pitchDraft.body}
        </pre>

        {pitchDraft.notes ? (
          <p className="mt-2 text-xs text-slate-400 italic">
            {pitchDraft.notes}
          </p>
        ) : null}

        {/* Approve / Reject buttons — only when pending */}
        {isPending ? (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleApprove("approved")}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? "Approving..." : "Approve"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleApprove("rejected")}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? "Rejecting..." : "Reject"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
