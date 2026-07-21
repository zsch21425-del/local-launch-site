// Vercel serverless — Node.js CommonJS
// Proxy to Redwood visualize API

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ status: 'ok' });

  if (req.method === 'POST') {
    try {
      const response = await fetch('https://redwood-site-jade.vercel.app/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(60000)
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err) {
      return res.status(502).json({ success: false, error: 'Backend unavailable' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
