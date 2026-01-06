#!/usr/bin/env bash
# ending-5-cleanup-tmp-files.sh - Nettoyer fichiers .tmp
# Usage: ending-5-cleanup-tmp-files.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo "═══════════════════════════════════════════════════════════════"
echo "🧹 NETTOYAGE FICHIERS TEMPORAIRES"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd "$SOURCE_DIR"

TMP_FILES=$(find . -type f -name "*.tmp" 2>/dev/null)
TMP_COUNT=$(echo "$TMP_FILES" | grep -v '^$' | wc -l | tr -d ' ')

if [ "$TMP_COUNT" -eq 0 ]; then
  echo "✅ Aucun fichier .tmp détecté (projet propre)"
else
  echo "🗑️  $TMP_COUNT fichier(s) .tmp détecté(s)"
  echo ""
  echo "Liste :"
  echo "$TMP_FILES" | while read -r file; do
    [ -n "$file" ] && echo "  - $file"
  done
  echo ""
  echo "Suppression des fichiers .tmp..."
  find . -type f -name "*.tmp" -delete 2>/dev/null
  echo "✅ Fichiers .tmp supprimés"
fi

echo ""
echo "$TMP_COUNT"
