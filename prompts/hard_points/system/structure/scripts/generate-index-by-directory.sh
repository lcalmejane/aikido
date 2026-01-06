#!/bin/bash

# generate-index-by-directory.sh - Génération index by-directory (références ID uniquement)
# Version 3.1 - Hash-based ID normalization

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="prompts/hard_points/system/structure/indices/by-directory"
BY_ID_DIR="prompts/hard_points/system/structure/indices/by-id"
MAX_LINES_PER_BATCH=1000
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

# Source utilities
source "$SCRIPT_DIR/lib/hash-utils.sh"

# Créer répertoire output
mkdir -p "$PROJECT_ROOT/$OUTPUT_DIR"

echo "Generating by-directory index (ID references only)..."

cd "$PROJECT_ROOT"

if [[ ! -d "$BY_ID_DIR" ]]; then
    echo "Error: by-id index not found. Run generate-index-by-id.sh first." >&2
    exit 1
fi

# Créer fichier temporaire avec directory + name + ID
temp_file=$(mktemp)

# Extraire path + ID depuis by-id batches, puis calculer directory
for batch_file in "$BY_ID_DIR"/index-id-*.json; do
    jq -r '.files | to_entries[] | "\(.value.path)|\(.key)"' "$batch_file" | while IFS='|' read -r path file_id; do
        dir=$(dirname "$path")
        name=$(basename "$path")
        echo "$dir|$name|$file_id" >> "$temp_file"
    done
done

# Trier par directory et grouper avec awk (bash 3.x compatible)
grouped_file=$(mktemp)

# Grouper par directory : dir|id1,id2,id3
awk -F'|' '
{
    dir = $1
    name = $2
    id = $3
    if (dir in ids) {
        ids[dir] = ids[dir] "," id
        names[dir] = names[dir] "," name
    } else {
        ids[dir] = id
        names[dir] = name
        dirs[++idx] = dir
    }
}
END {
    for (i = 1; i <= idx; i++) {
        dir = dirs[i]
        print dir "|" ids[dir] "|" names[dir]
    }
}
' "$temp_file" | sort -t'|' -k1,1 > "$grouped_file"

# Compter statistiques
total_files=$(wc -l < "$temp_file" | tr -d ' ')
total_dirs=$(wc -l < "$grouped_file" | tr -d ' ')

rm "$temp_file"

echo "  Total files: $total_files"
echo "  Unique directories: $total_dirs"
echo ""

# Générer batches (découpage si >1000 lignes JSON par batch)
batch_num=0
current_lines=0
current_batch_file=""
dirs_in_batch=0

while IFS='|' read -r dir ids names; do
    IFS=',' read -ra id_array <<< "$ids"
    files_count=${#id_array[@]}

    # Estimer nombre de lignes JSON pour ce directory
    # ~3-5 lignes par directory selon nombre fichiers
    estimated_lines=$((3 + files_count / 10))

    # Nouveau batch si dépassement
    if (( current_lines + estimated_lines > MAX_LINES_PER_BATCH && current_lines > 0 )); then
        # Fermer batch précédent
        echo "  }" >> "$current_batch_file"
        echo "}" >> "$current_batch_file"

        # Update count
        sed -i.bak "s/\"directories_count\": 0/\"directories_count\": $dirs_in_batch/" "$current_batch_file"
        rm "${current_batch_file}.bak" 2>/dev/null || true

        # Reset
        current_lines=0
        dirs_in_batch=0
        ((batch_num++))
    fi

    # Ouvrir nouveau batch si nécessaire
    if (( current_lines == 0 )); then
        batch_file_name=$(printf "index-dir-%03d.json" $batch_num)
        current_batch_file="$PROJECT_ROOT/$OUTPUT_DIR/$batch_file_name"

        echo "  Generating $batch_file_name..."

        cat > "$current_batch_file" << EOF
{
  "metadata": {
    "batch_id": "dir-$(printf '%03d' $batch_num)",
    "offset": $((batch_num * 100)),
    "directories_count": 0,
    "generated": "$TIMESTAMP_ISO"
  },
  "directories": {
EOF
    fi

    # Écrire directory → {ids: [...]}
    if (( dirs_in_batch == 0 )); then
        # Première entrée (pas de virgule)
        echo "    \"$(json_escape "$dir")\": {" >> "$current_batch_file"
    else
        # Entrées suivantes (avec virgule)
        echo "    ,\"$(json_escape "$dir")\": {" >> "$current_batch_file"
    fi

    echo "      \"files_count\": $files_count," >> "$current_batch_file"
    echo "      \"ids\": [$(printf '\"%s\",' "${id_array[@]}" | sed 's/,$//')]" >> "$current_batch_file"
    echo "    }" >> "$current_batch_file"

    ((dirs_in_batch++))
    current_lines=$((current_lines + estimated_lines))
done < "$grouped_file"

rm "$grouped_file"

# Fermer dernier batch
if (( current_lines > 0 )); then
    echo "  }" >> "$current_batch_file"
    echo "}" >> "$current_batch_file"

    # Update count
    sed -i.bak "s/\"directories_count\": 0/\"directories_count\": $dirs_in_batch/" "$current_batch_file"
    rm "${current_batch_file}.bak" 2>/dev/null || true
fi

num_batches=$((batch_num + 1))

echo ""
echo "✅ by-directory index generated successfully"
echo "   Total files: $total_files"
echo "   Unique directories: $total_dirs"
echo "   Batches: $num_batches"
echo "   Output: $OUTPUT_DIR/"
echo "   Format: directory → {ids: [...]} (refs only)"
