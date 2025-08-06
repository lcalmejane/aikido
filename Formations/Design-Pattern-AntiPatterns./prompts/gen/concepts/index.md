# Index Concepts - Fondements Théoriques
> Version: 1.0 | Date: 2025-01-05 | Statut: Navigation concepts

## Vue d'ensemble

Ce répertoire contient les **fondements théoriques** de la formation AI-KIDO sur les Design Patterns, Anti-Patterns et Biais Cognitifs. Chaque concept est structuré selon le format standard des Tables de Vérité AI-KIDO.

## Structure des Concepts

### Concepts Fondamentaux

#### [`design_patterns.md`](design_patterns.md)
**Catalogue exhaustif des Design Patterns** ✅ **COMPLÉTÉ**
- **30+ patterns documentés** : GoF complets + patterns modernes
- **Exemples PHP et Java** : Code production-ready avec tests
- **Classifications détaillées** : Créationnels, Structurels, Comportementaux, Architecturaux
- **Cas d'usage pratiques** : Applications concrètes et contextes d'utilisation
- **Évolutions contemporaines** : Microservices, Reactive, Cloud patterns

#### [`anti_patterns.md`](anti_patterns.md)
**Catalogue des Anti-Patterns** ✅ **COMPLÉTÉ**
- **20+ anti-patterns majeurs** : Architecturaux, Développement, Performance, Sécurité
- **Symptômes et détection** : Indicateurs mesurables et métriques d'alerte
- **Solutions de refactoring** : Transformations structurées vers design patterns
- **Exemples concrets** : Code problématique et solutions complètes en PHP/Java
- **Outils de prévention** : Processus et bonnes pratiques

#### [`biais_cognitifs.md`](biais_cognitifs.md)
**Analyse scientifique des Biais Cognitifs** ✅ **COMPLÉTÉ**
- **9 biais majeurs documentés** : Bases neurobiologiques et mécanismes
- **Manifestations techniques** : Impact concret sur le développement logiciel
- **Exemples de code** : Cas réels avec solutions de correction
- **Corrélations établies** : Liens directs avec les anti-patterns
- **Techniques de mesure** : Détection et validation des corrections

#### [`correlations.md`](correlations.md)
**Matrice complète Biais ↔ Anti-Patterns ↔ Design Patterns** ✅ **COMPLÉTÉ**
- **27 corrélations directes** : Mappings scientifiquement établis
- **Mécanismes psychologiques** : Processus cognitifs et solutions techniques
- **Métriques de validation** : Indicateurs d'efficacité des corrections
- **Applications pratiques** : Cas d'intervention et outils de mesure
- **Cascade d'effets** : Chaînes causales et solutions progressives

## Navigation Recommandée

### Parcours Débutant
1. **Commencer par** [`design_patterns.md`](design_patterns.md) - Acquérir les bonnes pratiques
2. **Puis** [`anti_patterns.md`](anti_patterns.md) - Identifier les pièges à éviter
3. **Ensuite** [`biais_cognitifs.md`](biais_cognitifs.md) - Comprendre les causes psychologiques
4. **Terminer par** [`correlations.md`](correlations.md) - Établir les connexions

### Parcours Expert
1. **Directement** [`correlations.md`](correlations.md) - Vue d'ensemble des relations
2. **Approfondir selon besoin** les concepts spécifiques
3. **Utiliser comme référence** pour analyses de cas

### Parcours Formateur
1. **Étudier** [`correlations.md`](correlations.md) - Comprendre la pédagogie
2. **Maîtriser** tous les concepts pour questions/réponses
3. **Préparer exemples** depuis chaque fichier concept

## Interconnexions avec Autres Répertoires

### Vers Techniques
- Concepts → [`../techniques/detection_patterns.md`](../techniques/detection_patterns.md)
- Anti-patterns → [`../techniques/refactoring_guide.md`](../techniques/refactoring_guide.md)
- Biais → [`../techniques/prevention_methods.md`](../techniques/prevention_methods.md)

### Vers Personas
- Design Patterns → [`../personas/expert_design_patterns.md`](../personas/expert_design_patterns.md)
- Anti-Patterns → [`../personas/expert_anti_patterns.md`](../personas/expert_anti_patterns.md)
- Biais Cognitifs → [`../personas/expert_psychologie_cognitive.md`](../personas/expert_psychologie_cognitive.md)

### Vers Cas d'Usage
- Formation → [`../use_cases/formation_junior.md`](../use_cases/formation_junior.md)
- Audit → [`../use_cases/audit_code.md`](../use_cases/audit_code.md)
- Coaching → [`../use_cases/coaching_equipe.md`](../use_cases/coaching_equipe.md)

## Métriques de Complétude

### Design Patterns
- [ ] Creational Patterns (5/5) : Factory, Builder, Singleton, Prototype, Abstract Factory
- [ ] Structural Patterns (7/7) : Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy
- [ ] Behavioral Patterns (11/11) : Observer, Strategy, Command, State, Template Method, etc.
- [ ] Modern Patterns (10+) : MVC, MVP, MVVM, Repository, Unit of Work, etc.

### Anti-Patterns
- [ ] Architectural (15+) : Big Ball of Mud, Spaghetti Code, Lava Flow, etc.
- [ ] Development (20+) : Copy-Paste, Golden Hammer, Premature Optimization, etc.
- [ ] Organizational (15+) : Death March, Analysis Paralysis, Feature Creep, etc.

### Biais Cognitifs
- [ ] Biais de décision (8+) : Ancrage, Confirmation, Disponibilité, etc.
- [ ] Biais sociaux (5+) : Conformité, Autorité, Groupthink, etc.
- [ ] Biais temporels (3+) : Procrastination, Planning Fallacy, etc.

### Corrélations
- [ ] Mappings 1:1 (15+) : Un biais → Un anti-pattern principal
- [ ] Mappings 1:N (10+) : Un biais → Plusieurs anti-patterns
- [ ] Chaînes causales (5+) : Séquences biais → anti-pattern → conséquences

## Règles de Maintenance

### Mise à Jour Sources
- **Veille refactoring.guru** : Nouveaux patterns ajoutés
- **Veille académique** : Nouvelles recherches sur anti-patterns
- **Veille psychologie** : Évolution compréhension biais cognitifs

### Validation Croisée
- **Cohérence interne** : Pas de contradictions entre fichiers
- **Exemples alignés** : Code cohérent entre concepts et techniques
- **Références exactes** : Liens internes fonctionnels

### Enrichissement Continu
- **Feedback utilisateurs** : Concepts manquants ou mal expliqués
- **Nouveaux exemples** : Langages et frameworks émergents
- **Cas d'étude** : Situations réelles d'entreprise

---

**NAVIGATION** : Choisir un concept spécifique ci-dessus, ou retourner à [`../index.md`](../index.md) pour explorer d'autres répertoires.
