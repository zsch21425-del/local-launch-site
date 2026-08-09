"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { MotionBackground } from "@/components/motion-background";
import { PriorityBadge } from "@/components/priority-badge";
import { getCompanies, type Company } from "@/lib/data";
import { glassCard } from "@/lib/ui";

function ApproveButtons({
  companyId,
  onSuccess,
}: {
  companyId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handle(status: "approved" | "rejected") {
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, status }),
      });
      const json = await res.json();
      if (json.ok) onSuccess();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => handle("approved")}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading ? "Approving..." : "Approve"}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => handle("rejected")}
        className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
      >
        {loading ? "Rejecting..." : "Reject"}
      </button>
    </div>
  );
}

export default function ApprovalsPage() {
  const allCompanies = getCompanies();

  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const pending = allCompanies.filter(
    (c) => c.pitchDraft?.status === "pending" && c.stage === "pitch",
  );

  // Exclude locally-approved companies from the list
  const visible = pending.filter((c) => !approvedIds.has(c.id));

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        {/* Back link */}
        <Link
          href="/"
          className="group -ml-2 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Back to pipeline
        </Link>

        {visible.length === 0 ? (
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
                onApproved={(id) =>
                  setApprovedIds((prev) => new Set(prev).add(id))
                }
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
  onApproved,
}: {
  company: Company;
  onApproved: (id: string) => void;
}) {
  const draft = company.pitchDraft!;

  return (
    <div className={glassCard}>
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
          <PriorityBadge priority={company.priority} />
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

        {/* Buttons */}
        <ApproveButtons
          companyId={company.id}
          onSuccess={() => onApproved(company.id)}
        />
      </div>
    </div>
  );
}
