import { notFound } from "next/navigation";

import { ClientWorkstation } from "@/components/client-workstation";
import { MotionBackground } from "@/components/motion-background";
import { getCompany, getCompanySlugs, getStages } from "@/lib/data";

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

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <ClientWorkstation company={company} stages={stages} />
      </div>
    </>
  );
}
