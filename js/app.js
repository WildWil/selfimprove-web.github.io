// app.js
// v0.1 — bootstrap, storage, hash-router (MVP)
// TODO(next): wire real views from ui.js to actual data and actions.

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
  habits: [], // [{id, name, icon, targetDays:[0-6], strict, createdAt}]
  days: {},   // {"YYYY-MM-DD": { habits:{[habitId]:true|false}, mood:{mood:1-5,energy:1-5}, focus:"", notes:"", ts:number }}
  meta: {
    installDate: Date.now(),
    lastOpenDate: null,
    streaksByHabit: {}, // {habitId:{current,best,lastDoneDate}}
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

/* ------------------------------- Router --------------------------------- */
import {
  renderToday,
  renderHistory,
  renderHabits,
  renderJournal,
  renderSettings,
} from "./ui.js";

const routes = {
  today: renderToday,
  history: renderHistory,
  habits: renderHabits,
  journal: renderJournal,
  settings: renderSettings,
};

function render(route, state) {
  const root = qs("#app-root");
  if (!root) return;
  setBusy(true);
  root.innerHTML = ""; // clear
  const fn = routes[route] || routes.today;
  const frag = fn(state); // each view returns a DOM node or DocumentFragment
  root.appendChild(frag);
  setBusy(false);
  setActiveNav(route);
}

/* ------------------------------- Migrate -------------------------------- */
function migrateIfNeeded(state) {
  // Placeholder for future schema migrations
  // Example:
  // if (state.version === "0.1.0") { ...apply changes...; storage.set(KEYS.version, "0.2.0"); }
  return state;
}

/* -------------------------------- Init ---------------------------------- */
function init() {
  ensureInitialized();
  let state = loadState();
  state = migrateIfNeeded(state);

  // update meta.lastOpenDate
  const meta = { ...state.meta, lastOpenDate: Date.now() };
  saveState({ meta });
  state.meta = meta;

  setVersionBadge();

  // initial render
  render(getRoute(), state);

  // route changes
  window.addEventListener("hashchange", () => {
    const fresh = loadState(); // always load latest
    render(getRoute(), fresh);
  });

  // basic keyboard nav: Alt+1..5 to switch tabs quickly
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
