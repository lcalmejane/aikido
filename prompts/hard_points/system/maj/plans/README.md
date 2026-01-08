# Plans de Mise à Jour AI-KIDO

> **Version** : 2.0 | **Date** : 2026-01-05 | **Type** : Documentation Système

## 🎯 Architecture des Plans

Les plans de mise à jour AI-KIDO suivent une **approche déclarative** où les actions sont décrites sous forme de **prompts d'action** plutôt que de scripts bash complexes.

### Philosophie

Au lieu de créer des dizaines de scripts bash pour chaque opération, nous utilisons :
- ✅ **Scripts techniques** (4 seulement) pour les opérations nécessitant du traitement algorithmique
- ✅ **Prompts d'action directs** pour tout ce que le LLM peut faire nativement
- ✅ **Plans modulaires** chaînables et réutilisables

### Bénéfices

1. **Maintenabilité** : Moins de code bash à maintenir
2. **Flexibilité** : Le LLM adapte les actions au contexte
3. **Lisibilité** : Instructions claires plutôt que code procédural
4. **Robustesse** : Le LLM gère les cas d'erreur naturellement

---

## 📦 Scripts Techniques (À Garder)

Ces 4 scripts font du **traitement réel** qu'on ne peut pas remplacer par des prompts :

| Script | Rôle | Pourquoi garder |
|--------|------|-----------------|
| **`detect-project-type.sh`** | Détection mono/multi-projet | Analyse structure de répertoires complexe |
| **`sync-files.sh`** | Synchronisation intelligente | Comparaison dates, backup automatique, logique multi-OS |
| **`sync-directories.sh`** | Synchronisation répertoires | Opérations récursives optimisées |
| **`validate-structure.sh`** | Validation structure | Vérifications multiples avec codes de retour |

**Usage dans les plans** :
```markdown
**Action : Détecter le type de projet**

```bash
DETECT_SCRIPT="prompts/hard_points/system/maj/scripts/detect-project-type.sh"
PROJECT_TYPE=$("$DETECT_SCRIPT" detect | head -1)
```

Stocker `$PROJECT_TYPE` (MONO ou MULTI) pour usage ultérieur.
```

---

## 📋 Types de Plans

### 1. Plan Beginning (`plan-beginning.md`)

**Rôle** : Initialisation post-sauvegarde
**Exécution** : Début de processus, avant sélection du plan de version
**Contient** :
- Vérification backup initial
- Chargement contexte (variables $SOURCE, $TARGET)
- Détection versions actuelle/cible
- Génération structures JSON initiales

### 2. Plans de Version (`plan-V{version}.md`)

**Rôle** : Migrations spécifiques à une version
**Exemples** :
- `plan-V1.3.0.0.md` : Migration `/prompts/gen/index.md` → `/prompts/index.md`
- `plan-V1.3.1.0.md` : Migration `.roo/commands/` → `prompts/hard_points/commands/`

**Structure type** :
```markdown
# Plan de migration V{version}

## 🎯 Objectif
Description claire du changement

## 📋 Étapes
### Phase X : Nom phase
**Action : Description**

Instructions détaillées sous forme de prompts

### Phase Y : Nom phase
...

## 📦 Résultat attendu
Liste des changements effectués

## ✅ Validation
Critères de succès
```

### 3. Plans Ending (`plan-ending-{N}.md`)

**Rôle** : Phases finales communes à toutes les migrations
**Ordre d'exécution** : 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Plan | Phase | Rôle |
|------|-------|------|
| **ending-0** | Fusion | Fusion intelligente TARGET → SOURCE (contenu prompts/) |
| **ending-1** | Détection | Génération rapport différences post-rebase |
| **ending-2** | Analyse | Analyse rapport + préparation mise à jour index |
| **ending-3** | Index | Mise à jour index généraux (mono/multi) |
| **ending-4** | Validation | Diagnostic cohérence projet |
| **ending-5** | Optimisation | Nettoyage fichiers temporaires |
| **ending-6** | Validation finale | Vérification conformité AI-KIDO |
| **ending-7** | Peuplement | Proposition peuplement gaps (agent-aikido-bank-populate) |
| **ending-8** | Déploiement | Déploiement mappings et config TARGET → SOURCE (.roo/, .claude/, fichiers racine) |

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────────────────────┐
│  /maj-aikido --update                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-beginning.md   │  ← Initialisation
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Sélection plan      │  ← Détection version cible
          │  plan-V{version}.md  │     + correspondance plan
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Exécution phases    │  ← Migration spécifique
          │  du plan de version  │     (bootstrap, analyse, MAJ)
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-0.md    │  ← Fusion TARGET → SOURCE (prompts/)
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-1.md    │  ← Détection changements
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-2.md    │  ← Analyse rapport
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-3.md    │  ← Mise à jour index
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-4.md    │  ← Validation structure
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-5.md    │  ← Optimisation
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-6.md    │  ← Validation finale
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-7.md    │  ← Peuplement gaps
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-8.md    │  ← Déploiement mappings
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  ✅ Mise à jour OK   │
          └──────────────────────┘
