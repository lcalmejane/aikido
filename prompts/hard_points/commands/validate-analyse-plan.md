---
description: Valide la structure et cohérence d'un plan d'analyse par rapport aux exigences de /analyse-project. Vérifie sections obligatoires, métadonnées, stratégies d'extraction, orchestration agents, et cohérence avec README.md.
globs: prompts/hard_points/system/analyse/plans/**/*.md
---

# Validate Analyse Plan

Valide un plan d'analyse pour s'assurer qu'il respecte les exigences de `/analyse-project` et les standards documentés dans `prompts/hard_points/system/analyse/plans/README.md`.

## 🎯 Objectif

Vérifier qu'un plan d'analyse :
- Contient toutes les sections obligatoires
- Utilise le bon format de métadonnées (Version, Date, Type, Nature, Profondeur)
- Fournit des stratégies d'extraction cohérentes
- Définit une orchestration d'agents claire
- Respecte les contraintes AI-KIDO (≤500 lignes recommandé pour plans)
- Est compatible avec la logique de résolution de `/analyse-project`

## 📋 Processus de Validation

### 1. Demander le Plan à Valider

Demander à l'utilisateur quel plan il souhaite valider :

**Options** :
- Liste automatique des plans disponibles dans `prompts/hard_points/system/analyse/plans/`
- Chemins possibles :
  - `plan-survol.md`, `plan-standard.md`, `plan-approfondi.md`, `plan-expert.md` (fallbacks génériques)
  - `architecturale/c1/plan-*.md`
  - `technique/backend/plan-*.md`
  - `fonctionnelle/use-cases/plan-*.md`
  - `methodologique/devops/plan-*.md`
  - etc.
- Ou chemin personnalisé fourni par l'utilisateur

**Question à poser** :
```
Quel plan d'analyse souhaitez-vous valider ?

Plans disponibles :
[Liste automatique générée depuis find]

Exemples :
1. plan-standard.md (Fallback générique profondeur 2)
2. architecturale/c1/plan-standard.md (C1 Standard spécifique)
3. technique/backend/plan-approfondi.md (Backend Approfondi)

Entrez le numéro ou le chemin complet du plan :
```

### 2. Charger le Plan et les Références

```bash
# Charger le plan sélectionné
PLAN_PATH="prompts/hard_points/system/analyse/plans/$USER_SELECTION"
PLAN_CONTENT=$(cat "$PLAN_PATH")

# Charger le README de référence
README_PATH="prompts/hard_points/system/analyse/plans/README.md"
README_CONTENT=$(cat "$README_PATH")

# Charger la commande analyse-project pour vérifier compatibilité
COMMAND_PATH="prompts/hard_points/commands/analyse-project.md"
COMMAND_CONTENT=$(cat "$COMMAND_PATH")
```

### 3. Validation du Header (Métadonnées)

Vérifier la présence et validité du header avec métadonnées :

**Format attendu** (selon README.md ligne 196) :
```markdown
> **Version**: X.Y | **Date**: YYYY-MM-DD | **Type**: Analysis Plan | **Nature**: {CATEGORY}/{SUB_TYPE} | **Profondeur**: {1-4} - {NOM}
```

**Checklist header** :
- [ ] **Version** : Format X.Y présent
- [ ] **Date** : Format YYYY-MM-DD présent et valide
- [ ] **Type** : "Analysis Plan" présent
- [ ] **Nature** : Catégorie/sous-type cohérent avec path du fichier
- [ ] **Profondeur** : Niveau 1-4 + nom (survol/standard/approfondi/expert)

