// ui.js — v0.7.1 clean (Today, History Calendar, Habits, Journal, Settings)

import { currentStreak, todayISO } from "./streaks.js";
import { ymd, startOfCalendar, endOfCalendar } from "./calendar.js";
import { loadQuotes } from "./data.js";

let CTRL = null;
export function attachController(c){ CTRL = c; }

/* --------------------------- DOM helper --------------------------------- */
function h(tag, attrs = {}, ...children){
  const el = document.createElement(tag);

  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;

      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "value") {
        if ("value" in el) el.value = v;
        else el.setAttribute("value", String(v));
      }
      else if (k.startsWith("on") && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      }
      else if (k in el) {
        el[k] = v;              // prefer DOM property (e.g., checked, disabled)
      }
      else {
        el.setAttribute(k, String(v));
      }
    }
  }

  for (const c of (children ?? []).flat()) {
    if (c == null) continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
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

  const header = h("div", { style: "margin-bottom:1rem;" },
    h("h2", { text: "Today" }),
    h("p", { class: "muted" }, total ? `${done} of ${total} habits done` : "No habits yet"),
    h("div", { class: "progress" },
      h("div", { class: "progress-bar", style: `width:${pct}%;` })
    )
  );
// Quote of the day (same quote per day)
const quoteEl = h("blockquote", { class: "quote" },
  h("span", { class: "quote__text", text: "" }),
  h("footer", { class: "quote__author", text: "" })
);

loadQuotes()
  .then(quotes => {
    if (!quotes || !quotes.length) return;
    const idx = Math.floor((Date.now() / 86400000) % quotes.length);
    const q = quotes[idx];
    const text = typeof q === "string" ? q : (q?.text ?? "");
    const author = typeof q === "object" ? (q.author || "") : "";
    quoteEl.querySelector(".quote__text").textContent = text;
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
            window.dispatchEvent(new Event("hashchange"));
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

/* ------------------------------ HISTORY (Calendar + Overlay) ------------- */
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

  // DOW header
  const dow = h("div", { class: "history-dow", style: "display:grid;grid-template-columns:repeat(7,1fr);gap:8px" },
    h("div", { text: "Sun" }), h("div", { text: "Mon" }), h("div", { text: "Tue" }),
    h("div", { text: "Wed" }), h("div", { text: "Thu" }), h("div", { text: "Fri" }), h("div", { text: "Sat" })
  );

  const cal = h("div", { class: "history-cal" });
  const popover = h("div", { class: "popover" });

  // Overlay (detail)
  const overlay = h("div", { class: "overlay", role: "dialog", "aria-modal": "true", "aria-hidden": "true" },
    h("article", { class: "detail", "aria-labelledby": "detail-title" },
      h("header", {},
        h("div", {},
          h("h2", { id: "detail-title", style: "margin:0 0 2px 0;font-size:1.15rem", text: "Day Details" }),
          h("div", { id: "detail-sub", class: "muted", text: "—" })
        ),
        h("div", { id: "detail-chips", class: "chips" }),
        // text keeps it clear for a11y; CSS moves it to top-right
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

  const historyCard = h("section", { class: "card card--compact history-card" },
    h("h2", { text: "History — Calendar" }),
    controls, dow, cal, popover
  );

  wrap.append(historyCard, overlay);

  function renderMonth(){
    const base = new Date();
    base.setMonth(base.getMonth() + monthOffset);
    base.setDate(1);
    label.textContent = base.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    cal.innerHTML = "";
    const start = startOfCalendar(base);
    const end = endOfCalendar(base);
    const todayIso = ymd(new Date());

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){
      const iso = ymd(d);
      const inMonth = (d.getMonth() === base.getMonth());
      const p = pctFor(iso);

      const cell = h("div", { class: "cell" + (inMonth ? "" : " empty") + (iso === todayIso ? " today" : "") });
      const fill = h("div", { class: "fill", style: `height:${p}%;` });
      const date = h("div", { class: "date", text: String(d.getDate()) });
      const pct = h("div", { class: "pct", text: p ? `${p}%` : "" });
      cell.append(fill, date, pct);

      // hover popover
      cell.addEventListener("mouseenter", (e) => showPopover(e.clientX, e.clientY, iso));
      cell.addEventListener("mouseleave", hidePopover);
      // click overlay
      cell.addEventListener("click", () => openDetail(iso));

      cal.appendChild(cell);
    }
  }

  function showPopover(x, y, iso){
    const d = new Date(iso + "T12:00:00");
    const p = pctFor(iso);
    const j = state.days[iso]?.journal || "";
    popover.innerHTML = "";
    popover.append(
      h("h3", { text: d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) }),
      h("div", { class: "muted", text: `Completed: ${p}%` }),
      j ? h("div", { class: "snippet", text: j.length > 140 ? j.slice(0,140) + "…" : j }) : null
    );
    const pad = 10;
    popover.style.display = "block";
    popover.style.position = "fixed";
    popover.style.left = (x + pad) + "px";
    popover.style.top  = (y + pad) + "px";
  }
  function hidePopover(){ popover.style.display = "none"; }

  function chip(text){ return h("div", { class: "chip", text }); }

  function openDetail(iso){
    hidePopover();
    const d = new Date(iso + "T12:00:00");
    const p = pctFor(iso);
    const j = state.days[iso]?.journal || "";
    const doneMap = state.days[iso]?.habits || {};
    const total = state.habits.length;
    const done = Object.values(doneMap).filter(Boolean).length;

    wrap.querySelector("#detail-title").textContent = d.toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric" });
    wrap.querySelector("#detail-sub").textContent = `${iso} • Completed ${p}%`;

    const chips = wrap.querySelector("#detail-chips"); chips.innerHTML = "";
    chips.append(chip(`${done}/${total} habits`));
    if (p === 100) chips.append(chip("Perfect day"));
    else if (p >= 60) chips.append(chip("Solid progress"));

    const list = wrap.querySelector("#detail-habits"); list.innerHTML = "";
    for (const hbt of state.habits){
      const ok = !!doneMap[hbt.id];
      const row = h("div", { class: "chip", text: (ok ? "✓ " : "○ ") + hbt.name });
      row.style.display = "inline-block";
      row.style.margin  = "0 .5rem .5rem 0";
      list.append(row);
    }

    wrap.querySelector("#detail-summary").textContent = p ? `You completed ${done} of ${total} habits.` : "No habits completed this day.";
    wrap.querySelector("#detail-journal").textContent = j || "— No journal entry —";

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    wrap.querySelector("#detail-close").focus();
  }
  function closeDetail(){
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  wrap.querySelector("#detail-close").addEventListener("click", closeDetail);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDetail(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });

  // extra polish: hide hover popover when scrolling/resizing (mobile)
  window.addEventListener("scroll", hidePopover, { passive: true });
  window.addEventListener("resize", hidePopover);

  renderMonth();
  return wrap;
}

/* ------------------------------ HABITS ---------------------------------- */
export function renderHabits(state){
  const wrap = h("div", { class: "wrap" });

  const form = h("form", { class: "row", style: "display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;" },
    h("input", {
      class: "input",
      type: "text",
      name: "name",
      placeholder: "New habit (e.g., Read 10 pages)",
      required: "required",
      style: "flex:1;min-width:240px;"
    }),
    h("button", { type: "submit", class: "btn" }, "Add")
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (new FormData(form).get("name") || "").toString().trim();
    if (!name) return;
    CTRL?.addHabit(name);
    window.dispatchEvent(new Event("hashchange"));
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
          onClick: () => {
            if (confirm(`Delete habit "${habit.name}"? This won't remove past checkmarks.`)) {
              CTRL?.deleteHabit(habit.id);
              window.dispatchEvent(new Event("hashchange"));
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

  const themeSel = h("select", { class: "input" },
    h("option", { value: "auto", text: "Auto (follow system)" }),
    h("option", { value: "dark", text: "Dark" }),
    h("option", { value: "light", text: "Light" })
  );
  themeSel.value = state.user?.theme || "auto";
  themeSel.addEventListener("change", () => CTRL?.updateUser?.({ theme: themeSel.value }));

  const cardPrefs = card("Preferences",
    fieldRow("Theme", themeSel)
  );

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

  wrap.append(cardPrefs, cardExport, cardInfo);
  return wrap;
}
