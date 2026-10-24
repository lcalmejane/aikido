#!/usr/bin/env bash
# ending-3-validate-indexes.sh - Validate created indexes
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

echo "🔍 Validating created indexes..."

if [ "$PROJECT_TYPE" = "MONO" ]; then
  if [ -f "$SOURCE_DIR/prompts/index.md" ]; then
    echo "✅ Validation MONO : Index principal existe"
    exit 0
  else
    echo "❌ ERROR: Main index missing after generation"
    exit 1
  fi
fi

if [ "$PROJECT_TYPE" = "MULTI" ]; then
  if [ ! -f "$SOURCE_DIR/prompts/index.md" ]; then
    echo "❌ ERROR: Global index missing after generation"
    exit 1
  fi

  MISSING_INDEXES=0
  for project_name in "${PROJECT_NAMES[@]}"; do
    if [ ! -f "$SOURCE_DIR/prompts/$project_name/index.md" ]; then
      echo "❌ ERROR: Project index missing: $project_name"
      ((MISSING_INDEXES++))
    fi
  done

  if [ $MISSING_INDEXES -eq 0 ]; then
    echo "✅ Validation MULTI : Tous les index existent"
    exit 0
  else
    echo "❌ ERROR: $MISSING_INDEXES project index(es) missing"
    exit 1
  fi
fi

exit 0
