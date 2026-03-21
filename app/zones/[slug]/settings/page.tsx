"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import ThemeEngine from "@/components/ThemeEngine";
import { getZoneBySlug, getMyZoneMembership, updateZone, deleteZone, type Zone } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Radio, Trash2 } from "lucide-react";
import { confirmModal } from "@/components/ConfirmModal";

const EMOJIS = ["⚡","🔥","🌙","💫","🎵","🎮","🎨","📡","🛸","💀","🌊","🦋","🔮","👾","🌐","🎭","🧪","🌌","⚔️","🎯"];
const ACCENTS = ["#FF2D87","#00E5FF","#B4FF00","#8A2EFF","#FF9500","#FF007A","#00F7FF","#6BCB77"];
const TOPICS = ["general","tech","music","art","gaming","film","writing","fashion","sports","science","random"];

export default function ZoneSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [zone, setZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconEmoji, setIconEmoji] = useState("⚡");
  const [accentColor, setAccentColor] = useState("#FF2D87");
  const [topicTag, setTopicTag] = useState("general");
  const [rules, setRules] = useState("");
  const [isNsfw, setIsNsfw] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    async function init() {
      const [{ data: { user } }, zoneData] = await Promise.all([
        supabase.auth.getUser(),
        getZoneBySlug(slug),
      ]);
      if (!zoneData) { router.replace("/zones"); return; }
      const membership = user ? await getMyZoneMembership(zoneData.id) : null;
      if (!membership || !["owner", "mod"].includes(membership.role)) {
        router.replace(`/zones/${slug}`); return;
      }
      setZone(zoneData);
      setName(zoneData.name);
      setDescription(zoneData.description);
      setIconEmoji(zoneData.icon_emoji);
      setAccentColor(zoneData.accent_color);
      setTopicTag(zoneData.topic_tag);
      setRules(zoneData.rules);
      setIsNsfw(zoneData.is_nsfw);
      setIsLocked(zoneData.is_locked);
      setLoading(false);
    }
    init();
  }, [slug, router]);

  const handleSave = async () => {
    if (!zone || !name.trim()) return;
    setSaving(true); setError("");
    const ok = await updateZone(zone.id, { name: name.trim(), description, icon_emoji: iconEmoji, accent_color: accentColor, topic_tag: topicTag, rules, is_nsfw: isNsfw, is_locked: isLocked });
    if (!ok) setError("Failed to save. Try again.");
    else router.push(`/zones/${zone.slug}`);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!zone || !await confirmModal({ title: "Delete Zone", message: `Permanently delete z/${zone.slug}? All posts and members will be removed. This cannot be undone.`, danger: true, confirmText: "DELETE ZONE" })) return;
    setDeleting(true);
    await deleteZone(zone.id);
    router.push("/zones");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#070C1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ThemeEngine config={null} /><NavBar />
      <Loader2 size={24} style={{ color: "#FF2D87", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!zone) return null;

  const accent = accentColor;
  const inputStyle = { width: "100%", background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontFamily: "'Nunito',sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900 as const, color: "rgba(255,255,255,.4)", letterSpacing: "1.5px", marginBottom: "6px", display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "#070C1E", color: "#fff", fontFamily: "'Nunito',sans-serif", paddingBottom: "var(--mobile-dock-height)" }}>
      <ThemeEngine config={null} />
      <NavBar />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "20px 16px 0" }}>
        <button onClick={() => router.push(`/zones/${slug}`)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "rgba(255,255,255,.35)", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", letterSpacing: "1px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
          <ArrowLeft size={11} /> BACK TO ZONE
        </button>

        <div style={{ background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Radio size={16} style={{ color: "#FF2D87" }} />
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "12px", fontWeight: 900, color: "#fff" }}>ZONE SETTINGS</div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.4)", letterSpacing: "1px" }}>z/{zone.slug}</div>
          </div>
        </div>

        <div style={{ background: "rgba(7,12,30,.85)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Emoji + Accent */}
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>ZONE ICON</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setIconEmoji(e)} style={{ width: "32px", height: "32px", borderRadius: "7px", border: iconEmoji === e ? `1px solid ${accent}` : "1px solid rgba(255,255,255,.1)", background: iconEmoji === e ? `${accent}20` : "transparent", fontSize: "15px", cursor: "pointer", transition: "all 0.12s" }}>{e}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>ACCENT</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {ACCENTS.map(c => (
                  <button key={c} onClick={() => setAccentColor(c)} style={{ width: "24px", height: "24px", borderRadius: "50%", background: c, border: accentColor === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", boxShadow: accentColor === c ? `0 0 6px ${c}` : "none", transition: "all 0.12s" }} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>ZONE NAME</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value.slice(0, 50))} />
          </div>

          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} value={description} onChange={e => setDescription(e.target.value.slice(0, 300))} />
          </div>

          <div>
            <label style={labelStyle}>TOPIC</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {TOPICS.map(t => (
                <button key={t} onClick={() => setTopicTag(t)} style={{ padding: "3px 9px", borderRadius: "20px", fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", cursor: "pointer", background: topicTag === t ? `${accent}20` : "transparent", border: topicTag === t ? `1px solid ${accent}50` : "1px solid rgba(255,255,255,.1)", color: topicTag === t ? accent : "rgba(255,255,255,.4)" }}>{t.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>RULES</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} value={rules} onChange={e => setRules(e.target.value.slice(0, 1000))} />
          </div>

          {/* Toggles */}
          {[
            { key: "nsfw", label: "NSFW ZONE", desc: "Mark as 18+ content", value: isNsfw, set: setIsNsfw },
            { key: "locked", label: "LOCK ZONE", desc: "Prevent new posts (mods can still post)", value: isLocked, set: setIsLocked },
          ].map(({ key, label, desc, value, set }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => set(!value)} style={{ width: "38px", height: "20px", borderRadius: "10px", background: value ? `${accent}40` : "rgba(255,255,255,.1)", border: value ? `1px solid ${accent}60` : "1px solid rgba(255,255,255,.15)", position: "relative", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: "2px", left: value ? "20px" : "2px", width: "14px", height: "14px", borderRadius: "50%", background: value ? accent : "rgba(255,255,255,.4)", transition: "left 0.15s", display: "block" }} />
              </button>
              <div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,.6)", letterSpacing: "1px" }}>{label}</div>
                <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.3)" }}>{desc}</div>
              </div>
            </div>
          ))}

          {error && <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,45,135,.1)", border: "1px solid rgba(255,45,135,.3)", fontFamily: "'Nunito',sans-serif", fontSize: "12px", color: "#FF2D87" }}>{error}</div>}

          <button onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", borderRadius: "10px", background: saving ? "rgba(255,45,135,.08)" : "rgba(255,45,135,.18)", border: `1px solid rgba(255,45,135,${saving ? ".15" : ".4"})`, color: saving ? "rgba(255,45,135,.4)" : "#FF2D87", fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 900, letterSpacing: "1.5px", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> SAVING...</> : "SAVE CHANGES"}
          </button>

          {/* Danger zone */}
          <div style={{ borderTop: "1px solid rgba(255,45,135,.15)", paddingTop: "16px" }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", color: "rgba(255,45,135,.5)", letterSpacing: "1.5px", marginBottom: "10px" }}>DANGER ZONE</div>
            <button onClick={handleDelete} disabled={deleting} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", borderRadius: "9px", background: "rgba(255,45,135,.08)", border: "1px solid rgba(255,45,135,.25)", color: "rgba(255,45,135,.6)", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, letterSpacing: "1px", cursor: deleting ? "not-allowed" : "pointer" }}>
              {deleting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={11} />} DELETE ZONE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
