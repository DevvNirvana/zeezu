# Claude Orchestrator APEX

> **Production-ready AI orchestration for Claude Code.**  
> 10 intelligent commands · Full design intelligence · Token Intelligence system · Parallel agents.

---

## What This Is

Claude Orchestrator APEX is a complete AI development system that installs into Claude Code. It gives you:

- **10 slash commands** for every phase of development
- **Awwwards-caliber design intelligence** built in (no separate install)
- **Token Intelligence** — 70-85% cost reduction without quality loss
- **Parallel agents** via Git worktrees for true concurrent development
- **40-point pre-flight checklist** before every deploy

---

## Install

```bash
# 1. Unzip into your project root
unzip claude-orchestrator-apex.zip

# 2. Run the installer
bash claude-orchestrator-apex/scripts/install.sh

# 3. Open Claude Code
claude

# 4. Initialize
/init
```

**Options:**
```bash
bash install.sh --update    # Update existing installation (preserves configs)
bash install.sh --fresh     # Fresh install (overwrites everything)
bash install.sh --dry-run   # Preview what would be installed
```

**Requirements:** git (required) · python3 (optional, enables token intelligence) · node (optional)

---

## The 10 Commands

### `/init`
Scans your codebase, validates or generates CLAUDE.md, initializes token intelligence.

```
/init
```

---

### `/plan [task]`
Plan before you build. Uses extended thinking + plan cache for 50% token savings on repeat tasks.

```
/plan build the job matching results page with filters
/plan Phase 2 — candidate profile and application flow
/plan refactor the auth module to use NextAuth v5
```

Outputs a structured plan with steps, files, risks, tests, and definition of done.
**Waits for your approval before any code is written.**

---

### `/design [description]`
Awwwards-caliber UI generation. Detects your stack automatically.

```
/design build the job results page — dark mode, minimal, data-dense
/design redesign the hero section — bold, high contrast, editorial
/design create the candidate dashboard with stats and activity feed
```

Full pipeline:
1. Detects stack (Next.js/React/Vue/Svelte/Swift/Flutter)
2. Generates design system with exact tokens
3. Selects React Bits components by name with install commands
4. Applies UX psychology laws (Fitts, Hick, Miller, Von Restorff)
5. Shows design plan — **waits for approval**
6. Delivers complete production code (no TODOs, no placeholders)
7. Runs framework lint to catch issues before delivery

---

### `/review [file or path]`
Deep code review against 40+ criteria: correctness, security, performance, quality.

```
/review src/components/JobCard.tsx
/review src/app/api/          ← batch reviews entire directory
/review src/                  ← batch reviews all source files
```

**Batch mode:** loads project context once, reviews all files in a single pass (saves 30-66% tokens).

Outputs tiered report: 🔴 Blocking · 🟡 Warnings · 🟢 Notes · ✅ What's Good · VERDICT

---

### `/debug [issue]`
Root cause analysis. Not symptom-chasing — finds the actual code condition.

```
/debug useEffect is running infinitely on the dashboard page
/debug API returns 500 when creating a new job posting
/debug TypeScript error: Type 'string | undefined' is not assignable to 'string'
```

Outputs: Symptom → Root Cause → Evidence (file:line) → Exact Fix → Prevention

---

### `/optimize [target]`
Performance profiling with ranked fixes and expected gains.

```
/optimize src/app/results/page.tsx
/optimize                          ← scans entire project
/optimize bundle                   ← focus on bundle size
```

Checks: bundle size, N+1 queries, unnecessary re-renders, image optimization, caching.

---

### `/test [file]`
Generates complete test files. Covers happy path + error paths + edge cases.

```
/test src/lib/matching-score.ts
/test src/components/JobCard.tsx
/test src/app/api/jobs/route.ts
```

Outputs a complete, runnable test file — no TODOs, no "add more tests here".

---

### `/refactor [file]`
Safe refactoring with blast radius analysis and approval gate.

```
/refactor src/components/JobResults.tsx  ← component is too large
/refactor src/lib/api.ts                 ← extract to separate modules
/refactor src/app/dashboard/             ← improve naming + types
```

Shows what changes, what stays the same, risk level, blast radius.
**Waits for approval before writing any code.**

---

