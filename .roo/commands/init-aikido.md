---
description: "Initialiser la memory bank AI-KIDO avec les éléments fondamentaux du projet"
---

# Commande Init-Aikido

Initialise la memory bank AI-KIDO en créant directement les fichiers de base dans `/prompts/gen/` selon les règles aikido. Cette commande ne crée pas de personas mais structure les concepts et techniques fondamentaux du projet.

## Exécution

### Phase 1 : Vérification des Documents Existants

Poser la **Question 1 : Documents sources**
```
Existe-t-il des documents spécifiques dans le répertoire hard-points que je dois analyser pour extraire les informations du projet ?

Si OUI, précisez les chemins des documents à analyser (séparés par des virgules) :
Exemple : hard-points/architecture.md, hard-points/concepts/glossaire.md

Si NON, tapez 'non' pour une initialisation manuelle.
```

**Si OUI** : Analyser uniquement les documents spécifiés par l'utilisateur dans `/prompts/hard_points/` et extraire :
- Contexte projet
- Architecture générale
- Stack technique
- Terminologie métier
- Contraintes et règles

**Si NON** : Passer à l'interrogation manuelle (Phase 2)

### Phase 2 : Collecte des Informations Projet

Poser la **Question 2 : Contexte projet**
```
Décrivez le contexte de votre projet :
- Nom du projet
- Domaine métier (finance, santé, e-commerce, etc.)
- Objectif principal
- Contraintes particulières (réglementaires, techniques, temporelles)

Entrez la description complète :
```

Poser la **Question 3 : Architecture générale**
```
Décrivez l'architecture générale selon le modèle C1 :
- Users : Qui sont les utilisateurs finaux ?
- System : Quel est le système principal ?
- Composants : Quels sont les grands blocs fonctionnels ?

Format libre, soyez précis sur les interactions :
```

Poser la **Question 4 : Stack technique cible**
```
Quelle est votre stack technique ?
- Frontend : Framework/technologie
- Backend : Langage/framework
- Base de données : Type et technologie
- Infrastructure : Cloud, on-premise, hybride
- Outils spécifiques : CI/CD, monitoring, etc.

Entrez la stack complète :
```

### Phase 3 : Génération des Use Cases de Base

Générer automatiquement **3-5 use cases fondamentaux** basés sur :
- Le domaine métier identifié
- L'architecture décrite
- Les patterns courants du domaine

### Phase 4 : Vérification et Factorisation des Informations Existantes

**Avant toute génération**, analyser le contenu existant dans `/prompts/gen/` :

1. **Scanner les fichiers existants** :
   - `/prompts/gen/concepts/` (tous les .md)
   - `/prompts/gen/techniques/` (tous les .md)
   - `/prompts/gen/use_cases/` (tous les .md)

2. **Identifier les informations communes** :
   - Terminologie déjà définie
   - Architecture déjà documentée
   - Stack technique déjà spécifiée
   - Use cases déjà créés

3. **Détecter les contradictions** :
   - Comparer les nouvelles informations avec l'existant
   - Identifier les conflits de définitions, d'architecture, de stack

4. **Résolution des conflits** :
   ```
   ⚠️ CONFLIT DÉTECTÉ dans [fichier existant] :
   
   Information existante : [contenu actuel]
   Nouvelle information : [nouveau contenu]
   
   Quelle version est correcte ?
   1. Conserver l'existant
   2. Utiliser la nouvelle version
   3. Fusionner les deux (précisez comment)
   
   Votre choix :
   ```

5. **Factorisation intelligente** :
   - Enrichir les fichiers existants plutôt que les remplacer
   - Ajouter les nouvelles sections manquantes
   - Mettre à jour les versions et dates

### Phase 5 : Création de la Structure AI-KIDO

#### 6.1 Génération du Glossaire Projet (si documents hard-points disponibles)

