// Frontend client for the server-side CSV log of completed reports.

import type { ReportState } from '../types';

export type ReportLogEntry = {
  timestamp: string; // ISO 8601
  claimNo: string;
  styleCode: string;
  brand: string;
  supplier: string;
  season: string;
  receivedQty: number;
  defectCount: number;
  totalDefectQty: number;
  claimRate: number;
  inspector: string;
  inspectionDate: string;
  defectSummary: string; // "봉제(2pcs); 원단(1pcs)"
};

export function buildReportLogEntry(state: ReportState): ReportLogEntry | null {
  if (!state.product) return null;
  const totalDefectQty = state.defects.reduce((a, d) => a + d.qty, 0);
  const claimRate =
    state.product.receivedQty > 0 ? (totalDefectQty / state.product.receivedQty) * 100 : 0;
  const defectSummary = state.defects
    .reduce<Record<string, number>>((acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + d.qty;
      return acc;
    }, {})
    ;
  const summaryString = Object.entries(defectSummary)
    .map(([cat, qty]) => `${cat}(${qty}pcs)`)
    .join('; ');
  return {
    timestamp: new Date().toISOString(),
    claimNo: state.claimNo,
    styleCode: state.product.styleCode,
    brand: state.product.brand,
    supplier: state.product.supplier,
    season: state.product.season,
    receivedQty: state.product.receivedQty,
    defectCount: state.defects.length,
    totalDefectQty,
    claimRate: Number(claimRate.toFixed(2)),
    inspector: state.inspector,
    inspectionDate: state.inspectionDate,
    defectSummary: summaryString,
  };
}

export async function saveReportLog(entry: ReportLogEntry): Promise<{ ok: boolean; rowNumber?: number }> {
  const res = await fetch('/api/reports/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) return { ok: false };
  return res.json();
}

export async function fetchReportLog(): Promise<ReportLogEntry[]> {
  const res = await fetch('/api/reports/list');
  if (!res.ok) return [];
  const body = (await res.json()) as { items: ReportLogEntry[] };
  return body.items;
}
