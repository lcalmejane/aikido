---
description: Crée un nouveau plan d'analyse projet pour /analyse-project en guidant l'utilisateur à travers le processus. Lit README.md pour template et exigences, demande le type d'analyse et la profondeur, génère la structure complète.
globs: prompts/hard_points/system/analyse/plans/README.md, prompts/hard_points/commands/analyse-project.md
---

# Create Analyse Plan

Crée un nouveau plan d'analyse projet pour `/analyse-project` en suivant le template et les exigences documentés dans `prompts/hard_points/system/analyse/plans/README.md`.

## 🎯 Objectif

Guider l'utilisateur dans la création d'un plan d'analyse complet et conforme, en :
- Questionnant sur le type d'analyse cible (architecturale, technique, fonctionnelle, méthodologique)
- Détectant le niveau de profondeur (1=Survol, 2=Standard, 3=Approfondi, 4=Expert)
- Générant la structure complète du plan
- Pré-remplissant avec stratégies standards quand possible
- Proposant validation automatique du plan créé

## 📋 Processus de Création

### 1. Charger le README de Référence

```bash
# Charger le README pour template et guidelines
README_PATH="prompts/hard_points/system/analyse/plans/README.md"
README_CONTENT=$(cat "$README_PATH")

# Extraire le template de plan
TEMPLATE=$(sed -n '/### 2\. Template de Plan d'"'"'Analyse/,/### 3\. Checklist/p' "$README_PATH")

# Charger la commande analyse-project pour comprendre les types
COMMAND_PATH="prompts/hard_points/commands/analyse-project.md"
COMMAND_CONTENT=$(cat "$COMMAND_PATH")
```

### 2. Questionnaire Interactif

Poser une série de questions à l'utilisateur pour déterminer le plan à créer :

#### Question 1 : Type d'Analyse (Nature)

```
🎯 Pour quel type d'analyse souhaitez-vous créer un plan ?

CATÉGORIES PRINCIPALES :

1. ARCHITECTURALE (C4 Model)
   - c1 : Contexte système (utilisateurs, interactions externes)
   - c2 : Conteneurs (composants de haut niveau, services)
   - c3 : Composants (classes, modules, détail architecture)
   - c4 : Code (implémentation détaillée, patterns code)

2. TECHNIQUE (Stack & Infrastructure)
   - stack-generale : Technologies globales du projet
   - backend : Stack serveur, APIs, données
   - frontend : Interface, UX, client-side
   - infrastructure : Déploiement, ops, monitoring
   - securite : Authentification, autorisation, chiffrement

3. FONCTIONNELLE (Métier & Processus)
   - generale : Processus métier globaux
   - domaine : Secteur d'activité particulier
   - use-cases : Scénarios d'utilisation
   - workflows : Processus opérationnels

4. MÉTHODOLOGIQUE (Processus Dev)
   - uml2 : Modélisation orientée objet
   - rup : Processus unifié
   - agile : Méthodes itératives
   - devops : Intégration continue

Entrez la catégorie et sous-type (ex: architecturale/c1, technique/backend) :
```

**Stocker** : `CATEGORY` (ex: "architecturale"), `SUB_TYPE` (ex: "c1")

#### Question 2 : Profondeur d'Analyse

```
📊 Quelle profondeur d'analyse pour ce plan ?

1. Survol (profondeur 1) - Vue d'ensemble rapide (~5-10 min)
   - Identification éléments principaux
   - Cartographie de base
   - Pas de détails techniques

2. Standard (profondeur 2) - Détail modéré, équilibré (~10-20 min)
   - Analyse relations et dépendances
   - Identification problématiques
   - Documentation choix architecturaux

3. Approfondi (profondeur 3) - Détaillé, exhaustif (~20-40 min)
   - Analyse fine implémentations
   - Détection anti-patterns
   - Recommandations optimisation

4. Expert (profondeur 4) - Audit complet (~40-60 min)
   - Audit sécurité et performance
   - Plan de refactoring
   - Recommandations ROI

Choisissez (1/2/3/4) :
```

**Stocker** : `DEPTH_LEVEL` (1-4), `DEPTH_NAME` (survol/standard/approfondi/expert)

#### Question 3 : Agents AI-KIDO à Mobiliser

