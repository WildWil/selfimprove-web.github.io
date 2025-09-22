import { ymd, startOfCalendar, endOfCalendar } from "../calendar.js";
import { h, card, chip, showPopover, hidePopover, openDetail, closeDetail } from "../ui-helpers.js";

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

  wrap.append(
    h("div", { class: "row", style: "justify-content:space-between;align-items:center;" },
      prevBtn, h("h1", { text: "History — Calendar" }), nextBtn
    ),
    label
  );

  function renderMonth(){
    const today = new Date();
    const anchor = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const start = startOfCalendar(anchor);
    const end   = endOfCalendar(anchor);

    label.textContent = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    const grid = h("div", { class: "cal" },
      h("div", { class: "cal__head" },
        ...["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => h("div", { class: "cal__head__cell" }, d))
      )
    );

    const row = h("div", { class: "cal__row" });
    let day = new Date(start);

    while (day <= end) {
      const iso = ymd(day);
      const inMonth = day.getMonth() === anchor.getMonth();
      const num = day.getDate();

      const pct = pctFor(iso);

      const cell = h("button", {
        class: `cal__cell ${inMonth ? "" : "cal__cell--dim"}`,
        type: "button",
        onClick: () => openDetail(detailFor(iso)),
        onMouseenter: (e) => {
          const pop = h("div", {},
            h("strong", {}, iso),
            h("div", { class: "muted" }, `${pct}% complete`)
          );
          const p = showPopover(e.currentTarget, pop);
          cell._pop = p;
        },
        onMouseleave: () => { hidePopover(cell._pop); cell._pop = null; }
      },
        h("div", { class: "cal__num" }, String(num)),
        h("div", { class: "cal__bar" }, h("span", { style: `width:${pct}%;` }))
      );

      row.append(cell);

      if (day.getDay() === 6) {  // Sat → new row
        grid.append(row.cloneNode(false));
        while (row.firstChild) grid.lastChild.append(row.firstChild);
      }

      day.setDate(day.getDate() + 1);
    }

    // trailing row if needed
    if (row.childNodes.length) grid.append(row);

    // replace grid in wrap
    const old = wrap.querySelector(".cal");
    if (old) old.replaceWith(grid);
    else wrap.append(card(null, grid));
  }

  function detailFor(iso){
    const day = state.days[iso] || { habits:{} };
    const items = Object.values(state.habits).map(hb => {
      const ok = !!day.habits[hb.id];
      return h("div", { class: "row", style:"align-items:center;gap:.75rem;" },
        h("span", { class: "dot", style: `--c:${hb.color || "#6c8ef5"}` }),
        h("span", { class: ok ? "title" : "muted" }, hb.name),
        h("span", { class: "spacer" }),
        ok ? chip("✓", "ok") : chip("–", "muted")
      );
    });

    return h("div", {},
      h("div", { class: "row", style:"justify-content:space-between;align-items:center;" },
        h("h3", { text: iso }),
        h("button", { class: "secondary", type:"button", onClick: closeDetail }, "Close ✕")
      ),
      ...items
    );
  }

  renderMonth();
  return wrap;
}
