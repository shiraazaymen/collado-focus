import React from "react";

// ─── WallpaperBackground ──────────────────────────────────────────────────────
// Renders the two-layer wallpaper crossfade system and optional video wallpaper.
// Kept as a separate component so wallpaper changes NEVER trigger re-renders
// of the timer card, stats, or any other UI above it.
//
// Layer strategy:
//   1. Video layer   (zIndex 0) — <video> element, fullscreen fixed
//   2. Prev layer    (zIndex 0) — outgoing wallpaper, fades from 1 → 0
//   3. Current layer (zIndex 0) — incoming wallpaper, fades from 0 → 1
//   4. Overlay       (zIndex 1) — dark scrim, controls readability
//
// backgroundAttachment:'fixed' is intentionally absent — it's broken on
// iOS Safari and causes paint thrashing on scroll in Android browsers.
// The fixed-position div approach achieves the same visual without those bugs.

const WallpaperBackground = React.memo(function WallpaperBackground({
  wallpaper,
  videoWpUrl,
  prevWallpaper,
  prevVisible,
  nextLoaded,
  wpOverlay,
  hasBg,
}) {
  const layerBase = {
    position:        "fixed",
    inset:           0,
    width:           "100vw",
    height:          "100vh",
    zIndex:          0,
    pointerEvents:   "none",
    backgroundSize:  "cover",
    backgroundPosition: "center",
    // GPU compositing — prevents repaints when other layers change
    transform:       "translateZ(0)",
  };

  return (
    <>
      {/* Video wallpaper */}
      {videoWpUrl && (
        <video
          autoPlay
          muted
          loop
          playsInline
          src={videoWpUrl}
          style={{
            position:   "fixed",
            inset:      0,
            zIndex:     0,
            width:      "100vw",
            height:     "100vh",
            objectFit:  "cover",
            transform:  "translateZ(0)",
          }}
        />
      )}

      {/* Previous wallpaper — fades out during transition */}
      {prevWallpaper !== "none" && (
        <div
          style={{
            ...layerBase,
            backgroundImage: `url("${prevWallpaper}")`,
            opacity:         prevVisible ? 1 : 0,
            transition:      "opacity 600ms ease",
            willChange:      "opacity",
          }}
        />
      )}

      {/* Current wallpaper — fades in after preload */}
      {wallpaper !== "none" && (
        <div
          style={{
            ...layerBase,
            backgroundImage: `url("${wallpaper}")`,
            opacity:         nextLoaded ? 1 : 0,
            transition:      "opacity 600ms ease",
            willChange:      "opacity",
          }}
        />
      )}

      {/* Darkness overlay — sits above wallpaper layers, below content */}
      {hasBg && (
        <div
          aria-hidden="true"
          style={{
            position:      "fixed",
            inset:         0,
            width:         "100vw",
            height:        "100vh",
            zIndex:        1,
            pointerEvents: "none",
            background:    `rgba(7,7,15,${wpOverlay})`,
            transition:    "background 0.4s ease",
          }}
        />
      )}
    </>
  );
});

export default WallpaperBackground;
