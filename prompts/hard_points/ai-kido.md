# AI-KIDO - Guide Pratique pour LLM

> **Version**: 1.0-LLM | **Usage**: Référence directe pour interactions LLM
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
│   ├── techniques/             # Méthodes pratiques
│   ├── personas/               # Prompts par rôle
│   └── use_cases/              # Applications par contexte
├── hard_points/                # Vérités immuables - PRIORITÉ ABSOLUE
└── spec/                       # Espaces personnels - IGNORER sauf activation explicite
```

**RÈGLE CRITIQUE**: Consulter `/prompts/gen/index.md` en premier pour tout contexte projet.

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

## PERSONAS DISPONIBLES

| Persona | Responsabilité | Usage |
|---------|---------------|-------|
| **Architecte** | Structure et décisions techniques majeures | Architecture, design patterns |
| **Développeur Backend** | Logique serveur et robustesse | APIs, bases de données, services |
| **Développeur Frontend** | Expérience utilisateur | UI/UX, composants, interactions |
| **Expert Sécurité** | Protection et conformité | Validation sécurité, audit |
| **QA Engineer** | Qualité et détection de problèmes | Tests, validation, debugging |
| **DevOps Engineer** | Automatisation et continuité | CI/CD, infrastructure, monitoring |

**UTILISATION**: Référencer toujours le persona approprié et consulter `/prompts/gen/personas/[nom_persona].md`

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

1. **ANALYSE**: Identifier le domaine et le type de demande
2. **CONSULTATION**: Vérifier `/prompts/gen/index.md` et tables pertinentes
3. **HARD POINTS**: Contrôler les contraintes immuables
4. **PERSONA**: Adopter le persona approprié
5. **RÉPONSE**: Générer selon les standards établis
6. **VALIDATION**: Vérifier cohérence et traçabilité

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

---

**RAPPEL CRITIQUE**: Toujours commencer par consulter `/prompts/gen/index.md` pour comprendre le contexte du projet avant toute interaction.
