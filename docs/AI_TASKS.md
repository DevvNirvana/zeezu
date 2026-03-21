# Zeezu — Task Tracker

> Authoritative list of completed, in-progress, and planned work.
> Last updated: 2026-03-21

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

### Performance Optimizations (completed 2026-03-21)
- [x] NavBar style injection → module-level (eliminates per-render DOM writes)
- [x] NotificationBell polling → `visibilitychange` + Supabase realtime subscription (replaces 10s interval)
- [x] MarqueeTicker polling → `visibilitychange` + Supabase realtime subscription (replaces 60s interval, 3 queries)
- [x] CSS animations: removed `filter: hue-rotate()` from `holo-shift` + `aurora-shift` (was running at 60fps on CPU)
- [x] Gen Z badge: replaced `glitch-shift` (clip-path, CPU) with `chroma-ab` (chromatic aberration via text-shadow, GPU)
- [x] Added `will-change: background-position / text-shadow` to all badge animations
- [x] `touch-action: manipulation` global rule — removes 300ms mobile tap delay
- [x] Loading skeletons: 13 `loading.tsx` files + `LoadingShell` component (instant visual on every route)
- [x] Route prefetching — `router.prefetch()` on NavBar mount for all static routes
- [x] NavBar re-renders: extracted `OnlinePill` (owns its own state), `React.memo` on `NavDockIcon`, `useMemo` on `dockItems`
- [x] GlobalFeed: extracted `PostCard` as `memo()`, `useCallback` on all 12 handlers, pure helpers moved outside component, state refs pattern for stable callbacks — typing in one comment box no longer re-renders all 15 posts
- [x] RadioPlayer: wrapped in `memo()` — 1200-line component no longer re-renders on parent state changes

### Social Features
- [x] Dashboard with Core 8 slot management (drag to assign)
- [x] ZeeWall (global public chronological feed)
- [x] GlobalFeed with rich content:
  - GIF picker
  - Polls (up to 5 options)
  - YouTube/Spotify/SoundCloud/Vimeo embeds
  - Mood tags with gradient colors
  - Top/New sort tabs
- [x] Comment threading (nested replies)
- [x] Comment upvote/downvote (`comment_votes` table)
- [x] Zap (post reaction) system with toggle logic
- [x] Share sheet (platform options + native sharing)
- [x] Real-time notifications (bell + toast)
  - Comment, reply, zap, upvote events
  - Notification deduplication
- [x] Friend system (requests, accept, decline, remove)
- [x] DM/Buzz messaging with BuzzFlash overlays
- [x] Search & discovery page

### Profile System (fully complete as of 2026-03-12)
- [x] Profile settings page with 5-tab layout:
  - Identity (name, status, bio, avatar, personal info, vibes display)
  - Appearance (theme studio, color pickers, fonts, effects, anthem)
  - Social Links (6 platforms) — saves to `users.social_links` JSONB
  - Privacy (4 toggles) — saves to `profile_customization`
  - Account (email, ZID, sign out, delete account)
- [x] AppearanceEditor component (600+ lines)
- [x] PersonalInfoEditor component (29 fields, visibility toggles)
- [x] ProfileCard 3D preview (Three.js tilt)
- [x] Profile completeness meter
- [x] Unsaved changes warning + `beforeunload` handler
- [x] `social_links` + `personal_info` saved to users table on save
- [x] Delete account fully implemented (cascading deletes + signOut)
- [x] Public profile (`/u/[zid]`) — full privacy respect
- [x] Social links displayed on public profile About tab
- [x] **Vibes Rating System** — 1–5 widget (trust/cool/sexy), aggregates via `rate_vibes` RPC

