---
description: "Initialiser la memory bank AI-KIDO avec les éléments fondamentaux du projet"
---

# Commande Init-Aikido

**IMPORTANT** : Cette commande doit être exécutée DIRECTEMENT par le LLM.
- ❌ NE PAS créer de script bash/shell
- ❌ NE PAS proposer de code à exécuter
- ✅ UTILISER les outils Roo-Code DIRECTEMENT (ask_followup_question, write_to_file, apply_diff, read_file)
- ✅ POSER les questions à l'utilisateur avec ask_followup_question
- ✅ CRÉER les fichiers avec write_to_file
- ✅ MODIFIER les fichiers existants avec apply_diff

Cette commande initialise la memory bank AI-KIDO en créant directement les fichiers de base dans `/prompts/gen/` selon les règles aikido. Cette commande ne crée pas de personas mais structure les concepts et techniques fondamentaux du projet.

## Exécution IMMÉDIATE

### Phase 0 : Choix du Mode AI-KIDO

**PREMIÈRE ÉTAPE OBLIGATOIRE** : Utiliser l'outil `read_file` pour vérifier si AI-KIDO est déjà initialisé en testant l'existence de `/prompts/index.md`.

**Si AI-KIDO n'est PAS initialisé**, utiliser l'outil `ask_followup_question` pour poser la **Question 0 : Mode AI-KIDO**

**Question** : "Quel mode AI-KIDO souhaitez-vous initialiser ?"

**Détails** :
```
🎯 INITIALISATION AI-KIDO

Choisissez le mode AI-KIDO :

1. Mode STANDARD
   - Structure complète multi-agents
   - 6-12 personas spécialisés
   - 8-15 use cases
   - RACI complet multi-acteurs
   - Fichiers multiples par domaine
   - Recommandé pour : équipes 4+, projets complexes

2. Mode LIGHT
   - Structure minimale agent unitaire
   - 3-5 personas maximum
   - 3-5 use cases maximum
   - RACI optionnel (acteur unique ou minimal)
   - Fichiers unifiés privilégiés
   - Recommandé pour : solo/petites équipes, prototypes, POCs

```

**Suggestions à proposer** :
- "Mode STANDARD (structure complète, 6-12 personas, équipes 4+)"
- "Mode LIGHT (structure minimale, 3-5 personas, solo/petites équipes)"

**Si AI-KIDO est DÉJÀ initialisé**, utiliser `read_file` pour détecter le mode actuel :
- Lire `/prompts/index.md` pour identifier le mode (présence de référence à `ai-kido-light.md` ou `ai-kido.md`)
- Afficher le mode détecté et continuer avec ce mode
- Ne PAS proposer de changement de mode (nécessite une migration explicite)

```
ℹ️ AI-KIDO déjà initialisé en mode [STANDARD/LIGHT]
Poursuite de l'initialisation en mode [STANDARD/LIGHT]...
```

**Stocker le mode choisi** pour toutes les phases suivantes : `AIKIDO_MODE = [STANDARD|LIGHT]`

### Phase 1 : Vérification des Sources Existantes

Utiliser l'outil `ask_followup_question` pour poser la **Question 1 : Sources d'analyse**

**Question** : "Quelles sources voulez-vous analyser pour initialiser AI-KIDO ?"

**Détails** :
```
Sources disponibles :

Options disponibles :
1. Documents hard-points uniquement
2. Sources projet existantes uniquement (src/, docs/, etc.)
3. Analyse combinée hard-points + sources projet
4. Initialisation manuelle (sans analyse automatique)

```

**Suggestions à proposer** :
- "Documents hard-points uniquement"
- "Sources projet existantes uniquement (src/, docs/)"
- "Analyse combinée hard-points + sources projet"
- "Initialisation manuelle (sans analyse automatique)"

**Si choix 1** : Utiliser `ask_followup_question` pour demander les documents hard-points spécifiques
```
Précisez les chemins des documents hard-points à analyser (séparés par des virgules) :
Exemple : hard-points/architecture.md, hard-points/concepts/glossaire.md

Si vide, analyser tous les documents hard-points automatiquement.
```

**Si choix 2** : Utiliser `list_files` pour scanner le workspace et détecter les sources projet
```
🔍 DÉTECTION AUTOMATIQUE DES SOURCES PROJET :

Répertoires détectés dans le workspace :
[Liste automatique : src/, docs/, lib/, components/, config/, etc.]

Voulez-vous analyser tous ces répertoires ? (o/n)
Si non, sélectionnez les répertoires à analyser :
```

**Si choix 3** : Combiner hard-points + sources projet automatiquement

