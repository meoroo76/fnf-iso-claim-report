import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    email: Boolean(process.env.SMTP_HOST),
    teams: Boolean(process.env.TEAMS_WEBHOOK_URL),
    mode: process.env.SMTP_HOST || process.env.TEAMS_WEBHOOK_URL ? 'live' : 'simulation',
  });
}
