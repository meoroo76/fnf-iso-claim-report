import type { VercelRequest, VercelResponse } from '@vercel/node';
import { postToTeamsCore, type TeamsReq } from '../_shared/core';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const body = req.body as TeamsReq;
    const result = await postToTeamsCore(body);
    return res.status(200).json({ ...result, ok: result.ok });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'unknown' });
  }
}