```
🤖 Quels agents AI-KIDO souhaitez-vous utiliser dans ce plan ?

Agents recommandés pour {CATEGORY}/{SUB_TYPE} - Profondeur {DEPTH_LEVEL} :
- [x] explore-code (OBLIGATOIRE) - Scan automatique code source
- [ ] explore-all (optionnel prof ≥2) - Recherche parallèle Memory Bank + Code
- [ ] truth-evaluator (optionnel prof ≥2) - Résolution contradictions
- [ ] raci-delegator (si RACI activé) - Classification documents
- [ ] bank-populate (optionnel prof ≥2) - Peuplement automatique gaps
- [x] validator (OBLIGATOIRE) - Validation conformité AI-KIDO

Agents par défaut : explore-code, validator
Utiliser la configuration recommandée ? (o/n) :
```

**Stocker** : `AGENTS_LIST` (liste des agents sélectionnés)

#### Question 4 : Sources à Analyser (Spécifiques)

```
🔍 Quelles sources doivent être prioritaires pour cette analyse {CATEGORY}/{SUB_TYPE} ?

Suggestions basées sur le type :
{SUGGESTIONS_SOURCES}

Personnaliser les sources ? (o/n)
Si oui, entrez répertoires prioritaires (séparés par espaces) :
```

**Stocker** : `PRIORITY_SOURCES` (liste des chemins prioritaires)

**Suggestions auto basées sur type** :
```bash
case "$CATEGORY/$SUB_TYPE" in
    architecturale/c1) SUGGESTED_SOURCES="README.md ARCHITECTURE.md docs/" ;;
    architecturale/c2) SUGGESTED_SOURCES="src/ docker-compose.yml" ;;
    architecturale/c3) SUGGESTED_SOURCES="src/ lib/ components/" ;;
    architecturale/c4) SUGGESTED_SOURCES="src/**/*.{js,ts,php,py}" ;;
    technique/backend) SUGGESTED_SOURCES="src/api/ src/services/ config/" ;;
    technique/frontend) SUGGESTED_SOURCES="src/components/ src/views/ src/assets/" ;;
    technique/infrastructure) SUGGESTED_SOURCES="docker-compose.yml .github/ terraform/" ;;
    technique/securite) SUGGESTED_SOURCES="src/ config/ .env.example" ;;
    fonctionnelle/*) SUGGESTED_SOURCES="src/ docs/business/" ;;
    methodologique/*) SUGGESTED_SOURCES="docs/ .github/ README.md" ;;
    *) SUGGESTED_SOURCES="src/ docs/ config/" ;;
esac
```

#### Question 5 : Stratégie d'Extraction Spécifique

```
📊 Stratégie d'extraction pour {CATEGORY}/{SUB_TYPE} - Profondeur {DEPTH_LEVEL} ?

Stratégies disponibles :
1. Standard : Scan complet avec métadonnées complètes
2. Ciblée : Focus sur éléments spécifiques (classes, interfaces, etc.)
3. Patterns : Détection patterns architecturaux spécifiques
4. Custom : Définir manuellement les patterns de recherche

Utiliser stratégie standard recommandée ? (o/n) :
```

**Stocker** : `EXTRACTION_STRATEGY` (standard/targeted/patterns/custom)

### 3. Génération de la Structure

Créer la structure de répertoires et le fichier plan :

```bash
# Déterminer le chemin du plan
BASE_PATH="prompts/hard_points/system/analyse/plans"

if [ "$SUB_TYPE" != "" ]; then
    # Plan spécifique : categorie/sous-type/plan-profondeur.md
    PLAN_PATH="$BASE_PATH/$CATEGORY/$SUB_TYPE/plan-$DEPTH_NAME.md"
else
    # Plan catégorie : categorie/plan-profondeur.md
    PLAN_PATH="$BASE_PATH/$CATEGORY/plan-$DEPTH_NAME.md"
fi

# Créer le répertoire parent
mkdir -p "$(dirname "$PLAN_PATH")"

echo "📝 Le plan sera créé à : $PLAN_PATH"
```

### 4. Génération du Contenu du Plan

Générer le contenu complet du plan en utilisant le template et les réponses :

