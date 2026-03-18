"use client";

import { useEffect, useRef, useState } from "react";
import { Fingerprint, Users, Shield, Camera } from "lucide-react";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ZeezuReflectiveCardProps {
  // Profile data
  displayName: string;
  zid: string;
  avatarUrl?: string;
  statusMessage?: string | null;
  friendCount?: number;
  birthYear?: number | null;
  birthMonth?: number | null;
  birthDay?: number | null;
  influenceScore?: number;
  primaryColor?: string;
  secondaryColor?: string;

  // Card physics controls (optional overrides)
  blurStrength?: number;
  metalness?: number;
  roughness?: number;
  displacementStrength?: number;
  noiseScale?: number;
  specularConstant?: number;
  glassDistortion?: number;
  grayscale?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  INFLUENCE TIER HELPER
// ─────────────────────────────────────────────────────────────────────────────

function getInfluenceTier(score: number) {
  if (score >= 100) return { label: "LEGENDARY", color: "#FFD700" };
  if (score >= 50) return { label: "ICON", color: "#8A2EFF" };
  if (score >= 20) return { label: "RISING", color: "#00E5FF" };
  return { label: "USER", color: "#888888" };
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ZeezuReflectiveCard({
  displayName,
  zid,
  avatarUrl,
  statusMessage,
  friendCount = 0,
  birthYear,
  birthMonth,
  birthDay,
  influenceScore = 0,
  primaryColor = "#8A2EFF",
  secondaryColor = "#00E5FF",

  // Physics defaults tuned for the Y2K chrome aesthetic
  blurStrength = 14,
  metalness = 0.95,
  roughness = 0.35,
  displacementStrength = 18,
  noiseScale = 1.1,
  specularConstant = 1.4,
  glassDistortion = 0,
  grayscale = 0.85,
}: ZeezuReflectiveCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camActive, setCamActive] = useState(false);
  const [camDenied, setCamDenied] = useState(false);
  const [fpHovered, setFpHovered] = useState(false);

  const gen = getGeneration(birthYear, birthMonth, birthDay);
  const tier = getInfluenceTier(influenceScore);

  // ── Cleanup only — camera starts on user click ───────────────────
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  // ── Manual camera trigger ────────────────────────────────────────
  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCamActive(true);
        setCamDenied(false);
      }
    } catch {
      setCamDenied(true);
      setCamActive(false);
    }
  };

  const baseFrequency = 0.03 / Math.max(0.1, noiseScale);
  const saturation = 1 - Math.max(0, Math.min(1, grayscale));

  return (
    <>
      {/* Inject card-specific keyframes once */}
      <style>{`
        @keyframes zrc-scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(400px); }
        }
        @keyframes zrc-flicker {
          0%,89%,91%,93%,100% { opacity: 1;    }
          90%,92%             { opacity: 0.88; }
        }
        @keyframes zrc-pulse {
          0%,100% { box-shadow: 0 0 0 0   rgba(138,46,255,0.6); }
          50%     { box-shadow: 0 0 0 6px rgba(138,46,255,0);   }
        }
        @keyframes zrc-shine {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes zrc-eq {
          0%,100% { transform: scaleY(0.3); }
          50%     { transform: scaleY(1);   }
        }
        @keyframes zrc-online {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.28; }
        }
        .zrc-glow-border {
          animation: zrc-pulse 3s ease-in-out infinite;
        }
        @keyframes zrc-fp-pulse {
          0%,100% { box-shadow: 0 0 0 0 ${primaryColor}80, 0 0 10px ${primaryColor}40; }
          50%     { box-shadow: 0 0 0 5px ${primaryColor}00, 0 0 22px ${primaryColor}80; }
        }
      `}</style>

      {/*
        ── OUTER WRAPPER ──────────────────────────────────────────────
        Matches original card-profile dimensions in the 320px sidebar.
        Hidden on mobile via the parent's .card-profile { display: none }
        rule that already exists in the dashboard CSS.
      */}
      <div
        className="card-profile zrc-glow-border"
        style={{
          position: "relative",
          width: "100%",
          borderRadius: "18px",
          overflow: "hidden",
          isolation: "isolate",
          background: "#0a0a14",
          boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px ${primaryColor}30 inset`,
          // Give it a fixed height so the card doesn't collapse without cam
          minHeight: "320px",
          animation: "zrc-flicker 10s ease-in-out infinite",
        }}
      >
        {/* ── SVG FILTER DEFINITIONS ───────────────────────────────── */}
        <svg
          style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none", opacity: 0 }}
          aria-hidden="true"
        >
          <defs>
            <filter id="zrc-metallic" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="turbulence"
                baseFrequency={baseFrequency}
                numOctaves="2"
                result="noise"
              />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={displacementStrength}
                xChannelSelector="R"
                yChannelSelector="G"
                result="rippled"
              />
              <feSpecularLighting
                in="noiseAlpha"
                surfaceScale={displacementStrength}
                specularConstant={specularConstant}
                specularExponent="20"
                lightingColor="#ffffff"
                result="light"
              >
                <fePointLight x="0" y="0" z="300" />
              </feSpecularLighting>
              <feComposite in="light" in2="rippled" operator="in" result="lightEffect" />
              <feBlend in="lightEffect" in2="rippled" mode="screen" result="metallicResult" />
              {glassDistortion > 0 && (
                <>
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    result="solidAlpha"
                  />
                  <feMorphology in="solidAlpha" operator="erode" radius="45" result="erodedAlpha" />
                  <feGaussianBlur in="erodedAlpha" stdDeviation="10" result="blurredMap" />
                  <feComponentTransfer in="blurredMap" result="glassMap">
                    <feFuncA type="linear" slope="0.5" intercept="0" />
                  </feComponentTransfer>
                  <feDisplacementMap
                    in="metallicResult"
                    in2="glassMap"
                    scale={glassDistortion}
                    xChannelSelector="A"
                    yChannelSelector="A"
                    result="final"
                  />
                </>
              )}
            </filter>
          </defs>
        </svg>

        {/* ── WEBCAM LAYER (metallic background) ───────────────────── */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1) scale(1.15)",
            zIndex: 0,
            opacity: camActive ? 0.88 : 0,
            transition: "opacity 0.6s ease",
            filter: `saturate(${saturation}) contrast(120%) brightness(108%) blur(${blurStrength}px) url(#zrc-metallic)`,
          }}
        />

        {/* ── FALLBACK GRADIENT (when no camera) ───────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background: `linear-gradient(145deg, #0f0c29 0%, ${primaryColor}22 45%, #1a0533 100%)`,
            opacity: camActive ? 0 : 1,
            transition: "opacity 0.6s ease",
          }}
        />

        {/* ── NOISE TEXTURE (roughness layer) ──────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            opacity: roughness * 0.55,
            pointerEvents: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
        />

        {/* ── METALLIC GLOSS SWEEP ─────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background: "linear-gradient(135deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0.08) 40%,rgba(255,255,255,0) 50%,rgba(255,255,255,0.08) 60%,rgba(255,255,255,0.22) 100%)",
            opacity: metalness,
            pointerEvents: "none",
            mixBlendMode: "overlay",
          }}
        />

        {/* ── CRT SCANLINE OVERLAY ─────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px)",
          }}
        />

        {/* ── MOVING SCANLINE ──────────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "80px",
            top: 0,
            zIndex: 4,
            pointerEvents: "none",
            background: "linear-gradient(180deg,transparent 0%,rgba(138,46,255,0.04) 50%,transparent 100%)",
            animation: "zrc-scanline 5s linear infinite",
          }}
        />

        {/* ── GRADIENT BORDER ──────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "18px",
            padding: "1px",
            background: camActive
              ? `linear-gradient(135deg, ${primaryColor}ff 0%, ${secondaryColor}66 40%, ${secondaryColor}ff 100%)`
              : `linear-gradient(135deg, ${primaryColor}cc 0%, rgba(255,255,255,0.15) 50%, ${secondaryColor}aa 100%)`,
            transition: "background 0.6s ease",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />

        {/* ── PRIMARY COLOR TINT ───────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${primaryColor}18 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />

        {/* ════════════════════════════════════════════════════════════
            CARD CONTENT — sits above all filters
        ════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px",
          }}
        >
          {/* ── CARD HEADER ────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: "10px" }}>
            {/* SECURE / CAM badge — dynamic */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              background: camActive ? "rgba(107,203,119,0.12)" : camDenied ? "rgba(255,85,102,0.1)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${camActive ? "rgba(107,203,119,0.35)" : camDenied ? "rgba(255,85,102,0.3)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: "6px",
              fontFamily: "'VT323', monospace",
              fontSize: "9px",
              color: camActive ? "#6BCB77" : camDenied ? "#ff5566" : "rgba(255,255,255,0.7)",
              letterSpacing: "1.5px",
              transition: "all 0.4s ease",
            }}>
              {camActive ? <Camera size={10} style={{ opacity: 0.9 }} /> : <Shield size={10} style={{ opacity: 0.8 }} />}
              {camActive ? "CAM LIVE" : camDenied ? "CAM OFF" : "SECURE"}
            </div>

            {/* Online indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#6BCB77",
                display: "inline-block",
                boxShadow: "0 0 6px #6BCB77",
                animation: "zrc-online 2s ease-in-out infinite",
              }} />
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "#6BCB77", letterSpacing: "1px" }}>
                ONLINE
              </span>
            </div>
          </div>

          {/* ── AVATAR + NAME CENTER BLOCK ───────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "8px 0" }}>
            {/* Avatar with gradient ring */}
            <div style={{
              position: "relative",
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              padding: "2.5px",
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              boxShadow: `0 0 20px ${primaryColor}60, 0 0 40px ${primaryColor}20`,
              flexShrink: 0,
            }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#000" }}>
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", display: "block" }}
                />
              </div>

              {/* Small tier dot on avatar */}
              <div style={{
                position: "absolute",
                bottom: "1px",
                right: "1px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: tier.color,
                border: "2px solid #0a0a14",
                boxShadow: `0 0 6px ${tier.color}`,
              }} />
            </div>

            {/* Name */}
            <div style={{ textAlign: "center" }}>
              <h2 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "15px",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.5px",
                margin: "0 0 2px",
                textShadow: `0 0 16px ${primaryColor}80`,
              }}>
                {displayName}
              </h2>

              {/* ZID */}
              <p style={{
                fontFamily: "'VT323', monospace",
                fontSize: "11px",
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "2px",
                margin: "0 0 6px",
              }}>
                {zid}
              </p>

              {/* Gen badge */}
              {gen && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
                  <GenBadge gen={gen} size="sm" />
                </div>
              )}

              {/* Tier label — shiny gradient text */}
              <span style={{
                fontFamily: "'VT323', monospace",
                fontSize: "10px",
                letterSpacing: "2px",
                background: `linear-gradient(90deg, ${tier.color}88, ${tier.color}, ${tier.color}88)`,
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "zrc-shine 2.5s linear infinite",
              }}>
                {tier.label}
              </span>
            </div>
          </div>

          {/* ── STATUS MESSAGE ─────────────────────────────────────── */}
          {statusMessage && (
            <div style={{
              padding: "8px 10px",
              background: "rgba(0,0,0,0.35)",
              border: `1px solid ${primaryColor}22`,
              borderRadius: "8px",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "11px",
                color: "rgba(255,255,255,0.5)",
                fontStyle: "italic",
                margin: 0,
                lineHeight: 1.4,
              }}>
                &ldquo;{statusMessage}&rdquo;
              </p>
            </div>
          )}

          {/* ── FOOTER ROW ─────────────────────────────────────────── */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            {/* Friends count */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontFamily: "'VT323', monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>
                CONNECTIONS
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Users size={11} style={{ color: secondaryColor }} />
                <span style={{ fontFamily: "'VT323', monospace", fontSize: "14px", color: secondaryColor, letterSpacing: "0.5px" }}>
                  {friendCount} FRIEND{friendCount !== 1 ? "S" : ""}
                </span>
              </div>
            </div>

            {/* Theme color dots + camera toggle / fingerprint */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: primaryColor, boxShadow: `0 0 5px ${primaryColor}`, display: "inline-block" }} />
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: secondaryColor, boxShadow: `0 0 5px ${secondaryColor}55`, display: "inline-block" }} />

              <div style={{ position: "relative" }}>
                {/* Custom tooltip */}
                <div style={{
                  position: "absolute",
                  bottom: "calc(100% + 10px)",
                  right: 0,
                  width: "180px",
                  background: "rgba(8,8,18,0.96)",
                  border: `1px solid ${camActive ? primaryColor + "50" : camDenied ? "rgba(255,85,102,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "10px",
                  padding: "8px 10px",
                  pointerEvents: "none",
                  opacity: fpHovered ? 1 : 0,
                  transform: fpHovered ? "translateY(0) scale(1)" : "translateY(6px) scale(0.97)",
                  transition: "opacity 0.22s ease, transform 0.22s ease",
                  zIndex: 20,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 0.5px ${camActive ? primaryColor : "rgba(255,255,255,0.06)"}`,
                }}>
                  <p style={{ margin: "0 0 4px", fontFamily: "'VT323', monospace", fontSize: "11px", letterSpacing: "1px", color: camActive ? "#6BCB77" : camDenied ? "#ff5566" : "rgba(255,255,255,0.9)", fontWeight: "bold" }}>
                    {camActive ? "✦ Live Glass FX Active" : camDenied ? "Camera Blocked" : "✦ Live Glass FX"}
                  </p>
                  <p style={{ margin: "0 0 4px", fontFamily: "'VT323', monospace", fontSize: "10px", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                    {camActive
                      ? "Your webcam is rendering the metallic effect."
                      : camDenied
                        ? "Click to try again."
                        : "Uses your webcam to render a metallic reflective effect on this card."}
                  </p>
                  <p style={{ margin: 0, fontFamily: "'VT323', monospace", fontSize: "9px", color: camDenied ? "rgba(255,85,102,0.6)" : "rgba(255,255,255,0.3)", letterSpacing: "0.5px" }}>
                    {camActive ? "Never stored or transmitted." : camDenied ? "Check browser permissions for camera access." : "100% local · never recorded."}
                  </p>
                  {/* Triangle pointer */}
                  <div style={{
                    position: "absolute",
                    bottom: "-5px",
                    right: "14px",
                    width: "8px",
                    height: "8px",
                    background: "rgba(8,8,18,0.96)",
                    borderBottom: `1px solid ${camActive ? primaryColor + "50" : camDenied ? "rgba(255,85,102,0.4)" : "rgba(255,255,255,0.1)"}`,
                    borderRight: `1px solid ${camActive ? primaryColor + "50" : camDenied ? "rgba(255,85,102,0.4)" : "rgba(255,255,255,0.1)"}`,
                    transform: "rotate(45deg)",
                  }} />
                </div>

                {/* Circular premium button */}
                <button
                  onClick={camActive ? undefined : requestCamera}
                  onMouseEnter={() => setFpHovered(true)}
                  onMouseLeave={() => setFpHovered(false)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: `2px solid ${camActive ? primaryColor : camDenied ? "#ff5566" : fpHovered ? primaryColor : primaryColor + "40"}`,
                    background: camActive ? `${primaryColor}10` : camDenied ? "rgba(255,85,102,0.08)" : "rgba(255,255,255,0.05)",
                    cursor: camActive ? "default" : "pointer",
                    outline: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "border-color 0.3s, background 0.3s, box-shadow 0.3s, transform 0.2s",
                    boxShadow: camActive
                      ? `0 0 12px ${primaryColor}60, 0 0 4px ${primaryColor}40`
                      : fpHovered
                        ? `0 0 10px ${camDenied ? "rgba(255,85,102,0.4)" : primaryColor + "50"}`
                        : "none",
                    transform: !camActive && fpHovered ? "scale(1.08)" : "scale(1)",
                    animation: camActive ? "zrc-fp-pulse 2.5s ease-in-out infinite" : "none",
                  }}
                >
                  <Fingerprint size={18} style={{
                    color: camActive ? primaryColor : camDenied ? "#ff5566" : fpHovered ? primaryColor : "rgba(255,255,255,0.3)",
                    transition: "color 0.3s",
                  }} />
                </button>

                {/* Label below button */}
                <span style={{
                  display: "block",
                  fontFamily: "'VT323', monospace",
                  fontSize: "8px",
                  letterSpacing: "1px",
                  color: camActive ? `${primaryColor}cc` : camDenied ? "rgba(255,85,102,0.6)" : "rgba(255,255,255,0.2)",
                  textAlign: "center",
                  marginTop: "2px",
                  transition: "color 0.3s",
                }}>
                  {camActive ? "LIVE" : camDenied ? "RETRY" : "FX"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}