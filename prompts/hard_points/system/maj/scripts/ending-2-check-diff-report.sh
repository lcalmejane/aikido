#!/usr/bin/env bash
# ending-2-check-diff-report.sh - Vérifier rapport différentiel
# Usage: ending-2-check-diff-report.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "🔍 Vérification du rapport différentiel..."

if [ ! -f "/tmp/aikido/maj_diff.json" ]; then
  echo "⚠️  AVERTISSEMENT : Fichier /tmp/aikido/maj_diff.json manquant"
  echo "   Ce fichier aurait dû être généré par plan ending-1"
  echo ""
  echo "   Impact : Impossible d'analyser les changements en détail"
  echo "   Workaround : Analyse visuelle manuelle ou passage direct à ending-3"
  echo ""
  echo "{}" > /tmp/aikido/maj_diff.json
  echo "EMPTY"
  exit 0
fi

echo "✅ Rapport différentiel détecté"
echo "PRESENT"
exit 0
