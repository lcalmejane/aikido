#!/usr/bin/env bash
# ending-3-validate-indexes.sh - Valider index créés
# Usage: ending-3-validate-indexes.sh <source_dir> <project_type> [project_names...]

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"
PROJECT_TYPE="${2:-MONO}"
shift 2 || true
PROJECT_NAMES=("$@")

echo "🔍 Validation des index créés..."

if [ "$PROJECT_TYPE" = "MONO" ]; then
  if [ -f "$SOURCE_DIR/prompts/index.md" ]; then
    echo "✅ Validation MONO : Index principal existe"
    exit 0
  else
    echo "❌ ERREUR : Index principal manquant après génération"
    exit 1
  fi
fi

if [ "$PROJECT_TYPE" = "MULTI" ]; then
  if [ ! -f "$SOURCE_DIR/prompts/index.md" ]; then
    echo "❌ ERREUR : Index global manquant après génération"
    exit 1
  fi

  MISSING_INDEXES=0
  for project_name in "${PROJECT_NAMES[@]}"; do
    if [ ! -f "$SOURCE_DIR/prompts/$project_name/index.md" ]; then
      echo "❌ ERREUR : Index projet manquant : $project_name"
      ((MISSING_INDEXES++))
    fi
  done

  if [ $MISSING_INDEXES -eq 0 ]; then
    echo "✅ Validation MULTI : Tous les index existent"
    exit 0
  else
    echo "❌ ERREUR : $MISSING_INDEXES index projet(s) manquant(s)"
    exit 1
  fi
fi

exit 0
