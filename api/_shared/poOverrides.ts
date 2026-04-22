// PO override type + runtime JSON loader.

import { readFileSync } from 'fs';
import { join } from 'path';

export type POOverride = {
  supplier: string;
  origin: string;
  receivedQty: number;
  poNumber: string;
  poCount: number;
};

function loadPoOverrides(): Record<string, POOverride> {
  const candidates = [
    join(process.cwd(), 'api', '_shared', 'po-overrides.json'),
    join(__dirname, 'po-overrides.json'),
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, 'utf-8')) as Record<string, POOverride>;
    } catch {
      // try next
    }
  }
  return {};
}

export const PO_OVERRIDES: Record<string, POOverride> = loadPoOverrides();
