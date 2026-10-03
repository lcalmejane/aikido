#!/usr/bin/env bash
# beginning-detect-versions.sh - Detect CURRENT and TARGET versions
# Usage: beginning-detect-versions.sh <source_dir> <target_dir>

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 Detecting versions..."

# Detect current version
MAJ_CURRENT_VERSION=$("$SCRIPT_DIR/detect-version.sh" "$SOURCE_DIR/prompts/hard_points/ai-kido.md")

# Detect target version
MAJ_TARGET_VERSION=$("$SCRIPT_DIR/detect-version.sh" "$TARGET_DIR/prompts/hard_points/ai-kido.md")

if [ -z "$MAJ_CURRENT_VERSION" ] || [ -z "$MAJ_TARGET_VERSION" ]; then
  echo "❌ ERROR: Unable to detect versions" >&2
  echo "   CURRENT = ${MAJ_CURRENT_VERSION:-VIDE}" >&2
  echo "   TARGET  = ${MAJ_TARGET_VERSION:-VIDE}" >&2
  exit 1
fi

echo "ℹ️  Versions detected:"
echo "   CURRENT : $MAJ_CURRENT_VERSION"
echo "   TARGET  : $MAJ_TARGET_VERSION"

# Export for later use
export MAJ_CURRENT_VERSION
export MAJ_TARGET_VERSION

echo "$MAJ_CURRENT_VERSION $MAJ_TARGET_VERSION"
