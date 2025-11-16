# AI-KIDO - Guide Pratique pour LLM

> **Version**: 1.1-LLM | **Usage**: Référence directe pour interactions LLM
>
> Ce document contient les règles et structures essentielles d'AI-KIDO pour usage par les LLMs.

## CONFIGURATION ROO-CODE

**PRÉ-PROMPT OBLIGATOIRE POUR ROO-CODE**:

```
Sauf pour le Mode "Orchestrator",
Après analyse de la question et avant d'y répondre, 
utiliser le fichier prompts/gen/index.md
pour faire un parcours recursif pertinent afin de récupérer les infos 
strictement utiles à la compréhension de la demande.
```

**EXCEPTION**: Ce pré-prompt ne s'applique PAS au mode "Orchestrator" de Roo-Code.

## RÈGLES FONDAMENTALES D'UTILISATION

### Règles Architecturales des Tables de Vérités

1. **🌳 Arborescence Documentaire**: Parcours d'arbre récursif depuis `/prompts/gen/index.md`
2. **📊 Séparation Théorie/Pratique**: `concepts/` + `personas/` (théorie) vs `techniques/` + `use_cases/` (pratique)
3. **🔄 Introspection**: Les règles de gestion font partie d'elles-mêmes (ce fichier)
4. **📏 Contrainte 500 Lignes**: Chunk size = file size pour optimisation LLM
5. **✂️ Split Automatique**: Division intelligente avec liens préservés si > 500 lignes
6. **🔗 Liens Bidirectionnels**: Chaînage A ↔ B systématique
7. **⚖️ Arbre Équilibré**: Facteur 3-7 enfants/parent, profondeur ≤ 4 niveaux
8. **🏗️ Architecture Bicéphale**: `gen/` (meuble) vs `hard_points/` (rigide)
9. **👥 Agents Spécialistes**: Personas pour optimisation requêtes LLM
10. **🎭 Agent Orchestrateur**: Coordination des agents spécialistes
11. **🗜️ Densité Sémantique**: Information maximale, mots minimaux
12. **📈 Schémas Mermaid**: Compression visuelle pour densité sémantique
13. **🔍 Indexation Vectorielle**: Mode RAG local du workspace
14. **🔄 Amélioration Continue**: Évolution automatique selon besoins et LLM
15. **👨‍💼 Répartition par Rôles Humains**: Sous-répertoires assignés aux membres de l'équipe pour faciliter la collaboration Git
16. **🤖 Conformité AGENTS.md**: Synchronisation obligatoire avec la norme AGENTS.md pour interopérabilité LLM
17. **🔄 Bidirectionnalité Agents-Personas**: Correspondance 1:1 entre agents AGENTS.md et personas AI-KIDO
18. **📋 Structure Standard AGENTS.md**: Respect du format canonique (Project Context, Available Agents, Agent Interaction Matrix, Usage Guidelines)

### Règles d'Auto-Alimentation

1. **Signal Utilisateur**: Dès signalement d'erreur → création règle préventive
2. **Auto-Détection**: 2+ erreurs similaires → auto-alimentation proactive
3. **Seuils**: Immédiat (critique), Rapide (majeur 2x), Standard (mineur 3x)
4. **Intégration**: Placement automatique dans répertoire approprié + mise à jour index

### Règles de Capitalisation des Analyses

1. **Génération Obligatoire**: Tous les modes d'analyse DOIVENT générer des fichiers dans les Tables de Vérités
2. **Préférence Modes Productifs**: Privilégier les modes qui créent des fichiers (Code, Architect, Debug) vs mode Ask
3. **Sauvegarde Systématique**: Chaque analyse → fichier dans `/prompts/gen/` selon le type :
   - Analyse conceptuelle → `/concepts/`
   - Analyse technique → `/techniques/`
   - Analyse de cas → `/use_cases/`
   - Définition de rôle → `/personas/`
4. **Traçabilité**: Horodatage et versioning des analyses sauvegardées
5. **Réutilisation**: Consulter les analyses existantes avant d'en créer de nouvelles

### Règles de Création et Maintenance

1. **Règle de l'Existant**: Toujours vérifier l'existence avant de créer
2. **Règle de la Structure**: Consulter systématiquement l'arborescence `/prompts/gen/`
3. **Règle de Densité**: Maximiser la pertinence par mot utilisé
4. **Règle d'Enrichissement**: Améliorer continuellement les Tables de vérité
5. **Règle de Cohérence**: Maintenir l'alignement entre tous les éléments
6. **Règle de Traçabilité**: Documenter toutes les décisions importantes

