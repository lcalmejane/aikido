---
description: "Initialiser la matrice RACI et les spécifications d'équipe AI-KIDO pour définir la hiérarchie des sous-répertoires par rôles"
---

# Commande Init-RACI-Aikido

Initialise la matrice RACI et les spécifications d'équipe AI-KIDO en analysant les sources disponibles ou par saisie manuelle. Génère un fichier de spécifications dans [`/prompts/hard_points/`](../prompts/hard_points/) qui servira de base pour la hiérarchie des sous-répertoires selon la règle 15.

**ADAPTATION SELON LE MODE AI-KIDO** : Cette commande détecte automatiquement si AI-KIDO est en mode STANDARD ou LIGHT et adapte son comportement.

## Exécution

### Phase 0 : Détection du Mode AI-KIDO

**PREMIÈRE ÉTAPE OBLIGATOIRE** : Détecter le mode AI-KIDO actuel.

1. **Lire `/prompts/index.md`** pour identifier le mode
2. **Détecter la référence** : `ai-kido.md` (STANDARD) ou `ai-kido-light.md` (LIGHT)
3. **Stocker le mode** : `AIKIDO_MODE = [STANDARD|LIGHT]`

```
ℹ️ MODE AI-KIDO DÉTECTÉ : [STANDARD/LIGHT]

Mode STANDARD :
- RACI complet multi-acteurs
- Structure par rôles avec sous-répertoires
- 4-7 rôles recommandés

Mode LIGHT :
- RACI optionnel ou minimal (2-3 rôles max)
- Acteur unique possible
- Structure simplifiée

Poursuite de l'initialisation RACI en mode [STANDARD/LIGHT]...
```

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

### Phase 3 : Extraction et Analyse des Informations 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-explore-bank` pour extraction intelligente :

```markdown
🤖 AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

**Prompt pour l'agent** :
"Extrais les informations nécessaires pour initialiser la matrice RACI AI-KIDO de l'équipe [TEAM-NAME].

Sources à analyser selon choix utilisateur :
- Choix 1 : Documents hard_points, documentation équipe
- Choix 2 : Structures existantes dans /prompts/gen/
- Choix 3 : (Mode manuel - passer cette phase)
- Choix 4 : Combinaison documents + structures

Informations à extraire :

1. **Rôles identifiés** depuis documents :
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

4. **Rôles implicites** depuis /prompts/gen/ :
   - Analyse des personas existants
   - Responsabilités dans matrices RACI existantes
   - Spécialisations par domaine
   - Structure sous-répertoires (roles/)

5. **Organisation actuelle** :
   - Répartition des contenus
   - Patterns de responsabilité

Pour chaque rôle identifié, retourne :
- Nom du rôle
- Description et responsabilités
- Domaines d'expertise
- Source (document ou structure)
- Niveau de confiance (HIGH/MEDIUM/LOW)

Synthèse des domaines de responsabilité :
- Architecture : [Rôles concernés]
- Développement : [Rôles concernés]
- Métier/Fonctionnel : [Rôles concernés]
- Opérations/DevOps : [Rôles concernés]
- Qualité/Tests : [Rôles concernés]

Retourne un rapport structuré complet."

**Résultat attendu** : Synthèse automatique rôles et responsabilités
```

Afficher en temps réel :
```
🔍 ANALYSE AUTOMATIQUE (agent-aikido-explore-bank)...

✓ Documents analysés : [NOMBRE]
✓ Structures analysées : /prompts/gen/
✓ Rôles identifiés : [NOMBRE]
✓ Domaines détectés : [NOMBRE]
✓ Synthèse générée
```

**Avantages de l'agent** :
- ✅ Extraction intelligente multi-sources
- ✅ Déduction rôles depuis structures existantes
- ✅ Scoring confiance pour chaque rôle
- ✅ Gain : ~60% tokens vs analyse manuelle

**Présenter la synthèse** des informations détectées :
```
📊 SYNTHÈSE DE L'ANALYSE AUTOMATIQUE :

Équipe : [TEAM-NAME]

Rôles identifiés :
- [Rôle 1] : [Description et responsabilités] (confiance: [HIGH/MEDIUM/LOW])
- [Rôle 2] : [Description et responsabilités] (confiance: [HIGH/MEDIUM/LOW])
- [Rôle 3] : [Description et responsabilités] (confiance: [HIGH/MEDIUM/LOW])
- [Rôle 4] : [Description et responsabilités] (confiance: [HIGH/MEDIUM/LOW])

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

**Si AIKIDO_MODE = STANDARD** :

Poser la **Question 3 : Rôles de l'équipe (Mode STANDARD)**
```
Définissez les rôles de votre équipe [TEAM-NAME] :

