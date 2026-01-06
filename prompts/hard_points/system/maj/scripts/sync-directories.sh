#!/usr/bin/env bash
# sync-directories.sh - Synchronisation batch optimisée de répertoires
# Compatible: Linux, macOS, Windows Git Bash
# Usage: sync-directories.sh <source_dir> <target_dir> <pattern> [--force] [--backup]

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi
# Couleurs
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

# Compteurs
TOTAL=0
COPIED=0
SKIPPED=0
IDENTICAL=0

# Fonction: Trouver script sync-files.sh
find_sync_script() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  echo "${script_dir}/sync-files.sh"
}

SYNC_SCRIPT=$(find_sync_script)

if [[ ! -f "$SYNC_SCRIPT" ]]; then
  echo -e "${RED}❌ Script sync-files.sh introuvable: $SYNC_SCRIPT${NC}" >&2
  exit 1
fi

# Fonction principale
main() {
  echo -e "${BLUE}🔵 Synchronisation répertoire batch${NC}"
  echo "   Source: $SOURCE_DIR"
  echo "   Target: $TARGET_DIR"
  echo "   Pattern: $PATTERN"
  [[ "$FORCE_MODE" == true ]] && echo "   Mode: --force (source prioritaire)"
  [[ "$BACKUP_MODE" == true ]] && echo "   Backup: activé"
  echo ""
  
  # Vérifier source existe
  if [[ ! -d "$SOURCE_DIR" ]]; then
    echo -e "${RED}❌ Répertoire source inexistant: $SOURCE_DIR${NC}" >&2
    return 1
  fi
  
  # Créer target si nécessaire
  mkdir -p "$TARGET_DIR"
  
  # Trouver tous les fichiers matchant le pattern
  local files=()
  while IFS= read -r -d '' file; do
    files+=("$file")
  done < <(find "$SOURCE_DIR" -maxdepth 1 -type f -name "$PATTERN" -print0 2>/dev/null)
  
  TOTAL=${#files[@]}
  
  if [[ $TOTAL -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  Aucun fichier trouvé avec pattern: $PATTERN${NC}"
    return 0
  fi
  
  echo -e "${BLUE}📊 $TOTAL fichier(s) à traiter${NC}"
  echo ""
  
  # Traiter chaque fichier
  local args=""
  [[ "$FORCE_MODE" == true ]] && args="$args --force"
  [[ "$BACKUP_MODE" == true ]] && args="$args --backup"
  
  for source_file in "${files[@]}"; do
    local filename
    filename="$(basename "$source_file")"
    local target_file="${TARGET_DIR}/${filename}"
    
    # Appeler sync-files.sh
    local output
    if output=$("$SYNC_SCRIPT" "$source_file" "$target_file" $args 2>&1); then
      # Analyser output pour compteurs
      if echo "$output" | grep -q "identiques"; then
        ((IDENTICAL++))
      elif echo "$output" | grep -q "Copier\|plus récent"; then
        ((COPIED++))
      else
        ((SKIPPED++))
      fi
      
      # Afficher résumé compact
      if echo "$output" | grep -q "identiques"; then
        echo -e "${GREEN}  ✅ $filename (identique)${NC}"
      elif echo "$output" | grep -q "Copier"; then
        echo -e "${GREEN}  ✅ $filename (copié)${NC}"
      elif echo "$output" | grep -q "Conserver"; then
        echo -e "${BLUE}  ℹ️  $filename (target conservé)${NC}"
      fi
    else
      echo -e "${RED}  ❌ $filename (erreur)${NC}"
      ((SKIPPED++))
    fi
  done
  
  # Résumé final
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ Synchronisation terminée${NC}"
  echo "   Total: $TOTAL fichiers"
  echo "   Copiés: $COPIED"
  echo "   Identiques: $IDENTICAL"
  echo "   Conservés: $SKIPPED"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  return 0
}

# Exécution
main
