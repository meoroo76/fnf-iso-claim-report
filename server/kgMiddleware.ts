import type { Connect } from 'vite';
import type { ServerResponse } from 'http';
import {
  findStyleInSnapshot,
  listStylesFromSnapshot,
  fetchLiveStyle,
  KG_META,
} from './core';

function sendJSON(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function kgMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url) return next();
    const url = new URL(req.url, 'http://x');

    if (url.pathname === '/api/kg/meta') {
      return sendJSON(res, 200, { ...KG_META, live: Boolean(process.env.KG_API_BASE) });
    }

    if (url.pathname.startsWith('/api/kg/style/')) {
      const code = decodeURIComponent(url.pathname.replace('/api/kg/style/', ''));
      if (!code) return sendJSON(res, 400, { error: 'missing style code' });
      const live = await fetchLiveStyle(code);
      if (live) return sendJSON(res, 200, live);
      const hit = findStyleInSnapshot(code);
      if (!hit) {
        return sendJSON(res, 404, {
          error: `스타일 "${code}"를 찾지 못했습니다.`,
          hint: '운영시즌 25FW / 26SS 범위에서 조회 가능합니다.',
        });
      }
      return sendJSON(res, 200, hit);
    }

    if (url.pathname === '/api/kg/styles') {
      const season = url.searchParams.get('season') ?? undefined;
      const brand = url.searchParams.get('brand') ?? undefined;
      return sendJSON(res, 200, {
        meta: { season, brand },
        items: listStylesFromSnapshot(season, brand),
      });
    }

    return next();
  };
}
