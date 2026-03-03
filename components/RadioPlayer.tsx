"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Disc3, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ChevronDown } from "lucide-react";

// ── Station data (matches spec exactly) ───────────────────────────────
type Station = {
  id: string;
  name: string;
  color: string;
  url?: string;
  playlist?: string[];
};

const STATIONS: Station[] = [
  {
    id: 'ost',
    name: "OST // ZEEZU",
    color: "#fcee0a",
    playlist: [
      "https://dl.dropboxusercontent.com/scl/fi/uz72n6eqlmke36p2xxi1i/KxH-TTR.mp3?rlkey=fsx2dlmlvgidh5s7upenk93vm&e=1&st=hr4rm7of&",
    ],
  },
  { id: 'chillsynth', name: "CHILLSYNTH", url: "https://stream.rekt.network/chillsynth.mp3", color: "#00f3ff" },
  { id: 'nightride', name: "NIGHTRIDE FM", url: "https://stream.rekt.network/nightride.mp3", color: "#ff00ff" },
  { id: 'darksynth', name: "DARKSYNTH", url: "https://stream.rekt.network/darksynth.mp3", color: "#ff003c" },
  { id: 'datawave', name: "DATAWAVE", url: "https://stream.rekt.network/datawave.mp3", color: "#0aff00" },
  { id: 'ebsm', name: "EBSM", url: "https://stream.rekt.network/ebsm.mp3", color: "#ff6600" },
  { id: 'horrorsynth', name: "HORRORSYNTH", url: "https://stream.rekt.network/horrorsynth.mp3", color: "#9900ff" },
  { id: 'spacesynth', name: "SPACESYNTH FM", url: "https://stream.rekt.network/spacesynth.mp3", color: "#0066ff" },
];

// ── Hex → rgba for glow ──────────────────────────────────────────────
function hexGlow(hex: string, alpha = 0.35): string {
  const c = hex.replace('#', '');
  return `rgba(${parseInt(c.slice(0, 2), 16)},${parseInt(c.slice(2, 4), 16)},${parseInt(c.slice(4, 6), 16)},${alpha})`;
}

