# Index Techniques - Méthodes Pratiques
> Version: 1.0 | Date: 2025-01-05 | Statut: Navigation techniques

## Vue d'ensemble

Ce répertoire contient les **méthodes pratiques** pour appliquer concrètement les concepts de Design Patterns, détecter les Anti-Patterns et prévenir les biais cognitifs dans le développement quotidien **PHP et Java**.

## Structure des Techniques

### Méthodes Opérationnelles

#### [`detection_patterns.md`](detection_patterns.md)
**Identification des Patterns dans le Code PHP/Java**
- Techniques d'analyse statique spécialisées
- Outils automatisés de détection par langage
- Métriques et indicateurs qualité
- Checklist de revue de code PHP/Java
- Patterns de reconnaissance visuelle

#### [`refactoring_guide.md`](refactoring_guide.md)
**Guide de Refactoring Anti-Patterns PHP/Java**
- Méthodologie step-by-step pour chaque anti-pattern
- Techniques de refactoring sécurisées par langage
- Stratégies de migration progressive
- Gestion des risques et rollback
- Tests et validation post-refactoring

#### [`prevention_methods.md`](prevention_methods.md)
**Méthodes de Prévention des Biais**
- Techniques de prise de décision structurée
- Processus de revue collaborative
- Outils d'aide à la décision technique
- Formation et sensibilisation équipes
- Métriques de suivi comportemental

## Applications par Contexte

### Développement PHP
- **Frameworks** : Symfony, Laravel patterns et anti-patterns
- **Code Review** : PSR standards et bonnes pratiques
- **Refactoring** : PhpStorm outils intégrés
- **Tests** : PHPUnit pour validation refactoring

### Développement Java
- **Frameworks** : Spring, patterns GoF natifs
- **Code Review** : Checkstyle, PMD, SpotBugs
- **Refactoring** : IntelliJ IDEA, Eclipse outils
- **Tests** : JUnit, Mockito pour validation

### Gestion de Projet
- **Audit Qualité** : Évaluation globale du codebase PHP/Java
- **Formation Équipe** : Montée en compétence ciblée
- **Métriques Projet** : Suivi de la dette technique

## Outils et Technologies

### Outils d'Analyse Statique PHP
- **PHPStan** : Analyse statique avancée PHP
- **Psalm** : Détection erreurs et anti-patterns
- **PHP_CodeSniffer** : Respect standards PSR
- **PHPMD** : Détection code smells PHP

### Outils d'Analyse Statique Java
- **SpotBugs** : Détection bugs et anti-patterns Java
- **PMD** : Analyse qualité code Java
- **Checkstyle** : Respect conventions Java
- **SonarQube** : Plateforme qualité multi-langage

### Outils de Refactoring
- **PhpStorm** : IDE avec refactoring PHP avancé
- **IntelliJ IDEA** : Refactoring automatisé Java
- **Eclipse** : Outils refactoring Java intégrés
- **Rector (PHP)** : Refactoring automatisé PHP

## Exemples Pratiques par Langage

### Java
- **Détection** : SpotBugs, PMD, Checkstyle pour anti-patterns
- **Refactoring** : IntelliJ IDEA, Eclipse avec outils automatisés
- **Prévention** : Architecture Decision Records, code reviews
- **Patterns** : Spring Framework, design patterns GoF natifs

### PHP
- **Détection** : PHPStan, Psalm, PHP_CodeSniffer pour qualité
- **Refactoring** : PhpStorm, outils Symfony/Laravel intégrés
- **Prévention** : PSR standards, Composer pour dépendances
- **Patterns** : Symfony components, Laravel patterns modernes

## Interconnexions avec Autres Répertoires

### Depuis Concepts
- [`../concepts/design_patterns.md`](../concepts/design_patterns.md) → Application pratique PHP/Java
- [`../concepts/anti_patterns.md`](../concepts/anti_patterns.md) → Techniques de correction
- [`../concepts/biais_cognitifs.md`](../concepts/biais_cognitifs.md) → Méthodes de prévention

### Vers Personas
- Techniques → [`../personas/expert_design_patterns.md`](../personas/expert_design_patterns.md) (implémentation)
- Refactoring → [`../personas/expert_anti_patterns.md`](../personas/expert_anti_patterns.md) (correction)
- Prévention → [`../personas/expert_psychologie_cognitive.md`](../personas/expert_psychologie_cognitive.md) (analyse)

### Vers Cas d'Usage
- Formation → [`../use_cases/formation_junior.md`](../use_cases/formation_junior.md) (apprentissage)
- Audit → [`../use_cases/audit_code.md`](../use_cases/audit_code.md) (évaluation)
- Coaching → [`../use_cases/coaching_equipe.md`](../use_cases/coaching_equipe.md) (accompagnement)

## Métriques de Mise en Œuvre

### Détection PHP/Java
- [ ] Couverture outils analyse statique : 0/2 langages (PHP, Java)
- [ ] Règles personnalisées : 0/20 anti-patterns prioritaires
- [ ] Intégration CI/CD : 0/3 pipelines (dev, staging, prod)
- [ ] Métriques qualité : 0/10 indicateurs clés

### Refactoring PHP/Java
- [ ] Guides step-by-step : 0/15 anti-patterns majeurs
- [ ] Stratégies migration : 0/5 approches par langage
- [ ] Tests automatisés : 0/2 frameworks (PHPUnit, JUnit)
- [ ] Rollback procedures : 0/5 scénarios critiques

### Prévention
- [ ] Processus décision : 0/3 frameworks (RACI, ADR, etc.)
- [ ] Formation équipe : 0/4 modules (patterns, anti-patterns, biais, outils)
- [ ] Métriques comportementales : 0/5 indicateurs psychologiques
- [ ] Outils aide décision : 0/3 solutions intégrées

---

**NAVIGATION** : Choisir une technique spécifique ci-dessus, ou retourner à [`../index.md`](../index.md) pour explorer d'autres répertoires.
