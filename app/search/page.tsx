"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import ThemeEngine, { type ThemeConfig } from "@/components/ThemeEngine";
import {
    searchUsers, discoverUsers, getFriendshipStatus, sendFriendRequest,
} from "@/lib/supabase/queries";
import {
    Search, Loader2, Users, UserPlus, UserCheck, Clock,
    MessageSquare, Sparkles, Globe, Grid3X3, List as ListIcon, Wifi, RotateCcw,
} from "lucide-react";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import { AGENT_IDS } from "@/lib/agents";
import { formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
//  THEME-AWARE CONSTANTS (CSS vars with fallbacks)
// ─────────────────────────────────────────────────────────────────────────────

// Solid colors — use directly in `color:`, `border-color:`, etc.
const TP = "var(--color-electric, #8A2EFF)";   // primary
const TC = "var(--color-cyan, #00E5FF)";        // cyan/secondary

// Alpha variants using color-mix (works with CSS vars)
const tpa = (pct: number) => `color-mix(in srgb,${TP} ${pct}%,transparent)`;
const tca = (pct: number) => `color-mix(in srgb,${TC} ${pct}%,transparent)`;

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES — injected once, uses CSS vars so they respond to ThemeEngine
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_ID = "zee-search-styles-v3";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    document.getElementById("zee-search-styles")?.remove();
    document.getElementById("zee-search-styles-v2")?.remove();
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');

    @keyframes zee-entry    { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes zee-marquee  { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
    @keyframes zee-led      { 0%,100%{opacity:.5} 50%{opacity:1} }
    @keyframes zee-online   { 0%,100%{opacity:1;transform:scale(1)} 60%{opacity:.35;transform:scale(1.7)} }
    @keyframes zee-away     { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes zee-shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes zee-scanbar  { 0%{transform:translateY(-100%);opacity:.55} 100%{transform:translateY(300%);opacity:0} }
    @keyframes zee-blink    { 0%,49%{opacity:1} 50%,100%{opacity:0} }
    @keyframes zee-badge-in { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    @keyframes spin         { to{transform:rotate(360deg)} }

    .user-card {
      animation: zee-entry .28s ease-out both;
      position: relative; overflow: hidden;
      transition: transform .18s ease, border-color .2s ease, box-shadow .2s ease;
    }
    .user-card::before {
      content:""; position:absolute; left:0; right:0; top:0;
      height:45%; background:linear-gradient(180deg,rgba(255,255,255,.06) 0%,transparent 100%);
      transform:translateY(-100%); pointer-events:none; z-index:20; opacity:0;
    }
    .user-card:hover { transform: translateY(-2px); }
    .user-card:hover::before { opacity:1; animation:zee-scanbar 2s ease-in infinite; }

    .grid-card {
      animation: zee-entry .28s ease-out both; position: relative; overflow: hidden;
      transition: transform .18s ease, border-color .2s ease, box-shadow .2s ease;
    }
    .grid-card:hover { transform: translateY(-3px) scale(1.01); }

    .zee-shimmer {
      background: linear-gradient(90deg,
        color-mix(in srgb,var(--color-electric,#8A2EFF) 4%,transparent) 25%,
        color-mix(in srgb,var(--color-electric,#8A2EFF) 12%,transparent) 50%,
        color-mix(in srgb,var(--color-electric,#8A2EFF) 4%,transparent) 75%);
      background-size: 200% 100%;
      animation: zee-shimmer 1.5s infinite;
    }
    .zee-led    { animation: zee-led 2.4s ease-in-out infinite; }
    .zee-cursor::after { content:"▌"; animation:zee-blink .85s step-end infinite; color:inherit; opacity:.65; }
    .zee-crt { pointer-events:none;position:fixed;inset:0;z-index:997;opacity:.028;background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.4) 2px,rgba(0,0,0,.4) 4px); }

    .zee-search-input:focus {
      border-color: color-mix(in srgb,var(--color-electric,#8A2EFF) 70%,transparent) !important;
      box-shadow: 0 0 0 1px color-mix(in srgb,var(--color-electric,#8A2EFF) 20%,transparent),
                  0 0 24px color-mix(in srgb,var(--color-electric,#8A2EFF) 15%,transparent) !important;
    }
    .zee-search-input::placeholder { color: rgba(255,255,255,.2); font-family:'VT323',monospace; letter-spacing:1px; }

    .alpha-btn { transition: all .12s; }
    .alpha-btn:hover { background: color-mix(in srgb,var(--color-electric,#8A2EFF) 18%,transparent) !important; color: #fff !important; }
    .filter-pill { transition: all .15s; }
    .recent-card { animation: zee-entry .3s ease-out both; transition: transform .18s ease; }
    .recent-card:hover { transform: translateY(-2px) scale(1.02); }
    .suggest-card { animation: zee-entry .3s ease-out both; transition: transform .18s ease, border-color .18s ease; }
    .suggest-card:hover { transform: translateY(-2px); }
    .alpha-strip { overflow-x: auto; scrollbar-width: none; }
    @media (max-width: 768px) {
      .alpha-btn { width: 28px !important; height: 36px !important; border-radius: 6px !important; font-size: 12px !important; }
      .alpha-strip { gap: 4px !important; }
    }
    .alpha-strip::-webkit-scrollbar { display: none; }
    .recent-scroll, .suggest-scroll, .grid-mob-scroll { overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
    .recent-scroll::-webkit-scrollbar, .suggest-scroll::-webkit-scrollbar, .grid-mob-scroll::-webkit-scrollbar { display: none; }
    /* Styled select dropdown */
    .gen-select {
      appearance: none; -webkit-appearance: none;
      background: rgba(0,0,0,.4) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,.3)'/%3E%3C/svg%3E") no-repeat right 8px center;
      border: 1px solid color-mix(in srgb,var(--color-electric,#8A2EFF) 30%,transparent);
      color: #fff; padding: 4px 26px 4px 10px; border-radius: 5px; cursor: pointer; outline: none;
      font-family: 'VT323',monospace; font-size: 11px; letter-spacing: 1px;
      transition: border-color .15s, box-shadow .15s;
    }
    .gen-select:focus { border-color: color-mix(in srgb,var(--color-electric,#8A2EFF) 60%,transparent); box-shadow: 0 0 8px color-mix(in srgb,var(--color-electric,#8A2EFF) 20%,transparent); }
    .gen-select option { background: #0a0f2a; color: #fff; }
    @media (max-width: 640px) {
      .user-card-actions { display:none; }
      .user-card:hover .user-card-actions { display:flex; }
      .grid-mob-scroll { display: flex !important; flex-wrap: nowrap !important; }
      .grid-mob-scroll .grid-card { flex-shrink: 0; width: 150px; }
    }
    @media (prefers-reduced-motion:reduce) {
      .user-card,.user-card::before,.zee-shimmer,.zee-led,.grid-card { animation:none!important; }
    }
  `;
    document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

type UserResult = {
    id: string; display_name: string; zid: string; avatar_url: string | null;
    status_message: string | null; created_at: string;
    birth_year?: number | null; birth_month?: number | null; birth_day?: number | null;
    last_seen_at?: string | null; online_status?: string | null;
    influence_score?: number | null;
};
type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends" | "loading";
type GenFilter = "all" | "Gen Z" | "Zillennial" | "Millennial" | "Gen X" | "Boomer" | "Gen Alpha";
type VibesMap = Record<string, { avg: number; count: number }>;
type MutualMap = Record<string, number>;

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const GEN_FILTERS: { key: GenFilter; icon: string; color: string }[] = [
    { key: "all", icon: "✦", color: TP },
    { key: "Gen Alpha", icon: "α", color: "#C084FC" },
    { key: "Gen Z", icon: "◈", color: "#B4FF00" },
    { key: "Zillennial", icon: "✦", color: "#C4B5FD" },
    { key: "Millennial", icon: "★", color: "#ffffff" },
    { key: "Gen X", icon: "▬", color: "#9CA3AF" },
    { key: "Boomer", icon: "◉", color: "#F5A623" },
];

const ALPHA_CHARS = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

function getOnlineState(lastSeen?: string | null, onlineStatus?: string | null): "online" | "away" | "offline" {
    if (lastSeen) {
        const diff = Date.now() - new Date(lastSeen).getTime();
        if (diff < 5 * 60_000) return "online";
        if (diff < 30 * 60_000) return "away";
    }
    if (onlineStatus === "online") return "online";
    return "offline";
}


// ─────────────────────────────────────────────────────────────────────────────
//  SHARED PRIMITIVES — uses CSS vars via TP/TC
// ─────────────────────────────────────────────────────────────────────────────

function PortalCard({ children, accent, style }: {
    children: React.ReactNode; accent?: string; style?: React.CSSProperties;
}) {
    const resolvedAccent = accent ?? tpa(22);
    return (
        <div style={{
            background: "var(--color-card-bg, rgba(10,16,42,.92))",
            backdropFilter: "blur(var(--glass-blur, 14px))",
            border: `1px solid ${resolvedAccent}`,
            borderRadius: "var(--border-radius-theme, 12px)",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)",
            ...style,
        }}>
            {children}
        </div>
    );
}

function ModuleHeader({ icon, title, accent, right }: {
    icon: React.ReactNode; title: string; accent?: string; right?: React.ReactNode;
}) {
    const ac = accent ?? TP;
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 14px 9px 12px",
            background: `linear-gradient(90deg,${tpa(13)} 0%,transparent 100%)`,
            borderBottom: `1px solid ${tpa(19)}`,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div className="zee-led" style={{ width: "3px", height: "16px", background: `linear-gradient(180deg,${ac},${tpa(27)})`, borderRadius: "1px", flexShrink: 0, boxShadow: `0 0 6px ${ac}` }} />
                <span style={{ color: ac, display: "flex", alignItems: "center" }}>{icon}</span>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.8px" }}>{title}</span>
            </div>
            {right}
        </div>
    );
}

function EmptyTerminal({ label, hint }: { label: string; hint?: string }) {
    return (
        <div style={{ padding: "36px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", border: `1px dashed ${tpa(16)}`, borderRadius: "10px", background: tpa(2) }}>
            <div style={{ display: "flex", gap: "5px" }}>
                {["#FF5F56", "#FFBD2E", "#27C93F"].map(c => <div key={c} style={{ width: "8px", height: "8px", borderRadius: "50%", background: c, opacity: .35 }} />)}
            </div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: tpa(31), letterSpacing: "1.5px", textAlign: "left", alignSelf: "stretch" }}>
                <span style={{ color: "#B4FF00", opacity: .6 }}>zeezu@network</span>
                <span style={{ color: "rgba(255,255,255,.2)" }}>:</span>
                <span style={{ color: TP, opacity: .7 }}>~$</span>
                {" "}<span style={{ color: "rgba(255,255,255,.3)" }}>search --network</span>
                <span style={{ display: "block", marginTop: "4px", color: "rgba(255,255,255,.1)" }}>0 results returned</span>
            </div>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,255,255,.25)", letterSpacing: "2.5px", margin: 0 }}>{label}</p>
            {hint && <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.18)", margin: 0, textAlign: "center" }}>{hint}</p>}
            <span className="zee-cursor" style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: TP, opacity: .45, letterSpacing: "1px", alignSelf: "flex-start" }}>
                zeezu@network:~$
            </span>
        </div>
    );
}

function SkeletonCard() {
    return <div className="zee-shimmer" style={{ height: "76px", borderRadius: "10px", border: `1px solid ${tpa(12)}` }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONLINE DOT
// ─────────────────────────────────────────────────────────────────────────────

function OnlineDot({ state, size = 9 }: { state: "online" | "away" | "offline"; size?: number }) {
    if (state === "offline") return null;
    const color = state === "online" ? "#6BCB77" : "#FFB347";
    const anim = state === "online" ? "zee-online 2.2s ease-in-out infinite" : "zee-away 1.8s ease-in-out infinite";
    return (
        <span style={{
            position: "absolute", bottom: "-1px", right: "-1px",
            width: `${size}px`, height: `${size}px`, borderRadius: "50%",
            background: color, border: "1.5px solid #070C1E",
            boxShadow: `0 0 5px ${color}`, animation: anim,
        }} />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  VIBES DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

function VibesDisplay({ vibes }: { vibes?: { avg: number; count: number } }) {
    if (!vibes || vibes.count < 1) return null;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: "2px",
            fontFamily: "'VT323',monospace", fontSize: "10px",
            color: "#FFD700", opacity: .75, flexShrink: 0,
        }}>
            {"★".repeat(Math.min(Math.round(vibes.avg), 5))}
            <span style={{ color: "rgba(255,255,255,.3)", fontSize: "9px" }}>{vibes.avg.toFixed(1)}</span>
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FRIEND STATUS BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function FriendBtn({ userId, status, addingFriend, onAdd }: {
    userId: string; status: FriendStatus; addingFriend: string | null;
    onAdd: (id: string) => void;
}) {
    const base: React.CSSProperties = {
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "5px 10px", borderRadius: "6px",
        fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 700,
        letterSpacing: "0.5px", cursor: "pointer", border: "none",
        whiteSpace: "nowrap" as const, flexShrink: 0, transition: "all .15s",
    };
    if (status === "loading") return null;
    if (status === "friends")
        return <span style={{ ...base, background: "rgba(180,255,0,.1)", border: "1px solid rgba(180,255,0,.3)", color: "#B4FF00", cursor: "default" }}><UserCheck size={10} /> FRIENDS</span>;
    if (status === "pending_sent")
        return <span style={{ ...base, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.35)", cursor: "default" }}><Clock size={10} /> SENT</span>;
    if (status === "pending_received")
        return (
            <Link href="/friends" style={{ ...base, background: tca(10), border: `1px solid ${tca(30)}`, color: TC, textDecoration: "none" }} onClick={e => e.stopPropagation()}>
                <UserCheck size={10} /> ACCEPT
            </Link>
        );
    return (
        <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onAdd(userId); }}
            disabled={addingFriend === userId}
            style={{ ...base, background: tpa(14), border: `1px solid ${tpa(35)}`, color: TP, boxShadow: `0 0 8px ${tpa(20)}` }}
        >
            {addingFriend === userId
                ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                : <UserPlus size={10} />}
            ADD
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  USER CARD — list view
// ─────────────────────────────────────────────────────────────────────────────

function UserCard({ user, index, myId, friendStatus, addingFriend, onAdd, mutualCount, vibes }: {
    user: UserResult; index: number; myId: string | null;
    friendStatus: FriendStatus; addingFriend: string | null;
    onAdd: (id: string) => void;
    mutualCount?: number; vibes?: { avg: number; count: number };
}) {
    const gen = getGeneration(user.birth_year, user.birth_month, user.birth_day, AGENT_IDS.has(user.id ?? ""));
    const onlineState = getOnlineState(user.last_seen_at, user.online_status);

    return (
        <Link href={`/u/${user.zid}`} style={{ textDecoration: "none", display: "block" }}>
            <div
                className="user-card"
                style={{
                    background: "var(--color-card-bg, rgba(10,16,42,.88))",
                    backdropFilter: "blur(var(--glass-blur, 12px))",
                    border: `1px solid ${onlineState === "online" ? "rgba(107,203,119,.2)" : tpa(18)}`,
                    borderRadius: "var(--border-radius-theme, 10px)",
                    boxShadow: "0 4px 20px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.03)",
                    animationDelay: `${Math.min(index * 40, 280)}ms`,
                }}
            >
                <div style={{
                    height: "2px",
                    background: onlineState === "online"
                        ? `linear-gradient(90deg,#6BCB77 0%,${TP} 50%,transparent 100%)`
                        : `linear-gradient(90deg,${TP} 0%,${TC}99 50%,transparent 100%)`,
                    boxShadow: `0 0 6px ${tpa(50)}`,
                }} />
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "9px", overflow: "hidden", border: `1px solid ${onlineState === "online" ? "rgba(107,203,119,.35)" : tpa(30)}`, boxShadow: `0 0 10px ${tpa(15)}` }}>
                            <img src={getAvatar(user.zid, user.avatar_url)} alt={user.display_name} style={{ width: "100%", height: "100%", display: "block" }} />
                        </div>
                        <OnlineDot state={onlineState} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginBottom: "2px" }}>
                            <span style={{ fontFamily: "var(--font-display,'Orbitron',sans-serif)", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user.display_name}
                            </span>
                            <span style={{ fontFamily: "var(--font-mono,'VT323',monospace)", fontSize: "10px", color: "rgba(255,255,255,.25)", flexShrink: 0 }}>
                                <span style={{ color: TC, opacity: .4 }}>@</span>{user.zid}
                            </span>
                            {gen && <GenBadge gen={gen} size="sm" />}
                            <VibesDisplay vibes={vibes} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            {user.status_message && (
                                <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.38)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px", fontStyle: "italic" }}>
                                    &ldquo;{user.status_message}&rdquo;
                                </p>
                            )}
                            {(mutualCount ?? 0) > 0 && (
                                <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: TC, opacity: .65, letterSpacing: "0.5px", flexShrink: 0 }}>
                                    {mutualCount} MUTUAL
                                </span>
                            )}
                        </div>
                        <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.2)", letterSpacing: "0.5px", margin: "2px 0 0" }}>
                            JOINED {formatDistanceToNow(new Date(user.created_at), { addSuffix: true }).toUpperCase()}
                        </p>
                    </div>
                    {myId && myId !== user.id && (
                        <div className="user-card-actions" style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            <FriendBtn userId={user.id} status={friendStatus} addingFriend={addingFriend} onAdd={onAdd} />
                            <Link
                                href={`/messages/${user.id}`}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: "30px", height: "30px", borderRadius: "6px",
                                    background: tca(8), border: `1px solid ${tca(20)}`,
                                    color: "rgba(0,229,255,.55)", flexShrink: 0, transition: "all .15s",
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = tca(15); (e.currentTarget as HTMLAnchorElement).style.color = TC; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = tca(8); (e.currentTarget as HTMLAnchorElement).style.color = "rgba(0,229,255,.55)"; }}
                            >
                                <MessageSquare size={12} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  GRID USER CARD
// ─────────────────────────────────────────────────────────────────────────────

function GridUserCard({ user, index, myId, friendStatus, addingFriend, onAdd, mutualCount, vibes }: {
    user: UserResult; index: number; myId: string | null;
    friendStatus: FriendStatus; addingFriend: string | null;
    onAdd: (id: string) => void;
    mutualCount?: number; vibes?: { avg: number; count: number };
}) {
    const router = useRouter();
    const gen = getGeneration(user.birth_year, user.birth_month, user.birth_day, AGENT_IDS.has(user.id ?? ""));
    const onlineState = getOnlineState(user.last_seen_at, user.online_status);

    return (
        <div onClick={() => router.push(`/u/${user.zid}`)} style={{ textDecoration: "none", cursor: "pointer" }}>
            <div className="grid-card" style={{
                background: "var(--color-card-bg, rgba(10,16,42,.92))",
                backdropFilter: "blur(var(--glass-blur, 12px))",
                border: `1px solid ${onlineState === "online" ? "rgba(107,203,119,.22)" : tpa(20)}`,
                borderRadius: "var(--border-radius-theme, 12px)",
                boxShadow: "0 4px 20px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
                animationDelay: `${Math.min(index * 40, 280)}ms`,
                padding: "14px", textAlign: "center",
            }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,${TP},${TC})` }} />
                <div style={{ position: "relative", display: "inline-block", marginBottom: "8px" }}>
                    <div style={{ width: "54px", height: "54px", borderRadius: "12px", overflow: "hidden", border: `2px solid ${onlineState === "online" ? "rgba(107,203,119,.4)" : tpa(30)}`, margin: "0 auto", boxShadow: `0 0 14px ${tpa(20)}` }}>
                        <img src={getAvatar(user.zid, user.avatar_url)} alt={user.display_name} style={{ width: "100%", height: "100%", display: "block" }} />
                    </div>
                    <OnlineDot state={onlineState} size={10} />
                </div>
                <div style={{ fontFamily: "var(--font-display,'Orbitron',sans-serif)", fontSize: "11px", fontWeight: 700, color: "#fff", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.2px" }}>
                    {user.display_name}
                </div>
                <div style={{ fontFamily: "var(--font-mono,'VT323',monospace)", fontSize: "10px", color: "rgba(255,255,255,.25)", marginBottom: "5px" }}>
                    <span style={{ color: TC, opacity: .5 }}>@</span>{user.zid}
                </div>
                {gen && (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
                        <GenBadge gen={gen} size="sm" />
                    </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px", minHeight: "16px" }}>
                    {vibes && vibes.count > 0 ? (
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "#FFD700" }}>
                            {"★".repeat(Math.min(Math.round(vibes.avg), 5))}{" "}
                            <span style={{ fontSize: "9px", opacity: .7 }}>{vibes.avg.toFixed(1)}</span>
                        </span>
                    ) : (
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.15)", letterSpacing: "0.5px" }}>UNRATED</span>
                    )}
                    {(mutualCount ?? 0) > 0 && (
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: TC, opacity: .7 }}>
                            {mutualCount} MUTUAL
                        </span>
                    )}
                </div>
                {myId && myId !== user.id && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }} onClick={e => e.preventDefault()}>
                        <FriendBtn userId={user.id} status={friendStatus} addingFriend={addingFriend} onAdd={onAdd} />
                        <Link
                            href={`/messages/${user.id}`}
                            onClick={e => e.stopPropagation()}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: "28px", height: "28px", borderRadius: "6px",
                                background: tca(8), border: `1px solid ${tca(20)}`,
                                color: "rgba(0,229,255,.55)", transition: "all .15s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = tca(15); }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = tca(8); }}
                        >
                            <MessageSquare size={11} />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RECENTLY JOINED SPOTLIGHT
// ─────────────────────────────────────────────────────────────────────────────

function RecentSpotlight({ users }: { users: UserResult[] }) {
    if (users.length === 0) return null;
    return (
        <PortalCard accent="rgba(180,255,0,.2)" style={{ marginBottom: "14px" }}>
            <ModuleHeader icon={<Sparkles size={11} />} title="RECENTLY JOINED" accent="#B4FF00" right={
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(180,255,0,.35)", letterSpacing: "1px" }}>NEW TO THE GRID</span>
            } />
            <div className="recent-scroll" style={{ display: "flex", gap: "10px", padding: "12px 12px 10px", flexWrap: "nowrap" }}>
                {users.slice(0, 8).map((u, i) => (
                    <Link key={u.id} href={`/u/${u.zid}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                        <div className="recent-card" style={{
                            width: "88px", background: "rgba(180,255,0,.04)", border: "1px solid rgba(180,255,0,.15)",
                            borderRadius: "10px", padding: "10px 8px", textAlign: "center", animationDelay: `${i * 40}ms`,
                        }}>
                            <div style={{ position: "relative", display: "inline-block", marginBottom: "6px" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(180,255,0,.25)", margin: "0 auto" }}>
                                    <img src={getAvatar(u.zid, u.avatar_url)} alt={u.display_name} style={{ width: "100%", height: "100%", display: "block" }} />
                                </div>
                                <OnlineDot state={getOnlineState(u.last_seen_at, u.online_status)} size={8} />
                            </div>
                            <div style={{ fontFamily: "var(--font-display,'Orbitron',sans-serif)", fontSize: "8px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {u.display_name}
                            </div>
                            <div style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "#B4FF00", opacity: .5, marginTop: "2px" }}>NEW</div>
                        </div>
                    </Link>
                ))}
            </div>
        </PortalCard>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PEOPLE YOU MAY KNOW
// ─────────────────────────────────────────────────────────────────────────────

function PeopleYouMayKnow({ users, friendStatuses, addingFriend, onAdd, mutualCounts, vibesScores }: {
    users: UserResult[];
    friendStatuses: Record<string, FriendStatus>;
    addingFriend: string | null;
    onAdd: (id: string) => void;
    mutualCounts: MutualMap;
    vibesScores: VibesMap;
}) {
    if (users.length === 0) return null;
    return (
        <PortalCard accent={tpa(25)} style={{ marginBottom: "14px" }}>
            <ModuleHeader icon={<Users size={11} />} title="PEOPLE YOU MAY KNOW" right={
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: tpa(50), letterSpacing: "1px" }}>SUGGESTED</span>
            } />
            {/* Horizontal scroll for mobile UX */}
            <div className="suggest-scroll" style={{ display: "flex", gap: "10px", padding: "12px 12px 10px", flexWrap: "nowrap" }}>
                {users.map((u, i) => {
                    const mutual = mutualCounts[u.id] ?? 0;
                    const vibes = vibesScores[u.id];
                    return (
                        <Link key={u.id} href={`/u/${u.zid}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                            <div className="suggest-card" style={{
                                width: "110px", background: tpa(4), border: `1px solid ${tpa(15)}`,
                                borderRadius: "10px", padding: "10px 8px", textAlign: "center",
                                animationDelay: `${i * 40}ms`,
                            }}>
                                <div style={{ position: "relative", display: "inline-block", marginBottom: "6px" }}>
                                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", border: `1.5px solid ${tpa(30)}`, margin: "0 auto" }}>
                                        <img src={getAvatar(u.zid, u.avatar_url)} alt={u.display_name} style={{ width: "100%", height: "100%", display: "block" }} />
                                    </div>
                                    <OnlineDot state={getOnlineState(u.last_seen_at, u.online_status)} size={8} />
                                </div>
                                <div style={{ fontFamily: "var(--font-display,'Orbitron',sans-serif)", fontSize: "8px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}>
                                    {u.display_name}
                                </div>
                                {vibes && vibes.count > 0 && (
                                    <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#FFD700", marginBottom: "2px" }}>
                                        {"★".repeat(Math.min(Math.round(vibes.avg), 5))}{" "}
                                        <span style={{ fontSize: "9px", opacity: .7 }}>{vibes.avg.toFixed(1)}</span>
                                    </div>
                                )}
                                {mutual > 0 && (
                                    <div style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: TC, opacity: .7, marginBottom: "4px" }}>
                                        {mutual} MUTUAL
                                    </div>
                                )}
                                <div onClick={e => e.preventDefault()} style={{ marginTop: "4px" }}>
                                    <FriendBtn userId={u.id} status={friendStatuses[u.id] ?? "none"} addingFriend={addingFriend} onAdd={onAdd} />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </PortalCard>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ALPHA STRIP
// ─────────────────────────────────────────────────────────────────────────────

function AlphaStrip({ active, onChange, counts }: {
    active: string | null;
    onChange: (l: string | null) => void;
    counts: Record<string, number>;
}) {
    return (
        <div style={{ marginBottom: "10px" }}>
            <div className="alpha-strip" style={{ display: "flex", gap: "3px" }}>
                {ALPHA_CHARS.map(ch => {
                    const hasUsers = (counts[ch] ?? 0) > 0;
                    const isActive = active === ch;
                    return (
                        <button
                            key={ch}
                            className="alpha-btn"
                            onClick={() => onChange(isActive ? null : ch)}
                            disabled={!hasUsers}
                            style={{
                                flexShrink: 0, width: "22px", height: "22px",
                                borderRadius: "4px", border: "none", cursor: hasUsers ? "pointer" : "default",
                                background: isActive ? TP : tpa(8),
                                color: isActive ? "#fff" : hasUsers ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.15)",
                                fontFamily: "'VT323',monospace", fontSize: "11px",
                                boxShadow: isActive ? `0 0 8px ${tpa(50)}` : "none",
                                transition: "all .12s",
                            }}
                        >
                            {ch}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchPage() {
    const router = useRouter();

    // ── State ──────────────────────────────────────────────────────
    const [myId, setMyId] = useState<string | null>(null);
    const [customization, setCustomization] = useState<ThemeConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<UserResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [discoverLoading, setDiscoverLoading] = useState(true);
    const [allUsers, setAllUsers] = useState<UserResult[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [page, setPage] = useState(0);
    const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendStatus>>({});
    const [addingFriend, setAddingFriend] = useState<string | null>(null);

    // ── New features ───────────────────────────────────────────────
    const [genFilter, setGenFilter] = useState<GenFilter>("all");
    const [onlineOnly, setOnlineOnly] = useState(false);
    const [gridView, setGridView] = useState(true);
    const [alphaLetter, setAlphaLetter] = useState<string | null>(null);
    const [mutualCounts, setMutualCounts] = useState<MutualMap>({});
    const [vibesScores, setVibesScores] = useState<VibesMap>({});
    const [myFriendIds, setMyFriendIds] = useState<Set<string>>(new Set());

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ── Batch enrichment ───────────────────────────────────────────

    const fetchMyFriendIds = useCallback(async (uid: string) => {
        const { data } = await supabase
            .from("friendships").select("user_id, friend_id")
            .eq("status", "accepted")
            .or(`user_id.eq.${uid},friend_id.eq.${uid}`);
        const ids = new Set((data || []).map(r => r.user_id === uid ? r.friend_id : r.user_id));
        setMyFriendIds(ids);
        return ids;
    }, []);

    const fetchMutualCounts = useCallback(async (friendIds: Set<string>, userIds: string[]) => {
        if (userIds.length === 0 || friendIds.size === 0) return;
        const friendArr = [...friendIds];
        const { data } = await supabase
            .from("friendships").select("user_id, friend_id").eq("status", "accepted")
            .or(`user_id.in.(${userIds.join(",")}),friend_id.in.(${userIds.join(",")})`);
        const counts: MutualMap = {};
        (data || []).forEach(row => {
            const a = row.user_id, b = row.friend_id;
            if (userIds.includes(a) && friendArr.includes(b)) counts[a] = (counts[a] ?? 0) + 1;
            if (userIds.includes(b) && friendArr.includes(a)) counts[b] = (counts[b] ?? 0) + 1;
        });
        setMutualCounts(prev => ({ ...prev, ...counts }));
    }, []);

    const fetchVibesScores = useCallback(async (userIds: string[]) => {
        if (userIds.length === 0) return;
        const { data } = await supabase
            .from("vibes_ratings").select("rated_user_id, trust_score, cool_score, sexy_score")
            .in("rated_user_id", userIds);
        const acc: Record<string, { sum: number; count: number }> = {};
        (data || []).forEach(r => {
            const avg = ((r.trust_score ?? 0) + (r.cool_score ?? 0) + (r.sexy_score ?? 0)) / 3;
            if (!acc[r.rated_user_id]) acc[r.rated_user_id] = { sum: 0, count: 0 };
            acc[r.rated_user_id].sum += avg;
            acc[r.rated_user_id].count += 1;
        });
        const scores: VibesMap = {};
        Object.entries(acc).forEach(([id, { sum, count }]) => { scores[id] = { avg: sum / count, count }; });
        setVibesScores(prev => ({ ...prev, ...scores }));
    }, []);

    // ── Init ───────────────────────────────────────────────────────
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }
            setMyId(user.id);

            const [{ users, total }, friendIds, { data: cust }] = await Promise.all([
                discoverUsers(0, 20),
                fetchMyFriendIds(user.id),
                supabase.from("profile_customization").select("*").eq("user_id", user.id).single(),
            ]);
            setCustomization(cust as ThemeConfig);
            setAllUsers(users as UserResult[]);
            setTotalUsers(total);
            setDiscoverLoading(false);
            setLoading(false);

            const userIds = (users as UserResult[]).map(u => u.id);
            await Promise.all([
                fetchMutualCounts(friendIds, userIds),
                fetchVibesScores(userIds),
            ]);
            setTimeout(() => inputRef.current?.focus(), 200);
        }
        init();
    }, [router]);

    const fetchFriendStatuses = useCallback(async (users: UserResult[]) => {
        if (!myId) return;
        const statuses: Record<string, FriendStatus> = {};
        await Promise.all(users.map(async u => {
            if (friendStatuses[u.id]) return;
            const result = await getFriendshipStatus(myId, u.id);
            statuses[u.id] = result.status;
        }));
        if (Object.keys(statuses).length > 0) setFriendStatuses(prev => ({ ...prev, ...statuses }));
    }, [myId, friendStatuses]);

    useEffect(() => {
        if (allUsers.length > 0 && myId) fetchFriendStatuses(allUsers);
    }, [allUsers, myId]);

    // ── Search ─────────────────────────────────────────────────────
    const handleSearch = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); setHasSearched(false); return; }
        setSearching(true); setHasSearched(true);
        const found = await searchUsers(q) as UserResult[];
        setResults(found); setSearching(false);
        if (found.length > 0) {
            const userIds = found.map(u => u.id);
            const [statusArr] = await Promise.all([
                myId
                    ? Promise.all(found.map(async (u: UserResult) => ({ id: u.id, ...(await getFriendshipStatus(myId, u.id)) })))
                    : Promise.resolve([]),
                fetchMutualCounts(myFriendIds, userIds),
                fetchVibesScores(userIds),
            ]);
            if (myId) {
                const sMap: Record<string, FriendStatus> = {};
                (statusArr as { id: string; status: FriendStatus }[]).forEach(s => { sMap[s.id] = s.status; });
                setFriendStatuses(prev => ({ ...prev, ...sMap }));
            }
        }
    }, [myId, myFriendIds]);

    const onQueryChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleSearch(value), 300);
    };

    // ── Load more ──────────────────────────────────────────────────
    const loadMore = async () => {
        const nextPage = page + 1; setPage(nextPage);
        const { users } = await discoverUsers(nextPage, 20);
        const newUsers = users as UserResult[];
        setAllUsers(prev => [...prev, ...newUsers]);
        const userIds = newUsers.map(u => u.id);
        await Promise.all([fetchMutualCounts(myFriendIds, userIds), fetchVibesScores(userIds)]);
    };

    // ── Add friend ─────────────────────────────────────────────────
    const handleAddFriend = async (userId: string) => {
        setAddingFriend(userId);
        await sendFriendRequest(userId);
        setFriendStatuses(prev => ({ ...prev, [userId]: "pending_sent" }));
        setAddingFriend(null);
    };

    // ── Derived ────────────────────────────────────────────────────
    const baseList = hasSearched ? results : allUsers;

    const filteredList = useMemo(() => {
        let list = baseList;
        if (onlineOnly) list = list.filter(u => getOnlineState(u.last_seen_at, u.online_status) === "online");
        if (genFilter !== "all") {
            list = list.filter(u => {
                const gen = getGeneration(u.birth_year, u.birth_month, u.birth_day, AGENT_IDS.has(u.id));
                return gen?.label === genFilter;
            });
        }
        if (alphaLetter) {
            list = alphaLetter === "#"
                ? list.filter(u => !/^[A-Za-z]/.test(u.display_name))
                : list.filter(u => u.display_name.toUpperCase().startsWith(alphaLetter));
        }
        return list;
    }, [baseList, onlineOnly, genFilter, alphaLetter]);

    const recentUsers = useMemo(() => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return allUsers.filter(u => new Date(u.created_at).getTime() > cutoff);
    }, [allUsers]);

    const suggestedUsers = useMemo(() => {
        if (hasSearched) return [];
        return allUsers
            .filter(u => friendStatuses[u.id] === "none" || !friendStatuses[u.id])
            .sort((a, b) => (mutualCounts[b.id] ?? 0) - (mutualCounts[a.id] ?? 0))
            .slice(0, 6);
    }, [allUsers, friendStatuses, mutualCounts, hasSearched]);

    const alphaCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allUsers.forEach(u => {
            const first = u.display_name[0]?.toUpperCase();
            if (first && /[A-Z]/.test(first)) counts[first] = (counts[first] ?? 0) + 1;
            else counts["#"] = (counts["#"] ?? 0) + 1;
        });
        return counts;
    }, [allUsers]);

    const onlineCount = useMemo(() => allUsers.filter(u => getOnlineState(u.last_seen_at, u.online_status) === "online").length, [allUsers]);
    const isLoading = hasSearched ? searching : discoverLoading;

    // ── Loading screen ─────────────────────────────────────────────
    if (loading) return (
        <div style={{ minHeight: "100vh", background: "var(--color-page-bg, #070C1E)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&family=VT323&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}` }} />
            <ThemeEngine config={customization} />
            <div style={{ position: "relative", width: "48px", height: "48px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${tpa(18)}` }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: TP, animation: "spin 1s linear infinite" }} />
            </div>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: tpa(60), letterSpacing: "3px" }}>SCANNING NETWORK...</p>
        </div>
    );

    // ─────────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <div style={{
            minHeight: "100vh",
            background: "var(--color-page-bg, #070C1E)",
            backgroundImage: `
        radial-gradient(ellipse 70% 45% at 50% 0%, ${tpa(12)} 0%, transparent 60%),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='.65' fill='rgba(255,255,255,.04)'/%3E%3C/svg%3E")
      `,
            color: "var(--color-text, #fff)",
            fontFamily: "var(--font-body,'Nunito',sans-serif)",
            paddingBottom: "56px",
        }}>
            <div className="zee-crt" />
            <ThemeEngine config={customization} />
            <NavBar />

            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px 14px 0" }}>

                {/* ══ PORTAL TITLE BAR ══ */}
                <PortalCard accent={tpa(30)} style={{ marginBottom: "16px" }}>
                    <div style={{
                        background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)",
                        padding: "14px 18px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        flexWrap: "wrap", gap: "10px",
                        position: "relative", overflow: "hidden",
                        borderBottom: "1px solid rgba(255,255,255,.07)",
                    }}>
                        <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 4px)", pointerEvents: "none" }} />
                        <div aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "100%", background: `radial-gradient(ellipse at 100% 50%,${tca(14)} 0%,transparent 60%)`, pointerEvents: "none" }} />

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", zIndex: 1 }}>
                            <svg width="20" height="17" viewBox="0 0 70 58">
                                <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill={TP} />
                                <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill={TC} />
                                <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6" />
                                <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9" />
                            </svg>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h1 style={{ fontFamily: "var(--font-display,'Orbitron',sans-serif)", fontSize: "15px", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.3px", textShadow: `0 0 20px ${tpa(40)}` }}>
                                        NETWORK EXPLORER
                                    </h1>
                                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "2px", background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "3px", padding: "1px 6px" }}>
                                        DISCOVER
                                    </span>
                                </div>
                                <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.4)", letterSpacing: "1.5px", margin: "2px 0 0" }}>
                                    <span style={{ color: "#B4FF00" }}>{totalUsers.toLocaleString()}</span>
                                    {" "}SOULS ·{" "}
                                    <span style={{ color: "#6BCB77" }}>{onlineCount}</span>
                                    {" "}ONLINE NOW
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", zIndex: 1 }}>
                            <div style={{ textAlign: "center", background: "rgba(0,0,0,.3)", border: `1px solid ${tpa(25)}`, borderRadius: "8px", padding: "5px 12px" }}>
                                <p style={{ fontFamily: "var(--font-display,'Orbitron',sans-serif)", fontSize: "14px", fontWeight: 900, color: TP, margin: 0, lineHeight: 1 }}>{totalUsers}</p>
                                <p style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px", margin: 0 }}>USERS</p>
                            </div>
                            {onlineCount > 0 && (
                                <div style={{ textAlign: "center", background: "rgba(0,0,0,.3)", border: "1px solid rgba(107,203,119,.3)", borderRadius: "8px", padding: "5px 12px" }}>
                                    <p style={{ fontFamily: "var(--font-display,'Orbitron',sans-serif)", fontSize: "14px", fontWeight: 900, color: "#6BCB77", margin: 0, lineHeight: 1 }}>{onlineCount}</p>
                                    <p style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px", margin: 0 }}>ONLINE</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── SEARCH INPUT ── */}
                    <div style={{ padding: "12px 14px 10px", background: "rgba(0,0,0,.25)", position: "relative", borderBottom: `1px solid ${tpa(10)}` }}>
                        <Search size={13} style={{ position: "absolute", left: "26px", top: "50%", transform: "translateY(-50%)", color: tpa(50) }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => onQueryChange(e.target.value)}
                            placeholder="SEARCH BY NAME OR ZID..."
                            className="zee-search-input"
                            style={{
                                width: "100%", padding: "10px 38px 10px 34px",
                                background: tpa(7),
                                border: `1px solid ${query ? tpa(45) : tpa(22)}`,
                                borderRadius: "8px", color: "var(--color-text, #fff)",
                                fontFamily: "var(--font-mono,'VT323',monospace)", fontSize: "13px",
                                letterSpacing: "1px", outline: "none",
                                boxSizing: "border-box", transition: "border-color .2s, box-shadow .2s",
                                boxShadow: query ? `0 0 16px ${tpa(18)}` : "none",
                            }}
                        />
                        {searching && <Loader2 size={12} style={{ position: "absolute", right: "26px", top: "50%", transform: "translateY(-50%)", color: TP, animation: "spin 1s linear infinite" }} />}
                        {query && !searching && <span style={{ position: "absolute", right: "26px", top: "50%", transform: "translateY(-50%)", fontFamily: "'VT323',monospace", fontSize: "10px", color: tpa(55), letterSpacing: "1px" }}>{results.length} FOUND</span>}
                    </div>

                    {/* ── FILTER BAR ── */}
                    <div style={{ padding: "10px 14px", background: "rgba(0,0,0,.2)", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {/* Generation dropdown */}
                        <select
                            className="gen-select"
                            value={genFilter}
                            onChange={e => setGenFilter(e.target.value as GenFilter)}
                        >
                            {GEN_FILTERS.map(f => (
                                <option key={f.key} value={f.key}>
                                    {f.icon} {f.key === "all" ? "ALL GENERATIONS" : f.key.toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <div style={{ flex: 1 }} />
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                            <button
                                onClick={() => setOnlineOnly(o => !o)}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: "4px",
                                    padding: "4px 9px", borderRadius: "5px", cursor: "pointer",
                                    background: onlineOnly ? "rgba(107,203,119,.15)" : "rgba(255,255,255,.04)",
                                    border: `1px solid ${onlineOnly ? "rgba(107,203,119,.5)" : "rgba(255,255,255,.12)"}`,
                                    color: onlineOnly ? "#6BCB77" : "rgba(255,255,255,.4)",
                                    fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                                    boxShadow: onlineOnly ? "0 0 8px rgba(107,203,119,.25)" : "none",
                                    transition: "all .15s",
                                }}
                            >
                                <Wifi size={9} /> ONLINE
                            </button>
                            <button
                                onClick={() => setGridView(g => !g)}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: "4px",
                                    padding: "4px 8px", borderRadius: "5px", cursor: "pointer",
                                    background: gridView ? tpa(18) : "rgba(255,255,255,.04)",
                                    border: `1px solid ${gridView ? tpa(50) : "rgba(255,255,255,.12)"}`,
                                    color: gridView ? TP : "rgba(255,255,255,.4)",
                                    transition: "all .15s",
                                }}
                            >
                                {gridView ? <ListIcon size={10} /> : <Grid3X3 size={10} />}
                            </button>
                        </div>
                    </div>
                </PortalCard>

                {/* ══ RECENTLY JOINED ══ */}
                {!hasSearched && !discoverLoading && recentUsers.length > 0 && (
                    <RecentSpotlight users={recentUsers} />
                )}

                {/* ══ PEOPLE YOU MAY KNOW ══ */}
                {!hasSearched && !discoverLoading && suggestedUsers.length > 0 && (
                    <PeopleYouMayKnow
                        users={suggestedUsers}
                        friendStatuses={friendStatuses}
                        addingFriend={addingFriend}
                        onAdd={handleAddFriend}
                        mutualCounts={mutualCounts}
                        vibesScores={vibesScores}
                    />
                )}

                {/* ══ RESULTS PANEL ══ */}
                <PortalCard accent={tpa(20)}>
                    <ModuleHeader
                        icon={hasSearched ? <Sparkles size={11} /> : <Globe size={11} />}
                        title={hasSearched
                            ? `SEARCH RESULTS${query ? ` · "${query.toUpperCase()}"` : ""}`
                            : "ALL USERS ON THE GRID"}
                        accent={hasSearched ? "#FF007A" : TP}
                        right={
                            !isLoading
                                ? <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: tpa(55), letterSpacing: "1px" }}>
                                    {filteredList.length} ENTRIES
                                </span>
                                : undefined
                        }
                    />

                    <div style={{ padding: "12px" }}>
                        {!isLoading && !hasSearched && allUsers.length > 0 && (
                            <AlphaStrip active={alphaLetter} onChange={setAlphaLetter} counts={alphaCounts} />
                        )}

                        {isLoading && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                            </div>
                        )}

                        {!isLoading && filteredList.length === 0 && hasSearched && (
                            <EmptyTerminal label="NO USERS FOUND" hint="Try a different name or ZID" />
                        )}
                        {!isLoading && filteredList.length === 0 && !hasSearched && allUsers.length > 0 && (
                            <EmptyTerminal label="NO MATCHES" hint="Try a different filter or clear the letter index" />
                        )}
                        {!isLoading && !hasSearched && allUsers.length === 0 && (
                            <div style={{ padding: "48px 16px", textAlign: "center" }}>
                                <Users size={32} style={{ margin: "0 auto 12px", color: tpa(25), display: "block" }} />
                                <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.25)", letterSpacing: "1px" }}>NO USERS YET</p>
                            </div>
                        )}

                        {!isLoading && filteredList.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "2px 0 8px" }}>
                                <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg,${tpa(40)},transparent)` }} />
                                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 700, color: tpa(80), letterSpacing: "2px", whiteSpace: "nowrap" }}>
                                    {hasSearched ? "RESULTS" : alphaLetter ? `LETTER ${alphaLetter}` : genFilter !== "all" ? genFilter.toUpperCase() : onlineOnly ? "ONLINE NOW" : "CONNECTIONS"} ({filteredList.length})
                                </span>
                                {alphaLetter && (
                                    <button
                                        onClick={() => setAlphaLetter(null)}
                                        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", border: `1px solid ${tpa(25)}`, background: tpa(8), color: tpa(70), fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", cursor: "pointer", flexShrink: 0, transition: "all .12s" }}
                                    >
                                        <RotateCcw size={9} /> RESET
                                    </button>
                                )}
                                <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg,transparent,${tpa(40)})` }} />
                            </div>
                        )}

                        {!isLoading && filteredList.length > 0 && (
                            gridView ? (
                                <div className="grid-mob-scroll" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                                    {filteredList.map((user, i) => (
                                        <GridUserCard key={user.id} user={user} index={i} myId={myId}
                                            friendStatus={friendStatuses[user.id] ?? "loading"}
                                            addingFriend={addingFriend} onAdd={handleAddFriend}
                                            mutualCount={mutualCounts[user.id]} vibes={vibesScores[user.id]} />
                                    ))}
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {filteredList.map((user, i) => (
                                        <UserCard key={user.id} user={user} index={i} myId={myId}
                                            friendStatus={friendStatuses[user.id] ?? "loading"}
                                            addingFriend={addingFriend} onAdd={handleAddFriend}
                                            mutualCount={mutualCounts[user.id]} vibes={vibesScores[user.id]} />
                                    ))}
                                </div>
                            )
                        )}

                        {!hasSearched && !isLoading && allUsers.length < totalUsers && (
                            <div style={{ textAlign: "center", marginTop: "14px", paddingTop: "12px", borderTop: `1px solid ${tpa(12)}` }}>
                                <button
                                    onClick={loadMore}
                                    style={{
                                        padding: "8px 24px", borderRadius: "8px",
                                        background: "transparent", border: `1px solid ${tpa(35)}`,
                                        color: TP, fontFamily: "'Orbitron',sans-serif",
                                        fontSize: "9px", fontWeight: 700, letterSpacing: "1px",
                                        cursor: "pointer", transition: "all .18s",
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tpa(12); (e.currentTarget as HTMLButtonElement).style.borderColor = tpa(70); }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = tpa(35); }}
                                >
                                    LOAD MORE · {totalUsers - allUsers.length} REMAINING
                                </button>
                            </div>
                        )}
                    </div>

                    {filteredList.length > 0 && (
                        <div style={{ padding: "8px 14px", borderTop: `1px solid ${tpa(10)}`, background: "rgba(0,0,0,.15)", textAlign: "center" }}>
                            <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.13)", letterSpacing: "2px", margin: 0 }}>
                                ZEEZU NETWORK EXPLORER · {totalUsers} SOULS · {onlineCount} ONLINE · THE INTERNET AFTER DARK
                            </p>
                        </div>
                    )}
                </PortalCard>
            </div>

        </div>
    );
}
