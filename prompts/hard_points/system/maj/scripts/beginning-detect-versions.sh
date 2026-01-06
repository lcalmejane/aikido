#!/usr/bin/env bash
# beginning-detect-versions.sh - Détecter versions CURRENT et TARGET
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

echo "🔍 Détection versions..."

# Détecter version actuelle
MAJ_CURRENT_VERSION=$("$SCRIPT_DIR/detect-version.sh" "$SOURCE_DIR/prompts/hard_points/ai-kido.md")

# Détecter version cible
MAJ_TARGET_VERSION=$("$SCRIPT_DIR/detect-version.sh" "$TARGET_DIR/prompts/hard_points/ai-kido.md")

if [ -z "$MAJ_CURRENT_VERSION" ] || [ -z "$MAJ_TARGET_VERSION" ]; then
  echo "❌ ERREUR : Impossible de détecter les versions" >&2
  echo "   CURRENT = ${MAJ_CURRENT_VERSION:-VIDE}" >&2
  echo "   TARGET  = ${MAJ_TARGET_VERSION:-VIDE}" >&2
  exit 1
fi

echo "ℹ️  Versions détectées :"
echo "   CURRENT : $MAJ_CURRENT_VERSION"
echo "   TARGET  : $MAJ_TARGET_VERSION"

# Export pour usage ultérieur
export MAJ_CURRENT_VERSION
export MAJ_TARGET_VERSION

echo "$MAJ_CURRENT_VERSION $MAJ_TARGET_VERSION"
