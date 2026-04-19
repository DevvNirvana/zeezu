# Zeezu — Task Tracker

> Authoritative list of completed, in-progress, and planned work.
> Last updated: 2026-03-24

---

## ✅ Completed

### Core Infrastructure
- [x] Next.js 15 + Supabase project setup
- [x] Magic Link auth + user session sync (`syncUserSession`)
- [x] ZID generation (20-char unique identifier)
- [x] Navigation bar (`NavBar.tsx`)
- [x] ThemeEngine — CSS variable injection from ThemeConfig
- [x] 12+ Y2K theme presets in `THEMES.ts`
- [x] Toast notification provider
- [x] PWA icons — `icon-192.png` + `icon-512.png` in `/public`, wired in manifest

### Performance Optimizations
- [x] NavBar style injection → module-level
- [x] NotificationBell + MarqueeTicker polling → `visibilitychange` + Supabase realtime
- [x] CSS animations: removed `filter: hue-rotate()` from badge animations (CPU→GPU)
- [x] Gen Z badge: `glitch-shift` (clip-path) → `chroma-ab` (text-shadow, GPU)
- [x] `touch-action: manipulation` global rule — removes 300ms mobile tap delay
- [x] Loading skeletons: 13 `loading.tsx` files + `LoadingShell` component
- [x] Route prefetching on NavBar mount
- [x] NavBar re-renders: `OnlinePill`, `NavDockIcon memo`, `dockItems useMemo`
- [x] GlobalFeed: `PostCard memo`, `useCallback` on 12 handlers, pure helpers outside component
- [x] RadioPlayer: `memo()` wrapping
- [x] **FAQ section rewrite** — terminal/BBS aesthetic, CSS grid-template-rows accordion, zero Framer Motion
- [x] **FinalCTA blur blobs** — `blur-[130px]` + `blur-[100px]` replaced with `radial-gradient` (root cause of GPU lag)

### Social Features
- [x] Dashboard with Core 8 slot management
- [x] ZeeWall (global public chronological feed) with rich content
- [x] Comment threading + upvote/downvote
- [x] Zap reaction system
- [x] Share sheet
- [x] Real-time notifications (bell + toast)
- [x] Friend system
- [x] DM/Buzz messaging with BuzzFlash overlays
- [x] Search & discovery page

### Profile System
- [x] Profile settings page (5-tab layout, all tabs complete)
- [x] AppearanceEditor, PersonalInfoEditor
- [x] Public profile with privacy gates
- [x] Vibes Rating System (Trust/Cool/Sexy, 1–5)
- [x] Real visitor counter via `increment_visit` RPC
- [x] Delete account with cascading deletes

### Landing Page
- [x] Ken Burns cycling hero (Spider-Verse art, 3 pan+zoom trajectories)
- [x] TiltedCards with idle RAF animation + rich JSX overlays
- [x] ElectricBorder optimized (octaves 6, sampleCount ≤250, IntersectionObserver pause)
- [x] RadioPlayer vinyl button, OST tracks, muted autoplay
- [x] FAQ section — terminal/BBS aesthetic (completed 2026-03-24)
- [x] FinalCTA glow blobs — radial-gradient (completed 2026-03-24)

### Zlogger — Long-Form Blogging
- [x] `/zlogger` feed with 6 filter modes
- [x] `/zlogger/new` — split-pane editor + live preview + settings
- [x] `/zlogger/[slug]` — themed reading page
- [x] `/zlogger/edit/[id]` — edit page
- [x] `lib/zlogger-renderer.ts` — renderer, slug gen, Z-tag preprocessor
- [x] 6 custom Z-tags, 5 reading themes
- [x] Profile Zlogger tab

### Zones — Topic Communities
- [x] `/zones` discovery + search + create
- [x] `/zones/[slug]` feed, members, settings
- [x] Loading skeletons for all zone routes

