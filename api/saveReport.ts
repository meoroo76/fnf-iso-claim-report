// Vercel Function — POST /api/saveReport
//
// Appends one row per claim report to a configured Google Sheet.
// Auth via Service Account JSON (GOOGLE_SERVICE_ACCOUNT_JSON env var).
// Target sheet ID via GOOGLE_SHEET_ID env var.
//
// Designed to be FIRE-AND-FORGET from the client — never blocks the report
// flow. If the sheet write fails, the report still generates locally and the
// user can retry later.

import { google } from 'googleapis';
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

function getServiceAccountCredentials() {
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

export default async function handler(req: Request): Promise<Response> {
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

  let credentials;
  try {
    credentials = getServiceAccountCredentials();
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Service account error' },
      { status: 500 }
    );
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Default tab name is "Reports". Override via GOOGLE_SHEET_TAB env var.
    const tab = process.env.GOOGLE_SHEET_TAB || 'Reports';
    const range = `${tab}!A:AB`;

    // Defensive timeout — never let JWT auth or Sheets API hang past 20s.
    // Vercel maxDuration is 30s; we want to surface a meaningful error before that.
    const TIMEOUT_MS = 20_000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Sheets API timeout after ${TIMEOUT_MS}ms`)),
        TIMEOUT_MS
      )
    );

    const appendCall = sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [buildRow(payload)],
      },
    });

    const result = await Promise.race([appendCall, timeoutPromise]);
    const updatedRange = result.data.updates?.updatedRange ?? null;

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
    return Response.json({ error: 'Sheet append failed', detail: msg }, { status: 502 });
  }
}
