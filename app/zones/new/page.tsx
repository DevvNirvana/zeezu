"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import ThemeEngine from "@/components/ThemeEngine";
import { createZone, generateZoneSlug } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { Radio, ArrowLeft, Loader2 } from "lucide-react";

const TOPICS = ["general","tech","music","art","gaming","film","writing","fashion","sports","science","random"];
const EMOJIS = ["⚡","🔥","🌙","💫","🎵","🎮","🎨","📡","🛸","💀","🌊","🦋","🔮","👾","🌐","🎭","🧪","🌌","⚔️","🎯"];
const ACCENTS = ["#FF2D87","#00E5FF","#B4FF00","#8A2EFF","#FF9500","#FF007A","#00F7FF","#6BCB77"];

export default function NewZonePage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [iconEmoji, setIconEmoji] = useState("⚡");
  const [accentColor, setAccentColor] = useState("#FF2D87");
  const [topicTag, setTopicTag] = useState("general");
  const [rules, setRules] = useState("");
  const [isNsfw, setIsNsfw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login");
      else setAuthed(true);
    });
  }, [router]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManual && name) {
      const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
      setSlug(base);
    }
  }, [name, slugManual]);

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) { setError("Name and slug are required."); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { setError("Slug can only contain lowercase letters, numbers, and hyphens."); return; }
    setSaving(true);
    setError("");
    const finalSlug = slug + "-" + Math.random().toString(36).slice(2, 6);
    const zone = await createZone({ name: name.trim(), slug: finalSlug, description: description.trim(), icon_emoji: iconEmoji, accent_color: accentColor, topic_tag: topicTag, rules: rules.trim(), is_nsfw: isNsfw });
    if (!zone) { setError("A zone with this name already exists or an error occurred. Try a different name."); setSaving(false); return; }
    router.push(`/zones/${zone.slug}`);
  };

  if (authed === null) return null;

  const inputStyle = { width: "100%", background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontFamily: "'Nunito',sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,.45)", letterSpacing: "1.5px", marginBottom: "6px", display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "#070C1E", color: "#fff", fontFamily: "'Nunito',sans-serif", paddingBottom: "var(--mobile-dock-height)" }}>
      <ThemeEngine config={null} />
      <NavBar />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 16px 0" }}>

        {/* Back */}
        <button onClick={() => router.push("/zones")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "rgba(255,255,255,.4)", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", letterSpacing: "1px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
          <ArrowLeft size={12} /> BACK TO ZONES
        </button>

        {/* Header card */}
        <div style={{ background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <Radio size={18} style={{ color: "#FF2D87", flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "14px", fontWeight: 900, color: "#fff", margin: "0 0 2px 0" }}>CREATE A ZONE</h1>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "12px", color: "rgba(255,255,255,.45)", margin: 0, letterSpacing: "1px" }}>BUILD YOUR COMMUNITY · SET THE SIGNAL</p>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: "rgba(7,12,30,.85)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Emoji + Accent row */}
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>ZONE ICON</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setIconEmoji(e)} style={{ width: "34px", height: "34px", borderRadius: "8px", border: iconEmoji === e ? `1px solid ${accentColor}` : "1px solid rgba(255,255,255,.1)", background: iconEmoji === e ? `${accentColor}20` : "transparent", fontSize: "16px", cursor: "pointer", transition: "all 0.12s" }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>ACCENT</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {ACCENTS.map(c => (
                  <button key={c} onClick={() => setAccentColor(c)} style={{ width: "26px", height: "26px", borderRadius: "50%", background: c, border: accentColor === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", boxShadow: accentColor === c ? `0 0 8px ${c}` : "none", transition: "all 0.12s" }} />
                ))}
              </div>
            </div>
          </div>

          {/* Preview pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "10px", background: `${accentColor}12`, border: `1px solid ${accentColor}30` }}>
            <span style={{ fontSize: "20px", filter: `drop-shadow(0 0 6px ${accentColor}80)` }}>{iconEmoji}</span>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 900, color: "#fff" }}>{name || "Zone Name"}</div>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: accentColor, letterSpacing: "1px" }}>z/{slug || "zone-slug"}</div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>ZONE NAME *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value.slice(0, 50))} placeholder="e.g. Dark Ambient Collective" maxLength={50} />
            <div style={{ textAlign: "right", fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.2)", marginTop: "3px" }}>{name.length}/50</div>
          </div>

          {/* Slug */}
          <div>
            <label style={labelStyle}>URL SLUG * <span style={{ color: "rgba(255,255,255,.2)" }}>(lowercase, hyphens only)</span></label>
            <input style={inputStyle} value={slug} onChange={e => { setSlugManual(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32)); }} placeholder="dark-ambient-collective" />
            <div style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.2)", marginTop: "3px" }}>zeezu.net/zones/{slug || "zone-slug"}</div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} value={description} onChange={e => setDescription(e.target.value.slice(0, 300))} placeholder="What's this zone about?" maxLength={300} />
            <div style={{ textAlign: "right", fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.2)", marginTop: "3px" }}>{description.length}/300</div>
          </div>

          {/* Topic */}
          <div>
            <label style={labelStyle}>TOPIC CATEGORY</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {TOPICS.map(t => (
                <button key={t} onClick={() => setTopicTag(t)} style={{ padding: "4px 10px", borderRadius: "20px", fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px", cursor: "pointer", transition: "all 0.12s", background: topicTag === t ? `${accentColor}20` : "transparent", border: topicTag === t ? `1px solid ${accentColor}55` : "1px solid rgba(255,255,255,.1)", color: topicTag === t ? accentColor : "rgba(255,255,255,.4)" }}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div>
            <label style={labelStyle}>ZONE RULES <span style={{ color: "rgba(255,255,255,.2)" }}>(optional)</span></label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} value={rules} onChange={e => setRules(e.target.value.slice(0, 1000))} placeholder="1. Be excellent to each other&#10;2. No spam" maxLength={1000} />
          </div>

          {/* NSFW toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setIsNsfw(!isNsfw)}
              style={{ width: "38px", height: "20px", borderRadius: "10px", background: isNsfw ? "rgba(255,45,135,.4)" : "rgba(255,255,255,.1)", border: isNsfw ? "1px solid rgba(255,45,135,.6)" : "1px solid rgba(255,255,255,.15)", position: "relative", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
            >
              <span style={{ position: "absolute", top: "2px", left: isNsfw ? "20px" : "2px", width: "14px", height: "14px", borderRadius: "50%", background: isNsfw ? "#FF2D87" : "rgba(255,255,255,.4)", transition: "left 0.15s", display: "block" }} />
            </button>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, color: "rgba(255,255,255,.6)", letterSpacing: "1px" }}>NSFW ZONE</div>
              <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "11px", color: "rgba(255,255,255,.3)" }}>Mark this zone as 18+ content</div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,45,135,.1)", border: "1px solid rgba(255,45,135,.3)", fontFamily: "'Nunito',sans-serif", fontSize: "12px", color: "#FF2D87" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || !slug.trim()}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "10px", background: saving || !name.trim() ? "rgba(255,45,135,.1)" : "rgba(255,45,135,.2)", border: `1px solid rgba(255,45,135,${saving || !name.trim() ? ".15" : ".45"})`, color: saving || !name.trim() ? "rgba(255,45,135,.4)" : "#FF2D87", fontFamily: "'Orbitron',sans-serif", fontSize: "11px", fontWeight: 900, letterSpacing: "1.5px", cursor: saving || !name.trim() ? "not-allowed" : "pointer", transition: "all 0.15s" }}
          >
            {saving ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> CREATING...</> : <><Radio size={13} /> LAUNCH ZONE</>}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
