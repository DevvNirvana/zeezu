// ── THEMES.ts ──────────────────────────────────────────────────────────
// 12 Y2K-inspired theme presets with 3-font pairings + full token sets.
// Imported by ThemeEngine. Each preset fully defines all visual tokens.

import type { ThemeConfig } from "./ThemeEngine";

// ── Font catalog (all Google Fonts, loaded on demand by ThemeEngine) ──
export const DISPLAY_FONTS = [
    { id: "Syne", label: "Syne", preview: "Geometric punch" },
    { id: "Orbitron", label: "Orbitron", preview: "Futuristic Y2K" },
    { id: "Rajdhani", label: "Rajdhani", preview: "Tech angular" },
    { id: "Exo 2", label: "Exo 2", preview: "Rounded future" },
    { id: "Chakra Petch", label: "Chakra Petch", preview: "Thai tech" },
    { id: "Barlow Condensed", label: "Barlow Condensed", preview: "Compressed power" },
    { id: "Anton", label: "Anton", preview: "Impact bold" },
    { id: "Cinzel", label: "Cinzel", preview: "Elegant serif" },
];

export const BODY_FONTS = [
    { id: "Space Grotesk", label: "Space Grotesk", preview: "Geometric clean" },
    { id: "Nunito", label: "Nunito", preview: "Soft rounded" },
    { id: "Outfit", label: "Outfit", preview: "Friendly modern" },
    { id: "Titillium Web", label: "Titillium Web", preview: "European tech" },
    { id: "Plus Jakarta Sans", label: "Jakarta Sans", preview: "Contemporary" },
    { id: "Mulish", label: "Mulish", preview: "Clear minimal" },
];

export const MONO_FONTS = [
    { id: "JetBrains Mono", label: "JetBrains Mono", preview: "Coder pro" },
    { id: "Space Mono", label: "Space Mono", preview: "Retro terminal" },
    { id: "Share Tech Mono", label: "Share Tech Mono", preview: "Y2K tech" },
    { id: "Fira Mono", label: "Fira Mono", preview: "Mozilla clean" },
    { id: "Inconsolata", label: "Inconsolata", preview: "Elegant mono" },
    { id: "Source Code Pro", label: "Source Code Pro", preview: "Adobe crisp" },
];

// ── Button style options ──────────────────────────────────────────────
export const BUTTON_STYLES = [
    { id: "solid-glow", label: "Solid Glow", desc: "Neon filled" },
    { id: "glass-pill", label: "Glass Pill", desc: "Frosted blur" },
    { id: "chrome-bevel", label: "Chrome Bevel", desc: "Metallic Y2K" },
    { id: "bubble-3d", label: "Bubble 3D", desc: "Inflated clay" },
    { id: "outline-pulse", label: "Outline Pulse", desc: "Glow border" },
    { id: "brutal-block", label: "Brutal Block", desc: "Hard shadow" },
];

// ── Card style options ────────────────────────────────────────────────
export const CARD_STYLES = [
    { id: "glass", label: "Glass", desc: "Frosted blur" },
    { id: "chrome", label: "Chrome", desc: "Metallic sheen" },
    { id: "neon", label: "Neon", desc: "Glowing edge" },
    { id: "minimal", label: "Minimal", desc: "Clean border" },
    { id: "holographic", label: "Holo", desc: "Rainbow shimmer" },
    { id: "bubble", label: "Bubble", desc: "Convex 3D" },
];

// ── Background effect options ─────────────────────────────────────────
export const BG_EFFECTS = [
    { id: "none", label: "Void", desc: "Clean dark" },
    { id: "grid", label: "Grid Lines", desc: "Faint grid" },
    { id: "dots", label: "Dot Matrix", desc: "Subtle dots" },
    { id: "scanlines", label: "Scanlines", desc: "CRT lines" },
    { id: "stars", label: "Star Field", desc: "Animated stars" },
    { id: "noise", label: "Noise", desc: "Grain texture" },
];

