# Plans d'Analyse Projet - Index

> **Version**: 1.0 | **Date**: 2025-12-10 | **Purpose**: Hierarchical Analysis Plan System

## 📋 Overview

Cette structure contient les **plans d'analyse** utilisés par `/analyse-project` pour analyser les projets. Chaque plan définit la **stratégie d'analyse complète** pour un type et une profondeur spécifiques :

- **Sources à Analyser** : Code, docs, config spécifiques au type d'analyse
- **Agents à Mobiliser** : Quels agents AI-KIDO utiliser et comment
- **Stratégie d'Extraction** : Algorithmes et patterns de détection
- **Profondeur d'Analyse** : Niveau de détail (1=Survol → 4=Expert)
- **Output Format** : Template de sortie et métadonnées attendues
- **Critères de Sélection** : Quand utiliser ce plan vs autres

## 🎯 Avantage du Système de Plans

En déportant l'algorithme d'analyse dans des plans spécifiques :
- ✅ **Réduction complexité** : `/analyse-project` devient orchestrateur simple
- ✅ **Ciblage précis** : Analyse adaptée au contexte (architecture vs stack vs domaine)
- ✅ **Customisation** : Plans modifiables par type de projet
- ✅ **Capitalisation** : Meilleures pratiques d'analyse centralisées
- ✅ **Performance** : Évite l'analyse exhaustive inutile

## 🗂️ Structure Hiérarchique

Les plans sont organisés hiérarchiquement pour permettre une résolution par spécificité :

```
plans/
├── README.md                              # Ce fichier
├── plan-survol.md                         # Plan générique profondeur 1 (fallback)
├── plan-standard.md                       # Plan générique profondeur 2 (fallback)
├── plan-approfondi.md                     # Plan générique profondeur 3 (fallback)
├── plan-expert.md                         # Plan générique profondeur 4 (fallback)
├── architecturale/
│   ├── c1/
│   │   ├── plan-survol.md                 # C1 Survol (profondeur 1)
│   │   ├── plan-standard.md               # C1 Standard (profondeur 2)
│   │   ├── plan-approfondi.md             # C1 Approfondi (profondeur 3)
│   │   └── plan-expert.md                 # C1 Expert (profondeur 4)
│   ├── c2/
│   │   └── plan-standard.md               # C2 Standard (TODO)
│   ├── c3/
│   │   └── plan-approfondi.md             # C3 Approfondi (TODO)
│   └── c4/
│       └── plan-expert.md                 # C4 Expert (TODO)
├── technique/
│   ├── stack-generale/
│   │   └── plan-standard.md               # Stack générale (TODO)
│   ├── backend/
│   │   └── plan-approfondi.md             # Backend spécifique (TODO)
│   ├── frontend/
│   │   └── plan-approfondi.md             # Frontend spécifique (TODO)
│   ├── infrastructure/
│   │   └── plan-expert.md                 # Infrastructure (TODO)
│   └── securite/
│       └── plan-expert.md                 # Sécurité (TODO)
├── fonctionnelle/
│   ├── generale/
│   │   └── plan-standard.md               # Analyse fonctionnelle générale (TODO)
│   ├── domaine/
│   │   └── plan-approfondi.md             # Analyse domaine spécifique (TODO)
│   ├── use-cases/
│   │   └── plan-standard.md               # Analyse use cases (TODO)
│   └── workflows/
│       └── plan-approfondi.md             # Analyse workflows (TODO)
└── methodologique/
    ├── uml2/
    │   └── plan-expert.md                 # Analyse UML2 (TODO)
    ├── rup/
    │   └── plan-expert.md                 # Analyse RUP (TODO)
    ├── agile/
    │   └── plan-standard.md               # Analyse Agile (TODO)
    └── devops/
        └── plan-approfondi.md             # Analyse DevOps (TODO)
```

## 🔍 Plan Resolution Logic

`/analyse-project` sélectionne le plan selon cette logique :

### Algorithme de Résolution

