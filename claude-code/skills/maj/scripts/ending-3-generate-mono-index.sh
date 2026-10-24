#!/usr/bin/env bash
# ending-3-generate-mono-index.sh - Generate mono-project index
# Usage: ending-3-generate-mono-index.sh <source_dir>

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail
else
  set -eu
fi

SOURCE_DIR="${1:-.}"

echo "📝 Creating mono-project index..."

cat > "$SOURCE_DIR/prompts/index.md" <<'INDEX_MONO'
# AI-KIDO Knowledge Base

> **Version**: 1.3 | **Entry Point**: `/prompts/index.md` (UNIFIED since V1.3)

This file is the **SINGLE entry point** of the AI‑KIDO project **Truth Tables**.

## Truth Tables System

The **Truth Tables** are our tree-structured memory system for capitalizing on and structuring AI‑KIDO knowledge in a hierarchical, interconnected way.

### ⚠️ PRIORITY RULES - AI-KIDO

**[AI-KIDO - Complete Guide](hard_points/ai-kido.md)** - ABSOLUTE PRIORITY (V1.3)

- **Architecture**: Tree structure, theory/practice separation, introspection, 500 lines max
- **Self-Feeding**: Automatic trigger on error, adaptive thresholds
- **Agents**: Specialists + orchestrator, semantic density, vector indexing
- **Continuous Improvement**: Automatic evolution based on needs and LLM

## Structure

- [`gen/concepts/`](gen/concepts/index.md) : Core concepts
- [`gen/techniques/`](gen/techniques/index.md) : Practical methods
- [`gen/personas/`](gen/personas/index.md) : Role-based prompts
- [`gen/use_cases/`](gen/use_cases/index.md) : Context-based applications
- [`hard_points/`](hard_points/index.md) : Immutable truths – Absolute priority
  - [`hard_points/system/`](hard_points/system/) : System tools and skills
- [`spec/`](spec/index.md) : Personal space – Ignored unless explicitly enabled
INDEX_MONO

echo "✅ Mono-project index created: $SOURCE_DIR/prompts/index.md"
