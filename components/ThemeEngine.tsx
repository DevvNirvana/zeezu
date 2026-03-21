"use client";

import { useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────
export type ThemeConfig = {
  theme_id: string;

  // Colors (12 tokens)
  primary_color: string;
  primary_muted: string;
  secondary_color: string;
  accent_color: string;
  accent_muted: string;
  text_color: string;
  text_secondary: string;
  text_muted: string;
  text_on_primary: string;
  card_bg: string;
  surface_border: string;
  page_bg: string;

  // Typography (5 tokens)
  font_family: string;   // Display font (headings, name)
  font_body: string;   // Body font (nav, labels)
  font_mono: string;   // Mono font (ZIDs, stats)
  font_size_scale: number;
  heading_style: string;   // gradient | glow | chrome | none
  name_effect: string;   // none | gradient | shiny | glitch

  // Component styles
  card_style: string;   // glass | chrome | neon | minimal | holographic | bubble
  button_style: string;   // solid-glow | glass-pill | chrome-bevel | bubble-3d | outline-pulse | brutal-block
  bg_effect: string;   // none | grid | dots | scanlines | stars | noise
  card_holo_effect: string;   // none | rainbow-foil | chrome | scanlines | sparkle | bubble-gloss

  // Surface controls
  glow_intensity: number;   // 0 – 100
  glow_enabled: boolean;
  glass_blur: number;   // 0 – 40 (px)
  glass_opacity: number;   // 10 – 95 (%)
  shadow_strength: number;   // 0 – 3  (multiplier)
  border_radius: string;   // sharp | rounded | pill
  animation_level: string;   // none | subtle | full

  // Toggles
  enable_tilt: boolean;
  enable_behind_glow: boolean;

  // Background
  bg_type: string;   // none | gradient | image
  bg_gradient: string | null;
  background_url: string | null;
  background_tiling: boolean;
  background_opacity: number;
};

// ── Default config ────────────────────────────────────────────────────
export const DEFAULT_THEME: ThemeConfig = {
  theme_id: "cyber_pink",
  primary_color: "#FF2D87",
  primary_muted: "#FF2D874D",
  secondary_color: "#FFD700",
  accent_color: "#FFD700",
  accent_muted: "#FFD7004D",
  text_color: "#FFFFFF",
  text_secondary: "#9CA3AF",
  text_muted: "#6B7280",
  text_on_primary: "#FFFFFF",
  card_bg: "rgba(20,8,14,0.85)",
  surface_border: "rgba(255,255,255,0.08)",
  page_bg: "#0E0B0D",
  font_family: "Rajdhani",
  font_body: "Space Grotesk",
  font_mono: "Share Tech Mono",
  font_size_scale: 1.0,
  heading_style: "chrome",
  name_effect: "none",
  card_style: "chrome",
  button_style: "solid-glow",
  bg_effect: "none",
  card_holo_effect: "none",
  glow_intensity: 70,
  glow_enabled: true,
  glass_blur: 8,
  glass_opacity: 90,
  shadow_strength: 1.0,
  border_radius: "rounded",
  animation_level: "subtle",
  enable_tilt: true,
  enable_behind_glow: true,
  bg_type: "none",
  bg_gradient: "linear-gradient(160deg, #0a0010 0%, #1a0025 50%, #0E0B0D 100%)",
  background_url: null,
  background_tiling: false,
  background_opacity: 100,
};

// ── Re-export from THEMES.ts for convenience ─────────────────────────
export { THEME_PRESETS, PRESET_GALLERY } from "./THEMES";
export {
  DISPLAY_FONTS, BODY_FONTS, MONO_FONTS,
  BUTTON_STYLES, CARD_STYLES, BG_EFFECTS, CARD_HOLO_EFFECTS, TEXT_EFFECTS,
  BORDER_RADIUS_OPTIONS, COLOR_SWATCHES, BG_GALLERY,
} from "./THEMES";

// ── Hex → rgba helper ─────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '').replace(/[^0-9a-fA-F]/g, '');
  if (clean.length < 6) return `rgba(255,45,135,${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Google Font loader ────────────────────────────────────────────────
function loadGoogleFont(fontName: string) {
  if (!fontName || fontName === 'system-ui') return;
  const fontId = `gfont-${fontName.replace(/\s+/g, '-')}`;
  if (typeof document !== 'undefined' && !document.getElementById(fontId)) {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }
}

// ── Border radius map ─────────────────────────────────────────────────
const BR_MAP: Record<string, string> = { sharp: '4px', rounded: '12px', pill: '24px' };

// ── Component ──────────────────────────────────────────────────────────
export default function ThemeEngine({ config }: { config: ThemeConfig | null }) {
  const prevBgRef = useRef<string>('');

  useEffect(() => {
    const cfg = config ?? DEFAULT_THEME;
    const root = document.documentElement;
    const body = document.body;

    // ── 1. Color CSS custom properties ────────────────────────────
    root.style.setProperty('--color-electric', cfg.primary_color);
    root.style.setProperty('--color-electric-muted', cfg.primary_muted || hexToRgba(cfg.primary_color, 0.3));
    root.style.setProperty('--color-cyan', cfg.secondary_color);
    root.style.setProperty('--color-accent', cfg.accent_color);
    root.style.setProperty('--color-accent-muted', cfg.accent_muted || hexToRgba(cfg.accent_color, 0.3));
    root.style.setProperty('--color-text', cfg.text_color);
    root.style.setProperty('--color-text-secondary', cfg.text_secondary || '#9CA3AF');
    root.style.setProperty('--color-text-muted', cfg.text_muted || '#6B7280');
    root.style.setProperty('--color-text-on-primary', cfg.text_on_primary || '#FFFFFF');
    root.style.setProperty('--color-card-bg', cfg.card_bg);
    root.style.setProperty('--color-surface-border', cfg.surface_border || 'rgba(255,255,255,0.08)');
    root.style.setProperty('--color-page-bg', cfg.page_bg || '#0E0B0D');
    root.style.setProperty('--color-electric-glow', hexToRgba(cfg.primary_color, 0.35));
    root.style.setProperty('--color-cyan-glow', hexToRgba(cfg.secondary_color, 0.3));

    // ── 2. Typography — apply directly to body ───────────────────
    const fontDisplay = `'${cfg.font_family}', sans-serif`;
    const fontBody = `'${cfg.font_body || 'Space Grotesk'}', sans-serif`;
    const fontMono = `'${cfg.font_mono || 'JetBrains Mono'}', monospace`;
    body.style.fontFamily = fontBody; // Body font is the default (nav, labels, body text)
    root.style.setProperty('--font-display', fontDisplay);
    root.style.setProperty('--font-body', fontBody);
    root.style.setProperty('--font-mono', fontMono);
    root.style.setProperty('--font-scale', String(cfg.font_size_scale));

    // ── 3. Surface & effects CSS vars ─────────────────────────────
    const br = BR_MAP[cfg.border_radius] ?? '12px';
    root.style.setProperty('--border-radius-theme', br);
    root.style.setProperty('--glass-blur', `${cfg.glass_blur ?? 12}px`);
    root.style.setProperty('--glass-opacity', String((cfg.glass_opacity ?? 80) / 100));
    root.style.setProperty('--shadow-strength', String(cfg.shadow_strength ?? 1));
    root.style.setProperty('--glow-intensity', String((cfg.glow_enabled !== false ? cfg.glow_intensity : 0) / 100));
    root.style.setProperty('--card-style', cfg.card_style);
    root.style.setProperty('--button-style', cfg.button_style || 'solid-glow');

    // ── 4. Background effects via data attribute ──────────────────
    body.setAttribute('data-bg-effect', cfg.bg_effect || 'none');

    // ── 5. Background image/gradient — only write if changed ──────
    const bgKey = JSON.stringify({
      bg_type: cfg.bg_type, bg_gradient: cfg.bg_gradient,
      background_url: cfg.background_url, background_tiling: cfg.background_tiling,
      background_opacity: cfg.background_opacity, page_bg: cfg.page_bg,
    });
    if (bgKey !== prevBgRef.current) {
      prevBgRef.current = bgKey;
      body.style.backgroundColor = cfg.page_bg || '#0E0B0D';
      if (cfg.bg_type === 'gradient' && cfg.bg_gradient) {
        body.style.backgroundImage = cfg.bg_gradient;
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center top';
        body.style.backgroundAttachment = 'fixed';
      } else if (cfg.bg_type === 'image' && cfg.background_url) {
        body.style.backgroundImage = `url('${cfg.background_url}')`;
        body.style.backgroundRepeat = cfg.background_tiling ? 'repeat' : 'no-repeat';
        body.style.backgroundSize = cfg.background_tiling ? 'auto' : 'cover';
        body.style.backgroundPosition = 'center top';
        body.style.backgroundAttachment = 'fixed';
      } else {
        body.style.backgroundImage = 'none';
      }
    }

    // ── 6. Load all Google Fonts ──────────────────────────────────
    loadGoogleFont(cfg.font_family);
    loadGoogleFont(cfg.font_body);
    loadGoogleFont(cfg.font_mono);

    // ── 7. Dynamic themed CSS injection ──────────────────────────
    const glowPx = Math.round((cfg.glow_enabled !== false ? cfg.glow_intensity : 0) * 0.4);
    const glowAlpha = Math.min(99, Math.round(cfg.glow_intensity * 0.8)).toString(16).padStart(2, '0');
    const shadowMul = cfg.shadow_strength ?? 1;

    // Card style CSS
    const cardCSS = cfg.card_style === 'glass' ? `
      background: rgba(255,255,255,${(cfg.glass_opacity ?? 80) / 100 * 0.04});
      backdrop-filter: blur(${cfg.glass_blur ?? 12}px);
      border: 1px solid ${cfg.surface_border || 'rgba(255,255,255,0.08)'};
      box-shadow: 0 ${4 * shadowMul}px ${16 * shadowMul}px rgba(0,0,0,0.3)${cfg.glow_enabled !== false ? `, 0 0 ${glowPx}px ${cfg.primary_color}${glowAlpha}` : ''};
    ` : cfg.card_style === 'chrome' ? `
      background: linear-gradient(135deg, rgba(200,200,200,0.06), rgba(100,100,100,0.1));
      border: 1px solid rgba(200,200,200,0.2);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 ${4 * shadowMul}px ${12 * shadowMul}px rgba(0,0,0,0.4);
    ` : cfg.card_style === 'neon' ? `
      background: rgba(0,0,0,0.5);
      border: 2px solid ${cfg.primary_color};
      box-shadow: 0 0 ${glowPx * 2}px ${cfg.primary_color}${glowAlpha}, inset 0 0 ${glowPx}px ${cfg.primary_color}15;
    ` : cfg.card_style === 'holographic' ? `
      background: linear-gradient(135deg, ${cfg.primary_color}0A, ${cfg.secondary_color}0A, ${cfg.accent_color}0A);
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 0 ${glowPx}px ${cfg.primary_color}${glowAlpha};
    ` : cfg.card_style === 'bubble' ? `
      background: rgba(255,255,255,0.04);
      border: 2px solid rgba(255,255,255,0.15);
      box-shadow: inset 0 2px 8px rgba(255,255,255,0.06), 0 ${6 * shadowMul}px ${20 * shadowMul}px rgba(0,0,0,0.3);
    ` : `
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
    `;

    // Button style CSS
    const btnSolid = `
      .btn-themed {
        background: ${cfg.primary_color};
        color: ${cfg.text_on_primary || '#fff'};
        border: none;
        border-radius: ${br};
        box-shadow: 0 0 ${glowPx}px ${cfg.primary_color}${glowAlpha};
        font-family: var(--font-body);
        transition: all 0.2s ease;
      }
      .btn-themed:hover { filter: brightness(1.15); transform: translateY(-1px); }
    `;
    const btnGlass = `
      .btn-themed {
        background: rgba(255,255,255,0.06);
        backdrop-filter: blur(8px);
        color: ${cfg.primary_color};
        border: 1px solid ${cfg.primary_color}30;
        border-radius: 999px;
        font-family: var(--font-body);
        transition: all 0.2s ease;
      }
      .btn-themed:hover { background: ${cfg.primary_color}15; border-color: ${cfg.primary_color}60; }
    `;
    const btnChrome = `
      .btn-themed {
        background: linear-gradient(180deg, rgba(220,220,220,0.15) 0%, rgba(150,150,150,0.08) 100%);
        color: #fff;
        border: 1px solid rgba(200,200,200,0.3);
        border-radius: ${br};
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3);
        font-family: var(--font-body);
        transition: all 0.2s ease;
      }
      .btn-themed:hover { background: linear-gradient(180deg, rgba(220,220,220,0.2) 0%, rgba(150,150,150,0.12) 100%); }
    `;
    const btnBubble = `
      .btn-themed {
        background: linear-gradient(180deg, ${cfg.primary_color}20 0%, ${cfg.primary_color}08 100%);
        color: ${cfg.primary_color};
        border: 2px solid ${cfg.primary_color}30;
        border-radius: 999px;
        box-shadow: inset 0 2px 6px rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.2);
        font-family: var(--font-body);
        transition: all 0.2s ease;
      }
      .btn-themed:hover { transform: translateY(-2px); box-shadow: inset 0 2px 6px rgba(255,255,255,0.12), 0 6px 16px rgba(0,0,0,0.3); }
    `;
    const btnOutline = `
      .btn-themed {
        background: transparent;
        color: ${cfg.primary_color};
        border: 2px solid ${cfg.primary_color};
        border-radius: ${br};
        box-shadow: 0 0 ${glowPx}px ${cfg.primary_color}${glowAlpha};
        font-family: var(--font-body);
        transition: all 0.3s ease;
        animation: btn-outline-pulse 2s ease-in-out infinite;
      }
      @keyframes btn-outline-pulse { 0%,100% { box-shadow: 0 0 ${glowPx}px ${cfg.primary_color}30; } 50% { box-shadow: 0 0 ${glowPx * 2}px ${cfg.primary_color}60; } }
      .btn-themed:hover { background: ${cfg.primary_color}10; }
    `;
    const btnBrutal = `
      .btn-themed {
        background: ${cfg.primary_color};
        color: ${cfg.text_on_primary || '#fff'};
        border: 2px solid #000;
        border-radius: 0;
        box-shadow: 4px 4px 0 #000;
        font-family: var(--font-body);
        font-weight: 800;
        text-transform: uppercase;
        transition: all 0.15s ease;
      }
      .btn-themed:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #000; }
    `;

    const btnStyles: Record<string, string> = {
      'solid-glow': btnSolid, 'glass-pill': btnGlass, 'chrome-bevel': btnChrome,
      'bubble-3d': btnBubble, 'outline-pulse': btnOutline, 'brutal-block': btnBrutal,
    };

    const themedCSS = `
      /* ── Display font on all headings ── */
      h1, h2, h3, h4, .themed-heading {
        font-family: var(--font-display);
      }
      /* ── Mono font on code/mono elements ── */
      code, .font-mono, .themed-mono, [class*="mono"] {
        font-family: var(--font-mono);
      }
      /* ── Themed card (opt-in + SpotlightCard) ── */
      .themed-card {
        border-radius: ${br};
        ${cardCSS}
      }
      /* ── Themed button — opt-in class ── */
      ${btnStyles[cfg.button_style] || btnSolid}
      /* ── Themed text utility classes ── */
      .themed-text-primary   { color: var(--color-electric); }
      .themed-text-secondary { color: var(--color-text-secondary); }
      .themed-text-muted     { color: var(--color-text-muted); }
    `;

    const styleId = 'theme-engine-dynamic';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = themedCSS;

    // ── 8. Cleanup ────────────────────────────────────────────────
    return () => {
      const vars = [
        '--color-electric', '--color-electric-muted', '--color-cyan',
        '--color-accent', '--color-accent-muted', '--color-text',
        '--color-text-secondary', '--color-text-muted', '--color-text-on-primary',
        '--color-card-bg', '--color-surface-border', '--color-page-bg',
        '--color-electric-glow', '--color-cyan-glow',
        '--font-display', '--font-body', '--font-mono', '--font-scale',
        '--border-radius-theme', '--glass-blur', '--glass-opacity',
        '--shadow-strength', '--glow-intensity', '--card-style', '--button-style',
      ];
      vars.forEach(v => root.style.removeProperty(v));
      body.style.fontFamily = '';
      body.style.backgroundColor = '';
      body.style.backgroundImage = 'none';
      body.style.backgroundRepeat = '';
      body.style.backgroundSize = '';
      body.style.backgroundPosition = '';
      body.style.backgroundAttachment = '';
      body.removeAttribute('data-bg-effect');
      const el = document.getElementById('theme-engine-dynamic');
      if (el) el.remove();
    };
  }, [config]);

  return null;
}