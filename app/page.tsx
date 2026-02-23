import { Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-void text-white relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 w-full max-w-md p-8 bg-indigo border border-electric/30 rounded-2xl shadow-[0_0_40px_-10px_rgba(138,46,255,0.3)]">
        
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-void border border-electric/50 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,247,255,0.2)]">
            <Zap className="text-cyan w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter lowercase bg-gradient-to-r from-electric to-cyan bg-clip-text text-transparent">
            zeezu
          </h1>
          <p className="text-gray-400 text-sm mt-2 tracking-widest uppercase">The Internet After Dark</p>
        </div>

        {/* Auth Form Shell */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email Sequence</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full bg-void border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-all placeholder:text-gray-700"
            />
          </div>
          
          <button className="w-full bg-electric hover:bg-electric/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_20px_-5px_rgba(138,46,255,0.5)] hover:shadow-[0_0_25px_-5px_rgba(138,46,255,0.7)] flex items-center justify-center gap-2 mt-4">
            Claim Your ZID
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          No algorithm. No feed manipulation. Just people.
        </div>
      </div>
    </main>
  );
}