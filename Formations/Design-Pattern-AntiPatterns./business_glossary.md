# Glossaire Métier - Formation AI-KIDO
> Version: 1.0 | Date: 2025-01-05 | Statut: Table de Vérité Fondamentale

## Vue d'ensemble

Ce glossaire métier définit la **terminologie unifiée** pour la formation AI-KIDO sur les Design Patterns, Anti-Patterns et Biais Cognitifs, spécialisée pour les environnements **PHP et Java**.

## Définitions clés

### Terminologie Design Patterns

#### Abstract Factory
**Définition** : Pattern créationnel qui fournit une interface pour créer des familles d'objets liés.
- **Synonymes** : Kit, Factory of Factories
- **Contexte PHP** : Implémentation avec interfaces et classes concrètes
- **Contexte Java** : Utilisation avec génériques pour type safety
- **Anti-pattern associé** : Hard-coded Dependencies

#### Adapter
**Définition** : Pattern structurel qui permet à des interfaces incompatibles de collaborer.
- **Synonymes** : Wrapper, Translator
- **Contexte PHP** : Adaptation d'APIs externes, intégration services
- **Contexte Java** : Adaptation de bibliothèques legacy
- **Usage courant** : Intégration de systèmes tiers

#### Builder
**Définition** : Pattern créationnel qui construit des objets complexes étape par étape.
- **Synonymes** : Constructor Pattern
- **Contexte PHP** : Configuration d'objets avec méthodes fluides
- **Contexte Java** : Immutable objects, validation progressive
- **Anti-pattern évité** : Telescoping Constructor

#### Command
**Définition** : Pattern comportemental qui encapsule une requête comme un objet.
- **Synonymes** : Action, Transaction
- **Contexte PHP** : Queues de tâches, undo/redo
- **Contexte Java** : Event handling, macro recording
- **Bénéfices** : Découplage, logging, queuing

#### Composite
**Définition** : Pattern structurel qui compose des objets en structures arborescentes.
- **Synonymes** : Tree Pattern
- **Contexte PHP** : Menus hiérarchiques, structures de données
- **Contexte Java** : GUI components, file systems
- **Principe** : Traitement uniforme des objets individuels et composés

#### Decorator
**Définition** : Pattern structurel qui ajoute des comportements à des objets dynamiquement.
- **Synonymes** : Wrapper, Enhancement
- **Contexte PHP** : Middleware, filtres de données
- **Contexte Java** : I/O streams, caching layers
- **Alternative à** : Héritage statique

#### Factory Method
**Définition** : Pattern créationnel qui délègue la création d'objets aux sous-classes.
- **Synonymes** : Virtual Constructor
- **Contexte PHP** : Création d'objets selon configuration
- **Contexte Java** : Framework extensibility
- **Principe** : Inversion of Control pour la création

#### Observer
**Définition** : Pattern comportemental qui notifie automatiquement les objets dépendants.
- **Synonymes** : Publish-Subscribe, Event Listener
- **Contexte PHP** : Event dispatching, model-view synchronization
- **Contexte Java** : Swing events, reactive programming
- **Anti-pattern évité** : Tight Coupling

#### Singleton
**Définition** : Pattern créationnel qui garantit une seule instance d'une classe.
- **Synonymes** : Single Instance
- **Contexte PHP** : Configuration globale, connexions DB
- **Contexte Java** : Thread-safe implementation requise
- **Controverse** : Considéré comme anti-pattern par certains

#### Strategy
**Définition** : Pattern comportemental qui définit une famille d'algorithmes interchangeables.
- **Synonymes** : Policy Pattern
- **Contexte PHP** : Algorithmes de tri, stratégies de paiement
- **Contexte Java** : Comparators, validation strategies
- **Anti-pattern résolu** : Golden Hammer

### Terminologie Anti-Patterns

#### Big Ball of Mud
**Définition** : Système logiciel dépourvu d'architecture perceptible.
- **Synonymes** : Spaghetti Code (niveau système)
- **Symptômes** : Code entremêlé, responsabilités floues
- **Causes** : Manque de design, pression temporelle
- **Détection** : Métriques de couplage élevées

