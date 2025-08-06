# Architecture Système - Formation AI-KIDO
> Version: 1.0 | Date: 2025-01-05 | Statut: Table de Vérité Fondamentale

## Vue d'ensemble

Cette architecture système définit l'**organisation technique** et les **flux de données** pour la formation AI-KIDO sur les Design Patterns, Anti-Patterns et Biais Cognitifs, optimisée pour **PHP et Java**.

## Définitions clés

### Composants Architecturaux

#### Couche Présentation
**Responsabilité** : Interface utilisateur et interactions personas ROO-CODE
- **Technologies** : Markdown, interfaces ROO-CODE
- **Composants** : Index navigation, prompts spécialisés, workflows
- **Utilisateurs** : Développeurs, formateurs, architectes

#### Couche Logique Métier
**Responsabilité** : Traitement des concepts et corrélations
- **Technologies** : Tables de vérité AI-KIDO, personas experts
- **Composants** : Moteur de corrélations, analyseur de patterns, détecteur anti-patterns
- **Données** : Design patterns, anti-patterns, biais cognitifs

#### Couche Données
**Responsabilité** : Stockage et gestion des connaissances
- **Technologies** : Fichiers Markdown structurés, références externes
- **Composants** : Catalogues patterns, bases anti-patterns, cartographie biais
- **Sources** : refactoring.guru, Wikipedia, littérature académique

### Flux de Données

#### Flux d'Apprentissage
```
Utilisateur → Index Navigation → Concepts → Techniques → Application
    ↓              ↓              ↓           ↓           ↓
Persona     → Tables Vérité → Exemples → Exercices → Validation
```

#### Flux d'Audit
```
Code Source → Détection Patterns → Analyse Biais → Recommandations → Plan Action
     ↓             ↓                    ↓              ↓              ↓
Métriques → Anti-patterns → Causes Racines → Solutions → Refactoring
```

## Principes directeurs

### Principe de Modularité
- **Séparation des préoccupations** : Concepts, techniques, personas, cas d'usage
- **Couplage faible** : Interfaces claires entre composants
- **Cohésion forte** : Responsabilités bien définies par module

### Principe de Scalabilité
- **Extensibilité** : Ajout facile de nouveaux patterns/anti-patterns
- **Performance** : Navigation rapide dans la hiérarchie
- **Maintenance** : Mise à jour indépendante des composants

### Principe d'Interopérabilité
- **Standards ROO-CODE** : Compatibilité native avec la plateforme
- **Formats ouverts** : Markdown, JSON pour configurations
- **APIs claires** : Interfaces bien définies entre personas

## Spécifications techniques

### Architecture Logique

#### Diagramme de Composants
```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Navigation    │    Personas     │      Workflows         │
│   (Index MD)    │   (ROO-CODE)    │    (Cas d'usage)       │
└─────────────────┴─────────────────┴─────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   COUCHE LOGIQUE MÉTIER                     │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Moteur        │   Analyseur     │    Détecteur           │
│ Corrélations    │   Patterns      │   Anti-patterns        │
└─────────────────┴─────────────────┴─────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     COUCHE DONNÉES                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Catalogue     │   Base          │   Cartographie         │
│   Patterns      │ Anti-patterns   │     Biais              │
└─────────────────┴─────────────────┴─────────────────────────┘
```

#### Modèle de Données
```
/prompts/gen/
├── concepts/           # Données métier
│   ├── design_patterns.md
│   ├── anti_patterns.md
│   ├── biais_cognitifs.md
│   └── correlations.md
├── techniques/         # Logique applicative
│   ├── detection_patterns.md
│   ├── refactoring_guide.md
│   └── prevention_methods.md
├── personas/          # Couche présentation
│   ├── expert_design_patterns.md
│   ├── expert_anti_patterns.md
│   └── expert_psychologie_cognitive.md
└── use_cases/         # Orchestration
    ├── formation_junior.md
    ├── formation_senior.md
    ├── audit_code.md
    └── coaching_equipe.md
```

### Architecture Technique

#### Stack Technologique
- **Langages Cibles** : PHP, Java (contrainte projet)
- **Format Données** : Markdown avec métadonnées YAML
- **Plateforme** : ROO-CODE pour déploiement personas
- **Outils** : PHPStan/Psalm (PHP), SpotBugs/PMD (Java)

#### Intégrations Externes
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ refactoring.guru│    │   Wikipedia     │    │  ROO-CODE       │
│   (Patterns)    │    │ (Anti-patterns) │    │  (Platform)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │   Extraction    │    │   Validation    │    │   Déploiement   │
         │   Automatisée   │    │    Experte      │    │    Personas     │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Exemples d'application

