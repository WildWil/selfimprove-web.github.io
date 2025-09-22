import { h, card, loadDay, CTRL } from "../ui-helpers.js";
import { ymd } from "../calendar.js";

export function renderJournal(state){
  const wrap = h("div", { class: "wrap" });

  const iso = ymd(new Date());
  const day = loadDay(state, iso);

  const area = h("textarea", {
    class: "input",
    placeholder: "Write your thoughts…",
    rows: 8,
    value: day.journal || "",
    onInput: (e) => {
      CTRL?.setJournalForDate?.(iso, e.target.value);
    }
  });

  wrap.append(card("Journal", area));
  return wrap;
}
