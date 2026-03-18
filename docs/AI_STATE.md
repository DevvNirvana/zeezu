# Zeezu — AI State Snapshot

> Current state of the project as of 2026-03-14. Use this as a quick orientation before diving into code.

---

## What exists and works

### Auth & Identity
- Magic Link auth via Supabase
- ZID (20-char unique identifier) auto-generated on signup
- `syncUserSession` keeps `users` table in sync with auth

### Public Profile (`/u/[zid]`)
- Full theme engine applied (CSS vars from ThemeConfig)
- Privacy gates: `show_vibes`, `show_wall`, `wall_friends_only`
- Vibes Rating System (Trust / Cool / Sexy, 1–5 scale)
- Real visitor counter via `increment_visit` RPC (**SQL migration pending user action**)
- ZeeWall (personal wall feed) embedded via `GlobalFeed` with `wallOwnerId` prop
- Social links displayed in About tab
- Avatar from `users.avatar_url` or dicebear fallback

### Profile Settings (`/profile`)
- 5-tab layout: Identity / Appearance / Social Links / Privacy / Account
- AppearanceEditor — theme studio, color pickers, fonts, effects, anthem
- PersonalInfoEditor — 29 fields with visibility toggles
- Social links saved to `users.social_links` JSONB
- Privacy toggles saved to `profile_customization`
- Delete account with cascading deletes

### Social/Feed
- ZeeWall (global feed) + personal wall
- Rich posts: GIFs, polls, embeds (YouTube/Spotify/SoundCloud/Vimeo), mood tags
- Comment threading + upvote/downvote
- Zap reactions (toggle)
- Share sheet
- Real-time notifications (bell + toast): comments, replies, zaps, upvotes
- Friend system: request / accept / decline / remove
- DM / Buzz messaging with BuzzFlash overlays
- Search & discovery page

---

## Pending user action

*(Nothing pending — all migrations applied as of 2026-03-14)*

---

## Next meaningful feature

See `docs/AI_TASKS.md` Future Roadmap. Top candidates:
1. **Zones** — Topic-based communities (major feature)
2. **Notification preferences** — Granular control
3. **Mobile PWA** — Manifest, service worker
