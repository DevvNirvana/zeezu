---
name: ui-design-intelligence
description: >
  Elite UI/UX design intelligence for React, Next.js, Vue, Svelte, Vite, and any
  modern frontend stack. TRIGGER on: /design, build page, build component, landing page,
  hero section, dashboard, nav, card, animation, dark mode, layout, color palette,
  typography, redesign, make it look better, make it prettier, add animations, style this,
  improve UI, add polish, professional look, modern design, it looks bad, too plain,
  frontend, visual design, what does X look like, inspire me, show me examples,
  or ANY request that involves building or improving a UI.
  Produces Awwwards-caliber output: reads the codebase, does live research across
  Smashing Magazine, Codrops, Awwwards, Godly, Dribbble, Lapa.ninja and 30+ more sources,
  generates a full design system, selects the BEST component from 12+ libraries (React Bits,
  Aceternity UI, Magic UI, Origin UI, Kibo UI, Skiper UI, MVPBlocks, shadcn/ui,
  NextUI, Chakra, Flowbite, Stunning UI), applies 18 UX psychology laws, and delivers
  complete production-ready code. Never placeholder text, never TODOs, never lorem ipsum.
---

# UI Design Intelligence v2.1
**Awwwards-quality frontend design. 12+ libraries. Live research from 30+ sources. Zero compromises.**

---

## The /design Workflow — Always Follow This Order

### Step 1 — Scan the codebase
```bash
python3 .claude/skills/ui-design-intelligence/scripts/detect_stack.py
```
Outputs: framework, router, Tailwind version, shadcn, Framer Motion, AND all 12 UI libraries.
**If no package.json exists**: Ask user their stack before proceeding.

### Step 2 — Understand the request
Extract from user message:
- **What**: page, component, feature, full redesign, section
- **Vibe**: any style words (minimal, bold, dark, playful, luxury, gaming, editorial, etc.)
- **Constraints**: existing brand colors, must match existing design, a11y

Ask ONE clarifying question if critical info is missing. Never block on non-critical info.

### Step 3 — Live Research (do this for every non-trivial request)
Read `references/resources-blogs.md` for the full search routing brain.

**Trigger live web searches based on request type:**

For landing pages / hero sections:
```
web_search: "[product type] landing page design 2025 site:lapa.ninja OR site:land-book.com"
web_search: "[style keyword] hero section inspiration site:dribbble.com"
```

For CSS techniques / animations:
```
web_search: "[technique] tutorial site:codrops.com"
web_search: "[technique] site:smashingmagazine.com"
```

For "what does X look like now" / trends:
```
web_search: "[topic] UI design trends 2025 site:smashingmagazine.com"
web_search: "awwwards [category] website 2025"
```

For UX patterns / flows:
```
web_search: "[feature] UX pattern site:uxdesign.cc"
web_search: "[app type] [feature] site:mobbin.com"
```

**What to extract from search results and apply:**
- Note the dominant visual treatment (type scale, color count, spacing)
- Identify the ONE delight element per section
- Look for spacing/whitespace patterns — what feels "generous"?
- Note what animation triggers are used (scroll, hover, mount)

**Skip live research when:** request is very specific + user already has brand guidelines,
or they explicitly say "just build it".

### Step 4 — Generate design system
```bash
python3 .claude/skills/ui-design-intelligence/scripts/design_system.py \
  --product "[product type]" --style "[keywords]" [--dark] [--persist] [--page landing|dashboard|auth|pricing]
```
Always `--persist` to save `design-system/MASTER.md`. Outputs: palette, typography, type scale,
animation tokens, multi-library component selections, CSS variables, Tailwind config, checklist.

### Step 5 — Show the design plan (ALWAYS wait for approval)
```
╔══ DESIGN PLAN ════════════════════════════════════════════════╗
║ Page/Component:  [what you're building]                       ║
║ Style:           [style name + why it fits this product]      ║
║ Research refs:   [2-3 sites studied + key observations]       ║
║ Colors:          Primary — CTA — Background                   ║
║ Fonts:           [Heading font] / [Body font]                 ║
║ Statement piece: [ONE wow component — lib + name]             ║
║ Supporting libs: [other libraries used + which components]    ║
║ Psychology:      [top 3 UX laws applied + how]                ║
╚═══════════════════════════════════════════════════════════════╝
Build with this plan? (yes / change [what])
```
**Do not write a single line of code before approval.**

