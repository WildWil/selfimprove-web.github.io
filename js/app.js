// app.js
// v0.3 — bootstrap, storage, hash-router, backup/export, theme support

import {
  renderToday,
  renderHistory,
  renderHabits,
  renderJournal,
  renderSettings,
  attachController
} from "./ui.js";

import { todayISO } from "./streaks.js";
import { buildSnapshot, downloadSnapshot, encodeSaveKey } from "./export.js";
import { readSnapshotFile, readSnapshotFromKey, applySnapshotReplaceAll } from "./import.js";
import { runOnboardingIfNeeded } from "./onboarding.js";


/* ----------------------------- Constants -------------------------------- */
const APP_VERSION = "0.1.0";
const NS = "selftrack";
const KEYS = {
  user: `${NS}:user`,
  habits: `${NS}:habits`,
  days: `${NS}:days`,
  meta: `${NS}:meta`,
  version: `${NS}:version`,
};

const DEFAULTS = Object.freeze({
  user: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    theme: "auto", // auto | dark | light
    startOfWeek: 1, // 0=Sun, 1=Mon
  },
  habits: [],
  days: {},
  meta: {
    installDate: Date.now(),
    lastOpenDate: null,
    streaksByHabit: {},
  },
});

/* ------------------------------ Storage --------------------------------- */
const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  has(key) {
    return localStorage.getItem(key) !== null;
  },
};

function ensureInitialized() {
  if (!storage.has(KEYS.version)) storage.set(KEYS.version, APP_VERSION);
  if (!storage.has(KEYS.user)) storage.set(KEYS.user, DEFAULTS.user);
  if (!storage.has(KEYS.habits)) storage.set(KEYS.habits, DEFAULTS.habits);
  if (!storage.has(KEYS.days)) storage.set(KEYS.days, DEFAULTS.days);
  if (!storage.has(KEYS.meta)) storage.set(KEYS.meta, DEFAULTS.meta);
}

function loadState() {
  return {
    user: storage.get(KEYS.user, DEFAULTS.user),
    habits: storage.get(KEYS.habits, DEFAULTS.habits),
    days: storage.get(KEYS.days, DEFAULTS.days),
    meta: storage.get(KEYS.meta, DEFAULTS.meta),
    version: storage.get(KEYS.version, APP_VERSION),
  };
}

function saveState(partial) {
  if (partial.user) storage.set(KEYS.user, partial.user);
  if (partial.habits) storage.set(KEYS.habits, partial.habits);
  if (partial.days) storage.set(KEYS.days, partial.days);
  if (partial.meta) storage.set(KEYS.meta, partial.meta);
}

/* ------------------------------ Utilities ------------------------------- */
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

function setBusy(isBusy) {
  const root = qs("#app-root");
  if (!root) return;
  root.setAttribute("aria-busy", String(isBusy));
}

function setVersionBadge() {
  const el = qs("#app-version");
  if (el) el.textContent = `v${APP_VERSION}`;
}

