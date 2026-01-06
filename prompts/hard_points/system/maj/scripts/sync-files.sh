#!/usr/bin/env bash
# sync-files.sh - Synchronisation intelligente de fichiers
# Compatible: Linux, macOS, Windows Git Bash
# Usage: sync-files.sh <source_file> <target_file> [--force] [--backup]

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi
# Couleurs pour output
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

# Fonction: Comparer dates de modification (compatible multi-OS)
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

# Fonction: Backup intelligent
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

# Logique principale
main() {
  # Cas 1: Source n'existe pas
  if [[ ! -f "$SOURCE_FILE" ]]; then
    if [[ -f "$TARGET_FILE" ]]; then
      echo -e "${GREEN}✅ Source absente, target existe → Conserver target${NC}"
      echo "   Target: $TARGET_FILE"
      return 0
    else
      echo -e "${RED}❌ Ni source ni target n'existent${NC}" >&2
      return 1
    fi
  fi
  
  # Cas 2: Target n'existe pas
  if [[ ! -f "$TARGET_FILE" ]]; then
    echo -e "${GREEN}✅ Target absent → Copier depuis source${NC}"
    mkdir -p "$(dirname "$TARGET_FILE")"
    cp "$SOURCE_FILE" "$TARGET_FILE"
    echo "   Source: $SOURCE_FILE → Target: $TARGET_FILE"
    return 0
  fi
  
  # Cas 3: Les deux existent - Comparer
  if diff -q "$SOURCE_FILE" "$TARGET_FILE" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Fichiers identiques → Aucune action${NC}"
    echo "   $TARGET_FILE"
    return 0
  fi
  
  # Cas 4: Différents - Choisir le plus récent (ou forcer source)
  local source_mtime target_mtime
  source_mtime=$(get_mtime "$SOURCE_FILE")
  target_mtime=$(get_mtime "$TARGET_FILE")
  
  if [[ "$FORCE_MODE" == true ]]; then
    echo -e "${YELLOW}⚠️  Mode --force: Source prioritaire${NC}"
    [[ "$BACKUP_MODE" == true ]] && backup_file "$TARGET_FILE"
    cp "$SOURCE_FILE" "$TARGET_FILE"
    echo -e "${GREEN}   ✅ $SOURCE_FILE → $TARGET_FILE${NC}"
    return 0
  fi
  
  if [[ "$source_mtime" -gt "$target_mtime" ]]; then
    echo -e "${GREEN}✅ Source plus récent → Copier${NC}"
    [[ "$BACKUP_MODE" == true ]] && backup_file "$TARGET_FILE"
    cp "$SOURCE_FILE" "$TARGET_FILE"
    echo "   Source: $SOURCE_FILE ($(date -r "$SOURCE_FILE" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'N/A'))"
    echo "   → Target: $TARGET_FILE"
  elif [[ "$target_mtime" -gt "$source_mtime" ]]; then
    echo -e "${BLUE}ℹ️  Target plus récent → Conserver target${NC}"
    echo "   Target: $TARGET_FILE ($(date -r "$TARGET_FILE" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'N/A'))"
  else
    echo -e "${YELLOW}⚠️  Dates identiques mais contenu différent → Conserver target${NC}"
    echo "   Target: $TARGET_FILE"
  fi
  
  return 0
}

# Exécution
main
