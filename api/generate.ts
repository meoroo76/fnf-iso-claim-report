// Vercel Function — POST /api/generate
//
// Generates two artifacts in a single Claude call (cost-optimized):
//   1. translations: KO + EN + chosen third language for every defect detail string
//   2. productionGuidance: contextual cautions for the apparel factory
//      and external visual-inspection agency, scoped to this report.
//
// Third language is dynamic per request (vi default, or zh / id / my).
// Routes through Vercel AI Gateway when AI_GATEWAY_API_KEY is set in env.
// Falls back to direct Anthropic call if ANTHROPIC_API_KEY is set instead.

import { generateObject } from 'ai';
import { z } from 'zod';
import glossary from '../data/garmentGlossary.json';
import { DEFECT_CATALOG } from '../src/data/defectCatalog';
// PRIMARY (highest-priority) F&F-curated 5-language glossary.
// Source of truth for ko ↔ en/vi/zh/id/my professional garment terminology.
// @ts-ignore — JS file with default export
import FASHION_GLOSSARY from '../src/input/fashion_glossary.js';

type ThirdLang = 'vi' | 'zh' | 'id' | 'my';

const THIRD_LANG_META: Record<
  ThirdLang,
  { name: string; native: string; instruction: string }
> = {
  vi: {
    name: 'Vietnamese',
    native: 'Tiếng Việt',
    instruction:
      'Tiếng Việt (북부 표준, Hà Nội 기준), 의류 산업 전문 용어 사용. 6~10 câu (sentences).',
  },
  zh: {
    name: 'Chinese (Simplified)',
    native: '中文 (简体)',
    instruction:
      'Simplified Chinese (中文简体), apparel industry professional terminology. 6-10 sentences.',
  },
  id: {
    name: 'Indonesian',
    native: 'Bahasa Indonesia',
    instruction:
      'Bahasa Indonesia (formal, industri pakaian), professional garment terminology. 6-10 kalimat.',
  },
  my: {
    name: 'Burmese',
    native: 'မြန်မာဘာသာ',
    instruction:
      'Burmese (မြန်မာဘာသာ), apparel industry professional terminology. 6-10 sentences.',
  },
};

type GlossaryTerm = { ko: string; en: string; vi: string };
type GlossaryFile = {
  version: string;
  lastUpdated: string;
  terms: GlossaryTerm[];
  rules: string[];
};

type FashionEntry = {
  ko: string;
  en: string;
  vi: string;
  zh?: string;
  id?: string;
  my?: string;
};

type FashionGlossary = Record<string, FashionEntry[]>;

const GLOSSARY = glossary as unknown as GlossaryFile;
const FASHION = FASHION_GLOSSARY as unknown as FashionGlossary;

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

const RequestSchema = z.object({
  defects: z
    .array(
      z.object({
        category: z.string(),
        categoryLabelKo: z.string(),
        qty: z.number().int().nonnegative(),
        detailKo: z.string().min(1),
      })
    )
    .min(1)
    .max(50),
  product: z.object({
    brand: z.string(),
    styleCode: z.string(),
    productName: z.string().optional().default(''),
    category: z.string(),
    season: z.string(),
    color: z.string().optional().default(''),
    receivedQty: z.number().int().nonnegative(),
    supplier: z.string().optional().default(''),
  }),
  thirdLanguage: z.enum(['vi', 'zh', 'id', 'my']).optional().default('vi'),
});

type RequestPayload = z.infer<typeof RequestSchema>;

// Schema kept generic so the third-language slot is always called `third`
// regardless of which actual language the user picked. The client maps
// `third` back to the chosen language code when storing.
const ResponseSchema = z.object({
  translations: z
    .array(
      z.object({
        ko: z.string(),
        en: z.string(),
        third: z
          .string()
          .describe(
            'Translation in the third language (whichever language was requested in input.thirdLanguage)'
          ),
      })
    )
    .describe(
      'For each defect detail (in the same order as input.defects), provide KO/EN/third translations of the detailKo text. Keep technical garment terminology accurate.'
    ),
  guidance: z
    .object({
      ko: z
        .string()
        .describe(
          '한국어 본문, 6~10문장. 공장 QC팀과 외관검사 대행사가 다음 생산 라운드에서 실제로 사용할 수 있는 구체적 지침. 존댓말 사용.'
        ),
      en: z
        .string()
        .describe(
          'English body, 6-10 sentences. Concrete actions the factory QC team and external visual-inspection agency must take next production round.'
        ),
      third: z
        .string()
        .describe(
          'Translation of the same guidance in the requested third language (whichever language input.thirdLanguage specified). Maintain professional garment-industry register.'
        ),
    })
    .describe(
      'Production cautions specific to THIS claim — referencing the actual defect categories, brand, season, and supplier. Not generic advice.'
    ),
});

