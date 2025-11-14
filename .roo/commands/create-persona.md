---
description: "Créer un nouveau persona AI-KIDO avec toutes les configurations nécessaires"
---

# Commande Create-Persona

Cette commande permet de créer un nouveau persona AI-KIDO complet avec :
- Fichier persona dans `prompts/gen/personas/`
- Mise à jour de l'index des personas
- Ajout dans `.roomodes` à la racine
- Création/mise à jour du fichier `AGENTS.md` (format standard)

## Étapes d'exécution

### 0. Analyse de la base AI-KIDO existante

**AVANT** de poser les questions à l'utilisateur, analyser automatiquement :

1. **Lire la base de connaissances existante** :
   - Analyser `/prompts/gen/concepts/` pour identifier les concepts disponibles
   - Analyser `/prompts/gen/techniques/` pour les techniques existantes
   - Analyser `/prompts/gen/use_cases/` pour les cas d'usage définis
   - Analyser `/prompts/gen/personas/` pour éviter les doublons

2. **Analyser la taxonomie AI-KIDO** depuis `/prompts/hard_points/ai-kido.md` :
   - Identifier les catégories fondamentales (🏗️ CONCEPTION, ⚙️ DÉVELOPPEMENT, 🔒 SÉCURITÉ, 🔍 QUALITÉ, 🚀 DÉPLOIEMENT)
   - Comprendre les familles fonctionnelles disponibles
   - Préparer des suggestions basées sur la taxonomie existante

3. **Préparer des suggestions intelligentes** basées sur l'analyse :
   - Concepts non couverts par les personas existants
   - Combinaisons techniques/cas d'usage prometteuses
   - Spécialisations contextuelles manquantes

### 1. Collecte des informations enrichie

Poser les questions suivantes à l'utilisateur de manière interactive, **en proposant des suggestions basées sur l'analyse** :

**Question 1 : Catégorie taxonomique**
```
Dans quelle catégorie AI-KIDO ce persona s'inscrit-il ?
Suggestions basées sur la taxonomie :
- 🏗️ CONCEPTION (Architecture, Design, Modélisation)
- ⚙️ DÉVELOPPEMENT (Backend, Frontend, Intégration)
- 🔒 SÉCURITÉ (Audit, Conformité, Gestion des risques)
- 🔍 QUALITÉ (Tests, Validation, Performance)
- 🚀 DÉPLOIEMENT (Infrastructure, CI/CD, Monitoring)

[Afficher les familles fonctionnelles disponibles pour la catégorie choisie]
```

**Question 2 : Nom du persona**
```
Quel est le nom du persona ?
Suggestions basées sur la catégorie choisie :
[Générer des suggestions de noms cohérents avec la taxonomie]
Exemple : "Arthur Architect", "Merlin AI Expert", "Gandalf Security Wizard"
```

**Question 3 : Slug du persona**
```
Quel est le slug du persona ? (format: nom-specialite-expert)
Suggestion automatique basée sur le nom : [slug-auto-généré]
[Vérifier l'unicité dans .roomodes et proposer des alternatives si nécessaire]
```

**Question 4 : Emoji représentatif**
```
Quel emoji représente ce persona ?
Suggestions basées sur la catégorie :
[Proposer des emojis cohérents avec la catégorie taxonomique]
```

**Question 5 : Spécialisation fonctionnelle**
```
Quelle est la famille fonctionnelle de ce persona ?
Suggestions pour [catégorie choisie] :
[Lister les familles fonctionnelles de la taxonomie AI-KIDO]
Ou créer une nouvelle famille : [permettre la création]
```

**Question 6 : Concepts et techniques à intégrer**
```
Quels concepts/techniques de la base AI-KIDO ce persona doit-il maîtriser ?
Concepts disponibles :
[Lister les concepts de /prompts/gen/concepts/]
Techniques disponibles :
[Lister les techniques de /prompts/gen/techniques/]
Sélectionnez ceux pertinents (séparés par des virgules) :
```

**Question 7 : Cas d'usage ciblés**
```
Quels cas d'usage ce persona doit-il couvrir ?
Cas d'usage existants :
[Lister les cas d'usage de /prompts/gen/use_cases/]
Nouveaux cas d'usage à créer :
[Permettre la définition de nouveaux cas d'usage]
```

