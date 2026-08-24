"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { MotionBackground } from "@/components/motion-background";
import { PriorityBadge } from "@/components/priority-badge";
import type { Company } from "@/lib/data";
import { glassCard } from "@/lib/ui";

/* Rejection feedback form — shown when Zach clicks Reject. */
function RejectForm({
  company,
  onCancel,
  onSubmit,
}: {
  company: Company;
  onCancel: () => void;
  onSubmit: (reason: string, suggestedFix: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [suggestedFix, setSuggestedFix] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handle() {
    if (!reason.trim()) {
      setError("A reason is required so the pitch can be revised.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(reason.trim(), suggestedFix.trim());
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/60 p-4">
      <p className="mb-2 text-sm font-medium text-rose-700">
        Reject &quot;{company.name}&quot; — tell the agent what to fix
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why are you rejecting this pitch? Be specific…"
        rows={2}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
      />
      <textarea
        value={suggestedFix}
        onChange={(e) => setSuggestedFix(e.target.value)}
        placeholder="What should the agent change or add? (e.g. 'rework the headline to focus on emergency HVAC', 'lower the price to $300')"
        rows={2}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handle}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Submit Rejection"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ApproveButtons({
  company,
  onApproved,
  onRejected,
  onResubmitted,
}: {
  company: Company;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
  onResubmitted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const feedback = company.pitchDraft?.reviewFeedback;

  async function approve() {
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, status: "zach-approved" }),
      });
      const json = await res.json();
      if (json.ok) onApproved(company.id);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function reject(reason: string, suggestedFix: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, status: "rejected", reason, suggestedFix }),
      });
      const json = await res.json();
      if (json.ok) onRejected(company.id);
      else alert(json.error || "Rejection failed");
    } catch {
      alert("Rejection failed");
    } finally {
      setLoading(false);
    }
  }

  async function resubmit() {
    setLoading(true);
    try {
      // Mark back to pending so it's in the queue again (agent will revise the body).
      const res = await fetch("/api/pipeline/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, status: "pending" }),
      });
      const json = await res.json();
      if (json.ok) onResubmitted(company.id);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // Couldn't be rejected without reason now; if there's feedback, show it + allow re-submit.
  if (feedback) {
    return (
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
        <p className="text-sm font-semibold text-amber-800">Rejected — needs revision</p>
        <p className="mt-1 text-sm text-slate-700">
          <span className="font-medium text-slate-600">Reason:</span> {feedback.reason}
        </p>
        {feedback.suggestedFix ? (
          <p className="mt-1 text-sm text-slate-700">
            <span className="font-medium text-slate-600">Suggested fix:</span>{" "}
            {feedback.suggestedFix}
          </p>
        ) : null}
        <button
          type="button"
          disabled={loading}
          onClick={resubmit}
          className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? "Marking…" : "Mark for re-approval"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={approve}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setShowRejectForm(true)}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {showRejectForm ? (
        <RejectForm
          company={company}
          onCancel={() => setShowRejectForm(false)}
          onSubmit={reject}
        />
      ) : null}
    </div>
  );
}

export default function ApprovalsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline/data");
      const data = await res.json();
      setCompanies(data.companies ?? []);
    } catch {
      // keep last known
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Show pitches that need Zach's final review. Zach reviews items that are
  // "pending" (fresh) or "supervisor-approved" (supervisor OK'd, awaiting Zach's
  // final go) or "rejected" (can be re-marked for re-approval after the Closer revises).
  // Exclude terminal states: zach-approved (done), sent (email sent), absent.
  const queue = companies.filter((c) => {
    const st = c.pitchDraft?.status;
    if (!st) return false;
    if (st === "zach-approved" || st === "sent") return false; // already decided/sent
    return c.stage === "pitch";
  });
  const visible = queue.filter((c) => !removedIds.has(c.id));

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="group -ml-2 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Back to pipeline
        </Link>

        {loading ? (
          <div className={`${glassCard} py-16 text-center`}>
            <p className="text-sm text-slate-400">Loading approvals…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className={`${glassCard} py-16 text-center`}>
            <p className="text-lg font-medium text-slate-600">
              All caught up! No pitches waiting for approval.
            </p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-emerald-600 hover:underline"
            >
              Back to pipeline →
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Pitch Approvals
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {visible.length} pitch{visible.length !== 1 ? "es" : ""} waiting
                for review
              </p>
            </div>

            {visible.map((company) => (
              <ApprovalCard
                key={company.id}
                company={company}
                onDone={(id) => setRemovedIds((prev) => new Set(prev).add(id))}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}

function ApprovalCard({
  company,
  onDone,
}: {
  company: Company;
  onDone: (id: string) => void;
}) {
  const draft = company.pitchDraft!;
  const isRejected = draft.status === "rejected";

  return (
    <div className={`${glassCard} ${isRejected ? "border-amber-300" : ""}`}>
      <div className="p-5">
        {/* Header */}
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link
              href={`/company/${company.id}`}
              className="text-base font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
            >
              {company.name}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span>{company.category}</span>
              <span>{company.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isRejected ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Rejected
              </span>
            ) : null}
            <PriorityBadge priority={company.priority} />
          </div>
        </div>

        {/* Pitch subject */}
        {draft.subject ? (
          <p className="mb-2 text-sm font-medium text-slate-800">
            Subject: {draft.subject}
          </p>
        ) : null}

        {/* Channel + confidence */}
        <div className="mb-2 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>Channel: {draft.channel}</span>
          <span>·</span>
          <span>Confidence: {draft.confidence}/10</span>
        </div>

        {/* Pitch body */}
        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 font-sans">
          {draft.body}
        </pre>

        {draft.notes ? (
          <p className="mt-2 text-xs text-slate-400 italic">{draft.notes}</p>
        ) : null}

        {/* Buttons / feedback */}
        <ApproveButtons
          company={company}
          onApproved={onDone}
          onRejected={onDone}
          onResubmitted={onDone}
        />
      </div>
    </div>
  );
}
