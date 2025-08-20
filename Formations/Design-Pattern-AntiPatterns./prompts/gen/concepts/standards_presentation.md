# Standards de Présentation - Formation AI-KIDO
> Version: 1.0 | Date: 2025-01-20 | Statut: Standard validé

## Vue d'ensemble

Ce document définit les standards de présentation pour toutes les pages de la formation AI-KIDO sur les Design Patterns, Anti-Patterns et Biais Cognitifs. Il garantit une cohérence visuelle et structurelle optimale pour l'expérience d'apprentissage.

## Définitions clés

- **Métadonnées de page** : Informations contextuelles affichées dans l'en-tête de chaque page
- **Meta-item** : Élément individuel de métadonnée avec icône et description
- **Format standardisé** : Structure HTML/CSS uniforme pour tous les types de contenu

## Principes directeurs

### Cohérence Visuelle
- Toutes les pages doivent utiliser le même format de métadonnées
- Les icônes doivent être pertinentes et cohérentes par catégorie
- La présentation doit être immédiatement compréhensible

### Accessibilité
- Informations essentielles visibles en un coup d'œil
- Hiérarchie visuelle claire
- Compatibilité avec les lecteurs d'écran

### Évolutivité
- Structure extensible pour nouveaux types de contenu
- Maintenance simplifiée
- Réutilisabilité des composants

### Règles de Mise en Forme
- **Icônes et texte** : Les icônes devant un titre ou du texte ne doivent jamais provoquer de retour à la ligne
- **Questions à choix multiples** : Une réponse par ligne obligatoire pour les checkboxes et radio buttons
- **Cohérence visuelle** : Alignement et espacement uniformes sur toutes les pages

## Spécifications techniques

### Format Standard des Métadonnées

**Structure HTML obligatoire :**
```html
<div class="page-meta">
    <div class="meta-item">
        <span>[ICÔNE]</span>
        <span>[DESCRIPTION]</span>
    </div>
    <!-- Répéter pour chaque métadonnée -->
</div>
```

**Classes CSS requises :**
- `.page-meta` : Conteneur principal des métadonnées
- `.meta-item` : Élément individuel de métadonnée
- Premier `<span>` : Icône emoji ou symbole
- Deuxième `<span>` : Texte descriptif

### Règles CSS Obligatoires

#### Icônes et Texte (Anti-Retour à la Ligne)
```css
.meta-item {
    display: flex;
    align-items: center;
    white-space: nowrap;
    gap: 0.5rem;
}

.meta-item span:first-child {
    flex-shrink: 0;
    display: inline-block;
}

/* Pour tous les titres avec icônes */
.page-title,
.bias-header h4,
.characteristic-item strong {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
}

.page-title .icon,
.bias-icon,
.char-icon {
    flex-shrink: 0;
}
```

#### Questions à Choix Multiples (Une Réponse par Ligne)
```css
.question-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.question-options label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.question-options label:hover {
    background-color: var(--color-background-hover);
}

.question-options input[type="radio"],
.question-options input[type="checkbox"] {
    margin: 0;
    flex-shrink: 0;
    margin-top: 0.125rem; /* Alignement avec le texte */
}
```

### Métadonnées Standardisées par Type

#### Anti-Patterns (Code Smells)
```html
<div class="page-meta">
    <div class="meta-item">
        <span>🦨</span>
        <span>Code Smell [critique/majeur/mineur]</span>
    </div>
    <div class="meta-item">
        <span>⏱️</span>
        <span>~[XX] minutes</span>
    </div>
    <div class="meta-item">
        <span>🎯</span>
        <span>Refactoring [essentiel/majeur/recommandé]</span>
    </div>
    <div class="meta-item">
        <span>🧩</span>
        <span>[X] biais cognitifs liés</span>
    </div>
</div>
```

#### Anti-Patterns (Architecture)
```html
<div class="page-meta">
    <div class="meta-item">
        <span>🏗️</span>
        <span>Anti-Pattern architectural</span>
    </div>
    <div class="meta-item">
        <span>⏱️</span>
        <span>~[XX] minutes</span>
    </div>
    <div class="meta-item">
        <span>🎯</span>
        <span>Refactoring [critique/majeur]</span>
    </div>
    <div class="meta-item">
        <span>🧩</span>
        <span>[X] biais cognitifs liés</span>
    </div>
</div>
```

#### Anti-Patterns (Gestion)
```html
<div class="page-meta">
    <div class="meta-item">
        <span>👥</span>
        <span>Anti-Pattern organisationnel</span>
    </div>
    <div class="meta-item">
        <span>⏱️</span>
        <span>~[XX] minutes</span>
    </div>
    <div class="meta-item">
        <span>🎯</span>
        <span>Amélioration processus</span>
    </div>
    <div class="meta-item">
        <span>🧩</span>
        <span>[X] biais cognitifs liés</span>
    </div>
</div>
```

