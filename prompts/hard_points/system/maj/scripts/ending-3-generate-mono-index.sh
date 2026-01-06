#!/usr/bin/env bash
# ending-3-generate-mono-index.sh - Générer index mono-projet
# Usage: ending-3-generate-mono-index.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo "📝 Création index mono-projet..."

cat > "$SOURCE_DIR/prompts/index.md" <<'INDEX_MONO'
# AI-KIDO Knowledge Base

> **Version**: 1.3 | **Point d'Entrée** : `/prompts/index.md` (UNIFIÉ depuis V1.3)

Ce fichier constitue le **point d'entrée UNIQUE** des **Tables de Vérités** du projet AI‑KIDO.

## Système des Tables de Vérités

Les **Tables de Vérités** constituent notre système de mémoire arborescente permettant de capitaliser et structurer les connaissances AI‑KIDO de manière hiérarchique et interconnectée.

### ⚠️ RÈGLES PRIORITAIRES - AI-KIDO

**[AI-KIDO - Guide Complet](hard_points/ai-kido.md)** - PRIORITÉ ABSOLUE (V1.3)

- **Architecture** : Arborescence, séparation théorie/pratique, introspection, 500 lignes max
- **Auto-Alimentation** : Déclenchement automatique sur erreur, seuils adaptatifs
- **Agents** : Spécialistes + orchestrateur, densité sémantique, indexation vectorielle
- **Amélioration Continue** : Évolution automatique selon besoins et LLM

## Structure

- [`gen/concepts/`](gen/concepts/index.md) : Concepts fondamentaux
- [`gen/techniques/`](gen/techniques/index.md) : Méthodes pratiques
- [`gen/personas/`](gen/personas/index.md) : Prompts par rôle
- [`gen/use_cases/`](gen/use_cases/index.md) : Applications par contexte
- [`hard_points/`](hard_points/index.md) : Vérités immuables – Priorité absolue
  - [`hard_points/system/`](hard_points/system/) : Outils système et skills
- [`spec/`](spec/index.md) : Espace personnel – Ignoré sauf activation explicite
INDEX_MONO

echo "✅ Index mono-projet créé : $SOURCE_DIR/prompts/index.md"
