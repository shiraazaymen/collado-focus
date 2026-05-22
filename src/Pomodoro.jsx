import { useState, useEffect, useRef } from "react";
import { usePomodoroTimer } from "./hooks/usePomodoroTimer";
import { usePersistentPomodoro,usePersistSnapshot } from "./hooks/useLocalStorage";
import { useWallpaper } from "./hooks/useWallpaper";
import { useAmbientAudio } from "./hooks/useAmbientAudio";
import { useFloatingPlayer } from "./hooks/useFloatingPlayer";
import { STORAGE_KEYS } from "./utils/constants";
import { formatTime, formatTimerAriaLabel } from "./utils/formatters";
import { glassCardStyle, BTN_BASE,PANEL_BACKDROP } from "./styles/tokens";
import "./styles/glassmorphism.css";
import WallpaperBackground from "./components/wallpaper/WallpaperBackground";
import { getFocusDayBounds, isSessionInFocusDay, parseTimeInputToMinutes, formatMinutesToTimeInput,} from "./utils/focusDay";
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
        style={{ transition:"stroke-dashoffset .24s ease, stroke .2s ease" }}/>
    </svg>
  );
}

// Feature 5: Lo-fi audio visualizer bars
function Visualizer({ active, color }){
  const bars = [3,6,9,5,8,4,7,3,6,9,5,8,4,7,3,6];
  return(
    <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:18, opacity: active ? 0.85 : 0.2, transition:"opacity .18s ease" }}>
      {bars.map((h,i)=>(
        <div key={i} style={{
          width:2, borderRadius:2,
          background: color,
          height: active ? `${h+2}px` : "3px",
          animation: active ? `vizBar${i%4} ${0.8+i*0.07}s ease-in-out infinite alternate` : "none",
          transition:"height .18s ease",
        }}/>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Pomodoro({ onNavigate }) {
  // ── Core timer state ──
const { initialValues } = usePersistentPomodoro();
const [focusDayStartMinutes, setFocusDayStartMinutes] = useState(
  () => initialValues.focusDayStartMinutes ?? 0
);
const {
  modes, modeIdx, seconds, running, sessions, cycles, log, mode,
  modeRemaining,
  total, toggle, reset, skip, switchMode, saveSettings,
  editSessionLabel,
} = usePomodoroTimer({
  initialModes:   initialValues.modes,
  initialModeIdx: initialValues.modeIdx,
  initialValues,
  focusDayStartMinutes,
});
  const [showEdit, setShowEdit] = useState(false);
  const [sessionLogOpen, setSessionLogOpen] = useState(false);
  const [editVals, setEditVals] = useState({ focus:25, short:5, long:15 });
  const [editingId,   setEditingId]   = useState(null);
  const [editingText, setEditingText] = useState("");

  // ── Wallpaper state (Feature 1 + 4 + 7) ──
  const [showWpPanel, setShowWpPanel] = useState(false);
  const [wpCategory,    setWpCategory]    = useState("Nature");
  const fileInputRef  = useRef(null);
  const {
  wallpaper, customWpUrl, videoWpUrl, wpOverlay, hasBg,
  prevWallpaper, prevVisible, nextLoaded, accentColor,
  applyPreset, applyImageFile, clearWallpaper,
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
  const focusDayBounds = getFocusDayBounds(new Date(), focusDayStartMinutes);
  const todayLog = log.filter(entry =>
    typeof entry === "string" || isSessionInFocusDay(entry.completedAt, focusDayBounds)
  );
  const sessionObjects = todayLog.filter(entry => typeof entry !== "string");
  const focusSessionCount = sessionObjects.filter(entry => entry.mode === "focus").length;
  const breakSessionCount = todayLog.filter(entry =>
    typeof entry === "string"
      ? entry.toLowerCase().includes("break")
      : entry.mode && entry.mode !== "focus"
  ).length;
  const focusSecondsToday = sessionObjects
    .filter(entry => entry.mode === "focus")
    .reduce((sum, entry) => sum + (Number(entry.seconds) || modes[0].minutes * 60), 0);
  const longestSessionSeconds = sessionObjects.reduce(
    (max, entry) => Math.max(max, Number(entry.seconds) || 0),
    0
  );
  const latestSessionPreview = todayLog[0];
  const focusDayRangeLabel = `${new Date(focusDayBounds.start).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })} - ${new Date(focusDayBounds.end).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}`;

  function formatSessionDuration(totalSeconds = 0) {
    const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${minutes || Math.ceil(safeSeconds / 60) || 0}m`;
  }

  function getSessionLabel(entry) {
    if (typeof entry === "string") return entry;
    return entry.customLabel || entry.subject || entry.label || entry.mode || "Session";
  }

  function getSessionModeMeta(entry) {
    const modeKey = typeof entry === "string" ? "break" : entry.mode;
    if (modeKey === "focus") return { label:"Focus", color:"#34d399" };
    if (modeKey === "long") return { label:"Long Break", color:"#a78bfa" };
    if (modeKey === "short") return { label:"Short Break", color:"#60a5fa" };
    return { label:"Break", color:"#60a5fa" };
  }

  function getSessionTime(entry) {
    if (typeof entry === "string" || !entry.completedAt) return "";
    return new Date(entry.completedAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  }

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
  [STORAGE_KEYS.FOCUS_DAY_START]: String(focusDayStartMinutes),
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
    setEditVals({ focus:modes[0].minutes, short:modes[1].minutes, long:modes[2].minutes, focusDayStartMinutes });
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
  top:14,
  zIndex:50,

  width:"calc(100% - 32px)",
  maxWidth:1120,
  height:64,
  margin:"14px auto 28px",

  padding:"0 clamp(18px,4vw,28px)",
  boxSizing:"border-box",

  display:"flex",
  alignItems:"center",
  justifyContent:"space-between",
  gap:16,

  borderRadius:32,
  overflow:"hidden",

  background:"linear-gradient(145deg,rgba(255,255,255,.105),rgba(255,255,255,.055))",
  backdropFilter:"blur(30px)",
  WebkitBackdropFilter:"blur(30px)",

  border:"1px solid rgba(255,255,255,.13)",
  boxShadow:"inset 0 1px 0 rgba(255,255,255,.16), 0 18px 55px rgba(0,0,0,.28)",
}}>

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
              {sessions} done 
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
        <div className="wallpaper-modal-backdrop" style={panelStyle} onClick={()=>setShowWpPanel(false)}>
          <div className="fu wallpaper-modal-panel glass-panel" onClick={e=>e.stopPropagation()}>
            <div className="wallpaper-modal-header">
              <div>
                <p style={{ fontSize:18, fontWeight:800, letterSpacing:"-0.4px", color:"rgba(245,245,247,.95)" }}>Wallpaper</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.36)", marginTop:4 }}>Personalize your focus space</p>
              </div>
              <button className="wallpaper-close-btn" style={btnBase}
                onClick={()=>setShowWpPanel(false)}>✕</button>
            </div>

            {/* Feature 6: Category tabs */}
            <div className="wallpaper-category-tabs">
              {Object.keys(WALLPAPER_CATEGORIES).map(cat=>(
                <button key={cat} className={`wallpaper-category-pill ${wpCategory===cat ? "is-active" : ""}`} style={btnBase} onClick={()=>setWpCategory(cat)}>{cat}</button>
              ))}
            </div>

            {/* Presets grid for selected category */}
            <div key={wpCategory} className="wallpaper-grid-flow">
              {WALLPAPER_CATEGORIES[wpCategory].map(wp=>(
                <div key={wp.label} className={`wp-preset glass-card-soft glass-card-hover ${wallpaper===wp.value ? "is-selected" : ""}`} onClick={()=>applyPreset(wp.value)}
                  style={{
                    overflow:"hidden", aspectRatio:"16/9", position:"relative",
                    backgroundImage: wp.value !== "none" ? `url("${wp.value}")` : undefined,
                    backgroundSize:"cover", backgroundPosition:"center",
                    background: wp.value === "none" ? wp.preview : undefined,
                  }}>
                  <div className="wallpaper-preset-overlay">
                    <span>{wp.label}</span>
                  </div>
                  {wallpaper===wp.value && (
                    <div className="wallpaper-selected-check">✓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom URL */}
            {/* File upload */}
            <div className="wallpaper-upload-section">
              <p className="wallpaper-section-label">Custom Wallpaper</p>
              <p className="wallpaper-section-helper">Recommended: 1920×1080 or higher, 16:9 ratio, JPG/PNG/WEBP, max 5MB.</p>
              <button className="wallpaper-upload-card" style={btnBase}
                onClick={()=>fileInputRef.current?.click()}>
                <span className="wallpaper-upload-icon">+</span>
                <span>Choose image file</span>
                <small>JPG, PNG, WEBP</small>
              </button>
              {customWpUrl && (
                <button className="wallpaper-clear-upload-btn" style={btnBase}
                  onClick={clearWallpaper}>Clear uploaded wallpaper</button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display:"none" }} onChange={e => applyImageFile(e.target.files?.[0])}/>

            {/* Overlay darkness */}
            {hasBg && (
              <>
                <div className="wallpaper-atmosphere-heading">
                  <div>
                    <p className="wallpaper-section-label">Atmosphere</p>
                    <p className="wallpaper-section-helper">Overlay darkness</p>
                  </div>
                  <span>{Math.round(wpOverlay*100)}%</span>
                </div>
                <input type="range" min={0} max={100} value={Math.round(wpOverlay*100)}
                  onChange={e=>setWpOverlay(Number(e.target.value)/100)}
                  className="glass-slider wallpaper-overlay-slider"
                  style={{ "--slider-color":"#c0c1ff" }}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10,
                  color:"rgba(255,255,255,.25)", marginBottom:16 }}>
                  <span>Bright</span><span>Dark</span>
                </div>
              </>
            )}

            <div className="wallpaper-actions">
              <button className="wallpaper-done-btn" style={btnBase}
                onClick={()=>setShowWpPanel(false)}>Done</button>
              {hasBg && (
                <button className="wallpaper-remove-btn" style={btnBase}
                  onClick={()=>{ clearWallpaper(); }}>Remove</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {showEdit && (
        <div style={panelStyle} onClick={()=>setShowEdit(false)}>
          <div className="fu edit-modal-panel glass-panel" onClick={e=>e.stopPropagation()} style={{
            boxShadow: `0 24px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.12), 0 0 35px ${effectiveGlow || "rgba(192, 193, 255, 0.15)"}`,
          }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <p style={{ fontSize:18, fontWeight:800, letterSpacing:"-0.4px", color:"rgba(255,255,255,0.95)" }}>Edit Timer</p>
                <p style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:4 }}>The timer will be reset upon saving.</p>
              </div>
              <button className="edit-modal-close" style={btnBase} onClick={()=>setShowEdit(false)}>✕</button>
            </div>
            {[
              { key:"focus", label:"Focus Session", color:"#34d399", max:90 },
              { key:"short", label:"Short Break",   color:"#60a5fa", max:30 },
              { key:"long",  label:"Long Break",    color:"#a78bfa", max:60 },
            ].map(item=>(
              <div key={item.key} className="edit-timer-card glass-card-soft">
                <div className="edit-timer-card-header">
                  <span style={{ fontSize:13, fontWeight:700, color:item.color }}>{item.label}</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,.2)" }}>max {item.max} min</span>
                </div>
                <div className="edit-timer-card-body">
                  <input type="range" min={1} max={item.max} value={editVals[item.key]}
                    onChange={e=>clampEdit(item.key, e.target.value)}
                    className="glass-slider"
                    style={{
                      '--slider-color': item.color
                    }}/>
                  <div className="edit-timer-controls">
                    {["-","+"].map((sym,si)=>(
                      <button key={sym}
                        className="edit-timer-btn"
                        style={btnBase}
                        onClick={()=>clampEdit(item.key, editVals[item.key]+(si?1:-1))}>
                        {sym}
                      </button>
                    ))}
                    <input type="number" min={1} max={item.max} value={editVals[item.key]}
                      onChange={e=>clampEdit(item.key, e.target.value)}
                      className="apple-number-input"/>
                    <span className="min-label">min</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Focus day start */}
            <div className="edit-timer-card glass-card-soft">
              <div style={{ display:"flex", alignItems:"center",
                justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#f0abfc" }}>Focus Day Starts At</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,.25)" }}>24-hour window</span>
              </div>
              <input type="time"
                value={formatMinutesToTimeInput(editVals.focusDayStartMinutes ?? focusDayStartMinutes)}
                onChange={e => setEditVals(v => ({
                  ...v, focusDayStartMinutes: parseTimeInputToMinutes(e.target.value),
                }))}
                className="glass-time-input"/>
              <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", marginTop:8, lineHeight: 1.4 }}>
                Sessions completed before this time will count toward the previous focus day.
              </p>
            </div>

            <div className="edit-modal-actions">
              <button
                className="btn-save-reset"
                style={{
                  ...btnBase,
                  background: accentColor 
                    ? `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`
                    : "linear-gradient(135deg, #7c3aed, #a855f7)",
                  boxShadow: `0 8px 24px ${accentColor ? accentColor + "55" : "rgba(124,58,237,.35)"}, inset 0 1px 0 rgba(255,255,255,.2)`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 12px 28px ${accentColor ? accentColor + "77" : "rgba(124,58,237,.45)"}, inset 0 1px 0 rgba(255,255,255,.2)`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor ? accentColor + "55" : "rgba(124,58,237,.35)"}, inset 0 1px 0 rgba(255,255,255,.2)`;
                }}
                onClick={() => {
                  if (editVals.focusDayStartMinutes !== undefined)
                    setFocusDayStartMinutes(editVals.focusDayStartMinutes);
                  saveSettings(editVals);
                  setShowEdit(false);
                }}>Save & Reset</button>
              <button
                className="btn-cancel"
                style={btnBase}
                onClick={()=>setShowEdit(false)}>Cancel</button>
              <button
                className="btn-defaults"
                style={btnBase}
                onClick={()=>setEditVals({ focus:25, short:5, long:15, focusDayStartMinutes:0 })}>Defaults</button>
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
                transition:"background .14s ease, border-color .14s ease, color .14s ease, box-shadow .14s ease, transform .14s ease",
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
<div className="fu fu1 pop glass-card--elevated collado-main-timer-card" style={{
  "--pomo-glow": effectiveGlow,
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
            transition:"background .2s ease",
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
    transition:"text-shadow .2s ease",
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
                  transition:"background .14s ease, border-color .14s ease, color .14s ease, box-shadow .14s ease, transform .14s ease",
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
            <div key={stat.label} className="glass-card-soft glass-card-hover collado-stat-card" style={{ ...glassCard, padding:"16px 12px", textAlign:"center",
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
        <div className="fu fu3 glass-card collado-section-card" style={{ ...glassCard, padding:"20px 22px" }}>
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
              <div key={m.key} className="glass-card-soft collado-mode-mini-card" style={{ padding:"12px 10px",
                background:"rgba(255,255,255,.025)",
                border:`1px solid ${modeIdx===i ? (accentColor ? `${accentColor}44` : m.border) : "rgba(255,255,255,.05)"}`,
                borderRadius:12, textAlign:"center",
                boxShadow: modeIdx===i ? `0 0 12px ${effectiveGlow}` : "none",
                transition:"border-color .16s ease, box-shadow .16s ease",
              }}>
                <p style={{ fontSize:22, fontWeight:900, color: modeIdx===i ? (accentColor||m.color) : m.color,
                  letterSpacing:"-0.5px", textShadow:`0 0 16px ${(accentColor||m.color)}55`,
                  transition:"color .14s ease" }}>{m.minutes}m</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontWeight:500, marginTop:3 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Session log */}
        {(
          <div className={`fu fu4 session-log-shell ${sessionLogOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="session-log-header"
              aria-expanded={sessionLogOpen}
              onClick={() => setSessionLogOpen(open => !open)}
              style={btnBase}>
              <span className="session-log-icon">▦</span>
              <span className="session-log-title-block">
                <span className="session-log-title">Session Log</span>
                <span className="session-log-subtitle">Today's focus history</span>
                <span className="session-log-preview">
                  {focusSessionCount} {focusSessionCount === 1 ? "session" : "sessions"} · {formatSessionDuration(focusSecondsToday)} focused
                  {latestSessionPreview ? ` · latest: ${getSessionLabel(latestSessionPreview)}` : ""}
                </span>
              </span>
              <span className="session-log-range">{focusDayRangeLabel}</span>
              <span className="session-log-chevron">⌄</span>
            </button>

            {sessionLogOpen && (
              <div className="session-log-content">
                <div className="session-log-summary-grid">
                  <div className="session-log-stat">
                    <span>{focusSessionCount}</span>
                    <p>Focus sessions</p>
                  </div>
                  <div className="session-log-stat">
                    <span>{formatSessionDuration(focusSecondsToday)}</span>
                    <p>Total focus time</p>
                  </div>
                  <div className="session-log-stat">
                    <span>{breakSessionCount}</span>
                    <p>Breaks completed</p>
                  </div>
                  <div className="session-log-stat">
                    <span>{formatSessionDuration(longestSessionSeconds)}</span>
                    <p>Longest session</p>
                  </div>
                </div>

                {todayLog.length === 0 ? (
                  <div className="session-log-empty">
                    No sessions yet. Complete a focus session and it'll appear here.
                  </div>
                ) : (
            <div className="session-log-list">
              {todayLog.map((entry, i) => {
                // legacy string
                if (typeof entry === "string") return (
                  <div key={i} className="session-log-row is-legacy" style={{ animationDelay:`${i*0.04}s`,
                    color: entry.startsWith("✓") ? "#34d399" : "rgba(255,255,255,.4)" }}>
                    {entry}
                  </div>
                );
                // object entry
                const isFocus    = entry.mode === "focus";
                const isEditing  = editingId === entry.id;
                const display    = getSessionLabel(entry);
                const timeStr    = getSessionTime(entry);
                const meta       = getSessionModeMeta(entry);
                return (
                  <div key={entry.id} className="session-log-row"
                    style={{ animationDelay:`${i*0.04}s`, "--session-color":meta.color,
                      padding:"9px 12px", borderRadius:10,
                      background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)",
                      display:"flex", alignItems:"center", gap:8 }}>
                    <span className="session-log-mode-dot"/>
                    {isEditing ? (
                      <>
                        <input autoFocus value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter")  { editSessionLabel(entry.id, editingText); setEditingId(null); }
                            if (e.key === "Escape") { setEditingId(null); }
                          }}
                          placeholder={entry.label}
                          style={{ flex:1, background:"rgba(255,255,255,.08)",
                            border:"1px solid rgba(255,255,255,.12)", borderRadius:18,
                            color:"rgba(245,245,247,.95)", fontSize:12, fontWeight:500,
                            padding:"6px 14px", outline:"none", fontFamily:"inherit",
                            boxShadow:"inset 0 1px 2px rgba(0,0,0,0.2)", minWidth:0 }}/>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => {
                              editSessionLabel(entry.id, editingText);
                              setEditingId(null);
                            }}
                            style={{
                              ...btnBase,
                              padding: "6px 12px",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: accentColor ? `${accentColor}18` : "rgba(167,139,250,.15)",
                              border: `1px solid ${accentColor ? `${accentColor}44` : "rgba(167,139,250,.3)"}`,
                              color: accentColor || "#a78bfa",
                              boxShadow: "inset 0 1px 0 rgba(255,255,255,.1)",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = accentColor ? `${accentColor}33` : "rgba(167,139,250,.25)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = accentColor ? `${accentColor}18` : "rgba(167,139,250,.15)";
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              ...btnBase,
                              padding: "6px 12px",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: "rgba(255,255,255,.05)",
                              border: "1px solid rgba(255,255,255,.1)",
                              color: "rgba(255,255,255,.5)",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "rgba(255,255,255,.1)";
                              e.currentTarget.style.color = "rgba(255,255,255,.7)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "rgba(255,255,255,.05)";
                              e.currentTarget.style.color = "rgba(255,255,255,.5)";
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <span onClick={() => { if (!isFocus) return; setEditingId(entry.id); setEditingText(entry.customLabel || entry.subject || ""); }}
                        style={{ flex:1, fontSize:12, fontWeight:500,
                          color: isFocus ? "#34d399" : "rgba(255,255,255,.4)",
                          cursor: isFocus ? "text" : "default" }}>
                        {isFocus ? `✓ ${display}` : display}
                      </span>
                    )}
                    <span className="session-log-mode-label">{meta.label}</span>
                    <span className="session-log-time">{timeStr}</span>
                    <span className="session-log-duration">{formatSessionDuration(entry.seconds)}</span>
                    {isFocus && !isEditing && (
                      <span onClick={() => { setEditingId(entry.id); setEditingText(entry.customLabel || entry.subject || ""); }}
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,.2)",
                          cursor: "pointer",
                          flexShrink: 0,
                          transition: "color 0.2s ease, opacity 0.2s ease",
                          padding: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          opacity: 0.5,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = accentColor || "#4cd7f6";
                          e.currentTarget.style.opacity = "1";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = "rgba(255,255,255,.2)";
                          e.currentTarget.style.opacity = "0.5";
                        }}
                        title="Edit label">✎</span>
                    )}
                  </div>
                );
              })}
            </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
   );
}
