// Locals-only analytics so other files stay clean
import { loadState } from "./storage.js";

export function totalCheckins() {
  const { days } = loadState();
  let total = 0;
  for (const iso in days) {
    total += Object.values(days[iso].habits || {}).filter(Boolean).length;
  }
  return total;
}

export function longestStreak(habitId) {
  // simple example: count consecutive true days ending today
  const { days } = loadState();
  const dates = Object.keys(days).sort(); // ISO sorts chronologically
  let best = 0, run = 0;
  for (const iso of dates) {
    const hit = days[iso]?.habits?.[habitId] ? 1 : 0;
    if (hit) { run += 1; best = Math.max(best, run); }
    else run = 0;
  }
  return best;
}

export function weekSummary(weekStartIso) {
  // returns per-habit counts for the 7-day window starting at weekStartIso
  const { days, habits } = loadState();
  const res = {};
  const start = new Date(weekStartIso);
  for (let i=0;i<7;i++) {
    const iso = new Date(start.getFullYear(), start.getMonth(), start.getDate()+i).toISOString().slice(0,10);
    const d = days[iso]?.habits || {};
    for (const id of Object.keys(habits)) {
      res[id] = (res[id] || 0) + (d[id] ? 1 : 0);
    }
  }
  return res;
}
