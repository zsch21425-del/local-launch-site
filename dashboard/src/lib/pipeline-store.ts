import { put, get, BlobPreconditionFailedError } from "@vercel/blob";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Shared pipeline store: reads/writes data/pipeline.json locally AND syncs to
 * Vercel Blob when BLOB_READ_WRITE_TOKEN is present. This gives cross-device
 * persistence (approvals made on Vercel stick and sync back to localhost).
 *
 * Concurrency: writes use ETag optimistic-concurrency (ifMatch) so rapid
 * approvals/reworks never clobber each other (the lost-update bug). All
 * POST/PATCH routes MUST go through mutatePipeline().
 */

const PIPELINE_PATH = path.join(process.cwd(), "data", "pipeline.json");
const BLOB_PATH = "pipeline.json";

function getToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || undefined;
}

async function readBlobStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(buf);
}

/** True when running on Vercel's serverless runtime (read-only filesystem). */
const IS_SERVERLESS = !!process.env.VERCEL;

/**
 * One-time migration of the legacy stage vocabulary (pre 2026-09-09) to the
 * 7-stage prospecting funnel + won/building section. Renames
 * `contacted`→`outreach`, `response`→`follow-up`, and splits the overloaded
 * `pitch` stage into `quality-check` / `approval` / `outreach` by pitch status.
 * Idempotent — repairs known legacy inconsistencies as well as stage names.
 * Returns true if any row or migration metadata changed.
 */
const NEW_STAGES = [
  { id: "prospect", label: "Prospects", icon: "Search", color: "slate" },
  { id: "audit", label: "Audit", icon: "Clipboard", color: "blue" },
  { id: "pitch", label: "Pitch", icon: "Megaphone", color: "amber" },
  { id: "quality-check", label: "Quality check", icon: "ShieldCheck", color: "violet" },
  { id: "approval", label: "Approval", icon: "ClipboardCheck", color: "sky" },
  { id: "outreach", label: "Outreach", icon: "Send", color: "emerald" },
  { id: "follow-up", label: "Follow up", icon: "RefreshCw", color: "orange" },
  { id: "sale", label: "Sale", icon: "Trophy", color: "green" },
  { id: "build-launch", label: "Build & Launch", icon: "Rocket", color: "cyan" },
];

