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
    startOfWeek: 1, // 0=Sun, 1=Mon (calendar.js currently forces Sunday visually)
  },
  habits: [],
  days: {},
  meta: {
    installDate: Date.now(),
    lastOpenDate: null,
    streaksByHabit: {},
    welcome: false,
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

function getRout
