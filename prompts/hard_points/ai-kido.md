# AI-KIDO - Guide Pratique pour LLM

> **Version**: 1.2-LLM | **Usage**: Référence directe pour interactions LLM
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

1. **🌳 Arborescence Documentaire**: Parcours d'arbre récursif depuis [`/prompts/gen/index.md`](../gen/index.md)
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
15. **👨‍💼 Répartition par Rôles Humains**: Sous-répertoires assignés aux membres de l'équipe
16. **🤖 Conformité AGENTS.md**: Synchronisation obligatoire avec la norme AGENTS.md
17. **🔄 Bidirectionnalité Agents-Personas**: Correspondance 1:1 entre agents AGENTS.md et personas AI-KIDO

### Règles d'Auto-Alimentation

1. **Signal Utilisateur**: Dès signalement d'erreur → création règle préventive
2. **Auto-Détection**: 2+ erreurs similaires → auto-alimentation proactive
3. **Seuils**: Immédiat (critique), Rapide (majeur 2x), Standard (mineur 3x)
4. **Intégration**: Placement automatique dans répertoire approprié + mise à jour index

### Règles de Capitalisation des Analyses

1. **Génération Obligatoire**: Tous les modes d'analyse DOIVENT générer des fichiers dans les Tables de Vérités
2. **Préférence Modes Productifs**: Privilégier les modes qui créent des fichiers (Code, Architect, Debug) vs mode Ask
3. **Sauvegarde Systématique**: Chaque analyse → fichier dans [`/prompts/gen/`](../gen/) selon le type
4. **Traçabilité**: Horodatage et versioning des analyses sauvegardées
5. **Réutilisation**: Consulter les analyses existantes avant d'en créer de nouvelles

### Règles de Création et Maintenance

1. **Règle de l'Existant**: Toujours vérifier l'existence avant de créer
2. **Règle de la Structure**: Consulter systématiquement l'arborescence [`/prompts/gen/`](../gen/)
3. **Règle de Densité**: Maximiser la pertinence par mot utilisé
4. **Règle d'Enrichissement**: Améliorer continuellement les Tables de vérité
5. **Règle de Cohérence**: Maintenir l'alignement entre tous les éléments
6. **Règle de Traçabilité**: Documenter toutes les décisions importantes

## STRUCTURE OBLIGATOIRE DES RÉPERTOIRES

```
/prompts/
├── gen/                        # Connaissances collectives - TOUJOURS CONSULTER
│   ├── index.md                # Point d'entrée principal
│   ├── concepts/               # Concepts fondamentaux
│   ├── techniques/             # Méthodes pratiques
│   ├── personas/               # Prompts par rôle
│   └── use_cases/              # Applications par contexte
├── hard_points/                # Vérités immuables - PRIORITÉ ABSOLUE
│   ├── index.md                # Point d'entrée des hard points
│   ├── concepts/               # Concepts fondamentaux validés
│   ├── techniques/             # Méthodes pratiques validées
│   └── use_cases/              # cas d'usage validés
└── spec/                       # Espaces personnels - IGNORER sauf activation explicite
    └── logs/                   # Logs des questions
```

**RÈGLE CRITIQUE**: Consulter [`/prompts/gen/index.md`](../gen/index.md) en premier pour tout contexte projet.

### Règles de Répartition par Rôles Humains

1. **Assignation de Responsabilité**: Chaque sous-répertoire DOIT avoir un responsable humain désigné
2. **Cycle de Vie Git**: Les responsables gèrent les MR/PR pour leur domaine
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

**FEATURE_FLIPPING**: Ne Logger les questions que si la fonctionnalité est activée LLM_TRACIBILITY=TRUE dans le fichier [`/prompts/gen/index.md`](../gen/index.md).

**FORMAT LOGS**:

```markdown
# DATE: YYYY-MM-DD HH-MM-SS
## PROMPT [Mode utilisé]
[Question de l'utilisateur]

```

**TRAITEMENT OBLIGATOIRE**:

1. Vérifier que la fonctionnalité LLM_TRACIBILITY=TRUE est activée
2. Créer le fichier [`/prompts/spec/logs/prompts.log`](../spec/logs/prompts.log) si il n'existe pas
3. Logger en fin de fichier la question de l'utilisateur

