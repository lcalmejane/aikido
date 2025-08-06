# Index Cas d'Usage - Applications Contextuelles
> Version: 1.0 | Date: 2025-01-05 | Statut: Navigation cas d'usage

## Vue d'ensemble

Ce répertoire contient les **applications contextuelles** de la formation AI-KIDO, adaptées aux différents profils d'utilisateurs et situations de développement **PHP et Java**.

## Structure des Cas d'Usage

### Parcours de Formation

#### [`formation_junior.md`](formation_junior.md)
**Parcours Développeurs Junior (1-3 ans)**
- **Objectif** : Acquisition des bonnes pratiques dès le début
- **Approche** : Apprentissage progressif et prévention des anti-patterns
- **Contenu** : Patterns fondamentaux, détection précoce des biais
- **Langages** : Exemples PHP et Java adaptés au niveau

#### [`formation_senior.md`](formation_senior.md)
**Parcours Développeurs Senior (3-8 ans)**
- **Objectif** : Perfectionnement et leadership technique
- **Approche** : Maîtrise avancée et transmission des bonnes pratiques
- **Contenu** : Patterns complexes, refactoring, coaching équipe
- **Langages** : Architectures avancées PHP/Java, frameworks

### Applications Opérationnelles

#### [`audit_code.md`](audit_code.md)
**Audit Qualité Code PHP/Java**
- **Objectif** : Évaluation globale de la qualité du codebase
- **Approche** : Méthodologie systématique de détection et analyse
- **Contenu** : Grilles d'audit, métriques, plans d'amélioration
- **Outils** : PHPStan/Psalm (PHP), SpotBugs/PMD (Java)

#### [`coaching_equipe.md`](coaching_equipe.md)
**Accompagnement et Coaching Équipes**
- **Objectif** : Amélioration collective des pratiques de développement
- **Approche** : Formation continue et culture qualité
- **Contenu** : Workshops, code reviews, mentoring
- **Focus** : Prévention des biais cognitifs en équipe

## Applications par Profil Utilisateur

### Développeurs Junior
**Parcours recommandé :**
1. **Formation de base** → [`formation_junior.md`](formation_junior.md)
2. **Pratique encadrée** → [`coaching_equipe.md`](coaching_equipe.md)
3. **Validation acquis** → Participation aux audits

**Personas associés :**
- [`../personas/formateur_technique.md`](../personas/formateur_technique.md) (apprentissage)
- [`../personas/developpeur_senior.md`](../personas/developpeur_senior.md) (mentoring)

### Développeurs Senior
**Parcours recommandé :**
1. **Perfectionnement** → [`formation_senior.md`](formation_senior.md)
2. **Leadership** → [`coaching_equipe.md`](coaching_equipe.md)
3. **Expertise** → [`audit_code.md`](audit_code.md)

**Personas associés :**
- [`../personas/expert_design_patterns.md`](../personas/expert_design_patterns.md) (architecture)
- [`../personas/expert_anti_patterns.md`](../personas/expert_anti_patterns.md) (audit)

### Architectes et Tech Leads
**Parcours recommandé :**
1. **Vision système** → [`audit_code.md`](audit_code.md)
2. **Formation équipe** → [`coaching_equipe.md`](coaching_equipe.md)
3. **Amélioration continue** → Tous les cas d'usage

**Personas associés :**
- Tous les personas selon le contexte
- Focus sur [`../personas/expert_psychologie_cognitive.md`](../personas/expert_psychologie_cognitive.md)

## Workflows par Situation

### Nouveau Projet PHP/Java
```
1. Formation équipe → coaching_equipe.md
2. Standards qualité → audit_code.md (prévention)
3. Montée en compétence → formation_junior.md ou formation_senior.md
```

### Projet Legacy à Refactorer
```
1. Audit initial → audit_code.md
2. Plan formation → formation_senior.md (refactoring)
3. Accompagnement → coaching_equipe.md
```

### Onboarding Développeur
```
1. Évaluation niveau → formation_junior.md ou formation_senior.md
2. Intégration équipe → coaching_equipe.md
3. Validation compétences → audit_code.md (participation)
```

