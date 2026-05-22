import React, { useRef, useState } from "react";
import { WALLPAPER_CATEGORIES }     from "../../utils/constants";
import { PANEL_BACKDROP, BTN_BASE, RADIUS, SPACING } from "../../styles/tokens";

// ─── WallpaperPanel ───────────────────────────────────────────────────────────
// Modal panel for selecting, uploading, and configuring wallpapers.
// Owns only UI state (active category, input values) — wallpaper state
// lives in useWallpaper and is passed down via props.

export default function WallpaperPanel({
  wallpaper,
  videoWpUrl,
  wpOverlay,
  hasBg,
  onApplyPreset,
  onApplyCustomUrl,
  onApplyImageFile,
  onApplyVideoUrl,
  onApplyVideoFile,
  onSetOverlay,
  onClear,
  onClose,
}) {
  const [category,       setCategory]       = useState("Nature");
  const [imageUrlInput,  setImageUrlInput]  = useState("");
  const [videoUrlInput,  setVideoUrlInput]  = useState("");

  const fileInputRef  = useRef(null);
  const videoInputRef = useRef(null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wallpaper settings"
      style={PANEL_BACKDROP}
      onClick={onClose}
    >
      <div
        className="fu"
        onClick={e => e.stopPropagation()}
        style={{
          width:      "100%",
          maxWidth:   500,
          background: "#0f0f1e",
          border:     "1px solid rgba(167,139,250,.22)",
          borderRadius: RADIUS.panel,
          padding:    SPACING.xxl,
          boxShadow:  "0 0 60px rgba(167,139,250,.12)",
          maxHeight:  "90vh",
          overflowY:  "auto",
        }}
      >
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
          <div>
            <p style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.3px" }}>🖼 Wallpaper</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Personalize your focus space</p>
          </div>
          <button aria-label="Close wallpaper panel" style={{ ...BTN_BASE, background:"transparent", color:"rgba(255,255,255,.2)", fontSize:18 }} onClick={onClose}>✕</button>
        </div>

        {/* Category tabs */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
          {Object.keys(WALLPAPER_CATEGORIES).map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              ...BTN_BASE,
              padding:     "4px 10px",
              borderRadius: RADIUS.sm,
              fontSize:    11,
              fontWeight:  600,
              background:  category === cat ? "rgba(167,139,250,.2)" : "rgba(255,255,255,.04)",
              border:      category === cat ? "1px solid rgba(167,139,250,.4)" : "1px solid rgba(255,255,255,.08)",
              color:       category === cat ? "#a78bfa" : "rgba(255,255,255,.4)",
            }}>{cat}</button>
          ))}
        </div>

        {/* Presets grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:18 }}>
          {WALLPAPER_CATEGORIES[category].map(wp => (
            <div
              key={wp.label}
              className="wp-preset"
              role="button"
              tabIndex={0}
              aria-label={`Set wallpaper to ${wp.label}`}
              onClick={() => onApplyPreset(wp.value)}
              onKeyDown={e => e.key === "Enter" && onApplyPreset(wp.value)}
              style={{
                borderRadius:       RADIUS.lg,
                overflow:           "hidden",
                aspectRatio:        "16/9",
                position:           "relative",
                backgroundImage:    wp.value !== "none" ? `url("${wp.value}")` : undefined,
                backgroundSize:     "cover",
                backgroundPosition: "center",
                background:         wp.value === "none" ? wp.preview : undefined,
                border:             wallpaper === wp.value ? "2px solid #a78bfa" : "2px solid transparent",
              }}
            >
              <div style={{ position:"absolute", inset:0, background: wp.value==="none" ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.35)", display:"flex", alignItems:"flex-end", padding:4 }}>
                <span style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.8)" }}>{wp.label}</span>
              </div>
              {wallpaper === wp.value && (
                <div style={{ position:"absolute", top:4, right:4, width:14, height:14, background:"#a78bfa", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:900 }}>✓</div>
              )}
            </div>
          ))}
        </div>

        {/* Custom image URL */}
        <Label>Custom Image URL</Label>
        <Row>
          <TextInput
            placeholder="https://example.com/image.jpg"
            value={imageUrlInput}
            onChange={setImageUrlInput}
            onEnter={() => { onApplyCustomUrl(imageUrlInput); }}
          />
          <ApplyBtn onClick={() => onApplyCustomUrl(imageUrlInput)}>Apply</ApplyBtn>
        </Row>

        {/* Video wallpaper */}
        <Label style={{ marginTop: 14 }}>Video Wallpaper (mp4 / webm)</Label>
        <Row>
          <TextInput
            placeholder="https://example.com/video.mp4"
            value={videoUrlInput}
            onChange={setVideoUrlInput}
            onEnter={() => onApplyVideoUrl(videoUrlInput)}
          />
          <ApplyBtn onClick={() => onApplyVideoUrl(videoUrlInput)}>Apply</ApplyBtn>
        </Row>

        <UploadBtn onClick={() => videoInputRef.current?.click()} style={{ marginBottom: 14 }}>
          🎬 Upload video file (MP4, WEBM)
        </UploadBtn>
        <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" style={{ display:"none" }}
          onChange={e => onApplyVideoFile(e.target.files?.[0])} />

        {/* Image file upload */}
        <Label>Upload Image from Device</Label>
        <UploadBtn onClick={() => fileInputRef.current?.click()} style={{ marginBottom: 18 }}>
          📁 Choose image file (JPG, PNG, WEBP)
        </UploadBtn>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }}
          onChange={e => onApplyImageFile(e.target.files?.[0])} />

        {/* Overlay slider */}
        {hasBg && (
          <>
            <Label>Overlay Darkness — {Math.round(wpOverlay * 100)}%</Label>
            <input type="range" min={0} max={100} value={Math.round(wpOverlay * 100)}
              onChange={e => onSetOverlay(Number(e.target.value) / 100)}
              style={{ width:"100%", accentColor:"#a78bfa", cursor:"pointer", marginBottom:4 }}/>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"rgba(255,255,255,.25)", marginBottom:16 }}>
              <span>Bright</span><span>Dark</span>
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ ...BTN_BASE, flex:1, padding:11, borderRadius:RADIUS.md, background:"linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff", fontWeight:800, fontSize:13 }}
            onClick={onClose}>Done</button>
          {hasBg && (
            <button style={{ ...BTN_BASE, padding:"11px 14px", borderRadius:RADIUS.md, background:"transparent", border:"1px solid rgba(255,255,255,.09)", color:"rgba(255,255,255,.4)", fontSize:12 }}
              onClick={onClear}>Remove</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tiny local sub-components to reduce repetition without over-abstracting ───

function Label({ children, style }) {
  return (
    <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginBottom:8, ...style }}>
      {children}
    </p>
  );
}

function Row({ children }) {
  return <div style={{ display:"flex", gap:6, marginBottom:12 }}>{children}</div>;
}

function TextInput({ placeholder, value, onChange, onEnter }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === "Enter" && onEnter()}
      style={{ flex:1, padding:"9px 12px", borderRadius:10, fontSize:12, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#fff", outline:"none", fontFamily:"inherit" }}
    />
  );
}

function ApplyBtn({ children, onClick }) {
  return (
    <button style={{ ...BTN_BASE, padding:"9px 14px", borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff", fontWeight:700, fontSize:12 }}
      onClick={onClick}>{children}</button>
  );
}

function UploadBtn({ children, onClick, style }) {
  return (
    <button style={{ ...BTN_BASE, width:"100%", padding:"11px 16px", borderRadius:10, background:"rgba(255,255,255,.04)", border:"1px dashed rgba(255,255,255,.15)", color:"rgba(255,255,255,.5)", fontSize:12, fontWeight:600, ...style }}
      onClick={onClick}>{children}</button>
  );
}