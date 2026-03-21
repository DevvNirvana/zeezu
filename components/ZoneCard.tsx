"use client";

import { useRouter } from "next/navigation";
import { Users, Radio } from "lucide-react";
import type { Zone } from "@/lib/supabase/queries";

const TOPIC_COLORS: Record<string, string> = {
  tech:     "#00E5FF",
  music:    "#FF2D87",
  art:      "#B4FF00",
  gaming:   "#8A2EFF",
  film:     "#FF9500",
  writing:  "#00E5FF",
  fashion:  "#FF2D87",
  sports:   "#B4FF00",
  science:  "#00E5FF",
  random:   "#6B7280",
  general:  "#6B7280",
};

export default function ZoneCard({ zone, isMember = false }: { zone: Zone; isMember?: boolean }) {
  const router = useRouter();
  const accent = zone.accent_color || "#FF2D87";
  const topicColor = TOPIC_COLORS[zone.topic_tag] || "#6B7280";

  return (
    <div
      onClick={() => router.push(`/zones/${zone.slug}`)}
      style={{
        background: "rgba(7,12,30,0.85)",
        border: `1px solid ${accent}28`,
        borderRadius: "14px",
        padding: "16px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
        boxShadow: `0 2px 16px ${accent}10`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}55`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 28px ${accent}22`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}28`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 16px ${accent}10`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Ambient glow */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", background: `radial-gradient(ellipse at 100% 0%, ${accent}18 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Top row: emoji + name + topic pill */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
        <div style={{ fontSize: "28px", lineHeight: "1", flexShrink: 0, filter: `drop-shadow(0 0 8px ${accent}60)` }}>
          {zone.icon_emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 900, color: "#fff", letterSpacing: "0.5px", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            z/{zone.slug}
          </div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {zone.name}
          </div>
        </div>
        <div style={{ flexShrink: 0, padding: "2px 7px", borderRadius: "20px", background: `${topicColor}18`, border: `1px solid ${topicColor}35`, fontFamily: "'VT323',monospace", fontSize: "9px", color: topicColor, letterSpacing: "1px", whiteSpace: "nowrap" }}>
          {zone.topic_tag.toUpperCase()}
        </div>
      </div>

      {/* Description */}
      {zone.description && (
        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.4)", margin: "0 0 10px 0", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {zone.description}
        </p>
      )}

      {/* Stats + status */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Users size={10} style={{ color: "rgba(255,255,255,.3)" }} />
          <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.4)", letterSpacing: "0.5px" }}>
            {zone.member_count.toLocaleString()}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Radio size={10} style={{ color: "rgba(255,255,255,.3)" }} />
          <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.4)", letterSpacing: "0.5px" }}>
            {zone.post_count.toLocaleString()} posts
          </span>
        </div>
        {isMember && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: accent, boxShadow: `0 0 5px ${accent}`, display: "inline-block" }} />
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: accent, letterSpacing: "1.5px" }}>TUNED IN</span>
          </div>
        )}
      </div>

      {/* Locked badge */}
      {zone.is_locked && (
        <div style={{ position: "absolute", top: "10px", left: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,150,0,.15)", border: "1px solid rgba(255,150,0,.3)", fontFamily: "'VT323',monospace", fontSize: "9px", color: "#FF9500", letterSpacing: "1px" }}>
          LOCKED
        </div>
      )}
    </div>
  );
}
