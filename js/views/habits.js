import { h, card, chip, CTRL } from "../ui-helpers.js";

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
    CTRL?.addHabit?.(name);
    form.reset();
    window.dispatchEvent(new Event("hashchange"));
  });

  const list = h("div");
  for (const hb of state.habits) {
    const color = hb.color || "#6c8ef5";
    const row = h("div", { class: "row", style: "align-items:center;gap:.75rem;margin:.5rem 0;" },
      h("span", { class: "dot", style: `--c:${color}` }),
      h("input", {
        class: "input",
        type: "text",
        value: hb.name,
        onChange: (e) => {
          const name = e.target.value || "";
          const s = CTRL?.getState?.();
          const next = s.habits.map(hx => hx.id === hb.id ? { ...hx, name } : hx);
          CTRL?.addHabit && CTRL?.deleteHabit; // keep tree-shaking calm
          // quick update
          localStorage.setItem("selftrack:habits", JSON.stringify(next));
        },
        style: "flex:1;min-width:200px;"
      }),
      h("button", { class: "danger", type: "button", onClick: () => { CTRL?.deleteHabit?.(hb.id); window.dispatchEvent(new Event('hashchange')); } }, "Delete")
    );
    list.append(row);
  }

  wrap.append(card("Habits", form, list));
  return wrap;
}
