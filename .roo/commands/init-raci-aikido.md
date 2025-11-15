---
description: "Initialiser la matrice RACI et les spécifications d'équipe AI-KIDO pour définir la hiérarchie des sous-répertoires par rôles"
---

# Commande Init-RACI-Aikido

Initialise la matrice RACI et les spécifications d'équipe AI-KIDO en analysant les sources disponibles ou par saisie manuelle. Génère un fichier de spécifications dans [`/prompts/hard_points/`](../prompts/hard_points/) qui servira de base pour la hiérarchie des sous-répertoires selon la règle 15.

## Exécution

### Phase 1 : Identification de l'Équipe

Poser la **Question 1 : Nom de l'équipe**
```
Quel est le nom de votre équipe pour cette matrice RACI ?

Exemples : 
- dev-team
- product-squad
- architecture-team
- full-stack-crew

Nom de l'équipe : [TEAM-NAME]
```

### Phase 2 : Sélection des Sources d'Analyse

Poser la **Question 2 : Sources d'analyse**
```
Quelles sources voulez-vous analyser pour construire la matrice RACI ?

Options disponibles :
1. Documents existants (hard_points, documentation équipe)
2. Analyse des structures existantes dans /prompts/gen/
3. Saisie manuelle complète (questionnaire guidé)
4. Analyse combinée (documents + structures existantes)

Votre choix (1/2/3/4) :
```

**Si choix 1** : Scanner les documents disponibles
```
📄 DOCUMENTS DISPONIBLES POUR ANALYSE :

Hard points détectés :
[Liste automatique des fichiers dans /prompts/hard_points/]

Documentation équipe détectée :
[Liste automatique : TEAM.md, ROLES.md, RESPONSIBILITIES.md, etc.]

Voulez-vous analyser tous ces documents ? (o/n)
Si non, sélectionnez les documents à analyser :
```

**Si choix 2** : Analyser les structures existantes
```
🏗️ ANALYSE DES STRUCTURES EXISTANTES :

Structures détectées dans /prompts/gen/ :
- Concepts : [NOMBRE] fichiers
- Techniques : [NOMBRE] fichiers  
- Use cases : [NOMBRE] fichiers
- Personas : [NOMBRE] fichiers

Rôles déjà identifiés :
[Liste des rôles détectés dans les matrices RACI existantes]

Analyser ces structures pour déduire l'organisation RACI ? (o/n)
```

**Si choix 3** : Mode manuel (passer directement à la Phase 4)

**Si choix 4** : Combiner documents + structures automatiquement

### Phase 3 : Extraction et Analyse des Informations

#### 3.1 Analyse des Documents (si choix 1 ou 4)

**A. Extraction des Rôles et Responsabilités** :
1. **Rôles identifiés** :
   - Titres de postes mentionnés
   - Responsabilités décrites
   - Compétences requises
   - Domaines d'expertise

2. **Processus et activités** :
   - Workflows décrits
   - Étapes de validation
   - Cycles de développement
   - Procédures de review

3. **Technologies et domaines** :
   - Stack technique utilisée
   - Domaines fonctionnels
   - Outils et plateformes
   - Environnements de travail

#### 3.2 Analyse des Structures Existantes (si choix 2 ou 4)

