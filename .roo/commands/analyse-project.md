---
description: "Analyser les sources projet existantes pour alimenter et mettre à jour les tables de vérités AI-KIDO"
---

# Commande Analyse-Project

Analyse les sources projet existantes (code, documentation, configuration) pour alimenter et enrichir les tables de vérités AI-KIDO existantes dans [`/prompts/gen/`](../prompts/gen/). Cette commande priorise la vérité du code sur la documentation et gère les contradictions par validation utilisateur.

## Exécution

### Phase 1 : Configuration de l'Analyse Polymorphe

#### 1.1 Définition de la Nature de l'Analyse

Poser la **Question 1 : Nature de l'analyse**
```
Quelle nature d'analyse souhaitez-vous effectuer ?

ANALYSES ARCHITECTURALES :
1. Analyse globale simple (vue d'ensemble générale)
2. Analyse système C1 (contexte et utilisateurs)
3. Analyse conteneurs C2 (composants de haut niveau)
4. Analyse composants C3 (détail des composants)
5. Analyse code C4 (implémentation détaillée)

ANALYSES TECHNIQUES :
6. Stack technique générale (technologies globales)
7. Stack backend spécifique (serveur, APIs, données)
8. Stack frontend spécifique (interface, UX, client)
9. Stack infrastructure (déploiement, ops, monitoring)
10. Stack sécurité (authentification, autorisation, chiffrement)

ANALYSES FONCTIONNELLES :
11. Analyse fonctionnelle générale (processus métier globaux)
12. Analyse domaine spécifique (secteur d'activité particulier)
13. Analyse use cases (scénarios d'utilisation)
14. Analyse workflows (processus opérationnels)

ANALYSES MÉTHODOLOGIQUES :
15. Analyse UML2 (modélisation orientée objet)
16. Analyse RUP (processus unifié)
17. Analyse Agile (méthodes itératives)
18. Analyse DevOps (intégration continue)

Votre choix (1-18) :
```

#### 1.2 Définition de la Profondeur de l'Analyse

Poser la **Question 2 : Profondeur de l'analyse**
```
Quelle profondeur d'analyse souhaitez-vous appliquer ?

NIVEAUX DE PROFONDEUR :

NIVEAU 1 - SURVOL (Rapide, vue d'ensemble)
- Identification des éléments principaux
- Cartographie de base
- Détection des patterns majeurs
- Durée estimée : Courte

NIVEAU 2 - STANDARD (Équilibré, détail modéré)
- Analyse des relations et dépendances
- Identification des problématiques
- Documentation des choix architecturaux
- Durée estimée : Moyenne

NIVEAU 3 - APPROFONDI (Détaillé, exhaustif)
- Analyse fine des implémentations
- Détection des anti-patterns
- Recommandations d'optimisation
- Durée estimée : Longue

NIVEAU 4 - EXPERT (Très détaillé, spécialisé)
- Audit complet et recommandations
- Analyse de performance et sécurité
- Plan de refactoring si nécessaire
- Durée estimée : Très longue

Votre choix (1/2/3/4) :
```

#### 1.3 Sélection des Sources selon la Configuration

**Adapter automatiquement les sources** selon la nature et profondeur choisies :
```
🎯 CONFIGURATION D'ANALYSE SÉLECTIONNÉE :

Nature : [TYPE_ANALYSE] - [DESCRIPTION]
Profondeur : Niveau [NIVEAU] - [DESCRIPTION_PROFONDEUR]

Sources recommandées pour cette configuration :
[Liste adaptée selon le type d'analyse choisi]

Voulez-vous utiliser les sources recommandées ? (o/n)
Si non, personnalisez votre sélection :
```

**Si choix personnalisé**, poser la **Question 3 : Sources d'analyse personnalisées**
```
Quelles sources voulez-vous analyser pour cette analyse [TYPE_ANALYSE] ?

Options disponibles :
1. Sources code uniquement (src/, lib/, components/, etc.)
2. Documentation uniquement (docs/, README, etc.)
3. Configuration uniquement (package.json, docker, CI/CD, etc.)
4. Analyse combinée complète (code + docs + config)
5. Sélection manuelle de répertoires spécifiques

Votre choix (1/2/3/4/5) :
```

