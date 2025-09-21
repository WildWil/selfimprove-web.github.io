// ui.js — v0.4 minimal smoke-test

let CTRL = null;
export function attachController(c){ CTRL = c; }

// tiny DOM helper (handles .value correctly)
function h(tag, attrs = {}, ...children){
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "value") { if ("value" in el) el.value = v; else el.setAttribute("value", v); }
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) el.setAttribute(k, String(v));
  }
  for (const c of children.flat()) if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return el;
}

function card(title, ...body){
  const box = h("section", { class: "card" });
  box.append(h("h2", { text: title }));
  body.forEach(b => box.append(b));
  return box;
}

// --- PAGES (super simple) ---
export function renderToday(){ 
  const wrap = h("div", { class: "wrap" });
  wrap.append(card("Today", h("p", { text: "Hello from Today. If you can see this, routing works." })));
  return wrap;
}
export function renderHistory(){
  const wrap = h("div", { class: "wrap" });
  wrap.append(card("History", h("p", { text: "History placeholder." })));
  return wrap;
}
export function renderHabits(){
  const wrap = h("div", { class: "wrap" });
  const add = h("button", { class: "btn", onclick: ()=>alert("This is just the smoke test UI.") }, "Add Habit");
  wrap.append(card("Habits", h("p", { text: "Habits placeholder." }), add));
  return wrap;
}
export function renderJournal(){
  const wrap = h("div", { class: "wrap" });
  const ta = h("textarea", { class: "input", rows: 6, value: "Journal smoke test text." });
  wrap.append(card("Journal", ta));
  return wrap;
}
export function renderSettings(){
  const wrap = h("div", { class: "wrap" });
  wrap.append(card("Settings", h("p", { text: "Settings smoke test. Export/Import disabled in this minimal build." })));
  return wrap;
}
