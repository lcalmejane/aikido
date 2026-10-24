# Generic Code Search Plan

> **Version**: 1.0 | **Date**: 2025-12-09 | **Type**: Search Plan

## 📋 Overview

Generic search plan for any type of source code. Used as a fallback when no technology-specific plan is found.

**Use cases**: Multi-language projects, unsupported technologies, exploratory discovery without any technology assumption.

## 🔍 File Patterns

### Priority extensions
```bash
# Source code (all common languages)
*.js *.ts *.jsx *.tsx *.mjs *.cjs
*.py *.pyc *.pyw
*.java *.class *.jar
*.cpp *.c *.cc *.cxx *.h *.hpp
*.cs *.csx
*.rb *.rake
*.go
*.rs
*.php
*.swift
*.kt *.kts
*.scala
*.sh *.bash
*.sql

# Configuration
*.json *.yaml *.yml *.toml *.ini *.env *.properties

# Documentation
*.md *.rst *.txt
```

### Standard exclusions
```bash
# Directories to ignore (respect .gitignore)
node_modules/
vendor/
dist/
build/
out/
target/
.git/
.svn/
__pycache__/
*.egg-info/
.venv/
venv/

# Binary files
*.bin *.exe *.dll *.so *.dylib
*.jpg *.jpeg *.png *.gif *.ico *.svg
*.pdf *.zip *.tar *.gz
```

## 🎯 Search Method

**Type**: `naive` (grep-based, no semantic understanding required)

### Phase 1: Quick Discovery
```bash
# Find all potentially relevant files
find . -type f \
  \( -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.java" -o -name "*.go" -o -name "*.rs" -o -name "*.cpp" -o -name "*.rb" -o -name "*.php" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/vendor/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  2>/dev/null
```

### Phase 2: Keyword Search
```bash
# Search by keyword with context
grep -rn --include="*.{js,ts,py,java,go,rs,cpp,rb,php}" \
  --exclude-dir={node_modules,vendor,.git,dist,build} \
  -i "$KEYWORD" .
```

## 📦 Search Patterns

### 1. Imports/Dependencies (multi-language)
```regex
# JavaScript/TypeScript
^import\s+.*\s+from\s+['"](.*?)['"]
^const\s+.*\s+=\s+require\(['"](.*?)['"]\)

# Python
^import\s+(.*)
^from\s+(.*)\s+import

# Java
^import\s+([\w\.]+);

# Go
^import\s+\(?\s*"(.*?)"

# Rust
^use\s+(.*);

# PHP
^use\s+([\w\\]+);

# Ruby
^require\s+['"](.*?)['"]
```

### 2. Class/Interface/Trait Declarations
```regex
# Classes (multi-language)
^(export\s+)?(public\s+|private\s+|protected\s+)?(class|interface|trait|struct|enum)\s+(\w+)

# Namespace/Package
^(namespace|package)\s+([\w\\\.]+)
```

### 3. Functions/Methods
```regex
# Function declarations (multi-language)
^(export\s+)?(public\s+|private\s+|protected\s+|static\s+)?(function|def|fn|func)\s+(\w+)\s*\(

# Arrow functions (JavaScript/TypeScript)
^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*\(.*\)\s*=>

# Methods (in classes)
^\s+(public|protected|private)\s+function\s+(\w+)\s*\(
```

### 4. Common keywords
```text
# Inheritance/Extension
extends
implements
inherits
derive
use (trait)

# Visibility
public
private
protected
static
final
abstract

# Types/Annotations
interface
trait
struct
enum
@
#[
```

## 🔄 Extension Strategy

### 1. Language Detection by Extension
```bash
function detect_language_from_extension() {
    local file="$1"
    local ext="${file##*.}"

    case "$ext" in
        js|mjs|cjs|jsx) echo "javascript" ;;
        ts|tsx) echo "typescript" ;;
        py|pyw) echo "python" ;;
        java) echo "java" ;;
        go) echo "go" ;;
        rs) echo "rust" ;;
        php) echo "php" ;;
        rb) echo "ruby" ;;
        cpp|cc|cxx|c|h|hpp) echo "cpp" ;;
        cs) echo "csharp" ;;
        *) echo "unknown" ;;
    esac
}
```

### 2. Generic Import Resolution
```bash
function resolve_generic_import() {
    local import_path="$1"
    local current_file="$2"
    local base_dir=$(dirname "$current_file")

    # Try relative import first
    if [[ "$import_path" =~ ^\. ]]; then
        # Relative path
        realpath "$base_dir/$import_path" 2>/dev/null
    else
        # Search by filename
        find . -name "$(basename "$import_path")*" -type f | head -1
    fi
}
```

## 📤 Output Format

### Generic structure

```markdown
# Code Search Results

**Query**: [keyword]
**Technologies Detected**: [auto-detected list]
**Files Indexed**: X

## 📄 `path/to/file.ext`

**Classes** (X):
  - `ClassName` (lines 15-145): 130 lines
    - Extends: `ParentClass`
    - Implements: `InterfaceA, InterfaceB`
    - Methods: 8

**Interfaces** (X):
  - `InterfaceName` (lines 5-20): 15 lines
    - Methods: `method1()`, `method2()`, `method3()`

**Traits/Structs** (X):
  - `TraitName` (line 25)

**Functions** (X):
  - `functionName(param1, param2): returnType` (line 42)
  - `anotherFunction(arg): void` (line 67)

**Dependencies** (X):
  - `package/module/path` (line 3)
  - `relative/import/path` (line 5)
  - `@framework/component` (line 7)

---

## 📄 `path/to/another/file.ext`

[Same structure...]

---

## 🔗 Relationships Graph

```mermaid
graph TD
    fileA[path/to/file.ext] -->|imports| fileB[path/to/another.ext]
    fileA -->|extends| fileC[path/base.ext]
    fileD[path/impl.ext] -->|implements| fileE[path/interface.ext]
