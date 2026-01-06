---
description: Valide la structure et cohérence d'un plan de recherche code par rapport aux exigences de agent-aikido-explore-code. Vérifie sections obligatoires, patterns regex, format output, et cohérence avec README.md.
globs: prompts/hard_points/system/search/plans/**/*.md
---

# Validate Search Plan

Valide un plan de recherche code pour s'assurer qu'il respecte les exigences de `agent-aikido-explore-code` et les standards documentés dans `prompts/hard_points/system/search/plans/README.md`.

## 🎯 Objectif

Vérifier qu'un plan de recherche :
- Contient toutes les sections obligatoires
- Utilise le bon format de métadonnées
- Fournit des patterns regex valides
- Définit un format de sortie cohérent
- Respecte les contraintes de l'agent

## 📋 Processus de Validation

### 1. Demander le Plan à Valider

Demander à l'utilisateur quel plan il souhaite valider :

**Options** :
- Liste automatique des plans disponibles dans `prompts/hard_points/system/search/plans/`
- Chemins possibles :
  - `plan-generic.md` (fallback)
  - `php/plan.md`
  - `javascript/plan.md`
  - `python/plan.md`
  - `java/plan.md`
  - etc.
- Ou chemin personnalisé fourni par l'utilisateur

**Question à poser** :
```
Quel plan de recherche souhaitez-vous valider ?

Plans disponibles :
1. plan-generic.md (Fallback universel)
2. php/plan.md (PHP générique)
3. javascript/plan.md (JavaScript/TypeScript)
4. [autres plans détectés automatiquement]

Entrez le numéro ou le chemin complet du plan :
```

### 2. Charger le Plan et le README

```bash
# Charger le plan sélectionné
PLAN_PATH="prompts/hard_points/system/search/plans/$USER_SELECTION"
PLAN_CONTENT=$(cat "$PLAN_PATH")

# Charger le README de référence
README_PATH="prompts/hard_points/system/search/plans/README.md"
README_CONTENT=$(cat "$README_PATH")

# Charger l'agent pour vérifier les exigences
AGENT_PATH="prompts/hard_points/agents/agent-aikido-explore-code.md"
AGENT_CONTENT=$(cat "$AGENT_PATH")
```

### 3. Validation des Sections Obligatoires

Vérifier la présence de toutes les sections obligatoires :

**Checklist des sections** (selon README.md) :

- [ ] **Header** : Métadonnées (Version, Date, Type, Language)
- [ ] **Overview** : Description du plan et cas d'usage
- [ ] **File Patterns** : Extensions prioritaires et exclusions
- [ ] **Search Method** : Type de recherche (naive, semantic, ast-based)
- [ ] **Patterns de Recherche** : Regex pour imports, déclarations, keywords
- [ ] **Extension Strategy** : Comment suivre les dépendances
- [ ] **Output Format** : Template de sortie avec exemples
- [ ] **Context Extraction** : Métadonnées à extraire par type
- [ ] **Performance Optimization** : Commandes optimisées
- [ ] **Usage Example** : Exemple concret d'utilisation

**Validation** :
```bash
# Vérifier chaque section
MISSING_SECTIONS=()

for section in "Overview" "File Patterns" "Search Method" "Patterns de Recherche" \
                "Extension Strategy" "Output Format" "Context Extraction" \
                "Performance Optimization" "Usage Example"; do
    if ! grep -q "## .*$section" "$PLAN_PATH"; then
        MISSING_SECTIONS+=("$section")
    fi
done

# Reporter les sections manquantes
if [[ ${#MISSING_SECTIONS[@]} -gt 0 ]]; then
    echo "❌ Sections manquantes : ${MISSING_SECTIONS[@]}"
fi
```

### 4. Validation des Patterns Regex

Vérifier que les patterns regex sont bien formés :

