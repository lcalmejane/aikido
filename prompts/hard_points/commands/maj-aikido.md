---
description: "Mise à jour et synchronisation complète AI-KIDO via système de plans modulaires"
---

# 🔄 COMMANDE MAJ-AIKIDO - Orchestrateur de Mise à Jour

> **Version**: 3.0 | **Architecture**: Plans modulaires V2.0 | **Rôle**: Orchestrateur

## 🎯 Vue d'ensemble

Cette commande **orchestre** la mise à jour AI-KIDO en déléguant les opérations aux **plans modulaires** :

- 📋 **plan-beginning.md** : Initialisation et détection versions
- 🔄 **plan-V{version}.md** : Migration spécifique à la version cible
- ✅ **plan-ending-{0-7}.md** : Phases finales communes (fusion, validation, peuplement)
- ❌ **plan-ending-10.md** : Gestion erreurs centralisée

**Philosophie** : La commande ne fait PAS les actions elle-même, elle **exécute les plans** dans le bon ordre.

---

## 🚀 Utilisation

```bash
# Mode UPDATE - Mise à jour depuis source externe
/maj-aikido --update

# Mode SYNC - Synchronisation classique post-rebase
/maj-aikido
```

---

## 📋 WORKFLOW GLOBAL

```
┌─────────────────────────────────────────────────────────────┐
│  Phase Préparatoire : Sélection & Validation Source        │
│  (uniquement en mode --update)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-beginning.md   │  ← Initialisation + détection versions
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-V{version}.md  │  ← Migration spécifique
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-0.md    │  ← Fusion intelligente
          │  plan-ending-1.md    │  ← Détection changements
          │  plan-ending-2.md    │  ← Analyse rapport
          │  plan-ending-3.md    │  ← Mise à jour index
          │  plan-ending-4.md    │  ← Validation structure
          │  plan-ending-5.md    │  ← Optimisation
          │  plan-ending-6.md    │  ← Validation finale
          │  plan-ending-7.md    │  ← Peuplement gaps
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  ✅ Mise à jour OK   │
          └──────────────────────┘
```

---

## 📂 PHASE PRÉPARATOIRE : Sélection & Validation Source

**UNIQUEMENT SI** mode `--update` détecté.

### Étape 1 : Détection Mode d'Exécution

**Action : Détecter le mode d'exécution selon les arguments**

1. **Vérifier les arguments de la commande** :
   - Si argument = `--update` OU `-u` → Mode UPDATE
   - Sinon → Mode SYNC (synchronisation post-rebase uniquement)

2. **Afficher le mode détecté** :
   - Mode UPDATE : `🔄 MODE : MISE À JOUR depuis sources externes`
   - Mode SYNC : `🔄 MODE : SYNCHRONISATION post-rebase`

3. **Si Mode SYNC** :
   - Passer directement à l'orchestration des plans (section suivante)
   - Les variables `$SOURCE` et `$TARGET` seront identiques (projet actuel)

### Étape 2 : Sélection Type de Source (Mode UPDATE uniquement)

**Action : Demander à l'utilisateur le type de source**

1. **Afficher le menu de sélection** :

```
═══════════════════════════════════════════════════════════════
🔄 SÉLECTION SOURCE DE MISE À JOUR
═══════════════════════════════════════════════════════════════

Choisissez la source de mise à jour :

1. 📦 GIT AI-KIDO - Dépôt officiel AI-KIDO
   Source : git@github.com:lcalmejane/aikido.git

2. 📁 RÉPERTOIRE LOCAL - Répertoire déjà extrait
   Emplacement : prompts/spec/aikido-*

3. 🗜️  ARCHIVE - Fichier tar.gz, tgz, ou zip
   Emplacement : prompts/spec/*.{tar.gz,tgz,zip}

Tapez le numéro de votre choix (1/2/3) :
```

2. **Attendre et stocker la réponse** dans `$SOURCE_TYPE` (valeurs: "1" | "2" | "3")

