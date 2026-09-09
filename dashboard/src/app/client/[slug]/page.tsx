import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { ClientWorkstation } from "@/components/client-workstation";
import { PriorityBadge } from "@/components/priority-badge";
import { StagePill } from "@/components/stage-pill";
import { getCompany, getStages } from "@/lib/data";
import { readPipelineSafe } from "@/lib/pipeline-store";

// H01: the workstation must reflect LIVE data, not the frozen build snapshot.
// This page is behind auth (no SEO value), so render it on-demand.
export const dynamic = "force-dynamic";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let company = getCompany(slug);
  let stages = getStages();
  try {
    const live = await readPipelineSafe();
    const liveCompany = (live?.companies ?? []).find((c: any) => c.id === slug);
    if (liveCompany) company = liveCompany;
    if (Array.isArray(live?.stages) && live.stages.length > 0) {
      stages = live.stages;
    }
  } catch {
    /* keep frozen fallback */
  }

  if (!company) notFound();

  const currentStage = stages.find((s: any) => s.id === company.stage) ?? stages[0];

  return (
    <div className="relative z-10">
      {/* "The Project Room" — architecture hero */}
      <section className="relative flex min-h-[46vh] items-end overflow-hidden">
        <img
          src="/art/prospect.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-10 md:px-20">
          <Link
            href="/pipeline"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to pipeline
          </Link>
          <p className="font-serif text-lg italic text-cyan-300/90">
            {company.category ?? "Client"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-medium text-foreground md:text-6xl">
              {company.name}
            </h1>
            <PriorityBadge priority={company.priority} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {company.location}
            </span>
            <StagePill stage={currentStage} />
          </div>
        </div>
      </section>

      {/* Work content */}
      <div className="mx-auto w-full max-w-[1440px] px-6 py-12 md:px-20">
        <ClientWorkstation company={company} stages={stages} />
      </div>
    </div>
  );
}
