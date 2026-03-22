"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, Terminal } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
//  COMMUNITY COLLAGE  — scattered friend-bubble data
//  Positions are percentage-based so they work on any viewport.
//  We avoid the center zone (30–70% x, 15–85% y) so they never overlap the card.
// ─────────────────────────────────────────────────────────────────────────────
const COMMUNITY = [
  { i: "SR", name: "Sara R.", c: "#FF6B9D", x: "6%", y: "14%", d: "0s", s: 50 },
  { i: "MK", name: "Mike K.", c: "#4ECDC4", x: "14%", y: "60%", d: "1.3s", s: 44 },
  { i: "JL", name: "Jess L.", c: "#FFD93D", x: "4%", y: "38%", d: "0.7s", s: 54 },
  { i: "AT", name: "Alex T.", c: "#A8E6CF", x: "21%", y: "82%", d: "2.0s", s: 42 },
  { i: "PW", name: "Pete W.", c: "#FF8B94", x: "17%", y: "26%", d: "0.4s", s: 48 },
  { i: "NJ", name: "Nina J.", c: "#C77DFF", x: "79%", y: "12%", d: "1.0s", s: 52 },
  { i: "CL", name: "Chloe L.", c: "#FFD166", x: "84%", y: "52%", d: "1.7s", s: 46 },
  { i: "DM", name: "Dan M.", c: "#6BCB77", x: "73%", y: "78%", d: "0.5s", s: 50 },
  { i: "YK", name: "Yuki K.", c: "#FF6B6B", x: "87%", y: "28%", d: "2.3s", s: 44 },
  { i: "BO", name: "Ben O.", c: "#4D96FF", x: "76%", y: "88%", d: "0.9s", s: 48 },
  { i: "RM", name: "Rosa M.", c: "#FF2D87", x: "2%", y: "78%", d: "1.5s", s: 42 },
  { i: "TK", name: "Tom K.", c: "#00C9A7", x: "22%", y: "46%", d: "2.8s", s: 46 },
  { i: "EV", name: "Eva V.", c: "#FF9A3C", x: "88%", y: "68%", d: "1.1s", s: 44 },
  { i: "HL", name: "Hana L.", c: "#00E5FF", x: "9%", y: "92%", d: "3.2s", s: 40 },
];

// Star decorations scattered in the background
const STARS = [
  { x: "28%", y: "8%", size: 10, d: "0s" },
  { x: "65%", y: "5%", size: 8, d: "1.2s" },
  { x: "12%", y: "50%", size: 12, d: "0.4s" },
  { x: "91%", y: "45%", size: 9, d: "2.0s" },
  { x: "50%", y: "95%", size: 11, d: "0.8s" },
  { x: "38%", y: "92%", size: 8, d: "1.6s" },
  { x: "82%", y: "95%", size: 10, d: "0.3s" },
  { x: "3%", y: "10%", size: 9, d: "1.9s" },
];

// Marquee content repeated for seamless loop
const MARQUEE_TEXT = "✦ NO ALGORITHM · NO FEED MANIPULATION · JUST PEOPLE · WELCOME BACK TO THE REAL INTERNET · ZEEZU · CONNECT WITH YOUR PEOPLE · ".repeat(3);

