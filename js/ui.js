// Tiny UI helper layer — no page logic here.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === "class" || k === "className") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, "");
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

// Simple mount helper
export function mount(root, node) {
  root.innerHTML = "";
  root.appendChild(node);
}

// Snack/toast (minimal)
let snackTimer;
export function toast(msg) {
  clearTimeout(snackTimer);
  let bar = document.getElementById("snackbar");
  if (!bar) {
    bar = h("div", { id: "snackbar", class: "snackbar" });
    document.body.appendChild(bar);
  }
  bar.textContent = msg;
  bar.classList.add("show");
  snackTimer = setTimeout(() => bar.classList.remove("show"), 2000);
}

// Apply theme to <html data-theme="...">
export function applyTheme(mode) {
  const html = document.documentElement;
  if (mode === "auto") {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", mode);
  }
}
