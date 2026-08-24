"use client";

import { useState } from "react";
import { ClientTabs } from "@/components/client-tabs";
import { AgentChat } from "@/components/agent-chat";
import { ClientAssets } from "@/components/client-assets";
import { ClientContact } from "@/components/client-contact";
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
import { FileText, ListOrdered } from "lucide-react";

/**
 * Client workstation — tabbed workspace (Overview / Playbook / Activity / Assets / Chat).
 * Server page passes the full company object; this client shell manages tabs.
 */
export function ClientWorkstation({ company, stages }: { company: any; stages: any[] }) {
  const [tab, setTab] = useState("overview");
  const currentStage = stages.find((s) => s.id === company.stage) ?? stages[0];

  return (
    <div className="flex flex-col gap-5">
      <ClientHeader company={company} stage={currentStage} />

      {/* Tab bar */}
      <ClientTabs active={tab} onChange={setTab} />

      {/* Overview tab: stage tracker + key metrics + contact/summary + dispatch */}
      {tab === "overview" && (
        <div className="flex flex-col gap-5">
          <StageTracker current={company.stage} stages={stages} />
          {company.seoScore ? (
            <SeoGauge value={company.seoScore.current} max={company.seoScore.max} label={company.seoScore.label} />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <ClientContact company={company} />
            <ClientSummary company={company} />
          </div>

          {/* Unified pitch + demo approval — shows whenever there's a pitch or a demo to review */}
          {company.pitchDraft || company.demoUrl || company.demo?.url ? (
            <ClientApprovalPanel company={company} />
          ) : null}

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
            </div>
          ) : null}

          {company.nextSteps.length > 0 ? (
            <div className={cn(glassCard, "p-5")}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ListOrdered className="size-4 text-slate-400" aria-hidden />
                Next steps
              </h2>
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

          <QuickDispatch companyId={company.id} companyName={company.name} />
        </div>
      )}

      {/* Playbook tab */}
      {tab === "playbook" && (
        <div className="flex flex-col gap-5">
          {company.playbook.length > 0 ? (
            <div className={cn(glassCard, "p-5")}>
              <PlaybookChecklist items={company.playbook} stages={stages} companyId={company.id} />
            </div>
          ) : (
            <div className={cn(glassCard, "py-8 text-center text-sm text-slate-400")}>
              No playbook steps yet. Check back after the audit.
            </div>
          )}
        </div>
      )}

      {/* Activity tab — timeline only (gallery split to Assets) */}
      {tab === "activity" && <ClientTimeline companyId={company.id} />}

      {/* Assets tab — dedicated vault file gallery */}
      {tab === "assets" && <ClientAssets companyId={company.id} />}

      {/* Chat tab */}
      {tab === "chat" && (
        <div className={cn(glassCard, "p-0 overflow-hidden")}>
          <AgentChat clientId={company.id} clientName={company.name} className="h-[70vh]" />
        </div>
      )}
    </div>
  );
}
