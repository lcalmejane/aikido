---
description: "Vérifie la cohérence entre documentation AI-KIDO et code source, détecte l'obsolescence et propose des redressements automatiques"
---

# Commande Check-Truth

Vérifie la cohérence entre la documentation de la Memory Bank AI-KIDO et le code source du ou des projets. Détecte les obsolescences, contradictions, et manques pour proposer des redressements automatiques avec optimisation maximale (agents AI-KIDO + fast-path via last-check).

## Objectif

**Maintenir la synchronisation** entre :
- La documentation dans `/prompts/gen/` (concepts, techniques, use cases)
- Le code source dans le(s) projet(s)
- Les spécifications dans `/prompts/hard_points/` (vérités immuables)

**Optimisations** :
- ✅ Fast-path via `last-check` metadata (skip validation si ✅ + sources inchangées)
- ✅ Utilisation maximale des agents AI-KIDO spécialisés
- ✅ Économie 70-80% tokens sur documents déjà validés
- ✅ Analyse ciblée selon scope demandé

## Syntaxe

```bash
# Vérification complète de la Memory Bank
/check-truth

# Vérification d'un fichier spécifique
/check-truth --file /prompts/gen/concepts/oauth.md

# Vérification d'un domaine
/check-truth --domain concepts
/check-truth --domain techniques

# Vérification d'une recherche keyword
/check-truth --search "authentication"

# Vérification du code d'un projet
/check-truth --code-path ./src/auth/

# Vérification code + doc liée
/check-truth --code-path ./src/auth/ --domain concepts

# Mode verbose (affiche détails)
/check-truth --verbose

# Mode dry-run (simulation)
/check-truth --dry-run
```

## Arguments

| Argument | Description | Exemple |
|----------|-------------|---------|
| `--file <path>` | Fichier unique à vérifier | `--file /prompts/gen/concepts/oauth.md` |
| `--domain <domain>` | Domaine Memory Bank | `--domain concepts`, `--domain techniques` |
| `--search <keyword>` | Recherche par mot-clé | `--search "authentication"` |
| `--code-path <path>` | Chemin code à analyser | `--code-path ./src/auth/` |
| `--verbose` | Mode détaillé | - |
| `--dry-run` | Simulation sans modifications | - |
| `--force-check` | Force validation (ignore fast-path) | - |

## Exécution

### Phase 0 : Détection du Scope 🎯

**Analyser les arguments** pour déterminer le scope :

```markdown
🎯 SCOPE DETECTION

Arguments fournis :
- --file : [PATH ou NONE]
- --domain : [DOMAIN ou NONE]
- --search : [KEYWORD ou NONE]
- --code-path : [PATH ou NONE]

Scope détecté : [SINGLE_FILE | DOMAIN | SEARCH | CODE_ANALYSIS | FULL_BANK]

Mode : [NORMAL | VERBOSE | DRY_RUN]
Force check : [YES | NO] (ignore fast-path si YES)
```

**Détermination du scope** :
- Si `--file` → SINGLE_FILE
- Si `--domain` → DOMAIN
- Si `--search` → SEARCH
- Si `--code-path` sans `--file/--domain` → CODE_ANALYSIS
- Si aucun argument → FULL_BANK

### Phase 1 : Inventaire Ciblé 🤖 (agent-aikido-explore-bank)

**UTILISER L'AGENT** `agent-aikido-explore-bank` en mode QUICK pour inventaire selon scope :