## RÈGLES DE CONFORMITÉ AGENTS.MD

### Règle 16 : Interface AGENTS.md pour Memory Bank Complète

**PRINCIPE** : Le fichier `AGENTS.md` sert d'**interface standardisée** exposant toute la memory bank AI-KIDO selon la norme LLM, y integrant entre autres les personas.

**ARCHITECTURE PAR LIENS** :
1. **Index externe** : `AGENTS.md` = **miroir** de [`/prompts/gen/index.md`](../gen/index.md) au format norme LLM
2. **Navigation par liens** : Références exclusives vers [`/prompts/gen/`](../gen/) sans duplication de contenu
3. **Synchronisation bidirectionnelle** : Cohérence automatique avec [`/prompts/gen/index.md`](../gen/index.md)
4. **Interface standardisée** : Point d'entrée conforme norme AGENTS.md pour interopérabilité

### Règle 17 : Synchronisation AGENTS.md ↔ /prompts/gen/index.md

**PRINCIPE** : AGENTS.md = **équivalent externe** de [`/prompts/gen/index.md`](../gen/index.md) avec liens vers la memory bank, jamais de recopie de contenu.

**SYNCHRONISATION BIDIRECTIONNELLE** :
1. **Project Context** : **Liens** vers [`/prompts/gen/index.md`](../gen/index.md) et [`/prompts/gen/concepts/architecture-systeme.md`](../gen/concepts/architecture-systeme.md)
2. **Available Agents** : **Références** vers [`/prompts/gen/concepts/`](../gen/concepts/), [`/prompts/gen/techniques/`](../gen/techniques/), [`/prompts/gen/use_cases/`](../gen/use_cases/), [`/prompts/gen/personas/`](../gen/personas/)
3. **Agent Categories** : **Navigation** vers taxonomie AI-KIDO via liens relatifs
4. **Knowledge Base** : **Pointeurs** exclusifs vers fichiers sources, aucune duplication

### Règle 18 : Structure AGENTS.md par Liens

**PRINCIPE** : AGENTS.md = **index externe** avec liens exclusifs vers [`/prompts/gen/`](../gen/), aucune duplication de contenu.

### Structure AGENTS.md par Liens

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
- **Synchronisation index** : Cohérence avec [`/prompts/gen/index.md`](../gen/index.md)
- **Navigation externe** : Interface pour outils LLM vers memory bank AI-KIDO
- **Mise à jour automatique** : Liens mis à jour lors de changements dans [`/prompts/gen/`](../gen/)

## TAXONOMIE DES PERSONAS AI-KIDO

### Organisation Taxonomique Hiérarchique

```
Niveau 1: Catégorie fondamentale
└── Niveau 2: Famille fonctionnelle
    └── Niveau 3: Persona spécifique
        └── Niveau 4: Spécialisation contextuelle
```

#### Niveau 1 : Catégories Fondamentales

- **🏗️ CONCEPTION** : Personas orientés architecture et design
- **⚙️ DÉVELOPPEMENT** : Personas orientés implémentation technique
- **🔒 SÉCURITÉ** : Personas orientés protection et conformité
- **🔍 QUALITÉ** : Personas orientés validation et amélioration
- **🚀 DÉPLOIEMENT** : Personas orientés infrastructure et livraison

#### Niveaux 2-4 : Structure Détaillée

**Niveau 2 - Familles** : Architecture Système, Backend Services, Audit Sécurité, Tests Automatisés, Infrastructure Cloud
**Niveau 3 - Personas** : Architecte Solutions, Développeur API REST, Expert Sécurité Applications, QA Engineer, DevOps Engineer
**Niveau 4 - Contextes** : Domaine Métier (Finance, Santé), Technologie (React, Node.js), Échelle (Startup, Enterprise)

### Règles de Développement des Personas

1. **Héritage Taxonomique** : Chaque persona hérite des caractéristiques de ses niveaux parents
2. **Spécialisation Progressive** : Chaque niveau ajoute des spécificités sans contredire les niveaux supérieurs
3. **Évolution Contrôlée** : Modifications uniquement par versioning avec impact analysis
4. **Documentation** : Tracer toutes les modifications taxonomiques

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

