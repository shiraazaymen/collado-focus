import { useState, useEffect, useRef } from "react";

// ─── useFloatingPlayer ────────────────────────────────────────────────────────
// Manages drag positioning and corner snapping for the floating music player.
//
// Performance choice:
//   During a drag, updating React state on every mousemove event causes a
//   full React reconciliation + style-object diff at 60fps. Instead we mutate
//   the DOM directly during the drag (playerRef.current.style.left/top) and
//   commit to React state ONLY on mouseup. This makes dragging feel instant
//   on mid-range devices and avoids 60fps re-renders of the parent tree.
//
// Corner snapping:
//   On mouseup, we check which quadrant the player landed in and snap it to
//   the nearest corner (20px inset). This gives a satisfying "magnetic" feel
//   and prevents the player from getting stuck in awkward mid-screen positions.

/**
 * @param {object} opts
 * @param {object} opts.initialPos  - e.g. { right: 20, bottom: 20 }
 * @returns {object}
 */
export function useFloatingPlayer({ initialPos = { right: 20, bottom: 20 } } = {}) {
  const [pos,       setPos]       = useState(initialPos);
  const [dragging,  setDragging]  = useState(false);

  const playerRef    = useRef(null);
  const dragOffset   = useRef({ x: 0, y: 0 });
  const pendingPos   = useRef(null); // holds live DOM position during drag

  // ── Mouse down on player header ────────────────────────────────────────────
  const onMouseDown = (e) => {
    // Let button / iframe clicks pass through without starting a drag
    if (e.target.tagName === "BUTTON" || e.target.tagName === "IFRAME") return;
    e.preventDefault();

    const rect = playerRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
  };

  // ── Touch support ──────────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    if (e.target.tagName === "BUTTON" || e.target.tagName === "IFRAME") return;
    const touch = e.touches[0];
    const rect  = playerRef.current.getBoundingClientRect();
    dragOffset.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    setDragging(true);
  };

  // ── Global move / up listeners — only active while dragging ───────────────
  useEffect(() => {
    if (!dragging) return;

    const move = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      if (clientX == null || !playerRef.current) return;

      const x    = clientX - dragOffset.current.x;
      const y    = clientY - dragOffset.current.y;
      const maxX = window.innerWidth  - (playerRef.current.offsetWidth  || 300) - 10;
      const maxY = window.innerHeight - (playerRef.current.offsetHeight || 200) - 10;
      const cx   = Math.max(10, Math.min(x, maxX));
      const cy   = Math.max(10, Math.min(y, maxY));

      // Direct DOM mutation — no React re-render during drag
      playerRef.current.style.left   = `${cx}px`;
      playerRef.current.style.top    = `${cy}px`;
      playerRef.current.style.right  = "auto";
      playerRef.current.style.bottom = "auto";
      pendingPos.current = { left: cx, top: cy, right: "auto", bottom: "auto" };
    };

    const up = () => {
      setDragging(false);
      if (!playerRef.current) return;

      const rect  = playerRef.current.getBoundingClientRect();
      const W     = window.innerWidth;
      const H     = window.innerHeight;
      const snapR = rect.left + rect.width  > W / 2;
      const snapB = rect.top  + rect.height > H / 2;

      const snapped = {
        left:   snapR ? "auto" : 20,
        right:  snapR ? 20     : "auto",
        top:    snapB ? "auto" : 20,
        bottom: snapB ? 20     : "auto",
      };

      // Apply snap to DOM immediately (no flash), then commit to React for persistence
      Object.assign(playerRef.current.style, {
        left:   String(snapped.left),
        right:  String(snapped.right),
        top:    String(snapped.top),
        bottom: String(snapped.bottom),
      });
      setPos(snapped);
      pendingPos.current = null;
    };

    window.addEventListener("mousemove",  move);
    window.addEventListener("mouseup",    up);
    window.addEventListener("touchmove",  move, { passive: true });
    window.addEventListener("touchend",   up);

    return () => {
      window.removeEventListener("mousemove",  move);
      window.removeEventListener("mouseup",    up);
      window.removeEventListener("touchmove",  move);
      window.removeEventListener("touchend",   up);
    };
  }, [dragging]);

  return {
    playerRef,
    pos,
    dragging,
    onMouseDown,
    onTouchStart,
  };
}