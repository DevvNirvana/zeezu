"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Menu, X, ArrowRight, MessageSquare, Users, Star,
  Palette, BookOpen, Shield, Wifi, Radio, ChevronDown,
  Pencil, Globe, Lock, Music, Send,
  Flame, Heart, Sparkles, Volume2, Layout, Hash,
  ChevronRight, Plus, Minus, Power
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import ShinyText from "@/components/reactbits/ShinyText";
import StarBorder from "@/components/StarBorder";
import CountUp from "@/components/reactbits/CountUp";
import RotatingText from "@/components/RotatingText";
import PixelCard from "@/components/PixelCard";
import ElectricBorder from "@/components/ElectricBorder";
import CardSwap, { Card } from "@/components/CardSwap";
import ScrollReveal from "@/components/ScrollReveal";
import TiltedCard from "@/components/TiltedCard";

// Heavy WebGL components — lazy loaded for performance
const FaultyTerminal = dynamic(() => import("@/components/FaultyTerminal"), { ssr: false });

// ── Style injection ───────────────────────────────────────────────
const STYLE_ID = "landing-v4";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  if (!document.getElementById("lp-fonts")) {
    const link = document.createElement("link");
    link.id = "lp-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&display=swap";
    document.head.appendChild(link);
  }
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes lp-float-1 { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(.5deg)} }
    @keyframes lp-float-2 { 0%,100%{transform:translateY(0) rotate(.5deg)} 50%{transform:translateY(-16px) rotate(-1deg)} }
    @keyframes lp-float-3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes lp-float-4 { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-10px) rotate(-.5deg)} }
    @keyframes lp-marquee  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes lp-chrome   { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    @keyframes lp-progress { from{width:0%} to{width:100%} }
    /* Ken Burns — 3 direction variants, 13s so motion is still active during 1.2s crossfade */
    /* Scale starts at 1.05 minimum so object-fit:cover never shows edges during pan */
    @keyframes lp-kb-1 { from{transform:scale(1.05) translate(0%,    0%   )} to{transform:scale(1.12) translate(-1.4%, -1.0%)} }
    @keyframes lp-kb-2 { from{transform:scale(1.10) translate(1.0%,  0.8% )} to{transform:scale(1.05) translate(-0.6%, -0.4%)} }
    @keyframes lp-kb-3 { from{transform:scale(1.05) translate(-0.8%, 0.4% )} to{transform:scale(1.11) translate(1.2%,  1.0% )} }
    .lp-kb-1{animation:lp-kb-1 13s ease-in-out forwards}
    .lp-kb-2{animation:lp-kb-2 13s ease-in-out forwards}
    .lp-kb-3{animation:lp-kb-3 13s ease-in-out forwards}

    .lp-f1{animation:lp-float-1 7s ease-in-out infinite}
    .lp-f2{animation:lp-float-2 9s ease-in-out .5s infinite}
    .lp-f3{animation:lp-float-3 6s ease-in-out 1s infinite}
    .lp-f4{animation:lp-float-4 10s ease-in-out 1.5s infinite}
    .lp-marquee{animation:lp-marquee 35s linear infinite}
    .lp-chrome-text{
      background:linear-gradient(135deg,#fff 0%,#FFE8F4 20%,#FF2D87 40%,#00F7FF 60%,#B4FF00 75%,#FFD700 90%,#fff 100%);
      background-size:300% 300%;
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      animation:lp-chrome 8s ease-in-out infinite;
    }
    /* Pause all hero animations when hero is off-screen — massive GPU saving */
    [data-hero-idle] .lp-f1,[data-hero-idle] .lp-f2,[data-hero-idle] .lp-f3,[data-hero-idle] .lp-f4{animation-play-state:paused}
    [data-hero-idle] .lp-chrome-text{animation-play-state:paused}
    /* Pause ticker when off-screen */
    [data-ticker-idle] .lp-marquee{animation-play-state:paused}
    /* No backdrop-filter — replaced by higher-opacity solid bg to eliminate GPU compositing layers */
    .lp-glass{background:rgba(20,8,14,.95);border:1px solid rgba(255,45,135,.22)}
    .lp-glass-cyan{background:rgba(6,18,20,.95);border:1px solid rgba(0,247,255,.2)}
    .lp-glass-lime{background:rgba(8,14,4,.95);border:1px solid rgba(180,255,0,.2)}
    .lp-glass-gold{background:rgba(16,12,4,.95);border:1px solid rgba(255,215,0,.2)}
    .lp-glass-dark{background:rgba(14,11,13,.97);border:1px solid rgba(255,255,255,.07)}
    /* Y2K video bg grain — static SVG noise, no canvas */
    .lp-vid-bg::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:6;opacity:.04;mix-blend-mode:overlay;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:220px 220px;background-repeat:repeat;}
    .lp-cs-wrap{overflow:hidden;scrollbar-width:none}
    .lp-cs-wrap::-webkit-scrollbar{display:none}
    .lp-feat-tabs::-webkit-scrollbar{display:none}
    .lp-feat-tabs{scrollbar-width:none}
    /* CardSwap has built-in translate-x-[25%] on mobile — compensate to visually center it */
    @media (max-width: 1023px) { .lp-cs-center { transform: translateX(-38px); } }
    @media (min-width: 1024px) { .lp-cs-center { transform: none; } }
    @media(prefers-reduced-motion:reduce){
      .lp-f1,.lp-f2,.lp-f3,.lp-f4,.lp-marquee,.lp-chrome-text{animation:none}
    }
    /* ── Logo animations ── */
    @keyframes logo-quad-glow{0%,100%{opacity:.82}50%{opacity:1}}
    @keyframes logo-glow-pulse{
      0%,100%{filter:drop-shadow(0 0 2px rgba(0,229,255,.18))}
      50%{filter:drop-shadow(0 0 7px rgba(0,229,255,.55)) drop-shadow(0 0 14px rgba(255,45,135,.28))}
    }
    @keyframes logo-net-flicker{0%,87%,100%{opacity:.7}89%,93%{opacity:.06}91%,95%{opacity:.5}}
    .lp-logo{transition:transform .2s ease;text-decoration:none!important;display:flex;align-items:center;gap:7px}
    .lp-logo:hover{transform:scale(1.07)}
    .lp-logo:hover svg{filter:drop-shadow(0 0 10px rgba(0,229,255,.7)) drop-shadow(0 0 20px rgba(255,45,135,.4))!important;transition:filter .2s}
    /* ── Neon keycap buttons ── */
    .key-btn{
      position:relative;display:inline-flex;align-items:center;gap:6px;
      border-radius:7px;
      font-family:'Orbitron',sans-serif;font-size:11px;font-weight:900;letter-spacing:2px;
      text-decoration:none!important;white-space:nowrap;cursor:pointer;user-select:none;
      transform:translateY(0);
      transition:transform .07s ease,box-shadow .07s ease,background .12s ease;
      -webkit-tap-highlight-color:transparent;
    }
    /* Pink — primary CTA */
    .key-pink{
      background:linear-gradient(160deg,#1e0d17 0%,#120810 60%,#1a0c14 100%);
      color:#FF2D87!important;
      border:1px solid rgba(255,45,135,.4);
      padding:10px 24px;min-height:38px;
      box-shadow:
        0 5px 0 rgba(180,15,80,.85),
        0 6px 0 rgba(0,0,0,.95),
        0 0 18px rgba(255,45,135,.1),
        inset 0 1px 0 rgba(255,255,255,.07),
        inset 0 0 12px rgba(255,45,135,.04);
    }
    .key-pink:hover{
      background:linear-gradient(160deg,#26101d 0%,#160a12 60%,#200f18 100%);
      box-shadow:
        0 5px 0 rgba(210,20,95,.9),
        0 6px 0 rgba(0,0,0,.95),
        0 0 28px rgba(255,45,135,.22),
        inset 0 1px 0 rgba(255,255,255,.1),
        inset 0 0 14px rgba(255,45,135,.07);
    }
    .key-pink:active{
      transform:translateY(5px);
      box-shadow:
        0 1px 0 rgba(180,15,80,.7),
        0 2px 0 rgba(0,0,0,.95),
        0 0 10px rgba(255,45,135,.12),
        inset 0 2px 4px rgba(0,0,0,.4),
        inset 0 0 8px rgba(255,45,135,.06);
    }
    /* Cyan — nav / secondary */
    .key-cyan{
      background:linear-gradient(160deg,#061418 0%,#040d10 60%,#051215 100%);
      color:#00F7FF!important;
      border:1px solid rgba(0,247,255,.3);
      padding:7px 18px;min-height:32px;
      box-shadow:
        0 4px 0 rgba(0,140,160,.8),
        0 5px 0 rgba(0,0,0,.95),
        0 0 14px rgba(0,247,255,.08),
        inset 0 1px 0 rgba(255,255,255,.06);
    }
    .key-cyan:hover{
      background:linear-gradient(160deg,#081a1f 0%,#061115 60%,#071619 100%);
      box-shadow:
        0 4px 0 rgba(0,170,195,.85),
        0 5px 0 rgba(0,0,0,.95),
        0 0 22px rgba(0,247,255,.18),
        inset 0 1px 0 rgba(255,255,255,.09);
    }
    .key-cyan:active{
      transform:translateY(4px);
      box-shadow:
        0 1px 0 rgba(0,140,160,.7),
        0 2px 0 rgba(0,0,0,.95),
        0 0 8px rgba(0,247,255,.1),
        inset 0 2px 4px rgba(0,0,0,.4);
    }
    /* ── Custom cursor — hide system cursor, replaced by CursorFX ── */
    .lp-win98-cursor,.lp-win98-cursor *:not(input):not(textarea):not(select){cursor:none!important}
    /* Flag wave — slow (default state) */
    @keyframes zc-flag{0%,100%{transform:skewY(0deg) scaleX(1)}30%{transform:skewY(5deg) scaleX(.96)}70%{transform:skewY(-5deg) scaleX(.96)}}
    .zc-flag{animation:zc-flag 2s ease-in-out infinite}
    /* Flag wave — fast (hover state) */
    @keyframes zc-flag-fast{0%,100%{transform:skewY(0deg) scaleX(1)}25%{transform:skewY(11deg) scaleX(.91)}75%{transform:skewY(-11deg) scaleX(.91)}}
    .zc-flag-fast{animation:zc-flag-fast .52s ease-in-out infinite}
    /* Hourglass spin — loading state */
    @keyframes zc-hg-spin{0%,38%{transform:rotate(0deg)}50%,88%{transform:rotate(180deg)}100%{transform:rotate(180deg)}}
    .zc-hg{animation:zc-hg-spin 1.6s cubic-bezier(.45,0,.55,1) infinite;transform-origin:center;display:inline-block}
    /* ── Cursor spark particles ── */
    @keyframes lp-spark{from{transform:translate(0,0) scale(1);opacity:1}to{transform:translate(var(--dx),var(--dy)) scale(0) rotate(180deg);opacity:0}}
      /* ── CRT TV ANIMATIONS ── */
    @keyframes crt-turn-on {
      0% { transform: scale(1, 0.005); filter: brightness(20); opacity: 0; }
      15% { transform: scale(1, 0.005); filter: brightness(20); opacity: 1; }
      40% { transform: scale(1, 0.005); filter: brightness(20); opacity: 1; }
      100% { transform: scale(1, 1); filter: brightness(1); opacity: 1; }
    }
    .crt-animate-on {
      animation: crt-turn-on 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
      transform-origin: center;
    }
    .crt-scanlines {
      background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px);
    }
    .crt-rgb {
      background-image: repeating-linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03) 3px);
    }
      @media (max-width: 900px) {
        .cardswapmobile {
        height: 155px !important;
    width: 25px !important;
}
}
  `;
  document.head.appendChild(s);
}

// ── Helpers ───────────────────────────────────────────────────────
function cardBg(c1: string, c2: string) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${c1}" stop-opacity="0.2"/>
          <stop offset="1" stop-color="${c2}" stop-opacity="0.06"/>
        </linearGradient>
      </defs>
      <rect width="320" height="420" fill="#0E0B0D"/>
      <rect width="320" height="420" fill="url(#g)"/>
    </svg>`
  )}`;
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <motion.div
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ type: "spring", damping: 22, stiffness: 160, delay: delay / 1000, mass: 0.85 }}
    >
      {children}
    </motion.div>
  );
}

// ── Feature data — full platform ──────────────────────────────────
const FEAT = [
  {
    icon: MessageSquare, title: "ZeeWall", tag: "YOUR FEED", color: "#FF2D87",
    px: "#FF2D87,#FFD700,#FF007A",
    desc: "Your wall. No algorithm deciding what floats up. Post GIFs, polls, YouTube embeds, Spotify tracks, mood tags. Real people in chronological order.",
    bullets: ["Chronological, no ranking", "GIFs, polls, embeds", "Mood tags + zap reactions", "Comment threading + votes"],
  },
  {
    icon: Users, title: "Core 8", tag: "TOP FRIENDS", color: "#00F7FF",
    px: "#00F7FF,#0047FF,#B4FF00",
    desc: "Your top 8 friends, public on your profile. Drag to reorder. A statement about who actually matters to you. The MySpace Top 8 is back.",
    bullets: ["Drag to rank", "Public on your profile", "Your inner circle, visible", "Update anytime"],
  },
  {
    icon: Star, title: "Vibes", tag: "REPUTATION", color: "#FFD700",
    px: "#FFD700,#FF6B35,#FF2D87",
    desc: "Every profile has a Vibe score. Trust, Cool, Sexy. Visitors rate you. Community consensus replaces follower counts as the real metric.",
    bullets: ["Trust / Cool / Sexy scores", "Rated by real visitors", "Aggregated by RPC", "Privacy control per score"],
  },
  {
    icon: BookOpen, title: "Zlogger", tag: "LONG FORM", color: "#B4FF00",
    px: "#B4FF00,#00F7FF,#FFD700",
    desc: "Long-form blogging with 5 visual reading themes, 6 custom Z-tags, split-pane editor, text highlight to share. Write something that lasts.",
    bullets: ["5 reading themes", "Z-tags (neon, glitch, marquee)", "Split-pane live preview", "Highlight to share tooltip"],
  },
  {
    icon: Send, title: "Buzz", tag: "MESSAGES", color: "#FF007A",
    px: "#FF007A,#FF2D87,#FFD700",
    desc: "DMs that feel like AIM. Nudge someone with a BuzzFlash overlay that takes over their screen. BBM-style delivery confirmations. No message request gatekeeping.",
    bullets: ["BuzzFlash full-screen nudges", "BBM-style delivery status", "Real-time via Supabase", "No request filters"],
  },
  {
    icon: Palette, title: "Theme Studio", tag: "CUSTOMIZATION", color: "#A246FF",
    px: "#A246FF,#FF2D87,#00F7FF",
    desc: "12 Y2K presets. Custom hex colors. 8 display fonts. CRT scanlines, holographic shimmer, chrome bevel buttons. Make your profile look exactly like you.",
    bullets: ["12 presets + fully custom", "Fonts, colors, effects", "Card style + button style", "Background gallery"],
  },
  {
    icon: Volume2, title: "Theme Anthem", tag: "MUSIC", color: "#FF6B35",
    px: "#FF6B35,#FFD700,#FF2D87",
    desc: "Set a track as your profile anthem. Visitors can play it from your page. Like a MySpace profile song, but it actually works in 2025.",
    bullets: ["URL-based track embed", "Plays on profile visit", "Spotify, SoundCloud, direct", "Ambient RadioPlayer built in"],
  },
  {
    icon: Hash, title: "Zones", tag: "COMMUNITIES", color: "#00CED1",
    px: "#00CED1,#00F7FF,#B4FF00",
    desc: "Topic-based communities not run by an algorithm. Join Zones for music, art, gaming, tech, weird corners of the internet. Find your actual people.",
    bullets: ["Topic-based communities", "Not algorithm-sorted", "Cross-post from ZeeWall", "Discover by interest"],
  },
];

// ── Community profile card data ───────────────────────────────────
const PROFILES = [
  {
    name: "nxrmalvxid", zid: "NXRM4LVXID9K2P8Q", tagline: "building things at 3am again",
    vibes: { trust: 91, cool: 88, sexy: 72 }, color: "#FF2D87", color2: "#FF007A",
    gen: "GEN Z", seed: "nxrm1", tags: ["builder", "night owl", "chaotic"],
    status: "online", anthem: "Charli XCX - 360",
    core8seeds: ["a1", "b2", "c3", "d4", "e5", "f6", "g7", "h8"],
  },
  {
    name: "glitchwitch", zid: "GL1TCHW1TCH7X3QP", tagline: "art is the only real thing left",
    vibes: { trust: 78, cool: 96, sexy: 84 }, color: "#B4FF00", color2: "#00F7FF",
    gen: "GEN Z", seed: "witch1", tags: ["art", "analog", "creative"],
    status: "busy", anthem: "Bladee - Icedancer",
    core8seeds: ["i1", "j2", "k3", "l4", "m5", "n6", "o7", "p8"],
  },
  {
    name: "vaporwave99", zid: "VPRVV4V399K8Z1LX", tagline: "stuck in 1999, on purpose",
    vibes: { trust: 85, cool: 93, sexy: 79 }, color: "#00F7FF", color2: "#0047FF",
    gen: "MILLENNIAL", seed: "vapor1", tags: ["music", "nostalgia", "y2k"],
    status: "away", anthem: "Boards of Canada - Dayvan Cowboy",
    core8seeds: ["q1", "r2", "s3", "t4", "u5", "v6", "w7", "x8"],
  },
  {
    name: "chromekid", zid: "CHR0MEK1D5Y2LXQR", tagline: "silver everything always",
    vibes: { trust: 88, cool: 90, sexy: 95 }, color: "#FFD700", color2: "#FF6B35",
    gen: "GEN Z", seed: "chrome1", tags: ["fashion", "style", "chrome"],
    status: "online", anthem: "Aphex Twin - Windowlicker",
    core8seeds: ["y1", "z2", "aa", "bb", "cc", "dd", "ee", "ff"],
  },
];

const statusColors: Record<string, string> = { online: "#6BCB77", busy: "#FF007A", away: "#FFD700", offline: "rgba(255,255,255,.15)" };

// ── Custom cursor components ───────────────────────────────────────
function ArrowWithFlag({ hover }: { hover: boolean }) {
  return (
    <div style={{ position: "relative", width: "52px", height: "48px" }}>
      {/* Win98-style arrow */}
      <svg width="26" height="30" viewBox="0 0 20 24" style={{
        position: "absolute", top: 0, left: 0,
        filter: hover
          ? "drop-shadow(0 0 6px rgba(255,45,135,.8)) drop-shadow(1px 1px 0 #000)"
          : "drop-shadow(1px 1px 0 #000) drop-shadow(0 0 1px #000)",
        transition: "filter .15s ease",
      }}>
        <polygon points="2,1 2,19 6,15 8.5,21 11,20 8.5,14 14,14" fill="white" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="3,2 3,18 6.5,14.5 9,19.5 10.5,19 8,13.5 13,13.5" fill="black" />
      </svg>
      {/* Staff */}
      <div style={{
        position: "absolute", top: "2px", left: "22px",
        width: "1.5px", height: "22px",
        background: "rgba(255,255,255,.88)",
        boxShadow: "0 0 2px rgba(0,0,0,.9)",
      }} />
      {/* Zeezu flag — 4-quadrant logo waving */}
      <div
        className={hover ? "zc-flag-fast" : "zc-flag"}
        style={{ position: "absolute", top: "2px", left: "23px", transformOrigin: "left center" }}
      >
        <svg width="22" height="18" viewBox="0 0 70 58">
          <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill="#FF2D87"
            style={{ filter: hover ? "brightness(1.4) drop-shadow(0 0 3px #FF2D87)" : "none", transition: "filter .15s" }} />
          <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill="#00E5FF" />
          <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6" />
          <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9" />
        </svg>
      </div>
    </div>
  );
}

function HourglassCursor() {
  return (
    <div className="zc-hg" style={{ marginLeft: "2px", marginTop: "2px" }}>
      <svg width="26" height="32" viewBox="0 0 26 32">
        {/* Top & bottom bars */}
        <rect x="1" y="0" width="24" height="3" rx="1.5" fill="#00E5FF" opacity=".9" />
        <rect x="1" y="29" width="24" height="3" rx="1.5" fill="#00E5FF" opacity=".9" />
        {/* Frame */}
        <path d="M3,3 L23,3 L13,16 L23,29 L3,29 L13,16 Z"
          fill="rgba(0,0,0,.55)" stroke="#00E5FF" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Top sand */}
        <clipPath id="hg-t"><path d="M3,3 L23,3 L13,16 Z" /></clipPath>
        <rect x="3" y="3" width="20" height="14" fill="#FF2D87" opacity=".9" clipPath="url(#hg-t)" />
        {/* Bottom sand */}
        <clipPath id="hg-b"><path d="M13,16 L23,29 L3,29 Z" /></clipPath>
        <rect x="3" y="16" width="20" height="13" fill="#FF2D87" opacity=".9" clipPath="url(#hg-b)" />
        {/* Centre grain */}
        <circle cx="13" cy="16" r="1.5" fill="#FFD700" opacity=".9" />
      </svg>
    </div>
  );
}

type CursorState = "default" | "pointer" | "loading";

function CursorFX() {
  const divRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -300, y: -300 });
  const stateRef = useRef<CursorState>("default");
  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only on fine-pointer (real mouse) devices
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setVisible(true);

    let rafId: number;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (stateRef.current === "loading") return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isClickable = el?.closest("a,button,[role='button'],input,label,select,[tabindex]");
      const next: CursorState = isClickable ? "pointer" : "default";
      if (next !== stateRef.current) { stateRef.current = next; setState(next); }
    };

    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('a[href="/login"]')) {
        stateRef.current = "loading";
        setState("loading");
        if (loadTimer) clearTimeout(loadTimer);
        loadTimer = setTimeout(() => { stateRef.current = "default"; setState("default"); }, 2800);
      }
    };

    const loop = () => {
      if (divRef.current) {
        divRef.current.style.transform = `translate(${posRef.current.x}px,${posRef.current.y}px)`;
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick);
    rafId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      cancelAnimationFrame(rafId);
      if (loadTimer) clearTimeout(loadTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div ref={divRef} style={{
      position: "fixed", top: 0, left: 0,
      pointerEvents: "none", zIndex: 999999,
      willChange: "transform",
    }}>
      {state === "loading" ? <HourglassCursor /> : <ArrowWithFlag hover={state === "pointer"} />}
    </div>
  );
}

// ── 3D tilt wrapper ────────────────────────────────────────────────
function TiltWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ts, setTs] = useState<React.CSSProperties>({});

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -10;
    const ry = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 12;
    setTs({ transform: `perspective(520px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.06)`, transition: "transform .08s ease" });
  };

  const onLeave = () =>
    setTs({ transform: "perspective(520px) rotateX(0) rotateY(0) scale(1)", transition: "transform .55s cubic-bezier(.23,1,.32,1)" });

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ display: "inline-block", transformStyle: "preserve-3d", ...ts }}>
      {children}
    </div>
  );
}

// ── Star-border wrapper without inner-div style override ───────────
function KeyStarBorder({ children, color = "#FF2D87", speed = "3.5s" }: {
  children: React.ReactNode; color?: string; speed?: string;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block", overflow: "hidden", borderRadius: "10px", padding: "1.5px 0" }}>
      <div style={{
        position: "absolute", width: "300%", height: "50%", opacity: .72,
        bottom: "-11px", right: "-250%", borderRadius: "50%",
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animation: `star-movement-bottom ${speed} linear infinite alternate`,
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute", width: "300%", height: "50%", opacity: .72,
        top: "-10px", left: "-250%", borderRadius: "50%",
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animation: `star-movement-top ${speed} linear infinite alternate`,
        zIndex: 0,
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────
function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#0E0B0D]/92 backdrop-blur-2xl border-b border-[#FF2D87]/12 shadow-[0_1px_40px_-12px_rgba(255,45,135,.3)]" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="lp-logo">
          <svg width="20" height="16" viewBox="0 0 70 58" aria-hidden="true"
            style={{ flexShrink: 0, animation: "logo-glow-pulse 3.5s ease-in-out infinite" }}>
            <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill="#FF2D87"
              style={{ animation: "logo-quad-glow 2.6s ease-in-out 0s infinite" }} />
            <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill="#00E5FF"
              style={{ animation: "logo-quad-glow 2.6s ease-in-out 0.65s infinite" }} />
            <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6"
              style={{ animation: "logo-quad-glow 2.6s ease-in-out 1.3s infinite" }} />
            <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9"
              style={{ animation: "logo-quad-glow 2.6s ease-in-out 1.95s infinite" }} />
          </svg>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "16px", fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: "1", textShadow: "0 0 14px rgba(0,229,255,0.28)" }}>
            zeezu
          </span>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: "10px", color: "#00E5FF", letterSpacing: "3px", marginLeft: "2px", animation: "logo-net-flicker 6s step-end infinite" }}>
            NET
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="key-btn key-cyan">
            Get in <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0E0B0D]/98 backdrop-blur-2xl border-b border-[#FF2D87]/12 px-4 pb-4 overflow-hidden">
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/login" onClick={() => setOpen(false)} className="text-gray-300 py-2 text-sm font-medium">Sign in</Link>
              <Link href="/login" onClick={() => setOpen(false)} className="key-btn key-cyan justify-center w-full">
                Get in <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero images — Spider-Verse / comic art, Ken Burns effect ──────
const HERO_IMAGES_DESKTOP = [
  "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/Gemini_Generated_Image_mfvw17mfvw17mfvw%20%281%29.png",
  "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/hero-bg_p2_img/Gemini_Generated_Image_d73ndhd73ndhd73n%20%281%29.png",
  "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/hero-bg_p2_img/Gemini_Generated_Image_8u6u4j8u6u4j8u6u%20%281%29.png",
  "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/hero-bg_p2_img/Gemini_Generated_Image_hj1ad2hj1ad2hj1a%20%281%29.png",
  "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/hero-bg_p2_img/Gemini_Generated_Image_yugv4dyugv4dyugv%20%281%29.png",
  "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/hero-bg_p2_img/Gemini_Generated_Image_62jjbq62jjbq62jj%20%281%29.png",
  "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/hero-bg_p2_img/Gemini_Generated_Image_ubhxiuubhxiuubhx%20%281%29.png",
  "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/Gemini_Generated_Image_ih788gih788gih78.png",
  "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/Gemini_Generated_Image_epg9luepg9luepg9%20%281%29.png",
];
// Mobile order: 2,4,5,3,6,7,1,8,9 (1-based) → indices 1,3,4,2,5,6,0,7,8
const HERO_IMAGES_MOBILE = [
  HERO_IMAGES_DESKTOP[1], // d73ndh
  HERO_IMAGES_DESKTOP[3], // hj1ad2
  HERO_IMAGES_DESKTOP[4], // yugv4d
  HERO_IMAGES_DESKTOP[2], // 8u6u4j
  HERO_IMAGES_DESKTOP[5], // 62jjbq
  HERO_IMAGES_DESKTOP[6], // ubhxiu
  HERO_IMAGES_DESKTOP[0], // mfvw17
  HERO_IMAGES_DESKTOP[7], // ih788g
  HERO_IMAGES_DESKTOP[8], // epg9lu
];
const KB_SHOW = 8500;  // ms each image is fully visible before crossfade
const KB_XFADE = 1200; // ms crossfade duration
const KB_CLASS = ["lp-kb-1", "lp-kb-2", "lp-kb-3"] as const;

// Spider-Verse filter — preserve vibrant neons + ink contrast, just darken for text legibility
const IMG_FILTER = "contrast(1.18) brightness(0.72) saturate(1.06)";

// ── Image hero background with Ken Burns + crossfade + Y2K overlays
function ImageHeroBg() {
  const [images, setImages] = useState(HERO_IMAGES_DESKTOP);
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [xfading, setXfading] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1280) setImages(HERO_IMAGES_MOBILE);
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setTimeout(() => {
      const n = (current + 1) % images.length;
      setNext(n);
      setXfading(true);
      window.setTimeout(() => { setCurrent(n); setNext(null); setXfading(false); }, KB_XFADE);
    }, KB_SHOW);
    return () => window.clearTimeout(timer);
  }, [current, images]);

  const imgStyle: React.CSSProperties = {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    width: "100%", height: "100%",
    objectFit: "cover",
    objectPosition: "center 30%",
    display: "block",
    filter: IMG_FILTER,
  };

  return (
    <div className="lp-vid-bg absolute inset-0 z-0 overflow-hidden bg-[#0E0B0D]">
      {/* Current image — Ken Burns playing, fades out when xfading */}
      <div
        key={`ic-${current}`}
        className={`absolute inset-0 ${KB_CLASS[current % 3]}`}
        style={{
          opacity: xfading ? 0 : 1,
          transition: `opacity ${KB_XFADE}ms ease`,
          overflow: "hidden",
        }}
      >
        <img src={images[current]} alt="" aria-hidden fetchPriority="high" decoding="async" style={imgStyle} />
      </div>
      {/* Next image — starts KB from frame 0 (new key = new DOM node), fades in */}
      {next !== null && (
        <div
          key={`in-${next}`}
          className={`absolute inset-0 ${KB_CLASS[next % 3]}`}
          style={{
            opacity: xfading ? 1 : 0,
            transition: `opacity ${KB_XFADE}ms ease`,
            overflow: "hidden",
          }}
        >
          <img src={images[next]} alt="" aria-hidden decoding="async" style={imgStyle} />
        </div>
      )}

      {/* ── CRT / Y2K overlay stack — all pure CSS, zero JS cost ── */}

      {/* 1. Horizontal scanlines — CRT electron gun sweep */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)",
        zIndex: 1,
      }} />

      {/* 2. CRT phosphor dot matrix — 3×3px repeating dot grid */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: [
          "radial-gradient(circle, transparent 38%, rgba(0,0,0,0.11) 68%)",
          "radial-gradient(circle, transparent 38%, rgba(0,0,0,0.11) 68%)",
        ].join(","),
        backgroundSize: "3px 3px, 3px 3px",
        backgroundPosition: "0 0, 1.5px 1.5px",
        zIndex: 2,
      }} />

      {/* 3. UV/purple tint — cool cathode glow bleeding from top */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(180deg, rgba(120,0,255,0.11) 0%, rgba(80,0,200,0.05) 30%, transparent 60%)",
        mixBlendMode: "screen",
        zIndex: 3,
      }} />

      {/* 4. Warm amber bloom — phosphor warmth at bottom half */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(0deg, rgba(255,140,20,0.08) 0%, rgba(255,80,0,0.04) 30%, transparent 55%)",
        mixBlendMode: "overlay",
        zIndex: 4,
      }} />

      {/* 5. Chromatic aberration fringe — red-left / cyan-right edge split */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to right, rgba(255,45,135,0.13) 0%, transparent 7%, transparent 93%, rgba(0,247,255,0.09) 100%)",
        zIndex: 5,
      }} />

      {/* 6. CRT barrel vignette — very dark, tight ellipse simulates curved screen edges */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 76% at 50% 50%, transparent 36%, rgba(14,11,13,0.94) 100%)",
        zIndex: 6,
      }} />

      {/* 7. Phosphor centre glow — warm inner luminance, like CRT hot spot */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 55% 50% at 50% 46%, rgba(255,200,120,0.05) 0%, transparent 70%)",
        mixBlendMode: "screen",
        zIndex: 7,
      }} />

      {/* 8. Base dark layer — pushes overall darkness down for text */}
      <div aria-hidden className="absolute inset-0 bg-[#0E0B0D]/32 pointer-events-none" style={{ zIndex: 8 }} />

      {/* 9. Bottom page fade — dissolves into site background */}
      <div aria-hidden className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-[#0E0B0D] to-transparent pointer-events-none" style={{ zIndex: 9 }} />
    </div>
  );
}

// ── Hero floating card ────────────────────────────────────────────
function FloatCard({ cls, children, style }: { cls: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className={`absolute hidden xl:flex flex-col rounded-2xl p-3.5 shadow-[0_8px_48px_-8px_rgba(0,0,0,.8)] ${cls}`} style={style}>
      {children}
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────
function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { sectionRef.current?.toggleAttribute("data-hero-idle", !e.isIntersecting); },
      { threshold: 0 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={sectionRef} className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: "100svh" }}>
      {/* Image background — Ken Burns + Y2K overlays */}
      <ImageHeroBg />
      {/* Mobile-only centre scrim — boosts text contrast without touching desktop */}
      <div className="xl:hidden absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 110% 70% at 50% 48%, rgba(7,12,30,.62) 0%, transparent 75%)",
        zIndex: 9,
      }} />

      {/* Floating preview cards */}
      {/* ZeeWall post */}
      <FloatCard cls={`lp-glass lp-f1 w-52 top-[18%] right-[6%] z-10`}>
        <div className="flex items-center gap-2 mb-2.5">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=nxrm1" alt="" loading="lazy"
            className="w-8 h-8 rounded-full border border-[#FF2D87]/40 bg-black flex-shrink-0" />
          <div>
            <p className="text-white text-[11px] font-bold">nxrmalvxid</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6BCB77]" />
              <p className="text-[#FF2D87]/60 text-[8px] font-mono">online</p>
            </div>
          </div>
        </div>
        <p className="text-gray-300 text-[10px] leading-relaxed mb-2">finally a place that doesn't feel like a job interview</p>
        <div className="flex gap-1.5">
          <span className="flex items-center gap-1 text-[8px] font-mono bg-[#FF2D87]/15 text-[#FF2D87] px-1.5 py-0.5 rounded-full">
            <Zap className="w-2 h-2" /> 84
          </span>
          <span className="flex items-center gap-1 text-[8px] font-mono bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-full">
            <MessageSquare className="w-2 h-2" /> 12
          </span>
        </div>
      </FloatCard>

      {/* Core 8 */}
      <FloatCard cls={`lp-glass-cyan lp-f2 w-48 bottom-[26%] right-[9%] z-10`}>
        <p className="text-[#00F7FF] text-[8px] font-mono tracking-widest mb-2.5">CORE 8</p>
        <div className="grid grid-cols-4 gap-1.5">
          {["a1", "b2", "c3", "d4", "e5", "f6", "g7", "h8"].map(s => (
            <img key={s} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`} alt="" loading="lazy"
              className="w-8 h-8 rounded-lg border border-[#00F7FF]/20 bg-black" />
          ))}
        </div>
      </FloatCard>

      {/* Vibes */}
      <FloatCard cls={`lp-glass-gold lp-f3 w-44 top-[38%] right-[19%] z-10`}>
        <p className="text-[#FFD700] text-[8px] font-mono tracking-widest mb-2.5">VIBES</p>
        {[{ l: "Trust", v: 91, c: "#00F7FF" }, { l: "Cool", v: 94, c: "#FF2D87" }, { l: "Sexy", v: 76, c: "#FFD700" }].map(v => (
          <div key={v.l} className="mb-1.5">
            <div className="flex justify-between mb-0.5">
              <span className="text-[8px] text-gray-400 font-mono">{v.l}</span>
              <span className="text-[8px] font-mono" style={{ color: v.c }}>{v.v}</span>
            </div>
            <div className="h-[3px] rounded-full bg-white/8">
              <div className="h-full rounded-full" style={{ width: `${v.v}%`, background: v.c, boxShadow: `0 0 5px ${v.c}80` }} />
            </div>
          </div>
        ))}
      </FloatCard>

      {/* Buzz DM */}
      <FloatCard cls={`lp-glass lp-f4 w-48 top-[60%] right-[21%] z-10`} style={{ borderColor: "rgba(255,0,122,.25)" }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Send className="w-3 h-3 text-[#FF007A]" />
          <p className="text-[#FF007A] text-[8px] font-mono tracking-widest">BUZZ</p>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-end"><p className="bg-[#FF2D87] text-white text-[9px] rounded-xl rounded-tr-sm px-2.5 py-1 max-w-[85%]">ur profile theme goes hard ngl</p></div>
          <div className="flex justify-start"><p className="bg-white/8 text-gray-300 text-[9px] rounded-xl rounded-tl-sm px-2.5 py-1 max-w-[85%]">ty! its the void chrome one</p></div>
          <div className="flex justify-end items-center gap-1"><p className="bg-[#FF2D87] text-white text-[9px] rounded-xl rounded-tr-sm px-2.5 py-1">*sends buzzflash*</p></div>
        </div>
      </FloatCard>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center xl:text-left xl:max-w-[50rem] xl:ml-16 2xl:ml-28 py-4 xl:py-16 -mt-14 xl:mt-0">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center gap-2 justify-center xl:justify-start mb-3 xl:mb-7">
          <span className="inline-flex items-center gap-2 bg-[#FF2D87]/10 border border-[#FF2D87]/28 text-[10px] font-mono px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B4FF00] animate-pulse" />
            <ShinyText text="Early Access - Claim your ZID" color="#FF2D87" shineColor="#FFD700" speed={4} className="text-[10px] font-mono" />
          </span>
        </motion.div>

        {/* Kicker — emotional primer before the H1 lands */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="flex justify-center xl:justify-start mb-2 xl:mb-5"
        >
          <span style={{
            fontFamily: "'VT323', monospace",
            fontSize: "clamp(13px, 2vw, 17px)",
            letterSpacing: "3px",
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            lineHeight: 1,
            textShadow: "0 1px 6px rgba(0,0,0,.8)",
          }}>
            The internet we grew up on. Rebuilt.
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.22 }}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.02] text-white">
            Social media got
          </h1>
          <div className="flex justify-center xl:justify-start mt-1 mb-1">
            <RotatingText
              texts={["boring.", "sanitized.", "corporate.", "toxic.", "fake."]}
              rotationInterval={2400}
              mainClassName="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-[#FF2D87] inline-block"
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              staggerDuration={0.03}
              splitBy="character"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.02] text-white">We fixed it.</h1>
        </motion.div>

        {/* ── Mobile cards — right after H1 for show-don't-tell ──── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="xl:hidden flex gap-2.5 mt-4"
        >
          {/* ZeeWall mini */}
          <div className="lp-glass lp-f1 flex-1 flex flex-col rounded-xl p-2.5 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=nxrm1" alt="" loading="lazy"
                className="w-5 h-5 rounded-full border border-[#FF2D87]/40 bg-black flex-shrink-0" />
              <div>
                <p className="text-white text-[8px] font-bold leading-none">nxrmalvxid</p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-[#6BCB77]" />
                  <p className="text-[#FF2D87]/55 text-[6px] font-mono">online</p>
                </div>
              </div>
            </div>
            <p className="text-white/70 text-[8px] leading-snug mb-1.5 flex-1">finally a place that doesn't feel like a job interview</p>
            <div className="flex gap-1">
              <span className="flex items-center gap-0.5 text-[6px] font-mono bg-[#FF2D87]/15 text-[#FF2D87] px-1.5 py-0.5 rounded-full">
                <Zap className="w-1.5 h-1.5" /> 84
              </span>
              <span className="flex items-center gap-0.5 text-[6px] font-mono bg-white/5 text-gray-400 px-1.5 py-0.5 rounded-full">
                <MessageSquare className="w-1.5 h-1.5" /> 12
              </span>
            </div>
          </div>
          {/* Buzz mini */}
          <div className="lp-glass lp-f4 flex-1 flex flex-col rounded-xl p-2.5 min-w-0" style={{ borderColor: "rgba(255,0,122,.25)" }}>
            <div className="flex items-center gap-1 mb-1.5">
              <Send className="w-2 h-2 text-[#FF007A]" />
              <p className="text-[#FF007A] text-[6px] font-mono tracking-widest">BUZZ</p>
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex justify-end">
                <p className="bg-[#FF2D87] text-white text-[7px] rounded-xl rounded-tr-sm px-1.5 py-0.5 max-w-[90%]">ur theme goes hard ngl</p>
              </div>
              <div className="flex justify-start">
                <p className="bg-white/8 text-white/65 text-[7px] rounded-xl rounded-tl-sm px-1.5 py-0.5">ty! the void chrome</p>
              </div>
              <div className="flex justify-end">
                <p className="bg-[#FF2D87] text-white text-[7px] rounded-xl rounded-tr-sm px-1.5 py-0.5">*sends buzzflash* ⚡</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0, filter: "blur(8px)" }} animate={{ opacity: 1, filter: "blur(0)" }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-sm sm:text-lg xl:text-xl text-white/85 xl:text-gray-300 max-w-xl leading-relaxed my-4 xl:my-8"
          style={{ textShadow: "0 1px 10px rgba(0,0,0,.9), 0 2px 6px rgba(0,0,0,.7)" }}>
          Built for people who remember when the internet had a personality.
          Custom profiles. Chronological feeds. Your wall. Your people.{" "}
          <span className="text-white font-semibold">No algorithm in the way.</span>
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-3 justify-center xl:justify-start items-center sm:items-start">
          <TiltWrapper>
            <KeyStarBorder color="#FF2D87" speed="3.5s">
              <Link href="/login" className="key-btn key-pink" style={{ fontSize: "13px" }}>
                <Zap className="w-3.5 h-3.5" /> Claim Your ZID
              </Link>
            </KeyStarBorder>
          </TiltWrapper>
          <Link href="/login" className=" hidden flex items-center justify-center gap-2 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-[#FF2D87]/30 text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-all min-h-[44px]">
            Sign in
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="flex items-center gap-3 justify-center xl:justify-start text-white/50 xl:text-gray-500 text-[11px] font-mono mt-4 xl:mt-5 flex-wrap"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,.8)" }}>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> No ads</span>
          <span className="text-white/20 xl:text-gray-700">·</span>
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> No data sold</span>
          <span className="text-white/20 xl:text-gray-700">·</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Free forever</span>
        </motion.div>

      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-[#FF2D87]/30 to-transparent" />
        <ChevronDown className="w-3.5 h-3.5 text-[#FF2D87]/40 animate-bounce" style={{ animationDuration: "1.8s" }} />
      </motion.div>
    </section>
  );
}