#### Copy-Paste Programming
**Définition** : Réutilisation de code par duplication plutôt que par abstraction.
- **Synonymes** : Clone and Modify, Shotgun Surgery
- **Symptômes** : Code dupliqué, maintenance difficile
- **Causes** : Paresse, méconnaissance des patterns
- **Solution** : Extract Method, Template Method

#### Dead Code
**Définition** : Code qui n'est jamais exécuté ou utilisé.
- **Synonymes** : Unreachable Code, Zombie Code
- **Symptômes** : Méthodes/classes non référencées
- **Causes** : Refactoring incomplet, évolution du code
- **Détection** : Outils d'analyse statique

#### God Object
**Définition** : Classe qui connaît trop ou fait trop.
- **Synonymes** : Blob, Swiss Army Knife
- **Symptômes** : > 500 lignes, > 20 méthodes publiques
- **Causes** : Violation Single Responsibility Principle
- **Solution** : Extract Class, Facade Pattern

#### Golden Hammer
**Définition** : Utilisation excessive d'une solution familière.
- **Synonymes** : Law of the Instrument
- **Symptômes** : Même technologie pour tous les problèmes
- **Causes** : Biais d'engagement, zone de confort
- **Solution** : Strategy Pattern, formation continue

#### Lava Flow
**Définition** : Code mort ou obsolète qui reste dans le système.
- **Synonymes** : Boat Anchor, Dead Weight
- **Symptômes** : Code commenté, imports inutiles
- **Causes** : Peur de casser, documentation insuffisante
- **Solution** : Refactoring progressif, tests de régression

#### Magic Numbers
**Définition** : Valeurs numériques codées en dur sans explication.
- **Synonymes** : Hard-coded Constants
- **Symptômes** : Nombres sans contexte dans le code
- **Causes** : Développement rapide, manque de documentation
- **Solution** : Named Constants, Configuration Files

#### Premature Optimization
**Définition** : Optimisation prématurée au détriment de la clarté.
- **Synonymes** : Micro-optimization
- **Symptômes** : Code complexe pour gains marginaux
- **Causes** : Perfectionnisme, méconnaissance des bottlenecks
- **Solution** : Profiling, optimisation basée sur les métriques

#### Spaghetti Code
**Définition** : Code avec une structure de contrôle complexe et entremêlée.
- **Synonymes** : Tangled Code
- **Symptômes** : Goto statements, logique imbriquée
- **Causes** : Manque de planification, modifications successives
- **Solution** : Extract Method, State Pattern

#### Tight Coupling
**Définition** : Dépendances fortes entre composants.
- **Synonymes** : High Coupling
- **Symptômes** : Modifications en cascade, tests difficiles
- **Causes** : Manque d'abstraction, design monolithique
- **Solution** : Dependency Injection, Interface Segregation

### Terminologie Biais Cognitifs

#### Biais d'Ancrage
**Définition** : Tendance à se fier excessivement à la première information reçue.
- **Manifestation Dev** : Fixation sur la première solution trouvée
- **Anti-pattern causé** : Premature Optimization, Golden Hammer
- **Prévention** : Brainstorming, alternatives multiples

#### Biais de Confirmation
**Définition** : Tendance à rechercher des informations confirmant ses croyances.
- **Manifestation Dev** : Résistance aux critiques de code
- **Anti-pattern causé** : Lava Flow, résistance au refactoring
- **Prévention** : Code reviews, devil's advocate

#### Biais d'Engagement
**Définition** : Tendance à persister dans une décision initiale.
- **Manifestation Dev** : Refus d'abandonner une approche défaillante
- **Anti-pattern causé** : Golden Hammer, Sunk Cost Fallacy
- **Prévention** : Timeboxing, critères d'abandon

#### Effet Dunning-Kruger
**Définition** : Surestimation de ses compétences par les moins compétents.
- **Manifestation Dev** : Over-engineering, mépris des bonnes pratiques
- **Anti-pattern causé** : God Object, Premature Optimization
- **Prévention** : Mentoring, formation continue

#### Biais de Disponibilité
**Définition** : Surestimation de la probabilité d'événements facilement rappelés.
- **Manifestation Dev** : Focus sur les problèmes récents
- **Anti-pattern causé** : Over-engineering pour cas rares
- **Prévention** : Analyse statistique, priorisation basée sur les données