### Règles d'Interaction

1. **Règle du Contexte**: Toujours consulter les Tables de vérité pertinentes
2. **Règle de Spécificité**: Être précis dans l'analyse des demandes
3. **Règle de Validation**: Vérifier la cohérence avec les standards établis
4. **Règle de Documentation**: Capitaliser sur les apprentissages dans les réponses

## STRUCTURE OBLIGATOIRE DES RÉPERTOIRES

```
/prompts/
├── gen/                        # Connaissances collectives - TOUJOURS CONSULTER
│   ├── index.md                # Point d'entrée principal
│   ├── concepts/               # Concepts fondamentaux
│   │   ├── architecture/       # Responsable: Architecte Lead
│   │   ├── business/           # Responsable: Product Owner
│   │   └── security/           # Responsable: Security Officer
│   ├── techniques/             # Méthodes pratiques
│   │   ├── backend/            # Responsable: Tech Lead Backend
│   │   ├── frontend/           # Responsable: Tech Lead Frontend
│   │   └── devops/             # Responsable: DevOps Lead
│   ├── personas/               # Prompts par rôle
│   └── use_cases/              # Applications par contexte
│       ├── user-stories/       # Responsable: Product Owner
│       ├── technical/          # Responsable: Tech Lead
│       └── operational/        # Responsable: DevOps Lead
├── hard_points/                # Vérités immuables - PRIORITÉ ABSOLUE
│   ├── index.md                # Point d'entrée des hard points
│   ├── concepts/               # Concepts fondamentaux validés
│   ├── techniques/             # Méthodes pratiques validées
│   └── use_cases/              # cas d'usage validés
└── spec/                       # Espaces personnels - IGNORER sauf activation explicite
    └── logs/                   # Logs des questions
```

**RÈGLE CRITIQUE**: Consulter `/prompts/gen/index.md` en premier pour tout contexte projet.

### Règles de Répartition par Rôles Humains

1. **Assignation de Responsabilité**: Chaque sous-répertoire de `concepts/`, `techniques/`, et `use_cases/` DOIT avoir un responsable humain désigné
2. **Cycle de Vie Git**: Les responsables gèrent les MR/PR pour leur domaine de responsabilité
3. **Cohérence Transversale**: Un responsable "Architecte AI-KIDO" supervise la cohérence globale
4. **Matrice RACI des Sous-Répertoires**:
   - **R** (Responsable): Membre de l'équipe assigné au sous-répertoire
   - **A** (Approbateur): Architecte AI-KIDO pour validation de cohérence
   - **C** (Consulté): Autres responsables pour impacts transversaux
   - **I** (Informé): Toute l'équipe via notifications Git

**Exemple de Répartition**:

```
concepts/
├── architecture/     # R: Architecte Lead, A: AI-KIDO Architect
├── business/         # R: Product Owner, A: AI-KIDO Architect
├── security/         # R: Security Officer, A: AI-KIDO Architect
└── glossaire/        # R: Tech Writer, A: AI-KIDO Architect

techniques/
├── backend/          # R: Tech Lead Backend, A: AI-KIDO Architect
├── frontend/         # R: Tech Lead Frontend, A: AI-KIDO Architect
└── devops/           # R: DevOps Lead, A: AI-KIDO Architect

use_cases/
├── user-stories/     # R: Product Owner, A: AI-KIDO Architect
├── technical/        # R: Tech Lead, A: AI-KIDO Architect
└── operational/      # R: DevOps Lead, A: AI-KIDO Architect
```

## FORMAT STANDARD DES TABLES DE VÉRITÉ

```markdown
# [Titre du Concept/Composant]
> Version: X.Y | Date: YYYY-MM-DD | Statut: [Statut]

## Vue d'ensemble
[Description concise du concept]

## Définitions clés
[Terminologie essentielle]

## Principes directeurs
[Règles et axiomes]

## Spécifications techniques
[Détails d'implémentation, contraintes, standards]

## Exemples d'application
[Cas d'usage concrets]

## Relations et dépendances
[Connexions avec d'autres composants]
```

**CONTRAINTES DE QUALITÉ**:

- Format standardisé: Markdown avec métadonnées obligatoires
- Longueur maximale: 500 lignes par fichier
- Densité sémantique: Information maximale, mots minimaux
- Auto-suffisance: Compréhensible sans contexte externe

## STRUCTURE DE PROMPT AI-KIDO STANDARD

