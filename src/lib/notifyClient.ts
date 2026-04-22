// Client-side notify stub — no Vercel Functions in static mode.
// Email/Teams posting simulated in browser console; integrate real service later.

export type NotifyStatus = {
  email: boolean;
  teams: boolean;
  mode: 'live' | 'simulation';
};

export async function fetchNotifyStatus(): Promise<NotifyStatus> {
  return { email: false, teams: false, mode: 'simulation' };
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

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const totalBytes = input.attachments.reduce((a, att) => a + att.blob.size, 0);
  // Browser-side simulation: log to console + return success shape
  // eslint-disable-next-line no-console
  console.log('[notify:email] SIMULATION', {
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    bodyLength: input.bodyText.length,
    attachments: input.attachments.map((a) => ({
      filename: a.filename,
      bytes: a.blob.size,
    })),
    totalBytes,
  });
  return {
    ok: true,
    simulated: true,
    messageId: `sim-${Date.now()}`,
    attachmentCount: input.attachments.length,
    totalBytes,
  };
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
  // eslint-disable-next-line no-console
  console.log('[notify:teams] SIMULATION', input);
  return { ok: true, simulated: true };
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

export function sanitizeFilename(raw: string, fallbackExt = 'jpg'): string {
  const noPath = raw.replace(/^.*[/\\]/, '');
  const dotIdx = noPath.lastIndexOf('.');
  const stem = (dotIdx > 0 ? noPath.slice(0, dotIdx) : noPath).replace(/[^\w\-가-힣]+/g, '_');
  const ext = (dotIdx > 0 ? noPath.slice(dotIdx + 1) : fallbackExt).toLowerCase();
  return `${stem || 'image'}.${ext}`;
}
