"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ChevronRight, ChevronLeft, Check, Zap, User, Radio, Palette, Headphones, Music2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import GenBadge from "@/components/GenBadge";
import BootScreen from "@/components/BootScreen";
import { getGeneration, type GenerationMeta } from "@/lib/generation";

// ─────────────────────────────────────────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────────────────────────────────────────

const THEMES = [
  { id: "neon-void",    name: "Neon Void",   primary: "#FF2D87", secondary: "#00F7FF", bg: "#0E0B0D", accent: "#B4FF00" },
  { id: "cyber-pink",   name: "Cyber Pink",  primary: "#FF007A", secondary: "#FF6EC7", bg: "#0D0008", accent: "#00F7FF" },
  { id: "matrix-green", name: "Matrix",      primary: "#00FF41", secondary: "#008F11", bg: "#001100", accent: "#00FF41" },
  { id: "gold-chrome",  name: "Gold Chrome", primary: "#FFD700", secondary: "#FFA500", bg: "#0A0800", accent: "#FF6B00" },
  { id: "ice-blue",     name: "Ice Blue",    primary: "#00C8FF", secondary: "#7DD3FC", bg: "#000D14", accent: "#E0F7FF" },
  { id: "mono-chrome",  name: "Mono",        primary: "#FFFFFF", secondary: "#AAAAAA", bg: "#0A0A0A", accent: "#666666" },
];

const AVATAR_STYLES = [
  { style: "avataaars",  label: "Classic"  },
  { style: "adventurer", label: "Explorer" },
  { style: "bottts",     label: "Robot"    },
  { style: "lorelei",    label: "Sketch"   },
  { style: "pixel-art",  label: "Pixel"    },
  { style: "thumbs",     label: "Thumbs"   },
];

// AIM-era away message placeholders — era accurate
const AIM_PLACEHOLDERS = [
  "~*~ in my feelings ~*~",
  "away from keyboard... or am I",
  "if you're reading this, leave a message after the beep",
  "currently: avoiding responsibilities since 2003",
  "downloading: more excuses",
  "signed on at 11:47 PM",
  "brb... maybe",
  "listening to music instead of replying",
];

const STEP_META = [
  { label: "Identity", icon: User },
  { label: "Era",      icon: Radio },
  { label: "Look",     icon: Palette },
  { label: "Anthem",   icon: Headphones },
  { label: "Enter",    icon: Zap },
];

// ─────────────────────────────────────────────────────────────────────────────
//  AUDIO
// ─────────────────────────────────────────────────────────────────────────────

function playClickTone() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 800;
    g.gain.setValueAtTime(0.03, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.03);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.03);
    setTimeout(() => ctx.close(), 200);
  } catch { /* AudioContext blocked — silently ignore */ }
}

function playBadgePing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 700);
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
//  URL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}
function isSoundCloudUrl(url: string) { return /soundcloud\.com\/.+\/.+/.test(url); }
function isValidAnthemUrl(url: string) { return !!(getYouTubeId(url) || isSoundCloudUrl(url)); }

// ─────────────────────────────────────────────────────────────────────────────
//  DOB VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function validateDOB(m: string, d: string, y: string): string | null {
  const month = parseInt(m), day = parseInt(d), year = parseInt(y);
  if (!month || !day || !year) return "Please enter a complete date.";
  if (month < 1 || month > 12) return "Invalid month.";
  if (day < 1 || day > 31) return "Invalid day.";
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return "Invalid year.";
  if (currentYear - year < 13) return "You must be 13 or older to join Zeezu.";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Y2K KEYFRAMES
