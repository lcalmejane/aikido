# Plan Ending-8 – Déploiement Mappings et Configuration depuis TARGET

> **Type** : ending | **Ordre** : 8 | **Bloquant** : NON (avec warnings)

## 🎯 Objectif

Déployer les fichiers de configuration, mappings et fichiers racine du dépôt externe (TARGET) vers le projet actuel (SOURCE) pour compléter la mise à jour.

Ce plan copie de **TARGET → SOURCE** :

- Mappings `.roo/commands/`
- Mappings `.claude/commands/`
- Mappings `.claude/agents/`
- Fichiers racine (`AGENTS.md`, `CLAUDE.md`, `commands_list.md`, `agents_list.md`, `skills_list.md`)

**Pourquoi ce plan ?** Le plan ending-0 (fusion) ne copie QUE les fichiers dans `/prompts/`. Les mappings et fichiers racine ne sont pas fusionnés automatiquement.

---

## 📥 Entrées Requises

- `$SOURCE` : Répertoire du projet actuel (destination)
- `$TARGET` : Répertoire source externe (dépôt git décompressé, source des fichiers)
- Mode UPDATE : Ce plan s'exécute **EN PRIORITÉ** en mode `--update`, mais peut aussi s'exécuter en mode SYNC si besoin

---

## 📋 Étapes d'Exécution

### 0️⃣ Phase 0 : Vérification Prérequis

**Action : Vérifier que TARGET existe et contient des fichiers à déployer**

```bash
if [ ! -d "$TARGET" ]; then
  echo "⚠️  TARGET inexistant : $TARGET"
  echo "   Plan ending-8 skippé"
  exit 0
fi

# Compter les fichiers disponibles dans TARGET
TARGET_FILES_COUNT=0

[ -d "$TARGET/.roo/commands" ] && TARGET_FILES_COUNT=$((TARGET_FILES_COUNT + $(find "$TARGET/.roo/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')))
[ -d "$TARGET/.claude/commands" ] && TARGET_FILES_COUNT=$((TARGET_FILES_COUNT + $(find "$TARGET/.claude/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')))
[ -d "$TARGET/.claude/agents" ] && TARGET_FILES_COUNT=$((TARGET_FILES_COUNT + $(find "$TARGET/.claude/agents" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')))

if [ "$TARGET_FILES_COUNT" -eq 0 ]; then
  echo "ℹ️  Aucun fichier de mapping détecté dans TARGET"
  echo "   Plan ending-8 skippé (TARGET ne contient pas de mappings à déployer)"
  exit 0
fi

echo "✅ $TARGET_FILES_COUNT fichier(s) de mapping détectés dans TARGET"
echo "   Déploiement vers SOURCE activé"
```

**Résultat** :

- Si TARGET vide ou sans mappings : skip ce plan
- Si TARGET contient des mappings : continuer

---

### 1️⃣ Phase 1 : Déploiement Mappings Commands (NON BLOQUANT)

**Action : Copier les mappings de commandes depuis TARGET vers SOURCE**

```bash
COMMANDS_DEPLOYED=$(bash prompts/hard_points/system/maj/scripts/ending-8-deploy-commands.sh "$TARGET" "$SOURCE")
```

Ce script copie les mappings `.roo/commands/` et `.claude/commands/` depuis TARGET vers SOURCE.

- **Fonction** : Crée répertoires si nécessaire, copie mappings avec backup, vérifie cohérence
- **Retour** : Nombre de commandes déployées (format: "X")
- **Exit code** : 0 (toujours, non bloquant)

**Détails du script** :

1. Créer `$SOURCE/.roo/commands/` si inexistant
2. Créer `$SOURCE/.claude/commands/` si inexistant
3. Pour chaque fichier `.md` dans `$TARGET/.roo/commands/` :
   - Si existe dans SOURCE : créer backup `.bak.YYYYMMDD-HHMMSS`
   - Copier de TARGET → SOURCE
4. Répéter pour `.claude/commands/`
5. Compter et afficher résultats

---

### 2️⃣ Phase 2 : Déploiement Mappings Agents (NON BLOQUANT)

**Action : Copier les mappings d'agents depuis TARGET vers SOURCE**

```bash
AGENTS_DEPLOYED=$(bash prompts/hard_points/system/maj/scripts/ending-8-deploy-agents.sh "$TARGET" "$SOURCE")
```

Ce script copie les mappings `.claude/agents/` depuis TARGET vers SOURCE.

- **Fonction** : Crée répertoire si nécessaire, copie mappings agents avec backup
- **Retour** : Nombre d'agents déployés (format: "X")
- **Exit code** : 0 (toujours, non bloquant)

**Détails du script** :

1. Créer `$SOURCE/.claude/agents/` si inexistant
2. Pour chaque fichier `.md` dans `$TARGET/.claude/agents/` :
   - Si existe dans SOURCE : créer backup `.bak.YYYYMMDD-HHMMSS`
   - Copier de TARGET → SOURCE
3. Compter et afficher résultats

---

