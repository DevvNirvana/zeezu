# Zeezu — AI State Snapshot

> Current state of the project as of 2026-03-21. Use this as a quick orientation before diving into code.

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
- Navbar logo matches in-app

### RadioPlayer
- OST playlist: Drive Home Safe · Eurodrive · Dreams We Didn't Get To Live · KxH-TTR
- Minimized: spinning vinyl disc with holographic rainbow + counter-spin Z label
- Autoplay on `/`: muted-start → unmute + volume fade-in
- Wrapped in `memo()` — never re-renders from parent state changes

### Performance (completed 2026-03-21)
- **Module-level style injection** — NavBar, GlobalFeed, MarqueeTicker, RadioPlayer (no per-render DOM writes)
- **No polling** — NotificationBell + MarqueeTicker use `visibilitychange` + Supabase realtime only
- **CSS GPU compositing** — `filter: hue-rotate()` removed from all badge animations; `will-change` added
- **Gen Z badge** — `chroma-ab` chromatic aberration (text-shadow, GPU) replaces `glitch-shift` (clip-path, CPU)
- **Loading skeletons** — `LoadingShell` + 13 route-level `loading.tsx` files (instant visual on every tap)
- **Route prefetching** — all static routes pre-downloaded on NavBar mount
- **`touch-action: manipulation`** — 300ms tap delay removed globally
- **NavBar isolation** — `OnlinePill` owns its own state, `NavDockIcon` memoized, `dockItems` memoized
- **GlobalFeed** — `PostCard` extracted as `memo()` with sliced per-post props; 12 handlers wrapped in `useCallback`; pure helpers outside component; state refs for stable closures
- **RadioPlayer** — `memo()` wrapping

### PWA
- `icon-192.png` + `icon-512.png` in `/public`, wired in manifest

### Components
- `ProfileCard.tsx` — 3D Three.js tilt card
- `ThemeEngine.tsx` — CSS variable injection
- `GenBadge.tsx` — generation label (Gen Z / Millennial / Gen X / Boomer / Gen Alpha / Synthetic)
- `Dock.tsx` + `Dock.css` — macOS-style icon dock
- `BootScreen.tsx` — animated boot sequence
- `LoadingShell.tsx` — skeleton NavBar + dock wrapper for all loading states
- `ReflectiveCard.tsx` — glossy reflective card surface
- `RadioPlayer.tsx` — ambient radio player with vinyl UI + autoplay
- `TiltedCard.tsx` — 3D tilt card with idle RAF animation + overlay support
- `PixelCard.tsx` — canvas pixel animation with `alwaysOn` mode
- `CardSwap.tsx` — GSAP card cycling with viewport-aware pause
- `ElectricBorder.tsx` — neon border animation (performance-optimized)
- `reactbits/DecryptedText.tsx` — text decryption animation

### Libraries
- `lib/generation.ts` — birth year + month + day → generation + metadata
- `lib/agents.ts` — AI agent definitions
- `lib/zlogger-renderer.ts` — Zlogger markdown renderer, slug gen, reading time, ZLOG_CSS

---

## Pending user action

- **Zlogger SQL** — Run in Supabase SQL editor to create `zlogs`, `zlog_engagement`, `zlog_comments` tables + RLS policies + trigger. SQL was provided in session 2026-03-18. Until this is done, all Zlogger DB calls will fail silently.

---

## Known gaps / immediate next steps

1. **End-to-end Zlogger test** — create → publish → read → engage → comment → realtime (two tabs)
2. **Feed engagement counts** — `getPublicZlogs` returns `engagementCounts: {0,0,0,0}` on all feed cards
3. **Anonymous post verification** — confirm author data is fully hidden in feed cards and reading page

---

## Next meaningful features

See `docs/AI_TASKS.md` Future Roadmap. Top candidates:
1. **Zlogger featured post** — `setFeaturedZlog` query exists, needs profile UI to pin one post
2. **AI Enclave agents** — Framework in `lib/agents.ts`, needs UI layer
3. **Mobile PWA** — Service worker, push notifications
4. **Notification preferences** — Granular per-event control