**Tests** :
- Patterns imports/dépendances présents
- Patterns déclarations (classes, functions, interfaces) présents
- Syntaxe regex valide (pas d'erreurs de compilation)
- Groupes de capture appropriés

```bash
# Extraire les patterns regex du plan
IMPORT_PATTERNS=$(sed -n '/### .*Imports/,/###/p' "$PLAN_PATH" | grep -E "^\^")
DECLARATION_PATTERNS=$(sed -n '/### .*Déclarations/,/###/p' "$PLAN_PATH" | grep -E "^\^")

# Vérifier qu'il y a au moins 1 pattern de chaque type
[[ -z "$IMPORT_PATTERNS" ]] && echo "⚠️  Aucun pattern d'import trouvé"
[[ -z "$DECLARATION_PATTERNS" ]] && echo "⚠️  Aucun pattern de déclaration trouvé"

# Tester la syntaxe des patterns (avec grep -E pour valider regex)
while IFS= read -r pattern; do
    if ! echo "test" | grep -E "$pattern" &>/dev/null && ! echo "" | grep -E "$pattern" &>/dev/null; then
        echo "✅ Pattern valide: $pattern"
    fi
done <<< "$IMPORT_PATTERNS"
```

### 5. Validation du Format de Sortie

Vérifier que le plan définit un format de sortie cohérent avec l'agent :

**Exigences de l'agent** (selon agent-aikido-explore-code.md) :
- Métadonnées structurées par type (Classes, Interfaces, Functions, Dependencies)
- Localisation avec numéros de lignes (line ranges)
- PAS de code complet, seulement signatures
- Format compact (~50 lignes max par fichier)

**Validation** :
```bash
# Vérifier que la section Output Format existe et contient des exemples
if grep -q "## 📤 Output Format" "$PLAN_PATH"; then
    # Extraire l'exemple de sortie
    OUTPUT_EXAMPLE=$(sed -n '/## 📤 Output Format/,/## /p' "$PLAN_PATH")

    # Vérifier présence de catégories clés
    for category in "Classes" "Interfaces" "Functions" "Dependencies"; do
        if echo "$OUTPUT_EXAMPLE" | grep -q "\*\*$category\*\*"; then
            echo "✅ Catégorie '$category' présente dans output format"
        else
            echo "⚠️  Catégorie '$category' manquante dans output format"
        fi
    done

    # Vérifier que l'exemple montre des line numbers
    if echo "$OUTPUT_EXAMPLE" | grep -q "(line[s]* [0-9]"; then
        echo "✅ Line numbers présents dans output format"
    else
        echo "⚠️  Line numbers manquants dans output format"
    fi
else
    echo "❌ Section 'Output Format' manquante"
fi
```

### 6. Validation de la Cohérence avec README

Vérifier que le plan suit le template documenté dans README.md :

**Checklist template README** :
- [ ] Structure des sections conforme au template
- [ ] Métadonnées header présentes (Version, Date, Type, Language)
- [ ] Extensions de fichiers définies
- [ ] Exclusions standards définies
- [ ] Au moins un exemple d'usage fourni

```bash
# Vérifier header métadonnées
if head -5 "$PLAN_PATH" | grep -q "Version:.*Date:.*Type:"; then
    echo "✅ Header métadonnées présent"
else
    echo "⚠️  Header métadonnées incomplet"
fi

# Vérifier exemple d'usage
if grep -q "## 📋 Usage Example" "$PLAN_PATH"; then
    echo "✅ Section Usage Example présente"
else
    echo "⚠️  Section Usage Example manquante"
fi
```

### 7. Validation de la Compatibilité avec l'Agent

Vérifier que le plan est compatible avec les attentes de l'agent :

**Exigences de l'agent** :
- Plan doit être parsable (sections détectables via sed/grep)
- FILE_PATTERNS extractibles
- EXCLUSIONS extractibles
- IMPORT_PATTERNS et DECLARATION_PATTERNS extractibles
- OUTPUT_TEMPLATE extractible

**Test de parsing** :
```bash
# Simuler le parsing de l'agent (Phase 1)
echo "🔍 Test de parsing (simulation agent Phase 1)..."

# Extract file patterns
FILE_PATTERNS=$(sed -n '/## 🔍 File Patterns/,/## 🎯/p' "$PLAN_PATH" | grep -E "^\*\." | tr '\n' ' ')
if [[ -n "$FILE_PATTERNS" ]]; then
    echo "✅ FILE_PATTERNS extractibles: $FILE_PATTERNS"
else
    echo "❌ FILE_PATTERNS non extractibles"
fi

# Extract exclusions
EXCLUSIONS=$(sed -n '/### Exclusions/,/##/p' "$PLAN_PATH" | grep -E "^[a-zA-Z_]" | sed 's#/$##')
if [[ -n "$EXCLUSIONS" ]]; then
    echo "✅ EXCLUSIONS extractibles: $(echo "$EXCLUSIONS" | wc -l) exclusions"
else
    echo "❌ EXCLUSIONS non extractibles"
fi

# Extract search method
SEARCH_METHOD=$(grep -A2 "## 🎯 Search Method" "$PLAN_PATH" | tail -1)
if [[ -n "$SEARCH_METHOD" ]]; then
    echo "✅ SEARCH_METHOD extractible: $SEARCH_METHOD"
else
    echo "❌ SEARCH_METHOD non extractible"
fi
```

### 8. Tests Fonctionnels (Optionnel)

Si l'utilisateur le souhaite, exécuter des tests fonctionnels sur un projet réel :

**Tests** :
- Appliquer les patterns regex sur des fichiers d'exemple
- Vérifier que les extensions de fichiers sont reconnues
- Tester la résolution des imports (si fonction fournie)

```bash
# Demander à l'utilisateur s'il veut des tests fonctionnels
echo ""
echo "Voulez-vous exécuter des tests fonctionnels sur un projet réel ? (y/n)"
read -r RUN_FUNCTIONAL_TESTS

if [[ "$RUN_FUNCTIONAL_TESTS" == "y" ]]; then
    echo "Entrez le chemin du projet de test :"
    read -r TEST_PROJECT_PATH

    # Tester file discovery
    echo "🧪 Test de découverte de fichiers..."
    DISCOVERED_FILES=$(find "$TEST_PROJECT_PATH" -type f \
      $(echo "$FILE_PATTERNS" | sed 's/\*\./\-name "\*\./g;s/ /" -o /g') 2>/dev/null | wc -l)
    echo "   Fichiers trouvés: $DISCOVERED_FILES"

    # Tester pattern matching
    echo "🧪 Test de pattern matching..."
    TEST_KEYWORD="class"
    MATCHES=$(grep -r "$TEST_KEYWORD" "$TEST_PROJECT_PATH" --include="$FILE_PATTERNS" 2>/dev/null | wc -l)
    echo "   Matches pour '$TEST_KEYWORD': $MATCHES"
fi
```

## 📊 Rapport de Validation

Générer un rapport de validation complet :

```markdown
# Rapport de Validation - {plan_name}

**Date**: {date}
**Plan**: {plan_path}
**Validé par**: agent-aikido-explore-code requirements

## ✅ Validations Réussies

- [x] Sections obligatoires présentes (X/10)
- [x] Patterns regex valides
- [x] Format de sortie conforme
- [x] Header métadonnées complet
- [x] Parsing agent compatible

## ⚠️  Avertissements

- Catégorie 'Interfaces' manquante dans output format
- Section 'Performance Optimization' vide

## ❌ Erreurs Critiques

- Section 'Extension Strategy' manquante
- Aucun pattern de déclaration trouvé

## 💡 Recommandations

1. Ajouter section 'Extension Strategy' avec fonction resolve_import_path()
2. Compléter patterns de déclaration pour interfaces et traits
3. Enrichir section 'Performance Optimization' avec exemples rg/grep
4. Ajouter exemple de sortie pour catégorie 'Interfaces'

## 📈 Score Global

**Score**: 75/100

**Détail**:
- Sections obligatoires: 8/10 (80%)
- Patterns regex: 6/8 (75%)
- Format sortie: 7/10 (70%)
- Cohérence README: 9/10 (90%)
- Compatibilité agent: 7/10 (70%)

## 🎯 Statut Final

⚠️  **AMÉLIORATIONS NÉCESSAIRES** - Le plan nécessite des corrections avant utilisation en production.

---
*Rapport généré par /validate-search-plan le {date}*
```

## 🔧 Commandes Utiles

```bash
# Lister tous les plans disponibles
find prompts/hard_points/system/search/plans -name "plan.md" -o -name "plan-*.md"

# Comparer deux plans
diff prompts/hard_points/system/search/plans/php/plan.md \
     prompts/hard_points/system/search/plans/javascript/plan.md

# Extraire tous les patterns regex d'un plan
grep -E "^\^" prompts/hard_points/system/search/plans/php/plan.md

# Tester un pattern regex
echo "use App\Models\User;" | grep -E "^use\s+([\w\\]+)"
```

## ✅ Critères de Validation (Récapitulatif)

### Obligatoires (bloquants)
- [ ] Header avec métadonnées (Version, Date, Type)
- [ ] Section "File Patterns" avec extensions
- [ ] Section "Search Method" avec type
- [ ] Section "Patterns de Recherche" avec au moins imports et déclarations
- [ ] Section "Output Format" avec exemple structuré
- [ ] Patterns extractibles par l'agent (sed/grep)

### Recommandés (warnings)
- [ ] Section "Extension Strategy" avec résolution imports
- [ ] Section "Context Extraction" détaillée par type
- [ ] Section "Performance Optimization" avec commandes
- [ ] Section "Usage Example" avec cas concret
- [ ] Output format inclut toutes les catégories (classes, interfaces, functions, deps)
- [ ] Line numbers présents dans output format

### Optionnels (bonus)
- [ ] Section "Framework-Specific Patterns" (si applicable)
- [ ] Tests fonctionnels réussis sur projet réel
- [ ] Exemples multiples de patterns regex
- [ ] Documentation des limites/edge cases

---

**Workflow** :
1. Demander plan à valider → 2. Charger plan + README + agent → 3. Valider sections → 4. Valider patterns → 5. Valider format output → 6. Valider cohérence → 7. Valider compatibilité agent → 8. Tests fonctionnels (opt) → 9. Générer rapport

**Important** : Cette commande NE modifie PAS le plan, elle génère uniquement un rapport de validation avec recommandations.
