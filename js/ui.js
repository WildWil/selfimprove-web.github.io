// ui.js — v0.5 full views (Today, History, Habits, Journal, Settings)

import { currentStreak, todayISO } from "./streaks.js";

let CTRL = null;
export function attachController(c){ CTRL = c; }

// DOM helper with proper .value handling
function h(tag, attrs = {}, ...children){
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "value") { if ("value" in el) el.value = v; else el.setAttribute("value", String(v)); }
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) el.setAttribute(k, String(v));
  }
  for (const c of (children ?? []).flat()) if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return el;
}

function card(title, ...body){
  const s = h("section", { class: "card" });
  s.append(h("h2", { text: title }));
  body.forEach(b => s.append(b));
  return s;
}

/* ------------------------------ TODAY ----------------------------------- */
export function renderToday(state) {
  const wrap = h("div", { class: "wrap" });

  const iso = todayISO();
  const day = state.days[iso] || { habits: {} };

  const total = state.habits.length;
  const done = Object.values(day.habits || {}).filter(Boolean).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Progress header
  const header = h("div", { style: "margin-bottom:1rem;" },
    h("h2", { text: "Today" }),
    h("p", { class: "muted" }, total ? `${done} of ${total} habits done` : "No habits yet"),
    h("div", { class: "progress" },
      h("div", { class: "progress-bar", style: `width:${pct}%;` })
    )
  );

  // Quote of the Day
  const quotes = window.QUOTES || []; // will load from quotes.js
  let quoteText = "";
  if (quotes.length) {
    const idx = Math.floor((Date.now() / 86400000) % quotes.length); // same quote per day
    quoteText = quotes[idx].text || quotes[idx];
  }
  const quoteEl = h("blockquote", { class: "quote" }, quoteText);

  const list = h("div");
  if (total === 0) {
    list.append(
      h("p", { class: "placeholder__text" }, "No habits yet. Add a few on the Habits page.")
    );
  } else {
    for (const habit of state.habits) {
      const checked = !!day.habits[habit.id];
      const streak = currentStreak(habit.id, state.days);
      const row = h("label", { class: "row", style: "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;" },
        h("input", {
          type: "checkbox",
          checked: checked ? "checked" : null,
          onchange: (e) => {
            CTRL?.toggleHabitForToday(habit.id, e.currentTarget.checked);
            const ev = new Event("hashchange"); window.dispatchEvent(ev);
          }
        }),
        h("span", { class: "mono", style: "flex:1;" }, habit.name),
        h("span", { class: "pill" }, `🔥 ${streak}`)
      );
      list.append(row);
    }
  }

  const section = card("", header, quoteEl, list);
  wrap.append(section);
  return wrap;
}


