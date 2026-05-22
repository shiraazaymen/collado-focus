import { useState, useEffect, useRef } from "react";
import { usePomodoroTimer } from "./hooks/usePomodoroTimer";
import { usePersistentPomodoro,usePersistSnapshot } from "./hooks/useLocalStorage";
import { useWallpaper } from "./hooks/useWallpaper";
import { useAmbientAudio } from "./hooks/useAmbientAudio";
import { useFloatingPlayer } from "./hooks/useFloatingPlayer";
import { STORAGE_KEYS } from "./utils/constants";
import { formatTime, formatTimerAriaLabel } from "./utils/formatters";
import { glassCardStyle, BTN_BASE,PANEL_BACKDROP } from "./styles/tokens";
import WallpaperBackground from "./components/wallpaper/WallpaperBackground";
// ─── CONSTANTS ─────────────────────────────────────────────────────────────

const DEFAULT_MODES = [
  { key:"focus",  label:"Focus",       minutes:25, color:"#34d399", glow:"rgba(52,211,153,.35)",  pill:"rgba(52,211,153,.12)",  border:"rgba(52,211,153,.28)"  },
  { key:"short",  label:"Short Break", minutes:5,  color:"#60a5fa", glow:"rgba(96,165,250,.35)",  pill:"rgba(96,165,250,.12)",  border:"rgba(96,165,250,.28)"  },
  { key:"long",   label:"Long Break",  minutes:15, color:"#a78bfa", glow:"rgba(167,139,250,.35)", pill:"rgba(167,139,250,.12)", border:"rgba(167,139,250,.28)" },
];

