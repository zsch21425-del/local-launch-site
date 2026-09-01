/**
 * LL dashboard Blob watchdog + backup.
 *
 * 1. Verify the Vercel Blob still holds pipeline.json with companies.length > 0.
 * 2. If empty/missing → re-seed from the local data/pipeline.json (the durable
 *    source of truth, 264 companies) so the dashboard self-heals.
 * 3. Always write a dated backup of the local file to data/backups/.
 *
 * Run from the dashboard dir (needs node_modules/@vercel/blob). Reads the token
 * from .env.local so it never hardcodes secrets.
 */
const { put, get, head } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const DASH = '/mnt/d/LocalLaunch/dashboard';
const PIPELINE_PATH = path.join(DASH, 'data', 'pipeline.json');
const BLOB_PATH = 'pipeline.json';

function loadToken() {
  const env = fs.readFileSync(path.join(DASH, '.env.local'), 'utf8');
  const m = env.match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m);
  return m ? m[1] : '';
}

function backup() {
  if (!fs.existsSync(PIPELINE_PATH)) return false;
  const dir = path.join(DASH, 'data', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const d = new Date().toISOString().slice(0, 10);
  const dest = path.join(dir, `pipeline-${d}.json`);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(PIPELINE_PATH, dest);
    console.log(`[watchdog] backup -> ${dest}`);
  }
  return true;
}

async function main() {
  const token = loadToken();
  if (!token) {
    console.log('[watchdog] ERROR: no BLOB_READ_WRITE_TOKEN in .env.local');
    process.exit(1);
  }

  let blobCompanies = -1;
  let missing = false;
  try {
    const obj = await head(BLOB_PATH, { token });
    // head returns null if missing
    if (!obj) {
      missing = true;
      console.log('[watchdog] Blob pipeline.json MISSING');
    } else {
      const got = await get(BLOB_PATH, { access: 'private', token });
      let text;
      if (typeof got.text === 'function') text = await got.text();
      else text = await readStreamText(got.stream);
      const j = JSON.parse(text);
      blobCompanies = (j.companies || []).length;
      console.log(`[watchdog] Blob pipeline.json has ${blobCompanies} companies`);
    }
  } catch (e) {
    if (String(e?.message || e).includes('not found') || e?.statusCode === 404) {
      missing = true;
      console.log('[watchdog] Blob pipeline.json MISSING (404)');
    } else {
      console.log('[watchdog] Blob read error:', e?.message || e);
    }
  }

  if (missing || blobCompanies === 0 || blobCompanies === -1) {
    if (!fs.existsSync(PIPELINE_PATH)) {
      console.log('[watchdog] ERROR: local pipeline.json missing too — cannot heal');
      process.exit(1);
    }
    const local = JSON.parse(fs.readFileSync(PIPELINE_PATH, 'utf8'));
    const n = (local.companies || []).length;
    console.log(`[watchdog] HEALING: re-seeding Blob from local (${n} companies)`);
    await put(BLOB_PATH, JSON.stringify(local, null, 2), {
      access: 'private',
      allowOverwrite: true,
      token,
    });
    console.log('[watchdog] HEALED');
  }

  backup();
  console.log('[watchdog] done');
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
  for (const c of chunks) { buf.set(c, off); off += c.length; }
  return new TextDecoder().decode(buf);
}

main().catch((e) => { console.error('[watchdog] FATAL', e); process.exit(1); });
