# Changelog AI-KIDO

Tous les changements notables du projet AI-KIDO seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## 📊 Vue d'Ensemble

### Résumé des Versions

| Version | Date | Agents | Commandes | Skills | Lignes Code | README | Highlights |
|---------|------|--------|-----------|--------|-------------|---------|-----------|
| **1.3.1** | 2026-01-06 | 14 | 33 | **7 (5+2)** | ~56K | 2,464 | 🆕 Skills Confluence + JIRA |
| **1.3.0** | 2025-12-19 | 14 | 33 | **5** | ~56K | 2,464 | 🎯 Centralisation + 5 Skills de base |
| **1.2.0** | 2025-11-15 | 6 | 10 | 0 | ~6K | 524 | 🌱 Base AI-KIDO |

### Évolution du Projet

```
V1.2.0 (Nov 2025) ──────→ V1.3.0 (Déc 2025) ──────→ V1.3.1 (Jan 2026)
  6 agents                  14 agents (+8)           14 agents
  10 commandes              33 commandes (+23)       33 commandes
  0 skill                   5 skills (+5)            7 skills (+2)
  ~6K lignes                ~56K lignes (+933%)      ~56K lignes
  Base                      Centralisation           Confluence + JIRA
```

### Changements Majeurs par Version

**V1.3.1 (2026-01-06)** :
- 🆕 **Skill Confluence** (5 jan) : Synchronisation bidirectionnelle Confluence Cloud + 6 commandes
- 🆕 **Skill JIRA** (6 jan) : Synchronisation Cloud + KPI Agile + Rapports HTML + 9 commandes
- 📊 Agent confluence (520 lignes) + Agent jira (580 lignes)
- 📈 15 commandes externes (6 Confluence + 9 JIRA)
- 🔧 77 scripts bash (+15 nouveaux pour Confluence/JIRA)

**V1.3.0 (2025-12-19)** :
- 🎯 **Centralisation massive** : 33 commandes dans `hard_points/commands/`
- 🚀 **5 Skills système de base** : analyse, maj, search, structure, web
- ⚡ **12 nouveaux agents** : explore-code, explore-all, projet-index, doc-header, fusion, etc.
- 📈 **Croissance x10** : +50,240 lignes, README x4.7
- 🔧 **Point d'entrée unifié** `/prompts/index.md`

**V1.2.0 (2025-11-15)** :
- 🌱 **Base AI-KIDO** : 18 règles fondamentales
- 🤖 6 agents de base, 10 commandes fondamentales
- 📚 Structure Memory Bank (concepts, techniques, personas, use_cases)
- 🎭 Modes STANDARD et LIGHT

---

## [1.3.1] - 2026-01-06

### 🎉 Ajouté

#### Skill Confluence - Synchronisation Bidirectionnelle Confluence Cloud

**Ajouté le 5 janvier 2026** (commits 6f2b908, c0941eb)

- **Agent** : `agent-aikido-confluence` (520 lignes) - Synchronisateur Confluence Cloud bidirectionnel
- **6 Commandes Confluence** :
  - `confluence-test` : Test connexion API Confluence Cloud
  - `confluence-init` : Initialisation métadonnées Confluence dans Markdown
  - `confluence-create-page` : Création page Confluence depuis Markdown
  - `confluence-import-page` : Import page Confluence vers Markdown
  - `confluence-sync` : Synchronisation bidirectionnelle (last-write-wins)
  - `confluence-tree` : Arborescence complète espace Confluence

- **Fonctionnalités** :
  - Synchronisation bidirectionnelle Memory Bank ↔ Confluence Cloud (API REST v2)
  - Conversion Markdown ↔ Storage Format (pandoc + scripts bash)
  - Gestion métadonnées YAML (confluence_id, space_key, parent_id, last_modified)
  - Stratégie last-write-wins (timestamps UTC)
  - Mapping hiérarchique automatique (arborescence → pages/sous-pages)
  - Gestion attachments avec cache MD5

- **Configuration** : `.env` pour credentials Confluence Cloud (URL, email, API token)
- **Scripts** : 8 scripts bash pour API Confluence, conversion, synchronisation
- **Documentation** : `SKILL.md` (7.1K), `README.md` (160 lignes), `.env.example`
- **Prérequis** : pandoc obligatoire pour conversion Markdown ↔ Storage Format

#### Skill JIRA - Synchronisation & Analyse JIRA Cloud

**Ajouté le 6 janvier 2026** (commit 043efdb)
- **Agent** : `agent-aikido-jira` - Synchronisation bidirectionnelle Memory Bank ↔ JIRA Cloud
- **9 Commandes JIRA** :
  - `jira-test` : Test connexion API JIRA Cloud
  - `jira-init` : Initialisation projet JIRA dans Memory Bank
  - `jira-sync-sprints` : Synchronisation sprints + génération rapports KPI
  - `jira-sync-tickets` : Synchronisation bidirectionnelle tickets (last-write-wins)
  - `jira-sync-project` : Synchronisation métadonnées générales projet
  - `jira-sync-epic` : Synchronisation epic complet avec hiérarchie
  - `jira-import-full` : Import complet projet (épics, features, tickets, sprints)
  - `jira-generate-report` : Génération rapport HTML interactif pour sprint
  - `jira-sync-backlog` : Synchronisation backlog + vue HTML gestion
