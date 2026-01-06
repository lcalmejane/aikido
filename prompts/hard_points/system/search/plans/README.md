# Code Search Plans Index

> **Version**: 1.0 | **Date**: 2025-12-09 | **Purpose**: Hierarchical Search Plan System

## 📋 Overview

Cette structure contient les **plans de recherche** utilisés par `agent-aikido-explore-code` pour explorer le code source des projets. Chaque plan est spécialisé pour une technologie/langage et définit :

- **File Patterns** : Extensions de fichiers à chercher
- **Exclusions** : Répertoires/fichiers à ignorer
- **Search Patterns** : Regex pour imports, déclarations, mots-clés
- **Extension Strategy** : Comment suivre les dépendances
- **Output Format** : Template de sortie pour cette technologie
- **Context Extraction** : Métadonnées à extraire par type d'élément

## 🗂️ Structure Hiérarchique

Les plans sont organisés hiérarchiquement pour permettre une résolution par spécificité :

```
plans/
├── README.md                    # Ce fichier
├── plan-generic.md              # Plan fallback universel
├── php/
│   ├── plan.md                  # Plan PHP générique
│   └── 8/
│       └── plan.md              # Plan PHP 8 spécifique (TODO)
├── javascript/
│   ├── plan.md                  # Plan JS/TS générique
│   └── react/
│       └── plan.md              # Plan React spécifique (TODO)
├── python/
│   └── plan.md                  # Plan Python (TODO)
├── java/
│   └── plan.md                  # Plan Java (TODO)
├── go/
│   └── plan.md                  # Plan Go (TODO)
├── rust/
│   └── plan.md                  # Plan Rust (TODO)
└── ruby/
    └── plan.md                  # Plan Ruby (TODO)
```

## 🔍 Plan Resolution Logic

L'agent `agent-aikido-explore-code` sélectionne le plan selon cette logique :

### Algorithme de Résolution

```python
def resolve_search_plan(tech: str, version: str = None, framework: str = None) -> str:
    """
    Résout le plan de recherche le plus spécifique disponible.

    Priorité (du plus spécifique au plus générique) :
    1. plans/{tech}/{version}/{framework}/plan.md
    2. plans/{tech}/{version}/plan.md
    3. plans/{tech}/{framework}/plan.md
    4. plans/{tech}/plan.md
    5. plans/plan-generic.md (fallback)
    """
    base = "prompts/hard_points/system/search/plans"

    # Niveau 1 : Tech + Version + Framework (le plus spécifique)
    if version and framework:
        path = f"{base}/{tech}/{version}/{framework}/plan.md"
        if exists(path): return path

    # Niveau 2 : Tech + Version
    if version:
        path = f"{base}/{tech}/{version}/plan.md"
        if exists(path): return path

    # Niveau 3 : Tech + Framework
    if framework:
        path = f"{base}/{tech}/{framework}/plan.md"
        if exists(path): return path

    # Niveau 4 : Tech générique
    path = f"{base}/{tech}/plan.md"
    if exists(path): return path

    # Niveau 5 : Fallback générique
    return f"{base}/plan-generic.md"
```

### Exemples de Résolution

| Tech | Version | Framework | Plan Résolu |
|------|---------|-----------|-------------|
| `php` | `8` | - | `plans/php/8/plan.md` (si existe) → `plans/php/plan.md` ✅ |
| `javascript` | - | `react` | `plans/javascript/react/plan.md` → `plans/javascript/plan.md` ✅ |
| `python` | `3.11` | `django` | `plans/python/3.11/django/plan.md` → ... → `plan-generic.md` |
| `rust` | - | - | `plans/rust/plan.md` → `plan-generic.md` ✅ (fallback) |
| `unknown` | - | - | `plan-generic.md` ✅ (fallback) |

## 📦 Plans Disponibles (Status)

### ✅ Disponibles

