// Pure, framework-agnostic core logic — imported by both Vite middleware
// (local dev) and Vercel Functions (production).

import { RAW_KG, SUPPLIER_POOL, KG_META, type RawKGProduct } from '../src/data/kgSnapshot';

export type KGProductDTO = {
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

function pickSupplier(brandCode: 'V' | 'ST' | 'X', styleCode: string): [string, string] {
  const pool = SUPPLIER_POOL[brandCode];
  return pool[hashIdx(styleCode, pool.length)];
}

export function toDTO(raw: RawKGProduct): KGProductDTO {
  const [color, colorCode] = pickColor(raw.PRDT_CD, raw.PRDT_IMG_URL);
  const [supplier, vendorCode] = pickSupplier(raw.BRD_CD, raw.PRDT_CD);
  const { qty, poNo } = syntheticOrder(raw.PRDT_CD);
  const season = raw.SESN === '25F' ? '25FW' : '26SS';
  return {
    styleCode: raw.PRDT_CD,
    partCode: raw.PRDT_CD.slice(3),
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
    receivedQty: qty,
    firstStoredDate: raw.STOR_DT_1ST,
    unitPrice: raw.TAG_PRICE,
    poNumber: poNo,
    supplier,
    supplierVendorCode: vendorCode,
    productImage: raw.PRDT_IMG_URL,
    techPackUrl: raw.CAD_PDF_URL,
    source: 'snapshot',
  };
}

const styleCache = new Map<string, KGProductDTO>();
RAW_KG.forEach((r) => styleCache.set(r.PRDT_CD.toUpperCase(), toDTO(r)));

export function findStyleInSnapshot(code: string): KGProductDTO | null {
  const key = code.trim().toUpperCase();
  if (styleCache.has(key)) return styleCache.get(key)!;
  const hit = Array.from(styleCache.keys()).find(
    (k) => k.startsWith(key) || k.includes(key)
  );
  return hit ? styleCache.get(hit)! : null;
}

export function listStylesFromSnapshot(season?: string, brand?: string): KGProductDTO[] {
  return Array.from(styleCache.values()).filter(
    (p) => (!season || p.season === season) && (!brand || p.brandCode === brand)
  );
}

export async function fetchLiveStyle(code: string): Promise<KGProductDTO | null> {
  const base = process.env.KG_API_BASE;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/v1/hq/search/product_codes_properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: [{ system_code: code, system_field_name: 'PRDT_CD' }],
        meta_info: { data_size_only: false, data_type: 'list', requested_record_rows: 1 },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { data?: RawKGProduct[] } };
    const raw = json?.data?.data?.[0];
    if (!raw) return null;
    const dto = toDTO(raw);
    dto.source = 'kg-live';
    return dto;
  } catch {
    return null;
  }
}

export { KG_META };

// ── Notify ────────────────────────────────────────────────────────────
export type EmailReq = {
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  attachmentBase64?: string;
  attachmentName?: string;
};

export type TeamsReq = {
  subject: string;
  summary: string;
  claimNo?: string;
  brand?: string;
  styleCode?: string;
  season?: string;
  claimRate?: number;
  attachmentName?: string;
};

export async function sendEmailCore(req: EmailReq) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log('[notify:email] SIMULATION (no SMTP_* env)', {
      to: req.to,
      cc: req.cc,
      subject: req.subject,
      bodyLength: req.bodyText.length,
      attachmentName: req.attachmentName,
      attachmentBytes: req.attachmentBase64 ? Math.floor((req.attachmentBase64.length * 3) / 4) : 0,
    });
    return { simulated: true, messageId: `sim-${Date.now()}` };
  }

  const { default: nodemailer } = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  const info = await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: req.to,
    cc: req.cc,
    subject: req.subject,
    text: req.bodyText,
    attachments: req.attachmentBase64
      ? [
          {
            filename: req.attachmentName ?? 'ISO_Claim_Report.pdf',
            content: Buffer.from(req.attachmentBase64, 'base64'),
            contentType: 'application/pdf',
          },
        ]
      : undefined,
  });

  return { simulated: false, messageId: info.messageId };
}

export async function postToTeamsCore(req: TeamsReq) {
  const url = process.env.TEAMS_WEBHOOK_URL;
  const card = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: req.summary,
    themeColor: 'C8102E',
    title: `📋 ${req.subject}`,
    sections: [
      {
        activityTitle: `F&F QA · ISO Claim Report`,
        activitySubtitle: req.claimNo ? `Claim No. ${req.claimNo}` : undefined,
        facts: [
          req.brand && { name: 'Brand', value: req.brand },
          req.styleCode && { name: 'Style', value: req.styleCode },
          req.season && { name: 'Season', value: req.season },
          typeof req.claimRate === 'number' && {
            name: 'Claim Rate',
            value: `${req.claimRate.toFixed(2)}%`,
          },
          req.attachmentName && { name: 'Attachment', value: req.attachmentName },
        ].filter(Boolean),
        text: req.summary,
      },
    ],
  };

  if (!url) {
    console.log('[notify:teams] SIMULATION (no TEAMS_WEBHOOK_URL)', card);
    return { simulated: true, ok: true };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
  return { simulated: false, ok: res.ok, status: res.status };
}
