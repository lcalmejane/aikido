#!/usr/bin/env bash
# ending-4-diagnostic-structure.sh - Detailed structure diagnostic
# Usage: ending-4-diagnostic-structure.sh <source_dir> <project_type>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"
PROJECT_TYPE="${2:-MONO}"

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 DETAILED DIAGNOSTIC"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Checking critical AI-KIDO files:"
echo ""

# Hard points
echo "📋 Hard Points :"
[ -f "$SOURCE_DIR/prompts/hard_points/ai-kido.md" ] && echo "  ✅ ai-kido.md present" || echo "  ❌ ai-kido.md MISSING"
[ -f "$SOURCE_DIR/prompts/hard_points/ai-kido-light.md" ] && echo "  ✅ ai-kido-light.md present" || echo "  ⚠️  ai-kido-light.md missing (optional)"
echo ""

# Index
echo "📋 Index ($PROJECT_TYPE) :"
if [ "$PROJECT_TYPE" = "MONO" ]; then
  [ -f "$SOURCE_DIR/prompts/index.md" ] && echo "  ✅ /prompts/index.md present" || echo "  ❌ /prompts/index.md MISSING"
else
  [ -f "$SOURCE_DIR/prompts/index.md" ] && echo "  ✅ /prompts/index.md (global) present" || echo "  ❌ /prompts/index.md (global) MISSING"

  find "$SOURCE_DIR/prompts" -mindepth 2 -maxdepth 2 -name "index.md" 2>/dev/null | while read -r idx; do
    PROJECT_NAME=$(basename "$(dirname "$idx")")
    echo "  ✅ /prompts/$PROJECT_NAME/index.md present"
  done
fi
echo ""

# Essential directories
echo "📋 Essential directories:"
for dir in "prompts/gen" "prompts/hard_points" "prompts/spec"; do
  [ -d "$SOURCE_DIR/$dir" ] && echo "  ✅ $dir present" || echo "  ❌ $dir MISSING"
done
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