function getRoute() {
  const hash = (location.hash || "#/today").toLowerCase();
  const route = hash.replace(/^#\//, "");
  const valid = new Set(["today", "history", "habits", "journal", "settings"]);
  return valid.has(route) ? route : "today";
}

function setActiveNav(route) {
  qsa('[data-route]').forEach(a => {
    if (a.getAttribute("data-route") === route) {
      a.setAttribute("aria-current", "page");
    } else {
      a.removeAttribute("aria-current");
    }
  });
}

/* ------------------------------ Theme ----------------------------------- */
const systemDarkQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

function resolveTheme(pref) {
  if (pref === "dark" || pref === "light") return pref;
  return systemDarkQuery?.matches ? "dark" : "light"; // auto
}

function applyTheme(pref) {
  const resolved = resolveTheme(pref || "auto");
  document.documentElement.setAttribute("data-theme", resolved);
}

function watchSystemThemeIfAuto(currentPrefGetter) {
  // Update only when user preference is "auto"
  if (!systemDarkQuery?.addEventListener) return;
  systemDarkQuery.addEventListener("change", () => {
    if (currentPrefGetter() === "auto") applyTheme("auto");
  });
}

/* ------------------------------- Actions -------------------------------- */
function getState() {
  return loadState();
}

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

function setJournalForDate(isoDate, text) {
  const state = loadState();
  const day = state.days[isoDate] || { habits: {}, ts: Date.now() };
  day.journal = text || "";
  day.ts = Date.now();
  const days = { ...state.days, [isoDate]: day };
  saveState({ days });
  return days[isoDate];
}

function getJournalForDate(isoDate) {
  const state = loadState();
  return state.days?.[isoDate]?.journal || "";
}

// Replace BOTH existing updateUser() definitions with this one:
function updateUser(patch = {}) {
  const state = loadState();
  const prevUser = state.user || {};
  const next = { ...prevUser, ...patch };

  saveState({ user: next });

  // Apply theme immediately if it was part of the update
  if (Object.prototype.hasOwnProperty.call(patch, "theme")) {
    if (typeof applyTheme === "function") {
      applyTheme(next.theme);
    } else {
      // Fallback in case applyTheme isn't defined/imported:
      const html = document.documentElement;
      if (next.theme === "auto") {
        html.removeAttribute("data-theme");
      } else {
        html.setAttribute("data-theme", next.theme);
      }
    }
  }

  return next;
}


function clearWelcome() {
  const state = loadState();
  const meta = { ...(state.meta || {}), welcome: false };
  saveState({ meta });
  return meta;
}

/* -------- Backup / Restore -------- */
function exportToFile() {
  const state = loadState();
  const snap = buildSnapshot(state);
  downloadSnapshot(snap);
}

function getSaveKey() {
  const state = loadState();
  const snap = buildSnapshot(state);
  return encodeSaveKey(snap);
}

async function importFromFile(file) {
  const state = loadState();
  const snap = await readSnapshotFile(file);
  applySnapshotReplaceAll(snap, {
    setUser: (u) => (state.user = u),
    setHabits: (h) => (state.habits = h),
    setDays: (d) => (state.days = d),
    setMeta: (m) => (state.meta = m),
    setVersion: (v) => (state.version = v),
  });
  saveState(state);
  applyTheme(state.user?.theme || "auto"); // ensure theme matches imported pref
  location.hash = "#/today";
}

function importFromKey(keyStr) {
  const state = loadState();
  const snap = readSnapshotFromKey(keyStr);
  applySnapshotReplaceAll(snap, {
    setUser: (u) => (state.user = u),
    setHabits: (h) => (state.habits = h),
    setDays: (d) => (state.days = d),
    setMeta: (m) => (state.meta = m),
    setVersion: (v) => (state.version = v),
  });
  saveState(state);
  applyTheme(state.user?.theme || "auto");
  location.hash = "#/today";
}

/* ------------------------------- Router --------------------------------- */
const routes = {
  today: renderToday,
  history: renderHistory,
  habits: renderHabits,
  journal: renderJournal,
  settings: renderSettings,
};

function render(route) {
  const state = loadState();
  const root = qs("#app-root");
  if (!root) return;
  setBusy(true);
  root.innerHTML = "";
  const fn = routes[route] || routes.today;
  const frag = fn(state);
  root.appendChild(frag);
  setBusy(false);
  setActiveNav(route);
}

/* ------------------------------- Migrate -------------------------------- */
function migrateIfNeeded(state) {
  return state;
}

/* -------------------------------- Init ---------------------------------- */
function init() {
  ensureInitialized();
  let state = loadState();
  state = migrateIfNeeded(state);

  // Run onboarding if needed (seeds starter habits once)
  runOnboardingIfNeeded(() => loadState(), partial => saveState(partial));
  
  // Apply theme on boot and watch system for Auto
  applyTheme(state.user?.theme || "auto");
  watchSystemThemeIfAuto(() => loadState().user?.theme || "auto");

  // expose controller to views
  attachController({
    getState,
    addHabit,
    deleteHabit,
    toggleHabitForToday,
    exportToFile,
    getSaveKey,
    importFromFile,
    importFromKey,
    setJournalForDate,
    getJournalForDate,
    updateUser,
    clearWelcome,
  });

  const meta = { ...state.meta, lastOpenDate: Date.now() };
  saveState({ meta });

  setVersionBadge();
  render(getRoute());

  window.addEventListener("hashchange", () => render(getRoute()));
  window.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    const map = { "1": "today", "2": "history", "3": "habits", "4": "journal", "5": "settings" };
    const next = map[e.key];
    if (next) {
      location.hash = `#/${next}`;
      e.preventDefault();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
 
