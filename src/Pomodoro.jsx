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
// CONSTANTS

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
    { label:"Cafe Books",  value:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=80", preview:"#4a3520" },
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
  { key:"rain",      label:"ðŸŒ§ Rain",      src:"https://cdn.freesound.org/previews/346/346170_5121236-lq.mp3" },
  { key:"thunder",   label:"Thunder",   src:"https://cdn.freesound.org/previews/398/398735_7364899-lq.mp3" },
  { key:"cafe",      label:"Cafe",      src:"https://cdn.freesound.org/previews/537/537161_7723148-lq.mp3" },
  { key:"fireplace", label:"ðŸ”¥ Fire",      src:"https://cdn.freesound.org/previews/476/476521_9509445-lq.mp3" },
  { key:"keyboard",  label:"Keys",      src:"https://cdn.freesound.org/previews/242/242401_4495061-lq.mp3" },
];

// HELPERS

function fmt(s){ return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

function safeText(value, fallback = "") {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

// SUBCOMPONENTS

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

// MAIN COMPONENT

export default function Pomodoro({ onNavigate }) {
  // Core timer state
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
  const [resetAnimating, setResetAnimating] = useState(false);
  const [legalModal, setLegalModal] = useState(null);
  const resetAnimationTimeoutRef = useRef(null);

  // Wallpaper state
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

  // Refs
  const intervalRef = useRef(null);

  // Computed
  const displayModes = modes.map((m, i) => {
    const fallback = DEFAULT_MODES[i] || DEFAULT_MODES[0];
    return {
      ...fallback,
      ...m,
      key: safeText(m?.key, fallback.key),
      label: safeText(m?.label, fallback.label),
      minutes: Number(m?.minutes) || fallback.minutes,
      color: safeText(m?.color, fallback.color),
      glow: safeText(m?.glow, fallback.glow),
      pill: safeText(m?.pill, fallback.pill),
      border: safeText(m?.border, fallback.border),
    };
  });
  const displayMode = displayModes[modeIdx] || displayModes[0] || DEFAULT_MODES[0];
  const pct      = ((total - seconds) / total) * 100;
  const ringSize =  Math.min(260, window.innerWidth - 80);
  const focusDayBounds = getFocusDayBounds(new Date(), focusDayStartMinutes);
  const visibleSessions = log.filter(entry =>
    isSessionInFocusDay(getSessionTimestamp(entry), focusDayBounds)
  );
  const todayLog = visibleSessions;
  const sessionObjects = visibleSessions.filter(entry => typeof entry !== "string");
  const focusSessionCount = sessionObjects.filter(entry => entry.mode === "focus").length;
  const breakSessionCount = todayLog.filter(entry =>
    typeof entry === "string"
      ? entry.toLowerCase().includes("break")
      : entry.mode && entry.mode !== "focus"
  ).length;
  const focusSecondsToday = sessionObjects
    .filter(entry => entry.mode === "focus")
    .reduce((sum, entry) => sum + getSessionSeconds(entry), 0);
  const longestSessionSeconds = sessionObjects.reduce(
    (max, entry) => Math.max(max, getSessionSeconds(entry)),
    0
  );
  const latestSessionPreview = visibleSessions[0];
  const focusDayRangeLabel = `${new Date(focusDayBounds.startMs).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })} - ${new Date(focusDayBounds.endMs).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}`;

  function formatSessionDuration(totalSeconds = 0) {
    const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    if (safeSeconds > 0 && safeSeconds < 60) return "<1 min";
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.round((safeSeconds % 3600) / 60);
    if (hours && minutes) return `${hours}h ${minutes} min`;
    if (hours) return `${hours}h`;
    return `${minutes || 0} min`;
  }

  function cleanSessionText(text = "") {
    return String(text)
      .replace(/—/g, "-")
      .replace(/✓/g, "")
      .replace(/☕/g, "")
      .replace(/^[^A-Za-z0-9]+/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getSessionLabel(entry) {
    if (typeof entry === "string") {
      return cleanSessionText(entry).replace(/\s*[—-]\s*\d{1,2}:\d{2}.*$/i, "") || "Break ended";
    }
    const meta = getSessionModeMeta(entry);
    if (!entry.customLabel && !entry.subject && entry.mode === "focus") return "Focus session";
    if (!entry.customLabel && !entry.subject && (entry.mode === "short" || entry.mode === "long")) return meta.label;
    return cleanSessionText(entry.customLabel || entry.subject || entry.label || meta.label || "Focus session");
  }

  function getSessionTimestamp(entry) {
    if (!entry || typeof entry === "string") return null;
    return entry.completedAt || entry.createdAt || entry.timestamp || null;
  }

  function getSessionModeMeta(entry) {
    const modeKey = typeof entry === "string" ? "break" : entry.mode;
    if (modeKey === "focus") return { label:"Focus", color:"#34d399" };
    if (modeKey === "long") return { label:"Long Break", color:"#a78bfa" };
    if (modeKey === "short") return { label:"Short Break", color:"#60a5fa" };
    return { label:"Break", color:"#60a5fa" };
  }

  function getSessionTime(entry) {
    if (typeof entry === "string") {
      const match = cleanSessionText(entry).match(/(\d{1,2}:\d{2}\s?(?:am|pm|AM|PM)?)/);
      return match ? match[1].replace(/\s+/g, " ").toUpperCase() : "";
    }
    if (!entry.completedAt) return "";
    return new Date(entry.completedAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  }

  function getSessionSeconds(entry) {
    if (typeof entry === "string") return DEFAULT_MODES[1].minutes * 60;
    if (Number(entry.durationSeconds)) return Number(entry.durationSeconds);
    if (Number(entry.seconds)) return Number(entry.seconds);
    if (entry.mode === "long") return DEFAULT_MODES[2].minutes * 60;
    if (entry.mode === "short") return DEFAULT_MODES[1].minutes * 60;
    return DEFAULT_MODES[0].minutes * 60;
  }

  function getSessionDetail(entry) {
    const meta = getSessionModeMeta(entry);
    const suffix = meta.label === "Focus" ? "focused" : "break";
    return `${formatSessionDuration(getSessionSeconds(entry))} ${suffix}`;
  }

  function handleAnimatedReset() {
    window.clearTimeout(resetAnimationTimeoutRef.current);
    setResetAnimating(false);
    window.requestAnimationFrame(() => {
      setResetAnimating(true);
      resetAnimationTimeoutRef.current = window.setTimeout(() => setResetAnimating(false), 380);
    });
    reset();
  }

  const legalContent = legalModal === "privacy"
    ? {
        title: "Privacy Policy",
        paragraphs: [
          "CollaDO Focus does not require an account.",
          "Your timer settings, wallpaper preferences, focus-day settings, and session logs are stored locally in your browser.",
          "We do not upload your session history to a server.",
          "Uploaded wallpapers are stored locally in your browser and may be removed if browser data is cleared.",
          "If you use third-party embeds such as YouTube or Spotify, those services may process data according to their own privacy policies.",
          "Contact: collado.eni@gmail.com",
        ],
      }
    : legalModal === "terms"
      ? {
          title: "Terms of Use",
          paragraphs: [
            "CollaDO Focus is provided as a free productivity and focus tool.",
            "Local browser data may be lost if you clear browser storage, use private browsing, or change devices.",
            "You should only upload or use wallpaper/media content that you have the right to use.",
            "CollaDO Focus is provided as-is, without a guarantee of uninterrupted service or permanent local data storage.",
          ],
        }
      : null;

// Persist Snapshot
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
// Keyboard Shortcuts
useEffect(() => {
  function onKey(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space") { e.preventDefault(); toggle(); }
    if (e.key === "r" || e.key === "R") handleAnimatedReset();
    if (e.key === "s" || e.key === "S") skip();
    if (e.key === "1") switchMode(0);
    if (e.key === "2") switchMode(1);
    if (e.key === "3") switchMode(2);
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [toggle, reset, skip, switchMode]);

useEffect(() => {
  return () => window.clearTimeout(resetAnimationTimeoutRef.current);
}, []);

useEffect(() => {
  document.title = running
    ? `${formatTime(seconds)} — ${displayMode.label} · CollaDO`
    : "CollaDO · focus";
  return () => { document.title = "CollaDO"; };
}, [seconds, running, displayMode.label]);

  // Effective colors with accent override (Feature 8)
  const effectiveGlow   = accentColor ? `${accentColor}55` : displayMode.glow;
  const effectiveBorder = accentColor ? `${accentColor}44` : displayMode.border;

  function clampEdit(key,val){ setEditVals(e=>({...e,[key]:parseInt(val)||1})); }
  function openEdit(){
    setEditVals({ focus:displayModes[0].minutes, short:displayModes[1].minutes, long:displayModes[2].minutes, focusDayStartMinutes });
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
    minWidth:"100%",
    overflowX:"hidden",
    position:"relative",
  }}>
          {!hasBg && (
        <div aria-hidden="true" style={{
          position:"fixed",
          inset:0,
          width:"100vw",
          minHeight:"100vh",
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

      {/* TOPBAR */}
      <header className="focus-app-header" style={{
  position:"sticky",
  top:14,
  zIndex:50,

  width:"calc(100% - 32px)",
  maxWidth:1120,
  minHeight:64,
  margin:"14px auto 28px",

  padding:"0 clamp(18px,4vw,28px)",
  boxSizing:"border-box",

  display:"flex",
  alignItems:"center",
  alignContent:"center",
  justifyContent:"space-between",
  flexWrap:"wrap",
  gap:16,

  borderRadius:32,
  overflow:"visible",

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
        <div className="focus-header-actions" style={{ marginLeft:"auto" }}>
          {focusSessionCount > 0 && (
            <span className="focus-nav-status">
              {focusSessionCount} done
            </span>
          )}
          <button
            type="button"
            className={`focus-nav-link ${showWpPanel ? "active" : ""}`}
            onClick={()=>setShowWpPanel(p=>!p)}
          >
            Wallpaper
          </button>
          <button
            type="button"
            className={`focus-nav-link ${showEdit ? "active" : ""}`}
            onClick={openEdit}
          >
            Edit
          </button>
        </div>
      </header>

      {/* WALLPAPER PANEL */}
      {showWpPanel && (
        <div className="wallpaper-modal-backdrop" style={panelStyle} onClick={()=>setShowWpPanel(false)}>
          <div className="fu wallpaper-modal-panel glass-panel" onClick={e=>e.stopPropagation()}>
            <div className="wallpaper-modal-header">
              <div>
                <p style={{ fontSize:18, fontWeight:800, letterSpacing:"-0.4px", color:"rgba(245,245,247,.95)" }}>Wallpaper</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.36)", marginTop:4 }}>Personalize your focus space</p>
              </div>
              <button className="wallpaper-close-btn" style={btnBase}
                onClick={()=>setShowWpPanel(false)}>×</button>
            </div>

            {/* Feature 6: Category tabs */}
            <div className="wallpaper-category-tabs">
              {Object.keys(WALLPAPER_CATEGORIES).map(cat=>(
                <button key={cat} className={`wallpaper-category-pill ${wpCategory===cat ? "is-active" : ""}`} style={btnBase} onClick={()=>setWpCategory(cat)}>{cat}</button>
              ))}
            </div>

            {/* Presets grid for selected category */}
            <div key={wpCategory} className="wallpaper-grid-flow">
              {WALLPAPER_CATEGORIES[wpCategory].map(wp=>{
                const isImage = typeof wp.value === "string" && /^https?:\/\//.test(wp.value);
                const fallbackColor = wp.preview || "#11131d";
                const previewBackground = isImage
                  ? `linear-gradient(to top, rgba(0,0,0,.72), rgba(0,0,0,.18), rgba(0,0,0,.05)), linear-gradient(145deg, ${fallbackColor}, rgba(255,255,255,.04)), url("${wp.value}")`
                  : `radial-gradient(circle at 18% 20%, rgba(192,193,255,.16), transparent 38%), radial-gradient(circle at 82% 76%, rgba(76,215,246,.10), transparent 40%), linear-gradient(145deg, ${fallbackColor}, #11131d 58%, rgba(255,255,255,.04))`;
                return (
                  <div key={wp.label} className={`wp-preset glass-card-soft glass-card-hover ${wallpaper===wp.value ? "is-selected" : ""}`} onClick={()=>applyPreset(wp.value)}
                    style={{
                      overflow:"hidden",
                      aspectRatio:"16/9",
                      position:"relative",
                      background:previewBackground,
                      backgroundSize:"cover, cover, cover",
                      backgroundPosition:"center",
                      backgroundRepeat:"no-repeat",
                    }}>
                    <div className="wallpaper-preset-overlay">
                      <span>{wp.label}</span>
                    </div>
                    {wallpaper===wp.value && (
                      <div className="wallpaper-selected-check">✓</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom URL */}
            {/* File upload */}
            <div className="wallpaper-upload-section">
              <p className="wallpaper-section-label">Custom Wallpaper</p>
              <p className="wallpaper-section-helper">Recommended: 1920x1080 or higher, 16:9 ratio, JPG/PNG/WEBP, max 5MB.</p>
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

      {legalContent && (
        <div className="legal-modal-backdrop" style={panelStyle} onClick={()=>setLegalModal(null)}>
          <section
            className="legal-modal-panel glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            onClick={e=>e.stopPropagation()}
          >
            <div className="legal-modal-header">
              <div>
                <p id="legal-modal-title" className="legal-modal-title">{legalContent.title}</p>
                <p className="legal-modal-subtitle">CollaDO Focus</p>
              </div>
              <button type="button" className="legal-modal-close" onClick={()=>setLegalModal(null)} aria-label="Close legal modal">&times;</button>
            </div>
            <div className="legal-modal-body">
              {legalContent.paragraphs.map(text => (
                <p key={text}>{text}</p>
              ))}
            </div>
          </section>
        </div>
      )}


      {/* EDIT MODAL */}
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
              <button className="edit-modal-close" style={btnBase} onClick={()=>setShowEdit(false)}>×</button>
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

      {/* MAIN */}
      <main style={{ position:"relative", zIndex:2, width:"100%", maxWidth:820, margin:"0 auto",
        padding:"28px clamp(14px,4vw,40px) 80px" }}>

        {/* Mode tabs */}
        <div className="fu" style={{ display:"flex", gap:8,
          justifyContent:"center", marginBottom:28, flexWrap:"wrap" }}>
          {displayModes.map((m,i)=>(
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
            <Ring pct={pct} size={ringSize} stroke={10} color={displayMode.color} accentColor={accentColor}/>
            <div style={{ position:"absolute", inset:0, display:"flex",
              flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
              <span
  role="timer" aria-live="off"
  aria-label={formatTimerAriaLabel(seconds, displayMode.label)}
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
  {displayMode.label}
</span>
              {running && (
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                  <span className="pulse-dot" style={{ width:6, height:6, borderRadius:"50%",
                    background: accentColor || displayMode.color,
                    boxShadow:`0 0 8px ${accentColor || displayMode.color}` }}/>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:500 }}>
                    {Math.ceil(seconds/60)} min left
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Feature 5: Visualizer below timer */}
          <div style={{ marginTop:16, marginBottom:-4 }}>
            <Visualizer active={running} color={accentColor || displayMode.color}/>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginTop:20, zIndex:1 }}>
            <button type="button" className="ctrl reset-control" onClick={handleAnimatedReset} style={{ ...btnBase, width:56, height:56,
              borderRadius:20, background:"rgba(255,255,255,.075)",
              border:"1px solid rgba(255,255,255,.12)",
              color:"rgba(245,245,247,.82)",
              display:"flex", alignItems:"center", justifyContent:"center" }} aria-label="Reset timer">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className={resetAnimating ? "reset-icon reset-icon-spin" : "reset-icon"}
                focusable="false"
              >
                <path
                  d="M19.5 11.5a7.5 7.5 0 1 0-2.2 5.3"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.5 5.2v6.3h-6.3"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
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
                  : `linear-gradient(135deg,${accentColor||displayMode.color},${(accentColor||displayMode.color)}bb)`,
                  border:`2px solid ${running ? "rgba(255,255,255,.12)" : (accentColor||displayMode.color)}`,
                  color: running ? (accentColor||displayMode.color) : "#000",
                  fontSize:22,
                  fontWeight:800,
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  boxShadow: running ? "none" : `0 0 28px ${effectiveGlow}`,
                  transition:"background .14s ease, border-color .14s ease, color .14s ease, box-shadow .14s ease, transform .14s ease",
                  }}
                  >{running ? (
  <svg
    aria-hidden="true"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ display: "block" }}
  >
    <rect x="7" y="5" width="3.8" height="14" rx="1.4" />
    <rect x="13.2" y="5" width="3.8" height="14" rx="1.4" />
  </svg>
) : (
  <svg
    aria-hidden="true"
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ display: "block", marginLeft: 2 }}
  >
    <path d="M8 6.5v11l9-5.5-9-5.5Z" />
  </svg>
)}</button>
            <button className="ctrl" onClick={skip} style={{ ...btnBase, width:46, height:46,
              borderRadius:14, background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(255,255,255,.08)",
              color:"rgba(255,255,255,.4)", fontSize:18,
              display:"flex", alignItems:"center", justifyContent:"center" }}aria-label="Skip to next mode">
  <svg
    aria-hidden="true"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ display: "block" }}
  >
    <path d="M4 7v10l8-5-8-5Z" />
    <path d="M13 7v10l7-5-7-5Z" />
    <rect x="20" y="7" width="2" height="10" rx="1" />
  </svg>
</button>
          </div>
        </div>

        {/* Stats — Feature 2: glassmorphism */}
        <div className="fu fu2" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label:"Sessions", val:focusSessionCount, color:"#34d399", glow:"rgba(52,211,153,.2)" },
            { label:"Full Cycles", val:cycles,                          color:"#a78bfa", glow:"rgba(167,139,250,.2)" },
            { label:"Focus Time",  val:`${sessions*displayModes[0].minutes}m`, color:"#60a5fa", glow:"rgba(96,165,250,.2)"  },
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
            <div className="timer-setup-heading">
              <div className="timer-setup-icon-tile" aria-hidden="true">
                <svg className="timer-setup-icon" viewBox="0 0 64 64" fill="none" focusable="false">
                  <rect x="24" y="5" width="16" height="8" rx="2.5" fill="currentColor"/>
                  <rect x="12" y="13" width="10" height="8" rx="2" transform="rotate(-38 12 13)" fill="currentColor" opacity=".78"/>
                  <rect x="43" y="7" width="10" height="8" rx="2" transform="rotate(38 43 7)" fill="currentColor" opacity=".78"/>
                  <circle cx="32" cy="35" r="23" stroke="currentColor" strokeWidth="6"/>
                  <path d="M32 35l10-12" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                  <circle cx="32" cy="35" r="4" fill="currentColor"/>
                  <path d="M21 51c6 4 15 5 24 1" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" opacity=".72"/>
                  {[0,1,2,3,4,5,6,7,8,9,10,11].map(tick => {
                    const angle = (tick * 30 - 90) * Math.PI / 180;
                    const x1 = 32 + Math.cos(angle) * 15.5;
                    const y1 = 35 + Math.sin(angle) * 15.5;
                    const x2 = 32 + Math.cos(angle) * 17.8;
                    const y2 = 35 + Math.sin(angle) * 17.8;
                    return (
                      <line
                        key={tick}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity=".72"
                      />
                    );
                  })}
                </svg>
              </div>
              <div>
                <p className="timer-setup-title">Timer Setup</p>
                <p className="timer-setup-subtitle">
                  long break after 4 focus sessions
                </p>
              </div>
            </div>
            <button style={{ ...btnBase, padding:"5px 12px", borderRadius:9,
              background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)",
              color:"rgba(255,255,255,.35)", fontSize:11, fontWeight:600 }}
              onClick={openEdit}>Edit</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {displayModes.map((m,i)=>(
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
              <span className="session-log-icon"></span>
              <span className="session-log-title-block">
                <span className="session-log-title">Session Log</span>
                <span className="session-log-subtitle">Today's focus history</span>
                <span className="session-log-preview">
                  {focusSessionCount > 0
                    ? `${focusSessionCount} ${focusSessionCount === 1 ? "session" : "sessions"} · ${formatSessionDuration(focusSecondsToday)} focused`
                    : "No focus sessions yet today."}
                </span>
                {latestSessionPreview && (
                  <span className="session-log-latest">Latest: {getSessionLabel(latestSessionPreview)}</span>
                )}
              </span>
              <span className="session-log-range">{focusDayRangeLabel}</span>
              <span className="session-log-chevron"></span>
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
                if (typeof entry === "string") {
                  const meta = getSessionModeMeta(entry);
                  const timeStr = getSessionTime(entry);
                  return (
                    <div key={i} className="session-log-row is-legacy" style={{ animationDelay:`${i*0.04}s`, "--session-color":meta.color }}>
                      <span className="session-log-row-icon" aria-hidden="true" />
                      <span className="session-log-row-main is-static">
                        <span className="session-log-row-title">{getSessionLabel(entry)}</span>
                        <span className="session-log-row-detail">{getSessionDetail(entry)}</span>
                      </span>
                      <span className="session-log-row-right">
                        {timeStr && <span className="session-log-time-pill">{timeStr}</span>}
                      </span>
                    </div>
                  );
                }

                const isEditing  = editingId === entry.id;
                const display    = getSessionLabel(entry);
                const timeStr    = getSessionTime(entry);
                const meta       = getSessionModeMeta(entry);
                return (
                  <div key={entry.id} className="session-log-row" style={{ animationDelay:`${i*0.04}s`, "--session-color":meta.color }}>
                    <span className="session-log-row-icon" aria-hidden="true" />
                    {isEditing ? (
                      <div className="session-log-edit-wrap">
                        <input autoFocus value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter")  { editSessionLabel(entry.id, editingText); setEditingId(null); }
                            if (e.key === "Escape") { setEditingId(null); }
                          }}
                          placeholder={entry.label || meta.label}
                          className="session-log-edit-input"/>
                        <div className="session-log-edit-actions">
                          <button type="button" className="session-log-edit-save"
                            onClick={() => {
                              editSessionLabel(entry.id, editingText);
                              setEditingId(null);
                            }}>
                            Save
                          </button>
                          <button type="button" className="session-log-edit-cancel"
                            onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button type="button" className="session-log-row-main"
                          onClick={() => { setEditingId(entry.id); setEditingText(entry.customLabel || entry.subject || ""); }}>
                          <span className="session-log-row-title">{display}</span>
                          <span className="session-log-row-detail">{getSessionDetail(entry)}</span>
                        </button>
                        <span className="session-log-row-right">
                          <span className="session-log-mode-label">{meta.label}</span>
                          {timeStr && <span className="session-log-time-pill">{timeStr}</span>}
                          <button type="button" className="session-log-edit-button"
                            onClick={() => { setEditingId(entry.id); setEditingText(entry.customLabel || entry.subject || ""); }}
                            title="Edit label">Edit</button>
                        </span>
                      </>
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

        <p className="focus-more-footer">
          More from CollaDO:{" "}
          <a
            href="https://collado.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="collado-track-footer-link"
          >
            CollaDO Track
          </a>
          {" "}for attendance, tasks, and deadlines.
        </p>

        <footer className="focus-legal-footer">
          <p>© 2026 CollaDO. Focus data is stored locally on your device.</p>
          <nav aria-label="Legal links">
            <button type="button" onClick={()=>setLegalModal("privacy")}>Privacy</button>
            <span>·</span>
            <button type="button" onClick={()=>setLegalModal("terms")}>Terms</button>
            <span>·</span>
            <a href="mailto:collado.eni@gmail.com">Contact</a>
          </nav>
        </footer>
      </main>
    </div>
   );
}

