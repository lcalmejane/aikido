---
description: "Validate the structure and coherence of a code search plan against agent-aikido-explore-code requirements"
globs: prompts/hard_points/system/search/plans/**/*.md
---

# /validate-search-plan

**Purpose**: Validate a code search plan to ensure it meets `agent-aikido-explore-code` requirements and the standards documented in `prompts/hard_points/system/search/plans/README.md`.

---

## Usage

[MANDATORY]
/validate-search-plan

## Prerequisites

- A code search plan file exists in `prompts/hard_points/system/search/plans/`
- `prompts/hard_points/system/search/plans/README.md` is available as reference
- `prompts/hard_points/agents/agent-aikido-explore-code.md` is available

## Steps

### 1. Ask the User Which Plan to Validate

Ask the user which plan they want to validate.

**Options**:
- Auto-list available plans in `prompts/hard_points/system/search/plans/`
- Possible paths:
  - `plan-generic.md` (fallback)
  - `php/plan.md`
  - `javascript/plan.md`
  - `python/plan.md`
  - `java/plan.md`
  - etc.
- Or a custom path provided by the user

**Question to ask**:
```
Which code search plan do you want to validate?

Available plans:
1. plan-generic.md (Universal fallback)
2. php/plan.md (Generic PHP)
3. javascript/plan.md (JavaScript/TypeScript)
4. [other plans detected automatically]

Enter the number or full path of the plan:
```

### 2. Load the Plan and README

```bash
# Load the selected plan
PLAN_PATH="prompts/hard_points/system/search/plans/$USER_SELECTION"
PLAN_CONTENT=$(cat "$PLAN_PATH")

# Load the reference README
README_PATH="prompts/hard_points/system/search/plans/README.md"
README_CONTENT=$(cat "$README_PATH")

# Load the agent to verify requirements
AGENT_PATH="prompts/hard_points/agents/agent-aikido-explore-code.md"
AGENT_CONTENT=$(cat "$AGENT_PATH")
```

### 3. Validate Mandatory Sections

Check that all mandatory sections are present.

**Sections checklist** (per README.md):

- [ ] **Header**: Metadata (Version, Date, Type, Language)
- [ ] **Overview**: Plan description and use cases
- [ ] **File Patterns**: Priority extensions and exclusions
- [ ] **Search Method**: Search type (naive, semantic, ast-based)
- [ ] **Search Patterns**: Regex for imports, declarations, keywords
- [ ] **Extension Strategy**: How to follow dependencies
- [ ] **Output Format**: Output template with examples
- [ ] **Context Extraction**: Metadata to extract per type
- [ ] **Performance Optimization**: Optimized commands
- [ ] **Usage Example**: Concrete usage example

**Validation**:
```bash
# Check each section
MISSING_SECTIONS=()

for section in "Overview" "File Patterns" "Search Method" "Search Patterns" \
                "Extension Strategy" "Output Format" "Context Extraction" \
                "Performance Optimization" "Usage Example"; do
    if ! grep -q "## .*$section" "$PLAN_PATH"; then
        MISSING_SECTIONS+=("$section")
    fi
done

# Report missing sections
if [[ ${#MISSING_SECTIONS[@]} -gt 0 ]]; then
    echo "❌ Missing sections: ${MISSING_SECTIONS[@]}"
fi
```

### 4. Validate Regex Patterns

Check that regex patterns are well-formed.

**Tests**:
- Import/dependency patterns present
- Declaration patterns (classes, functions, interfaces) present
- Valid regex syntax (no compilation errors)
- Appropriate capture groups

```bash
# Extract regex patterns from the plan
IMPORT_PATTERNS=$(sed -n '/### .*Imports/,/###/p' "$PLAN_PATH" | grep -E "^\^")
DECLARATION_PATTERNS=$(sed -n '/### .*Declarations/,/###/p' "$PLAN_PATH" | grep -E "^\^")

# Check that there is at least 1 pattern of each type
[[ -z "$IMPORT_PATTERNS" ]] && echo "⚠️  No import pattern found"
[[ -z "$DECLARATION_PATTERNS" ]] && echo "⚠️  No declaration pattern found"

# Test pattern syntax (using grep -E to validate regex)
while IFS= read -r pattern; do
    if ! echo "test" | grep -E "$pattern" &>/dev/null && ! echo "" | grep -E "$pattern" &>/dev/null; then
        echo "✅ Valid pattern: $pattern"
    fi
done <<< "$IMPORT_PATTERNS"
```

