// Local Launch contact API — sends via Resend (verified domain locallaunchupstate.com).
// Aug 7 2026: switched from Gmail SMTP (emails landed in SPAM) to Resend API
// (DKIM/SPF/DMARC from verified domain → inbox deliverability).
// Requires Vercel env: RESEND_API_KEY, LL_BUSINESS_EMAIL, LL_TEXT_ALERT (optional).

const SENDER = "Local Launch <zach@locallaunchupstate.com>";

// Neon Postgres connection for pipeline integration
let pool = null;
function getPool() {
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function resend({ to, subject, html, text, replyTo, attachments = [] }) {
  const body = { from: SENDER, to, subject, html, reply_to: replyTo, attachments };
  if (text) body.text = text;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Resend ${r.status}: ${errText}`);
  }
  return r.json();
}

// Real Twilio SMS (A2P/toll-free approved). Env-guarded — safe to deploy before approval;
// sends only when TWILIO_SID + TWILIO_FROM_NUMBER + LL_SMS_TO are configured.
async function sendTwilioSms(body) {
  const sid = process.env.TWILIO_SID || "";
  const auth = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_FROM_NUMBER || "";
  const to = process.env.LL_SMS_TO || "";
  if (!(sid && auth && from && to)) {
    console.log("Twilio SMS not configured — skipping");
    return { skipped: true };
  }
  const params = new URLSearchParams({ From: from, To: to, Body: body });
  const r = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${sid}:${auth}`).toString("base64")}`,
      },
      body: params.toString(),
    }
  );
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Twilio ${r.status}: ${errText.slice(0, 200)}`);
  }
  return r.json();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, name, email, phone, trade, company, message, website, business, ideas, attachments = [] } = req.body || {};
  const isDemoRequest = type === "demo_webpage";

  if (!name || (isDemoRequest ? !email : !phone)) {
    return res.status(400).json({
      error: isDemoRequest ? "Name and email are required" : "Name and phone are required",
    });
  }

  if (!Array.isArray(attachments) || attachments.length > 5) {
    return res.status(400).json({ error: "You can upload up to 5 files" });
  }

  const attachmentBytes = attachments.reduce((total, file) => {
    return total + (typeof file?.content === "string" ? file.content.length : 0);
  }, 0);
  if (attachmentBytes > 4_000_000) {
    return res.status(400).json({ error: "Your files are too large. Keep the total under 3 MB." });
  }

  const escapeHtml = (value) => String(value || "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  try {
    const inbox = process.env.LL_BUSINESS_EMAIL;

    // Main email to the Local Launch inbox (watched by the email watcher cron).
    await resend({
      to: inbox,
      replyTo: isDemoRequest ? email : inbox,
      subject: isDemoRequest
        ? `Free demo webpage request — ${name}`
        : `Local Launch inquiry — ${name}`,
      html: isDemoRequest ? `
        <h2>New Free Demo Webpage Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Current website:</strong> ${escapeHtml(website)}</p>
        <p><strong>Business:</strong></p>
        <p>${escapeHtml(business).replace(/\n/g, "<br>")}</p>
        <p><strong>Design ideas / context:</strong></p>
        <p>${escapeHtml(ideas).replace(/\n/g, "<br>")}</p>
      ` : `
        <h2>New Local Launch Inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Trade:</strong> ${escapeHtml(trade)}</p>
        <p><strong>Company/Website:</strong> ${escapeHtml(company)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
      attachments: isDemoRequest && attachments.length
        ? attachments.map((file) => ({
            filename: String(file?.filename || "reference"),
            content: String(file?.content || ""), // base64 — Resend decodes
          }))
        : [],
    });

    // SMS text alert — Twilio only. Carriers (T-Mobile/AT&T) no longer deliver
    // email-to-SMS gateway messages, so no gateway fallback (verified 2026-08).
    const smsBody = isDemoRequest
      ? `Local Launch: Free demo request | ${name || "?"} | ${phone || email || "no contact"}`
      : `Local Launch: Inquiry | ${name || "?"} | ${phone || "no phone"} | ${trade || ""}`.trim();
    try {
      const twRes = await sendTwilioSms(smsBody);
      if (!twRes.skipped) {
        console.log(`Twilio SMS sent (${twRes.sid || "ok"})`);
      }
    } catch (smsErr) {
      console.error(`SMS alert failed (${smsErr.message}) — main email already sent`);
    }

    // Auto-reply to the lead (fire-and-forget): instant confirmation.
    const leadEmail = isDemoRequest ? email : null;
    if (leadEmail) {
      try {
        await resend({
          to: leadEmail,
          subject: "Got it — we'll be in touch within 24 hours (Local Launch)",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0d0f0e;color:#f2f0eb;border-radius:12px">
              <h2 style="color:#2aa8a8;margin:0 0 12px">Thanks, ${escapeHtml(name)}! 🚀</h2>
              <p>We got your ${isDemoRequest ? "free demo webpage request" : "inquiry"} and we're on it.</p>
              <p style="color:#b8b3a8">We'll review your details and get back to you <strong>within 24 hours</strong> (usually much faster).</p>
              <hr style="border:none;border-top:1px solid #2a2d2b;margin:20px 0">
              <p style="font-size:13px;color:#8a857a">Local Launch — websites &amp; SEO for small businesses in the Upstate SC.<br>
              <a href="https://locallaunchupstate.com" style="color:#2aa8a8">locallaunchupstate.com</a></p>
            </div>
          `,
        });
        console.log(`Auto-reply sent to lead ${leadEmail}`);
      } catch (ackErr) {
        console.error(`Auto-reply failed (${ackErr.message}) — main email already sent`);
      }
    }

    // Fire-and-forget: write to Neon pipeline so OS agents see this lead
    try {
      const p = getPool();
      await p.query(
        `INSERT INTO agent_messages (client_id, message, status)
         VALUES ($1, $2, 'pending')`,
        [
          name.replace(/\s+/g, "-").toLowerCase(),
          `WEBSITE INQUIRY: ${name} | Phone: ${phone || "not given"} | Trade: ${trade || "not given"} | ${company ? "Company: " + company : ""} | Message: ${message || "No message"}`
        ],
      );
      console.log(`Pipeline: lead ${name} written to Neon`);
    } catch (dbErr) {
      console.error(`Pipeline write failed (${dbErr.message}) — email already sent`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Mail error:", e);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
