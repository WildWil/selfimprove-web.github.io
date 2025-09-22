// onboarding.js — seed defaults on first run

function makeId() {
  return `h_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_HABITS = [
  { name: "Read 10 pages", icon: "📖" },
  { name: "Workout",       icon: "🏋️" },
  { name: "Meditate 10m",  icon: "🧘" },
];

export function runOnboardingIfNeeded(getState, saveState) {
  const state = getState();
  const alreadyOnboarded = !!state?.meta?.onboarded;
  const hasHabits = Array.isArray(state?.habits) && state.habits.length > 0;

  if (alreadyOnboarded || hasHabits) return false;

  // Seed default habits
  const seeded = DEFAULT_HABITS.map(h => ({
    id: makeId(),
    name: h.name,
    icon: h.icon,
    targetDays: [0,1,2,3,4,5,6],
    strict: false,
    createdAt: Date.now(),
  }));

  const meta = {
    ...(state.meta || {}),
    onboarded: true,
    welcome: true,               // show a small welcome banner
    installDate: state.meta?.installDate || Date.now(),
  };

  saveState({ habits: seeded, meta });
  return true;
}
