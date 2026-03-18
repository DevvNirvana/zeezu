"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import GlobalFeed from "@/components/GlobalFeed";
import { Loader2, MessageCircle, Zap } from "lucide-react";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";

type UserData = {
  id: string;
  zid: string;
  display_name: string;
  avatar_url: string | null;
  primary_color?: string;
  birth_year?: number | null;
  birth_month?: number | null;
  birth_day?: number | null;
};

const getAvatar = (user: { zid: string; avatar_url?: string | null }) =>
  user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.zid}`;

// ── CSS ──────────────────────────────────────────────────────────
const WALL_STYLE_ID = "zeewall-page-styles";
if (typeof document !== "undefined" && !document.getElementById(WALL_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = WALL_STYLE_ID;
  s.textContent = `
    @keyframes wall-glow { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }
    .wall-glow { animation: wall-glow 3s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

export default function MyZeeWall() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [primary, setPrimary] = useState("#8A2EFF");
  const [secondary, setSecondary] = useState("#00F7FF");
  const [stats, setStats] = useState({ posts: 0, zaps: 0 });

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/"); return; }

      const [
        { data: uData },
        { data: customData },
        { data: postsData },
      ] = await Promise.all([
        supabase.from("users").select("id, zid, display_name, avatar_url, birth_year, birth_month, birth_day").eq("id", authUser.id).single(),
        supabase.from("profile_customization").select("primary_color, secondary_color").eq("user_id", authUser.id).single(),
        supabase.from("zeewall").select("zaps").eq("owner_id", authUser.id),
      ]);

      if (uData) setUserData(uData);
      if (customData) {
        setPrimary(customData.primary_color ?? "#8A2EFF");
        setSecondary(customData.secondary_color ?? "#00F7FF");
      }
      if (postsData) {
        setStats({
          posts: postsData.length,
          zaps: postsData.reduce((a, p) => a + (p.zaps || 0), 0),
        });
      }
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <Loader2 className="w-7 h-7 text-electric animate-spin" />
    </div>
  );

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white pb-24">
      <NavBar />

      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">

        {/* ── WALL HEADER ── */}
        <div className="mb-6 relative">
          {/* Glow */}
          <div
            className="absolute -top-6 left-0 w-48 h-16 pointer-events-none wall-glow"
            style={{ background: `radial-gradient(ellipse at 0 50%, ${primary}30 0%, transparent 70%)` }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <img
                src={getAvatar(userData)}
                className="w-12 h-12 rounded-xl border-2 flex-shrink-0"
                style={{ borderColor: `${primary}60` }}
                alt={userData.display_name}
              />
              <div>
                <h1
                  className="text-xl font-black uppercase tracking-tighter leading-none"
                  style={{ color: primary, textShadow: `0 0 20px ${primary}60` }}
                >
                  My ZeeWall
                </h1>
                <p className="text-[10px] text-gray-600 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span>{userData.display_name}</span>
                    {(() => {
                      const gen = getGeneration(userData.birth_year, userData.birth_month, userData.birth_day);
                      return gen ? <GenBadge gen={gen} size="sm" /> : null;
                    })()}
                  </span>
                  · {stats.posts} posts · {stats.zaps} zaps
                </p>
              </div>
            </div>

            {/* Realtime indicator */}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: secondary }} />
              <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Live</span>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: `${primary}20`, backgroundColor: `${primary}08` }}>
              <MessageCircle className="w-3.5 h-3.5" style={{ color: primary }} />
              <span className="text-xs font-mono text-gray-400">{stats.posts} posts</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: "#B4FF0020", backgroundColor: "#B4FF0008" }}>
              <Zap className="w-3.5 h-3.5 text-lime" />
              <span className="text-xs font-mono text-gray-400">{stats.zaps} zaps</span>
            </div>
          </div>
        </div>

        {/* ── GLOBAL FEED — filtered to this user's posts ── */}
        <GlobalFeed
          userId={userData.id}
          userZid={userData.zid}
          wallOwnerId={userData.id}
        />
      </div>
    </div>
  );
}