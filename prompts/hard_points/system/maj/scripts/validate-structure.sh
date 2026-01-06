#!/usr/bin/env bash

# validate-structure.sh
# Validation structure AI-KIDO (mono/multi-projet)
# Compatible : Linux, macOS, Windows Git Bash
# Usage : voir fonction usage() ci-dessous

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# Fichiers requis mono-projet
MONO_REQUIRED_FILES=(
    "prompts/index.md"
    "prompts/gen/index.md"
    "prompts/hard_points/ai-kido.md"
    "AGENTS.md"
)

# Fichiers requis multi-projet (base)
MULTI_REQUIRED_FILES=(
    "prompts/index.md"
    "prompts/hard_points/ai-kido.md"
    "AGENTS.md"
)

# Couleurs
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# ═══════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════

log_info() {
    echo -e "${BLUE}ℹ️  $*${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $*${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $*${NC}"
}

log_error() {
    echo -e "${RED}❌ $*${NC}" >&2
}

usage() {
    cat << EOF
Usage: $SCRIPT_NAME [--type mono|multi|auto] [--json]

Options:
  --type TYPE    Type de projet (mono, multi, auto)
                 auto = détection automatique (défaut)
  --json         Sortie au format JSON
  -h, --help     Affiche cette aide

Exemples:
  # Détection automatique
  $SCRIPT_NAME
  
  # Validation mono-projet
  $SCRIPT_NAME --type mono
  
  # Validation multi-projet avec JSON
  $SCRIPT_NAME --type multi --json

Sortie:
  Affiche les fichiers requis et leur statut (✅/❌)
  
Format JSON (avec --json):
  {
    "type": "mono",
    "valid": true,
    "missing": [],
    "present": ["prompts/index.md", ...]
  }

Codes de sortie:
  0  Structure valide
  1  Structure invalide (fichiers manquants)
  2  Arguments invalides
EOF
}

# ═══════════════════════════════════════════════════════════════
# FONCTIONS PRINCIPALES
# ═══════════════════════════════════════════════════════════════

detect_project_type() {
    # Détection basée sur présence de prompts/gen/index.md
    if [ -f "prompts/gen/index.md" ]; then
        echo "mono"
    elif [ -d "prompts" ] && [ $(find prompts -maxdepth 1 -type d ! -name prompts ! -name gen ! -name hard_points ! -name spec | wc -l) -gt 0 ]; then
        echo "multi"
    else
        echo "unknown"
    fi
}

validate_mono() {
    local json_mode="${1:-false}"
    local valid=true
    local missing=()
    local present=()
    
    if [ "$json_mode" = "false" ]; then
        log_info "Validation structure MONO-PROJET"
        echo ""
    fi
    
    for file in "${MONO_REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            present+=("$file")
            if [ "$json_mode" = "false" ]; then
                log_success "$file"
            fi
        else
            missing+=("$file")
            valid=false
            if [ "$json_mode" = "false" ]; then
                log_error "$file manquant"
            fi
        fi
    done
    
    if [ "$json_mode" = "true" ]; then
        cat << EOF
{
  "type": "mono",
  "valid": $valid,
  "missing": [$(printf '"%s",' "${missing[@]}" | sed 's/,$//')],
  "present": [$(printf '"%s",' "${present[@]}" | sed 's/,$//')]
}
EOF
    else
        echo ""
        if [ "$valid" = "true" ]; then
            log_success "Structure mono-projet VALIDE"
        else
            log_error "Structure mono-projet INVALIDE (${#missing[@]} fichiers manquants)"
        fi
    fi
    
    [ "$valid" = "true" ] && return 0 || return 1
}

validate_multi() {
    local json_mode="${1:-false}"
    local valid=true
    local missing=()
    local present=()
    
    if [ "$json_mode" = "false" ]; then
        log_info "Validation structure MULTI-PROJET"
        echo ""
    fi
    
    # Vérifier fichiers base
    for file in "${MULTI_REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            present+=("$file")
            if [ "$json_mode" = "false" ]; then
                log_success "$file"
            fi
        else
            missing+=("$file")
            valid=false
            if [ "$json_mode" = "false" ]; then
                log_error "$file manquant"
            fi
        fi
    done
    
    # Détecter projets
    local projects=()
    if [ -d "prompts" ]; then
        while IFS= read -r -d '' project_dir; do
            local project_name=$(basename "$project_dir")
            if [ "$project_name" != "gen" ] && [ "$project_name" != "hard_points" ] && [ "$project_name" != "spec" ]; then
                projects+=("$project_name")
                
                # Vérifier index.md du projet
                local project_index="prompts/$project_name/index.md"
                if [ -f "$project_index" ]; then
                    present+=("$project_index")
                    if [ "$json_mode" = "false" ]; then
                        log_success "$project_index"
                    fi
                else
                    missing+=("$project_index")
                    valid=false
                    if [ "$json_mode" = "false" ]; then
                        log_error "$project_index manquant"
                    fi
                fi
            fi
        done < <(find prompts -maxdepth 1 -type d ! -name prompts -print0)
    fi
    
    if [ "$json_mode" = "true" ]; then
        cat << EOF
{
  "type": "multi",
  "valid": $valid,
  "projects": [$(printf '"%s",' "${projects[@]}" | sed 's/,$//')],
  "missing": [$(printf '"%s",' "${missing[@]}" | sed 's/,$//')],
  "present": [$(printf '"%s",' "${present[@]}" | sed 's/,$//')]
}
EOF
    else
        echo ""
        log_info "Projets détectés : ${#projects[@]}"
        for project in "${projects[@]}"; do
            echo "  - $project"
        done
        echo ""
        if [ "$valid" = "true" ]; then
            log_success "Structure multi-projet VALIDE"
        else
            log_error "Structure multi-projet INVALIDE (${#missing[@]} fichiers manquants)"
        fi
    fi
    
    [ "$valid" = "true" ] && return 0 || return 1
}

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

main() {
    local project_type="auto"
    local json_mode=false
    
    while [ $# -gt 0 ]; do
        case "$1" in
            --type)
                project_type="$2"
                shift 2
                ;;
            --json)
                json_mode=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Option inconnue : $1"
                usage
                exit 2
                ;;
        esac
    done
    
    # Détection automatique si nécessaire
    if [ "$project_type" = "auto" ]; then
        project_type=$(detect_project_type)
        if [ "$json_mode" = "false" ]; then
            log_info "Type détecté : $project_type"
            echo ""
        fi
    fi
    
    # Validation selon type
    case "$project_type" in
        mono)
            validate_mono "$json_mode"
            ;;
        multi)
            validate_multi "$json_mode"
            ;;
        unknown)
            log_error "Type de projet inconnu"
            exit 2
            ;;
        *)
            log_error "Type invalide : $project_type"
            usage
            exit 2
            ;;
    esac
}

# Exécuter si appelé directement
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
