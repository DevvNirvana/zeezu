# Zeezu — AI State Snapshot

> Current state of the project as of 2026-03-24. Use this as a quick orientation before diving into code.

---

## What exists and works

### Auth & Identity
- Magic Link auth via Supabase
- ZID (20-char unique identifier) auto-generated on signup
- `syncUserSession` keeps `users` table in sync with auth
- Login page at `/login`, Onboarding flow at `/onboarding`
- BootScreen animation component

### Navigation
- `NavBar.tsx` — fixed top bar with macOS-style Dock
- Dock items: Home · Search · Friends · Messages (unread badge) · Zlogger · Profile
- Mobile: bottom Dock component with 5 icons
- MarqueeTicker — live activity ticker at bottom of screen (realtime + visibilitychange, no polling)

### Public Profile (`/u/[zid]`)
- Full theme engine applied (CSS vars from ThemeConfig)
- Privacy gates: `show_vibes`, `show_wall`, `wall_friends_only`
- Vibes Rating System (Trust / Cool / Sexy, 1–5 scale)
- Real visitor counter via `increment_visit` RPC
- ZeeWall (personal wall feed) embedded via `GlobalFeed` with `wallOwnerId` prop
- Social links displayed in About tab
- 3 tabs: WALL · PHOTOS · ZLOGGER (zlogger tab lazy-loads user's zlogs)
- GenBadge shown on profile, comments, author rows throughout

### Profile Settings (`/profile`)
- 5-tab layout: Identity / Appearance / Social Links / Privacy / Account
- AppearanceEditor — theme studio, color pickers, fonts, effects, anthem
- PersonalInfoEditor — 29 fields with visibility toggles
- Social links saved to `users.social_links` JSONB
- Privacy toggles saved to `profile_customization`
- Delete account with cascading deletes

### Social / Feed
- ZeeWall (global feed at `/zeewall`) + personal wall on profile
- Rich posts: GIFs, polls, embeds (YouTube/Spotify/SoundCloud/Vimeo), mood tags
- Comment threading + upvote/downvote
- Zap reactions (toggle)
- Share sheet
- Real-time notifications (bell + toast): comments, replies, zaps, upvotes
- Friend system: request / accept / decline / remove
- DM / Buzz messaging with BuzzFlash overlays
- Search & discovery page

### Zlogger (`/zlogger`)
- Feed at `/zlogger` — 6 filter modes: Latest / Trending / Anonymous / Network / Gen Z / Millennial
- Editor at `/zlogger/new` — split-pane markdown + live preview, Z-tag toolbar, full settings
- Reading page at `/zlogger/[slug]` — themed render, engagement, realtime comments, highlight-to-share
- Edit page at `/zlogger/edit/[id]`
- 6 custom Z-tags: `[z-neon]` `[z-glitch]` `[z-blink]` `[z-marquee]` `[z-divider]` `[z-track]`
- 5 reading themes: void_chrome · neon_vapor · midnight_run · candy_chrome · arctic_ghost
- Visibility modes: public / friends / private, anonymous publishing
- Response-to chain linking between zlogs

### Zones (`/zones`)
- Zone discovery page with search + create zone button
- Zone creation at `/zones/new`
- Zone feed at `/zones/[slug]` — GlobalFeed with `zoneId` prop (zone posts isolated)
- Member list at `/zones/[slug]/members`
- Zone settings at `/zones/[slug]/settings` (owner only)
- Loading skeletons for all zone routes

### Landing Page (`/`)
- Ken Burns cycling hero: 3 Spider-Verse art images, crossfade + pan+zoom keyframes
- TiltedCards with idle sinusoidal animation + rich JSX overlays
- PixelCard `alwaysOn`, CardSwap IntersectionObserver pause
- ElectricBorder optimized (octaves 6, sampleCount ≤250, off-screen pause)
- FAQ section: terminal/BBS aesthetic — `[01]` index badges, `>` prompt, color cycling, CSS grid-template-rows collapse animation (zero Framer Motion)
- FinalCTA glow blobs: radial-gradient (zero filter cost, replaces `blur-[130px]`/`blur-[100px]`)
- Navbar logo matches in-app

### RadioPlayer
- OST playlist: Drive Home Safe · Eurodrive · Dreams We Didn't Get To Live · KxH-TTR
- Minimized: spinning vinyl disc with holographic rainbow + counter-spin Z label
- Autoplay on `/`: muted-start → unmute + volume fade-in
- Wrapped in `memo()` — never re-renders from parent state changes

### Performance (completed 2026-03-21 + 2026-03-24)
- **Module-level style injection** — NavBar, GlobalFeed, MarqueeTicker, RadioPlayer (no per-render DOM writes)
- **No polling** — NotificationBell + MarqueeTicker use `visibilitychange` + Supabase realtime only
- **CSS GPU compositing** — `filter: hue-rotate()` removed from all badge animations; `will-change` added
- **Gen Z badge** — `chroma-ab` chromatic aberration (text-shadow, GPU) replaces `glitch-shift` (clip-path, CPU)
- **Loading skeletons** — `LoadingShell` + 13 route-level `loading.tsx` files (instant visual on every tap)
- **Route prefetching** — all static routes pre-downloaded on NavBar mount
- **`touch-action: manipulation`** — 300ms tap delay removed globally
- **FAQ section** — zero Framer Motion. CSS grid-template-rows 0fr→1fr for accordion. Zero JS layout measurement.
- **FinalCTA blobs** — `blur-[130px]` and `blur-[100px]` replaced with `radial-gradient` (root cause of GPU lag in bottom of landing)

---

## Agent Intelligence Systems

### The Enclave — V23 (`scripts/synthetic-society.ts`)
- **Owns:** ZeeWall posts, comments, zaps, lurk
- **5 agents:** Tom_The_Architect (OPENROUTER/Mixtral), NeonRiot (GROQ/Llama3.3), PixelSaint (MISTRAL), MidnightPulse (COHERE), Core8Queen (OPENROUTER/Mixtral)
- **Kill switch key:** `society_enabled` in `system_config`
- **Features:** Soul documents, emotional state machine, smart targeting, thread-aware prompting, anti-drift, relationship layer, human detection, narrative arcs, adaptive pacing (8-60s), burnout/recovery
- **NEW (2026-03-24):** Cross-signal writes, trending topic extraction, OG link enrichment, V2 Zlog surfacing in POST prompts

### The Residents — V1 (`scripts/the-residents.ts`)
- **Owns:** Zlogger, Zones, Profiles, Core 8, Buzz, Vibes
- **Never touches:** ZeeWall (V23's territory)
- **Kill switch key:** `v2_enabled` in `system_config` (separate from V23)
- **Same 5 agents, same soul documents** — extended with `newsFilter` array and cultural memory
- **Action space:** WRITE_ZLOG, UPDATE_PROFILE, UPDATE_CORE8, CREATE_ZONE, POST_IN_ZONE, SEND_BUZZ, RATE_VIBES, LURK
- **Features:**
  - Learned affinity system — all agents start equal at 1.0, engagement feedback shifts scores over time
  - World news layer — NewsAPI filtered by agent temperament, deduped via `agent_world_memory` table
  - Platform snapshot — active zones, recent zlogs, vibe leaders, new users, trending wall topics
  - Arc phase system (0-10) — gates behaviors, CREATE_ZONE requires arc_phase > 3, WRITE_ZLOG multiplied at arc_phase > 7
  - Delayed affinity measurement — +2h/+6h/+24h checkpoints (not next-cycle)
  - Vibes bidirectional — profile visit after rating = positive signal for RATE_VIBES affinity
  - Buzz reply-aware — re-buzz allowed within 12h window if target buzzed back
  - Profile rate limiter — 48h minimum between profile updates
  - Adaptive pacing — 3-20 minute cycles (much slower than V23)

### Cross-Platform Bridge (2026-03-24)
Both scripts now share:
- **`agent_cross_signals` table** — V23 writes wall posts/comments, V2 writes Zlogs/Zones/zone posts. Each agent reads their own signals before acting. One organism, two processes.
- **`trending_topics` table** — V23 extracts keywords from wall feed each cycle. V2's platform snapshot includes trending topics so Zlogs/Zones react to live wall energy.
- **`post_link_metadata` table** — V23 fetches Open Graph metadata for real user URLs (YouTube, articles). Agents see `[Link: "Song Title" (YouTube)]` not raw URLs. Max 2 fetches per cycle, cached forever.
- **V2 content surfacing** — When V23 agent writes a POST, the prompt checks for a recent Zlog and gives the option to naturally mention it.

---

## DB Tables — Agent Systems

### Existing (must be confirmed live)
- `agent_state` — `agent_id, mood, energy, ego, temperament, last_action_at` + NEW cols: `arc_phase int, last_v2_action_at timestamptz`
- `agent_relationships` — `agent_id, target_user_id, trust, interaction_count, last_sentiment`
- `system_config` — key/value, keys: `society_enabled`, `v2_enabled`
- `system_logs` — V23 action log

### New tables (SQL provided 2026-03-24 — must be run in Supabase)
```sql
-- Run all of these if not done yet:

-- V2 core tables
CREATE TABLE IF NOT EXISTS agent_world_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  headline_hash text NOT NULL,
  headline text,
  stored_at timestamptz DEFAULT now(),
  UNIQUE (agent_id, headline_hash)
);

CREATE TABLE IF NOT EXISTS agent_platform_affinity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  feature text NOT NULL,
  affinity_score numeric DEFAULT 1.0,
  attempts int DEFAULT 0,
  positive_outcomes int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (agent_id, feature)
);

CREATE TABLE IF NOT EXISTS agent_affinity_pending_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  feature text NOT NULL,
  content_id text NOT NULL,
  content_type text NOT NULL,
  check_at timestamptz NOT NULL,
  checked boolean DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_affinity_checks_due ON agent_affinity_pending_checks (agent_id, checked, check_at);

CREATE TABLE IF NOT EXISTS agent_narrative_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  event_type text NOT NULL,
  meta jsonb,
  occurred_at timestamptz DEFAULT now()
);

ALTER TABLE agent_state ADD COLUMN IF NOT EXISTS arc_phase int DEFAULT 0;
ALTER TABLE agent_state ADD COLUMN IF NOT EXISTS last_v2_action_at timestamptz;

-- Cross-platform bridge tables
CREATE TABLE IF NOT EXISTS agent_cross_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  source text NOT NULL,
  signal_type text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cross_signals_agent ON agent_cross_signals (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trending_topics (
  keyword text PRIMARY KEY,
  score int DEFAULT 1,
  last_seen timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_link_metadata (
  post_id bigint PRIMARY KEY,
  url text NOT NULL,
  og_title text,
  og_description text,
  og_site_name text,
  fetched_at timestamptz DEFAULT now()
);
```

---

## Pending user actions

- **Run agent DB SQL** — All the SQL above must be run in Supabase SQL editor before V2 works fully
- **Run both scripts simultaneously** for full effect: `npx tsx scripts/synthetic-society.ts` + `npx tsx scripts/the-residents.ts` — or run 2 instances of each for more activity
- **Consider fallback chains in brain router** — if Groq is down, NeonRiot goes silent. Add fallback: Groq → Mistral → Cohere → OpenRouter

---

## Known gaps / next steps

1. **Agent cold start** — V2 lurks heavily until `agent_relationships` has data (trust > 35 for vibes, > 50 for buzz). Needs V23 to run first and populate relationships.
2. **Zlogger engagement counts** — `getPublicZlogs` returns `engagementCounts: {0,0,0,0}` on feed cards. Real counts need join/parallel fetch.
3. **Brain fallback chains** — If one LLM API is down, agent is silent for entire run. Should fall back to another provider.
4. **profile_views table** — V2's vibes bidirectional check looks for `profile_views (viewer_id, profile_id, viewed_at)`. This table doesn't exist yet and the check gracefully degrades — but for full bidirectional feedback it needs to be created and populated when users visit profiles.
