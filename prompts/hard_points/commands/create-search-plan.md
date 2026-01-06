---
description: Crée un nouveau plan de recherche code pour agent-aikido-explore-code en guidant l'utilisateur à travers le processus. Lit README.md pour template et exigences, demande la technologie cible, génère la structure complète.
globs: prompts/hard_points/system/search/plans/README.md, prompts/hard_points/agents/agent-aikido-explore-code.md
---

# Create Search Plan

Crée un nouveau plan de recherche code pour `agent-aikido-explore-code` en suivant le template et les exigences documentés dans `prompts/hard_points/system/search/plans/README.md`.

## 🎯 Objectif

Guider l'utilisateur dans la création d'un plan de recherche complet et conforme, en :
- Questionnant sur la technologie cible
- Détectant le niveau de spécificité (générique, version, framework)
- Générant la structure complète du plan
- Pré-remplissant avec des patterns standards quand possible
- Validant automatiquement le plan créé

## 📋 Processus de Création

### 1. Charger le README de Référence

```bash
# Charger le README pour template et guidelines
README_PATH="prompts/hard_points/system/search/plans/README.md"
README_CONTENT=$(cat "$README_PATH")

# Extraire le template de plan
TEMPLATE=$(sed -n '/### 2\. Template de Plan/,/### 3\. Checklist/p' "$README_PATH")

# Charger l'agent pour comprendre les exigences
AGENT_PATH="prompts/hard_points/agents/agent-aikido-explore-code.md"
AGENT_CONTENT=$(cat "$AGENT_PATH")
```

### 2. Questionnaire Interactif

Poser une série de questions à l'utilisateur pour déterminer le plan à créer :

#### Question 1 : Technologie Cible

```
🎯 Pour quelle technologie/langage souhaitez-vous créer un plan de recherche ?

Exemples :
- python (Python générique)
- java (Java générique)
- go (Go générique)
- rust (Rust générique)
- ruby (Ruby générique)
- csharp (C# générique)
- typescript (TypeScript spécifique, si différent de JavaScript)
- kotlin (Kotlin)
- swift (Swift)
- autre (précisez)

Technologie cible :
```

**Stocker** : `TECH_NAME` (ex: "python")

#### Question 2 : Niveau de Spécificité

```
📊 Quel niveau de spécificité pour ce plan ?

1. Générique (pour toute version de {TECH_NAME})
2. Version spécifique (ex: Python 3.11, PHP 8, Java 17)
3. Framework spécifique (ex: Django pour Python, Spring pour Java)

Choisissez (1/2/3) :
```

**Stocker** : `SPECIFICITY_LEVEL`

#### Question 2a : Si Version Spécifique

```
🔢 Quelle version de {TECH_NAME} ?

Exemples : 3.11, 8, 17, 2.0

Version :
```

**Stocker** : `TECH_VERSION` (ex: "3.11")

#### Question 2b : Si Framework Spécifique

```
🏗️  Quel framework {TECH_NAME} ?

Exemples :
- Python: django, flask, fastapi
- Java: spring, hibernate
- JavaScript: react, vue, angular (si pas déjà dans javascript/plan.md)

Framework :
```

**Stocker** : `FRAMEWORK_NAME` (ex: "django")

#### Question 3 : Type de Recherche

```
🔍 Quel type de recherche ce plan utilisera-t-il ?

1. naive (grep-based, patterns regex simples) - RECOMMANDÉ
2. semantic (compréhension sémantique, nécessite parsing)
3. ast-based (analyse AST, nécessite parser spécifique)

La plupart des plans utilisent 'naive' car c'est le plus rapide et fiable.

Choisissez (1/2/3) [défaut: 1] :
```

**Stocker** : `SEARCH_METHOD` (défaut: "naive")

#### Question 4 : Extensions de Fichiers

```
📁 Quelles extensions de fichiers pour {TECH_NAME} ?

Entrez les extensions séparées par des espaces (avec ou sans *.)
Exemples :
- Python: *.py *.pyw *.pyx
- Java: *.java *.class
- Go: *.go
- Rust: *.rs
- Ruby: *.rb *.rake

Extensions [{suggestions_auto}] :
```

**Stocker** : `FILE_EXTENSIONS`

