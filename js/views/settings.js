import { h, card, fieldRow, CTRL } from "../ui-helpers.js";

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

  // Start of week selector (even though calendar currently locks to Sunday)
  const sow = h("select", { class: "input" },
    h("option", { value: 0, text: "Sunday" }),
    h("option", { value: 1, text: "Monday" }),
  );
  sow.value = typeof state.user?.startOfWeek === "number" ? state.user.startOfWeek : 0;
  sow.addEventListener("change", () => CTRL?.updateUser?.({ startOfWeek: Number(sow.value) }));

  cardPrefs.append(fieldRow("Start of week:", sow));

  // Export / Import
  const copyBtn = h("button", { class: "btn", type: "button",
    onClick: async () => {
      const key = CTRL?.getSaveKey?.();
      await navigator.clipboard.writeText(key);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy Save Key"), 1200);
    }
  }, "Copy Save Key");

  const file = h("input", { type: "file", accept: "application/json" });
  const importBtn = h("button", { class: "btn", type: "button",
    onClick: async () => { if (file.files?.[0]) await CTRL?.importFromFile?.(file.files[0]); }
  }, "Import Save Key");

  const dataCard = card("Data",
    h("div", { class: "row", style: "gap:.75rem;align-items:center;flex-wrap:wrap;" }, copyBtn, file, importBtn)
  );

  wrap.append(cardPrefs, dataCard, h("p", { class: "muted mono", style: "margin-top:1rem;" }, `${version} • All data stays on this device.`));
  return wrap;
}