export function migrateLegacyStages(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  let changed = false;
  if (Array.isArray(data.companies)) {
    // Scope the historical build-stage repair to the identified legacy leads,
    // once per book. A sent pitch is normal history for a paying client; never
    // demote arbitrary/current clients based on that status or a name allowlist.
    const legacyBuildLeads = new Set([
      "omega-auto", "lumberjack-tree", "upstate-window", "fix-home",
      "mmk-pressure-washing", "sky-branch-llc", "gotta-guy-home-services",
      "home-shield-roofing", "gulottas-window", "milford-mountain",
      "sbc-handyman", "kanebreak-backyards", "wright-time-disposal",
      "all-in-one-maintenance", "fresh-blades-lawn",
      "fresh-start-pressure-washing", "tree-wisemen-upstate",
      "brb-pressure-washing",
    ]);
    const repairLegacyBuild = data.legacyBuildStageMigrationVersion !== 1;
    for (const c of data.companies) {
      if (!c || typeof c !== "object") continue;
      const original = c.stage;
      const ps = c.pitchDraft?.status;
      let next = original;
      if (repairLegacyBuild && next === "build-launch" && legacyBuildLeads.has(c.id)) {
        next = c.id === "omega-auto" && !ps ? "prospect" : "pitch";
      }
      if (next === "contacted") next = "outreach";
      else if (next === "response") next = "follow-up";

      if (next === "pitch") {
        if (ps === "pending-review" || ps === "pending-supervisor-review" || ps === "pending") next = "quality-check";
        else if (ps === "supervisor-approved" || ps === "zach-approved") next = "approval";
        else if (ps === "sent") next = "outreach";
        else if (ps === "bounced") next = "follow-up";
      }
      // An explicitly unproven send is not delivery evidence. Missing drafts
      // need writing; existing drafts need quality review before approval.
      if (ps === "unproven-send" && ["pitch", "outreach", "follow-up"].includes(next)) {
        next = String(c.pitchDraft?.body ?? "").trim() ? "quality-check" : "pitch";
      }
      if (ps === "bounced" && ["prospect", "outreach"].includes(next)) next = "follow-up";

      // Apply the demo gate LAST, including legacy build-stage repairs. Empty
      // demo.url must fall back to demoUrl; absent status means pending, as in
      // getDemoQueue(). Do not infer a live demo from pitchDraft.demoUrl.
      const demoUrl = String(c.demo?.url ?? "").trim() || String(c.demoUrl ?? "").trim();
      const demoStatus = c.demo?.status ?? "pending";
      if (demoUrl && demoStatus === "pending" &&
          (["outreach", "follow-up"].includes(next) ||
           (ps === "unproven-send" && ["pitch", "quality-check"].includes(next)))) {
        next = "approval";
      }
      if (next !== original) {
        c.stage = next;
        changed = true;
      }
    }
    if (repairLegacyBuild) {
      data.legacyBuildStageMigrationVersion = 1;
      changed = true;
    }
  }
  // Rewrite the stages array too (labels + the two new stages).
  const stagesArr = Array.isArray(data.stages)
    ? data.stages
    : data.pipeline?.stages;
  if (Array.isArray(stagesArr) && stagesArr.length) {
    const hasLegacy = stagesArr.some(
      (s: any) => s?.id === "contacted" || s?.id === "response",
    );
    const hasQuality = stagesArr.some((s: any) => s?.id === "quality-check");
    if (hasLegacy || !hasQuality) {
      if (Array.isArray(data.stages)) data.stages = NEW_STAGES;
      else if (data.pipeline) data.pipeline.stages = NEW_STAGES;
      changed = true;
    }
  }
  return changed;
}

/** Read pipeline data + its ETag (for optimistic concurrency). */
async function readPipelineWithEtag(): Promise<{ data: any; etag: string | null }> {
  const token = getToken();
  if (token) {
    // Blob-backed mode. The live Blob is the ONLY source of truth here — a
    // failed/garbled read must NOT silently fall back to the local file, or a
    // subsequent mutatePipeline() would put() stale local data over the live
    // book (data-loss bug C02). Instead we fail closed: return {data:null},
    // which trips mutatePipeline()'s "store empty or unreadable" guard.
    let res: Awaited<ReturnType<typeof get>>;
    try {
      // useCache:false → mutation reads (and read-after-write) hit origin, not
      // a stale CDN copy that would hand back an outdated ETag (bug H03).
      res = await get(BLOB_PATH, { access: "private", token, useCache: false });
    } catch (e: any) {
      const notFound =
        e?.message?.includes("not found") ||
        e?.statusCode === 404 ||
        e?.name === "BlobNotFoundError";
      if (notFound) return { data: null, etag: null }; // valid "empty/missing" state
      console.warn("Blob read failed — failing closed (no local fallback):", e?.message);
      return { data: null, etag: null };
    }
    // get() resolves to null when the blob does not exist.
    if (!res || !res.stream) return { data: null, etag: null };
    try {
      const text = await readBlobStream(res.stream);
      const data = JSON.parse(text);
      migrateLegacyStages(data);
      return { data, etag: res.blob?.etag ?? null };
    } catch (e: any) {
      console.warn("Blob body unreadable/invalid — failing closed:", e?.message);
      return { data: null, etag: null };
    }
  }
  // No token configured → explicit local-only mode; the file is the store.
  if (!IS_SERVERLESS && fs.existsSync(PIPELINE_PATH)) {
    const data = JSON.parse(fs.readFileSync(PIPELINE_PATH, "utf-8"));
    migrateLegacyStages(data);
    return { data, etag: null };
  }
  return { data: null, etag: null };
}

/** Read pipeline data (no etag) — used by GET routes. */
export async function readPipeline() {
  const { data } = await readPipelineWithEtag();
  return data;
}

