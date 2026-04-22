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

export type SendEmailInput = {
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  attachmentBlob?: Blob;
  attachmentName?: string;
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

export async function sendEmail(input: SendEmailInput) {
  const payload: Record<string, unknown> = {
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    bodyText: input.bodyText,
    attachmentName: input.attachmentName,
  };
  if (input.attachmentBlob) {
    payload.attachmentBase64 = await blobToBase64(input.attachmentBlob);
  }
  const res = await fetch('/api/notify/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`이메일 발송 실패 (${res.status})`);
  return res.json() as Promise<{ ok: boolean; simulated: boolean; messageId?: string }>;
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
