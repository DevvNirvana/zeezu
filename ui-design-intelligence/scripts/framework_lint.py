#!/usr/bin/env python3
"""
Framework Lint v2.0 — checks generated code against framework + library guidelines.
Covers: Next.js, React, shadcn, Tailwind, Vue, Svelte, Framer Motion,
        Aceternity, Magic UI, React Bits, NextUI, Chakra, DaisyUI, General.
"""
import sys, re, json, argparse, subprocess
from pathlib import Path

LINT_RULES = {
"nextjs": [
    {"id":"NX001","severity":"High",  "rule":"Use next/image not <img>",      "pattern":r"<img\s","message":"Use <Image> from 'next/image'","good":"<Image src={} alt={} width={} height={} />"},
    {"id":"NX002","severity":"High",  "rule":"'use client' for hooks/events", "pattern":r"(useState|useEffect|onClick|useRef|useCallback|useMemo)\b","message":"Add 'use client' directive at top of file when using React hooks","good":"'use client'  ← line 1 of the file"},
    {"id":"NX003","severity":"High",  "rule":"No server env in client",       "pattern":r"process\.env\.(?!NEXT_PUBLIC_)\w+","message":"Non-NEXT_PUBLIC_ env vars exposed to client","good":"NEXT_PUBLIC_API_URL"},
    {"id":"NX004","severity":"Medium","rule":"Use next/link not <a href>",    "pattern":r'<a\s+href=["\']/',"message":"Use <Link> from 'next/link' for internal navigation","good":"<Link href='/dashboard'>"},
    {"id":"NX005","severity":"Medium","rule":"Use next/font not @import",     "pattern":r"@import url\(.+fonts\.googleapis","message":"Use 'next/font/google' instead of @import","good":"import { Inter } from 'next/font/google'"},
    {"id":"NX006","severity":"High",  "rule":"Explicit cache on fetch",       "pattern":r"fetch\(['\"][^'\"]+['\"],\s*\{(?![^}]*cache:)","message":"Next.js 15 defaults to uncached — set cache:'force-cache' or 'no-store'","good":"fetch(url, { cache: 'force-cache' })"},
    {"id":"NX007","severity":"High",  "rule":"Validate Server Actions",       "pattern":r"'use server'[\s\S]{0,200}async function","message":"Server Actions must validate input with Zod before processing","good":"const data = schema.parse(formData)"},
],
"react": [
    {"id":"RC001","severity":"High",  "rule":"Keys in lists",                 "pattern":r"\.map\([^)]+\)\s*=>\s*<(?![^>]*key=)","message":"Missing key prop on list items — causes reconciliation bugs","good":"key={item.id}"},
    {"id":"RC002","severity":"High",  "rule":"No immediate event call",       "pattern":r"on\w+=\{[a-zA-Z_]\w*\(\)","message":"onClick={fn()} calls fn immediately on render","good":"onClick={fn} or onClick={() => fn(arg)}"},
    {"id":"RC003","severity":"High",  "rule":"Semantic HTML for clicks",      "pattern":r"<div[^>]+onClick","message":"Use <button> for clickable elements — <div onClick> breaks a11y","good":"<button onClick={...}>"},
    {"id":"RC004","severity":"High",  "rule":"No hooks in conditions",        "pattern":r"if\s*\([^)]+\)\s*\{[^}]*(useState|useEffect|useRef|useCallback)","message":"Hooks inside conditions violate Rules of Hooks","good":"Move hooks to top of component"},
    {"id":"RC005","severity":"Medium","rule":"Memoize context values",        "pattern":r"value=\{\{[^}]+\}\}","message":"Inline object as context value causes all consumers to re-render","good":"value={useMemo(() => ({...}), [deps])}"},
    {"id":"RC006","severity":"Medium","rule":"Effect cleanup for listeners",  "pattern":r"window\.addEventListener\((?![\s\S]{0,300}return\s*\(\)\s*=>)","message":"Add cleanup function in useEffect to remove event listeners","good":"return () => window.removeEventListener(...)"},
    {"id":"RC007","severity":"High",  "rule":"Alt text on images",            "pattern":r"<(?:img|Image)\s(?![^>]*alt=)","message":"Images must have alt text for accessibility"},
],
"shadcn": [
    {"id":"SC001","severity":"High",  "rule":"DialogTitle required",          "pattern":r"<DialogContent(?![\s\S]{0,500}DialogTitle)","message":"DialogContent needs DialogTitle for screen readers","good":"<DialogTitle>Title here</DialogTitle>"},
    {"id":"SC002","severity":"High",  "rule":"TooltipProvider at root",       "pattern":r"<Tooltip[^P]","message":"Wrap app in <TooltipProvider> — add to root layout","good":"<TooltipProvider> in app/layout.tsx"},
    {"id":"SC003","severity":"High",  "rule":"Toaster in layout not page",    "pattern":r"export default function.*Page[\s\S]{0,500}<Toaster","message":"<Toaster> belongs in root layout, not individual pages"},
    {"id":"SC004","severity":"Medium","rule":"Use variant prop not class hack","pattern":r'<Button className=\{[^}]*\?[^}]*:[^}]*\}','message':"Use variant='destructive' not conditional className","good":"<Button variant='destructive'>"},
    {"id":"SC005","severity":"High",  "rule":"FormMessage after FormControl", "pattern":r"<FormControl>[\s\S]{0,200}</FormControl>(?![\s\S]{0,50}<FormMessage)","message":"<FormMessage /> must follow <FormControl> to display validation errors"},
    {"id":"SC006","severity":"High",  "rule":"asChild for button-as-link",    "pattern":r"<Button[^>]*>[^<]*<(?:Link|a)\s","message":"Use asChild prop to avoid nested button/anchor","good":"<Button asChild><Link href='/'>...</Link></Button>"},
],
"tailwind": [
    {"id":"TW001","severity":"High",  "rule":"No hardcoded hex in className", "pattern":r'className=["\'][^"\']*#[0-9A-Fa-f]{6}',"message":"Use CSS variables or Tailwind tokens — never hex in className","good":"bg-primary text-cta"},
    {"id":"TW002","severity":"High",  "rule":"Focus state replacement",       "pattern":r"focus:outline-none(?![\s\S]{0,60}focus:ring)","message":"Never remove focus outline without adding focus:ring replacement","good":"focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"},
    {"id":"TW003","severity":"High",  "rule":"Reduced motion required",       "pattern":r"animate-(?!none)[a-z-]+(?![^\n]*motion-reduce)","message":"Add motion-reduce:animate-none alongside animation classes","good":"animate-pulse motion-reduce:animate-none"},
    {"id":"TW004","severity":"Medium","rule":"Tailwind v4 gradient syntax",   "pattern":r"bg-gradient-to-","message":"Tailwind v4: use bg-linear-to-r/l/t/b instead","good":"bg-linear-to-r from-blue-500 to-purple-500"},
    {"id":"TW005","severity":"High",  "rule":"Min touch target mobile",       "pattern":r"(?:h-6|h-7|h-8|h-\[2\d+px\])\s+(?:w-6|w-7|w-8)","message":"Interactive elements need min 44px height on mobile","good":"min-h-[44px] min-w-[44px]"},
    {"id":"TW006","severity":"Medium","rule":"Transition on hover states",    "pattern":r"hover:(?:bg|text|border|opacity)-[a-z0-9-]+(?![^\n]*transition)","message":"Add transition class when using hover color changes","good":"hover:bg-primary/90 transition-colors duration-150"},
    {"id":"TW007","severity":"Medium","rule":"cursor-pointer on clickable",   "pattern":r'<(?:button|a|div[^>]*onClick)[^>]+className=["\'][^"\']*(?<!cursor-pointer)(?<!cursor-wait)["\']',"message":"Add cursor-pointer to all clickable elements","good":"cursor-pointer"},
],
"vue": [
    {"id":"VU001","severity":"High",  "rule":"No v-if + v-for same element",  "pattern":r"v-for.*v-if|v-if.*v-for","message":"v-if has higher priority than v-for — use <template v-for>","good":"<template v-for='item in items'><div v-if='item.visible'>"},
    {"id":"VU002","severity":"High",  "rule":"Key with v-for",                "pattern":r"v-for(?![\s\S]{0,100}:key=)","message":"Always provide :key when using v-for","good":":key='item.id'"},
    {"id":"VU003","severity":"High",  "rule":"No prop mutation",              "pattern":r"props\.\w+\s*=","message":"Never mutate props directly — emit events","good":"emit('update:modelValue', newVal)"},
    {"id":"VU004","severity":"High",  "rule":"storeToRefs for Pinia",         "pattern":r"const \{ \w+ \} = use\w+Store\(\)(?![\s\S]{0,200}storeToRefs)","message":"Use storeToRefs() when destructuring Pinia store"},
    {"id":"VU005","severity":"High",  "rule":"onUnmounted cleanup",           "pattern":r"(window\.addEventListener|setInterval|subscribe)\((?![\s\S]{0,500}onUnmounted)","message":"Add onUnmounted cleanup for listeners and subscriptions"},
],
"svelte": [
    {"id":"SV001","severity":"High",  "rule":"Reassign arrays not mutate",    "pattern":r"\w+\.push\(|\w+\.splice\(","message":"Mutation doesn't trigger reactivity — reassign array","good":"items = [...items, newItem]"},
    {"id":"SV002","severity":"High",  "rule":"Keys in {#each}",               "pattern":r"\{#each \w+ as \w+\}(?!\s*\()","message":"Always provide key in {#each} blocks","good":"{#each items as item (item.id)}"},
    {"id":"SV003","severity":"High",  "rule":"SvelteKit: load not onMount",   "pattern":r"onMount.*fetch\(","message":"Use load() in +page.js/+page.server.js for data fetching"},
],
"framer": [
    {"id":"FM001","severity":"High",  "rule":"AnimatePresence for conditional","pattern":r"\{[^}]+&&\s*<motion\.","message":"Wrap conditional motion elements in <AnimatePresence> for exit animations","good":"<AnimatePresence>{show && <motion.div>}"},
    {"id":"FM002","severity":"Medium","rule":"layout prop for size changes",   "pattern":r"<motion\.[a-z]+(?![^>]*layout)[^>]*(?:className|style)=[^>]*(?:h-|w-|height|width)","message":"Add layout prop to motion elements that change size/position","good":"<motion.div layout>"},
    {"id":"FM003","severity":"High",  "rule":"Key on AnimatePresence child",  "pattern":r"<AnimatePresence>[\s\S]{0,100}<motion\.[a-z]+(?![^>]*key=)","message":"AnimatePresence children need unique key prop for exit animation","good":"<motion.div key={id}>"},
],
"aceternity": [
    {"id":"AC001","severity":"High",  "rule":"framer-motion required",        "pattern":r'from ["\'].*aceternity|components/aceternity',"message":"Aceternity components require framer-motion — run: npm install framer-motion"},
    {"id":"AC002","severity":"Medium","rule":"cn() utility required",         "pattern":r'from ["\'].*aceternity',"message":"Ensure cn() utility (clsx + tailwind-merge) is set up at @/lib/utils"},
],
"magicui": [
    {"id":"MU001","severity":"Medium","rule":"framer-motion required",        "pattern":r'from ["\'].*magicui|@/components/magicui',"message":"Most Magic UI components require framer-motion","good":"npm install framer-motion"},
],
"general": [
    {"id":"GN001","severity":"High",  "rule":"No console.log",                "pattern":r"console\.log\(","message":"Remove console.log before production"},
    {"id":"GN002","severity":"Medium","rule":"No TODO/FIXME in shipped code",  "pattern":r"//\s*(TODO|FIXME|HACK|XXX)","message":"Resolve TODOs before shipping"},
    {"id":"GN003","severity":"High",  "rule":"No hardcoded secrets",          "pattern":r'(?:password|secret|api[_-]?key|token)\s*[=:]\s*["\'][^"\']{8,}',"message":"Never hardcode secrets in source code"},
    {"id":"GN004","severity":"High",  "rule":"ARIA labels on icon buttons",   "pattern":r"<button[^>]*>[\s\n]*<(?:svg|Lucide|Icon)(?![^>]*aria)","message":"Icon-only buttons need aria-label","good":"<button aria-label='Delete item'>"},
    {"id":"GN005","severity":"Medium","rule":"Avoid layout-shifting hover",   "pattern":r"hover:scale-(?:105|110)\s+(?!.*[^h])","message":"scale-105 on block elements with siblings causes layout shift — use transform-gpu or wrap in container"},
],
}

