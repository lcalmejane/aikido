#!/usr/bin/env bash
# ending-8-deploy-commands.sh
# Deploys command mappings from TARGET to SOURCE
# Usage: ending-8-deploy-commands.sh <TARGET> <SOURCE>

set -euo pipefail

TARGET="${1:-.}"
SOURCE="${2:-.}"

DEPLOYED_COUNT=0

echo "📦 Deploying command mappings (TARGET → SOURCE)..."

# Create directories in SOURCE if needed
mkdir -p "$SOURCE/.roo/commands"
mkdir -p "$SOURCE/.claude/commands"

# Deploy .roo/commands
if [ -d "$TARGET/.roo/commands" ]; then
  ROO_COUNT=$(find "$TARGET/.roo/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$ROO_COUNT" -gt 0 ]; then
    echo "  Copying $ROO_COUNT file(s) from TARGET/.roo/commands → SOURCE/.roo/commands..."

    find "$TARGET/.roo/commands" -name "*.md" -type f | while read -r file; do
      filename=$(basename "$file")

      # Backup if file already exists in SOURCE
      if [ -f "$SOURCE/.roo/commands/$filename" ]; then
        BACKUP_NAME="${filename}.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$SOURCE/.roo/commands/$filename" "$SOURCE/.roo/commands/$BACKUP_NAME"
        echo "    📦 Backup : $BACKUP_NAME"
      fi

      # Copy TARGET → SOURCE
      cp "$file" "$SOURCE/.roo/commands/$filename"
      echo "    ✅ $filename"
    done

    DEPLOYED_COUNT=$((DEPLOYED_COUNT + ROO_COUNT))
  else
    echo "  ℹ️  No file found in TARGET/.roo/commands"
  fi
else
  echo "  ℹ️  Directory .roo/commands does not exist in TARGET"
fi

# Deploy .claude/commands
if [ -d "$TARGET/.claude/commands" ]; then
  CLAUDE_COUNT=$(find "$TARGET/.claude/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$CLAUDE_COUNT" -gt 0 ]; then
    echo "  Copying $CLAUDE_COUNT file(s) from TARGET/.claude/commands → SOURCE/.claude/commands..."

    find "$TARGET/.claude/commands" -name "*.md" -type f | while read -r file; do
      filename=$(basename "$file")

      # Backup if file already exists in SOURCE
      if [ -f "$SOURCE/.claude/commands/$filename" ]; then
        BACKUP_NAME="${filename}.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$SOURCE/.claude/commands/$filename" "$SOURCE/.claude/commands/$BACKUP_NAME"
        echo "    📦 Backup : $BACKUP_NAME"
      fi

      # Copy TARGET → SOURCE
      cp "$file" "$SOURCE/.claude/commands/$filename"
      echo "    ✅ $filename"
    done

    DEPLOYED_COUNT=$((DEPLOYED_COUNT + CLAUDE_COUNT))
  else
    echo "  ℹ️  No file found in TARGET/.claude/commands"
  fi
else
  echo "  ℹ️  Directory .claude/commands does not exist in TARGET"
fi

# Retour
echo "✅ $DEPLOYED_COUNT commands deployed (TARGET → SOURCE)"
echo "$DEPLOYED_COUNT"
