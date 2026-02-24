"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import ZeeWallFeed from "@/components/ZeeWallFeed"; // Add this line!
import { syncUserSession } from "@/lib/supabase/queries";
import { Play, Star, Flame, ShieldCheck } from "lucide-react";


export default function Dashboard() {

    //added by t start

    // --- ADD THIS BLOCK ---
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    async function loadIdentity() {
      const identity = await syncUserSession();
      setUserData(identity);
    }
    loadIdentity();
  }, []);
  // ----------------------



    //end



  return (
    <div className="min-h-screen bg-void flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Identity & Vibes (Classic 30% width column) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <section className="bg-indigo border border-gray-800 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="h-24 bg-gradient-to-r from-electric to-magenta opacity-80"></div>
            <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="w-24 h-24 bg-void border-4 border-indigo rounded-lg absolute -top-12 left-6 shadow-[0_0_15px_rgba(138,46,255,0.5)]">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=zeezu" alt="Avatar" className="w-full h-full rounded-sm object-cover" />
              </div>
              
              <div className="mt-2 pl-28">
                {/* Show real name or "Loading..." if data isn't ready yet */}
                <h2 className="text-2xl font-bold tracking-tight text-white">
                    {userData ? userData.display_name : "Loading..."}
                </h2>
                {/* Show real ZID or "..." */}
                <p className="text-sm font-mono text-cyan mt-1">
                    ZID: {userData ? userData.zid : "..."}
                </p>
                <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                  Just coding in the dark. Leave a Zap on my wall!
                </p>
              </div>

              {/* HD-4K Theme Track Player Mockup */}
              <div className="mt-6 bg-void border border-gray-700 rounded-md p-3 flex items-center gap-3 hover:border-electric transition-colors cursor-pointer group">
                <div className="w-8 h-8 bg-electric rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_10px_#8A2EFF]">
                  <Play className="w-4 h-4 text-white ml-1" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Theme Track</p>
                  {/* Classic Marquee Effect using Tailwind animation */}
                  <p className="text-sm text-lime font-mono truncate w-40">Linkin Park - Numb [Official Audio]</p>
                </div>
              </div>
            </div>
          </section>

          {/* Orkut-Style Vibes Box */}
          <section className="bg-indigo border border-gray-800 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-800 pb-2">Vibes</h3>
            <div className="space-y-4">
              <VibeRow icon={<ShieldCheck className="text-cyan w-5 h-5"/>} label="Trustworthy" score={85} color="bg-cyan" />
              <VibeRow icon={<Star className="text-lime w-5 h-5"/>} label="Cool" score={60} color="bg-lime" />
              <VibeRow icon={<Flame className="text-magenta w-5 h-5"/>} label="Sexy" score={92} color="bg-magenta" />
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: The Core 8 & ZeeWall (Classic 70% width column) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* The Core 8 Box */}
          <section className="bg-indigo border border-gray-800 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
              <h3 className="text-sm uppercase tracking-widest text-gray-400">The Core 8</h3>
              <button className="text-xs font-mono text-electric hover:text-cyan transition-colors">Edit Hierarchy</button>
            </div>
            
            {/* 4x2 Grid */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((spot) => (
                <div key={spot} className="aspect-square bg-void border border-gray-800 rounded-md hover:border-electric transition-all group relative overflow-hidden flex flex-col items-center justify-center">
                  <span className="absolute top-1 left-1 text-[10px] font-mono text-gray-600 group-hover:text-electric transition-colors">0{spot}</span>
                  {/* Placeholder for Friends */}
                  <div className="w-10 h-10 bg-gray-800 rounded-full mb-2 group-hover:shadow-[0_0_15px_#8A2EFF] transition-shadow"></div>
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Empty</span>
                </div>
              ))}
            </div>
          </section>

          {/* The Interactive ZeeWall */}
          <section className="bg-indigo border border-gray-800 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] min-h-[500px] flex flex-col">
            <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-800 pb-2">ZeeWall Updates</h3>
            <div className="flex-1">
              <ZeeWallFeed />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// Helper component for the Vibe progress bars
function VibeRow({ icon, label, score, color }: { icon: React.ReactNode, label: string, score: number, color: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-300">{label}</span>
          <span className="text-gray-500 font-mono">{score}%</span>
        </div>
        <div className="w-full bg-void h-2 rounded-full overflow-hidden border border-gray-800">
          <div className={`h-full ${color} shadow-[0_0_8px_currentColor]`} style={{ width: `${score}%` }}></div>
        </div>
      </div>
    </div>
  );
}