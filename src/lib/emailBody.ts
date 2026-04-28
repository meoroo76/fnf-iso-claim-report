// Auto-generated multilingual claim-notification email body.
// Pure function — no network calls. Used on both client (preview) and server (send).

import type { KGProduct } from './kgClient';
import type { TranslationEntry } from '../types';
import { DEFECT_CATALOG, type DefectCategory } from '../data/defectCatalog';

export type EmailDraftInput = {
  product: KGProduct;
  claimNo: string;
  inspectionDate: string;
  inspector: string;
  defects: Array<{ category: DefectCategory; qty: number; detailKo: string }>;
  translations: Record<string, TranslationEntry>;
  totalDefectQty: number;
  claimRate: number;
};

export type EmailDraft = {
  subject: string;
  bodyKo: string;
  bodyEn: string;
  bodyVi: string;
  combined: string; // all three stacked — default for one-shot email
};

function severity(rate: number): { ko: string; en: string; vi: string } {
  if (rate >= 2.5) return { ko: 'CRITICAL (긴급)', en: 'CRITICAL', vi: 'NGHIÊM TRỌNG' };
  if (rate >= 1.0) return { ko: 'HIGH (높음)', en: 'HIGH', vi: 'CAO' };
  if (rate > 0) return { ko: 'MEDIUM (보통)', en: 'MEDIUM', vi: 'TRUNG BÌNH' };
  return { ko: 'LOW', en: 'LOW', vi: 'THẤP' };
}

export function generateEmailDraft(input: EmailDraftInput): EmailDraft {
  const { product, claimNo, inspectionDate, inspector, defects, translations, totalDefectQty, claimRate } = input;
  const sev = severity(claimRate);

  const koList = defects
    .map((d, i) => {
      const cat = DEFECT_CATALOG[d.category];
      return `  ${i + 1}. [${cat.label.ko}] ${d.qty}pcs — ${d.detailKo}`;
    })
    .join('\n');

  const enList = defects
    .map((d, i) => {
      const cat = DEFECT_CATALOG[d.category];
      const tl = translations[d.detailKo.trim()];
      return `  ${i + 1}. [${cat.label.en}] ${d.qty}pcs — ${tl?.en ?? d.detailKo}`;
    })
    .join('\n');

  const viList = defects
    .map((d, i) => {
      const cat = DEFECT_CATALOG[d.category];
      const tl = translations[d.detailKo.trim()];
      // Email VI body uses VI translation when available, else falls back to KO source.
      // For zh/id/my third-language reports, the VI body section can be ignored
      // by the user (use combined or ko/en views instead).
      return `  ${i + 1}. [${cat.label.vi}] ${d.qty}pcs — ${tl?.vi ?? d.detailKo}`;
    })
    .join('\n');

  const subject = `[ISO Claim · ${sev.en}] ${claimNo} · ${product.brand} ${product.styleCode} (${product.season}) · ${claimRate.toFixed(2)}%`;

  const bodyKo = `안녕하세요, ${product.supplier} 담당자님.

F&F Corporation QA에서 아래 건에 대한 소비자/매장 클레임이 접수되어 ISO Claim Report를 공유드립니다.

■ 기본 정보
  · 클레임 번호 : ${claimNo}
  · 심각도     : ${sev.ko}
  · 접수일     : ${inspectionDate}
  · 검사자     : ${inspector || '미지정'}
  · 브랜드     : ${product.brand}
  · 스타일/품번 : ${product.styleCode} (${product.productName})
  · 운영시즌   : ${product.season}
  · 컬러       : ${product.color} (${product.colorCode})
  · 협력사     : ${product.supplier} (${product.supplierVendorCode})
  · PO / 수량  : ${product.poNumber} / 입고 ${product.receivedQty.toLocaleString()}pcs
  · 클레임 수량/율 : ${totalDefectQty.toLocaleString()}pcs (${claimRate.toFixed(2)}%)

■ 불량 내역
${koList}

첨부된 PDF 리포트를 확인하신 뒤 7일 이내에 원인 분석(CAPA) 및 조치 계획을 회신 부탁드립니다.
실물 샘플 전달이 어려운 점을 감안하여 사진은 고해상도(3×)로 첨부되어 있습니다.

F&F Corporation · Quality Assurance`;

  const bodyEn = `Dear Partner at ${product.supplier},

F&F Corporation QA is forwarding the attached ISO Claim Report regarding consumer/store claims received for the following item.

■ Basic Information
  · Claim No.     : ${claimNo}
  · Severity      : ${sev.en}
  · Inspection Dt : ${inspectionDate}
  · Inspector     : ${inspector || 'TBD'}
  · Brand         : ${product.brand}
  · Style         : ${product.styleCode} (${product.productName})
  · Season        : ${product.season}
  · Color         : ${product.color} (${product.colorCode})
  · Supplier      : ${product.supplier} (${product.supplierVendorCode})
  · PO / Qty      : ${product.poNumber} / Received ${product.receivedQty.toLocaleString()} pcs
  · Claim Qty/Rate: ${totalDefectQty.toLocaleString()} pcs (${claimRate.toFixed(2)}%)

■ Defect Findings
${enList}

Please review the attached PDF and reply with a root-cause analysis (CAPA) and corrective action plan within 7 days.
As physical samples cannot be shipped overseas, all evidence photos are embedded at 3× resolution.

F&F Corporation · Quality Assurance`;

  const bodyVi = `Kính gửi Đối tác tại ${product.supplier},

Bộ phận QA của F&F Corporation xin gửi Báo cáo Khiếu nại ISO đính kèm liên quan đến các khiếu nại từ khách hàng/cửa hàng đối với mặt hàng sau.

■ Thông tin cơ bản
  · Mã khiếu nại : ${claimNo}
  · Mức độ      : ${sev.vi}
  · Ngày kiểm   : ${inspectionDate}
  · Người kiểm  : ${inspector || 'Chưa định'}
  · Thương hiệu : ${product.brand}
  · Kiểu (Style): ${product.styleCode} (${product.productName})
  · Mùa vụ      : ${product.season}
  · Màu         : ${product.color} (${product.colorCode})
  · Nhà cung cấp: ${product.supplier} (${product.supplierVendorCode})
  · PO / SL     : ${product.poNumber} / Nhập ${product.receivedQty.toLocaleString()} pcs
  · SL/Tỷ lệ lỗi: ${totalDefectQty.toLocaleString()} pcs (${claimRate.toFixed(2)}%)

■ Chi tiết lỗi
${viList}

Vui lòng xem file PDF đính kèm và phản hồi phân tích nguyên nhân (CAPA) cùng kế hoạch khắc phục trong vòng 7 ngày.
Do không thể gửi mẫu vật lý ra nước ngoài, tất cả ảnh bằng chứng được nhúng với độ phân giải 3×.

F&F Corporation · Quality Assurance`;

  const combined = [
    '=== 한국어 ===',
    bodyKo,
    '',
    '=== English ===',
    bodyEn,
    '',
    '=== Tiếng Việt ===',
    bodyVi,
  ].join('\n');

  return { subject, bodyKo, bodyEn, bodyVi, combined };
}