def lint_code(code, frameworks):
    issues = []
    rule_sets = list(set(frameworks + ["general"]))
    for fw in rule_sets:
        for rule in LINT_RULES.get(fw, []):
            if re.search(rule["pattern"], code, re.IGNORECASE | re.MULTILINE):
                issues.append({"id":rule["id"],"framework":fw,"severity":rule["severity"],
                                "rule":rule["rule"],"message":rule["message"],"fix":rule.get("good","")})
    return sorted(issues, key=lambda x: {"High":0,"Medium":1,"Low":2}[x["severity"]])

def lint_file(filepath, frameworks):
    path = Path(filepath)
    if not path.exists(): print(f"⚠  File not found: {filepath}"); return []
    return lint_code(path.read_text(errors="ignore"), frameworks)

def print_issues(issues, filename=""):
    if not issues:
        print(f"  ✅ No issues{' in '+filename if filename else ''}"); return
    high=[i for i in issues if i["severity"]=="High"]
    med =[i for i in issues if i["severity"]=="Medium"]
    label = f" in {filename}" if filename else ""
    print(f"\n  Found {len(issues)} issue(s){label}:")
    print(f"  🔴 High: {len(high)}  🟡 Medium: {len(med)}\n")
    for issue in issues:
        icon = {"High":"🔴","Medium":"🟡","Low":"🔵"}[issue["severity"]]
        print(f"  {icon} [{issue['id']}] [{issue['framework']}] {issue['rule']}")
        print(f"     {issue['message']}")
        if issue.get("fix"): print(f"     ✓ Fix: {issue['fix']}")
        print()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", nargs="?")
    parser.add_argument("--framework","-f")
    parser.add_argument("--stack-check", action="store_true")
    parser.add_argument("--code","-c")
    args = parser.parse_args()

    print("\n╔══════════════════════════════════════════════════════╗")
    print("║        FRAMEWORK LINT CHECK v2.0                    ║")
    print("╚══════════════════════════════════════════════════════╝\n")

    if args.framework:
        frameworks = [f.strip() for f in args.framework.split(",")]
    elif args.stack_check:
        try:
            result = subprocess.run(
                ["python3", str(Path(__file__).parent/"detect_stack.py")],
                capture_output=True, text=True)
            for line in result.stdout.split("\n"):
                if line.startswith("STACK_JSON:"):
                    stack = json.loads(line[11:])
                    frameworks = stack.get("guidelines", ["react"])
                    if stack.get("has_framer"): frameworks.append("framer")
                    if stack.get("has_aceternity"): frameworks.append("aceternity")
                    if stack.get("has_magicui"): frameworks.append("magicui")
                    print(f"  Auto-detected: {frameworks}\n"); break
        except: frameworks = ["react","general"]
    else:
        frameworks = ["react","general"]

    if args.code:
        print_issues(lint_code(args.code, frameworks))
    elif args.file:
        print_issues(lint_file(args.file, frameworks), args.file)
    elif args.stack_check:
        root = Path.cwd()
        exts = {".tsx",".ts",".jsx",".js",".svelte",".vue"}
        all_issues = []; checked = 0
        for src in ["src","app","components","pages","lib"]:
            sp = root/src
            if not sp.exists(): continue
            for ext in exts:
                for f in sp.rglob(f"*{ext}"):
                    if "node_modules" in str(f) or ".next" in str(f): continue
                    issues = lint_file(str(f), frameworks)
                    if issues:
                        print(f"  📄 {f.relative_to(root)}")
                        print_issues(issues, str(f.relative_to(root)))
                        all_issues.extend(issues)
                    checked += 1
        print(f"  ═══════ Files: {checked} | Total: {len(all_issues)} | 🔴 High: {len([i for i in all_issues if i['severity']=='High'])}")
        if not [i for i in all_issues if i['severity']=='High']: print("  ✅ No high-severity issues found")
    else:
        print("  Usage:")
        print("  python3 framework_lint.py MyComponent.tsx --framework nextjs,react,shadcn,tailwind")
        print("  python3 framework_lint.py --stack-check")
        print("  python3 framework_lint.py --code '<img src={x}>' --framework nextjs")

if __name__ == "__main__":
    main()
