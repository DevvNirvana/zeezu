"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import ThemeEngine from "@/components/ThemeEngine";
import GlobalFeed from "@/components/GlobalFeed";
import { getZoneBySlug, getMyZoneMembership, joinZone, leaveZone, getZoneMembers, type Zone, type ZoneMember } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, Users, Radio, Lock, Settings, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { confirmModal } from "@/components/ConfirmModal";

export default function ZonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [zone, setZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userZid, setUserZid] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<"owner" | "mod" | "member" | null>(null);
  const [joining, setJoining] = useState(false);
  const [memberPreview, setMemberPreview] = useState<ZoneMember[]>([]);

  useEffect(() => {
    async function init() {
      const [{ data: { user } }, zoneData] = await Promise.all([
        supabase.auth.getUser(),
        getZoneBySlug(slug),
      ]);

      if (!zoneData) { router.replace("/zones"); return; }
      setZone(zoneData);

      if (user) {
        const [membership, members, userData] = await Promise.all([
          getMyZoneMembership(zoneData.id),
          getZoneMembers(zoneData.id, 5),
          supabase.from("users").select("zid").eq("id", user.id).single(),
        ]);
        setUserId(user.id);
        setUserZid(userData.data?.zid ?? null);
        setMyRole(membership?.role ?? null);
        setMemberPreview(members);
      } else {
        const members = await getZoneMembers(zoneData.id, 5);
        setMemberPreview(members);
      }
      setLoading(false);
    }
    init();
  }, [slug, router]);

  const handleJoin = async () => {
    if (!zone || !userId) { router.push("/login"); return; }
    setJoining(true);
    const ok = await joinZone(zone.id);
    if (ok) {
      setMyRole("member");
      setZone(z => z ? { ...z, member_count: z.member_count + 1 } : z);
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!zone || !userId || myRole === "owner") return;
    if (!await confirmModal({ title: "Leave Zone", message: `Leave z/${zone.slug}?`, confirmText: "LEAVE" })) return;
    setJoining(true);
    await leaveZone(zone.id);
    setMyRole(null);
    setZone(z => z ? { ...z, member_count: Math.max(0, z.member_count - 1) } : z);
    setJoining(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#070C1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ThemeEngine config={null} /><NavBar />
      <Loader2 size={28} style={{ color: "#FF2D87", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!zone) return null;

  const accent = zone.accent_color || "#FF2D87";
  const isMember = myRole !== null;
  const isOwnerOrMod = myRole === "owner" || myRole === "mod";
  const canPost = userId && isMember && !zone.is_locked;

  return (
    <div style={{ minHeight: "100vh", background: "#070C1E", color: "#fff", fontFamily: "'Nunito',sans-serif", paddingBottom: "var(--mobile-dock-height)" }}>
      <ThemeEngine config={null} />
      <NavBar />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "16px 16px 0" }}>

        {/* Back */}
        <button onClick={() => router.push("/zones")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "rgba(255,255,255,.35)", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", letterSpacing: "1px", cursor: "pointer", marginBottom: "14px", padding: 0 }}>
          <ArrowLeft size={11} /> ALL ZONES
        </button>

        {/* ── ZONE HEADER BANNER ── */}
        <style>{`
          .zone-banner-inner { padding: 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; position: relative; z-index: 1; }
          .zone-banner-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
          @media (max-width: 600px) {
            .zone-banner-inner { flex-direction: column; align-items: flex-start; gap: 10px; padding: 16px; }
            .zone-banner-top { display: flex; align-items: center; gap: 12px; width: 100%; }
            .zone-banner-actions { width: 100%; flex-direction: row; justify-content: flex-start; flex-wrap: wrap; }
            .zone-banner-actions a, .zone-banner-actions button, .zone-banner-actions div[style] {
              flex: 1; justify-content: center;
            }
          }
        `}</style>
        <div style={{ borderRadius: "14px", overflow: "hidden", marginBottom: "16px", position: "relative", background: `linear-gradient(135deg,${accent}30 0%,rgba(7,12,30,.95) 60%)`, border: `1px solid ${accent}30` }}>
          {/* Scanlines */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.1) 3px,rgba(0,0,0,.1) 4px)", pointerEvents: "none" }} />
          {/* Glow */}
          <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "100%", background: `radial-gradient(ellipse at 100% 50%,${accent}18 0%,transparent 70%)`, pointerEvents: "none" }} />

          <div className="zone-banner-inner">
            {/* Mobile: top row = emoji + slug + name together */}
            <div className="zone-banner-top" style={{ display: "contents" }}>
              {/* Icon */}
              <div style={{ fontSize: "44px", lineHeight: "1", filter: `drop-shadow(0 0 12px ${accent}80)`, flexShrink: 0 }}>
                {zone.icon_emoji}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: accent, letterSpacing: "2px", marginBottom: "2px" }}>
                  z/{zone.slug}
                </div>
                <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "18px", fontWeight: 900, color: "#fff", margin: "0 0 6px 0", letterSpacing: "0.5px" }}>
                  {zone.name}
                </h1>
                {zone.description && (
                  <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", color: "rgba(255,255,255,.5)", margin: "0 0 10px 0", lineHeight: "1.5" }}>
                    {zone.description}
                  </p>
                )}
                {/* Stats — horizontal scroll on mobile */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap", overflowX: "auto", paddingBottom: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                    <Users size={11} style={{ color: "rgba(255,255,255,.4)" }} />
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.5)", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                      {zone.member_count.toLocaleString()} members
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                    <Radio size={11} style={{ color: "rgba(255,255,255,.4)" }} />
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.5)", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                      {zone.post_count.toLocaleString()} transmissions
                    </span>
                  </div>
                  <div style={{ padding: "2px 8px", borderRadius: "20px", background: `${accent}15`, border: `1px solid ${accent}30`, fontFamily: "'VT323',monospace", fontSize: "9px", color: accent, letterSpacing: "1px", flexShrink: 0 }}>
                    {zone.topic_tag.toUpperCase()}
                  </div>
                  {zone.is_locked && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "20px", background: "rgba(255,150,0,.12)", border: "1px solid rgba(255,150,0,.3)", fontFamily: "'VT323',monospace", fontSize: "9px", color: "#FF9500", letterSpacing: "1px", flexShrink: 0 }}>
                      <Lock size={8} /> LOCKED
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions — full width row on mobile */}
            <div className="zone-banner-actions">
              {isOwnerOrMod && (
                <Link href={`/zones/${zone.slug}/settings`} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "9px", background: "transparent", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.4)", fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 900, letterSpacing: "1px", textDecoration: "none", transition: "all 0.15s" }}>
                  <Settings size={11} /> SETTINGS
                </Link>
              )}
              {!isMember ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "10px", background: `${accent}25`, border: `1px solid ${accent}50`, color: accent, fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer", transition: "all 0.15s" }}
                >
                  {joining ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Radio size={12} />}
                  TUNE IN
                </button>
              ) : myRole !== "owner" ? (
                <button
                  onClick={handleLeave}
                  disabled={joining}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.35)", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer", transition: "all 0.15s" }}
                >
                  DROP SIGNAL
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "10px", background: `${accent}15`, border: `1px solid ${accent}30` }}>
                  <Shield size={11} style={{ color: accent }} />
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: accent, letterSpacing: "1.5px" }}>OWNER</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TWO COLUMN LAYOUT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px", alignItems: "start" }} className="zone-layout">
          <style>{`
            @media (max-width: 768px) {
              .zone-layout { grid-template-columns: 1fr !important; }
              /* Feed first on mobile — banner already shows key info */
              .zone-sidebar { margin-top: 4px; }
              /* Collapse sidebar panels on mobile */
              .zone-sidebar-panel { border-radius: 10px !important; }
              .zone-sidebar-panel summary {
                display: flex; align-items: center; justify-content: space-between;
                cursor: pointer; padding: 10px 14px; list-style: none;
                font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 900;
                color: rgba(255,255,255,.4); letter-spacing: 1.5px;
              }
              .zone-sidebar-panel summary::-webkit-details-marker { display: none; }
              .zone-sidebar-panel[open] summary { border-bottom: 1px solid rgba(255,255,255,.06); }
              .zone-sidebar-panel-body { padding: 10px 14px; }
            }
          `}</style>

          {/* ── MOBILE-ONLY: Rules chip + Crew strip (between banner and feed) ── */}
          <style>{`
            .zone-mobile-strip { display: none; }
            @media (max-width: 768px) {
              .zone-mobile-strip { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
            }
          `}</style>
          <div className="zone-mobile-strip">
            {/* Rules — only if zone has rules */}
            {zone.rules && (
              <details style={{ background: "rgba(255,150,0,.07)", border: "1px solid rgba(255,150,0,.2)", borderRadius: "10px" }}>
                <summary style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 12px", cursor: "pointer", listStyle: "none", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, color: "rgba(255,150,0,.8)", letterSpacing: "1.5px" }}>
                  <span style={{ fontSize: "12px" }}>📋</span> ZONE RULES
                  <span style={{ marginLeft: "auto", opacity: 0.5, fontFamily: "'VT323',monospace", fontSize: "12px" }}>▾</span>
                </summary>
                <pre style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.45)", lineHeight: "1.7", margin: 0, padding: "0 12px 10px", whiteSpace: "pre-wrap" }}>{zone.rules}</pre>
              </details>
            )}
            {/* Crew avatar strip */}
            {memberPreview.length > 0 && (
              <Link href={`/zones/${zone.slug}/members`} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: "10px", textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {memberPreview.slice(0, 5).map((m, i) => {
                    const u = m.user as any;
                    return (
                      <img key={u?.id} src={u?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u?.zid}`} alt="" style={{ width: "24px", height: "24px", borderRadius: "7px", border: `1.5px solid rgba(7,12,30,1)`, objectFit: "cover", marginLeft: i > 0 ? "-6px" : "0" }} />
                    );
                  })}
                </div>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.35)", letterSpacing: "1px" }}>
                  {zone.member_count.toLocaleString()} MEMBERS IN THIS ZONE →
                </span>
              </Link>
            )}
          </div>

          {/* ── FEED ── */}
          <div style={{ background: "rgba(7,12,30,.85)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "14px", overflow: "hidden" }}>
            {zone.is_locked && !isOwnerOrMod ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <Lock size={28} style={{ color: "rgba(255,150,0,.5)", marginBottom: "12px" }} />
                <p style={{ fontFamily: "'VT323',monospace", fontSize: "15px", color: "rgba(255,255,255,.3)", letterSpacing: "2px" }}>
                  THIS ZONE IS LOCKED · NO NEW TRANSMISSIONS
                </p>
              </div>
            ) : !userId ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <Radio size={28} style={{ color: `${accent}60`, marginBottom: "12px" }} />
                <p style={{ fontFamily: "'VT323',monospace", fontSize: "14px", color: "rgba(255,255,255,.3)", letterSpacing: "2px", marginBottom: "16px" }}>
                  SIGN IN TO TUNE IN AND BROADCAST
                </p>
                <button onClick={() => router.push("/login")} style={{ padding: "8px 20px", borderRadius: "10px", background: `${accent}20`, border: `1px solid ${accent}40`, color: accent, fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer" }}>
                  SIGN IN
                </button>
                {/* Show read-only feed for logged-out visitors */}
              </div>
            ) : !isMember ? (
              <div style={{ padding: "30px 20px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <p style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,255,255,.25)", letterSpacing: "2px", marginBottom: "12px" }}>
                  TUNE IN TO BROADCAST IN THIS ZONE
                </p>
                <button onClick={handleJoin} style={{ padding: "7px 18px", borderRadius: "10px", background: `${accent}20`, border: `1px solid ${accent}40`, color: accent, fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer" }}>
                  <Radio size={10} style={{ display: "inline", marginRight: "5px" }} />TUNE IN
                </button>
              </div>
            ) : null}

            <GlobalFeed
              userId={userId ?? ""}
              userZid={userZid ?? undefined}
              zoneId={zone.id}
              zoneName={zone.name}
              hideComposer={!canPost}
            />
          </div>

          {/* ── SIDEBAR ── */}
          <style>{`
            @media (max-width: 768px) {
              .zone-sidebar-about  { display: none !important; }
              .zone-sidebar-owner  { display: none !important; }
            }
          `}</style>
          <div className="zone-sidebar" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* About — hidden on mobile (banner + mobile strip covers it) */}
            {(zone.description || zone.rules) && (
              <details className="zone-sidebar-panel zone-sidebar-about" style={{ background: "rgba(7,12,30,.85)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "14px" }} open>
                <summary>
                  <span>ABOUT THIS ZONE</span>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", opacity: 0.4 }}>▾</span>
                </summary>
                <div className="zone-sidebar-panel-body" style={{ padding: "0 16px 14px" }}>
                  {zone.description && (
                    <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", color: "rgba(255,255,255,.55)", lineHeight: "1.6", margin: "10px 0" }}>
                      {zone.description}
                    </p>
                  )}
                  {zone.rules && (
                    <>
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "8px", color: "rgba(255,255,255,.3)", letterSpacing: "1px", marginBottom: "6px", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "10px" }}>RULES</div>
                      <pre style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.4)", lineHeight: "1.7", margin: 0, whiteSpace: "pre-wrap" }}>{zone.rules}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Members preview */}
            <details className="zone-sidebar-panel" style={{ background: "rgba(7,12,30,.85)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "14px" }} open>
              <summary>
                <span>CREW · {zone.member_count.toLocaleString()}</span>
                <Link href={`/zones/${zone.slug}/members`} onClick={e => e.stopPropagation()} style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: accent, letterSpacing: "1px", textDecoration: "none" }}>
                  SEE ALL →
                </Link>
              </summary>
              <div className="zone-sidebar-panel-body" style={{ padding: "10px 16px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {memberPreview.map((m) => {
                  const u = m.user as any;
                  const avatar = u?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u?.zid}`;
                  return (
                    <div key={u?.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src={avatar} alt="" style={{ width: "26px", height: "26px", borderRadius: "8px", border: "1px solid rgba(255,255,255,.1)", objectFit: "cover", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u?.display_name}
                        </div>
                        <div style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.25)", letterSpacing: "0.5px" }}>
                          @{u?.zid}
                        </div>
                      </div>
                      {m.role !== "member" && (
                        <div style={{ flexShrink: 0, padding: "1px 5px", borderRadius: "4px", background: m.role === "owner" ? `${accent}20` : "rgba(0,229,255,.12)", border: m.role === "owner" ? `1px solid ${accent}40` : "1px solid rgba(0,229,255,.3)", fontFamily: "'VT323',monospace", fontSize: "8px", color: m.role === "owner" ? accent : "#00E5FF", letterSpacing: "0.5px" }}>
                          {m.role.toUpperCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>

            {/* Owner info — hidden on mobile */}
            <details className="zone-sidebar-panel zone-sidebar-owner" style={{ background: "rgba(7,12,30,.85)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "14px" }} open>
              <summary>
                <span>CREATED BY</span>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "12px", opacity: 0.4 }}>▾</span>
              </summary>
              <div className="zone-sidebar-panel-body" style={{ padding: "10px 16px 14px" }}>
                {zone.owner && (
                  <Link href={`/u/${(zone.owner as any).zid}`} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                    <img src={(zone.owner as any).avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${(zone.owner as any).zid}`} alt="" style={{ width: "28px", height: "28px", borderRadius: "8px", border: `1px solid ${accent}30`, objectFit: "cover" }} />
                    <div>
                      <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,.65)" }}>{(zone.owner as any).display_name}</div>
                      <div style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.25)" }}>@{(zone.owner as any).zid}</div>
                    </div>
                  </Link>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
