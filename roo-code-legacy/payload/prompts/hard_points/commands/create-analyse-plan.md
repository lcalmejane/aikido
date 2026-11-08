---
description: "Create a new project analysis plan for /analyse-project by guiding the user through the process"
globs: prompts/hard_points/system/analyse/plans/README.md, prompts/hard_points/commands/analyse-project.md
---

# /create-analyse-plan

**Purpose**: Create a new project analysis plan for `/analyse-project` by reading the README template and requirements, asking the user for analysis type and depth, and generating the complete plan structure.

Generated plans remain shared Git knowledge and are never converted or moved
automatically. To start private task tracking from a completed supported plan,
offer `/aikido-import-plan` as a separate, user-approved workflow.

---

## Usage

/create-analyse-plan

## Prerequisites

- `prompts/hard_points/system/analyse/plans/README.md` must exist (template and guidelines)
- `prompts/hard_points/commands/analyse-project.md` must exist (analysis types reference)

## Steps

### Step 1 — Load the Reference README

Read `prompts/hard_points/system/analyse/plans/README.md` and
`prompts/hard_points/commands/analyse-project.md` with the host's Read action.
Extract the plan template from the README's template section and retain the
command's supported analysis types as the authoritative options.

### Step 2 — Interactive Questionnaire

Ask the user a series of questions to determine the plan to create.

#### Question 1 — Analysis Type (Category)

```
For which type of analysis do you want to create a plan?

MAIN CATEGORIES:

1. ARCHITECTURAL (C4 Model)
   - c1 : System context (users, external interactions)
   - c2 : Containers (high-level components, services)
   - c3 : Components (classes, modules, architecture detail)
   - c4 : Code (detailed implementation, code patterns)

2. TECHNICAL (Stack & Infrastructure)
   - stack-general   : Global project technologies
   - backend         : Server stack, APIs, data
   - frontend        : UI, UX, client-side
   - infrastructure  : Deployment, ops, monitoring
   - security        : Authentication, authorization, encryption

3. FUNCTIONAL (Business & Processes)
   - general   : Global business processes
   - domain    : Specific business sector
   - use-cases : Usage scenarios
   - workflows : Operational processes

4. METHODOLOGICAL (Dev Processes)
   - uml2   : Object-oriented modeling
   - rup    : Unified process
   - agile  : Iterative methods
   - devops : Continuous integration

Enter the category and sub-type (e.g. architectural/c1, technical/backend):
```

**Store**: `CATEGORY` (e.g. "architectural"), `SUB_TYPE` (e.g. "c1")

#### Question 2 — Analysis Depth

```
What depth of analysis for this plan?

1. Survey (depth 1)   -- Quick overview (~5-10 min)
   - Identification of main elements
   - Basic mapping
   - No technical details

2. Standard (depth 2) -- Moderate, balanced detail (~10-20 min)
   - Relationship and dependency analysis
   - Issue identification
   - Architectural decision documentation

3. In-depth (depth 3) -- Detailed, exhaustive (~20-40 min)
   - Fine-grained implementation analysis
   - Anti-pattern detection
   - Optimization recommendations

4. Expert (depth 4)   -- Complete audit (~40-60 min)
   - Security and performance audit
   - Refactoring plan
   - ROI recommendations

Choose (1/2/3/4):
```

**Store**: `DEPTH_LEVEL` (1-4), `DEPTH_NAME` (survey/standard/in-depth/expert)

#### Question 3 — AI-KIDO Agents to Activate

```
Which AI-KIDO agents do you want to use in this plan?

Recommended agents for {CATEGORY}/{SUB_TYPE} - Depth {DEPTH_LEVEL}:
- [x] explore-code      (MANDATORY)         -- Automatic source code scan
- [ ] explore-all       (optional depth >=2) -- Parallel Memory Bank + Code search
- [ ] truth-evaluator   (optional depth >=2) -- Contradiction resolution
- [ ] raci-delegator    (if RACI enabled)   -- Document classification
- [ ] bank-populate     (optional depth >=2) -- Automatic gap population
- [x] validator         (MANDATORY)         -- AI-KIDO compliance validation

Default agents: explore-code, validator
Use the recommended configuration? (y/n):
```