### Step 6 — Build production-ready code
Deliver in this order:
1. `globals.css` — CSS variables block
2. `tailwind.config.ts` — theme extensions
3. Font import (Google Fonts URL or `next/font`)
4. Install commands for all statement components
5. Complete component code — no TODOs, no placeholders, no lorem ipsum
6. Every interactive state covered (default, hover, focus, active, loading, disabled, error)

### Step 7 — Framework lint (always run, always fix High issues before delivering)
```bash
python3 .claude/skills/ui-design-intelligence/scripts/framework_lint.py \
  [generated-file.tsx] --framework [detected-frameworks-csv]
```
Fix all 🔴 High before delivering. Mention 🟡 Medium to user.

---

## Library Selection Intelligence

This is the core of what makes this skill award-winning.
**Never use one library for everything. Select the BEST tool for each slot.**

### The 5 Library Tiers

**Tier 1: Foundation** (always present)
- `shadcn/ui` — accessible primitives, forms, dialogs, tables, navigation menus
- `Tailwind CSS` — utility classes for everything custom

**Tier 2: Statement Pieces** (the wow moments — use 2-3 per design)
- `React Bits` — best for: hero backgrounds (Aurora/Particles/Silk), text animations
  (SplitText/BlurText), interactive cards (SpotlightCard/TiltedCard), scroll effects
- `Aceternity UI` — best for: dark premium hero effects (Spotlight/LampEffect/BackgroundBeams),
  3D cards (ThreeDCardEffect), editorial text (TextGenerateEffect), scroll-reveal (StickyScrollReveal)
- `Magic UI` — best for: SaaS CTAs (ShimmerButton/RainbowButton), number stats (NumberTicker),
  border effects (BorderBeam/AnimatedBeam), backgrounds (GridPattern/RetroGrid)

**Tier 3: Enhanced Components** (upgrades over plain shadcn)
- `Origin UI` — best for: complex form inputs (OTP, phone, tags, combo), button variants
- `Kibo UI` — best for: kanban, date range picker, rich text editor, color picker, file upload
- `Skiper UI` — best for: bold hero sections, unique navigation, statement pricing cards

**Tier 4: Section Blocks** (speed mode)
- `MVPBlocks` — best for: complete section layouts when you need them fast

**Tier 5: Framework-Specific**
- `Stunning UI` — Vue/Nuxt only: animated components equivalent to React Bits
- `Flowbite` — dashboards, admin panels, data-heavy apps
- `NextUI/HeroUI` — when you need a full component system, good defaults
- `Chakra UI` — theming-first apps, semantic tokens, good a11y

---

### Component Slot Decision Matrix

| Slot | Dark Premium | Light SaaS | Editorial | Dashboard | Vue/Nuxt |
|------|-------------|-----------|-----------|-----------|---------|
| Hero bg | React Bits: Aurora | Magic UI: GridPattern | React Bits: Silk | — | Stunning UI: AnimatedGradient |
| Hero text | React Bits: SplitText | Magic UI: WordPullUp | React Bits: BlurText | — | Stunning UI: TextScramble |
| Sub-text | React Bits: BlurText | Magic UI: WordFadeIn | Aceternity: TextGenerateEffect | — | — |
| CTA button | Magic UI: ShimmerButton | React Bits: MagneticButton | React Bits: MagneticButton | shadcn: Button | Stunning UI: MagneticButton |
| Feature cards | React Bits: SpotlightCard | Magic UI: MagicCard | React Bits: TiltedCard | shadcn: Card | Stunning UI: GlowCard |
| Stats | React Bits: CountUp | Magic UI: NumberTicker | React Bits: CountUp | React Bits: CountUp | — |
| Testimonials | React Bits: BounceCards | shadcn: Card grid | Aceternity: CardStack | — | — |
| Logo strip | Magic UI: MarqueeComponent | Magic UI: MarqueeComponent | React Bits: ScrollVelocity | — | — |
| Nav (mobile) | React Bits: FlowingMenu | shadcn: Sheet | React Bits: FlowingMenu | shadcn: Sidebar | — |
| Pricing card | React Bits: StarBorder | shadcn + scale-105 | Skiper UI: PricingCard | — | — |
| Forms | Origin UI inputs | Origin UI inputs | shadcn: Form | Origin UI + Kibo | — |
| Borders | Aceternity: MovingBorder | Magic UI: ShineBorder | — | Magic UI: BorderBeam | — |
| Backgrounds | React Bits: Particles | Magic UI: DotPattern | Aceternity: WavyBackground | — | — |

