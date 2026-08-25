import { put, get } from "@vercel/blob";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Shared pipeline store: reads/writes data/pipeline.json locally AND syncs to
 * Vercel Blob when BLOB_READ_WRITE_TOKEN is present. This gives cross-device
 * persistence (approvals made on Vercel stick and sync back to localhost).
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

/** Read pipeline data. On serverless, only Blob is readable. On local, prefer Blob then local file. */
export async function readPipeline() {
  const token = getToken();
  if (token) {
    try {
      const res = await get(BLOB_PATH, { access: "private", token });
      if (res?.stream) {
        const text = await readBlobStream(res.stream);
        return JSON.parse(text);
      }
    } catch (e: any) {
      if (e?.message?.includes("not found") || e?.statusCode === 404) {
        // continue to local (if not serverless)
      } else {
        console.warn("Blob read failed, using local:", e?.message);
      }
    }
  }
  // Local fallback only on non-serverless (serverless fs is read-only)
  if (!IS_SERVERLESS && fs.existsSync(PIPELINE_PATH)) {
    return JSON.parse(fs.readFileSync(PIPELINE_PATH, "utf-8"));
  }
  return null;
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

/** Write pipeline data. On serverless, only Blob; on local, Blob + local file. */
export async function writePipeline(data: unknown): Promise<{ ok: boolean; error?: string }> {
  const jsonStr = JSON.stringify(data, null, 2);

  // Local write only on non-serverless (Vercel fs is read-only)
  if (!IS_SERVERLESS) {
    try {
      const dir = path.dirname(PIPELINE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(PIPELINE_PATH, jsonStr, "utf-8");
    } catch (e: any) {
      // Local write failed — if Blob is available, continue; otherwise surface.
      if (!getToken()) return { ok: false, error: e.message };
    }
  }

  // Blob write (cross-device durable) — REQUIRED on serverless, best-effort on local
  const token = getToken();
  if (token) {
    try {
      await put(BLOB_PATH, jsonStr, {
        access: "private",
        allowOverwrite: true,
        token,
      });
      return { ok: true };
    } catch (e: any) {
      // On serverless, Blob is the only store — failure is fatal.
      if (IS_SERVERLESS) return { ok: false, error: e.message };
      console.warn("Blob write failed (local still persisted):", e?.message);
      return { ok: true };
    }
  }
  // No Blob token and no local write possible
  return IS_SERVERLESS ? { ok: false, error: "No persistent store available on serverless" } : { ok: true };
}