```markdown
[PERSONA] [Référence au persona approprié dans /prompts/gen/personas/]

[CONTEXTE]
- Tables de vérité pertinentes: [Références spécifiques]
- Contraintes du projet: [Issues des hard_points si applicable]
- Informations spécifiques à cette requête

[TÂCHE]
[Description précise de ce qui est demandé]

[FORMAT]
[Instructions sur la présentation des résultats]

[VALIDATION]
[Critères de qualité selon les standards établis]
```

## LOGS

**FEATURE_PLIPPING**: Ne Logger les questions que si la fonctionnalité est activée LLM_TRACIBILITY=TRUE dans le fichier /prompts/gen/index.md .

**FORMAT LOGS**:

```markdown
# DATE: YYYY-MM-DD HH-MM-SS
## PROMPT [Mode utilisé]
[Question de l'utilisateur]

```

**RÈGLE CRITIQUE**: Si le dossier `/prompts/spec/` existe et avant l'analyse de la question et avant d'y répondre

**TRATEMENT OBLIGATOIRE**:

1. Vérifier que la fonctionnalité LLM_TRACIBILITY=TRUE est activée
2. Si Créer le fichier `/prompts/spec/logs/prompts.log` si il n'existe pas
3. Logger en fin de fichier `/prompts/spec/logs/prompts.log` la question de l'utilisateur

## RÈGLES DE CONFORMITÉ AGENTS.MD

### Règle 16 : Interface AGENTS.md pour Memory Bank Complète

**PRINCIPE** : Le fichier `AGENTS.md` sert d'**interface standardisée** exposant toute la memory bank AI-KIDO selon la norme LLM, y integrant entre autres les personas.

**ARCHITECTURE PAR LIENS** :
1. **Index externe** : `AGENTS.md` = **miroir** de `/prompts/gen/index.md` au format norme LLM
2. **Navigation par liens** : Références exclusives vers `/prompts/gen/` sans duplication de contenu
3. **Synchronisation bidirectionnelle** : Cohérence automatique avec `/prompts/gen/index.md`
4. **Interface standardisée** : Point d'entrée conforme norme AGENTS.md pour interopérabilité

### Règle 17 : Synchronisation AGENTS.md ↔ /prompts/gen/index.md

**PRINCIPE** : AGENTS.md = **équivalent externe** de `/prompts/gen/index.md` avec liens vers la memory bank, jamais de recopie de contenu.

**SYNCHRONISATION BIDIRECTIONNELLE** :
1. **Project Context** : **Liens** vers `/prompts/gen/index.md` et `/prompts/gen/concepts/architecture-systeme.md`
2. **Available Agents** : **Références** vers `/prompts/gen/concepts/`, `/prompts/gen/techniques/`, `/prompts/gen/use_cases/`, `/prompts/gen/personas/`
3. **Agent Categories** : **Navigation** vers taxonomie AI-KIDO via liens relatifs
4. **Knowledge Base** : **Pointeurs** exclusifs vers fichiers sources, aucune duplication

### Règle 18 : Structure AGENTS.md par Liens

**PRINCIPE** : AGENTS.md = **index externe** avec liens exclusifs vers `/prompts/gen/`, aucune duplication de contenu.

**STRUCTURE OBLIGATOIRE** :
```markdown
# AI Agents Configuration

## Project Context
- **Project Name**: [Lien vers /prompts/gen/index.md]
- **Domain**: [Lien vers /prompts/gen/concepts/]
- **Architecture**: [Lien vers /prompts/gen/concepts/architecture-systeme.md]
- **Tech Stack**: [Lien vers /prompts/gen/techniques/stack-technique.md]

## Available Agents

### Concept Specialists
[Liens vers /prompts/gen/concepts/*.md - expertise conceptuelle]

### Technical Specialists  
[Liens vers /prompts/gen/techniques/*.md - expertise technique]

### Domain Experts
[Liens vers /prompts/gen/use_cases/*.md - expertise métier]

### Role-Based Agents
[Liens vers /prompts/gen/personas/*.md - rôles spécialisés]

## Agent Interaction Matrix
[Liens vers matrice-raci.md et spécifications RACI]

## Usage Guidelines
[Liens vers /prompts/gen/use_cases/index.md et documentation RACI]
```

**CONTRAINTES DE LIAISON** :
- **Liens exclusifs** : Aucune recopie de contenu, que des références
- **Synchronisation index** : Cohérence avec `/prompts/gen/index.md`
- **Navigation externe** : Interface pour outils LLM vers memory bank AI-KIDO
- **Mise à jour automatique** : Liens mis à jour lors de changements dans `/prompts/gen/`

