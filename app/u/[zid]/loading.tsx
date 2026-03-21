import LoadingShell from "@/components/LoadingShell";

export default function UserProfileLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {/* Banner */}
        <div className="sk-box" style={{ width: "100%", height: 140, borderRadius: 0 }} />
        {/* Avatar + info */}
        <div style={{ padding: "0 20px", marginTop: "-32px", marginBottom: "16px" }}>
          <div className="sk-box sk-circle" style={{ width: 72, height: 72, border: "3px solid #070a1c", marginBottom: "12px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="sk-box" style={{ width: 150, height: 18, marginBottom: "8px" }} />
              <div className="sk-box" style={{ width: 80, height: 13, marginBottom: "12px" }} />
            </div>
            <div className="sk-box" style={{ width: 90, height: 34, borderRadius: 8 }} />
          </div>
          <div className="sk-box" style={{ width: "75%", height: 11, marginBottom: "6px" }} />
          <div className="sk-box" style={{ width: "55%", height: 11, marginBottom: "16px" }} />
          {/* Stats */}
          <div style={{ display: "flex", gap: "20px" }}>
            {[50, 60, 55, 65].map((w, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div className="sk-box" style={{ width: 28, height: 16 }} />
                <div className="sk-box" style={{ width: w, height: 11 }} />
              </div>
            ))}
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 20px" }}>
          {[65, 70, 60, 55].map((w, i) => (
            <div key={i} style={{ padding: "10px 14px" }}>
              <div className="sk-box" style={{ width: w, height: 12 }} />
            </div>
          ))}
        </div>
        {/* Posts */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="sk-box" style={{ width: "85%", height: 13 }} />
            <div className="sk-box" style={{ width: "65%", height: 13 }} />
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <div className="sk-box" style={{ width: 44, height: 22, borderRadius: 999 }} />
              <div className="sk-box" style={{ width: 44, height: 22, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}
