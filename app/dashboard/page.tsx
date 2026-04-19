"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap, Activity, MessageCircle, Flame, Music, Search, Plus, Trash2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  syncUserSession, getCoreEight, getDashboardStats, searchFriends,
  addToCoreEight, removeFromCoreEight, getFriendCount, getMyZones, type SyncedUser, type Zone,
} from "@/lib/supabase/queries";
import GlobalFeed from "@/components/GlobalFeed";
import NavBar from "@/components/NavBar";
import ThemeEngine, { type ThemeConfig } from "@/components/ThemeEngine";
import BootScreen from "@/components/BootScreen";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import { AGENT_IDS } from "@/lib/agents";
import ReflectiveCard from "@/components/ReflectiveCard";

// ─────────────────────────────────────────────────────────────────────────────
//  Y2K KEYFRAMES — injected once
// ─────────────────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Orbitron:wght@700;900&family=VT323&display=swap');

  @keyframes zee-marquee   { 0%{transform:translateX(0)} 100%{transform:translateX(-33.333%)} }
  @keyframes zee-twinkle   { 0%,100%{opacity:.09;transform:scale(1) rotate(0)} 50%{opacity:.4;transform:scale(1.12) rotate(16deg)} }
  @keyframes zee-buzz-pulse{ 0%{box-shadow:0 0 0 0 rgba(255,0,122,.5)} 70%{box-shadow:0 0 0 10px rgba(255,0,122,0)} 100%{box-shadow:0 0 0 0 rgba(255,0,122,0)} }
  @keyframes zee-live-dot  { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes zee-eq-bar    { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
  @keyframes zee-online    { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes zee-fade-in   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes zee-spin      { to{transform:rotate(360deg)} }
`;

// ─────────────────────────────────────────────────────────────────────────────
//  PORTAL MODULE HEADER — shared Y2K "widget title bar" pattern
// ─────────────────────────────────────────────────────────────────────────────

function ModuleHeader({
  icon,
  title,
  accent = "var(--color-electric, #FF2D87)",
  right,
}: {
  icon: React.ReactNode;
  title: string;
  accent?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px 10px 14px",
        background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 13%, transparent) 0%, transparent 100%)`,
        borderBottom: `1px solid color-mix(in srgb, ${accent} 19%, transparent)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "3px", height: "18px", background: `linear-gradient(180deg, ${accent}, color-mix(in srgb, ${accent} 40%, transparent))`, borderRadius: "2px", flexShrink: 0 }} />
        <span style={{ color: accent, display: "flex", alignItems: "center" }}>{icon}</span>
        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PORTAL CARD — base card styling
// ─────────────────────────────────────────────────────────────────────────────

function PortalCard({
  children,
  style,
  className = "",
  accent = "color-mix(in srgb, var(--color-electric, #FF2D87) 20%, transparent)",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: "var(--color-card-bg, rgba(14,22,48,0.85))",
        backdropFilter: "blur(12px)",
        border: `1px solid ${accent}`,
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,.5)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STAR DECORATIONS
// ─────────────────────────────────────────────────────────────────────────────

const STARS = [
  { x: "2%", y: "12%", s: 10, d: "0s" },
  { x: "98%", y: "20%", s: 8, d: "1.1s" },
  { x: "1%", y: "55%", s: 9, d: "0.5s" },
  { x: "99%", y: "65%", s: 11, d: "1.8s" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [showBoot, setShowBoot] = useState(false);
  const [isFirstEver, setIsFirstEver] = useState(false);
  const [coreEight, setCoreEight] = useState<any[]>([]);
  const [stats, setStats] = useState({ zaps: 0, buzzes: 0, comments: 0 });
  const [customization, setCustom] = useState<ThemeConfig | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [myZones, setMyZones] = useState<Zone[]>([]);

  // Core 8 edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setResults] = useState<any[]>([]);

  // ── Init — logic UNCHANGED ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const identity = await syncUserSession();
      if (!identity) { router.push("/login"); return; }

      // Redirect to onboarding if:
      // 1. Brand new user (_isNew)
      // 2. No birth_year = no Generation Badge = onboarding never properly completed
      //    This self-heals broken signups without any SQL migration needed.
      // 3. onboarding_complete column exists and is explicitly false
      // 4. Pre-migration fallback: column null AND no avatar_url
      const needsOnboarding =
        (identity as SyncedUser)._isNew ||
        !identity.birth_year ||
        identity.onboarding_complete === false ||
        (identity.onboarding_complete == null && !identity.avatar_url);
      if (needsOnboarding) { router.push("/onboarding"); return; }
      setUserData(identity);

      const freshLogin = localStorage.getItem("zeezu_fresh_login") === "1";
      const bootSeen = localStorage.getItem("zeezu_boot_seen") === "1";
      // zeezu_onboarding_done: set by the new onboarding flow when it fires its own BootScreen.
      // If present, skip dashboard BootScreen entirely (would be a double-play).
      const onboardingJustDone = localStorage.getItem("zeezu_onboarding_done") === "1";
      if (onboardingJustDone) {
        localStorage.removeItem("zeezu_onboarding_done");
        localStorage.setItem("zeezu_boot_seen", "1");
      }
      const shouldBoot = !onboardingJustDone && (freshLogin || !bootSeen);

      try {
        const [top8, dashStats, { data: customData }, fCount, zones] = await Promise.all([
          getCoreEight(identity.id),
          getDashboardStats(),
          supabase.from("profile_customization").select("*").eq("user_id", identity.id).single(),
          getFriendCount(identity.id),
          getMyZones(),
        ]);

        setCoreEight(top8 || []);
        setStats(dashStats);
        if (customData) setCustom(customData as ThemeConfig);
        setFriendCount(fCount);
        setMyZones(zones);

        if (shouldBoot) {
          localStorage.removeItem("zeezu_fresh_login");
          localStorage.setItem("zeezu_boot_seen", "1");
          setIsFirstEver(!bootSeen);
          setShowBoot(true);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  // ── Realtime — UNCHANGED ────────────────────────────────────────────
  useEffect(() => {
    if (!userData) return;
    const channel = supabase
      .channel("dashboard_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload: any) => {
        if (payload.new?.receiver_id !== userData.id) return;
        setStats(await getDashboardStats());
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "core_eight" }, async (payload: any) => {
        const row = payload.new || payload.old;
        if (row?.user_id !== userData.id) return;
        setCoreEight((await getCoreEight(userData.id)) || []);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, async (payload: any) => {
        if (payload.new?.user_id !== userData.id) return;
        setStats(await getDashboardStats());
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userData]);

  // ── Core 8 handlers — UNCHANGED ────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setResults(await searchFriends(searchQuery));
  };

  const handleRemoveFromSlot = async (position: number) => {
    await removeFromCoreEight(position);
    if (userData) setCoreEight(await getCoreEight(userData.id));
  };

  const handleAddToSlot = async (friendId: string) => {
    if (selectedSlot === null) return;
    await addToCoreEight(friendId, selectedSlot);
    if (userData) setCoreEight(await getCoreEight(userData.id));
    setIsEditing(false);
    setSearchQuery("");
    setResults([]);
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-page-bg, #080E24)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        fontFamily: "'VT323', monospace",
      }}
    >
      <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-electric, #FF2D87)" }} />
      <span style={{ fontSize: "13px", color: "rgba(255,45,135,.6)", letterSpacing: "3px" }}>
        LOADING SYSTEM...
      </span>
    </div>
  );

  const gen = getGeneration(userData?.birth_year, userData?.birth_month, userData?.birth_day);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--color-page-bg, #080E24)",
          backgroundImage: `
            radial-gradient(ellipse 70% 45% at 50% 0%,   color-mix(in srgb, var(--color-electric, #FF2D87) 13%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 35% 25% at 0%  60%,  color-mix(in srgb, var(--color-cyan, #00E5FF) 6%, transparent)  0%, transparent 55%),
            radial-gradient(ellipse 30% 20% at 100% 80%, rgba(78,205,196,.05) 0%, transparent 55%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='.8' fill='rgba(255,255,255,.035)'/%3E%3C/svg%3E")
          `,
          color: "#fff",
          // paddingBottom: "60px",
          overflowX: "hidden",
          fontFamily: "'Nunito', system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Stars */}
        {STARS.map((st, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              position: "fixed",
              left: st.x,
              top: st.y,
              fontSize: `${st.s}px`,
              color: "#FF2D87",
              pointerEvents: "none",
              userSelect: "none",
              animation: `zee-twinkle ${3.4 + i * 0.5}s ease-in-out infinite`,
              animationDelay: st.d,
              zIndex: 0,
            }}
          >
            ✦
          </span>
        ))}

        {/* ── Boot + Theme engine ──────────────────────────────────── */}
        {showBoot && (
          <BootScreen
            username={userData?.display_name}
            isFirstEver={isFirstEver}
            onComplete={() => setShowBoot(false)}
          />
        )}
        <ThemeEngine config={customization} />
        <NavBar />



        {/* ══════════════════════════════════════════════════════════
            MAIN LAYOUT GRID
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "20px 16px",
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: "20px",
          }}
          className="dashboard-grid"
        >
          {/* ══════════════════════════════════════════════════════
              LEFT SIDEBAR
          ══════════════════════════════════════════════════════ */}
          <div className="col-wrapper" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* ── IDENTITY CARD ──────────────────────────────────── */}
            <PortalCard className="card-profile" style={{ display: "none" }}>
              <ModuleHeader
                icon={<Users size={13} />}
                title="MY PROFILE"
                right={
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,45,135,.45)", letterSpacing: "1px" }}>
                    {userData?.zid}
                  </span>
                }
              />
              <div
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Ambient glow behind avatar */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "-20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "120px",
                    height: "120px",
                    background: "radial-gradient(circle, rgba(255,45,135,.25) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Avatar ring */}
                <div
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "50%",
                    padding: "3px",
                    background: "linear-gradient(135deg,#FF2D87,#00E5FF)",
                    marginBottom: "12px",
                    flexShrink: 0,
                    boxShadow: "0 0 24px rgba(255,45,135,.4)",
                  }}
                >
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#000" }}>
                    <img
                      src={userData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.zid}`}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", display: "block" }}
                    />
                  </div>
                </div>

                {/* Name */}
                <h1
                  style={{
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "-0.5px",
                    margin: "0 0 4px 0",
                  }}
                >
                  {userData?.display_name}
                </h1>

                {/* Gen badge */}
                {gen && (
                  <div style={{ marginBottom: "6px" }}>
                    <GenBadge gen={gen} size="md" />
                  </div>
                )}

                {/* Friend count */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                  <Users size={11} style={{ color: "#00E5FF" }} />
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(0,229,255,.7)", letterSpacing: "0.5px" }}>
                    {friendCount} FRIEND{friendCount !== 1 ? "S" : ""}
                  </span>
                </div>

                {/* Status message */}
                {userData?.status_message && (
                  <>
                    <div style={{ width: "100%", height: "1px", background: "rgba(255,45,135,.15)", margin: "12px 0" }} />
                    <p
                      style={{
                        fontFamily: "'Nunito',sans-serif",
                        fontSize: "12px",
                        color: "rgba(255,255,255,.45)",
                        fontStyle: "italic",
                        lineHeight: "1.5",
                        margin: 0,
                      }}
                    >
                      &ldquo;{userData.status_message}&rdquo;
                    </p>
                  </>
                )}

                {/* Theme color dots */}
                {customization && (
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "12px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: customization.primary_color, boxShadow: `0 0 6px ${customization.primary_color}`, display: "inline-block" }} />
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: customization.secondary_color, boxShadow: `0 0 6px ${customization.secondary_color}55`, display: "inline-block" }} />
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.2)", letterSpacing: "1px", marginLeft: "3px" }}>CUSTOM THEME</span>
                  </div>
                )}
              </div>
            </PortalCard>

            <ReflectiveCard
              displayName={userData?.display_name || ""}
              zid={userData?.zid || ""}
              avatarUrl={userData?.avatar_url}
              statusMessage={userData?.status_message}
              friendCount={friendCount}
              birthYear={userData?.birth_year}
              birthMonth={userData?.birth_month}
              birthDay={userData?.birth_day}
              influenceScore={userData?.influence_score ?? 0}
              primaryColor={customization?.primary_color}
              secondaryColor={customization?.secondary_color}
            />

            {/* ── CORE 8 ─────────────────────────────────────────── */}
            <PortalCard className="card-core8" accent="rgba(255,100,0,.2)">
              <ModuleHeader
                icon={<Flame size={13} />}
                title="CORE 8"
                accent="#FF6400"
                right={
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Desktop: Hierarchy */}
                    <span className="desktop-hierarchy" style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,100,0,.45)", letterSpacing: "1.5px" }}>
                      HIERARCHY
                    </span>
                    {/* Mobile: Shiny Swipe Text */}
                    <span className="mobile-swipe-text">
                      SWIPE {">>>"}
                    </span>
                  </div>

                }
              />

              <div style={{ padding: "14px" }}>
                {/* 4×2 grid */}
                {/* <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}> */}
                <div className="core-eight-container">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(spot => {
                    const entry = coreEight.find(c => c.position === spot);
                    const friend = entry?.friend;
                    return (
                      <div
                        key={spot}
                        onClick={() => { if (!friend) { setSelectedSlot(spot); setIsEditing(true); } }}
                        style={{
                          aspectRatio: "1",
                          position: "relative",
                          borderRadius: "12px",
                          background: "rgba(0,0,0,.4)",
                          border: "1px solid rgba(255,100,0,.15)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          transition: "border-color .2s, box-shadow .2s",
                        }}
                        className="core-slot"
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,100,0,.5)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 12px rgba(255,100,0,.2)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,100,0,.15)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                        }}
                      >
                        {/* Slot number */}
                        <span
                          style={{
                            position: "absolute",
                            top: "3px",
                            left: "5px",
                            fontFamily: "'VT323',monospace",
                            fontSize: "9px",
                            color: "rgba(255,100,0,.4)",
                          }}
                        >
                          0{spot}
                        </span>

                        {friend ? (
                          <>
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.zid}`}
                              style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid rgba(255,100,0,.3)", marginBottom: "2px" }}
                              alt={friend.display_name}
                            />
                            <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "7px", color: "rgba(255,255,255,.7)", textAlign: "center", width: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {friend.display_name}
                            </span>
                            {(() => {
                              const isAgent = AGENT_IDS.has((friend as any).id ?? "") || !!(friend as any).agent_state;
                              const fg = getGeneration((friend as any).birth_year, (friend as any).birth_month, (friend as any).birth_day, isAgent);
                              return fg ? <GenBadge gen={fg} size="icon" /> : null;
                            })()}

                            {/* Remove button (hover) */}
                            <button
                              onClick={e => { e.stopPropagation(); handleRemoveFromSlot(spot); }}
                              style={{
                                position: "absolute",
                                top: "3px",
                                right: "3px",
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                background: "rgba(255,80,80,.8)",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                opacity: 0,
                              }}
                              className="remove-btn"
                            >
                              <Trash2 size={9} color="#fff" />
                            </button>

                            {/* Swap overlay (hover) */}
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedSlot(spot); setIsEditing(true); }}
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0,0,0,.55)",
                                border: "none",
                                borderRadius: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                opacity: 0,
                                fontFamily: "'VT323',monospace",
                                fontSize: "10px",
                                color: "#fff",
                                letterSpacing: "1px",
                              }}
                              className="swap-overlay"
                            >
                              SWAP
                            </button>
                          </>
                        ) : (
                          <Plus size={16} style={{ color: "rgba(255,100,0,.35)", transition: "color .2s" }} className="plus-icon" />
                        )}
                      </div>
                    );
                  })}
                </div>


                {/* Hover CSS (inline inject) */}
                <style>{`
                  .core-slot:hover .remove-btn  { opacity: 1 !important; }
                  .core-slot:hover .swap-overlay { opacity: 1 !important; }
                  .core-slot:hover .plus-icon    { color: rgba(255,100,0,.8) !important; }
                `}</style>
              </div>
            </PortalCard>

            {/* ── THEME TRACK ──────────────────────────────────────── */}
            {userData?.theme_track_url && (
              <PortalCard className="hidden card-theme">
                <ModuleHeader icon={<Music size={13} />} title="THEME TRACK" />
                <div style={{ padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,rgba(255,45,135,.3),rgba(0,229,255,.2))",
                      border: "1px solid rgba(255,45,135,.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Music size={16} style={{ color: "#FF2D87" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,45,135,.55)", letterSpacing: "1.5px", margin: "0 0 2px 0" }}>
                      NOW PLAYING
                    </p>
                    <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "12px", color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Playing Now...
                    </p>
                  </div>
                  {/* EQ bars */}
                  <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "18px", flexShrink: 0 }}>
                    {[0.4, 0.85, 0.6, 1, 0.7].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          width: "3px",
                          height: `${h * 18}px`,
                          background: "linear-gradient(180deg,#FF2D87,#00E5FF)",
                          borderRadius: "2px",
                          animation: "zee-eq-bar 0.8s ease-in-out infinite",
                          animationDelay: `${i * 0.12}s`,
                          transformOrigin: "bottom",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </PortalCard>
            )}

            {/* ── MY ZONES ───────────────────────────────────────── */}
            <PortalCard className="card-zones" accent="rgba(0,229,255,.18)">
              <ModuleHeader
                icon={<Activity size={13} />}
                title="MY ZONES"
                accent="#00E5FF"
                right={
                  <button
                    onClick={() => router.push("/zones")}
                    style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(0,229,255,.5)", letterSpacing: "1px", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    EXPLORE →
                  </button>
                }
              />
              <div style={{ padding: "10px 14px" }}>
                {myZones.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "14px 0" }}>
                    <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.2)", letterSpacing: "1.5px", margin: "0 0 10px 0" }}>
                      YOU HAVEN'T TUNED INTO ANY ZONES
                    </p>
                    <button
                      onClick={() => router.push("/zones")}
                      style={{ padding: "5px 14px", borderRadius: "8px", background: "rgba(0,229,255,.1)", border: "1px solid rgba(0,229,255,.25)", color: "#00E5FF", fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer" }}
                    >
                      FIND ZONES
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="my-zones-list" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {myZones.slice(0, 6).map(zone => (
                        <button
                          key={zone.id}
                          className="my-zones-chip"
                          onClick={() => router.push(`/zones/${zone.slug}`)}
                          style={{ display: "flex", alignItems: "center", gap: "9px", padding: "6px 8px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.12s", width: "100%" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.04)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ fontSize: "16px", lineHeight: "1", flexShrink: 0, filter: `drop-shadow(0 0 4px ${zone.accent_color}60)` }}>{zone.icon_emoji}</span>
                          <div className="my-zones-chip-text" style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{zone.name}</div>
                            <div style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.25)", letterSpacing: "0.5px" }}>z/{zone.slug} · {zone.member_count} members</div>
                          </div>
                          <div className="my-zones-chip-dot" style={{ width: "5px", height: "5px", borderRadius: "50%", background: zone.accent_color, boxShadow: `0 0 4px ${zone.accent_color}`, flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => router.push("/zones")}
                      style={{ marginTop: "4px", padding: "5px", borderRadius: "8px", background: "transparent", border: "1px dashed rgba(0,229,255,.18)", color: "rgba(0,229,255,.4)", fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer", width: "100%" }}
                    >
                      + EXPLORE MORE ZONES
                    </button>
                  </>
                )}
              </div>
            </PortalCard>

          </div>

          {/* ══════════════════════════════════════════════════════
              RIGHT COLUMN — Feed
          ══════════════════════════════════════════════════════ */}
          {/* ══════════════════════════════════════════════════════
              RIGHT COLUMN — Feed
          ══════════════════════════════════════════════════════ */}
          <div className="col-wrapper" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* ── BIG BUZZ ALERT (Only shows if buzzes > 0) ────────── */}
            {stats.buzzes > 0 && (
              <PortalCard className="card-buzz" accent="rgba(255,0,122,.4)" style={{ animation: "zee-fade-in .4s ease-out both" }}>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,0,122,.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(255,0,122,.15)", border: "1px solid rgba(255,0,122,.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: "zee-buzz-pulse 2.5s ease-out infinite" }}>
                      <Activity size={16} style={{ color: "#FF007A" }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "12px", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "0.5px" }}>
                        {stats.buzzes} NEW BUZZ{stats.buzzes > 1 ? "ES" : ""}
                      </p>
                      <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,0,122,.7)", margin: 0, letterSpacing: "0.5px" }}>
                        Someone is trying to reach you
                      </p>
                    </div>
                  </div>
                  <button onClick={() => router.push("/messages")} style={{ background: "#FF007A", border: "none", borderRadius: "10px", padding: "9px 18px", color: "#fff", fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", cursor: "pointer", flexShrink: 0, transition: "background .2s" }} onMouseEnter={e => (e.currentTarget.style.background = "#CC0061")} onMouseLeave={e => (e.currentTarget.style.background = "#FF007A")}>OPEN</button>
                </div>
              </PortalCard>
            )}

            {/* ── FEED (Now includes Zaps contextually!) ───────────── */}
            <PortalCard className="card-feed" accent="color-mix(in srgb, var(--color-cyan, #00E5FF) 20%, transparent)" style={{ flex: 1 }}>
              <ModuleHeader
                icon={<MessageCircle size={13} />}
                title="THE FEED"
                accent="var(--color-cyan, #00E5FF)"
                right={
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

                    {/* Zaps integrated natively into Feed Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(180,255,0,0.08)", border: "1px solid rgba(180,255,0,0.25)", borderRadius: "6px", padding: "2px 6px" }}>
                      <Zap size={12} fill="#B4FF00" color="#B4FF00" />
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: "12px", color: "#B4FF00", letterSpacing: "1px" }}>
                        {stats.zaps} <span className="">ZAPS</span>
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="" style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(0,229,255,.45)", letterSpacing: "1.5px" }}>LIVE</span>
                      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#6BCB77", display: "inline-block", animation: "zee-live-dot 2s ease-in-out infinite", boxShadow: "0 0 6px rgba(107,203,119,.8)" }} />
                    </div>
                  </div>
                }
              />
              <GlobalFeed userId={userData?.id || ""} userZid={userData?.zid} />
            </PortalCard>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            CORE 8 EDIT MODAL — Y2K portal popup
        ══════════════════════════════════════════════════════════ */}
        {isEditing && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.82)",
              backdropFilter: "blur(8px)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            {/* Outer glow border */}
            <div style={{ position: "relative" }}>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: "-2px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg,#FF2D87,#00E5FF,#FF2D87)",
                  opacity: .5,
                  filter: "blur(1px)",
                  zIndex: -1,
                }}
              />
              <div
                style={{
                  background: "#0E1630",
                  border: "1px solid rgba(255,45,135,.35)",
                  borderRadius: "18px",
                  width: "100%",
                  maxWidth: "420px",
                  overflow: "hidden",
                  boxShadow: "0 24px 80px rgba(0,0,0,.8)",
                  animation: "zee-fade-in .3s ease-out both",
                }}
              >
                {/* Modal header */}
                <div
                  style={{
                    background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(255,255,255,.07)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 4px)", pointerEvents: "none" }} />
                  <div>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                      Core 8 — <span style={{ color: "#FF6400" }}>Slot 0{selectedSlot}</span>
                    </span>
                  </div>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.3)", letterSpacing: "2px" }}>
                    EDIT MODE
                  </span>
                </div>

                {/* Modal body */}
                <div style={{ padding: "20px" }}>
                  <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,45,135,.6)", letterSpacing: "1px", margin: "0 0 14px 0" }}>
                    Search your friends to fill this slot
                  </p>

                  <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search display name..."
                      style={{
                        flex: 1,
                        background: "rgba(0,0,0,.5)",
                        border: "1px solid rgba(255,45,135,.25)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        color: "#fff",
                        fontSize: "13px",
                        fontFamily: "'Nunito',sans-serif",
                        outline: "none",
                      }}
                      onFocus={e => { e.target.style.borderColor = "rgba(255,45,135,.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,45,135,.1)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,45,135,.25)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button
                      type="submit"
                      style={{
                        background: "linear-gradient(135deg,#FF2D87,#CC1870)",
                        border: "none",
                        borderRadius: "10px",
                        width: "42px",
                        height: "42px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        boxShadow: "0 0 14px rgba(255,45,135,.35)",
                      }}
                    >
                      <Search size={15} color="#fff" />
                    </button>
                  </form>

                  {/* Results */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }}>
                    {searchResults.map(u => (
                      <div
                        key={u.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          background: "rgba(0,0,0,.35)",
                          border: "1px solid rgba(255,45,135,.12)",
                          borderRadius: "12px",
                          transition: "border-color .2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,.35)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,45,135,.12)")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.zid}`}
                            style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(0,0,0,.3)" }}
                            alt={u.display_name}
                          />
                          <div>
                            <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "13px", color: "#fff", margin: 0 }}>{u.display_name}</p>
                            <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.3)", margin: 0, letterSpacing: "0.5px" }}>{u.zid}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToSlot(u.id)}
                          style={{
                            background: "rgba(180,255,0,.1)",
                            border: "1px solid rgba(180,255,0,.35)",
                            borderRadius: "8px",
                            padding: "6px 14px",
                            color: "#B4FF00",
                            fontFamily: "'Orbitron',sans-serif",
                            fontSize: "10px",
                            fontWeight: 700,
                            cursor: "pointer",
                            letterSpacing: "0.5px",
                            transition: "all .2s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#B4FF00"; e.currentTarget.style.color = "#000"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(180,255,0,.1)"; e.currentTarget.style.color = "#B4FF00"; }}
                        >
                          ADD
                        </button>
                      </div>
                    ))}
                    {searchResults.length === 0 && searchQuery && (
                      <p style={{ textAlign: "center", fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,255,255,.2)", padding: "16px 0", letterSpacing: "1px" }}>
                        NO USERS FOUND FOR &ldquo;{searchQuery}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Cancel */}
                  <button
                    onClick={() => { setIsEditing(false); setResults([]); setSearchQuery(""); }}
                    style={{
                      marginTop: "16px",
                      width: "100%",
                      background: "none",
                      border: "none",
                      fontFamily: "'VT323',monospace",
                      fontSize: "12px",
                      color: "rgba(255,255,255,.22)",
                      cursor: "pointer",
                      letterSpacing: "1px",
                      textDecoration: "underline",
                      transition: "color .2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.6)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.22)")}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



      </div>

      {/* Responsive grid CSS */}
      {/* <style>{`
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style> */}

      {/* Responsive grid & ticker CSS */}
      <style>{`
      /* ── Y2K SHINY TEXT ANIMATION ── */
        @keyframes zee-shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .mobile-swipe-text {
          display: none; /* Hidden on desktop */
          font-family: 'VT323', monospace;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          background: linear-gradient(90deg, rgba(255,100,0,0.4), #FFD700, rgba(255,100,0,0.4));
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: zee-shine 2.5s linear infinite;
        }
      /* ── Core 8: Desktop Grid ── */
        .core-eight-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        /* ── MOBILE UX & REORDERING ── */
        @media (max-width: 900px) {
          .hide-on-mobile { display: none !important; }
          .zzbrandingdesk { display: none !important; }

          /* Turn main grid into single column */
          .dashboard-grid {
            display: flex !important;
            flex-direction: column !important;
            min-width: 0;
            max-width: 100vw;
          }

          /* Strip the column wrappers so cards can be reordered */
          .col-wrapper { display: contents; }

          /* Reorder cards for perfect UX */
          .card-profile { display: none !important; }
          .card-core8   { order: 1; margin-bottom: 8px; } /* Stories pinned top! */
          .card-buzz    { order: 2; margin-bottom: 8px; } /* Alert right below stories */
          .card-feed    { order: 3; } /* Main feed right below */
          .card-theme   { order: 4; } /* Theme pushed to bottom */
          .card-zones   { order: 5; } /* Zones below feed on mobile */

          /* My Zones — horizontal chip scroll on mobile */
          .my-zones-list {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            gap: 8px !important;
            padding-bottom: 6px !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .my-zones-list::-webkit-scrollbar { display: none; }
          .my-zones-chip {
            flex: 0 0 auto !important;
            width: 80px !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 8px 6px !important;
            border: 1px solid rgba(0,229,255,.15) !important;
            border-radius: 10px !important;
            background: rgba(0,229,255,.04) !important;
            gap: 4px !important;
            text-align: center !important;
          }
          .my-zones-chip .my-zones-chip-text {
            flex: unset !important;
            min-width: 0 !important;
            width: 100% !important;
          }
          .my-zones-chip .my-zones-chip-text > div:first-child {
            font-size: 10px !important;
            text-align: center !important;
          }
          .my-zones-chip .my-zones-chip-text > div:last-child { display: none !important; }
          .my-zones-chip .my-zones-chip-dot { display: none !important; }

          .desktop-hierarchy { display: none !important; }
          
          .mobile-swipe-text {
            display: inline-block !important;
            font-family: 'VT323', monospace;
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            background: linear-gradient(90deg, rgba(255,100,0,0.4), #FFD700, rgba(255,100,0,0.4));
            background-size: 200% auto;
            color: transparent;
            -webkit-background-clip: text;
            background-clip: text;
            animation: zee-shine 2.5s linear infinite;
          }

          /* Core 8 Horizontal Swipe Row */
          .core-eight-container {
            display: flex !important;
            flex-direction: row !important; 
            flex-wrap: nowrap !important;   
            width: 100%;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scroll-snap-type: x mandatory;
            gap: 12px !important;
            padding-bottom: 12px !important; 
            scrollbar-width: none; 
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch; 
          }
          
          .core-eight-container::-webkit-scrollbar { display: none; }

          .core-eight-container .core-slot {
            flex: 0 0 76px !important; 
            width: 76px !important;
            height: 76px !important;
            scroll-snap-align: start; 
          }

        }
      `}</style>
    </>
  );
}