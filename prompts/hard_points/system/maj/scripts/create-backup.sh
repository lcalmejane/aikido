#!/usr/bin/env bash
# create-backup.sh - Créer backup du projet
# Usage: create-backup.sh <source_dir> <backup_name>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

SOURCE_DIR="${1:-.}"
BACKUP_NAME="${2:-aikido-backup}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="backups/${BACKUP_NAME}-${TIMESTAMP}.tgz"

echo "📦 Création backup : $BACKUP_FILE"

mkdir -p backups

LIST_FILES=".claude .roo .roomodes agents_list.md commands_list.md AGENTS.md CLAUDE.md README.md prompts"

cd "$SOURCE_DIR"
tar -czf "$BACKUP_FILE" $LIST_FILES 2>/dev/null

if [ -f "$BACKUP_FILE" ]; then
  echo "✅ Backup créé : $BACKUP_FILE"
  echo "$BACKUP_FILE"
else
  echo "❌ Échec création backup" >&2
  exit 1
fi
