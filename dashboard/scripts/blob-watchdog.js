/**
 * LL dashboard Blob watchdog + backup.
 *
 * 1. Read the live Vercel Blob pipeline.json WITH its ETag, retrying on
 *    transient (network/parse) errors.
 * 2. If the read succeeds and the book is non-empty → write a versioned,
 *    validated backup of the *live* content (not the local file) to
 *    data/backups/live/.
 * 3. Only if the Blob is CONFIRMED MISSING (404 / null) do we seed it — and
 *    only from a validated versioned live backup, using a conditional create
 *    (never allowOverwrite over an existing live book).
 * 4. A read error is NEVER treated as permission to overwrite. On a transient
 *    error the watchdog logs and exits non-zero without writing anything.
 *
 * Run from the dashboard dir (needs node_modules/@vercel/blob). Reads the token
 * from .env.local so it never hardcodes secrets.
 */
const { put, get, head } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const DASH = '/mnt/d/LocalLaunch/dashboard';
const PIPELINE_PATH = path.join(DASH, 'data', 'pipeline.json');
const BACKUP_DIR = path.join(DASH, 'data', 'backups');
const LIVE_BACKUP_DIR = path.join(BACKUP_DIR, 'live');
const BLOB_PATH = 'pipeline.json';

const MAX_READ_ATTEMPTS = 3;
const RETRY_DELAY_MS = 4000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadToken() {
  const env = fs.readFileSync(path.join(DASH, '.env.local'), 'utf8');
  const m = env.match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m);
  return m ? m[1] : '';
}

function isNotFound(e) {
  return (
    String(e?.message || e).includes('not found') ||
    e?.statusCode === 404 ||
    e?.name === 'BlobNotFoundError'
  );
}

function isConflict(e) {
  return (
    e?.name === 'BlobPreconditionFailedError' ||
    e?.statusCode === 412 ||
    /precondition failed|already exists/i.test(String(e?.message || ''))
  );
}

/** Snapshot the LOCAL file to a dated backup — purely a local copy, never
 *  touches the Blob. Safe disaster-recovery breadcrumb. */
function backupLocal() {
  if (!fs.existsSync(PIPELINE_PATH)) return false;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const d = new Date().toISOString().slice(0, 10);
  const dest = path.join(BACKUP_DIR, `pipeline-${d}.json`);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(PIPELINE_PATH, dest);
    console.log(`[watchdog] local backup -> ${dest}`);
  }
  return true;
}

/** Persist the successfully-READ live book, tagged with its etag + timestamp.
 *  This is the ONLY sanctioned seed source for a future confirmed-missing heal. */
function backupLive(text, etag) {
  fs.mkdirSync(LIVE_BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const tag = String(etag || 'noetag').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  const dest = path.join(LIVE_BACKUP_DIR, `pipeline-${ts}-${tag}.json`);
  fs.writeFileSync(dest, text);
  console.log(`[watchdog] live backup -> ${dest}`);
  return dest;
}

/** Newest data/backups/live/*.json that parses AND has companies.length > 0. */
function findValidLiveBackup() {
  let files;
  try {
    files = fs.readdirSync(LIVE_BACKUP_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return null;
  }
  files.sort().reverse();
  for (const f of files) {
    try {
      const p = path.join(LIVE_BACKUP_DIR, f);
      const text = fs.readFileSync(p, 'utf8');
      const j = JSON.parse(text);
      if (Array.isArray(j.companies) && j.companies.length > 0) {
        return { path: p, text, companies: j.companies.length };
      }
    } catch {
      // skip corrupt / unparseable backup
    }
  }
  return null;
}

async function readStreamText(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(buf);
}

/**
 * Read the live blob, distinguishing:
 *   { state: 'ok', text, etag, companies }  — read + parsed
 *   { state: 'missing' }                    — 404 / null (genuinely absent)
 *   { state: 'error', error }               — transient failure after retries
 */
async function readLiveBlob(token) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_READ_ATTEMPTS; attempt++) {
    try {
      const meta = await head(BLOB_PATH, { token });
      if (!meta) return { state: 'missing' };
      const got = await get(BLOB_PATH, { access: 'private', token, useCache: false });
      if (!got || !got.stream) return { state: 'missing' };
      const text = await readStreamText(got.stream);
      let j;
      try {
        j = JSON.parse(text);
      } catch (pe) {
        lastErr = new Error(`live blob is not valid JSON: ${pe.message}`);
        console.log(`[watchdog] read attempt ${attempt}/${MAX_READ_ATTEMPTS}: ${lastErr.message}`);
        if (attempt < MAX_READ_ATTEMPTS) await sleep(RETRY_DELAY_MS);
        continue;
      }
      return {
        state: 'ok',
        text,
        etag: got.blob?.etag ?? null,
        companies: Array.isArray(j.companies) ? j.companies.length : 0,
      };
    } catch (e) {
      if (isNotFound(e)) return { state: 'missing' };
      lastErr = e;
      console.log(
        `[watchdog] read attempt ${attempt}/${MAX_READ_ATTEMPTS}: transient error — ${e?.message || e}`,
      );
      if (attempt < MAX_READ_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }
  return { state: 'error', error: lastErr?.message || String(lastErr) };
}

async function main() {
  const token = loadToken();
  if (!token) {
    console.log('[watchdog] ERROR: no BLOB_READ_WRITE_TOKEN in .env.local');
    process.exit(1);
  }

  const r = await readLiveBlob(token);

  // --- Transient read error: do NOT write anything. ---
  if (r.state === 'error') {
    console.log(`[watchdog] ABORT: transient read error — not writing anything. ${r.error}`);
    backupLocal();
    process.exit(1);
  }

  // --- Read OK: back up the live content; never auto-overwrite. ---
  if (r.state === 'ok') {
    console.log(`[watchdog] Blob pipeline.json read OK: ${r.companies} companies (etag ${r.etag})`);
    if (r.companies > 0) {
      backupLive(r.text, r.etag);
    } else {
      console.log(
        '[watchdog] WARNING: live blob exists but has 0 companies. Not auto-overwriting an existing live book — manual review required.',
      );
    }
    backupLocal();
    console.log('[watchdog] done');
    return;
  }

  // --- Confirmed missing: seed from a validated versioned live backup only. ---
  console.log('[watchdog] Blob pipeline.json CONFIRMED MISSING');
  const bk = findValidLiveBackup();
  if (!bk) {
    console.log(
      '[watchdog] ERROR: no validated versioned live backup in data/backups/live — cannot seed. (The local file is NOT used as a seed source.)',
    );
    backupLocal();
    process.exit(1);
  }
  console.log(
    `[watchdog] SEEDING missing blob from ${bk.path} (${bk.companies} companies) via conditional create`,
  );
  try {
    // No allowOverwrite → the SDK throws if the blob already exists, so a
    // concurrent create can never be clobbered.
    await put(BLOB_PATH, bk.text, { access: 'private', token });
    console.log('[watchdog] SEEDED');
  } catch (e) {
    if (isConflict(e)) {
      console.log('[watchdog] seed aborted: blob now exists (concurrent create) — no overwrite performed.');
    } else {
      console.log('[watchdog] seed failed:', e?.message || e);
      backupLocal();
      process.exit(1);
    }
  }
  backupLocal();
  console.log('[watchdog] done');
}

main().catch((e) => {
  console.error('[watchdog] FATAL', e);
  process.exit(1);
});
