// validators.js
// v0.1 — minimal schema guards for import

export function isPlainObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

export function validateSnapshot(obj) {
  if (!isPlainObject(obj)) return "File is not a JSON object.";
  if (obj.__type !== "selftrack.save") return "Not a SelfTrack save file.";
  if (!("user" in obj) || !("habits" in obj) || !("days" in obj) || !("meta" in obj)) {
    return "Missing required keys (user, habits, days, meta).";
  }
  if (!Array.isArray(obj.habits)) return "habits must be an array.";
  if (!isPlainObject(obj.days)) return "days must be an object map.";
  if (!isPlainObject(obj.user)) return "user must be an object.";
  if (!isPlainObject(obj.meta)) return "meta must be an object.";
  return null; // ok
}
