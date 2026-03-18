#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
#  Merge Agent Back to Main
#  Usage: bash .claude/scripts/merge-agents.sh [agent-name]
# ════════════════════════════════════════════════════════════════════

set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

AGENT_NAME="${1:-}"
if [ -z "$AGENT_NAME" ]; then
  echo -e "${RED}Usage: $0 <agent-name>${RESET}"
  exit 1
fi

PROJECT_DIR="$(pwd)"
BRANCH="agent/$AGENT_NAME"
WORKTREE_DIR="$PROJECT_DIR/worktrees/agent-$AGENT_NAME"
MAIN_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")

echo ""
echo -e "${BOLD}${CYAN}━━━ Merging Agent: $AGENT_NAME ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# 1. Commit any remaining changes in worktree
if [ -d "$WORKTREE_DIR" ]; then
  cd "$WORKTREE_DIR"
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git add -A
    git commit -m "feat($AGENT_NAME): final commit before merge" --quiet
    echo -e "${GREEN}✓ Final commit in worktree${RESET}"
  fi
  cd "$PROJECT_DIR"
fi

# 2. Get the commits
COMMIT_COUNT=$(git -C "$PROJECT_DIR" log --oneline "main..${BRANCH}" 2>/dev/null | wc -l | tr -d ' ')
echo -e "${CYAN}  $COMMIT_COUNT commits to merge from $BRANCH${RESET}"

if [ "$COMMIT_COUNT" = "0" ]; then
  echo -e "${YELLOW}⚠ No commits to merge — agent branch is up to date with main${RESET}"
  exit 0
fi

# 3. Switch to main and merge
git -C "$PROJECT_DIR" checkout "$MAIN_BRANCH" --quiet 2>/dev/null || git -C "$PROJECT_DIR" checkout main --quiet

# 4. Merge (no fast-forward to preserve agent history)
if git -C "$PROJECT_DIR" merge "$BRANCH" --no-ff -m "merge: integrate agent/$AGENT_NAME work" --quiet; then
  echo -e "${GREEN}✓ Merged $BRANCH → $MAIN_BRANCH${RESET}"
else
  echo -e "${RED}✗ Merge conflict detected${RESET}"
  echo -e "${YELLOW}  Resolve conflicts, then: git merge --continue${RESET}"
  exit 1
fi

# 5. Remove worktree
if [ -d "$WORKTREE_DIR" ]; then
  git -C "$PROJECT_DIR" worktree remove "$WORKTREE_DIR" --force 2>/dev/null || rm -rf "$WORKTREE_DIR"
  echo -e "${GREEN}✓ Worktree removed${RESET}"
fi

# 6. Delete agent branch
git -C "$PROJECT_DIR" branch -d "$BRANCH" 2>/dev/null && \
  echo -e "${GREEN}✓ Branch $BRANCH deleted${RESET}" || \
  echo -e "${DIM}⊘ Branch not deleted (already removed)${RESET}"

# 7. Update worktree metadata
CLAUDE_DIR="$PROJECT_DIR/.claude"
if [ -f "$CLAUDE_DIR/worktrees-meta/$AGENT_NAME.json" ]; then
  python3 -c "
import json, sys
f = '$CLAUDE_DIR/worktrees-meta/$AGENT_NAME.json'
d = json.load(open(f))
d['status'] = 'merged'
d['merged_at'] = '$(date +"%Y-%m-%dT%H:%M:%S")'
json.dump(d, open(f,'w'), indent=2)
" 2>/dev/null || true
fi

echo ""
echo -e "${BOLD}${GREEN}━━━ Merge Complete ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${DIM}Run /ship to check if the merged code is production-ready${RESET}"
echo ""
