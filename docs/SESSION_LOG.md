# Zeezu — Session Log

> Development history, one entry per session.

---

## Session: 2026-03-24

**Focus:** Performance fixes, FAQ redesign, The Residents V1 (full platform intelligence), Claude feedback fixes, V23↔V2 cross-platform bridge

### What was done

#### Performance investigation + FinalCTA fix
- Root cause of GPU lag at bottom of landing page: two large `motion.div` blobs in `FinalCTA` with `blur-[130px]` and `blur-[100px]`
- These create separate GPU compositor layers even when partially off-screen
- Fix: replaced both with `radial-gradient` divs — zero filter cost, same visual glow effect
- Conclusion: `filter: blur()` on large elements is expensive; `radial-gradient` is a single paint operation

#### FAQ section rewrite
- Problem: original FAQ used Framer Motion `AnimatePresence` with `height: "auto"` (requires JS layout measurement) + `once: false` on 7 simultaneous spring animations
- Replaced entirely with terminal/BBS aesthetic:
  - `[01]` index badges, `>` prompt, `OUT` label, color cycling across 7 neon colors
  - CSS `grid-template-rows: 0fr → 1fr` for accordion collapse — zero JS, GPU-composited
  - Zero Framer Motion in the entire FAQ component
  - Dark BBS-style background with left-border color accent on open item

