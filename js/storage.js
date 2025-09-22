// Single source of truth for app state
const STORAGE_KEY = "selftrack_state_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("Storage save failed (quota or JSON).", err);
    return false;
  }
}

export function updateState(patch) {
  const current = loadState();
  const next = { ...current, ...patch };
  saveState(next);
  return next;
}

function defaultState() {
  const today = new Date();
  const iso = today.toISOString().slice(0,10);
  return {
    version: "0.1",
    theme: "auto",         // "auto" | "light" | "dark"
    startOfWeek: 0,        // 0 = Sunday, 1 = Monday
    habits: {},            // { id: { id, name, color } }
    days: {                // per-day data by ISO yyyy-mm-dd
      [iso]: { habits: {}, journal: "" }
    }
  };
}

// future-proofing: bump versions safely
function migrate(state) {
  if (!state.version) state.version = "0.1";
  // add future migrations here based on state.version
  return state;
}
