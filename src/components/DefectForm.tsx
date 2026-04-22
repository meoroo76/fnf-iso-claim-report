import { useEffect, useState } from 'react';
import type { DefectEntry, DefectPhoto, ReportState } from '../types';
import { DEFECT_CATALOG, UI_STRINGS } from '../data/defectCatalog';
import type { DefectCategory } from '../data/defectCatalog';
import {
  fetchStyle,
  fetchMeta,
  KGNotFound,
  type KGProduct,
  type KGMeta,
} from '../lib/kgClient';
import { readFileAsDataUrl, uid, todayISO, claimNoFor } from '../lib/fileUtils';

type Props = {
  state: ReportState;
  onChange: (next: ReportState) => void;
  onGenerate: () => void;
  translating?: boolean;
};

const CATEGORIES: DefectCategory[] = Object.keys(DEFECT_CATALOG) as DefectCategory[];

export function DefectForm({ state, onChange, onGenerate, translating = false }: Props) {
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [meta, setMeta] = useState<KGMeta | null>(null);

  useEffect(() => {
    fetchMeta().then(setMeta).catch(() => setMeta(null));
  }, []);

  async function handleLookup() {
    if (!state.styleInput.trim()) return;
    setLookupBusy(true);
    setLookupError(null);
    try {
      const product = await fetchStyle(state.styleInput);
      onChange({
        ...state,
        product,
        styleInput: product.styleCode,
        claimNo:
          state.claimNo || claimNoFor(product.styleCode, state.inspectionDate || todayISO()),
      });
    } catch (err) {
      if (err instanceof KGNotFound) {
        setLookupError(err.hint ?? err.message);
      } else {
        setLookupError(
          err instanceof Error ? err.message : '지식그래프 조회 중 오류가 발생했습니다.'
        );
      }
      onChange({ ...state, product: null });
    } finally {
      setLookupBusy(false);
    }
  }

  function addDefect() {
    const entry: DefectEntry = {
      id: uid('def'),
      category: 'stitching',
      qty: 1,
      detailKo: '',
    };
    onChange({ ...state, defects: [...state.defects, entry] });
  }

  function updateDefect(id: string, patch: Partial<DefectEntry>) {
    onChange({
      ...state,
      defects: state.defects.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  }

  function removeDefect(id: string) {
    onChange({ ...state, defects: state.defects.filter((d) => d.id !== id) });
  }

  async function handlePhotoUpload(kind: 'defect' | 'care', files: FileList | null) {
    if (!files || files.length === 0) return;
    const converted: DefectPhoto[] = await Promise.all(
      Array.from(files).map(async (f) => ({
        id: uid('img'),
        name: f.name,
        dataUrl: await readFileAsDataUrl(f),
      }))
    );
    if (kind === 'defect') {
      onChange({ ...state, defectPhotos: [...state.defectPhotos, ...converted] });
    } else {
      onChange({ ...state, careLabelPhotos: [...state.careLabelPhotos, ...converted] });
    }
  }

  function removePhoto(kind: 'defect' | 'care', id: string) {
    if (kind === 'defect') {
      onChange({ ...state, defectPhotos: state.defectPhotos.filter((p) => p.id !== id) });
    } else {
      onChange({ ...state, careLabelPhotos: state.careLabelPhotos.filter((p) => p.id !== id) });
    }
  }

  const canGenerate =
    state.product !== null &&
    state.defects.length > 0 &&
    state.defects.every((d) => d.detailKo.trim().length > 0);

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* ─ Column 1 : Style + Meta ─ */}
      <div className="space-y-6">
        <BlockTitle num="1" title={UI_STRINGS.styleLookup} sub="지식그래프에서 기본 정보 조회" />

        <div className="flex gap-2">
          <input
            type="text"
            value={state.styleInput}
            onChange={(e) => onChange({ ...state, styleInput: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder={UI_STRINGS.styleLookupPlaceholder}
            disabled={lookupBusy}
            className="flex-1 border border-fnf-border rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-fnf-accent focus:ring-2 focus:ring-fnf-accent/20 bg-white disabled:bg-neutral-100"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookupBusy || !state.styleInput.trim()}
            style={{ backgroundColor: '#1a1a2e', color: '#fff' }}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold hover:brightness-125 transition whitespace-nowrap disabled:opacity-50"
          >
            {lookupBusy ? '조회 중…' : UI_STRINGS.lookupBtn}
          </button>
        </div>

        {meta && (
          <div className="text-[10px] text-fnf-muted flex items-center justify-between">
            <span>
              전체 품번 · 단축 품번(PART_CD) 모두 조회 가능 (예: <code className="font-mono">VDPT10854</code> 또는{' '}
              <code className="font-mono">V25FVDPT10854</code>)
            </span>
            <span
              className="font-mono px-2 py-0.5 rounded-full"
              style={{ backgroundColor: meta.live ? '#00b894' : '#1a1a2e', color: '#fff' }}
              title={meta.source}
            >
              &#9679; {meta.live ? 'LIVE KG' : `KG ${meta.fetchedAt}`} · {meta.totalProducts}건
            </span>
          </div>
        )}

        {lookupError && (
          <div className="danger-box">
            <div className="text-[13px] font-semibold text-fnf-danger mb-0.5">
              &#9888; 조회 실패
            </div>
            <p className="text-sm">{lookupError}</p>
          </div>
        )}
        {state.product && <ProductCard product={state.product} />}

        <div className="grid grid-cols-3 gap-2 pt-2">
          <Field label={UI_STRINGS.claimNo}>
            <input
              className="w-full border border-fnf-border rounded-lg px-3 py-2 text-sm font-mono bg-white"
              value={state.claimNo}
              onChange={(e) => onChange({ ...state, claimNo: e.target.value })}
            />
          </Field>
          <Field label={UI_STRINGS.inspector}>
            <input
              className="w-full border border-fnf-border rounded-lg px-3 py-2 text-sm bg-white"
              value={state.inspector}
              onChange={(e) => onChange({ ...state, inspector: e.target.value })}
            />
          </Field>
          <Field label={UI_STRINGS.inspectionDate}>
            <input
              type="date"
              className="w-full border border-fnf-border rounded-lg px-3 py-2 text-sm bg-white"
              value={state.inspectionDate}
              onChange={(e) => onChange({ ...state, inspectionDate: e.target.value })}
            />
          </Field>
        </div>

        <div className="tip-box">
          <div className="text-[12px] font-bold text-fnf-success mb-0.5 tracking-wider">TIP</div>
          <p className="text-[13px]">
            <strong>지식그래프 실시간 조회</strong> — 기본정보(제품이미지·협력사·품번·컬러·입고수량)가 KG에서 자동으로 로드됩니다. 프로덕션에서는 <code className="text-[11px]">KG_API_BASE</code> 환경변수로 실 KG 엔드포인트와 연결됩니다.
          </p>
        </div>
      </div>

      {/* ─ Column 2 : Defects + Photos ─ */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <BlockTitle num="2" title={UI_STRINGS.defectList} sub="불량 카테고리 · 수량 · 상세" />
          <button
            type="button"
            onClick={addDefect}
            style={{ backgroundColor: '#e94560', color: '#fff' }}
            className="flex-shrink-0 text-sm px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition shadow-accent-glow"
          >
            {UI_STRINGS.addDefect}
          </button>
        </div>

        <div className="space-y-2.5">
          {state.defects.length === 0 && (
            <button
              type="button"
              onClick={addDefect}
              className="w-full border-2 border-dashed rounded-xl py-8 text-center hover:brightness-105 transition group"
              style={{ borderColor: '#e94560', backgroundColor: '#fff5f6' }}
            >
              <div className="text-3xl mb-2">&#10133;</div>
              <div className="text-[15px] font-bold" style={{ color: '#e94560' }}>
                불량 내역 추가하기
              </div>
              <div className="text-[12px] mt-1" style={{ color: '#636e72' }}>
                카테고리 · 수량 · 상세를 입력할 수 있습니다 (최소 1건)
              </div>
            </button>
          )}
          {state.defects.map((d, idx) => (
            <div
              key={d.id}
              className="border border-fnf-border rounded-lg p-3 bg-fnf-bg hover:border-fnf-accent/50 transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 flex items-center justify-center bg-fnf-accent2 text-white rounded-md text-[11px] font-bold">
                  {idx + 1}
                </span>
                <select
                  className="flex-1 border border-fnf-border rounded-md px-2 py-1.5 text-sm bg-white"
                  value={d.category}
                  onChange={(e) =>
                    updateDefect(d.id, { category: e.target.value as DefectCategory })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {DEFECT_CATALOG[c].label.ko}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className="w-16 border border-fnf-border rounded-md px-2 py-1.5 text-sm text-center font-mono bg-white"
                  value={d.qty}
                  onChange={(e) => updateDefect(d.id, { qty: Number(e.target.value) })}
                />
                <button
                  type="button"
                  onClick={() => removeDefect(d.id)}
                  className="text-xs text-fnf-danger hover:bg-red-50 rounded px-2 py-1"
                  title="삭제"
                >
                  &#10005;
                </button>
              </div>
              <textarea
                placeholder={UI_STRINGS.detail}
                className="w-full border border-fnf-border rounded-md px-3 py-2 text-sm bg-white"
                rows={2}
                value={d.detailKo}
                onChange={(e) => updateDefect(d.id, { detailKo: e.target.value })}
              />
            </div>
          ))}
        </div>

        <BlockTitle num="3" title="사진 업로드" sub="불량 사진 · 케어라벨(검사번호)" />
        <div className="grid grid-cols-2 gap-3">
          <PhotoUploader
            label={UI_STRINGS.photos}
            photos={state.defectPhotos}
            onUpload={(files) => handlePhotoUpload('defect', files)}
            onRemove={(id) => removePhoto('defect', id)}
            icon="&#128247;"
          />
          <PhotoUploader
            label={UI_STRINGS.careLabel}
            photos={state.careLabelPhotos}
            onUpload={(files) => handlePhotoUpload('care', files)}
            onRemove={(id) => removePhoto('care', id)}
            icon="&#127991;"
          />
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || translating}
          style={{
            backgroundColor: translating || !canGenerate ? undefined : '#e94560',
            color: '#fff',
          }}
          className="w-full py-3.5 rounded-lg font-semibold tracking-wide uppercase text-sm hover:brightness-110 transition disabled:bg-neutral-300 disabled:cursor-not-allowed shadow-accent-glow disabled:shadow-none"
        >
          {translating ? '번역 중… (EN / VI 동시 처리)' : `${UI_STRINGS.generateReport} ➡`}
        </button>
      </div>
    </div>
  );
}

function BlockTitle({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-shrink-0 w-9 h-9 rounded-lg text-white flex items-center justify-center font-bold font-mono text-base shadow-card" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        {num}
      </span>
      <div>
        <div className="text-[15px] font-bold text-fnf-primary leading-tight">{title}</div>
        <div className="text-[11px] text-fnf-muted uppercase tracking-wider">{sub}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.15em] text-fnf-muted block mb-1 font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}

function ProductCard({ product }: { product: KGProduct }) {
  const img =
    product.productImage ??
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><rect width='400' height='500' fill='#1a1a2e'/><text x='200' y='250' font-family='Inter' font-size='20' fill='#fff' text-anchor='middle' font-weight='700'>${product.brand}</text></svg>`
    )}`;
  return (
    <div className="border border-fnf-border rounded-xl overflow-hidden bg-white flex shadow-card hover:shadow-cardHover transition relative">
      <div
        className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-10"
        style={{
          backgroundColor: product.source === 'kg-live' ? '#00b894' : '#e94560',
          color: '#fff',
        }}
      >
        {product.season} · {product.source === 'kg-live' ? 'LIVE KG' : 'KG SNAPSHOT'}
      </div>
      <img
        src={img}
        alt={product.styleCode}
        className="w-32 h-44 object-cover bg-neutral-100"
        crossOrigin="anonymous"
      />
      <div className="p-3 flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
        <InfoCell label="Brand" value={product.brand} />
        <InfoCell label="Style" value={product.styleCode} mono />
        <InfoCell label="Product" value={product.productName} />
        <InfoCell label="Category" value={`${product.category} · ${product.sex}`} />
        <InfoCell
          label="Supplier"
          value={product.supplier}
          hint={product.supplierVendorCode}
        />
        <InfoCell label="Color" value={`${product.color} (${product.colorCode})`} />
        <InfoCell
          label="Received"
          value={`${product.receivedQty.toLocaleString()} pcs`}
          mono
        />
        <InfoCell label="PO" value={product.poNumber} mono />
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  mono,
  hint,
}: {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase text-fnf-muted tracking-wider font-semibold">
        {label}
      </div>
      <div className={`${mono ? 'font-mono' : ''} font-semibold text-fnf-primary`}>{value}</div>
      {hint && <div className="text-[10px] text-fnf-muted font-mono">{hint}</div>}
    </div>
  );
}

function PhotoUploader({
  label,
  photos,
  onUpload,
  onRemove,
  icon,
}: {
  label: string;
  photos: DefectPhoto[];
  onUpload: (files: FileList | null) => void;
  onRemove: (id: string) => void;
  icon: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.15em] text-fnf-muted mb-1.5 font-semibold">
        {label}
      </div>
      <label className="block border-2 border-dashed border-fnf-border rounded-lg p-4 text-center cursor-pointer hover:border-fnf-accent hover:bg-fnf-accent/5 transition">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
        <div className="text-2xl mb-1" dangerouslySetInnerHTML={{ __html: icon }} />
        <div className="text-xs text-fnf-muted">클릭하여 업로드 (다중 선택)</div>
      </label>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {photos.map((p) => (
            <div key={p.id} className="relative group">
              <img
                src={p.dataUrl}
                alt={p.name}
                className="w-full h-16 object-cover rounded border border-fnf-border"
              />
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                className="absolute top-1 right-1 bg-fnf-danger text-white text-[10px] w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                &#10005;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
