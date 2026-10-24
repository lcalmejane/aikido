# AI‑KIDO LIGHT – Practical Guide for Minimal Footprint Bases

> **Version**: 1.3.1‑LIGHT | **Usage**: Lightweight AI‑KIDO configuration for single-actor agents

## GENERAL PROMPT PREFIX
```text
Except for internal "agent‑aikido‑*" agents, after analyzing the question and before answering it, use the prompts/index.md file to perform a relevant recursive traversal in order to retrieve information strictly useful to understanding the request.
```

## EXCEPTIONS
- Internal AI‑KIDO agents (prefix `agent‑aikido‑*`) which already possess the necessary rules

## NATURE: METHOD + META-HARNESS
AI‑KIDO is a **method**; its tools are a **meta-harness** whose agents, skills and tools build an ad-hoc harness on the fly per task, each harness yielding a reusable use case. See [Method and meta-harness](ai-kido_details.md#method-and-meta-harness).

## KEY PRINCIPLES OF LIGHT MODE
1. **Lightness / Minimal footprint**: Minimum files, maximum efficiency.  
2. **Density**: Maximum information per file.  
3. **Simplicity**: Structure reduced to the strict minimum.  
4. **Single Actor**: Mono-agent or very restricted multi-agent approach.  
5. **Speed**: Minimal traversal time for the LLM.

## DIFFERENCES WITH STANDARD MODE
| Aspect | Standard | Light |
|--------|----------|-------|
| **Concept files** | Multiple | 1 single unified file |
| **Technique files** | Multiple | 1 single unified file |
| **Personas** | 6‑12 | 3‑5 maximum |
| **Use cases** | 8‑15 | 3‑5 maximum |
| **Tree structure depth** | 3‑4 levels | ≤ 3 levels |
| **Hard points** | Full structure | Minimal structure |

## ADAPTED ARCHITECTURAL RULES (excerpts)
- **Simplified Tree Structure**: Reduced traversal from `prompts/index.md`.  
- **Theory/Practice Merge**: Possibility to merge `concepts/` and `techniques/` into single files.  
- **Minimal Tree**: Factor 2‑4 children/parent, depth ≤ 3 levels.  
- **Restricted Agents**: 3‑5 personas maximum, single-actor approach preferred.  
- **Optional RACI**: Single actor or minimal (2‑3 roles max).  

## MANDATORY STRUCTURE LIGHT MODE
```
/prompts/
├── index.md                    # Single entry point
├── gen/
│   ├── concepts/               # 1 unified file recommended
│   │   └── core-concepts.md
│   ├── techniques/             # 1 unified file recommended
│   │   └── core-techniques.md
│   ├── personas/               # 3‑5 personas max
│   └── use_cases/              # 3‑5 use cases max
└── hard_points/
    ├── index.md
    ├── ai-kido-light.md        # <‑ This file
    └── [≤ 3 hard points]       # Critical constraints only
```

## LIGHT MODE CREATION RULES
- **Merge of Concepts & Techniques files**: One single file per category.  
- **Personas**: Maximum 5, each versatile.  
- **Use Cases**: Maximum 5, critical scenarios only.  
- **RACI**: Optional or minimal (≤ 3 roles).  

## LIGHT MODE QUALITY METRICS
- **Total files**: ≤ 15 in `/prompts/gen/`.  
- **Personas**: 3‑5 max.  
- **Use Cases**: 3‑5 max.  
- **Depth**: ≤ 3 levels.  
- **Semantic density**: > 80% useful information.  
- **LLM traversal time**: < 50% of standard mode.  

<details>
<summary>View the rest of the detailed document</summary>
[View full content](`prompts/hard_points/ai-kido-light_details.md`)
</details>
