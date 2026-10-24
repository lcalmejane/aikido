---
description: "Validate the structure and coherence of an analysis plan against /analyse-project requirements"
globs: prompts/hard_points/system/analyse/plans/**/*.md
---

# /validate-analyse-plan

**Purpose**: Validate an analysis plan to ensure it meets all `/analyse-project` requirements and standards documented in `prompts/hard_points/system/analyse/plans/README.md`.

---

## Usage

[MANDATORY]
/validate-analyse-plan

## Prerequisites

- An analysis plan file located under `prompts/hard_points/system/analyse/plans/`
- `prompts/hard_points/system/analyse/plans/README.md` present as reference
- `prompts/hard_points/commands/analyse-project.md` present for compatibility checks

## Steps

### Step 1. Identify the Plan to Validate

Ask the user which plan to validate.

**Options**:
- Auto-list of available plans in `prompts/hard_points/system/analyse/plans/`
- Possible paths:
  - `plan-overview.md`, `plan-standard.md`, `plan-deep.md`, `plan-expert.md` (generic fallbacks)
  - `architectural/c1/plan-*.md`
  - `technical/backend/plan-*.md`
  - `functional/use-cases/plan-*.md`
  - `methodological/devops/plan-*.md`
  - etc.
- Or a custom path provided by the user

**Question to ask**:
```
Which analysis plan do you want to validate?

Available plans:
[Auto-generated list from find]

Examples:
1. plan-standard.md (Generic fallback depth 2)
2. architectural/c1/plan-standard.md (C1 Standard specific)
3. technical/backend/plan-deep.md (Backend Deep)

Enter the number or full path of the plan:
```

### Step 2. Load the Plan and Reference Files

```bash
# Load the selected plan
PLAN_PATH="prompts/hard_points/system/analyse/plans/$USER_SELECTION"
PLAN_CONTENT=$(cat "$PLAN_PATH")

# Load the reference README
README_PATH="prompts/hard_points/system/analyse/plans/README.md"
README_CONTENT=$(cat "$README_PATH")

# Load analyse-project command to check compatibility
COMMAND_PATH="prompts/hard_points/commands/analyse-project.md"
COMMAND_CONTENT=$(cat "$COMMAND_PATH")
```

### Step 3. Validate the Header (Metadata)

Verify the presence and validity of the metadata header.

**Expected format** (per README.md line 196):
```markdown
> **Version**: X.Y | **Date**: YYYY-MM-DD | **Type**: Analysis Plan | **Nature**: {CATEGORY}/{SUB_TYPE} | **Depth**: {1-4} - {NAME}
```

**Header checklist**:
- [ ] **Version**: Format X.Y present
- [ ] **Date**: Format YYYY-MM-DD present and valid
- [ ] **Type**: "Analysis Plan" present
- [ ] **Nature**: Category/sub-type consistent with file path
- [ ] **Depth**: Level 1-4 + name (overview/standard/deep/expert)

**Validation**:
```bash
# Extract header (typically line 3)
HEADER=$(sed -n '3p' "$PLAN_PATH")

# Check each component
if echo "$HEADER" | grep -q "Version.*Date.*Type.*Nature.*Depth"; then
    echo "✅ Metadata header complete"

    # Extract values
    VERSION=$(echo "$HEADER" | grep -oP 'Version:\s*\K[0-9]+\.[0-9]+')
    DATE=$(echo "$HEADER" | grep -oP 'Date:\s*\K[0-9]{4}-[0-9]{2}-[0-9]{2}')
    NATURE=$(echo "$HEADER" | grep -oP 'Nature:\s*\K[a-zA-Z/\-]+')
    DEPTH=$(echo "$HEADER" | grep -oP 'Depth:\s*\K[0-9]')

    echo "  Version: $VERSION"
    echo "  Date: $DATE"
    echo "  Nature: $NATURE"
    echo "  Depth: $DEPTH"

    # Check nature consistency with path
    if echo "$PLAN_PATH" | grep -q "$NATURE"; then
        echo "✅ Nature consistent with file path"
    else
        echo "⚠️  Nature '$NATURE' does not match path '$PLAN_PATH'"
    fi
else
    echo "❌ Metadata header incomplete or malformed"
fi
```

### Step 4. Validate Mandatory Sections

Check that all mandatory sections are present.

**Section checklist** (per README.md template lines 193-420):

