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

export function getWeekStartIndex() {
  // You want Sunday — lock to 0
  const state = loadState();
  const pref = (typeof state.startOfWeek === "number") ? state.startOfWeek : 0;
  return 0; // force Sunday for now
}

export function startOfCalendar(monthDate) {
  const start = startOfMonth(monthDate);
  const dow = start.getDay(); // 0=Sun..6=Sat
  const weekStart = getWeekStartIndex(); // 0 (Sunday)
  const diff = (dow - weekStart + 7) % 7;
  return addDays(start, -diff);
}

export function endOfCalendar(monthDate) {
  const end = endOfMonth(monthDate);
  const weekStart = getWeekStartIndex(); // 0
  const weekEnd = (weekStart + 6) % 7;   // 6 = Saturday
  const dow = end.getDay();
  const diff = (weekEnd - dow + 7) % 7;
  return addDays(end, diff);
}

export function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0,0,0,0);
  return x;
}

export function endOfMonth(d) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1, 0); // last day of month
  x.setHours(23,59,59,999);
  return x;
}
