#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  UI Design Intelligence — One-Command Installer v2.0               ║
# ║  Installs into Claude Code's .claude/skills/ directory              ║
# ╚══════════════════════════════════════════════════════════════════════╝
# Usage: bash install.sh
#        bash install.sh --global        ← installs to ~/
#        bash install.sh --project /path ← specific project
#        bash install.sh --update        ← updates existing

set -e
SKILL_NAME="ui-design-intelligence"
SKILL_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   UI Design Intelligence v2.0 — Installer           ║${NC}"
echo -e "${CYAN}║   Awwwards-quality design for Claude Code           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

TARGET=""; UPDATE=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --global) TARGET="$HOME"; shift ;;
    --project) TARGET="$2"; shift 2 ;;
    --update) UPDATE=true; shift ;;
    *) shift ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  if [[ -f "package.json" ]] || [[ -f "pubspec.yaml" ]]; then
    TARGET="$(pwd)"
  else
    TARGET="$HOME"
  fi
fi

DEST="$TARGET/.claude/skills/$SKILL_NAME"

if [[ "$UPDATE" == "true" ]] && [[ -d "$DEST" ]]; then
  echo -e "${YELLOW}Updating existing install…${NC}"
  rm -rf "$DEST"
fi

echo -e "${BOLD}Installing to:${NC} $DEST"
mkdir -p "$DEST/scripts" "$DEST/references"
cp -r "$SKILL_REPO_DIR/scripts/"* "$DEST/scripts/"
cp -r "$SKILL_REPO_DIR/references/"* "$DEST/references/"
cp "$SKILL_REPO_DIR/SKILL.md" "$DEST/SKILL.md"
chmod +x "$DEST/scripts/"*.py 2>/dev/null || true

python3 --version &>/dev/null && echo -e "${GREEN}✓ Python 3:${NC} OK" || echo -e "${YELLOW}⚠ Install Python 3.8+${NC}"
python3 -c "import sys; sys.path.insert(0,'$DEST/scripts'); import core" 2>/dev/null && \
  echo -e "${GREEN}✓ Core engine:${NC} OK" || echo -e "${YELLOW}⚠ Core engine check failed — verify Python path${NC}"

echo ""
echo -e "${GREEN}${BOLD}✅ Install complete!${NC}"
echo ""
echo -e "${BOLD}Quick start in Claude Code:${NC} /design dark SaaS landing page"
echo -e "${BOLD}CLI:${NC}"
echo -e "  python3 $DEST/scripts/detect_stack.py"
echo -e "  python3 $DEST/scripts/design_system.py --product 'app' --style 'dark' --persist"
echo -e "  python3 $DEST/scripts/framework_lint.py --stack-check"
echo ""
