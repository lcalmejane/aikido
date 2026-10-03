# AI-KIDO LIGHT - Practical Guide for Lightweight Bases

> **Version**: 1.3.1-LIGHT | **Usage**: Lightweight AI-KIDO configuration for unit agents
>
> This document defines the specific rules for initializing and managing an AI-KIDO base in LIGHT mode.

## REFERENCE TO THE STANDARD

This document is a **specialization** of [`ai-kido.md`](ai-kido.md). All standard rules apply, except those explicitly redefined below for LIGHT mode.

**GENERAL PROMPT PREFIX**:

```
Except for internal "agent-aikido-*" agents: after analyzing the question and before answering, use prompts/index.md for a relevant recursive traversal to retrieve information strictly useful for understanding the request.
```

**EXCEPTIONS**: This pre-prompt does NOT apply:

- To internal AI-KIDO agents (prefix `agent-aikido-*`), which already have the necessary rules

**FUNDAMENTAL PRINCIPLE**: A LIGHT base favors **maximum density** and the **minimum number of files** to approach the **unit agent** notion defined in [`AGENTS.md`](../../AGENTS.md).

## CHARACTERISTICS OF A LIGHT BASE

### Light Mode Goals

1. **Lightness**: Minimum files, maximum efficiency
2. **Density**: Maximum information per file
3. **Simplicity**: Structure reduced to the strict minimum
4. **Unit Agent**: Single-agent or very limited multi-agent approach
5. **Speed**: Minimal traversal time for the LLM

### Differences from Standard Mode

| Aspect | Standard Mode | Light Mode |
|--------|--------------|------------|
| **Concept files** | Multiple thematic files | 1 single unified file |
| **Technique files** | Multiple files per domain | 1 single unified file |
| **Personas** | 6-12 specialized personas | 3-5 personas maximum |
| **Use cases** | 8-15 use cases | 3-5 use cases maximum |
| **RACI** | Full multi-actor matrix | Single or minimal actor (optional) |
| **Tree depth** | 3-4 levels | 2-3 levels maximum |
| **Hard points** | Full structure | Minimal structure |

## ADAPTED ARCHITECTURAL RULES

### Rules Modified for Light Mode

The following rules from [`ai-kido.md`](ai-kido.md) are **adapted** for LIGHT mode:

1. **🌳 Simplified Tree**: Reduced traversal from [`/prompts/index.md`](../index.md)
2. **📊 Theory/Practice Merge**: `concepts/` and `techniques/` may be merged into single files
3. **⚖️ Minimal Tree**: 2-4 children per parent, depth ≤ 3 levels
4. **👥 Limited Agents**: 3-5 personas maximum, unit agent approach preferred
5. **🎭 Single Agent**: No orchestrator needed in light mode
6. **👨‍💼 Optional RACI**: Single actor or minimal RACI (2-3 roles max)


## MANDATORY LIGHT MODE STRUCTURE

### Unified Light Structure (V1.3+)

**MAJOR CHANGE V1.3**: Single entry point `/prompts/index.md` for both mono- AND multi-project light setups.

```
/prompts/
├── index.md                    # 🎯 SINGLE ENTRY POINT - ALWAYS CONSULT FIRST
├── gen/                        # Collective knowledge - LIGHT VERSION
│   ├── concepts/               # 1 SINGLE unified file recommended
│   │   └── core-concepts.md    # All concepts merged
│   ├── techniques/             # 1 SINGLE unified file recommended
│   │   └── core-techniques.md  # All techniques merged
│   ├── personas/               # 3-5 personas MAXIMUM
│   │   ├── index.md
│   │   ├── persona-1.md
│   │   ├── persona-2.md
│   │   └── persona-3.md        # (optional: 4 and 5)
│   └── use_cases/              # 3-5 use cases MAXIMUM
│       ├── index.md
│       ├── use-case-1.md
│       ├── use-case-2.md
│       └── use-case-3.md       # (optional: 4 and 5)
├── hard_points/                # Immutable truths - MINIMAL VERSION
│   ├── index.md                # Hard points index
│   ├── ai-kido-light.md        # This file
│   └── [1-3 hard points max]   # Critical constraints only
└── spec/                       # Personal spaces (optional)
    └── logs/                   # Logs if LLM_TRACIBILITY=TRUE
```

### Multi-Project Light Structure (V1.3+)

