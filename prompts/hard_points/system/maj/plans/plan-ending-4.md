# Plan Ending-4 – Validation Structure Projet

> **Type** : ending | **Ordre** : 4 | **Bloquant** : OUI

## 🎯 Objectif

Diagnostiquer la cohérence et la conformité de la structure du projet après la mise à jour des index et la synchronisation des fichiers.

Ce plan utilise le **script technique** `validate-structure.sh` pour vérifier que le projet respecte les règles AI-KIDO selon son type (MONO ou MULTI).

---

## 📥 Entrées Requises

- `$SOURCE` : Répertoire du projet actuel
- `$PROJECT_TYPE` : Type de projet ("MONO" ou "MULTI" - défini par plan-beginning ou ending-3)
- `/tmp/aikido/ending2_summary.txt` : Résumé de la phase 2 (optionnel)

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1 : Vérification Prérequis (BLOQUANT)

**Action : Vérifier que le type de projet est défini**

```bash
echo "🔍 Vérification des prérequis..."

if [ -z "$PROJECT_TYPE" ]; then
  echo "⚠️  Variable PROJECT_TYPE non définie, détection automatique..."

  # Utiliser le script technique de détection
  DETECT_SCRIPT="$SOURCE/prompts/hard_points/system/maj/scripts/detect-project-type.sh"

  if [ ! -f "$DETECT_SCRIPT" ]; then
    echo "❌ ERREUR : Script de détection introuvable"
    echo "   Chemin attendu : $DETECT_SCRIPT"
    exit 1
  fi

  DETECT_OUTPUT=$("$DETECT_SCRIPT" detect)
  PROJECT_TYPE=$(echo "$DETECT_OUTPUT" | head -1)

  echo "✅ Type détecté : $PROJECT_TYPE"
  export PROJECT_TYPE
else
  echo "✅ Type de projet défini : $PROJECT_TYPE"
fi
```

---

### 2️⃣ Phase 2 : Validation Structure avec Script Technique (BLOQUANT)

**Action : Exécuter le script de validation**

```bash
bash prompts/hard_points/system/maj/scripts/ending-4-run-validation.sh "$SOURCE" "$PROJECT_TYPE"
VALIDATION_EXIT=$?

if [ $VALIDATION_EXIT -eq 0 ]; then
  VALIDATION_STATUS="SUCCESS"
else
  VALIDATION_STATUS="FAILED"
fi
```

Ce script exécute validate-structure.sh avec les bons paramètres.
- **Fonction** : Localise et lance validation structure
- **Paramètres** : Type projet + version 1.3
- **Exit code** : 0 si structure valide, 1 sinon (BLOQUANT)

---

### 3️⃣ Phase 3 : Diagnostic Détaillé (SI ÉCHEC)

**Action : Si validation échouée, fournir diagnostic détaillé**

```bash
if [ "$VALIDATION_STATUS" = "FAILED" ]; then
  bash prompts/hard_points/system/maj/scripts/ending-4-diagnostic-structure.sh "$SOURCE" "$PROJECT_TYPE"
fi
```

Ce script affiche un diagnostic détaillé de la structure.
- **Fonction** : Vérifie hard points, index, répertoires essentiels
- **Sortie** : Diagnostic complet avec ✅/❌ pour chaque élément
- **Exit code** : 0 (toujours, diagnostic uniquement)

---

### 4️⃣ Phase 4 : Journalisation (NON BLOQUANT)

**Action : Créer log de validation**

```bash
mkdir -p "$SOURCE/prompts/spec/logs"
LOG_FILE="$SOURCE/prompts/spec/logs/phase-4.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-4 : Validation Structure
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

CONFIGURATION :
  Type projet    : $PROJECT_TYPE
  Version        : 1.3
  Répertoire     : $SOURCE

RÉSULTAT VALIDATION :
  Status         : $VALIDATION_STATUS
  Exit code      : $VALIDATION_EXIT
  Script         : $VALIDATE_SCRIPT

$([ "$VALIDATION_STATUS" = "FAILED" ] && echo "PROBLÈMES DÉTECTÉS : Voir diagnostic ci-dessus" || echo "Structure conforme AI-KIDO")

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log créé : $LOG_FILE"
echo ""
```

---

### 5️⃣ Phase 5 : Décision Finale (BLOQUANT)

