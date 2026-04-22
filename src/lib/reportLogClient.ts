// Client-side report log — localStorage in static mode (no server).

import type { ReportState } from '../types';

export type ReportLogEntry = {
  timestamp: string;
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
  defectSummary: string;
};

const STORAGE_KEY = 'fnf-report-log-v1';

export function buildReportLogEntry(state: ReportState): ReportLogEntry | null {
  if (!state.product) return null;
  const totalDefectQty = state.defects.reduce((a, d) => a + d.qty, 0);
  const claimRate =
    state.product.receivedQty > 0 ? (totalDefectQty / state.product.receivedQty) * 100 : 0;
  const defectSummary = state.defects.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + d.qty;
    return acc;
  }, {});
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
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ReportLogEntry[];
    existing.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return { ok: true, rowNumber: existing.length };
  } catch {
    return { ok: false };
  }
}

export async function fetchReportLog(): Promise<ReportLogEntry[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ReportLogEntry[];
  } catch {
    return [];
  }
}

export function downloadReportLogAsCsv(): void {
  const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ReportLogEntry[];
  if (entries.length === 0) return;
  const headers = Object.keys(entries[0]) as (keyof ReportLogEntry)[];
  const csvCell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(','),
    ...entries.map((e) => headers.map((h) => csvCell(e[h])).join(',')),
  ];
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ISO_Claim_Report_Log_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
