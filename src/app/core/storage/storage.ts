// Safe access to localStorage. Every read and write can throw: storage is blocked in some
// private modes and by site-data settings, and writes fail when the quota is full. Progress
// is only ever a convenience here, so failures fall back to defaults instead of breaking a page.

/** Raw string value, or `null` when missing or storage is unavailable. */
export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Stores a string; returns false when storage is unavailable or full. */
export function writeString(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parsed JSON value, or `fallback` when missing, unparsable, unavailable, or rejected by
 * `isValid` (stored data may come from an older version or a hand-edited backup).
 */
export function readJson<T>(key: string, fallback: T, isValid?: (value: unknown) => boolean): T {
  const raw = readString(key);
  if (raw === null) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (value === null || value === undefined) return fallback;
    return !isValid || isValid(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Stores a value as JSON; returns false when storage is unavailable or full. */
export function writeJson(key: string, value: unknown): boolean {
  return writeString(key, JSON.stringify(value));
}

/** Plain object (not an array or null). */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Array of strings, e.g. saved question ids. Non-string entries are dropped. */
export function readStringList(key: string): string[] {
  const list = readJson<unknown[]>(key, [], Array.isArray);
  return list.filter((v): v is string => typeof v === 'string');
}