**Question 8 : Description du rôle enrichie**
```
Décrivez le rôle complet du persona en intégrant :
- Sa position dans la taxonomie AI-KIDO
- Les concepts/techniques qu'il maîtrise
- Sa spécialisation contextuelle

Format suggéré basé sur les guidelines :
"Vous êtes [Nom], [Rôle] expert en [Spécialisation]. Vous maîtrisez [Concepts/Techniques] et intervenez dans [Contextes]. Votre approche se base sur [Méthodologie AI-KIDO]..."
```

**Question 9 : Permissions nécessaires**
```
Quelles permissions sont nécessaires ? (choisir parmi : read, edit, browser, command)
Suggestions basées sur la catégorie :
[Proposer des permissions typiques pour la catégorie choisie]
Entrez les permissions séparées par des virgules :
```

### 2. Validation enrichie des données

Avant de procéder à la création :

1. **Vérifier l'unicité et cohérence taxonomique** :
   - Lire le fichier `.roomodes` s'il existe
   - Vérifier qu'aucun mode existant n'utilise ce slug
   - Analyser les personas existants pour éviter les redondances fonctionnelles
   - Vérifier la cohérence avec la taxonomie AI-KIDO
   - Si conflit détecté, proposer des alternatives ou des spécialisations

2. **Valider la cohérence avec la base AI-KIDO** :
   - Vérifier que les concepts/techniques sélectionnés existent
   - Valider que les cas d'usage sont cohérents avec la spécialisation
   - Contrôler l'alignement avec les guidelines de `/prompts/gen/concepts/guideline-prompts.md`

3. **Valider le format des permissions** :
   - Vérifier que les permissions sont dans la liste autorisée : read, edit, browser, command
   - Contrôler la cohérence des permissions avec la catégorie taxonomique
   - Afficher un avertissement si des permissions non reconnues sont saisies

4. **Confirmer la création avec résumé enrichi** :
   ```
   Résumé du persona à créer :
   - Nom : [nom]
   - Slug : [slug]
   - Emoji : [emoji]
   - Catégorie taxonomique : [catégorie] > [famille fonctionnelle]
   - Concepts maîtrisés : [liste des concepts]
   - Techniques utilisées : [liste des techniques]
   - Cas d'usage couverts : [liste des cas d'usage]
   - Permissions : [permissions]
   - Position dans la taxonomie : [niveau hiérarchique]
   
   Confirmer la création ? (oui/non)
   ```

### 3. Création des fichiers

#### 3.1 Créer le fichier persona enrichi

Créer le fichier `prompts/gen/personas/[slug].md` avec le contenu suivant **intégrant la taxonomie AI-KIDO** :

```markdown
# [emoji] [nom] - [domaine]
> Taxonomie: [catégorie] > [famille fonctionnelle] > [spécialisation]
> Version: 1.0 | Date: [date de création]

## Identité
- **Nom** : [nom]
- **Catégorie taxonomique** : [catégorie fondamentale]
- **Famille fonctionnelle** : [famille fonctionnelle]
- **Spécialisation** : [spécialisation contextuelle]

## Définition du rôle

[description du rôle complète intégrant la méthodologie AI-KIDO]

## Caractéristiques héritées
[Traits provenant des niveaux taxonomiques supérieurs selon ai-kido.md]

## Spécialisations
[Traits spécifiques à ce persona]

## Concepts maîtrisés
[Liste des concepts de /prompts/gen/concepts/ que ce persona utilise]

## Techniques appliquées
[Liste des techniques de /prompts/gen/techniques/ que ce persona met en œuvre]

## Cas d'usage couverts
[Cas d'usage de /prompts/gen/use_cases/ + nouveaux cas d'usage définis]

## Quand l'utiliser
[Contextes d'application optimaux pour ce persona]

## Relations taxonomiques
- **Parent** : [famille fonctionnelle]
- **Pairs** : [autres personas du même niveau]
- **Spécialisations possibles** : [évolutions contextuelles]

## Compétences clés
- [Compétences héritées de la taxonomie]
- [Compétences spécifiques au persona]
- [Compétences liées aux concepts/techniques maîtrisés]

## Permissions requises
- [permissions nécessaires avec justification taxonomique]

## Format d'utilisation

```yaml
slug: [slug]
name: [emoji] [nom] - [domaine]
taxonomy: [catégorie] > [famille] > [spécialisation]
roleDefinition: >-
  [description du rôle enrichie]
