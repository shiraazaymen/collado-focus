import { useState, useEffect, useMemo, useRef } from "react";
import { storageGet, persistSnapshot, debounce } from "../utils/storage";
import { STORAGE_KEYS, DEFAULT_MODES } from "../utils/constants";

// ─── usePersistentPomodoro ────────────────────────────────────────────────────

export function usePersistentPomodoro() {
  const initialValues = useMemo(() => ({
    // Wallpaper
    wallpaper:   storageGet(STORAGE_KEYS.WALLPAPER, "none"),
    customWpUrl: storageGet(STORAGE_KEYS.CUSTOM_WP, ""),
    videoWpUrl:  storageGet(STORAGE_KEYS.VIDEO_WP, ""),
    wpOverlay:   storageGet(STORAGE_KEYS.OVERLAY, 0.55),

    // Timer
    focusDayStartMinutes: Number(storageGet(STORAGE_KEYS.FOCUS_DAY_START, "0")) || 0,

    modes: (() => {
      try {
        const v = storageGet(STORAGE_KEYS.MODES, null);
        return Array.isArray(v) ? v : DEFAULT_MODES;
      } catch {
        return DEFAULT_MODES;
      }
    })(),

    modeIdx: Math.max(
      0,
      Math.min(2, Number(storageGet(STORAGE_KEYS.MODE_IDX, "0")) || 0)
    ),

    seconds: Number(storageGet(STORAGE_KEYS.SECONDS, "0")) || null,
    running: storageGet(STORAGE_KEYS.RUNNING, "0") === "1",
    sessions: Number(storageGet(STORAGE_KEYS.SESSIONS, "0")) || 0,
    cycles: Number(storageGet(STORAGE_KEYS.CYCLES, "0")) || 0,

    log: (() => {
      try {
        const l = storageGet(STORAGE_KEYS.LOG, []);
        return Array.isArray(l) ? l : [];
      } catch {
        return [];
      }
    })(),

    // Epoch anchor
    runStartedAt:
      Number(storageGet(STORAGE_KEYS.RUN_STARTED_AT, "0")) || null,

    runStartedSeconds:
      Number(storageGet(STORAGE_KEYS.RUN_STARTED_SECONDS, "0")) || null,

    // Per-mode remaining
    modeRemaining: (() => {
      try {
        const v = storageGet(STORAGE_KEYS.MODE_REMAINING, {});
        const p = typeof v === "object" && v !== null ? v : {};

        return {
          0: Number(p[0]) || null,
          1: Number(p[1]) || null,
          2: Number(p[2]) || null,
        };
      } catch {
        return { 0: null, 1: null, 2: null };
      }
    })(),
  }), []);

  return { initialValues };
}

// ─── usePersistSnapshot ───────────────────────────────────────────────────────

export function usePersistSnapshot(snapshot) {
  const debouncedPersist = useRef(
    debounce((snap) => persistSnapshot(snap), 350)
  ).current;

  useEffect(() => {
    debouncedPersist(snapshot);
  }, [snapshot, debouncedPersist]);
}

// ─── Generic single-value persistent state ────────────────────────────────────

export function useLocalState(key, fallback) {
  const [value, setValue] = useState(() => storageGet(key, fallback));

  const set = (next) => {
    const resolved = typeof next === "function" ? next(value) : next;
    setValue(resolved);

    try {
      localStorage.setItem(
        key,
        typeof resolved === "object"
          ? JSON.stringify(resolved)
          : String(resolved)
      );
    } catch {
      // ignore quota errors
    }
  };

  return [value, set];
}