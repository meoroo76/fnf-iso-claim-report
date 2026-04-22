// Frontend client for the notify API (email / Teams).

export type NotifyStatus = {
  email: boolean;
  teams: boolean;
  mode: 'live' | 'simulation';
};

export async function fetchNotifyStatus(): Promise<NotifyStatus> {
  const res = await fetch('/api/notify/status');
  if (!res.ok) throw new Error('notify status unavailable');
  return res.json();
}

export type EmailAttachment = {
  blob: Blob;
  filename: string;
  contentType?: string;
};

export type SendEmailInput = {
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  attachments: EmailAttachment[];
};

export type SendEmailResult = {
  ok: boolean;
  simulated: boolean;
  messageId?: string;
  attachmentCount?: number;
  totalBytes?: number;
};

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let s = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const attachments = await Promise.all(
    input.attachments.map(async (a) => ({
      name: a.filename,
      base64: await blobToBase64(a.blob),
      contentType: a.contentType ?? a.blob.type,
    }))
  );
  const res = await fetch('/api/notify/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      bodyText: input.bodyText,
      attachments,
    }),
  });
  if (!res.ok) throw new Error(`이메일 발송 실패 (${res.status})`);
  return res.json();
}

export type PostToTeamsInput = {
  subject: string;
  summary: string;
  claimNo?: string;
  brand?: string;
  styleCode?: string;
  season?: string;
  claimRate?: number;
  attachmentName?: string;
};

export async function postToTeams(input: PostToTeamsInput) {
  const res = await fetch('/api/notify/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Teams 게시 실패 (${res.status})`);
  return res.json() as Promise<{ ok: boolean; simulated: boolean }>;
}

// ── Helpers ─────────────────────────────────────────────────────────
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Strip unsafe filename chars and keep extension.
export function sanitizeFilename(raw: string, fallbackExt = 'jpg'): string {
  const noPath = raw.replace(/^.*[/\\]/, '');
  const dotIdx = noPath.lastIndexOf('.');
  const stem = (dotIdx > 0 ? noPath.slice(0, dotIdx) : noPath).replace(/[^\w\-가-힣]+/g, '_');
  const ext = (dotIdx > 0 ? noPath.slice(dotIdx + 1) : fallbackExt).toLowerCase();
  return `${stem || 'image'}.${ext}`;
}