type GenerationResult = z.infer<typeof ResponseSchema>;

function buildFashionGlossarySection(thirdLang: ThirdLang): string {
  // F&F-curated professional glossary at src/input/fashion_glossary.js.
  // Treated as HIGHEST priority — overrides defectCatalog phrasing if conflict.
  const categories = Object.keys(FASHION || {});
  if (categories.length === 0) return '';

  const categoryLabels: Record<string, string> = {
    garment_general: 'GARMENT GENERAL · 의류 일반',
    sewing_machinery: 'SEWING MACHINERY · 봉제 기계',
    raw_materials: 'RAW MATERIALS · 원자재',
    auxiliary_materials: 'AUXILIARY MATERIALS · 부자재',
    trade_management: 'TRADE & MANAGEMENT · 거래 / 관리',
  };

  const meta = THIRD_LANG_META[thirdLang];
  const langKey = thirdLang;

  const blocks = categories.map((cat) => {
    const entries = FASHION[cat] ?? [];
    const lines = entries
      .map((e) => {
        const thirdValue = e[langKey];
        const thirdPart = thirdValue
          ? `  /  ${meta.native}: "${thirdValue}"`
          : `  /  ${meta.native}: (not in glossary — translate using F&F catalog tone)`;
        return `  • ${e.ko}  →  EN: "${e.en}"${thirdPart}`;
      })
      .join('\n');
    const label = categoryLabels[cat] ?? cat.toUpperCase();
    return `[${label}]\n${lines}`;
  });

  return `
═══════════════════════════════════════════════════════════════
F&F PRIMARY GARMENT GLOSSARY · HIGHEST PRIORITY
Source: src/input/fashion_glossary.js (curated 5-language professional terminology)
Third language for THIS request: ${meta.name} (${meta.native})
═══════════════════════════════════════════════════════════════
🔒 ENFORCEMENT — When the source KO text contains ANY term below,
   you MUST use the EXACT mapped EN / ${meta.native} translation. No paraphrasing.
   No localization variants. Match character-for-character.
   This rule overrides every other reference in this prompt.

${blocks.join('\n\n')}
`;
}

function buildGlossarySection(thirdLang: ThirdLang): string {
  if (!GLOSSARY?.terms?.length && !GLOSSARY?.rules?.length) return '';
  const meta = THIRD_LANG_META[thirdLang];
  // garmentGlossary.json holds VI explicitly. When thirdLang ≠ vi, the VI line
  // is provided as cross-reference but the model is instructed to translate
  // the same KO term to the chosen language.
  const termLines = (GLOSSARY.terms ?? [])
    .map((t) => {
      const viNote =
        thirdLang === 'vi' ? '' : `  (cross-ref VI: "${t.vi}" — translate to ${meta.native})`;
      return `  • ${t.ko}  →  EN: "${t.en}"${viNote}`;
    })
    .join('\n');
  const ruleLines = (GLOSSARY.rules ?? []).map((r) => `  • ${r}`).join('\n');
  return `
═══════════════════════════════════════════════════════════════
F&F APPROVED GARMENT TERMINOLOGY (glossary v${GLOSSARY.version})
You MUST use these EXACT EN translations whenever the source contains the KO term.
Do not paraphrase, do not localize differently. Match the canonical forms below.
═══════════════════════════════════════════════════════════════

TERMS:
${termLines || '  (empty — no fixed terms yet)'}

STRICT TRANSLATION RULES:
${ruleLines || '  (empty)'}
`;
}

function buildCatalogReference(thirdLang: ThirdLang): string {
  // The DEFECT_CATALOG holds KO/EN/VI label + insight per category. When
  // thirdLang ≠ vi, the VI version is included as a stylistic reference for
  // tone/depth, but the model must produce the actual third-language output.
  const meta = THIRD_LANG_META[thirdLang];
  const blocks = (Object.keys(DEFECT_CATALOG) as Array<keyof typeof DEFECT_CATALOG>).map((key) => {
    const c = DEFECT_CATALOG[key];
    const viNote =
      thirdLang === 'vi'
        ? ''
        : `\n  (the VI lines above are reference for tone/depth — output in ${meta.name} for the third language slot)`;
    return `[${key}]
  KO label: ${c.label.ko}
  EN label: ${c.label.en}
  VI label: ${c.label.vi}
  KO insight: ${c.insight.ko}
  EN insight: ${c.insight.en}
  VI insight: ${c.insight.vi}${viNote}`;
  });
  return `
═══════════════════════════════════════════════════════════════
F&F OFFICIAL DEFECT TAXONOMY — APPROVED PHRASING REFERENCE
Match this terminology, sentence rhythm, and technical depth when generating
new translations and production guidance.
═══════════════════════════════════════════════════════════════

${blocks.join('\n\n')}
`;
}