- [ ] **Overview**: Plan description and use cases
- [ ] **Selection Criteria**: When to use this plan
- [ ] **Sources to Analyze**: Priority code/docs/config
- [ ] **AI-KIDO Agents to Mobilize**: Agent orchestration with prompts
- [ ] **Extraction Strategy**: Algorithms and detection patterns
- [ ] **Full Workflow**: Mermaid diagram of phases
- [ ] **Output Format**: Structured output template

**Validation**:
```bash
# Check each section
MISSING_SECTIONS=()

for section in "Overview" "Selection Criteria" "Sources to Analyze" \
                "AI-KIDO Agents to Mobilize" "Extraction Strategy" \
                "Full Workflow" "Output Format"; do
    if ! grep -qi "## .*$section" "$PLAN_PATH"; then
        MISSING_SECTIONS+=("$section")
    fi
done

# Report missing sections
if [[ ${#MISSING_SECTIONS[@]} -gt 0 ]]; then
    echo "❌ Mandatory sections missing: ${MISSING_SECTIONS[@]}"
else
    echo "✅ All mandatory sections present (7/7)"
fi
```

### Step 5. Validate the "Selection Criteria" Section

Verify the plan clearly defines when it must be used.

**Requirements** (per template lines 204-214):
- Analysis nature (number 1-18 + description)
- Analysis depth (1-4 + description)
- Ideal context
- Differences vs other plans (generic, lower/higher depths)

**Validation**:
```bash
# Extract Selection Criteria section
CRITERIA=$(sed -n '/## 🎯 Selection Criteria/,/## /p' "$PLAN_PATH")

if echo "$CRITERIA" | grep -q "Nature.*:"; then
    echo "✅ Criterion 'Nature' present"
else
    echo "⚠️  Criterion 'Nature' missing"
fi

if echo "$CRITERIA" | grep -q "Depth.*:"; then
    echo "✅ Criterion 'Depth' present"
else
    echo "⚠️  Criterion 'Depth' missing"
fi

if echo "$CRITERIA" | grep -qi "vs.*plan"; then
    echo "✅ Comparisons with other plans present"
else
    echo "⚠️  Comparisons with other plans missing"
fi
```

### Step 6. Validate the "Sources to Analyze" Section

Verify that priority sources are defined.

**Requirements** (per template lines 216-236):
- Source code: Directories + Extensions + Exclusions
- Documentation: Files + Priority sections
- Configuration: Files + Key parameters
- Filtering criteria

**Validation**:
```bash
# Extract Sources section
SOURCES=$(sed -n '/## 🔍 Sources to Analyze/,/## 🤖/p' "$PLAN_PATH")

# Check subsections
for subsection in "Source Code" "Documentation" "Configuration"; do
    if echo "$SOURCES" | grep -qi "\*\*$subsection\*\*"; then
        echo "✅ Subsection '$subsection' present"
    else
        echo "⚠️  Subsection '$subsection' missing"
    fi
done

# Check presence of at least one file extension
if echo "$SOURCES" | grep -qE "(\*\.[a-z]{2,4}|Extensions)"; then
    echo "✅ File extensions defined"
else
    echo "⚠️  No file extensions found"
fi

# Check presence of exclusions
if echo "$SOURCES" | grep -qi "exclusion"; then
    echo "✅ Exclusions defined"
else
    echo "⚠️  Exclusions not defined"
fi
```

### Step 7. Validate Agent Orchestration

Verify that AI-KIDO agents are correctly defined.

**Requirements** (per template lines 238-285):
- Phase 3.1: `agent-aikido-explore-code` (MANDATORY)
- Phase 3.2: `agent-aikido-explore-all` (optional, condition defined)
- Conflict resolution: `agent-aikido-truth-evaluator` (optional)
- RACI classification: `agent-aikido-raci-delegator` (optional)
- Population: `agent-aikido-bank-populate` (optional)
- Final validation: `agent-aikido-validator` (MANDATORY)

