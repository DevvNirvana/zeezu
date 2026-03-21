import LoadingShell from "@/components/LoadingShell";

export default function ZloggerLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="sk-box" style={{ width: 120, height: 22 }} />
            <div className="sk-box" style={{ width: 180, height: 12 }} />
          </div>
          <div className="sk-box" style={{ width: 110, height: 38, borderRadius: 8 }} />
        </div>
        {/* Post rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: "flex", gap: "16px", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="sk-box" style={{ width: `${70 + (i % 3) * 8}%`, height: 16 }} />
              <div className="sk-box" style={{ width: `${50 + (i % 4) * 6}%`, height: 12 }} />
              <div className="sk-box" style={{ width: "40%", height: 12 }} />
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <div className="sk-box" style={{ width: 60, height: 20, borderRadius: 999 }} />
                <div className="sk-box" style={{ width: 50, height: 20, borderRadius: 999 }} />
              </div>
            </div>
            <div className="sk-box sk-desktop-only" style={{ width: 120, height: 80, borderRadius: 8, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}
