"use client";

import { useEffect, useState } from "react";
import { Workflow, Search, Radio } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const N8N_URL = "https://fairway-subaru.137.184.135.50.sslip.io/";
const LIBRECRAWL_URL = "https://fairway-subaru.137.184.135.50.sslip.io/librecrawl/";
const PATTER_URL = "https://fairway-subaru.137.184.135.50.sslip.io/patter/";

type ServiceState = "unknown" | "online" | "offline";

type StatusResponse = {
  services?: { key: string; label: string; online: boolean }[];
  online?: number;
  total?: number;
};

/** Live reachability of the three droplet services — never assumed (M16). */
function useAutomationStatus() {
  const [byKey, setByKey] = useState<Record<string, ServiceState>>({
    n8n: "unknown",
    librecrawl: "unknown",
    patter: "unknown",
  });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function probe() {
      try {
        const res = await fetch("/api/automation/status", {
          signal: AbortSignal.timeout(12000),
        });
        const data = (await res.json()) as StatusResponse;
        if (cancelled) return;
        const next: Record<string, ServiceState> = {};
        for (const s of data.services ?? []) {
          next[s.key] = s.online ? "online" : "offline";
        }
        setByKey((prev) => ({ ...prev, ...next }));
        setChecked(true);
      } catch {
        if (cancelled) return;
        setByKey({ n8n: "offline", librecrawl: "offline", patter: "offline" });
        setChecked(true);
      }
    }
    void probe();
    const t = setInterval(probe, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const online = Object.values(byKey).filter((s) => s === "online").length;
  return { byKey, checked, online };
}

function StatusDot({ state }: { state: ServiceState }) {
  if (state === "online") {
    return (
      <span className="relative flex size-2.5" title="Online">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex size-2.5 rounded-full",
        state === "offline" ? "bg-destructive" : "bg-muted",
      )}
      title={state === "offline" ? "Offline / unreachable" : "Checking…"}
    />
  );
}

function statusLabel(state: ServiceState): string {
  return state === "online" ? "online" : state === "offline" ? "offline" : "checking…";
}

export default function AutomationPage() {
  const { byKey, checked, online } = useAutomationStatus();

  const statusValue = !checked
    ? "Checking…"
    : online === 3
      ? "All 3 online"
      : `${online}/3 online`;

  return (
    <>
      <PageHero
        image="/art/automation.png"
        eyebrow="the infrastructure"
        title="Automation"
        subtitle="The automation brain behind Local Launch OS."
      />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">

        <div className="grid gap-6 lg:grid-cols-3">
          {/* n8n */}
          <section className={glass}>
            <div className="flex items-center justify-between gap-3 border-b border-card/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <StatusDot state={byKey.n8n} />
                n8n · Workflow Engine
                <span className="text-xs font-normal text-muted-foreground">({statusLabel(byKey.n8n)})</span>
              </div>
              <a
                href={N8N_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Open ↗
              </a>
            </div>
            <div className="aspect-[4/3] w-full">
              <iframe
                src={N8N_URL}
                title="n8n Workflow Automation"
                className="h-full w-full border-0"
                loading="lazy"
                allow="clipboard-read; clipboard-write"
              />
            </div>
          </section>

          {/* LibreCrawl */}
          <section className={glass}>
            <div className="flex items-center justify-between gap-3 border-b border-card/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <StatusDot state={byKey.librecrawl} />
                LibreCrawl · SEO Audit
                <span className="text-xs font-normal text-muted-foreground">({statusLabel(byKey.librecrawl)})</span>
              </div>
              <a
                href={LIBRECRAWL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Open ↗
              </a>
            </div>
            <div className="aspect-[4/3] w-full">
              <iframe
                src={LIBRECRAWL_URL}
                title="LibreCrawl SEO Spider"
                className="h-full w-full border-0"
                loading="lazy"
              />
            </div>
          </section>

          {/* Patter */}
          <section className={glass}>
            <div className="flex items-center justify-between gap-3 border-b border-card/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <StatusDot state={byKey.patter} />
                Patter · Voice AI
                <span className="text-xs font-normal text-muted-foreground">({statusLabel(byKey.patter)})</span>
              </div>
              <a
                href={PATTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Open ↗
              </a>
            </div>
            <div className="aspect-[4/3] w-full">
              <iframe
                src={PATTER_URL}
                title="Patter Voice AI Dashboard"
                className="h-full w-full border-0"
                loading="lazy"
              />
            </div>
          </section>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Workflows" value="7-stage pipeline" hint="Discovery → Outreach" icon={Workflow} />
          <StatCard label="SEO Engine" value="LibreCrawl" hint="Free Screaming Frog alt" icon={Search} />
          <StatCard label="Voice Stack" value="Patter live" hint="Claude + ElevenLabs + Deepgram" icon={Radio} />
          <StatCard
            label="Status"
            value={statusValue}
            hint={checked ? "Live probe · Droplet 137.184.135.50" : "Probing Droplet 137.184.135.50"}
            icon={Workflow}
          />
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Workflow;
}) {
  return (
    <div className={cn(glass, "flex flex-col gap-1 p-4")}>
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}