whenToUse: >-
  [cas d'usage détaillés]
concepts: [liste des concepts maîtrisés]
techniques: [liste des techniques appliquées]
useCases: [liste des cas d'usage couverts]
groups:
  [permissions sous forme de liste YAML]
```

---
*Persona créé automatiquement via la commande create-persona selon la taxonomie AI-KIDO*
```

#### 3.2 Mettre à jour l'index des personas

Modifier le fichier `prompts/gen/personas/index.md` pour ajouter une référence au nouveau persona :

```markdown
- [`[slug].md`]([slug].md) : [emoji] [nom] - [domaine]
```

#### 3.3 Créer ou mettre à jour .roomodes

Si le fichier `.roomodes` n'existe pas à la racine, le créer avec :

```yaml
customModes:
  - slug: [slug]
    name: [emoji] [nom] - [domaine]
    roleDefinition: >-
      [description du rôle]
    whenToUse: >-
      [cas d'usage]
    groups:
      [permissions sous forme de liste YAML]
```

Si le fichier existe, ajouter le nouveau mode à la liste `customModes`.

#### 3.4 Créer ou mettre à jour AGENTS.md (format standard)

Si le fichier `AGENTS.md` n'existe pas à la racine, le créer avec le **format standard AGENTS.md** :

```markdown
# AI-KIDO Agents

Ce fichier guide les agents de codage IA pour travailler efficacement avec le système AI-KIDO.

## Vue d'ensemble du projet

AI-KIDO est un système de gestion des connaissances et de création de personas pour l'IA, basé sur une taxonomie hiérarchique et des Tables de Vérités.

## Structure du projet

- `prompts/gen/` : Base de connaissances collective (concepts, techniques, personas, cas d'usage)
- `prompts/hard_points/` : Vérités immuables (priorité absolue)
- `.roo/commands/` : Commandes personnalisées pour la gestion du système

## Personas disponibles

### [emoji] [nom] - [domaine]

**Rôle** : [description du rôle]

**Taxonomie** : [catégorie] > [famille fonctionnelle] > [spécialisation]

**Concepts maîtrisés** : [liste des concepts]

**Techniques appliquées** : [liste des techniques]

**Cas d'usage** : [contextes d'utilisation]

**Commande d'activation** : Utiliser le slug `[slug]` dans votre interface Roo

---

## Instructions pour les agents

### Règles prioritaires

1. **Toujours consulter** `/prompts/gen/index.md` en premier pour comprendre le contexte
2. **Respecter absolument** les contraintes des `/prompts/hard_points/`
3. **Suivre la taxonomie** définie dans `/prompts/hard_points/ai-kido.md`
4. **Capitaliser les analyses** dans les Tables de Vérités appropriées

### Workflow recommandé

1. Analyser la demande et identifier le persona approprié
2. Consulter les concepts/techniques/cas d'usage pertinents
3. Appliquer la méthodologie AI-KIDO
4. Documenter les apprentissages dans la base de connaissances

### Création de nouveaux personas

Utiliser la commande `create-persona` qui :
- Analyse automatiquement la base existante
- Propose des suggestions basées sur la taxonomie
- Intègre les concepts/techniques disponibles
- Maintient la cohérence avec le système AI-KIDO

---

*Fichier généré automatiquement par le système AI-KIDO - Format standard AGENTS.md*
```

Si le fichier existe, ajouter la nouvelle section persona dans la section "Personas disponibles".

### 4. Validation post-création

Après la création, effectuer les vérifications suivantes :

1. **Vérifier l'existence des fichiers créés** :
   - `prompts/gen/personas/[slug].md`
   - `.roomodes` (mis à jour)
   - `AGENTS.md` (créé ou mis à jour)

2. **Valider la syntaxe YAML** du fichier `.roomodes`

3. **Confirmer la mise à jour de l'index des personas**

### 5. Message de confirmation

Afficher un message de succès avec le résumé :

```
✅ Persona créé avec succès !

Fichiers créés/modifiés :
- prompts/gen/personas/[slug].md
- prompts/gen/personas/index.md (mis à jour)
- .roomodes (créé/mis à jour)
- AGENTS.md (créé/mis à jour)

Le persona "[nom]" est maintenant disponible avec le slug "[slug]".

Pour l'utiliser, activez le mode personnalisé correspondant dans votre interface Roo.
```

## Gestion des erreurs enrichie

### Erreurs possibles et solutions :

1. **Slug déjà existant** :
   - Proposer des alternatives basées sur la taxonomie : [slug]-[spécialisation], [slug]-[contexte], etc.
   - Analyser les différences fonctionnelles pour éviter les doublons
   - Demander à l'utilisateur de choisir un nouveau slug ou une spécialisation

2. **Redondance taxonomique** :
   - Détecter les personas existants couvrant la même niche
   - Proposer une spécialisation contextuelle ou une fusion
   - Suggérer des domaines d'expertise complémentaires

3. **Incohérence avec la base AI-KIDO** :
   - Vérifier l'existence des concepts/techniques référencés
   - Proposer des alternatives depuis la base existante
   - Suggérer la création de nouveaux concepts si nécessaire

4. **Permissions invalides** :
   - Lister les permissions valides : read, edit, browser, command
   - Proposer des permissions cohérentes avec la catégorie taxonomique
   - Demander de ressaisir les permissions

5. **Fichiers non accessibles** :
   - Vérifier les permissions d'écriture sur `/prompts/gen/personas/`
   - Proposer de créer les répertoires manquants
   - Vérifier l'intégrité de la structure AI-KIDO

6. **Format YAML invalide** :
   - Valider la syntaxe avant l'écriture
   - Échapper les caractères spéciaux dans les descriptions
   - Tester la compatibilité avec les parsers YAML standards

7. **Violation des guidelines** :
   - Contrôler le respect des guidelines de `/prompts/gen/concepts/guideline-prompts.md`
   - Vérifier la cohérence avec les hard points
   - Proposer des corrections automatiques

## Fonctionnalités avancées

### Analyse intelligente de la base existante

1. **Détection automatique des lacunes** :
   - Identifier les catégories taxonomiques sous-représentées
   - Détecter les combinaisons concepts/techniques non exploitées
   - Proposer des spécialisations contextuelles manquantes

2. **Suggestions basées sur l'IA** :
   - Analyser les patterns dans les personas existants
   - Proposer des noms cohérents avec la taxonomie
   - Suggérer des compétences complémentaires

3. **Validation croisée** :
   - Vérifier la cohérence avec les guidelines existantes
   - Contrôler l'alignement avec les hard points
   - Valider la pertinence des cas d'usage proposés

### Intégration avec l'écosystème AI-KIDO

1. **Mise à jour automatique des index** :
   - Régénérer `/prompts/gen/personas/index.md`
   - Mettre à jour les références croisées
   - Maintenir la cohérence des liens bidirectionnels

2. **Enrichissement de la base de connaissances** :
   - Créer automatiquement les nouveaux concepts si nécessaire
   - Documenter les nouvelles techniques découvertes
   - Enrichir les cas d'usage avec les nouvelles applications

3. **Traçabilité et versioning** :
   - Horodater toutes les créations
   - Maintenir un historique des modifications
   - Permettre le rollback en cas de problème

## Notes techniques enrichies

### Formats et standards

- **Slugs** : kebab-case (minuscules avec tirets), validation d'unicité
- **YAML** : Échapper les caractères spéciaux, utiliser `>-` pour les textes multi-lignes
- **Markdown** : Respecter le format des Tables de Vérités AI-KIDO
- **Taxonomie** : Suivre la hiérarchie définie dans `/prompts/hard_points/ai-kido.md`

### Intégration système

- **Lecture de la base** : Parcours récursif depuis `/prompts/gen/index.md`
- **Validation** : Contrôle de cohérence avec les guidelines et hard points
- **Sauvegarde** : Backup automatique des fichiers existants avant modification
- **Rollback** : Possibilité de restauration en cas d'erreur

### Performance et optimisation

- **Cache** : Mise en cache des analyses de la base existante
- **Indexation** : Maintien d'un index des concepts/techniques/cas d'usage
- **Validation différée** : Optimisation des contrôles de cohérence
- **Batch processing** : Traitement groupé des mises à jour d'index

### Sécurité et robustesse

- **Validation d'entrée** : Sanitisation de tous les inputs utilisateur
- **Contrôle d'accès** : Vérification des permissions sur les répertoires
- **Atomicité** : Transactions atomiques pour les modifications multiples
- **Logging** : Traçabilité complète des opérations (si LLM_TRACIBILITY=TRUE)

---

*Commande créée selon les spécifications AI-KIDO avec intégration complète de la taxonomie et du format AGENTS.md standard*
