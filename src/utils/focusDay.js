/**
 * Calculates the start and end timestamps of the focus day containing the given date.
 * A focus day is a 24-hour window starting at a custom minute offset from midnight.
 *
 * @param {Date|number|string} date - The date to check
 * @param {number} focusDayStartMinutes - Minutes from midnight when the focus day starts
 * @returns {{ start: number, end: number }} Timestamps representing the bounds
 */
export function getFocusDayBounds(date = new Date(), focusDayStartMinutes = 0) {
  const d = new Date(date);

  // Calculate midnight of the calendar day of `d`
  const startToday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  startToday.setMinutes(focusDayStartMinutes);

  let start, end;
  if (d.getTime() < startToday.getTime()) {
    // If before the start of today's focus day, it belongs to yesterday's focus day
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    start.setMinutes(focusDayStartMinutes);
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    end.setMinutes(focusDayStartMinutes);
  } else {
    // Otherwise it belongs to today's focus day
    start = startToday;
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    end.setMinutes(focusDayStartMinutes);
  }

  return {
    start: start.getTime(),
    end: end.getTime(),
  };
}

/**
 * Checks if a session completion timestamp falls within the focus day bounds.
 *
 * @param {number} completedAt - Session completion timestamp
 * @param {{ start: number, end: number }} bounds - Focus day bounds
 * @returns {boolean}
 */
export function isSessionInFocusDay(completedAt, bounds) {
  if (!completedAt || !bounds) return false;
  const time = typeof completedAt === "number" ? completedAt : new Date(completedAt).getTime();
  return time >= bounds.start && time < bounds.end;
}

/**
 * Parses a time input string ("HH:MM") into minutes from midnight.
 *
 * @param {string} timeString - Time input string
 * @returns {number} Minutes from midnight
 */
export function parseTimeInputToMinutes(timeString) {
  if (!timeString || typeof timeString !== "string") return 0;
  const [hours, minutes] = timeString.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight into a time input string ("HH:MM").
 *
 * @param {number} minutes - Minutes from midnight
 * @returns {string} Time input string ("HH:MM")
 */
export function formatMinutesToTimeInput(minutes) {
  const safeMinutes = Math.max(0, Math.floor(Number(minutes) || 0)) % 1440;
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