**One statement piece per section. Restraint is what makes each piece land.**

---

### Install Command Reference

```bash
# React Bits (all components)
npx shadcn@latest add "https://reactbits.dev/r/[ComponentName]"
# Examples:
npx shadcn@latest add "https://reactbits.dev/r/Aurora"
npx shadcn@latest add "https://reactbits.dev/r/SplitText"
npx shadcn@latest add "https://reactbits.dev/r/SpotlightCard"
npx shadcn@latest add "https://reactbits.dev/r/MagneticButton"
npx shadcn@latest add "https://reactbits.dev/r/BlurText"
npx shadcn@latest add "https://reactbits.dev/r/TiltedCard"
npx shadcn@latest add "https://reactbits.dev/r/BounceCards"
npx shadcn@latest add "https://reactbits.dev/r/FlowingMenu"
npx shadcn@latest add "https://reactbits.dev/r/ScrollVelocity"
npx shadcn@latest add "https://reactbits.dev/r/CountUp"
npx shadcn@latest add "https://reactbits.dev/r/StarBorder"
npx shadcn@latest add "https://reactbits.dev/r/FadeContent"
npx shadcn@latest add "https://reactbits.dev/r/TextReveal"
npx shadcn@latest add "https://reactbits.dev/r/ImageTrail"
npx shadcn@latest add "https://reactbits.dev/r/Silk"
npx shadcn@latest add "https://reactbits.dev/r/Particles"
npx shadcn@latest add "https://reactbits.dev/r/Orb"
npx shadcn@latest add "https://reactbits.dev/r/Ripple"
npx shadcn@latest add "https://reactbits.dev/r/DotGrid"
npx shadcn@latest add "https://reactbits.dev/r/ShinyText"
npx shadcn@latest add "https://reactbits.dev/r/GradientText"
npx shadcn@latest add "https://reactbits.dev/r/FuzzyText"

# Magic UI (components)
npx magicui-cli@latest add shimmer-button
npx magicui-cli@latest add rainbow-button
npx magicui-cli@latest add number-ticker
npx magicui-cli@latest add border-beam
npx magicui-cli@latest add animated-beam
npx magicui-cli@latest add magic-card
npx magicui-cli@latest add marquee
npx magicui-cli@latest add word-pull-up
npx magicui-cli@latest add word-fade-in
npx magicui-cli@latest add sparkles-text
npx magicui-cli@latest add grid-pattern
npx magicui-cli@latest add dot-pattern
npx magicui-cli@latest add retro-grid
npx magicui-cli@latest add orbiting-circles
npx magicui-cli@latest add animated-gradient-text
npx magicui-cli@latest add hyper-text
npx magicui-cli@latest add box-reveal
npx magicui-cli@latest add cool-mode

# Kibo UI
npx kiui@latest add multi-select
npx kiui@latest add date-range-picker
npx kiui@latest add kanban
npx kiui@latest add file-upload
npx kiui@latest add rich-text-editor

# Flowbite React
npm install flowbite-react

# NextUI / HeroUI
npm install @nextui-org/react framer-motion

# Chakra UI
npm install @chakra-ui/react

# Aceternity UI (copy from site)
# → https://ui.aceternity.com/components/[component-name]
# Required: npm install framer-motion clsx tailwind-merge

# Required for cn() utility (most statement libs need this):
# Ensure @/lib/utils.ts has:
# import { clsx } from 'clsx'; import { twMerge } from 'tailwind-merge';
# export function cn(...inputs) { return twMerge(clsx(inputs)) }
npm install clsx tailwind-merge
```

---

