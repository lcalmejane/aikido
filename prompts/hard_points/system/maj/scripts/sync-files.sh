#!/usr/bin/env bash
# sync-files.sh - Smart file synchronization
# Compatible: Linux, macOS, Windows Git Bash
# Usage: sync-files.sh <source_file> <target_file> [--force] [--backup]
#
# NOTE: sync-directories.sh parses this script's output using the keywords
#       "identical", "Copy", "newer" and "Keep". Keep them in sync.

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash-only, portable on Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX-sh
fi
# Output colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
SOURCE_FILE="${1:-}"
TARGET_FILE="${2:-}"
FORCE_MODE=false
BACKUP_MODE=false

# Parse arguments
shift 2 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE_MODE=true; shift ;;
    --backup) BACKUP_MODE=true; shift ;;
    *) shift ;;
  esac
done

# Validation
if [[ -z "$SOURCE_FILE" ]] || [[ -z "$TARGET_FILE" ]]; then
  echo -e "${RED}❌ Usage: sync-files.sh <source_file> <target_file> [--force] [--backup]${NC}" >&2
  exit 1
fi

# Function: get modification time (cross-OS compatible)
get_mtime() {
  local file="$1"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    stat -f "%m" "$file" 2>/dev/null || echo "0"
  else
    # Linux / Git Bash
    stat -c "%Y" "$file" 2>/dev/null || echo "0"
  fi
}

# Function: smart backup
backup_file() {
  local file="$1"
  local backup_dir
  backup_dir="$(dirname "$file")/.backup"
  mkdir -p "$backup_dir"
  
  local timestamp
  timestamp=$(date +%Y%m%d-%H%M%S)
  local backup_path="${backup_dir}/$(basename "$file").${timestamp}.bak"
  
  cp "$file" "$backup_path"
  echo -e "${BLUE}  💾 Backup: $backup_path${NC}"
}

# Main logic
main() {
  # Case 1: source does not exist
  if [[ ! -f "$SOURCE_FILE" ]]; then
    if [[ -f "$TARGET_FILE" ]]; then
      echo -e "${GREEN}✅ Source missing, target exists → Keep target${NC}"
      echo "   Target: $TARGET_FILE"
      return 0
    else
      echo -e "${RED}❌ Neither source nor target exists${NC}" >&2
      return 1
    fi
  fi
  
  # Case 2: target does not exist
  if [[ ! -f "$TARGET_FILE" ]]; then
    echo -e "${GREEN}✅ Target missing → Copy from source${NC}"
    mkdir -p "$(dirname "$TARGET_FILE")"
    cp "$SOURCE_FILE" "$TARGET_FILE"
    echo "   Source: $SOURCE_FILE → Target: $TARGET_FILE"
    return 0
  fi
  
  # Case 3: both exist - compare
  if diff -q "$SOURCE_FILE" "$TARGET_FILE" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Files identical → No action${NC}"
    echo "   $TARGET_FILE"
    return 0
  fi
  
  # Case 4: different - pick the newest (or force source)
  local source_mtime target_mtime
  source_mtime=$(get_mtime "$SOURCE_FILE")
  target_mtime=$(get_mtime "$TARGET_FILE")
  
  if [[ "$FORCE_MODE" == true ]]; then
    echo -e "${YELLOW}⚠️  --force mode: source takes priority${NC}"
    [[ "$BACKUP_MODE" == true ]] && backup_file "$TARGET_FILE"
    cp "$SOURCE_FILE" "$TARGET_FILE"
    echo -e "${GREEN}   ✅ $SOURCE_FILE → $TARGET_FILE${NC}"
    return 0
  fi
  
  if [[ "$source_mtime" -gt "$target_mtime" ]]; then
    echo -e "${GREEN}✅ Source newer → Copy${NC}"
    [[ "$BACKUP_MODE" == true ]] && backup_file "$TARGET_FILE"
    cp "$SOURCE_FILE" "$TARGET_FILE"
    echo "   Source: $SOURCE_FILE ($(date -r "$SOURCE_FILE" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'N/A'))"
    echo "   → Target: $TARGET_FILE"
  elif [[ "$target_mtime" -gt "$source_mtime" ]]; then
    echo -e "${BLUE}ℹ️  Target newer → Keep target${NC}"
    echo "   Target: $TARGET_FILE ($(date -r "$TARGET_FILE" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'N/A'))"
  else
    echo -e "${YELLOW}⚠️  Same timestamps but different content → Keep target${NC}"
    echo "   Target: $TARGET_FILE"
  fi
  
  return 0
}

# Execution
main
