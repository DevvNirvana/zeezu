"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Play, Pause, Volume2, VolumeX, Download, Music2 } from "lucide-react";

// ── CSS (injected once) ────────────────────────────────────────────────────────
const STYLE_ID = "anthem-compact-v2";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes ac-spin  { to { transform: rotate(360deg); } }
    @keyframes ac-pulse { 0%,100%{opacity:.55} 50%{opacity:1} }
    @keyframes ac-pop   { 0%{transform:scale(1)} 40%{transform:scale(1.08)} 100%{transform:scale(1)} }
    @keyframes ac-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    .ac-pop { animation: ac-pop .28s cubic-bezier(.34,1.56,.64,1) both; }
    .ac-btn { transition: all .12s ease; outline: none; cursor: pointer; border: none; background: none; }
    .ac-btn:active:not(:disabled) { filter: brightness(0.78); transform: translateY(1px); }
    /* Show marquee only on mobile, static text only on desktop */
    .ac-marquee  { display: none; }
    .ac-static   { display: block; }
    @media (max-width: 640px) {
      .ac-marquee { display: block; }
      .ac-static  { display: none; }
    }
  `;
  document.head.appendChild(s);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}
function isSoundCloudUrl(url: string) { return /soundcloud\.com\/.+\/.+/.test(url); }

// ── Always-scrolling marquee text ──────────────────────────────────────────────
// Duplicates the content so it loops seamlessly. Speed ≈ 38px/s.
function Marquee({ text, color, fontSize = 14, glowing = false }: {
  text: string; color: string; fontSize?: number; glowing?: boolean;
}) {
  // Double the text so the second copy picks up right where the first ends
  const loopText = `${text}   ·   ${text}   ·   `;
  // Duration: roughly (characters × 7px) / 38px·s⁻¹, clamped between 6–30s
  const dur = Math.min(30, Math.max(6, (loopText.length * 7) / 38));

  return (
    <div style={{
      overflow: "hidden",
      WebkitMaskImage: "linear-gradient(90deg,transparent 0%,black 12%,black 88%,transparent 100%)",
      maskImage:       "linear-gradient(90deg,transparent 0%,black 12%,black 88%,transparent 100%)",
      position: "relative",
    }}>
      <div style={{
        display: "inline-block",
        whiteSpace: "nowrap",
        fontFamily: "'VT323', monospace",
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize + 2}px`,
        color,
        textShadow: glowing ? `0 0 8px ${color}88` : "none",
        animation: `ac-scroll ${dur}s linear infinite`,
        willChange: "transform",
      }}>
        {/* Render twice so second copy seamlessly follows first */}
        {loopText}{loopText}
      </div>
    </div>
  );
}

