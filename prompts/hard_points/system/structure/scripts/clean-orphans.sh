#!/usr/bin/env bash

# AI-KIDO Index Orphan Cleaner V1.0
# Nettoie intelligemment les entrées orphelines de l'index
# Performance : ~5-10s pour 2600 fichiers (vs 20-30s via agent)

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INDEX_DIR="prompts/hard_points/system/structure/indices"
MASTER_INDEX="prompts/hard_points/system/structure/index.json"
PROJECT_ROOT="$(pwd)"

# Check prerequisites
if ! command -v jq &> /dev/null; then
    echo -e "${RED}✗ Error: jq is not installed${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

if [ ! -f "$MASTER_INDEX" ]; then
    echo -e "${YELLOW}ℹ️  Index non trouvé${NC}"
    echo "   Utilisez /reindex-projet pour créer l'index."
    exit 0
fi

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🧹 NETTOYAGE INTELLIGENT DE L'INDEX - DÉMARRAGE        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Extract all indexed paths from by-id batches
echo "⚙️  Extraction des fichiers indexés..."
INDEXED_DATA=$(mktemp)  # Format: hash_id|path
BATCH_COUNT=0

for batch in "$INDEX_DIR"/by-id/index-id-*.json; do
    if [ -f "$batch" ]; then
        # Extract hash_id and path from each file entry (skip if files is null)
        jq -r 'if .files then .files | to_entries[] | "\(.key)|\(.value.path)" else empty end' "$batch" >> "$INDEXED_DATA"
        ((BATCH_COUNT++))
    fi
done

TOTAL_INDEXED=$(wc -l < "$INDEXED_DATA" | tr -d ' ')
echo "✓ $TOTAL_INDEXED fichiers indexés ($BATCH_COUNT batches)"
echo ""

# Step 2: Check which files still exist
echo "⚙️  Vérification existence des fichiers..."
VALID_DATA=$(mktemp)    # hash_id|path for valid files
ORPHAN_DATA=$(mktemp)   # hash_id|path for orphans
ORPHAN_COUNT=0
VALID_COUNT=0

while IFS='|' read -r hash_id path; do
    # Remove leading slash if present
    path="${path#/}"

    if [ -e "$PROJECT_ROOT/$path" ]; then
        echo "$hash_id|$path" >> "$VALID_DATA"
        ((VALID_COUNT++))
    else
        echo "$hash_id|$path" >> "$ORPHAN_DATA"
        ((ORPHAN_COUNT++))
    fi
done < "$INDEXED_DATA"

echo "✓ Vérification terminée"
echo "  Fichiers valides : $VALID_COUNT"
echo "  Orphelins détectés : $ORPHAN_COUNT"
echo ""

# Step 3: Display orphans
if [ $ORPHAN_COUNT -gt 0 ]; then
    echo "📋 Exemples d'orphelins détectés :"
    head -n 5 "$ORPHAN_DATA" | while IFS='|' read -r hash_id orphan_path; do
        echo "  - $orphan_path"
    done
    if [ $ORPHAN_COUNT -gt 5 ]; then
        echo "  ... et $((ORPHAN_COUNT - 5)) autres"
    fi
    echo ""

    # Calculate percentage
    ORPHAN_PCT=$(awk "BEGIN {printf \"%.1f\", ($ORPHAN_COUNT / $TOTAL_INDEXED) * 100}")

    if (( $(echo "$ORPHAN_PCT > 10.0" | bc -l) )); then
        echo -e "${YELLOW}⚠️  ATTENTION : Beaucoup d'orphelins détectés ($ORPHAN_PCT%)${NC}"
        echo "   Recommandation : Utilisez /reindex-projet pour régénération complète"
        echo ""
    fi

    # Step 4: Clean orphans from by-id batches
    echo "⚙️  Nettoyage des entrées orphelines..."
    CLEANED_COUNT=0

    while IFS='|' read -r hash_id orphan_path; do
        # Determine batch file from first character of hash_id
        BATCH_PREFIX="${hash_id:0:1}"
        BATCH_FILE="$INDEX_DIR/by-id/index-id-$BATCH_PREFIX.json"

        if [ -f "$BATCH_FILE" ]; then
            # Remove the entry from the batch file using hash_id
            TMP_FILE=$(mktemp)
            jq "del(.files.\"$hash_id\")" "$BATCH_FILE" > "$TMP_FILE"
            mv "$TMP_FILE" "$BATCH_FILE"
            ((CLEANED_COUNT++))
        fi
    done < "$ORPHAN_DATA"

    echo "✓ $CLEANED_COUNT entrées supprimées"
    echo ""

    # Step 5: Update master index statistics
    echo "⚙️  Mise à jour du master index..."
    TMP_MASTER=$(mktemp)
    jq ".metadata.statistics.total_files = $VALID_COUNT | .metadata.last_check.timestamp = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" | .metadata.last_check.generator = \"clean-orphans-script\"" "$MASTER_INDEX" > "$TMP_MASTER"
    mv "$TMP_MASTER" "$MASTER_INDEX"
    echo "✓ Master index mis à jour"
    echo ""
fi

# Cleanup
rm -f "$INDEXED_DATA" "$VALID_DATA" "$ORPHAN_DATA"

# Final summary
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✓ NETTOYAGE INTELLIGENT TERMINÉ                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Statistiques :"
echo "  - Fichiers indexés : $TOTAL_INDEXED"
echo "  - Fichiers valides : $VALID_COUNT"
echo "  - Orphelins détectés : $ORPHAN_COUNT"
echo "  - Orphelins supprimés : ${CLEANED_COUNT:-0}"
echo ""

if [ $ORPHAN_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ Index parfaitement cohérent${NC}"
    echo "  Aucune action de nettoyage nécessaire."
elif (( $(echo "$ORPHAN_PCT > 10.0" | bc -l) )); then
    echo -e "${YELLOW}💡 RECOMMANDATION FORTE :${NC}"
    echo "   Lancez une réindexation complète : /reindex-projet"
else
    echo -e "${GREEN}✓ Index nettoyé avec succès${NC}"
    echo "  L'index est maintenant cohérent."
fi
echo ""

exit 0
