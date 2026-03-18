# /ship — Pre-Flight Deployment Checklist

You are running **pre-flight checks** before deployment. $ARGUMENTS

Run every check. Report honestly. This is the final gate before production.

---

## Load Context
Read: `CLAUDE.md`, `docs/PRD.md` (acceptance criteria section), `TODO.md`

---

## The 40-Point Pre-Flight Checklist

### 🔴 CRITICAL — Deployment Blockers

**Security**
- [ ] No hardcoded secrets, API keys, or credentials in source code
- [ ] `.env` files are in `.gitignore`, only `.env.example` is committed
- [ ] Authentication is required on all protected routes/endpoints
- [ ] Input validation present on all user-facing forms and API endpoints
- [ ] SQL/NoSQL injection protections in place (parameterized queries)
- [ ] CORS configured correctly (not `*` in production)
- [ ] Rate limiting on auth endpoints (login, register, password reset)

**Correctness**
- [ ] All items in `TODO.md` marked [P0] are complete `[x]`
- [ ] All acceptance criteria in `docs/PRD.md` are met
- [ ] No items marked `[!]` (blocked) in TODO.md without resolution
- [ ] TypeScript compiles without errors (`npm run build` passes)
- [ ] All tests pass (`npm test`)
- [ ] No `console.log`, `console.error` left for debugging
- [ ] No commented-out code blocks that shouldn't ship

**Data Integrity**
- [ ] Database migrations are backwards-compatible
- [ ] No destructive migrations without a rollback plan
- [ ] Seed data / fixtures don't run in production

### 🟡 IMPORTANT — Fix Within 24 Hours of Deploy

**Performance**
- [ ] Lighthouse score ≥ 80 on Performance (run or estimate)
- [ ] Images optimized (WebP, correct sizing, lazy loading)
- [ ] No N+1 database queries in critical paths
- [ ] Bundle size within reasonable range (check `npm run build` output)
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

**UX/Accessibility**
- [ ] All interactive elements keyboard-navigable (Tab order makes sense)
- [ ] Color contrast ratio ≥ 4.5:1 for normal text, 3:1 for large text
- [ ] Form fields have proper labels (not just placeholder text)
- [ ] Error states are visible and descriptive
- [ ] Loading states are implemented for async operations
- [ ] Empty states are implemented (no blank white screens)
- [ ] 404 and 500 error pages exist

**Code Quality**
- [ ] No `any` TypeScript types in public-facing code
- [ ] All async functions have error handling
- [ ] No infinite loops or unhandled promise rejections possible
- [ ] Environment variables validated at startup (fail fast)

### 🟢 RECOMMENDED — Track as Tech Debt

**Documentation**
- [ ] README.md is accurate and up to date
- [ ] API endpoints are documented
- [ ] Environment variables documented in `.env.example` with descriptions

**Monitoring**
- [ ] Error tracking configured (Sentry, Axiom, etc.)
- [ ] Logging in place for critical operations
- [ ] Health check endpoint exists (`/api/health`)
- [ ] Uptime monitoring configured

**CI/CD**
- [ ] Deploy pipeline runs tests before deploying
- [ ] Rollback procedure documented and tested
- [ ] Feature flags for risky changes (if applicable)

---

## Check: Run Build

```bash
# Attempt a production build
npm run build
```

Report the output — any errors are 🔴 blockers.

---

## Check: Scan for Leaked Secrets

```bash
# Quick scan for common patterns
grep -rn "sk-\|AKIA\|ghp_\|xox[baprs]-\|-----BEGIN\|password\s*=\s*['\"]" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.env" \
  --exclude-dir=node_modules --exclude-dir=.git \
  . 2>/dev/null | grep -v ".env.example" | grep -v "// example" | head -20
```

---

## Check: TODO.md P0 Completion

```bash
# Count incomplete P0 tasks
grep -c "\[ \].*\[P0\]" TODO.md 2>/dev/null || echo "0"
```

Any incomplete P0 tasks = 🔴 HOLD.

---

## Output the Report

Format **exactly** like this:

```markdown
## 🚀 Pre-Flight Report — [Project Name]
**Date:** [timestamp] | **Branch:** [git branch]

### 🔴 Blocking Issues (HOLD)
- [issue] — [file or location] — [what needs to happen]

### 🟡 Important (Fix Soon)
- [issue] — [brief note]

### ✅ Passed Checks ([N]/40)
- Security: [N]/7 ✓
- Correctness: [N]/7 ✓
- Performance: [N]/5 ✓
- UX/A11y: [N]/7 ✓
- Code Quality: [N]/4 ✓
- Documentation: [N]/3 ✓
- Monitoring: [N]/4 ✓
- CI/CD: [N]/3 ✓

---
VERDICT: [SHIP ✅ | HOLD 🟡 | HOLD_CRITICAL 🔴]
```

**HOLD_CRITICAL** = any 🔴 blocking issues found
**HOLD** = no blockers but significant 🟡 warnings
**SHIP** = all blockers clear, warnings acceptable

---

> After SHIP verdict: remind user to monitor error tracking for the first 30 minutes post-deploy.
