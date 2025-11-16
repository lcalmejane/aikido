---
description: " Synchroniser les hard_points AI-KIDO et optimiser la memory bank lors des rebase git"
---

# Commande AI-KIDO : Mise à Jour et Synchronisation

> **Objectif** : Synchroniser les hard_points AI-KIDO et optimiser la memory bank lors des rebase git
>
> **Usage** : `maj-aikido` - Commande de maintenance pour cohérence AI-KIDO
>
> **Contexte** : Rebase entre branches main et spécialisées

## Vue d'ensemble

Cette commande analyse les changements dans les hard_points AI-KIDO, valide la conformité des règles dans les commandes existantes, et optimise la memory bank pour maintenir la cohérence, pertinence et efficience du système AI-KIDO.

## Phase 1 : Détection des Changements AI-KIDO

### 1.1 Analyse des Versions Hard Points

**Vérifier les changements** dans les fichiers critiques AI-KIDO :

```bash
# Détection automatique des changements depuis le dernier rebase
git diff HEAD~1..HEAD --name-only | grep -E "(ai-kido\.md|index\.md|AGENTS\.md)"
```

**Analyser les fichiers modifiés** :
- [`/prompts/hard_points/ai-kido.md`](../prompts/hard_points/ai-kido.md) : Règles fondamentales AI-KIDO
- [`/prompts/hard_points/index.md`](../prompts/hard_points/index.md) : Index des hard points
- [`/prompts/gen/index.md`](../prompts/gen/index.md) : Point d'entrée des tables de vérités
- [`AGENTS.md`](../../AGENTS.md) : Spécifications des agents (si existant)

### 1.2 Extraction des Nouvelles Règles

**Pour chaque fichier modifié**, extraire :
- **Nouvelles règles** : Règles ajoutées depuis la dernière version
- **Règles modifiées** : Changements dans les règles existantes
- **Règles supprimées** : Règles retirées (attention aux dépendances)
- **Changements de version** : Mise à jour des métadonnées de version

**Format de détection** :
```markdown
📊 CHANGEMENTS DÉTECTÉS - [FICHIER]

Nouvelles règles :
- Règle [N°] : [Description]
- Règle [N°] : [Description]

Règles modifiées :
- Règle [N°] : [Ancien] → [Nouveau]

Règles supprimées :
- Règle [N°] : [Description] ⚠️ Impact à analyser

Version : [ANCIENNE] → [NOUVELLE]
```

## Phase 2 : Validation des Commandes Existantes

### 2.1 Audit de Conformité des Commandes

**Analyser toutes les commandes** dans [`.roo/commands/`](.) :
- [`init-aikido.md`](init-aikido.md)
- [`init-glossaire.md`](init-glossaire.md)
- [`analyse-project.md`](analyse-project.md)
- [`init-raci-aikido.md`](init-raci-aikido.md)
- [`create-persona.md`](create-persona.md)

**Vérifications obligatoires** :

#### A. Conformité aux Règles Architecturales
- ✅ **Règle 1-15** : Vérifier l'application de chaque règle AI-KIDO
- ✅ **Contrainte 500 lignes** : Respect de la limite par fichier généré
- ✅ **Arbre équilibré** : Facteur 3-7 enfants, profondeur ≤ 4
- ✅ **Liens bidirectionnels** : Chaînage A ↔ B systématique
- ✅ **Répartition par rôles** : Application de la règle 15

#### B. Conformité aux Règles d'Auto-Alimentation
- ✅ **Signal utilisateur** : Gestion des erreurs → création règle préventive
- ✅ **Auto-détection** : Seuils et déclenchements automatiques
- ✅ **Intégration** : Placement automatique + mise à jour index

#### C. Conformité aux Règles de Capitalisation
- ✅ **Génération obligatoire** : Création de fichiers dans tables de vérités
- ✅ **Sauvegarde systématique** : Horodatage et versioning
- ✅ **Traçabilité** : Documentation des analyses

### 2.2 Détection des Non-Conformités

**Identifier les écarts** :
```markdown
🚨 NON-CONFORMITÉS DÉTECTÉES

Commande : [NOM_COMMANDE]
- ❌ Règle [N°] non appliquée : [Description]
- ❌ Contrainte violée : [Détail]
- ⚠️ Règle partiellement appliquée : [Description]

Actions requises :
- [ ] Mise à jour de la commande
- [ ] Ajout de validation manquante
- [ ] Correction de la logique
```

## Phase 3 : Mise à Jour de l'Index Général

### 3.1 Synchronisation de l'Index Gen

**Mettre à jour** [`/prompts/gen/index.md`](../prompts/gen/index.md) :

