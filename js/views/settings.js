import { h, mount, applyTheme, toast } from "../ui.js";
import { loadState, saveState } from "../storage.js";

export function renderSettings(root) {
  let state = loadState();

  function setTheme(mode) {
    state.theme = mode; saveState(state);
    applyTheme(mode);
  }

  const title = h("h1", { class: "page-title" }, "Settings");

  // Theme
  const themeLabel = h("label", {}, "Theme: ");
  const themeSel = h("select", {
    class: "input",
    onChange: e => setTheme(e.target.value)
  },
    h("option", { value: "auto" }, "Auto"),
    h("option", { value: "light" }, "Light"),
    h("option", { value: "dark" }, "Dark"),
  );
  themeSel.value = state.theme || "auto";

  // Start of week (locked to Sunday for now but leave control for later)
  const sow = h("select", {
    class: "input",
    onChange: e => { state.startOfWeek = Number(e.target.value); saveState(state); toast("Start of week saved"); }
  },
    h("option", { value: 0 }, "Sunday"),
    h("option", { value: 1 }, "Monday")
  );
  sow.value = typeof state.startOfWeek === "number" ? state.startOfWeek : 0;

  // Copy / Export
  const copyBtn = h("button", {
    class: "btn",
    onClick: async () => {
      const text = JSON.stringify(loadState());
      await navigator.clipboard.writeText(text);
      toast("Save key copied");
    }
  }, "Copy Save Key");

  // Import
  const file = h("input", { type: "file", accept: "application/json" });
  const importBtn = h("button", {
    class: "btn",
    onClick: async () => {
      const f = file.files?.[0];
      if (!f) return;
      const text = await f.text();
      try {
        const next = JSON.parse(text);
        saveState(next);
        toast("Save key imported");
        location.reload();
      } catch {
        toast("Invalid JSON file");
      }
    }
  }, "Import Save Key");

  const sectionGeneral = h("div", { class: "card" },
    h("div", { class: "card-row" }, themeLabel, themeSel),
    h("div", { class: "card-row" }, h("label", {}, "Start of week: "), sow)
  );
  const sectionData = h("div", { class: "card" },
    h("div", { class: "card-row" }, copyBtn),
    h("div", { class: "card-row" }, file, importBtn)
  );

  mount(root, h("div", { class: "page" }, title, sectionGeneral, sectionData));
}
