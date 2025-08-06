# Modèle de Domaine - Formation Design Patterns & Anti-Patterns
> Version: 1.0 | Date: 2025-01-05 | Statut: Table de Vérité Fondamentale

## Vue d'ensemble

Ce modèle de domaine définit les **concepts fondamentaux** et leurs **relations** pour la formation AI-KIDO sur les Design Patterns, Anti-Patterns et Biais Cognitifs appliqués au développement **PHP et Java**.

## Définitions clés

### Entités Principales

#### Design Pattern
**Définition** : Solution éprouvée et réutilisable à un problème récurrent de conception logicielle.
- **Attributs** : Nom, Intention, Structure, Participants, Collaborations, Conséquences
- **Catégories** : Créationnel, Structurel, Comportemental
- **Langages** : Implémentation PHP et Java spécifique

#### Anti-Pattern
**Définition** : Solution couramment utilisée mais inefficace ou contre-productive à un problème récurrent.
- **Attributs** : Nom, Symptômes, Causes, Conséquences, Solutions
- **Catégories** : Architectural, Développement, Organisationnel
- **Détection** : Métriques et indicateurs spécifiques

#### Biais Cognitif
**Définition** : Déviation systématique de la rationalité dans le jugement et la prise de décision.
- **Attributs** : Nom, Mécanisme, Manifestations, Contextes
- **Catégories** : Décisionnel, Social, Temporel
- **Impact** : Influence sur les choix techniques

### Relations Fondamentales

#### Corrélation Biais → Anti-Pattern
**Nature** : Relation causale où un biais cognitif favorise l'émergence d'un anti-pattern.
- **Cardinalité** : 1:N (un biais peut causer plusieurs anti-patterns)
- **Exemples** :
  - Biais d'engagement → Golden Hammer
  - Biais de confirmation → Résistance au refactoring
  - Effet Dunning-Kruger → Over-engineering

#### Solution Pattern → Anti-Pattern
**Nature** : Relation de résolution où un design pattern corrige un anti-pattern.
- **Cardinalité** : N:M (plusieurs patterns peuvent résoudre un anti-pattern)
- **Exemples** :
  - Strategy Pattern → Évite Golden Hammer
  - Factory Pattern → Corrige Hard-coded Dependencies
  - Observer Pattern → Résout Tight Coupling

## Principes directeurs

### Principe de Complétude
- **Couverture exhaustive** : Tous les patterns GoF + patterns modernes
- **Anti-patterns majeurs** : Focus sur les plus impactants
- **Biais critiques** : Ceux ayant le plus d'impact sur la qualité code

### Principe de Cohérence
- **Terminologie unifiée** : Vocabulaire standardisé
- **Classifications alignées** : Catégories cohérentes entre domaines
- **Exemples harmonisés** : Style de code uniforme PHP/Java

### Principe de Traçabilité
- **Sources référencées** : refactoring.guru, littérature académique
- **Évolutions documentées** : Historique des modifications
- **Validations expertes** : Revue par personas spécialisés

## Spécifications techniques

### Structure des Données

#### Design Pattern
```
Pattern {
  id: String (unique)
  nom: String
  categorie: Enum(Creational, Structural, Behavioral)
  intention: String
  probleme: String
  solution: String
  structure_uml: String
  exemples: {
    php: CodeExample
    java: CodeExample
  }
  relations: [PatternId]
  anti_patterns_resolus: [AntiPatternId]
}
```

#### Anti-Pattern
```
AntiPattern {
  id: String (unique)
  nom: String
  categorie: Enum(Architectural, Development, Organizational)
  symptomes: [String]
  causes: [String]
  consequences: [String]
  detection_metrics: [Metric]
  solutions: [PatternId]
  biais_associes: [BiaisId]
  exemples_code: {
    php: CodeExample
    java: CodeExample
  }
}
```

#### Biais Cognitif
```
BiasCognitif {
  id: String (unique)
  nom: String
  categorie: Enum(Decisionnel, Social, Temporel)
  definition: String
  mecanisme: String
  manifestations: [String]
  contextes_dev: [String]
  anti_patterns_causes: [AntiPatternId]
  strategies_prevention: [String]
}
```