```python
def resolve_analysis_plan(nature: str, profondeur: int) -> str:
    """
    Résout le plan d'analyse le plus spécifique disponible.

    Paramètres :
    - nature: Type d'analyse (1-18 depuis Phase 1 de /analyse-project)
      - 1: Analyse globale simple
      - 2-5: Architecturales (C1-C4)
      - 6-10: Techniques (stack générale, backend, frontend, infra, sécurité)
      - 11-14: Fonctionnelles (générale, domaine, use cases, workflows)
      - 15-18: Méthodologiques (UML2, RUP, Agile, DevOps)
    - profondeur: Niveau de profondeur (1-4)
      - 1: Survol
      - 2: Standard
      - 3: Approfondi
      - 4: Expert

    Priorité (du plus spécifique au plus générique) :
    1. plans/{categorie}/{sous-type}/plan-{profondeur}.md
    2. plans/{categorie}/plan-{profondeur}.md
    3. plans/plan-{profondeur}.md (fallback générique)
    """
    base = "prompts/hard_points/system/analyse/plans"
    profondeur_names = {1: "survol", 2: "standard", 3: "approfondi", 4: "expert"}
    profondeur_name = profondeur_names[profondeur]

    # Mapper nature → catégorie + sous-type
    nature_mapping = {
        1: ("generale", None),
        2: ("architecturale", "c1"),
        3: ("architecturale", "c2"),
        4: ("architecturale", "c3"),
        5: ("architecturale", "c4"),
        6: ("technique", "stack-generale"),
        7: ("technique", "backend"),
        8: ("technique", "frontend"),
        9: ("technique", "infrastructure"),
        10: ("technique", "securite"),
        11: ("fonctionnelle", "generale"),
        12: ("fonctionnelle", "domaine"),
        13: ("fonctionnelle", "use-cases"),
        14: ("fonctionnelle", "workflows"),
        15: ("methodologique", "uml2"),
        16: ("methodologique", "rup"),
        17: ("methodologique", "agile"),
        18: ("methodologique", "devops"),
    }

    categorie, sous_type = nature_mapping[nature]

    # Niveau 1 : Catégorie + Sous-type + Profondeur (le plus spécifique)
    if sous_type:
        path = f"{base}/{categorie}/{sous_type}/plan-{profondeur_name}.md"
        if exists(path): return path

    # Niveau 2 : Catégorie + Profondeur
    path = f"{base}/{categorie}/plan-{profondeur_name}.md"
    if exists(path): return path

    # Niveau 3 : Fallback générique par profondeur
    return f"{base}/plan-{profondeur_name}.md"
```

### Exemples de Résolution

| Nature | Profondeur | Plan Résolu |
|--------|-----------|-------------|
| **2** (C1) | **2** (Standard) | `plans/architecturale/c1/plan-standard.md` ✅ |
| **7** (Backend) | **3** (Approfondi) | `plans/technique/backend/plan-approfondi.md` → `plan-approfondi.md` |
| **11** (Fonctionnelle générale) | **2** (Standard) | `plans/fonctionnelle/generale/plan-standard.md` → `plan-standard.md` |
| **15** (UML2) | **4** (Expert) | `plans/methodologique/uml2/plan-expert.md` → `plan-expert.md` |
| **1** (Globale simple) | **1** (Survol) | `plans/plan-survol.md` ✅ (fallback) |

## 📦 Plans Disponibles (Status)

### ✅ Disponibles

