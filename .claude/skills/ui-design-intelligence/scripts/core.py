#!/usr/bin/env python3
import re
"""
UI Design Intelligence — Core Data Engine v2.0
Palettes · Typography · Styles · UX Laws · Page Patterns · Library Catalog
All data is keyword-searchable. Used by design_system.py, search.py, detect_stack.py.
"""

# ═══════════════════════════════════════════════════════════════════════
# PALETTES — 40+ curated color systems
# ═══════════════════════════════════════════════════════════════════════
PALETTES = [
    {"name":"Midnight Indigo","vibe":"dark premium ai saas startup modern professional tech",
     "primary":"#6366F1","secondary":"#818CF8","cta":"#A78BFA","bg":"#09090B",
     "bg_dark":"#09090B","surface":"#18181B","surface_dark":"#18181B","text":"#FAFAFA",
     "muted":"#71717A","border":"#27272A","border_dark":"#27272A"},
    {"name":"Ocean Slate","vibe":"saas developer tool clean corporate b2b professional minimal modern",
     "primary":"#0EA5E9","secondary":"#38BDF8","cta":"#06B6D4","bg":"#F8FAFC",
     "bg_dark":"#0C1A2E","surface":"#FFFFFF","surface_dark":"#0F2849","text":"#0F172A",
     "muted":"#64748B","border":"#E2E8F0","border_dark":"#1E3A5F"},
    {"name":"Violet Storm","vibe":"dark ai ml neural startup bold dramatic gradient premium luxury",
     "primary":"#7C3AED","secondary":"#8B5CF6","cta":"#C084FC","bg":"#0A0010",
     "bg_dark":"#0A0010","surface":"#13002B","surface_dark":"#13002B","text":"#F5F3FF",
     "muted":"#A78BFA","border":"#2D1B69","border_dark":"#2D1B69"},
    {"name":"Warm Cream","vibe":"warm minimal editorial blog content lifestyle brand soft organic",
     "primary":"#92400E","secondary":"#B45309","cta":"#D97706","bg":"#FFFBF5",
     "bg_dark":"#1C1008","surface":"#FFFFFF","surface_dark":"#26180A","text":"#1C1917",
     "muted":"#78716C","border":"#E7E5E4","border_dark":"#44302A"},
    {"name":"Forest Sage","vibe":"organic sustainability wellness health eco green nature brand lifestyle",
     "primary":"#166534","secondary":"#15803D","cta":"#22C55E","bg":"#F0FDF4",
     "bg_dark":"#052E16","surface":"#FFFFFF","surface_dark":"#14532D","text":"#14532D",
     "muted":"#6B7280","border":"#DCFCE7","border_dark":"#166534"},
    {"name":"Rose Gold","vibe":"luxury beauty fashion premium feminine elegant brand cosmetic jewelry",
     "primary":"#9F1239","secondary":"#BE123C","cta":"#E11D48","bg":"#FFF1F2",
     "bg_dark":"#1C000A","surface":"#FFFFFF","surface_dark":"#3B0018","text":"#1C0010",
     "muted":"#9F9FA0","border":"#FFE4E6","border_dark":"#4C0020"},
    {"name":"Nordic Frost","vibe":"minimal clean scandinavian nordic white cool professional simple",
     "primary":"#1D4ED8","secondary":"#3B82F6","cta":"#2563EB","bg":"#F9FAFB",
     "bg_dark":"#0B1120","surface":"#FFFFFF","surface_dark":"#111827","text":"#111827",
     "muted":"#9CA3AF","border":"#E5E7EB","border_dark":"#1F2937"},
    {"name":"Cyber Neon","vibe":"gaming cyberpunk neon dark electric bold rgb edgy hacker tech",
     "primary":"#00FF88","secondary":"#00FFFF","cta":"#FF006E","bg":"#050505",
     "bg_dark":"#050505","surface":"#0D0D0D","surface_dark":"#0D0D0D","text":"#EEFFEE",
     "muted":"#44554F","border":"#1A2F25","border_dark":"#1A2F25"},
    {"name":"Sunset Coral","vibe":"consumer social media fun playful creative colorful app mobile",
     "primary":"#F97316","secondary":"#FB923C","cta":"#EF4444","bg":"#FFF7ED",
     "bg_dark":"#1A0A00","surface":"#FFFFFF","surface_dark":"#2A1400","text":"#1C0A00",
     "muted":"#78716C","border":"#FED7AA","border_dark":"#431407"},
    {"name":"Obsidian Gold","vibe":"luxury premium exclusive finance wealth investment gold dark elite",
     "primary":"#B45309","secondary":"#D97706","cta":"#F59E0B","bg":"#0A0800",
     "bg_dark":"#0A0800","surface":"#150F00","surface_dark":"#150F00","text":"#FEF9C3",
     "muted":"#78716C","border":"#292200","border_dark":"#292200"},
    {"name":"Electric Blue","vibe":"tech fintech blockchain crypto modern bold corporate enterprise",
     "primary":"#1E40AF","secondary":"#2563EB","cta":"#3B82F6","bg":"#F0F9FF",
     "bg_dark":"#020617","surface":"#FFFFFF","surface_dark":"#0C1A3E","text":"#0C1A3E",
     "muted":"#64748B","border":"#DBEAFE","border_dark":"#1E3A8A"},
    {"name":"Dark Emerald","vibe":"dark fintech data analytics security monitoring dashboard premium",
     "primary":"#059669","secondary":"#10B981","cta":"#34D399","bg":"#022C22",
     "bg_dark":"#022C22","surface":"#064E3B","surface_dark":"#064E3B","text":"#ECFDF5",
     "muted":"#6EE7B7","border":"#065F46","border_dark":"#065F46"},
    {"name":"Lavender Mist","vibe":"productivity wellness meditation mental health calm soft pastel b2c",
     "primary":"#7C3AED","secondary":"#8B5CF6","cta":"#6D28D9","bg":"#F5F3FF",
     "bg_dark":"#110628","surface":"#EDE9FE","surface_dark":"#1E0A4C","text":"#2E1065",
     "muted":"#A78BFA","border":"#DDD6FE","border_dark":"#3B0764"},
    {"name":"Carbon Zinc","vibe":"developer tool code ide terminal dark neutral professional clean",
     "primary":"#3F3F46","secondary":"#52525B","cta":"#6366F1","bg":"#09090B",
     "bg_dark":"#09090B","surface":"#18181B","surface_dark":"#18181B","text":"#E4E4E7",
     "muted":"#71717A","border":"#27272A","border_dark":"#27272A"},
    {"name":"Champagne Blanc","vibe":"luxury wedding event premium elegant white minimal high-end brand",
     "primary":"#78716C","secondary":"#A8A29E","cta":"#D4A847","bg":"#FAFAF9",
     "bg_dark":"#1C1917","surface":"#FFFFFF","surface_dark":"#292524","text":"#1C1917",
     "muted":"#A8A29E","border":"#F5F5F4","border_dark":"#3F3734"},
    {"name":"Deep Space","vibe":"dark space cosmos astronomy sci-fi futuristic exploration tech",
     "primary":"#312E81","secondary":"#4338CA","cta":"#818CF8","bg":"#030712",
     "bg_dark":"#030712","surface":"#0F172A","surface_dark":"#0F172A","text":"#F8FAFC",
     "muted":"#64748B","border":"#1E293B","border_dark":"#1E293B"},
    {"name":"Terra Cotta","vibe":"mediterranean earthy artisan craft food restaurant lifestyle warm",
     "primary":"#9A3412","secondary":"#C2410C","cta":"#EA580C","bg":"#FFF7ED",
     "bg_dark":"#1A0500","surface":"#FFFFFF","surface_dark":"#2D0A00","text":"#1C0A00",
     "muted":"#78716C","border":"#FED7AA","border_dark":"#43100C"},
    {"name":"Arctic White","vibe":"medical health clinical clean trust minimal white space saas",
     "primary":"#0369A1","secondary":"#0284C7","cta":"#0EA5E9","bg":"#FFFFFF",
     "bg_dark":"#0C1828","surface":"#F0F9FF","surface_dark":"#0F2B47","text":"#0C1828",
     "muted":"#94A3B8","border":"#E0F2FE","border_dark":"#1E3A5F"},
    {"name":"Plum Noir","vibe":"dark editorial magazine fashion luxury moody dramatic premium",
     "primary":"#6B21A8","secondary":"#7E22CE","cta":"#A855F7","bg":"#0D0010",
     "bg_dark":"#0D0010","surface":"#1A0022","surface_dark":"#1A0022","text":"#FAF5FF",
     "muted":"#C084FC","border":"#2D1448","border_dark":"#2D1448"},
    {"name":"Mint Fresh","vibe":"health fitness wellness app clean fresh modern d2c consumer",
     "primary":"#0D9488","secondary":"#14B8A6","cta":"#2DD4BF","bg":"#F0FDFA",
     "bg_dark":"#042F2E","surface":"#FFFFFF","surface_dark":"#134E4A","text":"#134E4A",
     "muted":"#6B7280","border":"#CCFBF1","border_dark":"#115E59"},
]