```
/prompts/
├── index.md                    # 🎯 SINGLE ENTRY POINT - Aggregates all projects
│                               #    Points to /prompts/[project-1]/index.md, /prompts/[project-2]/index.md, etc.
├── [project-1]/
│   ├── index.md                # 📚 Project-1 entry point (references gen/, hard_points/)
│   ├── gen/                    # Project-1 knowledge (light)
│   │   ├── index.md            # Internal navigator for project-1 gen/
│   │   ├── concepts/core-concepts.md
│   │   ├── techniques/core-techniques.md
│   │   ├── personas/           # 3-5 max
│   │   └── use_cases/          # 3-5 max
│   └── hard_points/            # 1-3 max
├── [project-2]/
│   ├── index.md                # 📚 Project-2 entry point
│   └── gen/...                 # Same light layout for project-2
└── spec/                       # Personal spaces
```

**Multi-Project Light Navigation**:

1. `/prompts/index.md` → Lists and points to all projects
2. `/prompts/[project-n]/index.md` → Project-specific entry point
3. `/prompts/[project-n]/gen/index.md` → Project internal navigation

## LIGHT MODE CREATION RULES

### Merging Concept and Technique Files

**PRINCIPLE**: Prefer ONE SINGLE file per category to maximize density.

#### Unified Concepts File Structure

```markdown
# Core Concepts - Light Base
> Version: X.Y | Date: YYYY-MM-DD | Mode: LIGHT

## Overview
[Global project vision in 2-3 paragraphs maximum]

## Key Concepts
### Concept 1: [Name]
[Ultra-dense description with Mermaid diagram if relevant]

### Concept 2: [Name]
[Ultra-dense description with Mermaid diagram if relevant]

### Concept 3: [Name]
[Ultra-dense description with Mermaid diagram if relevant]

## Essential Glossary
[Only the 10-15 most critical terms]

## Relationships and Dependencies
[Summary Mermaid diagram]
```

#### Unified Techniques File Structure

```markdown
# Practical Techniques - Light Base
> Version: X.Y | Date: YYYY-MM-DD | Mode: LIGHT

## Overview
[Global technical approach in 2-3 paragraphs]

## Essential Techniques
### Technique 1: [Name]
[Method + concrete example in ultra-dense format]

### Technique 2: [Name]
[Method + concrete example in ultra-dense format]

### Technique 3: [Name]
[Method + concrete example in ultra-dense format]

## Patterns and Best Practices
[Condensed list of critical patterns]

## Tech Stack
[Essential technologies only]
```

### Personas in Light Mode

**CONSTRAINT**: 3-5 personas MAXIMUM
**PRINCIPLE**: RACI is **optional** or **minimal** in light mode.

## ADAPTED LIGHT WORKFLOW

### Standard LLM Workflow in Light Mode

1. **LOGS**: Log if LLM_TRACIBILITY=TRUE (optional in light)
2. **ANALYSIS**: Identify the domain (simplified)
3. **CONSULTATION**: Check [`/prompts/index.md`](../index.md) (light version)
4. **UNIFIED FILES**: Consult `core-concepts.md` and `core-techniques.md`
5. **HARD POINTS**: Check the 1-3 critical constraints
6. **PERSONA**: Adopt one of the 3-5 available personas
7. **ANSWER**: Generate according to standards (maximum density)
8. **VALIDATION**: Check consistency (simplified)

### Light Mode Specific Optimizations

- **Reduced Traversal**: Fewer files to consult
- **Fast Decisions**: Less context to analyze
- **Direct Answers**: Less cross-validation needed
- **Tokens Saved**: Minimal structure = fewer tokens

## INITIALIZING A LIGHT BASE

### Initialization Command

The initialization command must offer the choice between STANDARD and LIGHT mode:

```bash
# Example initialization prompt
Which AI-KIDO mode do you want to initialize?
1. STANDARD mode (full structure, multi-agent)
2. LIGHT mode (minimal structure, unit agent)

Choice: [1/2]
```

### Automatic Creation in Light Mode

When initializing in LIGHT mode, automatically create:

1. **Minimal structure**:
   - `/prompts/index.md` (single entry point V1.3)
   - `/prompts/gen/concepts/core-concepts.md`
   - `/prompts/gen/techniques/core-techniques.md`
   - `/prompts/gen/personas/index.md` + 3 base personas
   - `/prompts/gen/use_cases/index.md` + 3 base use cases

2. **Minimal hard points**:
   - `/prompts/hard_points/index.md` (light version)
   - `/prompts/hard_points/ai-kido-light.md` (this file)

3. **AGENTS.md**: Light version with 3-5 agents maximum

### Standard → Light Migration

To convert a standard base to light:

1. **Merge** the concept files into `core-concepts.md`
2. **Merge** the technique files into `core-techniques.md`
3. **Reduce** personas to 3-5 maximum (merge roles)
4. **Reduce** use cases to 3-5 maximum (critical cases)
5. **Simplify** or remove the RACI if there is a single actor
6. **Update** `AGENTS.md` with the light structure

## LIGHT MODE QUALITY METRICS

