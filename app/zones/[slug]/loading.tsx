import LoadingShell from "@/components/LoadingShell";

export default function ZoneDetailLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Zone header banner */}
        <div className="sk-box" style={{ width: "100%", height: 160, borderRadius: 0 }} />
        {/* Zone info */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="sk-box" style={{ width: 140, height: 18 }} />
            <div className="sk-box" style={{ width: 220, height: 12 }} />
            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
              <div className="sk-box" style={{ width: 70, height: 12 }} />
              <div className="sk-box" style={{ width: 80, height: 12 }} />
            </div>
          </div>
          <div className="sk-box" style={{ width: 90, height: 34, borderRadius: 8 }} />
        </div>
        {/* Topic pills */}
        <div style={{ display: "flex", gap: "8px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", overflowX: "hidden" }}>
          {[55, 70, 60, 80, 65].map((w, i) => (
            <div key={i} className="sk-box" style={{ width: w, height: 26, borderRadius: 999, flexShrink: 0 }} />
          ))}
        </div>
        {/* Posts */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: "10px" }}>
            <div className="sk-box sk-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="sk-box" style={{ width: 100, height: 11 }} />
              <div className="sk-box" style={{ width: "85%", height: 13 }} />
              <div className="sk-box" style={{ width: "65%", height: 13 }} />
            </div>
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}
