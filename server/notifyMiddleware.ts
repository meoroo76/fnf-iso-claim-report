import type { Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  sendEmailCore,
  postToTeamsCore,
  type EmailReq,
  type TeamsReq,
} from './core';

function readBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function notifyMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url) return next();

    if (req.url === '/api/notify/email' && req.method === 'POST') {
      try {
        const body = await readBody<EmailReq>(req);
        if (!body.to || body.to.length === 0)
          return sendJSON(res, 400, { error: '수신자(to)가 비어있습니다.' });
        const result = await sendEmailCore(body);
        return sendJSON(res, 200, { ok: true, ...result });
      } catch (e) {
        return sendJSON(res, 500, { ok: false, error: e instanceof Error ? e.message : 'unknown' });
      }
    }

    if (req.url === '/api/notify/teams' && req.method === 'POST') {
      try {
        const body = await readBody<TeamsReq>(req);
        const result = await postToTeamsCore(body);
        return sendJSON(res, 200, { ...result, ok: result.ok });
      } catch (e) {
        return sendJSON(res, 500, { ok: false, error: e instanceof Error ? e.message : 'unknown' });
      }
    }

    if (req.url === '/api/notify/status' && req.method === 'GET') {
      return sendJSON(res, 200, {
        email: Boolean(process.env.SMTP_HOST),
        teams: Boolean(process.env.TEAMS_WEBHOOK_URL),
        mode:
          process.env.SMTP_HOST || process.env.TEAMS_WEBHOOK_URL ? 'live' : 'simulation',
      });
    }

    return next();
  };
}
