#!/usr/bin/env bash
# ending-2-analyze-changes.sh - Analyser et catégoriser changements
# Usage: ending-2-analyze-changes.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "═══════════════════════════════════════════════════════════════"
echo "📈 STATISTIQUES DES CHANGEMENTS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

TOTAL_CHANGES=$(jq 'keys | length' /tmp/aikido/maj_diff.json)

if [ "$TOTAL_CHANGES" -eq 0 ]; then
  echo "ℹ️  Aucun changement détecté dans le rapport"
  echo ""
  exit 0
fi

echo "🔄 Total des éléments modifiés : $TOTAL_CHANGES"
echo ""

# Compter par catégorie
ADDED=$(jq '[.[] | select(.before == null)] | length' /tmp/aikido/maj_diff.json)
REMOVED=$(jq '[.[] | select(.after == null)] | length' /tmp/aikido/maj_diff.json)
MODIFIED=$(jq '[.[] | select(.before != null and .after != null)] | length' /tmp/aikido/maj_diff.json)

echo "📊 Répartition :"
echo "   ✨ Fichiers ajoutés   : $ADDED"
echo "   🗑️  Fichiers supprimés : $REMOVED"
echo "   📝 Fichiers modifiés  : $MODIFIED"
echo ""

# Lister si demandé
if [ "${1:-}" = "--list" ]; then
  [ "$ADDED" -gt 0 ] && {
    echo "───────────────────────────────────────────────────────────────"
    echo "✨ FICHIERS AJOUTÉS ($ADDED)"
    echo "───────────────────────────────────────────────────────────────"
    jq -r 'to_entries[] | select(.value.before == null) | "  + \(.key)"' /tmp/aikido/maj_diff.json
    echo ""
  }

  [ "$REMOVED" -gt 0 ] && {
    echo "───────────────────────────────────────────────────────────────"
    echo "🗑️  FICHIERS SUPPRIMÉS ($REMOVED)"
    echo "───────────────────────────────────────────────────────────────"
    jq -r 'to_entries[] | select(.value.after == null) | "  - \(.key)"' /tmp/aikido/maj_diff.json
    echo ""
  }

  [ "$MODIFIED" -gt 0 ] && {
    echo "───────────────────────────────────────────────────────────────"
    echo "📝 FICHIERS MODIFIÉS ($MODIFIED)"
    echo "───────────────────────────────────────────────────────────────"
    jq -r 'to_entries[] | select(.value.before != null and .value.after != null) | "  ~ \(.key)"' /tmp/aikido/maj_diff.json
    echo ""
  }
fi

echo "$TOTAL_CHANGES $ADDED $REMOVED $MODIFIED"
