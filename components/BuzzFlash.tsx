"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface BuzzFlashProps {
    senderName: string;
    onDismiss: () => void;
}

/**
 * Full-screen neon flash overlay when receiving a Buzz.
 * Auto-dismisses after 2.5 seconds.
 * Features: chromatic aberration, screen shake, glitch text, vibration.
 */
export default function BuzzFlash({ senderName, onDismiss }: BuzzFlashProps) {
    const [phase, setPhase] = useState<"flash" | "text" | "fade">("flash");

    useEffect(() => {
        // Vibrate on mobile
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([100, 50, 200, 50, 100]);
        }

        // Phase transitions
        const t1 = setTimeout(() => setPhase("text"), 200);
        const t2 = setTimeout(() => setPhase("fade"), 2000);
        const t3 = setTimeout(onDismiss, 2500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [onDismiss]);

    return (
        <div
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
            style={{
                animation: phase === "flash"
                    ? "buzzShake 0.3s ease-in-out"
                    : phase === "fade"
                        ? "buzzFadeOut 0.5s ease-out forwards"
                        : undefined,
            }}
        >
            {/* Background flash layers (chromatic aberration) */}
            <div
                className="absolute inset-0"
                style={{
                    background: phase === "flash"
                        ? "radial-gradient(circle at center, rgba(138,46,255,0.95) 0%, rgba(0,247,255,0.3) 50%, rgba(0,0,0,0.8) 100%)"
                        : "radial-gradient(circle at center, rgba(138,46,255,0.4) 0%, rgba(0,0,0,0.9) 70%)",
                    transition: "all 0.3s ease-out",
                }}
            />

            {/* Chromatic aberration lines */}
            <div
                className="absolute inset-0 mix-blend-screen"
                style={{
                    background: phase === "flash"
                        ? "linear-gradient(90deg, rgba(255,0,122,0.4) 0%, transparent 33%, rgba(0,247,255,0.4) 66%, transparent 100%)"
                        : "transparent",
                    animation: phase === "flash" ? "buzzChromaticShift 0.2s ease-in-out 3" : undefined,
                    transition: "background 0.4s",
                }}
            />

            {/* Scanline overlay */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
                }}
            />

            {/* Center content */}
            {phase !== "flash" && (
                <div className="relative z-10 text-center" style={{ animation: "buzzTextIn 0.3s ease-out" }}>
                    {/* Lightning icon */}
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{
                                background: "radial-gradient(circle, rgba(138,46,255,0.8) 0%, transparent 70%)",
                                boxShadow: "0 0 60px rgba(138,46,255,0.8), 0 0 120px rgba(138,46,255,0.4)",
                                animation: "buzzIconPulse 0.5s ease-in-out infinite alternate",
                            }}
                        >
                            <Zap className="w-10 h-10 text-white fill-white" style={{ filter: "drop-shadow(0 0 10px #fff)" }} />
                        </div>
                    </div>

                    {/* "BUZZ" text with glitch */}
                    <h1
                        className="text-5xl font-black tracking-[0.3em] uppercase mb-2"
                        style={{
                            color: "#8A2EFF",
                            textShadow: "0 0 30px #8A2EFF, 0 0 60px #8A2EFF, 3px 0 #FF007A, -3px 0 #00F7FF",
                            animation: "buzzGlitch 0.15s ease-in-out infinite",
                        }}
                    >
                        BUZZ
                    </h1>

                    {/* Sender name */}
                    <p
                        className="text-sm font-mono uppercase tracking-[0.2em]"
                        style={{
                            color: "#00F7FF",
                            textShadow: "0 0 10px #00F7FF",
                        }}
                    >
                        from {senderName}
                    </p>
                </div>
            )}

            {/* Inject keyframes */}
            <style>{`
        @keyframes buzzShake {
          0%, 100% { transform: translate(0); }
          10% { transform: translate(-8px, -4px); }
          20% { transform: translate(6px, 3px); }
          30% { transform: translate(-5px, -6px); }
          40% { transform: translate(4px, 5px); }
          50% { transform: translate(-3px, -2px); }
          60% { transform: translate(3px, 4px); }
          70% { transform: translate(-2px, -3px); }
          80% { transform: translate(2px, 2px); }
          90% { transform: translate(-1px, -1px); }
        }
        @keyframes buzzChromaticShift {
          0% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          100% { transform: translateX(-4px); }
        }
        @keyframes buzzFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes buzzTextIn {
          from { opacity: 0; transform: scale(1.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes buzzIconPulse {
          from { transform: scale(1); }
          to { transform: scale(1.15); }
        }
        @keyframes buzzGlitch {
          0%, 100% { clip-path: inset(0); transform: none; }
          25% { clip-path: inset(30% 0 50% 0); transform: translateX(3px); }
          50% { clip-path: inset(0); transform: none; }
          75% { clip-path: inset(60% 0 20% 0); transform: translateX(-3px); }
        }
      `}</style>
        </div>
    );
}
