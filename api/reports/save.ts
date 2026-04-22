import type { VercelRequest, VercelResponse } from '@vercel/node';
import { appendReportRow, type ReportLogRow } from '../_shared/core';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const body = req.body as ReportLogRow;
    const result = await appendReportRow(body);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'unknown' });
  }
}
