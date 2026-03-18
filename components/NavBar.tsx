"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, Users, MessageSquare, LayoutDashboard, UserCircle, Search, Disc3, Activity, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import NotificationBell from "./NotificationBell";
import Dock from "./Dock";

// ─────────────────────────────────────────────────────────────────────────────
//  PORTAL DOCK CSS — injects theme-aware overrides for the Dock component.
//  Key: labels drop DOWNWARD (top: 100% + 8px) not upward.
// ─────────────────────────────────────────────────────────────────────────────

const NAV_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&display=swap');

  /* Dock outer — inline, no extra height animation in nav context */
  .zee-nav-dock .dock-outer {
    margin: 0 !important;
    height: auto !important;
    overflow: visible !important;
    align-items: center !important;
  }

  /* Dock panel — static, inline-flex, portal-themed */
  .zee-nav-dock .dock-panel {
    position: static !important;
    transform: none !important;
    bottom: auto !important;
    left: auto !important;
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    padding: 5px 8px !important;
    border-radius: 12px !important;
    background: rgba(8, 14, 36, 0.65) !important;
    border: 1px solid color-mix(in srgb, var(--color-electric, #8A2EFF) 22%, transparent) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
    box-shadow:
      0 2px 16px rgba(0,0,0,0.3),
      0 0 0 1px rgba(255,255,255,0.02) inset !important;
    height: auto !important;
    width: max-content !important;
    overflow: visible !important;
  }

  /* Each dock item */
  .zee-nav-dock .dock-item {
    background: transparent !important;
    border: 1px solid transparent !important;
    border-radius: 8px !important;
    overflow: visible !important;
    position: relative !important;
    transition: background 0.18s, border-color 0.18s, box-shadow 0.18s !important;
  }
  .zee-nav-dock .dock-item:hover,
  .zee-nav-dock .dock-item:focus {
    background: color-mix(in srgb, var(--color-electric, #8A2EFF) 10%, transparent) !important;
    border-color: color-mix(in srgb, var(--color-electric, #8A2EFF) 42%, transparent) !important;
    box-shadow: 0 0 10px color-mix(in srgb, var(--color-electric, #8A2EFF) 22%, transparent) !important;
  }
  .zee-nav-dock .dock-item.zee-active {
    background: color-mix(in srgb, var(--color-electric, #8A2EFF) 14%, transparent) !important;
    border-color: color-mix(in srgb, var(--color-electric, #8A2EFF) 55%, transparent) !important;
    box-shadow: 0 0 12px rgba(138, 46, 255, 0.3) !important;
  }

  /* ── LABEL — drops DOWN from the icon ───────────────────────
     DockLabel uses motion/react: initial y:0 opacity:0
     → animate y:-10 opacity:1 (which is upward by default).
     We override the positioning so it sits below and flip
     the animation direction by overriding transform origin. */
  .zee-nav-dock .dock-label {
    position: absolute !important;
    /* Place below the icon instead of above */
    top: calc(100% + 6px) !important;
    bottom: auto !important;
    left: 50% !important;
    /* x: -50% already applied by motion via style prop — we reset */
    transform: translateX(-50%) !important;

    font-family: 'VT323', monospace !important;
    font-size: 10px !important;
    letter-spacing: 2px !important;
    text-transform: uppercase !important;
    color: rgba(255, 255, 255, 0.92) !important;
    background: rgba(8, 14, 36, 0.97) !important;
    border: 1px solid color-mix(in srgb, var(--color-electric, #8A2EFF) 38%, transparent) !important;
    border-radius: 5px !important;
    padding: 2px 7px !important;
    white-space: nowrap !important;
    pointer-events: none !important;
    z-index: 9999 !important;
    box-shadow: 0 4px 14px rgba(0,0,0,0.5) !important;
  }

  /* Active indicator dot */
  .zee-dot {
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 3px;
    border-radius: 50%;
  }

  /* Unread badge */
  .zee-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    border-radius: 7px;
    font-family: 'VT323', monospace;
    font-size: 10px;
    line-height: 14px;
    text-align: center;
    color: #fff;
    background: var(--color-electric, #8A2EFF);
    letter-spacing: 0.3px;
    pointer-events: none;
    z-index: 10;
    animation: zee-badge-ring 2s ease-out infinite;
  }

  @keyframes zee-badge-ring {
    0%   { box-shadow: 0 0 0 0   color-mix(in srgb, var(--color-electric, #8A2EFF) 70%, transparent); }
    70%  { box-shadow: 0 0 0 5px transparent;   }
    100% { box-shadow: 0 0 0 0   transparent;   }
  }
  @keyframes zee-online { 0%,100%{opacity:1} 50%{opacity:.28} }
  @keyframes zee-disc   { to{transform:rotate(360deg)} }

  /* ── Buzz Pulse Animation ── */
  @keyframes zee-buzz-pulse { 
    0% { box-shadow: 0 0 0 0 rgba(255,0,122,.5); } 
    70% { box-shadow: 0 0 0 10px rgba(255,0,122,0); } 
    100% { box-shadow: 0 0 0 0 rgba(255,0,122,0); } 
  }

  /* ── Mobile Nav Cleanup ── */
  @media (max-width: 768px) {
    /* Shrink the online pill to just a dot */
    .zee-online-pill span:last-child { display: none !important; }
    .zee-online-pill { padding: 5px !important; border-radius: 50% !important; }
    
    /* Hide the FM disc to make room for Buzzes and Bell */
    .zee-fm-disc { display: none !important; } 
  }

  /* ── RESPONSIVE DOCK TOGGLE ──────────────────────────────────── */
  /* Hide desktop dock on mobile */
  @media (max-width: 768px) {
    .zee-desktop-dock { display: none !important; }
  }
  /* Hide mobile dock on desktop */
  @media (min-width: 769px) {
    .zee-mobile-dock { display: none !important; }
  }

  /* ── MOBILE DOCK STYLING (Outside Nav) ───────────────────────── */
  .zee-mobile-dock {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    background: rgba(8, 14, 36, 0.95) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border-top: 1px solid color-mix(in srgb, var(--color-electric, #8A2EFF) 22%, transparent) !important;
    padding-bottom: env(safe-area-inset-bottom, 5px) !important;
    z-index: 1000 !important;
  }

  .zee-mobile-dock .dock-panel {
    width: 100% !important;
    max-width: 100vw !important;
    justify-content: space-around !important;
    border-radius: 0 !important;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 8px 10px !important;
  }

  /* Pop labels upwards on mobile so they don't clip off-screen */
  .zee-mobile-dock .dock-label {
    top: auto !important;
    bottom: calc(100% + 10px) !important;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
//  DOCK ICON — icon + active dot + badge
// ─────────────────────────────────────────────────────────────────────────────

function NavDockIcon({
  icon,
  active = false,
  badge = 0,
  accent = "var(--color-electric, #8A2EFF)",
}: {
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
  accent?: string;
}) {
  return (
    <div style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      color: active ? accent : "rgba(255,255,255,0.48)",
      transition: "color 0.18s",
    }}>
      {icon}
      {active && (
        <span
          className="zee-dot"
          style={{ background: accent, boxShadow: `0 0 5px ${accent}` }}
        />
      )}
      {badge > 0 && (
        <span className="zee-badge">{badge > 99 ? "99+" : badge}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  NAVBAR
// ─────────────────────────────────────────────────────────────────────────────

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [buzzCount, setBuzzCount] = useState(0); // 👈 ADDED
  const [onlineCount, setOnlineCount] = useState(2847);

  // ── Fetch Nav Data ──────────────────────────────────
  const fetchNavData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Unread Messages
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);
    setUnreadMsgCount(count || 0);

    // 2. Unread buzzes — messages with is_buzz=true
    const { count: buzzC } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_buzz", true)
      .eq("is_read", false);
    setBuzzCount(buzzC || 0);
  }, []);

  useEffect(() => { fetchNavData(); }, [fetchNavData]);

  // ── Last-seen heartbeat ───────────────────────────────────────
  // Updates last_seen_at on mount, tab focus, and every 5 min.
  // Used by the Online Now filter on the friends page.
  useEffect(() => {
    async function ping() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      supabase.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
    }

    ping();
    const interval = setInterval(ping, 5 * 60 * 1000);
    const onVisible = () => { if (!document.hidden) ping(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // ── Realtime Listeners ────────────────────────────────────────
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const channel = supabase
        .channel("navbar_realtime")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
          if (p.new?.receiver_id === user.id) fetchNavData();
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (p: any) => {
          const m = p.new;
          if (m?.receiver_id === user.id || m?.sender_id === user.id) fetchNavData();
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (p: any) => {
          if (p.new?.user_id === user.id) fetchNavData(); // 👈 Updates buzzes in real-time
        })
        .subscribe();
      cleanup = () => supabase.removeChannel(channel);
    }
    setup();
    return () => cleanup?.();
  }, [fetchNavData]);

  // Online counter drift
  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount(n => n + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3));
    }, 3800);
    return () => clearInterval(t);
  }, []);

  // ── Dock items ────────────────────────────────────────────────
  const dockItems = [
    {
      icon: <NavDockIcon icon={<LayoutDashboard size={16} />} active={pathname === "/dashboard"} />,
      label: "Home",
      onClick: () => router.push("/dashboard"),
      className: pathname === "/dashboard" ? "zee-active" : "",
    },
    {
      icon: <NavDockIcon icon={<Search size={16} />} active={pathname === "/search"} />,
      label: "Search",
      onClick: () => router.push("/search"),
      className: pathname === "/search" ? "zee-active" : "",
    },
    {
      icon: <NavDockIcon icon={<Users size={16} />} active={pathname === "/friends"} />,
      label: "Friends",
      onClick: () => router.push("/friends"),
      className: pathname === "/friends" ? "zee-active" : "",
    },
    {
      icon: <NavDockIcon icon={<MessageSquare size={16} />} active={pathname?.startsWith("/messages")} badge={unreadMsgCount} />,
      label: "Messages",
      onClick: () => router.push("/messages"),
      className: pathname?.startsWith("/messages") ? "zee-active" : "",
    },
    {
      icon: <NavDockIcon icon={<BookOpen size={16} />} active={pathname?.startsWith("/zlogger")} accent="#B4FF00" />,
      label: "Zlogger",
      onClick: () => router.push("/zlogger"),
      className: pathname?.startsWith("/zlogger") ? "zee-active" : "",
    },
    {
      icon: <NavDockIcon icon={<UserCircle size={16} />} active={pathname === "/profile"} accent="#00E5FF" />,
      label: "Profile",
      onClick: () => router.push("/profile"),
      className: pathname === "/profile" ? "zee-active" : "",
    },
  ];

  return (
    <>
      <style>{NAV_STYLES}</style>

      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        width: "100%",
        // height: "56px",
        height: "var(--nav-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "rgba(8,14,36,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid color-mix(in srgb, var(--color-electric, #8A2EFF) 22%, transparent)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.42), 0 1px 0 color-mix(in srgb, var(--color-electric, #8A2EFF) 8%, transparent) inset",
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.011) 3px,rgba(255,255,255,0.011) 4px)",
        // overflow visible so labels can drop below the nav bar
        overflow: "visible",
      }}>

        {/* ── LEFT: Logo ──────────────────────────────────────── */}
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", flexShrink: 0 }}>
          <svg width="20" height="16" viewBox="0 0 70 58" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill="#8A2EFF" />
            <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill="#00E5FF" />
            <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6" />
            <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9" />
          </svg>
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "16px",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-1px",
            lineHeight: "1",
            textShadow: "0 0 14px rgba(0,229,255,0.28)",
          }}>
            zeezu
          </span>
          <span style={{
            fontFamily: "'VT323', monospace",
            fontSize: "10px",
            color: "#00E5FF",
            letterSpacing: "3px",
            opacity: 0.7,
            marginLeft: "2px",
          }}>
            NET
          </span>
        </Link>

        {/* ── CENTER: Desktop Dock ─────────────────────────────── */}
        <div
          className="zee-nav-dock zee-desktop-dock"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            overflow: "visible",
            zIndex: 100,
          }}
        >
          <Dock
            items={dockItems}
            panelHeight={38}
            baseItemSize={32}
            magnification={44}
            distance={100}
          />
        </div>



        {/* ── RIGHT: Online + Buzzes + Bell + FM ───────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>

          {/* Online pill */}
          <div className="zee-online-pill" style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(107,203,119,0.28)", borderRadius: "20px", padding: "3px 9px", transition: "all 0.2s" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6BCB77", display: "inline-block", flexShrink: 0, animation: "zee-online 2.2s ease-in-out infinite", boxShadow: "0 0 5px rgba(107,203,119,0.8)" }} />
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "#6BCB77", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
              {onlineCount.toLocaleString()} online
            </span>
          </div>

          {/* ── ADDED: BUZZ PILL ── */}
          {buzzCount > 0 && (
            <button
              onClick={() => router.push("/messages")}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                background: "rgba(255,0,122,.15)", border: "1px solid rgba(255,0,122,.4)",
                borderRadius: "12px", padding: "4px 8px",
                color: "#FF007A", fontFamily: "'VT323', monospace", fontSize: "14px",
                cursor: "pointer", animation: "zee-buzz-pulse 2s ease-out infinite",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,0,122,.25)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,0,122,.15)"}
            >
              <Activity size={14} />
              <span>{buzzCount}</span>
            </button>
          )}

          {/* Notification bell — existing component */}
          <NotificationBell />

          {/* FM disc (Notice I added className="zee-fm-disc" here!) */}
          <div className="zee-fm-disc" style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(138,46,255,0.18)", borderRadius: "8px", padding: "4px 8px" }}>
            <Disc3 size={12} style={{ color: "var(--color-electric, #8A2EFF)", animation: "zee-disc 3s linear infinite" }} />
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "var(--color-electric, #8A2EFF)", letterSpacing: "2px" }}>
              FM
            </span>
          </div>
        </div>

      </nav>

      {/* ── MOBILE: Bottom Dock ────────────────────────────────── */}
      <div className="zee-nav-dock zee-mobile-dock">
        <Dock
          items={dockItems}
          panelHeight={48} /* Slightly taller for thumb-tapping on mobile */
          baseItemSize={36}
          magnification={44}
          distance={100}
        />
      </div>


    </>
  );
}