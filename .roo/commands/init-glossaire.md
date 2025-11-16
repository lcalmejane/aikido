---
description: "Créer ou mettre à jour le glossaire métier du projet en cours à partir des termes spécifiques et confus nécessitant une définition particulière"
---

# Commande Init-Glossaire

Crée ou met à jour le glossaire métier du projet en cours en se concentrant uniquement sur les termes métier spécifiques, confus ou particuliers qui nécessitent une définition claire. **Exclut les termes génériques AI-KIDO et roo-code.**

## Exécution

### Phase 1 : Détection du Glossaire Existant

**Vérifier l'existence d'un glossaire métier** dans [`/prompts/gen/concepts/`](../prompts/gen/concepts/) :
- Scanner tous les fichiers `.md` pour détecter un glossaire existant
- Patterns de détection : `glossaire-metier*.md`, `*glossary*.md`, `terminologie-metier*.md`
- Si trouvé : Mode **MISE À JOUR**
- Si absent : Mode **CRÉATION**

### Phase 2 : Analyse Automatique des Sources Projet

**Analyser automatiquement les sources du projet en cours** :
- Scanner le workspace pour détecter les sources projet (src/, docs/, lib/, components/, etc.)
- **EXCLURE** automatiquement :
  - Tous les fichiers dans `/prompts/hard_points/ai-kido.md`
  - Tous les fichiers dans `/prompts/hard_points/roo-code/`
  - Les termes génériques de la méthode AI-KIDO
  - Les personas, rôles et informations IDE
- **INCLURE** uniquement :
  - Les termes métier spécifiques au domaine du projet
  - Les concepts confus nécessitant une définition particulière
  - Les hard_points métier spécifiques (hors AI-KIDO/roo-code)

### Phase 3 : Extraction Terminologique Métier

#### 3.1 Filtrage Intelligent des Termes

**Critères d'inclusion** (termes à GARDER) :
- Termes métier spécifiques au domaine du projet
- Concepts confus ou ambigus nécessitant clarification
- Acronymes métier non standards
- Processus métier particuliers
- Règles business complexes
- Terminologie technique spécifique au projet (non générique)

**Critères d'exclusion** (termes à IGNORER) :
- Tous les termes de la méthode AI-KIDO
- Tous les termes roo-code
- Personas et rôles génériques
- Informations IDE et outils de développement
- Technologies standards bien connues
- Patterns architecturaux classiques
- Termes de développement usuels

#### 3.2 Analyse Ciblée des Documents

**A. Analyse des Documents Markdown (.md/.mdx)** :
1. **Extraction des termes métier uniquement** :
   - Mots en `code` ou **gras** liés au domaine métier
   - Acronymes métier spécifiques (non techniques génériques)
   - Terminologie métier complexe ou confuse
   - Processus business particuliers

2. **Extraction des définitions métier** :
   - Définitions de concepts métier
   - Règles business spécifiques
   - Processus métier particuliers
   - Terminologie domaine-spécifique

**B. Analyse des Sources Code (focus métier)** :
1. **Extraction des éléments métier** :
   - Noms de classes/interfaces métier
   - Énumérations de valeurs métier
   - Constantes métier
   - Commentaires expliquant la logique métier

2. **Exclusion automatique** :
   - Frameworks et bibliothèques standards
   - Patterns techniques génériques
   - Configuration technique standard
   - APIs techniques génériques

#### 3.3 Validation et Nettoyage

**Validation automatique des termes extraits** :
```
📊 TERMES MÉTIER DÉTECTÉS :

Termes métier spécifiques : [NOMBRE]
Concepts confus identifiés : [NOMBRE]
Acronymes métier : [NOMBRE]
Processus business : [NOMBRE]

⚠️ TERMES EXCLUS (AI-KIDO/roo-code) : [NOMBRE]

Continuer avec ces termes ? (o/n)
Si non, ajustez les critères de filtrage :
```

