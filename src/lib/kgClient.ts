// Frontend HTTP client for the KG API (served by Vite middleware).
// In prod deployment the same endpoints will be served by a Node/Edge function
// reading from env KG_API_BASE.

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

const cache = new Map<string, KGProduct>();

export class KGNotFound extends Error {
  constructor(public code: string, public hint?: string) {
    super(`KG 조회 실패: ${code}`);
  }
}

export async function fetchStyle(code: string): Promise<KGProduct> {
  const key = code.trim().toUpperCase();
  if (cache.has(key)) return cache.get(key)!;

  const res = await fetch(`/api/kg/style/${encodeURIComponent(key)}`);
  if (res.status === 404) {
    const body = (await res.json()) as { hint?: string };
    throw new KGNotFound(code, body?.hint);
  }
  if (!res.ok) throw new Error(`KG 조회 서버 오류: ${res.status}`);

  const product = (await res.json()) as KGProduct;
  cache.set(product.styleCode.toUpperCase(), product);
  return product;
}

export async function listStyles(
  season?: '25FW' | '26SS',
  brand?: 'V' | 'ST' | 'X'
): Promise<KGProduct[]> {
  const qs = new URLSearchParams();
  if (season) qs.set('season', season);
  if (brand) qs.set('brand', brand);
  const res = await fetch(`/api/kg/styles?${qs.toString()}`);
  if (!res.ok) throw new Error(`KG 목록 조회 오류: ${res.status}`);
  const body = (await res.json()) as { items: KGProduct[] };
  body.items.forEach((p) => cache.set(p.styleCode.toUpperCase(), p));
  return body.items;
}

export async function fetchMeta(): Promise<KGMeta> {
  const res = await fetch('/api/kg/meta');
  if (!res.ok) throw new Error('KG meta 오류');
  return res.json();
}
