"use client";

import { useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────
export type ThemeConfig = {
  theme_id:           string;
  primary_color:      string;
  secondary_color:    string;
  background_url:     string | null;
  background_tiling:  boolean;
  background_opacity: number;
};

// ── Preset theme packs ─────────────────────────────────────────────────
// Used as starting points — user can override colors on top
export const THEME_PRESETS: Record<string, Partial<ThemeConfig>> = {
  neon_cyber: {
    theme_id:        'neon_cyber',
    primary_color:   '#8A2EFF',
    secondary_color: '#00F7FF',
  },
  emo_night: {
    theme_id:        'emo_night',
    primary_color:   '#FF007A',
    secondary_color: '#9900FF',
  },
  y2k_glitter: {
    theme_id:        'y2k_glitter',
    primary_color:   '#FFD700',
    secondary_color: '#FF69B4',
  },
  minimal_dark: {
    theme_id:        'minimal_dark',
    primary_color:   '#FFFFFF',
    secondary_color: '#888888',
  },
  chrome_bbm: {
    theme_id:        'chrome_bbm',
    primary_color:   '#00C853',
    secondary_color: '#64FFDA',
  },
  bubblegum: {
    theme_id:        'bubblegum',
    primary_color:   '#FF4FAB',
    secondary_color: '#B4FF00',
  },
};

// ── Default config (before DB loads) ──────────────────────────────────
export const DEFAULT_THEME: ThemeConfig = {
  theme_id:           'neon_cyber',
  primary_color:      '#8A2EFF',
  secondary_color:    '#00F7FF',
  background_url:     null,
  background_tiling:  false,
  background_opacity: 100,
};

// ── Hex → rgba helper ─────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Component ──────────────────────────────────────────────────────────
// Invisible — sits at the root of any page that needs theme injection.
// Writes CSS variables to :root and sets body background.
export default function ThemeEngine({ config }: { config: ThemeConfig | null }) {
  useEffect(() => {
    const cfg = config ?? DEFAULT_THEME;
    const root = document.documentElement;
    const body = document.body;

    // ── 1. CSS custom properties → used by Tailwind classes like text-electric, etc.
    root.style.setProperty('--color-electric',   cfg.primary_color);
    root.style.setProperty('--color-cyan',        cfg.secondary_color);
    root.style.setProperty('--color-electric-glow',
      hexToRgba(cfg.primary_color, 0.35));
    root.style.setProperty('--color-cyan-glow',
      hexToRgba(cfg.secondary_color, 0.3));

    // ── 2. Background image (if set)
    const opacity = (cfg.background_opacity ?? 100) / 100;

    if (cfg.background_url) {
      body.style.backgroundImage    = `url('${cfg.background_url}')`;
      body.style.backgroundRepeat   = cfg.background_tiling ? 'repeat' : 'no-repeat';
      body.style.backgroundSize     = cfg.background_tiling ? 'auto'   : 'cover';
      body.style.backgroundPosition = 'center top';
      body.style.backgroundAttachment = 'fixed';
    } else {
      body.style.backgroundImage = 'none';
    }

    // ── 3. Cleanup: restore defaults when user navigates away
    return () => {
      root.style.removeProperty('--color-electric');
      root.style.removeProperty('--color-cyan');
      root.style.removeProperty('--color-electric-glow');
      root.style.removeProperty('--color-cyan-glow');
      body.style.backgroundImage     = 'none';
      body.style.backgroundRepeat    = '';
      body.style.backgroundSize      = '';
      body.style.backgroundPosition  = '';
      body.style.backgroundAttachment = '';
    };
  }, [config]);

  return null; // Intentionally invisible
}