#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:-.}"
FAILED_PLAN="${2:-UNKNOWN}"
ERROR_CODE="${3:-1}"
ERROR_MESSAGE="${4:-Aucun message}"

mkdir -p "$SOURCE_DIR/prompts/spec/logs"
TS=$(date +%Y%m%d-%H%M%S)
REPORT="$SOURCE_DIR/prompts/spec/logs/error-report-$TS.md"

case "$FAILED_PLAN" in
  "ending-0") D="Fusion - Agent manquant";;
  "ending-1") D="Detection - Script generation";;
  *) D="Voir logs";;
esac

{
  echo "# Rapport Erreur"
  echo "Date: $(date)"
  echo "Plan: $FAILED_PLAN"
  echo "Code: $ERROR_CODE"
  echo "Msg: $ERROR_MESSAGE"
  echo "Diag: $D"
} > "$REPORT"

echo "Rapport: $REPORT"
cat "$REPORT"
