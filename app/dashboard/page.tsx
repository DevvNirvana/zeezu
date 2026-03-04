"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap, Bell, MessageCircle, Flame, Music, Search, Plus, Trash2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { syncUserSession, getCoreEight, getDashboardStats, searchFriends, addToCoreEight, removeFromCoreEight, getFriendCount } from "@/lib/supabase/queries";
import GlobalFeed from "@/components/GlobalFeed";
import NavBar from "@/components/NavBar";
import ThemeEngine, { type ThemeConfig } from "@/components/ThemeEngine";

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [coreEight, setCoreEight] = useState<any[]>([]);
  const [stats, setStats] = useState({ zaps: 0, buzzes: 0, comments: 0 });
  const [customization, setCustom] = useState<ThemeConfig | null>(null);
  const [friendCount, setFriendCount] = useState(0);

  // Core 8 edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setResults] = useState<any[]>([]);

  // ── Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const identity = await syncUserSession();
      if (!identity) { router.push('/'); return; }
      setUserData(identity);

      const [top8, dashStats, { data: customData }, fCount] = await Promise.all([
        getCoreEight(identity.id),
        getDashboardStats(),
        supabase.from('profile_customization').select('*').eq('user_id', identity.id).single(),
        getFriendCount(identity.id),
      ]);

      setCoreEight(top8 || []);
      setStats(dashStats);
      if (customData) setCustom(customData as ThemeConfig);
      setFriendCount(fCount);

      setLoading(false);
    }
    init();
  }, [router]);

  // ── REALTIME dashboard refresh ───────────────────────────────────
  useEffect(() => {
    if (!userData) return;

    const channel = supabase
      .channel('dashboard_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload: any) => {
          // Client-side filter: only react to messages for this user
          if (payload.new?.receiver_id !== userData.id) return;
          const newStats = await getDashboardStats();
          setStats(newStats);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'core_eight' },
        async (payload: any) => {
          // Client-side filter
          const row = payload.new || payload.old;
          if (row?.user_id !== userData.id) return;
          const updated = await getCoreEight(userData.id);
          setCoreEight(updated || []);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        async (payload: any) => {
          if (payload.new?.user_id !== userData.id) return;
          const newStats = await getDashboardStats();
          setStats(newStats);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userData]);

  // ── Core 8 search (friends only) ────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await searchFriends(searchQuery);
    setResults(r);
  };

  // ── Remove from Core 8 ────────────────────────────────────────────
  const handleRemoveFromSlot = async (position: number) => {
    await removeFromCoreEight(position);
    if (userData) {
      const updated = await getCoreEight(userData.id);
      setCoreEight(updated);
    }
  };

  const handleAddToSlot = async (friendId: string) => {
    if (selectedSlot === null) return;
    await addToCoreEight(friendId, selectedSlot);
    if (userData) {
      const updated = await getCoreEight(userData.id);
      setCoreEight(updated);
    }
    setIsEditing(false);
    setSearchQuery('');
    setResults([]);
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-electric animate-spin" />
        <span className="text-xs font-mono text-gray-500 tracking-[0.2em]">LOADING SYSTEM...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white pb-24 overflow-x-hidden">

      {/* ── THEME ENGINE: applies user's profile_customization to dashboard ── */}
      {/* This is why profile settings feel like "your world" when you log in    */}
      <ThemeEngine config={customization} />

      <NavBar />

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-[#0B0B12]/80 backdrop-blur-md border-b border-gray-800/80 h-10 flex items-center justify-between px-4">
        <div className="flex items-center gap-5 text-[10px] font-mono font-bold tracking-widest">
          <button className={`flex items-center gap-2 transition-all ${stats.buzzes > 0 ? 'text-magenta animate-pulse' : 'text-gray-600'}`}>
            <Bell className="w-3 h-3" />
            <span>{stats.buzzes} BUZZES</span>
          </button>
          <button className="flex items-center gap-2 text-lime hover:text-white transition-colors">
            <Zap className="w-3 h-3 fill-lime" />
            <span>{stats.zaps} ZAPS</span>
          </button>
          <button className="hidden sm:flex items-center gap-2 text-cyan hover:text-white transition-colors">
            <MessageCircle className="w-3 h-3" />
            <span>WALL ACTIVE</span>
          </button>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Identity + Core 8 ───────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">

          {/* Identity card */}
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-electric/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-electric/20 transition-all" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full border-2 border-electric p-0.5 mb-3 shadow-[0_0_20px_rgba(138,46,255,0.3)]">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.zid}`}
                  alt="avatar"
                  className="w-full h-full rounded-full bg-black"
                />
              </div>
              <h1 className="text-lg font-black text-white tracking-tight">{userData?.display_name}</h1>
              <p className="text-[10px] font-mono text-gray-500 mt-0.5">{userData?.zid}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Users className="w-3 h-3 text-cyan" />
                <span className="text-[10px] font-mono text-gray-500">{friendCount} friend{friendCount !== 1 ? 's' : ''}</span>
              </div>

              {userData?.status_message && (
                <>
                  <div className="w-full h-px bg-gray-800/60 my-3" />
                  <p className="text-xs text-gray-400 italic">"{userData.status_message}"</p>
                </>
              )}

              {/* Theme color indicator dots */}
              {customization && (
                <div className="flex items-center gap-1.5 mt-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: customization.primary_color, boxShadow: `0 0 6px ${customization.primary_color}` }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: customization.secondary_color, boxShadow: `0 0 6px ${customization.secondary_color}` }} />
                  <span className="text-[9px] font-mono text-gray-600 ml-1">custom theme</span>
                </div>
              )}
            </div>
          </div>

          {/* Core 8 */}
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black text-electric flex items-center gap-2">
                <Flame className="w-4 h-4" /> CORE 8
              </h2>
              <span className="text-[9px] text-gray-600 uppercase tracking-widest font-mono">Hierarchy</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(spot => {
                const entry = coreEight.find(c => c.position === spot);
                const friend = entry?.friend;
                return (
                  <div
                    key={spot}
                    onClick={() => { if (!friend) { setSelectedSlot(spot); setIsEditing(true); } }}
                    className="aspect-square relative rounded-xl bg-black/40 border border-gray-800 hover:border-electric hover:shadow-[0_0_12px_rgba(138,46,255,0.3)] transition-all cursor-pointer group flex flex-col items-center justify-center overflow-hidden"
                  >
                    <span className="absolute top-0.5 left-1 text-[7px] font-mono text-gray-700 group-hover:text-electric">0{spot}</span>
                    {friend ? (
                      <>
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.zid}`} className="w-7 h-7 rounded-full mb-0.5 border border-gray-700" />
                        <span className="text-[7px] text-gray-300 font-bold truncate w-11/12 text-center">{friend.display_name}</span>
                        {/* Remove button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveFromSlot(spot); }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <Trash2 className="w-2.5 h-2.5 text-white" />
                        </button>
                        {/* Click to swap */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedSlot(spot); setIsEditing(true); }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                        >
                          <span className="text-[7px] text-white font-mono">SWAP</span>
                        </button>
                      </>
                    ) : (
                      <Plus className="w-4 h-4 text-gray-700 group-hover:text-electric transition-colors" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Theme track indicator */}
          {userData?.theme_track_url && (
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center flex-shrink-0">
                <Music className="w-4 h-4 text-electric" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-gray-500 font-mono uppercase">Theme Track</p>
                <p className="text-xs text-white font-bold truncate">Playing Now...</p>
              </div>
              <div className="flex gap-px items-end h-4 flex-shrink-0">
                {[2, 4, 3].map((h, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-electric animate-bounce"
                    style={{ height: `${h * 3}px`, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: ZeeWall feed ──────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-5">

          {/* Buzz alert */}
          {stats.buzzes > 0 && (
            <div className="bg-magenta/10 border border-magenta/50 rounded-xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(255,0,122,0.1)]">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-magenta" />
                <div>
                  <p className="text-sm font-black text-white">{stats.buzzes} NEW BUZZ{stats.buzzes > 1 ? 'ES' : ''}</p>
                  <p className="text-xs text-magenta/70">Someone is trying to reach you</p>
                </div>
              </div>
              <button onClick={() => router.push('/messages')} className="bg-magenta hover:bg-white hover:text-magenta text-white text-xs font-black py-2 px-4 rounded-lg transition-all">
                OPEN
              </button>
            </div>
          )}

          {/* Feed */}
          <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan" />
              <h2 className="font-black text-white text-sm">THE FEED</h2>
              <span className="text-[9px] font-mono text-gray-700 ml-auto">LIVE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
            </div>
            <GlobalFeed userId={userData?.id || ''} userZid={userData?.zid} />
          </div>
        </div>
      </div>

      {/* ── CORE 8 EDIT MODAL ─────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#121225] border border-electric rounded-2xl w-full max-w-md p-6 shadow-[0_0_60px_rgba(138,46,255,0.3)]">
            <h3 className="text-lg font-black text-white mb-1">
              Core 8 — <span className="text-electric">Slot 0{selectedSlot}</span>
            </h3>
            <p className="text-[11px] text-gray-500 font-mono mb-5">Search your friends to fill this slot</p>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search display name..."
                className="flex-1 bg-black/60 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-electric outline-none transition-colors"
              />
              <button type="submit" className="bg-electric text-white px-4 py-2.5 rounded-xl hover:bg-electric/80 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-xl hover:border-cyan transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.zid}`} className="w-8 h-8 rounded-full bg-gray-800" />
                    <div>
                      <p className="text-sm font-bold text-white">{u.display_name}</p>
                      <p className="text-[10px] font-mono text-gray-500">{u.zid}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToSlot(u.id)}
                    className="text-[11px] font-black bg-lime/10 hover:bg-lime text-lime hover:text-black border border-lime/30 px-3 py-1.5 rounded-lg transition-all font-mono uppercase"
                  >
                    Add
                  </button>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && (
                <p className="text-center text-gray-600 text-xs py-4 font-mono">No users found for "{searchQuery}"</p>
              )}
            </div>

            <button onClick={() => { setIsEditing(false); setResults([]); setSearchQuery(''); }} className="mt-5 text-[11px] text-gray-600 hover:text-white transition-colors w-full text-center underline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}