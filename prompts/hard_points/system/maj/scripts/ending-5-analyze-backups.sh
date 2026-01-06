#!/usr/bin/env bash
# ending-5-analyze-backups.sh - Analyser backups par ancienneté
# Usage: ending-5-analyze-backups.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo "═══════════════════════════════════════════════════════════════"
echo "💾 REVUE FICHIERS BACKUP"
echo "═══════════════════════════════════════════════════════════════"
echo ""

BACKUP_LIST="/tmp/aikido/backup_files_list.txt"

if [ ! -f "$BACKUP_LIST" ]; then
  echo "ℹ️  Aucune liste de backup détectée, recherche directe..."
  find "$SOURCE_DIR" -type f -name "*.bak*" 2>/dev/null > /tmp/aikido/backup_files_list.txt
  BACKUP_LIST="/tmp/aikido/backup_files_list.txt"
fi

BACKUP_COUNT=$(cat "$BACKUP_LIST" 2>/dev/null | wc -l | tr -d ' ')

if [ "$BACKUP_COUNT" -eq 0 ]; then
  echo "✅ Aucun fichier .bak détecté"
  echo ""
  echo "0 0 0"
  exit 0
fi

echo "📋 $BACKUP_COUNT fichier(s) .bak détecté(s)"
echo ""
echo "📊 Analyse par ancienneté :"
echo ""

RECENT=$(find "$SOURCE_DIR" -type f -name "*.bak*" -mmin -60 2>/dev/null | wc -l | tr -d ' ')
OLD=$(find "$SOURCE_DIR" -type f -name "*.bak*" -mmin +1440 2>/dev/null | wc -l | tr -d ' ')

echo "  🆕 Récents (< 1h)   : $RECENT"
echo "  📦 Intermédiaires   : $((BACKUP_COUNT - RECENT - OLD))"
echo "  🕰️  Anciens (> 24h) : $OLD"
echo ""

[ "$OLD" -gt 0 ] && {
  echo "⚠️  $OLD fichier(s) ancien(s) peuvent être supprimés après validation"
  echo "   find \"$SOURCE_DIR\" -type f -name \"*.bak*\" -mmin +1440 -delete"
  echo ""
}

echo "$BACKUP_COUNT $RECENT $OLD"
