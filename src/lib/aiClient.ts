// Client wrapper for /api/generate (Vercel Function → Claude via AI Gateway).
// Returns translations keyed by source detailKo with EN + chosen third lang,
// plus tri-lingual production guidance (KO + EN + chosen third lang).

import type { DefectEntry, ProductionGuidance, ThirdLang, TranslationEntry } from '../types';
import type { KGProduct } from './kgClient';
import { DEFECT_CATALOG } from '../data/defectCatalog';

export type AiGenerationResult = {
  thirdLanguage: ThirdLang;
  translations: Record<string, TranslationEntry>;
  guidance: ProductionGuidance;
};

type ServerResponse = {
  thirdLanguage: ThirdLang;
  translations: Array<{ ko: string; en: string; third: string }>;
  guidance: { ko: string; en: string; third: string };
};

type ServerError = { error: string; detail?: string };

export class AiGenerationError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'AiGenerationError';
  }
}

export async function generateReportAi(
  defects: DefectEntry[],
  product: KGProduct,
  thirdLanguage: ThirdLang
): Promise<AiGenerationResult> {
  const filtered = defects.filter((d) => d.detailKo.trim().length > 0);
  if (filtered.length === 0) {
    throw new AiGenerationError('생성할 불량 내역이 없습니다.', 400);
  }

  const payload = {
    defects: filtered.map((d) => ({
      category: d.category,
      categoryLabelKo: DEFECT_CATALOG[d.category].label.ko,
      qty: d.qty,
      detailKo: d.detailKo.trim(),
    })),
    product: {
      brand: product.brand,
      styleCode: product.styleCode,
      productName: product.productName,
      category: product.category,
      season: product.season,
      color: product.color,
      receivedQty: product.receivedQty,
      supplier: product.supplier,
    },
    thirdLanguage,
  };

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as ServerError;
      serverMsg = err.detail ? `${err.error}: ${err.detail}` : err.error;
    } catch {
      // Server returned non-JSON (e.g. Vercel platform error page like
      // FUNCTION_INVOCATION_FAILED). Surface the bare HTTP code; details
      // would need to come from server logs.
      console.warn('[aiClient] non-JSON error body for status', res.status);
    }
    throw new AiGenerationError(serverMsg, res.status);
  }

  const data = (await res.json()) as ServerResponse;
  const lang = data.thirdLanguage ?? thirdLanguage;

  // Re-key translations by source KO text and store the third-language value
  // under its actual language code (vi/zh/id/my) so report rendering can pick
  // the right slot.
  const translations: AiGenerationResult['translations'] = {};
  payload.defects.forEach((d, i) => {
    const tl = data.translations[i];
    if (!tl) return;
    translations[d.detailKo] = { en: tl.en, [lang]: tl.third };
  });

  const guidance: ProductionGuidance = {
    ko: data.guidance.ko,
    en: data.guidance.en,
    [lang]: data.guidance.third,
  };

  return {
    thirdLanguage: lang,
    translations,
    guidance,
  };
}
