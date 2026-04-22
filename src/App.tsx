import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DefectForm } from './components/DefectForm';
import { ReportPreview } from './components/ReportPreview';
import { UI_STRINGS } from './data/defectCatalog';
import type { ReportState } from './types';
import { todayISO } from './lib/fileUtils';
import { exportElementToPdf, renderElementToPdfBlob } from './lib/exportPdf';
import { exportReportToDocx } from './lib/exportDocx';
import { translateBatch } from './lib/translate';
import { SendDialog } from './components/SendDialog';

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const initialState: ReportState = {
  product: null,
  styleInput: '',
  claimNo: '',
  inspector: '',
  inspectionDate: todayISO(),
  defects: [],
  defectPhotos: [],
  careLabelPhotos: [],
  generated: false,
  translations: {},
};

export default function App() {
  const [state, setState] = useState<ReportState>(initialState);
  const reportRef = useRef<HTMLDivElement>(null);
  const scaleWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState<null | 'pdf' | 'docx'>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'input' | 'preview'>('input');

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => {
      const w = el.clientWidth;
      const s = Math.min(1, w / A4_WIDTH);
      setScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if ('fonts' in document) {
      (document as any).fonts.ready?.then(() => {
        if (containerRef.current) {
          const w = containerRef.current.clientWidth;
          setScale(Math.min(1, w / A4_WIDTH));
        }
      });
    }
  }, []);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('section[data-section]')
    );
    if (sections.length === 0) return;
    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.getAttribute('data-section') as 'input' | 'preview';
            setActiveSection(id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    sections.forEach((s) => ob.observe(s));
    return () => ob.disconnect();
  }, []);

  const [translating, setTranslating] = useState(false);

  async function handleGenerate() {
    setTranslating(true);
    try {
      const texts = state.defects.map((d) => d.detailKo).filter((t) => t.trim().length > 0);
      const translations = texts.length > 0 ? await translateBatch(texts) : {};
      setState((s) => ({ ...s, generated: true, translations }));
      setTimeout(() => {
        document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } finally {
      setTranslating(false);
    }
  }

  async function handleExportPdf() {
    if (!reportRef.current || !state.product) return;
    setBusy('pdf');
    const wrapper = scaleWrapperRef.current;
    const prevTransform = wrapper?.style.transform ?? '';
    if (wrapper) wrapper.style.transform = 'scale(1)';
    try {
      await exportElementToPdf(
        reportRef.current,
        `ISO_Claim_Report_${state.claimNo || state.product.styleCode}.pdf`
      );
    } finally {
      if (wrapper) wrapper.style.transform = prevTransform;
      setBusy(null);
    }
  }

  async function buildPdfBlobForSend() {
    if (!reportRef.current || !state.product) return null;
    const wrapper = scaleWrapperRef.current;
    const prev = wrapper?.style.transform ?? '';
    if (wrapper) wrapper.style.transform = 'scale(1)';
    try {
      return await renderElementToPdfBlob(
        reportRef.current,
        `ISO_Claim_Report_${state.claimNo || state.product.styleCode}.pdf`
      );
    } finally {
      if (wrapper) wrapper.style.transform = prev;
    }
  }

  async function handleExportDocx() {
    if (!state.product) return;
    setBusy('docx');
    try {
      await exportReportToDocx(state);
    } finally {
      setBusy(null);
    }
  }

  function seedDemo() {
    // Use a real 25FW DUVETICA style pulled from the live KG snapshot.
    setState({ ...initialState, styleInput: 'V25FVDPT10854' });
  }

  const totalDefectQty = state.defects.reduce((acc, d) => acc + d.qty, 0);
  const receivedQty = state.product?.receivedQty ?? 0;
  const defectRate = receivedQty > 0 ? (totalDefectQty / receivedQty) * 100 : 0;
  const riskLevel = defectRate >= 2.5 ? 'critical' : defectRate >= 1 ? 'high' : defectRate > 0 ? 'medium' : 'low';

  return (
    <div className="min-h-screen">
      {/* ── Top Nav ── */}
      <nav className="top-nav flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="headline-serif text-white text-xl tracking-tight">F&amp;F</div>
            <span className="text-white/30">|</span>
            <span className="text-white/90 text-sm font-semibold tracking-wider uppercase">
              QA · ISO Claim Report
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a href="#input" className={activeSection === 'input' ? 'active' : ''}>
              &#9998; 입력
            </a>
            <a href="#preview" className={activeSection === 'preview' ? 'active' : ''}>
              &#128196; 리포트
            </a>
            <button
              type="button"
              onClick={seedDemo}
              className="ml-2 border border-white/20 hover:border-white/40"
            >
              데모 불러오기
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Header ── */}
      <header className="hero hdr-fire">
        <div className="absolute inset-0 opacity-25 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(233,69,96,0.8) 0%, transparent 55%)' }} />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="badge">ISO 2859-1 · AQL</div>
          <h1 className="headline-serif text-5xl font-bold leading-tight">ISO Claim Report</h1>
          <p className="text-white/80 text-base mt-2 max-w-2xl">
            생산 완료 · 매장 입고 후 발생한 소비자/매장 클레임을 한국어 · 영어 · 베트남어로 동시 문서화합니다.
          </p>

          {/* Meta bar */}
          <div className="flex flex-wrap gap-5 mt-6 text-white/80 text-sm">
            <MetaDot color="green" label="Knowledge Graph: ONLINE (mock)" />
            <MetaDot color="blue" label="Tri-lingual: KO / EN / VI" />
            <MetaDot color="red" label="ISO 2859-1 Compliant" />
          </div>
        </div>
      </header>

      <div className="session-divider" />

      {/* ── Section 1: Input ── */}
      <section id="input" data-section="input" className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-fnf-accent font-semibold mb-2">
                Step 1
              </div>
              <h2 className="section-h2">{UI_STRINGS.sectionInput}</h2>
              <p className="text-fnf-muted mt-2 text-sm">
                스타일을 조회하고 불량 내역 · 사진을 입력하세요. 지식그래프에서 기본 정보가 자동 로드됩니다.
              </p>
            </div>
          </div>

          {/* Stats bar — live summary of the current input state */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="stat-card">
              <div className={`stat-value ${state.product ? 'info' : ''}`}>
                {state.product ? '1' : '0'}
              </div>
              <div className="stat-label">Style Matched</div>
              <div className="stat-sub">{state.product?.styleCode || '— 미조회'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value accent">{state.defects.length}</div>
              <div className="stat-label">Defect Items</div>
              <div className="stat-sub">{totalDefectQty.toLocaleString()} pcs</div>
            </div>
            <div className="stat-card">
              <div className={`stat-value ${defectRate >= 2.5 ? 'danger' : defectRate > 0 ? 'accent' : ''}`}>
                {defectRate.toFixed(2)}%
              </div>
              <div className="stat-label">Claim Rate</div>
              <div className="stat-sub">of {receivedQty.toLocaleString()} received</div>
            </div>
            <div className="stat-card">
              <div className="stat-value info">
                {state.defectPhotos.length + state.careLabelPhotos.length}
              </div>
              <div className="stat-label">Evidence Photos</div>
              <div className="stat-sub">
                불량 {state.defectPhotos.length} · 케어 {state.careLabelPhotos.length}
              </div>
            </div>
          </div>

          {/* Risk alert when critical */}
          {state.product && riskLevel !== 'low' && (
            <div className="alert-box mb-6">
              <div className="alert-icon">&#9888;</div>
              <div className="flex-1">
                <div className="font-bold text-base mb-0.5">
                  클레임율 {defectRate.toFixed(2)}% —{' '}
                  <span className="risk-badge risk-critical ml-1">
                    {riskLevel === 'critical' ? 'CRITICAL' : riskLevel === 'high' ? 'HIGH' : 'MEDIUM'}
                  </span>
                </div>
                <div className="text-sm opacity-95">
                  {riskLevel === 'critical'
                    ? '협력사 차지백 및 동일 롯트 매장 재고 회수 조치를 즉시 검토하세요.'
                    : riskLevel === 'high'
                    ? '매장 재고 리워크 · 교환 대응 범위를 QA 리드와 확정하세요.'
                    : '통상 처리 절차로 고객 교환 · 환불 진행 가능합니다.'}
                </div>
              </div>
            </div>
          )}

          {/* Input card */}
          <div className="fnf-card">
            <DefectForm
              state={state}
              onChange={setState}
              onGenerate={handleGenerate}
              translating={translating}
            />
          </div>
        </div>
      </section>

      <div className="session-divider" />

      {/* ── Section 2: Preview ── */}
      <section id="preview" data-section="preview" className="py-10 bg-white/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-6 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-fnf-accent font-semibold mb-2">
                Step 2
              </div>
              <h2 className="section-h2">{UI_STRINGS.sectionPreview}</h2>
              <p className="text-fnf-muted mt-2 text-sm">
                KO / EN / VI 삼중 기재 · A4 단일 페이지 · 미리보기는 실시간 반영됩니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!state.generated || busy !== null}
                style={{ backgroundColor: '#1a1a2e', color: '#fff' }}
                className="px-4 py-2.5 text-sm rounded-lg font-semibold hover:brightness-125 transition disabled:opacity-50 shadow-card"
              >
                {busy === 'pdf' ? '생성 중…' : `📄 PDF`}
              </button>
              <button
                type="button"
                onClick={handleExportDocx}
                disabled={!state.generated || busy !== null}
                style={{ backgroundColor: '#0f3460', color: '#fff' }}
                className="px-4 py-2.5 text-sm rounded-lg font-semibold hover:brightness-125 transition disabled:opacity-50"
              >
                {busy === 'docx' ? '생성 중…' : `📝 Word`}
              </button>
              <button
                type="button"
                onClick={() => setSendOpen(true)}
                disabled={!state.generated}
                style={{ backgroundColor: '#e94560', color: '#fff' }}
                className="px-4 py-2.5 text-sm rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 shadow-accent-glow"
              >
                ✉ 자동 공유 (Email / Teams)
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="bg-gradient-to-br from-neutral-200 to-neutral-100 rounded-xl p-4 border border-fnf-border"
            style={{ height: `${A4_HEIGHT * scale + 32}px` }}
          >
            <div
              ref={scaleWrapperRef}
              style={{
                width: A4_WIDTH,
                height: A4_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <ReportPreview ref={reportRef} state={state} />
            </div>
          </div>
        </div>
      </section>

      <SendDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        state={state}
        buildPdfBlob={buildPdfBlobForSend}
      />

      {/* ── Footer ── */}
      <footer className="bg-fnf-primary text-white/60 text-center py-5 text-xs tracking-wider">
        F&amp;F Corporation · QA Tooling · Prototype · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function MetaDot({
  color,
  label,
}: {
  color: 'green' | 'yellow' | 'blue' | 'red';
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`meta-dot ${color}`} />
      <span>{label}</span>
    </div>
  );
}
