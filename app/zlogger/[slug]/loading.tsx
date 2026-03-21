import LoadingShell from "@/components/LoadingShell";

export default function ZloggerPostLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px" }}>
        {/* Back link */}
        <div className="sk-box" style={{ width: 80, height: 12, marginBottom: "24px" }} />
        {/* Title */}
        <div className="sk-box" style={{ width: "90%", height: 28, marginBottom: "12px" }} />
        <div className="sk-box" style={{ width: "70%", height: 28, marginBottom: "20px" }} />
        {/* Meta row */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "28px" }}>
          <div className="sk-box sk-circle" style={{ width: 32, height: 32 }} />
          <div className="sk-box" style={{ width: 90, height: 12 }} />
          <div className="sk-box" style={{ width: 60, height: 12 }} />
          <div className="sk-box" style={{ width: 50, height: 20, borderRadius: 999 }} />
        </div>
        {/* Cover image */}
        <div className="sk-box" style={{ width: "100%", height: 240, borderRadius: 12, marginBottom: "28px" }} />
        {/* Article body */}
        {[95, 88, 92, 78, 85, 72, 90, 65, 82].map((w, i) => (
          <div key={i} className="sk-box" style={{ width: `${w}%`, height: 14, marginBottom: "10px" }} />
        ))}
        <div style={{ height: 20 }} />
        {[80, 75, 88, 60].map((w, i) => (
          <div key={i} className="sk-box" style={{ width: `${w}%`, height: 14, marginBottom: "10px" }} />
        ))}
      </div>
    </LoadingShell>
  );
}
