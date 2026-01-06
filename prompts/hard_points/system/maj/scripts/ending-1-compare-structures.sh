#!/usr/bin/env bash
# ending-1-compare-structures.sh - Comparer structures before/after
# Usage: ending-1-compare-structures.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo ""
echo "📊 Comparaison structures BEFORE vs AFTER..."
echo ""

# Comparer avec jq
jq -s '
  def diff(a; b):
    a as $a | b as $b |
    reduce ($a | keys_unsorted[]) as $k (
      {};
      if ($b | has($k))
      then
        if ($a[$k] != $b[$k])
        then .[$k] = {before: $a[$k], after: $b[$k]}
        else .
        end
      else
        .[$k] = {before: $a[$k], after: null}
      end
    ) +
    reduce ($b | keys_unsorted[]) as $k (
      {};
      if ($a | has($k) | not)
      then .[$k] = {before: null, after: $b[$k]}
      else .
      end
    );

  diff(.[0]; .[1])
' /tmp/aikido/maj_before.json /tmp/aikido/maj_after.json > /tmp/aikido/maj_diff.json

JQ_EXIT=$?

if [ $JQ_EXIT -ne 0 ]; then
  echo "⚠️  Échec comparaison jq (code: $JQ_EXIT)"
  echo "   Rapport différentiel non généré"
  echo ""
  echo "   Fichiers disponibles pour comparaison manuelle :"
  echo "   - /tmp/aikido/maj_before.json"
  echo "   - /tmp/aikido/maj_after.json"
  echo ""
  exit 1
fi

echo "✅ Rapport différentiel généré : /tmp/aikido/maj_diff.json"
