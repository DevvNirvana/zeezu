import LoadingShell from "@/components/LoadingShell";

function PostCardSkeleton() {
  return (
    <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "10px" }}>
      <div className="sk-box sk-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="sk-box" style={{ width: 90, height: 11 }} />
          <div className="sk-box" style={{ width: 40, height: 11 }} />
        </div>
        <div className="sk-box" style={{ width: "90%", height: 13 }} />
        <div className="sk-box" style={{ width: "70%", height: 13 }} />
        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          <div className="sk-box" style={{ width: 44, height: 22, borderRadius: 999 }} />
          <div className="sk-box" style={{ width: 44, height: 22, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <LoadingShell>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "0", minHeight: "100vh" }}>

        {/* Feed column */}
        <div style={{ flex: 1, borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Topic pills skeleton */}
          <div style={{ display: "flex", gap: "8px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", overflowX: "hidden" }}>
            {[60, 80, 55, 70, 65].map((w, i) => (
              <div key={i} className="sk-box" style={{ width: w, height: 26, borderRadius: 999, flexShrink: 0 }} />
            ))}
          </div>
          {/* Composer skeleton */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div className="sk-box sk-circle" style={{ width: 32, height: 32, flexShrink: 0 }} />
              <div className="sk-box" style={{ flex: 1, height: 52, borderRadius: 10 }} />
            </div>
          </div>
          {/* Posts */}
          {Array.from({ length: 5 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>

        {/* Sidebar — desktop only */}
        <div className="sk-desktop-only" style={{ width: 280, padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="sk-box" style={{ width: "100%", height: 140, borderRadius: 12 }} />
          <div className="sk-box" style={{ width: "100%", height: 200, borderRadius: 12 }} />
          <div className="sk-box" style={{ width: "100%", height: 120, borderRadius: 12 }} />
        </div>
      </div>
    </LoadingShell>
  );
}
