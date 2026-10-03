---
description: "Create a new code search plan for agent-aikido-explore-code by guiding the user through the process"
globs: prompts/hard_points/system/search/plans/README.md, prompts/hard_points/agents/agent-aikido-explore-code.md
---

# /create-search-plan

**Purpose**: Create a new code search plan for `agent-aikido-explore-code` following the template and requirements documented in `prompts/hard_points/system/search/plans/README.md`.

---

## Usage

```
/create-search-plan
```

## Prerequisites

- `prompts/hard_points/system/search/plans/README.md` must exist and contain the plan template
- `prompts/hard_points/agents/agent-aikido-explore-code.md` must exist

## Steps

### Step 1: Load the Reference README

```bash
# Load README for template and guidelines
README_PATH="prompts/hard_points/system/search/plans/README.md"
README_CONTENT=$(cat "$README_PATH")

# Extract the plan template
TEMPLATE=$(sed -n '/### 2\. Template de Plan/,/### 3\. Checklist/p' "$README_PATH")

# Load agent to understand requirements
AGENT_PATH="prompts/hard_points/agents/agent-aikido-explore-code.md"
AGENT_CONTENT=$(cat "$AGENT_PATH")
```

### Step 2: Interactive Questionnaire

Ask the user a series of questions to determine the plan to create.

#### Question 1: Target Technology

```
For which technology/language do you want to create a search plan?

Examples:
- python (Generic Python)
- java (Generic Java)
- go (Generic Go)
- rust (Generic Rust)
- ruby (Generic Ruby)
- csharp (Generic C#)
- typescript (TypeScript-specific, if different from JavaScript)
- kotlin (Kotlin)
- swift (Swift)
- other (specify)

Target technology:
```

**Store**: `TECH_NAME` (e.g. "python")

#### Question 2: Specificity Level

```
What level of specificity for this plan?

1. Generic (for any version of {TECH_NAME})
2. Version-specific (e.g. Python 3.11, PHP 8, Java 17)
3. Framework-specific (e.g. Django for Python, Spring for Java)

Choose (1/2/3):
```

**Store**: `SPECIFICITY_LEVEL`

#### Question 2a: If Version-specific

```
Which version of {TECH_NAME}?

Examples: 3.11, 8, 17, 2.0

Version:
```

**Store**: `TECH_VERSION` (e.g. "3.11")

#### Question 2b: If Framework-specific

```
Which {TECH_NAME} framework?

Examples:
- Python: django, flask, fastapi
- Java: spring, hibernate
- JavaScript: react, vue, angular (if not already in javascript/plan.md)

Framework:
```

**Store**: `FRAMEWORK_NAME` (e.g. "django")

#### Question 3: Search Type

```
What search type will this plan use?

1. naive (grep-based, simple regex patterns) - RECOMMENDED
2. semantic (semantic understanding, requires parsing)
3. ast-based (AST analysis, requires specific parser)

Most plans use 'naive' as it is the fastest and most reliable.

Choose (1/2/3) [default: 1]:
```

**Store**: `SEARCH_METHOD` (default: "naive")

#### Question 4: File Extensions

```
Which file extensions for {TECH_NAME}?

Enter extensions separated by spaces (with or without *.)
Examples:
- Python: *.py *.pyw *.pyx
- Java: *.java *.class
- Go: *.go
- Rust: *.rs
- Ruby: *.rb *.rake

Extensions [{auto_suggestions}]:
```

**Store**: `FILE_EXTENSIONS`

**Auto-suggestions based on tech**:
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

#### Question 5: Directories to Exclude

```
Which directories should be excluded (in addition to standard ones)?

Standard (always excluded): node_modules, vendor, dist, build, .git

Additional exclusions for {TECH_NAME} (separated by spaces):
Examples:
- Python: __pycache__ *.egg-info .venv venv
- Java: target out
- Ruby: .bundle

Exclusions [{auto_suggestions}]:
```

**Store**: `ADDITIONAL_EXCLUSIONS`

**Auto-suggestions**:
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

### Step 3: Generation — Directory Structure

Create the directory structure and plan file:

```bash
# Determine plan path based on specificity
BASE_PATH="prompts/hard_points/system/search/plans"

case "$SPECIFICITY_LEVEL" in
    1) # Generic
        PLAN_PATH="$BASE_PATH/$TECH_NAME/plan.md"
        ;;
    2) # Version-specific
        PLAN_PATH="$BASE_PATH/$TECH_NAME/$TECH_VERSION/plan.md"
        ;;
    3) # Framework-specific
        PLAN_PATH="$BASE_PATH/$TECH_NAME/$FRAMEWORK_NAME/plan.md"
        ;;
esac

# Create parent directory
mkdir -p "$(dirname "$PLAN_PATH")"

echo "Plan will be created at: $PLAN_PATH"
```

