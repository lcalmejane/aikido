#!/usr/bin/env bash
# beginning-check-backup.sh - Check initial backup
# Usage: beginning-check-backup.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

LATEST_BACKUP=$(ls -t backups/aikido-backup-*.tgz 2>/dev/null | head -n 1 || true)

if [ -n "$LATEST_BACKUP" ]; then
  echo "ℹ️  Backup detected: $LATEST_BACKUP"
  echo "$LATEST_BACKUP"
  exit 0
else
  echo "⚠️  No backup found in backups/"
  echo "   The user may have their own system"
  exit 0
fi
