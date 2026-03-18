# /spawn — Spawn a Parallel Agent

You are spawning a **focused parallel agent** for: $ARGUMENTS

---

## Step 1: Parse the Spawn Request

Extract from `$ARGUMENTS`:
- **Agent name:** (e.g., "frontend", "api", "auth", "db")
- **Task:** (what this agent builds)
- **Domain:** (which files/folders it owns)

Format: `/spawn [agent-name] [task description]`
Example: `/spawn frontend build the job results page with filters`

---

## Step 2: Read TODO.md

Find tasks that match this agent's domain. Identify:
- Which TASK-IDs this agent should pick up
- What's already in progress (don't assign duplicates)
- Dependencies this agent must wait for

---

## Step 3: Create the Git Worktree

```bash
bash .claude/scripts/create-worktrees.sh [agent-name]
```

This creates:
- `worktrees/agent-[name]/` — isolated working directory
- `agent/[name]` branch — isolated from main
- `worktrees/agent-[name]/AGENT_BRIEF.md` — the agent's instructions

---

## Step 4: Generate the Agent Brief

Create `worktrees/agent-[name]/AGENT_BRIEF.md` with this exact content:

```markdown
# Agent Brief: [Agent Name]
**Role:** [specific role, e.g., "Frontend Developer"]
**Branch:** agent/[name]
**Created:** [timestamp]

## Your Mission
[1-2 sentences: exactly what you build]

## Your Domain (files you OWN — you can create/edit freely)
- `src/app/[your-routes]/`
- `src/components/[your-components]/`
- [other owned paths]

## Read Access (read but don't modify)
- `src/types/` — TypeScript types
- `src/lib/` — shared utilities
- `docs/DESIGN_DOC.md` — architecture
- `docs/TECH_STACK.md` — standards

## NEVER TOUCH
- `src/server/` — backend (different agent)
- `migrations/` — database (different agent)
- `CLAUDE.md` — orchestrator config
- `.env*` — environment files

## Your Tasks (from TODO.md)
- [ ] TASK-[ID]: [description] — [priority]
- [ ] TASK-[ID]: [description] — [priority]

## How to Work
1. Read `CLAUDE.md` and `docs/DESIGN_DOC.md` first
2. Start with the highest priority task
3. Commit after each completed task: `git commit -m "feat(scope): description"`
4. Update TODO.md: mark `[>]` when starting, `[x]` when done, `[!]` if blocked
5. Run `npm run lint && npm run build` before final commit
6. When done: message the orchestrator with your completion summary

## Code Standards
[Copy relevant section from CLAUDE.md conventions]

## Stack
[Copy stack section from CLAUDE.md]

## API Contracts (endpoints this agent calls)
[List the API routes this agent will consume — from DESIGN_DOC.md]
```

---

## Step 5: Output the Spawn Summary

```
╔══ AGENT SPAWNED ═════════════════════════════════════════╗
║ Agent:    [name]                                          ║
║ Branch:   agent/[name]                                   ║
║ Worktree: worktrees/agent-[name]/                        ║
║ Tasks:    TASK-[X], TASK-[Y]                             ║
║ Owns:     [file paths]                                   ║
╚══════════════════════════════════════════════════════════╝

Start agent:
  cd worktrees/agent-[name]
  claude  ← opens Claude Code in the isolated worktree
```

---

## Multi-Agent Coordination

When spawning multiple agents, assign non-overlapping domains:

| Agent | Owns | Never Touches |
|-------|------|---------------|
| frontend | `src/app/`, `src/components/` | `src/server/`, `migrations/` |
| api | `src/server/`, `src/app/api/` | `src/components/`, `migrations/` |
| db | `migrations/`, `prisma/`, `src/lib/db.ts` | `src/app/`, `src/components/` |
| auth | `src/app/(auth)/`, `src/lib/auth.ts` | `migrations/`, `src/components/` |
| infra | `Dockerfile`, CI/CD, `scripts/` | `src/`, `migrations/` |

**Golden Rule:** If two agents could write to the same file, re-partition the domains.

---

## Merge When Done

```bash
bash .claude/scripts/merge-agents.sh [agent-name]
```

Runs: fetch, rebase on main, conflict check, merge, push.

---

> **Token Target:** ≤ 350 output tokens. Agent brief is the deliverable, not explanation.