Mode STANDARD : 4-7 rôles recommandés pour une couverture complète

Format : Nom du rôle | Description | Domaines d'expertise
Exemple : "Tech Lead | Responsable technique et architecture | Backend, APIs, Performance"

Entrez les rôles (un par ligne, ou 'fin' pour terminer) :
```

**Si AIKIDO_MODE = LIGHT** :

Poser la **Question 3 : Rôles de l'équipe (Mode LIGHT)**
```
Définissez les rôles de votre équipe [TEAM-NAME] :

Mode LIGHT : Choisissez votre approche

1. Acteur unique (pas de RACI)
   - Un seul responsable pour tout
   - Pas de matrice RACI nécessaire
   - Passer directement à la Phase 7

2. RACI minimal (2-3 rôles maximum)
   - Dev + Lead + Ops (exemple)
   - Matrice simplifiée
   - Responsabilités claires mais limitées

Votre choix (1/2) :

Si choix 2, définissez les 2-3 rôles :
Format : Nom du rôle | Description | Domaines d'expertise
Exemple : "Dev | Développement et implémentation | Full-stack, Tests"

Entrez les rôles (2-3 maximum, ou 'fin' pour terminer) :
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

#### 5.2 Définition de la Hiérarchie des Sous-répertoires 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-raci-delegator` pour génération structure :

```markdown
🤖 AGENT: agent-aikido-raci-delegator
FORMAT: JSON

**Prompt pour l'agent** :
"Génère la hiérarchie optimale des sous-répertoires par rôles pour la matrice RACI de l'équipe [TEAM-NAME].

Entrées :
- Rôles identifiés : [Liste des rôles avec responsabilités]
- Matrice RACI : [Matrice générée Phase 5.1]
- Domaines de connaissance : [Concepts/Techniques/Use Cases]
- Mode AI-KIDO : [STANDARD/LIGHT]

Génération de la structure :
1. **Slugification des rôles** : Créer slugs appropriés pour répertoires
2. **Mapping domaines → rôles** : Assigner responsabilités par domaine
3. **Structure optimale** : Générer arborescence conforme Règle 15
4. **Validation équilibrage** : Vérifier facteur 3-7, profondeur ≤4

Pour chaque rôle, recommande :
- Slug répertoire (ex: architecte-solutions, dev-backend)
- Domaines de responsabilité (concepts/techniques/use_cases)
- Chemins cibles :
  - /prompts/gen/concepts/[role-slug]/
  - /prompts/gen/techniques/[role-slug]/
  - /prompts/gen/use_cases/[role-slug]/

Retourne structure complète avec justifications."

**Résultat attendu** : Hiérarchie optimale sous-répertoires avec mapping rôles
```

Afficher en temps réel :
```
🏗️ GÉNÉRATION HIÉRARCHIE (agent-aikido-raci-delegator)...

✓ Rôles slugifiés : [NOMBRE]
✓ Domaines mappés : [NOMBRE]
✓ Structure générée
✓ Validation équilibrage : ✅
```

**Avantages de l'agent** :
- ✅ Slugification automatique des rôles
- ✅ Mapping intelligent domaines → rôles
- ✅ Validation équilibrage AI-KIDO
- ✅ Gain : ~50% tokens vs génération manuelle

