#!/usr/bin/env bash
# ending-8-deploy-root-files.sh
# Déploie les fichiers racine essentiels depuis TARGET vers SOURCE
# Usage: ending-8-deploy-root-files.sh <TARGET> <SOURCE>

set -euo pipefail

TARGET="${1:-.}"
SOURCE="${2:-.}"

DEPLOYED_COUNT=0

echo "📄 Déploiement fichiers racine (TARGET → SOURCE)..."

# Liste des fichiers racine à déployer
ROOT_FILES=(
  "AGENTS.md"
  "CLAUDE.md"
  "commands_list.md"
  "agents_list.md"
  "skills_list.md"
  ".roomodes"
)

for file in "${ROOT_FILES[@]}"; do
  if [ -f "$TARGET/$file" ]; then
    # Backup si fichier existe déjà dans SOURCE
    if [ -f "$SOURCE/$file" ]; then
      BACKUP_NAME="${file}.bak.$(date +%Y%m%d-%H%M%S)"
      cp "$SOURCE/$file" "$SOURCE/$BACKUP_NAME"
      echo "  📦 Backup créé : $BACKUP_NAME"
    fi

    # Copier TARGET → SOURCE
    cp "$TARGET/$file" "$SOURCE/$file"
    echo "  ✅ $file"

    DEPLOYED_COUNT=$((DEPLOYED_COUNT + 1))
  else
    # Fichier optionnel manquant dans TARGET (pas une erreur)
    if [ "$file" = ".roomodes" ]; then
      echo "  ℹ️  $file (optionnel, non présent dans TARGET)"
    else
      echo "  ℹ️  $file (non présent dans TARGET)"
    fi
  fi
done

# Retour
echo "✅ $DEPLOYED_COUNT fichiers racine déployés (TARGET → SOURCE)"
echo "$DEPLOYED_COUNT"
