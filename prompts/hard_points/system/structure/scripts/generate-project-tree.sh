#!/bin/bash

# generate-project-tree.sh - Génération arborescence projet AI-KIDO
# Version 3.0 - Délègue au script JSON (format par défaut)

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_FILE="${1:-prompts/hard_points/system/structure/index.json}"

# CHANGEMENT v3.0 : Génération JSON uniquement
echo "🚀 Génération arborescence projet (format JSON)..." >&2
exec "$SCRIPT_DIR/generate-project-tree-json.sh" "$OUTPUT_FILE"
