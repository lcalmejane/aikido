#!/usr/bin/env bash
# ending-0-process-fusion.sh - Traiter fichiers selon mode fusion
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
echo "🔄 TRAITEMENT DES FICHIERS ($FUSION_MODE)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

PROCESSED=0
ERRORS=0

while IFS= read -r relative_file; do
  [ -z "$relative_file" ] && continue

  echo "───────────────────────────────────────────────────────────────"
  echo "📝 Fichier : $relative_file"
  echo ""

  TARGET_FILE="$TARGET/$relative_file"
  SOURCE_FILE="$SOURCE/$relative_file"

  if [ ! -f "$TARGET_FILE" ]; then
    echo "  ⚠️  Fichier absent dans TARGET, ignoré"
    continue
  fi

  case "$FUSION_MODE" in
    INTELLIGENT)
      echo "  🔀 Mode : Fusion intelligente (préparation contexte)"
      echo "  ⚠️  Agent-aikido-fusion doit être invoqué par LLM"
      echo "  📝 Fichiers : TARGET=$TARGET_FILE → SOURCE=$SOURCE_FILE"
      ;;

    REPLACE)
      echo "  ⚠️  Mode : Remplacement direct"
      if [ -f "$SOURCE_FILE" ]; then
        BACKUP_FILE="${SOURCE_FILE}.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$SOURCE_FILE" "$BACKUP_FILE"
        echo "  💾 Backup créé : $BACKUP_FILE"
      fi
      mkdir -p "$(dirname "$SOURCE_FILE")"
      cp "$TARGET_FILE" "$SOURCE_FILE"
      echo "  ✅ Fichier remplacé"
      ;;

    SKIP)
      echo "  ℹ️  Mode : Ignorer (conservation fichier local)"
      echo "  ✅ Fichier local conservé"
      ;;

    MANUAL_LATER)
      echo "  📝 Mode : Préparation fusion manuelle"
      MANUAL_DIR="/tmp/aikido/manual-fusion"
      mkdir -p "$MANUAL_DIR"
      SCRIPT_NAME="$(echo "$relative_file" | sed 's/[\/\.]/_/g')"
      MANUAL_SCRIPT="$MANUAL_DIR/fusion-${SCRIPT_NAME}.md"

      cat > "$MANUAL_SCRIPT" <<MANUAL
# Fusion Manuelle : $relative_file

## Fichiers

- TARGET : \`$TARGET_FILE\`
- SOURCE : \`$SOURCE_FILE\`

## Instructions

1. Comparer les deux fichiers
2. Appliquer formalisme TARGET + contexte SOURCE
3. Sauvegarder dans SOURCE

## TARGET

\`\`\`
$(cat "$TARGET_FILE")
\`\`\`

## SOURCE

\`\`\`
$([ -f "$SOURCE_FILE" ] && cat "$SOURCE_FILE" || echo "Nouveau fichier")
\`\`\`
MANUAL
      echo "  📝 Script créé : $MANUAL_SCRIPT"
      ;;
  esac

  ((PROCESSED++))
  echo ""

done < /tmp/aikido/diff_report.txt

echo "═══════════════════════════════════════════════════════════════"
echo "✅ Traitement terminé : $PROCESSED fichier(s) traité(s)"
[ $ERRORS -gt 0 ] && echo "⚠️  Erreurs : $ERRORS"
echo "═══════════════════════════════════════════════════════════════"
