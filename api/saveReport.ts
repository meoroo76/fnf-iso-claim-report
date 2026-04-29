// Vercel Function — POST /api/saveReport
//
// Appends one row per claim report to a configured Google Sheet.
// Auth via Service Account JSON (GOOGLE_SERVICE_ACCOUNT_JSON env var).
// Target sheet ID via GOOGLE_SHEET_ID env var.
//
// Designed to be FIRE-AND-FORGET from the client — never blocks the report
// flow. If the sheet write fails, the report still generates locally and the
// user can retry later.
//
// Implementation note (2026-04-29): replaced the heavy `googleapis` SDK
// (~2.4MB, slow cold start, opaque hangs in Vercel Fluid Compute) with the
// lightweight `google-auth-library` JWT client + a direct `fetch` call against
// the Sheets v4 REST endpoint. Step-by-step `console.log` lines are intentional
// — they surface in Vercel Runtime Logs so any future hang has a precise
// last-known line.

import { JWT } from 'google-auth-library';
import { z } from 'zod';

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

const RequestSchema = z.object({
  claimNo: z.string(),
  inspectionDate: z.string(),
  inspector: z.string().optional().default(''),
  brand: z.string(),
  styleCode: z.string(),
  productName: z.string().optional().default(''),
  category: z.string().optional().default(''),
  season: z.string().optional().default(''),
  color: z.string().optional().default(''),
  colorCode: z.string().optional().default(''),
  supplier: z.string().optional().default(''),
  supplierVendorCode: z.string().optional().default(''),
  poNumber: z.string().optional().default(''),
  receivedQty: z.number().int().nonnegative(),
  totalDefectQty: z.number().int().nonnegative(),
  defectRate: z.number(),
  severity: z.string(),
  thirdLanguage: z.string().optional().default('vi'),
  defectCategories: z.string(),
  defectsJson: z.string(),
  translationsJson: z.string(),
  guidanceKo: z.string().optional().default(''),
  guidanceEn: z.string().optional().default(''),
  guidanceThird: z.string().optional().default(''),
  aiSource: z.string().optional().default('unknown'),
  defectPhotoCount: z.number().int().nonnegative(),
  careLabelPhotoCount: z.number().int().nonnegative(),
});

type RequestPayload = z.infer<typeof RequestSchema>;

// Header order — MUST match the row order pushed below. Keep in sync with the
// Google Sheet header row (row 1). Adding a column? Append at the end here AND
// in the sheet — never reorder existing columns (would shift historical data).
export const SHEET_COLUMNS = [
  'created_at',
  'claim_no',
  'inspection_date',
  'inspector',
  'brand',
  'style_code',
  'product_name',
  'category',
  'season',
  'color',
  'color_code',
  'supplier',
  'supplier_vendor_code',
  'po_number',
  'received_qty',
  'total_defect_qty',
  'defect_rate_pct',
  'severity',
  'third_language',
  'defect_categories',
  'defects_json',
  'translations_json',
  'guidance_ko',
  'guidance_en',
  'guidance_third',
  'ai_source',
  'defect_photo_count',
  'care_label_photo_count',
] as const;

function buildRow(p: RequestPayload): (string | number)[] {
  const createdAt = new Date().toISOString();
  return [
    createdAt,
    p.claimNo,
    p.inspectionDate,
    p.inspector,
    p.brand,
    p.styleCode,
    p.productName,
    p.category,
    p.season,
    p.color,
    p.colorCode,
    p.supplier,
    p.supplierVendorCode,
    p.poNumber,
    p.receivedQty,
    p.totalDefectQty,
    Number(p.defectRate.toFixed(3)),
    p.severity,
    p.thirdLanguage,
    p.defectCategories,
    p.defectsJson,
    p.translationsJson,
    p.guidanceKo,
    p.guidanceEn,
    p.guidanceThird,
    p.aiSource,
    p.defectPhotoCount,
    p.careLabelPhotoCount,
  ];
}

interface ServiceAccountCreds {
  client_email: string;
  private_key: string;
}

function getServiceAccountCredentials(): ServiceAccountCreds {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set');
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error('Invalid service account JSON — missing client_email or private_key');
    }
    // Vercel env UI sometimes double-escapes \n in multi-line strings; normalize.
    if (typeof parsed.private_key === 'string' && parsed.private_key.includes('\\n')) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch (err) {
    throw new Error(
      `Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

// Wrap any promise with a hard timeout. Surfaces a meaningful error instead of
// letting Vercel's 30s function timeout swallow the cause.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function getAccessToken(creds: ServiceAccountCreds): Promise<string> {
  console.log('[saveReport] step=jwt_create');
  const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  console.log('[saveReport] step=jwt_authorize');
  const tokenRes = await withTimeout(client.authorize(), 8_000, 'jwt_authorize');
  if (!tokenRes.access_token) {
    throw new Error('JWT authorize returned no access_token');
  }
  console.log('[saveReport] step=jwt_authorize_ok');
  return tokenRes.access_token;
}

async function appendRow(
  accessToken: string,
  sheetId: string,
  tab: string,
  row: (string | number)[]
): Promise<{ updatedRange: string | null }> {
  const range = `${tab}!A:AB`;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}` +
    `/values/${encodeURIComponent(range)}:append` +
    `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  console.log('[saveReport] step=sheets_append_request', { tab });
  const resp = await withTimeout(
    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }),
    10_000,
    'sheets_append_fetch'
  );

  console.log('[saveReport] step=sheets_append_response', { status: resp.status });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Sheets API ${resp.status}: ${text.slice(0, 500)}`);
  }
  const data = (await resp.json()) as {
    updates?: { updatedRange?: string };
  };
  return { updatedRange: data.updates?.updatedRange ?? null };
}

export default async function handler(req: Request): Promise<Response> {
  console.log('[saveReport] step=handler_start', { method: req.method });

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let payload: RequestPayload;
  try {
    const body = await req.json();
    payload = RequestSchema.parse(body);
  } catch (err) {
    return Response.json(
      {
        error: 'Invalid request body',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    return Response.json(
      { error: 'GOOGLE_SHEET_ID env var is not set' },
      { status: 500 }
    );
  }

  let credentials: ServiceAccountCreds;
  try {
    credentials = getServiceAccountCredentials();
    console.log('[saveReport] step=creds_loaded', { client_email: credentials.client_email });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Service account error' },
      { status: 500 }
    );
  }

  try {
    const accessToken = await getAccessToken(credentials);
    const tab = process.env.GOOGLE_SHEET_TAB || 'Reports';
    const { updatedRange } = await appendRow(accessToken, sheetId, tab, buildRow(payload));

    console.log('[saveReport] step=done', { updatedRange });
    return Response.json(
      {
        ok: true,
        updatedRange,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown sheets error';
    console.error('[saveReport] step=error', msg);
    return Response.json({ error: 'Sheet append failed', detail: msg }, { status: 502 });
  }
}