### `/docs [target]`
Generates complete documentation.

```
/docs src/lib/matching-score.ts    ← JSDoc for functions
/docs src/components/JobCard.tsx   ← component documentation
/docs api                          ← API reference
/docs readme                       ← README.md
/docs arch                         ← Architecture Decision Record
```

---

### `/spawn [agent-name] [task]`
Spawns a parallel agent in an isolated Git worktree.

```
/spawn frontend build the job results and search pages
/spawn api     build the job matching and recommendations API
/spawn auth    implement OAuth with Google and LinkedIn
```

Creates:
- `worktrees/agent-[name]/` — isolated working directory
- `agent/[name]` branch — isolated from main
- `AGENT_BRIEF.md` — the agent's complete instructions

**When done:** `bash .claude/scripts/merge-agents.sh [agent-name]`

---

### `/ship`
40-point pre-flight checklist before deployment.

```
/ship
```

Checks: security (7), correctness (7), performance (6), UX/accessibility (7), code quality (4), docs (3), monitoring (4), CI/CD (3).

VERDICT: `SHIP ✅` | `HOLD 🟡` | `HOLD_CRITICAL 🔴`

---

## Token Intelligence System

Five layers that compound to 70-85% token reduction:

### Layer 1 — Context Map
Each command loads only the context sections it needs:
- `/plan` loads: project overview + stack + docs
- `/review` loads: conventions + rules + pattern (not design tokens, not architecture)
- `/design` loads: stack + frontend guidelines (not backend rules)

Full `CLAUDE.md` is never loaded unless a command needs all of it.

### Layer 2 — Plan Cache
Plan templates are stored and reused across similar tasks:

```
Session 1: /plan build the job results page
           → Claude thinks hard, produces plan
           → Template stored in .claude/cache/plans/

Session 5: /plan build the candidate profile page
           → System detects similarity (score: 0.81)
           → Loads and adapts cached template
           → 50% fewer tokens, same quality plan
```

### Layer 3 — Response Cache
Semantically similar queries return cached responses:
- Cache hit rate reaches 90%+ by query 20
- Zero cost on cache hits

### Layer 4 — Output Contracts
Every command has enforced output format:
- `/plan` → structured JSON plan, max 600 tokens, no prose intro
- `/review` → tiered report format, no preamble
- `/spawn` → agent brief JSON, max 350 tokens

Eliminates "Great question! Let me break this down..." preamble.

### Layer 5 — Batch Reviews
`/review src/` reviews all files in one call:
- Project context loaded once (not per file)
- Saves 30-66% on multi-file reviews

### View Your Savings
```bash
bash .claude/scripts/token-report.sh          # All-time report
bash .claude/scripts/token-report.sh --today  # Today only
python3 .claude/intelligence/cache_manager.py stats
```

---

## Design Intelligence

Built-in from Day 1. No separate install.

**Detects:** Next.js · React · Vue · Nuxt · Svelte · SvelteKit · Vite · Gatsby · SwiftUI · Flutter

**Generates:**
- Complete design system (50 palettes, 40 typography pairings, 30 style personalities)
- CSS custom properties block
- Tailwind config additions
- React Bits component selections with install commands

