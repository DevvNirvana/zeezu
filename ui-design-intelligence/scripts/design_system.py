#!/usr/bin/env python3
"""
Design System Generator v2.0
Produces complete design system with multi-library component selection.
Saves to design-system/MASTER.md for persistent cross-session use.
"""
import argparse, sys, os
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
from core import resolve_product, search_ux_laws, get_pattern, select_components, UX_LAWS, LIBRARY_CATALOG

def generate(product, style, dark_mode, persist, page_type="landing"):
    resolved = resolve_product(product, style)
    palette  = resolved["palette"]
    typo     = resolved["typography"]
    sty      = resolved["style"]
    pattern  = get_pattern(page_type)
    ux_laws  = search_ux_laws(f"{product} {style} layout navigation CTA", n=3)
    components = select_components(product, sty["name"], dark=dark_mode)

    W = 64
    lines = []
    def box(t): return f"  {t}"
    def div(label=""): pad = max(1, W - len(label) - 7); return f"  {'─'*4} {label} {'─'*pad}"

    lines += [f"╔{'═'*W}╗", f"║  {(product.upper()+' DESIGN SYSTEM').center(W-2)}  ║", f"╚{'═'*W}╝", ""]

    lines += [div("PALETTE"), box(f"Name:       {palette['name']}"),
              box(f"Primary:    {palette['primary']}"), box(f"Secondary:  {palette['secondary']}"),
              box(f"CTA/Accent: {palette['cta']}"),    box(f"Background: {palette['bg']}")]
    if dark_mode:
        lines += [box(f"Surface:    {palette.get('surface_dark','#18181B')}"),
                  box(f"Border:     {palette.get('border_dark','#27272A')}")]
    else:
        lines += [box(f"Surface:    {palette.get('surface','#FFFFFF')}"),
                  box(f"Border:     {palette.get('border','#E5E7EB')}")]
    lines += [box(f"Text:       {palette['text']}"), box(f"Muted:      {palette['muted']}"), ""]

    lines += [div("TYPOGRAPHY"), box(f"Heading:    {typo['heading']}  ({typo['weights_h']})"),
              box(f"Body:       {typo['body']}  ({typo['weights_b']})"),
              box(f"URL:        {typo['url']}"), ""]

    lines += [div("TYPE SCALE"),
              box("display: 72px / 4.5rem  / leading-none   / font-heading  ← hero only"),
              box("h1:      56px / 3.5rem  / leading-tight  / font-heading"),
              box("h2:      40px / 2.5rem  / leading-tight  / font-heading"),
              box("h3:      28px / 1.75rem / leading-snug   / font-heading"),
              box("h4:      22px / 1.375rem/ leading-snug   / font-body w-600"),
              box("body-lg: 18px / 1.125rem/ leading-relaxed/ font-body"),
              box("body:    16px / 1rem    / leading-relaxed/ font-body"),
              box("small:   14px / 0.875rem/ leading-normal / font-body"),
              box("caption: 12px / 0.75rem / leading-normal / font-body"), ""]

    lines += [div("ANIMATION TOKENS"),
              box("fast:     150ms ease-out      ← hover states, micro interactions"),
              box("normal:   250ms ease-out      ← transitions, show/hide"),
              box("slow:     400ms ease-in-out   ← page entrances, reveals"),
              box("spring:   600ms cubic-bezier(0.16, 1, 0.3, 1)  ← bouncy entrance"),
              box("stagger:  50ms delay increment between list items"), ""]

    lines += [div("STYLE PROFILE"), box(f"Name:     {sty['name']}"),
              box(f"Approach: {sty['bg_approach']}"),
              box(f"Effects:  {sty['effects']}"),
              box(f"Avoid:    {sty['anti_patterns']}"), ""]

    # ── Multi-library component selection ────────────────────────────
    lines += [div("COMPONENT LIBRARY SELECTIONS")]
    lines += [box("Each slot → best library + component for this design context:"), ""]
    for slot, sel in components["selections"].items():
        slot_label = slot.replace("_"," ").title().ljust(18)
        lines.append(box(f"  {slot_label} [{sel['lib']}] {sel['component']}"))
        lines.append(box(f"  {'':18}  ↳ {sel['reason']}"))
        lines.append(box(""))
    lines.append("")

    lines += [div("INSTALL COMMANDS")]
    lines.append(box("# Run from project root:"))
    lines.append(box("npm install framer-motion  # required by Aceternity + Magic UI"))
    lines.append(box(""))
    for cmd in components["install_commands"]:
        lines.append(box(cmd))
    lines.append("")

    lines += [div("CSS VARIABLES  (→ globals.css / app/globals.css)")]
    lines.append(box(":root {"))
    lines += [box(f"  --color-primary:   {palette['primary']};"),
              box(f"  --color-secondary: {palette['secondary']};"),
              box(f"  --color-cta:       {palette['cta']};"),
              box(f"  --color-bg:        {palette['bg']};"),
              box(f"  --color-surface:   {palette.get('surface','#FFFFFF')};"),
              box(f"  --color-text:      {palette['text']};"),
              box(f"  --color-muted:     {palette['muted']};"),
              box(f"  --color-border:    {palette['border']};"),
              box(f"  --font-heading:    '{typo['heading']}', sans-serif;"),
              box(f"  --font-body:       '{typo['body']}', sans-serif;")]
    lines.append(box("}"))
    if dark_mode:
        lines += [box(".dark {"),
                  box(f"  --color-bg:      {palette.get('bg_dark','#09090B')};"),
                  box(f"  --color-surface: {palette.get('surface_dark','#18181B')};"),
                  box(f"  --color-text:    #F8FAFC;"),
                  box(f"  --color-muted:   #71717A;"),
                  box(f"  --color-border:  {palette.get('border_dark','#27272A')};"),
                  box("}")]
    lines.append("")

    lines += [div("FONT IMPORT"), box(typo['import']), ""]

    lines += [div("PAGE PATTERN"), box(f"Type: {pattern['name']}")]
    for i, s in enumerate(pattern['sections'], 1):
        lines.append(box(f"  {i:2}. {s}"))
    lines += [box(f"CTA:  {pattern['cta_placement']}"),
              box(f"Note: {pattern['conversion']}"), ""]

    if ux_laws:
        lines += [div("PSYCHOLOGY LAWS TO APPLY")]
        for law in ux_laws:
            lines += [box(f"[{law['law']}]"), box(f"  → {law['apply']}")]
        lines.append("")

    lines += [div("TAILWIND CONFIG EXTENSIONS")]
    lines.append(box("// tailwind.config.ts → theme.extend:"))
    lines.append(box(f"fontFamily: {{ heading: ['{typo['heading']}', 'sans-serif'], body: ['{typo['body']}', 'sans-serif'] }},"))
    lines.append(box(f"colors: {{ primary: 'var(--color-primary)', cta: 'var(--color-cta)', bg: 'var(--color-bg)', surface: 'var(--color-surface)', muted: 'var(--color-muted)', border: 'var(--color-border)' }},"))
    lines.append("")

    lines += [div("PRE-DELIVERY CHECKLIST")]
    checks = ["[ ] No emojis as icons — SVGs only (Lucide, Heroicons, Phosphor)",
              "[ ] cursor-pointer on ALL clickable elements",
              "[ ] Hover transitions 150-300ms ease on every interactive element",
              "[ ] Light mode contrast 4.5:1 minimum (WCAG AA)",
              "[ ] Focus states visible — focus-visible:ring-2 ring-primary",
              "[ ] prefers-reduced-motion: motion-reduce:animate-none on all animate-*",
              "[ ] Responsive: 375 / 768 / 1024 / 1440px breakpoints",
              "[ ] No horizontal scroll on mobile",
              "[ ] No hardcoded hex values — use CSS variables / design tokens",
              "[ ] AnimatePresence wrapping all conditional Framer Motion renders",
              "[ ] Alt text on every image",
              "[ ] aria-label on every icon-only button",
              "[ ] key={item.id} on every .map() — never key={index}",
              "[ ] 'use client' directive on any Next.js component with hooks/events",
              "[ ] No raw <img> in Next.js — use next/image"]
    for c in checks: lines.append(box(f"  {c}"))
    lines.append("")

    output = "\n".join(lines)
    print(output)
    if persist: _save_master(output, product, style, palette, typo, sty, dark_mode, pattern, components)
    return output


