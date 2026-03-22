"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { createZlog } from "@/lib/supabase/queries";
import { renderZlog, generateSlug, readingTimeMinutes, ZLOG_CSS } from "@/lib/zlogger-renderer";
import {
  Zap, Waves, Bookmark, RefreshCw, Eye, Edit3, Loader2,
  ArrowLeft, Globe, Users, Lock, Image as ImageIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES — injected once
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');

  body, html { overflow-x: hidden !important; }

  @keyframes spin        { to{transform:rotate(360deg)} }
  @keyframes zee-entry   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes zee-led     { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes zee-blink   { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes zee-scanbar { 0%{transform:translateY(-100%);opacity:.55} 100%{transform:translateY(300%);opacity:0} }
  @keyframes zee-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
  @keyframes zee-pulse   { 0%,100%{box-shadow:0 0 4px rgba(255,45,135,.5)} 50%{box-shadow:0 0 16px rgba(255,45,135,.9),0 0 32px rgba(255,45,135,.3)} }
  @keyframes caret-blink { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} }

  .zee-entry { animation: zee-entry .32s ease both; }
  .zee-led   { animation: zee-led 2.4s ease-in-out infinite; }
  .zee-cursor::after { content:"▌"; animation:zee-blink .85s step-end infinite; color:inherit; opacity:.65; }

  /* textarea / input focus glow */
  textarea:focus, input:focus, select:focus { outline: none; }

  /* Z-tag toolbar buttons */
  .z-tag-btn {
    transition: all .14s ease;
    position: relative; overflow: hidden;
  }
  .z-tag-btn::before {
    content:""; position:absolute; inset:0;
    background:linear-gradient(180deg,rgba(255,255,255,.07) 0%,transparent 100%);
    transform:translateY(-100%); pointer-events:none; opacity:0;
  }
  .z-tag-btn:hover::before { opacity:1; animation:zee-scanbar 1.6s ease-in infinite; }
  .z-tag-btn:hover { opacity:.88; box-shadow:0 0 8px rgba(255,45,135,.35); }

  /* Editor textarea — monospace feel */
  .editor-ta {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    line-height: 1.75;
    resize: none;
    tab-size: 2;
    caret-color: #FF2D87;
  }

  /* Toggle pill hover */
  .toggle-btn { transition: all .15s ease; }
  .toggle-btn:hover { filter: brightness(1.1); }

  /* Theme swatch hover */
  .theme-btn { transition: all .15s ease; }
  .theme-btn:hover { transform: translateY(-1px); }

  /* Visibility btn */
  .vis-btn { transition: all .15s ease; }
  .vis-btn:hover { filter: brightness(1.08); }

  /* Publish button glow on hover */
  .publish-btn { transition: all .2s ease; }
  .publish-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 24px rgba(255,45,135,.5), 0 0 40px rgba(0,229,255,.2) !important;
  }

  /* Mobile: stack editor/preview */
  @media (max-width: 860px) {
    .editor-grid { grid-template-columns: 1fr !important; }
    .settings-grid { grid-template-columns: 1fr !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    .zee-led, .z-tag-btn::before, .zee-entry { animation: none !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS — unchanged
// ─────────────────────────────────────────────────────────────────────────────

const THEMES = ["void_chrome", "neon_vapor", "midnight_run", "candy_chrome", "arctic_ghost"] as const;
const THEME_META: Record<string, { label: string; color: string; bg: string }> = {
  void_chrome: { label: "VOID", color: "#FF2D87", bg: "rgba(255,45,135,.2)" },
  neon_vapor: { label: "VAPOR", color: "#FF007A", bg: "rgba(255,0,122,.2)" },
  midnight_run: { label: "MIDNIGHT", color: "#00E5FF", bg: "rgba(0,229,255,.2)" },
  candy_chrome: { label: "CANDY", color: "#FF6B9D", bg: "rgba(255,107,157,.2)" },
  arctic_ghost: { label: "ARCTIC", color: "#A5F3FC", bg: "rgba(165,243,252,.2)" },
};

const MOODS = [
  { val: "💀 Dark", emoji: "💀", color: "#9333EA" },
  { val: "🔥 Lit", emoji: "🔥", color: "#EF4444" },
  { val: "💜 Vibe", emoji: "💜", color: "#FF2D87" },
  { val: "🌊 Chill", emoji: "🌊", color: "#0EA5E9" },
  { val: "⚡ Charged", emoji: "⚡", color: "#EAB308" },
  { val: "🌹 Romantic", emoji: "🌹", color: "#EC4899" },
  { val: "🤖 Glitch", emoji: "🤖", color: "#10B981" },
  { val: "🌙 Dreamy", emoji: "🌙", color: "#6366F1" },
];

const VISIBILITY_OPTIONS = ["public", "friends", "private"] as const;
const VIS_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  public: { icon: <Globe size={11} />, label: "PUBLIC", color: "#B4FF00" },
  friends: { icon: <Users size={11} />, label: "FRIENDS", color: "#00E5FF" },
  private: { icon: <Lock size={11} />, label: "PRIVATE", color: "#FF2D87" },
};

const Z_TAGS = [
  { label: "NEON", open: "[z-neon]", close: "[/z-neon]", tip: "Glowing neon text" },
  { label: "GLITCH", open: "[z-glitch]", close: "[/z-glitch]", tip: "Glitch distortion" },
  { label: "BLINK", open: "[z-blink]", close: "[/z-blink]", tip: "Blinking text" },
  { label: "MARQUEE", open: "[z-marquee]", close: "[/z-marquee]", tip: "Scrolling ticker text" },
  { label: "DIVIDER", open: "[z-divider]", close: "", tip: "Section separator" },
  { label: "TRACK", open: "[z-track]", close: "[/z-track]", tip: "Music track embed" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS — unchanged
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED PORTAL UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function PortalCard({ children, accent = "rgba(255,45,135,.22)", style }: {
  children: React.ReactNode; accent?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "rgba(10,16,42,.92)", backdropFilter: "blur(14px)",
      border: `1px solid ${accent}`, borderRadius: "12px", overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function ModuleHeader({ icon, title, accent = "#FF2D87", right }: {
  icon: React.ReactNode; title: string; accent?: string; right?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 14px 9px 12px",
      background: `linear-gradient(90deg,${accent}22 0%,transparent 100%)`,
      borderBottom: `1px solid ${accent}30`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <div className="zee-led" style={{ width: "3px", height: "16px", background: `linear-gradient(180deg,${accent},${accent}44)`, borderRadius: "1px", flexShrink: 0, boxShadow: `0 0 6px ${accent}` }} />
        <span style={{ color: accent, display: "flex", alignItems: "center" }}>{icon}</span>
        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.8px" }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DRAFT AUTOSAVE
// ─────────────────────────────────────────────────────────────────────────────

const DRAFT_KEY = "zlog_draft_v1";

interface ZlogDraft {
  title: string;
  slug: string;
  slugManual: boolean;
  markdown: string;
  coverUrl: string;
  theme: string;
  mood: string;
  visibility: "public" | "friends" | "private";
  isAnonymous: boolean;
  notifyCore8: boolean;
  notifyFriends: boolean;
  shareToZeewall: boolean;
  savedAt: number;
}

function saveDraft(draft: ZlogDraft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* storage full */ }
}

function loadDraft(): ZlogDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT — all Supabase logic UNCHANGED
// ─────────────────────────────────────────────────────────────────────────────

export default function ZloggerNewPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── State — ALL UNCHANGED ──────────────────────────────────────
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
  const [responseToTitle, setResponseToTitle] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // ── Draft autosave ────────────────────────────────────────────
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [draftPreview, setDraftPreview] = useState<{ title: string; savedAt: number } | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const primary = "#FF2D87";
  const secondary = "#00E5FF";

  // ── Auto-slug — UNCHANGED ─────────────────────────────────────
  useEffect(() => {
    if (!slugManual && title) setSlug(generateSlug(title));
  }, [title, slugManual]);

  // ── Live preview — UNCHANGED ──────────────────────────────────
  useEffect(() => {
    setPreviewHtml(renderZlog(markdown));
  }, [markdown]);

  // ── Check for saved draft on mount ───────────────────────────
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.title || draft.markdown)) {
      setShowRestoreBanner(true);
      setDraftPreview({ title: draft.title, savedAt: draft.savedAt });
    }
  }, []);

  // ── Autosave — debounced 2s after any content change ─────────
  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      const draft: ZlogDraft = {
        title, slug, slugManual, markdown, coverUrl, theme, mood,
        visibility, isAnonymous, notifyCore8, notifyFriends, shareToZeewall,
        savedAt: Date.now(),
      };
      saveDraft(draft);
      setDraftSavedAt(Date.now());
    }, 2000);
  }, [title, slug, slugManual, markdown, coverUrl, theme, mood, visibility, isAnonymous, notifyCore8, notifyFriends, shareToZeewall]);

  useEffect(() => {
    if (title || markdown) scheduleAutosave();
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [title, markdown, coverUrl, theme, mood, visibility, isAnonymous, notifyCore8, notifyFriends, shareToZeewall, scheduleAutosave]);

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (!draft) return;
    setTitle(draft.title);
    setSlug(draft.slug);
    setSlugManual(draft.slugManual);
    setMarkdown(draft.markdown);
    setCoverUrl(draft.coverUrl);
    setTheme(draft.theme);
    setMood(draft.mood);
    setVisibility(draft.visibility);
    setIsAnonymous(draft.isAnonymous);
    setNotifyCore8(draft.notifyCore8);
    setNotifyFriends(draft.notifyFriends);
    setShareToZeewall(draft.shareToZeewall);
    setDraftSavedAt(draft.savedAt);
    setShowRestoreBanner(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowRestoreBanner(false);
  };

  // ── Pre-fill response_to from ?to=SLUG query param ────────────
  useEffect(() => {
    const toSlug = new URLSearchParams(window.location.search).get("to");
    if (!toSlug) return;
    setResponseToSlug(toSlug);
    import("@/lib/supabase/client").then(({ supabase }) => {
      supabase.from("zlogs").select("id, title").eq("slug", toSlug).single()
        .then(({ data }) => {
          if (data) { setResponseToId(data.id); setResponseToTitle(data.title); }
        });
    });
  }, []);

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;
  const readTime = readingTimeMinutes(markdown);

  // ── handlePublish — UNCHANGED ─────────────────────────────────
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
    if (result) { clearDraft(); router.push(`/zlogger/${result.slug}`); }
  };

  // ── Active mood meta ──────────────────────────────────────────
  const activeMood = MOODS.find(m => m.val === mood);

  // ─────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070C1E",
      backgroundImage: `
        radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,45,135,.12) 0%, transparent 60%),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='.65' fill='rgba(255,255,255,.04)'/%3E%3C/svg%3E")
      `,
      color: "#fff",
      fontFamily: "'Nunito',sans-serif",
      paddingBottom: "80px",
    }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES + ZLOG_CSS }} />

      {/* CRT scanline overlay */}
      <div aria-hidden="true" style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 999, opacity: 0.028, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.45) 2px,rgba(0,0,0,.45) 4px)" }} />

      <NavBar />

      {/* ── Restore draft banner ── */}
      {showRestoreBanner && (
        <div style={{
          position: "fixed", top: "64px", left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, width: "min(520px, calc(100vw - 32px))",
          background: "rgba(10,16,42,.97)", border: "1px solid rgba(255,45,135,.4)",
          borderRadius: "10px", padding: "12px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,.6), 0 0 20px rgba(255,45,135,.15)",
          display: "flex", alignItems: "center", gap: "12px",
          backdropFilter: "blur(12px)",
        }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>📝</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, color: "#FF2D87", letterSpacing: "1px", marginBottom: "2px" }}>UNSAVED DRAFT FOUND</div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.4)", letterSpacing: "1px" }}>
              {draftPreview ? `"${draftPreview.title || "Untitled"}" · saved ${timeAgo(draftPreview.savedAt)}` : ""}
            </div>
          </div>
          <button
            onClick={handleRestoreDraft}
            style={{ padding: "6px 14px", borderRadius: "6px", background: "rgba(255,45,135,.2)", border: "1px solid rgba(255,45,135,.5)", color: "#FF2D87", fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer", flexShrink: 0 }}
          >
            RESTORE
          </button>
          <button
            onClick={handleDiscardDraft}
            style={{ padding: "6px 14px", borderRadius: "6px", background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.35)", fontFamily: "'Orbitron',sans-serif", fontSize: "8px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer", flexShrink: 0 }}
          >
            DISCARD
          </button>
        </div>
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 16px 0" }}>

        {/* ════════════════════════════════════════════════════════
            PAGE HEADER — Y2K portal title bar
        ════════════════════════════════════════════════════════ */}
        <PortalCard accent={`${primary}30`} style={{ marginBottom: "20px" }}>
          <div style={{
            background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)",
            padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "10px",
            position: "relative", overflow: "hidden",
            borderBottom: "1px solid rgba(255,255,255,.07)",
          }}>
            {/* Scanlines on header */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 4px)", pointerEvents: "none" }} />
            {/* Corner glow */}
            <div aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "100%", background: "radial-gradient(ellipse at 100% 50%,rgba(0,229,255,.14) 0%,transparent 60%)", pointerEvents: "none" }} />

            {/* Left — back + title */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
              <button
                onClick={() => router.push("/zlogger")}
                style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.5)", fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px", cursor: "pointer", flexShrink: 0 }}
              >
                <ArrowLeft size={11} /> BACK
              </button>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "16px", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.3px", textShadow: "0 0 20px rgba(255,45,135,.4)" }}>
                    NEW ZLOG
                  </h1>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "2px", background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "3px", padding: "1px 6px" }}>
                    COMPOSE
                  </span>
                </div>
                <p style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.4)", letterSpacing: "1.5px", margin: "2px 0 0" }}>
                  ZEEZU NETWORK · PERSONAL WEBLOG
                </p>
              </div>
            </div>

            {/* Right — publish button */}
            <button
              className="publish-btn"
              onClick={handlePublish}
              disabled={publishing || !title.trim() || !markdown.trim()}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "9px 20px", borderRadius: "8px",
                background: publishing || !title.trim() || !markdown.trim()
                  ? "rgba(255,45,135,.25)"
                  : "linear-gradient(135deg,#FF2D87 0%,#00E5FF 100%)",
                border: "none",
                color: publishing || !title.trim() || !markdown.trim() ? "rgba(255,255,255,.3)" : "#000",
                fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700,
                letterSpacing: "1px",
                cursor: publishing ? "wait" : (!title.trim() || !markdown.trim()) ? "not-allowed" : "pointer",
                boxShadow: !publishing && title.trim() && markdown.trim() ? "0 0 20px rgba(255,45,135,.45)" : "none",
                zIndex: 1, flexShrink: 0,
              }}
            >
              {publishing
                ? <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> PUBLISHING...</>
                : <>⊕ PUBLISH ZLOG</>
              }
            </button>
          </div>
        </PortalCard>

        {/* ── Responding-to banner (shown when launched via ?to=slug) ── */}
        {responseToId && responseToTitle && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", marginBottom: "14px", background: `${primary}0a`, border: `1px solid ${primary}30`, borderRadius: "8px" }}>
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}80`, letterSpacing: "1.5px", flexShrink: 0 }}>↩ RESPONDING TO:</span>
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "10px", fontWeight: 700, color: primary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{responseToTitle}</span>
            <button onClick={() => { setResponseToId(undefined); setResponseToTitle(null); setResponseToSlug(""); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,.3)", cursor: "pointer", fontSize: "14px", lineHeight: 1, flexShrink: 0, padding: "0 2px" }}>✕</button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TITLE + SLUG ROW
        ════════════════════════════════════════════════════════ */}
        <PortalCard accent={`${primary}22`} style={{ marginBottom: "16px" }}>
          <ModuleHeader
            icon={<Edit3 size={11} />}
            title="TITLE & SLUG"
            accent={primary}
            right={
              title
                ? <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}55`, letterSpacing: "1px" }}>
                  {title.length} CHARS
                </span>
                : undefined
            }
          />
          <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Title — large Orbitron input */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="TITLE OF YOUR ZLOG..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "rgba(255,45,135,.07)",
                  border: `1px solid ${title ? `${primary}45` : `${primary}25`}`,
                  borderRadius: "8px", color: "#fff",
                  fontFamily: "'Orbitron',sans-serif", fontSize: "17px", fontWeight: 900,
                  letterSpacing: "-0.5px",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color .2s, box-shadow .2s",
                  boxShadow: title ? `0 0 16px ${primary}18` : "none",
                }}
                onFocus={e => { e.target.style.borderColor = `${primary}70`; e.target.style.boxShadow = `0 0 20px ${primary}22`; }}
                onBlur={e => { e.target.style.borderColor = title ? `${primary}45` : `${primary}25`; e.target.style.boxShadow = title ? `0 0 16px ${primary}18` : "none"; }}
              />
              {/* Mood color accent if mood selected */}
              {activeMood && (
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", borderRadius: "8px 0 0 8px", background: activeMood.color, boxShadow: `0 0 8px ${activeMood.color}` }} />
              )}
            </div>

            {/* Slug row */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: `${primary}55`, letterSpacing: "1.5px", whiteSpace: "nowrap", flexShrink: 0 }}>
                zeezu.net/zlogger/
              </span>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="text"
                  placeholder="auto-generated-slug"
                  value={slug}
                  onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                  style={{
                    width: "100%", padding: "7px 36px 7px 10px",
                    background: "rgba(0,0,0,.35)",
                    border: `1px solid rgba(255,255,255,.1)`,
                    borderRadius: "6px", color: "rgba(255,255,255,.55)",
                    fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1.5px",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color .2s",
                  }}
                  onFocus={e => e.target.style.borderColor = `${primary}45`}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
                />
                <button
                  onClick={() => { setSlug(generateSlug(title)); setSlugManual(false); }}
                  title="Regenerate slug"
                  style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", padding: "3px 4px", background: "transparent", border: "none", color: `${primary}55`, cursor: "pointer", display: "flex", alignItems: "center", transition: "color .15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = primary}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = `${primary}55`}
                >
                  <RefreshCw size={10} />
                </button>
              </div>
            </div>
          </div>
        </PortalCard>

        {/* ════════════════════════════════════════════════════════
            EDITOR + PREVIEW GRID
        ════════════════════════════════════════════════════════ */}
        <div
          className="editor-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}
        >
          {/* ── EDITOR PANEL ── */}
          <PortalCard accent={`${primary}28`} style={{ display: "flex", flexDirection: "column" }}>
            <ModuleHeader
              icon={<Edit3 size={11} />}
              title="EDITOR"
              accent={primary}
              right={
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {draftSavedAt && (
                    <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#B4FF0070", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#B4FF00", boxShadow: "0 0 5px #B4FF00", display: "inline-block", flexShrink: 0 }} />
                      DRAFT SAVED · {timeAgo(draftSavedAt)}
                    </span>
                  )}
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}55`, letterSpacing: "1px" }}>
                    {wordCount} WORDS
                  </span>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.2)", letterSpacing: "1px" }}>
                    {charCount} CHARS
                  </span>
                </div>
              }
            />

            {/* Z-tag toolbar — Y2K custom tag buttons */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "4px",
              padding: "8px 12px",
              background: "rgba(0,0,0,.35)",
              borderBottom: `1px solid ${primary}18`,
            }}>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: "9px", color: "rgba(255,255,255,.2)", letterSpacing: "1px", alignSelf: "center", marginRight: "4px" }}>Z-TAGS:</span>
              {Z_TAGS.map(tag => (
                <button
                  key={tag.label}
                  className="z-tag-btn"
                  onClick={() => insertAtCursor(textareaRef, tag.open, tag.close, setMarkdown)}
                  title={tag.tip}
                  style={{
                    padding: "3px 9px", borderRadius: "4px",
                    background: `${primary}14`,
                    border: `1px solid ${primary}30`,
                    color: primary,
                    fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                    cursor: "pointer",
                  }}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Textarea — monospace Y2K terminal */}
            <div style={{ flex: 1, position: "relative" }}>
              {/* Line number gutter (decorative) */}
              <div aria-hidden="true" style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "36px",
                background: "rgba(0,0,0,.3)",
                borderRight: `1px solid ${primary}12`,
                pointerEvents: "none",
                display: "flex", flexDirection: "column", padding: "14px 0",
                overflow: "hidden",
              }}>
                {Array.from({ length: 40 }, (_, i) => (
                  <span key={i} style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${primary}28`, letterSpacing: 0, height: "23px", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "7px", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                className="editor-ta"
                value={markdown}
                onChange={e => setMarkdown(e.target.value)}
                placeholder={"# Your story begins here...\n\nUse **markdown** or Z-tags:\n[z-neon]glowing text[/z-neon]\n[z-glitch]glitching text[/z-glitch]\n[z-blink]blinking text[/z-blink]\n[z-marquee]scrolling text[/z-marquee]"}
                style={{
                  display: "block", width: "100%", minHeight: "55vh",
                  padding: "14px 14px 14px 46px",
                  background: "rgba(7,10,26,.9)",
                  border: "none",
                  color: "rgba(255,255,255,.85)",
                  fontSize: "13px",
                  lineHeight: "1.75",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              {/* Word count progress bar at bottom */}
              {wordCount > 0 && (
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "rgba(0,0,0,.3)" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (wordCount / 1000) * 100)}%`, background: `linear-gradient(90deg,${primary},${secondary})`, boxShadow: `0 0 6px ${primary}`, transition: "width .3s ease", borderRadius: "0 1px 1px 0" }} />
                </div>
              )}
            </div>
          </PortalCard>

          {/* ── PREVIEW PANEL ── */}
          <PortalCard accent="rgba(0,229,255,.22)" style={{ display: "flex", flexDirection: "column" }}>
            <ModuleHeader
              icon={<Eye size={11} />}
              title="LIVE PREVIEW"
              accent={secondary}
              right={
                readTime > 0
                  ? <span style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: `${secondary}55`, letterSpacing: "1px" }}>
                    ~{readTime} MIN READ
                  </span>
                  : undefined
              }
            />

            {/* Theme preview strip */}
            {theme && (
              <div style={{
                height: "3px",
                background: `linear-gradient(90deg,${THEME_META[theme].color} 0%,${primary} 50%,${secondary} 100%)`,
                boxShadow: `0 0 8px ${THEME_META[theme].color}50`,
              }} />
            )}

            <div
              className="zlog-body"
              dangerouslySetInnerHTML={{
                __html: previewHtml || `
                  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:200px;gap:12px;padding:40px 16px">
                    <div style="font-family:'VT323',monospace;font-size:11px;color:rgba(0,229,255,.35);letter-spacing:1.5px;text-align:left;align-self:stretch">
                      <span style="color:rgba(180,255,0,.6)">zeezu@preview</span><span style="color:rgba(255,255,255,.2)">:</span><span style="color:#00E5FF;opacity:.6">~$</span> render ./post.md<br/>
                      <span style="color:rgba(255,255,255,.1)">awaiting input...</span>
                    </div>
                    <p style="font-family:'VT323',monospace;font-size:13px;color:rgba(255,255,255,.2);letter-spacing:2px;margin:0">PREVIEW WILL APPEAR HERE</p>
                  </div>
                `,
              }}
              style={{
                flex: 1, minHeight: "55vh", padding: "16px",
                background: "rgba(4,8,20,.92)",
                overflowY: "auto",
                lineHeight: "1.8",
              }}
            />
          </PortalCard>
        </div>

        {/* ════════════════════════════════════════════════════════
            PUBLISHING SETTINGS PANEL
        ════════════════════════════════════════════════════════ */}
        <PortalCard accent={`${primary}22`} style={{ marginBottom: "20px" }}>
          <ModuleHeader
            icon={<span style={{ fontSize: "11px" }}>⚙</span>}
            title="PUBLISHING SETTINGS"
            accent={primary}
          />

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* ── ROW 1: Cover + Mood ── */}
            <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* Cover image URL */}
              <div>
                <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "1.5px", display: "block", marginBottom: "7px" }}>
                  <ImageIcon size={9} style={{ display: "inline", marginRight: "5px" }} />
                  COVER IMAGE URL
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={coverUrl}
                    onChange={e => setCoverUrl(e.target.value)}
                    placeholder="https://..."
                    style={{
                      width: "100%", padding: "9px 12px",
                      background: "rgba(255,45,135,.07)",
                      border: `1px solid ${coverUrl ? `${primary}40` : `${primary}22`}`,
                      borderRadius: "7px", color: "#fff",
                      fontFamily: "'Nunito',sans-serif", fontSize: "12px",
                      outline: "none", boxSizing: "border-box", transition: "border-color .2s",
                    }}
                    onFocus={e => e.target.style.borderColor = `${primary}60`}
                    onBlur={e => e.target.style.borderColor = coverUrl ? `${primary}40` : `${primary}22`}
                  />
                  {/* Cover preview thumbnail */}
                  {coverUrl && (
                    <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", width: "24px", height: "24px", borderRadius: "4px", overflow: "hidden", border: `1px solid ${primary}35` }}>
                      <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                    </div>
                  )}
                </div>
              </div>

              {/* Mood selector — emoji grid */}
              <div>
                <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "1.5px", display: "block", marginBottom: "7px" }}>
                  ✦ MOOD
                </label>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {/* No mood option */}
                  <button
                    onClick={() => setMood("")}
                    style={{
                      padding: "4px 8px", borderRadius: "5px", cursor: "pointer",
                      background: mood === "" ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.03)",
                      border: `1px solid ${mood === "" ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.1)"}`,
                      color: mood === "" ? "#fff" : "rgba(255,255,255,.3)",
                      fontFamily: "'VT323',monospace", fontSize: "9px", letterSpacing: "1px",
                      transition: "all .15s",
                    }}
                  >
                    NONE
                  </button>
                  {MOODS.map(m => (
                    <button
                      key={m.val}
                      onClick={() => setMood(m.val)}
                      title={m.val}
                      style={{
                        width: "30px", height: "28px", borderRadius: "5px", cursor: "pointer",
                        background: mood === m.val ? `${m.color}25` : "rgba(255,255,255,.03)",
                        border: `1px solid ${mood === m.val ? m.color : "rgba(255,255,255,.1)"}`,
                        fontSize: "14px", transition: "all .15s",
                        boxShadow: mood === m.val ? `0 0 8px ${m.color}50` : "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
                {activeMood && (
                  <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: activeMood.color, letterSpacing: "1px", margin: "5px 0 0" }}>
                    {activeMood.emoji} {activeMood.val}
                  </p>
                )}
              </div>
            </div>

            {/* ── ROW 2: Theme + Visibility ── */}
            <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* Theme swatches */}
              <div>
                <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "1.5px", display: "block", marginBottom: "7px" }}>
                  ◈ READING THEME
                </label>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {THEMES.map(t => {
                    const meta = THEME_META[t];
                    return (
                      <button
                        key={t}
                        className="theme-btn"
                        onClick={() => setTheme(t)}
                        title={meta.label}
                        style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          padding: "5px 10px", borderRadius: "5px", cursor: "pointer",
                          background: theme === t ? meta.bg : "rgba(255,255,255,.04)",
                          border: `1px solid ${theme === t ? meta.color : "rgba(255,255,255,.1)"}`,
                          color: theme === t ? meta.color : "rgba(255,255,255,.4)",
                          fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                          boxShadow: theme === t ? `0 0 10px ${meta.color}40` : "none",
                          transition: "all .15s",
                        }}
                      >
                        {/* Color dot */}
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: meta.color, flexShrink: 0, boxShadow: theme === t ? `0 0 5px ${meta.color}` : "none" }} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "1.5px", display: "block", marginBottom: "7px" }}>
                  👁 VISIBILITY
                </label>
                <div style={{ display: "flex", gap: "5px" }}>
                  {VISIBILITY_OPTIONS.map(v => {
                    const meta = VIS_META[v];
                    return (
                      <button
                        key={v}
                        className="vis-btn"
                        onClick={() => setVisibility(v)}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                          padding: "8px 6px", borderRadius: "6px", cursor: "pointer",
                          background: visibility === v ? `${meta.color}15` : "rgba(255,255,255,.04)",
                          border: `1px solid ${visibility === v ? meta.color : "rgba(255,255,255,.1)"}`,
                          color: visibility === v ? meta.color : "rgba(255,255,255,.38)",
                          fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                          boxShadow: visibility === v ? `0 0 8px ${meta.color}30` : "none",
                          transition: "all .15s",
                        }}
                      >
                        {meta.icon} {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── ROW 3: Toggle flags ── */}
            <div>
              <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "1.5px", display: "block", marginBottom: "8px" }}>
                ✦ OPTIONS
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "ANONYMOUS", val: isAnonymous, set: setIsAnonymous, emoji: "👤", color: "#FF2D87" },
                  { label: "NOTIFY CORE 8", val: notifyCore8, set: setNotifyCore8, emoji: "⚡", color: "#FFD700" },
                  { label: "NOTIFY FRIENDS", val: notifyFriends, set: setNotifyFriends, emoji: "🌊", color: "#00E5FF" },
                  { label: "SHARE TO WALL", val: shareToZeewall, set: setShareToZeewall, emoji: "📌", color: "#B4FF00" },
                ].map(({ label, val, set, emoji, color }) => (
                  <button
                    key={label}
                    className="toggle-btn"
                    onClick={() => set(!val)}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "7px 13px", borderRadius: "7px", cursor: "pointer",
                      background: val ? `${color}15` : "rgba(255,255,255,.03)",
                      border: `1px solid ${val ? color : "rgba(255,255,255,.1)"}`,
                      color: val ? color : "rgba(255,255,255,.32)",
                      fontFamily: "'VT323',monospace", fontSize: "10px", letterSpacing: "1px",
                      boxShadow: val ? `0 0 8px ${color}30` : "none",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>{emoji}</span>
                    {label}
                    {/* On/off indicator */}
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: val ? color : "rgba(255,255,255,.15)", marginLeft: "2px", boxShadow: val ? `0 0 5px ${color}` : "none", animation: val ? "zee-led 2.4s ease-in-out infinite" : "none" }} />
                  </button>
                ))}
              </div>
            </div>

            {/* ── ROW 4: Response-to ── */}
            <div>
              <label style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: "1.5px", display: "block", marginBottom: "7px" }}>
                ↩ RESPONSE TO (slug)
              </label>
              <input
                type="text"
                value={responseToSlug}
                onChange={e => setResponseToSlug(e.target.value)}
                onBlur={async (e) => {
                  e.target.style.borderColor = responseToId ? "#B4FF0040" : `${primary}20`;
                  if (!responseToSlug.trim()) { setResponseToId(undefined); return; }
                  const { data } = await (await import("@/lib/supabase/client")).supabase
                    .from("zlogs").select("id").eq("slug", responseToSlug.trim()).single();
                  if (data?.id) setResponseToId(data.id);
                  else setResponseToId(undefined);
                }}
                placeholder="responding-to-this-post-slug"
                style={{
                  width: "100%", padding: "9px 12px",
                  background: "rgba(255,45,135,.06)",
                  border: `1px solid ${responseToId ? "#B4FF0040" : `${primary}20`}`,
                  borderRadius: "7px", color: "rgba(255,255,255,.65)",
                  fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1.5px",
                  outline: "none", boxSizing: "border-box", transition: "border-color .2s",
                }}
                onFocus={e => e.target.style.borderColor = `${primary}50`}
              />
              {responseToId && (
                <p style={{ fontFamily: "'VT323',monospace", fontSize: "10px", color: "#B4FF00", margin: "5px 0 0", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#B4FF00", boxShadow: "0 0 5px #B4FF00", display: "inline-block" }} />
                  ✓ ZLOG FOUND · LINKED
                </p>
              )}
            </div>
          </div>
        </PortalCard>

        {/* ════════════════════════════════════════════════════════
            ACTION BUTTONS ROW
        ════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", alignItems: "center" }}>
          {/* Word count summary */}
          {wordCount > 0 && (
            <span style={{ fontFamily: "'VT323',monospace", fontSize: "11px", color: "rgba(255,255,255,.22)", letterSpacing: "1px", marginRight: "auto" }}>
              {wordCount} WORDS · {charCount} CHARS · ~{readTime} MIN READ
            </span>
          )}

          <button
            onClick={() => router.back()}
            style={{
              padding: "11px 22px", borderRadius: "8px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,.14)",
              color: "rgba(255,255,255,.4)",
              fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700,
              letterSpacing: "1px", cursor: "pointer", transition: "all .18s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.28)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.6)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.14)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.4)"; }}
          >
            CANCEL
          </button>

          <button
            className="publish-btn"
            onClick={handlePublish}
            disabled={publishing || !title.trim() || !markdown.trim()}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "11px 28px", borderRadius: "8px",
              background: publishing || !title.trim() || !markdown.trim()
                ? "rgba(255,45,135,.25)"
                : `linear-gradient(135deg, ${primary}, ${secondary})`,
              border: "none",
              color: publishing || !title.trim() || !markdown.trim() ? "rgba(255,255,255,.3)" : "#000",
              fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 700,
              letterSpacing: "1px",
              cursor: publishing ? "wait" : (!title.trim() || !markdown.trim()) ? "not-allowed" : "pointer",
              boxShadow: !publishing && title.trim() && markdown.trim()
                ? `0 0 20px rgba(255,45,135,.4), 0 0 40px rgba(0,229,255,.15)`
                : "none",
              opacity: !title.trim() || !markdown.trim() ? 0.5 : 1,
            }}
          >
            {publishing
              ? <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> PUBLISHING...</>
              : <>⊕ PUBLISH ZLOG</>
            }
          </button>
        </div>
      </div>

    </div>
  );
}