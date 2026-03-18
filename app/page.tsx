"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Menu, X, ArrowRight, Star, Users, Palette, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import ShinyText from "@/components/reactbits/ShinyText";
import GradientText from "@/components/reactbits/GradientText";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

// ── Scroll-reveal hook ────────────────────────────────────────────
function useInViewReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── FadeSection wrapper ───────────────────────────────────────────
function FadeSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInViewReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Feature data ──────────────────────────────────────────────────
const FEATURES = [
  {
    icon: MessageSquare,
    title: "ZeeWall",
    color: "#8A2EFF",
    desc: "Your wall, your world. Post to it, let friends zap your content, react in real-time. No algorithmic feed — chronological, honest, yours.",
    tag: "SOCIAL",
  },
  {
    icon: Users,
    title: "Core 8",
    color: "#00F7FF",
    desc: "Remember the MySpace Top 8? We brought it back. Curate your inner circle, rank your real ones. Friendship as a hierarchy — because some bonds hit different.",
    tag: "HIERARCHY",
  },
  {
    icon: Star,
    title: "Vibes",
    color: "#B4FF00",
    desc: "Rate people on their actual energy. Chill, Chaotic, Creative, Wholesome. Vibes are public, honest, and the realest metric on Zeezu.",
    tag: "CULTURE",
  },
  {
    icon: Palette,
    title: "Themes",
    color: "#FF007A",
    desc: "Your profile is a canvas. Pick from dozens of themes — neon, chrome, holographic, brutal. Typography, colors, effects. Make it yours.",
    tag: "EXPRESSION",
  },
];