#### Biais Cognitifs
```html
<div class="page-meta">
    <div class="meta-item">
        <span>🧠</span>
        <span>Biais cognitif</span>
    </div>
    <div class="meta-item">
        <span>⏱️</span>
        <span>~[XX] minutes</span>
    </div>
    <div class="meta-item">
        <span>🎯</span>
        <span>Conscience et prévention</span>
    </div>
    <div class="meta-item">
        <span>🔗</span>
        <span>[X] anti-patterns liés</span>
    </div>
</div>
```

#### Design Patterns
```html
<div class="page-meta">
    <div class="meta-item">
        <span>🎨</span>
        <span>Design Pattern</span>
    </div>
    <div class="meta-item">
        <span>⏱️</span>
        <span>~[XX] minutes</span>
    </div>
    <div class="meta-item">
        <span>🎯</span>
        <span>Implémentation pratique</span>
    </div>
    <div class="meta-item">
        <span>🛡️</span>
        <span>Prévient [X] anti-patterns</span>
    </div>
</div>
```

### Icônes Standardisées

| Catégorie | Icône | Usage |
|-----------|-------|-------|
| **Code Smells** | 🦨 | Anti-patterns de code |
| **Architecture** | 🏗️ | Anti-patterns architecturaux |
| **Gestion** | 👥 | Anti-patterns organisationnels |
| **Biais Cognitifs** | 🧠 | Mécanismes psychologiques |
| **Design Patterns** | 🎨 | Solutions de conception |
| **Temps** | ⏱️ | Durée estimée de lecture |
| **Objectif** | 🎯 | But pédagogique principal |
| **Relations** | 🧩/🔗/🛡️ | Connexions avec autres concepts |

### Durées Estimées

| Type de Contenu | Durée Recommandée |
|-----------------|-------------------|
| **Code Smell simple** | ~20-30 minutes |
| **Code Smell complexe** | ~30-45 minutes |
| **Anti-Pattern architectural** | ~45-60 minutes |
| **Anti-Pattern organisationnel** | ~30-45 minutes |
| **Biais cognitif** | ~25-35 minutes |
| **Design Pattern simple** | ~30-40 minutes |
| **Design Pattern complexe** | ~45-60 minutes |

## Exemples d'application

### Exemple Conforme : Spaghetti Code
```html
<div class="page-meta">
    <div class="meta-item">
        <span>🦨</span>
        <span>Code Smell critique</span>
    </div>
    <div class="meta-item">
        <span>⏱️</span>
        <span>~30 minutes</span>
    </div>
    <div class="meta-item">
        <span>🎯</span>
        <span>Refactoring essentiel</span>
    </div>
    <div class="meta-item">
        <span>🧩</span>
        <span>4 biais cognitifs liés</span>
    </div>
</div>
```

### Exemple Conforme : God Object
```html
<div class="page-meta">
    <div class="meta-item">
        <span>🦨</span>
        <span>Code Smell critique</span>
    </div>
    <div class="meta-item">
        <span>⏱️</span>
        <span>~45 minutes</span>
    </div>
    <div class="meta-item">
        <span>🎯</span>
        <span>Refactoring majeur</span>
    </div>
    <div class="meta-item">
        <span>🧩</span>
        <span>6 biais cognitifs liés</span>
    </div>
</div>
```

### Exemple Conforme : Questions à Choix Multiples
```html
<div class="question-card">
    <h4>🎯 Question : Quelle approche privilégier ?</h4>
    <p>Comment refactorer ce God Object ?</p>
    <div class="question-options">
        <label>
            <input type="radio" name="q1" value="a">
            <span>Extraire des services spécialisés avec responsabilités uniques</span>
        </label>
        <label>
            <input type="radio" name="q1" value="b">
            <span>Diviser la classe en plusieurs classes héritées</span>
        </label>
        <label>
            <input type="radio" name="q1" value="c">
            <span>Utiliser des méthodes statiques pour réduire la complexité</span>
        </label>
        <label>
            <input type="radio" name="q1" value="d">
            <span>Appliquer le pattern Facade pour masquer la complexité</span>
        </label>
    </div>
</div>
```

### Exemple Conforme : Titre avec Icône
```html
<h1 class="page-title">
    <span class="icon">👑</span>
    <span>God Object</span>
</h1>

<div class="bias-header">
    <span class="bias-icon">📈</span>
    <h4>Effet Dunning-Kruger</h4>
</div>
```

## Relations et dépendances

### Fichiers CSS Associés
- `out/css/main.css` : Styles pour `.page-meta` et `.meta-item`
- `out/css/components.css` : Composants réutilisables

### Pages de Référence
- `out/pages/anti-patterns/code-smells/spaghetti-code.html` : Modèle de référence
- `out/pages/anti-patterns/code-smells/god-object.html` : Exemple harmonisé

### Standards Connexes
- Structure générale des pages de formation
- Système de navigation par groupes
- Composants interactifs (exercices, completion)

## Validation et Contrôle Qualité

