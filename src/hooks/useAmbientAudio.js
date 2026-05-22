import { useState, useEffect, useRef } from "react";
import { AMBIENT_SOUNDS }               from "../utils/constants";

// ─── useAmbientAudio ──────────────────────────────────────────────────────────
// Manages a single <audio> element that plays looping ambient sounds.
// Only one sound plays at a time — switching sounds pauses the current one,
// updates the src, and plays the new one.
//
// The audio element itself is managed via a ref (not rendered in JSX here) —
// the consumer must render <audio ref={audioRef} loop preload="none" />.
// This separation keeps the hook testable and the DOM management explicit.

/**
 * @param {object} opts
 * @param {number} opts.initialVolume  - 0–1, default 0.4
 * @returns {object}
 */
export function useAmbientAudio({ initialVolume = 0.4 } = {}) {
  const [activeKey, setActiveKey] = useState("");
  const [playing,   setPlaying]   = useState(false);
  const [volume,    setVolume]    = useState(initialVolume);

  const audioRef = useRef(null); // attach this ref to the <audio> element

  // Sync volume changes to the audio element immediately
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  /**
   * Toggles playback for the given ambient sound key.
   * If the same key is playing → pause.
   * If a different key → switch src and play.
   *
   * @param {string} key  - matches AMBIENT_SOUNDS[n].key
   */
  const toggle = (key) => {
    const sound = AMBIENT_SOUNDS.find(s => s.key === key);
    if (!sound) return;

    if (activeKey === key && playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src    = sound.src;
        audioRef.current.loop   = true;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(() => {
          // Browser autoplay policy — silently fail; user can retry.
        });
      }
      setActiveKey(key);
      setPlaying(true);
    }
  };

  const stop = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  return {
    audioRef,    // attach to <audio ref={audioRef} />
    activeKey,
    playing,
    volume,
    setVolume,
    toggle,
    stop,
  };
}