**Présenter la structure générée** :
```
🏗️ HIÉRARCHIE DES SOUS-RÉPERTOIRES PROPOSÉE :

/prompts/gen/concepts/
├── [role-1-slug]/          # Responsable des concepts [domaines]
├── [role-2-slug]/          # Responsable des concepts [domaines]
├── [role-3-slug]/          # Responsable des concepts [domaines]
└── [role-4-slug]/          # Responsable des concepts [domaines]

/prompts/gen/techniques/
├── [role-1-slug]/          # Responsable des techniques [domaines]
├── [role-2-slug]/          # Responsable des techniques [domaines]
├── [role-3-slug]/          # Responsable des techniques [domaines]
└── [role-4-slug]/          # Responsable des techniques [domaines]

/prompts/gen/use_cases/
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
/prompts/gen/concepts/
├── [role-1-slug]/          # [Rôle 1] - [Domaines]
├── [role-2-slug]/          # [Rôle 2] - [Domaines]
├── [role-3-slug]/          # [Rôle 3] - [Domaines]
└── [role-4-slug]/          # [Rôle 4] - [Domaines]

/prompts/gen/techniques/
├── [role-1-slug]/          # [Rôle 1] - [Domaines]
├── [role-2-slug]/          # [Rôle 2] - [Domaines]
├── [role-3-slug]/          # [Rôle 3] - [Domaines]
└── [role-4-slug]/          # [Rôle 4] - [Domaines]

/prompts/gen/use_cases/
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
#### Mode LIGHT : Fichier RACI Minimal ou Absent

**Si choix "Acteur unique"** : Ne pas créer de fichier RACI, passer directement à la Phase 7

**Si choix "RACI minimal"** : Créer [`/prompts/hard_points/aikido-raci-light-[TEAM-NAME].md`](../prompts/hard_points/aikido-raci-light-[TEAM-NAME].md) :
```markdown
# Spécifications RACI Minimales AI-KIDO - Équipe [TEAM-NAME] (Mode LIGHT)
> Version: 1.0 | Date: [DATE] | Statut: Spécification | Type: Hard Point | Mode: LIGHT

## Vue d'ensemble
Spécifications minimales de la matrice RACI pour l'équipe [TEAM-NAME] en mode AI-KIDO Light.
**Ce fichier définit l'organisation minimale de l'équipe (2-3 rôles maximum).**

## Équipe [TEAM-NAME]