```

**Summary**: X relationships detected

## 📊 Statistics

- **Total Files Scanned**: X
- **Relevant Matches**: Y
- **Classes**: A
- **Interfaces**: B
- **Functions**: C
- **Dependencies**: D
- **Relationships**: E

---
*Generated by agent-aikido-explore-code using plan-generic.md*
```

## 🧠 Context Extraction

### Classes
```markdown
- **Name**: Full class name
- **Line Range**: Start-end lines (ex: lines 15-145)
- **Length**: Number of lines
- **Extends**: Parent class name (if any)
- **Implements**: Comma-separated interfaces (if any)
- **Traits/Mixins**: Traits used (if applicable)
- **Methods**: Count of methods (NOT full code)
- **Properties**: Count of properties (NOT full list)
```

### Interfaces
```markdown
- **Name**: Interface name
- **Line Range**: Start-end lines
- **Length**: Number of lines
- **Extends**: Parent interfaces (if any)
- **Methods**: List of method signatures (name + params), max 5
```

### Functions
```markdown
- **Signature**: Full signature with parameters and return type
- **Line**: Line number
- **Parameters**: Parameter names (NOT full code)
- **Return Type**: Return type if available
```

### Dependencies
```markdown
- **Import Path**: Full import/require path
- **Line**: Line number where import occurs
- **Type**: import|require|use|include
```

## ⚡ Performance Optimization

### Optimized multi-language commands
```bash
# Ultra-fast search with ripgrep
rg -i "$KEYWORD" \
  --type-add 'source:*.{js,ts,py,java,go,rs,php,rb}' \
  --type source \
  --glob '!node_modules' \
  --glob '!vendor' \
  --glob '!dist' \
  --glob '!build'

# Find all classes (multi-language)
rg -n "^(class|interface|struct)\s+(\w+)" -r '$2' --no-heading

# Find imports (multi-language)
rg -n "^(import|require|use|from)\s+" --no-heading

# Statistics per file
rg -c -i "$KEYWORD" | sort -t: -k2 -nr | head -20
```

### Optimization Strategies
1. **Early filtering** : Exclude directories from the start with find
2. **Pattern grouping** : Group similar patterns into a single grep
3. **Limit results** : Max 100 files per search (configurable)
4. **Cache .gitignore** : Parse .gitignore once, apply everywhere

## 📋 Usage Example

```bash
# Example usage of the generic plan
KEYWORD="authenticate"

# Phase 1: Auto-detect technologies
TECHS=$(detect_project_technologies)
echo "Technologies detected: $TECHS"

# Phase 2: Discovery with auto-detected extensions
FILES=$(rg --files --type-add 'source:*.{js,ts,py,java,go,rs,php,rb}' --type source)
echo "Files found: $(echo "$FILES" | wc -l)"

# Phase 3: Search with context
RESULTS=$(rg -i -n -A 3 -B 1 "$KEYWORD" --type-add 'source:*.{js,ts,py,java,go,rs,php,rb}' --type source)

# Phase 4: Extract metadata by language
for file in $FILES; do
    LANG=$(detect_language_from_extension "$file")

    # Extract classes (generic pattern)
    CLASSES=$(grep -n "^class\s" "$file" 2>/dev/null)

    # Extract functions (generic pattern)
    FUNCTIONS=$(grep -n "^function\s" "$file" 2>/dev/null)

    # Extract imports (generic pattern)
    IMPORTS=$(grep -n "^import\s" "$file" 2>/dev/null)

    # Format output
    echo "## 📄 \`$file\`"
    echo ""
    echo "**Classes**: $(echo "$CLASSES" | wc -l)"
    echo "**Functions**: $(echo "$FUNCTIONS" | wc -l)"
    echo "**Dependencies**: $(echo "$IMPORTS" | wc -l)"
    echo ""
done
```

## 🎓 Technology Detection

Auto-detection of technologies present in the project:

```bash
function detect_project_technologies() {
    local techs=()

    # JavaScript/TypeScript
    [[ -f "package.json" ]] && techs+=("javascript")
    [[ -f "tsconfig.json" ]] && techs+=("typescript")

    # Python
    [[ -f "requirements.txt" ]] && techs+=("python")
    [[ -f "setup.py" ]] && techs+=("python")

    # Java
    [[ -f "pom.xml" ]] && techs+=("java")
    [[ -f "build.gradle" ]] && techs+=("java")

    # Go
    [[ -f "go.mod" ]] && techs+=("go")

    # Rust
    [[ -f "Cargo.toml" ]] && techs+=("rust")

    # PHP
    [[ -f "composer.json" ]] && techs+=("php")

    # Ruby
    [[ -f "Gemfile" ]] && techs+=("ruby")

    # C/C++
    [[ -f "CMakeLists.txt" ]] && techs+=("cpp")
    [[ -f "Makefile" ]] && techs+=("c")

    echo "${techs[@]}"
}
```

## 🔧 Customization Points

This plan can be extended/customized via:
- **File patterns** : Add specific extensions
- **Exclusions** : Adapt according to project structure
- **Regex patterns** : Refine for specific syntaxes
- **Output format** : Customize level of detail
- **Performance tuning** : Adjust limits and parallelism

---
*Generic plan created on 2025-12-09 for agent-aikido-explore-code*
*Used as fallback for technologies without a specific plan*
