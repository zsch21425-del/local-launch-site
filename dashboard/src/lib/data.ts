import pipelineData from "../../data/pipeline.json";

import { priorityWeight } from "@/lib/stages";

/* ---------------------------------------------------------------- types --- */

export type StageId =
  | "prospect"
  | "audit"
  | "pitch"
  | "contacted"
  | "response"
  | "sale"
  | "build-launch";

export type StageColor =
  | "slate"
  | "blue"
  | "amber"
  | "violet"
  | "emerald"
  | "green"
  | "sky";

export interface Stage {
  id: StageId;
  label: string;
  icon: string;
  color: StageColor;
}

export interface PlaybookItem {
  id: string;
  label: string;
  stage: StageId;
  done: boolean;
  detail?: string;
}

export interface SeoScore {
  current: number;
  max: number;
  label: string;
}

/**
 * Optional per-client billing. Absent for everyone today — the moment a client
 * lands in "won" with an `revenue` block, the tracker picks it up.
 */
export interface CompanyRevenue {
  mrr?: number;
  oneTime?: number;
}

export interface Company {
  id: string;
  name: string;
  category: string;
  stage: StageId;
  location: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  /** Legacy deployed demo link (per-client Vercel project). Superseded by `demo.url` but still the source of truth for many companies. */
  demoUrl?: string;
  summary: string;
  lastContact?: string;
  lastUpdated?: string;
  priority: string;
  playbook: PlaybookItem[];
  nextSteps: string[];
  seoScore: SeoScore | null;
  prospectScore?: string;
  revenue?: CompanyRevenue;
  pitchDraft?: {
    subject?: string;
    body: string;
    channel: string;
    status: "pending" | "supervisor-approved" | "zach-approved" | "rejected" | "conditional" | "sent";
    confidence: number;
    notes?: string;
    reviewFeedback?: {
      reason: string;
      suggestedFix?: string;
      reviewedAt: string;
    };
  } | null;
  zachApproval?: "approved" | "rejected" | null;
  responseStatus?: string | null;
  saleValue?: number | null;
  /**
   * Demo approval state. `demoUrl` already exists on many companies; this
   * block records Zach's review of the deployed demo. Absent status (or a
   * company with only `demoUrl`) is treated as "pending" by getDemoQueue().
   */
  demo?: {
    url?: string;
    status?: "pending" | "approved" | "rejected";
    notes?: string;
    reviewedAt?: string;
  } | null;
  auditData?: {
    issues?: string[];
    competitors?: string[];
    gScore?: number;
    topFixes?: string[];
  } | null;
}

export interface Agency {
  name: string;
  tagline: string;
  phone: string;
  website: string;
  email: string;
}

export interface Competitor {
  name: string;
  website: string;
  hasSchema: boolean;
}

export interface Dealer {
  id: string;
  name: string;
  website: string;
  status: string;
  notes: string;
}

export interface CarLotsPipeline {
  title: string;
  marketIntel: string;
  dealers: Dealer[];
  competitors: Competitor[];
}

export interface Revenue {
  mrr: number;
  oneTime: number;
  clientCount: number;
}

/* ------------------------------------------------------------- accessors --- */

const data = pipelineData as unknown as {
  agency: Agency;
  pipeline: { stages: Stage[] };
  companies: Company[];
  carLotsPipeline: CarLotsPipeline;
  revenue?: Revenue;
};

export function getAgency(): Agency {
  return data.agency;
}

export function getStages(): Stage[] {
  return data.pipeline.stages;
}

export function getCompanies(): Company[] {
  return data.companies;
}

/** Company ids double as URL slugs (`/company/omega-auto`). */
export function getCompany(slug: string): Company | undefined {
  const company = data.companies.find((company) => company.id === slug);
  if (!company) return undefined;
  // Normalize: nextSteps may be a string (from agent output) — wrap to array
  if (typeof company.nextSteps === "string") {
    company.nextSteps = [company.nextSteps as string];
  }
  return company;
}

export function getCompanySlugs(): string[] {
  return data.companies.map((company) => company.id);
}

export function getCarLotsPipeline(): CarLotsPipeline {
  return data.carLotsPipeline;
}

/* ------------------------------------------------------------- demo queue --- */

export interface DemoItem {
  company: Company;
  url: string;
  status: "pending" | "approved" | "rejected";
}

/**
 * Resolves the effective demo URL for a company: prefer the explicit
 * `demo.url`, fall back to the legacy `demoUrl`, then to the deterministic
 * Vercel pattern `<slug>-demo.vercel.app`.
 */
export function resolveDemoUrl(company: Company): string | null {
  const explicit = company.demo?.url ?? company.demoUrl;
  if (explicit) return explicit;
  return `https://${company.id}-demo.vercel.app`;
}

/**
 * Companies with a demo that Zach has NOT yet approved. A company is in the
 * queue if it has a demo URL and its status is not "approved". Absent status
 * (legacy `demoUrl`-only companies) defaults to "pending" so they surface for
 * review instead of being silently hidden. "rework" (builder reworked after a
 * rejection) also stays in the queue for re-review.
 */
export function getDemoQueue(companies: Company[] = data.companies): DemoItem[] {
  const items: DemoItem[] = [];
  for (const company of companies) {
    const url = resolveDemoUrl(company);
    if (!url) continue;
    const status = company.demo?.status ?? "pending";
    if (status === "approved") continue;
    items.push({ company, url, status });
  }
  return items;
}