**Suggestions auto basées sur tech** :
```bash
case "$TECH_NAME" in
    python) SUGGESTED_EXTS="*.py *.pyw *.pyx" ;;
    java) SUGGESTED_EXTS="*.java *.class *.jar" ;;
    go) SUGGESTED_EXTS="*.go" ;;
    rust) SUGGESTED_EXTS="*.rs" ;;
    ruby) SUGGESTED_EXTS="*.rb *.rake *.gemspec" ;;
    csharp) SUGGESTED_EXTS="*.cs *.csx" ;;
    kotlin) SUGGESTED_EXTS="*.kt *.kts" ;;
    swift) SUGGESTED_EXTS="*.swift" ;;
    *) SUGGESTED_EXTS="" ;;
esac
```

#### Question 5 : Répertoires à Exclure

```
🚫 Quels répertoires doivent être exclus (en plus des standards) ?

Standards (toujours exclus) : node_modules, vendor, dist, build, .git

Exclusions additionnelles pour {TECH_NAME} (séparées par des espaces) :
Exemples :
- Python: __pycache__ *.egg-info .venv venv
- Java: target out
- Ruby: .bundle

Exclusions [{suggestions_auto}] :
```

**Stocker** : `ADDITIONAL_EXCLUSIONS`

**Suggestions auto** :
```bash
case "$TECH_NAME" in
    python) SUGGESTED_EXCL="__pycache__ *.egg-info .venv venv" ;;
    java) SUGGESTED_EXCL="target out" ;;
    go) SUGGESTED_EXCL="" ;;
    rust) SUGGESTED_EXCL="target" ;;
    ruby) SUGGESTED_EXCL=".bundle" ;;
    *) SUGGESTED_EXCL="" ;;
esac
```

### 3. Génération de la Structure

Créer la structure de répertoires et le fichier plan :

```bash
# Déterminer le chemin du plan selon la spécificité
BASE_PATH="prompts/hard_points/system/search/plans"

case "$SPECIFICITY_LEVEL" in
    1) # Générique
        PLAN_PATH="$BASE_PATH/$TECH_NAME/plan.md"
        ;;
    2) # Version spécifique
        PLAN_PATH="$BASE_PATH/$TECH_NAME/$TECH_VERSION/plan.md"
        ;;
    3) # Framework spécifique
        PLAN_PATH="$BASE_PATH/$TECH_NAME/$FRAMEWORK_NAME/plan.md"
        ;;
esac

# Créer le répertoire parent
mkdir -p "$(dirname "$PLAN_PATH")"

echo "📝 Le plan sera créé à : $PLAN_PATH"
```

### 4. Génération du Contenu du Plan

Générer le contenu complet du plan en utilisant le template et les réponses :