// ─────────────────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Orbitron:wght@700;900&family=VT323&display=swap');

  @keyframes zee-slide-up    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes zee-marquee     { 0%{transform:translateX(0)} 100%{transform:translateX(-33.333%)} }
  @keyframes zee-blink       { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes zee-twinkle     { 0%,100%{opacity:.12;transform:scale(1) rotate(0)} 50%{opacity:.55;transform:scale(1.15) rotate(18deg)} }
  @keyframes zee-online      { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes zee-glow-pulse  { 0%,100%{box-shadow:0 0 22px -4px rgba(180,255,0,.55)} 50%{box-shadow:0 0 36px -2px rgba(180,255,0,.85)} }
  @keyframes zee-anthem-pop  { from{transform:scale(0.97)} to{transform:scale(1)} }
  @keyframes spin            { to{transform:rotate(360deg)} }

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .theme-grid, .avatar-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .dob-row {
      flex-direction: column;
    }
    .card-padding {
      padding: 20px 16px 0 16px !important;
    }
    .nav-padding {
      padding: 16px !important;
    }
    .bottom-nav-btn {
      min-height: 44px !important;
      padding: 10px 16px !important;
    }
    .step-header-container {
      padding: 12px 10px !important;
    }
  }
`;

const STARS = [
  { x: "8%",  y: "7%",  s: 10, d: "0s"   },
  { x: "92%", y: "9%",  s: 9,  d: "1.1s" },
  { x: "3%",  y: "55%", s: 11, d: "0.5s" },
  { x: "97%", y: "50%", s: 8,  d: "1.8s" },
  { x: "45%", y: "96%", s: 10, d: "0.9s" },
  { x: "55%", y: "96%", s: 8,  d: "2.2s" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  GENERATION REVEAL — terminal aesthetic + badge ping sound
// ─────────────────────────────────────────────────────────────────────────────

function GenerationReveal({ gen, onDone }: { gen: GenerationMeta | null; onDone: () => void }) {
  const [lines, setLines]       = useState<string[]>([]);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setLines(["▸ SCANNING ERA DATABASE..."]), 300),
      setTimeout(() => setLines(l => [...l, "▸ CALIBRATING BIRTH SIGNAL..."]), 800),
      setTimeout(() => setLines(l => [...l, gen
        ? `▸ MATCH CONFIRMED: ${gen.label.toUpperCase()}`
        : "▸ ERA: UNCLASSIFIED"]), 1300),
      setTimeout(() => setShowBadge(true), 1600),
      setTimeout(onDone, 3400),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Badge ping sound
  useEffect(() => {
    if (showBadge) playBadgePing();
  }, [showBadge]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      {/* Terminal window */}
      <div style={{
        width: "100%", background: "#000d08",
        border: "1px solid rgba(0,255,65,.25)", borderRadius: "12px",
        padding: "16px", fontFamily: "'VT323', monospace", fontSize: "15px",
        lineHeight: "1.7", minHeight: "110px", position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,65,.025) 3px,rgba(0,255,65,.025) 4px)",
          pointerEvents: "none", borderRadius: "12px",
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid rgba(0,255,65,.12)" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f56", display: "inline-block" }} />
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27c93f", display: "inline-block" }} />
          <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(0,255,65,.4)", letterSpacing: "2px", marginLeft: "6px" }}>
            ZEEZU GENERATION SCANNER v1.0
          </span>
        </div>
        {lines.map((line, i) => (
          <motion.p key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
            style={{ color: i === lines.length - 1 ? "#00FF41" : "rgba(0,255,65,.55)", margin: 0 }}>
            {line}
          </motion.p>
        ))}
        <span style={{ color: "#00FF41", animation: "zee-blink 1s step-end infinite" }}>_</span>
      </div>

      {showBadge && (
        <motion.div initial={{ opacity: 0, scale: 0.65 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          {gen
            ? <GenBadge gen={gen} size="md" />
            : <span style={{ fontFamily: "'VT323',monospace", fontSize: "14px", color: "rgba(255,255,255,.35)" }}>No era match — badge unlocked later</span>
          }
          <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,45,135,.6)", letterSpacing: "3px" }}>
            ERA CALIBRATED ✦
          </span>
        </motion.div>
      )}

      <button onClick={onDone}
        style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.2)", letterSpacing: "1px", background: "none", border: "none", cursor: "pointer", marginTop: "4px" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.55)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.2)")}
      >
        SKIP →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP HEADER — 5-step breadcrumb
// ─────────────────────────────────────────────────────────────────────────────

function StepHeader({ step, total }: { step: number; total: number }) {
  return (
    <div className="step-header-container" style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: "0", padding: "12px 20px",
      borderBottom: "1px solid rgba(255,45,135,.15)",
      background: "rgba(0,0,0,.2)", overflowX: "auto",
    }}>
      {STEP_META.map((s, i) => {
        const done = i < step, current = i === step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
              padding: "4px 10px", borderRadius: "8px",
              background: current ? "rgba(255,45,135,.18)" : done ? "rgba(0,229,255,.07)" : "transparent",
              border: current ? "1px solid rgba(255,45,135,.45)" : done ? "1px solid rgba(0,229,255,.2)" : "1px solid transparent",
              transition: "all .3s", minWidth: "52px",
            }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center",
                color: current ? "#FF2D87" : done ? "#00E5FF" : "rgba(255,255,255,.2)" }}>
                <s.icon size={14} strokeWidth={2.5} />
              </span>
              <span style={{ fontFamily: "'VT323', monospace", fontSize: "9px", letterSpacing: "1.5px",
                color: current ? "rgba(255,45,135,.9)" : done ? "rgba(0,229,255,.7)" : "rgba(255,255,255,.18)",
                textTransform: "uppercase" }}>{s.label}</span>
            </div>
            {i < total - 1 && (
              <div style={{
                width: "16px", height: "1px",
                background: i < step ? "linear-gradient(90deg,rgba(0,229,255,.4),rgba(255,45,135,.4))" : "rgba(255,255,255,.07)",
                flexShrink: 0,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PORTAL MODULE — shared step wrapper
// ─────────────────────────────────────────────────────────────────────────────

function PortalModule({ title, subtitle, children }: {
  title: React.ReactNode; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid rgba(255,45,135,.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "3px", height: "22px", background: "linear-gradient(180deg,#FF2D87,#00E5FF)", borderRadius: "2px", flexShrink: 0 }} />
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
            {title}
          </h2>
        </div>
        {subtitle && (
          <p style={{ margin: "0 0 0 11px", fontFamily: "'Nunito',sans-serif", fontSize: "12px", color: "rgba(255,255,255,.38)", lineHeight: "1.5" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ZEE INPUT — consistent styled input
// ─────────────────────────────────────────────────────────────────────────────

function ZeeInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  const { label, hint, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label style={{ fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "2px", color: "rgba(255,45,135,.7)", textTransform: "uppercase" }}>
          {label}
        </label>
      )}
      <input {...rest}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          background: "rgba(0,0,0,.45)",
          border: `1px solid ${focused ? "rgba(255,45,135,.7)" : "rgba(255,45,135,.2)"}`,
          borderRadius: "10px", padding: "11px 14px", color: "#fff",
          fontSize: "14px", fontFamily: "'Nunito', sans-serif", outline: "none",
          boxShadow: focused ? "0 0 0 3px rgba(255,45,135,.1)" : "none",
          transition: "border-color .2s, box-shadow .2s", width: "100%",
          ...rest.style,
        }}
      />
      {hint && (
        <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(0,255,65,.5)", letterSpacing: "0.5px", margin: 0 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ANTHEM PREVIEW — embed shows on valid URL paste
// ─────────────────────────────────────────────────────────────────────────────

function AnthemPreview({ url, primary }: { url: string; primary: string }) {
  const ytId    = getYouTubeId(url);
  const isSC    = isSoundCloudUrl(url);
  const embedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3`
    : isSC
      ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=${encodeURIComponent(primary)}&auto_play=false&hide_related=true&show_comments=false&show_user=false`
      : null;

  if (!embedUrl) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      style={{
        background: `${primary}08`, border: `1px solid ${primary}30`,
        borderRadius: "10px", overflow: "hidden", marginTop: "6px",
      }}>
      <div style={{ padding: "7px 10px", display: "flex", alignItems: "center", gap: "6px", borderBottom: `1px solid ${primary}15` }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: primary, display: "inline-block", boxShadow: `0 0 6px ${primary}` }} />
        <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: `${primary}80`, letterSpacing: "2px" }}>
          ▶ YOUR ANTHEM PREVIEW — click play
        </span>
      </div>
      <iframe
        src={embedUrl}
        width="100%"
        height={ytId ? "120" : "80"}
        frameBorder={0}
        scrolling="no"
        allow="autoplay; encrypted-media"
        title="Anthem Preview"
        style={{ display: "block", border: "none" }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ZID CONNECTION REVEAL — modem-era dial-up sequence
// ─────────────────────────────────────────────────────────────────────────────

function ZidConnect({ zid, primary }: { zid: string; primary: string }) {
  const [progress,  setProgress]  = useState(0);
  const [phase,     setPhase]     = useState<"connecting" | "done">("connecting");
  const [typedZid,  setTypedZid]  = useState("");

  useEffect(() => {
    if (!zid) return;
    const start = performance.now();
    const FILL  = 1600;
    let raf: number;

    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / FILL) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase("done");
        let i = 0;
        const iv = setInterval(() => {
          i++;
          setTypedZid(zid.slice(0, i));
          if (i >= zid.length) clearInterval(iv);
        }, 60);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [zid]);

  const filledBars = Math.round((progress / 100) * 10);
  const barStr     = "█".repeat(filledBars) + "░".repeat(10 - filledBars);

  return (
    <div style={{
      fontFamily: "'VT323', monospace",
      background: "rgba(0,0,0,.55)",
      border: `1px solid ${primary}25`,
      borderRadius: "10px",
      padding: "14px 16px",
      lineHeight: "1.9",
      width: "100%",
    }}>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,.2)", letterSpacing: "2px", marginBottom: "4px" }}>
        ZEEZU NET v2.6
      </div>
      <div style={{ fontSize: "13px", color: phase === "done" ? "#00FF41" : `${primary}80` }}>
        {phase === "connecting" ? "ESTABLISHING CONNECTION..." : "CONNECTION ESTABLISHED ✓"}
      </div>
      <div style={{ fontSize: "13px", color: primary, letterSpacing: "1px", margin: "2px 0" }}>
        {barStr} {Math.round(progress)}%
      </div>
      {phase === "done" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,.18)", letterSpacing: "2px", marginTop: "8px" }}>
            YOUR ADDRESS
          </div>
          <div style={{ fontSize: "15px", color: primary, letterSpacing: "1.5px", textShadow: `0 0 8px ${primary}` }}>
            zeezu.app/u/{typedZid}
            {typedZid.length < zid.length && (
              <span style={{ animation: "zee-blink 0.6s step-end infinite" }}>_</span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROFILE CARD PREVIEW — live preview on final screen
// ─────────────────────────────────────────────────────────────────────────────

function ProfileCardPreview({ displayName, statusMessage, avatarStyle, zid, gen, theme }: {
  displayName: string; statusMessage: string; avatarStyle: string;
  zid: string; gen: GenerationMeta | null; theme: typeof THEMES[0];
}) {
  return (
    <div style={{
      background: theme.bg,
      border: `2px solid ${theme.primary}40`,
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      boxShadow: `0 0 40px -10px ${theme.primary}40`,
      width: "100%",
      maxWidth: "260px",
      margin: "0 auto",
    }}>
      <img
        src={`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${zid || "zeezu"}`}
        alt="Your avatar"
        style={{ width: "60px", height: "60px", borderRadius: "50%", border: `2px solid ${theme.primary}`, display: "block" }}
      />
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif", fontSize: "14px", fontWeight: 700,
          background: `linear-gradient(135deg,${theme.primary},${theme.secondary})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", marginBottom: "5px",
        }}>
          {displayName || "Your Name"}
        </div>
        {gen && <div style={{ marginBottom: "6px" }}><GenBadge gen={gen} size="sm" /></div>}
        {statusMessage && (
          <div style={{
            fontFamily: "'VT323', monospace", fontSize: "12px",
            color: `${theme.primary}90`, letterSpacing: "0.5px",
            background: `${theme.primary}08`,
            border: `1px solid ${theme.primary}18`,
            borderRadius: "6px",
            padding: "3px 10px",
            marginTop: "4px",
          }}>
            ► {statusMessage}
          </div>
        )}
      </div>
      <div style={{
        fontFamily: "'VT323', monospace", fontSize: "9px",
        color: `${theme.secondary}55`, letterSpacing: "1px",
        borderTop: `1px solid ${theme.primary}12`,
        paddingTop: "8px", width: "100%", textAlign: "center",
      }}>
        zeezu.app/u/{zid}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step,      setStep]      = useState(0);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const [authUser,  setAuthUser]  = useState<any>(null);
  const [userData,  setUserData]  = useState<any>(null);
  const [showBoot,  setShowBoot]  = useState(false);

  // Form state
  const [initLoading, setInitLoading] = useState(true);
  const [displayName,    setDisplayName]    = useState("");
  const [statusMessage,  setStatusMessage]  = useState("");
  const [avatarStyle,    setAvatarStyle]    = useState("avataaars");
  const [selectedTheme,  setSelectedTheme]  = useState(THEMES[0]);
  const [anthemUrl,      setAnthemUrl]      = useState("");
  const [anthemValid,    setAnthemValid]    = useState(false);

  // DOB
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay,   setBirthDay]   = useState("");
  const [birthYear,  setBirthYear]  = useState("");
  const [dobError,   setDobError]   = useState("");
  const [dobPhase,   setDobPhase]   = useState<"input" | "reveal">("input");
  const [revealedGen, setRevealedGen] = useState<GenerationMeta | null>(null);

  // AIM placeholder cycling
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Slide direction
  const [direction, setDirection] = useState(1);

  // AIM placeholder cycle
  useEffect(() => {
    const iv = setInterval(() => setPlaceholderIdx(i => (i + 1) % AIM_PLACEHOLDERS.length), 3000);
    return () => clearInterval(iv);
  }, []);

  // Anthem URL check
  useEffect(() => { setAnthemValid(isValidAnthemUrl(anthemUrl)); }, [anthemUrl]);

  // ── helper: parse DiceBear style from a stored avatar_url ──────────────
  const parseAvatarStyle = (url: string | null): string => {
    if (!url) return "avataaars";
    const m = url.match(/dicebear\.com\/7\.x\/([^/]+)\//);
    return m ? m[1] : "avataaars";
  };

  // Auth init — recovers all existing data, gates on birth_year (= badge presence)
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setAuthUser(user);

      // Fetch user row + customization + anthem in parallel
      const [{ data }, { data: customData }, { data: soundData }] = await Promise.all([
        supabase.from("users").select("*").eq("id", user.id).single(),
        supabase.from("profile_customization").select("*").eq("user_id", user.id).single(),
        supabase.from("user_sounds").select("track_url").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
      ]);

      if (data) {
        // DOB is mandatory — birth_year is the single authority for onboarding completion.
        const isDone = !!data.birth_year;
        if (isDone) { router.push("/dashboard"); return; }

        // ── Prefill everything the user already set ──────────────────────
        setUserData(data);
        setDisplayName(data.display_name     || "");
        setStatusMessage(data.status_message || "");

        // Recover avatar style by parsing the stored DiceBear URL
        if (data.avatar_url) setAvatarStyle(parseAvatarStyle(data.avatar_url));

        // Recover DOB if it was set (partial onboarding can write it)
        if (data.birth_month) setBirthMonth(String(data.birth_month));
        if (data.birth_day)   setBirthDay(String(data.birth_day));
        if (data.birth_year)  setBirthYear(String(data.birth_year));

        // Recover theme from profile_customization
        if (customData?.theme_id) {
          const match = THEMES.find(t => t.id === customData.theme_id);
          if (match) setSelectedTheme(match);
        }

        // Recover anthem
        if (soundData?.track_url) {
          setAnthemUrl(soundData.track_url);
        } else if (data.theme_track_url) {
          setAnthemUrl(data.theme_track_url);
        }
      }

      setInitLoading(false);
    }
    init();
  }, [router]);

  const totalSteps = 5;
  const nextStep   = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prevStep   = () => setStep(s => Math.max(s - 1, 0));

  const handleDOBContinue = () => {
    const error = validateDOB(birthMonth, birthDay, birthYear);
    if (error) { setDobError(error); return; }
    setDobError("");
    const gen = getGeneration(parseInt(birthYear), parseInt(birthMonth), parseInt(birthDay));
    setRevealedGen(gen);
    setDobPhase("reveal");
  };

  const handleRevealDone = useCallback(() => {
    setDobPhase("input");
    setDirection(1); nextStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handleComplete — saves everything, then fires BootScreen
  const handleComplete = useCallback(async () => {
    if (!authUser) return;
    setSaving(true);
    setSaveError("");

    const avatarUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${userData?.zid || authUser.id}`;

    // 1. Save user row
    const { error: userError } = await supabase.from("users").update({
      display_name:        displayName.trim() || userData?.display_name,
      status_message:      statusMessage.trim(),
      avatar_url:          avatarUrl,
      birth_year:          birthYear  ? parseInt(birthYear)  : null,
      birth_month:         birthMonth ? parseInt(birthMonth) : null,
      birth_day:           birthDay   ? parseInt(birthDay)   : null,
      // theme_track_url write — TODO: remove after is_anthem migration lands and AnthemWidget reads user_sounds
      theme_track_url:     anthemUrl.trim() || null,
      onboarding_complete: true,
    }).eq("id", authUser.id);

    if (userError) { setSaveError("Failed to save your profile. Please try again."); setSaving(false); return; }

    // 2. Save theme customization
    const { error: themeError } = await supabase.from("profile_customization").upsert({
      user_id:          authUser.id,
      theme_id:         selectedTheme.id,
      primary_color:    selectedTheme.primary,
      secondary_color:  selectedTheme.secondary,
      accent_color:     selectedTheme.accent,
      page_bg:          selectedTheme.bg,
      primary_muted:    selectedTheme.primary + "80",
      accent_muted:     selectedTheme.accent  + "80",
      text_color:       "#FFFFFF",
      text_secondary:   "#AAAAAA",
      text_muted:       "#666666",
      text_on_primary:  "#FFFFFF",
      card_bg:          "#111118",
      surface_border:   selectedTheme.primary + "30",
      font_family:      "Inter",
      font_body:        "Inter",
      font_mono:        "JetBrains Mono",
      font_size_scale:  1,
      heading_style:    "gradient",
      name_effect:      "gradient",
      card_style:       "glass",
      button_style:     "solid-glow",
      bg_effect:        "dots",
      card_holo_effect: "none",
      glow_intensity:   60,
      glow_enabled:     true,
      glass_blur:       12,
      glass_opacity:    70,
      shadow_strength:  1.5,
      border_radius:    "rounded",
      animation_level:  "full",
      enable_tilt:      true,
      enable_behind_glow: true,
    }, { onConflict: "user_id" });

    if (themeError) { setSaveError("Failed to save your theme. Please try again."); setSaving(false); return; }

    // 3. Save anthem to user_sounds (idempotent — delete previous, write fresh)
    // TODO: When is_anthem column is added, add WHERE is_anthem = true to the delete
    // and set is_anthem: true on insert. Remove theme_track_url write above at that point.
    if (anthemUrl.trim()) {
      await supabase.from("user_sounds").delete().eq("user_id", authUser.id);
      await supabase.from("user_sounds").insert({
        user_id:     authUser.id,
        track_url:   anthemUrl.trim(),
        track_title: "My Anthem",
        track_artist: null,
        // is_anthem: true   ← uncomment after DB migration
      });
    }

    setSaving(false);
    // Signal dashboard to skip its own BootScreen (we'll play it here)
    localStorage.setItem("zeezu_onboarding_done", "1");
    setShowBoot(true);
  }, [authUser, avatarStyle, userData, displayName, statusMessage, anthemUrl, selectedTheme, birthYear, birthMonth, birthDay]);

  const goNext = () => { playClickTone(); setDirection(1);  nextStep(); };
  const goPrev = () => {                  setDirection(-1); prevStep(); };

  const zid         = userData?.zid || "";
  const currentYear = new Date().getFullYear();
  // Hide bottom nav during generation reveal and on the final step
  const hidingNav   = (step === 1 && dobPhase === "reveal") || step === 4;

  // ── Loading state ────────────────────────────────────────────────────────
  if (!authUser || initLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080E24", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ color: "#FF2D87", animation: "spin 1s linear infinite" }} size={32} />
      </div>
    );
  }

  // ── BootScreen fires inline after completion ──────────────────────────────
  if (showBoot) {
    return (
      <BootScreen
        username={displayName || userData?.display_name}
        isFirstEver={true}
        onComplete={() => router.push(`/u/${userData?.zid || ""}`)}
      />
    );
  }

  const variants = {
    enter:  (dir: number) => ({ x: dir > 0 ?  36 : -36, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -36 :  36, opacity: 0 }),
  };

  return (
    <>
      <style>{KEYFRAMES}</style>

      <main style={{
        minHeight: "100vh",
        backgroundColor: "#080E24",
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -5%, rgba(255,45,135,.16) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 5%  90%, rgba(0,229,255,.07) 0%, transparent 55%),
          radial-gradient(ellipse 35% 25% at 95% 70%, rgba(78,205,196,.05) 0%, transparent 55%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='.8' fill='rgba(255,255,255,.04)'/%3E%3C/svg%3E")
        `,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Nunito', system-ui, sans-serif",
        padding: "24px 16px 60px 16px",
        position: "relative", overflow: "hidden",
      }}>

        {/* Stars */}
        {STARS.map((st, i) => (
          <span key={i} aria-hidden="true" style={{
            position: "absolute", left: st.x, top: st.y, fontSize: `${st.s}px`, color: "#FF2D87",
            pointerEvents: "none", userSelect: "none",
            animation: `zee-twinkle ${3.2 + i * 0.4}s ease-in-out infinite`,
            animationDelay: st.d, zIndex: 1,
          }}>✦</span>
        ))}

        {/* ═══════════════════════ PORTAL CARD ═══════════════════════ */}
        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "560px", animation: "zee-slide-up .65s cubic-bezier(.22,1,.36,1) .05s both" }}>

          {/* Outer glow border */}
          <div aria-hidden="true" style={{
            position: "absolute", inset: "-2px", borderRadius: "22px",
            background: "linear-gradient(135deg,#FF2D87 0%,#00E5FF 50%,#FF2D87 100%)",
            opacity: .45, filter: "blur(1px)", zIndex: -1,
          }} />

          <div style={{
            background: "#0E1630", borderRadius: "20px", overflow: "hidden",
            border: "1px solid rgba(255,45,135,.3)",
            boxShadow: "0 32px 90px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.035) inset",
          }}>

            {/* ── Card header ─────────────────────────────────────── */}
            <div style={{
              background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)",
              padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,.07)",
              position: "relative", overflow: "hidden",
            }}>
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.022) 3px,rgba(255,255,255,.022) 4px)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "-1px", textShadow: "0 0 18px rgba(0,229,255,.4)" }}>zeezu</span>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "#00E5FF", letterSpacing: "3px", opacity: .9 }}>PROFILE SETUP</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,45,135,.35)", borderRadius: "20px", padding: "4px 12px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF2D87", display: "inline-block", animation: "zee-online 2s ease-in-out infinite", boxShadow: "0 0 6px rgba(255,45,135,.8)" }} />
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,45,135,.9)", letterSpacing: "0.5px" }}>
                  {step + 1} / {totalSteps}
                </span>
              </div>
            </div>

            {/* ── Step breadcrumb ──────────────────────────────────── */}
            <StepHeader step={step} total={totalSteps} />

            {/* ── Step content ─────────────────────────────────────── */}
            <div style={{ padding: "26px 26px 0 26px", minHeight: "380px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step + dobPhase}
                  custom={direction}
                  variants={variants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >

                  {/* ─── STEP 0: WHO ARE YOU ─────────────────────── */}
                  {step === 0 && (
                    <PortalModule title="Who are you?" subtitle="This is front and center on your profile — changeable anytime.">
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
                        <ZeeInput
                          label="Display Name"
                          type="text"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          maxLength={32}
                          placeholder="e.g. NeonDrifter"
                        />

                        {/* AIM-style status — the personality field */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <label style={{
                              fontFamily: "'VT323',monospace", fontSize: "15px", letterSpacing: "2px",
                              color: "#FF2D87", textShadow: "0 0 8px rgba(255,45,135,.5)",
                            }}>► CURRENTLY:</label>
                            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.2)", letterSpacing: "1px" }}>(OPTIONAL)</span>
                          </div>
                          <input
                            type="text"
                            value={statusMessage}
                            onChange={e => setStatusMessage(e.target.value)}
                            maxLength={80}
                            placeholder={AIM_PLACEHOLDERS[placeholderIdx]}
                            style={{
                              background: "rgba(0,0,0,.6)",
                              border: "1px solid rgba(255,45,135,.35)",
                              borderRadius: "10px",
                              padding: "13px 16px",
                              color: "#fff",
                              fontSize: "15px",
                              fontFamily: "'VT323', monospace",
                              letterSpacing: "0.5px",
                              outline: "none",
                              width: "100%",
                              transition: "border-color .2s, box-shadow .2s",
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,45,135,.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,45,135,.1)"; }}
                            onBlur={e =>  { e.currentTarget.style.borderColor = "rgba(255,45,135,.35)"; e.currentTarget.style.boxShadow = "none"; }}
                          />
                          <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.15)", letterSpacing: "0.5px", margin: 0 }}>
                            🔒 Shows on your profile · max 80 chars
                          </p>
                        </div>
                      </div>
                    </PortalModule>
                  )}

                  {/* ─── STEP 1A: ERA — DOB input ────────────────── */}
                  {step === 1 && dobPhase === "input" && (
                    <PortalModule title="Calibrate Your Era" subtitle="Enter your birth date to unlock your Generation Badge.">
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <ZeeInput label="Month" type="number" min={1} max={12} placeholder="MM"
                              value={birthMonth} onChange={e => { setBirthMonth(e.target.value); setDobError(""); }}
                              style={{ textAlign: "center" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <ZeeInput label="Day" type="number" min={1} max={31} placeholder="DD"
                              value={birthDay} onChange={e => { setBirthDay(e.target.value); setDobError(""); }}
                              style={{ textAlign: "center" }} />
                          </div>
                          <div style={{ flex: "1.5" }}>
                            <ZeeInput label="Year" type="number" min={1900} max={currentYear} placeholder="YYYY"
                              value={birthYear} onChange={e => { setBirthYear(e.target.value); setDobError(""); }}
                              style={{ textAlign: "center" }} />
                          </div>
                        </div>
                        {dobError && (
                          <div style={{ background: "rgba(255,80,80,.08)", border: "1px solid rgba(255,80,80,.2)", borderRadius: "10px", padding: "10px 14px", fontFamily: "'VT323',monospace", fontSize: "13px", color: "#FF6B6B", letterSpacing: "0.5px" }}>
                            ⚠ {dobError}
                          </div>
                        )}
                        <div style={{ background: "rgba(255,45,135,.06)", border: "1px dashed rgba(255,45,135,.2)", borderRadius: "10px", padding: "10px 14px", fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,45,135,.5)", letterSpacing: "0.5px", lineHeight: "1.6" }}>
                          [PRIVATE] Your exact birthday is locked in the vault.<br />
                          We only use it to assign your Generation Badge.
                        </div>
                      </div>
                    </PortalModule>
                  )}

                  {/* ─── STEP 1B: Generation terminal reveal ─────── */}
                  {step === 1 && dobPhase === "reveal" && (
                    <GenerationReveal gen={revealedGen} onDone={handleRevealDone} />
                  )}

                  {/* ─── STEP 2: YOUR LOOK (Theme + Avatar merged) ── */}
                  {step === 2 && (
                    <PortalModule title="Your Look" subtitle="Theme and avatar - both changeable anytime in settings.">
                      <div style={{ display: "flex", flexDirection: "column", gap: "18px", flex: 1 }}>

                        {/* Theme grid */}
                        <div>
                          <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,45,135,.6)", letterSpacing: "2px", marginBottom: "8px" }}>THEME</div>
                          <div className="theme-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "7px" }} role="radiogroup" aria-label="Theme selection">
                            {THEMES.map(theme => {
                              const selected = selectedTheme.id === theme.id;
                              return (
                                <button key={theme.id} role="radio" aria-checked={selected}
                                  onClick={() => setSelectedTheme(theme)}
                                  style={{
                                    position: "relative", background: theme.bg,
                                    border: `2px solid ${selected ? theme.primary : "rgba(255,255,255,.08)"}`,
                                    borderRadius: "10px", padding: "10px",
                                    cursor: "pointer", textAlign: "left",
                                    transition: "border-color .2s, box-shadow .2s",
                                    boxShadow: selected ? `0 0 16px -4px ${theme.primary}70` : "none",
                                    outline: "none",
                                  }}>
                                  <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
                                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: theme.primary, display: "inline-block", boxShadow: `0 0 4px ${theme.primary}80` }} />
                                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: theme.secondary, display: "inline-block" }} />
                                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: theme.accent, display: "inline-block" }} />
                                  </div>
                                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "#fff", letterSpacing: "0.3px" }}>{theme.name}</span>
                                  {selected && (
                                    <div style={{ position: "absolute", top: "5px", right: "5px", width: "13px", height: "13px", borderRadius: "50%", background: theme.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <Check size={8} color="#fff" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Avatar grid */}
                        <div>
                          <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,45,135,.6)", letterSpacing: "2px", marginBottom: "8px" }}>AVATAR STYLE</div>
                          <div className="avatar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "7px" }} role="radiogroup" aria-label="Avatar style">
                            {AVATAR_STYLES.map(av => {
                              const url = `https://api.dicebear.com/7.x/${av.style}/svg?seed=${userData?.zid || "zeezu"}`;
                              const selected = avatarStyle === av.style;
                              return (
                                <button key={av.style} role="radio" aria-checked={selected}
                                  onClick={() => setAvatarStyle(av.style)}
                                  style={{
                                    position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                                    padding: "10px 6px", borderRadius: "10px",
                                    border: `2px solid ${selected ? "#FF2D87" : "rgba(255,255,255,.08)"}`,
                                    background: selected ? "rgba(255,45,135,.1)" : "rgba(0,0,0,.25)",
                                    cursor: "pointer",
                                    transition: "border-color .2s, background .2s, box-shadow .2s",
                                    boxShadow: selected ? "0 0 16px -4px rgba(255,45,135,.5)" : "none",
                                    outline: "none",
                                  }}>
                                  <img src={url} alt={av.label} style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(0,0,0,.3)" }} />
                                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: selected ? "#fff" : "rgba(255,255,255,.35)", letterSpacing: "1px" }}>
                                    {av.label.toUpperCase()}
                                  </span>
                                  {selected && (
                                    <div style={{ position: "absolute", top: "4px", right: "4px", width: "13px", height: "13px", borderRadius: "50%", background: "#FF2D87", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <Check size={8} color="#fff" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </PortalModule>
                  )}

                  {/* ─── STEP 3: YOUR ANTHEM ─────────────────────── */}
                  {step === 3 && (
                    <PortalModule title="Your Anthem" subtitle="The track that plays when people visit your profile.">
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                        <div style={{
                          background: "rgba(255,45,135,.04)", border: "1px dashed rgba(255,45,135,.2)",
                          borderRadius: "10px", padding: "12px 14px",
                          fontFamily: "'VT323',monospace", fontSize: "13px",
                          color: "rgba(255,255,255,.35)", lineHeight: "1.6",
                        }}>
                          Paste a YouTube or SoundCloud link.<br />
                          <span style={{ color: "rgba(255,45,135,.4)" }}>This is your first impression - it plays when someone opens your profile.</span>
                        </div>

                        <ZeeInput
                          label="Track URL"
                          type="url"
                          value={anthemUrl}
                          onChange={e => setAnthemUrl(e.target.value)}
                          placeholder="youtube.com/watch?v=... or soundcloud.com/..."
                          hint={anthemValid ? "✓ Valid track detected — click play below to confirm" : undefined}
                          style={{ fontFamily: "monospace", fontSize: "13px" }}
                        />

                        {anthemValid && <AnthemPreview url={anthemUrl} primary={selectedTheme.primary} />}

                        <button
                          onClick={() => { playClickTone(); setDirection(1); nextStep(); }}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontFamily: "'VT323',monospace", fontSize: "11px",
                            color: "rgba(255,255,255,.18)", letterSpacing: "1.5px",
                            padding: "8px 0", textAlign: "center", transition: "color .2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.18)")}
                        >
                          SKIP FOR NOW (your profile will be silent until you add one)
                        </button>
                      </div>
                    </PortalModule>
                  )}

                  {/* ─── STEP 4: ENTER ZEEZU (final) ─────────────── */}
                  {step === 4 && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
                      <div style={{ textAlign: "center" }}>
                        <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "20px", fontWeight: 900, color: "#fff", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
                          Your space is ready.
                        </h2>
                        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "13px", color: "rgba(255,255,255,.4)", margin: 0 }}>
                          Welcome to the internet you actually wanted.
                        </p>
                        {anthemValid && (
                          <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: `${selectedTheme.primary}80`, margin: "8px 0 0 0", letterSpacing: "0.5px" }}>
                            [ YOUR ANTHEM IS SET ] People will hear it when they visit your page.
                          </p>
                        )}
                      </div>

                      {/* Live profile card preview */}
                      <ProfileCardPreview
                        displayName={displayName}
                        statusMessage={statusMessage}
                        avatarStyle={avatarStyle}
                        zid={zid}
                        gen={revealedGen}
                        theme={selectedTheme}
                      />

                      {/* ZID dial-up connection reveal */}
                      <ZidConnect zid={zid} primary={selectedTheme.primary} />

                      {/* Save error */}
                      {saveError && (
                        <div style={{ background: "rgba(255,80,80,.08)", border: "1px solid rgba(255,80,80,.2)", borderRadius: "10px", padding: "10px 14px", fontFamily: "'VT323',monospace", fontSize: "13px", color: "#FF6B6B", letterSpacing: "0.5px", width: "100%" }}>
                          ⚠ {saveError}
                        </div>
                      )}

                      {/* Launch button */}
                      <button
                        onClick={handleComplete}
                        disabled={saving}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                          background: saving ? "rgba(180,255,0,.2)" : "linear-gradient(135deg,#B4FF00,#6BCB77)",
                          border: "none", borderRadius: "14px",
                          padding: "13px 32px", color: "#000",
                          fontFamily: "'Orbitron',sans-serif", fontSize: "12px", fontWeight: 900, letterSpacing: "0.5px",
                          cursor: saving ? "not-allowed" : "pointer",
                          transition: "all .2s",
                          boxShadow: saving ? "none" : "0 0 28px -4px rgba(180,255,0,.6)",
                          animation: saving ? "none" : "zee-glow-pulse 2s ease-in-out infinite",
                          opacity: saving ? .7 : 1,
                          minHeight: "48px",
                          width: "100%",
                        }}>
                        {saving
                          ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> LAUNCHING...</>
                          : <>SEE MY PROFILE <Zap size={14} /></>
                        }
                      </button>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Save error (steps 0–3) ───────────────────────────── */}
            {saveError && step !== 4 && (
              <div style={{ margin: "0 26px", background: "rgba(255,80,80,.08)", border: "1px solid rgba(255,80,80,.2)", borderRadius: "10px", padding: "10px 14px", fontFamily: "'VT323',monospace", fontSize: "13px", color: "#FF6B6B", letterSpacing: "0.5px" }}>
                ⚠ {saveError}
              </div>
            )}

            {/* ── Bottom nav bar ───────────────────────────────────── */}
            {!hidingNav && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 26px 20px 26px",
                borderTop: "1px solid rgba(255,45,135,.1)",
                marginTop: "20px",
                background: "rgba(0,0,0,.15)",
              }}>
                {/* Back */}
                <button
                  onClick={() => { if (step === 1 && dobPhase === "reveal") setDobPhase("input"); else goPrev(); }}
                  disabled={step === 0}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    background: "none", border: "none",
                    cursor: step === 0 ? "default" : "pointer",
                    color: step === 0 ? "transparent" : "rgba(255,255,255,.35)",
                    fontFamily: "'VT323',monospace", fontSize: "14px", letterSpacing: "1px",
                    transition: "color .2s", minHeight: "40px", padding: "0 8px",
                  }}
                  onMouseEnter={e => { if (step > 0) e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = step === 0 ? "transparent" : "rgba(255,255,255,.35)"; }}
                >
                  <ChevronLeft size={14} /> BACK
                </button>

                {/* Continue — context-aware across steps */}
                {step === 1 && dobPhase === "input" ? (
                  // DOB step — custom continue
                  <button
                    onClick={() => { playClickTone(); handleDOBContinue(); }}
                    disabled={!birthMonth || !birthDay || !birthYear}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      background: (!birthMonth || !birthDay || !birthYear) ? "rgba(255,45,135,.15)" : "linear-gradient(135deg,#FF2D87,#CC1870)",
                      border: "1px solid rgba(255,45,135,.4)", borderRadius: "12px", padding: "10px 22px",
                      color: (!birthMonth || !birthDay || !birthYear) ? "rgba(255,255,255,.25)" : "#fff",
                      fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px",
                      cursor: (!birthMonth || !birthDay || !birthYear) ? "not-allowed" : "pointer",
                      transition: "all .2s",
                      boxShadow: (!birthMonth || !birthDay || !birthYear) ? "none" : "0 0 18px -4px rgba(255,45,135,.5)",
                      minHeight: "42px",
                    }}>
                    CONTINUE <ChevronRight size={13} />
                  </button>
                ) : step === 3 ? (
                  // Anthem step — button transforms when URL is valid
                  <button
                    onClick={() => { playClickTone(); setDirection(1); nextStep(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      background: anthemValid
                        ? `linear-gradient(135deg,${selectedTheme.primary},${selectedTheme.secondary})`
                        : "linear-gradient(135deg,#FF2D87,#CC1870)",
                      border: `1px solid ${anthemValid ? selectedTheme.primary + "60" : "rgba(255,45,135,.4)"}`,
                      borderRadius: "12px", padding: "10px 22px",
                      color: "#fff",
                      fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px",
                      cursor: "pointer",
                      transition: "all .3s",
                      boxShadow: anthemValid
                        ? `0 0 22px -4px ${selectedTheme.primary}80`
                        : "0 0 18px -4px rgba(255,45,135,.5)",
                      minHeight: "42px",
                      animation: anthemValid ? "zee-anthem-pop 0.35s ease-out" : "none",
                    }}>
                    {anthemValid ? <><Music2 size={13} /> THIS IS MY ANTHEM</> : <>CONTINUE <ChevronRight size={13} /></>}
                  </button>
                ) : (
                  // Default continue
                  <button
                    onClick={goNext}
                    disabled={step === 0 && !displayName.trim()}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      background: (step === 0 && !displayName.trim()) ? "rgba(255,45,135,.15)" : "linear-gradient(135deg,#FF2D87,#CC1870)",
                      border: "1px solid rgba(255,45,135,.4)", borderRadius: "12px", padding: "10px 22px",
                      color: (step === 0 && !displayName.trim()) ? "rgba(255,255,255,.25)" : "#fff",
                      fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px",
                      cursor: (step === 0 && !displayName.trim()) ? "not-allowed" : "pointer",
                      transition: "all .2s",
                      boxShadow: (step === 0 && !displayName.trim()) ? "none" : "0 0 18px -4px rgba(255,45,135,.5)",
                      minHeight: "42px",
                    }}>
                    CONTINUE <ChevronRight size={13} />
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Scrolling marquee ticker */}
        <div aria-hidden="true" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: "28px",
          background: "linear-gradient(90deg,#3B0DA8 0%,#0B4B8F 50%,#3B0DA8 100%)",
          borderTop: "1px solid rgba(255,45,135,.4)",
          display: "flex", alignItems: "center", overflow: "hidden", zIndex: 20,
        }}>
          <div style={{
            display: "flex", whiteSpace: "nowrap",
            animation: "zee-marquee 32s linear infinite",
            fontFamily: "'VT323',monospace", fontSize: "13px",
            color: "rgba(255,255,255,.5)", letterSpacing: "1.5px", willChange: "transform",
          }}>
            {"✦ RECLAIM YOUR ERA · BUILD YOUR IDENTITY · FIND YOUR PEOPLE · NO ALGORITHM · JUST YOU · ZEEZU PORTAL · ".repeat(4)}
          </div>
        </div>

      </main>
    </>
  );
}