```markdown
🤖 AGENT: agent-aikido-explore-bank (QUICK MODE)

**Prompt pour l'agent** :
"FORMAT: JSON

Inventaire ciblé pour check-truth selon scope [SCOPE].

**Scope [SINGLE_FILE]** :
- Fichier : [PATH]
- Extraire : Header metadata (last-check, truth source, source refs)
- Identifier : Source files référencés (code paths)
- Retourner : Metadata + source files list

**Scope [DOMAIN]** :
- Domaine : /prompts/gen/[DOMAIN]/
- Scanner : Tous fichiers .md (sauf index.md)
- Extraire : Headers avec last-check metadata
- Identifier : Documents avec/sans truth source
- Retourner : Liste fichiers avec metadata

**Scope [SEARCH]** :
- Keyword : [KEYWORD]
- Rechercher dans : /prompts/gen/ (concepts, techniques, use_cases)
- Filtrer : Fichiers contenant keyword
- Extraire : Headers avec metadata
- Retourner : Liste fichiers matchés avec metadata

**Scope [CODE_ANALYSIS]** :
- Code path : [PATH]
- Scanner : Fichiers code (*.ts, *.js, *.py, etc.)
- Identifier : Modules/fonctions principales
- Rechercher : Documentation Memory Bank correspondante
- Retourner : Liste code files + doc files associées (ou MISSING)

**Scope [FULL_BANK]** :
- Scanner : Toute la Memory Bank /prompts/gen/
- Extraire : Tous headers avec last-check metadata
- Classifier : [✅ Up-to-date | ⚠️ Review | ❌ Outdated | 🆕 No metadata]
- Retourner : Inventaire complet par statut

Pour chaque fichier détecté, retourner :
- Path
- Header metadata (version, date, truth source, last-check, source refs)
- Check status (✅|⚠️|❌|🆕)
- Last check date (si existe)
- Source refs modification dates (si existent)

Tokens estimés : [1k-5k selon scope]"

**Résultat attendu** : Liste fichiers avec metadata complète
```

Afficher en temps réel :
```
🔍 INVENTAIRE CIBLÉ (agent-aikido-explore-bank QUICK)...

Scope : [SCOPE]
Fichiers détectés : [NOMBRE]

Classification :
✅ Up-to-date : [NOMBRE] (fast-path eligible)
⚠️ Review needed : [NOMBRE] (requires validation)
❌ Outdated : [NOMBRE] (requires immediate check)
🆕 No metadata : [NOMBRE] (first-time validation)

Tokens utilisés : [X]k
```

### Phase 2 : Fast-Path Optimization 🚀 (agent-aikido-doc-header)

**Pour chaque fichier ✅ Up-to-date**, vérifier éligibilité fast-path :

```markdown
🚀 FAST-PATH CHECK (agent-aikido-doc-header)

Fichier : [PATH]
Last check : [DATE]
Check status : ✅ Up-to-date
Source refs : [LIST]

Vérification :
1. Check if --force-check flag : [YES → SKIP FAST-PATH | NO → CONTINUE]
2. For each source ref in header :
   - Extract current modification date via stat
   - Compare with recorded date in header
   - Status : [UNCHANGED | MODIFIED]
3. Check staleness : (today - last_check) days
   - If > 90 days → FLAG STALE
   - Else → FRESH

Decision :
- All sources UNCHANGED + FRESH + no --force-check → ⚡ SKIP VALIDATION (save ~2k tokens)
- Any source MODIFIED OR STALE OR --force-check → ⚠️ REQUIRES VALIDATION

Fast-path eligible : [X] fichiers
Validation required : [Y] fichiers
Tokens saved : ~[X * 2k] tokens
```

**Liste des fichiers à valider** :
- ⚠️ Review needed (tous)
- ❌ Outdated (tous)
- 🆕 No metadata (tous)
- ✅ Up-to-date avec sources modifiées ou stale (filtrés)

Afficher :
```
⚡ FAST-PATH OPTIMIZATION

Eligible pour skip : [X] fichiers (✅ + sources inchangées + fresh)
À valider : [Y] fichiers
Économie tokens estimée : ~[Z]k tokens
```

### Phase 3 : Validation Truth Sources 🤖 (agent-aikido-truth-evaluator)

**Pour chaque fichier nécessitant validation**, invoquer truth-evaluator :

```markdown
🤖 AGENT: agent-aikido-truth-evaluator (avec optimisation last-check)

**Prompt pour l'agent** :
"FORMAT: JSON

Valider la cohérence entre documentation et sources pour fichier [PATH].

Context :
- Fichier : [PATH]
- Type : [concept|technique|use_case]
- Truth source déclaré : [Code|Spec|Dual|Config|Tests]
- Last check : [DATE ou NEVER]
- Source refs : [LIST]

Mode validation :
1. **Check header metadata first** (Phase 0 de truth-evaluator) :
   - Si last-check existe + ✅ + sources inchangées → ALREADY DONE (pas dans cette liste normalement)

2. **Full validation** (car dans liste validation required) :
   - Lire le document
   - Lire les sources référencées (code, specs, config, tests)
   - Classifier scenario : [NEW_FEATURE|BUG_FIX|MAINTENANCE|DOCUMENTATION|etc.]
   - Évaluer cohérence :
     * Documentation décrit-elle correctement l'implémentation ?
     * Y a-t-il des contradictions specs ↔ code ?
     * Le code a-t-il évolué depuis dernière validation ?
     * La documentation est-elle obsolète ?
   - Détecter conflits
   - Scorer fiabilité (95% = parfait, <70% = problème)

3. **Generate ranking** :
   - 🥇 Primary authority (95%+)
   - 🥈 Supporting sources (75%+)
   - 🥉 Reference (50-75%)
   - ❌ Deprecated (<50%)

4. **Output** :
   - Status : [✅ COHERENT | ⚠️ MINOR_DRIFT | ❌ MAJOR_CONFLICT]
   - Confidence : [XX%]
   - Issues : [LIST]
   - Recommendations : [LIST]
   - New check status : [✅|⚠️|❌]

Retourner rapport structuré par fichier."

**Résultat attendu** : Rapport validation pour chaque fichier
```

