// calendar.js — v0.1 helpers

export function ymd(d){
  return d.toISOString().slice(0,10);
}

function firstOfMonth(date){
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfCalendar(date){
  const f = firstOfMonth(date);
  const s = new Date(f);
  s.setDate(f.getDate() - f.getDay()); // back to Sun
  return s;
}

export function endOfCalendar(date){
  const f = firstOfMonth(date);
  const e = new Date(f.getFullYear(), f.getMonth()+1, 0); // last of month
  const pad = 6 - e.getDay();
  const ret = new Date(e);
  ret.setDate(e.getDate()+pad); // forward to Sat
  return ret;
}
