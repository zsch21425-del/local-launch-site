"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ChevronRight, Rocket, X } from "lucide-react";

import { ClientApprovalPanel } from "@/components/client-approval-panel";
import { CompanyTile } from "@/components/company-tile";
import { AgentChat } from "@/components/agent-chat";
import { usePipeline } from "@/hooks/use-pipeline";
import { priorityWeight, stageIcon, STAGE_DESCRIPTIONS } from "@/lib/stages";

const FUNNEL_ORDER = [
  "prospect",
  "audit",
  "pitch",
  "quality-check",
  "approval",
  "outreach",
  "follow-up",
];

export default function StagePage() {
  const { id } = useParams<{ id: string }>();
  const { companies, stages, loading } = usePipeline();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);
  const [moveResult, setMoveResult] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const stage = stages.find((s) => s.id === id);
  if (!stage) {
    return (
      <div className="relative z-10 mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-lg text-muted-foreground">Stage not found.</p>
        <Link href="/" className="mt-2 inline-block text-sm text-primary hover:underline">
          Back to stages
        </Link>
      </div>
    );
  }

  const stageCompanies = companies
    .filter((c) => c.stage === id)
    .sort(
      (a, b) =>
        priorityWeight(b.priority ?? "") - priorityWeight(a.priority ?? "") ||
        a.name.localeCompare(b.name),
    );

  const Icon = stageIcon(stage.icon);
  const desc = STAGE_DESCRIPTIONS[id] ?? "";
  const isApproval = id === "approval";
  const nextStageId = FUNNEL_ORDER[FUNNEL_ORDER.indexOf(id) + 1] ?? null;
  const nextStage = stages.find((s) => s.id === nextStageId);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function advanceBatch() {
    if (!nextStageId || selected.size === 0) return;
    setMoving(true);
    setMoveResult(null);
    setMoveError(null);
    let ok = 0;
    const failures: string[] = [];
    for (const companyId of Array.from(selected)) {
      const c = stageCompanies.find((x) => x.id === companyId);
      try {
        const res = await fetch("/api/pipeline/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId, stage: nextStageId }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          throw new Error(json.error || `move HTTP ${res.status}`);
        }
        ok += 1;
      } catch (e) {
        failures.push(`${c?.name ?? companyId} (${e instanceof Error ? e.message : "unknown"})`);
      }
    }
    setSelected(new Set());
    setMoving(false);
    if (failures.length) {
      setMoveError(`${ok} moved · ${failures.length} failed: ${failures.join("; ")}`);
    } else {
      setMoveResult(`${ok} moved → ${nextStage?.label ?? nextStageId}.`);
    }
  }

  return (
    <div className="relative z-10">
      {/* Stage header */}
      <div className="mx-auto w-full max-w-[1440px] px-6 pt-10 md:px-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to stages
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-slate-800 text-muted-foreground">
            <Icon className="size-5" />
          </span>
          <h1 className="font-display text-4xl font-medium text-foreground md:text-5xl">
            {stage.label}
          </h1>
          <span className="tnum rounded-full bg-muted px-2.5 py-1 text-sm font-semibold text-muted-foreground">
            {stageCompanies.length}
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">{desc}</p>
      </div>

      {/* Companies */}
      <div className="mx-auto w-full max-w-[1440px] px-6 py-8 md:px-20">
        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading pipeline…
          </p>
        ) : stageCompanies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">No companies in this stage yet.</p>
          </div>
        ) : isApproval ? (
          // Approval: show the full demo + pitch together, with combined approve.
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {stageCompanies.map((c: any) => (
              <ClientApprovalPanel key={c.id} company={c} />
            ))}
          </div>
        ) : (
          <>
            {/* Batch-advance: select the batch (default ~10), move to next stage. */}
            {nextStageId ? (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/60 p-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Advance a batch to {nextStage?.label ?? nextStageId}:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelected(new Set(stageCompanies.slice(0, 10).map((c) => c.id)))
                  }
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Select top 10
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set(stageCompanies.map((c) => c.id)))}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Select all
                </button>
                {selected.size > 0 ? (
                  <button
                    type="button"
                    onClick={() => void advanceBatch()}
                    disabled={moving}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <Rocket className="size-3.5" />
                    {moving
                      ? "Moving…"
                      : `Move ${selected.size} → ${nextStage?.label ?? nextStageId}`}
                  </button>
                ) : null}
                {selected.size > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    aria-label="Clear selection"
                    className="grid size-7 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
            {moveResult ? (
              <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {moveResult}
              </p>
            ) : null}
            {moveError ? (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {moveError}
              </p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stageCompanies.map((c: any) => (
                <div key={c.id} className="relative">
                  {nextStageId ? (
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`Select ${c.name} to advance`}
                      className="absolute left-2 top-2 z-10 size-4 accent-primary"
                    />
                  ) : null}
                  <CompanyTile company={c} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Agent chat — work the stage's batch directly from here. */}
        <div className="mt-10">
          <AgentChat
            stageId={id}
            stageLabel={stage.label}
            batchCompanyIds={stageCompanies.map((c) => c.id)}
            className="h-[50vh]"
          />
        </div>
      </div>
    </div>
  );
}