```markdown
# {TECH_NAME_TITLE} Code Search Plan

> **Version**: 1.0 | **Date**: {DATE} | **Type**: Search Plan | **Language**: {TECH_NAME_TITLE}

## 📋 Overview

Plan de recherche spécialisé pour projets {TECH_NAME_TITLE}. [Description à compléter selon technologie]

{TECH_SPECIFIC_DESCRIPTION}

## 🔍 File Patterns

### Extensions prioritaires
\`\`\`bash
{FILE_EXTENSIONS}
\`\`\`

### Configuration & Dépendances
\`\`\`bash
{TECH_CONFIG_FILES}
\`\`\`

### Exclusions standards
\`\`\`bash
# Répertoires à ignorer (respecter .gitignore)
node_modules/
vendor/
dist/
build/
out/
target/
.git/
.svn/
{ADDITIONAL_EXCLUSIONS}

# Fichiers binaires
*.bin *.exe *.dll *.so *.dylib
*.jpg *.jpeg *.png *.gif *.ico *.svg
*.pdf *.zip *.tar *.gz
\`\`\`

## 🎯 Search Method

**Type**: \`{SEARCH_METHOD}\`

{SEARCH_METHOD_DESCRIPTION}

### Phase 1: {TECH_NAME_TITLE} Discovery
\`\`\`bash
# Trouver tous les fichiers {TECH_NAME_TITLE}
find . -type f \\
  \( {FIND_PATTERNS} \) \\
  -not -path "*/node_modules/*" \\
  -not -path "*/vendor/*" \\
  -not -path "*/.git/*" \\
  {EXCLUSION_PATHS} \\
  2>/dev/null
\`\`\`

### Phase 2: Keyword Search
\`\`\`bash
# Recherche par mot-clé avec contexte
grep -rn --include="{FILE_PATTERNS}" \\
  --exclude-dir={EXCLUSIONS_LIST} \\
  -i "$KEYWORD" .
\`\`\`

## 📦 Patterns de Recherche

### 1. Imports/Dépendances {TECH_NAME_TITLE}
\`\`\`regex
{IMPORT_PATTERNS}
\`\`\`

### 2. Déclarations (Classes, Interfaces, Functions)
\`\`\`regex
{DECLARATION_PATTERNS}
\`\`\`

### 3. Méthodes/Fonctions
\`\`\`regex
{FUNCTION_PATTERNS}
\`\`\`

### 4. Mots-clés spécifiques
\`\`\`text
{TECH_SPECIFIC_KEYWORDS}
\`\`\`

## 🔄 Extension Strategy

### Résolution des Imports
\`\`\`bash
# Résoudre import/require vers fichier
function resolve_{TECH_NAME}_import() {
    local import_path="$1"
    local current_file="$2"
    local base_dir=$(dirname "$current_file")

    {IMPORT_RESOLUTION_LOGIC}
}
\`\`\`

## 📤 Output Format

### Structure spécifique {TECH_NAME_TITLE}

\`\`\`markdown
# {TECH_NAME_TITLE} Code Index

**Query**: [keyword]
**Framework**: [{FRAMEWORK_IF_ANY}]
**Files Indexed**: X

## 📄 \`{EXAMPLE_FILE_PATH}\`

**Classes** (X):
  - \`{EXAMPLE_CLASS_NAME}\` (lines X-Y): Z lines
    - Extends: \`{PARENT_CLASS}\`
    - Implements: \`{INTERFACES}\`
    - Methods: N

**Interfaces** (X):
  - \`{INTERFACE_NAME}\` (lines X-Y)
    - Methods: signature1(), signature2()

**Functions** (X):
  - \`{FUNCTION_SIGNATURE}\` (line X)

**Dependencies** (X):
  - \`{IMPORT_PATH}\` (line X)

---
\`\`\`

## 🧠 Context Extraction {TECH_NAME_TITLE}

### Classes
\`\`\`markdown
- **Name**: Full class name
- **Line Range**: Start-end lines
- **Extends**: Parent class
- **Implements**: Interfaces
- **Methods**: Public method count
- **Properties**: Public properties with types
{TECH_SPECIFIC_CLASS_METADATA}
\`\`\`

### Interfaces
\`\`\`markdown
- **Name**: Interface name
- **Line Range**: Start-end
- **Methods**: Signatures
{TECH_SPECIFIC_INTERFACE_METADATA}
\`\`\`

### Functions
\`\`\`markdown
- **Name**: Function name
- **Signature**: Full signature with types
- **Parameters**: Types and names
- **Return Type**: Return type
{TECH_SPECIFIC_FUNCTION_METADATA}
\`\`\`

## ⚡ Performance Optimization

### Commandes optimisées {TECH_NAME_TITLE}
\`\`\`bash
# Recherche ultra-rapide avec ripgrep
rg --type {RG_TYPE} \\
  --glob '!{EXCLUSIONS}' \\
  -i "$KEYWORD"

# Trouver toutes les classes
rg --type {RG_TYPE} -n "{CLASS_PATTERN}" -r '$1' --no-heading

# Trouver imports
rg --type {RG_TYPE} -n "{IMPORT_PATTERN}" --no-heading

# Statistiques par fichier
rg --type {RG_TYPE} -c -i "$KEYWORD" | sort -t: -k2 -nr | head -20
\`\`\`

## 📋 Usage Example

\`\`\`bash
# Exemple d'utilisation du plan {TECH_NAME_TITLE}
KEYWORD="{EXAMPLE_KEYWORD}"

# Phase 1: Discovery
FILES=$(rg --files --type {RG_TYPE})

# Phase 2: Search with context
RESULTS=$(rg -i -n -A 3 -B 1 "$KEYWORD" --type {RG_TYPE})

# Phase 3: Extract imports
for file in $FILES; do
    IMPORTS=$(grep -E "{IMPORT_PATTERN}" "$file" | head -5)
done

# Phase 4: Format output
# [Générer sortie markdown selon template ci-dessus]
\`\`\`

---
*Plan {TECH_NAME_TITLE} créé le {DATE} pour agent-aikido-explore-code*
*Généré automatiquement par /create-search-plan*
```

### 5. Pré-remplissage Intelligent

Pré-remplir les sections avec des valeurs par défaut basées sur la technologie :

