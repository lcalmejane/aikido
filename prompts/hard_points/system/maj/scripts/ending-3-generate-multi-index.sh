#!/usr/bin/env bash
# ending-3-generate-multi-index.sh - Generate multi-project index
# Usage: ending-3-generate-multi-index.sh <source_dir> <project_names>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"
shift
PROJECT_NAMES=("$@")

echo "📝 Creating multi-project index..."

# Index global
cat > "$SOURCE_DIR/prompts/index.md" <<'INDEX_GLOBAL_START'
# AI-KIDO Knowledge Base – Multi-Projet

> **Version**: 1.3 | **Type**: MULTI-PROJECT | **Entry Point**: `/prompts/index.md`

This file is the **global entry point** for an AI‑KIDO **multi-project** environment.

## Navigation par Projet

This workspace contains several AI‑KIDO projects. Select a project to access its Memory Bank:

INDEX_GLOBAL_START

for project_name in "${PROJECT_NAMES[@]}"; do
  echo "- **[$project_name]($project_name/index.md)** : Entry point of project $project_name" >> "$SOURCE_DIR/prompts/index.md"
done

cat >> "$SOURCE_DIR/prompts/index.md" <<'INDEX_GLOBAL_END'

## Hard Points Communs

Hard points (immutable truths) are shared across all projects:

- [`hard_points/ai-kido.md`](hard_points/ai-kido.md) : Complete AI-KIDO guide
- [`hard_points/system/`](hard_points/system/) : System tools and skills

---

*Global multi-project index generated automatically by /maj-aikido*
INDEX_GLOBAL_END

echo "✅ Global index created: $SOURCE_DIR/prompts/index.md"

# Index projets
for project_name in "${PROJECT_NAMES[@]}"; do
  PROJECT_INDEX="$SOURCE_DIR/prompts/$project_name/index.md"
  mkdir -p "$SOURCE_DIR/prompts/$project_name"

  cat > "$PROJECT_INDEX" <<INDEX_PROJECT
# AI-KIDO Knowledge Base – Projet $project_name

> **Version**: 1.3 | **Projet** : $project_name | **Type** : Mono-projet dans multi-workspace

This file is the **project-specific entry point** of project **$project_name**.

## Structure du Projet

- [\`gen/concepts/\`](gen/concepts/index.md) : Core concepts
- [\`gen/techniques/\`](gen/techniques/index.md) : Practical methods
- [\`gen/personas/\`](gen/personas/index.md) : Role-based prompts
- [\`gen/use_cases/\`](gen/use_cases/index.md) : Context-based applications
- [\`gen/index.md\`](gen/index.md) : Detailed internal navigation

## Hard Points (Shared)

Immutable truths are common to all projects:

- [AI-KIDO Guide](../../hard_points/ai-kido.md)
- [System](../../hard_points/system/)

## Retour

- [← Index Global](../index.md) : Back to the project list

---

*Project index generated automatically by /maj-aikido*
INDEX_PROJECT

  echo "   ✅ $PROJECT_INDEX created"
done
