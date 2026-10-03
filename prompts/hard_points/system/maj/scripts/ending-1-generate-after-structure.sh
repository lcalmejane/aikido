#!/usr/bin/env bash
# ending-1-generate-after-structure.sh - Generate AFTER structure
# Usage: ending-1-generate-after-structure.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo ""
echo "📊 Generating project structure (AFTER)..."
echo "   Directory: $SOURCE_DIR"
echo ""

cd "$SOURCE_DIR"

GENERATE_SCRIPT="prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh"

if [ ! -f "$GENERATE_SCRIPT" ]; then
  echo "❌ ERROR: Generation script not found"
  echo "   Expected path: $GENERATE_SCRIPT"
  exit 1
fi

bash "$GENERATE_SCRIPT"
GENERATE_EXIT=$?

if [ $GENERATE_EXIT -ne 0 ]; then
  echo "❌ ERROR: Structure generation failed"
  echo "   Code de sortie : $GENERATE_EXIT"
  exit 1
fi

echo "✅ Structure generated successfully"

INDEX_JSON="$SOURCE_DIR/prompts/hard_points/system/structure/index.json"

if [ ! -f "$INDEX_JSON" ]; then
  echo "❌ ERROR: index.json file not generated"
  echo "   Expected path: $INDEX_JSON"
  exit 1
fi

mkdir -p /tmp/aikido
cp "$INDEX_JSON" /tmp/aikido/maj_after.json

echo "✅ AFTER structure saved: /tmp/aikido/maj_after.json"
