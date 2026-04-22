import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findStyleInSnapshot, fetchLiveStyle } from '../../_shared/core';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!code) return res.status(400).json({ error: 'missing style code' });

  const live = await fetchLiveStyle(code);
  if (live) return res.status(200).json(live);

  const hit = findStyleInSnapshot(code);
  if (!hit) {
    return res.status(404).json({
      error: `스타일 "${code}"를 찾지 못했습니다.`,
      hint: '운영시즌 25FW / 26SS 범위에서 조회 가능합니다.',
    });
  }
  return res.status(200).json(hit);
}