# ═══════════════════════════════════════════════════════════════════════
# TYPOGRAPHY — 25+ expert pairings
# ═══════════════════════════════════════════════════════════════════════
TYPOGRAPHY = [
    {"name":"Outfit + Inter","vibe":"modern clean saas tech startup professional minimal",
     "heading":"Outfit","body":"Inter","weights_h":"400,600,700,800","weights_b":"400,500",
     "url":"https://fonts.google.com/specimen/Outfit",
     "import":"@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500&display=swap');"},
    {"name":"Plus Jakarta Sans + DM Sans","vibe":"modern bold premium saas startup product landing page",
     "heading":"Plus Jakarta Sans","body":"DM Sans","weights_h":"600,700,800","weights_b":"400,500",
     "url":"https://fonts.google.com/specimen/Plus+Jakarta+Sans",
     "import":"@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');"},
    {"name":"Space Grotesk + Space Mono","vibe":"developer tool code technical mono dark terminal",
     "heading":"Space Grotesk","body":"Space Mono","weights_h":"400,500,700","weights_b":"400,700",
     "url":"https://fonts.google.com/specimen/Space+Grotesk",
     "import":"@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');"},
    {"name":"Fraunces + DM Sans","vibe":"editorial luxury premium fashion magazine elegant serif dramatic",
     "heading":"Fraunces","body":"DM Sans","weights_h":"400,600,700,900","weights_b":"400,500",
     "url":"https://fonts.google.com/specimen/Fraunces",
     "import":"@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,900;1,400&family=DM+Sans:wght@400;500&display=swap');"},
    {"name":"Syne + Nunito","vibe":"creative agency bold playful unique geometric modern",
     "heading":"Syne","body":"Nunito","weights_h":"400,600,700,800","weights_b":"400,500,600",
     "url":"https://fonts.google.com/specimen/Syne",
     "import":"@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Nunito:wght@400;500;600&display=swap');"},
    {"name":"Clash Display + Switzer","vibe":"neobrutalism bold graphic design agency independent brand",
     "heading":"Clash Display","body":"Switzer","weights_h":"400,600,700","weights_b":"400,500",
     "url":"https://www.fontshare.com/fonts/clash-display",
     "import":"/* Fontshare */ @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,600,700&f[]=switzer@400,500&display=swap');"},
    {"name":"Geist + Geist Mono","vibe":"developer tool vercel modern dark monospace code terminal",
     "heading":"Geist","body":"Geist Mono","weights_h":"400,600,700","weights_b":"400,500",
     "url":"https://vercel.com/font",
     "import":"/* npm install geist */ import { GeistSans, GeistMono } from 'geist/font'"},
    {"name":"Manrope + Inter","vibe":"professional b2b enterprise clean trustworthy corporate saas",
     "heading":"Manrope","body":"Inter","weights_h":"500,600,700,800","weights_b":"400,500",
     "url":"https://fonts.google.com/specimen/Manrope",
     "import":"@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500&display=swap');"},
    {"name":"Cabinet Grotesk + Satoshi","vibe":"premium brand startup modern geometric bold clean",
     "heading":"Cabinet Grotesk","body":"Satoshi","weights_h":"400,500,700,800","weights_b":"400,500",
     "url":"https://www.fontshare.com/fonts/cabinet-grotesk",
     "import":"@import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&f[]=satoshi@400,500&display=swap');"},
    {"name":"Melodrama + General Sans","vibe":"editorial luxury fashion art creative serif display bold",
     "heading":"Melodrama","body":"General Sans","weights_h":"400,700","weights_b":"400,500",
     "url":"https://www.fontshare.com/fonts/melodrama",
     "import":"@import url('https://api.fontshare.com/v2/css?f[]=melodrama@400,700&f[]=general-sans@400,500&display=swap');"},
    {"name":"Bricolage Grotesque + Instrument Sans","vibe":"indie hacker product bold modern energetic unique",
     "heading":"Bricolage Grotesque","body":"Instrument Sans","weights_h":"400,600,700,800","weights_b":"400,500",
     "url":"https://fonts.google.com/specimen/Bricolage+Grotesque",
     "import":"@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Instrument+Sans:wght@400;500&display=swap');"},
    {"name":"Lora + Source Sans 3","vibe":"blog content editorial news journalism reading clarity",
     "heading":"Lora","body":"Source Sans 3","weights_h":"400,600,700","weights_b":"400,600",
     "url":"https://fonts.google.com/specimen/Lora",
     "import":"@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@400;600&display=swap');"},
    {"name":"Unbounded + Rajdhani","vibe":"gaming crypto web3 bold futuristic techno angular",
     "heading":"Unbounded","body":"Rajdhani","weights_h":"400,700,900","weights_b":"400,500,600",
     "url":"https://fonts.google.com/specimen/Unbounded",
     "import":"@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Rajdhani:wght@400;500;600&display=swap');"},
]

