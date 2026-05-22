import React from "react";
import { glassCardStyle } from "../../styles/tokens";
import { useSessionStats } from "../../hooks/useSessionStats";

// ─── StatsPanel ───────────────────────────────────────────────────────────────
// Three stat cards: Sessions, Full Cycles, Focus Time.
// Memoized so it only re-renders when sessions/cycles/focusMinutes change —
// not on every timer tick.

const StatsPanel = React.memo(function StatsPanel({
  sessions,
  cycles,
  focusMinutes,
  hasBg,
  wpOverlay,
}) {
  const { stats } = useSessionStats({ sessions, cycles, focusMinutes });
  const baseCard  = glassCardStyle(hasBg, wpOverlay);

  return (
    <div
      className="fu fu2"
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap:                 10,
        marginBottom:        12,
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            ...baseCard,
            padding:    "16px 12px",
            textAlign:  "center",
            marginBottom: 0,
            position:   "relative",
            overflow:   "hidden",
          }}
        >
          {/* Radial glow at top */}
          <div
            aria-hidden="true"
            style={{
              position:     "absolute",
              inset:        0,
              borderRadius: 20,
              background:   `radial-gradient(circle at 50% 0%,${stat.glow} 0%,transparent 70%)`,
              pointerEvents:"none",
            }}
          />

          <p
            style={{
              fontSize:      "clamp(22px,6vw,32px)",
              fontWeight:    900,
              letterSpacing: "-1px",
              color:         stat.color,
              textShadow:    `0 0 24px ${stat.color}55`,
              marginBottom:  5,
              position:      "relative",
            }}
          >
            {stat.val}
          </p>

          <p
            style={{
              fontSize:      10,
              fontWeight:    700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color:         "rgba(255,255,255,.22)",
              position:      "relative",
            }}
          >
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
});

export default StatsPanel;