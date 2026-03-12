# Zeezu — AI Development Rules

> Coding conventions, architecture constraints, and patterns to follow.
> Last updated: 2026-03-12

---

## Architecture Constraints

1. **No API routes** — All data fetching happens directly in client components via the Supabase client. Do not create `app/api/` routes unless absolutely necessary.
2. **Client components only for pages** — All pages use `"use client"` since they require auth state and real-time subscriptions.
3. **No ORM** — Use the Supabase JS client directly. Do not introduce Prisma or Drizzle.
4. **No state management library** — Use React `useState`/`useEffect`/`useMemo`. Do not add Redux, Zustand, or Jotai.
5. **Single queries file** — Non-trivial reusable DB queries go in `lib/supabase/queries.ts`. Simple one-off queries can be inline.

---

## Styling Rules

1. **Tailwind v4** — Use Tailwind utility classes. Do not write CSS modules or styled-components.
2. **Custom CSS via injection** — For keyframe animations or complex pseudo-selectors, inject a `<style>` tag with a unique ID at module scope (pattern used throughout the codebase).
3. **Neon color tokens**: Use these Tailwind classes for Zeezu brand colors:
   - `text-electric` / `border-electric` → `#8A2EFF`
   - `text-cyan` → `#00F7FF`
   - `text-lime` → `#B4FF00`
   - `text-magenta` → `#FF007A`
4. **Dark backgrounds** — Base background is `bg-[#0B0B12]`. Cards/surfaces use `bg-black/40` or `bg-black/30`.
5. **Theme-aware colors** — For components that adapt to user themes, use `custom.primary_color` and `custom.secondary_color` inline styles, not hardcoded values.
6. **No `!important`** — Avoid unless overriding third-party styles.

---

## Component Patterns

1. **Sub-components at bottom** — Define helper components (like `SectionHeader`, `FieldLabel`, `Toggle`) at the bottom of the file after the main export.
2. **Inline sub-components are fine for small UI** — `const Toggle = (...) => (...)` inside the component function is acceptable for simple cases.
3. **SpotlightCard for content sections** — Wrap major sections in `<SpotlightCard>` with `spotlightColor={custom.primary_color + "20"}`.
4. **AnimatedContent for tab transitions** — Use `<AnimatedContent key={activeTab} animationKey={activeTab} direction="up" duration={300}>` for tab switching animations.
5. **ClickSpark for interactive buttons** — Wrap primary action buttons in `<ClickSpark>`.

---

## Database Patterns

1. **Graceful degradation** — Always handle missing columns gracefully. Use `console.warn` (not `console.error`) for non-critical save failures. The DB schema may lag behind the frontend.
2. **Upsert for customization** — Use `.upsert({ user_id: ..., ...data }, { onConflict: "user_id" })` for `profile_customization`.
3. **Parallel queries** — Use `Promise.all([...])` for independent queries on page load.
4. **JSONB fields** — `social_links` and `personal_info` on `users` are JSONB. Always spread/merge carefully.

---

## Naming Conventions

| Thing | Convention |
|---|---|
| Pages | `page.tsx` in route folder, `export default function PageName()` |
| Components | PascalCase filename + export |
| DB query helpers | camelCase in `queries.ts` |
| State variables | camelCase, descriptive |
| CSS animation IDs | kebab-case, unique per component (`profile-settings-v2`) |
| Supabase tables | snake_case (matches DB) |
| ThemeConfig keys | snake_case (matches DB columns) |

---

## Feature Naming (Brand)

Always use these exact Zeezu feature names (not generic alternatives):

| Feature | Zeezu Name |
|---|---|
| Reactions/likes | Zaps |
| Direct messages | Buzz / Buzzes |
| Friend top 8 | Core 8 |
| Public feed | ZeeWall |
| User identifier | ZID |
| Profile song | Theme Track |
| Topic communities | Zones (not yet built) |
| Trust/cool/sexy scores | Vibes |
| User influence level | Influence Tier |

---

## TypeScript Rules

1. **Strict mode** — Project uses strict TypeScript. Avoid `any` unless absolutely necessary (use `as any` with a comment if forced).
2. **Explicit types on state** — Always type `useState<Type>()` for non-trivial state.
3. **No implicit any** — If a type is unknown, use `unknown` and narrow it.
4. **Skip tsc for scripts** — Scripts in `scripts/` are excluded from `tsconfig.json` build.

---

## What NOT to Do

- Do not add `console.log` left in production code
- Do not add loading spinners inside components that are already inside a loading state
- Do not create new component files for one-time UI — inline it
- Do not add unnecessary `useCallback`/`useMemo` — only when there's a real perf reason
- Do not create helper files for one-off utilities
- Do not use emojis in code comments (only in user-facing copy where appropriate)