### Critères de Conformité
- [ ] Utilisation de la classe `.page-meta`
- [ ] Exactement 4 `.meta-item` par page
- [ ] Icônes conformes au tableau standardisé
- [ ] Durée estimée réaliste
- [ ] Nombre de biais/anti-patterns corrélés exact
- [ ] **Icônes et texte** : Aucun retour à la ligne intempestif (CSS `white-space: nowrap` appliqué)
- [ ] **Questions à choix** : Une réponse par ligne avec structure `flex-direction: column`
- [ ] **Alignement** : Icônes et texte parfaitement alignés avec `display: flex` et `align-items: center`
- [ ] **Schémas Mermaid** : Utilisation obligatoire pour illustrer les concepts complexes
- [ ] **Section completion** : Format standardisé avec icône intégrée dans le titre

### Outils de Vérification
- Inspection visuelle des pages générées
- Validation HTML/CSS
- Tests de cohérence inter-pages
- Feedback utilisateur sur la clarté

## 📊 Utilisation des Schémas Mermaid

### 🎯 Règle Obligatoire
**Quand il y a besoin d'illustrer des concepts complexes, des mécanismes psychologiques, des relations entre éléments ou des workflows, il FAUT utiliser un schéma Mermaid.**

### 📋 Cas d'Usage Obligatoires
- **Mécanismes psychologiques** : Processus cognitifs, biais, influences
- **Relations causales** : Biais → Anti-patterns, Patterns → Solutions
- **Workflows** : Étapes de résolution, processus de décision
- **Architectures** : Structures de code, dépendances
- **Comparaisons** : Avant/après, bon/mauvais exemple

### 🛠️ Structure Standard Mermaid
```html
<div class="mermaid-container">
    <div class="mermaid">
        graph TD
            A[🎯 Élément Initial] --> B[🧠 Processus Mental]
            B --> C[⚖️ Évaluation]
            C --> D[🎯 Résultat Final]
            
            style A fill:#e1f5fe
            style B fill:#fff3e0
            style C fill:#fce4ec
            style D fill:#f3e5f5
    </div>
</div>
```

### 🎨 Conventions Visuelles
- **Couleurs standardisées** : Palette cohérente selon le type d'élément
- **Icônes dans les nœuds** : Amélioration de la lisibilité
- **Styles différenciés** : Biais, patterns, solutions avec couleurs distinctes
- **Flèches explicites** : Relations causales claires

## 🏁 Section de Completion Standard

### 📋 Structure de Référence
**Basée sur la page [`biais-ancrage.html`](out/pages/biais-cognitifs/perception/biais-ancrage.html) corrigée :**

```html
<section class="completion-section">
    <div class="aikido-card completion">
        <div class="completion-content">
            <div class="completion-text">
                <h3>✅ [Titre du Concept]</h3>
                <p>Vous avez terminé cette leçon sur [description du concept].</p>
            </div>
        </div>
        <button class="aikido-btn primary mark-completed" data-page="[page-id]">
            Marquer comme Terminé ✓
        </button>
        <div class="completion-feedback hidden">
            <p>Excellent ! Vous maîtrisez maintenant [compétence acquise].</p>
        </div>
    </div>
</section>
```

### ⚠️ Points Critiques
- **Icône dans le titre** : `<h3>✅ [Titre]</h3>` - PAS de div séparé pour l'icône
- **Pas de retour à la ligne** : L'icône et le titre doivent rester sur la même ligne
- **Structure simplifiée** : Élimination du div `completion-icon` problématique
- **Cohérence** : Même approche que les métadonnées avec icône intégrée

### 🔧 Correction Appliquée
**Avant (problématique) :**
```html
<div class="completion-content">
    <div class="completion-icon">✅</div>  <!-- ❌ Provoque un retour à la ligne -->
    <div class="completion-text">
        <h3>Biais d'Ancrage</h3>
        <p>Vous avez terminé cette leçon...</p>
    </div>
</div>
```

**Après (conforme) :**
```html
<div class="completion-content">
    <div class="completion-text">
        <h3>✅ Biais d'Ancrage</h3>  <!-- ✅ Icône intégrée, pas de retour à la ligne -->
        <p>Vous avez terminé cette leçon...</p>
    </div>
</div>
```

**Standard de block Completion :**
```html
<!-- Completion Section -->
                <section class="completion-section">
                    <div class="aikido-card completion">
                        <h3 class="completion-content">
                            <div class="completion-text">
                                <h3>🎯Avez-vous terminé cette section ?</h3>
                                <p>Marquez cette page comme terminée pour suivre votre progression dans la formation.</p>
                            </div>
                            <button class="aikido-btn primary mark-completed" data-page="spaghetti-code">
                                Marquer comme Terminé ✓
                            </button>
                        </div>
                        
                        
                    </div>
                </section>
```                

---

**MISE À JOUR** : Ce standard a été appliqué avec succès sur `god-object.html` le 2025-01-20, harmonisant les métadonnées selon le format de référence `spaghetti-code.html`. La section completion a été standardisée sur `biais-ancrage.html` avec correction de l'icône intégrée.
