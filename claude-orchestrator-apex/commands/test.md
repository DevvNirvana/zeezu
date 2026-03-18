# /test — Intelligent Test Generation

You are generating tests for: $ARGUMENTS

---

## Step 1: Load Context
Read: `CLAUDE.md` (stack, conventions, testing setup)

Detect test framework from `package.json`:
- `vitest` → use Vitest syntax
- `jest` → use Jest syntax
- `@testing-library/react` → use RTL for components
- `playwright` or `cypress` → available for E2E
- `supertest` → available for API routes

---

## Step 2: Analyze the Target

Read the target file(s). For each function/component/route, identify:

**For functions/utilities:**
- All inputs (valid, invalid, edge cases, boundary values)
- All return values (success paths, error paths)
- Side effects (DB calls, API calls, state mutations)

**For React components:**
- All rendered states (loading, empty, error, populated)
- All user interactions (clicks, input, submit, keyboard)
- All prop variations (required, optional, extreme values)
- Accessibility (keyboard nav, screen reader, focus)

**For API routes:**
- All HTTP methods handled
- Auth states (unauthenticated, authorized, unauthorized)
- Valid request shapes
- Invalid request shapes (missing fields, wrong types, SQL injection attempts)
- Expected response codes and shapes

---

## Step 3: Plan the Test Suite

Before writing tests, output a brief test plan:

```
Test plan for: [filename]
- [N] unit tests
- [N] integration tests  
- [N] edge case tests
Coverage target: happy path + all error paths + N edge cases
```

---

## Step 4: Write Complete Tests

Rules:
- Zero TODOs in test file
- Every test has a clear name (describes behavior, not implementation)
- AAA pattern: Arrange, Act, Assert
- Mock external dependencies (DB, API, auth) — never hit real services
- Each test is independent (no shared state between tests)

### Test Name Format
```
describe("ComponentName / functionName", () => {
  describe("happy path", () => {
    it("renders correctly with valid props", ...)
    it("calls handler when button clicked", ...)
  })
  describe("error states", () => {
    it("shows error message when API fails", ...)
    it("disables submit button while loading", ...)
  })
  describe("edge cases", () => {
    it("handles empty string input", ...)
    it("handles null prop gracefully", ...)
  })
})
```

### Component Tests (React Testing Library)
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Always use userEvent over fireEvent for realistic interaction simulation
```

### API Route Tests
```typescript
// Mock the database, never hit real DB in unit tests
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    }
  }
}))
```

### Server Action Tests
```typescript
// Mock next/cache and next/headers
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: vi.fn(() => ({ get: vi.fn() })) }))
```

---

## Step 5: Output the Test File

Deliver a **complete, runnable test file**. No placeholders.

File should be at: `[original-file-path].test.ts` or `[component-name].test.tsx`

```typescript
/**
 * Tests for: [filename]
 * Coverage: [list of what's tested]
 * Framework: [vitest/jest + RTL/supertest]
 */

// [complete test file — no TODOs, no "add more tests here"]
```

---

## Step 6: Coverage Report

After the test file, output:

```
Test coverage analysis:
✅ Happy path: [list covered]
✅ Error paths: [list covered]
✅ Edge cases: [list covered]
⚠️  Not covered: [list what's hard/impossible to test + why]

Run tests: [npm test / vitest run] [filename.test.ts]
```

---

> **Token Target:** ≤ 1000 output tokens.
> **Quality Standard:** Tests should catch real bugs, not just verify the happy path.
> A test suite that only tests when things work is worthless in production.
