---
description: "Interactive compilation of specialized AI-KIDO agents with user questionnaire"
---

# /compile-agent-from-use

**Purpose**: Interactively compile a specialized AI-KIDO agent by collecting user inputs to determine the compilation mode, then automatically assemble the knowledge base with SEMVER versioning.

---

## Usage

/compile-agent-from-use

## Prerequisites

- AI-KIDO Memory Bank initialized at `/prompts/`
- At least one of the following available: existing agent in `/out/agents/`, command in `prompts/hard_points/commands/`, or use-case in `/prompts/gen/use_cases/`

## Steps

### Step 1: Initial question (NO SCAN)

Ask **Question 1: Compilation mode** directly WITHOUT analyzing any files:

```
Hello! I will help you compile a customized AI-KIDO agent.

Select the compilation mode:

1. Existing case - Start from an already compiled agent to modify it
2. Command - Analyze an existing command to create the agent
3. Use-case - Create from a specific AI-KIDO use case
4. Manual - Full manual configuration

Enter your choice (1-4):
```

### Step 2: Targeted analysis AFTER the choice

**If choice = 1 (Existing case)**:
ONLY NOW analyze `/out/agents/index.md` and ask:

```
Analyzing existing agents...

Available agents:
[List found agents with format:]
- agent-[name]-v[version].md : [short description]

Select the base agent (type the name) or 'new' to create a different agent:
```

**If choice = 2 (Command)**:
ONLY NOW list `prompts/hard_points/commands/` and ask:

```
Analyzing available commands...

Commands found in prompts/hard_points/commands/:
[List .md files found with format:]
- [command-name].md : [first line if accessible]

Select the command to analyze (type the name without .md):
```

**If choice = 3 (Use-case)**:
ONLY NOW list `/prompts/gen/use_cases/` and ask:

```
Analyzing available use cases...

Use-cases found in /prompts/gen/use_cases/:
[List .md files found with format:]
- [usecase-name].md : [first line if accessible]

Select the use case (type the name without .md) or 'browse' to explore subdirectories:
```

**If choice = 4 (Manual)**:
Ask the following questions directly WITHOUT analyzing any files:

```
Manual configuration step by step:

Question A - Agent name:
Enter the name of your agent (e.g.: diplomator, analyzer, hr-consultant):

Question B - Specialization:
Describe the specialization of this agent (e.g.: diplomatic negotiation, technical analysis, HR management):

Question C - Required personas:
Which personas should be integrated? (separate with commas)
Or type 'auto' for automatic selection based on the specialization:

Question D - Specific techniques (optional):
Are there particular techniques to integrate? (type 'auto' for automatic selection or list them):
```

### Step 3: Persona analysis (if needed)

ONLY IF the user requests the list of available personas or chooses 'auto', THEN analyze `/prompts/gen/personas/` to propose options.

Ask **Question 2: Validation of choices**:

```
Summary of your selection:

Mode: [chosen mode]
Base: [selected element]
[Specific details depending on the mode]

Do you confirm this configuration? (yes/no)
If no, return to question 1.
```

### Step 4: Automatic compilation process

Once choices are validated, launch automatically:

#### Phase 1: Targeted analysis and information collection

**USE AGENT** `agent-aikido-explore-bank` for intelligent extraction:

```markdown
AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

Agent prompt:
"Extract the information needed to compile the AI-KIDO agent according to the following configuration:

User configuration:
- Mode: [chosen mode: existing case / command / use-case / manual]
- Base: [selected element]
- Specialization: [requested specialization]
- Required personas: [list or 'auto']
- Techniques: [list or 'auto']

Information to extract from the Memory Bank:
1. Hard Points: Immutable constraints from /prompts/hard_points/ai-kido.md
2. Personas: Full descriptions from /prompts/gen/personas/ (per list or auto-selection)
3. Techniques: Relevant methods from /prompts/gen/techniques/ (per specialization context)
4. Use-Cases: Targeted use cases from /prompts/gen/use_cases/ (if relevant)
5. Concepts: Core concepts from /prompts/gen/concepts/ (if needed)

Intelligent auto-selection (if 'auto'):
- Negotiation/Diplomacy -> HR + Management + Communication personas
- Technical Analysis -> Architect + Developer + Security personas
- Project Management -> Management + QA + DevOps personas
- Training/Pedagogy -> HR + Communication + Quality personas

For each extracted element, return:
- Full content optimized for compilation
- Source (file)
- Relevance to the specialization (HIGH/MEDIUM/LOW)

Return a structured JSON or Markdown report with all extracted elements, organized by category."

Expected result: Complete package of elements needed for compilation
```