// ── Card holo overlay options ─────────────────────────────────────────
export const CARD_HOLO_EFFECTS = [
    { id: "none", label: "None", desc: "No overlay" },
    { id: "rainbow-foil", label: "Rainbow Foil", desc: "Holo shine" },
    { id: "chrome", label: "Chrome", desc: "Silver glint" },
    { id: "scanlines", label: "Scanlines", desc: "CRT grid" },
    { id: "sparkle", label: "Sparkle", desc: "Star glints" },
    { id: "bubble-gloss", label: "Bubble Gloss", desc: "Convex light" },
];

// ── Text effect options ───────────────────────────────────────────────
export const TEXT_EFFECTS = [
    { id: "none", label: "Clean", desc: "No effect" },
    { id: "glow", label: "Neon Glow", desc: "Color shadow" },
    { id: "chrome", label: "Chrome Gradient", desc: "Metallic fill" },
    { id: "gradient", label: "Color Gradient", desc: "Primary→accent" },
    { id: "scanline-flicker", label: "Scanline", desc: "CRT flicker" },
    { id: "holographic", label: "Holographic", desc: "Hue shift" },
];

// ── Border radius options ─────────────────────────────────────────────
export const BORDER_RADIUS_OPTIONS = [
    { id: "sharp", label: "Sharp", value: "4px" },
    { id: "rounded", label: "Round", value: "12px" },
    { id: "pill", label: "Pill", value: "24px" },
];

// ── Curated swatch palettes ───────────────────────────────────────────
export const COLOR_SWATCHES = [
    "#8A2EFF", "#FF2D87", "#00F7FF", "#B4FF00",
    "#FFD700", "#FF6B35", "#00FF41", "#E040FB",
    "#FF6FD8", "#00CED1", "#C0C0D0", "#536DFE",
    "#C084FC", "#0047FF", "#6A0DAD", "#FFFFFF",
];

// ── Built-in background gallery ──────────────────────────────────────
export const BG_GALLERY = [
    { id: "mesh_purple", label: "Purple Mesh", gradient: "radial-gradient(ellipse at 20% 50%, #3b006850 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #00F7FF18 0%, transparent 50%), linear-gradient(180deg, #0B0B12 0%, #1a0533 100%)" },
    { id: "sunset_vapor", label: "Sunset Vapor", gradient: "linear-gradient(135deg, #0d0520 0%, #2d1b4e 30%, #1a0d30 60%, #0B0B12 100%)" },
    { id: "neon_grid", label: "Neon Grid", gradient: "linear-gradient(180deg, #0B0B12 0%, #0d0520 100%)" },
    { id: "ocean_deep", label: "Ocean Deep", gradient: "radial-gradient(ellipse at 50% 100%, #002030 0%, transparent 70%), linear-gradient(180deg, #0B0B12 0%, #0a1520 100%)" },
    { id: "aurora", label: "Aurora", gradient: "radial-gradient(ellipse at 30% 0%, #00FF4118 0%, transparent 40%), radial-gradient(ellipse at 70% 100%, #8A2EFF18 0%, transparent 40%), linear-gradient(180deg, #0B0B12 0%, #0d0d20 100%)" },
    { id: "rose_gold", label: "Rose Gold", gradient: "radial-gradient(ellipse at 50% 50%, #FF69B412 0%, transparent 50%), linear-gradient(160deg, #1a0d15 0%, #0B0B12 100%)" },
    { id: "cyber_sunset", label: "Cyber Sunset", gradient: "linear-gradient(135deg, #0a0010 0%, #1a0a2e 30%, #2a0a1e 60%, #0B0B12 100%)" },
    { id: "chrome_sky", label: "Chrome Sky", gradient: "linear-gradient(135deg, #0d0d15 0%, #1a1a25 30%, #15151f 60%, #0B0B12 100%)" },
];

// ── Helper: auto-generate muted colors ────────────────────────────────
function toMuted(hex: string): string {
    return hex + "4D"; // ~30% opacity
}

