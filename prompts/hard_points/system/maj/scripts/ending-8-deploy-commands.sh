#!/usr/bin/env bash
# ending-8-deploy-commands.sh
# Déploie les mappings de commandes depuis TARGET vers SOURCE
# Usage: ending-8-deploy-commands.sh <TARGET> <SOURCE>

set -euo pipefail

TARGET="${1:-.}"
SOURCE="${2:-.}"

DEPLOYED_COUNT=0

echo "📦 Déploiement mappings commands (TARGET → SOURCE)..."

# Créer répertoires dans SOURCE si nécessaire
mkdir -p "$SOURCE/.roo/commands"
mkdir -p "$SOURCE/.claude/commands"

# Déployer .roo/commands
if [ -d "$TARGET/.roo/commands" ]; then
  ROO_COUNT=$(find "$TARGET/.roo/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$ROO_COUNT" -gt 0 ]; then
    echo "  Copie $ROO_COUNT fichier(s) depuis TARGET/.roo/commands → SOURCE/.roo/commands..."

    find "$TARGET/.roo/commands" -name "*.md" -type f | while read -r file; do
      filename=$(basename "$file")

      # Backup si fichier existe déjà dans SOURCE
      if [ -f "$SOURCE/.roo/commands/$filename" ]; then
        BACKUP_NAME="${filename}.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$SOURCE/.roo/commands/$filename" "$SOURCE/.roo/commands/$BACKUP_NAME"
        echo "    📦 Backup : $BACKUP_NAME"
      fi

      # Copier TARGET → SOURCE
      cp "$file" "$SOURCE/.roo/commands/$filename"
      echo "    ✅ $filename"
    done

    DEPLOYED_COUNT=$((DEPLOYED_COUNT + ROO_COUNT))
  else
    echo "  ℹ️  Aucun fichier trouvé dans TARGET/.roo/commands"
  fi
else
  echo "  ℹ️  Répertoire .roo/commands inexistant dans TARGET"
fi

# Déployer .claude/commands
if [ -d "$TARGET/.claude/commands" ]; then
  CLAUDE_COUNT=$(find "$TARGET/.claude/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$CLAUDE_COUNT" -gt 0 ]; then
    echo "  Copie $CLAUDE_COUNT fichier(s) depuis TARGET/.claude/commands → SOURCE/.claude/commands..."

    find "$TARGET/.claude/commands" -name "*.md" -type f | while read -r file; do
      filename=$(basename "$file")

      # Backup si fichier existe déjà dans SOURCE
      if [ -f "$SOURCE/.claude/commands/$filename" ]; then
        BACKUP_NAME="${filename}.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$SOURCE/.claude/commands/$filename" "$SOURCE/.claude/commands/$BACKUP_NAME"
        echo "    📦 Backup : $BACKUP_NAME"
      fi

      # Copier TARGET → SOURCE
      cp "$file" "$SOURCE/.claude/commands/$filename"
      echo "    ✅ $filename"
    done

    DEPLOYED_COUNT=$((DEPLOYED_COUNT + CLAUDE_COUNT))
  else
    echo "  ℹ️  Aucun fichier trouvé dans TARGET/.claude/commands"
  fi
else
  echo "  ℹ️  Répertoire .claude/commands inexistant dans TARGET"
fi

# Retour
echo "✅ $DEPLOYED_COUNT commandes déployées (TARGET → SOURCE)"
echo "$DEPLOYED_COUNT"