## Reference Files (read on demand — never load all upfront)

| File | When to read |
|------|-------------|
| `references/resources-blogs.md` | **Step 3** — search routing brain, live research queries, all 30+ sources |
| `references/inspiration.md` | Agency study, trend analysis, the senior designer eye test |
| `references/component-library-catalog.md` | Selecting components — detailed catalog of all 12 libs |
| `references/react-bits-catalog.md` | When using React Bits components |
| `references/ux-principles.md` | Applying psychology laws to layout decisions |
| `references/page-patterns.md` | Landing pages, dashboards, auth, pricing, portfolio |
| `references/nextjs-guidelines.md` | framework = nextjs |
| `references/react-guidelines.md` | framework = react/nextjs/vite |
| `references/shadcn-tailwind-guidelines.md` | has_shadcn=true or tailwind=true |
| `references/vue-svelte-guidelines.md` | framework = vue/nuxt/svelte/sveltekit |
| `references/native-guidelines.md` | platform = ios (SwiftUI) or cross-platform (Flutter) |
| `references/charts-icons-reference.md` | dashboards, data viz, icon usage |

---

## Framework-Specific Critical Rules

### Next.js (App Router)
Read `references/nextjs-guidelines.md`. Non-negotiable:
- `'use client'` on any file using hooks or event handlers
- `next/image` — never raw `<img>`
- `next/font` — never `@import url(fonts.googleapis...)`
- `cache:` explicitly set on every `fetch()` (Next.js 15 uncached by default)
- Server Action inputs validated with Zod before touching DB
- `NEXT_PUBLIC_` prefix on all client-side env vars

### React / Vite
Read `references/react-guidelines.md`. Non-negotiable:
- `key={item.id}` on list items — never `key={index}`
- Handler reference not invocation: `onClick={fn}` not `onClick={fn()}`
- Cleanup from `useEffect` for subscriptions/timers
- Hooks only at top level — never in conditions/loops
- Context values wrapped in `useMemo`

### shadcn/ui
Read `references/shadcn-tailwind-guidelines.md`. Non-negotiable:
- `<DialogTitle>` inside every `<DialogContent>`
- `<TooltipProvider>` in root layout
- `<Toaster>` in root layout only
- `asChild` when composing Button as Link
- `<FormMessage>` after every `<FormControl>`

### Tailwind
Read `references/shadcn-tailwind-guidelines.md`. Non-negotiable:
- Never `focus:outline-none` without `focus:ring-2 focus:ring-primary`
- `motion-reduce:animate-none` alongside every `animate-*` class
- `min-h-[44px]` on all mobile interactive elements
- No hardcoded hex in className — use CSS variables
- Tailwind v4: `bg-linear-to-r` not `bg-gradient-to-r`

### Framer Motion
- `<AnimatePresence>` wrapping every conditional `<motion.*>` render
- `key` prop on AnimatePresence children (required for exit animation)
- `layout` prop on elements that change size/position

### Vue / Nuxt / Svelte
Read `references/vue-svelte-guidelines.md`.

### Charts / Dashboards
Read `references/charts-icons-reference.md`.

---

## Quality Gates — Absolute Zero Tolerance

```
❌ Emoji as icons — SVGs only (Lucide, Heroicons, Phosphor, Radix Icons)
❌ Placeholder text in delivered code ("Lorem ipsum", "TODO", "Insert here")
❌ Missing cursor-pointer on ANY clickable element
❌ Layout-shifting hover effects (scale-105 on block elements with siblings)
❌ Light mode text contrast below 4.5:1 WCAG AA
❌ Hardcoded hex values in className — always CSS variables
❌ !important hacks — if you need !important, redesign the structure
❌ Raw <img> in Next.js
❌ React .map() without keys
❌ Client-side hooks in Server Components
❌ framer-motion missing when using Aceternity or Magic UI animated components
❌ Icon-only buttons without aria-label
❌ focus:outline-none without focus:ring replacement
```