### 3️⃣ Phase 3 : Déploiement Fichiers Racine (NON BLOQUANT)

**Action : Copier les fichiers racine de documentation depuis TARGET vers SOURCE**

```bash
ROOT_FILES_DEPLOYED=$(bash prompts/hard_points/system/maj/scripts/ending-8-deploy-root-files.sh "$TARGET" "$SOURCE")
```

Ce script copie les fichiers racine essentiels depuis TARGET vers SOURCE.

- **Fonction** : Copie fichiers racine avec backup automatique si existants dans SOURCE
- **Retour** : Nombre de fichiers déployés (format: "X")
- **Exit code** : 0 (toujours, non bloquant)

**Fichiers copiés** (si présents dans TARGET) :

- `AGENTS.md`
- `CLAUDE.md`
- `commands_list.md`
- `agents_list.md`
- `skills_list.md`
- `.roomodes` (optionnel)

**Détails du script** :

1. Pour chaque fichier dans la liste :
   - Vérifier existence dans TARGET
   - Si existe dans SOURCE : créer backup `.bak.YYYYMMDD-HHMMSS`
   - Copier de TARGET → SOURCE
2. Compter et afficher résultats

---

### 4️⃣ Phase 4 : Validation Déploiement (NON BLOQUANT)

**Action : Vérifier que les fichiers ont été copiés correctement**

```bash
VALIDATION_RESULT=$(bash prompts/hard_points/system/maj/scripts/ending-8-validate-deployment.sh "$TARGET" "$SOURCE")
```

Ce script valide que tous les fichiers présents dans TARGET ont été copiés dans SOURCE.

- **Fonction** : Compare fichiers TARGET vs SOURCE, détecte manquants
- **Retour** : Résultat validation (format: "PASSED" ou "WARNINGS: X fichiers manquants")
- **Exit code** : 0 (toujours, non bloquant)

**Vérifications** :

1. Compter fichiers dans `$TARGET/.roo/commands/`
2. Compter fichiers dans `$SOURCE/.roo/commands/`
3. Comparer : si différence → warning
4. Répéter pour `.claude/commands/` et `.claude/agents/`
5. Vérifier présence fichiers racine dans SOURCE

---

### 5️⃣ Phase 5 : Statistiques Finales (NON BLOQUANT)

**Action : Afficher statistiques globales de déploiement**

```bash
echo "═══════════════════════════════════════════════════════════════"
echo "📊 STATISTIQUES DÉPLOIEMENT depuis TARGET"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "TARGET (dépôt externe)  : $TARGET"
echo "SOURCE (projet actuel)  : $SOURCE"
echo ""

echo "DÉPLOIEMENT EFFECTUÉ (TARGET → SOURCE) :"
echo "  Mappings commands       : $COMMANDS_DEPLOYED fichier(s)"
echo "  Mappings agents         : $AGENTS_DEPLOYED fichier(s)"
echo "  Fichiers racine         : $ROOT_FILES_DEPLOYED fichier(s)"
echo ""

echo "VALIDATION :"
echo "  Résultat                : $VALIDATION_RESULT"
echo ""

if [ "$VALIDATION_RESULT" != "PASSED" ]; then
  echo "⚠️  AVERTISSEMENT :"
  echo "  Certains fichiers n'ont pas été déployés correctement."
  echo "  Consultez les logs pour plus de détails."
  echo ""
fi

echo "RECOMMANDATIONS :"
echo "  1. Vérifier que SOURCE contient bien tous les fichiers attendus"
echo "  2. Tester les commandes et agents déployés"
echo "  3. Consulter les backups (.bak.*) si besoin de restauration"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
```

---

### 6️⃣ Phase 6 : Journalisation (NON BLOQUANT)

**Action : Créer log du déploiement**

```bash
mkdir -p "$SOURCE/prompts/spec/logs"
LOG_FILE="$SOURCE/prompts/spec/logs/phase-8.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-8 : Déploiement depuis TARGET
═══════════════════════════════════════════════════════════════
Date : $(date '+%Y-%m-%d %H:%M:%S')

TARGET (source)         : $TARGET
SOURCE (destination)    : $SOURCE

FLUX : TARGET → SOURCE (dépôt externe → projet actuel)

DÉPLOIEMENT EFFECTUÉ :
  Mappings commands       : $COMMANDS_DEPLOYED fichier(s)
  Mappings agents         : $AGENTS_DEPLOYED fichier(s)
  Fichiers racine         : $ROOT_FILES_DEPLOYED fichier(s)

VALIDATION :
  Résultat                : $VALIDATION_RESULT

ÉTAT : Succès (non bloquant)

BACKUPS CRÉÉS :
  Tous les fichiers écrasés ont un backup .bak.YYYYMMDD-HHMMSS

RECOMMANDATIONS :
  - Vérifier SOURCE après déploiement
  - Tester les commandes et agents
  - Consulter backups si besoin de rollback

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log créé : $LOG_FILE"
echo ""
```

---

## 📤 Sorties Produites

