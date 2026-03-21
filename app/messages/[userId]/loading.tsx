import LoadingShell from "@/components/LoadingShell";

export default function ChatLoading() {
  return (
    <LoadingShell>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - var(--nav-height, 56px) - var(--mobile-dock-height, 0px))" }}>
        {/* Chat header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div className="sk-box sk-circle" style={{ width: 36, height: 36 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="sk-box" style={{ width: 100, height: 13 }} />
            <div className="sk-box" style={{ width: 60, height: 10 }} />
          </div>
        </div>
        {/* Messages area */}
        <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "hidden" }}>
          {/* Incoming */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div className="sk-box sk-circle" style={{ width: 28, height: 28, flexShrink: 0 }} />
            <div className="sk-box" style={{ width: "55%", height: 40, borderRadius: "12px 12px 12px 4px" }} />
          </div>
          {/* Outgoing */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div className="sk-box" style={{ width: "45%", height: 34, borderRadius: "12px 12px 4px 12px", background: "rgba(255,45,135,0.15)" }} />
          </div>
          {/* Incoming */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div className="sk-box sk-circle" style={{ width: 28, height: 28, flexShrink: 0 }} />
            <div className="sk-box" style={{ width: "65%", height: 52, borderRadius: "12px 12px 12px 4px" }} />
          </div>
          {/* Outgoing */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div className="sk-box" style={{ width: "35%", height: 34, borderRadius: "12px 12px 4px 12px", background: "rgba(255,45,135,0.15)" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div className="sk-box sk-circle" style={{ width: 28, height: 28, flexShrink: 0 }} />
            <div className="sk-box" style={{ width: "40%", height: 34, borderRadius: "12px 12px 12px 4px" }} />
          </div>
        </div>
        {/* Input bar */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
          <div className="sk-box" style={{ flex: 1, height: 42, borderRadius: 999 }} />
          <div className="sk-box sk-circle" style={{ width: 42, height: 42, background: "rgba(255,45,135,0.2)" }} />
        </div>
      </div>
    </LoadingShell>
  );
}