Afficher en temps réel :
```
⚖️ VALIDATION TRUTH SOURCES (agent-aikido-truth-evaluator)...

Fichiers à valider : [Y]

[1/Y] /prompts/gen/concepts/oauth.md
  - Status : ⚠️ MINOR_DRIFT
  - Issue : Implementation uses PKCE, doc doesn't mention it
  - Confidence : 85%
  - Recommendation : UPDATE doc to mention PKCE

[2/Y] /prompts/gen/techniques/jwt-impl.md
  - Status : ✅ COHERENT
  - Confidence : 95%
  - No action required

[...]

Synthèse :
✅ Coherent : [X] fichiers
⚠️ Minor drift : [Y] fichiers (requires update)
❌ Major conflict : [Z] fichiers (requires immediate attention)
```

### Phase 4 : Analyse des Manques 🤖 (agent-aikido-explore-bank + truth-evaluator)

**Si scope inclut CODE_ANALYSIS**, détecter documentation manquante :

```markdown
🤖 WORKFLOW: Détection Documentation Manquante

**Étape 4.1 : Exploration code** (agent-aikido-explore-bank)
- FORMAT: JSON
- Code path : [PATH]
- Scanner : Modules/classes/fonctions principales
- Extraire : Signatures, docstrings, commentaires
- Identifier : Éléments critiques nécessitant documentation
- Retourner : Liste code elements

**Étape 4.2 : Recherche doc existante** (agent-aikido-explore-bank)
- FORMAT: JSON
- Pour chaque code element :
  * Rechercher dans Memory Bank via keywords
  * Matcher avec concepts/techniques existants
  * Status : [DOCUMENTED | PARTIAL | MISSING]
- Retourner : Gaps list

**Étape 4.3 : Évaluation priorité** (agent-aikido-truth-evaluator)
- FORMAT: JSON
- Pour chaque gap :
  * Évaluer criticité (public API = HIGH, internal = MEDIUM)
  * Évaluer complexité (simple = LOW, complexe = HIGH)
  * Évaluer usage (fréquent = HIGH, rare = LOW)
  * Scorer priorité : CRITICAL | HIGH | MEDIUM | LOW
- Retourner : Priorized gaps list
```

Afficher :
```
🔍 ANALYSE DES MANQUES

Code path : [PATH]
Elements analysés : [NOMBRE]

Documentation status :
✅ Documented : [X] elements
⚠️ Partial : [Y] elements (exists but incomplete)
❌ Missing : [Z] elements

Gaps par priorité :
🔴 CRITICAL : [N] (public APIs, core features)
🟠 HIGH : [N] (important features)
🟡 MEDIUM : [N] (secondary features)
⚪ LOW : [N] (internal utils)

Top 5 gaps critiques :
1. [module/function] - [reason] - Priority: CRITICAL
2. [module/function] - [reason] - Priority: CRITICAL
[...]
```

### Phase 5 : Mise à Jour Headers 🤖 (agent-aikido-doc-header)

**Pour tous les fichiers validés**, mettre à jour headers :

```markdown
🤖 AGENT: agent-aikido-doc-header (batch update)

**Prompt pour l'agent** :
"FORMAT: JSON

Mettre à jour headers pour tous les fichiers validés.

Fichiers validés : [LIST with new status]

Pour chaque fichier :
1. Lire header actuel
2. Mettre à jour :
   - Last Check : [TODAY]
   - Checked By : agent-aikido-truth-evaluator
   - Check Status : [✅|⚠️|❌] (from validation result)
   - Source Refs : refresh modification dates (via stat)
3. Écrire header mis à jour

Mode : BATCH (tous fichiers en une seule invocation)
Tokens estimés : ~[200 * nombre_fichiers] tokens"

**Résultat attendu** : Headers mis à jour pour tous fichiers validés
```

