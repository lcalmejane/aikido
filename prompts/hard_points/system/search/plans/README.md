# Code Search Plans Index

> **Version**: 1.0 | **Date**: 2025-12-09 | **Purpose**: Hierarchical Search Plan System

## 📋 Overview

This structure contains the **search plans** used by `agent-aikido-explore-code` to explore project source code. Each plan is specialized for a technology/language and defines:

- **File Patterns** : File extensions to search
- **Exclusions** : Directories/files to ignore
- **Search Patterns** : Regex for imports, declarations, keywords
- **Extension Strategy** : How to follow dependencies
- **Output Format** : Output template for this technology
- **Context Extraction** : Metadata to extract per element type

## 🗂️ Hierarchical Structure

Plans are organized hierarchically to allow resolution by specificity:

```
plans/
├── README.md                    # This file
├── plan-generic.md              # Universal fallback plan
├── php/
│   ├── plan.md                  # Generic PHP plan
│   └── 8/
│       └── plan.md              # PHP 8 specific plan (TODO)
├── javascript/
│   ├── plan.md                  # Generic JS/TS plan
│   └── react/
│       └── plan.md              # React specific plan (TODO)
├── python/
│   └── plan.md                  # Python plan (TODO)
├── java/
│   └── plan.md                  # Java plan (TODO)
├── go/
│   └── plan.md                  # Go plan (TODO)
├── rust/
│   └── plan.md                  # Rust plan (TODO)
└── ruby/
    └── plan.md                  # Ruby plan (TODO)
```

## 🔍 Plan Resolution Logic

The `agent-aikido-explore-code` agent selects the plan according to this logic:

### Resolution Algorithm

```python
def resolve_search_plan(tech: str, version: str = None, framework: str = None) -> str:
    """
    Resolves the most specific available search plan.

    Priority (most specific to most generic):
    1. plans/{tech}/{version}/{framework}/plan.md
    2. plans/{tech}/{version}/plan.md
    3. plans/{tech}/{framework}/plan.md
    4. plans/{tech}/plan.md
    5. plans/plan-generic.md (fallback)
    """
    base = "prompts/hard_points/system/search/plans"

    # Level 1: Tech + Version + Framework (most specific)
    if version and framework:
        path = f"{base}/{tech}/{version}/{framework}/plan.md"
        if exists(path): return path

    # Level 2: Tech + Version
    if version:
        path = f"{base}/{tech}/{version}/plan.md"
        if exists(path): return path

    # Level 3: Tech + Framework
    if framework:
        path = f"{base}/{tech}/{framework}/plan.md"
        if exists(path): return path

    # Level 4: Generic tech
    path = f"{base}/{tech}/plan.md"
    if exists(path): return path

    # Level 5: Generic fallback
    return f"{base}/plan-generic.md"
```

### Resolution Examples

| Tech | Version | Framework | Resolved Plan |
|------|---------|-----------|-------------|
| `php` | `8` | - | `plans/php/8/plan.md` (if exists) → `plans/php/plan.md` ✅ |
| `javascript` | - | `react` | `plans/javascript/react/plan.md` → `plans/javascript/plan.md` ✅ |
| `python` | `3.11` | `django` | `plans/python/3.11/django/plan.md` → ... → `plan-generic.md` |
| `rust` | - | - | `plans/rust/plan.md` → `plan-generic.md` ✅ (fallback) |
| `unknown` | - | - | `plan-generic.md` ✅ (fallback) |

## 📦 Available Plans (Status)

### ✅ Available

| Plan | Path | Description | Lines |
|------|------|-------------|--------|
| **Generic** | `plan-generic.md` | Universal fallback, all languages | ~450 |
| **PHP** | `php/plan.md` | Generic PHP (PSR-4, Composer) | ~350 |
| **JavaScript/TypeScript** | `javascript/plan.md` | Generic JS/TS (ES6+, React, Vue, Angular) | ~400 |

### ⏳ To Create (TODO)

| Plan | Path | Description | Priority |
|------|------|-------------|----------|
| **Python** | `python/plan.md` | Generic Python (imports, classes, decorators) | High |
| **Java** | `java/plan.md` | Generic Java (packages, classes, annotations) | High |
| **Go** | `go/plan.md` | Generic Go (packages, structs, interfaces) | Medium |
| **Rust** | `rust/plan.md` | Generic Rust (crates, mods, traits) | Medium |
| **Ruby** | `ruby/plan.md` | Generic Ruby (gems, classes, modules) | Low |
| **PHP 8** | `php/8/plan.md` | PHP 8 specific (attributes, union types) | Low |
| **React** | `javascript/react/plan.md` | React specific (hooks, components, JSX) | Medium |

## 🎯 How to Create a New Plan

### 1. Identify the Specialization

- **Generic language** ? → `plans/{lang}/plan.md`
- **Specific version** ? → `plans/{lang}/{version}/plan.md`
- **Specific framework** ? → `plans/{lang}/{framework}/plan.md`

### 2. Plan Template

```markdown
# {Technology} Code Search Plan

> **Version**: 1.0 | **Date**: YYYY-MM-DD | **Type**: Search Plan | **Language**: {Tech}

## 📋 Overview
[Plan description and use cases]

## 🔍 File Patterns
### Priority extensions
[List of *.ext]

### Standard exclusions
[List of directories to ignore]

## 🎯 Search Method
**Type**: `naive` | `semantic` | `ast-based`

## 📦 Search Patterns
### 1. Imports/Dependencies
[Regex to detect imports]

### 2. Declarations (classes, functions, interfaces)
[Regex to detect declarations]

### 3. Language-specific keywords
[List of important keywords]

## 🔄 Extension Strategy
[How to follow dependencies and resolve imports]

## 📤 Output Format
[Markdown output template with examples]

## 🧠 Context Extraction
[Metadata to extract per type: classes, functions, etc.]

## ⚡ Performance Optimization
[Optimized commands (rg, grep, find)]

## 🎓 Framework/Version-Specific Patterns (if applicable)
[Patterns specific to a framework or version]

## 📋 Usage Example
[Concrete usage example for this plan]
```

