#!/usr/bin/env bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: detect-project-type.sh
# Description: Mono vs multi-project detection for AI-KIDO
# Version: 1.0.0
# Author: AI-KIDO System
# ═══════════════════════════════════════════════════════════════════════════

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ️  $1${NC}" >&2; }

cmd_detect() {
    local prompts_dir="${1:-.}/prompts"
    
    if [ ! -d "$prompts_dir" ]; then
        echo "ERROR: prompts directory not found"
        return 1
    fi
    
    # Count subdirectories (excluding gen, hard_points, spec)
    local project_dirs=$(find "$prompts_dir" -mindepth 1 -maxdepth 1 -type d \
        ! -name "gen" ! -name "hard_points" ! -name "spec" 2>/dev/null | wc -l)
    
    if [ "$project_dirs" -eq 0 ]; then
        echo "MONO"
        print_info "Type: Mono-projet"
    else
        echo "MULTI"
        print_info "Type: Multi-projet ($project_dirs projets)"
        
        # List projects
        find "$prompts_dir" -mindepth 1 -maxdepth 1 -type d \
            ! -name "gen" ! -name "hard_points" ! -name "spec" \
            -exec basename {} \; 2>/dev/null | sort
    fi
}

usage() {
    cat <<EOF
Usage: $(basename "$0") detect [prompts_dir]

Mono vs multi-project detection for AI-KIDO

OUTPUT:
  MONO              Single project (no project subdirectories)
  MULTI             Multi-project (with project list on stdout)
  projet1
  projet2
  ...

EXEMPLE:
  TYPE=\$($(basename "$0") detect)
  if [ "\$TYPE" = "MONO" ]; then
    echo "Mono-project detected"
  else
    echo "Multi-project detected"
  fi
EOF
}

main() {
    [ $# -eq 0 ] && { cmd_detect "."; exit 0; }
    
    case "$1" in
        detect) cmd_detect "${2:-.}" ;;
        -h|--help) usage; exit 0 ;;
        *) usage; exit 1 ;;
    esac
}

main "$@"
