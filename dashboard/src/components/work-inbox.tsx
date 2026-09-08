"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  Building2,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  MailWarning,
  MessageCircle,
  MonitorPlay,
  Radar,
  Send,
} from "lucide-react";

import type { WorkInbox, WorkItem } from "@/lib/data";
import { formatPriority, priorityTheme, stageTheme } from "@/lib/stages";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const STAGE_ORDER = [
  "prospect",
  "audit",
  "pitch",
  "contacted",
  "response",
  "sale",
  "build-launch",
] as const;

const STAGE_LABEL: Record<string, string> = {
  prospect: "Prospect",
  audit: "Audit",
  pitch: "Pitch",
  contacted: "Contacted",
  response: "Response",
  sale: "Sale",
  "build-launch": "Clients",
};

function stageBoardHref(id: string) {
  // Deep-link home board focus
  if (id === "build-launch") return "/?stage=build-launch#pipeline";
  if (id === "pitch") return "/?stage=pitch#pipeline";
  if (id === "contacted" || id === "response") return `/?stage=${id}#pipeline`;
  if (id === "prospect" || id === "audit") return `/?stage=${id}#pipeline`;
  return `/?stage=${id}#pipeline`;
}

/**
 * Operational command center — honest funnel + only actionable next steps.
 * No inflated "needs email" from unfinished pitch drafts.
 */