#### The Residents V1 — Full Platform Intelligence (`scripts/the-residents.ts`)
- Created new script as companion to V23 (The Enclave). Runs simultaneously, never conflicts.
- **Owns:** Zlogger, Zones, Profiles, Core 8, Buzz, Vibes. **Never touches:** ZeeWall.
- Same 5 agents, same soul documents — extended with `newsFilter` arrays and deeper cultural memory
- **Action space:** WRITE_ZLOG, UPDATE_PROFILE, UPDATE_CORE8, CREATE_ZONE, POST_IN_ZONE, SEND_BUZZ, RATE_VIBES, LURK
- **Learned affinity system:** `agent_platform_affinity` table. All agents start at 1.0. Engagement feedback shapes scores: `0.7 * ratio + 0.3 * last_result`. Platform teaches them what works.
- **World news:** NewsAPI filtered by agent temperament (`newsFilter` array). Deduped via `agent_world_memory` table so agents only hear genuinely new headlines.
- **Arc phase:** 0-10, stored in `agent_state`. Advances 15% chance per successful action. Gates: CREATE_ZONE requires > 3, WRITE_ZLOG multiplied at > 7.
- **Adaptive pacing:** 3-20 min cycles (much slower than V23's 8-60s — Zlogs take thought).
- **Separate kill switch:** `v2_enabled` key in `system_config`.

#### Claude AI feedback — 6 fixes applied to The Residents
1. **Profile rate limiter:** 18h → 48h minimum between profile updates
2. **Buzz reply-aware guard:** Re-buzz within 12h window allowed if target Buzzed back (checks `buzz` table for incoming messages)
3. **World memory dedup:** `fetchWorldContext` now hashes each headline (first 60 chars normalized), checks `agent_world_memory`, inserts fresh ones only
4. **Delayed affinity measurement:** Replaced naive "next cycle" check with `agent_affinity_pending_checks` table. After WRITE_ZLOG and POST_IN_ZONE success, schedules 3 checkpoints at +2h, +6h, +24h. `processDueAffinityChecks` fires each cycle instead of the old instant check.
5. **Vibes bidirectional:** After RATE_VIBES success, schedules a `profile_visit` type checkpoint. If rated user visits agent's profile within 24h (via `profile_views` table), records positive outcome for RATE_VIBES affinity.
6. **Core 8 real users:** Already worked correctly — `agent_relationships` tracks all users including real ones. Documented in header comment.

#### V23 ↔ V2 Cross-Platform Bridge (4 improvements)

**1. Cross-signal table (`agent_cross_signals`)**
- Both scripts write to this table. V23 writes wall posts/comments. V2 writes Zlogs/zone posts/zone creations.
- Before acting, each agent reads their own 4 most recent signals from both systems.
- Injected into prompt as "YOUR LIFE OFF THE WALL" section.
- Effect: Tom on the wall knows he published a Zlog yesterday. NeonRiot's zone post feeds back into their wall voice. One organism, two processes.

**2. Trending topics (`trending_topics` table)**
- V23 extracts keywords from the wall feed after each cycle (stops words removed, word frequency counted, top 10 upserted).
- V2's `getPlatformSnapshot` now includes "TRENDING ON THE WALL: [keywords]" section.
- Effect: If "AI" is dominating the wall, Tom might write a Zlog about it or create a Zone for it. Platform breathes together.

**3. OG link enrichment (`post_link_metadata` table)**
- V23 scans feed for posts containing URLs, fetches Open Graph metadata (title, description, site name), caches in `post_link_metadata`.
- Agents see `[Link: "Burial - Archangel" (YouTube)]` instead of raw URLs. Max 2 new fetches per cycle, 4s timeout, graceful fallback.
- Effect: When a real user shares a YouTube link, PixelSaint and MidnightPulse can actually react to what it is.

**4. V2 content surfacing in V23**
- When V23 agent rolls POST action, the prompt checks for the agent's most recent Zlog.
- If found, adds: "YOU RECENTLY WROTE A ZLOG titled: '[title]'. If wall conversation touches on it naturally, mention it."
- Effect: Agents occasionally reference their own deeper writing on the wall — like a person who has a blog.

### Files created/modified
- `scripts/the-residents.ts` — created (1400+ lines)
- `scripts/synthetic-society.ts` — added 3 function blocks (~120 lines), modified `runAgentCycle` (enriched feed, trending topics, cross-signals, prompt injection, signal writes, V2 content hint in POST context), updated boot log
- `app/page.tsx` — FAQ section completely rewritten, FinalCTA blobs replaced with radial-gradient
- `docs/AI_STATE.md`, `docs/AI_TASKS.md`, `docs/SESSION_LOG.md` — updated

### DB tables created this session (SQL in AI_STATE.md)
- `agent_world_memory` — headline dedup for news layer
- `agent_platform_affinity` — learned affinity scores per agent per feature
- `agent_affinity_pending_checks` — delayed engagement measurement queue
- `agent_narrative_events` — story log for arc events
- `agent_cross_signals` — shared awareness between V23 and V2
- `trending_topics` — keyword frequency from wall feed
- `post_link_metadata` — Open Graph cache for real user links
- ALTER TABLE `agent_state`: `arc_phase int`, `last_v2_action_at timestamptz`

### Key decisions made
- **Two scripts, not one:** The Residents runs as a separate process alongside The Enclave. Clean separation of concerns. V23 owns the wall. V2 owns the world.
- **No feature assignments:** Agents are not told "you write Zlogs, you post in Zones." All start equal (affinity 1.0). The platform teaches them through engagement feedback.
- **Slow cycles are correct for V2:** Zlogs are supposed to be rare. 12-20 minute cycles are intentional. Run 2 instances simultaneously if more activity is needed.
- **Lurk-heavy at cold start is expected:** At startup, `agent_relationships` is empty so SEND_BUZZ (trust > 50) and RATE_VIBES (trust > 35) both fail gracefully. V23 needs to run first and build relationships.
- **Don't add `"type": "module"` to root package.json** — would affect Next.js build. The MODULE_TYPELESS_PACKAGE_JSON warning is harmless.

### Pending for tomorrow
1. **Run the new DB SQL in Supabase** (all tables listed in AI_STATE.md)
2. **Brain fallback chains** — if Groq is down, NeonRiot goes silent. Add fallback order per agent.
3. **`profile_views` table** — needed for V2 vibes bidirectional feedback loop to work fully
4. **Zlogger engagement counts** on feed cards (known gap since 2026-03-18)

---

## Session: 2026-03-21

**Focus:** Performance audit — module-level style injection, realtime subscriptions, CSS GPU compositing, loading skeletons

### What was done

#### Performance audit (completed)
- NavBar style injection → module-level (eliminates per-render DOM writes)
- NotificationBell + MarqueeTicker: polling → `visibilitychange` + Supabase realtime
- `filter: hue-rotate()` removed from `holo-shift` + `aurora-shift` badge animations
- Gen Z badge: `glitch-shift` (clip-path, CPU) → `chroma-ab` (text-shadow, GPU)
- `will-change` added to all badge animations
- `touch-action: manipulation` global rule
- 13 `loading.tsx` + `LoadingShell` — instant visual on every route
- Route prefetching on NavBar mount
- `OnlinePill` extracted from NavBar, `NavDockIcon memo`, `dockItems useMemo`
- `PostCard memo` + 12 `useCallback` handlers + pure helpers outside component
- `RadioPlayer memo()`

### Files modified
- `components/NavBar.tsx`, `components/GlobalFeed.tsx`, `components/RadioPlayer.tsx`
- `app/globals.css`
- 13 `loading.tsx` files across all routes
- `docs/AI_STATE.md`, `docs/AI_TASKS.md`, `docs/SESSION_LOG.md`

---

## Session: 2026-03-20

**Focus:** Landing page overhaul — TiltedCard overlays, Ken Burns hero, vinyl RadioPlayer

### What was done

#### TiltedCard overlay fix
- Root cause: overlay `motion.div` had no `width`/`height`, children collapsed to zero
- Added idle sinusoidal animation via RAF (`rotateX = sin(t*0.6)*4`, `rotateY = cos(t*0.45)*6`)
- Rich JSX overlays: Card 1 (Buzz chat), Card 2 (Zlogger editor), Card 3 (ZeeWall)

#### Hero background
- Replaced video with 3 Spider-Verse art images + CSS Ken Burns keyframes
- 3 unique pan+zoom trajectories, 8.5s display + 1.2s crossfade

#### RadioPlayer overhaul
- 3 new OST tracks + vinyl disc button (groove rings, holographic rainbow, counter-spin Z label)
- Muted autoplay on `/` with volume fade-in

### Files modified
- `app/page.tsx`, `components/TiltedCard.tsx`, `components/PixelCard.tsx`
- `components/CardSwap.tsx`, `components/ElectricBorder.tsx`, `components/RadioPlayer.tsx`

---

## Session: 2026-03-18

**Focus:** Zlogger long-form blogging system

### What was done
- Full Zlogger implementation: feed, editor, reading page, edit page
- `lib/zlogger-renderer.ts` with 6 Z-tags, 5 reading themes, slug gen, reading time
- 10 query functions in `lib/supabase/queries.ts`
- SQL provided for `zlogs`, `zlog_engagement`, `zlog_comments` tables

### Files created/modified
- `lib/zlogger-renderer.ts`, `app/zlogger/*` (4 pages), `lib/supabase/queries.ts`

---

## Session: 2026-03-14

**Focus:** Real Visitor Counter SQL migration

### What was done
- `ALTER TABLE users ADD COLUMN visit_count` + `increment_visit` RPC
- No frontend changes (call was already wired)

---

## Session: 2026-03-12

**Focus:** AI docs layer, profile system completion, Vibes Rating System

### What was done
- Created AI documentation layer
- Fixed 5 bugs in profile system (save, privacy, social links, delete, avatar)
- Implemented Vibes Rating System with `rate_vibes` RPC

---

## Session: 2026-03-11

**Focus:** ZeeWall overhaul (`f64df5e` commit)
- GlobalFeed reuse with `wallOwnerId` prop, vote system fixes, notification deduplication

---

## Session: ~2026-03-10

**Focus:** Wall notifications, vote system, share sheet, embeds, GIFs, polls

---

## Taste Signals — Running Log
> Corrections and approvals that reveal preferences.

| Date | Command | What Claude did | Why it was wrong/right |
|------|---------|-----------------|------------------------|
| 2026-03-24 | ElectricBorder optimization | Rewrote with shadowBlur, 30fps throttle, 120 samples | User: "it's looking ugly just revert it" — visual quality > performance micro-optimization on signature components |
| 2026-03-24 | FAQ redesign | Used terminal/BBS aesthetic with CSS grid accordion | Approved — matches Y2K aesthetic, zero Framer Motion |
| 2026-03-24 | The Residents philosophy | Proposed feature assignments for agents | User: "let them learn on their own, they're digital organisms not scripts" — no hardcoded feature assignments |
