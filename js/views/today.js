import { currentStreak, todayISO } from "../streaks.js";
import { h, card, chip, loadDay, CTRL } from "../ui-helpers.js";
import { loadQuotes } from "../data.js";

export function renderToday(state) {
  const wrap = h("div", { class: "wrap" });

  // Optional welcome banner
  if (state.meta?.welcome) {
    const dismiss = h("button", {
      class: "secondary",
      type: "button",
      onClick: () => {
        CTRL?.clearWelcome();
        window.dispatchEvent(new Event("hashchange"));
      }
    }, "Got it ✕");

    const welcome = h("section", { class: "card card--compact" },
      h("h2", { text: "Welcome 👋" }),
      h("p", { class: "muted" }, "We added a few starter habits so you can see how things work. You can edit or delete them any time on the Habits tab."),
      dismiss
    );
    wrap.append(welcome);
  }

  const iso = todayISO();
  const day = loadDay(state, iso);

  const total = state.habits.length;
  const done = Object.values(day.habits || {}).filter(Boolean).length;

  // Header card
  const header = card("Today",
    h("div", { class: "row", style: "display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;" },
      chip(`${done}/${total} done`),
      chip(total ? `${Math.round((done/total)*100)}%` : "0%", "muted"),
    )
  );
  wrap.append(header);

  // Quotes (non-blocking)
  loadQuotes()
    .then(q => {
      if (!q?.length) return;
      const pick = q[Math.floor(Math.random()*q.length)];
      header.append(
        h("blockquote", { class: "quote" },
          h("p", {}, `“${pick.text}”`),
          h("footer", { class: "muted" }, `— ${pick.author || "Unknown"}`)
        )
      );
    })
    .catch(() => {});

  // Habit checklist
  const list = h("div");
  if (total === 0) {
    list.append(h("p", { class: "placeholder__text" }, "No habits yet. Add a few on the Habits page."));
  } else {
    for (const habit of state.habits) {
      const checked = !!day.habits[habit.id];
      const streak = currentStreak(habit.id, state.days);

      const row = h("label", { class: "row", style: "display:flex;align-items:center;gap:.75rem;margin:.5rem 0;" },
        h("input", {
          type: "checkbox",
          checked,
          onChange: (e) => {
            CTRL?.toggleHabitForToday?.(habit.id, e.target.checked);
            window.dispatchEvent(new Event("hashchange"));
          }
        }),
        h("span", { class: "dot", style: `--c:${habit.color || "#6c8ef5"}` }),
        h("span", { class: "title" }, habit.name),
        h("span", { class: "spacer" }),
        chip(`Streak: ${streak}d`, "muted")
      );
      list.append(row);
    }
  }

  wrap.append(card(null, list));
  return wrap;
}
