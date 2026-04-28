// Fire-and-forget client for /api/saveReport (Google Sheets append).
// Never throws — failure logged to console only so the report flow is never
// blocked by sheet write errors.

import type { ReportState } from '../types';
import { DEFECT_CATALOG } from '../data/defectCatalog';

export type SheetSaveResult = {
  ok: boolean;
  updatedRange?: string | null;
  sheetUrl?: string;
  error?: string;
};

function severityFor(rate: number): string {
  if (rate >= 2.5) return 'CRITICAL';
  if (rate >= 1.0) return 'HIGH';
  if (rate > 0) return 'MEDIUM';
  return 'LOW';
}

export async function saveReportToSheet(
  state: ReportState,
  meta: { aiSource: 'claude' | 'mymemory-fallback' | 'unknown' }
): Promise<SheetSaveResult> {
  if (!state.product) {
    return { ok: false, error: 'No product loaded' };
  }

  const totalDefectQty = state.defects.reduce((acc, d) => acc + d.qty, 0);
  const defectRate =
    state.product.receivedQty > 0 ? (totalDefectQty / state.product.receivedQty) * 100 : 0;

  const defectCategories = Array.from(new Set(state.defects.map((d) => d.category)))
    .map((c) => DEFECT_CATALOG[c].label.ko)
    .join(', ');

  const guidanceThird = state.productionGuidance?.[state.thirdLanguage] ?? '';

  const payload = {
    claimNo: state.claimNo,
    inspectionDate: state.inspectionDate,
    inspector: state.inspector,
    brand: state.product.brand,
    styleCode: state.product.styleCode,
    productName: state.product.productName,
    category: state.product.category,
    season: state.product.season,
    color: state.product.color,
    colorCode: state.product.colorCode,
    supplier: state.product.supplier,
    supplierVendorCode: state.product.supplierVendorCode,
    poNumber: state.product.poNumber,
    receivedQty: state.product.receivedQty,
    totalDefectQty,
    defectRate,
    severity: severityFor(defectRate),
    thirdLanguage: state.thirdLanguage,
    defectCategories,
    defectsJson: JSON.stringify(
      state.defects.map((d) => ({
        category: d.category,
        qty: d.qty,
        detailKo: d.detailKo,
      }))
    ),
    translationsJson: JSON.stringify(state.translations),
    guidanceKo: state.productionGuidance?.ko ?? '',
    guidanceEn: state.productionGuidance?.en ?? '',
    guidanceThird,
    aiSource: meta.aiSource,
    defectPhotoCount: state.defectPhotos.length,
    careLabelPhotoCount: state.careLabelPhotos.length,
  };

  try {
    const res = await fetch('/api/saveReport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = (await res.json()) as { error?: string; detail?: string };
        errMsg = errJson.detail ? `${errJson.error}: ${errJson.detail}` : errJson.error ?? errMsg;
      } catch {
        /* not json */
      }
      console.warn('[sheetClient] save failed:', errMsg);
      return { ok: false, error: errMsg };
    }

    const data = (await res.json()) as SheetSaveResult;
    return { ...data, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    console.warn('[sheetClient] save error:', msg);
    return { ok: false, error: msg };
  }
}