- **Fonctionnalités** :
  - Calcul automatique KPI Agile (vélocité, burndown, temps, qualité) avec JQ
  - Génération rapports HTML interactifs (Chart.js, tableaux triables)
  - Structure hiérarchique EPICS → FEATURES → TICKETS
  - Stratégie last-write-wins (timestamps UTC)
  - Architecture données JSON optimisée
- **Configuration** : `.env` pour credentials JIRA Cloud
- **Scripts** : 15+ scripts bash pour API JIRA, calcul KPI, génération rapports
- **Templates** : Templates HTML/JS pour rapports interactifs
- **Documentation** : `SKILL.md`, `README.md`, `ARCHITECTURE.md`, `install-aikido.md`

#### Documentation et Structure

**README.md - Sections Skills Externes** (+470 lignes) :
- **Section complète Skill Confluence** (160 lignes) :
  - 6 commandes documentées avec syntaxe, processus, agents
  - Architecture synchronisation bidirectionnelle
  - Stratégie last-write-wins détaillée
  - Configuration et prérequis pandoc

- **Section complète Skill JIRA** (310 lignes) :
  - 9 commandes documentées avec syntaxe, processus, KPI
  - Architecture données hiérarchique (EPICS → FEATURES → TICKETS)
  - Calcul KPI Agile automatique (vélocité, burndown, temps, qualité)
  - Génération rapports HTML interactifs
  - Configuration et prérequis JQ

**README.md - Structure Projet** (refonte section existante) :
- Documentation `/prompts/hard_points/system/` avec **7 skills** (confluence et jira ajoutés)
- Arborescence mise à jour avec répertoires confluence/ et jira/
- Tableau Skills Système complété (7 skills au total)

**Fichiers de référence mis à jour** :
- **agents_list.md** : Sections utilisation `agent-aikido-confluence` et `agent-aikido-jira`
- **skills_list.md** : Entrées Skill Confluence et Skill JIRA
- **commands_list.md** : 15 commandes externes (6 Confluence + 9 JIRA) référencées

#### Mapping et Configuration

**Confluence** :
- **`.claude/agents/agent-aikido-confluence.md`** : Mapping agent pour Claude Code
- **`.claude/commands/`** : 6 wrappers commandes Confluence
- **`.roo/commands/`** : 6 wrappers commandes Confluence
- **`.roomodes`** : Configuration agent `agent-aikido-confluence`

**JIRA** :
- **`.claude/agents/agent-aikido-jira.md`** : Mapping agent pour Claude Code
- **`.claude/commands/`** : 9 wrappers commandes JIRA
- **`.roo/commands/`** : 9 wrappers commandes JIRA
- **`.roomodes`** : Configuration agent `agent-aikido-jira`

**Total V1.3.1** : 48 fichiers mappings dans `.claude/` et `.roo/`

### 🔧 Modifié

- **Installation** : Scripts bash rendus exécutables (`chmod +x`)
- **Configuration** : Ajout prérequis JQ obligatoire (macOS/Linux) pour Skill JIRA
- **Configuration** : Ajout prérequis pandoc obligatoire (macOS/Linux) pour Skill Confluence

### 📊 Statistiques V1.3.1

| Métrique | V1.3.0 | V1.3.1 | Évolution |
|----------|--------|--------|-----------|
| **Skills système** | 5 | 7 | **+2 (Confluence, JIRA)** |
| **Agents** | 12 | 14 | **+2 (confluence, jira)** |
| **Commandes externes** | 0 | 15 | **+15 (6 Confluence + 9 JIRA)** |
| **Scripts bash** | 62 | 77 | **+15 (8 Confluence + 7 JIRA)** |
| **Templates** | 0 | 3+ | **+3 (JIRA HTML/JS)** |
| **Documentation Skills** | 14.2K | 31.2K | **+17K (+120%)** |
| **README.md Skills** | ~400 lignes | ~870 lignes | **+470 lignes (+118%)** |

**Nouveaux contenus V1.3.1** :
- **2 Skills externes** : Confluence (7.1K) + JIRA (9.9K) = **17K documentation**
- **2 Agents majeurs** : confluence (520 lignes) + jira (580 lignes) = **1,100 lignes**
- **15 commandes externes** : Intégration complète systèmes externes
- **15 scripts bash** : Automatisation API Confluence/JIRA, conversion, KPI
- **3+ templates HTML/JS** : Rapports interactifs JIRA avec Chart.js

---

## [1.3.0] - 2025-12-09

### 📊 Statistiques Globales

