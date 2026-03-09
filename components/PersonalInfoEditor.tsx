"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Eye, EyeOff, ChevronDown, ChevronUp, Hexagon, Fingerprint, Briefcase, ShieldAlert } from "lucide-react";
import type { ZodiacSign, HexItem } from "@/components/ProfileCard";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

// ── Field value + metadata ──────────────────────────────────────────────
export interface PersonalInfoField {
    value: string;
    visible: boolean;
    on_card: boolean;
}

export type PersonalInfoData = Record<string, PersonalInfoField>;

// ── Field definition registry ───────────────────────────────────────────
interface FieldDef {
    key: string;
    label: string;
    group: "core" | "lifestyle" | "personal";
    type: "select" | "date" | "height" | "multi" | "text";
    options?: string[];
    placeholder?: string;
    /** hex icon type for ProfileCard */
    iconType: HexItem["iconType"];
    /** Default neon color */
    color: string;
    glow: string;
    /** Default visibility */
    defaultVisible: boolean;
    /** Default on_card */
    defaultOnCard: boolean;
}

const ZODIAC_OPTIONS = [
    "Aries ♈", "Taurus ♉", "Gemini ♊", "Cancer ♋", "Leo ♌", "Virgo ♍",
    "Libra ♎", "Scorpio ♏", "Sagittarius ♐", "Capricorn ♑", "Aquarius ♒", "Pisces ♓",
];

