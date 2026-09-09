"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Rocket, Search, Sparkles } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { PriorityBadge } from "@/components/priority-badge";
import type { Company, Stage } from "@/lib/data";
import { priorityWeight } from "@/lib/stages";
import { glassCard } from "@/lib/ui";

/** Funnel order — used to compute "the next stage" for any given stage. */
const FUNNEL_ORDER = [
  "prospect",
  "audit",
  "pitch",
  "quality-check",
  "approval",
  "outreach",
  "follow-up",
];

/**
 * Next Batch — move a batch of companies from one stage to the next. Pick the
 * source stage, select N (or your own), and advance them one step.
 */
export default function NextBatchPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [fromStage, setFromStage] = useState<string>("prospect");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchDone, setBatchDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline/data");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCompanies(data.companies ?? []);
      if (Array.isArray(data.stages) && data.stages.length) setStages(data.stages);
      setError(null);
    } catch {
      setError("Could not load pipeline data. Check your connection and refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const funnelStages = stages.filter((s) => FUNNEL_ORDER.includes(s.id));
  const fromIdx = FUNNEL_ORDER.indexOf(fromStage);
  const nextStageId = FUNNEL_ORDER[fromIdx + 1] ?? null;
  const nextStage = stages.find((s) => s.id === nextStageId);

  const candidates = companies
    .filter((c) => c.stage === fromStage)
    .filter((c) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return `${c.name} ${c.category ?? ""} ${c.location ?? ""}`
        .toLowerCase()
        .includes(q);
    })
    .sort(
      (a, b) =>
        priorityWeight(b.priority ?? "") - priorityWeight(a.priority ?? "") ||
        a.name.localeCompare(b.name),
    );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectTop(n: number) {
    setSelected(new Set(candidates.slice(0, n).map((c) => c.id)));
  }

  async function startBatch(ids: string[]) {
    if (!nextStageId) return;
    setBatchLoading(true);
    setBatchError(null);
    setBatchDone(null);
    let ok = 0;
    const failures: string[] = [];
    for (const id of ids) {
      const company = candidates.find((c) => c.id === id);
      const label = company?.name ?? id;
      try {
        const res = await fetch("/api/pipeline/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: id, stage: nextStageId }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          throw new Error(json.error || `move HTTP ${res.status}`);
        }
        ok += 1;
      } catch (e) {
        failures.push(`${label} (${e instanceof Error ? e.message : "unknown"})`);
      }
    }
    setSelected(new Set());
    if (failures.length) {
      setBatchError(`${ok} moved · ${failures.length} failed: ${failures.join("; ")}`);
    } else {
      setBatchDone(`${ok} moved → ${nextStage?.label ?? nextStageId}.`);
    }
    setBatchLoading(false);
    await load();
  }

  return (
    <div className="relative z-10">
      <PageHero
        image="/art/prospect.png"
        eyebrow="the launchpad"
        title="Next Batch"
        subtitle="Move a batch of companies from one stage to the next."
        backHref="/"
        backLabel="Back to pipeline"
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
        {error ? (
          <div className={`${glassCard} border-destructive bg-destructive/10 py-10 text-center`}>
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              onClick={load}
              className="mt-3 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className={`${glassCard} py-16 text-center`}>
            <p className="text-sm text-muted-foreground">Loading pipeline…</p>
          </div>
        ) : (
          <>
            {/* Source stage selector */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Move from
              </label>
              <div className="flex flex-wrap gap-1.5">
                {funnelStages.map((s) => {
                  const count = companies.filter((c) => c.stage === s.id).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setFromStage(s.id);
                        setSelected(new Set());
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        fromStage === s.id
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s.label} {count}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                {nextStage
                  ? `${fromStage === "prospect" ? "Prospects" : stages.find((s) => s.id === fromStage)?.label} → ${nextStage.label}`
                  : "This is the last funnel stage — nothing to advance to."}
              </p>
            </div>

            {/* Search + select */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, category, or location…"
                  className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-muted-foreground">Select:</span>
                <button
                  onClick={() => selectTop(5)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Top 5
                </button>
                <button
                  onClick={() => selectTop(10)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Top 10
                </button>
                <button
                  onClick={() => selectTop(candidates.length)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  All {candidates.length}
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Batch action */}
            {selected.size > 0 && nextStageId ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-primary/10 px-4 py-3">
                <Sparkles className="size-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {selected.size} selected
                </span>
                <button
                  type="button"
                  disabled={batchLoading}
                  onClick={() => void startBatch(Array.from(selected))}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_-8px_rgba(139,92,246,0.7)] transition-all hover:shadow-[0_0_32px_-6px_rgba(139,92,246,0.9)] disabled:opacity-50"
                >
                  <Rocket className="size-3.5" />
                  {batchLoading
                    ? "Moving…"
                    : `Move ${selected.size} → ${nextStage?.label ?? nextStageId}`}
                </button>
              </div>
            ) : null}

            {batchError ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {batchError}
              </p>
            ) : null}
            {batchDone ? (
              <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {batchDone}
              </p>
            ) : null}

            {/* Candidate list */}
            {candidates.length === 0 ? (
              <div className={`${glassCard} py-16 text-center`}>
                <p className="text-lg font-medium text-muted-foreground">
                  No companies in this stage.
                </p>
                <Link href="/pipeline" className="mt-2 inline-block text-sm text-primary hover:underline">
                  Open the pipeline →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {candidates.map((c, i) => (
                  <div
                    key={c.id}
                    className={`${glassCard} ${selected.has(c.id) ? "ring-2 ring-ring/60" : ""}`}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        aria-label={`Select ${c.name} to advance`}
                        className="size-4 shrink-0 accent-primary"
                      />
                      <span className="w-6 shrink-0 text-center font-display text-sm text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/client/${c.id}`}
                          className="font-display text-lg text-foreground transition-colors hover:text-primary"
                        >
                          {c.name}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{c.category}</span>
                          <span>{c.location}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <PriorityBadge priority={c.priority} />
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
