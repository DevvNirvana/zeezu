"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import ThemeEngine, { DEFAULT_THEME, type ThemeConfig } from "@/components/ThemeEngine";
import {
    getFriends,
    getIncomingRequests,
    respondToFriendRequest,
    removeFriend,
} from "@/lib/supabase/queries";
import {
    Loader2, Users, UserPlus, UserX,
    Search, Clock, X, Check, Zap,
    MessageCircle, ChevronDown,
} from "lucide-react";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import { AGENT_IDS } from "@/lib/agents";
import { formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

const getInfluenceTier = (score: number) => {
    if (score >= 100) return { label: "LEGENDARY", color: "#FFD700" };
    if (score >= 50)  return { label: "ICON",      color: "#FF2D87" };
    if (score >= 20)  return { label: "RISING",    color: "#00F7FF" };
    return { label: "USER", color: "#888" };
};

// Hex → rgba helper (mirrors ThemeEngine's internal helper)
function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace("#", "").replace(/[^0-9a-fA-F]/g, "");
    if (clean.length < 6) return `rgba(255,45,135,${alpha})`;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Status dot: color + glow + pulse animation based on online_status field
const STATUS_DOT: Record<string, { color: string; glow: string; pulse: boolean }> = {
    online:  { color: "#6BCB77", glow: "0 0 5px #6BCB77", pulse: true  },
    busy:    { color: "#F97316", glow: "0 0 5px #F97316", pulse: true  },
    away:    { color: "#F59E0B", glow: "0 0 4px #F59E0B", pulse: false },
    offline: { color: "#6B7280", glow: "none",            pulse: false },
};
const getDot = (status?: string | null) => STATUS_DOT[status ?? "offline"] ?? STATUS_DOT.offline;

// Active statuses for "Online Now" filter
const isActiveOnline = (status?: string | null) => status === "online" || status === "busy";

const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');

    @keyframes zf-entry   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes zf-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
    @keyframes zf-online  { 0%,100%{opacity:1} 50%{opacity:.28} }
    @keyframes zf-buzz    { 0%,100%{box-shadow:0 0 4px rgba(255,45,135,.6)} 50%{box-shadow:0 0 16px rgba(255,45,135,.9),0 0 32px rgba(255,45,135,.4)} }
    @keyframes zf-twinkle { 0%,100%{opacity:.08;transform:scale(1) rotate(0)} 50%{opacity:.38;transform:scale(1.1) rotate(15deg)} }
    @keyframes zf-music   { 0%,100%{opacity:.55} 50%{opacity:1} }
    @keyframes spin        { to{transform:rotate(360deg)} }

    .zf-entry { animation: zf-entry 0.3s ease-out both; }
    .zf-star  { position:fixed;font-size:10px;color:var(--color-electric,#FF2D87);pointer-events:none;user-select:none;animation:zf-twinkle 3.5s ease-in-out infinite;z-index:0; }
`;

const SORT_LABELS = { recent: "RECENTLY ADDED", alpha: "ALPHABETICAL", mutual: "MOST MUTUAL" } as const;

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED PORTAL PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function ModuleHeader({
    icon, title, accent = "#FF2D87", right,
}: { icon: React.ReactNode; title: string; accent?: string; right?: React.ReactNode }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 14px 9px 12px",
            background: `linear-gradient(90deg, ${accent}20 0%, transparent 100%)`,
            borderBottom: `1px solid ${accent}28`,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{ width: "3px", height: "16px", background: `linear-gradient(180deg,${accent},${accent}55)`, borderRadius: "2px", flexShrink: 0 }} />
                <span style={{ color: accent, display: "flex", alignItems: "center" }}>{icon}</span>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>
                    {title}
                </span>
            </div>
            {right}
        </div>
    );
}

function PortalCard({ children, accent = "rgba(255,45,135,.2)", style }: {
    children: React.ReactNode; accent?: string; style?: React.CSSProperties;
}) {
    return (
        <div style={{
            background: "rgba(14,22,48,.88)", backdropFilter: "blur(12px)",
            border: `1px solid ${accent}`, borderRadius: "14px",
            overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.5)", ...style,
        }}>
            {children}
        </div>
    );
}

function SectionHeader({ label, count, accent = "#FF2D87" }: { label: string; count?: number; accent?: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0 6px" }}>
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg,${accent}40,transparent)` }} />
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 700, color: `${accent}90`, letterSpacing: "2px", whiteSpace: "nowrap" }}>
                {label}{count !== undefined ? ` (${count})` : ""}
            </span>
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg,transparent,${accent}40)` }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PENDING REQUEST CARD
// ─────────────────────────────────────────────────────────────────────────────

function PendingCard({ req, respondingId, onAccept, onDecline }: {
    req: any; respondingId: number | null;
    onAccept: (id: number) => void; onDecline: (id: number) => void;
}) {
    const isLoading = respondingId === req.id;
    const isAgent = AGENT_IDS.has(req.sender?.id ?? "") || !!req.sender?.agent_state;
    const gen = getGeneration(req.sender?.birth_year, req.sender?.birth_month, req.sender?.birth_day, isAgent);

    return (
        <div className="zf-entry" style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 13px",
            background: "rgba(255,0,122,.04)",
            border: "1px solid rgba(255,0,122,.25)", borderLeft: "3px solid #FF007A",
            borderRadius: "10px", transition: "border-color .18s",
        }}>
            <Link href={`/u/${req.sender?.zid}`} style={{ flexShrink: 0, textDecoration: "none" }}>
                <div style={{ position: "relative" }}>
                    <img
                        src={getAvatar(req.sender?.zid ?? "", req.sender?.avatar_url)}
                        alt={req.sender?.display_name}
                        style={{ width: "44px", height: "44px", borderRadius: "10px", border: "1.5px solid rgba(255,0,122,.4)", display: "block" }}
                    />
                    <span style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "10px", height: "10px", borderRadius: "50%", background: "#FFD700", border: "2px solid #080E24", display: "block", boxShadow: "0 0 5px #FFD700" }} />
                </div>
            </Link>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                    <Link href={`/u/${req.sender?.zid}`} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, color: "#fff", textDecoration: "none", letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {req.sender?.display_name}
                    </Link>
                    {gen && <GenBadge gen={gen} size="sm" />}
                </div>
                <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: "0.5px", margin: "1px 0 0", display: "flex", alignItems: "center", gap: "3px" }}>
                    <Clock size={9} /> {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                </p>
            </div>

            <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                <button
                    onClick={() => onAccept(req.id)}
                    disabled={isLoading}
                    style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        padding: "6px 12px", borderRadius: "7px", border: "none",
                        background: "linear-gradient(135deg,#B4FF00,#6BCB77)",
                        color: "#000", fontFamily: "'Orbitron',sans-serif",
                        fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 0 10px rgba(180,255,0,.35)",
                        opacity: isLoading ? .6 : 1, transition: "all .18s",
                    }}
                >
                    {isLoading ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={10} />}
                    Accept
                </button>
                <button
                    onClick={() => onDecline(req.id)}
                    disabled={isLoading}
                    style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        padding: "6px 10px", borderRadius: "7px",
                        background: "transparent", border: "1px solid rgba(255,80,80,.3)",
                        color: "#FF6B6B", fontFamily: "'Orbitron',sans-serif",
                        fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? .5 : 1, transition: "all .18s",
                    }}
                >
                    <X size={10} />
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FRIEND GRID CARD
// ─────────────────────────────────────────────────────────────────────────────

function FriendGridCard({ friend, removingId, buzzingId, mutualCount, primary, onRemove, onBuzz }: {
    friend: any; removingId: number | null; buzzingId: string | null;
    mutualCount: number; primary: string; onRemove: (id: number) => void; onBuzz: (id: string) => void;
}) {
    const [hovered, setHovered] = useState(false);
    const isAgent = AGENT_IDS.has(friend.id ?? "") || !!friend.agent_state;
    const gen = getGeneration(friend.birth_year, friend.birth_month, friend.birth_day, isAgent);
    const isRemoving = removingId === friend.requestId;
    const isBuzzing = buzzingId === friend.id;
    const tier = getInfluenceTier(friend.influence_score ?? 0);
    const friendYear = friend.friendSince ? new Date(friend.friendSince).getFullYear() : null;
    const dot = getDot(friend.online_status);
    const isListening = !!friend.theme_track_url;
    const pr = (a: number) => hexToRgba(primary, a);

    return (
        <div
            className="zf-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "relative",
                background: hovered ? pr(0.1) : "rgba(14,22,48,.75)",
                border: `1px solid ${hovered ? pr(0.5) : "rgba(255,255,255,.07)"}`,
                borderRadius: "12px", overflow: "hidden",
                transition: "all .18s", cursor: "pointer",
                boxShadow: hovered ? `0 0 18px ${pr(0.2)}` : "none",
            }}
        >
            {/* Status dot — always visible, color based on online_status */}
            <span style={{
                position: "absolute", top: "8px", right: "8px",
                width: "8px", height: "8px", borderRadius: "50%",
                background: dot.color, boxShadow: dot.glow,
                border: "1.5px solid #080E24",
                animation: dot.pulse ? "zf-online 2.2s ease-in-out infinite" : "none",
            }} />

            {/* ♫ Listening indicator */}
            {isListening && (
                <span style={{
                    position: "absolute", top: "8px", left: "8px",
                    fontFamily: "'VT323',monospace", fontSize: "10px",
                    color: "#B4FF00", letterSpacing: "1px",
                    animation: "zf-music 1.5s ease-in-out infinite",
                }}>♫</span>
            )}

            <Link href={`/u/${friend.zid}`} style={{ display: "block", textDecoration: "none" }}>
                <div style={{ padding: "16px 16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "72px", height: "72px", borderRadius: "12px", overflow: "hidden",
                        border: `2px solid ${hovered ? pr(0.6) : "rgba(255,255,255,.1)"}`,
                        boxShadow: hovered ? `0 0 16px ${pr(0.35)}` : "0 4px 12px rgba(0,0,0,.4)",
                        transition: "all .18s", flexShrink: 0,
                    }}>
                        <img src={getAvatar(friend.zid, friend.avatar_url)} alt={friend.display_name} style={{ width: "100%", height: "100%", display: "block" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{
                            fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700,
                            color: hovered ? "#fff" : "rgba(255,255,255,.85)",
                            letterSpacing: "-0.3px", margin: 0,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            maxWidth: "100px", transition: "color .18s",
                        }}>{friend.display_name}</p>
                        <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.28)", letterSpacing: "1px", margin: "1px 0 0" }}>{friend.zid}</p>
                    </div>
                    {gen && <GenBadge gen={gen} size="sm" />}
                </div>
            </Link>

            {/* Action row */}
            <div style={{
                display: "flex", gap: "4px", padding: "6px 10px",
                borderTop: `1px solid ${hovered ? pr(0.2) : "rgba(255,255,255,.05)"}`,
                background: hovered ? pr(0.06) : "transparent",
                transition: "all .18s",
            }}>
                {/* Buzz */}
                <button
                    onClick={() => onBuzz(friend.id)}
                    disabled={isBuzzing}
                    style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
                        padding: "9px 0", borderRadius: "6px",
                        cursor: isBuzzing ? "not-allowed" : "pointer",
                        background: isBuzzing ? pr(0.15) : "transparent",
                        border: `1px solid ${isBuzzing ? pr(0.5) : "rgba(255,255,255,.08)"}`,
                        color: isBuzzing ? primary : "rgba(255,255,255,.5)",
                        fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                        transition: "all .18s",
                    }}
                    onMouseEnter={e => { if (!isBuzzing) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = pr(0.5); b.style.color = primary; b.style.boxShadow = `0 0 8px ${pr(0.3)}`; } }}
                    onMouseLeave={e => { if (!isBuzzing) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "rgba(255,255,255,.08)"; b.style.color = "rgba(255,255,255,.5)"; b.style.boxShadow = "none"; } }}
                >
                    {isBuzzing ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={9} />} BUZZ
                </button>

                {/* MSG */}
                <Link
                    href={`/messages/${friend.id}`}
                    style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
                        padding: "9px 0", borderRadius: "6px",
                        background: "transparent", border: "1px solid rgba(255,255,255,.08)",
                        color: "rgba(255,255,255,.5)", textDecoration: "none",
                        fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                        transition: "all .18s",
                    }}
                    onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = pr(0.4); a.style.color = primary; }}
                    onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "rgba(255,255,255,.08)"; a.style.color = "rgba(255,255,255,.5)"; }}
                >
                    <MessageCircle size={9} /> MSG
                </Link>

                {/* Remove */}
                <button
                    onClick={() => onRemove(friend.requestId)}
                    disabled={isRemoving}
                    style={{
                        width: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "9px 0", borderRadius: "6px", cursor: "pointer",
                        background: "transparent", border: "1px solid rgba(255,255,255,.08)",
                        color: "rgba(255,80,80,.4)", transition: "all .18s", flexShrink: 0,
                    }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "rgba(255,80,80,.4)"; b.style.color = "#FF6B6B"; }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "rgba(255,255,255,.08)"; b.style.color = "rgba(255,80,80,.4)"; }}
                >
                    {isRemoving ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : <UserX size={9} />}
                </button>
            </div>

            {/* Sentimental bottom row */}
            <div style={{ padding: "3px 10px 7px", display: "flex", justifyContent: "center", gap: "4px", flexWrap: "wrap" }}>
                {friendYear && (
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.22)", letterSpacing: "0.5px" }}>
                        since {friendYear}
                    </span>
                )}
                {friendYear && mutualCount > 0 && <span style={{ color: "rgba(255,255,255,.15)", fontSize: "9px" }}>·</span>}
                {mutualCount > 0 && (
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: pr(0.55), letterSpacing: "0.5px" }}>
                        {mutualCount} mutual
                    </span>
                )}
                {(friendYear || mutualCount > 0) && <span style={{ color: "rgba(255,255,255,.15)", fontSize: "9px" }}>·</span>}
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: tier.color, opacity: .7, letterSpacing: "0.5px" }}>
                    {tier.label}
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FRIEND LIST ROW
// ─────────────────────────────────────────────────────────────────────────────

function FriendListRow({ friend, removingId, buzzingId, mutualCount, primary, onRemove, onBuzz }: {
    friend: any; removingId: number | null; buzzingId: string | null;
    mutualCount: number; primary: string; onRemove: (id: number) => void; onBuzz: (id: string) => void;
}) {
    const [hovered, setHovered] = useState(false);
    const isAgent = AGENT_IDS.has(friend.id ?? "") || !!friend.agent_state;
    const gen = getGeneration(friend.birth_year, friend.birth_month, friend.birth_day, isAgent);
    const isRemoving = removingId === friend.requestId;
    const isBuzzing = buzzingId === friend.id;
    const tier = getInfluenceTier(friend.influence_score ?? 0);
    const friendYear = friend.friendSince ? new Date(friend.friendSince).getFullYear() : null;
    const dot = getDot(friend.online_status);
    const isListening = !!friend.theme_track_url;
    const pr = (a: number) => hexToRgba(primary, a);

    return (
        <div
            className="zf-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px",
                background: hovered ? pr(0.06) : "rgba(0,0,0,.2)",
                border: `1px solid ${hovered ? pr(0.35) : "rgba(255,255,255,.06)"}`,
                borderRadius: "10px", transition: "all .18s",
            }}
        >
            {/* Avatar + online dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                    src={getAvatar(friend.zid, friend.avatar_url)}
                    alt={friend.display_name}
                    style={{ width: "40px", height: "40px", borderRadius: "9px", border: `1.5px solid ${hovered ? pr(0.5) : "rgba(255,255,255,.1)"}`, display: "block", transition: "border-color .18s" }}
                />
                <span style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "9px", height: "9px", borderRadius: "50%", background: dot.color, boxShadow: dot.glow, border: "1.5px solid #080E24", animation: dot.pulse ? "zf-online 2.2s ease-in-out infinite" : "none" }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Link href={`/u/${friend.zid}`} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, color: hovered ? "#fff" : "rgba(255,255,255,.8)", textDecoration: "none", letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color .18s" }}>
                        {friend.display_name}
                    </Link>
                    {gen && <GenBadge gen={gen} size="sm" />}
                    {isListening && (
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#B4FF00", flexShrink: 0, animation: "zf-music 1.5s ease-in-out infinite" }}>♫</span>
                    )}
                </div>
                {/* Sentimental row */}
                <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.22)", letterSpacing: "0.5px", margin: "2px 0 0", display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
                    {friendYear && <span>since {friendYear}</span>}
                    {friendYear && mutualCount > 0 && <span style={{ opacity: .4 }}>·</span>}
                    {mutualCount > 0 && <span style={{ color: pr(0.55) }}>{mutualCount} mutual</span>}
                    {(friendYear || mutualCount > 0) && <span style={{ opacity: .4 }}>·</span>}
                    <span style={{ color: tier.color, opacity: .7 }}>{tier.label}</span>
                </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                <button
                    onClick={() => onBuzz(friend.id)}
                    disabled={isBuzzing}
                    style={{ display: "flex", alignItems: "center", gap: "3px", padding: "9px 9px", borderRadius: "7px", background: "transparent", border: "1px solid rgba(255,255,255,.09)", color: "rgba(255,255,255,.45)", cursor: "pointer", fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", transition: "all .18s" }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = pr(0.5); b.style.color = primary; b.style.boxShadow = `0 0 8px ${pr(0.3)}`; }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "rgba(255,255,255,.09)"; b.style.color = "rgba(255,255,255,.45)"; b.style.boxShadow = "none"; }}
                >
                    {isBuzzing ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={9} />} BUZZ
                </button>
                <Link
                    href={`/messages/${friend.id}`}
                    style={{ display: "flex", alignItems: "center", gap: "3px", padding: "9px 9px", borderRadius: "7px", background: "transparent", border: "1px solid rgba(255,255,255,.09)", color: "rgba(255,255,255,.45)", textDecoration: "none", fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", transition: "all .18s" }}
                    onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = pr(0.4); a.style.color = primary; }}
                    onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "rgba(255,255,255,.09)"; a.style.color = "rgba(255,255,255,.45)"; }}
                >
                    <MessageCircle size={9} /> MSG
                </Link>
                <button
                    onClick={() => onRemove(friend.requestId)}
                    disabled={isRemoving}
                    style={{ display: "flex", alignItems: "center", gap: "3px", padding: "9px 8px", borderRadius: "7px", background: "transparent", border: "1px solid rgba(255,255,255,.09)", color: "rgba(255,80,80,.45)", cursor: "pointer", fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", transition: "all .18s" }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "rgba(255,80,80,.4)"; b.style.color = "#FF6B6B"; }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "rgba(255,255,255,.09)"; b.style.color = "rgba(255,80,80,.45)"; }}
                >
                    {isRemoving ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : <UserX size={9} />} REMOVE
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function FriendsPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState<any[]>([]);
    const [incoming, setIncoming] = useState<any[]>([]);
    const [searchQuery, setSearch] = useState("");
    const [respondingId, setRespondingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [buzzingId, setBuzzingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<"recent" | "alpha" | "mutual">("recent");
    const [onlineOnly, setOnlineOnly] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [sortDropdownPos, setSortDropdownPos] = useState({ top: 0, right: 0 });
    const sortBtnRef = useRef<HTMLButtonElement>(null);
    const [mutualCounts, setMutualCounts] = useState<Record<string, number>>({});
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [customization, setCustomization] = useState<ThemeConfig>(DEFAULT_THEME);

    // Derived theme helpers
    const primary = customization.primary_color ?? "#FF2D87";
    const pr = (a: number) => hexToRgba(primary, a);

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }

            const [friendsList, requestsList, { data: customData }] = await Promise.all([
                getFriends(user.id),
                getIncomingRequests(),
                supabase.from("profile_customization").select("*").eq("user_id", user.id).single(),
            ]);

            setFriends(friendsList);
            setIncoming(requestsList);
            if (customData) setCustomization(customData as ThemeConfig);
            setLoading(false);

            // Batch load network data for mutual counts + People You May Know
            if (friendsList.length > 0) {
                const friendIds: string[] = friendsList.map((f: any) => f.id);
                const orFilter = friendIds.map(id => `sender_id.eq.${id},receiver_id.eq.${id}`).join(",");

                const { data: networkRows } = await supabase
                    .from("friend_requests")
                    .select("sender_id, receiver_id")
                    .eq("status", "accepted")
                    .or(orFilter);

                if (networkRows) {
                    const userFriendSet = new Set<string>([...friendIds, user.id]);
                    const counts: Record<string, number> = {};
                    const foFCounter: Record<string, number> = {};

                    for (const fId of friendIds) {
                        const conns = networkRows.filter((r: any) => r.sender_id === fId || r.receiver_id === fId);
                        const fFriendIds = conns.map((r: any) => r.sender_id === fId ? r.receiver_id : r.sender_id);

                        // Mutual count: how many of this friend's friends are also my friends
                        counts[fId] = fFriendIds.filter((id: string) =>
                            id !== user.id && id !== fId && new Set(friendIds).has(id)
                        ).length;

                        // Accumulate friends-of-friends for PYMK
                        for (const id of fFriendIds) {
                            if (!userFriendSet.has(id)) {
                                foFCounter[id] = (foFCounter[id] ?? 0) + 1;
                            }
                        }
                    }

                    setMutualCounts(counts);

                    // People You May Know: top 3 by mutual count
                    const pymkIds = Object.entries(foFCounter)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([id]) => id);

                    if (pymkIds.length > 0) {
                        const { data: pymkUsers } = await supabase
                            .from("users")
                            .select("id, display_name, zid, avatar_url, influence_score")
                            .in("id", pymkIds);
                        setSuggestedUsers(
                            (pymkUsers ?? []).map((u: any) => ({ ...u, mutualCount: foFCounter[u.id] ?? 0 }))
                        );
                    }
                }
            }
        }
        load();
    }, [router]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleRespond = async (requestId: number, accept: boolean) => {
        setRespondingId(requestId);
        await respondToFriendRequest(requestId, accept);
        setIncoming(prev => prev.filter(r => r.id !== requestId));
        if (accept) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setFriends(await getFriends(user.id));
        }
        setRespondingId(null);
    };

    const handleRemove = async (requestId: number) => {
        setRemovingId(requestId);
        await removeFriend(requestId);
        setFriends(prev => prev.filter(f => f.requestId !== requestId));
        setRemovingId(null);
    };

    const handleBuzz = async (friendId: string) => {
        setBuzzingId(friendId);
        await new Promise(r => setTimeout(r, 500));
        const friend = friends.find(f => f.id === friendId);
        if (friend?.zid) router.push(`/u/${friend.zid}`);
        setBuzzingId(null);
    };

    // ── Sort + Filter ──────────────────────────────────────────────────────────
    const processedFriends = [...friends]
        .filter(f => {
            if (onlineOnly) return isActiveOnline(f.online_status);
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "alpha") return (a.display_name ?? "").localeCompare(b.display_name ?? "");
            if (sortBy === "mutual") return (mutualCounts[b.id] ?? 0) - (mutualCounts[a.id] ?? 0);
            return new Date(b.friendSince ?? 0).getTime() - new Date(a.friendSince ?? 0).getTime();
        });

    const filteredFriends = searchQuery
        ? processedFriends.filter(f =>
            f.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.zid?.toLowerCase().includes(searchQuery.toLowerCase()))
        : processedFriends;

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#080E24", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <div style={{ position: "relative", width: "44px", height: "44px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,45,135,.18)" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#FF2D87", animation: "spin 1s linear infinite" }} />
            </div>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,45,135,.6)", letterSpacing: "3px" }}>LOADING NETWORK...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh", background: "#080E24",
            backgroundImage: `
                radial-gradient(ellipse 70% 45% at 50% 0%, ${pr(0.13)} 0%, transparent 60%),
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='.8' fill='rgba(255,255,255,.035)'/%3E%3C/svg%3E")
            `,
            fontFamily: "'Nunito',system-ui,sans-serif",
            color: "#fff", paddingBottom: "56px", position: "relative",
        }}>
            <ThemeEngine config={customization} />
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />

            {/* CRT scanlines */}
            <div aria-hidden="true" style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 999, opacity: 0.022, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.3) 2px,rgba(0,0,0,.3) 4px)" }} />

            <span className="zf-star" style={{ left: "2%", top: "18%", fontSize: "10px", animationDelay: "0s" }}>✦</span>
            <span className="zf-star" style={{ left: "97%", top: "30%", fontSize: "8px", animationDelay: "1.3s" }}>✦</span>
            <span className="zf-star" style={{ left: "50%", top: "85%", fontSize: "9px", animationDelay: ".7s" }}>✦</span>

            <NavBar />

            <div style={{ maxWidth: "860px", margin: "0 auto", padding: "20px 14px 80px" }}>

                {/* ── PORTAL TITLE BAR ── */}
                <PortalCard accent={pr(0.25)} style={{ marginBottom: "18px" }}>
                    <div style={{
                        background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)",
                        padding: "12px 18px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        position: "relative", overflow: "hidden",
                        borderBottom: "1px solid rgba(255,255,255,.07)",
                    }}>
                        <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 4px)", pointerEvents: "none" }} />

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", zIndex: 1 }}>
                            <svg width="18" height="15" viewBox="0 0 70 58" aria-hidden="true" style={{ flexShrink: 0 }}>
                                <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill={primary} />
                                <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill="#00E5FF" />
                                <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6" />
                                <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9" />
                            </svg>
                            <div>
                                <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "14px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", margin: 0, textShadow: "0 0 14px rgba(0,229,255,.3)" }}>
                                    MY FRIENDS
                                </h1>
                                <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.4)", letterSpacing: "1.5px", margin: 0 }}>
                                    ZEEZU NETWORK · {friends.length} CONNECTION{friends.length !== 1 ? "S" : ""}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", zIndex: 1 }}>
                            <div style={{ textAlign: "center", background: "rgba(0,0,0,.3)", border: `1px solid ${pr(0.25)}`, borderRadius: "8px", padding: "5px 12px" }}>
                                <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "14px", fontWeight: 900, color: primary, margin: 0, lineHeight: 1 }}>{friends.length}</p>
                                <p style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px", margin: 0 }}>FRIENDS</p>
                            </div>
                            {incoming.length > 0 && (
                                <div style={{ textAlign: "center", background: "rgba(255,0,122,.08)", border: "1px solid rgba(255,0,122,.3)", borderRadius: "8px", padding: "5px 12px", animation: "zf-buzz 2s infinite" }}>
                                    <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "14px", fontWeight: 900, color: "#FF007A", margin: 0, lineHeight: 1 }}>{incoming.length}</p>
                                    <p style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,0,122,.6)", letterSpacing: "1.5px", margin: 0 }}>PENDING</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── SEARCH + FILTERS + VIEW TOGGLE ── */}
                    <div style={{ padding: "10px 14px", display: "flex", gap: "8px", alignItems: "center", background: "rgba(0,0,0,.25)", borderBottom: `1px solid ${pr(0.1)}`, flexWrap: "wrap" }}>
                        {/* Search */}
                        <div style={{ flex: 1, position: "relative", minWidth: "140px" }}>
                            <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.25)" }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search friends..."
                                style={{
                                    width: "100%", background: "rgba(0,0,0,.4)",
                                    border: `1px solid ${pr(0.18)}`, borderRadius: "8px",
                                    padding: "7px 10px 7px 30px", color: "#fff",
                                    fontFamily: "'Nunito',sans-serif", fontSize: "12px",
                                    outline: "none", transition: "border-color .2s", boxSizing: "border-box",
                                }}
                                onFocus={e => e.target.style.borderColor = pr(0.6)}
                                onBlur={e => e.target.style.borderColor = pr(0.18)}
                            />
                        </div>

                        {/* Online Now toggle */}
                        <button
                            onClick={() => setOnlineOnly(v => !v)}
                            style={{
                                display: "flex", alignItems: "center", gap: "5px",
                                padding: "7px 11px", borderRadius: "8px",
                                background: onlineOnly ? "rgba(107,203,119,.15)" : "transparent",
                                border: `1px solid ${onlineOnly ? "rgba(107,203,119,.5)" : "rgba(255,255,255,.1)"}`,
                                color: onlineOnly ? "#6BCB77" : "rgba(255,255,255,.4)",
                                fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                                cursor: "pointer", transition: "all .18s", flexShrink: 0,
                            }}
                            title="Show only online friends"
                        >
                            <span style={{
                                width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, display: "block",
                                background: onlineOnly ? "#6BCB77" : "rgba(255,255,255,.2)",
                                boxShadow: onlineOnly ? "0 0 4px #6BCB77" : "none",
                                animation: onlineOnly ? "zf-online 2.2s ease-in-out infinite" : "none",
                            }} />
                            ONLINE
                        </button>

                        {/* Sort By dropdown — uses position:fixed to escape PortalCard overflow:hidden */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <button
                                ref={sortBtnRef}
                                onClick={() => {
                                    if (sortBtnRef.current) {
                                        const r = sortBtnRef.current.getBoundingClientRect();
                                        setSortDropdownPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
                                    }
                                    setSortOpen(v => !v);
                                }}
                                style={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    padding: "7px 11px", borderRadius: "8px",
                                    background: "transparent", border: "1px solid rgba(255,255,255,.1)",
                                    color: "rgba(255,255,255,.5)",
                                    fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                                    cursor: "pointer", transition: "all .18s",
                                }}
                            >
                                {SORT_LABELS[sortBy]}
                                <ChevronDown size={10} style={{ transition: "transform .2s", transform: sortOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                            </button>
                        </div>

                        {/* View mode toggle */}
                        <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                            {(["grid", "list"] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    style={{
                                        width: "34px", height: "32px", borderRadius: "7px",
                                        background: viewMode === mode ? pr(0.2) : "transparent",
                                        border: `1px solid ${viewMode === mode ? pr(0.5) : "rgba(255,255,255,.1)"}`,
                                        color: viewMode === mode ? primary : "rgba(255,255,255,.35)",
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all .18s",
                                    }}
                                    title={mode === "grid" ? "Grid view (Orkut)" : "List view (MySpace)"}
                                >
                                    {mode === "grid"
                                        ? <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="6" height="6" rx="1" /><rect x="8" y="0" width="6" height="6" rx="1" /><rect x="0" y="8" width="6" height="6" rx="1" /><rect x="8" y="8" width="6" height="6" rx="1" /></svg>
                                        : <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2" rx="1" /><rect x="0" y="6" width="14" height="2" rx="1" /><rect x="0" y="11" width="14" height="2" rx="1" /></svg>
                                    }
                                </button>
                            ))}
                        </div>
                    </div>
                </PortalCard>

                {/* ── PENDING REQUESTS ── */}
                {incoming.length > 0 && (
                    <PortalCard accent="rgba(255,0,122,.25)" style={{ marginBottom: "18px" }}>
                        <ModuleHeader
                            icon={<UserPlus size={11} />}
                            title="PENDING REQUESTS"
                            accent="#FF007A"
                            right={
                                <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#FF007A", background: "rgba(255,0,122,.12)", border: "1px solid rgba(255,0,122,.3)", borderRadius: "10px", padding: "1px 8px", animation: "zf-buzz 2s infinite" }}>
                                    {incoming.length} NEW
                                </span>
                            }
                        />
                        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "7px" }}>
                            {incoming.map(req => (
                                <PendingCard
                                    key={req.id}
                                    req={req}
                                    respondingId={respondingId}
                                    onAccept={id => handleRespond(id, true)}
                                    onDecline={id => handleRespond(id, false)}
                                />
                            ))}
                        </div>
                    </PortalCard>
                )}

                {/* ── FRIENDS GRID / LIST ── */}
                <PortalCard accent={pr(0.22)}>
                    <ModuleHeader
                        icon={<Users size={11} />}
                        title={searchQuery ? `RESULTS FOR "${searchQuery.toUpperCase()}"` : "ALL FRIENDS"}
                        accent={primary}
                        right={
                            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: pr(0.6), letterSpacing: "1px" }}>
                                {filteredFriends.length} / {friends.length}
                            </span>
                        }
                    />

                    <div style={{ padding: "12px" }}>
                        {filteredFriends.length === 0 ? (
                            <div style={{ padding: "40px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", border: `1px dashed ${pr(0.2)}`, borderRadius: "10px", background: pr(0.03) }}>
                                <div style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: pr(0.4), letterSpacing: "1.5px", textAlign: "center" }}>
                                    <span style={{ color: pr(0.55) }}>$ </span>ls -la ./friends/
                                    <span style={{ display: "block", marginTop: "3px", color: "rgba(255,255,255,.1)" }}>total 0</span>
                                </div>
                                <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.22)", letterSpacing: "2px", margin: 0 }}>
                                    {onlineOnly
                                        ? "NO FRIENDS ONLINE RIGHT NOW"
                                        : friends.length === 0 ? "NO CONNECTIONS YET"
                                        : `NO MATCHES FOR "${searchQuery}"`}
                                </p>
                                {friends.length === 0 && (
                                    <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.18)", margin: 0 }}>
                                        Visit someone&apos;s profile and hit &quot;Add Friend&quot;
                                    </p>
                                )}
                            </div>
                        ) : viewMode === "grid" ? (
                            <>
                                <SectionHeader label="CONNECTIONS" count={filteredFriends.length} accent={primary} />
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                                    {filteredFriends.map(friend => (
                                        <FriendGridCard
                                            key={friend.requestId}
                                            friend={friend}
                                            removingId={removingId}
                                            buzzingId={buzzingId}
                                            mutualCount={mutualCounts[friend.id] ?? 0}
                                            primary={primary}
                                            onRemove={handleRemove}
                                            onBuzz={handleBuzz}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <SectionHeader label="CONNECTIONS" count={filteredFriends.length} accent={primary} />
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {filteredFriends.map(friend => (
                                        <FriendListRow
                                            key={friend.requestId}
                                            friend={friend}
                                            removingId={removingId}
                                            buzzingId={buzzingId}
                                            mutualCount={mutualCounts[friend.id] ?? 0}
                                            primary={primary}
                                            onRemove={handleRemove}
                                            onBuzz={handleBuzz}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {filteredFriends.length > 0 && (
                        <div style={{ padding: "8px 14px", borderTop: `1px solid ${pr(0.1)}`, background: "rgba(0,0,0,.15)", textAlign: "center" }}>
                            <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.15)", letterSpacing: "2px", margin: 0 }}>
                                {friends.length} FRIENDS · {incoming.length} PENDING · ZEEZU NETWORK
                            </p>
                        </div>
                    )}
                </PortalCard>

                {/* ── PEOPLE YOU MAY KNOW ── */}
                {suggestedUsers.length > 0 && (
                    <PortalCard accent="rgba(0,229,255,.15)" style={{ marginTop: "18px" }}>
                        <ModuleHeader
                            icon={<UserPlus size={11} />}
                            title="PEOPLE YOU MAY KNOW"
                            accent="#00E5FF"
                            right={
                                <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(0,229,255,.35)", letterSpacing: "1px" }}>
                                    MUTUAL CONNECTIONS
                                </span>
                            }
                        />
                        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "7px" }}>
                            {suggestedUsers.map(u => {
                                const tier = getInfluenceTier(u.influence_score ?? 0);
                                return (
                                    <div key={u.id} className="zf-entry" style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        padding: "9px 11px",
                                        background: "rgba(0,229,255,.03)",
                                        border: "1px solid rgba(0,229,255,.12)",
                                        borderRadius: "10px",
                                    }}>
                                        <Link href={`/u/${u.zid}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                                            <img
                                                src={getAvatar(u.zid, u.avatar_url)}
                                                alt={u.display_name}
                                                style={{ width: "38px", height: "38px", borderRadius: "9px", border: "1.5px solid rgba(0,229,255,.2)", display: "block" }}
                                            />
                                        </Link>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Link href={`/u/${u.zid}`} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,.8)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {u.display_name}
                                            </Link>
                                            <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.25)", margin: "1px 0 0", display: "flex", gap: "4px", alignItems: "center" }}>
                                                <span style={{ color: "rgba(0,229,255,.55)" }}>{u.mutualCount} mutual friend{u.mutualCount !== 1 ? "s" : ""}</span>
                                                <span style={{ opacity: .4 }}>·</span>
                                                <span style={{ color: tier.color, opacity: .7 }}>{tier.label}</span>
                                            </p>
                                        </div>
                                        <Link
                                            href={`/u/${u.zid}`}
                                            style={{
                                                display: "flex", alignItems: "center", gap: "3px",
                                                padding: "5px 10px", borderRadius: "7px",
                                                background: "rgba(0,229,255,.08)", border: "1px solid rgba(0,229,255,.25)",
                                                color: "#00E5FF", textDecoration: "none",
                                                fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                                                flexShrink: 0, transition: "all .18s",
                                            }}
                                            onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.background = "rgba(0,229,255,.15)"; a.style.boxShadow = "0 0 8px rgba(0,229,255,.2)"; }}
                                            onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.background = "rgba(0,229,255,.08)"; a.style.boxShadow = "none"; }}
                                        >
                                            <UserPlus size={9} /> VIEW
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ padding: "5px 14px 8px", textAlign: "center" }}>
                            <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.1)", letterSpacing: "1.5px", margin: 0 }}>
                                ✦ BASED ON MUTUAL CONNECTIONS — NO ALGORITHM, NO DATA MINING ✦
                            </p>
                        </div>
                    </PortalCard>
                )}
            </div>

            {/* ── SORT DROPDOWN PORTAL — renders outside PortalCard to avoid overflow:hidden clipping ── */}
            {sortOpen && (
                <>
                    {/* Click-outside backdrop */}
                    <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setSortOpen(false)} />
                    <div style={{
                        position: "fixed", top: sortDropdownPos.top, right: sortDropdownPos.right,
                        background: "rgba(8,14,36,.98)", border: `1px solid ${pr(0.25)}`,
                        borderRadius: "8px", overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0,0,0,.6)", zIndex: 1000, minWidth: "160px",
                    }}>
                        {(["recent", "alpha", "mutual"] as const).map((opt, i) => (
                            <button
                                key={opt}
                                onClick={() => { setSortBy(opt); setSortOpen(false); }}
                                style={{
                                    display: "block", width: "100%", textAlign: "left",
                                    padding: "8px 12px",
                                    background: sortBy === opt ? pr(0.12) : "transparent",
                                    border: "none",
                                    borderBottom: i < 2 ? "1px solid rgba(255,255,255,.05)" : "none",
                                    color: sortBy === opt ? primary : "rgba(255,255,255,.55)",
                                    fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                                    cursor: "pointer", transition: "background .15s",
                                }}
                                onMouseEnter={e => { if (sortBy !== opt) (e.currentTarget as HTMLButtonElement).style.background = pr(0.06); }}
                                onMouseLeave={e => { if (sortBy !== opt) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                            >
                                {SORT_LABELS[opt]}
                            </button>
                        ))}
                    </div>
                </>
            )}

        </div>
    );
}
