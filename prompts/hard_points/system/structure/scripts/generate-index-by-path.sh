#!/bin/bash

# generate-index-by-path.sh - Génération index by-path (références ID uniquement)
# Version 3.1 - Hash-based ID normalization

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="prompts/hard_points/system/structure/indices/by-path"
BY_ID_DIR="prompts/hard_points/system/structure/indices/by-id"
BATCH_SIZE=1000
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

# Source utilities
source "$SCRIPT_DIR/lib/hash-utils.sh"

# Créer répertoire output
mkdir -p "$PROJECT_ROOT/$OUTPUT_DIR"

echo "Generating by-path index (ID references only)..."

# Charger tous les IDs depuis by-id batches
cd "$PROJECT_ROOT"

if [[ ! -d "$BY_ID_DIR" ]]; then
    echo "Error: by-id index not found. Run generate-index-by-id.sh first." >&2
    exit 1
fi

# Créer fichier temporaire avec tous les paths + IDs
temp_file=$(mktemp)

# Extraire tous les paths depuis les batches by-id
for batch_file in "$BY_ID_DIR"/index-id-*.json; do
    # Extraire path + ID avec jq
    jq -r '.files | to_entries[] | "\(.value.path)|\(.key)"' "$batch_file" >> "$temp_file"
done

# Trier par path
sort "$temp_file" -o "$temp_file"

# Compter total
total_paths=$(wc -l < "$temp_file")
num_batches=$(( (total_paths + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "  Total paths: $total_paths"
echo "  Batch size: $BATCH_SIZE"
echo "  Number of batches: $num_batches"
echo ""

# Générer batches by-path
batch_num=0
current_count=0

while IFS='|' read -r path file_id; do
    # Nouveau batch si nécessaire
    if [[ $(( current_count % BATCH_SIZE )) -eq 0 ]]; then
        # Fermer batch précédent
        if [[ $batch_num -gt 0 ]]; then
            echo "  }" >> "$current_batch_file"
            echo "}" >> "$current_batch_file"
        fi

        # Ouvrir nouveau batch
        batch_file_name=$(printf "index-path-%03d.json" $batch_num)
        current_batch_file="$PROJECT_ROOT/$OUTPUT_DIR/$batch_file_name"

        echo "  Generating $batch_file_name..."

        cat > "$current_batch_file" << EOF
{
  "metadata": {
    "batch_id": "path-$(printf '%03d' $batch_num)",
    "offset": $((batch_num * BATCH_SIZE)),
    "count": 0,
    "generated": "$TIMESTAMP_ISO"
  },
  "paths": {
EOF

        batch_num=$((batch_num + 1))
    fi

    # Écrire path → ID (format ultra compact)
    if [[ $(( current_count % BATCH_SIZE )) -eq 0 ]]; then
        # Première entrée du batch (pas de virgule avant)
        echo "    \"$(json_escape "$path")\": \"$file_id\"" >> "$current_batch_file"
    else
        echo "    ,\"$(json_escape "$path")\": \"$file_id\"" >> "$current_batch_file"
    fi

    current_count=$((current_count + 1))
done < "$temp_file"

# Fermer dernier batch
if (( current_count > 0 )); then
    # Mise à jour count dans metadata (réécriture fichier)
    last_batch_count=$(( current_count % BATCH_SIZE ))
    [[ $last_batch_count -eq 0 ]] && last_batch_count=$BATCH_SIZE

    echo "  }" >> "$current_batch_file"
    echo "}" >> "$current_batch_file"

    # Update count dans metadata (sed)
    sed -i.bak "s/\"count\": 0/\"count\": $last_batch_count/" "$current_batch_file"
    rm "${current_batch_file}.bak" 2>/dev/null || true
fi

# Cleanup
rm "$temp_file"

echo ""
echo "✅ by-path index generated successfully"
echo "   Total paths: $total_paths"
echo "   Batches: $num_batches"
echo "   Output: $OUTPUT_DIR/"
echo "   Format: path → ID (refs only, ~15 bytes per file)"
