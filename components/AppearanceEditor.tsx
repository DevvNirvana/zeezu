"use client";

import React, { useState } from "react";
import {
    Palette, RotateCcw, CheckCircle2, ChevronDown, ChevronUp,
    Type, Layers, Image as ImageIcon, Sparkles, Sliders,
    MousePointer2, Zap,
} from "lucide-react";
import {
    type ThemeConfig, DEFAULT_THEME,
    THEME_PRESETS, PRESET_GALLERY,
    DISPLAY_FONTS, BODY_FONTS, MONO_FONTS,
    BUTTON_STYLES, CARD_STYLES, BG_EFFECTS, CARD_HOLO_EFFECTS, TEXT_EFFECTS,
    BORDER_RADIUS_OPTIONS, COLOR_SWATCHES, BG_GALLERY,
} from "@/components/ThemeEngine";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

// ── Sub-components ────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
            {children}
        </label>
    );
}

// ── Collapsible Section ──────────────────────────────────────────────
function Section({
    id, icon, title, titleColor, desc, children, isOpen, onToggle, spotlightColor,
}: {
    id: string; icon: React.ReactNode; title: string; titleColor: string;
    desc: string; children: React.ReactNode; isOpen: boolean;
    onToggle: () => void; spotlightColor: string;
}) {
    return (
        <SpotlightCard
            className="rounded-2xl border border-gray-800/80 overflow-hidden"
            spotlightColor={spotlightColor}
        >
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 sm:p-5 group"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div
                        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{
                            background: `linear-gradient(135deg, ${titleColor}18, ${titleColor}08)`,
                            border: `1px solid ${titleColor}25`,
                            boxShadow: `0 0 12px ${titleColor}10`,
                        }}
                    >
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white/90 flex items-center gap-1.5">
                            {title}
                            <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: titleColor, boxShadow: `0 0 6px ${titleColor}60` }}
                            />
                        </h4>
                        <p className="text-[9px] text-gray-600 font-mono mt-0.5 truncate">{desc}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 ml-2">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>
            {isOpen && (
                <div className="px-3 sm:px-5 pb-5 space-y-4">
                    {children}
                </div>
            )}
        </SpotlightCard>
    );
}