**Si choix 4** : Passer directement à l'interrogation manuelle (Phase 2)

#### Extraction Automatique (choix 1, 2 ou 3)

**UTILISER L'AGENT** `agent-aikido-explore-bank` pour extraction intelligente des sources :

```markdown
🤖 AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

**Prompt pour l'agent** :
"Extrais les informations fondamentales pour initialiser la Memory Bank AI-KIDO depuis les sources suivantes :

Sources à analyser : [hard-points / sources projet / combiné selon choix utilisateur]

Informations à extraire :
1. **Contexte projet** : nom, domaine métier, objectif principal
2. **Architecture générale** : modèle C1 (users, system, composants)
3. **Stack technique** : frontend, backend, base de données, infrastructure
4. **Terminologie métier** : termes spécifiques et acronymes
5. **Contraintes** : réglementaires, techniques, temporelles
6. **Patterns existants** : architecturaux et de développement

Pour chaque information, indique :
- Source (fichier/répertoire)
- Niveau de confiance (HIGH/MEDIUM/LOW)
- Sections de code/documentation pertinentes

Retourne un rapport structuré en format JSON ou Markdown avec toutes les informations extraites."

**Résultat attendu** : Rapport d'extraction complet avec sources et niveau de confiance
```

**Avantages de l'agent** :
- ✅ Extraction intelligente multi-sources (hard-points + code)
- ✅ Détection automatique des patterns et architectures
- ✅ Scoring de confiance pour chaque information
- ✅ Gain de temps vs extraction manuelle (~70% tokens économisés)

### Phase 2 : Synthèse Automatique (si analyse effectuée)

Utiliser l'outil `ask_followup_question` pour **présenter la synthèse des informations détectées** :
```
📊 SYNTHÈSE DE L'ANALYSE AUTOMATIQUE :

Contexte projet détecté :
- Nom probable : [Basé sur package.json, README, etc.]
- Domaine métier : [Inféré des termes métier trouvés]
- Stack technique : [Technologies détectées]
- Architecture : [Patterns architecturaux identifiés]

Cette synthèse est-elle correcte ? (o/n)
Si non, quels éléments corriger ?
```

### Phase 3 : Collecte des Informations Projet (si initialisation manuelle ou corrections)

Utiliser l'outil `ask_followup_question` pour poser la **Question 2 : Contexte projet**
```
Décrivez le contexte de votre projet :
- Nom du projet
- Domaine métier (finance, santé, e-commerce, etc.)
- Objectif principal
- Contraintes particulières (réglementaires, techniques, temporelles)

Entrez la description complète :
```

Utiliser l'outil `ask_followup_question` pour poser la **Question 3 : Architecture générale**
```
Décrivez l'architecture générale selon le modèle C1 :
- Users : Qui sont les utilisateurs finaux ?
- System : Quel est le système principal ?
- Composants : Quels sont les grands blocs fonctionnels ?

Format libre, soyez précis sur les interactions :
```

Utiliser l'outil `ask_followup_question` pour poser la **Question 4 : Stack technique cible**
```
Quelle est votre stack technique ?
- Frontend : Framework/technologie
- Backend : Langage/framework
- Base de données : Type et technologie
- Infrastructure : Cloud, on-premise, hybride
- Outils spécifiques : CI/CD, monitoring, etc.

Entrez la stack complète :
```

### Phase 4 : Génération des Use Cases de Base

**Si AIKIDO_MODE = STANDARD** :
Générer automatiquement **3-5 use cases fondamentaux** basés sur :
- Le domaine métier identifié
- L'architecture décrite
- Les patterns courants du domaine

**Si AIKIDO_MODE = LIGHT** :
Générer automatiquement **3 use cases critiques maximum** basés sur :
- Les 80% des besoins réels identifiés
- Les patterns principaux du domaine
- Les scénarios de référence pour cas similaires

### Phase 5 : Vérification et Factorisation des Informations Existantes

**Avant toute génération**, utiliser `list_files` et `read_file` pour analyser le contenu existant dans `/prompts/gen/` :

1. **Scanner les fichiers existants** (avec `list_files`) :
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

#### 5.4 Résolution Automatique des Contradictions 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-truth-evaluator` pour résolution automatique des conflits :