#### A. Nouvelles Règles AI-KIDO
- Ajouter les références aux nouvelles règles
- Mettre à jour les priorités selon les changements
- Enrichir la section "RÈGLES PRIORITAIRES - AI-KIDO"

#### B. Fonctionnalité de Traçabilité
- Vérifier la cohérence de `LLM_TRACIBILITY=TRUE/FALSE`
- Mettre à jour les références aux logs selon les nouvelles règles
- Synchroniser avec [`../hard_points/gestion-logs-aikido.md`](../prompts/hard_points/gestion-logs-aikido.md)

#### C. Structure des Répertoires
- Valider la cohérence avec les nouvelles règles de répartition par rôles
- Mettre à jour les liens vers les sous-répertoires
- Ajouter les nouveaux concepts/techniques/use_cases si nécessaire

### 3.2 Mise à Jour d'AGENTS.md

**Si le fichier [`AGENTS.md`](../../AGENTS.md) existe** :

#### A. Synchronisation des Personas
- Mettre à jour selon la taxonomie AI-KIDO (règles 224-363 du hard point)
- Valider la cohérence avec [`/prompts/gen/personas/`](../prompts/gen/personas/)
- Ajouter les nouveaux personas selon les règles de création

#### B. Matrice RACI des Agents
- Synchroniser avec les spécifications RACI organisationnelles
- Mettre à jour les responsabilités selon les nouvelles règles
- Valider la cohérence avec les fichiers `aikido-raci-*.md`

## Phase 4 : Diagnostic de Cohérence Memory Bank

### 4.1 Audit Complet de la Memory Bank

**Analyser la cohérence** de [`/prompts/gen/`](../prompts/gen/) :

#### A. Cohérence Structurelle
```bash
# Vérification automatique de la structure
find /prompts/gen -name "*.md" -exec wc -l {} \; | awk '$1 > 500 {print "⚠️ " $2 " dépasse 500 lignes (" $1 ")"}'
```

#### B. Cohérence Sémantique
- **Liens bidirectionnels** : Vérifier que A→B implique B→A
- **Références orphelines** : Détecter les liens cassés
- **Doublons conceptuels** : Identifier les redondances
- **Incohérences terminologiques** : Valider l'usage uniforme des termes

#### C. Cohérence Taxonomique
- **Hiérarchie respectée** : Profondeur ≤ 4 niveaux
- **Facteur d'équilibrage** : 3-7 enfants par parent
- **Classification correcte** : Concepts/Techniques/Use_cases/Personas

### 4.2 Métriques de Qualité

**Calculer les métriques** selon les règles AI-KIDO (lignes 455-461) :

```markdown
📊 MÉTRIQUES DE QUALITÉ MEMORY BANK

Conformité : [X]% de fichiers respectant les standards
Traçabilité : [Y]% de fichiers avec références sources
Cohérence : [Z] contradictions internes détectées
Densité : [W] ratio information utile / tokens utilisés

Équilibrage d'arbre :
- Profondeur moyenne : [N] niveaux (max 4)
- Facteur moyen : [F] enfants/parent (3-7)
- Fichiers > 500 lignes : [L] fichiers à diviser

Liens bidirectionnels :
- Liens totaux : [T]
- Liens orphelins : [O]
- Taux de cohérence : [C]%
```

## Phase 5 : Optimisation de la Memory Bank

### 5.1 Optimisation Automatique

#### A. Division des Fichiers Volumineux
**Si fichiers > 500 lignes** :
- Division intelligente avec préservation des liens
- Création de fichiers index pour navigation
- Mise à jour automatique des références

#### B. Correction des Liens Orphelins
- Détection automatique des références cassées
- Proposition de corrections ou suppressions
- Mise à jour des index concernés

#### C. Élimination des Redondances
- Identification des doublons conceptuels
- Fusion intelligente avec préservation de l'information
- Redirection des références vers la version consolidée

### 5.2 Optimisation Sémantique

#### A. Densité Sémantique
- Analyse du ratio information/tokens
- Suggestions de compression sans perte d'information
- Optimisation des schémas Mermaid pour densité visuelle

#### B. Amélioration de la Navigation
- Génération automatique de tables des matières
- Création de liens de navigation rapide
- Optimisation de l'indexation vectorielle

### 5.3 Propositions d'Amélioration

**Générer un rapport d'optimisation** :
```markdown
🎯 PROPOSITIONS D'OPTIMISATION

Optimisations Automatiques Appliquées :
- [X] fichiers divisés (> 500 lignes)
- [Y] liens orphelins corrigés
- [Z] redondances éliminées

Optimisations Recommandées :
- [ ] Enrichissement du glossaire avec [N] nouveaux termes
- [ ] Création de [M] nouveaux use cases identifiés
- [ ] Mise à jour de [P] personas selon nouvelles règles
- [ ] Ajout de [Q] schémas Mermaid pour densité sémantique

Métriques Améliorées :
- Conformité : [AVANT]% → [APRÈS]%
- Cohérence : [AVANT] → [APRÈS] contradictions
- Densité : [AVANT] → [APRÈS] ratio
```

