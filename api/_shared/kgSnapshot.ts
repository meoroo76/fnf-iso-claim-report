// KG snapshot types + runtime JSON loader.
// Runtime fs.readFile bypasses esbuild bundling the big JSON into the function.
// vercel.json `includeFiles: api/_shared/**` ensures JSON is available at runtime.

import { readFileSync } from 'fs';
import { join } from 'path';

export type RawKGProduct = {
  PRDT_CD: string;
  BRD_CD: 'V' | 'ST';
  BRD_NM: string;
  SYS_BRD_NM: string;
  PRDT_NM: string;
  ITEM_NM: string;
  ITEM_NM_ENG: string;
  PARENT_PRDT_KIND_NM: string;
  PRDT_KIND_NM: string;
  SESN: '25F' | '26S';
  SESN_SUB_NM: string;
  SEX_NM: string;
  ADULT_KIDS_NM: string;
  TAG_PRICE: number;
  PRDT_IMG_URL: string | null;
  CAD_PDF_URL: string | null;
  STOR_DT_1ST: string | null;
};

function loadKgSnapshot(): RawKGProduct[] {
  const candidates = [
    join(process.cwd(), 'api', '_shared', 'kg-snapshot.json'),
    join(__dirname, 'kg-snapshot.json'),
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, 'utf-8')) as RawKGProduct[];
    } catch {
      // try next
    }
  }
  return [];
}

export const RAW_KG: RawKGProduct[] = loadKgSnapshot();

export const SUPPLIER_POOL: Record<'V' | 'ST', Array<[string, string]>> = {
  V: [
    ['(주)신명훠스트', '810191'],
    ['주식회사 세종티에프', '116873'],
    ['(주)아이보리', '810200'],
    ['㈜인티모', '119427'],
    ['주식회사 엠에스에프', '200603'],
  ],
  ST: [
    ['(주) 세기와사람들', '200534'],
    ['트윈텍스타일', '200546'],
    ['(주)신티에스', '123632'],
    ['주식회사 이음에프앤씨', '200539'],
    ['㈜원지아이엔씨', '111160'],
  ],
};

export const KG_META = {
  fetchedAt: '2026-04-22',
  source: 'F&F Knowledge Graph · execute_kg_api_to_context',
  endpoint: '/api/v1/hq/search/product_codes_properties',
  totalProducts: RAW_KG.length,
};