```markdown
🤖 AGENT: agent-aikido-truth-evaluator
FORMAT: JSON

**Prompt pour l'agent** :
"Analyse les contradictions détectées entre informations existantes (dans /prompts/gen/) et nouvelles informations extraites.

Informations existantes : [Contenu des fichiers existants dans concepts/techniques/use_cases]
Nouvelles informations : [Informations extraites par agent-explore-bank Phase 1]

Pour chaque contradiction détectée :
1. Identifier le type de conflit (définition, architecture, stack, terminologie)
2. Déterminer la source autoritaire selon le scénario :
   - Hard-points existants = autorité maximale (priorité absolue)
   - Code source récent = autorité HIGH (Scénario Code-Driven)
   - Documentation existante = autorité MEDIUM (peut être obsolète)
   - Nouvelles informations sans source = autorité LOW
3. Évaluer la crédibilité de chaque source
4. Recommander l'action :
   - KEEP_EXISTING : Conserver l'existant (source autoritaire)
   - USE_NEW : Remplacer par nouvelle version (nouvelle source autoritaire)
   - MERGE : Fusionner les deux (sources complémentaires)
   - ASK_USER : Ambiguïté nécessitant intervention utilisateur

Retourne liste contradictions avec :
- Fichier existant + ligne concernée
- Nouvelle information en conflit
- Source autoritaire identifiée
- Recommandation d'action (KEEP/USE_NEW/MERGE/ASK_USER)
- Justification + niveau de confiance (HIGH/MEDIUM/LOW)"

**Résultat attendu** : Liste contradictions avec recommandations actionnables et sources autoritaires
```

**Avantages de l'agent** :
- ✅ Détection automatique contradictions existant vs nouveau
- ✅ Hiérarchie des sources (hard-points > code > docs)
- ✅ Recommandations claires (keep/use_new/merge/ask_user)
- ✅ Réduction interventions utilisateur (~60% conflits résolus auto)

4. **Application des recommandations** (avec `ask_followup_question` si ASK_USER) :
   ```
   ⚠️ CONFLIT NÉCESSITANT VALIDATION dans [fichier existant] :

   Information existante : [contenu actuel]
   Nouvelle information : [nouveau contenu]

   Recommandation agent-truth-evaluator : [KEEP/USE_NEW/MERGE]
   Justification : [Raison de l'agent]
   Niveau de confiance : [HIGH/MEDIUM/LOW]

   Voulez-vous suivre la recommandation ? (o/n)
   Si non, quelle version préférer ?
   ```

5. **Factorisation intelligente** :
   - Enrichir les fichiers existants plutôt que les remplacer
   - Ajouter les nouvelles sections manquantes
   - Mettre à jour les versions et dates

#### 5.5 Classification RACI des Documents 🤖 🆕 (Mode STANDARD uniquement)

**SI AIKIDO_MODE = STANDARD**, **UTILISER L'AGENT** `agent-aikido-raci-delegator` pour classifier automatiquement les documents créés :

```markdown
🤖 AGENT: agent-aikido-raci-delegator
FORMAT: JSON

**Prompt pour l'agent** :
"Classifie tous les documents qui seront créés dans /prompts/gen/ selon la matrice RACI et recommande leur emplacement par rôle.

Documents à classifier :
- Concepts : [Liste des concepts identifiés depuis Phase 1]
- Techniques : [Liste des techniques identifiées depuis Phase 1]
- Use Cases : [Liste des use cases générés Phase 4]

Contexte projet : [Informations extraites Phase 1 - domaine, architecture, stack]

Pour chaque document :
1. Analyser le contenu et déterminer le rôle responsable principal (R)
2. Identifier les rôles consultés (C) et approbateurs (A)
3. Déterminer si contexte mono-projet ou multi-projet
4. Recommander le chemin cible selon la Règle AI-KIDO 15 :
   - /prompts/gen/concepts/[role-responsable]/[concept].md
   - /prompts/gen/techniques/[role-responsable]/[technique].md
   - /prompts/gen/use_cases/[role-responsable]/[use-case].md

Rôles disponibles selon domaine métier :
- Finance : architecte-solutions, dev-backend-securise, expert-conformite, qa-securite
- E-commerce : architecte-microservices, dev-frontend-ux, expert-performance, devops-scalabilite
- Santé : architecte-securite, dev-conformite-rgpd, expert-audit, qa-validation-metier

Retourne pour chaque document :
- Document (nom)
- Rôle responsable (R)
- Rôles consultés/approbateurs (C/A)
- Chemin cible recommandé
- Justification de l'assignation
- Niveau de confiance (HIGH/MEDIUM/LOW)"

**Résultat attendu** : Mapping complet document → rôle → chemin cible avec justifications
```

**Avantages de l'agent** :
- ✅ Classification automatique par rôle selon contenu
- ✅ Recommandation paths conformes Règle 15
- ✅ Détection contexte mono/multi-projet
- ✅ Gain efficacité (~80% classifications automatisées)

