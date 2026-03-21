import LoadingShell from "@/components/LoadingShell";

export default function ZeewallLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {/* Topic pills */}
        <div style={{ display: "flex", gap: "8px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", overflowX: "hidden" }}>
          {[55, 70, 60, 80, 65, 55].map((w, i) => (
            <div key={i} className="sk-box" style={{ width: w, height: 26, borderRadius: 999, flexShrink: 0 }} />
          ))}
        </div>
        {/* Composer */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div className="sk-box sk-circle" style={{ width: 32, height: 32, flexShrink: 0 }} />
            <div className="sk-box" style={{ flex: 1, height: 52, borderRadius: 10 }} />
          </div>
        </div>
        {/* Posts */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: "10px" }}>
            <div className="sk-box sk-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <div className="sk-box" style={{ width: 90, height: 11 }} />
                <div className="sk-box" style={{ width: 40, height: 11 }} />
              </div>
              <div className="sk-box" style={{ width: "88%", height: 13 }} />
              <div className="sk-box" style={{ width: "65%", height: 13 }} />
              <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
                <div className="sk-box" style={{ width: 44, height: 22, borderRadius: 999 }} />
                <div className="sk-box" style={{ width: 44, height: 22, borderRadius: 999 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}