```markdown
# Plan d'Analyse {CATEGORY_TITLE}/{SUB_TYPE_TITLE} - {DEPTH_TITLE}

> **Version**: 1.0 | **Date**: {DATE} | **Type**: Analysis Plan | **Nature**: {CATEGORY}/{SUB_TYPE} | **Profondeur**: {DEPTH_LEVEL} - {DEPTH_NAME}

## 📋 Overview

Plan d'analyse spécialisé pour **{CATEGORY_TITLE} {SUB_TYPE_TITLE}** avec profondeur **{DEPTH_NAME}**.

{TYPE_SPECIFIC_DESCRIPTION}

**Philosophie {DEPTH_NAME}** :
{DEPTH_PHILOSOPHY}

## 🎯 Critères de Sélection

Ce plan est sélectionné quand :
- **Nature** : {NATURE_NUMERO} - {NATURE_DESCRIPTION}
- **Profondeur** : {DEPTH_LEVEL} - {DEPTH_NAME}
- **Contexte** : {IDEAL_CONTEXT}

**Différence vs autres plans** :
- vs Plan générique : {SPECIFIC_ADVANTAGES}
- vs Profondeur inférieure : {MORE_DETAIL}
- vs Profondeur supérieure : {LESS_COMPLEXITY}

## 🔍 Sources à Analyser

### Sources Prioritaires

**Code Source** :
- Répertoires : {PRIORITY_SOURCES_DIRS}
- Extensions : {FILE_EXTENSIONS}
- Exclusions : {EXCLUSIONS}

**Documentation** :
- Fichiers : {DOC_FILES}
- Sections prioritaires : {DOC_SECTIONS}

**Configuration** :
- Fichiers : {CONFIG_FILES}
- Paramètres clés : {KEY_CONFIGS}

### Critères de Filtrage

{FILTERING_CRITERIA}

## 🤖 Agents AI-KIDO à Mobiliser

### Phase 3.1 : Scan Code (Obligatoire)

**Agent** : \`agent-aikido-explore-code\`

**Prompt spécialisé** :
\`\`\`
"FORMAT: JSON

Analyse {CATEGORY}/{SUB_TYPE} profondeur {DEPTH_LEVEL} :

FOCUS :
{FOCUS_AREAS}

DÉTAIL :
{DETAIL_LEVEL}

EXCLUSIONS :
{EXCLUSIONS}

Output attendu :
{OUTPUT_FORMAT}"
\`\`\`

### Phase 3.2 : Recherche Parallèle

**Condition** : {EXPLORE_ALL_CONDITION}

**Agent** : \`agent-aikido-explore-all\`

{EXPLORE_ALL_DETAILS}

### Résolution Contradictions

**Condition** : {TRUTH_EVALUATOR_CONDITION}

**Agent** : \`agent-aikido-truth-evaluator\`

**Stratégie hiérarchie** : {HIERARCHY_STRATEGY}

### Classification RACI

**Condition** : {RACI_CONDITION}

**Agent** : \`agent-aikido-raci-delegator\`

**Mapping** : {RACI_MAPPING}

### Peuplement Automatique

**Condition** : {BANK_POPULATE_CONDITION}

**Agent** : \`agent-aikido-bank-populate\`

**Stratégie** : {POPULATE_STRATEGY}

### Validation Finale (Obligatoire)

**Agent** : \`agent-aikido-validator\`

**Règles strictes** :
{VALIDATION_RULES}

## 📊 Stratégie d'Extraction

### 1. Détection Automatique

**Algorithme {DEPTH_NAME}** :
{DETECTION_ALGORITHM}

**Patterns de recherche** :
\`\`\`regex
{SEARCH_PATTERNS}
\`\`\`

**Heuristiques** :
{HEURISTICS}

### 2. Extraction Métadonnées

**Architecture** : {ARCH_METADATA}
**Stack Technique** : {STACK_METADATA}
**Domaine Métier** : {DOMAIN_METADATA}
**Configuration** : {CONFIG_METADATA}

### 3. Analyse Profondeur Spécifique

**Profondeur {DEPTH_LEVEL} - {DEPTH_NAME}** :
- **Niveau de détail** : {DETAIL_LEVEL}
- **Métriques collectées** : {METRICS}
- **Graphes générés** : {DIAGRAMS}
- **Temps estimé** : {TIME_ESTIMATE}

## 🔄 Workflow Complet

### Phases d'Exécution

\`\`\`mermaid
{WORKFLOW_DIAGRAM}
\`\`\`

### Temps d'Exécution Estimé

{TIME_BREAKDOWN}

**Total** : {TOTAL_TIME}

## 📤 Output Format

### Structure de Sortie

\`\`\`markdown
{OUTPUT_TEMPLATE}
\`\`\`

## 🎓 Cas d'Usage Idéaux

Le plan {CATEGORY}/{SUB_TYPE} profondeur {DEPTH_NAME} est idéal pour :
{USE_CASES}

## 📚 Références

- **Plan profondeur inférieure** : {LOWER_DEPTH_PLAN}
- **Plan profondeur supérieure** : {HIGHER_DEPTH_PLAN}
- **Plan générique** : \`plan-{DEPTH_NAME}.md\`
- **Agents** : {AGENTS_USED}
- **Commande** : \`prompts/hard_points/commands/analyse-project.md\`
- **Documentation AI-KIDO** : \`prompts/hard_points/ai-kido.md\`

---
*Plan {CATEGORY_TITLE}/{SUB_TYPE_TITLE} créé le {DATE} pour /analyse-project*
*Généré automatiquement par /create-analyse-plan*
```