Afficher :
```
📝 MISE À JOUR HEADERS (agent-aikido-doc-header)...

Headers à mettre à jour : [X]

[1/X] /prompts/gen/concepts/oauth.md → ⚠️ Review needed (updated)
[2/X] /prompts/gen/techniques/jwt-impl.md → ✅ Up-to-date (updated)
[...]

✅ Headers mis à jour : [X]
```

### Phase 6 : Génération Rapport de Redressement

**Compiler** le rapport complet :

```markdown
📊 RAPPORT CHECK-TRUTH

**Scope** : [SCOPE]
**Date** : [DATE TIME]
**Mode** : [NORMAL|VERBOSE|DRY_RUN]

## Résumé Exécutif

**Fichiers analysés** : [TOTAL]
- Fast-path skip : [X] fichiers (✅ + inchangés) → [Y]k tokens économisés
- Validés : [Z] fichiers

**Résultat global** :
- ✅ Coherent : [X] fichiers ([PERCENTAGE]%)
- ⚠️ Minor drift : [Y] fichiers ([PERCENTAGE]%)
- ❌ Major conflict : [Z] fichiers ([PERCENTAGE]%)
- 🆕 No prior check : [N] fichiers

**Performance** :
- Tokens utilisés : [TOTAL]k
- Tokens économisés (fast-path) : [SAVED]k
- Efficacité : [PERCENTAGE]% d'optimisation

## Détails par Fichier

### ✅ Fichiers Cohérents ([X])

| Fichier | Last Check | Truth Source | Confidence |
|---------|------------|--------------|------------|
| [path] | [date] | Code | 95% |
| ... | ... | ... | ... |

### ⚠️ Dérivations Mineures ([Y])

| Fichier | Issue | Recommendation | Priority |
|---------|-------|----------------|----------|
| [path] | [description] | UPDATE [section] | MEDIUM |
| ... | ... | ... | ... |

### ❌ Conflits Majeurs ([Z])

| Fichier | Conflict | Truth Source | Action Required |
|---------|----------|--------------|-----------------|
| [path] | [description] | Code (vs doc) | REWRITE [section] |
| ... | ... | ... | ... |

### 🆕 Documentation Manquante (si CODE_ANALYSIS)

| Code Element | Type | Priority | Suggested Location |
|--------------|------|----------|-------------------|
| [module/function] | [concept/technique] | CRITICAL | /prompts/gen/[type]/[name].md |
| ... | ... | ... | ... |

## Actions Recommandées

**IMMÉDIATES (Conflits Majeurs)** :
1. ❌ Corriger [fichier] : [description action]
2. ❌ Réécrire [fichier] : [description action]
[...]

**PRIORITAIRES (Dérivations + Manques Critiques)** :
1. ⚠️ Mettre à jour [fichier] : [description action]
2. 🆕 Créer documentation pour [code element] : [description action]
[...]

**MAINTENANCE (Manques Non-Critiques)** :
1. 🟡 Documenter [code element] : [description action]
[...]

## Proposition d'Auto-Redressement

Voulez-vous lancer le redressement automatique ?

**Option 1 : REDRESSER TOUT** (⚠️ + ❌)
- Mettre à jour [Y] fichiers avec dérivations mineures
- Réécrire [Z] fichiers avec conflits majeurs
- Invoquer agent-aikido-bank-populate pour gaps critiques

**Option 2 : REDRESSER CONFLITS MAJEURS UNIQUEMENT** (❌)
- Réécrire [Z] fichiers avec conflits majeurs
- Laisser dérivations mineures pour revue manuelle

**Option 3 : CRÉER DOCUMENTATION MANQUANTE** (🆕)
- Analyser code en détail (via /analyse-project sur [code-path])
- Invoquer agent-aikido-bank-populate pour tous gaps
- Créer [N] nouveaux documents

**Option 4 : RAPPORT SEUL**
- Pas d'action automatique
- Rapport sauvegardé dans /prompts/spec/check-truth-[DATE].md

Choix : [1|2|3|4]
```

### Phase 7 : Auto-Redressement (si choisi)

#### Option 1 ou 2 : Mise à Jour Fichiers Existants

**Pour chaque fichier nécessitant correction** :

