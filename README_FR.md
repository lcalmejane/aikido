> 🌐 [English](README.md) | **Français**

# AI‑KIDO – Méthode de Construction de Memory Bank IA

## Description

**AI‑KIDO** est une méthode structurée pour créer et maintenir une **memory bank** (base de connaissances) optimisée pour les interactions avec les LLM avec une équipe humaine. Cette base constitue un système de **Tables de Vérités** hiérarchique permettant de capitaliser, structurer et réutiliser les connaissances de manière efficace et cohérente.

La méthode AI‑KIDO suit un processus itératif alternant entre approches **fonctionnelle/technique** et **globale/spécifique** pour construire progressivement une base de connaissances robuste et évolutive.

## 🎯 Philosophie AI‑KIDO

AI‑KIDO repose sur 18 règles fondamentales qui garantissent :

- **🌳 Structure arborescente** : Navigation récursive depuis un point d'entrée unique
- **📊 Séparation théorie/pratique** : Concepts vs techniques, personas vs use cases
- **🔄 Auto-alimentation** : Amélioration continue basée sur les retours d'expérience
- **⚖️ Équilibrage** : Contraintes de taille (≤500 lignes standard, ≤1000 pour agents/personas/commands/skills, prompts/hard_points/system/structure/index.json no limit.) et profondeur (4 niveaux max)
- **🔗 Liens bidirectionnels** : Navigation cohérente dans toutes les directions
- **👥 Répartition par rôles** : Organisation collaborative avec matrice RACI

---

## 🔄 Mettre à Jour une Base AI-KIDO Existante

### Deux Méthodes de Mise à Jour

#### 📦 Méthode 1 : Mise à Jour Directe (Git AI-KIDO déjà cloné)

**Si vous avez déjà le dépôt Git AI-KIDO dans `/prompts/spec/aikido-source-git/`** :

```bash
# Lancer la mise à jour en mode UPDATE
/maj-aikido --update
```

**Processus** :

1. ✅ Détection automatique du dépôt Git existant
2. 🔄 `git pull` pour récupérer les dernières modifications
3. 📊 Analyse différentielle : comparaison source ↔ cible
4. 🎯 Choix utilisateur par fichier :
   - **REMPLACER** : Nouvelle version avec backup (.bak)
   - **FUSIONNER** : Fusion intelligente avec agent-aikido-fusion
   - **IGNORER** : Conserver version actuelle
5. 🔒 Hard points remplacés automatiquement (autorité absolue)
6. ✅ Migration V1.3 si nécessaire
7. 📋 Rapport détaillé de la mise à jour

**Avantages** : Rapide, pas de téléchargement, synchronisation directe depuis le dépôt GitHub

---

#### 🆕 Méthode 2 : Installation Initiale ou Mise à Jour depuis Nouvelle Source

**Si vous n'avez PAS encore le dépôt Git AI-KIDO** ou voulez utiliser une autre source :

##### Option A : Depuis Git AI-KIDO (Première Installation)

```bash
# Si vous etes en version ancienne (< V1.3), copier d'abord le script maj-aikido dans /roo/commands/
cp /prompts/spec/aikido-source-git/prompts/hard_points/commands/maj-aikido /prompts/hard_points/commands/

# Lancer la mise à jour en mode UPDATE
/maj-aikido --update

# Choisir l'option 1 : GIT AI-KIDO
Choix : 1
```

**La commande va** :

1. 📥 Cloner automatiquement le dépôt officiel :

   ```
   git@github.com:lcalmejane/aikido.git
   ```

2. 📂 Installation dans `/prompts/spec/aikido-source-git/`
3. 🔄 Continuer avec le processus de mise à jour standard

##### Option B : Depuis Archive (tar.gz/zip)

**Si vous avez reçu une archive AI-KIDO** :

```bash
# 1. Placer l'archive dans /prompts/spec/
mv ai-kido-vX.Y.Z.tar.gz /prompts/spec/

# Si vous etes en version ancienne (< V1.3), copier d'abord le script maj-aikido dans /roo/commands/
cp /prompts/spec/aikido-source-git/prompts/hard_points/commands/maj-aikido /prompts/hard_points/commands/

# 2. Lancer la mise à jour
/maj-aikido --update

# 3. Choisir l'option 3 : ARCHIVE
Choix : 3

# 4. Indiquer le chemin
Archive : /prompts/spec/ai-kido-vX.Y.Z.tar.gz
```

**Formats supportés** : `.tar.gz`, `.tgz`, `.zip`

##### Option C : Depuis Répertoire Local

**Si vous avez déjà extrait les sources quelque part** :

```bash
# Si vous etes en version ancienne (< V1.3), copier d'abord le script maj-aikido dans /roo/commands/
cp /path/to/ai-kido-sources/prompts/hard_points/commands/maj-aikido /prompts/hard_points/commands/

# 1. Lancer la mise à jour
/maj-aikido --update

# 2. Choisir l'option 2 : RÉPERTOIRE LOCAL
Choix : 2

# 3. Indiquer le chemin
Répertoire : /path/to/ai-kido-sources/
```

---

### 🔀 Fusion Intelligente avec Agent-Aikido-Fusion

Lors de la mise à jour, pour chaque fichier modifié, vous pouvez choisir **"2. FUSIONNER"** :

**Processus de fusion** :

1. 🤖 L'agent-aikido-fusion est invoqué automatiquement
2. 📝 Un script de fusion est généré : `/tmp/aikido/aikido-fusion-*.md`
3. ⚡ **Option Automatique** : Exécuter `claude < /tmp/aikido/aikido-fusion-*.md`
4. 🔄 L'agent applique les règles de fusion :
   - ✅ **Adopte** le formalisme et la structure SOURCE (nouvelle version)
   - ✅ **Préserve** le contexte et les exemples CIBLE (votre projet)
   - ✅ **Intègre** tous les nouveaux concepts SOURCE
   - ✅ **Résout** les conflits intelligemment
5. 📦 Génération de deux fichiers :
   - `fichier.merged.YYYYMMDD-HHMMSS` : Fichier fusionné
   - `fichier.merged.YYYYMMDD-HHMMSS.meta.json` : Métadonnées de fusion
6. 👀 Révision et validation utilisateur
7. ✅ Remplacement final : `mv fichier.merged.* fichier.md`

**Règles de fusion** :

- 📋 **Formalisme SOURCE** : Structure, titres, frontmatter de la nouvelle version
- 💼 **Contexte CIBLE** : Exemples projet, configurations spécifiques préservés
- 🆕 **Nouveautés SOURCE** : Tous les nouveaux concepts intégrés
- ⚖️ **Résolution Conflits** : SOURCE pour forme, CIBLE pour contenu projet
- ✅ **Conformité AI-KIDO** : ≤500 lignes, liens bidirectionnels, frontmatter valide

**Fallback Manuel** : Si la fusion automatique échoue, un template structuré est créé avec instructions détaillées pour fusion manuelle.

---

### 📊 Après la Mise à Jour

**1. Vérifier l'état de la base** :

```bash
/check-claude (Si vous êtes sous Claude Code)
```

**2. Audit conformité** (recommandé) :

```bash
/analyse-aikido
```

**3. Relancer Claude Code** (si nouveaux agents/commandes)

**4. Consulter les backups** (si besoin de rollback) :

```bash
find . -name "*.bak.*" -type f
```

---

### 🎯 Récapitulatif

| Situation | Commande | Source |
|-----------|----------|--------|
| **Git AI-KIDO déjà cloné** | `/maj-aikido --update` | Pull automatique |
| **Première installation depuis Git** | `/maj-aikido --update` → Option 1 | Clone depuis GitHub |
| **Depuis archive tar.gz/zip** | `/maj-aikido --update` → Option 3 | Extraction archive |
| **Depuis répertoire local** | `/maj-aikido --update` → Option 2 | Copie depuis répertoire |

**💡 Recommandation** : Après la première installation Git AI-KIDO, utilisez toujours la méthode directe (`/maj-aikido --update`) pour bénéficier des mises à jour automatiques.

---

## 📁 Structure du Projet

### Structure Mono-Projet (Défaut) - V1.3

```
/
├── prompts/
│   ├── index.md                    # 🎯 POINT D'ENTRÉE UNIQUE (V1.3+)
│   │
│   ├── gen/                        # 🧠 Memory Bank - Tables de Vérités (Évolutif)
│   │   ├── index.md               # 📚 Navigateur interne /prompts/gen/
│   │   ├── concepts/              # 📚 Concepts fondamentaux (théorie)
│   │   ├── techniques/            # 🔧 Méthodes pratiques (application)
│   │   ├── personas/              # 👤 Personas métier (rôles humains/experts)
│   │   └── use_cases/             # 💼 Applications concrètes par contexte
│   │
│   ├── hard_points/               # 🔒 Vérités Immuables (PRIORITÉ ABSOLUE)
│   │   ├── index.md              # 📋 Index hard points
│   │   ├── ai-kido.md            # 📖 Guide V1.3 - 18 règles (Mode STANDARD)
│   │   ├── ai-kido-light.md      # 📖 Guide V1.3 - Mode LIGHT (bases légères)
│   │   ├── gestion-logs-aikido.md # 📝 Règles traçabilité LLM
│   │   │
│   │   ├── agents/               # 🤖 Agents AI-KIDO internes (14 agents techniques)
│   │   │   ├── agent-aikido-explore-bank.md
│   │   │   ├── agent-aikido-explore-code.md
│   │   │   ├── agent-aikido-explore-all.md
│   │   │   ├── agent-aikido-truth-evaluator.md
│   │   │   ├── agent-aikido-raci-delegator.md
│   │   │   ├── agent-aikido-doc-header.md
│   │   │   ├── agent-aikido-projet-index.md
│   │   │   ├── agent-aikido-bank-populate.md
│   │   │   ├── agent-aikido-validator.md
│   │   │   ├── agent-aikido-balancer.md
│   │   │   ├── agent-aikido-maj-md-index.md
│   │   │   ├── agent-aikido-fusion.md
│   │   │   └── agent-aikido-update-controller.md
│   │   │
│   │   ├── commands/             # ⚡ Commandes AI-KIDO centralisées (33 commandes)
│   │   │   ├── init-aikido.md
│   │   │   ├── init-glossaire.md
│   │   │   ├── init-raci-aikido.md
│   │   │   ├── analyse-project.md
│   │   │   ├── analyse-aikido.md
│   │   │   ├── check-claude.md
│   │   │   ├── check-truth.md
│   │   │   ├── maj-aikido.md
│   │   │   ├── create-persona.md
│   │   │   ├── create-command.md
│   │   │   ├── create-search-plan.md
│   │   │   ├── create-analyse-plan.md
│   │   │   ├── validate-search-plan.md
│   │   │   ├── validate-analyse-plan.md
│   │   │   ├── compile-agent-from-use.md
│   │   │   ├── optimize-command-with-aikido-agents.md
│   │   │   ├── reindex-projet.md
│   │   │   ├── clean-index.md
│   │   │   ├── logllmon.md
│   │   │   ├── logllmoff.md
│   │   │   └── list-command.md
│   │   │
│   │   ├── concepts/             # 📚 Concepts hard (immuables)
│   │   ├── techniques/           # 🔧 Techniques hard (immuables)
│   │   ├── personas/             # 👤 Personas hard (immuables, rarement utilisé)
│   │   ├── use_cases/            # 💼 Use cases hard (immuables)
│   │   │
│   │   └── system/               # ⚙️ SYSTÈME AI-KIDO (Skills & Infrastructure)
│   │       ├── Skills.md         # 📖 Définition Skills AI-KIDO
│   │       │
│   │       ├── analyse/          # 🔍 Skill Analyse (plans d'analyse projet)
│   │       │   ├── SKILL.md
│   │       │   ├── README.md
│   │       │   └── plans/        # Plans d'analyse (architecturale, technique, etc.)
│   │       │
│   │       │   ├── SKILL.md
│   │       │   ├── README.md
│   │       │   ├── .env.example
│   │       │   ├── agents/
│   │       │
│   │       │   ├── SKILL.md
│   │       │   ├── README.md
│   │       │   ├── ARCHITECTURE.md
│   │       │   ├── install-aikido.md
│   │       │   ├── .env.example
│   │       │   ├── agents/
│   │       │   │   ├── lib/      # Bibliothèques communes
│   │       │   │   └── *.sh      # Scripts sync, calcul KPI, génération rapports
│   │       │   ├── templates/    # Templates HTML/JS rapports
│   │       │   └── examples/     # Exemples configurations
│   │       │
│   │       ├── search/           # 🔎 Skill Search (plans recherche code)
│   │       │   ├── SKILL.md
│   │       │   ├── README.md
│   │       │   └── plans/        # Plans recherche par technologie
│   │       │       ├── plan-generic.md      # Multi-langage
│   │       │       ├── php/plan.md          # PHP + PSR-4
│   │       │       └── javascript/plan.md   # JS/TS + ES Modules
│   │       │
│   │       ├── structure/        # 🗂️ Skill Structure (index projet JSON)
│   │       │   ├── SKILL.md
│   │       │   ├── README.md
│   │       │   ├── index.json    # Index complet projet (cache 24h)
│   │       │   └── scripts/      # Scripts génération/maintenance index
│   │       │       ├── generate-project-tree.sh
│   │       │       ├── generate-project-tree-json.sh
│   │       │       ├── format-file-metadata.sh
│   │       │       └── watch-changes.sh
│   │       │
│   │       ├── web/              # 🌐 Skill Web (téléchargement sites)
│   │       │   ├── SKILL.md
│   │       │   └── README.md
│   │       │
│   │       └── maj/              # 🔄 Skill Maj (mises à jour AI-KIDO)
│   │           ├── SKILL.md
│   │           └── README.md
│   │
│   └── spec/                     # ⚠️ Espaces Personnels (IGNORER sauf activation)
│       ├── aikido-source-git/    # 📦 Clone Git AI-KIDO (/maj-aikido --update)
│       └── logs/                 # 📊 Logs interactions (LLM_TRACIBILITY=TRUE)
│           └── prompts.log       # Format markdown horodaté
│
├── .roo/                         # 🔧 Configuration Roo-Code
│   ├── commands/                 # Wrappers commandes (33 fichiers .md)
│   │   ├── init-aikido.md
│   │   └── ...                   # Autres commandes AI-KIDO
│   └── .roomodes                 # Configuration agents personnalisés
│
├── .claude/                      # 🤖 Configuration Claude Code
│   ├── agents/                   # Mapping agents (14 fichiers .md)
│   │   ├── agent-aikido-*.md     # 14 agents internes AI-KIDO
│   │   └── ...                   # Personas projet convertis
│   └── commands/                 # Mapping commandes (33 fichiers .md)
│       ├── init-aikido.md
│       └── ...                   # Autres commandes AI-KIDO
│
├── AGENTS.md                     # 🤖 Interface standardisée Memory Bank
├── agents_list.md                # 📋 Liste complète agents + utilisation
├── skills_list.md                # 📦 Liste complète skills système
├── commands_list.md              # ⚡ Liste complète commandes
├── CLAUDE.md                     # 📊 Mapping AI-KIDO ↔ Norme CLAUDE.md
└── README.md                     # 📖 Ce fichier
```