**Store**: `AGENTS_LIST` (list of selected agents)

#### Question 4 — Sources to Analyze (Specific)

```
Which sources should be prioritized for this {CATEGORY}/{SUB_TYPE} analysis?

Suggestions based on type:
{SUGGESTIONS_SOURCES}

Customize sources? (y/n)
If yes, enter priority directories (space-separated):
```

**Store**: `PRIORITY_SOURCES` (list of priority paths)

**Auto-suggestions based on type**:
Choose recommended sources from this mapping: architectural/c1 → README,
ARCHITECTURE and docs; architectural/c2 → src and docker-compose; c3 → src,
lib and components; c4 → matching source files; technical/backend → src/api,
src/services and config; frontend → src/components, src/views and src/assets;
infrastructure → docker-compose, .github and terraform; security → src, config
and .env.example; functional → src and docs/business; methodological → docs,
.github and README. For any other type, use src, docs and config.

#### Question 5 — Specific Extraction Strategy

```
Extraction strategy for {CATEGORY}/{SUB_TYPE} - Depth {DEPTH_LEVEL}?

Available strategies:
1. Standard : Full scan with complete metadata
2. Targeted : Focus on specific elements (classes, interfaces, etc.)
3. Patterns : Detection of specific architectural patterns
4. Custom   : Manually define search patterns

Use the recommended standard strategy? (y/n):
```

**Store**: `EXTRACTION_STRATEGY` (standard/targeted/patterns/custom)

### Step 3 — Generate the Structure

Create the directory structure and the plan file.

Resolve the destination as
`prompts/hard_points/system/analyse/plans/{category}/{sub-type}/plan-{depth}.md`
when a subtype is selected, or
`prompts/hard_points/system/analyse/plans/{category}/plan-{depth}.md` otherwise.
Use the host's directory-creation and file actions; do not overwrite an
existing plan.

### Step 4 — Generate Plan Content

Generate the complete plan content using the template and user responses.

