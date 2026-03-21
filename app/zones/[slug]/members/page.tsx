"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import ThemeEngine from "@/components/ThemeEngine";
import { getZoneBySlug, getZoneMembers, getMyZoneMembership, banUserFromZone, promoteToMod, demoteToMember, type Zone, type ZoneMember } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Shield, UserX, ShieldPlus, ShieldMinus } from "lucide-react";
import Link from "next/link";
import { confirmModal } from "@/components/ConfirmModal";

export default function ZoneMembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [zone, setZone] = useState<Zone | null>(null);
  const [members, setMembers] = useState<ZoneMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<"owner" | "mod" | "member" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [banning, setBanning] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const [{ data: { user } }, zoneData] = await Promise.all([
        supabase.auth.getUser(),
        getZoneBySlug(slug),
      ]);
      if (!zoneData) { router.replace("/zones"); return; }
      setZone(zoneData);
      const [membersData, membership] = await Promise.all([
        getZoneMembers(zoneData.id, 100),
        user ? getMyZoneMembership(zoneData.id) : Promise.resolve(null),
      ]);
      setMembers(membersData);
      setMyRole(membership?.role ?? null);
      setUserId(user?.id ?? null);
      setLoading(false);
    }
    init();
  }, [slug, router]);

  const handlePromote = async (targetUserId: string, currentRole: string, displayName: string) => {
    if (!zone) return;
    const isPromotion = currentRole === "member";
    if (!await confirmModal({ title: isPromotion ? "Promote Member" : "Demote Mod", message: `${isPromotion ? "Promote" : "Demote"} ${displayName} ${isPromotion ? "to mod" : "to member"} in z/${zone.slug}?`, confirmText: isPromotion ? "PROMOTE" : "DEMOTE" })) return;
    setPromoting(targetUserId);
    const ok = isPromotion
      ? await promoteToMod(zone.id, targetUserId)
      : await demoteToMember(zone.id, targetUserId);
    if (ok) {
      setMembers(prev => prev.map(m =>
        (m.user as any)?.id === targetUserId
          ? { ...m, role: isPromotion ? "mod" : "member" }
          : m
      ));
    }
    setPromoting(null);
  };

  const handleBan = async (targetUserId: string, displayName: string) => {
    if (!zone || !await confirmModal({ title: "Ban Member", message: `Ban ${displayName} from z/${zone.slug}?`, danger: true, confirmText: "BAN" })) return;
    const reason = "";
    setBanning(targetUserId);
    await banUserFromZone(zone.id, targetUserId, reason);
    setMembers(prev => prev.filter(m => (m.user as any)?.id !== targetUserId));
    setBanning(null);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#070C1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ThemeEngine config={null} /><NavBar />
      <Loader2 size={24} style={{ color: "#FF2D87", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!zone) return null;

  const accent = zone.accent_color || "#FF2D87";
  const isOwnerOrMod = myRole === "owner" || myRole === "mod";

  return (
    <div style={{ minHeight: "100vh", background: "#070C1E", color: "#fff", fontFamily: "'Nunito',sans-serif", paddingBottom: "var(--mobile-dock-height)" }}>
      <ThemeEngine config={null} />
      <NavBar />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 16px 0" }}>
        <button onClick={() => router.push(`/zones/${slug}`)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "rgba(255,255,255,.35)", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", letterSpacing: "1px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
          <ArrowLeft size={11} /> BACK TO ZONE
        </button>

        <div style={{ background: "rgba(7,12,30,.85)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>{zone.icon_emoji}</span>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 900, color: "#fff" }}>z/{zone.slug} CREW</div>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.35)", letterSpacing: "1px" }}>{members.length} MEMBERS</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {members.map((m) => {
              const u = m.user as any;
              const avatar = u?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u?.zid}`;
              const isSelf = u?.id === userId;
              return (
                <div key={u?.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <Link href={`/u/${u?.zid}`} style={{ flexShrink: 0 }}>
                    <img src={avatar} alt="" style={{ width: "32px", height: "32px", borderRadius: "9px", border: `1px solid ${m.role !== "member" ? accent : "rgba(255,255,255,.1)"}`, objectFit: "cover" }} />
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/u/${u?.zid}`} style={{ textDecoration: "none" }}>
                      <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,.75)" }}>{u?.display_name}</div>
                    </Link>
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.25)", letterSpacing: "0.5px" }}>@{u?.zid}</div>
                  </div>
                  {m.role !== "member" && (
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px", padding: "2px 7px", borderRadius: "6px", background: m.role === "owner" ? `${accent}18` : "rgba(0,229,255,.1)", border: m.role === "owner" ? `1px solid ${accent}35` : "1px solid rgba(0,229,255,.25)" }}>
                      <Shield size={9} style={{ color: m.role === "owner" ? accent : "#00E5FF" }} />
                      <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: m.role === "owner" ? accent : "#00E5FF", letterSpacing: "0.5px" }}>{m.role.toUpperCase()}</span>
                    </div>
                  )}
                  {isOwnerOrMod && !isSelf && m.role !== "owner" && (
                    <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                      {/* Promote/demote — owner only */}
                      {myRole === "owner" && (
                        <button
                          onClick={() => handlePromote(u?.id, m.role, u?.display_name)}
                          disabled={promoting === u?.id}
                          title={m.role === "member" ? "Promote to mod" : "Demote to member"}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "7px", background: "transparent", border: `1px solid ${m.role === "member" ? "rgba(0,229,255,.2)" : "rgba(255,149,0,.2)"}`, color: m.role === "member" ? "rgba(0,229,255,.5)" : "rgba(255,149,0,.5)", fontFamily: "'VT323',monospace", fontSize: "9px", letterSpacing: "0.5px", cursor: "pointer", transition: "all 0.12s" }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = m.role === "member" ? "rgba(0,229,255,.1)" : "rgba(255,149,0,.1)"; el.style.color = m.role === "member" ? "#00E5FF" : "#FF9500"; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "transparent"; el.style.color = m.role === "member" ? "rgba(0,229,255,.5)" : "rgba(255,149,0,.5)"; }}
                        >
                          {promoting === u?.id
                            ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />
                            : m.role === "member" ? <ShieldPlus size={9} /> : <ShieldMinus size={9} />
                          }
                          {m.role === "member" ? "MOD" : "DEMOTE"}
                        </button>
                      )}
                      {/* Ban — owner and mods */}
                      <button
                        onClick={() => handleBan(u?.id, u?.display_name)}
                        disabled={banning === u?.id}
                        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "7px", background: "transparent", border: "1px solid rgba(255,45,135,.2)", color: "rgba(255,45,135,.5)", fontFamily: "'VT323',monospace", fontSize: "9px", letterSpacing: "0.5px", cursor: "pointer", transition: "all 0.12s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,45,135,.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#FF2D87"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,45,135,.5)"; }}
                      >
                        {banning === u?.id ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : <UserX size={9} />} BAN
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
