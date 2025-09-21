// streaks.js
// v0.1 — simple consecutive-day streaks (no strict/grace yet)

/** Return YYYY-MM-DD in local time. */
export function todayISO() {
  // en-CA gives YYYY-MM-DD in local time reliably
  return new Date().toLocaleDateString("en-CA");
}

/** Get ISO date offset by n days from a given ISO (local). n can be negative. */
export function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dt.toLocaleDateString("en-CA");
}

/**
 * Compute current streak counting backwards from today (inclusive)
 * based on days[iso].habits[habitId] === true.
 */
export function currentStreak(habitId, daysObj) {
  let count = 0;
  let cursor = todayISO();
  while (true) {
    const day = daysObj[cursor];
    const done = !!(day && day.habits && day.habits[habitId]);
    if (!done) break;
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}
