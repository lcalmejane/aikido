#!/usr/bin/env bash
# ending-10-diagnostic-by-plan.sh - Diagnostic based on the failed plan
# Usage: ending-10-diagnostic-by-plan.sh <failed_plan>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

FAILED_PLAN="${1:-UNKNOWN}"

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 DIAGNOSTIC AUTOMATIQUE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

case "$FAILED_PLAN" in
  "ending-0"|"plan-ending-0")
    echo "❌ Failure: Intelligent merge (ending-0)"
    echo ""
    echo "Causes probables :"
    echo "  1. Agent-aikido-fusion introuvable"
    echo "  2. Corrupted source/target files"
    echo "  3. Invalid JSON differences"
    echo ""
    echo "Proposed solutions:"
    echo "  - Check agent: ls -la prompts/hard_points/agents/agent-aikido-fusion.md"
    echo "  - Check JSON: ls -la /tmp/aikido/maj_*.json"
    echo "  - Restaurer agent depuis backups/"
    echo "  - Basculer mode MANUAL_LATER"
    ;;

  "ending-1"|"plan-ending-1")
    echo "❌ Failure: Change detection (ending-1)"
    echo ""
    echo "Causes probables :"
    echo "  1. Script generate-all-indexes-v3.1.sh introuvable"
    echo "  2. index.json not generated"
    echo "  3. Permissions insuffisantes"
    echo ""
    echo "Proposed solutions:"
    echo "  - Tester : bash prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh"
    echo "  - Check permissions: ls -la prompts/hard_points/system/structure/"
    echo "  - Create directory: mkdir -p prompts/hard_points/system/structure"
    ;;

  "ending-3"|"plan-ending-3")
    echo "❌ Failure: Index generation (ending-3)"
    echo ""
    echo "Causes probables :"
    echo "  1. Write permissions on /prompts/"
    echo "  2. Project type wrongly detected"
    echo "  3. Index.md not created"
    echo ""
    echo "Proposed solutions:"
    echo "  - Check permissions: ls -ld prompts/"
    echo "  - Force detection: bash prompts/hard_points/system/maj/scripts/detect-project-type.sh detect"
    echo "  - Create manually: touch prompts/index.md"
    echo "  - Re-run: /maj-aikido (plan ending-3 will run again)"
    ;;

  "ending-4"|"plan-ending-4")
    echo "❌ Failure: Structure validation (ending-4)"
    echo ""
    echo "Causes probables :"
    echo "  1. Critical files missing (index.md, ai-kido.md)"
    echo "  2. Structure non conforme V1.3"
    echo "  3. Script validate-structure.sh failed"
    echo ""
    echo "Proposed solutions:"
    echo "  - Check: ls -la prompts/index.md prompts/hard_points/ai-kido.md"
    echo "  - Relancer validation : bash prompts/hard_points/system/maj/scripts/validate-structure.sh . --type MONO --version 1.3"
    echo "  - Restaurer depuis TARGET : cp \$TARGET/prompts/hard_points/ai-kido.md prompts/hard_points/"
    ;;

  "beginning"|"plan-beginning")
    echo "❌ Failure: Initialization (plan-beginning)"
    echo ""
    echo "Causes probables :"
    echo "  1. Backup creation/verification failed"
    echo "  2. Versions cannot be detected"
    echo "  3. Permissions backups/"
    echo ""
    echo "Proposed solutions:"
    echo "  - Create directory: mkdir -p backups && chmod 755 backups"
    echo "  - Check files: ls -la prompts/hard_points/ai-kido.md"
    ;;

  *)
    echo "❌ Failure: Unknown or unspecified plan ($FAILED_PLAN)"
    echo ""
    echo "Generic solutions:"
    echo "  - Consulter les logs : cat prompts/spec/logs/phase-*.log"
    echo "  - Check project integrity"
    echo "  - Restaurer backup : tar -xzf backups/aikido-verif-backup-*.tgz"
    ;;
esac

echo ""
