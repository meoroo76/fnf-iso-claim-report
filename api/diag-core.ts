// Imports from _shared/core (full chain: core → kgSnapshot + poOverrides)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { KG_META } from './_shared/core.js';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ test: 'core-import', ...KG_META });
}