**Si choix 1** : Scanner automatiquement les répertoires de code
```
🔍 DÉTECTION AUTOMATIQUE DES SOURCES CODE :

Répertoires code détectés :
[Liste automatique : src/, lib/, components/, modules/, services/, etc.]

Voulez-vous analyser tous ces répertoires ? (o/n)
Si non, sélectionnez les répertoires à analyser :
```

**Si choix 2** : Scanner automatiquement la documentation
```
📚 DÉTECTION AUTOMATIQUE DE LA DOCUMENTATION :

Documentation détectée :
[Liste automatique : docs/, README.md, CHANGELOG.md, wiki/, etc.]

Voulez-vous analyser toute cette documentation ? (o/n)
Si non, sélectionnez les fichiers à analyser :
```

**Si choix 3** : Scanner automatiquement la configuration
```
⚙️ DÉTECTION AUTOMATIQUE DE LA CONFIGURATION :

Fichiers de configuration détectés :
[Liste automatique : package.json, docker-compose.yml, .github/, etc.]

Voulez-vous analyser tous ces fichiers ? (o/n)
Si non, sélectionnez les fichiers à analyser :
```

**Si choix 4** : Analyse combinée complète automatique

**Si choix 5** : Sélection manuelle
```
Listez les chemins des répertoires/fichiers à analyser (séparés par des virgules) :
Exemple : src/components, docs/architecture.md, docker-compose.yml

Votre sélection :
```

### Phase 2 : Analyse des Tables de Vérités et Spécifications RACI Existantes

#### 2.1 Scanner l'État Actuel de la Memory Bank

**Analyser l'état actuel des tables de vérités** :
```
📊 ÉTAT ACTUEL DES TABLES DE VÉRITÉS :

Concepts existants : [NOMBRE] fichiers dans /prompts/gen/concepts/
Techniques existantes : [NOMBRE] fichiers dans /prompts/gen/techniques/
Use cases existants : [NOMBRE] fichiers dans /prompts/gen/use_cases/
Personas existants : [NOMBRE] fichiers dans /prompts/gen/personas/

Dernière mise à jour : [DATE]
```

#### 2.2 Vérification des Spécifications RACI Organisationnelles

**Rechercher les spécifications RACI** dans [`/prompts/gen/index.md`](../prompts/gen/index.md) et [`/prompts/hard_points/index.md`](../prompts/hard_points/index.md) :
```
🏗️ SPÉCIFICATIONS RACI DÉTECTÉES :

Organisations configurées :
[Liste des fichiers aikido-raci-*.md trouvés dans hard_points]

Si spécifications RACI trouvées :
- Organisation : [TEAM-NAME]
- Rôles définis : [NOMBRE]
- Workflow : [ÉTAPES_WORKFLOW]
- Structure par rôles : ✅/❌

Utiliser ces spécifications pour l'organisation des enrichissements ? (o/n)
```

**Si aucune spécification RACI** :
```
⚠️ AUCUNE SPÉCIFICATION RACI DÉTECTÉE

Aucun fichier aikido-raci-*.md trouvé dans /prompts/hard_points/

Options :
1. Continuer sans organisation par rôles (structure plate)
2. Exécuter d'abord init-raci-aikido pour définir l'organisation
3. Créer une organisation temporaire pour cette analyse

Votre choix (1/2/3) :
```

### Phase 3 : Extraction et Analyse des Sources

#### 3.1 Analyse Prioritaire du Code (Vérité de référence)

**A. Analyse des Sources Code** :
1. **Architecture réelle détectée** :
   - Structure des répertoires et modules
   - Patterns architecturaux implémentés
   - Dépendances et relations entre composants
   - Points d'entrée et flux de données

2. **Stack technique réelle** :
   - Technologies effectivement utilisées
   - Versions et configurations
   - Frameworks et bibliothèques
   - Outils de build et déploiement

3. **Logique métier implémentée** :
   - Modèles de données réels
   - Règles business dans le code
   - APIs et interfaces exposées
   - Processus et workflows codés

**B. Analyse de la Documentation (Vérité déclarative)** :
1. **Architecture documentée** :
   - Diagrammes et spécifications
   - Décisions architecturales
   - Contraintes et exigences

