#!/usr/bin/env python3
"""
Stack Detector — reads the actual project and outputs what we're working with.
Run from project root: python3 .claude/skills/ui-design-intelligence/scripts/detect_stack.py
Supports: Next.js, React, Vue, Svelte, SwiftUI, Flutter, Vite, Gatsby
"""
import json, os, re, sys
from pathlib import Path

def detect():
    root = Path.cwd()
    r = {
        "framework": "unknown", "platform": "web", "router": None,
        "language": "javascript", "tailwind": False, "tailwind_version": None,
        "has_shadcn": False, "has_framer": False, "has_gsap": False,
        "has_react_spring": False, "has_three": False, "has_pinia": False,
        "has_vuex": False, "has_nuxt": False, "has_sveltekit": False,
        "components": [], "src_dir": None, "globals_css": None,
        "has_design_tokens": False, "has_react_bits": False,
        "existing_colors": [], "guidelines": [],
    }

    # Flutter
    if (root / "pubspec.yaml").exists():
        content = (root / "pubspec.yaml").read_text(errors="ignore")
        r.update({"framework":"flutter","platform":"cross-platform","language":"dart","guidelines":["flutter"]})
        for pkg in ["flutter_riverpod","riverpod","go_router","get_it","bloc","mobx"]:
            if pkg in content: r["components"].append(pkg)
        _print_results(r); return r

    # SwiftUI
    if list(root.glob("*.xcodeproj")) or list(root.glob("*.xcworkspace")) or list(root.rglob("*.swift"))[:1]:
        r.update({"framework":"swiftui","platform":"ios","language":"swift","guidelines":["swiftui"]})
        _print_results(r); return r

    # package.json
    pkg_path = root / "package.json"
    if not pkg_path.exists():
        if list(root.rglob("*.vue"))[:1]: r.update({"framework":"vue","guidelines":["vue","tailwind"]})
        elif list(root.rglob("*.svelte"))[:1]: r.update({"framework":"svelte","guidelines":["svelte","tailwind"]})
        else: print("⚠  No package.json found.\nSTACK_UNKNOWN"); sys.exit(0)
        _print_results(r); return r

    with open(pkg_path) as f: pkg = json.load(f)
    deps = {**pkg.get("dependencies",{}), **pkg.get("devDependencies",{})}

    # Framework
    if "next" in deps:
        app_dirs = [root/"app", root/"src"/"app"]
        r.update({"framework":"nextjs","router":"app-router" if any(d.exists() for d in app_dirs) else "pages-router","guidelines":["nextjs","react","tailwind"]})
    elif any(k in deps for k in ["nuxt","@nuxt/core"]):
        r.update({"framework":"nuxt","has_nuxt":True,"guidelines":["vue","tailwind"]})
    elif "vue" in deps:
        r.update({"framework":"vue","guidelines":["vue","tailwind"]})
    elif "@sveltejs/kit" in deps:
        r.update({"framework":"sveltekit","has_sveltekit":True,"guidelines":["svelte","tailwind"]})
    elif "svelte" in deps:
        r.update({"framework":"svelte","guidelines":["svelte","tailwind"]})
    elif "vite" in deps:
        r.update({"framework":"vite-react","guidelines":["react","tailwind"]})
    elif "gatsby" in deps:
        r.update({"framework":"gatsby","guidelines":["react","tailwind"]})
    elif "react" in deps:
        r.update({"framework":"react-cra","guidelines":["react","tailwind"]})

    if "typescript" in deps or (root/"tsconfig.json").exists(): r["language"] = "typescript"
    if "tailwindcss" in deps:
        ver = deps.get("tailwindcss","").lstrip("^~>=")
        r.update({"tailwind":True,"tailwind_version":ver[0] if ver else "3"})
        if "tailwind" not in r["guidelines"]: r["guidelines"].append("tailwind")
    if (root/"components.json").exists():
        r.update({"has_shadcn":True})
        r["components"].append("shadcn/ui")
        if "shadcn" not in r["guidelines"]: r["guidelines"].append("shadcn")
    if "framer-motion" in deps or "motion" in deps: r["has_framer"] = True
    if "gsap" in deps: r["has_gsap"] = True
    if "pinia" in deps: r["has_pinia"] = True; r["components"].append("pinia")
    if "vuex" in deps: r["has_vuex"] = True; r["components"].append("vuex")
    if "vue-router" in deps: r["components"].append("vue-router")
    for lib,name in [("@radix-ui","radix-ui"),("@headlessui","headlessui"),("@mui/material","material-ui"),("primevue","primevue"),("vuetify","vuetify"),("@mantine","mantine")]:
        if any(lib in k for k in deps): r["components"].append(name)
    for d in ["src","app","pages","components"]:
        if (root/d).exists(): r["src_dir"] = d; break
    for g in [root/"src"/"app"/"globals.css",root/"app"/"globals.css",root/"src"/"styles"/"globals.css",root/"src"/"index.css",root/"src"/"style.css"]:
        if g.exists():
            r["globals_css"] = str(g.relative_to(root))
            ct = g.read_text(errors="ignore")
            if "--color" in ct or "--primary" in ct: r["has_design_tokens"] = True
            r["existing_colors"] = list(set(re.findall(r'#[0-9A-Fa-f]{6}',ct)))[:5]
            break
    if (root/"design-system").exists(): r["has_design_tokens"] = True
    _print_results(r); return r

