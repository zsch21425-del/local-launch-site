"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";

import { MotionBackground } from "@/components/motion-background";
import { PriorityBadge } from "@/components/priority-badge";
import { needsPricingRewrite } from "@/lib/data";
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
  const [error, setError] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "pending-review"
    | "supervisor-approved"
    | "pending-supervisor-review"
    | "rejected"
  >("all");
  const [rewriteOnly, setRewriteOnly] = useState(false);

  // Deep-link: /approvals?status=supervisor-approved (from Home "Ready to send")
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get("status");
      if (
        s === "pending-review" ||
        s === "supervisor-approved" ||
        s === "pending-supervisor-review" ||
        s === "rejected"
      ) {
        setStatusFilter(s);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline/data");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCompanies(data.companies ?? []);
      setError(null);
    } catch (e) {
      setError("Could not load pipeline data. Check your connection and refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Show pitches that need Zach's final review (see filter below for which statuses).
  const queue = companies.filter((c) => {
    const st = c.pitchDraft?.status;
    if (!st) return false;
    if (st === "zach-approved" || st === "sent") return false; // already decided/sent
    return c.stage === "pitch";
  });

  const visible = queue
    .filter((c) => !removedIds.has(c.id))
    .filter((c) => (statusFilter === "all" ? true : c.pitchDraft?.status === statusFilter))
    .filter((c) => (rewriteOnly ? needsPricingRewrite(c) : true))
    .filter((c) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.category ?? "").toLowerCase().includes(q) ||
        (c.location ?? "").toLowerCase().includes(q)
      );
    });

  const counts = queue.reduce<Record<string, number>>((acc, c) => {
    const s = c.pitchDraft?.status ?? "other";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const rewriteCount = queue.filter((c) => needsPricingRewrite(c)).length;

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

        {error ? (
          <div className={`${glassCard} border-rose-200 bg-rose-50/60 py-10 text-center`}>
            <p className="text-sm font-medium text-rose-700">{error}</p>
            <button
              onClick={load}
              className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className={`${glassCard} py-16 text-center`}>
            <p className="text-sm text-slate-400">Loading approvals…</p>
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

            {/* Search + status filter — stay visible even when the result is empty */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, category, or location…"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([
                  ["all", `All ${queue.length}`],
                  ["pending-review", `Pending ${counts["pending-review"] ?? 0}`],
                  ["supervisor-approved", `Sup. approved ${counts["supervisor-approved"] ?? 0}`],
                  ["pending-supervisor-review", `Sup. review ${counts["pending-supervisor-review"] ?? 0}`],
                  ["rejected", `Rejected ${counts["rejected"] ?? 0}`],
                ] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setStatusFilter(val)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === val
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => setRewriteOnly((v) => !v)}
                  title="Show only pitches with dead $300/$49 pricing or the banned 'I look forward to hearing from you' close"
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    rewriteOnly
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ⚠ Needs rewrite {rewriteCount}
                </button>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className={`${glassCard} py-16 text-center`}>
                <p className="text-lg font-medium text-slate-600">
                  {queue.length === 0
                    ? "All caught up! No pitches waiting for approval."
                    : "No pitches match that search or filter."}
                </p>
                {queue.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter("all");
                    }}
                    className="mt-2 text-sm text-emerald-600 hover:underline"
                  >
                    Clear filters
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="mt-2 inline-block text-sm text-emerald-600 hover:underline"
                  >
                    Back to pipeline →
                  </Link>
                )}
              </div>
            ) : (
              visible.map((company) => (
                <ApprovalCard
                  key={company.id}
                  company={company}
                  onDone={(id) => setRemovedIds((prev) => new Set(prev).add(id))}
                />
              ))
            )}
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
              href={`/client/${company.id}`}
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
            {needsPricingRewrite(company) ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                ⚠ Needs rewrite
              </span>
            ) : null}
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
