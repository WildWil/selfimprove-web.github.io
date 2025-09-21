// data.js — v0.1 data loaders

export async function loadQuotes(){
  // expects a public file at /data/quotes.json
  // Format: [ "quote...", {"text":"quote..."} , ... ]
  try{
    const res = await fetch("./data/quotes.json", { cache: "no-store" });
    if (!res.ok) throw new Error("quotes fetch failed");
    const arr = await res.json();
    return Array.isArray(arr) ? arr : [];
  }catch{
    // fallback to any global QUOTES already on page, else empty
    return Array.isArray(window.QUOTES) ? window.QUOTES : [];
  }
}
