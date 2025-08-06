# Index Principal - Formation Design Patterns & Anti-Patterns AI-KIDO
> Version: 1.0 | Date: 2025-01-05 | Statut: Point d'entrée principal

## Vue d'ensemble du Projet

Ce système AI-KIDO est dédié à la **Formation sur les Design Patterns, Anti-Patterns et Biais Cognitifs** appliqués au développement logiciel. Il établit les connexions critiques entre psychologie cognitive et qualité technique.

## Architecture des Connaissances

### Structure Hiérarchique
```
/prompts/gen/
├── index.md                    # Point d'entrée (ce fichier)
├── concepts/                   # Fondements théoriques
│   ├── index.md               # Navigation concepts
│   ├── design_patterns.md     # Catalogue patterns
│   ├── anti_patterns.md       # Catalogue anti-patterns
│   ├── biais_cognitifs.md     # Cartographie biais
│   └── correlations.md        # Relations biais ↔ anti-patterns
├── techniques/                 # Méthodes pratiques
│   ├── index.md               # Navigation techniques
│   ├── detection_patterns.md  # Identification dans le code
│   ├── refactoring_guide.md   # Correction anti-patterns
│   └── prevention_methods.md  # Prévention par design
├── personas/                   # Experts spécialisés
│   ├── index.md               # Navigation personas
│   ├── expert_design_patterns.md
│   ├── expert_anti_patterns.md
│   ├── expert_psychologie_cognitive.md
│   ├── formateur_technique.md
│   └── developpeur_senior.md
└── use_cases/                  # Applications contextuelles
    ├── index.md               # Navigation cas d'usage
    ├── formation_junior.md    # Parcours développeurs junior
    ├── formation_senior.md    # Parcours développeurs senior
    ├── audit_code.md          # Audit qualité code
    └── coaching_equipe.md     # Accompagnement équipes
```

## Objectifs Pédagogiques

### Objectif Principal
Développer une compréhension holistique des mécanismes psychologiques qui influencent la qualité du code, en établissant des liens explicites entre biais cognitifs et anti-patterns techniques.

### Objectifs Spécifiques
1. **Maîtrise des Design Patterns** : Catalogue exhaustif avec exemples multi-langages
2. **Identification des Anti-Patterns** : Détection et correction des pratiques néfastes
3. **Conscience des Biais Cognitifs** : Compréhension des mécanismes psychologiques
4. **Application Pratique** : Intégration dans les pratiques de développement quotidiennes

## Sources de Référence

### Sources Primaires
- **Design Patterns** : https://refactoring.guru/design-patterns (extraction automatisée)
- **Anti-Patterns** : https://en.wikipedia.org/wiki/Anti-pattern + littérature académique
- **Biais Cognitifs** : Recherche en psychologie cognitive appliquée

### Méthodologie d'Extraction
- Browsing automatisé des sources web
- Structuration selon format AI-KIDO
- Validation par experts domaine
- Mise à jour continue

## Personas Disponibles

| Persona | Expertise | Usage Principal |
|---------|-----------|----------------|
| **Expert Design Patterns** | Maîtrise architecturale | Conception et implémentation |
| **Expert Anti-Patterns** | Détection problèmes | Audit et refactoring |
| **Expert Psychologie Cognitive** | Biais comportementaux | Analyse causes racines |
| **Formateur Technique** | Pédagogie développeurs | Animation formations |
| **Développeur Senior** | Expérience terrain | Retours pratiques |

## Navigation Contextuelle

### Pour Comprendre les Concepts
→ Consulter [`concepts/index.md`](concepts/index.md) pour accéder aux fondements théoriques

### Pour Appliquer les Techniques
→ Consulter [`techniques/index.md`](techniques/index.md) pour les méthodes pratiques

### Pour Utiliser les Personas
→ Consulter [`personas/index.md`](personas/index.md) pour les experts spécialisés

### Pour Explorer les Cas d'Usage
→ Consulter [`use_cases/index.md`](use_cases/index.md) pour les applications contextuelles

## Exemples de Corrélations Clés

### Biais → Anti-Patterns
- **Biais d'engagement** → Golden Hammer (Marteau Doré)
- **Biais de confirmation** → Résistance au refactoring
- **Effet Dunning-Kruger** → Over-engineering
- **Biais d'ancrage** → Premature Optimization
- **Biais de disponibilité** → Copy-Paste Programming

### Patterns → Solutions
- **Strategy Pattern** → Évite le Golden Hammer
- **Factory Pattern** → Réduit le couplage fort
- **Observer Pattern** → Évite les dépendances circulaires
- **Command Pattern** → Facilite l'undo/redo et les tests

## Règles d'Utilisation AI-KIDO

### Consultation Obligatoire
1. **Toujours commencer par ce fichier** pour comprendre le contexte
2. **Naviguer via les index** de chaque sous-répertoire
3. **Respecter la hiérarchie** concepts → techniques → application
4. **Consulter les personas** appropriés selon le besoin

### Mise à Jour Continue
- **Enrichissement progressif** des tables de vérité
- **Validation croisée** entre concepts et applications
- **Feedback utilisateur** intégré dans l'amélioration
- **Veille technologique** sur les sources de référence

## Hard Points Applicables

Référencer [`../hard_points/index.md`](../hard_points/index.md) pour les contraintes immuables :
- HP-001 : Couverture exhaustive des trois domaines
- HP-002 : Sources de référence validées
- HP-003 : Personas experts obligatoires
- HP-004 : Structure de formation interconnectée

## Métriques de Qualité

### Complétude
- [ ] Catalogue Design Patterns : 0/23 patterns GoF + patterns modernes
- [ ] Catalogue Anti-Patterns : 0/50+ anti-patterns documentés
- [ ] Cartographie Biais : 0/15+ biais cognitifs corrélés
- [ ] Personas : 0/5 personas opérationnels

### Cohérence
- [ ] Interconnexions concepts ↔ techniques validées
- [ ] Exemples multi-langages (JS, Python, Java, C#) disponibles
- [ ] Cas d'usage couvrant tous les profils utilisateurs
- [ ] Documentation conforme format AI-KIDO

---

**NAVIGATION SUIVANTE** : Commencer par [`concepts/index.md`](concepts/index.md) pour explorer les fondements théoriques, ou consulter directement un persona spécialisé via [`personas/index.md`](personas/index.md).
