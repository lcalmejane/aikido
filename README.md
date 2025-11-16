# AI‑KIDO – Méthode de Construction de Memory Bank IA

## Description

**AI‑KIDO** est une méthode structurée pour créer et maintenir une **memory bank** (base de connaissances) optimisée pour les interactions avec les LLM. Cette base constitue un système de **Tables de Vérités** hiérarchique permettant de capitaliser, structurer et réutiliser les connaissances de manière efficace et cohérente.

La méthode AI‑KIDO suit un processus itératif alternant entre approches **fonctionnelle/technique** et **globale/spécifique** pour construire progressivement une base de connaissances robuste et évolutive.

## 🎯 Philosophie AI‑KIDO

AI‑KIDO repose sur 18 règles fondamentales qui garantissent :
- **🌳 Structure arborescente** : Navigation récursive depuis un point d'entrée unique
- **📊 Séparation théorie/pratique** : Concepts vs techniques, personas vs use cases
- **🔄 Auto-alimentation** : Amélioration continue basée sur les retours d'expérience
- **⚖️ Équilibrage** : Contraintes de taille (500 lignes max) et profondeur (4 niveaux max)
- **🔗 Liens bidirectionnels** : Navigation cohérente dans toutes les directions
- **👥 Répartition par rôles** : Organisation collaborative avec matrice RACI

## 📁 Structure du Projet

```
/
├── prompts/
│   ├── gen/                    # 🧠 Memory Bank - Tables de Vérités
│   │   ├── index.md           # 🚪 Point d'entrée principal
│   │   ├── concepts/          # 📚 Concepts fondamentaux
│   │   ├── techniques/        # 🔧 Méthodes pratiques
│   │   ├── personas/          # 👤 Agents spécialisés
│   │   └── use_cases/         # 💼 Applications concrètes
│   ├── hard_points/           # 🔒 Vérités immuables
│   │   ├── ai-kido.md        # 📖 Guide complet des 18 règles
│   │   └── gestion-logs-aikido.md # 📝 Règles de traçabilité
│   └── spec/                  # 📋 Spécifications personnelles
│       └── logs/              # 📊 Logs des interactions (si activés)
├── .roo/
│   └── commands/              # ⚡ Commandes AI‑KIDO
└── README.md                  # 📖 Ce fichier
```

## 🚀 Méthode AI‑KIDO : Processus Itératif

### Phase 1 : Initialisation de la Base

#### 1.1 [`init-aikido`](.roo/commands/init-aikido.md) - Fondations du Projet
**Objectif** : Créer la structure de base de la memory bank

**Processus itératif** :
1. **Analyse des sources** (Fonctionnel) → Détection automatique du contexte projet
2. **Architecture système** (Technique) → Modélisation C1 et composants
3. **Stack technique** (Spécifique) → Technologies et outils identifiés
4. **Use cases fondamentaux** (Global) → Cas d'usage de base du domaine

**Résultat** : Structure `/prompts/gen/` initialisée avec les fichiers de base

#### 1.2 [`init-glossaire`](.roo/commands/init-glossaire.md) - Terminologie Métier
**Objectif** : Clarifier la terminologie spécifique au projet

**Processus itératif** :
1. **Extraction terminologique** (Spécifique) → Termes métier confus ou ambigus
2. **Analyse contextuelle** (Fonctionnel) → Domaine métier et sous-domaines
3. **Définitions structurées** (Technique) → Glossaire organisé par catégories
4. **Validation globale** (Global) → Cohérence terminologique

**Résultat** : Glossaire métier dans `/prompts/gen/concepts/glossaire-metier.md`

#### 1.3 [`init-raci-aikido`](.roo/commands/init-raci-aikido.md) - Organisation d'Équipe
**Objectif** : Définir la matrice RACI et la répartition par rôles

**Processus itératif** :
1. **Identification des rôles** (Fonctionnel) → Équipe et responsabilités
2. **Matrice RACI** (Technique) → Attribution R/A/C/I par activité
3. **Sous-répertoires spécialisés** (Spécifique) → Structure par rôles
4. **Workflow de collaboration** (Global) → Règles Git et validation

**Résultat** : Spécifications RACI dans `/prompts/hard_points/aikido-raci-[TEAM].md`

### Phase 2 : Analyse et Enrichissement

#### 2.1 [`analyse-project`](.roo/commands/analyse-project.md) - Analyse Contextuelle
**Objectif** : Analyser le projet existant pour enrichir la memory bank

**Processus itératif** :
1. **Scan fonctionnel** (Global) → Vue d'ensemble du projet
2. **Analyse technique** (Spécifique) → Code, architecture, patterns
3. **Extraction de connaissances** (Technique) → Concepts et techniques utilisés
4. **Intégration** (Fonctionnel) → Mise à jour de la memory bank

### Phase 3 : Création des Personas

#### 3.1 [`create-persona`](.roo/commands/create-persona.md) - Agents Spécialisés
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