### 5. Validate Output Format

Check that the plan defines an output format coherent with the agent.

**Agent requirements** (per agent-aikido-explore-code.md):
- Structured metadata by type (Classes, Interfaces, Functions, Dependencies)
- Location with line numbers (line ranges)
- NO full code, signatures only
- Compact format (~50 lines max per file)

**Validation**:
```bash
# Check that the Output Format section exists and contains examples
if grep -q "## 📤 Output Format" "$PLAN_PATH"; then
    # Extract the output example
    OUTPUT_EXAMPLE=$(sed -n '/## 📤 Output Format/,/## /p' "$PLAN_PATH")

    # Check presence of key categories
    for category in "Classes" "Interfaces" "Functions" "Dependencies"; do
        if echo "$OUTPUT_EXAMPLE" | grep -q "\*\*$category\*\*"; then
            echo "✅ Category '$category' present in output format"
        else
            echo "⚠️  Category '$category' missing from output format"
        fi
    done

    # Check that the example shows line numbers
    if echo "$OUTPUT_EXAMPLE" | grep -q "(line[s]* [0-9]"; then
        echo "✅ Line numbers present in output format"
    else
        echo "⚠️  Line numbers missing from output format"
    fi
else
    echo "❌ Section 'Output Format' missing"
fi
```

### 6. Validate Coherence with README

Check that the plan follows the template documented in README.md.

**README template checklist**:
- [ ] Section structure conforms to template
- [ ] Header metadata present (Version, Date, Type, Language)
- [ ] File extensions defined
- [ ] Standard exclusions defined
- [ ] At least one usage example provided

```bash
# Check header metadata
if head -5 "$PLAN_PATH" | grep -q "Version:.*Date:.*Type:"; then
    echo "✅ Header metadata present"
else
    echo "⚠️  Header metadata incomplete"
fi

# Check usage example
if grep -q "## 📋 Usage Example" "$PLAN_PATH"; then
    echo "✅ Usage Example section present"
else
    echo "⚠️  Usage Example section missing"
fi
```

### 7. Validate Agent Compatibility

Check that the plan is compatible with agent expectations.

**Agent requirements**:
- Plan must be parsable (sections detectable via sed/grep)
- FILE_PATTERNS extractable
- EXCLUSIONS extractable
- IMPORT_PATTERNS and DECLARATION_PATTERNS extractable
- OUTPUT_TEMPLATE extractable

**Parsing test**:
```bash
# Simulate agent parsing (Phase 1)
echo "🔍 Parsing test (agent Phase 1 simulation)..."

# Extract file patterns
FILE_PATTERNS=$(sed -n '/## 🔍 File Patterns/,/## 🎯/p' "$PLAN_PATH" | grep -E "^\*\." | tr '\n' ' ')
if [[ -n "$FILE_PATTERNS" ]]; then
    echo "✅ FILE_PATTERNS extractable: $FILE_PATTERNS"
else
    echo "❌ FILE_PATTERNS not extractable"
fi

# Extract exclusions
EXCLUSIONS=$(sed -n '/### Exclusions/,/##/p' "$PLAN_PATH" | grep -E "^[a-zA-Z_]" | sed 's#/$##')
if [[ -n "$EXCLUSIONS" ]]; then
    echo "✅ EXCLUSIONS extractable: $(echo "$EXCLUSIONS" | wc -l) exclusions"
else
    echo "❌ EXCLUSIONS not extractable"
fi

# Extract search method
SEARCH_METHOD=$(grep -A2 "## 🎯 Search Method" "$PLAN_PATH" | tail -1)
if [[ -n "$SEARCH_METHOD" ]]; then
    echo "✅ SEARCH_METHOD extractable: $SEARCH_METHOD"
else
    echo "❌ SEARCH_METHOD not extractable"
fi
```

### 8. Functional Tests (Optional)

If the user wants, run functional tests on a real project.

**Tests**:
- Apply regex patterns to sample files
- Verify file extensions are recognized
- Test import resolution (if function provided)

