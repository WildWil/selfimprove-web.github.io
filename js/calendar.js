// /js/calendar.js
export const ymd = d => d.toISOString().slice(0,10);

export function firstOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfCalendar(date) {
  const f = firstOfMonth(date);
  const s = new Date(f);
  s.setDate(f.getDate() - f.getDay()); // back to Sunday
  return s;
}

export function endOfCalendar(date) {
  const f = firstOfMonth(date);
  const e = new Date(f.getFullYear(), f.getMonth()+1, 0); // last of month
  const pad = 6 - e.getDay();
  const ret = new Date(e);
  ret.setDate(e.getDate()+pad); // forward to Saturday
  return ret;
}
