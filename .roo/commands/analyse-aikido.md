---
description: "Audit complet des tables de vérités AI-KIDO pour détecter dérivations, incohérences et liens cassés"
---
# Commande Analyse-Aikido - Version Intégrée
>
> **Objectif** : Audit et redressage automatique de la base AI-KIDO avec corrections directes selon les règles 1-18
> **Principe** : Corrections directes dans `/prompts/gen/` et synchronisation `AGENTS.md` selon règles AI-KIDO

## Vue d'ensemble

Cette commande effectue un audit complet des tables de vérités dans `/prompts/gen/` et `/prompts/hard_points/`, détecte les incohérences selon les règles AI-KIDO 1-18, puis applique automatiquement les corrections nécessaires pour maintenir la cohérence de la memory bank.

**PRINCIPE FONDAMENTAL** : Pas de répertoires d'analyse séparés - corrections directes dans la base AI-KIDO existante selon les règles établies.

## Phase 1 : Audit Structurel selon Règles AI-KIDO

### 1.1 Validation de la Structure Obligatoire (Règles 1-2, 8, 15)

**Vérifier la conformité** à la structure définie dans [`ai-kido.md`](../prompts/hard_points/ai-kido.md) lignes 79-105 :

```markdown
🔍 AUDIT STRUCTUREL AI-KIDO

Structure obligatoire vérifiée :
✅ /prompts/gen/index.md (point d'entrée principal - Règle 1)
✅ /prompts/gen/concepts/ (théorie - Règle 2)
✅ /prompts/gen/techniques/ (pratique - Règle 2)  
✅ /prompts/gen/personas/ (agents spécialisés - Règle 9)
✅ /prompts/gen/use_cases/ (applications - Règle 2)
✅ /prompts/hard_points/ (vérités immuables - Règle 8)

Répartition par rôles (Règle 15) :
✅ Sous-répertoires avec responsables assignés
✅ Matrice RACI respectée

❌ Corrections automatiques appliquées : [LISTE]
```

### 1.2 Validation des Contraintes d'Équilibrage (Règles 4, 7)

**Appliquer automatiquement** les contraintes :

- **Règle 4** : Aucun fichier > 500 lignes → Division automatique avec liens préservés
- **Règle 7** : Facteur 3-7 enfants/parent, profondeur ≤ 4 niveaux → Restructuration automatique

```bash
# Auto-correction des fichiers > 500 lignes
find /prompts/gen -name "*.md" -exec wc -l {} \; | awk '$1 > 500 {
    echo "🔧 Division automatique : " $2 " (" $1 " lignes)"
    # Logique de division avec préservation des liens
}'
```

## Phase 2 : Validation et Correction des Formats (Règles 4, 11, 12)

### 2.1 Format Standard AI-KIDO

**Corriger automatiquement** tous les fichiers non conformes au format [`ai-kido.md`](../prompts/hard_points/ai-kido.md) lignes 140-163 :

```markdown
📋 CORRECTIONS DE FORMAT APPLIQUÉES

Format standard AI-KIDO imposé :
✅ Métadonnées ajoutées : > Version: X.Y | Date: YYYY-MM-DD | Statut: [Statut]
✅ Sections obligatoires créées : Vue d'ensemble, Définitions clés, etc.
✅ Densité sémantique optimisée (Règle 11)
✅ Schémas Mermaid ajoutés si pertinent (Règle 12)

Fichiers corrigés automatiquement : [NOMBRE]
```

### 2.2 Liens Bidirectionnels (Règle 6)

**Créer automatiquement** tous les liens bidirectionnels manquants :

```markdown
🔗 LIENS BIDIRECTIONNELS RESTAURÉS

Règle 6 appliquée - Chaînage A ↔ B systématique :
✅ Liens retour créés automatiquement
✅ Navigation hiérarchique rétablie
✅ Références croisées ajoutées

Liens bidirectionnels ajoutés : [NOMBRE]
```

## Phase 3 : Synchronisation AGENTS.md ↔ AI-KIDO (Règles 16-18)

### 3.1 Mise à Jour Automatique AGENTS.md

**Synchroniser automatiquement** [`AGENTS.md`](../AGENTS.md) avec `/prompts/gen/` selon règles 16-18 :

