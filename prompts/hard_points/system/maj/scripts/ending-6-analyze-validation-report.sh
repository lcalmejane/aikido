#!/usr/bin/env bash
# ending-6-analyze-validation-report.sh - Analyser rapport validation
# Usage: ending-6-analyze-validation-report.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "═══════════════════════════════════════════════════════════════"
echo "📊 ANALYSE RAPPORT VALIDATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

VALIDATION_REPORT="/tmp/aikido/validation-report.md"
VALIDATION_SUMMARY="/tmp/aikido/validation-summary.txt"

# Attendre génération rapport (timeout 30s)
WAIT_COUNT=0
while [ ! -f "$VALIDATION_SUMMARY" ] && [ $WAIT_COUNT -lt 30 ]; do
  sleep 1
  ((WAIT_COUNT++))
done

if [ -f "$VALIDATION_SUMMARY" ]; then
  echo "✅ Rapport de validation détecté"
  echo ""
  cat "$VALIDATION_SUMMARY"
  echo ""

  if grep -q "OK" "$VALIDATION_SUMMARY"; then
    echo "✅ Validation réussie : Memory Bank conforme"
    echo "OK"
  else
    echo "⚠️  Validation partielle : Erreurs détectées"
    echo ""
    echo "Voir détails dans : $VALIDATION_REPORT"
    echo "KO"
  fi
else
  echo "⚠️  Rapport non généré (timeout ou agent non exécuté)"
  echo "UNKNOWN"
fi

echo ""
