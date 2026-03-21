import LoadingShell from "@/components/LoadingShell";

export default function SearchLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px 16px" }}>
        {/* Search bar — prominent */}
        <div className="sk-box" style={{ width: "100%", height: 48, borderRadius: 999, marginBottom: "24px" }} />
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[55, 65, 75, 60].map((w, i) => (
            <div key={i} className="sk-box" style={{ width: w, height: 28, borderRadius: 999 }} />
          ))}
        </div>
        {/* Result rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="sk-box sk-circle" style={{ width: 42, height: 42, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
              <div className="sk-box" style={{ width: `${55 + i * 5}%`, height: 13 }} />
              <div className="sk-box" style={{ width: `${35 + i * 3}%`, height: 11 }} />
            </div>
            <div className="sk-box" style={{ width: 70, height: 28, borderRadius: 8, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}