// ── Inline platform logo ───────────────────────────────────────────────────────
// Tiny SVGs at ~16×10px — recognisable at small sizes without any icon library.
function PlatformIcon({ ytId, isSC }: { ytId: string | null; isSC: boolean }) {
  if (ytId) {
    // YouTube: red rounded-rect with white play triangle
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" style={{ flexShrink: 0, display: "block" }}>
        <rect x="0" y="0" width="16" height="11" rx="2.5" fill="#FF0000" />
        <polygon points="6,2.5 6,8.5 12,5.5" fill="white" />
      </svg>
    );
  }
  if (isSC) {
    // SoundCloud: simplified cloud silhouette in brand orange
    return (
      <svg width="18" height="11" viewBox="0 0 18 11" style={{ flexShrink: 0, display: "block" }}>
        <path
          d="M2,9.5 Q0.5,9.5 0.5,8 Q0.5,6.5 2,6.5 Q1.7,5.5 2.5,5 Q2.5,3 4.5,3 Q5.5,3 6,3.8 Q6.8,2 8.5,2 Q10.5,2 10.5,4 Q11.5,4 11.5,5.5 Q12.5,5.5 12.5,7 Q12.5,9.5 10,9.5 Z"
          fill="#FF5500"
        />
      </svg>
    );
  }
  // Direct audio: simple music note
  return (
    <span style={{ fontSize: "11px", color: "rgba(255,255,255,.35)", lineHeight: 1, flexShrink: 0 }}>♪</span>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
export type AnthemMiniPlayerProps = {
  trackUrl: string;
  trackTitle?: string | null;
  trackArtist?: string | null;
  fromUserId: string;
  fromDisplayName: string;
  viewerId?: string | null;
  primary?: string;
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function AnthemMiniPlayer({
  trackUrl, trackTitle, trackArtist,
  fromUserId, fromDisplayName,
  viewerId, primary: primaryProp = "#FF6B35",
}: AnthemMiniPlayerProps) {
  const instanceId = useRef(Math.random().toString(36).slice(2));

  const [isPlaying,   setIsPlaying]   = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [muted,       setMuted]       = useState(false);
  const [showEmbed,   setShowEmbed]   = useState(false);
  const [stolen,      setStolen]      = useState(false);
  const [stolenId,    setStolenId]    = useState<string | null>(null);
  const [stealing,    setStealing]    = useState(false);
  const [stealPop,    setStealPop]    = useState(false);
  const [thumbError,  setThumbError]  = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const ytId     = getYouTubeId(trackUrl);
  const isSC     = isSoundCloudUrl(trackUrl);
  const hasEmbed = !!(ytId || isSC);
  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;

  // Platform-aware color: YouTube → red, SoundCloud → orange, direct → prop fallback
  const primary = ytId ? "#FF3333" : isSC ? "#FF5500" : primaryProp;

  const displayTitle  = (trackTitle || "")
    || decodeURIComponent(trackUrl.split("/").pop() ?? "")
        .replace(/\.(mp3|wav|ogg|m4a)$/i, "").replace(/[-_]/g, " ")
    || "Anthem Track";
  const displayArtist = trackArtist || null;

  const ytEmbedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3`
    : null;
  const scEmbedUrl = isSC
    ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=${encodeURIComponent(primary)}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`
    : null;
  const embedUrl = ytEmbedUrl ?? scEmbedUrl;

  // ── Iframe postMessage helper ──────────────────────────────────────────────
  const sendToIframe = useCallback((ytCmd: object, scCmd: object) => {
    if (!iframeRef.current?.contentWindow) return;
    if (ytId)  iframeRef.current.contentWindow.postMessage(JSON.stringify(ytCmd), "*");
    if (isSC)  iframeRef.current.contentWindow.postMessage(JSON.stringify(scCmd), "*");
  }, [ytId, isSC]);

  // ── Check if already stolen ───────────────────────────────────────────────
  useEffect(() => {
    if (!viewerId) return;
    supabase.from("user_sounds").select("id")
      .eq("user_id", viewerId).eq("track_url", trackUrl).maybeSingle()
      .then(({ data }) => { if (data) { setStolen(true); setStolenId(data.id); } });
  }, [viewerId, trackUrl]);

  // ── Init audio element for direct (non-embed) URLs ───────────────────────
  // crossOrigin MUST be set before .src is assigned
  useEffect(() => {
    if (hasEmbed) return;
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.src = trackUrl;
    a.volume = 0.75;
    a.preload = "metadata";
    audioRef.current = a;
    return () => { a.pause(); a.src = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackUrl, hasEmbed]);

  // ── Mutual exclusion — pause when radio or another anthem player starts ───
  useEffect(() => {
    const pause = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.from === instanceId.current) return;
      // We drive our own state — don't rely on postMessage replies
      sendToIframe(
        { event: "command", func: "pauseVideo", args: [] },
        { method: "pause" }
      );
      audioRef.current?.pause();
      setIsPlaying(false);
    };
    window.addEventListener("zeezu:radio-play",  pause);
    window.addEventListener("zeezu:anthem-play", pause);
    return () => {
      window.removeEventListener("zeezu:radio-play",  pause);
      window.removeEventListener("zeezu:anthem-play", pause);
    };
  }, [sendToIframe]);

  // ── iframe onLoad — fire play AFTER YouTube API bridge is ready ──────────
  // We explicitly set isPlaying(true) here instead of relying on onStateChange
  // which is unreliable from invisible iframes.
  const handleIframeLoad = useCallback(() => {
    if (!pendingPlay) return;
    setTimeout(() => {
      sendToIframe(
        { event: "command", func: "playVideo", args: [] },
        { method: "play" }
      );
      setIsPlaying(true);   // drive state ourselves
      setPendingPlay(false);
    }, 1100);
  }, [pendingPlay, sendToIframe]);

  // ── Play ──────────────────────────────────────────────────────────────────
  const doPlay = useCallback(() => {
    window.dispatchEvent(new CustomEvent("zeezu:anthem-play", { detail: { from: instanceId.current } }));
    if (hasEmbed) {
      if (!showEmbed) {
        // First press: mount iframe, wait for onLoad, then auto-play
        setShowEmbed(true);
        setPendingPlay(true);
      } else {
        // Iframe already mounted — send command and immediately update state
        sendToIframe(
          { event: "command", func: "playVideo", args: [] },
          { method: "play" }
        );
        setIsPlaying(true);
      }
    } else {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [hasEmbed, showEmbed, sendToIframe]);

  // ── Pause ─────────────────────────────────────────────────────────────────
  const doPause = useCallback(() => {
    sendToIframe(
      { event: "command", func: "pauseVideo", args: [] },
      { method: "pause" }
    );
    audioRef.current?.pause();
    setIsPlaying(false); // drive state ourselves
  }, [sendToIframe]);

  // ── Mute toggle — works for both native audio AND embeds ─────────────────
  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      // Native audio
      if (audioRef.current) audioRef.current.volume = next ? 0 : 0.75;
      // YouTube uses 0–100 scale, SoundCloud uses 0–1 scale
      sendToIframe(
        { event: "command", func: "setVolume", args: [next ? 0 : 100] },
        { method: "setVolume", value: next ? 0 : 1 }
      );
      return next;
    });
  }, [sendToIframe]);

  // ── Steal ─────────────────────────────────────────────────────────────────
  const handleSteal = useCallback(async () => {
    if (!viewerId || stealing) return;
    setStealing(true);
    setStealPop(true);
    setTimeout(() => setStealPop(false), 280);

    if (stolen && stolenId) {
      // Un-steal: just remove from library, no activity event
      const { error } = await supabase.from("user_sounds").delete().eq("id", stolenId);
      if (!error) { setStolen(false); setStolenId(null); }
    } else {
      // Client-side dedup: check before inserting so no duplicate rows
      const { data: existing } = await supabase
        .from("user_sounds").select("id")
        .eq("user_id", viewerId).eq("track_url", trackUrl).maybeSingle();

      if (existing) {
        // Already exists — just sync local state
        setStolen(true); setStolenId(existing.id);
      } else {
        const { data, error } = await supabase
          .from("user_sounds").insert({
            user_id: viewerId,
            track_url: trackUrl,
            track_title: displayTitle,
            track_artist: displayArtist,
            discovered_from_user_id: fromUserId,
          }).select("id").single();

        if (!error && data) {
          setStolen(true); setStolenId(data.id);
          // Fire activity event exactly once per fresh steal
          await supabase.from("activity_events").insert({
            actor_id: viewerId,
            target_user_id: fromUserId,
            event_type: "anthem_stolen",
            reference_id: null,
            meta: { track_url: trackUrl, track_title: displayTitle },
          });
        } else if (error) {
          console.error("[AnthemMiniPlayer] steal:", error.message);
        }
      }
    }
    setStealing(false);
  }, [viewerId, stealing, stolen, stolenId, trackUrl, displayTitle, displayArtist, fromUserId]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ userSelect: "none", width: "100%" }}>
      {/* Hidden iframe — lives in DOM once show, costs zero layout */}
      {showEmbed && embedUrl && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          onLoad={handleIframeLoad}
          allow="autoplay"
          style={{ width: 0, height: 0, position: "absolute", opacity: 0, pointerEvents: "none" }}
        />
      )}

      {/* ── Compact player row ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        background: "rgba(0,0,0,.38)",
        borderRadius: "8px",
        border: `1px solid ${primary}20`,
        borderLeft: `3px solid ${primary}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.04), 0 2px 8px rgba(0,0,0,.4)`,
        backdropFilter: "blur(8px)",
        minHeight: "52px",
        overflow: "hidden", // keeps marquee clipped to the card
      }}>

        {/* Thumbnail — YouTube only, falls back to 🎵 */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          {thumbUrl && !thumbError ? (
            <img
              src={thumbUrl}
              alt=""
              onError={() => setThumbError(true)}
              style={{
                width: "36px", height: "36px",
                borderRadius: "5px", objectFit: "cover",
                border: `1px solid ${primary}30`,
                display: "block",
              }}
            />
          ) : (
            <div style={{
              width: "36px", height: "36px", borderRadius: "5px",
              background: `${primary}18`, border: `1px solid ${primary}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>
              🎵
            </div>
          )}
          {/* Live pulse dot on thumbnail when playing */}
          {isPlaying && (
            <div style={{
              position: "absolute", top: "2px", right: "2px",
              width: "6px", height: "6px", borderRadius: "50%",
              background: primary, boxShadow: `0 0 6px ${primary}`,
              animation: "ac-pulse 1.5s ease-in-out infinite",
            }} />
          )}
        </div>

        {/* Track info — marquee on mobile, static truncated on desktop */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>

          {/* ── Mobile: always-scrolling marquee ── */}
          <div className="ac-marquee">
            <Marquee
              text={displayTitle.toUpperCase()}
              color={primary}
              fontSize={14}
              glowing={isPlaying}
            />
            <div style={{ marginTop: "1px" }}>
              <Marquee
                text={
                  // Prefix with platform abbreviation for mobile where SVG can't render
                  (ytId ? "▶ YT · " : isSC ? "☁ SC · " : "♪ ")
                  + (displayArtist
                    ? `${displayArtist.toUpperCase()} · VIA ${fromDisplayName.toUpperCase()}`
                    : `VIA ${fromDisplayName.toUpperCase()}`)
                }
                color="rgba(255,255,255,.35)"
                fontSize={11}
              />
            </div>
          </div>

          {/* ── Desktop: static text + platform icon ── */}
          <div className="ac-static">
            <div style={{
              fontFamily: "'VT323', monospace",
              fontSize: "14px", lineHeight: "16px",
              color: primary,
              textShadow: isPlaying ? `0 0 8px ${primary}88` : "none",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              transition: "text-shadow .3s",
            }}>{displayTitle}</div>
            {/* Subtitle: platform logo + via username */}
            <div style={{
              display: "flex", alignItems: "center", gap: "4px",
              marginTop: "2px",
              overflow: "hidden",
            }}>
              <PlatformIcon ytId={ytId} isSC={isSC} />
              <span style={{
                fontFamily: "'VT323', monospace",
                fontSize: "11px", lineHeight: "12px",
                color: "rgba(255,255,255,.35)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                flexShrink: 1,
              }}>
                {displayArtist ? `${displayArtist} · ` : ""}via {fromDisplayName}
              </span>
            </div>
          </div>

        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>

          {/* Play / Pause — spinner during buffering */}
          <button
            className="ac-btn"
            onClick={isPlaying ? doPause : doPlay}
            disabled={pendingPlay}
            title={pendingPlay ? "Buffering…" : isPlaying ? "Pause" : "Play"}
            style={{
              width: "34px", height: "34px",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isPlaying
                ? `radial-gradient(circle at 38% 32%, ${primary}dd, ${primary}88)`
                : `radial-gradient(circle at 38% 32%, ${primary}55, ${primary}22)`,
              border: `1px solid ${isPlaying ? primary + "90" : primary + "33"}`,
              boxShadow: isPlaying
                ? `0 0 14px ${primary}50, inset 0 1px 0 rgba(255,255,255,.22)`
                : `inset 0 1px 0 rgba(255,255,255,.14), 0 2px 6px rgba(0,0,0,.5)`,
              color: "#fff",
              opacity: pendingPlay ? 0.75 : 1,
              cursor: pendingPlay ? "default" : "pointer",
              transition: "all .15s ease",
            }}
          >
            {pendingPlay ? (
              <div style={{
                width: "12px", height: "12px", borderRadius: "50%",
                border: `2px solid ${primary}35`,
                borderTop: `2px solid ${primary}`,
                animation: "ac-spin 0.7s linear infinite",
              }} />
            ) : isPlaying ? (
              <Pause size={13} />
            ) : (
              <Play size={13} style={{ marginLeft: "1px" }} />
            )}
          </button>

          {/* Mute toggle — icon only, tapping cycles muted/unmuted */}
          <button
            className="ac-btn"
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
            style={{
              width: "28px", height: "28px",
              borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: muted ? `${primary}20` : "rgba(255,255,255,.06)",
              border: `1px solid ${muted ? primary + "45" : "rgba(255,255,255,.08)"}`,
              boxShadow: muted ? `0 0 8px ${primary}15` : "none",
              color: muted ? primary : "rgba(255,255,255,.38)",
              transition: "all .15s ease",
            }}
          >
            {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>

          {/* Steal / In Sounds */}
          {viewerId && (
            <button
              className={`ac-btn${stealPop ? " ac-pop" : ""}`}
              onClick={handleSteal}
              disabled={stealing}
              title={stolen ? "Remove from Sounds" : "Add to your Sounds"}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "0 10px", height: "28px",
                borderRadius: "6px",
                fontFamily: "'VT323', monospace",
                fontSize: "11px",
                letterSpacing: "1px",
                whiteSpace: "nowrap",
                color: stolen ? primary : "rgba(255,255,255,.38)",
                background: stolen ? `${primary}20` : "rgba(255,255,255,.06)",
                border: `1px solid ${stolen ? primary + "45" : "rgba(255,255,255,.08)"}`,
                boxShadow: stolen ? `0 0 10px ${primary}18` : "none",
                textShadow: stolen ? `0 0 8px ${primary}` : "none",
                opacity: stealing ? 0.5 : 1,
                cursor: stealing ? "not-allowed" : "pointer",
                transition: "all .15s ease",
              }}
            >
              {stolen
                ? <><Download size={9} style={{ flexShrink: 0 }} /> IN SOUNDS</>
                : <><Music2 size={9} style={{ flexShrink: 0 }} /> STEAL</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
