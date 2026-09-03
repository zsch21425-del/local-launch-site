"use client";

import { AgentChat } from "@/components/agent-chat";
import { ClientAssets } from "@/components/client-assets";
import { ColdCallSheet } from "@/components/cold-call-sheet";
import { ClientHeader } from "@/components/client-header";
import { ClientSummary } from "@/components/client-summary";
import { ClientTimeline } from "@/components/client-timeline";
import { ClientApprovalPanel } from "@/components/client-approval-panel";
import { PlaybookChecklist } from "@/components/playbook-checklist";
import { QuickDispatch } from "@/components/quick-dispatch";
import { SeoGauge } from "@/components/seo-gauge";
import { StageTracker } from "@/components/stage-tracker";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bot,
  FileText,
  FolderOpen,
  ListChecks,
  ListOrdered,
  MonitorPlay,
  User,
} from "lucide-react";

/**
 * Section wrapper — consistent heading (icon + title + subtitle) so the
 * single-scroll client file reads as a clean work surface.
 */
function Section({
  icon,
  title,
  subtitle,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md bg-slate-900/[0.05] text-slate-500">
          {icon}
        </span>
        <div className="leading-tight">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {subtitle ? <p className="text-[11px] text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * Client workstation — ONE scrollable client file (no tabs). Everything the
 * operator needs lives on this page, top to bottom:
 *   1. header (who + stage)
 *   2. pipeline position + scores
 *   3. demo & pitch (the review action)
 *   4. prospect details (contact + summary)
 *   5. audit findings
 *   6. what's been done (activity timeline)
 *   7. what's next (playbook + next steps)
 *   8. assets (vault files)
 *   9. agent (chat — give it the work)
 *   10. quick dispatch
 */
export function ClientWorkstation({ company, stages }: { company: any; stages: any[] }) {
  const currentStage = stages.find((s) => s.id === company.stage) ?? stages[0];
  const hasDemoOrPitch = !!(company.pitchDraft || company.demoUrl || company.demo?.url);
  const hasPlaybook = (company.playbook ?? []).length > 0;
  const hasNextSteps = (company.nextSteps?.length ?? 0) > 0;
  const hasAudit = company.stage === "audit" && !!company.auditData;

  return (
    <div className="flex flex-col gap-6">
      <ClientHeader company={company} stage={currentStage} />

      {/* Pipeline position + scores */}
      <StageTracker current={company.stage} stages={stages} />
      {company.seoScore ? (
        <SeoGauge
          value={company.seoScore.current}
          max={company.seoScore.max}
          label={company.seoScore.label}
        />
      ) : null}

      {/* Demo & pitch — the review action */}
      {hasDemoOrPitch ? (
        <Section
          icon={<MonitorPlay className="size-3.5" />}
          title="Demo & Pitch"
          subtitle="Review, approve, or send rework notes to the agent"
        >
          <ClientApprovalPanel company={company} />
        </Section>
      ) : null}

      {/* Prospect details */}
      <Section
        icon={<User className="size-3.5" />}
        title="Prospect"
        subtitle="Who they are + how to reach them"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ColdCallSheet
            companyId={company.id}
            ownerName={company.ownerName}
            phone={company.phone}
            email={company.email}
            offer={company.offer}
            responseStatus={company.responseStatus}
            demoUrl={company.demoUrl}
            website={company.website}
          />
          <ClientSummary company={company} />
        </div>
      </Section>

      {/* Audit findings */}
      {hasAudit ? (
        <Section
          icon={<FileText className="size-3.5" />}
          title="Audit findings"
          subtitle="What the audit found"
        >
          <div className={cn(glassCard, "p-5")}>
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
          </div>
        </Section>
      ) : null}

      {/* What's been done */}
      <Section
        icon={<Activity className="size-3.5" />}
        title="What's been done"
        subtitle="Activity timeline"
      >
        <ClientTimeline companyId={company.id} />
      </Section>

      {/* What's next */}
      <Section
        icon={<ListChecks className="size-3.5" />}
        title="What's next"
        subtitle="Playbook + next steps"
      >
        {hasNextSteps ? (
          <div className={cn(glassCard, "p-5")}>
            <ol className="flex flex-col gap-2.5 text-sm text-slate-600">
              {company.nextSteps.map((step: string, index: number) => (
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

        {hasPlaybook ? (
          <div className={cn(glassCard, "p-5")}>
            <PlaybookChecklist
              items={company.playbook ?? []}
              stages={stages}
              companyId={company.id}
            />
          </div>
        ) : (
          <div className={cn(glassCard, "py-8 text-center text-sm text-slate-400")}>
            <ListOrdered className="mx-auto mb-2 size-5 text-slate-300" />
            No playbook steps yet — check back after the audit.
          </div>
        )}
      </Section>

      {/* Assets */}
      <Section icon={<FolderOpen className="size-3.5" />} title="Assets" subtitle="Vault files">
        <ClientAssets companyId={company.id} />
      </Section>

      {/* Agent */}
      <Section
        icon={<Bot className="size-3.5" />}
        title="Agent"
        subtitle="Give the agent work — it has the full record"
      >
        <div className={cn(glassCard, "overflow-hidden p-0")}>
          <AgentChat clientId={company.id} clientName={company.name} className="h-[60vh]" />
        </div>
      </Section>

      <QuickDispatch companyId={company.id} companyName={company.name} />
    </div>
  );
}
