"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import ProfileCard from "@/components/ProfileCard";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import { AGENT_IDS } from "@/lib/agents";
import ThemeEngine, { DEFAULT_THEME } from "@/components/ThemeEngine";
import { PersonalInfoData, FIELD_DEFS, buildHexItems } from "@/components/PersonalInfoEditor";
import {
  getFriendshipStatus, sendFriendRequest, cancelFriendRequest,
  respondToFriendRequest, removeFriend, getFriendCount, getMutualFriends,
  getCoreEight, addToCoreEight, removeFromCoreEight, updateOnlineStatus,
  getUserZlogs,
  type FriendshipStatus, type OnlineStatus, type ZlogListItem,
} from "@/lib/supabase/queries";
import {
  Zap, MessageCircle, Flame, Shield, Snowflake,
  Play, Pause, Share2, Clock, Camera,
  Edit3, Image as ImageIcon, Pencil, Award, Settings,
  UserPlus, UserCheck, Loader2, Check, X,
  Globe, Github, Instagram, Link as LinkIcon, Users,
  Eye, Music, Activity,
  Cake, VenetianMask, Ruler, MapPin, Heart, Search, Briefcase, Tag,
  GraduationCap, BookOpen, Star, Home, Scale, PawPrint, Baby,
  Wine, Wind, Leaf, Sparkles,
  Twitter, Youtube, Linkedin, Twitch,
  ScrollText, ChevronDown, UserCircle, Info,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import NavBar from "@/components/NavBar";
import GlobalFeed from "@/components/GlobalFeed";
import ShareSheet from "@/components/ShareSheet";

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES — unchanged
// ─────────────────────────────────────────────────────────────────────────────

type ProfileUser = {
  id: string; zid: string; display_name: string; mdx_profile: string | null;
  theme_track_url: string | null; influence_score: number;
  status_message: string | null; status_updated_at: string | null;
  online_status: string | null;
  avatar_url: string | null; social_links: Record<string, string> | null;
  birth_year?: number | null; birth_month?: number | null; birth_day?: number | null;
  agent_state?: { agent_id: string } | null;
  personal_info?: PersonalInfoData | null;
};
type Customization = {
  theme_id: string; primary_color: string; secondary_color: string;
  background_url: string | null; background_tiling: boolean; background_opacity: number;
};
type CoreSlot = {
  position: number;
  friend: { id: string; display_name: string; zid: string } | null;
};
type Post = {
  id: number; content: string; created_at: string; zaps: number;
  author: {
    id: string; display_name: string; zid: string;
    birth_year?: number | null; birth_month?: number | null; birth_day?: number | null;
    agent_state?: { agent_id: string } | null;
  } | null;
};
type Vibes = { trustworthy_score: number; cool_score: number; sexy_score: number };

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS — unchanged
// ─────────────────────────────────────────────────────────────────────────────

const getAvatar = (seed: string, style = "avataaars") =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

const getInfluenceTier = (score: number) => {
  if (score >= 100) return { label: "LEGENDARY", color: "#FFD700", glow: "rgba(255,215,0,0.4)" };
  if (score >= 50) return { label: "ICON", color: "#FF2D87", glow: "rgba(255,45,135,0.4)" };
  if (score >= 20) return { label: "RISING", color: "#00F7FF", glow: "rgba(0,247,255,0.4)" };
  return { label: "USER", color: "#888888", glow: "rgba(136,136,136,0.2)" };
};

// Unique gradient for each mood (synced with GlobalFeed)
const getMoodStyle = (mood: string) => {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    "⚡ Wired": { bg: "linear-gradient(135deg, rgba(255,45,135,0.15), rgba(168,85,247,0.08))", border: "rgba(255,45,135,0.25)", text: "#a855f7" },
    "🔥 On Fire": { bg: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.08))", border: "rgba(249,115,22,0.25)", text: "#f97316" },
    "💭 Thinking": { bg: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))", border: "rgba(99,102,241,0.25)", text: "#818cf8" },
    "🎵 Vibing": { bg: "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(6,182,212,0.08))", border: "rgba(20,184,166,0.25)", text: "#2dd4bf" },
    "🌙 Late Night": { bg: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.08))", border: "rgba(59,130,246,0.25)", text: "#60a5fa" },
    "☕ Caffeinated": { bg: "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(245,158,11,0.08))", border: "rgba(217,119,6,0.25)", text: "#fbbf24" },
    "🚀 Grinding": { bg: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.08))", border: "rgba(16,185,129,0.25)", text: "#34d399" },
    "💀 Dead": { bg: "linear-gradient(135deg, rgba(244,63,94,0.15), rgba(251,113,133,0.08))", border: "rgba(244,63,94,0.25)", text: "#fb7185" },
  };
  if (map[mood]) return map[mood];
  const colors = Object.values(map);
  let hash = 0;
  for (let i = 0; i < mood.length; i++) hash = mood.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Mood emoji mapping for status message (MySpace-style)
const getMoodEmoji = (msg: string | null): string => {
  if (!msg) return "🌐";
  const m = msg.toLowerCase();
  if (m.includes("happy") || m.includes("good") || m.includes("great")) return "😊";
  if (m.includes("vib") || m.includes("chill")) return "😎";
  if (m.includes("sad") || m.includes("miss")) return "😔";
  if (m.includes("excit") || m.includes("hype")) return "🤩";
  if (m.includes("tired") || m.includes("sleep")) return "😴";
  if (m.includes("love") || m.includes("💕") || m.includes("♥")) return "🥰";
  if (m.includes("work") || m.includes("busy")) return "💼";
  return "✨";
};

