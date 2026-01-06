# Plan Ending-2 – Analyse Rapport Différences

> **Type** : ending | **Ordre** : 2 | **Bloquant** : NON

## 🎯 Objectif

Analyser le rapport de différences généré par le plan ending-1 et préparer les informations pour la mise à jour des index (plan ending-3).

Ce plan identifie les fichiers modifiés, ajoutés, supprimés et détecte les fichiers `.bak` pour nettoyage ultérieur.

---

## 📥 Entrées Requises

- `/tmp/aikido/maj_diff.json` : Rapport différentiel (généré par plan ending-1)
- `$SOURCE` : Répertoire du projet actuel

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1 : Vérification Rapport (NON BLOQUANT)

**Action : Vérifier existence et validité du rapport différentiel**

```bash
REPORT_STATUS=$(bash prompts/hard_points/system/maj/scripts/ending-2-check-diff-report.sh)

if [ "$REPORT_STATUS" = "EMPTY" ]; then
  REPORT_EMPTY=true
else
  REPORT_EMPTY=false
fi
```

Ce script vérifie l'existence du rapport différentiel.
- **Retour** : `EMPTY` si manquant, `PRESENT` si détecté
- **Exit code** : 0 (toujours, non bloquant)

---

### 2️⃣ Phase 2 : Lecture et Validation Rapport (NON BLOQUANT)

**Action : Lire le contenu du rapport et vérifier sa structure**

#### 2.1 Afficher le rapport

```bash
if [ "$REPORT_EMPTY" = false ]; then
  cat /tmp/aikido/maj_diff.json | jq '.' || cat /tmp/aikido/maj_diff.json
fi
```

#### 2.2 Valider le format JSON

```bash
JSON_STATUS=$(bash prompts/hard_points/system/maj/scripts/ending-2-validate-json.sh)

if [ "$JSON_STATUS" = "VALID" ]; then
  JSON_VALID=true
else
  JSON_VALID=false
fi
```

Ce script valide le format JSON du rapport.
- **Retour** : `VALID` ou `INVALID`
- **Exit code** : 0 (toujours, non bloquant)

---

### 3️⃣ Phase 3 : Analyse Détaillée des Changements (NON BLOQUANT)

**Action : Extraire et catégoriser les changements**

```bash
if [ "$JSON_VALID" = true ] && [ "$REPORT_EMPTY" = false ]; then
  STATS=$(bash prompts/hard_points/system/maj/scripts/ending-2-analyze-changes.sh --list)

  TOTAL_CHANGES=$(echo "$STATS" | tail -1 | awk '{print $1}')
  ADDED=$(echo "$STATS" | tail -1 | awk '{print $2}')
  REMOVED=$(echo "$STATS" | tail -1 | awk '{print $3}')
  MODIFIED=$(echo "$STATS" | tail -1 | awk '{print $4}')
fi
```

Ce script analyse et affiche les changements détaillés.
- **Option** : `--list` pour afficher les fichiers
- **Retour** : `TOTAL_CHANGES ADDED REMOVED MODIFIED`
- **Exit code** : 0 (toujours)

---

### 4️⃣ Phase 4 : Détection Fichiers Backup (NON BLOQUANT)

**Action : Identifier les fichiers .bak pour nettoyage potentiel**

```bash
BACKUP_FILES=$(bash prompts/hard_points/system/maj/scripts/ending-2-detect-backups.sh "$SOURCE")
```

Ce script détecte et liste les fichiers .bak créés durant la mise à jour.
- **Sortie** : `/tmp/aikido/backup_files_list.txt` (si backups trouvés)
- **Retour** : Nombre de fichiers .bak détectés
- **Exit code** : 0 (toujours)

---

### 5️⃣ Phase 5 : Préparation pour Ending-3 (NON BLOQUANT)

**Action : Créer résumé pour le plan ending-3**

