#!/bin/bash

# generate-project-tree.sh - AI-KIDO project tree generation
# Version 3.0 - Delegates to the JSON script (default format)

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_FILE="${1:-prompts/hard_points/system/structure/index.json}"

# CHANGE v3.0: JSON generation only
echo "🚀 Generating project tree (JSON format)..." >&2
exec "$SCRIPT_DIR/generate-project-tree-json.sh" "$OUTPUT_FILE"
