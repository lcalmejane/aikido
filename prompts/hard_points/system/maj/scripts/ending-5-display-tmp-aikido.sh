#!/usr/bin/env bash
# ending-5-display-tmp-aikido.sh - Afficher infos /tmp/aikido
# Usage: ending-5-display-tmp-aikido.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "═══════════════════════════════════════════════════════════════"
echo "🗂️  FICHIERS TEMPORAIRES /tmp/aikido"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ -d "/tmp/aikido" ]; then
  TMP_AIKIDO_SIZE=$(du -sh /tmp/aikido 2>/dev/null | cut -f1)
  TMP_AIKIDO_COUNT=$(find /tmp/aikido -type f 2>/dev/null | wc -l | tr -d ' ')

  echo "📁 Répertoire : /tmp/aikido"
  echo "   Taille     : $TMP_AIKIDO_SIZE"
  echo "   Fichiers   : $TMP_AIKIDO_COUNT"
  echo ""

  echo "📋 Fichiers principaux :"
  ls -lh /tmp/aikido/*.json /tmp/aikido/*.txt 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'
  echo ""

  echo "💡 Ces fichiers peuvent être conservés pour diagnostic"
  echo "   ou supprimés pour libérer de l'espace :"
  echo ""
  echo "   rm -rf /tmp/aikido"
  echo ""
  echo "$TMP_AIKIDO_COUNT $TMP_AIKIDO_SIZE"
else
  echo "ℹ️  Aucun répertoire /tmp/aikido détecté"
  echo ""
  echo "0 0"
fi