```markdown
📝 REDRESSEMENT FICHIER : [PATH]

**Étape 7.1 : Analyse détaillée**
- Lire document complet
- Lire sources (code, specs, config)
- Identifier sections obsolètes/conflictuelles
- Extraire informations correctes depuis sources

**Étape 7.2 : Génération corrections**
- Pour chaque section problématique :
  * Section : [NAME]
  * Issue : [DESCRIPTION]
  * Current content : [EXTRACT]
  * Truth source : [CODE/SPEC]
  * Corrected content : [NEW_CONTENT]

**Étape 7.3 : Application corrections**
- Utiliser Edit tool pour chaque section
- Préserver structure globale du document
- Mettre à jour frontmatter (date, version++)
- Ajouter note de révision si majeur

**Étape 7.4 : Validation post-correction** (agent-aikido-validator)
- Vérifier conformité AI-KIDO (≤500 lignes, frontmatter, liens)
- Si violations → corriger
- Retourner : [VALID | CORRECTED]

**Étape 7.5 : Update header** (agent-aikido-doc-header)
- Last Check : [TODAY]
- Check Status : ✅ Up-to-date
- Source Refs : [refresh dates]
```

#### Option 3 : Création Documentation Manquante 🤖 (agent-aikido-bank-populate)

**Invoquer agent-aikido-bank-populate** à la FIN avec liste gaps :

```markdown
🤖 AGENT: agent-aikido-bank-populate (END OF PROCESS)

**Prompt pour l'agent** :
"FORMAT: JSON

Peupler Memory Bank pour documentation manquante détectée.

Gaps détectés (depuis Phase 4) :
[PRIORIZED_GAPS_LIST]

Pour chaque gap prioritaire :
1. Code element : [module/function]
2. Code path : [path:lines]
3. Type suggéré : [concept|technique]
4. Priority : [CRITICAL|HIGH|MEDIUM]
5. Context : [extracted from code]

Workflow standard bank-populate :
- Phase 1 : Validation gaps (déjà fait)
- Phase 2 : Collection infos (from code)
- Phase 3 : Truth evaluation (scenario = DOCUMENTATION)
- Phase 4 : Classification (via raci-delegator)
- Phase 5 : Expert delegation ou direct write
- Phase 6 : Validation (agent-aikido-validator)
- Phase 7 : Integration (with doc-header creation)
- Phase 8 : Reporting

Retourner rapport complet création documents."

**Résultat attendu** : Nouveaux documents créés avec headers complets
```

### Phase 8 : Rapport Final et Sauvegarde

**Générer rapport final** dans `/prompts/spec/check-truth-[DATE].md` :

```markdown
# Rapport Check-Truth - [DATE]

> Version: 1.0 | Date: [DATE TIME] | Statut: Rapport Check-Truth

## Métadonnées Exécution

**Commande** : /check-truth [ARGUMENTS]
**Scope** : [SCOPE]
**Mode** : [NORMAL|VERBOSE|DRY_RUN]
**Force check** : [YES|NO]

## Statistiques Performance

**Fichiers analysés** : [TOTAL]
- Fast-path skip : [X] ([PERCENTAGE]%)
- Validés : [Y] ([PERCENTAGE]%)
- Nouveaux (no metadata) : [Z]

**Tokens** :
- Utilisés : [TOTAL]k
- Économisés (fast-path) : [SAVED]k
- Efficacité : [PERCENTAGE]% optimisation

**Temps d'exécution** : [DURATION]

## Résultats Validation

### Distribution Status

| Status | Nombre | Percentage |
|--------|--------|------------|
| ✅ Coherent | [X] | [PERCENTAGE]% |
| ⚠️ Minor drift | [Y] | [PERCENTAGE]% |
| ❌ Major conflict | [Z] | [PERCENTAGE]% |
| 🆕 No prior check | [N] | [PERCENTAGE]% |

### Détails Complets

[Inclure tableaux détaillés de Phase 6]

## Actions Effectuées (si auto-redressement)

**Option choisie** : [OPTION]

### Fichiers Mis à Jour

| Fichier | Action | Status | Détails |
|---------|--------|--------|---------|
| [path] | UPDATE [section] | ✅ Success | [details] |
| ... | ... | ... | ... |

### Documents Créés

| Fichier | Type | Truth Source | Status |
|---------|------|--------------|--------|
| [path] | Concept | Code | ✅ Created |
| ... | ... | ... | ... |

## Recommandations Post-Check

**Maintenance Continue** :
1. Exécuter `/check-truth` après chaque sprint/release
2. Exécuter `/check-truth --code-path [PATH]` après refactoring majeur
3. Exécuter `/check-truth --domain [DOMAIN]` mensuellement

**Améliorations Suggérées** :
1. [Suggestion basée sur patterns détectés]
2. [...]

**Prochaines Vérifications** :
- [Domaine/fichier] dans [X] jours (si dérivation détectée)
- [Domaine/fichier] dans [Y] jours (maintenance régulière)

---
*Rapport généré automatiquement par check-truth le [DATE TIME]*
```

