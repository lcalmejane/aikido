#!/usr/bin/env bash
# sync-directories.sh - Optimized batch directory synchronization
# Compatible: Linux, macOS, Windows Git Bash
# Usage: sync-directories.sh <source_dir> <target_dir> <pattern> [--force] [--backup]
#
# NOTE: counters are computed by parsing the output of sync-files.sh
#       (keywords "identical", "Copy", "newer", "Keep"). Keep them in sync.

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash-only, portable on Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX-sh
fi
# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
SOURCE_DIR="${1:-}"
TARGET_DIR="${2:-}"
PATTERN="${3:-*.md}"
FORCE_MODE=false
BACKUP_MODE=false

# Parse arguments
shift 3 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE_MODE=true; shift ;;
    --backup) BACKUP_MODE=true; shift ;;
    *) shift ;;
  esac
done

# Validation
if [[ -z "$SOURCE_DIR" ]] || [[ -z "$TARGET_DIR" ]]; then
  echo -e "${RED}❌ Usage: sync-directories.sh <source_dir> <target_dir> <pattern> [--force] [--backup]${NC}" >&2
  exit 1
fi

# Counters
TOTAL=0
COPIED=0
SKIPPED=0
IDENTICAL=0

# Function: locate the sync-files.sh script
find_sync_script() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  echo "${script_dir}/sync-files.sh"
}

SYNC_SCRIPT=$(find_sync_script)

if [[ ! -f "$SYNC_SCRIPT" ]]; then
  echo -e "${RED}❌ Script sync-files.sh not found: $SYNC_SCRIPT${NC}" >&2
  exit 1
fi

# Main function
main() {
  echo -e "${BLUE}🔵 Batch directory synchronization${NC}"
  echo "   Source: $SOURCE_DIR"
  echo "   Target: $TARGET_DIR"
  echo "   Pattern: $PATTERN"
  [[ "$FORCE_MODE" == true ]] && echo "   Mode: --force (source takes priority)"
  [[ "$BACKUP_MODE" == true ]] && echo "   Backup: enabled"
  echo ""
  
  # Check that the source exists
  if [[ ! -d "$SOURCE_DIR" ]]; then
    echo -e "${RED}❌ Source directory does not exist: $SOURCE_DIR${NC}" >&2
    return 1
  fi
  
  # Create target if needed
  mkdir -p "$TARGET_DIR"
  
  # Find all files matching the pattern
  local files=()
  while IFS= read -r -d '' file; do
    files+=("$file")
  done < <(find "$SOURCE_DIR" -maxdepth 1 -type f -name "$PATTERN" -print0 2>/dev/null)
  
  TOTAL=${#files[@]}
  
  if [[ $TOTAL -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  No file found with pattern: $PATTERN${NC}"
    return 0
  fi
  
  echo -e "${BLUE}📊 $TOTAL file(s) to process${NC}"
  echo ""
  
  # Process each file
  local args=""
  [[ "$FORCE_MODE" == true ]] && args="$args --force"
  [[ "$BACKUP_MODE" == true ]] && args="$args --backup"
  
  for source_file in "${files[@]}"; do
    local filename
    filename="$(basename "$source_file")"
    local target_file="${TARGET_DIR}/${filename}"
    
    # Call sync-files.sh
    local output
    if output=$("$SYNC_SCRIPT" "$source_file" "$target_file" $args 2>&1); then
      # Parse output for counters
      if echo "$output" | grep -q "identical"; then
        ((IDENTICAL++))
      elif echo "$output" | grep -q "Copy\|newer"; then
        ((COPIED++))
      else
        ((SKIPPED++))
      fi
      
      # Print compact summary
      if echo "$output" | grep -q "identical"; then
        echo -e "${GREEN}  ✅ $filename (identical)${NC}"
      elif echo "$output" | grep -q "Copy"; then
        echo -e "${GREEN}  ✅ $filename (copied)${NC}"
      elif echo "$output" | grep -q "Keep"; then
        echo -e "${BLUE}  ℹ️  $filename (target kept)${NC}"
      fi
    else
      echo -e "${RED}  ❌ $filename (error)${NC}"
      ((SKIPPED++))
    fi
  done
  
  # Final summary
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ Synchronization complete${NC}"
  echo "   Total: $TOTAL files"
  echo "   Copied: $COPIED"
  echo "   Identical: $IDENTICAL"
  echo "   Kept: $SKIPPED"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  return 0
}

# Execution
main
