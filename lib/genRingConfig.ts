import type { GenerationMeta } from "./generation";

export type GenAuraStyle = {
  ringClass?: string;
  ringStyle?: React.CSSProperties;
  glowShadow?: string;
  tabBg: string;
  tabBorder: string;
  tabShadow: string;
  iconColor?: string;
  iconTextShadow?: string;
  iconClass?: string;
};

export function getGenAuraStyle(gen: GenerationMeta): GenAuraStyle | null {
  if (gen.tier === "synthetic" || !gen.label) return null;

  switch (gen.label) {
    case "Boomer":
      return {
        // Classic elegant gold trim
        ringStyle: { background: "linear-gradient(135deg, #F5A623 0%, #D4AF37 50%, #B8860B 100%)" },
        glowShadow: "0 0 12px rgba(245,166,35,0.25)",
        tabBg: "linear-gradient(180deg, #181105 0%, #0a0702 100%)",
        tabBorder: "1px solid rgba(245,166,35,0.7)",
        tabShadow: "0 2px 8px rgba(245,166,35,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
        iconColor: "#F5A623",
        iconTextShadow: "0 0 8px rgba(245,166,35,0.9)",
      };

    case "Gen X":
      return {
        // Neon cyan sleek border
        ringStyle: { background: "linear-gradient(135deg, #00F7FF 0%, #0088FF 100%)" },
        glowShadow: "0 0 14px rgba(0,247,255,0.3)",
        tabBg: "linear-gradient(180deg, #020a12 0%, #01050a 100%)",
        tabBorder: "1px solid rgba(0,247,255,0.4)",
        tabShadow: "0 2px 10px rgba(0,247,255,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        iconColor: "#00F7FF",
        iconTextShadow: "0 0 8px rgba(0,247,255,0.8)",
      };

    case "Millennial":
      return {
        // Fast dynamic rainbow gradient
        ringClass: "gen-ring-mil",
        glowShadow: "0 0 16px rgba(255,0,128,0.35)",
        tabBg: "rgba(14,8,32,0.85)",
        tabBorder: "1px solid rgba(255,255,255,0.25)",
        tabShadow: "0 4px 12px rgba(255,0,128,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
        iconClass: "gen-icon-mil",
      };

    case "Zillennial":
      return {
        // Smooth dreamy pink/purple blur
        ringClass: "gen-ring-zil",
        glowShadow: "0 0 16px rgba(196,181,253,0.3)",
        tabBg: "rgba(8,4,20,0.85)",
        tabBorder: "1px solid rgba(196,181,253,0.6)",
        tabShadow: "0 4px 12px rgba(196,181,253,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
        iconClass: "gen-icon-zil",
      };

    case "Gen Z":
      return {
        // Brutalist high-contrast lime
        ringStyle: { background: "#B4FF00" },
        glowShadow: "0 0 20px rgba(180,255,0,0.4)",
        tabBg: "#0a0a0a",
        tabBorder: "1px solid #B4FF00",
        tabShadow: "0 4px 12px rgba(180,255,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        iconColor: "#B4FF00",
        iconTextShadow: "0 0 10px rgba(180,255,0,0.9)",
      };

    case "Gen Alpha":
      return {
        // Holographic shimmer
        ringClass: "gen-ring-alpha",
        glowShadow: "0 0 18px rgba(192,132,252,0.35)",
        tabBg: "rgba(6,0,16,0.85)",
        tabBorder: "1px solid rgba(192,132,252,0.6)",
        tabShadow: "0 4px 14px rgba(192,132,252,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
        iconClass: "gen-icon-alpha",
      };

    default:
      return null;
  }
}
