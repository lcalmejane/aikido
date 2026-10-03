#!/bin/bash

# generate-index-master.sh - master index.json generation V3.1
# Version 3.1 - Hash-based ID normalization

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INDICES_DIR="prompts/hard_points/system/structure/indices"
OUTPUT_FILE="prompts/hard_points/system/structure/index.json"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

# Source utilities
source "$SCRIPT_DIR/lib/hash-utils.sh"

echo "Generating master index.json V3.1..."

cd "$PROJECT_ROOT"

if [[ ! -d "$INDICES_DIR" ]]; then
    echo "Error: indices directory not found. Run index generation scripts first." >&2
    exit 1
fi

# ============================================================================
# STATISTIQUES GLOBALES
# ============================================================================

echo "  Collecting global statistics..."

total_files=0
total_dirs=0
total_lines=0
index_files_count=0

# Count files and lines from by-id
if [[ -d "$INDICES_DIR/by-id" ]]; then
    for batch_file in "$INDICES_DIR/by-id"/index-id-*.json; do
        count=$(jq -r '.metadata.count' "$batch_file")
        total_files=$((total_files + count))

        # Somme lignes
        lines=$(jq -r '[.files[].lines] | add' "$batch_file")
        total_lines=$((total_lines + lines))

        index_files_count=$((index_files_count + 1))
    done
fi

# Count directories from by-directory
if [[ -d "$INDICES_DIR/by-directory" ]]; then
    for batch_file in "$INDICES_DIR/by-directory"/index-dir-*.json; do
        count=$(jq -r '.metadata.directories_count' "$batch_file")
        total_dirs=$((total_dirs + count))
        index_files_count=$((index_files_count + 1))
    done
fi

# Compter index files autres
[[ -d "$INDICES_DIR/by-path" ]] && index_files_count=$((index_files_count + $(ls -1 "$INDICES_DIR/by-path" | wc -l)))
[[ -d "$INDICES_DIR/by-alphabetical" ]] && index_files_count=$((index_files_count + $(ls -1 "$INDICES_DIR/by-alphabetical" | wc -l)))
[[ -d "$INDICES_DIR/by-type" ]] && index_files_count=$((index_files_count + $(ls -1 "$INDICES_DIR/by-type" | wc -l)))

echo "    Total files: $total_files"
echo "    Total directories: $total_dirs"
echo "    Total lines: $total_lines"
echo "    Index files: $index_files_count"
echo ""

# ============================================================================
# HASH TABLES - BY-ID
# ============================================================================

echo "  Building hash_tables.by_id..."

by_id_hash_table=""
for prefix in {0..9} {a..f}; do
    batch_file="$INDICES_DIR/by-id/index-id-${prefix}.json"
    if [[ -f "$batch_file" ]]; then
        count=$(jq -r '.metadata.count' "$batch_file")
        by_id_hash_table="${by_id_hash_table}    \"${prefix}\": {\"batch\": \"indices/by-id/index-id-${prefix}.json\", \"count\": $count},
"
    fi
done
# Remove last comma
by_id_hash_table=$(echo "$by_id_hash_table" | sed '$ s/,$//')
by_id_hash_table=$(echo "$by_id_hash_table" | sed '$ s/,$//')

# ============================================================================
# HASH TABLES - BY-PATH
# ============================================================================

echo "  Building hash_tables.by_path..."

by_path_hash_table=""
batch_num=0

if [[ -d "$INDICES_DIR/by-path" ]]; then
    for batch_file in "$INDICES_DIR/by-path"/index-path-*.json; do
        offset=$(jq -r '.metadata.offset' "$batch_file")
        count=$(jq -r '.paths | length' "$batch_file")

        # Extract top-level directories
        top_dirs=$(jq -r '.paths | keys[] | split("/")[0]' "$batch_file" | sort -u | head -5)

        for top_dir in $top_dirs; do
            by_path_hash_table="${by_path_hash_table}    \"${top_dir}\": {\"batch\": \"indices/by-path/index-path-$(printf '%03d' $batch_num).json\", \"offset\": $offset, \"count\": $count},
"
        done

        batch_num=$((batch_num + 1))
    done
    # Remove last comma
    by_path_hash_table=$(echo "$by_path_hash_table" | sed '$ s/,$//')
    by_path_hash_table=$(echo "$by_path_hash_table" | sed '$ s/,$//')
fi

# ============================================================================
# HASH TABLES - BY-ALPHABETICAL
# ============================================================================

echo "  Building hash_tables.by_alphabetical..."

by_alpha_hash_table=""

if [[ -d "$INDICES_DIR/by-alphabetical" ]]; then
    for batch_file in "$INDICES_DIR/by-alphabetical"/index-alpha-*.json; do
        range=$(jq -r '.metadata.range | "\(.[0])-\(.[1])"' "$batch_file")
        count=$(jq -r '.files | length' "$batch_file")
        batch_name=$(basename "$batch_file")

        by_alpha_hash_table="${by_alpha_hash_table}    \"${range}\": {\"batch\": \"indices/by-alphabetical/${batch_name}\", \"range\": $(jq -c '.metadata.range' "$batch_file"), \"count\": $count},
