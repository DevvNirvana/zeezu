"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap, Activity, MessageCircle, Flame, Music, Search, Plus, Trash2, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import {
  syncUserSession, getCoreEight, getDashboardStats, searchFriends,
  addToCoreEight, removeFromCoreEight, swapCoreEightPositions, getFriendCount, getMyZones, type SyncedUser, type Zone,
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
  const [onlineBuddies, setOnlineBuddies] = useState<{ id: string; display_name: string; zid: string; avatar_url: string | null; status_message: string | null; last_seen_at: string | null }[]>([]);

  // Core 8 edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setResults] = useState<any[]>([]);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCoreSlot, setSelectedCoreSlot] = useState<number | null>(null);

  // ── Init — logic UNCHANGED ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const identity = await syncUserSession();
      if (!identity) { router.push("/login"); return; }

      // DOB is mandatory — birth_year is the single authority for onboarding completion.
      const needsOnboarding = !identity.birth_year;
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
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const [top8, dashStats, { data: customData }, fCount, zones, { data: buddyData }] = await Promise.all([
          getCoreEight(identity.id),
          getDashboardStats(),
          supabase.from("profile_customization").select("*").eq("user_id", identity.id).single(),
          getFriendCount(identity.id),
          getMyZones(),
          supabase
            .from("users")
            .select("id, display_name, zid, avatar_url, status_message, last_seen_at")
            .neq("id", identity.id)
            .gte("last_seen_at", twoHoursAgo)
            .order("last_seen_at", { ascending: false })
            .limit(8),
        ]);

        setCoreEight(top8 || []);
        setStats(dashStats);
        if (customData) setCustom(customData as ThemeConfig);
        setFriendCount(fCount);
        setMyZones(zones);
        setOnlineBuddies(buddyData || []);

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

  const handleCoreSlotTap = async (spot: number) => {
    const entry = coreEight.find(c => c.position === spot);
    const friend = entry?.friend;

    if (selectedCoreSlot === null) {
      if (friend) {
        setSelectedCoreSlot(spot);
      } else {
        setSidebarOpen(false);
        setSelectedCoreSlot(null);
        setTimeout(() => { setSelectedSlot(spot); setIsEditing(true); }, 320);
      }
    } else {
      if (selectedCoreSlot === spot) {
        setSelectedCoreSlot(null);
      } else {
        // Optimistic swap
        const from = selectedCoreSlot;
        const to = spot;
        setSelectedCoreSlot(null);
        setCoreEight(prev => prev.map(c => {
          if (c.position === from) return { ...c, position: to };
          if (c.position === to) return { ...c, position: from };
          return c;
        }));
        await swapCoreEightPositions(from, to);
        if (userData) setCoreEight(await getCoreEight(userData.id) || []);
      }
    }
  };

  // ── Mobile Sidebar Event Listener ──────────────────────────────────────
  useEffect(() => {
    const handleOpen = () => setSidebarOpen(true);
    window.addEventListener('zeezu:sidebar-open', handleOpen);
    return () => window.removeEventListener('zeezu:sidebar-open', handleOpen);
  }, []);

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
            MOBILE SIDEBAR
        ══════════════════════════════════════════════════════════ */}
        <style>{`
          .sb-scroll::-webkit-scrollbar{display:none}
          .sb-scroll{scrollbar-width:none;-ms-overflow-style:none}
          .c8-slot{transition:transform .15s,box-shadow .15s,border-color .15s,background .15s}
          .c8-slot:active{transform:scale(.94)}
          @keyframes sb-glow-ring{0%,100%{opacity:.7}50%{opacity:1}}
          @keyframes sb-selected-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,100,0,.4)}50%{box-shadow:0 0 0 6px rgba(255,100,0,0)}}
        `}</style>
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* BACKDROP */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => { setSidebarOpen(false); setSelectedCoreSlot(null); }}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(6px)", zIndex: 1000 }}
                className="md:hidden"
              />

              {/* SLIDING PANEL */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                drag="x"
                dragConstraints={{ left: -400, right: 0 }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(_e, info) => { if (info.offset.x < -72 || info.velocity.x < -450) { setSidebarOpen(false); setSelectedCoreSlot(null); } }}
                style={{
                  position: "fixed", top: 0, left: 0, bottom: 0,
                  width: "88vw", maxWidth: "360px",
                  background: "linear-gradient(160deg, #0D1428 0%, #080E24 50%, #0A0D1F 100%)",
                  borderRight: "1px solid color-mix(in srgb, var(--color-electric, #FF2D87) 18%, transparent)",
                  boxShadow: "4px 0 60px rgba(0,0,0,.9), inset -1px 0 0 color-mix(in srgb, var(--color-electric, #FF2D87) 8%, transparent)",
                  zIndex: 1001, display: "flex", flexDirection: "column",
                }}
                className="md:hidden"
              >
                {/* ── IDENTITY HEADER ───────────────────────────────── */}
                <div style={{
                  position: "relative", overflow: "hidden", flexShrink: 0,
                  padding: "calc(env(safe-area-inset-top, 0px) + 20px) 16px 18px",
                  background: "linear-gradient(160deg, color-mix(in srgb, var(--color-electric, #FF2D87) 12%, transparent) 0%, color-mix(in srgb, var(--color-electric, #FF2D87) 4%, transparent) 60%, transparent 100%)",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                }}>
                  {/* ambient glow */}
                  <div style={{ position: "absolute", top: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in srgb, var(--color-electric, #FF2D87) 15%, transparent) 0%, transparent 70%)", pointerEvents: "none" }} />

                  {/* close button */}
                  <button onClick={() => { setSidebarOpen(false); setSelectedCoreSlot(null); }}
                    style={{ position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)", right: "14px", width: 36, height: 36, borderRadius: "10px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,.6)" }}>
                    <X size={16} />
                  </button>

                  {/* avatar + info row */}
                  <button
                    onClick={() => { router.push(`/u/${userData?.zid}`); setSidebarOpen(false); setSelectedCoreSlot(null); }}
                    style={{ display: "flex", alignItems: "center", gap: "14px", background: "transparent", border: "none", cursor: "pointer", padding: 0, textAlign: "left", width: "calc(100% - 52px)" }}
                  >
                    {/* avatar with glow ring */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ position: "absolute", inset: -3, borderRadius: "50%", background: "conic-gradient(var(--color-electric, #FF2D87), var(--color-accent, #FFD700), var(--color-cyan, #00E5FF), var(--color-electric, #FF2D87))", animation: "sb-glow-ring 3s ease-in-out infinite", opacity: .7 }} />
                      <img
                        src={userData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.zid}`}
                        alt="avatar"
                        style={{ position: "relative", width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: "2px solid #080E24", display: "block" }}
                      />
                      <span style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: "#6BCB77", boxShadow: "0 0 6px #6BCB77", border: "2px solid #080E24", animation: "zee-online 2s ease-in-out infinite" }} />
                    </div>

                    {/* name + stats */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "15px", fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px" }}>{userData?.display_name}</span>
                        {gen && <GenBadge gen={gen} size="icon" />}
                      </div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "var(--color-electric, #FF2D87)", opacity: .75, letterSpacing: "1px", marginBottom: "6px" }}>@{userData?.zid}</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "20px", background: "color-mix(in srgb, var(--color-electric, #FF2D87) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-electric, #FF2D87) 20%, transparent)", fontFamily: "'VT323',monospace", fontSize: "11px", color: "var(--color-electric, #FF2D87)", opacity: .9, letterSpacing: "0.5px" }}>{friendCount} FR</span>
                        <span style={{ padding: "2px 8px", borderRadius: "20px", background: "rgba(255,200,0,.08)", border: "1px solid rgba(255,200,0,.18)", fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,200,0,.75)", letterSpacing: "0.5px" }}>{stats.zaps} ZPS</span>
                      </div>
                    </div>
                  </button>

                  {/* status message */}
                  {userData?.status_message && (
                    <div style={{ marginTop: "12px", padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,255,255,.5)", letterSpacing: "0.5px", fontStyle: "italic" }}>"{userData.status_message}"</span>
                    </div>
                  )}
                </div>

                {/* ── SCROLLABLE BODY ───────────────────────────────── */}
                <div className="sb-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

                  {/* ── CORE 8 ──────────────────────────────────────── */}
                  <div style={{ padding: "18px 16px 16px" }}>
                    {/* section header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "3px", height: "18px", background: "linear-gradient(180deg, #FF6400, rgba(255,100,0,.1))", borderRadius: "2px" }} />
                        <Flame size={13} color="#FF6400" />
                        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>CORE 8</span>
                        <span style={{ padding: "1px 7px", borderRadius: "20px", background: "rgba(255,100,0,.12)", border: "1px solid rgba(255,100,0,.25)", fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,100,0,.8)" }}>{coreEight.length}/8</span>
                      </div>
                      {selectedCoreSlot !== null ? (
                        <button onClick={() => setSelectedCoreSlot(null)} style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,100,0,.6)", background: "rgba(255,100,0,.08)", border: "1px solid rgba(255,100,0,.2)", borderRadius: "8px", padding: "2px 8px", cursor: "pointer", letterSpacing: "0.5px" }}>CANCEL</button>
                      ) : (
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.2)", letterSpacing: "0.5px" }}>TAP TO SELECT · SWAP</span>
                      )}
                    </div>

                    {/* hint banner when slot selected */}
                    {selectedCoreSlot !== null && (
                      <div style={{ marginBottom: "10px", padding: "7px 12px", borderRadius: "10px", background: "rgba(255,100,0,.08)", border: "1px solid rgba(255,100,0,.2)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px" }}>✦</span>
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,100,0,.85)", letterSpacing: "0.5px" }}>
                          SLOT {String(selectedCoreSlot).padStart(2,"0")} SELECTED — TAP ANOTHER TO SWAP
                        </span>
                      </div>
                    )}

                    {/* 4×2 grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                      {[1,2,3,4,5,6,7,8].map(spot => {
                        const entry = coreEight.find(c => c.position === spot);
                        const friend = entry?.friend;
                        const isSelected = selectedCoreSlot === spot;
                        const hasSelection = selectedCoreSlot !== null;
                        const isSwapTarget = hasSelection && !isSelected;

                        return (
                          <div
                            key={spot}
                            className="c8-slot"
                            onClick={() => handleCoreSlotTap(spot)}
                            style={{
                              aspectRatio: "1", position: "relative", borderRadius: "14px",
                              background: isSelected
                                ? "rgba(255,100,0,.18)"
                                : friend ? "rgba(255,100,0,.07)" : "rgba(255,255,255,.025)",
                              border: isSelected
                                ? "2px solid rgba(255,100,0,.8)"
                                : isSwapTarget && friend ? "1px dashed rgba(255,100,0,.45)"
                                : isSwapTarget && !friend ? "1px dashed rgba(255,255,255,.2)"
                                : friend ? "1px solid rgba(255,100,0,.2)" : "1px solid rgba(255,255,255,.06)",
                              boxShadow: isSelected ? "0 0 16px rgba(255,100,0,.35), inset 0 0 12px rgba(255,100,0,.08)" : "none",
                              cursor: "pointer", display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center", overflow: "hidden",
                              transform: isSelected ? "scale(1.05)" : "scale(1)",
                            }}
                          >
                            <span style={{ position: "absolute", top: "3px", left: "4px", fontFamily: "'VT323',monospace", fontSize: "8px", color: isSelected ? "rgba(255,100,0,.7)" : "rgba(255,100,0,.28)" }}>
                              {String(spot).padStart(2,"0")}
                            </span>

                            {friend ? (
                              <>
                                <img
                                  src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.zid}`}
                                  style={{ width: "33px", height: "33px", borderRadius: "50%", border: `1.5px solid ${isSelected ? "rgba(255,100,0,.7)" : "rgba(255,100,0,.3)"}`, marginBottom: "3px" }}
                                  alt={friend.display_name}
                                />
                                <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "7px", color: "rgba(255,255,255,.8)", textAlign: "center", width: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {friend.display_name}
                                </span>
                                {!isSelected && !hasSelection && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleRemoveFromSlot(spot); }}
                                    style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(220,40,40,.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                  >
                                    <X size={8} color="#fff" />
                                  </button>
                                )}
                                {/* subtle swap badge at bottom — does NOT cover the avatar */}
                                {isSwapTarget && (
                                  <div style={{ position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)", background: "rgba(255,100,0,.85)", borderRadius: "4px", padding: "1px 5px" }}>
                                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "#fff", letterSpacing: "0.3px" }}>SWAP</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {isSwapTarget ? (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                    <span style={{ fontSize: "14px", opacity: .5 }}>→</span>
                                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "7px", color: "rgba(255,255,255,.3)", letterSpacing: "0.5px" }}>MOVE</span>
                                  </div>
                                ) : (
                                  <Plus size={13} color="rgba(255,100,0,.28)" />
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── DIVIDER ─────────────────────────────────────── */}
                  <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent)", margin: "0 16px" }} />

                  {/* ── MY ZONES ────────────────────────────────────── */}
                  <div style={{ padding: "16px 16px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "3px", height: "18px", background: "linear-gradient(180deg, #00E5FF, rgba(0,229,255,.1))", borderRadius: "2px" }} />
                        <Activity size={13} color="#00E5FF" />
                        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>MY ZONES</span>
                      </div>
                      <button onClick={() => { router.push("/zones"); setSidebarOpen(false); }} style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(0,229,255,.5)", background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.5px" }}>ALL →</button>
                    </div>

                    {myZones.length === 0 ? (
                      <button onClick={() => { router.push("/zones"); setSidebarOpen(false); }}
                        style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "rgba(0,229,255,.04)", border: "1px dashed rgba(0,229,255,.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <Plus size={13} color="rgba(0,229,255,.4)" />
                        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, color: "rgba(0,229,255,.45)", letterSpacing: "1px" }}>FIND ZONES</span>
                      </button>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {myZones.slice(0, 6).map(zone => (
                          <button key={zone.id} onClick={() => { router.push(`/zones/${zone.slug}`); setSidebarOpen(false); }}
                            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 10px", borderRadius: "12px", background: "rgba(255,255,255,.02)", border: "1px solid transparent", cursor: "pointer", textAlign: "left", width: "100%", transition: "all .15s" }}
                            onTouchStart={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,229,255,.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,229,255,.1)"; }}
                            onTouchEnd={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.02)"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,229,255,.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,229,255,.1)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.02)"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                          >
                            <div style={{ width: 36, height: 36, borderRadius: "10px", background: `${zone.accent_color}18`, border: `1px solid ${zone.accent_color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "18px" }}>
                              {zone.icon_emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{zone.name}</div>
                              <div style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.2)", letterSpacing: "0.3px" }}>{zone.member_count} members</div>
                            </div>
                            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: zone.accent_color, boxShadow: `0 0 8px ${zone.accent_color}`, flexShrink: 0 }} />
                          </button>
                        ))}
                        {myZones.length > 6 && (
                          <button onClick={() => { router.push("/zones"); setSidebarOpen(false); }}
                            style={{ padding: "8px", borderRadius: "10px", background: "transparent", border: "1px dashed rgba(0,229,255,.12)", color: "rgba(0,229,255,.35)", fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer", width: "100%", marginTop: "4px" }}>
                            +{myZones.length - 6} MORE
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── WHO'S ONLINE ────────────────────────────────── */}
                  {onlineBuddies.length > 0 && (
                    <>
                      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent)", margin: "0 16px" }} />
                      <div style={{ padding: "16px 16px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "3px", height: "18px", background: "linear-gradient(180deg, #6BCB77, rgba(107,203,119,.1))", borderRadius: "2px" }} />
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6BCB77", boxShadow: "0 0 8px #6BCB77", display: "inline-block", animation: "zee-online 2s ease-in-out infinite", flexShrink: 0 }} />
                            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>WHO'S ON</span>
                          </div>
                          <span style={{ padding: "1px 7px", borderRadius: "20px", background: "rgba(107,203,119,.1)", border: "1px solid rgba(107,203,119,.22)", fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(107,203,119,.8)" }}>{onlineBuddies.length} ONLINE</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          {onlineBuddies.map(buddy => {
                            const minsAgo = buddy.last_seen_at ? Math.floor((Date.now() - new Date(buddy.last_seen_at).getTime()) / 60000) : 999;
                            const isOnline = minsAgo < 15;
                            const isAway = minsAgo < 60;
                            const dotColor = isOnline ? "#6BCB77" : isAway ? "#FFD700" : "rgba(255,255,255,.2)";
                            const statusLabel = buddy.status_message
                              ? buddy.status_message.slice(0, 22) + (buddy.status_message.length > 22 ? "…" : "")
                              : isOnline ? "online now" : isAway ? `away · ${minsAgo}m` : `${minsAgo}m ago`;
                            return (
                              <button key={buddy.id}
                                onClick={() => { router.push(`/u/${buddy.zid}`); setSidebarOpen(false); }}
                                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 10px", borderRadius: "12px", background: "rgba(255,255,255,.02)", border: "1px solid transparent", cursor: "pointer", textAlign: "left", width: "100%", transition: "all .15s" }}
                                onTouchStart={e => { (e.currentTarget as HTMLElement).style.background = "rgba(107,203,119,.07)"; }}
                                onTouchEnd={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.02)"; }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(107,203,119,.07)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.02)"; }}
                              >
                                <div style={{ position: "relative", flexShrink: 0 }}>
                                  <img src={buddy.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${buddy.zid}`} alt="" style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${dotColor}35`, display: "block" }} />
                                  <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: dotColor, boxShadow: isOnline ? `0 0 6px ${dotColor}` : "none", border: "2px solid #080E24", animation: isOnline ? "zee-online 2s ease-in-out infinite" : "none" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{buddy.display_name || buddy.zid}</div>
                                  <div style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: dotColor, opacity: .85, letterSpacing: "0.3px" }}>{statusLabel}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── BOTTOM SAFE AREA ────────────────────────────── */}
                  <div style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 24px)", flexShrink: 0 }} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════
            MAIN LAYOUT GRID
        ══════════════════════════════════════════════════════════ */}
        <motion.div
          animate={{
            scale: sidebarOpen && window.innerWidth <= 768 ? 0.95 : 1,
            opacity: sidebarOpen && window.innerWidth <= 768 ? 0.4 : 1,
            borderRadius: sidebarOpen && window.innerWidth <= 768 ? "24px" : "0px",
            x: sidebarOpen && window.innerWidth <= 768 ? "120px" : "0px",
          }}
          transition={{ type: "spring", damping: 24, stiffness: 200 }}
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "20px 16px",
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: "20px",
            pointerEvents: sidebarOpen && typeof window !== "undefined" && window.innerWidth <= 768 ? "none" : "auto",
            transformOrigin: "center right",
          }}
          className="dashboard-grid"
        >
          {/* ══════════════════════════════════════════════════════
              LEFT SIDEBAR
          ══════════════════════════════════════════════════════ */}
          <div className="col-wrapper hidden md:flex" style={{ flexDirection: "column", gap: "16px" }}>

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
        </motion.div>

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
              zIndex: 2000,
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

          /* Hide sidebar cards from the main grid — scoped so they still show inside the slide-out sidebar panel */
          .card-profile { display: none !important; }
          .dashboard-grid .card-core8 { display: none !important; }
          .dashboard-grid .card-zones { display: none !important; }
          .card-buzz    { order: 1; margin-bottom: 8px; }
          .card-feed    { order: 2; }
          .card-theme   { order: 3; }

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