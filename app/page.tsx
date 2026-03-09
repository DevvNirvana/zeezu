"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Dev login state
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [devEmail, setDevEmail] = useState("test@zeezu.dev");
  const [devPassword, setDevPassword] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState("");

  useEffect(() => {
    setIsLocalhost(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  }, []);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevLoading(true);
    setDevError("");
    const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPassword });
    if (error) {
      setDevError(error.message);
      setDevLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Send the Magic Link via Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-void text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 w-full max-w-md p-8 bg-indigo border border-electric/30 rounded-2xl shadow-[0_0_40px_-10px_rgba(138,46,255,0.3)]">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-void border border-electric/50 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,247,255,0.2)]">
            <Zap className="text-cyan w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter lowercase bg-gradient-to-r from-electric to-cyan bg-clip-text text-transparent">
            zeezu
          </h1>
          <p className="text-gray-400 text-sm mt-2 tracking-widest uppercase">The Internet After Dark</p>
        </div>

        {/* The Auth Logic UI */}
        {submitted ? (
          <div className="bg-void border border-lime/50 rounded-lg p-6 text-center shadow-[0_0_20px_-5px_rgba(180,255,0,0.3)]">
            <CheckCircle2 className="w-12 h-12 text-lime mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Transmission Sent</h3>
            <p className="text-sm text-gray-400">
              Check your email (<span className="text-cyan">{email}</span>) for the secure access link to claim your ZID.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email Sequence</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-void border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-all placeholder:text-gray-700"
              />
            </div>

            {error && <p className="text-red-500 text-xs text-center bg-red-500/10 py-2 rounded border border-red-500/20">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-electric hover:bg-electric/80 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_20px_-5px_rgba(138,46,255,0.5)] hover:shadow-[0_0_25px_-5px_rgba(138,46,255,0.7)] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Claim Your ZID"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          No algorithm. No feed manipulation. Just people.
        </div>

        {/* Dev-only password login — localhost only */}
        {isLocalhost && (
          <div className="mt-6 pt-4 border-t border-dashed border-yellow-600/30">
            <p className="text-[10px] text-yellow-600 font-mono text-center mb-3">⚡ DEV LOGIN (localhost only)</p>
            <form onSubmit={handleDevLogin} className="space-y-2">
              <input
                type="email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="test@zeezu.dev"
                className="w-full bg-void border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-600 transition-all placeholder:text-gray-700"
              />
              <input
                type="password"
                value={devPassword}
                onChange={(e) => setDevPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-void border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-600 transition-all placeholder:text-gray-700"
              />
              {devError && <p className="text-red-500 text-[10px] text-center">{devError}</p>}
              <button
                type="submit"
                disabled={devLoading || !devPassword}
                className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/40 text-yellow-500 font-mono text-xs py-2 rounded-lg transition-all disabled:opacity-50"
              >
                {devLoading ? "Logging in..." : "Dev Sign In"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}