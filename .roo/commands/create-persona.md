---
description: "Créer un nouveau persona AI-KIDO avec architecture simplifiée"
---

# Commande Create-Persona 

Cette commande permet de créer rapidement un nouveau persona AI-KIDO avec seulement 3 questions essentielles.

## Flux simplifié

### 1. Collecte des informations (3 questions optimisées)

**Question 1 : Identité du persona**
```
Entrez le nom et la spécialisation du persona :
Format : Nom | Spécialisation
Exemple : "Arthur Architect | Architecture logicielle"
```

**Question 2 : Rôle et contexte**
```
Décrivez en format libre :
- Description du rôle
- Domaines d'expertise
- Contextes d'utilisation

Entrez la description complète :
```

**Question 3 : Permissions**
```
Quelles permissions sont nécessaires ?
Choisir parmi : read, edit, browser, command
Entrez les permissions (séparées par des virgules) :
```

### 1.1 Génération automatique

Après la Question 1, le système génère automatiquement :
- **Slug** : Conversion automatique du nom en format slug (ex: "Arthur Architect" → "arthur-architect")
- **Emoji** : Sélection automatique basée sur la spécialisation :
  - Architecture → 🏗️
  - Développement → 💻
  - Sécurité → 🔒
  - Qualité/Test → 🔍
  - DevOps/Déploiement → 🚀
  - Design → 🎨
  - Data → 📊
  - Mobile → 📱
  - Par défaut → 🤖

### 2. Validation et génération

#### 2.1 Génération du slug
- Convertir le nom en slug (minuscules, espaces → tirets, caractères spéciaux supprimés)
- Exemple : "Arthur Architect" → "arthur-architect"

#### 2.2 Validation d'unicité
- Vérifier l'unicité du slug généré dans `.roomodes` existant
- Si conflit, proposer des alternatives : [slug]-v2, [slug]-alt, etc.

### 3. Création des fichiers

#### 3.1 Créer le fichier persona

Créer `prompts/gen/personas/[slug].md` :

```markdown
# [emoji] [nom] - [spécialisation]

## Rôle
[description du rôle]

## Spécialisation
[spécialisation]

## Domaines d'expertise
[domaines extraits]

## Contextes d'utilisation
[contextes extraits]

## Permissions
[permissions]

---
*Persona créé le [date] via create-persona*
```

#### 3.2 Mettre à jour .roomodes

Si `.roomodes` n'existe pas, le créer :
```yaml
customModes:
  - slug: [slug]
    name: [emoji] [nom] - [spécialisation]
    roleDefinition: >-
      [description du rôle]
    whenToUse: >-
      [contextes d'utilisation]
    groups:
      [permissions en format liste YAML]
```

Si `.roomodes` existe, ajouter le nouveau mode à la liste `customModes`.

#### 3.3 Créer ou mettre à jour AGENTS.md (format standard)

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

### [emoji] [nom] - [spécialisation]

**Rôle** : [description du rôle]

**Spécialisation** : [spécialisation]

**Contextes d'utilisation** : [contextes d'utilisation]

**Permissions** : [permissions]

---

*Fichier généré automatiquement par le système AI-KIDO - Format standard AGENTS.md*
```

Si le fichier existe, ajouter la nouvelle section persona dans la section "Personas disponibles".

### 4. Confirmation

Afficher le message de succès :
```
✅ Persona "[nom]" créé avec succès !

Fichiers créés/modifiés :
- prompts/gen/personas/[slug].md
- .roomodes (créé/mis à jour)
- AGENTS.md (créé/mis à jour)

Utilisez le slug "[slug]" pour activer ce persona.
```

## Gestion des erreurs

- **Slug généré existant** : Proposer automatiquement [slug]-v2, [slug]-alt, etc.
- **Permissions invalides** : Redemander avec liste des permissions valides
- **Format nom/spécialisation incorrect** : Redemander avec exemple du format requis (Nom | Spécialisation)
- **Génération emoji échouée** : Utiliser l'emoji par défaut 🤖

---

