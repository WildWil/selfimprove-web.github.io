// ui.js
// v0.1 — minimal view stubs so app.js router renders without errors
// TODO(next): replace placeholders with real interactive UIs.

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) el.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

function section(title, bodyText) {
  return h("section", { class: "card" },
    h("h1", {}, title),
    h("p", { class: "placeholder__text" }, bodyText)
  );
}

export function renderToday(state) {
  const wrap = h("div", { class: "wrap" });
  wrap.append(
    section("Today", "This is the Today view placeholder. We’ll show habits, mood sliders, focus, and quick journal here.")
  );
  return wrap;
}

export function renderHistory(state) {
  const wrap = h("div", { class: "wrap" });
  wrap.append(
    section("History", "Weekly calendar and summaries will appear here.")
  );
  return wrap;
}

export function renderHabits(state) {
  const wrap = h("div", { class: "wrap" });
  wrap.append(
    section("Habits", "Add/edit your habits in this view.")
  );
  return wrap;
}

export function renderJournal(state) {
  const wrap = h("div", { class: "wrap" });
  wrap.append(
    section("Journal", "Full journal entries and search will go here.")
  );
  return wrap;
}

export function renderSettings(state) {
  const wrap = h("div", { class: "wrap" });
  const version = document.getElementById("app-version")?.textContent || "";
  wrap.append(
    section("Settings", `Theme, start of week, and export/import will live here. App ${version}.`)
  );
  return wrap;
}
