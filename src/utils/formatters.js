// ─── DISPLAY FORMATTERS ───────────────────────────────────────────────────────
// Pure functions with zero side effects — safe to call anywhere.

export function formatTime(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatMinutesLeft(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  return `${Math.ceil(safeSeconds / 60)} min left`;
}

export function formatLogTime(date = new Date()) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimerAriaLabel(totalSeconds = 0, modeLabel = "timer") {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;

  return `${m} minutes ${s} seconds remaining in ${modeLabel}`;
}