/* ------------------------------ HISTORY --------------------------------- */
export function renderHistory(state){
  const wrap = h("div", { class: "wrap" });

  // helpers
  const dayISO = (d) => d.toISOString().slice(0,10);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmtDate = (iso) => {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  // week navigation (0 = this week; -1 = previous week, etc.)
  let weekOffset = 0;

  const rangeLabel = h("div", { class: "mono", style: "opacity:.8;margin-bottom:.5rem;" }, "");
  const prevBtn = h("button", { class: "secondary", type: "button" }, "← Prev 7");
  const nextBtn = h("button", { class: "secondary", type: "button" }, "Next 7 →");

  const controls = h("div", { style:"display:flex;gap:.5rem;margin:.5rem 0 1rem 0;" }, prevBtn, nextBtn);

  // table shell
  const table = h("table", { class: "table" },
    h("thead", {},
      h("tr", {},
        h("th", { text: "Date" }),
        h("th", { text: "Completed" }),
        h("th", { text: "Journal" }),
      )
    ),
    h("tbody")
  );

  function renderWeek(){
    // compute the 7-day window based on weekOffset
    const today = new Date();
    const start = addDays(today, weekOffset * -7);      // end of window (today when offset=0)
    const end   = addDays(start, -6);                   // 6 days earlier (older date)

    // label like: "Sep 18–Sep 24"
    const label = `${fmtDate(dayISO(end))} – ${fmtDate(dayISO(start))}`;
    rangeLabel.textContent = label;

    // fill table body (newest first)
    const tb = table.querySelector("tbody");
    tb.innerHTML = "";
    const totalHabits = state.habits.length;

    for (let i=0; i<7; i++){
      const d = addDays(start, -i);             // walk back day by day
      const iso = dayISO(d);
      const day = state.days[iso] || { habits: {} };
      const doneCount = Object.values(day.habits || {}).filter(Boolean).length;
      const snippet = (state.days?.[iso]?.journal || "").slice(0, 60);

      tb.append(
        h("tr", {},
          h("td", { text: fmtDate(iso) }),
          h("td", { text: totalHabits ? `${doneCount}/${totalHabits}` : "—" }),
          h("td", { text: snippet })
        )
      );
    }

    // disable "Next 7" if we’re already at the most recent window
    nextBtn.disabled = (weekOffset === 0);
    nextBtn.classList.toggle("is-disabled", nextBtn.disabled);
  }

  prevBtn.addEventListener("click", () => { weekOffset += 1; renderWeek(); });
  nextBtn.addEventListener("click", () => { if (weekOffset > 0) { weekOffset -= 1; renderWeek(); } });

  wrap.append(
    card("History (last 7 days)", rangeLabel, controls, table,
      h("p", { class: "muted", style:"margin-top:.75rem" },
        state.habits.length
          ? "Tip: Add journal notes on the Journal tab — snippets appear here."
          : "Add some habits on the Habits tab to start tracking."
      )
    )
  );

  renderWeek();
  return wrap;
}

/* ------------------------------ HABITS ---------------------------------- */
export function renderHabits(state){
  const wrap = h("div", { class: "wrap" });

  const form = h("form", { class: "row", style: "display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;" },
    h("input", { type: "text", name: "name", placeholder: "New habit (e.g., Read 10 pages)", required: "required", style: "flex:1;min-width:240px;padding:.5rem;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#0e1224;color:#e9edff;" }),
    h("button", { type: "submit", class: "btn" }, "Add")
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (new FormData(form).get("name") || "").toString().trim();
    if (!name) return;
    CTRL?.addHabit(name);
    const ev = new Event("hashchange"); window.dispatchEvent(ev);
    form.querySelector('[name="name"]').value = "";
  });

  const list = h("div");
  if (state.habits.length === 0) {
    list.append(h("p", { class: "placeholder__text" }, "No habits yet."));
  } else {
    for (const habit of state.habits) {
      const row = h("div", { class: "row", style: "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;" },
        h("span", { class: "mono", style: "flex:1;" }, habit.name),
        h("button", {
          class: "secondary",
          type: "button",
          onclick: () => {
            if (confirm(`Delete habit "${habit.name}"? This won't remove past checkmarks.`)) {
              CTRL?.deleteHabit(habit.id);
              const ev = new Event("hashchange"); window.dispatchEvent(ev);
            }
          }
        }, "Delete")
      );
      list.append(row);
    }
  }

  wrap.append(card("Add Habit", form), card("Your Habits", list));
  return wrap;
}

/* ------------------------------ JOURNAL --------------------------------- */
export function renderJournal(state){
  const wrap = h("div", { class: "wrap" });

  const toISO = (d) => d.toISOString().slice(0,10);
  const fromISO = (s) => new Date(s + "T12:00:00");

  let iso = todayISO();

  const dateLabel = h("div", { class: "mono", style: "opacity:.8;margin-bottom:.5rem;" }, iso);

  const ta = h("textarea", {
    class: "input",
    rows: 10,
    value: CTRL?.getJournalForDate(iso) || "",
    placeholder: "Write your thoughts for today…"
  });

  const counter = h("div", { class: "mono", style: "opacity:.6;font-size:.9rem;margin-top:.25rem;" },
    `${(ta.value || "").length} chars`
  );

  let t = null;
  ta.addEventListener("input", () => {
    counter.textContent = `${ta.value.length} chars`;
    clearTimeout(t);
    t = setTimeout(() => { CTRL?.setJournalForDate(iso, ta.value); }, 300);
  });

  const prevBtn = h("button", { class: "secondary", type: "button" }, "← Prev");
  const nextBtn = h("button", { class: "secondary", type: "button" }, "Next →");

  function loadDay(newISO){
    iso = newISO;
    dateLabel.textContent = iso;
    ta.value = CTRL?.getJournalForDate(iso) || "";
    counter.textContent = `${ta.value.length} chars`;
  }

  prevBtn.addEventListener("click", () => { const d = fromISO(iso); d.setDate(d.getDate() - 1); loadDay(toISO(d)); });
  nextBtn.addEventListener("click", () => { const d = fromISO(iso); d.setDate(d.getDate() + 1); loadDay(toISO(d)); });

  // keyboard ←/→
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { prevBtn.click(); e.preventDefault(); }
    if (e.key === "ArrowRight") { nextBtn.click(); e.preventDefault(); }
  });
  setTimeout(() => ta.focus(), 0);

  const controls = h("div", { style: "display:flex;gap:.5rem;margin:.5rem 0 1rem 0;" }, prevBtn, nextBtn);

  wrap.append(card("Journal", dateLabel, controls, ta, counter,
    h("p", { class: "muted", style: "opacity:.7;margin-top:.75rem;" }, "Autosaves after you pause typing. Use ←/→ to move days.")
  ));
  return wrap;
}