```bash
echo "═══════════════════════════════════════════════════════════════"
echo "📋 PRÉPARATION PLAN ENDING-3"
echo "═══════════════════════════════════════════════════════════════"
echo ""

SUMMARY_FILE="/tmp/aikido/ending2_summary.txt"

cat > "$SUMMARY_FILE" <<SUMMARY
═══════════════════════════════════════════════════════════════
Résumé Plan Ending-2 : Analyse Rapport Différences
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

CHANGEMENTS DÉTECTÉS :
  Total          : ${TOTAL_CHANGES:-0}
  Ajoutés        : ${ADDED:-0}
  Supprimés      : ${REMOVED:-0}
  Modifiés       : ${MODIFIED:-0}

FICHIERS BACKUP :
  Détectés       : ${BACKUP_FILES:-0}
  Liste          : /tmp/aikido/backup_files_list.txt

PROCHAINE ÉTAPE :
  Plan ending-3  : Mise à jour index généraux

  Le plan ending-3 va générer/mettre à jour les fichiers index
  en tenant compte des changements détectés ci-dessus.

═══════════════════════════════════════════════════════════════
SUMMARY

echo "✅ Résumé créé : $SUMMARY_FILE"
echo ""
cat "$SUMMARY_FILE"
echo ""
```

---

### 6️⃣ Phase 6 : Journalisation (NON BLOQUANT)

**Action : Créer log détaillé de l'analyse**

```bash
mkdir -p "$SOURCE/prompts/spec/logs"
LOG_FILE="$SOURCE/prompts/spec/logs/phase-2.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-2 : Analyse Rapport Différences
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

RAPPORT SOURCE :
  Fichier        : /tmp/aikido/maj_diff.json
  État           : $([ "$REPORT_EMPTY" = true ] && echo "Vide" || echo "Présent")
  Format JSON    : $([ "$JSON_VALID" = true ] && echo "Valide" || echo "Invalide")

CHANGEMENTS :
  Total          : ${TOTAL_CHANGES:-N/A}
  Ajoutés        : ${ADDED:-N/A}
  Supprimés      : ${REMOVED:-N/A}
  Modifiés       : ${MODIFIED:-N/A}

BACKUPS :
  Fichiers .bak  : ${BACKUP_FILES:-N/A}

SORTIES :
  Résumé         : /tmp/aikido/ending2_summary.txt
  Liste backups  : /tmp/aikido/backup_files_list.txt

ÉTAT : Succès (non bloquant)

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log créé : $LOG_FILE"
echo ""
```

---

## 📤 Sorties Produites

| Fichier | Description | Obligatoire |
|---------|-------------|-------------|
| `/tmp/aikido/ending2_summary.txt` | Résumé analyse pour ending-3 | ✅ OUI |
| `/tmp/aikido/backup_files_list.txt` | Liste fichiers .bak pour nettoyage | NON (si .bak existent) |
| `$SOURCE/prompts/spec/logs/phase-2.log` | Log d'exécution détaillé | NON |

---

## ✅ Conditions de Succès

Le plan **ending-2** est considéré réussi dans **TOUS les cas** :

1. ✅ Rapport analysé (même si vide ou invalide)
2. ✅ Statistiques extraites (ou marquées N/A)
3. ✅ Fichiers backup détectés (ou 0 trouvés)
4. ✅ Résumé créé pour ending-3

**Note** : Ce plan est **NON BLOQUANT** et réussit toujours. Il adapte son comportement selon la disponibilité des données.

---

## ❌ Gestion d'Échec

Ce plan **ne peut pas échouer** de manière bloquante. Tous les cas sont gérés :

### Cas dégradés (warnings uniquement) :

1. **Rapport manquant** → Résumé avec valeurs N/A
2. **JSON invalide** → Affichage contenu brut + warning
3. **Aucun changement** → Résumé avec 0 partout
4. **jq non installé** → Fallback lecture manuelle

**Exemple de sortie dégradée** :
```
⚠️  AVERTISSEMENT : Analyse en mode dégradé

Cause : Rapport différentiel manquant ou invalide
Impact : Statistiques non disponibles

Résumé créé avec valeurs N/A pour plan ending-3.
Le workflow continue normalement.
```

---

## 🔗 Enchaînement

Une fois ce plan réussi :
- ✅ Changements analysés et catégorisés
- ✅ Résumé disponible pour ending-3
- ✅ Liste backups disponible pour ending-5
- ✅ Passage au **plan ending-3** (mise à jour index)

---

## 📚 Références

- **Rapport source** : `/tmp/aikido/maj_diff.json` (généré par plan ending-1)
- **Outil jq** : Manipulation JSON (fallback si non disponible)
- **Format résumé** : Texte brut pour lecture humaine

---

*Plan ending-2 v2.0 – Analyse robuste avec gestion dégradée gracieuse*
