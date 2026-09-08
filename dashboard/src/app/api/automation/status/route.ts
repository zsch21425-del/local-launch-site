import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Server-side reachability probe for the three droplet automation services the
 * Automation page embeds (M16). The page used to hard-code "All 3 online"; the
 * droplet is frequently overloaded, so that badge was routinely a lie. Any HTTP
 * response below 500 means the reverse proxy + app answered (reachable);
 * 5xx / connection failure / timeout means down.
 */
const SERVICES = [
  { key: "n8n", label: "n8n", url: "https://fairway-subaru.137.184.135.50.sslip.io/" },
  { key: "librecrawl", label: "LibreCrawl", url: "https://fairway-subaru.137.184.135.50.sslip.io/librecrawl/" },
  { key: "patter", label: "Patter", url: "https://fairway-subaru.137.184.135.50.sslip.io/patter/" },
] as const;

export async function GET() {
  const services = await Promise.all(
    SERVICES.map(async (s) => {
      const started = Date.now();
      try {
        const res = await fetch(s.url, {
          method: "GET",
          redirect: "follow",
          signal: AbortSignal.timeout(6000),
        });
        return {
          key: s.key,
          label: s.label,
          online: res.status > 0 && res.status < 500,
          httpStatus: res.status,
          latencyMs: Date.now() - started,
        };
      } catch (e: any) {
        return {
          key: s.key,
          label: s.label,
          online: false,
          httpStatus: 0,
          error: e?.message || "unreachable",
          latencyMs: Date.now() - started,
        };
      }
    }),
  );
  return NextResponse.json({
    services,
    online: services.filter((s) => s.online).length,
    total: services.length,
    checkedAt: new Date().toISOString(),
  });
}
