"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import {
    searchUsers,
    discoverUsers,
    getFriendshipStatus,
    sendFriendRequest,
} from "@/lib/supabase/queries";
import {
    Search, Loader2, Users, UserPlus, UserCheck, Clock,
    MessageSquare, Sparkles, TrendingUp, Globe,
} from "lucide-react";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import { AGENT_IDS } from "@/lib/agents";
import { formatDistanceToNow } from "date-fns";

type UserResult = {
    id: string;
    display_name: string;
    zid: string;
    avatar_url: string | null;
    status_message: string | null;
    created_at: string;
    birth_year?: number | null;
    birth_month?: number | null;
    birth_day?: number | null;
};

type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends" | "loading";

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

// ── Inject CSS ────────────────────────────────────────────────
const STYLE_ID = "search-page-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .user-card { animation: cardIn 0.3s ease-out forwards; }
    @keyframes searchPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(138,46,255,0.3); }
      50% { box-shadow: 0 0 0 8px rgba(138,46,255,0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shimmer-card {
      background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(138,46,255,0.08) 50%, rgba(255,255,255,0.02) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
  `;
    document.head.appendChild(s);
}

export default function SearchPage() {
    const router = useRouter();
    const [myId, setMyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<UserResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Discover
    const [discoverLoading, setDiscoverLoading] = useState(true);
    const [allUsers, setAllUsers] = useState<UserResult[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [page, setPage] = useState(0);

    // Friend statuses cache
    const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendStatus>>({});
    const [addingFriend, setAddingFriend] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ── Init ──────────────────────────────────────────────────────
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }
            setMyId(user.id);

            // Load discover users
            const { users, total } = await discoverUsers(0, 20);
            setAllUsers(users);
            setTotalUsers(total);
            setDiscoverLoading(false);
            setLoading(false);

            // Auto-focus search
            setTimeout(() => inputRef.current?.focus(), 200);
        }
        init();
    }, [router]);

    // ── Fetch friend status for a batch of users ──────────────────
    const fetchFriendStatuses = useCallback(async (users: UserResult[]) => {
        if (!myId) return;
        const statuses: Record<string, FriendStatus> = {};
        await Promise.all(
            users.map(async (u) => {
                if (friendStatuses[u.id]) return; // Already cached
                const result = await getFriendshipStatus(myId, u.id);
                statuses[u.id] = result.status;
            })
        );
        if (Object.keys(statuses).length > 0) {
            setFriendStatuses(prev => ({ ...prev, ...statuses }));
        }
    }, [myId, friendStatuses]);

    // ── Fetch friend statuses when discover loads ─────────────────
    useEffect(() => {
        if (allUsers.length > 0 && myId) {
            fetchFriendStatuses(allUsers);
        }
    }, [allUsers, myId]);

    // ── Search with debounce ──────────────────────────────────────
    const handleSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }
        setSearching(true);
        setHasSearched(true);
        const found = await searchUsers(q);
        setResults(found);
        setSearching(false);
        // Fetch friend statuses for results
        if (myId && found.length > 0) {
            const statuses: Record<string, FriendStatus> = {};
            await Promise.all(
                found.map(async (u: UserResult) => {
                    const result = await getFriendshipStatus(myId, u.id);
                    statuses[u.id] = result.status;
                })
            );
            setFriendStatuses(prev => ({ ...prev, ...statuses }));
        }
    }, [myId]);

    const onQueryChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleSearch(value), 300);
    };

    // ── Load more discover ────────────────────────────────────────
    const loadMore = async () => {
        const nextPage = page + 1;
        setPage(nextPage);
        const { users } = await discoverUsers(nextPage, 20);
        setAllUsers(prev => [...prev, ...users]);
    };

    // ── Add friend ────────────────────────────────────────────────
    const handleAddFriend = async (userId: string) => {
        setAddingFriend(userId);
        await sendFriendRequest(userId);
        setFriendStatuses(prev => ({ ...prev, [userId]: "pending_sent" }));
        setAddingFriend(null);
    };

    // ── Friend status button ──────────────────────────────────────
    const renderFriendButton = (userId: string) => {
        const status = friendStatuses[userId] || "loading";
        if (status === "loading") return null;

        switch (status) {
            case "friends":
                return (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-lime bg-lime/10 border border-lime/30">
                        <UserCheck className="w-3 h-3" /> Friends
                    </span>
                );
            case "pending_sent":
                return (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-400 bg-gray-800 border border-gray-700">
                        <Clock className="w-3 h-3" /> Pending
                    </span>
                );
            case "pending_received":
                return (
                    <Link href="/friends" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-cyan bg-cyan/10 border border-cyan/30 hover:bg-cyan/20 transition-colors">
                        <UserCheck className="w-3 h-3" /> Accept
                    </Link>
                );
            default:
                return (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddFriend(userId); }}
                        disabled={addingFriend === userId}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-electric bg-electric/10 border border-electric/30 hover:bg-electric/20 transition-colors disabled:opacity-50"
                    >
                        {addingFriend === userId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <UserPlus className="w-3 h-3" />
                        )}
                        Add
                    </button>
                );
        }
    };

    // ── User card component ───────────────────────────────────────
    const UserCard = ({ user, index }: { user: UserResult; index: number }) => (
        <Link
            href={`/u/${user.zid}`}
            className="user-card block bg-gray-900/40 border border-gray-800 hover:border-electric/40 rounded-xl p-4 transition-all hover:bg-electric/5 group"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <img
                        src={getAvatar(user.zid, user.avatar_url)}
                        alt={user.display_name}
                        className="w-12 h-12 rounded-xl border border-gray-700 group-hover:border-electric/50 transition-colors bg-gray-800"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B0B12] bg-lime" style={{ boxShadow: "0 0 6px #B4FF00" }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white group-hover:text-electric transition-colors truncate">
                            {user.display_name}
                        </h3>
                        <span className="text-[9px] font-mono text-gray-600 flex-shrink-0">{user.zid}</span>
                        {(() => {
                            const gen = getGeneration(user.birth_year, user.birth_month, user.birth_day, AGENT_IDS.has(user.id ?? ''));
                            return gen ? <GenBadge gen={gen} size="sm" /> : null;
                        })()}
                    </div>
                    {user.status_message && (
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{user.status_message}</p>
                    )}
                    <p className="text-[9px] text-gray-700 font-mono mt-1">
                        Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {renderFriendButton(user.id)}
                    <Link
                        href={`/messages/${user.id}`}
                        onClick={e => e.stopPropagation()}
                        className="p-2 rounded-lg text-gray-600 hover:text-cyan hover:bg-cyan/10 border border-transparent hover:border-cyan/30 transition-all"
                        title="Message"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </Link>
    );

    // ── Loading ───────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#0B0B12]">
            <NavBar />
            <div className="flex items-center justify-center" style={{ height: "calc(100vh - 64px)" }}>
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-7 h-7 text-electric animate-spin" />
                    <span className="text-[10px] font-mono text-gray-600 tracking-[0.2em] uppercase">
                        Scanning Network...
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0B12] pb-20 md:pb-0">
            <NavBar />

            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* ── HEADER ── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-electric/10 border border-electric/20 mb-3">
                        <Globe className="w-3.5 h-3.5 text-electric" />
                        <span className="text-[10px] font-mono text-electric uppercase tracking-wider">Network Explorer</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                        Discover <span className="bg-gradient-to-r from-electric to-cyan bg-clip-text text-transparent">People</span>
                    </h1>
                    <p className="text-xs text-gray-600 mt-2 font-mono">
                        {totalUsers} souls connected to the grid
                    </p>
                </div>

                {/* ── SEARCH BAR ── */}
                <div className="relative mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => onQueryChange(e.target.value)}
                            placeholder="Search by name or ZID..."
                            className="w-full bg-gray-900/60 border-2 border-gray-800 hover:border-gray-600 focus:border-electric rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none transition-all placeholder:text-gray-700"
                            style={{
                                boxShadow: query ? "0 0 24px rgba(138,46,255,0.15)" : "none",
                            }}
                        />
                        {searching && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-electric animate-spin" />
                        )}
                    </div>
                </div>

                {/* ── SEARCH RESULTS ── */}
                {hasSearched && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-electric" />
                            <h2 className="text-xs font-black text-white uppercase tracking-wider">
                                Results
                            </h2>
                            {!searching && (
                                <span className="text-[9px] font-mono text-gray-600 ml-auto">
                                    {results.length} found
                                </span>
                            )}
                        </div>

                        {searching ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="shimmer-card h-20 rounded-xl border border-gray-800" />
                                ))}
                            </div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-10 bg-gray-900/30 rounded-xl border border-gray-800">
                                <Search className="w-8 h-8 mx-auto mb-3 text-gray-800" />
                                <p className="text-xs text-gray-600 font-mono">No users found for &quot;{query}&quot;</p>
                                <p className="text-[10px] text-gray-700 mt-1">Try a different name or ZID</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {results.map((user, i) => (
                                    <UserCard key={user.id} user={user} index={i} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── DISCOVER SECTION ── */}
                {!hasSearched && (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-cyan" />
                            <h2 className="text-xs font-black text-white uppercase tracking-wider">
                                Everyone on the Grid
                            </h2>
                            <span className="text-[9px] font-mono text-gray-600 ml-auto">
                                {totalUsers} total
                            </span>
                        </div>

                        {discoverLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="shimmer-card h-20 rounded-xl border border-gray-800" />
                                ))}
                            </div>
                        ) : allUsers.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800">
                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-800" />
                                <p className="text-sm text-gray-600">No one here yet.</p>
                                <p className="text-[10px] text-gray-700 mt-1">You&apos;re the first on the grid 🎉</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    {allUsers.map((user, i) => (
                                        <UserCard key={user.id} user={user} index={i} />
                                    ))}
                                </div>

                                {/* Load more */}
                                {allUsers.length < totalUsers && (
                                    <button
                                        onClick={loadMore}
                                        className="w-full mt-4 py-3 text-xs font-mono text-gray-500 hover:text-electric border border-dashed border-gray-800 hover:border-electric/40 rounded-xl transition-all hover:bg-electric/5"
                                    >
                                        LOAD MORE ({totalUsers - allUsers.length} remaining)
                                    </button>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
