import { useEffect, useMemo, useState } from 'react';
import type { ReportState } from '../types';
import { generateEmailDraft } from '../lib/emailBody';
import {
  dataUrlToBlob,
  fetchNotifyStatus,
  postToTeams,
  sanitizeFilename,
  sendEmail,
  type EmailAttachment,
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

  const photoAttachmentPreview = useMemo(() => {
    const defect = state.defectPhotos.map((p, i) => {
      const blob = dataUrlToBlob(p.dataUrl);
      return {
        filename: `FIG-D${String(i + 1).padStart(2, '0')}_${sanitizeFilename(p.name)}`,
        size: blob.size,
        role: 'defect' as const,
      };
    });
    const care = state.careLabelPhotos.map((p, i) => {
      const blob = dataUrlToBlob(p.dataUrl);
      return {
        filename: `FIG-C${String(i + 1).padStart(2, '0')}_${sanitizeFilename(p.name)}`,
        size: blob.size,
        role: 'care' as const,
      };
    });
    return [...defect, ...care];
  }, [state.defectPhotos, state.careLabelPhotos]);

  const totalEstimatedBytes =
    photoAttachmentPreview.reduce((acc, p) => acc + p.size, 0) + 800_000; // +~800KB PDF estimate

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
      const attachments: EmailAttachment[] = [];

      // 1) PDF report first
      const pdf = await buildPdfBlob();
      if (pdf) {
        attachments.push({
          blob: pdf.blob,
          filename: pdf.filename,
          contentType: 'application/pdf',
        });
      }

      // 2) Original defect photos
      state.defectPhotos.forEach((p, i) => {
        const blob = dataUrlToBlob(p.dataUrl);
        attachments.push({
          blob,
          filename: `FIG-D${String(i + 1).padStart(2, '0')}_${sanitizeFilename(p.name)}`,
          contentType: blob.type,
        });
      });

      // 3) Original care-label photos
      state.careLabelPhotos.forEach((p, i) => {
        const blob = dataUrlToBlob(p.dataUrl);
        attachments.push({
          blob,
          filename: `FIG-C${String(i + 1).padStart(2, '0')}_${sanitizeFilename(p.name)}`,
          contentType: blob.type,
        });
      });

      const r = await sendEmail({
        to: toList,
        cc: cc ? parseList(cc) : undefined,
        subject,
        bodyText: body,
        attachments,
      });

      const sizeText = r.totalBytes
        ? ` · 총 ${(r.totalBytes / 1024 / 1024).toFixed(2)}MB`
        : '';
      setResult({
        ok: r.ok,
        text: r.simulated
          ? `✉ 시뮬레이션 성공 — 첨부 ${r.attachmentCount}건${sizeText} (PDF + 원본 사진). SMTP 미설정 상태.`
          : `✉ 메일 발송 완료. 첨부 ${r.attachmentCount}건${sizeText} · Message-ID: ${r.messageId}`,
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
        summary: `Claim ${state.claimNo} · ${state.product.brand} ${state.product.partCode} · ${totalDefectQty}pcs (${claimRate.toFixed(2)}%)`,
        claimNo: state.claimNo,
        brand: state.product.brand,
        styleCode: state.product.partCode,
        season: state.product.season,
        claimRate,
        attachmentName: `ISO_Claim_Report_${state.claimNo || state.product.partCode}.pdf`,
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

          <div className="text-[11px] bg-fnf-bg rounded-md p-3 border border-fnf-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-fnf-primary">
                📎 첨부 파일 ({1 + photoAttachmentPreview.length}건 · 약{' '}
                {(totalEstimatedBytes / 1024 / 1024).toFixed(2)} MB 예상)
              </span>
              {totalEstimatedBytes > 25 * 1024 * 1024 && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: '#fff0e6', color: '#d63031' }}
                >
                  ⚠ Gmail 25MB 제한 초과 가능
                </span>
              )}
            </div>
            <div className="font-mono text-[11px] space-y-0.5 text-fnf-muted max-h-32 overflow-y-auto">
              <div>
                📄 <strong className="text-fnf-primary">ISO_Claim_Report_{state.claimNo || state.product.partCode}.pdf</strong>
                <span className="ml-2 text-[10px]">(3× 해상도로 렌더)</span>
              </div>
              {photoAttachmentPreview.map((p) => (
                <div key={p.filename}>
                  {p.role === 'defect' ? '🖼' : '🏷'} {p.filename}
                  <span className="ml-2 text-[10px]">
                    ({(p.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ))}
              {photoAttachmentPreview.length === 0 && (
                <div className="italic">업로드한 사진이 없어 PDF만 첨부됩니다.</div>
              )}
            </div>
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