### Step 4: Generation — Plan Content

Generate the complete plan content using the template and user answers:

```markdown
# {TECH_NAME_TITLE} Code Search Plan

> **Version**: 1.0 | **Date**: {DATE} | **Type**: Search Plan | **Language**: {TECH_NAME_TITLE}

## Overview

Specialized search plan for {TECH_NAME_TITLE} projects. [Description to complete based on technology]

{TECH_SPECIFIC_DESCRIPTION}

## File Patterns

### Priority Extensions
\`\`\`bash
{FILE_EXTENSIONS}
\`\`\`

### Configuration & Dependencies
\`\`\`bash
{TECH_CONFIG_FILES}
\`\`\`

### Standard Exclusions
\`\`\`bash
# Directories to ignore (respect .gitignore)
node_modules/
vendor/
dist/
build/
out/
target/
.git/
.svn/
{ADDITIONAL_EXCLUSIONS}

# Binary files
*.bin *.exe *.dll *.so *.dylib
*.jpg *.jpeg *.png *.gif *.ico *.svg
*.pdf *.zip *.tar *.gz
\`\`\`

## Search Method

**Type**: \`{SEARCH_METHOD}\`

{SEARCH_METHOD_DESCRIPTION}

### Phase 1: {TECH_NAME_TITLE} Discovery
\`\`\`bash
# Find all {TECH_NAME_TITLE} files
find . -type f \
  \( {FIND_PATTERNS} \) \
  -not -path "*/node_modules/*" \
  -not -path "*/vendor/*" \
  -not -path "*/.git/*" \
  {EXCLUSION_PATHS} \
  2>/dev/null
\`\`\`

### Phase 2: Keyword Search
\`\`\`bash
# Keyword search with context
grep -rn --include="{FILE_PATTERNS}" \
  --exclude-dir={EXCLUSIONS_LIST} \
  -i "$KEYWORD" .
\`\`\`

## Search Patterns

### 1. {TECH_NAME_TITLE} Imports/Dependencies
\`\`\`regex
{IMPORT_PATTERNS}
\`\`\`

### 2. Declarations (Classes, Interfaces, Functions)
\`\`\`regex
{DECLARATION_PATTERNS}
\`\`\`

### 3. Methods/Functions
\`\`\`regex
{FUNCTION_PATTERNS}
\`\`\`

### 4. Technology-specific Keywords
\`\`\`text
{TECH_SPECIFIC_KEYWORDS}
\`\`\`

## Extension Strategy

### Import Resolution
\`\`\`bash
# Resolve import/require to file
function resolve_{TECH_NAME}_import() {
    local import_path="$1"
    local current_file="$2"
    local base_dir=$(dirname "$current_file")

    {IMPORT_RESOLUTION_LOGIC}
}
\`\`\`

## Output Format

### {TECH_NAME_TITLE}-specific Structure

\`\`\`markdown
# {TECH_NAME_TITLE} Code Index

**Query**: [keyword]
**Framework**: [{FRAMEWORK_IF_ANY}]
**Files Indexed**: X

## \`{EXAMPLE_FILE_PATH}\`

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

## Context Extraction — {TECH_NAME_TITLE}

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

## Performance Optimization

### Optimized {TECH_NAME_TITLE} Commands
\`\`\`bash
# Ultra-fast search with ripgrep
rg --type {RG_TYPE} \
  --glob '!{EXCLUSIONS}' \
  -i "$KEYWORD"

# Find all classes
rg --type {RG_TYPE} -n "{CLASS_PATTERN}" -r '$1' --no-heading

# Find imports
rg --type {RG_TYPE} -n "{IMPORT_PATTERN}" --no-heading

# Statistics per file
rg --type {RG_TYPE} -c -i "$KEYWORD" | sort -t: -k2 -nr | head -20
\`\`\`

## Usage Example

\`\`\`bash
# Example usage of the {TECH_NAME_TITLE} plan
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
# [Generate markdown output using template above]
\`\`\`

---
*{TECH_NAME_TITLE} plan created on {DATE} for agent-aikido-explore-code*
*Auto-generated by /create-search-plan*
```

### Step 5: Intelligent Pre-fill

Pre-fill sections with default values based on technology.

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

### Step 6: Confirmation and Creation

