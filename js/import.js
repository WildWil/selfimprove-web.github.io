// import.js — v0.2 file or key -> validated snapshot -> replace-all
import { validateSnapshot } from "./validators.js";

/** File -> JSON object (validated) */
export async function readSnapshotFile(file) {
  const text = await file.text();
  const obj = JSON.parse(text);
  const err = validateSnapshot(obj);
  if (err) throw new Error(err);
  return obj;
}

/** Save Key string -> JSON object (validated) */
export function readSnapshotFromKey(keyStr) {
  const json = decodeURIComponent(escape(atob(keyStr.trim())));
  const obj = JSON.parse(json);
  const err = validateSnapshot(obj);
  if (err) throw new Error(err);
  return obj;
}

/** Replace-all import into state via provided setters */
export function applySnapshotReplaceAll(snapshot, saveFns) {
  saveFns.setUser(snapshot.user);
  saveFns.setHabits(snapshot.habits);
  saveFns.setDays(snapshot.days);
  saveFns.setMeta(snapshot.meta);
  if (snapshot.version) saveFns.setVersion(snapshot.version);
}
