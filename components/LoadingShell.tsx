// Server component — renders instantly, zero JS
// Used by every loading.tsx to provide skeleton NavBar + mobile dock

export default function LoadingShell({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {/* ── Skeleton NavBar ─────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: 0, left: 0, zIndex: 50,
        width: "100%", height: "var(--nav-height, 56px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        background: "rgba(8,14,36,0.97)",
        borderBottom: "1px solid rgba(255,45,135,0.1)",
        backdropFilter: "blur(20px)",
      }}>

        {/* Logo — real, not skeleton */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
          <svg width="20" height="16" viewBox="0 0 70 58" aria-hidden="true">
            <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill="#FF2D87" />
            <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill="#00E5FF" />
            <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6" />
            <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9" />
          </svg>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "16px", fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>
            zeezu
          </span>
          <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#00E5FF", letterSpacing: "3px", opacity: 0.7, marginLeft: "2px" }}>
            NET
          </span>
        </div>

        {/* Center dock skeleton — desktop only */}
        <div className="sk-desktop-only" style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: "5px",
          padding: "5px 8px", borderRadius: "12px",
          background: "rgba(8,14,36,0.65)",
          border: "1px solid rgba(255,45,135,0.1)",
        }}>
          {[32, 32, 32, 32, 32, 32].map((w, i) => (
            <div key={i} className="sk-box" style={{ width: w, height: 32, borderRadius: 8 }} />
          ))}
        </div>

        {/* Right side skeleton */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div className="sk-box sk-desktop-only" style={{ width: 68, height: 24, borderRadius: 12 }} />
          <div className="sk-box" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div className="sk-box sk-desktop-only" style={{ width: 36, height: 24, borderRadius: 8 }} />
        </div>
      </div>

      {/* ── Page content area ───────────────────────────────────── */}
      <div style={{
        paddingTop: "var(--nav-height, 56px)",
        paddingBottom: "var(--mobile-dock-height, 0px)",
        minHeight: "100vh",
        background: "#070a1c",
      }}>
        {children}
      </div>

      {/* ── Skeleton mobile dock ─────────────────────────────────── */}
      <div className="sk-mobile-only" style={{
        position: "fixed", bottom: 0, left: 0,
        width: "100vw", height: "62px",
        background: "rgba(7,10,28,0.97)",
        borderTop: "1px solid rgba(255,45,135,0.1)",
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "0 6px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 1000,
      }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="sk-box" style={{
              width: i === 2 ? 50 : 26,
              height: i === 2 ? 50 : 26,
              borderRadius: i === 2 ? 16 : "50%",
              background: i === 2 ? "rgba(255,45,135,0.2)" : undefined,
            }} />
          </div>
        ))}
      </div>
    </>
  );
}
