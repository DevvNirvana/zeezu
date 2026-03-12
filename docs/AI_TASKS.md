# Zeezu — Task Tracker

> Authoritative list of completed, in-progress, and planned work.
> Last updated: 2026-03-12

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

### DB Schema (live in Supabase as of 2026-03-12)
- [x] `users.social_links` JSONB DEFAULT '{}'
- [x] `users.personal_info` JSONB DEFAULT '{}'
- [x] `profile_customization.show_vibes` BOOLEAN DEFAULT true
- [x] `profile_customization.show_wall` BOOLEAN DEFAULT true
- [x] `profile_customization.wall_friends_only` BOOLEAN DEFAULT false
- [x] `profile_customization.show_online` BOOLEAN DEFAULT true
- [x] `vibes_ratings` table with RLS + `rate_vibes` RPC

---

## 🚧 In Progress

*(Nothing actively in flight)*

---

## 📋 Next Up

### Real Visitor Counter
- Add `visit_count` INTEGER to `users` table, increment on profile view via RPC
- One-liner SQL: `ALTER TABLE users ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;`
- RPC: `CREATE OR REPLACE FUNCTION increment_visit(p_user_id UUID) ...`

---

## 🔮 Future Roadmap

- [ ] **Zones** — Topic-based communities (major feature, not started)
- [ ] **Theme Track ambient audio** — Auto-play on profile visit (browser policy blocks this currently)
- [ ] **Invite-only launch mechanism** — Referral/invite codes
- [ ] **Mobile PWA features** — Manifest, service worker, push notifications
- [ ] **AI Enclave agents** — Framework exists in `scripts/`, needs UI layer
- [ ] **Notification preferences** — Granular control over which events trigger notifications