1. **[`init-aikido`](.roo/commands/init-aikido.md)** - Initialisation de la memory bank
   - Crée la structure de base dans `/prompts/gen/`
   - Analyse automatique des sources projet
   - Génération des concepts et techniques fondamentaux

2. **[`init-glossaire`](.roo/commands/init-glossaire.md)** - Création du glossaire métier
   - Extraction des termes métier spécifiques et confus
   - Exclusion automatique des termes AI-KIDO génériques
   - Organisation par catégories (processus, règles, concepts, acronymes)

3. **[`init-raci-aikido`](.roo/commands/init-raci-aikido.md)** - Matrice RACI et organisation
   - Définition des rôles d'équipe
   - Création de la matrice RACI (Responsable/Approbateur/Consulté/Informé)
   - Génération des sous-répertoires par rôles

4. **[`analyse-project`](.roo/commands/analyse-project.md)** - Analyse contextuelle
   - Scan du projet existant
   - Enrichissement de la memory bank
   - Détection des patterns et bonnes pratiques

5. **[`create-persona`](.roo/commands/create-persona.md)** - Création des personas
   - Agents spécialisés selon la taxonomie AI-KIDO
   - Adaptation au contexte projet
   - Intégration dans la hiérarchie des rôles

### 🔧 Commandes de Maintenance

#### [`maj-aikido`](.roo/commands/maj-aikido.md) - Synchronisation et Optimisation
**Objectif** : Maintenir la cohérence de la memory bank lors des évolutions

**Processus** :
1. **Détection des changements** → Hard points et nouvelles commandes
2. **Analyse d'impact** → Compatibilité avec la base existante
3. **Mise à jour des index** → Synchronisation `/prompts/gen/index.md` et `AGENTS.md`
4. **Diagnostic de cohérence** → Audit structurel et liens bidirectionnels
5. **Optimisation** → Correction des incohérences et amélioration de la structure

#### [`analyse-aikido`](.roo/commands/analyse-aikido.md) - Audit et Redressage
**Objectif** : Audit complet avec corrections automatiques selon les 18 règles

**Processus** :
1. **Audit structurel** → Validation de la conformité aux règles 1-18
2. **Correction des formats** → Standardisation selon le template AI-KIDO
3. **Synchronisation AGENTS.md** → Cohérence avec `/prompts/gen/`
4. **Détection d'incohérences** → Harmonisation terminologique et architecturale
5. **Mise à jour des index** → Régénération de la navigation hiérarchique
6. **Validation des hard points** → Respect des vérités immuables

### 📊 Commandes de Traçabilité

#### [`logllmon`](.roo/commands/logllmon.md) - Activation des Logs
- Active `LLM_TRACIBILITY=TRUE` dans `/prompts/gen/index.md`
- Démarre l'enregistrement des interactions dans `/prompts/spec/logs/prompts.log`

#### [`logllmoff`](.roo/commands/logllmoff.md) - Désactivation des Logs  
- Désactive `LLM_TRACIBILITY=FALSE` dans `/prompts/gen/index.md`
- Arrête l'enregistrement des interactions

**Format des logs** :
```markdown
# DATE: YYYY-MM-DD HH:MM:SS
## PROMPT [Mode utilisé]
[Question de l'utilisateur]

```

**⚠️ Règle critique** : Les logs sont **TOUJOURS** stockés dans `/prompts/spec/logs/prompts.log`, jamais à la racine du projet.

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
[Liens vers /prompts/gen/index.md et concepts/]

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

### Navigation dans la Memory Bank

**Point d'entrée obligatoire** : [`/prompts/gen/index.md`](prompts/gen/index.md)

**Parcours récursif** : Chaque fichier référence ses dépendances et est référencé par ses parents, créant une navigation bidirectionnelle complète.

**Consultation automatique** : Les LLM doivent automatiquement consulter `/prompts/gen/index.md` avant toute réponse (sauf mode Orchestrator).

## 🔧 Règles de Qualité

### Contraintes Structurelles

- **📏 500 lignes maximum** par fichier (division automatique si dépassement)
- **🌳 4 niveaux maximum** de profondeur dans l'arborescence
- **⚖️ 3-7 enfants** par nœud parent pour équilibrage optimal
- **🔗 Liens bidirectionnels** systématiques (A→B implique B→A)

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

- **[`prompts/hard_points/ai-kido.md`](prompts/hard_points/ai-kido.md)** : Guide complet des 18 règles AI-KIDO
- **[`prompts/hard_points/gestion-logs-aikido.md`](prompts/hard_points/gestion-logs-aikido.md)** : Règles de traçabilité
- **[`prompts/gen/index.md`](prompts/gen/index.md)** : Point d'entrée de la memory bank
- **[`AGENTS.md`](AGENTS.md)** : Interface standardisée pour les LLM

### Commandes Disponibles

Toutes les commandes sont documentées dans [`.roo/commands/`](.roo/commands/) :
- Commandes d'initialisation : `init-*`
- Commandes de maintenance : `maj-*`, `analyse-*`  
- Commandes de traçabilité : `log*`

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

Pour commencer, lancez simplement : `init-aikido`
