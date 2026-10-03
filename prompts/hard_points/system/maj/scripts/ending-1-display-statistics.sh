#!/usr/bin/env bash
# ending-1-display-statistics.sh - Display differential report statistics
# Usage: ending-1-display-statistics.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo ""
echo "📈 Analyzing the differential report..."

# Compter les changements
CHANGES_COUNT=$(jq 'keys | length' /tmp/aikido/maj_diff.json)

if [ "$CHANGES_COUNT" -eq 0 ]; then
  echo "   ℹ️  No change detected"
else
  echo "   🔄 $CHANGES_COUNT modified item(s)"

  # Details by type
  ADDED=$(jq '[.[] | select(.before == null)] | length' /tmp/aikido/maj_diff.json)
  REMOVED=$(jq '[.[] | select(.after == null)] | length' /tmp/aikido/maj_diff.json)
  MODIFIED=$(jq '[.[] | select(.before != null and .after != null)] | length' /tmp/aikido/maj_diff.json)

  echo ""
  echo "   Details:"
  echo "   - Added     : $ADDED"
  echo "   - Removed   : $REMOVED"
  echo "   - Modified  : $MODIFIED"
fi

echo ""

# Export for later use
echo "$CHANGES_COUNT $ADDED $REMOVED $MODIFIED"
