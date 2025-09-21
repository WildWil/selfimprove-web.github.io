// /js/onboarding.js
export function isFirstRun(state) {
  return !state.meta?.lastOpenDate && (state.habits?.length ?? 0) === 0;
}

export function sampleHabits() {
  return [
    'Read 10 minutes',
    'Walk 15 minutes',
    'Write 3 sentences'
  ];
}
