// ui.js
// v0.1 — minimal usable UI for Today + Habits with persistence

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
  return h("section", { class: "card" },
    h("h2", { text: title }),
    ...body
  );
}

/* ------------------------------ TODAY ----------------------------------- */
export function renderToday(state) {
  const wrap = h("div", { class: "wrap" });

  const iso = todayISO();
  const day = state.days[iso] || { habits: {} };

  const list = h("div");
  if (state.habits.length === 0) {
    list.append(
      h("p", { class: "placeholder__text" }, "No habits yet. Add a few on the Habits page.")
    );
  } else {
    for (const habit of state.habits) {
      const checked = !!day.habits[habit.id];
      const streak = currentStreak(habit.id, state.days);
      const row = h("label", { class: "row", style: "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;" },
        h("input", {
          type: "checkbox",
          checked: checked ? "checked" : null,
          onchange: (e) => {
            CTRL?.toggleHabitForToday(habit.id, e.currentTarget.checked);
            // re-render Today quickly to update streak chips
            location.hash = "#/today"; // stays on same route, triggers render via hashchange if changed; fallback manual:
            const ev = new Event("hashchange"); window.dispatchEvent(ev);
          }
        }),
        h("span", { class: "mono", style: "flex:1;" }, habit.name),
        h("span", { class: "pill", style: "border:1px solid rgba(255,255,255,.15);padding:.2rem .5rem;border-radius:999px;font-size:.8rem;" }, `🔥 ${streak}`)
      );
      list.append(row);
    }
  }

  const section = card("Today", list);
  wrap.append(section);
  return wrap;
}

/* ------------------------------ HISTORY --------------------------------- */
export function renderHistory(state) {
  const wrap = h("div", { class: "wrap" });
  wrap.append(
    card("History", h("p", { class: "placeholder__text" }, "Weekly calendar and summaries coming soon."))
  );
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
    location.hash = "#/habits";
    const ev = new Event("hashchange"); window.dispatchEvent(ev);
    (form.querySelector('[name="name"]')).value = "";
  });

  const list = h("div");
  if (state.habits.length === 0) {
    list.append(h("p", { class: "placeholder__text" }, "No habits yet."));
  } else {
    for (const habit of state.habits) {
      const row = h("div", { class: "row", style: "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;" },
        h("span", { class: "mono", style: "flex:1;" }, habit.name),
        h("button", {
          class: "secondary",
          type: "button",
          onclick: () => {
            if (confirm(`Delete habit "${habit.name}"? This won't remove past checkmarks.`)) {
              CTRL?.deleteHabit(habit.id);
              location.hash = "#/habits";
              const ev = new Event("hashchange"); window.dispatchEvent(ev);
            }
          }
        }, "Delete")
      );
      list.append(row);
    }
  }

  wrap.append(card("Add Habit", form), card("Your Habits", list));
  return wrap;
}

/* ------------------------------ JOURNAL --------------------------------- */
export function renderJournal(state) {
  const wrap = h("div", { class: "wrap" });
  wrap.append(
    card("Journal", h("p", { class: "placeholder__text" }, "Full journal entries and search will go here."))
  );
  return wrap;
}

/* ------------------------------ SETTINGS -------------------------------- */
// inside ui.js (top of file with other imports)
import { todayISO } from "./streaks.js"; // you likely already have this

let CTRL = null;
export function attachController(c){ CTRL = c; }

// small helper to draw rows
function fieldRow(label, controlEl) {
  const row = h("div", { class: "field-row" },
    h("label", { class: "field-label" }, label),
    h("div", { class: "field-ctrl" }, controlEl)
  );
  return row;
}

export function renderSettings(state) {
  const wrap = h("div", { class: "wrap" });
  const version = document.getElementById("app-version")?.textContent || "";

  // Export
  const exportBtn = h("button", { class: "btn", onClick: () => CTRL.exportToFile() }, "Export to JSON");

  // Save Key
  const keyOut = h("textarea", { class: "input code", rows: 3, placeholder: "Your Save Key will appear here", readonly: true });
  const genKeyBtn = h("button", {
    class: "btn",
    onClick: () => { keyOut.value = CTRL.getSaveKey(); keyOut.focus(); keyOut.select(); }
  }, "Generate Save Key");

  // Import (file)
  const fileIn = h("input", { type: "file", accept: ".json,application/json" });
  const importFileBtn = h("button", {
    class: "btn warn",
    onClick: async () => {
      if (!fileIn.files?.[0]) return alert("Choose a file first.");
      if (!confirm("Replace ALL current data with this file?")) return;
      try {
        await CTRL.importFromFile(fileIn.files[0]);
        alert("Import complete.");
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    }
  }, "Import from File");

  // Import (key)
  const keyIn = h("textarea", { class: "input code", rows: 3, placeholder: "Paste Save Key here…" });
  const importKeyBtn = h("button", {
    class: "btn warn",
    onClick: () => {
      const v = keyIn.value.trim();
      if (!v) return alert("Paste a key first.");
      if (!confirm("Replace ALL current data with this key?")) return;
      try {
        CTRL.importFromKey(v);
        alert("Import complete.");
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    }
  }, "Import from Key");

  const cardExport = card("Backup & Restore",
    h("p", { class: "muted" }, "Export your data to a file or copy a compact Save Key. Import will REPLACE all current data."),
    fieldRow("Export", exportBtn),
    fieldRow("Save Key", h("div", {}, genKeyBtn, h("div", { style: "height: 0.5rem" }), keyOut)),
    fieldRow("Import (File)", h("div", {}, fileIn, h("div", { style: "height: 0.5rem" }), importFileBtn)),
    fieldRow("Import (Key)", h("div", {}, keyIn, h("div", { style: "height: 0.5rem" }), importKeyBtn)),
  );

  const cardInfo = card("App",
    h("p", { class: "muted" }, `Version ${version}. Theme and PWA coming soon.`)
  );

  wrap.append(cardExport, cardInfo);
  return wrap;
}
