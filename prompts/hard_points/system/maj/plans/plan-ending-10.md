# Plan Ending-10 – Gestion Erreurs Centralisée

> **Type** : ending-error | **Ordre** : 10 (invoqué uniquement en cas d'erreur) | **Bloquant** : NON

## 🎯 Objectif

Fournir un diagnostic centralisé des erreurs survenues durant le processus de mise à jour AI-KIDO, proposer des solutions de correction et offrir des options de rollback.

Ce plan est invoqué **uniquement en cas d'échec** d'un des plans précédents (ending-0 à ending-7) ou à la demande explicite de l'utilisateur.

---

## 📥 Entrées Requises

- `$SOURCE` : Répertoire du projet actuel
- `$FAILED_PLAN` : Nom du plan ayant échoué (ex: "ending-3")
- `$ERROR_CODE` : Code d'erreur retourné (ex: 1, 42)
- `$ERROR_MESSAGE` : Message d'erreur (optionnel)
- Logs des phases précédentes dans `$SOURCE/prompts/spec/logs/`

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1 : Collecte Contexte Erreur (NON BLOQUANT)

**Action : Rassembler toutes les informations sur l'échec**

```bash
bash prompts/hard_points/system/maj/scripts/ending-10-collect-error-context.sh "$SOURCE" "$FAILED_PLAN" "$ERROR_CODE" "$ERROR_MESSAGE"
```

Ce script collecte le contexte complet de l'erreur.
- **Fonction** : Affiche plan échoué, code, message, date, logs récents
- **Sortie** : `/tmp/aikido/error-context.txt`
- **Exit code** : 0 (toujours, non bloquant)

---

### 2️⃣ Phase 2 : Diagnostic Automatique (NON BLOQUANT)

**Action : Analyser la cause probable selon le plan échoué**

```bash
bash prompts/hard_points/system/maj/scripts/ending-10-diagnostic-by-plan.sh "$FAILED_PLAN" "$SOURCE"
```

Ce script affiche un diagnostic spécifique au plan échoué.
- **Fonction** : Analyse par case (ending-0 à 7, beginning, unknown)
- **Sortie** : Causes probables + solutions proposées
- **Exit code** : 0 (toujours, non bloquant)

---

### 3️⃣ Phase 3 : Options de Récupération (NON BLOQUANT)

**Action : Proposer actions à l'utilisateur**

```bash
echo "═══════════════════════════════════════════════════════════════"
echo "🔧 OPTIONS DE RÉCUPÉRATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "1️⃣ CORRIGER ET RELANCER"
echo "   Appliquer les solutions proposées ci-dessus puis :"
echo "   /maj-aikido --update"
echo ""

echo "2️⃣ ROLLBACK COMPLET"
echo "   Restaurer l'état avant mise à jour :"
echo "   LATEST_BACKUP=\$(ls -t backups/aikido-verif-backup-*.tgz | head -1)"
echo "   tar -xzf \"\$LATEST_BACKUP\" -C ."
echo "   echo \"✅ Rollback effectué depuis \$LATEST_BACKUP\""
echo ""

echo "3️⃣ ROLLBACK PARTIEL"
echo "   Restaurer uniquement les fichiers critiques :"
echo "   tar -xzf backups/aikido-verif-backup-*.tgz prompts/hard_points/"
echo "   tar -xzf backups/aikido-verif-backup-*.tgz AGENTS.md CLAUDE.md"
echo ""

echo "4️⃣ DIAGNOSTIC APPROFONDI"
echo "   Invoquer agent-aikido-validator pour analyse complète :"
echo "   # Créer contexte diagnostic"
echo "   cat > /tmp/aikido/diagnostic-context.md <<DIAG"
echo "   # Diagnostic Erreur $FAILED_PLAN"
echo "   "
echo "   Plan échoué : $FAILED_PLAN"
echo "   Code erreur : $ERROR_CODE"
echo "   Message : $ERROR_MESSAGE"
echo "   "
echo "   Mission : Analyser logs et proposer plan correction détaillé"
echo "   DIAG"
echo ""

echo "5️⃣ MODE MANUEL"
echo "   Continuer manuellement sans /maj-aikido :"
echo "   - Corriger les fichiers identifiés"
echo "   - Valider : bash prompts/hard_points/system/maj/scripts/validate-structure.sh ."
echo "   - Relancer plans individuels si nécessaire"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
```

---

### 4️⃣ Phase 4 : Génération Rapport Erreur (NON BLOQUANT)

**Action : Créer rapport détaillé pour debugging**

```bash
ERROR_REPORT=$(bash prompts/hard_points/system/maj/scripts/ending-10-generate-error-report.sh "$SOURCE" "$FAILED_PLAN" "$ERROR_CODE" "$ERROR_MESSAGE")

echo "📝 Rapport d'erreur créé : $ERROR_REPORT"
cat "$ERROR_REPORT"
```

Ce script génère un rapport markdown complet.
- **Fonction** : Rapport avec contexte, diagnostic, logs, backups, actions recommandées
- **Sortie** : `$SOURCE/prompts/spec/logs/error-report-YYYYMMDD-HHMMSS.md`
- **Retour** : Chemin du rapport
- **Exit code** : 0 (toujours, non bloquant)

---

### 5️⃣ Phase 5 : Journalisation (NON BLOQUANT)

**Action : Créer log centralisé de gestion erreur**

```bash
LOG_FILE="$SOURCE/prompts/spec/logs/phase-10-error.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-10 : Gestion Erreurs Centralisée
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

ERREUR :
  Plan échoué    : $FAILED_PLAN
  Code           : $ERROR_CODE
  Message        : $ERROR_MESSAGE

DIAGNOSTIC :
  Rapport        : $ERROR_REPORT
  Solutions      : Voir diagnostic automatique ci-dessus

OPTIONS PROPOSÉES :
  1. Corriger et relancer
  2. Rollback complet
  3. Rollback partiel
  4. Diagnostic approfondi
  5. Mode manuel

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log créé : $LOG_FILE"
echo ""
```

---

## 📤 Sorties Produites

| Fichier | Description | Obligatoire |
|---------|-------------|-------------|
| `$SOURCE/prompts/spec/logs/error-report-*.md` | Rapport erreur complet | ✅ OUI |
| `$SOURCE/prompts/spec/logs/phase-10-error.log` | Log gestion erreur | ✅ OUI |
| stdout | Diagnostic + options récupération | ✅ OUI |

---

## ✅ Conditions de Succès

Le plan **ending-10** est considéré réussi dans **TOUS les cas** :

1. ✅ Diagnostic effectué
2. ✅ Solutions proposées
3. ✅ Rapport généré
4. ✅ Options de récupération présentées

**Note** : Ce plan est **NON BLOQUANT** et informatif. Il aide à résoudre l'erreur mais ne la corrige pas automatiquement.

---

## ❌ Gestion d'Échec

Ce plan **ne peut pas échouer**. Même si la génération de rapport échoue, le diagnostic s'affiche à l'écran.

---

## 🔗 Enchaînement

Après ce plan :
- 🛑 **Workflow arrêté** (attente action utilisateur)
- 🔄 **Utilisateur choisit** : Corriger/Rollback/Manuel
- 🔄 **Relancer** `/maj-aikido --update` après correction

---

## 📚 Références

- **Backups** : `backups/aikido-verif-backup-*.tgz`
- **Logs** : `prompts/spec/logs/phase-*.log`
- **Scripts validation** : `prompts/hard_points/system/maj/scripts/`

---

*Plan ending-10 v2.0 – Gestion erreurs centralisée avec diagnostic automatique*
