#!/usr/bin/env bash
# ending-0-check-json-files.sh - Vérifier existence fichiers JSON structure
# Usage: ending-0-check-json-files.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "🔍 Vérification des fichiers de structure..."

MISSING=false

if [ ! -f "/tmp/aikido/maj_target.json" ]; then
  echo "❌ ERREUR : Fichier /tmp/aikido/maj_target.json manquant"
  echo "   Ce fichier aurait dû être généré par plan-beginning (Phase 5)"
  MISSING=true
fi

if [ ! -f "/tmp/aikido/maj_before.json" ]; then
  echo "❌ ERREUR : Fichier /tmp/aikido/maj_before.json manquant"
  echo "   Ce fichier aurait dû être généré par plan-beginning (Phase 5)"
  MISSING=true
fi

if [ "$MISSING" = true ]; then
  exit 1
fi

echo "✅ Fichiers de structure détectés"
exit 0