Créer `/prompts/gen/concepts/glossaire-projet.md` :
```markdown
# Glossaire Projet - [Nom du Projet]
> Version: 1.0 | Date: [DATE] | Statut: Initial

## Vue d'ensemble
Terminologie et concepts clés du projet [Nom].

## Définitions métier
[Termes extraits des documents ou fournis par l'utilisateur]

## Définitions techniques
[Stack et composants techniques]

## Acronymes et abréviations
[Liste alphabétique]

## Relations conceptuelles
```mermaid
graph TD
    [Diagramme des relations entre concepts clés]
```

---
*Généré automatiquement par init-aikido le [DATE]*
```

#### 6.2 Architecture Système

Créer `/prompts/gen/concepts/architecture-systeme.md` :
```markdown
# Architecture Système - [Nom du Projet]
> Version: 1.0 | Date: [DATE] | Statut: Initial

## Vue d'ensemble
Architecture générale du système [Nom].

## Modèle C1 - Contexte
```mermaid
C4Context
    title Contexte Système [Nom]
    [Diagramme C1 basé sur les informations collectées]
```

## Utilisateurs principaux
[Description des users identifiés]

## Système principal
[Description du system core]

## Composants fonctionnels
[Blocs fonctionnels identifiés]

## Contraintes architecturales
[Contraintes techniques et métier]

---
*Généré automatiquement par init-aikido le [DATE]*
```

#### 6.3 Stack Technique

Créer `/prompts/gen/techniques/stack-technique.md` :
```markdown
# Stack Technique - [Nom du Projet]
> Version: 1.0 | Date: [DATE] | Statut: Initial

## Vue d'ensemble
Technologies et outils du projet [Nom].

## Architecture technique
```mermaid
graph TB
    [Diagramme de la stack technique]
```

## Frontend
[Technologies frontend]

## Backend
[Technologies backend]

## Données
[Base de données et stockage]

## Infrastructure
[Cloud, déploiement, monitoring]

## Outils de développement
[CI/CD, tests, qualité]

---
*Généré automatiquement par init-aikido le [DATE]*
```

#### 6.4 Use Cases Fondamentaux

Créer `/prompts/gen/use_cases/use-cases-fondamentaux.md` :
```markdown
# Use Cases Fondamentaux - [Nom du Projet]
> Version: 1.0 | Date: [DATE] | Statut: Initial

## Vue d'ensemble
Cas d'usage de base du projet [Nom].

[3-5 use cases générés automatiquement selon le domaine]

---
*Généré automatiquement par init-aikido le [DATE]*
```

### Phase 5 : Taxonomies et Hiérarchies par Rôles

#### 5.1 Identification des Rôles Projet

Générer automatiquement les rôles selon le contexte :
- **Domaine Finance** : Architecte Solutions, Développeur Backend Sécurisé, Expert Conformité, QA Sécurité
- **Domaine E-commerce** : Architecte Microservices, Développeur Frontend UX, Expert Performance, DevOps Scalabilité
- **Domaine Santé** : Architecte Sécurité, Développeur Conformité RGPD, Expert Audit, QA Validation Métier

#### 5.2 Matrice RACI par Concept/Technique

Créer `/prompts/gen/concepts/matrice-raci.md` :
```markdown
# Matrice RACI - Responsabilités par Rôle
> Version: 1.0 | Date: [DATE] | Statut: Initial

## Vue d'ensemble
Attribution des responsabilités selon les rôles identifiés.

## Concepts Fondamentaux

| Concept | [Rôle 1] | [Rôle 2] | [Rôle 3] | [Rôle 4] |
|---------|----------|----------|----------|----------|
| Architecture Système | R | A | C | I |
| Sécurité | C | R | A | I |
| Performance | I | C | R | A |

## Techniques Pratiques

| Technique | [Rôle 1] | [Rôle 2] | [Rôle 3] | [Rôle 4] |
|-----------|----------|----------|----------|----------|
| Développement API | A | R | C | I |
| Tests Automatisés | I | C | R | A |
| Déploiement | C | I | A | R |

**Légende** : R=Responsable, A=Approbateur, C=Consulté, I=Informé

---
*Généré automatiquement par init-aikido le [DATE]*
```

