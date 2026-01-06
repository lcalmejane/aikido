#!/bin/bash

# generate-index-by-type.sh - Génération index by-type (références ID uniquement)
# Version 3.1 - Hash-based ID normalization

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="prompts/hard_points/system/structure/indices/by-type"
BY_ID_DIR="prompts/hard_points/system/structure/indices/by-id"
MAX_IDS_PER_BATCH=1000
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

# Source utilities
source "$SCRIPT_DIR/lib/hash-utils.sh"

# Créer répertoire output
mkdir -p "$PROJECT_ROOT/$OUTPUT_DIR"

echo "Generating by-type index (ID references only)..."

cd "$PROJECT_ROOT"

if [[ ! -d "$BY_ID_DIR" ]]; then
    echo "Error: by-id index not found. Run generate-index-by-id.sh first." >&2
    exit 1
fi

# Créer fichier temporaire avec type + ID
temp_file=$(mktemp)

# Extraire type + ID depuis by-id batches
for batch_file in "$BY_ID_DIR"/index-id-*.json; do
    jq -r '.files | to_entries[] | "\(.value.type)|\(.key)"' "$batch_file" >> "$temp_file"
done

# Trier par type et grouper avec awk (bash 3.x compatible)
grouped_file=$(mktemp)

# Grouper par type : type|id1,id2,id3
awk -F'|' '
{
    type = $1
    id = $2
    if (type in ids) {
        ids[type] = ids[type] "," id
    } else {
        ids[type] = id
        types[++idx] = type
    }
}
END {
    for (i = 1; i <= idx; i++) {
        type = types[i]
        print type "|" ids[type]
    }
}
' "$temp_file" | sort -t'|' -k1,1 > "$grouped_file"

# Compter statistiques (avant suppression)
total_files=$(wc -l < "$temp_file" | tr -d ' ')
rm "$temp_file"

total_types=$(wc -l < "$grouped_file" | tr -d ' ')

echo "  Total files: $total_files"
echo "  Unique types: $total_types"
echo ""

# Générer fichiers par type (split si >1000 IDs)
echo "  Generating type index files..."

while IFS='|' read -r type ids; do
    IFS=',' read -ra id_array <<< "$ids"
    count=${#id_array[@]}

    # Si type a >1000 fichiers, créer plusieurs batches
    if (( count > MAX_IDS_PER_BATCH )); then
        num_type_batches=$(( (count + MAX_IDS_PER_BATCH - 1) / MAX_IDS_PER_BATCH ))

        echo "    Type '$type': $count files → $num_type_batches batches"

        for (( batch=0; batch<num_type_batches; batch++ )); do
            start=$((batch * MAX_IDS_PER_BATCH))
            end=$((start + MAX_IDS_PER_BATCH))
            (( end > count )) && end=$count

            batch_ids=("${id_array[@]:$start:$((end - start))}")
            batch_file_name="index-type-${type}-$(printf '%03d' $batch).json"
            batch_file="$PROJECT_ROOT/$OUTPUT_DIR/$batch_file_name"

            cat > "$batch_file" << EOF
{
  "metadata": {
    "batch_id": "type-${type}-$(printf '%03d' $batch)",
    "type": "$type",
    "count": ${#batch_ids[@]},
    "generated": "$TIMESTAMP_ISO"
  },
  "ids": [
$(printf '    "%s",\n' "${batch_ids[@]}" | sed '$ s/,$//')
  ]
}
EOF
        done
    else
        # Type a ≤1000 fichiers, un seul fichier index
        batch_file_name="index-type-${type}.json"
        batch_file="$PROJECT_ROOT/$OUTPUT_DIR/$batch_file_name"

        echo "    Type '$type': $count files → $batch_file_name"

        cat > "$batch_file" << EOF
{
  "metadata": {
    "batch_id": "type-${type}",
    "type": "$type",
    "count": $count,
    "generated": "$TIMESTAMP_ISO"
  },
  "ids": [
$(printf '    "%s",\n' "${id_array[@]}" | sed '$ s/,$//')
  ]
}
EOF
    fi
done < "$grouped_file"

rm "$grouped_file"

echo ""
echo "✅ by-type index generated successfully"
echo "   Total files: $total_files"
echo "   Unique types: $total_types"
echo "   Output: $OUTPUT_DIR/"
echo "   Format: type → [IDs] (refs only, split if >$MAX_IDS_PER_BATCH)"
