# CLAUDE.md
<!-- ETH Zurich: Lean context outperforms bloated in 5/8 settings. Keep under 80 lines. -->

## Project
[1-2 sentences: what it does, who uses it]

## Commands
```bash
npm run dev       # dev server
npm run build     # production build
npm test          # tests
npm run lint      # lint + type check
```

## Stack
- Frontend: [Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui]
- Backend:  [Express / tRPC / Hono]
- DB:       [Postgres via Prisma]
- Auth:     [Clerk / NextAuth / Supabase]
- Deploy:   [Vercel / Railway / Fly.io]

## Architecture
```
src/
├── app/           # Pages (App Router)
├── components/    # Shared UI components
├── lib/           # Utilities, helpers, constants
├── types/         # TypeScript type definitions
└── server/        # Server actions, API routes
```

## Critical Conventions
- Server Components by default — `use client` only for interactivity/browser APIs
- All DB queries through `lib/db.ts` — never Prisma directly in components
- Errors must be user-readable strings — never surface raw Error objects to UI
- Types in `src/types/` — never inline complex types in components

## Hard Rules
- Never use `any` — use `unknown` and narrow it
- Never commit `.env` — use `.env.example` with placeholder values
- Never push to `main` directly — feature/agent branches only
- Never hardcode secrets, API keys, or credentials

## Good Pattern
```typescript
// Server Action pattern (preferred over API routes for mutations)
"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createItem(data: CreateItemInput) {
  try {
    const item = await db.item.create({ data });
    revalidatePath("/items");
    return { success: true, item };
  } catch (err) {
    console.error("[createItem]", err);
    return { success: false, error: "Failed to create item. Please try again." };
  }
}
```

## Docs
- PRD: `docs/PRD.md`
- Architecture: `docs/DESIGN_DOC.md`
- Stack: `docs/TECH_STACK.md`
- Tasks: `TODO.md`
