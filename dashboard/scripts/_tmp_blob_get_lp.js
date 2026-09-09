const { get } = require('@vercel/blob');
const fs = require('fs');
const env = fs.readFileSync('/mnt/d/LocalLaunch/dashboard/.env.local', 'utf8');
const m = env.match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m);
if (!m) throw new Error('no token');
const token = m[1];
(async () => {
  const got = await get('pipeline.json', { access: 'private', token });
  const reader = got.stream.getReader();
  const chunks = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
  const buf = new Uint8Array(chunks.reduce((s,c)=>s+c.length,0)); let off=0;
  for (const c of chunks) { buf.set(c, off); off += c.length; }
  const j = JSON.parse(new TextDecoder().decode(buf));
  const co = j.companies.find(c => c.id === 'lightning-pest');
  console.log('BLOB companies:', j.companies.length);
  console.log('BLOB lightning-pest:', JSON.stringify(co, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
