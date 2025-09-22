import { h, mount } from "../ui.js";
import { loadState } from "../storage.js";
import {
  monthLabel, startOfCalendar, endOfCalendar,
  addDays, isoDate as ymd
} from "../calendar.js";

export function renderHistory(root) {
  // month anchor in state? else today
  const state = loadState();
  const anchor = state.historyAnchor ? new Date(state.historyAnchor) : new Date();

  function render(monthDate) {
    const head = h("div", { class: "row" },
      h("button", { class: "btn", onClick: () => navigate(-1) }, "← Prev Month"),
      h("h1", { class: "page-title", style: "margin: 0 auto;" }, `History — Calendar`),
      h("button", { class: "btn", onClick: () => navigate(1) }, "Next Month →")
    );

    const label = h("h2", { class: "muted", style: "text-align:center;margin-top:12px;" }, monthLabel(monthDate));

    const grid = h("div", { class: "calendar-grid" });
    // Weekday headers (Sun..Sat)
    const weekNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const header = h("div", { class: "calendar-row header" },
      ...weekNames.map(n => h("div", { class: "cell head" }, n))
    );

    const start = startOfCalendar(monthDate);
    const end = endOfCalendar(monthDate);
    const cells = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const dayIso = ymd(d);
      const inMonth = d.getMonth() === monthDate.getMonth();
      const dayNum = d.getDate();
      const cell = h("div", { class: `cell day ${inMonth ? "" : "dim"}` },
        h("div", { class: "day-number" }, String(dayNum))
      );
      // future: show small dots for completed habits on that day
      cells.push(cell);
    }

    grid.appendChild(header);
    // render rows of 7
    for (let i=0;i<cells.length;i+=7) {
      grid.appendChild(h("div", { class: "calendar-row" }, ...cells.slice(i, i+7)));
    }

    const page = h("div", { class: "page" }, head, label, grid);
    mount(root, page);
  }

  function navigate(deltaMonths) {
    const d = new Date(anchor);
    d.setMonth(d.getMonth() + deltaMonths);
    const s = loadState();
    s.historyAnchor = d.toISOString();
    // we don’t save to disk here to avoid extra writes; harmless if you prefer
    localStorage.setItem("selftrack_state_v1", JSON.stringify(s));
    render(d);
  }

  render(anchor);
}
