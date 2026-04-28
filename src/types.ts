import type { DefectCategory } from './data/defectCatalog';
import type { KGProduct } from './lib/kgClient';

export type DefectPhoto = {
  id: string;
  name: string;
  dataUrl: string;
};

export type DefectEntry = {
  id: string;
  category: DefectCategory;
  qty: number;
  detailKo: string;
};

// Configurable third language. KO + EN are always present; this is the
// 3rd column on the report and the third-language email body.
export type ThirdLang = 'vi' | 'zh' | 'id' | 'my';

export const THIRD_LANG_LABELS: Record<ThirdLang, { native: string; ko: string; en: string }> = {
  vi: { native: 'Tiếng Việt', ko: '베트남어', en: 'Vietnamese' },
  zh: { native: '中文', ko: '중국어', en: 'Chinese' },
  id: { native: 'Bahasa Indonesia', ko: '인도네시아어', en: 'Indonesian' },
  my: { native: 'မြန်မာဘာသာ', ko: '미얀마어', en: 'Burmese' },
};

// Translations are keyed by KO source text, then by language code.
// EN is always present; the third-lang slot is populated for whichever
// language(s) the user has generated. Allows in-place switching without
// re-calling the AI when a translation is already cached.
export type TranslationEntry = { en: string } & Partial<Record<ThirdLang, string>>;

export type ProductionGuidance = {
  ko: string;
  en: string;
} & Partial<Record<ThirdLang, string>>;

export type ReportState = {
  product: KGProduct | null;
  styleInput: string;
  claimNo: string;
  inspector: string;
  inspectionDate: string;
  defects: DefectEntry[];
  defectPhotos: DefectPhoto[];
  careLabelPhotos: DefectPhoto[];
  generated: boolean;
  translations: Record<string, TranslationEntry>;
  productionGuidance: ProductionGuidance | null;
  thirdLanguage: ThirdLang;
};
