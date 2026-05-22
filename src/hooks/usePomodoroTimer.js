import { useState, useEffect, useRef, useCallback } from "react";
import { computeRemaining, getNextModeIdx } from "../utils/timerUtils";
import { formatLogTime }                     from "../utils/formatters";
import { DEFAULT_MODES, STORAGE_KEYS }       from "../utils/constants";

// Direct LS write — bypasses debounce for epoch anchor only.
// This is intentional: epoch values must be written immediately
// when the timer starts so remount can always recover accurately.
function writeEpochToLS(startedAt, startedSeconds) {
  try {
    localStorage.setItem(STORAGE_KEYS.RUN_STARTED_AT,      String(startedAt));
    localStorage.setItem(STORAGE_KEYS.RUN_STARTED_SECONDS, String(startedSeconds));
    localStorage.setItem(STORAGE_KEYS.RUNNING,              "1");
  } catch {}
}

function clearEpochFromLS() {
  try {
    localStorage.setItem(STORAGE_KEYS.RUNNING, "0");
    localStorage.setItem(STORAGE_KEYS.RUN_STARTED_AT,      "0");
    localStorage.setItem(STORAGE_KEYS.RUN_STARTED_SECONDS, "0");
  } catch {}
}

export function usePomodoroTimer({
  initialModes   = DEFAULT_MODES,
  initialModeIdx = 0,
  initialValues  = null,
} = {}) {

  // ── Per-mode remaining init ──────────────────────────────────────────────
  const initModeRemaining = () => {
    const mr = initialValues?.modeRemaining ?? {};
    return {
      0: Number(mr[0]) || null,
      1: Number(mr[1]) || null,
      2: Number(mr[2]) || null,
    };
  };

  // ── Resolve initial seconds (the critical fix) ───────────────────────────
  // Only use epoch math if BOTH runStartedAt AND runStartedSeconds are valid
  // AND running was true. Never use Date.now() as a fallback for the anchor.
  const resolveInitialSeconds = () => {
    const mr  = initModeRemaining();
    const idx = initialModeIdx;
    const wasRunning   = initialValues?.running === true;
    const startedAt    = Number(initialValues?.runStartedAt)      || 0;
    const startedSecs  = Number(initialValues?.runStartedSeconds) || 0;

    if (wasRunning && startedAt > 0 && startedSecs > 0) {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      return Math.max(0, startedSecs - elapsed);
    }

    // Not running: use saved seconds for this mode
    const saved = mr[idx];
    if (saved != null && saved > 0) return saved;

    // Fresh: full duration
    return initialModes[idx]?.minutes * 60 ?? 1500;
  };

  // ── State ────────────────────────────────────────────────────────────────
  const [modes,         setModes]         = useState(initialModes);
  const [modeIdx,       setModeIdx]       = useState(initialModeIdx);
  const [seconds,       setSeconds]       = useState(resolveInitialSeconds);
  const [running,       setRunning]       = useState(() => {
    // Only resume if epoch anchor is valid and time remains
    const wasRunning  = initialValues?.running === true;
    const startedAt   = Number(initialValues?.runStartedAt)      || 0;
    const startedSecs = Number(initialValues?.runStartedSeconds) || 0;
    if (!wasRunning || startedAt === 0 || startedSecs === 0) return false;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return elapsed < startedSecs;
  });
  const [sessions,      setSessions]      = useState(initialValues?.sessions ?? 0);
  const [cycles,        setCycles]        = useState(initialValues?.cycles   ?? 0);
  const [log,           setLog]           = useState(initialValues?.log      ?? []);
  const [modeRemaining, setModeRemaining] = useState(initModeRemaining);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const intervalRef = useRef(null);

  // Epoch anchor — set ONCE when timer starts, read on every tick and remount.
  // Pre-populate from storage if restoring a running timer.
  const startedAtRef   = useRef(() => {
    const wasRunning = initialValues?.running === true;
    const at = Number(initialValues?.runStartedAt) || 0;
    return (wasRunning && at > 0) ? at : null;
  });
  const startedSecsRef = useRef(() => {
    const wasRunning = initialValues?.running === true;
    const s = Number(initialValues?.runStartedSeconds) || 0;
    return (wasRunning && s > 0) ? s : null;
  });

  // Fix: useRef initial value must not be a function — unwrap immediately
  if (typeof startedAtRef.current === "function")   startedAtRef.current   = startedAtRef.current();
  if (typeof startedSecsRef.current === "function") startedSecsRef.current = startedSecsRef.current();

  // Stale-closure mirrors
  const sessionsRef = useRef(sessions);
  const cyclesRef   = useRef(cycles);
  const modesRef    = useRef(modes);
  const modeIdxRef  = useRef(modeIdx);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { cyclesRef.current   = cycles;   }, [cycles]);
  useEffect(() => { modesRef.current    = modes;    }, [modes]);
  useEffect(() => { modeIdxRef.current  = modeIdx;  }, [modeIdx]);

  // ── Internal mode switch ─────────────────────────────────────────────────
  const _switchMode = useCallback((nextIdx, currentModes, forceReset = false) => {
    clearInterval(intervalRef.current);
    clearEpochFromLS();

    const curIdx = modeIdxRef.current;

    // Save current mode's remaining seconds before leaving
    setSeconds(curSec => {
      setModeRemaining(prev => ({ ...prev, [curIdx]: curSec }));
      return curSec;
    });

    startedAtRef.current   = null;
    startedSecsRef.current = null;

    setModeIdx(nextIdx);
    setRunning(false);

    if (forceReset) {
      const full = currentModes[nextIdx].minutes * 60;
      setSeconds(full);
      setModeRemaining(prev => ({ ...prev, [nextIdx]: full }));
    } else {
      setModeRemaining(prev => {
        const saved    = prev[nextIdx];
        const resolved = (saved != null && saved > 0)
          ? saved
          : currentModes[nextIdx].minutes * 60;
        setSeconds(resolved);
        return prev;
      });
    }
  }, []);

  // ── Complete handler ──────────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    const now         = formatLogTime();
    const curModeIdx  = modeIdxRef.current;
    const curSessions = sessionsRef.current;
    const curCycles   = cyclesRef.current;
    const curModes    = modesRef.current;

    if (curModeIdx === 0) {
      const newSessions = curSessions + 1;
      setSessions(newSessions);
      setLog(prev => [{
        id:          `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        mode:        "focus",
        label:       "Focus",
        subject:     "",
        seconds:     curModes[0].minutes * 60,
        completedAt: Date.now(),
      }, ...prev].slice(0, 20));
      const nextIdx = getNextModeIdx(0, newSessions);
      if (nextIdx === 2) setCycles(curCycles + 1);
      _switchMode(nextIdx, curModes, true);
    } else {
      setLog(prev => [`☕ Break ended — ${now}`, ...prev].slice(0, 20));
      _switchMode(0, curModes, true);
    }
  }, [_switchMode]);

  // ── Timer loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }

    // If restoring from mount, startedAtRef is already set.
    // If fresh start, it was set in start(). Never re-anchor here.
    if (!startedAtRef.current || !startedSecsRef.current) {
      // Defensive: shouldn't happen, but don't start a broken timer
      clearEpochFromLS();
      setRunning(false);
      return;
    }

    intervalRef.current = setInterval(() => {
      const remaining = computeRemaining(startedAtRef.current, startedSecsRef.current);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        setSeconds(0);
        handleComplete();
      } else {
        setSeconds(remaining);
      }
    }, 500);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, modeIdx]);

  // ── Tab visibility resync ─────────────────────────────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && running && startedAtRef.current && startedSecsRef.current) {
        const remaining = computeRemaining(startedAtRef.current, startedSecsRef.current);
        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setSeconds(0);
          handleComplete();
        } else {
          setSeconds(remaining);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [running, handleComplete]);

  // ── Public API ────────────────────────────────────────────────────────────
  const mode  = modes[modeIdx];
  const total = mode.minutes * 60;

  const start = useCallback(() => {
    const now = Date.now();
    startedAtRef.current   = now;
    startedSecsRef.current = seconds;
    writeEpochToLS(now, seconds); // immediate write — bypasses debounce
    setRunning(true);
  }, [seconds]);

  const pause = useCallback(() => {
    // Compute accurate remaining before clearing anchor
    if (startedAtRef.current && startedSecsRef.current) {
      const remaining = computeRemaining(startedAtRef.current, startedSecsRef.current);
      setSeconds(remaining);
      setModeRemaining(prev => ({ ...prev, [modeIdxRef.current]: remaining }));
    }
    startedAtRef.current   = null;
    startedSecsRef.current = null;
    clearEpochFromLS();
    setRunning(false);
  }, []);

  const toggle = useCallback(() => {
    if (running) pause(); else start();
  }, [running, start, pause]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    startedAtRef.current   = null;
    startedSecsRef.current = null;
    clearEpochFromLS();
    const full = modes[modeIdx].minutes * 60;
    setRunning(false);
    setSeconds(full);
    setModeRemaining(prev => ({ ...prev, [modeIdx]: full }));
  }, [modes, modeIdx]);

  const skip = useCallback(() => {
    _switchMode(modeIdx === 0 ? 1 : 0, modes, true);
  }, [modeIdx, modes, _switchMode]);

  const switchMode = useCallback((idx) => {
    if (idx === modeIdxRef.current) return;
    _switchMode(idx, modes, false);
  }, [modes, _switchMode]);

  const saveSettings = useCallback((editVals) => {
    const updated = [
      { ...modes[0], minutes: Math.max(1, Math.min(90, Number(editVals.focus))) },
      { ...modes[1], minutes: Math.max(1, Math.min(30, Number(editVals.short))) },
      { ...modes[2], minutes: Math.max(1, Math.min(60, Number(editVals.long)))  },
    ];
    clearInterval(intervalRef.current);
    startedAtRef.current   = null;
    startedSecsRef.current = null;
    clearEpochFromLS();
    setModes(updated);
    setModeRemaining({ 0: null, 1: null, 2: null });
    setSeconds(updated[modeIdx].minutes * 60);
    setRunning(false);
  }, [modes, modeIdx]);

  const editSessionLabel = useCallback((id, subject) => {
    setLog(prev => prev.map(entry => {
      if (typeof entry === "string") return entry;   // legacy guard
      if (entry.id !== id) return entry;
      return { ...entry, subject: subject.trim() };
    }));
  }, []);

  return {
    modes, modeIdx, seconds, running, sessions, cycles, log, mode,
    modeRemaining,
    total,
    toggle, start, pause, reset, skip, switchMode, saveSettings,
    editSessionLabel,
  };
}