**SI AIKIDO_MODE = LIGHT** : Ignorer cette section (RACI optionnel, voir Phase 7.5)

### Phase 6 : Création de la Structure AI-KIDO

**ADAPTATION SELON LE MODE** :

#### Mode STANDARD : Structure Complète

##### 6.1 Génération du Glossaire Projet (si documents hard-points disponibles)

Utiliser l'outil `write_to_file` pour créer `/prompts/gen/concepts/glossaire-projet.md` :
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

##### 6.2 Architecture Système

Utiliser l'outil `write_to_file` pour créer `/prompts/gen/concepts/architecture-systeme.md` :
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

##### 6.3 Stack Technique

Utiliser l'outil `write_to_file` pour créer `/prompts/gen/techniques/stack-technique.md` :
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

##### 6.4 Use Cases Fondamentaux

Utiliser l'outil `write_to_file` pour créer `/prompts/gen/use_cases/use-cases-fondamentaux.md` :
```markdown
# Use Cases Fondamentaux - [Nom du Projet]
> Version: 1.0 | Date: [DATE] | Statut: Initial

## Vue d'ensemble
Cas d'usage de base du projet [Nom].

[3-5 use cases générés automatiquement selon le domaine]

---
*Généré automatiquement par init-aikido le [DATE]*
```

#### Mode LIGHT : Structure Minimale

##### 6.1 Fichier Unifié Concepts

Utiliser l'outil `write_to_file` pour créer `/prompts/gen/concepts/core-concepts.md` :
```markdown
# Concepts Fondamentaux - [Nom du Projet] (Mode Light)
> Version: 1.0 | Date: [DATE] | Statut: Initial | Mode: LIGHT

## Vue d'ensemble
Vision globale du projet [Nom] en mode AI-KIDO Light.

[Description concise en 2-3 paragraphes maximum]

## Concepts Clés

### Concept 1: [Nom]
[Description ultra-dense avec schéma Mermaid si pertinent]

### Concept 2: [Nom]
[Description ultra-dense avec schéma Mermaid si pertinent]

### Concept 3: [Nom]
[Description ultra-dense avec schéma Mermaid si pertinent]

## Glossaire Essentiel
[Uniquement les 10-15 termes les plus critiques]

## Architecture Système
```mermaid
C4Context
    title Contexte Système [Nom]
    [Diagramme C1 simplifié]
```

## Relations et Dépendances
[Schéma Mermaid de synthèse]

---
*Généré automatiquement par init-aikido le [DATE] - Mode LIGHT*
```

##### 6.2 Fichier Unifié Techniques

Utiliser l'outil `write_to_file` pour créer `/prompts/gen/techniques/core-techniques.md` :
```markdown
# Techniques Pratiques - [Nom du Projet] (Mode Light)
> Version: 1.0 | Date: [DATE] | Statut: Initial | Mode: LIGHT

## Vue d'ensemble
Approche technique globale du projet [Nom] en mode AI-KIDO Light.

[Description en 2-3 paragraphes]

## Techniques Essentielles

### Technique 1: [Nom]
[Méthode + exemple concret en format ultra-dense]

### Technique 2: [Nom]
[Méthode + exemple concret en format ultra-dense]

### Technique 3: [Nom]
[Méthode + exemple concret en format ultra-dense]

## Stack Technique
```mermaid
graph TB
    [Diagramme simplifié de la stack]
```

### Frontend
[Technologies frontend essentielles]

### Backend
[Technologies backend essentielles]

### Données
[Base de données et stockage]

### Infrastructure
[Cloud, déploiement, monitoring]

## Patterns et Best Practices
[Liste condensée des patterns critiques]

---
*Généré automatiquement par init-aikido le [DATE] - Mode LIGHT*
```

##### 6.3 Use Cases Critiques (3 maximum)

Utiliser l'outil `write_to_file` pour créer `/prompts/gen/use_cases/use-cases-critiques.md` :
```markdown
# Use Cases Critiques - [Nom du Projet] (Mode Light)
> Version: 1.0 | Date: [DATE] | Statut: Initial | Mode: LIGHT

## Vue d'ensemble
Les 3 cas d'usage critiques couvrant 80% des besoins du projet [Nom].

## Use Case 1: [Nom]
[Description ultra-dense du cas critique principal]

## Use Case 2: [Nom]
[Description ultra-dense du deuxième cas critique]

## Use Case 3: [Nom]
[Description ultra-dense du troisième cas critique]

---
*Généré automatiquement par init-aikido le [DATE] - Mode LIGHT*
```

