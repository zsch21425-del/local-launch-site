import { notFound } from "next/navigation";
import { ListOrdered, FileText } from "lucide-react";

import { AgentChat } from "@/components/agent-chat";
import { ClientContact } from "@/components/client-contact";
import { ClientHeader } from "@/components/client-header";
import { ClientSummary } from "@/components/client-summary";
import { MotionBackground } from "@/components/motion-background";
import { PitchReview } from "@/components/pitch-review";
import { PlaybookChecklist } from "@/components/playbook-checklist";
import { SeoGauge } from "@/components/seo-gauge";
import { StageTracker } from "@/components/stage-tracker";
import { getCompany, getCompanySlugs, getStages } from "@/lib/data";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return getCompanySlugs().map((slug) => ({ slug }));
}

export default async function ClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();

  const stages = getStages();
  const currentStage = stages.find((s) => s.id === company.stage) ?? stages[0];

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-5 lg:items-start">
        {/* Left: client workspace (~60%) */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          <ClientHeader company={company} stage={currentStage} />

          <StageTracker current={company.stage} stages={stages} />

          {company.seoScore ? (
            <SeoGauge
              value={company.seoScore.current}
              max={company.seoScore.max}
              label={company.seoScore.label}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <ClientContact company={company} />
            <ClientSummary company={company} />
          </div>

          {/* PITCH REVIEW — show for clients in pitch stage */}
          {company.stage === "pitch" && company.pitchDraft ? (
            <PitchReview
              companyId={company.id}
              companyName={company.name}
              pitch={company.pitchDraft}
            />
          ) : null}

          {/* AUDIT DETAIL — show for clients in audit stage */}
          {company.stage === "audit" && company.auditData ? (
            <div className={cn(glassCard, "p-5")}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText className="size-4 text-slate-400" aria-hidden />
                Audit Findings
              </h2>
              {(company.auditData.issues?.length ?? 0) > 0 ? (
                <ul className="flex flex-col gap-2">
                  {company.auditData.issues?.map((issue: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No audit issues documented yet.</p>
              )}
              {(company.auditData.competitors?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Top Competitors</p>
                  {company.auditData.competitors?.map((comp: string, i: number) => (
                    <p key={i} className="text-sm text-slate-600">{comp}</p>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {company.playbook.length > 0 ? (
            <div className={cn(glassCard, "p-5")}>
              <PlaybookChecklist
                items={company.playbook}
                stages={stages}
                companyId={company.id}
              />
            </div>
          ) : (
            <div className={cn(glassCard, "py-8 text-center text-sm text-slate-400")}>
              No playbook steps yet. Check back after the audit.
            </div>
          )}

          {company.nextSteps.length > 0 ? (
            <div className={cn(glassCard, "p-5")}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ListOrdered className="size-4 text-slate-400" aria-hidden />
                Next steps
              </h2>
              <ol className="flex flex-col gap-2.5 text-sm text-slate-600">
                {company.nextSteps.map((step, index) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-700">
                      {index + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        {/* Right: agent chat (~40%) */}
        <div className="lg:sticky lg:top-20 lg:col-span-2 lg:h-[calc(100svh-6rem)]">
          <AgentChat clientId={company.id} clientName={company.name} className="h-full" />
        </div>
      </div>
    </>
  );
}