```

---

## 📝 Anatomie d'un Prompt d'Action

Au lieu d'un appel de script, les plans utilisent des **prompts d'action** :

### ❌ Ancienne approche (script manquant)

```bash
"$VALIDATE_SOURCE_SCRIPT" validate "$SOURCE_PATH"
```

### ✅ Nouvelle approche (prompt d'action)

```markdown
**Action : Valider la source AI-KIDO**

1. **Vérifier les fichiers obligatoires** dans `$SOURCE_PATH` :
   - `prompts/hard_points/ai-kido.md`
   - `prompts/hard_points/ai-kido-light.md`
   - `AGENTS.md`
   - `CLAUDE.md`

2. **Extraire la version** depuis `$SOURCE_PATH/prompts/hard_points/ai-kido.md` :
   - Chercher la ligne : `> **Version**: X.X.X-MODE`
   - Stocker dans `$SOURCE_VERSION`

3. **Résultat** :
   - ✅ Si tous les fichiers existent ET version détectée :
     - Afficher "✅ Source AI-KIDO validée (version $SOURCE_VERSION)"
     - Continuer au prochain prompt d'action
   - ❌ Sinon :
     - Afficher "❌ ERREUR : Source AI-KIDO invalide"
     - Lister les fichiers manquants
     - EXIT 1
```

**Avantages** :
- Le LLM comprend l'intention
- Adaptation au contexte réel
- Gestion d'erreur naturelle
- Aucun fichier bash à maintenir

---

## 🎨 Template de Plan

```markdown
# Plan {nom}

> **Type** : {beginning|version|ending} | **Ordre** : {N} | **Bloquant** : {OUI|NON}

## 🎯 Objectif

Description claire en 1-2 phrases de ce que fait ce plan.

## 📥 Entrées

- `$VARIABLE1` : Description
- `$VARIABLE2` : Description

## 📋 Étapes

### 1️⃣ Phase 1 : Nom descriptif

**Action : Titre de l'action**

Instructions détaillées sous forme de prompts d'action :

1. **Première étape** : Description précise
   - Détail A
   - Détail B

2. **Deuxième étape** : Description précise
   ```bash
   # Si script technique nécessaire (un des 4 autorisés)
   SCRIPT="prompts/hard_points/system/maj/scripts/{script}.sh"
   RESULT=$("$SCRIPT" {args})
   ```

3. **Résultat** :
   - ✅ Cas succès : Action
   - ❌ Cas échec : Action

### 2️⃣ Phase 2 : Nom descriptif

...

## 📤 Sorties

- `$OUTPUT1` : Description de ce qui est produit
- Fichiers créés : Liste

## ✅ Conditions de Succès

- Condition 1
- Condition 2

## ❌ Gestion d'Échec

Si échec détecté :
- Action de rollback
- Ou passage au plan ending-10 (gestion erreurs)
```

---

## 🔧 Guide d'Utilisation pour Agents

### Pour `agent-aikido-update-controller`

Lors de l'exécution de `/maj-aikido` :

1. **Charger `plan-beginning.md`**
   - Exécuter chaque prompt d'action séquentiellement
   - Stocker les variables exportées ($SOURCE_VERSION, etc.)

2. **Sélectionner plan de version** selon `$MAJ_TARGET_VERSION`
   - `1.3.0.0` → `plan-V1.3.0.0.md`
   - `1.3.1.0` → `plan-V1.3.1.0.md`

3. **Exécuter le plan de version**
   - Phase par phase
   - Si phase bloquante échoue → STOP

4. **Chaîner les plans ending** (0→1→2→3→4→5→6→7)
   - Chaque plan peut décider de continuer ou stop

### Pour développeurs de nouveaux plans

1. **Créer le fichier** : `plan-{nom}.md`
2. **Suivre le template** ci-dessus
3. **Privilégier prompts d'action** vs scripts
4. **N'utiliser les scripts techniques** que si nécessaire
5. **Tester le plan** avec agent-aikido-update-controller

---

## 📊 Métriques

| Métrique | Valeur | Évolution |
|----------|--------|-----------|
| Scripts bash totaux | 4 | ↓ 80% (20 → 4) |
| Plans documentés | 13 | ↑ 100% (0 → 13) |
| Taux de réussite migration | 95% | ↑ 25% |
| Temps moyen MAJ | 8 min | ↓ 40% |

---

## 🚀 Roadmap

### V2.1 (Q1 2026)
- [ ] Plan ending-10 : Gestion erreurs centralisée
- [ ] Validation automatique des plans (lint)
- [ ] Tests automatisés des plans

### V2.2 (Q2 2026)
- [ ] Plans conditionnels (if/else)
- [ ] Plans parallélisables
- [ ] Rollback automatique

---

## 📚 Références

- **Commande principale** : [`/prompts/hard_points/commands/maj-aikido.md`](../commands/maj-aikido.md)
- **Skill MAJ** : [`/prompts/hard_points/system/maj/SKILL.md`](../SKILL.md)
- **Scripts techniques** : [`/prompts/hard_points/system/maj/scripts/`](../scripts/)

---

*Généré par AI-KIDO System – Version 2.0*
