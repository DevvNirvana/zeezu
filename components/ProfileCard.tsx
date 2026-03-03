"use client";

import React, {
  useEffect, useRef, useCallback, useMemo, useState,
} from 'react';

// ── Inject CSS once ────────────────────────────────────────────────────
const STYLE_ID = 'pc-v2-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id    = STYLE_ID;
  s.textContent = `
    @keyframes pc-holo {
      0%   { background-position: 0% var(--bg-y), 0 0; }
      100% { background-position: 0% var(--bg-y), 90% 90%; }
    }
    @keyframes pc-glow-pulse {
      0%,100% { opacity: 0.55; }
      50%      { opacity: 0.85; }
    }
    @keyframes pc-shimmer-in {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);   }
    }
    .pc-card-wrap { animation: pc-shimmer-in 0.5s cubic-bezier(0.22,1,0.36,1) both; }
    .pc-glow      { animation: pc-glow-pulse 3s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ── Types ──────────────────────────────────────────────────────────────
export interface ProfileCardProps {
  avatarUrl?:            string;
  miniAvatarUrl?:        string;
  iconUrl?:              string;
  grainUrl?:             string;
  innerGradient?:        string;
  behindGlowEnabled?:    boolean;
  behindGlowColor?:      string;
  behindGlowSize?:       string;
  className?:            string;
  enableTilt?:           boolean;
  enableMobileTilt?:     boolean;
  mobileTiltSensitivity?:number;
  name?:                 string;
  title?:                string;
  handle?:               string;
  status?:               string;
  contactText?:          string;
  showUserInfo?:         boolean;
  onContactClick?:       () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────
const clamp  = (v: number, lo = 0, hi = 100) => Math.min(Math.max(v, lo), hi);
const round  = (v: number, p = 3) => parseFloat(v.toFixed(p));
const lerp   = (v: number, f0: number, f1: number, t0: number, t1: number) =>
  round(t0 + ((t1 - t0) * (v - f0)) / (f1 - f0));

const CARD_ASPECT = 0.718;   // poker-card ratio  (w / h)
const CARD_RADIUS = '28px';
const DEFAULT_GRADIENT = 'linear-gradient(145deg,#1a0533 0%,#0f0c29 40%,#241040 100%)';

const CFG = {
  INIT_DURATION:   1200,
  INIT_X_OFFSET:   70,
  INIT_Y_OFFSET:   60,
  BETA_OFFSET:     20,
  ENTER_MS:        180,
} as const;

// ── Component ──────────────────────────────────────────────────────────
const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  avatarUrl             = '',
  miniAvatarUrl,
  iconUrl               = '',
  grainUrl              = '',
  innerGradient,
  behindGlowEnabled     = true,
  behindGlowColor       = 'rgba(138,46,255,0.7)',
  behindGlowSize        = '55%',
  className             = '',
  enableTilt            = true,
  enableMobileTilt      = false,
  mobileTiltSensitivity = 5,
  name                  = 'Anonymous',
  title                 = 'ZID-????',
  handle                = 'user',
  status                = 'Online',
  contactText           = 'Buzz',
  showUserInfo          = true,
  onContactClick,
}) => {
  const wrapRef       = useRef<HTMLDivElement>(null);
  const shellRef      = useRef<HTMLDivElement>(null);
  const enterTimer    = useRef<number | null>(null);
  const leaveRaf      = useRef<number | null>(null);
  const [ready,        setReady]       = useState(false);

  // ── Tilt engine ──────────────────────────────────────────────────
  const tilt = useMemo(() => {
    if (!enableTilt) return null;

    let raf: number | null = null, running = false, lastTs = 0;
    let cx = 0, cy = 0, tx = 0, ty = 0;
    let initUntil = 0;

    const TAU_DEFAULT = 0.14;
    const TAU_INITIAL = 0.60;

    const setVars = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap  = wrapRef.current;
      if (!shell || !wrap) return;
      const w  = shell.clientWidth  || 1;
      const h  = shell.clientHeight || 1;
      const px = clamp((100 / w) * x);
      const py = clamp((100 / h) * y);
      const ox = px - 50, oy = py - 50;
      const vars: Record<string, string> = {
        '--px':   `${px}%`, '--py': `${py}%`,
        '--bg-x': `${lerp(px, 0, 100, 35, 65)}%`,
        '--bg-y': `${lerp(py, 0, 100, 35, 65)}%`,
        '--pfc':  `${clamp(Math.hypot(oy, ox) / 50, 0, 1)}`,
        '--pft':  `${py / 100}`, '--pfl': `${px / 100}`,
        '--rx':   `${round(-(ox / 5))}deg`,
        '--ry':   `${round(oy  / 4)}deg`,
      };
      for (const [k, v] of Object.entries(vars)) wrap.style.setProperty(k, v);
    };

    const step = (ts: number) => {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const tau = ts < initUntil ? TAU_INITIAL : TAU_DEFAULT;
      const k   = 1 - Math.exp(-dt / tau);
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      setVars(cx, cy);
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05 || document.hasFocus())
        raf = requestAnimationFrame(step);
      else { running = false; lastTs = 0; raf && cancelAnimationFrame(raf); raf = null; }
    };

    const start = () => {
      if (running) return;
      running = true; lastTs = 0; raf = requestAnimationFrame(step);
    };

    return {
      setImmediate: (x: number, y: number) => { cx = x; cy = y; setVars(x, y); },
      setTarget:    (x: number, y: number) => { tx = x; ty = y; start(); },
      toCenter:     () => { const s = shellRef.current; s && (tx = s.clientWidth/2, ty = s.clientHeight/2, start()); },
      beginInit:    (ms: number) => { initUntil = performance.now() + ms; start(); },
      getCurrent:   () => ({ x: cx, y: cy, tx, ty }),
      cancel:       () => { raf && cancelAnimationFrame(raf); raf = null; running = false; lastTs = 0; },
    };
  }, [enableTilt]);

  // ── Pointer handlers ─────────────────────────────────────────────
  const offset = (e: PointerEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onMove  = useCallback((e: PointerEvent) => {
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
      clamp(s.clientWidth/2  + e.gamma * mobileTiltSensitivity, 0, s.clientWidth),
      clamp(s.clientHeight/2 + (e.beta - CFG.BETA_OFFSET) * mobileTiltSensitivity, 0, s.clientHeight),
    );
  }, [tilt, mobileTiltSensitivity]);

  // ── Mount / unmount ───────────────────────────────────────────────
  useEffect(() => {
    if (!enableTilt || !tilt) return;
    const shell = shellRef.current;
    if (!shell) return;

    shell.addEventListener('pointerenter', onEnter as EventListener);
    shell.addEventListener('pointermove',  onMove  as EventListener);
    shell.addEventListener('pointerleave', onLeave as EventListener);

    shell.addEventListener('click', () => {
      if (!enableMobileTilt || location.protocol !== 'https:') return;
      const M = window.DeviceMotionEvent as any;
      M?.requestPermission
        ? M.requestPermission().then((r: string) => r === 'granted' && window.addEventListener('deviceorientation', onDeviceOrientation as EventListener))
        : window.addEventListener('deviceorientation', onDeviceOrientation as EventListener);
    });

    const iw = (shell.clientWidth  || 0) - CFG.INIT_X_OFFSET;
    const iy = CFG.INIT_Y_OFFSET;
    tilt.setImmediate(iw, iy);
    tilt.toCenter();
    tilt.beginInit(CFG.INIT_DURATION);
    setReady(true);

    return () => {
      shell.removeEventListener('pointerenter', onEnter as EventListener);
      shell.removeEventListener('pointermove',  onMove  as EventListener);
      shell.removeEventListener('pointerleave', onLeave as EventListener);
      window.removeEventListener('deviceorientation', onDeviceOrientation as EventListener);
      enterTimer.current && clearTimeout(enterTimer.current);
      leaveRaf.current   && cancelAnimationFrame(leaveRaf.current);
      tilt.cancel();
    };
  }, [enableTilt, enableMobileTilt, tilt, onMove, onEnter, onLeave, onDeviceOrientation]);

  // ── CSS-var bag ───────────────────────────────────────────────────
  const cssVars = useMemo(() => ({
    '--icon':           iconUrl  ? `url(${iconUrl})`  : 'none',
    '--grain':          grainUrl ? `url(${grainUrl})` : 'none',
    '--inner-gradient': innerGradient ?? DEFAULT_GRADIENT,
    '--glow-color':     behindGlowColor,
    '--glow-size':      behindGlowSize,
    '--px': '50%', '--py': '50%',
    '--pfc': '0',  '--pft': '0.5', '--pfl': '0.5',
    '--rx': '0deg', '--ry': '0deg',
    '--bg-x': '50%', '--bg-y': '50%',
    '--r':    CARD_RADIUS,
    '--sp1':  'hsl(2,100%,73%)',   '--sp2':  'hsl(53,100%,69%)',
    '--sp3':  'hsl(93,100%,69%)',  '--sp4':  'hsl(176,100%,76%)',
    '--sp5':  'hsl(228,100%,74%)', '--sp6':  'hsl(283,100%,73%)',
  } as React.CSSProperties), [iconUrl, grainUrl, innerGradient, behindGlowColor, behindGlowSize]);

  // ── Holo shine layer ──────────────────────────────────────────────
  const shineStyle: React.CSSProperties = {
    position:        'absolute',
    inset:           0,
    borderRadius:    CARD_RADIUS,
    zIndex:          3,
    pointerEvents:   'none',
    overflow:        'hidden',
    mixBlendMode:    'color-dodge',
    filter:          'brightness(0.7) contrast(1.3) saturate(0.35) opacity(0.55)',
    animation:       'pc-holo 18s linear infinite',
    backgroundImage: `
      repeating-linear-gradient(0deg,
        var(--sp1) 5%,  var(--sp2) 10%,
        var(--sp3) 15%, var(--sp4) 20%,
        var(--sp5) 25%, var(--sp6) 30%,
        var(--sp1) 35%
      ),
      repeating-linear-gradient(-45deg,
        #0e152e 0%, hsl(180,10%,60%) 3.8%, hsl(180,29%,66%) 4.5%,
        hsl(180,10%,60%) 5.2%, #0e152e 10%, #0e152e 12%
      ),
      radial-gradient(farthest-corner circle at var(--px) var(--py),
        hsla(0,0%,0%,0.08) 12%, hsla(0,0%,0%,0.15) 20%, hsla(0,0%,0%,0.25) 120%
      )
    `.replace(/\s+/g, ' '),
    maskImage:    'var(--icon)',
    maskMode:     'luminance' as any,
    maskRepeat:   'repeat',
    maskSize:     '150%',
    maskPosition: 'top calc(200% - (var(--bg-y) * 5)) left calc(100% - var(--bg-x))',
  };

  // ── Glare layer ───────────────────────────────────────────────────
  const glareStyle: React.CSSProperties = {
    position:        'absolute',
    inset:           0,
    borderRadius:    CARD_RADIUS,
    zIndex:          4,
    pointerEvents:   'none',
    overflow:        'hidden',
    mixBlendMode:    'overlay',
    filter:          'brightness(0.75) contrast(1.25)',
    backgroundImage: `radial-gradient(
      farthest-corner circle at var(--px) var(--py),
      hsl(248,25%,85%) 10%,
      hsla(207,40%,30%,0.75) 90%
    )`,
  };

  const handleContact = useCallback(() => onContactClick?.(), [onContactClick]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    // Outer wrapper: full-width by default, tilt perspective applied
    // Height derives from width via the aspect ratio — never overflows
    <div
      ref={wrapRef}
      className={`pc-card-wrap relative w-full touch-none select-none ${className}`.trim()}
      style={{
        perspective:    '600px',
        transform:      'translate3d(0,0,0.1px)',
        // Height = width / aspect — set via padding trick for true responsiveness
        ...cssVars,
      }}
    >
      {/* Ambient behind-glow */}
      {behindGlowEnabled && (
        <div
          className="pc-glow absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at var(--px) var(--py), var(--glow-color) 0%, transparent var(--glow-size))',
            filter:     'blur(60px) saturate(1.2)',
            transform:  'scale(1.15)',
          }}
        />
      )}

      {/* Card shell */}
      <div ref={shellRef} className="relative z-[1]">
        {/* 
          Responsive sizing strategy:
          - We use a padding-bottom trick to maintain aspect ratio
          - The card fills 100% of its parent's width
          - Height follows automatically from the aspect ratio
          - max-width + max-height clamp it on large screens
        */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            paddingBottom: `${(1 / CARD_ASPECT) * 100}%`, // = 139.2% → h/w ratio
            borderRadius:   CARD_RADIUS,
            maxHeight:      '480px',
            // When maxHeight kicks in, we need to limit width accordingly
            // 480px * 0.718 = 344px, but we let CSS handle via the container
          }}
          onMouseEnter={e => {
            const el = e.currentTarget;
            el.style.transition = 'none';
            el.style.transform  = 'translateZ(0) rotateX(var(--ry)) rotateY(var(--rx))';
          }}
          onMouseLeave={e => {
            const el    = e.currentTarget;
            const shell = shellRef.current;
            el.style.transition = shell?.classList.contains('entering')
              ? 'transform 180ms ease-out'
              : 'transform 1s cubic-bezier(0.23,1,0.32,1)';
            el.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
          }}
        >
          {/* Absolute fill — sits inside the padding-box trick */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'var(--inner-gradient)',
              backgroundColor: 'rgba(5,3,15,0.95)',
              borderRadius:     CARD_RADIUS,
              boxShadow: [
                'inset 0 1px 0 rgba(255,255,255,0.08)',
                'inset 0 -1px 0 rgba(0,0,0,0.5)',
                `rgba(0,0,0,0.8) calc((var(--pfl)*12px) - 4px) calc((var(--pft)*24px) - 8px) 28px -6px`,
              ].join(', '),
            }}
          >
            {/* ── HOLO SHINE ── */}
            <div style={shineStyle} />

            {/* ── GLARE ── */}
            <div style={glareStyle} />

            {/* ── AVATAR ── */}
            <div
              className="absolute inset-0 overflow-visible"
              style={{
                // mixBlendMode:     'luminosity',
                borderRadius:     CARD_RADIUS,
                pointerEvents:    'none',
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
                    // Responsive avatar: always 100% wide, anchored to bottom
                    transform: [
                      'translateX(calc(-50% + (var(--pfl) - 0.5) * 8px))',
                      'translateZ(1px)',
                      'scaleY(calc(1 + (var(--pft) - 0.5) * 0.025))',
                      'scaleX(calc(1 + (var(--pfl) - 0.5) * 0.015))',
                    ].join(' '),
                    transformOrigin:    '50% 100%',
                    transition:         'transform 120ms ease-out',
                    backfaceVisibility: 'hidden',
                    objectFit:          'cover',
                  }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                />
              )}

              {/* ── USER INFO BAR ── */}
              {showUserInfo && (
                <div
                  className="absolute z-10 flex items-center justify-between pointer-events-auto"
                  style={{
                    bottom:       'clamp(12px, 4%, 20px)',
                    left:         'clamp(12px, 5%, 20px)',
                    right:        'clamp(12px, 5%, 20px)',
                    background:   'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(24px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                    border:       '1px solid rgba(255,255,255,0.12)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 'calc(var(--r) - 16px)',
                    padding:      'clamp(8px, 2.5%, 12px) clamp(10px, 3%, 14px)',
                    boxShadow:    '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                    transform:    'translateZ(2px)',
                  }}
                >
                  {/* Mini avatar + info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="flex-shrink-0 rounded-full overflow-hidden border border-white/15"
                      style={{
                        width:  'clamp(28px, 8%, 40px)',
                        height: 'clamp(28px, 8%, 40px)',
                        background: 'rgba(0,0,0,0.4)',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
                      }}
                    >
                      <img
                        src={miniAvatarUrl || avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className="font-semibold leading-none truncate"
                        style={{
                          fontSize:  'clamp(10px, 2.8%, 13px)',
                          color:     'rgba(255,255,255,0.92)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        @{handle}
                      </span>
                      <span
                        className="leading-none truncate"
                        style={{
                          fontSize: 'clamp(9px, 2.4%, 11px)',
                          color:    'rgba(255,255,255,0.55)',
                        }}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* Contact button */}
                  <button
                    onClick={handleContact}
                    type="button"
                    className="flex-shrink-0 font-semibold text-white/85 transition-all duration-150 ease-out hover:bg-white/20 hover:text-white active:scale-95"
                    style={{
                      fontSize:       'clamp(9px, 2.4%, 11px)',
                      padding:        'clamp(5px,1.5%,8px) clamp(8px,2.5%,14px)',
                      borderRadius:   'calc(var(--r) - 22px)',
                      border:         '1px solid rgba(255,255,255,0.12)',
                      background:     'rgba(255,255,255,0.07)',
                      backdropFilter: 'blur(2.5px)',
                      boxShadow:      '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                      letterSpacing:  '0.01em',
                      whiteSpace:     'nowrap',
                    }}
                  >
                    {contactText}
                  </button>
                </div>
              )}
            </div>

            {/* ── NAME + TITLE ── */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                borderRadius: CARD_RADIUS,
                zIndex:       5,
                transform:    'translate3d(calc((var(--pfl) - 0.5) * -7px), calc((var(--pft) - 0.5) * -7px), 0.1px)',
                mixBlendMode: 'luminosity',
              }}
            >
              <div
                className="absolute w-full text-center"
                style={{ top: 'clamp(24px, 7%, 44px)' }}
              >
                <h3
                  className="font-bold leading-none tracking-tight"
                  style={{
                    fontSize:            'clamp(20px, 6.5%, 42px)',
                    backgroundImage:     'linear-gradient(175deg, #ffffff 30%, #a8a8e0 70%, #7878c8 100%)',
                    WebkitBackgroundClip:'text',
                    backgroundClip:      'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow:          'none',
                    letterSpacing:       '-0.02em',
                    padding:             '0 8%',
                  }}
                >
                  {name}
                </h3>

                <p
                  className="font-semibold mt-1 tracking-widest uppercase"
                  style={{
                    fontSize:            'clamp(7px, 2%, 11px)',
                    backgroundImage:     'linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(180,180,220,0.5))',
                    WebkitBackgroundClip:'text',
                    backgroundClip:      'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing:       '0.15em',
                  }}
                >
                  {title}
                </p>
              </div>
            </div>

            {/* ── EDGE VIGNETTE ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: CARD_RADIUS,
                zIndex:       2,
                boxShadow:    'inset 0 0 40px rgba(0,0,0,0.5), inset 0 -30px 40px rgba(0,0,0,0.35)',
              }}
            />

            {/* ── SPECULAR EDGE HIGHLIGHT ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: CARD_RADIUS,
                zIndex:       6,
                boxShadow:    'inset 0 1px 0 rgba(255,255,255,0.12), inset 1px 0 0 rgba(255,255,255,0.06)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProfileCardComponent);