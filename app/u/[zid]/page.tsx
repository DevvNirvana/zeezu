"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import ProfileCard from "@/components/ProfileCard";
import {
  Zap, MessageCircle, Flame, Shield, Snowflake, Music,
  Play, Pause, Plus, Share2, Flag, Clock, Camera,
  Volume2, VolumeX, Edit3, Image as ImageIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────
type ProfileUser = {
  id:               string;
  zid:              string;
  display_name:     string;
  mdx_profile:      string | null;
  theme_track_url:  string | null;
  influence_score:  number;
  status_message:   string | null;
  status_updated_at:string | null;
};

type Customization = {
  theme_id:           string;
  primary_color:      string;
  secondary_color:    string;
  background_url:     string | null;
  background_tiling:  boolean;
  background_opacity: number;
};

type CoreSlot = {
  position: number;
  friend: { id: string; display_name: string; zid: string } | null;
};

type Post = {
  id:         number;
  content:    string;
  created_at: string;
  zaps:       number;
  author: { display_name: string; zid: string };
};

type Vibes = {
  trustworthy_score: number;
  cool_score:        number;
  sexy_score:        number;
};

// ── Helpers ────────────────────────────────────────────────────────────
const getAvatar = (seed: string, style = 'avataaars') =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

const getInfluenceTier = (score: number) => {
  if (score >= 100) return { label: 'LEGENDARY', color: '#FFD700', glow: 'rgba(255,215,0,0.4)' };
  if (score >= 50)  return { label: 'ICON',      color: '#8A2EFF', glow: 'rgba(138,46,255,0.4)' };
  if (score >= 20)  return { label: 'RISING',    color: '#00F7FF', glow: 'rgba(0,247,255,0.4)' };
  return               { label: 'USER',      color: '#888888', glow: 'rgba(136,136,136,0.2)' };
};

// Inject retro CSS keyframes once
const RETRO_STYLE_ID = 'retro-profile-styles';
if (typeof document !== 'undefined' && !document.getElementById(RETRO_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = RETRO_STYLE_ID;
  s.textContent = `
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    @keyframes glitch {
      0%,90%,100% { clip-path: inset(0 0 100% 0); transform: none; }
      92% { clip-path: inset(20% 0 60% 0); transform: translateX(-4px); }
      94% { clip-path: inset(50% 0 30% 0); transform: translateX(4px); }
      96% { clip-path: inset(10% 0 80% 0); transform: translateX(-2px); }
    }
    @keyframes flicker {
      0%,100% { opacity: 1; }
      92% { opacity: 1; }
      93% { opacity: 0.8; }
      94% { opacity: 1; }
      96% { opacity: 0.9; }
      97% { opacity: 1; }
    }
    @keyframes statusPulse {
      0%,100% { box-shadow: 0 0 4px currentColor; }
      50% { box-shadow: 0 0 12px currentColor, 0 0 24px currentColor; }
    }
    @keyframes visitorCount {
      from { transform: translateY(8px); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }
    @keyframes entryFade {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .retro-entry { animation: entryFade 0.4s ease-out forwards; }
    .retro-entry:nth-child(1)  { animation-delay: 0.05s; opacity: 0; }
    .retro-entry:nth-child(2)  { animation-delay: 0.10s; opacity: 0; }
    .retro-entry:nth-child(3)  { animation-delay: 0.15s; opacity: 0; }
    .retro-entry:nth-child(4)  { animation-delay: 0.20s; opacity: 0; }
    .retro-entry:nth-child(5)  { animation-delay: 0.25s; opacity: 0; }
    .retro-entry:nth-child(6)  { animation-delay: 0.30s; opacity: 0; }
    .glow-text { animation: flicker 8s infinite; }
  `;
  document.head.appendChild(s);
}

// ── Component ──────────────────────────────────────────────────────────
export default function PublicProfile() {
  const params   = useParams();
  const router   = useRouter();
  const zid      = typeof params?.zid === 'string' ? params.zid.toUpperCase() : '';

  // Profile data
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [custom,      setCustom]      = useState<Customization | null>(null);
  const [coreEight,   setCoreEight]   = useState<CoreSlot[]>([]);
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [vibes,       setVibes]       = useState<Vibes | null>(null);
  const [postCount,   setPostCount]   = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);

  // Viewer identity
  const [viewerId,   setViewerId]     = useState<string | null>(null);
  const [isOwner,    setIsOwner]      = useState(false);

  // UI
  const [visitorNum,  setVisitorNum]  = useState<number | null>(null);
  const [musicPlaying,setMusicPlaying]= useState(false);
  const [musicMuted,  setMusicMuted]  = useState(false);
  const [newPost,     setNewPost]     = useState('');
  const [postingMsg,  setPostingMsg]  = useState(false);
  const [activeTab,   setActiveTab]   = useState<'wall'|'about'|'photos'>('wall');

  // Photo upload
  const [photos,      setPhotos]      = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef     = useRef<HTMLAudioElement | null>(null);

  // Derived colors (fall back to Zeezu defaults)
  const primary   = custom?.primary_color   ?? '#8A2EFF';
  const secondary = custom?.secondary_color ?? '#00F7FF';

  // ── Load profile ──────────────────────────────────────────────────
  useEffect(() => {
    if (!zid) return;

    async function load() {
      // Identify viewer
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setViewerId(authUser?.id ?? null);

      // Fetch target user by ZID
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('zid', zid)
        .single();

      if (userErr || !userData) { setNotFound(true); setLoading(false); return; }

      setProfileUser(userData);
      setIsOwner(authUser?.id === userData.id);

      // Parallel data load
      const [
        { data: customData },
        { data: core8Data  },
        { data: postsData  },
        { data: vibeData   },
        { count: pCount    },
      ] = await Promise.all([
        supabase.from('profile_customization').select('*').eq('user_id', userData.id).single(),
        supabase.from('core_eight')
          .select('position, friend:users!fk_core_friend(id, display_name, zid)')
          .eq('user_id', userData.id)
          .order('position'),
        supabase.from('zeewall')
          .select('id, content, created_at, zaps, author:users!author_id(display_name, zid)')
          .eq('owner_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('vibes').select('*').eq('user_id', userData.id).single(),
        supabase.from('zeewall')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', userData.id),
      ]);

      if (customData) setCustom(customData);
      if (core8Data)  setCoreEight(core8Data as CoreSlot[]);
      if (postsData)  setPosts(postsData as Post[]);
      if (vibeData)   setVibes(vibeData);
      setPostCount(pCount ?? 0);

      // Simulated visitor counter (would be a real DB counter in prod)
      setVisitorNum(Math.floor(Math.random() * 9000) + 1000);

      setLoading(false);
    }
    load();
  }, [zid]);

  // ── Apply background from customization ──────────────────────────
  useEffect(() => {
    const body = document.body;
    if (custom?.background_url) {
      body.style.backgroundImage    = `url('${custom.background_url}')`;
      body.style.backgroundRepeat   = custom.background_tiling ? 'repeat' : 'no-repeat';
      body.style.backgroundSize     = custom.background_tiling ? 'auto'  : 'cover';
      body.style.backgroundPosition = 'center top';
      body.style.backgroundAttachment = 'fixed';
      body.style.opacity             = String((custom.background_opacity ?? 100) / 100);
    }
    return () => {
      body.style.backgroundImage = 'none';
      body.style.opacity = '';
    };
  }, [custom]);

  // ── Theme track audio ────────────────────────────────────────────
  useEffect(() => {
    if (!profileUser?.theme_track_url) return;
    // Only init — user must click play (browser autoplay policy)
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = 'anonymous';
    audioRef.current.volume = 0.35;
    return () => { audioRef.current?.pause(); };
  }, [profileUser?.theme_track_url]);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !profileUser?.theme_track_url) return;
    if (!audio.src) audio.src = profileUser.theme_track_url;
    if (musicPlaying) { audio.pause(); setMusicPlaying(false); }
    else { audio.play().then(() => setMusicPlaying(true)).catch(console.error); }
  }, [musicPlaying, profileUser?.theme_track_url]);

  // ── Post to wall (visitor or owner) ─────────────────────────────
  const handlePost = async () => {
    if (!newPost.trim() || !viewerId || !profileUser) return;
    setPostingMsg(true);
    const { data } = await supabase.from('zeewall').insert({
      owner_id:  profileUser.id,
      author_id: viewerId,
      content:   newPost.trim(),
    }).select('id, content, created_at, zaps, author:users!author_id(display_name, zid)').single();
    if (data) setPosts(prev => [data as Post, ...prev]);
    setNewPost('');
    setPostingMsg(false);
  };

  // ── Zap a post ───────────────────────────────────────────────────
  const handleZap = async (postId: number) => {
    if (!viewerId) return;
    await supabase.rpc('zap_post', { post_id: postId, zapper_id: viewerId });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, zaps: p.zaps + 1 } : p));
  };

  // ── Photo upload ─────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewerId || !profileUser || !isOwner) return;
    setUploadingPhoto(true);
    const ext  = file.name.split('.').pop();
    const path = `${profileUser.id}/photos/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('user-media').upload(path, file);
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('user-media').getPublicUrl(path);
      setPhotos(prev => [urlData.publicUrl, ...prev]);
    }
    setUploadingPhoto(false);
  };

  // ── Not found ────────────────────────────────────────────────────
  if (notFound) return (
    <div className="min-h-screen bg-[#0B0B12] flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-6xl">👾</div>
      <h1 className="text-2xl font-black text-white">ZID NOT FOUND</h1>
      <p className="text-gray-500 font-mono text-sm">{zid} doesn't exist in the network</p>
      <Link href="/dashboard" className="text-xs font-mono text-electric border border-electric px-4 py-2 rounded hover:bg-electric hover:text-black transition-all">
        ← BACK TO NETWORK
      </Link>
    </div>
  );

  // ── Loading screen ────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-electric/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-electric animate-spin" />
        </div>
        <p className="text-[11px] font-mono text-gray-600 tracking-[0.3em] uppercase">
          Loading {zid}...
        </p>
      </div>
    </div>
  );

  const tier = getInfluenceTier(profileUser?.influence_score ?? 0);

  return (
    <div
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{ backgroundColor: '#0B0B12' }}
    >
      {/* ── SCANLINE OVERLAY (CRT effect) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[999] opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* ── BACKGROUND OVERLAY (theme color tint) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${primary}18 0%, transparent 60%)`,
        }}
      />

      {/* ── NAVBAR (minimal) ─────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ borderColor: `${primary}40`, backgroundColor: `${primary}08` }}
      >
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-lg font-black tracking-tighter lowercase"
            style={{ color: primary, textShadow: `0 0 20px ${primary}` }}
          >
            zeezu
          </Link>

          <div className="flex items-center gap-3">
            {/* Music player pill */}
            {profileUser?.theme_track_url && (
              <button
                onClick={toggleMusic}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono uppercase tracking-widest transition-all"
                style={{
                  borderColor: secondary,
                  color:       secondary,
                  boxShadow:   musicPlaying ? `0 0 12px ${secondary}50` : 'none',
                }}
              >
                {musicPlaying
                  ? <><Pause className="w-3 h-3" /> Theme</>
                  : <><Play  className="w-3 h-3" /> Theme</>
                }
                {/* EQ bars */}
                {musicPlaying && (
                  <span className="flex gap-px items-end h-3">
                    {[2, 3, 2].map((h, i) => (
                      <span key={i} className="w-[2px] rounded-full animate-bounce" style={{ height: `${h * 4}px`, backgroundColor: secondary, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </span>
                )}
              </button>
            )}

            {/* Owner: edit shortcut */}
            {isOwner && (
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all border border-white/20 text-white/60 hover:border-white hover:text-white"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </Link>
            )}

            {/* Visitor: action buttons */}
            {!isOwner && viewerId && (
              <button
                className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all text-black"
                style={{ backgroundColor: primary, boxShadow: `0 0 12px ${primary}60` }}
              >
                ⚡ Buzz
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── VISITOR COUNTER STRIP ── */}
      {visitorNum && (
        <div
          className="border-b text-center py-1.5"
          style={{
            borderColor: `${primary}20`,
            backgroundColor: `${primary}08`,
            animation: 'visitorCount 0.5s ease-out',
          }}
        >
          <span className="text-[9px] font-mono text-gray-600 tracking-[0.2em]">
            YOU ARE VISITOR #{visitorNum.toLocaleString()}
          </span>
        </div>
      )}

      {/* ── MAIN LAYOUT ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">

          {/* ═══════════════════════════════════════════════
              LEFT COLUMN — Identity, Core 8, Vibes
          ═══════════════════════════════════════════════ */}
          <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">

            {/* ── PROFILE CARD (3D) ── */}
            <div className="retro-entry">
              <ProfileCard
                name={profileUser?.display_name || ''}
                title={profileUser?.zid          || ''}
                handle={(profileUser?.display_name || '').toLowerCase().replace(/\s+/g, '_')}
                status={profileUser?.status_message || 'Online'}
                contactText={isOwner ? '✎ Edit Me' : '⚡ Buzz'}
                avatarUrl={getAvatar(profileUser?.zid ?? '')}
                miniAvatarUrl={getAvatar(profileUser?.zid ?? '')}
                showUserInfo={true}
                enableTilt={true}
                enableMobileTilt={true}
                behindGlowColor={primary}
                behindGlowSize="60%"
                innerGradient={`linear-gradient(145deg, #0f0c29 0%, ${primary}22 50%, #1a0533 100%)`}
                onContactClick={() => isOwner ? router.push('/profile') : undefined}
              />
            </div>

            {/* ── STATUS MESSAGE ── */}
            {profileUser?.status_message && (
              <div
                className="retro-entry rounded-xl border p-4 relative overflow-hidden"
                style={{ borderColor: `${secondary}30`, backgroundColor: `${secondary}08` }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: secondary, animation: 'statusPulse 2s infinite', color: secondary }}
                  />
                  <div>
                    <p className="text-sm text-white/90 italic leading-relaxed">
                      "{profileUser.status_message}"
                    </p>
                    {profileUser.status_updated_at && (
                      <p className="text-[9px] font-mono text-gray-600 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(profileUser.status_updated_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── INFLUENCE + QUICK STATS ── */}
            <div
              className="retro-entry rounded-xl border p-4 space-y-3"
              style={{ borderColor: `${primary}25`, backgroundColor: `${primary}06` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Influence</span>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full font-mono"
                  style={{
                    color:            tier.color,
                    backgroundColor:  `${tier.color}15`,
                    boxShadow:        `0 0 8px ${tier.glow}`,
                    border:           `1px solid ${tier.color}40`,
                  }}
                >
                  {tier.label}
                </span>
              </div>

              {/* Influence bar */}
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width:      `${Math.min(100, ((profileUser?.influence_score ?? 0) / 100) * 100)}%`,
                    background: `linear-gradient(to right, ${primary}, ${secondary})`,
                    boxShadow:  `0 0 8px ${primary}`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                {[
                  { label: 'Posts',  value: postCount,                   color: secondary },
                  { label: 'Score',  value: profileUser?.influence_score ?? 0, color: primary   },
                ].map(s => (
                  <div key={s.label} className="bg-black/30 rounded-lg p-2">
                    <p className="font-black text-sm" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[9px] font-mono text-gray-600 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── VIBES ── */}
            {vibes && (
              <div
                className="retro-entry rounded-xl border p-4"
                style={{ borderColor: `${primary}25`, backgroundColor: '#0B0B12' }}
              >
                <p
                  className="text-[9px] font-mono uppercase tracking-widest mb-3 flex items-center gap-2"
                  style={{ color: primary }}
                >
                  <Flame className="w-3 h-3" /> Vibes
                </p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Trust',  icon: <Shield    className="w-3 h-3" />, value: vibes.trustworthy_score, color: '#B4FF00' },
                    { label: 'Cool',   icon: <Snowflake className="w-3 h-3" />, value: vibes.cool_score,        color: '#00F7FF' },
                    { label: 'Sexy',   icon: <Flame     className="w-3 h-3" />, value: vibes.sexy_score,        color: '#FF007A' },
                  ].map(v => (
                    <div key={v.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="flex items-center gap-1 text-[9px] font-mono uppercase" style={{ color: v.color }}>
                          {v.icon} {v.label}
                        </span>
                        <span className="text-[9px] font-black font-mono" style={{ color: v.color }}>{v.value}</span>
                      </div>
                      <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width:     `${Math.min(100, v.value)}%`,
                            backgroundColor: v.color,
                            boxShadow: `0 0 6px ${v.color}`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CORE 8 ── */}
            <div
              className="retro-entry rounded-xl border p-4"
              style={{ borderColor: `${primary}25`, backgroundColor: '#0B0B12' }}
            >
              <p
                className="text-[9px] font-mono uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: primary }}
              >
                <Flame className="w-3 h-3" /> Core 8
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4,5,6,7,8].map(slot => {
                  const entry  = coreEight.find(c => c.position === slot);
                  const friend = entry?.friend;
                  return (
                    <div key={slot} className="flex flex-col items-center gap-1">
                      {friend ? (
                        <Link href={`/u/${friend.zid}`} className="group">
                          <div
                            className="w-12 h-12 rounded-xl overflow-hidden border transition-all group-hover:scale-105"
                            style={{
                              borderColor: `${primary}40`,
                              boxShadow:   `0 0 8px ${primary}20`,
                            }}
                          >
                            <img
                              src={getAvatar(friend.zid)}
                              alt={friend.display_name}
                              className="w-full h-full"
                            />
                          </div>
                          <p className="text-[8px] text-gray-500 text-center truncate w-12 mt-0.5 group-hover:text-white transition-colors">
                            {friend.display_name}
                          </p>
                        </Link>
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl border border-dashed flex items-center justify-center"
                          style={{ borderColor: `${primary}20` }}
                        >
                          <span className="text-[8px] font-mono text-gray-700">0{slot}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════════════════
              RIGHT COLUMN — Wall, About, Photos
          ═══════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ── PROFILE HEADER ── */}
            <div
              className="retro-entry rounded-2xl border p-5 relative overflow-hidden"
              style={{
                borderColor:     `${primary}30`,
                backgroundColor: `${primary}06`,
              }}
            >
              {/* Neon glow corner */}
              <div
                className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 100% 0%, ${primary}20 0%, transparent 60%)`,
                }}
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
                {/* Avatar large */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2"
                    style={{ borderColor: primary, boxShadow: `0 0 20px ${primary}50` }}
                  >
                    <img
                      src={getAvatar(profileUser?.zid ?? '')}
                      className="w-full h-full"
                      alt={profileUser?.display_name}
                    />
                  </div>
                  {/* Online indicator */}
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0B0B12] flex items-center justify-center"
                    style={{ backgroundColor: '#B4FF00', boxShadow: '0 0 8px #B4FF00' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-black" />
                  </div>
                  {/* Owner: change photo */}
                  {isOwner && (
                    <button
                      className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                      onClick={() => router.push('/profile')}
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  {/* Name */}
                  <h1
                    className="text-2xl sm:text-3xl font-black tracking-tighter leading-none glow-text"
                    style={{ color: primary, textShadow: `0 0 20px ${primary}` }}
                  >
                    {profileUser?.display_name}
                  </h1>

                  {/* ZID */}
                  <p className="text-[10px] font-mono text-gray-500 mt-1 tracking-widest">
                    {profileUser?.zid}
                  </p>

                  {/* Action row */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {!isOwner && viewerId && (
                      <>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all text-black"
                          style={{ backgroundColor: primary, boxShadow: `0 0 12px ${primary}50` }}
                        >
                          <Plus className="w-3 h-3" /> Add Friend
                        </button>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border"
                          style={{ borderColor: secondary, color: secondary }}
                        >
                          <MessageCircle className="w-3 h-3" /> Message
                        </button>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                        >
                          <Zap className="w-3 h-3" /> Zap
                        </button>
                      </>
                    )}
                    {isOwner && (
                      <Link
                        href="/profile"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border border-white/20 text-white/60 hover:border-white hover:text-white"
                      >
                        <Edit3 className="w-3 h-3" /> Customize Profile
                      </Link>
                    )}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border border-white/10 text-white/40 hover:text-white/70 transition-colors">
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── TABS: Wall / About / Photos ── */}
            <div
              className="retro-entry flex border rounded-xl overflow-hidden"
              style={{ borderColor: `${primary}25` }}
            >
              {(['wall', 'about', 'photos'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: activeTab === tab ? `${primary}20` : 'transparent',
                    color:           activeTab === tab ? primary : '#555',
                    borderBottom:    activeTab === tab ? `2px solid ${primary}` : '2px solid transparent',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── WALL TAB ── */}
            {activeTab === 'wall' && (
              <div className="space-y-3">

                {/* Post input — shown to everyone signed in */}
                {viewerId && (
                  <div
                    className="retro-entry rounded-xl border p-4"
                    style={{ borderColor: `${primary}25`, backgroundColor: '#0B0B12' }}
                  >
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-2">
                      {isOwner ? 'Post to your wall' : `Write on ${profileUser?.display_name}'s wall`}
                    </p>
                    <textarea
                      value={newPost}
                      onChange={e => setNewPost(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Drop a message..."
                      className="w-full bg-gray-900/50 border border-gray-800 hover:border-gray-600 focus:border-electric rounded-lg px-3 py-2.5 text-sm text-white outline-none resize-none transition-colors placeholder:text-gray-700"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] font-mono text-gray-700">{newPost.length}/500</span>
                      <button
                        onClick={handlePost}
                        disabled={!newPost.trim() || postingMsg}
                        className="px-4 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-40 text-black"
                        style={{ backgroundColor: primary }}
                      >
                        {postingMsg ? '...' : 'Post'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Posts */}
                {posts.length === 0 ? (
                  <div
                    className="retro-entry rounded-xl border p-10 text-center"
                    style={{ borderColor: `${primary}15`, borderStyle: 'dashed' }}
                  >
                    <MessageCircle className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                    <p className="text-xs text-gray-600 font-mono">No wall posts yet.</p>
                    {viewerId && !isOwner && (
                      <p className="text-[10px] text-gray-700 mt-1">Be the first to write something.</p>
                    )}
                  </div>
                ) : posts.map((post, i) => (
                  <div
                    key={post.id}
                    className="retro-entry rounded-xl border p-4 transition-all hover:border-opacity-60"
                    style={{
                      borderColor:     `${primary}20`,
                      backgroundColor: '#0B0B12',
                      animationDelay:  `${i * 0.05}s`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Link href={`/u/${post.author?.zid}`} className="flex-shrink-0">
                        <img
                          src={getAvatar(post.author?.zid ?? '')}
                          className="w-8 h-8 rounded-lg border border-gray-800"
                          alt={post.author?.display_name}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <Link
                            href={`/u/${post.author?.zid}`}
                            className="text-xs font-black hover:underline"
                            style={{ color: primary }}
                          >
                            {post.author?.display_name}
                          </Link>
                          <span className="text-[9px] font-mono text-gray-600">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1 leading-relaxed">{post.content}</p>
                        <button
                          onClick={() => handleZap(post.id)}
                          className="flex items-center gap-1 mt-2 text-[10px] font-mono transition-all hover:scale-105"
                          style={{ color: post.zaps > 0 ? '#B4FF00' : '#555' }}
                        >
                          <Zap className="w-3 h-3" />
                          <span>{post.zaps} zap{post.zaps !== 1 ? 's' : ''}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ABOUT TAB ── */}
            {activeTab === 'about' && (
              <div
                className="retro-entry rounded-xl border p-5"
                style={{ borderColor: `${primary}25`, backgroundColor: '#0B0B12' }}
              >
                {profileUser?.mdx_profile ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    {/* Render bio as plain text — MDX rendering would go here */}
                    <pre
                      className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {profileUser.mdx_profile}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-xs text-gray-600 font-mono">No bio written yet.</p>
                    {isOwner && (
                      <Link href="/profile" className="text-[11px] text-electric underline mt-2 block">
                        Add your story →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── PHOTOS TAB ── */}
            {activeTab === 'photos' && (
              <div className="retro-entry space-y-4">

                {/* Upload button (owner only) */}
                {isOwner && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                      style={{ borderColor: primary, color: primary }}
                    >
                      <Camera className="w-4 h-4" />
                      {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <p className="text-[9px] text-gray-700 text-center mt-1 font-mono">
                      Stored in Supabase Storage — bucket: user-media
                    </p>
                  </div>
                )}

                {photos.length === 0 ? (
                  <div
                    className="rounded-xl border p-10 text-center"
                    style={{ borderColor: `${primary}15`, borderStyle: 'dashed' }}
                  >
                    <ImageIcon className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                    <p className="text-xs text-gray-600 font-mono">No photos yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((url, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl overflow-hidden border"
                        style={{ borderColor: `${primary}20` }}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── FOOTER STRIP ── */}
      <div className="border-t mt-12 py-4 text-center" style={{ borderColor: `${primary}15` }}>
        <p className="text-[9px] font-mono text-gray-700 tracking-[0.3em]">
          ZEEZU · THE INTERNET AFTER DARK · {profileUser?.zid}
        </p>
      </div>
    </div>
  );
}