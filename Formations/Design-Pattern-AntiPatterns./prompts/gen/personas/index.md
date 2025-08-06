# Index Personas - Experts Spécialisés
> Version: 1.0 | Date: 2025-01-05 | Statut: Navigation personas

## Vue d'ensemble

Ce répertoire contient les **personas experts** spécialisés dans les Design Patterns, Anti-Patterns et Biais Cognitifs pour le développement **PHP et Java**. Chaque persona est configuré selon les standards ROO-CODE.

## Structure des Personas

### Experts Techniques

#### [`expert_design_patterns.md`](expert_design_patterns.md)
**Expert en Design Patterns PHP/Java**
- **Spécialité** : Maîtrise architecturale et implémentation patterns
- **Domaines** : Patterns GoF, patterns modernes, frameworks
- **Usage** : Conception, architecture, choix de patterns
- **Langages** : Java (Spring, patterns natifs), PHP (Symfony, Laravel)

#### [`expert_anti_patterns.md`](expert_anti_patterns.md)
**Expert en Anti-Patterns et Refactoring**
- **Spécialité** : Détection, analyse et correction des anti-patterns
- **Domaines** : Code smells, dette technique, refactoring
- **Usage** : Audit code, correction problèmes, amélioration qualité
- **Langages** : Java (SpotBugs, PMD), PHP (PHPStan, Psalm)

#### [`expert_psychologie_cognitive.md`](expert_psychologie_cognitive.md)
**Expert en Psychologie Cognitive Appliquée**
- **Spécialité** : Analyse des biais cognitifs et comportements développeurs
- **Domaines** : Biais décisionnels, mécanismes psychologiques
- **Usage** : Analyse causes racines, prévention, formation
- **Application** : Corrélations biais ↔ anti-patterns

### Experts Pédagogiques

#### [`formateur_technique.md`](formateur_technique.md)
**Formateur Technique Spécialisé**
- **Spécialité** : Pédagogie adaptée aux développeurs
- **Domaines** : Animation formations, création contenu
- **Usage** : Formation équipes, workshops, mentoring
- **Approche** : Apprentissage progressif, exemples pratiques

#### [`developpeur_senior.md`](developpeur_senior.md)
**Développeur Senior - Perspective Terrain**
- **Spécialité** : Expérience pratique et retours d'expérience
- **Domaines** : Réalité terrain, contraintes projet
- **Usage** : Validation approches, cas concrets, mentoring
- **Expertise** : 10+ ans PHP/Java, leadership technique

## Configuration ROO-CODE

### Format Standard Persona
Chaque persona suit la structure ROO-CODE :
```markdown
# [Nom du Persona]
> Expertise: [Domaine] | Langages: PHP, Java | Usage: [Contexte]

## Rôle et Responsabilités
[Description du rôle]

## Expertise Technique
[Compétences spécialisées]

## Méthodes de Travail
[Approches et techniques]

## Configuration ROO-CODE
[Paramètres d'intégration]
```

### Intégration Plateforme
- **Modes personnalisés** : Configuration JSON pour chaque persona
- **Prompts spécialisés** : Templates adaptés par expertise
- **Workflows** : Chaînage entre personas selon les besoins
- **Validation** : Critères qualité par domaine d'expertise

## Utilisation par Contexte

### Conception et Architecture
1. **Consulter** [`expert_design_patterns.md`](expert_design_patterns.md) pour choix patterns
2. **Valider** avec [`developpeur_senior.md`](developpeur_senior.md) pour faisabilité
3. **Former** équipe via [`formateur_technique.md`](formateur_technique.md)

### Audit et Refactoring
1. **Analyser** avec [`expert_anti_patterns.md`](expert_anti_patterns.md) pour détection
2. **Comprendre** causes via [`expert_psychologie_cognitive.md`](expert_psychologie_cognitive.md)
3. **Planifier** correction avec [`developpeur_senior.md`](developpeur_senior.md)

### Formation et Prévention
1. **Structurer** contenu avec [`formateur_technique.md`](formateur_technique.md)
2. **Enrichir** exemples via [`expert_design_patterns.md`](expert_design_patterns.md)
3. **Sensibiliser** aux biais via [`expert_psychologie_cognitive.md`](expert_psychologie_cognitive.md)

## Workflows Collaboratifs

### Workflow Audit Qualité
```
Expert Anti-Patterns → Expert Psychologie → Développeur Senior → Formateur
     (Détection)         (Analyse causes)      (Validation)      (Formation)
```

### Workflow Architecture
```
Expert Design Patterns → Développeur Senior → Expert Anti-Patterns → Formateur
     (Conception)           (Validation)        (Prévention)        (Documentation)
```

### Workflow Formation
```
Formateur → Expert Design Patterns → Expert Anti-Patterns → Expert Psychologie
(Structure)    (Contenu patterns)      (Contenu anti-p.)     (Contenu biais)
```

## Interconnexions avec Autres Répertoires

### Depuis Concepts
- [`../concepts/design_patterns.md`](../concepts/design_patterns.md) → Expert Design Patterns
- [`../concepts/anti_patterns.md`](../concepts/anti_patterns.md) → Expert Anti-Patterns
- [`../concepts/biais_cognitifs.md`](../concepts/biais_cognitifs.md) → Expert Psychologie

### Vers Techniques
- Expert Design Patterns → [`../techniques/detection_patterns.md`](../techniques/detection_patterns.md)
- Expert Anti-Patterns → [`../techniques/refactoring_guide.md`](../techniques/refactoring_guide.md)
- Expert Psychologie → [`../techniques/prevention_methods.md`](../techniques/prevention_methods.md)

### Vers Cas d'Usage
- Formateur → [`../use_cases/formation_junior.md`](../use_cases/formation_junior.md)
- Développeur Senior → [`../use_cases/coaching_equipe.md`](../use_cases/coaching_equipe.md)
- Expert Anti-Patterns → [`../use_cases/audit_code.md`](../use_cases/audit_code.md)

## Métriques de Qualité Personas

### Complétude
- [ ] Expert Design Patterns : 0/1 persona opérationnel
- [ ] Expert Anti-Patterns : 0/1 persona opérationnel
- [ ] Expert Psychologie Cognitive : 0/1 persona opérationnel
- [ ] Formateur Technique : 0/1 persona opérationnel
- [ ] Développeur Senior : 0/1 persona opérationnel

### Configuration ROO-CODE
- [ ] Modes personnalisés JSON : 0/5 personas
- [ ] Prompts spécialisés : 0/5 templates
- [ ] Workflows définis : 0/3 chaînages principaux
- [ ] Tests d'intégration : 0/5 personas validés

### Expertise Technique
- [ ] Couverture PHP : 0/5 personas avec exemples
- [ ] Couverture Java : 0/5 personas avec exemples
- [ ] Corrélations biais ↔ anti-patterns : 0/15 mappings
- [ ] Cas d'usage pratiques : 0/20 exemples concrets

## Règles d'Utilisation

### Sélection Persona
1. **Identifier le besoin** : Conception, audit, formation, etc.
2. **Choisir l'expert approprié** selon la spécialité
3. **Consulter la configuration** ROO-CODE correspondante
4. **Appliquer le workflow** recommandé si nécessaire

### Collaboration Multi-Personas
- **Séquencer** les interventions selon la complexité
- **Valider** la cohérence entre recommandations
- **Documenter** les décisions prises
- **Capitaliser** sur les apprentissages

---

**NAVIGATION** : Choisir un persona spécifique ci-dessus, ou retourner à [`../index.md`](../index.md) pour explorer d'autres répertoires.
