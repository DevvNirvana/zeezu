import LoadingShell from "@/components/LoadingShell";

export default function MessagesLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0" }}>
        {/* Header */}
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="sk-box" style={{ width: 110, height: 20 }} />
        </div>
        {/* Conversation rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="sk-box sk-circle" style={{ width: 44, height: 44, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="sk-box" style={{ width: 110, height: 12 }} />
                <div className="sk-box" style={{ width: 40, height: 10 }} />
              </div>
              <div className="sk-box" style={{ width: "65%", height: 11 }} />
            </div>
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}
