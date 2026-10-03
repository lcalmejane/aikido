#!/usr/bin/env bash
# ending-0-ask-llm-capability.sh - Ask the user about their LLM capability
# Usage: ending-0-ask-llm-capability.sh
#
# Output (last line of stdout): INTELLIGENT | REPLACE | SKIP | MANUAL_LATER

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

cat <<PROMPT
═══════════════════════════════════════════════════════════════
⚠️  PREREQUISITE CHECK
═══════════════════════════════════════════════════════════════

This mode requires a powerful LLM (≥ Sonnet 4) to work correctly.

With a less powerful model, you risk:
  - Incomplete or incorrect merge
  - Loss of project context
  - Non-compliance with AI-KIDO rules
  - Corruption of critical files

Do you have an LLM ≥ Sonnet 4? (yes/no):
PROMPT

read -r HAS_POWERFUL_LLM

# Accept English and French affirmative answers (case-insensitive)
case "$(printf '%s' "$HAS_POWERFUL_LLM" | tr '[:upper:]' '[:lower:]')" in
  yes|y|oui|o) POWERFUL=true ;;
  *) POWERFUL=false ;;
esac

if [ "$POWERFUL" != "true" ]; then
  echo ""
  echo "❌ Intelligent merge is not available without a powerful LLM"
  echo ""
  echo "Alternative options:"
  echo "  1. REPLACE - Overwrite local files with the TARGET version"
  echo "  2. SKIP    - Keep local files unchanged"
  echo "  3. MANUAL  - Create a merge script for later processing"
  echo ""
  echo "Recommendation: choose MANUAL and perform the merge later"
  echo "                with a suitable LLM"
  echo ""

  echo "What do you want to do? (1=REPLACE / 2=SKIP / 3=MANUAL):"
  read -r FALLBACK_CHOICE

  case "$FALLBACK_CHOICE" in
    1) echo "REPLACE" ;;
    2) echo "SKIP" ;;
    3) echo "MANUAL_LATER" ;;
    *) echo "SKIP" ;;
  esac
else
  echo ""
  echo "✅ Powerful LLM confirmation received"
  echo "   Proceeding with intelligent merge..."
  echo ""
  echo "INTELLIGENT"
fi
