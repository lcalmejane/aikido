# Formation AI-KIDO - Site Web Statique
> Version: 1.0 | Date: 2025-01-05 | Statut: Spécification Architecture Web

## Vue d'ensemble

Ce dossier contient la formation complète **AI-KIDO Design Patterns & Anti-Patterns** sous forme de site web HTML statique. La formation explore les connexions entre psychologie cognitive et qualité technique dans le développement logiciel.

## Architecture du Site

### Structure des Fichiers
```
/out/
├── index.html                  # Page d'accueil avec introduction psycho-cognitive
├── css/
│   ├── main.css               # Template CSS principal
│   ├── components.css         # Composants réutilisables
│   └── themes.css             # Thèmes et variables
├── js/
│   ├── navigation.js          # Gestion du menu et navigation
│   ├── exercises.js           # Système d'exercices gamifiés
│   └── utils.js               # Utilitaires généraux
├── pages/
│   ├── introduction/
│   │   ├── processus-pensee.html
│   │   ├── biais-cognitifs-intro.html
│   │   └── methodologie.html
│   ├── design-patterns/
│   │   ├── index.html         # Catalogue des design patterns
│   │   ├── creational/        # Patterns de création
│   │   ├── structural/        # Patterns structurels
│   │   └── behavioral/        # Patterns comportementaux
│   ├── anti-patterns/
│   │   ├── index.html         # Catalogue des anti-patterns
│   │   ├── code-smells/       # Mauvaises odeurs du code
│   │   ├── architecture/      # Anti-patterns architecturaux
│   │   └── management/        # Anti-patterns de gestion
│   └── biais-cognitifs/
│       ├── index.html         # Cartographie des biais
│       ├── perception/        # Biais de perception
│       ├── decision/          # Biais de décision
│       └── social/            # Biais sociaux
├── exercises/
│   ├── index.html             # Hub des exercices
│   ├── scenarios/             # Jeux de rôle contextuels
│   ├── quiz/                  # Quiz interactifs
│   └── corrections/           # Solutions détaillées
└── assets/
    ├── images/                # Diagrammes UML, illustrations
    ├── icons/                 # Iconographie
    └── data/                  # Données JSON pour exercices
```

## Spécifications Techniques

### Design System
- **Layout** : Menu latéral gauche fixe + contenu principal responsive
- **Typographie** : Hiérarchie claire pour la lisibilité technique
- **Couleurs** : Palette cohérente avec codes couleur par type (patterns/anti-patterns/biais)
- **Composants** : Cards, code blocks, diagrammes, boutons interactifs

### Navigation Logique
1. **Introduction** : Processus de pensée humain et biais cognitifs
2. **Design Patterns** : Catalogue complet avec exemples de code
3. **Anti-Patterns** : Identification et correction des mauvaises pratiques
4. **Biais Cognitifs** : Cartographie et corrélations avec le code
5. **Exercices** : Jeux de rôle gamifiés et quiz interactifs

### Fonctionnalités Interactives
- **Navigation fluide** : Menu contextuel avec progression
- **Code highlighting** : Syntaxe colorée pour tous les langages
- **Exercices gamifiés** : Système de points et feedback immédiat
- **Recherche** : Index des patterns/anti-patterns/biais
- **Responsive** : Adaptation mobile et tablette

## Objectifs Pédagogiques

### Introduction Psycho-Cognitive
Expliquer le processus de pensée qui amène un développeur à choisir entre un design pattern et un anti-pattern, en analysant :
- **L'acquis** : Connaissances techniques préalables
- **La connaissance** : Maîtrise des patterns et anti-patterns
- **L'interrogation** : Questionnement face à un problème
- **La curiosité** : Exploration de solutions alternatives
- **L'effet Dunning-Kruger** : Surestimation/sous-estimation des compétences
- **Les biais de confirmation** : Tendance à confirmer ses croyances
- **L'ancrage cognitif** : Influence des premières informations

### Parcours de Formation
1. **Sensibilisation** : Prise de conscience des biais cognitifs
2. **Apprentissage** : Maîtrise des patterns et anti-patterns
3. **Application** : Exercices pratiques contextualisés
4. **Évaluation** : Quiz et jeux de rôle gamifiés
5. **Intégration** : Adoption dans les pratiques quotidiennes

## Contenu par Section

### Design Patterns (Inspiré de refactoring.guru)
Chaque pattern dispose de sa propre page avec :
- **Description** : Problème résolu et contexte d'usage
- **Structure UML** : Diagramme de classes détaillé
- **Implémentation** : Exemples de code multi-langages (PHP, Java, JavaScript)
- **Avantages/Inconvénients** : Analyse critique
- **Cas d'usage** : Exemples concrets d'application
- **Corrélations** : Liens avec biais cognitifs et anti-patterns

### Anti-Patterns
Structure similaire aux design patterns :
- **Symptômes** : Comment identifier l'anti-pattern
- **Causes** : Biais cognitifs sous-jacents
- **Conséquences** : Impact sur la qualité du code
- **Refactoring** : Solutions et patterns recommandés
- **Prévention** : Bonnes pratiques pour éviter l'anti-pattern

### Biais Cognitifs
Cartographie complète avec :
- **Définition** : Mécanisme psychologique
- **Manifestations** : Comment le biais s'exprime dans le code
- **Corrélations** : Anti-patterns associés
- **Mitigation** : Techniques pour réduire l'impact
- **Exercices** : Situations pratiques d'identification

### Exercices Gamifiés
Système interactif avec :
- **Contexte** : Situation de développement réaliste
- **Choix multiples** : Décisions techniques à prendre
- **Feedback immédiat** : Explication des conséquences
- **Scoring** : Points basés sur la qualité des choix
- **Progression** : Déblocage de niveaux avancés

## Métriques de Qualité

### Complétude du Contenu
- ✅ 16/23 Design Patterns documentés (70% GoF + patterns modernes)
- ✅ 15+ Anti-Patterns avec exemples de code
- ✅ 10+ Biais Cognitifs corrélés
- 🔄 100+ Exercices interactifs (en développement)

### Standards Techniques
- ✅ HTML5 sémantique et accessible
- ✅ CSS3 avec variables et grid/flexbox
- ✅ JavaScript ES6+ modulaire
- ✅ Performance optimisée (< 3s de chargement)
- ✅ SEO et métadonnées complètes

---

**PROCHAINES ÉTAPES** : Développement du template CSS et de la structure de navigation logique.
