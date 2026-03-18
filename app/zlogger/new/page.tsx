"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { createZlog } from "@/lib/supabase/queries";
import { renderZlog, generateSlug, readingTimeMinutes, ZLOG_CSS } from "@/lib/zlogger-renderer";
import { Zap, Waves, Bookmark, RefreshCw, Eye, Edit3, Loader2 } from "lucide-react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');
  body, html { overflow-x: hidden !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  textarea:focus, input:focus { outline: none; }
  .editor-textarea { resize: none; }
  .z-tag-btn { transition: all .15s ease; }
  .z-tag-btn:hover { opacity: .8; }
`;

const THEMES = ["void_chrome", "neon_vapor", "midnight_run", "candy_chrome", "arctic_ghost"] as const;
const THEME_LABELS: Record<string, string> = {
  void_chrome:  "VOID CHROME",
  neon_vapor:   "NEON VAPOR",
  midnight_run: "MIDNIGHT RUN",
  candy_chrome: "CANDY CHROME",
  arctic_ghost: "ARCTIC GHOST",
};

const MOODS = [
  "💀 Dark", "🔥 Lit", "💜 Vibe", "🌊 Chill",
  "⚡ Charged", "🌹 Romantic", "🤖 Glitch", "🌙 Dreamy",
];

const VISIBILITY_OPTIONS = ["public", "friends", "private"] as const;

const Z_TAGS = [
  { label: "NEON",    open: "[z-neon]",    close: "[/z-neon]" },
  { label: "GLITCH",  open: "[z-glitch]",  close: "[/z-glitch]" },
  { label: "BLINK",   open: "[z-blink]",   close: "[/z-blink]" },
  { label: "MARQUEE", open: "[z-marquee]", close: "[/z-marquee]" },
  { label: "DIVIDER", open: "[z-divider]", close: "" },
  { label: "TRACK",   open: "[z-track]",   close: "[/z-track]" },
];

function insertAtCursor(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  open: string,
  close: string,
  setter: (v: string) => void
) {
  const ta = ref.current;
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const val = ta.value;
  const selected = val.slice(start, end);
  const newVal = val.slice(0, start) + open + selected + close + val.slice(end);
  setter(newVal);
  setTimeout(() => {
    ta.focus();
    const cursor = start + open.length + selected.length + close.length;
    ta.setSelectionRange(cursor, cursor);
  }, 0);
}

export default function ZloggerNewPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [theme, setTheme] = useState("void_chrome");
  const [mood, setMood] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [notifyCore8, setNotifyCore8] = useState(false);
  const [notifyFriends, setNotifyFriends] = useState(false);
  const [shareToZeewall, setShareToZeewall] = useState(false);
  const [responseToSlug, setResponseToSlug] = useState("");
  const [responseToId, setResponseToId] = useState<string | undefined>(undefined);
  const [publishing, setPublishing] = useState(false);
  const [primary] = useState("#8A2EFF");

  // Auto-slug from title
  useEffect(() => {
    if (!slugManual && title) setSlug(generateSlug(title));
  }, [title, slugManual]);

  // Live preview
  useEffect(() => {
    setPreviewHtml(renderZlog(markdown));
  }, [markdown]);

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const readTime = readingTimeMinutes(markdown);

  const handlePublish = async () => {
    if (!title.trim() || !markdown.trim()) return;
    setPublishing(true);
    const result = await createZlog({
      title: title.trim(),
      slug: slug || generateSlug(title),
      content_markdown: markdown,
      content_html: previewHtml,
      cover_image_url: coverUrl || undefined,
      theme,
      mood: mood || undefined,
      is_anonymous: isAnonymous,
      visibility,
      notify_core8: notifyCore8,
      notify_friends: notifyFriends,
      share_to_zeewall: shareToZeewall,
      response_to: responseToId,
    });
    setPublishing(false);
    if (result) router.push(`/zlogger/${result.slug}`);
  };

  const inputStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: "100%", padding: "10px 14px", background: "rgba(138,46,255,.07)",
    border: `1px solid ${primary}30`, borderRadius: "8px", color: "#fff",
    fontFamily: "'Nunito',sans-serif", fontSize: "13px", outline: "none",
    boxSizing: "border-box", ...extra,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0B0B12", color: "#fff", fontFamily: "'Nunito',sans-serif", paddingBottom: "80px" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES + ZLOG_CSS }} />
      <NavBar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "72px 16px 0" }}>
        {/* Title + slug */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="TITLE OF YOUR ZLOG..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ ...inputStyle({ fontSize: "20px", fontFamily: "'Orbitron',sans-serif", fontWeight: 900, marginBottom: "8px" }) }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: `${primary}60`, letterSpacing: "1px", whiteSpace: "nowrap" }}>SLUG:</span>
            <input
              type="text"
              placeholder="auto-generated-slug"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
              style={{ ...inputStyle({ fontSize: "11px", fontFamily: "'VT323',monospace", letterSpacing: "1px", flex: 1 }) }}
            />
            <button
              onClick={() => { setSlug(generateSlug(title)); setSlugManual(false); }}
              title="Regenerate slug"
              style={{ padding: "10px", background: `${primary}18`, border: `1px solid ${primary}30`, borderRadius: "8px", cursor: "pointer", color: primary, display: "flex", alignItems: "center" }}
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Two-column editor/preview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          {/* ── EDITOR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {/* Module header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: `${primary}18`, borderRadius: "10px 10px 0 0", border: `1px solid ${primary}30`, borderBottom: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Edit3 size={11} color={primary} />
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, color: primary, letterSpacing: "1px" }}>EDITOR</span>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}60` }}>· {wordCount} WORDS</span>
              </div>
            </div>

            {/* Z-tag toolbar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "8px 10px", background: "rgba(0,0,0,.3)", border: `1px solid ${primary}20`, borderBottom: "none" }}>
              {Z_TAGS.map(tag => (
                <button
                  key={tag.label}
                  className="z-tag-btn"
                  onClick={() => insertAtCursor(textareaRef, tag.open, tag.close, setMarkdown)}
                  style={{
                    padding: "3px 8px", borderRadius: "4px",
                    background: `${primary}18`, border: `1px solid ${primary}35`,
                    color: primary, fontFamily: "'VT323',monospace",
                    fontSize: "10px", letterSpacing: "1px", cursor: "pointer",
                  }}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={markdown}
              onChange={e => setMarkdown(e.target.value)}
              placeholder={"# Your story begins here...\n\nUse **markdown** or Z-tags like [z-neon]glowing text[/z-neon]"}
              style={{
                flex: 1, minHeight: "55vh", padding: "14px",
                background: "rgba(8,14,36,.85)", border: `1px solid ${primary}25`,
                borderRadius: "0 0 10px 10px", color: "rgba(255,255,255,.85)",
                fontFamily: "'Courier New', monospace", fontSize: "13px", lineHeight: "1.7",
                resize: "none", outline: "none",
              }}
            />
          </div>

          {/* ── PREVIEW ── */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "rgba(0,247,255,.08)", borderRadius: "10px 10px 0 0", border: "1px solid rgba(0,247,255,.2)", borderBottom: "none" }}>
              <Eye size={11} color="#00F7FF" />
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700, color: "#00F7FF", letterSpacing: "1px" }}>PREVIEW</span>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(0,247,255,.5)" }}>· ~{readTime} MIN READ</span>
            </div>
            <div
              className="zlog-body"
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p style="color:rgba(255,255,255,.2);font-style:italic;font-family:Nunito,sans-serif;font-size:13px">Preview will appear here…</p>' }}
              style={{
                flex: 1, minHeight: "55vh", padding: "14px",
                background: "rgba(4,8,20,.9)", border: "1px solid rgba(0,247,255,.15)",
                borderRadius: "0 0 10px 10px", overflowY: "auto",
              }}
            />
          </div>
        </div>

        {/* ── Settings ── */}
        <div style={{ background: "rgba(8,14,36,.8)", border: `1px solid ${primary}22`, borderRadius: "14px", padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: primary, letterSpacing: "2px", margin: "0 0 16px" }}>PUBLISHING SETTINGS</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Cover URL */}
            <div>
              <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.4)", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>COVER IMAGE URL</label>
              <input type="text" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." style={inputStyle()} />
            </div>

            {/* Mood */}
            <div>
              <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.4)", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>MOOD</label>
              <select value={mood} onChange={e => setMood(e.target.value)} style={{ ...inputStyle(), appearance: "none" }}>
                <option value="">None</option>
                {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Theme */}
            <div>
              <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.4)", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>THEME</label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {THEMES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      padding: "5px 10px", borderRadius: "6px",
                      background: theme === t ? `${primary}25` : "rgba(255,255,255,.04)",
                      border: `1px solid ${theme === t ? primary : "rgba(255,255,255,.1)"}`,
                      color: theme === t ? primary : "rgba(255,255,255,.45)",
                      fontFamily: "'VT323',monospace", fontSize: "9px", letterSpacing: "1px", cursor: "pointer",
                    }}
                  >
                    {THEME_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.4)", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>VISIBILITY</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {VISIBILITY_OPTIONS.map(v => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    style={{
                      flex: 1, padding: "8px 6px", borderRadius: "6px",
                      background: visibility === v ? `${primary}22` : "rgba(255,255,255,.04)",
                      border: `1px solid ${visibility === v ? primary : "rgba(255,255,255,.1)"}`,
                      color: visibility === v ? primary : "rgba(255,255,255,.4)",
                      fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", cursor: "pointer",
                    }}
                  >
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
            {[
              { label: "ANONYMOUS", val: isAnonymous, set: setIsAnonymous, icon: <span>👤</span> },
              { label: "NOTIFY CORE 8", val: notifyCore8, set: setNotifyCore8, icon: <Zap size={11} /> },
              { label: "NOTIFY FRIENDS", val: notifyFriends, set: setNotifyFriends, icon: <Waves size={11} /> },
              { label: "SHARE TO ZEEWALL", val: shareToZeewall, set: setShareToZeewall, icon: <Bookmark size={11} /> },
            ].map(({ label, val, set, icon }) => (
              <button
                key={label}
                onClick={() => set(!val)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", borderRadius: "6px",
                  background: val ? `${primary}20` : "rgba(255,255,255,.03)",
                  border: `1px solid ${val ? primary : "rgba(255,255,255,.1)"}`,
                  color: val ? primary : "rgba(255,255,255,.35)",
                  fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px", cursor: "pointer",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Response-to */}
          <div style={{ marginTop: "16px" }}>
            <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.4)", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>RESPONSE TO (slug)</label>
            <input
              type="text"
              value={responseToSlug}
              onChange={e => setResponseToSlug(e.target.value)}
              onBlur={async () => {
                if (!responseToSlug.trim()) { setResponseToId(undefined); return; }
                const { data } = await (await import("@/lib/supabase/client")).supabase
                  .from("zlogs").select("id").eq("slug", responseToSlug.trim()).single();
                if (data?.id) setResponseToId(data.id);
                else setResponseToId(undefined);
              }}
              placeholder="responding-to-this-post-slug"
              style={inputStyle()}
            />
            {responseToId && <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#B4FF00", margin: "4px 0 0", letterSpacing: "1px" }}>✓ FOUND</p>}
          </div>
        </div>

        {/* ── Publish / Draft buttons ── */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: "12px 24px", borderRadius: "8px",
              background: "transparent", border: "1px solid rgba(255,255,255,.15)",
              color: "rgba(255,255,255,.5)", fontFamily: "'Orbitron',sans-serif",
              fontSize: "9px", fontWeight: 700, letterSpacing: "1px", cursor: "pointer",
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !title.trim() || !markdown.trim()}
            style={{
              padding: "12px 28px", borderRadius: "8px",
              background: publishing || !title.trim() || !markdown.trim()
                ? "rgba(138,46,255,.3)"
                : `linear-gradient(135deg, ${primary}, #00F7FF)`,
              border: "none", color: "#000",
              fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700,
              letterSpacing: "1px", cursor: publishing ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              opacity: !title.trim() || !markdown.trim() ? 0.5 : 1,
            }}
          >
            {publishing ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {publishing ? "PUBLISHING..." : "PUBLISH ZLOG"}
          </button>
        </div>
      </div>
    </div>
  );
}
