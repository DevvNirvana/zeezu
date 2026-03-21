import { marked } from "marked";
import DOMPurify from "dompurify";

export function generateSlug(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export function readingTimeMinutes(markdown: string): number {
  const words = markdown.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Pre-process custom Z-tags → HTML before passing to marked
function preprocess(md: string): string {
  return md
    .replace(/\[z-neon\]([\s\S]*?)\[\/z-neon\]/g, '<span class="z-neon">$1</span>')
    .replace(/\[z-glitch\]([\s\S]*?)\[\/z-glitch\]/g, '<span class="z-glitch" data-text="$1">$1</span>')
    .replace(/\[z-divider\]/g, '<div class="z-divider"><span>✦</span></div>')
    .replace(/\[z-track\]([\s\S]*?)\[\/z-track\]/g, '<div class="z-track"><audio controls src="$1"></audio></div>')
    .replace(/\[z-marquee\]([\s\S]*?)\[\/z-marquee\]/g, '<div class="z-marquee-wrap"><span class="z-marquee">$1</span></div>')
    .replace(/\[z-blink\]([\s\S]*?)\[\/z-blink\]/g, '<span class="z-blink">$1</span>');
}

export function renderZlog(markdown: string): string {
  const processed = preprocess(markdown);
  const html = marked(processed, { async: false, breaks: true, gfm: true }) as string;
  if (typeof window === "undefined") return html; // SSR fallback (no sanitize)
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["audio"],
    ADD_ATTR: ["controls", "src", "data-text"],
  });
}

// CSS to inject on both editor preview and reading pages
export const ZLOG_CSS = `
  @keyframes z-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes z-marquee-anim { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
  @keyframes z-glitch-anim {
    0%{clip-path:polygon(0 10%,100% 10%,100% 15%,0 15%)}
    20%{clip-path:polygon(0 80%,100% 80%,100% 85%,0 85%)}
    40%{clip-path:none;transform:skew(0.5deg)}
    100%{clip-path:none;transform:skew(0)}
  }
  .z-neon { color:#00F7FF; text-shadow:0 0 8px #00F7FF,0 0 20px #00F7FF44; }
  .z-glitch { position:relative; animation:z-glitch-anim 3s ease-in-out infinite; }
  .z-glitch::before { content:attr(data-text); position:absolute; left:2px; top:0;
    color:#FF007A; clip-path:polygon(0 10%,100% 10%,100% 25%,0 25%);
    animation:z-glitch-anim 2.7s ease-in-out infinite reverse; }
  .z-blink { animation:z-blink 1s step-end infinite; }
  .z-divider { display:flex;align-items:center;gap:10px;margin:24px 0;opacity:0.4; }
  .z-divider::before,.z-divider::after { content:'';flex:1;height:1px;background:currentColor; }
  .z-marquee-wrap { overflow:hidden;white-space:nowrap;padding:6px 0; }
  .z-marquee { display:inline-block;animation:z-marquee-anim 12s linear infinite; }
  .z-track { background:rgba(0,0,0,.4);border-radius:8px;padding:10px;margin:12px 0; }
  .z-track audio { width:100%; }
  .zlog-body h1 { font-family:'Orbitron',sans-serif;font-size:22px;font-weight:900;color:#fff;margin:24px 0 12px; }
  .zlog-body h2 { font-family:'Orbitron',sans-serif;font-size:16px;font-weight:700;color:#fff;margin:20px 0 10px; }
  .zlog-body h3 { font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,255,.85);margin:16px 0 8px; }
  .zlog-body p  { font-family:'Nunito',sans-serif;font-size:14px;line-height:1.7;color:rgba(255,255,255,.75);margin:0 0 14px; }
  .zlog-body a  { color:#00F7FF;text-decoration:underline; }
  .zlog-body blockquote { border-left:3px solid var(--color-electric,#FF2D87);padding:8px 16px;background:rgba(255,45,135,.08);margin:14px 0;font-style:italic; }
  .zlog-body code { font-family:'VT323',monospace;background:rgba(0,0,0,.5);padding:2px 6px;border-radius:4px;font-size:13px;color:#B4FF00; }
  .zlog-body pre { background:rgba(0,0,0,.6);padding:14px;border-radius:8px;overflow-x:auto;margin:14px 0; }
  .zlog-body pre code { background:none;padding:0; }
  .zlog-body ul,.zlog-body ol { font-family:'Nunito',sans-serif;font-size:14px;color:rgba(255,255,255,.7);padding-left:20px;margin:0 0 14px; }
  .zlog-body img { max-width:100%;border-radius:8px;margin:10px 0; }
`;
