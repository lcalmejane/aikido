# Plan Ending-5 – Optimisation et Nettoyage

> **Type** : ending | **Ordre** : 5 | **Bloquant** : NON

## 🎯 Objectif

Optimiser la Memory Bank en nettoyant les fichiers temporaires et en proposant une revue des fichiers backup créés durant la mise à jour.

Ce plan effectue un nettoyage léger et non destructif, laissant à l'utilisateur le choix final pour les fichiers backup.

---

## 📥 Entrées Requises

- `$SOURCE` : Répertoire du projet actuel
- `/tmp/aikido/backup_files_list.txt` : Liste fichiers .bak (généré par plan ending-2)

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1 : Nettoyage Fichiers Temporaires (NON BLOQUANT)

**Action : Supprimer les fichiers .tmp du projet**

```bash
TMP_COUNT=$(bash prompts/hard_points/system/maj/scripts/ending-5-cleanup-tmp-files.sh "$SOURCE")
```

Ce script nettoie les fichiers .tmp du projet.
- **Fonction** : Détecte et supprime tous les *.tmp
- **Retour** : Nombre de fichiers supprimés
- **Exit code** : 0 (toujours, non bloquant)

---

### 2️⃣ Phase 2 : Revue Fichiers Backup (NON BLOQUANT)

**Action : Analyser les fichiers .bak et proposer actions**

```bash
BACKUP_STATS=$(bash prompts/hard_points/system/maj/scripts/ending-5-analyze-backups.sh "$SOURCE")

BACKUP_COUNT=$(echo "$BACKUP_STATS" | awk '{print $1}')
RECENT=$(echo "$BACKUP_STATS" | awk '{print $2}')
OLD=$(echo "$BACKUP_STATS" | awk '{print $3}')
```

Ce script analyse les fichiers backup par ancienneté et propose des actions.
- **Fonction** : Détecte .bak, classe par âge, recommandations nettoyage
- **Retour** : `BACKUP_COUNT RECENT OLD`
- **Exit code** : 0 (toujours, non bloquant)

---

### 3️⃣ Phase 3 : Nettoyage Fichiers Temporaires /tmp/aikido (NON BLOQUANT)

**Action : Proposer nettoyage des fichiers temporaires du processus**

```bash
TMP_INFO=$(bash prompts/hard_points/system/maj/scripts/ending-5-display-tmp-aikido.sh)

TMP_AIKIDO_SIZE=$(echo "$TMP_INFO" | awk '{print $1}')
TMP_AIKIDO_COUNT=$(echo "$TMP_INFO" | awk '{print $2}')
```

Ce script affiche infos sur /tmp/aikido et propose nettoyage.
- **Fonction** : Analyse répertoire temporaire, liste fichiers, recommandations
- **Retour** : `SIZE COUNT`
- **Exit code** : 0 (toujours, non bloquant)

---

### 4️⃣ Phase 4 : Statistiques Finales (NON BLOQUANT)

**Action : Afficher statistiques globales de nettoyage**

```bash
echo "═══════════════════════════════════════════════════════════════"
echo "📊 STATISTIQUES OPTIMISATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "NETTOYAGE EFFECTUÉ :"
echo "  Fichiers .tmp supprimés         : ${TMP_COUNT:-0}"
echo ""

echo "REVUE EFFECTUÉE :"
echo "  Fichiers .bak détectés          : ${BACKUP_COUNT:-0}"
echo "  - Récents (< 1h)                : ${RECENT:-0}"
echo "  - Anciens (> 24h)               : ${OLD:-0}"
echo ""

echo "FICHIERS TEMPORAIRES :"
echo "  Répertoire /tmp/aikido          : $([ -d /tmp/aikido ] && echo "Présent ($TMP_AIKIDO_SIZE)" || echo "Absent")"
echo ""

echo "RECOMMANDATIONS :"
echo "  1. Valider que la mise à jour fonctionne correctement"
echo "  2. Après validation (quelques heures/jours) :"
echo "     - Supprimer les backups anciens"
echo "     - Nettoyer /tmp/aikido si nécessaire"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
```