### Distinction Personas vs Agents

**Personas** (`/prompts/gen/personas/`) :
- 👤 **Rôles métier/humains** : Architecte, Développeur, Product Owner, etc.
- 🎭 **Expertise domaine** : Connaissances spécifiques d'un rôle
- 📝 **Évolutif** : Créés selon besoins projet (`/create-persona`)
- 💼 **Usage** : Consultation pour perspective métier
- **Exemples** : Architecte Solution, Expert Sécurité, Scrum Master

**Agents** (`/prompts/hard_points/agents/`) :
- 🤖 **Outils techniques** : Validation, exploration, synchronisation
- ⚙️ **Fonctions système** : Opérations automatisées AI-KIDO
- 🔒 **Immuable** : Partie core du système AI-KIDO
- 🚀 **Usage** : Exécution automatique de tâches

**Résumé** :
- **Personas** = Qui (rôles humains) → `/gen/personas/`
- **Agents** = Quoi (outils système) → `/hard_points/agents/` + `/hard_points/system/*/agents/`

### Skills Système

Les **Skills** (`/prompts/hard_points/system/`) regroupent des capacités fonctionnelles complètes :

| Skill | Description | Agents | Commandes | Scripts |
|-------|-------------|--------|-----------|---------|
| **analyse** | Plans d'analyse projet | 0 | 2 | Plans markdown |
| **search** | Plans recherche code tech-aware | 0 | 2 | Plans markdown |
| **structure** | Index JSON projet + cache 24h | 1 | 2 | Bash + JQ |
| **web** | Téléchargement sites web | 0 | 0 | Bash + wget |
| **maj** | Mises à jour système AI-KIDO | 1 | 1 | Bash + git |

**Chaque Skill contient** :
- `SKILL.md` : Spécification technique complète
- `README.md` : Guide utilisateur
- `agents/` : Agent(s) spécialisé(s) du skill
- `commands/` : Commandes exposées
- `scripts/` : Scripts bash/JQ d'implémentation
- `.env.example` : Configuration (si API externe)

### Structure Multi-Projet - V1.3

```
/
├── prompts/
│   ├── index.md                    # 🎯 POINT D'ENTRÉE UNIQUE (V1.3+)
│   │                               #    → Liste et référence tous les projets
│   │
│   ├── [projet-1]/                 # 📁 Projet 1 (Memory Bank isolée)
│   │   ├── index.md               # 📚 Point d'entrée projet-1
│   │   ├── gen/                   # 🧠 Memory Bank projet-1
│   │   │   ├── index.md
│   │   │   ├── concepts/
│   │   │   ├── techniques/
│   │   │   ├── personas/          # Personas spécifiques projet-1
│   │   │   └── use_cases/
│   │   └── hard_points/           # 🔒 Vérités immuables projet-1
│   │       ├── ai-kido.md
│   │       ├── concepts/
│   │       ├── techniques/
│   │       └── use_cases/
│   │
│   ├── [projet-2]/                 # 📁 Projet 2 (Memory Bank isolée)
│   │   ├── index.md
│   │   ├── gen/                   # Memory Bank projet-2
│   │   └── hard_points/           # Vérités immuables projet-2
│   │
│   ├── hard_points/               # 🔒 Hard Points PARTAGÉS (tous projets)
│   │   ├── index.md
│   │   ├── ai-kido.md            # Règles communes AI-KIDO
│   │   ├── gestion-logs-aikido.md
│   │   │
│   │   ├── agents/               # 🤖 Agents AI-KIDO (14 agents partagés)
│   │   │   ├── agent-aikido-explore-bank.md
│   │   │   ├── agent-aikido-explore-code.md
│   │   │   └── ...               # Tous les agents système
│   │   │
│   │   ├── commands/             # ⚡ Commandes partagées (33 commandes)
│   │   │   ├── init-aikido.md
│   │   │   ├── analyse-project.md
│   │   │   └── ...               # Toutes les commandes AI-KIDO
│   │   │
│   │   └── system/               # ⚙️ SYSTÈME AI-KIDO (Skills partagés)
│   │       ├── Skills.md
│   │       ├── analyse/          # Skill Analyse
│   │       ├── search/           # Skill Search
│   │       ├── structure/        # Skill Structure
│   │       ├── web/              # Skill Web
│   │       └── maj/              # Skill Maj
│   │
│   └── spec/                     # ⚠️ Espaces personnels (IGNORER)
│       └── logs/                 # Logs partagés tous projets
│
├── .roo/
│   ├── commands/                 # Wrappers commandes (33 fichiers)
│   └── .roomodes                 # Agents multi-projets
│
├── .claude/
│   ├── agents/                   # Mapping agents (14 agents + personas)
│   └── commands/                 # Mapping commandes (33 commandes)
│
├── AGENTS.md                     # 🤖 Interface multi-projets
├── agents_list.md                # 📋 Liste agents tous projets
├── skills_list.md                # 📦 Liste skills système
├── commands_list.md              # ⚡ Liste commandes
├── CLAUDE.md                     # 📊 Mapping multi-projets
└── README.md                     # 📖 Ce fichier
```

**Architecture Multi-Projet** :

- **Memory Banks isolées** : Chaque projet a sa propre arborescence `/gen/` et `/hard_points/` spécifiques
- **Système partagé** : `/prompts/hard_points/` contient agents, commandes et skills communs à tous projets
- **Point d'entrée unique** : `/prompts/index.md` liste et référence tous les projets
- **Navigation** : `/prompts/index.md` → `/prompts/[projet-n]/index.md` → `/prompts/[projet-n]/gen/index.md`

**⚠️ CHANGEMENT MAJEUR V1.3** : Point d'entrée **unifié** `/prompts/index.md` pour TOUS les types de projets

**Navigation Mono-Projet** :

1. `/prompts/index.md` → Point d'entrée UNIQUE (référence `/prompts/gen/`, `/prompts/hard_points/`)
2. `/prompts/gen/index.md` → Navigation interne (concepts, techniques, personas, use_cases)

**Navigation Multi-Projet** :

1. `/prompts/index.md` → Point d'entrée UNIQUE (liste et pointe tous les projets)
2. `/prompts/[projet-n]/index.md` → Point d'entrée spécifique du projet
3. `/prompts/[projet-n]/gen/index.md` → Navigation interne du projet

**ANCIEN SYSTÈME (< V1.3)** : `/prompts/gen/index.md` (mono) ou `/prompts/[projet]/gen/index.md` (multi) - **OBSOLÈTE**

## 🚀 Méthode AI‑KIDO : Processus Itératif

### Phase 1 : Initialisation de la Base

#### 1.1 `init-aikido` - Fondations du Projet

**Objectif** : Créer la structure de base de la memory bank

**Processus itératif** :

1. **Analyse des sources** (Fonctionnel) → Détection automatique du contexte projet
2. **Architecture système** (Technique) → Modélisation C1 et composants
3. **Stack technique** (Spécifique) → Technologies et outils identifiés
4. **Use cases fondamentaux** (Global) → Cas d'usage de base du domaine

**Résultat** : Structure `/prompts/gen/` initialisée avec les fichiers de base

#### 1.2 `init-glossaire` - Terminologie Métier

**Objectif** : Clarifier la terminologie spécifique au projet

**Processus itératif** :

1. **Extraction terminologique** (Spécifique) → Termes métier confus ou ambigus
2. **Analyse contextuelle** (Fonctionnel) → Domaine métier et sous-domaines
3. **Définitions structurées** (Technique) → Glossaire organisé par catégories
4. **Validation globale** (Global) → Cohérence terminologique

**Résultat** : Glossaire métier dans `/prompts/gen/concepts/glossaire-metier.md`

#### 1.3 `init-raci-aikido` - Organisation d'Équipe

**Objectif** : Définir la matrice RACI et la répartition par rôles

**Processus itératif** :

1. **Identification des rôles** (Fonctionnel) → Équipe et responsabilités
2. **Matrice RACI** (Technique) → Attribution R/A/C/I par activité
3. **Sous-répertoires spécialisés** (Spécifique) → Structure par rôles
4. **Workflow de collaboration** (Global) → Règles Git et validation

**Résultat** : Spécifications RACI dans `/prompts/hard_points/aikido-raci-[TEAM].md`

### Phase 2 : Analyse et Enrichissement

#### 2.1 `analyse-project` - Analyse Contextuelle

**Objectif** : Analyser le projet existant pour enrichir la memory bank

**Processus itératif** :

1. **Scan fonctionnel** (Global) → Vue d'ensemble du projet
2. **Analyse technique** (Spécifique) → Code, architecture, patterns
3. **Extraction de connaissances** (Technique) → Concepts et techniques utilisés
4. **Intégration** (Fonctionnel) → Mise à jour de la memory bank

### Phase 3 : Création des Personas

#### 3.1 `create-persona` - Agents Spécialisés

**Objectif** : Créer des personas adaptés au contexte projet

**Taxonomie hiérarchique** :

