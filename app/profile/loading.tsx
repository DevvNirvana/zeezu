import LoadingShell from "@/components/LoadingShell";

export default function ProfileLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {/* Banner */}
        <div className="sk-box" style={{ width: "100%", height: 140, borderRadius: 0 }} />
        {/* Avatar + info */}
        <div style={{ padding: "0 20px", marginTop: "-32px", marginBottom: "16px" }}>
          <div className="sk-box sk-circle" style={{ width: 72, height: 72, border: "3px solid #070a1c", marginBottom: "12px" }} />
          <div className="sk-box" style={{ width: 160, height: 18, marginBottom: "8px" }} />
          <div className="sk-box" style={{ width: 90, height: 13, marginBottom: "12px" }} />
          <div className="sk-box" style={{ width: "80%", height: 11, marginBottom: "6px" }} />
          <div className="sk-box" style={{ width: "60%", height: 11, marginBottom: "16px" }} />
          {/* Stats row */}
          <div style={{ display: "flex", gap: "20px" }}>
            {[50, 60, 55].map((w, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div className="sk-box" style={{ width: 30, height: 16 }} />
                <div className="sk-box" style={{ width: w, height: 11 }} />
              </div>
            ))}
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 20px" }}>
          {[70, 65, 60].map((w, i) => (
            <div key={i} style={{ padding: "10px 16px" }}>
              <div className="sk-box" style={{ width: w, height: 12 }} />
            </div>
          ))}
        </div>
        {/* Post grid */}
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3px" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="sk-box" style={{ aspectRatio: "1", borderRadius: 4 }} />
          ))}
        </div>
      </div>
    </LoadingShell>
  );
}
