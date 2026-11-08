---
name: create-search-plan
description: "Create a new code search plan for agent-aikido-explore-code by guiding the user through the process"
globs: prompts/hard_points/system/search/plans/README.md, prompts/hard_points/agents/agent-aikido-explore-code.md
---

# /create-search-plan

**Purpose**: Create a new code search plan for `agent-aikido-explore-code` following the template and requirements documented in `prompts/hard_points/system/search/plans/README.md`.

Generated plans remain shared Git knowledge and are never converted or moved
automatically. To start private task tracking from a completed supported plan,
offer `/aikido-import-plan` as a separate, user-approved workflow.

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

Read `prompts/hard_points/system/search/plans/README.md` and
`prompts/hard_points/agents/agent-aikido-explore-code.md` with the host's Read
action. Use the README's template section and the agent's current requirements
as authoritative.

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
Suggest extensions by technology: Python (`.py`, `.pyw`, `.pyx`); Java
(`.java`, `.class`, `.jar`); Go (`.go`); Rust (`.rs`); Ruby (`.rb`, `.rake`,
`.gemspec`); C# (`.cs`, `.csx`); Kotlin (`.kt`, `.kts`); Swift (`.swift`).
For other technologies ask the user to provide extensions.

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
Suggest extra exclusions by technology: Python (`__pycache__`, `*.egg-info`,
`.venv`, `venv`); Java (`target`, `out`); Rust (`target`); Ruby (`.bundle`).
Do not add an extra default for Go or other technologies.

### Step 3: Generation — Directory Structure

Create the directory structure and plan file:

Resolve the destination under `prompts/hard_points/system/search/plans/`:
generic plans use `{technology}/plan.md`, version-specific plans use
`{technology}/{version}/plan.md`, and framework-specific plans use
`{technology}/{framework}/plan.md`. Use host directory and file actions, and
never overwrite an existing plan without explicit approval.

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
List directories before searching file patterns; choose relevant roots and
exclude irrelevant directories. Apply
\`prompts/hard_points/system/search/scope-first.md\`, including Git ignore
rules and the exclusions above. Discover files matching {FILE_PATTERNS} only
inside those roots. Report inaccessible paths rather than hiding errors.

### Phase 2: Keyword Search
Search the selected files for the keyword with line numbers and context.
Use Kimono MCP or RTK only when available and permitted; otherwise use the
host's scoped search tools. Do not silently widen the selected roots.

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
# SEARCH_ROOT is one directory selected after scope-first exploration.
# Repeat for each selected root, or use the host's equivalent scoped tools.
rg --type {RG_TYPE} \
  --glob '!{EXCLUSIONS}' \
  -i "$KEYWORD" "$SEARCH_ROOT"

# Find all classes
rg --type {RG_TYPE} -n "{CLASS_PATTERN}" -r '$1' --no-heading "$SEARCH_ROOT"

# Find imports
rg --type {RG_TYPE} -n "{IMPORT_PATTERN}" --no-heading "$SEARCH_ROOT"

# Statistics per file
rg --type {RG_TYPE} -c -i "$KEYWORD" "$SEARCH_ROOT" | sort -t: -k2 -nr | head -20
\`\`\`

## Usage Example

\`\`\`bash
# Example usage of the {TECH_NAME_TITLE} plan
KEYWORD="{EXAMPLE_KEYWORD}"

# Phase 1: Inspect directories and select SEARCH_ROOT before file discovery.
rg --files --type {RG_TYPE} "$SEARCH_ROOT"

# Phase 2: Search with context
rg -i -n -A 3 -B 1 "$KEYWORD" --type {RG_TYPE} "$SEARCH_ROOT"

# Phase 3: Extract imports
rg -n "{IMPORT_PATTERN}" --type {RG_TYPE} "$SEARCH_ROOT"

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
Use Python defaults: configuration files include requirements.txt, setup.py
and pyproject.toml; detect import/from statements, classes, functions and
Python-specific decorators. Resolve dotted imports to module paths ending in
`.py`. Use a representative service module and class only as illustrative
examples; confirm actual project paths before recommending them.

#### Java
Use Java defaults: inspect Maven/Gradle configuration; detect imports,
classes, interfaces, enums, methods and package relationships. Resolve
package-qualified types to corresponding source paths ending in `.java`.
Illustrative paths are not evidence of project structure.

#### Go
Use Go defaults: inspect go.mod/go.sum; detect package/import statements,
types (structs and interfaces), functions, variables and constants. Resolve
imports using the project's module layout rather than assuming GOPATH.
Illustrative paths are not evidence of project structure.

#### Rust
Use Rust defaults: inspect Cargo manifests; detect use/mod declarations,
public structs, traits, enums and functions. Resolve crate paths using actual
module declarations and source files. Illustrative paths are not evidence of
project structure.

#### Ruby
Use Ruby defaults: inspect Gemfile/Gemfile.lock; detect require and
require_relative statements, classes, modules, methods, mixins and
attribute declarations. Resolve imports against actual project paths.
Illustrative paths are not evidence of project structure.

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

After confirmation, create the plan with the host's Write action, without
overwriting an existing file. Report the path and recommend customizing regex patterns, completing
TODO sections, adding examples, and validating with `/validate-search-plan`.
Offer to open the result only when the host exposes an editor action.

### Step 7: Automatic Post-Creation Validation

Automatically validate the created plan:

Run `/validate-search-plan` using the host's native file actions. Report its
actual result; never imply that validation ran when the host cannot execute it.

### Step 8: Open in Editor (Optional)

Ask whether the user wants to open the plan in an editor:

```
Do you want to open the plan in your editor for customization? (y/n):
```

If yes:

If no editor action is exposed, return the path and let the user open it.

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

Example invocation: `/create-search-plan --tech=python --level=generic --method=naive`.

**Clone an Existing Plan** — Create a new plan based on an existing one:

Example clone request: `/create-search-plan --clone=php/plan.md --tech=hack`.

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
