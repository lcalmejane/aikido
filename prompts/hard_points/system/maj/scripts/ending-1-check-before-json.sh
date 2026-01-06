#!/usr/bin/env bash
# ending-1-check-before-json.sh - Vérifier existence fichier JSON before
# Usage: ending-1-check-before-json.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "🔍 Vérification des prérequis..."

if [ ! -f "/tmp/aikido/maj_before.json" ]; then
  echo "⚠️  AVERTISSEMENT : Fichier /tmp/aikido/maj_before.json manquant"
  echo "   Ce fichier aurait dû être généré par plan-beginning (Phase 5)"
  echo ""
  echo "   Impact : Impossible de générer rapport différentiel complet"
  echo "   Workaround : Génération structure actuelle uniquement"
  echo ""
  echo "SKIP_DIFF"
  exit 0
fi

echo "✅ Fichier structure 'before' détecté"
echo "NO_SKIP"
exit 0