# ═══════════════════════════════════════════════════════════════════════
# STYLES — 30+ design aesthetic profiles with multi-library component picks
# ═══════════════════════════════════════════════════════════════════════
STYLES = [
    {"name":"Dark Aurora Premium",
     "vibe":"dark premium ai startup gradient aurora glow modern saas sophisticated",
     "bg_approach":"Deep near-black (#09090B) with aurora blur gradients as hero background",
     "effects":"aurora blur gradients, glassmorphism cards, glow borders, shimmer text",
     "anti_patterns":"bright backgrounds, flat design, heavy borders, solid fills",
     "react_bits":["Aurora","SpotlightCard","MagneticButton","ShinyText","BlurText"],
     "aceternity":["AuroraBackground","SparklesCore","BackgroundBeams","MovingBorder"],
     "magicui":["ShimmerButton","BorderBeam","GridPattern","MagicCard"],
     "shadcn":["Card","Badge","Dialog"],
     "primary_lib":"react_bits"},
    {"name":"Minimal SaaS Light",
     "vibe":"minimal clean light professional saas b2b tool dashboard modern crisp",
     "bg_approach":"Clean white (#FFFFFF) with subtle gray sections (#F9FAFB)",
     "effects":"subtle card shadows, clean hover transitions, smooth scroll",
     "anti_patterns":"animations everywhere, dark sections, heavy gradients",
     "react_bits":["FadeContent","ScrollVelocity","TiltedCard","CountUp"],
     "aceternity":[],
     "magicui":["NumberTicker","AnimatedSubscribeButton","MarqueeComponent"],
     "shadcn":["Card","Button","Badge","Table","Avatar"],
     "primary_lib":"shadcn"},
    {"name":"Neobrutalism",
     "vibe":"bold brutal graphic design independent brand indie unique offset border",
     "bg_approach":"Off-white or bright colored background, heavy black borders, offset shadows",
     "effects":"hard box shadows (4-8px offset), thick borders, bold hover states",
     "anti_patterns":"rounded corners, subtle shadows, gradients, glassmorphism",
     "react_bits":["MagneticButton","FadeContent"],
     "aceternity":[],
     "magicui":["RainbowButton","AnimatedBorderCard"],
     "shadcn":["Card","Button","Badge"],
     "primary_lib":"shadcn"},
    {"name":"Glassmorphism Dark",
     "vibe":"glass frost blur dark cards overlay transparent modern web3 premium",
     "bg_approach":"Dark gradient background, frosted glass cards (backdrop-blur + bg-white/10)",
     "effects":"backdrop-blur, semi-transparent cards, border-white/20, inner glow",
     "anti_patterns":"solid opaque cards, light backgrounds, heavy shadows",
     "react_bits":["Aurora","Particles","SpotlightCard","StarBorder"],
     "aceternity":["BackgroundBeams","SparklesCore"],
     "magicui":["MagicCard","ShineBorder","BorderBeam"],
     "shadcn":["Card"],
     "primary_lib":"react_bits"},
    {"name":"Editorial Serif",
     "vibe":"editorial luxury magazine fashion blog content elegant serif premium brand",
     "bg_approach":"Cream or white background, generous whitespace, large serif headlines",
     "effects":"text reveals, scroll-based animations, subtle hover underlines",
     "anti_patterns":"tech UI patterns, rounded cards, heavy gradients",
     "react_bits":["BlurText","TextReveal","FadeContent","ScrollVelocity"],
     "aceternity":["TextGenerateEffect","StickyScrollReveal"],
     "magicui":["WordFadeIn","GradualSpacing"],
     "shadcn":["Card","Separator"],
     "primary_lib":"react_bits"},
    {"name":"Gradient Mesh Aurora",
     "vibe":"colorful mesh gradient aurora creative agency vibrant rainbow modern",
     "bg_approach":"Mesh/aurora gradient backgrounds, organic color blobs, no hard edges",
     "effects":"mesh gradients, color orbs, blurred shapes, smooth animations",
     "anti_patterns":"solid backgrounds, sharp edges, monochrome",
     "react_bits":["Aurora","Orb","Silk","ShinyText","GradientText"],
     "aceternity":["AuroraBackground","ColourfulText"],
     "magicui":["Ripple","AnimatedBeam","SparklesText"],
     "shadcn":["Card"],
     "primary_lib":"react_bits"},
    {"name":"Gaming Cyber",
     "vibe":"gaming cyber esports neon dark electric rgb bold angular futuristic",
     "bg_approach":"True dark (#050505) with neon accents, scanline effects, angular elements",
     "effects":"neon glows, scanlines, angular clip-paths, RGB borders",
     "anti_patterns":"rounded everything, soft colors, clean minimal",
     "react_bits":["Ballpit","DotGrid","FuzzyText","GradientText","Crosshair"],
     "aceternity":["BackgroundBoxes","Vortex","Spotlight"],
     "magicui":["Particles","Confetti"],
     "shadcn":["Card","Badge"],
     "primary_lib":"aceternity"},
    {"name":"Corporate Clean",
     "vibe":"enterprise corporate b2b professional trustworthy clean dashboard finance",
     "bg_approach":"Clean white/light-gray, structured layouts, professional typography",
     "effects":"minimal: clean hover states, subtle shadows, smooth transitions",
     "anti_patterns":"decorative animations, flashy effects, dark mode, neon",
     "react_bits":["FadeContent","AnimatedList","CountUp"],
     "aceternity":[],
     "magicui":["NumberTicker","AnimatedBeam"],
     "shadcn":["Table","Card","Badge","Select","Dialog","Sidebar"],
     "primary_lib":"shadcn"},
    {"name":"Dark Developer Tool",
     "vibe":"developer tool ide code dark terminal cli technical mono geist",
     "bg_approach":"Zinc dark (#09090B) or GitHub dark, monospace accents, code aesthetic",
     "effects":"subtle highlights, clean transitions, focus states, terminal feel",
     "anti_patterns":"decorative backgrounds, serif fonts, colorful gradients",
     "react_bits":["DotGrid","FadeContent","AnimatedList","ScrollVelocity"],
     "aceternity":[],
     "magicui":["BorderBeam","AnimatedBorderCard","TypingAnimation"],
     "shadcn":["Card","Badge","Button","CodeBlock"],
     "primary_lib":"shadcn"},
    {"name":"Luxury Premium Dark",
     "vibe":"luxury premium exclusive high-end brand gold dark elite sophisticated",
     "bg_approach":"Near-black backgrounds, gold/amber accents, high contrast, full-bleed imagery",
     "effects":"smooth reveals, gold shimmer, editorial typography moments",
     "anti_patterns":"playful, colorful, crowded, rounded corners everywhere",
     "react_bits":["BlurText","TextReveal","TiltedCard","ShinyText"],
     "aceternity":["HeroParallax","MacbookScroll","CardStack"],
     "magicui":["WordFadeIn","BorderBeam"],
     "shadcn":["Card","Avatar"],
     "primary_lib":"aceternity"},
    {"name":"Warm Minimal",
     "vibe":"warm organic lifestyle wellness brand consumer d2c cream off-white",
     "bg_approach":"Cream/off-white backgrounds, warm typography, organic shapes",
     "effects":"gentle fade-ins, warm hover states, subtle texture",
     "anti_patterns":"cold blues, stark white, heavy tech patterns",
     "react_bits":["FadeContent","BounceCards","Silk"],
     "aceternity":[],
     "magicui":["WordPullUp","FadeText"],
     "shadcn":["Card","Button","Avatar"],
     "primary_lib":"shadcn"},
    {"name":"3D Immersive",
     "vibe":"3d immersive three.js webgl interactive creative agency portfolio",
     "bg_approach":"Dark background with 3D elements, WebGL canvas, interactive depth",
     "effects":"3D card tilts, parallax depth, perspective transforms, canvas animations",
     "anti_patterns":"flat 2D only, no interaction, minimal",
     "react_bits":["TiltedCard","Ballpit","Balatro"],
     "aceternity":["ThreeDCardEffect","HeroParallax","MacbookScroll","WorldMap"],
     "magicui":["OrbitingCircles","AnimatedBeam"],
     "shadcn":["Card"],
     "primary_lib":"aceternity"},
]

