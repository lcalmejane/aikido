#!/usr/bin/env bash
# ending-0-ask-llm-capability.sh - Demander capacité LLM utilisateur
# Usage: ending-0-ask-llm-capability.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

cat <<PROMPT
═══════════════════════════════════════════════════════════════
⚠️  VÉRIFICATION PRÉREQUIS
═══════════════════════════════════════════════════════════════

Ce mode nécessite un LLM puissant (≥ Sonnet 4) pour fonctionner correctement.

Avec un modèle moins puissant, vous risquez :
  - Fusion incomplète ou incorrecte
  - Perte de contexte projet
  - Non-respect des règles AI-KIDO
  - Corruption de fichiers critiques

Disposez-vous d'un LLM ≥ Sonnet 4 ? (oui/non) :
PROMPT

read -r HAS_POWERFUL_LLM

if [ "$HAS_POWERFUL_LLM" != "oui" ]; then
  echo ""
  echo "❌ Fusion intelligente non disponible sans LLM puissant"
  echo ""
  echo "Options alternatives :"
  echo "  1. REMPLACER - Écrase les fichiers locaux par la version TARGET"
  echo "  2. IGNORER   - Conserve les fichiers locaux inchangés"
  echo "  3. MANUEL    - Créer script de fusion pour traitement ultérieur"
  echo ""
  echo "Recommandation : Choisir MANUEL et effectuer fusion ultérieurement"
  echo "                 avec un LLM approprié"
  echo ""

  echo "Que souhaitez-vous faire ? (1=REMPLACER / 2=IGNORER / 3=MANUEL) :"
  read -r FALLBACK_CHOICE

  case "$FALLBACK_CHOICE" in
    1) echo "REPLACE" ;;
    2) echo "SKIP" ;;
    3) echo "MANUAL_LATER" ;;
    *) echo "SKIP" ;;
  esac
else
  echo ""
  echo "✅ Confirmation LLM puissant reçue"
  echo "   Poursuite avec fusion intelligente..."
  echo ""
  echo "INTELLIGENT"
fi