**Validation** :
```bash
# Extraire header (ligne 3 typiquement)
HEADER=$(sed -n '3p' "$PLAN_PATH")

# Vérifier chaque composant
if echo "$HEADER" | grep -q "Version.*Date.*Type.*Nature.*Profondeur"; then
    echo "✅ Header métadonnées complet"

    # Extraire valeurs
    VERSION=$(echo "$HEADER" | grep -oP 'Version:\s*\K[0-9]+\.[0-9]+')
    DATE=$(echo "$HEADER" | grep -oP 'Date:\s*\K[0-9]{4}-[0-9]{2}-[0-9]{2}')
    NATURE=$(echo "$HEADER" | grep -oP 'Nature:\s*\K[a-zA-Z/\-]+')
    PROFONDEUR=$(echo "$HEADER" | grep -oP 'Profondeur:\s*\K[0-9]')

    echo "  Version: $VERSION"
    echo "  Date: $DATE"
    echo "  Nature: $NATURE"
    echo "  Profondeur: $PROFONDEUR"

    # Vérifier cohérence nature avec path
    if echo "$PLAN_PATH" | grep -q "$NATURE"; then
        echo "✅ Nature cohérente avec path fichier"
    else
        echo "⚠️  Nature '$NATURE' ne correspond pas au path '$PLAN_PATH'"
    fi
else
    echo "❌ Header métadonnées incomplet ou malformé"
fi
```

### 4. Validation des Sections Obligatoires

Vérifier la présence de toutes les sections obligatoires :

**Checklist des sections** (selon template README.md lignes 193-420) :

- [ ] **Overview** : Description du plan et cas d'usage
- [ ] **Critères de Sélection** : Quand utiliser ce plan
- [ ] **Sources à Analyser** : Code/docs/config prioritaires
- [ ] **Agents AI-KIDO à Mobiliser** : Orchestration agents avec prompts
- [ ] **Stratégie d'Extraction** : Algorithmes et patterns de détection
- [ ] **Workflow Complet** : Diagramme Mermaid des phases
- [ ] **Output Format** : Template de sortie structuré

**Validation** :
```bash
# Vérifier chaque section
MISSING_SECTIONS=()

for section in "Overview" "Critères de Sélection" "Sources à Analyser" \
                "Agents AI-KIDO à Mobiliser" "Stratégie d'Extraction" \
                "Workflow Complet" "Output Format"; do
    if ! grep -qi "## .*$section" "$PLAN_PATH"; then
        MISSING_SECTIONS+=("$section")
    fi
done

# Reporter les sections manquantes
if [[ ${#MISSING_SECTIONS[@]} -gt 0 ]]; then
    echo "❌ Sections obligatoires manquantes : ${MISSING_SECTIONS[@]}"
else
    echo "✅ Toutes les sections obligatoires présentes (7/7)"
fi
```

### 5. Validation de la Section "Critères de Sélection"

Vérifier que le plan définit clairement quand il doit être utilisé :

**Exigences** (selon template lignes 204-214) :
- Nature d'analyse (numéro 1-18 + description)
- Profondeur d'analyse (1-4 + description)
- Contexte idéal
- Différences vs autres plans (générique, profondeurs inf/sup)

**Validation** :
```bash
# Extraire section Critères
CRITERES=$(sed -n '/## 🎯 Critères de Sélection/,/## /p' "$PLAN_PATH")

if echo "$CRITERES" | grep -q "Nature.*:"; then
    echo "✅ Critère 'Nature' présent"
else
    echo "⚠️  Critère 'Nature' manquant"
fi

if echo "$CRITERES" | grep -q "Profondeur.*:"; then
    echo "✅ Critère 'Profondeur' présent"
else
    echo "⚠️  Critère 'Profondeur' manquant"
fi

if echo "$CRITERES" | grep -qi "vs.*plan"; then
    echo "✅ Comparaisons avec autres plans présentes"
else
    echo "⚠️  Comparaisons avec autres plans manquantes"
fi
```

### 6. Validation de la Section "Sources à Analyser"

Vérifier que les sources prioritaires sont définies :

**Exigences** (selon template lignes 216-236) :
- Code source : Répertoires + Extensions + Exclusions
- Documentation : Fichiers + Sections prioritaires
- Configuration : Fichiers + Paramètres clés
- Critères de filtrage

**Validation** :
```bash
# Extraire section Sources
SOURCES=$(sed -n '/## 🔍 Sources à Analyser/,/## 🤖/p' "$PLAN_PATH")

# Vérifier sous-sections
for subsection in "Code Source" "Documentation" "Configuration"; do
    if echo "$SOURCES" | grep -qi "\*\*$subsection\*\*"; then
        echo "✅ Sous-section '$subsection' présente"
    else
        echo "⚠️  Sous-section '$subsection' manquante"
    fi
done

# Vérifier présence d'au moins une extension de fichier
if echo "$SOURCES" | grep -qE "(\*\.[a-z]{2,4}|Extensions)"; then
    echo "✅ Extensions de fichiers définies"
else
    echo "⚠️  Aucune extension de fichier trouvée"
fi

# Vérifier présence d'exclusions
if echo "$SOURCES" | grep -qi "exclusion"; then
    echo "✅ Exclusions définies"
else
    echo "⚠️  Exclusions non définies"
fi
```