// Post date separator label (Facebook 2006 Mini-Feed style)
const getDateLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isToday(d)) return "TODAY";
  if (isYesterday(d)) return "YESTERDAY";
  return format(d, "MMM d").toUpperCase();
};

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function ModuleHeader({
  icon, title, accent = "#FF2D87", right,
}: {
  icon: React.ReactNode; title: string; accent?: string; right?: React.ReactNode;
}) {
  return (
    <div className="zee-module-hdr" style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 14px 9px 12px",
      background: `linear-gradient(90deg,${accent}22 0%,transparent 100%)`,
      borderBottom: `1px solid ${accent}30`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <div className="zee-led" style={{ width: "3px", height: "16px", background: `linear-gradient(180deg,${accent},${accent}44)`, borderRadius: "1px", flexShrink: 0, boxShadow: `0 0 6px ${accent}` }} />
        <span style={{ color: accent, display: "flex", alignItems: "center" }}>{icon}</span>
        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.8px" }}>
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

function PortalCard({
  children, accent = "rgba(255,45,135,.2)", style, className = "",
}: {
  children: React.ReactNode; accent?: string; style?: React.CSSProperties; className?: string;
}) {
  return (
    <div className={className} style={{
      background: "rgba(10,16,42,.92)", backdropFilter: "blur(14px)",
      border: `1px solid ${accent}`, borderRadius: "12px", overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FRIEND BUTTON — unchanged logic
// ─────────────────────────────────────────────────────────────────────────────

function FriendButton({
  friendStatus, friendLoading, primary, secondary, compact,
  onAdd, onCancel, onAccept, onDecline, onRemove,
}: {
  friendStatus: FriendshipStatus; friendLoading: boolean;
  primary: string; secondary: string; compact?: boolean;
  onAdd: () => void; onCancel: () => void;
  onAccept: () => void; onDecline: () => void; onRemove: () => void;
}) {
  const b: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "4px",
    padding: compact ? "6px 10px" : "7px 14px",
    borderRadius: "8px", fontFamily: "'Orbitron',sans-serif",
    fontSize: compact ? "9px" : "10px", fontWeight: 700,
    letterSpacing: "0.5px", cursor: "pointer", transition: "all .18s",
    border: "none", whiteSpace: "nowrap" as const,
  };
  if (friendLoading) return <div style={{ ...b, background: "rgba(255,45,135,.15)", border: "1px solid rgba(255,45,135,.3)", color: "rgba(255,255,255,.4)" }}><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /></div>;
  if (friendStatus.status === "none") return <button onClick={onAdd}
    style={{ ...b, background: `linear-gradient(135deg,${primary},${primary}cc)`, color: "#fff", boxShadow: `0 0 12px ${primary}50` }}
    onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = `0 0 22px ${primary}90`; el.style.transform = "translateY(-1px)"; el.style.filter = "brightness(1.15)"; }}
    onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = `0 0 12px ${primary}50`; el.style.transform = ""; el.style.filter = ""; }}
  ><UserPlus size={11} /> Add Friend</button>;
  if (friendStatus.status === "pending_sent") return <button onClick={onCancel}
    style={{ ...b, background: "transparent", border: "1px solid rgba(255,189,45,.4)", color: "#FFD93D" }}
    onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "rgba(255,189,45,.08)"; el.style.borderColor = "rgba(255,189,45,.7)"; }}
    onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "transparent"; el.style.borderColor = "rgba(255,189,45,.4)"; }}
  ><span style={{ fontSize: "9px" }}>⏱</span> Sent</button>;
  if (friendStatus.status === "pending_received") return (
    <div style={{ display: "flex", gap: "5px" }}>
      <button onClick={onAccept}
        style={{ ...b, background: "linear-gradient(135deg,#B4FF00,#6BCB77)", color: "#000" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.filter = "brightness(1.12)"; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 0 16px rgba(180,255,0,.4)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.filter = ""; el.style.transform = ""; el.style.boxShadow = ""; }}
      ><Check size={11} /> Accept</button>
      <button onClick={onDecline}
        style={{ ...b, background: "transparent", border: "1px solid rgba(255,80,80,.35)", color: "#FF6B6B" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "rgba(255,80,80,.08)"; el.style.borderColor = "rgba(255,80,80,.6)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "transparent"; el.style.borderColor = "rgba(255,80,80,.35)"; }}
      ><X size={11} /> Decline</button>
    </div>
  );
  if (friendStatus.status === "friends") return (
    <button onClick={onRemove} style={{ ...b, background: "transparent", border: `1px solid ${secondary}55`, color: secondary }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#FF6B6B"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#FF6B6B55"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = secondary; (e.currentTarget as HTMLButtonElement).style.borderColor = `${secondary}55`; }}
    >
      <UserCheck size={11} /> Friends
    </button>
  );
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  VIBES MODULE — desktop bars | mobile pills
// ─────────────────────────────────────────────────────────────────────────────

function VibesModule({
  vibes, viewerId, isOwner, primary, isMobile,
  myRating, ratingOpen, ratingDraft, ratingSubmitting, ratingDone,
  setRatingOpen, setRatingDraft, onRate,
}: {
  vibes: Vibes | null; viewerId: string | null; isOwner: boolean; primary: string; isMobile: boolean;
  myRating: { trust: number; cool: number; sexy: number } | null;
  ratingOpen: boolean;
  ratingDraft: { trust: number; cool: number; sexy: number };
  ratingSubmitting: boolean; ratingDone: boolean;
  setRatingOpen: (v: boolean) => void;
  setRatingDraft: React.Dispatch<React.SetStateAction<{ trust: number; cool: number; sexy: number }>>;
  onRate: () => void;
}) {
  const CATS = [
    { key: "trustworthy_score" as keyof Vibes, dk: "trust" as const, label: "TRUST", icon: "🛡", color: "#B4FF00" },
    { key: "cool_score" as keyof Vibes, dk: "cool" as const, label: "COOL", icon: "❄", color: "#00E5FF" },
    { key: "sexy_score" as keyof Vibes, dk: "sexy" as const, label: "SEXY", icon: "🔥", color: "#FF007A" },
  ];

  const RateBtn = () => (
    <button onClick={() => setRatingOpen(true)} style={{ width: "100%", padding: "7px", borderRadius: "7px", background: myRating ? "rgba(180,255,0,.06)" : "transparent", border: `1px solid ${myRating ? "#B4FF0030" : `${primary}25`}`, color: myRating ? "#B4FF00" : primary, fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1.5px", cursor: "pointer", transition: "all .2s" }}>
      {myRating ? "✓ RATED · UPDATE" : "⚡ RATE THEIR VIBES"}
    </button>
  );

  const RatingForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {CATS.map(c => (
        <div key={c.key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1.5px", color: c.color }}>{c.icon} {c.label}</span>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: c.color }}>{ratingDraft[c.dk]}/5</span>
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRatingDraft(p => ({ ...p, [c.dk]: n }))} style={{ flex: 1, height: "24px", borderRadius: "5px", cursor: "pointer", background: ratingDraft[c.dk] >= n ? `${c.color}18` : "rgba(255,255,255,.03)", border: `1px solid ${ratingDraft[c.dk] >= n ? c.color : "#2a2a2a"}`, color: ratingDraft[c.dk] >= n ? c.color : "#444", fontFamily: "'VT323',monospace", fontSize: "11px", transition: "all .12s" }}>{n}</button>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: "5px" }}>
        <button onClick={onRate} disabled={ratingSubmitting || ratingDone} style={{ flex: 1, padding: "7px", borderRadius: "7px", border: "none", background: ratingDone ? "#B4FF00" : `linear-gradient(135deg,${primary},${primary}cc)`, color: ratingDone ? "#000" : "#fff", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, cursor: ratingSubmitting ? "not-allowed" : "pointer", opacity: ratingSubmitting ? .6 : 1, transition: "all .2s" }}>
          {ratingDone ? "✓ SAVED!" : ratingSubmitting ? "..." : myRating ? "UPDATE" : "SUBMIT"}
        </button>
        <button onClick={() => { setRatingOpen(false); if (myRating) setRatingDraft(() => myRating!); else setRatingDraft(() => ({ trust: 3, cool: 3, sexy: 3 })); }} style={{ padding: "7px 10px", borderRadius: "7px", background: "transparent", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.35)", fontFamily: "'VT323',monospace", fontSize: "10px", cursor: "pointer" }}>✕</button>
      </div>
    </div>
  );

  return (
    <PortalCard accent="rgba(255,0,122,.2)">
      <ModuleHeader icon={<Flame size={11} />} title="VIBES" accent="#FF007A" right={myRating && !ratingOpen ? <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#B4FF00", letterSpacing: "1px" }}>✓ RATED</span> : undefined} />
      <div style={{ padding: "12px" }}>
        {!isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {vibes ? CATS.map(c => (
              <div key={c.key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1.5px", color: c.color }}>{c.icon} {c.label}</span>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: c.color, fontWeight: 700 }}>{vibes[c.key]}</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,.06)", borderRadius: "2px", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,.4)" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, vibes[c.key])}%`, background: `linear-gradient(90deg,${c.color}cc,${c.color})`, boxShadow: `0 0 8px ${c.color},0 0 14px ${c.color}55`, borderRadius: "2px", transition: "width .8s cubic-bezier(.4,0,.2,1)" }} />
                </div>
              </div>
            )) : <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.2)", textAlign: "center", padding: "8px 0", letterSpacing: "1px" }}>NO VIBES YET</p>}
            {viewerId && !isOwner && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: "8px" }}>
                {ratingOpen ? <RatingForm /> : <RateBtn />}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {vibes && (
              <div style={{ display: "flex", gap: "6px" }}>
                {CATS.map(c => (
                  <div key={c.key} style={{ flex: 1, background: "rgba(0,0,0,.3)", border: `1px solid ${c.color}22`, borderRadius: "8px", padding: "7px 0", textAlign: "center" }}>
                    <span style={{ fontSize: "15px", display: "block", lineHeight: 1, marginBottom: "2px" }}>{c.icon}</span>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 900, color: c.color, lineHeight: 1 }}>{vibes[c.key]}%</span>
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.25)", display: "block", letterSpacing: "1px", marginTop: "2px" }}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
            {!vibes && <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.2)", textAlign: "center", padding: "4px 0", letterSpacing: "1px" }}>NO VIBES YET</p>}
            {viewerId && !isOwner && <div>{ratingOpen ? <RatingForm /> : <RateBtn />}</div>}
          </div>
        )}
      </div>
    </PortalCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  EMPTY TERMINAL STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyTerminal({ label, hint, primary }: { label: string; hint?: string; primary: string }) {
  return (
    <div style={{ padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", border: `1px dashed ${primary}28`, borderRadius: "10px", background: `linear-gradient(180deg,${primary}05 0%,transparent 100%)` }}>
      <div style={{ display: "flex", gap: "5px", alignSelf: "flex-start" }}>
        {["#FF5F56", "#FFBD2E", "#27C93F"].map(c => <div key={c} style={{ width: "8px", height: "8px", borderRadius: "50%", background: c, opacity: .35 }} />)}
      </div>
      <div style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: `${primary}50`, letterSpacing: "1.5px", textAlign: "left", alignSelf: "stretch" }}>
        <span style={{ color: "#B4FF00", opacity: .6 }}>zeezu@network</span>
        <span style={{ color: "rgba(255,255,255,.25)" }}>:</span>
        <span style={{ color: primary, opacity: .7 }}>~$</span>
        {" "}<span style={{ color: "rgba(255,255,255,.35)" }}>ls -la ./</span>
        <span style={{ display: "block", marginTop: "4px", color: "rgba(255,255,255,.12)" }}>total 0</span>
        <span style={{ display: "block", color: "rgba(255,255,255,.08)" }}>drwxr-xr-x  0 zeezu  empty  0 Jan  1 00:00 .</span>
      </div>
      <p style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,255,255,.28)", letterSpacing: "2.5px", margin: 0 }}>{label}</p>
      <span className="zee-cursor" style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: primary, opacity: .5, letterSpacing: "1px", alignSelf: "flex-start" }}>
        zeezu@network:~$
      </span>
      {hint && <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.2)", margin: 0, textAlign: "center" }}>{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  NOT FOUND / LOADING
// ─────────────────────────────────────────────────────────────────────────────

function NotFoundScreen({ zid }: { zid: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080E24", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "32px", fontFamily: "'Nunito',sans-serif" }}>
      <span style={{ fontSize: "56px" }}>👾</span>
      <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "22px", fontWeight: 900, color: "#fff" }}>ZID NOT FOUND</h1>
      <p style={{ fontFamily: "'VT323',monospace", fontSize: "14px", color: "rgba(255,255,255,.35)", letterSpacing: "2px" }}>{zid} DOES NOT EXIST IN THE NETWORK</p>
      <Link href="/dashboard" style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: "#FF2D87", border: "1px solid rgba(255,45,135,.4)", padding: "8px 18px", borderRadius: "8px", textDecoration: "none", letterSpacing: "1px" }}>← BACK TO NETWORK</Link>
    </div>
  );
}

function LoadingScreen({ zid }: { zid: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080E24", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <div style={{ position: "relative", width: "48px", height: "48px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,45,135,.18)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#FF2D87", animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,45,135,.6)", letterSpacing: "3px" }}>LOADING {zid}...</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RECENT VISITORS — Orkut-style mini avatar grid
// ─────────────────────────────────────────────────────────────────────────────

function RecentVisitors({ primary, visitorNum, visitors }: { primary: string; visitorNum: number | null; visitors: any[] }) {
  return (
    <PortalCard accent={`${primary}22`} className="zee-entry">
      <ModuleHeader
        icon={<Eye size={11} />}
        title="RECENT VISITORS"
        accent={primary}
        right={visitorNum ? <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px" }}>{visitorNum.toLocaleString()} TOTAL</span> : undefined}
      />
      <div style={{ padding: "10px 12px" }}>
        {visitors.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px", marginBottom: "8px" }}>
              {visitors.map((v: any) => (
                <Link key={v.zid} href={`/u/${v.zid}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none" }}>
                  <img src={v.avatar_url ?? getAvatar(v.zid)} alt={v.display_name}
                    style={{ width: "44px", height: "44px", borderRadius: "8px", border: `1px solid ${primary}22`, display: "block" }} />
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.28)", letterSpacing: "0.5px" }}>
                    {v.display_name.slice(0, 8).toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.18)", letterSpacing: "1.5px", textAlign: "center", borderTop: `1px solid ${primary}12`, paddingTop: "7px", margin: 0 }}>
              LAST WEEK · RECENT VISITORS
            </p>
          </>
        ) : (
          <>
            <Eye size={22} style={{ color: primary, opacity: 0.2, display: "block", margin: "0 auto 8px" }} />
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.22)", letterSpacing: "2px", textAlign: "center", margin: "0 0 4px" }}>
              NO VISITORS YET
            </p>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.12)", letterSpacing: "1.5px", textAlign: "center", margin: 0 }}>
              ANONYMOUS TRACKING ENABLED
            </p>
          </>
        )}
      </div>
    </PortalCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MINIFEED DATE SEPARATOR — Facebook 2006 "Today / Yesterday / Oct 24"
// ─────────────────────────────────────────────────────────────────────────────

function MiniFeedSep({ label, accent }: { label: string; accent: string }) {
  return (
    <div className="minifeed-sep">
      <div className="minifeed-sep-line" style={{ background: `linear-gradient(90deg,${accent}50,${accent}20)` }} />
      <span className="minifeed-sep-lbl" style={{ color: `${accent}80`, border: `1px solid ${accent}25`, borderRadius: "4px", padding: "1px 7px" }}>{label}</span>
      <div className="minifeed-sep-line" style={{ background: `linear-gradient(90deg,${accent}20,transparent)` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STAR DIVIDER — Y2K glitter separator
// ─────────────────────────────────────────────────────────────────────────────

function StarDivider({ color = "rgba(255,255,255,.08)" }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 2px", margin: "-4px 0" }}>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg,transparent,${color})` }} />
      <span className="star-divider-stars" style={{ fontSize: "8px", color, letterSpacing: "6px", userSelect: "none" }}>✦ ✦ ✦</span>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg,${color},transparent)` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MUTUAL FRIENDS MODULE
// ─────────────────────────────────────────────────────────────────────────────

function MutualFriends({ friends, profileName, primary }: { friends: any[]; profileName: string; primary: string }) {
  if (!friends.length) return null;
  return (
    <PortalCard accent={`${primary}22`} className="zee-entry">
      <ModuleHeader icon={<Users size={11} />} title="MUTUAL FRIENDS" accent={primary} />
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "7px" }}>
          {friends.slice(0, 6).map((f: any) => (
            <Link key={f.id} href={`/u/${f.zid}`} title={f.display_name}>
              <img src={f.avatar_url ?? getAvatar(f.zid)} alt={f.display_name}
                style={{ width: "32px", height: "32px", borderRadius: "7px", border: `1px solid ${primary}30`, display: "block" }} />
            </Link>
          ))}
        </div>
        <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px", margin: 0 }}>
          YOU + {profileName.toUpperCase()} · {friends.length} IN COMMON
        </p>
      </div>
    </PortalCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ACTIVITY TICKER — compact recent events strip
// ─────────────────────────────────────────────────────────────────────────────

function ActivityTicker({ posts, friendActivity, profileUser, primary, secondary }: any) {
  const events = [
    ...posts.slice(0, 3).map((p: any) => ({
      time: p.created_at, type: "post" as const,
      label: `${p.author?.display_name ?? "?"} wrote on wall`,
      zid: p.author?.zid,
    })),
    ...friendActivity.map((r: any) => {
      const other = r.sender_id === profileUser.id ? r.receiver : r.sender;
      return { time: r.created_at, type: "friend" as const, label: `${other?.display_name ?? "?"} became friends`, zid: other?.zid };
    }),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  if (!events.length) return null;
  return (
    <PortalCard accent={`${primary}18`} className="zee-entry">
      <ModuleHeader icon={<Clock size={11} />} title="NETWORK ACTIVITY" accent={secondary} />
      <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {events.map((e: any, i: number) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "4px 0",
            borderBottom: i < events.length - 1 ? `1px solid ${primary}0a` : "none"
          }}>
            <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: e.type === "post" ? secondary : "#B4FF00", flexShrink: 0 }} />
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.45)", letterSpacing: "0.5px", flex: 1 }}>
              {e.zid ? <Link href={`/u/${e.zid}`} style={{ color: e.type === "post" ? secondary : "#B4FF00", textDecoration: "none" }}>{e.label.split(" ")[0]}</Link> : null}
              {" "}{e.label.split(" ").slice(1).join(" ")}
            </span>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.2)", whiteSpace: "nowrap", letterSpacing: "0.5px" }}>
              {formatDistanceToNow(new Date(e.time), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </PortalCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TIER SYSTEM MODAL
// ─────────────────────────────────────────────────────────────────────────────

function TierSystemModal({ score, primary, onClose }: { score: number; primary: string; onClose: () => void }) {
  const TIERS = [
    { key: "USER", min: 0, next: 20, color: "#888888", glow: "rgba(136,136,136,.25)", badge: "· USER", desc: "Every story starts here. Make your first moves." },
    { key: "RISING", min: 20, next: 50, color: "#00F7FF", glow: "rgba(0,247,255,.35)", badge: "↑ RISING", desc: "You're building momentum. The network is watching." },
    { key: "ICON", min: 50, next: 100, color: "#FF2D87", glow: "rgba(255,45,135,.4)", badge: "◈ ICON", desc: "A recognized presence. Your influence is undeniable." },
    { key: "LEGENDARY", min: 100, next: 999, color: "#FFD700", glow: "rgba(255,215,0,.45)", badge: "★ LEGENDARY", desc: "Transcendent. The network bows to your presence." },
  ];
  const currentIdx = [...TIERS].reverse().findIndex(t => score >= t.min);
  const realIdx = TIERS.length - 1 - currentIdx;
  const currentTier = TIERS[realIdx];
  const overallPct = Math.min(100, score);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 9997, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "rgba(7,12,30,.97)", border: "1px solid rgba(255,215,0,.18)", borderRadius: "16px", overflow: "hidden", width: "100%", maxWidth: "400px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 0 60px rgba(255,215,0,.07), 0 0 120px rgba(255,45,135,.05)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", background: "linear-gradient(90deg,rgba(255,215,0,.05) 0%,transparent 100%)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 2, backdropFilter: "blur(12px)" }}>
          <div>
            <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "13px", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "1px" }}>TIER SYSTEM</p>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.35)", margin: "2px 0 0", letterSpacing: "2px" }}>CURRENT SCORE: {score} PTS</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "6px", padding: "5px 10px", color: "rgba(255,255,255,.45)", cursor: "pointer", fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px" }}>✕ CLOSE</button>
        </div>

        {/* Overall progress bar */}
        <div style={{ padding: "16px 20px 10px" }}>
          <div style={{ position: "relative", height: "8px", background: "rgba(255,255,255,.06)", borderRadius: "4px", marginBottom: "8px" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${overallPct}%`, background: "linear-gradient(90deg,#888888,#00F7FF 20%,#FF2D87 50%,#FFD700)", borderRadius: "4px", transition: "width 1s ease", boxShadow: "0 0 10px rgba(255,215,0,.25)" }} />
            {[{ pct: 20, c: "#00F7FF" }, { pct: 50, c: "#FF2D87" }, { pct: 100, c: "#FFD700" }].map(m => (
              <div key={m.pct} style={{ position: "absolute", left: `${m.pct}%`, top: "-3px", width: "2px", height: "14px", background: m.c, opacity: .55, borderRadius: "1px", transform: "translateX(-50%)" }} />
            ))}
            <div style={{ position: "absolute", left: `${Math.min(98, overallPct)}%`, top: "-4px", width: "16px", height: "16px", borderRadius: "50%", background: currentTier?.color ?? "#888", border: "2px solid #070C1E", boxShadow: `0 0 8px ${currentTier?.color ?? "#888"}`, transform: "translateX(-50%)", zIndex: 2 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {[0, 20, 50, 100].map(v => (
              <span key={v} style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.22)", letterSpacing: "0.5px" }}>{v} pts</span>
            ))}
          </div>
        </div>

        {/* Tier cards */}
        <div style={{ padding: "4px 16px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {TIERS.map((t, i) => {
            const isCurrent = i === realIdx;
            const isUnlocked = score >= t.min;
            const isNext = i === realIdx + 1;
            const ptsNeeded = t.min - score;
            return (
              <div key={t.key} style={{ background: isCurrent ? `${t.color}0e` : "rgba(0,0,0,.25)", border: `1px solid ${isCurrent ? t.color + "40" : isUnlocked ? t.color + "18" : "rgba(255,255,255,.04)"}`, borderRadius: "10px", padding: "10px 12px", opacity: isUnlocked ? 1 : 0.5, position: "relative", overflow: "hidden" }}>
                {isCurrent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg,transparent,${t.color},transparent)` }} />}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 900, color: t.color, letterSpacing: "0.5px", textShadow: isCurrent ? `0 0 12px ${t.color}` : "none" }}>{t.badge}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {isCurrent && <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "#B4FF00", background: "rgba(180,255,0,.1)", border: "1px solid rgba(180,255,0,.2)", borderRadius: "3px", padding: "1px 5px", letterSpacing: "1px" }}>YOU ARE HERE</span>}
                    {isNext && <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)", letterSpacing: "0.5px" }}>{ptsNeeded} pts away</span>}
                    {!isUnlocked && !isNext && <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.2)" }}>🔒 {t.min} pts</span>}
                    {isUnlocked && !isCurrent && <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: t.color, opacity: .6 }}>✓ UNLOCKED</span>}
                  </div>
                </div>
                <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.4)", margin: 0, lineHeight: 1.4 }}>{t.desc}</p>
                {isCurrent && realIdx < TIERS.length - 1 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.2)", letterSpacing: "1px" }}>NEXT: {TIERS[realIdx + 1]?.badge}</span>
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: t.color }}>{score - t.min} / {TIERS[realIdx + 1].min - t.min} pts</span>
                    </div>
                    <div style={{ height: "3px", background: "rgba(255,255,255,.06)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${((score - t.min) / (TIERS[realIdx + 1].min - t.min)) * 100}%`, background: t.color, boxShadow: `0 0 8px ${t.color}`, borderRadius: "2px", transition: "width 1s ease" }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* How to earn section */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: "8px", padding: "10px 12px" }}>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "2px", margin: "0 0 7px" }}>HOW TO EARN SCORE</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              {[
                { action: "Post on wall", pts: "+1 pt" },
                { action: "Receive a Zap", pts: "+1 pt" },
                { action: "Receive a Buzz", pts: "+2 pts" },
                { action: "New friend added", pts: "+3 pts" },
              ].map(r => (
                <div key={r.action} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                  <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "10px", color: "rgba(255,255,255,.35)" }}>{r.action}</span>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: primary }}>{r.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FRIEND PICKER MODAL — Core 8 slot assignment
// ─────────────────────────────────────────────────────────────────────────────

function FriendPickerModal({
  slot, friends, currentId, onSelect, onRemove, onClose, primary,
}: {
  slot: number; friends: any[]; currentId: string | null;
  onSelect: (id: string) => void; onRemove: () => void;
  onClose: () => void; primary: string;
}) {
  const [q, setQ] = useState("");
  const filtered = friends.filter(f => f?.display_name?.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#0A0E2A", border: "1px solid rgba(255,45,135,.35)", borderRadius: "14px", overflow: "hidden", width: "100%", maxWidth: "320px", boxShadow: `0 0 40px ${primary}22` }}>
        <ModuleHeader icon={<Users size={11} />} title={`SLOT ${slot} — ASSIGN FRIEND`} accent={primary} />
        <div style={{ padding: "12px" }}>
          <input
            value={q} onChange={e => setQ(e.target.value)} placeholder="Search friends..."
            style={{ width: "100%", background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "8px", padding: "8px 10px", color: "#fff", fontSize: "12px", fontFamily: "'Nunito',sans-serif", outline: "none", marginBottom: "8px", boxSizing: "border-box" }}
          />
          <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {filtered.length > 0 ? filtered.map((f: any) => (
              <button key={f.id} onClick={() => onSelect(f.id)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: "8px", cursor: "pointer", color: "#fff", textAlign: "left", width: "100%" }}>
                <img src={f.avatar_url ?? getAvatar(f.zid)} alt={f.display_name} style={{ width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", fontWeight: 600 }}>{f.display_name}</span>
              </button>
            )) : (
              <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.3)", textAlign: "center", letterSpacing: "1.5px", padding: "12px 0" }}>NO FRIENDS FOUND</p>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
            {currentId && (
              <button onClick={onRemove} style={{ flex: 1, padding: "7px", borderRadius: "7px", background: "transparent", border: "1px solid rgba(255,0,122,.35)", color: "#FF007A", fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px", cursor: "pointer" }}>
                REMOVE
              </button>
            )}
            <button onClick={onClose} style={{ flex: 1, padding: "7px", borderRadius: "7px", background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.4)", fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px", cursor: "pointer" }}>
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODULE-LEVEL HELPERS (moved outside component)
// ─────────────────────────────────────────────────────────────────────────────

async function compressImage(file: File, maxPx = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("Compression failed")), "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

const MEDALS: Record<number, { label: string; color: string; glow: string }> = {
  1: { label: "①", color: "#FFD700", glow: "rgba(255,215,0,0.5)" },
  2: { label: "②", color: "#C0C0C0", glow: "rgba(192,192,192,0.4)" },
  3: { label: "③", color: "#CD7F32", glow: "rgba(205,127,50,0.4)" },
};

const PI_ICONS: Record<string, React.ReactNode> = {
  zodiac: <Star size={11} />, birthday: <Cake size={11} />,
  gender: <VenetianMask size={11} />, height_cm: <Ruler size={11} />,
  location: <MapPin size={11} />, relationship: <Heart size={11} />,
  looking_for: <Search size={11} />, work: <Briefcase size={11} />,
  job_title: <Tag size={11} />, school: <GraduationCap size={11} />,
  education: <BookOpen size={11} />, religion: <Star size={11} />,
  hometown: <Home size={11} />, politics: <Scale size={11} />,
  languages: <Globe size={11} />, sexuality: <Sparkles size={11} />,
  ethnicity: <Users size={11} />, pets: <PawPrint size={11} />,
  children: <Baby size={11} />, drinking: <Wine size={11} />,
  smoking: <Wind size={11} />, marijuana: <Leaf size={11} />,
};

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  github: <Github size={14} />, instagram: <Instagram size={14} />,
  twitter: <Twitter size={14} />, x: <Twitter size={14} />,
  youtube: <Youtube size={14} />, linkedin: <Linkedin size={14} />,
  twitch: <Twitch size={14} />, website: <Globe size={14} />,
  url: <Globe size={14} />, portfolio: <Globe size={14} />,
  discord: <MessageCircle size={14} />, soundcloud: <Music size={14} />,
  spotify: <Music size={14} />, tiktok: <Music size={14} />,
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function getSoundCloudEmbedUrl(url: string): string | null {
  if (!url.includes("soundcloud.com")) return null;
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23FF007A&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
}

function getSpotifyEmbedUrl(url: string): string | null {
  // Matches: open.spotify.com/track/ID, /playlist/ID, /album/ID, /episode/ID
  const m = url.match(/open\.spotify\.com\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/);
  if (!m) return null;
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`;
}

function formatInfoValue(key: string, value: string): string {
  if (key === "birthday") {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age > 0 ? `Age ${age}` : value;
  }
  if (key === "height_cm") {
    const cm = parseInt(value);
    if (isNaN(cm)) return value;
    const totalIn = Math.round(cm / 2.54);
    const ft = Math.floor(totalIn / 12);
    const inches = totalIn % 12;
    return `${cm}cm (${ft}'${inches}")`;
  }
  return value;
}

function useIsMobile(breakpoint = 900): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROFILE SNAPSHOT — mobile-only unified first impression card
// ─────────────────────────────────────────────────────────────────────────────

function ProfileSnapshot({
  primary, secondary, tier, postCount, friendCount, influenceScore,
  mutualFriends, profileName, bio, bioExpanded, setBioExpanded,
  vibes, myRating, ratingOpen, ratingDraft, ratingSubmitting, ratingDone,
  setRatingOpen, setRatingDraft, onRate, viewerId, isOwner, showVibes,
  actionBar,
}: {
  primary: string; secondary: string;
  tier: { label: string; color: string };
  postCount: number; friendCount: number; influenceScore: number;
  mutualFriends: any[]; profileName: string;
  bio: string | null; bioExpanded: boolean; setBioExpanded: (v: boolean) => void;
  vibes: Vibes | null;
  myRating: { trust: number; cool: number; sexy: number } | null;
  ratingOpen: boolean;
  ratingDraft: { trust: number; cool: number; sexy: number };
  ratingSubmitting: boolean; ratingDone: boolean;
  setRatingOpen: (v: boolean) => void;
  setRatingDraft: React.Dispatch<React.SetStateAction<{ trust: number; cool: number; sexy: number }>>;
  onRate: () => void;
  viewerId: string | null; isOwner: boolean; showVibes: boolean;
  actionBar?: React.ReactNode;
}) {
  const VIBE_CATS = [
    { key: "trustworthy_score" as keyof Vibes, dk: "trust" as const, label: "TRUST", color: "#B4FF00", icon: <Shield size={11} /> },
    { key: "cool_score" as keyof Vibes, dk: "cool" as const, label: "COOL", color: "#00F7FF", icon: <Snowflake size={11} /> },
    { key: "sexy_score" as keyof Vibes, dk: "sexy" as const, label: "SEXY", color: "#FF007A", icon: <Flame size={11} /> },
  ];
  const Divider = () => (
    <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${primary}20, transparent)` }} />
  );
  const stats = [
    { val: postCount, label: "POSTS", color: secondary, icon: <MessageCircle size={12} /> },
    { val: friendCount, label: "FRIENDS", color: "#00E5FF", icon: <UserCheck size={12} /> },
    { val: influenceScore, label: "SCORE", color: "#B4FF00", icon: <Zap size={12} /> },
    { val: tier.label, label: "TIER", color: tier.color, icon: <Award size={12} /> },
  ];
  return (
    <div style={{
      backdropFilter: "blur(14px)",
      border: `1px solid ${primary}22`,
      borderRadius: "12px", overflow: "hidden",
      boxShadow: `0 8px 32px rgba(0,0,0,.55), 0 0 28px ${primary}08`,
      animation: "zee-entry .35s ease-out",
    }}>

      {/* ── Action bar (inside card, mobile) ── */}
      {actionBar && (
        <>
          <div style={{ padding: "10px 12px 8px" }}>{actionBar}</div>
          <Divider />
        </>
      )}

      {/* ── Influence stats row ── */}
      <div style={{ display: "flex", padding: "12px 12px 10px", gap: "7px" }}>
        {stats.map(({ val, label, color, icon }) => (
          <div key={label} style={{
            flex: 1, minWidth: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "3px", padding: "6px 4px", borderRadius: "8px",
            background: `linear-gradient(145deg,${color}18 0%,rgba(7,12,30,.72) 100%)`,
            border: `1px solid ${color}30`,
          }}>
            <div style={{ color, display: "flex", filter: `drop-shadow(0 0 5px ${color}cc)` }}>{icon}</div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: "15px", color, textShadow: `0 0 12px ${color},0 0 24px ${color}80`, lineHeight: 1 }}>{val}</div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.75)", letterSpacing: "1.5px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Mutual friends ── */}
      {mutualFriends.length > 0 && !isOwner && (
        <>
          <Divider />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px" }}>
            <div style={{ display: "flex" }}>
              {mutualFriends.slice(0, 5).map((f: any, i: number) => (
                <Link key={f.id} href={`/u/${f.zid}`} title={f.display_name}>
                  <img src={f.avatar_url ?? getAvatar(f.zid)} alt={f.display_name}
                    style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      border: "2px solid rgba(7,12,30,.9)",
                      marginLeft: i > 0 ? "-8px" : "0", display: "block",
                      boxShadow: `0 0 0 1px ${primary}30`,
                      position: "relative", zIndex: mutualFriends.length - i,
                    }} />
                </Link>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,.8)", letterSpacing: "0.5px" }}>
                {mutualFriends.length} mutual {mutualFriends.length === 1 ? "friend" : "friends"}
              </div>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)", letterSpacing: "1px", marginTop: "2px" }}>
                YOU + {profileName.toUpperCase().slice(0, 14)} · IN COMMON
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Vibes summary ── */}
      {showVibes && (
        <>
          <Divider />
          <div style={{ padding: "10px 12px" }}>
            {vibes ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px", marginBottom: viewerId && !isOwner ? "8px" : "0" }}>
                {VIBE_CATS.map(c => (
                  <div key={c.key} style={{
                    background: "rgba(0,0,0,.4)", borderRadius: "10px", padding: "10px 8px",
                    textAlign: "center", border: `1px solid ${c.color}22`,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                  }}>
                    {/* Icon + label */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", color: c.color, fontFamily: "'VT323',monospace", fontSize: "9px", letterSpacing: "1px" }}>
                      {c.icon} {c.label}
                    </div>
                    {/* Bar */}
                    <div style={{ width: "100%", height: "3px", background: "rgba(255,255,255,.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, vibes[c.key] as number)}%`, background: c.color, boxShadow: `0 0 4px ${c.color}`, borderRadius: "2px", transition: "width .7s ease" }} />
                    </div>
                    {/* Score */}
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: "16px", fontWeight: 900, color: c.color, lineHeight: 1, textShadow: `0 0 8px ${c.color}66` }}>{vibes[c.key]}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.2)", letterSpacing: "1.5px", textAlign: "center", padding: "4px 0 8px" }}>NO VIBES YET</div>
            )}
            {viewerId && !isOwner && !ratingOpen && (
              <button onClick={() => setRatingOpen(true)} style={{
                width: "100%", padding: "7px", borderRadius: "7px",
                background: myRating ? "rgba(180,255,0,.06)" : "transparent",
                border: `1px solid ${myRating ? "#B4FF0030" : `${primary}25`}`,
                color: myRating ? "#B4FF00" : primary,
                fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1.5px", cursor: "pointer", transition: "all .2s",
              }}>
                {myRating ? "✓ RATED · UPDATE VIBE" : "⚡ RATE THEIR VIBES"}
              </button>
            )}
            {ratingOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {VIBE_CATS.map(c => (
                  <div key={c.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1.5px", color: c.color }}>{c.label}</span>
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: c.color }}>{ratingDraft[c.dk]}/5</span>
                    </div>
                    <div style={{ display: "flex", gap: "3px" }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setRatingDraft(p => ({ ...p, [c.dk]: n }))}
                          style={{ flex: 1, height: "22px", borderRadius: "4px", cursor: "pointer", background: ratingDraft[c.dk] >= n ? `${c.color}18` : "rgba(255,255,255,.03)", border: `1px solid ${ratingDraft[c.dk] >= n ? c.color : "#2a2a2a"}`, color: ratingDraft[c.dk] >= n ? c.color : "#444", fontFamily: "'VT323',monospace", fontSize: "11px", transition: "all .12s" }}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "5px" }}>
                  <button onClick={onRate} disabled={ratingSubmitting || ratingDone}
                    style={{ flex: 1, padding: "7px", borderRadius: "7px", border: "none", background: ratingDone ? "#B4FF00" : `linear-gradient(135deg,${primary},${primary}cc)`, color: ratingDone ? "#000" : "#fff", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, cursor: ratingSubmitting ? "not-allowed" : "pointer", opacity: ratingSubmitting ? .6 : 1, transition: "all .2s" }}>
                    {ratingDone ? "✓ SAVED!" : ratingSubmitting ? "..." : myRating ? "UPDATE" : "SUBMIT"}
                  </button>
                  <button onClick={() => { setRatingOpen(false); if (myRating) setRatingDraft(() => myRating!); else setRatingDraft(() => ({ trust: 3, cool: 3, sexy: 3 })); }}
                    style={{ padding: "7px 10px", borderRadius: "7px", background: "transparent", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.35)", fontFamily: "'VT323',monospace", fontSize: "10px", cursor: "pointer" }}>✕</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Bio ── */}
      {bio && (
        <>
          <Divider />
          <div style={{ padding: "10px 14px 12px" }}>
            <div style={{
              fontFamily: "'Nunito',sans-serif", fontSize: "13px", color: "rgba(255,255,255,.6)", lineHeight: "1.65",
              ...(bioExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }),
            }}>
              {bio}
            </div>
            {bio.length > 120 && (
              <button onClick={() => setBioExpanded(!bioExpanded)} style={{
                display: "flex", alignItems: "center", gap: "4px", background: "transparent", border: "none",
                color: primary, fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1.5px",
                cursor: "pointer", padding: "5px 0 0", transition: "opacity .15s",
              }}>
                <ChevronDown size={12} style={{ transform: bioExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                {bioExpanded ? "SHOW LESS" : "SEE MORE"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STATION STRIP — mobile sticky tab navigation
// ─────────────────────────────────────────────────────────────────────────────

function StationStrip({
  activeStation, setActiveStation, primary, scrolled,
}: {
  activeStation: "wall" | "about" | "crew" | "media";
  setActiveStation: (s: "wall" | "about" | "crew" | "media") => void;
  primary: string; scrolled: boolean;
}) {
  const STATIONS: { key: "wall" | "about" | "crew" | "media"; label: string; icon: React.ReactNode }[] = [
    { key: "wall", label: "WALL", icon: <ScrollText size={15} /> },
    { key: "about", label: "ABOUT", icon: <Info size={15} /> },
    { key: "crew", label: "CREW", icon: <Users size={15} /> },
    { key: "media", label: "MEDIA", icon: <ImageIcon size={15} /> },
  ];
  return (
    <div style={{
      position: "sticky", top: scrolled ? "96px" : "56px", zIndex: 100,
      background: "rgba(7,12,30,.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid rgba(255,255,255,.06)`,
      borderTop: `1px solid rgba(255,255,255,.04)`,
      borderRadius: "10px",
      display: "flex", transition: "top .2s ease",
      overflow: "hidden",
    }}>
      {STATIONS.map(({ key, label, icon }) => (
        <button key={key} onClick={() => setActiveStation(key)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
          padding: "10px 4px 8px", background: "transparent", border: "none",
          borderBottom: activeStation === key ? `2px solid ${primary}` : "2px solid transparent",
          color: activeStation === key ? primary : "rgba(255,255,255,.28)",
          cursor: "pointer", transition: "all .18s",
          textShadow: activeStation === key ? `0 0 10px ${primary}80` : "none",
        }}>
          <span style={{ opacity: activeStation === key ? 1 : 0.45 }}>{icon}</span>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "7px", fontWeight: 700, letterSpacing: "1.2px" }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PublicProfile() {
  const params = useParams();
  const router = useRouter();
  const zid = typeof params?.zid === "string" ? params.zid.toUpperCase() : "";

  // ── State — ALL UNCHANGED ──────────────────────────────────────
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [custom, setCustom] = useState<Customization | null>(null);
  const [coreEight, setCoreEight] = useState<CoreSlot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [vibes, setVibes] = useState<Vibes | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerZid, setViewerZid] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [myOnlineStatus, setMyOnlineStatus] = useState<OnlineStatus>("online");
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>({ status: "none", requestId: null });
  const [friendLoading, setFriendLoading] = useState(false);
  const [visitorNum, setVisitorNum] = useState<number | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"wall" | "photos" | "zlogger">("wall");
  const [profileZlogs, setProfileZlogs] = useState<ZlogListItem[]>([]);
  const [zlogsLoading, setZlogsLoading] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({ show_vibes: true, show_wall: true, wall_friends_only: false, show_online: true, show_zlogger: true, show_photos: true });
  const [myRating, setMyRating] = useState<{ trust: number; cool: number; sexy: number } | null>(null);
  const [ratingDraft, setRatingDraft] = useState({ trust: 3, cool: 3, sexy: 3 });
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sharingProfile, setSharingProfile] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const [lastMood, setLastMood] = useState<string | null>(null);
  const [buzzCount, setBuzzCount] = useState(0);
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [recentFriendActivity, setRecentFriendActivity] = useState<any[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [c8EditSlot, setC8EditSlot] = useState<number | null>(null);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [ownerFriends, setOwnerFriends] = useState<any[]>([]);
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const mobileHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mobile station system ──────────────────────────────────────
  const [activeStation, setActiveStation] = useState<"wall" | "about" | "crew" | "media">("wall");
  const [scrolled, setScrolled] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [activeWallTab, setActiveWallTab] = useState<"posts" | "zlogs">("posts");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isMobile = useIsMobile();
  const primary = custom?.primary_color ?? "#FF2D87";
  const secondary = custom?.secondary_color ?? "#00E5FF";

  // Sync CSS custom properties for static-CSS rules (scrollbar, view-my-links)
  useEffect(() => {
    document.documentElement.style.setProperty("--zee-primary-dim", `${primary}47`);
    document.documentElement.style.setProperty("--zee-secondary-dim", `${secondary}b3`);
    document.documentElement.style.setProperty("--zee-secondary", secondary);
  }, [primary, secondary]);

  // Scroll listener for sticky mini header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 280);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Load profile — UNCHANGED ───────────────────────────────────
  useEffect(() => {
    if (!zid) return;
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setViewerId(authUser?.id ?? null);
      const { data: userData, error: userErr } = await supabase.from("users").select("*").eq("zid", zid).single();
      if (userErr || !userData) { setNotFound(true); setLoading(false); return; }
      setProfileUser(userData);
      const ownerMatch = authUser?.id === userData.id;
      setIsOwner(ownerMatch);
      if (ownerMatch) setMyOnlineStatus((userData.online_status as OnlineStatus) ?? "online");
      if (ownerMatch) setViewerZid(userData.zid);
      else if (authUser?.id) {
        supabase.from("users").select("zid").eq("id", authUser.id).single().then(({ data: vd }) => { if (vd) setViewerZid(vd.zid); });
      }

      const [
        { data: customData }, { data: core8Data }, { data: postsData },
        { data: vibeData }, { count: pCount }, resolvedFriendCount,
        { data: photoFiles }, { data: moodPostData }, { count: buzzCountData },
        { data: friendActivityData },
      ] = await Promise.all([
        supabase.from("profile_customization").select("*").eq("user_id", userData.id).single(),
        supabase.from("core_eight").select("position, friend:users!fk_core_friend(id, display_name, zid)").eq("user_id", userData.id).order("position"),
        supabase.from("zeewall").select("id, content, created_at, zaps, author:users!author_id(id, display_name, zid, birth_year, birth_month, birth_day, agent_state(agent_id))").eq("owner_id", userData.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("vibes").select("*").eq("user_id", userData.id).single(),
        supabase.from("zeewall").select("*", { count: "exact", head: true }).eq("author_id", userData.id),
        getFriendCount(userData.id),
        supabase.storage.from("user-media").list(`${userData.id}/photos`, { sortBy: { column: "created_at", order: "desc" } }),
        supabase.from("zeewall").select("content").eq("author_id", userData.id).ilike("content", "[mood: %").order("created_at", { ascending: false }).limit(1),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("receiver_id", userData.id).eq("is_buzz", true),
        supabase.from("friend_requests").select("id, created_at, sender_id, receiver_id, sender:users!sender_id(display_name, zid), receiver:users!receiver_id(display_name, zid)").eq("status", "accepted").or(`sender_id.eq.${userData.id},receiver_id.eq.${userData.id}`).order("created_at", { ascending: false }).limit(5),
      ]);

      if (customData) {
        const { show_vibes, show_wall, wall_friends_only, show_online, user_id, ...themeFields } = customData;
        setCustom({ ...DEFAULT_THEME, ...themeFields } as any);
        setPrivacySettings({
          show_vibes: show_vibes ?? true,
          show_wall: show_wall ?? true,
          wall_friends_only: wall_friends_only ?? false,
          show_online: show_online ?? true,
          show_zlogger: (customData as any).show_zlogger ?? true,
          show_photos: (customData as any).show_photos ?? true,
        });
      }
      if (core8Data) setCoreEight(core8Data as unknown as CoreSlot[]);
      if (postsData) setPosts(postsData as unknown as Post[]);
      if (vibeData) setVibes(vibeData);
      setPostCount(pCount ?? 0);
      setFriendCount(resolvedFriendCount);
      if (photoFiles) {
        const urls = photoFiles.map(f => supabase.storage.from("user-media").getPublicUrl(`${userData.id}/photos/${f.name}`).data.publicUrl);
        setPhotos(urls);
      }
      const moodMatch = moodPostData?.[0]?.content?.match(/^\[mood: (.+?)\]\n/);
      setLastMood(moodMatch?.[1] ?? null);
      setBuzzCount(buzzCountData ?? 0);
      if (friendActivityData) setRecentFriendActivity(friendActivityData);

      if (authUser && authUser.id !== userData.id) {
        const [fs, { data: myRatingData }] = await Promise.all([
          getFriendshipStatus(authUser.id, userData.id),
          supabase.from("vibes_ratings").select("trust_vote, cool_vote, sexy_vote").eq("rater_id", authUser.id).eq("rated_user_id", userData.id).maybeSingle(),
        ]);
        setFriendStatus(fs);
        if (myRatingData) {
          const r = { trust: myRatingData.trust_vote, cool: myRatingData.cool_vote, sexy: myRatingData.sexy_vote };
          setMyRating(r); setRatingDraft(r);
        }
        const mutuals = await getMutualFriends(authUser.id, userData.id);
        setMutualFriends(mutuals);
      }
      if (authUser && authUser.id === userData.id) {
        const { data: frData } = await supabase
          .from("friend_requests")
          .select("sender_id, receiver_id, sender:users!sender_id(id, display_name, zid, avatar_url), receiver:users!receiver_id(id, display_name, zid, avatar_url)")
          .eq("status", "accepted")
          .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`);
        if (frData) {
          setOwnerFriends(frData.map((r: any) => r.sender_id === authUser.id ? r.receiver : r.sender));
        }
      }

      const { data: visitCount } = await supabase.rpc("increment_visit", { p_user_id: userData.id });
      setVisitorNum(visitCount ?? 1);

      const { data: visitLog } = await supabase
        .from("profile_visit_log")
        .select("visitor_id, visitor:users!visitor_id(display_name, zid, avatar_url)")
        .eq("profile_user_id", userData.id)
        .not("visitor_id", "is", null)
        .neq("visitor_id", userData.id)
        .order("created_at", { ascending: false })
        .limit(18);

      const seen = new Set<string>();
      const uniqueVisitors = (visitLog || [])
        .filter((v: any) => {
          if (!v.visitor || seen.has(v.visitor_id)) return false;
          seen.add(v.visitor_id);
          return true;
        })
        .slice(0, 6)
        .map((v: any) => v.visitor);
      setRecentVisitors(uniqueVisitors);
      setLoading(false);
    }
    load();
  }, [zid]);

  // ── Zlogger tab lazy-load ──────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "zlogger" || !profileUser) return;
    if (profileZlogs.length > 0) return;
    setZlogsLoading(true);
    getUserZlogs(profileUser.id).then(data => { setProfileZlogs(data); setZlogsLoading(false); });
  }, [activeTab, profileUser, profileZlogs.length]);

  // ── Audio — UNCHANGED ──────────────────────────────────────────
  useEffect(() => {
    if (!profileUser?.theme_track_url) return;
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = "anonymous";
    audioRef.current.volume = 0.35;
    return () => { audioRef.current?.pause(); };
  }, [profileUser?.theme_track_url]);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !profileUser?.theme_track_url) return;
    if (!audio.src) audio.src = profileUser.theme_track_url;
    if (musicPlaying) { audio.pause(); setMusicPlaying(false); }
    else { audio.play().then(() => setMusicPlaying(true)).catch(console.error); }
  }, [musicPlaying, profileUser?.theme_track_url]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleAddFriend = async () => { if (!viewerId || !profileUser) return; setFriendLoading(true); const r = await sendFriendRequest(profileUser.id); if (r) setFriendStatus({ status: "pending_sent", requestId: r.id }); setFriendLoading(false); };
  const handleCancelRequest = async () => { if (!friendStatus.requestId) return; setFriendLoading(true); await cancelFriendRequest(friendStatus.requestId); setFriendStatus({ status: "none", requestId: null }); setFriendLoading(false); };
  const handleRespondToRequest = async (accept: boolean) => { if (!friendStatus.requestId) return; setFriendLoading(true); await respondToFriendRequest(friendStatus.requestId, accept); setFriendStatus(accept ? { status: "friends", requestId: friendStatus.requestId } : { status: "none", requestId: null }); setFriendLoading(false); };
  const handleRemoveFriend = async () => { if (!friendStatus.requestId) return; setFriendLoading(true); await removeFriend(friendStatus.requestId); setFriendStatus({ status: "none", requestId: null }); setFriendLoading(false); };
  const handleRateVibes = async () => {
    if (!viewerId || !profileUser || isOwner) return;
    setRatingSubmitting(true);
    const { error } = await supabase.rpc("rate_vibes", { p_rated_user_id: profileUser.id, p_trust: ratingDraft.trust, p_cool: ratingDraft.cool, p_sexy: ratingDraft.sexy });
    if (!error) {
      setMyRating({ ...ratingDraft });
      setVibes(prev => ({
        trustworthy_score: prev ? Math.round((prev.trustworthy_score + ratingDraft.trust * 20) / 2) : ratingDraft.trust * 20,
        cool_score: prev ? Math.round((prev.cool_score + ratingDraft.cool * 20) / 2) : ratingDraft.cool * 20,
        sexy_score: prev ? Math.round((prev.sexy_score + ratingDraft.sexy * 20) / 2) : ratingDraft.sexy * 20,
      }));
      setRatingDone(true);
      setTimeout(() => { setRatingDone(false); setRatingOpen(false); }, 1600);
    }
    setRatingSubmitting(false);
  };
  const handleBuzz = async () => {
    if (!viewerId || !profileUser) return;
    await supabase.from("messages").insert({ sender_id: viewerId, receiver_id: profileUser.id, content: "⚡", is_buzz: true });
    setBuzzCount(prev => prev + 1);
  };
  const handleC8Select = async (friendId: string) => {
    if (c8EditSlot === null || !profileUser) return;
    await addToCoreEight(friendId, c8EditSlot);
    const updated = await getCoreEight(profileUser.id);
    setCoreEight(updated as unknown as CoreSlot[]);
    setC8EditSlot(null);
  };
  const handleC8Remove = async () => {
    if (c8EditSlot === null) return;
    await removeFromCoreEight(c8EditSlot);
    setCoreEight(prev => prev.filter(c => c.position !== c8EditSlot));
    setC8EditSlot(null);
  };

  const handleC8Swap = async (fromSlot: number, toSlot: number) => {
    const fromEntry = coreEight.find(c => c.position === fromSlot);
    const toEntry = coreEight.find(c => c.position === toSlot);
    if (!fromEntry?.friend) return;
    setCoreEight(prev => {
      const next = prev.filter(c => c.position !== fromSlot && c.position !== toSlot);
      next.push({ position: toSlot, friend: fromEntry.friend });
      if (toEntry?.friend) next.push({ position: fromSlot, friend: toEntry.friend });
      return next;
    });
    setDraggingSlot(null);
    await addToCoreEight(fromEntry.friend.id, toSlot);
    if (toEntry?.friend) await addToCoreEight(toEntry.friend.id, fromSlot);
    else await removeFromCoreEight(fromSlot);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewerId || !profileUser || !isOwner) return;
    if (photos.length >= 5) {
      alert("Maximum 5 photos allowed. Delete one to upload another.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { alert("File too large. Max 10MB before compression."); return; }
    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const path = `${profileUser.id}/photos/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage.from("user-media").upload(path, compressed, { contentType: "image/jpeg" });
      if (error) { alert(`Upload failed: ${error.message}`); return; }
      if (data) {
        const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
        setPhotos(prev => [urlData.publicUrl, ...prev]);
      }
    } catch (err) {
      alert("Could not process image. Please try a different file.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  if (notFound) return <NotFoundScreen zid={zid} />;
  if (loading) return <LoadingScreen zid={zid} />;

  const tier = getInfluenceTier(profileUser?.influence_score ?? 0);
  const isAgent = AGENT_IDS.has(profileUser?.id ?? "") || !!profileUser?.agent_state;
  const gen = getGeneration(profileUser?.birth_year, profileUser?.birth_month, profileUser?.birth_day, isAgent);
  const totalZaps = posts.reduce((s, p) => s + p.zaps, 0);
  const moodEmoji = getMoodEmoji(profileUser?.status_message ?? null);

  const TABS: Array<"wall" | "photos" | "zlogger"> = [
    "wall",
    ...(isOwner || privacySettings.show_photos ? ["photos" as const] : []),
    ...(isOwner || privacySettings.show_zlogger ? ["zlogger" as const] : []),
  ];

  // ── Reusable section JSX (desktop sidebar + mobile stations) ──────────────
  const personalInfoSection = (() => {
    const info = profileUser?.personal_info;
    if (!info) return null;
    const groups = ["core", "lifestyle", "personal"] as const;
    const groupMeta: Record<string, { title: string; color: string }> = {
      core: { title: "CORE INFO", color: "#C084FC" },
      lifestyle: { title: "LIFESTYLE", color: "#00F7FF" },
      personal: { title: "PERSONAL", color: "#FF2D87" },
    };
    const sections = groups.map(group => ({
      group,
      fields: FIELD_DEFS.filter(f => f.group === group && info[f.key]?.visible && info[f.key]?.value),
    })).filter(s => s.fields.length > 0);
    if (!sections.length) return null;
    return (
      <PortalCard accent={`${primary}22`} className="zee-entry">
        <ModuleHeader icon={<Users size={11} />} title="PERSONAL INFO" accent={primary} />
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {sections.map(({ group, fields }) => (
            <div key={group}>
              <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: groupMeta[group].color, letterSpacing: "2px", margin: "0 0 6px", borderBottom: `1px solid ${groupMeta[group].color}22`, paddingBottom: "4px" }}>
                {groupMeta[group].title}
              </p>
              <table className="info-table pi-table">
                <tbody>
                  {fields.map(f => (
                    <tr key={f.key}>
                      <td className="info-key"><span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: f.color, opacity: .75 }}>{PI_ICONS[f.key]}</span><span className="pi-label-text">{f.label.toUpperCase()}</span></span></td>
                      <td className="info-val">{formatInfoValue(f.key, info[f.key].value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pi-chip-strip">
                {fields.map(f => (
                  <div key={f.key} className="pi-chip" title={`${f.label}: ${formatInfoValue(f.key, info[f.key].value)}`}>
                    <span style={{ color: f.color }}>{PI_ICONS[f.key]}</span>
                    <span style={{ fontSize: "9px", color: "rgba(255,255,255,.45)" }}>{formatInfoValue(f.key, info[f.key].value).slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PortalCard>
    );
  })();

  const socialLinksSection = (() => {
    const links = profileUser?.social_links;
    const validLinks = links ? Object.entries(links).filter(([, v]) => v?.trim()) : [];
    if (!validLinks.length) return null;
    return (
      <PortalCard accent={`${secondary}18`} className="zee-entry">
        <ModuleHeader icon={<LinkIcon size={11} />} title="CONNECT" accent={secondary} />
        <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {validLinks.map(([key, val]) => (
            <a key={key} href={val.startsWith("http") ? val : `https://${val}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "6px", background: `${secondary}0f`, border: `1px solid ${secondary}22`, borderRadius: "8px", padding: "6px 10px", textDecoration: "none", color: secondary, transition: "all .18s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${secondary}22`; (e.currentTarget as HTMLAnchorElement).style.borderColor = `${secondary}55`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${secondary}0f`; (e.currentTarget as HTMLAnchorElement).style.borderColor = `${secondary}22`; }}
            >
              <span style={{ color: secondary }}>{SOCIAL_ICONS[key.toLowerCase()] ?? <Globe size={14} />}</span>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: secondary, letterSpacing: "1px" }}>{key.toUpperCase()}</span>
            </a>
          ))}
        </div>
      </PortalCard>
    );
  })();

  // ── Action bar content — shared between desktop wrapper and mobile ProfileSnapshot ──
  const actionBarContent = (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
      {!isOwner && viewerId && (
        <>
          <FriendButton
            friendStatus={friendStatus} friendLoading={friendLoading}
            primary={primary} secondary={secondary} compact
            onAdd={handleAddFriend} onCancel={handleCancelRequest}
            onAccept={() => handleRespondToRequest(true)}
            onDecline={() => handleRespondToRequest(false)}
            onRemove={handleRemoveFriend}
          />
          <button onClick={() => profileUser && router.push(`/messages/${profileUser.id}`)}
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "8px", background: "transparent", border: `1px solid ${secondary}50`, color: secondary, fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px", cursor: "pointer", whiteSpace: "nowrap", transition: "all .18s" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = `${secondary}12`; el.style.borderColor = secondary; el.style.boxShadow = `0 0 12px ${secondary}40`; el.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "transparent"; el.style.borderColor = `${secondary}50`; el.style.boxShadow = ""; el.style.transform = ""; }}
          >
            <MessageCircle size={11} /> Message
          </button>
        </>
      )}
      {isOwner && (
        <>
          <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.55)", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px", textDecoration: "none", whiteSpace: "nowrap" }}>
            <Settings size={11} /> Settings
          </Link>
          {/* Status picker — inline in action bar, owner only */}
          {(() => {
            const STATUSES: { key: OnlineStatus; label: string; color: string; desc: string }[] = [
              { key: "online", label: "Online", color: "#6BCB77", desc: "Active" },
              { key: "busy", label: "Busy", color: "#F97316", desc: "Do not disturb" },
              { key: "away", label: "Away", color: "#F59E0B", desc: "Be right back" },
              { key: "offline", label: "Offline", color: "#6B7280", desc: "Appear offline" },
            ];
            const cur = STATUSES.find(s => s.key === myOnlineStatus) ?? STATUSES[0];
            return (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setStatusPickerOpen(v => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "6px 9px", borderRadius: "8px",
                    background: `${cur.color}12`, backdropFilter: "blur(12px)",
                    border: `1px solid ${cur.color}45`,
                    cursor: "pointer", transition: "all .18s",
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: cur.color, boxShadow: `0 0 5px ${cur.color}`, flexShrink: 0, display: "block" }} />
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, color: cur.color, letterSpacing: "0.5px" }}>{cur.label.toUpperCase()}</span>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)" }}>▾</span>
                </button>
                {statusPickerOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0,
                    background: "rgba(8,14,36,.97)", border: "1px solid rgba(255,45,135,.25)",
                    borderRadius: "8px", overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,.7)", zIndex: 50, minWidth: "160px",
                  }}>
                    {STATUSES.map((s, i) => (
                      <button key={s.key} onClick={async () => {
                        setMyOnlineStatus(s.key);
                        setStatusPickerOpen(false);
                        await updateOnlineStatus(s.key);
                      }} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        width: "100%", textAlign: "left", padding: "8px 12px",
                        background: myOnlineStatus === s.key ? `${s.color}15` : "transparent",
                        border: "none",
                        borderBottom: i < 3 ? "1px solid rgba(255,255,255,.05)" : "none",
                        cursor: "pointer", transition: "background .15s",
                      }}
                        onMouseEnter={e => { if (myOnlineStatus !== s.key) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.04)"; }}
                        onMouseLeave={e => { if (myOnlineStatus !== s.key) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, boxShadow: `0 0 5px ${s.color}80`, flexShrink: 0, display: "block" }} />
                        <div>
                          <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, color: myOnlineStatus === s.key ? s.color : "rgba(255,255,255,.75)", margin: 0, letterSpacing: "0.5px" }}>{s.label}</p>
                          <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)", margin: 0, letterSpacing: "0.5px" }}>{s.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
      <button
        aria-label="Share profile"
        onClick={() => setSharingProfile(true)}
        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.35)", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, cursor: "pointer", transition: "all .18s" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "rgba(255,255,255,.06)"; el.style.borderColor = "rgba(255,255,255,.3)"; el.style.color = "rgba(255,255,255,.8)"; el.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "transparent"; el.style.borderColor = "rgba(255,255,255,.1)"; el.style.color = "rgba(255,255,255,.35)"; el.style.transform = ""; }}
      >
        <Share2 size={11} />
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#070C1E", backgroundImage: `radial-gradient(ellipse 90% 55% at 50% 0%,${primary}14 0%,transparent 55%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='.65' fill='rgba(255,255,255,.04)'/%3E%3C/svg%3E")`, color: "#fff", overflowX: "hidden", fontFamily: "'Nunito',sans-serif", paddingBottom: "48px" }}>

      <ThemeEngine config={custom as any} />

      {/* ── STYLE INJECTION MOVED INTO JSX FOR NATIVE SSR ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');

        /* ── HARD LOCK HORIZONTAL OVERFLOW ── */
        body, html { overflow-x: hidden !important; width: 100%; }

        @keyframes zee-marquee  { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
        @keyframes zee-entry    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes zee-online   { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes zee-glow-name{ 0%,100%{opacity:1} 92%{opacity:.82} 93.5%{opacity:1} }
        @keyframes zee-visitor  { from{transform:translateY(6px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes zee-disc     { to{transform:rotate(360deg)} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes zee-blink    { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes zee-led      { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes zee-mood-in  { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        @keyframes zee-star-twinkle { 0%,100%{opacity:.5} 50%{opacity:1;text-shadow:0 0 6px currentColor} }
        .star-divider-stars { animation: zee-star-twinkle 3s ease-in-out infinite; }

        @keyframes glitch-1 {
          0%{clip-path:inset(40% 0 55% 0);transform:translate(-2px,0)}
          20%{clip-path:inset(82% 0 8% 0);transform:translate(2px,0)}
          40%{clip-path:inset(20% 0 70% 0);transform:translate(0,0)}
          60%{clip-path:inset(65% 0 20% 0);transform:translate(2px,0)}
          80%{clip-path:inset(5% 0 85% 0);transform:translate(-2px,0)}
          100%{clip-path:inset(40% 0 55% 0);transform:translate(0,0)}
        }
        @keyframes glitch-2 {
          0%{clip-path:inset(10% 0 80% 0);transform:translate(2px,0)}
          25%{clip-path:inset(75% 0 12% 0);transform:translate(-2px,0)}
          50%{clip-path:inset(30% 0 55% 0);transform:translate(0,0)}
          75%{clip-path:inset(50% 0 30% 0);transform:translate(2px,0)}
          100%{clip-path:inset(10% 0 80% 0);transform:translate(-2px,0)}
        }
        .zee-glitch { position:relative; }
        .zee-glitch::before,.zee-glitch::after {
          content:attr(data-text); position:absolute; left:0; top:0;
          width:100%; height:100%; pointer-events:none;
        }
        .zee-glitch:hover::before { animation:glitch-1 .3s steps(1) infinite; color:#00E5FF; opacity:.55; }
        .zee-glitch:hover::after  { animation:glitch-2 .3s steps(1) infinite; color:#FF007A; opacity:.45; }

        @keyframes zee-scanbar { 0%{transform:translateY(-100%);opacity:.7} 100%{transform:translateY(250%);opacity:0} }
        .zee-module-hdr { position:relative; overflow:hidden; }
        .zee-module-hdr::after { content:"";position:absolute;left:0;top:0;width:100%;height:35%;background:linear-gradient(180deg,rgba(255,255,255,.14) 0%,transparent 100%);transform:translateY(-100%);pointer-events:none;opacity:0;transition:opacity .2s; }
        .zee-module-hdr:hover::after { opacity:1; animation:zee-scanbar 1.6s ease-in infinite; }

        .zee-entry { animation:zee-entry 0.38s ease-out forwards; opacity:0; }
        .zee-entry:nth-child(1){animation-delay:.04s}
        .zee-entry:nth-child(2){animation-delay:.09s}
        .zee-entry:nth-child(3){animation-delay:.14s}
        .zee-entry:nth-child(4){animation-delay:.19s}
        .zee-entry:nth-child(5){animation-delay:.24s}
        .zee-entry:nth-child(6){animation-delay:.29s}
        .zee-glow-name { animation:zee-glow-name 9s infinite; }
        .zee-led { animation:zee-led 2.4s ease-in-out infinite; }
        .zee-cursor::after { content:"▌"; animation:zee-blink .85s step-end infinite; color:inherit; opacity:.7; }

        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--zee-primary-dim,rgba(255,45,135,.28)); border-radius:3px; }

        .zee-tab-active::before { content:"[ "; }
        .zee-tab-active::after  { content:" ]"; }

        /* ── BULLETPROOF 3-COLUMN GRID ── */
        .profile-grid {
          max-width: 1200px; 
          margin: 0 auto;
          padding: 20px 16px 90px;
          display: grid; 
          grid-template-columns: 260px minmax(0, 1fr) 280px; 
          gap: 18px; 
          position: relative; 
          z-index: 10;
          width: 100%;
          box-sizing: border-box;
        }
        
        .profile-sidebar { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .profile-main    { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .profile-right   { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

        .c8-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; width: 100%; }
        .vibes-desktop { display: flex; }
        .vibes-mobile  { display: none; }
        
        /* Added Polaroid effect for Y2K style */
        .photos-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

        .view-my-links { display:flex; flex-wrap:wrap; gap:0; }
        .view-my-link  { font-family:'VT323',monospace; font-size:11px; color:var(--zee-secondary-dim,rgba(0,229,255,.7)); text-decoration:none; letter-spacing:1px; transition:color .15s; }
        .view-my-link:hover { color:var(--zee-secondary,#00E5FF); text-decoration:underline; }
        .view-my-sep   { font-family:'VT323',monospace; font-size:11px; color:rgba(255,255,255,.2); margin:0 5px; }

        .minifeed-sep { display:flex; align-items:center; gap:8px; padding:6px 0; }
        .minifeed-sep-line { flex:1; height:1px; }
        .minifeed-sep-lbl  { font-family:'Orbitron',sans-serif; font-size:8px; font-weight:700; letter-spacing:2px; white-space:nowrap; }

        /* ── ORKUT TABLE HORIZONTAL OVERFLOW FIX ── */
        .info-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .info-table td { padding: 4px 8px; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; }
        .info-table tr:not(:last-child) td { border-bottom: 1px solid rgba(255,255,255,.04); }
        .info-key { font-family:'VT323',monospace; font-size:11px; color:rgba(255,255,255,.3); letter-spacing:1px; white-space:nowrap; width:85px; }
        .info-val { font-family:'Nunito',sans-serif; font-size:12px; color:rgba(255,255,255,.7); }

        /* ── Tablet ── */
        @media (min-width:769px) and (max-width:1024px) {
          .profile-grid { grid-template-columns: 220px minmax(0, 1fr) 240px !important; gap: 14px !important; }
        }

        /* ── MOBILE: STACK FIX AND SWIPE REPAIR ── */
        @media (max-width:900px) {
          .profile-grid {
            grid-template-columns: minmax(0, 100%) !important;
            padding: 12px 12px 90px;
            gap: 12px;
            width: 100vw;
            max-width: 100vw;
            box-sizing: border-box;
          }

          .profile-sidebar { order: 1; min-width: 0; width: 100%; }
          /* Hide desktop columns on mobile — station system takes over */
          .profile-right   { display: none !important; }
          .profile-main    { display: none !important; }
          
          /* Constrain card width so aspect-ratio naturally gives a sensible height — no overflow clipping needed */
          .profile-card-wrap { max-width: 320px; width: 100%; margin: 0 auto; }
          
          /* Force horizontal swipe without breaking screen boundaries */
          .c8-grid { 
            display:flex !important; 
            flex-direction:row !important; 
            flex-wrap:nowrap !important; 
            overflow-x:auto !important; 
            gap:10px !important; 
            padding-bottom:6px; 
            width: 100%; 
            max-width: calc(100vw - 48px); /* Crucial: Locks slider to viewport */
            scrollbar-width:none; 
            -webkit-overflow-scrolling:touch; 
          }
          .c8-grid::-webkit-scrollbar { display:none; }
          .c8-slot { flex:0 0 68px !important; width:68px !important; }
          .c8-slot-img { width:60px !important; height:60px !important; }
          
          .vibes-desktop { display:none !important; }
          .vibes-mobile  { display:flex !important; }
          .photos-grid   { grid-template-columns:repeat(2,1fr) !important; }
        }

        @keyframes zee-eq { from { transform:scaleY(0.3); } to { transform:scaleY(1); } }

        @keyframes za-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .za-btn:active { transform: scale(0.92); }

        .influence-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .influence-chip-strip { display: none; }

        @media (max-width: 900px) {
          .influence-grid { display: none !important; }
          .influence-chip-strip {
            display: flex; flex-direction: row; gap: 8px;
            overflow-x: auto; padding-bottom: 4px;
            scrollbar-width: none; -webkit-overflow-scrolling: touch;
          }
          .influence-chip-strip::-webkit-scrollbar { display: none; }
          .influence-chip { flex: 0 0 auto; display: flex; flex-direction: column;
            align-items: center; gap: 3px; background: rgba(0,0,0,.4);
            border-radius: 10px; padding: 8px 10px; min-width: 56px; text-align: center; }
        }

        .pi-chip-strip { display:none; }

        @media (max-width:900px) {
          .pi-chip-strip { display:flex; flex-direction:row; gap:8px; overflow-x:auto;
            padding-bottom:4px; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
          .pi-chip-strip::-webkit-scrollbar { display:none; }
          .pi-chip { flex:0 0 auto; display:flex; flex-direction:column; align-items:center;
            gap:3px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
            border-radius:8px; padding:6px 8px; min-width:44px;
            font-family:'VT323',monospace; font-size:9px; color:rgba(255,255,255,.45); }
          .pi-label-text { display:none; }
          .pi-table { display:none !important; }
        }

        /* Personal Info table in 260px left sidebar */
        .profile-sidebar .pi-table td { word-break: break-word; overflow-wrap: anywhere; }
        .profile-sidebar .info-key { width: 75px; }

        @media (prefers-reduced-motion:reduce) {
          .zee-entry,.zee-glitch::before,.zee-glitch::after,.zee-module-hdr::after,.zee-led { animation:none !important; }
        }

        /* ── MOBILE MINI STICKY HEADER ── */
        .profile-mini-header {
          position: fixed; top: 56px; left: 0; right: 0; z-index: 200;
          height: 40px; display: flex; align-items: center; gap: 10px;
          padding: 0 14px;
          background: rgba(7,12,30,.97); backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,.06);
          transform: translateY(-100%);
          transition: transform .2s ease;
          pointer-events: none;
        }
        .profile-mini-header.visible {
          transform: translateY(0);
          pointer-events: auto;
        }

        /* ── STATION CONTENT ── */
        .station-walltoggle {
          display: flex; gap: 4px; padding: 2px;
          background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.06);
          border-radius: 8px;
        }

        /* On desktop restore pi-table inside stations */
        @media (min-width:901px) {
          .pi-label-text { display: inline !important; }
          .pi-table { display: table !important; }
          .pi-chip-strip { display: none !important; }
        }
      `}} />

      {/* CRT scanlines */}
      <div aria-hidden="true" style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 999, opacity: 0.038, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.45) 2px,rgba(0,0,0,.45) 4px)" }} />
      {/* Vignette */}
      <div aria-hidden="true" style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 998, background: "radial-gradient(ellipse 110% 110% at 50% 50%,transparent 60%,rgba(0,0,0,.55) 100%)" }} />
      <div aria-hidden="true" style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 0, background: `radial-gradient(ellipse 65% 45% at 50% 0%,${primary}0e 0%,transparent 65%)` }} />

      <NavBar />

      {/* ── MOBILE MINI STICKY HEADER — collapses into view after scroll ── */}
      {isMobile && profileUser && (
        <div className={`profile-mini-header${scrolled ? " visible" : ""}`}
          style={{ borderLeft: `3px solid ${primary}` }}>
          <img src={profileUser.avatar_url ?? getAvatar(profileUser.zid)} alt={profileUser.display_name}
            style={{ width: "26px", height: "26px", borderRadius: "50%", border: `1px solid ${primary}40`, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profileUser.display_name}
            </div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px" }}>
              @{profileUser.zid}
            </div>
          </div>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6BCB77", boxShadow: "0 0 6px #6BCB77", flexShrink: 0, display: "block" }} />
        </div>
      )}

      {/* ── ACCESS COUNTER — Orkut segment display ── */}
      {visitorNum && (
        <div style={{ borderBottom: `1px solid ${primary}20`, background: `linear-gradient(90deg,transparent,${primary}09 50%,transparent)`, textAlign: "center", padding: "5px 0", animation: "zee-visitor .5s ease-out", position: "relative", zIndex: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", border: "1px solid rgba(180,255,0,.18)", borderRadius: "6px", padding: "3px 16px", background: "rgba(0,0,0,.45)", boxShadow: "0 0 12px rgba(180,255,0,.05)" }}>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.28)", letterSpacing: "3px" }}>ACCESS COUNTER</span>
            <span style={{ width: "1px", height: "12px", background: "rgba(180,255,0,.22)" }} />
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "18px", color: "#B4FF00", letterSpacing: "4px", textShadow: "0 0 8px rgba(180,255,0,.9),0 0 18px rgba(180,255,0,.4)" }}>
              #{visitorNum.toLocaleString()}
            </span>
          </span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MAIN GRID
      ════════════════════════════════════════════════════════ */}
      <div className="profile-grid">

        {/* ═══════════ LEFT SIDEBAR ═══════════ */}
        <div className="profile-sidebar">

          {/* ── PROFILE CARD (kept, mobile-capped) ── */}
          <div
            className="profile-card-wrap zee-entry"
            style={{ borderRadius: "20px", boxShadow: `0 0 40px ${gen?.accentGlow ?? `${primary}30`},0 0 80px ${gen?.accentGlow ?? `${primary}18`}`, transition: "box-shadow .5s", position: "relative" }}
          >
            <ProfileCard
              name={profileUser?.display_name || ""}
              title={profileUser?.zid || ""}
              handle={(profileUser?.display_name || "").toLowerCase().replace(/\s+/g, "_")}
              status={profileUser?.status_message || "Online"}
              contactText={isOwner ? "✎ Edit Me" : "⚡ Buzz"}
              avatarUrl={profileUser?.avatar_url ?? getAvatar(profileUser?.zid ?? "")}
              miniAvatarUrl={profileUser?.avatar_url ?? getAvatar(profileUser?.zid ?? "")}
              showUserInfo={true} enableTilt={true} enableMobileTilt={true}
              behindGlowColor={primary} behindGlowSize="60%"
              innerGradient={`linear-gradient(145deg,#0f0c29 0%,${primary}22 50%,#1a0533 100%)`}
              onContactClick={() => isOwner ? router.push("/profile") : undefined}
              hexItems={profileUser?.personal_info ? buildHexItems(profileUser.personal_info, false) : undefined}
              influenceTier={(tier.label.charAt(0) + tier.label.slice(1).toLowerCase()) as any}
              influenceScore={profileUser?.influence_score ?? 0}
              // trustScore={vibes?.trustworthy_score}
              // coolScore={vibes?.cool_score}
              // sexyScore={vibes?.sexy_score}
              onlineStatus={isOwner ? myOnlineStatus : (profileUser?.online_status as OnlineStatus | undefined) ?? "online"}
            />
            {/* Gen badge — overlaid at bottom-center of card */}
            {gen && (
              <div className="pc-gen-badge" style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", zIndex: 10, pointerEvents: "none" }}>
                <GenBadge gen={gen} size="sm" />
              </div>
            )}
          </div>

          {/* ── Mood tag — sits below card, above the action bar ── */}
          {lastMood && (
            <div style={{ display: "none", justifyContent: "center", marginTop: "2px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "4px 12px", borderRadius: "20px", fontSize: "10px",
                fontFamily: "'Nunito',sans-serif", fontWeight: 700,
                background: getMoodStyle(lastMood).bg,
                border: `1px solid ${getMoodStyle(lastMood).border}`,
                color: getMoodStyle(lastMood).text,
                backdropFilter: "blur(8px)",
                boxShadow: `0 2px 12px ${getMoodStyle(lastMood).border}`,
                animation: "zee-mood-in .4s ease-out",
              }}>
                {lastMood}
              </span>
            </div>
          )}

          <div style={{ height: "2.5px", background: `linear-gradient(90deg,${primary} 0%,${secondary} 50%,${primary} 100%)`, boxShadow: `0 0 12px ${primary}60` }} />

          {!isMobile && (
            <div style={{ background: `${primary}09`, border: `1px solid ${primary}20`, borderRadius: "7.5px", padding: "8px 10px", animation: "zee-mood-in .4s ease-out" }}>
              {/* ── Action buttons ── */}
              {actionBarContent}
            </div>
          )}

          {/* ── MOBILE: Profile Snapshot + Station System ── */}
          {isMobile && (
            <>
              <ProfileSnapshot
                primary={primary} secondary={secondary} tier={tier}
                postCount={postCount} friendCount={friendCount}
                influenceScore={profileUser?.influence_score ?? 0}
                mutualFriends={mutualFriends} profileName={profileUser?.display_name ?? ""}
                bio={profileUser?.mdx_profile ?? null}
                bioExpanded={bioExpanded} setBioExpanded={setBioExpanded}
                vibes={vibes} myRating={myRating} ratingOpen={ratingOpen}
                ratingDraft={ratingDraft} ratingSubmitting={ratingSubmitting} ratingDone={ratingDone}
                setRatingOpen={setRatingOpen} setRatingDraft={setRatingDraft} onRate={handleRateVibes}
                viewerId={viewerId} isOwner={isOwner} showVibes={privacySettings.show_vibes}
                actionBar={actionBarContent}
              />

              <StationStrip activeStation={activeStation} setActiveStation={setActiveStation} primary={primary} scrolled={scrolled} />

              {/* ════ WALL STATION ════ */}
              {activeStation === "wall" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(isOwner || privacySettings.show_zlogger) && (
                    <div className="station-walltoggle">
                      {(["posts", "zlogs"] as const).map(t => (
                        <button key={t} onClick={() => setActiveWallTab(t)} style={{ flex: 1, padding: "8px 0", borderRadius: "6px", background: activeWallTab === t ? `${primary}18` : "transparent", border: "none", color: activeWallTab === t ? primary : "rgba(255,255,255,.3)", fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 700, letterSpacing: "1.2px", cursor: "pointer", transition: "all .15s" }}>
                          {t === "posts" ? "WALL POSTS" : "ZLOGS"}
                        </button>
                      ))}
                    </div>
                  )}
                  {activeWallTab === "posts" && (
                    <>
                      {!privacySettings.show_wall && !isOwner && <EmptyTerminal label="WALL IS PRIVATE" primary={primary} />}
                      {(privacySettings.show_wall || isOwner) && (
                        <GlobalFeed userId={viewerId ?? ""} userZid={viewerZid ?? undefined} wallOwnerId={profileUser!.id} hideComposer={!viewerId || (privacySettings.wall_friends_only && !isOwner && friendStatus.status !== "friends")} />
                      )}
                    </>
                  )}
                  {activeWallTab === "zlogs" && (
                    <PortalCard accent={`${primary}25`}>
                      <ModuleHeader icon={<BookOpen size={11} />} title="ZLOGGER" accent={primary} right={isOwner ? <Link href="/zlogger/new" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "5px", background: `${primary}18`, border: `1px solid ${primary}35`, color: primary, fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", textDecoration: "none" }}>+ NEW</Link> : undefined} />
                      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {zlogsLoading ? <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}><Loader2 size={20} color={primary} style={{ animation: "spin 1s linear infinite" }} /></div>
                          : profileZlogs.length === 0 ? <div style={{ textAlign: "center", padding: "24px 0", fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.2)", letterSpacing: "2px" }}>NO ZLOGS YET</div>
                            : profileZlogs.map(z => (
                              <Link key={z.id} href={`/zlogger/${z.slug}`} style={{ textDecoration: "none", display: "block", padding: "10px 12px", background: "rgba(255,255,255,.03)", border: `1px solid ${primary}18`, borderRadius: "8px" }}>
                                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{z.title}</div>
                                {z.mood && <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: primary, letterSpacing: "1px" }}>{z.mood} · </span>}
                                <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)", letterSpacing: "1px" }}>{new Date(z.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </Link>
                            ))}
                      </div>
                    </PortalCard>
                  )}
                </div>
              )}

              {/* ════ ABOUT STATION ════ */}
              {activeStation === "about" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Full bio */}
                  <PortalCard accent={`${primary}25`}>
                    <ModuleHeader icon={<UserCircle size={11} />} title="ABOUT ME" accent={primary} />
                    <div style={{ padding: "16px" }}>
                      {profileUser?.mdx_profile
                        ? <div style={{ whiteSpace: "pre-wrap", fontFamily: "'Nunito',sans-serif", fontSize: "13px", color: "rgba(255,255,255,.65)", lineHeight: "1.7", wordBreak: "break-word" }}>{profileUser.mdx_profile}</div>
                        : <><EmptyTerminal label="NO BIO WRITTEN YET" primary={primary} />{isOwner && <Link href="/profile" style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: primary, display: "block", marginTop: "10px", textDecoration: "none" }}>Add your story →</Link>}</>
                      }
                    </div>
                  </PortalCard>
                  {/* Personal Info — force table visible in station context */}
                  {personalInfoSection && (
                    <div style={{ ["--force-pi-table" as string]: "1" }}>
                      <style>{`.pi-table{display:table !important}.pi-chip-strip{display:none !important}.pi-label-text{display:inline !important}`}</style>
                      {personalInfoSection}
                    </div>
                  )}
                  {socialLinksSection}
                  {/* Last Login */}
                  {profileUser?.status_updated_at && (
                    <PortalCard accent="rgba(180,255,0,.1)" className="zee-entry">
                      <ModuleHeader icon={<Clock size={11} />} title="LAST LOGIN" accent="#B4FF00" />
                      <div style={{ padding: "10px 14px" }}>
                        <div style={{ background: "rgba(0,0,0,.5)", border: "1px solid rgba(180,255,0,.14)", borderRadius: "6px", padding: "10px 12px" }}>
                          <div style={{ fontFamily: "'VT323',monospace", fontSize: "16px", color: "#B4FF00", letterSpacing: "2px", textShadow: "0 0 8px rgba(180,255,0,.9)", marginBottom: "4px" }}>{formatDistanceToNow(new Date(profileUser.status_updated_at), { addSuffix: true }).toUpperCase()}</div>
                          <div style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(180,255,0,.4)", letterSpacing: "1.5px" }}>{format(new Date(profileUser.status_updated_at), "MMM dd, yyyy · hh:mm a").toUpperCase()}</div>
                        </div>
                      </div>
                    </PortalCard>
                  )}
                  {/* Profile Anthem */}
                  {profileUser?.theme_track_url && (() => {
                    const ytId = getYouTubeId(profileUser.theme_track_url);
                    const scEmbedUrl = !ytId ? getSoundCloudEmbedUrl(profileUser.theme_track_url) : null;
                    const spEmbedUrl = !ytId && !scEmbedUrl ? getSpotifyEmbedUrl(profileUser.theme_track_url) : null;
                    const trackName = decodeURIComponent(profileUser.theme_track_url.split("/").pop() ?? "").replace(/\.(mp3|wav|ogg|m4a)$/i, "").replace(/[-_]/g, " ") || "Profile Anthem";
                    return (
                      <PortalCard accent={`${primary}22`} className="zee-entry" style={{ overflow: "hidden" }}>
                        <div style={{ height: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 0 8px", background: `linear-gradient(90deg,${primary}44,rgba(255,45,135,.2),rgba(11,75,143,.3))`, borderBottom: "1px solid rgba(0,0,0,.4)" }}>
                          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,.85)", letterSpacing: "3px" }}>PROFILE ANTHEM</span>
                          <Music size={10} style={{ color: `${primary}80` }} />
                        </div>
                        {ytId ? <div style={{ margin: "4px 4px 0", borderRadius: "3px", overflow: "hidden", border: `1px solid ${primary}22` }}><iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`} style={{ width: "100%", height: "120px", border: "none", display: "block" }} allow="autoplay; encrypted-media" allowFullScreen /></div>
                          : scEmbedUrl ? <iframe width="100%" height="100" scrolling="no" frameBorder={0} allow="autoplay" src={scEmbedUrl} style={{ display: "block", border: "none", margin: "4px 4px 0" }} />
                            : spEmbedUrl ? <iframe src={spEmbedUrl} width="100%" height="152" frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" style={{ display: "block", border: "none", margin: "4px 4px 0" }} loading="lazy" />
                              : <div style={{ padding: "8px 10px", fontFamily: "'VT323',monospace", fontSize: "11px", color: primary, letterSpacing: "1.5px" }}>{trackName}</div>
                        }
                      </PortalCard>
                    );
                  })()}
                </div>
              )}

              {/* ════ CREW STATION ════ */}
              {activeStation === "crew" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Core 8 */}
                  <PortalCard accent="rgba(255,100,0,.2)" className="zee-entry">
                    <ModuleHeader icon={<Flame size={11} />} title="CORE 8" accent="#FF6400" right={<span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,100,0,.4)", letterSpacing: "1.5px" }}>HIERARCHY</span>} />
                    <div style={{ padding: "12px" }}>
                      <div className="c8-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(slot => {
                          const entry = coreEight.find(c => c.position === slot);
                          const friend = entry?.friend;
                          const medal = MEDALS[slot];
                          return (
                            <div key={slot} className="c8-slot" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                              {friend ? (
                                <div draggable={isOwner} onDragStart={() => isOwner && setDraggingSlot(slot)} onDragEnd={() => setDraggingSlot(null)} onDragOver={e => { if (isOwner && draggingSlot !== null) e.preventDefault(); }} onDrop={() => { if (isOwner && draggingSlot !== null && draggingSlot !== slot) handleC8Swap(draggingSlot, slot); }}
                                  onTouchStart={() => { if (!isOwner) return; mobileHoldTimer.current = setTimeout(() => setDraggingSlot(slot), 500); }}
                                  onTouchEnd={() => clearTimeout(mobileHoldTimer.current!)}
                                  onClick={() => { if (!isOwner) return; if (draggingSlot !== null && draggingSlot !== slot) { handleC8Swap(draggingSlot, slot); return; } setC8EditSlot(slot); }}
                                  style={{ position: "relative", opacity: draggingSlot === slot ? 0.4 : 1, transition: "opacity .15s", cursor: isOwner ? "grab" : "pointer", outline: draggingSlot !== null && draggingSlot !== slot && isOwner ? `2px dashed ${primary}50` : "none", borderRadius: "10px" }}>
                                  <Link href={`/u/${friend.zid}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                                    <div className="c8-slot-img" style={{ width: "46px", height: "46px", borderRadius: "10px", overflow: "hidden", border: `1px solid ${medal ? medal.color + "60" : primary + "35"}`, boxShadow: slot <= 3 ? `0 0 8px ${medal.glow}` : `0 0 8px ${primary}15`, position: "relative" }}>
                                      <img src={getAvatar(friend.zid)} alt={friend.display_name} style={{ width: "100%", height: "100%", display: "block" }} />
                                    </div>
                                    {slot <= 3 && medal && <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "14px", height: "14px", borderRadius: "50%", background: "#070C1E", border: `1px solid ${medal.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: medal.color, boxShadow: `0 0 5px ${medal.glow}`, zIndex: 2 }}>{medal.label}</div>}
                                  </Link>
                                  {isOwner && <div onClick={e => { e.stopPropagation(); setC8EditSlot(slot); }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", opacity: 0, transition: "opacity .15s", cursor: "pointer", zIndex: 3 }} onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = "1"} onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = "0"}><Pencil size={13} style={{ color: "white" }} /></div>}
                                  <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "7px", color: "rgba(255,255,255,.5)", textAlign: "center", width: "46px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>{friend.display_name}</p>
                                </div>
                              ) : (
                                <div onDragOver={e => { if (isOwner && draggingSlot !== null) e.preventDefault(); }} onDrop={() => { if (isOwner && draggingSlot !== null && draggingSlot !== slot) handleC8Swap(draggingSlot, slot); }}
                                  onClick={() => { if (!isOwner) return; if (draggingSlot !== null && draggingSlot !== slot) { handleC8Swap(draggingSlot, slot); return; } setC8EditSlot(slot); }}
                                  style={{ width: "46px", height: "46px", borderRadius: "10px", border: `1px dashed ${isOwner ? (draggingSlot !== null ? primary + "80" : primary + "45") : primary + "18"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: isOwner ? "pointer" : "default", background: draggingSlot !== null && isOwner ? `${primary}0a` : "transparent", transition: "border-color .15s, background .15s" }}>
                                  {isOwner ? <span style={{ fontSize: "16px", color: primary, opacity: .5 }}>+</span> : <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.15)" }}>0{slot}</span>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </PortalCard>
                  {/* Full Vibes module */}
                  {privacySettings.show_vibes && (
                    <VibesModule vibes={vibes} viewerId={viewerId} isOwner={isOwner} primary={primary} isMobile={true}
                      myRating={myRating} ratingOpen={ratingOpen} ratingDraft={ratingDraft}
                      ratingSubmitting={ratingSubmitting} ratingDone={ratingDone}
                      setRatingOpen={setRatingOpen} setRatingDraft={setRatingDraft} onRate={handleRateVibes} />
                  )}
                  {viewerId && mutualFriends.length > 0 && !isOwner && (
                    <MutualFriends friends={mutualFriends} profileName={profileUser?.display_name ?? ""} primary={primary} />
                  )}
                  <RecentVisitors primary={primary} visitorNum={visitorNum} visitors={recentVisitors} />
                  {profileUser && <ActivityTicker posts={posts} friendActivity={recentFriendActivity} profileUser={profileUser} primary={primary} secondary={secondary} />}
                </div>
              )}

              {/* ════ MEDIA STATION ════ */}
              {activeStation === "media" && (
                <PortalCard accent={`${primary}25`}>
                  <ModuleHeader icon={<ImageIcon size={11} />} title="PHOTOS" accent={primary} right={<span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}60`, letterSpacing: "1px" }}>{photos.length}/5</span>} />
                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {isOwner && (
                      <>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto || photos.length >= 5} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", borderRadius: "10px", background: "transparent", border: `1px dashed ${primary}45`, color: primary, fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "1px", cursor: (uploadingPhoto || photos.length >= 5) ? "not-allowed" : "pointer", opacity: (uploadingPhoto || photos.length >= 5) ? .4 : 1 }}>
                          <Camera size={14} /> {uploadingPhoto ? "UPLOADING..." : photos.length >= 5 ? "LIMIT REACHED (5/5)" : "UPLOAD PHOTO"}
                        </button>
                      </>
                    )}
                    {photos.length === 0 ? <EmptyTerminal label="NO PHOTOS YET" primary={primary} /> : (
                      <div className="photos-grid">
                        {photos.map(url => (
                          <div key={url} style={{ aspectRatio: "1", borderRadius: "8px", overflow: "hidden", border: `1px solid ${primary}20`, position: "relative" }}>
                            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.08) 3px,rgba(0,0,0,.08) 4px)", pointerEvents: "none" }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PortalCard>
              )}
            </>
          )}

          {/* ── DESKTOP ONLY: Extended sidebar content ── */}
          {!isMobile && (
            <>
              <StarDivider color={`${primary}20`} />

              {/* ── INFLUENCE (moved from right column) ── */}
              <PortalCard accent={`${primary}18`} className="zee-entry">
                <ModuleHeader icon={<Zap size={11} />} title="INFLUENCE" accent={secondary} />
                <div style={{ padding: "10px 12px" }}>
                  <div className="influence-grid">
                    {/* POSTS */}
                    <div style={{ background: "rgba(0,0,0,.4)", border: `1px solid ${secondary}22`, borderRadius: "10px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ color: secondary, marginBottom: "3px", display: "flex", justifyContent: "center" }}><MessageCircle size={12} /></div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "15px", color: secondary, textShadow: `0 0 8px ${secondary}66` }}>{postCount}</div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px" }}>POSTS</div>
                    </div>
                    {/* FRIENDS */}
                    <div style={{ background: "rgba(0,0,0,.4)", border: `1px solid #00E5FF22`, borderRadius: "10px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ color: "#00E5FF", marginBottom: "3px", display: "flex", justifyContent: "center" }}><UserCheck size={12} /></div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "15px", color: "#00E5FF", textShadow: "0 0 8px #00E5FF66" }}>{friendCount}</div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px" }}>FRIENDS</div>
                    </div>
                    {/* ZAPS */}
                    <div style={{ background: "rgba(0,0,0,.4)", border: `1px solid #FFD70022`, borderRadius: "10px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ color: "#FFD700", marginBottom: "3px", display: "flex", justifyContent: "center" }}><Zap size={12} /></div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "15px", color: "#FFD700", textShadow: "0 0 8px #FFD70066" }}>{totalZaps}</div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px" }}>ZAPS</div>
                    </div>
                    {/* BUZZES */}
                    <div style={{ background: "rgba(0,0,0,.4)", border: `1px solid #FF007A22`, borderRadius: "10px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ color: "#FF007A", marginBottom: "3px", display: "flex", justifyContent: "center" }}><Activity size={12} /></div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "15px", color: "#FF007A", textShadow: "0 0 8px #FF007A66" }}>{buzzCount}</div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px" }}>BUZZES</div>
                    </div>
                    {/* SCORE — with tooltip */}
                    <div
                      style={{ background: "rgba(0,0,0,.4)", border: `1px solid #B4FF0022`, borderRadius: "10px", padding: "8px 6px", textAlign: "center", position: "relative", cursor: "help" }}
                      onMouseEnter={e => { const t = e.currentTarget.querySelector(".score-tip") as HTMLElement; if (t) t.style.opacity = "1"; }}
                      onMouseLeave={e => { const t = e.currentTarget.querySelector(".score-tip") as HTMLElement; if (t) t.style.opacity = "0"; }}
                    >
                      <div style={{ color: "#B4FF00", marginBottom: "3px", display: "flex", justifyContent: "center" }}><Zap size={12} /></div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "15px", color: "#B4FF00", textShadow: "0 0 8px #B4FF0066" }}>{profileUser?.influence_score ?? 0}</div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px" }}>SCORE</div>
                      <div className="score-tip" style={{
                        opacity: 0, transition: "opacity .15s", pointerEvents: "none",
                        position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                        width: "180px", background: "rgba(7,12,30,.97)", border: "1px solid rgba(180,255,0,.25)",
                        borderRadius: "8px", padding: "8px 10px", zIndex: 100,
                        boxShadow: "0 8px 24px rgba(0,0,0,.6), 0 0 16px rgba(180,255,0,.08)",
                      }}>
                        <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 700, color: "#B4FF00", margin: "0 0 5px", letterSpacing: "1px" }}>INFLUENCE SCORE</p>
                        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "10px", color: "rgba(255,255,255,.55)", margin: "0 0 7px", lineHeight: 1.4 }}>Your reputation on the network. Earned through activity and engagement.</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {[
                            { a: "Post on wall", p: "+1" },
                            { a: "Receive Zap", p: "+1" },
                            { a: "Receive Buzz", p: "+2" },
                            { a: "New friend", p: "+3" },
                          ].map(r => (
                            <div key={r.a} style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "9px", color: "rgba(255,255,255,.35)" }}>{r.a}</span>
                              <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#B4FF00" }}>{r.p} pt</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* TIER — clickable */}
                    <div
                      onClick={() => setTierModalOpen(true)}
                      style={{ background: "rgba(0,0,0,.4)", border: `1px solid ${tier.color}22`, borderRadius: "10px", padding: "8px 6px", textAlign: "center", cursor: "pointer", transition: "border-color .15s, background .15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = `${tier.color}10`; (e.currentTarget as HTMLDivElement).style.borderColor = `${tier.color}55`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,.4)"; (e.currentTarget as HTMLDivElement).style.borderColor = `${tier.color}22`; }}
                    >
                      <div style={{ color: tier.color, marginBottom: "3px", display: "flex", justifyContent: "center" }}><Award size={12} /></div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: tier.color, textShadow: `0 0 8px ${tier.color}66`, letterSpacing: "0.5px" }}>{tier.label}</div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: "1.5px" }}>TIER ↗</div>
                    </div>
                  </div>
                  {/* Mobile horizontal chip scroll */}
                  <div className="influence-chip-strip">
                    {[
                      { icon: <MessageCircle size={12} />, val: postCount, label: "POSTS", color: secondary },
                      { icon: <UserCheck size={12} />, val: friendCount, label: "FRIENDS", color: "#00E5FF" },
                      { icon: <Zap size={12} />, val: totalZaps, label: "ZAPS", color: "#FFD700" },
                      { icon: <Activity size={12} />, val: buzzCount, label: "BUZZES", color: "#FF007A" },
                      { icon: <Zap size={12} />, val: profileUser?.influence_score ?? 0, label: "SCORE", color: "#B4FF00" },
                      { icon: <Award size={12} />, val: tier.label, label: "TIER", color: tier.color },
                    ].map(({ icon, val, label, color }) => (
                      <div key={label} className="influence-chip" style={{ border: `1px solid ${color}22` }}>
                        <div style={{ color, display: "flex", justifyContent: "center" }}>{icon}</div>
                        <div style={{
                          fontFamily: "'VT323',monospace", fontSize: "14px", color,
                          textShadow: `0 0 6px ${color}66`
                        }}>{val}</div>
                        <div style={{
                          fontFamily: "'VT323',monospace", fontSize: "8px",
                          color: "rgba(255,255,255,.3)", letterSpacing: "1.5px"
                        }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </PortalCard>

              {/* ── PERSONAL INFO (moved from middle column) ── */}
              {personalInfoSection}

              {profileUser?.theme_track_url && (() => {
                const ytId = getYouTubeId(profileUser.theme_track_url);
                const scEmbedUrl = !ytId ? getSoundCloudEmbedUrl(profileUser.theme_track_url) : null;
                const spEmbedUrl = !ytId && !scEmbedUrl ? getSpotifyEmbedUrl(profileUser.theme_track_url) : null;
                const trackName = decodeURIComponent(profileUser.theme_track_url.split("/").pop() ?? "")
                  .replace(/\.(mp3|wav|ogg|m4a)$/i, "").replace(/[-_]/g, " ") || "Profile Anthem";

                return (
                  <PortalCard accent={`${primary}22`} className="zee-entry" style={{ overflow: "hidden" }}>
                    {/* ZeeAmp title bar */}
                    <div style={{
                      height: "20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0 6px 0 8px",
                      background: `linear-gradient(90deg,${primary}44,rgba(255,45,135,.2),rgba(11,75,143,.3))`,
                      borderBottom: "1px solid rgba(0,0,0,.4)",
                    }}>
                      <span style={{
                        fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 700,
                        color: "rgba(255,255,255,.85)", letterSpacing: "3px"
                      }}>PROFILE ANTHEM</span>
                      <Music size={10} style={{ color: `${primary}80` }} />
                    </div>

                    {ytId ? (
                      /* ── YouTube path ── */
                      <div>
                        <div style={{
                          margin: "4px 4px 0", borderRadius: "3px", overflow: "hidden",
                          border: `1px solid ${primary}22`,
                          background: "#000a14",
                        }}>
                          {/* LCD header */}
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "4px 7px 3px", borderBottom: `1px solid ${primary}15`,
                          }}>
                            <div style={{ overflow: "hidden", flex: 1 }}>
                              <div className="anthem-marquee" style={{
                                whiteSpace: "nowrap",
                                fontFamily: "'VT323',monospace", fontSize: "12px", color: primary,
                                textShadow: `0 0 6px ${primary}99`, letterSpacing: "2px",
                                animation: "za-scroll 12s linear infinite",
                              }}>
                                {`YOUTUBE  •  ${profileUser.display_name?.toUpperCase()}  •  PROFILE ANTHEM  •  `}
                                {`YOUTUBE  •  ${profileUser.display_name?.toUpperCase()}  •  PROFILE ANTHEM  •  `}
                              </div>
                            </div>
                            <span style={{
                              fontFamily: "'VT323',monospace", fontSize: "8px",
                              color: `${primary}66`, letterSpacing: "1px", marginLeft: "8px", flexShrink: 0
                            }}>YT</span>
                          </div>
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                            style={{ width: "100%", height: "120px", border: "none", display: "block" }}
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                          />
                        </div>
                        <div style={{
                          padding: "4px 8px 8px", fontFamily: "'VT323',monospace", fontSize: "9px",
                          color: "rgba(255,255,255,.2)", letterSpacing: "1.5px", textAlign: "center"
                        }}>
                          CLICK PLAY ABOVE TO START
                        </div>
                      </div>
                    ) : scEmbedUrl ? (
                      /* ── SoundCloud path ── */
                      <div style={{ padding: "4px" }}>
                        <div style={{ background: "#000a14", border: `1px solid ${primary}22`, borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 7px 3px", borderBottom: `1px solid ${primary}15` }}>
                            <div style={{ overflow: "hidden", flex: 1 }}>
                              <div style={{ whiteSpace: "nowrap", fontFamily: "'VT323',monospace", fontSize: "12px", color: primary, textShadow: `0 0 6px ${primary}99`, letterSpacing: "2px", animation: "za-scroll 12s linear infinite" }}>
                                {`SOUNDCLOUD  •  ${profileUser.display_name?.toUpperCase()}  •  PROFILE ANTHEM  •  SOUNDCLOUD  •  ${profileUser.display_name?.toUpperCase()}  •  PROFILE ANTHEM  •  `}
                              </div>
                            </div>
                            <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: `${primary}66`, letterSpacing: "1px", marginLeft: "8px", flexShrink: 0 }}>SC</span>
                          </div>
                          <iframe
                            width="100%" height="100" scrolling="no" frameBorder={0} allow="autoplay"
                            src={scEmbedUrl}
                            style={{ display: "block", border: "none" }}
                          />
                        </div>
                      </div>
                    ) : spEmbedUrl ? (
                      /* ── Spotify path ── */
                      <div style={{ padding: "4px" }}>
                        <div style={{ background: "#000a14", border: `1px solid ${primary}22`, borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 7px 3px", borderBottom: `1px solid ${primary}15` }}>
                            <div style={{ overflow: "hidden", flex: 1 }}>
                              <div style={{ whiteSpace: "nowrap", fontFamily: "'VT323',monospace", fontSize: "12px", color: "#1DB954", textShadow: "0 0 6px #1DB95499", letterSpacing: "2px", animation: "za-scroll 12s linear infinite" }}>
                                {`SPOTIFY  •  ${profileUser.display_name?.toUpperCase()}  •  PROFILE ANTHEM  •  SPOTIFY  •  ${profileUser.display_name?.toUpperCase()}  •  PROFILE ANTHEM  •  `}
                              </div>
                            </div>
                            <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "#1DB95466", letterSpacing: "1px", marginLeft: "8px", flexShrink: 0 }}>SP</span>
                          </div>
                          <iframe
                            src={spEmbedUrl}
                            width="100%" height="152" frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            style={{ display: "block", border: "none" }}
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ) : (
                      /* ── Direct audio path — ZeeAmp LCD player ── */
                      <div>
                        {/* LCD display */}
                        <div style={{
                          position: "relative", margin: "4px 4px 0", borderRadius: "3px",
                          background: "#000a14", border: `1px solid ${primary}22`,
                          padding: "5px 7px 4px", overflow: "hidden",
                        }}>
                          {/* CRT scanlines overlay */}
                          <div aria-hidden style={{
                            position: "absolute", inset: 0, pointerEvents: "none",
                            backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.18) 2px,rgba(0,0,0,.18) 4px)",
                            borderRadius: "3px"
                          }} />
                          {/* Row 1: play indicator + EQ bars */}
                          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "6px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                              <span style={{
                                fontFamily: "'VT323',monospace", fontSize: "10px",
                                color: musicPlaying ? primary : "rgba(255,255,255,.25)",
                                textShadow: musicPlaying ? `0 0 6px ${primary}` : "none"
                              }}>
                                {musicPlaying ? "▶" : "⏸"}
                              </span>
                              <span style={{
                                fontFamily: "'VT323',monospace", fontSize: "22px", lineHeight: 1,
                                color: primary, textShadow: `0 0 8px ${primary}cc`, letterSpacing: "2px"
                              }}>
                                ANTHEM
                              </span>
                            </div>
                            {/* 10-bar EQ spectrum */}
                            <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5px", height: "16px", paddingBottom: "1px" }}>
                              {[4, 9, 6, 11, 5, 8, 4, 7, 10, 6].map((h, i) => (
                                <div key={i} className={musicPlaying ? `za-eq-${i + 1}` : ""}
                                  style={{
                                    width: "3px", height: musicPlaying ? undefined : `${h}px`,
                                    minHeight: "3px", backgroundColor: primary,
                                    boxShadow: musicPlaying ? `0 0 4px ${primary}99` : "none",
                                    borderRadius: "1px", opacity: musicPlaying ? 1 : 0.22, transition: "opacity .3s"
                                  }} />
                              ))}
                            </div>
                          </div>
                          {/* Row 2: scrolling track title */}
                          <div style={{
                            marginTop: "4px", overflow: "hidden", height: "14px",
                            background: `${primary}0a`, borderRadius: "2px", border: `1px solid ${primary}18`
                          }}>
                            <span className="anthem-marquee" style={{
                              display: "block",
                              fontFamily: "'VT323',monospace", fontSize: "12px", color: primary,
                              textShadow: `0 0 5px ${primary}99`, letterSpacing: "2px", lineHeight: "14px",
                              paddingLeft: "5px", whiteSpace: "nowrap",
                              animation: "za-scroll 10s linear infinite"
                            }}>
                              {`${trackName}  •  PROFILE ANTHEM  •  `}
                              {`${trackName}  •  PROFILE ANTHEM  •  `}
                            </span>
                          </div>
                        </div>
                        {/* Transport row */}
                        <div style={{ display: "flex", alignItems: "center", padding: "5px 6px 6px", gap: "4px" }}>
                          {/* Play/Pause bevel button */}
                          <div style={{
                            border: "1px solid rgba(255,255,255,.1)",
                            boxShadow: "1px 1px 2px rgba(0,0,0,.5),-1px -1px 2px rgba(255,255,255,.04)"
                          }}>
                            <button onClick={toggleMusic} aria-label={musicPlaying ? "Pause profile anthem" : "Play profile anthem"} className="za-btn" style={{
                              width: "34px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center",
                              background: musicPlaying
                                ? `linear-gradient(180deg,${primary}40,${primary}18)`
                                : "linear-gradient(180deg,rgba(255,255,255,.07),rgba(0,0,0,.3))",
                              border: "none", cursor: "pointer", color: musicPlaying ? primary : "rgba(255,255,255,.7)",
                              boxShadow: musicPlaying ? `inset 0 0 8px ${primary}33` : undefined,
                              transition: "all .15s", borderRadius: "1px",
                            }}>
                              {musicPlaying
                                ? <Pause size={11} style={{ color: primary }} />
                                : <Play size={11} style={{ color: primary }} />
                              }
                            </button>
                          </div>
                          <div style={{ flex: 1 }} />
                          {/* STEREO badge */}
                          <span style={{
                            fontFamily: "'VT323',monospace", fontSize: "9px", color: primary,
                            textShadow: `0 0 5px ${primary}99`, letterSpacing: "1px",
                            background: `${primary}14`, border: `1px solid ${primary}33`,
                            borderRadius: "2px", padding: "0 4px", lineHeight: "14px"
                          }}>
                            STEREO
                          </span>
                        </div>
                      </div>
                    )}
                  </PortalCard>
                );
              })()}


              {socialLinksSection}

            </>)}

        </div>


        {/* ═══════════ MIDDLE COLUMN ═══════════ */}
        <div className="profile-main">

          {/* ── ABOUT ME (desktop only — mobile shows in sidebar above) ── */}
          {!isMobile && (
            <PortalCard accent={`${primary}25`}>
              <ModuleHeader icon={<Users size={11} />} title="ABOUT ME" accent={primary} />
              <div style={{ padding: "16px" }}>
                {profileUser?.mdx_profile ? (
                  <div style={{ whiteSpace: "pre-wrap", fontFamily: "'Nunito',sans-serif", fontSize: "13px", color: "rgba(255,255,255,.65)", lineHeight: "1.7", wordBreak: "break-word" }}>
                    {profileUser.mdx_profile}
                  </div>
                ) : (
                  <>
                    <EmptyTerminal label="NO BIO WRITTEN YET" primary={primary} />
                    {isOwner && <Link href="/profile" style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: primary, display: "block", marginTop: "10px", textDecoration: "none" }}>Add your story →</Link>}
                  </>
                )}
              </div>
            </PortalCard>
          )}

          {/* ── TAB BAR ── */}
          <PortalCard accent={`${primary}25`} style={{ overflow: "hidden" }}>
            <div style={{ display: "flex" }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: "13px 0",
                  fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  background: activeTab === tab ? `linear-gradient(180deg,${primary}14 0%,transparent 100%)` : "transparent",
                  color: activeTab === tab ? primary : "rgba(255,255,255,.28)",
                  borderTop: "none", borderRight: "none", borderLeft: "none",
                  borderBottom: activeTab === tab ? `2px solid ${primary}` : "2px solid rgba(255,255,255,.04)",
                  cursor: "pointer", transition: "all .2s",
                  boxShadow: activeTab === tab ? `0 2px 12px ${primary}25` : "none",
                  textShadow: activeTab === tab ? `0 0 10px ${primary}80` : "none",
                }}>
                  <span className={activeTab === tab ? "zee-tab-active" : ""}>{tab}</span>
                </button>
              ))}
            </div>
          </PortalCard>

          {/* ════════════ WALL TAB ════════════
              Facebook 2006 Mini-Feed with date separators + "N stories"
          ════════════════════════════════════ */}
          {activeTab === "wall" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Privacy gate */}
              {!privacySettings.show_wall && !isOwner && (
                <EmptyTerminal label="WALL IS PRIVATE" primary={primary} />
              )}

              {(privacySettings.show_wall || isOwner) && (
                <GlobalFeed
                  userId={viewerId ?? ""}
                  userZid={viewerZid ?? undefined}
                  wallOwnerId={profileUser!.id}
                  hideComposer={!viewerId || (privacySettings.wall_friends_only && !isOwner && friendStatus.status !== "friends")}
                />
              )}
            </div>
          )}

          {/* ════════════ PHOTOS TAB ════════════ */}
          {activeTab === "photos" && (
            <PortalCard accent={`${primary}25`}>
              <ModuleHeader
                icon={<ImageIcon size={11} />}
                title="PHOTOS"
                accent={primary}
                right={
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}60`, letterSpacing: "1px" }}>
                    {photos.length}/5
                  </span>
                }
              />
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {isOwner && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto || photos.length >= 5} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", borderRadius: "10px", background: "transparent", border: `1px dashed ${primary}45`, color: primary, fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "1px", cursor: (uploadingPhoto || photos.length >= 5) ? "not-allowed" : "pointer", opacity: (uploadingPhoto || photos.length >= 5) ? .4 : 1, transition: "all .2s" }}>
                      <Camera size={14} /> {uploadingPhoto ? "UPLOADING..." : photos.length >= 5 ? "LIMIT REACHED (5/5)" : "UPLOAD PHOTO"}
                    </button>
                    <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.18)", textAlign: "center", margin: 0, letterSpacing: "1px" }}>
                      Stored in Supabase Storage · bucket: user-media
                    </p>
                  </>
                )}
                {photos.length === 0
                  ? <EmptyTerminal label="NO PHOTOS YET" primary={primary} />
                  : (
                    <div className="photos-grid">
                      {photos.map((url) => (
                        <div key={url} style={{ aspectRatio: "1", borderRadius: "8px", overflow: "hidden", border: `1px solid ${primary}20`, boxShadow: `inset 0 0 12px ${primary}08`, position: "relative" }}>
                          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .35s ease,filter .35s ease" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.07)"; (e.currentTarget as HTMLImageElement).style.filter = "brightness(1.1) saturate(1.2)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; (e.currentTarget as HTMLImageElement).style.filter = ""; }}
                          />
                          {/* Scanline overlay */}
                          <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.08) 3px,rgba(0,0,0,.08) 4px)", pointerEvents: "none" }} />
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </PortalCard>
          )}

          {/* ════════════ ZLOGGER TAB ════════════ */}
          {activeTab === "zlogger" && (
            <PortalCard accent={`${primary}25`}>
              <ModuleHeader
                icon={<BookOpen size={11} />}
                title="ZLOGGER"
                accent={primary}
                right={
                  isOwner
                    ? <Link href="/zlogger/new" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "5px", background: `${primary}18`, border: `1px solid ${primary}35`, color: primary, fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", textDecoration: "none" }}>+ NEW POST</Link>
                    : undefined
                }
              />
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {zlogsLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                    <Loader2 size={20} color={primary} style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                ) : profileZlogs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.2)", letterSpacing: "2px" }}>NO ZLOGS YET</div>
                ) : (
                  profileZlogs.map(z => (
                    <Link key={z.id} href={`/zlogger/${z.slug}`} style={{ textDecoration: "none", display: "block", padding: "10px 12px", background: "rgba(255,255,255,.03)", border: `1px solid ${primary}18`, borderRadius: "8px", transition: "background .15s" }}>
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{z.title}</div>
                      {z.mood && <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: primary, letterSpacing: "1px" }}>{z.mood} · </span>}
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)", letterSpacing: "1px" }}>
                        {new Date(z.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </PortalCard>
          )}
        </div>

        {/* ═══════════ RIGHT COLUMN ═══════════ */}
        <div className="profile-right">

          {/* ── MUTUAL FRIENDS (desktop only) ── */}
          {!isMobile && viewerId && mutualFriends.length > 0 && !isOwner && (
            <MutualFriends friends={mutualFriends} profileName={profileUser?.display_name ?? ""} primary={primary} />
          )}

          {/* ── CORE 8 — with owner edit ── */}
          <PortalCard accent="rgba(255,100,0,.2)" className="zee-entry">
            <ModuleHeader icon={<Flame size={11} />} title="CORE 8" accent="#FF6400" right={<span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,100,0,.4)", letterSpacing: "1.5px" }}>HIERARCHY</span>} />
            <div style={{ padding: "12px" }}>
              <div className="c8-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(slot => {
                  const entry = coreEight.find(c => c.position === slot);
                  const friend = entry?.friend;
                  const medal = MEDALS[slot];
                  return (
                    <div key={slot} className="c8-slot" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      {friend ? (
                        <div
                          draggable={isOwner}
                          onDragStart={() => isOwner && setDraggingSlot(slot)}
                          onDragEnd={() => setDraggingSlot(null)}
                          onDragOver={e => { if (isOwner && draggingSlot !== null) e.preventDefault(); }}
                          onDrop={() => { if (isOwner && draggingSlot !== null && draggingSlot !== slot) handleC8Swap(draggingSlot, slot); }}
                          onTouchStart={() => {
                            if (!isOwner) return;
                            mobileHoldTimer.current = setTimeout(() => setDraggingSlot(slot), 500);
                          }}
                          onTouchEnd={() => clearTimeout(mobileHoldTimer.current!)}
                          onClick={() => {
                            if (!isOwner) return;
                            if (draggingSlot !== null && draggingSlot !== slot) { handleC8Swap(draggingSlot, slot); return; }
                            setC8EditSlot(slot);
                          }}
                          style={{
                            position: "relative", opacity: draggingSlot === slot ? 0.4 : 1, transition: "opacity .15s",
                            cursor: isOwner ? "grab" : "pointer",
                            outline: draggingSlot !== null && draggingSlot !== slot && isOwner ? `2px dashed ${primary}50` : "none",
                            borderRadius: "10px"
                          }}
                        >
                          <Link href={`/u/${friend.zid}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                            <div className="c8-slot-img" style={{ width: "46px", height: "46px", borderRadius: "10px", overflow: "hidden", border: `1px solid ${medal ? medal.color + "60" : primary + "35"}`, boxShadow: slot <= 3 ? `0 0 8px ${medal.glow}` : `0 0 8px ${primary}15`, transition: "transform .18s", position: "relative" }}
                              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "scale(1.08)"}
                              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"}
                            >
                              <img src={getAvatar(friend.zid)} alt={friend.display_name} style={{ width: "100%", height: "100%", display: "block" }} />
                            </div>
                            {slot <= 3 && medal && (
                              <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "14px", height: "14px", borderRadius: "50%", background: "#070C1E", border: `1px solid ${medal.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: medal.color, boxShadow: `0 0 5px ${medal.glow}`, zIndex: 2 }}>
                                {medal.label}
                              </div>
                            )}
                          </Link>
                          {isOwner && (
                            <div onClick={e => { e.stopPropagation(); setC8EditSlot(slot); }}
                              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", opacity: 0, transition: "opacity .15s", cursor: "pointer", zIndex: 3 }}
                              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = "1"}
                              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = "0"}
                            >
                              <Pencil size={13} style={{ color: "white" }} />
                            </div>
                          )}
                          <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "7px", color: "rgba(255,255,255,.5)", textAlign: "center", width: "46px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>{friend.display_name}</p>
                        </div>
                      ) : (
                        <div
                          onDragOver={e => { if (isOwner && draggingSlot !== null) e.preventDefault(); }}
                          onDrop={() => { if (isOwner && draggingSlot !== null && draggingSlot !== slot) handleC8Swap(draggingSlot, slot); }}
                          onClick={() => {
                            if (!isOwner) return;
                            if (draggingSlot !== null && draggingSlot !== slot) { handleC8Swap(draggingSlot, slot); return; }
                            setC8EditSlot(slot);
                          }}
                          style={{
                            width: "46px", height: "46px", borderRadius: "10px",
                            border: `1px dashed ${isOwner ? (draggingSlot !== null ? primary + "80" : primary + "45") : primary + "18"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: isOwner ? "pointer" : "default",
                            background: draggingSlot !== null && isOwner ? `${primary}0a` : "transparent",
                            transition: "border-color .15s, background .15s"
                          }}
                        >
                          {isOwner
                            ? <span style={{ fontSize: "16px", color: primary, opacity: .5 }}>+</span>
                            : <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.15)" }}>0{slot}</span>
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </PortalCard>

          {/* ── VIBES ── */}
          {privacySettings.show_vibes && (
            <VibesModule
              vibes={vibes} viewerId={viewerId} isOwner={isOwner} primary={primary} isMobile={isMobile}
              myRating={myRating} ratingOpen={ratingOpen} ratingDraft={ratingDraft}
              ratingSubmitting={ratingSubmitting} ratingDone={ratingDone}
              setRatingOpen={setRatingOpen} setRatingDraft={setRatingDraft}
              onRate={handleRateVibes}
            />
          )}

          {/* ── RECENT VISITORS ── */}
          <RecentVisitors primary={primary} visitorNum={visitorNum} visitors={recentVisitors} />

          {/* ── LAST LOGIN ── */}
          {profileUser?.status_updated_at && (
            <PortalCard accent="rgba(180,255,0,.1)" className="zee-entry">
              <ModuleHeader icon={<Clock size={11} />} title="LAST LOGIN" accent="#B4FF00" />
              <div style={{ padding: "10px 14px" }}>
                <div style={{
                  background: "rgba(0,0,0,.5)", border: "1px solid rgba(180,255,0,.14)",
                  borderRadius: "6px", padding: "10px 12px"
                }}>
                  <div style={{
                    fontFamily: "'VT323',monospace", fontSize: "16px", color: "#B4FF00",
                    letterSpacing: "2px",
                    textShadow: "0 0 8px rgba(180,255,0,.9), 0 0 18px rgba(180,255,0,.4)",
                    marginBottom: "4px"
                  }}>
                    {formatDistanceToNow(new Date(profileUser.status_updated_at), { addSuffix: true }).toUpperCase()}
                  </div>
                  <div style={{
                    fontFamily: "'VT323',monospace", fontSize: "11px",
                    color: "rgba(180,255,0,.4)", letterSpacing: "1.5px"
                  }}>
                    {format(new Date(profileUser.status_updated_at), "MMM dd, yyyy · hh:mm a").toUpperCase()}
                  </div>
                </div>
              </div>
            </PortalCard>
          )}

          {/* ── NETWORK ACTIVITY ── */}
          {profileUser && (
            <ActivityTicker
              posts={posts}
              friendActivity={recentFriendActivity}
              profileUser={profileUser}
              primary={primary}
              secondary={secondary}
            />
          )}

        </div>

      </div>

      {/* ── SHARE PROFILE SHEET ── */}
      <ShareSheet
        isOpen={sharingProfile}
        onClose={() => setSharingProfile(false)}
        title={`${profileUser?.display_name ?? ""} on Zeezu`}
        text={profileUser?.status_message ?? "Check out this profile on Zeezu — The Internet After Dark."}
        url={typeof window !== "undefined" ? window.location.href : `https://zeezu.net/u/${profileUser?.zid}`}
      />

      {/* ── TIER SYSTEM MODAL ── */}
      {tierModalOpen && profileUser && (
        <TierSystemModal
          score={profileUser.influence_score ?? 0}
          primary={primary}
          onClose={() => setTierModalOpen(false)}
        />
      )}

      {/* ── FRIEND PICKER MODAL ── */}
      {c8EditSlot !== null && (
        <FriendPickerModal
          slot={c8EditSlot}
          friends={ownerFriends}
          currentId={coreEight.find(c => c.position === c8EditSlot)?.friend?.id ?? null}
          onSelect={handleC8Select}
          onRemove={handleC8Remove}
          onClose={() => setC8EditSlot(null)}
          primary={primary}
        />
      )}

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${primary}12`, marginTop: "24px", padding: "16px 0", textAlign: "center" }}>
        <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.12)", letterSpacing: "3px" }}>
          ZEEZU · THE INTERNET AFTER DARK · {profileUser?.zid}
        </p>
      </div>

    </div>
  );
}