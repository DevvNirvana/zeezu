"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import ProfileCard, { type HexItem } from "@/components/ProfileCard";
import PersonalInfoEditor, { type PersonalInfoData, buildHexItems } from "@/components/PersonalInfoEditor";
import AppearanceEditor from "@/components/AppearanceEditor";
import ThemeEngine, { THEME_PRESETS, DEFAULT_THEME, type ThemeConfig } from "@/components/ThemeEngine";
import GradientText from "@/components/reactbits/GradientText";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import ClickSpark from "@/components/reactbits/ClickSpark";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import {
  Edit3, Palette, Link as LinkIcon, Shield, Settings, Camera, X, ExternalLink,
  Music, Flame, Snowflake, RotateCcw, CheckCircle2, Save, Loader2, Upload,
  MessageCircle, Zap, Users, Eye, EyeOff, LogOut, Trash2, Copy, Check,
  Globe, Github, Instagram, ChevronDown,
} from "lucide-react";
import { updateOnlineStatus, type OnlineStatus } from "@/lib/supabase/queries";



// ── Types ──────────────────────────────────────────────────────────────
type UserProfile = {
  id: string;
  zid: string;
  display_name: string;
  mdx_profile: string | null;
  theme_track_url: string | null;
  influence_score: number;
  status_message: string | null;
  avatar_url: string | null;
  social_links?: Record<string, string> | null;
  birth_year?:  number | null;
  birth_month?: number | null;
  birth_day?:   number | null;
};

type Vibes = {
  trustworthy_score: number;
  cool_score: number;
  sexy_score: number;
};

type Tab = "identity" | "appearance" | "social" | "privacy" | "account";

// ── Helpers ────────────────────────────────────────────────────────────
const dicebearUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const getInfluenceTier = (score: number) => {
  if (score >= 1000) return { label: "LEGENDARY", color: "text-yellow-400" };
  if (score >= 500) return { label: "ELITE", color: "text-electric" };
  if (score >= 100) return { label: "RISING", color: "text-cyan" };
  return { label: "NEWCOMER", color: "text-gray-500" };
};



const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "identity", label: "Identity", icon: <Edit3 className="w-3.5 h-3.5" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="w-3.5 h-3.5" /> },
  { id: "social", label: "Social", icon: <LinkIcon className="w-3.5 h-3.5" /> },
  { id: "privacy", label: "Privacy", icon: <Shield className="w-3.5 h-3.5" /> },
  { id: "account", label: "Account", icon: <Settings className="w-3.5 h-3.5" /> },
];

const SOCIAL_PLATFORMS = [
  { key: "website", label: "Website", icon: <Globe className="w-4 h-4" />, placeholder: "https://yoursite.com" },
  { key: "twitter", label: "X / Twitter", icon: <span className="text-sm font-black">𝕏</span>, placeholder: "https://x.com/username" },
  { key: "instagram", label: "Instagram", icon: <Instagram className="w-4 h-4" />, placeholder: "https://instagram.com/username" },
  { key: "github", label: "GitHub", icon: <Github className="w-4 h-4" />, placeholder: "https://github.com/username" },
  { key: "discord", label: "Discord", icon: <span className="text-xs font-bold">DC</span>, placeholder: "username#1234 or server link" },
  { key: "custom", label: "Custom Link", icon: <LinkIcon className="w-4 h-4" />, placeholder: "https://..." },
];