def _save_master(output, product, style, palette, typo, sty, dark_mode, pattern, components):
    out_dir = Path.cwd() / "design-system"
    out_dir.mkdir(exist_ok=True)
    (out_dir / "pages").mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")

    install_cmds = "\n".join(f"# {c}" if c.startswith("#") else c for c in components["install_commands"])

    content = f"""# Design System Master — {product}
Generated: {ts}  |  Style: {style}  |  Dark: {dark_mode}

> Rule: Check design-system/pages/[page].md first.
> If that file exists, its rules OVERRIDE this Master.
> If not, follow this Master exclusively.

---

## System Output
```
{output}
```

---

## Install Commands
```bash
npm install framer-motion
{install_cmds}
```

---

## Tailwind Config
```typescript
import type {{ Config }} from 'tailwindcss'
const config: Config = {{
  content: ['./src/**/*.{{ts,tsx}}', './app/**/*.{{ts,tsx}}'],
  darkMode: 'class',
  theme: {{
    extend: {{
      fontFamily: {{
        heading: ['{typo['heading']}', 'sans-serif'],
        body:    ['{typo['body']}', 'sans-serif'],
      }},
      colors: {{
        primary: 'var(--color-primary)', cta: 'var(--color-cta)',
        bg: 'var(--color-bg)', surface: 'var(--color-surface)',
        muted: 'var(--color-muted)', border: 'var(--color-border)',
      }},
      animation: {{
        'fade-in':  'fadeIn 400ms cubic-bezier(0.16,1,0.3,1)',
        'slide-up': 'slideUp 400ms cubic-bezier(0.16,1,0.3,1)',
      }},
    }},
  }},
}}
export default config
```

---

## globals.css
```css
:root {{
  --color-primary:   {palette['primary']};
  --color-secondary: {palette['secondary']};
  --color-cta:       {palette['cta']};
  --color-bg:        {palette['bg']};
  --color-surface:   {palette.get('surface','#FFFFFF')};
  --color-text:      {palette['text']};
  --color-muted:     {palette['muted']};
  --color-border:    {palette['border']};
  --font-heading:    '{typo['heading']}', sans-serif;
  --font-body:       '{typo['body']}', sans-serif;
}}
{''.join([chr(10)+".dark {", f"  --color-bg: {palette.get('bg_dark','#09090B')};", f"  --color-surface: {palette.get('surface_dark','#18181B')};", "  --color-text: #F8FAFC;", f"  --color-border: {palette.get('border_dark','#27272A')};", "}"] if dark_mode else [])}
```

---

## Page-Specific Overrides
Create design-system/pages/[page-name].md to override for specific pages.
Only document DEVIATIONS from this Master.
Examples: landing.md, dashboard.md, auth.md, pricing.md
"""
    (out_dir / "MASTER.md").write_text(content, encoding="utf-8")
    print(f"\n  ✓ Saved → design-system/MASTER.md")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--product","-p", default="web app")
    parser.add_argument("--style",  "-s", default="modern minimal")
    parser.add_argument("--dark",   action="store_true")
    parser.add_argument("--persist",action="store_true")
    parser.add_argument("--page",   default="landing")
    args = parser.parse_args()
    generate(args.product, args.style, args.dark, args.persist, args.page)