### Terminologie Technique

#### Couplage (Coupling)
**Définition** : Degré d'interdépendance entre modules logiciels.
- **Types** : Content, Common, External, Control, Stamp, Data
- **Mesure** : Afferent/Efferent Coupling (Ca/Ce)
- **Objectif** : Couplage faible (loose coupling)

#### Cohésion (Cohesion)
**Définition** : Degré de relation entre éléments d'un même module.
- **Types** : Functional, Sequential, Communicational, Procedural, Temporal, Logical, Coincidental
- **Objectif** : Cohésion forte (high cohesion)

#### Complexité Cyclomatique
**Définition** : Métrique de complexité basée sur les chemins d'exécution.
- **Formule** : M = E - N + 2P (E=arêtes, N=nœuds, P=composants)
- **Seuils** : 1-10 (simple), 11-20 (modéré), 21+ (complexe)
- **Outils** : PHPMD, PMD Java

#### Debt Technique
**Définition** : Coût futur du travail supplémentaire causé par des raccourcis.
- **Types** : Code debt, Design debt, Test debt, Documentation debt
- **Mesure** : Temps nécessaire pour corriger
- **Gestion** : Refactoring régulier, allocation de temps

#### Inversion of Control (IoC)
**Définition** : Principe où le contrôle du flux est inversé.
- **Implémentation** : Dependency Injection, Service Locator
- **Bénéfices** : Testabilité, flexibilité, découplage
- **Frameworks** : Symfony DI (PHP), Spring (Java)

#### Refactoring
**Définition** : Amélioration de la structure du code sans changer son comportement.
- **Techniques** : Extract Method, Move Method, Rename Variable
- **Prérequis** : Tests automatisés, version control
- **Outils** : IDE refactoring tools, Rector (PHP)

## Relations et dépendances

### Corrélations Terminologiques

#### Pattern → Anti-pattern → Biais
```
Strategy Pattern ← (résout) ← Golden Hammer ← (causé par) ← Biais d'Engagement
Observer Pattern ← (résout) ← Tight Coupling ← (causé par) ← Biais de Confirmation
Factory Pattern ← (résout) ← Hard-coded Dependencies ← (causé par) ← Biais d'Ancrage
```

#### Métriques → Anti-patterns
```
Complexité Cyclomatique > 10 → God Object, Spaghetti Code
Couplage Afférent > 20 → Tight Coupling
Duplication > 5% → Copy-Paste Programming
Couverture Tests < 80% → Dead Code, Lava Flow
```

### Évolution du Vocabulaire

#### Termes Émergents
- **Microservices Patterns** : Saga, CQRS, Event Sourcing
- **Reactive Patterns** : Circuit Breaker, Bulkhead, Timeout
- **Cloud Patterns** : Retry, Throttling, Cache-Aside

#### Termes Dépréciés
- **Singleton** : Controversé, souvent considéré comme anti-pattern
- **God Class** : Terme plus moderne que "God Object"
- **Code Smell** : Préférer "Anti-pattern" pour plus de précision

## Métriques de Qualité Glossaire

### Complétude
- [ ] Design Patterns : 30+ patterns définis
- [ ] Anti-Patterns : 50+ anti-patterns catalogués
- [ ] Biais Cognitifs : 15+ biais documentés
- [ ] Termes Techniques : 25+ concepts expliqués

### Cohérence
- [ ] Terminologie unifiée : Pas de synonymes contradictoires
- [ ] Contextes PHP/Java : Spécificités pour chaque langage
- [ ] Corrélations : Liens explicites entre concepts
- [ ] Évolution : Mise à jour régulière du vocabulaire

### Utilité
- [ ] Exemples concrets : Chaque terme avec exemple pratique
- [ ] Références croisées : Navigation entre concepts liés
- [ ] Traductions : Équivalents en anglais/français
- [ ] Index : Recherche rapide par terme

---

**VALIDATION** : Ce glossaire métier fournit la terminologie unifiée nécessaire pour assurer la cohérence de communication dans tous les composants de la formation AI-KIDO, avec une spécialisation appropriée pour les environnements PHP et Java.