**Validation**:
```bash
# Extract Agents section
AGENTS=$(sed -n '/## 🤖 AI-KIDO Agents to Mobilize/,/## 📊/p' "$PLAN_PATH")

# Check mandatory agents
if echo "$AGENTS" | grep -q "agent-aikido-explore-code"; then
    echo "✅ Mandatory agent 'explore-code' present"
else
    echo "❌ Mandatory agent 'explore-code' MISSING"
fi

if echo "$AGENTS" | grep -q "agent-aikido-validator"; then
    echo "✅ Mandatory agent 'validator' present"
else
    echo "❌ Mandatory agent 'validator' MISSING"
fi

# Check presence of prompts for each agent
AGENT_COUNT=$(echo "$AGENTS" | grep -c '^\*\*Agent\*\*.*:')
PROMPT_COUNT=$(echo "$AGENTS" | grep -c '\*\*Specialized prompt\*\*')

echo "  Agents defined: $AGENT_COUNT"
echo "  Prompts provided: $PROMPT_COUNT"

if [[ $AGENT_COUNT -eq $PROMPT_COUNT ]]; then
    echo "✅ All agents have a specialized prompt"
else
    echo "⚠️  Some agents are missing a specialized prompt ($PROMPT_COUNT/$AGENT_COUNT)"
fi
```

### Step 8. Validate the Extraction Strategy

Verify that the extraction strategy is defined.

**Requirements** (per template lines 286-317):
- Automatic detection: Algorithm + Patterns + Heuristics
- Metadata extraction: Architecture + Stack + Domain + Config
- Depth-specific analysis: Detail level + Metrics + Estimated time

**Validation**:
```bash
# Extract Strategy section
STRATEGY=$(sed -n '/## 📊 Extraction Strategy/,/## 🔄/p' "$PLAN_PATH")

# Check automatic detection
if echo "$STRATEGY" | grep -qi "detection"; then
    echo "✅ 'Automatic Detection' section present"
else
    echo "⚠️  'Automatic Detection' section missing"
fi

# Check metadata extraction
for metadata in "Architecture" "Tech Stack" "Domain" "Configuration"; do
    if echo "$STRATEGY" | grep -qi "$metadata"; then
        echo "✅ Metadata '$metadata' covered"
    else
        echo "⚠️  Metadata '$metadata' not mentioned"
    fi
done

# Check estimated execution time
if echo "$STRATEGY" | grep -qiE "estimated.*time|duration"; then
    echo "✅ Estimated execution time present"
else
    echo "⚠️  Estimated execution time missing"
fi
```

### Step 9. Validate the Workflow (Mermaid Diagram)

Verify the presence and coherence of the workflow.