#### Python
```bash
TECH_CONFIG_FILES="requirements.txt setup.py pyproject.toml"
IMPORT_PATTERNS="^import\s+(.*)\n^from\s+(.*)\s+import"
DECLARATION_PATTERNS="^class\s+(\w+)\n^def\s+(\w+)"
FUNCTION_PATTERNS="^def\s+(\w+)\s*\("
TECH_SPECIFIC_KEYWORDS="class def import from as decorator @property"
IMPORT_RESOLUTION_LOGIC="# Convert module.path to module/path.py\necho \"\${import_path//\./\/}.py\""
EXAMPLE_FILE_PATH="src/services/user_service.py"
EXAMPLE_CLASS_NAME="UserService"
```

#### Java
```bash
TECH_CONFIG_FILES="pom.xml build.gradle settings.gradle"
IMPORT_PATTERNS="^import\s+([\w\.]+);"
DECLARATION_PATTERNS="^(public|private|protected)?\s*(class|interface|enum)\s+(\w+)"
FUNCTION_PATTERNS="^\s*(public|private|protected|static)*\s*\w+\s+(\w+)\s*\("
TECH_SPECIFIC_KEYWORDS="class interface enum extends implements package import annotation @"
IMPORT_RESOLUTION_LOGIC="# Convert package.Class to package/Class.java\necho \"\${import_path//\./\/}.java\""
EXAMPLE_FILE_PATH="src/main/java/com/example/UserService.java"
EXAMPLE_CLASS_NAME="UserService"
```

#### Go
```bash
TECH_CONFIG_FILES="go.mod go.sum"
IMPORT_PATTERNS="^import\s+\(?\s*\"(.*?)\"\n^import\s+\"(.*?)\""
DECLARATION_PATTERNS="^type\s+(\w+)\s+(struct|interface)\n^func\s+(\w+)"
FUNCTION_PATTERNS="^func\s+(\w+)\s*\("
TECH_SPECIFIC_KEYWORDS="package import type struct interface func var const"
IMPORT_RESOLUTION_LOGIC="# Go uses GOPATH resolution\necho \"\$GOPATH/src/\$import_path\""
EXAMPLE_FILE_PATH="pkg/services/user.go"
EXAMPLE_CLASS_NAME="UserService (struct)"
```

#### Rust
```bash
TECH_CONFIG_FILES="Cargo.toml Cargo.lock"
IMPORT_PATTERNS="^use\s+(.*?);"
DECLARATION_PATTERNS="^pub\s+struct\s+(\w+)\n^pub\s+trait\s+(\w+)\n^pub\s+enum\s+(\w+)"
FUNCTION_PATTERNS="^pub\s+fn\s+(\w+)"
TECH_SPECIFIC_KEYWORDS="use mod pub struct trait impl enum fn let mut"
IMPORT_RESOLUTION_LOGIC="# Rust uses crate resolution\necho \"src/\${import_path//::///}.rs\""
EXAMPLE_FILE_PATH="src/services/user_service.rs"
EXAMPLE_CLASS_NAME="UserService (struct)"
```

#### Ruby
```bash
TECH_CONFIG_FILES="Gemfile Gemfile.lock"
IMPORT_PATTERNS="^require\s+['\"]([^'\"]+)['\"]\n^require_relative\s+['\"]([^'\"]+)['\"]"
DECLARATION_PATTERNS="^class\s+(\w+)\n^module\s+(\w+)"
FUNCTION_PATTERNS="^def\s+(\w+)"
TECH_SPECIFIC_KEYWORDS="class module def end require include extend attr_accessor"
IMPORT_RESOLUTION_LOGIC="# Convert require to file path\necho \"\$import_path.rb\""
EXAMPLE_FILE_PATH="lib/services/user_service.rb"
EXAMPLE_CLASS_NAME="UserService"
```

### 6. Confirmation et Création

Afficher un résumé et demander confirmation :

```
📋 Résumé du Plan à Créer

**Technologie**: {TECH_NAME_TITLE}
**Spécificité**: {SPECIFICITY_LEVEL_TEXT}
**Chemin**: {PLAN_PATH}
**Extensions**: {FILE_EXTENSIONS}
**Exclusions additionnelles**: {ADDITIONAL_EXCLUSIONS}
**Search Method**: {SEARCH_METHOD}

Le plan sera pré-rempli avec des patterns standards pour {TECH_NAME_TITLE}.
Vous pourrez le personnaliser après création.

Créer ce plan maintenant ? (y/n) :
```

Si confirmation :

