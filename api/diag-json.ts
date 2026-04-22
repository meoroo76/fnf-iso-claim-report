// Test: can Vercel Functions import any JSON at all?
import type { VercelRequest, VercelResponse } from '@vercel/node';
import tiny from './_shared/tiny.json';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ test: 'tiny-json-import', tiny });
}
