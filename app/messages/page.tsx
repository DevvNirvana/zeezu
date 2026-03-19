"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import { getConversations, getFriends, type Conversation } from "@/lib/supabase/queries";
import { Loader2, Zap, Search, Wifi } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ThemeEngine, { type ThemeConfig } from "@/components/ThemeEngine";

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

// ─────────────────────────────────────────────────────────────
//  GLOBAL STYLES
// ─────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');

  @keyframes zi-entry   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes zi-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
  @keyframes zi-online  { 0%,100%{opacity:1} 50%{opacity:.28} }
  @keyframes zi-buzz    { 0%,100%{box-shadow:0 0 4px rgba(138,46,255,.6)} 50%{box-shadow:0 0 16px rgba(138,46,255,.9),0 0 32px rgba(138,46,255,.4)} }
  @keyframes zi-twinkle { 0%,100%{opacity:.09;transform:scale(1) rotate(0)} 50%{opacity:.38;transform:scale(1.1) rotate(15deg)} }

  .zi-entry { animation: zi-entry 0.3s ease-out forwards; opacity: 0; }
  .zi-star  { animation: zi-twinkle 3.5s ease-in-out infinite; position:fixed;pointer-events:none;user-select:none;z-index:0; }
`;

// ─────────────────────────────────────────────────────────────
//  DECRYPT HEADER — MSN/AIM scramble effect
// ─────────────────────────────────────────────────────────────

function DecryptHeader({ text }: { text: string }) {
    const [display, setDisplay] = useState(text);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&*0123456789";
    useEffect(() => {
        let frame = 0;
        const maxFrames = text.length * 3;
        const iv = setInterval(() => {
            frame++;
            const revealed = Math.floor((frame / maxFrames) * text.length);
            setDisplay(
                text.split("").map((ch, i) =>
                    ch === " " ? " " : i < revealed ? ch : chars[Math.floor(Math.random() * chars.length)]
                ).join("")
            );
            if (frame >= maxFrames) clearInterval(iv);
        }, 35);
        return () => clearInterval(iv);
    }, [text]);
    return <span>{display}</span>;
}

// ─────────────────────────────────────────────────────────────
//  STATUS DOT — Yahoo/MSN/Skype style
// ─────────────────────────────────────────────────────────────

function StatusDot({ online_status }: { online_status?: string }) {
    let color: string;
    let animate = true;
    if (online_status === "online") {
        color = "#6BCB77";
    } else if (online_status === "busy") {
        color = "#FF007A";
    } else if (online_status === "away") {
        color = "#FFD93D";
    } else {
        color = "rgba(255,255,255,.18)";
        animate = false;
    }
    return (
        <span
            style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: color,
                boxShadow: animate ? `0 0 5px ${color}` : "none",
                display: "inline-block",
                flexShrink: 0,
                animation: animate ? "zi-online 2.2s ease-in-out infinite" : "none",
            }}
        />
    );
}

// ─────────────────────────────────────────────────────────────
//  SECTION HEADER — AIM "RECENT CHATS" style divider
// ─────────────────────────────────────────────────────────────

function SectionHeader({ label, count, primary }: { label: string; count?: number; primary: string }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 0 4px",
                marginBottom: "2px",
            }}
        >
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg,${primary}59,transparent)` }} />
            <span
                style={{
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: "8px",
                    fontWeight: 700,
                    color: `${primary}B3`,
                    letterSpacing: "2px",
                    whiteSpace: "nowrap",
                }}
            >
                {label}{count !== undefined ? ` (${count})` : ""}
            </span>
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg,transparent,${primary}59)` }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  CONVERSATION ROW — BBM / Yahoo style
// ─────────────────────────────────────────────────────────────

function convDotColor(status?: string) {
    if (status === "online") return "#6BCB77";
    if (status === "busy") return "#FF007A";
    if (status === "away") return "#FFD93D";
    return "rgba(255,255,255,.18)";
}

function ConvRow({
    conv,
    idx,
    primary,
    online_status,
}: {
    conv: Conversation;
    idx: number;
    primary: string;
    online_status?: string;
}) {
    const hasUnread = conv.unreadCount > 0;
    const dotColor = convDotColor(online_status);
    const dotGlows = online_status && online_status !== "offline" && online_status !== undefined;

    return (
        <Link
            href={`/messages/${conv.partnerId}`}
            className="zi-entry"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                border: `1px solid ${hasUnread ? `${primary}66` : "rgba(255,255,255,.05)"}`,
                background: hasUnread
                    ? `linear-gradient(90deg,${primary}14,rgba(0,0,0,0))`
                    : "rgba(0,0,0,.2)",
                textDecoration: "none",
                transition: "border-color .18s, background .18s",
                animationDelay: `${idx * 0.04}s`,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Unread sheen on left edge */}
            {hasUnread && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "3px",
                        background: `linear-gradient(180deg,${primary},#00F7FF)`,
                        borderRadius: "10px 0 0 10px",
                    }}
                />
            )}

            {/* Avatar + status dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                    src={getAvatar(conv.partnerZid, conv.partnerAvatar)}
                    alt={conv.partnerName}
                    style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        border: `1.5px solid ${hasUnread ? `${primary}99` : "rgba(255,255,255,.1)"}`,
                        display: "block",
                    }}
                />
                {/* Status dot — bottom-right like BBM */}
                <span
                    style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: dotColor,
                        boxShadow: dotGlows ? `0 0 5px ${dotColor}` : "none",
                        border: "2px solid #080E24",
                        display: "block",
                    }}
                />
                {/* Unread badge */}
                {hasUnread && (
                    <span
                        style={{
                            position: "absolute",
                            top: "-4px",
                            right: "-4px",
                            minWidth: "16px",
                            height: "16px",
                            padding: "0 3px",
                            borderRadius: "8px",
                            background: primary,
                            color: "#fff",
                            fontFamily: "'VT323',monospace",
                            fontSize: "10px",
                            lineHeight: "16px",
                            textAlign: "center",
                            letterSpacing: "0.3px",
                            animation: "zi-buzz 2s ease-out infinite",
                        }}
                    >
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                        <StatusDot online_status={online_status} />
                        <span
                            style={{
                                fontFamily: "'Orbitron',sans-serif",
                                fontSize: "11px",
                                fontWeight: 700,
                                color: hasUnread ? "#fff" : "rgba(255,255,255,.7)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                letterSpacing: "-0.3px",
                            }}
                        >
                            {conv.partnerName}
                        </span>
                    </div>
                    <span
                        style={{
                            fontFamily: "'VT323',monospace",
                            fontSize: "10px",
                            color: "rgba(255,255,255,.25)",
                            letterSpacing: "0.3px",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                        }}
                    >
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                    </span>
                </div>

                {/* Last message row — Yahoo style status-message snippet */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {conv.lastMessageIsBuzz && (
                        <Zap
                            size={10}
                            style={{ color: primary, fill: primary, flexShrink: 0, filter: `drop-shadow(0 0 4px ${primary})` }}
                        />
                    )}
                    <p
                        style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: "11px",
                            color: hasUnread ? "rgba(255,255,255,.65)" : "rgba(255,255,255,.32)",
                            fontWeight: hasUnread ? 700 : 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            margin: 0,
                        }}
                    >
                        {conv.lastMessageIsFromMe
                            ? <span style={{ color: `${primary}B3`, fontWeight: 700 }}>You: </span>
                            : null}
                        {conv.lastMessage}
                    </p>
                </div>
            </div>
        </Link>
    );
}

