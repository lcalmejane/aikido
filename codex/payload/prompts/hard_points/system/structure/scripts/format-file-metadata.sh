#!/bin/bash

# format-file-metadata.sh - Full AI-KIDO file metadata format
# Version 3.0 - User specs: lines + size + date + check (with missing header detection)
# Usage: format-file-metadata.sh <file_path> <format>
# Formats: tree, agents

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Input validation
if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <file_path> <format>"
    echo "Formats: tree, agents"
    exit 1
fi

FILE_PATH="$1"
FORMAT="$2"

# Ensure file exists
if [[ ! -e "$FILE_PATH" ]]; then
    echo "Error: File '$FILE_PATH' does not exist" >&2
    exit 1
fi

# Get basic file info
BASENAME=$(basename "$FILE_PATH")
EXTENSION="${BASENAME##*.}"

# System information always collected
SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null || echo "0")
MOD_DATE=$(stat -f%Sm -t"%Y-%m-%d" "$FILE_PATH" 2>/dev/null || stat -c%y "$FILE_PATH" 2>/dev/null | cut -d' ' -f1 || echo "unknown")

# Note: size_human removed as redundant with SIZE (size_bytes)

# Calculate line count for text files (only for files, not directories)
LINES=0
if [[ -f "$FILE_PATH" ]]; then
    # Check if file is text
    if file "$FILE_PATH" 2>/dev/null | grep -q "text"; then
        LINES=$(wc -l < "$FILE_PATH" 2>/dev/null || echo "0")
    fi
fi

# Get appropriate icon based on file type
get_file_icon() {
    local path="$1"
    local ext="$2"
    
    if [[ -d "$path" ]]; then
        echo "📁"
        return
    fi
    
    # Icon based on extension and AI-KIDO context
    case "$ext" in
        md|mdx)
            # Special icons for AI-KIDO categories
            case "$path" in
                */personas/*) echo "🤖" ;;
                */concepts/*) echo "💡" ;;
                */techniques/*) echo "⚡" ;;
                */use_cases/*) echo "🎯" ;;
                */hard_points/*) echo "🔒" ;;
                *) echo "📄" ;;
            esac
            ;;
        txt) echo "📝" ;;
        json|yaml|yml) echo "⚙️" ;;
        sh) echo "🔧" ;;
        js|ts|mjs) echo "⚡" ;;
        py) echo "🐍" ;;
        *) echo "📄" ;;
    esac
}

# Parse check info (header metadata + missing header)
# ONLY for files in /prompts
get_check_info() {
    local file="$1"

    # Check whether the file is in /prompts
    # If not, return N/A immediately (no last-check verification needed)
    if [[ "$file" != prompts/* ]] && [[ "$file" != ./prompts/* ]]; then
        echo "N/A"
        return
    fi

    # Check whether it is a file and whether it is text
    if [[ ! -f "$file" ]]; then
        echo "❌ no-file"
        return
    fi

    # Check whether it is a binary file
    if ! file "$file" 2>/dev/null | grep -q "text"; then
        echo "❌ binary"
        return
    fi

    # For text files, check for a YAML header
    local first_line=$(head -1 "$file" 2>/dev/null)

    if [[ "$first_line" != "---" ]]; then
        # No YAML header
        echo "❌ no-header"
        return
    fi

    # YAML header present, look for last_check metadata
    local header_content=$(awk '/^---$/,/^---$/ {print}' "$file" 2>/dev/null)

    # Extract last_check metadata from the YAML frontmatter (agent-aikido-doc-header format)
    local status=""
    local validator=""

    # Search in the last_check section of the YAML
    if echo "$header_content" | grep -q "^last_check:"; then
        # Extract status and validator with simpler expressions
        status=$(echo "$header_content" | awk '/^last_check:/,/^[a-zA-Z_]/ { if (/^[[:space:]]*status:[[:space:]]*/) { gsub(/^[[:space:]]*status:[[:space:]]*["'"'"']?|["'"'"']?[[:space:]]*$/, ""); print; exit } }')
        validator=$(echo "$header_content" | awk '/^last_check:/,/^[a-zA-Z_]/ { if (/^[[:space:]]*validator:[[:space:]]*/) { gsub(/^[[:space:]]*validator:[[:space:]]*["'"'"']?|["'"'"']?[[:space:]]*$/, ""); print; exit } }')
    fi

    if [[ -n "$status" ]] && [[ -n "$validator" ]]; then
        echo "$status by:$validator"
    else
        # Header present but no last_check or incomplete
        echo "⚠️ no-lastcheck"
    fi
}

# Get file info
ICON=$(get_file_icon "$FILE_PATH" "$EXTENSION")
CHECK_INFO=$(get_check_info "$FILE_PATH")

# Format output based on requested format
case "$FORMAT" in
    "tree")
        # Format basique pour mode tree : nom + lignes/taille + date
        if [[ -d "$FILE_PATH" ]]; then
            echo "$ICON $BASENAME"
        else
            if [[ "$LINES" -gt 0 ]]; then
                echo "$ICON $BASENAME (${LINES}L ${SIZE}B ${MOD_DATE})"
            else
                echo "$ICON $BASENAME (${SIZE}B ${MOD_DATE})"
            fi
        fi
        ;;

    "agents")
        # Format enrichi pour mode agents : nom + lignes + taille + date + check
        if [[ -d "$FILE_PATH" ]]; then
            echo "$ICON $BASENAME"
        else
            # Build the result with all requested metadata
            result="$ICON $BASENAME"

            # Add lines + size + date
            if [[ "$LINES" -gt 0 ]]; then
                result="$result (${LINES}L ${SIZE}B ${MOD_DATE})"
            else
                result="$result (${SIZE}B ${MOD_DATE})"
            fi

            # Add check info (only if relevant, N/A otherwise)
            if [[ "$CHECK_INFO" != "N/A" ]]; then
                result="$result [Check: $CHECK_INFO]"
            fi

            echo "$result"
        fi
        ;;

    *)
        echo "Error: Unsupported format '$FORMAT'" >&2
        echo "Supported formats: tree, agents" >&2
        exit 1
        ;;
esac
