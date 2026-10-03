#!/usr/bin/env bash
# ending-0-process-fusion.sh - Process files according to merge mode
# Usage: ending-0-process-fusion.sh <source_dir> <target_dir> <fusion_mode>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE="${1:-.}"
TARGET="${2:-}"
FUSION_MODE="${3:-INTELLIGENT}"

if [ -z "$TARGET" ]; then
  echo "Usage: $(basename "$0") <source_dir> <target_dir> <fusion_mode>" >&2
  exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "🔄 FILE PROCESSING ($FUSION_MODE)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

PROCESSED=0
ERRORS=0

while IFS= read -r relative_file; do
  [ -z "$relative_file" ] && continue

  echo "───────────────────────────────────────────────────────────────"
  echo "📝 File: $relative_file"
  echo ""

  TARGET_FILE="$TARGET/$relative_file"
  SOURCE_FILE="$SOURCE/$relative_file"

  if [ ! -f "$TARGET_FILE" ]; then
    echo "  ⚠️  File missing in TARGET, skipped"
    continue
  fi

  case "$FUSION_MODE" in
    INTELLIGENT)
      echo "  🔀 Mode: Intelligent merge (context preparation)"
      echo "  ⚠️  Agent-aikido-fusion must be invoked by the LLM"
      echo "  📝 Files: TARGET=$TARGET_FILE → SOURCE=$SOURCE_FILE"
      ;;

    REPLACE)
      echo "  ⚠️  Mode: Direct replacement"
      if [ -f "$SOURCE_FILE" ]; then
        BACKUP_FILE="${SOURCE_FILE}.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$SOURCE_FILE" "$BACKUP_FILE"
        echo "  💾 Backup created: $BACKUP_FILE"
      fi
      mkdir -p "$(dirname "$SOURCE_FILE")"
      cp "$TARGET_FILE" "$SOURCE_FILE"
      echo "  ✅ File replaced"
      ;;

    SKIP)
      echo "  ℹ️  Mode: Skip (keep local file)"
      echo "  ✅ Local file kept"
      ;;

    MANUAL_LATER)
      echo "  📝 Mode: Manual merge preparation"
      MANUAL_DIR="/tmp/aikido/manual-fusion"
      mkdir -p "$MANUAL_DIR"
      SCRIPT_NAME="$(echo "$relative_file" | sed 's/[\/\.]/_/g')"
      MANUAL_SCRIPT="$MANUAL_DIR/fusion-${SCRIPT_NAME}.md"

      cat > "$MANUAL_SCRIPT" <<MANUAL
# Manual Merge: $relative_file

## Files

- TARGET : \`$TARGET_FILE\`
- SOURCE : \`$SOURCE_FILE\`

## Instructions

1. Compare the two files
2. Apply TARGET formalism + SOURCE context
3. Save into SOURCE

## TARGET

\`\`\`
$(cat "$TARGET_FILE")
\`\`\`

## SOURCE

\`\`\`
$([ -f "$SOURCE_FILE" ] && cat "$SOURCE_FILE" || echo "New file")
\`\`\`
MANUAL
      echo "  📝 Script created: $MANUAL_SCRIPT"
      ;;
  esac

  ((PROCESSED++))
  echo ""

done < /tmp/aikido/diff_report.txt

echo "═══════════════════════════════════════════════════════════════"
echo "✅ Processing complete: $PROCESSED file(s) processed"
[ $ERRORS -gt 0 ] && echo "⚠️  Errors: $ERRORS"
echo "═══════════════════════════════════════════════════════════════"
