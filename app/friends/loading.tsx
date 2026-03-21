import LoadingShell from "@/components/LoadingShell";

export default function FriendsLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div className="sk-box" style={{ width: 120, height: 22 }} />
          <div className="sk-box" style={{ width: 80, height: 32, borderRadius: 999 }} />
        </div>
        {/* Search bar */}
        <div className="sk-box" style={{ width: "100%", height: 42, borderRadius: 10, marginBottom: "20px" }} />
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[70, 90, 80].map((w, i) => (
            <div key={i} className="sk-box" style={{ width: w, height: 28, borderRadius: 999 }} />
          ))}
        </div>
        {/* Friend cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ padding: "16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <div className="sk-box sk-circle" style={{ width: 60, height: 60 }} />
              <div className="sk-box" style={{ width: 90, height: 13 }} />
              <div className="sk-box" style={{ width: 60, height: 11 }} />
              <div className="sk-box" style={{ width: "100%", height: 32, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      </div>
    </LoadingShell>
  );
}
