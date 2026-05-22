// ─── STORAGE UTILITIES ────────────────────────────────────────────────────────
// Centralizes all localStorage access so:
//   1. parse errors never crash the app (try/catch everywhere)
//   2. debounce prevents write storms when multiple state slices change together
//   3. future migration to IndexedDB / cloud sync only requires touching this file

/**
 * Safely reads a value from localStorage.
 * Returns `fallback` if the key is missing or JSON.parse fails.
 *
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    // If fallback is a string we stored it as-is; otherwise parse JSON.
    return typeof fallback === "string" ? raw : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Safely writes a value to localStorage.
 * Objects/arrays are JSON-serialized; primitives stored as strings.
 *
 * @param {string} key
 * @param {unknown} value
 */
export function storageSet(key, value) {
  try {
    const serialized =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, serialized);
  } catch {
    // Storage quota exceeded or private-mode restriction — fail silently.
  }
}

/**
 * Removes a key from localStorage.
 * @param {string} key
 */
export function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ─── DEBOUNCE ─────────────────────────────────────────────────────────────────
// Used to batch localStorage writes when multiple state values update together
// (e.g. switchMode changes modeIdx + seconds in the same event loop tick).

/**
 * Returns a debounced version of `fn` that delays execution by `ms`.
 * The timer resets on every call within the delay window.
 *
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Persists a snapshot object to localStorage in one batched write.
 * Keys in the snapshot map directly to localStorage keys.
 *
 * @param {Record<string, unknown>} snapshot  { [lsKey]: value }
 */
export function persistSnapshot(snapshot) {
  Object.entries(snapshot).forEach(([key, value]) => storageSet(key, value));
}