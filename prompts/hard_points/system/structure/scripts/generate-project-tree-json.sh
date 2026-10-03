#!/bin/bash

# generate-project-tree-json.sh - AI-KIDO project tree generation as JSON
# Version 2.1 - Optimized JSON format (simplified version without parallelization)

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_FILE="${1:-prompts/hard_points/system/structure/index.json}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

# Variables globales pour .gitignore
GITIGNORE_DIRS=()
GITIGNORE_PATTERNS=()

# Patterns d'exclusion standards
EXCLUDE_PATTERNS=(
    "node_modules" ".git" "dist" "build" ".next" ".nuxt" ".cache"
    "coverage" ".nyc_output" "*.log" "*.tmp" ".env*" "*.swp" "*.swo" "*~" "temp"
)

# ============================================================================
# FONCTIONS .GITIGNORE
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

    # First check whether the path contains one of the exclusion patterns
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        # Check the file/folder name
        case "$name" in $pattern) return 0 ;; esac

        # Check whether the path contains the pattern (e.g. .git/ in the path)
        case "$relative_path" in
            ${pattern}/*) return 0 ;;  # Commence par pattern/
            */${pattern}/*) return 0 ;;  # Contient /pattern/
        esac
    done

    # Check .gitignore patterns
    for i in "${!GITIGNORE_DIRS[@]}"; do
        IFS='|' read -ra patterns <<< "${GITIGNORE_PATTERNS[i]}"
        for pattern in "${patterns[@]}"; do
            check_gitignore_pattern "$pattern" "$relative_path" "$name" "${GITIGNORE_DIRS[i]}" && return 0
        done
    done
    return 1
}

# ============================================================================
# JSON UTILITIES
# ============================================================================

json_escape() {
    local str="$1"
    str="${str//\\/\\\\}"
    str="${str//\"/\\\"}"
    str="${str//$'\n'/\\n}"
    str="${str//$'\r'/\\r}"
    str="${str//$'\t'/\\t}"
    echo "$str"
}

# ============================================================================
# METADATA EXTRACTION
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
    local name=$(basename "$file")

    # Icon and category
    IFS='|' read -r icon category extension <<< "$(get_file_icon_and_category "$file" "$name" "$relative_path")"

    # Base metadata
    local size_bytes=0 modified="" lines=0 check_status="❌ no-header"

    if [[ -f "$file" ]]; then
        size_bytes=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        modified=$(stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1 || echo "")

        if file "$file" 2>/dev/null | grep -q "text"; then
            lines=$(wc -l < "$file" 2>/dev/null || echo "0")

            # Check-status only for files in /prompts
            if [[ "$relative_path" == prompts/* ]]; then
                if [[ "$extension" == "md" ]] || [[ "$extension" == "mdx" ]]; then
                    if head -10 "$file" 2>/dev/null | grep -q "last-check:"; then
                        check_status="✅"
                    elif head -10 "$file" 2>/dev/null | grep -q "^---"; then
                        check_status="⚠️ no-lastcheck"
                    fi
                fi
            else
                check_status="N/A"
            fi
        else
            check_status="❌ binary"
        fi
    fi

    # JSON output (one line) - size_human removed (redundant with size_bytes)
    echo "{\"name\":\"$(json_escape "$name")\",\"path\":\"$(json_escape "$relative_path")\",\"type\":\"$category\",\"icon\":\"$icon\",\"size_bytes\":$size_bytes,\"lines\":$lines,\"modified\":\"$modified\",\"check_status\":\"$(json_escape "$check_status")\",\"extension\":\"$extension\"}"
}

# ============================================================================
# JSON GENERATION
# ============================================================================

# Collect all files with metadata (OPTIMIZED - batch)
collect_all_metadata() {
    cd "$PROJECT_ROOT"

    local first=true
    echo "{"

    while IFS= read -r -d '' file; do
        if ! should_exclude "$file"; then
            [[ -f "$file" ]] || continue

            local relative_path="${file#./}"
            local metadata=$(extract_metadata "$file")

            if [[ "$first" == true ]]; then
                first=false
            else
                echo ","
            fi

            echo -n "\"$(json_escape "$relative_path")\":$metadata"
        fi
    done < <(find . -type f -print0 2>/dev/null)

    echo ""
    echo "}"
}

# Build by_directory index (OPTIMIZED)
build_index_by_directory() {
    local metadata_json="$1"

    echo "{"

    # Extract all paths and group by directory
    local dirs=$(echo "$metadata_json" | jq -r 'keys[]' | xargs -I {} dirname {} | sort -u)
    local first_dir=true

    for dir in $dirs; do
        local files=$(echo "$metadata_json" | jq -r "keys[] | select(startswith(\"$dir/\") and (. | split(\"/\") | length) == ((\"$dir/\" | split(\"/\") | length) + 1))")

        if [[ -n "$files" ]]; then
            if [[ "$first_dir" == true ]]; then
                first_dir=false
            else
                echo ","
            fi

            echo -n "\"$(json_escape "$dir")\":{\"files\":["
            local first_file=true
            while IFS= read -r file; do
                if [[ "$first_file" == true ]]; then
                    first_file=false
                else
                    echo -n ","
                fi
                echo -n "\"$(json_escape "$file")\""
            done <<< "$files"
            echo -n "]}"
        fi
    done

    echo ""
    echo "}"
}

# Build by_type index (OPTIMIZED)
build_index_by_type() {
    local metadata_json="$1"

    echo "$metadata_json" | jq '{
        agent: [keys[] as $k | select(.[$k].type == "agent") | $k],
        concept: [keys[] as $k | select(.[$k].type == "concept") | $k],
        technique: [keys[] as $k | select(.[$k].type == "technique") | $k],
        use_case: [keys[] as $k | select(.[$k].type == "use_case") | $k],
        hard_point: [keys[] as $k | select(.[$k].type == "hard_point") | $k],
        script: [keys[] as $k | select(.[$k].type == "script") | $k],
        markdown: [keys[] as $k | select(.[$k].type == "markdown") | $k],
        config: [keys[] as $k | select(.[$k].type == "config") | $k],
        file: [keys[] as $k | select(.[$k].type == "file") | $k],
        directory: [keys[] as $k | select(.[$k].type == "directory") | $k]
    } | with_entries(select(.value | length > 0))'
}

# Build by_name index (OPTIMIZED)
build_index_by_name() {
    local metadata_json="$1"

    echo "$metadata_json" | jq 'to_entries | group_by(.value.name) | map({key: .[0].value.name, value: map(.key)}) | from_entries'
}

# Statistiques
calculate_stats() {
    cd "$PROJECT_ROOT"
    local total_files=0 total_dirs=0 total_lines=0

    while IFS= read -r -d '' item; do
        if ! should_exclude "$item"; then
            if [[ -f "$item" ]]; then
                ((total_files++))
                if file "$item" 2>/dev/null | grep -q "text"; then
                    local lines=$(wc -l < "$item" 2>/dev/null || echo "0")
                    ((total_lines += lines))
                fi
            elif [[ -d "$item" ]]; then
                ((total_dirs++))
            fi
        fi
    done < <(find . -print0 2>/dev/null)

    echo "{\"total_files\":$total_files,\"total_dirs\":$total_dirs,\"total_lines\":$total_lines}"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    echo "🚀 Generating AI-KIDO JSON index..." >&2
    echo "📂 Racine: $PROJECT_ROOT" >&2
    echo "" >&2

    # Discover .gitignore
    discover_all_gitignores

    # Collect metadata
    echo "📦 Collecting metadata..." >&2
    local metadata=$(collect_all_metadata)

    # Statistiques
    echo "📊 Calcul des statistiques..." >&2
    local stats=$(calculate_stats)

    # Construire index
    echo "🔍 Construction des index..." >&2
    local index_by_directory=$(build_index_by_directory "$metadata")
    local index_by_type=$(build_index_by_type "$metadata")
    local index_by_name=$(build_index_by_name "$metadata")

    # Generate final JSON
    echo "🔨 Generating final JSON..." >&2
    cat > "$OUTPUT_FILE" <<EOF
{
  "metadata": {
    "last_check": {
      "timestamp": "$TIMESTAMP_ISO",
      "status": "✅",
      "generator": "agent-aikido-projet-index",
      "version": "2.1",
      "sources": ["scripts/generate-project-tree-json.sh"]
    },
    "generated": "$TIMESTAMP",
    "statistics": $stats,
    "exclusions": {
      "gitignore_count": ${#GITIGNORE_DIRS[@]}
    }
  },
  "index": {
    "by_path": $metadata,
    "by_directory": $index_by_directory,
    "by_type": $index_by_type,
    "by_name": $index_by_name
  }
}
EOF

    echo "" >&2
    echo "✅ Done!" >&2
    echo "📦 File: $OUTPUT_FILE" >&2
    echo "📏 Taille: $(du -h "$OUTPUT_FILE" | cut -f1)" >&2
}

main