### Phase 4 : Détection du Contexte Métier

**Analyse du domaine métier** :
```
📊 ANALYSE DU DOMAINE MÉTIER DÉTECTÉ :

Domaine principal : [Basé sur les termes métier extraits]
Sous-domaines identifiés : [Liste des sous-domaines]
Complexité terminologique : [Évaluation]

Termes nécessitant définition particulière :
- [Liste des termes confus ou ambigus]

Cette analyse correspond-elle au projet ? (o/n)
Si non, précisez le domaine métier :
```

### Phase 5 : Saisie Manuelle Complémentaire

**Question optionnelle : Termes métier supplémentaires**
```
Souhaitez-vous ajouter des termes métier spécifiques non détectés automatiquement ?

Format : Terme | Définition | Contexte d'usage
Exemple : "Parcours apprenant | Séquence pédagogique personnalisée | Utilisé dans les modules d'évaluation"

Entrez les termes métier (un par ligne, ou 'fin' pour terminer) :
```

### Phase 6 : Génération du Glossaire Métier Unifié

#### 6.1 Mode CRÉATION - Nouveau Glossaire

**Créer le glossaire métier principal** [`/prompts/gen/concepts/glossaire-metier.md`](../prompts/gen/concepts/glossaire-metier.md) :

```markdown
# 📚 Glossaire Métier du Projet
> Version: 1.0 | Date: [DATE] | Domaine: [DOMAINE_DETECTE]

## Vue d'ensemble
Terminologie métier spécifique au projet, concentrée sur les termes confus, ambigus ou particuliers nécessitant une définition claire.

**Exclusions** : Termes AI-KIDO, roo-code, personas, rôles génériques, technologies standards.

## Termes Métier

### A

**[Terme A]**
- **Définition** : [Définition claire et précise]
- **Contexte** : [Où et comment ce terme est utilisé]
- **Exemple** : [Exemple concret d'usage]
- **Voir aussi** : [Liens vers termes connexes]

### B

[Continue alphabétiquement...]

## Index par Catégorie

### Processus Métier
- [Liste des termes liés aux processus]

### Règles Business
- [Liste des termes liés aux règles métier]

### Concepts Domaine
- [Liste des concepts spécifiques au domaine]

### Acronymes Métier
- [Liste des acronymes métier non standards]

## Termes Confus Clarifiés

Cette section liste les termes qui prêtent souvent à confusion :

**[Terme Confus 1]** vs **[Terme Confus 2]**
- **Différence** : [Explication claire de la différence]
- **Usage** : [Quand utiliser l'un ou l'autre]

---
*Glossaire généré automatiquement par init-glossaire le [DATE]*
*Sources analysées : [NOMBRE] fichiers projet (hors AI-KIDO/roo-code)*
*Termes métier identifiés : [NOMBRE]*
```

#### 6.2 Gestion de la Taille (Règle 500 lignes)

**Si le glossaire dépasse 500 lignes** :
1. **Créer un glossaire principal** [`glossaire-metier.md`](../prompts/gen/concepts/glossaire-metier.md) avec index
2. **Créer des fichiers par catégorie** :
   - [`glossaire-metier-processus.md`](../prompts/gen/concepts/glossaire-metier-processus.md)
   - [`glossaire-metier-regles.md`](../prompts/gen/concepts/glossaire-metier-regles.md)
   - [`glossaire-metier-concepts.md`](../prompts/gen/concepts/glossaire-metier-concepts.md)
   - [`glossaire-metier-acronymes.md`](../prompts/gen/concepts/glossaire-metier-acronymes.md)

#### 6.3 Mode MISE À JOUR - Glossaire Existant

**Analyser le glossaire métier existant** :
1. Extraire les termes métier déjà définis
2. Identifier les nouveaux termes métier à ajouter
3. Détecter les définitions métier à mettre à jour
4. Préserver la structure existante

