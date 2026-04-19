"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll() {
  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.4,
    });

    // ── Lenis + GSAP ScrollTrigger sync ──────────────────────────
    // Both now share the same ticker — ScrollTrigger reads Lenis's
    // virtual scroll position instead of the real browser position.
    // Required for pinned sections and scrub-based timelines.
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Pause when tab hidden — saves CPU/battery (addresses heating issue)
    const handleVisibility = () => {
      if (document.hidden) lenis.stop();
      else lenis.start();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
      document.removeEventListener("visibilitychange", handleVisibility);
      ScrollTrigger.getAll().forEach(t => t.kill());
      lenis.destroy();
    };
  }, []);

  return null;
}