```bash
# Écrire le fichier
echo "$PLAN_CONTENT" > "$PLAN_PATH"

echo "✅ Plan créé avec succès : $PLAN_PATH"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Personnaliser les patterns regex selon vos besoins"
echo "2. Compléter les sections TODO"
echo "3. Ajouter des exemples spécifiques"
echo "4. Valider avec : /validate-search-plan"
echo ""
echo "Pour éditer le plan :"
echo "  \$EDITOR $PLAN_PATH"
```

### 7. Validation Automatique Post-Création

Automatiquement valider le plan créé :

```bash
echo "🔍 Validation automatique du plan créé..."
echo ""

# Appeler /validate-search-plan sur le plan créé
# (Simuler ou lancer réellement la commande)

echo "✅ Validation automatique terminée"
echo "Consultez le rapport ci-dessus pour d'éventuelles améliorations."
```

### 8. Ouverture dans l'Éditeur (Optionnel)

Demander si l'utilisateur veut ouvrir le plan dans un éditeur :

```
Voulez-vous ouvrir le plan dans votre éditeur pour personnalisation ? (y/n) :
```

Si oui :

```bash
# Détecter l'éditeur (EDITOR env var ou défaut)
EDITOR="${EDITOR:-nano}"

# Ouvrir le fichier
$EDITOR "$PLAN_PATH"
```

## 📊 Templates par Technologie

Pour chaque technologie supportée, des templates pré-configurés sont disponibles :

| Technologie | Config Files | Import Pattern | Class Pattern | Status |
|-------------|--------------|----------------|---------------|--------|
| **Python** | requirements.txt, setup.py | `^import`, `^from` | `^class`, `^def` | ✅ Ready |
| **Java** | pom.xml, build.gradle | `^import\s+([\w\.]+);` | `^class\s+(\w+)` | ✅ Ready |
| **Go** | go.mod | `^import\s+"(.*?)"` | `^type\s+(\w+)\s+struct` | ✅ Ready |
| **Rust** | Cargo.toml | `^use\s+(.*?);` | `^pub\s+struct\s+(\w+)` | ✅ Ready |
| **Ruby** | Gemfile | `^require\s+['"]` | `^class\s+(\w+)` | ✅ Ready |
| **C#** | *.csproj | `^using\s+([\w\.]+);` | `^class\s+(\w+)` | ⏳ TODO |
| **Kotlin** | build.gradle.kts | `^import\s+([\w\.]+)` | `^class\s+(\w+)` | ⏳ TODO |
| **Swift** | Package.swift | `^import\s+(\w+)` | `^class\s+(\w+)` | ⏳ TODO |

## 🔧 Options Avancées

### Mode Expert (Skip Questions)

Créer un plan rapidement avec arguments en ligne de commande :

```bash
# Usage : /create-search-plan --tech=python --level=generic --method=naive
# Crée automatiquement avec valeurs par défaut
```

### Cloner un Plan Existant

Créer un nouveau plan basé sur un existant :

```bash
# Usage : /create-search-plan --clone=php/plan.md --tech=hack
# Clone php/plan.md et adapte pour Hack language
```

## ✅ Checklist de Création (Automatique)

À la fin de la création, afficher une checklist :

```markdown
## ✅ Checklist Post-Création

- [x] Plan créé à {PLAN_PATH}
- [x] Header métadonnées présent
- [x] Sections obligatoires générées
- [ ] Patterns regex personnalisés (TODO : affiner selon besoin)
- [ ] Import resolution function complétée (TODO)
- [ ] Exemples de sortie enrichis (TODO)
- [ ] Tests fonctionnels sur projet réel (TODO)
- [ ] Validation réussie (voir rapport ci-dessus)

**Prochaines Actions** :
1. Personnaliser patterns regex section "Patterns de Recherche"
2. Compléter fonction resolve_{TECH_NAME}_import()
3. Ajouter exemples spécifiques à votre codebase
4. Tester avec /validate-search-plan
5. Exécuter tests fonctionnels sur projet {TECH_NAME}
```

---

**Workflow** :
1. Charger README → 2. Questionnaire (tech, niveau, méthode, extensions, exclusions) → 3. Générer structure → 4. Pré-remplir contenu → 5. Confirmer création → 6. Écrire fichier → 7. Valider auto → 8. Ouvrir éditeur (opt)

**Important** : Le plan créé contient des TODO et nécessite personnalisation, mais est immédiatement utilisable avec patterns standards.
