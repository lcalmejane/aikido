#!/usr/bin/env bash
# ending-2-detect-backups.sh - Détecter fichiers .bak
# Usage: ending-2-detect-backups.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo "═══════════════════════════════════════════════════════════════"
echo "💾 DÉTECTION FICHIERS BACKUP"
echo "═══════════════════════════════════════════════════════════════"
echo ""

BACKUP_FILES=$(find "$SOURCE_DIR" -type f -name "*.bak*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$BACKUP_FILES" -eq 0 ]; then
  echo "ℹ️  Aucun fichier .bak détecté"
else
  echo "📋 $BACKUP_FILES fichier(s) .bak détecté(s)"
  echo ""
  echo "Liste (10 premiers) :"
  find "$SOURCE_DIR" -type f -name "*.bak*" 2>/dev/null | head -10 | while read -r file; do
    echo "  💾 $file"
  done

  [ "$BACKUP_FILES" -gt 10 ] && echo "  ... et $((BACKUP_FILES - 10)) autre(s)"

  echo ""
  echo "⚠️  Ces fichiers peuvent être nettoyés après validation"
  echo "   Ils seront mis de côté pour revue dans plan ending-5"
  echo ""

  find "$SOURCE_DIR" -type f -name "*.bak*" 2>/dev/null > /tmp/aikido/backup_files_list.txt
  echo "✅ Liste sauvegardée : /tmp/aikido/backup_files_list.txt"
fi

echo ""
echo "$BACKUP_FILES"
