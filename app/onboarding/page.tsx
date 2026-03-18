"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ChevronRight, ChevronLeft, Check, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import GenBadge from "@/components/GenBadge";
import { getGeneration, type GenerationMeta } from "@/lib/generation";

// ─────────────────────────────────────────────────────────────────────────────
//  DATA — unchanged from original
// ─────────────────────────────────────────────────────────────────────────────

const THEMES = [
  { id: "neon-void", name: "Neon Void", primary: "#8A2EFF", secondary: "#00F7FF", bg: "#0B0B12", accent: "#B4FF00" },
  { id: "cyber-pink", name: "Cyber Pink", primary: "#FF007A", secondary: "#FF6EC7", bg: "#0D0008", accent: "#00F7FF" },
  { id: "matrix-green", name: "Matrix", primary: "#00FF41", secondary: "#008F11", bg: "#001100", accent: "#00FF41" },
  { id: "gold-chrome", name: "Gold Chrome", primary: "#FFD700", secondary: "#FFA500", bg: "#0A0800", accent: "#FF6B00" },
  { id: "ice-blue", name: "Ice Blue", primary: "#00C8FF", secondary: "#7DD3FC", bg: "#000D14", accent: "#E0F7FF" },
  { id: "mono-chrome", name: "Monochrome", primary: "#FFFFFF", secondary: "#AAAAAA", bg: "#0A0A0A", accent: "#666666" },
];

const AVATAR_STYLES = [
  { style: "avataaars", label: "Classic" },
  { style: "adventurer", label: "Explorer" },
  { style: "bottts", label: "Robot" },
  { style: "lorelei", label: "Sketch" },
  { style: "pixel-art", label: "Pixel" },
  { style: "thumbs", label: "Thumbs" },
];

const INTERESTS = [
  "🎵 Music", "💻 Dev", "🎮 Gaming", "🎨 Art", "📸 Photos",
  "🎬 Film", "📚 Books", "🏋️ Fitness", "🌿 Nature", "✈️ Travel",
  "🍕 Food", "🔬 Science", "🧠 Philosophy", "🎭 Culture", "🎧 Beats",
];

