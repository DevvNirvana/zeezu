#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
#  CLAUDE ORCHESTRATOR APEX — Installer
#  Production-ready AI orchestration for Claude Code
#
#  Usage:
#    bash install.sh              # Auto-detect project
#    bash install.sh --fresh      # Fresh install, overwrite existing
#    bash install.sh --update     # Update existing installation
#    bash install.sh --dry-run    # Preview what would be installed
# ════════════════════════════════════════════════════════════════════

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

VERSION="2.0.0-apex"
PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(pwd)"
CLAUDE_DIR="$PROJECT_DIR/.claude"
MODE="${1:-}"
DRY_RUN=false
[ "$MODE" = "--dry-run" ] && DRY_RUN=true

# ── Banner ────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║                                                              ║${RESET}"
echo -e "${BOLD}${CYAN}║   CLAUDE ORCHESTRATOR APEX  v${VERSION}                 ║${RESET}"
echo -e "${BOLD}${CYAN}║   Production-ready AI orchestration for Claude Code          ║${RESET}"
echo -e "${BOLD}${CYAN}║                                                              ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

$DRY_RUN && echo -e "${YELLOW}  DRY RUN MODE — No files will be written${RESET}\n"

# ── Pre-flight checks ─────────────────────────────────────────────────────────

echo -e "${BOLD}[1/7] Pre-flight checks...${RESET}"
echo ""

HAS_GIT=false; HAS_PYTHON=false; HAS_NODE=false; HAS_CLAUDE_CLI=false
command -v git    >/dev/null 2>&1 && HAS_GIT=true
command -v python3>/dev/null 2>&1 && HAS_PYTHON=true
command -v node   >/dev/null 2>&1 && HAS_NODE=true
command -v claude >/dev/null 2>&1 && HAS_CLAUDE_CLI=true

echo -e "  git:         $(${HAS_GIT}        && echo "${GREEN}✓${RESET}" || echo "${RED}✗ required${RESET}")"
echo -e "  python3:     $(${HAS_PYTHON}     && echo "${GREEN}✓${RESET} (token intelligence enabled)" || echo "${YELLOW}⚠ optional (token intelligence disabled)${RESET}")"
echo -e "  node:        $(${HAS_NODE}       && echo "${GREEN}✓${RESET}" || echo "${DIM}not found (optional)${RESET}")"
echo -e "  claude CLI:  $(${HAS_CLAUDE_CLI} && echo "${GREEN}✓${RESET}" || echo "${DIM}not found (install at claude.ai/code)${RESET}")"
echo ""

if ! ${HAS_GIT}; then
  echo -e "${RED}  ✗ git is required.${RESET}"
  echo -e "    Windows: https://git-scm.com"
  echo -e "    Mac:     brew install git"
  echo -e "    Linux:   sudo apt install git"
  exit 1
fi

# Detect existing installation
EXISTING_INSTALL=false
[ -d "$CLAUDE_DIR/commands" ] && EXISTING_INSTALL=true

if $EXISTING_INSTALL && [ "$MODE" != "--fresh" ] && [ "$MODE" != "--update" ] && ! $DRY_RUN; then
  echo -e "${YELLOW}  Existing installation detected at $CLAUDE_DIR${RESET}"
  echo -e "  Use ${BOLD}--update${RESET} to update, ${BOLD}--fresh${RESET} to overwrite"
  echo ""
fi

# ── Git init ──────────────────────────────────────────────────────────────────

echo -e "${BOLD}[2/7] Git setup...${RESET}"

if ! git -C "$PROJECT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  if ! $DRY_RUN; then
    git -C "$PROJECT_DIR" init -q
    echo -e "  ${GREEN}✓ Git initialized${RESET}"
  else
    echo -e "  ${DIM}[DRY RUN] Would initialize git${RESET}"
  fi
else
  BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null || echo "unknown")
  echo -e "  ${GREEN}✓ Git ready${RESET} (branch: ${BRANCH})"
fi
echo ""

# ── Install core structure ────────────────────────────────────────────────────

echo -e "${BOLD}[3/7] Installing core structure...${RESET}"

install_dir() {
  local src="$1" dst="$2"
  if ! $DRY_RUN; then
    mkdir -p "$dst"
    cp -r "$src/." "$dst/"
  else
    echo -e "  ${DIM}[DRY RUN] Would copy $src → $dst${RESET}"
  fi
}