# ═══════════════════════════════════════════════════════════════════════
# LIBRARY CATALOG — Multi-library component selection intelligence
# ═══════════════════════════════════════════════════════════════════════
LIBRARY_CATALOG = {
    "react-bits": {
        "name": "React Bits",
        "url": "https://reactbits.dev",
        "install_method": "npx shadcn@latest add",
        "base_install_url": "https://reactbits.dev/r/",
        "requires": ["tailwindcss"],
        "optional": ["framer-motion"],
        "best_for": ["hero-backgrounds","text-animations","scroll-effects","interactive-cards","cursors"],
        "style_fit": ["Dark Aurora Premium","Glassmorphism Dark","Gradient Mesh Aurora","Editorial Serif"],
        "components": {
            "backgrounds": [
                {"name":"Aurora","desc":"Multi-hue animated aurora blur gradient — signature dark hero bg","dark_only":True,"wow_factor":10},
                {"name":"Particles","desc":"Interactive floating particle field, connects on hover","wow_factor":8},
                {"name":"Silk","desc":"Flowing silk fluid simulation, dark or light","wow_factor":9},
                {"name":"Orb","desc":"Glowing color orb, subtle ambient background element","wow_factor":7},
                {"name":"Ripple","desc":"Expanding concentric rings from center point","wow_factor":7},
                {"name":"DotGrid","desc":"Animated dot matrix grid, technical aesthetic","wow_factor":6},
                {"name":"Ballpit","desc":"Physics-based bouncing balls, playful/fun","wow_factor":8},
                {"name":"Balatro","desc":"Card swirl shader background, gaming/bold aesthetic","wow_factor":9},
                {"name":"LetterGlitch","desc":"Glitch text effect for names or words","wow_factor":8},
            ],
            "text": [
                {"name":"SplitText","desc":"Splits headline into chars/words for staggered entrance","wow_factor":9},
                {"name":"BlurText","desc":"Words reveal blur→sharp, cinematic quality","wow_factor":9},
                {"name":"ShinyText","desc":"Moving light shimmer across muted text","wow_factor":7},
                {"name":"GradientText","desc":"Animated gradient color sweep across text","wow_factor":8},
                {"name":"FuzzyText","desc":"Glitch/fuzzy distortion on hover","wow_factor":8},
                {"name":"CircularText","desc":"Text arranged in circle, optionally rotating","wow_factor":7},
                {"name":"CountUp","desc":"Number animates from 0 to target on enter","wow_factor":8},
                {"name":"TextReveal","desc":"Words revealed progressively on scroll","wow_factor":8},
                {"name":"PixelTransition","desc":"Pixel-dissolve between two states","wow_factor":9},
                {"name":"TrueFocus","desc":"Focus ring animates between words on hover","wow_factor":7},
            ],
            "cards": [
                {"name":"SpotlightCard","desc":"Mouse-following spotlight glow on card surface","wow_factor":9},
                {"name":"TiltedCard","desc":"3D perspective tilt tracking mouse position","wow_factor":8},
                {"name":"BounceCards","desc":"Cards with spring bounce collision physics","wow_factor":9},
                {"name":"ScrollStack","desc":"Stacked cards that expand/stick on scroll","wow_factor":9},
                {"name":"StackedCards","desc":"Fan-out card stack on hover","wow_factor":8},
            ],
            "buttons": [
                {"name":"MagneticButton","desc":"Button pulled magnetically toward cursor","wow_factor":9},
                {"name":"StarBorder","desc":"Animated rotating star/shimmer border","wow_factor":8},
            ],
            "navigation": [
                {"name":"FlowingMenu","desc":"Full-screen menu with flowing image-on-hover animation","wow_factor":10},
                {"name":"DockExpandable","desc":"macOS-style dock that expands on hover","wow_factor":8},
            ],
            "effects": [
                {"name":"FadeContent","desc":"Clean fade+slide entrance triggered by scroll","wow_factor":6},
                {"name":"ScrollVelocity","desc":"Marquee text whose speed matches scroll velocity","wow_factor":8},
                {"name":"InfiniteScroll","desc":"Seamlessly looping horizontal/vertical list","wow_factor":7},
                {"name":"AnimatedList","desc":"Staggered list item entrance animations","wow_factor":7},
                {"name":"ImageTrail","desc":"Images follow cursor in a trail effect","wow_factor":10},
                {"name":"Crosshair","desc":"Custom crosshair cursor with accent color","wow_factor":7},
                {"name":"Spotlight","desc":"Mouse-following spotlight that illuminates content","wow_factor":8},
            ],
        }
    },
    "aceternity": {
        "name": "Aceternity UI",
        "url": "https://ui.aceternity.com/components",
        "install_method": "copy",
        "base_install_url": "https://ui.aceternity.com/components/",
        "requires": ["tailwindcss","framer-motion","clsx","tailwind-merge"],
        "optional": ["three","@react-three/fiber"],
        "best_for": ["hero-sections","dark-premium","3d-effects","unique-text","spotlight-effects"],
        "style_fit": ["Dark Aurora Premium","Gaming Cyber","3D Immersive","Luxury Premium Dark"],
        "components": {
            "backgrounds": [
                {"name":"AuroraBackground","desc":"Conic gradient aurora with animated CSS vars","wow_factor":8},
                {"name":"BackgroundBeams","desc":"Converging beam lines to a focal point","wow_factor":9},
                {"name":"BackgroundBeamsWithCollision","desc":"Beams that collide and explode","wow_factor":10},
                {"name":"BackgroundGradientAnimation","desc":"Slow morphing mesh gradient","wow_factor":8},
                {"name":"WavyBackground","desc":"SVG wavy animated background lines","wow_factor":7},
                {"name":"Vortex","desc":"Spiraling particle vortex canvas animation","wow_factor":9},
                {"name":"BackgroundBoxes","desc":"Grid of colored boxes with wave animation","wow_factor":8},
                {"name":"ShootingStars","desc":"Animated shooting stars across dark sky","wow_factor":8},
                {"name":"Meteors","desc":"Diagonal meteor shower CSS animation","wow_factor":8},
            ],
            "hero": [
                {"name":"Spotlight","desc":"Large cursor spotlight that follows mouse on dark bg","wow_factor":9},
                {"name":"LampEffect","desc":"Overhead lamp-style conic light on dark surface","wow_factor":10},
                {"name":"HeroParallax","desc":"Grid of product images that parallax on scroll","wow_factor":10},
                {"name":"GoogleGeminiEffect","desc":"Gemini-inspired animated beam logo effect","wow_factor":10},
                {"name":"MacbookScroll","desc":"MacBook scrolls open to reveal your app screenshot","wow_factor":10},
                {"name":"ColourfulText","desc":"Each word cycles through colours on hover","wow_factor":8},
            ],
            "cards": [
                {"name":"CardStack","desc":"Stacked cards with automated cycling","wow_factor":8},
                {"name":"CardSpotlight","desc":"Radial spotlight follows mouse over card","wow_factor":9},
                {"name":"ThreeDCardEffect","desc":"True 3D perspective tilt with inner layers","wow_factor":9},
                {"name":"FocusCards","desc":"Grid that blurs non-focused cards on hover","wow_factor":9},
                {"name":"LayoutGrid","desc":"Masonry-style animated grid","wow_factor":8},
                {"name":"ExpandingCard","desc":"Card expands to reveal detail on click","wow_factor":8},
                {"name":"TextRevealCard","desc":"Hover reveals hidden text on a card","wow_factor":9},
                {"name":"MovingBorder","desc":"Animated border that travels around card edges","wow_factor":9},
            ],
            "text": [
                {"name":"TextGenerateEffect","desc":"Words appear one by one with opacity + blur","wow_factor":9},
                {"name":"TypewriterEffect","desc":"Typewriter with cursor blinking","wow_factor":7},
                {"name":"FlipWords","desc":"Words flip/rotate to the next value in a list","wow_factor":8},
                {"name":"HeroHighlight","desc":"Highlight underline animates into view on hero text","wow_factor":8},
                {"name":"NumberTicker","desc":"Large number counts up on scroll enter","wow_factor":7},
                {"name":"AnimatedTooltip","desc":"Avatar stack with animated name tooltip on hover","wow_factor":8},
            ],
            "navigation": [
                {"name":"FloatingNavbar","desc":"Nav that appears/hides based on scroll direction","wow_factor":9},
                {"name":"StickyScrollReveal","desc":"Sidebar nav highlights as content sections scroll","wow_factor":9},
                {"name":"MultiStepLoader","desc":"Cinematic multi-step loading sequence","wow_factor":8},
            ],
        }
    },
    "magicui": {
        "name": "Magic UI",
        "url": "https://magicui.design",
        "install_method": "npx magicui-cli@latest add",
        "base_install_url": "https://magicui.design/docs/components/",
        "requires": ["tailwindcss","framer-motion"],
        "optional": [],
        "best_for": ["saas-buttons","number-animations","border-effects","marquee","bento-grid"],
        "style_fit": ["Minimal SaaS Light","Dark Aurora Premium","Dark Developer Tool","Corporate Clean"],
        "components": {
            "buttons": [
                {"name":"ShimmerButton","desc":"Dark button with moving shimmer highlight — premium CTA","wow_factor":9},
                {"name":"RainbowButton","desc":"Animated rainbow border on black button","wow_factor":9},
                {"name":"InteractiveHoverButton","desc":"Arrow slides in from left on hover","wow_factor":8},
                {"name":"PulsatingButton","desc":"Pulsing ring radiates from button","wow_factor":7},
                {"name":"AnimatedSubscribeButton","desc":"Subscribe CTA that animates to confirmed state","wow_factor":8},
                {"name":"CoolMode","desc":"Confetti/particle burst on button click","wow_factor":9},
            ],
            "text": [
                {"name":"TypingAnimation","desc":"Typewriter with configurable typing speed","wow_factor":7},
                {"name":"WordPullUp","desc":"Words pull up into place with spring physics","wow_factor":8},
                {"name":"WordFadeIn","desc":"Words fade in staggered from left","wow_factor":7},
                {"name":"GradualSpacing","desc":"Letters spread apart gradually on mount","wow_factor":8},
                {"name":"SparklesText","desc":"Stars/sparkles animate around highlighted text","wow_factor":9},
                {"name":"NumberTicker","desc":"Large stat number counts up on viewport enter","wow_factor":8},
                {"name":"AnimatedGradientText","desc":"Gradient sweeps across text continuously","wow_factor":8},
                {"name":"HyperText","desc":"Scrambled-letters-resolve animation (Matrix style)","wow_factor":9},
                {"name":"BoxReveal","desc":"Box wipes across to reveal text","wow_factor":8},
            ],
            "backgrounds": [
                {"name":"GridPattern","desc":"Subtle grid lines as section/hero bg","wow_factor":6},
                {"name":"DotPattern","desc":"Dot matrix background pattern","wow_factor":6},
                {"name":"AnimatedGridPattern","desc":"Grid pattern with animated highlighted cells","wow_factor":8},
                {"name":"Ripple","desc":"Expanding concentric circles from center","wow_factor":7},
                {"name":"Particles","desc":"Canvas particle system, interactive","wow_factor":8},
                {"name":"Confetti","desc":"Confetti burst on trigger — celebration state","wow_factor":8},
                {"name":"Meteors","desc":"Diagonal meteor CSS animation","wow_factor":7},
                {"name":"FlickeringGrid","desc":"Grid of cells that flicker on and off","wow_factor":8},
                {"name":"RetroGrid","desc":"Vanishing point perspective grid (80s aesthetic)","wow_factor":9},
            ],
            "borders": [
                {"name":"BorderBeam","desc":"Beam of light travels around component border","wow_factor":9},
                {"name":"AnimatedBeam","desc":"Beam travels along an SVG path between elements","wow_factor":10},
                {"name":"ShineBorder","desc":"Metallic shine sweeps around border","wow_factor":8},
                {"name":"MagicCard","desc":"Card with radial glow following mouse","wow_factor":9},
                {"name":"NeonGradientCard","desc":"Neon animated gradient border card","wow_factor":9},
            ],
            "layout": [
                {"name":"BentoGrid","desc":"Responsive bento-box grid layout","wow_factor":8},
                {"name":"MarqueeComponent","desc":"Infinite horizontal or vertical marquee — logo strips","wow_factor":7},
                {"name":"OrbitingCircles","desc":"Icons orbit a central element","wow_factor":9},
                {"name":"AnimatedList","desc":"Items enter staggered from below","wow_factor":7},
                {"name":"Dock","desc":"macOS dock with icon magnification","wow_factor":8},
            ],
        }
    },
    "originui": {
        "name": "Origin UI",
        "url": "https://originui.com",
        "install_method": "copy",
        "requires": ["tailwindcss","react-hook-form","zod"],
        "best_for": ["production-forms","advanced-inputs","professional-ui"],
        "style_fit": ["Corporate Clean","Minimal SaaS Light","Dark Developer Tool"],
        "components": {
            "inputs": [
                {"name":"Input with label inline","desc":"Floating label inside input","wow_factor":6},
                {"name":"Input with icon prefix","desc":"Icon inside left of input","wow_factor":6},
                {"name":"Input with show/hide toggle","desc":"Password with eye toggle","wow_factor":7},
                {"name":"Input with character count","desc":"Character counter below input","wow_factor":6},
                {"name":"OTP Input","desc":"Six-box OTP code input with auto-advance","wow_factor":8},
                {"name":"Phone input","desc":"Country flag prefix + formatted phone","wow_factor":7},
                {"name":"Combo input","desc":"Combined select+input for complex filters","wow_factor":7},
                {"name":"Tags input","desc":"Multi-tag input with removable chips","wow_factor":8},
            ],
            "buttons": [
                {"name":"Button loading state","desc":"Spinner replaces icon on click","wow_factor":7},
                {"name":"Split button","desc":"Primary action + dropdown arrow split","wow_factor":7},
                {"name":"Social buttons","desc":"Google/GitHub OAuth style buttons","wow_factor":7},
            ],
        }
    },
    "shadcn": {
        "name": "shadcn/ui",
        "url": "https://ui.shadcn.com",
        "install_method": "npx shadcn@latest add",
        "base_install_url": "",
        "requires": ["tailwindcss","radix-ui"],
        "best_for": ["accessible-components","forms","dialogs","navigation","tables","dashboards"],
        "style_fit": ["Minimal SaaS Light","Corporate Clean","Dark Developer Tool","Warm Minimal"],
        "components": {
            "core": ["Button","Input","Card","Badge","Avatar","Separator","Skeleton"],
            "overlay": ["Dialog","Sheet","Drawer","Popover","Tooltip","AlertDialog","HoverCard"],
            "forms": ["Form","Select","Checkbox","RadioGroup","Switch","Textarea","Slider","DatePicker"],
            "navigation": ["NavigationMenu","Breadcrumb","Tabs","Sidebar","Menubar","DropdownMenu"],
            "data": ["Table","DataTable","Accordion","Collapsible","Command","Combobox"],
            "feedback": ["Toast","Alert","Progress","Sonner"],
        }
    },
    "kiboui": {
        "name": "Kibo UI",
        "url": "https://www.kiboui.com",
        "install_method": "npx kiui@latest add",
        "requires": ["tailwindcss","shadcn/ui"],
        "best_for": ["enhanced-shadcn","advanced-select","date-range","multi-select","kanban"],
        "style_fit": ["Minimal SaaS Light","Corporate Clean","Dark Developer Tool"],
        "components": {
            "enhanced": [
                {"name":"MultiSelect","desc":"Shadcn select with checkboxes and search","wow_factor":7},
                {"name":"DateRangePicker","desc":"Two-calendar date range selector","wow_factor":8},
                {"name":"TagInput","desc":"Tagging input with autocomplete","wow_factor":7},
                {"name":"RichTextEditor","desc":"WYSIWYG editor component","wow_factor":7},
                {"name":"Kanban","desc":"Drag-and-drop kanban board","wow_factor":9},
                {"name":"Timeline","desc":"Vertical timeline with icons","wow_factor":7},
                {"name":"FileUpload","desc":"Drag-and-drop file upload zone","wow_factor":8},
                {"name":"ColorPicker","desc":"Hue/saturation/value color picker","wow_factor":7},
            ]
        }
    },
    "flowbite": {
        "name": "Flowbite",
        "url": "https://flowbite.com",
        "install_method": "npm install flowbite-react",
        "requires": ["tailwindcss"],
        "best_for": ["dashboards","navigation","tables","forms","admin-panels","vue-projects"],
        "style_fit": ["Corporate Clean","Minimal SaaS Light"],
        "components": {
            "layout": ["Navbar","Sidebar","Footer","Breadcrumb","Tabs"],
            "data": ["Table","Pagination","Badge","Timeline"],
            "forms": ["Select","Checkbox","Toggle","FileInput","Datepicker","RangeSlider"],
            "overlay": ["Modal","Drawer","Dropdown","Tooltip","Popover"],
            "feedback": ["Alert","Toast","Progress","Spinner"],
        }
    },
    "mvpblocks": {
        "name": "MVPBlocks",
        "url": "https://www.mvpblocks.app",
        "install_method": "copy",
        "requires": ["tailwindcss","shadcn/ui"],
        "best_for": ["full-section-blocks","rapid-mvp","landing-pages","complete-layouts"],
        "style_fit": ["Minimal SaaS Light","Dark Aurora Premium"],
        "components": {
            "sections": [
                {"name":"Hero Block","desc":"Complete hero with headline, CTA, screenshot","wow_factor":8},
                {"name":"Feature Grid","desc":"3-column features with icons","wow_factor":7},
                {"name":"Testimonials","desc":"Avatar + quote testimonial grid","wow_factor":7},
                {"name":"Pricing","desc":"3-tier pricing with monthly/annual toggle","wow_factor":8},
                {"name":"CTA Section","desc":"Full-width CTA with gradient bg","wow_factor":7},
                {"name":"Stats Row","desc":"4-stat metrics row with counters","wow_factor":7},
                {"name":"Logo Strip","desc":"Logo marquee for social proof","wow_factor":6},
                {"name":"FAQ Accordion","desc":"Expandable FAQ section","wow_factor":6},
            ]
        }
    },
    "stunning-ui": {
        "name": "Stunning UI",
        "url": "https://stunning-ui.com",
        "install_method": "copy",
        "requires": ["vue","tailwindcss"],
        "best_for": ["vue-animations","nuxt-components","vue-interactive"],
        "style_fit": ["Dark Aurora Premium","Glassmorphism Dark","Gradient Mesh Aurora"],
        "components": {
            "vue": [
                {"name":"AnimatedGradient","desc":"Vue animated gradient background","wow_factor":8},
                {"name":"MagneticButton","desc":"Vue magnetic cursor button","wow_factor":9},
                {"name":"GlowCard","desc":"Vue card with glow hover effect","wow_factor":8},
                {"name":"TextScramble","desc":"Vue text scramble/glitch animation","wow_factor":8},
                {"name":"StaggerList","desc":"Vue staggered list entrance","wow_factor":7},
            ]
        }
    },
    "chakra": {
        "name": "Chakra UI",
        "url": "https://chakra-ui.com",
        "install_method": "npm install @chakra-ui/react",
        "requires": ["react"],
        "best_for": ["theming","semantic-tokens","accessible","consumer-apps"],
        "style_fit": ["Minimal SaaS Light","Warm Minimal","Lavender"],
        "components": {
            "core": ["Box","Flex","Grid","Stack","Button","Input","Text","Heading","Icon","Image","Badge","Avatar"],
            "overlay": ["Modal","Drawer","Popover","Tooltip","Alert","Toast"],
            "forms": ["FormControl","FormLabel","FormErrorMessage","Select","Checkbox","Switch","Slider"],
            "disclosure": ["Accordion","Tabs","Collapse"],
        }
    },
    "nextui": {
        "name": "NextUI / HeroUI",
        "url": "https://nextui.org",
        "install_method": "npm install @nextui-org/react",
        "requires": ["react","tailwindcss","framer-motion"],
        "best_for": ["clean-components","good-defaults","react-accessible"],
        "style_fit": ["Minimal SaaS Light","Nordic Frost","Corporate Clean"],
        "components": {
            "core": ["Button","Chip","Avatar","Badge","Card","Image","Divider","Skeleton"],
            "forms": ["Input","Select","Checkbox","Switch","Slider","Autocomplete","DatePicker","DateRangePicker"],
            "overlay": ["Modal","Drawer","Popover","Tooltip","Dropdown"],
            "navigation": ["Navbar","Tabs","Breadcrumbs","Pagination","Link"],
            "data": ["Table","Accordion","Progress","CircularProgress","Spinner"],
        }
    },
    "skiper": {
        "name": "Skiper UI",
        "url": "https://skiper-ui.com",
        "install_method": "copy",
        "requires": ["tailwindcss","framer-motion"],
        "best_for": ["bold-design","unique-navigation","premium-hero","statement-sections"],
        "style_fit": ["Neobrutalism","Dark Aurora Premium","Gaming Cyber"],
        "components": {
            "special": [
                {"name":"SkiperNav","desc":"Unique animated navigation with bold typography","wow_factor":9},
                {"name":"HeroParallax","desc":"Layered parallax hero with multiple elements","wow_factor":9},
                {"name":"FeatureHighlight","desc":"Bold feature section with oversized numbers","wow_factor":8},
                {"name":"PricingCard","desc":"Distinctive pricing cards with animation","wow_factor":8},
            ]
        }
    },
}

