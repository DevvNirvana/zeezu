"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import {
    getFriends,
    getIncomingRequests,
    respondToFriendRequest,
    removeFriend,
} from "@/lib/supabase/queries";
import {
    Loader2, Users, UserPlus, UserCheck, UserX, Search,
    Clock, X, Check, ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

// ── Inject CSS once ──────────────────────────────────────────────────
const STYLE_ID = "friends-page-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
    @keyframes friend-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .friend-card {
      animation: friend-in 0.3s ease-out forwards;
    }
  `;
    document.head.appendChild(s);
}

export default function FriendsPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState<any[]>([]);
    const [incoming, setIncoming] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [respondingId, setRespondingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);

    // ── Load data ────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }

            const [friendsList, requestsList] = await Promise.all([
                getFriends(user.id),
                getIncomingRequests(),
            ]);

            setFriends(friendsList);
            setIncoming(requestsList);
            setLoading(false);
        }
        load();
    }, [router]);

    // ── Accept / Decline ────────────────────────────────────────────
    const handleRespond = async (requestId: number, accept: boolean) => {
        setRespondingId(requestId);
        await respondToFriendRequest(requestId, accept);

        // Remove from incoming
        setIncoming(prev => prev.filter(r => r.id !== requestId));

        // If accepted, refresh friends list
        if (accept) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const updated = await getFriends(user.id);
                setFriends(updated);
            }
        }
        setRespondingId(null);
    };

    // ── Remove friend ──────────────────────────────────────────────
    const handleRemove = async (requestId: number) => {
        setRemovingId(requestId);
        await removeFriend(requestId);
        setFriends(prev => prev.filter(f => f.requestId !== requestId));
        setRemovingId(null);
    };

    // ── Filter ────────────────────────────────────────────────────
    const filteredFriends = searchQuery
        ? friends.filter(f =>
            f.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.zid?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : friends;

    // ── Loading ───────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 text-electric animate-spin" />
                <span className="text-[10px] font-mono text-gray-600 tracking-[0.2em] uppercase">Loading Network...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0B12] text-white pb-24">
            <NavBar />

            <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">

                {/* ── HEADER ── */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-electric/10 border border-electric/30">
                            <Users className="w-5 h-5 text-electric" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter text-electric"
                                style={{ textShadow: '0 0 20px rgba(138,46,255,0.6)' }}>
                                Friends
                            </h1>
                            <p className="text-[10px] text-gray-600 font-mono">
                                {friends.length} connection{friends.length !== 1 ? 's' : ''} · {incoming.length} pending
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── INCOMING REQUESTS ── */}
                {incoming.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <UserPlus className="w-4 h-4 text-magenta" />
                            <h2 className="text-xs font-black text-magenta uppercase tracking-widest">
                                Pending Requests
                            </h2>
                            <span className="text-[9px] bg-magenta/20 text-magenta px-2 py-0.5 rounded-full font-mono font-bold">
                                {incoming.length}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {incoming.map((req: any) => (
                                <div
                                    key={req.id}
                                    className="friend-card flex items-center justify-between p-3 rounded-xl border border-magenta/20 bg-magenta/5 hover:border-magenta/40 transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Link href={`/u/${req.sender?.zid}`} className="flex-shrink-0">
                                            <img
                                                src={getAvatar(req.sender?.zid ?? '', req.sender?.avatar_url)}
                                                className="w-10 h-10 rounded-xl border border-magenta/30"
                                                alt={req.sender?.display_name}
                                            />
                                        </Link>
                                        <div className="min-w-0">
                                            <Link href={`/u/${req.sender?.zid}`} className="text-sm font-black text-white hover:text-magenta transition-colors truncate block">
                                                {req.sender?.display_name}
                                            </Link>
                                            <p className="text-[9px] font-mono text-gray-600 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleRespond(req.id, true)}
                                            disabled={respondingId === req.id}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black bg-lime text-black hover:shadow-[0_0_12px_rgba(180,255,0,0.5)] transition-all disabled:opacity-50"
                                        >
                                            {respondingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleRespond(req.id, false)}
                                            disabled={respondingId === req.id}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                        >
                                            <X className="w-3 h-3" /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── SEARCH ── */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search friends..."
                            className="w-full bg-black/40 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-700 font-mono"
                        />
                    </div>
                </div>

                {/* ── FRIENDS LIST ── */}
                {filteredFriends.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-800 py-16 text-center">
                        <Users className="w-10 h-10 mx-auto mb-3 text-gray-800" />
                        {friends.length === 0 ? (
                            <>
                                <p className="text-sm text-gray-600 font-mono">No friends yet</p>
                                <p className="text-xs text-gray-700 mt-1">Visit someone's profile and hit "Add Friend"</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 font-mono">No matches for "{searchQuery}"</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredFriends.map((friend: any, i: number) => (
                            <div
                                key={friend.requestId}
                                className="friend-card group flex items-center justify-between p-3 rounded-xl border border-gray-800 hover:border-electric/40 bg-black/20 hover:bg-electric/5 transition-all"
                                style={{ animationDelay: `${i * 0.03}s` }}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Link href={`/u/${friend.zid}`} className="flex-shrink-0">
                                        <img
                                            src={getAvatar(friend.zid, friend.avatar_url)}
                                            className="w-10 h-10 rounded-xl border border-gray-800 group-hover:border-electric/30 transition-all"
                                            alt={friend.display_name}
                                        />
                                    </Link>
                                    <div className="min-w-0">
                                        <Link href={`/u/${friend.zid}`} className="text-sm font-black text-white hover:text-electric transition-colors truncate block">
                                            {friend.display_name}
                                        </Link>
                                        <p className="text-[9px] font-mono text-gray-600">{friend.zid}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Link
                                        href={`/u/${friend.zid}`}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-gray-600 hover:text-white border border-gray-800 hover:border-gray-600 transition-all"
                                    >
                                        <ExternalLink className="w-3 h-3" /> Profile
                                    </Link>
                                    <button
                                        onClick={() => handleRemove(friend.requestId)}
                                        disabled={removingId === friend.requestId}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-gray-700 hover:text-red-400 border border-gray-800 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    >
                                        {removingId === friend.requestId
                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                            : <UserX className="w-3 h-3" />
                                        }
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── STATS FOOTER ── */}
                <div className="mt-8 text-center">
                    <p className="text-[9px] font-mono text-gray-700 tracking-[0.2em]">
                        {friends.length} FRIENDS · {incoming.length} PENDING · ZEEZU NETWORK
                    </p>
                </div>
            </div>
        </div>
    );
}
