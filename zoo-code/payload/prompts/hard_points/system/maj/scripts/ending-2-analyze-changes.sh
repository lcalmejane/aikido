#!/usr/bin/env bash
# ending-2-analyze-changes.sh - Analyze and categorize changes
# Usage: ending-2-analyze-changes.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "═══════════════════════════════════════════════════════════════"
echo "📈 STATISTIQUES DES CHANGEMENTS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

TOTAL_CHANGES=$(jq 'keys | length' /tmp/aikido/maj_diff.json)

if [ "$TOTAL_CHANGES" -eq 0 ]; then
  echo "ℹ️  No change detected in the report"
  echo ""
  exit 0
fi

echo "🔄 Total modified items: $TOTAL_CHANGES"
echo ""

# Count by category
ADDED=$(jq '[.[] | select(.before == null)] | length' /tmp/aikido/maj_diff.json)
REMOVED=$(jq '[.[] | select(.after == null)] | length' /tmp/aikido/maj_diff.json)
MODIFIED=$(jq '[.[] | select(.before != null and .after != null)] | length' /tmp/aikido/maj_diff.json)

echo "📊 Breakdown:"
echo "   ✨ Added files   : $ADDED"
echo "   🗑️  Removed files: $REMOVED"
echo "   📝 Modified files : $MODIFIED"
echo ""

# List if requested
if [ "${1:-}" = "--list" ]; then
  [ "$ADDED" -gt 0 ] && {
    echo "───────────────────────────────────────────────────────────────"
    echo "✨ ADDED FILES ($ADDED)"
    echo "───────────────────────────────────────────────────────────────"
    jq -r 'to_entries[] | select(.value.before == null) | "  + \(.key)"' /tmp/aikido/maj_diff.json
    echo ""
  }

  [ "$REMOVED" -gt 0 ] && {
    echo "───────────────────────────────────────────────────────────────"
    echo "🗑️  REMOVED FILES ($REMOVED)"
    echo "───────────────────────────────────────────────────────────────"
    jq -r 'to_entries[] | select(.value.after == null) | "  - \(.key)"' /tmp/aikido/maj_diff.json
    echo ""
  }

  [ "$MODIFIED" -gt 0 ] && {
    echo "───────────────────────────────────────────────────────────────"
    echo "📝 MODIFIED FILES ($MODIFIED)"
    echo "───────────────────────────────────────────────────────────────"
    jq -r 'to_entries[] | select(.value.before != null and .value.after != null) | "  ~ \(.key)"' /tmp/aikido/maj_diff.json
    echo ""
  }
fi

echo "$TOTAL_CHANGES $ADDED $REMOVED $MODIFIED"