install_file() {
  local src="$1" dst="$2" desc="$3"
  if ! $DRY_RUN; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo -e "  ${GREEN}✓${RESET} ${desc}"
  else
    echo -e "  ${DIM}[DRY RUN] Would install: ${desc}${RESET}"
  fi
}

# Core directories
if ! $DRY_RUN; then
  mkdir -p "$CLAUDE_DIR"/{commands,intelligence,scripts,config,references,cache/{plans,responses},reviews,worktrees-meta}
fi

# Commands (slash commands)
for cmd_file in "$PKG_DIR"/commands/*.md; do
  fname=$(basename "$cmd_file")
  install_file "$cmd_file" "$CLAUDE_DIR/commands/$fname" "Command: /$( echo "$fname" | sed 's/.md//')"
done

echo ""

# ── Install intelligence layer ────────────────────────────────────────────────

echo -e "${BOLD}[4/7] Installing intelligence layer...${RESET}"

if ${HAS_PYTHON}; then
  for py_file in "$PKG_DIR"/intelligence/*.py; do
    fname=$(basename "$py_file")
    install_file "$py_file" "$CLAUDE_DIR/intelligence/$fname" "Intelligence: $fname"
  done
  
  # Verify scripts work
  if ! $DRY_RUN; then
    python3 "$CLAUDE_DIR/intelligence/cache_manager.py" stats >/dev/null 2>&1 && \
      echo -e "  ${GREEN}✓ Cache manager verified${RESET}" || \
      echo -e "  ${YELLOW}⚠ Cache manager loaded (first-run warning is normal)${RESET}"
  fi
else
  echo -e "  ${YELLOW}⚠ Python3 not found — intelligence scripts skipped${RESET}"
  echo -e "  ${DIM}Install python3 and re-run to enable token intelligence${RESET}"
fi
echo ""

# ── Install config ────────────────────────────────────────────────────────────

echo -e "${BOLD}[5/7] Installing configuration...${RESET}"

for cfg_file in "$PKG_DIR"/config/*.json; do
  fname=$(basename "$cfg_file")
  dst_file="$CLAUDE_DIR/config/$fname"
  
  # Don't overwrite user-customized configs on --update
  if [ "$MODE" = "--update" ] && [ -f "$dst_file" ]; then
    echo -e "  ${DIM}⊘ Config preserved: $fname (use --fresh to reset)${RESET}"
  else
    install_file "$cfg_file" "$dst_file" "Config: $fname"
  fi
done
echo ""

# ── Install references ────────────────────────────────────────────────────────

echo -e "${BOLD}[6/7] Installing reference docs...${RESET}"

for ref_file in "$PKG_DIR"/references/*.md; do
  fname=$(basename "$ref_file")
  install_file "$ref_file" "$CLAUDE_DIR/references/$fname" "Reference: $fname"
done
echo ""

# ── Set up project files ──────────────────────────────────────────────────────

echo -e "${BOLD}[7/7] Setting up project files...${RESET}"

# CLAUDE.md
if [ ! -f "$PROJECT_DIR/CLAUDE.md" ]; then
  if ! $DRY_RUN; then
    cp "$PKG_DIR/templates/CLAUDE.md" "$PROJECT_DIR/CLAUDE.md"
    echo -e "  ${GREEN}✓ CLAUDE.md created${RESET} ${YELLOW}(fill in your project details)${RESET}"
  else
    echo -e "  ${DIM}[DRY RUN] Would create CLAUDE.md${RESET}"
  fi
else
  echo -e "  ${DIM}⊘ CLAUDE.md already exists — preserved${RESET}"
fi

# TODO.md
if [ ! -f "$PROJECT_DIR/TODO.md" ]; then
  if ! $DRY_RUN; then
    cp "$PKG_DIR/templates/TODO.md" "$PROJECT_DIR/TODO.md"
    echo -e "  ${GREEN}✓ TODO.md created${RESET}"
  fi
else
  echo -e "  ${DIM}⊘ TODO.md already exists — preserved${RESET}"
fi

# docs/ templates
if [ ! -d "$PROJECT_DIR/docs" ]; then
  if ! $DRY_RUN; then
    mkdir -p "$PROJECT_DIR/docs"
    [ -d "$PKG_DIR/templates/docs" ] && cp "$PKG_DIR/templates/docs/"* "$PROJECT_DIR/docs/" 2>/dev/null || true
    echo -e "  ${GREEN}✓ docs/ created with templates${RESET}"
  fi
else
  echo -e "  ${DIM}⊘ docs/ already exists — preserved${RESET}"
fi

# .gitignore additions
if [ -f "$PROJECT_DIR/.gitignore" ]; then
  if ! grep -q "\.claude/cache" "$PROJECT_DIR/.gitignore" 2>/dev/null; then
    if ! $DRY_RUN; then
      echo "" >> "$PROJECT_DIR/.gitignore"
      echo "# Claude Orchestrator" >> "$PROJECT_DIR/.gitignore"
      echo ".claude/cache/" >> "$PROJECT_DIR/.gitignore"
      echo ".claude/reviews/" >> "$PROJECT_DIR/.gitignore"
      echo "design-system/" >> "$PROJECT_DIR/.gitignore"
      echo -e "  ${GREEN}✓ .gitignore updated${RESET}"
    fi
  else
    echo -e "  ${DIM}⊘ .gitignore already configured${RESET}"
  fi
else
  if ! $DRY_RUN; then
    cat > "$PROJECT_DIR/.gitignore" << 'GITIGNORE'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
.next/
dist/
build/
out/

# Environment
.env
.env.local
.env.*.local

# Claude Orchestrator
.claude/cache/
.claude/reviews/
design-system/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/settings.json
.idea/
*.swp
GITIGNORE
    echo -e "  ${GREEN}✓ .gitignore created${RESET}"
  fi
fi

echo ""

# ── Final summary ─────────────────────────────────────────────────────────────

if ! $DRY_RUN; then
  echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${GREEN}║                                                              ║${RESET}"
  echo -e "${BOLD}${GREEN}║   ✅  CLAUDE ORCHESTRATOR APEX INSTALLED                     ║${RESET}"
  echo -e "${BOLD}${GREEN}║                                                              ║${RESET}"
  echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════╝${RESET}"
else
  echo -e "${BOLD}${YELLOW}╔══════════════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${YELLOW}║   DRY RUN COMPLETE — No files written                        ║${RESET}"
  echo -e "${BOLD}${YELLOW}╚══════════════════════════════════════════════════════════════╝${RESET}"
fi

echo ""
echo -e "${BOLD}Quick Start:${RESET}"
echo -e "  1. Fill in ${BOLD}CLAUDE.md${RESET} with your project details"
echo -e "  2. Open ${BOLD}claude${RESET} in your project directory"
echo -e "  3. Type ${BOLD}/init${RESET} to initialize the orchestrator"
echo ""
echo -e "${BOLD}Commands available:${RESET}"
echo -e "  ${CYAN}/init${RESET}          — Initialize and scan your project"
echo -e "  ${CYAN}/plan [task]${RESET}   — Plan before building (uses cache)"
echo -e "  ${CYAN}/design [ui]${RESET}   — Awwwards-quality UI generation"
echo -e "  ${CYAN}/review [file]${RESET} — Deep code review with 40+ checks"
echo -e "  ${CYAN}/debug [issue]${RESET} — Root cause analysis"
echo -e "  ${CYAN}/optimize${RESET}      — Performance profiling + fixes"
echo -e "  ${CYAN}/test [file]${RESET}   — Complete test generation"
echo -e "  ${CYAN}/refactor [file]${RESET}— Safe refactoring with impact analysis"
echo -e "  ${CYAN}/docs [target]${RESET} — Documentation generation"
echo -e "  ${CYAN}/spawn [agent]${RESET} — Parallel agent with isolated worktree"
echo -e "  ${CYAN}/ship${RESET}          — 40-point pre-flight checklist"
echo ""
echo -e "${BOLD}Token Intelligence:${RESET}"
if ${HAS_PYTHON}; then
  echo -e "  ${GREEN}✓ Enabled${RESET} — Plan cache + response cache active"
  echo -e "  View savings: ${BOLD}python3 .claude/intelligence/token_tracker.py report${RESET}"
  echo -e "  Cache stats:  ${BOLD}python3 .claude/intelligence/cache_manager.py stats${RESET}"
else
  echo -e "  ${YELLOW}⚠ Disabled${RESET} — Install python3 to enable"
fi
echo ""
echo -e "${DIM}Installed to: $CLAUDE_DIR${RESET}"
echo -e "${DIM}Version: $VERSION${RESET}"
echo ""
