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
    status:
      | "pending"
      | "pending-review"
      | "pending-supervisor-review"
      | "supervisor-approved"
      | "zach-approved"
      | "rejected"
      | "conditional"
      | "sent"
      | "rework";
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
   * Cold-call sheet fields. `ownerName` is the verified decision-maker's name
   * (for "Hi {name}" and for asking for them on the phone). `offer` is the
   * pricing tier for this lead: "$599 build" (no site) or "$149/mo care"
   * (has a site). Both are editable on the client workstation.
   */
  ownerName?: string | null;
  offer?: string | null;
  /**
   * Demo approval state. `demoUrl` already exists on many companies; this
   * block records Zach's review of the deployed demo. Absent status (or a
   * company with only `demoUrl`) is treated as "pending" by getDemoQueue().
   */
  demo?: {
    url?: string;
    status?: "pending" | "approved" | "rejected" | "rework";
    /** Freeform notes (legacy + combined with reviewFeedback) */
    notes?: string;
    reviewedAt?: string;
    /** Structured reject/rework feedback — same shape as pitchDraft.reviewFeedback */
    reviewFeedback?: {
      reason: string;
      suggestedFix?: string;
      reviewedAt: string;
    };
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

/**
 * Bundled snapshot shape. Live Blob/API is flatter (`stages` at top level).
 * Accept BOTH so a Blob-shaped pipeline.json never breaks static prerender
 * (Vercel fail 2026-09-01: `data.pipeline.stages` on flat book).
 */
type PipelineBook = {
  agency?: Agency;
  pipeline?: { stages?: Stage[] };
  stages?: Stage[];
  companies: Company[];
  carLotsPipeline?: CarLotsPipeline;
  revenue?: Revenue;
};

const data = pipelineData as unknown as PipelineBook;

const FALLBACK_STAGES: Stage[] = [
  { id: "prospect", label: "Prospect", icon: "Search", color: "slate" },
  { id: "audit", label: "Audit", icon: "Clipboard", color: "blue" },
  { id: "pitch", label: "Pitch", icon: "Send", color: "amber" },
  { id: "contacted", label: "Contacted", icon: "Phone", color: "violet" },
  { id: "response", label: "Response", icon: "Message", color: "sky" },
  { id: "sale", label: "Sale", icon: "Dollar", color: "emerald" },
  { id: "build-launch", label: "Build & Launch", icon: "Rocket", color: "green" },
];

const FALLBACK_AGENCY: Agency = {
  name: "Local Launch",
  tagline: "Websites + SEO for local trades",
  phone: "(503) 358-5860",
  website: "https://locallaunchupstate.com",
  email: "locallaunchupstate@gmail.com",
};

export function getAgency(): Agency {
  return data.agency ?? FALLBACK_AGENCY;
}

export function getStages(): Stage[] {
  const nested = data.pipeline?.stages;
  if (Array.isArray(nested) && nested.length) return nested;
  if (Array.isArray(data.stages) && data.stages.length) return data.stages;
  return FALLBACK_STAGES;
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
  return (
    data.carLotsPipeline ?? {
      title: "Car lots",
      marketIntel: "",
      dealers: [],
      competitors: [],
    }
  );
}

/* ------------------------------------------------------------- demo queue --- */

export interface DemoItem {
  company: Company;
  url: string;
  status: "pending" | "approved" | "rejected" | "rework";
}

/**
 * Resolves the effective demo URL for a company: prefer the explicit
 * `demo.url`, fall back to the legacy `demoUrl`.
 *
 * HARD RULE: do NOT invent `<slug>-demo.vercel.app` when no URL is set.
 * Inventing floods the Demos queue with 404s for every company without a
 * real demo (caught 2026-09-01 during LLOS upgrade). Only return a URL that
 * was intentionally stored on the company record.
 */
export function resolveDemoUrl(company: Company): string | null {
  const explicit = company.demo?.url ?? company.demoUrl ?? null;
  if (!explicit || typeof explicit !== "string") return null;
  const url = explicit.trim();
  return url.length ? url : null;
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

/* ----------------------------------------------------------- work inbox --- */

/** Early-funnel stages = leads. Later stages = booked / in-build clients. */
export const LEAD_STAGES: StageId[] = [
  "prospect",
  "audit",
  "pitch",
  "contacted",
  "response",
];
export const CLIENT_STAGES: StageId[] = ["sale", "build-launch"];

export function isLead(company: Company): boolean {
  return LEAD_STAGES.includes(company.stage);
}
export function isClient(company: Company): boolean {
  return CLIENT_STAGES.includes(company.stage);
}

export function isOpenPitchStatus(status?: string): boolean {
  if (!status) return false;
  return status !== "zach-approved" && status !== "sent";
}

/** Same filter the Approvals page uses — keep these in lockstep. */
export function getApprovalQueue(
  companies: Company[] = data.companies,
): Company[] {
  return companies.filter(
    (c) => c.stage === "pitch" && isOpenPitchStatus(c.pitchDraft?.status),
  );
}

export function pendingApprovalCount(
  companies: Company[] = data.companies,
): number {
  return getApprovalQueue(companies).length;
}

export type WorkKind = "pitch" | "demo" | "prospect" | "follow-up" | "build";

export interface WorkItem {
  id: string;
  kind: WorkKind;
  title: string;
  detail: string;
  href: string;
  priority: string;
  companyId: string;
  companyName: string;
  /** Optional reject/rework reason for agent work queue */
  note?: string;
}

export interface WorkInbox {
  /** supervisor-approved + has email → Zach can send */
  sendNow: number;
  /** supervisor-approved but missing email → blocked */
  sendBlocked: number;
  /** pitch drafts in review (pending-review / pending-supervisor-review) */
  inReview: number;
  /** stage contacted or responseStatus awaiting */
  awaitingReply: number;
  /** build-launch clients */
  clients: number;
  /** prospect + audit */
  early: number;
  demos: number;
  /** items the agent owes Zach (rejects / reworks / send-blocked) */
  agentWork: number;
  /** Send-truth (audited vs locallaunch Sent) */
  sentUnverified: number;
  sentBounced: number;
  sentUnproven: number;
  /** dead domain / MX fail — never send */
  bounceRisk: number;
  /** stage counts — source of truth for funnel */
  stageCounts: Record<string, number>;
  sendNowItems: WorkItem[];
  sendBlockedItems: WorkItem[];
  awaitingItems: WorkItem[];
  clientItems: WorkItem[];
  reviewItems: WorkItem[];
  agentWorkItems: WorkItem[];
  bounceRiskItems: WorkItem[];
}

/** Canonical email: top-level or pitchDraft.email (never invent). */
export function companyEmail(company: Company): string | null {
  const top = (company.email || "").trim();
  if (top) return top;
  const pd = company.pitchDraft;
  if (pd && typeof pd === "object") {
    const pe = String((pd as { email?: string }).email || "").trim();
    if (pe) return pe;
  }
  return null;
}

export function pitchStatus(company: Company): string | null {
  const pd = company.pitchDraft;
  if (!pd || typeof pd !== "object") return null;
  return (pd.status as string) || null;
}

/**
 * Flags pitches carrying the DEAD $300/$49 pricing or the banned
 * "I look forward to hearing from you" close. Both must be rewritten to
 * $599/$149 + a question-close before the gate can pass them (2026-08-31 backlog).
 */
export function needsPricingRewrite(company: Company): boolean {
  const body = company.pitchDraft?.body ?? "";
  if (!body) return false;
  const deadPricing = /\$300\b/.test(body) || /\$49\b/.test(body);
  const bannedClose = /I look forward to hearing from you/i.test(body);
  return deadPricing || bannedClose;
}

/**
 * Operational command board — only counts Zach can act on.
 * Does NOT treat "pitch without email" as a crisis (most drafts aren't sendable yet).
 */
export function getWorkInbox(companies: Company[] = data.companies): WorkInbox {
  const stageCounts = getStageCounts(companies);
  const demos = getDemoQueue(companies).length;

  const sendNowList = companies.filter((c) => {
      if (c.stage !== "pitch") return false;
      if (pitchStatus(c) !== "supervisor-approved") return false;
      if (!companyEmail(c)) return false;
      // Pre-send gate: never offer dead domains as "send now"
      const eg = (c as { emailGate?: { status?: string } }).emailGate?.status;
      if (eg === "INVALID") return false;
      if ((c.responseStatus || "").toLowerCase() === "bounce-risk") return false;
      return true;
    });
    const sendBlockedList = companies.filter((c) => {
      if (c.stage !== "pitch") return false;
      if (pitchStatus(c) !== "supervisor-approved") return false;
      return !companyEmail(c);
    });
    // Dead-domain / bounce-risk — approved or not, must not be mailed
    const bounceRiskList = companies.filter((c) => {
      const eg = (c as { emailGate?: { status?: string } }).emailGate?.status;
      if (eg === "INVALID") return true;
      return (c.responseStatus || "").toLowerCase() === "bounce-risk";
    });

  const reviewList = companies.filter((c) => {
    if (c.stage !== "pitch") return false;
    const st = pitchStatus(c);
    return st === "pending-review" || st === "pending-supervisor-review";
  });

  const awaitingList = companies.filter((c) => {
    const st = (c as { sendTruth?: { status?: string } }).sendTruth?.status;
    if (st === "bounced" || c.responseStatus === "bounced") return false;
    // Prefer send-truth: only verified sends still in contacted/response
    if (st === "sent_unverified" || st === "sent_domain_risk") {
      return c.stage === "contacted" || c.stage === "response";
    }
    if (st === "unproven") return false;
    if (c.stage === "contacted" || c.stage === "response") return true;
    const rs = (c.responseStatus || "").toLowerCase();
    return rs === "awaiting" || rs === "pitch-sent";
  });

  const clientList = companies.filter((c) => c.stage === "build-launch");
  const earlyN =
    (stageCounts["prospect"] || 0) + (stageCounts["audit"] || 0);

  let sentUnverified = 0;
  let sentBounced = 0;
  let sentUnproven = 0;
  for (const c of companies) {
    const st = (c as { sendTruth?: { status?: string } }).sendTruth?.status;
    if (st === "sent_unverified" || st === "sent_domain_risk") sentUnverified += 1;
    else if (st === "bounced") sentBounced += 1;
    else if (st === "unproven") sentUnproven += 1;
    else if (c.responseStatus === "bounced") sentBounced += 1;
  }

  const toItem = (
    c: Company,
    kind: WorkKind,
    title: string,
    extra?: string,
    note?: string,
  ): WorkItem => ({
    id: `${kind}-${c.id}-${title.slice(0, 12)}`,
    kind,
    title,
    detail: [c.category, c.location, extra, companyEmail(c) ? "has email" : "no email"]
      .filter(Boolean)
      .join(" · "),
    href: `/client/${c.id}`,
    priority: c.priority,
    companyId: c.id,
    companyName: c.name,
    note,
  });

  const byPri = (a: Company, b: Company) =>
    priorityWeight(b.priority) - priorityWeight(a.priority);

  // Agent owes Zach: demo rework/reject, pitch reject, send-blocked
  const agentWorkList: WorkItem[] = [];
  for (const c of companies) {
    const demoSt = c.demo?.status;
    const demoNote =
      c.demo?.reviewFeedback?.reason || c.demo?.notes || undefined;
    if (demoSt === "rework" || demoSt === "rejected") {
      agentWorkList.push(
        toItem(
          c,
          "demo",
          demoSt === "rework" ? "Demo rework" : "Demo rejected",
          c.demoUrl || c.demo?.url || undefined,
          demoNote,
        ),
      );
    }
    const pst = pitchStatus(c);
    const pitchNote = c.pitchDraft?.reviewFeedback?.reason;
    if (pst === "rejected") {
      agentWorkList.push(
        toItem(c, "pitch", "Pitch rejected", undefined, pitchNote),
      );
    }
  }
  for (const c of sendBlockedList) {
    // avoid dup if already rejected
    if (agentWorkList.some((w) => w.companyId === c.id && w.kind === "pitch")) {
      continue;
    }
    agentWorkList.push(
      toItem(c, "pitch", "Send blocked — need email", "supervisor-approved"),
    );
  }
  for (const c of bounceRiskList) {
    if (agentWorkList.some((w) => w.companyId === c.id)) continue;
    const eg = (c as { emailGate?: { email?: string; reason?: string } })
      .emailGate;
    agentWorkList.push(
      toItem(
        c,
        "pitch",
        "Dead email — find new address",
        eg?.email,
        eg?.reason || "bounce-risk / no MX",
      ),
    );
  }
  agentWorkList.sort(
    (a, b) => priorityWeight(b.priority) - priorityWeight(a.priority),
  );

  return {
    sendNow: sendNowList.length,
    sendBlocked: sendBlockedList.length,
    inReview: reviewList.length,
    awaitingReply: awaitingList.length,
    clients: clientList.length,
    early: earlyN,
    demos,
    agentWork: agentWorkList.length,
    sentUnverified,
    sentBounced,
    sentUnproven,
    bounceRisk: bounceRiskList.length,
    stageCounts,
    sendNowItems: [...sendNowList]
      .sort(byPri)
      .slice(0, 8)
      .map((c) =>
        toItem(c, "pitch", "Send pitch", pitchStatus(c) || undefined),
      ),
    sendBlockedItems: [...sendBlockedList]
      .sort(byPri)
      .slice(0, 8)
      .map((c) => toItem(c, "pitch", "Blocked — need email")),
    awaitingItems: [...awaitingList]
      .sort(byPri)
      .slice(0, 8)
      .map((c) =>
        toItem(
          c,
          "follow-up",
          c.responseStatus
            ? `Awaiting (${c.responseStatus})`
            : "Contacted — follow up",
        ),
      ),
    clientItems: [...clientList]
      .sort(byPri)
      .slice(0, 8)
      .map((c) => toItem(c, "build", "Active client")),
    reviewItems: [...reviewList]
      .sort(byPri)
      .slice(0, 8)
      .map((c) => toItem(c, "pitch", pitchStatus(c) || "In review")),
    agentWorkItems: agentWorkList.slice(0, 15),
    bounceRiskItems: [...bounceRiskList]
      .sort(byPri)
      .slice(0, 8)
      .map((c) => {
        const eg = (c as { emailGate?: { email?: string; reason?: string } })
          .emailGate;
        return toItem(
          c,
          "pitch",
          "Dead email",
          eg?.email,
          eg?.reason || "no MX",
        );
      }),
  };
}

export function getStage(id: StageId): Stage | undefined {
  return getStages().find((stage) => stage.id === id);
}

/** Zero-based position of a stage in the pipeline, or -1 if unknown. */
export function getStageIndex(id: StageId): number {
  return getStages().findIndex((stage) => stage.id === id);
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
  return getStages()
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