| Plan | Path | Description | Lignes |
|------|------|-------------|--------|
| **Generic** | `plan-generic.md` | Fallback universel, tous langages | ~450 |
| **PHP** | `php/plan.md` | PHP générique (PSR-4, Composer) | ~350 |
| **JavaScript/TypeScript** | `javascript/plan.md` | JS/TS générique (ES6+, React, Vue, Angular) | ~400 |

### ⏳ À Créer (TODO)

| Plan | Path | Description | Priorité |
|------|------|-------------|----------|
| **Python** | `python/plan.md` | Python générique (imports, classes, decorators) | Haute |
| **Java** | `java/plan.md` | Java générique (packages, classes, annotations) | Haute |
| **Go** | `go/plan.md` | Go générique (packages, structs, interfaces) | Moyenne |
| **Rust** | `rust/plan.md` | Rust générique (crates, mods, traits) | Moyenne |
| **Ruby** | `ruby/plan.md` | Ruby générique (gems, classes, modules) | Basse |
| **PHP 8** | `php/8/plan.md` | PHP 8 spécifique (attributes, union types) | Basse |
| **React** | `javascript/react/plan.md` | React spécifique (hooks, components, JSX) | Moyenne |

## 🎯 Comment Créer un Nouveau Plan

### 1. Identifier la Spécialisation

- **Langage générique** ? → `plans/{lang}/plan.md`
- **Version spécifique** ? → `plans/{lang}/{version}/plan.md`
- **Framework spécifique** ? → `plans/{lang}/{framework}/plan.md`

### 2. Template de Plan

```markdown
# {Technology} Code Search Plan

> **Version**: 1.0 | **Date**: YYYY-MM-DD | **Type**: Search Plan | **Language**: {Tech}

## 📋 Overview
[Description du plan et cas d'usage]

## 🔍 File Patterns
### Extensions prioritaires
[Liste des *.ext]

### Exclusions standards
[Liste des répertoires à ignorer]

## 🎯 Search Method
**Type**: `naive` | `semantic` | `ast-based`

## 📦 Patterns de Recherche
### 1. Imports/Dépendances
[Regex pour détecter imports]

### 2. Déclarations (classes, fonctions, interfaces)
[Regex pour détecter déclarations]

### 3. Mots-clés spécifiques
[Liste des keywords importants]

## 🔄 Extension Strategy
[Comment suivre les dépendances et résoudre les imports]

## 📤 Output Format
[Template de sortie Markdown avec exemples]

## 🧠 Context Extraction
[Métadonnées à extraire par type : classes, functions, etc.]

## ⚡ Performance Optimization
[Commandes optimisées (rg, grep, find)]

## 🎓 Framework/Version-Specific Patterns (si applicable)
[Patterns spécifiques à un framework ou version]

## 📋 Usage Example
[Exemple concret d'utilisation du plan]
```

### 3. Checklist de Création

- [ ] Identifier les extensions de fichiers principales
- [ ] Lister les répertoires à exclure (vendor, node_modules, etc.)
- [ ] Définir les patterns regex pour :
  - [ ] Imports/Requires
  - [ ] Déclarations de classes/interfaces
  - [ ] Déclarations de fonctions/méthodes
  - [ ] Mots-clés spécifiques au langage
- [ ] Implémenter la résolution des imports (relative, absolute, package)
- [ ] Définir le format de sortie structuré
- [ ] Identifier les métadonnées clés à extraire par type
- [ ] Tester avec un projet réel de cette technologie
- [ ] Documenter les patterns framework-specific (si applicable)

### 4. Exemples de Plans Bien Conçus

Voir :
- `plan-generic.md` : Fallback universel avec détection multi-langage
- `php/plan.md` : PSR-4 aware, Composer, Laravel/Symfony patterns
- `javascript/plan.md` : ES Modules + CommonJS, TypeScript, React/Vue/Angular

## 🔧 Customization & Extension

