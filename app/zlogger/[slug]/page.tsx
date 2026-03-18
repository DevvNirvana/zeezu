"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import ThemeEngine, { DEFAULT_THEME, type ThemeConfig } from "@/components/ThemeEngine";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import {
  getZlogBySlug, getZlogComments, addZlogComment, engageZlog,
  type ZlogFull, type ZlogComment,
} from "@/lib/supabase/queries";
import { ZLOG_CSS } from "@/lib/zlogger-renderer";
import {
  Zap, Waves, Bookmark, MessageCircle, Edit3,
  Loader2, Twitter, Copy, ArrowLeft,
} from "lucide-react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');
  body, html { overflow-x: hidden !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes zee-entry { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .reading-entry { animation: zee-entry .3s ease both; }
  .eng-btn { transition: all .15s ease; cursor: pointer; }
  .eng-btn:hover { opacity: .8; transform: scale(1.06); }
  .comment-item { transition: background .15s; }
  .highlight-tooltip { position: fixed; z-index: 9999; pointer-events: all; }
`;

const ZLOG_THEMES: Record<string, Partial<ThemeConfig>> = {
  void_chrome:  { primary_color: "#8A2EFF", secondary_color: "#00F7FF", page_bg: "#0B0B12" },
  neon_vapor:   { primary_color: "#FF007A", secondary_color: "#00F7FF", page_bg: "#0D0D1A" },
  midnight_run: { primary_color: "#00E5FF", secondary_color: "#B4FF00", page_bg: "#060610" },
  candy_chrome: { primary_color: "#FF6B9D", secondary_color: "#FFD93D", page_bg: "#0E0814" },
  arctic_ghost: { primary_color: "#A5F3FC", secondary_color: "#E0F2FE", page_bg: "#040D14" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ZlogReadingPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [zlog, setZlog] = useState<ZlogFull | null>(null);
  const [comments, setComments] = useState<ZlogComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentPosting, setCommentPosting] = useState(false);
  const [myEngagement, setMyEngagement] = useState<string[]>([]);
  const [engCounts, setEngCounts] = useState({ zap: 0, vibe: 0, save: 0, comment: 0 });
  const [loading, setLoading] = useState(true);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [highlightTooltip, setHighlightTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [echoed, setEchoed] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);

  const themeConf = zlog ? ZLOG_THEMES[zlog.theme] ?? ZLOG_THEMES.void_chrome : ZLOG_THEMES.void_chrome;
  const fullTheme: ThemeConfig = { ...DEFAULT_THEME, ...themeConf } as ThemeConfig;
  const primary = themeConf?.primary_color ?? "#8A2EFF";
  const pageBg = themeConf?.page_bg ?? "#0B0B12";

  const gen = zlog?.author
    ? getGeneration(zlog.author.birth_year, zlog.author.birth_month, zlog.author.birth_day, false)
    : null;

  const load = useCallback(async () => {
    setLoading(true);
    const [authResult, data] = await Promise.all([
      supabase.auth.getUser(),
      getZlogBySlug(slug),
    ]);
    setViewerId(authResult.data.user?.id ?? null);
    if (!data) { setLoading(false); return; }
    setZlog(data);
    setMyEngagement(data.myEngagement ?? []);
    setEngCounts(data.engagementCounts);
    const cmts = await getZlogComments(data.id);
    setComments(cmts);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  // Realtime comments
  useEffect(() => {
    if (!zlog?.id) return;
    const channel = supabase
      .channel(`zlog-comments-${zlog.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "zlog_comments", filter: `zlog_id=eq.${zlog.id}` }, (payload) => {
        // Fetch full comment with author
        supabase.from("zlog_comments").select(`id, content, created_at, author:users!user_id (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day)`)
          .eq("id", payload.new.id).single().then(({ data }) => {
            if (data) setComments(prev => [...prev, data as ZlogComment]);
          });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [zlog?.id]);

  const handleEngage = async (type: "zap" | "vibe" | "save") => {
    if (!viewerId || !zlog) return;
    const result = await engageZlog(zlog.id, type);
    if (result === "added") {
      setMyEngagement(prev => [...prev, type]);
      setEngCounts(prev => ({ ...prev, [type]: prev[type] + 1 }));
    } else if (result === "removed") {
      setMyEngagement(prev => prev.filter(e => e !== type));
      setEngCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !zlog) return;
    setCommentPosting(true);
    const result = await addZlogComment(zlog.id, commentText.trim());
    if (result) {
      setCommentText("");
      setEngCounts(prev => ({ ...prev, comment: prev.comment + 1 }));
    }
    setCommentPosting(false);
  };

  const handleEcho = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(`"${zlog?.title}" — ${url}`).then(() => {
      setEchoed(true);
      setTimeout(() => setEchoed(false), 2000);
    });
  };

  const handleTextSelect = (e: React.MouseEvent) => {
    const selected = window.getSelection()?.toString().trim();
    if (selected && selected.length > 2) {
      setHighlightTooltip({ text: selected, x: e.clientX, y: e.clientY - 44 });
    } else {
      setHighlightTooltip(null);
    }
  };

  const handleHighlightTweet = () => {
    if (!highlightTooltip) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const tweetText = encodeURIComponent(`"${highlightTooltip.text}" — from "${zlog?.title}" ${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");
    setHighlightTooltip(null);
  };

  const handleHighlightCopy = () => {
    if (!highlightTooltip) return;
    navigator.clipboard.writeText(highlightTooltip.text);
    setHighlightTooltip(null);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0B0B12", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={28} color="#8A2EFF" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!zlog) return (
    <div style={{ minHeight: "100vh", background: "#0B0B12", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <span style={{ fontFamily: "'VT323',monospace", fontSize: "18px", color: "rgba(255,255,255,.4)", letterSpacing: "2px" }}>ZLOG NOT FOUND</span>
      <button onClick={() => router.push("/zlogger")} style={{ padding: "8px 20px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.5)", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", cursor: "pointer" }}>BACK TO FEED</button>
    </div>
  );

  const isOwner = viewerId === zlog.author?.id;

  return (
    <div style={{ minHeight: "100vh", background: pageBg, color: "#fff", fontFamily: "'Nunito',sans-serif", paddingBottom: "80px" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES + ZLOG_CSS }} />
      <ThemeEngine config={fullTheme} />
      <NavBar />

      {/* Highlight-to-share tooltip */}
      {highlightTooltip && (
        <div className="highlight-tooltip" style={{ left: highlightTooltip.x, top: highlightTooltip.y, background: "rgba(8,14,36,.96)", border: `1px solid ${primary}40`, borderRadius: "8px", padding: "6px 8px", display: "flex", gap: "6px", boxShadow: "0 4px 20px rgba(0,0,0,.6)" }}>
          <button onClick={handleHighlightTweet} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", background: "#1DA1F2", border: "none", color: "#fff", fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", cursor: "pointer" }}>
            <Twitter size={10} /> TWEET
          </button>
          <button onClick={handleHighlightCopy} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", background: `${primary}30`, border: `1px solid ${primary}40`, color: primary, fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", cursor: "pointer" }}>
            <Copy size={10} /> COPY
          </button>
        </div>
      )}

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "72px 16px 0" }}>
        {/* Back */}
        <button onClick={() => router.push("/zlogger")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.4)", fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px", cursor: "pointer", marginBottom: "20px" }}>
          <ArrowLeft size={12} /> BACK TO FEED
        </button>

        {/* ── Hero / Cover ── */}
        {zlog.cover_image_url ? (
          <div style={{ position: "relative", height: "220px", borderRadius: "14px", overflow: "hidden", marginBottom: "24px" }}>
            <img src={zlog.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,.85))" }} />
            <div style={{ position: "absolute", bottom: "20px", left: "20px", right: "20px" }}>
              <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "22px", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.2, textShadow: "0 2px 12px rgba(0,0,0,.8)" }}>{zlog.title}</h1>
            </div>
          </div>
        ) : (
          <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "24px", fontWeight: 900, color: "#fff", margin: "0 0 20px", lineHeight: 1.25 }}>{zlog.title}</h1>
        )}

        {/* ── Metadata row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }} className="reading-entry">
          {zlog.is_anonymous || !zlog.author ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${primary}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>👤</div>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: `${primary}80`, letterSpacing: "1px" }}>ANONYMOUS</span>
            </div>
          ) : (
            <Link href={`/u/${zlog.author.zid}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
              {zlog.author.avatar_url
                ? <img src={zlog.author.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                : <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${primary}33`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron',sans-serif", fontSize: "10px", color: primary }}>{zlog.author.display_name?.[0]?.toUpperCase() ?? "?"}</div>
              }
              <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,.85)" }}>{zlog.author.display_name}</span>
              {gen && <GenBadge gen={gen} size="sm" />}
            </Link>
          )}

          <span style={{ color: "rgba(255,255,255,.2)" }}>·</span>
          <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "1px" }}>{formatDate(zlog.created_at)}</span>

          {zlog.mood && (
            <>
              <span style={{ color: "rgba(255,255,255,.2)" }}>·</span>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: primary, letterSpacing: "1px" }}>{zlog.mood}</span>
            </>
          )}

          {isOwner && (
            <Link href={`/zlogger/edit/${zlog.id}`} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", background: `${primary}18`, border: `1px solid ${primary}30`, color: primary, fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", textDecoration: "none" }}>
              <Edit3 size={10} /> EDIT
            </Link>
          )}
        </div>

        {/* Response chain */}
        {zlog.responseTo && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", marginBottom: "20px", background: `${primary}0a`, border: `1px solid ${primary}25`, borderRadius: "8px" }}>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}80`, letterSpacing: "1px" }}>IN RESPONSE TO:</span>
            <Link href={`/zlogger/${zlog.responseTo.slug}`} style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: primary, textDecoration: "underline" }}>{zlog.responseTo.title}</Link>
          </div>
        )}

        {/* ── Article body ── */}
        <article
          ref={articleRef}
          className="zlog-body reading-entry"
          onMouseUp={handleTextSelect}
          onClick={() => { if (!window.getSelection()?.toString().trim()) setHighlightTooltip(null); }}
          dangerouslySetInnerHTML={{ __html: zlog.content_html || zlog.content_markdown }}
          style={{ marginBottom: "32px", lineHeight: 1.8 }}
        />

        {/* ── Engagement row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 0", borderTop: `1px solid ${primary}20`, borderBottom: `1px solid ${primary}20`, marginBottom: "32px", flexWrap: "wrap" }}>
          {[
            { type: "zap" as const, icon: <Zap size={14} />, label: "ZAP", color: "#FFD700" },
            { type: "vibe" as const, icon: <Waves size={14} />, label: "VIBE", color: "#00F7FF" },
            { type: "save" as const, icon: <Bookmark size={14} />, label: "SAVE", color: "#B4FF00" },
          ].map(({ type, icon, label, color }) => {
            const active = myEngagement.includes(type);
            return (
              <button
                key={type}
                className="eng-btn"
                onClick={() => handleEngage(type)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "8px 14px", borderRadius: "8px",
                  background: active ? `${color}18` : "rgba(255,255,255,.04)",
                  border: `1px solid ${active ? color : "rgba(255,255,255,.12)"}`,
                  color: active ? color : "rgba(255,255,255,.4)",
                  fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px",
                }}
              >
                {icon} {label} {engCounts[type] > 0 ? `(${engCounts[type]})` : ""}
              </button>
            );
          })}

          <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.25)", letterSpacing: "1px", marginLeft: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <MessageCircle size={11} /> {engCounts.comment} COMMENTS
          </span>

          <button
            onClick={handleEcho}
            style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: "8px", background: echoed ? "#B4FF0022" : "rgba(255,255,255,.04)", border: `1px solid ${echoed ? "#B4FF00" : "rgba(255,255,255,.12)"}`, color: echoed ? "#B4FF00" : "rgba(255,255,255,.4)", fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px", cursor: "pointer", transition: "all .15s" }}
          >
            {echoed ? "ECHOED!" : "ECHO"}
          </button>
        </div>

        {/* ── Comments ── */}
        <div>
          <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, color: primary, letterSpacing: "2px", margin: "0 0 16px" }}>COMMENTS</h2>

          {comments.length === 0 ? (
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.2)", letterSpacing: "1px", marginBottom: "24px" }}>NO COMMENTS YET. BE THE FIRST.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {comments.map(c => {
                const cGen = c.author
                  ? getGeneration(c.author.birth_year, c.author.birth_month, c.author.birth_day, false)
                  : null;
                return (
                  <div key={c.id} className="comment-item" style={{ padding: "12px 14px", background: "rgba(255,255,255,.03)", border: `1px solid rgba(255,255,255,.07)`, borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {c.author?.avatar_url
                        ? <img src={c.author.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                        : <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${primary}25`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", color: primary }}>{c.author?.display_name?.[0]?.toUpperCase() ?? "?"}</div>
                      }
                      <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,.8)" }}>{c.author?.display_name ?? "Unknown"}</span>
                      {cGen && <GenBadge gen={cGen} size="sm" />}
                      <span style={{ marginLeft: "auto", fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.25)", letterSpacing: "1px" }}>{formatRelTime(c.created_at)}</span>
                    </div>
                    <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "13px", color: "rgba(255,255,255,.7)", margin: 0, lineHeight: 1.6 }}>{c.content}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment input */}
          {viewerId ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="LEAVE A COMMENT..."
                rows={3}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(138,46,255,.07)", border: `1px solid ${primary}30`, borderRadius: "10px", color: "#fff", fontFamily: "'Nunito',sans-serif", fontSize: "13px", resize: "none", outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleComment}
                  disabled={commentPosting || !commentText.trim()}
                  style={{ padding: "10px 24px", borderRadius: "8px", background: commentPosting ? "rgba(138,46,255,.3)" : `linear-gradient(135deg, ${primary}, #00F7FF)`, border: "none", color: "#000", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "1px", cursor: commentPosting ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  {commentPosting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  {commentPosting ? "POSTING..." : "POST COMMENT"}
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.3)", letterSpacing: "1px" }}>
              <Link href="/login" style={{ color: primary }}>LOG IN</Link> TO COMMENT
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
