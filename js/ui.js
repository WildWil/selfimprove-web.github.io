// ui.js — v0.7.2 (Today, History, Habits, Journal, Settings)

import { currentStreak, todayISO } from "./streaks.js";
import { ymd, startOfCalendar, endOfCalendar } from "./calendar.js";
import { loadQuotesCached } from "./data.js";

let CTRL = null;
export function attachController(c){ CTRL = c; }

/* Keep today's quote stable across re-renders */
let QUOTE_OF_TODAY = null;
let QUOTE_STAMP = null; // day number since epoch
const dayStamp = () => Math.floor(Date.now() / 86400000);
function pickQuoteForToday(quotes){
  if (!Array.isArray(quotes) || !quotes.length) return { text: "", author: "" };
  const idx = dayStamp() % quotes.length;
  const q = quotes[idx];
  const text = typeof q === "string" ? q : (q?.text ?? "");
  const author = typeof q === "object" ? (q.author || "") : "";
  return { text, author };
}

/* --------------------------- DOM helper --------------------------------- */
function h(tag, attrs = {}, ...children){
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k in el) {
        try { el[k] = v; } catch { el.setAttribute(k, v); }
      } else el.setAttribute(k, v);
    }
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    if (child instanceof Node) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)));
  }
  return el;
}
function card(title, ...content){
  const head = title ? h("h2", { text: title }) : null;
  const el = h("article", { class: "card" }, ...(head ? [head] : []), ...content);
  return el;
}

/* ------------------------------ TODAY ----------------------------------- */
export function renderToday(state){
  const wrap = h("div", { class: "wrap" });

  // One-time welcome banner
  if (state?.meta?.welcome) {
    const dismissBtn = h("button", {
      class: "secondary",
      type: "button",
      onClick: () => { CTRL?.clearWelcome(); window.dispatchEvent(new Event("hashchange")); }
    }, "Got it");
    const tip = h("p", { class: "muted", text: "Quick start: check habits here; add/edit in Habits; month view in History; notes in Journal; Theme in Settings." });
    const banner = card("Welcome 👋", tip, h("div", {}, dismissBtn));
    banner.classList.add("card","card--compact");
    wrap.append(banner);
  }

  const total = state.habits.length;
  const iso = todayISO();
  const day = state.days[iso] || { habits: {} };
  const done = Object.values(day.habits || {}).filter(Boolean).length;
  const pct = total ? Math.round((done/total)*100) : 0;

  const header = h("div", {},
    h("div", { class: "mono", text: total ? `${done} of ${total} habits done` : "No habits yet" }),
    h("div", { class: "progress" },
      h("div", { class: "progress-bar", style: `width:${pct}%;` })
    )
  );

  // Quote of the day (no flicker; cached)
  const quoteEl = h("blockquote", { class: "quote" },
    h("span", { class: "quote__text", text: "" }),
    h("footer", { class: "quote__author", text: "" })
  );
  if (QUOTE_OF_TODAY && QUOTE_STAMP === dayStamp()) {
    const { text, author } = QUOTE_OF_TODAY;
    quoteEl.querySelector(".quote__text").textContent = text || "";
    quoteEl.querySelector(".quote__author").textContent = author ? `— ${author}` : "";
  }
  loadQuotesCached()
    .then(quotes => {
      QUOTE_OF_TODAY = pickQuoteForToday(quotes);
      QUOTE_STAMP = dayStamp();
      const { text, author } = QUOTE_OF_TODAY;
      quoteEl.querySelector(".quote__text").textContent = text || "";
      quoteEl.querySelector(".quote__author").textContent = author ? `— ${author}` : "";
    })
    .catch(() => {});

  const list = h("div");
  if (total === 0) {
    list.append(h("p", { class: "placeholder__text" }, "No habits yet. Add a few on the Habits page."));
  } else {
    for (const habit of state.habits) {
      const checked = !!day.habits[habit.id];
      const streak = currentStreak(habit.id, state.days);
      const row = h("label", { class: "row", style: "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;" },
        h("input", {
          type: "checkbox",
          checked,
          onchange: (e) => {
            CTRL?.toggleHabitForToday(habit.id, e.currentTarget.checked);
            window.dispatchEvent(new Event("hashchange")); // app.js keeps scroll; quotes cached -> no flicker
          }
        }),
        h("span", { class: "mono", style: "flex:1;" }, habit.name),
        h("span", { class: "pill" }, `🔥 ${streak}`)
      );
      list.append(row);
    }
  }

  wrap.append(card("", header, quoteEl, list));
  return wrap;
}