2. **Processus documentés** :
   - Workflows décrits
   - Procédures et guidelines
   - Standards et conventions

**C. Analyse de la Configuration (Vérité opérationnelle)** :
1. **Infrastructure réelle** :
   - Environnements configurés
   - Services et dépendances
   - Paramètres de déploiement

#### 3.2 Détection des Contradictions et Écarts

**Comparer systématiquement** :
1. **Code vs Documentation** : Architecture implémentée vs documentée
2. **Code vs Configuration** : Dépendances déclarées vs utilisées
3. **Documentation vs Configuration** : Processus décrits vs configurés
4. **Existant vs Nouveau** : Tables de vérités vs réalité détectée

**Pour chaque contradiction détectée** :
```
⚠️ CONTRADICTION DÉTECTÉE :

Sujet : [Architecture/Stack/Processus/etc.]
Source prioritaire (CODE) : [Ce qui est implémenté]
Source secondaire (DOCS) : [Ce qui est documenté]
Tables de vérités actuelles : [Ce qui est enregistré]

Quelle vérité adopter ?
1. Prioriser le code (vérité implémentée)
2. Prioriser la documentation (vérité intentionnelle)
3. Prioriser les tables existantes (vérité établie)
4. Créer une synthèse personnalisée

Votre choix :
```

### Phase 4 : Enrichissement des Tables de Vérités

#### 4.1 Mise à Jour des Concepts

**Enrichir [`/prompts/gen/concepts/`](../prompts/gen/concepts/)** :
- Mettre à jour l'architecture système avec la réalité détectée
- Enrichir le glossaire avec les termes trouvés dans le code
- Ajouter les nouveaux concepts métier identifiés
- Corriger les définitions contradictoires

#### 4.2 Mise à Jour des Techniques

**Enrichir [`/prompts/gen/techniques/`](../prompts/gen/techniques/)** :
- Mettre à jour la stack technique avec les technologies réelles
- Ajouter les patterns et pratiques détectés dans le code
- Documenter les techniques de déploiement configurées
- Enrichir les méthodes de développement observées

#### 4.3 Mise à Jour des Use Cases

**Enrichir [`/prompts/gen/use_cases/`](../prompts/gen/use_cases/)** :
- Ajouter les cas d'usage implémentés dans le code
- Mettre à jour les workflows avec la réalité opérationnelle
- Documenter les APIs et interfaces réelles
- Corriger les scénarios obsolètes

#### 4.4 Mise à Jour des Personas

**Enrichir [`/prompts/gen/personas/`](../prompts/gen/personas/)** :
- Adapter les personas aux technologies réellement utilisées
- Mettre à jour les responsabilités selon l'architecture réelle
- Ajouter les compétences requises par la stack détectée

### Phase 5 : Répartition par Rôles selon Spécifications RACI (Règle AI-KIDO 15)

#### 5.1 Chargement des Spécifications RACI Organisationnelles

**Si spécifications RACI disponibles**, charger depuis [`/prompts/hard_points/aikido-raci-[TEAM-NAME].md`](../prompts/hard_points/aikido-raci-[TEAM-NAME].md) :
```
📋 CHARGEMENT DES SPÉCIFICATIONS RACI :

Organisation : [TEAM-NAME]
Rôles définis : [LISTE_ROLES]
Workflow organisationnel : [ÉTAPES_WORKFLOW]
Domaines par rôle : [MAPPING_DOMAINES]

Structure existante détectée :
- /prompts/gen/concepts/roles/ : ✅/❌
- /prompts/gen/techniques/roles/ : ✅/❌
- /prompts/gen/use_cases/roles/ : ✅/❌

Utiliser cette organisation pour les enrichissements ? (o/n)
```

#### 5.2 Application de la Structure RACI aux Enrichissements

**Mapper les enrichissements** selon les spécifications RACI :
- **Enrichissements détectés** → **Rôles responsables** (selon matrice RACI)
- **Domaines de connaissance** → **Sous-répertoires appropriés**
- **Workflow de validation** → **Processus d'approbation défini**

#### 5.3 Création/Mise à Jour de la Structure par Rôles