// ── EQ bar animation CSS (injected once) ────────────────────────────
const EQ_STYLE_ID = 'radio-eq-style';
if (typeof document !== 'undefined' && !document.getElementById(EQ_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = EQ_STYLE_ID;
  s.textContent = `
    @keyframes eq1 { 0%,100%{height:4px} 50%{height:12px} }
    @keyframes eq2 { 0%,100%{height:10px} 50%{height:4px} }
    @keyframes eq3 { 0%,100%{height:7px} 30%{height:14px} 70%{height:4px} }
    .eq-bar-1 { animation: eq1 0.7s ease-in-out infinite; }
    .eq-bar-2 { animation: eq2 0.9s ease-in-out infinite; }
    .eq-bar-3 { animation: eq3 0.6s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ── Component ──────────────────────────────────────────────────────────
export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0); // playlist cursor
  const [volume, setVolume] = useState(0.4);
  const [error, setError] = useState(false);

  const current = STATIONS[stationIdx];

  // ── Get current URL ────────────────────────────────────────────────
  const getCurrentSrc = useCallback((sIdx: number, pIdx: number): string => {
    const s = STATIONS[sIdx];
    if (s.playlist) return s.playlist[Math.min(pIdx, s.playlist.length - 1)];
    return s.url!;
  }, []);

  // ── Init audio element once ────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.volume = volume;
    }
    return () => {
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load source when station changes ──────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const src = getCurrentSrc(stationIdx, subIdx);
    audio.src = src;
    setError(false);
    if (isPlaying) {
      audio.play().catch(() => setError(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationIdx, subIdx]);

  // ── Auto-advance playlist / next station on track end ─────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnd = () => {
      const s = STATIONS[stationIdx];
      if (s.playlist && subIdx < s.playlist.length - 1) {
        setSubIdx(prev => prev + 1);
      } else {
        // Go to next station
        const next = (stationIdx + 1) % STATIONS.length;
        setStationIdx(next);
        setSubIdx(0);
      }
    };

    const onError = () => setError(true);

    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, [stationIdx, subIdx]);

  // ── Volume sync ────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // ── Controls ──────────────────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setError(true));
    }
  };

  const goNext = () => {
    const next = (stationIdx + 1) % STATIONS.length;
    setStationIdx(next);
    setSubIdx(0);
  };

  const goPrev = () => {
    const prev = (stationIdx - 1 + STATIONS.length) % STATIONS.length;
    setStationIdx(prev);
    setSubIdx(0);
  };

  // ── Render ────────────────────────────────────────────────────────
  const glowColor = hexGlow(current.color, 0.4);
  const glowShadow = `0 0 20px ${glowColor}, 0 4px 20px rgba(0,0,0,0.7)`;

  return (
    <div
      className="fixed bottom-20 md:bottom-4 right-4 z-[200] transition-all duration-300"
      style={{ filter: isMinimized ? 'none' : `drop-shadow(0 0 12px ${glowColor})` }}
    >
      {/* ── MINIMIZED: spinning disc pill ── */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 rounded-full bg-black/90 border flex items-center justify-center transition-all hover:scale-110"
          style={{
            borderColor: current.color,
            boxShadow: glowShadow,
          }}
          title={`Radio: ${current.name}`}
        >
          <Disc3
            className={`w-5 h-5 transition-all ${isPlaying ? 'animate-spin' : ''}`}
            style={{ color: current.color }}
          />
          {/* Live dot */}
          {isPlaying && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: current.color }}
            />
          )}
        </button>
      )}

      {/* ── EXPANDED: rave pill player ── */}
      {!isMinimized && (
        <div
          className="w-72 rounded-2xl bg-black/95 border overflow-hidden backdrop-blur-xl"
          style={{
            borderColor: current.color,
            boxShadow: glowShadow,
          }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: `${current.color}30`, backgroundColor: `${current.color}10` }}
          >
            <div className="flex items-center gap-2">
              {/* EQ bars */}
              <div className="flex items-end gap-[2px] h-4">
                {isPlaying ? (
                  <>
                    <div className="w-[3px] rounded-full eq-bar-1" style={{ backgroundColor: current.color }} />
                    <div className="w-[3px] rounded-full eq-bar-2" style={{ backgroundColor: current.color }} />
                    <div className="w-[3px] rounded-full eq-bar-3" style={{ backgroundColor: current.color }} />
                  </>
                ) : (
                  <>
                    {[4, 8, 5].map((h, i) => (
                      <div key={i} className="w-[3px] rounded-full opacity-30" style={{ height: `${h}px`, backgroundColor: current.color }} />
                    ))}
                  </>
                )}
              </div>
              <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em]" style={{ color: current.color }}>
                LIVE RADIO
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-500 hover:text-white transition-colors p-1 rounded"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Station info */}
          <div className="px-4 pt-4 pb-2">
            <div
              className="text-sm font-black tracking-tight truncate"
              style={{ color: current.color, textShadow: `0 0 10px ${glowColor}` }}
            >
              {current.name}
            </div>
            {error ? (
              <p className="text-[10px] text-red-400 font-mono mt-0.5">Stream error — try next station</p>
            ) : (
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                {isPlaying ? '▶ streaming...' : '⏸ paused'}
              </p>
            )}
          </div>

          {/* Station selector dots */}
          {/* <div className="px-4 pb-2 flex gap-1 flex-wrap">
            {STATIONS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setStationIdx(i); setSubIdx(0); }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i === stationIdx ? s.color : '#333',
                  boxShadow:       i === stationIdx ? `0 0 6px ${hexGlow(s.color, 0.8)}` : 'none',
                  transform:       i === stationIdx ? 'scale(1.4)' : 'scale(1)',
                }}
                title={s.name}
              />
            ))}
          </div> */}

          {/* Controls */}
          <div className="px-4 pb-4 flex items-center gap-3">
            <button onClick={goPrev} className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5">
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{
                backgroundColor: `${current.color}20`,
                border: `1px solid ${current.color}60`,
                boxShadow: isPlaying ? `0 0 15px ${glowColor}` : 'none',
              }}
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-white" />
                : <Play className="w-4 h-4 text-white ml-0.5" />
              }
            </button>

            <button onClick={goNext} className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5">
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Mute + Volume */}
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setIsMuted(v => !v)} className="text-gray-500 hover:text-white transition-colors">
                {isMuted
                  ? <VolumeX className="w-3.5 h-3.5" />
                  : <Volume2 className="w-3.5 h-3.5" />
                }
              </button>
              <input
                type="range"
                min={0} max={1} step={0.05}
                value={isMuted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="w-16 accent-current h-1"
                style={{ accentColor: current.color }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}