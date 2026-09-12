"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, Bot, Play } from "lucide-react";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  actionType: string;
  companyIds: string[];
  targetStage?: string;
  state: string;
  artifacts: { kind: string; version: number; contentHash: string }[];
  reviews: { reviewerRole: string; verdict: string; blind: boolean }[];
  outcomes?: { companyId: string; ok: boolean; error?: string }[];
  createdAt: string;
}

const STATE_COLOR: Record<string, string> = {
  completed: "text-emerald-400",
  passed: "text-emerald-400",
  failed: "text-red-400",
  blocked: "text-amber-400",
  repairing: "text-amber-400",
  running: "text-sky-400",
  queued: "text-muted-foreground",
  proposed: "text-muted-foreground",
  pending_QA: "text-violet-400",
  awaiting_human_approval: "text-amber-400",
};

function JobCard({ job }: { job: Job }) {
  const [gates, setGates] = useState<{ passed: boolean; missing: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const evaluate = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/agent/jobs/${job.id}?action=evaluate`, { method: "POST" });
      const d = await r.json();
      setGates({ passed: d.passed, missing: d.gates?.missing ?? [] });
    } catch {
      setGates({ passed: false, missing: ["evaluate failed"] });
    } finally {
      setLoading(false);
    }
  }, [job.id]);

  useEffect(() => {
    // Show gate status for deliverable jobs on mount.
    if (job.actionType !== "move") evaluate();
  }, [job.actionType, evaluate]);

  return (
    <div className={cn(glass, "rounded-xl p-4")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{job.actionType}</span>
          <span className="text-xs text-muted-foreground">
            {job.companyIds.length} lead{job.companyIds.length === 1 ? "" : "s"}
          </span>
        </div>
        <span className={cn("text-xs font-semibold", STATE_COLOR[job.state] ?? "text-muted-foreground")}>
          {job.state}
        </span>
      </div>

      {job.targetStage ? (
        <p className="mt-1 text-xs text-muted-foreground">→ {job.targetStage}</p>
      ) : null}

      {job.actionType !== "move" && (
        <div className="mt-3">
          {loading ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> grading…
            </span>
          ) : gates ? (
            gates.passed ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="size-3.5" /> gates passed
              </span>
            ) : (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
                  <XCircle className="size-3.5" /> {gates.missing.length} gate(s) unmet
                </span>
                <ul className="ml-5 list-disc text-xs text-muted-foreground">
                  {gates.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )
          ) : null}
        </div>
      )}

      {job.outcomes && job.outcomes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {job.outcomes.map((o) => (
            <span
              key={o.companyId}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px]",
                o.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300",
              )}
            >
              {o.companyId} {o.ok ? "✓" : "✗"}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground">
        {new Date(job.createdAt).toLocaleString()}
      </p>
    </div>
  );
}

/** Work queue — durable autonomous jobs + their gate status. */
export function JobsPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/agent/jobs");
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "failed");
      setJobs(d.jobs ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15_000);
    return () => clearInterval(t);
  }, [refresh]);

  if (loading) {
    return (
      <div className={cn(glass, "rounded-xl p-6 text-center")}>
        <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Work queue <span className="text-muted-foreground">({jobs.length})</span>
        </h2>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Play className="size-3.5" /> refresh
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : jobs.length === 0 ? (
        <div className={cn(glass, "rounded-xl p-6 text-center")}>
          <Clock className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No autonomous jobs yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Propose work from a stage page and it will appear here.
          </p>
        </div>
      ) : (
        jobs.map((j) => <JobCard key={j.id} job={j} />)
      )}
    </div>
  );
}
