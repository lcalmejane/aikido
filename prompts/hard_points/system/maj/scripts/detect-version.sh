#!/usr/bin/env bash
# detect-version.sh - Extraire version depuis ai-kido.md
# Usage: detect-version.sh <file_path>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

FILE_PATH="${1:-prompts/hard_points/ai-kido.md}"

if [ ! -f "$FILE_PATH" ]; then
  echo "❌ Fichier introuvable : $FILE_PATH" >&2
  exit 1
fi

VERSION=$(grep -E '^> \*\*Version\*\*:' "$FILE_PATH" \
  | head -1 \
  | sed -E 's/^> \*\*Version\*\*: *([^|]+).*/\1/' \
  | tr -d ' ')

if [ -z "$VERSION" ]; then
  echo "❌ Version non détectée dans $FILE_PATH" >&2
  exit 1
fi

echo "$VERSION"