### Composition de l'Équipe
[Description de l'équipe et de son contexte en mode Light]

### Rôles Définis (2-3 Maximum)

#### [Rôle 1]
- **Description** : [Description du rôle polyvalent]
- **Responsabilités principales** : [Liste étendue des responsabilités]
- **Domaines d'expertise** : [Multiples domaines couverts]
- **Slug répertoire** : `[role-1-slug]`

#### [Rôle 2]
- **Description** : [Description du rôle polyvalent]
- **Responsabilités principales** : [Liste étendue des responsabilités]
- **Domaines d'expertise** : [Multiples domaines couverts]
- **Slug répertoire** : `[role-2-slug]`

#### [Rôle 3] (Optionnel)
- **Description** : [Description du rôle polyvalent]
- **Responsabilités principales** : [Liste étendue des responsabilités]
- **Domaines d'expertise** : [Multiples domaines couverts]
- **Slug répertoire** : `[role-3-slug]`

## Matrice RACI Minimale

### Activités Essentielles

| Tâche | [Rôle 1] | [Rôle 2] | [Rôle 3] |
|-------|----------|----------|----------|
| Architecture | C | R/A | I |
| Développement | R/A | C | I |
| Déploiement | C | C | R/A |
| Sécurité | R | A | C |
| Tests | R/A | C | I |

**Légende** : R=Responsable, A=Approbateur, C=Consulté, I=Informé

### Domaines de Connaissance par Rôle

#### Concepts (Fichier Unifié)
- **[Rôle X]** : [Concepts sous sa responsabilité dans core-concepts.md]

#### Techniques (Fichier Unifié)
- **[Rôle X]** : [Techniques sous sa responsabilité dans core-techniques.md]

#### Use Cases (3 Maximum)
- **[Rôle X]** : [Use cases sous sa responsabilité dans use-cases-critiques.md]

## Structure Simplifiée (Mode Light)

**Pas de sous-répertoires par rôles** en mode Light. Les fichiers unifiés sont partagés :
```
/prompts/gen/concepts/
└── core-concepts.md          # Fichier unifié partagé

/prompts/gen/techniques/
└── core-techniques.md         # Fichier unifié partagé

/prompts/gen/use_cases/
└── use-cases-critiques.md     # Fichier unifié partagé
```

## Règles de Collaboration Git (Simplifiées)

### Workflow de Validation Minimal
1. **Création de contenu** : Le rôle responsable crée/modifie le contenu
2. **Approbation** : Le rôle approbateur valide
3. **Information** : Les autres rôles sont notifiés

### Assignation des MR/PR
- **Modifications générales** → Assigné selon la matrice RACI minimale
- **Conflits** → Résolution rapide entre les 2-3 rôles

## Métadonnées

- **Équipe** : [TEAM-NAME]
- **Mode** : LIGHT
- **Nombre de rôles** : 2-3
- **Structure** : Fichiers unifiés sans sous-répertoires
- **Date de création** : [DATE]
- **Dernière mise à jour** : [DATE]

---
*Spécifications générées automatiquement par init-raci-aikido le [DATE]*
*Mode AI-KIDO LIGHT - RACI minimal*
```

```

### Phase 7 : Mise à Jour de l'Indexation Générale

**Adapter selon le mode AI-KIDO détecté.**

#### 7.1 Mise à Jour de l'Index Hard Points

**Si AIKIDO_MODE = STANDARD** :

Mettre à jour [`/prompts/hard_points/index.md`](../prompts/hard_points/index.md) :
```markdown
## Spécifications d'Équipe

- [`aikido-raci-[TEAM-NAME].md`](aikido-raci-[TEAM-NAME].md) : Matrice RACI et organisation par rôles - Équipe [TEAM-NAME] (Mode STANDARD)
```

**Si AIKIDO_MODE = LIGHT et RACI minimal** :

Mettre à jour [`/prompts/hard_points/index.md`](../prompts/hard_points/index.md) :
```markdown
## Spécifications d'Équipe

- [`aikido-raci-light-[TEAM-NAME].md`](aikido-raci-light-[TEAM-NAME].md) : Matrice RACI minimale - Équipe [TEAM-NAME] (Mode LIGHT)
```

**Si AIKIDO_MODE = LIGHT et acteur unique** :

Pas de mise à jour nécessaire dans `/prompts/hard_points/index.md` (pas de fichier RACI créé).

#### 7.2 Mise à Jour de l'Index Principal

**Si AIKIDO_MODE = STANDARD** :

Mettre à jour [`/prompts/index.md`](../prompts/index.md) avec :
- Référence aux spécifications RACI STANDARD
- Structure par rôles avec sous-répertoires
- Équipe [TEAM-NAME] documentée

**Si AIKIDO_MODE = LIGHT** :

Mettre à jour [`/prompts/index.md`](../prompts/index.md) avec :
- Référence au mode LIGHT (acteur unique ou RACI minimal)
- Structure simplifiée avec fichiers unifiés
- Équipe [TEAM-NAME] documentée

#### 7.3 Création/Mise à Jour du Fichier AGENTS.md

**Si AIKIDO_MODE = STANDARD** :

**Si AGENTS.md existe**, le mettre à jour avec :
```markdown
# AI Agents Configuration

## Team Organization - [TEAM-NAME]

### Mode: STANDARD
- **Specifications**: [`prompts/hard_points/aikido-raci-[TEAM-NAME].md`](prompts/hard_points/aikido-raci-[TEAM-NAME].md)
- **Team Size**: [NOMBRE] roles defined (4-7 recommandés)
- **Structure**: Role-based sub-directories according to AI-KIDO Rule 15

### Role-Based Knowledge Organization

#### [Rôle 1] - `[role-1-slug]`
- **Responsibilities**: [Responsabilités principales]
- **Knowledge Domains**: [Domaines d'expertise]
- **Directory Structure**:
  - `prompts/gen/concepts/[role-1-slug]/`
  - `prompts/gen/techniques/[role-1-slug]/`
  - `prompts/gen/use_cases/[role-1-slug]/`

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
*Updated by init-raci-aikido on [DATE] - Team [TEAM-NAME] specifications - Mode STANDARD*
```

**Si AIKIDO_MODE = LIGHT et acteur unique** :

**Si AGENTS.md existe**, le mettre à jour avec :
```markdown
# AI Agents Configuration

## Team Organization - [TEAM-NAME]

### Mode: LIGHT - Single Actor
- **Configuration**: Solo developer / Single agent approach
- **Team Size**: 1 actor
- **Structure**: Unified files without role-based sub-directories

### Unified Knowledge Organization

#### Shared Files
- **Concepts**: `prompts/gen/concepts/core-concepts.md`
- **Techniques**: `prompts/gen/techniques/core-techniques.md`
- **Use Cases**: `prompts/gen/use_cases/use-cases-critiques.md` (3-5 max)

### Agent Interaction Guidelines

#### Single Actor Mode
- Single agent responsible for all content
- No RACI matrix required
- Direct content creation and validation
- Simplified workflow optimized for solo work

---
*Updated by init-raci-aikido on [DATE] - Team [TEAM-NAME] specifications - Mode LIGHT (Single Actor)*
```

**Si AIKIDO_MODE = LIGHT et RACI minimal** :

**Si AGENTS.md existe**, le mettre à jour avec :
```markdown
# AI Agents Configuration

## Team Organization - [TEAM-NAME]

### Mode: LIGHT - Minimal RACI
- **Specifications**: [`prompts/hard_points/aikido-raci-light-[TEAM-NAME].md`](prompts/hard_points/aikido-raci-light-[TEAM-NAME].md)
- **Team Size**: 2-3 roles (polyvalent)
- **Structure**: Unified files without role-based sub-directories

### Unified Knowledge Organization

#### Shared Files (No Sub-directories)
- **Concepts**: `prompts/gen/concepts/core-concepts.md`
- **Techniques**: `prompts/gen/techniques/core-techniques.md`
- **Use Cases**: `prompts/gen/use_cases/use-cases-critiques.md` (3-5 max)

#### Minimal Roles

##### [Rôle 1] - `[role-1-slug]`
- **Responsibilities**: [Responsabilités polyvalentes]
- **Knowledge Domains**: [Multiples domaines]
- **Content**: Shared files (no dedicated directories)

##### [Rôle 2] - `[role-2-slug]`
- **Responsibilities**: [Responsabilités polyvalentes]
- **Knowledge Domains**: [Multiples domaines]
- **Content**: Shared files (no dedicated directories)

[Rôle 3 optionnel...]

### Agent Interaction Guidelines

#### Minimal RACI Validation
- Agents respect the minimal RACI matrix (2-3 roles)
- Content creation in shared unified files
- Simplified validation workflow
- Quick conflict resolution between limited roles

#### Git Collaboration Rules (Simplified)
- MR/PR assignments based on minimal RACI
- Fast approval workflow
- Direct communication between 2-3 roles

---
*Updated by init-raci-aikido on [DATE] - Team [TEAM-NAME] specifications - Mode LIGHT (Minimal RACI)*
```

## Messages de Confirmation

**Afficher le message approprié selon le mode et le choix effectué.**

### Mode STANDARD : Succès - Spécifications RACI Créées
```
✅ Spécifications RACI AI-KIDO créées avec succès en mode STANDARD !

Équipe : [TEAM-NAME]
Mode : STANDARD

Fichier créé :
- /prompts/hard_points/aikido-raci-[TEAM-NAME].md

Spécifications générées :
- [X] rôles définis (4-7 recommandés)
- [Y] activités/processus mappés
- [Z] domaines de connaissance organisés
- Matrice RACI complète : ✅
- Hiérarchie sous-répertoires : ✅

Structure par rôles :
- /prompts/gen/concepts/ : [NOMBRE] sous-répertoires
- /prompts/gen/techniques/ : [NOMBRE] sous-répertoires
- /prompts/gen/use_cases/ : [NOMBRE] sous-répertoires

Index mis à jour :
- /prompts/hard_points/index.md
- /prompts/index.md
- AGENTS.md (mis à jour)

🎯 Organisation RACI STANDARD prête pour l'équipe [TEAM-NAME] !
   Structure complète avec sous-répertoires par rôles.
```

### Mode LIGHT - Acteur Unique : Succès - Configuration Simplifiée
```
✅ Configuration AI-KIDO LIGHT avec acteur unique !

Équipe : [TEAM-NAME]
Mode : LIGHT - Acteur Unique

Configuration :
- Pas de fichier RACI (acteur unique)
- Pas de sous-répertoires par rôles
- Structure simplifiée avec fichiers unifiés

Fichiers utilisés :
- /prompts/gen/concepts/core-concepts.md
- /prompts/gen/techniques/core-techniques.md
- /prompts/gen/use_cases/use-cases-critiques.md

Index mis à jour :
- /prompts/index.md
- AGENTS.md (mis à jour - Mode LIGHT)

🎯 Configuration LIGHT acteur unique prête pour [TEAM-NAME] !
   Approche solo developer optimisée.
```

### Mode LIGHT - RACI Minimal : Succès - Spécifications Minimales
```
✅ Spécifications RACI minimales AI-KIDO créées avec succès en mode LIGHT !

Équipe : [TEAM-NAME]
Mode : LIGHT - RACI Minimal

Fichier créé :
- /prompts/hard_points/aikido-raci-light-[TEAM-NAME].md

Spécifications générées :
- [2-3] rôles définis (polyvalents)
- Activités essentielles mappées
- Matrice RACI minimale : ✅
- Structure simplifiée : ✅

Structure unifiée (pas de sous-répertoires) :
- /prompts/gen/concepts/core-concepts.md (partagé)
- /prompts/gen/techniques/core-techniques.md (partagé)
- /prompts/gen/use_cases/use-cases-critiques.md (partagé)

Index mis à jour :
- /prompts/hard_points/index.md
- /prompts/index.md
- AGENTS.md (mis à jour - Mode LIGHT)

🎯 Organisation RACI LIGHT prête pour l'équipe [TEAM-NAME] !
   Structure minimale avec 2-3 rôles et fichiers unifiés.
```

### Phase 8 : Validation Finale Conformité 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-validator` pour validation post-génération :

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

**Prompt pour l'agent** :
"Valide la conformité AI-KIDO du fichier RACI généré et de la structure créée.

Fichiers à valider :
- /prompts/hard_points/aikido-raci-[TEAM-NAME].md (Mode STANDARD)
  OU /prompts/hard_points/aikido-raci-light-[TEAM-NAME].md (Mode LIGHT)
- /prompts/hard_points/index.md (mis à jour)
- /prompts/gen/index.md (mis à jour)
- /prompts/index.md (mis à jour)
- AGENTS.md (mis à jour, si existant)

Validation spécifique RACI :
1. Règle 4 : Contraintes lignes (≤500 lignes hard point RACI)
2. Règle 15 : Répartition par rôles (si Mode STANDARD)
3. Frontmatter valide (version, date, statut, type: Hard Point)
4. Matrice RACI cohérente (au moins un R par activité)
5. Hiérarchie sous-répertoires proposée conforme (facteur 3-7, profondeur ≤4)
6. Liens bidirectionnels (hard point RACI ↔ index ↔ AGENTS.md)

Pour chaque violation détectée :
- Fichier + violation
- Sévérité (CRITIQUE/MAJEURE/MINEURE)
- Quick fix

Génère score conformité :
- Fichiers validés : [TOTAL]
- Conformes : [NOMBRE] (✅)
- Non-conformes : [NOMBRE] (❌)
- Score conformité : [POURCENTAGE]%

Mode rapide : <3k tokens."

**Résultat attendu** : Score conformité finale avec violations éventuelles
```

Afficher en temps réel :
```
✅ VALIDATION FINALE (agent-aikido-validator)...

✓ Fichier RACI : [X]/500 lignes ✅
✓ Règle 15 (répartition rôles) : ✅
✓ Frontmatter : ✅
✓ Matrice RACI cohérente : ✅
✓ Hiérarchie conforme : ✅
✓ Liens bidirectionnels : ✅
✓ Score conformité : [POURCENTAGE]%
```

**Avantages de l'agent** :
- ✅ Validation systématique post-génération
- ✅ Score conformité immédiat
- ✅ Quick fixes si violations
- ✅ Garantie qualité structure RACI

**Si score < 90%** : Afficher violations et proposer corrections
**Si score ≥ 90%** : Confirmer initialisation réussie

## 🤖 Récapitulatif des Agents AI-KIDO Utilisés

Cette commande optimise l'initialisation RACI en utilisant **3 agents AI-KIDO spécialisés** :

### Phase 3 : `agent-aikido-explore-bank` (DEEP MODE) 🆕
- **Rôle** : Extraction intelligente rôles et responsabilités depuis documents et structures
- **Output** : Synthèse automatique rôles avec scoring confiance
- **Tokens** : ~25-40k (DEEP mode)
- **Gain** : ~60% tokens vs analyse manuelle

### Phase 5.2 : `agent-aikido-raci-delegator` 🆕
- **Rôle** : Génération hiérarchie optimale sous-répertoires par rôles
- **Output** : Structure complète avec slugs et mapping domaines
- **Tokens** : Optimisé selon nombre de rôles
- **Gain** : ~50% tokens vs génération manuelle

### Phase 8 : `agent-aikido-validator` 🆕
- **Rôle** : Validation finale conformité AI-KIDO du fichier RACI
- **Output** : Score conformité avec violations et quick fixes
- **Tokens** : <3k
- **Gain** : Garantie qualité + validation systématique

### 📊 Gains d'Optimisation

| Aspect | Avant (manuel) | Après (agents) | Gain |
|--------|----------------|----------------|------|
| **Extraction rôles** | Analyse manuelle docs | agent-explore-bank auto | ~60% tokens |
| **Génération hiérarchie** | Manuelle avec slugs | agent-raci-delegator auto | ~50% tokens |
| **Validation finale** | Manuelle ou absente | agent-validator systématique | +Garantie qualité |
| **Workflow global** | ~70k tokens | ~40k tokens | **~43% efficacité** |

## Gestion des Erreurs

### Erreurs Communes (Tous Modes)

- **Agent explore-bank indisponible** : Mode dégradé avec analyse manuelle
- **Agent raci-delegator indisponible** : Génération manuelle slugs et structure
- **Agent validator indisponible** : Validation manuelle (wc -l, grep)
- **Documents spécifiés introuvables** : Lister les fichiers manquants et proposer mode manuel
- **Structures /gen/ inaccessibles** : Signaler et continuer en mode manuel
- **Nom d'équipe invalide** : Redemander avec format valide (alphanumerique + tirets)
- **Erreur création fichier** : Proposer répertoire alternatif
- **AGENTS.md corrompu** : Créer sauvegarde avant mise à jour
- **Mode AI-KIDO non détecté** : Demander à l'utilisateur de choisir STANDARD ou LIGHT

### Erreurs Spécifiques Mode STANDARD

- **Rôles insuffisants** : Minimum 2 rôles requis, 4-7 recommandés pour STANDARD
- **Matrice RACI incohérente** : Valider qu'au moins un R par activité
- **Conflits de responsabilité** : Proposer résolution des ambiguïtés
- **Trop de rôles** : Avertir si > 7 rôles (complexité excessive)

### Erreurs Spécifiques Mode LIGHT

- **Trop de rôles en mode LIGHT** : Maximum 3 rôles autorisés en mode LIGHT
- **RACI minimal incohérent** : Valider qu'au moins un R par activité essentielle
- **Acteur unique avec RACI** : Confirmer que l'utilisateur veut vraiment un RACI avec un seul acteur (recommander acteur unique sans RACI)
- **Fichiers unifiés manquants** : Vérifier l'existence de core-concepts.md, core-techniques.md, use-cases-critiques.md

## Règles AI-KIDO Respectées

### Mode STANDARD

- ✅ **Règle 15** : Répartition par rôles humains avec sous-répertoires spécialisés
- ✅ **Hard Point** : Spécifications stockées comme vérité immuable
- ✅ **Matrice RACI** : Attribution claire des responsabilités (4-7 rôles)
- ✅ **Hiérarchie cohérente** : Structure respectant les contraintes d'équilibrage
- ✅ **Collaboration Git** : Workflow défini selon les rôles
- ✅ **Indexation complète** : Mise à jour de tous les index
- ✅ **Format Markdown** : Spécifications structurées et lisibles
- ✅ **Métadonnées** : Traçabilité et versioning
- ✅ **Auto-alimentation** : Intégration dans la memory bank AI-KIDO

### Mode LIGHT

- ✅ **Agent Unitaire** : Support de l'acteur unique (concept AGENTS.md)
- ✅ **RACI Minimal** : Matrice simplifiée (2-3 rôles max) ou absente
- ✅ **Fichiers Unifiés** : core-concepts.md, core-techniques.md, use-cases-critiques.md
- ✅ **Densité Sémantique** : Maximum d'information par fichier
- ✅ **Structure Simplifiée** : Pas de sous-répertoires par rôles
- ✅ **Hard Point Optionnel** : Fichier RACI créé uniquement si nécessaire
- ✅ **Indexation Adaptée** : Mise à jour selon le mode choisi
- ✅ **Format Markdown** : Spécifications structurées et lisibles
- ✅ **Métadonnées** : Traçabilité et versioning avec indication du mode
- ✅ **Flexibilité** : Choix entre acteur unique et RACI minimal

---
