import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DefectForm } from './components/DefectForm';
import { ReportPreview } from './components/ReportPreview';
import { UI_STRINGS } from './data/defectCatalog';
import type { ReportState } from './types';
import { todayISO } from './lib/fileUtils';
import { exportElementToPdf, renderElementToPdfBlob } from './lib/exportPdf';
import { exportReportToDocx } from './lib/exportDocx';
import { translateBatch } from './lib/translate';
import { generateReportAi, AiGenerationError } from './lib/aiClient';
import { saveReportToSheet, type SheetSaveResult } from './lib/sheetClient';
import { SendDialog } from './components/SendDialog';
import { clearState, loadState, loadMeta, saveState, type PersistMeta } from './lib/persistence';
import { buildReportLogEntry, saveReportLog } from './lib/reportLogClient';

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
  productionGuidance: null,
  thirdLanguage: 'vi',
};

export default function App() {
  const [state, setState] = useState<ReportState>(() => {
    // Merge persisted state with initialState so newly-added fields (e.g.
    // thirdLanguage, productionGuidance) get sane defaults on first load
    // after an app upgrade.
    const loaded = loadState();
    return loaded ? { ...initialState, ...loaded } : initialState;
  });
  const [persistMeta, setPersistMeta] = useState<PersistMeta | null>(() => loadMeta());
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
  const [generationStage, setGenerationStage] = useState<
    'idle' | 'ai' | 'translate-fallback'
  >('idle');
  const [aiError, setAiError] = useState<string | null>(null);
  const [sheetSave, setSheetSave] = useState<SheetSaveResult | null>(null);

  // ── Auto-save to localStorage on every state change (debounced ~300ms) ──
  useEffect(() => {
    const t = window.setTimeout(() => {
      const meta = saveState(state);
      if (meta) setPersistMeta(meta);
    }, 300);
    return () => window.clearTimeout(t);
  }, [state]);

  async function handleGenerate() {
    if (!state.product) return;
    setTranslating(true);
    setAiError(null);
    setGenerationStage('ai');

    let translations: ReportState['translations'] = {};
    let productionGuidance: ReportState['productionGuidance'] = null;
    let aiSource: 'claude' | 'mymemory-fallback' | 'unknown' = 'unknown';

    try {
      const result = await generateReportAi(state.defects, state.product, state.thirdLanguage);
      // Merge with existing translations so prior third-language outputs stay
      // cached when the user re-runs in a different language.
      translations = { ...state.translations };
      for (const [ko, entry] of Object.entries(result.translations)) {
        translations[ko] = { ...(translations[ko] ?? { en: entry.en }), ...entry };
      }
      productionGuidance = state.productionGuidance
        ? { ...state.productionGuidance, ...result.guidance }
        : result.guidance;
      aiSource = 'claude';
    } catch (err) {
      // Graceful fallback: use MyMemory translations so the report still
      // generates even if the AI Gateway is unavailable. Guidance is left
      // null and the catalog defaults render in its place.
      const message =
        err instanceof AiGenerationError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'AI 생성 실패';
      setAiError(`${message} — 기본 번역으로 대체합니다.`);
      setGenerationStage('translate-fallback');
      const texts = state.defects.map((d) => d.detailKo).filter((t) => t.trim().length > 0);
      translations = texts.length > 0 ? await translateBatch(texts) : {};
      aiSource = 'mymemory-fallback';
    }

    const nextState: ReportState = {
      ...state,
      generated: true,
      translations,
      productionGuidance,
      thirdLanguage: state.thirdLanguage,
    };
    setState(nextState);
    setGenerationStage('idle');
    setTranslating(false);

    // Persist to server CSV log (timestamped row)
    const entry = buildReportLogEntry(nextState);
    if (entry) {
      saveReportLog(entry).catch(() => {
        /* silent — localStorage still holds the draft */
      });
    }

    // Fire-and-forget: append a row to the configured Google Sheet for the
    // searchable claim history / dashboard. Failure does not block the report.
    setSheetSave(null);
    saveReportToSheet(nextState, { aiSource }).then((result) => setSheetSave(result));

    setTimeout(() => {
      document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleResetInputs() {
    if (!window.confirm('현재 입력값을 모두 지우고 새로 시작하시겠습니까?')) return;
    clearState();
    setState(initialState);
    setPersistMeta(null);
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

          {/* AI error banner (shown only when AI failed and we fell back) */}
          {aiError && (
            <div
              className="mb-4 px-4 py-3 rounded-lg border text-sm"
              style={{
                background: '#fff7ed',
                borderColor: '#fdba74',
                color: '#9a3412',
              }}
            >
              <strong>AI 생성 실패:</strong> {aiError}
            </div>
          )}

          {/* Google Sheet save indicator — small status pill */}
          {sheetSave && (
            <div
              className="mb-4 px-4 py-2.5 rounded-lg border text-sm flex items-center justify-between gap-3"
              style={
                sheetSave.ok
                  ? { background: '#ecfdf5', borderColor: '#6ee7b7', color: '#065f46' }
                  : { background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }
              }
            >
              <span>
                {sheetSave.ok ? (
                  <>
                    <strong>Sheet에 저장됨</strong>
                    {sheetSave.updatedRange && (
                      <span className="ml-2 text-xs opacity-75 font-mono">
                        ({sheetSave.updatedRange})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <strong>Sheet 저장 실패:</strong> {sheetSave.error}
                    <span className="ml-2 text-xs opacity-75">
                      (리포트는 정상 생성됨, 저장만 실패)
                    </span>
                  </>
                )}
              </span>
              {sheetSave.ok && sheetSave.sheetUrl && (
                <a
                  href={sheetSave.sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold underline whitespace-nowrap"
                >
                  📊 보관함 열기
                </a>
              )}
            </div>
          )}

          {/* Input card */}
          <div className="fnf-card">
            <DefectForm
              state={state}
              onChange={setState}
              onGenerate={handleGenerate}
              translating={translating}
              generationStage={generationStage}
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
