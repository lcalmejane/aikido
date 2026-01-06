#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:-.}"
FAILED_PLAN="${2:-UNKNOWN}"
ERROR_CODE="${3:-1}"
ERROR_MESSAGE="${4:-Aucun message}"

echo "==============================================================="
echo "GESTION ERREURS - DIAGNOSTIC CENTRALISE"
echo "==============================================================="
echo ""

cd "$SOURCE_DIR"

echo "Contexte:"
echo "  Plan: $FAILED_PLAN"
echo "  Code: $ERROR_CODE"  
echo "  Msg: $ERROR_MESSAGE"
echo ""

echo "Logs:"
find "$SOURCE_DIR/prompts/spec/logs" -name "phase-*.log" -mmin -60 2>/dev/null | sort | while read -r log; do
  echo "  - $(basename "$log")"
done
echo ""

echo "$FAILED_PLAN|$ERROR_CODE|$ERROR_MESSAGE"
