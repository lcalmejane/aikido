#!/usr/bin/env bash
# ending-0-generate-diff-report.sh - Générer rapport différences TARGET vs SOURCE
# Usage: ending-0-generate-diff-report.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "📊 Analyse des différences TARGET vs SOURCE..."

# Extraire les chemins de fichiers de chaque JSON
jq -r '.by_path | keys[]' /tmp/aikido/maj_target.json | sort > /tmp/aikido/target_files.txt
jq -r '.by_path | keys[]' /tmp/aikido/maj_before.json | sort > /tmp/aikido/source_files.txt

# Fichiers ajoutés (dans TARGET mais pas dans SOURCE)
comm -23 /tmp/aikido/target_files.txt /tmp/aikido/source_files.txt > /tmp/aikido/added_files.txt
ADDED_COUNT=$(wc -l < /tmp/aikido/added_files.txt | tr -d ' ')

# Fichiers modifiés (présents dans les deux, mais différents)
comm -12 /tmp/aikido/target_files.txt /tmp/aikido/source_files.txt | while read -r file; do
  TARGET_SIZE=$(jq -r ".by_path[\"$file\"].size" /tmp/aikido/maj_target.json 2>/dev/null || echo "0")
  SOURCE_SIZE=$(jq -r ".by_path[\"$file\"].size" /tmp/aikido/maj_before.json 2>/dev/null || echo "0")

  if [ "$TARGET_SIZE" != "$SOURCE_SIZE" ]; then
    echo "$file"
  fi
done > /tmp/aikido/modified_files.txt
MODIFIED_COUNT=$(wc -l < /tmp/aikido/modified_files.txt | tr -d ' ')

# Fusionner dans un rapport unique
cat /tmp/aikido/added_files.txt /tmp/aikido/modified_files.txt | sort -u > /tmp/aikido/diff_report.txt
TOTAL_CHANGES=$(wc -l < /tmp/aikido/diff_report.txt | tr -d ' ')

echo ""
echo "📈 Résumé des changements détectés :"
echo "   Fichiers ajoutés    : $ADDED_COUNT"
echo "   Fichiers modifiés   : $MODIFIED_COUNT"
echo "   Total à fusionner   : $TOTAL_CHANGES"
echo ""
echo "✅ Rapport généré : /tmp/aikido/diff_report.txt"

# Export pour usage ultérieur
echo "$TOTAL_CHANGES"
