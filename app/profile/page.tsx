"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import ProfileCard from "@/components/ProfileCard";
import ThemeEngine, { THEME_PRESETS, DEFAULT_THEME, type ThemeConfig } from "@/components/ThemeEngine";
import {
  Loader2, Save, Music, Edit3, Shield, Flame, Snowflake,
  Zap, MessageCircle, Users, ExternalLink, Palette,
  RotateCcw, CheckCircle2, Camera, Upload, X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────
type UserProfile = {
  id:              string;
  zid:             string;
  display_name:    string;
  mdx_profile:     string | null;
  theme_track_url: string | null;
  influence_score: number;
  status_message:  string | null;
  avatar_url:      string | null;
};

type Vibes = {
  trustworthy_score: number;
  cool_score:        number;
  sexy_score:        number;
};

// ── Helpers ────────────────────────────────────────────────────────────
const dicebearUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

const getInfluenceTier = (score: number) => {
  if (score >= 100) return { label: "Legendary", color: "text-yellow-400" };
  if (score >= 50)  return { label: "Icon",      color: "text-electric"   };
  if (score >= 20)  return { label: "Rising",    color: "text-cyan"       };
  return               { label: "User",      color: "text-gray-500"   };
};

const PRESET_DISPLAY = [
  { id: "neon_cyber",   label: "Cyber",     primary: "#8A2EFF", secondary: "#00F7FF" },
  { id: "emo_night",    label: "Emo",       primary: "#FF007A", secondary: "#9900FF" },
  { id: "y2k_glitter",  label: "Y2K",       primary: "#FFD700", secondary: "#FF69B4" },
  { id: "minimal_dark", label: "Minimal",   primary: "#FFFFFF", secondary: "#888888" },
  { id: "chrome_bbm",   label: "BBM",       primary: "#00C853", secondary: "#64FFDA" },
  { id: "bubblegum",    label: "Bubblegum", primary: "#FF4FAB", secondary: "#B4FF00" },
];

// ── Shimmer CSS (inject once) ──────────────────────────────────────────
const SHIMMER_ID = "profile-edit-shimmer";
if (typeof document !== "undefined" && !document.getElementById(SHIMMER_ID)) {
  const s = document.createElement("style");
  s.id = SHIMMER_ID;
  s.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .shiny-text {
      background: linear-gradient(90deg, #fff 40%, #8A2EFF 50%, #00F7FF 60%, #fff 70%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }
    @keyframes border-spin {
      to { --angle: 360deg; }
    }
    @property --angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    .animated-border {
      border: 1px solid transparent;
      background: linear-gradient(#0B0B12, #0B0B12) padding-box,
                  conic-gradient(from var(--angle), #8A2EFF, #00F7FF, #B4FF00, #8A2EFF) border-box;
      animation: border-spin 4s linear infinite;
    }
    .spotlight-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      opacity: 0;
      transition: opacity 0.3s;
      background: radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(138,46,255,0.12), transparent 40%);
      pointer-events: none;
      z-index: 0;
    }
    .spotlight-card:hover::before { opacity: 1; }
  `;
  document.head.appendChild(s);
}

// ── Component ──────────────────────────────────────────────────────────
export default function ProfileSettings() {
  const router = useRouter();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [user,     setUser]     = useState<UserProfile | null>(null);
  const [vibes,    setVibes]    = useState<Vibes | null>(null);
  const [postCount,setPostCount]= useState(0);

  // Editable fields
  const [displayName, setDisplayName] = useState("");
  const [statusMsg,   setStatusMsg]   = useState("");
  const [bio,         setBio]         = useState("");
  const [themeUrl,    setThemeUrl]    = useState("");

  // Avatar
  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Theme / customization
  const [custom, setCustom] = useState<ThemeConfig>(DEFAULT_THEME);
  const patchCustom = (patch: Partial<ThemeConfig>) =>
    setCustom(prev => ({ ...prev, ...patch }));

  // Spotlight effect for cards
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  // ── Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/"); return; }

      const [
        { data: userData },
        { data: vibeData },
        { count: pCount },
        { data: customData },
      ] = await Promise.all([
        supabase.from("users").select("*").eq("id", authUser.id).single(),
        supabase.from("vibes").select("*").eq("user_id", authUser.id).single(),
        supabase.from("zeewall").select("*", { count: "exact", head: true }).eq("author_id", authUser.id),
        supabase.from("profile_customization").select("*").eq("user_id", authUser.id).single(),
      ]);

      if (userData) {
        setUser(userData);
        setDisplayName(userData.display_name || "");
        setStatusMsg(userData.status_message  || "");
        setBio(userData.mdx_profile           || "");
        setThemeUrl(userData.theme_track_url  || "");
        setAvatarUrl(userData.avatar_url      || null);
      }
      if (vibeData) setVibes(vibeData);
      setPostCount(pCount || 0);
      if (customData) {
        setCustom({
          theme_id:           customData.theme_id           ?? DEFAULT_THEME.theme_id,
          primary_color:      customData.primary_color      ?? DEFAULT_THEME.primary_color,
          secondary_color:    customData.secondary_color    ?? DEFAULT_THEME.secondary_color,
          background_url:     customData.background_url     ?? null,
          background_tiling:  customData.background_tiling  ?? false,
          background_opacity: customData.background_opacity ?? 100,
        });
      }
      setLoading(false);
    }
    load();
  }, [router]);

  // ── Avatar file pick ───────────────────────────────────────────────
  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearAvatarPick = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Upload avatar to Supabase Storage ─────────────────────────────
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return avatarUrl;
    setUploadingAvatar(true);
    const ext  = avatarFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("user-media")
      .upload(path, avatarFile, { upsert: true });
    if (error) { setUploadingAvatar(false); return avatarUrl; }
    const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
    setUploadingAvatar(false);
    return urlData.publicUrl;
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // 1. Upload avatar if new file picked
    const finalAvatarUrl = avatarFile ? await uploadAvatar() : avatarUrl;
    if (finalAvatarUrl) setAvatarUrl(finalAvatarUrl);
    if (avatarPreview) { setAvatarPreview(null); setAvatarFile(null); }

    // 2. Parallel save
    const [{ error: uErr }, { error: cErr }] = await Promise.all([
      supabase.from("users").update({
        display_name:       displayName,
        status_message:     statusMsg,
        status_updated_at:  new Date().toISOString(),
        mdx_profile:        bio,
        theme_track_url:    themeUrl,
        avatar_url:         finalAvatarUrl,
      }).eq("id", user.id),

      supabase.from("profile_customization").upsert({
        user_id: user.id,
        ...custom,
      }, { onConflict: "user_id" }),
    ]);

    setSaving(false);
    if (!uErr && !cErr) {
      setUser(prev => prev
        ? { ...prev, display_name: displayName, status_message: statusMsg, avatar_url: finalAvatarUrl }
        : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border border-electric/20" />
          <div className="absolute inset-0 rounded-full border-t border-electric animate-spin" />
        </div>
        <p className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">Loading Identity</p>
      </div>
    </div>
  );

  const tier       = getInfluenceTier(user?.influence_score ?? 0);
  const liveAvatar = avatarPreview ?? avatarUrl ?? dicebearUrl(user?.zid ?? "");

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white pb-24">
      <NavBar />

      {/* ThemeEngine: live-applies the color preview to THIS page */}
      <ThemeEngine config={custom} />

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">

        {/* ── PAGE TITLE ── */}
        <div className="mb-6 md:mb-8">
          <h1 className="shiny-text text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">
            Identity Settings
          </h1>
          <p className="text-[11px] text-gray-600 font-mono mt-1">
            Changes save to your profile and dashboard instantly

            
          </p>
          {/* Live preview badge */}
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse shadow-[0_0_6px_#B4FF00]" />
              <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Live Preview</span>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">

          {/* ══════════════════════════════════
              LEFT — Live Preview Column
          ══════════════════════════════════ */}
          <div className="w-full lg:w-[260px] flex-shrink-0 space-y-4">

            {/* Live preview badge */}
            {/* <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse shadow-[0_0_6px_#B4FF00]" />
              <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Live Preview</span>
            </div> */}
            

            {/* 3D ProfileCard (live preview) */}
            <ProfileCard
              name={displayName  || user?.display_name || "Unknown"}
              title={user?.zid   || "ZID-????"}
              handle={(displayName || "user").toLowerCase().replace(/\s+/g, "_")}
              status={statusMsg  || "Online"}
              contactText="⚡ Buzz"
              avatarUrl={liveAvatar}
              miniAvatarUrl={liveAvatar}
              showUserInfo={true}
              enableTilt={true}
              enableMobileTilt={true}
              onContactClick={() => {}}
              behindGlowColor={custom.primary_color}
              behindGlowSize="60%"
              innerGradient={`linear-gradient(145deg, #0f0c29 0%, ${custom.primary_color}22 50%, #1a0533 100%)`}
            />

            {/* Stats strip */}
            {/* <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Posts",     value: postCount,                   color: custom.secondary_color },
                { label: "Influence", value: user?.influence_score ?? 0,  color: custom.primary_color   },
                { label: "Tier",      value: tier.label,                  color: custom.primary_color   },
              ].map(s => (
                <div key={s.label} className="bg-black/40 border border-gray-900 rounded-xl p-3 text-center">
                  <p className="font-black text-xs" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[8px] font-mono text-gray-700 uppercase mt-0.5">{s.label}</p>
                </div>
              ))}
            </div> */}

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Posts',     value: postCount,              icon: <MessageCircle className="w-3 h-3" />, color: 'text-cyan'   },
                { label: 'Influence', value: user?.influence_score ?? 0, icon: <Zap className="w-3 h-3" />,           color: 'text-lime'   },
                { label: 'Tier',      value: tier.label,             icon: <Users className="w-3 h-3" />,        color: tier.color    },
              ].map(s => (
                <div key={s.label} className="bg-black/40 border border-gray-800 rounded-xl p-3 text-center">
                  <div className={`flex items-center justify-center gap-1 mb-1 text-[9px] ${s.color}`}>
                    {s.icon}
                    <span className="font-mono uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className={`font-mono font-bold text-xs ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* ZID copy */}
            <div className="bg-black/30 border border-gray-900 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-mono text-gray-700 uppercase tracking-widest mb-0.5">ZID</p>
                <p className="font-mono text-xs font-bold" style={{ color: custom.primary_color }}>{user?.zid}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(user?.zid ?? "")}
                className="text-[8px] font-mono text-gray-600 hover:text-white border border-gray-800 rounded px-2 py-1 transition-colors"
              >
                COPY
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════
              RIGHT — Settings Form
          ══════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ── IDENTITY ── */}
            <div
              className="rounded-2xl border border-gray-800/80 p-5 space-y-4 spotlight-card relative overflow-hidden"
              onMouseMove={handleMouseMove}
            >
              <SectionHeader icon={<Edit3 className="w-3.5 h-3.5" />} title="Identity" color={custom.primary_color} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Display Name</FieldLabel>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    maxLength={30}
                    className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-colors"
                    placeholder="Your name..."
                  />
                </div>
                <div>
                  <FieldLabel>
                    Status{" "}
                    <span className="text-gray-700 normal-case font-normal">· BBM style</span>
                  </FieldLabel>
                  <input
                    value={statusMsg}
                    onChange={e => setStatusMsg(e.target.value)}
                    maxLength={140}
                    placeholder="What are you up to?"
                    className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <FieldLabel>Bio</FieldLabel>
                  <span className="text-[8px] font-mono text-gray-700">{bio.length}/500</span>
                </div>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell your story..."
                  className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl px-3.5 py-2.5 text-sm text-gray-300 outline-none transition-colors resize-none"
                />
              </div>

              {/* ── AVATAR UPLOAD ── */}
                <div
                className="relative rounded-2xl border border-gray-800 p-4 spotlight-card"
                onMouseMove={handleMouseMove}
                >
                <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-3">Profile Picture</p>

                <div className="flex items-center gap-4">
                    {/* Avatar image */}
                    <div className="relative flex-shrink-0">
                    <div
                        className="w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all"
                        style={{ borderColor: custom.primary_color, boxShadow: `0 0 16px ${custom.primary_color}40` }}
                    >
                        <img
                        src={liveAvatar}
                        alt="avatar"
                        className="w-full h-full object-cover bg-black"
                        />
                    </div>
                    {/* Clear preview button */}
                    {avatarPreview && (
                        <button
                        onClick={clearAvatarPick}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
                        >
                        <X className="w-3 h-3 text-white" />
                        </button>
                    )}
                    </div>

                    <div className="flex-1 space-y-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarPick}
                    />
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed text-[10px] font-mono uppercase tracking-wider transition-all hover:border-electric hover:text-electric"
                        style={{ borderColor: `${custom.primary_color}50`, color: custom.primary_color }}
                    >
                        <Camera className="w-3.5 h-3.5" />
                        {avatarPreview ? "Change" : "Upload"}
                    </button>
                    <p className="text-[8px] text-gray-700 font-mono text-center">
                        JPG, PNG, GIF · Max 5MB
                    </p>
                    </div>
                </div>

                {avatarPreview && (
                    <p className="text-[9px] text-lime font-mono mt-2 text-center animate-pulse">
                    ✓ New photo ready — hit Save
                    </p>
                )}
                </div>



            </div>

            {/* ── THEME ── */}
            <div
              className="rounded-2xl border border-gray-800/80 p-5 space-y-4 spotlight-card relative overflow-hidden"
              onMouseMove={handleMouseMove}
            >
              <div className="flex items-center justify-between">
                <SectionHeader icon={<Palette className="w-3.5 h-3.5" />} title="Theme" color={custom.primary_color} />
                <button
                  onClick={() => setCustom(DEFAULT_THEME)}
                  className="text-[9px] text-gray-600 hover:text-white font-mono flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reset
                </button>
              </div>

              {/* Preset swatches */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_DISPLAY.map(p => (
                  <button
                    key={p.id}
                    onClick={() => patchCustom({ ...THEME_PRESETS[p.id]!, theme_id: p.id })}
                    className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                      custom.theme_id === p.id ? "border-white/30 scale-105 bg-white/5" : "border-gray-800 hover:border-gray-600"
                    }`}
                  >
                    <div
                      className="w-full h-3 rounded-full"
                      style={{ background: `linear-gradient(to right, ${p.primary}, ${p.secondary})` }}
                    />
                    <span className="text-[8px] text-gray-500 font-mono">{p.label}</span>
                    {custom.theme_id === p.id && (
                      <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-white" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom color pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Primary</FieldLabel>
                  <div className="flex items-center gap-2.5 bg-black/60 border border-gray-800 rounded-xl px-3 py-2">
                    <input
                      type="color"
                      value={custom.primary_color}
                      onChange={e => patchCustom({ primary_color: e.target.value, theme_id: "custom" })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0"
                    />
                    <code className="text-[10px] font-mono text-gray-400">{custom.primary_color.toUpperCase()}</code>
                  </div>
                </div>
                <div>
                  <FieldLabel>Accent</FieldLabel>
                  <div className="flex items-center gap-2.5 bg-black/60 border border-gray-800 rounded-xl px-3 py-2">
                    <input
                      type="color"
                      value={custom.secondary_color}
                      onChange={e => patchCustom({ secondary_color: e.target.value, theme_id: "custom" })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0"
                    />
                    <code className="text-[10px] font-mono text-gray-400">{custom.secondary_color.toUpperCase()}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BACKGROUND ── */}
            <div
              className="rounded-2xl border border-gray-800/80 p-5 space-y-4 spotlight-card relative overflow-hidden"
              onMouseMove={handleMouseMove}
            >
              <SectionHeader icon={<Upload className="w-3.5 h-3.5" />} title="Background" color={custom.primary_color} />

              {/* URL input */}
              <div>
                <FieldLabel>Image URL</FieldLabel>
                <input
                  value={custom.background_url || ""}
                  onChange={e => patchCustom({ background_url: e.target.value || null })}
                  placeholder="https://i.imgur.com/... (try an animated GIF!)"
                  className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl px-3.5 py-2.5 text-white text-sm font-mono outline-none transition-colors"
                />
              </div>

              {/* Live background preview */}
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

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tile toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => patchCustom({ background_tiling: !custom.background_tiling })}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                      custom.background_tiling ? "bg-electric" : "bg-gray-800"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        custom.background_tiling ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-gray-400">Tile image</span>
                </label>

                {/* Opacity slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <FieldLabel>Opacity</FieldLabel>
                    <span className="text-[9px] font-mono text-gray-600">{custom.background_opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={10} max={100} step={5}
                    value={custom.background_opacity}
                    onChange={e => patchCustom({ background_opacity: parseInt(e.target.value) })}
                    className="w-full h-1.5 rounded-full"
                    style={{ accentColor: custom.primary_color }}
                  />
                </div>
              </div>

              {!custom.background_url && (
                <p className="text-[9px] text-gray-700 font-mono">
                  💡 Your background image appears on your dashboard and public profile — try an animated GIF for full Myspace energy
                </p>
              )}
            </div>

            {/* ── PROFILE ANTHEM ── */}
            <div
              className="rounded-2xl border border-gray-800/80 p-5 space-y-3 spotlight-card relative overflow-hidden"
              onMouseMove={handleMouseMove}
            >
              <SectionHeader icon={<Music className="w-3.5 h-3.5" />} title="Profile Anthem" color={custom.primary_color} />
              <div className="relative">
                <input
                  value={themeUrl}
                  onChange={e => setThemeUrl(e.target.value)}
                  placeholder="YouTube, SoundCloud, or direct MP3 URL..."
                  className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-cyan rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none transition-colors pr-10"
                  style={{ color: themeUrl ? custom.secondary_color : "#555" }}
                />
                {themeUrl && (
                  <a href={themeUrl} target="_blank" rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-[9px] text-gray-700 font-mono">
                Plays when someone visits your public profile — click-to-play, never forced
              </p>
            </div>

            {/* ── VIBES (read-only) ── */}
            <div className="rounded-2xl border border-gray-800/80 p-5 space-y-3">
              <SectionHeader icon={<Flame className="w-3.5 h-3.5" />} title="Vibes" color={custom.primary_color} />
              <p className="text-[9px] text-gray-600 font-mono">Rated by other users — read-only</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Trust", icon: <Shield    className="w-3 h-3" />, v: vibes?.trustworthy_score ?? 0, color: "#B4FF00" },
                  { label: "Cool",  icon: <Snowflake className="w-3 h-3" />, v: vibes?.cool_score        ?? 0, color: "#00F7FF" },
                  { label: "Sexy",  icon: <Flame     className="w-3 h-3" />, v: vibes?.sexy_score        ?? 0, color: "#FF007A" },
                ].map(vibe => (
                  <div key={vibe.label} className="bg-black/40 rounded-xl p-3 text-center space-y-2">
                    <div className="flex items-center justify-center gap-1 text-[9px] font-mono uppercase" style={{ color: vibe.color }}>
                      {vibe.icon} {vibe.label}
                    </div>
                    <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, vibe.v)}%`, backgroundColor: vibe.color, boxShadow: `0 0 4px ${vibe.color}` }}
                      />
                    </div>
                    <p className="font-black text-sm" style={{ color: vibe.color }}>{vibe.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SAVE ── */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest
                transition-all duration-200 flex items-center justify-center gap-2
                disabled:opacity-40 disabled:cursor-not-allowed
                ${saved
                  ? "bg-lime text-black shadow-[0_0_30px_rgba(180,255,0,0.4)]"
                  : "text-white shadow-[0_0_20px_rgba(138,46,255,0.3)] hover:shadow-[0_0_40px_rgba(138,46,255,0.5)]"
                }
              `}
              style={!saved ? { backgroundColor: custom.primary_color } : {}}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Identity Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save All Changes</>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────
function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}
      >
        {icon}
      </div>
      <h3 className="text-xs font-black uppercase tracking-widest text-white">{title}</h3>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
      {children}
    </label>
  );
}