### Phase 7 : Répartition par Rôles Humains (Règle AI-KIDO 15)

**Si AIKIDO_MODE = STANDARD** : Appliquer la répartition complète par rôles
**Si AIKIDO_MODE = LIGHT** : RACI optionnel ou minimal (voir Phase 7.5)

#### 7.1 Identification des Rôles Projet

Générer automatiquement les rôles selon le contexte et **créer les sous-répertoires correspondants** :
- **Domaine Finance** : Architecte Solutions, Développeur Backend Sécurisé, Expert Conformité, QA Sécurité
- **Domaine E-commerce** : Architecte Microservices, Développeur Frontend UX, Expert Performance, DevOps Scalabilité
- **Domaine Santé** : Architecte Sécurité, Développeur Conformité RGPD, Expert Audit, QA Validation Métier

#### 7.2 Création de la Structure par Rôles

**Créer les sous-répertoires spécialisés** dans `/prompts/gen/` selon la règle 15 :
```
/prompts/gen/concepts/
├── architecte-solutions/
├── developpeur-backend/
├── expert-conformite/
└── qa-securite/

/prompts/gen/techniques/
├── architecte-solutions/
├── developpeur-backend/
├── expert-conformite/
└── qa-securite/

/prompts/gen/use_cases/
├── architecte-solutions/
├── developpeur-backend/
├── expert-conformite/
└── qa-securite/
```

#### 7.3 Assignation des Responsabilités par Sous-répertoire

**Répartir les concepts/techniques/use_cases** selon les responsabilités :
- **Architecte Solutions** : Architecture système, patterns de conception, décisions techniques
- **Développeur Backend** : Implémentation, APIs, performance, sécurité applicative
- **Expert Conformité** : Réglementations, audits, validation métier, documentation légale
- **QA Sécurité** : Tests sécurisés, validation, contrôles qualité, procédures de test

#### 7.4 Matrice RACI par Concept/Technique

Utiliser l'outil `write_to_file` pour créer `/prompts/gen/concepts/matrice-raci.md` :
```markdown
# Matrice RACI - Responsabilités par Rôle (Règle AI-KIDO 15)
> Version: 1.0 | Date: [DATE] | Statut: Initial

## Vue d'ensemble
Attribution des responsabilités selon les rôles identifiés et répartition par sous-répertoires.

## Structure des Sous-répertoires par Rôle

### Concepts (`/prompts/gen/concepts/`)
- `architecte-solutions/` : Architecture, patterns, décisions techniques
- `developpeur-backend/` : Implémentation, APIs, performance
- `expert-conformite/` : Réglementations, audits, validation métier
- `qa-securite/` : Tests, validation, contrôles qualité

### Techniques (`/prompts/gen/techniques/`)
- `architecte-solutions/` : Techniques architecturales, design patterns
- `developpeur-backend/` : Techniques de développement, optimisation
- `expert-conformite/` : Techniques d'audit, validation réglementaire
- `qa-securite/` : Techniques de test, sécurisation

### Use Cases (`/prompts/gen/use_cases/`)
- `architecte-solutions/` : Cas d'usage architecturaux, décisions de conception
- `developpeur-backend/` : Cas d'usage d'implémentation, résolution de problèmes
- `expert-conformite/` : Cas d'usage de conformité, validation métier
- `qa-securite/` : Cas d'usage de test, validation sécurisée

## Matrice RACI par Concept/Technique

| Concept/Technique | Architecte | Développeur | Expert Conformité | QA Sécurité |
|-------------------|------------|-------------|-------------------|-------------|
| Architecture Système | R | A | C | I |
| Sécurité Applicative | C | R | A | R |
| Performance | A | R | C | C |
| Conformité Réglementaire | C | I | R | A |
| Tests Automatisés | I | C | C | R |
| Déploiement | A | R | C | C |

**Légende** : R=Responsable, A=Approbateur, C=Consulté, I=Informé

## Règles de Collaboration Git

### Assignation par Sous-répertoire
- Chaque rôle est **responsable principal** de son sous-répertoire
- Les MR/PR touchant un sous-répertoire doivent être **approuvées par le rôle responsable**
- Les modifications transversales nécessitent **validation de tous les rôles concernés**

### Workflow de Validation
1. **Création** : Le rôle responsable crée le contenu dans son sous-répertoire
2. **Review** : Les rôles "Consulté" et "Approbateur" valident
3. **Merge** : Le rôle "Approbateur" final valide la fusion

---
#### 7.5 RACI Minimal ou Absent (Mode LIGHT)

Utiliser l'outil `ask_followup_question` pour **poser la question** :
```
🎯 GESTION DES RÔLES EN MODE LIGHT

