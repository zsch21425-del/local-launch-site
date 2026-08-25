// Vercel serverless function for CC Headlight contact form
// Receives form submissions, emails them via Resend API

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, vehicle, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    // Leads go to the owner by default; allow multiple recipients (comma-separated).
    // Resend `to` accepts an array — send to owner AND keep Zach (account) in the loop.
    const TO_EMAIL = (process.env.CONTACT_EMAIL || 'cjc.headlightrestoration@gmail.com')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const html = `
      <h2>New CC Headlight Restoration Lead</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Vehicle:</strong> ${vehicle || 'Not provided'}</p>
      <p><strong>Message:</strong></p>
      <p>${message || 'No message'}</p>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CC Headlight Restoration <noreply@locallaunchupstate.com>',
        to: TO_EMAIL,
        subject: `New Headlight Restoration Lead: ${name}`,
        html,
        reply_to: email,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Resend error');

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Contact form error:', e);
    return res.status(500).json({ error: e.message });
  }
}
