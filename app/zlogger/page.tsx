"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import ThemeEngine from "@/components/ThemeEngine";
import GenBadge from "@/components/GenBadge";
import { getPublicZlogs, type ZlogListItem, type ZlogFilter } from "@/lib/supabase/queries";
import { getGeneration } from "@/lib/generation";
import {
  BookOpen, Plus, Loader2, Clock, Zap, Waves,
  Bookmark, MessageCircle, Search, TrendingUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES — injected once
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');

  body, html { overflow-x: hidden !important; }

  @keyframes zee-entry    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes zee-marquee  { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
  @keyframes zee-led      { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes zee-online   { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes zee-scanbar  { 0%{transform:translateY(-100%);opacity:.55} 100%{transform:translateY(300%);opacity:0} }
  @keyframes spin         { to{transform:rotate(360deg)} }
  @keyframes zee-blink    { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes zee-pulse    { 0%,100%{box-shadow:0 0 4px rgba(138,46,255,.5)} 50%{box-shadow:0 0 16px rgba(138,46,255,.9),0 0 32px rgba(138,46,255,.3)} }

  .zlog-entry  { animation: zee-entry .3s ease both; }
  .zee-led     { animation: zee-led 2.4s ease-in-out infinite; }
  .zee-cursor::after { content:"▌"; animation:zee-blink .85s step-end infinite; color:inherit; opacity:.65; }

  /* Card hover with scanbar sweep */
  .zlog-card {
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    position: relative; overflow: hidden;
  }
  .zlog-card::before {
    content:""; position:absolute; left:0; right:0; top:0;
    height:40%; background:linear-gradient(180deg,rgba(255,255,255,.07) 0%,transparent 100%);
    transform:translateY(-100%); pointer-events:none; z-index:30; opacity:0;
  }
  .zlog-card:hover { transform: translateY(-3px); }
  .zlog-card:hover::before { opacity:1; animation: zee-scanbar 2s ease-in infinite; }

  /* Filter pill bracket on active */
  .fpill-active::before { content:"[ "; }
  .fpill-active::after  { content:" ]"; }

  /* Cover image scanlines */
  .cover-scanlines::after {
    content:""; position:absolute; inset:0; pointer-events:none;
    background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.14) 2px,rgba(0,0,0,.14) 4px);
  }

  /* Mobile */
  @media (max-width: 640px) {
    .zlog-meta-row { flex-direction: column !important; gap: 4px !important; }
    .filter-scroll { overflow-x: auto; flex-wrap: nowrap !important; padding-bottom: 4px; scrollbar-width: none; }
    .filter-scroll::-webkit-scrollbar { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .zlog-card::before, .zee-led { animation: none !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS — unchanged
// ─────────────────────────────────────────────────────────────────────────────

const MOOD_COLORS: Record<string, string> = {
  "💀 Dark": "#9333EA",
  "🔥 Lit": "#EF4444",
  "💜 Vibe": "#8A2EFF",
  "🌊 Chill": "#0EA5E9",
  "⚡ Charged": "#EAB308",
  "🌹 Romantic": "#EC4899",
  "🤖 Glitch": "#10B981",
  "🌙 Dreamy": "#6366F1",
};

const MOOD_EMOJI: Record<string, string> = {
  "💀 Dark": "💀", "🔥 Lit": "🔥", "💜 Vibe": "💜", "🌊 Chill": "🌊",
  "⚡ Charged": "⚡", "🌹 Romantic": "🌹", "🤖 Glitch": "🤖", "🌙 Dreamy": "🌙",
};

const FILTERS: { key: ZlogFilter; label: string; icon?: string }[] = [
  { key: "latest", label: "LATEST", icon: "⊕" },
  { key: "trending", label: "TRENDING", icon: "↑" },
  { key: "anonymous", label: "ANON", icon: "👤" },
  { key: "network", label: "NETWORK", icon: "✦" },
  { key: "gen_z", label: "GEN Z", icon: "⚡" },
  { key: "millennial", label: "MILLENNIAL", icon: "📼" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS — unchanged
// ─────────────────────────────────────────────────────────────────────────────

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function readingTime(excerpt: string): number {
  return Math.max(1, Math.round(excerpt.split(/\s+/).filter(Boolean).length / 200));
}

const getAvatar = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

// ─────────────────────────────────────────────────────────────────────────────
//  PORTAL CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function PortalCard({ children, accent = "rgba(138,46,255,.2)", style }: {
  children: React.ReactNode; accent?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "rgba(10,16,42,.92)", backdropFilter: "blur(14px)",
      border: `1px solid ${accent}`,
      borderRadius: "12px", overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODULE HEADER
// ─────────────────────────────────────────────────────────────────────────────

function ModuleHeader({ icon, title, accent = "#8A2EFF", right }: {
  icon: React.ReactNode; title: string; accent?: string; right?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 14px 9px 12px",
      background: `linear-gradient(90deg,${accent}22 0%,transparent 100%)`,
      borderBottom: `1px solid ${accent}30`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <div className="zee-led" style={{ width: "3px", height: "16px", background: `linear-gradient(180deg,${accent},${accent}44)`, borderRadius: "1px", flexShrink: 0, boxShadow: `0 0 6px ${accent}` }} />
        <span style={{ color: accent, display: "flex", alignItems: "center" }}>{icon}</span>
        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.8px" }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  EMPTY TERMINAL STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyTerminal({ primary }: { primary: string }) {
  return (
    <div style={{ padding: "48px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", border: `1px dashed ${primary}28`, borderRadius: "10px", background: `${primary}04` }}>
      <div style={{ display: "flex", gap: "5px" }}>
        {["#FF5F56", "#FFBD2E", "#27C93F"].map(c => (
          <div key={c} style={{ width: "8px", height: "8px", borderRadius: "50%", background: c, opacity: .35 }} />
        ))}
      </div>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: `${primary}55`, letterSpacing: "1.5px", textAlign: "left", alignSelf: "stretch" }}>
        <span style={{ color: "#B4FF00", opacity: .6 }}>zeezu@zlogger</span>
        <span style={{ color: "rgba(255,255,255,.25)" }}>:</span>
        <span style={{ color: primary, opacity: .7 }}>~$</span>
        {" "}<span style={{ color: "rgba(255,255,255,.35)" }}>ls -la ./posts/</span>
        <span style={{ display: "block", marginTop: "4px", color: "rgba(255,255,255,.12)" }}>total 0</span>
        <span style={{ display: "block", color: "rgba(255,255,255,.08)" }}>drwxr-xr-x  0 zeezu  zlogger  0B</span>
      </div>
      <p style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,255,255,.25)", letterSpacing: "2.5px", margin: 0 }}>NO ZLOGS FOUND</p>
      <span className="zee-cursor" style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: primary, opacity: .5, letterSpacing: "1px", alignSelf: "flex-start" }}>
        zeezu@zlogger:~$
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ZLOG CARD — Y2K LiveJournal/Xanga portal aesthetic
// ─────────────────────────────────────────────────────────────────────────────

function ZlogCard({ zlog, primary }: { zlog: ZlogListItem; primary: string }) {
  const gen = zlog.author
    ? getGeneration(zlog.author.birth_year, zlog.author.birth_month, zlog.author.birth_day, false)
    : null;

  const moodColor = zlog.mood ? MOOD_COLORS[zlog.mood] ?? primary : primary;
  const moodEmoji = zlog.mood ? MOOD_EMOJI[zlog.mood] ?? "✨" : null;

  return (
    <Link href={`/zlogger/${zlog.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="zlog-card"
        style={{
          background: "rgba(10,16,42,.9)",
          border: `1px solid ${primary}22`,
          borderRadius: "12px",
          backdropFilter: "blur(14px)",
          boxShadow: "0 4px 24px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.03)",
        }}
      >
        {/* Y2K portal top strip */}
        <div style={{
          height: "2px",
          background: `linear-gradient(90deg,${moodColor} 0%,${primary} 40%,#00E5FF 100%)`,
          boxShadow: `0 0 8px ${moodColor}60`,
        }} />

        {/* Cover image with CRT scanline overlay */}
        {zlog.cover_image_url && (
          <div className="cover-scanlines" style={{ height: "130px", overflow: "hidden", position: "relative" }}>
            <img
              src={zlog.cover_image_url} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.85) brightness(0.8)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(10,16,42,.95))" }} />
            {/* Mood badge over cover */}
            {moodEmoji && (
              <div style={{ position: "absolute", top: "10px", right: "10px", padding: "3px 8px", borderRadius: "4px", background: `${moodColor}33`, border: `1px solid ${moodColor}55`, backdropFilter: "blur(8px)", fontFamily: "'VT323',monospace", fontSize: "11px", color: moodColor, letterSpacing: "1px" }}>
                {moodEmoji} {zlog.mood}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: "14px 16px 12px" }}>
          {/* Mood pill (no cover) */}
          {!zlog.cover_image_url && zlog.mood && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "8px", padding: "2px 8px", borderRadius: "4px", background: `${moodColor}15`, border: `1px solid ${moodColor}35` }}>
              <span>{moodEmoji}</span>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: moodColor, letterSpacing: "1px" }}>{zlog.mood}</span>
            </div>
          )}

          {/* Title — Orbitron Y2K */}
          <h3 style={{
            fontFamily: "'Orbitron',sans-serif", fontSize: "13px", fontWeight: 900,
            color: "#fff", margin: "0 0 10px", lineHeight: 1.35,
            letterSpacing: "-0.3px",
            textShadow: `0 0 20px ${primary}40`,
          }}>
            {zlog.title}
          </h3>

          {/* Author row — terminal style */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            {zlog.is_anonymous || !zlog.author ? (
              <>
                <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: `${primary}18`, border: `1px solid ${primary}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>👤</div>
                <div>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: `${primary}70`, letterSpacing: "1.5px" }}>ANONYMOUS</span>
                </div>
              </>
            ) : (
              <>
                {/* Avatar with online dot */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "6px", overflow: "hidden", border: `1px solid ${primary}30` }}>
                    {zlog.author.avatar_url
                      ? <img src={zlog.author.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : <img src={getAvatar(zlog.author.zid ?? "")} alt="" style={{ width: "100%", height: "100%", display: "block" }} />
                    }
                  </div>
                  <span style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "7px", height: "7px", borderRadius: "50%", background: "#6BCB77", border: "1.5px solid #070C1E", boxShadow: "0 0 4px #6BCB77", animation: "zee-online 2.2s ease-in-out infinite" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {zlog.author.display_name}
                    </span>
                    {gen && <GenBadge gen={gen} size="sm" />}
                  </div>
                  {zlog.author.zid && (
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.25)", letterSpacing: "1px" }}>
                      <span style={{ color: "#00E5FF", opacity: .4 }}>@</span>{zlog.author.zid}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Excerpt */}
          <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", color: "rgba(255,255,255,.48)", margin: "0 0 12px", lineHeight: 1.65, wordBreak: "break-word" }}>
            {zlog.excerpt.slice(0, 155)}{zlog.excerpt.length > 155 ? "…" : ""}
          </p>

          {/* Footer — Y2K segment display style */}
          <div className="zlog-meta-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>

            {/* Left: read time + engagement */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* Reading time — terminal clock */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}70`, letterSpacing: "1px", background: `${primary}0a`, border: `1px solid ${primary}18`, borderRadius: "3px", padding: "1px 6px" }}>
                <Clock size={8} /> ~{readingTime(zlog.excerpt)} MIN
              </span>

              {/* Engagement counts — LCD segment style */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.22)", letterSpacing: "0.5px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "#FFD70060" }}><Zap size={8} />{zlog.engagementCounts.zap}</span>
                <span style={{ opacity: .3 }}>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "#00E5FF55" }}><Waves size={8} />{zlog.engagementCounts.vibe}</span>
                <span style={{ opacity: .3 }}>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "#B4FF0055" }}><Bookmark size={8} />{zlog.engagementCounts.save}</span>
                <span style={{ opacity: .3 }}>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "#FF007A55" }}><MessageCircle size={8} />{zlog.engagementCounts.comment}</span>
              </span>
            </div>

            {/* Right: relative timestamp */}
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.22)", letterSpacing: "1px", flexShrink: 0 }}>
              {formatRelTime(zlog.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE COMPONENT — all Supabase logic unchanged
// ─────────────────────────────────────────────────────────────────────────────

export default function ZloggerFeedPage() {
  const router = useRouter();
  const primary = "#8A2EFF";
  const secondary = "#00E5FF";

  // ── State — ALL UNCHANGED ──────────────────────────────────────
  const [filter, setFilter] = useState<ZlogFilter>("latest");
  const [zlogs, setZlogs] = useState<ZlogListItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── loadZlogs — UNCHANGED ─────────────────────────────────────
  const loadZlogs = useCallback(async (reset = false) => {
    setLoading(true);
    const c = reset ? undefined : cursor;
    const data = await getPublicZlogs(filter, c);
    if (reset) {
      setZlogs(data);
    } else {
      setZlogs(prev => [...prev, ...data]);
    }
    setHasMore(data.length === 20);
    if (data.length > 0) setCursor(data[data.length - 1].created_at);
    setLoading(false);
  }, [filter, cursor]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
  }, []);

  useEffect(() => {
    setCursor(undefined);
    loadZlogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filtered = searchQuery
    ? zlogs.filter(z =>
      z.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
    : zlogs;

  // ─────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070C1E",
      backgroundImage: `
        radial-gradient(ellipse 70% 45% at 50% 0%, rgba(138,46,255,.14) 0%, transparent 60%),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='.65' fill='rgba(255,255,255,.04)'/%3E%3C/svg%3E")
      `,
      color: "#fff",
      fontFamily: "'Nunito',sans-serif",
      paddingBottom: "56px",
    }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <ThemeEngine config={null} />

      {/* CRT scanline overlay */}
      <div aria-hidden="true" style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 999, opacity: 0.032, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.45) 2px,rgba(0,0,0,.45) 4px)" }} />

      <NavBar />

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "80px 16px 0" }}>

        {/* ════════════════════════════════════════════════════════
            PORTAL TITLE BAR — LiveJournal/Xanga era header
        ════════════════════════════════════════════════════════ */}
        <PortalCard accent={`${primary}30`} style={{ marginBottom: "20px" }}>
          {/* Gradient banner — Y2K portal style */}
          <div style={{
            background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)",
            padding: "16px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "12px",
            position: "relative", overflow: "hidden",
            borderBottom: "1px solid rgba(255,255,255,.07)",
          }}>
            {/* Scanline texture on header */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 4px)", pointerEvents: "none" }} />

            {/* Corner glow */}
            <div aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "100px", background: `radial-gradient(ellipse at 100% 0%, rgba(0,229,255,.18) 0%, transparent 60%)`, pointerEvents: "none" }} />

            {/* Left: Logo + title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
              {/* Zeezu flag */}
              <svg width="20" height="17" viewBox="0 0 70 58" style={{ flexShrink: 0 }}>
                <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill="#8A2EFF" />
                <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill="#00E5FF" />
                <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6" />
                <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9" />
              </svg>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "18px", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.5px", textShadow: "0 0 20px rgba(138,46,255,.4)" }}>
                    ZLOGGER
                  </h1>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "2px", background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "3px", padding: "1px 6px" }}>
                    LONG-FORM
                  </span>
                </div>
                <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.4)", letterSpacing: "1.5px", margin: "2px 0 0" }}>
                  ZEEZU NETWORK · PERSONAL WEBLOGS
                </p>
              </div>
            </div>

            {/* Right: New Zlog CTA */}
            {authed && (
              <button
                onClick={() => router.push("/zlogger/new")}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "8px",
                  background: "rgba(0,0,0,.35)",
                  border: `1px solid ${secondary}55`,
                  color: secondary,
                  fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700,
                  letterSpacing: "1px", cursor: "pointer", transition: "all .18s",
                  boxShadow: `0 0 12px ${secondary}25`,
                  zIndex: 1, flexShrink: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${secondary}18`; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${secondary}45`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,.35)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 12px ${secondary}25`; }}
              >
                <Plus size={12} />
                NEW ZLOG
              </button>
            )}
          </div>

          {/* ── SEARCH + FILTER ROW ── */}
          <div style={{ padding: "12px 14px", background: "rgba(0,0,0,.25)", borderBottom: `1px solid ${primary}12` }}>
            {/* Search input — Y2K terminal style */}
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <Search size={12} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(138,46,255,.45)" }} />
              <input
                type="text"
                placeholder="SEARCH THE NETWORK..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px 8px 32px",
                  background: "rgba(138,46,255,.07)",
                  border: `1px solid ${primary}25`,
                  borderRadius: "7px", color: "#fff",
                  fontFamily: "'VT323',monospace", fontSize: "12px",
                  letterSpacing: "1px", outline: "none",
                  transition: "border-color .2s", boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = `${primary}60`)}
                onBlur={e => (e.target.style.borderColor = `${primary}25`)}
              />
              {searchQuery && (
                <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}60`, letterSpacing: "1px" }}>
                  {filtered.length} RESULTS
                </span>
              )}
            </div>

            {/* Filter pills — Y2K nav tab style */}
            <div className="filter-scroll" style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  className={filter === f.key ? "fpill-active" : ""}
                  onClick={() => setFilter(f.key)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "4px 10px", borderRadius: "5px", cursor: "pointer",
                    background: filter === f.key ? `${primary}20` : "rgba(255,255,255,.04)",
                    border: `1px solid ${filter === f.key ? primary : "rgba(255,255,255,.1)"}`,
                    color: filter === f.key ? primary : "rgba(255,255,255,.45)",
                    fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1.5px",
                    transition: "all .15s",
                    boxShadow: filter === f.key ? `0 0 8px ${primary}30` : "none",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "10px", opacity: .7 }}>{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </PortalCard>

        {/* ════════════════════════════════════════════════════════
            FEED — Y2K portal card entries
        ════════════════════════════════════════════════════════ */}
        <PortalCard accent={`${primary}20`}>
          <ModuleHeader
            icon={<BookOpen size={11} />}
            title={searchQuery ? `RESULTS FOR "${searchQuery.toUpperCase()}"` : filter.toUpperCase().replace("_", " ") + " ZLOGS"}
            accent={primary}
            right={
              !loading && filtered.length > 0
                ? <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(138,46,255,.5)", letterSpacing: "1px" }}>
                  {filtered.length} ENTRIES
                </span>
                : undefined
            }
          />

          <div style={{ padding: "12px" }}>
            {/* Loading — first load */}
            {loading && zlogs.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "14px" }}>
                <div style={{ position: "relative", width: "44px", height: "44px" }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(138,46,255,.18)" }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: primary, animation: "spin 1s linear infinite" }} />
                </div>
                <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: `${primary}55`, letterSpacing: "3px" }}>LOADING NETWORK...</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <EmptyTerminal primary={primary} />
            )}

            {/* Feed entries */}
            {filtered.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filtered.map((z, i) => (
                  <div key={z.id} className="zlog-entry" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}>
                    <ZlogCard zlog={z} primary={primary} />
                  </div>
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && !loading && filtered.length > 0 && !searchQuery && (
              <div style={{ textAlign: "center", marginTop: "16px", paddingTop: "12px", borderTop: `1px solid ${primary}12` }}>
                <button
                  onClick={() => loadZlogs(false)}
                  style={{
                    padding: "8px 28px", borderRadius: "8px",
                    background: "transparent",
                    border: `1px solid ${primary}35`,
                    color: primary,
                    fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700,
                    letterSpacing: "1px", cursor: "pointer", transition: "all .18s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${primary}12`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${primary}70`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = `${primary}35`; }}
                >
                  LOAD MORE ENTRIES
                </button>
              </div>
            )}

            {/* Loading more */}
            {loading && zlogs.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                <Loader2 size={18} color={primary} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}
          </div>

          {/* Footer count bar */}
          {filtered.length > 0 && (
            <div style={{ padding: "8px 14px", borderTop: `1px solid ${primary}10`, background: "rgba(0,0,0,.15)", textAlign: "center" }}>
              <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.13)", letterSpacing: "2px", margin: 0 }}>
                ZLOGGER · ZEEZU NETWORK · LONG-FORM WRITING · THE INTERNET AFTER DARK
              </p>
            </div>
          )}
        </PortalCard>
      </div>

      {/* ── MARQUEE TICKER ── */}
      <div aria-hidden="true" style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "26px", background: `linear-gradient(90deg,${primary}60 0%,#0B4B8F 50%,${primary}60 100%)`, borderTop: `1px solid ${primary}50`, display: "flex", alignItems: "center", overflow: "hidden", zIndex: 20, boxShadow: `0 -2px 16px ${primary}22` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.12) 2px,rgba(0,0,0,.12) 3px)", pointerEvents: "none" }} />
        <div style={{ display: "flex", whiteSpace: "nowrap", animation: "zee-marquee 40s linear infinite", fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.5)", letterSpacing: "2px", position: "relative", zIndex: 1 }}>
          {"✦ ZLOGGER · ZEEZU NETWORK · LONG-FORM WRITING · NO ALGORITHM · JUST PEOPLE · PERSONAL WEBLOGS SINCE 2024 · ".repeat(4)}
        </div>
      </div>
    </div>
  );
}