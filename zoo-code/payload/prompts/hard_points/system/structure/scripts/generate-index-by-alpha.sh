#!/bin/bash

# generate-index-by-alpha.sh - by-alphabetical index generation (ID references only)
# Version 3.1 - Hash-based ID normalization

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="prompts/hard_points/system/structure/indices/by-alphabetical"
BY_ID_DIR="prompts/hard_points/system/structure/indices/by-id"
BATCH_SIZE=1000
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

# Source utilities
source "$SCRIPT_DIR/lib/hash-utils.sh"

# Create output directory
mkdir -p "$PROJECT_ROOT/$OUTPUT_DIR"

echo "Generating by-alphabetical index (ID references only)..."

cd "$PROJECT_ROOT"

if [[ ! -d "$BY_ID_DIR" ]]; then
    echo "Error: by-id index not found. Run generate-index-by-id.sh first." >&2
    exit 1
fi

# Create temp file with name + ID
temp_file=$(mktemp)

# Extract name + ID from by-id batches
for batch_file in "$BY_ID_DIR"/index-id-*.json; do
    jq -r '.files | to_entries[] | "\(.value.name)|\(.key)"' "$batch_file" >> "$temp_file"
done

# Sort alphabetically by name and group homonyms with awk (bash 3.x compatible)
grouped_file=$(mktemp)

# Grouper par name : name|id1,id2,id3
awk -F'|' '
{
    name = $1
    id = $2
    if (name in ids) {
        ids[name] = ids[name] "," id
    } else {
        ids[name] = id
        names[++idx] = name
    }
}
END {
    for (i = 1; i <= idx; i++) {
        name = names[i]
        print name "|" ids[name]
    }
}
' "$temp_file" | sort -t'|' -k1,1 > "$grouped_file"

# Compter statistiques
total_names=$(wc -l < "$temp_file" | tr -d ' ')
unique_names=$(wc -l < "$grouped_file" | tr -d ' ')

rm "$temp_file"

echo "  Total files: $total_names"
echo "  Unique names: $unique_names"
echo "  Homonyms: $((total_names - unique_names))"
echo ""

# Define alphabetical ranges (balanced for ~1000 entries/batch)
# Simple strategy: split the alphabet into balanced ranges
# For 5000 files: a-d, e-m, n-z (3 batches)

# Determine the number of batches needed
num_batches=$(( (unique_names + BATCH_SIZE - 1) / BATCH_SIZE ))
echo "  Creating $num_batches batches..."
echo ""

# Create batches
batch_num=0
current_count=0
first_char=""
last_char=""
current_batch_file=""

while IFS='|' read -r name ids; do
    # New batch if needed
    if [[ $(( current_count % BATCH_SIZE )) -eq 0 ]]; then
        # Close previous batch
        if [[ $batch_num -gt 0 ]]; then
            echo "  }" >> "$current_batch_file"
            echo "}" >> "$current_batch_file"

            # Update metadata with actual range (bash 3.x compatible)
            range_start=$(echo "$first_char" | tr '[:upper:]' '[:lower:]')
            range_end=$(echo "$last_char" | tr '[:upper:]' '[:lower:]')
            sed -i.bak "s/\"range\": \[\"?\", \"?\"\]/\"range\": [\"$range_start\", \"$range_end\"]/" "$current_batch_file"
            sed -i.bak "s/\"count\": 0/\"count\": $current_count/" "$current_batch_file"
            rm "${current_batch_file}.bak" 2>/dev/null || true
        fi

        # Ouvrir nouveau batch
        first_char="${name:0:1}"
        batch_file_name="index-alpha-${batch_num}.json"
        current_batch_file="$PROJECT_ROOT/$OUTPUT_DIR/$batch_file_name"

        echo "  Generating $batch_file_name (starting with '$first_char')..."

        cat > "$current_batch_file" << EOF
{
  "metadata": {
    "batch_id": "alpha-${batch_num}",
    "range": ["?", "?"],
    "count": 0,
    "generated": "$TIMESTAMP_ISO"
  },
  "files": {
EOF

        batch_num=$((batch_num + 1))
        current_count=0
    fi

    # Write name → [IDs]
    IFS=',' read -ra id_array <<< "$ids"

    if [[ $current_count -eq 0 ]]; then
        # First entry of the batch (no comma)
        if [[ ${#id_array[@]} -eq 1 ]]; then
            echo "    \"$(json_escape "$name")\": [\"${id_array[0]}\"]" >> "$current_batch_file"
        else
            echo "    \"$(json_escape "$name")\": [$(printf '\"%s\",' "${id_array[@]}" | sed 's/,$//')]" >> "$current_batch_file"
        fi
    else
        # Following entries (with comma)
        if [[ ${#id_array[@]} -eq 1 ]]; then
            echo "    ,\"$(json_escape "$name")\": [\"${id_array[0]}\"]" >> "$current_batch_file"
        else
            echo "    ,\"$(json_escape "$name")\": [$(printf '\"%s\",' "${id_array[@]}" | sed 's/,$//')]" >> "$current_batch_file"
        fi
    fi

    last_char="${name:0:1}"
    current_count=$((current_count + 1))
done < "$grouped_file"

rm "$grouped_file"

# Fermer dernier batch
if [[ $current_count -gt 0 ]]; then
    echo "  }" >> "$current_batch_file"
    echo "}" >> "$current_batch_file"

    # Update metadata (bash 3.x compatible)
    range_start=$(echo "$first_char" | tr '[:upper:]' '[:lower:]')
    range_end=$(echo "$last_char" | tr '[:upper:]' '[:lower:]')
    sed -i.bak "s/\"range\": \[\"?\", \"?\"\]/\"range\": [\"$range_start\", \"$range_end\"]/" "$current_batch_file"
    sed -i.bak "s/\"count\": 0/\"count\": $current_count/" "$current_batch_file"
    rm "${current_batch_file}.bak" 2>/dev/null || true
fi

echo ""
echo "✅ by-alphabetical index generated successfully"
echo "   Total files: $total_names"
echo "   Unique names: $unique_names"
echo "   Homonyms: $((total_names - unique_names))"
echo "   Batches: $num_batches"
echo "   Output: $OUTPUT_DIR/"
echo "   Format: name → [IDs] (refs only, ~20 bytes per file)"