export const FIELD_DEFS: FieldDef[] = [
    // ── Core ──────────────────────────────────────────────────
    {
        key: "zodiac", label: "Zodiac Sign", group: "core", type: "select", iconType: "aries", color: "#FF6B35", glow: "rgba(255,107,53,0.5)", defaultVisible: true, defaultOnCard: true,
        options: ZODIAC_OPTIONS
    },
    { key: "birthday", label: "Birthday", group: "core", type: "date", iconType: "age", color: "#FF2D87", glow: "rgba(255,45,135,0.5)", defaultVisible: true, defaultOnCard: true },
    {
        key: "gender", label: "Gender", group: "core", type: "select", iconType: "gender", color: "#C084FC", glow: "rgba(192,132,252,0.5)", defaultVisible: true, defaultOnCard: true,
        options: ["Male", "Female", "Non-binary", "Transgender", "Other", "Prefer not to say"]
    },
    { key: "height_cm", label: "Height", group: "core", type: "height", iconType: "height", color: "#00F7FF", glow: "rgba(0,247,255,0.5)", defaultVisible: true, defaultOnCard: true },
    { key: "location", label: "Location", group: "core", type: "text", iconType: "location", color: "#B4FF00", glow: "rgba(180,255,0,0.5)", defaultVisible: true, defaultOnCard: true, placeholder: "City, Country" },
    {
        key: "relationship", label: "Relationship Status", group: "core", type: "select", iconType: "relationship", color: "#FF007A", glow: "rgba(255,0,122,0.5)", defaultVisible: true, defaultOnCard: true,
        options: ["Single", "In a relationship", "Engaged", "Married", "Divorced", "It's complicated", "Open relationship", "Prefer not to say"]
    },
    {
        key: "looking_for", label: "Looking For", group: "core", type: "multi", iconType: "lookingFor", color: "#FFD700", glow: "rgba(255,215,0,0.5)", defaultVisible: true, defaultOnCard: true,
        options: ["Friends", "Dating", "Networking", "Chat", "Hookups", "Nothing specific"]
    },

    // ── Lifestyle ─────────────────────────────────────────────
    { key: "work", label: "Work", group: "lifestyle", type: "text", iconType: "location", color: "#00F7FF", glow: "rgba(0,247,255,0.4)", defaultVisible: true, defaultOnCard: false, placeholder: "Company name" },
    { key: "job_title", label: "Job Title", group: "lifestyle", type: "text", iconType: "gender", color: "#B4FF00", glow: "rgba(180,255,0,0.4)", defaultVisible: true, defaultOnCard: false, placeholder: "Your role" },
    { key: "school", label: "School", group: "lifestyle", type: "text", iconType: "location", color: "#C084FC", glow: "rgba(192,132,252,0.4)", defaultVisible: true, defaultOnCard: false, placeholder: "University or school" },
    {
        key: "education", label: "Education Level", group: "lifestyle", type: "select", iconType: "age", color: "#FF6B35", glow: "rgba(255,107,53,0.4)", defaultVisible: true, defaultOnCard: false,
        options: ["High School", "Some College", "Associate's", "Bachelor's", "Master's", "Doctorate", "Trade School", "Prefer not to say"]
    },
    {
        key: "religion", label: "Religion", group: "lifestyle", type: "select", iconType: "birthday", color: "#FFD700", glow: "rgba(255,215,0,0.4)", defaultVisible: true, defaultOnCard: false,
        options: ["Christianity", "Islam", "Judaism", "Hinduism", "Buddhism", "Sikhism", "Atheist", "Agnostic", "Spiritual", "Other", "Prefer not to say"]
    },
    { key: "hometown", label: "Hometown", group: "lifestyle", type: "text", iconType: "location", color: "#FF2D87", glow: "rgba(255,45,135,0.4)", defaultVisible: true, defaultOnCard: false, placeholder: "Where you grew up" },
    {
        key: "politics", label: "Politics", group: "lifestyle", type: "select", iconType: "gender", color: "#00F7FF", glow: "rgba(0,247,255,0.4)", defaultVisible: true, defaultOnCard: false,
        options: ["Liberal", "Moderate", "Conservative", "Apolitical", "Other", "Prefer not to say"]
    },
    {
        key: "languages", label: "Languages", group: "lifestyle", type: "multi", iconType: "lookingFor", color: "#B4FF00", glow: "rgba(180,255,0,0.4)", defaultVisible: true, defaultOnCard: false,
        options: ["English", "Spanish", "French", "German", "Portuguese", "Hindi", "Arabic", "Mandarin", "Japanese", "Korean", "Russian", "Italian", "Other"]
    },

    // ── Personal / Sensitive ──────────────────────────────────
    {
        key: "sexuality", label: "Sexuality", group: "personal", type: "select", iconType: "relationship", color: "#C084FC", glow: "rgba(192,132,252,0.4)", defaultVisible: false, defaultOnCard: false,
        options: ["Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Asexual", "Queer", "Questioning", "Other", "Prefer not to say"]
    },
    {
        key: "ethnicity", label: "Ethnicity", group: "personal", type: "select", iconType: "gender", color: "#FF6B35", glow: "rgba(255,107,53,0.4)", defaultVisible: false, defaultOnCard: false,
        options: ["Asian", "Black", "Hispanic/Latino", "Middle Eastern", "Native American", "Pacific Islander", "White", "Mixed", "Other", "Prefer not to say"]
    },
    {
        key: "pets", label: "Pets", group: "personal", type: "select", iconType: "lookingFor", color: "#B4FF00", glow: "rgba(180,255,0,0.4)", defaultVisible: true, defaultOnCard: false,
        options: ["Dog", "Cat", "Bird", "Fish", "Reptile", "Multiple", "None", "Allergic"]
    },
    {
        key: "children", label: "Children", group: "personal", type: "select", iconType: "gender", color: "#FFD700", glow: "rgba(255,215,0,0.4)", defaultVisible: false, defaultOnCard: false,
        options: ["Have kids", "Want kids", "Don't want kids", "Maybe someday", "Prefer not to say"]
    },
    {
        key: "drinking", label: "Drinking", group: "personal", type: "select", iconType: "birthday", color: "#00F7FF", glow: "rgba(0,247,255,0.4)", defaultVisible: true, defaultOnCard: false,
        options: ["Never", "Socially", "Regularly", "Sober", "Prefer not to say"]
    },
    {
        key: "smoking", label: "Smoking", group: "personal", type: "select", iconType: "height", color: "#FF2D87", glow: "rgba(255,45,135,0.4)", defaultVisible: true, defaultOnCard: false,
        options: ["Never", "Socially", "Regularly", "Trying to quit", "Prefer not to say"]
    },
    {
        key: "marijuana", label: "Marijuana", group: "personal", type: "select", iconType: "height", color: "#C084FC", glow: "rgba(192,132,252,0.4)", defaultVisible: false, defaultOnCard: false,
        options: ["Never", "Socially", "Regularly", "Prefer not to say"]
    },
];