### 7. Validation de l'Orchestration d'Agents

Vérifier que les agents AI-KIDO sont correctement définis :

**Exigences** (selon template lignes 238-285) :
- Phase 3.1 : `agent-aikido-explore-code` (OBLIGATOIRE)
- Phase 3.2 : `agent-aikido-explore-all` (optionnel, condition définie)
- Résolution contradictions : `agent-aikido-truth-evaluator` (optionnel)
- Classification RACI : `agent-aikido-raci-delegator` (optionnel)
- Peuplement : `agent-aikido-bank-populate` (optionnel)
- Validation finale : `agent-aikido-validator` (OBLIGATOIRE)

**Validation** :
```bash
# Extraire section Agents
AGENTS=$(sed -n '/## 🤖 Agents AI-KIDO à Mobiliser/,/## 📊/p' "$PLAN_PATH")

# Vérifier agents obligatoires
if echo "$AGENTS" | grep -q "agent-aikido-explore-code"; then
    echo "✅ Agent obligatoire 'explore-code' présent"
else
    echo "❌ Agent obligatoire 'explore-code' MANQUANT"
fi

if echo "$AGENTS" | grep -q "agent-aikido-validator"; then
    echo "✅ Agent obligatoire 'validator' présent"
else
    echo "❌ Agent obligatoire 'validator' MANQUANT"
fi

# Vérifier présence de prompts pour agents
AGENT_COUNT=$(echo "$AGENTS" | grep -c '^\*\*Agent\*\*.*:')
PROMPT_COUNT=$(echo "$AGENTS" | grep -c '\*\*Prompt spécialisé\*\*')

echo "  Agents définis: $AGENT_COUNT"
echo "  Prompts fournis: $PROMPT_COUNT"

if [[ $AGENT_COUNT -eq $PROMPT_COUNT ]]; then
    echo "✅ Tous les agents ont un prompt spécialisé"
else
    echo "⚠️  Certains agents n'ont pas de prompt spécialisé ($PROMPT_COUNT/$AGENT_COUNT)"
fi
```

### 8. Validation de la Stratégie d'Extraction

Vérifier que la stratégie d'extraction est définie :

**Exigences** (selon template lignes 286-317) :
- Détection automatique : Algorithme + Patterns + Heuristiques
- Extraction métadonnées : Architecture + Stack + Domaine + Config
- Analyse profondeur spécifique : Niveau détail + Métriques + Temps estimé

**Validation** :
```bash
# Extraire section Stratégie
STRATEGIE=$(sed -n '/## 📊 Stratégie d'"'"'Extraction/,/## 🔄/p' "$PLAN_PATH")

# Vérifier détection automatique
if echo "$STRATEGIE" | grep -qi "détection"; then
    echo "✅ Section 'Détection Automatique' présente"
else
    echo "⚠️  Section 'Détection Automatique' manquante"
fi

# Vérifier extraction métadonnées
for metadata in "Architecture" "Stack Technique" "Domaine" "Configuration"; then
    if echo "$STRATEGIE" | grep -qi "$metadata"; then
        echo "✅ Métadonnée '$metadata' couverte"
    else
        echo "⚠️  Métadonnée '$metadata' non mentionnée"
    fi
done

# Vérifier temps estimé
if echo "$STRATEGIE" | grep -qiE "temps.*estim[ée]|durée"; then
    echo "✅ Temps d'exécution estimé présent"
else
    echo "⚠️  Temps d'exécution estimé manquant"
fi
```

### 9. Validation du Workflow (Diagramme Mermaid)

Vérifier la présence et cohérence du workflow :