**Adapter les sous-répertoires** selon les spécifications RACI chargées :
```
/prompts/gen/concepts/roles/
├── [role-1-slug]/           # Selon spécifications RACI
├── [role-2-slug]/           # Selon spécifications RACI
├── [role-3-slug]/           # Selon spécifications RACI
└── [role-4-slug]/           # Selon spécifications RACI

/prompts/gen/techniques/roles/
├── [role-1-slug]/           # Selon spécifications RACI
├── [role-2-slug]/           # Selon spécifications RACI
├── [role-3-slug]/           # Selon spécifications RACI
└── [role-4-slug]/           # Selon spécifications RACI

/prompts/gen/use_cases/roles/
├── [role-1-slug]/           # Selon spécifications RACI
├── [role-2-slug]/           # Selon spécifications RACI
├── [role-3-slug]/           # Selon spécifications RACI
└── [role-4-slug]/           # Selon spécifications RACI
```

#### 5.4 Assignation des Enrichissements selon RACI

**Répartir automatiquement** les enrichissements selon la matrice RACI :
```
🎯 ASSIGNATION DES ENRICHISSEMENTS :

Architecture Système détectée → [Rôle Responsable Architecture]
Stack Technique réelle → [Rôle Responsable Développement]
Logique Métier implémentée → [Rôle Responsable Métier]
Configuration Opérationnelle → [Rôle Responsable Opérations]

Contradictions détectées → Workflow de validation RACI appliqué
Enrichissements transversaux → Validation multi-rôles requise

Assignation automatique validée ? (o/n)
```

#### 5.5 Mise à Jour de la Matrice RACI avec les Enrichissements

**Enrichir** [`/prompts/hard_points/aikido-raci-[TEAM-NAME].md`](../prompts/hard_points/aikido-raci-[TEAM-NAME].md) :
```markdown
## Enrichissements par Analyse Projet

### Nouvelles Informations Intégrées
- **Architecture réelle** : [Détails] → Assigné à [Rôle]
- **Stack technique** : [Détails] → Assigné à [Rôle]
- **Processus métier** : [Détails] → Assigné à [Rôle]
- **Configuration ops** : [Détails] → Assigné à [Rôle]

### Contradictions Résolues
- **Code vs Docs** : [Résolution] → Validé par [Rôle Approbateur]
- **Implémentation vs Intention** : [Résolution] → Validé par [Rôle Approbateur]

### Mise à Jour Workflow
- **Dernière analyse** : [DATE]
- **Enrichissements intégrés** : [NOMBRE]
- **Rôles impliqués** : [LISTE_ROLES]

---
*Enrichi automatiquement par analyse-project le [DATE]*
```

### Phase 6 : Équilibrage et Taxonomie AI-KIDO

#### 5.1 Vérification des Règles d'Équilibrage

**Appliquer les règles AI-KIDO** :
```
🌳 VÉRIFICATION DE L'ÉQUILIBRAGE DE L'ARBRE :

Analyse de la structure actuelle :
- Profondeur maximale : [NIVEAU] (limite : 4 niveaux)
- Facteur de branchement : [MIN-MAX] enfants/parent (optimal : 3-7)
- Taille des fichiers : [STATS] lignes (limite : 500 lignes)

Actions d'équilibrage nécessaires :
[Liste des actions de rééquilibrage si nécessaire]
```

#### 5.2 Restructuration Automatique

**Si déséquilibre détecté** :
1. **Split automatique** : Diviser les fichiers > 500 lignes
2. **Regroupement intelligent** : Fusionner les concepts connexes
3. **Réorganisation taxonomique** : Ajuster la hiérarchie
4. **Mise à jour des liens** : Préserver les références bidirectionnelles

#### 5.3 Validation de la Taxonomie

**Vérifier la cohérence taxonomique** :
```
📋 VALIDATION DE LA TAXONOMIE :

Structure concepts/ :
- [NOMBRE] concepts fondamentaux
- [NOMBRE] sous-concepts
- Cohérence : ✅/❌

Structure techniques/ :
- [NOMBRE] techniques pratiques
- [NOMBRE] sous-techniques
- Cohérence : ✅/❌

Structure use_cases/ :
- [NOMBRE] cas d'usage
- [NOMBRE] sous-cas
- Cohérence : ✅/❌

Structure personas/ :
- [NOMBRE] personas
- [NOMBRE] spécialisations
- Cohérence : ✅/❌
```

