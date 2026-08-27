#!/bin/bash
# Weekly refresh: parse last 7d of Telegram listings, then prune anything older.
# Designed for macOS launchd (runs headless; TG session must already be logged in).
set -u
cd /Users/ruslansavvin/danang-apartments || exit 1

LOG=/Users/ruslansavvin/danang-apartments/weekly_refresh.log
echo "=== $(date) weekly_refresh start ===" >> "$LOG"

# kill any stale parser / free the sqlite session lock
pkill -9 -f "python3 parser" 2>/dev/null
sleep 1
rm -f danang_session.session-journal

# 1) Parse fresh listings (skip translate for speed; upsert is idempotent)
SKIP_TRANSLATE=1 python3 parser.py >> "$LOG" 2>&1

# 2) Prune anything older than 7 days
WRITE=1 python3 prune_old.py >> "$LOG" 2>&1

echo "=== $(date) weekly_refresh done ===" >> "$LOG"