| Plan | Path | Description | Lignes |
|------|------|-------------|--------|
| **Survol Générique** | `plan-survol.md` | Fallback profondeur 1 (vue d'ensemble rapide) | ~300 |
| **Standard Générique** | `plan-standard.md` | Fallback profondeur 2 (détail modéré) | ~400 |
| **Approfondi Générique** | `plan-approfondi.md` | Fallback profondeur 3 (exhaustif) | ~500 |
| **Expert Générique** | `plan-expert.md` | Fallback profondeur 4 (audit complet) | ~600 |

### ⏳ À Créer (TODO - Priorisés)

| Plan | Path | Description | Priorité |
|------|------|-------------|----------|
| **C1 Standard** | `architecturale/c1/plan-standard.md` | Analyse contexte système (profondeur 2) | Haute |
| **C2 Approfondi** | `architecturale/c2/plan-approfondi.md` | Analyse conteneurs détaillée (profondeur 3) | Haute |
| **Backend Approfondi** | `technique/backend/plan-approfondi.md` | Stack backend spécifique (profondeur 3) | Haute |
| **Frontend Approfondi** | `technique/frontend/plan-approfondi.md` | Stack frontend spécifique (profondeur 3) | Haute |
| **Fonctionnelle Générale** | `fonctionnelle/generale/plan-standard.md` | Processus métier globaux (profondeur 2) | Moyenne |
| **Use Cases Standard** | `fonctionnelle/use-cases/plan-standard.md` | Scénarios d'utilisation (profondeur 2) | Moyenne |
| **DevOps Approfondi** | `methodologique/devops/plan-approfondi.md` | Intégration continue (profondeur 3) | Moyenne |
| **Sécurité Expert** | `technique/securite/plan-expert.md` | Audit sécurité complet (profondeur 4) | Basse |

## 🎯 Comment Créer un Nouveau Plan d'Analyse

### 1. Identifier le Type et la Profondeur

- **Type d'analyse** ? → Catégorie (architecturale/technique/fonctionnelle/méthodologique)
- **Sous-type** ? → Sous-catégorie (c1, backend, use-cases, etc.)
- **Profondeur** ? → Niveau de détail (1=survol, 2=standard, 3=approfondi, 4=expert)

### 2. Template de Plan d'Analyse

```markdown
# Plan d'Analyse {TYPE} - {PROFONDEUR}

> **Version**: 1.0 | **Date**: YYYY-MM-DD | **Type**: Analysis Plan | **Nature**: {TYPE} | **Profondeur**: {PROFONDEUR}

## 📋 Overview

[Description du plan et cas d'usage spécifique]

Ce plan définit la stratégie d'analyse pour une analyse {TYPE} de profondeur {PROFONDEUR}.

## 🎯 Critères de Sélection

Ce plan est sélectionné quand :
- **Nature** : {NATURE_NUMERO} - {DESCRIPTION_NATURE}
- **Profondeur** : {PROFONDEUR_NUMERO} - {DESCRIPTION_PROFONDEUR}
- **Contexte** : {CONTEXTE_IDEAL}

**Différence vs autres plans** :
- vs Plan générique : {AVANTAGES_SPECIFIQUES}
- vs Profondeur inférieure : {PLUS_DE_DETAIL}
- vs Profondeur supérieure : {MOINS_COMPLEXE}

## 🔍 Sources à Analyser

### Sources Prioritaires
[Liste adaptée au type d'analyse]

**Code Source** :
- Répertoires : {DIRECTORIES}
- Extensions : {FILE_EXTENSIONS}
- Exclusions : {EXCLUSIONS}

**Documentation** :
- Fichiers : {DOC_FILES}
- Sections prioritaires : {DOC_SECTIONS}

**Configuration** :
- Fichiers : {CONFIG_FILES}
- Paramètres clés : {KEY_CONFIGS}

### Critères de Filtrage
[Comment sélectionner les sources pertinentes pour ce type/profondeur]

## 🤖 Agents AI-KIDO à Mobiliser

### Phase 3.1 : Scan Code (Obligatoire)
**Agent** : `agent-aikido-explore-code`
**Prompt spécialisé** :
```
"FORMAT: JSON

Analyse {TYPE} profondeur {PROFONDEUR} :
- Focus : {FOCUS_AREAS}
- Métadonnées recherchées : {METADATA_TARGETS}
- Profondeur scan : {SCAN_DEPTH}

Output attendu : {OUTPUT_FORMAT}"
```

### Phase 3.2 : Recherche Parallèle (Optionnel selon profondeur)
**Condition** : Profondeur ≥ {SEUIL}
**Agent** : `agent-aikido-explore-all`
**Prompt spécialisé** :
```
"FORMAT: JSON

Recherche parallèle Memory Bank + Code pour {TYPE} :
- Keywords : {KEYWORDS_LIST}
- Écarts recherchés : {GAPS_TO_DETECT}

Output attendu : Vue complète avec cross-references"
```

### Résolution Contradictions (Si besoin)
**Condition** : Contradictions détectées
**Agent** : `agent-aikido-truth-evaluator`
**Stratégie hiérarchie** : {HIERARCHY_STRATEGY}

### Classification RACI (Optionnel)
**Condition** : Structure RACI activée
**Agent** : `agent-aikido-raci-delegator`
**Mapping** : {RACI_MAPPING}

### Peuplement Automatique (Optionnel)
**Condition** : Gaps > 0 ET utilisateur accepte
**Agent** : `agent-aikido-bank-populate`
**Stratégie** : {POPULATE_STRATEGY}

### Validation Finale (Obligatoire)
**Agent** : `agent-aikido-validator`
**Règles strictes** : {VALIDATION_RULES}

## 📊 Stratégie d'Extraction

### 1. Détection Automatique
[Algorithme de détection pour ce type d'analyse]

**Patterns de recherche** :
```regex
{DETECTION_PATTERNS}
```

**Heuristiques** :
- {HEURISTIC_1}
- {HEURISTIC_2}
- {HEURISTIC_3}

### 2. Extraction Métadonnées
[Quelles métadonnées extraire selon le type]

**Architecture** : {ARCH_METADATA}
**Stack Technique** : {STACK_METADATA}
**Domaine Métier** : {DOMAIN_METADATA}
**Configuration** : {CONFIG_METADATA}

### 3. Analyse Profondeur Spécifique
[Algorithmes spécifiques à cette profondeur]

**Profondeur {PROFONDEUR}** :
- Niveau de détail : {DETAIL_LEVEL}
- Métriques collectées : {METRICS}
- Graphes générés : {DIAGRAMS}
- Temps estimé : {TIME_ESTIMATE}

## 🔄 Workflow Complet

### Phases d'Exécution

```mermaid
graph TB
    START[Début Analyse {TYPE}] --> DETECT[Détection Sources<br/>{DETECTION_METHOD}]
    DETECT --> SCAN[🤖 explore-code<br/>{SCAN_STRATEGY}]

    SCAN --> COND{Profondeur ≥{THRESHOLD}?}
    COND -->|OUI| PARALLEL[🤖 explore-all<br/>Recherche parallèle]
    COND -->|NON| EXTRACT

    PARALLEL --> EXTRACT[Extraction Métadonnées<br/>{EXTRACTION_STRATEGY}]
    EXTRACT --> GAPS[Détection Écarts<br/>{GAP_DETECTION}]

    GAPS -->|Contradictions| TRUTH[🤖 truth-evaluator<br/>Résolution]
    TRUTH --> ENRICH
    GAPS --> ENRICH[Enrichissement Memory Bank<br/>{ENRICHMENT_AREAS}]

    ENRICH --> RACI{RACI activé?}
    RACI -->|OUI| CLASSIFY[🤖 raci-delegator<br/>Classification]
    RACI -->|NON| BALANCE

    CLASSIFY --> BALANCE[Équilibrage AI-KIDO<br/>≤500 lignes, 3-7 enfants]
    BALANCE --> INDEX[Mise à jour Index<br/>{INDEX_FILES}]

    INDEX --> POPULATE{Gaps>0?}
    POPULATE -->|OUI et accepté| BANKPOP[🤖 bank-populate<br/>Peuplement auto]
    POPULATE -->|NON| VALIDATE

    BANKPOP --> VALIDATE[🤖 validator<br/>Validation conformité]
    VALIDATE --> END[✅ Analyse terminée]

    style SCAN fill:#f9f,stroke:#333,stroke-width:2px
    style PARALLEL fill:#f9f,stroke:#333,stroke-width:2px
    style TRUTH fill:#f9f,stroke:#333,stroke-width:2px
    style CLASSIFY fill:#f9f,stroke:#333,stroke-width:2px
    style BANKPOP fill:#f9f,stroke:#333,stroke-width:2px
    style VALIDATE fill:#f9f,stroke:#333,stroke-width:2px
    style END fill:#9f9,stroke:#333,stroke-width:2px
```

### Temps d'Exécution Estimé
- **Profondeur 1** : ~5-10 min
- **Profondeur 2** : ~10-20 min
- **Profondeur 3** : ~20-40 min
- **Profondeur 4** : ~40-60 min

(Variables selon taille projet et sources)

## 📤 Output Format

### Structure de Sortie

```markdown
# Rapport d'Analyse {TYPE} - Profondeur {PROFONDEUR}

**Date** : {DATE}
**Durée** : {DURATION}
**Sources analysées** : {SOURCE_COUNT}

## 🎯 Configuration

- **Nature** : {NATURE_DESCRIPTION}
- **Profondeur** : {PROFONDEUR_DESCRIPTION}
- **Plan utilisé** : {PLAN_PATH}

## 📊 Résultats Principaux

### {SECTION_1}
{FINDINGS_1}

### {SECTION_2}
{FINDINGS_2}

### {SECTION_3}
{FINDINGS_3}

## 🔍 Détails Techniques

{TECHNICAL_DETAILS}

## ⚠️  Écarts et Contradictions

{GAPS_AND_CONTRADICTIONS}

## 📝 Enrichissements Appliqués

- **Concepts** : {CONCEPTS_COUNT} mis à jour
- **Techniques** : {TECHNIQUES_COUNT} enrichies
- **Use Cases** : {USE_CASES_COUNT} ajoutés
- **Personas** : {PERSONAS_COUNT} adaptés

## ✅ Conformité AI-KIDO

- **Règles respectées** : {COMPLIANCE_SCORE}%
- **Quick fixes appliqués** : {FIXES_COUNT}

---
*Généré par /analyse-project avec plan {PLAN_PATH}*
```

## 📋 Checklist de Création

Lors de la création d'un nouveau plan :

- [ ] Identifier type d'analyse et profondeur cible
- [ ] Définir critères de sélection (quand utiliser ce plan)
- [ ] Lister sources prioritaires (code/docs/config)
- [ ] Spécifier agents AI-KIDO à mobiliser
- [ ] Définir prompts spécialisés pour chaque agent
- [ ] Documenter stratégie d'extraction spécifique
- [ ] Créer workflow Mermaid complet
- [ ] Définir format de sortie attendu
- [ ] Estimer temps d'exécution
- [ ] Tester sur projet réel
- [ ] Valider avec `/validate-analyse-plan` (à créer)

## 🔧 Customisation & Extension

### Ajouter un Nouveau Type d'Analyse

```bash
# 1. Créer la catégorie
mkdir -p prompts/hard_points/system/analyse/plans/{nouvelle_categorie}

# 2. Créer les plans par profondeur
for profondeur in survol standard approfondi expert; do
  cp plans/plan-${profondeur}.md plans/{nouvelle_categorie}/plan-${profondeur}.md
  # Customiser chaque plan selon le type
done

# 3. (Optionnel) Créer sous-types
mkdir -p plans/{nouvelle_categorie}/{sous-type}
# Copier et customiser plans par profondeur
```

### Ajouter un Sous-Type Spécifique

```bash
# Exemple : Ajouter analyse C3 (composants)
mkdir -p plans/architecturale/c3

# Créer plan profondeur 3 (approfondi - le plus adapté pour C3)
cp plans/plan-approfondi.md plans/architecturale/c3/plan-approfondi.md

# Customiser pour analyse composants :
# - Focus sur classes, interfaces, modules
# - Dépendances entre composants
# - Patterns architecturaux
```

## 📊 Métriques de Performance (Objectifs)

### Par Profondeur

| Profondeur | Temps Max | Tokens Max | Agents Utilisés | Accuracy Cible |
|-----------|-----------|------------|-----------------|----------------|
| **Survol** | 10 min | 5k | 2-3 | 75% |
| **Standard** | 20 min | 10k | 3-4 | 85% |
| **Approfondi** | 40 min | 20k | 4-5 | 90% |
| **Expert** | 60 min | 30k | 5-6 | 95% |

### Par Type d'Analyse

| Type | Complexité | Agents Recommandés | Token Budget |
|------|-----------|-------------------|--------------|
| **Architecturale** | Moyenne | explore-code, explore-all, truth-evaluator | 10-15k |
| **Technique** | Haute | explore-code, explore-all, raci-delegator | 15-20k |
| **Fonctionnelle** | Moyenne | explore-code, truth-evaluator, bank-populate | 8-12k |
| **Méthodologique** | Faible | explore-code, validator | 5-8k |

## 🎓 Best Practices

### Lors de la Création de Plans

1. **Spécificité** : Plus le plan est ciblé, meilleur il sera
2. **Agents Testés** : Valider les prompts agents avec projets réels
3. **Profondeur Adaptée** : Ne pas sur-dimensionner (profondeur 2 suffit souvent)
4. **Performance** : Optimiser l'utilisation des agents (parallélisation)
5. **Documentation** : Exemples concrets de sortie attendue

### Lors de l'Utilisation des Plans

1. **Sélection Auto** : Laisser `/analyse-project` sélectionner le plan optimal
2. **Confirmation Utilisateur** : Toujours demander validation avant application
3. **Fallback** : Les plans génériques doivent toujours fonctionner
4. **Feedback** : Reporter les incohérences pour améliorer les plans

## 🔗 Intégration avec /analyse-project

### Workflow Complet

```mermaid
graph TD
    A[User: /analyse-project] --> B[Phase 1: Configuration<br/>Nature 1-18 + Profondeur 1-4]
    B --> C{Résolution Plan}
    C -->|Cherche spécifique| D[plans/{type}/{sous-type}/plan-{prof}.md]
    C -->|Fallback catégorie| E[plans/{type}/plan-{prof}.md]
    C -->|Fallback générique| F[plans/plan-{prof}.md]

    D -->|Trouvé| G[Charger Plan]
    D -->|Pas trouvé| E
    E -->|Trouvé| G
    E -->|Pas trouvé| F
    F --> G

    G --> H[Afficher Plan<br/>Critères de sélection]
    H --> I{Utilisateur<br/>Valide?}

    I -->|NON| J[Proposer création<br/>plan spécifique<br/>/create-analyse-plan]
    I -->|OUI| K[Exécuter Plan]

    J --> L[Créer nouveau plan]
    L --> K

    K --> M[Phase 2-9<br/>selon stratégie plan]
    M --> N[Rapport Final]
```

### Exemple d'Invocation

```bash
# Exemple 1 : Analyse Architecture C1, Profondeur Standard
# Nature : 2 (C1)
# Profondeur : 2 (Standard)
# Plan résolu : plans/architecturale/c1/plan-standard.md
# Agents : explore-code, truth-evaluator, validator
# Durée : ~15 min

# Exemple 2 : Analyse Backend, Profondeur Approfondie
# Nature : 7 (Backend)
# Profondeur : 3 (Approfondi)
# Plan résolu : plans/technique/backend/plan-approfondi.md → plans/plan-approfondi.md (fallback)
# Agents : explore-code, explore-all, raci-delegator, validator
# Durée : ~30 min

# Exemple 3 : Analyse Globale Simple, Survol
# Nature : 1 (Globale)
# Profondeur : 1 (Survol)
# Plan résolu : plans/plan-survol.md (fallback générique)
# Agents : explore-code, validator
# Durée : ~8 min
```

## 📚 Références

- **Commande principale** : `prompts/hard_points/commands/analyse-project.md`
- **Plans génériques** : `plan-survol.md`, `plan-standard.md`, `plan-approfondi.md`, `plan-expert.md`
- **Commande création** : `prompts/hard_points/commands/create-analyse-plan.md` (à créer)
- **Agents AI-KIDO** : `prompts/hard_points/agents/agent-aikido-*.md`
- **Documentation AI-KIDO** : `prompts/hard_points/ai-kido.md`

---
*Index créé le 2025-12-10 pour système de plans d'analyse AI-KIDO*
*Pattern inspiré de `prompts/hard_points/system/search/plans/` (explore-code)*
