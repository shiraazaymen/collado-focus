import { useMemo } from "react";

// ─── useSessionStats ──────────────────────────────────────────────────────────
// Derives display-ready statistics from timer state.
// Keeping derivation here rather than inline in the component prevents
// the stats calculation from re-running on every timer tick — it only
// recomputes when sessions or focusMinutes actually change.

/**
 * @param {object} opts
 * @param {number} opts.sessions       - completed focus sessions count
 * @param {number} opts.cycles         - completed full cycles (4 sessions)
 * @param {number} opts.focusMinutes   - minutes per focus session (modes[0].minutes)
 * @returns {{ stats: object[] }}
 */
export function useSessionStats({ sessions, cycles, focusMinutes }) {
  const stats = useMemo(() => [
    {
      label: "Sessions",
      val:   sessions,
      color: "#34d399",
      glow:  "rgba(52,211,153,.2)",
    },
    {
      label: "Full Cycles",
      val:   cycles,
      color: "#a78bfa",
      glow:  "rgba(167,139,250,.2)",
    },
    {
      label: "Focus Time",
      val:   `${sessions * focusMinutes}m`,
      color: "#60a5fa",
      glow:  "rgba(96,165,250,.2)",
    },
  ], [sessions, cycles, focusMinutes]);

  return { stats };
}