"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import ClickSpark from "@/components/reactbits/ClickSpark";
import BuzzFlash from "@/components/BuzzFlash";
import { getMessages, sendMessage, markMessagesAsRead } from "@/lib/supabase/queries";
import { Loader2, ArrowLeft, Zap, Send, ChevronDown, Wifi, Check, CheckCheck } from "lucide-react";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import { AGENT_IDS } from "@/lib/agents";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

// ─────────────────────────────────────────────────────────────
//  TYPES — unchanged
// ─────────────────────────────────────────────────────────────

type Message = {
    id: number;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_buzz: boolean;
    is_read: boolean;
    created_at: string;
};

type Partner = {
    id: string;
    display_name: string;
    zid: string;
    avatar_url: string | null;
    status_message: string | null;
    birth_year?: number | null;
    birth_month?: number | null;
    birth_day?: number | null;
};

// ─────────────────────────────────────────────────────────────
//  HELPERS — unchanged
// ─────────────────────────────────────────────────────────────

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

const formatMsgTime = (date: Date) => {
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday " + format(date, "h:mm a");
    return format(date, "MMM d, h:mm a");
};

// ─────────────────────────────────────────────────────────────
//  GLOBAL STYLES — injected once
// ─────────────────────────────────────────────────────────────

const STYLE_ID = "zee-chat-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');

    @keyframes zc-msg-in  { from{opacity:0;transform:translateY(8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes zc-buzz-glow { 0%,100%{box-shadow:0 0 8px rgba(138,46,255,.4)} 50%{box-shadow:0 0 20px rgba(138,46,255,.8),0 0 40px rgba(138,46,255,.3)} }
    @keyframes zc-typing  { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-3px);opacity:1} }
    @keyframes zc-read    { from{color:#555} to{color:#00F7FF;filter:drop-shadow(0 0 4px #00F7FF)} }
    @keyframes zc-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
    @keyframes zc-online  { 0%,100%{opacity:1} 50%{opacity:.28} }
    @keyframes spin        { to{transform:rotate(360deg)} }

    .zc-msg { animation: zc-msg-in 0.25s ease-out forwards; }
    .zc-bubble-buzz { animation: zc-buzz-glow 2s infinite; }

    /* Custom scrollbar */
    .zc-scroll::-webkit-scrollbar       { width: 4px; }
    .zc-scroll::-webkit-scrollbar-track { background: transparent; }
    .zc-scroll::-webkit-scrollbar-thumb { background: rgba(138,46,255,.3); border-radius: 4px; }

    /* MSN-style typing indicator dots */
    .zc-td:nth-child(1) { animation: zc-typing 1.2s ease-in-out infinite 0s; }
    .zc-td:nth-child(2) { animation: zc-typing 1.2s ease-in-out infinite .15s; }
    .zc-td:nth-child(3) { animation: zc-typing 1.2s ease-in-out infinite .30s; }

    /* Input placeholder */
    .zc-input::placeholder { color: rgba(255,255,255,.25); font-family: 'Nunito', sans-serif; }
  `;
    document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────
//  TYPING INDICATOR — MSN "is typing a message..."
// ─────────────────────────────────────────────────────────────

function TypingIndicator({ name }: { name: string }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px 8px",
                opacity: 0.7,
            }}
        >
            <span
                style={{
                    fontFamily: "'VT323',monospace",
                    fontSize: "11px",
                    color: "rgba(138,46,255,.7)",
                    letterSpacing: "0.5px",
                    fontStyle: "italic",
                }}
            >
                {name} is typing a message
            </span>
            <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="zc-td"
                        style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            background: "#8A2EFF",
                            boxShadow: "0 0 4px #8A2EFF",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  TIME SEPARATOR — Skype/BBM date divider
// ─────────────────────────────────────────────────────────────

function TimeSeparator({ date }: { date: Date }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0 4px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(138,46,255,.15)" }} />
            <span
                style={{
                    fontFamily: "'VT323',monospace",
                    fontSize: "10px",
                    color: "rgba(255,255,255,.3)",
                    letterSpacing: "1px",
                    whiteSpace: "nowrap",
                    background: "rgba(0,0,0,.3)",
                    border: "1px solid rgba(138,46,255,.15)",
                    borderRadius: "12px",
                    padding: "1px 8px",
                }}
            >
                {formatMsgTime(date)}
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(138,46,255,.15)" }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  MESSAGE BUBBLE — MSN/BBM hybrid
//  My messages: right-aligned, violet
//  Their messages: left-aligned, with avatar + colored name (MSN style)
// ─────────────────────────────────────────────────────────────

function MsgBubble({
    msg,
    isMe,
    partnerName,
    partnerZid,
    partnerAvatar,
    myName,
}: {
    msg: Message;
    isMe: boolean;
    partnerName: string;
    partnerZid: string;
    partnerAvatar: string | null;
    myName: string;
}) {
    return (
        <div
            className="zc-msg"
            style={{
                display: "flex",
                flexDirection: isMe ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: "7px",
            }}
        >
            {/* Partner avatar (left side only) — BBM style */}
            {!isMe && (
                <img
                    src={getAvatar(partnerZid, partnerAvatar)}
                    alt={partnerName}
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        border: "1px solid rgba(0,229,255,.3)",
                        flexShrink: 0,
                        alignSelf: "flex-end",
                        marginBottom: "2px",
                    }}
                />
            )}

            <div
                style={{
                    maxWidth: "72%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                }}
            >
                {/* MSN-style colored sender name above bubble */}
                <span
                    style={{
                        fontFamily: "'VT323',monospace",
                        fontSize: "10px",
                        letterSpacing: "0.5px",
                        color: isMe ? "rgba(138,46,255,.7)" : "rgba(0,229,255,.8)",
                        marginBottom: "2px",
                        paddingLeft: isMe ? 0 : "4px",
                        paddingRight: isMe ? "4px" : 0,
                    }}
                >
                    {isMe ? myName : partnerName}
                </span>

                {/* Bubble */}
                <div
                    className={msg.is_buzz ? "zc-bubble-buzz" : ""}
                    style={{
                        padding: "9px 13px",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isMe
                            ? msg.is_buzz
                                ? "linear-gradient(135deg,rgba(138,46,255,.35),rgba(138,46,255,.12))"
                                : "linear-gradient(135deg,rgba(138,46,255,.22),rgba(138,46,255,.08))"
                            : msg.is_buzz
                                ? "linear-gradient(135deg,rgba(0,229,255,.18),rgba(0,229,255,.06))"
                                : "rgba(255,255,255,.05)",
                        border: msg.is_buzz
                            ? `1px solid ${isMe ? "rgba(138,46,255,.5)" : "rgba(0,229,255,.35)"}`
                            : `1px solid ${isMe ? "rgba(138,46,255,.2)" : "rgba(255,255,255,.08)"}`,
                        boxShadow: isMe
                            ? "0 2px 12px rgba(138,46,255,.12)"
                            : "0 2px 8px rgba(0,0,0,.2)",
                        position: "relative",
                    }}
                >
                    {/* Buzz label */}
                    {msg.is_buzz && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                            <Zap size={10} style={{ color: "#8A2EFF", fill: "#8A2EFF", filter: "drop-shadow(0 0 4px #8A2EFF)" }} />
                            <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "#8A2EFF", letterSpacing: "2px", fontWeight: 700 }}>
                                BUZZ
                            </span>
                        </div>
                    )}

                    <p
                        style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            color: "rgba(255,255,255,.88)",
                            wordBreak: "break-word",
                            margin: 0,
                        }}
                    >
                        {msg.content}
                    </p>

                    {/* Timestamp + read receipt */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "4px",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                        }}
                    >
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.25)", letterSpacing: "0.5px" }}>
                            {format(new Date(msg.created_at), "h:mm a")}
                        </span>
                        {isMe && (
                            msg.is_read
                                ? <CheckCheck size={11} style={{ color: "#00E5FF", filter: "drop-shadow(0 0 4px #00E5FF)", animation: "zc-read .5s ease-out" }} />
                                : <Check size={11} style={{ color: "rgba(255,255,255,.25)" }} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  TOOLBAR ACTION BUTTON — BBM attachment toolbar
// ─────────────────────────────────────────────────────────────

function ActionBtn({
    icon,
    label,
    onClick,
    glow = false,
}: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    glow?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "5px 8px",
                borderRadius: "8px",
                background: glow ? "rgba(138,46,255,.15)" : "transparent",
                border: glow ? "1px solid rgba(138,46,255,.35)" : "1px solid transparent",
                cursor: "pointer",
                minWidth: "44px",
                color: glow ? "#8A2EFF" : "rgba(255,255,255,.45)",
                transition: "all .18s",
            }}
        >
            <span style={{ fontSize: "16px", lineHeight: 1 }}>{icon}</span>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", letterSpacing: "1px", whiteSpace: "nowrap" }}>{label}</span>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function ChatThread() {
    const params = useParams();
    const router = useRouter();
    const partnerId = typeof params?.userId === "string" ? params.userId : "";

    // ── State — all unchanged ─────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [myId, setMyId] = useState<string | null>(null);
    const [myName, setMyName] = useState("You");
    const [partner, setPartner] = useState<Partner | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [buzzFlash, setBuzzFlash] = useState<string | null>(null);
    const [showScrollBtn, setShowBtn] = useState(false);
    const [isTyping, setIsTyping] = useState(false); // simulated

    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback((smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
    }, []);

    // ── Initial load — unchanged ──────────────────────────────
    useEffect(() => {
        if (!partnerId) return;
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }
            setMyId(user.id);

            const [{ data: meData }, { data: partnerData }] = await Promise.all([
                supabase.from("users").select("display_name").eq("id", user.id).single(),
                supabase.from("users").select("id,display_name,zid,avatar_url,status_message,birth_year,birth_month,birth_day").eq("id", partnerId).single(),
            ]);

            if (!partnerData) { router.push("/messages"); return; }
            setPartner(partnerData);
            if (meData?.display_name) setMyName(meData.display_name);

            const msgs = await getMessages(partnerId, 100);
            setMessages(msgs);
            await markMessagesAsRead(partnerId);
            setLoading(false);
            setTimeout(() => scrollToBottom(false), 100);
        }
        load();
    }, [partnerId, router, scrollToBottom]);

    // ── Realtime — unchanged ──────────────────────────────────
    useEffect(() => {
        if (!myId || !partnerId) return;
        const channel = supabase
            .channel(`chat_${myId}_${partnerId}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (p: any) => {
                const newMsg = p.new as Message;
                const inThread =
                    (newMsg.sender_id === myId && newMsg.receiver_id === partnerId) ||
                    (newMsg.sender_id === partnerId && newMsg.receiver_id === myId);
                if (!inThread) return;
                setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
                setTimeout(() => scrollToBottom(true), 50);
                if (newMsg.is_buzz && newMsg.sender_id === partnerId) {
                    setBuzzFlash(partner?.display_name || "Someone");
                }
                if (newMsg.sender_id === partnerId) await markMessagesAsRead(partnerId);
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (p: any) => {
                const updated = p.new as Message;
                setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, is_read: updated.is_read } : m));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [myId, partnerId, partner?.display_name, scrollToBottom]);

    // ── Scroll FAB ────────────────────────────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => setShowBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [loading]);

    // ── Send — unchanged ──────────────────────────────────────
    const handleSend = async (isBuzz = false) => {
        if (!partnerId || sending) return;
        if (!isBuzz && !input.trim()) return;
        setSending(true);
        const msgContent = input.trim();
        setInput("");
        const result = await sendMessage(partnerId, msgContent, isBuzz);
        if (result) {
            setMessages(prev => prev.some(m => m.id === result.id) ? prev : [...prev, result]);
            setTimeout(() => scrollToBottom(true), 50);
        }
        setSending(false);
        inputRef.current?.focus();
    };

    // ── Simulate typing indicator on input focus ──────────────
    // (visual only — just shows occasionally when partner "responds")
    useEffect(() => {
        if (!input || messages.length === 0) { setIsTyping(false); return; }
        const t = setTimeout(() => setIsTyping(false), 3000);
        return () => clearTimeout(t);
    }, [input, messages.length]);

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#080E24", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <Loader2 size={28} style={{ color: "#8A2EFF", animation: "spin 1s linear infinite" }} />
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(138,46,255,.6)", letterSpacing: "3px" }}>
                LOADING THREAD...
            </span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    const isAgent = AGENT_IDS.has(partner?.id ?? "");
    const gen = getGeneration(partner?.birth_year, partner?.birth_month, partner?.birth_day, isAgent);

    return (
        <div
            style={{
                height: "100vh",
                background: "#080E24",
                backgroundImage: `
          radial-gradient(ellipse 70% 40% at 50% 0%, rgba(138,46,255,.1) 0%, transparent 55%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='.8' fill='rgba(255,255,255,.03)'/%3E%3C/svg%3E")
        `,
                display: "flex",
                flexDirection: "column",
                color: "#fff",
                fontFamily: "'Nunito',system-ui,sans-serif",
                overflow: "hidden",
            }}
        >
            {/* ── BUZZ FLASH — unchanged ────────────────────────── */}
            {buzzFlash && <BuzzFlash senderName={buzzFlash} onDismiss={() => setBuzzFlash(null)} />}

            {/* ══ CHAT HEADER — BBM/Skype style ═════════════════════
          Portal header with avatar, name, status, gen badge
      ══════════════════════════════════════════════════════ */}
            <div
                style={{
                    flexShrink: 0,
                    background: "linear-gradient(135deg,rgba(109,16,232,.9) 0%,rgba(59,13,168,.9) 40%,rgba(11,75,143,.9) 100%)",
                    backdropFilter: "blur(16px)",
                    borderBottom: "1px solid rgba(138,46,255,.25)",
                    boxShadow: "0 4px 24px rgba(0,0,0,.4)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Scanline texture */}
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 4px)", pointerEvents: "none" }} />

                <div
                    style={{
                        maxWidth: "680px",
                        margin: "0 auto",
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    {/* Back button */}
                    <button
                        onClick={() => router.push("/messages")}
                        style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "rgba(255,255,255,.08)",
                            border: "1px solid rgba(255,255,255,.12)",
                            color: "rgba(255,255,255,.7)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all .18s",
                        }}
                    >
                        <ArrowLeft size={14} />
                    </button>

                    {/* Avatar + online dot */}
                    <Link href={`/u/${partner?.zid}`} style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0, textDecoration: "none" }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <img
                                src={getAvatar(partner?.zid ?? "", partner?.avatar_url)}
                                alt={partner?.display_name}
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    border: "1.5px solid rgba(0,229,255,.4)",
                                    display: "block",
                                }}
                            />
                            {/* Online dot — BBM style */}
                            <span
                                style={{
                                    position: "absolute",
                                    bottom: "-2px",
                                    right: "-2px",
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "50%",
                                    background: "#B4FF00",
                                    boxShadow: "0 0 6px #B4FF00",
                                    border: "2px solid #080E24",
                                    animation: "zc-online 2.2s ease-in-out infinite",
                                }}
                            />
                        </div>

                        {/* Name + status */}
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                <h2
                                    style={{
                                        fontFamily: "'Orbitron',sans-serif",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        color: "#fff",
                                        letterSpacing: "-0.5px",
                                        margin: 0,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {partner?.display_name}
                                </h2>
                                {gen && <GenBadge gen={gen} size="sm" />}
                            </div>
                            <p
                                style={{
                                    fontFamily: "'VT323',monospace",
                                    fontSize: "10px",
                                    color: "rgba(255,255,255,.4)",
                                    margin: 0,
                                    letterSpacing: "0.5px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {partner?.status_message || partner?.zid}
                            </p>
                        </div>
                    </Link>

                    {/* Live indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                        <Wifi size={11} style={{ color: "#6BCB77" }} />
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "#6BCB77", letterSpacing: "1px" }}>LIVE</span>
                    </div>
                </div>
            </div>

            {/* ══ MESSAGES AREA ══════════════════════════════════════ */}
            <div
                ref={scrollRef}
                className="zc-scroll"
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "8px 12px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        maxWidth: "680px",
                        margin: "0 auto",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                    }}
                >
                    {messages.length === 0 ? (
                        /* ── Empty state — AIM / BBM style ── */
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "40px 0",
                                gap: "12px",
                            }}
                        >
                            {/* Partner mini-card */}
                            <div
                                style={{
                                    background: "rgba(14,22,48,.8)",
                                    border: "1px solid rgba(138,46,255,.25)",
                                    borderRadius: "16px",
                                    padding: "20px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "8px",
                                    maxWidth: "240px",
                                }}
                            >
                                <div style={{ position: "relative" }}>
                                    <img
                                        src={getAvatar(partner?.zid ?? "", partner?.avatar_url)}
                                        style={{ width: "56px", height: "56px", borderRadius: "14px", border: "2px solid rgba(138,46,255,.4)" }}
                                        alt=""
                                    />
                                    <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "14px", height: "14px", borderRadius: "50%", background: "#B4FF00", boxShadow: "0 0 6px #B4FF00", border: "2px solid #080E24" }} />
                                </div>
                                <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "12px", fontWeight: 700, color: "#fff", margin: 0 }}>
                                    {partner?.display_name}
                                </p>
                                <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", margin: 0, letterSpacing: "1px" }}>
                                    {partner?.zid}
                                </p>
                                <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.3)", margin: 0 }}>
                                    Start a conversation or send a Buzz ⚡
                                </p>
                            </div>

                            {/* Quick-start buttons — AIM wave style */}
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    onClick={() => { setInput("👋"); setTimeout(() => handleSend(false), 100); }}
                                    style={{
                                        padding: "7px 14px",
                                        borderRadius: "8px",
                                        background: "rgba(255,255,255,.05)",
                                        border: "1px solid rgba(255,255,255,.12)",
                                        color: "rgba(255,255,255,.6)",
                                        fontFamily: "'Nunito',sans-serif",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        transition: "all .18s",
                                    }}
                                >
                                    👋 Wave
                                </button>
                                <button
                                    onClick={() => handleSend(true)}
                                    style={{
                                        padding: "7px 14px",
                                        borderRadius: "8px",
                                        background: "rgba(138,46,255,.15)",
                                        border: "1px solid rgba(138,46,255,.4)",
                                        color: "#8A2EFF",
                                        fontFamily: "'Orbitron',sans-serif",
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        letterSpacing: "0.5px",
                                        transition: "all .18s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "5px",
                                    }}
                                >
                                    <Zap size={11} style={{ fill: "#8A2EFF" }} /> BUZZ
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.sender_id === myId;
                            const prev = messages[i - 1];
                            const showTime = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 300000;

                            return (
                                <div key={`msg-${msg.id}`}>
                                    {showTime && <TimeSeparator date={new Date(msg.created_at)} />}
                                    <MsgBubble
                                        msg={msg}
                                        isMe={isMe}
                                        partnerName={partner?.display_name ?? ""}
                                        partnerZid={partner?.zid ?? ""}
                                        partnerAvatar={partner?.avatar_url ?? null}
                                        myName={myName}
                                    />
                                </div>
                            );
                        })
                    )}

                    {/* MSN "is typing a message..." */}
                    {isTyping && partner && <TypingIndicator name={partner.display_name} />}

                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Scroll-to-bottom FAB */}
            {showScrollBtn && (
                <button
                    onClick={() => scrollToBottom(true)}
                    style={{
                        position: "fixed",
                        bottom: "90px",
                        right: "16px",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(138,46,255,.9)",
                        border: "none",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 0 16px rgba(138,46,255,.5)",
                        zIndex: 50,
                    }}
                >
                    <ChevronDown size={18} />
                </button>
            )}

            {/* ══ INPUT BAR — BBM action strip + MSN send bar ═════════
          Top row: Attach / Emoji / Buzz action strip (BBM)
          Bottom row: text input + send button (MSN)
      ══════════════════════════════════════════════════════ */}
            <div
                style={{
                    flexShrink: 0,
                    borderTop: "1px solid rgba(138,46,255,.2)",
                    background: "rgba(8,14,36,.96)",
                    backdropFilter: "blur(16px)",
                    backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.008) 3px,rgba(255,255,255,.008) 4px)",
                }}
            >
                {/* BBM-style action strip */}
                <div
                    style={{
                        maxWidth: "680px",
                        margin: "0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-around",
                        padding: "4px 8px 0",
                        borderBottom: "1px solid rgba(138,46,255,.08)",
                    }}
                >
                    <ActionBtn icon="📎" label="ATTACH" />
                    <ActionBtn icon="🎵" label="AUDIO" />
                    <ActionBtn icon="😊" label="EMOJI" />
                    <ClickSpark sparkColor="#8A2EFF" sparkSize={12} sparkRadius={28} sparkCount={10} duration={500} extraScale={1.4}>
                        <ActionBtn icon="⚡" label="BUZZ" glow onClick={() => handleSend(true)} />
                    </ClickSpark>
                    <ActionBtn icon="⋯" label="MORE" />
                </div>

                {/* MSN-style text + send row */}
                <div
                    style={{
                        maxWidth: "680px",
                        margin: "0 auto",
                        display: "flex",
                        gap: "8px",
                        padding: "8px 10px 10px",
                        alignItems: "center",
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => { setInput(e.target.value); setIsTyping(e.target.value.length > 0); }}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(false); } }}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="zc-input"
                        style={{
                            flex: 1,
                            minWidth: 0,
                            background: "rgba(0,0,0,.4)",
                            border: "1px solid rgba(138,46,255,.2)",
                            borderRadius: "10px",
                            padding: "10px 14px",
                            color: "#fff",
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: "13px",
                            outline: "none",
                            transition: "border-color .2s, box-shadow .2s",
                        }}
                        onFocus={e => { e.target.style.borderColor = "rgba(138,46,255,.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(138,46,255,.1)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(138,46,255,.2)"; e.target.style.boxShadow = "none"; }}
                    />

                    {/* Send button — MSN style */}
                    <button
                        onClick={() => handleSend(false)}
                        disabled={!input.trim() || sending}
                        style={{
                            width: "42px",
                            height: "42px",
                            flexShrink: 0,
                            borderRadius: "10px",
                            background: input.trim()
                                ? "linear-gradient(135deg,#8A2EFF,#6010D4)"
                                : "rgba(255,255,255,.04)",
                            border: "1px solid rgba(138,46,255,.3)",
                            color: "#fff",
                            cursor: !input.trim() ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: !input.trim() ? .35 : 1,
                            boxShadow: input.trim() ? "0 0 14px rgba(138,46,255,.4)" : "none",
                            transition: "all .18s",
                        }}
                    >
                        {sending
                            ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                            : <Send size={16} />
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}