/* ------------------------------ SETTINGS -------------------------------- */
function fieldRow(label, controlEl){
  return h("div", { class: "field-row" },
    h("label", { class: "field-label" }, label),
    h("div", { class: "field-ctrl" }, controlEl)
  );
}

export function renderSettings(state){
  const wrap = h("div", { class: "wrap" });
  const version = document.getElementById("app-version")?.textContent || "";

  // Theme selector
  const themeSel = h("select", { class: "input" },
    h("option", { value: "auto", text: "Auto (follow system)" }),
    h("option", { value: "dark", text: "Dark" }),
    h("option", { value: "light", text: "Light" })
  );
  themeSel.value = state.user?.theme || "auto";
  themeSel.addEventListener("change", () => {
    CTRL?.updateUser({ theme: themeSel.value });
  });

  // NEW: Preferences card (this is the “top” card)
  const cardPrefs = card("Preferences",
    fieldRow("Theme", themeSel)
  );

  // Backup & restore
  const exportBtn = h("button", { class: "btn", onClick: () => CTRL.exportToFile() }, "Export to JSON");

  const keyOut = h("textarea", { class: "input code", rows: 3, placeholder: "Your Save Key will appear here", readonly: true });
  const genKeyBtn = h("button", { class: "btn", onClick: () => { keyOut.value = CTRL.getSaveKey(); keyOut.focus(); keyOut.select(); } }, "Generate Save Key");

  const fileIn = h("input", { type: "file", accept: ".json,application/json" });
  const importFileBtn = h("button", {
    class: "btn warn",
    onClick: async () => {
      if (!fileIn.files?.[0]) return alert("Choose a file first.");
      if (!confirm("Replace ALL current data with this file?")) return;
      try { await CTRL.importFromFile(fileIn.files[0]); alert("Import complete."); }
      catch (e) { alert("Import failed: " + e.message); }
    }
  }, "Import from File");

  const keyIn = h("textarea", { class: "input code", rows: 3, placeholder: "Paste Save Key here…" });
  const importKeyBtn = h("button", {
    class: "btn warn",
    onClick: () => {
      const v = keyIn.value.trim();
      if (!v) return alert("Paste a key first.");
      if (!confirm("Replace ALL current data with this key?")) return;
      try { CTRL.importFromKey(v); alert("Import complete."); }
      catch (e) { alert("Import failed: " + e.message); }
    }
  }, "Import from Key");

  const cardExport = card("Backup & Restore",
    h("p", { class: "muted" }, "Export your data to a file or copy a compact Save Key. Import will REPLACE all current data."),
    fieldRow("Export", exportBtn),
    fieldRow("Save Key", h("div", {}, genKeyBtn, h("div", { style: "height: 0.5rem" }), keyOut)),
    fieldRow("Import (File)", h("div", {}, fileIn, h("div", { style: "height: 0.5rem" }), importFileBtn)),
    fieldRow("Import (Key)", h("div", {}, keyIn, h("div", { style: "height: 0.5rem" }), importKeyBtn)),
  );

  const cardInfo = card("App",
    h("p", { class: "muted" }, `Version ${version}. Theme and PWA coming soon.`)
  );

  // Append in this order so Preferences shows at the top
  wrap.append(cardPrefs, cardExport, cardInfo);
  return wrap;
}

