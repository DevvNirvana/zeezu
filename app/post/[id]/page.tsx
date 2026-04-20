"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import GlobalFeed from "@/components/GlobalFeed";
import PostSkeleton from "@/components/PostSkeleton";
import { Loader2, ArrowLeft } from "lucide-react";

export default function SinglePostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ actor?: string; type?: string }>;
}) {
  const unwrappedParams = React.use(params);
  const unwrappedSearch = React.use(searchParams);
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserId(user.id);
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen bg-[#0E0B0D] text-white pb-24 relative overflow-hidden">
        <NavBar />
        <div className="w-full max-w-[700px] mx-auto px-4 py-6 md:py-12 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest px-3 py-1.5 rounded-lg text-gray-600 bg-gray-900 border border-gray-800 backdrop-blur-md opacity-50 cursor-not-allowed">
              <ArrowLeft className="w-3.5 h-3.5" /> BACK TO GRID
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-gray-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em]">Tuning in...</span>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10 bg-black/80 md:bg-[#0a0d14]/90 backdrop-blur-xl md:rounded-2xl border-y md:border border-gray-800/60 overflow-hidden shadow-2xl">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0B0D] text-white pb-24 relative overflow-hidden">
      <NavBar />
      
      <div className="w-full max-w-[700px] mx-auto px-4 py-6 md:py-12 relative z-10">
        {/* Desktop Ambient Glow */}
        <div 
          className="hidden md:block absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none" 
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,45,135,0.07) 0%, rgba(0,229,255,0.03) 40%, transparent 70%)" }} 
        />
        
        {/* Navigation Strip */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest transition-all px-3 py-1.5 rounded-lg text-cyan hover:text-white bg-cyan/5 hover:bg-cyan/15 border border-cyan/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.1)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO GRID
          </button>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-gray-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-electric" style={{ boxShadow: "0 0 8px #FF2D87" }} />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-gray-400">Isolated Signal</span>
          </div>
        </div>

        {/* Cinematic Post Container */}
        <div className="relative">
          {/* Subtle Outer Neon Border for Desktop */}
          <div className="hidden md:block absolute -inset-[1px] bg-gradient-to-b from-gray-700/50 via-gray-800/20 to-transparent rounded-2xl z-0" />
          
          <div className="relative z-10 bg-black/80 md:bg-[#0a0d14]/90 backdrop-blur-xl md:rounded-2xl border-y md:border border-gray-800/60 overflow-hidden shadow-2xl">
            <GlobalFeed
              userId={userId}
              singlePostId={parseInt(unwrappedParams.id)}
              hideComposer={true}
              targetActorZid={unwrappedSearch.actor}
              targetAction={unwrappedSearch.type}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