### Landing Page Overhaul (completed 2026-03-20)
- [x] Ken Burns hero: 3 Spider-Verse art images with crossfade + 3 unique pan/zoom keyframes
- [x] TiltedCard overlay fix + idle RAF sinusoidal rotation
- [x] Rich Buzz chat overlay (Card 1) + Rich Zlogger editor overlay (Card 2)
- [x] PixelCard `alwaysOn` mode + CardSwap IntersectionObserver pause
- [x] ElectricBorder optimized — octaves 6, sampleCount ≤250, off-screen RAF stop
- [x] Landing navbar logo matches in-app
- [x] RadioPlayer vinyl button: spinning grooves + holographic rainbow + counter-spin Z label
- [x] RadioPlayer OST: 4 tracks, muted autoplay on `/` with fade-in

### Platform Components
- [x] **BootScreen**, **Dock**, **GenBadge**, **ReflectiveCard**, **DecryptedText**, **RadioPlayer**
- [x] Login page + Onboarding flow
- [x] NavBar dock: Home / Search / Friends / Messages / Zlogger / Profile

### Zlogger — Long-Form Blogging (completed 2026-03-18)
- [x] `/zlogger` feed — Latest/Trending/Anonymous/Network/Gen Z/Millennial filters
- [x] `/zlogger/new` — split-pane editor + live preview, Z-tag toolbar, publishing settings
- [x] `/zlogger/[slug]` — reading page with themed render, engagement, realtime comments, highlight-to-share
- [x] `/zlogger/edit/[id]` — edit existing zlog
- [x] `lib/zlogger-renderer.ts` — renderer, slug gen, reading time, ZLOG_CSS, Z-tag preprocessor
- [x] 10 Zlogger query functions in `lib/supabase/queries.ts`
- [x] 6 custom Z-tags: `[z-neon]`, `[z-glitch]`, `[z-blink]`, `[z-marquee]`, `[z-divider]`, `[z-track]`
- [x] 5 reading themes: void_chrome, neon_vapor, midnight_run, candy_chrome, arctic_ghost
- [x] Profile `/u/[zid]` — ZLOGGER tab with lazy-load

### Zones — Topic Communities (completed ~2026-03-19)
- [x] `/zones` — zone discovery + search + create zone
- [x] `/zones/new` — zone creation form
- [x] `/zones/[slug]` — zone feed (GlobalFeed with `zoneId` prop)
- [x] `/zones/[slug]/members` — member list
- [x] `/zones/[slug]/settings` — zone settings (owner only)
- [x] Loading skeletons for all zone routes

### DB Schema (live in Supabase)
- [x] `users.social_links` JSONB, `users.personal_info` JSONB
- [x] `profile_customization` privacy toggles
- [x] `vibes_ratings` table + `rate_vibes` RPC
- [x] `users.visit_count` + `increment_visit` RPC

### DB Schema — Zlogger (SQL provided 2026-03-18)
- [ ] `zlogs`, `zlog_engagement`, `zlog_comments` tables + RLS + trigger — **awaiting user confirmation it was run in Supabase**

---

## 🚧 In Progress

- [ ] **Zlogger SQL** — tables + RLS provided to user, awaiting confirmation it was run in Supabase

---

## 📋 Next Up

- [ ] **End-to-end Zlogger test** — create zlog → publish → read → engage → comment → realtime in two tabs
- [ ] **Feed engagement counts** — `getPublicZlogs` currently returns `engagementCounts: {0,0,0,0}`; needs a join or parallel fetch
- [ ] **Anonymous post verification** — confirm author is fully hidden on reading page + feed

---

## 🔮 Future Roadmap

- [ ] **Zlogger response chains** — UI for browsing full response threads (/zlogger/[slug] shows chain)
- [ ] **Zlogger featured post** — `setFeaturedZlog` is implemented, needs UI on profile to pin one post
- [ ] **Theme Track ambient audio** — Auto-play on profile visit (muted-start pattern proven in RadioPlayer)
- [ ] **Invite-only launch mechanism** — Referral/invite codes
- [ ] **Mobile PWA features** — Service worker, push notifications
- [ ] **AI Enclave agents** — Framework exists in `lib/agents.ts`, needs UI layer
- [ ] **Notification preferences** — Granular control over which events trigger notifications
