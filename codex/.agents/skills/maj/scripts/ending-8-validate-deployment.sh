#!/usr/bin/env bash
# ending-8-validate-deployment.sh
# Validates that all files present in TARGET were copied into SOURCE
# Usage: ending-8-validate-deployment.sh <TARGET> <SOURCE>

set -euo pipefail

TARGET="${1:-.}"
SOURCE="${2:-.}"

WARNINGS=0
MISSING_FILES=()

echo "🔍 Validating deployment (TARGET → SOURCE)..."

# Validate .roo/commands
if [ -d "$TARGET/.roo/commands" ]; then
  TARGET_ROO_COUNT=$(find "$TARGET/.roo/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$TARGET_ROO_COUNT" -gt 0 ]; then
    SOURCE_ROO_COUNT=$(find "$SOURCE/.roo/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

    if [ "$SOURCE_ROO_COUNT" -lt "$TARGET_ROO_COUNT" ]; then
      echo "  ⚠️  .roo/commands/ : $SOURCE_ROO_COUNT/$TARGET_ROO_COUNT files in SOURCE"
      WARNINGS=$((WARNINGS + 1))
    else
      echo "  ✅ .roo/commands/ : $TARGET_ROO_COUNT files copied"
    fi
  fi
fi

# Validate .claude/commands
if [ -d "$TARGET/.claude/commands" ]; then
  TARGET_CLAUDE_CMD_COUNT=$(find "$TARGET/.claude/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$TARGET_CLAUDE_CMD_COUNT" -gt 0 ]; then
    SOURCE_CLAUDE_CMD_COUNT=$(find "$SOURCE/.claude/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

    if [ "$SOURCE_CLAUDE_CMD_COUNT" -lt "$TARGET_CLAUDE_CMD_COUNT" ]; then
      echo "  ⚠️  .claude/commands/ : $SOURCE_CLAUDE_CMD_COUNT/$TARGET_CLAUDE_CMD_COUNT files in SOURCE"
      WARNINGS=$((WARNINGS + 1))
    else
      echo "  ✅ .claude/commands/ : $TARGET_CLAUDE_CMD_COUNT files copied"
    fi
  fi
fi

# Validate .claude/agents
if [ -d "$TARGET/.claude/agents" ]; then
  TARGET_AGENTS_COUNT=$(find "$TARGET/.claude/agents" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$TARGET_AGENTS_COUNT" -gt 0 ]; then
    SOURCE_AGENTS_COUNT=$(find "$SOURCE/.claude/agents" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

    if [ "$SOURCE_AGENTS_COUNT" -lt "$TARGET_AGENTS_COUNT" ]; then
      echo "  ⚠️  .claude/agents/ : $SOURCE_AGENTS_COUNT/$TARGET_AGENTS_COUNT files in SOURCE"
      WARNINGS=$((WARNINGS + 1))
    else
      echo "  ✅ .claude/agents/ : $TARGET_AGENTS_COUNT files copied"
    fi
  fi
fi

# Validate root files
ROOT_FILES=(
  "AGENTS.md"
  "CLAUDE.md"
  "commands_list.md"
  "agents_list.md"
  "skills_list.md"
)

for file in "${ROOT_FILES[@]}"; do
  if [ -f "$TARGET/$file" ]; then
    if [ -f "$SOURCE/$file" ]; then
      echo "  ✅ $file"
    else
      echo "  ❌ $file (missing in SOURCE)"
      MISSING_FILES+=("$file")
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done

# Result
if [ "$WARNINGS" -eq 0 ]; then
  echo "✅ Validation PASSED: all TARGET files copied into SOURCE"
  echo "PASSED"
else
  echo "⚠️  Validation WARNINGS: $WARNINGS issue(s) detected"

  if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo "Files present in TARGET but missing in SOURCE:"
    for missing in "${MISSING_FILES[@]}"; do
      echo "  - $missing"
    done
  fi

  echo "WARNINGS: $WARNINGS files missing"
fi
