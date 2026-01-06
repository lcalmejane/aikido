#!/usr/bin/env bash
# ending-1-generate-after-structure.sh - Générer structure AFTER
# Usage: ending-1-generate-after-structure.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo ""
echo "📊 Génération structure projet (AFTER)..."
echo "   Répertoire : $SOURCE_DIR"
echo ""

cd "$SOURCE_DIR"

GENERATE_SCRIPT="prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh"

if [ ! -f "$GENERATE_SCRIPT" ]; then
  echo "❌ ERREUR : Script de génération introuvable"
  echo "   Chemin attendu : $GENERATE_SCRIPT"
  exit 1
fi

bash "$GENERATE_SCRIPT"
GENERATE_EXIT=$?

if [ $GENERATE_EXIT -ne 0 ]; then
  echo "❌ ERREUR : Échec de la génération de structure"
  echo "   Code de sortie : $GENERATE_EXIT"
  exit 1
fi

echo "✅ Structure générée avec succès"

INDEX_JSON="$SOURCE_DIR/prompts/hard_points/system/structure/index.json"

if [ ! -f "$INDEX_JSON" ]; then
  echo "❌ ERREUR : Fichier index.json non généré"
  echo "   Chemin attendu : $INDEX_JSON"
  exit 1
fi

mkdir -p /tmp/aikido
cp "$INDEX_JSON" /tmp/aikido/maj_after.json

echo "✅ Structure AFTER sauvegardée : /tmp/aikido/maj_after.json"
