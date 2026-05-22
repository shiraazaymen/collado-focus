import React, { useMemo } from "react";
import TimerRing        from "./TimerRing";
import Visualizer       from "./Visualizer";
import SessionControls  from "./SessionControls";
import { formatTime, formatTimerAriaLabel, formatMinutesLeft } from "../../utils/formatters";
import { computeProgress }   from "../../utils/timerUtils";
import { glassCardStyle, SPACING } from "../../styles/tokens";

// ─── Timer ────────────────────────────────────────────────────────────────────
// The hero card: contains the ring, digital display, visualizer, and controls.
// This component re-renders every second (driven by `seconds`), so every child
// that doesn't depend on `seconds` is wrapped in React.memo to stay stable.

export default function Timer({
  seconds,
  total,
  running,
  mode,
  accentColor,
  hasBg,
  wpOverlay,
  onToggle,
  onReset,
  onSkip,
}) {
  const ringSize = useMemo(
    () => Math.min(260, (typeof window !== "undefined" ? window.innerWidth : 400) - 80),
    [] // only compute once — ring size doesn't change with seconds
  );

  const pct           = computeProgress(total, seconds);
  const activeColor   = accentColor || mode.color;
  const effectiveGlow = accentColor ? `${accentColor}55` : mode.glow;
  const effectiveBorder = accentColor ? `${accentColor}44` : mode.border;

  const cardStyle = useMemo(() => ({
    ...glassCardStyle(hasBg, wpOverlay),
    padding:        "32px 20px 28px",
    background:     hasBg
      ? `rgba(8,8,20,${(0.60 + wpOverlay * 0.22).toFixed(3)})`
      : "linear-gradient(135deg,#0f0f1c 0%,#130e1e 60%,#0c0f1a 100%)",
    border:         `1px solid ${effectiveBorder}`,
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    position:       "relative",
    overflow:       "hidden",
    boxShadow:      hasBg
      ? `0 16px 48px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.08), 0 0 60px ${effectiveGlow}`
      : `0 0 60px ${effectiveGlow}`,
    marginBottom:   12,
  }), [hasBg, wpOverlay, effectiveBorder, effectiveGlow]);

  return (
    <div className="fu fu1 pop" style={cardStyle}>

      {/* Ambient glow orb — purely decorative */}
      <div
        aria-hidden="true"
        style={{
          position:     "absolute",
          top:          -60,
          right:        -60,
          width:        240,
          height:       240,
          borderRadius: "50%",
          pointerEvents:"none",
          background:   `radial-gradient(circle,${effectiveGlow} 0%,transparent 70%)`,
          transition:   "background 0.6s ease",
        }}
      />

      {/* Ring + digital display */}
      <div
        style={{
          position:       "relative",
          width:          ringSize,
          height:         ringSize,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}
      >
        <TimerRing
          pct={pct}
          size={ringSize}
          stroke={10}
          color={mode.color}
          accentColor={accentColor}
        />

        <div
          style={{
            position:       "absolute",
            inset:          0,
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            6,
          }}
        >
          {/* Timer display — has role="timer" for screen readers */}
          <span
            role="timer"
            aria-live="off"
            aria-label={formatTimerAriaLabel(seconds, mode.label)}
            style={{
              fontSize:            "clamp(48px,13vw,78px)",
              fontWeight:          900,
              letterSpacing:       "-4px",
              lineHeight:          1,
              color:               activeColor,
              textShadow:          `0 0 50px ${activeColor}66`,
              fontVariantNumeric:  "tabular-nums",
              transition:          "color 0.6s ease, text-shadow 0.6s ease",
            }}
          >
            {formatTime(seconds)}
          </span>

          <span
            style={{
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color:         "rgba(255,255,255,.3)",
            }}
          >
            {mode.label}
          </span>

          {running && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span
                className="pulse-dot"
                style={{
                  width:        6,
                  height:       6,
                  borderRadius: "50%",
                  background:   activeColor,
                  boxShadow:    `0 0 8px ${activeColor}`,
                }}
              />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 500 }}>
                {formatMinutesLeft(seconds)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Visualizer */}
      <div style={{ marginTop: 16, marginBottom: -4 }}>
        <Visualizer active={running} color={activeColor} />
      </div>

      <SessionControls
        running={running}
        mode={mode}
        accentColor={accentColor}
        effectiveGlow={effectiveGlow}
        onToggle={onToggle}
        onReset={onReset}
        onSkip={onSkip}
      />
    </div>
  );
}