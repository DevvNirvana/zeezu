"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Play, Pause, Square, SkipBack,
  Zap, Repeat2, HeartCrack, Music2, Volume2, Volume1, VolumeX,
  Download, ExternalLink,
} from "lucide-react";

// ── CSS — injected once ───────────────────────────────────────────────────────
const STYLE_ID = "anthem-winamp-v4";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes aeq1  { 0%,100%{height:3px}  50%{height:14px} }
    @keyframes aeq2  { 0%,100%{height:8px}  33%{height:2px}  66%{height:17px} }
    @keyframes aeq3  { 0%,100%{height:13px} 25%{height:4px}  75%{height:10px} }
    @keyframes aeq4  { 0%,100%{height:5px}  50%{height:19px} }
    @keyframes aeq5  { 0%,100%{height:10px} 40%{height:2px}  80%{height:7px}  }
    @keyframes aeq6  { 0%,100%{height:7px}  60%{height:16px} }
    @keyframes aeq7  { 0%,100%{height:12px} 45%{height:3px}  }
    @keyframes aeq8  { 0%,100%{height:6px}  55%{height:14px} }
    @keyframes aeq9  { 0%,100%{height:4px}  35%{height:11px} 70%{height:6px}  }
    @keyframes aeq10 { 0%,100%{height:9px}  50%{height:2px}  80%{height:15px} }
    @keyframes aeq11 { 0%,100%{height:11px} 42%{height:5px}  78%{height:9px}  }
    @keyframes aeq12 { 0%,100%{height:3px}  58%{height:13px} }

    @keyframes adot1  { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-11px)} }
    @keyframes adot2  { 0%,100%{transform:translateY(-5px)} 33%{transform:translateY(0)}     66%{transform:translateY(-14px)} }
    @keyframes adot3  { 0%,100%{transform:translateY(-10px)}25%{transform:translateY(-1px)}  75%{transform:translateY(-7px)}  }
    @keyframes adot4  { 0%,100%{transform:translateY(-2px)} 50%{transform:translateY(-16px)} }
    @keyframes adot5  { 0%,100%{transform:translateY(-7px)} 40%{transform:translateY(0)}     80%{transform:translateY(-4px)} }
    @keyframes adot6  { 0%,100%{transform:translateY(-4px)} 60%{transform:translateY(-13px)} }
    @keyframes adot7  { 0%,100%{transform:translateY(-9px)} 45%{transform:translateY(0)}     }
    @keyframes adot8  { 0%,100%{transform:translateY(-3px)} 55%{transform:translateY(-11px)} }
    @keyframes adot9  { 0%,100%{transform:translateY(-1px)} 35%{transform:translateY(-8px)}  70%{transform:translateY(-3px)} }
    @keyframes adot10 { 0%,100%{transform:translateY(-6px)} 50%{transform:translateY(0)}     80%{transform:translateY(-12px)} }
    @keyframes adot11 { 0%,100%{transform:translateY(-8px)} 42%{transform:translateY(-2px)}  78%{transform:translateY(-6px)} }
    @keyframes adot12 { 0%,100%{transform:translateY(0)}    58%{transform:translateY(-10px)} }

    @keyframes anthem-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes anthem-pop     { 0%{transform:scale(1)} 40%{transform:scale(1.06)} 100%{transform:scale(1)} }
    @keyframes react-bounce   { 0%{transform:scale(1)} 35%{transform:scale(1.2)}  65%{transform:scale(0.9)} 100%{transform:scale(1)} }
    @keyframes hidden-pulse   { 0%,100%{opacity:.6} 50%{opacity:1} }

    .anthem-pop    { animation: anthem-pop .32s cubic-bezier(.34,1.56,.64,1); }
    .react-bounced { animation: react-bounce .28s cubic-bezier(.34,1.56,.64,1); }

    @keyframes play-ring { 0%,100%{box-shadow:var(--anthem-ring)} 50%{box-shadow:var(--anthem-ring-wide)} }
    .anthem-playing { animation: play-ring 2s ease-in-out infinite; }

    .wa-btn:active:not(:disabled) { filter:brightness(0.85); transform:translateY(1px); }
    .wa-react:hover:not(:disabled) { filter:brightness(1.15); }

    /* Mobile: 40×40px touch targets + always-visible volume slider */
    @media (max-width: 640px) {
      .wa-transport .wa-btn {
        min-width: 40px !important;
        min-height: 40px !important;
        width: 40px !important;
        height: 40px !important;
      }
      .wa-vol-btn {
        min-width: 40px !important;
        min-height: 40px !important;
      }
      .wa-vol-slider {
        width: 44px !important;
      }
    }
  `;
  document.head.appendChild(s);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}
function isSoundCloudUrl(url: string) { return /soundcloud\.com\/.+\/.+/.test(url); }
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const EQ_ANIMS = [
  "aeq1 0.90s linear infinite",       "aeq2 0.70s linear infinite 0.10s",
  "aeq3 1.10s linear infinite 0.20s", "aeq4 0.80s linear infinite 0.05s",
  "aeq5 1.00s linear infinite 0.15s", "aeq6 1.20s linear infinite 0.22s",
  "aeq7 0.85s linear infinite 0.08s", "aeq8 0.95s linear infinite 0.18s",
  "aeq9 1.05s linear infinite 0.12s", "aeq10 0.75s linear infinite 0.25s",
  "aeq11 1.15s linear infinite 0.05s","aeq12 0.88s linear infinite 0.16s",
];
const DOT_ANIMS = [
  "adot1 0.90s ease-in-out infinite",       "adot2 0.70s ease-in-out infinite 0.10s",
  "adot3 1.10s ease-in-out infinite 0.20s", "adot4 0.80s ease-in-out infinite 0.05s",
  "adot5 1.00s ease-in-out infinite 0.15s", "adot6 1.20s ease-in-out infinite 0.22s",
  "adot7 0.85s ease-in-out infinite 0.08s", "adot8 0.95s ease-in-out infinite 0.18s",
  "adot9 1.05s ease-in-out infinite 0.12s", "adot10 0.75s ease-in-out infinite 0.25s",
  "adot11 1.15s ease-in-out infinite 0.05s","adot12 0.88s ease-in-out infinite 0.16s",
];
const EQ_STATIC = [4, 7, 5, 9, 3, 6, 5, 8, 3, 6, 5, 7];
const EQ_BAND_LABELS = ["31", "62", "125", "250", "500", "1K", "2K", "4K", "8K", "16K"];
const VIS_LABELS = ["BARS", "DOTS", "SPEC"] as const;
type VisMode = 0 | 1 | 2;
type ReactionType = "zap" | "loop" | "felt";

const REACTION_COLORS: Record<ReactionType, string> = {
  zap:  "#FFD700",
  loop: "#00CFFF",
  felt: "#FF6B9D",
};

// ── Chrome bevel button ───────────────────────────────────────────────────────
function WaBtn({ children, onClick, disabled, active, primary, circle, large, title }: {
  children: React.ReactNode; onClick: () => void;
  disabled?: boolean; active?: boolean; primary: string; circle?: boolean; large?: boolean; title?: string;
}) {
  const sz = circle ? (large ? "34px" : "28px") : "24px";
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`wa-btn${circle && active ? " anthem-playing" : ""}`}
      style={{
        width: sz, height: sz,
        borderRadius: circle ? "50%" : "3px",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1,
        outline: "none", flexShrink: 0, transition: "all .12s ease",
        background: circle
          ? (active ? `radial-gradient(circle at 38% 32%,${primary}dd,${primary}77)` : `radial-gradient(circle at 38% 32%,${primary}55,${primary}22)`)
          : (active ? `linear-gradient(160deg,${primary}55,${primary}22)` : "linear-gradient(160deg,rgba(255,255,255,.13),rgba(0,0,0,.22))"),
        border: circle ? `1px solid ${active ? primary+"90" : "rgba(0,0,0,.55)"}` : "1px solid rgba(0,0,0,.55)",
        boxShadow: circle
          ? (active
            ? `0 0 20px ${primary}60,0 0 6px ${primary}40,inset 0 2px 0 rgba(255,255,255,.28),inset 0 -2px 0 rgba(0,0,0,.35),0 3px 8px rgba(0,0,0,.6)`
            : `inset 0 2px 0 rgba(255,255,255,.22),inset 0 -2px 0 rgba(0,0,0,.35),0 3px 8px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4)`)
          : ["inset 0 1px 0 rgba(255,255,255,.22)","inset -1px 0 0 rgba(255,255,255,.08)","inset 0 -1px 0 rgba(0,0,0,.45)","inset 1px 0 0 rgba(0,0,0,.25)","0 2px 4px rgba(0,0,0,.5)",active?`0 0 10px ${primary}40`:""].filter(Boolean).join(","),
        color: circle ? (active ? "#fff" : "rgba(255,255,255,.75)") : (active ? primary : "rgba(255,255,255,.62)"),
      }}
    >{children}</button>
  );
}

// ── Pill button ───────────────────────────────────────────────────────────────
function WaPill({ label, active, onClick, primary, title }: {
  label: string; active?: boolean; onClick?: () => void; primary: string; title?: string;
}) {
  return (
    <button onClick={onClick} title={title} className="wa-btn"
      style={{
        width: "28px", height: "16px", borderRadius: "3px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Orbitron',sans-serif", fontSize: "6.5px", fontWeight: 900, letterSpacing: "0.5px",
        color: active ? primary : "rgba(255,255,255,.48)",
        background: active ? `linear-gradient(160deg,${primary}30,${primary}10)` : "linear-gradient(160deg,rgba(255,255,255,.11),rgba(0,0,0,.22))",
        border: "1px solid rgba(0,0,0,.55)",
        boxShadow: ["inset 0 1px 0 rgba(255,255,255,.2)","inset 0 -1px 0 rgba(0,0,0,.4)","0 2px 3px rgba(0,0,0,.45)",active?`0 0 8px ${primary}35`:""].filter(Boolean).join(","),
        cursor: "pointer", outline: "none", flexShrink: 0,
        textShadow: active ? `0 0 6px ${primary}` : "none", transition: "all .12s ease",
      }}
    >{label}</button>
  );
}

// ── Horizontal slider ─────────────────────────────────────────────────────────
function SliderTrack({ value, onChange, width, primary }: {
  value: number; onChange: (v: number) => void; width: number; primary: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handle = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    onChange(Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))));
  };
  return (
    <div ref={ref} onClick={handle}
      style={{ width: `${width}px`, height: "14px", display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
      <div style={{ width: "100%", height: "3px", borderRadius: "2px", background: "rgba(0,0,0,.4)", border: "1px solid rgba(0,0,0,.45)", position: "relative", overflow: "visible" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${value}%`, background: `linear-gradient(90deg,${primary}aa,${primary}66)`, borderRadius: "2px" }} />
        <div style={{ position: "absolute", left: `${value}%`, top: "50%", transform: "translate(-50%,-50%)", width: "10px", height: "10px", borderRadius: "50%", background: "linear-gradient(135deg,rgba(255,255,255,.8),rgba(180,180,200,.5))", border: "1px solid rgba(0,0,0,.55)", boxShadow: "0 1px 4px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.5)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ── Vertical EQ slider ────────────────────────────────────────────────────────
function EqSlider({ value, onChange, label, primary }: {
  value: number; onChange: (v: number) => void; label: string; primary: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handle = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    onChange(Math.round(Math.max(0, Math.min(100, 100 - ((e.clientY - r.top) / r.height) * 100))));
  };
  const db = Math.round((value - 50) / 50 * 12);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flex: 1 }}>
      <span style={{ fontFamily: "'VT323',monospace", fontSize: "7px", color: db > 0 ? primary : db < 0 ? "#FF6B9D" : "rgba(255,255,255,.25)", minWidth: "18px", textAlign: "center" }}>
        {db > 0 ? `+${db}` : db === 0 ? "0" : db}
      </span>
      <div ref={ref} onClick={handle}
        style={{ width: "8px", height: "48px", cursor: "pointer", display: "flex", justifyContent: "center", position: "relative" }}>
        <div style={{ width: "3px", height: "100%", borderRadius: "2px", background: "rgba(0,0,0,.55)", border: "1px solid rgba(0,0,0,.5)", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", background: `${primary}25` }} />
          {db >= 0
            ? <div style={{ position: "absolute", left: 0, right: 0, bottom: "50%", height: `${Math.max(0, value - 50)}%`, background: `${primary}66`, borderRadius: "2px" }} />
            : <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: `${Math.max(0, 50 - value)}%`, background: "#FF6B9D44", borderRadius: "2px" }} />
          }
          <div style={{
            position: "absolute", left: "50%", top: `${100 - value}%`, transform: "translate(-50%,-50%)",
            width: "9px", height: "5px", borderRadius: "1px",
            background: "linear-gradient(180deg,rgba(255,255,255,.85),rgba(180,180,200,.4))",
            border: "1px solid rgba(0,0,0,.6)", boxShadow: "0 1px 3px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.5)",
            pointerEvents: "none",
          }} />
        </div>
      </div>
      <span style={{ fontFamily: "'VT323',monospace", fontSize: "7px", color: `${primary}45`, letterSpacing: "0.2px" }}>{label}</span>
    </div>
  );
}

