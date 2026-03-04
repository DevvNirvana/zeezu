"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { toggleZap, getMyZaps } from "@/lib/supabase/queries";
import {
    Zap, MessageSquare, Loader2, Send, Trash2, Globe, Users,
    Radio, Copy, Check, Plus, Pin, XCircle, Palette, Share2,
    ArrowUp, ArrowDown, ChevronDown, ChevronUp, Hash, Reply, CornerDownRight,
    Image as ImageIcon, BarChart3, Flame, Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import GifPicker from "@/components/GifPicker";
import PollCreator, { type PollData } from "@/components/PollCreator";
import PollDisplay from "@/components/PollDisplay";
import EmbedPreview, { stripEmbedUrls } from "@/components/EmbedPreview";
import ShareSheet from "@/components/ShareSheet";

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
    author: { id: string; display_name: string; zid: string; avatar_url?: string | null } | null;
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

const getAvatar = (zid: string, url?: string | null) =>
    url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

// ── CSS ──────────────────────────────────────────────
const FEED_STYLE_ID = "global-feed-v5-styles";
if (typeof document !== "undefined" && !document.getElementById(FEED_STYLE_ID)) {
    const s = document.createElement("style");
    s.id = FEED_STYLE_ID;
    s.textContent = `
    @keyframes feedSlideIn { from { opacity:0; transform:translateY(10px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
    .feed-post-card { animation: feedSlideIn 0.35s ease-out forwards; }
    @keyframes zapPop { 0%{transform:scale(1)} 40%{transform:scale(1.4) rotate(-8deg)} 70%{transform:scale(0.9) rotate(4deg)} 100%{transform:scale(1) rotate(0deg)} }
    .zap-pop { animation: zapPop 0.4s cubic-bezier(0.68,-0.55,0.27,1.55); }
    @keyframes newGlow { 0%{box-shadow:0 0 0 0 rgba(138,46,255,0.5)} 50%{box-shadow:0 0 20px 4px rgba(138,46,255,0.15)} 100%{box-shadow:0 0 0 0 rgba(138,46,255,0)} }
    .new-glow { animation: newGlow 2s ease-out; }
    @keyframes broadcastPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
    .broadcast-pulse { animation: broadcastPulse 2s infinite; }
    .post-card-hover:hover { border-color:rgba(138,46,255,0.2); background:rgba(138,46,255,0.02); }
    @keyframes commentSlide { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    .comment-enter { animation: commentSlide 0.2s ease-out forwards; }
    @keyframes replySlide { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
    .reply-enter { animation: replySlide 0.15s ease-out forwards; }
    .topic-scroll::-webkit-scrollbar { height:3px; }
    .topic-scroll::-webkit-scrollbar-track { background:transparent; }
    .topic-scroll::-webkit-scrollbar-thumb { background:rgba(138,46,255,0.3); border-radius:10px; }
    @keyframes moodFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
    .mood-tag { animation: moodFloat 3s ease-in-out infinite; }
    .share-check { animation: zapPop 0.3s cubic-bezier(0.68,-0.55,0.27,1.55); }
    .thread-line { position:relative; }
    .thread-line::before { content:''; position:absolute; left:11px; top:28px; bottom:0; width:1.5px; background:linear-gradient(180deg,rgba(0,247,255,0.2),transparent); border-radius:1px; }
  `;
    document.head.appendChild(s);
}

export default function GlobalFeed({ userId, userZid }: { userId: string; userZid?: string }) {
    const [mode, setMode] = useState<FeedMode>("all");
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [newPostText, setNewPostText] = useState("");
    const [myZaps, setMyZaps] = useState<Set<number>>(new Set());
    const [zappingPost, setZappingPost] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [newPostIds, setNewPostIds] = useState<Set<number>>(new Set());
    const [sharedPostId, setSharedPostId] = useState<number | null>(null);
    const [sharingPost, setSharingPost] = useState<Post | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const LIMIT = 15;
    const [sortMode, setSortMode] = useState<"new" | "top">("new");

    // Mood
    const [moodText, setMoodText] = useState("");
    const QUICK_MOODS = ["⚡ Wired", "🔥 On Fire", "💭 Thinking", "🎵 Vibing", "🌙 Late Night", "☕ Caffeinated", "🚀 Grinding", "💀 Dead"];

    // GIF + Poll attachments
    const [attachedGif, setAttachedGif] = useState<string | null>(null);
    const [attachedPoll, setAttachedPoll] = useState<PollData | null>(null);
    const [activePanel, setActivePanel] = useState<"mood" | "gif" | "poll" | null>(null);

    // Topics
    const [topics, setTopics] = useState<Topic[]>([]);
    const [activeTopic, setActiveTopic] = useState<number | null>(null);
    const [showNewTopic, setShowNewTopic] = useState(false);
    const [newTopicTitle, setNewTopicTitle] = useState("");

    // Comments — threaded
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
    const [comments, setComments] = useState<Record<number, CommentRaw[]>>({});
    const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
    const [newComment, setNewComment] = useState<Record<number, string>>({});
    const [postingComment, setPostingComment] = useState<number | null>(null);
    const [replyingTo, setReplyingTo] = useState<Record<number, { commentId: number; name: string } | null>>({});
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
    const commentInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const [myVotes, setMyVotes] = useState<Map<number, "up" | "down">>(new Map());

    // Dedup: prevent duplicate notifications
    const notifiedZaps = useRef<Set<number>>(new Set());
    const notifiedVotes = useRef<Set<string>>(new Set());

    // ── Fetch topics ────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const { data } = await supabase.from("topics").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
            if (data) setTopics(data);
        })();
    }, []);

    // ── Fetch posts ─────────────────────────────────────────
    const fetchPosts = useCallback(async (pageNum: number, feedMode: FeedMode, topicId: number | null, sort: "new" | "top" = "new") => {
        setLoading(true);
        const from = pageNum * LIMIT;
        const to = from + LIMIT - 1;
        let query = supabase.from("zeewall")
            .select("id, content, zaps, created_at, owner_id, topic_id, gif_url, poll_data, author:users!author_id(id, display_name, zid, avatar_url)");
        if (sort === "top") query = query.order("zaps", { ascending: false }).order("created_at", { ascending: false });
        else query = query.order("created_at", { ascending: false });
        query = query.range(from, to);
        if (topicId !== null) query = query.eq("topic_id", topicId);
        if (feedMode === "friends") {
            const { data: fr } = await supabase.from("friend_requests").select("sender_id, receiver_id").eq("status", "accepted").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
            const ids = (fr || []).map(r => r.sender_id === userId ? r.receiver_id : r.sender_id);
            ids.push(userId);
            query = query.in("author_id", ids);
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
    }, [userId]);

    useEffect(() => { setPage(0); fetchPosts(0, mode, activeTopic, sortMode); }, [mode, activeTopic, sortMode, fetchPosts]);
    useEffect(() => { (async () => { const z = await getMyZaps(); setMyZaps(new Set(z)); })(); }, []);

    // Realtime
    useEffect(() => {
        const ch = supabase.channel("global_feed_rt")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "zeewall" }, async (p: any) => {
                if (page !== 0) return;
                if (activeTopic !== null && p.new.topic_id !== activeTopic) return;
                const { data } = await supabase.from("zeewall").select("id, content, zaps, created_at, owner_id, topic_id, gif_url, poll_data, author:users!author_id(id, display_name, zid, avatar_url)").eq("id", p.new.id).single();
                if (!data) return;
                const t = data as unknown as Post;
                if (mode === "friends") {
                    const aid = (t.author as any)?.id;
                    if (aid !== userId) {
                        const { count } = await supabase.from("friend_requests").select("id", { count: "exact", head: true }).eq("status", "accepted").or(`and(sender_id.eq.${userId},receiver_id.eq.${aid}),and(sender_id.eq.${aid},receiver_id.eq.${userId})`);
                        if (!count) return;
                    }
                }
                setPosts(prev => prev.some(x => x.id === t.id) ? prev : [t, ...prev]);
                setNewPostIds(prev => new Set(prev).add(t.id));
                setTimeout(() => setNewPostIds(prev => { const n = new Set(prev); n.delete(t.id); return n; }), 3000);
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "zeewall" }, (p: any) => { setPosts(prev => prev.map(x => x.id === p.new.id ? { ...x, zaps: p.new.zaps } : x)); })
            .on("postgres_changes", { event: "DELETE", schema: "public", table: "zeewall" }, (p: any) => { setPosts(prev => prev.filter(x => x.id !== p.old.id)); })
            .subscribe();

        // Realtime for comments: auto-refresh when comments are inserted or updated on expanded posts
        const commentCh = supabase.channel("feed_comments_rt")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, (p: any) => {
                const postId = p.new?.post_id;
                if (postId) {
                    // Update comment count
                    setCommentCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
                    // If this comment section is expanded, re-fetch
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
            // Realtime vote count updates
            .on("postgres_changes", { event: "*", schema: "public", table: "comment_votes" }, (p: any) => {
                const commentId = p.new?.comment_id || p.old?.comment_id;
                if (!commentId) return;
                // Find which post this comment belongs to and re-fetch
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

        return () => { supabase.removeChannel(ch); supabase.removeChannel(commentCh); };
    }, [mode, page, userId, activeTopic]);

    useEffect(() => { const el = textareaRef.current; if (!el) return; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }, [newPostText]);

    // ── Topics ──────────────────────────────────────────────
    const handleCreateTopic = async () => {
        if (!newTopicTitle.trim()) return;
        const { data } = await supabase.from("topics").insert({ title: newTopicTitle.trim(), created_by: userId, description: "" }).select().single();
        if (data) { setTopics([data, ...topics]); setActiveTopic(data.id); setNewTopicTitle(""); setShowNewTopic(false); }
    };
    const handleDeleteTopic = async (tid: number) => {
        if (!window.confirm("Delete this topic and all its posts?")) return;
        await supabase.from("topics").delete().eq("id", tid);
        setTopics(topics.filter(t => t.id !== tid));
        if (activeTopic === tid) setActiveTopic(null);
    };

    // ── Post ────────────────────────────────────────────────
    const handlePost = async () => {
        if (!newPostText.trim() || posting) return;
        setPosting(true);
        const moodLine = moodText ? `[mood: ${moodText}]\n` : "";
        const insertData: any = {
            owner_id: userId,
            author_id: userId,
            content: moodLine + newPostText.trim(),
            topic_id: activeTopic || 1,
        };
        if (attachedGif) insertData.gif_url = attachedGif;
        if (attachedPoll) insertData.poll_data = attachedPoll;
        await supabase.from("zeewall").insert(insertData);
        setNewPostText(""); setMoodText(""); setActivePanel(null);
        setAttachedGif(null); setAttachedPoll(null); setPosting(false);
    };

    // ── Zap ─────────────────────────────────────────────────
    const handleZap = async (pid: number) => {
        setZappingPost(pid);
        const already = myZaps.has(pid);
        setPosts(prev => prev.map(p => p.id === pid ? { ...p, zaps: p.zaps + (already ? -1 : 1) } : p));
        setMyZaps(prev => { const n = new Set(prev); if (already) n.delete(pid); else n.add(pid); return n; });
        await toggleZap(pid);
        setTimeout(() => setZappingPost(null), 400);

        // Notification: zap (only on zap, not un-zap, and only once per post)
        if (!already) {
            const post = posts.find(p => p.id === pid);
            if (post && post.owner_id !== userId && !notifiedZaps.current.has(pid)) {
                notifiedZaps.current.add(pid);
                await supabase.from("notifications").insert({
                    user_id: post.owner_id,
                    actor_id: userId,
                    type: "zap",
                    content: "zapped your post ⚡",
                    reference_id: pid,
                });
            }
        } else {
            // On un-zap, allow re-notification next time
            notifiedZaps.current.delete(pid);
        }
    };
    const handleDelete = async (pid: number) => { setPosts(prev => prev.filter(p => p.id !== pid)); await supabase.from("zeewall").delete().eq("id", pid); };

    // ── Share ───────────────────────────────────────────────
    const handleShare = (post: Post) => {
        setSharingPost(post);
    };

    // ── Comments — threaded ─────────────────────────────────
    const fetchComments = async (postId: number) => {
        const { data } = await supabase.from("comments")
            .select("id, content, upvotes, downvotes, created_at, parent_id, author:users!author_id(id, display_name, zid)")
            .eq("post_id", postId).order("created_at", { ascending: true });
        if (!data) return;

        const commentIds = data.map((c: any) => c.id);
        let voteCounts: Record<number, { up: number; down: number }> = {};
        let userVotes = new Map<number, "up" | "down">();

        if (commentIds.length > 0) {
            try {
                // Fetch ALL votes for these comments in one query
                const { data: allVotes } = await supabase.from("comment_votes")
                    .select("comment_id, vote_type, user_id")
                    .in("comment_id", commentIds);
                if (allVotes) {
                    // Count votes per comment
                    allVotes.forEach((v: any) => {
                        if (!voteCounts[v.comment_id]) voteCounts[v.comment_id] = { up: 0, down: 0 };
                        if (v.vote_type === "up") voteCounts[v.comment_id].up++;
                        else voteCounts[v.comment_id].down++;
                        // Track this user's votes
                        if (v.user_id === userId) userVotes.set(v.comment_id, v.vote_type);
                    });
                }
            } catch { /* comment_votes table may not exist */ }
        }

        // Override upvotes/downvotes with real counts from comment_votes
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
            // Clear votes for comments no longer present
            commentIds.forEach(id => { if (!userVotes.has(id)) next.delete(id); });
            return next;
        });
    };

    const toggleCommentSection = async (postId: number) => {
        if (expandedComments.has(postId)) {
            setExpandedComments(prev => { const n = new Set(prev); n.delete(postId); return n; });
        } else {
            setExpandedComments(prev => new Set(prev).add(postId));
            await fetchComments(postId);
        }
    };

    const handlePostComment = async (postId: number) => {
        const text = newComment[postId];
        if (!text?.trim()) return;
        setPostingComment(postId);
        const parentId = replyingTo[postId]?.commentId || null;
        await supabase.from("comments").insert({ post_id: postId, author_id: userId, content: text.trim(), parent_id: parentId });
        setNewComment(prev => ({ ...prev, [postId]: "" }));
        setReplyingTo(prev => ({ ...prev, [postId]: null }));
        setPostingComment(null);
        await fetchComments(postId);
        if (parentId) setExpandedReplies(prev => new Set(prev).add(parentId));
        // Notification logic:
        // - Simple comment: a DB trigger already creates "comment" notification for the post owner, so we do nothing.
        // - Reply to a comment: we want a "reply" notification to the comment author instead.
        //   The DB trigger may fire a "comment" notif, so we wait briefly, delete it, then insert "reply".
        if (parentId) {
            const parentComment = (comments[postId] || []).find(c => c.id === parentId);
            if (parentComment && parentComment.author.id !== userId) {
                // Wait for DB trigger to fire, then clean up its "comment" notif
                await new Promise(r => setTimeout(r, 500));
                await supabase.from("notifications")
                    .delete()
                    .eq("actor_id", userId)
                    .eq("reference_id", postId)
                    .eq("type", "comment")
                    .gte("created_at", new Date(Date.now() - 3000).toISOString());

                await supabase.from("notifications").insert({
                    user_id: parentComment.author.id,
                    actor_id: userId,
                    type: "reply",
                    content: text.trim().slice(0, 60),
                    reference_id: postId,
                });
            }
        }
        // For simple comments (no parentId), the DB trigger handles the "comment" notification automatically.
    };

    const handleReplyToComment = (postId: number, commentId: number, authorName: string) => {
        setReplyingTo(prev => ({ ...prev, [postId]: { commentId, name: authorName } }));
        setNewComment(prev => ({ ...prev, [postId]: "" }));
        setTimeout(() => commentInputRefs.current[postId]?.focus(), 50);
    };

    const cancelReply = (postId: number) => {
        setReplyingTo(prev => ({ ...prev, [postId]: null }));
    };

    const toggleReplies = (commentId: number) => {
        setExpandedReplies(prev => {
            const n = new Set(prev);
            if (n.has(commentId)) n.delete(commentId); else n.add(commentId);
            return n;
        });
    };

    const handleVote = async (cid: number, type: "up" | "down", postId: number) => {
        const existing = myVotes.get(cid);

        // Optimistic UI
        if (existing === type) {
            // Toggle off
            setComments(prev => ({ ...prev, [postId]: prev[postId]?.map(c => c.id !== cid ? c : { ...c, [type === "up" ? "upvotes" : "downvotes"]: Math.max(0, c[type === "up" ? "upvotes" : "downvotes"] - 1) }) || [] }));
            setMyVotes(prev => { const n = new Map(prev); n.delete(cid); return n; });
        } else if (existing) {
            // Switch
            setComments(prev => ({ ...prev, [postId]: prev[postId]?.map(c => { if (c.id !== cid) return c; return type === "up" ? { ...c, upvotes: c.upvotes + 1, downvotes: Math.max(0, c.downvotes - 1) } : { ...c, downvotes: c.downvotes + 1, upvotes: Math.max(0, c.upvotes - 1) }; }) || [] }));
            setMyVotes(prev => new Map(prev).set(cid, type));
        } else {
            // New vote
            setComments(prev => ({ ...prev, [postId]: prev[postId]?.map(c => c.id !== cid ? c : { ...c, [type === "up" ? "upvotes" : "downvotes"]: c[type === "up" ? "upvotes" : "downvotes"] + 1 }) || [] }));
            setMyVotes(prev => new Map(prev).set(cid, type));
        }

        // DB: just operate on comment_votes table (user has full RLS access to own rows)
        if (existing === type) {
            // Remove vote
            await supabase.from("comment_votes").delete().eq("comment_id", cid).eq("user_id", userId);
        } else if (existing) {
            // Switch vote
            await supabase.from("comment_votes").update({ vote_type: type }).eq("comment_id", cid).eq("user_id", userId);
        } else {
            // New vote
            await supabase.from("comment_votes").insert({ comment_id: cid, user_id: userId, vote_type: type });
        }

        // Re-fetch from DB to sync real counts
        await fetchComments(postId);

        // Notification: only on NEW upvote, deduplicated
        if (type === "up" && !existing) {
            const voteKey = `${userId}_${cid}`;
            const comment = (comments[postId] || []).find(c => c.id === cid);
            if (comment && comment.author.id !== userId && !notifiedVotes.current.has(voteKey)) {
                notifiedVotes.current.add(voteKey);
                await supabase.from("notifications").insert({
                    user_id: comment.author.id, actor_id: userId,
                    type: "upvote", content: "upvoted your comment", reference_id: postId,
                });
            }
        }
    };

    const loadMore = () => { const n = page + 1; setPage(n); fetchPosts(n, mode, activeTopic, sortMode); };

    const formatTime = (date: string) => {
        const diffMin = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
        if (diffMin < 1) return "now";
        if (diffMin < 60) return `${diffMin}m`;
        if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`;
        return formatDistanceToNow(new Date(date), { addSuffix: false });
    };

    const parseMood = (content: string): { mood: string | null; text: string } => {
        const m = content.match(/^\[mood: (.+?)\]\n/);
        return m ? { mood: m[1], text: content.replace(m[0], "") } : { mood: null, text: content };
    };

    // Unique gradient for each mood
    const getMoodStyle = (mood: string) => {
        const map: Record<string, { bg: string; border: string; text: string }> = {
            "⚡ Wired": { bg: "linear-gradient(135deg, rgba(138,46,255,0.15), rgba(168,85,247,0.08))", border: "rgba(138,46,255,0.25)", text: "#a855f7" },
            "🔥 On Fire": { bg: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.08))", border: "rgba(249,115,22,0.25)", text: "#f97316" },
            "💭 Thinking": { bg: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))", border: "rgba(99,102,241,0.25)", text: "#818cf8" },
            "🎵 Vibing": { bg: "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(6,182,212,0.08))", border: "rgba(20,184,166,0.25)", text: "#2dd4bf" },
            "🌙 Late Night": { bg: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.08))", border: "rgba(59,130,246,0.25)", text: "#60a5fa" },
            "☕ Caffeinated": { bg: "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(245,158,11,0.08))", border: "rgba(217,119,6,0.25)", text: "#fbbf24" },
            "🚀 Grinding": { bg: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.08))", border: "rgba(16,185,129,0.25)", text: "#34d399" },
            "💀 Dead": { bg: "linear-gradient(135deg, rgba(244,63,94,0.15), rgba(251,113,133,0.08))", border: "rgba(244,63,94,0.25)", text: "#fb7185" },
        };
        if (map[mood]) return map[mood];
        // Hash custom moods to a palette color
        const colors = Object.values(map);
        let hash = 0;
        for (let i = 0; i < mood.length; i++) hash = mood.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    // ── Group comments into threads ─────────────────────────
    const getThreaded = (postId: number) => {
        const all = comments[postId] || [];
        const topLevel = all.filter(c => !c.parent_id);
        const replyMap: Record<number, CommentRaw[]> = {};
        all.filter(c => c.parent_id).forEach(c => {
            if (!replyMap[c.parent_id!]) replyMap[c.parent_id!] = [];
            replyMap[c.parent_id!].push(c);
        });
        return { topLevel, replyMap };
    };

    const activeTopicName = activeTopic ? topics.find(t => t.id === activeTopic)?.title : null;

    // ── RENDER ───────────────────────────────────────────────
    return (
        <div>
            {/* ── TOPIC BAR ── */}
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
                        {t.created_by === userId && !t.is_pinned && <XCircle className="w-3 h-3 ml-0.5 text-gray-700 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id); }} />}
                    </button>
                ))}
                <button onClick={() => setShowNewTopic(!showNewTopic)} className="flex-shrink-0 w-7 h-7 rounded-full border border-dashed border-gray-700 hover:border-electric flex items-center justify-center text-gray-700 hover:text-electric transition-all">
                    <Plus className="w-3 h-3" />
                </button>
            </div>

            {showNewTopic && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800/40 bg-black/20">
                    <Hash className="w-3.5 h-3.5 text-gray-600" />
                    <input type="text" value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleCreateTopic(); }}
                        placeholder="New topic name..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-700" autoFocus />
                    <button onClick={handleCreateTopic} disabled={!newTopicTitle.trim()} className="text-[10px] font-black text-electric disabled:opacity-30 px-2 py-1">CREATE</button>
                    <button onClick={() => { setShowNewTopic(false); setNewTopicTitle(""); }} className="text-gray-700 hover:text-white"><XCircle className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* ── BROADCASTER ── */}
            <div className="border-b border-gray-800/60" style={{ background: "linear-gradient(180deg, rgba(138,46,255,0.04) 0%, transparent 100%)" }}>
                <div className="flex items-center gap-1 px-3 pt-2.5 pb-1.5">
                    <button onClick={() => setMode("all")} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black tracking-wider transition-all ${mode === "all" ? "bg-electric/10 text-electric" : "text-gray-700 hover:text-gray-400"}`}>
                        <Globe className="w-2.5 h-2.5" /> GLOBAL</button>
                    <button onClick={() => setMode("friends")} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black tracking-wider transition-all ${mode === "friends" ? "bg-cyan/10 text-cyan" : "text-gray-700 hover:text-gray-400"}`}>
                        <Users className="w-2.5 h-2.5" /> NETWORK</button>
                    {activeTopicName && <span className="ml-auto text-[9px] font-mono text-gray-700">#{activeTopicName.toLowerCase()}</span>}
                </div>
                <div className="px-3 pb-3">
                    <div className="bg-black/30 border border-gray-800/80 rounded-xl p-3 hover:border-gray-700 transition-colors focus-within:border-electric/40 focus-within:shadow-[0_0_20px_rgba(138,46,255,0.08)]">
                        <div className="flex gap-2.5">
                            <img src={getAvatar(userZid || userId)} alt="" className="w-8 h-8 rounded-lg border border-gray-800 object-cover flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Radio className="w-3 h-3 text-electric broadcast-pulse" />
                                    <span className="text-[8px] font-mono text-electric/60 uppercase tracking-[0.15em]">
                                        Broadcast {activeTopicName ? `to #${activeTopicName.toLowerCase()}` : "to the grid"}
                                    </span>
                                </div>
                                <textarea ref={textareaRef} value={newPostText} onChange={e => setNewPostText(e.target.value.slice(0, 500))}
                                    onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
                                    placeholder="Drop a signal..." className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-gray-700 min-h-[24px] max-h-[120px] leading-relaxed" rows={1} />
                                {moodText && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="mood-tag inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono"
                                            style={{ background: getMoodStyle(moodText).bg, borderWidth: 1, borderStyle: "solid", borderColor: getMoodStyle(moodText).border, color: getMoodStyle(moodText).text }}>
                                            {moodText}
                                            <button onClick={() => setMoodText("")} className="ml-0.5 hover:text-white"><XCircle className="w-2.5 h-2.5" /></button>
                                        </span>
                                    </div>
                                )}
                                {/* Attached GIF preview */}
                                {attachedGif && (
                                    <div className="relative mt-2 inline-block">
                                        <img src={attachedGif} alt="GIF" className="max-h-[120px] rounded-lg border border-gray-800/40" />
                                        <button onClick={() => setAttachedGif(null)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white">
                                            <XCircle className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                {/* Attached Poll preview */}
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
                        {/* Toolbar: Mood + GIF + Poll | char count | Broadcast */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/30">
                            <div className="flex items-center gap-0.5">
                                <button onClick={() => setActivePanel(activePanel === "mood" ? null : "mood")}
                                    className={`flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded-md transition-all ${activePanel === "mood" || moodText ? "text-electric bg-electric/10" : "text-gray-700 hover:text-gray-400"}`}
                                    title="Set Mood">
                                    <Palette className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setActivePanel(activePanel === "gif" ? null : "gif"); setAttachedPoll(null); }}
                                    className={`flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded-md transition-all ${activePanel === "gif" || attachedGif ? "text-lime bg-lime/10" : "text-gray-700 hover:text-gray-400"}`}
                                    title="Attach GIF">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setActivePanel(activePanel === "poll" ? null : "poll"); setAttachedGif(null); }}
                                    className={`flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded-md transition-all ${activePanel === "poll" || attachedPoll ? "text-cyan bg-cyan/10" : "text-gray-700 hover:text-gray-400"}`}
                                    title="Create Poll">
                                    <BarChart3 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                {newPostText.length > 0 && <span className={`text-[8px] font-mono ${newPostText.length > 450 ? "text-magenta" : "text-gray-800"}`}>{newPostText.length}/500</span>}
                                <button onClick={handlePost} disabled={!newPostText.trim() || posting}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide transition-all disabled:opacity-20"
                                    style={{ background: newPostText.trim() ? "linear-gradient(135deg,#8A2EFF,#6B1FCC)" : "rgba(255,255,255,0.02)", color: newPostText.trim() ? "#fff" : "#333", boxShadow: newPostText.trim() ? "0 0 14px rgba(138,46,255,0.3)" : "none" }}>
                                    {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} BROADCAST
                                </button>
                            </div>
                        </div>
                        {/* Panels */}
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
                            <GifPicker
                                onSelect={(url) => { setAttachedGif(url); setActivePanel(null); }}
                                onClose={() => setActivePanel(null)}
                            />
                        )}
                        {activePanel === "poll" && (
                            <PollCreator
                                onSubmit={(poll) => { setAttachedPoll(poll); setActivePanel(null); }}
                                onClose={() => setActivePanel(null)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* ── SORT TABS ── */}
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

            {/* ── FEED ── */}
            <div>
                {loading && posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-6 h-6 text-electric animate-spin" />
                        <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Tuning in...</span>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="text-3xl mb-3">📡</div>
                        <p className="text-sm font-bold text-gray-500 mb-1">{mode === "friends" ? "Your network is quiet" : activeTopicName ? `No posts in #${activeTopicName.toLowerCase()}` : "The grid awaits"}</p>
                        <p className="text-[10px] text-gray-700 font-mono">Be the first to broadcast</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800/30">
                        {posts.map((post, idx) => {
                            const postTopic = topics.find(t => t.id === post.topic_id);
                            const isExpanded = expandedComments.has(post.id);
                            const cCount = commentCounts[post.id] || 0;
                            const { mood, text: postText } = parseMood(post.content);
                            const { topLevel, replyMap } = getThreaded(post.id);
                            const currentReply = replyingTo[post.id];

                            return (
                                <div key={post.id} className={`feed-post-card post-card-hover transition-all ${newPostIds.has(post.id) ? "new-glow" : ""}`}
                                    style={{ animationDelay: `${Math.min(idx * 30, 300)}ms`, animationFillMode: "both" }}>
                                    <div className="px-4 py-3.5">
                                        <div className="flex gap-3">
                                            <Link href={`/u/${post.author?.zid || "unknown"}`} className="flex-shrink-0 group/avatar">
                                                <div className="relative">
                                                    <img src={getAvatar(post.author?.zid || "?", post.author?.avatar_url)} alt=""
                                                        className="w-10 h-10 rounded-xl border border-gray-800 group-hover/avatar:border-electric/50 transition-all bg-gray-900" />
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0B0B12] bg-lime" style={{ boxShadow: "0 0 4px #B4FF00" }} />
                                                </div>
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    <Link href={`/u/${post.author?.zid || ""}`} className="font-black text-[13px] text-white hover:text-electric transition-colors">{post.author?.display_name || "Unknown"}</Link>
                                                    <span className="text-[9px] font-mono text-gray-700">{post.author?.zid}</span>
                                                    {postTopic && activeTopic === null && <button onClick={() => setActiveTopic(postTopic.id)} className="text-[8px] font-mono text-cyan/60 hover:text-cyan bg-cyan/5 px-1.5 py-0.5 rounded">#{postTopic.title.toLowerCase()}</button>}
                                                    <span className="text-[9px] text-gray-800">·</span>
                                                    <span className="text-[9px] text-gray-600 font-mono">{formatTime(post.created_at)}</span>
                                                    {newPostIds.has(post.id) && <span className="text-[7px] font-black text-electric bg-electric/10 px-1.5 py-0.5 rounded-sm tracking-wider">NEW</span>}
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
                                                {/* Link embeds */}
                                                <EmbedPreview content={postText} />
                                                {/* GIF in post */}
                                                {post.gif_url && (
                                                    <div className="mb-2.5">
                                                        <img src={post.gif_url} alt="GIF" className="max-w-full max-h-[280px] rounded-lg border border-gray-800/40 object-contain" loading="lazy" />
                                                        <span className="text-[7px] font-mono text-gray-800 mt-0.5 inline-block">via GIPHY</span>
                                                    </div>
                                                )}
                                                {/* Poll in post */}
                                                {post.poll_data && post.poll_data.options && (
                                                    <PollDisplay postId={post.id} options={post.poll_data.options} userId={userId} />
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleZap(post.id)}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all border ${myZaps.has(post.id) ? "text-lime bg-lime/10 border-lime/30" : "text-gray-600 border-transparent hover:text-lime hover:bg-lime/5 hover:border-lime/20"}`}>
                                                        <Zap className={`w-3.5 h-3.5 ${myZaps.has(post.id) ? "fill-lime" : ""} ${zappingPost === post.id ? "zap-pop" : ""}`} />
                                                        <span className="font-bold">{post.zaps}</span>
                                                    </button>
                                                    <button onClick={() => toggleCommentSection(post.id)}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all border ${isExpanded ? "text-cyan bg-cyan/10 border-cyan/30" : "text-gray-600 border-transparent hover:text-cyan hover:bg-cyan/5 hover:border-cyan/20"}`}>
                                                        <MessageSquare className="w-3.5 h-3.5" /><span>{cCount}</span>
                                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                    </button>
                                                    <button onClick={() => handleShare(post)}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all text-gray-700 hover:text-electric hover:bg-electric/5">
                                                        <Share2 className="w-3 h-3" />
                                                    </button>
                                                    {post.owner_id === userId && <button onClick={() => handleDelete(post.id)} className="flex items-center px-2 py-1 rounded-lg text-gray-800 hover:text-red-500 hover:bg-red-500/5 transition-all ml-auto"><Trash2 className="w-3 h-3" /></button>}
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
                                                        <div key={c.id} className="comment-enter mb-2" style={{ animationDelay: `${ci * 40}ms` }}>
                                                            {/* Parent comment */}
                                                            <div className={`flex gap-2 ${replies.length > 0 ? "thread-line" : ""}`}>
                                                                <img src={getAvatar(c.author.zid)} alt="" className="w-6 h-6 rounded-md border border-gray-800 bg-gray-900 flex-shrink-0 mt-0.5" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-800/40">
                                                                        <div className="flex items-center gap-2">
                                                                            <Link href={`/u/${c.author.zid}`} className="text-[11px] font-bold text-white hover:text-electric transition-colors">{c.author.display_name}</Link>
                                                                            <span className="text-[8px] font-mono text-gray-700">{formatTime(c.created_at)}</span>
                                                                            {/* Net score + vote arrows — right-aligned */}
                                                                            <div className="flex items-center gap-0.5 ml-auto">
                                                                                <button onClick={() => handleVote(c.id, "up", post.id)}
                                                                                    className={`p-0.5 rounded transition-all ${myVotes.get(c.id) === "up" ? "bg-green-500/20 ring-1 ring-green-500/30" : "hover:bg-green-500/10"}`}>
                                                                                    <ArrowUp className={`w-3 h-3 ${myVotes.get(c.id) === "up" ? "text-green-400" : "text-green-600/50 hover:text-green-400"}`} />
                                                                                </button>
                                                                                <span className={`text-[9px] font-mono font-bold min-w-[14px] text-center ${netScore > 0 ? "text-green-500/80" : netScore < 0 ? "text-red-500/80" : "text-gray-600"}`}>
                                                                                    {netScore > 0 ? `+${netScore}` : netScore}
                                                                                </span>
                                                                                <button onClick={() => handleVote(c.id, "down", post.id)}
                                                                                    className={`p-0.5 rounded transition-all ${myVotes.get(c.id) === "down" ? "bg-red-500/20 ring-1 ring-red-500/30" : "hover:bg-red-500/10"}`}>
                                                                                    <ArrowDown className={`w-3 h-3 ${myVotes.get(c.id) === "down" ? "text-red-400" : "text-red-600/50 hover:text-red-400"}`} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-[12px] text-gray-300 leading-relaxed whitespace-pre-wrap mt-0.5">{c.content}</p>
                                                                    </div>
                                                                    {/* Actions: Reply + show replies */}
                                                                    <div className="flex items-center gap-3 mt-0.5 ml-2">
                                                                        <button onClick={() => handleReplyToComment(post.id, c.id, c.author.display_name)}
                                                                            className="flex items-center gap-1 text-[9px] font-mono text-gray-700 hover:text-cyan transition-colors">
                                                                            <Reply className="w-2.5 h-2.5" /> Reply
                                                                        </button>
                                                                        {replies.length > 0 && (
                                                                            <button onClick={() => toggleReplies(c.id)}
                                                                                className="flex items-center gap-1 text-[9px] font-mono text-cyan/60 hover:text-cyan transition-colors">
                                                                                <CornerDownRight className="w-2.5 h-2.5" />
                                                                                {showReplies ? "Hide" : "View"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
                                                                                {showReplies ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Nested replies — indented, with thread line */}
                                                            {showReplies && replies.length > 0 && (
                                                                <div className="ml-8 mt-1 space-y-1.5 pl-3 border-l-[1.5px] border-cyan/15">
                                                                    {replies.map((r, ri) => {
                                                                        const rNet = r.upvotes - r.downvotes;
                                                                        return (
                                                                            <div key={r.id} className="reply-enter flex gap-2" style={{ animationDelay: `${ri * 30}ms` }}>
                                                                                <img src={getAvatar(r.author.zid)} alt="" className="w-5 h-5 rounded-md border border-gray-800 bg-gray-900 flex-shrink-0 mt-0.5" />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="bg-gray-900/30 rounded-lg px-2.5 py-1.5 border border-gray-800/30">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Link href={`/u/${r.author.zid}`} className="text-[10px] font-bold text-white hover:text-electric transition-colors">{r.author.display_name}</Link>
                                                                                            <span className="text-[7px] font-mono text-gray-700">{formatTime(r.created_at)}</span>
                                                                                            <div className="flex items-center gap-0.5 ml-auto">
                                                                                                <button onClick={() => handleVote(r.id, "up", post.id)}
                                                                                                    className={`p-0.5 rounded transition-all ${myVotes.get(r.id) === "up" ? "bg-green-500/20 ring-1 ring-green-500/30" : "hover:bg-green-500/10"}`}>
                                                                                                    <ArrowUp className={`w-2.5 h-2.5 ${myVotes.get(r.id) === "up" ? "text-green-400" : "text-green-600/40 hover:text-green-400"}`} />
                                                                                                </button>
                                                                                                <span className={`text-[8px] font-mono font-bold min-w-[12px] text-center ${rNet > 0 ? "text-green-500/70" : rNet < 0 ? "text-red-500/70" : "text-gray-700"}`}>
                                                                                                    {rNet > 0 ? `+${rNet}` : rNet}
                                                                                                </span>
                                                                                                <button onClick={() => handleVote(r.id, "down", post.id)}
                                                                                                    className={`p-0.5 rounded transition-all ${myVotes.get(r.id) === "down" ? "bg-red-500/20 ring-1 ring-red-500/30" : "hover:bg-red-500/10"}`}>
                                                                                                    <ArrowDown className={`w-2.5 h-2.5 ${myVotes.get(r.id) === "down" ? "text-red-400" : "text-red-600/40 hover:text-red-400"}`} />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                        <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap mt-0.5">{r.content}</p>
                                                                                    </div>
                                                                                    <button onClick={() => handleReplyToComment(post.id, c.id, r.author.display_name)}
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
                                                    {/* Replying-to indicator */}
                                                    {currentReply && (
                                                        <div className="flex items-center gap-2 mb-2 px-1">
                                                            <CornerDownRight className="w-3 h-3 text-cyan/60" />
                                                            <span className="text-[9px] font-mono text-cyan/60">
                                                                Replying to <span className="text-cyan font-bold">{currentReply.name}</span>
                                                            </span>
                                                            <button onClick={() => cancelReply(post.id)} className="text-gray-700 hover:text-white transition-colors">
                                                                <XCircle className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <img src={getAvatar(userZid || userId)} alt="" className="w-6 h-6 rounded-md border border-gray-800 flex-shrink-0" />
                                                        <input ref={(el) => { commentInputRefs.current[post.id] = el; }}
                                                            type="text" value={newComment[post.id] || ""}
                                                            onChange={e => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                            onKeyDown={e => { if (e.key === "Enter") handlePostComment(post.id); }}
                                                            placeholder={currentReply ? `Reply to ${currentReply.name}...` : "Write a reply..."}
                                                            className="flex-1 bg-gray-900/40 border border-gray-800/60 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-gray-700 outline-none focus:border-cyan/40 transition-colors" />
                                                        <button onClick={() => handlePostComment(post.id)}
                                                            disabled={!newComment[post.id]?.trim() || postingComment === post.id}
                                                            className="p-1.5 rounded-lg text-gray-600 hover:text-cyan hover:bg-cyan/10 transition-all disabled:opacity-30">
                                                            {postingComment === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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

            {/* Share Sheet Modal */}
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
