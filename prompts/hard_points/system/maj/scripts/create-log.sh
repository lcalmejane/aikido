#!/usr/bin/env bash
# create-log.sh - Créer fichier log formaté
# Usage: create-log.sh <log_file> <title> <content>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

LOG_FILE="${1:-}"
TITLE="${2:-Log Entry}"
CONTENT="${3:-}"

if [ -z "$LOG_FILE" ]; then
  echo "Usage: $(basename "$0") <log_file> <title> [content]" >&2
  exit 1
fi

mkdir -p "$(dirname "$LOG_FILE")"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
$TITLE
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

$CONTENT

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log créé : $LOG_FILE"