// ── Preset builder ──────────────────────────────────────────────────
function makePreset(p: {
    id: string;
    primary: string; accent: string;
    fontDisplay: string; fontBody: string; fontMono: string;
    cardStyle?: string; bgEffect?: string; textEffect?: string;
    glowIntensity?: number; bgGradient?: string;
    glassBlur?: number; glassOpacity?: number;
}): ThemeConfig {
    return {
        theme_id: p.id,
        primary_color: p.primary,
        primary_muted: toMuted(p.primary),
        secondary_color: p.accent,
        accent_color: p.accent,
        accent_muted: toMuted(p.accent),
        text_color: "#FFFFFF",
        text_secondary: "#9CA3AF",
        text_muted: "#6B7280",
        text_on_primary: "#FFFFFF",
        card_bg: "rgba(15,12,41,0.8)",
        surface_border: "rgba(255,255,255,0.08)",
        page_bg: "#0B0B12",
        font_family: p.fontDisplay,
        font_body: p.fontBody,
        font_mono: p.fontMono,
        font_size_scale: 1.0,
        heading_style: p.textEffect ?? "gradient",
        name_effect: "none",
        card_style: p.cardStyle ?? "glass",
        button_style: "solid-glow",
        bg_effect: p.bgEffect ?? "none",
        card_holo_effect: "none",
        glow_intensity: p.glowIntensity ?? 60,
        glow_enabled: true,
        glass_blur: p.glassBlur ?? 12,
        glass_opacity: p.glassOpacity ?? 80,
        shadow_strength: 1.0,
        border_radius: "rounded",
        animation_level: "subtle",
        enable_tilt: true,
        enable_behind_glow: true,
        bg_type: "none",
        bg_gradient: p.bgGradient ?? null,
        background_url: null,
        background_tiling: false,
        background_opacity: 100,
    };
}

