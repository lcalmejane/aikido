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

# Wait for report generation (30s timeout)
WAIT_COUNT=0
while [ ! -f "$VALIDATION_SUMMARY" ] && [ $WAIT_COUNT -lt 30 ]; do
  sleep 1
  ((WAIT_COUNT++))
done

if [ -f "$VALIDATION_SUMMARY" ]; then
  echo "✅ Validation report detected"
  echo ""
  cat "$VALIDATION_SUMMARY"
  echo ""

  if grep -q "OK" "$VALIDATION_SUMMARY"; then
    echo "✅ Validation successful: Memory Bank compliant"
    echo "OK"
  else
    echo "⚠️  Partial validation: errors detected"
    echo ""
    echo "See details in: $VALIDATION_REPORT"
    echo "KO"
  fi
else
  echo "⚠️  Report not generated (timeout or agent not run)"
  echo "UNKNOWN"
fi

echo ""