```bash
# Ask the user whether to run functional tests
echo ""
echo "Do you want to run functional tests on a real project? (y/n)"
read -r RUN_FUNCTIONAL_TESTS

if [[ "$RUN_FUNCTIONAL_TESTS" == "y" ]]; then
    echo "Enter the path to the test project:"
    read -r TEST_PROJECT_PATH

    # Test file discovery
    echo "🧪 Testing file discovery..."
    DISCOVERED_FILES=$(find "$TEST_PROJECT_PATH" -type f \
      $(echo "$FILE_PATTERNS" | sed 's/\*\./\-name "\*\./g;s/ /" -o /g') 2>/dev/null | wc -l)
    echo "   Files found: $DISCOVERED_FILES"

    # Test pattern matching
    echo "🧪 Testing pattern matching..."
    TEST_KEYWORD="class"
    MATCHES=$(grep -r "$TEST_KEYWORD" "$TEST_PROJECT_PATH" --include="$FILE_PATTERNS" 2>/dev/null | wc -l)
    echo "   Matches for '$TEST_KEYWORD': $MATCHES"
fi
```

## Output

Generate a complete validation report:

```markdown
# Validation Report - {plan_name}

**Date**: {date}
**Plan**: {plan_path}
**Validated against**: agent-aikido-explore-code requirements

## ✅ Passed Validations

- [x] Mandatory sections present (X/10)
- [x] Valid regex patterns
- [x] Compliant output format
- [x] Complete header metadata
- [x] Agent-compatible parsing

## ⚠️  Warnings

- Category 'Interfaces' missing from output format
- Section 'Performance Optimization' empty

## ❌ Critical Errors

- Section 'Extension Strategy' missing
- No declaration pattern found

## 💡 Recommendations

1. Add 'Extension Strategy' section with resolve_import_path() function
2. Complete declaration patterns for interfaces and traits
3. Enrich 'Performance Optimization' section with rg/grep examples
4. Add output example for 'Interfaces' category

## 📈 Global Score

**Score**: 75/100

**Detail**:
- Mandatory sections: 8/10 (80%)
- Regex patterns: 6/8 (75%)
- Output format: 7/10 (70%)
- README coherence: 9/10 (90%)
- Agent compatibility: 7/10 (70%)

## 🎯 Final Status

⚠️  **IMPROVEMENTS REQUIRED** - The plan requires corrections before production use.

---
*Report generated by /validate-search-plan on {date}*
```

## Notes

**Useful commands**:

```bash
# List all available plans
find prompts/hard_points/system/search/plans -name "plan.md" -o -name "plan-*.md"

# Compare two plans
diff prompts/hard_points/system/search/plans/php/plan.md \
     prompts/hard_points/system/search/plans/javascript/plan.md

# Extract all regex patterns from a plan
grep -E "^\^" prompts/hard_points/system/search/plans/php/plan.md

# Test a regex pattern
echo "use App\Models\User;" | grep -E "^use\s+([\w\\]+)"
```

**Validation criteria summary**:

Mandatory (blocking):
- [ ] Header with metadata (Version, Date, Type)
- [ ] "File Patterns" section with extensions
- [ ] "Search Method" section with type
- [ ] "Search Patterns" section with at least imports and declarations
- [ ] "Output Format" section with structured example
- [ ] Patterns extractable by the agent (sed/grep)

Recommended (warnings):
- [ ] "Extension Strategy" section with import resolution
- [ ] "Context Extraction" section detailed by type
- [ ] "Performance Optimization" section with commands
- [ ] "Usage Example" section with concrete case
- [ ] Output format includes all categories (classes, interfaces, functions, deps)
- [ ] Line numbers present in output format

Optional (bonus):
- [ ] "Framework-Specific Patterns" section (if applicable)
- [ ] Functional tests passed on real project
- [ ] Multiple regex pattern examples
- [ ] Edge cases and limitations documented

---

**Workflow**: Ask for plan → Load plan + README + agent → Validate sections → Validate patterns → Validate output format → Validate coherence → Validate agent compatibility → Functional tests (opt) → Generate report

**Important**: This command does NOT modify the plan — it generates a validation report with recommendations only.
