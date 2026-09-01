const { put, get } = require('@vercel/blob');
const fs = require('fs');

// Read token from .env.local (durable) — same as blob-watchdog.js.
function loadToken() {
  const env = fs.readFileSync('/mnt/d/LocalLaunch/dashboard/.env.local', 'utf8');
  const m = env.match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m);
  if (!m) throw new Error('no BLOB_READ_WRITE_TOKEN in .env.local');
  return m[1];
}
const token = loadToken();
const pipelinePath = '/mnt/d/LocalLaunch/dashboard/data/pipeline.json';
const data = JSON.parse(fs.readFileSync(pipelinePath, 'utf8'));

console.log('local file:', pipelinePath);
console.log('local companies:', data.companies.length);
console.log('local top keys:', Object.keys(data));

(async () => {
  const jsonStr = JSON.stringify(data, null, 2);
  console.log('seeding Blob (allowOverwrite)...');
  const res = await put('pipeline.json', jsonStr, { access: 'private', allowOverwrite: true, token });
  console.log('put OK ->', res.url);

  // verify
  const got = await get('pipeline.json', { access: 'private', token });
  let text;
  if (typeof got.text === 'function') {
    text = await got.text();
  } else if (got.stream) {
    const reader = got.stream.getReader();
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
    text = new TextDecoder().decode(buf);
  } else {
    text = JSON.stringify(got);
  }
  const j = JSON.parse(text);
  console.log('VERIFY blob companies:', j.companies.length);
  console.log('SEED_OK');
})().catch((e) => { console.error('ERR', e); process.exit(1); });
