// export.js
// v0.1 — build and download a JSON save key

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "-" +
    pad(d.getHours()) +
    pad(d.getMinutes())
  );
}

/** Build a snapshot suitable for export (pure data only). */
export function buildSnapshot(state) {
  return {
    __type: "selftrack.save",
    version: state.version || "0.1.0",
    exportedAt: Date.now(),
    user: state.user,
    habits: state.habits,
    days: state.days,
    meta: state.meta,
  };
}

/** Trigger a file download with the snapshot. */
export function downloadSnapshot(snapshot) {
  const filename = `SelfTrack-${timestamp()}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
