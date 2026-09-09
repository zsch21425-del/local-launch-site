"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronRight, Rocket, Search, Sparkles } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { PriorityBadge } from "@/components/priority-badge";
import { resolveDemoUrl, type Company } from "@/lib/data";
import { priorityWeight } from "@/lib/stages";
import { glassCard } from "@/lib/ui";

/**
 * Next Batch — the launchpad, not an approvals desk. Pick which fresh
 * prospects move into demo + pitch creation. Ordered by recommendation
 * (priority first), select a batch, start them all in one shot.
 */
export default function NextBatchPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [startedIds, setStartedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchDone, setBatchDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline/data");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCompanies(data.companies ?? []);
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

  // Candidates: fresh prospects (untouched stage, no demo, no pitch yet).
  const candidates = companies
    .filter((c) => c.stage === "prospect" && !resolveDemoUrl(c) && !c.pitchDraft)
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

  /** Move each selected prospect into the pipeline: request a demo build, then advance to audit. */
  async function startBatch(ids: string[]) {
    setBatchLoading(true);
    setBatchError(null);
    setBatchDone(null);
    let ok = 0;
    const failures: string[] = [];
    for (const id of ids) {
      const company = candidates.find((c) => c.id === id);
      const label = company?.name ?? id;
      try {
        const demoRes = await fetch("/api/pipeline/build-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: id }),
        });
        const demoJson = await demoRes.json().catch(() => ({}));
        if (!demoRes.ok || !demoJson.ok) {
          throw new Error(demoJson.error || `demo build HTTP ${demoRes.status}`);
        }
        const moveRes = await fetch("/api/pipeline/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: id, stage: "audit" }),
        });
        const moveJson = await moveRes.json().catch(() => ({}));
        if (!moveRes.ok || !moveJson.ok) {
          throw new Error(moveJson.error || `move HTTP ${moveRes.status}`);
        }
        ok += 1;
        setStartedIds((prev) => new Set([...prev, id]));
      } catch (e) {
        failures.push(
          `${label} (${e instanceof Error ? e.message : "unknown error"})`,
        );
      }
    }
    setSelected(new Set());
    if (failures.length) {
      setBatchError(`${ok} started · ${failures.length} failed: ${failures.join("; ")}`);
    } else {
      setBatchDone(`${ok} prospect${ok === 1 ? "" : "s"} moved into demo + pitch.`);
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
        subtitle="Pick the prospects to move into demo + pitch, ordered by recommendation. Start them in one shot."
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
            <p className="text-sm text-muted-foreground">Loading prospects…</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search prospects by name, category, or location…"
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

            {/* Batch action bar */}
            {selected.size > 0 ? (
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
                  {batchLoading ? "Starting…" : `Start ${selected.size} → demo + pitch`}
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
                  No fresh prospects waiting. Every prospect is already in motion.
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
                    className={`${glassCard} ${selected.has(c.id) ? "ring-2 ring-ring/60" : ""} ${
                      startedIds.has(c.id) ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        disabled={startedIds.has(c.id)}
                        aria-label={`Select ${c.name} for the next batch`}
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
                          {startedIds.has(c.id) ? (
                            <span className="text-emerald-200">✓ started</span>
                          ) : null}
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

            {/* Quiet footer */}
            <p className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
              Starting a batch requests a demo build and moves the prospect into
              the audit stage — the agent takes it from there.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
