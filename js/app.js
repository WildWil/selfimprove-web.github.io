// app.js
// v0.1 — add export/import (Replace-All)

import {
  renderToday,
  renderHistory,
  renderHabits,
  renderJournal,
  renderSettings,
  attachController
} from "./ui.js";

import { todayISO } from "./streaks.js";
import { buildSnapshot, downloadSnapshot } from "./export.js";
import { readSnapshotFile, applySnapshotReplaceAll } from "./import.js";

/* ...constants, DEFAULTS, storage, ensureInitialized, loadState, saveState stay unchanged... */

function setVersion(v) { localStorage.setItem(KEYS.version, JSON.stringify(v)); }

/* ------------------------------- Actions -------------------------------- */
// existing actions...
function getState() { return loadState(); }

function addHabit(name) {
  const state = loadState();
  const id = `h_${Math.random().toString(36).slice(2, 8)}`;
  const habit = { id, name, icon: "🔥", targetDays: [0,1,2,3,4,5,6], strict: false, createdAt: Date.now() };
  const habits = [...state.habits, habit];
  saveState({ habits });
  return habit;
}

function deleteHabit(id) {
  const state = loadState();
  const habits = state.habits.filter(h => h.id !== id);
  const days = { ...state.days };
  for (const d in days) {
    if (days[d]?.habits && id in days[d].habits) {
      const copy = { ...days[d].habits };
      delete copy[id];
      days[d] = { ...days[d], habits: copy };
    }
  }
  saveState({ habits, days });
}

function toggleHabitForToday(habitId, checked) {
  const state = loadState();
  const iso = todayISO();
  const day = state.days[iso] || { habits: {}, ts: Date.now() };
  day.habits = { ...(day.habits || {}), [habitId]: !!checked };
  day.ts = Date.now();
  const days = { ...state.days, [iso]: day };
  saveState({ days });
  return days[iso];
}

/* -------- Export / Import -------- */
function exportNow() {
  const state = loadState();
  const snapshot = buildSnapshot(state);
  downloadSnapshot(snapshot);
}

async function importReplaceAll(file) {
  const snapshot = await readSnapshotFile(file);
  applySnapshotReplaceAll(snapshot, {
    setUser: (v) => storage.set(KEYS.user, v),
    setHabits: (v) => storage.set(KEYS.habits, v),
    setDays: (v) => storage.set(KEYS.days, v),
    setMeta: (v) => storage.set(KEYS.meta, v),
    setVersion: (v) => setVersion(v),
  });
  // re-render current route after import
  render(getRoute());
  return true;
}

/* ------------------------------- Router --------------------------------- */
const routes = { today: renderToday, history: renderHistory, habits: renderHabits, journal: renderJournal, settings: renderSettings };

function render(route) {
  const state = loadState();
  const root = document.querySelector("#app-root");
  if (!root) return;
  root.setAttribute("aria-busy", "true");
  root.innerHTML = "";
  const fn = routes[route] || routes.today;
  const frag = fn(state);
  root.appendChild(frag);
  root.setAttribute("aria-busy", "false");
  document.querySelectorAll('[data-route]').forEach(a => {
    a.getAttribute("data-route") === route ? a.setAttribute("aria-current","page") : a.removeAttribute("aria-current");
  });
}

/* ------------------------------- Init ----------------------------------- */
function init() {
  ensureInitialized();
  let state = loadState();

  attachController({
    getState,
    addHabit,
    deleteHabit,
    toggleHabitForToday,
    exportNow,
    importReplaceAll,
  });

  const meta = { ...state.meta, lastOpenDate: Date.now() };
  saveState({ meta });

  const el = document.querySelector("#app-version"); if (el) el.textContent = `v${storage.get(KEYS.version, APP_VERSION)}`;

  render(getRoute());
  window.addEventListener("hashchange", () => render(getRoute()));
  window.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    const map = { "1":"today","2":"history","3":"habits","4":"journal","5":"settings" };
    const next = map[e.key]; if (next) { location.hash = `#/${next}`; e.preventDefault(); }
  });
}

document.addEventListener("DOMContentLoaded", init);