### Règles de Synchronisation AGENTS.md ↔ AI-KIDO

#### Synchronisation du Contexte Projet
1. **Project Name** : Extrait automatiquement de `/prompts/gen/index.md`
2. **Domain** : Inféré du contexte métier dans `/prompts/gen/concepts/`
3. **Architecture** : Référence `/prompts/gen/concepts/architecture-systeme.md`
4. **Tech Stack** : Référence `/prompts/gen/techniques/stack-technique.md`

#### Synchronisation des Agents
1. **Available Agents** : Générés depuis `/prompts/gen/personas/`
2. **Catégorisation** : Selon taxonomie AI-KIDO (CONCEPTION, DÉVELOPPEMENT, SÉCURITÉ, QUALITÉ, DÉPLOIEMENT)
3. **Spécialisations** : Adaptées au contexte projet détecté
4. **Responsabilités** : Alignées avec spécifications RACI si disponibles

#### Synchronisation de la Matrice d'Interaction
1. **Agent Type** : Catégorie taxonomique AI-KIDO
2. **Primary Role** : Rôle principal du persona correspondant
3. **Interaction Context** : Contextes d'usage depuis `/prompts/gen/use_cases/`
4. **Knowledge Base** : Références aux tables de vérités pertinentes

#### Synchronisation des Guidelines
1. **When to Use Each Agent** : Basé sur `/prompts/gen/use_cases/`
2. **Agent Coordination** : Selon spécifications RACI organisationnelles
3. **Best Practices** : Extraites des `/prompts/gen/techniques/`
4. **Domain-Specific Guidelines** : Adaptées au domaine métier

### Validation de Conformité AGENTS.md

#### Validation Structurelle
- ✅ Présence des 4 sections obligatoires
- ✅ Format Markdown standard
- ✅ Métadonnées de version présentes
- ✅ Liens vers documentation AI-KIDO

#### Validation de Cohérence
- ✅ Contexte projet synchronisé avec AI-KIDO
- ✅ Agents mappés avec personas existants
- ✅ Taxonomie AI-KIDO respectée
- ✅ Spécifications RACI alignées

#### Validation de Qualité
- ✅ Descriptions d'agents complètes et précises
- ✅ Matrice d'interaction renseignée
- ✅ Guidelines d'usage documentées
- ✅ Références aux sources AI-KIDO

### Processus de Maintenance AGENTS.md

#### Mise à Jour Automatique
1. **Déclencheurs** : Modification de personas, contexte, ou RACI
2. **Synchronisation** : Mise à jour automatique des sections concernées
3. **Validation** : Vérification de conformité post-mise à jour
4. **Notification** : Alerte en cas d'incohérence détectée

#### Audit Périodique
1. **Fréquence** : Inclus dans l'audit hebdomadaire AI-KIDO
2. **Métriques** : Score de conformité AGENTS.md
3. **Corrections** : Propositions automatiques de corrections
4. **Reporting** : Inclusion dans rapports d'audit AI-KIDO

## EXEMPLES DE PERSONAS

> **Note** : Ces personas sont des exemples illustratifs. AI-KIDO est adaptable à différents contextes (fonctionnel, technique, code, documentation, etc.) et ne requiert pas la création obligatoire de ces personas spécifiques.

| Persona (Exemple) | Responsabilité | Usage Illustratif |
|---------|---------------|-------|
| **Architecte** | Structure et décisions techniques majeures | Architecture, design patterns |
| **Développeur Backend** | Logique serveur et robustesse | APIs, bases de données, services |
| **Développeur Frontend** | Expérience utilisateur | UI/UX, composants, interactions |
| **Expert Sécurité** | Protection et conformité | Validation sécurité, audit |
| **QA Engineer** | Qualité et détection de problèmes | Tests, validation, debugging |
| **DevOps Engineer** | Automatisation et continuité | CI/CD, infrastructure, monitoring |

**UTILISATION**: Adapter les personas selon le contexte spécifique du projet. Consulter `/prompts/gen/personas/` pour les personas définis dans votre contexte.

## TAXONOMIE DES PERSONAS AI-KIDO

### Organisation Taxonomique Hiérarchique

La structure des personas dans AI-KIDO suit une taxonomie hiérarchique inspirée des systèmes biologiques, où les personas sont organisés en plusieurs niveaux de spécialisation :