**Croissance massive du projet** :
- **+56,578 lignes** de code ajoutées
- **-6,338 lignes** supprimées (optimisations)
- **Net: +50,240 lignes** (croissance x10 !)
- **README.md** : 524→2464 lignes (+1940 lignes, **x4.7**)
- **hard_points/** : 96→197 fichiers (**+101 fichiers**)
- **77 scripts bash** dans system/ (dont 7 pour JIRA)
- **205 fichiers** dans system/, **14 agents**, **21 commandes**

### 🎉 Ajouté

#### Nouveaux Fichiers Centraux

**Fichiers de référence** (nouveaux) :
- **`agents_list.md`** (131 lignes) : Liste complète 14 agents avec utilisation détaillée par agent
- **`skills_list.md`** (9 lignes) : Liste 7 skills système avec descriptions
- **`commands_list.md`** (38 lignes) : Liste 33 commandes avec références fichiers
- **`AGENTS.md`** (+106 lignes) : Interface standardisée enrichie, séparation commands/agents
- **`CLAUDE.md`** (réduit -823 lignes) : Refonte complète, mapping AI-KIDO ↔ Claude.md optimisé

**Fichiers de règles** (refonte) :
- **`ai-kido.md`** : Réduit de 519→ lignes (optimisation), détails extraits dans `ai-kido_details.md` (417 lignes)
- **`ai-kido-light.md`** : Réduit de 440→ lignes, détails extraits dans `ai-kido-light_details.md` (383 lignes)
- **Principe** : Fichiers principaux concis, détails séparés pour performance LLM

#### Architecture Système - Centralisation et Skills

##### Système de Skills (`/prompts/hard_points/system/`)

**Ajouté le 19 décembre 2025** (commit 01e122c "Skills mapping")

**5 Skills système de base** créés :

1. **Skill Analyse** (2.2K) :
   - `SKILL.md` : Spécification technique
   - `README.md` (574 lignes) : Guide utilisateur
   - `plans/` : Plans d'analyse réutilisables (architecturale, technique, fonctionnelle, sécurité)
   - Commandes : `create-analyse-plan`, `validate-analyse-plan`

2. **Skill Maj** (2.9K) :
   - Agent : `agent-aikido-update-controller`
   - `SKILL.md` + `README.md` + `plans/`
   - Plans de migration pour mises à jour AI-KIDO
   - Gestion rollback et fusion intelligente
   - Commande : `maj-aikido`

3. **Skill Search** (2.4K) :
   - `SKILL.md` + `README.md`
   - `plans/` : Plans de recherche code technology-aware par technologie
     - plan-generic.md (multi-langage)
     - php/plan.md (PSR-4, Composer)
     - javascript/plan.md (ES Modules, npm)
   - Patterns regex spécialisés par technologie
   - Commandes : `create-search-plan`, `validate-search-plan`

4. **Skill Structure** (4.5K) :
   - Agent : `agent-aikido-projet-index`
   - `SKILL.md` + `README.md` + `index.json` (cache)
   - Index JSON projet multi-niveaux (by_path, by_directory, by_type, by_name)
   - Performance : <10ms queries vs 2500ms markdown (~250x)
   - Scripts bash : generate-project-tree.sh, generate-project-tree-json.sh, format-file-metadata.sh, watch-changes.sh
   - Commandes : `reindex-projet`, `clean-index`

5. **Skill Web** (2.2K) :
   - `SKILL.md` + `README.md`
   - Scripts bash + wget pour téléchargement sites web
   - Conversion HTML → Markdown

**Total Skills base** : **14.2K** documentation + **62 scripts bash initiaux**

##### Centralisation Commandes (`/prompts/hard_points/commands/`)
- **Migration V1.3.1** : 33 commandes déplacées de `.roo/commands/` vers `prompts/hard_points/commands/`
- **Système de Mapping** : Wrappers dans `.roo/commands/` et `.claude/commands/` référençant les fichiers réels
- **21 commandes créées** avec spécifications complètes :
  - `analyse-aikido` (619 lignes) : Audit complet conformité
  - `analyse-project` (1323 lignes) : Analyse contextuelle avec plans réutilisables
  - `check-claude` (676 lignes) : Synchronisation CLAUDE.md + génération mappings
  - `check-truth` (864 lignes) : Vérification cohérence documentation ↔ code
  - `clean-index` (353 lignes) : Nettoyage intelligent entrées orphelines
  - `compile-agent-from-use` : Compilation agents autonomes export externe
  - `create-command` (1017 lignes) : Assistant création commandes AI-KIDO
  - `create-persona` (729 lignes) : Création personas avec taxonomie
  - `create-search-plan` (622 lignes) : Création plans recherche code
  - `create-analyse-plan` : Création plans analyse projet
  - `init-aikido` (1040 lignes) : Initialisation Memory Bank
  - `init-glossaire` (500 lignes) : Création glossaire métier
  - `init-raci-aikido` (1070 lignes) : Matrice RACI et organisation
  - `list-command` (69 lignes) : Liste commandes disponibles
  - `logllmon` / `logllmoff` (6 lignes chacun) : Gestion traçabilité
  - `maj-aikido` (464 lignes) : Mise à jour et synchronisation complète
  - `reindex-projet` (91 lignes) : Réindexation complète projet
  - `validate-search-plan` : Validation plans recherche
  - `validate-analyse-plan` : Validation plans analyse
  - `optimize-command-with-aikido-agents` : Optimisation commandes avec agents

**Total commandes hard_points** : **8,441 lignes** de spécifications détaillées

##### Centralisation Agents (`/prompts/hard_points/agents/`)

**12 Agents AI-KIDO internes créés** (Confluence et JIRA ajoutés en V1.3.1) :
  1. `agent-aikido-explore-bank` : Explorateur Memory Bank (v5.1 Grep-only)
  2. `agent-aikido-explore-code` : Explorateur code source avec métadonnées
  3. `agent-aikido-explore-all` : Orchestrateur recherche parallèle bank + code
  4. `agent-aikido-truth-evaluator` : Évaluateur sources de vérité
  5. `agent-aikido-raci-delegator` : Classificateur RACI
  6. `agent-aikido-doc-header` : Gestionnaire en-têtes documents
  7. `agent-aikido-projet-index` : Gestionnaire index JSON projet
  8. `agent-aikido-bank-populate` : Peupleur automatique Memory Bank
  9. `agent-aikido-validator` : Validateur conformité AI-KIDO
  10. `agent-aikido-balancer` : Équilibreur arborescence
  11. `agent-aikido-maj-md-index` : Indexeur Memory Bank (renommé depuis indexer)
  12. `agent-aikido-fusion` : Fusionneur intelligent

**Note** : `agent-aikido-update-controller` et `agent-aikido-confluence` ajoutés progressivement.
Les agents `agent-aikido-confluence` (520 lignes) et `agent-aikido-jira` (580 lignes) sont ajoutés en **V1.3.1**.

#### Nouveaux Agents et Fonctionnalités

##### Agent `agent-aikido-explore-code`
- Recherche profonde code source (hors Memory Bank)
- Technology-aware via plans hiérarchiques
- Output compact avec métadonnées structurées (classes, functions, dependencies)
- Support PSR-4 (PHP), ES Modules (JS/TS)
- Respect .gitignore
- Performance : ~650 lignes, <2500 tokens

##### Agent `agent-aikido-explore-all`
- Orchestrateur minimal recherche parallèle
- Lance explore-bank + explore-code EN PARALLÈLE
- Temps = max(time_bank, time_code) ≈ 3-5s
- Cross-références docs ↔ code
- Performance : ~150 lignes

##### Agent `agent-aikido-projet-index`
- Génération index JSON complet projet
- Cache mémoire 24h
- 4 index multi-niveaux
- Queries <10ms vs 2500ms markdown
- Intégration avec autres agents (300-500x plus rapide)
- Scripts bash optimisés avec jq

##### Agent `agent-aikido-doc-header`
- Standardisation en-têtes documents
- Versioning (Version X.Y | Date | Statut)
- Truth validation metadata (last-check, source authority)
- Source traceability avec dates modification
- Optimisation truth-evaluator (fast-path, économie 70-80% tokens)


#### Configuration et Mapping

##### Système Claude Code
- **`.claude/agents/`** : 14 fichiers mapping agents AI-KIDO
- **`.claude/commands/`** : 33 fichiers mapping commandes
- **Génération automatique** : Via `/check-claude`
- **Intégration complète** : Agents et commandes détectés automatiquement

##### Fichiers Centralisés
- **`agents_list.md`** : Liste complète 14 agents + utilisation détaillée
- **`skills_list.md`** : Liste 7 skills système
- **`commands_list.md`** : Liste 33 commandes
- **`AGENTS.md`** : Interface standardisée Memory Bank (séparation commands/agents)
- **`.roomodes`** : Configuration 14 agents personnalisés

#### Documentation Massive

##### README.md - Refonte Complète (524→2464 lignes, **+1940 lignes, x4.7**)

**Nouvelles sections majeures** :

1. **"🔄 Mettre à Jour une Base AI-KIDO Existante"** (160+ lignes) :
   - Deux méthodes de mise à jour (directe, depuis nouvelle source)
   - Fusion intelligente avec agent-aikido-fusion
   - Workflow détaillé avec choix REMPLACER/FUSIONNER/IGNORER
   - Migration V1.3 automatique
   - Tableau récapitulatif par situation

2. **"📁 Structure du Projet"** (280+ lignes) - **Refonte majeure** :
   - Arborescence V1.3 complète mono-projet (160 lignes)
   - Arborescence V1.3 multi-projet (80 lignes)
   - **"Distinction Personas vs Agents"** (18 lignes) : Explication claire rôles métier vs outils système
   - **"Skills Système"** (18 lignes) : Tableau récapitulatif 7 skills avec agents/commandes/scripts
   - Documentation `/prompts/hard_points/system/` avec 7 skills détaillés
   - Documentation 14 agents internes listés
   - Documentation 33 commandes centralisées
   - Fichiers `.roo/`, `.claude/`, références complètes

3. **"⚡ Commandes AI-KIDO"** (800+ lignes) :
   - **10 commandes d'initialisation** documentées
   - **6 commandes de maintenance** détaillées (check-claude, check-truth, maj-aikido, analyse-aikido, reindex-projet, clean-index)
   - **2 commandes de traçabilité** (logllmon, logllmoff)
   - **Section "🔄 Commandes de Synchronisation Externe"** (310+ lignes) :
     - 6 commandes Confluence : test, init, create-page, import-page, sync, tree
     - **Skill JIRA complet** (220 lignes) : 9 commandes documentées avec syntaxe, processus, KPI, architecture données
   - **Section "🚀 Commandes d'Export"** : compile-agent-from-use

4. **"🤖 Agents AI-KIDO Disponibles"** (700+ lignes) - **Nouvelle section complète** :
   - **14 agents spécialisés** documentés individuellement :
     - Spécialisation, quand l'utiliser, capabilities, conformité, intégration
     - Exemples : explore-bank (366 lignes agent), explore-code (650 lignes), explore-all (150 lignes), projet-index (667 lignes), confluence (520 lignes), etc.
   - **Workflows inter-agents** : 6 patterns de base documentés
   - **Gains de performance** : Tableaux détaillés par agent (jusqu'à 500x)
   - **5 Use Cases détaillés** : Scénarios complets bout-en-bout
   - **Section "💼 Use Cases des Agents AI-KIDO"** (150+ lignes) :
     - Exploration contextuelle, résolution conflits, organisation documentation, workflow complet, mise à jour avec préservation contexte

5. **"🔄 Intégration Inter-Agents"** (100+ lignes) - **Nouvelle section** :
   - Mécanisme fast-path avec fallback gracieux
   - Architecture cache JSON partagé
   - **Tableau gains par agent** : indexer (300-500x), explore-bank (520x location, 97% tokens), balancer (300-500x), validator (500x), etc.
   - Pattern d'intégration type (code bash)
   - Avantages : aucun breaking change, gains massifs, transparent, robuste

6. **Sections enrichies** :
   - **"🚀 Méthode AI-KIDO : Processus Itératif"** : Workflows détaillés par phase
   - **"🚀 Démarrage Rapide avec Claude Code"** : Guide step-by-step
   - **"🎯 Workflow Standard d'Utilisation"** : Nouveaux projets, maintenance, navigation
   - **"🔧 Règles de Qualité"** : Contraintes structurelles, format standard, métriques

##### Guides et Spécifications

**Skills Système** (5 skills de base V1.3.0, 2 ajoutés en V1.3.1) :
- **`prompts/hard_points/system/Skills.md`** (32 lignes) : Définition Skills AI-KIDO

**Skills de base V1.3.0** :
- **Skill Analyse** (2.2K) : SKILL.md + README.md (574 lignes) + plans/
  - Plans d'analyse : architecturale, technique, fonctionnelle, sécurité
- **Skill Maj** (2.9K) : SKILL.md + README.md + plans/
  - Plans de migration, gestion rollback
- **Skill Search** (2.4K) : SKILL.md + README.md + plans/
  - Plans recherche code (generic, php/PSR-4, javascript/ES Modules)
- **Skill Structure** (4.5K) : SKILL.md + README.md + index.json + scripts/
  - 4 scripts bash génération/maintenance index
- **Skill Web** (2.2K) : SKILL.md + README.md + scripts/
  - Scripts téléchargement sites web

**Skills externes V1.3.1** (voir section V1.3.1) :
- **Skill Confluence** (7.1K) : 6 commandes, 1 agent, scripts bash/pandoc
- **Skill JIRA** (9.9K) : 9 commandes, 1 agent, 7 scripts bash, templates HTML/JS

**Total Skills V1.3.0** : **14.2K** documentation + **62 scripts bash** (skills de base uniquement)

##### Memory Bank (`/prompts/gen/`)

**Nouveaux index et structures** :
- **`prompts/gen/agents/index.md`** (23 lignes) : Index agents personas
- **`prompts/gen/concepts/analyse-projet.md`** (234 lignes) : Concept analyse projet
- **`prompts/gen/concepts/guideline-prompts.md`** (36 lignes) : Guidelines prompts
- **`prompts/gen/index.md`** : Enrichi (+45 lignes) avec navigation améliorée
- **Use cases** enrichis : Confluence/, Jira/ avec données synchronisées

#### Structure et Architecture V1.3

##### Point d'Entrée Unifié
- **`/prompts/index.md`** : Point d'entrée UNIQUE pour mono et multi-projet (V1.3+)
- **Ancien système** (< V1.3) : `/prompts/gen/index.md` (mono) ou `/prompts/[projet]/gen/index.md` (multi) - **OBSOLÈTE**
- **Navigation uniforme** : Même pattern pour tous types de projets
- **Multi-projet** : `/prompts/index.md` liste et référence tous les projets

##### Réorganisation Arborescente
- **`/prompts/gen/`** : Memory Bank évolutive (concepts, techniques, personas, use_cases)
- **`/prompts/hard_points/`** : Vérités immuables avec nouvelle structure V1.3 :
  - `agents/` : 14 agents internes (nouveau)
  - `commands/` : 33 commandes centralisées (nouveau)
  - `system/` : 7 Skills système (nouveau)
  - `concepts/`, `techniques/`, `personas/`, `use_cases/` : Hard points immuables
- **`/prompts/spec/`** : Espaces personnels (logs/, aikido-source-git/)

##### Configuration et Mapping
- **`.roo/`** : Configuration Roo-Code
  - `commands/` : 33 wrappers commandes
  - `.roomodes` : Configuration 14 agents personnalisés (228 lignes)
- **`.claude/`** : Configuration Claude Code (nouveau)
  - `agents/` : 15 mappings agents (14 AI-KIDO + personas projet)
  - `commands/` : 33 mappings commandes
- **`.roo/rules-orchestrator/rules.md`** (36 lignes) : Règles orchestration

##### Contraintes et Règles
- **18 Règles AI-KIDO** maintenues et enrichies
- **Contraintes taille** : ≤500 lignes standard, ≤1000 pour agents/personas/commands/skills
- **Exception** : `prompts/hard_points/system/structure/index.json` (no limit, cache)
- **4 niveaux max** profondeur arborescence
- **Liens bidirectionnels** systématiques

### 🔧 Modifié

#### Optimisations Fichiers de Règles
- **`ai-kido.md`** : Allégé (-519 lignes) → détails dans `ai-kido_details.md` (+417 lignes)
- **`ai-kido-light.md`** : Allégé (-440 lignes) → détails dans `ai-kido-light_details.md` (+383 lignes)
- **Principe** : Fichiers core concis pour chargement rapide, détails consultables à la demande
- **Performance** : -30% tokens chargement initial, +50% vitesse parsing

#### Optimisations Performance
- **explore-bank** : v5.1 strict-budget Grep-only
  - Filtrage automatique (exclusion tests, auto-refs)
  - Budget tokens +100-200% vs Grep standard
  - Trade-off : 3-5× contexte enrichi vs 2-3s agent
- **Intégration projet-index** : Fast-path pour agents
  - explore-bank : 520x plus rapide location queries (2.6s → <5ms, 97% tokens économisés)
  - indexer : 300-500x plus rapide scan fichiers (3-5s → <10ms)
  - balancer : 300-500x plus rapide analyse structure
- **check-truth** : Optimisation 70-80% efficacité
  - Fast-path via last-check metadata
  - Skip validation si ✅ + sources inchangées
  - 20-30k tokens vs ~100k sans optimisation

#### Amélioration Commandes
- **`maj-aikido`** :
  - Support plans de migration
  - Mode UPDATE avec fusion intelligente
  - Gestion rollback
  - Compatibilité archives (tar.gz, zip)
- **`analyse-project`** :
  - Support plans d'analyse réutilisables
  - 4 niveaux profondeur (survol, standard, approfondi, expert)
  - Génération prompts agents
- **`check-claude`** :
  - Génération automatique `.claude/agents/` et `.claude/commands/`
  - Rapport détaillé conformité
  - Synchronisation CLAUDE.md

#### Workflows et Patterns
- **Patterns de base** (6 workflows documentés) :
  - explore-bank → truth-evaluator (fast-path) → dev → raci-delegator
  - truth-evaluator → doc-header (MAJ last-check)
  - bank-populate → doc-header → validator
  - File operation → validator (auto-validation)
  - Source update → fusion → truth-evaluator → doc-header → validator

#### Communication Inter-Agents
- **Format JSON obligatoire** : Tous échanges entre modes et agents internes Aikido
- **Factorisation appels** : Un seul appel agent par requête avec paramètres agrégés
- **Gestion bégaiement** : Élimination boucles infinies appels inter-agents

### 🗑️ Supprimé

- **Duplication commandes** : Contenu déplacé de `.roo/commands/` vers `prompts/hard_points/commands/`
- **Ancien système indexation** : Remplacé par projet-index JSON
- **Agent `agent-aikido-indexer`** : Renommé en `agent-aikido-maj-md-index`

### 🐛 Corrigé

- **Optimisation tokens** : Réduction coût tokens sur agents explore-bank, validator
- **Scripts bash** : Compatibilité POSIX-sh (Rocky, Ubuntu)
- **Gestion erreurs** : Robustesse globale améliorée
- **Boucles agents** : Élimination bégaiements appels inter-agents
- **Permissions scripts** : Scripts bash exécutables automatiquement
- **Format JSON** : Correction communication inter-agents

### 📊 Statistiques V1.3.0 - Tableau Comparatif

| Métrique | V1.2.0 | V1.3.0 | Évolution |
|----------|--------|--------|-----------|
| **Lignes de code** | ~6,000 | ~56,000 | **+50,240 (+933%)** |
| **README.md** | 524 lignes | 2,464 lignes | **+1,940 (+370%)** |
| **Fichiers hard_points/** | 96 | 197 | **+101 (+105%)** |
| **Agents** | 6 | 14 | **+8 (+133%)** |
| **Commandes** | 10 | 33 | **+23 (+230%)** |
| **Skills système** | 0 | 5 | **+5 (nouveau)** |
| **Scripts bash** | ~10 | 62 | **+52 (+520%)** |
| **Documentation** | ~2,000 lignes | ~40,000 lignes | **+38,000 (+1900%)** |
| **Fichiers `.claude/`** | 0 | 48 | **+48 (nouveau)** |
| **Fichiers système** | 96 | 205 | **+109 (+113%)** |

**Gains de Performance** :
- **Opérations filesystem** : Jusqu'à **500x plus rapide** (3-5s → <10ms)
- **Réduction tokens** : **70-97%** économie selon agent
- **Chargement règles** : **-30% tokens**, **+50% vitesse**
- **Requêtes index** : **520x plus rapide** (2.6s → <5ms)

**Volumes Documentés** :
- **Commandes hard_points** : 8,441 lignes de spécifications
- **Skills système** : 31.2K documentation + 77 scripts
- **Agents AI-KIDO** : 14 agents documentés (366-667 lignes chacun)
- **README.md sections** : 6 sections majeures nouvelles (1,940 lignes)

**Centralisation Réussie** :
- ✅ **100% commandes** déplacées dans `hard_points/commands/`
- ✅ **100% agents** centralisés dans `hard_points/agents/`
- ✅ **5 Skills de base** structurés dans `hard_points/system/` (+ 2 en V1.3.1)
- ✅ **Mapping complet** `.roo/` et `.claude/` (81 fichiers)
- ✅ **Point d'entrée unifié** `/prompts/index.md`

---

## [1.2.0] - 2025-11-15

### 🎉 Ajouté

#### Commandes Fondamentales
- `init-aikido` : Initialisation Memory Bank avec analyse automatique
- `init-glossaire` : Création glossaire métier ventilé par domaines
- `init-raci-aikido` : Initialisation matrice RACI et organisation équipe
- `analyse-project` : Analyse contextuelle projet existant
- `analyse-aikido` : Audit complet conformité AI-KIDO
- `create-persona` : Création personas avec taxonomie hiérarchique
- `compile-agent-from-use` : Compilation agents autonomes export externe

#### Agents de Base
- `agent-aikido-explore-bank` : Explorateur Memory Bank
- `agent-aikido-truth-evaluator` : Évaluateur sources de vérité
- `agent-aikido-raci-delegator` : Classificateur RACI
- `agent-aikido-validator` : Validateur conformité rapide
- `agent-aikido-balancer` : Équilibreur arborescence
- `agent-aikido-bank-populate` : Peupleur automatique Memory Bank

#### Structure de Base
- **Point d'entrée** : `/prompts/gen/index.md`
- **Arborescence** :
  - `/prompts/gen/concepts/` : Concepts fondamentaux
  - `/prompts/gen/techniques/` : Méthodes pratiques
  - `/prompts/gen/personas/` : Personas métier
  - `/prompts/gen/use_cases/` : Applications concrètes
  - `/prompts/hard_points/` : Vérités immuables
  - `/prompts/spec/` : Espaces personnels

#### Documentation
- **`README.md`** : Documentation complète méthode AI-KIDO
- **`AGENTS.md`** : Interface standardisée Memory Bank
- **`CLAUDE.md`** : Mapping AI-KIDO ↔ Norme CLAUDE.md
- **`prompts/hard_points/ai-kido.md`** : Guide 18 règles (Mode STANDARD)
- **`prompts/hard_points/ai-kido-light.md`** : Guide Mode LIGHT

#### Fonctionnalités
- **18 Règles AI-KIDO** : Structure arborescente, séparation théorie/pratique, auto-alimentation, équilibrage, liens bidirectionnels
- **Modes** : STANDARD (grandes équipes) et LIGHT (solo/petites équipes)
- **Traçabilité** : Logs interactions LLM (`logllmon`, `logllmoff`)
- **Matrice RACI** : Organisation collaborative par rôles
- **Taxonomie personas** : Hiérarchie 4 niveaux (Catégorie → Famille → Persona → Spécialisation)

### 📊 Statistiques V1.2.0

- **6 Agents de base**
- **10 Commandes fondamentales**
- **18 Règles AI-KIDO**
- **2 Modes** (Standard, Light)
- **4 Domaines** Memory Bank (concepts, techniques, personas, use_cases)

---

## Notes de Migration

### Migration 1.2.0 → 1.3.0

#### Actions Requises

1. **Mettre à jour structure** :
   ```bash
   /maj-aikido --update
   ```

2. **Centralisation commandes** :
   - Les commandes dans `.roo/commands/` deviennent des wrappers
   - Fichiers réels déplacés dans `prompts/hard_points/commands/`

3. **Nouveaux Skills** :
   - Installer Skills selon besoins (Confluence, Search, Structure)
   - Configurer `.env` pour Skills externes (Confluence)

4. **Agents supplémentaires** :
   - 8 nouveaux agents disponibles
   - Mapping automatique via `/check-claude`

5. **Point d'entrée V1.3** :
   - Nouveau point d'entrée unifié `/prompts/index.md`
   - Navigation adaptée mono/multi-projet

#### Compatibilité

- ✅ **Rétrocompatible** : Ancien système fonctionne avec fallback
- ✅ **Migration automatique** : Via `/maj-aikido`
- ✅ **Rollback possible** : Backups automatiques (.bak)

### Migration 1.3.0 → 1.3.1

#### Méthode Recommandée : Mise à Jour Automatique

**Option 1 : Via `/maj-aikido` (RECOMMANDÉ)** :

```bash
# Mettre à jour le système AI-KIDO automatiquement
/maj-aikido --update
```

**Processus automatique** :
1. ✅ Détection dépôt Git AI-KIDO existant (`/prompts/spec/aikido-source-git/`)
2. 🔄 `git pull` pour récupérer dernières modifications (Skills Confluence + JIRA)
3. 📊 Analyse différentielle : comparaison source ↔ cible
4. 🎯 Choix par fichier : REMPLACER / FUSIONNER / IGNORER
5. 🔒 Hard points remplacés automatiquement
6. ✅ Migration V1.3.1 si nécessaire
7. 📋 Rapport détaillé

**Avantages** :
- ✅ Installation automatique Skills Confluence et JIRA
- ✅ Mise à jour agents, commandes, scripts
- ✅ Fusion intelligente avec `agent-aikido-fusion`
- ✅ Backup automatique (fichiers .bak)
- ✅ Rollback possible si problème

---

#### Option 2 : Installation Manuelle Skills (optionnelle)

**Si vous préférez installer manuellement les Skills** :

##### 1. **Installer Skill Confluence** (optionnel)

```bash
# Suivre guide : prompts/hard_points/system/confluence/README.md
```

**Prérequis pandoc** (obligatoire pour Confluence) :
```bash
# macOS
brew install pandoc

# Linux (Debian/Ubuntu)
apt install pandoc

# Linux (RHEL/CentOS)
yum install pandoc
```

**Configuration Confluence** :
```bash
cd prompts/hard_points/system/confluence/
cp .env.example .env
# Éditer .env avec credentials Confluence Cloud :
# - CONFLUENCE_URL (ex: https://your-domain.atlassian.net/wiki)
# - CONFLUENCE_USER (email)
# - CONFLUENCE_API_TOKEN (générer sur Atlassian)
```

##### 2. **Installer Skill JIRA** (optionnel)

```bash
# Suivre guide : prompts/hard_points/system/jira/install-aikido.md
```

**Prérequis JQ** (obligatoire pour JIRA) :
```bash
# macOS
brew install jq

# Linux (Debian/Ubuntu)
apt install jq

# Linux (RHEL/CentOS)
yum install jq
```

**Configuration JIRA** :
```bash
cd prompts/hard_points/system/jira/
cp .env.example .env
# Éditer .env avec credentials JIRA Cloud :
# - JIRA_URL (ex: https://your-domain.atlassian.net)
# - JIRA_USER (email)
# - JIRA_API_TOKEN (générer sur Atlassian)
# - JIRA_PROJECT_KEY (ex: PROJ)
```

##### 3. **Redémarrer IDE**

```bash
# Redémarrer VSCode/Claude Code/Roo-Code
# Agents et commandes détectés automatiquement
```

---

#### Actions Post-Migration

1. **Vérifier installation** :
   ```bash
   # Tester Confluence (si installé)
   /confluence-test

   # Tester JIRA (si installé)
   /jira-test
   ```

2. **Consulter documentation** :
   - README.md section "Skills Confluence" (160 lignes)
   - README.md section "Skills JIRA" (310 lignes)
   - `agents_list.md` pour utilisation agents

3. **Mapping automatique** :
   ```bash
   # Synchroniser mapping Claude Code
   /check-claude
   ```

---

#### Compatibilité

- ✅ **Rétrocompatible** : Skills Confluence et JIRA **optionnels**
- ✅ **Pas de breaking change** : Système existant non affecté
- ✅ **Installation guidée** : Documentation complète fournie
- ✅ **Rollback possible** : Backups automatiques (.bak)
- ⚠️ **Prérequis externes** : pandoc (Confluence) et jq (JIRA) requis si Skills utilisés

---

## Feuille de Route

### Version 1.3.2 (Planifiée)

#### Fonctionnalités Prévues
- Intégration du Skill DEX.
- Améliorations UX pour commandes interactives.
- Intégration de Skill BA pour action entre DEX et Jira.
- Intégration Skills TestLeaders et DevOps.
- Support multi-langues (FR/EN). (Opt)

#### Optimisations
- **Réduction tokens** : Objectif -20% supplémentaires
- **Cache partagé** : Cache JSON inter-agents
- **Parallélisation** : Agents asynchrones natifs

---

## Contributeurs

- **Core Team AI-KIDO** : Architecture et développement
- **Community** : Retours utilisateurs et suggestions

---

## Licence

Propriétaire - © 2025 aikido.fr

---

**Dernière mise à jour** : 2026-01-06
