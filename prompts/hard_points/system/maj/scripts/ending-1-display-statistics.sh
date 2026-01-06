#!/usr/bin/env bash
# ending-1-display-statistics.sh - Afficher statistiques rapport différentiel
# Usage: ending-1-display-statistics.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo ""
echo "📈 Analyse du rapport différentiel..."

# Compter les changements
CHANGES_COUNT=$(jq 'keys | length' /tmp/aikido/maj_diff.json)

if [ "$CHANGES_COUNT" -eq 0 ]; then
  echo "   ℹ️  Aucun changement détecté"
else
  echo "   🔄 $CHANGES_COUNT élément(s) modifié(s)"

  # Détails par type
  ADDED=$(jq '[.[] | select(.before == null)] | length' /tmp/aikido/maj_diff.json)
  REMOVED=$(jq '[.[] | select(.after == null)] | length' /tmp/aikido/maj_diff.json)
  MODIFIED=$(jq '[.[] | select(.before != null and .after != null)] | length' /tmp/aikido/maj_diff.json)

  echo ""
  echo "   Détails :"
  echo "   - Ajoutés   : $ADDED"
  echo "   - Supprimés : $REMOVED"
  echo "   - Modifiés  : $MODIFIED"
fi

echo ""

# Export pour usage ultérieur
echo "$CHANGES_COUNT $ADDED $REMOVED $MODIFIED"