### Specific Metrics

- **Number of Files**: ≤ 15 files total in `/prompts/gen/`
- **Number of Personas**: 3-5 maximum
- **Number of Use Cases**: 3-5 maximum
- **Tree Depth**: ≤ 3 levels
- **Density per File**: > 80% useful information
- **LLM Traversal Time**: < 50% of standard mode

### Light Compliance Validation

**Validation Checklist**:

- ✅ Concept files merged or ≤ 3 files
- ✅ Technique files merged or ≤ 3 files
- ✅ 3-5 personas maximum
- ✅ 3-5 use cases maximum
- ✅ RACI absent or minimal (≤ 3 roles)
- ✅ Hard points ≤ 3 files
- ✅ Tree depth ≤ 3 levels
- ✅ Maximum semantic density

## WHEN TO USE LIGHT MODE

### Recommended Use Cases

**LIGHT mode is recommended for**:

- Solo projects or small teams (1-3 people)
- Prototypes and POCs
- Unit microservices
- Simple scripts and tools
- Projects with a well-defined, limited scope
- Contexts requiring fast LLM execution

**STANDARD mode is recommended for**:

- Large teams (4+ people)
- Complex multi-domain projects
- Enterprise applications
- Complex distributed systems
- Projects requiring strong traceability
- Multi-stakeholder contexts

## EVOLVING A LIGHT BASE

### Light → Standard Transition

A light base can evolve to standard if:

- The team grows (> 3 people)
- Complexity increases significantly
- The need for specialization emerges
- The RACI becomes necessary

**Migration Process**:

1. Identify specialization needs
2. Split `core-concepts.md` into thematic files
3. Split `core-techniques.md` into per-domain files
4. Add specialized personas (up to 12)
5. Enrich the use cases (up to 15)
6. Create the full RACI matrix
7. Update to the standard [`ai-kido.md`](ai-kido.md)

### Staying in Light Mode

To keep a base in light mode:

- **Resist the temptation** to add files
- **Merge** rather than create new files
- **Densify** existing content
- **Delete** what becomes obsolete
- **Validate light compliance** regularly

## AGENTS.MD COMPATIBILITY

### AGENTS.md Structure in Light Mode

```markdown
# AI Agents Configuration - Light Mode

## Project Context
- **Project Name**: [Link to /prompts/index.md]
- **Mode**: LIGHT (Unit Agent / Minimal Multi-agent)
- **Architecture**: [Link to /prompts/gen/concepts/core-concepts.md]
- **Tech Stack**: [Link to /prompts/gen/techniques/core-techniques.md]

## Available Agents (3-5 Maximum)

### Agent 1: [Name]
[Link to /prompts/gen/personas/agent-1.md]
**Responsibilities**: [List of covered domains]

### Agent 2: [Name]
[Link to /prompts/gen/personas/agent-2.md]
**Responsibilities**: [List of covered domains]

### Agent 3: [Name]
[Link to /prompts/gen/personas/agent-3.md]
**Responsibilities**: [List of covered domains]

## Agent Interaction (Optional in Light)
[Minimal RACI matrix if applicable, otherwise "Unit Agent"]

## Usage Guidelines
[Link to /prompts/gen/use_cases/index.md - 3-5 cases maximum]
```

## CRITICAL LIGHT MODE RULES

### Non-Negotiable Rules

1. **Maximum 5 Personas**: Never more, merging mandatory if exceeded
2. **Maximum 5 Use Cases**: Critical cases selection only
3. **Unified Files Preferred**: 1 concepts file + 1 techniques file recommended
4. **Maximum Density**: Every word must add value
5. **Optional RACI**: Single or minimal actor (≤ 3 roles)
6. **Depth ≤ 3**: Flat tree preferred
7. **Minimal Hard Points**: ≤ 3 critical constraints

### Warning Signs

**A light base must be reviewed if**:

- Number of files > 15 in `/prompts/gen/`
- Number of personas > 5
- Number of use cases > 5
- Tree depth > 3 levels
- RACI with > 3 roles
- LLM traversal time > 50% of standard

**Action**: Either densify/merge, or migrate to standard mode.

---

**CRITICAL REMINDER**: LIGHT mode favors **density** and **simplicity**. Any added complexity must be justified or must trigger a migration to STANDARD mode.
**CRITICAL REMINDER**: Internal `agent-aikido-*` agents always return to the mode or agent that called them by running `switch_mode` with the caller's `mode_slug`. Returns between modes/internal agents are in JSON format (an internal agent cannot invoke itself autonomously). Internal agents must always be named in full with the `agent-aikido-` prefix.

**REFERENCE**: For the complete rules, see [`ai-kido.md`](ai-kido.md).
