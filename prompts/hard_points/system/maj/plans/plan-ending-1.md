# Plan Ending-1 – Détection Changements Post-Rebase

> **Type** : ending | **Ordre** : 1 | **Bloquant** : NON

## 🎯 Objectif

Générer la structure du projet **après mise à jour** et créer un rapport de différences en comparant avec la structure **avant mise à jour**.

Ce plan permet de détecter tous les changements (nouveaux fichiers, modifications, suppressions) résultant du rebase Git ou de la fusion des fichiers.

---

## 📥 Entrées Requises

- `$SOURCE` : Répertoire du projet actuel
- `/tmp/aikido/maj_before.json` : Structure avant mise à jour (généré par plan-beginning)

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1 : Vérification Prérequis (NON BLOQUANT)

**Action : Vérifier existence du fichier JSON "before"**

```bash
SKIP_STATUS=$(bash prompts/hard_points/system/maj/scripts/ending-1-check-before-json.sh)

if [ "$SKIP_STATUS" = "SKIP_DIFF" ]; then
  SKIP_DIFF=true
else
  SKIP_DIFF=false
fi
```

Ce script vérifie si le fichier structure "before" existe.
- **Retour** : `SKIP_DIFF` si manquant, `NO_SKIP` si présent
- **Exit code** : 0 (toujours, non bloquant)

---

### 2️⃣ Phase 2 : Génération Structure AFTER (BLOQUANT)

**Action : Générer la structure du projet après mise à jour**

```bash
bash prompts/hard_points/system/maj/scripts/ending-1-generate-after-structure.sh "$SOURCE"
```

Ce script génère la structure JSON du projet après mise à jour.
- **Sortie** : `/tmp/aikido/maj_after.json`
- **Exit code** : 0 si succès, 1 si échec (BLOQUANT)

---

### 3️⃣ Phase 3 : Génération Rapport Différences (NON BLOQUANT)

**Action : Comparer les structures before/after et créer un rapport**

#### 3.1 Cas 1 : Fichier "before" manquant

```bash
if [ "$SKIP_DIFF" = true ]; then
  echo "⚠️  Rapport différentiel ignoré (fichier 'before' manquant)"
  echo "# Rapport différentiel vide (before manquant)" > /tmp/aikido/maj_diff.json
  exit 0
fi
```

#### 3.2 Cas 2 : Comparaison avec jq

```bash
bash prompts/hard_points/system/maj/scripts/ending-1-compare-structures.sh
```

Ce script compare les structures JSON avec jq.
- **Sortie** : `/tmp/aikido/maj_diff.json`
- **Exit code** : 0 si succès, 1 si échec (non bloquant)

#### 3.3 Statistiques du rapport

```bash
STATS=$(bash prompts/hard_points/system/maj/scripts/ending-1-display-statistics.sh)

CHANGES_COUNT=$(echo "$STATS" | awk '{print $1}')
ADDED=$(echo "$STATS" | awk '{print $2}')
REMOVED=$(echo "$STATS" | awk '{print $3}')
MODIFIED=$(echo "$STATS" | awk '{print $4}')
```

Ce script affiche les statistiques du rapport différentiel.
- **Retour** : `CHANGES_COUNT ADDED REMOVED MODIFIED`

---

### 4️⃣ Phase 4 : Journalisation (NON BLOQUANT)

**Action : Créer log de la phase**

```bash
mkdir -p "$SOURCE/prompts/spec/logs"
LOG_FILE="$SOURCE/prompts/spec/logs/phase-1.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-1 : Détection Changements
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

FICHIERS GÉNÉRÉS :
  - Structure AFTER  : /tmp/aikido/maj_after.json
  - Rapport diff     : /tmp/aikido/maj_diff.json

STATISTIQUES :
  - Éléments changés : ${CHANGES_COUNT:-N/A}
  - Ajoutés          : ${ADDED:-N/A}
  - Supprimés        : ${REMOVED:-N/A}
  - Modifiés         : ${MODIFIED:-N/A}

ÉTAT : $([ "$SKIP_DIFF" = true ] && echo "Partiel (before manquant)" || echo "Complet")

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log créé : $LOG_FILE"
```

---

## 📤 Sorties Produites

| Fichier | Description | Obligatoire |
|---------|-------------|-------------|
| `/tmp/aikido/maj_after.json` | Structure projet après MAJ | ✅ OUI |
| `/tmp/aikido/maj_diff.json` | Rapport différentiel (before vs after) | ⚠️ Si before existe |
| `$SOURCE/prompts/spec/logs/phase-1.log` | Log d'exécution | NON |

---

## ✅ Conditions de Succès

Le plan **ending-1** est considéré réussi si :

**Succès complet** :
1. ✅ Structure AFTER générée (`maj_after.json` existe)
2. ✅ Rapport différentiel généré (`maj_diff.json` existe)
3. ✅ Aucune erreur durant la génération

**Succès partiel** (acceptable) :
1. ✅ Structure AFTER générée
2. ⚠️ Rapport différentiel manquant (before absent ou jq échoué)
3. ✅ Log créé avec indication "Partiel"

**Note** : Ce plan est **NON BLOQUANT** - même en cas d'échec partiel, le workflow continue.

---

## ❌ Gestion d'Échec

### Échecs critiques (rarissimes) :

1. **Script génération introuvable**
   ```
   ❌ ERREUR : prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh manquant

   Action requise :
     1. Vérifier structure du projet AI-KIDO
     2. Restaurer depuis backup si nécessaire
     3. Relancer /maj-aikido
   ```

2. **index.json non généré**
   ```
   ❌ ERREUR : index.json non créé après exécution du script

   Causes possibles :
     - Permissions insuffisantes
     - Erreur dans le script de génération
     - Projet corrompu

   Action requise :
     1. Exécuter manuellement : bash prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh
     2. Vérifier les erreurs affichées
     3. Corriger et relancer
   ```

### Échecs non bloquants (warnings) :

1. **before manquant** → Warning + passage à ending-2
2. **jq échoue** → Warning + comparaison manuelle suggérée

---

## 🔗 Enchaînement

Une fois ce plan réussi :
- ✅ Structure AFTER disponible pour analyse
- ✅ Rapport différentiel disponible (si possible)
- ✅ Passage au **plan ending-2** (analyse rapport)

**Note** : Le plan ending-2 doit gérer le cas où `maj_diff.json` est vide ou partiel.

---

## 📚 Références

- **Script génération structure** : [`prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh`](../../structure/scripts/generate-all-indexes-v3.1.sh)
- **Format index.json** : [`prompts/hard_points/system/structure/SKILL.md`](../../structure/SKILL.md)
- **Outil jq** : Comparaison JSON (installed system-wide)

---

*Plan ending-1 v2.0 – Détection changements avec gestion robuste des échecs*