/** Count of demos awaiting Zach's approval — used for the nav badge. */
export function pendingDemoCount(companies: Company[] = data.companies): number {
  return getDemoQueue(companies).length;
}

export function getStage(id: StageId): Stage | undefined {
  return data.pipeline.stages.find((stage) => stage.id === id);
}

/** Zero-based position of a stage in the pipeline, or -1 if unknown. */
export function getStageIndex(id: StageId): number {
  return data.pipeline.stages.findIndex((stage) => stage.id === id);
}

/* --------------------------------------------------------------- revenue --- */

/**
 * Totals for the revenue tracker. Prefers an explicit top-level `revenue`
 * block in pipeline.json; otherwise sums the `revenue` on every company that
 * has reached the "won" stage. With neither present the tracker renders its
 * zero state rather than inventing numbers.
 */
export function getRevenue(companies: Company[] = data.companies): Revenue {
  if (data.revenue) return data.revenue;

  const won = companies.filter((company) => company.stage === "sale");

  return {
    mrr: won.reduce((sum, company) => sum + (company.revenue?.mrr ?? 0), 0),
    oneTime: won.reduce(
      (sum, company) => sum + (company.revenue?.oneTime ?? 0),
      0,
    ),
    clientCount: won.length,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ----------------------------------------------------------------- stats --- */

export interface PipelineStats {
  total: number;
  active: number;
  live: number;
  won: number;
  prospects: number;
  playbookDone: number;
  playbookTotal: number;
  playbookPercent: number;
  avgSeoScore: number | null;
}

/** Stages that count as "in flight" — audit through response. */
const ACTIVE_STAGES: StageId[] = ["audit", "pitch", "contacted", "response"];

export function getStats(companies: Company[] = data.companies): PipelineStats {
  const scored = companies.filter((company) => company.seoScore);
  const playbookTotal = companies.reduce(
    (sum, company) => sum + company.playbook.length,
    0,
  );
  const playbookDone = companies.reduce(
    (sum, company) => sum + company.playbook.filter((item) => item.done).length,
    0,
  );

  return {
    total: companies.length,
    active: companies.filter((company) => ACTIVE_STAGES.includes(company.stage))
      .length,
    live: companies.filter((company) => company.stage === "build-launch").length,
    won: companies.filter((company) => company.stage === "sale").length,
    prospects: companies.filter((company) => company.stage === "prospect")
      .length,
    playbookDone,
    playbookTotal,
    playbookPercent:
      playbookTotal === 0
        ? 0
        : Math.round((playbookDone / playbookTotal) * 100),
    avgSeoScore:
      scored.length === 0
        ? null
        : Math.round(
            scored.reduce(
              (sum, company) => sum + (company.seoScore?.current ?? 0),
              0,
            ) / scored.length,
          ),
  };
}

/** How many companies sit in each stage — used for column counts. */
export function getStageCounts(
  companies: Company[] = data.companies,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const company of companies) {
    counts[company.stage] = (counts[company.stage] ?? 0) + 1;
  }
  return counts;
}

/* ----------------------------------------------------------------- tasks --- */

export interface OpenTask {
  companyId: string;
  companyName: string;
  priority: string;
  item: PlaybookItem;
}

/**
 * The next unchecked playbook step for each company, highest priority first.
 * One task per client keeps the sidebar actionable instead of exhaustive.
 */
export function getOpenTasks(
  companies: Company[] = data.companies,
  limit = 6,
): OpenTask[] {
  return companies
    .flatMap((company) => {
      const next = company.playbook.find((item) => !item.done);
      if (!next) return [];
      return [
        {
          companyId: company.id,
          companyName: company.name,
          priority: company.priority,
          item: next,
        },
      ];
    })
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))
    .slice(0, limit);
}

/* --------------------------------------------------------------- helpers --- */

export interface PlaybookProgress {
  done: number;
  total: number;
  percent: number;
}

export function getPlaybookProgress(items: PlaybookItem[]): PlaybookProgress {
  const total = items.length;
  const done = items.filter((item) => item.done).length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

/** Groups playbook items by stage, in pipeline order. Empty stages are dropped. */
export function groupPlaybookByStage(
  items: PlaybookItem[],
): { stage: Stage; items: PlaybookItem[] }[] {
  return data.pipeline.stages
    .map((stage) => ({
      stage,
      items: items.filter((item) => item.stage === stage.id),
    }))
    .filter((group) => group.items.length > 0);
}

/** "2026-08-07" -> "Aug 7, 2026". Returns null for empty/invalid dates. */
export function formatDate(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Whole days between a `YYYY-MM-DD` value and now. Null for empty/invalid dates. */
export function daysSince(value?: string): number | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86_400_000));
}

/**
 * Websites in the getData() are sometimes bare hosts, sometimes annotated
 * ("yardsmithgvl.com (broken)"). Returns a linkable href, or null when the
 * value isn't a usable URL.
 */
export function toHref(website?: string): string | null {
  if (!website) return null;
  const cleaned = website.split(" ")[0].trim();
  if (!cleaned) return null;
  return cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
}

/** Strips protocol and trailing slash for display. */
export function displayUrl(website?: string): string | null {
  if (!website) return null;
  return website.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function telHref(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

/** "Omega Auto Sales" -> "OA" for the card avatar. */
export function initials(name: string): string {
  return name
    .replace(/[^A-Za-z0-9 &]/g, " ")
    .split(/\s+/)
    .filter((word) => word && word !== "&")
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}