**UTILISATION**: Adapter les personas selon le contexte spécifique du projet. Consulter [`/prompts/gen/personas/`](../gen/personas/) pour les personas définis dans votre contexte.

### Règles de Synchronisation AGENTS.md ↔ AI-KIDO

#### Synchronisation du Contexte Projet
1. **Project Name** : Extrait automatiquement de [`/prompts/gen/index.md`](../gen/index.md)
2. **Domain** : Inféré du contexte métier dans [`/prompts/gen/concepts/`](../gen/concepts/)
3. **Architecture** : Référence [`/prompts/gen/concepts/architecture-systeme.md`](../gen/concepts/architecture-systeme.md)
4. **Tech Stack** : Référence [`/prompts/gen/techniques/stack-technique.md`](../gen/techniques/stack-technique.md)

#### Synchronisation des Agents
1. **Available Agents** : Générés depuis [`/prompts/gen/personas/`](../gen/personas/)
2. **Catégorisation** : Selon taxonomie AI-KIDO (CONCEPTION, DÉVELOPPEMENT, SÉCURITÉ, QUALITÉ, DÉPLOIEMENT)
3. **Spécialisations** : Adaptées au contexte projet détecté
4. **Responsabilités** : Alignées avec spécifications RACI si disponibles

#### Validation de Conformité AGENTS.md

**Validation Structurelle** :
- ✅ Présence des 4 sections obligatoires
- ✅ Format Markdown standard
- ✅ Métadonnées de version présentes
- ✅ Liens vers documentation AI-KIDO

**Validation de Cohérence** :
- ✅ Contexte projet synchronisé avec AI-KIDO
- ✅ Agents mappés avec personas existants
- ✅ Taxonomie AI-KIDO respectée
- ✅ Spécifications RACI alignées

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

### Utilisation Pratique

#### Sélection de Persona

1. **Identifier la catégorie** : Quel type d'activité ?
2. **Préciser la famille** : Quelle fonction spécifique ?
3. **Choisir le persona** : Quel niveau de spécialisation ?
4. **Adapter au contexte** : Quelles contraintes particulières ?

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
3. **CONSULTATION**: Vérifier [`/prompts/gen/index.md`](../gen/index.md) et tables pertinentes
4. **HARD POINTS**: Contrôler les contraintes immuables
5. **AGENTS.md**: Consulter le registre central des agents disponibles
6. **PERSONA**: Adopter le persona mappé depuis AGENTS.md
7. **RÉPONSE**: Générer selon les standards établis
8. **VALIDATION**: Vérifier cohérence et traçabilité
9. **SYNC AGENTS.md**: Mettre à jour AGENTS.md si modification de personas

**SPÉCIFICITÉ ROO-CODE**: Le parcours récursif depuis [`/prompts/gen/index.md`](../gen/index.md) doit être effectué automatiquement avant toute réponse (sauf mode Orchestrator).

## ADAPTATION PAR DOMAINE

| Domaine | Tables Prioritaires | Personas Principaux | Contraintes Spécifiques |
|---------|-------------------|-------------------|------------------------|
| **Backend** | [`/concepts/architecture_backend.md`](../gen/concepts/architecture_backend.md) | Développeur Backend, Expert Sécurité | Performance, scalabilité, sécurité |
| **Frontend** | [`/concepts/design_system.md`](../gen/concepts/design_system.md) | Développeur Frontend, Designer UI/UX | Accessibilité, responsive, UX |
| **Architecture** | [`/concepts/architecture_overview.md`](../gen/concepts/architecture_overview.md) | Architecte, Expert Sécurité | Cohérence globale, évolutivité |
| **DevOps** | [`/concepts/infrastructure.md`](../gen/concepts/infrastructure.md) | DevOps Engineer | Automatisation, monitoring, fiabilité |

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

**RAPPEL CRITIQUE**: Toujours commencer par consulter [`/prompts/gen/index.md`](../gen/index.md) pour comprendre le contexte du projet avant toute interaction.
