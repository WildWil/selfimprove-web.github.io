// export.js — v0.2 file download + compact “Save Key”
function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Build a normalized snapshot from full app state */
export function buildSnapshot(state) {
  return {
    __type: "selftrack.save",
    version: state.version ?? "0.1.0",
    user: state.user ?? { profiles: [{ id: "default", name: "Me", active: true }] },
    habits: state.habits ?? [],
    days: state.days ?? {},   // map YYYY-MM-DD -> { habits: {id: val}, journal: "..." }
    meta: state.meta ?? { createdAt: Date.now(), updatedAt: Date.now() }
  };
}

/** Download a JSON file */
export function downloadSnapshot(snapshot) {
  const filename = `SelfTrack-${timestamp()}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Encode compact Save Key (base64 of UTF-8 JSON) */
export function encodeSaveKey(snapshot) {
  const json = JSON.stringify(snapshot);
  // minimal size without external libs
  return btoa(unescape(encodeURIComponent(json)));
}
