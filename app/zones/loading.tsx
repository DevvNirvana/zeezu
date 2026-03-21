import LoadingShell from "@/components/LoadingShell";

export default function ZonesLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <div className="sk-box" style={{ width: 100, height: 20 }} />
            <div className="sk-box" style={{ width: 160, height: 12 }} />
          </div>
          <div className="sk-box" style={{ width: 110, height: 36, borderRadius: 8 }} />
        </div>
        {/* Search */}
        <div className="sk-box" style={{ width: "100%", height: 40, borderRadius: 999, marginBottom: "20px" }} />
        {/* Zone cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div className="sk-box" style={{ width: "100%", height: 80, borderRadius: 0 }} />
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="sk-box" style={{ width: "70%", height: 15 }} />
                <div className="sk-box" style={{ width: "90%", height: 11 }} />
                <div className="sk-box" style={{ width: "60%", height: 11 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                  <div className="sk-box" style={{ width: 70, height: 11 }} />
                  <div className="sk-box" style={{ width: 70, height: 28, borderRadius: 8 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingShell>
  );
}