// ── Constants ───────────────────────────────────────────────────────────
const MAX_CARD_ITEMS = 7;
const GROUP_META = {
    core: { title: "Core Info", desc: "Essential profile details", icon: Fingerprint, color: "#C084FC" },
    lifestyle: { title: "Lifestyle", desc: "Work, education, interests", icon: Briefcase, color: "#00F7FF" },
    personal: { title: "Personal", desc: "Privacy-sensitive details", icon: ShieldAlert, color: "#FF2D87" },
} as const;

// ── Zodiac mapping helpers ──────────────────────────────────────────────
const ZODIAC_ICON_MAP: Record<string, ZodiacSign> = {
    "Aries ♈": "aries", "Taurus ♉": "taurus", "Gemini ♊": "gemini",
    "Cancer ♋": "cancer", "Leo ♌": "leo", "Virgo ♍": "virgo",
    "Libra ♎": "libra", "Scorpio ♏": "scorpio", "Sagittarius ♐": "sagittarius",
    "Capricorn ♑": "capricorn", "Aquarius ♒": "aquarius", "Pisces ♓": "pisces",
};

const ZODIAC_COLORS: Record<ZodiacSign, { color: string; glow: string }> = {
    aries: { color: "#FF6B35", glow: "rgba(255,107,53,0.5)" },
    taurus: { color: "#B4FF00", glow: "rgba(180,255,0,0.5)" },
    gemini: { color: "#00F7FF", glow: "rgba(0,247,255,0.5)" },
    cancer: { color: "#B44FFF", glow: "rgba(180,79,255,0.5)" },
    leo: { color: "#FFD700", glow: "rgba(255,215,0,0.5)" },
    virgo: { color: "#B4FF00", glow: "rgba(180,255,0,0.5)" },
    libra: { color: "#00F7FF", glow: "rgba(0,247,255,0.5)" },
    scorpio: { color: "#B44FFF", glow: "rgba(180,79,255,0.5)" },
    sagittarius: { color: "#FF6B35", glow: "rgba(255,107,53,0.5)" },
    capricorn: { color: "#B4FF00", glow: "rgba(180,255,0,0.5)" },
    aquarius: { color: "#00F7FF", glow: "rgba(0,247,255,0.5)" },
    pisces: { color: "#B44FFF", glow: "rgba(180,79,255,0.5)" },
};

// ── Height helpers ──────────────────────────────────────────────────────
function cmToImperial(cm: number): { ft: number; inches: number } {
    const totalInches = Math.round(cm / 2.54);
    return { ft: Math.floor(totalInches / 12), inches: totalInches % 12 };
}
function imperialToCm(ft: number, inches: number): number {
    return Math.round((ft * 12 + inches) * 2.54);
}
function formatHeight(cmStr: string, metric: boolean): string {
    const cm = parseInt(cmStr, 10);
    if (isNaN(cm)) return "";
    if (metric) return `${cm} cm`;
    const { ft, inches } = cmToImperial(cm);
    return `${ft}'${inches}"`;
}

// ── Age calculation ─────────────────────────────────────────────────────
function calcAge(dateStr: string): number | null {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age > 0 ? age : null;
}

