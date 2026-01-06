#!/bin/bash

# generate-index-by-id-parallel.sh - Génération parallélisée index by-id V3.1
# Version 3.1-parallel - 4 workers simultanés

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="prompts/hard_points/system/structure/indices/by-id"
NUM_WORKERS=4  # Nombre de workers parallèles
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

# Source utilities et fonctions
source "$SCRIPT_DIR/lib/hash-utils.sh"

# Copier les fonctions nécessaires depuis generate-index-by-id.sh
EXCLUDE_PATTERNS=(
    "node_modules" ".git" "dist" "build" ".next" ".nuxt" ".cache"
    "coverage" ".nyc_output" "*.log" "*.tmp" ".env*" "*.swp" "*.swo" "*~" "temp"
)

# Variables .gitignore
GITIGNORE_DIRS=()
GITIGNORE_PATTERNS=()

discover_all_gitignores() {
    while IFS= read -r -d '' gitignore_file; do
        local gitignore_dir="$(dirname "$gitignore_file")"
        local relative_dir="${gitignore_dir#./}"
        [[ "$relative_dir" == "." ]] && relative_dir=""

        local patterns=()
        while IFS= read -r line; do
            if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
                local clean_line=$(echo "$line" | sed 's/[[:space:]]*$//' | sed 's/^[[:space:]]*//')
                [[ -n "$clean_line" ]] && patterns+=("$clean_line")
            fi
        done < "$gitignore_file"

        if [[ ${#patterns[@]} -gt 0 ]]; then
            local joined_patterns="$(printf '%s|' "${patterns[@]}")"
            GITIGNORE_DIRS+=("$relative_dir")
            GITIGNORE_PATTERNS+=("${joined_patterns%|}")
        fi
    done < <(find "$PROJECT_ROOT" -name ".gitignore" -type f -print0 2>/dev/null)
}

check_gitignore_pattern() {
    local pattern="$1" relative_path="$2" name="$3" gitignore_dir="$4"
    local path_from_gitignore

    if [[ -z "$gitignore_dir" ]]; then
        path_from_gitignore="$relative_path"
    else
        if [[ "$relative_path" == "$gitignore_dir"/* ]] || [[ "$relative_path" == "$gitignore_dir" ]]; then
            path_from_gitignore="${relative_path#$gitignore_dir/}"
            [[ -z "$path_from_gitignore" ]] && path_from_gitignore="$(basename "$gitignore_dir")"
        else
            path_from_gitignore="$relative_path"
        fi
    fi

    [[ "$pattern" == *"**"* ]] && [[ "$pattern" =~ \*\*/.+ ]] && [[ "$name" == "${pattern##**/}" ]] && return 0
    [[ "$pattern" == */ ]] && [[ "$name" == "${pattern%/}" || "$path_from_gitignore" =~ (^|/)${pattern%/}(/|$) ]] && return 0
    [[ "$name" == "$pattern" || "$path_from_gitignore" == "$pattern" ]] && return 0
    [[ "$pattern" == *"*"* ]] && [[ "$name" == $pattern || "$path_from_gitignore" == $pattern ]] && return 0
    return 1
}

should_exclude() {
    local path="$1"
    local relative_path="${path#./}"
    local name=$(basename "$path")

    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        case "$name" in $pattern) return 0 ;; esac
        case "$relative_path" in
            ${pattern}/*) return 0 ;;
            */${pattern}/*) return 0 ;;
        esac
    done

    for i in "${!GITIGNORE_DIRS[@]}"; do
        IFS='|' read -ra patterns <<< "${GITIGNORE_PATTERNS[i]}"
        for pattern in "${patterns[@]}"; do
            check_gitignore_pattern "$pattern" "$relative_path" "$name" "${GITIGNORE_DIRS[i]}" && return 0
        done
    done
    return 1
}

get_file_icon_and_category() {
    local file="$1" name="$2" relative_path="$3"
    local icon="📄" category="file" extension="${name##*.}"

    [[ -d "$file" ]] && echo "📁|directory|" && return

    case "$extension" in
        md|mdx)
            local dir_parent=$(dirname "$relative_path")
            if [[ "$dir_parent" == *"/personas"* ]] || [[ "$relative_path" == *"/agents/"* ]]; then
                echo "🤖|agent|md"
            elif [[ "$dir_parent" == *"/concepts"* ]]; then
                echo "💡|concept|md"
            elif [[ "$dir_parent" == *"/techniques"* ]]; then
                echo "⚡|technique|md"
            elif [[ "$dir_parent" == *"/use_cases"* ]]; then
                echo "🎯|use_case|md"
            elif [[ "$dir_parent" == *"/hard_points"* ]]; then
                echo "🔒|hard_point|md"
            else
                echo "📄|markdown|md"
            fi
            ;;
        sh) echo "🔧|script|sh" ;;
        json) echo "⚙️|config|json" ;;
        *) echo "📄|file|$extension" ;;
    esac
}

extract_metadata() {
    local file="$1" relative_path="${file#./}"
    local name="${file##*/}"

    IFS='|' read -r icon category extension <<< "$(get_file_icon_and_category "$file" "$name" "$relative_path")"

    local size_bytes=0 modified="" lines=0 check_status="N/A"

    if [[ -f "$file" ]]; then
        if [[ "$(uname)" == "Darwin" ]]; then
            IFS='|' read -r size_bytes modified <<< "$(stat -f "%z|%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null)"
        else
            IFS='|' read -r size_bytes modified <<< "$(stat -c "%s|%y" "$file" 2>/dev/null | cut -d' ' -f1)"
        fi

        local header="" line_count=0 is_text=true

        while IFS= read -r line && (( line_count < 10 )); do
            if [[ "$line" =~ [^[:print:]$'\t'$'\n'] ]]; then
                is_text=false
                break
            fi
            header+="$line"$'\n'
            ((line_count++))
        done < "$file" 2>/dev/null

        if $is_text; then
            lines=$(awk 'END {print NR}' "$file" 2>/dev/null || echo "0")

            if [[ "$relative_path" == prompts/* && ("$extension" == "md" || "$extension" == "mdx") ]]; then
                if [[ "$header" =~ last-check: ]]; then
                    check_status="✅"
                elif [[ "$header" =~ ^--- ]]; then
                    check_status="⚠️ no-lastcheck"
                else
                    check_status="❌ no-header"
                fi
            fi
        else
            check_status="❌ binary"
            lines=0
        fi
    fi

    echo "{\"name\":\"$(json_escape "$name")\",\"path\":\"$(json_escape "$relative_path")\",\"type\":\"$category\",\"icon\":\"$icon\",\"size_bytes\":$size_bytes,\"lines\":$lines,\"modified\":\"$modified\",\"check_status\":\"$(json_escape "$check_status")\",\"extension\":\"$extension\"}"
}

# Créer répertoire output
mkdir -p "$PROJECT_ROOT/$OUTPUT_DIR"
mkdir -p "/tmp/aikido"

cd "$PROJECT_ROOT"

echo "Generating by-id index (PARALLEL MODE - $NUM_WORKERS workers)..."
echo ""

# ============================================================================
# PHASE 1 : COLLECTER TOUS LES FICHIERS
# ============================================================================

echo "Phase 1: Collecting all files..."

discover_all_gitignores

# Liste complète des fichiers
temp_filelist=$(mktemp)

# Correction : écrire directement sans subshell
while IFS= read -r -d '' file; do
    should_exclude "$file" && continue
    [[ -f "$file" ]] && echo "$file"
done < <(find . -type f -print0 2>/dev/null) > "$temp_filelist"

total_files=$(wc -l < "$temp_filelist" | tr -d ' ')
echo "  Found $total_files files to index"
echo ""

# ============================================================================
# PHASE 2 : DIVISER EN CHUNKS ET TRAITER EN PARALLÈLE
# ============================================================================

echo "Phase 2: Processing in parallel ($NUM_WORKERS workers)..."

# Diviser la liste en N chunks
chunk_size=$(( (total_files + NUM_WORKERS - 1) / NUM_WORKERS ))

for worker_id in $(seq 0 $((NUM_WORKERS - 1))); do
    start_line=$((worker_id * chunk_size + 1))
    end_line=$(( (worker_id + 1) * chunk_size ))

    echo "  Worker $worker_id: processing lines $start_line-$end_line"

    # Lancer worker en background
    (
        worker_temp_dir=$(mktemp -d)

        # Créer 16 fichiers temp pour ce worker
        for prefix in {0..9} {a..f}; do
            : > "$worker_temp_dir/batch-$prefix.jsonl"
        done

        # Traiter le chunk de ce worker
        sed -n "${start_line},${end_line}p" "$temp_filelist" | while IFS= read -r file; do
            relative_path="${file#./}"

            # Générer ID + métadonnées
            file_id=$(generate_file_id "$relative_path")
            metadata=$(extract_metadata "$file")

            # Écrire dans le fichier temp approprié
            batch_prefix=$(get_batch_prefix "$file_id")
            echo "\"$file_id\":$metadata," >> "$worker_temp_dir/batch-$batch_prefix.jsonl"
        done

        # Marquer comme terminé
        echo "$worker_temp_dir" > "/tmp/aikido/worker-$$-$worker_id.done"

    ) &
done

# Attendre que tous les workers se terminent
echo ""
echo "Waiting for all workers to complete..."
wait

echo "✅ All workers completed"
echo ""

# ============================================================================
# PHASE 3 : FUSIONNER LES RÉSULTATS
# ============================================================================

echo "Phase 3: Merging results into 16 batches..."

declare -a batch_counts
for i in {0..15}; do
    batch_counts[$i]=0
done

for prefix in {0..9} {a..f}; do
    batch_file="$PROJECT_ROOT/$OUTPUT_DIR/index-id-${prefix}.json"

    # Fusionner tous les fichiers worker pour ce préfixe
    merged_content=$(mktemp)

    for worker_id in $(seq 0 $((NUM_WORKERS - 1))); do
        marker_file="/tmp/aikido/worker-$$-$worker_id.done"
        if [[ -f "$marker_file" ]]; then
            worker_dir=$(cat "$marker_file")
            if [[ -f "$worker_dir/batch-$prefix.jsonl" ]]; then
                cat "$worker_dir/batch-$prefix.jsonl" >> "$merged_content"
            fi
        fi
    done

    # Compter entrées
    count=$(wc -l < "$merged_content" | tr -d ' ')
    batch_index=$((16#$prefix))
    batch_counts[$batch_index]=$count

    # Générer fichier JSON final
    cat > "$batch_file" << EOF
{
  "metadata": {
    "batch_id": "id-${prefix}",
    "id_prefix": "${prefix}",
    "count": $count,
    "generated": "$TIMESTAMP_ISO"
  },
  "files": {
EOF

    # Ajouter contenu (enlever dernière virgule)
    if [[ $count -gt 0 ]]; then
        sed '$ s/,$//' "$merged_content" >> "$batch_file"
    fi

    cat >> "$batch_file" << EOF
  }
}
EOF

    echo "  Batch $prefix: $count files"

    rm "$merged_content"
done

# Cleanup
rm "$temp_filelist"
for worker_id in $(seq 0 $((NUM_WORKERS - 1))); do
    marker_file="/tmp/aikido/worker-$$-$worker_id.done"
    if [[ -f "$marker_file" ]]; then
        worker_dir=$(cat "$marker_file")
        rm -rf "$worker_dir"
        rm "$marker_file"
    fi
done

echo ""
echo "✅ by-id index generated successfully (PARALLEL)"
echo "   Total files: $total_files"
echo "   Workers: $NUM_WORKERS"
echo "   Output: $OUTPUT_DIR/"
echo ""

# Afficher distribution
echo "Distribution across 16 batches:"
for prefix in {0..9} {a..f}; do
    batch_index=$((16#$prefix))
    count=${batch_counts[$batch_index]}
    percent=$(awk "BEGIN {printf \"%.1f\", ($count * 100.0 / $total_files)}")
    bar_length=$((count * 50 / (total_files / 16 + 1)))
    bar=$(printf "%${bar_length}s" | tr ' ' '▓')
    printf "  %s: %4d files (%5s%%) %s\n" "$prefix" "$count" "$percent" "$bar"
done
