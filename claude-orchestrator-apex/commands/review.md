# /review — Deep Code Review

You are performing a **deep code review** on: $ARGUMENTS

---

## Step 1: Batch Detection

Check if multiple files were passed:
- Single file: proceed directly to Step 2
- Multiple files (e.g., `/review src/components/`): **batch review** all files in a single pass
  - Load project context ONCE
  - Review all files sequentially
  - One combined report at the end
  - This saves 30-66% on context token overhead

---

## Step 2: Load Context (Once Only)

```
Read: CLAUDE.md (conventions + rules + pattern)
Read: docs/TECH_STACK.md (coding standards section)
```

Do NOT re-read if already loaded this session.

---

## Step 3: Read the Code — Deeply

Read every line. Do not skim. For each file, hold in mind:
- What is this code supposed to do?
- What could silently fail?
- What would a security auditor flag?

---

## Step 4: Review Against These Criteria

### 🔴 Blocking — Must Fix Before Merge

**Correctness**
- [ ] Does it correctly implement what was intended?
- [ ] Are all edge cases handled? (null, undefined, empty array, 0, negative, max values)
- [ ] Are errors caught and surfaced — not swallowed silently?
- [ ] Are all async operations awaited?
- [ ] Are race conditions possible (e.g., state updates in loops)?
- [ ] Is state mutated when it shouldn't be?

**Security**
- [ ] Are inputs validated/sanitized before use?
- [ ] Are SQL/NoSQL queries parameterized? (no string interpolation in queries)
- [ ] Are auth/permission checks present on every protected operation?
- [ ] Are secrets hardcoded? (API keys, passwords, tokens)
- [ ] Is user-controlled data used in file paths, `eval()`, or shell commands?
- [ ] Are file uploads validated (type, size, content)?
- [ ] Is CSRF protection present on mutation endpoints?
- [ ] Are rate limits applied on auth/sensitive endpoints?

### 🟡 Warnings — Fix Soon

**Performance**
- [ ] N+1 queries inside loops (fetch inside forEach/map)
- [ ] Large datasets not paginated or streamed
- [ ] Expensive operations not memoized where appropriate
- [ ] React: incorrect deps arrays in useEffect/useMemo/useCallback
- [ ] Missing database indexes on queried columns
- [ ] Unnecessary re-renders (missing React.memo, useMemo)
- [ ] Large bundle imports (import entire library for one function)

**Code Quality**
- [ ] Dead code or commented-out blocks
- [ ] Functions > 40 lines (extract to smaller functions)
- [ ] Variable names that are ambiguous or misleading
- [ ] Complex logic without explaining comments
- [ ] Magic numbers/strings that should be named constants
- [ ] Violations of project conventions from CLAUDE.md
- [ ] TypeScript `any` types that should be narrowed

### 🟢 Notes — Good to Address

- Missing tests for this code path
- Documentation that would help future maintainers
- Minor style inconsistencies
- Opportunities to simplify

---

## Step 5: Output the Review

Format **exactly** like this. No introduction sentence. Start with `## Code Review:`.

```markdown
## Code Review: [filename(s)]
**Reviewed:** [timestamp] | **Verdict:** [APPROVED | APPROVE_WITH_CHANGES | REQUEST_CHANGES]

### Summary
[2 sentences: overall quality assessment + the most important concern]

### 🔴 Blocking Issues
**[Issue Title]** — `filename:line`
> `[quoted problematic code — one line]`
**Problem:** [what is wrong and why it matters]
**Fix:**
\`\`\`typescript
// [exact replacement code]
\`\`\`

### 🟡 Warnings
**[Issue Title]** — `filename:line`
**Problem:** [explanation]
**Suggestion:** [what to do instead]

### 🟢 Notes
- [Small improvement or observation]
- [Missing test case]

### ✅ What's Good
- [Acknowledge good work — this is important for morale and clarity]
- [Another thing done well]

### Verdict
[ ] ✅ APPROVED — merge-ready
[ ] 🟡 APPROVE_WITH_CHANGES — merge after addressing warnings
[ ] 🔴 REQUEST_CHANGES — blocking issues must be resolved first
```

---

## Step 6: Offer to Fix

After the review output, add exactly one line:

```
Fix blocking issues? (yes [issue #] / yes all / no)
```

If yes: fix each issue, show the diff, explain the change. Do not re-review after fixing unless asked.

---

> **Token Target:** This command should use ≤ 900 output tokens per file.
> **Batch Rule:** If reviewing multiple files, load context once and review all. Never load context per file.