def _print_results(r):
    fw = r["framework"]
    router = f" ({r['router']})" if r.get("router") else ""
    platform = f" [{r['platform']}]" if r.get("platform") != "web" else ""
    print(f"\n╔══════════════════════════════════════════════════════╗\n║          CODEBASE STACK ANALYSIS                    ║\n╚══════════════════════════════════════════════════════╝\n")
    print(f"  Framework:     {fw}{router}{platform}")
    print(f"  Language:      {r['language']}")
    if fw not in ("flutter","swiftui"):
        tw = f"✓ v{r['tailwind_version']}" if r["tailwind"] else "✗ not found"
        print(f"  Tailwind:      {tw}")
        print(f"  shadcn/ui:     {'✓ installed' if r['has_shadcn'] else '✗ not found'}")
        print(f"  Framer Motion: {'✓' if r['has_framer'] else '✗  → npm i framer-motion'}")
        print(f"  React Bits:    {'✓ detected' if r['has_react_bits'] else '✗  → npx shadcn@latest add [url]'}")
    if fw in ("vue","nuxt"):
        print(f"  State Mgmt:    {'Pinia ✓' if r['has_pinia'] else 'Vuex ✓' if r['has_vuex'] else '✗ none'}")
    print(f"  Other libs:    {', '.join(r['components']) or 'none'}")
    if fw not in ("flutter","swiftui"):
        print(f"  Source dir:    {r.get('src_dir') or 'root'}")
        print(f"  globals.css:   {r.get('globals_css') or 'not found'}")
        print(f"  Design tokens: {'✓ found' if r['has_design_tokens'] else '✗ will create'}")
    if r.get("existing_colors"): print(f"  Existing hex:  {', '.join(r['existing_colors'][:3])}")
    print(f"\n  Active guidelines: {', '.join(r['guidelines'])}\n")

    recs = []
    if fw in ("nextjs","vite-react","react-cra"):
        if not r["has_framer"]: recs.append("npm install framer-motion")
        if not r["has_shadcn"] and fw=="nextjs": recs.append("npx shadcn@latest init")
        if r.get("tailwind_version")=="4":
            recs.append("⚠  Tailwind v4: use @theme{} in CSS, use bg-linear-to-r")
    if fw in ("vue","nuxt") and not r["has_pinia"]: recs.append("npm install pinia")
    if fw=="flutter" and "riverpod" not in r["components"]: recs.append("flutter pub add flutter_riverpod")
    if recs:
        print("  RECOMMENDATIONS:")
        for rec in recs: print(f"  → {rec}")
        print()
    print("STACK_JSON:" + json.dumps(r))

if __name__ == "__main__":
    detect()