### Contraintes d'Intégrité

#### Contraintes Référentielles
- Chaque Pattern.anti_patterns_resolus doit exister dans AntiPattern
- Chaque AntiPattern.solutions doit exister dans Pattern
- Chaque AntiPattern.biais_associes doit exister dans BiasCognitif

#### Contraintes Métier
- Un Pattern doit avoir au moins un exemple PHP ou Java
- Un AntiPattern doit avoir au moins un biais associé
- Un BiasCognitif doit causer au moins un anti-pattern

## Exemples d'application

### Exemple Complet : Golden Hammer

#### Design Pattern (Solution)
```
Strategy Pattern {
  intention: "Définir une famille d'algorithmes interchangeables"
  probleme: "Éviter le couplage fort avec un algorithme spécifique"
  exemple_java: "interface PaymentStrategy { void pay(double amount); }"
  exemple_php: "interface PaymentStrategy { public function pay(float $amount); }"
}
```

#### Anti-Pattern (Problème)
```
Golden Hammer {
  symptomes: ["Même solution technique pour tous les problèmes"]
  causes: ["Maîtrise limitée d'outils", "Résistance à l'apprentissage"]
  detection: ["Complexité cyclomatique élevée", "Couplage fort"]
  solution: "Strategy Pattern, Factory Pattern"
}
```

#### Biais Cognitif (Cause Racine)
```
Biais d'Engagement {
  mecanisme: "Tendance à persister dans une décision initiale"
  manifestation: "Réutilisation excessive d'une technologie maîtrisée"
  prevention: "Code reviews, formation continue, rotation équipes"
}
```

### Exemple Corrélation : Biais Confirmation → Résistance Refactoring

#### Chaîne Causale
```
Biais de Confirmation 
  → Résistance aux critiques du code
  → Évitement du refactoring
  → Accumulation de dette technique
  → Anti-patterns multiples (Spaghetti Code, God Object)
```

#### Solutions Préventives
```
- Code reviews obligatoires
- Métriques qualité automatisées
- Formation aux biais cognitifs
- Culture d'amélioration continue
```

## Relations et dépendances

### Dépendances Externes
- **refactoring.guru** : Source principale pour design patterns
- **Wikipedia Anti-patterns** : Référence pour anti-patterns
- **Littérature psychologie cognitive** : Recherche sur biais

### Interconnexions Internes
- **Concepts** ↔ **Techniques** : Application pratique des modèles
- **Personas** ↔ **Domaine** : Expertise spécialisée par entité
- **Cas d'usage** ↔ **Domaine** : Contextes d'application

### Évolution du Modèle
- **Enrichissement continu** : Nouveaux patterns, anti-patterns, biais
- **Validation empirique** : Retours d'expérience terrain
- **Adaptation technologique** : Évolution PHP/Java et frameworks

## Métriques de Qualité

### Complétude du Modèle
- [ ] Design Patterns : 0/30+ patterns documentés
- [ ] Anti-Patterns : 0/50+ anti-patterns catalogués
- [ ] Biais Cognitifs : 0/15+ biais corrélés
- [ ] Relations : 0/100+ corrélations établies

### Cohérence des Données
- [ ] Intégrité référentielle : 100% des relations valides
- [ ] Exemples code : 100% patterns avec exemples PHP/Java
- [ ] Classifications : Catégories cohérentes et exhaustives
- [ ] Terminologie : Glossaire unifié et respecté

### Utilité Pratique
- [ ] Cas d'usage couverts : Formation, Audit, Coaching
- [ ] Personas supportés : 5 experts spécialisés
- [ ] Techniques applicables : Détection, Refactoring, Prévention
- [ ] Langages supportés : PHP et Java complets

---

**VALIDATION** : Ce modèle de domaine respecte les Hard Points établis et fournit la base conceptuelle pour tous les autres composants du système AI-KIDO.
