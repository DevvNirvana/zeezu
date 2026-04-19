"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── Sequence ───────────────────────────────────────────────────────────────

const SEQUENCE: { delay: number; text: string; firstEverText?: string }[] = [
  { delay: 350, text: "Initializing ZeeNet...", firstEverText: "Dialing ZeeNet..." },
  { delay: 700, text: "Loading your ZID..." },
  { delay: 1100, text: "Connecting to the vibes..." },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface BootScreenProps {
  username?: string;
  isFirstEver?: boolean;
  onComplete: () => void;
}

// ─── Audio ───────────────────────────────────────────────────────────────────

function playModemSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.3);
  osc.frequency.linearRampToValueAtTime(1600, ctx.currentTime + 0.6);
  osc.frequency.linearRampToValueAtTime(2200, ctx.currentTime + 0.9);
  osc.frequency.linearRampToValueAtTime(1800, ctx.currentTime + 1.2);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1.5);
}

// ─── Zeezu Flag ──────────────────────────────────────────────────────────────
//
//  Four-panel emblem inspired by the iconic Windows XP flag.
//  Panels fan outward from a central gap using quadratic bezier curves,
//  giving the distinctive "waving flag" silhouette.
//
//  Violet  │ Cyan
//  ────────┼────────
//  Indigo  │ Sky

function ZeezuFlag({ size = 68 }: { size?: number }) {
  const W = 70;
  const H = 58;
  return (
    <svg
      width={size}
      height={Math.round((size / W) * H)}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Top-left — Violet */}
      <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill="#FF2D87" />
      {/* Top-right — Cyan */}
      <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill="#00E5FF" />
      {/* Bottom-left — Deep indigo */}
      <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6" />
      {/* Bottom-right — Sky blue */}
      <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9" />
    </svg>
  );
}

// ─── Keyframes (injected once) ────────────────────────────────────────────────

