import { notFound } from "next/navigation";

import { ClientWorkstation } from "@/components/client-workstation";
import { MotionBackground } from "@/components/motion-background";
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

  // Live Blob is authoritative; the frozen snapshot is only a fallback so a
  // transient Blob read error never 404s a company that exists locally.
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

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <ClientWorkstation company={company} stages={stages} />
      </div>
    </>
  );
}