# ═══════════════════════════════════════════════════════════════════════
# UX LAWS — 20 laws with design application guidance
# ═══════════════════════════════════════════════════════════════════════
UX_LAWS = [
    {"law":"Fitts's Law","summary":"Time to acquire a target is function of distance and target size",
     "apply":"Min 44px tap targets. Primary CTA: largest button. Size = priority.",
     "keywords":"button size tap target mobile click cta primary action"},
    {"law":"Hick's Law","summary":"More choices = longer decision time (log scale)",
     "apply":"Max 5-7 nav items. ONE primary CTA per screen. Use progressive disclosure.",
     "keywords":"navigation choices options menu decision simplify"},
    {"law":"Miller's Law","summary":"Working memory holds 7±2 items",
     "apply":"Group features into chunks of 3. List items in sets of 3-7. Paginate long lists.",
     "keywords":"information grouping cards features list cognitive load"},
    {"law":"Jakob's Law","summary":"Users spend most time on other sites — expect familiar patterns",
     "apply":"Logo top-left. Nav top. Search top-right. Cart top-right. Don't reinvent.",
     "keywords":"convention familiar pattern navigation layout structure"},
    {"law":"Von Restorff Effect","summary":"Unique items are remembered better",
     "apply":"ONE element uses CTA color. Pricing: one card elevated. Nav: one CTA button only.",
     "keywords":"cta button highlight color accent contrast stand out"},
    {"law":"Peak-End Rule","summary":"Experiences judged by peak moment and end, not average",
     "apply":"Make hero and success/completion states exceptional. Empty states helpful.",
     "keywords":"hero success state onboarding impression experience"},
    {"law":"Aesthetic-Usability Effect","summary":"Beautiful = perceived as easier to use",
     "apply":"Polish builds trust. Animations reduce perceived load time. Beauty enables forgiveness.",
     "keywords":"design polish animation quality trust beautiful"},
    {"law":"Law of Proximity","summary":"Elements near each other are perceived as related",
     "apply":"Label 4px above its input. Related items: 8px gap. Sections: 64-96px gap.",
     "keywords":"spacing whitespace layout grouping label form"},
    {"law":"Law of Prägnanz","summary":"Perceive ambiguous forms as simplest interpretation",
     "apply":"When in doubt, simplify. Remove every element that doesn't earn its place.",
     "keywords":"simplify reduce minimal whitespace cognitive load clean"},
    {"law":"Serial Position Effect","summary":"First and last items best remembered",
     "apply":"Put most important nav first or last. Lead features list with best feature.",
     "keywords":"order list navigation feature first last priority"},
    {"law":"Doherty Threshold","summary":"Productivity soars when response time < 400ms",
     "apply":"Optimistic UI. Skeleton loaders >100ms. Progress bars >400ms.",
     "keywords":"loading performance skeleton progress feedback fast"},
    {"law":"Zeigarnik Effect","summary":"People remember incomplete tasks better than complete ones",
     "apply":"Profile completion %. Onboarding checklists. Step counters. Progress bars.",
     "keywords":"progress completion onboarding checklist steps todo"},
    {"law":"Law of Common Region","summary":"Elements in bounded regions are perceived as groups",
     "apply":"Card borders group related content. Backgrounds distinguish page sections.",
     "keywords":"card border section group container background"},
    {"law":"Tesler's Law (Conservation of Complexity)","summary":"Every system has irreducible complexity",
     "apply":"Don't push complexity to users. Absorb it in code. Form validation server-side.",
     "keywords":"complexity form validation ux simplify user"},
    {"law":"Postel's Law","summary":"Be conservative in output, liberal in input",
     "apply":"Accept various input formats (phone: +1-555-555, 15555555, etc). Output consistently formatted.",
     "keywords":"form input validation flexible format phone email"},
    {"law":"Goal-Gradient Effect","summary":"Effort increases as goal gets closer",
     "apply":"Show progress bars. '3 of 5 steps done' near end. Reward completion with animation.",
     "keywords":"progress bar steps completion reward gamification"},
    {"law":"Weber's Law","summary":"JND is proportional to the magnitude of the stimulus",
     "apply":"Small elements need bigger % change to feel different. Large type: 2px = noticeable. Small text: 2px = invisible.",
     "keywords":"typography size change contrast threshold perceive"},
    {"law":"Occam's Razor","summary":"Among competing solutions, the simplest is usually correct",
     "apply":"If two layouts achieve the same goal, ship the simpler one. Less is almost always more.",
     "keywords":"simplify design choice layout component selection"},
]