**Exigences** (selon template lignes 318-360) :
- Diagramme Mermaid complet
- Phases d'exécution clairement définies
- Agents en violet (style fill:#f9f)
- Conditions et branches logiques

**Validation** :
```bash
# Extraire section Workflow
WORKFLOW=$(sed -n '/## 🔄 Workflow Complet/,/## 📤/p' "$PLAN_PATH")

# Vérifier présence diagramme Mermaid
if echo "$WORKFLOW" | grep -q '```mermaid'; then
    echo "✅ Diagramme Mermaid présent"

    # Extraire le diagramme
    MERMAID=$(sed -n '/```mermaid/,/```/p' "$PLAN_PATH")

    # Vérifier agents stylés
    STYLED_AGENTS=$(echo "$MERMAID" | grep -c 'style.*fill:#f9f')
    echo "  Agents stylés: $STYLED_AGENTS"

    # Vérifier nœud final
    if echo "$MERMAID" | grep -q 'fill:#9f9'; then
        echo "✅ Nœud de fin correctement stylé (vert)"
    else
        echo "⚠️  Nœud de fin pas stylé en vert"
    fi
else
    echo "❌ Diagramme Mermaid MANQUANT"
fi

# Vérifier temps d'exécution estimé
if echo "$WORKFLOW" | grep -qiE "[0-9]+ *min"; then
    TIME_ESTIMATE=$(echo "$WORKFLOW" | grep -oiE "[0-9]+-[0-9]+ min" | head -1)
    echo "✅ Temps d'exécution estimé: $TIME_ESTIMATE"
else
    echo "⚠️  Temps d'exécution estimé manquant"
fi
```

### 10. Validation du Format de Sortie

Vérifier que le template de sortie est défini :

**Exigences** (selon template lignes 369-420) :
- Structure de rapport markdown
- Sections principales : Configuration + Résultats + Détails Techniques + Écarts + Enrichissements + Conformité
- Métadonnées : Date, Durée, Sources analysées
- Footer avec référence au plan utilisé

**Validation** :
```bash
# Extraire section Output Format
OUTPUT=$(sed -n '/## 📤 Output Format/,/##/p' "$PLAN_PATH")

if echo "$OUTPUT" | grep -q '```markdown'; then
    echo "✅ Template de sortie markdown présent"

    # Vérifier sections clés dans template
    for section in "Configuration" "Résultats" "Détails Techniques" \
                   "Écarts" "Enrichissements" "Conformité"; do
        if echo "$OUTPUT" | grep -qi "$section"; then
            echo "✅ Section '$section' dans template"
        else
            echo "⚠️  Section '$section' manquante dans template"
        fi
    done
else
    echo "❌ Template de sortie markdown MANQUANT"
fi
```

### 11. Validation de Cohérence avec README

Vérifier que le plan suit le template documenté dans README.md :

**Checklist template README** :
- [ ] Structure des sections conforme au template
- [ ] Nature d'analyse dans critères de sélection
- [ ] Profondeur d'analyse dans critères de sélection
- [ ] Agents obligatoires présents (explore-code, validator)
- [ ] Workflow complet avec Mermaid
- [ ] Output format défini

```bash
# Comparer structure plan vs template README
echo "🔍 Vérification cohérence avec README.md..."

# Vérifier que le plan respecte l'algorithme de résolution
# (selon README.md lignes 86-147)
PLAN_BASENAME=$(basename "$PLAN_PATH")
PLAN_DIRNAME=$(dirname "$PLAN_PATH" | sed 's#.*/plans/##')

if [[ "$PLAN_BASENAME" =~ ^plan-(survol|standard|approfondi|expert)\.md$ ]]; then
    echo "✅ Nom de fichier conforme au pattern (fallback ou spécifique)"
else
    echo "⚠️  Nom de fichier non conforme: $PLAN_BASENAME"
fi

# Vérifier cohérence profondeur filename <-> header
PROFONDEUR_FILE=$(echo "$PLAN_BASENAME" | grep -oE "(survol|standard|approfondi|expert)")
if [[ -n "$PROFONDEUR" ]]; then
    if echo "$PLAN_CONTENT" | head -5 | grep -qi "$PROFONDEUR_FILE"; then
        echo "✅ Profondeur filename cohérente avec header"
    else
        echo "⚠️  Incohérence profondeur filename vs header"
    fi
fi
```

### 12. Validation de Compatibilité avec /analyse-project

Vérifier que le plan est compatible avec la commande analyse-project :

**Test de parsing** :
```bash
# Simuler le parsing de /analyse-project (Phase 1.5)
echo "🔍 Test de parsing (simulation /analyse-project Phase 1.5)..."

# Vérifier que le plan est trouvable par l'algorithme de résolution
# (Logique README.md lignes 86-147)

# Extract nature number from header if format "Nature: X - Description"
NATURE_NUM=$(echo "$HEADER" | grep -oP 'Nature:\s*\K[0-9]+' || echo "")

if [[ -n "$NATURE_NUM" ]]; then
    echo "✅ Nature numérique extractible: $NATURE_NUM"
else
    echo "⚠️  Nature numérique non extractible du header"
fi

# Vérifier lisibilité des sections par /analyse-project
echo "Vérification extractibilité des sections clés..."

# Test extraction prompt explore-code
EXPLORE_CODE_PROMPT=$(sed -n '/### Phase 3.1.*Scan Code/,/^$/p' "$PLAN_PATH" | \
                      sed -n '/```/,/```/p' | sed '1d;$d')

if [[ -n "$EXPLORE_CODE_PROMPT" ]]; then
    echo "✅ Prompt explore-code extractible"
else
    echo "⚠️  Prompt explore-code non extractible ou vide"
fi
```

### 13. Tests Fonctionnels (Optionnel)

Si l'utilisateur le souhaite, tester le plan sur un projet réel :

**Question** :
```
Voulez-vous exécuter un test fonctionnel du plan sur un projet réel ? (y/n)
```

Si oui :
```bash
# Demander path du projet de test
echo "Entrez le chemin du projet de test :"
read -r TEST_PROJECT_PATH

if [[ ! -d "$TEST_PROJECT_PATH" ]]; then
    echo "❌ Projet introuvable: $TEST_PROJECT_PATH"
    exit 1
fi

echo "🧪 Test fonctionnel sur projet: $TEST_PROJECT_PATH"
echo ""

# Test 1: Vérifier que les sources définies existent
echo "Test 1: Vérification sources prioritaires..."
SOURCE_DIRS=$(echo "$SOURCES" | grep -oE "Répertoires.*:" -A5 | grep -oE "[a-zA-Z_/]+/" | head -3)

for dir in $SOURCE_DIRS; do
    if [[ -d "$TEST_PROJECT_PATH/$dir" ]]; then
        echo "  ✅ Répertoire trouvé: $dir"
    else
        echo "  ⚠️  Répertoire non trouvé: $dir"
    fi
done

# Test 2: Vérifier fichiers avec extensions définies
echo ""
echo "Test 2: Vérification extensions fichiers..."
FILE_EXTS=$(echo "$SOURCES" | grep -oE "\*\.[a-z]{2,4}" | head -3)

for ext in $FILE_EXTS; do
    COUNT=$(find "$TEST_PROJECT_PATH" -name "$ext" 2>/dev/null | wc -l)
    echo "  Fichiers $ext trouvés: $COUNT"
done

# Test 3: Simuler extraction avec patterns (si patterns regex définis)
echo ""
echo "Test 3: Test patterns de détection..."
if echo "$STRATEGIE" | grep -q '```regex'; then
    PATTERNS=$(sed -n '/```regex/,/```/p' "$PLAN_PATH" | sed '1d;$d' | head -3)
    echo "  Patterns extraits: $(echo "$PATTERNS" | wc -l)"
else
    echo "  ⚠️  Aucun pattern regex trouvé dans plan"
fi
```

## 📊 Rapport de Validation

Générer un rapport de validation complet dans `/prompts/spec/` :

```bash
# Définir path du rapport
REPORT_PATH="prompts/spec/validate-analyse-plan-report-$(date +%Y%m%d-%H%M%S).md"
PLAN_NAME=$(basename "$PLAN_PATH" .md)
PLAN_CATEGORY=$(dirname "$PLAN_PATH" | sed 's#.*/plans/##')

# Compiler scores
TOTAL_CHECKS=13
PASSED_CHECKS=0
WARNING_CHECKS=0
FAILED_CHECKS=0

# (Incrémenter pendant validation)

# Calculer score global
SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

# Générer rapport
cat > "$REPORT_PATH" <<EOF
# Rapport de Validation - $PLAN_NAME

**Date**: $(date +%Y-%m-%d\ %H:%M:%S)
**Plan**: \`$PLAN_PATH\`
**Catégorie**: $PLAN_CATEGORY
**Validé par**: /validate-analyse-plan v1.0

---

## ✅ Validations Réussies ($PASSED_CHECKS/$TOTAL_CHECKS)

$(list_passed_validations)

## ⚠️  Avertissements ($WARNING_CHECKS)

$(list_warnings)

## ❌ Erreurs Critiques ($FAILED_CHECKS)

$(list_errors)

## 💡 Recommandations

$(generate_recommendations)

## 📈 Score Global

**Score**: $SCORE/100

**Détail**:
- Header métadonnées: $(check_header_score)/10 ($(calc_percentage))%
- Sections obligatoires: $(check_sections_score)/15 ($(calc_percentage))%
- Critères sélection: $(check_criteria_score)/10 ($(calc_percentage))%
- Sources prioritaires: $(check_sources_score)/10 ($(calc_percentage))%
- Orchestration agents: $(check_agents_score)/20 ($(calc_percentage))%
- Stratégie extraction: $(check_strategy_score)/10 ($(calc_percentage))%
- Workflow Mermaid: $(check_workflow_score)/10 ($(calc_percentage))%
- Output format: $(check_output_score)/10 ($(calc_percentage))%
- Cohérence README: $(check_readme_score)/10 ($(calc_percentage))%
- Compatibilité /analyse-project: $(check_compat_score)/5 ($(calc_percentage))%

## 🎯 Statut Final

$(determine_final_status)

---
*Rapport généré par /validate-analyse-plan le $(date +%Y-%m-%d)*
*Plan path: \`$PLAN_PATH\`*
*README référence: \`prompts/hard_points/system/analyse/plans/README.md\`*
EOF

echo ""
echo "✅ Rapport de validation généré: $REPORT_PATH"
```

**Template de fonction déterminer statut** :
```bash
determine_final_status() {
    if [[ $SCORE -ge 90 && $FAILED_CHECKS -eq 0 ]]; then
        echo "✅ **CONFORME** - Le plan est prêt pour utilisation en production."
    elif [[ $SCORE -ge 70 && $FAILED_CHECKS -eq 0 ]]; then
        echo "⚠️  **AMÉLIORATIONS RECOMMANDÉES** - Le plan fonctionne mais pourrait être optimisé."
    elif [[ $FAILED_CHECKS -gt 0 && $FAILED_CHECKS -le 2 ]]; then
        echo "⚠️  **CORRECTIONS NÉCESSAIRES** - Corriger les erreurs critiques avant utilisation."
    else
        echo "❌ **NON CONFORME** - Le plan nécessite des corrections majeures."
    fi
}
```

## 🔧 Commandes Utiles

```bash
# Lister tous les plans disponibles
find prompts/hard_points/system/analyse/plans -name "plan-*.md" | sort

# Comparer deux plans
diff prompts/hard_points/system/analyse/plans/plan-standard.md \
     prompts/hard_points/system/analyse/plans/architecturale/c1/plan-standard.md

# Extraire tous les agents d'un plan
grep -E "agent-aikido-[a-z-]+" prompts/hard_points/system/analyse/plans/plan-standard.md

# Vérifier taille d'un plan (contrainte ≤500 lignes recommandé)
wc -l prompts/hard_points/system/analyse/plans/plan-standard.md
```

## ✅ Critères de Validation (Récapitulatif)

### Obligatoires (bloquants)

- [ ] Header avec métadonnées (Version, Date, Type, Nature, Profondeur)
- [ ] Section "Overview" avec description
- [ ] Section "Critères de Sélection" complète
- [ ] Section "Sources à Analyser" avec code/docs/config
- [ ] Section "Agents AI-KIDO à Mobiliser" avec explore-code et validator
- [ ] Section "Stratégie d'Extraction" définie
- [ ] Section "Workflow Complet" avec diagramme Mermaid
- [ ] Section "Output Format" avec template markdown
- [ ] Agents obligatoires présents (explore-code, validator)
- [ ] Prompts spécialisés pour chaque agent

### Recommandés (warnings)

- [ ] Nature cohérente avec path du fichier
- [ ] Profondeur cohérente entre filename et header
- [ ] Comparaisons avec autres plans ("vs Plan générique", etc.)
- [ ] Sous-sections Sources complètes (Code + Documentation + Configuration)
- [ ] Extensions de fichiers définies
- [ ] Exclusions définies
- [ ] Tous les agents ont un prompt spécialisé
- [ ] Métadonnées d'extraction complètes (Architecture, Stack, Domaine, Config)
- [ ] Temps d'exécution estimé
- [ ] Diagramme Mermaid avec agents stylés (violet) et fin (vert)
- [ ] Template output avec toutes sections (Configuration, Résultats, Détails, Écarts, Enrichissements, Conformité)
- [ ] Footer avec référence au plan

### Optionnels (bonus)

- [ ] Sections adaptées au type d'analyse spécifique
- [ ] Tests fonctionnels réussis sur projet réel
- [ ] Patterns regex pour détection automatique
- [ ] Heuristiques détaillées
- [ ] Exemples concrets de sortie
- [ ] Documentation des limites/edge cases
- [ ] Métriques de performance

## 🤖 Agents AI-KIDO Utilisés

Cette commande utilise **0-1 agents AI-KIDO** pour validation simple et efficace :

### Validation Manuelle (Bash/Grep)

**Phases 1-12** : Validation structure et cohérence via bash/grep
- **Avantages** : Rapide (<1s), léger (<100 tokens), précis
- **Méthodes** : sed, grep, test de patterns regex
- **Output** : Checks binaires (✅ / ⚠️  / ❌)

### Phase Finale (Optionnelle) : `agent-aikido-validator`

**Condition** : Validation complémentaire demandée par utilisateur

**Agent** : `agent-aikido-validator`

**Prompt** :
```
"Valider conformité AI-KIDO du plan d'analyse.

Fichier : $PLAN_PATH
Type : Plan d'analyse pour /analyse-project

Validations complémentaires :
1. Conformité globale AI-KIDO (≤500 lignes recommandé pour plans)
2. Qualité liens internes/externes
3. Cohérence globale du document
4. Frontmatter/métadonnées (si présents)

Retourner :
- Status : [✅ CONFORME | ⚠️ WARNINGS | ❌ NON CONFORME]
- Violations : [liste si applicable]
- Quick fixes : [corrections suggérées]

Tokens estimés : ~1-2k"
```

### 📊 Performance Totale

**Tokens utilisés** : ~100-2,000 (selon si validator utilisé)
**Temps estimé** : 1-5 secondes (selon taille plan + tests fonctionnels opt)
**Qualité** : Validation précise avec rapport détaillé

## Règles AI-KIDO Respectées

- ✅ Référence ressource hard point principale (README.md)
- ✅ Validation structure conforme au template
- ✅ Génération rapport dans /prompts/spec/
- ✅ Intégration avec /analyse-project (consommateur)
- ✅ Pattern similaire à /validate-search-plan (cohérence)
- ✅ Agent validator optionnel (validation légère privilégiée)
- ✅ Format Markdown standardisé
- ✅ Contrainte ≤1000 lignes pour commandes respectée

## Intégration avec Autres Commandes

Cette commande s'intègre avec :

- `/analyse-project` : Consommateur des plans validés
- `/create-analyse-plan` : Commande complémentaire (create puis validate)
- `/validate-search-plan` : Pattern similaire pour plans de recherche code
- `/check-claude` : Vérifier synchronisation après création/validation plans

**Workflow recommandé** :
1. `/create-analyse-plan` → Créer nouveau plan guidé
2. `/validate-analyse-plan` → Valider plan créé
3. Corriger selon rapport validation
4. `/validate-analyse-plan` → Re-valider après corrections
5. `/analyse-project` (nature X, profondeur Y) → Utiliser plan validé
6. Itérer pour optimiser plan selon résultats

---

*Commande créée pour valider les plans d'analyse AI-KIDO*
*Pattern : validate-search-plan adapté pour plans d'analyse*
*Ressources : README.md (définition plans) + /analyse-project (consommateur)*