```markdown
# Analysis Plan {CATEGORY_TITLE}/{SUB_TYPE_TITLE} - {DEPTH_TITLE}

> **Version**: 1.0 | **Date**: {DATE} | **Type**: Analysis Plan | **Nature**: {CATEGORY}/{SUB_TYPE} | **Depth**: {DEPTH_LEVEL} - {DEPTH_NAME}

## Overview

Specialized analysis plan for **{CATEGORY_TITLE} {SUB_TYPE_TITLE}** at depth **{DEPTH_NAME}**.

{TYPE_SPECIFIC_DESCRIPTION}

**{DEPTH_NAME} philosophy**:
{DEPTH_PHILOSOPHY}

## Selection Criteria

Select this plan when:
- **Nature**: {NATURE_NUMBER} - {NATURE_DESCRIPTION}
- **Depth**: {DEPTH_LEVEL} - {DEPTH_NAME}
- **Context**: {IDEAL_CONTEXT}

**Difference vs other plans**:
- vs Generic plan: {SPECIFIC_ADVANTAGES}
- vs Lower depth: {MORE_DETAIL}
- vs Higher depth: {LESS_COMPLEXITY}

## Sources to Analyze

### Priority Sources

**Source Code**:
- Directories: {PRIORITY_SOURCES_DIRS}
- Extensions: {FILE_EXTENSIONS}
- Exclusions: {EXCLUSIONS}

**Documentation**:
- Files: {DOC_FILES}
- Priority sections: {DOC_SECTIONS}

**Configuration**:
- Files: {CONFIG_FILES}
- Key parameters: {KEY_CONFIGS}

### Filtering Criteria

{FILTERING_CRITERIA}

## AI-KIDO Agents to Activate

### Phase 3.1 - Code Scan (Mandatory)

**Agent**: \`agent-aikido-explore-code\`

**Specialized prompt**:
\`\`\`
"FORMAT: JSON

Analysis {CATEGORY}/{SUB_TYPE} depth {DEPTH_LEVEL}:

FOCUS:
{FOCUS_AREAS}

DETAIL:
{DETAIL_LEVEL}

EXCLUSIONS:
{EXCLUSIONS}

Expected output:
{OUTPUT_FORMAT}"
\`\`\`

### Phase 3.2 - Parallel Search

**Condition**: {EXPLORE_ALL_CONDITION}

**Agent**: \`agent-aikido-explore-all\`

{EXPLORE_ALL_DETAILS}

### Contradiction Resolution

**Condition**: {TRUTH_EVALUATOR_CONDITION}

**Agent**: \`agent-aikido-truth-evaluator\`

**Hierarchy strategy**: {HIERARCHY_STRATEGY}

### RACI Classification

**Condition**: {RACI_CONDITION}

**Agent**: \`agent-aikido-raci-delegator\`

**Mapping**: {RACI_MAPPING}

### Automatic Population

**Condition**: {BANK_POPULATE_CONDITION}

**Agent**: \`agent-aikido-bank-populate\`

**Strategy**: {POPULATE_STRATEGY}

### Final Validation (Mandatory)

**Agent**: \`agent-aikido-validator\`

**Strict rules**:
{VALIDATION_RULES}

## Extraction Strategy

### 1. Automatic Detection

**{DEPTH_NAME} algorithm**:
{DETECTION_ALGORITHM}

**Search patterns**:
\`\`\`regex
{SEARCH_PATTERNS}
\`\`\`

**Heuristics**:
{HEURISTICS}

### 2. Metadata Extraction

**Architecture**: {ARCH_METADATA}
**Technical Stack**: {STACK_METADATA}
**Business Domain**: {DOMAIN_METADATA}
**Configuration**: {CONFIG_METADATA}

### 3. Depth-Specific Analysis

**Depth {DEPTH_LEVEL} - {DEPTH_NAME}**:
- **Detail level**: {DETAIL_LEVEL}
- **Collected metrics**: {METRICS}
- **Generated diagrams**: {DIAGRAMS}
- **Estimated time**: {TIME_ESTIMATE}

## Complete Workflow

### Execution Phases

\`\`\`mermaid
{WORKFLOW_DIAGRAM}
\`\`\`

### Estimated Execution Time

{TIME_BREAKDOWN}

**Total**: {TOTAL_TIME}

## Output Format

### Output Structure

\`\`\`markdown
{OUTPUT_TEMPLATE}
\`\`\`

## Ideal Use Cases

The {CATEGORY}/{SUB_TYPE} plan at depth {DEPTH_NAME} is ideal for:
{USE_CASES}

## References

- **Lower depth plan**: {LOWER_DEPTH_PLAN}
- **Higher depth plan**: {HIGHER_DEPTH_PLAN}
- **Generic plan**: \`plan-{DEPTH_NAME}.md\`
- **Agents**: {AGENTS_USED}
- **Command**: \`prompts/hard_points/commands/analyse-project.md\`
- **AI-KIDO documentation**: \`prompts/hard_points/ai-kido.md\`

---
*{CATEGORY_TITLE}/{SUB_TYPE_TITLE} plan created on {DATE} for /analyse-project*
*Auto-generated by /create-analyse-plan*
```

### Step 5 — Intelligent Pre-fill

Pre-fill sections with default values based on the analysis type.

#### Architectural C1 (System Context)

Use focus areas of users and external actors, integrations, system boundaries
and high-level interactions. Search for external URLs, integration/API terms
and user/actor/role/persona terms. Require a context diagram, actor and
external-system lists, and main interfaces in the output.

#### Technical Backend

Use focus areas of APIs/endpoints, service logic, data access and backend
dependencies. Search route declarations, service classes/interfaces and data
queries with host search tools. Require endpoints and methods, a service
architecture diagram, data models and the backend stack.

#### Functional Use Cases

