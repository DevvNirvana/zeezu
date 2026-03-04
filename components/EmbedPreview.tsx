"use client";

import { ExternalLink, Play, Music, Film } from "lucide-react";

type EmbedType = "youtube" | "spotify" | "soundcloud" | "vimeo" | "link";
type EmbedData = { type: EmbedType; url: string; embedUrl: string; label: string };

// ── URL DETECTORS ────────────────────────────────────────
function extractEmbeds(text: string): EmbedData[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (!urls) return [];

    const seen = new Set<string>();
    const embeds: EmbedData[] = [];

    for (const url of urls) {
        const clean = url.replace(/[.,;!?)]+$/, ""); // strip trailing punctuation
        if (seen.has(clean)) continue;
        seen.add(clean);

        // YouTube
        const ytMatch = clean.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
        );
        if (ytMatch) {
            embeds.push({ type: "youtube", url: clean, embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, label: "YouTube" });
            continue;
        }

        // Spotify
        const spotifyMatch = clean.match(
            /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/
        );
        if (spotifyMatch) {
            embeds.push({ type: "spotify", url: clean, embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}?theme=0`, label: "Spotify" });
            continue;
        }

        // SoundCloud
        if (clean.includes("soundcloud.com/") && !clean.includes("/search")) {
            embeds.push({ type: "soundcloud", url: clean, embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&color=%238a2eff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`, label: "SoundCloud" });
            continue;
        }

        // Vimeo
        const vimeoMatch = clean.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            embeds.push({ type: "vimeo", url: clean, embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, label: "Vimeo" });
            continue;
        }

        // General link
        try {
            const hostname = new URL(clean).hostname.replace("www.", "");
            embeds.push({ type: "link", url: clean, embedUrl: clean, label: hostname });
        } catch { /* invalid url */ }
    }

    return embeds;
}

// ── Strip URLs from display text ─────────────────────────
export function stripEmbedUrls(text: string): string {
    // Only strip URLs that have embeds (YouTube, Spotify, SoundCloud, Vimeo)
    return text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
        const clean = match.replace(/[.,;!?)]+$/, "");
        if (
            clean.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)/) ||
            clean.match(/open\.spotify\.com\/(track|album|playlist|episode)\//) ||
            (clean.includes("soundcloud.com/") && !clean.includes("/search")) ||
            clean.match(/vimeo\.com\/\d+/)
        ) {
            return ""; // strip embedded URLs from visible text
        }
        return match; // keep non-embedded URLs visible
    }).replace(/\n{3,}/g, "\n\n").trim();
}

// ── ICON HELPER ──────────────────────────────────────────
function EmbedIcon({ type }: { type: EmbedType }) {
    switch (type) {
        case "youtube": return <Play className="w-3 h-3" />;
        case "spotify": return <Music className="w-3 h-3" />;
        case "soundcloud": return <Music className="w-3 h-3" />;
        case "vimeo": return <Film className="w-3 h-3" />;
        default: return <ExternalLink className="w-3 h-3" />;
    }
}

// ── STYLE COLORS PER TYPE ────────────────────────────────
const typeColors: Record<EmbedType, { bg: string; border: string; text: string; badge: string }> = {
    youtube: { bg: "rgba(255,0,0,0.04)", border: "rgba(255,0,0,0.15)", text: "#ef4444", badge: "rgba(255,0,0,0.1)" },
    spotify: { bg: "rgba(30,215,96,0.04)", border: "rgba(30,215,96,0.15)", text: "#1ed760", badge: "rgba(30,215,96,0.1)" },
    soundcloud: { bg: "rgba(255,85,0,0.04)", border: "rgba(255,85,0,0.15)", text: "#ff5500", badge: "rgba(255,85,0,0.1)" },
    vimeo: { bg: "rgba(26,183,234,0.04)", border: "rgba(26,183,234,0.15)", text: "#1ab7ea", badge: "rgba(26,183,234,0.1)" },
    link: { bg: "rgba(138,46,255,0.03)", border: "rgba(138,46,255,0.12)", text: "#8a2eff", badge: "rgba(138,46,255,0.08)" },
};

// ── MAIN COMPONENT ───────────────────────────────────────
export default function EmbedPreview({ content }: { content: string }) {
    const embeds = extractEmbeds(content);
    if (embeds.length === 0) return null;

    return (
        <div className="space-y-2 mb-2.5">
            {embeds.map((embed, i) => {
                const colors = typeColors[embed.type];

                if (embed.type === "youtube" || embed.type === "vimeo") {
                    return (
                        <div key={i} className="rounded-lg overflow-hidden border" style={{ borderColor: colors.border, background: colors.bg }}>
                            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                <iframe
                                    src={embed.embedUrl}
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                    title={embed.label}
                                />
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider"
                                    style={{ background: colors.badge, color: colors.text }}>
                                    <EmbedIcon type={embed.type} /> {embed.label}
                                </span>
                            </div>
                        </div>
                    );
                }

                if (embed.type === "spotify") {
                    return (
                        <div key={i} className="rounded-lg overflow-hidden border" style={{ borderColor: colors.border, background: colors.bg }}>
                            <iframe
                                src={embed.embedUrl}
                                className="w-full border-0"
                                height="152"
                                allow="encrypted-media"
                                loading="lazy"
                                title="Spotify"
                            />
                        </div>
                    );
                }

                if (embed.type === "soundcloud") {
                    return (
                        <div key={i} className="rounded-lg overflow-hidden border" style={{ borderColor: colors.border, background: colors.bg }}>
                            <iframe
                                src={embed.embedUrl}
                                className="w-full border-0"
                                height="166"
                                allow="autoplay"
                                loading="lazy"
                                title="SoundCloud"
                            />
                        </div>
                    );
                }

                // General link — minimal card
                return (
                    <a key={i} href={embed.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:brightness-110"
                        style={{ borderColor: colors.border, background: colors.bg }}>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.text }} />
                        <span className="text-[11px] font-mono truncate" style={{ color: colors.text }}>{embed.label}</span>
                        <span className="text-[9px] text-gray-700 truncate flex-1 text-right">{embed.url.slice(0, 60)}</span>
                    </a>
                );
            })}
        </div>
    );
}