const STYLES = `
  @keyframes zee-marquee {
    0%   { transform: translateX(-96px); }
    100% { transform: translateX(170px); }
  }
  @keyframes zee-blink {
    0%, 100% { opacity: 1;    }
    50%       { opacity: 0;    }
  }
  @keyframes zee-flicker {
    0%,  89%, 91%, 93%, 100% { opacity: 1;    }
    90%, 92%                  { opacity: 0.90; }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BootScreen({
  username,
  isFirstEver = false,
  onComplete,
}: BootScreenProps) {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const doneRef = useRef(false);

  // ── Finish ──────────────────────────────────────────────────────────────────
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setShow(false);
    setTimeout(onComplete, 280);
  }, [onComplete]);

  // ── Audio ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      const ctx = new AudioContext();
      if (isFirstEver) {
        playModemSound(ctx);
        setTimeout(() => ctx.close(), 2000);
      } else {
        const audio = new Audio("https://axsmyeghciyf6aru.public.blob.vercel-storage.com/audio/Zeezu%20Dawn%20Chime.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => { /* Autoplay blocked */ });
        ctx.close(); // Not needed for this branch anymore
      }
    } catch { /* AudioContext blocked — silently ignore */ }
  }, [isFirstEver]);

  // ── Progress + status messages ───────────────────────────────────────────────
  useEffect(() => {
    const TOTAL = 1800;
    const start = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      setProgress(Math.min((elapsed / TOTAL) * 100, 100));

      const visible: string[] = [];
      for (const s of SEQUENCE) {
        if (elapsed >= s.delay) {
          visible.push(isFirstEver && s.firstEverText ? s.firstEverText : s.text);
        }
      }
      if (elapsed >= 1400) {
        visible.push(
          isFirstEver
            ? `Welcome to Zeezu, ${username || "you"}.`
            : `Welcome back, ${username || "you"}.`
        );
      }
      setLines(visible);

      if (elapsed < TOTAL) {
        rafId = requestAnimationFrame(tick);
      } else {
        setTimeout(finish, 700); // Increased from 200 to 700 for readability pause
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [username, isFirstEver, finish]);

  // ── Skip — click or any key ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => finish();
    window.addEventListener("keydown", handler);
    window.addEventListener("pointerdown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("pointerdown", handler);
    };
  }, [finish]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: "0%" }}
          exit={{ x: "-100%", transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
          className="fixed inset-0 z-[9999] select-none overflow-hidden"
          style={{ backgroundColor: "#000000" }}
          aria-live="polite"
          aria-label="Loading Zeezu"
        >
          {/* ── Injected keyframes ── */}
          <style>{STYLES}</style>

          {/* ── CRT scanlines ── */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.014) 2px, rgba(255,255,255,0.014) 4px)",
              animation: "zee-flicker 11s ease-in-out infinite",
              zIndex: 1,
            }}
          />

          {/* ══════════════════════════════════════════════
              CENTER STAGE
              Flag + wordmark, then marquee bar
          ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 1.1, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            {/* ── Flag + Wordmark ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "8px",
              }}
            >
              <ZeezuFlag size={72} />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {/* Main wordmark — mirrors XP's "Windows" */}
                <span
                  style={{
                    fontFamily: "'Trebuchet MS', 'Gill Sans', 'Century Gothic', sans-serif",
                    fontSize: "58px",
                    fontWeight: "700",
                    color: "#ffffff",
                    letterSpacing: "-1.5px",
                    lineHeight: "1",
                    textShadow: "0 0 60px rgba(255,45,135,0.28), 0 0 20px rgba(0,229,255,0.10)",
                  }}
                >
                  zeezu
                </span>

                {/* Sub-badge — mirrors XP's orange "xp" badge */}
                <span
                  style={{
                    fontFamily: "'Trebuchet MS', 'Gill Sans', sans-serif",
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#00E5FF",
                    letterSpacing: "0.5px",
                    lineHeight: "1",
                    marginLeft: "3px",
                    textShadow: "0 0 12px rgba(0,229,255,0.6)",
                  }}
                >
                  {isFirstEver ? "first boot" : "net"}
                </span>
              </div>
            </div>

            {/* ── Marquee bar ──────────────────────────────────────
                Faithful recreation of the XP loading stripe.
                Container clips overflow; a group of 4 glowing
                segments scrolls left-to-right in an infinite loop.
            ──────────────────────────────────────────────────── */}
            <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>

              {/* Bar shell */}
              <div
                style={{
                  width: "166px",
                  height: "10px",
                  backgroundColor: "#000",
                  border: "1px solid #272727",
                  borderRadius: "2px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Scrolling segment train */}
                <div
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: 0,
                    display: "flex",
                    gap: "5px",
                    animation: "zee-marquee 1.45s linear infinite",
                  }}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "18px",
                        height: "8px",
                        background: "linear-gradient(180deg, #9B52FF 0%, #7C25EE 55%, #CC1870 100%)",
                        borderRadius: "1px",
                        boxShadow: "0 0 6px rgba(255,45,135,0.55)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Status message — last line only, very subtle */}
              <div
                style={{
                  height: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {lines.length > 0 && (
                  <motion.span
                    key={lines[lines.length - 1]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "10px",
                      color: "#3d3d4f",
                      letterSpacing: "0.4px",
                    }}
                  >
                    {lines[lines.length - 1]}
                  </motion.span>
                )}
                {/* Blinking cursor — only shown while still loading */}
                {progress < 100 && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "5px",
                      height: "10px",
                      backgroundColor: "#3d3d4f",
                      animation: "zee-blink 1s step-end infinite",
                    }}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              BOTTOM CHROME
              Copyright left · Logo mark right
              Mirrors the XP boot screen's footer exactly.
          ══════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "0 36px 22px 36px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              zIndex: 2,
            }}
          >
            {/* Copyright — bottom left (like "Copyright © Microsoft Corporation") */}
            <p
              style={{
                fontFamily: "'Trebuchet MS', sans-serif",
                fontSize: "10.5px",
                color: "#3a3a3a",
                margin: 0,
                letterSpacing: "0.2px",
              }}
            >
              Copyright © Zeezu Corporation
            </p>

            {/* Logo mark — bottom right (like "Microsoft®" in italic) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ZeezuFlag size={16} />
              <span
                style={{
                  fontFamily: "'Trebuchet MS', 'Gill Sans', sans-serif",
                  fontSize: "12px",
                  fontWeight: "700",
                  fontStyle: "italic",
                  color: "#3a3a3a",
                  letterSpacing: "-0.5px",
                }}
              >
                zeezu
              </span>
            </div>
          </motion.div>

          {/* Skip hint — bottom center, extremely faint (XP didn't show this but UX needs it) */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            transition={{ delay: 1.4 }}
            style={{
              position: "absolute",
              bottom: "22px",
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "9px",
              color: "#ffffff",
              letterSpacing: "2px",
              textTransform: "uppercase",
              zIndex: 2,
              margin: 0,
              pointerEvents: "none",
            }}
          >
            click or press any key to skip
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}