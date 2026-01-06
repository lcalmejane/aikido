#!/usr/bin/env bash
# ending-10-diagnostic-by-plan.sh - Diagnostic selon plan échoué
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
    echo "❌ Échec : Fusion intelligente (ending-0)"
    echo ""
    echo "Causes probables :"
    echo "  1. Agent-aikido-fusion introuvable"
    echo "  2. Fichiers source/cible corrompus"
    echo "  3. Différences JSON invalides"
    echo ""
    echo "Solutions proposées :"
    echo "  - Vérifier agent : ls -la prompts/hard_points/agents/agent-aikido-fusion.md"
    echo "  - Vérifier JSON : ls -la /tmp/aikido/maj_*.json"
    echo "  - Restaurer agent depuis backups/"
    echo "  - Basculer mode MANUAL_LATER"
    ;;

  "ending-1"|"plan-ending-1")
    echo "❌ Échec : Détection changements (ending-1)"
    echo ""
    echo "Causes probables :"
    echo "  1. Script generate-all-indexes-v3.1.sh introuvable"
    echo "  2. index.json non généré"
    echo "  3. Permissions insuffisantes"
    echo ""
    echo "Solutions proposées :"
    echo "  - Tester : bash prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh"
    echo "  - Vérifier permissions : ls -la prompts/hard_points/system/structure/"
    echo "  - Créer répertoire : mkdir -p prompts/hard_points/system/structure"
    ;;

  "ending-3"|"plan-ending-3")
    echo "❌ Échec : Génération index (ending-3)"
    echo ""
    echo "Causes probables :"
    echo "  1. Permissions écriture /prompts/"
    echo "  2. Type projet mal détecté"
    echo "  3. Index.md non créé"
    echo ""
    echo "Solutions proposées :"
    echo "  - Vérifier permissions : ls -ld prompts/"
    echo "  - Forcer détection : bash prompts/hard_points/system/maj/scripts/detect-project-type.sh detect"
    echo "  - Créer manuellement : touch prompts/index.md"
    echo "  - Relancer : /maj-aikido (plan ending-3 se ré-exécutera)"
    ;;

  "ending-4"|"plan-ending-4")
    echo "❌ Échec : Validation structure (ending-4)"
    echo ""
    echo "Causes probables :"
    echo "  1. Fichiers critiques manquants (index.md, ai-kido.md)"
    echo "  2. Structure non conforme V1.3"
    echo "  3. Script validate-structure.sh échoué"
    echo ""
    echo "Solutions proposées :"
    echo "  - Vérifier : ls -la prompts/index.md prompts/hard_points/ai-kido.md"
    echo "  - Relancer validation : bash prompts/hard_points/system/maj/scripts/validate-structure.sh . --type MONO --version 1.3"
    echo "  - Restaurer depuis TARGET : cp \$TARGET/prompts/hard_points/ai-kido.md prompts/hard_points/"
    ;;

  "beginning"|"plan-beginning")
    echo "❌ Échec : Initialisation (plan-beginning)"
    echo ""
    echo "Causes probables :"
    echo "  1. Échec création backup vérification"
    echo "  2. Versions non détectables"
    echo "  3. Permissions backups/"
    echo ""
    echo "Solutions proposées :"
    echo "  - Créer répertoire : mkdir -p backups && chmod 755 backups"
    echo "  - Vérifier fichiers : ls -la prompts/hard_points/ai-kido.md"
    ;;

  *)
    echo "❌ Échec : Plan inconnu ou non spécifié ($FAILED_PLAN)"
    echo ""
    echo "Solutions génériques :"
    echo "  - Consulter les logs : cat prompts/spec/logs/phase-*.log"
    echo "  - Vérifier intégrité projet"
    echo "  - Restaurer backup : tar -xzf backups/aikido-verif-backup-*.tgz"
    ;;
esac

echo ""