Le mode Light privilégie un acteur unique ou un RACI minimal.

Quelle approche souhaitez-vous ?

1. Acteur unique (pas de RACI)
   - Un seul responsable pour tout
   - Approche "solo developer"
   - Pas de matrice RACI nécessaire

2. RACI minimal (2-3 rôles maximum)
   - Dev + Lead + Ops (exemple)
   - Matrice simplifiée
   - Responsabilités claires mais limitées

Votre choix (1/2) :
```

**Si choix 1 (Acteur unique)** : Ne pas créer de matrice RACI

**Si choix 2 (RACI minimal)** : Utiliser `write_to_file` pour créer `/prompts/gen/concepts/matrice-raci-light.md` :
```markdown
# Matrice RACI Minimale - [Nom du Projet] (Mode Light)
> Version: 1.0 | Date: [DATE] | Statut: Initial | Mode: LIGHT

## Vue d'ensemble
Attribution minimale des responsabilités en mode Light (2-3 rôles maximum).

## Rôles Identifiés
- **Dev** : Développement et implémentation
- **Lead** : Architecture et validation
- **Ops** : Déploiement et infrastructure (optionnel)

## Matrice RACI Minimale

| Tâche | Dev | Lead | Ops |
|-------|-----|------|-----|
| Architecture | C | R/A | I |
| Développement | R/A | C | I |
| Déploiement | C | C | R/A |
| Sécurité | R | A | C |
| Tests | R/A | C | I |

**Légende** : R=Responsable, A=Approbateur, C=Consulté, I=Informé

---
*Généré automatiquement par init-aikido le [DATE] - Mode LIGHT*
```

*Généré automatiquement par init-aikido le [DATE] - Règle AI-KIDO 15 appliquée*
```

### Phase 8 : Mise à Jour de l'Indexation Générale AI-KIDO

#### 6.1 Mise à Jour des Index Sectoriels

Utiliser l'outil `apply_diff` pour mettre à jour automatiquement avec les nouveaux fichiers créés :
- `/prompts/gen/concepts/index.md` : Ajouter références aux nouveaux concepts
- `/prompts/gen/techniques/index.md` : Ajouter références aux nouvelles techniques
- `/prompts/gen/use_cases/index.md` : Ajouter références aux nouveaux use cases

#### 8.2 Mise à Jour de l'Index Principal

Utiliser l'outil `apply_diff` ou `write_to_file` pour mettre à jour `/prompts/index.md` avec :
- **Mode AI-KIDO** : Référence à `ai-kido.md` (STANDARD) ou `ai-kido-light.md` (LIGHT)
- Nouveau contexte projet identifié
- Domaine métier ajouté
- Stack technique référencée
- Liens vers les nouveaux fichiers créés

**Format pour Mode STANDARD** :
```markdown
# Index Principal - [Nom du Projet]
> Version: 1.0 | Date: [DATE] | Mode: STANDARD

## Configuration AI-KIDO
- **Mode**: STANDARD (Structure complète multi-agents)
- **Référence**: [ai-kido.md](../hard_points/ai-kido.md)
- **RACI**: Complet multi-acteurs

[Reste du contenu...]
```

**Format pour Mode LIGHT** :
```markdown
# Index Principal - [Nom du Projet]
> Version: 1.0 | Date: [DATE] | Mode: LIGHT

## Configuration AI-KIDO
- **Mode**: LIGHT (Structure minimale agent unitaire)
- **Référence**: [ai-kido-light.md](../hard_points/ai-kido-light.md)
- **RACI**: [Acteur unique / Minimal 2-3 rôles]

[Reste du contenu...]
```

#### 8.3 Création/Mise à Jour du Fichier AGENTS.md

**Si AIKIDO_MODE = STANDARD** :

Utiliser l'outil `write_to_file` ou `apply_diff` pour créer ou mettre à jour `AGENTS.md` à la racine du projet selon la norme Claude :

```markdown
# AI Agents Configuration - Mode STANDARD

## Project Context
- **Project Name**: [Nom du Projet]
- **AI-KIDO Mode**: STANDARD
- **Reference**: [prompts/hard_points/ai-kido.md](prompts/hard_points/ai-kido.md)
- **Domain**: [Domaine Métier]
- **Architecture**: [Type d'architecture identifié]
- **Tech Stack**: [Stack technique principale]

## Available Agents

### Concept Specialists
[Liste des agents spécialisés dans les concepts identifiés - 6-12 agents]

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
*Generated by init-aikido on [DATE] - Mode STANDARD*
```