### 5. Pré-remplissage Intelligent

Pré-remplir les sections avec des valeurs par défaut basées sur le type d'analyse :

#### Architecturale C1 (Contexte Système)

```bash
FOCUS_AREAS="- Utilisateurs et acteurs externes
- Systèmes externes et intégrations
- Frontières du système
- Interactions de haut niveau"

SEARCH_PATTERNS="# APIs externes
https?://[^'\"\\s]+

# Intégrations
(integration|external|third-party|api)

# Utilisateurs/Acteurs
(user|actor|role|persona)"

OUTPUT_FORMAT="- Diagramme contexte C1 (Mermaid)
- Liste utilisateurs/acteurs
- Liste systèmes externes
- Interfaces principales"
```

#### Technique Backend

```bash
FOCUS_AREAS="- APIs et endpoints
- Services et logique métier
- Accès données (ORM, queries)
- Dépendances backend-specific"

SEARCH_PATTERNS="# API routes
(get|post|put|delete|patch)\\s*\\(['\"]([^'\"]+)

# Services
(class|interface).*Service

# Database queries
(select|insert|update|delete).*from"

OUTPUT_FORMAT="- Liste endpoints API avec méthodes
- Architecture services (graphe Mermaid)
- Modèles de données
- Stack backend détaillée"
```

#### Fonctionnelle Use Cases

```bash
FOCUS_AREAS="- Scénarios d'utilisation principaux
- Processus métier implémentés
- Règles métier (validations, contraintes)
- Workflows utilisateur"

SEARCH_PATTERNS="# Use case patterns
(usecase|scenario|workflow)

# Business rules
(validate|verify|check|ensure).*business

# User flows
(login|register|checkout|payment)"

OUTPUT_FORMAT="- Liste use cases avec acteurs
- Diagrammes de séquence (Mermaid)
- Règles métier extraites
- Workflows détaillés"
```

### 6. Confirmation et Création

Afficher un résumé et demander confirmation :

```
📋 Résumé du Plan à Créer

**Type d'analyse** : {CATEGORY_TITLE} - {SUB_TYPE_TITLE}
**Profondeur** : {DEPTH_LEVEL} - {DEPTH_NAME}
**Chemin** : {PLAN_PATH}
**Sources prioritaires** : {PRIORITY_SOURCES}
**Agents** : {AGENTS_LIST}
**Stratégie extraction** : {EXTRACTION_STRATEGY}

Le plan sera pré-rempli avec des stratégies standards pour {CATEGORY}/{SUB_TYPE}.
Vous pourrez le personnaliser après création.

Créer ce plan maintenant ? (y/n) :
```

Si confirmation :

