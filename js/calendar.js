// Calendar helpers with Sunday start support
import { loadState } from "./storage.js";

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function monthLabel(d) {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
}

export function isoDate(d) {
  return new Date(d).toISOString().slice(0,10);
}

// ui.js expects `ymd`, so export an alias of isoDate
export { isoDate as ymd };

export function getWeekStartIndex() {
  // Lock to Sunday for now (your preference)
  const state = loadState();
  const pref = (typeof state.startOfWeek === "number") ? state.startOfWeek : 0;
  return 0; // force Sunday
}

export function startOfCalendar(monthDate) {
  const star
