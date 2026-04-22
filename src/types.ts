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
  translations: Record<string, { en: string; vi: string }>;
};
