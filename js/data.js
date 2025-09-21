// /js/data.js
let _quotesCache = null;

export async function loadQuotes() {
  if (_quotesCache) return _quotesCache;

  try {
    const res = await fetch('data/quotes.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('loadQuotes() fetch failed');
    const json = await res.json();
    // normalize: allow strings or {text}
    _quotesCache = (json || []).map(q => typeof q === 'string' ? { text: q } : q);
  } catch (e) {
    // sensible fallback if file missing or fetch blocked in dev
    _quotesCache = [{ text: 'Small daily wins compound into greatness.' }];
  }

  return _quotesCache;
}
