import React, { useId } from "react";
import { getRingGeometry } from "../../utils/timerUtils";

// ─── TimerRing ────────────────────────────────────────────────────────────────
// Isolated SVG component. Extracting it from the parent stops the entire
// timer card from re-rendering on every SVG property change.
//
// Uses useId() to generate a unique filter ID per instance — avoids the
// silent bug where duplicate IDs cause all but the first instance to
// render without the glow effect (relevant for StrictMode double-render
// and any future multi-timer feature).

const TimerRing = React.memo(function TimerRing({ pct, size, stroke, color, accentColor }) {
  const id       = useId();
  // Strip colon characters that React inserts into useId() results — colons
  // are invalid in SVG filter ID attribute values.
  const filterId = `ring-glow-${id}`.replace(/:/g, "");

  const radius = (size - stroke * 2) / 2;
  const { circumference, offset } = getRingGeometry(radius, pct);
  const ringColor = accentColor || color;

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", display: "block" }}
      aria-hidden="true"  // decorative — timer text has aria-label
    >
      <defs>
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,.06)"
        strokeWidth={stroke}
      />

      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        filter={`url(#${filterId})`}
        style={{
          transition: "stroke-dashoffset 0.5s ease, stroke 0.6s ease",
        }}
      />
    </svg>
  );
});

export default TimerRing;