// ── Color Swatch Picker ──────────────────────────────────────────────
function ColorPicker({
    label, value, onChange,
}: {
    label: string; value: string; onChange: (v: string) => void;
}) {
    const [showSwatches, setShowSwatches] = useState(false);
    return (
        <div className="space-y-2">
            <FieldLabel>{label}</FieldLabel>
            <div className="flex items-center gap-2.5 bg-black/60 border border-gray-800 rounded-xl px-3 py-2">
                <input
                    type="color" value={value} onChange={e => onChange(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0"
                />
                <code className="text-[10px] font-mono text-gray-400 flex-1">{value.toUpperCase()}</code>
                <button
                    type="button"
                    onClick={() => setShowSwatches(!showSwatches)}
                    className="text-[8px] font-mono text-gray-600 hover:text-gray-400 px-1.5 py-0.5 border border-gray-800 rounded-md transition-colors"
                >
                    {showSwatches ? "Hide" : "Swatches"}
                </button>
            </div>
            {showSwatches && (
                <div className="grid grid-cols-8 gap-1.5 pt-1">
                    {COLOR_SWATCHES.map(swatch => (
                        <button
                            key={swatch}
                            type="button"
                            onClick={() => { onChange(swatch); setShowSwatches(false); }}
                            className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${value === swatch ? "border-white shadow-[0_0_8px_rgba(255,255,255,0.3)] scale-110" : "border-gray-800"
                                }`}
                            style={{ backgroundColor: swatch }}
                            title={swatch}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Font Picker Row ──────────────────────────────────────────────────
function FontPicker({
    label, value, onChange, options, accentColor,
}: {
    label: string; value: string;
    onChange: (v: string) => void;
    options: { id: string; label: string; preview: string }[];
    accentColor: string;
}) {
    return (
        <div className="space-y-2">
            <FieldLabel>{label}</FieldLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {options.map(font => {
                    const isActive = value === font.id;
                    return (
                        <button
                            key={font.id}
                            type="button"
                            onClick={() => onChange(font.id)}
                            className={`flex flex-col items-start p-2.5 rounded-xl border transition-all ${isActive
                                ? `border-opacity-40 bg-opacity-5 scale-[1.02]`
                                : "border-gray-800 hover:border-gray-600 bg-black/30"
                                }`}
                            style={isActive ? { borderColor: `${accentColor}66`, backgroundColor: `${accentColor}0D` } : {}}
                        >
                            <span
                                className="text-base font-bold text-white/90 leading-tight truncate w-full"
                                style={{ fontFamily: `'${font.id}', sans-serif` }}
                            >
                                ZEEZU
                            </span>
                            <span className="text-[7px] font-mono text-gray-500 mt-0.5 truncate w-full">{font.label}</span>
                            <span className="text-[6px] text-gray-700 font-mono">{font.preview}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────
interface AppearanceEditorProps {
    custom: ThemeConfig;
    patchCustom: (patch: Partial<ThemeConfig>) => void;
}

export default function AppearanceEditor({ custom, patchCustom }: AppearanceEditorProps) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        themes: true, colors: false, typography: false,
        components: false, surface: false, background: false,
    });

    const toggle = (key: string) =>
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

    const spot = `${custom.primary_color}12`;

    return (
        <div className="space-y-3">

            {/* ═══════════════════ THEME GALLERY ═══════════════════ */}
            <Section
                id="themes"
                icon={<Palette className="w-3.5 h-3.5" style={{ color: "#8A2EFF" }} />}
                title="Theme Gallery" titleColor="#8A2EFF"
                desc="12 curated Y2K-inspired presets"
                isOpen={!!openSections.themes} onToggle={() => toggle("themes")} spotlightColor={spot}
            >
                <div className="flex items-center justify-between">
                    <p className="text-[9px] text-gray-600 font-mono">Pick a starting point · customize below</p>
                    <button
                        onClick={() => patchCustom(DEFAULT_THEME)}
                        className="text-[9px] text-gray-600 hover:text-white font-mono flex items-center gap-1 transition-colors"
                    >
                        <RotateCcw className="w-2.5 h-2.5" /> Reset All
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PRESET_GALLERY.map(p => {
                        const preset = THEME_PRESETS[p.id];
                        if (!preset) return null;
                        const isActive = custom.theme_id === p.id;
                        const primary = preset.primary_color;
                        const secondary = preset.secondary_color;
                        const accent = preset.accent_color;
                        const bgGrad = preset.bg_gradient || `linear-gradient(135deg, #0B0B12, #1a1a25)`;

                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => patchCustom({ ...preset, theme_id: p.id })}
                                className={`relative flex flex-col rounded-xl border overflow-hidden transition-all duration-300 group ${isActive
                                    ? "border-white/30 scale-[1.02] shadow-lg"
                                    : "border-gray-800/60 hover:border-gray-600 hover:scale-[1.01]"
                                    }`}
                                style={isActive ? { boxShadow: `0 0 20px ${primary}30, 0 0 40px ${primary}15` } : {}}
                            >
                                {/* Mini preview */}
                                <div className="w-full h-16 relative overflow-hidden" style={{ background: bgGrad }}>
                                    <div
                                        className="absolute bottom-1.5 left-1.5 right-1.5 h-7 rounded-md border border-white/10"
                                        style={{
                                            background: `linear-gradient(135deg, ${primary}15, ${secondary}08)`,
                                            backdropFilter: "blur(4px)",
                                        }}
                                    >
                                        <div className="flex items-center gap-1 px-2 h-full">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primary, boxShadow: `0 0 4px ${primary}60` }} />
                                            <div className="flex-1 space-y-0.5">
                                                <div className="h-1 rounded-full w-3/4" style={{ backgroundColor: `${primary}50` }} />
                                                <div className="h-0.5 rounded-full w-1/2" style={{ backgroundColor: `${secondary}30` }} />
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                                        </div>
                                    </div>
                                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full opacity-20 blur-md" style={{ backgroundColor: primary }} />
                                    <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full opacity-15 blur-sm" style={{ backgroundColor: secondary }} />
                                </div>

                                {/* Label + font preview */}
                                <div className="px-2.5 py-2 bg-black/40">
                                    <p className="text-[10px] font-bold text-white/90 text-left" style={{ fontFamily: `'${preset.font_family}', sans-serif` }}>{p.label}</p>
                                    <p className="text-[7px] font-mono text-gray-600 text-left">{p.tagline}</p>
                                </div>

                                {isActive && (
                                    <div className="absolute top-1.5 right-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-white drop-shadow-lg" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </Section>

            {/* ═══════════════════ COLORS ═══════════════════ */}
            <Section
                id="colors"
                icon={<Sparkles className="w-3.5 h-3.5" style={{ color: "#00F7FF" }} />}
                title="Colors" titleColor="#00F7FF"
                desc="Primary, accent, text & surface colors"
                isOpen={!!openSections.colors} onToggle={() => toggle("colors")} spotlightColor={spot}
            >
                {/* Gradient preview */}
                <div className="space-y-1.5">
                    <FieldLabel>Live Preview</FieldLabel>
                    <div
                        className="h-6 rounded-xl overflow-hidden"
                        style={{
                            background: `linear-gradient(90deg, ${custom.primary_color}, ${custom.secondary_color}, ${custom.accent_color})`,
                            boxShadow: `0 0 16px ${custom.primary_color}30`,
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorPicker label="Primary" value={custom.primary_color} onChange={v => patchCustom({ primary_color: v, primary_muted: v + '4D', theme_id: "custom" })} />
                    <ColorPicker label="Accent" value={custom.accent_color} onChange={v => patchCustom({ accent_color: v, secondary_color: v, accent_muted: v + '4D', theme_id: "custom" })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorPicker label="Text" value={custom.text_color} onChange={v => patchCustom({ text_color: v, theme_id: "custom" })} />
                    <ColorPicker label="Surface Border" value={custom.surface_border?.startsWith('#') ? custom.surface_border : '#1f1f1f'} onChange={v => patchCustom({ surface_border: v, theme_id: "custom" })} />
                </div>
            </Section>

            {/* ═══════════════════ TYPOGRAPHY ═══════════════════ */}
            <Section
                id="typography"
                icon={<Type className="w-3.5 h-3.5" style={{ color: "#FFD700" }} />}
                title="Typography" titleColor="#FFD700"
                desc="3-font system + text effects"
                isOpen={!!openSections.typography} onToggle={() => toggle("typography")} spotlightColor={spot}
            >
                <FontPicker
                    label="Display Font (headings, name)"
                    value={custom.font_family}
                    onChange={v => patchCustom({ font_family: v, theme_id: "custom" })}
                    options={DISPLAY_FONTS}
                    accentColor="#FFD700"
                />
                <FontPicker
                    label="Body Font (nav, labels, body text)"
                    value={custom.font_body || 'Space Grotesk'}
                    onChange={v => patchCustom({ font_body: v, theme_id: "custom" })}
                    options={BODY_FONTS}
                    accentColor="#FFD700"
                />
                <FontPicker
                    label="Mono Font (ZIDs, stats, scores)"
                    value={custom.font_mono || 'JetBrains Mono'}
                    onChange={v => patchCustom({ font_mono: v, theme_id: "custom" })}
                    options={MONO_FONTS}
                    accentColor="#FFD700"
                />

                {/* Font size */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <FieldLabel>Font Size</FieldLabel>
                        <span className="text-[9px] font-mono text-gray-600">
                            {Math.round(custom.font_size_scale * 100)}%
                        </span>
                    </div>
                    <input
                        type="range" min={85} max={120} step={5}
                        value={Math.round(custom.font_size_scale * 100)}
                        onChange={e => patchCustom({ font_size_scale: parseInt(e.target.value) / 100, theme_id: "custom" })}
                        className="w-full h-1.5 rounded-full"
                        style={{ accentColor: "#FFD700" }}
                    />
                </div>

                {/* Text effect */}
                <div className="space-y-2">
                    <FieldLabel>Text Display Effect</FieldLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TEXT_EFFECTS.map(effect => {
                            const isActive = custom.heading_style === effect.id;
                            return (
                                <button
                                    key={effect.id}
                                    type="button"
                                    onClick={() => patchCustom({ heading_style: effect.id, theme_id: "custom" })}
                                    className={`px-3 py-2.5 rounded-xl border text-center transition-all ${isActive
                                        ? "border-yellow-500/40 bg-yellow-500/5 text-white"
                                        : "border-gray-800 text-gray-500 hover:border-gray-600"
                                        }`}
                                >
                                    <span className="text-xs font-bold block">{effect.label}</span>
                                    <span className="text-[7px] font-mono text-gray-600">{effect.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Name effect */}
                <div className="space-y-2">
                    <FieldLabel>Display Name Effect</FieldLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(["none", "gradient", "shiny", "glitch"] as const).map(effect => {
                            const isActive = custom.name_effect === effect;
                            return (
                                <button
                                    key={effect}
                                    type="button"
                                    onClick={() => patchCustom({ name_effect: effect, theme_id: "custom" })}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-mono capitalize transition-all ${isActive
                                        ? "border-yellow-500/40 bg-yellow-500/5 text-white"
                                        : "border-gray-800 text-gray-500 hover:border-gray-600"
                                        }`}
                                >
                                    {effect}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Section>

            {/* ═══════════════════ COMPONENT STYLES ═══════════════════ */}
            <Section
                id="components"
                icon={<Layers className="w-3.5 h-3.5" style={{ color: "#FF69B4" }} />}
                title="Component Styles" titleColor="#FF69B4"
                desc="Buttons, cards, effects & overlays"
                isOpen={!!openSections.components} onToggle={() => toggle("components")} spotlightColor={spot}
            >
                {/* ── Button Styles ── */}
                <div className="space-y-2">
                    <FieldLabel>Button Style</FieldLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {BUTTON_STYLES.map(style => {
                            const isActive = custom.button_style === style.id;
                            // Mini button preview styles
                            const btnPreview = style.id === 'solid-glow'
                                ? { background: custom.primary_color, color: '#fff', border: 'none', boxShadow: `0 0 8px ${custom.primary_color}50` }
                                : style.id === 'glass-pill'
                                    ? { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(6px)', color: custom.primary_color, border: `1px solid ${custom.primary_color}30`, borderRadius: '999px' }
                                    : style.id === 'chrome-bevel'
                                        ? { background: 'linear-gradient(180deg, rgba(220,220,220,0.15), rgba(150,150,150,0.08))', color: '#fff', border: '1px solid rgba(200,200,200,0.3)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }
                                        : style.id === 'bubble-3d'
                                            ? { background: `${custom.primary_color}15`, color: custom.primary_color, border: `2px solid ${custom.primary_color}30`, borderRadius: '999px', boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.08)' }
                                            : style.id === 'outline-pulse'
                                                ? { background: 'transparent', color: custom.primary_color, border: `2px solid ${custom.primary_color}`, boxShadow: `0 0 8px ${custom.primary_color}40` }
                                                : { background: custom.primary_color, color: '#fff', border: '2px solid #000', borderRadius: '0', boxShadow: '3px 3px 0 #000', fontWeight: 800 };

                            return (
                                <button
                                    key={style.id}
                                    type="button"
                                    onClick={() => patchCustom({ button_style: style.id, theme_id: "custom" })}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isActive ? "ring-1 ring-pink-500/40 border-pink-500/20" : "border-gray-800 hover:border-gray-600"
                                        }`}
                                >
                                    {/* Live button preview */}
                                    <div
                                        className="w-full py-1.5 rounded-lg text-[9px] font-bold text-center transition-all"
                                        style={{ ...btnPreview, borderRadius: btnPreview.borderRadius || '8px' }}
                                    >
                                        Buzz
                                    </div>
                                    <span className="text-[8px] font-bold text-white/70">{style.label}</span>
                                    <span className="text-[6px] font-mono text-gray-600">{style.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Card Styles ── */}
                <div className="space-y-2">
                    <FieldLabel>Card Surface Style</FieldLabel>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {CARD_STYLES.map(style => {
                            const isActive = custom.card_style === style.id;
                            const cardPreview = style.id === 'neon'
                                ? { border: `2px solid ${custom.primary_color}`, boxShadow: `0 0 10px ${custom.primary_color}40`, background: 'rgba(0,0,0,0.4)' }
                                : style.id === 'chrome'
                                    ? { border: '1px solid rgba(200,200,200,0.3)', background: 'linear-gradient(135deg, rgba(200,200,200,0.06), rgba(100,100,100,0.1))' }
                                    : style.id === 'glass'
                                        ? { border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.03)' }
                                        : style.id === 'holographic'
                                            ? { border: '1px solid rgba(255,255,255,0.15)', background: `linear-gradient(135deg, ${custom.primary_color}08, ${custom.secondary_color}08, ${custom.accent_color}08)` }
                                            : style.id === 'bubble'
                                                ? { border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.06)' }
                                                : { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' };

                            return (
                                <button
                                    key={style.id}
                                    type="button"
                                    onClick={() => patchCustom({ card_style: style.id, theme_id: "custom" })}
                                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${isActive ? "ring-1 ring-pink-500/40 scale-105" : ""
                                        }`}
                                    style={cardPreview}
                                >
                                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: custom.primary_color, boxShadow: `0 0 4px ${custom.primary_color}50` }} />
                                    <span className="text-[8px] font-bold text-white/70">{style.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Background Effects ── */}
                <div className="space-y-2">
                    <FieldLabel>Background Effect</FieldLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {BG_EFFECTS.map(effect => {
                            const isActive = custom.bg_effect === effect.id;
                            // Mini visual preview per effect
                            const effectPreview = effect.id === 'grid'
                                ? { backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '10px 10px' }
                                : effect.id === 'dots'
                                    ? { backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '8px 8px' }
                                    : effect.id === 'scanlines'
                                        ? { backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }
                                        : effect.id === 'noise'
                                            ? { filter: 'url(#noise)', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")' }
                                            : {};

                            return (
                                <button
                                    key={effect.id}
                                    type="button"
                                    onClick={() => patchCustom({ bg_effect: effect.id, theme_id: "custom" })}
                                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border overflow-hidden transition-all ${isActive
                                        ? "border-pink-500/40 bg-pink-500/5 text-white"
                                        : "border-gray-800 text-gray-500 hover:border-gray-600"
                                        }`}
                                >
                                    {/* Effect pattern preview */}
                                    <div
                                        className="absolute inset-0 opacity-60 pointer-events-none"
                                        style={effectPreview}
                                    />
                                    <span className="relative text-xs font-bold">{effect.label}</span>
                                    <span className="relative text-[7px] font-mono">{effect.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Card Holo Overlay ── */}
                <div className="space-y-2">
                    <FieldLabel>Card Holographic Overlay</FieldLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CARD_HOLO_EFFECTS.map(effect => {
                            const isActive = custom.card_holo_effect === effect.id;
                            return (
                                <button
                                    key={effect.id}
                                    type="button"
                                    onClick={() => patchCustom({ card_holo_effect: effect.id, theme_id: "custom" })}
                                    className={`px-3 py-2.5 rounded-xl border text-center transition-all ${isActive
                                        ? "border-pink-500/40 bg-pink-500/5 text-white"
                                        : "border-gray-800 text-gray-500 hover:border-gray-600"
                                        }`}
                                >
                                    <span className="text-[10px] font-bold block">{effect.label}</span>
                                    <span className="text-[6px] font-mono text-gray-600">{effect.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Section>

            {/* ═══════════════════ SURFACE CONTROLS ═══════════════════ */}
            <Section
                id="surface"
                icon={<Sliders className="w-3.5 h-3.5" style={{ color: "#E040FB" }} />}
                title="Surface & Effects" titleColor="#E040FB"
                desc="Glass, glow, shadows & borders"
                isOpen={!!openSections.surface} onToggle={() => toggle("surface")} spotlightColor={spot}
            >
                {/* Glass blur */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <FieldLabel>Glass Blur</FieldLabel>
                        <span className="text-[9px] font-mono text-gray-600">{custom.glass_blur ?? 12}px</span>
                    </div>
                    <input
                        type="range" min={0} max={40} step={2}
                        value={custom.glass_blur ?? 12}
                        onChange={e => patchCustom({ glass_blur: parseInt(e.target.value), theme_id: "custom" })}
                        className="w-full h-1.5 rounded-full"
                        style={{ accentColor: "#E040FB" }}
                    />
                    {/* Preview */}
                    <div
                        className="h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                        style={{
                            backdropFilter: `blur(${custom.glass_blur ?? 12}px)`,
                            background: `rgba(255,255,255,${(custom.glass_opacity ?? 80) / 100 * 0.05})`,
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <span className="text-[9px] font-mono text-white/40">Glass Preview</span>
                    </div>
                </div>

                {/* Surface opacity */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <FieldLabel>Surface Opacity</FieldLabel>
                        <span className="text-[9px] font-mono text-gray-600">{custom.glass_opacity ?? 80}%</span>
                    </div>
                    <input
                        type="range" min={10} max={95} step={5}
                        value={custom.glass_opacity ?? 80}
                        onChange={e => patchCustom({ glass_opacity: parseInt(e.target.value), theme_id: "custom" })}
                        className="w-full h-1.5 rounded-full"
                        style={{ accentColor: "#E040FB" }}
                    />
                </div>

                {/* Glow intensity */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <FieldLabel>Glow Intensity</FieldLabel>
                        <span className="text-[9px] font-mono text-gray-600">{custom.glow_intensity}%</span>
                    </div>
                    <div className="relative">
                        <input
                            type="range" min={0} max={100} step={5}
                            value={custom.glow_intensity}
                            onChange={e => patchCustom({ glow_intensity: parseInt(e.target.value), theme_id: "custom" })}
                            className="w-full h-1.5 rounded-full"
                            style={{ accentColor: "#E040FB" }}
                        />
                        <div
                            className="h-1 rounded-full mt-2 transition-all duration-300"
                            style={{
                                background: custom.primary_color,
                                boxShadow: `0 0 ${custom.glow_intensity * 0.4}px ${custom.primary_color}${Math.min(99, Math.round(custom.glow_intensity * 0.9)).toString(16).padStart(2, '0')}`,
                                opacity: custom.glow_intensity / 100,
                            }}
                        />
                    </div>
                </div>

                {/* Shadow strength */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <FieldLabel>Shadow Strength</FieldLabel>
                        <span className="text-[9px] font-mono text-gray-600">{(custom.shadow_strength ?? 1).toFixed(1)}x</span>
                    </div>
                    <input
                        type="range" min={0} max={30} step={1}
                        value={Math.round((custom.shadow_strength ?? 1) * 10)}
                        onChange={e => patchCustom({ shadow_strength: parseInt(e.target.value) / 10, theme_id: "custom" })}
                        className="w-full h-1.5 rounded-full"
                        style={{ accentColor: "#E040FB" }}
                    />
                </div>

                {/* Border radius */}
                <div className="space-y-2">
                    <FieldLabel>Border Radius</FieldLabel>
                    <div className="flex gap-2">
                        {BORDER_RADIUS_OPTIONS.map(opt => {
                            const isActive = custom.border_radius === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => patchCustom({ border_radius: opt.id, theme_id: "custom" })}
                                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${isActive
                                        ? "border-purple-500/40 bg-purple-500/5 text-white"
                                        : "border-gray-800 text-gray-500 hover:border-gray-600"
                                        }`}
                                >
                                    <div
                                        className="w-10 h-6 border-2 transition-all"
                                        style={{ borderRadius: opt.value, borderColor: isActive ? custom.primary_color : "#444" }}
                                    />
                                    <span className="text-[8px] font-mono">{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Animation level */}
                <div className="space-y-2">
                    <FieldLabel>Animation Level</FieldLabel>
                    <div className="flex gap-2">
                        {(["none", "subtle", "full"] as const).map(level => {
                            const isActive = custom.animation_level === level;
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => patchCustom({ animation_level: level, theme_id: "custom" })}
                                    className={`flex-1 py-2 rounded-xl border text-[10px] font-mono capitalize transition-all ${isActive
                                        ? "border-purple-500/40 bg-purple-500/5 text-white"
                                        : "border-gray-800 text-gray-500 hover:border-gray-600"
                                        }`}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Advanced Toggles ── */}
                <div className="space-y-3 pt-2 border-t border-gray-800/40">
                    <FieldLabel>Advanced Toggles</FieldLabel>
                    {([
                        { key: 'glow_enabled' as const, label: 'Enable Glow Effects', icon: <Sparkles className="w-3 h-3" /> },
                        { key: 'enable_tilt' as const, label: 'Card Tilt on Hover', icon: <MousePointer2 className="w-3 h-3" /> },
                        { key: 'enable_behind_glow' as const, label: 'Card Behind-Glow', icon: <Zap className="w-3 h-3" /> },
                    ]).map(toggle => (
                        <label key={toggle.key} className="flex items-center justify-between cursor-pointer group">
                            <span className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                {toggle.icon}
                                {toggle.label}
                            </span>
                            <button
                                type="button"
                                onClick={() => patchCustom({ [toggle.key]: !custom[toggle.key] })}
                                className={`relative w-9 h-5 rounded-full transition-all duration-300 ${custom[toggle.key] ? '' : 'bg-gray-800'
                                    }`}
                                style={custom[toggle.key] ? { backgroundColor: custom.primary_color } : {}}
                            >
                                <span
                                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${custom[toggle.key] ? 'translate-x-4' : 'translate-x-0.5'
                                        }`}
                                />
                            </button>
                        </label>
                    ))}
                </div>
            </Section>

            {/* ═══════════════════ BACKGROUND ═══════════════════ */}
            <Section
                id="background"
                icon={<ImageIcon className="w-3.5 h-3.5" style={{ color: "#00FF41" }} />}
                title="Background" titleColor="#00FF41"
                desc="Wallpaper, gradients, and overlays"
                isOpen={!!openSections.background} onToggle={() => toggle("background")} spotlightColor={spot}
            >
                {/* Background type */}
                <div className="space-y-2">
                    <FieldLabel>Background Type</FieldLabel>
                    <div className="flex gap-2">
                        {(["none", "gradient", "image"] as const).map(type => {
                            const isActive = custom.bg_type === type;
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => patchCustom({ bg_type: type, theme_id: "custom" })}
                                    className={`flex-1 py-2 rounded-xl border text-[10px] font-mono capitalize transition-all ${isActive
                                        ? "border-green-500/40 bg-green-500/5 text-white"
                                        : "border-gray-800 text-gray-500 hover:border-gray-600"
                                        }`}
                                >
                                    {type}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Gradient gallery */}
                {custom.bg_type === "gradient" && (
                    <div className="space-y-2">
                        <FieldLabel>Gradient Gallery</FieldLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {BG_GALLERY.map(bg => {
                                const isActive = custom.bg_gradient === bg.gradient;
                                return (
                                    <button
                                        key={bg.id}
                                        type="button"
                                        onClick={() => patchCustom({ bg_gradient: bg.gradient, bg_type: "gradient" })}
                                        className={`flex flex-col rounded-xl border overflow-hidden transition-all ${isActive
                                            ? "border-green-500/40 scale-105 shadow-lg"
                                            : "border-gray-800 hover:border-gray-600"
                                            }`}
                                    >
                                        <div className="h-12 w-full" style={{ background: bg.gradient }} />
                                        <div className="px-2 py-1.5 bg-black/60">
                                            <p className="text-[8px] font-mono text-gray-400">{bg.label}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div>
                            <FieldLabel>Custom CSS Gradient</FieldLabel>
                            <input
                                value={custom.bg_gradient || ""}
                                onChange={e => patchCustom({ bg_gradient: e.target.value || null })}
                                placeholder="linear-gradient(135deg, #0B0B12, #1a0533)"
                                className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-green-500 rounded-xl px-3.5 py-2.5 text-white text-sm font-mono outline-none transition-colors"
                            />
                        </div>

                        {custom.bg_gradient && (
                            <div className="h-16 rounded-xl border border-gray-800 overflow-hidden" style={{ background: custom.bg_gradient }}>
                                <div className="h-full flex items-center justify-center">
                                    <span className="text-[9px] font-mono text-white/40 bg-black/30 px-2 py-1 rounded">PREVIEW</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Image URL */}
                {custom.bg_type === "image" && (
                    <div className="space-y-3">
                        <div>
                            <FieldLabel>Image URL</FieldLabel>
                            <input
                                value={custom.background_url || ""}
                                onChange={e => patchCustom({ background_url: e.target.value || null })}
                                placeholder="https://i.imgur.com/... (try an animated GIF!)"
                                className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-green-500 rounded-xl px-3.5 py-2.5 text-white text-sm font-mono outline-none transition-colors"
                            />
                        </div>

                        {custom.background_url && (
                            <div className="relative rounded-xl overflow-hidden border border-gray-800" style={{ height: 100 }}>
                                <img
                                    src={custom.background_url}
                                    className="w-full h-full object-cover"
                                    style={{ opacity: (custom.background_opacity ?? 100) / 100 }}
                                    alt="background preview"
                                    onError={e => { (e.target as HTMLImageElement).src = ""; }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[9px] font-mono text-white/60 bg-black/50 px-2 py-1 rounded">
                                        PREVIEW · Opacity {custom.background_opacity}%
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <button
                                    type="button"
                                    onClick={() => patchCustom({ background_tiling: !custom.background_tiling })}
                                    className={`relative w-9 h-5 rounded-full transition-all duration-300 ${custom.background_tiling ? '' : 'bg-gray-800'
                                        }`}
                                    style={custom.background_tiling ? { backgroundColor: '#00FF41' } : {}}
                                >
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${custom.background_tiling ? 'translate-x-4' : 'translate-x-0.5'
                                        }`} />
                                </button>
                                <span className="text-xs text-gray-400">Tile image</span>
                            </label>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <FieldLabel>Opacity</FieldLabel>
                                    <span className="text-[9px] font-mono text-gray-600">{custom.background_opacity}%</span>
                                </div>
                                <input
                                    type="range" min={10} max={100} step={5}
                                    value={custom.background_opacity}
                                    onChange={e => patchCustom({ background_opacity: parseInt(e.target.value) })}
                                    className="w-full h-1.5 rounded-full"
                                    style={{ accentColor: "#00FF41" }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {custom.bg_type === "none" && (
                    <p className="text-[9px] text-gray-700 font-mono">
                        💡 Choose &quot;gradient&quot; or &quot;image&quot; for a custom background
                    </p>
                )}
            </Section>

        </div>
    );
}
