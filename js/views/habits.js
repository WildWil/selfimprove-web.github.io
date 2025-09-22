import { h, mount } from "../ui.js";
import { loadState, saveState } from "../storage.js";

export function renderHabits(root) {
  let state = loadState();

  function addHabit(name) {
    const id = "h_" + Math.random().toString(36).slice(2, 9);
    state.habits[id] = { id, name, color: pickColor() };
    saveState(state);
    render();
  }

  function deleteHabit(id) {
    // remove from habit list
    delete state.habits[id];
    // remove any per-day checks for this habit
    for (const iso in state.days) {
      if (state.days[iso]?.habits) delete state.days[iso].habits[id];
    }
    saveState(state);
    render();
  }

  function updateHabitName(id, name) {
    state.habits[id].name = name;
    saveState(state);
  }

  function updateHabitColor(id, color) {
    state.habits[id].color = color;
    saveState(state);
  }

  function render() {
    state = loadState();

    const title = h("h1", { class: "page-title" }, "Habits");
    const addRow = h("div", { class: "row" },
      h("input", { id: "newHabit", class: "input", placeholder: "New habit name…" }),
      h("button", {
        class: "btn",
        onClick: () => {
          const input = document.getElementById("newHabit");
          const v = (input.value || "").trim();
          if (!v) return;
          addHabit(v);
          input.value = "";
        }
      }, "Add Habit")
    );

    const list = h("div", { class: "card-list" });
    for (const habit of Object.values(state.habits)) {
      const nameInput = h("input", {
        class: "input",
        value: habit.name,
        oninput: e => updateHabitName(habit.id, e.target.value)
      });
      const colorInput = h("input", {
        type: "color",
        value: habit.color || "#6c8ef5",
        oninput: e => updateHabitColor(habit.id, e.target.value)
      });
      const delBtn = h("button", { class: "btn danger", onClick: () => deleteHabit(habit.id) }, "Delete");

      const row = h("div", { class: "card" },
        h("div", { class: "card-row" },
          h("span", { class: "dot", style: `background:${habit.color || "#6c8ef5"}` }),
          nameInput,
          h("span", { class: "spacer" }),
          colorInput,
          delBtn
        )
      );
      list.appendChild(row);
    }

    mount(root, h("div", { class: "page" }, title, addRow, list));
  }

  render();
}

function pickColor() {
  const palette = ["#6c8ef5","#5ac8fa","#34c759","#ff9f0a","#ff375f","#bf5af2","#f2c94c","#9b59b6"];
  return palette[Math.floor(Math.random()*palette.length)];
}
