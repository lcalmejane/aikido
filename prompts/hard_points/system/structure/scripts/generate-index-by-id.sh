#!/bin/bash

# generate-index-by-id.sh - Génération index by-id (source de vérité unique)
# Version 3.1 - Hash-based ID normalization

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="prompts/hard_points/system/structure/indices/by-id"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

# Source utilities
source "$SCRIPT_DIR/lib/hash-utils.sh"

# Variables globales .gitignore (réutilisées depuis generate-project-tree-json.sh)
GITIGNORE_DIRS=()
GITIGNORE_PATTERNS=()

# Patterns d'exclusion standards
EXCLUDE_PATTERNS=(
    "node_modules" ".git" "dist" "build" ".next" ".nuxt" ".cache"
    "coverage" ".nyc_output" "*.log" "*.tmp" ".env*" "*.swp" "*.swo" "*~" "temp"
)

# ============================================================================
# FONCTIONS .GITIGNORE (réutilisées)
# ============================================================================

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

    if [[ "$pattern" == *"**"* ]]; then
        if [[ "$pattern" =~ \*\*/.+ ]]; then
            [[ "$name" == "${pattern##**/}" ]] && return 0
        fi
        local regex_pattern="${pattern//\*\*/.*}"
        regex_pattern="${regex_pattern//\*/[^/]*}"
        [[ "$path_from_gitignore" =~ ^${regex_pattern}$ ]] && return 0
    elif [[ "$pattern" == */ ]]; then
        local pattern_clean="${pattern%/}"
        [[ "$name" == "$pattern_clean" ]] && return 0
        [[ "$path_from_gitignore" =~ (^|/)${pattern_clean}(/|$) ]] && return 0
    elif [[ "$name" == "$pattern" ]] || [[ "$path_from_gitignore" == "$pattern" ]]; then
        return 0
    elif [[ "$pattern" == *"*"* ]]; then
        [[ "$name" == $pattern ]] || [[ "$path_from_gitignore" == $pattern ]] && return 0
    fi
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

# ============================================================================
# EXTRACTION MÉTADONNÉES (simplifié pour by-id)
# ============================================================================

get_file_icon_and_category() {
    local file="$1" name="$2" relative_path="$3"
    local icon="📄" category="file" extension="${name##*.}"

    if [[ -d "$file" ]]; then
        echo "📁|directory|"
        return
    fi

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
    local name="${file##*/}"  # Bash pur au lieu de basename

    IFS='|' read -r icon category extension <<< "$(get_file_icon_and_category "$file" "$name" "$relative_path")"

    local size_bytes=0 modified="" lines=0 check_status="N/A"

    if [[ -f "$file" ]]; then
        # Un seul stat avec format composite (macOS/Linux compatible)
        if [[ "$(uname)" == "Darwin" ]]; then
            IFS='|' read -r size_bytes modified <<< "$(stat -f "%z|%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null)"
        else
            IFS='|' read -r size_bytes modified <<< "$(stat -c "%s|%y" "$file" 2>/dev/null | cut -d' ' -f1)"
        fi

        # Détection fichier texte rapide : lire premières lignes + check header
        local header="" line_count=0 is_text=true

        while IFS= read -r line && (( line_count < 10 )); do
            # Détection binaire simple : si caractères non-imprimables dans les 10 premières lignes
            if [[ "$line" =~ [^[:print:]$'\t'$'\n'] ]]; then
                is_text=false
                break
            fi
            header+="$line"$'\n'
            ((line_count++))
        done < "$file" 2>/dev/null

        if $is_text; then
            # Compter lignes avec awk (très rapide, optimisé C)
            lines=$(awk 'END {print NR}' "$file" 2>/dev/null || echo "0")

            # Check status pour fichiers prompts/*.md
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

# ============================================================================
# GÉNÉRATION INDEX BY-ID (16 BATCHES)
# ============================================================================

# Créer répertoire output
mkdir -p "$PROJECT_ROOT/$OUTPUT_DIR"

