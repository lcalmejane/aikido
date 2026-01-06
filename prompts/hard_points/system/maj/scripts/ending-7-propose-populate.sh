#!/usr/bin/env bash
# ending-7-propose-populate.sh - Proposer peuplement gaps
# Usage: ending-7-propose-populate.sh <source_dir> <missing_dirs_count> <missing_files_count>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"
MISSING_DIRS_COUNT="${2:-0}"
MISSING_FILES_COUNT="${3:-0}"

if [ "$MISSING_DIRS_COUNT" -eq 0 ] && [ "$MISSING_FILES_COUNT" -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════════════"
  echo "✅ AUCUN GAP DÉTECTÉ"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "   La Memory Bank est complète"
  echo "   Aucun peuplement nécessaire"
  echo ""
  exit 0
fi

echo "═══════════════════════════════════════════════════════════════"
echo "💡 PROPOSITION PEUPLEMENT AUTOMATIQUE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

POPULATE_AGENT="$SOURCE_DIR/prompts/hard_points/agents/agent-aikido-bank-populate.md"

if [ ! -f "$POPULATE_AGENT" ]; then
  echo "⚠️  Agent-aikido-bank-populate introuvable : $POPULATE_AGENT"
  echo "   Peuplement automatique impossible"
  echo ""
  echo "📝 Recommandations manuelles : voir gaps détectés ci-dessus"
  echo ""
  exit 0
fi

echo "✅ Agent-aikido-bank-populate disponible"
echo ""
echo "📝 Préparation contexte de peuplement..."

POPULATE_CONTEXT="/tmp/aikido/populate-context-$$.md"

cat > "$POPULATE_CONTEXT" <<'POPULATE'
# 🌱 PEUPLEMENT MEMORY BANK AI-KIDO

Vous êtes l'**agent-aikido-bank-populate**. Votre mission est de peupler les gaps détectés dans la Memory Bank.

## Mission

1. **Créer répertoires manquants** avec permissions 755
2. **Générer fichiers index.md** pour chaque répertoire
3. **Créer listes** (agents_list.md, commands_list.md, skills_list.md) si manquantes
4. **Peupler avec contenu minimal** conforme AI-KIDO

## Règles

- Conformité strict AI-KIDO (≤500 lignes, frontmatter, liens)
- Templates depuis prompts/hard_points/
- Pas de duplication

## Action

Exécuter le peuplement MAINTENANT (création uniquement, pas de modification fichiers existants).
POPULATE

echo "✅ Contexte créé : $POPULATE_CONTEXT"
echo ""
echo "⚡ Pour exécuter le peuplement :"
echo "   Le LLM doit :"
echo "   1. Lire $POPULATE_AGENT"
echo "   2. Lire $POPULATE_CONTEXT"
echo "   3. Créer répertoires/fichiers manquants"
echo "   4. Générer contenu conforme"
echo ""
echo "   OU exécuter manuellement :"
echo "   /bank-populate --gaps-only"
echo ""
