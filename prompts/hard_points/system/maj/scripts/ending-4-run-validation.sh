#!/usr/bin/env bash
# ending-4-run-validation.sh - Wrapper validate-structure.sh
# Usage: ending-4-run-validation.sh <source_dir> <project_type>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"
PROJECT_TYPE="${2:-MONO}"

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 VALIDATION STRUCTURE AI-KIDO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

VALIDATE_SCRIPT="$SOURCE_DIR/prompts/hard_points/system/maj/scripts/validate-structure.sh"

if [ ! -f "$VALIDATE_SCRIPT" ]; then
  echo "❌ ERROR: Validation script not found"
  echo "   Expected path: $VALIDATE_SCRIPT"
  exit 1
fi

echo "✅ Validation script located: $VALIDATE_SCRIPT"
echo ""
echo "🔍 Running validation (type: $PROJECT_TYPE, version: 1.3)..."
echo ""

cd "$SOURCE_DIR"
"$VALIDATE_SCRIPT" "." --type "$PROJECT_TYPE" --version 1.3
VALIDATION_EXIT=$?

echo ""

if [ $VALIDATION_EXIT -eq 0 ]; then
  echo "✅ VALIDATION SUCCESSFUL"
  echo ""
  echo "   Structure du projet conforme AI-KIDO V1.3 ($PROJECT_TYPE)"
  echo ""
else
  echo "❌ VALIDATION FAILED (code: $VALIDATION_EXIT)"
  echo ""
  echo "   The project structure does not comply with the AI-KIDO rules"
  echo ""
fi

exit $VALIDATION_EXIT