### Étape 3 : Récupération & Validation Source selon Type

#### 3.1 Source GIT (si choix = 1)

**Action : Cloner ou mettre à jour le dépôt Git AI-KIDO**

1. **Définir les variables** :
   - `AIKIDO_REPO="git@github.com:lcalmejane/aikido.git"`
   - `TARGET_PATH="$(pwd)/prompts/spec/aikido-source-git"`

2. **Vérifier si le dépôt existe déjà** :
   - Si `TARGET_PATH/.git` existe :
     - Afficher `✅ Dépôt existant détecté, mise à jour...`
     - Exécuter `cd $TARGET_PATH && git fetch --all --tags && cd -`
   - Sinon :
     - Afficher `📥 Clonage du dépôt...`
     - Exécuter `git clone $AIKIDO_REPO $TARGET_PATH`

3. **Lister les branches et tags disponibles** :
   - Branches : `cd $TARGET_PATH && git branch -r | sed 's/origin\///' | grep -v HEAD`
   - Tags : `cd $TARGET_PATH && git tag --sort=-version:refname | head -10`

4. **Demander la branche souhaitée** :
   - Afficher : `📌 Quelle branche souhaitez-vous utiliser ? (ENTRÉE pour 'main')`
   - Stocker dans `$SELECTED_BRANCH` (défaut: "main")

5. **Checkout de la branche** :
   - Exécuter : `cd $TARGET_PATH && git checkout $SELECTED_BRANCH && git pull origin $SELECTED_BRANCH && cd -`

6. **Option tag** (optionnel) :
   - Demander : `🏷️  Voulez-vous utiliser un tag spécifique ? (oui/non)`
   - Si oui : lister les tags et faire checkout du tag choisi

7. **Définir TARGET** : `TARGET="$TARGET_PATH"`

#### 3.2 Source LOCALE (si choix = 2)

**Action : Sélectionner un répertoire local déjà extrait**

1. **Lister les répertoires disponibles** :
   - Exécuter : `ls -d prompts/spec/aikido-* 2>/dev/null`
   - Afficher la liste ou message si aucun trouvé

2. **Demander le nom du répertoire** :
   - Afficher : `Entrez le nom du répertoire (ex: aikido-v1.3-custom) :`
   - Stocker dans `$DIR_NAME`

3. **Vérifier l'existence** :
   - `TARGET_PATH="prompts/spec/$DIR_NAME"`
   - Si répertoire n'existe pas → Afficher erreur et EXIT 1

4. **Définir TARGET** : `TARGET="$TARGET_PATH"`

#### 3.3 Source ARCHIVE (si choix = 3)

**Action : Extraire une archive (tar.gz, tgz, zip)**

1. **Lister les archives disponibles** :
   - Exécuter : `ls prompts/spec/*.{tar.gz,tgz,zip} 2>/dev/null`
   - Afficher la liste ou message si aucune trouvée

2. **Demander le nom de l'archive** :
   - Afficher : `Entrez le nom de l'archive (ex: ai-kido-v1.3.tar.gz) :`
   - Stocker dans `$ARCHIVE_NAME`

3. **Vérifier l'existence** :
   - `ARCHIVE_PATH="prompts/spec/$ARCHIVE_NAME"`
   - Si fichier n'existe pas → Afficher erreur et EXIT 1

4. **Préparer l'extraction** :
   - Extraire version du nom : `VERSION_FROM_FILE=$(echo "$ARCHIVE_NAME" | sed -E 's/.*-v?([0-9]+\.[0-9]+(\.[0-9]+)?).*/\1/')`
   - Créer répertoire cible : `TARGET_PATH="prompts/spec/aikido-source-v${VERSION_FROM_FILE}-$(date +%Y%m%d)"`
   - Exécuter : `mkdir -p "$TARGET_PATH"`