**Stratégie de mise à jour** :
```
📊 ANALYSE DU GLOSSAIRE MÉTIER EXISTANT :

Termes métier existants : [NOMBRE]
Nouveaux termes métier détectés : [NOMBRE]
Définitions à mettre à jour : [NOMBRE]
Termes AI-KIDO/roo-code supprimés : [NOMBRE]

Stratégie de mise à jour :
✅ Ajouter [X] nouveaux termes métier
✅ Mettre à jour [Y] définitions métier existantes
✅ Supprimer [Z] termes non-métier
✅ Préserver la structure métier

Continuer ? (o/n) :
```

### Phase 7 : Mise à Jour de l'Indexation

#### 7.1 Mise à Jour de l'Index Concepts

Mettre à jour [`/prompts/gen/concepts/index.md`](../prompts/gen/concepts/index.md) :
```markdown
## Fichiers Disponibles

- [`guideline-prompts.md`](guideline-prompts.md) : Guidelines pour la création de prompts efficaces
- [`glossaire-metier.md`](glossaire-metier.md) : Glossaire métier du projet (termes spécifiques et confus)
```

#### 7.2 Mise à Jour de l'Index Principal

Mettre à jour [`/prompts/gen/index.md`](../prompts/gen/index.md) avec référence au glossaire :
```markdown
## Structure

- [`concepts/`](concepts/index.md) : Concepts fondamentaux (incluant glossaire métier)
```

## Messages de Confirmation

### Succès - Mode Création
```
✅ Glossaire métier du projet créé avec succès !

Fichier(s) créé(s) :
- /prompts/gen/concepts/glossaire-metier.md
[+ fichiers supplémentaires si > 500 lignes]

Statistiques :
- [X] termes métier spécifiques
- [Y] concepts confus clarifiés
- [Z] acronymes métier
- [W] processus business
- [V] règles métier

Sources analysées :
- Sources projet : [NOMBRE] fichiers analysés
- Répertoires scannés : [LISTE_REPERTOIRES]
- Termes AI-KIDO/roo-code exclus : [NOMBRE]

Index mis à jour :
- /prompts/gen/concepts/index.md
- /prompts/gen/index.md

🎯 Glossaire métier prêt pour clarifier la terminologie du projet !
```

### Succès - Mode Mise à Jour
```
✅ Glossaire métier du projet mis à jour avec succès !

Modifications apportées :
- [X] nouveaux termes métier ajoutés
- [Y] définitions métier mises à jour
- [Z] termes non-métier supprimés

Statistiques finales :
- [TOTAL] termes métier au total
- [NOUVELLES_SOURCES] nouvelles sources analysées

🔄 Glossaire métier enrichi et nettoyé !
```

## Gestion des Erreurs

- **Sources projet inaccessibles** : Lister les répertoires non accessibles et continuer avec les sources disponibles
- **Glossaire existant corrompu** : Proposer sauvegarde et recréation
- **Aucun terme métier détecté** : Proposer saisie manuelle ou ajustement des critères
- **Extraction terminologique échouée** : Passer en mode saisie manuelle
- **Domaine métier non détecté** : Demander saisie manuelle du contexte métier
- **Conflits de définitions métier** : Créer section "Définitions en conflit" pour résolution ultérieure
- **Permissions insuffisantes** : Proposer création dans répertoire temporaire

## Règles AI-KIDO Respectées

- ✅ Focus exclusif sur les termes métier du projet
- ✅ Exclusion des termes AI-KIDO et roo-code génériques
- ✅ Intégration dans la hiérarchie [`/prompts/gen/concepts/`](../prompts/gen/concepts/)
- ✅ Mise à jour des index généraux
- ✅ Format Markdown avec métadonnées
- ✅ Contrainte 500 lignes par fichier (pagination si nécessaire)
- ✅ Préservation de l'existant en mode mise à jour
- ✅ Concentration sur les termes confus et spécifiques

---
