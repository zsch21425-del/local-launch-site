"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ClientApprovalPanel } from "@/components/client-approval-panel";
import { CompanyTile } from "@/components/company-tile";
import { usePipeline } from "@/hooks/use-pipeline";
import { priorityWeight, stageIcon, STAGE_DESCRIPTIONS } from "@/lib/stages";

export default function StagePage() {
  const { id } = useParams<{ id: string }>();
  const { companies, stages, loading } = usePipeline();

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
            <Link
              href="/approvals"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              Move a batch here →
            </Link>
          </div>
        ) : isApproval ? (
          // Approval: show the full demo + pitch together, with combined approve.
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {stageCompanies.map((c: any) => (
              <ClientApprovalPanel key={c.id} company={c} />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stageCompanies.map((c: any) => (
              <CompanyTile key={c.id} company={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
