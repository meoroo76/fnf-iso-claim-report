// PO override type + JSON data loader.

import PO_JSON from './po-overrides.json';

export type POOverride = {
  supplier: string;
  origin: string;
  receivedQty: number;
  poNumber: string;
  poCount: number;
};

export const PO_OVERRIDES = PO_JSON as unknown as Record<string, POOverride>;
