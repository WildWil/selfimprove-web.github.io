// ui.js
// v0.1 — add Settings UI for Export/Import

import { currentStreak, todayISO } from "./streaks.js";

let CTRL = null;
export function attachController(c) { CTRL = c; }

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") el.className = v;
    else if (k === "text") { el.textContent = v; }
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) el.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

function card(title, ...body) {
  return h("section", { class: "card" }, h("h2", { text: title }), ...body);
}

/* ------------------------------ TODAY ----------------------------------- */
export function renderToday(state) {
  const wrap = h("div", { class: "wrap" });
  const iso = todayISO();
  const day = state.days[iso] || { habits: {} };

  const list = h("div");
  if (state.habits.length === 0) {
    list.append(h("p", { class: "placeholder__text" }, "No habits yet. Add a few on the Habits page."));
  } else {
    for (const habit of state.habits) {
      const checked = !!day.habits[habit.id];
      const streak = currentStreak(habit.id, state.days);
      list.append(
        h("label", { class: "row", style: "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;" },
          h("input", {
            type: "checkbox",
            checked: checked ? "checked" : null,
            onchange: (e) => {
              CTRL?.toggleHabitForToday(habit.id, e.currentTarget.checked);
              const ev = new Event("hashchange"); window.dispatchEvent(ev);
            }
          }),
          h("span", { class: "mono", style: "flex:1;" }, habit.name),
          h("span", { class: "pill", style: "border:1px solid rgba(255,255,255,.15);padding:.2rem .5rem;border-radius:999px;font-size:.8rem;" }, `🔥 ${streak}`)
        )
      );
    }
  }

  wrap.append(card("Today", list));
  return wrap;
}

/* ------------------------------ HISTORY --------------------------------- */
export function renderHistory(state) {
  const wrap = h("div", { class: "wrap" });
  wrap.append(card("History", h("p", { class: "placeholder__text" }, "Weekly calendar and summaries coming soon.")));
  return wrap;
}

/* ------------------------------ HABITS ---------------------------------- */
export function renderHabits(state) {
  const wrap = h("div", { class: "wrap" });

  const form = h("form", { class: "row", style: "display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;" },
    h("input", { type: "text", name: "name", placeholder: "New habit (e.g., Read 10 pages)", required: "required", style: "flex:1;min-width:240px;padding:.5rem;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#0e1224;color:#e9edff;" }),
    h("button", { type: "submit" }, "Add")
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (new FormData(form).get("name") || "").toString().trim();
    if (!name) return;
    CTRL?.addHabit(name);
    const ev = new Event("hashchange"); window.dispatchEvent(ev);
    (form.querySelector('[name="name"]')).value = "";
  });

  const list = h("div");
  if (state.habits.length === 0) {
    list.append(h("p", { class: "placeholder__text" }, "No habits yet."));
  } else {
    for (const habit of state.habits) {
      list.append(
        h("div", { class: "row", style: "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;" },
          h("span", { class: "mono", style: "flex:1;" }, habit.name),
          h("button", {
            class: "secondary",
            type: "button",
            onclick: () => {
              if (confirm(`Delete habit "${habit.name}"?`)) {
                CTRL?.deleteHabit(habit.id);
                const ev = new Event("hashchange"); window.dispatchEvent(ev);
              }
            }
          }, "Delete")
        )
      );
    }
  }

  wrap.append(card("Add Habit", form), card("Your Habits", list));
  return wrap;
}

/* ------------------------------ JOURNAL --------------------------------- */
export function renderJournal() {
  const wrap = h("div", { class: "wrap" });
  wrap.append(card("Journal", h("p", { class: "placeholder__text" }, "Full journal entries and search will go here.")));
  return wrap;
}

/* ------------------------------ SETTINGS -------------------------------- */
export function renderSettings(state) {
  const wrap = h("div", { class: "wrap" });

  // Export
  const exportBtn = h("button", { type: "button", onclick: () => CTRL?.exportNow() }, "Export Save Key");

  // Import
  const fileInput = h("input", { type: "file", accept: "application/json", style: "display:none" });
  const importBtn = h("button", {
    type: "button",
    class: "secondary",
    onclick: () => fileInput.click()
  }, "Import (Replace All)");

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!confirm("Replace ALL current data with the imported save? This cannot be undone.")) {
      fileInput.value = "";
      return;
    }
    try {
      await CTRL?.importReplaceAll(file);
      alert("Import complete.");
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      fileInput.value = "";
    }
  });

  const actions = h("div", { class: "row", style: "display:flex;gap:.75rem;align-items:center;" }, exportBtn, importBtn, fileInput);

  const info = h("p", { class: "placeholder__text" },
    "Export creates a JSON file you can store anywhere. Import (Replace All) loads that file and overwrites current data."
  );

  wrap.append(card("Backup & Restore", actions, info));
  return wrap;
}
