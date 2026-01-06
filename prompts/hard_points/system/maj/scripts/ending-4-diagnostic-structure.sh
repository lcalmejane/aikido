#!/usr/bin/env bash
# ending-4-diagnostic-structure.sh - Diagnostic détaillé structure
# Usage: ending-4-diagnostic-structure.sh <source_dir> <project_type>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"
PROJECT_TYPE="${2:-MONO}"

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 DIAGNOSTIC DÉTAILLÉ"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Vérification des fichiers critiques AI-KIDO :"
echo ""

# Hard points
echo "📋 Hard Points :"
[ -f "$SOURCE_DIR/prompts/hard_points/ai-kido.md" ] && echo "  ✅ ai-kido.md présent" || echo "  ❌ ai-kido.md MANQUANT"
[ -f "$SOURCE_DIR/prompts/hard_points/ai-kido-light.md" ] && echo "  ✅ ai-kido-light.md présent" || echo "  ⚠️  ai-kido-light.md manquant (optionnel)"
echo ""

# Index
echo "📋 Index ($PROJECT_TYPE) :"
if [ "$PROJECT_TYPE" = "MONO" ]; then
  [ -f "$SOURCE_DIR/prompts/index.md" ] && echo "  ✅ /prompts/index.md présent" || echo "  ❌ /prompts/index.md MANQUANT"
else
  [ -f "$SOURCE_DIR/prompts/index.md" ] && echo "  ✅ /prompts/index.md (global) présent" || echo "  ❌ /prompts/index.md (global) MANQUANT"

  find "$SOURCE_DIR/prompts" -mindepth 2 -maxdepth 2 -name "index.md" 2>/dev/null | while read -r idx; do
    PROJECT_NAME=$(basename "$(dirname "$idx")")
    echo "  ✅ /prompts/$PROJECT_NAME/index.md présent"
  done
fi
echo ""

# Répertoires essentiels
echo "📋 Répertoires essentiels :"
for dir in "prompts/gen" "prompts/hard_points" "prompts/spec"; do
  [ -d "$SOURCE_DIR/$dir" ] && echo "  ✅ $dir présent" || echo "  ❌ $dir MANQUANT"
done
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
