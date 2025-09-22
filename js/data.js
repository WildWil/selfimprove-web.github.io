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
