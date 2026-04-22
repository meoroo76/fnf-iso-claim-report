// Auto-save input state to localStorage, with IndexedDB-style photo spill-over.
// Photos are stored separately via a key-per-photo pattern so a single 5MB quota
// doesn't nuke everything — if photos exceed quota, we drop them gracefully.

import type { ReportState } from '../types';

const STATE_KEY = 'fnf-report-state-v1';
const META_KEY = 'fnf-report-meta-v1';
export const WARNING_THRESHOLD_BYTES = 4.5 * 1024 * 1024; // localStorage is typically 5-10MB

export type PersistMeta = {
  savedAt: string;
  bytes: number;
  photoCount: number;
  droppedPhotos: boolean;
};

function safeStringify(value: unknown): string {
  return JSON.stringify(value);
}

/** Save a serializable snapshot. Photos are included if total payload < quota. */
export function saveState(state: ReportState): PersistMeta | null {
  try {
    const withPhotos = safeStringify(state);
    if (withPhotos.length < WARNING_THRESHOLD_BYTES) {
      localStorage.setItem(STATE_KEY, withPhotos);
      const meta: PersistMeta = {
        savedAt: new Date().toISOString(),
        bytes: withPhotos.length,
        photoCount: state.defectPhotos.length + state.careLabelPhotos.length,
        droppedPhotos: false,
      };
      localStorage.setItem(META_KEY, JSON.stringify(meta));
      return meta;
    }
    // Spill: save without photos to stay within quota
    const slim: ReportState = {
      ...state,
      defectPhotos: [],
      careLabelPhotos: [],
    };
    const slimBody = safeStringify(slim);
    localStorage.setItem(STATE_KEY, slimBody);
    const meta: PersistMeta = {
      savedAt: new Date().toISOString(),
      bytes: slimBody.length,
      photoCount: state.defectPhotos.length + state.careLabelPhotos.length,
      droppedPhotos: true,
    };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    return meta;
  } catch {
    return null;
  }
}

export function loadState(): ReportState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReportState;
  } catch {
    return null;
  }
}

export function loadMeta(): PersistMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as PersistMeta) : null;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(META_KEY);
  } catch {
    /* noop */
  }
}
