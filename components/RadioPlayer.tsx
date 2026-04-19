"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  STATIONS — unchanged from original
// ─────────────────────────────────────────────────────────────────────────────

type Station = {
  id: string;
  name: string;
  color: string;
  url?: string;
  playlist?: string[];
  trackNames?: string[];
};

const STATIONS: Station[] = [
  {
    id: "ost",
    name: "OST // ZEEZU",
    color: "#fcee0a",
    playlist: [
      "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/Drive%20Home%20Safe.mp3",
      "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/eurodrive.mp3",
      "https://axsmyeghciyf6aru.public.blob.vercel-storage.com/Dreams%20We%20Didn%E2%80%99t%20Get%20To%20Live.mp3",
      "https://dl.dropboxusercontent.com/scl/fi/uz72n6eqlmke36p2xxi1i/KxH-TTR.mp3?rlkey=fsx2dlmlvgidh5s7upenk93vm&e=1&st=hr4rm7of&",
    ],
    trackNames: [
      "Drive Home Safe",
      "Eurodrive",
      "Dreams We Didn't Get To Live",
      "KxH-TTR",
    ],
  },
  { id: "chillsynth", name: "CHILLSYNTH", url: "https://stream.rekt.network/chillsynth.mp3", color: "#00f3ff" },
  { id: "nightride", name: "NIGHTRIDE FM", url: "https://stream.rekt.network/nightride.mp3", color: "#ff00ff" },
  { id: "darksynth", name: "DARKSYNTH", url: "https://stream.rekt.network/darksynth.mp3", color: "#ff003c" },
  { id: "datawave", name: "DATAWAVE", url: "https://stream.rekt.network/datawave.mp3", color: "#0aff00" },
  { id: "ebsm", name: "EBSM", url: "https://stream.rekt.network/ebsm.mp3", color: "#ff6600" },
  { id: "horrorsynth", name: "HORRORSYNTH", url: "https://stream.rekt.network/horrorsynth.mp3", color: "#9900ff" },
  { id: "spacesynth", name: "SPACESYNTH FM", url: "https://stream.rekt.network/spacesynth.mp3", color: "#0066ff" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function hexGlow(hex: string, alpha = 0.35): string {
  const c = hex.replace("#", "");
  return `rgba(${parseInt(c.slice(0, 2), 16)},${parseInt(c.slice(2, 4), 16)},${parseInt(c.slice(4, 6), 16)},${alpha})`;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(1, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  GLOBAL STYLES — injected once
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_ID = "zeeamp-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Share+Tech+Mono&display=swap');

    /* ── Vinyl spin ── */
    @keyframes vinyl-spin  { to { transform: rotate(360deg);  } }
    @keyframes vinyl-spin-r{ to { transform: rotate(-360deg); } }
    @keyframes vinyl-glow  {
      0%,100% { box-shadow: 0 0 22px 4px rgba(255,45,135,.85),  0 0 50px 10px rgba(255,45,135,.25), 0 6px 24px rgba(0,0,0,.8); }
      25%     { box-shadow: 0 0 22px 4px rgba(0,247,255,.85),   0 0 50px 10px rgba(0,247,255,.25),  0 6px 24px rgba(0,0,0,.8); }
      50%     { box-shadow: 0 0 22px 4px rgba(180,255,0,.85),   0 0 50px 10px rgba(180,255,0,.25),  0 6px 24px rgba(0,0,0,.8); }
      75%     { box-shadow: 0 0 22px 4px rgba(255,215,0,.85),   0 0 50px 10px rgba(255,215,0,.25),  0 6px 24px rgba(0,0,0,.8); }
    }
    @keyframes vinyl-hue { to { filter: hue-rotate(360deg); } }

    /* ── EQ bars ── */
    @keyframes za-eq1 { 0%,100%{height:3px}  50%{height:13px} }
    @keyframes za-eq2 { 0%,100%{height:9px}  50%{height:3px}  }
    @keyframes za-eq3 { 0%,100%{height:6px}  30%{height:14px} 70%{height:3px} }
    @keyframes za-eq4 { 0%,100%{height:11px} 45%{height:4px}  }
    @keyframes za-eq5 { 0%,100%{height:5px}  60%{height:12px} }
    @keyframes za-eq6 { 0%,100%{height:8px}  35%{height:3px}  }
    @keyframes za-eq7 { 0%,100%{height:4px}  55%{height:11px} }
    @keyframes za-eq8 { 0%,100%{height:7px}  25%{height:14px} 65%{height:3px} }
    @keyframes za-eq9 { 0%,100%{height:10px} 40%{height:4px}  }
    @keyframes za-eq0 { 0%,100%{height:6px}  50%{height:13px} }

    .za-eq-1  { animation: za-eq1 0.65s ease-in-out infinite; }
    .za-eq-2  { animation: za-eq2 0.80s ease-in-out infinite; }
    .za-eq-3  { animation: za-eq3 0.55s ease-in-out infinite; }
    .za-eq-4  { animation: za-eq4 0.90s ease-in-out infinite; }
    .za-eq-5  { animation: za-eq5 0.70s ease-in-out infinite; }
    .za-eq-6  { animation: za-eq6 0.60s ease-in-out infinite; }
    .za-eq-7  { animation: za-eq7 0.85s ease-in-out infinite; }
    .za-eq-8  { animation: za-eq8 0.75s ease-in-out infinite; }
    .za-eq-9  { animation: za-eq9 0.95s ease-in-out infinite; }
    .za-eq-10 { animation: za-eq0 0.72s ease-in-out infinite; }

    /* ── Track title marquee ── */
    @keyframes za-scroll { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
    .za-marquee { animation: za-scroll 14s linear infinite; white-space: nowrap; }

    /* ── Scanlines ── */
    .za-crt::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: repeating-linear-gradient(
        0deg, transparent, transparent 2px,
        rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 4px
      );
      border-radius: inherit;
    }

    /* ── Brushed metal shell ── */
    .za-shell {
      background: linear-gradient(180deg,
        #1a2540 0%, #111c35 30%, #0d1628 60%, #111c35 80%, #1a2540 100%
      );
    }

    /* ── Button press ── */
    .za-btn:active { transform: scale(0.92); }

    /* ── Slider thumb ── */
    .za-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 3px;
      background: transparent;
      outline: none;
      cursor: pointer;
    }
    .za-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 9px;
      height: 15px;
      background: linear-gradient(180deg, #4a6fa5 0%, #2a4a7a 50%, #4a6fa5 100%);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 2px;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
    .za-slider::-moz-range-thumb {
      width: 9px; height: 15px;
      background: linear-gradient(180deg, #4a6fa5 0%, #2a4a7a 50%, #4a6fa5 100%);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 2px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Classic Winamp-style bevel border
function Bevel({
  children,
  inset = false,
  style,
  className = "",
}: {
  children?: React.ReactNode;
  inset?: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        border: inset
          ? "1px solid rgba(0,0,0,0.6)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: inset
          ? "inset 1px 1px 2px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.05)"
          : "1px 1px 2px rgba(0,0,0,0.5), -1px -1px 2px rgba(255,255,255,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// LCD-style seven-segment display for the time
function LcdTime({ time, color }: { time: string; color: string }) {
  return (
    <div
      style={{
        fontFamily: "'VT323', monospace",
        fontSize: "28px",
        lineHeight: "1",
        color,
        textShadow: `0 0 8px ${hexGlow(color, 0.9)}, 0 0 20px ${hexGlow(color, 0.5)}`,
        letterSpacing: "3px",
        userSelect: "none",
        minWidth: "60px",
      }}
    >
      {time}
    </div>
  );
}

// Winamp-style tiny label pill
function InfoPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1px",
        lineHeight: 1,
      }}
    >
      <span
        style={{
          fontFamily: "'VT323', monospace",
          fontSize: "8px",
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'VT323', monospace",
          fontSize: "11px",
          color,
          textShadow: `0 0 6px ${hexGlow(color, 0.7)}`,
          letterSpacing: "0.5px",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Spectrum EQ bars — 10 bars like Winamp
function SpectrumBars({
  active,
  color,
}: {
  active: boolean;
  color: string;
}) {
  const heights = [4, 9, 6, 11, 5, 8, 4, 7, 10, 6];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "1.5px",
        height: "18px",
        paddingBottom: "1px",
      }}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={active ? `za-eq-${i + 1}` : ""}
          style={{
            width: "3px",
            height: active ? undefined : `${heights[i]}px`,
            minHeight: "3px",
            backgroundColor: color,
            boxShadow: active ? `0 0 4px ${hexGlow(color, 0.7)}` : "none",
            borderRadius: "1px",
            opacity: active ? 1 : 0.25,
            transition: "opacity 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// Small Winamp-style square button (PL, EQ, ML)
function SquareBtn({
  label,
  active = false,
  onClick,
  color,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  color: string;
}) {
  return (
    <Bevel inset={active}>
      <button
        onClick={onClick}
        className="za-btn"
        style={{
          width: "24px",
          height: "15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active
            ? `linear-gradient(180deg, ${hexGlow(color, 0.3)}, ${hexGlow(color, 0.15)})`
            : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.2))",
          fontFamily: "'VT323', monospace",
          fontSize: "9px",
          color: active ? color : "rgba(255,255,255,0.55)",
          letterSpacing: "0.5px",
          cursor: "pointer",
          border: "none",
          textShadow: active ? `0 0 6px ${hexGlow(color, 0.8)}` : "none",
          transition: "all .15s",
          userSelect: "none",
        }}
      >
        {label}
      </button>
    </Bevel>
  );
}

// Classic round transport button
function TransportBtn({
  icon,
  onClick,
  isPrimary = false,
  color,
  disabled = false,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  isPrimary?: boolean;
  color: string;
  disabled?: boolean;
}) {
  return (
    <Bevel>
      <button
        onClick={onClick}
        disabled={disabled}
        className="za-btn"
        style={{
          width: isPrimary ? "34px" : "26px",
          height: isPrimary ? "22px" : "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isPrimary
            ? `linear-gradient(180deg, ${hexGlow(color, 0.25)}, ${hexGlow(color, 0.08)})`
            : "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.3))",
          cursor: disabled ? "not-allowed" : "pointer",
          border: "none",
          color: disabled ? "rgba(255,255,255,0.2)" : isPrimary ? color : "rgba(255,255,255,0.7)",
          opacity: disabled ? 0.4 : 1,
          boxShadow: isPrimary && !disabled ? `inset 0 0 8px ${hexGlow(color, 0.2)}` : undefined,
          transition: "all .15s",
          borderRadius: "2px",
        }}
      >
        {icon}
      </button>
    </Bevel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const RadioPlayer = memo(function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoplayed = useRef(false);
  const dragIdx = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [error, setError] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [ostExpanded, setOstExpanded] = useState(false);
  const [ostTracks, setOstTracks] = useState<{ url: string; name: string }[]>(
    (STATIONS[0].playlist || []).map((url, i) => ({
      url,
      name: STATIONS[0].trackNames?.[i] ?? `Track ${i + 1}`,
    }))
  );

  const current = STATIONS[stationIdx];

  // ── Get current URL — unchanged ──────────────────────────────────
  const getCurrentSrc = useCallback((sIdx: number, pIdx: number): string => {
    if (sIdx === 0) return ostTracks[Math.min(pIdx, ostTracks.length - 1)].url;
    const s = STATIONS[sIdx];
    if (s.playlist) return s.playlist[Math.min(pIdx, s.playlist.length - 1)];
    return s.url!;
  }, [ostTracks]);

  // ── Init audio — unchanged ────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.volume = volume;
    }
    return () => { audioRef.current?.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pause when AnthemWidget plays — mutual exclusion ─────────────
  useEffect(() => {
    const handle = () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    };
    window.addEventListener("zeezu:anthem-play", handle);
    return () => window.removeEventListener("zeezu:anthem-play", handle);
  }, []);

  // ── Time tracking ─────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setElapsed(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  // ── Load source on station change ────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = getCurrentSrc(stationIdx, subIdx);
    setError(false);
    setElapsed(0);
    setDuration(0);
    if (isPlaying) {
      audio.play().catch(() => setError(true));
      return;
    }
    // Landing-page autoplay — fires once, right after src is assigned
    if (window.location.pathname === "/" && !hasAutoplayed.current) {
      hasAutoplayed.current = true;
      audio.muted = true;
      audio.play()
        .then(() => {
          setIsPlaying(true);
          audio.muted = false;
          audio.volume = 0;
          let tick = 0;
          const fade = setInterval(() => {
            tick++;
            audio.volume = Math.min((0.4 / 24) * tick, 0.4);
            if (tick >= 24) clearInterval(fade);
          }, 50);
        })
        .catch(() => {
          audio.muted = false;
          window.addEventListener("pointerdown", () => {
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
          }, { once: true });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationIdx, subIdx]);

  // ── Auto-advance / end — unchanged ───────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => {
      if (stationIdx === 0) {
        if (subIdx < ostTracks.length - 1) setSubIdx(prev => prev + 1);
        else { setStationIdx(1); setSubIdx(0); }
        return;
      }
      const s = STATIONS[stationIdx];
      if (s.playlist && subIdx < s.playlist.length - 1) {
        setSubIdx(prev => prev + 1);
      } else {
        const next = (stationIdx + 1) % STATIONS.length;
        setStationIdx(next);
        setSubIdx(0);
      }
    };
    const onErr = () => setError(true);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationIdx, subIdx, ostTracks.length]);

  // ── Volume sync — unchanged ───────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);


  // ── Controls — unchanged ──────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          window.dispatchEvent(new CustomEvent("zeezu:radio-play"));
        })
        .catch(() => setError(true));
    }
  };

  const goNext = () => { setStationIdx((stationIdx + 1) % STATIONS.length); setSubIdx(0); };
  const goPrev = () => { setStationIdx((stationIdx - 1 + STATIONS.length) % STATIONS.length); setSubIdx(0); };

  const seekTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const t = parseFloat(e.target.value);
    audio.currentTime = t;
    setElapsed(t);
  };

  // ── Computed values ───────────────────────────────────────────────
  const glowColor = hexGlow(current.color, 0.5);
  const timeStr = fmtTime(elapsed);
  const seekPct = duration > 0 ? elapsed / duration : 0;
  const isStream = !STATIONS[stationIdx].playlist;

  // ─────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────
  // return (
  //   <div
  //     className="fixed bottom-[72px] md:bottom-6 lg:bottom-4 right-3 md:right-4 z-[200]"
  //     style={{ userSelect: "none" }}
  //   >
  // ─────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        right: "16px",
        /* 38px accounts for the 26px Marquee Ticker + 12px gap. 
           var(--mobile-dock-height) lifts it perfectly on mobile. */
        bottom: "calc(var(--mobile-dock-height, 0px) + 38px)",
        zIndex: 9999,
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end" /* Ensures the minimized circle anchors to the right */
      }}
    >
      {/* ══════════════════════════════════════════════════════════
          MINIMIZED — spinning Winamp logo disc
      ══════════════════════════════════════════════════════════ */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          title={`ZeeAmp: ${current.name}`}
          style={{
            position: "relative",
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            padding: 0,
            animation: isPlaying ? "vinyl-glow 2.4s linear infinite" : undefined,
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.12)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          {/* ── Vinyl disc — spins when playing ── */}
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            animation: isPlaying ? "vinyl-spin 2s linear infinite" : undefined,
            background: [
              // Groove rings
              "repeating-radial-gradient(circle at center, transparent 0px, transparent 5px, rgba(255,255,255,.025) 5px, rgba(255,255,255,.025) 5.8px, transparent 5.8px, transparent 11px)",
              // Holographic rainbow iridescence — rotates as vinyl spins giving sheen
              "conic-gradient(from 0deg, rgba(255,45,135,.28) 0%, rgba(0,247,255,.28) 25%, rgba(180,255,0,.28) 50%, rgba(255,215,0,.28) 75%, rgba(255,45,135,.28) 100%)",
              // Base vinyl dark
              "radial-gradient(circle, #1d0a18 0%, #0d0508 65%, #1a0810 100%)",
            ].join(","),
            boxShadow: isPlaying
              ? "none" // glow is on parent button
              : `0 0 12px 2px rgba(0,0,0,.7), 0 4px 18px rgba(0,0,0,.6)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
            {/* Highlight reflection — upper-left sheen */}
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "radial-gradient(ellipse at 32% 28%, rgba(255,255,255,.13) 0%, transparent 52%)",
              pointerEvents: "none",
            }} />

            {/* ── Center label ── */}
            <div style={{
              width: "19px",
              height: "19px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${current.color} 0%, ${hexGlow(current.color, 0.7)} 100%)`,
              boxShadow: `0 0 10px ${hexGlow(current.color, 0.9)}, inset 0 1px 2px rgba(255,255,255,.25)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 2,
              // Counter-spin the label so Z stays upright
              animation: isPlaying ? "vinyl-spin-r 2s linear infinite" : undefined,
            }}>
              <span style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "9px",
                fontWeight: 900,
                color: "#000",
                lineHeight: 1,
                letterSpacing: "-0.5px",
              }}>Z</span>
            </div>

            {/* Spindle hole */}
            <div style={{
              position: "absolute",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "#000",
              zIndex: 3,
            }} />
          </div>

          {/* Live pulse dot when playing */}
          {isPlaying && (
            <span style={{
              position: "absolute",
              top: "1px",
              right: "1px",
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: current.color,
              boxShadow: `0 0 8px ${current.color}`,
              animation: "pulse 1.4s ease-in-out infinite",
              zIndex: 10,
            }} />
          )}
        </button>
      )}

      {/* ══════════════════════════════════════════════════════════
          EXPANDED — ZeeAmp window
      ══════════════════════════════════════════════════════════ */}
      {/* {!isMinimized && (
        <div
          className="za-shell"
          style={{
            width: "274px",
            borderRadius: "6px",
            overflow: "hidden",
            boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 24px ${glowColor}, 0 8px 40px rgba(0,0,0,0.8)`,
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        > */}
      {!isMinimized && (
        <div
          className="za-shell"
          style={{
            width: "274px",
            borderRadius: "6px",
            overflow: "hidden",
            boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 24px ${glowColor}, 0 8px 40px rgba(0,0,0,0.8)`,
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            /* Prevents the player from stretching off the top of tiny mobile screens */
            maxHeight: "calc(100vh - var(--nav-height, 0px) - var(--mobile-dock-height, 0px) - 60px)"
          }}
        >
          {/* ── TITLE BAR ───────────────────────────────────── */}
          <div
            style={{
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 6px 0 8px",
              background: `linear-gradient(90deg, ${hexGlow(current.color, 0.35)}, rgba(255,45,135,0.2), rgba(11,75,143,0.3))`,
              borderBottom: "1px solid rgba(0,0,0,0.4)",
              cursor: "default",
            }}
          >
            {/* Left: title */}
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "8px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "3px",
                textTransform: "uppercase",
              }}
            >
              ZEE·AMP
            </span>

            {/* Right: window chrome buttons */}
            <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
              {/* Minimize */}
              <button
                onClick={() => setIsMinimized(true)}
                style={{
                  width: "12px",
                  height: "10px",
                  background: "linear-gradient(180deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))",
                  border: "1px solid rgba(0,0,0,0.5)",
                  borderRadius: "1px",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  cursor: "pointer",
                  paddingBottom: "1px",
                }}
              >
                <div style={{ width: "6px", height: "1px", background: "rgba(255,255,255,0.6)" }} />
              </button>
              {/* Shade (no-op) */}
              <button
                style={{
                  width: "12px",
                  height: "10px",
                  background: "linear-gradient(180deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))",
                  border: "1px solid rgba(0,0,0,0.5)",
                  borderRadius: "1px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: "6px", height: "5px", border: "1px solid rgba(255,255,255,0.5)", borderBottom: "none" }} />
              </button>
              {/* Close */}
              <button
                onClick={() => setIsMinimized(true)}
                style={{
                  width: "12px",
                  height: "10px",
                  background: "linear-gradient(180deg,rgba(255,80,80,0.4),rgba(200,20,20,0.2))",
                  border: "1px solid rgba(0,0,0,0.5)",
                  borderRadius: "1px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,180,180,0.9)",
                  fontSize: "7px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── MAIN DISPLAY BLOCK ──────────────────────────── */}
          <div
            className="za-crt"
            style={{
              position: "relative",
              margin: "4px 4px 2px",
              borderRadius: "3px",
              background: "#000a14",
              border: "1px solid rgba(0,0,0,0.8)",
              boxShadow: `inset 0 0 20px rgba(0,0,0,0.6), inset 0 0 6px ${hexGlow(current.color, 0.15)}`,
              padding: "6px 7px 5px",
              overflow: "hidden",
            }}
          >
            {/* Inner glow tint from station color */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse 80% 60% at 50% 20%, ${hexGlow(current.color, 0.07)}, transparent)`,
                pointerEvents: "none",
                borderRadius: "3px",
              }}
            />

            {/* Row 1: Time + Status badges + Spectrum */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "6px" }}>

              {/* Play indicator triangle + time */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: "10px",
                    color: isPlaying ? current.color : "rgba(255,255,255,0.25)",
                    textShadow: isPlaying ? `0 0 6px ${glowColor}` : "none",
                    lineHeight: 1,
                  }}
                >
                  {isPlaying ? "▶" : "⏸"}
                </span>
                <LcdTime time={timeStr} color={current.color} />
              </div>

              {/* Center: info pills stack */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <InfoPill label="KBPS" value={isStream ? "128" : "320"} color={current.color} />
                  <InfoPill label="KHZ" value="44" color={current.color} />
                </div>
                {/* STEREO / MONO badge */}
                <div
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: "9px",
                    color: current.color,
                    textShadow: `0 0 5px ${hexGlow(current.color, 0.6)}`,
                    letterSpacing: "1px",
                    background: hexGlow(current.color, 0.1),
                    border: `1px solid ${hexGlow(current.color, 0.3)}`,
                    borderRadius: "2px",
                    padding: "0 4px",
                    lineHeight: "14px",
                  }}
                >
                  STEREO
                </div>
              </div>

              {/* Spectrum EQ bars */}
              <div style={{ flexShrink: 0 }}>
                <SpectrumBars active={isPlaying} color={current.color} />
              </div>
            </div>

            {/* Row 2: Scrolling track title */}
            <div
              style={{
                marginTop: "5px",
                overflow: "hidden",
                height: "16px",
                background: hexGlow(current.color, 0.04),
                borderRadius: "2px",
                border: `1px solid ${hexGlow(current.color, 0.15)}`,
              }}
            >
              {error ? (
                <span
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: "12px",
                    color: "#ff4444",
                    letterSpacing: "1px",
                    lineHeight: "16px",
                    padding: "0 6px",
                  }}
                >
                  STREAM ERROR — TRY NEXT STATION
                </span>
              ) : (
                <span
                  className="za-marquee"
                  style={{
                    display: "block",
                    fontFamily: "'VT323', monospace",
                    fontSize: "13px",
                    color: current.color,
                    textShadow: `0 0 6px ${hexGlow(current.color, 0.7)}`,
                    letterSpacing: "2px",
                    lineHeight: "16px",
                    paddingLeft: "6px",
                  }}
                >
                  {(() => {
                    const trackName = stationIdx === 0
                      ? (ostTracks[subIdx]?.name ?? current.name)
                      : (current.trackNames?.[subIdx] ?? current.name);
                    const chunk = `${trackName}  •  ${current.name}  •  ${isPlaying ? "NOW PLAYING" : "PAUSED"}  •  `;
                    return chunk + chunk;
                  })()}
                </span>
              )}
            </div>
          </div>

          {/* ── SEEK BAR ────────────────────────────────────── */}
          <div style={{ padding: "2px 6px 1px" }}>
            <div
              style={{
                position: "relative",
                height: "8px",
                background: "linear-gradient(180deg,rgba(0,0,0,0.6),rgba(255,255,255,0.03))",
                border: "1px solid rgba(0,0,0,0.5)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              {/* Fill bar */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${seekPct * 100}%`,
                  background: `linear-gradient(90deg, ${hexGlow(current.color, 0.6)}, ${current.color})`,
                  boxShadow: `2px 0 6px ${hexGlow(current.color, 0.8)}`,
                  transition: "width 0.3s linear",
                  pointerEvents: "none",
                }}
              />
              {/* Range input overlay */}
              <input
                type="range"
                className="za-slider"
                min={0}
                max={duration || 100}
                step={0.5}
                value={elapsed}
                onChange={seekTo}
                disabled={isStream || !duration}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: isStream || !duration ? "default" : "pointer",
                }}
              />
            </div>
          </div>

          {/* ── TRANSPORT + VOLUME ROW ───────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "3px 6px 3px",
              gap: "3px",
            }}
          >
            {/* Transport buttons */}
            <TransportBtn
              icon={<span style={{ fontSize: "9px" }}>⏮</span>}
              onClick={goPrev}
              color={current.color}
            />
            <TransportBtn
              icon={<span style={{ fontSize: "10px", color: current.color }}>▶</span>}
              onClick={togglePlay}
              isPrimary
              color={current.color}
            />
            <TransportBtn
              icon={<span style={{ fontSize: "10px" }}>⏸</span>}
              onClick={togglePlay}
              color={current.color}
            />
            <TransportBtn
              icon={<span style={{ fontSize: "9px" }}>⏹</span>}
              onClick={() => {
                audioRef.current?.pause();
                if (audioRef.current) audioRef.current.currentTime = 0;
                setIsPlaying(false);
                setElapsed(0);
              }}
              color={current.color}
            />
            <TransportBtn
              icon={<span style={{ fontSize: "9px" }}>⏭</span>}
              onClick={goNext}
              color={current.color}
            />

            {/* Gap */}
            <div style={{ flex: 1 }} />

            {/* Mute button */}
            <TransportBtn
              icon={
                <span style={{ fontSize: "9px" }}>
                  {isMuted ? "🔇" : "🔊"}
                </span>
              }
              onClick={() => setIsMuted(v => !v)}
              color={current.color}
            />

            {/* Volume slider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                width: "60px",
                height: "16px",
                background: "linear-gradient(180deg,rgba(0,0,0,0.5),rgba(255,255,255,0.03))",
                border: "1px solid rgba(0,0,0,0.4)",
                borderRadius: "2px",
                padding: "0 4px",
                position: "relative",
              }}
            >
              {/* Volume fill */}
              <div
                style={{
                  position: "absolute",
                  left: "4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: "3px",
                  width: `${(isMuted ? 0 : volume) * 52}px`,
                  background: current.color,
                  boxShadow: `0 0 4px ${hexGlow(current.color, 0.6)}`,
                  borderRadius: "1px",
                  pointerEvents: "none",
                  transition: "width 0.15s",
                }}
              />
              <input
                type="range"
                className="za-slider"
                min={0} max={1} step={0.05}
                value={isMuted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                style={{ width: "100%", position: "relative", zIndex: 1 }}
              />
            </div>
          </div>

          {/* ── STATION SELECTOR + PL/EQ/ML BUTTONS ─────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "2px 6px 4px",
              borderTop: "1px solid rgba(0,0,0,0.3)",
              background: "rgba(0,0,0,0.15)",
            }}
          >
            {/* Station dots */}
            <div style={{ display: "flex", gap: "3px", alignItems: "center", flexWrap: "wrap", maxWidth: "150px" }}>
              {STATIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { setStationIdx(i); setSubIdx(0); }}
                  title={s.name}
                  style={{
                    width: i === stationIdx ? "8px" : "5px",
                    height: i === stationIdx ? "8px" : "5px",
                    borderRadius: "50%",
                    background: s.color,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: i === stationIdx
                      ? `0 0 6px ${hexGlow(s.color, 0.9)}, 0 0 12px ${hexGlow(s.color, 0.5)}`
                      : "none",
                    opacity: i === stationIdx ? 1 : 0.3,
                    transition: "all .2s",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>

            {/* Right panel buttons: EQ PL ML + CONFIG lightning */}
            <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
              <SquareBtn label="EQ" active={showEq} onClick={() => setShowEq(v => !v)} color={current.color} />
              <SquareBtn label="PL" active={showPlaylist} onClick={() => setShowPlaylist(v => !v)} color={current.color} />
              <SquareBtn label="ML" color={current.color} />
              {/* CONFIG / lightning bolt */}
              <div style={{ marginLeft: "3px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px" }}>
                <span
                  style={{
                    fontFamily: "'VT323',monospace",
                    fontSize: "7px",
                    color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.5px",
                  }}
                >
                  CONFIG
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: current.color,
                    textShadow: `0 0 6px ${hexGlow(current.color, 0.7)}`,
                    lineHeight: 1,
                  }}
                >
                  ⚡
                </span>
              </div>
            </div>
          </div>

          {/* ── PLAYLIST PANEL (PL toggle) ───────────────────── */}
          {showPlaylist && (
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.5)", background: "#050e1a", maxHeight: "180px", overflowY: "auto" }}>
              {/* Header */}
              <div style={{ padding: "3px 7px 2px", background: `linear-gradient(90deg, ${hexGlow(current.color, 0.2)}, transparent)`, borderBottom: "1px solid rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "2px" }}>PLAYLIST</span>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,0.25)", letterSpacing: "1px" }}>{STATIONS.length} STATIONS</span>
              </div>

              {STATIONS.map((s, i) => (
                <div key={s.id}>
                  {/* Station row */}
                  <button
                    onClick={() => {
                      if (i === 0) { setOstExpanded(v => !v); setStationIdx(0); setSubIdx(0); }
                      else { setStationIdx(i); setSubIdx(0); setOstExpanded(false); }
                    }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", background: i === stationIdx ? hexGlow(s.color, 0.12) : "transparent", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,0.25)", width: "14px", textAlign: "right", letterSpacing: "0.5px" }}>{i + 1}.</span>
                    <span style={{ flex: 1, fontFamily: "'VT323',monospace", fontSize: "11px", color: i === stationIdx ? s.color : "rgba(255,255,255,0.5)", textShadow: i === stationIdx ? `0 0 6px ${hexGlow(s.color, 0.5)}` : "none", letterSpacing: "1.5px", textAlign: "left", transition: "color .15s" }}>
                      {s.name}
                    </span>
                    {i === 0 && (
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", transform: ostExpanded ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", transition: "transform .15s" }}>▶</span>
                    )}
                    {i === stationIdx && i !== 0 && isPlaying && <SpectrumBars active color={s.color} />}
                  </button>

                  {/* OST track sublist — only for station 0 */}
                  {i === 0 && ostExpanded && (
                    <div style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(0,0,0,0.4)" }}>
                      {ostTracks.map((track, ti) => {
                        const isActive = stationIdx === 0 && subIdx === ti;
                        return (
                          <div
                            key={ti}
                            draggable
                            onDragStart={() => { dragIdx.current = ti; }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={() => {
                              if (dragIdx.current === null || dragIdx.current === ti) return;
                              const from = dragIdx.current;
                              const reordered = [...ostTracks];
                              const [moved] = reordered.splice(from, 1);
                              reordered.splice(ti, 0, moved);
                              // keep playhead on the same track
                              if (stationIdx === 0) {
                                const playingUrl = ostTracks[subIdx].url;
                                setSubIdx(reordered.findIndex(t => t.url === playingUrl));
                              }
                              setOstTracks(reordered);
                              dragIdx.current = null;
                            }}
                            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 8px 3px 22px", borderBottom: "1px solid rgba(255,255,255,0.02)", cursor: "grab", background: isActive ? hexGlow(s.color, 0.1) : "transparent" }}
                          >
                            {/* Drag handle */}
                            <span style={{ color: "rgba(255,255,255,0.18)", fontSize: "9px", letterSpacing: "-1px", userSelect: "none", flexShrink: 0 }}>⠿</span>
                            {/* Track number */}
                            <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)", width: "12px", textAlign: "right", flexShrink: 0 }}>{ti + 1}.</span>
                            {/* Track name — click to play */}
                            <button
                              onClick={() => { setStationIdx(0); setSubIdx(ti); if (!isPlaying) audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {}); }}
                              style={{ flex: 1, fontFamily: "'VT323',monospace", fontSize: "11px", color: isActive ? s.color : "rgba(255,255,255,0.45)", textShadow: isActive ? `0 0 6px ${hexGlow(s.color, 0.6)}` : "none", letterSpacing: "1px", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color .15s" }}>
                              {track.name}
                            </button>
                            {isActive && isPlaying && <SpectrumBars active color={s.color} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── EQ PANEL (EQ toggle) ─────────────────────────── */}
          {showEq && (
            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.5)",
                background: "#050e1a",
                padding: "6px 8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "2px" }}>
                  EQUALIZER
                </span>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>
                  VISUAL ONLY
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "36px", justifyContent: "space-between" }}>
                {["60", "170", "310", "600", "1K", "3K", "6K", "12K", "14K", "16K"].map((label, i) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <div
                      className={`za-eq-${i + 1}`}
                      style={{
                        width: "5px",
                        background: `linear-gradient(180deg, ${current.color}, ${hexGlow(current.color, 0.4)})`,
                        borderRadius: "2px 2px 0 0",
                        boxShadow: `0 0 4px ${hexGlow(current.color, 0.5)}`,
                        animationPlayState: isPlaying ? "running" : "paused",
                        opacity: isPlaying ? 1 : 0.25,
                      }}
                    />
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "7px", color: "rgba(255,255,255,0.2)" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.28} }
      `}</style>
    </div>
  );
});

export default RadioPlayer;