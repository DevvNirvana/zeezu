# Zeezu — AI Context Document

> Compressed project knowledge for AI-assisted development.
> Last updated: 2026-03-12

---

## Overview

**Zeezu** is "The Internet After Dark" — a dark neon social network built as a Y2K/MySpace spiritual successor.
- Framework: **Next.js 15 App Router**, React 19, TypeScript 5
- Styling: **Tailwind CSS v4**, Framer Motion, Three.js (for 3D ProfileCard)
- Backend: **Supabase** (PostgreSQL, auth, storage, realtime subscriptions)
- AI: Groq, Cohere, Mistral, OpenRouter (keys in `.env.local`)

---

## Brand Identity

- Tagline: **"The Internet After Dark"**
- Colors: `#0B0B12` (void black), `#8A2EFF` (electric violet), `#00F7FF` (cyan), `#FF007A` (acid magenta), `#B4FF00` (lime)
- Aesthetic: Dark neon, Y2K revival, glassmorphism, CRT scanlines, holographic effects
- Tone: Raw, expressive, underground — not curated influencer culture

---

## Pages (app/ routes)

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Magic Link login |
| `/dashboard` | `app/dashboard/page.tsx` | Main feed + Core 8 management |
| `/zeewall` | `app/zeewall/page.tsx` | Global public wall/feed |
| `/profile` | `app/profile/page.tsx` | User profile/settings (tabbed) |
| `/u/[zid]` | `app/u/[zid]/page.tsx` | Public user profile view |
| `/messages` | `app/messages/page.tsx` | DMs + Buzz messaging |
| `/friends` | `app/friends/page.tsx` | Friend management |
| `/search` | `app/search/page.tsx` | Search & discovery |

---

## Key Components

| Component | Purpose |
|---|---|
| `GlobalFeed.tsx` | Main feed: posts, comments, GIFs, polls, embeds, votes, mood tags |
| `ProfileCard.tsx` | 3D interactive card (Three.js tilt), hex info items, vibes scores |
| `ThemeEngine.tsx` | Injects CSS custom properties from ThemeConfig |
| `AppearanceEditor.tsx` | Theme gallery, color pickers, font pickers, effects — 600+ lines |
| `PersonalInfoEditor.tsx` | 29-field personal info editor with visibility toggles |
| `NavBar.tsx` | Main navigation bar |
| `NotificationBell.tsx` | Realtime notification bell |
| `ToastProvider.tsx` | Global toast notifications |
| `THEMES.ts` | 12+ Y2K theme presets + font catalog |

---

## Database Tables

| Table | Key Columns |
|---|---|
| `users` | id, zid (20-char unique), display_name, mdx_profile, status_message, avatar_url, theme_track_url, social_links (JSONB), personal_info (JSONB), influence_score |
| `profile_customization` | user_id, theme_id, primary_color, secondary_color, background_url, font settings, effects, show_vibes, show_wall, wall_friends_only, show_online |
| `zeewall` | id, owner_id, author_id, content, zaps, created_at |
| `zaps` | user_id, post_id |
| `comments` | id, post_id, author_id, content, parent_id (threading) |
| `comment_votes` | user_id, comment_id, vote (+1/-1) |
| `notifications` | user_id, type, from_user_id, post_id, read |
| `core_eight` | user_id, friend_id, position (1-8) |
| `friends` | user_id, friend_id, status, created_at |
| `messages` | sender_id, recipient_id, content, is_buzz, read |
| `vibes` | user_id, trustworthy_score, cool_score, sexy_score |
| `agent_state` | agent_id, user_id, state JSONB (AI agent framework) |

---

## ThemeConfig Shape

```typescript
interface ThemeConfig {
  theme_id: string;
  primary_color: string;       // hex
  secondary_color: string;     // hex
  text_color: string;          // hex
  surface_border: string;      // hex
  background_url: string | null;
  background_tiling: boolean;
  background_opacity: number;  // 0-100
  display_font: string;
  body_font: string;
  mono_font: string;
  font_size_scale: number;     // 85-120
  text_effect: string;         // none|gradient|shiny|glitch
  name_effect: string;
  button_style: string;        // solid-glow|glass-pill|chrome-bevel|...
  card_style: string;          // neon|chrome|glass|holographic|bubble|minimal
  background_effect: string;   // grid|dots|scanlines|noise|none
  card_holographic: string;    // none|rainbow-shift|aurora|shimmer|prism
  glass_blur: number;
  surface_opacity: number;
  glow_intensity: number;
  shadow_intensity: number;
  border_radius: number;
}
```

---

## Key Patterns

### Auth
- Magic Link auth via Supabase (`supabase.auth.signInWithOtp`)
- `syncUserSession()` in `lib/supabase/queries.ts` creates user profile on first login

### Data fetching
- All DB calls via `supabase` client in `lib/supabase/client.ts`
- Query helpers in `lib/supabase/queries.ts`
- Client components use `useEffect` + Supabase directly (no API routes)

### Theme system
- `ThemeEngine` component injects CSS vars from `ThemeConfig`
- All colors reference `var(--primary)`, `var(--secondary)`, etc.
- Tailwind classes `text-electric`, `text-cyan`, `text-lime` map to Zeezu colors

### ZID
- 20-character unique user identifier, uppercase alphanumeric
- Generated once on first login via `generateZid()` in `lib/utils/generateZid.ts`
- Used for public profile URLs (`/u/ZID123`)

### Privacy
- `profile_customization` table stores: `show_vibes`, `show_wall`, `wall_friends_only`, `show_online`
- Toggled in profile settings Privacy tab
- Must be respected in `app/u/[zid]/page.tsx`

### Social Links
- Stored as `social_links JSONB` on `users` table
- Keys: `website`, `twitter`, `instagram`, `github`, `discord`, `custom`
- Edited in profile settings Social tab
- Must be displayed on `app/u/[zid]/page.tsx`
