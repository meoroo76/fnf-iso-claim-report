// KG snapshot types + data loader.
// Data lives in kg-snapshot.json (JSON import bypasses TypeScript AST bulk parsing
// that made Vercel's esbuild fail on the 336KB inline-TS version).

import RAW_KG_JSON from './kg-snapshot.json';

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

export const RAW_KG = RAW_KG_JSON as unknown as RawKGProduct[];

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
