# Zeezu — AI State Snapshot

> Current state of the project as of 2026-03-18. Use this as a quick orientation before diving into code.

---

## What exists and works

### Auth & Identity
- Magic Link auth via Supabase
- ZID (20-char unique identifier) auto-generated on signup
- `syncUserSession` keeps `users` table in sync with auth
- Login page at `/login`
- Onboarding flow at `/onboarding`
- BootScreen animation component

### Navigation
- `NavBar.tsx` — fixed top bar with macOS-style Dock
- Dock items: Home (`/dashboard`) · Search · Friends · Messages (unread badge) · **Zlogger** (`/zlogger`) · Profile
- ZeeWall was removed from dock and replaced by Zlogger this session

### Public Profile (`/u/[zid]`)
- Full theme engine applied (CSS vars from ThemeConfig)
- Privacy gates: `show_vibes`, `show_wall`, `wall_friends_only`
- Vibes Rating System (Trust / Cool / Sexy, 1–5 scale)
- Real visitor counter via `increment_visit` RPC
- ZeeWall (personal wall feed) embedded via `GlobalFeed` with `wallOwnerId` prop
- Social links displayed in About tab
- Avatar from `users.avatar_url` or dicebear fallback
- **3 tabs: WALL · PHOTOS · ZLOGGER** (zlogger tab lazy-loads user's zlogs)
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

### Zlogger (`/zlogger`) — NEW this session
- Feed at `/zlogger` — 6 filter modes: Latest / Trending / Anonymous / Network / Gen Z / Millennial
- Editor at `/zlogger/new` — split-pane markdown + live preview, Z-tag toolbar, full settings
- Reading page at `/zlogger/[slug]` — themed render, engagement, realtime comments, highlight-to-share
- Edit page at `/zlogger/edit/[id]`
- 6 custom Z-tags: `[z-neon]` `[z-glitch]` `[z-blink]` `[z-marquee]` `[z-divider]` `[z-track]`
- 5 reading themes: void_chrome · neon_vapor · midnight_run · candy_chrome · arctic_ghost
- Visibility modes: public / friends / private
- Anonymous publishing (author hidden on feed + reading page)
- Response-to chain linking between zlogs
- `lib/zlogger-renderer.ts` — renderer, slug gen, reading time, CSS constants
- All DB query functions in `lib/supabase/queries.ts`

### Components
- `ProfileCard.tsx` — 3D Three.js tilt card
- `ThemeEngine.tsx` — CSS variable injection
- `GenBadge.tsx` — generation label (Gen Z / Millennial / Gen X / Boomer / Gen Alpha / Synthetic)
- `Dock.tsx` + `Dock.css` — macOS-style icon dock
- `BootScreen.tsx` — animated boot sequence
- `ReflectiveCard.tsx` — glossy reflective card surface
- `RadioPlayer.tsx` — ambient radio player
- `reactbits/DecryptedText.tsx` — text decryption animation

### Libraries
- `lib/generation.ts` — birth year + month + day → generation + metadata
- `lib/agents.ts` — AI agent definitions
- `lib/zlogger-renderer.ts` — Zlogger markdown renderer

---

## Pending user action

- **Zlogger SQL** — Run in Supabase SQL editor to create `zlogs`, `zlog_engagement`, `zlog_comments` tables + RLS policies + trigger. SQL was provided in session 2026-03-18. Until this is done, all Zlogger DB calls will fail silently (graceful degradation — pages load but data won't save/fetch).

---

## Known gaps / immediate next steps

1. **Feed engagement counts** — `getPublicZlogs` returns `engagementCounts: {0,0,0,0}` on all feed cards. Real counts need a parallel fetch or DB join. Low priority until content exists.
2. **End-to-end Zlogger test** — create → publish → read → engage → comment → realtime (two tabs)
3. **Anonymous post verification** — confirm author data is fully hidden in feed cards and reading page

---

## Next meaningful features

See `docs/AI_TASKS.md` Future Roadmap. Top candidates:
1. **Zlogger featured post** — `setFeaturedZlog` query exists, needs profile UI to pin one post
2. **Zones** — Topic-based communities (major feature, not started)
3. **Notification preferences** — Granular control
4. **Mobile PWA** — Manifest, service worker, push notifications
