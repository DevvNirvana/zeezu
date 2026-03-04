"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    X, Copy, Check, ExternalLink,
} from "lucide-react";

type ShareSheetProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;      // Post author name
    text: string;        // Post content snippet
    url: string;         // Share URL
};

const PLATFORMS = [
    { name: "WhatsApp", icon: "https://cdn.simpleicons.org/whatsapp/25D366", getUrl: (t: string, u: string) => `https://wa.me/?text=${encodeURIComponent(t + "\n" + u)}` },
    { name: "X", icon: "https://cdn.simpleicons.org/x/fff", getUrl: (t: string, u: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
    { name: "Facebook", icon: "https://cdn.simpleicons.org/facebook/1877F2", getUrl: (_t: string, u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
    { name: "Telegram", icon: "https://cdn.simpleicons.org/telegram/26A5E4", getUrl: (t: string, u: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
    { name: "Reddit", icon: "https://cdn.simpleicons.org/reddit/FF4500", getUrl: (t: string, u: string) => `https://www.reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
    { name: "LinkedIn", icon: "https://cdn.simpleicons.org/linkedin/0A66C2", getUrl: (_t: string, u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
    { name: "Email", icon: "https://cdn.simpleicons.org/gmail/EA4335", getUrl: (t: string, u: string) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(t + "\n\n" + u)}` },
    { name: "Pinterest", icon: "https://cdn.simpleicons.org/pinterest/BD081C", getUrl: (t: string, u: string) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(u)}&description=${encodeURIComponent(t)}` },
];

// ── CSS ──────────────────────────────────────────────────
const SHARE_STYLE_ID = "share-sheet-styles";
if (typeof document !== "undefined" && !document.getElementById(SHARE_STYLE_ID)) {
    const s = document.createElement("style");
    s.id = SHARE_STYLE_ID;
    s.textContent = `
    @keyframes shareSheetSlideUp {
      from { opacity:0; transform:translateY(12px) scale(0.97); }
      to { opacity:1; transform:translateY(0) scale(1); }
    }
    .share-sheet-enter { animation: shareSheetSlideUp 0.2s ease-out; }
    @keyframes shareOverlayFade {
      from { opacity:0; }
      to { opacity:1; }
    }
    .share-overlay-enter { animation: shareOverlayFade 0.15s ease-out; }
  `;
    document.head.appendChild(s);
}

export default function ShareSheet({ isOpen, onClose, title, text, url }: ShareSheetProps) {
    const [copied, setCopied] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) onClose();
        };
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleEsc);
        return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleEsc); };
    }, [isOpen, onClose]);

    // Reset copied on open
    useEffect(() => { if (isOpen) setCopied(false); }, [isOpen]);

    if (!isOpen) return null;

    const shareText = `${title}: ${text.slice(0, 100)}${text.length > 100 ? "..." : ""}`;

    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(url); }
        catch { /* fallback */ try { await navigator.clipboard.writeText(shareText + "\n" + url); } catch { /* */ } }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleNativeShare = async () => {
        try {
            await navigator.share({ title, text: shareText, url });
            onClose();
        } catch { /* user cancelled */ }
    };

    const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center share-overlay-enter"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div ref={sheetRef}
                className="share-sheet-enter w-full max-w-sm mx-auto sm:mx-0 bg-[#111118] border border-gray-800 sm:rounded-xl rounded-t-xl overflow-hidden"
                style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(138,46,255,0.1)" }}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
                    <span className="text-[12px] font-black text-white tracking-wide">SHARE</span>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Native share (mobile) */}
                {canNativeShare && (
                    <button onClick={handleNativeShare}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-[12px] font-bold text-electric hover:bg-electric/5 transition-colors border-b border-gray-800/30">
                        <ExternalLink className="w-4 h-4" />
                        Share via device...
                    </button>
                )}

                {/* Platform grid */}
                <div className="grid grid-cols-4 gap-1 px-3 py-3">
                    {PLATFORMS.map((p) => (
                        <a key={p.name}
                            href={p.getUrl(shareText, url)}
                            target="_blank" rel="noopener noreferrer"
                            onClick={() => setTimeout(onClose, 300)}
                            className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg hover:bg-white/5 transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-gray-800 flex items-center justify-center group-hover:border-gray-600 group-hover:bg-white/10 transition-all">
                                <img src={p.icon} alt={p.name} className="w-5 h-5" loading="lazy" />
                            </div>
                            <span className="text-[9px] font-mono text-gray-500 group-hover:text-white transition-colors">{p.name}</span>
                        </a>
                    ))}
                </div>

                {/* Copy link */}
                <div className="px-3 pb-3">
                    <button onClick={handleCopy}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-[11px] font-bold transition-all ${copied
                            ? "bg-lime/10 border-lime/30 text-lime"
                            : "bg-white/[0.03] border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 hover:bg-white/5"
                            }`}>
                        {copied ? <><Check className="w-3.5 h-3.5" /> Link Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                    </button>
                </div>

                {/* URL preview */}
                <div className="px-4 pb-3">
                    <div className="bg-black/30 rounded-md px-3 py-1.5 border border-gray-800/40 truncate text-[9px] font-mono text-gray-600">
                        {url}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