**Sauvegarder** le rapport :
```
💾 RAPPORT SAUVEGARDÉ

Fichier : /prompts/spec/check-truth-[DATE].md
Taille : [X] lignes
```

## Messages de Confirmation

### Succès - Check Complet

```
✅ CHECK-TRUTH TERMINÉ AVEC SUCCÈS !

Scope : [SCOPE]
Fichiers analysés : [TOTAL]

Résultats :
✅ Coherent : [X] fichiers ([PERCENTAGE]%)
⚠️ Minor drift : [Y] fichiers ([PERCENTAGE]%)
❌ Major conflict : [Z] fichiers ([PERCENTAGE]%)

Performance :
⚡ Tokens économisés (fast-path) : [SAVED]k
📊 Efficacité : [PERCENTAGE]% optimisation
⏱️ Durée : [DURATION]

Actions effectuées :
[Liste si auto-redressement choisi]

📄 Rapport détaillé : /prompts/spec/check-truth-[DATE].md

💡 Recommandation : Exécuter `/check-truth` régulièrement pour maintenir cohérence
```

### Succès - Fast-Path Total

```
⚡ CHECK-TRUTH ULTRA-RAPIDE !

Scope : [SCOPE]
Fichiers analysés : [TOTAL]

Résultat : ✅ 100% UP-TO-DATE
- Tous les fichiers sont à jour
- Toutes les sources inchangées depuis last-check
- Aucune validation nécessaire

Performance :
⚡ Tokens économisés : [SAVED]k (~80% optimisation)
⏱️ Durée : < 10 secondes

🎯 Memory Bank parfaitement synchronisée avec le code !
```

### Avertissements

```
⚠️ CONFLITS MAJEURS DÉTECTÉS

Les fichiers suivants nécessitent une attention immédiate :

❌ [X] conflits majeurs :
1. [fichier] - [description courte]
2. [fichier] - [description courte]
[...]

Recommandations :
- Option 1 : Lancer auto-redressement (/check-truth [args] avec choix 1)
- Option 2 : Révision manuelle des fichiers listés
- Option 3 : Consulter rapport détaillé : /prompts/spec/check-truth-[DATE].md

⚠️ Ces conflits peuvent causer des incohérences dans les réponses du LLM
```

## 🤖 Agents AI-KIDO Utilisés

Cette commande utilise **5 agents AI-KIDO spécialisés** pour optimisation maximale :

### Phase 1 : `agent-aikido-explore-bank` (QUICK MODE)
- **Rôle** : Inventaire ciblé selon scope (fichier, domaine, search, code, full)
- **Output** : Liste fichiers avec metadata (last-check, truth source, source refs)
- **Tokens** : 1k-5k (selon scope)
- **Gain** : Extraction metadata rapide vs lecture manuelle

### Phase 2 : `agent-aikido-doc-header` (fast-path check)
- **Rôle** : Vérifier éligibilité fast-path (skip validation si ✅ + sources inchangées)
- **Output** : Liste fichiers skip vs validate
- **Tokens** : ~200 par fichier checké
- **Gain** : ~70-80% tokens économisés sur fichiers à jour

### Phase 3 : `agent-aikido-truth-evaluator` (validation)
- **Rôle** : Valider cohérence doc ↔ code/specs pour fichiers nécessitant validation
- **Output** : Status (✅|⚠️|❌), confidence, issues, recommendations
- **Tokens** : ~2k par fichier validé
- **Gain** : Validation automatisée avec détection conflits

### Phase 4 : `agent-aikido-explore-bank` + `truth-evaluator` (gaps detection)
- **Rôle** : Détecter documentation manquante pour code analysé
- **Output** : Liste gaps priorisés (CRITICAL → LOW)
- **Tokens** : Variable selon code size
- **Gain** : Détection automatique manques vs revue manuelle

