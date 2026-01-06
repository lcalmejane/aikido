#!/usr/bin/env bash
# ending-6-list-critical-files.sh - Lister fichiers critiques
# Usage: ending-6-list-critical-files.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 VALIDATION FINALE CONFORMITÉ AI-KIDO"
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

echo "📋 Fichiers à valider :"
for path in "${CRITICAL_PATHS[@]}"; do
  [ -e "$path" ] && echo "  ✅ $path" || echo "  ⚠️  $path (non trouvé)"
done
echo ""

# Export liste pour usage ultérieur
for path in "${CRITICAL_PATHS[@]}"; do
  [ -e "$path" ] && echo "$path"
done
