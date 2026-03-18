#!/usr/bin/env python3
"""
Token Tracker — Tracks token usage across sessions and reports savings.
Runs as a session companion to show real-time cost intelligence.

Usage:
  python3 .claude/intelligence/token_tracker.py log <command> <input_tokens> <output_tokens>
  python3 .claude/intelligence/token_tracker.py report
  python3 .claude/intelligence/token_tracker.py report --today
  python3 .claude/intelligence/token_tracker.py reset
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from collections import defaultdict

ROOT      = Path.cwd()
LOG_FILE  = ROOT / ".claude" / "cache" / "token_log.json"
STATS_FILE = ROOT / ".claude" / "cache" / "token_stats.json"

CYAN   = "\033[0;36m"
GREEN  = "\033[0;32m"
YELLOW = "\033[1;33m"
RED    = "\033[0;31m"
DIM    = "\033[2m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# Pricing per 1K tokens (as of 2025, blended estimates)
PRICING = {
    "claude-opus":    {"input": 0.015,  "output": 0.075},
    "claude-sonnet":  {"input": 0.003,  "output": 0.015},
    "claude-haiku":   {"input": 0.00025,"output": 0.00125},
    "gemini-pro":     {"input": 0.00125,"output": 0.005},
    "gemini-flash":   {"input": 0.000075,"output": 0.0003},
    "default":        {"input": 0.003,  "output": 0.015},
}

# Baseline: what a naive (no optimization) session uses
BASELINE_TOKENS = {
    "plan":     {"input": 2800, "output": 1200},
    "review":   {"input": 3200, "output": 1400},
    "design":   {"input": 3500, "output": 2200},
    "ship":     {"input": 4000, "output": 1800},
    "spawn":    {"input": 2200, "output": 600},
    "debug":    {"input": 2400, "output": 1000},
    "optimize": {"input": 2600, "output": 1200},
    "test":     {"input": 2800, "output": 1800},
    "docs":     {"input": 2000, "output": 1000},
    "refactor": {"input": 3200, "output": 2000},
    "default":  {"input": 2500, "output": 1200},
}

def ensure_files():
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not LOG_FILE.exists():
        LOG_FILE.write_text(json.dumps([], indent=2))
    if not STATS_FILE.exists():
        STATS_FILE.write_text(json.dumps({
            "total_sessions": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_cost_usd": 0.0,
            "baseline_cost_usd": 0.0,
            "commands": {}
        }, indent=2))

def load_log() -> list:
    ensure_files()
    try:
        return json.loads(LOG_FILE.read_text())
    except Exception:
        return []

def save_log(log: list):
    LOG_FILE.write_text(json.dumps(log, indent=2))

def load_stats() -> dict:
    ensure_files()
    try:
        return json.loads(STATS_FILE.read_text())
    except Exception:
        return {}

def save_stats(stats: dict):
    STATS_FILE.write_text(json.dumps(stats, indent=2))

def calc_cost(model: str, input_tok: int, output_tok: int) -> float:
    pricing = PRICING.get(model, PRICING["default"])
    return (input_tok / 1000 * pricing["input"]) + (output_tok / 1000 * pricing["output"])

def log_usage(command: str, input_tokens: int, output_tokens: int, model: str = "claude-sonnet", cached: bool = False):
    log = load_log()
    stats = load_stats()
    
    cost = calc_cost(model, input_tokens, output_tokens)
    
    # Baseline cost (what it would cost without optimization)
    baseline = BASELINE_TOKENS.get(command, BASELINE_TOKENS["default"])
    baseline_cost = calc_cost(model, baseline["input"], baseline["output"])
    
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "command": command,
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "cost_usd": round(cost, 6),
        "baseline_cost_usd": round(baseline_cost, 6),
        "savings_usd": round(baseline_cost - cost, 6),
        "cached": cached
    }
    log.append(entry)
    save_log(log)
    
    # Update stats
    stats["total_sessions"] = stats.get("total_sessions", 0) + 1
    stats["total_input_tokens"] = stats.get("total_input_tokens", 0) + input_tokens
    stats["total_output_tokens"] = stats.get("total_output_tokens", 0) + output_tokens
    stats["total_cost_usd"] = round(stats.get("total_cost_usd", 0) + cost, 6)
    stats["baseline_cost_usd"] = round(stats.get("baseline_cost_usd", 0) + baseline_cost, 6)
    
    cmd_stats = stats.get("commands", {})
    if command not in cmd_stats:
        cmd_stats[command] = {"calls": 0, "input": 0, "output": 0, "cost": 0.0}
    cmd_stats[command]["calls"] += 1
    cmd_stats[command]["input"] += input_tokens
    cmd_stats[command]["output"] += output_tokens
    cmd_stats[command]["cost"] = round(cmd_stats[command]["cost"] + cost, 6)
    stats["commands"] = cmd_stats
    save_stats(stats)
    
    return entry

def show_report(today_only: bool = False):
    log = load_log()
    stats = load_stats()
    
    if today_only:
        today = datetime.now(timezone.utc).date()
        log = [e for e in log if datetime.fromisoformat(e["timestamp"]).date() == today]
    
    if not log:
        print(f"{DIM}No usage logged yet.{RESET}")
        return
    
    total_input  = sum(e["input_tokens"] for e in log)
    total_output = sum(e["output_tokens"] for e in log)
    total_cost   = sum(e["cost_usd"] for e in log)
    baseline     = sum(e["baseline_cost_usd"] for e in log)
    savings      = baseline - total_cost
    savings_pct  = (savings / baseline * 100) if baseline > 0 else 0
    
    period = "Today" if today_only else "All Time"
    
    print(f"\n{BOLD}{CYAN}━━━ TOKEN INTELLIGENCE REPORT ({period}) ━━━━━━━━━━━━━━━━━{RESET}")
    print(f"  Total calls:       {len(log)}")
    print(f"  Input tokens:      {total_input:,}")
    print(f"  Output tokens:     {total_output:,}")
    print(f"  Total tokens:      {total_input + total_output:,}")
    print(f"  Actual cost:       {YELLOW}${total_cost:.4f}{RESET}")
    print(f"  Baseline cost:     {DIM}${baseline:.4f} (without optimization){RESET}")
    print(f"  {GREEN}Saved:             ${savings:.4f} ({savings_pct:.0f}% reduction){RESET}")
    
    # Per-command breakdown
    print(f"\n  {BOLD}Command Breakdown:{RESET}")
    cmd_groups = defaultdict(list)
    for entry in log:
        cmd_groups[entry["command"]].append(entry)
    
    for cmd, entries in sorted(cmd_groups.items(), key=lambda x: -len(x[1])):
        calls = len(entries)
        cost  = sum(e["cost_usd"] for e in entries)
        tokens = sum(e["total_tokens"] for e in entries)
        print(f"    /{cmd:<12} {calls:>3}x  {tokens:>7,} tokens  ${cost:.4f}")
    
    # Cache hits
    cached = [e for e in log if e.get("cached")]
    if cached:
        cache_savings = sum(e["baseline_cost_usd"] for e in cached)
        print(f"\n  {GREEN}Cache hits: {len(cached)} calls (saved ~${cache_savings:.4f}){RESET}")
    
    print(f"{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")

def reset_log():
    LOG_FILE.write_text(json.dumps([], indent=2))
    STATS_FILE.write_text(json.dumps({
        "total_sessions": 0, "total_input_tokens": 0, "total_output_tokens": 0,
        "total_cost_usd": 0.0, "baseline_cost_usd": 0.0, "commands": {}
    }, indent=2))
    print(f"{GREEN}✓ Token log reset{RESET}")

def main():
    args = sys.argv[1:]
    if not args:
        show_report()
        return
    
    cmd = args[0]
    
    if cmd == "log":
        if len(args) < 4:
            print("Usage: token_tracker.py log <command> <input_tokens> <output_tokens> [model] [--cached]")
            sys.exit(1)
        command = args[1]
        input_t = int(args[2])
        output_t = int(args[3])
        model   = args[4] if len(args) > 4 and not args[4].startswith("--") else "claude-sonnet"
        cached  = "--cached" in args
        entry = log_usage(command, input_t, output_t, model, cached)
        print(json.dumps(entry, indent=2))
    
    elif cmd == "report":
        today_only = "--today" in args
        show_report(today_only)
    
    elif cmd == "reset":
        reset_log()
    
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)

if __name__ == "__main__":
    main()