### Phase 6 : Mise à Jour de l'Indexation Générale AI-KIDO

#### 6.1 Mise à Jour des Index Sectoriels

Mettre à jour automatiquement avec les modifications :
- [`/prompts/gen/concepts/index.md`](../prompts/gen/concepts/index.md) : Nouveaux concepts et mises à jour
- [`/prompts/gen/techniques/index.md`](../prompts/gen/techniques/index.md) : Nouvelles techniques et corrections
- [`/prompts/gen/use_cases/index.md`](../prompts/gen/use_cases/index.md) : Nouveaux use cases et ajustements
- [`/prompts/gen/personas/index.md`](../prompts/gen/personas/index.md) : Personas mis à jour

#### 6.2 Mise à Jour de l'Index Principal

Mettre à jour [`/prompts/gen/index.md`](../prompts/gen/index.md) avec :
- Nouvelles informations projet détectées
- Stack technique réelle confirmée
- Architecture mise à jour
- Statistiques de la memory bank enrichie

#### 6.3 Mise à Jour du Fichier AGENTS.md

Mettre à jour [`AGENTS.md`](../AGENTS.md) avec :
- Contexte projet actualisé selon la réalité détectée
- Agents adaptés aux technologies réelles
- Matrice d'interaction mise à jour
- Guidelines ajustées aux pratiques observées

#### 6.4 Indexation Vectorielle et Liens Sémantiques

Si supporté :
- Réindexer tous les fichiers modifiés
- Mettre à jour les embeddings des concepts enrichis
- Recalculer les liens sémantiques
- Optimiser la navigation entre éléments

## Messages de Confirmation

### Succès - Analyse Complète
```
✅ Analyse projet terminée avec succès !

Sources analysées :
- Code : [NOMBRE] fichiers dans [NOMBRE] répertoires
- Documentation : [NOMBRE] fichiers
- Configuration : [NOMBRE] fichiers

Modifications apportées :
- [X] concepts mis à jour
- [Y] techniques enrichies
- [Z] use cases ajoutés/modifiés
- [W] personas adaptés

Contradictions résolues : [NOMBRE]
Équilibrage appliqué : ✅
Index mis à jour : ✅

🎯 Tables de vérités AI-KIDO synchronisées avec la réalité projet !
```

### Rapport de Contradictions
```
📊 RAPPORT DES CONTRADICTIONS RÉSOLUES :

Architecture :
- Code vs Docs : [NOMBRE] écarts résolus
- Implémentation vs Intention : [DÉTAILS]

Stack Technique :
- Déclarée vs Utilisée : [NOMBRE] différences corrigées
- Versions vs Configuration : [DÉTAILS]

Processus :
- Documentés vs Configurés : [NOMBRE] ajustements
- Théorie vs Pratique : [DÉTAILS]
```

## Gestion des Erreurs

- **Sources inaccessibles** : Lister les répertoires non accessibles et continuer avec les sources disponibles
- **Code non analysable** : Signaler les fichiers problématiques et continuer
- **Documentation corrompue** : Ignorer les fichiers illisibles et signaler
- **Configuration invalide** : Signaler les erreurs de parsing et continuer
- **Contradictions non résolues** : Créer section "Conflits en attente" pour résolution ultérieure
- **Équilibrage impossible** : Signaler les problèmes structurels et proposer solutions manuelles
- **Index corrompus** : Recréer les index depuis les fichiers sources
- **Erreur génération Mermaid** : Créer représentations textuelles de fallback

## Règles AI-KIDO Respectées

- ✅ Priorisation de la vérité du code sur la documentation
- ✅ Gestion des contradictions par validation utilisateur
- ✅ Enrichissement des tables de vérités existantes
- ✅ Respect des contraintes d'équilibrage d'arbre (3-7 enfants, ≤4 niveaux, ≤500 lignes)
- ✅ Préservation des liens bidirectionnels
- ✅ Taxonomie cohérente et hiérarchisée
- ✅ Mise à jour automatique de l'indexation
- ✅ Format Markdown avec métadonnées
- ✅ Schémas Mermaid pour densité sémantique
- ✅ Auto-alimentation de la memory bank

---
