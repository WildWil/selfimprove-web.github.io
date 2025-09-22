// ui.js — v0.7.2 (bug fixes: corrected popover date, day selection, close button)

import { currentStreak, todayISO } from "./streaks.js";
import { ymd, startOfCalendar, endOfCalendar } from "./calendar.js";
import { loadQuotes } from "./data.js";

let CTRL = null;
export function attachController(c){ CTRL = c; }

/* --------------------------- DOM helper --------------------------------- */
function h(tag, attrs = {}, ...children){
  const el = document.createElement(tag);

  if (attrs) {
    for (const [attr, value] of Object.entries(attrs)){
      if (attr === "class"){
        el.className = value;
      } else if (attr === "style"){
        el.setAttribute("style", value);
      } else if (attr.startsWith("on") && typeof value === "function"){
        el.addEventListener(attr.slice(2).toLowerCase(), value);
      } else if (attr in el){
        try {
          el[attr] = value;
        } catch(e){
          el.setAttribute(attr, value);
        }
      } else {
        el.setAttribute(attr, value);
      }
    }
  }

  for (const child of children.flat()){
    if (child === null || child === undefined) continue;
    if (typeof child === "string" || typeof child === "number"){
      el.appendChild(document.createTextNode(String(child)));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

/* --------------------------- Reusable UI chunks ------------------------- */

function card(title, content){
  return h("section", { class: "card" },
    h("h2", { text: title }),
    content
  );
}

/* ------------------------------ TODAY ----------------------------------- */
export function renderToday(state){
  const wrap = h("div", { class: "wrap" });

  // Optional welcome banner (shown once after onboarding)
  if (state.meta?.welcome) {
    const dismiss = h("button", {
      class: "secondary",
      type: "button",
      onClick: () => {
        CTRL?.clearWelcome();
        window.dispatchEvent(new Event("hashchange")); // re-render
      }
    }, "Dismiss");
    wrap.append(
      h("section", { class: "card" },
        h("p", {}, 
          "Congrats on setting up your habits! 🎉 This is your Today screen. Start by checking off a habit you complete today, and add journal notes if you’d like. Explore the History tab to see progress over time.",
        ),
        h("p", {}, 
          "You can always export your data for safekeeping via Settings. Good luck on your journey!"
        ),
        dismiss
      )
    );
    // flag as shown
    state.meta.welcome = false;
    // we intentionally do NOT persist here to avoid messing up onboarding metrics
    // (persistence happens later as part of main save loop)
  }

  // Header (with current streak count)
  const streakCount = currentStreak(state);
  const streak = h("h1", { text: streakCount });
  const header = h("section", { class: "card today-header" },
    h("div", {},
      h("h2", { text: "Today" }),
      h("p", { class: "muted", text: todayISO() })
    ),
    h("div", { class: "streak" },
      h("div", { class: "label", text: "Current Streak" }),
      h("div", { class: "value", text: String(streakCount) }),
    )
  );

  // Habit list with checkboxes
  const list = h("div", {});
  for (const habit of state.habits){
    const isDone = !!state.days[todayISO()]?.habits?.[habit.id];
    const cb = h("input", {
      id: `habit-${habit.id}`,
      class: "checkbox",
      type: "checkbox",
      checked: isDone ? "checked" : "",
      onChange: () => CTRL?.toggleHabitForToday(habit.id)
    });
    const label = h("label", { for: `habit-${habit.id}` }, habit.name);
    list.append(h("div", { class: "habit-row" }, cb, label));
  }

  // Journal textarea
  const journal = h("textarea", {
    id: "journal-text",
    placeholder: "Journal entry (optional)",
    style: "min-height:4rem;",
    onChange: e => CTRL?.setJournalForDate(todayISO(), e.target.value)
  });
  journal.value = state.days[todayISO()]?.journal || "";

  // Compose the Today screen
  wrap.append(header);
  wrap.append(
    h("section", { class: "card" },
      h("h3", { text: "Habits" }),
      list
    )
  );
  wrap.append(
    h("section", { class: "card" },
      h("h3", { text: "Journal" }),
      journal
    )
  );

  return wrap;
}

/* ---------------------------- HISTORY ----------------------------------- */
export function renderHistory(state){
  const wrap = h("div", { class: "wrap" });
  let monthOffset = 0;

  const back = h("button", { class: "secondary", type: "button", "aria-label": "Previous month", onClick: () => { monthOffset--; renderMonth(); } }, "‹");
  const fwd = h("button", { class: "secondary", type: "button", "aria-label": "Next month", onClick: () => { monthOffset++; renderMonth(); } }, "›");
  const label = h("h3", { text: "Month", style: "margin:0 .25rem" });
  const controls = h("div", { class: "controls" }, back, label, fwd);

  // Day-of-week header
  const dow = h("div", { class: "dow-header" });
  for (const day of ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]){
    dow.appendChild(h("div", { text: day }));
  }

  const cal = h("div", { class: "calendar" });
  const popover = h("div", { class: "popover" });

  // Overlay for day details
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
      h("div", { class: "detail-body" },
        h("div", { class: "detail-habits-container" },
          h("h3", { style: "margin:0 0 .5rem 0", text: "Habits" }),
          h("div", { id: "detail-habits" })
        ),
        h("div", { class: "detail-notes-container" },
          h("h3", { style: "margin:0 0 .5rem 0", text: "Journal" }),
          h("div", { id: "detail-journal", class: "journal" })
        )
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

  function openDetail(iso){
    hidePopover();
    const d = new Date(iso + "T12:00:00");
    const p = pctFor(iso);
    const j = state.days[iso]?.journal || "";
    const doneMap = state.days[iso]?.habits || {};
    const total = state.habits.length;
    const done = Object.values(doneMap).filter(Boolean).length;

    // Fill in detail overlay content
    wrap.querySelector("#detail-sub").textContent = `${iso} • Completed ${p}%`;

    const chips = wrap.querySelector("#detail-chips");
    chips.innerHTML = "";
    chips.append(chip(`${done}/${total} habits`));
    if (p === 100) chips.append(chip("All habits done!"));
    if (j) chips.append(chip("Journal entry added"));

    // Fill habits list in overlay
    const detailHabits = wrap.querySelector("#detail-habits");
    detailHabits.innerHTML = "";
    for (const habit of state.habits){
      const isDone = !!doneMap[habit.id];
      const checkbox = h("input", { type: "checkbox", checked: isDone ? "checked" : "", disabled: "disabled" });
      const label = h("label", { style: "margin-left:.5rem" }, habit.name);
      detailHabits.append(h("div", {}, checkbox, label));
    }

    // Fill journal in overlay
    const detailJournal = wrap.querySelector("#detail-journal");
    detailJournal.textContent = j || "(No journal entry for this day)";

    // Show overlay
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    wrap.querySelector("#detail-close").focus();
  }
  function chip(text){ return h("div", { class: "chip", text }); }

  function closeDetail(){
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  // Event listeners for overlay close actions
  wrap.querySelector("#detail-close").addEventListener("click", closeDetail);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDetail(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });

  // Helper to compute completion percentage for a given date (as YYYY-MM-DD)
  function pctFor(iso){
    const total = state.habits.length || 0;
    if (!total) return 0;
    const doneCount = Object.values(state.days[iso]?.habits || {}).filter(Boolean).length;
    return Math.round((doneCount / total) * 100);
  }

  // Initial render
  renderMonth();
  return wrap;
}

/* ----------------------------- HABITS ----------------------------------- */
export function renderHabits(state){
  const wrap = h("div", { class: "wrap" });

  // Add New Habit form
  const form = h("form", { class: "row", style: "display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;" },
    h("input", {
      class: "input",
      type: "text",
      name: "name",
      placeholder: "New habit (e.g., Read 10 pages)",
      required: "required",
      style: "flex:1;min-width:240px;"
    }),
    h("button", { class: "btn", type: "submit" }, "Add Habit")
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    if (!name) return;
    CTRL?.addHabit(name);
    form.reset();
  });

  // Habits list
  const list = h("div", {});
  for (const habit of state.habits){
    const btnDelete = h("button", {
      class: "secondary",
      type: "button",
      style: "margin-left:.5rem;",
      onClick: () => { if (confirm(`Delete '${habit.name}'?`)) CTRL?.deleteHabit(habit.id); }
    }, "Delete");
    const item = h("div", { class: "habit-item", style: "display:flex;align-items:center;justify-content:space-between;" },
      h("span", {}, habit.name),
      btnDelete
    );
    list.append(item);
  }
  if (!state.habits.length){
    list.append(h("div", { class: "placeholder__text" }, "No habits yet. Add a few on the form above."));
  }

  wrap.append(card("Add Habit", form), card("Your Habits", list));
  return wrap;
}

/* ----------------------------- JOURNAL ---------------------------------- */
export function renderJournal(state){
  const wrap = h("div", { class: "wrap" });

  const form = h("form", { class: "card", style: "margin-bottom:1rem;" },
    h("h3", { text: "Add Journal Entry" }),
    h("textarea", { id: "new-journal", required: "required", placeholder: "What's on your mind?", style: "width:100%;min-height:4rem;margin-bottom:.5rem;" }),
    h("div", { style: "display:flex;justify-content:flex-end;" },
      h("button", { class: "btn", type: "submit" }, "Add Entry")
    )
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = form.querySelector("#new-journal").value.trim();
    if (!text) return;
    CTRL?.addJournalEntry(text);
    form.reset();
  });

  const list = h("div", {});
  for (const entry of state.days[todayISO()]?.journalEntries || []){
    const item = h("div", { class: "card", style: "margin-bottom:1rem;" },
      h("div", { class: "entry-text", text: entry.text }),
      h("div", { class: "muted", style: "text-align:right;font-size:.9rem;", text: new Date(entry.ts).toLocaleString() })
    );
    list.append(item);
  }
  if (!list.childNodes.length){
    list.append(h("p", { class: "placeholder__text" }, "No journal entries yet for today."));
  }

  wrap.append(form, h("h2", { text: "Entries for Today" }), list);
  return wrap;
}

/* ---------------------------- SETTINGS ---------------------------------- */
export function renderSettings(state){
  const wrap = h("div", { class: "wrap" });

  // Theme switcher
  const themeSelect = h("select", { id: "theme-select" },
    ...["auto","dark","light"].map(opt => h("option", { value: opt, selected: state.user.theme === opt ? "selected" : "" }, opt[0].toUpperCase() + opt.slice(1)))
  );
  themeSelect.addEventListener("change", (e) => CTRL?.updateUser({ theme: e.target.value }));

  // Start-of-week switcher
  const sowSelect = h("select", { id: "sow-select" },
    ...[0,1].map(val => {
      const label = val === 0 ? "Sunday" : "Monday";
      return h("option", { value: String(val), selected: state.user.startOfWeek === val ? "selected" : "" }, label);
    })
  );
  sowSelect.addEventListener("change", (e) => CTRL?.updateUser({ startOfWeek: Number(e.target.value) }));

  // Export / Import
  const backupKeyInput = h("input", { id: "backup-key", class: "input code", type: "text", readOnly: "readonly", value: encodeURIComponent(encodeSaveKey(buildSnapshot(state))) });
  const downloadBtn = h("button", { class: "secondary", type: "button", onClick: () => downloadSnapshot(buildSnapshot(state)), style: "margin-top:.5rem;" }, "Export to File");
  const copyBtn = h("button", { class: "secondary", type: "button", onClick: () => { backupKeyInput.select(); document.execCommand("copy"); backupKeyInput.blur(); alert("Copied backup key to clipboard."); }, style: "margin-top:.5rem;" }, "Copy Backup Key");
  const loadFileInput = h("input", { id: "load-file", type: "file", accept: ".json", onChange: e => { const file = e.target.files[0]; if (file) readSnapshotFile(file, (snap) => applySnapshotReplaceAll(snap, state)); } });
  const importFileBtn = h("button", { class: "secondary", type: "button", onClick: () => loadFileInput.click(), style: "margin-top:.5rem;" }, "Import from File");
  const importKeyBtn = h("button", { class: "secondary", type: "button", onClick: () => {
    const key = prompt("Paste backup key:");
    if (key) {
      const snap = readSnapshotFromKey(decodeURIComponent(key));
      if (snap) applySnapshotReplaceAll(snap, state);
      else alert("Invalid backup key.");
    }
  }, style: "margin-top:.5rem;" }, "Import from Key");

  wrap.append(
    h("section", { class: "card" },
      h("h2", { text: "Settings" }),
      h("div", { class: "field-row" },
        h("label", { class: "field-label", for: "theme-select" }, "Theme"),
        themeSelect
      ),
      h("div", { class: "field-row" },
        h("label", { class: "field-label", for: "sow-select" }, "Start of Week"),
        sowSelect
      )
    ),
    h("section", { class: "card" },
      h("h3", { text: "Export Data" }),
      h("p", {}, "Download a snapshot of all habits and entries."),
      backupKeyInput,
      h("div", { style: "display:flex;flex-wrap:wrap;gap:.5rem;" }, downloadBtn, copyBtn)
    ),
    h("section", { class: "card" },
      h("h3", { text: "Import Data" }),
      h("p", {}, "Import from a snapshot file or backup key."),
      loadFileInput,
      h("div", { style: "display:flex;flex-wrap:wrap;gap:.5rem;" }, importFileBtn, importKeyBtn)
    )
  );

  return wrap;
}