Use focus areas of usage scenarios, implemented processes, business rules and
workflows. Search use-case/scenario/workflow, validation and user-flow terms
with host search tools. Require use cases with actors, sequence diagrams,
business rules and detailed workflows.

### Step 6 — Confirmation and Creation

Display a summary and ask for confirmation.

```
Plan Summary

**Analysis type**       : {CATEGORY_TITLE} - {SUB_TYPE_TITLE}
**Depth**               : {DEPTH_LEVEL} - {DEPTH_NAME}
**Path**                : {PLAN_PATH}
**Priority sources**    : {PRIORITY_SOURCES}
**Agents**              : {AGENTS_LIST}
**Extraction strategy** : {EXTRACTION_STRATEGY}

The plan will be pre-filled with standard strategies for {CATEGORY}/{SUB_TYPE}.
You can customize it after creation.

Create this plan now? (y/n):
```

If confirmed:

After confirmation, create the plan with the host's Write action, leaving
existing files untouched.
Report its path and next steps: customize agent prompts and search patterns,
complete planned sections, add type-specific examples, and validate it with
`/analyse-project` at the selected depth. Offer to open it only through a
host-provided editor action.

### Step 7 — README Update (Automatic)

Add the new plan to the list in README.md.

Update the README's Available Plans section with the new plan using the host's
edit action. Preserve unrelated content and do not claim an automated update
script ran.

### Step 8 — Open in Editor (Optional)

Ask the user whether to open the plan in an editor.

```
Do you want to open the plan in your editor for customization? (y/n):
```

If yes, use an editor action explicitly exposed by the host. If none is
available, return the path and let the user open it; never run an editor
command.

## Output

### Templates by Analysis Type

For each supported type, pre-configured templates are available.

| Type | Priority Sources | Focus Areas | Recommended Agents | Status |
|------|-----------------|-------------|-------------------|--------|
| **Architectural C1** | README, ARCHITECTURE.md | Context, actors, integrations | explore-code, validator | Template ready |
| **Architectural C2** | docker-compose, src/ | Containers, services, deployment | explore-code, explore-all, validator | Template ready |
| **Technical Backend** | src/api, src/services | APIs, services, data | explore-code, explore-all, truth-evaluator | Template ready |
| **Technical Frontend** | src/components, src/views | Components, UX, assets | explore-code, validator | Template ready |
| **Functional Use Cases** | src/, docs/business | Scenarios, workflows, rules | explore-code, explore-all | Template ready |
| **Methodological DevOps** | .github, Jenkinsfile | CI/CD, deployment, monitoring | explore-code, validator | Template ready |

### Post-Creation Checklist

```markdown
## Post-Creation Checklist

- [x] Plan created at {PLAN_PATH}
- [x] Metadata header present
- [x] Mandatory sections generated
- [ ] Agent prompts customized (TODO: refine as needed)
- [ ] Search patterns refined (TODO)
- [ ] Output examples enriched (TODO)
- [ ] Functional tests on a real project (TODO)

**Next Actions**:
1. Customize agent prompts in the "AI-KIDO Agents to Activate" section
2. Refine search patterns in the "Extraction Strategy" section
3. Add examples specific to your analysis type
4. Test with /analyse-project (nature {NATURE_NUM}, depth {DEPTH_LEVEL})
5. Validate results and adjust
```

## Notes

- **Advanced options - Expert Mode (Skip Questions)**: create a plan quickly with command-line arguments:
  ```text
  # Usage: /create-analyse-plan --type=architectural/c1 --depth=2
  # Creates automatically with default values
  ```
- **Clone an existing plan**:
  ```text
  # Usage: /create-analyse-plan --clone=architectural/c1/plan-standard.md --target=architectural/c2
  # Clones c1 and adapts it for c2
  ```
- The created plan contains TODOs and requires customization, but is immediately usable with standard strategies.

---

**Workflow summary**:
1. Load README + command
2. Interactive questionnaire (type, depth, agents, sources, strategy)
3. Generate structure
4. Pre-fill content
5. Confirm creation
6. Write file
7. Update README
8. Open editor (optional)
