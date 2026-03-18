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
import { BookOpen, Plus, Loader2, Clock, Zap, Waves, Bookmark, MessageCircle } from "lucide-react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');
  body, html { overflow-x: hidden !important; }
  @keyframes zee-entry { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .zlog-entry { animation: zee-entry .25s ease both; }
  .zlog-card { transition: transform .18s ease, box-shadow .18s ease; }
  .zlog-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.5); }
  .filter-pill { transition: all .15s ease; cursor: pointer; border: 1px solid transparent; }
  .filter-pill:hover { opacity: .85; }
  .filter-pill.active { border-color: currentColor; }
`;

const MOOD_COLORS: Record<string, string> = {
  "💀 Dark":     "#6B21A8",
  "🔥 Lit":      "#DC2626",
  "💜 Vibe":     "#7C3AED",
  "🌊 Chill":    "#0369A1",
  "⚡ Charged":  "#CA8A04",
  "🌹 Romantic": "#BE185D",
  "🤖 Glitch":   "#059669",
  "🌙 Dreamy":   "#4338CA",
};

const FILTERS: { key: ZlogFilter; label: string }[] = [
  { key: "latest",     label: "LATEST" },
  { key: "trending",   label: "TRENDING" },
  { key: "anonymous",  label: "ANONYMOUS" },
  { key: "network",    label: "NETWORK" },
  { key: "gen_z",      label: "GEN Z" },
  { key: "millennial", label: "MILLENNIAL" },
];

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

function ZlogCard({ zlog, primary }: { zlog: ZlogListItem; primary: string }) {
  const gen = zlog.author
    ? getGeneration(zlog.author.birth_year, zlog.author.birth_month, zlog.author.birth_day, false)
    : null;
  const moodColor = zlog.mood ? MOOD_COLORS[zlog.mood] ?? primary : primary;

  return (
    <Link href={`/zlogger/${zlog.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div className="zlog-card" style={{
        background: "rgba(8,14,36,0.7)",
        border: `1px solid ${primary}22`,
        borderRadius: "14px",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(0,0,0,.35)",
      }}>
        {/* Cover image */}
        {zlog.cover_image_url && (
          <div style={{ height: "120px", overflow: "hidden", position: "relative" }}>
            <img src={zlog.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(8,14,36,.9))" }} />
          </div>
        )}

        <div style={{ padding: "14px 16px" }}>
          {/* Mood pill */}
          {zlog.mood && (
            <span style={{
              display: "inline-block", marginBottom: "8px",
              fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
              color: moodColor, background: `${moodColor}18`,
              border: `1px solid ${moodColor}40`, borderRadius: "4px", padding: "1px 7px",
            }}>{zlog.mood}</span>
          )}

          {/* Title */}
          <h3 style={{
            fontFamily: "'Orbitron',sans-serif", fontSize: "14px", fontWeight: 900,
            color: "#fff", margin: "0 0 8px", lineHeight: 1.3,
          }}>{zlog.title}</h3>

          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            {zlog.is_anonymous || !zlog.author ? (
              <>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${primary}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>👤</div>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: `${primary}80`, letterSpacing: "1px" }}>ANONYMOUS</span>
              </>
            ) : (
              <>
                {zlog.author.avatar_url
                  ? <img src={zlog.author.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                  : <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${primary}33`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", color: primary }}>{zlog.author.display_name?.[0]?.toUpperCase() ?? "?"}</div>
                }
                <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,.8)" }}>{zlog.author.display_name}</span>
                {gen && <GenBadge gen={gen} size="sm" />}
              </>
            )}
          </div>

          {/* Excerpt */}
          <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", color: "rgba(255,255,255,.5)", margin: "0 0 12px", lineHeight: 1.6 }}>
            {zlog.excerpt.slice(0, 160)}{zlog.excerpt.length > 160 ? "…" : ""}
          </p>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}60`, letterSpacing: "1px", display: "flex", alignItems: "center", gap: "3px" }}>
                <Clock size={9} /> ~{readingTime(zlog.excerpt)} MIN READ
              </span>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.2)", letterSpacing: "1px" }}>
                <Zap size={8} style={{ display: "inline" }} /> {zlog.engagementCounts.zap}
                {" · "}
                <Waves size={8} style={{ display: "inline" }} /> {zlog.engagementCounts.vibe}
                {" · "}
                <Bookmark size={8} style={{ display: "inline" }} /> {zlog.engagementCounts.save}
                {" · "}
                <MessageCircle size={8} style={{ display: "inline" }} /> {zlog.engagementCounts.comment}
              </span>
            </div>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.25)", letterSpacing: "1px" }}>
              {formatRelTime(zlog.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ZloggerFeedPage() {
  const router = useRouter();
  const [primary] = useState("#8A2EFF");
  const [filter, setFilter] = useState<ZlogFilter>("latest");
  const [zlogs, setZlogs] = useState<ZlogListItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    ? zlogs.filter(z => z.title.toLowerCase().includes(searchQuery.toLowerCase()) || z.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
    : zlogs;

  return (
    <div style={{ minHeight: "100vh", background: "#0B0B12", color: "#fff", fontFamily: "'Nunito',sans-serif", paddingBottom: "60px" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <ThemeEngine config={null} />
      <NavBar />

      {/* ── Header ── */}
      <div style={{ paddingTop: "72px", maxWidth: "800px", margin: "0 auto", padding: "72px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BookOpen size={20} color={primary} />
            <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "22px", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-1px" }}>ZLOGGER</h1>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: `${primary}60`, letterSpacing: "2px" }}>LONG-FORM</span>
          </div>
          {authed && (
            <button
              onClick={() => router.push("/zlogger/new")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "8px",
                background: `linear-gradient(135deg, ${primary}, #00F7FF)`,
                border: "none", color: "#000", fontFamily: "'Orbitron',sans-serif",
                fontSize: "9px", fontWeight: 700, letterSpacing: "1px", cursor: "pointer",
              }}
            >
              <Plus size={12} /> NEW ZLOG
            </button>
          )}
        </div>

        {/* ── Search ── */}
        <input
          type="text"
          placeholder="SEARCH ZLOGS..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px", marginBottom: "16px",
            background: "rgba(138,46,255,.08)", border: `1px solid ${primary}30`,
            borderRadius: "8px", color: "#fff", fontFamily: "'VT323',monospace",
            fontSize: "13px", letterSpacing: "1px", outline: "none", boxSizing: "border-box",
          }}
        />

        {/* ── Filter tabs ── */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "24px" }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`filter-pill${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "5px 12px", borderRadius: "6px",
                background: filter === f.key ? `${primary}22` : "rgba(255,255,255,.04)",
                border: `1px solid ${filter === f.key ? primary : "rgba(255,255,255,.1)"}`,
                color: filter === f.key ? primary : "rgba(255,255,255,.5)",
                fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px", cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Feed ── */}
        {loading && zlogs.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 size={24} color={primary} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", fontFamily: "'VT323',monospace", fontSize: "14px", color: "rgba(255,255,255,.25)", letterSpacing: "2px" }}>
            NO ZLOGS FOUND
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((z, i) => (
              <div key={z.id} className="zlog-entry" style={{ animationDelay: `${i * 0.05}s` }}>
                <ZlogCard zlog={z} primary={primary} />
              </div>
            ))}
          </div>
        )}

        {/* ── Load more ── */}
        {hasMore && !loading && filtered.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button
              onClick={() => loadZlogs(false)}
              style={{
                padding: "10px 28px", borderRadius: "8px",
                background: "transparent", border: `1px solid ${primary}40`,
                color: primary, fontFamily: "'Orbitron',sans-serif",
                fontSize: "9px", fontWeight: 700, letterSpacing: "1px", cursor: "pointer",
              }}
            >
              LOAD MORE
            </button>
          </div>
        )}

        {loading && zlogs.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
            <Loader2 size={20} color={primary} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}
      </div>
    </div>
  );
}
