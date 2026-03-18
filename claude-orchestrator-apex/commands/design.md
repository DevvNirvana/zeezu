# /design — Elite UI/UX Design Intelligence

You are entering **Design Mode** for: $ARGUMENTS

Produce Awwwards-caliber output. Never use placeholders. Never write TODOs. Deliver production-ready code.

---

## Step 1: Detect Stack
```bash
python3 .claude/intelligence/detect_stack.py
```
Reads `package.json`, `tailwind.config.*`, `tsconfig.json`. Outputs: framework, router, Tailwind version, shadcn status, animation libs.

**If no package.json:** Ask the user their stack before proceeding. One question only.

---

## Step 2: Parse the Request

Extract:
- **What:** page / component / full redesign / animation / design system
- **Vibe:** any style words (minimal, bold, dark, playful, luxury, editorial, glassmorphism, etc.)
- **Constraints:** existing brand colors, must match existing design, a11y requirements

**One question if critical info is missing. Never block on non-critical info.**

---

## Step 3: Generate Design System
```bash
python3 .claude/intelligence/design_system.py \
  --product "[product type]" \
  --style "[style keywords]" \
  [--dark] \
  --persist
```
`--persist` saves to `design-system/MASTER.md` — persists across sessions, prevents regeneration.

If `design-system/MASTER.md` already exists: **load it instead of regenerating.** Never regenerate an existing design system without asking.

Output: palette, typography pairing, type scale, spacing scale, shadow system, animation tokens, CSS variables block.

---

## Step 4: Select React Bits Components

Read: `.claude/references/react-bits-catalog.md`

For each major UI section, identify the best React Bits component:
- **Statement text** → SplitText or BlurText
- **Hero background** → Aurora, Particles, or Hyperspeed
- **Cards** → TiltCard or MagneticButton  
- **Images** → PixelTransition or TiltCard
- **Navigation** → use shadcn/ui nav, enhanced with FadeContent
- **CTAs** → MagneticButton or SpotlightCard
- **Testimonials/grids** → InfiniteScroll or MasonryGrid
- **Loading states** → Shimmer or Spinner

**One statement piece per section.** Restraint is what makes each piece land.

For each selected component:
```
Component: [Name]
Why: [specific reason for this context]
Install: npx shadcn@latest add "https://reactbits.dev/r/[Name]-TS-TW"
```

---

## Step 5: Apply UX Psychology Laws

Read: `.claude/references/ux-principles.md`

Identify which laws apply and show how you're applying them:

| Law | Application |
|-----|-------------|
| **Fitts's Law** | CTAs are large (min 44×44px), near where eyes land |
| **Hick's Law** | Navigation max 5-7 items, one primary CTA per section |
| **Miller's Law** | Group information in chunks of 5-9 |
| **Von Restorff** | Primary CTA visually distinct from secondary actions |
| **Jakob's Law** | Use familiar patterns for navigation, forms, cards |
| **Aesthetic-Usability** | Beautiful = trusted = more usable (perceived) |

---

## Step 6: Load Framework Guidelines

Based on detected stack, load the appropriate reference:
- Next.js project → read `.claude/references/nextjs-guidelines.md`
- React-only → read `.claude/references/react-guidelines.md`
- shadcn/ui present → read `.claude/references/shadcn-tailwind-guidelines.md`
- Vue → read `.claude/references/vue-svelte-guidelines.md`
- Native → read `.claude/references/native-guidelines.md`

---

## Step 7: Show the Design Plan — WAIT FOR APPROVAL

Output this box exactly:

```
╔══ DESIGN PLAN ════════════════════════════════════════════╗
║ Building:    [page/component name]                        ║
║ Style:       [style name] — [1 sentence why it fits]      ║
║ Primary:     [hex] · CTA: [hex] · Background: [hex]       ║
║ Fonts:       [Heading font] / [Body font]                 ║
║ React Bits:  [ComponentA], [ComponentB], [ComponentC]     ║
║ Psychology:  [Law → Application], [Law → Application]     ║
║ Framework:   [framework rules applied]                    ║
╚═══════════════════════════════════════════════════════════╝

Build with this plan? (yes / change [what])
```

**STOP HERE.** Do not write any code until the user responds.

If user says "change [X]": update only that part, re-show the box, wait again.

---

## Step 8: Build Production Code

On approval, deliver in this exact order:

### 8a. CSS Variables + Tailwind Config
```css
/* design-tokens.css */
:root {
  /* Colors */
  --color-primary: [hex];
  ...
  /* Typography */
  --font-heading: '[Font Name]', sans-serif;
  ...
  /* Spacing + Shadows + Animations */
}
```

```javascript
// tailwind.config additions
```

### 8b. Font Import
```typescript
// For Next.js — always next/font, never @import url()
import { Inter, Playfair_Display } from 'next/font/google'
```

### 8c. React Bits Installs
```bash
# Run these install commands:
npx shadcn@latest add "https://reactbits.dev/r/[ComponentA]-TS-TW"
npx shadcn@latest add "https://reactbits.dev/r/[ComponentB]-TS-TW"
```

### 8d. Complete Component Code

Rules:
- Zero TODOs
- Zero placeholders
- Zero lorem ipsum
- Real content that fits the product
- Fully typed TypeScript
- Accessible (aria labels, semantic HTML, focus management)
- Responsive (mobile-first)
- Dark mode ready (if `--dark` flag or project uses dark mode)

---

## Step 9: Framework Lint
```bash
python3 .claude/intelligence/framework_lint.py \
  [generated-file.tsx] \
  --framework [detected-frameworks-csv]
```

Fix all 🔴 HIGH issues before delivering. Note 🟡 MEDIUM issues.

---

## Page Patterns Reference

For full layouts, read: `.claude/references/page-patterns.md`

Common patterns:
- **Landing page** → Hero + Social proof + Features + CTA + Footer
- **Dashboard** → Stats + Charts + Recent Activity + Quick Actions
- **Auth (login/signup)** → Split layout, form on right, brand on left
- **Pricing** → Toggle + 3 tiers + Feature comparison + FAQ
- **Profile/Settings** → Sidebar nav + Content panels

---

> **Quality Standard:** Would this win a Dribbble shot? Would it pass a senior design review?
> If no → add more depth, better spacing, stronger typography contrast, more intentional animation.
