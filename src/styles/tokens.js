// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Single source of truth for all spacing, radius, z-index, and color primitives.
// Components import these instead of hardcoding magic numbers, which means
// a single value change here propagates to every consumer automatically.
//
// Why JS (not CSS vars only)?
//   - Inline-style components can consume these directly.
//   - Future theme packs can swap entire token sets at runtime.
//   - Avoids a second layer of indirection for values already in JS state.

export const RADIUS = {
  sm:   8,
  md:   10,
  lg:   14,
  xl:   16,
  card: 30,
  panel: 34,
  full: 9999,
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  section: 28,
};

export const Z = {
  wallpaper: 0,
  overlay:   1,
  content:   2,
  header:    50,
  player:    100,
  modal:     200,
};

export const FONT = {
  family: "'Outfit', sans-serif",
  weight: {
    light:     300,
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
    black:     900,
  },
};

// Shared alpha surfaces used for glass cards.
// Accepts wpOverlay (0–1) to darken in proportion to wallpaper.
export function glassBackground(wpOverlay = 0) {
  return `rgba(8,8,20,${(0.68 + wpOverlay * 0.22).toFixed(3)})`;
}

export function cardBackground(wpOverlay = 0) {
  return `rgba(10,10,22,${(0.72 + wpOverlay * 0.2).toFixed(3)})`;
}

// Base glass card style object — spread into component inline styles.
// Backdrop-filter is only applied when a background is active (hasBg)
// to avoid unnecessary GPU compositing layers on the default dark background.
export function glassCardStyle(hasBg = false, wpOverlay = 0) {
  return {
    background:           hasBg
      ? `linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.04)), ${glassBackground(wpOverlay)}`
      : "linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.04))",
    borderRadius:         RADIUS.card,
    border:               "1px solid rgba(255,255,255,.11)",
    backdropFilter:       "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow:            "inset 0 1px 0 rgba(255,255,255,.14), 0 16px 42px rgba(0,0,0,.25), 0 0 30px rgba(192,193,255,.045)",
  };
}

// Reusable button base — prevents 'all .15s' transition which forces the
// browser to watch every animatable property. Explicit list is faster.
export const BTN_BASE = {
  cursor:      "pointer",
  fontFamily:  FONT.family,
  outline:     "none",
  border:      "none",
  transition:  "background .14s ease, border-color .14s ease, color .14s ease, transform .14s ease, box-shadow .14s ease",
};

// Panel/modal backdrop style
export const PANEL_BACKDROP = {
  position:       "fixed",
  inset:          0,
  zIndex:         Z.modal,
  background:     "rgba(0,0,0,.82)",
  backdropFilter: "blur(14px)",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  padding:        SPACING.xl,
  animation:      "overlayIn .18s ease both",
};