### Ajouter une Technologie

```bash
# 1. Créer le répertoire
mkdir -p prompts/hard_points/system/search/plans/{new_tech}

# 2. Créer le plan de base
cp plans/plan-generic.md plans/{new_tech}/plan.md

# 3. Customiser le plan (voir template ci-dessus)
# 4. Tester avec agent-aikido-explore-code

# 5. (Optionnel) Ajouter version/framework spécifique
mkdir -p plans/{new_tech}/{version_or_framework}
cp plans/{new_tech}/plan.md plans/{new_tech}/{version_or_framework}/plan.md
# Customiser avec patterns spécifiques
```

### Ajouter une Version/Framework Spécifique

```bash
# Exemple : PHP 8 avec attributes
mkdir -p plans/php/8
cp plans/php/plan.md plans/php/8/plan.md

# Modifier plans/php/8/plan.md pour ajouter :
# - Patterns pour attributes (#[Attribute])
# - Union types (string|int)
# - Named arguments
# - Constructor property promotion
```

## 📊 Métriques de Performance

### Plans Actuels

| Plan | Avg Execution Time | Avg Tokens | Files/s | Accuracy |
|------|-------------------|------------|---------|----------|
| **generic** | ~20s | ~2000 | 50 | 75% |
| **php** | ~18s | ~1800 | 55 | 90% |
| **javascript** | ~19s | ~1900 | 52 | 88% |

### Objectifs de Performance

- **Execution Time** : < 25s pour 100 fichiers
- **Token Budget** : < 2500 tokens par recherche
- **Accuracy** : > 85% (détection correcte des éléments)
- **Coverage** : > 95% (pas de faux négatifs)

## 🎓 Best Practices

### Lors de la Création de Plans

1. **Spécificité** : Plus le plan est spécifique, meilleur il est (hiérarchie)
2. **Patterns Testés** : Valider tous les regex avec des exemples réels
3. **Exclusions** : Toujours exclure vendor/node_modules/build
4. **Performance** : Préférer `rg` (ripgrep) à `grep` pour vitesse
5. **Documentation** : Inclure des exemples concrets d'output attendu

### Lors de l'Utilisation des Plans

1. **Auto-Detection** : Laisser l'agent détecter la technologie automatiquement
2. **Fallback** : Le plan générique doit toujours fonctionner (dernière option)
3. **Validation** : Vérifier que le plan sélectionné correspond à la technologie
4. **Feedback** : Reporter les faux positifs/négatifs pour améliorer les patterns

## 🔗 Intégration avec agent-aikido-explore-code

### Workflow Complet

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

### Exemples d'Invocation

```bash
# Exemple 1 : Projet PHP Laravel
# Query: "authentication system"
# Tech detected: php (via composer.json)
# Plan resolved: plans/php/plan.md
# Output: Classes, interfaces, traits, dependencies with PSR-4 resolution

# Exemple 2 : Projet React TypeScript
# Query: "user profile component"
# Tech detected: javascript + typescript (via package.json + tsconfig.json)
# Framework: react (via package.json dependencies)
# Plan resolved: plans/javascript/plan.md (react subplan si disponible)
# Output: Components, hooks, props interfaces, dependencies

# Exemple 3 : Projet inconnu
# Query: "config loader"
# Tech detected: none
# Plan resolved: plans/plan-generic.md (fallback)
# Output: Generic file patterns, basic declarations
```

## 📚 Références

- **Agent principal** : `prompts/hard_points/agents/agent-aikido-explore-code.md`
- **Plan générique** : `plan-generic.md`
- **Exemples de plans** : `php/plan.md`, `javascript/plan.md`
- **Documentation AI-KIDO** : `prompts/hard_points/ai-kido.md`

---
*Index créé le 2025-12-09 pour système de plans de recherche code AI-KIDO*
*Maintenu automatiquement lors de l'ajout de nouveaux plans*