**Requirements** (per template lines 318-360):
- Complete Mermaid diagram
- Clearly defined execution phases
- Agents styled in purple (style fill:#f9f)
- Conditions and logical branches

**Validation**:
```bash
# Extract Workflow section
WORKFLOW=$(sed -n '/## 🔄 Full Workflow/,/## 📤/p' "$PLAN_PATH")

# Check for Mermaid diagram
if echo "$WORKFLOW" | grep -q '```mermaid'; then
    echo "✅ Mermaid diagram present"

    # Extract the diagram
    MERMAID=$(sed -n '/```mermaid/,/```/p' "$PLAN_PATH")

    # Check styled agents
    STYLED_AGENTS=$(echo "$MERMAID" | grep -c 'style.*fill:#f9f')
    echo "  Styled agents: $STYLED_AGENTS"

    # Check end node
    if echo "$MERMAID" | grep -q 'fill:#9f9'; then
        echo "✅ End node correctly styled (green)"
    else
        echo "⚠️  End node not styled in green"
    fi
else
    echo "❌ Mermaid diagram MISSING"
fi

# Check estimated execution time
if echo "$WORKFLOW" | grep -qiE "[0-9]+ *min"; then
    TIME_ESTIMATE=$(echo "$WORKFLOW" | grep -oiE "[0-9]+-[0-9]+ min" | head -1)
    echo "✅ Estimated execution time: $TIME_ESTIMATE"
else
    echo "⚠️  Estimated execution time missing"
fi
```

### Step 10. Validate the Output Format

Verify that the output template is defined.

**Requirements** (per template lines 369-420):
- Markdown report structure
- Main sections: Configuration + Results + Technical Details + Gaps + Enrichments + Compliance
- Metadata: Date, Duration, Analyzed sources
- Footer with reference to the plan used

**Validation**:
```bash
# Extract Output Format section
OUTPUT=$(sed -n '/## 📤 Output Format/,/##/p' "$PLAN_PATH")

if echo "$OUTPUT" | grep -q '```markdown'; then
    echo "✅ Markdown output template present"

    # Check key sections in template
    for section in "Configuration" "Results" "Technical Details" \
                   "Gaps" "Enrichments" "Compliance"; do
        if echo "$OUTPUT" | grep -qi "$section"; then
            echo "✅ Section '$section' in template"
        else
            echo "⚠️  Section '$section' missing from template"
        fi
    done
else
    echo "❌ Markdown output template MISSING"
fi
```

### Step 11. Validate Coherence with README

Verify that the plan follows the template documented in README.md.

**README template checklist**:
- [ ] Section structure matches template
- [ ] Analysis nature in selection criteria
- [ ] Analysis depth in selection criteria
- [ ] Mandatory agents present (explore-code, validator)
- [ ] Full workflow with Mermaid
- [ ] Output format defined

```bash
# Compare plan structure vs README template
echo "🔍 Checking coherence with README.md..."

# Verify the plan follows the resolution algorithm
# (per README.md lines 86-147)
PLAN_BASENAME=$(basename "$PLAN_PATH")
PLAN_DIRNAME=$(dirname "$PLAN_PATH" | sed 's#.*/plans/##')

if [[ "$PLAN_BASENAME" =~ ^plan-(overview|standard|deep|expert)\.md$ ]]; then
    echo "✅ Filename matches expected pattern (fallback or specific)"
else
    echo "⚠️  Filename does not match pattern: $PLAN_BASENAME"
fi

# Check depth consistency between filename and header
DEPTH_FILE=$(echo "$PLAN_BASENAME" | grep -oE "(overview|standard|deep|expert)")
if [[ -n "$DEPTH" ]]; then
    if echo "$PLAN_CONTENT" | head -5 | grep -qi "$DEPTH_FILE"; then
        echo "✅ Filename depth consistent with header"
    else
        echo "⚠️  Depth inconsistency between filename and header"
    fi
fi
```

### Step 12. Validate Compatibility with /analyse-project

Verify the plan is compatible with the analyse-project command.

**Parsing test**:
```bash
# Simulate /analyse-project parsing (Phase 1.5)
echo "🔍 Parsing test (simulating /analyse-project Phase 1.5)..."

# Verify the plan is findable by the resolution algorithm
# (Logic per README.md lines 86-147)

# Extract nature number from header if format "Nature: X - Description"
NATURE_NUM=$(echo "$HEADER" | grep -oP 'Nature:\s*\K[0-9]+' || echo "")

if [[ -n "$NATURE_NUM" ]]; then
    echo "✅ Numeric nature extractable: $NATURE_NUM"
else
    echo "⚠️  Numeric nature not extractable from header"
fi

# Check readability of key sections by /analyse-project
echo "Checking extractability of key sections..."

# Test explore-code prompt extraction
EXPLORE_CODE_PROMPT=$(sed -n '/### Phase 3.1.*Code Scan/,/^$/p' "$PLAN_PATH" | \
                      sed -n '/```/,/```/p' | sed '1d;$d')

if [[ -n "$EXPLORE_CODE_PROMPT" ]]; then
    echo "✅ explore-code prompt extractable"
else
    echo "⚠️  explore-code prompt not extractable or empty"
fi
```

### Step 13. Functional Tests (Optional)

If the user requests it, test the plan against a real project.

**Question**:
```
Do you want to run a functional test of the plan on a real project? (y/n)
```

If yes:
```bash
# Ask for test project path
echo "Enter the path to the test project:"
read -r TEST_PROJECT_PATH

if [[ ! -d "$TEST_PROJECT_PATH" ]]; then
    echo "❌ Project not found: $TEST_PROJECT_PATH"
    exit 1
fi

echo "🧪 Functional test on project: $TEST_PROJECT_PATH"
echo ""

# Test 1: Verify that defined sources exist
echo "Test 1: Checking priority sources..."
SOURCE_DIRS=$(echo "$SOURCES" | grep -oE "Directories.*:" -A5 | grep -oE "[a-zA-Z_/]+/" | head -3)

for dir in $SOURCE_DIRS; do
    if [[ -d "$TEST_PROJECT_PATH/$dir" ]]; then
        echo "  ✅ Directory found: $dir"
    else
        echo "  ⚠️  Directory not found: $dir"
    fi
done

# Test 2: Verify files with defined extensions
echo ""
echo "Test 2: Checking file extensions..."
FILE_EXTS=$(echo "$SOURCES" | grep -oE "\*\.[a-z]{2,4}" | head -3)

for ext in $FILE_EXTS; do
    COUNT=$(find "$TEST_PROJECT_PATH" -name "$ext" 2>/dev/null | wc -l)
    echo "  Files $ext found: $COUNT"
done

# Test 3: Simulate extraction with patterns (if regex patterns are defined)
echo ""
echo "Test 3: Testing detection patterns..."
if echo "$STRATEGY" | grep -q '```regex'; then
    PATTERNS=$(sed -n '/```regex/,/```/p' "$PLAN_PATH" | sed '1d;$d' | head -3)
    echo "  Patterns extracted: $(echo "$PATTERNS" | wc -l)"
else
    echo "  ⚠️  No regex patterns found in plan"
fi
```

## Output

Generate a complete validation report in `/prompts/spec/`:

```bash
# Define report path
REPORT_PATH="prompts/spec/validate-analyse-plan-report-$(date +%Y%m%d-%H%M%S).md"
PLAN_NAME=$(basename "$PLAN_PATH" .md)
PLAN_CATEGORY=$(dirname "$PLAN_PATH" | sed 's#.*/plans/##')

# Compile scores
TOTAL_CHECKS=13
PASSED_CHECKS=0
WARNING_CHECKS=0
FAILED_CHECKS=0

# (Increment during validation)

# Calculate global score
SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

# Generate report
cat > "$REPORT_PATH" <<EOF
# Validation Report - $PLAN_NAME

**Date**: $(date +%Y-%m-%d\ %H:%M:%S)
**Plan**: \`$PLAN_PATH\`
**Category**: $PLAN_CATEGORY
**Validated by**: /validate-analyse-plan v1.0

---

## ✅ Passed Validations ($PASSED_CHECKS/$TOTAL_CHECKS)

$(list_passed_validations)

## ⚠️  Warnings ($WARNING_CHECKS)

$(list_warnings)

## ❌ Critical Errors ($FAILED_CHECKS)

$(list_errors)

## 💡 Recommendations

$(generate_recommendations)

## 📈 Global Score

**Score**: $SCORE/100

**Breakdown**:
- Metadata header: $(check_header_score)/10 ($(calc_percentage))%
- Mandatory sections: $(check_sections_score)/15 ($(calc_percentage))%
- Selection criteria: $(check_criteria_score)/10 ($(calc_percentage))%
- Priority sources: $(check_sources_score)/10 ($(calc_percentage))%
- Agent orchestration: $(check_agents_score)/20 ($(calc_percentage))%
- Extraction strategy: $(check_strategy_score)/10 ($(calc_percentage))%
- Mermaid workflow: $(check_workflow_score)/10 ($(calc_percentage))%
- Output format: $(check_output_score)/10 ($(calc_percentage))%
- README coherence: $(check_readme_score)/10 ($(calc_percentage))%
- /analyse-project compatibility: $(check_compat_score)/5 ($(calc_percentage))%

## 🎯 Final Status

$(determine_final_status)

---
*Report generated by /validate-analyse-plan on $(date +%Y-%m-%d)*
*Plan path: \`$PLAN_PATH\`*
*Reference README: \`prompts/hard_points/system/analyse/plans/README.md\`*
EOF

echo ""
echo "✅ Validation report generated: $REPORT_PATH"
```

**Final status function template**:
```bash
determine_final_status() {
    if [[ $SCORE -ge 90 && $FAILED_CHECKS -eq 0 ]]; then
        echo "✅ **COMPLIANT** - The plan is ready for production use."
    elif [[ $SCORE -ge 70 && $FAILED_CHECKS -eq 0 ]]; then
        echo "⚠️  **IMPROVEMENTS RECOMMENDED** - The plan works but could be optimized."
    elif [[ $FAILED_CHECKS -gt 0 && $FAILED_CHECKS -le 2 ]]; then
        echo "⚠️  **CORRECTIONS REQUIRED** - Fix critical errors before use."
    else
        echo "❌ **NON-COMPLIANT** - The plan requires major corrections."
    fi
}
```

## Notes

### Useful Commands

```bash
# List all available plans
find prompts/hard_points/system/analyse/plans -name "plan-*.md" | sort

# Compare two plans
diff prompts/hard_points/system/analyse/plans/plan-standard.md \
     prompts/hard_points/system/analyse/plans/architectural/c1/plan-standard.md

# Extract all agents from a plan
grep -E "agent-aikido-[a-z-]+" prompts/hard_points/system/analyse/plans/plan-standard.md

# Check plan size (constraint: recommended ≤500 lines)
wc -l prompts/hard_points/system/analyse/plans/plan-standard.md
```

### Validation Criteria Summary

**Mandatory (blocking)**:
- [ ] Header with metadata (Version, Date, Type, Nature, Depth)
- [ ] "Overview" section with description
- [ ] "Selection Criteria" section complete
- [ ] "Sources to Analyze" section with code/docs/config
- [ ] "AI-KIDO Agents to Mobilize" section with explore-code and validator
- [ ] "Extraction Strategy" section defined
- [ ] "Full Workflow" section with Mermaid diagram
- [ ] "Output Format" section with markdown template
- [ ] Mandatory agents present (explore-code, validator)
- [ ] Specialized prompts for each agent

**Recommended (warnings)**:
- [ ] Nature consistent with file path
- [ ] Depth consistent between filename and header
- [ ] Comparisons with other plans ("vs Generic Plan", etc.)
- [ ] Complete source subsections (Code + Documentation + Configuration)
- [ ] File extensions defined
- [ ] Exclusions defined
- [ ] All agents have a specialized prompt
- [ ] Complete extraction metadata (Architecture, Stack, Domain, Config)
- [ ] Estimated execution time
- [ ] Mermaid diagram with styled agents (purple) and end node (green)
- [ ] Output template with all sections (Configuration, Results, Details, Gaps, Enrichments, Compliance)
- [ ] Footer with plan reference

**Optional (bonus)**:
- [ ] Sections adapted to specific analysis type
- [ ] Functional tests passed on real project
- [ ] Regex patterns for automatic detection
- [ ] Detailed heuristics
- [ ] Concrete output examples
- [ ] Documentation of edge cases/limits
- [ ] Performance metrics

### AI-KIDO Agents Used

This command uses **0-1 AI-KIDO agents** for simple and efficient validation.

**Phases 1-12**: Structure and coherence validation via bash/grep
- **Advantages**: Fast (<1s), lightweight (<100 tokens), precise
- **Methods**: sed, grep, regex pattern testing
- **Output**: Binary checks (✅ / ⚠️  / ❌)

**Final Phase (Optional)**: `agent-aikido-validator`

**Condition**: Complementary validation requested by user

**Prompt**:
```
"Validate AI-KIDO compliance of the analysis plan.

File: $PLAN_PATH
Type: Analysis plan for /analyse-project

Complementary validations:
1. Global AI-KIDO compliance (recommended ≤500 lines for plans)
2. Internal/external link quality
3. Overall document coherence
4. Frontmatter/metadata (if present)

Return:
- Status: [✅ COMPLIANT | ⚠️ WARNINGS | ❌ NON-COMPLIANT]
- Violations: [list if applicable]
- Quick fixes: [suggested corrections]

Estimated tokens: ~1-2k"
```

**Total Performance**:
- Tokens used: ~100-2,000 (depending on whether validator is used)
- Estimated time: 1-5 seconds (depending on plan size + optional functional tests)
- Quality: Precise validation with detailed report

### Integration with Other Commands

This command integrates with:

- `/analyse-project`: Consumer of validated plans
- `/create-analyse-plan`: Complementary command (create then validate)
- `/validate-search-plan`: Similar pattern for code search plans
- `/check-claude`: Verify synchronization after plan creation/validation

**Recommended workflow**:
1. `/create-analyse-plan` — Create a new guided plan
2. `/validate-analyse-plan` — Validate the created plan
3. Fix issues according to the validation report
4. `/validate-analyse-plan` — Re-validate after corrections
5. `/analyse-project` (nature X, depth Y) — Use the validated plan
6. Iterate to optimize the plan based on results

### AI-KIDO Rules Respected

- References the main hard point resource (README.md)
- Structure validation conforms to template
- Report generated in /prompts/spec/
- Integration with /analyse-project (consumer)
- Pattern consistent with /validate-search-plan
- Optional validator agent (lightweight validation preferred)
- Standardized Markdown format
- Command ≤1000 lines constraint respected