## Phase 6 : Validation et Revalidation Git

### 6.1 Processus de Revalidation

**Intégration dans le workflow Git** :

#### A. Pre-commit Hook
```bash
#!/bin/bash
# Hook de validation AI-KIDO avant commit
.roo/commands/maj-aikido --validate-only
if [ $? -ne 0 ]; then
    echo "❌ Validation AI-KIDO échouée - Commit bloqué"
    exit 1
fi
```

#### B. Post-merge Hook
```bash
#!/bin/bash
# Hook d'optimisation AI-KIDO après merge
.roo/commands/maj-aikido --optimize-after-merge
```

### 6.2 Rapport de Rebase

**Générer un rapport complet** :
```markdown
# Rapport de Synchronisation AI-KIDO - [DATE]

## Changements Détectés
- Hard points modifiés : [LISTE]
- Nouvelles règles : [NOMBRE]
- Règles modifiées : [NOMBRE]

## Validations Effectuées
- Commandes auditées : [NOMBRE]
- Non-conformités détectées : [NOMBRE]
- Corrections appliquées : [NOMBRE]

## Optimisations Réalisées
- Memory bank optimisée : ✅
- Métriques améliorées : [DÉTAILS]
- Cohérence renforcée : ✅

## Actions Post-Rebase
- [ ] Révision des non-conformités restantes
- [ ] Validation des optimisations par l'équipe
- [ ] Mise à jour de la documentation projet
```

## Phase 7 : Mise à Jour des Spécifications RACI

### 7.1 Synchronisation RACI Organisationnelle

**Si nouvelles règles de répartition par rôles** :
- Mettre à jour les fichiers `aikido-raci-*.md` existants
- Valider la cohérence avec l'organisation actuelle
- Proposer des ajustements si nécessaire

### 7.2 Notification des Responsables

**Alerter les responsables** des domaines impactés :
```markdown
🔔 NOTIFICATIONS RACI - Changements AI-KIDO

Responsables impactés :
- [RÔLE] : [CHANGEMENTS_CONCERNANT_SON_DOMAINE]
- [RÔLE] : [CHANGEMENTS_CONCERNANT_SON_DOMAINE]

Actions requises :
- Révision des modifications dans leur domaine
- Validation des optimisations proposées
- Mise à jour des processus si nécessaire
```

## Résultat Final

```markdown
✅ SYNCHRONISATION AI-KIDO TERMINÉE

Changements traités :
- Hard points analysés : [NOMBRE]
- Règles validées : [NOMBRE]
- Commandes mises à jour : [NOMBRE]

Memory bank optimisée :
- Cohérence : [MÉTRIQUE]%
- Efficience : [MÉTRIQUE]%
- Conformité : [MÉTRIQUE]%

Prêt pour la production : ✅
Rebase git sécurisé : ✅
Équipe notifiée : ✅

🎯 Système AI-KIDO synchronisé et optimisé pour la collaboration !
```

## Fonctionnalités Avancées

### Modes d'Exécution

- `maj-aikido --validate-only` : Validation seule sans optimisation
- `maj-aikido --optimize-only` : Optimisation seule sans validation
- `maj-aikido --dry-run` : Simulation sans modifications
- `maj-aikido --force` : Forcer les optimisations même en cas de conflits

### Intégration CI/CD

- Hook pre-commit pour validation automatique
- Hook post-merge pour optimisation automatique
- Rapport de qualité dans les MR/PR
- Métriques de conformité AI-KIDO dans le dashboard

### Notifications

- Slack/Teams pour changements critiques
- Email pour rapports de synchronisation
- Issues Git pour non-conformités détectées
- Dashboard temps réel des métriques AI-KIDO

---

**RÈGLES APPLIQUÉES** :
- ✅ **Polymorphisme** : Adaptation selon les changements détectés
- ✅ **Auto-alimentation** : Amélioration continue de la memory bank
- ✅ **Règle 15** : Respect de la répartition par rôles humains
- ✅ **Contraintes AI-KIDO** : Validation de toutes les règles architecturales
- ✅ **Optimisation tokens** : Densité sémantique et efficience
- ✅ **Traçabilité** : Documentation complète des changements
- ✅ **Cohérence** : Maintien de l'intégrité du système AI-KIDO
- ✅ **Workflow Git** : Intégration native dans les processus de développement
