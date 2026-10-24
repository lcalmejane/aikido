#!/usr/bin/env bash
# ending-7-propose-populate.sh - Proposer peuplement gaps
# Usage: ending-7-propose-populate.sh <source_dir> <missing_dirs_count> <missing_files_count>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"
MISSING_DIRS_COUNT="${2:-0}"
MISSING_FILES_COUNT="${3:-0}"

if [ "$MISSING_DIRS_COUNT" -eq 0 ] && [ "$MISSING_FILES_COUNT" -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════════════"
  echo "✅ NO GAP DETECTED"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "   The Memory Bank is complete"
  echo "   No population needed"
  echo ""
  exit 0
fi

echo "═══════════════════════════════════════════════════════════════"
echo "💡 PROPOSITION PEUPLEMENT AUTOMATIQUE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

POPULATE_AGENT="$SOURCE_DIR/prompts/hard_points/agents/agent-aikido-bank-populate.md"

if [ ! -f "$POPULATE_AGENT" ]; then
  echo "⚠️  Agent-aikido-bank-populate introuvable : $POPULATE_AGENT"
  echo "   Peuplement automatique impossible"
  echo ""
  echo "📝 Manual recommendations: see gaps detected above"
  echo ""
  exit 0
fi

echo "✅ Agent-aikido-bank-populate available"
echo ""
echo "📝 Preparing population context..."

POPULATE_CONTEXT="/tmp/aikido/populate-context-$$.md"

cat > "$POPULATE_CONTEXT" <<'POPULATE'
# 🌱 PEUPLEMENT MEMORY BANK AI-KIDO

You are **agent-aikido-bank-populate**. Your mission is to populate the gaps detected in the Memory Bank.

## Mission

1. **Create missing directories** with 755 permissions
2. **Generate index.md files** for each directory
3. **Create lists** (agents_list.md, commands_list.md, skills_list.md) if missing
4. **Populate with minimal content** compliant with AI-KIDO

## Rules

- Strict AI-KIDO compliance (≤500 lines, frontmatter, links)
- Templates depuis prompts/hard_points/
- Pas de duplication

## Action

Run the population NOW (creation only, no modification of existing files).
POPULATE

echo "✅ Context created: $POPULATE_CONTEXT"
echo ""
echo "⚡ To run the population:"
echo "   Le LLM doit :"
echo "   1. Read $POPULATE_AGENT"
echo "   2. Read $POPULATE_CONTEXT"
echo "   3. Create missing directories/files"
echo "   4. Generate compliant content"
echo ""
echo "   OR run manually:"
echo "   /bank-populate --gaps-only"
echo ""