/* ------------------------------ HISTORY --------------------------------- */
export function renderHistory(state){
  const wrap = h("div", { class: "wrap" });

  const pctFor = (iso) => {
    const total = state.habits.length;
    const d = state.days[iso] || { habits:{} };
    const done = Object.values(d.habits || {}).filter(Boolean).length;
    return total ? Math.round((done/total)*100) : 0;
  };

  let monthOffset = 0;

  const label = h("div", { class: "mono", style: "text-align:center;flex:1;" });
  const prevBtn = h("button", { class: "secondary", type: "button", onClick: () => { monthOffset--; renderMonth(); } }, "← Prev Month");
  const nextBtn = h("button", { class: "secondary", type: "button", onClick: () => { monthOffset++; renderMonth(); } }, "Next Month →");
  const controls = h("div", { style: "display:flex;gap:.5rem;align-items:center;margin:.5rem 0 1rem 0;" }, prevBtn, label, nextBtn);

  const dow = h("div", { class: "history-dow", style: "display:grid;grid-template-columns:repeat(7,1fr);gap:8px" },
    h("div", { text: "Sun" }), h("div", { text: "Mon" }), h("div", { text: "Tue" }),
    h("div", { text: "Wed" }), h("div", { text: "Thu" }), h("div", { text: "Fri" }), h("div", { text: "Sat" })
  );

  const cal = h("div", { class: "history-cal" });
  const popover = h("div", { class: "popover" });

  // Overlay
  const overlay = h("div", { class: "overlay", role: "dialog", "aria-modal": "true", "aria-hidden": "true" },
    h("article", { class: "detail", "aria-labelledby": "detail-title" },
      h("header", {},
        h("div", {},
          h("h2", { id: "detail-title", style: "margin:0 0 2px 0;font-size:1.15rem", text: "Day Details" }),
          h("div", { id: "detail-sub", class: "muted", text: "—" })
        ),
        h("div", { id: "detail-chips", class: "chips" }),
        h("button", { id: "detail-close", class: "secondary", type: "button", "aria-label": "Close" }, "Close ✕")
      ),
      h("section", { class: "grid-two" },
        h("div", {},
          h("h3", { style: "margin:.25rem 0 .35rem 0;font-size:1rem", text: "Habits" }),
          h("div", { id: "detail-habits" })
        ),
        h("div", {},
          h("h3", { style: "margin:.25rem 0 .35rem 0;font-size:1rem", text: "Summary" }),
          h("div", { id: "detail-summary", class: "muted" })
        ),
      ),
      h("section", { style: "margin-top:.5rem" },
        h("h3", { style: "margin:.5rem 0 .35rem 0;font-size:1rem", text: "Journal" }),
        h("div", { id: "detail-journal", class: "journal" })
      )
    )
  );

  function showPopover(x, y, title, snippet){
    popover.style.left = `${x}px`;
    popover.style.top = `${y}px`;
    popover.innerHTML = "";
    popover.append(h("h3", { text: title }), h("div", { class: "snippet", text: snippet || "" }));
    popover.style.display = "block";
  }
  function hidePopover(){ popover.style.display = "none"; }

  function openDetail(iso){
    const d = state.days[iso] || { habits:{} };
    const pct = pctFor(iso);
    const dt = new Date(iso);
    const pretty = dt.toLocaleDateString(undefined, { weekday:"short", year:"numeric", month:"short", day:"numeric" });
    overlay.querySelector("#detail-sub").textContent = `${pretty} — ${pct}%`;
    const chips = overlay.querySelector("#detail-chips");
    chips.innerHTML = "";
    for (const hbit of state.habits) {
      const ok = !!d.habits[hbit.id];
      const chip = h("span", { class: "chip" }, ok ? `✔ ${hbit.name}` : `○ ${hbit.name}`);
      chips.append(chip);
    }
    overlay.querySelector("#detail-habits").innerHTML = "";
    overlay.querySelector("#detail-habits").append(h("div", { text: `${Object.values(d.habits||{}).filter(Boolean).length} of ${state.habits.length} done` }));
    overlay.querySelector("#detail-summary").textContent = pct >= 80 ? "Great day — you hit most targets." : pct >= 40 ? "Solid effort — keep pushing." : "Light day — tomorrow’s a chance to build momentum.";
    overlay.querySelector("#detail-journal").textContent = d.journal || "(No journal entry)";
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    wrap.querySelector("#detail-close").focus();
  }
  function closeDetail(){
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  wrap.querySelector?.("#detail-close")?.addEventListener?.("click", closeDetail);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDetail(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });

  function renderMonth(){
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const start = startOfCalendar(base);
    const end = endOfCalendar(base);
    label.textContent = base.toLocaleDateString(undefined, { year:"numeric", month:"long" });

    cal.innerHTML = "";
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
      const iso = ymd(d);
      const pct = pctFor(iso);
      const isThisMonth = d.getMonth() === base.getMonth();
      const isToday = iso === todayISO();

      const cell = h("div", { class: `cell${isThisMonth ? "" : " empty"}${isToday ? " today":""}` });
      const fill = h("div", { class: "fill", style: `height:${pct}%;` });
      const date = h("div", { class: "date", text: String(d.getDate()) });
      const pctEl = h("div", { class: "pct", text: `${pct}%` });
      cell.append(fill, date, pctEl);

      const journal = state.days[iso]?.journal || "";
      cell.addEventListener("mouseenter", (e) => showPopover(e.clientX + 12, e.clientY + 12, ymd(d), journal));
      cell.addEventListener("mouseleave", hidePopover);
      cell.addEventListener("click", () => openDetail(iso));

      cal.append(cell);
    }
  }

  wrap.append(card("History", controls, dow, cal), popover, overlay);
  renderMonth();
  return wrap;
}