# Initialiser fichiers temporaires pour chaque batch (0-f)
declare -a temp_files
for prefix in {0..9} {a..f}; do
    temp_files[$((16#$prefix))]=$(mktemp)
    echo "# Temp file for batch $prefix" > "${temp_files[$((16#$prefix))]}"
done

# Découvrir .gitignore
cd "$PROJECT_ROOT"
discover_all_gitignores

# Variables statistiques
total_files=0
declare -a batch_counts
for i in {0..15}; do
    batch_counts[$i]=0
done

echo "Scanning files and generating IDs (optimized buffered writes)..."

# Buffers pour écriture groupée (réduit I/O)
declare -a write_buffers
for i in {0..15}; do
    write_buffers[$i]=""
done

BUFFER_FLUSH_SIZE=1000  # Flush tous les 1000 fichiers (~400KB par buffer)

# Scanner tous les fichiers avec optimisations
while IFS= read -r -d '' file; do
    if should_exclude "$file"; then
        continue
    fi

    [[ -f "$file" ]] || continue

    relative_path="${file#./}"

    # Générer ID hash (optimisé : moins de subshells)
    file_id=$(generate_file_id "$relative_path")

    # Extraire métadonnées
    metadata=$(extract_metadata "$file")

    # Déterminer batch prefix (0-f)
    batch_prefix=$(get_batch_prefix "$file_id")
    batch_index=$((16#$batch_prefix))

    # Accumuler dans buffer
    write_buffers[$batch_index]+="\"$file_id\":$metadata,"$'\n'

    # Flush buffer si plein (1000 entrées * ~400 bytes = ~400KB)
    if (( ${#write_buffers[$batch_index]} > BUFFER_FLUSH_SIZE * 400 )); then
        echo -n "${write_buffers[$batch_index]}" >> "${temp_files[$batch_index]}"
        write_buffers[$batch_index]=""
    fi

    # Statistiques
    ((total_files++))
    ((batch_counts[$batch_index]++))

    # Progress
    if (( total_files % 500 == 0 )); then
        echo "  Processed: $total_files files..." >&2
    fi
done < <(find . -type f -print0 2>/dev/null)

# Flush tous les buffers restants
for i in {0..15}; do
    if [[ -n "${write_buffers[$i]}" ]]; then
        echo -n "${write_buffers[$i]}" >> "${temp_files[$i]}"
    fi
done

echo "Processed total: $total_files files"
echo ""

# Générer 16 fichiers JSON finaux
echo "Generating 16 batch JSON files..."

for prefix in {0..9} {a..f}; do
    batch_index=$((16#$prefix))
    temp_file="${temp_files[$batch_index]}"
    count=${batch_counts[$batch_index]}

    batch_file="$PROJECT_ROOT/$OUTPUT_DIR/index-id-${prefix}.json"

    echo "  Batch $prefix: $count files → index-id-${prefix}.json"

    # Header
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

    # Content (enlever la première ligne de commentaire et la dernière virgule)
    if [[ $count -gt 0 ]]; then
        tail -n +2 "$temp_file" | sed '$ s/,$//' >> "$batch_file"
    fi

    # Footer
    cat >> "$batch_file" << EOF
  }
}
EOF

    # Cleanup temp file
    rm "$temp_file"
done

echo ""
echo "✅ by-id index generated successfully"
echo "   Total files: $total_files"
echo "   Batches: 16 (0-f)"
echo "   Output: $OUTPUT_DIR/"
echo ""

# Afficher distribution
echo "Distribution across batches:"
for prefix in {0..9} {a..f}; do
    batch_index=$((16#$prefix))
    count=${batch_counts[$batch_index]}
    if [[ $count -gt 0 ]]; then
        percentage=$(awk "BEGIN {printf \"%.1f\", ($count / $total_files) * 100}")
        bar_length=$(( count * 50 / total_files ))
        bar=$(printf "%${bar_length}s" | tr ' ' '▓')
        printf "  %s: %4d files (%5.1f%%) %s\n" "$prefix" "$count" "$percentage" "$bar"
    fi
done