**B. Déduction depuis /prompts/gen/** :
1. **Rôles implicites** :
   - Analyse des personas existants
   - Responsabilités dans les matrices RACI
   - Spécialisations par domaine

2. **Organisation actuelle** :
   - Structure des sous-répertoires
   - Répartition des contenus
   - Patterns de responsabilité

#### 3.3 Synthèse Automatique (si analyse effectuée)

**Présenter la synthèse des informations détectées** :
```
📊 SYNTHÈSE DE L'ANALYSE AUTOMATIQUE :

Équipe : [TEAM-NAME]

Rôles identifiés :
- [Rôle 1] : [Description et responsabilités]
- [Rôle 2] : [Description et responsabilités]
- [Rôle 3] : [Description et responsabilités]
- [Rôle 4] : [Description et responsabilités]

Domaines de responsabilité détectés :
- Architecture : [Rôles concernés]
- Développement : [Rôles concernés]
- Métier/Fonctionnel : [Rôles concernés]
- Opérations/DevOps : [Rôles concernés]
- Qualité/Tests : [Rôles concernés]

Cette synthèse est-elle correcte ? (o/n)
Si non, quels éléments corriger ?
```

### Phase 4 : Collecte Manuelle des Informations (si mode manuel ou corrections)

#### 4.1 Définition des Rôles de l'Équipe

Poser la **Question 3 : Rôles de l'équipe**
```
Définissez les rôles de votre équipe [TEAM-NAME] :

Format : Nom du rôle | Description | Domaines d'expertise
Exemple : "Tech Lead | Responsable technique et architecture | Backend, APIs, Performance"

Entrez les rôles (un par ligne, ou 'fin' pour terminer) :
```

#### 4.2 Définition du Workflow de Production Organisationnel

Poser la **Question 4 : Workflow de production AI-KIDO**
```
Définissez le workflow général de production de votre organisation utilisant AI-KIDO.

Ce workflow représente les étapes générales de production de connaissances et de solutions,
indépendamment du domaine métier spécifique de votre société.

Workflow AI-KIDO standard (modifiable selon votre organisation) :

1. ANALYSE & RECHERCHE
   - Analyse des besoins et contexte
   - Recherche de solutions existantes
   - Identification des contraintes

2. CONCEPTION & ARCHITECTURE
   - Design de la solution
   - Architecture des composants
   - Spécifications techniques

3. DÉVELOPPEMENT & IMPLÉMENTATION
   - Réalisation de la solution
   - Intégration des composants
   - Tests unitaires

4. VALIDATION & QUALITÉ
   - Tests d'intégration
   - Validation fonctionnelle
   - Contrôle qualité

5. DÉPLOIEMENT & LIVRAISON
   - Mise en production
   - Documentation utilisateur
   - Formation et support

6. MAINTENANCE & ÉVOLUTION
   - Support opérationnel
   - Corrections et améliorations
   - Évolutions fonctionnelles

Souhaitez-vous utiliser ce workflow standard ? (o/n)
Si non, définissez votre workflow organisationnel :
```

#### 4.3 Définition des Domaines de Connaissance Organisationnels

Poser la **Question 5 : Domaines de connaissance AI-KIDO**
```
Quels sont les domaines de connaissance que votre organisation maîtrise
dans le cadre de l'utilisation d'AI-KIDO ?

Ces domaines représentent l'expertise collective de votre organisation,
indépendamment du secteur d'activité spécifique.

Domaines AI-KIDO par catégorie :

CONCEPTS (Connaissances fondamentales) :
- Architecture et Design Patterns
- Méthodologies et Frameworks
- Principes de Qualité
- Gestion des Connaissances
- Innovation et R&D

TECHNIQUES (Savoir-faire pratiques) :
- Technologies et Outils
- Méthodes de Développement
- Techniques de Validation
- Processus d'Intégration
- Optimisation et Performance

USE CASES (Applications pratiques) :
- Patterns de Solutions
- Cas d'Usage Récurrents
- Scénarios de Déploiement
- Workflows Opérationnels
- Retours d'Expérience

MÉTIER (Expertise sectorielle - optionnel) :
- Domaine d'activité de votre société
- Réglementations spécifiques
- Contraintes sectorielles
- Standards métier

Organisez vos domaines par catégorie :
Concepts : [liste des concepts maîtrisés]
Techniques : [liste des techniques utilisées]
Use Cases : [liste des cas d'usage types]
Métier (optionnel) : [expertise sectorielle]
```

### Phase 5 : Construction de la Matrice RACI

#### 5.1 Génération de la Matrice RACI

**Construire automatiquement la matrice** en croisant :
- Rôles identifiés (colonnes)
- Activités/Processus (lignes)
- Domaines de connaissance (contexte)

**Présenter la matrice pour validation** :
```
📋 MATRICE RACI GÉNÉRÉE POUR L'ÉQUIPE [TEAM-NAME] :

| Activité/Processus | [Rôle 1] | [Rôle 2] | [Rôle 3] | [Rôle 4] |
|-------------------|----------|----------|----------|----------|
| Conception Architecture | R | C | I | I |
| Développement Features | C | R | C | I |
| Code Review | A | R | C | I |
| Tests et Validation | I | C | R | A |
| Déploiement | I | C | A | R |
| Documentation | C | C | I | R |

**Légende** : R=Responsable, A=Approbateur, C=Consulté, I=Informé

Cette matrice est-elle correcte ? (o/n)
Modifications souhaitées :
```

#### 5.2 Définition de la Hiérarchie des Sous-répertoires

**Générer la structure des sous-répertoires** basée sur la matrice RACI :
```
🏗️ HIÉRARCHIE DES SOUS-RÉPERTOIRES PROPOSÉE :

/prompts/gen/concepts/roles/
├── [role-1-slug]/          # Responsable des concepts [domaines]
├── [role-2-slug]/          # Responsable des concepts [domaines]
├── [role-3-slug]/          # Responsable des concepts [domaines]
└── [role-4-slug]/          # Responsable des concepts [domaines]

/prompts/gen/techniques/roles/
├── [role-1-slug]/          # Responsable des techniques [domaines]
├── [role-2-slug]/          # Responsable des techniques [domaines]
├── [role-3-slug]/          # Responsable des techniques [domaines]
└── [role-4-slug]/          # Responsable des techniques [domaines]

/prompts/gen/use_cases/roles/
├── [role-1-slug]/          # Responsable des use cases [domaines]
├── [role-2-slug]/          # Responsable des use cases [domaines]
├── [role-3-slug]/          # Responsable des use cases [domaines]
└── [role-4-slug]/          # Responsable des use cases [domaines]

Cette structure est-elle appropriée ? (o/n)
```

### Phase 6 : Génération du Fichier de Spécifications

#### 6.1 Création du Fichier Hard Point

Créer [`/prompts/hard_points/aikido-raci-[TEAM-NAME].md`](../prompts/hard_points/aikido-raci-[TEAM-NAME].md) :
```markdown
# Spécifications RACI AI-KIDO - Équipe [TEAM-NAME]
> Version: 1.0 | Date: [DATE] | Statut: Spécification | Type: Hard Point

## Vue d'ensemble
Spécifications de la matrice RACI et organisation par rôles pour l'équipe [TEAM-NAME].
**Ce fichier définit la vérité immuable de l'organisation de l'équipe.**

## Équipe [TEAM-NAME]

### Composition de l'Équipe
[Description de l'équipe et de son contexte]

### Rôles Définis

#### [Rôle 1]
- **Description** : [Description du rôle]
- **Responsabilités principales** : [Liste des responsabilités]
- **Domaines d'expertise** : [Domaines de connaissance]
- **Slug répertoire** : `[role-1-slug]`

#### [Rôle 2]
- **Description** : [Description du rôle]
- **Responsabilités principales** : [Liste des responsabilités]
- **Domaines d'expertise** : [Domaines de connaissance]
- **Slug répertoire** : `[role-2-slug]`

[... autres rôles ...]

## Matrice RACI

### Activités et Processus

| Activité/Processus | [Rôle 1] | [Rôle 2] | [Rôle 3] | [Rôle 4] |
|-------------------|----------|----------|----------|----------|
| [Activité 1] | R/A/C/I | R/A/C/I | R/A/C/I | R/A/C/I |
| [Activité 2] | R/A/C/I | R/A/C/I | R/A/C/I | R/A/C/I |
| [Activité 3] | R/A/C/I | R/A/C/I | R/A/C/I | R/A/C/I |

**Légende** : R=Responsable, A=Approbateur, C=Consulté, I=Informé

### Domaines de Connaissance par Rôle

#### Concepts
- **[Rôle X]** : [Liste des concepts sous sa responsabilité]
- **[Rôle Y]** : [Liste des concepts sous sa responsabilité]

#### Techniques  
- **[Rôle X]** : [Liste des techniques sous sa responsabilité]
- **[Rôle Y]** : [Liste des techniques sous sa responsabilité]

#### Use Cases
- **[Rôle X]** : [Liste des use cases sous sa responsabilité]
- **[Rôle Y]** : [Liste des use cases sous sa responsabilité]

## Hiérarchie des Sous-répertoires AI-KIDO

### Structure Générée

```
/prompts/gen/concepts/roles/
├── [role-1-slug]/          # [Rôle 1] - [Domaines]
├── [role-2-slug]/          # [Rôle 2] - [Domaines]
├── [role-3-slug]/          # [Rôle 3] - [Domaines]
└── [role-4-slug]/          # [Rôle 4] - [Domaines]

/prompts/gen/techniques/roles/
├── [role-1-slug]/          # [Rôle 1] - [Domaines]
├── [role-2-slug]/          # [Rôle 2] - [Domaines]
├── [role-3-slug]/          # [Rôle 3] - [Domaines]
└── [role-4-slug]/          # [Rôle 4] - [Domaines]

/prompts/gen/use_cases/roles/
├── [role-1-slug]/          # [Rôle 1] - [Domaines]
├── [role-2-slug]/          # [Rôle 2] - [Domaines]
├── [role-3-slug]/          # [Rôle 3] - [Domaines]
└── [role-4-slug]/          # [Rôle 4] - [Domaines]
```

## Règles de Collaboration Git

### Workflow de Validation
1. **Création de contenu** : Le rôle responsable crée le contenu dans son sous-répertoire
2. **Review interne** : Les rôles "Consulté" valident le contenu
3. **Approbation finale** : Le rôle "Approbateur" valide la fusion
4. **Information** : Les rôles "Informé" sont notifiés des changements

### Assignation des MR/PR
- **Modifications dans `[role-X-slug]/`** → Assigné au [Rôle X]
- **Modifications transversales** → Validation par tous les rôles concernés
- **Conflits de responsabilité** → Escalade selon la matrice RACI

## Métadonnées

- **Équipe** : [TEAM-NAME]
- **Nombre de rôles** : [NOMBRE]
- **Domaines couverts** : [LISTE_DOMAINES]
- **Date de création** : [DATE]
- **Dernière mise à jour** : [DATE]

---
*Spécifications générées automatiquement par init-raci-aikido le [DATE]*
*Règle AI-KIDO 15 appliquée - Répartition par rôles humains*
```

### Phase 7 : Mise à Jour de l'Indexation Générale

#### 7.1 Mise à Jour de l'Index Hard Points

Mettre à jour [`/prompts/hard_points/index.md`](../prompts/hard_points/index.md) :
```markdown
## Spécifications d'Équipe

- [`aikido-raci-[TEAM-NAME].md`](aikido-raci-[TEAM-NAME].md) : Matrice RACI et organisation par rôles - Équipe [TEAM-NAME]
```

#### 7.2 Mise à Jour de l'Index Principal

Mettre à jour [`/prompts/gen/index.md`](../prompts/gen/index.md) avec :
- Référence aux nouvelles spécifications RACI
- Structure par rôles définie
- Équipe [TEAM-NAME] documentée

#### 7.3 Création/Mise à Jour du Fichier AGENTS.md

**Si AGENTS.md existe**, le mettre à jour avec :
```markdown
# AI Agents Configuration

## Team Organization - [TEAM-NAME]

### RACI Matrix
- **Specifications**: [`prompts/hard_points/aikido-raci-[TEAM-NAME].md`](prompts/hard_points/aikido-raci-[TEAM-NAME].md)
- **Team Size**: [NOMBRE] roles defined
- **Structure**: Role-based sub-directories according to AI-KIDO Rule 15

### Role-Based Knowledge Organization

#### [Rôle 1] - `[role-1-slug]`
- **Responsibilities**: [Responsabilités principales]
- **Knowledge Domains**: [Domaines d'expertise]
- **Directory Structure**: 
  - `prompts/gen/concepts/roles/[role-1-slug]/`
  - `prompts/gen/techniques/roles/[role-1-slug]/`
  - `prompts/gen/use_cases/roles/[role-1-slug]/`

[... autres rôles ...]

### Agent Interaction Guidelines

#### Role-Based Validation
- Agents MUST respect the RACI matrix for content validation
- Content creation MUST follow role-based directory structure
- Cross-role collaboration MUST follow the defined workflow

#### Git Collaboration Rules
- MR/PR assignments based on role responsibilities
- Approval workflow according to RACI definitions
- Conflict resolution following team hierarchy

---
*Updated by init-raci-aikido on [DATE] - Team [TEAM-NAME] specifications*
```

## Messages de Confirmation

### Succès - Spécifications RACI Créées
```
✅ Spécifications RACI AI-KIDO créées avec succès !

Équipe : [TEAM-NAME]

Fichier créé :
- /prompts/hard_points/aikido-raci-[TEAM-NAME].md

Spécifications générées :
- [X] rôles définis
- [Y] activités/processus mappés
- [Z] domaines de connaissance organisés
- Matrice RACI complète : ✅
- Hiérarchie sous-répertoires : ✅

Structure par rôles :
- /prompts/gen/concepts/roles/ : [NOMBRE] sous-répertoires
- /prompts/gen/techniques/roles/ : [NOMBRE] sous-répertoires  
- /prompts/gen/use_cases/roles/ : [NOMBRE] sous-répertoires

Index mis à jour :
- /prompts/hard_points/index.md
- /prompts/gen/index.md
- AGENTS.md (mis à jour)

🎯 Organisation RACI prête pour l'équipe [TEAM-NAME] !
```

## Gestion des Erreurs

- **Documents spécifiés introuvables** : Lister les fichiers manquants et proposer mode manuel
- **Structures /gen/ inaccessibles** : Signaler et continuer en mode manuel
- **Nom d'équipe invalide** : Redemander avec format valide (alphanumerique + tirets)
- **Rôles insuffisants** : Minimum 2 rôles requis, maximum 7 recommandé
- **Matrice RACI incohérente** : Valider qu'au moins un R par activité
- **Conflits de responsabilité** : Proposer résolution des ambiguïtés
- **Erreur création fichier** : Proposer répertoire alternatif
- **AGENTS.md corrompu** : Créer sauvegarde avant mise à jour

## Règles AI-KIDO Respectées

- ✅ **Règle 15** : Répartition par rôles humains avec sous-répertoires spécialisés
- ✅ **Hard Point** : Spécifications stockées comme vérité immuable
- ✅ **Matrice RACI** : Attribution claire des responsabilités
- ✅ **Hiérarchie cohérente** : Structure respectant les contraintes d'équilibrage
- ✅ **Collaboration Git** : Workflow défini selon les rôles
- ✅ **Indexation complète** : Mise à jour de tous les index
- ✅ **Format Markdown** : Spécifications structurées et lisibles
- ✅ **Métadonnées** : Traçabilité et versioning
- ✅ **Auto-alimentation** : Intégration dans la memory bank AI-KIDO

---
