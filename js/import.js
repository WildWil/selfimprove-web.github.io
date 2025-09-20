// import.js
// v0.1 — read & validate a save key; apply Replace-All import

import { validateSnapshot } from "./validators.js";

/** Read a File -> JSON object. */
export async function readSnapshotFile(file) {
  const text = await file.text();
  const obj = JSON.parse(text);
  const err = validateSnapshot(obj);
  if (err) throw new Error(err);
  return obj;
}

/**
 * Apply a snapshot to storage using Replace-All mode.
 * saveFns: { setUser, setHabits, setDays, setMeta, setVersion }
 */
export function applySnapshotReplaceAll(snapshot, saveFns) {
  saveFns.setUser(snapshot.user);
  saveFns.setHabits(snapshot.habits);
  saveFns.setDays(snapshot.days);
  saveFns.setMeta(snapshot.meta);
  if (snapshot.version) saveFns.setVersion(snapshot.version);
}
