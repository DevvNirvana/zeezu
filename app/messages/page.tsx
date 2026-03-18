"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import { getConversations, type Conversation } from "@/lib/supabase/queries";
import { Loader2, Zap, Search, Wifi } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

// ─────────────────────────────────────────────────────────────
//  GLOBAL STYLES — injected once
// ─────────────────────────────────────────────────────────────

const STYLE_ID = "zee-inbox-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');

    @keyframes zi-entry   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
    @keyframes zi-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
    @keyframes zi-online  { 0%,100%{opacity:1} 50%{opacity:.28} }
    @keyframes zi-buzz    { 0%,100%{box-shadow:0 0 4px rgba(138,46,255,.6)} 50%{box-shadow:0 0 16px rgba(138,46,255,.9),0 0 32px rgba(138,46,255,.4)} }
    @keyframes zi-unread  { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes zi-typing  { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-3px);opacity:1} }
    @keyframes zi-decrypt { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes zi-twinkle { 0%,100%{opacity:.09;transform:scale(1) rotate(0)} 50%{opacity:.38;transform:scale(1.1) rotate(15deg)} }

    .zi-entry { animation: zi-entry 0.3s ease-out forwards; opacity: 0; }
    .zi-star  { animation: zi-twinkle 3.5s ease-in-out infinite; position:fixed;pointer-events:none;user-select:none;color:#8A2EFF;z-index:0; }
  `;
    document.head.appendChild(s);
}

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

function StatusDot({ online = true }: { online?: boolean }) {
    return (
        <span
            style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: online ? "#6BCB77" : "rgba(255,255,255,0.18)",
                boxShadow: online ? "0 0 5px #6BCB77" : "none",
                display: "inline-block",
                flexShrink: 0,
                animation: online ? "zi-online 2.2s ease-in-out infinite" : "none",
            }}
        />
    );
}

// ─────────────────────────────────────────────────────────────
//  SECTION HEADER — AIM "RECENT CHATS" style divider
// ─────────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count?: number }) {
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
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg,rgba(138,46,255,.35),transparent)" }} />
            <span
                style={{
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: "8px",
                    fontWeight: 700,
                    color: "rgba(138,46,255,.7)",
                    letterSpacing: "2px",
                    whiteSpace: "nowrap",
                }}
            >
                {label}{count !== undefined ? ` (${count})` : ""}
            </span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg,transparent,rgba(138,46,255,.35))" }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  CONVERSATION ROW — BBM / Yahoo style
// ─────────────────────────────────────────────────────────────

function ConvRow({ conv, idx }: { conv: Conversation; idx: number }) {
    const hasUnread = conv.unreadCount > 0;

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
                border: `1px solid ${hasUnread ? "rgba(138,46,255,.4)" : "rgba(255,255,255,.05)"}`,
                background: hasUnread
                    ? "linear-gradient(90deg,rgba(138,46,255,.08),rgba(0,0,0,0))"
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
                        background: "linear-gradient(180deg,#8A2EFF,#00E5FF)",
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
                        border: `1.5px solid ${hasUnread ? "rgba(138,46,255,.6)" : "rgba(255,255,255,.1)"}`,
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
                        background: "#6BCB77",
                        boxShadow: "0 0 5px #6BCB77",
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
                            background: "#8A2EFF",
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
                        <StatusDot online />
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
                            style={{ color: "#8A2EFF", fill: "#8A2EFF", flexShrink: 0, filter: "drop-shadow(0 0 4px #8A2EFF)" }}
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
                            ? <span style={{ color: "rgba(138,46,255,.7)", fontWeight: 700 }}>You: </span>
                            : null}
                        {conv.lastMessage}
                    </p>
                </div>
            </div>
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
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: number;
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "6px 8px",
                borderRadius: "8px",
                background: active ? "rgba(138,46,255,.15)" : "transparent",
                border: active ? "1px solid rgba(138,46,255,.35)" : "1px solid transparent",
                cursor: "pointer",
                position: "relative",
                minWidth: "48px",
                transition: "all .18s",
            }}
        >
            <span style={{ color: active ? "#8A2EFF" : "rgba(255,255,255,.5)", fontSize: "18px" }}>{icon}</span>
            <span
                style={{
                    fontFamily: "'VT323',monospace",
                    fontSize: "9px",
                    color: active ? "#8A2EFF" : "rgba(255,255,255,.3)",
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
                        background: "#8A2EFF",
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

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }
            setConvs(await getConversations());
            setLoading(false);
        }
        load();
    }, [router]);

    useEffect(() => {
        async function setupRealtime() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const channel = supabase
                .channel("inbox_realtime")
                .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
                    async () => setConvs(await getConversations()))
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
        setupRealtime();
    }, []);

    const filtered = searchQuery
        ? conversations.filter(c =>
            c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.partnerZid.toLowerCase().includes(searchQuery.toLowerCase()))
        : conversations;

    const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
    const recent = filtered.filter(c => c.unreadCount > 0);
    const rest = filtered.filter(c => c.unreadCount === 0);

    if (loading) return (
        <div
            style={{
                minHeight: "100vh",
                background: "#080E24",
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
                background: "#080E24",
                backgroundImage: `
          radial-gradient(ellipse 70% 45% at 50% 0%, rgba(138,46,255,.13) 0%, transparent 60%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='.8' fill='rgba(255,255,255,.035)'/%3E%3C/svg%3E")
        `,
                fontFamily: "'Nunito',system-ui,sans-serif",
                color: "#fff",
                paddingBottom: "56px",
                position: "relative",
            }}
        >
            {/* Decorative stars */}
            <span className="zi-star" style={{ left: "2%", top: "15%", fontSize: "10px", animationDelay: "0s" }}>✦</span>
            <span className="zi-star" style={{ left: "97%", top: "22%", fontSize: "8px", animationDelay: "1.2s" }}>✦</span>

            <NavBar />

            {/* ══ MESSENGER WINDOW ══════════════════════════════════ */}
            <div
                style={{
                    maxWidth: "520px",
                    margin: "0 auto",
                    padding: "16px 12px 80px",
                }}
            >
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
                        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "14px", fontWeight: 900, color: "#fff", letterSpacing: "-1px", textShadow: "0 0 14px rgba(0,229,255,.4)" }}>
                            zeezu
                        </span>
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "#00E5FF", letterSpacing: "3px", opacity: .8 }}>
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
                                    color: "#8A2EFF",
                                    background: "rgba(138,46,255,.15)",
                                    border: "1px solid rgba(138,46,255,.4)",
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
                        border: "1px solid rgba(138,46,255,.18)",
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
                                border: "1px solid rgba(138,46,255,.18)",
                                borderRadius: "8px",
                                padding: "7px 10px 7px 30px",
                                color: "#fff",
                                fontFamily: "'Nunito',sans-serif",
                                fontSize: "12px",
                                outline: "none",
                                transition: "border-color .2s",
                            }}
                            onFocus={e => e.target.style.borderColor = "rgba(138,46,255,.6)"}
                            onBlur={e => e.target.style.borderColor = "rgba(138,46,255,.18)"}
                        />
                    </div>
                </div>

                {/* ── CONTACT LIST — Yahoo/AIM style ── */}
                <div
                    style={{
                        background: "rgba(14,22,48,.88)",
                        border: "1px solid rgba(138,46,255,.18)",
                        borderTop: "none",
                        borderRadius: "0 0 14px 14px",
                        padding: "8px 10px 12px",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    {filtered.length === 0 ? (
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
                                {conversations.length === 0 ? "NO MESSAGES YET" : `NO MATCHES FOR "${searchQuery}"`}
                            </p>
                            {conversations.length === 0 && (
                                <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.2)" }}>
                                    Visit a friend's profile and hit "Message"
                                </p>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {/* Recent / Unread section */}
                            {recent.length > 0 && (
                                <>
                                    <SectionHeader label="UNREAD" count={recent.length} />
                                    {recent.map((c, i) => <ConvRow key={c.partnerId} conv={c} idx={i} />)}
                                </>
                            )}

                            {/* All conversations */}
                            {rest.length > 0 && (
                                <>
                                    <SectionHeader label={recent.length > 0 ? "ALL CHATS" : "RECENT CHATS"} count={rest.length} />
                                    {rest.map((c, i) => <ConvRow key={c.partnerId} conv={c} idx={i} />)}
                                </>
                            )}
                        </div>
                    )}

                    {/* Footer count */}
                    <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(138,46,255,.1)", textAlign: "center" }}>
                        <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.15)", letterSpacing: "2px" }}>
                            {conversations.length} THREADS · {totalUnread} UNREAD · END-TO-END NEON
                        </p>
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
                    borderTop: "1px solid rgba(138,46,255,.25)",
                    backdropFilter: "blur(16px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    padding: "4px 8px",
                }}
            >
                <ToolbarBtn icon="💬" label="CHATS" active badge={totalUnread} />
                <ToolbarBtn icon="👥" label="CONTACTS" />
                <ToolbarBtn icon="⚡" label="BUZZ" />
                <ToolbarBtn icon="⚙️" label="OPTIONS" />
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
                    borderTop: "1px solid rgba(138,46,255,.4)",
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