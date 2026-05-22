import React from "react";
import { BTN_BASE } from "../../styles/tokens";

// ─── ModeSelector ─────────────────────────────────────────────────────────────
// Renders the Focus / Short Break / Long Break tab strip.
// Extracted from the parent to prevent the mode tabs from re-rendering
// every second when the timer ticks (they have no dependency on `seconds`).

const ModeSelector = React.memo(function ModeSelector({
  modes,
  activeIdx,
  accentColor,
  onSwitch,
}) {
  return (
    <div
      className="fu"
      style={{
        display:        "flex",
        gap:            8,
        justifyContent: "center",
        marginBottom:   28,
        flexWrap:       "wrap",
      }}
    >
      {modes.map((m, i) => {
        const isActive = activeIdx === i;
        const color    = isActive ? (accentColor || m.color) : "rgba(255,255,255,.3)";

        return (
          <button
            key={m.key}
            className="mode-tab"
            aria-pressed={isActive}
            onClick={() => onSwitch(i)}
            style={{
              ...BTN_BASE,
              padding:      "8px 20px",
              borderRadius: 20,
              fontSize:     12,
              fontWeight:   700,
              background:   isActive ? (accentColor ? `${accentColor}18` : m.pill) : "rgba(255,255,255,.03)",
              color,
              border:       `1px solid ${isActive ? (accentColor ? `${accentColor}44` : m.border) : "rgba(255,255,255,.07)"}`,
              boxShadow:    isActive ? `0 0 16px ${accentColor ? `${accentColor}44` : m.glow}` : "none",
              transition:   "background 0.4s ease, color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
            }}
          >
            {m.label}
            <span
              style={{
                fontSize:   10,
                marginLeft: 6,
                color:      isActive ? `${accentColor || m.color}99` : "rgba(255,255,255,.2)",
              }}
            >
              {m.minutes}m
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default ModeSelector;