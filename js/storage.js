// storage.js
const KEY = "habit_state_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // first run
      return {
        user: { theme: "auto", showWelcome: true },
        habits: [],
        days: {}
      };
    }
    const parsed = JSON.parse(raw);
    return {
      user: { theme: "auto", showWelcome: true, ...(parsed.user || {}) },
      habits: parsed.habits || [],
      days: parsed.days || {}
    };
  } catch {
    return { user: { theme: "auto", showWelcome: true }, habits: [], days: {} };
  }
}

export function saveState(next) {
  const cur = loadState();
  const merged = {
    ...cur,
    ...next,
    user: { ...cur.user, ...(next.user || {}) }
  };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}
