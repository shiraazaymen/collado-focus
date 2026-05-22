import React from "react";
import { BTN_BASE } from "../../styles/tokens";

// ─── SessionControls ──────────────────────────────────────────────────────────
// Reset · Play/Pause · Skip controls.
// Isolated so hover/active CSS transforms apply only to buttons,
// not to the timer ring or visualizer above.

const SessionControls = React.memo(function SessionControls({
  running,
  mode,
  accentColor,
  effectiveGlow,
  onToggle,
  onReset,
  onSkip,
}) {
  const activeColor = accentColor || mode.color;

  const iconBtnStyle = {
    ...BTN_BASE,
    width:          46,
    height:         46,
    borderRadius:   14,
    background:     "rgba(255,255,255,.04)",
    border:         "1px solid rgba(255,255,255,.08)",
    color:          "rgba(255,255,255,.4)",
    fontSize:       18,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            14,
        marginTop:      20,
        zIndex:         1,
      }}
    >
      <button
        className="ctrl"
        aria-label="Reset timer"
        onClick={onReset}
        style={iconBtnStyle}
      >
        ↺
      </button>

      <button
        className="ctrl"
        aria-label={running ? "Pause timer" : "Start timer"}
        onClick={onToggle}
        style={{
          ...BTN_BASE,
          width:          72,
          height:         72,
          borderRadius:   "50%",
          background:     running
            ? "rgba(255,255,255,.06)"
            : `linear-gradient(135deg,${activeColor},${activeColor}bb)`,
          border:         `2px solid ${running ? "rgba(255,255,255,.12)" : activeColor}`,
          color:          running ? activeColor : "#000",
          fontSize:       22,
          fontWeight:     700,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          boxShadow:      running ? "none" : `0 0 28px ${effectiveGlow}`,
          transition:     "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        {running ? "⏸" : "▶"}
      </button>

      <button
        className="ctrl"
        aria-label="Skip to next mode"
        onClick={onSkip}
        style={iconBtnStyle}
      >
        ⏭
      </button>
    </div>
  );
});

export default SessionControls;