import { useEffect, useMemo, useState } from 'react';
import type { ReportState } from '../types';
import { generateEmailDraft } from '../lib/emailBody';
import {
  fetchNotifyStatus,
  postToTeams,
  sendEmail,
  type NotifyStatus,
} from '../lib/notifyClient';

type Props = {
  open: boolean;
  onClose: () => void;
  state: ReportState;
  buildPdfBlob: () => Promise<{ blob: Blob; filename: string } | null>;
};

export function SendDialog({ open, onClose, state, buildPdfBlob }: Props) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [lang, setLang] = useState<'combined' | 'ko' | 'en' | 'vi'>('combined');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState<null | 'email' | 'teams'>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [status, setStatus] = useState<NotifyStatus | null>(null);

  const draft = useMemo(() => {
    if (!state.product) return null;
    const totalDefectQty = state.defects.reduce((a, d) => a + d.qty, 0);
    const claimRate =
      state.product.receivedQty > 0 ? (totalDefectQty / state.product.receivedQty) * 100 : 0;
    return generateEmailDraft({
      product: state.product,
      claimNo: state.claimNo,
      inspectionDate: state.inspectionDate,
      inspector: state.inspector,
      defects: state.defects,
      translations: state.translations,
      totalDefectQty,
      claimRate,
    });
  }, [state]);

  useEffect(() => {
    if (!open) return;
    fetchNotifyStatus().then(setStatus).catch(() => setStatus(null));
  }, [open]);

  useEffect(() => {
    if (!draft) return;
    setSubject(draft.subject);
    setBody(
      lang === 'ko'
        ? draft.bodyKo
        : lang === 'en'
        ? draft.bodyEn
        : lang === 'vi'
        ? draft.bodyVi
        : draft.combined
    );
  }, [draft, lang]);

  if (!open || !state.product || !draft) return null;

  const parseList = (s: string) =>
    s
      .split(/[,;\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);

  async function handleSendEmail() {
    if (!state.product || !draft) return;
    const toList = parseList(to);
    if (toList.length === 0) {
      setResult({ ok: false, text: '받는 사람(To)을 한 명 이상 입력하세요.' });
      return;
    }
    setBusy('email');
    setResult(null);
    try {
      const pdf = await buildPdfBlob();
      const r = await sendEmail({
        to: toList,
        cc: cc ? parseList(cc) : undefined,
        subject,
        bodyText: body,
        attachmentBlob: pdf?.blob,
        attachmentName: pdf?.filename ?? `ISO_Claim_Report_${state.claimNo || state.product.styleCode}.pdf`,
      });
      setResult({
        ok: r.ok,
        text: r.simulated
          ? '✉ 시뮬레이션 성공 — SMTP 미설정 상태. 실제 발송하려면 환경변수 SMTP_HOST/USER/PASS/FROM 설정 후 재기동하세요.'
          : `✉ 메일 발송 완료. Message-ID: ${r.messageId}`,
      });
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : '발송 실패' });
    } finally {
      setBusy(null);
    }
  }

  async function handlePostTeams() {
    if (!state.product || !draft) return;
    setBusy('teams');
    setResult(null);
    try {
      const totalDefectQty = state.defects.reduce((a, d) => a + d.qty, 0);
      const claimRate =
        (totalDefectQty / state.product.receivedQty) * 100;
      const r = await postToTeams({
        subject: draft.subject,
        summary: `Claim ${state.claimNo} · ${state.product.brand} ${state.product.styleCode} · ${totalDefectQty}pcs (${claimRate.toFixed(2)}%)`,
        claimNo: state.claimNo,
        brand: state.product.brand,
        styleCode: state.product.styleCode,
        season: state.product.season,
        claimRate,
        attachmentName: `ISO_Claim_Report_${state.claimNo || state.product.styleCode}.pdf`,
      });
      setResult({
        ok: r.ok,
        text: r.simulated
          ? '📣 시뮬레이션 성공 — TEAMS_WEBHOOK_URL 미설정 상태. 설정 후 재기동하면 실제 채널에 게시됩니다.'
          : '📣 Teams 채널 게시 완료.',
      });
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : '게시 실패' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] opacity-75">
              Automated Notification
            </div>
            <div className="text-lg font-semibold headline-serif">리포트 자동 공유</div>
          </div>
          <div className="flex items-center gap-2">
            {status && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: status.mode === 'live' ? '#00b894' : '#fdcb6e',
                  color: '#111',
                }}
              >
                ● {status.mode === 'live' ? 'LIVE' : 'SIMULATION'}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.15em] text-fnf-muted block mb-1 font-semibold">
                To (쉼표 구분)
              </span>
              <input
                className="w-full border border-fnf-border rounded-lg px-3 py-2 text-sm font-mono bg-white"
                placeholder="supplier@example.com, qa-lead@fnfcorp.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.15em] text-fnf-muted block mb-1 font-semibold">
                CC (선택)
              </span>
              <input
                className="w-full border border-fnf-border rounded-lg px-3 py-2 text-sm font-mono bg-white"
                placeholder="md@fnfcorp.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-fnf-muted font-semibold">
              본문 언어
            </span>
            {(
              [
                ['combined', 'KO+EN+VI'],
                ['ko', '한국어'],
                ['en', 'English'],
                ['vi', 'Tiếng Việt'],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`text-[11px] px-3 py-1 rounded-full font-semibold transition border ${
                  lang === code
                    ? 'border-transparent text-white'
                    : 'border-fnf-border text-fnf-primary hover:border-fnf-accent'
                }`}
                style={lang === code ? { backgroundColor: '#0f3460' } : undefined}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.15em] text-fnf-muted block mb-1 font-semibold">
              제목 (자동 생성 · 수정 가능)
            </span>
            <input
              className="w-full border border-fnf-border rounded-lg px-3 py-2 text-sm bg-white"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.15em] text-fnf-muted block mb-1 font-semibold">
              본문 (자동 생성 · 수정 가능)
            </span>
            <textarea
              className="w-full border border-fnf-border rounded-lg px-3 py-2 text-[12.5px] font-mono bg-white"
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>

          <div className="text-[11px] text-fnf-muted bg-fnf-bg rounded-md p-2.5 border border-fnf-border">
            📎 첨부: <strong>ISO_Claim_Report_{state.claimNo || state.product.styleCode}.pdf</strong>{' '}
            (Send 클릭 시 현재 미리보기를 3× 해상도 PDF로 즉시 렌더)
          </div>

          {result && (
            <div
              className={`rounded-md p-3 text-sm ${
                result.ok
                  ? 'bg-green-50 border border-green-200 text-green-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              {result.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-fnf-border flex items-center justify-between bg-fnf-bg">
          <div className="text-[11px] text-fnf-muted">
            프로덕션: <code>SMTP_*</code> · <code>TEAMS_WEBHOOK_URL</code> 환경변수 설정 시 실발송
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-fnf-border rounded-lg hover:bg-white"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handlePostTeams}
              disabled={busy !== null}
              style={{ backgroundColor: '#0f3460', color: '#fff' }}
              className="px-4 py-2 text-sm rounded-lg font-semibold hover:brightness-125 transition disabled:opacity-50"
            >
              {busy === 'teams' ? '게시 중…' : '📣 Teams 채널 게시'}
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={busy !== null}
              style={{ backgroundColor: '#e94560', color: '#fff' }}
              className="px-4 py-2 text-sm rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 shadow-accent-glow"
            >
              {busy === 'email' ? '발송 중…' : '✉ 이메일 발송 (PDF 첨부)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
