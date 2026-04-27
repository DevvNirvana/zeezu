"use client";
import { useState } from "react";
import Link from "next/link";
import { getGeneration } from "@/lib/generation";
import { getGenAuraStyle } from "@/lib/genRingConfig";

const STYLE_ID = "gen-aura-premium";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    /* ── Seamless Conic Spins for Premium Rings ── */
    @keyframes gen-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    
    .gen-ring-mil {
      background: conic-gradient(from 0deg, #ff0080, #ff8c00, #ffd700, #00ff88, #00cfff, #a855f7, #ff0080);
      animation: gen-spin 4s linear infinite;
    }
    .gen-ring-zil {
      background: conic-gradient(from 0deg, #7C3AED, #EC4899, #67E8F9, #7C3AED);
      animation: gen-spin 6s linear infinite;
    }
    .gen-ring-alpha {
      background: conic-gradient(from 0deg, #C084FC, #A78BFA, #E879F9, #C084FC);
      animation: gen-spin 4s ease-in-out infinite alternate;
    }

    /* ── Holographic Text Fills for Tabs ── */
    @keyframes gen-icon-shift { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
    .gen-icon-mil {
      background: linear-gradient(90deg, #ff0080, #ff8c00, #ffd700, #00ff88, #00cfff, #a855f7, #ff0080) !important;
      background-size: 300% 100% !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      animation: gen-icon-shift 3s linear infinite;
    }
    .gen-icon-zil {
      background: linear-gradient(90deg, #7C3AED, #EC4899, #4F46E5, #67E8F9, #7C3AED) !important;
      background-size: 300% 100% !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      animation: gen-icon-shift 5s ease-in-out infinite;
    }
    .gen-icon-alpha {
      background: linear-gradient(90deg, #C084FC, #A78BFA, #E879F9, #C084FC) !important;
      background-size: 300% 100% !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      animation: gen-icon-shift 3s linear infinite;
    }

    /* ── Hover Interaction ── */
    @keyframes gen-hover-glow {
      0% { filter: brightness(1) drop-shadow(0 0 0 rgba(255,255,255,0)); }
      50% { filter: brightness(1.25) drop-shadow(0 0 10px rgba(255,255,255,0.2)); }
      100% { filter: brightness(1) drop-shadow(0 0 0 rgba(255,255,255,0)); }
    }
    .gen-hover-glow { animation: gen-hover-glow 0.6s cubic-bezier(0.34,1.56,0.64,1) 1 both; }

    @media (prefers-reduced-motion: reduce) {
      .gen-ring-mil, .gen-ring-zil, .gen-ring-alpha,
      .gen-icon-mil, .gen-icon-zil, .gen-icon-alpha { animation: none !important; }
    }
  `;
  document.head.appendChild(s);
}

export type AvatarWithGenRingProps = {
  src?: string | null;
  zid: string;
  size: number;
  birthYear?: number | null;
  birthMonth?: number | null;
  birthDay?: number | null;
  isAgent?: boolean;
  shape?: "rounded" | "circle";
  showTab?: boolean;
  href?: string;
  style?: React.CSSProperties;
  className?: string;
  statusDot?: "online" | "away" | "busy" | "offline" | null;
};

const STATUS_COLORS: Record<string, { bg: string; glow: string }> = {
  online: { bg: "#B4FF00", glow: "rgba(180,255,0,0.6)" },
  away:   { bg: "#F59E0B", glow: "rgba(245,158,11,0.6)" },
  busy:   { bg: "#EF4444", glow: "rgba(239,68,68,0.6)" },
};

export default function AvatarWithGenRing({
  src, zid, size,
  birthYear, birthMonth, birthDay,
  isAgent = false,
  shape = "rounded",
  showTab = true,
  href,
  style,
  className,
  statusDot,
}: AvatarWithGenRingProps) {
  const [pulsing, setPulsing] = useState(false);

  const avatarSrc = src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;
  const gen = (!isAgent && birthYear) ? getGeneration(birthYear, birthMonth, birthDay) : null;
  const aura = gen ? getGenAuraStyle(gen) : null;

  // Layout calculations
  const pad = aura ? Math.max(2, Math.round(size * 0.05)) : 0;
  const outerSize = size + (pad * 2);
  const outerRadius = shape === "circle" ? "50%" : `${Math.round(outerSize * 0.22)}px`;
  const innerRadius = shape === "circle" ? "50%" : `${Math.round(size * 0.22)}px`;

  const TAB = Math.max(16, Math.round(outerSize * 0.38));
  const TAB_FONT = Math.max(9, Math.round(size * 0.22));
  const TAB_OFFSET = Math.round(TAB * 0.4);

  const DOT = Math.max(8, Math.round(size * 0.22));
  const dot = statusDot ? STATUS_COLORS[statusDot] : null;

  const el = (
    <div
      className={[className, pulsing ? "gen-hover-glow" : ""].filter(Boolean).join(" ") || undefined}
      style={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        alignSelf: "flex-start", /* Prevents flex-stretch in parent containers */
        height: "max-content",   /* Ensures explicit natural height */
        flexShrink: 0,
        paddingBottom: (showTab && aura) ? TAB_OFFSET : 0,
        ...style,
      }}
      onMouseEnter={() => aura && setPulsing(true)}
      onTouchStart={() => aura && setPulsing(true)}
      onAnimationEnd={(e) => { if (e.animationName === "gen-hover-glow") setPulsing(false); }}
    >
      {/* ── Premium Outer Ring Wrapper ── */}
      <div style={{
        position: "relative",
        width: outerSize,
        height: outerSize,
        borderRadius: outerRadius,
        boxShadow: aura?.glowShadow ?? "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden", // Ensures inner spinning square is masked cleanly
      }}>
        
        {/* Animated Background Element (Enlarged to cover corners perfectly) */}
        {aura && (
          <div
            className={aura.ringClass}
            style={{
              position: "absolute",
              top: "-25%", left: "-25%",
              width: "150%", height: "150%",
              zIndex: 0,
              ...aura.ringStyle
            }}
          />
        )}

        {/* ── Inner Avatar Image ── */}
        <div style={{
          position: "relative",
          zIndex: 1,
          width: size,
          height: size,
          borderRadius: innerRadius,
          overflow: "hidden",
          background: "#0E0B0D",
          border: aura ? "1px solid rgba(0,0,0,0.8)" : "1px solid rgba(255,255,255,0.06)",
        }}>
          <img
            src={avatarSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        {/* Status dot overlay inside the wrapper if no bottom tab */}
        {dot && (
          <div style={{
            position: "absolute",
            bottom: pad,
            right: pad,
            width: DOT,
            height: DOT,
            borderRadius: "50%",
            background: dot.bg,
            border: "2px solid #0E0B0D",
            boxShadow: `0 0 4px ${dot.glow}`,
            zIndex: 4,
          }} />
        )}
      </div>

      {/* ── Floating Badge / Tab ── */}
      {aura && gen && showTab && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: TAB,
            height: TAB,
            borderRadius: "50%",
            background: aura.tabBg,
            border: aura.tabBorder,
            boxShadow: aura.tabShadow,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <span
            className={aura.iconClass}
            style={{
              fontSize: `${TAB_FONT}px`,
              lineHeight: 1,
              color: aura.iconClass ? undefined : aura.iconColor,
              textShadow: aura.iconClass ? undefined : aura.iconTextShadow,
              userSelect: "none",
              position: "relative",
              top: "1px", // Optical baseline adjustment for Gen tier icons
            }}
          >
            {gen.icon}
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ display: "inline-flex", flexShrink: 0, alignSelf: "flex-start", height: "max-content", ...style }}>
        {el}
      </Link>
    );
  }
  return el;
}