// ── Build hex items for ProfileCard ─────────────────────────────────────
export function buildHexItems(data: PersonalInfoData, useMetric: boolean): HexItem[] {
    const items: HexItem[] = [];
    for (const def of FIELD_DEFS) {
        const f = data[def.key];
        if (!f || !f.value || !f.on_card) continue;

        let label = f.value;
        let iconType = def.iconType;
        let color = def.color;
        let glow = def.glow;

        // Zodiac: use actual sign icon
        if (def.key === "zodiac") {
            const sign = ZODIAC_ICON_MAP[f.value];
            if (sign) {
                iconType = sign;
                color = ZODIAC_COLORS[sign].color;
                glow = ZODIAC_COLORS[sign].glow;
                label = f.value.split(" ")[0]; // just the name without symbol
            }
        }
        // Birthday: show age instead
        if (def.key === "birthday") {
            const age = calcAge(f.value);
            if (age) label = `${age}`;
            else continue;
            iconType = "age";
        }
        // Height: format
        if (def.key === "height_cm") {
            label = formatHeight(f.value, useMetric);
            if (!label) continue;
        }
        // Looking for / languages: might be comma-joined, take first
        if (def.type === "multi" && f.value.includes(",")) {
            const parts = f.value.split(",");
            label = parts.length <= 2 ? parts.join(", ") : `${parts[0]} +${parts.length - 1}`;
        }

        items.push({ key: def.key, label, iconType, color, glow });
        if (items.length >= MAX_CARD_ITEMS) break;
    }
    return items;
}

// ── Shared input styles ─────────────────────────────────────────────────
const inputCls = "w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-colors";
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const selectBg = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 12px center",
};

// ── Component ───────────────────────────────────────────────────────────
interface PersonalInfoEditorProps {
    data: PersonalInfoData;
    onChange: (data: PersonalInfoData) => void;
    accentColor: string;
}

