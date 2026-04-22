import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readReportRows } from '../_shared/core.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const items = await readReportRows();
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'unknown' });
  }
}