function buildPrompt(payload: RequestPayload): string {
  const { product, defects, thirdLanguage } = payload;
  const meta = THIRD_LANG_META[thirdLanguage];
  const defectLines = defects
    .map(
      (d, i) => `  ${i + 1}. [${d.categoryLabelKo}] qty=${d.qty} :: ${d.detailKo}`
    )
    .join('\n');

  return `You are a senior apparel-quality engineer at F&F Corporation (Korean fashion conglomerate, brands include DUVETICA, Discovery Expedition, MLB).
You are preparing a TRILINGUAL claim report for ONE specific factory shipment.

TARGET LANGUAGES FOR THIS REPORT:
  · KO  (Korean — source / authoritative)
  · EN  (English — international standard)
  · ${meta.name} (${meta.native}) — third language for this report

PRODUCT:
- Brand: ${product.brand}
- Style: ${product.styleCode}${product.productName ? ` — ${product.productName}` : ''}
- Category / Season: ${product.category} · ${product.season}
- Color: ${product.color || 'N/A'}
- Received qty: ${product.receivedQty} pcs
- Supplier: ${product.supplier || 'N/A'}

DEFECTS DETECTED (in order — translations array MUST match this order 1:1):
${defectLines}
${buildCatalogReference(thirdLanguage)}
${buildGlossarySection(thirdLanguage)}
${buildFashionGlossarySection(thirdLanguage)}
TASKS:
1. translations[]: For each defect line, populate three fields:
   - ko: clean rewrite of detailKo (keep meaning, fix grammar/typos only)
   - en: English translation using approved garment terminology
   - third: translation in ${meta.name} (${meta.native}) — ${meta.instruction}
   Match length to the source. Use the F&F glossaries above as authoritative.

2. guidance: Production-floor cautions targeted at:
   (a) the cutting/sewing factory QC team, and
   (b) the third-party visual-inspection agency hired before shipment.
   Refer to the ACTUAL defect categories above (don't list generic principles). Mention category-specific tolerances (e.g., 4-Point System for fabric, 1cm seam allowance for body, swatch+light-source comparison for color), and what to flag/reject before the next PO ships. End with one sentence on root-cause direction (machine, operator training, material lot, etc.) when the defect pattern suggests it.
   Populate three fields:
   - ko: 6~10문장, 존댓말
   - en: 6-10 sentences, professional register
   - third: ${meta.instruction}

Output strictly in the requested schema. No markdown, no preamble.`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let payload: RequestPayload;
  try {
    const body = await req.json();
    payload = RequestSchema.parse(body);
  } catch (err) {
    return Response.json(
      { error: 'Invalid request body', detail: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  const hasGateway = Boolean(process.env.AI_GATEWAY_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasGateway && !hasAnthropic) {
    return Response.json(
      {
        error:
          'No AI credentials configured. Set AI_GATEWAY_API_KEY (recommended) or ANTHROPIC_API_KEY in Vercel env.',
      },
      { status: 500 }
    );
  }

  try {
    const { object } = await generateObject({
      // Plain "provider/model" string routes through Vercel AI Gateway when
      // AI_GATEWAY_API_KEY is set; falls through to provider-direct when not.
      model: 'anthropic/claude-haiku-4-5',
      schema: ResponseSchema,
      prompt: buildPrompt(payload),
      temperature: 0.3,
    });

    const result: GenerationResult = object;

    if (result.translations.length !== payload.defects.length) {
      return Response.json(
        {
          error: 'Translation count mismatch',
          expected: payload.defects.length,
          got: result.translations.length,
        },
        { status: 502 }
      );
    }

    return Response.json(
      {
        thirdLanguage: payload.thirdLanguage,
        translations: result.translations,
        guidance: result.guidance,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown AI error';
    return Response.json({ error: 'AI generation failed', detail: msg }, { status: 502 });
  }
}
