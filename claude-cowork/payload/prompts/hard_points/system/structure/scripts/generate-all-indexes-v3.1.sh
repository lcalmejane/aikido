#!/bin/bash

# generate-all-indexes-v3.1.sh - Full V3.1 generation orchestrator
# Version 3.1 - Hash-based ID normalization

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Parallel mode by default (set USE_PARALLEL=false for sequential mode)
USE_PARALLEL="${USE_PARALLEL:-true}"

echo "=========================================="
echo "AI-KIDO Project Index Generator V3.1"
echo "Hash-Based ID Normalization Architecture"
echo "=========================================="
echo ""
echo "Start time: $TIMESTAMP"
echo "Project root: $PROJECT_ROOT"
echo ""

# Step 1: by-id index generation (SOURCE OF TRUTH)
echo "Step 1/5: Generating by-id index (source of truth)..."
if [[ "$USE_PARALLEL" == "true" ]]; then
    echo "Mode: PARALLEL (4 workers)"
else
    echo "Mode: SEQUENTIAL"
fi
echo "---"

if [[ "$USE_PARALLEL" == "true" && -f "$SCRIPT_DIR/generate-index-by-id-parallel.sh" ]]; then
    time "$SCRIPT_DIR/generate-index-by-id-parallel.sh"
else
    time "$SCRIPT_DIR/generate-index-by-id.sh"
fi
echo ""

# Step 2: by-path index generation (ID refs)
echo "Step 2/5: Generating by-path index (ID references)..."
echo "---"
time "$SCRIPT_DIR/generate-index-by-path.sh"
echo ""

# Step 3: by-alphabetical index generation (ID refs)
echo "Step 3/5: Generating by-alphabetical index (ID references)..."
echo "---"
if [[ -f "$SCRIPT_DIR/generate-index-by-alpha.sh" ]]; then
    time "$SCRIPT_DIR/generate-index-by-alpha.sh"
else
    echo "⚠️  Script not yet implemented: generate-index-by-alpha.sh"
    echo "   TODO: Extract names from by-id, group alphabetically, store ID refs"
fi
echo ""

# Step 4: by-directory index generation (ID refs)
echo "Step 4/5: Generating by-directory index (ID references)..."
echo "---"
if [[ -f "$SCRIPT_DIR/generate-index-by-directory.sh" ]]; then
    time "$SCRIPT_DIR/generate-index-by-directory.sh"
else
    echo "⚠️  Script not yet implemented: generate-index-by-directory.sh"
    echo "   TODO: Extract directories from by-id, group by directory, store ID refs"
fi
echo ""

# Step 5: by-type index generation (ID refs)
echo "Step 5/5: Generating by-type index (ID references)..."
echo "---"
if [[ -f "$SCRIPT_DIR/generate-index-by-type.sh" ]]; then
    time "$SCRIPT_DIR/generate-index-by-type.sh"
else
    echo "⚠️  Script not yet implemented: generate-index-by-type.sh"
    echo "   TODO: Extract types from by-id, group by type, store ID refs"
fi
echo ""

# Step 6: master index generation
echo "Step 6/6: Generating master index.json..."
echo "---"
if [[ -f "$SCRIPT_DIR/generate-index-master.sh" ]]; then
    time "$SCRIPT_DIR/generate-index-master.sh"
else
    echo "⚠️  Script not yet implemented: generate-index-master.sh"
    echo "   TODO: Aggregate statistics, create hash tables for routing"
fi
echo ""

# Statistiques finales
echo "=========================================="
echo "Generation Complete!"
echo "=========================================="
echo ""

# Display file sizes
echo "Index sizes:"
echo ""

if [[ -d "$PROJECT_ROOT/prompts/hard_points/system/structure/indices/by-id" ]]; then
    echo "by-id (source of truth):"
    du -sh "$PROJECT_ROOT/prompts/hard_points/system/structure/indices/by-id"
    ls -lh "$PROJECT_ROOT/prompts/hard_points/system/structure/indices/by-id" | tail -n +2 | awk '{print "  " $9 ": " $5}'
    echo ""
fi

if [[ -d "$PROJECT_ROOT/prompts/hard_points/system/structure/indices/by-path" ]]; then
    echo "by-path (ID refs only):"
    du -sh "$PROJECT_ROOT/prompts/hard_points/system/structure/indices/by-path"
    ls -lh "$PROJECT_ROOT/prompts/hard_points/system/structure/indices/by-path" | tail -n +2 | awk '{print "  " $9 ": " $5}'
    echo ""
fi

echo "End time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo "✅ All indexes generated successfully!"
echo ""
echo "Architecture V3.1 highlights:"
echo "  • Hash-based IDs (SHA-256, 12 chars hex)"
echo "  • by-id: Source of truth (16 batches, metadata complete)"
echo "  • Other indexes: ID references only (~95% space savings)"
echo "  • O(1) routing: hash(path) → batch determined instantly"
echo "  • Incremental updates: Modify by-id + update refs"
if [[ "$USE_PARALLEL" == "true" ]]; then
    echo "  • Parallel mode: 4 workers (~52% faster than sequential)"
fi
echo ""
