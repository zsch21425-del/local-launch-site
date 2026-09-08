#!/usr/bin/env node
/**
 * Agent Message Processor — polls DB for pending messages,
 * forwards to Supervisor API, writes replies back.
 * Bridges dashboard (Vercel) ↔ Supervisor (localhost:9912)
 */
const { Pool } = require('pg');
const http = require('http');
const fs = require('fs');

// Secrets live in the gitignored .env.local (env var wins if set). Never
// hardcode the Neon password — read it here. Rotated out-of-band.
function secret(key) {
  const fromEnv = process.env[key];
  if (fromEnv) return fromEnv;
  try {
    const m = fs
      .readFileSync("/mnt/d/LocalLaunch/dashboard/.env.local", "utf8")
      .match(new RegExp(`^${key}="?([^"\\r\\n]+)"?`, "m"));
    return (m && m[1]) || "";
  } catch {
    return "";
  }
}

const DATABASE_URL = secret("DATABASE_URL");
const SUPERVISOR_URL = process.env.SUPERVISOR_URL || 'http://127.0.0.1:9912/v1/chat/completions';

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set — add it to .env.local (do NOT hardcode the Neon password).');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: true } });

const SYSTEM_PROMPT = `You are the Local Launch Supervisor agent, embedded in the dashboard. You have access to the full pipeline.

Your capabilities:
- Check pipeline status for any client
- Approve/reject pitches
- Answer questions about Local Launch services
- Update client stages
- Report revenue and metrics

Current data lives in:
- Vault: /mnt/d/Documents/Hermes Vault/Local Launch/
- Dashboard: https://dashboard-eight-sage-89.vercel.app

Pricing: $300 one-time (site+SEO+GBP), $49/mo optional
Phone: (503) 358-5860
Email: locallaunchupstate@gmail.com

Be concise, direct, and helpful. Reference specific client data when relevant.`;

async function processMessages() {
  const client = await pool.connect();
  try {
    // Get pending messages
    const { rows } = await client.query(
      `SELECT id, client_id, message FROM agent_messages WHERE status = 'pending' ORDER BY created_at ASC LIMIT 5`
    );

    for (const row of rows) {
      console.log(`Processing msg ${row.id} for client ${row.client_id}: "${row.message.slice(0, 80)}..."`);

      try {
        const body = JSON.stringify({
          model: 'deepseek-v4-flash',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `[Client: ${row.client_id}] ${row.message}` }
          ],
          max_tokens: 500
        });

        const reply = await fetch(SUPERVISOR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(30000)
        });

        const data = await reply.json();
        const content = data?.choices?.[0]?.message?.content || 'No response from agent.';

        await client.query(
          `UPDATE agent_messages SET reply = $1, status = 'done', processed_at = NOW() WHERE id = $2`,
          [content, row.id]
        );

        console.log(`✅ Replied to msg ${row.id}`);
      } catch (err) {
        console.error(`❌ Error processing msg ${row.id}:`, err.message);
        await client.query(
          `UPDATE agent_messages SET reply = $1, status = 'error', processed_at = NOW() WHERE id = $2`,
          [`Error: ${err.message}`, row.id]
        );
      }
    }
  } finally {
    client.release();
  }
}

// Ensure table exists
async function ensureTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_messages (
        id SERIAL PRIMARY KEY,
        client_id TEXT NOT NULL DEFAULT 'unknown',
        message TEXT NOT NULL,
        reply TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      )
    `);
    console.log('✅ agent_messages table ready');
  } finally {
    client.release();
  }
}

async function main() {
  await ensureTable();
  console.log('🚀 Agent processor started — polling every 3s');
  console.log(`   Supervisor: ${SUPERVISOR_URL}`);

  // Process immediately, then every 3 seconds
  await processMessages();
  setInterval(processMessages, 3000);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
