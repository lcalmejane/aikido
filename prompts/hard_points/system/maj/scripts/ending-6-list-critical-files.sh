#!/usr/bin/env bash
# ending-6-list-critical-files.sh - List critical files
# Usage: ending-6-list-critical-files.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 FINAL AI-KIDO COMPLIANCE VALIDATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd "$SOURCE_DIR"

CRITICAL_PATHS=(
  "prompts/hard_points/"
  "prompts/gen/"
  "AGENTS.md"
  "CLAUDE.md"
  ".roomodes"
)

echo "📋 Files to validate:"
for path in "${CRITICAL_PATHS[@]}"; do
  [ -e "$path" ] && echo "  ✅ $path" || echo "  ⚠️  $path (not found)"
done
echo ""

# Export list for later use
for path in "${CRITICAL_PATHS[@]}"; do
  [ -e "$path" ] && echo "$path"
done
