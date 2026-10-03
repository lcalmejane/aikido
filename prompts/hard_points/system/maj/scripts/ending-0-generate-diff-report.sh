#!/usr/bin/env bash
# ending-0-generate-diff-report.sh - Generate TARGET vs SOURCE differences report
# Usage: ending-0-generate-diff-report.sh

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

echo "📊 Analyzing TARGET vs SOURCE differences..."

# Extract file paths from each JSON
jq -r '.by_path | keys[]' /tmp/aikido/maj_target.json | sort > /tmp/aikido/target_files.txt
jq -r '.by_path | keys[]' /tmp/aikido/maj_before.json | sort > /tmp/aikido/source_files.txt

# Added files (in TARGET but not in SOURCE)
comm -23 /tmp/aikido/target_files.txt /tmp/aikido/source_files.txt > /tmp/aikido/added_files.txt
ADDED_COUNT=$(wc -l < /tmp/aikido/added_files.txt | tr -d ' ')

# Modified files (present in both, but different)
comm -12 /tmp/aikido/target_files.txt /tmp/aikido/source_files.txt | while read -r file; do
  TARGET_SIZE=$(jq -r ".by_path[\"$file\"].size" /tmp/aikido/maj_target.json 2>/dev/null || echo "0")
  SOURCE_SIZE=$(jq -r ".by_path[\"$file\"].size" /tmp/aikido/maj_before.json 2>/dev/null || echo "0")

  if [ "$TARGET_SIZE" != "$SOURCE_SIZE" ]; then
    echo "$file"
  fi
done > /tmp/aikido/modified_files.txt
MODIFIED_COUNT=$(wc -l < /tmp/aikido/modified_files.txt | tr -d ' ')

# Merge into a single report
cat /tmp/aikido/added_files.txt /tmp/aikido/modified_files.txt | sort -u > /tmp/aikido/diff_report.txt
TOTAL_CHANGES=$(wc -l < /tmp/aikido/diff_report.txt | tr -d ' ')

echo ""
echo "📈 Summary of detected changes:"
echo "   Added files         : $ADDED_COUNT"
echo "   Modified files      : $MODIFIED_COUNT"
echo "   Total to merge      : $TOTAL_CHANGES"
echo ""
echo "✅ Report generated: /tmp/aikido/diff_report.txt"

# Export for later use
echo "$TOTAL_CHANGES"