// Feature 6: Categorized wallpapers
const WALLPAPER_CATEGORIES = {
  "None": [
    { label:"None", value:"none", preview:"#07070f" },
  ],
  "Nature": [
    { label:"Forest",    value:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80", preview:"#2d4a2d" },
    { label:"Ocean",     value:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80", preview:"#1a3a5c" },
    { label:"Mountains", value:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80", preview:"#3a3a4a" },
    { label:"Desert",    value:"https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80", preview:"#8b6347" },
  ],
  "Dark": [
    { label:"City Night", value:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80", preview:"#1a1a2e" },
    { label:"Aurora",     value:"https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80", preview:"#0d2137" },
  ],
  "Coffee": [
    { label:"Coffee Shop", value:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80", preview:"#3b2a1a" },
    { label:"Café Books",  value:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=80", preview:"#4a3520" },
  ],
  "Rain": [
    { label:"Rain Window", value:"https://images.unsplash.com/photo-1501691223387-dd0500403074?w=1600&q=80", preview:"#2a3a4a" },
    { label:"Storm",       value:"https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=1600&q=80", preview:"#1e2a35" },
  ],
  "Space": [
    { label:"Nebula",  value:"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80", preview:"#0d0520" },
    { label:"Cosmos",  value:"https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1600&q=80", preview:"#060610" },
  ],
  "Minimal": [
    { label:"Concrete", value:"https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=80", preview:"#2a2a2a" },
    { label:"Gradient", value:"https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80", preview:"#1a1a3e" },
  ],
};

// All wallpapers flat list for finding by value
const ALL_WALLPAPERS = Object.values(WALLPAPER_CATEGORIES).flat();

// Feature 9: Ambient sounds
const AMBIENT_SOUNDS = [
  { key:"rain",      label:"🌧 Rain",      src:"https://cdn.freesound.org/previews/346/346170_5121236-lq.mp3" },
  { key:"thunder",   label:"⛈ Thunder",   src:"https://cdn.freesound.org/previews/398/398735_7364899-lq.mp3" },
  { key:"cafe",      label:"☕ Café",      src:"https://cdn.freesound.org/previews/537/537161_7723148-lq.mp3" },
  { key:"fireplace", label:"🔥 Fire",      src:"https://cdn.freesound.org/previews/476/476521_9509445-lq.mp3" },
  { key:"keyboard",  label:"⌨ Keys",      src:"https://cdn.freesound.org/previews/242/242401_4495061-lq.mp3" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmt(s){ return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────

function Ring({ pct, size, stroke, color, accentColor }){
  const r = (size - stroke*2) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct/100)*c;
  const ringColor = accentColor || color;
  return(
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", display:"block" }}>
      <defs>
        <filter id="ring-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        filter="url(#ring-glow)"
        style={{ transition:"stroke-dashoffset 0.5s ease, stroke 0.6s ease" }}/>
    </svg>
  );
}

// Feature 5: Lo-fi audio visualizer bars
function Visualizer({ active, color }){
  const bars = [3,6,9,5,8,4,7,3,6,9,5,8,4,7,3,6];
  return(
    <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:18, opacity: active ? 0.85 : 0.2, transition:"opacity 0.4s ease" }}>
      {bars.map((h,i)=>(
        <div key={i} style={{
          width:2, borderRadius:2,
          background: color,
          height: active ? `${h+2}px` : "3px",
          animation: active ? `vizBar${i%4} ${0.8+i*0.07}s ease-in-out infinite alternate` : "none",
          transition:"height 0.3s ease",
        }}/>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Pomodoro({ onNavigate }) {
  // ── Core timer state ──
const { initialValues } = usePersistentPomodoro();
const {
  modes, modeIdx, seconds, running, sessions, cycles, log, mode,
  modeRemaining,
  total, toggle, reset, skip, switchMode, saveSettings,
} = usePomodoroTimer({
  initialModes:   initialValues.modes,
  initialModeIdx: initialValues.modeIdx,
  initialValues,
});
  const [showEdit, setShowEdit] = useState(false);
  const [editVals, setEditVals] = useState({ focus:25, short:5, long:15 });

  // ── Wallpaper state (Feature 1 + 4 + 7) ──
  const [showWpPanel, setShowWpPanel] = useState(false);
  const [wpCategory,    setWpCategory]    = useState("Nature");
  const [wpInputVal,    setWpInputVal]    = useState("");
  const [videoInputVal, setVideoInputVal] = useState("");
  const fileInputRef  = useRef(null);
  const videoInputRef = useRef(null);
  const {
  wallpaper, customWpUrl, videoWpUrl, wpOverlay, hasBg,
  prevWallpaper, prevVisible, nextLoaded, accentColor,
  applyPreset, applyCustomUrl, applyImageFile,
  applyVideoUrl, applyVideoFile, clearWallpaper,
  setWpOverlay,
} = useWallpaper({
  initialWallpaper:   initialValues.wallpaper,
  initialCustomWpUrl: initialValues.customWpUrl,
  initialVideoWpUrl:  initialValues.videoWpUrl,
  initialOverlay:     initialValues.wpOverlay,
});

  // Feature 10: Draggable floating player
  const {
  playerRef, pos: playerPos, dragging: isDragging,
  onMouseDown: onPlayerMouseDown,
  onTouchStart: onPlayerTouchStart,
} = useFloatingPlayer({ initialPos: initialValues.playerPos });

  // Feature 9: Ambient sounds
  const {
  audioRef: ambientAudioRef,
  activeKey: ambientKey,
  playing: ambientPlaying,
  volume: ambientVol,
  setVolume: setAmbientVol,
  toggle: toggleAmbient,
} = useAmbientAudio();

  // ── Refs ──
  const intervalRef = useRef(null);

  // ── Computed ──
  const pct      = ((total - seconds) / total) * 100;
  const ringSize =  Math.min(260, window.innerWidth - 80);

// ── Persist Snapshot ──
  usePersistSnapshot({
  // Wallpaper
  [STORAGE_KEYS.WALLPAPER]:  wallpaper,
  [STORAGE_KEYS.CUSTOM_WP]:  customWpUrl,
  [STORAGE_KEYS.VIDEO_WP]:   videoWpUrl,
  [STORAGE_KEYS.OVERLAY]:    String(wpOverlay),

  // Timer state — NO epoch values here; those are written directly in the hook
  [STORAGE_KEYS.MODES]:         modes,
  [STORAGE_KEYS.MODE_IDX]:      String(modeIdx),
  [STORAGE_KEYS.SECONDS]:       String(seconds),
  [STORAGE_KEYS.SESSIONS]:      String(sessions),
  [STORAGE_KEYS.CYCLES]:        String(cycles),
  [STORAGE_KEYS.LOG]:           log,
  [STORAGE_KEYS.MODE_REMAINING]:modeRemaining,
});
// ── Keyboard Shortcuts ──
useEffect(() => {
  function onKey(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space") { e.preventDefault(); toggle(); }
    if (e.key === "r" || e.key === "R") reset();
    if (e.key === "s" || e.key === "S") skip();
    if (e.key === "1") switchMode(0);
    if (e.key === "2") switchMode(1);
    if (e.key === "3") switchMode(2);
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [toggle, reset, skip, switchMode]);

useEffect(() => {
  document.title = running
    ? `${formatTime(seconds)} — ${mode.label} · CollaDO`
    : "CollaDO · focus";
  return () => { document.title = "CollaDO"; };
}, [seconds, running, mode.label]);

  // Effective colors with accent override (Feature 8)
  const effectiveGlow   = accentColor ? `${accentColor}55` : mode.glow;
  const effectiveBorder = accentColor ? `${accentColor}44` : mode.border;

  function clampEdit(key,val){ setEditVals(e=>({...e,[key]:parseInt(val)||1})); }
  function openEdit(){
    setEditVals({ focus:modes[0].minutes, short:modes[1].minutes, long:modes[2].minutes });
    setShowEdit(true);
  }

// computed each render since they depend on hasBg/wpOverlay
const glassCard = glassCardStyle(hasBg, wpOverlay);
const btnBase   = BTN_BASE;

// then inside component:
const panelStyle = PANEL_BACKDROP;

  // Focus music opacity (Feature 3)

  return(
  <div style={{
    minHeight:"100vh",
    background: !hasBg
      ? "radial-gradient(circle at 20% 20%, rgba(192,193,255,.16), transparent 34%), radial-gradient(circle at 82% 72%, rgba(76,215,246,.13), transparent 34%), linear-gradient(135deg,#101014 0%,#131318 45%,#0b0d14 100%)"
      : undefined,
    fontFamily:"Inter, Outfit, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color:"#e5e2e3",
    width:"100%",
    overflowX:"hidden",
    position:"relative",
  }}>
          {!hasBg && (
        <div aria-hidden="true" style={{
          position:"fixed",
          inset:0,
          zIndex:0,
          pointerEvents:"none",
          background:
            "radial-gradient(circle at 18% 28%, rgba(192,193,255,.15) 0%, transparent 38%), radial-gradient(circle at 82% 70%, rgba(76,215,246,.12) 0%, transparent 38%)",
        }}/>
      )}

      {/* Hidden audio for ambient sounds */}
      <audio ref={ambientAudioRef} loop preload="none" style={{ display:"none" }}/>
      <WallpaperBackground
        wallpaper={wallpaper}
        videoWpUrl={videoWpUrl}
        prevWallpaper={prevWallpaper}
        prevVisible={prevVisible}
        nextLoaded={nextLoaded}
        wpOverlay={wpOverlay}
        hasBg={hasBg}/>

      {/* ═══ TOPBAR ═══ */}
      <header style={{
        position:"sticky",
        top:0,
        zIndex:50,
        height:64,
        padding:"0 clamp(16px,4vw,40px)",
        display:"flex",
        alignItems:"center",
        gap:14,
        background: hasBg
          ? `rgba(12,12,18,${0.70 + wpOverlay*0.14})`
          : "rgba(255,255,255,.075)",
        backdropFilter:"blur(28px)",
        WebkitBackdropFilter:"blur(28px)",
        borderBottom:"1px solid rgba(255,255,255,.10)",
        boxShadow:"inset 0 1px 0 rgba(255,255,255,.14), 0 12px 40px rgba(0,0,0,.18)",
      }}>
        <button className="ctrl" aria-label="Go back to dashboard" onClick={()=>onNavigate("dashboard")} style={{
          ...btnBase,
          width:40,
          height:40,
          borderRadius:999,
          background:"rgba(255,255,255,.10)",
          border:"1px solid rgba(255,255,255,.12)",
          color:"rgba(229,226,227,.82)",
          fontSize:18,
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          boxShadow:"inset 0 1px 0 rgba(255,255,255,.14)",
        }}>←</button>

        <div style={{
  display:"flex",
  alignItems:"baseline",
  gap:4,
}}>
  <span style={{
    fontSize:20,
    fontWeight:700,
    letterSpacing:"-1.2px",
    color:"rgba(245,245,247,.95)",
    lineHeight:1,
  }}>
    CollaDO
  </span>
  <span style={{
    fontSize:10,
    fontWeight:600,
    letterSpacing:"0.12em",
    color:"rgba(245,245,247,.55)",
    lineHeight:1,
  }}>.focus</span>
</div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          {sessions > 0 && (
            <div style={{ padding:"4px 12px", borderRadius:20, fontSize:10, fontWeight:700,
              background:"rgba(52,211,153,.12)", border:"1px solid rgba(52,211,153,.28)", color:"#34d399" }}>
              {sessions} done ✓
            </div>
          )}
          <button className="icon-btn" onClick={()=>setShowWpPanel(p=>!p)} style={{
            ...btnBase,
            minHeight:40,
            padding:"8px 15px",
            borderRadius:999,
            fontSize:12,
            fontWeight:800,
            letterSpacing:"0.04em",
            background: hasBg ? "rgba(192,193,255,.16)" : "rgba(255,255,255,.10)",
            border: hasBg ? "1px solid rgba(192,193,255,.28)" : "1px solid rgba(255,255,255,.12)",
            color: hasBg ? "#c0c1ff" : "rgba(229,226,227,.82)",
            display:"flex",
            alignItems:"center",
            gap:7,
            boxShadow:"inset 0 1px 0 rgba(255,255,255,.14)",
          }}>
            Wallpaper
          </button>
          <button className="ctrl" onClick={openEdit} style={{
            ...btnBase,
            minHeight:40,
            padding:"8px 15px",
            borderRadius:999,
            fontSize:10,
            fontWeight:550,
            letterSpacing:"0.04em",
            background:"rgba(255,255,255,.10)",
            border:"1px solid rgba(255,255,255,.12)",
            color:"rgba(229,226,227,.82)",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,.14)",
          }}>Edit</button>
        </div>
      </header>

      {/* ═══ WALLPAPER PANEL ═══ */}
      {showWpPanel && (
        <div style={panelStyle} onClick={()=>setShowWpPanel(false)}>
          <div className="fu" onClick={e=>e.stopPropagation()} style={{
            width:"100%", maxWidth:500, background:"#0f0f1e",
            border:"1px solid rgba(167,139,250,.22)", borderRadius:22, padding:24,
            boxShadow:"0 0 60px rgba(167,139,250,.12)", maxHeight:"90vh", overflowY:"auto",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
              <div>
                <p style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.3px" }}>🖼 Wallpaper</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Personalize your focus space</p>
              </div>
              <button style={{ ...btnBase, background:"transparent", border:"none", color:"rgba(255,255,255,.2)", fontSize:18 }}
                onClick={()=>setShowWpPanel(false)}>✕</button>
            </div>

            {/* Feature 6: Category tabs */}
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
              {Object.keys(WALLPAPER_CATEGORIES).map(cat=>(
                <button key={cat} style={{
                  ...btnBase, padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600,
                  background: wpCategory===cat ? "rgba(167,139,250,.2)" : "rgba(255,255,255,.04)",
                  border: wpCategory===cat ? "1px solid rgba(167,139,250,.4)" : "1px solid rgba(255,255,255,.08)",
                  color: wpCategory===cat ? "#a78bfa" : "rgba(255,255,255,.4)",
                }} onClick={()=>setWpCategory(cat)}>{cat}</button>
              ))}
            </div>

            {/* Presets grid for selected category */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:18 }}>
              {WALLPAPER_CATEGORIES[wpCategory].map(wp=>(
                <div key={wp.label} className="wp-preset" onClick={()=>applyPreset(wp.value)}
                  style={{
                    borderRadius:12, overflow:"hidden", aspectRatio:"16/9", position:"relative",
                    backgroundImage: wp.value !== "none" ? `url("${wp.value}")` : undefined,
                    backgroundSize:"cover", backgroundPosition:"center",
                    background: wp.value === "none" ? wp.preview : undefined,
                    border: wallpaper===wp.value ? "2px solid #a78bfa" : "2px solid transparent",
                  }}>
                  <div style={{
                    position:"absolute", inset:0,
                    background: wp.value==="none" ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.35)",
                    display:"flex", alignItems:"flex-end", padding:4,
                  }}>
                    <span style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.8)" }}>{wp.label}</span>
                  </div>
                  {wallpaper===wp.value && (
                    <div style={{ position:"absolute", top:4, right:4, width:14, height:14,
                      background:"#a78bfa", borderRadius:"50%",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:900 }}>✓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom URL */}
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
              color:"rgba(255,255,255,.3)", marginBottom:8 }}>Custom Image URL</p>
            <div style={{ display:"flex", gap:6, marginBottom:20 }}>
              <input type="text" placeholder="https://example.com/image.jpg"
                value={wpInputVal} onChange={e=>setWpInputVal(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&applyCustomUrl(wpInputVal)}
                style={{ flex:1, padding:"9px 12px", borderRadius:10, fontSize:12,
                  background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)",
                  color:"#fff", outline:"none", fontFamily:"inherit" }}/>
              <button style={{ ...btnBase, padding:"9px 14px", borderRadius:10,
                background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none",
                color:"#fff", fontWeight:700, fontSize:12 }}
                onClick={applyCustomUrl}>Apply</button>
            </div>

            {/* Feature 7: Video wallpaper */}
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
              color:"rgba(255,255,255,.3)", marginBottom:8 }}>Video Wallpaper (mp4 / webm)</p>
            <div style={{ display:"flex", gap:6, marginBottom:8 }}>
              <input type="text" placeholder="https://example.com/video.mp4"
                value={videoInputVal} onChange={e=>setVideoInputVal(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&applyVideoUrl(videoInputVal)}
                style={{ flex:1, padding:"9px 12px", borderRadius:10, fontSize:12,
                  background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)",
                  color:"#fff", outline:"none", fontFamily:"inherit" }}/>
              <button style={{ ...btnBase, padding:"9px 14px", borderRadius:10,
                background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none",
                color:"#fff", fontWeight:700, fontSize:12 }}
                onClick={() => applyVideoUrl(videoInputVal)}>Apply</button>
            </div>
            <button style={{ ...btnBase, width:"100%", padding:"10px 16px", borderRadius:10,
              background:"rgba(255,255,255,.04)", border:"1px dashed rgba(255,255,255,.15)",
              color:"rgba(255,255,255,.5)", fontSize:12, fontWeight:600, marginBottom:14 }}
              onClick={()=>videoInputRef.current?.click()}>
              🎬 Upload video file (MP4, WEBM)
            </button>
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm"
              style={{ display:"none" }} onChange={e => applyVideoFile(e.target.files?.[0])}/>

            {/* File upload */}
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
              color:"rgba(255,255,255,.3)", marginBottom:8 }}>Upload Image from Device</p>
            <button style={{ ...btnBase, width:"100%", padding:"11px 16px", borderRadius:10,
              background:"rgba(255,255,255,.04)", border:"1px dashed rgba(255,255,255,.15)",
              color:"rgba(255,255,255,.5)", fontSize:12, fontWeight:600, marginBottom:18 }}
              onClick={()=>fileInputRef.current?.click()}>
              📁 Choose image file (JPG, PNG, WEBP)
            </button>
            <input ref={fileInputRef} type="file" accept="image/*"
              style={{ display:"none" }} onChange={e => applyImageFile(e.target.files?.[0])}/>

            {/* Overlay darkness */}
            {hasBg && (
              <>
                <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
                  color:"rgba(255,255,255,.3)", marginBottom:8 }}>
                  Overlay Darkness — {Math.round(wpOverlay*100)}%
                </p>
                <input type="range" min={0} max={100} value={Math.round(wpOverlay*100)}
                  onChange={e=>setWpOverlay(Number(e.target.value)/100)}
                  style={{ width:"100%", accentColor:"#a78bfa", cursor:"pointer", marginBottom:4 }}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10,
                  color:"rgba(255,255,255,.25)", marginBottom:16 }}>
                  <span>Bright</span><span>Dark</span>
                </div>
              </>
            )}

            <div style={{ display:"flex", gap:8 }}>
              <button style={{ ...btnBase, flex:1, padding:11, borderRadius:10, border:"none",
                background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                color:"#fff", fontWeight:800, fontSize:13 }}
                onClick={()=>setShowWpPanel(false)}>Done</button>
              {hasBg && (
                <button style={{ ...btnBase, padding:"11px 14px", borderRadius:10,
                  background:"transparent", border:"1px solid rgba(255,255,255,.09)",
                  color:"rgba(255,255,255,.4)", fontSize:12 }}
                  onClick={()=>{ clearWallpaper(); }}>Remove</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {showEdit && (
        <div style={panelStyle} onClick={()=>setShowEdit(false)}>
          <div className="fu" onClick={e=>e.stopPropagation()} style={{
            width:"100%", maxWidth:380, background:"#0f0f1e",
            border:"1px solid rgba(167,139,250,.22)", borderRadius:22, padding:24,
            boxShadow:"0 0 60px rgba(167,139,250,.12)",
          }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <p style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.3px" }}>Edit Timer</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Timer will reset after saving.</p>
              </div>
              <button style={{ ...btnBase, background:"transparent", border:"none",
                color:"rgba(255,255,255,.2)", fontSize:18, padding:"2px 5px" }}
                onClick={()=>setShowEdit(false)}>✕</button>
            </div>
            {[
              { key:"focus", label:"Focus Session", color:"#34d399", max:90 },
              { key:"short", label:"Short Break",   color:"#60a5fa", max:30 },
              { key:"long",  label:"Long Break",    color:"#a78bfa", max:60 },
            ].map(item=>(
              <div key={item.key} style={{ marginBottom:20, padding:"14px 16px",
                background:"rgba(255,255,255,.025)",
                border:"1px solid rgba(255,255,255,.06)", borderRadius:14 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:item.color }}>{item.label}</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,.2)" }}>max {item.max} min</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="range" min={1} max={item.max} value={editVals[item.key]}
                    onChange={e=>clampEdit(item.key, e.target.value)}
                    style={{ flex:1, accentColor:item.color, cursor:"pointer" }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    {["-","+"].map((sym,si)=>(
                      <button key={sym} style={{ ...btnBase, width:26, height:26, borderRadius:7,
                        background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.09)",
                        color:"rgba(255,255,255,.5)", fontSize:14,
                        display:"flex", alignItems:"center", justifyContent:"center" }}
                        onClick={()=>clampEdit(item.key, editVals[item.key]+(si?1:-1))}>
                        {sym}
                      </button>
                    ))}
                    <input type="number" min={1} max={item.max} value={editVals[item.key]}
                      onChange={e=>clampEdit(item.key, e.target.value)}
                      style={{ width:44, padding:"4px 6px", textAlign:"center",
                        background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.09)",
                        borderRadius:7, color:item.color, fontSize:14,
                        fontWeight:800, fontFamily:"inherit", outline:"none" }}/>
                  </div>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.25)", fontWeight:600 }}>min</span>
                </div>
              </div>
            ))}
            <div style={{ display:"flex", gap:8, marginTop:16 }}>
              <button style={{ ...btnBase, flex:1, padding:12, borderRadius:10, border:"none",
                background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                color:"#fff", fontWeight:800, fontSize:13,
                boxShadow:"0 4px 18px rgba(124,58,237,.4)" }}
                onClick={() => saveSettings(editVals)}>Save & Reset</button>
              <button style={{ ...btnBase, padding:"12px 14px", borderRadius:10,
                background:"transparent", border:"1px solid rgba(255,255,255,.09)",
                color:"rgba(255,255,255,.4)", fontSize:13 }}
                onClick={()=>setShowEdit(false)}>Cancel</button>
              <button style={{ ...btnBase, padding:"12px 14px", borderRadius:10,
                background:"transparent", border:"1px solid rgba(255,255,255,.09)",
                color:"rgba(255,255,255,.3)", fontSize:11, fontWeight:600 }}
                onClick={()=>setEditVals({ focus:25, short:5, long:15 })}>Defaults</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MAIN ═══ */}
      <main style={{ position:"relative", zIndex:2, width:"100%", maxWidth:820, margin:"0 auto",
        padding:"28px clamp(14px,4vw,40px) 80px" }}>

        {/* Mode tabs */}
        <div className="fu" style={{ display:"flex", gap:8,
          justifyContent:"center", marginBottom:28, flexWrap:"wrap" }}>
          {modes.map((m,i)=>(
            <button key={m.key} className="mode-tab" onClick={()=>switchMode(i)} style={{
              ...btnBase, padding:"8px 20px", borderRadius:20,
              fontSize:12, fontWeight:700,
              background: modeIdx===i ? (accentColor ? `${accentColor}18` : m.pill) : "rgba(255,255,255,.03)",
              color:       modeIdx===i ? (accentColor || m.color) : "rgba(255,255,255,.3)",
              border:`1px solid ${modeIdx===i ? (accentColor ? `${accentColor}44` : m.border) : "rgba(255,255,255,.07)"}`,
              boxShadow:   modeIdx===i ? `0 0 16px ${accentColor ? accentColor+"44" : m.glow}` : "none",
              transition:"all 0.4s ease",
            }}>
              {m.label}
              <span style={{ fontSize:10, marginLeft:6,
                color: modeIdx===i ? `${accentColor || m.color}99` : "rgba(255,255,255,.2)" }}>
                {m.minutes}m
              </span>
            </button>
          ))}
        </div>

        {/* Ring card — Apple glass hero */}
<div className="fu fu1 pop" style={{
  padding:"clamp(34px,6vw,64px) clamp(20px,5vw,48px) 34px",
  marginBottom:28,
  borderRadius:40,
  background: hasBg
    ? `rgba(12,12,20,${0.56 + wpOverlay*0.22})`
    : "linear-gradient(145deg,rgba(255,255,255,.105),rgba(255,255,255,.045))",
  border:"1px solid rgba(255,255,255,.12)",
  backdropFilter:"blur(32px)",
  WebkitBackdropFilter:"blur(32px)",
  display:"flex",
  flexDirection:"column",
  alignItems:"center",
  position:"relative",
  overflow:"hidden",
  boxShadow: hasBg
    ? `0 28px 80px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.16), 0 0 70px ${effectiveGlow}`
    : `0 28px 80px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.16), 0 0 70px ${effectiveGlow}`,
}}>

          <div style={{ position:"absolute", top:-60, right:-60, width:240, height:240,
            borderRadius:"50%", pointerEvents:"none",
            background:`radial-gradient(circle,${effectiveGlow} 0%,transparent 70%)`,
            transition:"background 0.6s ease",
          }}/>

          <div style={{
  position:"relative",
  width:ringSize,
  height:ringSize,
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  filter:"drop-shadow(0 0 24px rgba(192,193,255,.24))",
}}>
            <Ring pct={pct} size={ringSize} stroke={10} color={mode.color} accentColor={accentColor}/>
            <div style={{ position:"absolute", inset:0, display:"flex",
              flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
              <span
  role="timer" aria-live="off"
  aria-label={formatTimerAriaLabel(seconds, mode.label)}
  style={{
    fontSize:"clamp(56px,14vw,86px)",
    fontWeight:800,
    letterSpacing:"-5px",
    lineHeight:1,
    color:"rgba(245,245,247,.96)",
    textShadow:`0 0 42px ${effectiveGlow}, 0 0 80px rgba(192,193,255,.18)`,
    fontVariantNumeric:"tabular-nums",
    transition:"text-shadow 0.6s ease",
  }}>
  {fmt(seconds)}
</span>
              <span style={{
  fontSize:12,
  fontWeight:850,
  letterSpacing:"0.22em",
  textTransform:"uppercase",
  color:"#4cd7f6",
  marginTop:4,
}}>
  {mode.label}
</span>
              {running && (
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                  <span className="pulse-dot" style={{ width:6, height:6, borderRadius:"50%",
                    background: accentColor || mode.color,
                    boxShadow:`0 0 8px ${accentColor || mode.color}` }}/>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:500 }}>
                    {Math.ceil(seconds/60)} min left
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Feature 5: Visualizer below timer */}
          <div style={{ marginTop:16, marginBottom:-4 }}>
            <Visualizer active={running} color={accentColor || mode.color}/>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginTop:20, zIndex:1 }}>
            <button className="ctrl" onClick={reset} style={{ ...btnBase, width:46, height:46,
              borderRadius:14, background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(255,255,255,.08)",
              color:"rgba(255,255,255,.4)", fontSize:18,
              display:"flex", alignItems:"center", justifyContent:"center" }}aria-label="Reset timer">↺</button>
            <button
               className="ctrl"
                onClick={toggle}
                aria-label={running ? "Pause timer" : "Start timer"}
                style={{
               ...btnBase,
               width:72,
                height:72,
                 borderRadius:"50%",
                  background: running
                 ? "rgba(255,255,255,.06)"
                  : `linear-gradient(135deg,${accentColor||mode.color},${(accentColor||mode.color)}bb)`,
                  border:`2px solid ${running ? "rgba(255,255,255,.12)" : (accentColor||mode.color)}`,
                  color: running ? (accentColor||mode.color) : "#000",
                  fontSize:22,
                  fontWeight:800,
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  boxShadow: running ? "none" : `0 0 28px ${effectiveGlow}`,
                  transition:"all 0.3s ease",
                  }}
                  >{running ? "⏸" : "▶"}</button>
            <button className="ctrl" onClick={skip} style={{ ...btnBase, width:46, height:46,
              borderRadius:14, background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(255,255,255,.08)",
              color:"rgba(255,255,255,.4)", fontSize:18,
              display:"flex", alignItems:"center", justifyContent:"center" }}aria-label="Skip to next mode">⏭</button>
          </div>
        </div>

        {/* Stats — Feature 2: glassmorphism */}
        <div className="fu fu2" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label:"Sessions",    val:sessions,                        color:"#34d399", glow:"rgba(52,211,153,.2)"  },
            { label:"Full Cycles", val:cycles,                          color:"#a78bfa", glow:"rgba(167,139,250,.2)" },
            { label:"Focus Time",  val:`${sessions*modes[0].minutes}m`, color:"#60a5fa", glow:"rgba(96,165,250,.2)"  },
          ].map(stat=>(
            <div key={stat.label} style={{ ...glassCard, padding:"16px 12px", textAlign:"center",
              marginBottom:0, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, borderRadius:20,
                background:`radial-gradient(circle at 50% 0%,${stat.glow} 0%,transparent 70%)`,
                pointerEvents:"none" }}/>
              <p style={{ fontSize:"clamp(22px,6vw,32px)", fontWeight:900, letterSpacing:"-1px",
                color:stat.color, textShadow:`0 0 24px ${stat.color}55`,
                marginBottom:5, position:"relative" }}>{stat.val}</p>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em",
                textTransform:"uppercase", color:"rgba(255,255,255,.22)", position:"relative" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Timer setup card — Feature 2: glassmorphism */}
        <div className="fu fu3" style={{ ...glassCard, padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10,
                background:"linear-gradient(135deg,rgba(167,139,250,.2),rgba(244,114,182,.15))",
                border:"1px solid rgba(167,139,250,.2)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⏱</div>
              <div>
                <p style={{ fontSize:13, fontWeight:700 }}>Timer Setup</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:1 }}>
                  long break after 4 focus sessions
                </p>
              </div>
            </div>
            <button style={{ ...btnBase, padding:"5px 12px", borderRadius:9,
              background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)",
              color:"rgba(255,255,255,.35)", fontSize:11, fontWeight:600 }}
              onClick={openEdit}>Edit ✎</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {modes.map((m,i)=>(
              <div key={m.key} style={{ padding:"12px 10px",
                background:"rgba(255,255,255,.025)",
                border:`1px solid ${modeIdx===i ? (accentColor ? `${accentColor}44` : m.border) : "rgba(255,255,255,.05)"}`,
                borderRadius:12, textAlign:"center",
                boxShadow: modeIdx===i ? `0 0 12px ${effectiveGlow}` : "none",
                transition:"border-color 0.4s ease, box-shadow 0.4s ease",
              }}>
                <p style={{ fontSize:22, fontWeight:900, color: modeIdx===i ? (accentColor||m.color) : m.color,
                  letterSpacing:"-0.5px", textShadow:`0 0 16px ${(accentColor||m.color)}55`,
                  transition:"color 0.4s ease" }}>{m.minutes}m</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontWeight:500, marginTop:3 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Session log */}
        {log.length > 0 && (
          <div className="fu fu4" style={{ ...glassCard, padding:"18px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:10,
                background:"linear-gradient(135deg,rgba(96,165,250,.2),rgba(167,139,250,.15))",
                border:"1px solid rgba(96,165,250,.2)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📋</div>
              <div>
                <p style={{ fontSize:13, fontWeight:700 }}>Session Log</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:1 }}>{log.length} entries today</p>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {log.map((entry,i)=>(
                <div key={i} className="log-row" style={{ animationDelay:`${i*0.04}s`,
                  padding:"9px 12px", borderRadius:10,
                  background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)",
                  fontSize:12, fontWeight:500,
                  color: entry.startsWith("✓") ? "#34d399" : "rgba(255,255,255,.4)" }}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
         )}
      </main>
    </div>
   );
}