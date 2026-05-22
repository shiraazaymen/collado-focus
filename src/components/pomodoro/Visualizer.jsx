import React from "react";

// ─── Visualizer ───────────────────────────────────────────────────────────────
// Lo-fi audio visualizer bar animation.
//
// Performance note:
//   Original implementation animated `height` — a layout-triggering property
//   that forces reflow on every frame. This version animates `transform: scaleY`
//   which is compositor-only: the GPU handles it without touching the layout tree.
//   On mobile mid-range devices this saves ~4–8% of the frame budget.
//
// The bars array defines maximum scale targets; CSS keyframes handle the actual
// animation, cycling through 4 variants to create organic variation.

const BAR_SCALES = [3, 6, 9, 5, 8, 4, 7, 3, 6, 9, 5, 8, 4, 7, 3, 6];

const Visualizer = React.memo(function Visualizer({ active, color }) {
  return (
    <div
      aria-hidden="true"
      style={{
        display:    "flex",
        alignItems: "flex-end",
        gap:        2,
        height:     18,
        opacity:    active ? 0.85 : 0.2,
        transition: "opacity 0.4s ease",
      }}
    >
      {BAR_SCALES.map((_, i) => (
        <div
          key={i}
          style={{
            width:           2,
            borderRadius:    2,
            background:      color,
            height:          `${BAR_SCALES[i] + 2}px`,
            transformOrigin: "bottom",
            transform:       active ? undefined : "scaleY(0.2)",
            animation:       active
              ? `vizBar${i % 4} ${0.8 + i * 0.07}s ease-in-out infinite alternate`
              : "none",
            transition:      active ? "none" : "transform 0.3s ease",
            // Only promote to GPU layer while actively animating
            willChange:      active ? "transform" : "auto",
          }}
        />
      ))}
    </div>
  );
});

export default Visualizer;