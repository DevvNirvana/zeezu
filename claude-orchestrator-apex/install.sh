#!/usr/bin/env bash
# Quick install — runs the main installer from the scripts/ directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/scripts/install.sh" "$@"