5. **Extraire selon le format** :
   - Si `.tar.gz` ou `.tgz` : `tar -xzf "$ARCHIVE_PATH" -C "$TARGET_PATH" --strip-components=1`
   - Si `.zip` : `unzip -q "$ARCHIVE_PATH" -d "$TARGET_PATH"`
   - Autre format → Erreur et EXIT 1

6. **Définir TARGET** : `TARGET="$TARGET_PATH"`

### Étape 4 : Validation Source AI-KIDO

**Action : Valider la source AI-KIDO (Prompt d'action - Pas de script)**

1. **Vérifier les fichiers obligatoires** dans `$TARGET` :
   - `prompts/hard_points/ai-kido.md`
   - `prompts/hard_points/ai-kido-light.md`
   - `AGENTS.md`
   - `CLAUDE.md`

2. **Extraire la version source** depuis `$TARGET/prompts/hard_points/ai-kido.md` :
   - Chercher la ligne : `> **Version**: X.X.X-MODE`
   - Stocker dans `$SOURCE_VERSION`

3. **Résultat** :
   - ✅ Si tous les fichiers existent ET version détectée :
     - Afficher `✅ Source AI-KIDO validée (version $SOURCE_VERSION)`
     - Afficher `   Chemin : $TARGET`
     - Continuer à l'étape suivante
   - ❌ Sinon :
     - Afficher `❌ ERREUR : Source AI-KIDO invalide`
     - Lister les fichiers manquants
     - EXIT 1

### Étape 5 : Export Variables Globales

**Action : Exporter les variables pour tous les plans**

1. **Définir et exporter** :
   - `SOURCE="$(pwd)"` (projet actuel)
   - `TARGET` (déjà défini dans les étapes précédentes)

2. **Afficher le résumé** :

```
═══════════════════════════════════════════════════════════════
✅ PHASE PRÉPARATOIRE TERMINÉE
═══════════════════════════════════════════════════════════════

Variables exportées :
  SOURCE (projet actuel) : $SOURCE
  TARGET (source externe) : $TARGET
  VERSION SOURCE         : $SOURCE_VERSION

Prêt pour l'orchestration des plans...
```

---

## 🔄 ORCHESTRATION DES PLANS

### ⚠️ RÈGLE CRITIQUE D'ORCHESTRATION

**INTERDICTION ABSOLUE** : Le LLM ne doit JAMAIS résumer, simplifier ou sauter des étapes des plans.

**OBLIGATION ABSOLUE** : Pour chaque plan, le LLM DOIT :

1. **Créer une sub-task dédiée** via switch de mode (orchestrator ou code selon le contexte)
2. **Lire le plan complet** via Read tool
3. **Exécuter TOUTES les phases** du plan dans l'ordre exact
4. **Appeler TOUS les scripts** mentionnés dans le plan (pas de résumé)
5. **Vérifier TOUTES les conditions** de succès avant de passer au plan suivant
6. **Journaliser chaque action** effectuée

**Format d'exécution obligatoire** :
```
Pour chaque plan X :
  1. Switch mode orchestrator/code
  2. Read plan X complet
  3. Exécuter phase 1 du plan X
  4. Exécuter phase 2 du plan X
  5. ...
  6. Exécuter phase N du plan X
  7. Vérifier succès complet
  8. Passer au plan suivant
```

### Phase 1 : Exécution plan-beginning

**Action : Créer une sub-task dédiée pour exécuter le plan d'initialisation**

1. **Localiser le plan** : `prompts/hard_points/system/maj/plans/plan-beginning.md`

2. **Vérifier son existence** :
   - Si fichier introuvable → Afficher erreur et EXIT 1

3. **Créer une sub-task orchestrator** avec le message :
```
Exécuter INTÉGRALEMENT le plan-beginning.md :
- Lire le fichier prompts/hard_points/system/maj/plans/plan-beginning.md
- Exécuter TOUTES les phases dans l'ordre exact
- Appeler TOUS les scripts mentionnés
- Ne RIEN résumer, ne RIEN sauter
- Vérifier toutes les conditions de succès
- Journaliser chaque action
```

4. **Afficher bannière** :
```
═══════════════════════════════════════════════════════════════
📋 EXÉCUTION : plan-beginning.md (SUB-TASK DÉDIÉE)
═══════════════════════════════════════════════════════════════
```

5. **Attendre la fin de la sub-task** et récupérer :
   - Variables exportées : `$MAJ_CURRENT_VERSION`, `$MAJ_TARGET_VERSION`
   - Statut de succès de chaque phase
   - Logs d'exécution

6. **Vérifier les conditions de succès** du plan :
   - Si phase BLOQUANTE échoue → EXIT 1
   - Si succès → Continuer Phase 2

### Phase 2 : Sélection & Exécution Plan de Version

**Action : Créer une sub-task dédiée pour exécuter le plan de version**

1. **Extraire le numéro de version** :
   - Depuis `$MAJ_TARGET_VERSION`, extraire `X.X.X` (retirer le suffixe `-LLM` ou `-STANDARD`)
   - Stocker dans `$VERSION_NUMBER`

2. **Construire le chemin du plan** :
   - `PLAN_VERSION="prompts/hard_points/system/maj/plans/plan-V${VERSION_NUMBER}.0.md"`
   - Exemple : `1.3.1-LLM` → `plan-V1.3.1.0.md`

3. **Vérifier l'existence du plan** :
   - Si fichier introuvable :
     - Afficher `⚠️  Aucun plan spécifique pour version $VERSION_NUMBER`
     - Passer directement à la Phase 3 (plans ending)
   - Si fichier existe :
     - **Créer une sub-task orchestrator** avec le message :
```
Exécuter INTÉGRALEMENT le plan-V${VERSION_NUMBER}.0.md :
- Lire le fichier ${PLAN_VERSION}
- Exécuter TOUTES les phases dans l'ordre exact
- Appeler TOUS les scripts mentionnés
- Ne RIEN résumer, ne RIEN sauter
- Vérifier toutes les conditions de succès
- Journaliser chaque action
```
     - Afficher bannière avec nom du plan
     - Attendre la fin de la sub-task

4. **Gestion des erreurs** :
   - Si phase BLOQUANTE échoue → Lancer `plan-ending-10.md` (diagnostic erreurs)
   - Si succès → Continuer Phase 3

### Phase 3 : Chaînage Plans Ending (0→8)

**Action : Créer une sub-task dédiée pour CHAQUE plan ending dans l'ordre strict 0→1→2→3→4→5→6→7→8**

**RÈGLE CRITIQUE** : Chaque plan ending DOIT être exécuté dans une sub-task séparée.

Pour **chaque plan ending** dans l'ordre (N = 0 à 8) :

1. **Localiser le plan** : `prompts/hard_points/system/maj/plans/plan-ending-${N}.md`

2. **Vérifier l'existence** :
   - Si introuvable → Warning + passer au suivant

3. **Créer une sub-task orchestrator/code** avec le message :
```
Exécuter INTÉGRALEMENT le plan-ending-${N}.md :
- Lire le fichier prompts/hard_points/system/maj/plans/plan-ending-${N}.md
- Exécuter TOUTES les phases dans l'ordre exact
- Appeler TOUS les scripts mentionnés (ne pas résumer)
- Vérifier toutes les entrées requises (fichiers, variables)
- Vérifier toutes les conditions de succès
- Journaliser chaque action effectuée
- Ne RIEN résumer, ne RIEN sauter
```

4. **Afficher bannière** avec numéro du plan :
```
═══════════════════════════════════════════════════════════════
📋 EXÉCUTION : plan-ending-${N}.md (SUB-TASK DÉDIÉE)
═══════════════════════════════════════════════════════════════
```

5. **Contexte des plans ending** (pour information uniquement) :
   - **plan-ending-0** : Fusion intelligente TARGET → SOURCE (contenu prompts/)
   - **plan-ending-1** : Détection changements (génération rapport diff)
   - **plan-ending-2** : Analyse rapport + préparation MAJ index
   - **plan-ending-3** : Mise à jour index généraux (mono/multi)
   - **plan-ending-4** : Validation structure (diagnostic cohérence)
   - **plan-ending-5** : Optimisation (nettoyage fichiers temporaires)
   - **plan-ending-6** : Validation finale (conformité AI-KIDO)
   - **plan-ending-7** : Peuplement (proposition gaps via agent-aikido-bank-populate)
   - **plan-ending-8** : Déploiement mappings et config TARGET → SOURCE (.roo/, .claude/, fichiers racine)

6. **Attendre la fin de la sub-task** et récupérer :
   - Statut de succès de chaque phase du plan
   - Fichiers générés
   - Variables exportées
   - Logs d'exécution

7. **Gestion des erreurs** :
   - Plan **BLOQUANT** échoue → Lancer `plan-ending-10.md` (diagnostic)
   - Plan **NON BLOQUANT** échoue → Warning + continuer au suivant

8. **Passer au plan ending suivant** (N+1) et répéter les étapes 1-7

---

## ✅ FINALISATION

**Action : Afficher le rapport final de mise à jour**

1. **Afficher bannière de succès** :

```
═══════════════════════════════════════════════════════════════
✅ MISE À JOUR AI-KIDO TERMINÉE
═══════════════════════════════════════════════════════════════
```

2. **Afficher le résumé** :

```
📊 RÉSUMÉ :
  Version avant  : $MAJ_CURRENT_VERSION
  Version après  : $MAJ_TARGET_VERSION
  Source (projet actuel) : $SOURCE
  Target (source externe) : $TARGET

📋 PLANS EXÉCUTÉS :
  ✅ plan-beginning.md
  ✅ plan-V${VERSION_NUMBER}.0.md (si applicable)
  ✅ plan-ending-0.md → plan-ending-8.md

📂 FICHIERS GÉNÉRÉS :
  - Logs : prompts/spec/logs/maj-aikido-*.log
  - Structures JSON : /tmp/aikido/maj_*.json
  - Backups : backups/aikido-*.tgz

🔍 PROCHAINES ACTIONS RECOMMANDÉES :
  1. Vérifier les logs de validation (prompts/spec/logs/)
  2. Tester les commandes migrées
  3. Relancer l'indexation si nécessaire : /reindex-projet
  4. Consulter les rapports de validation
```

---

## ❌ GESTION D'ERREUR GLOBALE

**Action : Gérer les erreurs critiques survenant durant le processus**

Si une erreur critique survient à **n'importe quelle étape** :

1. **Afficher bannière d'erreur** :

```
═══════════════════════════════════════════════════════════════
❌ ERREUR CRITIQUE DÉTECTÉE
═══════════════════════════════════════════════════════════════
```

2. **Afficher les détails de l'erreur** :
   - Phase où l'erreur est survenue
   - Message d'erreur complet
   - Contexte (variables, fichiers concernés)

3. **Lancer le plan de diagnostic** :
   - Localiser : `prompts/hard_points/system/maj/plans/plan-ending-10.md`
   - Si présent :
     - Afficher `🔍 Lancement diagnostic erreur (plan-ending-10)...`
     - Lire et exécuter le plan ending-10
   - Si absent :
     - Afficher `⚠️  Plan de diagnostic introuvable`
     - Indiquer la procédure de restauration manuelle

4. **Indiquer la procédure de récupération** :

```
🛟 RÉCUPÉRATION :
  1. Le backup de vérification a été créé avant modifications
  2. Localiser : backups/aikido-verif-backup-*.tgz
  3. Restaurer : tar -xzf backups/aikido-verif-backup-*.tgz
  4. Analyser l'erreur dans les logs
  5. Corriger le problème
  6. Relancer : /maj-aikido --update
```

5. **EXIT 1** pour arrêter le processus

---

## 📚 Références

- **Plans** : [`prompts/hard_points/system/maj/plans/`](../system/maj/plans/)
- **Scripts techniques** : [`prompts/hard_points/system/maj/scripts/`](../system/maj/scripts/)
- **README Plans** : [`prompts/hard_points/system/maj/plans/README.md`](../system/maj/plans/README.md)
- **Agent Update Controller** : [`prompts/hard_points/agents/agent-aikido-update-controller.md`](../agents/agent-aikido-update-controller.md)

---

## 🎯 NOTES IMPORTANTES POUR L'EXÉCUTION

### Pour l'Agent LLM (Toi)

Quand tu exécutes cette commande :

1. **OBLIGATION ABSOLUE : CRÉER DES SUB-TASKS**
   - **CHAQUE plan** (beginning, version, ending-0 à ending-8) DOIT être exécuté dans une **sub-task dédiée**
   - Utiliser `switch_mode` vers orchestrator ou code selon le contexte
   - Ne JAMAIS exécuter plusieurs plans dans la même sub-task
   - Ne JAMAIS exécuter un plan directement sans sub-task

2. **INTERDICTION ABSOLUE : RÉSUMER OU SAUTER**
   - NE JAMAIS résumer les actions d'un plan
   - NE JAMAIS sauter une phase d'un plan
   - NE JAMAIS dire "j'ai exécuté les phases X à Y" sans les avoir réellement exécutées
   - TOUJOURS lire le plan complet via Read tool
   - TOUJOURS exécuter chaque phase séquentiellement

3. **OBLIGATION : APPELER TOUS LES SCRIPTS**
   - Quand un plan mentionne un script, l'appeler via `execute_command`
   - Ne JAMAIS résumer l'appel d'un script par "j'ai vérifié..."
   - Scripts autorisés dans les plans :
     - `detect-project-type.sh`
     - `sync-files.sh`
     - `sync-directories.sh`
     - `validate-structure.sh`
     - Tous les scripts dans `prompts/hard_points/system/maj/scripts/`

4. **OBLIGATION : SUIVRE L'ORDRE STRICT**
   - Ordre obligatoire : beginning → version (si existe) → ending-0 → ending-1 → ... → ending-8
   - Ne JAMAIS inverser l'ordre
   - Ne JAMAIS paralléliser les plans
   - Attendre la fin complète d'un plan avant de passer au suivant

5. **OBLIGATION : VÉRIFIER LES CONDITIONS DE SUCCÈS**
   - Après chaque phase d'un plan, vérifier son succès
   - Si phase BLOQUANTE échoue → Arrêter et lancer plan-ending-10.md
   - Si phase NON BLOQUANTE échoue → Logger warning et continuer

6. **OBLIGATION : JOURNALISER CHAQUE ACTION**
   - Logger chaque phase exécutée
   - Logger chaque script appelé
   - Logger chaque fichier généré
   - Logger chaque variable exportée

7. **OBLIGATION : MAINTENIR LE CONTEXTE**
   - Exporter les variables entre les plans
   - Transmettre les résultats d'un plan au suivant
   - Conserver les logs de toutes les phases

### Avantages de cette Architecture

✅ **Maintenabilité** : Modifier un plan = modifier 1 fichier (pas 1860 lignes)
✅ **Réutilisabilité** : Plans ending communs à toutes les migrations
✅ **Testabilité** : Chaque plan peut être testé indépendamment
✅ **Clarté** : Séparation claire des responsabilités
✅ **Évolutivité** : Ajouter une nouvelle version = créer 1 plan-V{version}.md

---

**Optimisé avec système de plans modulaires V2.0 - Version 3.0**

Cette commande est maintenant un **orchestrateur léger** (349 lignes vs 1860 avant) qui délègue aux plans spécialisés.
