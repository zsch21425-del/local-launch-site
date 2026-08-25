import { redirect } from "next/navigation";

/** Legacy profile URL — the real workstation lives at /client/[slug]. */
export default async function LegacyCompanyRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/client/${id}`);
}
