import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

function id() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
        const sessionId = id();
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        const session = { id: sessionId, pin, created: Date.now(), active: true };
        await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: 86400 });
        return res.json({ sessionId, pin });
  }

  if (req.method === 'GET') {
        const { id: sid } = req.query;
        if (!sid) return res.status(400).json({ error: 'id required' });
        const raw = await redis.get(`session:${sid}`);
        if (!raw) return res.status(404).json({ error: 'not found' });
        const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return res.json(session);
  }

  return res.status(405).json({ error: 'method not allowed' });
}