**Si AIKIDO_MODE = LIGHT** :

Utiliser l'outil `write_to_file` ou `apply_diff` pour créer ou mettre à jour `AGENTS.md` à la racine du projet selon la norme Claude :

```markdown
# AI Agents Configuration - Mode LIGHT

## Project Context
- **Project Name**: [Nom du Projet]
- **AI-KIDO Mode**: LIGHT (Agent Unitaire / Multi-agents Minimal)
- **Reference**: [prompts/hard_points/ai-kido-light.md](prompts/hard_points/ai-kido-light.md)
- **Domain**: [Domaine Métier]
- **Architecture**: [Lien vers /prompts/gen/concepts/core-concepts.md]
- **Tech Stack**: [Lien vers /prompts/gen/techniques/core-techniques.md]

## Available Agents (3-5 Maximum)

### Agent 1: [Nom]
[Lien vers /prompts/gen/personas/agent-1.md]
**Responsabilités**: [Liste des domaines couverts - polyvalent]

### Agent 2: [Nom]
[Lien vers /prompts/gen/personas/agent-2.md]
**Responsabilités**: [Liste des domaines couverts - polyvalent]

### Agent 3: [Nom]
[Lien vers /prompts/gen/personas/agent-3.md]
**Responsabilités**: [Liste des domaines couverts - polyvalent]

## Agent Interaction (Optionnel en Light)
[Matrice RACI minimale si applicable, sinon "Agent Unitaire"]

## Usage Guidelines
[Lien vers /prompts/gen/use_cases/use-cases-critiques.md - 3 cas maximum]

---
*Generated by init-aikido on [DATE] - Mode LIGHT*
```

#### 8.4 Validation Finale AI-KIDO 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-validator` pour validation complète post-initialisation :

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

**Prompt pour l'agent** :
"Valide TOUS les fichiers créés dans /prompts/ lors de l'initialisation AI-KIDO.