// ── Icon pill (same dims as WaPill, but with icon child) ──────────────────────
function WaIconPill({ children, onClick, primary, title }: {
  children: React.ReactNode; onClick?: () => void; primary: string; title?: string;
}) {
  return (
    <button onClick={onClick} title={title} className="wa-btn"
      style={{ width: "28px", height: "16px", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,rgba(255,255,255,.11),rgba(0,0,0,.22))", border: "1px solid rgba(0,0,0,.55)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.2),inset 0 -1px 0 rgba(0,0,0,.4),0 2px 3px rgba(0,0,0,.45)", cursor: "pointer", outline: "none", flexShrink: 0, color: "rgba(255,255,255,.48)", transition: "all .12s ease" }}
    >{children}</button>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PlTrack = { id: string; track_title: string | null; track_url: string; track_artist: string | null };
type Props = {
  profileUserId: string; profileDisplayName: string;
  trackUrl: string; trackTitle?: string | null; trackArtist?: string | null;
  viewerId: string | null; isOwner: boolean; primary: string;
  onSteal?: () => void;
};

// ── Main component ────────────────────────────────────────────────────────────
export default function AnthemWidget({
  profileUserId, profileDisplayName, trackUrl,
  trackTitle, trackArtist, viewerId, isOwner, primary, onSteal,
}: Props) {
  // Social
  const [reactions, setReactions]     = useState<Record<ReactionType, number>>({ zap: 0, loop: 0, felt: 0 });
  const [myReactions, setMyReactions] = useState<Set<ReactionType>>(new Set());
  const [stealCount, setStealCount]   = useState(0);
  const [stolen, setStolen]           = useState(false);
  const [stolenId, setStolenId]       = useState<string | null>(null);
  const [stealing, setStealing]       = useState(false);
  const [stealPop, setStealPop]       = useState(false);
  const [reacting, setReacting]       = useState<ReactionType | null>(null);
  const [reactBounce, setReactBounce] = useState<ReactionType | null>(null);

  // Player
  // Active track — starts as profile anthem, overridden when PL item clicked
  const [activeUrl, setActiveUrl]       = useState(trackUrl);
  const [activeTitle, setActiveTitle]   = useState<string | null | undefined>(trackTitle);
  const [activeArtist, setActiveArtist] = useState<string | null | undefined>(trackArtist);
  const [pendingPlay, setPendingPlay]   = useState(false);

  // Player
  const [isPlaying, setIsPlaying]   = useState(false);
  const [elapsed, setElapsed]       = useState(0);
  const [volume, setVolume]         = useState(75);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [showEmbed, setShowEmbed]   = useState(false);

  // Panels + VIS
  const [visMode, setVisMode]   = useState<VisMode>(0);
  const [showEq, setShowEq]     = useState(false);
  const [eqBands, setEqBands]   = useState([50,50,50,50,50,50,50,50,50,50]);
  const [showPl, setShowPl]     = useState(false);
  const [plTracks, setPlTracks] = useState<PlTrack[]>([]);
  const [plLoaded, setPlLoaded] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // All player derivations use activeUrl (not the prop) so PL switching works
  const ytId     = getYouTubeId(activeUrl);
  const isSC     = isSoundCloudUrl(activeUrl);
  const hasEmbed = !!(ytId || isSC);

  const displayTitle  = (activeTitle || "")
    || decodeURIComponent(activeUrl.split("/").pop() ?? "").replace(/\.(mp3|wav|ogg|m4a)$/i, "").replace(/[-_]/g, " ")
    || "Profile Anthem";
  const displayArtist = activeArtist ?? null;
  const fullLine      = displayArtist
    ? `${displayArtist.toUpperCase()} – ${displayTitle.toUpperCase()}`
    : displayTitle.toUpperCase();
  const scrolling = fullLine.length > 28;

  const ytEmbedUrl = ytId ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3` : null;
  const scEmbedUrl = isSC ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(activeUrl)}&color=${encodeURIComponent(primary)}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false` : null;
  const embedUrl   = ytEmbedUrl ?? scEmbedUrl;

  const seekPct = Math.min(100, Math.round((elapsed / 210) * 100));

  // CSS vars
  useEffect(() => {
    document.documentElement.style.setProperty("--anthem-ring",      `0 0 0 0 ${primary}44`);
    document.documentElement.style.setProperty("--anthem-ring-wide", `0 0 0 8px transparent`);
  }, [primary]);

  // Elapsed timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  // YouTube → React state sync
  useEffect(() => {
    const handle = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data as string);
        if (d.event === "onStateChange") {
          if (d.info === 1) setIsPlaying(true);
          else if (d.info === 2 || d.info === 0) setIsPlaying(false);
        }
      } catch { }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);

  // Load PL tracks when panel opens (lazy)
  useEffect(() => {
    if (!showPl || plLoaded) return;
    supabase.from("user_sounds")
      .select("id,track_title,track_url,track_artist")
      .eq("user_id", profileUserId)
      .order("added_at", { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (error) console.error("[PL] query failed:", error.message);
        if (data) setPlTracks(data as PlTrack[]);
        setPlLoaded(true);
      });
  }, [showPl, plLoaded, profileUserId]);

  // Social data
  useEffect(() => {
    async function load() {
      const { data: rData } = await supabase.from("anthem_reactions").select("reaction_type").eq("profile_id", profileUserId);
      if (rData) {
        const c: Record<ReactionType, number> = { zap: 0, loop: 0, felt: 0 };
        rData.forEach((r: any) => { if (r.reaction_type in c) c[r.reaction_type as ReactionType]++; });
        setReactions(c);
      }
      if (viewerId) {
        const { data: myR } = await supabase.from("anthem_reactions").select("reaction_type").eq("profile_id", profileUserId).eq("reactor_id", viewerId);
        if (myR) setMyReactions(new Set(myR.map((r: any) => r.reaction_type as ReactionType)));
        const { data: sData } = await supabase.from("user_sounds").select("id").eq("user_id", viewerId).eq("track_url", trackUrl).maybeSingle();
        if (sData) { setStolen(true); setStolenId(sData.id); }
      }
      const { count } = await supabase.from("user_sounds").select("id", { count: "exact", head: true }).eq("discovered_from_user_id", profileUserId);
      setStealCount(count || 0);
    }
    load();
  }, [profileUserId, viewerId, trackUrl]);

  // ── Commands ──────────────────────────────────────────────────────────────
  const sendCmd = useCallback((cmd: string, args?: unknown[]) => {
    if (!iframeRef.current?.contentWindow) return;
    if (ytId) iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: "command", func: cmd, args: args ?? [] }), "*");
    else if (isSC) iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: cmd, value: args?.[0] }), "*");
  }, [ytId, isSC]);

  // Pause when RadioPlayer starts — mutual exclusion
  useEffect(() => {
    const handle = () => {
      sendCmd(ytId ? "pauseVideo" : "pause");
      setIsPlaying(false);
    };
    window.addEventListener("zeezu:radio-play", handle);
    return () => window.removeEventListener("zeezu:radio-play", handle);
  }, [sendCmd, ytId]);

  // Auto-play after PL track switch — fires when iframe reloads with new src
  const handleIframeLoad = useCallback(() => {
    if (!pendingPlay) return;
    // YouTube API bridge takes ~1s to initialise after iframe onLoad
    setTimeout(() => {
      sendCmd(ytId ? "playVideo" : "play");
      setIsPlaying(true);
      setPendingPlay(false);
      window.dispatchEvent(new CustomEvent("zeezu:anthem-play"));
    }, 1100);
  }, [pendingPlay, sendCmd, ytId]);

  const handlePlayPause = useCallback(() => {
    if (!hasEmbed) return;
    if (isPlaying) {
      sendCmd(ytId ? "pauseVideo" : "pause");
      setIsPlaying(false);
    } else {
      sendCmd(ytId ? "playVideo" : "play");
      setIsPlaying(true);
      window.dispatchEvent(new CustomEvent("zeezu:anthem-play"));
    }
  }, [hasEmbed, isPlaying, sendCmd, ytId]);

  const handleStop = useCallback(() => {
    sendCmd(ytId ? "stopVideo" : "pause");
    setIsPlaying(false); setElapsed(0);
  }, [sendCmd, ytId]);

  const handleRestart = useCallback(() => {
    if (!hasEmbed) return;
    sendCmd(ytId ? "seekTo" : "seekTo", ytId ? [0, true] : [0]);
    setElapsed(0);
    if (!isPlaying) { sendCmd(ytId ? "playVideo" : "play"); setIsPlaying(true); }
  }, [hasEmbed, ytId, sendCmd, isPlaying]);

  const handleSeek = useCallback((pct: number) => {
    const targetSec = Math.round((pct / 100) * 210);
    if (ytId) sendCmd("seekTo", [targetSec, true]);
    else if (isSC) sendCmd("seekTo", [targetSec * 1000]);
    setElapsed(targetSec);
  }, [ytId, isSC, sendCmd]);

  // Sync volume → player
  useEffect(() => {
    if (ytId) sendCmd("setVolume", [volume]);
    else if (isSC) sendCmd("setVolume", [volume / 100]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  // ── Reactions ─────────────────────────────────────────────────────────────
  const handleReaction = useCallback(async (type: ReactionType) => {
    if (!viewerId || isOwner || reacting) return;
    setReacting(type); setReactBounce(type); setTimeout(() => setReactBounce(null), 300);
    const has = myReactions.has(type);
    setMyReactions(prev => { const n = new Set(prev); has ? n.delete(type) : n.add(type); return n; });
    setReactions(prev => ({ ...prev, [type]: Math.max(0, prev[type] + (has ? -1 : 1)) }));
    if (has) {
      await supabase.from("anthem_reactions").delete().eq("profile_id", profileUserId).eq("reactor_id", viewerId).eq("reaction_type", type);
    } else {
      await supabase.from("anthem_reactions").upsert({ profile_id: profileUserId, reactor_id: viewerId, reaction_type: type }, { onConflict: "reactor_id,profile_id,reaction_type" });
    }
    setReacting(null);
  }, [viewerId, isOwner, myReactions, profileUserId, reacting]);

  // ── Steal ─────────────────────────────────────────────────────────────────
  const handleSteal = useCallback(async () => {
    if (!viewerId || isOwner || stealing) return;
    setStealing(true); setStealPop(true); setTimeout(() => setStealPop(false), 380);
    if (stolen && stolenId) {
      const { error } = await supabase.from("user_sounds").delete().eq("id", stolenId);
      if (!error) {
        setStolen(false); setStolenId(null); setStealCount(p => Math.max(0, p - 1));
        setPlLoaded(false); // reset PL cache so it reloads
        onSteal?.();
      }
    } else {
      const { data, error } = await supabase.from("user_sounds").insert({
        user_id: viewerId, track_url: trackUrl,
        track_title: displayTitle, track_artist: displayArtist,
        discovered_from_user_id: profileUserId,
      }).select("id").single();
      if (error) { console.error("[AnthemWidget] steal insert failed:", error.message, error.code); }
      if (data) {
        setStolen(true); setStolenId(data.id); setStealCount(p => p + 1);
        setPlLoaded(false); // reset PL cache
        onSteal?.();
      }
    }
    setStealing(false);
  }, [viewerId, isOwner, stealing, stolen, stolenId, trackUrl, displayTitle, displayArtist, profileUserId, onSteal]);

  const canReact = !!(viewerId && !isOwner);
  const volIcon  = volume === 0 ? <VolumeX size={9} /> : volume < 50 ? <Volume1 size={9} /> : <Volume2 size={9} />;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ userSelect: "none" }}>
      {/* OUTER CHROME SHELL */}
      <div style={{
        background: "linear-gradient(175deg,#3a3a4a 0%,#28283a 30%,#1e1e2e 60%,#252535 100%)",
        borderRadius: "6px", border: "1px solid rgba(0,0,0,.7)",
        boxShadow: [`inset 0 1px 0 rgba(255,255,255,.12)`,`inset -1px 0 0 rgba(255,255,255,.07)`,`inset 0 -1px 0 rgba(0,0,0,.5)`,`inset 1px 0 0 rgba(255,255,255,.07)`,`0 12px 40px rgba(0,0,0,.85)`,`0 0 0 1px rgba(0,0,0,.5)`,`0 0 30px ${primary}12`].join(","),
        overflow: "hidden", padding: "3px",
      }}>
        <div style={{ background: "linear-gradient(175deg,#1a1a28 0%,#111120 100%)", borderRadius: "4px", border: "1px solid rgba(0,0,0,.8)", boxShadow: "inset 0 2px 8px rgba(0,0,0,.9)", overflow: "hidden" }}>

          {/* TITLE BAR */}
          <div style={{ height: "16px", background: `linear-gradient(90deg,${primary}30 0%,rgba(0,0,0,.6) 40%,${primary}15 100%)`, borderBottom: "1px solid rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 7px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="10" height="8" viewBox="0 0 70 58" style={{ flexShrink: 0, opacity: .8 }}>
                <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill="#8A2EFF" />
                <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill="#00E5FF" />
                <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6" />
                <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9" />
              </svg>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "7px", fontWeight: 900, color: primary, letterSpacing: "3px", textShadow: `0 0 8px ${primary}` }}>ZEEZU</span>
            </div>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.25)", letterSpacing: "2px" }}>PROFILE ANTHEM</span>
            <div style={{ display: "flex", gap: "3px" }}>
              {["─","□","✕"].map((c, i) => (
                <div key={i} style={{ width: "12px", height: "10px", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,rgba(255,255,255,.12),rgba(0,0,0,.3))", border: "1px solid rgba(0,0,0,.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.15)", fontSize: "6px", color: "rgba(255,255,255,.45)" }}>{c}</div>
              ))}
            </div>
          </div>

          {/* MENU BAR */}
          <div style={{ height: "13px", background: "linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.2))", borderBottom: "1px solid rgba(0,0,0,.5)", display: "flex", alignItems: "center", padding: "0 7px", gap: "10px" }}>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.32)", cursor: "default" }}>Options</span>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.32)", cursor: "default" }}>Repeat</span>
            {/* VIS mode toggle — cycles on click */}
            <button
              onClick={() => setVisMode(v => ((v + 1) % 3) as VisMode)}
              title={`Visualizer: ${VIS_LABELS[visMode]} — click to switch`}
              style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: primary, background: "none", border: "none", cursor: "pointer", padding: 0, outline: "none", textShadow: `0 0 5px ${primary}`, letterSpacing: "0.3px" }}
            >
              {VIS_LABELS[visMode]}
            </button>
            <span style={{ marginLeft: "auto", fontFamily: "'VT323',monospace", fontSize: "8px", color: isPlaying ? `${primary}60` : "rgba(255,255,255,.15)", letterSpacing: "1px", animation: isPlaying ? "hidden-pulse 2s ease-in-out infinite" : "none" }}>
              {isPlaying ? "▶ LIVE" : "· · ·"}
            </span>
          </div>

          {/* LCD DISPLAY */}
          <div style={{ margin: "5px 6px 4px", background: "#000a14", border: `1px solid ${primary}30`, borderRadius: "3px", overflow: "hidden", position: "relative", boxShadow: `inset 0 3px 14px rgba(0,0,0,.98),inset 0 0 30px rgba(0,0,0,.8),0 0 12px ${primary}0e` }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,.28) 1px,rgba(0,0,0,.28) 2px)" }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: `radial-gradient(ellipse 80% 60% at 50% 40%,${primary}06,transparent 70%)` }} />
            <div style={{ padding: "7px 8px 6px", position: "relative", zIndex: 5 }}>
              {/* Timer + info + visualizer */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                  <span style={{ fontSize: "6px", color: isPlaying ? primary : `${primary}30`, lineHeight: 1, marginRight: "1px", textShadow: isPlaying ? `0 0 6px ${primary}` : "none", transition: "all .25s" }}>▶</span>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "26px", lineHeight: 1, color: primary, letterSpacing: "3px", textShadow: `0 0 20px ${primary},0 0 6px ${primary}cc,0 0 40px ${primary}44` }}>
                    {fmtTime(elapsed)}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {[{ l: "KBPS", v: "128" },{ l: "KHZ", v: "44" }].map(p => (
                      <div key={p.l} style={{ display: "flex", alignItems: "center", gap: "2px", background: "rgba(0,0,0,.5)", border: `1px solid ${primary}25`, borderRadius: "2px", padding: "1px 4px" }}>
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: `${primary}55` }}>{p.l}:</span>
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: primary, letterSpacing: "1px", textShadow: `0 0 5px ${primary}` }}>{p.v}</span>
                      </div>
                    ))}
                    <div style={{ background: isPlaying ? `${primary}22` : "rgba(0,0,0,.4)", border: `1px solid ${isPlaying ? primary+"55" : primary+"18"}`, borderRadius: "2px", padding: "1px 5px", fontFamily: "'VT323',monospace", fontSize: "9px", color: isPlaying ? primary : `${primary}35`, letterSpacing: "1px", textShadow: isPlaying ? `0 0 5px ${primary}` : "none", transition: "all .25s" }}>
                      {isPlaying ? "STEREO" : "STOPPED"}
                    </div>
                  </div>
                  {/* Visualizer — BARS */}
                  {visMode === 0 && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5px", height: "20px", marginLeft: "auto" }}>
                      {EQ_ANIMS.map((anim, i) => {
                        // Map 12 bars → 10 EQ bands, scale animation height by band gain
                        const bandIdx = Math.round((i / 11) * 9);
                        const scale = Math.max(0.1, Math.min(2.2, eqBands[bandIdx] / 50));
                        return (
                          <div key={i} style={{ width: "2.5px", borderRadius: "1px 1px 0 0", background: `linear-gradient(0deg,${primary},${primary}55)`, animation: isPlaying ? anim : "none", height: isPlaying ? undefined : `${Math.round(EQ_STATIC[i] * scale)}px`, transform: `scaleY(${scale})`, transformOrigin: "bottom", boxShadow: isPlaying ? `0 0 4px ${primary}88` : "none", transition: "transform .35s ease, height .3s ease", minHeight: "2px" }} />
                        );
                      })}
                    </div>
                  )}
                  {/* Visualizer — DOTS */}
                  {visMode === 1 && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "20px", marginLeft: "auto" }}>
                      {DOT_ANIMS.map((anim, i) => {
                        const bandIdx = Math.round((i / 11) * 9);
                        const scale = Math.max(0.1, Math.min(2.2, eqBands[bandIdx] / 50));
                        const baseGlow = scale > 1.2 ? `0 0 ${Math.round(scale * 4)}px ${primary}` : (isPlaying ? `0 0 5px ${primary}` : "none");
                        return (
                          <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: primary, boxShadow: baseGlow, animation: isPlaying ? anim : "none", marginBottom: isPlaying ? "0" : `${Math.round((EQ_STATIC[i] / 19) * 14 * scale)}px`, transform: `scale(${Math.min(1.6, scale)})`, transition: "margin-bottom .3s ease, transform .35s ease", flexShrink: 0 }} />
                        );
                      })}
                    </div>
                  )}
                  {/* Visualizer — SPEC (spectral) */}
                  {visMode === 2 && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5px", height: "20px", marginLeft: "auto" }}>
                      {EQ_ANIMS.map((anim, i) => {
                        const bandIdx = Math.round((i / 11) * 9);
                        const scale = Math.max(0.1, Math.min(2.2, eqBands[bandIdx] / 50));
                        const hue = Math.round((i / 11) * 160 + 200);
                        const col = isPlaying ? `hsl(${hue},100%,65%)` : `hsl(${hue},55%,30%)`;
                        return <div key={i} style={{ width: "2.5px", borderRadius: "1px 1px 0 0", background: col, animation: isPlaying ? anim : "none", height: isPlaying ? undefined : `${Math.round(EQ_STATIC[i] * scale)}px`, transform: `scaleY(${scale})`, transformOrigin: "bottom", boxShadow: isPlaying ? `0 0 5px ${col}` : "none", transition: "transform .35s ease, height .3s ease", minHeight: "2px" }} />;
                      })}
                    </div>
                  )}
                </div>
              </div>
              {/* Track title marquee */}
              <div style={{ overflow: "hidden", whiteSpace: "nowrap", height: "18px", background: "rgba(0,0,0,.3)", borderTop: `1px solid ${primary}15`, borderBottom: `1px solid ${primary}15`, borderRadius: "2px", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "14px", background: `linear-gradient(90deg,#000a14,transparent)`, zIndex: 5, pointerEvents: "none" }} />
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "14px", background: `linear-gradient(270deg,#000a14,transparent)`, zIndex: 5, pointerEvents: "none" }} />
                <span style={{ display: "inline-block", fontFamily: "'VT323',monospace", fontSize: "15px", color: primary, letterSpacing: "1.5px", textShadow: `0 0 8px ${primary}cc,0 0 2px ${primary}`, lineHeight: "18px", paddingLeft: "14px", animation: scrolling && isPlaying ? "anthem-marquee 14s linear infinite" : "none", whiteSpace: "nowrap" }}>
                  {scrolling ? `${fullLine}   ·   ${fullLine}   ·   ` : fullLine}
                </span>
              </div>
            </div>
          </div>

          {/* SEEK BAR — clickable, wired to seekTo */}
          <div style={{ padding: "0 6px 4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: `${primary}35`, letterSpacing: "1px", flexShrink: 0 }}>{fmtTime(elapsed)}</span>
            <div
              style={{ flex: 1, height: "3px", borderRadius: "2px", background: "rgba(0,0,0,.4)", border: "1px solid rgba(0,0,0,.45)", position: "relative", overflow: "visible", cursor: "pointer" }}
              onClick={e => {
                const r = e.currentTarget.getBoundingClientRect();
                handleSeek(Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))));
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${seekPct}%`, background: `linear-gradient(90deg,${primary},${primary}66)`, boxShadow: `0 0 6px ${primary}80`, borderRadius: "2px", transition: "width 1s linear" }} />
              <div style={{ position: "absolute", left: `${seekPct}%`, top: "50%", transform: "translate(-50%,-50%)", width: "10px", height: "10px", borderRadius: "50%", background: "linear-gradient(135deg,rgba(255,255,255,.75),rgba(180,180,200,.5))", border: "1px solid rgba(0,0,0,.6)", boxShadow: `0 0 8px ${primary}88,0 2px 4px rgba(0,0,0,.7)`, transition: "left 1s linear", cursor: "pointer", pointerEvents: "none" }} />
            </div>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: `${primary}35`, letterSpacing: "1px", flexShrink: 0 }}>∞</span>
          </div>

          {/* ── TRANSPORT ROW (single row, responsive via CSS) ── */}
          <div className="wa-transport" style={{ padding: "3px 6px 5px", display: "flex", alignItems: "center", gap: "5px" }}>

            {/* Transport buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <WaBtn onClick={handleRestart} disabled={!hasEmbed} primary={primary} title="Restart">
                <SkipBack size={9} />
              </WaBtn>
              <WaBtn onClick={handlePlayPause} disabled={!hasEmbed} active={isPlaying} primary={primary} circle title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause size={11} /> : <Play size={11} style={{ marginLeft: "1px" }} />}
              </WaBtn>
              <WaBtn onClick={handleStop} disabled={!hasEmbed} primary={primary} title="Stop">
                <Square size={8} fill="currentColor" />
              </WaBtn>
            </div>

            {/* Volume — icon always visible, slider expands on hover (desktop) or tap (mobile) */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}
              onMouseEnter={() => setVolumeOpen(true)}
              onMouseLeave={() => setVolumeOpen(false)}
            >
              <button
                className="wa-vol-btn"
                onClick={() => setVolumeOpen(v => !v)}
                title="Volume"
                style={{
                  width: "22px", height: "22px", borderRadius: "3px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(160deg,rgba(255,255,255,.1),rgba(0,0,0,.2))",
                  border: "1px solid rgba(0,0,0,.45)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.18),0 1px 3px rgba(0,0,0,.5)",
                  cursor: "pointer", outline: "none",
                  color: volumeOpen ? primary : `${primary}70`,
                  transition: "color .15s ease",
                }}
              >
                {volIcon}
              </button>
              {/* Expanding slider — always visible on mobile via CSS */}
              <div className="wa-vol-slider" style={{
                width: volumeOpen ? "58px" : "0",
                overflow: "hidden",
                transition: "width .2s cubic-bezier(0.16,1,0.3,1)",
                flexShrink: 0,
              }}>
                <SliderTrack value={volume} onChange={setVolume} width={54} primary={primary} />
              </div>
            </div>

            {/* Utility pills */}
            <div style={{ display: "flex", gap: "3px", marginLeft: "auto" }}>
              <WaPill label="VZ" active={showEq} onClick={() => setShowEq(v => !v)} primary={primary} title="Visualizer" />
              <WaPill label="PL" active={showPl} onClick={() => setShowPl(v => !v)} primary={primary} title="Sound list" />
            </div>
          </div>

          {/* EQ PANEL */}
          {showEq && (
            <div style={{ margin: "0 6px 5px", background: "rgba(0,0,0,.45)", border: `1px solid ${primary}20`, borderRadius: "4px", padding: "7px 6px 6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "6px", fontWeight: 900, color: primary, letterSpacing: "2px", textShadow: `0 0 6px ${primary}` }}>EQUALIZER</span>
                <button onClick={() => setEqBands([50,50,50,50,50,50,50,50,50,50])} style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.3)", background: "none", border: "none", cursor: "pointer", outline: "none", letterSpacing: "1px" }}>
                  RESET
                </button>
              </div>
              <div style={{ display: "flex", gap: "1px" }}>
                {EQ_BAND_LABELS.map((band, i) => (
                  <EqSlider key={band} value={eqBands[i]} onChange={v => setEqBands(prev => { const n = [...prev]; n[i] = v; return n; })} label={band} primary={primary} />
                ))}
              </div>
              <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "7px", color: "rgba(255,255,255,.2)", letterSpacing: "0.5px" }}>PREAMP</span>
                <SliderTrack value={50} onChange={() => {}} width={60} primary={primary} />
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "7px", color: "rgba(255,255,255,.12)", marginLeft: "auto" }}>VISUAL ONLY</span>
              </div>
            </div>
          )}

          {/* PL PANEL — Sound list */}
          {showPl && (
            <div style={{ margin: "0 6px 5px", background: "rgba(0,0,0,.45)", border: `1px solid ${primary}20`, borderRadius: "4px", padding: "7px 6px 6px", maxHeight: "120px", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "6px", fontWeight: 900, color: primary, letterSpacing: "2px", textShadow: `0 0 6px ${primary}` }}>SOUND LIST</span>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.22)", letterSpacing: "1px" }}>{plTracks.length} TRACKS</span>
              </div>
              {!plLoaded && <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.25)", textAlign: "center", padding: "8px 0" }}>LOADING...</div>}
              {plLoaded && plTracks.length === 0 && <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.25)", textAlign: "center", padding: "8px 0" }}>NO SOUNDS YET</div>}
              {plTracks.map((t, i) => {
                const isActive = activeUrl === t.track_url;
                return (
                  <div key={t.id}
                    onClick={() => {
                      setActiveUrl(t.track_url);
                      setActiveTitle(t.track_title);
                      setActiveArtist(t.track_artist ?? null);
                      setElapsed(0);
                      setIsPlaying(false);
                      setPendingPlay(true);
                      setShowEmbed(true);  // reveal player
                      setShowPl(false);    // close PL panel
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 4px", borderRadius: "3px", background: isActive ? `${primary}15` : i % 2 === 0 ? "rgba(255,255,255,.02)" : "transparent", border: isActive ? `1px solid ${primary}30` : "1px solid transparent", cursor: "pointer", transition: "background .12s" }}
                  >
                    {/* Now-playing indicator */}
                    {isActive
                      ? <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isPlaying ? primary : `${primary}60`, boxShadow: isPlaying ? `0 0 5px ${primary}` : "none", flexShrink: 0, animation: isPlaying ? "hidden-pulse 1.2s ease-in-out infinite" : "none" }} />
                      : <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: `${primary}35`, minWidth: "5px", textAlign: "center" }}>{(i + 1).toString().padStart(2, "0")}</span>
                    }
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: isActive ? primary : "rgba(255,255,255,.62)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: isActive ? `0 0 6px ${primary}` : "none" }}>{t.track_title ?? "Unknown"}</div>
                      {t.track_artist && <div style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: isActive ? `${primary}80` : `${primary}45`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.track_artist}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* EMBEDDED PLAYER — always in DOM, CSS height collapses when VIEW off */}
          {embedUrl && (
            <>
              <div style={{ margin: "0 6px 0", height: showEmbed ? (ytId ? "110px" : "80px") : "0px", overflow: "hidden", transition: "height 0.3s cubic-bezier(0.16,1,0.3,1)", borderRadius: "3px" }}>
                <iframe
                  key={activeUrl}
                  ref={iframeRef}
                  src={embedUrl ?? ""}
                  onLoad={handleIframeLoad}
                  width="100%" height={ytId ? "110" : "80"}
                  frameBorder={0} scrolling="no"
                  allow="autoplay; encrypted-media"
                  title="Profile Anthem Player"
                  style={{ display: "block", border: "none", borderRadius: "3px" }}
                />
              </div>
              {/* Streaming banner — always visible, contains VIEW + EXT */}
              <div style={{ margin: "3px 6px 4px", padding: "4px 6px", background: isPlaying ? `${primary}0d` : "rgba(0,0,0,.22)", border: `1px solid ${isPlaying ? primary+"22" : "rgba(255,255,255,.05)"}`, borderRadius: "3px", display: "flex", alignItems: "center", gap: "6px", transition: "background .3s, border-color .3s" }}>
                {/* Status dot */}
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", flexShrink: 0, background: isPlaying ? primary : "rgba(255,255,255,.12)", boxShadow: isPlaying ? `0 0 6px ${primary}` : "none", animation: isPlaying ? "hidden-pulse 1.5s ease-in-out infinite" : "none", transition: "all .25s" }} />
                {/* Platform label */}
                <span style={{ flex: 1, fontFamily: "'VT323',monospace", fontSize: "9px", letterSpacing: "1.5px", color: isPlaying ? `${primary}88` : "rgba(255,255,255,.22)", transition: "color .25s" }}>
                  {isPlaying ? `STREAMING · ${ytId ? "YOUTUBE" : "SOUNDCLOUD"}` : `READY · ${ytId ? "YOUTUBE" : "SOUNDCLOUD"}`}
                </span>
                {/* VIEW toggle */}
                <WaPill label="VIEW" active={showEmbed} onClick={() => setShowEmbed(v => !v)} primary={primary} title={showEmbed ? "Hide player" : "Show player"} />
                {/* External link */}
                <WaIconPill onClick={() => activeUrl && window.open(activeUrl, "_blank", "noopener")} primary={primary} title="Open in new tab">
                  <ExternalLink size={8} />
                </WaIconPill>
              </div>
            </>
          )}

          {/* REACTIONS */}
          <div style={{ display: "flex", borderTop: `1px solid ${primary}15`, borderBottom: `1px solid ${primary}15` }}>
            {([
              { type: "zap"  as ReactionType, icon: <Zap size={11} />,        label: "ZAP",  color: REACTION_COLORS.zap  },
              { type: "loop" as ReactionType, icon: <Repeat2 size={11} />,    label: "LOOP", color: REACTION_COLORS.loop },
              { type: "felt" as ReactionType, icon: <HeartCrack size={11} />, label: "FELT", color: REACTION_COLORS.felt },
            ]).map(({ type, icon, label, color }, i) => {
              const active = myReactions.has(type);
              return (
                <button key={type} onClick={() => handleReaction(type)} disabled={!canReact}
                  className={`wa-react${reactBounce === type ? " react-bounced" : ""}`}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "7px 4px", background: active ? `linear-gradient(160deg,${color}18,${color}06)` : "linear-gradient(160deg,rgba(255,255,255,.02),rgba(0,0,0,.15))", border: "none", borderRight: i < 2 ? `1px solid ${primary}15` : "none", cursor: canReact ? "pointer" : "default", transition: "background .12s ease", outline: "none", boxShadow: active ? `inset 0 0 8px ${color}12` : "none" }}>
                  <span style={{ color: active ? color : "rgba(255,255,255,.22)", filter: active ? `drop-shadow(0 0 5px ${color})` : "none", transition: "all .15s ease", lineHeight: 1 }}>{icon}</span>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px", color: active ? color : "rgba(255,255,255,.2)", textShadow: active ? `0 0 8px ${color}` : "none", transition: "color .12s ease" }}>
                    {reactions[type] > 0 ? reactions[type] : label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* BOTTOM */}
          <div style={{ padding: "6px 8px 7px", background: "linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.25))", display: "flex", flexDirection: "column", gap: "5px" }}>
            {stealCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Music2 size={9} color={`${primary}50`} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.28)", letterSpacing: "1px" }}>
                  {stealCount} {stealCount === 1 ? "person" : "people"} {isOwner ? "stole your anthem" : `stole via ${profileDisplayName}`}
                </span>
              </div>
            )}
            {viewerId && !isOwner && (
              <button onClick={handleSteal} disabled={stealing} className={stealPop ? "anthem-pop" : ""}
                style={{ width: "100%", padding: "6px 10px", background: stolen ? `linear-gradient(135deg,${primary}25,${primary}10)` : "linear-gradient(160deg,rgba(255,255,255,.06),rgba(0,0,0,.2))", border: `1px solid ${stolen ? primary+"55" : primary+"20"}`, borderRadius: "4px", cursor: stealing ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontFamily: "'VT323',monospace", fontSize: "12px", letterSpacing: "2px", color: stolen ? primary : "rgba(255,255,255,.4)", textShadow: stolen ? `0 0 10px ${primary}88` : "none", boxShadow: ["inset 0 1px 0 rgba(255,255,255,.08)","inset 0 -1px 0 rgba(0,0,0,.4)","0 2px 4px rgba(0,0,0,.5)",stolen?`0 0 14px ${primary}15`:""].filter(Boolean).join(","), transition: "all .15s ease", outline: "none" }}>
                {stolen ? <><Download size={11} /> IN YOUR SOUNDS · VIA {profileDisplayName.toUpperCase().slice(0, 12)}</> : <><Music2 size={11} /> STEAL THIS TRACK</>}
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {isOwner
                ? <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: `${primary}35`, letterSpacing: "2px" }}>YOUR ANTHEM · CHANGE IN SETTINGS</span>
                : <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.15)", letterSpacing: "2px" }}>ZEEZU · PROFILE ANTHEM</span>
              }
              {isOwner ? (
                <button onClick={() => { window.location.href = "/profile"; }}
                  style={{ display: "flex", alignItems: "center", gap: "4px", background: `linear-gradient(160deg,${primary}35,${primary}15)`, border: `1px solid ${primary}30`, borderRadius: "2px", padding: "2px 6px", cursor: "pointer", outline: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,.12),0 2px 3px rgba(0,0,0,.5)" }}>
                  <Zap size={9} color={primary} />
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: primary, letterSpacing: "1px" }}>SETTINGS</span>
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "8px", color: "rgba(255,255,255,.15)", letterSpacing: "1px" }}>VIS: {VIS_LABELS[visMode]}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
