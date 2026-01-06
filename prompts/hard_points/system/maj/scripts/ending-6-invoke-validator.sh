#!/usr/bin/env bash
# ending-6-invoke-validator.sh - Invoquer agent-aikido-validator
# Usage: ending-6-invoke-validator.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo "═══════════════════════════════════════════════════════════════"
echo "🤖 INVOCATION AGENT-AIKIDO-VALIDATOR"
echo "═══════════════════════════════════════════════════════════════"
echo ""

VALIDATOR_AGENT="$SOURCE_DIR/prompts/hard_points/agents/agent-aikido-validator.md"

if [ ! -f "$VALIDATOR_AGENT" ]; then
  echo "⚠️  Agent-aikido-validator introuvable : $VALIDATOR_AGENT"
  echo "   Validation automatique impossible"
  echo "   Passage à validation manuelle (Plan ending-10)"
  echo "MANUAL"
  exit 0
fi

echo "✅ Agent-aikido-validator localisé"
echo ""
echo "📝 Préparation contexte de validation..."
echo ""

VALIDATION_CONTEXT="/tmp/aikido/validation-context-$$.md"

cat > "$VALIDATION_CONTEXT" <<'VALIDATION'
# 🔍 VALIDATION FINALE AI-KIDO

Vous êtes l'**agent-aikido-validator**. Votre mission est de valider la conformité de la Memory Bank après mise à jour.

## Règles de Validation

Vérifier pour CHAQUE fichier :

1. **Taille** : ≤500 lignes (hard points), ≤1000 lignes (agents), ≤100 lignes (index)
2. **Frontmatter** : Présent et valide (YAML ou Markdown)
3. **Liens** : Bidirectionnels fonctionnels
4. **Structure** : Headers hiérarchiques (H1 unique)
5. **Conformité** : Selon hard_points/ai-kido.md

## Action Attendue

Générer rapport de validation :
- `/tmp/aikido/validation-report.md` : Rapport détaillé
- `/tmp/aikido/validation-summary.txt` : Résumé (OK/KO + nombre erreurs)

Exécuter la validation MAINTENANT.
VALIDATION

echo "✅ Contexte créé : $VALIDATION_CONTEXT"
echo ""
echo "⚡ LANCEMENT AGENT-AIKIDO-VALIDATOR..."
echo ""
echo "ℹ️  Le LLM doit :"
echo "   1. Lire $VALIDATOR_AGENT"
echo "   2. Lire $VALIDATION_CONTEXT"
echo "   3. Parcourir les fichiers critiques"
echo "   4. Générer rapport de validation"
echo ""
echo "AGENT"