"
    done
    # Remove last comma
    by_alpha_hash_table=$(echo "$by_alpha_hash_table" | sed '$ s/,$//')
    by_alpha_hash_table=$(echo "$by_alpha_hash_table" | sed '$ s/,$//')
fi

# ============================================================================
# HASH TABLES - BY-DIRECTORY (sample)
# ============================================================================

echo "  Building hash_tables.by_directory (sample)..."

by_dir_hash_table=""

if [[ -d "$INDICES_DIR/by-directory" ]]; then
    for batch_file in "$INDICES_DIR/by-directory"/index-dir-*.json; do
        offset=$(jq -r '.metadata.offset' "$batch_file")
        batch_name=$(basename "$batch_file")

        # Extract a few example directories
        sample_dirs=$(jq -r '.directories | keys[]' "$batch_file" | head -3)

        for dir in $sample_dirs; do
            files_count=$(jq -r ".directories[\"$dir\"].files_count" "$batch_file")
            by_dir_hash_table="${by_dir_hash_table}    \"$(json_escape "$dir")\": {\"batch\": \"indices/by-directory/${batch_name}\", \"offset\": $offset, \"files_count\": $files_count},
"
        done
    done
    # Remove last comma
    by_dir_hash_table=$(echo "$by_dir_hash_table" | sed '$ s/,$//')
    by_dir_hash_table=$(echo "$by_dir_hash_table" | sed '$ s/,$//')
fi

# ============================================================================
# HASH TABLES - BY-TYPE
# ============================================================================

echo "  Building hash_tables.by_type..."

by_type_hash_table=""

if [[ -d "$INDICES_DIR/by-type" ]]; then
    for batch_file in "$INDICES_DIR/by-type"/index-type-*.json; do
        type=$(jq -r '.metadata.type' "$batch_file")
        count=$(jq -r '.metadata.count' "$batch_file")
        batch_name=$(basename "$batch_file")

        by_type_hash_table="${by_type_hash_table}    \"${type}\": {\"batch\": \"indices/by-type/${batch_name}\", \"count\": $count},
"
    done
    # Remove last comma
    by_type_hash_table=$(echo "$by_type_hash_table" | sed '$ s/,$//')
    by_type_hash_table=$(echo "$by_type_hash_table" | sed '$ s/,$//')
fi

# ============================================================================
# MASTER INDEX.JSON GENERATION
# ============================================================================

echo "  Writing master index.json..."

cat > "$OUTPUT_FILE" << EOF
{
  "metadata": {
    "version": "3.1-hash-id",
    "id_format": {
      "algorithm": "sha256",
      "length": 12,
      "charset": "hex",
      "example": "525bd3752a90"
    },
    "last_check": {
      "timestamp": "$TIMESTAMP_ISO",
      "generator": "agent-aikido-projet-index",
      "version": "3.1"
    },
    "statistics": {
      "total_files": $total_files,
      "total_dirs": $total_dirs,
      "total_lines": $total_lines,
      "index_files_count": $index_files_count
    },
    "batching": {
      "batch_size": 1000,
      "by_id_batches": 16,
      "by_path_batches": $(ls -1 "$INDICES_DIR/by-path" 2>/dev/null | wc -l || echo 0),
      "by_alphabetical_batches": $(ls -1 "$INDICES_DIR/by-alphabetical" 2>/dev/null | wc -l || echo 0),
      "by_directory_batches": $(ls -1 "$INDICES_DIR/by-directory" 2>/dev/null | wc -l || echo 0),
      "by_type_batches": $(ls -1 "$INDICES_DIR/by-type" 2>/dev/null | wc -l || echo 0)
    }
  },
  "hash_tables": {
    "by_id": {
$by_id_hash_table
    },
    "by_path": {
$by_path_hash_table
    },
    "by_alphabetical": {
$by_alpha_hash_table
    },
    "by_directory": {
$by_dir_hash_table
    },
    "by_type": {
$by_type_hash_table
    }
  },
  "routing": {
    "description": "Hash-based ID routing en O(1) - Calcul ID puis lookup direct",
    "examples": {
      "find_by_path": "prompts/gen/personas/agent.md → hash(path) → ID → extract first char → by-id/index-id-X.json",
      "find_by_name": "agent.md → by-alphabetical → ID → by-id/index-id-X.json",
      "direct_by_id": "ID → extract first char → by-id/index-id-X.json (O(1))"
    }
  }
}
EOF

echo ""
echo "✅ Master index.json generated successfully"
echo "   Output: $OUTPUT_FILE"
echo "   Version: 3.1-hash-id"
echo "   Total files indexed: $total_files"
echo "   Hash tables: by_id (16), by_path, by_alphabetical, by_directory, by_type"
