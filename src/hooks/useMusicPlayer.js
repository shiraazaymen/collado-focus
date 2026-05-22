import { useState, useEffect, useRef } from "react";
import { parseSpotifyEmbed, parseYouTubeId } from "../utils/mediaUtils";

// ─── useMusicPlayer ───────────────────────────────────────────────────────────
// Manages music embed state (Spotify + YouTube) and the "intelligent focus
// mode" behavior: the floating player auto-expands when a focus session starts,
// but ONLY if the user has not explicitly minimized it.
//
// The `userExplicitlyMinimized` ref distinguishes "minimized by the system
// (auto)" from "minimized by the user (intentional)". This prevents the
// frustrating experience of the player re-expanding every time the timer
// starts after the user deliberately closed it.

/**
 * @param {object} opts
 * @param {string} opts.initialSpotifyEmbed
 * @param {string} opts.initialYtId
 * @param {string} opts.initialMusicTab
 * @param {boolean} opts.initialMinimized
 * @returns {object}
 */
export function useMusicPlayer({
  initialSpotifyEmbed = "",
  initialYtId         = "",
  initialMusicTab     = "spotify",
  initialMinimized    = false,
} = {}) {
  const [spotifyEmbed, setSpotifyEmbed] = useState(initialSpotifyEmbed);
  const [ytId,         setYtId]         = useState(initialYtId);
  const [musicTab,     setMusicTab]     = useState(initialMusicTab);
  const [minimized,    setMinimized]    = useState(initialMinimized);

  // Inline validation errors — replaces alert() calls
  const [spotifyError, setSpotifyError] = useState("");
  const [ytError,      setYtError]      = useState("");

  // Tracks user intent to prevent overriding deliberate minimize
  const userExplicitlyMinimized = useRef(false);

  const hasMusic = !!(spotifyEmbed || ytId);

  // ── Load handlers ──────────────────────────────────────────────────────────
  const loadSpotify = (input) => {
    const embed = parseSpotifyEmbed(input);
    if (embed) {
      setSpotifyEmbed(embed);
      setSpotifyError("");
      setMinimized(false);
      userExplicitlyMinimized.current = false;
    } else {
      setSpotifyError("Paste a Spotify track, playlist, album, artist or episode link.");
      // Auto-clear error after 4 seconds
      setTimeout(() => setSpotifyError(""), 4000);
    }
  };

  const loadYouTube = (input) => {
    const id = parseYouTubeId(input);
    if (id) {
      setYtId(id);
      setYtError("");
      setMinimized(false);
      userExplicitlyMinimized.current = false;
    } else {
      setYtError("Paste a YouTube / YT Music link or an 11-character video ID.");
      setTimeout(() => setYtError(""), 4000);
    }
  };

  const clearMusic = () => {
    setSpotifyEmbed("");
    setYtId("");
  };

  // ── User-initiated minimize ────────────────────────────────────────────────
  const toggleMinimized = () => {
    userExplicitlyMinimized.current = true;
    setMinimized(m => !m);
  };

  // ── Intelligent Focus Mode ─────────────────────────────────────────────────
  // Called by the parent when the timer starts on focus mode.
  // Only expands the player if the user hasn't deliberately minimized it.
  const onFocusStart = () => {
    if (hasMusic && !userExplicitlyMinimized.current) {
      setMinimized(false);
    }
  };

  // Reset the "explicitly minimized" intent when music is cleared,
  // so the next loaded track starts expanded again.
  useEffect(() => {
    if (!hasMusic) {
      userExplicitlyMinimized.current = false;
    }
  }, [hasMusic]);

  return {
    // State
    spotifyEmbed, ytId, musicTab, minimized, hasMusic,
    spotifyError, ytError,
    // Actions
    loadSpotify, loadYouTube, clearMusic,
    setMusicTab,
    toggleMinimized,
    onFocusStart,
  };
}