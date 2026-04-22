// No external imports — inline constants
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    test: 'inline',
    totalProducts: 553,
    time: new Date().toISOString(),
  });
}