// ── Ticker ────────────────────────────────────────────────────────
function TickerStrip() {
  const stripRef = useRef<HTMLDivElement>(null);
  const items = [
    { l: "ZeeWall", i: MessageSquare }, { l: "Core 8", i: Users }, { l: "Vibes", i: Star },
    { l: "Buzz", i: Send }, { l: "Zones", i: Hash }, { l: "Zlogger", i: Pencil },
    { l: "Theme Studio", i: Palette }, { l: "ZID", i: Shield }, { l: "Zaps", i: Zap },
    { l: "BuzzFlash", i: Flame }, { l: "Radio", i: Radio }, { l: "Theme Anthem", i: Music },
    { l: "GenBadge", i: Sparkles }, { l: "Real-time", i: Wifi },
  ];
  const d = [...items, ...items];
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { stripRef.current?.toggleAttribute("data-ticker-idle", !e.isIntersecting); },
      { threshold: 0 }
    );
    if (stripRef.current) obs.observe(stripRef.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={stripRef} className="relative overflow-hidden border-y border-[#FF2D87]/10 bg-[#0E0B0D]/90 py-3">
      <div className="flex whitespace-nowrap lp-marquee w-max">
        {d.map((item, i) => {
          const I = item.i; return (
            <span key={i} className="inline-flex items-center gap-2 mx-5 font-mono text-[11px] text-gray-600">
              <I className="w-3 h-3 text-[#FF2D87]/45" /> {item.l}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Anti-marketing callout ────────────────────────────────────────
function AntiMarketing() {
  const thems = [
    "An algorithm that decides who sees you",
    "Ads inserted between your friends",
    "Follower counts as the only measure of worth",
    "Shadow banning and reach throttling",
    "Your data sold to fund their business model",
    "A verified badge you buy or grind for",
  ];
  const us = [
    "Chronological feed: your posts reach your circle",
    "No ads. We mean it. Not now, not later",
    "Vibes scored by your actual community",
    "What you post reaches the people following you",
    "No data sold. No investors to answer to",
    "Your ZID is yours from day one, free",
  ];
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#080508]" />
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,45,135,.04) 39px,rgba(255,45,135,.04) 40px)" }} />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#FF2D87]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 130 }} viewport={{ once: true, margin: "-60px" }}
          className="text-center mb-16">
          <span className="inline-block font-mono text-[10px] tracking-[0.25em] text-gray-600 uppercase mb-5">Read the fine print</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
            We wrote{" "}
            <span className="lp-chrome-text">different rules.</span>
          </h2>
          <p className="text-gray-600 text-sm mt-4 max-w-sm mx-auto">The things every other platform quietly kept, we quietly removed.</p>
        </motion.div>

        {/* Comparison grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 rounded-2xl overflow-hidden border border-white/6">
          {/* Them */}
          <div className="bg-[#0C0A0B] p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-7">
              <div className="w-2 h-2 rounded-full bg-gray-700" />
              <span className="text-[10px] font-mono text-gray-600 tracking-[0.22em] uppercase">Every other platform</span>
            </div>
            <div className="space-y-4">
              {thems.map((t, i) => (
                <motion.div key={t} initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, type: "spring", damping: 24, stiffness: 200 }} viewport={{ once: true, margin: "-40px" }}
                  className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5 bg-red-500/10 flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-red-500/50" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-through decoration-gray-800">{t}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* VS divider */}
          <div className="hidden md:flex flex-col items-center justify-center bg-[#080508] border-x border-white/5 px-4 py-8 gap-3">
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-[#FF2D87]/15 to-transparent" />
            <span className="text-[9px] font-black text-[#FF2D87]/30 font-mono tracking-[0.3em]" style={{ writingMode: "vertical-lr" }}>VS</span>
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-[#FF2D87]/15 to-transparent" />
          </div>
          <div className="md:hidden h-px bg-gradient-to-r from-transparent via-[#FF2D87]/20 to-transparent" />

          {/* Us */}
          <div className="bg-gradient-to-br from-[#180A10] to-[#0E0B0D] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-48 h-48 bg-[#FF2D87]/6 blur-[60px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 mb-7 relative z-10">
              <div className="w-2 h-2 rounded-full bg-[#FF2D87]" style={{ boxShadow: "0 0 6px #FF2D87" }} />
              <span className="text-[10px] font-mono text-[#FF2D87] tracking-[0.22em] uppercase">Zeezu</span>
            </div>
            <div className="space-y-4 relative z-10">
              {us.map((t, i) => (
                <motion.div key={t} initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 + 0.1, type: "spring", damping: 24, stiffness: 200 }} viewport={{ once: true, margin: "-40px" }}
                  className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5 bg-[#B4FF00]/10 flex items-center justify-center">
                    <ChevronRight className="w-2.5 h-2.5 text-[#B4FF00]" />
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed font-medium">{t}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }} className="text-center text-gray-700 font-mono text-[10px] tracking-[0.25em] uppercase mt-10">
          We built what they were never allowed to be.
        </motion.p>
      </div>
    </section>
  );
}

// ── Manifesto ─────────────────────────────────────────────────────
// function ManifestoSection() {
//   const [showGL, setShowGL] = useState(false);
//   const sectionRef = useRef<HTMLElement>(null);

//   // Only mount FaultyTerminal when section enters view — unmount when gone
//   useEffect(() => {
//     const obs = new IntersectionObserver(
//       ([e]) => setShowGL(e.isIntersecting),
//       { threshold: 0.1 }
//     );
//     if (sectionRef.current) obs.observe(sectionRef.current);
//     return () => obs.disconnect();
//   }, []);

//   return (
//     <section ref={sectionRef} className="relative min-h-[60vh] flex items-center justify-center overflow-hidden py-24 px-4">
//       {/* CRT background — only renders when section is in view */}
//       {showGL && (
//         <div className="absolute inset-0 z-0 opacity-35">
//           <FaultyTerminal tint="#FF2D87" glitchAmount={0.08} scanlineIntensity={0.4}
//             flickerAmount={0.02} brightness={0.3} curvature={0.04} mouseReact={false}
//             style={{ width: "100%", height: "100%" }} />
//         </div>
//       )}
//       <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0E0B0D]/75 via-[#0E0B0D]/20 to-[#0E0B0D]/75 pointer-events-none" />
//       <div className="relative z-10 max-w-3xl mx-auto text-center">
//         <ScrollReveal enableBlur baseOpacity={0.04} baseRotation={2} blurStrength={4}
//           containerClassName="font-black leading-relaxed text-2xl sm:text-3xl"
//           textClassName="text-white">
//           The internet had a personality once. Your profile was a canvas. Your Top 8 was a statement. Posting on someone's wall felt like knocking on their door. Then it all got optimized. Sanitized. Monetized. Flattened into a feed designed to keep you scrolling. We stopped asking platforms to be different. We built one instead.
//         </ScrollReveal>
//       </div>
//     </section>
//   );
// }

// ── Manifesto (CRT TV Redesign) ───────────────────────────────────
// ── Manifesto (Fully Functional Interactive CRT TV) ───────────────────────────────────
// ── Manifesto (Chunky, Architecturally Accurate CRT TV) ───────────────────────────────────
// ── Manifesto (Architecturally Accurate Interactive CRT TV) ───────────────────────────────────
// ── Manifesto (Photorealistic Frutiger Aero Structure) ───────────────────────────────────
// ── Manifesto (Responsive, 3D Fisheye CRT TV) ───────────────────────────────────
function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // ── TV State ──
  const [power, setPower] = useState(false);
  const [hasAutoTurnedOn, setHasAutoTurnedOn] = useState(false);

  // ── Picture Settings State ──
  const [pic, setPic] = useState({ b: 100, c: 120, s: 100, glitch: 0.08 });

  // Auto-turn on when scrolled into view
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !hasAutoTurnedOn) {
          setTimeout(() => setPower(true), 800);
          setHasAutoTurnedOn(true);
        }
      },
      { threshold: 0.4 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [hasAutoTurnedOn]);

  // TV Adjustments
  const modPic = (key: keyof typeof pic, amount: number) => {
    setPic(prev => ({ ...prev, [key]: Math.max(0, prev[key] + amount) }));
  };
  const resetPic = () => setPic({ b: 100, c: 120, s: 100, glitch: 0.08 });

  return (
    <section ref={sectionRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden py-16 sm:py-24 px-2 sm:px-6 select-none bg-[#050505]">

      {/* Ambient Tube Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] blur-[100px] pointer-events-none z-[1] transition-colors duration-1000 ${power ? 'bg-[#00F7FF]/10' : 'bg-transparent'}`} />

      {/* ── FRUTIGER AERO CSS (Pure CSS Photorealism) ── */}
      <style>{`
        .crt-container {
          background: linear-gradient(180deg, #1e1e20 0%, #151517 50%, #0d0d0f 100%);
          border-radius: 12px;
          box-shadow: 0 40px 80px rgba(0,0,0,1), inset 0 2px 2px rgba(255,255,255,0.05), inset 0 -4px 10px rgba(0,0,0,0.8);
          border: 1px solid #2a2a2c; border-bottom: 6px solid #050505;
          padding: 1.5rem; width: 100%; max-width: 800px;
          position: relative; z-index: 10;
        }
        .crt-top { display: flex; justify-content: center; margin-bottom: 1.5rem; opacity: 0.6; }
        .crt-top-vent {
          width: 120px; height: 6px; background: #050505; border-radius: 4px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,1), 0 1px 0 rgba(255,255,255,0.03);
        }
        .crt-middle {
          display: flex; flex-direction: row; gap: 1rem;
          background: #08080a; padding: 1.5rem; border-radius: 8px;
          box-shadow: inset 0 10px 20px rgba(0,0,0,1), 0 1px 0 rgba(255,255,255,0.05);
          border-top: 1px solid #000;
        }
        .crt-middle-left, .crt-middle-right {
          display: flex; flex-direction: column; justify-content: space-between; align-items: center; width: 40px;
        }
        .crt-speakers {
          width: 100%; flex: 1;
          background-image: radial-gradient(circle at 2px 2px, #000 1.5px, transparent 0);
          background-size: 6px 6px; opacity: 0.8;
          box-shadow: inset 2px 2px 5px rgba(0,0,0,0.5); border-radius: 2px;
        }
        .side-ports {
          display: flex; flex-direction: column; gap: 6px; margin-top: 1rem;
          background: #000; padding: 6px 4px; border-radius: 4px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,1), 0 1px 0 rgba(255,255,255,0.05);
        }
        .composite { display: flex; flex-direction: column; gap: 6px; }
        .c-yellow, .c-white, .c-red {
          width: 12px; height: 12px; border-radius: 50%;
          border: 3px solid #222; box-shadow: inset 0 1px 3px rgba(0,0,0,0.9);
        }
        .c-yellow { background: #EAB308; } .c-white { background: #F3F4F6; } .c-red { background: #EF4444; }
        
        .crt-middle-middle {
          flex: 1; aspect-ratio: 4/3; background: #020202; border-radius: 12px;
          border: 8px solid #050505;
          position: relative; overflow: hidden;
        }
        
        /* ── 3D FISHEYE / TUBE ILLUSION ── */
        .crt-3d-tube {
          position: absolute; inset: 0; z-index: 45; pointer-events: none;
          /* Heavy spherical vignette to simulate deep corners */
          // box-shadow: inset 0 0 60px rgba(0,0,0,0.9), inset 0 0 120px rgba(0,0,0,0.6);
        }
        .crt-glass-glare {
          position: absolute; inset: 0; pointer-events: none; z-index: 50;
          /* Overlapping radial gradients to simulate convex glass reflection */
          background: radial-gradient(ellipse at 50% 5%, rgba(255,255,255,0.08) 0%, transparent 50%),
                      radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.4) 100%);
          border-radius: 4px;
        }
        
        .crt-bottom { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; padding: 0 1rem; }
        .crt-brand-container { text-align: center; }
        .crt-brand {
          font-family: Arial, sans-serif; font-weight: 900; letter-spacing: 0.3em; font-size: 14px;
          color: #777; text-shadow: 0 1px 1px rgba(255,255,255,0.1);
        }
        .crt-bottom-bottom { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; }
        .function-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }
        .buttons-groups-div {
          display: flex; gap: 4px; background: #111; padding: 4px 6px; border-radius: 4px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,1), 0 1px 0 rgba(255,255,255,0.05);
        }
        .pressable-buttons {
          background: linear-gradient(180deg, #2a2a2c 0%, #1a1a1c 100%);
          border: 1px solid #000; border-top: 1px solid #3a3a3c; border-radius: 2px;
          color: #888; font-family: monospace; font-size: 9px; font-weight: bold;
          padding: 4px 6px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          transition: transform 0.1s, background 0.1s;
        }
        .pressable-buttons:active {
          transform: translateY(2px); background: #111; border-top: 1px solid #000; box-shadow: none;
        }
        .power-btn { width: 32px; height: 32px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; }
        .led-lights {
          width: 6px; height: 6px; border-radius: 50%; border: none; padding: 0;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.8); margin-right: 8px; margin-bottom: 12px;
        }
        
        @media (max-width: 640px) {
          .crt-container { padding: 1rem; border-radius: 8px; }
          .crt-middle { padding: 0.75rem; gap: 0.5rem; border-radius: 6px; }
          .crt-middle-left, .crt-middle-right { width: 20px; }
          .pressable-buttons { font-size: 8px; padding: 3px 4px; }
          .crt-middle-middle { border-width: 4px; }
        }
      `}</style>

      <div className="crt-container">

        <div className="crt-top">
          <div className="crt-top-vent"></div>
        </div>

        <div className="crt-middle">

          <div className="crt-middle-left">
            <div className="crt-speakers" title="Left Speakers"></div>
          </div>

          <div className="crt-middle-middle">

            {/* ── 3D Fisheye Overlays ── */}
            <div className="crt-3d-tube" />
            <div className="crt-glass-glare" />

            {/* ── THE ACTUAL SCREEN ── */}
            <div
              className="relative w-full h-full bg-[#050508] transition-all duration-300"
              style={{ filter: power ? `brightness(${pic.b}%) contrast(${pic.c}%) saturate(${pic.s}%)` : 'brightness(0%)' }}
            >
              {/* Turn-On Wrapper */}
              <div className={`absolute inset-0 w-full h-full ${power ? 'crt-animate-on' : 'opacity-0'}`}>

                {power && (
                  <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen">
                    {/* Notice curvature is set to 0.25 to physically warp the WebGL grid! */}
                    <FaultyTerminal tint="#00F7FF" glitchAmount={pic.glitch} scanlineIntensity={0} flickerAmount={0.05} brightness={0.5} curvature={0.25} mouseReact={true} style={{ width: "100%", height: "100%" }} />
                  </div>
                )}

                {/* Hardware Noise/Scanlines */}
                <div className="absolute inset-0 z-30 pointer-events-none crt-scanlines mix-blend-overlay opacity-80" />
                <div className="absolute inset-0 z-30 pointer-events-none crt-rgb opacity-40" />

                {/* ── CONTAINED TEXT (Percentage Padding + Smart Clamp) ── */}
                <div className="relative z-20 w-full h-full flex flex-col justify-center px-[8%] py-[6%] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

                  {/* OSD AV-1 */}
                  <span className="absolute top-[4%] right-[6%] text-[#00FF41] font-mono text-[clamp(10px,1.5vw,16px)] font-bold tracking-widest animate-pulse" style={{ textShadow: "0 0 8px #00FF41" }}>AV-1</span>

                  {/* Fluid text: Scales from 12px mobile to max 22px desktop, guaranteeing containment */}
                  <div className="w-full text-left sm:text-center mt-[2%]">
                    <ScrollReveal enableBlur baseOpacity={0.04} baseRotation={2} blurStrength={4}
                      containerClassName="font-mono font-bold leading-[1.6] text-[clamp(10.5px,1.04vw+7px,22px)]"
                      textClassName="text-[#E0FFFF] drop-shadow-[0_0_6px_rgba(0,247,255,0.6)]">
                      The internet had a personality once. Your profile was a canvas. Your Top 8 was a statement. Posting on someone's wall felt like knocking on their door. Then it all got optimized. Sanitized. Monetized. Flattened into a feed designed to keep you scrolling. We stopped asking platforms to be different. We built one instead.
                    </ScrollReveal>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="crt-middle-right">
            <div className="crt-speakers" title="Right Speakers"></div>
            <div className="side-ports">
              <div className="composite">
                <div className="c-yellow" title="Video Input"></div>
                <div className="c-white" title="Audio Left Input"></div>
                <div className="c-red" title="Audio Right Input"></div>
              </div>
            </div>
          </div>

        </div>

        <div className="crt-bottom">
          <div className="crt-brand-container">
            <span className="crt-brand">ZEEZU TRINITRON</span>
          </div>

          <div className="crt-bottom-bottom">
            <div className="function-buttons">
              <div className="buttons-groups-div">
                <button className="pressable-buttons" onClick={() => modPic('s', 10)} title="Saturation +10">S+</button>
                <button className="pressable-buttons" onClick={() => modPic('s', -10)} title="Saturation -10">S-</button>
                <button className="pressable-buttons" onClick={() => modPic('c', 10)} title="Contrast +10">C+</button>
                <button className="pressable-buttons" onClick={() => modPic('c', -10)} title="Contrast -10">C-</button>
                <button className="pressable-buttons" onClick={() => modPic('b', 10)} title="Brightness +10">B+</button>
                <button className="pressable-buttons" onClick={() => modPic('b', -10)} title="Brightness -10">B-</button>
              </div>
              <div className="buttons-groups-div">
                <button className="pressable-buttons" onClick={() => modPic('glitch', 0.1)} title="Glitch +0.1">GLT+</button>
                <button className="pressable-buttons" onClick={() => modPic('glitch', -0.1)} title="Glitch -0.1">GLT-</button>
                <button className="pressable-buttons" onClick={resetPic} title="Reset Values">RST</button>
              </div>
            </div>

            <div className="buttons-groups-div" style={{ background: 'transparent', boxShadow: 'none' }}>
              <div className={`led-lights transition-colors duration-300 ${power ? 'bg-[#00FF41] shadow-[0_0_10px_#00FF41]' : 'bg-red-600 shadow-[0_0_6px_#ff0000]'}`} title="Power LED" />
              <button
                className={`pressable-buttons power-btn ${power ? 'bg-[#1a1a1c] translate-y-[2px] border-t-[#000]' : ''}`}
                onClick={() => setPower(!power)}
                title="Power Switch"
              >
                <Power className="w-4 h-4 text-gray-500 opacity-60" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// ── Features — auto-cycling ───────────────────────────────────────
function FeaturesSection() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [progKey, setProgKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const INTERVAL = 4200;

  // IntersectionObserver — pause when section not visible
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.25 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Auto-advance — setTimeout (no RAF!), only when visible
  useEffect(() => {
    if (!inView) return;
    const timer = window.setTimeout(() => {
      setActive(a => (a + 1) % FEAT.length);
      setProgKey(k => k + 1);
    }, INTERVAL);
    return () => window.clearTimeout(timer);
  }, [active, inView]);

  const feat = FEAT[active];
  const Icon = feat.icon;

  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <FadeIn className="text-center mb-12">
        <p className="text-[#FF2D87] text-[10px] font-mono tracking-[0.2em] uppercase mb-3">Built Different</p>
        <h2 className="text-4xl sm:text-5xl font-black text-white">What lives on Zeezu</h2>
        <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">Every feature exists because social media removed it.</p>
      </FadeIn>

      {/* Scrollable tab row — CSS-hidden scrollbar */}
      <div className="lp-feat-tabs flex overflow-x-auto gap-2 pb-2 mb-8">
        {FEAT.map((f, i) => {
          const FI = f.icon;
          return (
            <button key={f.title} onClick={() => { setActive(i); setProgKey(k => k + 1); }}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all min-h-[44px]"
              style={{
                background: active === i ? `${f.color}18` : "rgba(255,255,255,.03)",
                border: `1px solid ${active === i ? f.color + "50" : "rgba(255,255,255,.07)"}`,
                color: active === i ? f.color : "#555",
              }}>
              <FI className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{f.title}</span>
            </button>
          );
        })}
      </div>

      {/* Progress bar — CSS animation, compositor-driven */}
      <div className="h-[2px] bg-white/5 rounded-full mb-10 overflow-hidden">
        <div
          key={progKey}
          className="h-full rounded-full"
          style={{
            background: feat.color,
            boxShadow: `0 0 6px ${feat.color}60`,
            animation: `lp-progress ${INTERVAL}ms linear forwards`,
            animationPlayState: inView ? "running" : "paused",
          }}
        />
      </div>

      {/* Feature detail */}
      <AnimatePresence mode="wait">
        <motion.div key={feat.title}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="grid md:grid-cols-2 gap-8 items-center">

          {/* PixelCard — hover on desktop, auto-appear on touch */}
          {/* <div ref={pixelWrapRef} className="relative h-64 sm:h-72 order-2 md:order-1">
            <PixelCard colors={feat.px} gap={6} speed={50} className="w-full h-full rounded-2xl overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                <div className="mb-4 p-4 rounded-2xl" style={{ background: `${feat.color}15`, border: `1px solid ${feat.color}28` }}>
                  <Icon className="w-12 h-12" style={{ color: feat.color, filter: `drop-shadow(0 0 14px ${feat.color})` }} />
                </div>
                <p className="text-[9px] font-mono tracking-[0.2em] mb-2" style={{ color: feat.color }}>{feat.tag}</p>
                <h3 className="text-2xl font-black text-white">{feat.title}</h3>
              </div>
            </PixelCard>
          </div> */}
          {/* PixelCard with Embedded Live Cassette */}
          {/* PixelCard with Embedded Live Cassette */}
          {/* PixelCard with Embedded Live Cassette (Stupell Replica Label) */}
          {/* PixelCard with Photorealistic Stupell Replica Cassette */}
          {/* PixelCard with Premium Photorealistic Stupell Cassette */}
          <div className="relative h-[280px] sm:h-[320px] w-full order-2 md:order-1 flex items-center justify-center" style={{ containerType: 'inline-size' }}>

            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
              
              /* Sharpie ink sinking into paper */
              .vc-handwritten-title {
                font-family: 'Caveat', cursive;
                font-size: clamp(16px, 6cqw, 28px);
                font-weight: 700;
                color: #0a0a0a;
                transform: rotate(-2deg) translateY(1px);
                opacity: 0.85;
                line-height: 1.1;
                mix-blend-mode: multiply; /* Makes the ink look printed into the paper */
              }

              .vc-handwritten-tag {
                font-family: 'Caveat', cursive;
                font-size: clamp(14px, 4.5cqw, 22px);
                font-weight: 700;
                color: #111;
                letter-spacing: 1px;
                transform: rotate(-1deg);
                opacity: 0.85;
                mix-blend-mode: multiply;
              }

              /* Authentic Paper Grain & Vintage Dirt */
              .vc-paper-texture {
                position: absolute; inset: 0; z-index: 5; pointer-events: none;
                /* Base64 SVG Noise for real paper grain */
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E"),
                /* Subtle edge darkening for age */
                radial-gradient(circle at 50% 50%, transparent 60%, rgba(139,115,85,0.15) 100%);
                mix-blend-mode: multiply;
              }
            `}</style>

            <PixelCard colors={feat.px} gap={6} speed={50} alwaysOn className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center">

              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">

                {/* ── CASSETTE OUTER SHELL (Premium Molded Plastic) ── */}
                <div
                  className="relative w-full max-w-[360px] aspect-[1.58] rounded-xl sm:rounded-2xl overflow-hidden flex flex-col justify-between"
                  style={{
                    backgroundColor: feat.color,
                    /* Deep, multi-layered hardware shadows */
                    boxShadow: '0 24px 50px -10px rgba(0,0,0,0.9), inset 0 2px 8px rgba(255,255,255,0.4), inset 0 -6px 15px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.8)',
                    border: '1px solid rgba(0,0,0,0.9)'
                  }}
                >

                  {/* Metallic Corner Screws */}
                  <div className="absolute top-[4%] left-[3%] w-[3.5%] aspect-square rounded-full bg-gradient-to-br from-[#ccc] via-[#777] to-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.8)] z-30" />
                  <div className="absolute top-[4%] right-[3%] w-[3.5%] aspect-square rounded-full bg-gradient-to-br from-[#ccc] via-[#777] to-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.8)] z-30" style={{ transform: 'rotate(45deg)' }} />
                  <div className="absolute bottom-[4%] left-[3%] w-[3.5%] aspect-square rounded-full bg-gradient-to-br from-[#ccc] via-[#777] to-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.8)] z-30" style={{ transform: 'rotate(-20deg)' }} />
                  <div className="absolute bottom-[4%] right-[3%] w-[3.5%] aspect-square rounded-full bg-gradient-to-br from-[#ccc] via-[#777] to-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.8)] z-30" style={{ transform: 'rotate(70deg)' }} />

                  {/* ── CASSETTE STICKER / LABEL ── */}
                  <div className="absolute top-[11%] bottom-[23%] left-[4.5%] right-[4.5%] rounded-[1cqw] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_0_2px_rgba(0,0,0,0.2)] border border-black/10 flex flex-col z-10"
                    style={{ background: "#f5f3ec" }}> {/* Aged matte paper */}

                    {/* Premium Paper Grain Overlay */}
                    <div className="vc-paper-texture" />

                    {/* Left "A SIDE" Box (Absolute to float over stripes) */}
                    <div className="absolute top-[12%] left-[3%] w-[16%] h-[55%] bg-gradient-to-br from-[#222] to-[#0a0a0a] rounded-sm flex flex-col justify-center items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.4)] z-20 border border-[#000]">
                      <span className="font-sans font-black text-white text-[clamp(18px,6cqw,32px)] leading-none -mb-1 drop-shadow-md">A</span>
                      <span className="font-sans font-bold text-gray-300 text-[clamp(6px,1.5cqw,10px)] tracking-widest mt-1">SIDE</span>
                    </div>

                    {/* ── Label Background Structure ── */}
                    {/* Top Ruled Text Area (40% height) */}
                    <div className="absolute top-0 left-0 right-0 h-[40%] flex flex-col justify-end pb-[2%] pl-[22%] pr-[4%] z-10">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_31%,rgba(0,0,0,0.25)_31%,rgba(0,0,0,0.25)_33%)] z-0" />
                      <span className="vc-handwritten-title relative z-10 text-center">
                        {feat.title}
                      </span>
                    </div>

                    {/* Middle Rainbow Stripes (Polished Colors) */}
                    <div className="absolute top-[40%] left-0 right-0 h-[25%] w-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] z-0"
                      style={{ background: 'linear-gradient(to bottom, #ce2b2b 25%, #d19f24 25% 50%, #2863ba 50% 75%, #4ea2d4 75% 100%)' }} />

                    {/* Bottom Text Area (35% height) */}
                    <div className="absolute bottom-0 left-0 right-0 h-[35%] w-full flex items-center justify-center pt-[4%] pl-[20%] pr-[4%] z-10">
                      <span className="vc-handwritten-tag">
                        {feat.tag}
                      </span>
                    </div>

                    {/* ── THE CLEAR TAPE WINDOW (Premium Acrylic Glass) ── */}
                    <div className="absolute top-[44%] left-1/2 -translate-x-1/2 w-[60%] h-[36%] bg-[#08080a] rounded-[2cqw] border-[2px] border-black/50 shadow-[inset_0_6px_15px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_2px_rgba(255,255,255,0.1)] overflow-hidden flex justify-between items-center px-[6%] z-30">

                      {/* Premium Multi-Layer Glass Glare */}
                      <div className="absolute inset-0 pointer-events-none z-50">
                        {/* Soft radial bulge */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.15)_0%,transparent_70%)]" />
                        {/* Sharp diagonal acrylic reflection */}
                        <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.12)_40%,rgba(255,255,255,0.03)_45%,transparent_50%)]" />
                      </div>

                      {/* Background Grid */}
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#666 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)', backgroundSize: '4px 4px' }} />

                      {/* LEFT SPOOL (Full tape) */}
                      <div className="relative z-10 flex items-center justify-center h-full aspect-square">
                        <div className="absolute w-[220%] aspect-square rounded-full bg-[#111] shadow-[inset_0_0_10px_rgba(0,0,0,1),0_0_0_1px_rgba(0,0,0,0.5)]" />
                        <div className="relative w-[55%] aspect-square animate-spin rounded-full border-[2px] border-[#e0e0e0] flex items-center justify-center shadow-[0_0_6px_rgba(255,255,255,0.15)]" style={{ animationDuration: '4s', animationTimingFunction: 'linear' }}>
                          <div className="absolute w-[2px] h-full bg-[#e0e0e0]" />
                          <div className="absolute w-full h-[2px] bg-[#e0e0e0]" />
                          <div className="absolute w-full h-[2px] bg-[#e0e0e0] rotate-45" />
                          <div className="absolute w-full h-[2px] bg-[#e0e0e0] -rotate-45" />
                          <div className="w-[45%] aspect-square bg-[#08080a] rounded-full z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,1)]" />
                        </div>
                      </div>

                      {/* RIGHT SPOOL (Empty tape) */}
                      <div className="relative z-10 flex items-center justify-center h-full aspect-square">
                        <div className="absolute w-[80%] aspect-square rounded-full bg-[#111] shadow-[inset_0_0_10px_rgba(0,0,0,1),0_0_0_1px_rgba(0,0,0,0.5)]" />
                        <div className="relative w-[55%] aspect-square animate-spin rounded-full border-[2px] border-[#e0e0e0] flex items-center justify-center shadow-[0_0_6px_rgba(255,255,255,0.15)]" style={{ animationDuration: '1.5s', animationTimingFunction: 'linear' }}>
                          <div className="absolute w-[2px] h-full bg-[#e0e0e0]" />
                          <div className="absolute w-full h-[2px] bg-[#e0e0e0]" />
                          <div className="absolute w-full h-[2px] bg-[#e0e0e0] rotate-45" />
                          <div className="absolute w-full h-[2px] bg-[#e0e0e0] -rotate-45" />
                          <div className="w-[45%] aspect-square bg-[#08080a] rounded-full z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,1)]" />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ── BOTTOM TRAPEZOID (Tape Head Reader) ── */}
                  <div className="absolute bottom-0 left-[10%] right-[10%] h-[20%] bg-black/30 border-t border-x border-black/50 rounded-t-md shadow-[inset_0_8px_15px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex justify-between items-end px-[6%] pb-[2%] z-20">

                    {/* Deep Hardware Ribs */}
                    <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.9)_0px,rgba(0,0,0,0.9)_2px,transparent_2px,transparent_6px)] mix-blend-multiply rounded-t-md" />

                    {/* Structural Holes */}
                    <div className="w-[4.5%] aspect-square rounded-full bg-[#030303] shadow-[inset_0_2px_6px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.15)] relative z-10 mb-[1%]" />
                    <div className="w-[6.5%] aspect-square rounded-full bg-[#030303] shadow-[inset_0_2px_6px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.15)] relative z-10" />
                    <div className="w-[6.5%] aspect-square rounded-full bg-[#030303] shadow-[inset_0_2px_6px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.15)] relative z-10" />
                    <div className="w-[4.5%] aspect-square rounded-full bg-[#030303] shadow-[inset_0_2px_6px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.15)] relative z-10 mb-[1%]" />
                  </div>

                </div>
              </div>

            </PixelCard>
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <span className="inline-block text-[9px] font-mono tracking-[0.2em] px-3 py-1 rounded-full mb-4"
              style={{ color: feat.color, background: `${feat.color}12`, border: `1px solid ${feat.color}28` }}>
              {feat.tag}
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white mb-4">{feat.title}</h3>
            <p className="text-gray-300 text-base leading-relaxed mb-6">{feat.desc}</p>
            <ul className="space-y-2.5">
              {feat.bullets.map(b => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: feat.color, boxShadow: `0 0 5px ${feat.color}` }} />
                  {b}
                </li>
              ))}
            </ul>
            <Link href="/login" className="inline-flex items-center gap-1.5 mt-7 text-sm font-bold transition-colors" style={{ color: feat.color }}>
              Try {feat.title} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// ── Profile card component (Zeezu-style) ─────────────────────────
function ZeezuProfileCard({ p }: { p: typeof PROFILES[0] }) {
  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header gradient */}
      <div className="h-16 rounded-t-xl flex-shrink-0 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${p.color}35 0%, ${p.color2}18 100%)` }}>
        <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.08) 2px,rgba(0,0,0,.08) 3px)" }} />
        {/* Anthem badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-1.5 py-0.5">
          <Music className="w-2.5 h-2.5" style={{ color: p.color }} />
          <span className="text-[7px] font-mono text-gray-400 max-w-[70px] truncate">{p.anthem}</span>
        </div>
      </div>
      {/* Avatar row */}
      <div className="px-3 -mt-5 flex items-end justify-between">
        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`} alt="" loading="lazy"
          className="w-12 h-12 rounded-xl border-2 border-[#0E0B0D] flex-shrink-0"
          style={{ background: "#0E0B0D" }} />
        <div className="flex items-center gap-1 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: statusColors[p.status], boxShadow: `0 0 4px ${statusColors[p.status]}` }} />
          <span className="text-[8px] font-mono" style={{ color: statusColors[p.status] }}>{p.status}</span>
        </div>
      </div>
      {/* Info */}
      <div className="px-3 pt-1.5 pb-2 flex-1 flex flex-col">
        <div className="mb-1.5">
          <div className="flex items-center gap-1.5">
            <p className="text-white font-black text-sm">{p.name}</p>
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}30` }}>{p.gen}</span>
          </div>
          <p className="text-[9px] font-mono truncate" style={{ color: `${p.color}80` }}>{p.zid.slice(0, 16)}</p>
          <p className="text-gray-400 text-[10px] italic mt-0.5 leading-tight">"{p.tagline}"</p>
        </div>
        {/* Vibes */}
        <div className="space-y-1 mb-2">
          {([["Trust", p.vibes.trust, "#00F7FF"], ["Cool", p.vibes.cool, p.color], ["Sexy", p.vibes.sexy, "#FFD700"]] as [string, number, string][]).map(([l, v, c]) => (
            <div key={l}>
              <div className="flex justify-between"><span className="text-[7px] text-gray-600 font-mono">{l}</span><span className="text-[7px] font-mono" style={{ color: c }}>{v}</span></div>
              <div className="h-[2px] bg-white/5 rounded-full"><div className="h-full rounded-full" style={{ width: `${v}%`, background: c }} /></div>
            </div>
          ))}
        </div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {p.tags.map(t => (
            <span key={t} className="text-[7px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${p.color}10`, color: p.color, border: `1px solid ${p.color}20` }}>{t}</span>
          ))}
        </div>
        {/* Mini Core 8 */}
        <div className="mt-auto">
          <p className="text-[7px] text-gray-700 font-mono mb-1">CORE 8</p>
          <div className="grid grid-cols-8 gap-0.5">
            {p.core8seeds.map(s => (
              <img key={s} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`} alt="" loading="lazy"
                className="w-5 h-5 rounded-md border border-white/5 bg-black" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Community section ─────────────────────────────────────────────
function CommunitySection() {
  return (
    <section className="py-20 px-4 sm:px-6 lp-cs-wrap">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          {/* Text */}
          <FadeIn>
            <p className="text-[#00F7FF] text-[10px] font-mono tracking-[0.2em] uppercase mb-3">Real Profiles</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
              People who actually show up as themselves
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-4">
              No personal brand. No content strategy. No growth hacking.
              Zeezu is for people who want a corner of the internet that feels like theirs.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              Every profile looks different because you design it. Your ZID is permanent.
              Your Vibe score builds from people who actually interact with you.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="key-btn key-pink" style={{ fontSize: "11px", padding: "8px 18px", minHeight: "34px" }}>
                <Users className="w-3.5 h-3.5" /> Find your people
              </Link>
              <Link href="/login" className="key-btn key-cyan" style={{ fontSize: "11px" }}>
                <Globe className="w-3.5 h-3.5" /> Browse ZeeWall
              </Link>
            </div>
          </FadeIn>

          {/* CardSwap — all screen sizes, centered via CSS offset compensation */}
          <FadeIn delay={100} className="flex justify-center items-center">
            <div className="lp-cs-center relative cardswapmobile" style={{ height: 460, width: 310 }}>
              <CardSwap
                width={300}
                height={430}
                cardDistance={52}
                verticalDistance={30}
                delay={3800}
                pauseOnHover
                easing="elastic"
                skewAmount={3}
              >
                {PROFILES.map(p => (
                  <Card key={p.name}
                    customClass="overflow-hidden"
                    style={{
                      background: "rgba(20,8,14,.9)",
                      border: `1px solid ${p.color}30`,
                      backdropFilter: "blur(10px)",
                    }}>
                    <ZeezuProfileCard p={p} />
                  </Card>
                ))}
              </CardSwap>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ── Platform in detail — TiltedCard showcase ──────────────────────
function ShowcaseSection() {
  const items = [
    {
      title: "Your profile is a canvas",
      sub: "12 Y2K presets. Custom hex colors. 8 display fonts. Chrome bevel, holographic shimmer, CRT scanlines. Every profile on Zeezu looks like a deliberate choice - because it is.",
      icon: Palette, color: "#FF2D87", c2: "#FF007A",
      label: "Theme Studio",
      stat: "12 presets + fully custom",
      bullets: ["12 Y2K preset themes + fully custom hex", "Font, color, card style, button style", "CRT scanlines, holo shimmer, noise effects", "Theme Anthem plays when someone visits you"],
      overlay: (
        <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: "rgba(14,5,10,.97)" }}>
          {/* App chrome */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF2D87]" style={{ boxShadow: "0 0 4px #FF2D87" }} />
              <span className="text-[7px] font-mono text-[#FF2D87] tracking-widest">THEME STUDIO</span>
            </div>
            <span className="text-[6px] font-mono text-gray-700 border border-white/8 px-1.5 py-0.5 rounded">cyber_pink</span>
          </div>
          {/* Mini live profile preview */}
          <div className="mx-3 mt-2.5 rounded-xl overflow-hidden flex-shrink-0 border" style={{ borderColor: "rgba(255,45,135,.28)" }}>
            <div className="h-9 relative" style={{ background: "linear-gradient(135deg,rgba(255,45,135,.45),rgba(255,0,122,.2))" }}>
              <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.12) 2px,rgba(0,0,0,.12) 3px)" }} />
              <div className="absolute bottom-1 right-2 flex items-center gap-1 bg-black/50 rounded-full px-1.5 py-0.5">
                <Music className="w-2 h-2 text-[#FF2D87]" />
                <span className="text-[5.5px] font-mono text-gray-400">Charli XCX - 360</span>
              </div>
            </div>
            <div className="px-2 -mt-3.5 flex items-end justify-between" style={{ background: "rgba(20,8,14,.95)" }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=nxrm1" alt="" loading="lazy"
                className="w-8 h-8 rounded-xl border-2 border-[#0E0B0D] bg-black flex-shrink-0" />
              <div className="flex items-center gap-1 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6BCB77]" style={{ boxShadow: "0 0 4px #6BCB77" }} />
                <span className="text-[6px] font-mono text-[#6BCB77]">online</span>
              </div>
            </div>
            <div className="px-2 pb-2" style={{ background: "rgba(20,8,14,.95)" }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-white text-[9px] font-black">nxrmalvxid</p>
                <span className="text-[5px] font-mono px-1 py-0.5 rounded-full" style={{ background: "rgba(255,45,135,.15)", color: "#FF2D87", border: "1px solid rgba(255,45,135,.3)" }}>GEN Z</span>
              </div>
              <p className="text-[5.5px] font-mono text-[#FF2D87] opacity-50 mb-0.5">NXRM4LVXID9K2P8Q</p>
              <p className="text-gray-500 text-[6px] italic">"building things at 3am again"</p>
            </div>
          </div>
          {/* Theme color grid */}
          <div className="px-3 mt-2.5 flex-shrink-0">
            <p className="text-[6px] font-mono text-gray-600 mb-1.5 tracking-widest">CHOOSE THEME</p>
            <div className="grid grid-cols-6 gap-1">
              {([["#FF2D87", true], ["#B4FF00", false], ["#00F7FF", false], ["#FFD700", false], ["#C4C4D4", false], ["#8A2EFF", false]] as [string, boolean][]).map(([c, active]) => (
                <div key={c} className="aspect-square rounded-md flex items-center justify-center"
                  style={{ background: `${c}18`, border: `2px solid ${active ? c : `${c}18`}`, boxShadow: active ? `0 0 8px ${c}55` : "none" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                </div>
              ))}
            </div>
          </div>
          {/* Font selector */}
          <div className="px-3 mt-2 flex-shrink-0">
            <p className="text-[6px] font-mono text-gray-600 mb-1 tracking-widest">FONT</p>
            <div className="flex gap-1">
              {([["Syne", true], ["Orbitron", false], ["VT323", false], ["Rajdhani", false]] as [string, boolean][]).map(([f, active]) => (
                <span key={f} className="text-[5.5px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: active ? "rgba(255,45,135,.2)" : "rgba(255,255,255,.04)", border: `1px solid ${active ? "rgba(255,45,135,.5)" : "rgba(255,255,255,.08)"}`, color: active ? "#FF2D87" : "#444" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          {/* Effects toggles */}
          <div className="px-3 mt-2 flex-shrink-0">
            <p className="text-[6px] font-mono text-gray-600 mb-1 tracking-widest">EFFECTS</p>
            <div className="flex gap-1.5">
              {([["CRT", false], ["Holo", true], ["Grid", false], ["Noise", true]] as [string, boolean][]).map(([e, on]) => (
                <div key={e} className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                  style={{ background: on ? "rgba(180,255,0,.10)" : "rgba(255,255,255,.04)", border: `1px solid ${on ? "rgba(180,255,0,.3)" : "rgba(255,255,255,.06)"}` }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "#B4FF00" : "#2a2a2a", boxShadow: on ? "0 0 4px #B4FF00" : "none" }} />
                  <span className="text-[5.5px] font-mono" style={{ color: on ? "#B4FF00" : "#444" }}>{e}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Save button */}
          <div className="px-3 mt-auto pb-3 pt-2 flex-shrink-0">
            <div className="w-full py-2 rounded-xl text-center text-[8px] font-black tracking-wider"
              style={{ background: "linear-gradient(135deg,#FF2D87,#FF007A)", boxShadow: "0 0 16px rgba(255,45,135,.4)", color: "white" }}>
              SAVE THEME
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Write something that lasts",
      sub: "Zlogger is a full long-form editor with a split-pane live preview. 5 visual reading themes. 6 custom Z-tags that make your formatting feel alive. Highlight any text to share. Writing that doesn't shrink to a tweet.",
      icon: Pencil, color: "#B4FF00", c2: "#00F7FF",
      label: "Zlogger",
      stat: "5 reading themes, 6 Z-tags",
      bullets: ["Split-pane editor with live preview", "5 reading themes: void chrome, neon vapor + more", "[z-neon] [z-glitch] [z-marquee] custom tags", "Highlight-to-share tooltip on every post"],
      overlay: (
        <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: "rgba(8,12,6,.97)" }}>
          {/* App chrome */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 flex-shrink-0" style={{ background: "rgba(0,0,0,.5)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF2D87]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#B4FF00]" />
              <span className="text-[8px] font-mono ml-1" style={{ color: "rgba(180,255,0,.5)" }}>ZLOGGER</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(180,255,0,.12)", color: "#B4FF00" }}>VOID CHROME</span>
              <span className="text-[7px] font-mono px-1.5 py-0.5 rounded text-gray-600" style={{ background: "rgba(255,255,255,.04)" }}>NEON VAPOR</span>
              <span className="text-[7px] font-mono px-1.5 py-0.5 rounded text-gray-600" style={{ background: "rgba(255,255,255,.04)" }}>DAYLIGHT</span>
            </div>
          </div>

          {/* Split pane editor */}
          <div className="flex flex-1 overflow-hidden">
            {/* Source pane */}
            <div className="w-[48%] border-r border-white/5 p-2.5 overflow-hidden flex flex-col">
              <p className="text-[7px] font-mono mb-2 flex items-center gap-1" style={{ color: "rgba(180,255,0,.4)" }}>
                <span style={{ color: "#B4FF00" }}>●</span> SOURCE
              </p>
              <div className="space-y-0.5 flex-1 overflow-hidden">
                {[
                  { t: "## 2am and I'm still here", c: "#B4FF00", w: "bold" },
                  { t: "", c: "transparent" },
                  { t: "It was one of those nights.", c: "rgba(255,255,255,.45)" },
                  { t: "The kind that bleeds into", c: "rgba(255,255,255,.45)" },
                  { t: "morning without asking.", c: "rgba(255,255,255,.45)" },
                  { t: "", c: "transparent" },
                  { t: "[z-neon]everything[/z-neon]", c: "#00F7FF" },
                  { t: "felt pixelated and real.", c: "rgba(255,255,255,.45)" },
                  { t: "", c: "transparent" },
                  { t: "[z-divider /]", c: "rgba(180,255,0,.5)" },
                  { t: "", c: "transparent" },
                  { t: "[z-glitch]trust the[/z-glitch]", c: "#FF2D87" },
                  { t: "weird corners.", c: "rgba(255,255,255,.45)" },
                ].map((line, i) => (
                  <p key={i} className="text-[7px] font-mono leading-[1.55]" style={{ color: line.c, fontWeight: line.w || "normal" }}>{line.t || "\u00a0"}</p>
                ))}
              </div>
              {/* Z-tag palette */}
              <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-1">
                {["z-neon", "z-glitch", "z-marquee", "z-divider", "z-quote", "z-spark"].map((tag, i) => (
                  <span key={i} className="text-[6px] font-mono px-1 py-0.5 rounded" style={{ background: i === 0 ? "rgba(0,247,255,.15)" : "rgba(255,255,255,.06)", color: i === 0 ? "#00F7FF" : "rgba(255,255,255,.3)" }}>[{tag}]</span>
                ))}
              </div>
            </div>

            {/* Preview pane */}
            <div className="flex-1 p-2.5 overflow-hidden flex flex-col">
              <p className="text-[7px] font-mono mb-2 flex items-center gap-1" style={{ color: "rgba(180,255,0,.4)" }}>
                <span className="opacity-50">◎</span> PREVIEW
              </p>
              <div className="flex-1 overflow-hidden">
                <p className="text-[9px] font-black leading-tight mb-1.5" style={{ color: "#B4FF00", textShadow: "0 0 12px rgba(180,255,0,.4)" }}>2am and I'm still here</p>
                <p className="text-[7px] leading-relaxed mb-1.5" style={{ color: "rgba(255,255,255,.5)" }}>It was one of those nights. The kind that bleeds into morning without asking.</p>

                {/* Highlight-to-share tooltip */}
                <div className="relative inline-block mb-1.5">
                  <span className="text-[7px]" style={{ color: "#00F7FF", textShadow: "0 0 10px rgba(0,247,255,.6)", background: "rgba(0,247,255,.08)", borderRadius: "2px", padding: "0 2px" }}>everything</span>
                  <span className="text-[7px]" style={{ color: "rgba(255,255,255,.5)" }}> felt pixelated and real.</span>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[6px] font-mono whitespace-nowrap" style={{ background: "#B4FF00", color: "#000" }}>
                    ↗ share
                  </div>
                </div>

                <div className="w-full h-px my-1.5" style={{ background: "linear-gradient(90deg, transparent, rgba(180,255,0,.3), transparent)" }} />
                <p className="text-[7px] leading-relaxed" style={{ color: "rgba(255,165,255,.6)", fontStyle: "italic" }}>
                  <span style={{ textDecoration: "line-through wavy #FF2D87", textDecorationSkipInk: "none" }}>trust</span>&nbsp;the weird corners.
                </p>
              </div>

              {/* Word count / reading time */}
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[7px] font-mono" style={{ color: "rgba(180,255,0,.35)" }}>342 words · 2 min read</span>
                <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(180,255,0,.15)", color: "#B4FF00" }}>PUBLISH</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Messages that hit different",
      sub: "Buzz is BBM meets AIM. Send a BuzzFlash: a nudge that hijacks someone's entire screen for a second. BBM-style delivery confirmations. No message request gatekeeping. No reply rate pressure.",
      icon: Send, color: "#FF007A", c2: "#FF2D87",
      label: "Buzz",
      stat: "Real-time, no request filters",
      bullets: ["BuzzFlash full-screen nudge overlays", "BBM-style delivery + read receipts", "Real-time via Supabase channels", "No message request filters, just talk"],
      overlay: (
        <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: "rgba(14,5,12,.97)" }}>
          {/* BuzzFlash incoming overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none" style={{ background: "rgba(255,0,122,.92)", backdropFilter: "blur(2px)" }}>
            <div className="text-center">
              <p className="text-[8px] font-mono text-white/60 tracking-[0.3em] uppercase mb-1">BUZZFLASH</p>
              <div className="text-3xl mb-2">⚡</div>
              <div className="w-10 h-10 rounded-full mx-auto mb-2 overflow-hidden border-2 border-white/40" style={{ background: "rgba(255,255,255,.1)" }}>
                <div className="w-full h-full flex items-center justify-center text-[16px]">🧙</div>
              </div>
              <p className="text-white text-[11px] font-black tracking-tight">glitchwitch</p>
              <p className="text-white/70 text-[8px] font-mono mt-0.5">sent you a BUZZ</p>
              <div className="flex items-center gap-2 mt-3">
                <button className="px-3 py-1 rounded-full text-[7px] font-bold bg-white text-[#FF007A]">OPEN</button>
                <button className="px-3 py-1 rounded-full text-[7px] font-bold border border-white/30 text-white">DISMISS</button>
              </div>
            </div>
          </div>

          {/* Underlying chat — visible behind flash */}
          {/* Contact header */}
          <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0" style={{ borderColor: "rgba(255,0,122,.15)", background: "rgba(0,0,0,.5)" }}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg overflow-hidden border flex items-center justify-center text-[14px]" style={{ borderColor: "rgba(255,0,122,.35)", background: "rgba(255,0,122,.1)" }}>🧙</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0E050C]" style={{ background: "#6BCB77" }} />
              </div>
              <div>
                <p className="text-white text-[9px] font-bold leading-none">glitchwitch</p>
                <p className="text-[7px] font-mono mt-0.5" style={{ color: "#6BCB77" }}>● online · @glitchwitch</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="text-[7px] font-black px-2 py-1 rounded-full" style={{ background: "rgba(255,0,122,.2)", color: "#FF007A", border: "1px solid rgba(255,0,122,.35)" }}>⚡ BUZZ</button>
            </div>
          </div>

          {/* Chat thread */}
          <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
            {/* Incoming */}
            <div className="flex items-end gap-1.5">
              <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] flex-shrink-0" style={{ background: "rgba(255,0,122,.15)" }}>🧙</div>
              <div>
                <p className="text-[7px] rounded-xl rounded-tl-sm px-2 py-1" style={{ background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.75)" }}>ur profile theme goes hard ngl</p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-[6px] font-mono text-gray-700">11:42 PM</span>
                </div>
              </div>
            </div>
            {/* Outgoing */}
            <div className="flex items-end gap-1.5 justify-end">
              <div>
                <p className="text-[7px] rounded-xl rounded-tr-sm px-2 py-1 text-white" style={{ background: "#FF2D87" }}>ty!! void chrome theme 🖤</p>
                <div className="flex items-center gap-0.5 mt-0.5 justify-end">
                  <span className="text-[6px] font-mono text-gray-700">11:43 PM</span>
                  <span className="text-[7px]" style={{ color: "#6BCB77" }}>✓✓</span>
                </div>
              </div>
            </div>
            {/* Incoming */}
            <div className="flex items-end gap-1.5">
              <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] flex-shrink-0" style={{ background: "rgba(255,0,122,.15)" }}>🧙</div>
              <div>
                <p className="text-[7px] rounded-xl rounded-tl-sm px-2 py-1" style={{ background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.75)" }}>sending u a buzzflash rn 👁</p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-[6px] font-mono text-gray-700">11:44 PM</span>
                  <span className="text-[7px]" style={{ color: "#6BCB77" }}>✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message input */}
          <div className="px-3 pb-3 flex gap-1.5 flex-shrink-0">
            <div className="flex-1 rounded-xl px-2.5 py-1.5 text-[8px]" style={{ background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.25)", border: "1px solid rgba(255,0,122,.12)" }}>message glitchwitch...</div>
            <button className="rounded-xl p-1.5 flex-shrink-0" style={{ background: "#FF007A" }}><Send className="w-3 h-3 text-white" /></button>
          </div>
        </div>
      ),
    },
  ];

  // Disney motion variants
  const rowVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };
  const slideLeft = { hidden: { opacity: 0, x: -48, scale: 0.94 }, show: { opacity: 1, x: 0, scale: 1, transition: { type: "spring" as const, damping: 20, stiffness: 120 } } };
  const slideRight = { hidden: { opacity: 0, x: 48, scale: 0.94 }, show: { opacity: 1, x: 0, scale: 1, transition: { type: "spring" as const, damping: 20, stiffness: 120 } } };
  const bulletItem = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { type: "spring" as const, damping: 22, stiffness: 200 } } };

  return (
    <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Section background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0E0B0D]" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,45,135,.06) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(0,247,255,.04) 0%, transparent 50%)" }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <FadeIn className="text-center mb-20">
          <p className="text-[#B4FF00] text-[10px] font-mono tracking-[0.2em] uppercase mb-3">Platform in Detail</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">The depth is in the details</h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Most platforms give you a box to type in. Zeezu gives you a space to live in.
          </p>
        </FadeIn>

        <div className="space-y-24 sm:space-y-32">
          {items.map((item, i) => {
            const Icon = item.icon;
            const even = i % 2 === 0;
            return (
              <motion.div key={item.title} variants={rowVariants} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className={`flex flex-col ${even ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-20`}>

                {/* TiltedCard visual */}
                <motion.div variants={even ? slideLeft : slideRight} className="flex-shrink-0 flex justify-center w-full lg:w-auto">
                  <div className="relative">
                    {/* Glow halo behind card */}
                    <div className="absolute inset-0 blur-[60px] opacity-30 rounded-3xl scale-90"
                      style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }} />
                    <TiltedCard
                      imageSrc={cardBg(item.color, item.c2)}
                      containerHeight="420px" containerWidth="300px"
                      imageHeight="420px" imageWidth="300px"
                      rotateAmplitude={12} scaleOnHover={1.05}
                      showMobileWarning={false} showTooltip={false}
                      displayOverlayContent
                      overlayContent={
                        <div className="absolute inset-0 rounded-xl overflow-hidden" style={{ border: `1px solid ${item.color}30` }}>
                          {item.overlay}
                        </div>
                      }
                    />
                    {/* Feature stat badge */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full lp-glass text-[10px] font-mono whitespace-nowrap"
                      style={{ borderColor: `${item.color}30`, color: item.color }}>
                      <Icon className="w-3 h-3" /> {item.stat}
                    </div>
                  </div>
                </motion.div>

                {/* Text block with stagger */}
                <motion.div variants={even ? slideRight : slideLeft} className="flex-1 max-w-xl text-center lg:text-left">
                  <motion.div variants={bulletItem} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}28` }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />
                    <span className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: item.color }}>{item.label}</span>
                  </motion.div>

                  <motion.h3 variants={bulletItem} className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                    {item.title}
                  </motion.h3>
                  <motion.p variants={bulletItem} className="text-gray-400 text-base leading-relaxed mb-7">{item.sub}</motion.p>

                  {/* Staggered bullet list */}
                  <motion.ul className="space-y-3 text-left mb-8" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
                    {item.bullets.map(b => (
                      <motion.li key={b} variants={bulletItem} className="flex items-center gap-3 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                        <span className="text-gray-400">{b}</span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  <motion.div variants={bulletItem}>
                    <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold transition-all hover:gap-3"
                      style={{ color: item.color }}>
                      Explore {item.title} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { l: "ZIDs Claimed", v: 1847, s: "+", i: Shield, c: "#FF2D87" },
    { l: "Wall Posts", v: 22400, s: "+", i: MessageSquare, c: "#00F7FF" },
    { l: "Vibes Rated", v: 9300, s: "+", i: Star, c: "#FFD700" },
    { l: "Active Themes", v: 12, s: "", i: Palette, c: "#B4FF00" },
  ];
  return (
    <section className="py-16 border-y border-[#FF2D87]/8 bg-[#140D12]/50">
      <FadeIn className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s, i) => {
          const I = s.i; return (
            <div key={s.l}>
              <div className="flex justify-center mb-2">
                <I className="w-4 h-4" style={{ color: s.c }} />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white mb-1">
                <CountUp to={s.v} duration={2} delay={i * 0.15} separator="," />{s.s}
              </div>
              <p className="text-gray-600 text-[10px] font-mono uppercase tracking-widest">{s.l}</p>
            </div>
          );
        })}
      </FadeIn>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────
const FAQS = [
  { q: "Is Zeezu free?", a: "Yes, always. No premium tier, no locked features. Your ZID is yours from day one at no cost." },
  { q: "What is a ZID?", a: "A unique 20-character identity that permanently belongs to you. It's your address on the network, visible in your profile URL and everywhere else you show up on Zeezu." },
  { q: "Is there an algorithm?", a: "No. Your ZeeWall shows posts chronologically. No boosted content, no engagement-based ranking, no shadow banning. What you post reaches your circle." },
  { q: "How is this different from Instagram or X?", a: "You design your own profile. You own your wall. Your friends see what you post, in order, without a platform deciding otherwise. Vibes replace follower counts. Core 8 replaces follow graphs." },
  { q: "Can I customize my profile?", a: "Fully. 12 Y2K preset themes, custom hex colors, 8 display fonts, multiple card styles, background effects (CRT, holographic, noise), and a Theme Anthem that plays when people visit your page." },
  { q: "What is Buzz?", a: "Buzz is Zeezu's messaging system. It works like BBM-era instant messaging with delivery status. BuzzFlash lets you send a nudge that takes over someone's screen, AIM-style." },
  { q: "What are Zones?", a: "Zones are topic-based communities not run by an algorithm. Join Zones for music, art, gaming, or whatever corner of the internet actually interests you." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
      <FadeIn className="text-center mb-12">
        <p className="text-[#FFD700] text-[10px] font-mono tracking-[0.2em] uppercase mb-3">Questions</p>
        <h2 className="text-4xl sm:text-5xl font-black text-white">We know you have them</h2>
      </FadeIn>
      <div className="space-y-2">
        {FAQS.map((f, i) => (
          <FadeIn key={f.q} delay={i * 40}>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full lp-glass-dark rounded-xl px-5 py-4 text-left transition-all hover:border-[#FFD700]/25"
              style={{ borderColor: open === i ? "rgba(255,215,0,.2)" : "rgba(255,255,255,.06)" }}>
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-sm text-white">{f.q}</span>
                <span className="flex-shrink-0 text-[#FFD700]/60">
                  {open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </div>
              <AnimatePresence>
                {open === i && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="text-gray-400 text-sm leading-relaxed mt-3 overflow-hidden">
                    {f.a}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[320px] bg-[#FF2D87]/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-[#00F7FF]/6 blur-[100px] rounded-full" />
      </div>
      <FadeIn className="max-w-xl mx-auto text-center relative z-10">
        <ElectricBorder color="#FF2D87" speed={1.2} chaos={0.11} borderRadius={28}>
          <div className="p-8 sm:p-12">
            <div className="mb-6 flex justify-center">
              <div className="p-3 rounded-xl bg-[#FF2D87]/10 border border-[#FF2D87]/22">
                <Zap className="w-8 h-8 text-[#FF2D87]" style={{ filter: "drop-shadow(0 0 12px #FF2D87)" }} />
              </div>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight">Your ZID is waiting.</h2>
            <p className="text-gray-400 text-base leading-relaxed mb-1">Grab your unique identity before someone else does.</p>
            <p className="text-gray-600 text-sm mb-9">30 seconds. No credit card. Magic link, no password to forget.</p>
            <TiltWrapper>
              <KeyStarBorder color="#FF2D87" speed="2.5s">
                <Link href="/login" className="key-btn key-pink" style={{ fontSize: "13px", padding: "12px 32px", minHeight: "42px" }}>
                  <Zap className="w-4 h-4" /> Get In Free <ArrowRight className="w-4 h-4" />
                </Link>
              </KeyStarBorder>
            </TiltWrapper>
            <p className="text-gray-800 text-[10px] font-mono mt-5 flex items-center justify-center gap-2 flex-wrap">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Free forever</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" />No data sold</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Open to everyone</span>
            </p>
          </div>
        </ElectricBorder>
      </FadeIn>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="border-t border-[#FF2D87]/8 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-700 text-[11px] font-mono">
        <Link href="/" className="text-sm font-black tracking-tight lowercase">
          <span className="lp-chrome-text text-base">zeezu</span>
        </Link>
        <p>© {new Date().getFullYear()} Zeezu. The internet, after dark.</p>
        <div className="flex gap-5">
          <Link href="/login" className="hover:text-gray-400 transition-colors">About</Link>
          <Link href="/login" className="hover:text-gray-400 transition-colors">Rules</Link>
          <Link href="/login" className="hover:text-gray-400 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

// ── Win98 cursor spark particles on click ─────────────────────────
function CursorSparks() {
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; dx: string; dy: string; color: string }[]>([]);
  const uid = useRef(0);
  useEffect(() => {
    const COLORS = ["#FFD700", "#FF2D87", "#00F7FF", "#ffffff", "#B4FF00", "#FF6B35", "#C0C0C0", "#FF007A"];
    const onDown = (e: PointerEvent) => {
      const id = ++uid.current;
      const batch = Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.63;
        const dist = 30 + Math.random() * 30;
        return {
          id: id * 100 + i,
          x: e.clientX - 3,
          y: e.clientY - 3,
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist}px`,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
      });
      setSparks(p => [...p, ...batch]);
      setTimeout(() => setSparks(p => p.filter(s => !batch.find(b => b.id === s.id))), 550);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  if (!sparks.length) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99999 }}>
      {sparks.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: s.x, top: s.y,
          width: 6, height: 6, borderRadius: 1,
          background: s.color,
          boxShadow: `0 0 5px ${s.color}, 0 0 10px ${s.color}80`,
          animation: "lp-spark 0.52s ease-out forwards",
          "--dx": s.dx, "--dy": s.dy,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard");
    });
  }, [router]);

  return (
    <div className="bg-[#0E0B0D] text-white overflow-x-hidden lp-win98-cursor">
      <CursorFX />
      <CursorSparks />
      <LandingNav />
      <HeroSection />
      <TickerStrip />
      <ManifestoSection />
      <FeaturesSection />
      <CommunitySection />
      <ShowcaseSection />
      <AntiMarketing />
      <StatsSection />
      <FAQSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
