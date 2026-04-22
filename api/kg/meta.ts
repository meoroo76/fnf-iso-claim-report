import type { VercelRequest, VercelResponse } from '@vercel/node';
import { KG_META } from '../_shared/core';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ...KG_META, live: Boolean(process.env.KG_API_BASE) });
}
