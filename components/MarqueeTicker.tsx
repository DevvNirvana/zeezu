"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TTL_MS = 10 * 60 * 1000;  // 10 minutes

const NOTIF_META: Record<string, { icon: string; label: string }> = {
  comment:         { icon: "💬", label: "commented on your post" },
  reply:           { icon: "💬", label: "replied to your comment" },
  zap:             { icon: "⚡", label: "zapped your post" },
  upvote:          { icon: "👍", label: "upvoted your comment" },
  friend_request:  { icon: "👤", label: "sent you a friend request" },
  friend_accepted: { icon: "✓",  label: "accepted your request" },
  buzz:            { icon: "⚡", label: "sent you a buzz" },
  mention:         { icon: "📢", label: "mentioned you" },
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CSS — injected once at module level
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_ID = "zee-marquee-ticker-v1";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes zmt-scroll  { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
    @keyframes zmt-live-dot { 0%,100%{opacity:1} 50%{opacity:.2} }

    .zee-marquee-ticker {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 26px;
      display: flex;
      align-items: center;
      overflow: hidden;
      z-index: 999;
    }
    /* On mobile — sit flush above the bottom dock, no gap */
    @media (max-width: 768px) {
      .zee-marquee-ticker {
        bottom: var(--mobile-dock-height) !important;
      }
    }

    .zmt-scanlines {
      position: absolute;
      inset: 0;
      background-image: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,.12) 2px,
        rgba(0,0,0,.12) 3px
      );
      pointer-events: none;
    }

    .zmt-live-badge {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px 0 6px;
      height: 100%;
      background: rgba(255, 45, 135, 0.1);
      position: relative;
      z-index: 1;
    }
    .zmt-live-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: #FF2D87;
      box-shadow: 0 0 6px #FF2D87;
      animation: zmt-live-dot 1.4s ease-in-out infinite;
      display: inline-block;
      flex-shrink: 0;
    }
    .zmt-live-lbl {
      font-family: 'Orbitron', sans-serif;
      font-size: 7px;
      font-weight: 900;
      color: #FF2D87;
      letter-spacing: 2px;
    }
    .zmt-live-sep {
      width: 1px;
      height: 14px;
      background: rgba(255,45,135,0.3);
      flex-shrink: 0;
      margin-right: 2px;
    }

    .zmt-track {
      display: flex;
      white-space: nowrap;
      animation: zmt-scroll 40s linear infinite;
      font-family: 'VT323', monospace;
      font-size: 12px;
      color: rgba(255,255,255,.5);
      letter-spacing: 2px;
      position: relative;
      z-index: 1;
      will-change: transform;
    }
    .zmt-track.zmt-live {
      color: rgba(255,255,255,.65);
      font-size: 12px;
    }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface MarqueeTickerProps {
  /** Hex color for the gradient (e.g. "#3B0DA8"). Default: "#3B0DA8" */
  primary?: string;
  /** Second stop hex (e.g. "#0B4B8F"). Default: "#0B4B8F" */
  secondary?: string;
  /** Static text shown when there's no live data */
  fallbackText?: string;
}

