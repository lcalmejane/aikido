#!/usr/bin/env bash
# beginning-generate-structure.sh - Générer structures JSON before/target
# Usage: beginning-generate-structure.sh <source_dir> <target_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

SOURCE_DIR="${1:-.}"
TARGET_DIR="${2:-}"

if [ -z "$TARGET_DIR" ]; then
  echo "Usage: $(basename "$0") <source_dir> <target_dir>" >&2
  exit 1
fi

mkdir -p /tmp/aikido

GENERATE_SCRIPT="prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh"

# Structure TARGET
echo "📊 Génération structure TARGET..."
cd "$TARGET_DIR"
if bash "$GENERATE_SCRIPT" && [ -f "prompts/hard_points/system/structure/index.json" ]; then
  cp prompts/hard_points/system/structure/index.json /tmp/aikido/maj_target.json
  echo "✅ Structure TARGET : /tmp/aikido/maj_target.json"
else
  echo "⚠️  Échec structure TARGET (non bloquant)"
fi

# Structure SOURCE (before)
echo "📊 Génération structure SOURCE (before)..."
cd "$SOURCE_DIR"
if bash "$GENERATE_SCRIPT" && [ -f "prompts/hard_points/system/structure/index.json" ]; then
  cp prompts/hard_points/system/structure/index.json /tmp/aikido/maj_before.json
  echo "✅ Structure SOURCE (before) : /tmp/aikido/maj_before.json"
else
  echo "⚠️  Échec structure SOURCE (non bloquant)"
fi