// ─────────────────────────────────────────────────────────────
//  FRIEND SUGGESTION ROW — for search results with no conversation
// ─────────────────────────────────────────────────────────────

function FriendSugRow({ friend, idx, primary }: { friend: any; idx: number; primary: string }) {
    const avatar = friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.zid}`;
    const dotColor =
        friend.online_status === "online" ? "#6BCB77"
        : friend.online_status === "busy"  ? "#FF007A"
        : friend.online_status === "away"  ? "#FFD93D"
        : "rgba(255,255,255,.18)";

    return (
        <Link
            href={`/messages/${friend.id}`}
            className="zi-entry"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,.05)",
                background: "rgba(0,0,0,.15)",
                textDecoration: "none",
                animationDelay: `${idx * 0.04}s`,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                    src={avatar}
                    alt={friend.display_name}
                    style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        border: "1.5px solid rgba(255,255,255,.1)",
                        display: "block",
                    }}
                />
                <span
                    style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: dotColor,
                        border: "2px solid #080E24",
                        display: "block",
                    }}
                />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <span
                    style={{
                        fontFamily: "'Orbitron',sans-serif",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "rgba(255,255,255,.7)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        letterSpacing: "-0.3px",
                        display: "block",
                    }}
                >
                    {friend.display_name}
                </span>
                <span
                    style={{
                        fontFamily: "'VT323',monospace",
                        fontSize: "10px",
                        color: "rgba(255,255,255,.25)",
                        letterSpacing: "0.5px",
                    }}
                >
                    @{friend.zid}
                </span>
            </div>

            <span
                style={{
                    fontFamily: "'VT323',monospace",
                    fontSize: "9px",
                    color: `${primary}B3`,
                    letterSpacing: "1px",
                    border: `1px solid ${primary}40`,
                    borderRadius: "6px",
                    padding: "2px 6px",
                    flexShrink: 0,
                }}
            >
                MESSAGE
            </span>
        </Link>
    );
}

// ─────────────────────────────────────────────────────────────
//  TOOLBAR ICON — BBM-style bottom action strip
// ─────────────────────────────────────────────────────────────

function ToolbarBtn({
    icon,
    label,
    active = false,
    badge = 0,
    onClick,
    primary,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: number;
    onClick?: () => void;
    primary: string;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "6px 8px",
                borderRadius: "8px",
                background: active ? `${primary}26` : "transparent",
                border: active ? `1px solid ${primary}59` : "1px solid transparent",
                cursor: onClick ? "pointer" : "default",
                position: "relative",
                minWidth: "48px",
                transition: "all .18s",
            }}
        >
            <span style={{ color: active ? primary : "rgba(255,255,255,.5)", fontSize: "18px" }}>{icon}</span>
            <span
                style={{
                    fontFamily: "'VT323',monospace",
                    fontSize: "9px",
                    color: active ? primary : "rgba(255,255,255,.3)",
                    letterSpacing: "1px",
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </span>
            {badge > 0 && (
                <span
                    style={{
                        position: "absolute",
                        top: "2px",
                        right: "4px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: primary,
                        fontFamily: "'VT323',monospace",
                        fontSize: "10px",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {badge > 9 ? "9+" : badge}
                </span>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function MessagesInbox() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [conversations, setConvs] = useState<Conversation[]>([]);
    const [searchQuery, setSearch] = useState("");
    const [custom, setCustom] = useState<ThemeConfig | null>(null);
    const [partnerStatuses, setPartnerStatuses] = useState<Map<string, string>>(new Map());
    const [allFriends, setAllFriends] = useState<any[]>([]);

    const primary = custom?.primary_color ?? "#8A2EFF";
    const secondary = custom?.secondary_color ?? "#00F7FF";
    const pageBg = custom?.page_bg ?? "#0B0B12";

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }

            const [data, friends] = await Promise.all([
                getConversations(),
                getFriends(user.id),
            ]);
            setConvs(data);
            setAllFriends(friends);

            // Fetch online statuses for all partners
            const ids = data.map((c: Conversation) => c.partnerId);
            if (ids.length > 0) {
                const { data: onlineData } = await supabase
                    .from("users").select("id, online_status").in("id", ids);
                const map = new Map<string, string>();
                onlineData?.forEach((u: any) => map.set(u.id, u.online_status ?? "offline"));
                setPartnerStatuses(map);
            }

            // Load theme
            const { data: custData } = await supabase
                .from("profile_customization").select("*").eq("user_id", user.id).single();
            if (custData) setCustom(custData as ThemeConfig);

            setLoading(false);
        }
        load();
    }, [router]);

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            channel = supabase.channel("inbox_realtime")
                .on("postgres_changes", {
                    event: "INSERT", schema: "public",
                    table: "messages", filter: `receiver_id=eq.${user.id}`,
                }, async () => setConvs(await getConversations()))
                .subscribe();
        });
        return () => { if (channel) supabase.removeChannel(channel); };
    }, []);

    const filtered = searchQuery
        ? conversations.filter(c =>
            c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.partnerZid.toLowerCase().includes(searchQuery.toLowerCase()))
        : conversations;

    const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
    const recent = filtered.filter(c => c.unreadCount > 0);
    const rest = filtered.filter(c => c.unreadCount === 0);

    // Friends not yet in conversations, matching the current search query
    const existingIds = new Set(conversations.map(c => c.partnerId));
    const friendSuggestions = searchQuery
        ? allFriends.filter(f =>
            !existingIds.has(f.id) && (
                f.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.zid?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : [];

    if (loading) return (
        <div
            style={{
                minHeight: "100vh",
                background: "#0B0B12",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                fontFamily: "'VT323',monospace",
            }}
        >
            <Loader2 size={28} style={{ color: "#8A2EFF", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "13px", color: "rgba(138,46,255,.6)", letterSpacing: "3px" }}>
                DECRYPTING INBOX...
            </span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <div
            style={{
                minHeight: "100vh",
                background: pageBg,
                backgroundImage: `
          radial-gradient(ellipse 70% 45% at 50% 0%, ${primary}21 0%, transparent 60%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='.8' fill='rgba(255,255,255,.035)'/%3E%3C/svg%3E")
        `,
                fontFamily: "'Nunito',system-ui,sans-serif",
                color: "#fff",
                paddingBottom: "56px",
                position: "relative",
            }}
        >
            <ThemeEngine config={custom} />
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />

            {/* Decorative stars */}
            <span className="zi-star" style={{ left: "2%", top: "15%", fontSize: "10px", animationDelay: "0s", color: primary }}>✦</span>
            <span className="zi-star" style={{ left: "97%", top: "22%", fontSize: "8px", animationDelay: "1.2s", color: primary }}>✦</span>

            <NavBar />

            {/* ══ MESSENGER WINDOW ══════════════════════════════════ */}
            <div
                style={{
                    maxWidth: "520px",
                    margin: "0 auto",
                    paddingTop: "72px",
                }}
            >
                <div style={{ padding: "0 12px 80px" }}>
                    {/* ── TITLE BAR — MSN/Yahoo window chrome ── */}
                    <div
                        style={{
                            background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)",
                            borderRadius: "14px 14px 0 0",
                            padding: "10px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid rgba(255,255,255,.08)",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* Scanline texture */}
                        <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 4px)", pointerEvents: "none" }} />

                        {/* Logo + title */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", zIndex: 1 }}>
                            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "14px", fontWeight: 900, color: "#fff", letterSpacing: "-1px", textShadow: `0 0 14px ${secondary}66` }}>
                                zeezu
                            </span>
                            <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: secondary, letterSpacing: "3px", opacity: .8 }}>
                                MESSENGER
                            </span>
                        </div>

                        {/* Right: unread + live */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", zIndex: 1 }}>
                            {totalUnread > 0 && (
                                <span
                                    style={{
                                        fontFamily: "'VT323',monospace",
                                        fontSize: "12px",
                                        color: primary,
                                        background: `${primary}26`,
                                        border: `1px solid ${primary}66`,
                                        borderRadius: "12px",
                                        padding: "1px 8px",
                                        letterSpacing: "0.5px",
                                        animation: "zi-buzz 2s infinite",
                                    }}
                                >
                                    {totalUnread} NEW
                                </span>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Wifi size={11} style={{ color: "#6BCB77" }} />
                                <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#6BCB77", letterSpacing: "1px" }}>LIVE</span>
                            </div>
                        </div>
                    </div>

                    {/* ── SEARCH BAR — Skype/AIM style ── */}
                    <div
                        style={{
                            background: "rgba(14,22,48,.9)",
                            border: `1px solid ${primary}2E`,
                            borderTop: "none",
                            padding: "8px 10px",
                        }}
                    >
                        <div style={{ position: "relative" }}>
                            <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.25)" }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Find someone or start a chat..."
                                style={{
                                    width: "100%",
                                    background: "rgba(0,0,0,.4)",
                                    border: `1px solid ${primary}2E`,
                                    borderRadius: "8px",
                                    padding: "7px 10px 7px 30px",
                                    color: "#fff",
                                    fontFamily: "'Nunito',sans-serif",
                                    fontSize: "12px",
                                    outline: "none",
                                    transition: "border-color .2s",
                                }}
                                onFocus={e => e.target.style.borderColor = `${primary}99`}
                                onBlur={e => e.target.style.borderColor = `${primary}2E`}
                            />
                        </div>
                    </div>

                    {/* ── CONTACT LIST — Yahoo/AIM style ── */}
                    <div
                        style={{
                            background: "rgba(14,22,48,.88)",
                            border: `1px solid ${primary}2E`,
                            borderTop: "none",
                            borderRadius: "0 0 14px 14px",
                            padding: "8px 10px 12px",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        {filtered.length === 0 && friendSuggestions.length === 0 ? (
                            <div
                                style={{
                                    padding: "40px 0",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <span style={{ fontSize: "32px" }}>💬</span>
                                <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.3)", letterSpacing: "1px" }}>
                                    {conversations.length === 0 && allFriends.length === 0
                                        ? "NO MESSAGES YET"
                                        : `NO MATCHES FOR "${searchQuery}"`}
                                </p>
                                {conversations.length === 0 && allFriends.length === 0 && (
                                    <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.2)" }}>
                                        Visit a friend&apos;s profile and hit &quot;Message&quot;
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {/* Recent / Unread section */}
                                {recent.length > 0 && (
                                    <>
                                        <SectionHeader label="UNREAD" count={recent.length} primary={primary} />
                                        {recent.map((c, i) => (
                                            <ConvRow
                                                key={c.partnerId}
                                                conv={c}
                                                idx={i}
                                                primary={primary}
                                                online_status={partnerStatuses.get(c.partnerId)}
                                            />
                                        ))}
                                    </>
                                )}

                                {/* All conversations */}
                                {rest.length > 0 && (
                                    <>
                                        <SectionHeader
                                            label={recent.length > 0 ? "ALL CHATS" : "RECENT CHATS"}
                                            count={rest.length}
                                            primary={primary}
                                        />
                                        {rest.map((c, i) => (
                                            <ConvRow
                                                key={c.partnerId}
                                                conv={c}
                                                idx={i}
                                                primary={primary}
                                                online_status={partnerStatuses.get(c.partnerId)}
                                            />
                                        ))}
                                    </>
                                )}

                                {/* Friends not yet messaged — only shown during search */}
                                {friendSuggestions.length > 0 && (
                                    <>
                                        <SectionHeader label="START A CHAT" count={friendSuggestions.length} primary={primary} />
                                        {friendSuggestions.map((f, i) => (
                                            <FriendSugRow key={f.id} friend={f} idx={i} primary={primary} />
                                        ))}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Footer count */}
                        <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: `1px solid ${primary}1A`, textAlign: "center" }}>
                            <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.15)", letterSpacing: "2px" }}>
                                {conversations.length} THREADS · {totalUnread} UNREAD · END-TO-END NEON
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ BOTTOM TOOLBAR — BBM style ══════════════════════ */}
            <div
                style={{
                    position: "fixed",
                    bottom: "28px",
                    left: 0,
                    right: 0,
                    zIndex: 30,
                    background: "linear-gradient(90deg,rgba(14,22,48,.97),rgba(8,14,36,.97))",
                    borderTop: `1px solid ${primary}40`,
                    backdropFilter: "blur(16px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    padding: "4px 8px",
                }}
            >
                {/* <ToolbarBtn icon="💬" label="CHATS" active badge={totalUnread} primary={primary} />
                <ToolbarBtn icon="👥" label="CONTACTS" onClick={() => router.push("/friends")} primary={primary} />
                <ToolbarBtn icon="⚡" label="BUZZ" onClick={() => router.push("/zeewall")} primary={primary} />
                <ToolbarBtn icon="⚙️" label="OPTIONS" onClick={() => { }} primary={primary} /> */}
            </div>

            {/* Marquee ticker */}
            <div
                aria-hidden="true"
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "28px",
                    background: "linear-gradient(90deg,#3B0DA8 0%,#0B4B8F 50%,#3B0DA8 100%)",
                    borderTop: `1px solid ${primary}66`,
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    zIndex: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        whiteSpace: "nowrap",
                        animation: "zi-marquee 36s linear infinite",
                        fontFamily: "'VT323',monospace",
                        fontSize: "13px",
                        color: "rgba(255,255,255,.45)",
                        letterSpacing: "1.5px",
                    }}
                >
                    {"✦ ZEEZU MESSENGER · NO ALGORITHM · NO FEED MANIPULATION · JUST PEOPLE · PRIVATE MESSAGES · END-TO-END NEON · ".repeat(4)}
                </div>
            </div>
        </div>
    );
}