Fichiers à valider :
- Mode STANDARD : /prompts/gen/concepts/*.md, /prompts/gen/techniques/*.md, /prompts/gen/use_cases/*.md, matrice-raci.md
- Mode LIGHT : /prompts/gen/concepts/core-concepts.md, /prompts/gen/techniques/core-techniques.md, /prompts/gen/use_cases/use-cases-critiques.md

Validation conformité AI-KIDO :
1. Règle 4 : Contraintes lignes (≤500 standard, ≤1000 commands/personas/agents, prompts/hard_points/system/structure/index.json no limit.)
2. Règle 6 : Liens bidirectionnels (quick check seulement)
3. Règle 2 : Emplacement correct (concepts/techniques/use_cases)
4. Frontmatter valide (version, date, statut, mode pour Light)
5. Détection fichiers vides ou mal formés

Pour chaque fichier non-conforme, retourne :
- Fichier + violation détectée avec line numbers
- Quick fix actionnable

Génère score conformité :
- Fichiers validés : [TOTAL]
- Conformes : [NOMBRE] (✅)
- Non-conformes : [NOMBRE] (❌)
- Score conformité : [POURCENTAGE]%

Mode rapide optimisé : <5k tokens total."

**Résultat attendu** : Score conformité finale post-initialisation avec violations éventuelles
```

**Avantages de l'agent** :
- ✅ Validation systématique tous fichiers créés
- ✅ Score conformité immédiat
- ✅ Quick fixes si violations détectées
- ✅ Garantie qualité dès initialisation

**Si score < 90%** : Afficher violations et proposer corrections automatiques
**Si score ≥ 90%** : Confirmer initialisation réussie

#### 8.5 Indexation Vectorielle (si supportée)

Si le système supporte l'indexation vectorielle :
- Indexer tous les nouveaux fichiers créés
- Mettre à jour les embeddings des concepts
- Créer les liens sémantiques entre éléments

## Messages de Confirmation

**Si AIKIDO_MODE = STANDARD** :

Utiliser l'outil `attempt_completion` pour afficher le message de succès :
```
✅ Memory bank AI-KIDO initialisée avec succès en mode STANDARD !

Fichiers créés :
- /prompts/gen/concepts/glossaire-projet.md (si documents hard-points)
- /prompts/gen/concepts/architecture-systeme.md
- /prompts/gen/concepts/matrice-raci.md
- /prompts/gen/techniques/stack-technique.md
- /prompts/gen/use_cases/use-cases-fondamentaux.md
- AGENTS.md (créé/mis à jour - Mode STANDARD)

Index mis à jour :
- /prompts/index.md (index principal - référence ai-kido.md)
- /prompts/gen/index.md 
- /prompts/gen/concepts/index.md
- /prompts/gen/techniques/index.md
- /prompts/gen/use_cases/index.md

🎯 Base AI-KIDO STANDARD prête pour la suite du développement !
   Structure complète multi-agents avec 6-12 personas et RACI complet.
```

**Si AIKIDO_MODE = LIGHT** :

Utiliser l'outil `attempt_completion` pour afficher le message de succès :
```
✅ Memory bank AI-KIDO initialisée avec succès en mode LIGHT !

Fichiers créés :
- /prompts/gen/concepts/core-concepts.md (fichier unifié)
- /prompts/gen/techniques/core-techniques.md (fichier unifié)
- /prompts/gen/use_cases/use-cases-critiques.md (3 cas maximum)
- /prompts/gen/concepts/matrice-raci-light.md (si RACI minimal choisi)
- AGENTS.md (créé/mis à jour - Mode LIGHT)

Index mis à jour :
- /prompts/index.md (index principal - référence ai-kido-light.md)
- /prompts/gen/index.md 
- /prompts/gen/concepts/index.md
- /prompts/gen/techniques/index.md
- /prompts/gen/use_cases/index.md

🎯 Base AI-KIDO LIGHT prête pour la suite du développement !
   Structure minimale avec 3-5 personas maximum et fichiers unifiés.
   Approche agent unitaire privilégiée.
```

## 🤖 Récapitulatif des Agents AI-KIDO Utilisés

Cette commande optimise l'initialisation de la Memory Bank en utilisant **4 agents AI-KIDO spécialisés** :

### Phase 1 : `agent-aikido-explore-bank` (DEEP MODE) 🆕
- **Rôle** : Extraction intelligente des informations depuis sources (hard-points + code)
- **Output** : Rapport structuré avec contexte projet, architecture, stack, terminologie, contraintes
- **Tokens** : ~25-40k (DEEP mode)
- **Gain** : ~70% tokens vs extraction manuelle

### Phase 5.4 : `agent-aikido-truth-evaluator` 🆕
- **Rôle** : Résolution automatique des contradictions entre informations existantes et nouvelles
- **Output** : Liste contradictions avec recommandations (KEEP/USE_NEW/MERGE/ASK_USER)
- **Tokens** : Optimisé selon nombre de conflits
- **Gain** : ~60% conflits résolus automatiquement

### Phase 5.5 : `agent-aikido-raci-delegator` (Mode STANDARD uniquement) 🆕
- **Rôle** : Classification automatique des documents selon matrice RACI
- **Output** : Mapping document → rôle → chemin cible avec justifications
- **Tokens** : Optimisé selon nombre de documents
- **Gain** : ~80% classifications automatisées

### Phase 8.4 : `agent-aikido-validator` 🆕
- **Rôle** : Validation finale conformité AI-KIDO de tous les fichiers créés
- **Output** : Score conformité avec violations éventuelles et quick fixes
- **Tokens** : <5k
- **Gain** : Garantie qualité dès initialisation

### 📊 Gains d'Optimisation

| Aspect | Avant (manuel) | Après (agents) | Gain |
|--------|----------------|----------------|------|
| **Extraction sources** | Manuelle multi-outils | agent-explore-bank auto | ~70% tokens |
| **Résolution conflits** | Questions utilisateur | agent-truth-evaluator auto | ~60% conflits auto |
| **Classification RACI** | Manuelle | agent-raci-delegator auto | ~80% auto |
| **Validation finale** | Absente | agent-validator systématique | +Garantie qualité |
| **Workflow global** | ~100k tokens | ~50k tokens | ~50% efficacité |

## Gestion des Erreurs

- **Documents spécifiés introuvables** : Lister les fichiers manquants et proposer mode manuel
- **Sources projet inaccessibles** : Lister les répertoires non accessibles et continuer avec les sources disponibles
- **Documents hard-points illisibles** : Passer en mode manuel avec avertissement
- **Chemins invalides** : Redemander avec exemples de chemins corrects
- **Informations incomplètes** : Redemander les éléments manquants
- **Analyse automatique échouée** : Basculer en mode manuel avec les informations partielles
- **Stack technique non détectée** : Demander saisie manuelle
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
- 🆕 **Optimisation avec agents AI-KIDO** :
  - agent-aikido-explore-bank (Phase 1 : extraction intelligente)
  - agent-aikido-truth-evaluator (Phase 5.4 : résolution contradictions)
  - agent-aikido-raci-delegator (Phase 5.5 : classification RACI)
  - agent-aikido-validator (Phase 8.4 : validation finale)

---