/* ------------------------------ HABITS ---------------------------------- */
export function renderHabits(state){
  const wrap = h("div", { class: "wrap" });

  const nameIn = h("input", { type: "text", class: "input", placeholder: "New habit name…" });
  const addBtn = h("button", { class: "btn", onClick: () => {
    const name = (nameIn.value || "").trim();
    if (!name) return;
    CTRL?.addHabit(name);
    window.dispatchEvent(new Event("hashchange"));
  } }, "Add Habit");

  const list = h("div");
  if (!state.habits.length) {
    list.append(h("p", { class: "placeholder__text" }, "No habits yet. Add one above."));
  } else {
    for (const habit of state.habits) {
      const row = h("div", { class: "row", style: "margin:.5rem 0;" },
        h("span", { class: "mono", style: "flex:1;" }, habit.name),
        h("button", { class: "secondary", onClick: () => {
          if (confirm(`Delete "${habit.name}"?`)) {
            CTRL?.deleteHabit(habit.id);
            window.dispatchEvent(new Event("hashchange"));
          }
        } }, "Delete")
      );
      list.append(row);
    }
  }

  wrap.append(card("Habits", h("div", { class: "field-row" },
    h("label", { class: "field-label", text: "Add habit" }),
    h("div", {}, nameIn, h("div", { style: "margin-top:.5rem" }, addBtn))
  ), list));
  return wrap;
}

