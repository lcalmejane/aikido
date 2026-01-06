#!/usr/bin/env bash
# ending-3-generate-multi-index.sh - Générer index multi-projet
# Usage: ending-3-generate-multi-index.sh <source_dir> <project_names>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"
shift
PROJECT_NAMES=("$@")

echo "📝 Création index multi-projet..."

# Index global
cat > "$SOURCE_DIR/prompts/index.md" <<'INDEX_GLOBAL_START'
# AI-KIDO Knowledge Base – Multi-Projet

> **Version**: 1.3 | **Type** : MULTI-PROJET | **Point d'Entrée** : `/prompts/index.md`

Ce fichier constitue le **point d'entrée global** pour un environnement **multi-projet** AI‑KIDO.

## Navigation par Projet

Ce workspace contient plusieurs projets AI‑KIDO. Sélectionnez le projet pour accéder à sa Memory Bank :

INDEX_GLOBAL_START

for project_name in "${PROJECT_NAMES[@]}"; do
  echo "- **[$project_name]($project_name/index.md)** : Point d'entrée du projet $project_name" >> "$SOURCE_DIR/prompts/index.md"
done

cat >> "$SOURCE_DIR/prompts/index.md" <<'INDEX_GLOBAL_END'

## Hard Points Communs

Les hard points (vérités immuables) sont partagés entre tous les projets :

- [`hard_points/ai-kido.md`](hard_points/ai-kido.md) : Guide complet AI-KIDO
- [`hard_points/system/`](hard_points/system/) : Outils système et skills

---

*Index global multi-projet généré automatiquement par /maj-aikido*
INDEX_GLOBAL_END

echo "✅ Index global créé : $SOURCE_DIR/prompts/index.md"

# Index projets
for project_name in "${PROJECT_NAMES[@]}"; do
  PROJECT_INDEX="$SOURCE_DIR/prompts/$project_name/index.md"
  mkdir -p "$SOURCE_DIR/prompts/$project_name"

  cat > "$PROJECT_INDEX" <<INDEX_PROJECT
# AI-KIDO Knowledge Base – Projet $project_name

> **Version**: 1.3 | **Projet** : $project_name | **Type** : Mono-projet dans multi-workspace

Ce fichier est le **point d'entrée spécifique** du projet **$project_name**.

## Structure du Projet

- [\`gen/concepts/\`](gen/concepts/index.md) : Concepts fondamentaux
- [\`gen/techniques/\`](gen/techniques/index.md) : Méthodes pratiques
- [\`gen/personas/\`](gen/personas/index.md) : Prompts par rôle
- [\`gen/use_cases/\`](gen/use_cases/index.md) : Applications par contexte
- [\`gen/index.md\`](gen/index.md) : Navigation interne détaillée

## Hard Points (Partagés)

Les vérités immuables sont communes à tous les projets :

- [AI-KIDO Guide](../../hard_points/ai-kido.md)
- [Système](../../hard_points/system/)

## Retour

- [← Index Global](../index.md) : Retour à la liste des projets

---

*Index projet généré automatiquement par /maj-aikido*
INDEX_PROJECT

  echo "   ✅ $PROJECT_INDEX créé"
done