/** Read pipeline data, returning {companies, ...} and handling errors. */
export async function readPipelineSafe() {
  try {
    const data = await readPipeline();
    if (data && typeof data === "object") return data;
    return { companies: [] };
  } catch (e) {
    return { companies: [] };
  }
}

/**
 * Like readPipelineSafe(), but distinguishes a genuinely EMPTY-but-valid book
 * (`{ companies: [] }` — e.g. after the last lead was deleted) from a
 * missing/unreadable store (M09). Callers that need to permit "add the first
 * lead" or render a real zero state must branch on `readable`, not on
 * `companies.length`.
 *
 *   readable:false            → storage is missing/garbled → surface an error
 *   readable:true, companies:[] → a valid empty book → show zero state, allow adds
 */
export async function readPipelineState(): Promise<{
  readable: boolean;
  data: { companies: any[]; [k: string]: any } | null;
}> {
  try {
    const data = await readPipeline();
    if (data && typeof data === "object") {
      const companies = Array.isArray((data as any).companies)
        ? (data as any).companies
        : [];
      return { readable: true, data: { ...(data as any), companies } };
    }
    return { readable: false, data: null };
  } catch {
    return { readable: false, data: null };
  }
}

/** Write pipeline data with ETag conditional (optimistic concurrency). */
async function writePipelineWithEtag(
  data: unknown,
  etag: string | null,
): Promise<{ ok: boolean; error?: string; conflict?: boolean }> {
  const jsonStr = JSON.stringify(data, null, 2);
  const token = getToken();

  const writeLocalMirror = (): { ok: boolean; error?: string } => {
    try {
      const dir = path.dirname(PIPELINE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(PIPELINE_PATH, jsonStr, "utf-8");
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  };

  if (token) {
    // Commit to the Blob FIRST — it is the source of truth. Only touch the
    // local mirror once the authoritative write has succeeded, so a caller
    // never sees {ok:true} for a commit that didn't land (bug C02).
    try {
      await put(BLOB_PATH, jsonStr, {
        access: "private",
        allowOverwrite: true,
        token,
        ...(etag ? { ifMatch: etag } : {}),
      });
    } catch (e: any) {
      const conflict =
        e instanceof BlobPreconditionFailedError ||
        e?.name === "BlobPreconditionFailedError" ||
        e?.statusCode === 412;
      if (conflict) return { ok: false, conflict: true, error: "Concurrent write conflict" };
      return { ok: false, error: e?.message || String(e) };
    }
    // Blob committed. Refresh the local mirror with the COMMITTED json
    // (best-effort — the durable copy already exists on the Blob).
    if (!IS_SERVERLESS) {
      const m = writeLocalMirror();
      if (!m.ok) console.warn("Local mirror refresh failed (Blob commit is durable):", m.error);
    }
    return { ok: true };
  }

  // No token → local-only mode; the file is the only store.
  if (IS_SERVERLESS) {
    return { ok: false, error: "No persistent store available on serverless" };
  }
  return writeLocalMirror();
}

/** Backward-compat write (no etag — last-write-wins). Prefer mutatePipeline(). */
export async function writePipeline(data: unknown): Promise<{ ok: boolean; error?: string }> {
  const w = await writePipelineWithEtag(data, null);
  return { ok: w.ok, error: w.error };
}

/**
 * Atomic read-modify-write with optimistic-concurrency retry.
 * The ONLY safe way to update pipeline state — use this in every POST/PATCH route.
 */
export async function mutatePipeline<T>(
  mutator: (data: any) => T | Promise<T>,
): Promise<{ ok: boolean; error?: string; result?: T }> {
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { data, etag } = await readPipelineWithEtag();
    if (!data || typeof data !== "object") {
      return { ok: false, error: "Pipeline store empty or unreadable" };
    }
    const result = await mutator(data);
    const w = await writePipelineWithEtag(data, etag);
    if (w.ok) return { ok: true, result };
    if (!w.conflict) return { ok: false, error: w.error };
    // conflict → loop and retry with a fresh read + re-apply the mutation
  }
  return { ok: false, error: `Concurrent write conflict after ${MAX_RETRIES} retries` };
}
