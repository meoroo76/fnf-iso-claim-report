import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listStylesFromSnapshot } from '../_shared/core';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const season = typeof req.query.season === 'string' ? req.query.season : undefined;
  const brand = typeof req.query.brand === 'string' ? req.query.brand : undefined;
  res
    .status(200)
    .json({ meta: { season, brand }, items: listStylesFromSnapshot(season, brand) });
}