**Applies:**
- 12 UX psychology laws (Fitts's Law, Hick's Law, Miller's Law, etc.)
- 8 page patterns (landing, dashboard, auth, pricing, profile, etc.)
- 198 framework-specific rules (Next.js, React, shadcn/ui, Tailwind, Vue, Svelte, SwiftUI, Flutter)

**Quality standard:** Would this win a Dribbble shot? If no → more depth.

---

## Parallel Agents

Run multiple Claude Code sessions simultaneously, each in their own worktree:

```bash
# Terminal 1 — spawn frontend agent
/spawn frontend build job search and results pages

# Terminal 2 — in worktrees/agent-frontend
cd worktrees/agent-frontend
claude
# Agent works on frontend independently

# Terminal 3 — spawn API agent simultaneously
/spawn api build job matching and scoring API
cd worktrees/agent-api  
claude
```

Domain partitioning prevents conflicts:

| Agent | Owns | Never Touches |
|-------|------|---------------|
| frontend | `src/app/`, `src/components/` | `src/server/`, `migrations/` |
| api | `src/server/`, `src/app/api/` | `src/components/`, `migrations/` |
| db | `migrations/`, `prisma/`, `src/lib/db.ts` | `src/app/`, `src/components/` |
| auth | `src/app/(auth)/`, `src/lib/auth.ts` | `migrations/`, `src/components/` |

---

## File Structure After Install

```
your-project/
├── CLAUDE.md                     ← Project context (fill in your details)
├── TODO.md                       ← Shared task board
├── docs/
│   ├── PRD.md                    ← Product requirements
│   ├── DESIGN_DOC.md             ← Architecture decisions
│   └── TECH_STACK.md             ← Standards + conventions
└── .claude/
    ├── commands/                 ← 10 slash commands
    │   ├── plan.md, review.md, design.md, ship.md
    │   ├── spawn.md, debug.md, optimize.md
    │   ├── test.md, docs.md, refactor.md, init.md
    ├── intelligence/             ← Python intelligence layer
    │   ├── cache_manager.py      ← Plan + response cache
    │   ├── token_tracker.py      ← Usage tracking
    │   ├── detect_stack.py       ← Stack detection
    │   ├── design_system.py      ← Design system generator
    │   └── framework_lint.py     ← Framework rule linter
    ├── scripts/                  ← Bash scripts
    │   ├── install.sh
    │   ├── create-worktrees.sh
    │   ├── merge-agents.sh
    │   └── token-report.sh
    ├── config/                   ← Configuration
    │   ├── context-map.json      ← Context per command
    │   ├── output-contracts.json ← Output format per command
    │   └── cache-config.json     ← Cache settings
    ├── references/               ← 14 reference docs
    │   ├── react-bits-catalog.md
    │   ├── nextjs-guidelines.md
    │   ├── react-guidelines.md
    │   ├── shadcn-tailwind-guidelines.md
    │   ├── ux-principles.md
    │   └── ... (9 more)
    └── cache/                    ← Token intelligence cache
        ├── plans/                ← Plan templates
        └── responses/            ← Response cache
```

---

## Workflow Example: MatchHire AI

```bash
# Day 1: Initialize
/init
# → Scans Next.js 14 + TypeScript + Tailwind + shadcn stack
# → Validates CLAUDE.md
# → Cache initialized

# Plan the feature
/plan Phase 2 — job matching results page with smart filters

# Build the UI
/design build job results page — dark mode, data-dense, professional

# Review the output
/review src/app/results/

# Spawn parallel work
/spawn api  build the matching score algorithm and ranking API
/spawn auth add LinkedIn OAuth and profile import

# Test the core logic
/test src/lib/matching-score.ts

# Before deploy
/ship
```

---

## The Research Behind It

The Token Intelligence system is grounded in published research:

- **LLMLingua** (Microsoft Research, EMNLP 2023) — 20x compression with 1.5% quality loss
- **Agentic Plan Caching** (Stanford/Berkeley, arXiv 2025) — 50% cost reduction, 27% latency reduction
- **Semantic Response Cache** (DEV community) — 90%+ cache hit rate by query 20
- **Output budget enforcement** — 20-40% output token savings via format control
- **Task batching** (SAMMO framework) — 30-66% savings on multi-file operations

---

## Tips

**Start every session with `/init`** — validates context, warms the cache.

**Always `/plan` before building** — the approval gate prevents wasted work.

**Use `/review` on everything before `/ship`** — it catches what you miss.

**`/design` is not just for new pages** — use it to improve existing UI too.

**Keep CLAUDE.md under 80 lines** — ETH Zurich research shows longer = worse in 5/8 settings.

**Atomic tasks in TODO.md** — each task should be completable in < 2 hours.

---

## Version

**APEX v2.0.0** — Complete rebuild from ground up.

Changelog from previous version:
- Added `/debug`, `/optimize`, `/test`, `/docs`, `/refactor` commands (5 new)
- Added Token Intelligence system (5 layers)
- Added Plan Cache + Response Cache
- Added Output Contracts per command
- Added Batch Review mode
- Integrated full Design Intelligence (no separate install)
- Added Token Report dashboard
- All command templates completely rewritten
- 14 reference documents (up from 5)
- 198 framework rules embedded
