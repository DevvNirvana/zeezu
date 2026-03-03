"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import ClickSpark from "@/components/reactbits/ClickSpark";
import BuzzFlash from "@/components/BuzzFlash";
import {
    getMessages,
    sendMessage,
    markMessagesAsRead,
} from "@/lib/supabase/queries";
import {
    Loader2, ArrowLeft, Zap, Send, ChevronDown, Wifi, Check, CheckCheck,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

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
};

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

const formatMsgTime = (date: Date) => {
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday " + format(date, "h:mm a");
    return format(date, "MMM d, h:mm a");
};

// ── Inject CSS ────────────────────────────────────────────────
const STYLE_ID = "chat-thread-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
    @keyframes msgIn {
      from { opacity: 0; transform: translateY(8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .msg-bubble {
      animation: msgIn 0.25s ease-out forwards;
    }
    @keyframes typingDot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-4px); opacity: 1; }
    }
    .typing-dot:nth-child(1) { animation-delay: 0s; }
    .typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .typing-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes readGlow {
      from { color: #555; }
      to { color: #00F7FF; filter: drop-shadow(0 0 4px #00F7FF); }
    }
    @keyframes buzzMsgGlow {
      0%, 100% { box-shadow: 0 0 8px rgba(138,46,255,0.4); }
      50% { box-shadow: 0 0 20px rgba(138,46,255,0.8), 0 0 40px rgba(138,46,255,0.3); }
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(138,46,255,0.3); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(138,46,255,0.6); }
  `;
    document.head.appendChild(s);
}

export default function ChatThread() {
    const params = useParams();
    const router = useRouter();
    const partnerId = typeof params?.userId === "string" ? params.userId : "";

    const [loading, setLoading] = useState(true);
    const [myId, setMyId] = useState<string | null>(null);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [buzzFlash, setBuzzFlash] = useState<string | null>(null); // sender name for flash
    const [showScrollBtn, setShowBtn] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Scroll to bottom ────────────────────────────────────────
    const scrollToBottom = useCallback((smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
    }, []);

    // ── Initial load ────────────────────────────────────────────
    useEffect(() => {
        if (!partnerId) return;
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }
            setMyId(user.id);

            // Fetch partner info
            const { data: partnerData } = await supabase
                .from("users")
                .select("id, display_name, zid, avatar_url, status_message")
                .eq("id", partnerId)
                .single();

            if (!partnerData) { router.push("/messages"); return; }
            setPartner(partnerData);

            // Fetch messages
            const msgs = await getMessages(partnerId, 100);
            setMessages(msgs);

            // Mark as read
            await markMessagesAsRead(partnerId);

            setLoading(false);
            setTimeout(() => scrollToBottom(false), 100);
        }
        load();
    }, [partnerId, router, scrollToBottom]);

    // ── Realtime incoming messages ──────────────────────────────
    useEffect(() => {
        if (!myId || !partnerId) return;

        const channel = supabase
            .channel(`chat_${myId}_${partnerId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload: any) => {
                    const newMsg = payload.new as Message;
                    // Only process messages in this thread
                    const isInThread =
                        (newMsg.sender_id === myId && newMsg.receiver_id === partnerId) ||
                        (newMsg.sender_id === partnerId && newMsg.receiver_id === myId);

                    if (!isInThread) return;

                    // Deduplicate: skip if already in state
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    setTimeout(() => scrollToBottom(true), 50);

                    // If it's a buzz FROM the partner, trigger flash
                    if (newMsg.is_buzz && newMsg.sender_id === partnerId) {
                        setBuzzFlash(partner?.display_name || "Someone");
                    }

                    // Mark as read if from partner
                    if (newMsg.sender_id === partnerId) {
                        await markMessagesAsRead(partnerId);
                    }
                }
            )
            // Also listen for UPDATE events (read receipts)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                },
                (payload: any) => {
                    const updated = payload.new as Message;
                    setMessages(prev =>
                        prev.map(m => m.id === updated.id ? { ...m, is_read: updated.is_read } : m)
                    );
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [myId, partnerId, partner?.display_name, scrollToBottom]);

    // ── Track scroll position for FAB ──────────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => {
            const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            setShowBtn(fromBottom > 200);
        };
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [loading]);

    // ── Send message ───────────────────────────────────────────
    const handleSend = async (isBuzz = false) => {
        if (!partnerId || sending) return;
        if (!isBuzz && !input.trim()) return;

        setSending(true);
        const msgContent = input.trim();
        setInput("");
        const result = await sendMessage(partnerId, msgContent, isBuzz);
        if (result) {
            // Deduplicated add — realtime may beat us
            setMessages(prev => {
                if (prev.some(m => m.id === result.id)) return prev;
                return [...prev, result];
            });
            setTimeout(() => scrollToBottom(true), 50);
        }
        setSending(false);
        inputRef.current?.focus();
    };

    // ── Loading ────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 text-electric animate-spin" />
                <span className="text-[10px] font-mono text-gray-600 tracking-[0.2em] uppercase">
                    Loading Thread...
                </span>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-[#0B0B12] text-white flex flex-col">

            {/* ── BUZZ FLASH OVERLAY ── */}
            {buzzFlash && (
                <BuzzFlash
                    senderName={buzzFlash}
                    onDismiss={() => setBuzzFlash(null)}
                />
            )}

            {/* ── HEADER ── */}
            <div
                className="flex-shrink-0 border-b backdrop-blur-md px-4 py-3"
                style={{ borderColor: "rgba(138,46,255,0.2)", backgroundColor: "rgba(138,46,255,0.04)" }}
            >
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <button
                        onClick={() => router.push("/messages")}
                        className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <Link href={`/u/${partner?.zid}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                        <div className="relative flex-shrink-0">
                            <img
                                src={getAvatar(partner?.zid ?? "", partner?.avatar_url)}
                                className="w-10 h-10 rounded-xl border border-electric/30 group-hover:border-electric transition-all"
                                alt={partner?.display_name}
                            />
                            {/* Online dot */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B0B12] bg-lime" style={{ boxShadow: "0 0 6px #B4FF00" }} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-black text-white group-hover:text-electric transition-colors truncate">
                                {partner?.display_name}
                            </h2>
                            <p className="text-[9px] font-mono text-gray-600 truncate">
                                {partner?.status_message || partner?.zid}
                            </p>
                        </div>
                    </Link>

                    {/* Realtime indicator */}
                    <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-lime" />
                        <span className="text-[8px] text-lime font-mono">LIVE</span>
                    </div>
                </div>
            </div>

            {/* ── MESSAGES AREA ── */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4"
            >
                <div className="max-w-3xl mx-auto space-y-1.5">
                    {messages.length === 0 ? (
                        <div className="text-center py-16 flex flex-col items-center">
                            <div className="relative mb-4">
                                <img
                                    src={getAvatar(partner?.zid ?? "", partner?.avatar_url)}
                                    className="w-16 h-16 rounded-2xl border-2 border-electric/30"
                                    alt={partner?.display_name}
                                />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0B0B12] border-2 border-electric/30 flex items-center justify-center">
                                    <Zap className="w-3 h-3 text-electric" />
                                </div>
                            </div>
                            <p className="text-sm font-black text-white mb-1">{partner?.display_name}</p>
                            <p className="text-[10px] text-gray-600 font-mono mb-6">
                                Start a conversation or send a Buzz ⚡
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setInput("👋"); setTimeout(() => handleSend(false), 100); }}
                                    className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-800 hover:border-electric bg-gray-900/50 hover:bg-electric/10 text-gray-400 hover:text-white transition-all"
                                >
                                    👋 Wave
                                </button>
                                <button
                                    onClick={() => handleSend(true)}
                                    className="px-4 py-2 rounded-lg text-xs font-bold border border-electric/40 bg-electric/10 hover:bg-electric/20 text-electric transition-all flex items-center gap-1.5"
                                >
                                    <Zap className="w-3 h-3 fill-current" /> Send a Buzz
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.sender_id === myId;
                            const prevMsg = messages[i - 1];
                            const showTime = !prevMsg || (
                                new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000 // 5 min gap
                            );

                            return (
                                <div key={`msg-${msg.id}`}>
                                    {/* Time separator */}
                                    {showTime && (
                                        <div className="text-center py-3">
                                            <span className="text-[9px] font-mono text-gray-700 bg-gray-900/50 px-3 py-1 rounded-full">
                                                {formatMsgTime(new Date(msg.created_at))}
                                            </span>
                                        </div>
                                    )}

                                    {/* Message bubble */}
                                    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`msg-bubble max-w-[75%] px-4 py-2.5 rounded-2xl relative group ${msg.is_buzz ? "border" : ""
                                                }`}
                                            style={{
                                                background: isMe
                                                    ? msg.is_buzz
                                                        ? "linear-gradient(135deg, rgba(138,46,255,0.3) 0%, rgba(138,46,255,0.1) 100%)"
                                                        : "linear-gradient(135deg, rgba(138,46,255,0.2) 0%, rgba(138,46,255,0.08) 100%)"
                                                    : msg.is_buzz
                                                        ? "linear-gradient(135deg, rgba(0,247,255,0.15) 0%, rgba(0,247,255,0.05) 100%)"
                                                        : "rgba(255,255,255,0.04)",
                                                borderColor: msg.is_buzz
                                                    ? isMe ? "rgba(138,46,255,0.5)" : "rgba(0,247,255,0.3)"
                                                    : "transparent",
                                                borderRadius: isMe
                                                    ? "20px 20px 6px 20px"
                                                    : "20px 20px 20px 6px",
                                                boxShadow: isMe
                                                    ? "0 2px 12px rgba(138,46,255,0.15)"
                                                    : "0 2px 8px rgba(0,0,0,0.2)",
                                                animation: msg.is_buzz ? "buzzMsgGlow 2s infinite" : undefined,
                                            }}
                                        >
                                            {/* Buzz lightning badge */}
                                            {msg.is_buzz && (
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Zap className="w-3 h-3 text-electric fill-electric" style={{ filter: "drop-shadow(0 0 4px #8A2EFF)" }} />
                                                    <span className="text-[8px] font-black text-electric uppercase tracking-widest">Buzz</span>
                                                </div>
                                            )}

                                            <p className="text-[13px] leading-relaxed text-white/90 break-words">
                                                {msg.content}
                                            </p>

                                            {/* Time + read status */}
                                            <div className={`flex items-center gap-1.5 mt-1 ${isMe ? "justify-end" : ""}`}>
                                                <span className="text-[8px] font-mono text-gray-600">
                                                    {format(new Date(msg.created_at), "h:mm a")}
                                                </span>
                                                {isMe && (
                                                    msg.is_read ? (
                                                        <CheckCheck className="w-3 h-3" style={{ color: "#00F7FF", filter: "drop-shadow(0 0 4px #00F7FF)", animation: "readGlow 0.5s ease-out" }} />
                                                    ) : (
                                                        <Check className="w-3 h-3 text-gray-600" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* ── SCROLL TO BOTTOM FAB ── */}
            {showScrollBtn && (
                <button
                    onClick={() => scrollToBottom(true)}
                    className="fixed bottom-24 right-6 w-10 h-10 rounded-full bg-electric/90 text-white flex items-center justify-center shadow-[0_0_20px_rgba(138,46,255,0.5)] hover:bg-electric transition-all z-50"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            )}

            {/* ── INPUT BAR ── */}
            <div
                className="flex-shrink-0 border-t px-3 sm:px-4 py-2.5 sm:py-3"
                style={{ borderColor: "rgba(138,46,255,0.15)", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
            >
                <div className="max-w-3xl mx-auto flex items-center gap-2">
                    {/* Text input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(false); } }}
                        placeholder="Type a message..."
                        className="flex-1 min-w-0 bg-gray-900/60 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl px-3 sm:px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-gray-700"
                        disabled={sending}
                    />

                    {/* Send button */}
                    <button
                        onClick={() => handleSend(false)}
                        disabled={!input.trim() || sending}
                        className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                        style={{
                            background: input.trim() ? "linear-gradient(135deg, #8A2EFF 0%, #6B1FCC 100%)" : "rgba(255,255,255,0.04)",
                            boxShadow: input.trim() ? "0 0 16px rgba(138,46,255,0.5)" : "none",
                        }}
                    >
                        {sending ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 text-white" />
                        )}
                    </button>

                    {/* BUZZ button with ClickSpark */}
                    <ClickSpark
                        sparkColor="#8A2EFF"
                        sparkSize={14}
                        sparkRadius={30}
                        sparkCount={12}
                        duration={600}
                        extraScale={1.5}
                    >
                        <button
                            onClick={() => handleSend(true)}
                            disabled={sending}
                            className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                            style={{
                                borderColor: "rgba(138,46,255,0.6)",
                                background: "linear-gradient(135deg, rgba(138,46,255,0.2) 0%, rgba(255,0,122,0.1) 100%)",
                                boxShadow: "0 0 12px rgba(138,46,255,0.3), inset 0 0 12px rgba(138,46,255,0.1)",
                            }}
                            title="Send a Buzz! ⚡"
                        >
                            <Zap className="w-5 h-5 text-electric fill-electric" style={{ filter: "drop-shadow(0 0 6px #8A2EFF)" }} />
                        </button>
                    </ClickSpark>
                </div>
            </div>
        </div>
    );
}
