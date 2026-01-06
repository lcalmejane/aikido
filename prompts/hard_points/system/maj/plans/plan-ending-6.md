# Plan Ending-6 – Validation Finale Conformité AI-KIDO

> **Type** : ending | **Ordre** : 6 | **Bloquant** : NON

## 🎯 Objectif

Valider la conformité finale de la Memory Bank après toutes les modifications, en utilisant **agent-aikido-validator** pour vérifier que tous les fichiers respectent les règles AI-KIDO (≤500 lignes, liens bidirectionnels, frontmatter, etc.).

---

## 📥 Entrées Requises

- `$SOURCE` : Répertoire du projet actuel
- Memory Bank complète (tous les fichiers modifiés/créés)

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1 : Préparation Validation (NON BLOQUANT)

**Action : Identifier les fichiers à valider**

```bash
bash prompts/hard_points/system/maj/scripts/ending-6-list-critical-files.sh "$SOURCE"
```

Ce script liste les fichiers critiques de la Memory Bank.
- **Fonction** : Vérifie existence des chemins critiques (hard_points, gen, AGENTS.md, etc.)
- **Sortie** : Liste avec statut ✅/⚠️
- **Exit code** : 0 (toujours, non bloquant)

---

### 2️⃣ Phase 2 : Invocation Agent-Aikido-Validator (NON BLOQUANT)

**Action : Déléguer validation à l'agent spécialisé**

```bash
VALIDATION_MODE=$(bash prompts/hard_points/system/maj/scripts/ending-6-invoke-validator.sh "$SOURCE")
```

Ce script prépare le contexte pour agent-aikido-validator.
- **Fonction** : Vérifie agent, crée contexte validation, instructions LLM
- **Contexte** : `/tmp/aikido/validation-context-$$.md`
- **Retour** : `AGENT` si OK, `MANUAL` sinon
- **Exit code** : 0 (toujours, non bloquant)

---

### 3️⃣ Phase 3 : Analyse Rapport Validation (NON BLOQUANT)

**Action : Lire et interpréter le rapport de l'agent**

```bash
VALIDATION_STATUS=$(bash prompts/hard_points/system/maj/scripts/ending-6-analyze-validation-report.sh "$VALIDATION_MODE")
```

Ce script analyse le rapport généré par l'agent.
- **Fonction** : Attend rapport (timeout 30s), lit summary, extrait status
- **Retour** : `OK` | `KO` | `UNKNOWN` | `MANUAL`
- **Exit code** : 0 (toujours, non bloquant)

---

### 4️⃣ Phase 4 : Journalisation (NON BLOQUANT)

**Action : Créer log de validation finale**

```bash
mkdir -p "$SOURCE/prompts/spec/logs"
LOG_FILE="$SOURCE/prompts/spec/logs/phase-6.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-6 : Validation Finale Conformité
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

MODE VALIDATION :
  Type          : $VALIDATION_MODE

RÉSULTAT :
  Status        : $VALIDATION_STATUS
  Rapport       : $VALIDATION_REPORT
  Résumé        : $VALIDATION_SUMMARY

$([ "$VALIDATION_STATUS" = "KO" ] && echo "ERREURS DÉTECTÉES : Voir rapport détaillé" || echo "Validation réussie")

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log créé : $LOG_FILE"
echo ""
```

---

## 📤 Sorties Produites

| Fichier | Description | Obligatoire |
|---------|-------------|-------------|
| `/tmp/aikido/validation-context-$$.md` | Contexte pour agent | NON (si agent disponible) |
| `/tmp/aikido/validation-report.md` | Rapport détaillé | NON (si agent s'exécute) |
| `/tmp/aikido/validation-summary.txt` | Résumé (OK/KO) | NON (si agent s'exécute) |
| `$SOURCE/prompts/spec/logs/phase-6.log` | Log de validation | ✅ OUI |

---

## ✅ Conditions de Succès

Le plan **ending-6** est considéré réussi dans **TOUS les cas** :

1. ✅ Validation tentée (agent ou manuel)
2. ✅ Rapport analysé (si disponible)
3. ✅ Log créé

**Note** : Ce plan est **NON BLOQUANT**. Même si des erreurs sont détectées, le workflow continue.

---

## ❌ Gestion d'Échec

Ce plan ne peut pas échouer de manière bloquante. Tous les cas sont gérés :

### Cas dégradés :
1. **Agent non disponible** → Mode MANUAL
2. **Rapport non généré** → Status UNKNOWN
3. **Erreurs détectées** → Status KO + rapport détaillé

**Actions recommandées si KO** :
- Consulter `/tmp/aikido/validation-report.md`
- Corriger les fichiers non conformes
- Relancer validation manuellement

---

## 🔗 Enchaînement

Une fois ce plan réussi :
- ✅ Conformité AI-KIDO vérifiée (ou tentée)
- ✅ Rapport disponible pour review
- ✅ Passage au **plan ending-7** (peuplement gaps)

---

## 📚 Références

- **Agent validator** : [`prompts/hard_points/agents/agent-aikido-validator.md`](../../agents/agent-aikido-validator.md)
- **Hard points AI-KIDO** : [`prompts/hard_points/ai-kido.md`](../../ai-kido.md)

---

*Plan ending-6 v2.0 – Validation finale avec agent-aikido-validator*