// ── The 12 Ultimate Presets ───────────────────────────────────────────
export const THEME_PRESETS: Record<string, ThemeConfig> = {
    void_chrome: makePreset({
        id: "void_chrome",
        primary: "#8A2EFF", accent: "#00F7FF",
        fontDisplay: "Syne", fontBody: "Space Grotesk", fontMono: "JetBrains Mono",
        cardStyle: "glass", textEffect: "gradient", glowIntensity: 60,
        bgGradient: "linear-gradient(135deg, #0B0B12 0%, #1a0533 40%, #0d1117 100%)",
    }),
    cyber_pink: makePreset({
        id: "cyber_pink",
        primary: "#FF2D87", accent: "#FFD700",
        fontDisplay: "Rajdhani", fontBody: "Space Grotesk", fontMono: "Share Tech Mono",
        cardStyle: "chrome", textEffect: "chrome", glowIntensity: 70,
        bgGradient: "linear-gradient(160deg, #0a0010 0%, #1a0025 50%, #0B0B12 100%)",
    }),
    millennium_blue: makePreset({
        id: "millennium_blue",
        primary: "#0047FF", accent: "#00F7FF",
        fontDisplay: "Orbitron", fontBody: "Outfit", fontMono: "Inconsolata",
        cardStyle: "bubble", textEffect: "glow", glowIntensity: 50,
        glassBlur: 20, glassOpacity: 70,
        bgGradient: "linear-gradient(135deg, #000520 0%, #0a1535 50%, #0B0B12 100%)",
    }),
    acid_lime: makePreset({
        id: "acid_lime",
        primary: "#B4FF00", accent: "#FF6B35",
        fontDisplay: "Space Grotesk", fontBody: "Nunito", fontMono: "JetBrains Mono",
        cardStyle: "neon", bgEffect: "scanlines", textEffect: "glow", glowIntensity: 65,
        bgGradient: "linear-gradient(180deg, #050a00 0%, #0a1500 50%, #0B0B12 100%)",
    }),
    holographic: makePreset({
        id: "holographic",
        primary: "#C084FC", accent: "#00F7FF",
        fontDisplay: "Exo 2", fontBody: "Outfit", fontMono: "Space Mono",
        cardStyle: "holographic", textEffect: "holographic", glowIntensity: 50,
        bgGradient: "linear-gradient(135deg, #0d0520 0%, #0a0d30 50%, #150818 100%)",
    }),
    chrome_silver: makePreset({
        id: "chrome_silver",
        primary: "#C0C0D0", accent: "#8A2EFF",
        fontDisplay: "Barlow Condensed", fontBody: "Space Grotesk", fontMono: "JetBrains Mono",
        cardStyle: "chrome", textEffect: "chrome", glowIntensity: 30,
        glassBlur: 8, glassOpacity: 90,
        bgGradient: "linear-gradient(135deg, #0B0B12 0%, #151520 50%, #0d0d15 100%)",
    }),
    candy_gloss: makePreset({
        id: "candy_gloss",
        primary: "#FF6FD8", accent: "#B4FF00",
        fontDisplay: "Nunito", fontBody: "Outfit", fontMono: "JetBrains Mono",
        cardStyle: "bubble", textEffect: "gradient", glowIntensity: 55,
        glassBlur: 16, glassOpacity: 75,
        bgGradient: "linear-gradient(135deg, #1a0520 0%, #0d0520 50%, #150818 100%)",
    }),
    solar_flare: makePreset({
        id: "solar_flare",
        primary: "#FF6B35", accent: "#FFD700",
        fontDisplay: "Chakra Petch", fontBody: "Space Grotesk", fontMono: "Fira Mono",
        cardStyle: "neon", textEffect: "glow", glowIntensity: 65,
        bgGradient: "linear-gradient(135deg, #1a0d00 0%, #251500 50%, #0B0B12 100%)",
    }),
    matrix_ghost: makePreset({
        id: "matrix_ghost",
        primary: "#00FF41", accent: "#B4FF00",
        fontDisplay: "Share Tech Mono", fontBody: "Space Grotesk", fontMono: "Share Tech Mono",
        cardStyle: "neon", bgEffect: "scanlines", textEffect: "glow", glowIntensity: 55,
        bgGradient: "linear-gradient(180deg, #000a00 0%, #001a00 50%, #000500 100%)",
    }),
    aqua_dream: makePreset({
        id: "aqua_dream",
        primary: "#00CED1", accent: "#FF2D87",
        fontDisplay: "Outfit", fontBody: "Nunito", fontMono: "Source Code Pro",
        cardStyle: "glass", textEffect: "gradient", glowIntensity: 45,
        glassBlur: 18, glassOpacity: 65,
        bgGradient: "linear-gradient(145deg, #021a1a 0%, #0a2525 50%, #0B0B12 100%)",
    }),
    velvet_void: makePreset({
        id: "velvet_void",
        primary: "#6A0DAD", accent: "#FF2D87",
        fontDisplay: "Cinzel", fontBody: "Space Grotesk", fontMono: "JetBrains Mono",
        cardStyle: "glass", textEffect: "glow", glowIntensity: 50,
        glassBlur: 14, glassOpacity: 85,
        bgGradient: "linear-gradient(160deg, #0a0015 0%, #150025 50%, #0B0B12 100%)",
    }),
    pure_static: makePreset({
        id: "pure_static",
        primary: "#FFFFFF", accent: "#FF2D87",
        fontDisplay: "Anton", fontBody: "Outfit", fontMono: "JetBrains Mono",
        cardStyle: "minimal", bgEffect: "noise", textEffect: "none", glowIntensity: 10,
        glassBlur: 4, glassOpacity: 95,
        bgGradient: "linear-gradient(180deg, #0B0B12 0%, #111118 100%)",
    }),
};

// ── Gallery display metadata ─────────────────────────────────────────
export const PRESET_GALLERY: { id: string; label: string; tagline: string }[] = [
    { id: "void_chrome", label: "Void Chrome", tagline: "Electric darkness" },
    { id: "cyber_pink", label: "Cyber Pink", tagline: "Hot chrome Y2K" },
    { id: "millennium_blue", label: "Millennium Blue", tagline: "iMac era blue" },
    { id: "acid_lime", label: "Acid Lime", tagline: "Radioactive glow" },
    { id: "holographic", label: "Holographic", tagline: "Iridescent shift" },
    { id: "chrome_silver", label: "Chrome Silver", tagline: "Nokia metallic" },
    { id: "candy_gloss", label: "Candy Gloss", tagline: "Bubblegum pop" },
    { id: "solar_flare", label: "Solar Flare", tagline: "Warm fire tones" },
    { id: "matrix_ghost", label: "Matrix Ghost", tagline: "Terminal green" },
    { id: "aqua_dream", label: "Aqua Dream", tagline: "Winamp teal" },
    { id: "velvet_void", label: "Velvet Void", tagline: "Dark luxury" },
    { id: "pure_static", label: "Pure Static", tagline: "Glitch brutalism" },
];