/* ------------------------------ JOURNAL --------------------------------- */
export function renderJournal(state){
  const wrap = h("div", { class: "wrap" });

  let offset = 0;
  function currentISO(){
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0,10);
  }
  function pretty(date){
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { weekday:"short", year:"numeric", month:"short", day:"numeric" });
  }

  const dateLabel = h("div", { class: "mono", text: pretty(currentISO()) });
  const ta = h("textarea", { class: "input", value: CTRL?.getJournalForDate(currentISO()) || "" });
  const counter = h("div", { class: "muted", text: `${ta.value.length} chars` });
  ta.addEventListener("input", () => {
    counter.textContent = `${ta.value.length} chars`;
    clearTimeout(ta._t);
    ta._t = setTimeout(() => {
      CTRL?.setJournalForDate(currentISO(), ta.value);
    }, 250);
  });

  const prevBtn = h("button", { class: "secondary", onClick: () => {
    offset--; dateLabel.textContent = pretty(currentISO());
    ta.value = CTRL?.getJournalForDate(currentISO()) || ""; counter.textContent = `${ta.value.length} chars`;
  } }, "← Prev");
  const nextBtn = h("button", { class: "secondary", onClick: () => {
    offset++; dateLabel.textContent = pretty(currentISO());
    ta.value = CTRL?.getJournalForDate(currentISO()) || ""; counter.textContent = `${ta.value.length} chars`;
  } }, "Next →");
  const controls = h("div", { style: "display:flex;gap:.5rem;margin:.5rem 0 1rem 0;" }, prevBtn, nextBtn);

  wrap.append(card("Journal", dateLabel, controls, ta, counter,
    h("p", { class: "muted", text: "Tip: entries auto-save. Use Prev/Next to browse other days." })
  ));
  return wrap;
}

/* ------------------------------ SETTINGS -------------------------------- */
export function renderSettings(state){
  const wrap = h("div", { class: "wrap" });

  /* Theme */
  const themeSel = h("select", {
    class: "input",
    value: state.user?.theme || "auto",
    onchange: (e) => CTRL?.updateUser({ theme: e.currentTarget.value })
  },
    h("option", { value: "auto", text: "Auto" }),
    h("option", { value: "dark", text: "Dark" }),
    h("option", { value: "light", text: "Light" }),
  );

  /* Export / Import */
  const keyOut = h("textarea", { class: "input code", rows: 3, readOnly: true });
  const genKeyBtn = h("button", {
    class: "btn",
    onClick: () => {
      keyOut.value = CTRL?.getSaveKey() || "";
      keyOut.focus(); keyOut.select();
    }
  }, "Generate Save Key");

  const fileIn = h("input", { type: "file", accept: ".json,application/json" });
  const exportBtn = h("button", { class: "btn", onClick: () => CTRL?.exportToFile() }, "Export to File");
  const importFileBtn = h("button", {
    class: "btn warn",
    onClick: async () => {
      const f = fileIn.files?.[0];
      if (!f) return alert("Choose a file first.");
      try { await CTRL?.importFromFile(f); } catch (e) { alert("Import failed."); }
    }
  }, "Import from File");

  const keyIn = h("textarea", { class: "input code", rows: 3, placeholder: "Paste save key here..." });
  const importKeyBtn = h("button", {
    class: "btn warn",
    onClick: () => {
      const k = (keyIn.value || "").trim();
      if (!k) return alert("Paste a key first.");
      try { CTRL?.importFromKey(k); } catch (e) { alert("Import failed."); }
    }
  }, "Import from Key");

  const themeSec = card("Theme", h("div", { class: "field-row" },
    h("label", { class: "field-label", text: "Appearance" }),
    h("div", {}, themeSel, h("div", { class: "muted", text: "Auto follows your system setting." }))
  ));

  const exportSec = card("Backup", 
    h("div", { class: "field-row" },
      h("label", { class: "field-label", text: "Save Key" }),
      h("div", {}, genKeyBtn, h("div", { style: "margin-top:.5rem" }, keyOut))
    ),
    h("div", { class: "field-row" },
      h("label", { class: "field-label", text: "Export / Import" }),
      h("div", {}, exportBtn, h("div", { style: "margin-top:.5rem" }, fileIn, importFileBtn))
    ),
    h("div", { class: "field-row" },
      h("label", { class: "field-label", text: "Import from Key" }),
      h("div", {}, keyIn, h("div", { style: "margin-top:.5rem" }, importKeyBtn))
    ),
  );

  const about = card("About", h("div", { class: "muted", html: `Version <strong id="app-version">v0.6.0</strong>. Your data stays on your device.` }));
  wrap.append(themeSec, exportSec, about);
  return wrap;
}
