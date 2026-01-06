#!/bin/bash

# format-file-metadata.sh - Format complet métadonnées fichiers AI-KIDO
# Version 3.0 - Spécifications utilisateur : lignes + taille + date + check (avec détection absence en-tête)
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

# Informations système toujours collectées
SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null || echo "0")
MOD_DATE=$(stat -f%Sm -t"%Y-%m-%d" "$FILE_PATH" 2>/dev/null || stat -c%y "$FILE_PATH" 2>/dev/null | cut -d' ' -f1 || echo "unknown")

# Note: size_human supprimé car redondant avec SIZE (size_bytes)

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

# Analyser les infos de check (métadonnées en-tête + absence en-tête)
# UNIQUEMENT pour fichiers dans /prompts
get_check_info() {
    local file="$1"

    # Vérifier si le fichier est dans /prompts
    # Si non, retourner N/A immédiatement (pas de vérification last-check nécessaire)
    if [[ "$file" != prompts/* ]] && [[ "$file" != ./prompts/* ]]; then
        echo "N/A"
        return
    fi

    # Vérifier si c'est un fichier et si c'est du texte
    if [[ ! -f "$file" ]]; then
        echo "❌ no-file"
        return
    fi

    # Vérifier si c'est un fichier binaire
    if ! file "$file" 2>/dev/null | grep -q "text"; then
        echo "❌ binary"
        return
    fi

    # Pour les fichiers texte, vérifier la présence d'un en-tête YAML
    local first_line=$(head -1 "$file" 2>/dev/null)

    if [[ "$first_line" != "---" ]]; then
        # Pas d'en-tête YAML
        echo "❌ no-header"
        return
    fi

    # En-tête YAML présent, chercher les métadonnées last_check
    local header_content=$(awk '/^---$/,/^---$/ {print}' "$file" 2>/dev/null)

    # Extraire les métadonnées last_check dans le frontmatter YAML (format agent-aikido-doc-header)
    local status=""
    local validator=""

    # Recherche dans la section last_check du YAML
    if echo "$header_content" | grep -q "^last_check:"; then
        # Extraire le statut et validator avec des expressions plus simples
        status=$(echo "$header_content" | awk '/^last_check:/,/^[a-zA-Z_]/ { if (/^[[:space:]]*status:[[:space:]]*/) { gsub(/^[[:space:]]*status:[[:space:]]*["'"'"']?|["'"'"']?[[:space:]]*$/, ""); print; exit } }')
        validator=$(echo "$header_content" | awk '/^last_check:/,/^[a-zA-Z_]/ { if (/^[[:space:]]*validator:[[:space:]]*/) { gsub(/^[[:space:]]*validator:[[:space:]]*["'"'"']?|["'"'"']?[[:space:]]*$/, ""); print; exit } }')
    fi

    if [[ -n "$status" ]] && [[ -n "$validator" ]]; then
        echo "$status by:$validator"
    else
        # En-tête présent mais pas de last_check ou incomplet
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
            # Construire le résultat avec toutes les métadonnées demandées
            result="$ICON $BASENAME"

            # Ajouter lignes + taille + date
            if [[ "$LINES" -gt 0 ]]; then
                result="$result (${LINES}L ${SIZE}B ${MOD_DATE})"
            else
                result="$result (${SIZE}B ${MOD_DATE})"
            fi

            # Ajouter les infos de check (uniquement si pertinent, N/A sinon)
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
