import { forwardRef } from 'react';
import type { ReportState } from '../types';
import { DEFECT_CATALOG } from '../data/defectCatalog';

type Props = { state: ReportState };

export const ReportPreview = forwardRef<HTMLDivElement, Props>(function ReportPreview(
  { state },
  ref
) {
  const { product, defects, defectPhotos, careLabelPhotos, translations } = state;
  if (!product) {
    return (
      <div className="report-page mx-auto flex items-center justify-center text-brand-muted">
        스타일을 조회한 뒤 리포트가 여기에 표시됩니다.
      </div>
    );
  }

  const totalDefectQty = defects.reduce((acc, d) => acc + d.qty, 0);
  const defectRate = product.receivedQty > 0 ? (totalDefectQty / product.receivedQty) * 100 : 0;

  const hasBothPhotoTypes = defectPhotos.length > 0 && careLabelPhotos.length > 0;

  return (
    <div
      ref={ref}
      className="report-page mx-auto px-10 py-7 text-[10px] leading-relaxed text-neutral-900 flex flex-col"
    >
      <header className="border-b-2 border-black pb-2.5 mb-3 flex items-start justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-brand-accent font-semibold">
            F&amp;F Corporation · Quality Assurance
          </div>
          <h1 className="headline-serif text-[28px] leading-none mt-0.5">ISO Claim Report</h1>
          <div className="text-[9px] text-brand-muted mt-0.5">
            Consumer / Store Claim Notification · ISO 2859-1 (AQL)
          </div>
        </div>
        <div className="text-right text-[9px]">
          <div>
            <span className="text-brand-muted">Claim No.</span>
            <div className="font-mono font-semibold text-[12px]">{state.claimNo || '—'}</div>
          </div>
          <div className="mt-1">
            <span className="text-brand-muted">Date</span>
            <div className="font-mono">{state.inspectionDate}</div>
          </div>
          <div className="mt-1">
            <span className="text-brand-muted">Inspector</span>
            <div>{state.inspector || '—'}</div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-[110px_1fr] gap-3 mb-3">
        {(() => {
          const fallback = defectPhotos[0]?.dataUrl ?? careLabelPhotos[0]?.dataUrl;
          const usingUser = !product.productImage && Boolean(fallback);
          const imgSrc =
            product.productImage ??
            fallback ??
            `data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><rect width='400' height='500' fill='#1a1a2e'/><text x='200' y='250' font-family='Inter' font-size='20' fill='#fff' text-anchor='middle' font-weight='700'>${product.brand}</text></svg>`
            )}`;
          return (
            <div className="relative">
              <img
                src={imgSrc}
                alt={product.styleCode}
                className="w-[110px] h-[140px] object-cover border border-neutral-300"
                crossOrigin="anonymous"
              />
              {usingUser && (
                <div
                  className="absolute bottom-0 left-0 right-0 text-[7px] font-semibold text-white text-center py-0.5"
                  style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                >
                  업로드 사진 사용
                </div>
              )}
            </div>
          );
        })()}
        <div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-brand-muted mb-1">
            Product Information
          </div>
          <table className="w-full text-[10px] border-collapse">
            <tbody>
              <Row label="Brand" value={product.brand} />
              <Row label="Style (품번)" value={product.styleCode} mono />
              <Row
                label="Supplier (협력사)"
                value={`${product.supplier} · ${product.supplierVendorCode}`}
              />
              <Row label="Color (칼라)" value={`${product.color} (${product.colorCode})`} />
              <Row label="Season / PO" value={`${product.season} · ${product.poNumber}`} mono />
              <Row
                label="Received / Claim"
                value={`${product.receivedQty.toLocaleString()} pcs  →  ${totalDefectQty.toLocaleString()} pcs (${defectRate.toFixed(2)}%)`}
                mono
                highlight={defectRate >= 2.5}
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-3">
        <SectionTitle>Defect Findings · 불량 내역 · Chi tiết lỗi</SectionTitle>
        <table className="w-full border-collapse border border-neutral-400 text-[9.5px]">
          <thead className="bg-neutral-100">
            <tr>
              <th className="border border-neutral-400 p-1 w-6">#</th>
              <th className="border border-neutral-400 p-1 w-10">Qty</th>
              <th className="border border-neutral-400 p-1">한국어 (KO)</th>
              <th className="border border-neutral-400 p-1">English (EN)</th>
              <th className="border border-neutral-400 p-1">Tiếng Việt (VI)</th>
            </tr>
          </thead>
          <tbody>
            {defects.map((d, i) => {
              const cat = DEFECT_CATALOG[d.category];
              const tl = translations[d.detailKo.trim()];
              return (
                <tr key={d.id} className="align-top">
                  <td className="border border-neutral-400 p-1 text-center font-mono">{i + 1}</td>
                  <td className="border border-neutral-400 p-1 text-center font-mono">{d.qty}</td>
                  <td className="border border-neutral-400 p-1">
                    <div className="font-semibold">{cat.label.ko}</div>
                    <div className="text-neutral-700 mt-0.5">{d.detailKo}</div>
                  </td>
                  <td className="border border-neutral-400 p-1">
                    <div className="font-semibold">{cat.label.en}</div>
                    <div className="text-neutral-700 mt-0.5">{tl?.en || '—'}</div>
                  </td>
                  <td className="border border-neutral-400 p-1">
                    <div className="font-semibold">{cat.label.vi}</div>
                    <div className="text-neutral-700 mt-0.5">{tl?.vi || '—'}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mb-3">
        <SectionTitle>Inspection Guidance · 검사 포인트 · Hướng dẫn kiểm tra</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {(['ko', 'en', 'vi'] as const).map((lang) => (
            <div key={lang} className="border border-neutral-300 p-1.5 bg-neutral-50">
              <div className="text-[8.5px] uppercase tracking-[0.2em] text-brand-muted mb-1">
                {lang === 'ko' ? '한국어' : lang === 'en' ? 'English' : 'Tiếng Việt'}
              </div>
              <ul className="space-y-1 list-disc pl-3.5">
                {dedupedCategories(defects).map((cat) => (
                  <li key={cat} className="text-[9px] leading-snug">
                    <span className="font-semibold">{DEFECT_CATALOG[cat].label[lang]}:</span>{' '}
                    {DEFECT_CATALOG[cat].insight[lang]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Photo Evidence ── Physical samples cannot be shipped overseas,
          so the photo area is enlarged as much as possible. */}
      {(defectPhotos.length > 0 || careLabelPhotos.length > 0) && (
        <section className="mb-2 flex-1 min-h-0">
          <SectionTitle>
            Photo Evidence · 사진 증거 · Bằng chứng hình ảnh
            <span className="ml-2 text-[8.5px] text-brand-muted normal-case tracking-normal font-normal">
              (실물 전달 불가 — 고해상도 사진 기준)
            </span>
          </SectionTitle>

          {defectPhotos.length > 0 && (
            <div className="mb-2">
              <div className="text-[8.5px] uppercase tracking-[0.18em] text-brand-muted mb-1 font-semibold">
                불량 · Defect Evidence
              </div>
              <div
                className={`grid gap-1.5 ${
                  defectPhotos.length === 1
                    ? 'grid-cols-1'
                    : defectPhotos.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2'
                }`}
              >
                {defectPhotos.slice(0, hasBothPhotoTypes ? 4 : 6).map((p, i) => (
                  <figure key={p.id} className="relative">
                    <img
                      src={p.dataUrl}
                      alt={p.name}
                      className={`w-full object-contain bg-neutral-50 border border-neutral-400 ${
                        defectPhotos.length === 1
                          ? 'h-80'
                          : hasBothPhotoTypes
                          ? 'h-44'
                          : 'h-56'
                      }`}
                    />
                    <figcaption className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] font-mono px-1.5 py-0.5 rounded">
                      FIG-D{String(i + 1).padStart(2, '0')}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {careLabelPhotos.length > 0 && (
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.18em] text-brand-muted mb-1 font-semibold">
                케어라벨 · Care Label (검사번호)
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {careLabelPhotos.slice(0, 4).map((p, i) => (
                  <figure key={p.id} className="relative">
                    <img
                      src={p.dataUrl}
                      alt={p.name}
                      className="w-full h-24 object-contain bg-neutral-50 border border-neutral-400"
                    />
                    <figcaption className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] font-mono px-1 py-0.5 rounded">
                      FIG-C{String(i + 1).padStart(2, '0')}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="mt-auto pt-2 border-t border-neutral-300 text-[8.5px] text-brand-muted flex items-center justify-between">
        <span>Confidential · F&amp;F Corporation © {new Date().getFullYear()}</span>
        <span>Photos rendered at max source resolution · PDF @ 3× scale</span>
      </div>
    </div>
  );
});

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr className="border-b border-neutral-200 last:border-0">
      <td className="py-0.5 pr-2 text-brand-muted uppercase text-[8px] tracking-wider w-32 align-top">
        {label}
      </td>
      <td
        className={`py-0.5 ${mono ? 'font-mono' : ''} ${highlight ? 'text-brand-accent font-semibold' : ''}`}
      >
        {value}
      </td>
    </tr>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] uppercase tracking-[0.22em] text-brand-accent font-semibold border-b border-neutral-400 pb-0.5 mb-1.5">
      {children}
    </div>
  );
}

function dedupedCategories(defects: ReportState['defects']) {
  return Array.from(new Set(defects.map((d) => d.category)));
}
