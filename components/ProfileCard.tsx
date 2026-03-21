"use client";
import React, { useEffect, useRef, useCallback, useMemo } from 'react';

// ── Inject CSS once ───────────────────────────────────────────────────
const STYLE_ID = 'pc-y2k-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

    @property --y2k-angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }

    @keyframes pc-border-spin { to { --y2k-angle: 360deg; } }
    @keyframes pc-holo {
      0%   { background-position: 0% var(--bg-y), 0 0; }
      100% { background-position: 0% var(--bg-y), 90% 90%; }
    }
    @keyframes pc-glow-pulse  { 0%,100% { opacity: 0.5; } 50% { opacity: 0.88; } }
    @keyframes pc-enter {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);    }
    }
    @keyframes pc-online-ping {
      0%,100% { transform: scale(1);   opacity: 1;   }
      60%     { transform: scale(1.7); opacity: 0.4; }
    }
    @keyframes pc-tier-shine {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes pc-bar-grow {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
    @keyframes pc-hex-breathe { 0%,100% { opacity: 0.82; } 50% { opacity: 1; } }
    @keyframes pc-hex-in {
      from { opacity: 0; transform: scale(0.7) translateY(5px); }
      to   { opacity: 1; transform: scale(1)   translateY(0);   }
    }
    @keyframes pc-chrome-sweep {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes pc-cursor-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes pc-star-pulse {
      0%,100% { opacity: 1;    transform: scale(1)    rotate(0deg);  }
      50%     { opacity: 0.32; transform: scale(0.52) rotate(60deg); }
    }
    @keyframes pc-glitch {
      0%, 89%, 100% { clip-path: none; transform: translateX(0);   }
      90%  { clip-path: polygon(0 10%, 100% 10%, 100% 32%, 0 32%); transform: translateX(-3px); }
      92%  { clip-path: polygon(0 58%, 100% 58%, 100% 78%, 0 78%); transform: translateX(3px);  }
      94%  { clip-path: polygon(0 82%, 100% 82%, 100% 96%, 0 96%); transform: translateX(-1px); }
    }
    @keyframes pc-scanline {
      from { transform: translateY(-100%); }
      to   { transform: translateY(400%);  }
    }
    @keyframes pc-corner-flash {
      0%,100% { opacity: 0.65; }
      50%     { opacity: 1; filter: brightness(1.5); }
    }

    .pc-wrap        { animation: pc-enter 0.55s cubic-bezier(0.22,1,0.36,1) both; }
    .pc-glow        { animation: pc-glow-pulse 3.5s ease-in-out infinite; }
    .pc-online      { animation: pc-online-ping 2.8s ease-in-out infinite; }
    .pc-tier-shine  {
      background: linear-gradient(90deg, currentColor 0%, rgba(255,255,255,0.9) 35%, currentColor 55%, rgba(255,255,255,0.7) 75%, currentColor 100%);
      background-size: 200% auto;
      -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
      animation: pc-tier-shine 3.5s linear infinite;
    }
    .pc-bar { transform-origin: left center; animation: pc-bar-grow 0.9s cubic-bezier(0.22,1,0.36,1) both; }
    .pc-bar:nth-child(1) { animation-delay: 0.35s; }
    .pc-bar:nth-child(2) { animation-delay: 0.50s; }
    .pc-bar:nth-child(3) { animation-delay: 0.65s; }
    .pc-hex-wrap  { animation: pc-hex-breathe 3.8s ease-in-out infinite; }
    .pc-hex-item  { animation: pc-hex-in 0.45s cubic-bezier(0.22,1,0.36,1) both; }

    .pc-chrome-text {
      background: linear-gradient(90deg,
        #b0b0e0 0%, #dcdcff 16%, #ffffff 32%,
        #9090c0 48%, #ffffff 62%,
        #c8c8f0 78%, #b8b8e8 100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
      animation: pc-chrome-sweep 4.2s linear infinite;
    }
    .pc-name-glitch { animation: pc-glitch 11s ease-in-out infinite; animation-delay: 5s; }
    .pc-star-a { animation: pc-star-pulse 2.1s  ease-in-out infinite; }
    .pc-star-b { animation: pc-star-pulse 1.75s ease-in-out infinite 0.35s; }
    .pc-star-c { animation: pc-star-pulse 2.55s ease-in-out infinite 0.85s; }
    .pc-cursor { animation: pc-cursor-blink 1s step-end infinite; }
    .pc-rainbow-ring {
      background: conic-gradient(
        from var(--y2k-angle),
        #FF0080 0%, #FF6600 13%, #FFFF00 26%,
        #00FF44 39%, #00FFFF 52%, #0066FF 65%,
        #AA00FF 78%, #FF0080 100%
      );
      animation: pc-border-spin 4.5s linear infinite;
    }
    .pc-scanline-beam { animation: pc-scanline 9s linear infinite; }
    .pc-corner-blink  { animation: pc-corner-flash 3s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────
export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface HexItem {
  key: string;
  label: string;
  iconType: ZodiacSign | 'age' | 'gender' | 'height' | 'location' | 'relationship' | 'lookingFor' | 'birthday';
  color: string;
  glow: string;
}

export interface ProfileCardProps {
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  isOnline?: boolean;
  onlineStatus?: 'online' | 'busy' | 'away' | 'offline';
  influenceTier?: 'User' | 'Rising' | 'Icon' | 'Legendary';
  influenceScore?: number;
  trustScore?: number;
  coolScore?: number;
  sexyScore?: number;
  hexItems?: HexItem[];
  zodiac?: ZodiacSign;
  birthday?: string;
  height?: string;
  location?: string;
  pronouns?: string;
  lookingFor?: string;
  avatarUrl?: string;
  miniAvatarUrl?: string;
  iconUrl?: string;
  grainUrl?: string;
  innerGradient?: string;
  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: string;
  className?: string;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  showUserInfo?: boolean;
  contactText?: string;
  onContactClick?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────
const clamp = (v: number, lo = 0, hi = 100) => Math.min(Math.max(v, lo), hi);
const round = (v: number, p = 3) => parseFloat(v.toFixed(p));
const lerp = (v: number, f0: number, f1: number, t0: number, t1: number) =>
  round(t0 + ((t1 - t0) * (v - f0)) / (f1 - f0));

const CARD_ASPECT = 0.718;
const CARD_RADIUS = '10px';
const DEFAULT_GRADIENT = 'linear-gradient(155deg, #07001c 0%, #0b0028 40%, #000c1e 100%)';
const CFG = {
  INIT_DURATION: 1200,
  INIT_X_OFFSET: 70,
  INIT_Y_OFFSET: 60,
  BETA_OFFSET: 20,
  ENTER_MS: 180,
} as const;

// ── Tier visual metadata ──────────────────────────────────────────────
const TIER: Record<string, { badge: string; color: string; glow: string }> = {
  Legendary: { badge: '✦ LEGENDARY ✦', color: '#FFD700', glow: 'rgba(255,215,0,0.55)' },
  Icon: { badge: '★ ICON ★', color: '#FF2D87', glow: 'rgba(255,45,135,0.45)' },
  Rising: { badge: '↑ RISING', color: '#00FFFF', glow: 'rgba(0,255,255,0.40)' },
  User: { badge: '· USER', color: '#aaaacc', glow: 'rgba(170,170,204,0.20)' },
};

// ── Vibe metadata ─────────────────────────────────────────────────────
const VIBES = [
  { key: 'trustScore' as const, label: 'TRUST', color: '#B4FF00', shadow: 'rgba(180,255,0,0.65)' },
  { key: 'coolScore' as const, label: 'COOL', color: '#00F7FF', shadow: 'rgba(0,247,255,0.65)' },
  { key: 'sexyScore' as const, label: 'SEXY', color: '#FF2D87', shadow: 'rgba(255,45,135,0.65)' },
];

// ── Zodiac data ───────────────────────────────────────────────────────
const ZODIAC_DATA: Record<ZodiacSign, { name: string; sym: string; color: string; glow: string }> = {
  aries: { name: 'Aries', sym: '♈', color: '#FF6B35', glow: 'rgba(255,107,53,0.5)' },
  taurus: { name: 'Taurus', sym: '♉', color: '#B4FF00', glow: 'rgba(180,255,0,0.5)' },
  gemini: { name: 'Gemini', sym: '♊', color: '#00F7FF', glow: 'rgba(0,247,255,0.5)' },
  cancer: { name: 'Cancer', sym: '♋', color: '#B44FFF', glow: 'rgba(180,79,255,0.5)' },
  leo: { name: 'Leo', sym: '♌', color: '#FFD700', glow: 'rgba(255,215,0,0.5)' },
  virgo: { name: 'Virgo', sym: '♍', color: '#B4FF00', glow: 'rgba(180,255,0,0.5)' },
  libra: { name: 'Libra', sym: '♎', color: '#00F7FF', glow: 'rgba(0,247,255,0.5)' },
  scorpio: { name: 'Scorpio', sym: '♏', color: '#B44FFF', glow: 'rgba(180,79,255,0.5)' },
  sagittarius: { name: 'Sagittarius', sym: '♐', color: '#FF6B35', glow: 'rgba(255,107,53,0.5)' },
  capricorn: { name: 'Capricorn', sym: '♑', color: '#B4FF00', glow: 'rgba(180,255,0,0.5)' },
  aquarius: { name: 'Aquarius', sym: '♒', color: '#00F7FF', glow: 'rgba(0,247,255,0.5)' },
  pisces: { name: 'Pisces', sym: '♓', color: '#B44FFF', glow: 'rgba(180,79,255,0.5)' },
};

const HEX_PTS = '18,2 32,10 32,26 18,34 4,26 4,10';

// ── Zodiac SVG paths ──────────────────────────────────────────────────
const ZODIAC_PATHS: Record<ZodiacSign, React.ReactNode> = {
  aries: (<><path d="M12 20 L12 11" /><path d="M12 11 C10 8 5 3 3 7 C2 10 7 12 12 11" /><path d="M12 11 C14 8 19 3 21 7 C22 10 17 12 12 11" /></>),
  taurus: (<><circle cx="12" cy="15" r="5" /><path d="M7 11 Q5 6 5 4" /><path d="M17 11 Q19 6 19 4" /></>),
  gemini: (<><line x1="8" y1="5" x2="8" y2="19" /><line x1="16" y1="5" x2="16" y2="19" /><line x1="8" y1="5" x2="16" y2="5" /><line x1="8" y1="19" x2="16" y2="19" /></>),
  cancer: (<><path d="M5 9 A7 5 0 0 1 19 9" /><circle cx="19.5" cy="9" r="1.5" fill="currentColor" /><path d="M19 15 A7 5 0 0 1 5 15" /><circle cx="4.5" cy="15" r="1.5" fill="currentColor" /></>),
  leo: (<><circle cx="15" cy="16" r="4.5" /><path d="M10.5 16 Q9 13 9 10 Q9 5 12 3.5 Q15 2 16 5 Q17 8 14.5 10 Q12 12 10.5 16" /></>),
  virgo: (<><line x1="5" y1="5" x2="5" y2="19" /><line x1="11" y1="5" x2="11" y2="19" /><path d="M5 11 Q5 3 8 3 Q11 3 11 8" /><path d="M11 10 Q11 3 14 3 Q17 3 17 8 Q17 15 20 19" /></>),
  libra: (<><line x1="4" y1="15" x2="20" y2="15" /><line x1="4" y1="20" x2="20" y2="20" /><path d="M4 15 Q12 5 20 15" /></>),
  scorpio: (<><path d="M4 6 L4 18 Q4 21 7 21 L20 21" /><path d="M18 19 L20 21 L18 23" /><line x1="10" y1="6" x2="10" y2="21" /></>),
  sagittarius: (<><line x1="5" y1="19" x2="19" y2="5" /><polyline points="12,5 19,5 19,12" /></>),
  capricorn: (<><path d="M4 5 L4 17 Q4 21 8 21 Q12 21 12 16 Q12 11 17 11 Q21 11 21 16" /></>),
  aquarius: (<><path d="M3 10 Q6 7 9 10 Q12 13 15 10 Q18 7 21 10" /><path d="M3 16 Q6 13 9 16 Q12 19 15 16 Q18 13 21 16" /></>),
  pisces: (<><path d="M8 3 Q4 8 4 12 Q4 16 8 21" /><path d="M16 3 Q20 8 20 12 Q20 16 16 21" /><line x1="8" y1="12" x2="16" y2="12" /></>),
};

// ── Non-zodiac info icons ─────────────────────────────────────────────
const INFO_ICONS: Record<string, React.ReactNode> = {
  birthday: (<polygon points="12,2 14.6,8.5 21.8,8.9 16.3,13.4 18.2,20.5 12,16.7 5.8,20.5 7.7,13.4 2.2,8.9 9.4,8.5" />),
  age: (<><circle cx="12" cy="12" r="9" /><polyline points="12,7 12,12 16,14" /></>),
  gender: (<><circle cx="12" cy="7" r="4" /><path d="M5.5 21c0-3.5 3-6.5 6.5-6.5s6.5 3 6.5 6.5" /></>),
  height: (<><line x1="12" y1="3" x2="12" y2="21" /><polyline points="9,6 12,3 15,6" /><polyline points="9,18 12,21 15,18" /><line x1="8" y1="10" x2="14" y2="10" /><line x1="8" y1="14" x2="14" y2="14" /></>),
  location: (<><path d="M12 2C8.69 2 6 4.69 6 8c0 5.25 6 14 6 14s6-8.75 6-14c0-3.31-2.69-6-6-6z" fill="rgba(255,255,255,0.1)" /><circle cx="12" cy="8.5" r="2.5" fill="currentColor" /></>),
  relationship: (<path d="M12 21C12 21 3.5 13.5 3.5 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21.5 13.5 12 21 12 21z" fill="rgba(255,255,255,0.12)" />),
  lookingFor: (<><circle cx="11" cy="11" r="7" /><line x1="16" y1="16" x2="22" y2="22" /></>),
};

function getHexIcon(iconType: string): React.ReactNode {
  if (iconType in ZODIAC_PATHS) return ZODIAC_PATHS[iconType as ZodiacSign];
  return INFO_ICONS[iconType] || INFO_ICONS.age;
}

// ── Component ─────────────────────────────────────────────────────────
const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  name = 'Anonymous',
  title = 'ZID-????',
  handle = '',
  status = '',
  isOnline = true,
  onlineStatus,
  influenceTier = 'User',
  influenceScore = 0,
  trustScore = 0,
  coolScore = 0,
  sexyScore = 0,
  hexItems,
  zodiac,
  birthday,
  height,
  location,
  pronouns,
  lookingFor,
  avatarUrl = '',
  miniAvatarUrl,
  iconUrl = '',
  grainUrl = '',
  innerGradient,
  behindGlowEnabled = true,
  behindGlowColor = 'rgba(255,45,135,0.65)',
  behindGlowSize = '55%',
  className = '',
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  showUserInfo = true,
  contactText = '⚡ Buzz',
  onContactClick,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const enterTimer = useRef<number | null>(null);
  const leaveRaf = useRef<number | null>(null);

  // ── Derived ──────────────────────────────────────────────────────
  const tier = TIER[influenceTier] ?? TIER.User;

  // Online status — onlineStatus prop takes priority over isOnline boolean
  const STATUS_META = {
    online:  { color: '#B4FF00', glow: '0 0 6px #B4FF00, 0 0 12px rgba(180,255,0,0.5)', label: 'ONLINE',  pulse: true  },
    busy:    { color: '#F97316', glow: '0 0 6px #F97316, 0 0 12px rgba(249,115,22,0.5)', label: 'BUSY',    pulse: true  },
    away:    { color: '#F59E0B', glow: '0 0 4px #F59E0B',                                label: 'AWAY',    pulse: false },
    offline: { color: '#6B7280', glow: 'none',                                            label: 'OFFLINE', pulse: false },
  };
  const resolvedStatus = onlineStatus ?? (isOnline ? 'online' : 'offline');
  const statusMeta = STATUS_META[resolvedStatus as keyof typeof STATUS_META] ?? STATUS_META.online;
  const vibeVals = { trustScore, coolScore, sexyScore };
  const hasVibes = trustScore > 0 || coolScore > 0 || sexyScore > 0;
  const zodiacEntry = zodiac ? ZODIAC_DATA[zodiac] : null;

  const resolvedHexItems = useMemo(() => {
    if (hexItems && hexItems.length > 0) {
      return hexItems.slice(0, 7).map(h => ({
        key: h.key,
        label: h.label,
        color: h.color,
        glow: h.glow,
        icon: getHexIcon(h.iconType),
      }));
    }
    type Item = { key: string; label: string; color: string; glow: string; icon: React.ReactNode };
    const items: Item[] = [];
    if (zodiacEntry) items.push({ key: 'zodiac', color: zodiacEntry.color, glow: zodiacEntry.glow, label: zodiacEntry.name, icon: ZODIAC_PATHS[zodiac!] });
    if (birthday) items.push({ key: 'birthday', color: '#FF2D87', glow: 'rgba(255,45,135,0.5)', label: birthday, icon: INFO_ICONS.birthday });
    if (height) items.push({ key: 'height', color: '#00F7FF', glow: 'rgba(0,247,255,0.5)', label: height, icon: INFO_ICONS.height });
    if (location) items.push({ key: 'location', color: '#B4FF00', glow: 'rgba(180,255,0,0.5)', label: location, icon: INFO_ICONS.location });
    if (pronouns) items.push({ key: 'pronouns', color: '#C084FC', glow: 'rgba(192,132,252,0.5)', label: pronouns, icon: INFO_ICONS.gender });
    if (lookingFor) items.push({ key: 'lookingFor', color: '#FFD700', glow: 'rgba(255,215,0,0.5)', label: lookingFor, icon: INFO_ICONS.lookingFor });
    return items;
  }, [hexItems, zodiacEntry, zodiac, birthday, height, location, pronouns, lookingFor]);

  const hasPersonalInfo = resolvedHexItems.length > 0;
  const infoPct = Math.min(100, Math.max(0, influenceScore));

  // ── Tilt engine ───────────────────────────────────────────────────
  const tilt = useMemo(() => {
    if (!enableTilt) return null;
    let raf: number | null = null, running = false, lastTs = 0;
    let cx = 0, cy = 0, tx = 0, ty = 0;
    let initUntil = 0;
    const TAU_DEFAULT = 0.14;
    const TAU_INITIAL = 0.60;

    const setVars = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;
      const w = shell.clientWidth || 1;
      const h = shell.clientHeight || 1;
      const px = clamp((100 / w) * x);
      const py = clamp((100 / h) * y);
      const ox = px - 50, oy = py - 50;
      const vars: Record<string, string> = {
        '--px': `${px}%`,
        '--py': `${py}%`,
        '--bg-x': `${lerp(px, 0, 100, 35, 65)}%`,
        '--bg-y': `${lerp(py, 0, 100, 35, 65)}%`,
        '--pfc': `${clamp(Math.hypot(oy, ox) / 50, 0, 1)}`,
        '--pft': `${py / 100}`,
        '--pfl': `${px / 100}`,
        '--rx': `${round(-(ox / 5))}deg`,
        '--ry': `${round(oy / 4)}deg`,
      };
      for (const [k, v] of Object.entries(vars)) wrap.style.setProperty(k, v);
    };

    const step = (ts: number) => {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const tau = ts < initUntil ? TAU_INITIAL : TAU_DEFAULT;
      const k = 1 - Math.exp(-dt / tau);
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      setVars(cx, cy);
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05 || document.hasFocus())
        raf = requestAnimationFrame(step);
      else { running = false; lastTs = 0; raf && cancelAnimationFrame(raf); raf = null; }
    };

    const start = () => { if (running) return; running = true; lastTs = 0; raf = requestAnimationFrame(step); };

    return {
      setImmediate: (x: number, y: number) => { cx = x; cy = y; setVars(x, y); },
      setTarget: (x: number, y: number) => { tx = x; ty = y; start(); },
      toCenter: () => { const s = shellRef.current; s && (tx = s.clientWidth / 2, ty = s.clientHeight / 2, start()); },
      beginInit: (ms: number) => { initUntil = performance.now() + ms; start(); },
      getCurrent: () => ({ x: cx, y: cy, tx, ty }),
      cancel: () => { raf && cancelAnimationFrame(raf); raf = null; running = false; lastTs = 0; },
    };
  }, [enableTilt]);

  // ── Pointer handlers ──────────────────────────────────────────────
  const offset = (e: PointerEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onMove = useCallback((e: PointerEvent) => {
    const s = shellRef.current;
    if (s && tilt) { const { x, y } = offset(e, s); tilt.setTarget(x, y); }
  }, [tilt]);

  const onEnter = useCallback((e: PointerEvent) => {
    const s = shellRef.current;
    if (!s || !tilt) return;
    s.classList.add('active', 'entering');
    if (enterTimer.current) clearTimeout(enterTimer.current);
    enterTimer.current = window.setTimeout(() => s.classList.remove('entering'), CFG.ENTER_MS);
    const { x, y } = offset(e, s);
    tilt.setTarget(x, y);
  }, [tilt]);

  const onLeave = useCallback(() => {
    const s = shellRef.current;
    if (!s || !tilt) return;
    tilt.toCenter();
    const check = () => {
      const { x, y, tx, ty } = tilt.getCurrent();
      if (Math.hypot(tx - x, ty - y) < 0.6) { s.classList.remove('active'); leaveRaf.current = null; }
      else leaveRaf.current = requestAnimationFrame(check);
    };
    leaveRaf.current && cancelAnimationFrame(leaveRaf.current);
    leaveRaf.current = requestAnimationFrame(check);
  }, [tilt]);

  const onDeviceOrientation = useCallback((e: DeviceOrientationEvent) => {
    const s = shellRef.current;
    if (!s || !tilt || e.beta == null || e.gamma == null) return;
    tilt.setTarget(
      clamp(s.clientWidth / 2 + e.gamma * mobileTiltSensitivity, 0, s.clientWidth),
      clamp(s.clientHeight / 2 + (e.beta - CFG.BETA_OFFSET) * mobileTiltSensitivity, 0, s.clientHeight),
    );
  }, [tilt, mobileTiltSensitivity]);

  // ── Mount / unmount ───────────────────────────────────────────────
  useEffect(() => {
    if (!enableTilt || !tilt) return;
    const shell = shellRef.current;
    if (!shell) return;

    shell.addEventListener('pointerenter', onEnter as EventListener);
    shell.addEventListener('pointermove', onMove as EventListener);
    shell.addEventListener('pointerleave', onLeave as EventListener);
    shell.addEventListener('click', () => {
      if (!enableMobileTilt) return;
      const M = window.DeviceMotionEvent as any;
      M?.requestPermission
        ? M.requestPermission().then((r: string) =>
          r === 'granted' && window.addEventListener('deviceorientation', onDeviceOrientation as EventListener))
        : window.addEventListener('deviceorientation', onDeviceOrientation as EventListener);
    });

    const iw = (shell.clientWidth || 0) - CFG.INIT_X_OFFSET;
    tilt.setImmediate(iw, CFG.INIT_Y_OFFSET);
    tilt.toCenter();
    tilt.beginInit(CFG.INIT_DURATION);

    return () => {
      shell.removeEventListener('pointerenter', onEnter as EventListener);
      shell.removeEventListener('pointermove', onMove as EventListener);
      shell.removeEventListener('pointerleave', onLeave as EventListener);
      window.removeEventListener('deviceorientation', onDeviceOrientation as EventListener);
      enterTimer.current && clearTimeout(enterTimer.current);
      leaveRaf.current && cancelAnimationFrame(leaveRaf.current);
      tilt.cancel();
    };
  }, [enableTilt, enableMobileTilt, tilt, onMove, onEnter, onLeave, onDeviceOrientation]);

  // ── CSS-var bag ───────────────────────────────────────────────────
  const cssVars = useMemo(() => ({
    '--icon': iconUrl ? `url(${iconUrl})` : 'none',
    '--grain': grainUrl ? `url(${grainUrl})` : 'none',
    '--grad': innerGradient ?? DEFAULT_GRADIENT,
    '--gc': behindGlowColor,
    '--gs': behindGlowSize,
    '--px': '50%',
    '--py': '50%',
    '--pfc': '0',
    '--pft': '0.5',
    '--pfl': '0.5',
    '--rx': '0deg',
    '--ry': '0deg',
    '--bg-x': '50%',
    '--bg-y': '50%',
    '--r': CARD_RADIUS,
    // Y2K spectral palette
    '--sp1': 'hsl(320,100%,66%)', // hot pink
    '--sp2': 'hsl(185,100%,63%)', // cyan
    '--sp3': 'hsl(80, 100%,66%)', // acid green
    '--sp4': 'hsl(220,100%,70%)', // electric blue
    '--sp5': 'hsl(265,100%,72%)', // purple
    '--sp6': 'hsl(48, 100%,66%)', // gold
  } as React.CSSProperties), [iconUrl, grainUrl, innerGradient, behindGlowColor, behindGlowSize]);

  // ── Holo shine layer ──────────────────────────────────────────────
  const shineStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: CARD_RADIUS,
    zIndex: 3,
    pointerEvents: 'none',
    overflow: 'hidden',
    mixBlendMode: 'color-dodge',
    filter: 'brightness(0.62) contrast(1.45) saturate(0.42) opacity(0.50)',
    animation: 'pc-holo 18s linear infinite',
    backgroundImage: `
      repeating-linear-gradient(0deg,
        var(--sp1) 5%,  var(--sp2) 10%, var(--sp3) 15%,
        var(--sp4) 20%, var(--sp5) 25%, var(--sp6) 30%, var(--sp1) 35%
      ),
      repeating-linear-gradient(-45deg,
        #050020 0%, hsl(200,40%,60%) 3.8%, hsl(200,65%,72%) 4.5%,
        hsl(200,40%,60%) 5.2%, #050020 10%, #050020 12%
      ),
      radial-gradient(farthest-corner circle at var(--px) var(--py),
        hsla(0,0%,0%,0.08) 12%, hsla(0,0%,0%,0.15) 20%,
        hsla(0,0%,0%,0.25) 120%
      )
    `.replace(/\s+/g, ' '),
    maskImage: 'var(--icon)',
    maskMode: 'luminance' as any,
    maskRepeat: 'repeat',
    maskSize: '150%',
    maskPosition: 'top calc(200% - (var(--bg-y) * 5)) left calc(100% - var(--bg-x))',
  };

  // ── Glare layer ───────────────────────────────────────────────────
  const glareStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: CARD_RADIUS,
    zIndex: 4,
    pointerEvents: 'none',
    overflow: 'hidden',
    mixBlendMode: 'overlay',
    filter: 'brightness(0.72) contrast(1.28)',
    backgroundImage: `radial-gradient(
      farthest-corner circle at var(--px) var(--py),
      hsl(248,25%,85%) 10%, hsla(207,40%,30%,0.72) 90%
    )`,
  };

  const handleContact = useCallback(() => onContactClick?.(), [onContactClick]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      className={`pc-wrap relative w-full touch-none select-none ${className}`.trim()}
      style={{
        perspective: '600px',
        transform: 'translate3d(0,0,0.1px)',
        fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
        ...cssVars,
      }}
    >
      {/* ── AMBIENT BEHIND-GLOW ── */}
      {behindGlowEnabled && (
        <div
          className="pc-glow absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at var(--px) var(--py), var(--gc) 0%, transparent var(--gs))',
            filter: 'blur(62px) saturate(1.25)',
            transform: 'scale(1.18)',
          }}
        />
      )}

      {/* ── RAINBOW BORDER RING ── */}
      <div
        className="pc-rainbow-ring absolute pointer-events-none"
        style={{
          inset: '-2px',
          borderRadius: `calc(${CARD_RADIUS} + 2px)`,
          zIndex: 1,
          opacity: 0.82,
        }}
      />

      {/* ── CARD SHELL ── */}
      <div ref={shellRef} className="relative z-[2]">
        <div
          className="relative w-full overflow-hidden"
          style={{
            paddingBottom: `${(1 / CARD_ASPECT) * 100}%`,
            borderRadius: CARD_RADIUS,
            maxHeight: '480px',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget;
            el.style.transition = 'none';
            el.style.transform = 'translateZ(0) rotateX(var(--ry)) rotateY(var(--rx))';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget;
            const shell = shellRef.current;
            el.style.transition = shell?.classList.contains('entering')
              ? 'transform 180ms ease-out'
              : 'transform 1s cubic-bezier(0.23,1,0.32,1)';
            el.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
          }}
        >
          {/* ── ABSOLUTE FILL ── */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'var(--grad)',
              backgroundColor: 'rgba(4,0,16,0.98)',
              borderRadius: CARD_RADIUS,
              boxShadow: [
                'inset 0 1px 0 rgba(255,255,255,0.08)',
                'inset 0 -1px 0 rgba(0,0,0,0.5)',
                `rgba(0,0,0,0.8) calc((var(--pfl)*12px) - 4px) calc((var(--pft)*24px) - 8px) 28px -6px`,
              ].join(', '),
            }}
          >

            {/* ── SCANLINES OVERLAY ── */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ borderRadius: CARD_RADIUS, zIndex: 7 }}
            >
              {/* Static scanline texture */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)',
                  borderRadius: CARD_RADIUS,
                }}
              />
              {/* Travelling luminance beam */}
              <div
                className="pc-scanline-beam absolute left-0 right-0"
                style={{
                  height: '60px',
                  background: 'linear-gradient(to bottom, transparent, rgba(0,240,255,0.03), rgba(0,240,255,0.022), transparent)',
                  top: 0,
                }}
              />
            </div>

            {/* ── HOLO SHINE ── */}
            <div style={shineStyle} />
            {/* ── GLARE ── */}
            <div style={glareStyle} />

            {/* ── AVATAR ── */}
            <div
              className="absolute inset-0 overflow-visible"
              style={{
                mixBlendMode: 'luminosity',
                borderRadius: CARD_RADIUS,
                pointerEvents: 'none',
                backfaceVisibility: 'hidden',
              }}
            >
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={name}
                  loading="lazy"
                  className="absolute bottom-0 left-1/2 w-full will-change-transform"
                  style={{
                    transform: [
                      'translateX(calc(-50% + (var(--pfl) - 0.5) * 8px))',
                      'translateZ(1px)',
                      'scaleY(calc(1 + (var(--pft) - 0.5) * 0.025))',
                      'scaleX(calc(1 + (var(--pfl) - 0.5) * 0.015))',
                    ].join(' '),
                    transformOrigin: '50% 100%',
                    transition: 'transform 120ms ease-out',
                    backfaceVisibility: 'hidden',
                    objectFit: 'cover',
                  }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                />
              )}
            </div>

            {/* ── CORNER STAR DECORATIONS ── */}
            <span
              className="pc-star-a absolute pointer-events-none select-none"
              style={{ top: 'clamp(6px,2%,11px)', left: 'clamp(6px,2%,11px)', fontSize: 'clamp(9px,2.4%,13px)', color: '#FF2D87', filter: 'drop-shadow(0 0 5px #FF2D87)', zIndex: 10, lineHeight: 1 }}
            >✦</span>
            <span
              className="pc-star-b absolute pointer-events-none select-none"
              style={{ top: 'clamp(6px,2%,11px)', right: 'clamp(6px,2%,11px)', fontSize: 'clamp(7px,1.9%,10px)', color: '#00FFFF', filter: 'drop-shadow(0 0 4px #00FFFF)', zIndex: 10, lineHeight: 1 }}
            >✧</span>
            <span
              className="pc-star-c absolute pointer-events-none select-none"
              style={{
                bottom: showUserInfo ? 'calc(clamp(10px,3.5%,18px) + clamp(78px,24%,140px) + 10px)' : 'clamp(8px,2%,12px)',
                left: 'clamp(6px,2%,11px)',
                fontSize: 'clamp(5px,1.4%,8px)',
                color: '#B4FF00',
                filter: 'drop-shadow(0 0 3px #B4FF00)',
                zIndex: 10,
                lineHeight: 1,
              }}
            >✦</span>

            {/* ── TOP ROW: Tier badge + Online status ── */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: 'clamp(10px, 3%, 16px)',
                left: 'clamp(10px, 3.5%, 16px)',
                right: 'clamp(10px, 3.5%, 16px)',
                zIndex: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transform: 'translate3d(calc((var(--pfl)-0.5)*6px),calc((var(--pft)-0.5)*5px),0.1px)',
              }}
            >
              {/* Tier badge — Y2K chip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 'clamp(3px,0.9%,5px) clamp(7px,2.2%,11px)',
                  borderRadius: '3px',
                  background: 'rgba(0,0,0,0.68)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: `1px solid ${tier.color}48`,
                  boxShadow: `0 0 10px ${tier.glow}, 0 0 1px ${tier.color}80, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  position: 'relative' as const,
                  overflow: 'hidden',
                }}
              >
                {/* corner notch */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '5px', height: '5px', borderLeft: `5px solid ${tier.color}55`, borderBottom: '5px solid transparent' }} />
                <span
                  className="pc-tier-shine"
                  style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(6px,1.65%,9px)', fontWeight: 900, letterSpacing: '0.16em', color: tier.color }}
                >
                  {tier.badge}
                </span>
              </div>

              {/* Online/Away pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(3px,1%,5px)',
                  padding: 'clamp(3px,0.9%,5px) clamp(6px,1.8%,10px)',
                  borderRadius: '3px',
                  background: 'rgba(0,0,0,0.68)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: `1px solid ${statusMeta.color}30`,
                  boxShadow: statusMeta.pulse
                    ? `0 0 8px ${statusMeta.color}38, inset 0 1px 0 rgba(255,255,255,0.08)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <span
                  className={statusMeta.pulse ? 'pc-online' : ''}
                  style={{
                    display: 'inline-block',
                    width: 'clamp(5px,1.4%,7px)',
                    height: 'clamp(5px,1.4%,7px)',
                    borderRadius: '50%',
                    backgroundColor: statusMeta.color,
                    boxShadow: statusMeta.pulse ? statusMeta.glow : 'none',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(6px,1.65%,9px)', fontWeight: 700, letterSpacing: '0.13em', color: statusMeta.pulse ? statusMeta.color : 'rgba(255,255,255,0.25)' }}>
                  {statusMeta.label}
                </span>
              </div>
            </div>

            {/* ── USER INFO BAR — Y2K bottom panel ── */}
            {showUserInfo && (
              <div
                className="pc-info-bar absolute pointer-events-auto"
                style={{
                  bottom: 'clamp(10px, 3.5%, 18px)',
                  left: 'clamp(10px, 3.5%, 16px)',
                  right: 'clamp(10px, 3.5%, 16px)',
                  zIndex: 9,
                  background: 'rgba(4,1,18,0.74)',
                  backdropFilter: 'blur(24px) saturate(1.5)',
                  WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                  border: '1px solid rgba(255,255,255,0.11)',
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: `calc(${CARD_RADIUS} - 4px)`,
                  padding: 'clamp(9px,2.6%,13px) clamp(10px,3%,14px)',
                  boxShadow: [
                    '0 8px 32px rgba(0,0,0,0.65)',
                    'inset 0 1px 0 rgba(255,255,255,0.1)',
                    'inset 0 0 0 1px rgba(255,255,255,0.03)',
                  ].join(', '),
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 'clamp(5px,1.5%,8px)',
                }}
              >
                {/* Chrome top accent line */}
                <div style={{ position: 'absolute', top: -1, left: '12%', right: '12%', height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,255,255,0.5), rgba(255,255,255,0.6), rgba(0,255,255,0.5), transparent)' }} />
                {/* Y2K corner brackets */}
                <div className="pc-corner-blink" style={{ position: 'absolute', top: -1, left: -1, width: 9, height: 9, borderTop: '1.5px solid rgba(0,255,255,0.7)', borderLeft: '1.5px solid rgba(0,255,255,0.7)' }} />
                <div className="pc-corner-blink" style={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderTop: '1.5px solid rgba(0,255,255,0.7)', borderRight: '1.5px solid rgba(0,255,255,0.7)', animationDelay: '0.5s' }} />
                <div className="pc-corner-blink" style={{ position: 'absolute', bottom: -1, left: -1, width: 9, height: 9, borderBottom: '1.5px solid rgba(0,255,255,0.5)', borderLeft: '1.5px solid rgba(0,255,255,0.5)', animationDelay: '1s' }} />
                <div className="pc-corner-blink" style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderBottom: '1.5px solid rgba(0,255,255,0.5)', borderRight: '1.5px solid rgba(0,255,255,0.5)', animationDelay: '1.5s' }} />

                {/* Status message */}
                {status && (
                  <p style={{ margin: 0, fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(8px,2.1%,11px)', color: 'rgba(160,210,255,0.68)', fontStyle: 'italic', letterSpacing: '0.02em', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                    &ldquo;{status}&rdquo;
                    <span className="pc-cursor" style={{ color: '#00FFFF', fontStyle: 'normal', marginLeft: '1px' }}>_</span>
                  </p>
                )}

                {/* ── VIBE BARS — Y2K segmented ── */}
                {hasVibes && (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 'clamp(3px,0.9%,5px)' }}>
                    {VIBES.map(v => {
                      const val = vibeVals[v.key];
                      if (!val || val <= 0) return null;
                      return (
                        <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px,1.2%,7px)' }}>
                          <span style={{ width: 'clamp(22px,6.5%,30px)', fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(6px,1.55%,8px)', fontWeight: 700, letterSpacing: '0.07em', color: v.color, opacity: 0.9, flexShrink: 0 }}>
                            {v.label}
                          </span>
                          {/* Segmented Y2K bar */}
                          <div
                            style={{
                              flex: 1,
                              height: 'clamp(5px,1.4%,7px)',
                              borderRadius: '2px',
                              background: 'rgba(255,255,255,0.05)',
                              border: `1px solid ${v.color}20`,
                              overflow: 'hidden',
                              position: 'relative',
                              backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(10% - 1px), rgba(0,0,0,0.45) calc(10% - 1px), rgba(0,0,0,0.45) 10%)`,
                            }}
                          >
                            <div
                              className="pc-bar"
                              style={{
                                position: 'absolute',
                                inset: 0,
                                transformOrigin: 'left center',
                                transform: `scaleX(${Math.min(100, val) / 100})`,
                                background: `linear-gradient(to right, ${v.color}55, ${v.color}bb, ${v.color})`,
                                boxShadow: `0 0 6px ${v.shadow}, 0 0 2px ${v.color}`,
                                borderRadius: '2px',
                              }}
                            />
                          </div>
                          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(7px,1.8%,9px)', fontWeight: 700, color: v.color, flexShrink: 0, minWidth: 'clamp(14px,3.5%,20px)', textAlign: 'right' as const }}>
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── PERSONAL INFO HEX GRID ── */}
                {hasPersonalInfo && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap' as const,
                      gap: 'clamp(4px,1.2%,7px)',
                      paddingTop: 'clamp(3px,0.8%,5px)',
                      paddingBottom: 'clamp(1px,0.4%,3px)',
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                      borderBottom: hasVibes ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      marginBottom: hasVibes ? 'clamp(2px,0.6%,4px)' : 0,
                    }}
                  >
                    {resolvedHexItems.map((item, i) => (
                      <div
                        key={item.key}
                        className="pc-hex-item"
                        style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 'clamp(2px,0.5%,3px)', width: 'clamp(30px,8.5%,40px)', animationDelay: `${0.4 + i * 0.08}s` }}
                      >
                        <div className="pc-hex-wrap" style={{ width: '100%', filter: `drop-shadow(0 0 5px ${item.glow}) drop-shadow(0 0 2px ${item.color}50)` }}>
                          <svg viewBox="0 0 36 36" width="100%" style={{ display: 'block', overflow: 'visible' }}>
                            <polygon points={HEX_PTS} fill={`${item.color}05`} stroke={`${item.color}25`} strokeWidth="2" />
                            <polygon points="18,4 30,11 30,25 18,32 6,25 6,11" fill={`${item.color}12`} stroke={`${item.color}55`} strokeWidth="1" />
                            {/* Y2K chrome specular top edge */}
                            <line x1="18" y1="4" x2="30" y2="11" stroke={`${item.color}70`} strokeWidth="0.6" />
                            <g
                              transform="translate(10.8,10.8) scale(0.6)"
                              fill="none" stroke={item.color} strokeWidth="1.8"
                              strokeLinecap="round" strokeLinejoin="round"
                              style={{ color: item.color }}
                            >
                              {item.icon}
                            </g>
                          </svg>
                        </div>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(5.5px,1.5%,7px)', fontWeight: 700, color: 'rgba(190,215,255,0.52)', textAlign: 'center' as const, letterSpacing: '0.03em', lineHeight: 1.15, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── BOTTOM ROW: @handle + Buzz button ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(8px,2.1%,10.5px)', color: 'rgba(80,160,255,0.42)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, minWidth: 0 }}>
                    @{handle || name.toLowerCase().replace(/\s+/g, '_')}
                  </span>

                  {/* Y2K chrome Buzz button */}
                  <button
                    onClick={handleContact}
                    type="button"
                    className="flex-shrink-0 font-black transition-all duration-150 hover:-translate-y-[1px] active:scale-95"
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 'clamp(7px,1.9%,10px)',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      padding: 'clamp(5px,1.5%,8px) clamp(10px,3%,15px)',
                      borderRadius: '4px',
                      minHeight: '34px',
                      border: '1px solid rgba(255,255,255,0.22)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 45%, rgba(0,0,0,0.08) 50%, rgba(255,255,255,0.05) 100%)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      color: 'rgba(255,255,255,0.96)',
                      boxShadow: `0 2px 14px ${behindGlowColor}55, 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.28)`,
                      textShadow: '0 0 10px rgba(0,255,255,0.55)',
                      whiteSpace: 'nowrap' as const,
                      position: 'relative' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Specular reflection stripe */}
                    <span style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: '48%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)', borderRadius: '3px 3px 50% 50%', pointerEvents: 'none' }} />
                    {contactText}
                  </button>
                </div>
              </div>
            )}

            {/* ── NAME + TITLE — Y2K chrome ── */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ borderRadius: CARD_RADIUS, zIndex: 5, transform: 'translate3d(calc((var(--pfl) - 0.5) * -7px), calc((var(--pft) - 0.5) * -7px), 0.1px)', mixBlendMode: 'luminosity' }}
            >
              <div className="absolute w-full text-center" style={{ top: 'clamp(24px, 7%, 44px)' }}>

                {/* Name row flanked by Y2K stars */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(4px,1.2%,8px)', marginBottom: '2px', padding: '0 6%' }}>
                  <span className="pc-star-b" style={{ fontSize: 'clamp(9px,2.6%,15px)', color: '#FF2D87', filter: 'drop-shadow(0 0 5px #FF2D87)', lineHeight: 1, flexShrink: 0 }}>✦</span>
                  <h3
                    className="pc-name-glitch pc-chrome-text font-black leading-none"
                    style={{ fontFamily: "'Orbitron', monospace", fontSize: 'clamp(16px, 5.5%, 38px)', letterSpacing: '-0.01em', textShadow: 'none', display: 'inline-block', minWidth: 0 }}
                  >
                    {name}
                  </h3>
                  <span className="pc-star-b" style={{ fontSize: 'clamp(9px,2.6%,15px)', color: '#FF2D87', filter: 'drop-shadow(0 0 5px #FF2D87)', lineHeight: 1, flexShrink: 0 }}>✦</span>
                </div>

                {/* Title / ZID */}
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(7px,1.9%,11px)', backgroundImage: 'linear-gradient(to bottom, rgba(170,200,255,0.75), rgba(90,120,180,0.45))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.24em', fontWeight: 700, textTransform: 'uppercase' as const, margin: '2px 0 0' }}>
                  {title}
                </p>

                {/* Influence bar */}
                {influenceScore > 0 && (
                  <div
                    style={{
                      margin: 'clamp(5px,1.5%,9px) auto 0',
                      width: '40%',
                      height: '3px',
                      borderRadius: '1px',
                      background: 'rgba(255,255,255,0.05)',
                      overflow: 'hidden',
                      position: 'relative' as const,
                      backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(25% - 1px), rgba(0,0,0,0.5) calc(25% - 1px), rgba(0,0,0,0.5) 25%)`,
                    }}
                  >
                    <div
                      className="pc-bar"
                      style={{
                        position: 'absolute' as const,
                        inset: 0,
                        transformOrigin: 'left center',
                        transform: `scaleX(${infoPct / 100})`,
                        background: `linear-gradient(to right, ${tier.color}65, ${tier.color})`,
                        boxShadow: `0 0 8px ${tier.glow}`,
                        borderRadius: '1px',
                        animationDelay: '0.2s',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── EDGE VIGNETTE ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ borderRadius: CARD_RADIUS, zIndex: 2, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5), inset 0 -30px 40px rgba(0,0,0,0.35)' }}
            />

            {/* ── SPECULAR EDGE HIGHLIGHT ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ borderRadius: CARD_RADIUS, zIndex: 6, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 1px 0 0 rgba(255,255,255,0.06)' }}
            />

          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProfileCardComponent);