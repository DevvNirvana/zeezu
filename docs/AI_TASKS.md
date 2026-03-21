# Zeezu — Task Tracker

> Authoritative list of completed, in-progress, and planned work.
> Last updated: 2026-03-20

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
- [x] Character counters on text inputs
- [x] `social_links` saved to users table on save
- [x] `personal_info` saved to users table on save
- [x] Delete account fully implemented (cascading deletes + signOut)
- [x] Public profile (`/u/[zid]`) — full privacy respect:
  - Vibes gated by `show_vibes` setting
  - Wall gated by `show_wall` setting
  - Post input gated by `wall_friends_only` setting
- [x] Social links displayed on public profile About tab
- [x] Public profile uses `users.avatar_url` (falls back to dicebear)
- [x] **Vibes Rating System** — 1–5 widget (trust/cool/sexy), aggregates via `rate_vibes` RPC, loads existing rating

### Landing Page Overhaul (completed 2026-03-20)
- [x] Ken Burns hero: 3 Spider-Verse art images with crossfade + 3 unique pan/zoom keyframes
- [x] TiltedCard overlay fix: `width`/`height` on wrapper div → overlays now render
- [x] TiltedCard idle RAF: sinusoidal rotation when not hovered, IntersectionObserver gate
- [x] Rich Buzz chat overlay (Card 1) — BuzzFlash, chat thread, read receipts
- [x] Rich Zlogger editor overlay (Card 2) — split-pane, theme pills, Z-tag palette, preview
- [x] PixelCard `alwaysOn` mode — always-active pixel effect, viewport-aware RAF pause
- [x] CardSwap IntersectionObserver — pauses GSAP + setInterval when off-screen
- [x] ElectricBorder optimized — octaves 6, sampleCount ≤250, off-screen RAF stop
- [x] Landing navbar logo matches in-app: SVG quadrant + Orbitron + VT323 "NET"
- [x] Performance CSS: no `backdrop-filter` on glass, no `will-change` on animations
- [x] Hero + TickerStrip `animation-play-state: paused` via IntersectionObserver
- [x] RadioPlayer vinyl button: spinning grooves + holographic rainbow + counter-spin Z label
- [x] RadioPlayer OST: 4 tracks (Drive Home Safe first), `trackNames` in marquee
- [x] RadioPlayer muted autoplay on `/` — fade-in volume, Safari fallback

### Platform Components (completed 2026-03-18)
- [x] **BootScreen** — animated boot sequence component
- [x] **Dock** component (`components/Dock.tsx` + `Dock.css`) — macOS-style icon dock
- [x] **GenBadge** — generation label badge (Gen Z / Millennial / Gen X / Boomer / Gen Alpha)
- [x] **ReflectiveCard** — glossy reflective card surface component
- [x] **DecryptedText** reactbit — text decryption animation
- [x] **RadioPlayer** — full rebuild
- [x] **Generation system** (`lib/generation.ts`) — birth year → generation + metadata
- [x] **Agent definitions** (`lib/agents.ts`)
- [x] Login page (`/login`) + Onboarding flow (`/onboarding`)
- [x] NavBar dock rebuilt: Home / Search / Friends / Messages / Zlogger / Profile
- [x] Dashboard, Friends, Messages, Search, ZeeWall — full page overhauls

### Zlogger — Long-Form Blogging (completed 2026-03-18)
- [x] `/zlogger` feed — Latest/Trending/Anonymous/Network/Gen Z/Millennial filters, ZlogCard, load more, search
- [x] `/zlogger/new` — split-pane markdown editor + live preview, Z-tag toolbar, publishing settings
- [x] `/zlogger/[slug]` — reading page: themed render, engagement (zap/vibe/save), realtime comments, text highlight-to-share tooltip, Echo button
- [x] `/zlogger/edit/[id]` — edit existing zlog (pre-filled editor)
- [x] `lib/zlogger-renderer.ts` — `renderZlog()`, `generateSlug()`, `readingTimeMinutes()`, `ZLOG_CSS`, Z-tag preprocessor
- [x] `lib/supabase/queries.ts` — 10 new Zlogger functions: `createZlog`, `updateZlog`, `deleteZlog`, `getZlogBySlug`, `getPublicZlogs`, `getUserZlogs`, `engageZlog`, `getZlogComments`, `addZlogComment`, `setFeaturedZlog`
- [x] Custom Z-tags: `[z-neon]`, `[z-glitch]`, `[z-blink]`, `[z-marquee]`, `[z-divider]`, `[z-track]`
- [x] 5 reading themes: void_chrome, neon_vapor, midnight_run, candy_chrome, arctic_ghost
- [x] NavBar dock: ZeeWall → Zlogger (BookOpen icon, `#B4FF00` accent)
- [x] Profile `/u/[zid]` — ZLOGGER tab with lazy-load (owner sees all visibilities, others see public only)
- [x] Dependencies: `marked` v17, `dompurify`, `@types/dompurify`

### DB Schema (live in Supabase as of 2026-03-14)
- [x] `users.social_links` JSONB DEFAULT '{}'
- [x] `users.personal_info` JSONB DEFAULT '{}'
- [x] `profile_customization.show_vibes` BOOLEAN DEFAULT true
- [x] `profile_customization.show_wall` BOOLEAN DEFAULT true
- [x] `profile_customization.wall_friends_only` BOOLEAN DEFAULT false
- [x] `profile_customization.show_online` BOOLEAN DEFAULT true
- [x] `vibes_ratings` table with RLS + `rate_vibes` RPC

### DB Schema — Zlogger (SQL provided 2026-03-18, user to confirm applied)
- [ ] `zlogs` table — id, user_id, title, slug, content_markdown, content_html, cover_image_url, theme, mood, is_anonymous, visibility, notify_core8, notify_friends, share_to_zeewall, is_featured, response_to, created_at, updated_at
- [ ] `zlog_engagement` table — zlog_id, user_id, type (zap/vibe/save/comment), UNIQUE constraint
- [ ] `zlog_comments` table — zlog_id, user_id, content
- [ ] RLS policies on all three tables
- [ ] `set_updated_at()` trigger on zlogs
- [ ] Indexes on user_id, slug, visibility+created_at, response_to, zlog_id+type

### Real Visitor Counter (completed 2026-03-14)
- [x] `users.visit_count` INTEGER DEFAULT 0
- [x] `increment_visit(p_user_id UUID)` RPC — increments and returns new count
- [x] Public profile (`/u/[zid]`) calls RPC on every page load

---

## 🚧 In Progress

- [ ] **Zlogger SQL** — tables + RLS provided to user, awaiting confirmation it was run in Supabase

---

## 📋 Next Up

- [ ] **End-to-end Zlogger test** — create zlog → publish → read → engage → comment → realtime in two tabs
- [ ] **Feed engagement counts** — `getPublicZlogs` currently returns `engagementCounts: {0,0,0,0}`; needs a join or parallel fetch to show real counts on cards
- [ ] **Anonymous post verification** — confirm author is fully hidden on reading page + feed

---

## 🔮 Future Roadmap

- [ ] **Zones** — Topic-based communities (major feature, not started)
- [ ] **Zlogger response chains** — UI for browsing full response threads (/zlogger/[slug] shows chain)
- [ ] **Zlogger featured post** — `setFeaturedZlog` is implemented, needs UI on profile to pin one
- [ ] **Theme Track ambient audio** — Auto-play on profile visit (muted-start technique now proven in RadioPlayer — apply same pattern)
- [ ] **Invite-only launch mechanism** — Referral/invite codes
- [ ] **Mobile PWA features** — Manifest, service worker, push notifications
- [ ] **AI Enclave agents** — Framework exists in `lib/agents.ts`, needs UI layer
- [ ] **Notification preferences** — Granular control over which events trigger notifications
