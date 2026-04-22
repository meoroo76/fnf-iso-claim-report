import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmailCore, type EmailReq } from '../_shared/core';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const body = req.body as EmailReq;
    if (!body?.to || body.to.length === 0)
      return res.status(400).json({ error: '수신자(to)가 비어있습니다.' });
    const result = await sendEmailCore(body);
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'unknown' });
  }
}