# ═══════════════════════════════════════════════════════════════════════
# PAGE PATTERNS
# ═══════════════════════════════════════════════════════════════════════
PAGE_PATTERNS = [
    {"type":"landing","name":"Hero-Centric SaaS Landing",
     "sections":["Sticky nav (logo + links + single CTA button)",
                 "Hero — headline + sub + CTA pair + social proof + product screenshot",
                 "Logo strip — 'Trusted by' with ScrollVelocity logos",
                 "Problem/Solution — Before (pain) → After (benefit) in 3 columns",
                 "Features — alternating large demo + copy, SpotlightCard grid",
                 "Social proof — stat counters + testimonials BounceCards",
                 "Pricing — 3 tiers, Pro card elevated with StarBorder",
                 "Final CTA — full-width with Orb/Ripple background",
                 "Footer — links + socials"],
     "cta_placement":"Hero (primary) + after features + final section",
     "conversion":"Repeat CTA every 2-3 sections. One primary action per section.",
     "react_bits":["Aurora","SplitText","MagneticButton","ScrollVelocity","SpotlightCard","StarBorder","CountUp","BounceCards"]},
    {"type":"dashboard","name":"Analytics Dashboard",
     "sections":["Fixed sidebar (240px) — logo, nav max 7 items, user at bottom",
                 "Sticky topbar — breadcrumb, search, notifications, avatar",
                 "KPI stat row — 4 cards with CountUp animations",
                 "Primary chart — full-width line/area chart",
                 "Secondary grid — table (2/3) + donut chart (1/3)",
                 "Data table with filter, sort, pagination"],
     "cta_placement":"Topbar action button + table row actions",
     "conversion":"Sidebar active state: bg-primary/10 + accent border-left",
     "react_bits":["CountUp","FadeContent","AnimatedList"]},
    {"type":"auth","name":"Split Auth Screen",
     "sections":["Left 50% — brand bg (Aurora/Silk/gradient) with tagline + social proof",
                 "Right 50% — logo + title + social auth (Google/GitHub) first + divider + email form",
                 "Below form — switch link (Sign up / Sign in)"],
     "cta_placement":"Primary submit button full-width inside form",
     "conversion":"Social auth above email form — reduces friction. One field per line.",
     "react_bits":["Silk","BlurText","FadeContent"]},
    {"type":"pricing","name":"3-Tier Pricing",
     "sections":["Section headline + annual/monthly toggle",
                 "3 pricing cards — Starter/Pro★/Enterprise",
                 "Pro card: ring-2 ring-primary shadow-xl scale-105 + 'Most Popular' badge",
                 "Feature comparison table (toggle show/hide)",
                 "FAQ Accordion — top 5 pricing objections",
                 "Risk-reversal line — 'Free to start, no credit card'"],
     "cta_placement":"Inside each pricing card",
     "conversion":"Pro card must visually break the pattern (Von Restorff).",
     "react_bits":["StarBorder","FadeContent","CountUp"]},
    {"type":"portfolio","name":"Creative Portfolio",
     "sections":["Fullscreen hero — name + role + ASCII/animated element",
                 "About — editorial layout, serif heading, photo",
                 "Work — ImageTrail on hover, or BounceCards gallery",
                 "Services/Skills — flowing list or grid",
                 "Contact — minimal form or email link"],
     "cta_placement":"Contact CTA in nav + end of page",
     "conversion":"Let the work speak. Less copy, more quality visuals.",
     "react_bits":["ImageTrail","FlowingMenu","TiltedCard","Silk","BlurText"]},
    {"type":"feature","name":"Product Feature Page",
     "sections":["Feature hero — name + icon + value prop + demo",
                 "How it works — 3 numbered steps",
                 "Specific benefits — 3 feature-specific wins",
                 "Customer quote — specific to this feature",
                 "Technical specs (if developer tool)",
                 "Related features — 3 cards",
                 "Feature-specific CTA"],
     "cta_placement":"Hero + end of page",
     "conversion":"CTA should be feature-specific: 'Try [Feature] free'",
     "react_bits":["StickyScrollReveal","FadeContent","SpotlightCard"]},
]

