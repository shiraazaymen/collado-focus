// ─── TIMER UTILITIES ──────────────────────────────────────────────────────────
// All pure functions — no side effects, fully testable in isolation.
// The epoch-anchored approach here is the fix for setInterval drift:
// instead of trusting "tick every 1000ms" (which degrades in hidden tabs,
// under CPU load, and during device sleep), we record the wall-clock start
// time and compute remaining = startSeconds - elapsed(wall clock) on every
// tick. This makes the timer accurate to within one poll interval (~500ms).

/**
 * Computes remaining seconds from a fixed start epoch.
 *
 * @param {number} startEpoch      - Date.now() captured when timer started
 * @param {number} startSeconds    - seconds remaining when timer started
 * @returns {number}               - current remaining seconds (≥ 0)
 */
export function computeRemaining(startEpoch, startSeconds) {
  const elapsed = Math.floor((Date.now() - startEpoch) / 1000);
  return Math.max(0, startSeconds - elapsed);
}

/**
 * Computes the progress percentage (0–100) for the ring SVG.
 *
 * @param {number} totalSeconds   - full session duration in seconds
 * @param {number} remaining      - seconds left
 * @returns {number}              - 0 = just started, 100 = complete
 */
export function computeProgress(totalSeconds, remaining) {
  if (totalSeconds <= 0) return 0;
  return ((totalSeconds - remaining) / totalSeconds) * 100;
}

/**
 * Determines which mode index comes after the current one completes.
 * Pomodoro rule: every 4th focus session triggers a long break.
 *
 * @param {number} currentModeIdx  - 0=focus, 1=short, 2=long
 * @param {number} completedSessions - sessions completed so far (AFTER incrementing)
 * @returns {number}               - next mode index
 */
export function getNextModeIdx(currentModeIdx, completedSessions) {
  if (currentModeIdx !== 0) return 0; // break → focus
  if (completedSessions % 4 === 0) return 2; // every 4th → long break
  return 1; // otherwise → short break
}

/**
 * Returns the SVG stroke-dashoffset for a progress ring.
 *
 * @param {number} radius   - ring radius in px
 * @param {number} pct      - progress 0–100
 * @returns {{ circumference: number, offset: number }}
 */
export function getRingGeometry(radius, pct) {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return { circumference, offset };
}