```
Niveau 1: Catégorie fondamentale
└── Niveau 2: Famille fonctionnelle
    └── Niveau 3: Persona spécifique
        └── Niveau 4: Spécialisation contextuelle
```

Cette organisation permet une granularité progressive et facilite la réutilisation des caractéristiques partagées.

### Structure Taxonomique Détaillée

#### Niveau 1 : Catégories Fondamentales

- **🏗️ CONCEPTION** : Personas orientés architecture et design
- **⚙️ DÉVELOPPEMENT** : Personas orientés implémentation technique
- **🔒 SÉCURITÉ** : Personas orientés protection et conformité
- **🔍 QUALITÉ** : Personas orientés validation et amélioration
- **🚀 DÉPLOIEMENT** : Personas orientés infrastructure et livraison

#### Niveau 2 : Familles Fonctionnelles

**CONCEPTION** :

- Architecture Système
- Design Interface
- Modélisation Données

**DÉVELOPPEMENT** :

- Backend Services
- Frontend Applications
- Intégration Systèmes

**SÉCURITÉ** :

- Audit Sécurité
- Conformité Réglementaire
- Gestion Risques

**QUALITÉ** :

- Tests Automatisés
- Validation Fonctionnelle
- Performance Optimisation

**DÉPLOIEMENT** :

- Infrastructure Cloud
- CI/CD Pipeline
- Monitoring Opérationnel

#### Niveau 3 : Personas Spécifiques

Chaque famille fonctionnelle contient des personas spécialisés avec des responsabilités définies :

```markdown
[Catégorie] > [Famille] > [Persona Spécifique]
CONCEPTION > Architecture Système > Architecte Solutions
DÉVELOPPEMENT > Backend Services > Développeur API REST
SÉCURITÉ > Audit Sécurité > Expert Sécurité Applications
QUALITÉ > Tests Automatisés > QA Engineer
DÉPLOIEMENT > Infrastructure Cloud > DevOps Engineer
```

#### Niveau 4 : Spécialisations Contextuelles

Adaptations des personas selon le contexte projet :

- **Domaine Métier** : Finance, Santé, E-commerce, etc.
- **Technologie** : React, Node.js, Python, Kubernetes, etc.
- **Échelle** : Startup, PME, Enterprise
- **Contraintes** : Temps, Budget, Conformité

### Règles de Développement des Personas

#### Règles de Création

1. **Héritage Taxonomique** : Chaque persona hérite des caractéristiques de ses niveaux parents
2. **Spécialisation Progressive** : Chaque niveau ajoute des spécificités sans contredire les niveaux supérieurs
3. **Cohérence Horizontale** : Les personas d'un même niveau doivent être cohérents entre eux
4. **Complétude Verticale** : Chaque branche taxonomique doit couvrir tous les aspects nécessaires

#### Format Standard de Persona

```markdown
# [Nom du Persona]
> Taxonomie: [Catégorie] > [Famille] > [Spécifique] > [Contextuel]
> Version: X.Y | Date: YYYY-MM-DD

## Identité
- **Rôle principal** : [Responsabilité centrale]
- **Domaine d'expertise** : [Champ de compétences]
- **Niveau hiérarchique** : [Position dans la taxonomie]

## Caractéristiques héritées
[Traits provenant des niveaux taxonomiques supérieurs]

## Spécialisations
[Traits spécifiques à ce persona]

## Contextes d'application
[Situations où ce persona est optimal]

## Relations taxonomiques
- **Parent** : [Famille fonctionnelle]
- **Enfants** : [Spécialisations contextuelles]
- **Pairs** : [Autres personas du même niveau]
```

#### Règles de Maintenance

1. **Évolution Contrôlée** : Modifications uniquement par versioning
2. **Impact Analysis** : Évaluer l'impact sur les personas enfants
3. **Rétrocompatibilité** : Préserver la compatibilité avec les versions antérieures
4. **Documentation** : Tracer toutes les modifications taxonomiques

### Utilisation Pratique

#### Sélection de Persona

1. **Identifier la catégorie** : Quel type d'activité ?
2. **Préciser la famille** : Quelle fonction spécifique ?
3. **Choisir le persona** : Quel niveau de spécialisation ?
4. **Adapter au contexte** : Quelles contraintes particulières ?

#### Exemple de Sélection

