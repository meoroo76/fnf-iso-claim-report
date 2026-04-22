// Client-side KG lookup — loads JSON snapshots from public/, all logic in browser.
// No Vercel Functions / backend required for lookup.

export type KGProduct = {
  styleCode: string;
  partCode: string;
  brand: string;
  brandCode: string;
  systemBrand: string;
  productName: string;
  category: string;
  categoryEn: string;
  productKind: string;
  subKind: string;
  season: '25FW' | '26SS';
  seasonSubName: string;
  sex: string;
  adultKids: string;
  color: string;
  colorCode: string;
  receivedQty: number;
  firstStoredDate: string | null;
  unitPrice: number;
  poNumber: string;
  supplier: string;
  supplierVendorCode: string;
  productImage: string | null;
  techPackUrl: string | null;
  source: 'kg-live' | 'snapshot';
};

export type KGMeta = {
  fetchedAt: string;
  source: string;
  endpoint: string;
  totalProducts: number;
  live: boolean;
};

type RawKGProduct = {
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

type POOverride = {
  supplier: string;
  origin: string;
  receivedQty: number;
  poNumber: string;
  poCount: number;
};

// ── Supplier fallback pool (deterministic hash-based) ──
const SUPPLIER_POOL: Record<'V' | 'ST', Array<[string, string]>> = {
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

const COLOR_MAP: Record<string, [string, string]> = {
  BKS: ['Black', 'BKS'], BKN: ['Black', 'BKN'], BKD: ['Black', 'BKD'],
  IVS: ['Ivory', 'IVS'], IVL: ['Ivory', 'IVL'], IVM: ['Ivory', 'IVM'],
  NYS: ['Navy', 'NYS'], NYD: ['Navy', 'NYD'],
  BRS: ['Brown', 'BRS'], BRD: ['Brown', 'BRD'],
  BGD: ['Beige', 'BGD'], BGS: ['Beige', 'BGS'], BGL: ['Beige', 'BGL'],
  CRS: ['Cream', 'CRS'], CGL: ['Camel', 'CGL'], CAS: ['Camel', 'CAS'],
  OLD: ['Olive', 'OLD'],
  MGS: ['Mauve Grey', 'MGS'], MGL: ['Mauve Grey', 'MGL'],
  EGS: ['Eucalyptus', 'EGS'],
  PKS: ['Pink', 'PKS'],
  WHS: ['White', 'WHS'],
  SBL: ['Sky Blue', 'SBL'],
  GRS: ['Grey', 'GRS'], GRD: ['Grey', 'GRD'],
  GND: ['Green', 'GND'],
  SET: ['Sunset', 'SET'],
};

function hashIdx(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

function syntheticOrder(styleCode: string): { qty: number; poNo: string } {
  const h = hashIdx(styleCode, 10_000);
  const qty = 200 + (h % 5800);
  const rn = 1000 + hashIdx(styleCode.split('').reverse().join(''), 9000);
  return { qty, poNo: `PO-${styleCode.slice(1, 4)}-${rn}` };
}

function pickColor(styleCode: string, imgUrl: string | null): [string, string] {
  if (imgUrl) {
    const m = imgUrl.match(new RegExp(`${styleCode}([A-Z]{3})/`));
    if (m && COLOR_MAP[m[1]]) return COLOR_MAP[m[1]];
    if (m) return [m[1], m[1]];
  }
  return [['Black', 'Navy', 'Ivory', 'Beige'][hashIdx(styleCode, 4)], 'STD'];
}

function pickSupplier(brandCode: 'V' | 'ST', styleCode: string): [string, string] {
  const pool = SUPPLIER_POOL[brandCode];
  return pool[hashIdx(styleCode, pool.length)];
}

function derivePartCode(brandCode: 'V' | 'ST', prdtCd: string): string {
  return brandCode === 'V' ? prdtCd.slice(4) : prdtCd.slice(5);
}

function toDTO(raw: RawKGProduct, overrides: Record<string, POOverride>): KGProduct {
  const [color, colorCode] = pickColor(raw.PRDT_CD, raw.PRDT_IMG_URL);
  const season: '25FW' | '26SS' = raw.SESN === '25F' ? '25FW' : '26SS';

  const override = overrides[raw.PRDT_CD];
  const [fallbackSupplier, fallbackVendor] = pickSupplier(raw.BRD_CD, raw.PRDT_CD);
  const fallback = syntheticOrder(raw.PRDT_CD);

  return {
    styleCode: raw.PRDT_CD,
    partCode: derivePartCode(raw.BRD_CD, raw.PRDT_CD),
    brand: raw.BRD_NM,
    brandCode: raw.BRD_CD,
    systemBrand: raw.SYS_BRD_NM,
    productName: raw.PRDT_NM,
    category: raw.ITEM_NM,
    categoryEn: raw.ITEM_NM_ENG,
    productKind: raw.PARENT_PRDT_KIND_NM,
    subKind: raw.PRDT_KIND_NM,
    season,
    seasonSubName: raw.SESN_SUB_NM,
    sex: raw.SEX_NM,
    adultKids: raw.ADULT_KIDS_NM,
    color,
    colorCode,
    receivedQty: override?.receivedQty ?? fallback.qty,
    firstStoredDate: raw.STOR_DT_1ST,
    unitPrice: raw.TAG_PRICE,
    poNumber: override?.poNumber ?? fallback.poNo,
    supplier: override?.supplier ?? fallbackSupplier,
    supplierVendorCode: override ? '' : fallbackVendor,
    productImage: raw.PRDT_IMG_URL,
    techPackUrl: raw.CAD_PDF_URL,
    source: override ? 'kg-live' : 'snapshot',
  };
}

// ── In-memory cache (one fetch per session) ─────────────────────────
let dataPromise: Promise<{
  byStyle: Map<string, KGProduct>;
  byPart: Map<string, KGProduct>;
  all: KGProduct[];
}> | null = null;

async function loadData() {
  if (!dataPromise) {
    dataPromise = (async () => {
      const [kgRes, poRes] = await Promise.all([
        fetch('/kg-snapshot.json'),
        fetch('/po-overrides.json'),
      ]);
      if (!kgRes.ok || !poRes.ok) throw new Error('데이터 로드 실패');
      const rawKg = (await kgRes.json()) as RawKGProduct[];
      const overrides = (await poRes.json()) as Record<string, POOverride>;
      const byStyle = new Map<string, KGProduct>();
      const byPart = new Map<string, KGProduct>();
      const all: KGProduct[] = [];
      for (const r of rawKg) {
        const dto = toDTO(r, overrides);
        byStyle.set(r.PRDT_CD.toUpperCase(), dto);
        byPart.set(derivePartCode(r.BRD_CD, r.PRDT_CD).toUpperCase(), dto);
        all.push(dto);
      }
      return { byStyle, byPart, all };
    })();
  }
  return dataPromise;
}

export class KGNotFound extends Error {
  constructor(public code: string, public hint?: string) {
    super(`KG 조회 실패: ${code}`);
  }
}

export async function fetchStyle(code: string): Promise<KGProduct> {
  const key = code.trim().toUpperCase();
  const { byStyle, byPart } = await loadData();
  if (byStyle.has(key)) return byStyle.get(key)!;
  if (byPart.has(key)) return byPart.get(key)!;
  // fuzzy prefix/contains
  for (const [k, v] of byStyle) {
    if (k.startsWith(key) || k.includes(key)) return v;
  }
  for (const [k, v] of byPart) {
    if (k.startsWith(key) || k.includes(key)) return v;
  }
  throw new KGNotFound(code, '운영시즌 25FW / 26SS 범위에서 조회 가능합니다.');
}

export async function listStyles(
  season?: '25FW' | '26SS',
  brand?: 'V' | 'ST'
): Promise<KGProduct[]> {
  const { all } = await loadData();
  return all.filter(
    (p) => (!season || p.season === season) && (!brand || p.brandCode === brand)
  );
}

export async function fetchMeta(): Promise<KGMeta> {
  const { all } = await loadData();
  return {
    fetchedAt: '2026-04-22',
    source: 'F&F Knowledge Graph · execute_kg_api_to_context',
    endpoint: 'client-side static',
    totalProducts: all.length,
    live: false,
  };
}
