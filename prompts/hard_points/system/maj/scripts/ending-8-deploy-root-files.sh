#!/usr/bin/env bash
# ending-8-deploy-root-files.sh
# Deploys essential root files from TARGET to SOURCE
# Usage: ending-8-deploy-root-files.sh <TARGET> <SOURCE>

set -euo pipefail

TARGET="${1:-.}"
SOURCE="${2:-.}"

DEPLOYED_COUNT=0

echo "📄 Deploying root files (TARGET → SOURCE)..."

# List of root files to deploy
ROOT_FILES=(
  "AGENTS.md"
  "CLAUDE.md"
  "commands_list.md"
  "agents_list.md"
  "skills_list.md"
  ".roomodes"
)

for file in "${ROOT_FILES[@]}"; do
  if [ -f "$TARGET/$file" ]; then
    # Backup if file already exists in SOURCE
    if [ -f "$SOURCE/$file" ]; then
      BACKUP_NAME="${file}.bak.$(date +%Y%m%d-%H%M%S)"
      cp "$SOURCE/$file" "$SOURCE/$BACKUP_NAME"
      echo "  📦 Backup created: $BACKUP_NAME"
    fi

    # Copy TARGET → SOURCE
    cp "$TARGET/$file" "$SOURCE/$file"
    echo "  ✅ $file"

    DEPLOYED_COUNT=$((DEPLOYED_COUNT + 1))
  else
    # Optional file missing in TARGET (not an error)
    if [ "$file" = ".roomodes" ]; then
      echo "  ℹ️  $file (optional, not present in TARGET)"
    else
      echo "  ℹ️  $file (not present in TARGET)"
    fi
  fi
done

# Retour
echo "✅ $DEPLOYED_COUNT root files deployed (TARGET → SOURCE)"
echo "$DEPLOYED_COUNT"