```markdown
🤖 SYNCHRONISATION AGENTS.MD

Règles 16-18 appliquées :
✅ Project Context synchronisé avec /prompts/gen/index.md
✅ Available Agents générés depuis /prompts/gen/personas/
✅ Agent Interaction Matrix mise à jour
✅ Usage Guidelines alignées avec use_cases/

Correspondance 1:1 Agents ↔ Personas : [POURCENTAGE]%
```

### 3.2 Validation de Conformité

**Vérifier et corriger** la conformité AGENTS.md :

- ✅ Structure standardisée respectée
- ✅ Liens exclusifs vers `/prompts/gen/` (pas de duplication)
- ✅ Taxonomie AI-KIDO préservée
- ✅ Spécifications RACI alignées

## Phase 4 : Détection et Correction des Incohérences

### 4.1 Incohérences Terminologiques

**Harmoniser automatiquement** la terminologie :

```markdown
📚 HARMONISATION TERMINOLOGIQUE

Glossaire unifié appliqué :
✅ Termes standardisés dans toute la base
✅ Acronymes harmonisés
✅ Définitions cohérentes

Corrections terminologiques : [NOMBRE]
```

### 4.2 Incohérences Architecturales

**Aligner automatiquement** architecture et implémentation :

```markdown
🏗️ COHÉRENCE ARCHITECTURALE

Alignement automatique :
✅ Architecture ↔ Stack technique
✅ Composants ↔ Use cases
✅ Personas ↔ Workflows

Alignements effectués : [NOMBRE]
```

## Phase 5 : Mise à Jour des Index (Règle 1)

### 5.1 Régénération Automatique des Index

**Mettre à jour automatiquement** tous les fichiers d'index :

```markdown
📇 INDEX RÉGÉNÉRÉS

Navigation hiérarchique restaurée (Règle 1) :
✅ /prompts/gen/index.md mis à jour
✅ /prompts/gen/concepts/index.md régénéré
✅ /prompts/gen/techniques/index.md régénéré
✅ /prompts/gen/personas/index.md régénéré
✅ /prompts/gen/use_cases/index.md régénéré

Parcours récursif optimisé depuis point d'entrée principal.
```

### 5.2 Validation de la Navigation

**Vérifier** que le parcours récursif depuis [`/prompts/gen/index.md`](../prompts/gen/index.md) fonctionne correctement :

- ✅ Tous les fichiers accessibles depuis le point d'entrée
- ✅ Navigation hiérarchique cohérente
- ✅ Liens de retour fonctionnels

## Phase 6 : Application des Règles d'Auto-Alimentation

### 6.1 Capitalisation des Analyses (Règles de Capitalisation)

**Créer automatiquement** les fichiers manquants selon les règles de capitalisation :

```markdown
💾 CAPITALISATION AUTOMATIQUE

Règles de capitalisation appliquées :
✅ Analyses conceptuelles → /concepts/
✅ Analyses techniques → /techniques/
✅ Analyses de cas → /use_cases/
✅ Définitions de rôles → /personas/

Fichiers créés automatiquement : [NOMBRE]
```

### 6.2 Traçabilité et Versioning

**Appliquer** le versioning automatique :

- ✅ Horodatage des modifications
- ✅ Versioning des analyses sauvegardées
- ✅ Traçabilité des corrections appliquées

## Phase 7 : Validation des Hard Points (Règle 8)

### 7.1 Respect des Vérités Immuables

**Vérifier** que toutes les corrections respectent les [`hard_points`](../prompts/hard_points/) :

```markdown
🔒 HARD POINTS RESPECTÉS

Vérités immuables préservées :
✅ Aucune violation des contraintes hard_points
✅ Hiérarchie hard_points > gen/ > demandes respectée
✅ Décisions figées maintenues

Conformité hard_points : 100%
```

## Phase 8 : Génération du Rapport de Synthèse

### 8.1 Rapport Intégré dans la Base AI-KIDO

**Créer** le rapport dans [`/prompts/spec/audit-aikido-[DATE].md`](../prompts/spec/) :