### 3. Creation Checklist

- [ ] Identify main file extensions
- [ ] List directories to exclude (vendor, node_modules, etc.)
- [ ] Define regex patterns for:
  - [ ] Imports/Requires
  - [ ] Class/interface declarations
  - [ ] Function/method declarations
  - [ ] Language-specific keywords
- [ ] Implement import resolution (relative, absolute, package)
- [ ] Define structured output format
- [ ] Identify key metadata to extract per type
- [ ] Test with a real project in this technology
- [ ] Document framework-specific patterns (if applicable)

### 4. Examples of Well-Designed Plans

See:
- `plan-generic.md` : Universal fallback with multi-language detection
- `php/plan.md` : PSR-4 aware, Composer, Laravel/Symfony patterns
- `javascript/plan.md` : ES Modules + CommonJS, TypeScript, React/Vue/Angular

## 🔧 Customization & Extension

### Adding a Technology

```bash
# 1. Create the directory
mkdir -p prompts/hard_points/system/search/plans/{new_tech}

# 2. Create the base plan
cp plans/plan-generic.md plans/{new_tech}/plan.md

# 3. Customize the plan (see template above)
# 4. Test with agent-aikido-explore-code

# 5. (Optional) Add version/framework specific plan
mkdir -p plans/{new_tech}/{version_or_framework}
cp plans/{new_tech}/plan.md plans/{new_tech}/{version_or_framework}/plan.md
# Customize with specific patterns
```

### Adding a Specific Version/Framework

```bash
# Example: PHP 8 with attributes
mkdir -p plans/php/8
cp plans/php/plan.md plans/php/8/plan.md

# Edit plans/php/8/plan.md to add:
# - Patterns for attributes (#[Attribute])
# - Union types (string|int)
# - Named arguments
# - Constructor property promotion
```

## 📊 Performance Metrics

### Current Plans

| Plan | Avg Execution Time | Avg Tokens | Files/s | Accuracy |
|------|-------------------|------------|---------|----------|
| **generic** | ~20s | ~2000 | 50 | 75% |
| **php** | ~18s | ~1800 | 55 | 90% |
| **javascript** | ~19s | ~1900 | 52 | 88% |

### Performance Goals

- **Execution Time** : < 25s for 100 files
- **Token Budget** : < 2500 tokens per search
- **Accuracy** : > 85% (correct element detection)
- **Coverage** : > 95% (no false negatives)

## 🎓 Best Practices

### When Creating Plans

1. **Specificity** : The more specific the plan, the better it is (hierarchy)
2. **Tested Patterns** : Validate all regex with real examples
3. **Exclusions** : Always exclude vendor/node_modules/build
4. **Performance** : Prefer `rg` (ripgrep) over `grep` for speed
5. **Documentation** : Include concrete examples of expected output

### When Using Plans

1. **Auto-Detection** : Let the agent detect the technology automatically
2. **Fallback** : The generic plan must always work (last option)
3. **Validation** : Verify that the selected plan matches the technology
4. **Feedback** : Report false positives/negatives to improve patterns

## 🔗 Integration with agent-aikido-explore-code

### Complete Workflow

```mermaid
graph TD
    A[User Query] --> B[agent-aikido-explore-code invoked]
    B --> C{Tech Detection}
    C -->|AGENTS.md| D[Extract tech stack]
    C -->|Project files| E[Detect from files]
    D --> F[Adjust tech based on query]
    E --> F
    F --> G{Resolve Search Plan}
    G -->|Try specific| H[plans/{tech}/{version}/plan.md]
    G -->|Try generic| I[plans/{tech}/plan.md]
    G -->|Fallback| J[plans/plan-generic.md]
    H -->|Found| K[Load Plan]
    H -->|Not found| I
    I -->|Found| K
    I -->|Not found| J
    J --> K
    K --> L[Extract Patterns]
    L --> M[Execute Search]
    M --> N[Extract Metadata]
    N --> O[Build Relationships]
    O --> P[Format Output]
    P --> Q[Return Index]
```

### Invocation Examples

```bash
# Example 1: PHP Laravel project
# Query: "authentication system"
# Tech detected: php (via composer.json)
# Plan resolved: plans/php/plan.md
# Output: Classes, interfaces, traits, dependencies with PSR-4 resolution

# Example 2: React TypeScript project
# Query: "user profile component"
# Tech detected: javascript + typescript (via package.json + tsconfig.json)
# Framework: react (via package.json dependencies)
# Plan resolved: plans/javascript/plan.md (react subplan if available)
# Output: Components, hooks, props interfaces, dependencies

# Example 3: Unknown project
# Query: "config loader"
# Tech detected: none
# Plan resolved: plans/plan-generic.md (fallback)
# Output: Generic file patterns, basic declarations
```

## 📚 References

- **Main agent** : `prompts/hard_points/agents/agent-aikido-explore-code.md`
- **Generic plan** : `plan-generic.md`
- **Plan examples** : `php/plan.md`, `javascript/plan.md`
- **AI-KIDO documentation** : `prompts/hard_points/ai-kido.md`

---
*Index created on 2025-12-09 for the AI-KIDO code search plan system*
*Maintained automatically when new plans are added*