# ═══════════════════════════════════════════════════════════════════════
# SEARCH FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════
def _score(item: dict, query: str) -> int:
    q = query.lower()
    words = q.split()
    score = 0
    vibe = item.get("vibe","").lower()
    name = item.get("name","").lower()
    for w in words:
        if w in name: score += 10
        if w in vibe: score += 5
    return score

def search_palettes(query: str, n: int = 3) -> list:
    scored = sorted(PALETTES, key=lambda p: _score(p, query), reverse=True)
    return [p for p in scored if _score(p, query) > 0][:n] or PALETTES[:n]

def search_typography(query: str, n: int = 3) -> list:
    scored = sorted(TYPOGRAPHY, key=lambda t: _score(t, query), reverse=True)
    return [t for t in scored if _score(t, query) > 0][:n] or TYPOGRAPHY[:n]

def search_styles(query: str, n: int = 3) -> list:
    scored = sorted(STYLES, key=lambda s: _score(s, query), reverse=True)
    return [s for s in scored if _score(s, query) > 0][:n] or STYLES[:n]

def search_ux_laws(query: str, n: int = 3) -> list:
    q = query.lower()
    scored = [(u, sum(1 for w in q.split() if w in u.get("keywords","").lower() + u["law"].lower())) for u in UX_LAWS]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [u for u, s in scored if s > 0][:n] or UX_LAWS[:3]

