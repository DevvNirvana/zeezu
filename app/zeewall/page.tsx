"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import { Loader2, MessageCircle, Zap, Send, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Post = {
  id:         number;
  content:    string;
  created_at: string;
  zaps:       number;
  author: { display_name: string; zid: string; avatar_url: string | null } | null;
};

type UserData = {
  id:          string;
  zid:         string;
  display_name:string;
  avatar_url:  string | null;
  primary_color?: string;
};

const getAvatar = (user: { zid: string; avatar_url?: string | null }) =>
  user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.zid}`;

// ── CSS: inject once ──────────────────────────────────────────────────
const WALL_STYLE_ID = "zeewall-page-styles";
if (typeof document !== "undefined" && !document.getElementById(WALL_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = WALL_STYLE_ID;
  s.textContent = `
    @keyframes wall-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .wall-post { animation: wall-in 0.35s ease-out both; }
    .wall-post:nth-child(1)  { animation-delay: 0.04s; }
    .wall-post:nth-child(2)  { animation-delay: 0.08s; }
    .wall-post:nth-child(3)  { animation-delay: 0.12s; }
    .wall-post:nth-child(4)  { animation-delay: 0.16s; }
    .wall-post:nth-child(5)  { animation-delay: 0.20s; }
    .wall-post:nth-child(6)  { animation-delay: 0.24s; }
    @keyframes eq {
      0%,100% { height: 4px } 50% { height: 14px }
    }
    .eq-b { animation: eq var(--d, 0.7s) ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

export default function MyZeeWall() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [loading,  setLoading]  = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [newPost,  setNewPost]  = useState("");
  const [posting,  setPosting]  = useState(false);
  const [primary,  setPrimary]  = useState("#8A2EFF");
  const [secondary,setSecondary]= useState("#00F7FF");

  // ── Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/"); return; }

      const [
        { data: userData },
        { data: postsData },
        { data: customData },
      ] = await Promise.all([
        supabase.from("users").select("id, zid, display_name, avatar_url").eq("id", authUser.id).single(),
        supabase.from("zeewall")
          .select("id, content, created_at, zaps, author:users!author_id(display_name, zid, avatar_url)")
          .eq("owner_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("profile_customization").select("primary_color, secondary_color").eq("user_id", authUser.id).single(),
      ]);

      if (userData) setUserData(userData);
      if (postsData) setPosts(postsData as Post[]);
      if (customData) {
        setPrimary(customData.primary_color ?? "#8A2EFF");
        setSecondary(customData.secondary_color ?? "#00F7FF");
      }
      setLoading(false);

      // Realtime: new posts on this wall pop in live
      if (userData) {
        channel = supabase
          .channel(`wall:${userData.id}`)
          .on("postgres_changes", {
            event:  "INSERT",
            schema: "public",
            table:  "zeewall",
            filter: `owner_id=eq.${userData.id}`,
          }, async (payload) => {
            // Fetch with author join
            const { data: newPostData } = await supabase
              .from("zeewall")
              .select("id, content, created_at, zaps, author:users!author_id(display_name, zid, avatar_url)")
              .eq("id", payload.new.id)
              .single();
            if (newPostData) setPosts(prev => [newPostData as Post, ...prev]);
          })
          .subscribe();
      }
    }

    init();
    return () => { channel?.unsubscribe(); };
  }, [router]);

  // ── Auto-grow textarea ────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [newPost]);

  // ── Post ──────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!newPost.trim() || !userData || posting) return;
    setPosting(true);
    const { data } = await supabase.from("zeewall").insert({
      owner_id:  userData.id,
      author_id: userData.id,
      content:   newPost.trim(),
    }).select("id, content, created_at, zaps, author:users!author_id(display_name, zid, avatar_url)").single();
    if (data) setPosts(prev => [data as Post, ...prev]);
    setNewPost("");
    setPosting(false);
  };

  // ── Zap ───────────────────────────────────────────────────────────
  const handleZap = async (postId: number) => {
    if (!userData) return;
    await supabase.rpc("zap_post", { post_id: postId, zapper_id: userData.id });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, zaps: p.zaps + 1 } : p));
  };

  // ── Delete (owner only) ────────────────────────────────────────────
  const handleDelete = async (postId: number) => {
    await supabase.from("zeewall").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <Loader2 className="w-7 h-7 text-electric animate-spin" />
    </div>
  );

  const totalZaps = posts.reduce((acc, p) => acc + (p.zaps || 0), 0);

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white pb-24">
      <NavBar />

      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">

        {/* ── HEADER ── */}
        <div className="mb-6 relative">
          {/* Glow */}
          <div
            className="absolute -top-6 left-0 w-48 h-16 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 0 50%, ${primary}30 0%, transparent 70%)` }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primary}18`, border: `1px solid ${primary}40` }}
              >
                <MessageCircle className="w-5 h-5" style={{ color: primary }} />
              </div>
              <div>
                <h1
                  className="text-xl font-black uppercase tracking-tighter leading-none"
                  style={{ color: primary, textShadow: `0 0 20px ${primary}60` }}
                >
                  My ZeeWall
                </h1>
                <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                  {userData?.display_name} · {posts.length} posts · {totalZaps} zaps
                </p>
              </div>
            </div>

            {/* Realtime indicator */}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: secondary }} />
              <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>

        {/* ── COMPOSE ── */}
        <div
          className="rounded-2xl border p-4 mb-6"
          style={{ borderColor: `${primary}25`, backgroundColor: `${primary}06` }}
        >
          <div className="flex gap-3 items-start">
            {/* My avatar */}
            <img
              src={getAvatar(userData!)}
              className="w-9 h-9 rounded-xl border flex-shrink-0 mt-0.5"
              style={{ borderColor: `${primary}40` }}
              alt="me"
            />

            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                maxLength={500}
                rows={1}
                placeholder="What's happening in your world..."
                className="w-full bg-transparent text-sm text-white outline-none resize-none placeholder:text-gray-700 leading-relaxed"
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
                }}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-[8px] font-mono text-gray-700">{newPost.length}/500 · ⌘↵ to post</span>
                <button
                  onClick={handlePost}
                  disabled={!newPost.trim() || posting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-40 text-black"
                  style={{ backgroundColor: primary }}
                >
                  {posting
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <><Send className="w-3 h-3" /> Post</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── FEED ── */}
        {posts.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed py-16 text-center"
            style={{ borderColor: `${primary}20` }}
          >
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-800" />
            <p className="text-sm text-gray-600 font-mono">Your wall is empty</p>
            <p className="text-xs text-gray-700 mt-1">Write something above to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post, i) => (
              <div
                key={post.id}
                className="wall-post group rounded-2xl border p-4 transition-all hover:border-opacity-60"
                style={{
                  borderColor:     `${primary}20`,
                  backgroundColor: "#0B0B12",
                  animationDelay:  `${i * 0.04}s`,
                }}
              >
                <div className="flex gap-3">
                  {/* Author avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={getAvatar({ zid: post.author?.zid ?? "", avatar_url: post.author?.avatar_url })}
                      className="w-9 h-9 rounded-xl border"
                      style={{ borderColor: `${primary}30` }}
                      alt={post.author?.display_name}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Author + time */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-black" style={{ color: primary }}>
                        {post.author?.display_name ?? "Unknown"}
                      </span>
                      <div className="flex items-center gap-1 text-[8px] font-mono text-gray-700">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-gray-200 leading-relaxed">{post.content}</p>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => handleZap(post.id)}
                        className="flex items-center gap-1 text-[10px] font-mono transition-all hover:scale-110 active:scale-95"
                        style={{ color: post.zaps > 0 ? "#B4FF00" : "#444" }}
                      >
                        <Zap className="w-3 h-3" />
                        <span>{post.zaps} {post.zaps === 1 ? "zap" : "zaps"}</span>
                      </button>

                      {/* Delete (owner or post author) */}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-700 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}