export function WorkInboxPanel({ inbox }: { inbox: WorkInbox }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Honest stage funnel */}
      <section className={cn(glass, "p-5")}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Pipeline position
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Live stage counts — where every prospect actually sits.
            </p>
          </div>
          <Link
            href="/#pipeline"
            className="text-xs font-medium text-primary hover:underline"
          >
            Open board →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {STAGE_ORDER.map((id) => {
            const n = inbox.stageCounts[id] || 0;
            const theme = stageTheme(
              id === "build-launch"
                ? "green"
                : id === "pitch"
                  ? "amber"
                  : id === "contacted"
                    ? "violet"
                    : id === "audit"
                      ? "blue"
                      : "slate",
            );
            return (
              <Link
                key={id}
                href={stageBoardHref(id)}
                className="rounded-xl border border-border bg-card/80 px-3 py-3 transition-colors hover:border-primary hover:bg-card"
              >
                <p className="text-[11px] font-medium text-muted-foreground">
                  {STAGE_LABEL[id] || id}
                </p>
                <p className="tnum mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {n}
                </p>
                <span
                  className={cn("mt-2 block h-1 rounded-full", theme.bar)}
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Action buckets */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Bucket
          title="Do now"
          subtitle="Things only you can clear"
          items={[
            {
              href: "/approvals?status=supervisor-approved",
              label: "Ready to send",
              hint: "Approved + live email (MX OK)",
              count: inbox.sendNow,
              icon: Send,
              tone: "emerald",
            },
            {
              href: "/approvals?status=supervisor-approved",
              label: "Send blocked",
              hint: "Approved but no email",
              count: inbox.sendBlocked,
              icon: MailWarning,
              tone: "rose",
            },
            {
              href: "#agent-work",
              label: "Dead emails",
              hint: "No MX / bounce-risk — never send",
              count: inbox.bounceRisk ?? 0,
              icon: MailWarning,
              tone: "rose",
            },
            {
              href: "/demos",
              label: "Demo reviews",
              hint: "Live demos awaiting check",
              count: inbox.demos,
              icon: MonitorPlay,
              tone: "sky",
            },
            {
              href: "/approvals",
              label: "In review",
              hint: "Drafts waiting on gate",
              count: inbox.inReview,
              icon: ClipboardCheck,
              tone: "amber",
            },
          ]}
        />

        <Bucket
          title="Monitor"
          subtitle="In motion — follow when quiet"
          items={[
            {
              href: "#agent-work",
              label: "Agent owes you",
              hint: "Reworks, rejects, blocked/dead emails",
              count: inbox.agentWork,
              icon: Bot,
              tone: "rose",
            },
            {
              href: "/leads",
              label: "Awaiting reply",
              hint: "Contacted / waiting on them",
              count: inbox.awaitingReply,
              icon: MessageCircle,
              tone: "violet",
            },
            {
              href: "/clients",
              label: "Active clients",
              hint: "Build & launch",
              count: inbox.clients,
              icon: Building2,
              tone: "green",
            },
            {
              href: "/leads",
              label: "Early funnel",
              hint: "Prospect + audit",
              count: inbox.early,
              icon: Radar,
              tone: "slate",
            },
          ]}
        />
      </section>

      {/* Agent work queue — what the agent must fix from your notes */}
      <section id="agent-work" className={cn(glass, "p-5")}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <Bot className="size-4 text-destructive" />
              Agent work queue
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Demo/pitch rejects and blocked sends — with your notes. Agent
              should clear these without you repeating them in Telegram.
            </p>
          </div>
          <span className="tnum rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-white">
            {inbox.agentWork}
          </span>
        </div>
        {inbox.agentWorkItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border py-8 text-center">
            <CheckCircle2 className="size-5 text-primary" />
            <p className="text-sm font-medium text-foreground">
              Nothing waiting on the agent.
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-border/[0.06]">
            {inbox.agentWorkItems.map((item) => {
              const theme = priorityTheme(item.priority);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex flex-col gap-0.5 py-2.5 transition-colors hover:bg-muted sm:flex-row sm:items-start sm:gap-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.companyName}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                            theme.badge,
                          )}
                        >
                          {formatPriority(item.priority)}
                        </span>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {item.title}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.detail}
                      </span>
                      {item.note ? (
                        <span className="mt-1 block rounded-md border border-amber-100 bg-amber-50/80 px-2 py-1 text-xs text-amber-950">
                          <span className="font-medium">Your note:</span>{" "}
                          {item.note}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Next lists */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ItemList
          title="Send queue"
          empty="Nothing ready to send."
          items={[...inbox.sendNowItems, ...inbox.sendBlockedItems].slice(0, 10)}
        />
        <ItemList
          title="Awaiting / clients"
          empty="No follow-ups or clients queued."
          items={[...inbox.awaitingItems, ...inbox.clientItems].slice(0, 10)}
        />
      </section>
    </div>
  );
}

function Bucket({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: {
    href: string;
    label: string;
    hint: string;
    count: number;
    icon: ComponentType<{ className?: string }>;
    tone: string;
  }[];
}) {
  const tones: Record<string, string> = {
    emerald: "bg-primary text-white",
    rose: "bg-destructive text-white",
    sky: "bg-sky-600 text-white",
    amber: "bg-amber-600 text-white",
    violet: "bg-violet-600 text-white",
    green: "bg-primary text-white",
    slate: "bg-foreground text-white",
  };
  const icons: Record<string, string> = {
    emerald: "bg-primary/10 text-primary",
    rose: "bg-destructive/10 text-destructive",
    sky: "bg-sky-500/10 text-sky-700",
    amber: "bg-amber-500/10 text-amber-700",
    violet: "bg-violet-500/10 text-violet-700",
    green: "bg-primary/10 text-primary",
    slate: "bg-muted-foreground/10 text-foreground",
  };

  return (
    <div className={cn(glass, "flex flex-col gap-3 p-5")}>
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          className="flex items-center justify-between rounded-xl border border-border bg-card/70 px-3.5 py-3 transition-colors hover:border-primary/50 hover:bg-card"
        >
          <span className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-lg",
                icons[it.tone],
              )}
            >
              <it.icon className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-medium text-foreground">
                {it.label}
              </span>
              <span className="text-[11px] text-muted-foreground">{it.hint}</span>
            </span>
          </span>
          <span
            className={cn(
              "tnum rounded-full px-2.5 py-0.5 text-xs font-semibold",
              tones[it.tone],
            )}
          >
            {it.count}
          </span>
        </Link>
      ))}
    </div>
  );
}

function ItemList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: WorkItem[];
}) {
  return (
    <div className={cn(glass, "flex flex-col p-5")}>
      <h2 className="mb-2 text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border py-8 text-center">
          <CheckCircle2 className="size-5 text-primary" />
          <p className="text-sm font-medium text-foreground">{empty}</p>
        </div>
      ) : (
        <ol className="divide-y divide-border/[0.06]">
          {items.map((item) => {
            const theme = priorityTheme(item.priority);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {item.companyName}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                          theme.badge,
                        )}
                      >
                        {formatPriority(item.priority)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.title}
                      {item.detail ? ` · ${item.detail}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
