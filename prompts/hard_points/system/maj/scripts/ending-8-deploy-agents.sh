#!/usr/bin/env bash
# ending-8-deploy-agents.sh
# Deploys agent mappings from TARGET to SOURCE
# Usage: ending-8-deploy-agents.sh <TARGET> <SOURCE>

set -euo pipefail

TARGET="${1:-.}"
SOURCE="${2:-.}"

DEPLOYED_COUNT=0

echo "🤖 Deploying agent mappings (TARGET → SOURCE)..."

# Create directory in SOURCE if needed
mkdir -p "$SOURCE/.claude/agents"

# Deploy .claude/agents
if [ -d "$TARGET/.claude/agents" ]; then
  AGENTS_COUNT=$(find "$TARGET/.claude/agents" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$AGENTS_COUNT" -gt 0 ]; then
    echo "  Copying $AGENTS_COUNT file(s) from TARGET/.claude/agents → SOURCE/.claude/agents..."

    find "$TARGET/.claude/agents" -name "*.md" -type f | while read -r file; do
      filename=$(basename "$file")

      # Backup if file already exists in SOURCE
      if [ -f "$SOURCE/.claude/agents/$filename" ]; then
        BACKUP_NAME="${filename}.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$SOURCE/.claude/agents/$filename" "$SOURCE/.claude/agents/$BACKUP_NAME"
        echo "    📦 Backup : $BACKUP_NAME"
      fi

      # Copy TARGET → SOURCE
      cp "$file" "$SOURCE/.claude/agents/$filename"
      echo "    ✅ $filename"
    done

    DEPLOYED_COUNT=$AGENTS_COUNT
  else
    echo "  ℹ️  No file found in TARGET/.claude/agents"
  fi
else
  echo "  ℹ️  Directory .claude/agents does not exist in TARGET"
fi

# Retour
echo "✅ $DEPLOYED_COUNT agents deployed (TARGET → SOURCE)"
echo "$DEPLOYED_COUNT"
