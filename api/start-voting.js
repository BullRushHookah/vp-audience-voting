import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { sessionId, pin, options, step, multi } = req.body;
    const raw = await redis.get(`session:${sessionId}`);
    if (!raw) return res.status(404).json({ error: 'session not found' });
    const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (session.pin !== pin) return res.status(403).json({ error: 'wrong pin' });

  const voting = {
        step: step || Date.now().toString(),
        options: options.map((o, i) => ({ id: i, text: o, votes: 0 })),
        multi: !!multi,
        voters: {},
        active: true,
        ts: Date.now()
  };

  await redis.set(`voting:${sessionId}`, JSON.stringify(voting), { ex: 86400 });
    return res.json({ ok: true, step: voting.step, optionCount: options.length });
}
