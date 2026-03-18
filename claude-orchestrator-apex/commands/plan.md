# /plan — Structured Planning with Token Intelligence

You are entering **Plan Mode** for: $ARGUMENTS

---

## Pre-Flight: Token Intelligence Check

Before planning, run the cache check:
```bash
python3 .claude/intelligence/cache_manager.py check "$ARGUMENTS" plan
```

**If cache hit (score ≥ 0.72):**
- Load the cached plan template
- Adapt it to the specific task details
- Mark the plan as `[ADAPTED FROM CACHE]` at the top
- This costs ~50% fewer tokens

**If no cache hit:** proceed with full planning below.

---

## Step 1: Read Context (Compressed — Load Only What You Need)

Read in this order, stop when you have enough context:
1. `CLAUDE.md` — project overview, stack, conventions (always read)
2. `TODO.md` — what's already planned (always read)
3. `docs/PRD.md` — requirements (read if planning a user-facing feature)
4. `docs/DESIGN_DOC.md` — architecture constraints (read if planning infrastructure/data)

> **Token Rule:** Do NOT re-read docs you've already read this session.

---

## Step 2: Expert Analysis (Extended Thinking Mode)

Before producing the plan, answer these internally:

- **What would a senior engineer flag about this approach?**
- **What are the 3 most likely failure modes?**
- **What existing code gets affected that isn't obvious?**
- **Is there a simpler version that delivers 80% of the value?**
- **What needs to be true for this to work in production?**
- **What's the smallest atomic task I can start with to reduce risk?**

---

## Step 3: Produce the Plan

Output **only** this structure. No preamble. Start immediately with `## Plan:`.

```markdown
## Plan: [Concise Task Name]
> Adapted from cache [task-type] template | Similarity: [score] ← only if cached

### Approach
[1-3 sentences. The strategy, not the details.]

### Steps
1. [ ] [Action] — `path/to/file.ts` — [what changes]
2. [ ] [Action] — `path/to/file.ts` — [what changes]
3. [ ] [Action] — [what changes]
...

### Files Changed
- `src/path/file.ts` — [reason]
- `src/path/other.ts` — [reason]

### Files NOT Touched
- `src/path/unrelated.ts` — [why it seems related but isn't]

### Risks
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| [Risk 1] | HIGH/MED/LOW | [Mitigation] |

### Tests Required
- [ ] [Happy path test]
- [ ] [Error path test]
- [ ] [Edge case test]

### Definition of Done
- [ ] [Acceptance criterion 1]
- [ ] [Acceptance criterion 2]
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Reviewed via /review

### Estimated Effort
[XS < 1h | S = 1-2h | M = 2-4h | L = 4-8h | XL = 8h+]
```

---

## Step 4: Cache This Plan

After outputting the plan, store the template:
```bash
python3 .claude/intelligence/cache_manager.py store plan "$ARGUMENTS" '{"steps_pattern": "[summarized steps]", "task_type": "[type]"}'
```

---

## Step 5: Wait for Approval

**Do NOT start implementing until the user says "go", "approved", "looks good", or "yes".**

If the user requests changes: revise the specific section only, re-output the full plan, wait again.

If the user says "go" → begin with Step 1 of the plan, commit after each step.

---

> **Remember:** A plan that surfaces 3 risks pre-implementation saves hours of rework.
> **Token Target:** This command should use ≤ 600 output tokens.