```
Niveau 1: Catégorie (🏗️ CONCEPTION, ⚙️ DÉVELOPPEMENT, 🔒 SÉCURITÉ, 🔍 QUALITÉ, 🚀 DÉPLOIEMENT)
└── Niveau 2: Famille fonctionnelle (Architecture, Backend, Frontend, etc.)
    └── Niveau 3: Persona spécifique (Architecte Solutions, Développeur API, etc.)
        └── Niveau 4: Spécialisation contextuelle (Domaine, technologie, contraintes)
```

**Processus itératif** :

1. **Identification des besoins** (Fonctionnel) → Quels rôles pour quels contextes ?
2. **Spécialisation technique** (Technique) → Compétences et responsabilités
3. **Adaptation contextuelle** (Spécifique) → Domaine métier et contraintes
4. **Intégration taxonomique** (Global) → Cohérence avec la hiérarchie

### Phase 4 : Optimisation de la Memory Bank

#### 4.1 Construction Itérative de la Base de Connaissances

**Alternance Fonctionnel ↔ Technique** :

- **Itération Fonctionnelle** : Focus sur les besoins métier, use cases, workflows
- **Itération Technique** : Focus sur l'implémentation, patterns, optimisations

**Alternance Global ↔ Spécifique** :

- **Itération Globale** : Vue d'ensemble, architecture, cohérence
- **Itération Spécifique** : Détails d'implémentation, cas particuliers

**Exemple de cycle itératif** :

1. **Global + Fonctionnel** → Architecture métier générale
2. **Spécifique + Technique** → Implémentation d'un composant
3. **Global + Technique** → Patterns architecturaux
4. **Spécifique + Fonctionnel** → Use case particulier
5. **Retour à 1** avec enrichissement

## ⚡ Commandes AI‑KIDO

### 🏗️ Commandes d'Initialisation (Ordre Recommandé)

1. **`init-aikido`** - Initialisation de la memory bank
   - Crée la structure de base dans `/prompts/gen/`
   - Analyse automatique des sources projet (via `agent-aikido-explore-bank`)
   - Résolution contradictions (via `agent-aikido-truth-evaluator`)
   - Classification RACI mode STANDARD (via `agent-aikido-raci-delegator`)
   - Validation finale (via `agent-aikido-validator`)
   - **Agents utilisés** : 4 agents (explore-bank, truth-evaluator, raci-delegator, validator)

2. **`init-glossaire`** - Création du glossaire métier
   - Extraction des termes métier spécifiques et confus (via `agent-aikido-explore-bank`)
   - Résolution contradictions terminologiques (via `agent-aikido-truth-evaluator`)
   - Classification par domaines (via `agent-aikido-raci-delegator`)
   - Validation conformité (via `agent-aikido-validator`)
   - **Agents utilisés** : 4 agents (explore-bank, truth-evaluator, raci-delegator, validator)

3. **`init-raci-aikido`** - Matrice RACI et organisation
   - Extraction rôles et responsabilités (via `agent-aikido-explore-bank`)
   - Génération hiérarchie et slugification (via `agent-aikido-raci-delegator`)
   - Validation conformité RACI (via `agent-aikido-validator`)
   - **Agents utilisés** : 3 agents (explore-bank, raci-delegator, validator)

4. **`analyse-project`** - Analyse contextuelle
   - Scan du projet existant et extraction sources
   - Résolution contradictions si détectées (via `agent-aikido-truth-evaluator`)
   - Classification documents (via `agent-aikido-raci-delegator`)
   - Validation conformité (via `agent-aikido-validator`)
   - **Agents utilisés** : 3 agents (truth-evaluator, raci-delegator, validator)

5. **`create-persona`** - Création des personas
   - Exploration personas existants pour éviter doublons (via `agent-aikido-explore-bank` en QUICK MODE)
   - Workflow interactif : anthropomorphique (expert humain) ou technique (outil spécialisé)
   - Génération automatique des fichiers persona, .roomodes, et .claude/agents/
   - **Agents utilisés** : 1 agent (explore-bank en mode rapide)

6. **`create-command`** 🆕 - Assistant de Création de Commandes
   - Guide interactif avec questionnaire utilisateur
   - Détection commandes similaires pour éviter doublons (via `agent-aikido-explore-bank` QUICK)
   - Identification agents experts/personas NON-internes pertinents (via `agent-aikido-explore-bank` QUICK)
   - Recherche ressources Memory Bank (hard points, concepts, techniques, use cases) (via `agent-aikido-explore-bank` DEEP)
   - Suggestion agents AI-KIDO internes optimaux (via `agent-aikido-explore-bank` QUICK)
   - Génération structure commande optimisée avec validation conformité (via `agent-aikido-validator`)
   - Intégration automatique AGENTS.md, CLAUDE.md, README.md (via `agent-aikido-maj-md-index`)
   - **Agents utilisés** : 6 agents (explore-bank×4 modes variés, validator, indexer)

7. **`create-search-plan`** 🆕 - Création de Plans de Recherche Code
   - Assistant interactif pour créer des plans de recherche technology-aware
   - Templates pré-configurés (generic, php, javascript, python, java, rust, go, etc.)
   - Validation automatique contre exigences `agent-aikido-explore-code`
   - Support PSR-4, ES Modules, imports spécifiques par langage
   - Génération patterns regex pour classes, interfaces, functions, dependencies
   - Intégration dans `/prompts/hard_points/system/search/plans/`

8. **`validate-search-plan`** 🆕 - Validation de Plans de Recherche
   - Vérification conformité plans contre README.md et requirements
   - Validation patterns regex, output format, line numbers
   - Checklist complète : imports, declarations, functions, keywords, output
   - Rapport détaillé avec recommandations corrections
   - Support tous langages (generic, php, javascript, typescript, etc.)

9. **`create-analyse-plan`** 🆕 - Création de Plans d'Analyse Projet
   - Assistant interactif pour créer des plans d'analyse project pour `/analyse-project`
   - Templates type-spécifiques (architecturale, technique, fonctionnelle, méthodologique)
   - 4 niveaux de profondeur (survol, standard, approfondi, expert)
   - Génération prompts agents, stratégies extraction, workflows Mermaid
   - Intégration dans `/prompts/hard_points/system/analyse/plans/`

10. **`validate-analyse-plan`** 🆕 - Validation de Plans d'Analyse

- Vérification conformité plans contre README.md et `/analyse-project`
- Validation sections obligatoires, métadonnées, orchestration agents
- Validation stratégies extraction, workflow Mermaid, output format
- Rapport détaillé dans `/prompts/spec/` avec score global et recommandations
- Compatibilité avec algorithme de résolution de plans

### 🔧 Commandes de Maintenance

#### `check-claude` - Synchronisation CLAUDE.md et Compatibilité Claude Code

**Objectif** : Vérifier l'état de la Memory Bank et générer les fichiers de compatibilité Claude Code

**Processus** :