---

### 5️⃣ Phase 5 : Journalisation (NON BLOQUANT)

**Action : Créer log de l'optimisation**

```bash
mkdir -p "$SOURCE/prompts/spec/logs"
LOG_FILE="$SOURCE/prompts/spec/logs/phase-5.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-5 : Optimisation et Nettoyage
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

NETTOYAGE EFFECTUÉ :
  Fichiers .tmp supprimés         : ${TMP_COUNT:-0}

FICHIERS BACKUP :
  Total détectés                  : ${BACKUP_COUNT:-0}
  Récents (< 1h)                  : ${RECENT:-0}
  Anciens (> 24h)                 : ${OLD:-0}
  Liste                           : $BACKUP_LIST

FICHIERS TEMPORAIRES :
  /tmp/aikido                     : $([ -d /tmp/aikido ] && echo "Présent" || echo "Absent")
  Taille                          : ${TMP_AIKIDO_SIZE:-N/A}
  Fichiers                        : ${TMP_AIKIDO_COUNT:-0}

ÉTAT : Succès (non bloquant)

RECOMMANDATIONS :
  - Valider mise à jour avant suppression backups
  - Conserver backups récents quelques jours
  - Nettoyer /tmp/aikido après validation

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log créé : $LOG_FILE"
echo ""
```

---

## 📤 Sorties Produites

| Fichier | Description | Obligatoire |
|---------|-------------|-------------|
| `$SOURCE/prompts/spec/logs/phase-5.log` | Log d'optimisation | ✅ OUI |
| stdout | Recommandations nettoyage | ✅ OUI |

**Fichiers supprimés** :
- Tous les `*.tmp` du projet

**Fichiers conservés** (recommandations données) :
- Tous les `*.bak*` (décision utilisateur)
- Tous les fichiers `/tmp/aikido/*` (décision utilisateur)

---

## ✅ Conditions de Succès

Le plan **ending-5** est considéré réussi dans **TOUS les cas** :

1. ✅ Fichiers .tmp supprimés (ou aucun trouvé)
2. ✅ Fichiers backup analysés et listés
3. ✅ Recommandations fournies
4. ✅ Log créé

**Note** : Ce plan est **NON BLOQUANT** et réussit toujours. Il ne supprime RIEN de critique.

---

## ❌ Gestion d'Échec

Ce plan **ne peut pas échouer** de manière bloquante :

### Cas dégradés (aucun impact) :

1. **find échoue** → Warning + skip nettoyage
2. **Permissions insuffisantes** → Warning + recommandation manuelle
3. **Liste backup manquante** → Création à la volée

**Exemple de comportement dégradé** :
```
⚠️  Impossible de supprimer certains .tmp (permissions)

Fichiers non supprimés : 2
  - ./prompts/spec/cache/data.tmp (Permission denied)
  - ./logs/session.tmp (Permission denied)

Recommandation :
  Supprimer manuellement avec privilèges élevés si nécessaire.

Le plan continue normalement (non bloquant).
```

---

## 🔗 Enchaînement

Une fois ce plan réussi :
- ✅ Projet optimisé (fichiers .tmp supprimés)
- ✅ Analyse backup effectuée
- ✅ Recommandations fournies à l'utilisateur
- ✅ Passage au **plan ending-6** (validation finale avec agent-aikido-validator)

---

## 📚 Références

- **Liste backups** : `/tmp/aikido/backup_files_list.txt` (généré par plan ending-2)
- **Fichiers temporaires** : `/tmp/aikido/*` (générés durant le processus)
- **Commandes nettoyage** : `find`, `rm`, `du`

---

*Plan ending-5 v2.0 – Optimisation non destructive avec recommandations*