// Injected keyframes — defined once at module level
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Orbitron:wght@700;900&family=VT323&display=swap');

  @keyframes zee-bob {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-12px); }
  }
  @keyframes zee-bob-slow {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes zee-twinkle {
    0%, 100% { opacity: 0.15; transform: scale(1) rotate(0deg); }
    50%       { opacity: 0.7;  transform: scale(1.2) rotate(20deg); }
  }
  @keyframes zee-slide-up {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes zee-marquee {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-33.333%); }
  }
  @keyframes zee-pulse {
    0%   { box-shadow: 0 0 0 0   rgba(255, 45, 135, 0.5); }
    70%  { box-shadow: 0 0 0 8px rgba(255, 45, 135, 0);   }
    100% { box-shadow: 0 0 0 0   rgba(255, 45, 135, 0);   }
  }
  @keyframes zee-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes zee-fade-avatar {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1);   }
  }
  @keyframes zee-online-dot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }

  @media (max-width: 768px) {
    .login-outer {
      align-items: flex-start !important;
      justify-content: flex-start !important;
      padding-top: 8vh !important;
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const TERMINAL_LINES = [
  "> awaiting authentication...",
  "> zeezu network ready.",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Online counter — starts at a seed, drifts slowly
  const [onlineCount, setOnlineCount] = useState(2847);

  // Dev login state
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [devEmail, setDevEmail] = useState("test@zeezu.dev");
  const [devPassword, setDevPassword] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState("");
  const [devOpen, setDevOpen] = useState(false);

  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  // Drift the online counter for authenticity
  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount(n => n + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3));
    }, 3200);
    return () => clearInterval(t);
  }, []);

  // Typewriter effect after submit — logic unchanged
  useEffect(() => {
    if (!submitted) return;
    const allLines = [`> transmitting signal to ${email}...`, ...TERMINAL_LINES];
    let lineIdx = 0;
    let charIdx = 0;
    const builtLines: string[] = [];

    const typeNext = () => {
      const line = allLines[lineIdx];
      if (charIdx < line.length) {
        charIdx++;
        setTypedLines([...builtLines, line.slice(0, charIdx)]);
        typingRef.current = setTimeout(typeNext, 36);
      } else {
        builtLines.push(line);
        lineIdx++;
        charIdx = 0;
        if (lineIdx < allLines.length) {
          typingRef.current = setTimeout(typeNext, 320);
        }
      }
    };
    typingRef.current = setTimeout(typeNext, 200);
    return () => { if (typingRef.current) clearTimeout(typingRef.current); };
  }, [submitted, email]);

  // ── Auth handlers (logic UNCHANGED) ──────────────────────────────────────
  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevLoading(true);
    setDevError("");
    const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPassword });
    if (error) {
      setDevError(error.message);
      setDevLoading(false);
    } else {
      localStorage.setItem("zeezu_fresh_login", "1");
      router.push("/dashboard");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingOtp(true);
    setVerifyError("");
    const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "email" });
    if (error) {
      setVerifyError(error.message);
      setVerifyingOtp(false);
    } else {
      localStorage.setItem("zeezu_fresh_login", "1");
      router.push("/dashboard");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Global keyframes + fonts ─────────────────────────────────────── */}
      <style>{KEYFRAMES}</style>

      <main
        className="login-outer"
        style={{
          minHeight: "100vh",
          backgroundColor: "#080E24",
          backgroundImage: `
            radial-gradient(ellipse 70% 55% at 50% 0%,   rgba(255,45,135,0.14) 0%, transparent 65%),
            radial-gradient(ellipse 40% 35% at 0%   100%, rgba(0,229,255,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 100% 60%,  rgba(78,205,196,0.06) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='0.8' fill='rgba(255,255,255,0.045)'/%3E%3C/svg%3E")
          `,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Nunito', system-ui, sans-serif",
          paddingBottom: "48px",
        }}
      >

        {/* ══════════════════════════════════════════════════════════════════
            BACKGROUND — Star glyphs + community avatar collage
        ══════════════════════════════════════════════════════════════════ */}

        {/* ✦ Star decorations */}
        {STARS.map((st, idx) => (
          <span
            key={idx}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: st.x,
              top: st.y,
              fontSize: `${st.size}px`,
              color: "#FF2D87",
              pointerEvents: "none",
              userSelect: "none",
              animation: `zee-twinkle ${3 + idx * 0.4}s ease-in-out infinite`,
              animationDelay: st.d,
              zIndex: 1,
            }}
          >
            ✦
          </span>
        ))}

        {/* Community avatar bubbles */}
        {COMMUNITY.map((person, idx) => (
          <div
            key={idx}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: person.x,
              top: person.y,
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              pointerEvents: "none",
              animation: `${idx % 2 === 0 ? "zee-bob" : "zee-bob-slow"} ${4 + (idx % 3)}s ease-in-out infinite`,
              animationDelay: person.d,
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            {/* Entrance animation wrapper */}
            <div
              style={{
                animation: `zee-fade-avatar 0.6s ease-out forwards`,
                animationDelay: `${0.2 + idx * 0.08}s`,
                opacity: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {/* Avatar circle */}
              <div
                style={{
                  width: `${person.s}px`,
                  height: `${person.s}px`,
                  borderRadius: "50%",
                  background: person.c,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: `${Math.floor(person.s * 0.3)}px`,
                  fontWeight: "800",
                  color: "#fff",
                  border: "2.5px solid rgba(255,255,255,0.25)",
                  boxShadow: `0 4px 20px ${person.c}55, 0 0 0 4px ${person.c}20`,
                  letterSpacing: "0.5px",
                  fontFamily: "'Nunito', sans-serif",
                  textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                }}
              >
                {person.i}
              </div>

              {/* Name tag */}
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.3px",
                  fontFamily: "'Nunito', sans-serif",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  padding: "1px 6px",
                  borderRadius: "8px",
                }}
              >
                {person.name}
              </span>
            </div>
          </div>
        ))}

        {/* ══════════════════════════════════════════════════════════════════
            PORTAL CARD
        ══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "calc(100% - 32px)",
            maxWidth: "410px",
            margin: "0 auto",
            animation: "zee-slide-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
          }}
        >
          {/* Outer glow ring */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-2px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #FF2D87 0%, #00E5FF 50%, #FF2D87 100%)",
              backgroundSize: "200% 200%",
              zIndex: -1,
              opacity: 0.55,
              filter: "blur(1px)",
            }}
          />

          <div
            style={{
              background: "#0E1630",
              borderRadius: "18px",
              overflow: "hidden",
              border: "1px solid rgba(255,45,135,0.3)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}
          >

            {/* ── CARD HEADER — portal-style colored banner ────────────── */}
            <div
              style={{
                background: "linear-gradient(135deg, #6D10E8 0%, #3B0DA8 40%, #0B4B8F 100%)",
                padding: "18px 22px 16px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Header shimmer lines */}
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.025) 3px,rgba(255,255,255,0.025) 4px)", pointerEvents: "none" }} />

              {/* Logo */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "26px",
                    fontWeight: "900",
                    color: "#ffffff",
                    letterSpacing: "-1px",
                    textShadow: "0 0 20px rgba(0,229,255,0.5)",
                    lineHeight: "1",
                  }}
                >
                  zeezu
                </span>
                <span
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: "13px",
                    color: "#00E5FF",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    opacity: 0.9,
                  }}
                >
                  PORTAL
                </span>
              </div>

              {/* Online counter badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  backgroundColor: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(107,203,119,0.4)",
                  borderRadius: "20px",
                  padding: "4px 10px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#6BCB77",
                    display: "inline-block",
                    flexShrink: 0,
                    animation: "zee-online-dot 2s ease-in-out infinite",
                    boxShadow: "0 0 6px rgba(107,203,119,0.8)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: "13px",
                    color: "#6BCB77",
                    letterSpacing: "0.5px",
                    lineHeight: "1",
                  }}
                >
                  {onlineCount.toLocaleString()} online
                </span>
              </div>
            </div>

            {/* ── CARD BODY ─────────────────────────────────────────────── */}
            <div style={{ padding: "24px 24px 0 24px" }}>

              {/* Welcome line */}
              <div style={{ marginBottom: "20px" }}>
                <p
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.45)",
                    letterSpacing: "0.2px",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  ✦ Welcome back to the real internet ✦
                </p>
              </div>

              {/* ── Divider with label ────────────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ flex: 1, height: "1px", background: "rgba(255,45,135,0.2)" }} />
                <span
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: "11px",
                    color: "#FF2D87",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  INITIALIZE CONNECTION
                </span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,45,135,0.2)" }} />
              </div>

              {/* ── Magic Link section ────────────────────────────────── */}
              <div
                style={{
                  background: "rgba(255,45,135,0.06)",
                  border: "1px solid rgba(255,45,135,0.2)",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "14px",
                }}
              >
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  {/* Avatar placeholder */}
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FF2D87, #00E5FF)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      animation: "zee-pulse 2.5s ease-out infinite",
                      boxShadow: "0 0 0 3px rgba(255,45,135,0.15)",
                    }}
                  >
                    <span style={{ fontSize: "16px", color: "#fff", fontFamily: "sans-serif" }}>👤</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#fff", fontFamily: "'Nunito', sans-serif" }}>
                      Zeezu User
                    </p>
                    <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,45,135,0.7)", fontFamily: "'VT323', monospace", letterSpacing: "1px" }}>
                      EMAIL CODE · NO PASSWORD
                    </p>
                  </div>
                </div>

                {/* Form or terminal output */}
                {submitted ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Terminal animation */}
                    <div
                      style={{
                        background: "#000d1a",
                        border: "1px solid rgba(0,229,255,0.2)",
                        borderRadius: "10px",
                        padding: "12px",
                        fontFamily: "'VT323', monospace",
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}
                    >
                      {typedLines.map((line, i) => (
                        <div
                          key={i}
                          style={{
                            color:
                              i === 0
                                ? "#00E5FF"
                                : i === typedLines.length - 1
                                  ? "#6BCB77"
                                  : "rgba(255,255,255,0.5)",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                          }}
                        >
                          {line}
                          {i === typedLines.length - 1 && (
                            <span
                              style={{
                                display: "inline-block",
                                width: "6px",
                                height: "13px",
                                backgroundColor: "#6BCB77",
                                marginLeft: "3px",
                                animation: "zee-blink 1s step-end infinite",
                              }}
                            />
                          )}
                        </div>
                      ))}
                      <p
                        style={{
                          color: "rgba(255,255,255,0.2)",
                          fontSize: "10px",
                          margin: "8px 0 0 0",
                          paddingTop: "8px",
                          borderTop: "1px solid rgba(255,255,255,0.07)",
                          fontFamily: "'Nunito', sans-serif",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Check your inbox for a 6-digit code
                      </p>
                    </div>
                    {/* OTP code input */}
                    <form onSubmit={handleVerifyOtp} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="6-digit code"
                        autoFocus
                        style={{
                          flex: 1,
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(0,229,255,0.3)",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          color: "#fff",
                          fontSize: "18px",
                          fontFamily: "'VT323', monospace",
                          letterSpacing: "6px",
                          textAlign: "center",
                          outline: "none",
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = "rgba(0,229,255,0.7)";
                          e.target.style.boxShadow = "0 0 0 3px rgba(0,229,255,0.12)";
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = "rgba(0,229,255,0.3)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                      <button
                        type="submit"
                        disabled={verifyingOtp || otpCode.length < 6}
                        style={{
                          width: "40px",
                          height: "40px",
                          flexShrink: 0,
                          borderRadius: "10px",
                          background: verifyingOtp || otpCode.length < 6
                            ? "rgba(0,229,255,0.2)"
                            : "linear-gradient(135deg, #00E5FF, #0099cc)",
                          border: "1px solid rgba(0,229,255,0.5)",
                          color: "#fff",
                          cursor: verifyingOtp || otpCode.length < 6 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 0 14px rgba(0,229,255,0.3)",
                        }}
                      >
                        {verifyingOtp
                          ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                          : <ArrowRight size={16} />}
                      </button>
                    </form>
                    {verifyError && (
                      <p style={{ color: "#FF6B6B", fontSize: "10px", margin: "0", fontFamily: "'VT323', monospace", letterSpacing: "0.5px" }}>
                        ⚠ {verifyError}
                      </p>
                    )}
                    <button
                      onClick={() => { setSubmitted(false); setOtpCode(""); setVerifyError(""); setTypedLines([]); }}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: "10px", fontFamily: "'Nunito', sans-serif", cursor: "pointer", padding: 0, textAlign: "left" }}
                    >
                      ← wrong email? go back
                    </button>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleLogin} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{
                          flex: 1,
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(255,45,135,0.3)",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          color: "#fff",
                          fontSize: "13px",
                          fontFamily: "'Nunito', sans-serif",
                          outline: "none",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = "rgba(255,45,135,0.7)";
                          e.target.style.boxShadow = "0 0 0 3px rgba(255,45,135,0.12)";
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = "rgba(255,45,135,0.3)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                      <button
                        type="submit"
                        disabled={loading || !email}
                        style={{
                          width: "40px",
                          height: "40px",
                          flexShrink: 0,
                          borderRadius: "10px",
                          background: loading || !email
                            ? "rgba(255,45,135,0.2)"
                            : "linear-gradient(135deg, #FF2D87, #CC1870)",
                          border: "1px solid rgba(255,45,135,0.5)",
                          color: "#fff",
                          cursor: loading || !email ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "transform 0.15s, box-shadow 0.15s",
                          boxShadow: "0 0 14px rgba(255,45,135,0.35)",
                        }}
                        onMouseEnter={e => {
                          if (!loading && email) {
                            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
                          }
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                        }}
                      >
                        {loading
                          ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                          : <ArrowRight size={16} />}
                      </button>
                    </form>
                    {error && (
                      <p style={{ color: "#FF6B6B", fontSize: "10px", margin: "6px 0 0 0", fontFamily: "'VT323', monospace", letterSpacing: "0.5px" }}>
                        ⚠ {error}
                      </p>
                    )}
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", margin: "8px 0 0 0", fontFamily: "'Nunito', sans-serif", letterSpacing: "0.2px" }}>
                      New here? Same link — we&apos;ll set you up.
                    </p>
                  </>
                )}
              </div>

              {/* ── Dev Admin — localhost only ────────────────────────── */}
              {isLocalhost && (
                <div
                  style={{
                    background: "rgba(234,179,8,0.04)",
                    border: "1px solid rgba(234,179,8,0.2)",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    marginBottom: "14px",
                  }}
                >
                  {/* Collapsed header — click to expand */}
                  <button
                    onClick={() => setDevOpen(v => !v)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: 0,
                    }}
                  >
                    <Terminal size={14} color="#EAB308" />
                    <span style={{ fontWeight: 800, fontSize: "12px", color: "#EAB308", fontFamily: "'Nunito', sans-serif" }}>Dev Admin</span>
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: "10px", color: "rgba(234,179,8,0.5)", letterSpacing: "2px" }}>
                      LOCALHOST
                    </span>
                    <span style={{ marginLeft: "auto", color: "rgba(234,179,8,0.5)", fontSize: "12px" }}>
                      {devOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {devOpen && (
                    <form onSubmit={handleDevLogin} style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input
                        type="email"
                        value={devEmail}
                        onChange={e => setDevEmail(e.target.value)}
                        style={{
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(234,179,8,0.25)",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          color: "#fff",
                          fontSize: "11px",
                          fontFamily: "'Nunito', sans-serif",
                          outline: "none",
                          width: "100%",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="password"
                          value={devPassword}
                          onChange={e => setDevPassword(e.target.value)}
                          placeholder="Password"
                          style={{
                            flex: 1,
                            background: "rgba(0,0,0,0.4)",
                            border: "1px solid rgba(234,179,8,0.25)",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            color: "#fff",
                            fontSize: "11px",
                            fontFamily: "'Nunito', sans-serif",
                            outline: "none",
                          }}
                        />
                        <button
                          type="submit"
                          disabled={devLoading || !devPassword}
                          style={{
                            width: "36px",
                            height: "36px",
                            flexShrink: 0,
                            background: "rgba(234,179,8,0.15)",
                            border: "1px solid rgba(234,179,8,0.4)",
                            borderRadius: "8px",
                            color: "#EAB308",
                            cursor: devLoading || !devPassword ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: devLoading || !devPassword ? 0.4 : 1,
                          }}
                        >
                          {devLoading
                            ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                            : <ArrowRight size={12} />}
                        </button>
                      </div>
                      {devError && <p style={{ color: "#FF6B6B", fontSize: "9px", fontFamily: "'VT323', monospace", margin: 0 }}>{devError}</p>}
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* ── CARD FOOTER ───────────────────────────────────────────── */}
            <div
              style={{
                background: "rgba(0,0,0,0.25)",
                borderTop: "1px solid rgba(255,45,135,0.12)",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'Nunito', sans-serif",
                  textDecoration: "none",
                  transition: "color 0.2s",
                  letterSpacing: "0.2px",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#FF2D87")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                <ArrowRight size={10} style={{ transform: "rotate(180deg)" }} />
                Back to Zeezu
              </Link>
              <p
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: "10px",
                  color: "rgba(255,45,135,0.35)",
                  letterSpacing: "0.5px",
                  margin: 0,
                }}
              >
                EST. 2025
              </p>
            </div>

          </div>{/* /card inner */}
        </div>{/* /portal card */}

        {/* ══════════════════════════════════════════════════════════════════
            SCROLLING MARQUEE TICKER — bottom of screen
        ══════════════════════════════════════════════════════════════════ */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "28px",
            background: "linear-gradient(90deg, #3B0DA8 0%, #0B4B8F 50%, #3B0DA8 100%)",
            borderTop: "1px solid rgba(255,45,135,0.4)",
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
              animation: "zee-marquee 28s linear infinite",
              fontFamily: "'VT323', monospace",
              fontSize: "13px",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "1.5px",
              willChange: "transform",
            }}
          >
            {MARQUEE_TEXT}
          </div>
        </div>

      </main>
    </>
  );
}