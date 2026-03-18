# /init — Project Initialization

You are initializing the orchestrator for this project.

---

## Step 1: Scan the Project

```bash
python3 .claude/intelligence/detect_stack.py
```

Also check:
```bash
ls docs/ 2>/dev/null || echo "No docs folder"
cat package.json 2>/dev/null | python3 -c "import json,sys; p=json.load(sys.stdin); print(p.get('name','unknown'), '|', p.get('description',''))" 2>/dev/null
ls README.md 2>/dev/null && head -20 README.md || echo "No README"
```

---

## Step 2: Detect Existing Docs

Check for these files:
- `docs/PRD.md` or `PRD.md`
- `docs/DESIGN_DOC.md` or `ARCHITECTURE.md`
- `docs/TECH_STACK.md`
- `TODO.md`
- `CLAUDE.md`
- `README.md`

For each found: read the first 30 lines to understand the project.

---

## Step 3: Generate or Validate CLAUDE.md

**If CLAUDE.md exists:** Read it. Output a validation:
```
✅ CLAUDE.md found
Review:
  - Length: [N] lines (target: < 80)
  - Stack defined: [yes/no]
  - Conventions defined: [yes/no]
  - Example pattern: [yes/no]
  - Recommendation: [update X / looks good]
```

**If CLAUDE.md doesn't exist:** Generate it from what you've learned:
```bash
cat .claude/templates/CLAUDE.md
```
Fill in all placeholders with real values from the project scan. Write to `CLAUDE.md`.

---

## Step 4: Generate Missing Docs

For each missing doc file, offer to generate:
- Missing `TODO.md` → generate from README/PRD tasks
- Missing `docs/PRD.md` → generate template with project info filled in
- Missing `docs/DESIGN_DOC.md` → generate architecture doc from codebase scan

Ask: "Generate missing docs? (yes all / yes [specific] / no)"

---

## Step 5: Output Init Report

```
╔══ ORCHESTRATOR INITIALIZED ══════════════════════════════╗
║ Project:   [name]                                        ║
║ Stack:     [framework + key deps]                        ║
║ Mode:      Claude Code                                   ║
║                                                          ║
║ Files Ready:                                             ║
║   ✅ CLAUDE.md                                           ║
║   ✅ TODO.md                                             ║
║   [✅/⚠️] docs/PRD.md                                   ║
║   [✅/⚠️] docs/DESIGN_DOC.md                            ║
║   [✅/⚠️] docs/TECH_STACK.md                            ║
║                                                          ║
║ Token Intelligence:                                      ║
║   ✅ Cache initialized                                   ║
║   ✅ Context map loaded                                  ║
║   ✅ Output contracts active                             ║
║                                                          ║
║ Design Intelligence:                                     ║
║   ✅ Stack detected: [frameworks]                        ║
║   [✅/⚠️] Design system: [exists/not generated yet]     ║
╚══════════════════════════════════════════════════════════╝

Available commands:
  /plan [task]      — Plan before building
  /design [ui]      — Awwwards-quality UI
  /review [file]    — Deep code review  
  /debug [issue]    — Root cause analysis
  /optimize [target]— Performance fixes
  /test [file]      — Generate tests
  /refactor [file]  — Safe refactoring
  /docs [target]    — Documentation
  /spawn [agent]    — Parallel agents
  /ship             — Pre-flight checklist
```
