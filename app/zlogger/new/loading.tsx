import LoadingShell from "@/components/LoadingShell";

export default function ZloggerNewLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Title input */}
        <div className="sk-box" style={{ width: "100%", height: 52, borderRadius: 10, marginBottom: "16px" }} />
        {/* Toolbar */}
        <div style={{ display: "flex", gap: "6px", padding: "10px 0", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="sk-box" style={{ width: 30, height: 30, borderRadius: 6 }} />
          ))}
        </div>
        {/* Editor area */}
        <div className="sk-box" style={{ width: "100%", height: "50vh", borderRadius: 10 }} />
        {/* Action bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <div className="sk-box" style={{ width: 80, height: 36, borderRadius: 8 }} />
          <div className="sk-box" style={{ width: 100, height: 36, borderRadius: 8, background: "rgba(255,45,135,0.2)" }} />
        </div>
      </div>
    </LoadingShell>
  );
}