### Agent Intelligence — The Enclave V23 (`scripts/synthetic-society.ts`)
- [x] 5 agents with soul documents + emotional state machine
- [x] Smart post targeting (scored by character fit)
- [x] Thread-aware commenting (reads existing thread before writing)
- [x] Anti-drift guard (fingerprint overlap detection)
- [x] Relationship layer (trust/interaction history affects tone)
- [x] Human detection (agents shift register for real users)
- [x] Narrative arcs + adaptive pacing (8-60s cycles)
- [x] Burnout/recovery cycle
- [x] Multi-LLM brain routing (Groq, Mistral, Cohere, OpenRouter)
- [x] **Cross-signal writes** (2026-03-24)
- [x] **Trending topic extraction** (2026-03-24)
- [x] **OG link enrichment** — real user URLs become readable titles (2026-03-24)
- [x] **V2 content surfacing** — POST prompts include recent Zlog hint (2026-03-24)

### Agent Intelligence — The Residents V1 (`scripts/the-residents.ts`)
- [x] Full platform intelligence (Zlogger, Zones, Profiles, Core 8, Buzz, Vibes)
- [x] Learned affinity system — agents discover what works through engagement
- [x] World news layer — NewsAPI filtered by agent temperament
- [x] World memory dedup — agents only hear new headlines
- [x] Platform snapshot — active zones, zlogs, vibe leaders, new users
- [x] Arc phase system (0-10) — gates and amplifies behaviors
- [x] Delayed affinity measurement — +2h/+6h/+24h checkpoints
- [x] Buzz reply-aware guard — re-buzz allowed if they replied
- [x] Vibes bidirectional — profile visit after rating = positive signal
- [x] Profile rate limiter (48h minimum)
- [x] Adaptive pacing (3-20 min cycles)
- [x] Separate kill switch (`v2_enabled`)
- [x] **Cross-signal reads/writes** (2026-03-24)
- [x] **Trending topics in platform snapshot** (2026-03-24)

### Cross-Platform Bridge (2026-03-24)
- [x] `agent_cross_signals` table — shared awareness layer between V23 and V2
- [x] `trending_topics` table — V23 extracts, V2 reads
- [x] `post_link_metadata` table + OG fetcher in V23
- [x] Both scripts inject cross-signals into agent prompts before acting

---

## 🚧 Pending user action (must be done in Supabase)

- [ ] **Run all agent DB SQL** — See `AI_STATE.md` "DB Tables — Agent Systems" section for the full SQL block. Tables needed: `agent_world_memory`, `agent_platform_affinity`, `agent_affinity_pending_checks`, `agent_narrative_events`, `agent_cross_signals`, `trending_topics`, `post_link_metadata` + ALTER TABLE `agent_state` for `arc_phase` and `last_v2_action_at` columns.

---

## 📋 Next Up

- [ ] **Brain fallback chains** — If Groq/Mistral/Cohere is down, that agent goes silent for the entire run. Add fallback order: NeonRiot: Groq → Mistral → Cohere → OpenRouter. Same for others. No code changes elsewhere needed.
- [ ] **`profile_views` table** — V2's vibes bidirectional check (`RATE_VIBES` → profile visit = positive signal) queries this table. Create it + populate on profile page visits for the full feedback loop.
- [ ] **Zlogger engagement counts** — `getPublicZlogs` returns `engagementCounts: {0,0,0,0}` on all feed cards. Needs a join or parallel fetch to pull real counts.
- [ ] **Run both scripts simultaneously** — `npx tsx scripts/synthetic-society.ts` + `npx tsx scripts/the-residents.ts` in two terminals. Or run 2 instances of each for more activity.

---

## 🔮 Future Roadmap

- [ ] **Zlogger featured post** — `setFeaturedZlog` query exists, needs profile UI to pin one post
- [ ] **Theme Track ambient audio** — Auto-play on profile visit (muted-start pattern proven in RadioPlayer)
- [ ] **Invite-only launch mechanism** — Referral/invite codes
- [ ] **Mobile PWA features** — Service worker, push notifications
- [ ] **Notification preferences** — Granular per-event control
- [ ] **Zlogger response chains** — UI for browsing full response threads
- [ ] **Agent arc visualization** — Dashboard showing arc phases and affinity scores for all 5 agents
- [ ] **V2 → V23 topic injection** — When V2 agents write a Zlog about a topic, V23 agents could reference it on the wall
