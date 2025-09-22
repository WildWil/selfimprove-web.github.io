import { h, mount } from "../ui.js";
import { loadState, saveState } from "../storage.js";
import { isoDate } from "../calendar.js";

export function renderJournal(root) {
  const todayIso = isoDate(new Date());
  const state = loadState();
  const current = state.days[todayIso] || { habits: {}, journal: "" };

  const title = h("h1", { class: "page-title" }, "Journal");

  const area = h("textarea", {
    class: "journal big",
    placeholder: "Write your thoughts…",
    oninput: (e) => {
      const s = loadState();
      const day = s.days[todayIso] || { habits: {}, journal: "" };
      day.journal = e.target.value;
      s.days[todayIso] = day;
      saveState(s);
    }
  }, current.journal || "");
  area.value = current.journal || "";

  mount(root, h("div", { class: "page" }, title, h("div", { class: "card" }, area)));
}
