# Plan Ending-7 – Proposition Peuplement Gaps

> **Type** : ending | **Ordre** : 7 | **Bloquant** : NON

## 🎯 Objectif

Analyser la Memory Bank pour identifier les **gaps** (fichiers manquants, index incomplets, documentation absente) et proposer un peuplement automatique via **agent-aikido-bank-populate**.

---

## 📥 Entrées Requises

- `$SOURCE` : Répertoire du projet actuel
- `/tmp/aikido/validation-report.md` : Rapport validation (optionnel, généré par ending-6)

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1 : Analyse Gaps (NON BLOQUANT)

**Action : Détecter fichiers/répertoires manquants**

```bash
GAPS_STATS=$(bash prompts/hard_points/system/maj/scripts/ending-7-detect-gaps.sh "$SOURCE")

MISSING_DIRS_COUNT=$(echo "$GAPS_STATS" | awk '{print $1}')
MISSING_FILES_COUNT=$(echo "$GAPS_STATS" | awk '{print $2}')
```

Ce script détecte les gaps dans la Memory Bank.
- **Fonction** : Vérifie structure minimale (répertoires + fichiers attendus)
- **Sortie** : `/tmp/aikido/gaps_report.txt` (liste détaillée)
- **Retour** : `MISSING_DIRS_COUNT MISSING_FILES_COUNT`
- **Exit code** : 0 (toujours, non bloquant)

---

### 2️⃣ Phase 2 : Proposition Peuplement (NON BLOQUANT)

**Action : Si gaps détectés, proposer peuplement automatique**

```bash
TOTAL_GAPS=$((MISSING_DIRS_COUNT + MISSING_FILES_COUNT))

if [ $TOTAL_GAPS -gt 0 ]; then
  bash prompts/hard_points/system/maj/scripts/ending-7-propose-populate.sh "$SOURCE"
else
  echo "✅ AUCUN GAP DÉTECTÉ - Memory Bank complète"
fi
```

Ce script propose le peuplement via agent-aikido-bank-populate.
- **Fonction** : Vérifie agent, crée contexte, instructions LLM ou recommandations manuelles
- **Contexte** : `/tmp/aikido/populate-context-$$.md` (si agent disponible)
- **Exit code** : 0 (toujours, non bloquant)

---

### 3️⃣ Phase 3 : Journalisation (NON BLOQUANT)

**Action : Créer log du peuplement**

```bash
mkdir -p "$SOURCE/prompts/spec/logs"
LOG_FILE="$SOURCE/prompts/spec/logs/phase-7.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-7 : Proposition Peuplement Gaps
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

ANALYSE GAPS :
  Répertoires manquants    : ${#MISSING_DIRS[@]}
  Fichiers manquants       : ${#MISSING_FILES[@]}

$([ ${#MISSING_DIRS[@]} -eq 0 ] && [ ${#MISSING_FILES[@]} -eq 0 ] && echo "ÉTAT : Memory Bank complète" || echo "ÉTAT : Gaps détectés, peuplement proposé")

AGENT :
  bank-populate            : $([ -f "$POPULATE_AGENT" ] && echo "Disponible" || echo "Non disponible")
  Contexte                 : $([ -f "$POPULATE_CONTEXT" ] && echo "$POPULATE_CONTEXT" || echo "Non créé")

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log créé : $LOG_FILE"
echo ""
```

---

## 📤 Sorties Produites

| Fichier | Description | Obligatoire |
|---------|-------------|-------------|
| `/tmp/aikido/populate-context-$$.md` | Contexte pour agent | NON (si gaps) |
| `$SOURCE/prompts/spec/logs/phase-7.log` | Log analyse gaps | ✅ OUI |

---

## ✅ Conditions de Succès

Le plan **ending-7** est considéré réussi dans **TOUS les cas** :

1. ✅ Analyse gaps effectuée
2. ✅ Proposition peuplement faite (si gaps détectés)
3. ✅ Log créé

**Note** : Ce plan est **NON BLOQUANT** et informatif uniquement.

---

## ❌ Gestion d'Échec

Ce plan ne peut pas échouer. Il propose des actions sans les exécuter.

---

## 🔗 Enchaînement

Une fois ce plan réussi :
- ✅ Gaps identifiés et documentés
- ✅ Proposition peuplement faite (si nécessaire)
- ✅ **FIN DU WORKFLOW** (tous les plans ending terminés)
- ✅ Mise à jour AI-KIDO complète

---

## 📚 Références

- **Agent populate** : [`prompts/hard_points/agents/agent-aikido-bank-populate.md`](../../agents/agent-aikido-bank-populate.md)
- **Commande bank-populate** : `/bank-populate` (à créer si nécessaire)

---

*Plan ending-7 v2.0 – Détection gaps et proposition peuplement*
