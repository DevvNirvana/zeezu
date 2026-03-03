"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import { getConversations, type Conversation } from "@/lib/supabase/queries";
import {
    Loader2, MessageCircle, Zap, Search, Inbox, Wifi,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

// ── Decrypted Text Effect (inspired by React Bits) ────────────
function DecryptHeader({ text }: { text: string }) {
    const [display, setDisplay] = useState("");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+0123456789";

    useEffect(() => {
        let frame = 0;
        const maxFrames = text.length * 3;
        const interval = setInterval(() => {
            frame++;
            const revealed = Math.floor((frame / maxFrames) * text.length);
            const result = text.split("").map((char, i) => {
                if (char === " ") return " ";
                if (i < revealed) return text[i];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join("");
            setDisplay(result);
            if (frame >= maxFrames) clearInterval(interval);
        }, 35);
        return () => clearInterval(interval);
    }, [text]);

    return (
        <span className="font-mono tracking-[0.2em]">{display || text}</span>
    );
}

// ── Inject CSS ────────────────────────────────────────────────
const STYLE_ID = "messages-page-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
    @keyframes convSlide {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .conv-row {
      animation: convSlide 0.3s ease-out forwards;
    }
    @keyframes buzzPulse {
      0%, 100% { box-shadow: 0 0 4px rgba(138,46,255,0.6); }
      50% { box-shadow: 0 0 16px rgba(138,46,255,0.9), 0 0 32px rgba(138,46,255,0.4); }
    }
  `;
    document.head.appendChild(s);
}

export default function MessagesInbox() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [conversations, setConvs] = useState<Conversation[]>([]);
    const [searchQuery, setSearch] = useState("");

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }

            const convs = await getConversations();
            setConvs(convs);
            setLoading(false);
        }
        load();
    }, [router]);

    // Realtime: listen for new messages to any conversation
    useEffect(() => {
        async function setupRealtime() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel("inbox_realtime")
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                        filter: `receiver_id=eq.${user.id}`,
                    },
                    async () => {
                        // Refresh conversations on new message
                        const updated = await getConversations();
                        setConvs(updated);
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
        setupRealtime();
    }, []);

    const filtered = searchQuery
        ? conversations.filter(c =>
            c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.partnerZid.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : conversations;

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    if (loading) return (
        <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 text-electric animate-spin" />
                <span className="text-[10px] font-mono text-gray-600 tracking-[0.2em] uppercase">Decrypting Inbox...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0B12] text-white pb-24">
            <NavBar />

            <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">

                {/* ── HEADER ── */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-electric/10 border border-electric/30"
                                style={{ animation: totalUnread > 0 ? "buzzPulse 2s infinite" : undefined }}>
                                <MessageCircle className="w-5 h-5 text-electric" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tighter text-electric"
                                    style={{ textShadow: "0 0 20px rgba(138,46,255,0.6)" }}>
                                    <DecryptHeader text="MESSAGES" />
                                </h1>
                                <p className="text-[10px] text-gray-600 font-mono">
                                    {conversations.length} conversation{conversations.length !== 1 ? "s" : ""} · {totalUnread} unread
                                </p>
                            </div>
                        </div>

                        {/* Realtime indicator */}
                        <div className="flex items-center gap-1.5">
                            <Wifi className="w-3 h-3 text-lime" />
                            <span className="text-[9px] text-lime font-mono uppercase tracking-wider">Live</span>
                        </div>
                    </div>
                </div>

                {/* ── SEARCH ── */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full bg-black/40 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-700 font-mono"
                        />
                    </div>
                </div>

                {/* ── CONVERSATIONS ── */}
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-800 py-16 text-center">
                        <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-800" />
                        {conversations.length === 0 ? (
                            <>
                                <p className="text-sm text-gray-600 font-mono">No messages yet</p>
                                <p className="text-xs text-gray-700 mt-1">Visit a friend's profile and hit "Message"</p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-600 font-mono">No matches for "{searchQuery}"</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {filtered.map((conv, i) => (
                            <Link
                                key={conv.partnerId}
                                href={`/messages/${conv.partnerId}`}
                                className="conv-row group flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-electric/5"
                                style={{
                                    borderColor: conv.unreadCount > 0 ? "rgba(138,46,255,0.4)" : "rgba(255,255,255,0.06)",
                                    backgroundColor: conv.unreadCount > 0 ? "rgba(138,46,255,0.05)" : "transparent",
                                    animationDelay: `${i * 0.04}s`,
                                }}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={getAvatar(conv.partnerZid, conv.partnerAvatar)}
                                        className="w-12 h-12 rounded-xl border transition-all"
                                        style={{
                                            borderColor: conv.unreadCount > 0 ? "rgba(138,46,255,0.5)" : "rgba(255,255,255,0.08)",
                                        }}
                                        alt={conv.partnerName}
                                    />
                                    {conv.unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-electric text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(138,46,255,0.8)]">
                                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={`text-sm font-black truncate ${conv.unreadCount > 0 ? "text-white" : "text-gray-300"}`}>
                                            {conv.partnerName}
                                        </h3>
                                        <span className="text-[9px] font-mono text-gray-600 flex-shrink-0">
                                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {/* Buzz indicator */}
                                        {conv.lastMessageIsBuzz && (
                                            <Zap className="w-3 h-3 text-electric fill-electric flex-shrink-0" style={{ filter: "drop-shadow(0 0 4px #8A2EFF)" }} />
                                        )}
                                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-gray-400 font-medium" : "text-gray-600"}`}>
                                            {conv.lastMessageIsFromMe && <span className="text-gray-700">You: </span>}
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </div>

                                {/* Arrow hint */}
                                <div className="text-gray-800 group-hover:text-electric transition-colors flex-shrink-0">
                                    <MessageCircle className="w-4 h-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* ── FOOTER ── */}
                <div className="mt-8 text-center">
                    <p className="text-[9px] font-mono text-gray-700 tracking-[0.2em]">
                        {conversations.length} THREADS · {totalUnread} UNREAD · END-TO-END NEON
                    </p>
                </div>
            </div>
        </div>
    );
}
