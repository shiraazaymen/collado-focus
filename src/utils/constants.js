// ─── TIMER MODES ─────────────────────────────────────────────────────────────
// Each mode carries its own color system so any component can derive
// theme values without needing context or prop drilling.

export const DEFAULT_MODES = [
  {
    key:    "focus",
    label:  "Focus",
    minutes: 25,
    color:  "#34d399",
    glow:   "rgba(52,211,153,.35)",
    pill:   "rgba(52,211,153,.12)",
    border: "rgba(52,211,153,.28)",
  },
  {
    key:    "short",
    label:  "Short Break",
    minutes: 5,
    color:  "#60a5fa",
    glow:   "rgba(96,165,250,.35)",
    pill:   "rgba(96,165,250,.12)",
    border: "rgba(96,165,250,.28)",
  },
  {
    key:    "long",
    label:  "Long Break",
    minutes: 15,
    color:  "#a78bfa",
    glow:   "rgba(167,139,250,.35)",
    pill:   "rgba(167,139,250,.12)",
    border: "rgba(167,139,250,.28)",
  },
];

// ─── WALLPAPERS ───────────────────────────────────────────────────────────────
// `preview` = thumbnail background color (dark, safe for small swatches)
// `accent`  = hand-tuned bright color safe for UI accents / ring glow.
// These two are intentionally separate — preview colors are often too dark
// to use as text/glow colors at readable contrast ratios.

export const WALLPAPER_CATEGORIES = {
  None: [
    { label: "None", value: "none", preview: "#07070f", accent: null },
  ],
  Nature: [
    { label: "Forest",    value: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80", preview: "#2d4a2d", accent: "#4ade80" },
    { label: "Ocean",     value: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80", preview: "#1a3a5c", accent: "#60a5fa" },
    { label: "Mountains", value: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80", preview: "#3a3a4a", accent: "#a78bfa" },
    { label: "Desert",    value: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80", preview: "#8b6347", accent: "#fb923c" },
  ],
  Dark: [
    { label: "City Night", value: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80", preview: "#1a1a2e", accent: "#f472b6" },
    { label: "Aurora",     value: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80", preview: "#0d2137", accent: "#34d399" },
  ],
  Coffee: [
    { label: "Coffee Shop", value: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80", preview: "#3b2a1a", accent: "#fbbf24" },
    { label: "Café Books",  value: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=80", preview: "#4a3520", accent: "#fb923c" },
  ],
  Rain: [
    { label: "Rain Window", value: "https://images.unsplash.com/photo-1501691223387-dd0500403074?w=1600&q=80", preview: "#2a3a4a", accent: "#93c5fd" },
    { label: "Storm",       value: "https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=1600&q=80", preview: "#1e2a35", accent: "#818cf8" },
  ],
  Space: [
    { label: "Nebula", value: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80", preview: "#0d0520", accent: "#c084fc" },
    { label: "Cosmos", value: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1600&q=80", preview: "#060610", accent: "#818cf8" },
  ],
  Minimal: [
    { label: "Concrete", value: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=80", preview: "#2a2a2a", accent: "#e2e8f0" },
    { label: "Gradient", value: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80", preview: "#1a1a3e", accent: "#a78bfa" },
  ],
};

// Flat list — used for accent lookups without iterating categories
export const ALL_WALLPAPERS = Object.values(WALLPAPER_CATEGORIES).flat();

// ─── AMBIENT SOUNDS ───────────────────────────────────────────────────────────
// CDN sources are public previews. Self-host for production to guarantee SLA.
export const AMBIENT_SOUNDS = [
  { key: "rain",      label: "🌧 Rain",    src: "https://cdn.freesound.org/previews/346/346170_5121236-lq.mp3" },
  { key: "thunder",   label: "⛈ Thunder", src: "https://cdn.freesound.org/previews/398/398735_7364899-lq.mp3" },
  { key: "cafe",      label: "☕ Café",    src: "https://cdn.freesound.org/previews/537/537161_7723148-lq.mp3" },
  { key: "fireplace", label: "🔥 Fire",    src: "https://cdn.freesound.org/previews/476/476521_9509445-lq.mp3" },
  { key: "keyboard",  label: "⌨ Keys",    src: "https://cdn.freesound.org/previews/242/242401_4495061-lq.mp3" },
];

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────
// Single source of truth for all localStorage keys.
// Changing a key name here propagates everywhere automatically.
export const STORAGE_KEYS = {
  MODES:              "pomo_modes",
  MODE_IDX:           "pomo_modeIdx",
  SECONDS:            "pomo_seconds",
  RUNNING:            "pomo_running",
  SESSIONS:           "pomo_sessions",
  CYCLES:             "pomo_cycles",
  LOG:                "pomo_log",
  RUN_STARTED_AT:     "pomo_runStartedAt",
  RUN_STARTED_SECONDS:"pomo_runStartedSeconds",
  MODE_REMAINING:     "pomo_modeRemaining",
  WALLPAPER:          "pomo_wallpaper",
  CUSTOM_WP:          "pomo_customWp",
  VIDEO_WP:           "pomo_videoWp",
  OVERLAY:            "pomo_overlay",
};