## Interconnexions avec Autres Répertoires

### Depuis Concepts
- [`../concepts/design_patterns.md`](../concepts/design_patterns.md) → Applications dans tous les cas d'usage
- [`../concepts/anti_patterns.md`](../concepts/anti_patterns.md) → Focus audit et formation
- [`../concepts/biais_cognitifs.md`](../concepts/biais_cognitifs.md) → Prévention dans coaching

### Depuis Techniques
- [`../techniques/detection_patterns.md`](../techniques/detection_patterns.md) → Audit et formations
- [`../techniques/refactoring_guide.md`](../techniques/refactoring_guide.md) → Formation senior et audit
- [`../techniques/prevention_methods.md`](../techniques/prevention_methods.md) → Coaching équipe

### Depuis Personas
- Formateur → Formation junior/senior
- Expert Design Patterns → Tous les cas d'usage
- Expert Anti-Patterns → Audit et refactoring
- Expert Psychologie → Coaching et prévention
- Développeur Senior → Mentoring et validation

## Métriques de Succès par Cas d'Usage

### Formation Junior
- [ ] Modules progressifs : 0/8 étapes définies
- [ ] Exemples PHP/Java : 0/20 patterns de base
- [ ] Exercices pratiques : 0/15 TP guidés
- [ ] Évaluation compétences : 0/5 critères

### Formation Senior
- [ ] Modules avancés : 0/6 domaines d'expertise
- [ ] Cas complexes PHP/Java : 0/10 architectures
- [ ] Leadership technique : 0/5 compétences
- [ ] Transmission savoir : 0/3 méthodes

### Audit Code
- [ ] Grilles d'évaluation : 0/3 niveaux (critique, majeur, mineur)
- [ ] Outils automatisés : 0/4 (PHPStan, Psalm, SpotBugs, PMD)
- [ ] Métriques qualité : 0/10 indicateurs
- [ ] Plans d'action : 0/5 templates

### Coaching Équipe
- [ ] Formats d'intervention : 0/4 (workshop, code review, mentoring, formation)
- [ ] Outils collaboration : 0/3 (pair programming, mob programming, ADR)
- [ ] Métriques équipe : 0/5 indicateurs comportementaux
- [ ] Suivi progrès : 0/3 méthodes d'évaluation

## Adaptations par Contexte Entreprise

### Startup/PME
- **Focus** : Formation rapide, patterns essentiels
- **Approche** : Pragmatique, ROI immédiat
- **Outils** : Solutions légères, intégration simple

### Grande Entreprise
- **Focus** : Gouvernance, standards, audit
- **Approche** : Méthodique, processus formalisés
- **Outils** : Plateformes complètes, métriques avancées

### Équipe Distribuée
- **Focus** : Collaboration, documentation, async
- **Approche** : Outils numériques, formation à distance
- **Outils** : Plateformes collaboratives, code review

## Planning Type par Cas d'Usage

### Formation Junior (8 semaines)
- Semaines 1-2 : Concepts fondamentaux
- Semaines 3-4 : Patterns de base PHP/Java
- Semaines 5-6 : Anti-patterns courants
- Semaines 7-8 : Projet pratique encadré

### Formation Senior (6 semaines)
- Semaines 1-2 : Patterns avancés et architectures
- Semaines 3-4 : Refactoring et dette technique
- Semaines 5-6 : Leadership et coaching

### Audit Code (4 semaines)
- Semaine 1 : Analyse automatisée
- Semaine 2 : Revue manuelle experte
- Semaine 3 : Analyse des causes (biais)
- Semaine 4 : Plan d'amélioration

### Coaching Équipe (Continu)
- Mensuel : Workshops thématiques
- Hebdomadaire : Code reviews structurées
- Quotidien : Pair programming ciblé

---

**NAVIGATION** : Choisir un cas d'usage spécifique ci-dessus, ou retourner à [`../index.md`](../index.md) pour explorer d'autres répertoires.
