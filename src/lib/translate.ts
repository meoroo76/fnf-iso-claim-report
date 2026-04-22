// Translation service — MyMemory public API (no key, CORS enabled)
// https://mymemory.translated.net/doc/spec.php
// Falls back to the original text on failure.

const CACHE_KEY = 'tl-cache-v1';
type Lang = 'en' | 'vi';
type CacheShape = Record<string, Record<Lang, string>>;

function loadCache(): CacheShape {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveCache(cache: CacheShape) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota — ignore */
  }
}

async function translateOne(text: string, target: Lang): Promise<string> {
  const src = text.trim();
  if (!src) return '';

  const cache = loadCache();
  if (cache[src]?.[target]) return cache[src][target];

  // MyMemory expects ko|en, ko|vi (ISO-ish)
  const langPair = `ko|${target}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(src)}&langpair=${encodeURIComponent(langPair)}&de=qa@fnf.co.kr`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const translated: string = json?.responseData?.translatedText ?? src;

    cache[src] = { ...(cache[src] ?? { en: '', vi: '' }), [target]: translated };
    saveCache(cache);
    return translated;
  } catch {
    return src;
  }
}

export type TranslationMap = Record<string, { en: string; vi: string }>;

// Translate a batch of unique KO texts to both en and vi in parallel.
export async function translateBatch(texts: string[]): Promise<TranslationMap> {
  const unique = Array.from(new Set(texts.map((t) => t.trim()).filter(Boolean)));
  const entries = await Promise.all(
    unique.map(async (t) => {
      const [en, vi] = await Promise.all([translateOne(t, 'en'), translateOne(t, 'vi')]);
      return [t, { en, vi }] as const;
    })
  );
  return Object.fromEntries(entries);
}