```
✅ Smooth transitions on ALL interactive states (150–300ms ease)
✅ Visible focus states for keyboard navigation (focus-visible:ring-2)
✅ prefers-reduced-motion respected (motion-reduce:animate-none)
✅ Alt text on all images
✅ aria-label on all icon-only interactive elements
✅ Labels on all form inputs (visible or aria-label)
✅ Mobile-first — breakpoints at 375 / 768 / 1024 / 1440px
✅ Dark mode handled if project uses it
✅ AnimatePresence around all conditional Framer Motion renders
✅ Every state covered: default → hover → focus → active → loading → disabled → error
```

---

## Psychology Laws — Quick Reference

| Law | Application |
|-----|------------|
| **Fitts's Law** | Primary CTAs: min 44px. Size = importance. |
| **Hick's Law** | Max 7 nav items. ONE primary action per screen. |
| **Miller's Law** | Feature lists in chunks of 3. Cards in sets of 3. |
| **Jakob's Law** | Logo top-left, nav top, search top-right. Users know these. |
| **Von Restorff** | ONE element uses CTA color per page. Pro card breaks the pattern. |
| **Peak-End Rule** | Hero moment + success state = the two that matter most. |
| **Aesthetic-Usability** | Beautiful = perceived as easier. Polish is not vanity. |
| **Proximity** | Related: 4-8px. Siblings: 16-24px. Sections: 64-96px. |
| **Prägnanz** | Simplest interpretation always. Remove anything that doesn't earn its space. |
| **Serial Position** | Most important feature: first. Second most important: last. |
| **Doherty Threshold** | Optimistic UI. Skeleton loaders >100ms. Perceived > actual performance. |
| **Zeigarnik** | Onboarding checklists. Progress bars. "3 of 5 steps done." |

---

## Stack-Specific Implementation Quick Reference

### Next.js App Router
```typescript
// next/font — zero layout shift
import { Outfit, Inter } from 'next/font/google'
const heading = Outfit({ subsets: ['latin'], weight: ['600','700','800'], variable: '--font-heading' })
const body = Inter({ subsets: ['latin'], weight: ['400','500'], variable: '--font-body' })
// In layout: <body className={`${heading.variable} ${body.variable}`}>
```

### Vite + React
```typescript
// @fontsource — no FOUT, zero external request
npm install @fontsource/outfit @fontsource/inter
import '@fontsource/outfit/700.css'
import '@fontsource/inter/400.css'
```

### Aceternity minimum setup
```bash
npm install framer-motion clsx tailwind-merge
# In @/lib/utils.ts:
# export function cn(...inputs) { return twMerge(clsx(inputs)) }
```

### Magic UI minimum setup
```bash
npm install framer-motion
npx magicui-cli@latest init  # optional CLI setup
```

### Tailwind v4 specifics
```css
@theme {
  --color-primary: #6366F1;
  --font-heading: 'Outfit', sans-serif;
}
/* Gradients: bg-linear-to-r, NOT bg-gradient-to-r */
```

---

## Design Philosophy

**Hierarchy is everything.** One star per section. CTA breaks the visual pattern (Von Restorff). Everything else recedes into supporting roles.

**Whitespace is not empty space.** It's the breath between notes that makes music. When a design feels "off," add more padding first — this fixes 80% of amateur designs.

**Typography does 80% of the work.** A perfect palette with mediocre typography looks amateur. The jump from body text to H1 should feel dramatic. Never settle for Inter/Roboto when Outfit/Fraunces/Bricolage exists.

**Motion communicates state, not decoration.** Every animation answers a question: Did this appear or was it already here? Did my action succeed? Where did that element go? If it doesn't answer a question, it shouldn't exist.

**Statement pieces win awards.** The gap between "looks professional" and "wins an award" is always one unexpected delight — a React Bits Aurora background, an Aceternity LampEffect, a cursor effect, a text reveal. Not ten features. One perfect thing per section.

**Restraint is the hardest skill.** Knowing which library component NOT to use is harder than knowing which to use. One statement piece per section. The rest recedes. This is what separates senior designers from everyone else.

**Consistency = "designed."** Inconsistent border radii, mixed font weights, random spacing — these are what makes a site feel "built" vs "designed." Pick your system and execute it with discipline everywhere.

**The Awwwards principle.** Award-winning sites are not complex. They are *committed* — committed to their style, their spacing, their type scale. Commit fully and execute perfectly.