def get_pattern(page_type: str) -> dict:
    q = page_type.lower()
    for p in PAGE_PATTERNS:
        if p["type"] in q or q in p["type"] or q in p["name"].lower():
            return p
    return PAGE_PATTERNS[0]

def select_components(product: str, style_name: str, framework: str = "react", dark: bool = True) -> dict:
    """Select the best components from the best library for this context."""
    q = f"{product} {style_name}".lower()
    # Find matching style
    style = next((s for s in STYLES if s["name"] == style_name), None)
    if not style:
        matched = search_styles(q, 1)
        style = matched[0] if matched else STYLES[0]
    
    result = {
        "primary_lib": style.get("primary_lib", "react_bits"),
        "selections": {},
        "install_commands": [],
    }
    
    # Background
    if dark:
        result["selections"]["background"] = {"lib":"react-bits","component":"Aurora","reason":"Signature dark premium hero background"}
    else:
        result["selections"]["background"] = {"lib":"magicui","component":"DotPattern","reason":"Subtle clean background for light design"}
    
    # Hero text
    result["selections"]["hero_text"] = {"lib":"react-bits","component":"SplitText","reason":"Staggered headline entrance is the signature moment"}
    
    # Sub-headline
    result["selections"]["sub_text"] = {"lib":"react-bits","component":"BlurText","reason":"Blur-to-sharp reveal feels premium and purposeful"}
    
    # CTA button
    if dark:
        result["selections"]["cta_button"] = {"lib":"magicui","component":"ShimmerButton","reason":"Moving shimmer makes CTA unmissable on dark bg"}
    else:
        result["selections"]["cta_button"] = {"lib":"react-bits","component":"MagneticButton","reason":"Magnetic pull creates delight + draws eye"}
    
    # Feature cards
    if "3d" in q or "immersive" in q:
        result["selections"]["feature_cards"] = {"lib":"aceternity","component":"ThreeDCardEffect","reason":"3D depth creates wow factor for key features"}
    elif dark:
        result["selections"]["feature_cards"] = {"lib":"react-bits","component":"SpotlightCard","reason":"Spotlight follows mouse — premium feel on dark bg"}
    else:
        result["selections"]["feature_cards"] = {"lib":"magicui","component":"MagicCard","reason":"Radial glow on hover adds sophistication"}
    
    # Stats
    result["selections"]["stats"] = {"lib":"react-bits","component":"CountUp","reason":"Animated numbers create momentum and excitement"}
    
    # Social proof  
    result["selections"]["testimonials"] = {"lib":"react-bits","component":"BounceCards","reason":"Stacked cards with physics feel alive vs static grid"}
    
    # Logo strip
    result["selections"]["logos"] = {"lib":"magicui","component":"MarqueeComponent","reason":"Infinite scroll is the standard for logo trust strips"}
    
    # Navigation (mobile)
    result["selections"]["mobile_menu"] = {"lib":"react-bits","component":"FlowingMenu","reason":"Full-screen flowing menu creates memorable mobile UX"}
    
    # Generate install commands
    rb_comps = [v["component"] for v in result["selections"].values() if v["lib"]=="react-bits"]
    mu_comps = [v["component"] for v in result["selections"].values() if v["lib"]=="magicui"]
    ac_comps = [v["component"] for v in result["selections"].values() if v["lib"]=="aceternity"]
    
    for c in rb_comps:
        result["install_commands"].append(f'npx shadcn@latest add "https://reactbits.dev/r/{c}"')
    # Magic UI: map component names to their CLI kebab-case install names
    MU_CLI_NAMES = {
        "ShimmerButton": "shimmer-button",
        "RainbowButton": "rainbow-button",
        "InteractiveHoverButton": "interactive-hover-button",
        "PulsatingButton": "pulsating-button",
        "AnimatedSubscribeButton": "animated-subscribe-button",
        "CoolMode": "cool-mode",
        "TypingAnimation": "typing-animation",
        "WordPullUp": "word-pull-up",
        "WordFadeIn": "word-fade-in",
        "GradualSpacing": "gradual-spacing",
        "SparklesText": "sparkles-text",
        "NumberTicker": "number-ticker",
        "AnimatedGradientText": "animated-gradient-text",
        "HyperText": "hyper-text",
        "BoxReveal": "box-reveal",
        "GridPattern": "grid-pattern",
        "DotPattern": "dot-pattern",
        "AnimatedGridPattern": "animated-grid-pattern",
        "Ripple": "ripple",
        "FlickeringGrid": "flickering-grid",
        "RetroGrid": "retro-grid",
        "Meteors": "meteors",
        "BorderBeam": "border-beam",
        "AnimatedBeam": "animated-beam",
        "ShineBorder": "shine-border",
        "MagicCard": "magic-card",
        "NeonGradientCard": "neon-gradient-card",
        "MarqueeComponent": "marquee",
        "BentoGrid": "bento-grid",
        "OrbitingCircles": "orbiting-circles",
        "AnimatedList": "animated-list",
        "Dock": "dock",
        "Particles": "particles",
        "Confetti": "confetti",
    }
    for c in mu_comps:
        cli_name = MU_CLI_NAMES.get(c, re.sub(r"(?<!^)(?=[A-Z])", "-", c).lower())
        result["install_commands"].append(f"npx magicui-cli@latest add {cli_name}")
    for c in ac_comps:
        result["install_commands"].append(f'# Copy {c} from: https://ui.aceternity.com/components/{c.lower().replace(" ","-")}')
    
    return result

def resolve_product(product: str, style: str) -> dict:
    """Match product + style keywords to best palette, typography, and style profile."""
    q = f"{product} {style}".lower()
    palettes = search_palettes(q, 1)
    typography = search_typography(q, 1)
    styles = search_styles(q, 1)
    return {
        "palette": palettes[0],
        "typography": typography[0],
        "style": styles[0],
    }

if __name__ == "__main__":
    print("Core engine loaded.")
    print(f"Palettes: {len(PALETTES)}")
    print(f"Typography pairings: {len(TYPOGRAPHY)}")
    print(f"Style profiles: {len(STYLES)}")
    print(f"UX laws: {len(UX_LAWS)}")
    print(f"Page patterns: {len(PAGE_PATTERNS)}")
    print(f"Libraries: {len(LIBRARY_CATALOG)}")
