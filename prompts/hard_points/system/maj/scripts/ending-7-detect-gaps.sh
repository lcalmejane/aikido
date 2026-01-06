#!/usr/bin/env bash
# ending-7-detect-gaps.sh - Détecter gaps Memory Bank
# Usage: ending-7-detect-gaps.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 ANALYSE GAPS MEMORY BANK"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd "$SOURCE_DIR"

EXPECTED_DIRS=(
  "prompts/gen/concepts"
  "prompts/gen/techniques"
  "prompts/gen/personas"
  "prompts/gen/use_cases"
  "prompts/hard_points/concepts"
  "prompts/hard_points/techniques"
  "prompts/hard_points/agents"
  "prompts/hard_points/commands"
)

MISSING_DIRS=()
for dir in "${EXPECTED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    MISSING_DIRS+=("$dir")
    echo "❌ Répertoire manquant : $dir"
  fi
done

EXPECTED_FILES=(
  "prompts/gen/index.md"
  "prompts/gen/concepts/index.md"
  "prompts/gen/techniques/index.md"
  "prompts/gen/personas/index.md"
  "prompts/gen/use_cases/index.md"
  "agents_list.md"
  "commands_list.md"
  "skills_list.md"
)

MISSING_FILES=()
for file in "${EXPECTED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    MISSING_FILES+=("$file")
    echo "❌ Fichier manquant : $file"
  fi
done

echo ""
echo "📊 Résumé gaps :"
echo "  Répertoires manquants : ${#MISSING_DIRS[@]}"
echo "  Fichiers manquants    : ${#MISSING_FILES[@]}"
echo ""

# Export pour ending-7-propose-populate.sh
echo "${#MISSING_DIRS[@]} ${#MISSING_FILES[@]}"