// ── Floating card wrapper ─────────────────────────────────────────
function FloatingCard({
  style,
  animClass,
  children,
}: {
  style: React.CSSProperties;
  animClass: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute hidden xl:block w-44 bg-indigo/90 border border-electric/30 rounded-2xl p-3 backdrop-blur-sm shadow-[0_0_30px_-8px_rgba(138,46,255,0.4)] ${animClass}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ── Nostalgia Wall ────────────────────────────────────────────────
function NostalgiaWall() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-indigo/10 border-y border-electric/10">
      <div className="max-w-5xl mx-auto">
        <FadeSection className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            &ldquo;The internet used to feel different.&rdquo;
          </h2>
        </FadeSection>

        <div className="grid md:grid-cols-2 gap-10 mb-10">
          {/* Left col: checklist */}
          <FadeSection delay={100}>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-5">
              People miss this:
            </p>
            <ul className="space-y-3">
              {[
                "Profile themes",
                "Top 8 friends",
                "Custom status messages",
                "Real communities",
                "Zero algorithms",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="text-lime font-bold text-sm">✓</span>
                  <span className="text-gray-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </FadeSection>

          {/* Right col: timeline */}
          <FadeSection delay={200}>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-5">
              The arc:
            </p>
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-0">
              <div className="flex-1 flex justify-center">
                <div className="bg-electric/10 border border-electric/30 rounded-xl px-4 py-3 text-center w-28">
                  <p className="text-white font-bold text-xs">Old Internet</p>
                  <p className="text-electric text-[10px] font-mono mt-1">&ldquo;Alive&rdquo;</p>
                </div>
              </div>
              {/* Desktop arrow */}
              <div className="hidden md:flex items-center mx-1" aria-hidden="true">
                <div className="w-6 h-px bg-gray-700" />
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-gray-700" />
              </div>
              {/* Mobile arrow */}
              <div className="md:hidden flex flex-col items-center" aria-hidden="true">
                <div className="w-px h-3 bg-gray-700" />
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-gray-700" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3 text-center w-28 opacity-60">
                  <p className="text-gray-400 font-bold text-xs line-through">Broken Era</p>
                  <p className="text-gray-600 text-[10px] font-mono mt-1">&ldquo;Optimised&rdquo;</p>
                </div>
              </div>
              {/* Desktop arrow */}
              <div className="hidden md:flex items-center mx-1" aria-hidden="true">
                <div className="w-6 h-px bg-gray-700" />
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-gray-700" />
              </div>
              {/* Mobile arrow */}
              <div className="md:hidden flex flex-col items-center" aria-hidden="true">
                <div className="w-px h-3 bg-gray-700" />
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-gray-700" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-electric/10 border border-electric/40 rounded-xl px-4 py-3 text-center w-28">
                  <p className="text-white font-bold text-xs">Zeezu</p>
                  <p className="text-cyan text-[10px] font-mono mt-1">&ldquo;Alive again&rdquo;</p>
                </div>
              </div>
            </div>
          </FadeSection>
        </div>

        <FadeSection delay={300} className="text-center">
          <p className="text-electric font-black text-xl sm:text-2xl">We fixed that.</p>
        </FadeSection>
      </div>
    </section>
  );
}

// ── Nav ───────────────────────────────────────────────────────────
function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-void/90 backdrop-blur-md border-b border-electric/20 shadow-[0_0_30px_-10px_rgba(138,46,255,0.2)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black tracking-tighter lowercase">
          <span
            style={{
              background: "linear-gradient(135deg, #8A2EFF 0%, #00F7FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            zeezu
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-electric hover:bg-electric/80 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_-6px_rgba(138,46,255,0.6)] hover:shadow-[0_0_24px_-4px_rgba(138,46,255,0.8)]"
          >
            Join Zeezu <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-void/95 backdrop-blur-md border-b border-electric/20 px-4 pb-4 overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-gray-300 hover:text-white py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-electric text-white text-sm font-bold py-3 rounded-xl"
              >
                Join Zeezu <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated dot grid */}
      <div className="dot-grid-bg absolute inset-0 pointer-events-none" />

      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-electric/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan/8 blur-[120px] rounded-full pointer-events-none" />

      {/* Floating feature cards */}
      {/* Card 1: ZeeWall post */}
      <FloatingCard
        animClass="[animation:float-card-1_6s_ease-in-out_infinite]"
        style={{ top: "22%", right: "8%", zIndex: 10 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=zeezu-alpha"
            alt="CryptoVibes"
            className="w-7 h-7 rounded-full border border-electric/40 bg-black"
          />
          <div>
            <p className="text-white text-[11px] font-bold leading-tight">CryptoVibes</p>
            <p className="text-gray-500 text-[9px] font-mono">z.cryptovibe</p>
          </div>
        </div>
        <p className="text-gray-300 text-[10px] mb-2">vibing at 3am 🌙</p>
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-mono bg-lime/20 text-lime px-1.5 py-0.5 rounded-full">⚡ 42 zaps</span>
        </div>
      </FloatingCard>

      {/* Card 2: Vibes rating */}
      <FloatingCard
        animClass="[animation:float-card-2_7s_ease-in-out_0.5s_infinite]"
        style={{ bottom: "28%", right: "12%", zIndex: 10 }}
      >
        <p className="text-gray-500 text-[9px] font-mono mb-2">CryptoVibes&apos;s Vibes</p>
        <div className="flex flex-col gap-1">
          {["🔥 Chaotic", "🧠 Big Brain", "✨ Creative"].map((v) => (
            <span key={v} className="text-[8px] font-mono bg-electric/15 text-electric px-1.5 py-0.5 rounded-full w-fit">
              {v}
            </span>
          ))}
        </div>
        <div className="mt-2 h-[2px] w-full rounded-full bg-gradient-to-r from-electric to-cyan opacity-60" />
      </FloatingCard>

      {/* Card 3: Theme preview */}
      <FloatingCard
        animClass="[animation:float-card-3_5s_ease-in-out_1s_infinite]"
        style={{ top: "38%", right: "22%", zIndex: 10 }}
      >
        <p className="text-gray-500 text-[9px] font-mono mb-2">Cyber Pink theme</p>
        <div className="flex gap-1.5 mb-2">
          {["#FF007A", "#FF6EC7", "#00F7FF"].map((c) => (
            <div key={c} className="w-4 h-4 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}80` }} />
          ))}
        </div>
        <div className="h-[6px] w-full rounded-full" style={{ background: "linear-gradient(to right, #FF007A, #FF6EC7, #00F7FF)" }} />
      </FloatingCard>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center xl:text-left xl:max-w-2xl xl:ml-16 2xl:ml-32">
        {/* Pill row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center gap-2 justify-center xl:justify-start mb-8"
        >
          <span className="text-[10px] font-mono text-gray-500 italic border border-gray-800 rounded-full px-3 py-1">
            ◆ The Internet After Dark.
          </span>
          <div className="inline-flex items-center gap-2 bg-electric/10 border border-electric/30 text-xs font-mono px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
            <ShinyText
              text="Early Access — Claim your ZID"
              color="#9966ff"
              shineColor="#00F7FF"
              speed={3}
              className="text-xs font-mono tracking-wider"
            />
          </div>
        </motion.div>

        {/* H1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4"
        >
          <h1 className="text-5xl sm:text-7xl font-black leading-[1.0] text-white">
            Social media used<br className="hidden sm:block" /> to be fun.
          </h1>
        </motion.div>

        {/* H2 + body */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-10"
        >
          <p className="text-3xl sm:text-4xl font-black mb-4">
            <GradientText
              colors={["#8A2EFF", "#00F7FF", "#8A2EFF"]}
              animationSpeed={6}
              className="text-3xl sm:text-4xl font-black"
            >
              We&apos;re bringing it back.
            </GradientText>
          </p>
          <p className="text-lg sm:text-xl text-gray-400 max-w-xl leading-relaxed">
            Remember when your profile was{" "}
            <span className="text-white font-semibold">actually yours</span>? No ads.
            No algorithm. Just real people expressing themselves. We built that again.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center xl:justify-start"
        >
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-electric hover:bg-electric/80 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-[0_0_30px_-8px_rgba(138,46,255,0.7)] hover:shadow-[0_0_40px_-6px_rgba(138,46,255,0.9)] min-h-[44px]"
          >
            Join Zeezu <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-electric/40 text-white font-semibold text-base px-8 py-4 rounded-xl transition-all min-h-[44px]"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-gray-600 text-xs font-mono mt-6"
        >
          Free forever · No data sold · Your ZID is yours
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-electric/40 to-transparent" />
        <div
          className="w-1 h-1 rounded-full bg-electric animate-bounce"
          style={{ animationDuration: "1.5s" }}
        />
      </motion.div>
    </section>
  );
}

// ── Ticker Strip ──────────────────────────────────────────────────
function TickerStrip() {
  const items = [
    "ZeeWall", "ZID", "Core 8", "Vibes", "Zones", "Buzz",
    "ZeeNet", "Themes", "ZeeWall", "ZID", "Core 8", "Vibes",
    "Zones", "Buzz", "ZeeNet", "Themes",
  ];
  return (
    <div className="relative overflow-hidden border-y border-electric/20 bg-void/80 py-3">
      <div className="flex whitespace-nowrap marquee-track">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 mx-4 font-mono text-[13px] font-medium text-gray-500">
            <span className="text-electric/60">◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Nostalgia Section ─────────────────────────────────────────────
function NostalgiaSection() {
  const cards = [
    {
      icon: "🏠",
      title: "Your Profile, Your Rules",
      desc: "No shadow banning. No content restrictions. No algorithmic ranking deciding who matters. Your page is yours.",
      color: "rgba(138,46,255,0.2)",
    },
    {
      icon: "💬",
      title: "Real Conversations",
      desc: "Walls, not feeds. ZeeWall brings back the era of posting on someone's page instead of shouting into a void.",
      color: "rgba(0,247,255,0.15)",
    },
    {
      icon: "✨",
      title: "Express Yourself",
      desc: "Themes, custom colors, fonts, effects. Your profile should look like you. Pick a vibe. Make it loud.",
      color: "rgba(180,255,0,0.15)",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <FadeSection className="text-center mb-16">
        <p className="text-electric text-xs font-mono tracking-widest uppercase mb-3">
          NOSTALGIA MODE
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-white">
          Remember This Feeling?
        </h2>
        <p className="text-gray-500 mt-4 max-w-lg mx-auto">
          The internet used to be weird, personal, and alive. We&apos;re bringing back
          the era when your online presence meant something.
        </p>
      </FadeSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <FadeSection key={card.title} delay={i * 100}>
            <SpotlightCard
              spotlightColor={card.color}
              className="h-full bg-indigo/60 border border-electric/20 rounded-2xl p-7 hover:border-electric/40 transition-colors"
            >
              <div className="text-4xl mb-5">{card.icon}</div>
              <h3 className="text-white font-black text-lg mb-3">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </SpotlightCard>
          </FadeSection>
        ))}
      </div>
    </section>
  );
}

// ── Feature Highlights ────────────────────────────────────────────
function FeatureHighlights() {
  return (
    <section className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <FadeSection className="text-center mb-20">
        <p className="text-cyan text-xs font-mono tracking-widest uppercase mb-3">
          PLATFORM OVERVIEW
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-white">What is Zeezu?</h2>
      </FadeSection>

      <div className="space-y-24">
        {FEATURES.map((feat, i) => {
          const Icon = feat.icon;
          const isEven = i % 2 === 0;
          return (
            <FadeSection key={feat.title} delay={80} className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-12`}>
              {/* Visual */}
              <div className="flex-1 flex justify-center">
                <div
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-3xl flex items-center justify-center relative"
                  style={{
                    background: `radial-gradient(ellipse at center, ${feat.color}20 0%, transparent 70%)`,
                    border: `1px solid ${feat.color}30`,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-3xl opacity-10"
                    style={{ background: `radial-gradient(ellipse at center, ${feat.color} 0%, transparent 70%)` }}
                  />
                  <Icon
                    className="w-20 h-20 sm:w-28 sm:h-28 relative z-10"
                    style={{ color: feat.color, filter: `drop-shadow(0 0 20px ${feat.color})` }}
                  />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 text-center md:text-left">
                <span
                  className="inline-block text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-full mb-4"
                  style={{ color: feat.color, background: `${feat.color}15`, border: `1px solid ${feat.color}30` }}
                >
                  {feat.tag}
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white mb-4">{feat.title}</h3>
                <p className="text-gray-400 text-base leading-relaxed max-w-md">{feat.desc}</p>
              </div>
            </FadeSection>
          );
        })}
      </div>
    </section>
  );
}

// ── Stats Section ─────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { label: "ZIDs Claimed", value: 1847, suffix: "+" },
    { label: "Vibes Rated",  value: 9300, suffix: "+" },
    { label: "Active Themes", value: 6,   suffix: "" },
    { label: "Wall Posts",    value: 22400, suffix: "+" },
  ];

  return (
    <section className="py-20 border-y border-electric/10 bg-indigo/20">
      <FadeSection className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <div key={s.label}>
            <div className="text-4xl sm:text-5xl font-black text-white mb-1">
              <CountUp to={s.value} duration={2} delay={i * 0.15} separator="," />
              {s.suffix}
            </div>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">
              {s.label}
            </p>
          </div>
        ))}
      </FadeSection>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-electric/12 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-cyan/8 blur-[100px] rounded-full" />
      </div>
      <FadeSection className="max-w-3xl mx-auto text-center relative z-10">
        <Zap className="w-12 h-12 text-electric mx-auto mb-6 [filter:drop-shadow(0_0_16px_#8A2EFF)]" />
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
          Ready to claim your corner of{" "}
          <GradientText
            colors={["#8A2EFF", "#00F7FF", "#B4FF00", "#8A2EFF"]}
            animationSpeed={5}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight"
          >
            the internet?
          </GradientText>
        </h2>
        <p className="text-gray-400 text-lg mb-10">
          Your ZID is waiting. It&apos;s free. No credit card. No catch.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-3 bg-electric hover:bg-electric/80 text-white font-black text-lg px-10 py-5 rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(138,46,255,0.8)] hover:shadow-[0_0_50px_-8px_rgba(138,46,255,1)] min-h-[44px]"
        >
          Claim Your ZID — It&apos;s Free
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-gray-700 text-xs font-mono mt-6">
          Takes 30 seconds · No password · Magic link auth
        </p>
      </FadeSection>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="border-t border-electric/10 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-600 text-xs font-mono">
        <span
          style={{
            background: "linear-gradient(135deg, #8A2EFF, #00F7FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          className="text-sm font-black tracking-tighter lowercase"
        >
          zeezu
        </span>
        <p>© {new Date().getFullYear()} Zeezu. The internet, after dark.</p>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-white transition-colors">About</Link>
          <Link href="/login" className="hover:text-white transition-colors">Rules</Link>
          <Link href="/login" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();

  // Redirect authed users to dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard");
    });
  }, [router]);

  return (
    <div className="bg-void text-white overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <TickerStrip />
      <NostalgiaWall />
      <NostalgiaSection />
      <FeatureHighlights />
      <StatsSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
