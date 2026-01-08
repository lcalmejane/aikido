#!/usr/bin/env bash
# ending-8-deploy-agents.sh
# Déploie les mappings d'agents depuis TARGET vers SOURCE
# Usage: ending-8-deploy-agents.sh <TARGET> <SOURCE>

set -euo pipefail

TARGET="${1:-.}"
SOURCE="${2:-.}"

DEPLOYED_COUNT=0

echo "🤖 Déploiement mappings agents (TARGET → SOURCE)..."

# Créer répertoire dans SOURCE si nécessaire
mkdir -p "$SOURCE/.claude/agents"

# Déployer .claude/agents
if [ -d "$TARGET/.claude/agents" ]; then
  AGENTS_COUNT=$(find "$TARGET/.claude/agents" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

  if [ "$AGENTS_COUNT" -gt 0 ]; then
    echo "  Copie $AGENTS_COUNT fichier(s) depuis TARGET/.claude/agents → SOURCE/.claude/agents..."

    find "$TARGET/.claude/agents" -name "*.md" -type f | while read -r file; do
      filename=$(basename "$file")

      # Backup si fichier existe déjà dans SOURCE
      if [ -f "$SOURCE/.claude/agents/$filename" ]; then
        BACKUP_NAME="${filename}.bak.$(date +%Y%m%d-%H%M%S)"
        cp "$SOURCE/.claude/agents/$filename" "$SOURCE/.claude/agents/$BACKUP_NAME"
        echo "    📦 Backup : $BACKUP_NAME"
      fi

      # Copier TARGET → SOURCE
      cp "$file" "$SOURCE/.claude/agents/$filename"
      echo "    ✅ $filename"
    done

    DEPLOYED_COUNT=$AGENTS_COUNT
  else
    echo "  ℹ️  Aucun fichier trouvé dans TARGET/.claude/agents"
  fi
else
  echo "  ℹ️  Répertoire .claude/agents inexistant dans TARGET"
fi

# Retour
echo "✅ $DEPLOYED_COUNT agents déployés (TARGET → SOURCE)"
echo "$DEPLOYED_COUNT"