Display a summary and ask for confirmation:

```
Plan Creation Summary

**Technology**: {TECH_NAME_TITLE}
**Specificity**: {SPECIFICITY_LEVEL_TEXT}
**Path**: {PLAN_PATH}
**Extensions**: {FILE_EXTENSIONS}
**Additional Exclusions**: {ADDITIONAL_EXCLUSIONS}
**Search Method**: {SEARCH_METHOD}

The plan will be pre-filled with standard patterns for {TECH_NAME_TITLE}.
You can customize it after creation.

Create this plan now? (y/n):
```

If confirmed:

```bash
# Write the file
echo "$PLAN_CONTENT" > "$PLAN_PATH"

echo "Plan created successfully: $PLAN_PATH"
echo ""
echo "Next steps:"
echo "1. Customize regex patterns to your needs"
echo "2. Complete TODO sections"
echo "3. Add specific examples"
echo "4. Validate with: /validate-search-plan"
echo ""
echo "To edit the plan:"
echo "  \$EDITOR $PLAN_PATH"
```

### Step 7: Automatic Post-Creation Validation

Automatically validate the created plan:

```bash
echo "Running automatic validation of the created plan..."
echo ""

# Call /validate-search-plan on the created plan
# (Simulate or actually run the command)

echo "Automatic validation complete"
echo "Review the report above for suggested improvements."
```

### Step 8: Open in Editor (Optional)

Ask whether the user wants to open the plan in an editor:

```
Do you want to open the plan in your editor for customization? (y/n):
```

If yes:

```bash
# Detect editor (EDITOR env var or default)
EDITOR="${EDITOR:-nano}"

# Open the file
$EDITOR "$PLAN_PATH"
```

## Output

A fully generated plan file at the computed path under `prompts/hard_points/system/search/plans/`, pre-filled with technology-specific patterns, and automatically validated. A post-creation checklist is displayed.

## Notes

### Templates by Technology

Pre-configured templates are available for each supported technology:

| Technology | Config Files | Import Pattern | Class Pattern | Status |
|------------|--------------|----------------|---------------|--------|
| **Python** | requirements.txt, setup.py | `^import`, `^from` | `^class`, `^def` | Ready |
| **Java** | pom.xml, build.gradle | `^import\s+([\w\.]+);` | `^class\s+(\w+)` | Ready |
| **Go** | go.mod | `^import\s+"(.*?)"` | `^type\s+(\w+)\s+struct` | Ready |
| **Rust** | Cargo.toml | `^use\s+(.*?);` | `^pub\s+struct\s+(\w+)` | Ready |
| **Ruby** | Gemfile | `^require\s+['"]` | `^class\s+(\w+)` | Ready |
| **C#** | *.csproj | `^using\s+([\w\.]+);` | `^class\s+(\w+)` | TODO |
| **Kotlin** | build.gradle.kts | `^import\s+([\w\.]+)` | `^class\s+(\w+)` | TODO |
| **Swift** | Package.swift | `^import\s+(\w+)` | `^class\s+(\w+)` | TODO |

### Advanced Options

**Expert Mode (Skip Questions)** — Create a plan quickly with command-line arguments:

```bash
# Usage: /create-search-plan --tech=python --level=generic --method=naive
# Creates automatically with default values
```

**Clone an Existing Plan** — Create a new plan based on an existing one:

```bash
# Usage: /create-search-plan --clone=php/plan.md --tech=hack
# Clones php/plan.md and adapts it for the Hack language
```

### Post-Creation Checklist (Automatic)

Display at the end of creation:

```markdown
## Post-Creation Checklist

- [x] Plan created at {PLAN_PATH}
- [x] Metadata header present
- [x] Mandatory sections generated
- [ ] Regex patterns customized (TODO: refine as needed)
- [ ] Import resolution function completed (TODO)
- [ ] Output examples enriched (TODO)
- [ ] Functional tests on a real project (TODO)
- [ ] Validation passed (see report above)

**Next Actions**:
1. Customize regex patterns in the "Search Patterns" section
2. Complete the resolve_{TECH_NAME}_import() function
3. Add examples specific to your codebase
4. Test with /validate-search-plan
5. Run functional tests on a {TECH_NAME} project
```

---

**Workflow**: Load README -> Interactive questionnaire (tech, level, method, extensions, exclusions) -> Generate structure -> Pre-fill content -> Confirm creation -> Write file -> Auto-validate -> Open editor (optional)

**Important**: The created plan contains TODOs and requires customization, but is immediately usable with standard patterns.