### Phase 6 : Mise à Jour de l'Indexation Générale AI-KIDO

#### 6.1 Mise à Jour des Index Sectoriels

Mettre à jour automatiquement avec les nouveaux fichiers créés :
- `/prompts/gen/concepts/index.md` : Ajouter références aux nouveaux concepts
- `/prompts/gen/techniques/index.md` : Ajouter références aux nouvelles techniques
- `/prompts/gen/use_cases/index.md` : Ajouter références aux nouveaux use cases

#### 6.2 Mise à Jour de l'Index Principal

Mettre à jour `/prompts/gen/index.md` avec :
- Nouveau contexte projet identifié
- Domaine métier ajouté
- Stack technique référencée
- Liens vers les nouveaux fichiers créés

#### 6.3 Création/Mise à Jour du Fichier AGENTS.md

Créer ou mettre à jour `AGENTS.md` à la racine du projet selon la norme Claude :

```markdown
# AI Agents Configuration

## Project Context
- **Project Name**: [Nom du Projet]
- **Domain**: [Domaine Métier]
- **Architecture**: [Type d'architecture identifié]
- **Tech Stack**: [Stack technique principale]

## Available Agents

### Concept Specialists
[Liste des agents spécialisés dans les concepts identifiés]

### Technical Specialists
[Liste des agents spécialisés dans les techniques identifiées]

### Domain Experts
[Liste des experts métier selon le domaine]

## Agent Interaction Matrix

| Agent Type | Primary Role | Interaction Context | Knowledge Base |
|------------|--------------|-------------------|----------------|
| [Type 1] | [Rôle] | [Contexte] | [Base de connaissances] |
| [Type 2] | [Rôle] | [Contexte] | [Base de connaissances] |

## Usage Guidelines

### When to Use Each Agent
[Guidelines basées sur les use cases identifiés]

### Agent Coordination
[Règles de coordination entre agents selon la matrice RACI]

---
*Generated by init-aikido on [DATE]*
```

#### 6.4 Indexation Vectorielle (si supportée)

Si le système supporte l'indexation vectorielle :
- Indexer tous les nouveaux fichiers créés
- Mettre à jour les embeddings des concepts
- Créer les liens sémantiques entre éléments

## Messages de Confirmation

Afficher le message de succès :
```
✅ Memory bank AI-KIDO initialisée avec succès !

Fichiers créés :
- /prompts/gen/concepts/glossaire-projet.md (si documents hard-points)
- /prompts/gen/concepts/architecture-systeme.md
- /prompts/gen/concepts/matrice-raci.md
- /prompts/gen/techniques/stack-technique.md
- /prompts/gen/use_cases/use-cases-fondamentaux.md
- AGENTS.md (créé/mis à jour)

Index mis à jour :
- /prompts/gen/index.md (index principal)
- /prompts/gen/concepts/index.md
- /prompts/gen/techniques/index.md
- /prompts/gen/use_cases/index.md

🎯 Base AI-KIDO prête pour la suite du développement !
```

## Gestion des Erreurs

- **Documents spécifiés introuvables** : Lister les fichiers manquants et proposer mode manuel
- **Documents hard-points illisibles** : Passer en mode manuel avec avertissement
- **Chemins invalides** : Redemander avec exemples de chemins corrects
- **Informations incomplètes** : Redemander les éléments manquants
- **Conflits d'informations** : Interroger l'utilisateur pour résoudre les contradictions
- **Conflits de fichiers** : Proposer sauvegarde avec suffixe temporel
- **Erreur génération Mermaid** : Créer structure textuelle de fallback

## Règles AI-KIDO Respectées

- ✅ Pas de création de personas (focus sur concepts/techniques)
- ✅ Génération directe dans `/prompts/gen/`
- ✅ Format Markdown avec métadonnées
- ✅ Schémas Mermaid pour densité sémantique
- ✅ Taxonomies et hiérarchies par rôles
- ✅ Matrice RACI pour responsabilités
- ✅ Contrainte 500 lignes par fichier
- ✅ Auto-alimentation de la memory bank

---