Display in real time:

```
TARGETED ANALYSIS IN PROGRESS (agent-aikido-explore-bank)...

- Extracting hard points from /prompts/hard_points/ai-kido.md
- Collecting selected personas (auto-selection or user list)
- Retrieving relevant techniques (per specialization)
- Integrating targeted use-cases (per context)
- Validating consistency of collected elements
- Compilation package ready
```

Agent advantages:
- Intelligent multi-source extraction
- Persona auto-selection based on specialization
- Targeted collection (no exhaustive scan)
- Gain: ~60% tokens vs manual reading

#### Phase 2: Advanced semantic optimization

Display in real time:

```
OPTIMIZATION IN PROGRESS...

- Maximum density: Elimination of redundancies and semantic duplicates
- Intelligent prioritization: Reorganization by importance/frequency
- Semantic compression: Merging similar concepts without loss
- Oral validation: Pronunciation and fluency testing
- Terminological consistency: Vocabulary unification
- History removal: Elimination of non-operational elements
```

#### Phase 3: SEMVER version calculation

Display in real time:

```
VERSIONING IN PROGRESS...

- Checking existing agents in /out/agents/
- Differential analysis with previous version (if applicable)
- Automatic change classification
- Version calculation per strict SEMVER rules
- Nomenclature generation: agent-[usage]-vX.Y.Z.md
```

#### Phase 4: Validation and quality control

**USE AGENT** `agent-aikido-validator` for compliance validation:

```markdown
AGENT: agent-aikido-validator
FORMAT: JSON

Agent prompt:
"Validate the compiled agent against AI-KIDO rules before finalization.

File to validate: /out/agents/agent-[usage]-v[X.Y.Z].md (temporary)

Compliance validation specific to compiled agents:
1. Rule 4: Line constraints (<=500 lines for compiled agents)
2. Rule 11: Maximum semantic density (elimination of redundancies)
3. Hard Points: Absolute and immutable compliance
4. Persona completeness: All declared personas are integrated
5. Consistent techniques: No contradictory techniques
6. Format: Formatted text template (not raw markdown)
7. Functional tests: Validation on typical use cases

For each detected violation, return:
- Violation + affected line
- Severity (CRITICAL/MAJOR/MINOR)
- Actionable quick fix

Generate compliance score:
- Line constraints: pass/fail (X/500 lines)
- Semantic density: [PERCENTAGE]%
- Hard points validated: X/X
- Persona completeness: pass/fail
- Format: pass/fail
- Global score: [PERCENTAGE]%

Optimized mode: <3k tokens."

Expected result: Compliance score + any violations with quick fixes
```

Display in real time:

```
VALIDATION IN PROGRESS (agent-aikido-validator)...

- Hard points compliance: Absolute and immutable validation
- Format: Formatted text template (non-markdown)
- Persona completeness: Validation of consultants with techniques
- Optimal limit: Respect of 500 lines max with maximum density
- Functional tests: Validation on typical use cases
- Compliance score: [X]%
```

Agent advantages:
- Systematic AI-KIDO compliance validation
- Immediate compliance score
- Violation detection before finalization
- Quick fixes if issues detected

**If score < 90%**: Display violations and propose automatic corrections before Phase 5.
**If score >= 90%**: Continue to Phase 5 (Finalization).

#### Phase 5: Generation and finalization

Display in real time:

```
FINALIZATION IN PROGRESS...

- Generating file /out/agents/agent-[usage]-vX.Y.Z.md
- Automatic update of /out/agents/index.md
- Creating report /out/agents/reports/[usage]-vX.Y.Z-report.md
- Traceability logs with detailed timestamps
- Archiving previous version (if applicable)
```

## Output

### Compiled agent standard structure

```markdown
# Agent [Usage] - Version [X.Y.Z]

## Configuration
- **Specialization**: [Domain of expertise]
- **Integrated Personas**: [List of consultants]
- **Applied Techniques**: [Methods used]
- **Validated Hard Points**: [Validated constraints]

## Optimized System Prompt
[Unified and optimized prompt]

## Consultant Personas

### [Persona 1]
[Condensed description and expertise]

### [Persona 2]
[Condensed description and expertise]

### [Persona 3]
[Condensed description and expertise]

## Advanced Techniques
[Integrated reformulation and persuasion methods]

## Operational Workflow
[Step-by-step process for the use case]

## Typical Use Cases
[Concrete application examples]

## Validation and Metrics
- **Semantic density**: [Score]%
- **Terminological consistency**: [Score]%
- **Oral fluency**: [Score]%
- **Functional completeness**: [Score]%

---
*Agent compiled on [timestamp] from AI-KIDO v[version]*
```

