# Plan Ending-0 – Fusion Intelligente TARGET → SOURCE

> **Type** : ending | **Ordre** : 0 | **Bloquant** : NON (avec fallback)

## 🎯 Objectif

Fusionner intelligemment les fichiers modifiés ou ajoutés du dépôt externe (TARGET) vers le projet actuel (SOURCE), en préservant le contexte projet tout en adoptant le nouveau formalisme.

Ce plan utilise **agent-aikido-fusion** pour une fusion intelligente, avec fallback manuel si LLM insuffisant.

---

## 📥 Entrées Requises

- `$SOURCE` : Répertoire projet actuel
- `$TARGET` : Répertoire source externe (mise à jour)
- `/tmp/aikido/maj_target.json` : Structure TARGET (généré par plan-beginning)
- `/tmp/aikido/maj_before.json` : Structure SOURCE avant MAJ (généré par plan-beginning)

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1 : Détection des Changements (BLOQUANT)

**Action : Analyser les différences entre TARGET et SOURCE**

#### 1.1 Vérifier existence des fichiers JSON

**Action : Vérifier fichiers de structure JSON**

```bash
bash prompts/hard_points/system/maj/scripts/ending-0-check-json-files.sh
```

Ce script vérifie l'existence des fichiers JSON générés par plan-beginning.
- **Fichiers vérifiés** : `/tmp/aikido/maj_target.json`, `/tmp/aikido/maj_before.json`
- **Exit code** : 0 si OK, 1 si manquants (BLOQUANT)

#### 1.2 Générer le rapport de différences

**Action : Comparer structures JSON et créer rapport**

```bash
TOTAL_CHANGES=$(bash prompts/hard_points/system/maj/scripts/ending-0-generate-diff-report.sh)
```

Ce script compare TARGET vs SOURCE et génère un rapport différentiel.
- **Sorties** :
  - `/tmp/aikido/diff_report.txt` : Liste fichiers modifiés/ajoutés
  - `/tmp/aikido/added_files.txt` : Fichiers ajoutés
  - `/tmp/aikido/modified_files.txt` : Fichiers modifiés
- **Retour** : Nombre total de changements
- **Exit code** : 0 (toujours)

#### 1.3 Validation

```bash
if [ $TOTAL_CHANGES -eq 0 ]; then
  echo "ℹ️  Aucun changement détecté, fusion non nécessaire"
  echo "   Passage direct au plan ending-1"
  exit 0
fi

echo "✅ $TOTAL_CHANGES fichier(s) à traiter"
```

---

### 2️⃣ Phase 2 : Vérification Prérequis LLM (NON BLOQUANT)

**Action : Vérifier capacité LLM et choisir mode fusion**

```bash
FUSION_MODE=$(bash prompts/hard_points/system/maj/scripts/ending-0-ask-llm-capability.sh)
```

Ce script demande interactivement si l'utilisateur dispose d'un LLM puissant.
- **Modes possibles** :
  - `INTELLIGENT` : Fusion avec agent-aikido-fusion (LLM ≥ Sonnet 4)
  - `REPLACE` : Remplacement direct TARGET → SOURCE
  - `SKIP` : Conservation fichiers locaux
  - `MANUAL_LATER` : Préparation scripts fusion manuelle
- **Retour** : Mode sélectionné
- **Exit code** : 0 (toujours)

---

### 3️⃣ Phase 3 : Traitement des Fichiers (BLOQUANT SI FUSION_MODE=INTELLIGENT)

**Action : Traiter fichiers selon mode fusion**

```bash
bash prompts/hard_points/system/maj/scripts/ending-0-process-fusion.sh "$SOURCE" "$TARGET" "$FUSION_MODE"
```

Ce script traite tous les fichiers du rapport différentiel selon le mode choisi.
- **Modes gérés** :
  - `INTELLIGENT` : Prépare contextes pour agent-aikido-fusion
  - `REPLACE` : Copie directe avec backup automatique
  - `SKIP` : Conserve fichiers locaux
  - `MANUAL_LATER` : Génère scripts fusion dans `/tmp/aikido/manual-fusion/`
- **Sorties** :
  - Backups `.bak` pour fichiers modifiés
  - Scripts manuels si mode MANUAL_LATER
- **Exit code** : 0 (toujours, compte erreurs en interne)

---

## 📤 Sorties Produites

| Fichier/Répertoire | Description |
|--------------------|-------------|
| `/tmp/aikido/diff_report.txt` | Liste des fichiers modifiés/ajoutés |
| `/tmp/aikido/added_files.txt` | Fichiers ajoutés uniquement |
| `/tmp/aikido/modified_files.txt` | Fichiers modifiés uniquement |
| `*.bak.YYYYMMDD-HHMMSS` | Backups automatiques des fichiers modifiés |
| `/tmp/aikido/manual-fusion/*.md` | Scripts de fusion manuelle (si mode MANUAL_LATER) |
| `/tmp/aikido/fusion-context-*.md` | Contextes de fusion pour agent (si mode INTELLIGENT) |

---

## ✅ Conditions de Succès

Le plan **ending-0** est considéré réussi si :

1. ✅ Rapport de différences généré avec succès
2. ✅ Tous les fichiers traités selon le mode choisi
3. ✅ Aucune erreur bloquante (ERRORS=0 si mode INTELLIGENT)
4. ✅ Backups créés pour tous les fichiers modifiés

**Note** : En mode SKIP ou MANUAL_LATER, le plan est toujours réussi (non bloquant).

---

## ❌ Gestion d'Échec

### Échecs critiques (mode INTELLIGENT uniquement) :

1. **Agent-aikido-fusion introuvable**
   - Vérifier `prompts/hard_points/agents/agent-aikido-fusion.md` existe
   - Restaurer depuis backup si nécessaire

2. **Fusion échouée**
   - Restaurer fichier depuis `.bak.*`
   - Basculer en mode MANUAL_LATER
   - Continuer avec fichiers restants

**Exemple de message d'échec** :
```
❌ ERREUR : Fusion intelligente échouée pour 3 fichier(s)

Fichiers en erreur :
  - prompts/hard_points/commands/analyse-project.md
  - prompts/gen/concepts/memory-bank.md
  - AGENTS.md

Action recommandée :
  1. Restaurer depuis backups : ls -la *.bak.*
  2. Basculer mode MANUAL : export FUSION_MODE=MANUAL_LATER
  3. Relancer plan ending-0

Les fichiers réussis sont conservés.
```

---

## 🔗 Enchaînement

Une fois ce plan réussi (ou skippé) :
- ✅ Les fichiers sont fusionnés (ou préparés pour fusion manuelle)
- ✅ Passage au **plan ending-1** (détection changements post-rebase)

---

## 📚 Références

- **Agent fusion** : [`prompts/hard_points/agents/agent-aikido-fusion.md`](../../agents/agent-aikido-fusion.md)
- **Règles de fusion** : Voir agent-aikido-fusion (préservation contexte + adoption formalisme)
- **Structure JSON** : [`prompts/hard_points/system/structure/SKILL.md`](../../structure/SKILL.md)

---

*Plan ending-0 v2.0 – Fusion intelligente avec fallback manuel*