```bash
# Écrire le fichier
echo "$PLAN_CONTENT" > "$PLAN_PATH"

echo "✅ Plan créé avec succès : $PLAN_PATH"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Personnaliser les prompts agents selon vos besoins"
echo "2. Affiner les patterns de recherche"
echo "3. Compléter les sections TODO"
echo "4. Ajouter des exemples spécifiques"
echo "5. Tester avec : /analyse-project (nature {NATURE_NUM}, profondeur {DEPTH_LEVEL})"
echo ""
echo "Pour éditer le plan :"
echo "  \$EDITOR $PLAN_PATH"
```

### 7. Mise à Jour du README (Automatique)

Ajouter le nouveau plan à la liste dans README.md :

```bash
# Ajouter le plan créé à la section "Plans Disponibles"
README_PATH="prompts/hard_points/system/analyse/plans/README.md"

# Mettre à jour la section "⏳ À Créer (TODO)" → "✅ Disponibles"
# (Script automatique de mise à jour du README)
```

### 8. Ouverture dans l'Éditeur (Optionnel)

Demander si l'utilisateur veut ouvrir le plan dans un éditeur :

```
Voulez-vous ouvrir le plan dans votre éditeur pour personnalisation ? (y/n) :
```

Si oui :

```bash
# Détecter l'éditeur (EDITOR env var ou défaut)
EDITOR="${EDITOR:-nano}"

# Ouvrir le fichier
$EDITOR "$PLAN_PATH"
```

## 📊 Templates par Type d'Analyse

Pour chaque type supporté, des templates pré-configurés sont disponibles :

| Type | Sources Prioritaires | Focus Areas | Agents Recommandés | Status |
|------|---------------------|-------------|-------------------|--------|
| **Architecturale C1** | README, ARCHITECTURE.md | Contexte, acteurs, intégrations | explore-code, validator | ✅ Template |
| **Architecturale C2** | docker-compose, src/ | Conteneurs, services, déploiement | explore-code, explore-all, validator | ✅ Template |
| **Technique Backend** | src/api, src/services | APIs, services, données | explore-code, explore-all, truth-evaluator | ✅ Template |
| **Technique Frontend** | src/components, src/views | Composants, UX, assets | explore-code, validator | ✅ Template |
| **Fonctionnelle Use Cases** | src/, docs/business | Scénarios, workflows, règles | explore-code, explore-all | ✅ Template |
| **Méthodologique DevOps** | .github, Jenkinsfile | CI/CD, déploiement, monitoring | explore-code, validator | ✅ Template |

## 🔧 Options Avancées

### Mode Expert (Skip Questions)

Créer un plan rapidement avec arguments en ligne de commande :

```bash
# Usage : /create-analyse-plan --type=architecturale/c1 --depth=2
# Crée automatiquement avec valeurs par défaut
```

### Cloner un Plan Existant

Créer un nouveau plan basé sur un existant :

```bash
# Usage : /create-analyse-plan --clone=architecturale/c1/plan-standard.md --target=architecturale/c2
# Clone c1 et adapte pour C2
```

## ✅ Checklist de Création (Automatique)

À la fin de la création, afficher une checklist :

```markdown
## ✅ Checklist Post-Création

- [x] Plan créé à {PLAN_PATH}
- [x] Header métadonnées présent
- [x] Sections obligatoires générées
- [ ] Prompts agents personnalisés (TODO : affiner selon besoin)
- [ ] Patterns de recherche affinés (TODO)
- [ ] Exemples de sortie enrichis (TODO)
- [ ] Tests fonctionnels sur projet réel (TODO)

**Prochaines Actions** :
1. Personnaliser prompts agents section "Agents AI-KIDO à Mobiliser"
2. Affiner patterns recherche section "Stratégie d'Extraction"
3. Ajouter exemples spécifiques à votre type d'analyse
4. Tester avec /analyse-project (nature {NATURE_NUM}, profondeur {DEPTH_LEVEL})
5. Valider résultats et ajuster
```

---

**Workflow** :
1. Charger README + commande → 2. Questionnaire (type, profondeur, agents, sources, stratégie) → 3. Générer structure → 4. Pré-remplir contenu → 5. Confirmer création → 6. Écrire fichier → 7. Maj README → 8. Ouvrir éditeur (opt)

**Important** : Le plan créé contient des TODO et nécessite personnalisation, mais est immédiatement utilisable avec stratégies standards.
