// data.js
export async function loadQuotes() {
  try {
    const res = await fetch('./data/quotes.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load quotes');
    return await res.json();
  } catch (e) {
    console.warn('Quotes load error:', e);
    return []; // fail safe
  }
}

// Session cache to avoid refetch + flicker
let QUOTES_CACHE = null;

export async function loadQuotesCached() {
  if (QUOTES_CACHE) return QUOTES_CACHE;
  const list = await loadQuotes();
  QUOTES_CACHE = Array.isArray(list) ? list : [];
  return QUOTES_CACHE;
}