// ── CSS injection ──────────────────────────────────────────────────────
const STYLE_ID = "profile-settings-v2";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes tabSlide { from { width: 0; } to { width: 100%; } }
    .tab-indicator { position: absolute; bottom: 0; left: 0; height: 2px; border-radius: 1px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .completeness-ring { transition: stroke-dashoffset 1s ease-out; }
    @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 20px rgba(138,46,255,0.3); } 50% { box-shadow: 0 0 40px rgba(138,46,255,0.6); } }
    .save-pulse { animation: pulseGlow 2s ease-in-out infinite; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .section-enter { animation: slideIn 0.3s ease-out forwards; }
    .toggle-track { width: 40px; height: 22px; border-radius: 11px; transition: background-color 0.2s; cursor: pointer; position: relative; }
    .toggle-track.on { background-color: #8A2EFF; }
    .toggle-track.off { background-color: #333; }
    .toggle-knob { width: 18px; height: 18px; border-radius: 50%; background: white; position: absolute; top: 2px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
    .toggle-knob.on { transform: translateX(20px); }
    .toggle-knob.off { transform: translateX(2px); }
    @keyframes saveShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .save-shimmer { background-size: 200% 100%; animation: saveShimmer 3s ease-in-out infinite; }
    .scrollbar-none::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(s);
}

// ── Component ──────────────────────────────────────────────────────────
export default function ProfileSettings() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [vibes, setVibes] = useState<Vibes | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("identity");
  const [isDirty, setIsDirty] = useState(false);
  const [zidCopied, setZidCopied] = useState(false);
  const [authEmail, setAuthEmail] = useState("");

  // Online status
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>("online");
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [bio, setBio] = useState("");
  const [themeUrl, setThemeUrl] = useState("");

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Theme
  const [custom, setCustom] = useState<ThemeConfig>(DEFAULT_THEME);
  const patchCustom = (patch: Partial<ThemeConfig>) => {
    setCustom(prev => ({ ...prev, ...patch }));
    setIsDirty(true);
  };

  // Social links
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  // Personal info (JSONB)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({});
  const liveHexItems = useMemo(() => buildHexItems(personalInfo, false), [personalInfo]);

  // Privacy
  const [privacySettings, setPrivacySettings] = useState({
    show_vibes: true,
    show_wall: true,
    wall_friends_only: false,
    show_online: true,
  });

  // Dirty tracking helper
  const markDirty = () => setIsDirty(true);

  // ── Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/"); return; }
      setAuthEmail(authUser.email || "");

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
        setStatusMsg(userData.status_message || "");
        setOnlineStatus((userData.online_status as OnlineStatus) ?? "online");
        setBio(userData.mdx_profile || "");
        setThemeUrl(userData.theme_track_url || "");
        setAvatarUrl(userData.avatar_url || null);
        if (userData.social_links) setSocialLinks(userData.social_links);
        if (userData.personal_info) setPersonalInfo(userData.personal_info);
      }
      if (vibeData) setVibes(vibeData);
      setPostCount(pCount || 0);
      if (customData) {
        // Spread DEFAULT_THEME first, then overlay DB values.
        // This ensures all new ThemeConfig fields have defaults even if DB hasn't been migrated yet.
        const { show_vibes, show_wall, wall_friends_only, show_online, user_id, ...themeFields } = customData;
        setCustom({ ...DEFAULT_THEME, ...themeFields });
        if (show_vibes !== undefined) {
          setPrivacySettings({
            show_vibes: customData.show_vibes ?? true,
            show_wall: customData.show_wall ?? true,
            wall_friends_only: customData.wall_friends_only ?? false,
            show_online: customData.show_online ?? true,
          });
        }
      }
      setLoading(false);
    }
    load();
  }, [router]);

  // ── Unsaved warning ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Avatar ────────────────────────────────────────────────────────
  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    markDirty();
  };

  const clearAvatarPick = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return avatarUrl;
    const ext = avatarFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("user-media").upload(path, avatarFile, { upsert: true });
    if (error) return avatarUrl;
    const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
    return urlData.publicUrl;
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const finalAvatarUrl = avatarFile ? await uploadAvatar() : avatarUrl;
    if (finalAvatarUrl) setAvatarUrl(finalAvatarUrl);
    if (avatarPreview) { setAvatarPreview(null); setAvatarFile(null); }

    // Extract birth date parts from personal_info for generation tag
    let birth_year:  number | null = null;
    let birth_month: number | null = null;
    let birth_day:   number | null = null;
    const bday = (personalInfo as PersonalInfoData | null)?.birthday?.value;
    if (bday) {
      const [y, m, d] = bday.split('-').map(Number);
      if (y > 1900 && y < 2030) birth_year  = y;
      if (m >= 1 && m <= 12)    birth_month = m;
      if (d >= 1 && d <= 31)    birth_day   = d;
    }

    // Save users table (profile data)
    const userSave = supabase.from("users").update({
      display_name: displayName,
      status_message: statusMsg,
      status_updated_at: new Date().toISOString(),
      mdx_profile: bio,
      theme_track_url: themeUrl,
      avatar_url: finalAvatarUrl,
      social_links: socialLinks,
      personal_info: personalInfo,
      birth_year,
      birth_month,
      birth_day,
    }).eq("id", user.id);

    // Save theme customization (excludes privacy fields that may not exist)
    const customSave = supabase.from("profile_customization").upsert({
      user_id: user.id,
      ...custom,
    }, { onConflict: "user_id" });

    // Save privacy settings separately (may fail if columns don't exist yet)
    const privacySave = supabase.from("profile_customization").update({
      ...privacySettings,
    }).eq("user_id", user.id);

    const [{ error: uErr }, { error: cErr }, { error: pErr }] = await Promise.all([
      userSave, customSave, privacySave,
    ]);

    if (uErr) console.warn("Profile save warning (users table):", uErr.message);
    if (cErr) console.warn("Profile save warning (customization):", cErr.message);
    if (pErr) console.warn("Profile save warning (privacy):", pErr.message);

    setSaving(false);
    // Consider save successful if at least the customization saved OK
    if (!cErr) {
      setUser(prev => prev ? { ...prev, display_name: displayName, status_message: statusMsg, avatar_url: finalAvatarUrl } : prev);
      setSaved(true);
      setIsDirty(false);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  // ── Profile Completeness ──────────────────────────────────────────
  const completeness = (() => {
    let score = 0;
    if (displayName && displayName !== "Anonymous") score += 15;
    if (avatarUrl || avatarPreview) score += 20;
    if (bio && bio.length > 20) score += 15;
    if (statusMsg) score += 10;
    if (custom.theme_id !== "neon_cyber") score += 10;
    if (themeUrl) score += 10;
    if (Object.values(socialLinks).some(v => v.trim())) score += 10;
    if (custom.background_url) score += 10;
    return score;
  })();

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

  const tier = getInfluenceTier(user?.influence_score ?? 0);
  const liveAvatar = avatarPreview ?? avatarUrl ?? dicebearUrl(user?.zid ?? "");

  // ── Toggle component ──────────────────────────────────────────────
  const Toggle = ({ value, onChange, label, description }: { value: boolean; onChange: (v: boolean) => void; label: string; description: string }) => (
    <div className="flex items-center justify-between py-3">
      <div className="mr-4">
        <p className="text-sm text-white font-medium">{label}</p>
        <p className="text-[10px] text-gray-600 font-mono mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => { onChange(!value); markDirty(); }}
        className={`toggle-track ${value ? "on" : "off"}`}
      >
        <span className={`toggle-knob ${value ? "on" : "off"}`} />
      </button>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B0B12] text-white pb-24">
      <NavBar />
      <ThemeEngine config={custom} />

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">

        {/* ── PAGE HEADER ── */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <GradientText
                colors={[custom.primary_color, custom.secondary_color, custom.primary_color]}
                animationSpeed={6}
                className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none"
              >
                Identity Settings
              </GradientText>
              <div className="flex items-center gap-3 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse shadow-[0_0_6px_#B4FF00]" />
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Live Preview</span>
              </div>
            </div>
            <Link
              href={`/u/${user?.zid}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 text-[10px] font-mono text-gray-400 hover:text-white hover:border-gray-600 transition-all"
            >
              <Eye className="w-3 h-3" /> View Public Profile
            </Link>
          </div>

          {/* ── TABS ── */}
          <div className="flex items-center gap-1 sm:gap-0.5 mt-5 border-b border-gray-800/60 overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // On mobile, scroll to content area
                    if (window.innerWidth < 1024) {
                      setTimeout(() => {
                        const el = document.getElementById('tab-content-area');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }
                  }}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${isActive ? "text-white" : "text-gray-600 hover:text-gray-400"
                    }`}
                >
                  <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                    {tab.icon}
                  </span>
                  {/* Show label always on sm+, only for active tab on mobile */}
                  <span className={`hidden sm:inline ${isActive ? "!inline" : ""}`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <span
                      className="tab-indicator"
                      style={{ background: `linear-gradient(90deg, ${custom.primary_color}, ${custom.secondary_color})` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">

          {/* ══════════════════════════════════
              LEFT — Live Preview Column
          ══════════════════════════════════ */}
          <div className="w-full lg:w-[260px] xl:w-[280px] flex-shrink-0 space-y-4">

            {/* 3D ProfileCard */}
            {(() => {
              const gen = getGeneration(user?.birth_year, user?.birth_month, user?.birth_day);
              const glowColor = gen?.accentGlow ?? 'rgba(138,46,255,0.2)';
              return (
                <div style={{ borderRadius: '1.25rem', boxShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}`, transition: 'box-shadow 0.5s ease' }}>
                  <ProfileCard
                    name={displayName || user?.display_name || "Unknown"}
                    title={user?.zid || "ZID-????"}
                    handle={(displayName || "user").toLowerCase().replace(/\s+/g, "_")}
                    status={statusMsg || "Online"}
                    contactText="⚡ Buzz"
                    avatarUrl={liveAvatar}
                    miniAvatarUrl={liveAvatar}
                    showUserInfo={true}
                    enableTilt={true}
                    enableMobileTilt={true}
                    onContactClick={() => { }}
                    behindGlowColor={custom.primary_color}
                    behindGlowSize="60%"
                    innerGradient={`linear-gradient(145deg, #0f0c29 0%, ${custom.primary_color}22 50%, #1a0533 100%)`}
                    hexItems={liveHexItems.length > 0 ? liveHexItems : undefined}
                    trustScore={vibes?.trustworthy_score}
                    coolScore={vibes?.cool_score}
                    sexyScore={vibes?.sexy_score}
                    onlineStatus={onlineStatus}
                  />
                </div>
              );
            })()}

            {/* ── ONLINE STATUS PICKER ── */}
            {(() => {
              const STATUSES: { key: OnlineStatus; label: string; color: string; desc: string }[] = [
                { key: "online",  label: "Online",  color: "#6BCB77", desc: "Active and available" },
                { key: "busy",    label: "Busy",    color: "#F97316", desc: "Do not disturb" },
                { key: "away",    label: "Away",    color: "#F59E0B", desc: "Be right back" },
                { key: "offline", label: "Offline", color: "#6B7280", desc: "Appear offline" },
              ];
              const cur = STATUSES.find(s => s.key === onlineStatus) ?? STATUSES[0];
              return (
                <div style={{ position: "relative" }} className="mb-2">
                  <button
                    onClick={() => setStatusPickerOpen(v => !v)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 12px", borderRadius: "10px",
                      background: "rgba(0,0,0,.4)",
                      border: `1px solid ${cur.color}40`,
                      cursor: "pointer", transition: "all .18s",
                    }}
                  >
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: cur.color, boxShadow: `0 0 6px ${cur.color}`, flexShrink: 0, display: "block" }} />
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, color: cur.color, letterSpacing: "1px", flex: 1, textAlign: "left" }}>{cur.label.toUpperCase()}</span>
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)" }}>{cur.desc}</span>
                    <ChevronDown size={10} style={{ color: "rgba(255,255,255,.3)", transition: "transform .2s", transform: statusPickerOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }} />
                  </button>
                  {statusPickerOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                      background: "rgba(8,14,36,.97)", border: "1px solid rgba(138,46,255,.25)",
                      borderRadius: "10px", overflow: "hidden",
                      boxShadow: "0 8px 24px rgba(0,0,0,.7)", zIndex: 50,
                    }}>
                      {STATUSES.map((s, i) => (
                        <button key={s.key} onClick={async () => {
                          setOnlineStatus(s.key);
                          setStatusPickerOpen(false);
                          await updateOnlineStatus(s.key);
                        }} style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          width: "100%", textAlign: "left", padding: "9px 13px",
                          background: onlineStatus === s.key ? `${s.color}15` : "transparent",
                          border: "none",
                          borderBottom: i < 3 ? "1px solid rgba(255,255,255,.05)" : "none",
                          cursor: "pointer", transition: "background .15s",
                        }}
                        onMouseEnter={e => { if (onlineStatus !== s.key) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.04)"; }}
                        onMouseLeave={e => { if (onlineStatus !== s.key) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                          <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: s.color, boxShadow: `0 0 5px ${s.color}80`, flexShrink: 0, display: "block" }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, color: onlineStatus === s.key ? s.color : "rgba(255,255,255,.75)", margin: 0, letterSpacing: "0.5px" }}>{s.label}</p>
                            <p style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.3)", margin: 0 }}>{s.desc}</p>
                          </div>
                          {onlineStatus === s.key && <Check size={10} style={{ color: s.color, flexShrink: 0 }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {(() => {
              const gen = getGeneration(user?.birth_year, user?.birth_month, user?.birth_day);
              return gen ? <div className="flex justify-center -mt-2 mb-2"><GenBadge gen={gen} size="md" /></div> : null;
            })()}

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Posts", value: postCount, icon: <MessageCircle className="w-3 h-3" />, color: "text-cyan" },
                { label: "Influence", value: user?.influence_score ?? 0, icon: <Zap className="w-3 h-3" />, color: "text-lime" },
                { label: "Tier", value: tier.label, icon: <Users className="w-3 h-3" />, color: tier.color },
              ].map(s => (
                <div key={s.label} className="bg-black/40 border border-gray-800 rounded-xl p-3 text-center">
                  <div className={`flex items-center justify-center gap-1 mb-1 text-[9px] ${s.color}`}>
                    {s.icon}
                    <span className="font-mono uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className={`font-mono font-bold text-xs ${s.color}`}>
                    {typeof s.value === "number" ? <CountUp to={s.value} duration={1.5} /> : s.value}
                  </div>
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
                onClick={() => { navigator.clipboard.writeText(user?.zid ?? ""); setZidCopied(true); setTimeout(() => setZidCopied(false), 2000); }}
                className="text-[8px] font-mono text-gray-600 hover:text-white border border-gray-800 rounded px-2 py-1 transition-colors flex items-center gap-1"
              >
                {zidCopied ? <><Check className="w-2.5 h-2.5 text-lime" /> COPIED</> : <><Copy className="w-2.5 h-2.5" /> COPY</>}
              </button>
            </div>

            {/* Profile Completeness */}
            <div className="bg-black/30 border border-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Profile Completeness</p>
                <span className="text-xs font-black" style={{ color: completeness >= 80 ? "#B4FF00" : completeness >= 50 ? "#00F7FF" : custom.primary_color }}>
                  <CountUp to={completeness} duration={1} />%
                </span>
              </div>
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${completeness}%`,
                    background: `linear-gradient(90deg, ${custom.primary_color}, ${custom.secondary_color})`,
                    boxShadow: `0 0 8px ${custom.primary_color}60`,
                  }}
                />
              </div>
              {completeness < 100 && (
                <p className="text-[8px] text-gray-700 font-mono mt-2">
                  {!bio || bio.length <= 20 ? "💡 Add a bio to boost your profile"
                    : !themeUrl ? "🎵 Set a profile anthem"
                      : !Object.values(socialLinks).some(v => v.trim()) ? "🔗 Add social links"
                        : !custom.background_url ? "🖼️ Set a background image"
                          : "Almost there!"}
                </p>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════
              RIGHT — Tab Content
          ══════════════════════════════════ */}
          <div id="tab-content-area" className="flex-1 w-full min-w-0 space-y-4 scroll-mt-4">
            <AnimatedContent key={activeTab} animationKey={activeTab} direction="up" duration={300}>

              {/* ── IDENTITY TAB ── */}
              {activeTab === "identity" && (
                <div className="space-y-4 section-enter">
                  <SpotlightCard className="rounded-2xl border border-gray-800/80 p-4 sm:p-5 space-y-4" spotlightColor={`${custom.primary_color}20`}>
                    <SectionHeader icon={<Edit3 className="w-3.5 h-3.5" />} title="Identity" color={custom.primary_color} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Display Name</FieldLabel>
                        <input
                          value={displayName}
                          onChange={e => { setDisplayName(e.target.value); markDirty(); }}
                          maxLength={30}
                          className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-colors"
                          placeholder="Your name..."
                        />
                        <span className="text-[8px] font-mono text-gray-700 mt-1 block text-right">{displayName.length}/30</span>
                      </div>
                      <div>
                        <FieldLabel>Status <span className="text-gray-700 normal-case font-normal">· BBM style</span></FieldLabel>
                        <input
                          value={statusMsg}
                          onChange={e => { setStatusMsg(e.target.value); markDirty(); }}
                          maxLength={140}
                          placeholder="What are you up to?"
                          className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-colors"
                        />
                        <span className="text-[8px] font-mono text-gray-700 mt-1 block text-right">{statusMsg.length}/140</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <FieldLabel>Bio</FieldLabel>
                        <span className="text-[8px] font-mono text-gray-700">{bio.length}/500</span>
                      </div>
                      <textarea
                        value={bio}
                        onChange={e => { setBio(e.target.value); markDirty(); }}
                        maxLength={500}
                        rows={4}
                        placeholder="Tell your story..."
                        className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-xl px-3.5 py-2.5 text-sm text-gray-300 outline-none transition-colors resize-none"
                      />
                    </div>
                  </SpotlightCard>

                  {/* Avatar Upload */}
                  <SpotlightCard className="rounded-2xl border border-gray-800/80 p-4 sm:p-5" spotlightColor={`${custom.primary_color}20`}>
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-3">Profile Picture</p>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all"
                          style={{ borderColor: custom.primary_color, boxShadow: `0 0 16px ${custom.primary_color}40` }}
                        >
                          <img src={liveAvatar} alt="avatar" className="w-full h-full object-cover bg-black" />
                        </div>
                        {avatarPreview && (
                          <button onClick={clearAvatarPick} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed text-[10px] font-mono uppercase tracking-wider transition-all hover:border-electric hover:text-electric"
                          style={{ borderColor: `${custom.primary_color}50`, color: custom.primary_color }}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {avatarPreview ? "Change" : "Upload"}
                        </button>
                        <p className="text-[8px] text-gray-700 font-mono text-center">JPG, PNG, GIF · Max 5MB</p>
                      </div>
                    </div>
                    {avatarPreview && (
                      <p className="text-[9px] text-lime font-mono mt-2 text-center animate-pulse">✓ New photo ready — hit Save</p>
                    )}
                  </SpotlightCard>

                  {/* Personal Details */}
                  <PersonalInfoEditor
                    data={personalInfo}
                    onChange={(d) => { setPersonalInfo(d); markDirty(); }}
                    accentColor={custom.primary_color}
                  />

                  {/* Vibes (read-only) */}
                  <SpotlightCard className="rounded-2xl border border-gray-800/80 p-4 sm:p-5 space-y-3" spotlightColor={`${custom.primary_color}10`}>
                    <SectionHeader icon={<Flame className="w-3.5 h-3.5" />} title="Vibes" color={custom.primary_color} />
                    <p className="text-[9px] text-gray-600 font-mono">Rated by other users — read-only</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Trust", icon: <Shield className="w-3 h-3" />, v: vibes?.trustworthy_score ?? 0, color: "#B4FF00" },
                        { label: "Cool", icon: <Snowflake className="w-3 h-3" />, v: vibes?.cool_score ?? 0, color: "#00F7FF" },
                        { label: "Sexy", icon: <Flame className="w-3 h-3" />, v: vibes?.sexy_score ?? 0, color: "#FF007A" },
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
                          <p className="font-black text-sm" style={{ color: vibe.color }}>
                            <CountUp to={vibe.v} duration={1.5} />
                          </p>
                        </div>
                      ))}
                    </div>
                  </SpotlightCard>
                </div>
              )}

              {/* ── APPEARANCE TAB ── */}
              {activeTab === "appearance" && (
                <div className="space-y-4 section-enter">
                  {/* Theme Studio */}
                  <AppearanceEditor
                    custom={custom}
                    patchCustom={patchCustom}
                  />

                  {/* Profile Anthem */}
                  <SpotlightCard className="rounded-2xl border border-gray-800/80 p-4 sm:p-5 space-y-3" spotlightColor={`${custom.primary_color}20`}>
                    <SectionHeader icon={<Music className="w-3.5 h-3.5" />} title="Profile Anthem" color={custom.primary_color} />
                    <div className="relative">
                      <input
                        value={themeUrl}
                        onChange={e => { setThemeUrl(e.target.value); markDirty(); }}
                        placeholder="YouTube, SoundCloud, or direct MP3 URL..."
                        className="w-full bg-black/60 border border-gray-800 hover:border-gray-600 focus:border-cyan rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none transition-colors pr-10"
                        style={{ color: themeUrl ? custom.secondary_color : "#555" }}
                      />
                      {themeUrl && (
                        <a href={themeUrl} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-700 font-mono">Plays when someone visits your public profile — click-to-play, never forced</p>
                  </SpotlightCard>
                </div>
              )}

              {/* ── SOCIAL TAB ── */}
              {activeTab === "social" && (
                <div className="space-y-4 section-enter">
                  <SpotlightCard className="rounded-2xl border border-gray-800/80 p-4 sm:p-5 space-y-4" spotlightColor={`${custom.primary_color}20`}>
                    <SectionHeader icon={<LinkIcon className="w-3.5 h-3.5" />} title="Social Links" color={custom.primary_color} />
                    <p className="text-[9px] text-gray-600 font-mono">These appear on your public profile for visitors to find you</p>

                    <div className="space-y-3">
                      {SOCIAL_PLATFORMS.map(platform => (
                        <div key={platform.key}>
                          <FieldLabel>{platform.label}</FieldLabel>
                          <div className="flex items-center gap-2.5 bg-black/60 border border-gray-800 hover:border-gray-600 focus-within:border-electric rounded-xl px-3 py-2 transition-colors">
                            <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-gray-800 flex items-center justify-center text-gray-500">
                              {platform.icon}
                            </span>
                            <input
                              value={socialLinks[platform.key] || ""}
                              onChange={e => {
                                setSocialLinks(prev => ({ ...prev, [platform.key]: e.target.value }));
                                markDirty();
                              }}
                              placeholder={platform.placeholder}
                              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-700 font-mono"
                            />
                            {socialLinks[platform.key] && (
                              <button
                                onClick={() => { setSocialLinks(prev => { const n = { ...prev }; delete n[platform.key]; return n; }); markDirty(); }}
                                className="text-gray-700 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SpotlightCard>
                </div>
              )}

              {/* ── PRIVACY TAB ── */}
              {activeTab === "privacy" && (
                <div className="space-y-4 section-enter">
                  <SpotlightCard className="rounded-2xl border border-gray-800/80 p-4 sm:p-5 space-y-1" spotlightColor={`${custom.primary_color}20`}>
                    <SectionHeader icon={<Shield className="w-3.5 h-3.5" />} title="Privacy & Visibility" color={custom.primary_color} />
                    <p className="text-[9px] text-gray-600 font-mono mb-2">Control what others see on your public profile</p>

                    <div className="divide-y divide-gray-800/40">
                      <Toggle
                        value={privacySettings.show_vibes}
                        onChange={v => setPrivacySettings(prev => ({ ...prev, show_vibes: v }))}
                        label="Show Vibes Scores"
                        description="Display your trust, cool, and sexy scores publicly"
                      />
                      <Toggle
                        value={privacySettings.show_wall}
                        onChange={v => setPrivacySettings(prev => ({ ...prev, show_wall: v }))}
                        label="Show Wall Posts"
                        description="Display your wall posts on your public profile"
                      />
                      <Toggle
                        value={privacySettings.wall_friends_only}
                        onChange={v => setPrivacySettings(prev => ({ ...prev, wall_friends_only: v }))}
                        label="Friends-Only Wall"
                        description="Only friends can post on your wall"
                      />
                      <Toggle
                        value={privacySettings.show_online}
                        onChange={v => setPrivacySettings(prev => ({ ...prev, show_online: v }))}
                        label="Show Online Status"
                        description="Let others see when you're online"
                      />
                    </div>
                  </SpotlightCard>
                </div>
              )}

              {/* ── ACCOUNT TAB ── */}
              {activeTab === "account" && (
                <div className="space-y-4 section-enter">
                  <SpotlightCard className="rounded-2xl border border-gray-800/80 p-4 sm:p-5 space-y-4" spotlightColor={`${custom.primary_color}20`}>
                    <SectionHeader icon={<Settings className="w-3.5 h-3.5" />} title="Account" color={custom.primary_color} />

                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <div className="bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 font-mono">
                        {authEmail}
                      </div>
                      <p className="text-[8px] text-gray-700 font-mono mt-1">Managed by your authentication provider</p>
                    </div>

                    <div>
                      <FieldLabel>ZID</FieldLabel>
                      <div className="bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono flex items-center justify-between" style={{ color: custom.primary_color }}>
                        {user?.zid}
                        <span className="text-[8px] text-gray-700">Permanent · Cannot be changed</span>
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Actions */}
                  <SpotlightCard className="rounded-2xl border border-gray-800/80 p-4 sm:p-5 space-y-3" spotlightColor="rgba(255,0,0,0.05)">
                    <SectionHeader icon={<LogOut className="w-3.5 h-3.5" />} title="Session" color="#FF4444" />

                    <button
                      onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-800 text-sm font-bold text-gray-400 hover:text-white hover:border-gray-600 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </SpotlightCard>

                  {/* Danger Zone */}
                  <div className="rounded-2xl border border-red-900/30 p-4 sm:p-5 space-y-3 bg-red-950/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10 border border-red-500/20 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-red-500">Danger Zone</h3>
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <button
                      onClick={async () => {
                        if (!confirm("Are you absolutely sure? This will permanently delete your account and all data. This cannot be undone.")) return;
                        if (!user) return;
                        // Delete user data rows (cascade deletes handle related data via FK)
                        await Promise.all([
                          supabase.from("profile_customization").delete().eq("user_id", user.id),
                          supabase.from("notifications").delete().eq("user_id", user.id),
                          supabase.from("core_eight").delete().eq("user_id", user.id),
                          supabase.from("vibes").delete().eq("user_id", user.id),
                        ]);
                        await supabase.from("users").delete().eq("id", user.id);
                        await supabase.auth.signOut();
                        router.push("/");
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-900/40 text-[10px] font-black text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-wider"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Account
                    </button>
                  </div>
                </div>
              )}

            </AnimatedContent>

            {/* ── SAVE BUTTON ── */}
            <div className="relative mt-6">
              {/* Glow effect behind button */}
              {isDirty && !saved && (
                <div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-30 save-pulse"
                  style={{ background: `linear-gradient(135deg, ${custom.primary_color}, ${custom.secondary_color})` }}
                />
              )}
              <ClickSpark sparkColor={saved ? "#B4FF00" : custom.primary_color} sparkCount={12}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`
                    relative w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest
                    transition-all duration-300 flex items-center justify-center gap-2.5
                    disabled:opacity-40 disabled:cursor-not-allowed
                    overflow-hidden
                    ${saved
                      ? "bg-transparent border-2 border-lime text-lime shadow-[0_0_30px_rgba(180,255,0,0.25)]"
                      : isDirty
                        ? "border border-transparent text-white save-shimmer"
                        : "border border-gray-800/60 text-gray-400 hover:text-white hover:border-gray-700"
                    }
                  `}
                  style={!saved ? {
                    background: isDirty
                      ? `linear-gradient(135deg, ${custom.primary_color}CC, ${custom.secondary_color}CC, ${custom.primary_color}CC)`
                      : 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(12px)',
                  } : {
                    backdropFilter: 'blur(12px)',
                    background: 'rgba(180,255,0,0.06)',
                  }}
                >
                  {/* Inner gradient border overlay */}
                  {isDirty && !saved && (
                    <span
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        padding: '1px',
                        background: `linear-gradient(135deg, ${custom.primary_color}60, ${custom.secondary_color}60, ${custom.primary_color}60)`,
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'xor',
                        WebkitMaskComposite: 'xor' as any,
                      }}
                    />
                  )}
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : saved ? (
                    <><CheckCircle2 className="w-4 h-4" /> Saved Successfully</>
                  ) : (
                    <><Save className="w-4 h-4" /> {isDirty ? 'Save Changes' : 'No Changes'}</>
                  )}
                </button>
              </ClickSpark>
            </div>

            {/* Unsaved changes indicator */}
            {isDirty && !saving && !saved && (
              <p className="text-[9px] text-center text-amber-400/70 font-mono mt-2">
                ⚠ You have unsaved changes
              </p>
            )}
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