#!/usr/bin/env python3
"""Convert api/_shared/kgSnapshot.ts inline RAW_KG array to JSON file.
Same for poOverrides.ts PO_OVERRIDES map.
The TS files then become thin wrappers that import JSON — reduces esbuild AST load."""
import json
import re
from pathlib import Path

# ─── kgSnapshot ──────────────────────────────────────────────────────
src = Path('api/_shared/kgSnapshot.ts').read_text(encoding='utf-8')

# Find RAW_KG array [ ... ]; spans
m = re.search(r"export const RAW_KG: RawKGProduct\[\] = (\[[\s\S]*?\n\]);", src)
if not m:
    raise SystemExit('RAW_KG not found')
raw_array_ts = m.group(1)

# Convert TS object literals to valid JSON:
# 1) unquoted keys → quoted
s = re.sub(r"(\w+):\s*", lambda x: '"' + x.group(1) + '": ', raw_array_ts)
# 2) single-quoted strings → double-quoted
s = re.sub(r"'([^']*)'", lambda x: json.dumps(x.group(1), ensure_ascii=False), s)
# 3) null stays null
# 4) trailing commas allowed in TS not JSON — remove
s = re.sub(r",(\s*[\]\}])", r"\1", s)

data = json.loads(s)
Path('api/_shared/kg-snapshot.json').write_text(
    json.dumps(data, ensure_ascii=False, separators=(',', ':')),
    encoding='utf-8',
)
print(f'wrote {len(data)} products to api/_shared/kg-snapshot.json')

# Replace RAW_KG definition in kgSnapshot.ts with JSON import
new_src = src.replace(
    f"export const RAW_KG: RawKGProduct[] = {raw_array_ts};",
    'import RAW_KG_JSON from "./kg-snapshot.json";\n'
    'export const RAW_KG: RawKGProduct[] = RAW_KG_JSON as RawKGProduct[];',
)
Path('api/_shared/kgSnapshot.ts').write_text(new_src, encoding='utf-8')
print('updated kgSnapshot.ts to import JSON')

# ─── poOverrides ─────────────────────────────────────────────────────
po_src = Path('api/_shared/poOverrides.ts').read_text(encoding='utf-8')
m2 = re.search(r"export const PO_OVERRIDES: Record<string, POOverride> = (\{[\s\S]*?\n\});", po_src)
if not m2:
    raise SystemExit('PO_OVERRIDES not found')
po_ts = m2.group(1)
# quote keys + strings
p = re.sub(r"(\w+):\s*(?=[^,}]*[,}])", lambda x: '"' + x.group(1) + '": ', po_ts)
p = re.sub(r"'([^']*)'", lambda x: json.dumps(x.group(1), ensure_ascii=False), p)
p = re.sub(r",(\s*[\]\}])", r"\1", p)
po_data = json.loads(p)
Path('api/_shared/po-overrides.json').write_text(
    json.dumps(po_data, ensure_ascii=False, separators=(',', ':')),
    encoding='utf-8',
)
print(f'wrote {len(po_data)} PO overrides to api/_shared/po-overrides.json')

new_po = po_src.replace(
    f"export const PO_OVERRIDES: Record<string, POOverride> = {po_ts};",
    'import PO_JSON from "./po-overrides.json";\n'
    'export const PO_OVERRIDES: Record<string, POOverride> = PO_JSON as Record<string, POOverride>;',
)
Path('api/_shared/poOverrides.ts').write_text(new_po, encoding='utf-8')
print('updated poOverrides.ts to import JSON')