// Step metadata for the header breadcrumb
const STEP_META = [
  { label: "Identity", icon: "✦" },
  { label: "Era", icon: "📡" },
  { label: "ZID", icon: "🔑" },
  { label: "Theme", icon: "🎨" },
  { label: "Avatar", icon: "👤" },
  { label: "Interests", icon: "⚡" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Y2K KEYFRAMES — injected once
// ─────────────────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Orbitron:wght@700;900&family=VT323&display=swap');

  @keyframes zee-slide-up  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes zee-marquee   { 0%{transform:translateX(0)} 100%{transform:translateX(-33.333%)} }
  @keyframes zee-blink     { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes zee-pulse-dot { 0%{box-shadow:0 0 0 0 rgba(138,46,255,.5)} 70%{box-shadow:0 0 0 8px rgba(138,46,255,0)} 100%{box-shadow:0 0 0 0 rgba(138,46,255,0)} }
  @keyframes zee-twinkle   { 0%,100%{opacity:.12;transform:scale(1) rotate(0)} 50%{opacity:.55;transform:scale(1.15) rotate(18deg)} }
  @keyframes zee-scan      {
    0%   { background-position: 0 -100%; }
    100% { background-position: 0 100%;  }
  }
  @keyframes zee-badge-pop { from{opacity:0;transform:scale(.65)} to{opacity:1;transform:scale(1)} }
  @keyframes zee-online    { 0%,100%{opacity:1} 50%{opacity:.3} }
`;

// Scattered background stars (same as login)
const STARS = [
  { x: "8%", y: "7%", s: 10, d: "0s" },
  { x: "92%", y: "9%", s: 9, d: "1.1s" },
  { x: "3%", y: "55%", s: 11, d: "0.5s" },
  { x: "97%", y: "50%", s: 8, d: "1.8s" },
  { x: "45%", y: "96%", s: 10, d: "0.9s" },
  { x: "55%", y: "96%", s: 8, d: "2.2s" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  DOB VALIDATION — unchanged
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
//  GENERATION REVEAL — Y2K terminal aesthetic, logic unchanged
// ─────────────────────────────────────────────────────────────────────────────

function GenerationReveal({ gen, onDone }: { gen: GenerationMeta | null; onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      {/* Terminal window */}
      <div
        style={{
          width: "100%",
          background: "#000d08",
          border: "1px solid rgba(0,255,65,.25)",
          borderRadius: "12px",
          padding: "16px",
          fontFamily: "'VT323', monospace",
          fontSize: "15px",
          lineHeight: "1.7",
          minHeight: "110px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Scanline overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,65,.025) 3px,rgba(0,255,65,.025) 4px)",
            pointerEvents: "none",
            borderRadius: "12px",
          }}
        />
        {/* Terminal header bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid rgba(0,255,65,.12)" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f56", display: "inline-block" }} />
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27c93f", display: "inline-block" }} />
          <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(0,255,65,.4)", letterSpacing: "2px", marginLeft: "6px" }}>
            ZEEZU GENERATION SCANNER v1.0
          </span>
        </div>

        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ color: i === lines.length - 1 ? "#00FF41" : "rgba(0,255,65,.55)", margin: 0 }}
          >
            {line}
          </motion.p>
        ))}
        <span style={{ color: "#00FF41", animation: "zee-blink 1s step-end infinite" }}>_</span>
      </div>

      {showBadge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}
        >
          {gen
            ? <GenBadge gen={gen} size="md" />
            : <span style={{ fontFamily: "'VT323',monospace", fontSize: "14px", color: "rgba(255,255,255,.35)" }}>No era match — badge unlocked later</span>
          }
          <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(138,46,255,.6)", letterSpacing: "3px" }}>
            ERA CALIBRATED ✦
          </span>
        </motion.div>
      )}

      <button
        onClick={onDone}
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
//  Y2K PORTAL STEP HEADER — numbered steps strip
// ─────────────────────────────────────────────────────────────────────────────

function StepHeader({ step, total }: { step: number; total: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0",
        padding: "12px 20px",
        borderBottom: "1px solid rgba(138,46,255,.15)",
        background: "rgba(0,0,0,.2)",
        overflowX: "auto",
        msOverflowStyle: "none",
      }}
    >
      {STEP_META.map((s, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {/* Step pill */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                padding: "4px 10px",
                borderRadius: "8px",
                background: current
                  ? "rgba(138,46,255,.18)"
                  : done
                    ? "rgba(0,229,255,.07)"
                    : "transparent",
                border: current
                  ? "1px solid rgba(138,46,255,.45)"
                  : done
                    ? "1px solid rgba(0,229,255,.2)"
                    : "1px solid transparent",
                transition: "all .3s",
                minWidth: "52px",
              }}
            >
              <span style={{
                fontFamily: "'VT323', monospace",
                fontSize: "13px",
                lineHeight: "1",
                color: current ? "#8A2EFF" : done ? "#00E5FF" : "rgba(255,255,255,.2)",
              }}>
                {s.icon}
              </span>
              <span style={{
                fontFamily: "'VT323', monospace",
                fontSize: "9px",
                letterSpacing: "1.5px",
                color: current ? "rgba(138,46,255,.9)" : done ? "rgba(0,229,255,.7)" : "rgba(255,255,255,.18)",
                textTransform: "uppercase",
              }}>
                {s.label}
              </span>
            </div>

            {/* Connector line between steps */}
            {i < total - 1 && (
              <div
                style={{
                  width: "16px",
                  height: "1px",
                  background: i < step
                    ? "linear-gradient(90deg,rgba(0,229,255,.4),rgba(138,46,255,.4))"
                    : "rgba(255,255,255,.07)",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED WIDGET WRAPPER — gives each step a portal-module look
// ─────────────────────────────────────────────────────────────────────────────

function PortalModule({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Module header strip */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          marginBottom: "20px",
          paddingBottom: "14px",
          borderBottom: "1px solid rgba(138,46,255,.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "3px", height: "22px", background: "linear-gradient(180deg,#8A2EFF,#00E5FF)", borderRadius: "2px", flexShrink: 0 }} />
          <h2 style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "18px",
            fontWeight: "700",
            color: "#fff",
            margin: 0,
            letterSpacing: "-0.5px",
          }}>
            {title}
          </h2>
        </div>
        {subtitle && (
          <p style={{ margin: "0 0 0 11px", fontFamily: "'Nunito',sans-serif", fontSize: "12px", color: "rgba(255,255,255,.38)", lineHeight: "1.5" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ZEE INPUT — styled consistently
// ─────────────────────────────────────────────────────────────────────────────

function ZeeInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  const { label, hint, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label style={{ fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "2px", color: "rgba(138,46,255,.7)", textTransform: "uppercase" }}>
          {label}
        </label>
      )}
      <input
        {...rest}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          background: "rgba(0,0,0,.45)",
          border: `1px solid ${focused ? "rgba(138,46,255,.7)" : "rgba(138,46,255,.2)"}`,
          borderRadius: "10px",
          padding: "11px 14px",
          color: "#fff",
          fontSize: "14px",
          fontFamily: "'Nunito', sans-serif",
          outline: "none",
          boxShadow: focused ? "0 0 0 3px rgba(138,46,255,.1)" : "none",
          transition: "border-color .2s, box-shadow .2s",
          width: "100%",
          ...rest.style,
        }}
      />
      {hint && (
        <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.18)", letterSpacing: "0.5px", margin: 0 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [authUser, setAuthUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("avataaars");
  const [interests, setInterests] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);

  // DOB
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [dobError, setDobError] = useState("");
  const [dobPhase, setDobPhase] = useState<"input" | "reveal">("input");
  const [revealedGen, setRevealedGen] = useState<GenerationMeta | null>(null);

  // Slide direction
  const [direction, setDirection] = useState(1);

  // ── Auth init — unchanged ────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setAuthUser(user);
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (data) {
        if (data.avatar_url) { router.push("/dashboard"); return; }
        setUserData(data);
        setDisplayName(data.display_name || "");
      }
    }
    init();
  }, [router]);

  const totalSteps = 6;
  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const toggleInterest = (item: string) => {
    setInterests(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : prev.length < 5 ? [...prev, item] : prev
    );
  };

  // DOB handlers — unchanged
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

  // Complete — unchanged
  const handleComplete = useCallback(async () => {
    if (!authUser) return;
    setSaving(true);
    setSaveError("");

    const avatarUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${userData?.zid || authUser.id}`;
    const { error: userError } = await supabase.from("users").update({
      display_name: displayName.trim() || userData?.display_name,
      status_message: statusMessage.trim(),
      avatar_url: avatarUrl,
      interests: interests.join(", "),
      birth_year: birthYear ? parseInt(birthYear) : null,
      birth_month: birthMonth ? parseInt(birthMonth) : null,
      birth_day: birthDay ? parseInt(birthDay) : null,
    }).eq("id", authUser.id);

    if (userError) { setSaveError("Failed to save your profile. Please try again."); setSaving(false); return; }

    const { error: themeError } = await supabase.from("profile_customization").upsert({
      user_id: authUser.id,
      theme_id: selectedTheme.id,
      primary_color: selectedTheme.primary,
      secondary_color: selectedTheme.secondary,
      accent_color: selectedTheme.accent,
      page_bg: selectedTheme.bg,
      primary_muted: selectedTheme.primary + "80",
      accent_muted: selectedTheme.accent + "80",
      text_color: "#FFFFFF",
      text_secondary: "#AAAAAA",
      text_muted: "#666666",
      text_on_primary: "#FFFFFF",
      card_bg: "#111118",
      surface_border: selectedTheme.primary + "30",
      font_family: "Inter",
      font_body: "Inter",
      font_mono: "JetBrains Mono",
      font_size_scale: 1,
      heading_style: "gradient",
      name_effect: "gradient",
      card_style: "glass",
      button_style: "solid-glow",
      bg_effect: "dots",
      card_holo_effect: "none",
      glow_intensity: 60,
      glow_enabled: true,
      glass_blur: 12,
      glass_opacity: 70,
      shadow_strength: 1.5,
      border_radius: "rounded",
      animation_level: "full",
      enable_tilt: true,
      enable_behind_glow: true,
    }, { onConflict: "user_id" });

    if (themeError) { setSaveError("Failed to save your theme. Please try again."); setSaving(false); return; }

    setSaving(false);
    localStorage.setItem("zeezu_fresh_login", "1");
    router.push("/dashboard");
  }, [authUser, avatarStyle, userData, displayName, statusMessage, interests, selectedTheme, birthYear, birthMonth, birthDay, router]);

  const goNext = () => { setDirection(1); nextStep(); };
  const goPrev = () => { setDirection(-1); prevStep(); };

  const zid = userData?.zid || "z.loading...";
  const currentYear = new Date().getFullYear();
  const hidingNav = step === 1 && dobPhase === "reveal";

  if (!authUser) {
    return (
      <div style={{ minHeight: "100vh", background: "#080E24", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ color: "#8A2EFF", animation: "spin 1s linear infinite" }} size={32} />
      </div>
    );
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 36 : -36, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -36 : 36, opacity: 0 }),
  };

  return (
    <>
      <style>{KEYFRAMES}</style>

      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#080E24",
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -5%, rgba(138,46,255,.16) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 5%  90%, rgba(0,229,255,.07) 0%, transparent 55%),
            radial-gradient(ellipse 35% 25% at 95% 70%, rgba(78,205,196,.05) 0%, transparent 55%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='.8' fill='rgba(255,255,255,.04)'/%3E%3C/svg%3E")
          `,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Nunito', system-ui, sans-serif",
          padding: "24px 16px 60px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Stars ─────────────────────────────────────────────────────── */}
        {STARS.map((st, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: st.x,
              top: st.y,
              fontSize: `${st.s}px`,
              color: "#8A2EFF",
              pointerEvents: "none",
              userSelect: "none",
              animation: `zee-twinkle ${3.2 + i * 0.4}s ease-in-out infinite`,
              animationDelay: st.d,
              zIndex: 1,
            }}
          >
            ✦
          </span>
        ))}

        {/* ══════════════════════════════════════════════════════════════════
            PORTAL CARD
        ══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: "560px",
            animation: "zee-slide-up .65s cubic-bezier(.22,1,.36,1) .05s both",
          }}
        >
          {/* Outer glow border */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-2px",
              borderRadius: "22px",
              background: "linear-gradient(135deg,#8A2EFF 0%,#00E5FF 50%,#8A2EFF 100%)",
              opacity: .45,
              filter: "blur(1px)",
              zIndex: -1,
            }}
          />

          <div
            style={{
              background: "#0E1630",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(138,46,255,.3)",
              boxShadow: "0 32px 90px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.035) inset",
            }}
          >

            {/* ── CARD HEADER — portal header bar ─────────────────────── */}
            <div
              style={{
                background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)",
                padding: "14px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,.07)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Scanline texture on header */}
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.022) 3px,rgba(255,255,255,.022) 4px)", pointerEvents: "none" }} />

              {/* Logo */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "-1px", textShadow: "0 0 18px rgba(0,229,255,.4)" }}>
                  zeezu
                </span>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "#00E5FF", letterSpacing: "3px", opacity: .9 }}>
                  PROFILE SETUP
                </span>
              </div>

              {/* Progress counter */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(0,0,0,.3)",
                  border: "1px solid rgba(138,46,255,.35)",
                  borderRadius: "20px",
                  padding: "4px 12px",
                }}
              >
                <span
                  style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#8A2EFF", display: "inline-block",
                    animation: "zee-online 2s ease-in-out infinite",
                    boxShadow: "0 0 6px rgba(138,46,255,.8)",
                  }}
                />
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(138,46,255,.9)", letterSpacing: "0.5px" }}>
                  {step + 1} / {totalSteps}
                </span>
              </div>
            </div>

            {/* ── STEP BREADCRUMB NAV ──────────────────────────────────── */}
            <StepHeader step={step} total={totalSteps} />

            {/* ── STEP CONTENT ─────────────────────────────────────────── */}
            <div
              style={{
                padding: "26px 26px 0 26px",
                minHeight: "380px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step + dobPhase}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >

                  {/* ──────────────────────────────────────────────────────
                      STEP 0: Identity
                  ────────────────────────────────────────────────────── */}
                  {step === 0 && (
                    <PortalModule
                      title="Who are you?"
                      subtitle="Your display name and status message — both editable anytime."
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                        <ZeeInput
                          label="Display Name"
                          type="text"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          maxLength={32}
                          placeholder="e.g. NeonDrifter"
                        />
                        <ZeeInput
                          label="Status Message (optional)"
                          type="text"
                          value={statusMessage}
                          onChange={e => setStatusMessage(e.target.value)}
                          maxLength={80}
                          placeholder="vibing in the void..."
                          hint="🔒 Shows on your profile · max 80 chars"
                        />
                      </div>
                    </PortalModule>
                  )}

                  {/* ──────────────────────────────────────────────────────
                      STEP 1A: DOB input
                  ────────────────────────────────────────────────────── */}
                  {step === 1 && dobPhase === "input" && (
                    <PortalModule
                      title="Calibrate Your Era"
                      subtitle="Enter your birth date to unlock your Generation Badge."
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <ZeeInput
                              label="Month"
                              type="number" min={1} max={12}
                              placeholder="MM"
                              value={birthMonth}
                              onChange={e => { setBirthMonth(e.target.value); setDobError(""); }}
                              style={{ textAlign: "center" }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <ZeeInput
                              label="Day"
                              type="number" min={1} max={31}
                              placeholder="DD"
                              value={birthDay}
                              onChange={e => { setBirthDay(e.target.value); setDobError(""); }}
                              style={{ textAlign: "center" }}
                            />
                          </div>
                          <div style={{ flex: "1.5" }}>
                            <ZeeInput
                              label="Year"
                              type="number" min={1900} max={currentYear}
                              placeholder="YYYY"
                              value={birthYear}
                              onChange={e => { setBirthYear(e.target.value); setDobError(""); }}
                              style={{ textAlign: "center" }}
                            />
                          </div>
                        </div>

                        {dobError && (
                          <div style={{ background: "rgba(255,80,80,.08)", border: "1px solid rgba(255,80,80,.2)", borderRadius: "10px", padding: "10px 14px", fontFamily: "'VT323',monospace", fontSize: "13px", color: "#FF6B6B", letterSpacing: "0.5px" }}>
                            ⚠ {dobError}
                          </div>
                        )}

                        <div
                          style={{
                            background: "rgba(138,46,255,.06)",
                            border: "1px dashed rgba(138,46,255,.2)",
                            borderRadius: "10px",
                            padding: "10px 14px",
                            fontFamily: "'VT323',monospace",
                            fontSize: "12px",
                            color: "rgba(138,46,255,.5)",
                            letterSpacing: "0.5px",
                            lineHeight: "1.6",
                          }}
                        >
                          🔒 Your exact birthday is locked in the vault.<br />
                          We only use it to assign your Generation Badge.
                        </div>
                      </div>
                    </PortalModule>
                  )}

                  {/* ──────────────────────────────────────────────────────
                      STEP 1B: Terminal reveal
                  ────────────────────────────────────────────────────── */}
                  {step === 1 && dobPhase === "reveal" && (
                    <GenerationReveal gen={revealedGen} onDone={handleRevealDone} />
                  )}

                  {/* ──────────────────────────────────────────────────────
                      STEP 2: ZID
                  ────────────────────────────────────────────────────── */}
                  {step === 2 && (
                    <PortalModule
                      title="Your Internet Address"
                      subtitle="Your ZID — a permanent unique handle that links to your profile."
                    >
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
                        {/* ZID card */}
                        <div
                          style={{
                            background: "rgba(0,0,0,.5)",
                            border: "1px solid rgba(138,46,255,.4)",
                            borderRadius: "16px",
                            padding: "24px 32px",
                            textAlign: "center",
                            boxShadow: "0 0 40px -10px rgba(138,46,255,.35)",
                            width: "100%",
                          }}
                        >
                          <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(138,46,255,.6)", letterSpacing: "3px", marginBottom: "12px" }}>
                            YOUR ZID
                          </p>
                          <p
                            style={{
                              fontFamily: "'Orbitron',sans-serif",
                              fontSize: "28px",
                              fontWeight: 900,
                              background: "linear-gradient(135deg,#8A2EFF,#00E5FF)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                              margin: 0,
                              letterSpacing: "-1px",
                            }}
                          >
                            {zid}
                          </p>
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "10px",
                              fontFamily: "'VT323',monospace",
                              fontSize: "11px",
                              color: "rgba(255,255,255,.25)",
                              background: "rgba(255,255,255,.06)",
                              padding: "3px 12px",
                              borderRadius: "20px",
                              letterSpacing: "0.5px",
                            }}
                          >
                            zeezu.app/u/{zid}
                          </span>
                        </div>
                        <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.25)", textAlign: "center", letterSpacing: "0.5px", maxWidth: "300px", lineHeight: "1.6" }}>
                          ZIDs are auto-generated and permanent.<br />
                          Think of it as your internet license plate.
                        </p>
                      </div>
                    </PortalModule>
                  )}

                  {/* ──────────────────────────────────────────────────────
                      STEP 3: Theme
                  ────────────────────────────────────────────────────── */}
                  {step === 3 && (
                    <PortalModule
                      title="Choose Your Theme"
                      subtitle="Styles your public profile. Change it any time in settings."
                    >
                      <div style={{ display: "flex", gap: "16px", flex: 1 }}>
                        {/* Theme grid */}
                        <div
                          style={{
                            flex: 1,
                            display: "grid",
                            gridTemplateColumns: "repeat(2,1fr)",
                            gap: "10px",
                            alignContent: "start",
                          }}
                          role="radiogroup" aria-label="Theme selection"
                        >
                          {THEMES.map(theme => {
                            const selected = selectedTheme.id === theme.id;
                            return (
                              <button
                                key={theme.id}
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setSelectedTheme(theme)}
                                style={{
                                  position: "relative",
                                  background: theme.bg,
                                  border: `2px solid ${selected ? theme.primary : "rgba(255,255,255,.08)"}`,
                                  borderRadius: "12px",
                                  padding: "12px",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  transition: "border-color .2s, box-shadow .2s",
                                  boxShadow: selected ? `0 0 18px -4px ${theme.primary}70` : "none",
                                  outline: "none",
                                }}
                              >
                                <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
                                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: theme.primary, display: "inline-block", boxShadow: `0 0 6px ${theme.primary}80` }} />
                                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: theme.secondary, display: "inline-block" }} />
                                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: theme.accent, display: "inline-block" }} />
                                </div>
                                <span style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "#fff", letterSpacing: "0.5px" }}>
                                  {theme.name}
                                </span>
                                {selected && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "7px",
                                      right: "7px",
                                      width: "16px",
                                      height: "16px",
                                      borderRadius: "50%",
                                      background: theme.primary,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Check size={10} color="#fff" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Live preview panel — desktop */}
                        <div style={{ width: "150px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div
                            style={{
                              background: selectedTheme.bg,
                              border: `2px solid ${selectedTheme.primary}55`,
                              borderRadius: "14px",
                              padding: "14px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <img
                              src={`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${userData?.zid || "zeezu"}`}
                              alt="avatar preview"
                              style={{ width: "52px", height: "52px", borderRadius: "50%", border: `2px solid ${selectedTheme.primary}` }}
                            />
                            <div style={{ textAlign: "center" }}>
                              <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "12px", color: "#fff", margin: 0 }}>
                                {displayName || "Your Name"}
                              </p>
                              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "10px", color: "rgba(255,255,255,.35)", fontStyle: "italic", margin: "3px 0 0 0" }}>
                                &ldquo;{statusMessage || "status..."}&rdquo;
                              </p>
                            </div>
                            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${selectedTheme.primary}bb`, letterSpacing: "1px" }}>
                              {selectedTheme.name}
                            </span>
                          </div>
                          <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.2)", textAlign: "center", letterSpacing: "0.5px" }}>
                            LIVE PREVIEW
                          </p>
                        </div>
                      </div>
                    </PortalModule>
                  )}

                  {/* ──────────────────────────────────────────────────────
                      STEP 4: Avatar
                  ────────────────────────────────────────────────────── */}
                  {step === 4 && (
                    <PortalModule
                      title="Pick Your Avatar"
                      subtitle="Your ZID seed generates your unique look across every style."
                    >
                      <div
                        style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", flex: 1, alignContent: "start" }}
                        role="radiogroup" aria-label="Avatar style"
                      >
                        {AVATAR_STYLES.map(av => {
                          const url = `https://api.dicebear.com/7.x/${av.style}/svg?seed=${userData?.zid || "zeezu"}`;
                          const selected = avatarStyle === av.style;
                          return (
                            <button
                              key={av.style}
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setAvatarStyle(av.style)}
                              style={{
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                padding: "14px 8px",
                                borderRadius: "14px",
                                border: `2px solid ${selected ? "#8A2EFF" : "rgba(255,255,255,.08)"}`,
                                background: selected ? "rgba(138,46,255,.1)" : "rgba(0,0,0,.25)",
                                cursor: "pointer",
                                transition: "border-color .2s, background .2s, box-shadow .2s",
                                boxShadow: selected ? "0 0 18px -4px rgba(138,46,255,.5)" : "none",
                                outline: "none",
                              }}
                            >
                              <img
                                src={url}
                                alt={av.label}
                                style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(0,0,0,.3)" }}
                              />
                              <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: selected ? "#fff" : "rgba(255,255,255,.35)", letterSpacing: "1px" }}>
                                {av.label.toUpperCase()}
                              </span>
                              {selected && (
                                <div style={{ position: "absolute", top: "7px", right: "7px", width: "16px", height: "16px", borderRadius: "50%", background: "#8A2EFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Check size={10} color="#fff" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </PortalModule>
                  )}

                  {/* ──────────────────────────────────────────────────────
                      STEP 5: Interests
                  ────────────────────────────────────────────────────── */}
                  {step === 5 && (
                    <PortalModule
                      title="What Are You Into?"
                      subtitle="Pick up to 5 interests — they show on your public profile."
                    >
                      {/* Selection counter */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                        <div style={{ display: "flex", gap: "5px" }}>
                          {[0, 1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              style={{
                                width: "18px",
                                height: "5px",
                                borderRadius: "3px",
                                background: i < interests.length ? "linear-gradient(90deg,#8A2EFF,#00E5FF)" : "rgba(255,255,255,.08)",
                                transition: "background .25s",
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.25)", letterSpacing: "1px" }}>
                          {interests.length}/5 SELECTED
                        </span>
                      </div>

                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: "8px", flex: 1, alignContent: "start" }}
                        role="group" aria-label="Interests"
                      >
                        {INTERESTS.map(item => {
                          const selected = interests.includes(item);
                          const maxed = interests.length >= 5 && !selected;
                          return (
                            <button
                              key={item}
                              role="checkbox"
                              aria-checked={selected}
                              disabled={maxed}
                              onClick={() => toggleInterest(item)}
                              style={{
                                padding: "8px 14px",
                                borderRadius: "20px",
                                border: `1px solid ${selected ? "#8A2EFF" : "rgba(255,255,255,.1)"}`,
                                background: selected
                                  ? "rgba(138,46,255,.2)"
                                  : maxed
                                    ? "transparent"
                                    : "rgba(255,255,255,.03)",
                                color: selected
                                  ? "#fff"
                                  : maxed
                                    ? "rgba(255,255,255,.18)"
                                    : "rgba(255,255,255,.55)",
                                fontFamily: "'Nunito',sans-serif",
                                fontSize: "13px",
                                fontWeight: selected ? 700 : 600,
                                cursor: maxed ? "not-allowed" : "pointer",
                                transition: "all .18s",
                                boxShadow: selected ? "0 0 12px -4px rgba(138,46,255,.6)" : "none",
                                outline: "none",
                                minHeight: "40px",
                              }}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </PortalModule>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── SAVE ERROR ────────────────────────────────────────────── */}
            {saveError && (
              <div style={{ margin: "0 26px 0 26px", background: "rgba(255,80,80,.08)", border: "1px solid rgba(255,80,80,.2)", borderRadius: "10px", padding: "10px 14px", fontFamily: "'VT323',monospace", fontSize: "13px", color: "#FF6B6B", letterSpacing: "0.5px" }}>
                ⚠ {saveError}
              </div>
            )}

            {/* ── BOTTOM NAV BAR ────────────────────────────────────────── */}
            {!hidingNav && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 26px 20px 26px",
                  borderTop: "1px solid rgba(138,46,255,.1)",
                  marginTop: "20px",
                  background: "rgba(0,0,0,.15)",
                }}
              >
                {/* Back */}
                <button
                  onClick={() => {
                    if (step === 1 && dobPhase === "reveal") setDobPhase("input");
                    else goPrev();
                  }}
                  disabled={step === 0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "none",
                    border: "none",
                    cursor: step === 0 ? "default" : "pointer",
                    color: step === 0 ? "transparent" : "rgba(255,255,255,.35)",
                    fontFamily: "'VT323',monospace",
                    fontSize: "14px",
                    letterSpacing: "1px",
                    transition: "color .2s",
                    minHeight: "40px",
                    padding: "0 8px",
                  }}
                  onMouseEnter={e => { if (step > 0) e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = step === 0 ? "transparent" : "rgba(255,255,255,.35)"; }}
                >
                  <ChevronLeft size={14} />
                  BACK
                </button>

                {/* Continue / Complete */}
                {step < totalSteps - 1 ? (
                  step === 1 ? (
                    // DOB step — custom continue
                    <button
                      onClick={handleDOBContinue}
                      disabled={!birthMonth || !birthDay || !birthYear}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: (!birthMonth || !birthDay || !birthYear)
                          ? "rgba(138,46,255,.15)"
                          : "linear-gradient(135deg,#8A2EFF,#6010D4)",
                        border: "1px solid rgba(138,46,255,.4)",
                        borderRadius: "12px",
                        padding: "10px 22px",
                        color: (!birthMonth || !birthDay || !birthYear) ? "rgba(255,255,255,.25)" : "#fff",
                        fontFamily: "'Orbitron',sans-serif",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        cursor: (!birthMonth || !birthDay || !birthYear) ? "not-allowed" : "pointer",
                        transition: "all .2s",
                        boxShadow: (!birthMonth || !birthDay || !birthYear) ? "none" : "0 0 18px -4px rgba(138,46,255,.5)",
                        minHeight: "42px",
                      }}
                    >
                      CONTINUE
                      <ChevronRight size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={goNext}
                      disabled={step === 0 && !displayName.trim()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: (step === 0 && !displayName.trim())
                          ? "rgba(138,46,255,.15)"
                          : "linear-gradient(135deg,#8A2EFF,#6010D4)",
                        border: "1px solid rgba(138,46,255,.4)",
                        borderRadius: "12px",
                        padding: "10px 22px",
                        color: (step === 0 && !displayName.trim()) ? "rgba(255,255,255,.25)" : "#fff",
                        fontFamily: "'Orbitron',sans-serif",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        cursor: (step === 0 && !displayName.trim()) ? "not-allowed" : "pointer",
                        transition: "all .2s",
                        boxShadow: (step === 0 && !displayName.trim()) ? "none" : "0 0 18px -4px rgba(138,46,255,.5)",
                        minHeight: "42px",
                      }}
                    >
                      CONTINUE
                      <ChevronRight size={13} />
                    </button>
                  )
                ) : (
                  // Final step — Enter Zeezu
                  <button
                    onClick={handleComplete}
                    disabled={saving}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "linear-gradient(135deg,#B4FF00,#6BCB77)",
                      border: "none",
                      borderRadius: "12px",
                      padding: "11px 24px",
                      color: "#000",
                      fontFamily: "'Orbitron',sans-serif",
                      fontSize: "11px",
                      fontWeight: 900,
                      letterSpacing: "0.5px",
                      cursor: saving ? "not-allowed" : "pointer",
                      transition: "all .2s",
                      boxShadow: "0 0 24px -4px rgba(180,255,0,.5)",
                      minHeight: "42px",
                      opacity: saving ? .7 : 1,
                    }}
                  >
                    {saving
                      ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      : <>ENTER ZEEZU <Zap size={13} /></>
                    }
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SCROLLING MARQUEE TICKER
        ══════════════════════════════════════════════════════════════════ */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "28px",
            background: "linear-gradient(90deg,#3B0DA8 0%,#0B4B8F 50%,#3B0DA8 100%)",
            borderTop: "1px solid rgba(138,46,255,.4)",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              whiteSpace: "nowrap",
              animation: "zee-marquee 32s linear infinite",
              fontFamily: "'VT323',monospace",
              fontSize: "13px",
              color: "rgba(255,255,255,.5)",
              letterSpacing: "1.5px",
              willChange: "transform",
            }}
          >
            {"✦ SET UP YOUR PROFILE · BUILD YOUR IDENTITY · FIND YOUR PEOPLE · NO ALGORITHM · JUST YOU · ZEEZU PORTAL · ".repeat(4)}
          </div>
        </div>

      </main>
    </>
  );
}