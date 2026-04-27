"use client";

import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { toggleZap, getMyZaps } from "@/lib/supabase/queries";
import {
    Zap, MessageSquare, Send, Trash2, Globe, Users,
    Radio, Plus, Pin, XCircle, Palette, Share2,
    ArrowUp, ArrowDown, ChevronDown, ChevronUp, Hash, Reply, CornerDownRight,
    Image as ImageIcon, BarChart3, Flame, Clock, Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import GifPicker from "@/components/GifPicker";
import PollCreator, { type PollData } from "@/components/PollCreator";
import PollDisplay from "@/components/PollDisplay";
import EmbedPreview, { stripEmbedUrls } from "@/components/EmbedPreview";
import { confirmModal } from "@/components/ConfirmModal";
import ShareSheet from "@/components/ShareSheet";
import PostSkeleton from "@/components/PostSkeleton";
import AvatarWithGenRing from "@/components/AvatarWithGenRing";
import AnthemMiniPlayer from "@/components/AnthemMiniPlayer";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import { AGENT_IDS } from "@/lib/agents";

// ── TYPES ────────────────────────────────────────────────
type Post = {
    id: number;
    content: string;
    zaps: number;
    created_at: string;
    owner_id: string;
    topic_id: number;
    gif_url?: string | null;
    poll_data?: { options: string[] } | null;
    author: {
        id: string;
        display_name: string;
        zid: string;
        avatar_url?: string | null;
        birth_year?: number | null;
        birth_month?: number | null;
        birth_day?: number | null;
        online_status?: "online" | "away" | "busy" | "offline" | null;
    } | null;
};

type Topic = { id: number; title: string; description: string; is_pinned: boolean; created_by: string };

type CommentRaw = {
    id: number;
    content: string;
    author: { id: string; display_name: string; zid: string };
    upvotes: number;
    downvotes: number;
    created_at: string;
    parent_id: number | null;
};

type FeedMode = "all" | "friends";

type ActivityEvent = {
    id: string;
    event_type: "zap" | "comment" | "reply" | "core8_change" | "zlog_published" | "zone_created" | "zone_post" | "vibes_rated" | "anthem_stolen";
    actor_id: string;
    actor: { display_name: string; zid: string; avatar_url?: string | null; birth_year?: number | null; birth_month?: number | null; birth_day?: number | null; } | null;
    target_user_id?: string | null;
    target_user?: { id: string; display_name: string; zid: string; theme_track_url?: string | null; theme_track_title?: string | null; theme_track_artist?: string | null; } | null;
    reference_id?: string | null;
    meta: Record<string, any>;
    created_at: string;
};

type GroupedActivityEvent = {
    id: string;
    event_type: ActivityEvent["event_type"];
    actors: ActivityEvent["actor"][];
    target_user: ActivityEvent["target_user"];
    reference_id: ActivityEvent["reference_id"];
    meta: Record<string, any>;
    created_at: string;
    count: number;
};

type FeedItem = { kind: "post"; data: Post } | { kind: "activity"; data: GroupedActivityEvent };

// ── PURE HELPERS — defined outside component, never recreated ────────────────
const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

function formatTime(date: string) {
    const diffMin = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`;
    return formatDistanceToNow(new Date(date), { addSuffix: false });
}

function parseMood(content: string): { mood: string | null; text: string } {
    const m = content.match(/^\[mood: (.+?)\]\n/);
    return m ? { mood: m[1], text: content.replace(m[0], "") } : { mood: null, text: content };
}

const MOOD_MAP: Record<string, { bg: string; border: string; text: string }> = {
    "⚡ Wired":       { bg: "linear-gradient(135deg, rgba(255,45,135,0.15), rgba(168,85,247,0.08))",   border: "rgba(255,45,135,0.25)",  text: "#a855f7" },
    "🔥 On Fire":     { bg: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.08))",    border: "rgba(249,115,22,0.25)",  text: "#f97316" },
    "💭 Thinking":    { bg: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))",   border: "rgba(99,102,241,0.25)",  text: "#818cf8" },
    "🎵 Vibing":      { bg: "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(6,182,212,0.08))",    border: "rgba(20,184,166,0.25)",  text: "#2dd4bf" },
    "🌙 Late Night":  { bg: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.08))",   border: "rgba(59,130,246,0.25)",  text: "#60a5fa" },
    "☕ Caffeinated": { bg: "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(245,158,11,0.08))",    border: "rgba(217,119,6,0.25)",   text: "#fbbf24" },
    "🚀 Grinding":    { bg: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.08))",   border: "rgba(16,185,129,0.25)",  text: "#34d399" },
    "💀 Dead":        { bg: "linear-gradient(135deg, rgba(244,63,94,0.15), rgba(251,113,133,0.08))",   border: "rgba(244,63,94,0.25)",   text: "#fb7185" },
};

function getMoodStyle(mood: string) {
    if (MOOD_MAP[mood]) return MOOD_MAP[mood];
    const colors = Object.values(MOOD_MAP);
    let hash = 0;
    for (let i = 0; i < mood.length; i++) hash = mood.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function getThreaded(postComments: CommentRaw[]) {
    const topLevel = postComments.filter(c => !c.parent_id);
    const replyMap: Record<number, CommentRaw[]> = {};
    postComments.filter(c => c.parent_id).forEach(c => {
        if (!replyMap[c.parent_id!]) replyMap[c.parent_id!] = [];
        replyMap[c.parent_id!].push(c);
    });
    return { topLevel, replyMap };
}

// ── CSS — injected once at module level ──────────────────
const FEED_STYLE_ID = "global-feed-v5-styles";
if (typeof document !== "undefined" && !document.getElementById(FEED_STYLE_ID)) {
    const s = document.createElement("style");
    s.id = FEED_STYLE_ID;
    s.textContent = `
    @keyframes feedSlideIn { from { opacity:0; transform:translateY(10px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
    .feed-post-card { animation: feedSlideIn 0.35s ease-out forwards; }
    @keyframes zapPop { 0%{transform:scale(1)} 40%{transform:scale(1.4) rotate(-8deg)} 70%{transform:scale(0.9) rotate(4deg)} 100%{transform:scale(1) rotate(0deg)} }
    .zap-pop { animation: zapPop 0.4s cubic-bezier(0.68,-0.55,0.27,1.55); }
    @keyframes newGlow { 0%{box-shadow:0 0 0 0 rgba(255,45,135,0.5)} 50%{box-shadow:0 0 20px 4px rgba(255,45,135,0.15)} 100%{box-shadow:0 0 0 0 rgba(255,45,135,0)} }
    .new-glow { animation: newGlow 2s ease-out; }
    @keyframes broadcastPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
    .broadcast-pulse { animation: broadcastPulse 2s infinite; }
    .post-card-hover:hover { border-color:rgba(255,45,135,0.2); background:rgba(255,45,135,0.02); }
    @keyframes commentSlide { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    .comment-enter { animation: commentSlide 0.2s ease-out forwards; }
    @keyframes replySlide { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
    .reply-enter { animation: replySlide 0.15s ease-out forwards; }
    .topic-scroll::-webkit-scrollbar { height:3px; }
    .topic-scroll::-webkit-scrollbar-track { background:transparent; }
    .topic-scroll::-webkit-scrollbar-thumb { background:rgba(255,45,135,0.3); border-radius:10px; }
    @keyframes moodFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
    .mood-tag { animation: moodFloat 3s ease-in-out infinite; }
    .share-check { animation: zapPop 0.3s cubic-bezier(0.68,-0.55,0.27,1.55); }
    .thread-line { position:relative; }
    .thread-line::before { content:''; position:absolute; left:11px; top:28px; bottom:0; width:1.5px; background:linear-gradient(180deg,rgba(0,247,255,0.15),transparent); border-radius:1px; transition: all 0.3s ease; }
    .thread-container:hover .thread-line::before { background:linear-gradient(180deg,rgba(0,229,255,0.9),transparent); box-shadow: 0 0 12px rgba(0,229,255,0.7); }
  `;
    document.head.appendChild(s);
}

// ── ACTIVITY CARD ────────────────────────────────────────────────────────────
const ACTIVITY_COLORS: Record<string, string> = {
    zap: "#B4FF00",
    comment: "#00F7FF",
    reply: "#00F7FF",
    core8_change: "#8A2EFF",
    zlog_published: "#FF007A",
    zone_created: "#8A2EFF",
    zone_post: "#00F7FF",
    vibes_rated: "#FF007A",
    anthem_stolen: "#FF6B35",
};


const ActivityCard = memo(function ActivityCard({ event, viewerId }: { event: GroupedActivityEvent; viewerId?: string }) {
    const actors = event.actors.filter(Boolean);
    const firstActor = actors[0];
    const target = event.target_user;
    const meta = event.meta || {};
    const color = ACTIVITY_COLORS[event.event_type] || "#8A2EFF";

    const actorsLabel = () => {
        if (actors.length === 0) return "Someone";
        if (actors.length === 1) return firstActor!.display_name;
        if (actors.length === 2) return `${actors[0]!.display_name} & ${actors[1]!.display_name}`;
        return `${actors[0]!.display_name} & ${actors.length - 1} others`;
    };

    const targetLink = target
        ? <Link href={`/u/${target.zid}`} className="font-black text-white hover:text-electric transition-colors">{target.display_name}</Link>
        : null;

    const actionPhrase = (): React.ReactNode => {
        switch (event.event_type) {
            case "zap": return target ? <><span className="text-gray-500">zapped </span>{targetLink}<span className="text-gray-500">&apos;s post</span></> : <span className="text-gray-500">zapped a post</span>;
            case "comment": return target ? <><span className="text-gray-500">commented on </span>{targetLink}<span className="text-gray-500">&apos;s post</span></> : <span className="text-gray-500">commented on a post</span>;
            case "reply": return target ? <><span className="text-gray-500">replied in a thread on </span>{targetLink}<span className="text-gray-500">&apos;s post</span></> : <span className="text-gray-500">replied in a thread</span>;
            case "core8_change": return target ? <><span className="text-gray-500">added </span>{targetLink}<span className="text-gray-500"> to their Core 8</span></> : <span className="text-gray-500">updated their Core 8</span>;
            case "zlog_published": return <span className="text-gray-500">published a Zlog{meta.title ? ` · "${meta.title}"` : ""}</span>;
            case "zone_created": return <span className="text-gray-500">started a new Zone{meta.zone_name ? ` · #${meta.zone_name}` : ""}</span>;
            case "zone_post": return <span className="text-gray-500">posted in {meta.zone_name ? `#${meta.zone_name}` : "a zone"}</span>;
            case "vibes_rated": return target ? <><span className="text-gray-500">rated </span>{targetLink}<span className="text-gray-500">&apos;s Vibes</span></> : <span className="text-gray-500">rated someone&apos;s Vibes</span>;
            case "anthem_stolen": return target ? <><span className="text-gray-500">stole </span>{targetLink}<span className="text-gray-500">&apos;s anthem</span></> : <span className="text-gray-500">stole an anthem</span>;
            default: return <span className="text-gray-500">was active</span>;
        }
    };

    const snippet = event.event_type === "comment" || event.event_type === "reply"
        ? meta.comment_snippet
        : event.event_type === "zap" || event.event_type === "zone_post"
            ? meta.post_snippet
            : null;

    const refLink = (() => {
        if (!event.reference_id) return null;
        if (event.event_type === "zlog_published" && meta.slug) return `/zlogger/${meta.slug}`;
        if (event.event_type === "zone_created" && meta.zone_slug) return `/zones/${meta.zone_slug}`;
        if (event.event_type === "zone_post" && meta.zone_slug) return `/zones/${meta.zone_slug}`;
        if (["zap", "comment", "reply"].includes(event.event_type)) return `/post/${event.reference_id}`;
        return null;
    })();

    return (
        <div
            className="px-4 py-3 transition-colors hover:bg-white/[0.02]"
            style={{ background: `${color}05`, borderLeft: `3px solid ${color}35` }}
        >
            <div className="flex gap-3 items-start">
                {/* Avatar stack with gen rings */}
                <div className="flex-shrink-0 flex" style={{ minWidth: 36 }}>
                    {actors.slice(0, 2).map((a, i) => (
                        <AvatarWithGenRing
                            key={i}
                            src={a?.avatar_url}
                            zid={a?.zid || "?"}
                            size={i === 0 ? 36 : 28}
                            birthYear={a?.birth_year}
                            birthMonth={a?.birth_month}
                            birthDay={a?.birth_day}
                            isAgent={false}
                            shape="rounded"
                            showTab={i === 0}
                            href={a ? `/u/${a.zid}` : undefined}
                            style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 2 - i, marginTop: i > 0 ? 4 : 0 }}
                        />
                    ))}
                    {actors.length > 2 && (
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}20`, border: `1.5px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -6, marginTop: 7, zIndex: 0, position: "relative" }}>
                            <span style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 700, color }}>+{actors.length - 2}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] leading-snug">
                                {firstActor ? (
                                    <Link href={`/u/${firstActor.zid}`} className="font-black text-white hover:text-electric transition-colors">
                                        {actorsLabel()}
                                    </Link>
                                ) : (
                                    <span className="font-black text-gray-400">{actorsLabel()}</span>
                                )}
                                {" "}
                                {actionPhrase()}
                            </p>
                            {snippet && (
                                <p className="text-[10px] text-gray-600 font-mono mt-1 truncate">&ldquo;{snippet}&rdquo;</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[9px] font-mono text-gray-700">{formatTime(event.created_at)}</span>
                                {refLink && (
                                    <Link href={refLink} className="text-[9px] font-mono font-bold hover:underline" style={{ color }}>
                                        VIEW →
                                    </Link>
                                )}
                            </div>
                            {event.event_type === "anthem_stolen" && target?.theme_track_url && (
                                <div className="mt-2">
                                    <AnthemMiniPlayer
                                        trackUrl={target.theme_track_url}
                                        trackTitle={target.theme_track_title ?? null}
                                        trackArtist={target.theme_track_artist ?? null}
                                        fromUserId={target.id}
                                        fromDisplayName={target.display_name}
                                        viewerId={viewerId}
                                        primary="#FF6B35"
                                    />
                                </div>
                            )}
                        </div>
                        {/* Small event icon — same as before */}
                        <div className="flex-shrink-0 self-start mt-0.5 w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${color}12` }}>
                            {event.event_type === "zap" && <Zap className="w-2.5 h-2.5" style={{ color }} />}
                            {(event.event_type === "comment" || event.event_type === "reply") && <MessageSquare className="w-2.5 h-2.5" style={{ color }} />}
                            {event.event_type === "core8_change" && <Users className="w-2.5 h-2.5" style={{ color }} />}
                            {event.event_type === "zlog_published" && <Hash className="w-2.5 h-2.5" style={{ color }} />}
                            {event.event_type === "zone_created" && <Hash className="w-2.5 h-2.5" style={{ color }} />}
                            {event.event_type === "zone_post" && <Hash className="w-2.5 h-2.5" style={{ color }} />}
                            {event.event_type === "vibes_rated" && <Zap className="w-2.5 h-2.5" style={{ color }} />}
                            {event.event_type === "anthem_stolen" && <Radio className="w-2.5 h-2.5" style={{ color }} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// ── POST CARD — memoized: only re-renders when its own slice of state changes ─
interface PostCardProps {
    post: Post;
    idx: number;
    isNew: boolean;
    isZapped: boolean;
    isZapping: boolean;
    isExpanded: boolean;
    isSinglePostView: boolean;
    commentCount: number;
    postComments: CommentRaw[];
    myCommentText: string;
    currentReply: { commentId: number; name: string } | null;
    isPostingComment: boolean;
    expandedReplies: Set<number>;
    myVotes: Map<number, "up" | "down">;
    activeTopic: number | null;
    topics: Topic[];
    userId: string;
    userZid?: string;
    wallOwnerId?: string;
    commentInputRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
    onZap: (pid: number) => void;
    onDelete: (pid: number) => void;
    onShare: (post: Post) => void;
    onToggleComment: (postId: number) => void;
    onPostComment: (postId: number) => void;
    onReplyToComment: (postId: number, commentId: number, name: string) => void;
    onCancelReply: (postId: number) => void;
    onToggleReplies: (commentId: number) => void;
    onVote: (cid: number, type: "up" | "down", postId: number) => void;
    onSetActiveTopic: (id: number) => void;
    onChangeComment: (postId: number, val: string) => void;
}

const PostCard = memo(function PostCard({
    post, idx, isNew, isZapped, isZapping, isExpanded, isSinglePostView, commentCount, postComments,
    myCommentText, currentReply, isPostingComment, expandedReplies, myVotes,
    activeTopic, topics, userId, userZid, wallOwnerId, commentInputRefs,
    onZap, onDelete, onShare, onToggleComment, onPostComment,
    onReplyToComment, onCancelReply, onToggleReplies, onVote, onSetActiveTopic, onChangeComment,
}: PostCardProps) {
    const postTopic = topics.find(t => t.id === post.topic_id);
    const { mood, text: postText } = parseMood(post.content);
    const { topLevel, replyMap } = getThreaded(postComments);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--m-x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--m-y", `${e.clientY - rect.top}px`);
    };

    return (
        <div className={`feed-post-card post-card-hover group relative transition-all ${isNew ? "new-glow" : ""}`}
            onMouseMove={handleMouseMove}
            style={{ animationDelay: `${Math.min(idx * 30, 300)}ms`, animationFillMode: "both" }}>
            
            {/* Phase 3: Magnetic Hover Effect */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
                 style={{ background: "radial-gradient(400px circle at var(--m-x, 50%) var(--m-y, 50%), rgba(0,229,255,0.06), transparent 40%)" }} />

            {/* Phase 2: Sticky Context Header for Single Posts */}
            <div className={`px-4 py-3.5 relative z-10 transition-all ${isSinglePostView ? "sticky top-0 bg-[#0a0d14]/90 backdrop-blur-xl border-b border-gray-800/60 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20" : ""}`}>
                <div className="flex gap-3">
                    <AvatarWithGenRing
                        src={post.author?.avatar_url}
                        zid={post.author?.zid || "?"}
                        size={40}
                        birthYear={post.author?.birth_year}
                        birthMonth={post.author?.birth_month}
                        birthDay={post.author?.birth_day}
                        isAgent={AGENT_IDS.has(post.author?.id ?? "") || !!(post.author as any)?.agent_state}
                        shape="rounded"
                        href={`/u/${post.author?.zid || "unknown"}`}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <Link href={`/u/${post.author?.zid || ""}`} className="font-black text-[13px] text-white hover:text-electric transition-colors">{post.author?.display_name || "Unknown"}</Link>
                            <span className="text-[9px] font-mono text-gray-700">{post.author?.zid}</span>
                            {(() => { const isAgent = AGENT_IDS.has(post.author?.id ?? '') || !!(post.author as any)?.agent_state; const gen = getGeneration(post.author?.birth_year, post.author?.birth_month, post.author?.birth_day, isAgent); return (gen && isAgent) ? <GenBadge gen={gen} size="sm" /> : null; })()}
                            {postTopic && activeTopic === null && !wallOwnerId && (
                                <button onClick={() => onSetActiveTopic(postTopic.id)} className="text-[8px] font-mono text-cyan/60 hover:text-cyan bg-cyan/5 px-1.5 py-0.5 rounded">
                                    #{postTopic.title.toLowerCase()}
                                </button>
                            )}
                            <span className="text-[9px] text-gray-800">·</span>
                            <span className="text-[9px] text-gray-600 font-mono">{formatTime(post.created_at)}</span>
                            {isNew && <span className="text-[7px] font-black text-electric bg-electric/10 px-1.5 py-0.5 rounded-sm tracking-wider">NEW</span>}
                        </div>
                        {mood && (
                            <div className="mb-1.5">
                                <span className="mood-tag inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono"
                                    style={{ background: getMoodStyle(mood).bg, borderWidth: 1, borderStyle: "solid", borderColor: getMoodStyle(mood).border, color: getMoodStyle(mood).text }}>
                                    <Palette className="w-2.5 h-2.5" /> {mood}
                                </span>
                            </div>
                        )}
                        <p className="text-[13px] text-gray-200 leading-[1.6] whitespace-pre-wrap break-words mb-2.5">{stripEmbedUrls(postText)}</p>
                        <EmbedPreview content={postText} />
                        {post.gif_url && (
                            <div className="mb-2.5">
                                <img src={post.gif_url} alt="GIF" className="max-w-full max-h-[280px] rounded-lg border border-gray-800/40 object-contain" loading="lazy" />
                                <span className="text-[7px] font-mono text-gray-800 mt-0.5 inline-block">via GIPHY</span>
                            </div>
                        )}
                        {post.poll_data?.options && (
                            <PollDisplay postId={post.id} options={post.poll_data.options} userId={userId} />
                        )}
                        <div className="flex items-center gap-1">
                            <button onClick={() => onZap(post.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all border ${isZapped ? "text-lime bg-lime/10 border-lime/30" : "text-gray-600 border-transparent hover:text-lime hover:bg-lime/5 hover:border-lime/20"}`}>
                                <Zap className={`w-3.5 h-3.5 ${isZapped ? "fill-lime" : ""} ${isZapping ? "zap-pop" : ""}`} />
                                <span className="font-bold">{post.zaps}</span>
                            </button>
                            <button onClick={() => onToggleComment(post.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all border ${isExpanded ? "text-cyan bg-cyan/10 border-cyan/30" : "text-gray-600 border-transparent hover:text-cyan hover:bg-cyan/5 hover:border-cyan/20"}`}>
                                <MessageSquare className="w-3.5 h-3.5" /><span>{commentCount}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <button onClick={() => onShare(post)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all text-gray-700 hover:text-electric hover:bg-electric/5">
                                <Share2 className="w-3 h-3" />
                            </button>
                            {post.owner_id === userId && (
                                <button onClick={() => onDelete(post.id)} className="flex items-center px-2 py-1 rounded-lg text-gray-800 hover:text-red-500 hover:bg-red-500/5 transition-all ml-auto">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── THREADED COMMENTS ── */}
            {isExpanded && (
                <div className="bg-black/20 border-t border-gray-800/30 px-4 py-3">
                    <div className="ml-12 space-y-0">
                        {topLevel.length === 0 && <p className="text-[10px] text-gray-700 font-mono py-2">No replies yet — be the first</p>}

                        {topLevel.map((c, ci) => {
                            const netScore = c.upvotes - c.downvotes;
                            const replies = replyMap[c.id] || [];
                            const showReplies = expandedReplies.has(c.id);

                            return (
                                <div key={c.id} id={`comment-${c.id}`} className="comment-enter mb-2 thread-container" style={{ animationDelay: `${ci * 40}ms` }}>
                                    <div className={`flex gap-2 ${replies.length > 0 ? "thread-line" : ""}`}>
                                        <img src={getAvatar(c.author.zid)} alt="" className="w-6 h-6 rounded-md border border-gray-800 bg-gray-900 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-800/40">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/u/${c.author.zid}`} className="text-[11px] font-bold text-white hover:text-electric transition-colors">{c.author.display_name}</Link>
                                                    <span className="text-[8px] font-mono text-gray-700">{formatTime(c.created_at)}</span>
                                                    <div className="flex items-center gap-0.5 ml-auto">
                                                        <button onClick={() => onVote(c.id, "up", post.id)}
                                                            className={`p-0.5 rounded transition-all ${myVotes.get(c.id) === "up" ? "bg-green-500/20 ring-1 ring-green-500/30" : "hover:bg-green-500/10"}`}>
                                                            <ArrowUp className={`w-3 h-3 ${myVotes.get(c.id) === "up" ? "text-green-400" : "text-green-600/50 hover:text-green-400"}`} />
                                                        </button>
                                                        <span className={`text-[9px] font-mono font-bold min-w-[14px] text-center ${netScore > 0 ? "text-green-500/80" : netScore < 0 ? "text-red-500/80" : "text-gray-600"}`}>
                                                            {netScore > 0 ? `+${netScore}` : netScore}
                                                        </span>
                                                        <button onClick={() => onVote(c.id, "down", post.id)}
                                                            className={`p-0.5 rounded transition-all ${myVotes.get(c.id) === "down" ? "bg-red-500/20 ring-1 ring-red-500/30" : "hover:bg-red-500/10"}`}>
                                                            <ArrowDown className={`w-3 h-3 ${myVotes.get(c.id) === "down" ? "text-red-400" : "text-red-600/50 hover:text-red-400"}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-[12px] text-gray-300 leading-relaxed whitespace-pre-wrap mt-0.5">{c.content}</p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 ml-2">
                                                <button onClick={() => onReplyToComment(post.id, c.id, c.author.display_name)}
                                                    className="flex items-center gap-1 text-[9px] font-mono text-gray-700 hover:text-cyan transition-colors">
                                                    <Reply className="w-2.5 h-2.5" /> Reply
                                                </button>
                                                {replies.length > 0 && (
                                                    <button onClick={() => onToggleReplies(c.id)}
                                                        className="flex items-center gap-1 text-[9px] font-mono text-cyan/60 hover:text-cyan transition-colors">
                                                        <CornerDownRight className="w-2.5 h-2.5" />
                                                        {showReplies ? "Hide" : "View"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
                                                        {showReplies ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {showReplies && replies.length > 0 && (
                                        <div className="ml-8 mt-1 space-y-1.5 pl-3 border-l-[1.5px] border-cyan/15">
                                            {replies.map((r, ri) => {
                                                const rNet = r.upvotes - r.downvotes;
                                                return (
                                                    <div key={r.id} id={`comment-${r.id}`} className="reply-enter flex gap-2" style={{ animationDelay: `${ri * 30}ms` }}>
                                                        <img src={getAvatar(r.author.zid)} alt="" className="w-5 h-5 rounded-md border border-gray-800 bg-gray-900 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="bg-gray-900/30 rounded-lg px-2.5 py-1.5 border border-gray-800/30">
                                                                <div className="flex items-center gap-2">
                                                                    <Link href={`/u/${r.author.zid}`} className="text-[10px] font-bold text-white hover:text-electric transition-colors">{r.author.display_name}</Link>
                                                                    <span className="text-[7px] font-mono text-gray-700">{formatTime(r.created_at)}</span>
                                                                    <div className="flex items-center gap-0.5 ml-auto">
                                                                        <button onClick={() => onVote(r.id, "up", post.id)}
                                                                            className={`p-0.5 rounded transition-all ${myVotes.get(r.id) === "up" ? "bg-green-500/20 ring-1 ring-green-500/30" : "hover:bg-green-500/10"}`}>
                                                                            <ArrowUp className={`w-2.5 h-2.5 ${myVotes.get(r.id) === "up" ? "text-green-400" : "text-green-600/40 hover:text-green-400"}`} />
                                                                        </button>
                                                                        <span className={`text-[8px] font-mono font-bold min-w-[12px] text-center ${rNet > 0 ? "text-green-500/70" : rNet < 0 ? "text-red-500/70" : "text-gray-700"}`}>
                                                                            {rNet > 0 ? `+${rNet}` : rNet}
                                                                        </span>
                                                                        <button onClick={() => onVote(r.id, "down", post.id)}
                                                                            className={`p-0.5 rounded transition-all ${myVotes.get(r.id) === "down" ? "bg-red-500/20 ring-1 ring-red-500/30" : "hover:bg-red-500/10"}`}>
                                                                            <ArrowDown className={`w-2.5 h-2.5 ${myVotes.get(r.id) === "down" ? "text-red-400" : "text-red-600/40 hover:text-red-400"}`} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap mt-0.5">{r.content}</p>
                                                            </div>
                                                            <button onClick={() => onReplyToComment(post.id, c.id, r.author.display_name)}
                                                                className="flex items-center gap-1 mt-0.5 ml-2 text-[8px] font-mono text-gray-700 hover:text-cyan transition-colors">
                                                                <Reply className="w-2 h-2" /> Reply
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Comment input */}
                        <div className="mt-3 pt-2 border-t border-gray-800/30">
                            {currentReply && (
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <CornerDownRight className="w-3 h-3 text-cyan/60" />
                                    <span className="text-[9px] font-mono text-cyan/60">
                                        Replying to <span className="text-cyan font-bold">{currentReply.name}</span>
                                    </span>
                                    <button onClick={() => onCancelReply(post.id)} className="text-gray-700 hover:text-white transition-colors">
                                        <XCircle className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <img src={getAvatar(userZid || userId)} alt="" className="w-6 h-6 rounded-md border border-gray-800 flex-shrink-0" />
                                <input
                                    ref={(el) => { commentInputRefs.current[post.id] = el; }}
                                    type="text"
                                    value={myCommentText}
                                    onChange={e => onChangeComment(post.id, e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") onPostComment(post.id); }}
                                    placeholder={currentReply ? `Reply to ${currentReply.name}...` : "Write a reply..."}
                                    className="flex-1 bg-gray-900/40 border border-gray-800/60 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-gray-700 outline-none focus:border-cyan/40 transition-colors"
                                />
                                <button onClick={() => onPostComment(post.id)}
                                    disabled={!myCommentText.trim() || isPostingComment}
                                    className="p-1.5 rounded-lg text-gray-600 hover:text-cyan hover:bg-cyan/10 transition-all disabled:opacity-30">
                                    {isPostingComment ? <div className="w-3.5 h-3.5 animate-spin border-2 border-cyan border-t-transparent rounded-full" /> : <Send className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

// ── GLOBAL FEED ──────────────────────────────────────────
export default function GlobalFeed({ userId, userZid, wallOwnerId, hideComposer, zoneId, zoneName, singlePostId, targetActorZid, targetAction }: {
    userId: string; userZid?: string; wallOwnerId?: string; hideComposer?: boolean; zoneId?: string; zoneName?: string; singlePostId?: number; targetActorZid?: string; targetAction?: string;
}) {
    const [mode, setMode] = useState<FeedMode>("all");
    const [hasNewActivity, setHasNewActivity] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [newPostText, setNewPostText] = useState("");
    const [myZaps, setMyZaps] = useState<Set<number>>(new Set());
    const [zappingPost, setZappingPost] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [newPostIds, setNewPostIds] = useState<Set<number>>(new Set());
    const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
    const [sharingPost, setSharingPost] = useState<Post | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const LIMIT = 15;
    const [sortMode, setSortMode] = useState<"new" | "top">("new");

    const [moodText, setMoodText] = useState("");
    const QUICK_MOODS = ["⚡ Wired", "🔥 On Fire", "💭 Thinking", "🎵 Vibing", "🌙 Late Night", "☕ Caffeinated", "🚀 Grinding", "💀 Dead"];

    const [attachedGif, setAttachedGif] = useState<string | null>(null);
    const [attachedPoll, setAttachedPoll] = useState<PollData | null>(null);
    const [activePanel, setActivePanel] = useState<"mood" | "gif" | "poll" | null>(null);

    const [topics, setTopics] = useState<Topic[]>([]);
    const [activeTopic, setActiveTopic] = useState<number | null>(null);
    const [showNewTopic, setShowNewTopic] = useState(false);
    const [newTopicTitle, setNewTopicTitle] = useState("");

    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
    const [comments, setComments] = useState<Record<number, CommentRaw[]>>({});
    const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
    const [newComment, setNewComment] = useState<Record<number, string>>({});
    const [postingComment, setPostingComment] = useState<number | null>(null);
    const [replyingTo, setReplyingTo] = useState<Record<number, { commentId: number; name: string } | null>>({});
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
    const commentInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const [myVotes, setMyVotes] = useState<Map<number, "up" | "down">>(new Map());
    const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
    const [composerExpanded, setComposerExpanded] = useState(false);

    const notifiedZaps = useRef<Set<number>>(new Set());
    const notifiedVotes = useRef<Set<string>>(new Set());

    // Refs so stable callbacks can read current state without stale closures
    const myZapsRef = useRef(myZaps);
    myZapsRef.current = myZaps;
    const postsRef = useRef(posts);
    postsRef.current = posts;
    const myVotesRef = useRef(myVotes);
    myVotesRef.current = myVotes;
    const commentsRef = useRef(comments);
    commentsRef.current = comments;
    const newCommentRef = useRef(newComment);
    newCommentRef.current = newComment;
    const replyingToRef = useRef(replyingTo);
    replyingToRef.current = replyingTo;

    // ── Fetch topics ─────────────────────────────────────
    useEffect(() => {
        (async () => {
            const { data } = await supabase.from("topics").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
            if (data) setTopics(data);
        })();
    }, []);

    // ── Fetch posts ──────────────────────────────────────
    const fetchPosts = useCallback(async (pageNum: number, feedMode: FeedMode, topicId: number | null, sort: "new" | "top" = "new") => {
        setLoading(true);
        const from = pageNum * LIMIT;
        const to = from + LIMIT - 1;
        let query = supabase.from("zeewall")
            .select("id, content, zaps, created_at, owner_id, topic_id, gif_url, poll_data, author:users!author_id(id, display_name, zid, avatar_url, birth_year, birth_month, birth_day, online_status, agent_state(agent_id))");
        if (sort === "top") query = query.order("zaps", { ascending: false }).order("created_at", { ascending: false });
        else query = query.order("created_at", { ascending: false });
        query = query.range(from, to);
        if (singlePostId) {
            query = query.eq("id", singlePostId);
        } else if (zoneId) {
            query = query.eq("zone_id", zoneId);
        } else if (wallOwnerId) {
            query = query.eq("owner_id", wallOwnerId).is("zone_id", null);
        } else {
            query = query.is("zone_id", null);
            if (feedMode === "friends") {
                const { data: fr } = await supabase.from("friend_requests").select("sender_id, receiver_id").eq("status", "accepted").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
                const ids = (fr || []).map((r: any) => r.sender_id === userId ? r.receiver_id : r.sender_id);
                ids.push(userId);
                query = query.in("author_id", ids);
            }
        }
        const { data } = await query;
        const typed = (data || []) as unknown as Post[];
        if (pageNum === 0) setPosts(typed); else setPosts(prev => [...prev, ...typed]);
        setHasMore(typed.length >= LIMIT);
        setLoading(false);
        if (typed.length > 0) {
            const postIds = typed.map(p => p.id);
            const { data: cd } = await supabase.from("comments").select("post_id").in("post_id", postIds);
            if (cd) {
                const counts: Record<number, number> = {};
                cd.forEach((c: any) => { counts[c.post_id] = (counts[c.post_id] || 0) + 1; });
                setCommentCounts(prev => ({ ...prev, ...counts }));
            }
        }
    }, [userId, zoneId, wallOwnerId]);

    const fetchActivityEvents = useCallback(async (feedMode: FeedMode) => {
        if (wallOwnerId || zoneId || singlePostId) return;
        // GLOBAL = pure post discovery, no activity noise
        if (feedMode === "all") { setActivityEvents([]); return; }
        // NETWORK = friend activity only
        const { data: fr } = await supabase.from("friend_requests").select("sender_id, receiver_id").eq("status", "accepted").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        const ids = (fr || []).map((r: any) => r.sender_id === userId ? r.receiver_id : r.sender_id);
        if (ids.length === 0) { setActivityEvents([]); return; }
        const { data } = await supabase.from("activity_events")
            .select("id, event_type, actor_id, target_user_id, reference_id, meta, created_at, actor:users!actor_id(display_name, zid, avatar_url, birth_year, birth_month, birth_day), target_user:users!target_user_id(id, display_name, zid, theme_track_url, theme_track_title, theme_track_artist)")
            .neq("actor_id", userId)
            .in("actor_id", ids)
            .order("created_at", { ascending: false })
            .limit(60);
        setActivityEvents((data || []) as unknown as ActivityEvent[]);
    }, [userId, zoneId, wallOwnerId, singlePostId]);

    useEffect(() => { setPage(0); fetchPosts(0, mode, activeTopic, sortMode); fetchActivityEvents(mode); }, [mode, activeTopic, sortMode, fetchPosts, fetchActivityEvents]);
    useEffect(() => { (async () => { const z = await getMyZaps(); setMyZaps(new Set(z)); })(); }, []);
    


    // ── Fetch comments ───────────────────────────────────
    const fetchComments = useCallback(async (postId: number) => {
        const { data } = await supabase.from("comments")
            .select("id, content, upvotes, downvotes, created_at, parent_id, author:users!author_id(id, display_name, zid)")
            .eq("post_id", postId).order("created_at", { ascending: true });
        if (!data) return;

        const commentIds = data.map((c: any) => c.id);
        let voteCounts: Record<number, { up: number; down: number }> = {};
        let userVotes = new Map<number, "up" | "down">();

        if (commentIds.length > 0) {
            try {
                const { data: allVotes } = await supabase.from("comment_votes")
                    .select("comment_id, vote_type, user_id")
                    .in("comment_id", commentIds);
                if (allVotes) {
                    allVotes.forEach((v: any) => {
                        if (!voteCounts[v.comment_id]) voteCounts[v.comment_id] = { up: 0, down: 0 };
                        if (v.vote_type === "up") voteCounts[v.comment_id].up++;
                        else voteCounts[v.comment_id].down++;
                        if (v.user_id === userId) userVotes.set(v.comment_id, v.vote_type);
                    });
                }
            } catch { /* comment_votes table may not exist */ }
        }

        const enriched = data.map((c: any) => ({
            ...c,
            upvotes: voteCounts[c.id]?.up ?? 0,
            downvotes: voteCounts[c.id]?.down ?? 0,
        }));

        setComments(prev => ({ ...prev, [postId]: enriched as unknown as CommentRaw[] }));
        setCommentCounts(prev => ({ ...prev, [postId]: enriched.length }));
        setMyVotes(prev => {
            const next = new Map(prev);
            userVotes.forEach((v, k) => next.set(k, v));
            commentIds.forEach(id => { if (!userVotes.has(id)) next.delete(id); });
            return next;
        });
    }, [userId]);

    // Auto-expand comment section on single post view
    useEffect(() => {
        if (singlePostId) {
            setExpandedComments(new Set([singlePostId]));
            fetchComments(singlePostId);
        }
    }, [singlePostId, fetchComments]);

    // Handle scroll to targeted comment
    useEffect(() => {
        if (!singlePostId || !targetActorZid || !comments[singlePostId]) return;
        const postCmts = comments[singlePostId] || [];
        if (postCmts.length === 0) return;
        
        let targetId: number | null = null;
        let parentToExpand: number | null = null;
        
        if (targetAction === "comment" || targetAction === "reply") {
            const commentByActor = [...postCmts].reverse().find(c => c.author.zid === targetActorZid);
            if (commentByActor) {
                targetId = commentByActor.id;
                if (commentByActor.parent_id) parentToExpand = commentByActor.parent_id;
            }
        }
        
        if (targetId) {
            if (parentToExpand) {
                setExpandedReplies(prev => new Set(prev).add(parentToExpand));
            }
            setTimeout(() => {
                const el = document.getElementById(`comment-${targetId}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.style.animation = "newGlow 2s ease-out";
                }
            }, 300);
        }
    }, [singlePostId, targetActorZid, targetAction, comments]);

    // ── Realtime ─────────────────────────────────────────
    useEffect(() => {
        const ch = supabase.channel("global_feed_rt")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "zeewall" }, async (p: any) => {
                if (page !== 0) return;
                if (zoneId && p.new.zone_id !== zoneId) return;
                if (!zoneId && !wallOwnerId && p.new.zone_id != null) return;
                if (!zoneId && wallOwnerId && p.new.owner_id !== wallOwnerId) return;
                if (activeTopic !== null && p.new.topic_id !== activeTopic) return;
                const { data } = await supabase.from("zeewall").select("id, content, zaps, created_at, owner_id, topic_id, gif_url, poll_data, author:users!author_id(id, display_name, zid, avatar_url, birth_year, birth_month, birth_day, online_status, agent_state(agent_id))").eq("id", p.new.id).single();
                if (!data) return;
                const t = data as unknown as Post;
                if (mode === "friends") {
                    const aid = (t.author as any)?.id;
                    if (aid !== userId) {
                        const { count } = await supabase.from("friend_requests").select("id", { count: "exact", head: true }).eq("status", "accepted").or(`and(sender_id.eq.${userId},receiver_id.eq.${aid}),and(sender_id.eq.${aid},receiver_id.eq.${userId})`);
                        if (!count) return;
                    }
                }
                if (window.scrollY > 200) {
                    setPendingPosts(prev => prev.some(x => x.id === t.id) ? prev : [t, ...prev]);
                } else {
                    setPosts(prev => prev.some(x => x.id === t.id) ? prev : [t, ...prev]);
                    setNewPostIds(prev => new Set(prev).add(t.id));
                    setTimeout(() => setNewPostIds(prev => { const n = new Set(prev); n.delete(t.id); return n; }), 3000);
                }
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "zeewall" }, (p: any) => {
                setPosts(prev => prev.map(x => x.id === p.new.id ? { ...x, zaps: p.new.zaps } : x));
            })
            .on("postgres_changes", { event: "DELETE", schema: "public", table: "zeewall" }, (p: any) => {
                setPosts(prev => prev.filter(x => x.id !== p.old.id));
            })
            .subscribe();

        const commentCh = supabase.channel("feed_comments_rt")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, (p: any) => {
                const postId = p.new?.post_id;
                if (postId) {
                    setCommentCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
                    setExpandedComments(prev => {
                        if (prev.has(postId)) fetchComments(postId);
                        return prev;
                    });
                }
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "comments" }, (p: any) => {
                const postId = p.new?.post_id;
                if (postId) {
                    setExpandedComments(prev => {
                        if (prev.has(postId)) fetchComments(postId);
                        return prev;
                    });
                }
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "comment_votes" }, (p: any) => {
                const commentId = p.new?.comment_id || p.old?.comment_id;
                if (!commentId) return;
                setComments(prev => {
                    for (const [postId, cmts] of Object.entries(prev)) {
                        if (cmts.some(c => c.id === commentId)) {
                            fetchComments(Number(postId));
                            break;
                        }
                    }
                    return prev;
                });
            })
            .subscribe();

        const activityCh = supabase.channel("global_activity_rt")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_events" }, async (p: any) => {
                // Only show friend activity; never show own actions; only in NETWORK mode
                if (wallOwnerId || zoneId || p.new.actor_id === userId || mode !== "friends") return;
                const { count } = await supabase.from("friend_requests").select("id", { count: "exact", head: true }).eq("status", "accepted").or(`and(sender_id.eq.${userId},receiver_id.eq.${p.new.actor_id}),and(sender_id.eq.${p.new.actor_id},receiver_id.eq.${userId})`);
                if (!count) return;
                const { data } = await supabase.from("activity_events")
                    .select("id, event_type, actor_id, target_user_id, reference_id, meta, created_at, actor:users!actor_id(display_name, zid, avatar_url, birth_year, birth_month, birth_day), target_user:users!target_user_id(id, display_name, zid, theme_track_url, theme_track_title, theme_track_artist)")
                    .eq("id", p.new.id).single();
                if (data) {
                    setActivityEvents(prev => [data as unknown as ActivityEvent, ...prev.slice(0, 59)]);
                    if (mode !== "friends") setHasNewActivity(true);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(ch); supabase.removeChannel(commentCh); supabase.removeChannel(activityCh); };
    }, [mode, page, userId, activeTopic, fetchComments]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, [newPostText]);

    // ── Topics ───────────────────────────────────────────
    const handleCreateTopic = useCallback(async () => {
        if (!newTopicTitle.trim()) return;
        const { data } = await supabase.from("topics").insert({ title: newTopicTitle.trim(), created_by: userId, description: "" }).select().single();
        if (data) {
            setTopics(prev => [data, ...prev]);
            setActiveTopic(data.id);
            setNewTopicTitle("");
            setShowNewTopic(false);
        }
    }, [newTopicTitle, userId]);

    const handleDeleteTopic = useCallback(async (tid: number) => {
        if (!await confirmModal({ title: "Delete Topic", message: "Delete this topic and all its posts? This cannot be undone.", danger: true, confirmText: "DELETE" })) return;
        await supabase.from("topics").delete().eq("id", tid);
        setTopics(prev => prev.filter(t => t.id !== tid));
        setActiveTopic(prev => prev === tid ? null : prev);
    }, []);

    // ── Post ─────────────────────────────────────────────
    const handlePost = useCallback(async () => {
        if (!newPostText.trim() || posting) return;
        if (typeof navigator !== "undefined" && navigator.vibrate) try { navigator.vibrate([20, 30, 20]); } catch(e) {}
        setPosting(true);
        const moodLine = moodText ? `[mood: ${moodText}]\n` : "";
        const insertData: any = {
            owner_id: wallOwnerId || userId,
            author_id: userId,
            content: moodLine + newPostText.trim(),
            topic_id: activeTopic || 1,
        };
        if (zoneId) insertData.zone_id = zoneId;
        if (attachedGif) insertData.gif_url = attachedGif;
        if (attachedPoll) insertData.poll_data = attachedPoll;
        await supabase.from("zeewall").insert(insertData);
        setNewPostText(""); setMoodText(""); setActivePanel(null);
        setAttachedGif(null); setAttachedPoll(null); setPosting(false);
    }, [newPostText, posting, moodText, wallOwnerId, userId, activeTopic, zoneId, attachedGif, attachedPoll]);

    // ── Zap ──────────────────────────────────────────────
    const handleZap = useCallback(async (pid: number) => {
        if (typeof navigator !== "undefined" && navigator.vibrate) try { navigator.vibrate(15); } catch(e) {}
        setZappingPost(pid);
        const already = myZapsRef.current.has(pid);
        setPosts(prev => prev.map(p => p.id === pid ? { ...p, zaps: p.zaps + (already ? -1 : 1) } : p));
        setMyZaps(prev => { const n = new Set(prev); if (already) n.delete(pid); else n.add(pid); return n; });
        await toggleZap(pid);
        setTimeout(() => setZappingPost(null), 400);

        if (!already) {
            const post = postsRef.current.find(p => p.id === pid);
            if (post && post.owner_id !== userId && !notifiedZaps.current.has(pid)) {
                notifiedZaps.current.add(pid);
                await supabase.from("notifications").insert({
                    user_id: post.owner_id, actor_id: userId,
                    type: "zap", content: "zapped your post ⚡", reference_id: pid,
                });
            }
        } else {
            notifiedZaps.current.delete(pid);
        }
    }, [userId]);

    const handleDelete = useCallback(async (pid: number) => {
        if (!await confirmModal({ title: "Delete Post", message: "Delete this post? This cannot be undone.", danger: true, confirmText: "DELETE" })) return;
        const snapshot = postsRef.current.find(p => p.id === pid);
        setPosts(prev => prev.filter(p => p.id !== pid));
        const { data, error } = await supabase.from("zeewall").delete().eq("id", pid).select("id");
        if (error || !data?.length) {
            if (snapshot) setPosts(prev => [snapshot, ...prev.filter(p => p.id !== pid)]);
            if (error) console.error("Delete failed:", error.message);
            else console.warn("Delete blocked — check RLS policy for zeewall table");
        }
    }, []);

    const handleShare = useCallback((post: Post) => {
        setSharingPost(post);
    }, []);

    // ── Comments ─────────────────────────────────────────
    const toggleCommentSection = useCallback(async (postId: number) => {
        setExpandedComments(prev => {
            const n = new Set(prev);
            if (n.has(postId)) { n.delete(postId); return n; }
            n.add(postId);
            fetchComments(postId);
            return n;
        });
    }, [fetchComments]);

    const handlePostComment = useCallback(async (postId: number) => {
        const text = newCommentRef.current[postId];
        if (!text?.trim()) return;
        setPostingComment(postId);
        const parentId = replyingToRef.current[postId]?.commentId || null;
        await supabase.from("comments").insert({ post_id: postId, author_id: userId, content: text.trim(), parent_id: parentId });
        setNewComment(prev => ({ ...prev, [postId]: "" }));
        setReplyingTo(prev => ({ ...prev, [postId]: null }));
        setPostingComment(null);
        await fetchComments(postId);
        if (parentId) setExpandedReplies(prev => new Set(prev).add(parentId));
        if (parentId) {
            const parentComment = (commentsRef.current[postId] || []).find(c => c.id === parentId);
            if (parentComment && parentComment.author.id !== userId) {
                await new Promise(r => setTimeout(r, 500));
                await supabase.from("notifications")
                    .delete().eq("actor_id", userId).eq("reference_id", postId).eq("type", "comment")
                    .gte("created_at", new Date(Date.now() - 3000).toISOString());
                await supabase.from("notifications").insert({
                    user_id: parentComment.author.id, actor_id: userId,
                    type: "reply", content: text.trim().slice(0, 60), reference_id: postId,
                });
            }
        }
    }, [userId, fetchComments]);

    const handleReplyToComment = useCallback((postId: number, commentId: number, authorName: string) => {
        setReplyingTo(prev => ({ ...prev, [postId]: { commentId, name: authorName } }));
        setNewComment(prev => ({ ...prev, [postId]: "" }));
        setTimeout(() => commentInputRefs.current[postId]?.focus(), 50);
    }, []);

    const cancelReply = useCallback((postId: number) => {
        setReplyingTo(prev => ({ ...prev, [postId]: null }));
    }, []);

    const toggleReplies = useCallback((commentId: number) => {
        setExpandedReplies(prev => {
            const n = new Set(prev);
            if (n.has(commentId)) n.delete(commentId); else n.add(commentId);
            return n;
        });
    }, []);

    const handleVote = useCallback(async (cid: number, type: "up" | "down", postId: number) => {
        const existing = myVotesRef.current.get(cid);

        if (existing === type) {
            setComments(prev => ({ ...prev, [postId]: prev[postId]?.map(c => c.id !== cid ? c : { ...c, [type === "up" ? "upvotes" : "downvotes"]: Math.max(0, c[type === "up" ? "upvotes" : "downvotes"] - 1) }) || [] }));
            setMyVotes(prev => { const n = new Map(prev); n.delete(cid); return n; });
        } else if (existing) {
            setComments(prev => ({ ...prev, [postId]: prev[postId]?.map(c => { if (c.id !== cid) return c; return type === "up" ? { ...c, upvotes: c.upvotes + 1, downvotes: Math.max(0, c.downvotes - 1) } : { ...c, downvotes: c.downvotes + 1, upvotes: Math.max(0, c.upvotes - 1) }; }) || [] }));
            setMyVotes(prev => new Map(prev).set(cid, type));
        } else {
            setComments(prev => ({ ...prev, [postId]: prev[postId]?.map(c => c.id !== cid ? c : { ...c, [type === "up" ? "upvotes" : "downvotes"]: c[type === "up" ? "upvotes" : "downvotes"] + 1 }) || [] }));
            setMyVotes(prev => new Map(prev).set(cid, type));
        }

        if (existing === type) {
            await supabase.from("comment_votes").delete().eq("comment_id", cid).eq("user_id", userId);
        } else if (existing) {
            await supabase.from("comment_votes").update({ vote_type: type }).eq("comment_id", cid).eq("user_id", userId);
        } else {
            await supabase.from("comment_votes").insert({ comment_id: cid, user_id: userId, vote_type: type });
        }

        await fetchComments(postId);

        if (type === "up" && !existing) {
            const voteKey = `${userId}_${cid}`;
            const comment = (commentsRef.current[postId] || []).find(c => c.id === cid);
            if (comment && comment.author.id !== userId && !notifiedVotes.current.has(voteKey)) {
                notifiedVotes.current.add(voteKey);
                await supabase.from("notifications").insert({
                    user_id: comment.author.id, actor_id: userId,
                    type: "upvote", content: "upvoted your comment", reference_id: postId,
                });
            }
        }
    }, [userId, fetchComments]);

    const handleCommentChange = useCallback((postId: number, val: string) => {
        setNewComment(prev => ({ ...prev, [postId]: val }));
    }, []);

    const loadMore = useCallback(() => {
        const n = page + 1;
        setPage(n);
        fetchPosts(n, mode, activeTopic, sortMode);
    }, [page, mode, activeTopic, sortMode, fetchPosts]);

    const activeTopicName = useMemo(() => activeTopic ? topics.find(t => t.id === activeTopic)?.title ?? null : null, [activeTopic, topics]);

    const feedItems = useMemo((): FeedItem[] => {
        if (wallOwnerId || zoneId) return posts.map(p => ({ kind: "post", data: p }));

        // Group activity events by (event_type + reference_id) to avoid duplicate cards
        const grouped = new Map<string, GroupedActivityEvent>();
        for (const e of activityEvents) {
            const key = `${e.event_type}::${e.reference_id ?? e.id}`;
            const existing = grouped.get(key);
            if (existing) {
                // Only add unique actors
                if (!existing.actors.some(a => a?.zid === e.actor?.zid)) {
                    existing.actors.push(e.actor);
                    existing.count++;
                }
            } else {
                grouped.set(key, {
                    id: e.id,
                    event_type: e.event_type,
                    actors: [e.actor],
                    target_user: e.target_user,
                    reference_id: e.reference_id,
                    meta: e.meta,
                    created_at: e.created_at,
                    count: 1,
                });
            }
        }

        const actItems = Array.from(grouped.values()).map(e => ({ kind: "activity" as const, data: e, ts: new Date(e.created_at).getTime() }));

        if (sortMode === "top") {
            // Posts already sorted by zaps DESC from DB — preserve that order; hide activity noise
            return posts.map(p => ({ kind: "post" as const, data: p }));
        }

        const postItems = posts.map(p => ({ kind: "post" as const, data: p, ts: new Date(p.created_at).getTime() }));
        return [...postItems, ...actItems].sort((a, b) => b.ts - a.ts);
    }, [posts, activityEvents, wallOwnerId, zoneId, sortMode]);

    // ── RENDER ───────────────────────────────────────────
    return (
        <div>
            {/* ── TOPIC BAR ── */}
            {!wallOwnerId && !zoneId && !singlePostId && (
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-800/60 overflow-x-auto topic-scroll">
                    <button onClick={() => setActiveTopic(null)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide transition-all border ${activeTopic === null ? "bg-electric/15 border-electric/40 text-electric" : "text-gray-600 border-gray-800 hover:border-gray-600"}`}>
                        <Globe className="w-3 h-3" /> ALL
                    </button>
                    {topics.map(t => (
                        <button key={t.id} onClick={() => setActiveTopic(t.id)}
                            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono tracking-wide transition-all border whitespace-nowrap ${activeTopic === t.id ? "bg-cyan/15 border-cyan/40 text-cyan" : "text-gray-600 border-gray-800 hover:border-gray-600"}`}>
                            {t.is_pinned && <Pin className="w-2.5 h-2.5" />}
                            <Hash className="w-2.5 h-2.5 opacity-50" />{t.title.toUpperCase()}
                            {t.created_by === userId && !t.is_pinned && (
                                <XCircle className="w-3 h-3 ml-0.5 text-gray-700 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id); }} />
                            )}
                        </button>
                    ))}
                    <button onClick={() => setShowNewTopic(!showNewTopic)} className="flex-shrink-0 w-7 h-7 rounded-full border border-dashed border-gray-700 hover:border-electric flex items-center justify-center text-gray-700 hover:text-electric transition-all">
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            )}

            {!wallOwnerId && !zoneId && showNewTopic && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800/40 bg-black/20">
                    <Hash className="w-3.5 h-3.5 text-gray-600" />
                    <input type="text" value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleCreateTopic(); }}
                        placeholder="New topic name..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-700" autoFocus />
                    <button onClick={handleCreateTopic} disabled={!newTopicTitle.trim()} className="text-[10px] font-black text-electric disabled:opacity-30 px-2 py-1">CREATE</button>
                    <button onClick={() => { setShowNewTopic(false); setNewTopicTitle(""); }} className="text-gray-700 hover:text-white"><XCircle className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* ── BROADCASTER ── */}
            {(!wallOwnerId || !hideComposer) && !singlePostId && (
                <div className="border-b border-gray-800/60" style={{ background: "linear-gradient(180deg, rgba(255,45,135,0.04) 0%, transparent 100%)" }}>
                    {/* ── GLOBAL / NETWORK TABS ── */}
                    {!wallOwnerId && !zoneId && (
                        <div className="flex items-center px-3 pt-3 pb-1">

                            {/* ══ PREMIUM SLIDING SIGNAL CAPSULE ══════════════════════
                                Spring-animated pill · Live dot · Floating badge
                            ══════════════════════════════════════════════════════════ */}
                            <div style={{
                                position: "relative",
                                display: "inline-flex",
                                background: "rgba(8,14,36,0.75)",
                                backdropFilter: "blur(16px)",
                                WebkitBackdropFilter: "blur(16px)",
                                borderRadius: "100px",
                                border: "1px solid rgba(255,255,255,.07)",
                                boxShadow: [
                                    "inset 0 1px 0 rgba(255,255,255,.06)",
                                    "inset 0 -1px 0 rgba(0,0,0,.3)",
                                    "0 4px 24px rgba(0,0,0,.5)",
                                    "0 0 0 1px rgba(0,0,0,.25)",
                                ].join(","),
                                padding: "3px",
                            }}>

                                {/* Spring-animated sliding pill */}
                                <div style={{
                                    position: "absolute",
                                    top: "3px", bottom: "3px", left: "3px",
                                    width: "116px",
                                    transform: mode === "friends" ? "translateX(116px)" : "translateX(0px)",
                                    transition: [
                                        "transform 0.36s cubic-bezier(0.34,1.56,0.64,1)",
                                        "background 0.3s ease",
                                        "border-color 0.3s ease",
                                        "box-shadow 0.3s ease",
                                    ].join(","),
                                    background: mode === "all"
                                        ? "linear-gradient(135deg,rgba(255,45,135,0.22) 0%,rgba(255,45,135,0.07) 100%)"
                                        : "linear-gradient(135deg,rgba(0,229,255,0.18) 0%,rgba(0,229,255,0.06) 100%)",
                                    borderRadius: "100px",
                                    border: `1px solid ${mode === "all" ? "rgba(255,45,135,0.38)" : "rgba(0,229,255,0.28)"}`,
                                    boxShadow: mode === "all"
                                        ? "0 0 22px rgba(255,45,135,0.22),inset 0 1px 0 rgba(255,255,255,.14)"
                                        : "0 0 22px rgba(0,229,255,0.18),inset 0 1px 0 rgba(255,255,255,.1)",
                                    pointerEvents: "none",
                                }} />

                                {/* ── GLOBAL tab ── */}
                                <button
                                    onClick={() => setMode("all")}
                                    style={{
                                        position: "relative", zIndex: 1,
                                        width: "116px", height: "34px",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        gap: "6px",
                                        background: "none", border: "none",
                                        borderRadius: "100px",
                                        cursor: "pointer", outline: "none",
                                        fontFamily: "'Orbitron', sans-serif",
                                        fontSize: "9px", fontWeight: 900,
                                        letterSpacing: mode === "all" ? "2px" : "1.2px",
                                        color: mode === "all" ? "var(--color-electric, #FF2D87)" : "rgba(255,255,255,.28)",
                                        textShadow: mode === "all" ? "0 0 14px color-mix(in srgb, var(--color-electric, #FF2D87) 75%, transparent)" : "none",
                                        transition: "color .3s ease, letter-spacing .3s ease, text-shadow .3s ease",
                                    }}
                                >
                                    {/* Pulsing live broadcast dot */}
                                    <div
                                        className={mode === "all" ? "broadcast-pulse" : ""}
                                        style={{
                                            width: "5px", height: "5px",
                                            borderRadius: "50%",
                                            flexShrink: 0,
                                            background: mode === "all" ? "#FF2D87" : "rgba(255,255,255,.16)",
                                            boxShadow: mode === "all" ? "0 0 8px rgba(255,45,135,0.95)" : "none",
                                            transition: "background .3s ease, box-shadow .3s ease",
                                        }}
                                    />
                                    GLOBAL
                                </button>

                                {/* ── NETWORK tab ── */}
                                <button
                                    onClick={() => { setMode("friends"); setHasNewActivity(false); }}
                                    style={{
                                        position: "relative", zIndex: 1,
                                        width: "116px", height: "34px",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        gap: "6px",
                                        background: "none", border: "none",
                                        borderRadius: "100px",
                                        cursor: "pointer", outline: "none",
                                        fontFamily: "'Orbitron', sans-serif",
                                        fontSize: "9px", fontWeight: 900,
                                        letterSpacing: mode === "friends" ? "2px" : "1.2px",
                                        color: mode === "friends" ? "var(--color-cyan, #00E5FF)" : "rgba(255,255,255,.28)",
                                        textShadow: mode === "friends" ? "0 0 14px color-mix(in srgb, var(--color-cyan, #00E5FF) 75%, transparent)" : "none",
                                        transition: "color .3s ease, letter-spacing .3s ease, text-shadow .3s ease",
                                    }}
                                >
                                    <Users size={10} style={{ flexShrink: 0 }} />
                                    NETWORK
                                    {/* New activity dot — only appears when realtime fires while on GLOBAL */}
                                    {hasNewActivity && (
                                        <div style={{
                                            position: "absolute",
                                            top: "5px", right: "12px",
                                            width: "6px", height: "6px",
                                            borderRadius: "50%",
                                            background: "var(--color-cyan, #00E5FF)",
                                            boxShadow: "0 0 6px color-mix(in srgb, var(--color-cyan, #00E5FF) 90%, transparent)",
                                            animation: "broadcast-pulse 1.8s ease-in-out infinite",
                                        }} />
                                    )}
                                </button>

                            </div>

                            {activeTopicName && (
                                <span className="ml-auto text-[9px] font-mono text-gray-700">
                                    #{activeTopicName.toLowerCase()}
                                </span>
                            )}
                        </div>
                    )}

                    {/* ── COMPOSER ── */}
                    {!hideComposer && (
                        <div className="px-3 pb-3 pt-2">
                            {/* Mobile collapsed state — tap to expand */}
                            {!composerExpanded && (
                                <button
                                    onClick={() => setComposerExpanded(true)}
                                    className="md:hidden w-full flex items-center gap-3 bg-black/30 border border-gray-800/80 rounded-xl px-3 py-2.5 hover:border-electric/30 transition-colors"
                                >
                                    <img src={getAvatar(userZid || userId)} alt="" className="w-7 h-7 rounded-lg border border-gray-800 object-cover flex-shrink-0" />
                                    <span className="flex-1 text-left text-[12px] text-gray-700">Drop a signal...</span>
                                    <Radio className="w-3.5 h-3.5 text-electric/40 broadcast-pulse flex-shrink-0" />
                                </button>
                            )}
                            {/* Full composer — always visible on md+, shown on mobile when expanded */}
                            <div className={`${composerExpanded ? "block" : "hidden"} md:block`}>
                                <div className="bg-black/30 border border-gray-800/80 rounded-xl p-3 hover:border-gray-700 transition-colors focus-within:border-electric/40 focus-within:shadow-[0_0_20px_rgba(255,45,135,0.08)]">
                                    <div className="flex gap-2.5">
                                        <img src={getAvatar(userZid || userId)} alt="" className="w-8 h-8 rounded-lg border border-gray-800 object-cover flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Radio className="w-3 h-3 text-electric broadcast-pulse" />
                                                    <span className="text-[8px] font-mono text-electric/60 uppercase tracking-[0.15em]">
                                                        Broadcast {zoneName ? `to z/${zoneName}` : activeTopicName ? `to #${activeTopicName.toLowerCase()}` : "to the grid"}
                                                    </span>
                                                </div>
                                                {/* Mobile close button */}
                                                <button
                                                    onClick={() => { setComposerExpanded(false); setActivePanel(null); }}
                                                    className="md:hidden text-gray-700 hover:text-white transition-colors"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <textarea ref={textareaRef} value={newPostText} onChange={e => setNewPostText(e.target.value.slice(0, 500))}
                                                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
                                                placeholder="Drop a signal..." className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-gray-700 min-h-[24px] max-h-[120px] leading-relaxed" rows={1}
                                                autoFocus={composerExpanded} />
                                            {moodText && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="mood-tag inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono"
                                                        style={{ background: getMoodStyle(moodText).bg, borderWidth: 1, borderStyle: "solid", borderColor: getMoodStyle(moodText).border, color: getMoodStyle(moodText).text }}>
                                                        {moodText}
                                                        <button onClick={() => setMoodText("")} className="ml-0.5 hover:text-white"><XCircle className="w-2.5 h-2.5" /></button>
                                                    </span>
                                                </div>
                                            )}
                                            {attachedGif && (
                                                <div className="relative mt-2 inline-block">
                                                    <img src={attachedGif} alt="GIF" className="max-h-[120px] rounded-lg border border-gray-800/40" />
                                                    <button onClick={() => setAttachedGif(null)}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white">
                                                        <XCircle className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                            {attachedPoll && (
                                                <div className="mt-2 bg-black/20 border border-cyan/20 rounded-lg px-3 py-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <BarChart3 className="w-3 h-3 text-cyan" />
                                                        <span className="text-[9px] font-mono text-cyan">Poll attached • {attachedPoll.options.length} options</span>
                                                    </div>
                                                    <button onClick={() => setAttachedPoll(null)} className="text-gray-600 hover:text-white"><XCircle className="w-3 h-3" /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/30">
                                        <div className="flex items-center gap-0.5">
                                            <button onClick={() => setActivePanel(activePanel === "mood" ? null : "mood")}
                                                className={`flex items-center gap-1 text-[9px] font-mono px-2 py-1.5 rounded-md transition-all ${activePanel === "mood" || moodText ? "text-electric bg-electric/10" : "text-gray-700 hover:text-gray-400"}`}
                                                title="Set Mood"><Palette className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => { setActivePanel(activePanel === "gif" ? null : "gif"); setAttachedPoll(null); }}
                                                className={`flex items-center gap-1 text-[9px] font-mono px-2 py-1.5 rounded-md transition-all ${activePanel === "gif" || attachedGif ? "text-lime bg-lime/10" : "text-gray-700 hover:text-gray-400"}`}
                                                title="Attach GIF"><ImageIcon className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => { setActivePanel(activePanel === "poll" ? null : "poll"); setAttachedGif(null); }}
                                                className={`flex items-center gap-1 text-[9px] font-mono px-2 py-1.5 rounded-md transition-all ${activePanel === "poll" || attachedPoll ? "text-cyan bg-cyan/10" : "text-gray-700 hover:text-gray-400"}`}
                                                title="Create Poll"><BarChart3 className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {newPostText.length > 0 && <span className={`text-[8px] font-mono ${newPostText.length > 450 ? "text-magenta" : "text-gray-800"}`}>{newPostText.length}/500</span>}
                                            <button onClick={() => { handlePost(); setComposerExpanded(false); }} disabled={!newPostText.trim() || posting}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide transition-all disabled:opacity-20"
                                                style={{ background: newPostText.trim() ? "linear-gradient(135deg,var(--color-electric,#FF2D87),color-mix(in srgb,var(--color-electric,#FF2D87) 70%,#000))" : "rgba(255,255,255,0.02)", color: newPostText.trim() ? "#fff" : "#333", boxShadow: newPostText.trim() ? "0 0 14px rgba(255,45,135,0.3)" : "none" }}>
                                                {posting ? <div className="w-3 h-3 animate-spin border-2 border-white border-t-transparent rounded-full" /> : <Send className="w-3 h-3" />} BROADCAST
                                            </button>
                                        </div>
                                    </div>
                                    {activePanel === "mood" && (
                                        <div className="mt-2 pt-2 border-t border-gray-800/30 space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                                {QUICK_MOODS.map((m, i) => (
                                                    <button key={i} onClick={() => { setMoodText(m); setActivePanel(null); }}
                                                        className={`px-2 py-0.5 rounded-md text-[9px] transition-all border ${moodText === m ? "bg-electric/10 border-electric/30 text-white" : "border-gray-800/60 text-gray-600 hover:text-white hover:border-gray-600"}`}>{m}</button>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="text" value={moodText} onChange={e => setMoodText(e.target.value.slice(0, 30))}
                                                    onKeyDown={e => { if (e.key === "Enter") setActivePanel(null); }}
                                                    placeholder="Or type your own..."
                                                    className="flex-1 bg-black/30 border border-gray-800/60 rounded-md px-2.5 py-1 text-[10px] text-white outline-none placeholder:text-gray-700 focus:border-electric/30" />
                                                <span className="text-[8px] font-mono text-gray-700">{moodText.length}/30</span>
                                            </div>
                                        </div>
                                    )}
                                    {activePanel === "gif" && (
                                        <GifPicker onSelect={(url) => { setAttachedGif(url); setActivePanel(null); }} onClose={() => setActivePanel(null)} />
                                    )}
                                    {activePanel === "poll" && (
                                        <PollCreator onSubmit={(poll) => { setAttachedPoll(poll); setActivePanel(null); }} onClose={() => setActivePanel(null)} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── SORT TABS ── */}
            {!singlePostId && (
                <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-gray-800/40 bg-black/10">
                    <button onClick={() => setSortMode("new")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all ${sortMode === "new" ? "bg-electric/10 text-electric" : "text-gray-600 hover:text-gray-400"}`}>
                    <Clock className="w-3 h-3" /> NEW
                </button>
                <button onClick={() => setSortMode("top")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all ${sortMode === "top" ? "bg-lime/10 text-lime" : "text-gray-600 hover:text-gray-400"}`}>
                    <Flame className="w-3 h-3" /> TOP
                </button>
            </div>
            )}

            {/* ── FEED ── */}
            <div className="relative">
                {pendingPosts.length > 0 && (
                    <div className="sticky top-4 z-50 flex justify-center pointer-events-none mb-[-36px]">
                        <button
                            onClick={() => {
                                if (typeof navigator !== "undefined" && navigator.vibrate) try { navigator.vibrate(20); } catch(e){}
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                setPosts(prev => {
                                    const combined = [...pendingPosts, ...prev];
                                    return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                                });
                                const newIds = pendingPosts.map(p => p.id);
                                setNewPostIds(prev => new Set([...Array.from(prev), ...newIds]));
                                setTimeout(() => setNewPostIds(prev => { const n = new Set(prev); newIds.forEach(id => n.delete(id)); return n; }), 3000);
                                setPendingPosts([]);
                            }}
                            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-[#0E0B0D]/90 backdrop-blur-xl border border-cyan/40 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.2)] text-cyan text-[10px] font-bold tracking-widest hover:bg-cyan/10 transition-all hover:scale-105 active:scale-95"
                            style={{ animation: "zapPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}
                        >
                            <ArrowUp className="w-3 h-3" /> {pendingPosts.length} NEW BROADCAST{pendingPosts.length > 1 ? "S" : ""}
                        </button>
                    </div>
                )}
                {loading && feedItems.length === 0 ? (
                    <div className="flex flex-col w-full animate-fade-in">
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                        <div className="flex items-center justify-center py-6 gap-2 opacity-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse" />
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Tuning in...</span>
                        </div>
                    </div>
                ) : feedItems.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        {mode === "friends" && !wallOwnerId ? (
                            <>
                                <div className="text-3xl mb-3">👥</div>
                                <p className="text-[13px] font-black text-gray-500 mb-1 tracking-wide">YOUR NETWORK IS QUIET</p>
                                <p className="text-[10px] text-gray-700 font-mono mb-4">Add friends to see their posts and activity here</p>
                                <a href="/search" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all"
                                    style={{ background: "rgba(0,229,255,.1)", border: "1px solid rgba(0,229,255,.25)", color: "#00E5FF" }}>
                                    <Users className="w-3 h-3" /> FIND FRIENDS →
                                </a>
                            </>
                        ) : (
                            <>
                                <div className="text-3xl mb-3">📡</div>
                                <p className="text-sm font-bold text-gray-500 mb-1">{wallOwnerId ? "No wall posts yet" : activeTopicName ? `No posts in #${activeTopicName.toLowerCase()}` : "The grid awaits"}</p>
                                <p className="text-[10px] text-gray-700 font-mono">{wallOwnerId ? "Be the first to write something" : "Be the first to broadcast"}</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800/30">
                        {feedItems.map((item, idx) => item.kind === "activity" ? (
                            <ActivityCard key={`act-${item.data.id}`} event={item.data} viewerId={userId} />
                        ) : (
                            <PostCard
                                key={`post-${item.data.id}`}
                                post={item.data}
                                idx={idx}
                                isNew={newPostIds.has(item.data.id)}
                                isZapped={myZaps.has(item.data.id)}
                                isZapping={zappingPost === item.data.id}
                                isExpanded={expandedComments.has(item.data.id)}
                                isSinglePostView={!!singlePostId}
                                commentCount={commentCounts[item.data.id] || 0}
                                postComments={comments[item.data.id] || []}
                                myCommentText={newComment[item.data.id] || ""}
                                currentReply={replyingTo[item.data.id] || null}
                                isPostingComment={postingComment === item.data.id}
                                expandedReplies={expandedReplies}
                                myVotes={myVotes}
                                activeTopic={activeTopic}
                                topics={topics}
                                userId={userId}
                                userZid={userZid}
                                wallOwnerId={wallOwnerId}
                                commentInputRefs={commentInputRefs}
                                onZap={handleZap}
                                onDelete={handleDelete}
                                onShare={handleShare}
                                onToggleComment={toggleCommentSection}
                                onPostComment={handlePostComment}
                                onReplyToComment={handleReplyToComment}
                                onCancelReply={cancelReply}
                                onToggleReplies={toggleReplies}
                                onVote={handleVote}
                                onSetActiveTopic={setActiveTopic}
                                onChangeComment={handleCommentChange}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Load more */}
            {hasMore && posts.length > 0 && (
                <div className="border-t border-gray-800/40">
                    <button onClick={loadMore} disabled={loading}
                        className="w-full py-3.5 text-[10px] font-mono font-bold text-gray-600 hover:text-electric transition-all hover:bg-electric/5 disabled:opacity-40 uppercase tracking-widest">
                        {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Scanning...</span> : "⚡ Load More Transmissions"}
                    </button>
                </div>
            )}

            <ShareSheet
                isOpen={!!sharingPost}
                onClose={() => setSharingPost(null)}
                title={sharingPost ? `${sharingPost.author?.display_name || "Someone"} on Zeezu` : ""}
                text={sharingPost ? sharingPost.content.slice(0, 200) : ""}
                url={sharingPost ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${sharingPost.author?.zid || ""}` : ""}
            />
        </div>
    );
}
