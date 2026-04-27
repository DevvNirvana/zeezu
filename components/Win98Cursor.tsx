"use client";
import { useEffect, useRef, useState } from "react";

// ── Cursor CSS injected once globally ─────────────────────────────
const CURSOR_CSS = `
  .z98-cursor-active,.z98-cursor-active *:not(input):not(textarea):not(select){cursor:none!important}
  @keyframes zc-flag{0%,100%{transform:skewY(0deg) scaleX(1)}30%{transform:skewY(5deg) scaleX(.96)}70%{transform:skewY(-5deg) scaleX(.96)}}
  .zc-flag{animation:zc-flag 2s ease-in-out infinite}
  @keyframes zc-flag-fast{0%,100%{transform:skewY(0deg) scaleX(1)}25%{transform:skewY(11deg) scaleX(.91)}75%{transform:skewY(-11deg) scaleX(.91)}}
  .zc-flag-fast{animation:zc-flag-fast .52s ease-in-out infinite}
  @keyframes zc-hg-spin{0%,38%{transform:rotate(0deg)}50%,88%{transform:rotate(180deg)}100%{transform:rotate(180deg)}}
  .zc-hg{animation:zc-hg-spin 1.6s cubic-bezier(.45,0,.55,1) infinite;transform-origin:center;display:inline-block}
  @keyframes lp-spark{from{transform:translate(0,0) scale(1);opacity:1}to{transform:translate(var(--dx),var(--dy)) scale(0) rotate(180deg);opacity:0}}
`;

function ArrowWithFlag({ hover }: { hover: boolean }) {
  return (
    <div style={{ position: "relative", width: "52px", height: "48px" }}>
      <svg width="26" height="30" viewBox="0 0 20 24" style={{
        position: "absolute", top: 0, left: 0,
        filter: hover
          ? "drop-shadow(0 0 6px rgba(255,45,135,.8)) drop-shadow(1px 1px 0 #000)"
          : "drop-shadow(1px 1px 0 #000) drop-shadow(0 0 1px #000)",
        transition: "filter .15s ease",
      }}>
        <polygon points="2,1 2,19 6,15 8.5,21 11,20 8.5,14 14,14" fill="white" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="3,2 3,18 6.5,14.5 9,19.5 10.5,19 8,13.5 13,13.5" fill="black" />
      </svg>
      <div style={{
        position: "absolute", top: "2px", left: "22px",
        width: "1.5px", height: "22px",
        background: "rgba(255,255,255,.88)",
        boxShadow: "0 0 2px rgba(0,0,0,.9)",
      }} />
      <div
        className={hover ? "zc-flag-fast" : "zc-flag"}
        style={{ position: "absolute", top: "2px", left: "23px", transformOrigin: "left center" }}
      >
        <svg width="22" height="18" viewBox="0 0 70 58">
          <path d="M 33,5 Q 17,2 2,2 L 2,27 Q 17,26 33,25 Z" fill="#FF2D87"
            style={{ filter: hover ? "brightness(1.4) drop-shadow(0 0 3px #FF2D87)" : "none", transition: "filter .15s" }} />
          <path d="M 37,5 Q 53,2 68,2 L 68,27 Q 53,26 37,25 Z" fill="#00E5FF" />
          <path d="M 33,33 Q 17,32 2,31 L 2,56 Q 17,56 33,53 Z" fill="#5B21B6" />
          <path d="M 37,33 Q 53,32 68,31 L 68,56 Q 53,56 37,53 Z" fill="#0EA5E9" />
        </svg>
      </div>
    </div>
  );
}

function HourglassCursor() {
  return (
    <div className="zc-hg" style={{ marginLeft: "2px", marginTop: "2px" }}>
      <svg width="26" height="32" viewBox="0 0 26 32">
        <rect x="1" y="0" width="24" height="3" rx="1.5" fill="#00E5FF" opacity=".9" />
        <rect x="1" y="29" width="24" height="3" rx="1.5" fill="#00E5FF" opacity=".9" />
        <path d="M3,3 L23,3 L13,16 L23,29 L3,29 L13,16 Z"
          fill="rgba(0,0,0,.55)" stroke="#00E5FF" strokeWidth="1.5" strokeLinejoin="round" />
        <clipPath id="hg-t"><path d="M3,3 L23,3 L13,16 Z" /></clipPath>
        <rect x="3" y="3" width="20" height="14" fill="#FF2D87" opacity=".9" clipPath="url(#hg-t)" />
        <clipPath id="hg-b"><path d="M13,16 L23,29 L3,29 Z" /></clipPath>
        <rect x="3" y="16" width="20" height="13" fill="#FF2D87" opacity=".9" clipPath="url(#hg-b)" />
        <circle cx="13" cy="16" r="1.5" fill="#FFD700" opacity=".9" />
      </svg>
    </div>
  );
}

type CursorState = "default" | "pointer" | "loading";

function CursorFX() {
  const divRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -300, y: -300 });
  const stateRef = useRef<CursorState>("default");
  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setVisible(true);
    document.documentElement.classList.add("z98-cursor-active");

    let rafId: number;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (stateRef.current === "loading") return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isClickable = el?.closest("a,button,[role='button'],input,label,select,[tabindex]");
      const next: CursorState = isClickable ? "pointer" : "default";
      if (next !== stateRef.current) { stateRef.current = next; setState(next); }
    };

    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const link = el?.closest("a[href]") as HTMLAnchorElement | null;
      if (link && link.href && !link.href.startsWith("#") && !link.target) {
        stateRef.current = "loading";
        setState("loading");
        if (loadTimer) clearTimeout(loadTimer);
        loadTimer = setTimeout(() => { stateRef.current = "default"; setState("default"); }, 2800);
      }
    };

    const loop = () => {
      if (divRef.current) {
        divRef.current.style.transform = `translate(${posRef.current.x}px,${posRef.current.y}px)`;
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      cancelAnimationFrame(rafId);
      if (loadTimer) clearTimeout(loadTimer);
      document.documentElement.classList.remove("z98-cursor-active");
    };
  }, []);

  if (!visible) return null;
  return (
    <div ref={divRef} style={{
      position: "fixed", top: 0, left: 0,
      pointerEvents: "none", zIndex: 999999,
      willChange: "transform",
    }}>
      {state === "loading" ? <HourglassCursor /> : <ArrowWithFlag hover={state === "pointer"} />}
    </div>
  );
}

function CursorSparks() {
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; dx: string; dy: string; color: string }[]>([]);
  const uid = useRef(0);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const COLORS = ["#FFD700", "#FF2D87", "#00F7FF", "#ffffff", "#B4FF00", "#FF6B35", "#C0C0C0", "#FF007A"];
    const onDown = (e: PointerEvent) => {
      const id = ++uid.current;
      const batch = Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.63;
        const dist = 30 + Math.random() * 30;
        return {
          id: id * 100 + i,
          x: e.clientX - 3,
          y: e.clientY - 3,
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist}px`,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
      });
      setSparks(p => [...p, ...batch]);
      setTimeout(() => setSparks(p => p.filter(s => !batch.find(b => b.id === s.id))), 550);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  if (!sparks.length) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99999 }}>
      {sparks.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: s.x, top: s.y,
          width: 6, height: 6, borderRadius: 1,
          background: s.color,
          boxShadow: `0 0 5px ${s.color}, 0 0 10px ${s.color}80`,
          animation: "lp-spark 0.52s ease-out forwards",
          "--dx": s.dx, "--dy": s.dy,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

export default function Win98Cursor() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CURSOR_CSS }} />
      <CursorFX />
      <CursorSparks />
    </>
  );
}