export default function MarqueeTicker({
  primary   = "#3B0DA8",
  secondary = "#0B4B8F",
  fallbackText = "✦ ZEEZU NETWORK · NO ALGORITHM · JUST PEOPLE · THE INTERNET AFTER DARK · STAY CONNECTED · YOUR NETWORK IS LIVE · ",
}: MarqueeTickerProps) {
  const [liveSegments, setLiveSegments] = useState<string[]>([]);
  const uidRef = useRef<string | null>(null);

  const fetchLive = useCallback(async (uid: string) => {
    const cutoff = new Date(Date.now() - TTL_MS).toISOString();
    const segs: string[] = [];

    // 1. User's own notifications
    const { data: notifs } = await supabase
      .from("notifications")
      .select("id, type, content, created_at, actor:users!actor_id(display_name)")
      .eq("user_id", uid)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(4);

    if (notifs?.length) {
      for (const n of notifs) {
        const meta = NOTIF_META[n.type] ?? { icon: "🔔", label: n.content ?? "notification" };
        const actor = (n.actor as any)?.display_name ?? "Someone";
        segs.push(`${meta.icon} ${actor} ${meta.label}`);
      }
    }

    // 2. Core 8 friends' recent wall posts
    const { data: c8 } = await supabase
      .from("core_eight")
      .select("friend_id")
      .eq("user_id", uid);

    const friendIds = (c8 ?? []).map((r: any) => r.friend_id).filter(Boolean);

    if (friendIds.length > 0) {
      const { data: posts } = await supabase
        .from("zeewall")
        .select("id, content, created_at, author:users!author_id(display_name)")
        .in("author_id", friendIds)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(3);

      if (posts?.length) {
        for (const p of posts) {
          const name = (p.author as any)?.display_name ?? "Friend";
          const snippet = truncate(
            p.content?.replace(/\[mood:[^\]]+\]\n?/, "").trim() ?? "",
            35
          );
          segs.push(
            `🔥 ${name}: "${snippet || "posted on their wall"}"`
          );
        }
      }

      // 3. Core 8 friends' recent zlogs
      try {
        const { data: zlogs } = await supabase
          .from("zlogs")
          .select("id, title, created_at, author:users!user_id(display_name)")
          .in("user_id", friendIds)
          .eq("visibility", "public")
          .gte("created_at", cutoff)
          .order("created_at", { ascending: false })
          .limit(2);

        if (zlogs?.length) {
          for (const z of zlogs) {
            const name = (z.author as any)?.display_name ?? "Friend";
            segs.push(`✍ ${name} published "${truncate(z.title ?? "a zlog", 28)}"`);
          }
        }
      } catch {
        // zlogs table may not exist yet
      }
    }

    setLiveSegments(segs);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      uidRef.current = user.id;
      await fetchLive(user.id);

      // Re-fetch when a new notification arrives in realtime
      channel = supabase
        .channel("marquee-notifs")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => fetchLive(user.id)
        )
        .subscribe();

      // Re-fetch when user returns to the tab (catches zeewall/zlog changes missed while hidden)
      const onVisible = () => {
        if (!document.hidden && uidRef.current) fetchLive(uidRef.current);
      };
      document.addEventListener("visibilitychange", onVisible);

      // Store cleanup ref on channel object (hack-free way to clean up listener)
      (channel as any)._onVisible = onVisible;
    }

    init();

    return () => {
      if (channel) {
        const onVisible = (channel as any)._onVisible;
        if (onVisible) document.removeEventListener("visibilitychange", onVisible);
        supabase.removeChannel(channel);
      }
    };
  }, [fetchLive]);

  const hasLive = liveSegments.length > 0;

  // Build the scrolling string — live items separated by ✦, or fallback
  const liveText = hasLive
    ? liveSegments.map(s => `✦ ${s}   `).join("") + "   "
    : null;

  const displayText = liveText ?? fallbackText;
  // Repeat 6× so -25% translateX always has content ahead (4 copies minimum needed)
  const repeated = displayText.repeat(6);

  const bg = `linear-gradient(90deg,${primary} 0%,${secondary} 50%,${primary} 100%)`;
  const borderColor = `${primary}80`;
  const shadow = `0 -2px 16px ${primary}33`;

  return (
    <div
      className="zee-marquee-ticker"
      aria-hidden="true"
      style={{ background: bg, borderTop: `1px solid ${borderColor}`, boxShadow: shadow }}
    >
      {/* CRT scanlines */}
      <div className="zmt-scanlines" />

      {/* LIVE badge */}
      {hasLive && (
        <div className="zmt-live-badge">
          <span className="zmt-live-dot" />
          <span className="zmt-live-lbl">LIVE</span>
          <span className="zmt-live-sep" />
        </div>
      )}

      {/* Scrolling text */}
      <div className={`zmt-track${hasLive ? " zmt-live" : ""}`}>
        {repeated}
      </div>
    </div>
  );
}
