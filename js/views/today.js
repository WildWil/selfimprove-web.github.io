import { h, mount, toast } from "../ui.js";
import { loadState, saveState } from "../storage.js";
import { isoDate } from "../calendar.js";

export function renderToday(root) {
  const state = loadState();
  const todayIso = isoDate(new Date());
  const day = state.days[todayIso] || { habits: {}, journal: "" };

  const title = h("h1", { class: "page-title" }, "Today");
  const list = h("div", { class: "card-list" });

  // Habits checklist
  const habitCards = Object.values(state.habits).map(habit => {
    const checked = !!day.habits[habit.id];
    const checkbox = h("input", {
      type: "checkbox",
      checked: checked ? true : false,
      onChange: (e) => {
        const s = loadState();
        const d = s.days[todayIso] || { habits: {}, journal: "" };
        d.habits[habit.id] = e.target.checked;
        s.days[todayIso] = d;
        saveState(s);
      }
    });

    return h("div", { class: "card" },
      h("div", { class: "card-row" },
        h("span", { class: "dot", style: `background:${habit.color || "#6c8ef5"}` }),
        h("span", { class: "card-title" }, habit.name),
        h("span", { class: "spacer" }),
        checkbox
      )
    );
  });

  // Journal box
  const journal = h("textarea", {
    class: "journal",
    placeholder: "Quick journal for today…",
    oninput: (e) => {
      const s = loadState();
      const d = s.days[todayIso] || { habits: {}, journal: "" };
      d.journal = e.target.value;
      s.days[todayIso] = d;
      saveState(s);
    }
  }, day.journal || "");
  journal.value = day.journal || "";

  const exportBtn = h("button", {
    class: "btn",
    onClick: async () => {
      const text = JSON.stringify(loadState());
      await navigator.clipboard.writeText(text);
      toast("Save key copied");
    }
  }, "Copy Save Key");

  habitCards.forEach(c => list.appendChild(c));
  const wrap = h("div", { class: "page" }, title, list, h("div", { class: "card" }, journal), exportBtn);
  mount(root, wrap);
}
