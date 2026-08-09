import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Phone } from "lucide-react";

import { MotionBackground } from "@/components/motion-background";
import { PitchApproval } from "@/components/pitch-approval";
import { PlaybookChecklist } from "@/components/playbook-checklist";
import { PriorityBadge } from "@/components/priority-badge";
import { SeoGauge } from "@/components/seo-gauge";
import { StagePill } from "@/components/stage-pill";
import { StageTracker } from "@/components/stage-tracker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getCompany,
  getStages,
  getPlaybookProgress,
  displayUrl,
  toHref,
  telHref,
  formatDate,
} from "@/lib/data";
import { glass, glassCard } from "@/lib/ui";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = getCompany(id);
  if (!company) notFound();

  const stages = getStages();
  const currentStage = stages.find((s) => s.id === company.stage) ?? stages[0];
  const progress = getPlaybookProgress(company.playbook);

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        {/* Back link */}
        <Link
          href="/"
          className="group -ml-2 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Back to pipeline
        </Link>

        {/* Header */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {company.name}
              </h1>
              {company.priority === "high" ||
              company.priority === "medium-high" ? (
                <PriorityBadge priority={company.priority} />
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {company.location}
              </span>
              {company.category ? (
                <Badge variant="outline" className="text-xs">
                  {company.category}
                </Badge>
              ) : null}
            </div>
          </div>
          <StagePill stage={currentStage} />
        </section>

        {/* Stage Progress */}
        <StageTracker current={company.stage} stages={stages} />

        {/* Playbook Progress */}
        <div className={glass}>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm font-medium text-slate-700">
              Playbook Progress
            </span>
            <span className="text-sm text-slate-500">
              {progress.done}/{progress.total} steps
            </span>
          </div>
          <Progress
            value={progress.percent}
            className="mx-5 mb-4 h-2 [&>div]:bg-emerald-500"
          />
        </div>

        {/* Summary + Contact */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`${glassCard} p-5 lg:col-span-2`}>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              Summary
            </h2>
            <p className="text-sm leading-relaxed text-slate-500">
              {company.summary}
            </p>
          </div>

          <div className={`${glassCard} flex flex-col gap-2 p-5`}>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">
              Contact
            </h2>
            {company.phone ? (
              <a
                href={telHref(company.phone) ?? "#"}
                className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
              >
                <Phone className="size-3.5" />
                {company.phone}
              </a>
            ) : null}
            {company.email ? (
              <span className="text-sm text-slate-500">{company.email}</span>
            ) : null}
            {company.website ? (
              <a
                href={toHref(company.website) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline"
              >
                {displayUrl(company.website)}
                <ExternalLink className="size-3" />
              </a>
            ) : null}
            {company.facebook ? (
              <a
                href={company.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 transition-colors hover:text-slate-600"
              >
                Facebook →
              </a>
            ) : null}
            <hr className="my-1 border-slate-200" />
            {company.lastContact ? (
              <span className="text-xs text-slate-400">
                Last contact: {formatDate(company.lastContact)}
              </span>
            ) : null}
            {company.lastUpdated ? (
              <span className="text-xs text-slate-400">
                Updated: {formatDate(company.lastUpdated)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Pitch Draft */}
        {company.pitchDraft ? (
          <PitchApproval
            companyId={company.id}
            pitchDraft={company.pitchDraft}
          />
        ) : null}

        {/* SEO Gauge */}
        {company.seoScore ? (
          <SeoGauge
            value={company.seoScore.current}
            max={company.seoScore.max}
            label={company.seoScore.label}
          />
        ) : company.prospectScore ? (
          <div className={glassCard}>
            <div className="p-5 text-center">
              <h3 className="mb-1 text-sm font-semibold text-slate-700">
                Prospect Score
              </h3>
              <p className="text-2xl font-bold text-slate-800">
                {company.prospectScore}
              </p>
            </div>
          </div>
        ) : null}

        {/* Playbook Checklist */}
        {company.playbook.length > 0 ? (
          <section>
            <PlaybookChecklist
              items={company.playbook}
              stages={stages}
              companyId={company.id}
            />
          </section>
        ) : (
          <div className={`${glassCard} py-8 text-center text-sm text-slate-400`}>
            No playbook steps yet. Check back after the audit.
          </div>
        )}

        {/* Next Steps */}
        {company.nextSteps.length > 0 ? (
          <div className={glassCard}>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Next Steps
              </h2>
              <ul className="flex list-inside list-disc flex-col gap-1.5 text-sm text-slate-500">
                {company.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
