import React from "react";
import { glassCardStyle } from "../../styles/tokens";

// ─── SessionLog ───────────────────────────────────────────────────────────────
// Renders the log of completed focus sessions and break endings.
// Memoized — re-renders only when the log array reference changes,
// which happens at session completion (not every second).

const SessionLog = React.memo(function SessionLog({ log, hasBg, wpOverlay }) {
  if (!log.length) return null;

  return (
    <div className="fu fu4" style={{ ...glassCardStyle(hasBg, wpOverlay), padding: "18px 20px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width:          32,
            height:         32,
            borderRadius:   10,
            background:     "linear-gradient(135deg,rgba(96,165,250,.2),rgba(167,139,250,.15))",
            border:         "1px solid rgba(96,165,250,.2)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       14,
          }}
        >
          📋
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700 }}>Session Log</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 1 }}>
            {log.length} entries today
          </p>
        </div>
      </div>

      {/* Entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {log.map((entry, i) => (
          <div
            key={i}
            className="log-row"
            style={{
              animationDelay: `${i * 0.04}s`,
              padding:        "9px 12px",
              borderRadius:   10,
              background:     "rgba(255,255,255,.025)",
              border:         "1px solid rgba(255,255,255,.05)",
              fontSize:       12,
              fontWeight:     500,
              color:          entry.startsWith("✓") ? "#34d399" : "rgba(255,255,255,.4)",
            }}
          >
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
});

export default SessionLog;