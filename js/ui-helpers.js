// js/ui-helpers.js
// Shared helpers + controller injection (from your old ui.js)

export let CTRL = null;
export function attachController(c){ CTRL = c; }

/* --------------------------- DOM helper --------------------------------- */
export function h(tag, attrs = {}, ...children){
  const el = document.createElement(tag);

  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;

      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "value") {
        if ("value" in el) el.value = v;
        else el.setAttribute("value", String(v));
      }
      else if (k.startsWith("on") && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      }
      else if (k in el) {
        el[k] = v;              // prefer DOM property (e.g., checked, disabled)
      }
      else {
        el.setAttribute(k, String(v));
      }
    }
  }

  for (const c of (children ?? []).flat()) {
    if (c == null) continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

/* ----------------------------- UI bits ---------------------------------- */
export function card(title, ...body){
  const s = h("section", { class: "card" });
  if (title) s.append(h("h2", { text: title }));
  for (const b of body) s.append(b);
  return s;
}

export function fieldRow(label, inputEl){
  const row = h("div", { class: "row", style: "display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;" },
    h("label", { class: "muted", style: "min-width:160px;" }, label),
    inputEl
  );
  return row;
}

export function chip(text, cls = ""){
  return h("span", { class: `chip ${cls}`.trim() }, text);
}

/* ------------------------ Popover / detail helpers ---------------------- */
export function showPopover(targetEl, contentEl){
  const pop = h("div", { class: "popover" }, contentEl);
  document.body.appendChild(pop);
  const r = targetEl.getBoundingClientRect();
  pop.style.left = `${r.left + r.width/2}px`;
  pop.style.top  = `${r.bottom + 8}px`;
  requestAnimationFrame(() => pop.classList.add("open"));
  return pop;
}

export function hidePopover(pop){
  if (!pop) return;
  pop.classList.remove("open");
  pop.addEventListener("transitionend", () => pop.remove(), { once: true });
}

export function openDetail(contentEl){
  const wrap = h("div", { class: "drawer" },
    h("div", { class: "drawer__scrim", onClick: closeDetail }),
    h("div", { class: "drawer__panel" }, contentEl)
  );
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add("open"));
  return wrap;
}

export function closeDetail(){
  const wrap = document.querySelector(".drawer");
  if (!wrap) return;
  wrap.classList.remove("open");
  wrap.addEventListener("transitionend", () => wrap.remove(), { once: true });
}

/* ------------------------------- Data ----------------------------------- */
export function loadDay(state, iso){
  return state.days[iso] || { habits: {}, journal: "" };
}
