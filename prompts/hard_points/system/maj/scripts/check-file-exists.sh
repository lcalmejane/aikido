#!/usr/bin/env bash
# check-file-exists.sh - Vérifie l'existence d'un fichier/répertoire
# Usage: check-file-exists.sh <path> [--required]

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

FILE_PATH="${1:-}"
REQUIRED="${2:-}"

if [ -z "$FILE_PATH" ]; then
  echo "Usage: $(basename "$0") <path> [--required]" >&2
  exit 1
fi

if [ -e "$FILE_PATH" ]; then
  echo "✅ $FILE_PATH existe"
  exit 0
else
  if [ "$REQUIRED" = "--required" ]; then
    echo "❌ ERREUR : $FILE_PATH manquant (requis)" >&2
    exit 1
  else
    echo "⚠️  $FILE_PATH manquant (optionnel)"
    exit 0
  fi
fi