1. **Inventaire complet** → Scan Memory Bank (via `agent-aikido-explore-bank`)
2. **Validation conformité** → Règles AI-KIDO (via `agent-aikido-validator`)
3. **Détection incohérences** → Mapping CLAUDE.md ↔ Memory Bank (via `agent-aikido-truth-evaluator`)
4. **Génération .claude/agents/** → Mapping automatique depuis `/prompts/gen/personas/`
5. **Génération .claude/commands/** → Mapping automatique depuis `prompts/hard_points/commands/`
6. **Mise à jour CLAUDE.md** → Section 12 avec état actuel et statistiques
7. **Rapport détaillé** → Création dans `/prompts/spec/check-claude-[DATE].md`

**Agents utilisés** : 3 agents (explore-bank, validator, truth-evaluator)

**Résultat** : Base 100% compatible Claude Code avec commandes et agents détectés automatiquement

#### `check-truth` - Vérification Cohérence Documentation ↔ Code 🆕

**Objectif** : Vérifier la cohérence entre documentation AI-KIDO et code source, détecter l'obsolescence et proposer des redressements automatiques

**Syntaxes disponibles** :

```bash
/check-truth                           # Vérification complète Memory Bank
/check-truth --file [path]            # Fichier spécifique
/check-truth --domain concepts         # Domaine complet
/check-truth --search "keyword"        # Recherche par mot-clé
/check-truth --code-path ./src/auth/   # Analyse code + doc
/check-truth --verbose                 # Mode détaillé
/check-truth --force-check             # Force validation (ignore fast-path)
```

**Processus optimisé** :

1. **Inventaire ciblé** → Scan selon scope (via `agent-aikido-explore-bank` QUICK)
2. **Fast-path optimization** → Skip validation si ✅ + sources inchangées (via `agent-aikido-doc-header`)
3. **Validation truth sources** → Cohérence doc ↔ code/specs (via `agent-aikido-truth-evaluator`)
4. **Analyse des manques** → Détection documentation manquante (via `agent-aikido-explore-bank` + `truth-evaluator`)
5. **Mise à jour headers** → Refresh last-check metadata (via `agent-aikido-doc-header` batch)
6. **Rapport complet** → Statistiques + recommandations dans `/prompts/spec/check-truth-[DATE].md`
7. **Auto-redressement** (optionnel) → Correction incohérences + création docs manquants (via `agent-aikido-bank-populate`)

**Agents utilisés** : 5 agents (explore-bank×2, doc-header×2, truth-evaluator, [bank-populate optionnel])

**Optimisations clés** :

- ⚡ **Fast-path** : Économie 70-80% tokens sur documents à jour (via last-check metadata)
- 🎯 **Analyse ciblée** : Scope ajustable (fichier, domaine, recherche, code, full)
- 🤖 **Orchestration agents** : Workflow optimisé pour performance maximale
- 📊 **Détection intelligente** : Gaps, obsolescence, conflits majeurs/mineurs

**Performance estimée** : ~20-30k tokens (vs ~100k sans optimisation) = **70-80% efficacité**

**Use cases** :

- Vérification après développement features
- Maintenance continue documentation
- Détection obsolescence régulière
- Analyse code nouveau/refactoré

#### `maj-aikido` - Mise à Jour et Synchronisation Complète

**Objectif** : Mettre à jour depuis sources externes OU synchroniser la memory bank après évolutions

**Deux modes disponibles** :

**Mode UPDATE** (`/maj-aikido --update`) :

1. **Sélection source** → Git AI-KIDO, archive, ou répertoire local
2. **Analyse différentielle** → Comparaison source ↔ cible avec statistiques
3. **Mise à jour fichiers** → Choix utilisateur (REMPLACER/FUSIONNER/IGNORER)
4. **Fusion intelligente** → Agent-aikido-fusion pour préservation contexte
5. **Hard points** → Remplacement automatique (autorité absolue)
6. **Migration V1.3** → Si base < V1.3, migration automatique
7. **Synchronisation** → Phases 0-7 standard

**Mode SYNC** (`/maj-aikido`) :

1. **Détection des changements** → Hard points et nouvelles commandes (via `agent-aikido-explore-bank`)
2. **Analyse d'impact** → Compatibilité avec la base existante
3. **Détection contradictions** → Résolution automatique (via `agent-aikido-truth-evaluator`)
4. **Audit conformité** → Validation post-rebase (via `agent-aikido-validator`)
5. **Validation finale** → Vérification complète (via `agent-aikido-validator`)

**Agents utilisés** : 5 agents (explore-bank, truth-evaluator, validator×2, fusion)

**Voir section complète** : [🔄 Mettre à Jour une Base AI-KIDO](#-mettre-à-jour-une-base-ai-kido-existante)

#### `analyse-aikido` - Audit et Redressage

**Objectif** : Audit complet avec corrections automatiques selon les 18 règles

**Processus** :

1. **Scan structure** → Détection violations (via `agent-aikido-explore-bank`)
2. **Validation contraintes** → Règles 4, 6, 7 (via `agent-aikido-validator`)
3. **Validation corrections** → Vérification post-correction (via `agent-aikido-validator`)
4. **Cohérence RACI** → Validation matrice (via `agent-aikido-raci-delegator`)
5. **Arbitrage contradictions** → Résolution conflits (via `agent-aikido-truth-evaluator`)
6. **Audit final** → Validation complète (via `agent-aikido-validator`)

**Agents utilisés** : 4 agents (explore-bank, validator×3, raci-delegator, truth-evaluator)

#### `reindex-projet` - Réindexation Complète du Projet 🆕

**Objectif** : Régénérer l'index JSON complet de la structure projet avec cache 24H

**Syntaxe** :

```bash
/reindex-projet              # Indexation complète
/reindex-projet src/Domain   # Indexation ciblée sur un répertoire
```

**Processus** :

1. **Analyse structure** → Scan complet projet (260 fichiers, 37 répertoires)
2. **Génération index JSON** → Format V3.2 optimisé (by_path, by_directory, by_type, by_name)
3. **Validation structure** → Vérification cohérence et conformité AI-KIDO V1.3
4. **Statistiques** → Rapport détaillé (fichiers, lignes, taille, conformité)
5. **Cache 24H** → Performance queries <5ms vs 2500ms markdown

**Agents utilisés** : 1 agent (agent-aikido-projet-index)

**Performance** : ~36s génération, <100ms parse, <5ms query

#### `clean-index` - Nettoyage Intelligent de l'Index 🆕

**Objectif** : Nettoyer sélectivement les entrées orphelines de l'index (fichiers indexés mais absents du filesystem)

**Syntaxe** :

```bash
/clean-index                 # Nettoyage intelligent automatique
/clean-index --dry-run       # Analyse seule sans suppression
/clean-index --verbose       # Mode détaillé avec liste complète
```

**Cas d'usage** :

- Fichiers supprimés mais toujours dans l'index
- Entrées orphelines après refactoring
- Maintenance régulière de l'index
- Nettoyage incrémental sans régénération complète

**Workflow intelligent** :

- `/clean-index` → Détecte et supprime orphelins
- Si <10% orphelins → Index cohérent ✅
- Si >10% orphelins → Recommande `/reindex-projet`

**Agents utilisés** : 0 agents (script bash optimisé avec jq)

**Performance** : ~5-10s (3-5× plus rapide qu'avec agent)
**Prérequis** : `jq` doit être installé (`brew install jq` / `apt-get install jq` / `yum install jq`)
**Avantage** : Nettoyage sélectif ultra-rapide sans tokens LLM

### 📊 Commandes de Traçabilité

#### `logllmon` - Activation des Logs

- Active `LLM_TRACIBILITY=TRUE` dans `/prompts/index.md`
- Démarre l'enregistrement des interactions dans `/prompts/spec/logs/prompts.log`

#### `logllmoff` - Désactivation des Logs

- Désactive `LLM_TRACIBILITY=FALSE` dans `/prompts/index.md`
- Arrête l'enregistrement des interactions

**Format des logs** :

```markdown
# DATE: YYYY-MM-DD HH:MM:SS
## PROMPT [Mode utilisé]
[Question de l'utilisateur]

```

**⚠️ Règle critique** : Les logs sont **TOUJOURS** stockés dans `/prompts/spec/logs/prompts.log`, jamais à la racine du projet.

### 🔄 Commandes de Synchronisation Externe



**Syntaxe** :

```bash
```

**Processus** :

1. **Validation credentials** → Lecture variables environnement (CONFLUENCE_URL, CONFLUENCE_USER, CONFLUENCE_TOKEN)
2. **Test connexion API** → Vérification accès REST API v2
3. **Liste espaces** → Récupération espaces accessibles
4. **Rapport détaillé** → Statut connexion, permissions, diagnostics





**Syntaxe** :

```bash
```

**Processus** :

2. **Configuration sync** → Paramètres synchronisation (strategy, auto_sync)
3. **Préservation contenu** → Intégration header sans modifier le contenu existant





**Syntaxe** :

```bash
```

**Processus** :

1. **Validation fichier** → Vérification métadonnées YAML
2. **Conversion Markdown → Storage Format** → Transformation via pandoc





**Syntaxe** :

```bash
```

**Processus** :

2. **Conversion Storage Format → Markdown** → Transformation via pandoc
3. **Extraction métadonnées** → Space, parent, version, last_modified
4. **Création fichier local** → Génération Markdown avec header YAML





**Syntaxe** :

```bash
```

**Processus** :

2. **Détection direction** → Détermination push/pull selon last-write-wins
3. **Conversion format** → Markdown ↔ Storage Format selon direction
4. **Synchronisation** → Upload ou download selon stratégie

**Stratégies disponibles** :

- **last-write-wins** (défaut) : Synchronisation automatique selon timestamps
- **manual** : Confirmation utilisateur avant chaque opération


**Résultat** : Fichiers synchronisés avec résolution automatique des conflits



**Syntaxe** :

```bash
```

**Processus** :

1. **Récupération structure** → Liste pages avec hiérarchie parent-enfant
2. **Construction arbre** → Visualisation arborescente avec indentation
3. **Métadonnées** → ID, title, version, last_modified pour chaque page





**Fonctionnalités principales** :

- 📈 **Calcul KPI Agile** : Vélocité, burndown, temps, qualité (via JQ obligatoire)
- 📑 **Rapports HTML interactifs** : Chart.js, tableaux triables, graphiques temps réel
- 🗂️ **Structure hiérarchique** : EPICS → FEATURES → TICKETS
- ⚡ **Performance optimisée** : <2,500 tokens par sprint (50 tickets), 15-30s sync + rapport


**Prérequis** :
- **JQ obligatoire** : `brew install jq` (macOS) / `apt install jq` (Linux)
- Curl et bash 4.0+

---



**Syntaxe** :

```bash
```

**Processus** :

2. **Test connexion API** → Vérification accès REST API v3
3. **Récupération informations** → User info, projet accessible
4. **Rapport détaillé** → Statut connexion, permissions, diagnostics



---



**Syntaxe** :

```bash
```

**Processus** :

3. **Configuration metadata** → Initialisation fichiers JSON (project-info.json)
4. **Documentation** → Création README.md avec instructions utilisation



---



**Syntaxe** :

```bash
```

**Processus** :

2. **Synchronisation tickets** → Download tickets par sprint avec métadonnées
3. **Calcul KPI avec JQ** → Vélocité, burndown, temps, qualité, completion rate
4. **Génération rapports HTML** → Dashboard interactif avec Chart.js, tableaux triables
5. **Mise à jour métadonnées** → sprint-data.json, tickets.json, kpi-metrics.json

**KPI calculés** (par sprint) :
- **Vélocité** : Story points committed vs completed, moyenne 3 sprints
- **Burndown** : Idéal vs actuel, tracking quotidien
- **Temps** : Estimé vs passé vs restant, efficacité %
- **Tickets** : Total / Completed / In Progress / Todo / Blocked
- **Qualité** : Bugs trouvés/résolus, taux défaut %


**Performance** : 15-30s par sprint + génération rapport


---



**Syntaxe** :

```bash
```

**Processus** :

2. **Détection direction** → Détermination push/pull selon last-write-wins
3. **Synchronisation** → Upload ou download selon stratégie
5. **Résolution conflits** → Automatique via timestamps ou manuelle

**Stratégies** :
- **last-write-wins** (défaut) : Automatique selon timestamps
- **manual** : Confirmation utilisateur avant chaque opération


**Résultat** : Tickets synchronisés avec résolution automatique des conflits

---



**Syntaxe** :

```bash
```

**Processus** :

1. **Récupération métadonnées** → Infos projet (name, description, lead, url)
2. **Configuration** → Types tickets, workflow, custom fields
3. **Statistiques** → Compteurs tickets, sprints, epics
4. **Mise à jour local** → project-info.json avec toutes les métadonnées



---



**Syntaxe** :

```bash
```

**Processus** :

1. **Récupération epic** → Métadonnées epic principal
2. **Récupération hiérarchie** → Features et tickets liés
3. **Structure hiérarchique** → Organisation EPIC → FEATURES → TICKETS
4. **Synchronisation complète** → Tous les éléments avec métadonnées
5. **Génération arborescence** → Fichiers JSON structurés



---



**Syntaxe** :

```bash
```

**Processus** :

1. **Import projet** → Métadonnées générales
2. **Import epics** → Tous les epics du projet
3. **Import features** → Features liées aux epics
4. **Import tickets** → Tous les tickets (hiérarchie complète)
5. **Import sprints** → Tous les sprints avec tickets associés
6. **Génération rapports** → Rapports HTML pour chaque sprint


**Performance** : Variable selon taille projet (peut prendre plusieurs minutes pour gros projets)


---


**Processus** :

1. **Lecture données** → sprint-data.json, tickets.json, kpi-metrics.json
2. **Calcul KPI** → Si nécessaire, recalcul avec JQ
3. **Génération HTML** → Dashboard avec Chart.js (burndown, distribution)
4. **Tableaux interactifs** → Tri, filtrage, recherche (vanilla JS)
5. **Assets** → CSS/JS inclus (autonome, pas de serveur requis)


**Performance** : <10s génération rapport

**Résultat** : Fichier `report.html` autonome avec tous les graphiques et données

---



**Syntaxe** :

```bash
```

**Processus** :

1. **Récupération backlog** → Tickets non assignés à un sprint
2. **Tri priorités** → Organisation par priorité, type, assignee
3. **Synchronisation** → Download métadonnées + last-write-wins
4. **Génération vue HTML** → Tableau interactif de gestion backlog
5. **Statistiques** → Compteurs par priorité, type, status



---


```
├── [General]/
│   └── project-info.json              # Métadonnées projet
├── [Sprints]/
│   ├── SPRINT-001/
│   │   ├── sprint-data.json           # Données sprint
│   │   ├── tickets.json               # Liste tickets
│   │   ├── kpi-metrics.json           # KPI calculés
│   │   ├── report.html                # Rapport interactif
│   │   └── assets/                    # JS/CSS (Chart.js)
│   └── SPRINT-002/...
├── [Backlog]/
│   ├── backlog.json                   # Tickets backlog
│   └── backlog.html                   # Vue gestion backlog
└── [EPICS]/
    ├── EPIC-001/
    │   ├── epic.json                  # Métadonnées epic
    │   ├── [FEATURES]/
    │   │   └── FEATURE-001/
    │   │       ├── feature.json       # Métadonnées feature
    │   │       └── [TICKETS]/
    │   │           └── TICKET-001.json # Ticket individuel
    │   └── [TICKETS]/                 # Tickets directs (sans feature)
    └── EPIC-002/...
```

**Rapports HTML Interactifs** :

- **Dashboard KPI** : 4 cartes avec indicateurs visuels
- **Graphique Burndown** : Idéal vs actuel (Chart.js)
- **Distribution** : Pie chart par status
- **Tableau tickets** : Tri, filtrage, recherche (vanilla JS)
- **Autonome** : Toutes données depuis JSON local (pas de serveur)

**Configuration** :


```bash
```

**Générer API Token** : https://id.atlassian.com/manage-profile/security/api-tokens

---

### 🚀 Commandes d'Export et Utilisation Externe

#### `compile-agent-from-use` - Compilation d'Agents Autonomes

**Objectif** : Exporter la memory bank AI-KIDO vers des agents autonomes pour utilisation externe (ChatGPT, Microsoft Copilot, MCP, etc.)

**Processus interactif** :

1. **Sélection du mode** → 4 options : cas existant, commande, use-case, manuel
2. **Extraction éléments** → Analyse ciblée (via `agent-aikido-explore-bank`)
3. **Optimisation sémantique** → Compression, hiérarchisation, validation orale
4. **Validation conformité** → Pré-finalisation (via `agent-aikido-validator`)
5. **Versioning SEMVER** → Calcul automatique des versions selon les changements

**Agents utilisés** : 2 agents (explore-bank, validator)

**Modes disponibles** :

- **📋 Cas existant** : Modifier un agent déjà compilé
- **⚡ Commande** : Créer depuis une commande `.roo` existante
- **🎯 Use-case** : Partir d'un cas d'usage AI-KIDO spécifique
- **✋ Manuel** : Configuration complète étape par étape

**Résultat** : Agent compilé dans `/out/agents/agent-[usage]-vX.Y.Z.md` avec :

- Prompt système optimisé pour usage externe
- Personas consultants intégrés
- Techniques avancées de reformulation
- Workflow opérationnel step-by-step
- Métriques de qualité (densité sémantique, cohérence, facilité orale)

**Cas d'usage** : Déploiement sur ChatGPT, intégration MCP, agents Microsoft Copilot, ou tout autre contexte externe à Roo-Code/VSCode.

## 🤖 Agents AI-KIDO Disponibles

### Agents Spécialisés Actuels

Le projet dispose actuellement de **13 agents spécialisés** dans `/prompts/gen/personas/` :

#### 1. **agent-aikido-explore-bank** 🔍 (Explorateur Memory Bank)

**Spécialisation** : Recherche et extraction d'informations depuis la Memory Bank AI-KIDO

**Quand l'utiliser** :

- Lorsqu'un utilisateur pose des questions sur des concepts/techniques/personas documentés
- Avant d'exécuter des tâches complexes nécessitant un contexte Memory Bank
- Pour explorer proactivement les patterns et bonnes pratiques du projet
- Pour identifier les agents disponibles et leurs capacités

**Capabilities** :

- Recherche intelligente dans `/prompts/gen/` et `/prompts/hard_points/` uniquement
- **IGNORE `/spec/`** : Espace personnel, jamais exploré (sauf activation explicite)
- Extraction contextuelle adaptée à la requête
- Navigation récursive dans l'arborescence AI-KIDO
- Détection automatique des patterns pertinents

**✅ Optimisation effectuée** : 366 lignes (conforme à la contrainte 500 lignes - Règle 4)

#### 2. **agent-aikido-explore-code** 💻 (Explorateur Code Source)

**Spécialisation** : Recherche profonde dans le code source du projet (HORS Memory Bank) avec extraction de métadonnées structurées

**Quand l'utiliser** :

- Pour localiser classes, interfaces, functions, modules dans le code source
- Analyse de dépendances et imports (cross-file relationship graph)
- Cartographie architecture code (extends, implements, uses)
- Recherche guidée "où chercher quoi" selon technologie (PHP, JavaScript/TypeScript, generic)
- Besoin de métadonnées compactes avec line numbers (PAS le code complet)

**Capabilities** :

- **Technology-aware** : Plans de recherche spécialisés (generic, php, javascript/typescript)
- **Résolution hiérarchique** : tech/version → tech → generic (fallback)
- **Métadonnées structurées** : Classes (lines X-Y), Functions (signatures), Dependencies (imports)
- **Output compact** : ~50 lignes par fichier max, <2500 tokens total
- **Respect .gitignore** : Exclut automatiquement patterns ignorés
- **PSR-4 aware** (PHP) : Résolution namespace → file path via composer.json
- **ES Module aware** (JS/TS) : Résolution import paths avec tsconfig.json
- **IGNORE `/prompts/`** : Recherche UNIQUEMENT dans code source projet

**Search Plans disponibles** :

- `plan-generic.md` : Fallback multi-langage (Python, Java, Rust, Go, C++, etc.)
- `php/plan.md` : PHP avec PSR-4, Laravel, Symfony, WordPress patterns
- `javascript/plan.md` : JavaScript/TypeScript avec ES Modules, React, Node.js

**Output format** :

```markdown
## 📄 `path/to/file.ext`
**Classes** (X):
  - `ClassName` (lines 15-145): 130 lines
    - Extends: `ParentClass`
    - Methods: 8
**Dependencies** (X):
  - `package/module/path` (line 3)
```

**Conformité** : ✅ 650 lignes (respecte contrainte 1000 lignes extended - agent technique)

**Intégration** : Appelé manuellement ou via `agent-aikido-explore-all` pour recherche parallèle

#### 3. **agent-aikido-explore-all** 🔍💻 (Orchestrateur Recherche Parallèle)

**Spécialisation** : Orchestrateur minimal pour recherche simultanée dans Memory Bank ET code source

**Quand l'utiliser** :

- Recherche générale sans savoir si documentation ou code
- Besoin vue complète : documentation + implémentation
- Vérifier cohérence entre specs (bank) et réalité (code)
- Exploration globale projet (docs + code)

**Capabilities** :

- **Orchestration parallèle** : Lance explore-bank + explore-code EN PARALLÈLE (single message, 2 Task calls)
- **Combinaison résultats** : Fusionne outputs dans format structuré
- **Détection cross-references** : Identifie connexions docs ↔ code
- **Performance optimisée** : Temps = max(time_bank, time_code) ≈ 3-5s (PAS somme)

**Execution pattern** :

```markdown
Task 1: explore-bank (subagent_type: agent-aikido-explore-bank)
Task 2: explore-code (subagent_type: agent-aikido-explore-code)
Wait → Combine → Return structured output
```

**Output format** :

```markdown
# Comprehensive Search Results: [QUERY]

## 📚 Memory Bank Results
[Results from explore-bank]

## 💻 Source Code Results
[Results from explore-code]

## 🔗 Cross-References
[Connections between docs and code]

## 📊 Summary
- Memory Bank: X documents
- Source Code: Y files, Z elements
```

**Performance** :

- Parallel execution (not sequential)
- Total time: ~3-5s (max of both)
- Tokens: ~2,000-3,000 (sum)

**Conformité** : ✅ 150 lignes (agent minimal, orchestration pure)

**Trade-offs** :

- ❌ Coût double (2 agents) → N'utiliser QUE si besoin vraiment global
- ✅ Temps optimisé (parallèle) → Pas 2× plus lent (max time, pas somme)
- ✅ Vue complète → Idéal pour exploration sans scope précis

#### 4. **agent-aikido-truth-evaluator** ⚖️ (Évaluateur Sources de Vérité)

**Spécialisation** : Détermine les sources autoritaires (specs, code, docs, tests) selon le scénario de développement

**Quand l'utiliser** :

- Avant de démarrer un travail de développement (identifier sources autoritaires)
- Lorsque specs et code se contredisent (déterminer quelle source respecter)
- Pendant les code reviews (valider contre les bonnes sources)
- En refactoring (distinguer docs legacy vs implémentation actuelle)
- Quand la documentation semble obsolète (vérifier contre le code)

**Capabilities** :

- Classification automatique par scénario (8 types : new feature, bug fix, refactoring, config, docs, from-scratch, investigation, API integration)
- Hiérarchie des sources : `/hard_points/` (immutable) > `/gen/` (évolutif) > code/docs > **JAMAIS `/spec/`**
- **IGNORE `/spec/`** : Espace personnel, pas source de vérité (sauf activation explicite)
- Détection de conflits entre sources
- Recommandations précises avec niveau de confiance

**Conformité** : ✅ 127 lignes (respecte contrainte 500 lignes)

#### 5. **agent-aikido-raci-delegator** 🎯 (Classificateur RACI)

**Spécialisation** : Classifie et route les documents vers leur emplacement correct dans la Memory Bank selon la matrice RACI

**Quand l'utiliser** :

- Pour classer un nouveau document dans la Memory Bank
- Lors de l'organisation/réorganisation de contenu
- Pour déterminer le rôle responsable d'un type de contenu
- En contexte mono-projet ou multi-projet (détection automatique)

**Capabilities** :

- Analyse de contenu (extraction topic, type, domaine, niveau technique, rôle)
- Classification par type (concept, technique, persona, use_case, hard_point)
- Détection contexte projet (mono vs multi-projet)
- Mapping RACI (Responsible/Accountable/Consulted/Informed)
- Recommandation paths : `/gen/` ou `/hard_points/` uniquement (JAMAIS `/spec/`)
- **IGNORE `/spec/`** : Espace personnel, pas destination de classification

**Conformité** : ✅ 214 lignes (respecte contrainte 500 lignes)

#### 6. **agent-aikido-doc-header** 📝 (Gestionnaire En-têtes Documents)

**Spécialisation** : Standardise et gère les en-têtes de documents AI-KIDO avec versioning, métadonnées de validation de vérité, et traçabilité des sources

**Quand l'utiliser** :

- Lors de la création d'en-têtes pour nouveaux documents dans la Memory Bank
- Pour valider les en-têtes existants contre les standards AI-KIDO
- Après validation par truth-evaluator pour mettre à jour les métadonnées last-check
- Pour rafraîchir les références aux sources avec dates de modification actuelles
- Pour ajouter du tracking de références inline dans les sections de documents

**Capabilities** :

- Création d'en-têtes avec métadonnées complètes (version, truth source, last-check, source refs)
- Validation de format et conformité des en-têtes existants
- Mise à jour post-validation (Last Check, Check Status, Checked By)
- Gestion des références aux sources (code/specs) avec extraction automatique des dates de modification
- Support des scénarios Greenfield (Spec = truth), TMA (Code = truth), et Dual (Refactoring)
- Tracking inline de références avec statut (✅ Up-to-date, ⚠️ Review needed, ❌ Outdated)
- Optimisation truth-evaluator : Fast-path skip validation si ✅ + sources inchangées (économie 70-80% tokens)

**Formats d'en-tête** :

- **Minimal** (théorie pure) : Version, Date, Statut
- **Complet** (lié au code) : + Truth Source, Last Check, Source Refs, Check Status

**Conformité** : ✅ 475 lignes (respecte contrainte 500 lignes)

**Intégration** : Invoqué par truth-evaluator (post-validation) et bank-populate (création documents)

#### 7. **agent-aikido-bank-populate** 🤖 (Peupleur Automatique Memory Bank)

**Spécialisation** : Orchestre le peuplement automatique de la Memory Bank à partir du code et du contexte lorsque documents manquants ou invalides

**⏰ TIMING D'INVOCATION : FIN DE PROCESSUS UNIQUEMENT**

- Appelé APRÈS analyse/audit complet
- Appelé APRÈS génération du rapport final listant tous les gaps
- Utilisateur décide explicitement de peupler ou non
- ❌ PAS invoqué immédiatement lors de détection de gap

**Quand l'utiliser** :

- En fin d'analyse : liste complète de documents absents/invalides générée
- Après audit complet Memory Bank avec rapport de gaps
- Utilisateur valide le peuplement automatique des gaps détectés
- Besoin de capitaliser connaissances depuis code existant (batch)

**Capabilities** :

- Détection gaps Memory Bank
- Collecte infos depuis code/contexte/docs sans analyse
- Orchestration multi-agents (truth-evaluator, raci-delegator, expert personas)
- Validation conformité AI-KIDO (≤500 lignes, liens bidirectionnels)
- Intégration automatique avec mise à jour index
- **Nouveau** : Invoque doc-header pour création d'en-têtes complets avec métadonnées

**Conformité** : ✅ 477 lignes (respecte contrainte 500 lignes)

#### 8. **agent-aikido-validator** ✅ (Validateur de Conformité AI-KIDO)

**Spécialisation** : Validation légère et rapide des fichiers contre les règles AI-KIDO essentielles (contraintes lignes, emplacement, frontmatter, liens)

**Trigger automatique** : Invoqué sur opérations fichiers dans `/prompts` (create/edit/move)

**Quand l'utiliser** :

- ✅ Automatiquement après création/modification de fichier dans `/prompts`
- ✅ Vérification rapide conformité (contraintes lignes, emplacement, frontmatter)
- ✅ Validation fichiers spécifiques passés en paramètre
- ⚠️ PAS pour audit complet Memory Bank (utiliser `/analyse-aikido`)

**Capabilities** :

- Détection automatique structure mono/multi-projet
- Validation ciblée : Règle 4 (lignes), Règle 6 (liens), Règle 2 (séparation), frontmatter
- Rapports concis (<2k tokens par validation)
- Chargement minimal des règles (depuis `/prompts/hard_points/ai-kido.md`)
- Gestion exceptions (ai-kido.md exempt de limite 500 lignes)

**Optimisations** :

- 🚀 Utilisation minimale de tokens (<2k par validation)
- ⚡ Pas de navigation récursive (charge seulement les règles)
- 🎯 Valide UNIQUEMENT fichiers spécifiés (pas d'exploration)
- 📊 Quick checks (wc -l, grep frontmatter, validation emplacement)

**Conformité** : ✅ 143 lignes (optimisé pour rapidité)

#### 9. **agent-aikido-balancer** ⚖️ (Équilibreur Arborescence)

**Spécialisation** : Équilibre automatique de la structure arborescente de la Memory Bank selon règles AI-KIDO (≤500 lignes, 3-7 enfants, ≤4 niveaux)

**Quand l'utiliser** :

- Après modifications significatives de la Memory Bank
- Fichiers dépassant 500 lignes (ou 1000 pour extended), prompts/hard_points/system/structure/index.json no limit.
- Profondeur arborescente >4 niveaux
- Facteur de branchement hors 3-7 (trop d'enfants ou trop peu)
- Liens bidirectionnels cassés après réorganisation

**Capabilities** :

- Analyse structure complète (profondeur, branchement, taille fichiers)
- Détection violations Règles 4, 6, 7
- Split sémantique fichiers >500 lignes (préserve cohérence)
- Réduction profondeur (flatten hierarchies)
- Optimisation branchement (grouping/merging)
- Maintenance liens bidirectionnels automatique

**Gains estimés** (vs manuel) :

- Temps : -70% (60 → 18 min)
- Complexité : -50% (3.5 → 1.8/5)
- Risque : -60% (3.5 → 1.4/5)
- Qualité : Split sémantique intelligent, liens garantis

**Conformité** : ✅ 383 lignes (respecte contrainte 500 lignes)

#### 10. **agent-aikido-maj-md-index** 📑 (Indexeur Memory Bank)

**Spécialisation** : Mise à jour automatique de tous les index.md de la Memory Bank (domaines, principal, AGENTS.md)

**Quand l'utiliser** :

- Après ajout/modification/suppression de fichiers
- Désynchronisation index ↔ structure réelle
- Statistiques Memory Bank obsolètes
- AGENTS.md nécessite mise à jour contexte/agents
- Génération rapports état Memory Bank

**Capabilities** :

- Scan structure complète tous domaines (concepts, techniques, uses, personas)
- Extraction metadata (title, description, frontmatter, line counts, dates)
- Génération index.md domaines (avec navigation, stats, subdirs)
- Mise à jour index principal (/prompts/gen/index.md)
- Synchronisation AGENTS.md (contexte, agent list, statistics)
- Création index subdirectories (si >3 files)

**Gains estimés** (vs manuel) :

- Temps : -80% (45 → 9 min)
- Complexité : -67% (3.0 → 1.0/5)
- Risque : -67% (3.0 → 1.0/5)
- Qualité : Statistics accuracy garantie, navigation cohérente

**Conformité** : ✅ 518 lignes (respecte contrainte 500 lignes avec extended)

#### 11. **agent-aikido-fusion** 🔀 (Fusionneur Intelligent)

**Spécialisation** : Fusion intelligente de fichiers lors des mises à jour AI-KIDO, préservant contexte projet tout en adoptant nouveau formalisme

**Quand l'utiliser** :

- Lors de mises à jour externes (`/maj-aikido --update`)
- Pour fusionner fichiers modifiés (choix "2. FUSIONNER")
- Quand formalisme source évolue mais contexte projet doit être préservé
- Adoption nouvelles versions AI-KIDO (V1.3) avec contexte existant

**Capabilities** :

- Analyse différentielle avancée (formalisme vs contenu vs concepts)
- Préservation contexte projet (exemples, configurations, décisions)
- Adoption formalisme source (structure, frontmatter, liens)
- Résolution conflits intelligente (priorités claires : SOURCE forme, CIBLE contexte)
- Validation conformité AI-KIDO (≤500 lignes, liens bidirectionnels, frontmatter)
- Génération métadonnées JSON complètes (modifications, conformity, recommendations)

**Principe fondamental** : *"Préserver l'essence, adopter la forme"*

**Workflow 5 phases** :

1. **Analyse Préliminaire** : Extraction métadonnées, détection sections, identification divergences
2. **Cartographie Sémantique** : Mapping sections SOURCE ↔ CIBLE
3. **Fusion Progressive** : Métadonnées → Structure → Contenu
4. **Validation et Conformité** : Vérifications automatiques
5. **Génération du Résultat** : Fichier fusionné + métadonnées + notes

**Gains estimés** (vs fusion manuelle) :

- Temps : -80% (60 → 12 min par fichier)
- Complexité : -70% (4.5 → 1.4/5)
- Risque : -85% (4.0 → 0.6/5 - préservation contexte garantie)
- Qualité : Conformité AI-KIDO validée, aucune perte d'information

**Conformité** : ✅ 474 lignes (respecte contrainte 500 lignes)

**Intégration** : Appelé automatiquement par `/maj-aikido --update` lors du choix "FUSIONNER"

#### 12. **agent-aikido-projet-index** 🗂️ (Gestionnaire Index Projet)

**Spécialisation** : Génération et maintenance de l'arborescence du projet en JSON avec cache mémoire pour réponses instantanées sur la structure et localisation des fichiers

**Quand l'utiliser** :

- Pour localiser rapidement un fichier dans le projet ("Où est X?")
- Pour lister les fichiers d'un répertoire
- Pour obtenir des statistiques sur la structure du projet
- Pour des requêtes de navigation filesystem répétitives

**Capabilities** :

- Génération index JSON complet (`prompts/hard_points/system/structure/index.json`) via scripts bash
- Cache JSON avec 4 index multi-niveaux : by_path, by_directory, by_type, by_name
- Réponses instantanées (<10ms) depuis cache mémoire (TTL 24h)
- Métadonnées pré-calculées : lignes, tailles, dates, types, icônes
- Exclusion automatique : `.git/`, `node_modules/`, patterns `.gitignore`
- Régénération automatique via `watch-changes.sh` lors de modifications filesystem

**Performance** :

- **Query temps** : <10ms (mémoire O(1) access)
- **Parse JSON** : ~100ms (première lecture, partagée entre invocations)
- **Régénération** : ~36s (1200+ fichiers, asynchrone en arrière-plan)
- **Gain vs find/stat/wc** : **300-500x plus rapide** ⚡⚡⚡

**Format JSON (v3.0)** :

```json
{
  "metadata": {
    "last_check": {"timestamp": "...", "status": "✅"},
    "statistics": {"total_files": 183, "total_lines": 32930}
  },
  "index": {
    "by_path": {"path/file.md": {name, type, icon, lines, size, modified, ...}},
    "by_directory": {"dir/": {"files": [...]}},
    "by_type": {"agent": [...], "concept": [...]},
    "by_name": {"filename.md": ["path1", "path2"]}
  }
}
```

**Scripts disponibles** :

- `generate-project-tree.sh` : Wrapper principal (génération complète)
- `generate-project-tree-json.sh` : Moteur JSON optimisé
- `format-file-metadata.sh` : Helper extraction métadonnées
- `watch-changes.sh` : Surveillance filesystem + régénération auto

**Intégration avec autres agents** :

- ✅ **agent-aikido-maj-md-index** : Accélère scan fichiers 300-500x (3-5s → <10ms)
- ✅ **agent-aikido-explore-bank** : Phase -0.75 ultra-fast pour requêtes localisation (2.6s → <5ms, 97% tokens économisés)
- ✅ **agent-aikido-balancer** : Analyse structure instantanée (3-5s → <10ms)
- ⚙️ **agent-aikido-validator** : Métadonnées instant (lignes, dates)
- ⚙️ **agent-aikido-bank-populate** : Validation gaps instantanée
- ⚙️ **agent-aikido-raci-delegator** : Localisation RACI rapide

**Gains estimés** (vs scans manuels) :

- **Temps** : -95% à -99% selon agent (3-5s → <10ms)
- **Tokens** : -97% pour explore-bank location queries (1400 → 50 tokens)
- **Complexité** : Élimination complète des `find`, `stat`, `wc -l`
- **Qualité** : Métadonnées standardisées, cache partagé, exclusions cohérentes

**Conformité** : ✅ 667 lignes (respecte contrainte 1000 lignes extended - agent technique)

**Cas d'usage** :

1. **Navigation rapide** : "Où est agent-aikido-maj-md-index.md?" → Réponse <5ms
2. **Exploration répertoires** : "Que contient /prompts/gen/personas/?" → Liste instantanée
3. **Statistiques projet** : Total fichiers, lignes, distribution par type → Pré-calculé
4. **Optimisation agents** : Tous les agents utilisant find/grep/stat bénéficient automatiquement

**Mise à jour automatique** : `watch-changes.sh` détecte modifications fichiers → régénération JSON asynchrone (~36s en arrière-plan)

### 🔄 Intégration Inter-Agents : Projet-Index comme Accélérateur

L'agent **agent-aikido-projet-index** agit comme un **accélérateur de performance** pour les autres agents en fournissant un cache JSON pré-calculé de la structure du projet.

#### Mécanisme d'Intégration

**Principe** : Fast-path avec fallback gracieux

```
Agent démarre
  → Vérifie JSON index disponible (<24h)
    → OUI : Fast path (<10ms) ⚡⚡⚡
    → NON : Fallback traditionnel (3-5s)
  → Aucun breaking change
```

**Architecture** :

```
prompts/hard_points/system/structure/
├── index.json                    # Cache partagé (605KB → 92KB optimisé)
└── scripts/
    ├── generate-project-tree.sh  # Génération
    ├── watch-changes.sh          # Auto-update
    └── format-file-metadata.sh   # Helper
```

#### Gains par Agent

| Agent | Opération Optimisée | Avant | Après | Gain |
|-------|---------------------|-------|-------|------|
| **indexer** | Scan fichiers + stats | 3-5s | <10ms | **300-500x** ⚡⚡⚡ |
| **explore-bank** | Location queries | 2.6s, 1400 tok | <5ms, 50 tok | **520x, 97% tokens** ⚡⚡⚡💰 |
| **explore-code** | Code search metadata | N/A | Technology-aware | **N/A** (nouvel agent) |
| **explore-all** | Parallel bank+code | N/A | 3-5s (parallel) | **N/A** (orchestrator) |
| **balancer** | Analyse structure | 3-5s | <10ms | **300-500x** ⚡⚡⚡ |
| **validator** | Comptage lignes | 0.5s (wc) | <1ms (cache) | **500x** ⚡⚡ |
| **bank-populate** | Validation gaps | 1-2s | <10ms | **100-200x** ⚡⚡ |
| **raci-delegator** | Localisation RACI | 1-2s | <10ms | **100-200x** ⚡⚡ |

**Impact cumulé** : Jusqu'à **-95% temps d'exécution** sur les opérations filesystem lourdes

#### Code d'Intégration Type

**Pattern utilisé dans tous les agents optimisés** :

```bash
# Check availability
if [ -f "prompts/hard_points/system/structure/index.json" ]; then
    AGE=$(( $(date +%s) - $(stat -f%m "index.json" 2>/dev/null || echo "0") ))
    if [ $AGE -lt 86400 ]; then  # <24h
        USE_PROJET_INDEX=true
    fi
fi

# Fast path (with projet-index)
if [ "$USE_PROJET_INDEX" = "true" ]; then
    # Query JSON directly (instant)
    RESULTS=$(jq -r '.index.by_path | keys[]' index.json | grep "$pattern")
    # Performance: <10ms ⚡⚡⚡
fi

# Fallback path (traditional)
if [ "$USE_PROJET_INDEX" != "true" ]; then
    # Use find/grep/wc as before
    RESULTS=$(find . -name "$pattern" ...)
    # Performance: 3-5s (100% compatible)
fi
```

**Avantages** :

- ✅ **Aucun breaking change** : Fallback automatique si JSON indisponible
- ✅ **Gains massifs** : 300-500x plus rapide quand disponible
- ✅ **Transparent** : Intégration invisible pour l'utilisateur
- ✅ **Robuste** : TTL 24h avec régénération auto via watch-changes.sh

### 💼 Use Cases des Agents AI-KIDO

#### Use Case 1 : **Exploration Contextuelle Avant Développement**

**Agent** : `agent-aikido-explore-bank`

**Scénario** : Un développeur doit créer un nouveau endpoint d'authentification

**Workflow** :

1. Utilisateur : "Je dois créer un endpoint d'authentification OAuth"
2. Agent explore-bank recherche : patterns d'authentification, specs sécurité, techniques OAuth existantes
3. Agent retourne : architecture établie, contraintes sécurité (`/hard_points/`), patterns réutilisables
4. Développeur implémente en respectant les standards projet

**Bénéfice** : Cohérence avec l'existant, respect des contraintes, réutilisation des patterns

#### Use Case 2 : **Résolution de Conflit Spec vs Code**

**Agent** : `agent-aikido-truth-evaluator`

**Scénario** : La spécification dit "retry 3 fois" mais le code retente indéfiniment

**Workflow** :

1. Utilisateur : "Fix le bug de retry dans le payment processor"
2. Agent truth-evaluator analyse : scénario = BUG_FIX
3. Agent évalue sources :
   - 🥇 Code actuel (process-payment.ts) = source de bug
   - 🥈 Tests (expected behavior) = validation
   - 🥉 Spec originale = contexte
4. Agent détecte conflit : code ≠ spec ≠ tests
5. Recommandation : "Fixer le code pour matcher tests + spec (max 3 retries)"

**Bénéfice** : Décision claire sur quelle source respecter, évite débats d'équipe

#### Use Case 3 : **Organisation Automatique de Documentation**

**Agent** : `agent-aikido-raci-delegator`

**Scénario** : Un document sur l'architecture microservices doit être intégré à la Memory Bank

**Workflow** :

1. Utilisateur fournit document "Architecture Microservices"
2. Agent raci-delegator analyse :
   - Type : **Concept** (théorie architecturale)
   - Domaine : **Architecture**
   - Rôle responsable : **Architect Lead** (selon RACI)
   - Contexte : **Mono-projet**
3. Agent recommande : `/prompts/gen/concepts/architecture/microservices.md`
4. Validation : confiance 95%, alternatives proposées

**Bénéfice** : Classification précise, organisation cohérente, respect RACI

#### Use Case 4 : **Workflow Complet : Nouveau Feature avec Contexte**

**Agents combinés** : `explore-bank` → `truth-evaluator` → développement

**Scénario** : Implémenter un système de notifications push

**Workflow** :

1. **Phase Exploration** (`explore-bank`) :
   - Recherche patterns notifications existants
   - Identifie contraintes `/hard_points/security-*`
   - Extrait techniques de messaging
2. **Phase Truth Evaluation** (`truth-evaluator`) :
   - Scénario : NEW_FEATURE
   - Sources autoritaires : specs > architecture > patterns
   - Hiérarchie : `/hard_points/` > `/gen/` > code existant
3. **Phase Implémentation** :
   - Développeur suit specs avec contexte complet
   - Respecte contraintes sécurité
   - Réutilise patterns validés
4. **Phase Documentation** (`raci-delegator`) :
   - Classifie nouvelle doc technique
   - Route vers `/prompts/gen/techniques/notifications-push.md`

**Bénéfice** : Workflow bout-en-bout cohérent, capitalisation automatique

#### Use Case 5 : **Mise à Jour AI-KIDO avec Préservation Contexte Projet**

**Agent** : `agent-aikido-fusion`

**Scénario** : Nouvelle version AI-KIDO V1.3 disponible avec nouveau point d'entrée unifié, mais votre projet a des exemples et configurations spécifiques

**Workflow** :

1. **Utilisateur** : `/maj-aikido --update` → Choix source Git AI-KIDO
2. **Analyse différentielle** → Détection : `prompts/gen/concepts/memory-bank.md` modifié
3. **Choix utilisateur** : "2. FUSIONNER"
4. **Agent fusion** analyse :
   - SOURCE V1.3 : Nouveau formalisme (frontmatter V1.3, structure réorganisée)
   - CIBLE V1.2 : Exemples projet réels, configurations CloudFormation spécifiques
5. **Agent fusion** exécute :
   - ✅ Adopte frontmatter V1.3 : `> Version: 1.3 | Date: 2025-12-08`
   - ✅ Adopte nouvelle structure sections SOURCE
   - ✅ Préserve exemples CloudFormation CIBLE (spécifiques projet)
   - ✅ Intègre nouveaux concepts V1.3 (point d'entrée unifié)
   - ✅ Résout conflit "Architecture" : garde décision CIBLE justifiée, note nouveau pattern V1.3
6. **Génération** :
   - `memory-bank.md.merged.20251208-143022` : Fichier fusionné
   - `memory-bank.md.merged.20251208-143022.meta.json` : Métadonnées
7. **Utilisateur révise** → Validation conformité → Remplacement : `mv merged.* memory-bank.md`

**Résultat** :

- ✅ Base à jour avec formalisme V1.3
- ✅ Contexte projet préservé (exemples, configs)
- ✅ Nouveaux concepts V1.3 intégrés
- ✅ Conformité AI-KIDO validée (474 lignes, liens OK)

**Bénéfice** : Mise à jour sûre avec zéro perte d'information, adoption progressive des évolutions AI-KIDO



**Quand l'utiliser** :

- Gérer métadonnées YAML de synchronisation (page_id, last_sync, version)

**Capabilities** :

- **Synchronisation bidirectionnelle** : Last-write-wins (timestamps) ou manuelle
- **Mapping hiérarchique** : `index.md`/`README.md` = page parente automatique
- **Attachments intelligents** : Cache MD5, upload uniquement si modifié
- **Mode interactif** : Gestion pages orphelines avec confirmation utilisateur

**Operations disponibles** :

- **init** : Initialiser header YAML dans fichier Markdown
- **sync** : Synchronisation bidirectionnelle (last-write-wins ou manual)

**Performance** :

- **Sync time** : 2-5s par page (conversion + API)
- **Conflict resolution** : Automatique (timestamps) ou manuelle
- **Tokens** : <2,000 par fichier

**Prérequis** :

- Configuration `.env` : CONFLUENCE_URL, CONFLUENCE_USER, CONFLUENCE_TOKEN
- Pandoc installé (`brew install pandoc`)

**Conformité** : ✅ 520 lignes (respecte contrainte 1000 lignes extended - agent technique)




**Quand l'utiliser** :

- Calculer KPI Agile pour analyse de sprints (vélocité, burndown, temps, qualité)
- Générer rapports HTML interactifs avec Chart.js et tableaux triables
- Analyser métriques sprint avec JQ (calcul performant)
- Gérer structure hiérarchique EPICS → FEATURES → TICKETS

**Capabilities** :

- **Synchronisation bidirectionnelle** : Last-write-wins (timestamps UTC) ou manuelle
- **Calcul KPI Agile** : Vélocité (SP committed vs completed, moyenne 3 sprints), Burndown (idéal vs actuel, tracking quotidien), Temps (estimé vs passé vs restant, efficacité %), Tickets (Total/Completed/In Progress/Todo/Blocked), Qualité (bugs trouvés/résolus, taux défaut %)
- **Rapports HTML interactifs** : Dashboard 4 KPI cards, graphiques Chart.js (burndown, distribution), tableaux triables/filtrables (vanilla JS), autonome (données JSON local)
- **Structure hiérarchique** : EPICS → FEATURES → TICKETS avec métadonnées complètes
- **JQ obligatoire** : Calcul KPI ultra-performant (<1s pour 1000 lignes JSON)

**Operations disponibles** :

- **sync-sprints** : Synchroniser sprints + générer rapports HTML avec KPI
- **sync-tickets** : Synchronisation bidirectionnelle tickets (unique/sprint/all)
- **sync-project** : Synchroniser métadonnées générales projet
- **sync-epic** : Synchroniser epic complet avec hiérarchie
- **import-full** : Import complet projet (épics, features, tickets, sprints)
- **generate-report** : Générer (ou régénérer) rapport HTML pour sprint
- **sync-backlog** : Synchroniser backlog + générer vue HTML gestion

**Performance** :

- **Sync time** : 15-30s par sprint (50 tickets) + génération rapport
- **Tokens** : <2,500 per sprint
- **Conflict resolution** : Automatique (timestamps) ou manuelle
- **KPI calculation** : JQ-based (<1s for 1000 lines JSON)

**Prérequis** :

- **JQ obligatoire** : `brew install jq` (macOS) / `apt install jq` (Linux)
- Curl et bash 4.0+

**Architecture données** :

```
├── [General]/project-info.json
├── [Sprints]/SPRINT-001/
│   ├── sprint-data.json
│   ├── tickets.json
│   ├── kpi-metrics.json
│   ├── report.html
│   └── assets/ (JS/CSS)
└── [EPICS]/EPIC-001/
    ├── [FEATURES]/FEATURE-001/[TICKETS]/
    └── [TICKETS]/
```

**Conformité** : ✅ 580 lignes (respecte contrainte 1000 lignes extended - agent technique)


### 🎯 Roadmap Agents AI-KIDO

**Prochains agents à créer** (selon besoins projet) :

- **agent-aikido-optimizer** : Optimisation des fichiers dépassant leurs limites (500/1000 lignes)
- **agent-aikido-link-validator** : Vérification liens bidirectionnels (Règle 6)
- **agent-aikido-semantic-compressor** : Compression sémantique pour densité maximale
- **agent-aikido-raci-matrix-builder** : Construction interactive de matrice RACI
- **agent-aikido-multi-project-migrator** : Migration mono-projet ↔ multi-projet

**Nouveaux agents créés récemment** :

- ✅ **agent-aikido-explore-code** : Recherche code source avec métadonnées structurées (~650 lignes)
- ✅ **agent-aikido-explore-all** : Orchestrateur recherche parallèle bank+code (~150 lignes)

**Création d'agents** : Utiliser `/create-persona` pour générer de nouveaux agents selon la taxonomie AI-KIDO

## 🧠 Construction de la Memory Bank

### Principe de l'Auto-Alimentation

La memory bank AI-KIDO s'enrichit automatiquement selon plusieurs mécanismes :

1. **Signal utilisateur** → Dès signalement d'erreur, création d'une règle préventive
2. **Auto-détection** → 2+ erreurs similaires déclenchent une auto-alimentation proactive  
3. **Seuils adaptatifs** → Immédiat (critique), Rapide (majeur 2x), Standard (mineur 3x)
4. **Intégration automatique** → Placement dans le répertoire approprié + mise à jour des index

### Capitalisation des Analyses

**Règle fondamentale** : Toute analyse DOIT générer des fichiers dans les Tables de Vérités

**Répartition par type** :

- **Analyse conceptuelle** → `/prompts/gen/concepts/`
- **Analyse technique** → `/prompts/gen/techniques/`  
- **Analyse de cas** → `/prompts/gen/use_cases/`
- **Définition de rôle** → `/prompts/gen/personas/`

### Synchronisation AGENTS.md ↔ AI-KIDO

Le fichier `AGENTS.md` sert d'**interface standardisée** exposant la memory bank selon la norme LLM :

**Structure obligatoire** :

```markdown
# AI Agents Configuration

## Project Context
[Liens vers /prompts/index.md et /prompts/gen/]

## Available Agents  
[Références vers /prompts/gen/personas/]

## Agent Interaction Matrix
[Liens vers matrice RACI et spécifications]

## Usage Guidelines
[Liens vers /prompts/gen/use_cases/ et documentation]
```

**Règles de synchronisation** :

- **Liens exclusifs** : Aucune duplication de contenu, que des références
- **Correspondance 1:1** : Chaque agent AGENTS.md ↔ persona AI-KIDO
- **Mise à jour automatique** : Synchronisation lors des changements dans `/prompts/gen/`

## 🚀 Démarrage Rapide avec Claude Code

### Prendre en Main une Base AI-KIDO Bootstrap

Si vous récupérez un dépôt AI-KIDO bootstrap (structure vide), suivez ces étapes pour le rendre opérationnel sous Claude Code :

#### 1️⃣ **Vérifier et Initialiser la Base**

Lancez la commande suivante dans Claude Code :

```
Exécute le fichier prompts/hard_points/commands/check-claude.md pour vérifier l'état de la Memory Bank AI-KIDO et générer les fichiers de compatibilité Claude Code
```

Cette commande va :

- ✅ Analyser l'état actuel de la Memory Bank (bootstrap ou peuplée)
- ✅ Mettre à jour le fichier `CLAUDE.md` avec les statistiques actuelles
- ✅ Générer automatiquement les fichiers `.claude/agents/*.md` depuis `/prompts/gen/personas/`
- ✅ Générer automatiquement les fichiers `.claude/commands/*.md` depuis `prompts/hard_points/commands/`
- ✅ Créer un rapport détaillé dans `/prompts/spec/check-claude-[DATE].md`
- ✅ Afficher les métriques de conformité aux règles AI-KIDO

**⚠️ IMPORTANT** : Après l'exécution de cette commande, vous devez **relancer Claude Code** pour que les nouvelles commandes et agents soient détectés. Les fichiers `.claude/` sont chargés au démarrage de Claude Code.

#### 2️⃣ **Relancer Claude Code**

Fermez et rouvrez Claude Code (ou rechargez la fenêtre) pour que les fichiers générés soient pris en compte.

#### 3️⃣ **Vérifier la Détection des Commandes**

Tapez `/` dans Claude Code pour vérifier que les commandes AI-KIDO sont disponibles :

```
/list
```

Vous devriez voir apparaître les commandes suivantes :

- `/analyse-aikido` - Audit complet de la Memory Bank
- `/analyse-project` - Analyse des sources projet
- `/check-claude` - Synchronisation CLAUDE.md et fichiers .claude/
- `/create-persona` - Création de nouveau persona
- `/init-aikido` - Initialisation Memory Bank
- `/init-glossaire` - Création glossaire métier
- `/init-raci-aikido` - Initialisation matrice RACI
- `/logllmon` / `/logllmoff` - Gestion de la traçabilité
- `/maj-aikido` - Synchronisation après rebase

#### 4️⃣ **Vérifier la Détection des Agents** (si présents)

Si la base contient déjà des personas, vérifiez leur disponibilité :

```
/agents
```

Les agents disponibles apparaîtront dans la liste Claude Code, directement générés depuis `/prompts/gen/personas/`.

#### 5️⃣ **Vérifier l'État de la Base**

Consultez le fichier `CLAUDE.md` section 12 pour voir :

- 📊 L'inventaire complet (concepts, techniques, personas, use cases, commandes)
- 📈 Les métriques de qualité et conformité
- ⚠️ Les écarts détectés et recommandations
- 🎯 Le workflow recommandé pour peupler la Memory Bank

#### 6️⃣ **Peupler la Base (si bootstrap vide)**

Si la base est vide (bootstrap), suivez le workflow recommandé dans `CLAUDE.md` section 12.5 :

```bash
/analyse-project    # Analyser le projet existant
/init-aikido        # Initialiser la Memory Bank
/create-persona     # Créer des personas spécialisés
/init-glossaire     # Créer le glossaire métier
/analyse-aikido     # Vérifier la cohérence
/check-claude       # Synchroniser CLAUDE.md
```

#### ✅ **Base Opérationnelle**

Après ces étapes, votre base AI-KIDO est **100% compatible Claude Code** :

- 🤖 Commandes disponibles via `/`
- 👥 Agents disponibles via `/agents`
- 📚 Memory Bank accessible depuis `/prompts/index.md` (point d'entrée V1.3)
- 🔒 Hard Points prioritaires dans `/prompts/hard_points/`
- 📊 Documentation synchronisée dans `CLAUDE.md`

---

## 🎯 Workflow Standard d'Utilisation

### Pour Démarrer un Nouveau Projet

1. **Initialisation** :

   ```bash
   init-aikido          # Créer la structure de base
   init-glossaire       # Clarifier la terminologie
   init-raci-aikido     # Organiser l'équipe
   ```

2. **Enrichissement** :

   ```bash
   analyse-project      # Analyser le contexte existant
   create-persona       # Créer les agents spécialisés
   ```

3. **Activation de la traçabilité** (optionnel) :

   ```bash
   logllmon            # Activer les logs d'interactions
   ```

### Pour Maintenir un Projet Existant

1. **Synchronisation régulière** :

   ```bash
   maj-aikido          # Après chaque rebase/évolution
   ```

2. **Audit périodique** :

   ```bash
   analyse-aikido      # Audit complet avec corrections
   ```

3. **Gestion des logs** :

   ```bash
   logllmoff           # Désactiver si nécessaire
   logllmon            # Réactiver pour debug
   ```

### Navigation dans la Memory Bank (V1.3)

**Point d'entrée obligatoire** : [`/prompts/index.md`](prompts/index.md) - Point d'entrée UNIQUE depuis V1.3

**Parcours récursif** : Chaque fichier référence ses dépendances et est référencé par ses parents, créant une navigation bidirectionnelle complète.

**Consultation automatique** : Les LLM doivent automatiquement consulter `/prompts/index.md` avant toute réponse (sauf agents internes AI-KIDO).

**Navigation** :

- **Mono-projet** : `/prompts/index.md` → `/prompts/gen/index.md` → domaines
- **Multi-projet** : `/prompts/index.md` → `/prompts/[projet-n]/index.md` → `/prompts/[projet-n]/gen/index.md` → domaines

## 🔧 Règles de Qualité

### Contraintes Structurelles

- **📏 Contraintes de Lignes** :
  - **≤500 lignes** : Fichiers standard (concepts, techniques, use cases, docs)
  - **≤1000 lignes** : Commands, personas, agents, skills (optimisation LLM)
  - **Exception critique** : `ai-kido.md` et `ai-kido-light.md` DOIVENT rester ≤500 lignes
  - **Division automatique** : Si dépassement, split intelligent avec liens préservés
- **🌳 4 niveaux maximum** de profondeur dans l'arborescence
- **⚖️ 3-7 enfants** par nœud parent pour équilibrage optimal
- **🔗 Liens bidirectionnels** systématiques (A→B implique B→A)
- **🏗️ Structures flexibles** : Support mono-projet et multi-projet

### Format Standard

```markdown
# [Titre du Concept/Composant]
> Version: X.Y | Date: YYYY-MM-DD | Statut: [Statut]

## Vue d'ensemble
[Description concise]

## Définitions clés  
[Terminologie essentielle]

## Principes directeurs
[Règles et axiomes]

## Spécifications techniques
[Détails d'implémentation]

## Exemples d'application
[Cas d'usage concrets]

## Relations et dépendances
[Connexions avec d'autres composants]
```

### Métriques de Qualité

- **Conformité** : % de fichiers respectant les standards
- **Traçabilité** : Présence de références aux sources
- **Cohérence** : Absence de contradictions internes
- **Densité sémantique** : Ratio information utile / tokens utilisés
- **Synchronisation AGENTS.md** : % de conformité personas ↔ agents

## 🎚️ Modes AI-KIDO : Standard vs Light

AI-KIDO propose deux modes d'organisation selon la taille et complexité du projet :

### Mode STANDARD (Par Défaut)

**Recommandé pour** : Grandes équipes (4+), projets complexes, applications enterprise

**Caractéristiques** :

- 📦 **Fichiers multiples** : Concepts et techniques organisés par domaine
- 👥 **6-12 personas** : Agents spécialisés par fonction
- 📋 **8-15 use cases** : Couverture complète des scénarios
- 🎭 **RACI complet** : Matrice multi-acteurs avec rôles définis
- 🌳 **Profondeur 3-4 niveaux** : Arborescence riche

**Règles** : Définies dans [`/prompts/hard_points/ai-kido.md`](prompts/hard_points/ai-kido.md)

### Mode LIGHT (Bases Légères)

**Recommandé pour** : Solo/petites équipes (1-3), prototypes, POCs, microservices

**Caractéristiques** :

- 📦 **Fichiers unifiés** : 1 fichier concepts + 1 fichier techniques
- 👥 **3-5 personas max** : Agents polyvalents
- 📋 **3-5 use cases max** : Scénarios critiques uniquement
- 🎭 **RACI optionnel** : Acteur unique ou minimal (≤3 rôles)
- 🌳 **Profondeur 2-3 niveaux** : Arborescence plate

**Règles** : Définies dans [`/prompts/hard_points/ai-kido-light.md`](prompts/hard_points/ai-kido-light.md)

**Migration** : Passage LIGHT ↔ STANDARD possible selon l'évolution du projet

## 🚨 Hard Points - Vérités Immuables

Les **hard points** dans `/prompts/hard_points/` constituent des vérités immuables qui ne peuvent être remises en question.

**Hiérarchie de priorité** :

1. **Hard points** (priorité absolue)
2. **Tables de vérités** (`/prompts/gen/`)
3. **Demandes utilisateur**

**Traitement obligatoire** :

- Vérifier l'existence de hard points pour le domaine concerné
- Respecter ABSOLUMENT toutes les contraintes listées
- En cas de conflit : hard points > tables de vérité > demande utilisateur

## 📚 Ressources et Documentation

### Fichiers de Référence

- **[`prompts/hard_points/ai-kido.md`](prompts/hard_points/ai-kido.md)** : Guide complet des 18 règles AI-KIDO (Mode STANDARD)
- **[`prompts/hard_points/ai-kido-light.md`](prompts/hard_points/ai-kido-light.md)** : Guide AI-KIDO Mode LIGHT (bases légères)
- **[`prompts/hard_points/gestion-logs-aikido.md`](prompts/hard_points/gestion-logs-aikido.md)** : Règles de traçabilité
- **[`prompts/gen/index.md`](prompts/gen/index.md)** : Point d'entrée de la memory bank (mono-projet)
- **[`prompts/[projet]/gen/index.md`](prompts/)** : Point d'entrée memory bank (multi-projet)
- **[`AGENTS.md`](AGENTS.md)** : Interface standardisée pour les LLM
- **[`CLAUDE.md`](CLAUDE.md)** : Mapping AI-KIDO ↔ Norme CLAUDE.md avec état de la base

### Commandes Disponibles

Toutes les commandes sont documentées dans [`prompts/hard_points/commands/`](prompts/hard_points/commands/) :

- **Commandes d'initialisation** : `init-aikido`, `init-glossaire`, `init-raci-aikido`
- **Commandes d'analyse** : `analyse-project`, `analyse-aikido`
- **Commandes de création** : `create-persona`, `create-command` 🆕, `create-search-plan` 🆕, `create-analyse-plan` 🆕, `compile-agent-from-use`
- **Commandes de maintenance** : `check-claude`, `check-truth` 🆕, `maj-aikido`, `validate-search-plan` 🆕, `validate-analyse-plan` 🆕
- **Commandes d'indexation** : `reindex-projet` 🆕, `clean-index` 🆕
- **Commandes de traçabilité** : `logllmon`, `logllmoff`
- **Commandes de gestion des skills** : `create-skill`, `skill-get` 🆕

## 🎓 Philosophie et Avantages

### Pourquoi AI-KIDO ?

1. **🧠 Optimisation LLM** : Structure pensée pour maximiser l'efficacité des interactions IA
2. **🔄 Évolution continue** : Auto-alimentation et amélioration basée sur l'usage
3. **👥 Collaboration** : Organisation par rôles avec matrice RACI claire
4. **📈 Scalabilité** : Contraintes d'équilibrage pour gérer la croissance
5. **🔒 Fiabilité** : Hard points pour préserver les décisions critiques
6. **🌐 Interopérabilité** : Interface AGENTS.md standard pour outils LLM

### Bénéfices Concrets

- **Réduction du temps de réponse** des LLM grâce à la structure optimisée
- **Cohérence des réponses** via les tables de vérités partagées  
- **Capitalisation des connaissances** avec auto-alimentation
- **Collaboration efficace** grâce à la répartition par rôles
- **Maintenance simplifiée** avec outils d'audit automatique
- **Traçabilité complète** des interactions et décisions

---

**🎯 AI-KIDO transforme votre projet en une memory bank intelligente, évolutive et collaborative, optimisée pour l'ère de l'IA.**

Pour démarrer avec un bootstrap AI-KIDO sous Claude Code :

```
Exécute le fichier prompts/hard_points/commands/check-claude.md pour vérifier l'état de la Memory Bank AI-KIDO et générer les fichiers de compatibilité Claude Code
```

Pour initialiser un nouveau projet : `/init-aikido`