```
Besoin : Développer une API sécurisée pour une fintech
↓
Catégorie : DÉVELOPPEMENT (implémentation technique)
↓
Famille : Backend Services (services côté serveur)
↓
Persona : Développeur API REST (spécialiste APIs)
↓
Contexte : Finance + Sécurité renforcée + Conformité RGPD
```

## HARD POINTS - PRIORITÉ ABSOLUE

**DÉFINITION**: Vérités immuables qui ne peuvent être remises en question.

**TRAITEMENT OBLIGATOIRE**:

1. Vérifier existence de hard_points pour le domaine concerné
2. Respecter ABSOLUMENT toutes les contraintes listées
3. En cas de conflit: hard_points > tables de vérité > demande utilisateur

**FORMAT HARD POINT**:

```markdown
# Hard Point: [Nom de la Décision]
> Promu le: YYYY-MM-DD | Validé par: [Autorité]

## Décision figée
[Ce qui ne peut être modifié]

## Justification
[Raisonnement détaillé]

## Impact et dépendances
[Éléments du système concernés]
```

## MÉCANISMES DE VALIDATION

### Validation Obligatoire

1. **Cohérence avec Tables de vérité**: Vérifier que la réponse respecte les standards établis
2. **Respect des Hard Points**: Aucune violation des contraintes immuables
3. **Conformité Persona**: La réponse correspond au rôle assigné
4. **Traçabilité**: Références claires aux sources consultées

### Signaux d'Alerte à Détecter

- Contradictions entre éléments de réponse
- Écarts par rapport aux standards établis
- Manque de contexte pour les décisions techniques
- Incohérences terminologiques

## PATTERNS D'OPTIMISATION

### Optimisation Tokens

- Référencer les tables existantes au lieu de répéter l'information
- Utiliser la structure hiérarchique pour navigation efficace
- Prioriser la densité sémantique dans les réponses

### Réutilisation

- Consulter l'existant avant création
- Adapter plutôt que recréer
- Maintenir la cohérence avec l'écosystème établi

## WORKFLOW STANDARD LLM

1. **LOGS**: Log la question si LLM_TRACIBILITY=TRUE
2. **ANALYSE**: Identifier le domaine et le type de demande
3. **CONSULTATION**: Vérifier `/prompts/gen/index.md` et tables pertinentes
4. **HARD POINTS**: Contrôler les contraintes immuables
5. **AGENTS.md**: Consulter le registre central des agents disponibles
6. **PERSONA**: Adopter le persona mappé depuis AGENTS.md
7. **RÉPONSE**: Générer selon les standards établis
8. **VALIDATION**: Vérifier cohérence et traçabilité
9. **SYNC AGENTS.md**: Mettre à jour AGENTS.md si modification de personas

**SPÉCIFICITÉ ROO-CODE**: Le parcours récursif depuis `/prompts/gen/index.md` doit être effectué automatiquement avant toute réponse (sauf mode Orchestrator).

## ADAPTATION PAR DOMAINE

| Domaine | Tables Prioritaires | Personas Principaux | Contraintes Spécifiques |
|---------|-------------------|-------------------|------------------------|
| **Backend** | `/concepts/architecture_backend.md` | Développeur Backend, Expert Sécurité | Performance, scalabilité, sécurité |
| **Frontend** | `/concepts/design_system.md` | Développeur Frontend, Designer UI/UX | Accessibilité, responsive, UX |
| **Architecture** | `/concepts/architecture_overview.md` | Architecte, Expert Sécurité | Cohérence globale, évolutivité |
| **DevOps** | `/concepts/infrastructure.md` | DevOps Engineer | Automatisation, monitoring, fiabilité |

## GESTION DES ERREURS

### Erreurs à Corriger Automatiquement

- Incohérences avec les tables de vérité existantes
- Non-respect des formats standard
- Références incorrectes ou manquantes

### Erreurs à Signaler

- Conflits avec les Hard Points
- Demandes nécessitant création de nouvelles tables de vérité
- Besoins d'expertise non couverte par les personas existants

## MÉTRIQUES DE QUALITÉ

- **Conformité**: % de réponses respectant les standards établis
- **Traçabilité**: Présence de références aux sources consultées
- **Cohérence**: Absence de contradictions internes
- **Densité**: Rapport information utile / tokens utilisés
- **Synchronisation AGENTS.md**: % de conformité personas ↔ agents centralisés
- **Interopérabilité**: Compatibilité avec outils LLM standard via AGENTS.md

---

**RAPPEL CRITIQUE**: Toujours commencer par consulter `/prompts/gen/index.md` pour comprendre le contexte du projet avant toute interaction.