### Exemple Workflow : Formation Développeur Junior

#### Séquence d'Interactions
```
1. Utilisateur → prompts/gen/index.md
2. Navigation → prompts/gen/use_cases/formation_junior.md
3. Activation → prompts/gen/personas/formateur_technique.md
4. Contenu → prompts/gen/concepts/design_patterns.md
5. Pratique → prompts/gen/techniques/detection_patterns.md
6. Validation → Exercices PHP/Java
```

#### Flux de Données
```
Besoin Formation
    ↓
Sélection Parcours (Junior)
    ↓
Activation Persona (Formateur)
    ↓
Chargement Contenu (Patterns de base)
    ↓
Application Techniques (Détection)
    ↓
Validation Acquis (Exemples PHP/Java)
```

### Exemple Workflow : Audit Code Legacy

#### Séquence d'Interactions
```
1. Utilisateur → prompts/gen/use_cases/audit_code.md
2. Activation → prompts/gen/personas/expert_anti_patterns.md
3. Analyse → prompts/gen/techniques/detection_patterns.md
4. Diagnostic → prompts/gen/concepts/correlations.md
5. Solutions → prompts/gen/concepts/design_patterns.md
6. Plan → prompts/gen/techniques/refactoring_guide.md
```

#### Flux de Données
```
Code Legacy
    ↓
Détection Anti-patterns (Outils automatisés)
    ↓
Analyse Biais Cognitifs (Causes racines)
    ↓
Corrélations Biais → Anti-patterns
    ↓
Recommandations Patterns (Solutions)
    ↓
Plan Refactoring (Actions concrètes)
```

## Relations et dépendances

### Dépendances Techniques

#### Dépendances Externes
- **ROO-CODE Platform** : Déploiement et exécution personas
- **Sources Web** : refactoring.guru, Wikipedia pour contenu
- **Outils Analyse** : PHPStan, Psalm, SpotBugs, PMD

#### Dépendances Internes
- **Hard Points** : Contraintes immuables du système
- **Domain Model** : Modèle conceptuel de base
- **Tech Stack** : Spécifications techniques PHP/Java

### Interfaces et Contrats

#### Interface Persona ↔ ROO-CODE
```json
{
  "persona_id": "expert_design_patterns",
  "expertise": ["patterns", "architecture", "php", "java"],
  "input_schema": {
    "context": "string",
    "language": "enum[php,java]",
    "complexity": "enum[basic,intermediate,advanced]"
  },
  "output_format": "markdown_with_examples"
}
```

#### Interface Concepts ↔ Techniques
```markdown
# Concept: Strategy Pattern
→ Technique: detection_patterns.md#strategy-detection
→ Technique: refactoring_guide.md#implement-strategy
→ Use Case: formation_senior.md#advanced-patterns
```

### Évolutivité et Maintenance

#### Points d'Extension
- **Nouveaux Patterns** : Ajout dans concepts/design_patterns.md
- **Nouveaux Anti-patterns** : Extension anti_patterns.md
- **Nouveaux Biais** : Enrichissement biais_cognitifs.md
- **Nouveaux Langages** : Extension stack technique (si contraintes évoluent)

#### Stratégies de Mise à Jour
- **Veille Automatisée** : Monitoring sources externes
- **Validation Experte** : Revue par personas spécialisés
- **Tests de Régression** : Validation cohérence après modifications
- **Versioning** : Gestion des évolutions majeures

## Métriques de Performance

### Métriques Techniques
- **Temps de Navigation** : < 2s entre index et contenu
- **Cohérence Liens** : 100% liens internes fonctionnels
- **Complétude Exemples** : 100% concepts avec exemples PHP/Java
- **Intégrité Références** : 100% corrélations valides

### Métriques Qualité
- **Couverture Patterns** : 30+ patterns documentés
- **Couverture Anti-patterns** : 50+ anti-patterns catalogués
- **Corrélations Biais** : 15+ biais corrélés
- **Personas Opérationnels** : 5 experts configurés ROO-CODE

### Métriques Utilisation
- **Parcours Complets** : Taux de completion par cas d'usage
- **Satisfaction Utilisateur** : Feedback sur pertinence contenu
- **Adoption Personas** : Fréquence utilisation par expert
- **Efficacité Formation** : Amélioration compétences mesurée

---

**VALIDATION** : Cette architecture système respecte les contraintes PHP/Java et assure l'intégration optimale avec la plateforme ROO-CODE tout en maintenant la flexibilité nécessaire pour l'évolution du contenu de formation.
