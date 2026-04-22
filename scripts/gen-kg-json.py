#!/usr/bin/env python3
"""Generate api/_shared/kg-snapshot.json + po-overrides.json from raw sources.
Then slim TS wrappers that import JSON (lighter esbuild AST)."""
import json
import sys
from pathlib import Path
from collections import defaultdict

# ── KG products: pull from tool-results MCP responses ─────────────────
MCP_CACHE = Path('C:/Users/AD1305/.claude/projects/D--WORKSPACE-260422-defectReport/97cfa83c-7cb7-42fc-8953-1f561fc8ae43/tool-results')
FILES_KG = {
    'V26S': '1776832117153',
    'V25F': '1776832125428',
    'ST25F': '1776832127304',
    'ST26S': '1776832128465',
}
ALLOW_FIELDS = {
    'PRDT_CD','BRD_CD','BRD_NM','SYS_BRD_NM','PRDT_NM','ITEM_NM','ITEM_NM_ENG',
    'PARENT_PRDT_KIND_NM','PRDT_KIND_NM','SESN','SESN_SUB_NM','SEX_NM',
    'ADULT_KIDS_NM','TAG_PRICE','PRDT_IMG_URL','CAD_PDF_URL','STOR_DT_1ST',
}

all_products = []
for key, stamp in FILES_KG.items():
    path = next(MCP_CACHE.glob(f'*{stamp}.txt'))
    payload = json.loads(path.read_text(encoding='utf-8'))
    items = payload['data']['data']
    for r in items:
        out = {k: r.get(k) for k in ALLOW_FIELDS}
        if out.get('TAG_PRICE') is None:
            out['TAG_PRICE'] = 0
        all_products.append(out)
    print(f'  {key}: {len(items)}', file=sys.stderr)

Path('api/_shared/kg-snapshot.json').write_text(
    json.dumps(all_products, ensure_ascii=False, separators=(',', ':')),
    encoding='utf-8',
)
print(f'wrote {len(all_products)} products to kg-snapshot.json', file=sys.stderr)

# ── PO overrides: aggregate from scripts/po-data-*.json ───────────────
PO_FILES = [
    'scripts/po-data-raw.json',
    'scripts/po-data-v25f.json',
    'scripts/po-data-st25f.json',
    'scripts/po-data-st26s.json',
]
agg = defaultdict(lambda: {'supplier': None, 'origin': None, 'qty': 0, 'po': None, 'poCount': 0})
for f in PO_FILES:
    rows = json.loads(Path(f).read_text(encoding='utf-8'))['rows']
    for r in rows:
        k = r['PRDT_CD']
        a = agg[k]
        if a['supplier'] is None:
            a['supplier'] = r['MFAC_COMPY_NM']
            a['origin'] = r['ORIGIN_NM']
            a['po'] = r['PO_NO']
        a['qty'] += int(r['ORD_QTY'])
        a['poCount'] += 1

po_map = {
    k: {
        'supplier': v['supplier'],
        'origin': v['origin'],
        'receivedQty': v['qty'],
        'poNumber': v['po'],
        'poCount': v['poCount'],
    }
    for k, v in agg.items()
}
Path('api/_shared/po-overrides.json').write_text(
    json.dumps(po_map, ensure_ascii=False, separators=(',', ':')),
    encoding='utf-8',
)
print(f'wrote {len(po_map)} PO overrides to po-overrides.json', file=sys.stderr)