### Final success message

```
Agent [usage] v[X.Y.Z] compiled successfully!

Files created/modified:
- /out/agents/agent-[usage]-v[X.Y.Z].md (compiled agent)
- /out/agents/index.md (updated index)
- /out/agents/reports/[usage]-v[X.Y.Z]-report.md (detailed report)

Final metrics:
- Size: [X] lines (limit 500)
- Semantic density: [X]%
- Integrated personas: [X]
- Applied techniques: [X]
- Validated hard points: [X]/[X]

Status: READY for autonomous deployment

Suggested next steps:
- Test the agent with real use cases
- Collect user feedback for the next version
- Use /update-agent [usage] for future improvements
```

## Notes

### Error handling

**User input errors**:
- Invalid choice: Re-ask with valid options
- Non-existent file: Propose available alternatives
- Incomplete configuration: Guide toward missing input

**Compilation errors**:
- Hard Points violated: Stop with detailed explanation
- Missing personas: Propose automatic creation
- 500-line limit exceeded: Forced optimization or alert
- Incompatible techniques: Automatic resolution or user choice

**Standard error messages**:

```
ERROR: [Error type]

Detail: [Clear explanation of the problem]
Solution: [Recommended action]

Do you want to:
1. Retry with automatic correction
2. Modify your selection
3. Cancel the compilation
```

### Token optimization strategy

**Core rule**: Never analyze files before the user has made their choices.

**Optimized sequence**:
1. Initial question -> NO file scan
2. User choice -> Analyze ONLY the relevant directories
3. Specific selection -> Read ONLY the chosen files
4. Compilation -> Process ONLY the necessary content

### Automatic persona selection (if 'auto' chosen)

Based on the requested specialization, automatically select:
- **Negotiation/Diplomacy** -> HR Consultant + Management Expert + Communication Specialist
- **Technical Analysis** -> Architect + Developer + Security Expert
- **Project Management** -> Management Expert + QA Engineer + DevOps Engineer
- **Training/Pedagogy** -> HR Consultant + Communication Specialist + Quality Expert

### Intelligent content collection (compilation phase only)

Handled by `agent-aikido-explore-bank` (Phase 1), which automatically manages:
1. Mandatory traversal of `/prompts/index.md` (AI-KIDO entry point)
2. Hard Points extraction from `/prompts/hard_points/ai-kido.md` (immutable constraints)
3. Persona reading from `/prompts/gen/personas/[chosen].md` (per selection or auto)
4. Technique collection from `/prompts/gen/techniques/` (if relevant to context)
5. Use-case integration from `/prompts/gen/use_cases/[chosen].md` (if selected)

Token savings: Targeted reading of only the necessary files, no exhaustive scan.

### Automatic optimization

- **Duplicate removal**: Elimination of redundant content
- **Semantic compression**: Merging of similar concepts
- **Prioritization**: Reorganization by importance
- **Oral validation**: Pronunciation testing
- **Standardization**: Terminological unification

### AI-KIDO agents used

This command optimizes the compilation of specialized agents using **2 AI-KIDO agents**:

**Phase 1: `agent-aikido-explore-bank` (DEEP MODE)**
- Role: Intelligent extraction of needed elements (hard-points, personas, techniques, use-cases)
- Output: Complete compilation package with relevance score for each element
- Tokens: ~25-40k (DEEP mode, depending on complexity)
- Gain: ~60% tokens vs manual multi-file reading
- Auto-selection: Intelligent persona selection based on specialization if 'auto' mode

**Phase 4: `agent-aikido-validator`**
- Role: AI-KIDO compliance validation of the compiled agent before finalization
- Output: Compliance score with any violations and quick fixes
- Tokens: <3k
- Gain: Quality guarantee + early violation detection
- Validations: Line constraints, semantic density, hard points, completeness, format

**Optimization gains summary**:

| Aspect | Before (manual) | After (agents) | Gain |
|--------|-----------------|----------------|------|
| Persona/technique extraction | Manual multi-file reading | agent-explore-bank auto | ~60% tokens |
| Persona auto-selection | Manual by user | agent-explore-bank intelligent | Automated |
| Compliance validation | Manual or absent | agent-validator systematic | +Quality guarantee |
| Violation detection | Post-finalization | Phase 4 pre-finalization | Early correction |
| Global workflow | ~80k tokens | ~45k tokens | ~45% efficiency |