```markdown
# Audit AI-KIDO - [DATE]

> Version: 1.0 | Date: YYYY-MM-DD | Statut: Rapport d'Audit
> Conforme aux règles AI-KIDO 1-18

## Vue d'ensemble

**Statut global** : [EXCELLENT/BON/MOYEN/CRITIQUE]
**Conformité règles 1-18** : [X]%
**Corrections automatiques appliquées** : [NOMBRE]

## Métriques de Conformité

### Règles Structurelles (1-8)
- Règle 1 (Arborescence) : ✅ Conforme
- Règle 2 (Séparation) : ✅ Conforme
- Règle 4 (500 lignes) : ✅ [X] fichiers divisés
- Règle 6 (Bidirectionnalité) : ✅ [Y] liens ajoutés
- Règle 7 (Équilibrage) : ✅ Conforme
- Règle 8 (Hard Points) : ✅ Respectés

### Règles d'Optimisation (9-15)
- Règle 9 (Agents) : ✅ [Z] personas validés
- Règle 11 (Densité) : ✅ Optimisée
- Règle 12 (Mermaid) : ✅ [W] schémas ajoutés
- Règle 15 (Rôles) : ✅ RACI respecté

### Règles AGENTS.md (16-18)
- Règle 16 (Interface) : ✅ Synchronisée
- Règle 17 (Bidirectionnalité) : ✅ Conforme
- Règle 18 (Structure) : ✅ Standard respecté

## Corrections Appliquées

### Corrections Automatiques
- Formats standardisés : [NOMBRE]
- Liens bidirectionnels créés : [NOMBRE]
- Fichiers divisés (>500 lignes) : [NOMBRE]
- Index régénérés : [NOMBRE]
- AGENTS.md synchronisé : ✅

### Améliorations Apportées
- Densité sémantique optimisée
- Navigation hiérarchique restaurée
- Cohérence terminologique établie
- Architecture alignée

## État Post-Audit

**Base AI-KIDO** : ✅ Conforme aux 18 règles
**AGENTS.md** : ✅ Synchronisé et conforme
**Navigation** : ✅ Parcours récursif fonctionnel
**Liens** : ✅ Bidirectionnalité complète

## Relations et dépendances

- Référence : [ai-kido.md](../hard_points/ai-kido.md)
- Synchronisé avec : [AGENTS.md](../../AGENTS.md)
- Point d'entrée : [index.md](index.md)
```

## Workflow d'Exécution

### Commande Unique

```bash
analyse-aikido
```

### Séquence d'Exécution Automatique

1. **Audit structurel** → Corrections immédiates
2. **Validation formats** → Standardisation automatique
3. **Liens bidirectionnels** → Création automatique
4. **Synchronisation AGENTS.md** → Mise à jour automatique
5. **Index et navigation** → Régénération automatique
6. **Rapport intégré** → Création dans `/concepts/`

### Options de Commande

- `analyse-aikido` : Audit complet avec corrections automatiques
- `analyse-aikido --dry-run` : Simulation sans modifications
- `analyse-aikido --report-only` : Génération de rapport uniquement
- `analyse-aikido --sync-agents` : Synchronisation AGENTS.md uniquement

## Résultat Final

```markdown
✅ AUDIT AI-KIDO TERMINÉ

Base AI-KIDO auditée et corrigée :
- Conformité règles 1-18 : [X]%
- Corrections automatiques : [Y] appliquées
- AGENTS.md synchronisé : ✅
- Navigation optimisée : ✅

Rapport disponible : /prompts/gen/concepts/audit-aikido-[DATE].md

🎯 Memory Bank AI-KIDO maintenue et optimisée !
```

---

**RÈGLES APPLIQUÉES** :

- ✅ **Corrections directes** : Modifications dans `/prompts/gen/` selon règles AI-KIDO
- ✅ **Pas de répertoires d'analyse** : Intégration complète dans la base existante
- ✅ **Synchronisation AGENTS.md** : Conformité règles 16-18
- ✅ **Auto-alimentation** : Capitalisation selon règles établies
- ✅ **Hard Points respectés** : Priorité absolue aux vérités immuables
- ✅ **Format standard** : Conformité au template AI-KIDO
- ✅ **Liens bidirectionnels** : Règle 6 appliquée systématiquement
- ✅ **Navigation hiérarchique** : Parcours récursif depuis index principal
- ✅ **Rapport intégré** : Documentation dans `/spec/` selon standards