### Phase 5 : `agent-aikido-doc-header` (batch update)
- **Rôle** : Mettre à jour headers pour tous fichiers validés
- **Output** : Headers actualisés (last-check, check status, source refs refreshed)
- **Tokens** : ~200 par fichier
- **Gain** : Batch update vs fichier par fichier

### Phase 7 (optionnel) : `agent-aikido-bank-populate` (création docs)
- **Rôle** : Créer documentation manquante depuis code
- **Output** : Nouveaux documents avec headers complets
- **Tokens** : Variable selon nombre gaps
- **Gain** : Orchestration automatique création vs manuel

### 📊 Gains d'Optimisation Estimés

| Aspect | Sans Optimisation | Avec Agents + Fast-Path | Gain |
|--------|-------------------|------------------------|------|
| **Inventaire** | Lecture manuelle tous fichiers | explore-bank ciblé | ~60% tokens |
| **Validation** | Tous fichiers revérifiés | Fast-path skip si ✅ | ~70-80% tokens |
| **Détection gaps** | Revue manuelle code | Automatique (explore+truth) | ~90% temps |
| **Mise à jour headers** | Fichier par fichier | Batch update | ~50% tokens |
| **Création docs** | Manuel | bank-populate orchestré | ~80% temps |
| **TOTAL WORKFLOW** | ~100k tokens | ~20-30k tokens | **70-80% efficacité** |

## Options de Commande

### Mode Standard
```bash
/check-truth
```
Vérification complète Memory Bank avec fast-path.

### Mode Fichier Unique
```bash
/check-truth --file /prompts/gen/concepts/oauth.md
```
Vérification ciblée sur un seul fichier.

### Mode Domaine
```bash
/check-truth --domain concepts
```
Vérification tous fichiers d'un domaine.

### Mode Recherche
```bash
/check-truth --search "authentication"
```
Vérification fichiers contenant keyword.

### Mode Analyse Code
```bash
/check-truth --code-path ./src/auth/
```
Analyse code + vérification doc associée + détection manques.

### Mode Combiné
```bash
/check-truth --code-path ./src/auth/ --domain concepts
```
Analyse code ET vérification domaine spécifique.

### Mode Force (sans fast-path)
```bash
/check-truth --force-check
```
Force validation complète, ignore fast-path optimization.

### Mode Dry-Run
```bash
/check-truth --dry-run
```
Simulation sans modifications, affiche ce qui serait fait.

### Mode Verbose
```bash
/check-truth --verbose
```
Affiche tous les détails en temps réel.

## Gestion des Erreurs

- **Fichier introuvable** : Skip avec warning, continue autres fichiers
- **Source ref inaccessible** : Mark as "(unavailable)" dans rapport, flag pour revue
- **Validation échouée** : Mark as ❌ avec erreur détaillée, propose correction manuelle
- **Agent timeout** : Retry une fois, puis fallback mode dégradé (sans agent)
- **Permission refusée** : Lister fichiers inaccessibles dans rapport, suggérer correction permissions

## Règles AI-KIDO Respectées

- ✅ Utilisation maximale agents AI-KIDO (5 agents orchestrés)
- ✅ Fast-path optimization via last-check metadata
- ✅ Respect hiérarchie hard_points > gen > code
- ✅ Génération rapport dans /prompts/spec/
- ✅ Mise à jour systematic headers via doc-header
- ✅ Invocation bank-populate à la FIN si gaps critiques
- ✅ Format Markdown avec métadonnées
- ✅ Traçabilité complète des vérifications

## Intégration avec Autres Commandes

Cette commande s'intègre avec :
- `/analyse-project` : Analyse code pour peupler Memory Bank (complémentaire)
- `/maj-aikido` : Mise à jour après rebase (check-truth après pour cohérence)
- `/analyse-aikido` : Audit complet AI-KIDO (check-truth pour vérité code)
- `/check-claude` : Synchronisation CLAUDE.md (check-truth pour contenu)

**Workflow recommandé** :
1. Développement de features → modifications code
2. `/check-truth --code-path [PATH]` → vérifier cohérence doc
3. Auto-redressement si nécessaire
4. `/analyse-aikido` → audit conformité
5. `/check-claude` → synchronisation interface

---

*Commande créée pour maintenir la cohérence Memory Bank ↔ Code avec optimisation maximale*
