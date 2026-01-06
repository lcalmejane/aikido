#!/usr/bin/env bash
# ending-2-validate-json.sh - Valider format JSON rapport
# Usage: ending-2-validate-json.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "🔍 Validation format JSON..."

if ! jq empty /tmp/aikido/maj_diff.json 2>/dev/null; then
  echo "⚠️  Format JSON invalide ou corrompu"
  echo "   Contenu brut :"
  cat /tmp/aikido/maj_diff.json
  echo ""
  echo "   → Passage en mode dégradé (analyse manuelle requise)"
  echo "INVALID"
  exit 0
fi

echo "✅ Format JSON valide"
echo "VALID"
exit 0
