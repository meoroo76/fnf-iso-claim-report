import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    message: 'Vercel Functions are working',
    time: new Date().toISOString(),
    node: process.version,
    vercel: Boolean(process.env.VERCEL),
  });
}