**Action : Décider si le workflow doit continuer ou s'arrêter**

```bash
if [ "$VALIDATION_STATUS" = "SUCCESS" ]; then
  echo "═══════════════════════════════════════════════════════════════"
  echo "✅ PLAN ENDING-4 RÉUSSI"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "   Structure validée avec succès"
  echo "   Passage au plan ending-5 (optimisation)..."
  echo ""
  exit 0
else
  echo "═══════════════════════════════════════════════════════════════"
  echo "❌ PLAN ENDING-4 ÉCHOUÉ"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "   ACTIONS RECOMMANDÉES :"
  echo ""
  echo "   1. Examiner le diagnostic détaillé ci-dessus"
  echo "   2. Corriger les fichiers/répertoires manquants"
  echo "   3. Si index manquants : relancer plan ending-3"
  echo "   4. Si hard points manquants : restaurer depuis backup"
  echo "   5. Relancer /maj-aikido après corrections"
  echo ""
  echo "   OU"
  echo ""
  echo "   6. Passer au plan ending-10 (gestion erreurs) pour diagnostic approfondi"
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo ""

  # EXIT BLOQUANT
  exit 1
fi
```

---

## 📤 Sorties Produites

| Fichier | Description | Obligatoire |
|---------|-------------|-------------|
| `$SOURCE/prompts/spec/logs/phase-4.log` | Log de validation | ✅ OUI |
| stdout | Diagnostic détaillé (si échec) | ✅ OUI (si échec) |

---

## ✅ Conditions de Succès

Le plan **ending-4** est considéré réussi si :

1. ✅ Script `validate-structure.sh` s'exécute sans erreur
2. ✅ Code de sortie = 0 (structure valide)
3. ✅ Log créé avec SUCCESS

**Note** : Ce plan est **BLOQUANT**. Si la validation échoue, le workflow s'arrête.

---

## ❌ Gestion d'Échec

### Échecs bloquants :

1. **Script validate-structure.sh introuvable**
   ```
   ❌ ERREUR CRITIQUE : Script de validation manquant

   Chemin attendu : prompts/hard_points/system/maj/scripts/validate-structure.sh

   Action requise :
     1. Vérifier intégrité du projet AI-KIDO
     2. Restaurer depuis backup :
        tar -xzf backups/aikido-verif-backup-*.tgz
     3. Relancer /maj-aikido
   ```

2. **Validation échouée (exit code != 0)**
   ```
   ❌ ERREUR : Structure non conforme AI-KIDO V1.3

   Type projet : MONO
   Problèmes détectés :
     - /prompts/index.md manquant
     - /prompts/hard_points/ai-kido.md manquant

   Actions recommandées :
     1. Si index manquant : Relancer plan ending-3
     2. Si hard points manquants : Restaurer depuis TARGET
        cp "$TARGET/prompts/hard_points/ai-kido.md" "$SOURCE/prompts/hard_points/"
     3. Relancer validation manuelle :
        bash prompts/hard_points/system/maj/scripts/validate-structure.sh . --type MONO --version 1.3
     4. Relancer /maj-aikido si OK
   ```

### Cas non gérés par ce plan :

- **Permissions insuffisantes** → Erreur script
- **Projet corrompu gravement** → Restauration backup complète requise

---

## 🔗 Enchaînement

### Si validation réussie :
- ✅ Structure projet conforme AI-KIDO V1.3
- ✅ Passage au **plan ending-5** (optimisation/nettoyage)

### Si validation échouée :
- ❌ Workflow **BLOQUÉ**
- ⚠️ **Diagnostic détaillé affiché**
- 📋 **Actions recommandées** fournies
- 🔄 **Correction manuelle requise**
- 🔄 Possibilité de passer à **plan ending-10** (gestion erreurs)

---

## 📚 Références

- **Script validation** : [`prompts/hard_points/system/maj/scripts/validate-structure.sh`](../scripts/validate-structure.sh)
- **Script détection projet** : [`prompts/hard_points/system/maj/scripts/detect-project-type.sh`](../scripts/detect-project-type.sh)
- **Hard points AI-KIDO** : [`prompts/hard_points/ai-kido.md`](../../ai-kido.md)

---

*Plan ending-4 v2.0 – Validation structure bloquante avec diagnostic détaillé*
