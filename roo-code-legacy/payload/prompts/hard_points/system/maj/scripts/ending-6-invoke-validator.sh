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
  echo "   Switching to manual validation (Plan ending-10)"
  echo "MANUAL"
  exit 0
fi

echo "✅ Agent-aikido-validator located"
echo ""
echo "📝 Preparing validation context..."
echo ""

VALIDATION_CONTEXT="/tmp/aikido/validation-context-$$.md"

cat > "$VALIDATION_CONTEXT" <<'VALIDATION'
# 🔍 VALIDATION FINALE AI-KIDO

You are **agent-aikido-validator**. Your mission is to validate the compliance of the Memory Bank after the update.

## Validation Rules

Check for EACH file:

1. **Taille** : ≤500 lignes (hard points), ≤1000 lignes (agents), ≤100 lignes (index)
2. **Frontmatter**: Present and valid (YAML or Markdown)
3. **Liens** : Bidirectionnels fonctionnels
4. **Structure**: Hierarchical headers (single H1)
5. **Compliance**: According to hard_points/ai-kido.md

## Action Attendue

Generate the validation report:
- `/tmp/aikido/validation-report.md` : Detailed report
- `/tmp/aikido/validation-summary.txt` : Summary (OK/KO + error count)

Run the validation NOW.
VALIDATION

echo "✅ Context created: $VALIDATION_CONTEXT"
echo ""
echo "⚡ LANCEMENT AGENT-AIKIDO-VALIDATOR..."
echo ""
echo "ℹ️  Le LLM doit :"
echo "   1. Read $VALIDATOR_AGENT"
echo "   2. Read $VALIDATION_CONTEXT"
echo "   3. Go through the critical files"
echo "   4. Generate validation report"
echo ""
echo "AGENT"
