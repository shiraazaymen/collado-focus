import { useState, useMemo, useRef } from "react";
import { ALL_WALLPAPERS }            from "../utils/constants";

// ─── useWallpaper ─────────────────────────────────────────────────────────────
// Owns all wallpaper state: current value, video, overlay darkness,
// cinematic crossfade, and the accent color derived from the active wallpaper.
//
// Crossfade design:
//   Two absolutely-positioned fixed layers sit behind all content.
//   When switching wallpapers:
//     1. The current wallpaper is promoted to the "prev" layer (opacity 1).
//     2. The next image is preloaded via new Image().
//     3. Once loaded, the new wallpaper layer fades in (opacity 0 → 1).
//     4. After 700ms the prev layer is removed from the DOM.
//   This is a true cinematic crossfade with no flash or blank frame.
//
// Mobile note:
//   backgroundAttachment:'fixed' is intentionally ABSENT — it breaks
//   iOS Safari and causes paint thrashing on Android. The fixed-position
//   div approach achieves the same visual without those bugs.

/**
 * @param {object} opts
 * @param {string} opts.initialWallpaper
 * @param {string} opts.initialCustomWpUrl
 * @param {string} opts.initialVideoWpUrl
 * @param {number} opts.initialOverlay      - 0–1
 * @returns {object}
 */
export function useWallpaper({
  initialWallpaper   = "none",
  initialCustomWpUrl = "",
  initialVideoWpUrl  = "",
  initialOverlay     = 0.55,
} = {}) {
  const [wallpaper,   setWallpaper]   = useState(initialWallpaper);
  const [customWpUrl, setCustomWpUrl] = useState(initialCustomWpUrl);
  const [videoWpUrl,  setVideoWpUrl]  = useState(initialVideoWpUrl);
  const [wpOverlay,   setWpOverlay]   = useState(initialOverlay);

  // Crossfade layers
  const [prevWallpaper, setPrevWallpaper] = useState("none");
  const [prevVisible,   setPrevVisible]   = useState(false);  // drives opacity CSS
  const [nextLoaded,    setNextLoaded]    = useState(true);

  const transitionTimer  = useRef(null);
  const prevVideoBlobRef = useRef(null); // tracked for URL.revokeObjectURL

  // ── Accent color derived synchronously (no useEffect render cycle) ─────────
  // Returns a hand-tuned bright hex that is safe for UI use as a glow/text
  // color. Preview colors (thumbnail bg) are intentionally too dark for this.
  const accentColor = useMemo(() => {
    if (wallpaper === "none") return null;
    return ALL_WALLPAPERS.find(w => w.value === wallpaper)?.accent ?? null;
  }, [wallpaper]);

  // ── Cinematic crossfade ────────────────────────────────────────────────────
  const transitionWallpaper = (newVal) => {
    if (newVal === wallpaper) return;
    clearTimeout(transitionTimer.current);

    if (newVal === "none") {
      // No image to preload — promote current to prev, clear wallpaper
      setPrevWallpaper(wallpaper);
      setPrevVisible(true);
      setWallpaper(newVal);
      transitionTimer.current = setTimeout(() => {
        setPrevVisible(false);
        setPrevWallpaper("none");
      }, 700);
      return;
    }

    // Promote current wallpaper to "out" layer (full opacity)
    setPrevWallpaper(wallpaper);
    setPrevVisible(true);
    setNextLoaded(false);

    const img = new Image();
    img.onload = () => {
      // New wallpaper loaded — fade it in
      setNextLoaded(true);
      setWallpaper(newVal);
      // After the fade completes, remove the prev layer
      transitionTimer.current = setTimeout(() => {
        setPrevVisible(false);
        setPrevWallpaper("none");
      }, 700);
    };
    img.onerror = () => {
      // Failed to load — still switch, skip animation
      setNextLoaded(true);
      setWallpaper(newVal);
      setPrevVisible(false);
    };
    img.src = newVal;
  };

  const applyPreset = (val) => {
    transitionWallpaper(val);
    setVideoWpUrl("");
  };

  const applyCustomUrl = (url) => {
    if (!url?.trim()) return;
    transitionWallpaper(url.trim());
    setCustomWpUrl(url.trim());
    setVideoWpUrl("");
  };

  const applyImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      transitionWallpaper(ev.target.result);
      setCustomWpUrl(ev.target.result);
      setVideoWpUrl("");
    };
    reader.readAsDataURL(file);
  };

  const applyVideoUrl = (url) => {
    if (!url?.trim()) return;
    setVideoWpUrl(url.trim());
    setWallpaper("none");
  };

  const applyVideoFile = (file) => {
    if (!file) return;
    // Revoke previous blob to prevent memory leak
    if (prevVideoBlobRef.current) URL.revokeObjectURL(prevVideoBlobRef.current);
    const url = URL.createObjectURL(file);
    prevVideoBlobRef.current = url;
    setVideoWpUrl(url);
    setWallpaper("none");
  };

  const clearWallpaper = () => {
    setWallpaper("none");
    setCustomWpUrl("");
    setVideoWpUrl("");
  };

  const hasBg = wallpaper !== "none" || !!videoWpUrl;

  return {
    // State
    wallpaper, customWpUrl, videoWpUrl, wpOverlay, hasBg,
    // Transition layers
    prevWallpaper, prevVisible, nextLoaded,
    // Accent
    accentColor,
    // Actions
    applyPreset, applyCustomUrl, applyImageFile,
    applyVideoUrl, applyVideoFile, clearWallpaper,
    setWpOverlay,
  };
}