| Fichier/Répertoire | Description |
|--------------------|-------------|
| `$SOURCE/.roo/commands/*.md` | Mappings commandes Roo (depuis TARGET) |
| `$SOURCE/.claude/commands/*.md` | Mappings commandes Claude (depuis TARGET) |
| `$SOURCE/.claude/agents/*.md` | Mappings agents Claude (depuis TARGET) |
| `$SOURCE/AGENTS.md` | Documentation agents (depuis TARGET) |
| `$SOURCE/CLAUDE.md` | Documentation Claude (depuis TARGET) |
| `$SOURCE/commands_list.md` | Liste des commandes (depuis TARGET) |
| `$SOURCE/agents_list.md` | Liste des agents (depuis TARGET) |
| `$SOURCE/skills_list.md` | Liste des skills (depuis TARGET) |
| `$SOURCE/.roomodes` | Configuration Roo (depuis TARGET, optionnel) |
| `$SOURCE/prompts/spec/logs/phase-8.log` | Log de déploiement |
| `*.bak.YYYYMMDD-HHMMSS` | Backups des fichiers écrasés dans SOURCE |

---

## ✅ Conditions de Succès

Le plan **ending-8** est considéré réussi dans **TOUS les cas** :

1. ✅ Mappings commands copiés (ou aucun trouvé dans TARGET)
2. ✅ Mappings agents copiés (ou aucun trouvé dans TARGET)
3. ✅ Fichiers racine copiés (ou aucun trouvé dans TARGET)
4. ✅ Validation effectuée (warnings acceptés)
5. ✅ Log créé

**Note** : Ce plan est **NON BLOQUANT** et réussit toujours. Les warnings sont journalisés mais n'arrêtent pas le processus.

---

## ❌ Gestion d'Échec

Ce plan **ne peut pas échouer** de manière bloquante :

### Cas dégradés (warnings) :

1. **Fichier manquant dans TARGET** → Skip ce fichier (normal, TARGET peut ne pas avoir tous les fichiers)
2. **Permissions insuffisantes SOURCE** → Warning + recommandation manuelle
3. **Répertoire SOURCE inexistant** → Tentative de création + warning si échec

**Exemple de comportement dégradé** :

```
⚠️  AVERTISSEMENT : Déploiement partiel

Fichiers manquants dans TARGET (normal) :
  - .roomodes (fichier optionnel)
  - skills_list.md (pas présent dans dépôt externe)

Fichiers non copiés vers SOURCE :
  - AGENTS.md (Permission denied sur SOURCE)

Recommandation :
  Copier manuellement ou ajuster les permissions de SOURCE.

Déploiement : 12/14 fichiers (85%)

Le plan continue normalement (non bloquant).
```

---

## 🔗 Enchaînement

Ce plan s'exécute **après plan ending-7** (peuplement gaps) :

**Ancien workflow** :

```
ending-0 → ending-1 → ending-2 → ending-3 → ending-4 → ending-5 → ending-6 → ending-7 → FIN
```

**Nouveau workflow** :

```
ending-0 → ending-1 → ending-2 → ending-3 → ending-4 → ending-5 → ending-6 → ending-7 → ending-8 → FIN
```

**Condition d'exécution** :

- ✅ Si TARGET contient des mappings : Plan ending-8 s'exécute
- ⚠️ Si TARGET vide ou sans mappings : Plan ending-8 est skippé (phase 0 exit 0)

---

## 📚 Références

- **Mappings commands** : `.roo/commands/`, `.claude/commands/`
- **Mappings agents** : `.claude/agents/`
- **Fichiers racine** : `AGENTS.md`, `CLAUDE.md`, `commands_list.md`, `agents_list.md`, `skills_list.md`
- **Configuration Roo** : `.roomodes`

---

## 🎯 Notes Importantes

### Pourquoi ce plan ?

Le **plan ending-0 (fusion)** ne copie QUE les fichiers dans `/prompts/`. Les fichiers suivants ne sont **jamais fusionnés** automatiquement :

- Mappings de commandes et agents (`.roo/`, `.claude/`)
- Fichiers de documentation racine (`AGENTS.md`, etc.)
- Configuration Roo (`.roomodes`)

**Sans ce plan** : Le projet actuel (SOURCE) reste incomplet après la mise à jour, sans les nouveaux mappings du dépôt externe (TARGET).

### Timing d'exécution

Ce plan s'exécute **EN DERNIER** (après ending-7) pour garantir que :

1. Tous les plans de mise à jour sont terminés
2. Le contenu de `/prompts/` est déjà fusionné (ending-0)
3. Les gaps ont été comblés (ending-7)
4. On complète avec les mappings et config de TARGET

### Sens du flux

**FLUX CORRECT** : TARGET → SOURCE

- **TARGET** = Dépôt git externe (contient nouvelle version AI-KIDO)
- **SOURCE** = Projet actuel (à mettre à jour)
- **Objectif** : Copier les mappings de TARGET vers SOURCE pour compléter la MAJ

---

*Plan ending-8 v2.0 – Déploiement mappings et configuration depuis TARGET (flux corrigé)*
