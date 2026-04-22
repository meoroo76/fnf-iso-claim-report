// Imports ONLY the KG_META constant from kgSnapshot (not RAW_KG)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { KG_META } from './_shared/kgSnapshot';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ test: 'snapshot-import', ...KG_META });
}