export default function PersonalInfoEditor({ data, onChange, accentColor }: PersonalInfoEditorProps) {
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ core: true, lifestyle: false, personal: false });
    const [useMetric, setUseMetric] = useState(false);

    const toggleGroup = (g: string) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

    const cardCount = useMemo(() =>
        Object.values(data).filter(f => f.on_card && f.value).length
        , [data]);

    const updateField = useCallback((key: string, patch: Partial<PersonalInfoField>) => {
        onChange({
            ...data,
            [key]: { ...(data[key] || { value: "", visible: true, on_card: false }), ...patch },
        });
    }, [data, onChange]);

    const setFieldValue = useCallback((key: string, value: string) => {
        const existing = data[key];
        const def = FIELD_DEFS.find(d => d.key === key)!;
        onChange({
            ...data,
            [key]: {
                value,
                visible: existing?.visible ?? def.defaultVisible,
                on_card: existing?.on_card ?? def.defaultOnCard,
            },
        });
    }, [data, onChange]);

    // Multi-select toggle
    const toggleMultiValue = useCallback((key: string, option: string) => {
        const existing = data[key];
        const current = existing?.value ? existing.value.split(",") : [];
        const next = current.includes(option)
            ? current.filter(v => v !== option)
            : [...current, option];
        setFieldValue(key, next.join(","));
    }, [data, setFieldValue]);

    const groups = useMemo(() => {
        const g: Record<string, FieldDef[]> = { core: [], lifestyle: [], personal: [] };
        for (const def of FIELD_DEFS) g[def.group].push(def);
        return g;
    }, []);

    // ── Render field input ──────────────────────────────────────────────
    const renderInput = (def: FieldDef) => {
        const field = data[def.key];
        const value = field?.value || "";

        switch (def.type) {
            case "select":
                return (
                    <select
                        value={value}
                        onChange={e => setFieldValue(def.key, e.target.value)}
                        className={selectCls}
                        style={selectBg}
                    >
                        <option value="">Select...</option>
                        {def.options!.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                );

            case "date":
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={value}
                            onChange={e => setFieldValue(def.key, e.target.value)}
                            className={inputCls}
                            style={{ colorScheme: "dark" }}
                            max={new Date().toISOString().split("T")[0]}
                        />
                        {value && calcAge(value) && (
                            <span className="text-xs font-mono px-2 py-1 rounded-lg bg-pink-500/10 text-pink-400 whitespace-nowrap border border-pink-500/20">
                                Age: {calcAge(value)}
                            </span>
                        )}
                    </div>
                );

            case "height":
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setUseMetric(false)}
                                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${!useMetric ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/10" : "border-gray-800 text-gray-600 hover:text-gray-400"}`}
                            >ft/in</button>
                            <button
                                type="button"
                                onClick={() => setUseMetric(true)}
                                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${useMetric ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/10" : "border-gray-800 text-gray-600 hover:text-gray-400"}`}
                            >cm</button>
                            {value && (
                                <span className="text-xs font-mono text-cyan-400/60 ml-auto">
                                    {formatHeight(value, useMetric)}
                                </span>
                            )}
                        </div>
                        {useMetric ? (
                            <input
                                type="range"
                                min={100} max={220}
                                value={value ? parseInt(value, 10) || 170 : 170}
                                onChange={e => setFieldValue(def.key, e.target.value)}
                                className="w-full accent-cyan-500"
                                style={{ height: "6px" }}
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <select
                                    value={value ? cmToImperial(parseInt(value, 10) || 170).ft : ""}
                                    onChange={e => {
                                        const ft = parseInt(e.target.value, 10);
                                        const curIn = value ? cmToImperial(parseInt(value, 10)).inches : 0;
                                        setFieldValue(def.key, String(imperialToCm(ft, curIn)));
                                    }}
                                    className={`${selectCls} w-20`}
                                    style={selectBg}
                                >
                                    <option value="">ft</option>
                                    {[3, 4, 5, 6, 7].map(f => <option key={f} value={f}>{f} ft</option>)}
                                </select>
                                <select
                                    value={value ? cmToImperial(parseInt(value, 10) || 170).inches : ""}
                                    onChange={e => {
                                        const inches = parseInt(e.target.value, 10);
                                        const curFt = value ? cmToImperial(parseInt(value, 10)).ft : 5;
                                        setFieldValue(def.key, String(imperialToCm(curFt, inches)));
                                    }}
                                    className={`${selectCls} w-20`}
                                    style={selectBg}
                                >
                                    <option value="">in</option>
                                    {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i} in</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                );

            case "multi":
                return (
                    <div className="flex flex-wrap gap-1.5">
                        {def.options!.map(opt => {
                            const selected = value.split(",").includes(opt);
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => toggleMultiValue(def.key, opt)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-200 ${selected
                                        ? "bg-white/10 text-white border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                                        : "bg-transparent text-gray-600 border-gray-800 hover:border-gray-600 hover:text-gray-400"
                                        }`}
                                    style={selected ? { borderColor: `${def.color}50`, color: def.color, backgroundColor: `${def.color}10`, boxShadow: `0 0 6px ${def.glow}` } : {}}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                );

            case "text":
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={e => setFieldValue(def.key, e.target.value)}
                        placeholder={def.placeholder || ""}
                        maxLength={50}
                        className={inputCls}
                    />
                );
        }
    };

    // ── Render field row ────────────────────────────────────────────────
    const renderFieldRow = (def: FieldDef) => {
        const field = data[def.key];
        const isVisible = field?.visible ?? def.defaultVisible;
        const isOnCard = field?.on_card ?? def.defaultOnCard;
        const hasValue = !!(field?.value);
        const canAddToCard = isOnCard || cardCount < MAX_CARD_ITEMS;

        return (
            <div key={def.key} className={`py-3 transition-opacity duration-300 ${!isVisible && hasValue ? "opacity-50" : ""}`}>
                {/* Header row: label + toggles */}
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-300 tracking-wide flex items-center gap-1.5">
                        {def.label}
                    </label>
                    <div className="flex items-center gap-1">
                        {/* Card toggle */}
                        {hasValue && (
                            <button
                                type="button"
                                title={isOnCard ? "Remove from card" : (canAddToCard ? "Show on card" : `Max ${MAX_CARD_ITEMS} card items`)}
                                onClick={() => canAddToCard && updateField(def.key, { on_card: !isOnCard })}
                                className={`p-1 rounded-md transition-all ${isOnCard
                                    ? "text-purple-400 bg-purple-500/10 border border-purple-500/30"
                                    : canAddToCard
                                        ? "text-gray-700 hover:text-gray-400 border border-transparent hover:border-gray-800"
                                        : "text-gray-800 cursor-not-allowed border border-transparent"
                                    }`}
                            >
                                <Hexagon className="w-3 h-3" />
                            </button>
                        )}
                        {/* Visibility toggle */}
                        {hasValue && (
                            <button
                                type="button"
                                title={isVisible ? "Hide from profile" : "Show on profile"}
                                onClick={() => updateField(def.key, { visible: !isVisible })}
                                className={`p-1 rounded-md transition-all ${isVisible
                                    ? "text-green-400 bg-green-500/10 border border-green-500/30"
                                    : "text-gray-700 hover:text-gray-400 border border-transparent hover:border-gray-800"
                                    }`}
                            >
                                {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                        )}
                    </div>
                </div>
                {/* Input */}
                {renderInput(def)}
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {/* Card counter */}
            <div className="flex items-center justify-between px-1">
                <p className="text-[9px] text-gray-600 font-mono">Personal details shown on your profile</p>
                <div className="flex items-center gap-1.5">
                    <Hexagon className="w-3 h-3 text-purple-500/60" />
                    <span className={`text-[10px] font-mono ${cardCount >= MAX_CARD_ITEMS ? "text-amber-400" : "text-gray-600"}`}>
                        {cardCount}/{MAX_CARD_ITEMS} on card
                    </span>
                </div>
            </div>

            {/* Groups */}
            {(["core", "lifestyle", "personal"] as const).map(groupKey => {
                const meta = GROUP_META[groupKey];
                const GroupIcon = meta.icon;
                const filledCount = groups[groupKey].filter(d => data[d.key]?.value).length;
                return (
                    <SpotlightCard
                        key={groupKey}
                        className="rounded-2xl border border-gray-800/80 overflow-hidden"
                        spotlightColor={`${accentColor}12`}
                    >
                        {/* Group header */}
                        <button
                            type="button"
                            onClick={() => toggleGroup(groupKey)}
                            className="w-full flex items-center justify-between p-4 sm:p-5 group"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                    style={{
                                        background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}08)`,
                                        border: `1px solid ${meta.color}25`,
                                        boxShadow: `0 0 12px ${meta.color}10`,
                                    }}
                                >
                                    <GroupIcon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white/90 flex items-center gap-1.5">
                                        {meta.title}
                                        <span
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}60` }}
                                        />
                                    </h4>
                                    <p className="text-[9px] text-gray-600 font-mono mt-0.5 truncate">{meta.desc}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 ml-2">
                                {filledCount > 0 && (
                                    <span className="text-[9px] font-mono" style={{ color: `${meta.color}90` }}>
                                        {filledCount}/{groups[groupKey].length}
                                    </span>
                                )}
                                {openGroups[groupKey]
                                    ? <ChevronUp className="w-4 h-4" />
                                    : <ChevronDown className="w-4 h-4" />
                                }
                            </div>
                        </button>

                        {/* Fields */}
                        {openGroups[groupKey] && (
                            <div className="px-3 sm:px-4 pb-4 space-y-0 divide-y divide-gray-900/60">
                                {groups[groupKey].map(def => renderFieldRow(def))}
                            </div>
                        )}
                    </SpotlightCard>
                );
            })}
        </div>
    );
}
