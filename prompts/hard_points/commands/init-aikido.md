---
description: "Initialize the AI-KIDO Memory Bank with fundamental project elements"
---

# Command: /init-aikido

Initialize the AI-KIDO Memory Bank by creating base files in `/prompts/gen/` per AI-KIDO rules. Does NOT create personas — focuses on fundamental project concepts and techniques.

**Execute DIRECTLY** — do not create bash/shell scripts, do not propose code to run.

---

## Steps

### Phase 0: AI-KIDO Mode Selection [MANDATORY]

Check if AI-KIDO is already initialized by reading `/prompts/index.md`.

**If NOT initialized**, ask **Question 0: AI-KIDO mode**

```
🎯 AI-KIDO INITIALIZATION

Choose AI-KIDO mode:

1. STANDARD mode
   - Full multi-agent structure
   - 6-12 specialized personas
   - 8-15 use cases
   - Full multi-actor RACI
   - Multiple files per domain
   - Recommended for: 4+ person teams, complex projects

2. LIGHT mode
   - Minimal single-agent structure
   - 3-5 personas max
   - 3-5 use cases max
   - Optional RACI (single actor or minimal)
   - Unified files preferred
   - Recommended for: solo/small teams, prototypes, POCs
```

**If ALREADY initialized**: read `/prompts/index.md` to detect current mode (`ai-kido-light.md` → LIGHT, `ai-kido.md` → STANDARD). Display detected mode and continue — do NOT propose mode change (requires explicit migration).

```
ℹ️ AI-KIDO already initialized in [STANDARD/LIGHT] mode
Continuing initialization in [STANDARD/LIGHT] mode...
```

Store for all subsequent phases: `AIKIDO_MODE = [STANDARD|LIGHT]`

### Phase 1: Existing Source Check

Ask **Question 1: Analysis sources**

```
Which sources do you want to analyze to initialize AI-KIDO?

1. Hard-points documents only
2. Existing project sources only (src/, docs/, etc.)
3. Combined analysis: hard-points + project sources
4. Manual initialization (no auto-analysis)
```

- **Choice 1**: Ask for specific hard-points paths (comma-separated) — if empty, auto-scan all hard-points
- **Choice 2**: Scan workspace to detect project sources (src/, docs/, lib/, components/, config/, etc.)
- **Choice 3**: Auto-combine hard-points + project sources
- **Choice 4**: Skip to Phase 3 (manual collection)

#### Auto-Extraction (choices 1, 2 or 3)

Invoke `agent-aikido-explore-bank` (DEEP MODE):

```markdown
🤖 AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

Prompt:
"Extract fundamental information to initialize the AI-KIDO Memory Bank from the following sources:

Sources: [hard-points / project sources / combined per user choice]

Extract:
1. Project context: name, business domain, main objective
2. General architecture: C1 model (users, system, components)
3. Tech stack: frontend, backend, database, infrastructure
4. Business terminology: specific terms and acronyms
5. Constraints: regulatory, technical, temporal
6. Existing patterns: architectural and development

For each piece of information, indicate:
- Source (file/directory)
- Confidence level (HIGH/MEDIUM/LOW)
- Relevant code/documentation sections

Return a structured report in JSON or Markdown format."
```

### Phase 2: Auto-Synthesis Validation (if analysis performed)

Present detected information for validation:

```
📊 AUTO-ANALYSIS SUMMARY:

Detected project context:
- Probable name: [Based on package.json, README, etc.]
- Business domain: [Inferred from found business terms]
- Tech stack: [Detected technologies]
- Architecture: [Identified architectural patterns]

Is this summary correct? (y/n)
If no, which elements to correct?
```

### Phase 3: Project Information Collection (if manual or corrections)

Ask **Question 2: Project context**
```
Describe your project context:
- Project name
- Business domain (finance, healthcare, e-commerce, etc.)
- Main objective
- Particular constraints (regulatory, technical, temporal)
```

Ask **Question 3: General architecture**
```
Describe the general architecture per C1 model:
- Users: Who are the end users?
- System: What is the main system?
- Components: What are the main functional blocks?
```

Ask **Question 4: Target tech stack**
```
What is your tech stack?
- Frontend: Framework/technology
- Backend: Language/framework
- Database: Type and technology
- Infrastructure: Cloud, on-premise, hybrid
- Specific tools: CI/CD, monitoring, etc.
```

### Phase 4: Base Use Case Generation

**STANDARD mode**: Generate 3-5 fundamental use cases based on identified business domain, described architecture, and common domain patterns.

**LIGHT mode**: Generate 3 critical use cases max based on 80% of identified real needs, main domain patterns, and reference scenarios for similar cases.

### Phase 5: Existing Content Check and Factorization

Before any generation, scan existing content in `/prompts/gen/`:

1. **Scan existing files**: `/prompts/gen/concepts/`, `/prompts/gen/techniques/`, `/prompts/gen/use_cases/`

2. **Identify existing common info**: already-defined terminology, already-documented architecture, already-specified tech stack, already-created use cases

3. **Detect contradictions**: compare new info with existing, identify conflicts in definitions, architecture, stack

#### 5.4 Automatic Contradiction Resolution 🤖

Invoke `agent-aikido-truth-evaluator`:

```markdown
🤖 AGENT: agent-aikido-truth-evaluator
FORMAT: JSON

Prompt:
"Analyze detected contradictions between existing information (in /prompts/gen/) and newly extracted information.

Existing information: [Content of existing files in concepts/techniques/use_cases]
New information: [Information extracted by agent-explore-bank Phase 1]

For each detected contradiction:
1. Identify conflict type (definition, architecture, stack, terminology)
2. Determine authoritative source per scenario:
   - Existing hard-points = maximum authority (absolute priority)
   - Recent source code = HIGH authority (Code-Driven scenario)
   - Existing documentation = MEDIUM authority (may be outdated)
   - New information without source = LOW authority
3. Evaluate each source's credibility
4. Recommend action:
   - KEEP_EXISTING: Keep existing (authoritative source)
   - USE_NEW: Replace with new version (new authoritative source)
   - MERGE: Merge both (complementary sources)
   - ASK_USER: Ambiguity requiring user intervention

Return contradiction list with:
- Existing file + concerned line
- Conflicting new information
- Identified authoritative source
- Action recommendation (KEEP/USE_NEW/MERGE/ASK_USER)
- Justification + confidence level (HIGH/MEDIUM/LOW)"
```

For each ASK_USER conflict:
```
⚠️ CONFLICT REQUIRING VALIDATION in [existing file]:

Existing: [current content]
New: [new content]

truth-evaluator recommendation: [KEEP/USE_NEW/MERGE]
Justification: [Agent reason] | Confidence: [HIGH/MEDIUM/LOW]

Follow recommendation? (y/n)
If no, which version to prefer?
```

5. **Smart factorization**: enrich existing files rather than replacing them — add missing new sections, update versions and dates.

#### 5.5 RACI Document Classification 🤖 (STANDARD mode only)

**If AIKIDO_MODE = STANDARD**, invoke `agent-aikido-raci-delegator`:

```markdown
🤖 AGENT: agent-aikido-raci-delegator
FORMAT: JSON

Prompt:
"Classify all documents to be created in /prompts/gen/ per RACI matrix and recommend location by role.

Documents to classify:
- Concepts: [List from Phase 1]
- Techniques: [List from Phase 1]
- Use Cases: [List generated in Phase 4]

Project context: [domain, architecture, stack from Phase 1]

For each document:
1. Analyze content and determine main responsible role (R)
2. Identify consulted (C) and accountable (A) roles
3. Determine if mono-project or multi-project context
4. Recommend target path per AI-KIDO Rule 15:
   - /prompts/gen/concepts/[responsible-role]/[concept].md
   - /prompts/gen/techniques/[responsible-role]/[technique].md
   - /prompts/gen/use_cases/[responsible-role]/[use-case].md

Available roles per business domain:
- Finance: solutions-architect, secure-backend-dev, compliance-expert, security-qa
- E-commerce: microservices-architect, frontend-ux-dev, performance-expert, scalability-devops
- Healthcare: security-architect, gdpr-compliance-dev, audit-expert, business-validation-qa

Return for each document: name, responsible role (R), consulted/accountable roles (C/A),
recommended target path, assignment justification, confidence level (HIGH/MEDIUM/LOW)"
```

**If AIKIDO_MODE = LIGHT**: Skip this section (RACI optional — see Phase 7.5).

### Phase 6: AI-KIDO Structure Creation

#### STANDARD mode: Full Structure

**6.1 Project Glossary** (if hard-points documents available)

Create `/prompts/gen/concepts/glossaire-projet.md`:
```markdown
# Project Glossary — [Project Name]
> Version: 1.0 | Date: [DATE] | Status: Initial

## Overview
Key terminology and concepts for project [Name].

## Business definitions
[Terms extracted from documents or provided by user]

## Technical definitions
[Stack and technical components]

## Acronyms and abbreviations
[Alphabetical list]

## Conceptual relationships
[Mermaid diagram of relationships between key concepts]

---
*Auto-generated by init-aikido on [DATE]*
```

**6.2 System Architecture**

Create `/prompts/gen/concepts/architecture-systeme.md`:
```markdown
# System Architecture — [Project Name]
> Version: 1.0 | Date: [DATE] | Status: Initial

## Overview
General architecture of system [Name].

## C1 Model — Context
[C4Context Mermaid diagram based on collected information]

## Main users | Main system | Functional components | Architectural constraints

---
*Auto-generated by init-aikido on [DATE]*
```

**6.3 Tech Stack**

Create `/prompts/gen/techniques/stack-technique.md`:
```markdown
# Tech Stack — [Project Name]
> Version: 1.0 | Date: [DATE] | Status: Initial

## Overview | Architecture diagram (Mermaid)
## Frontend | Backend | Data | Infrastructure | Dev tools

---
*Auto-generated by init-aikido on [DATE]*
```

**6.4 Fundamental Use Cases**

Create `/prompts/gen/use_cases/use-cases-fondamentaux.md`:
```markdown
# Fundamental Use Cases — [Project Name]
> Version: 1.0 | Date: [DATE] | Status: Initial

[3-5 auto-generated use cases per domain]

---
*Auto-generated by init-aikido on [DATE]*
```

#### LIGHT mode: Minimal Structure

**6.1 Unified Concepts File**

Create `/prompts/gen/concepts/core-concepts.md`:
```markdown
# Core Concepts — [Project Name] (Light Mode)
> Version: 1.0 | Date: [DATE] | Status: Initial | Mode: LIGHT

## Overview [2-3 paragraphs max]

## Key Concepts
[3 concepts with ultra-dense description + Mermaid diagram if relevant]

## Essential Glossary [10-15 most critical terms only]

## System Architecture [Simplified C1 Mermaid diagram]

## Relationships and Dependencies [Summary Mermaid diagram]

---
*Auto-generated by init-aikido on [DATE] — LIGHT mode*
```

**6.2 Unified Techniques File**

Create `/prompts/gen/techniques/core-techniques.md`:
```markdown
# Core Techniques — [Project Name] (Light Mode)
> Version: 1.0 | Date: [DATE] | Status: Initial | Mode: LIGHT

## Overview [2-3 paragraphs]

## Essential Techniques [3 techniques with method + concrete example, ultra-dense]

## Tech Stack [Simplified Mermaid diagram]
Frontend | Backend | Data | Infrastructure

## Patterns and Best Practices [Condensed list of critical patterns]

---
*Auto-generated by init-aikido on [DATE] — LIGHT mode*
```

**6.3 Critical Use Cases (3 max)**

Create `/prompts/gen/use_cases/use-cases-critiques.md`:
```markdown
# Critical Use Cases — [Project Name] (Light Mode)
> Version: 1.0 | Date: [DATE] | Status: Initial | Mode: LIGHT

## Overview
3 critical use cases covering 80% of project [Name] needs.

## Use Case 1: [Name] | Use Case 2: [Name] | Use Case 3: [Name]
[Ultra-dense description for each]

---
*Auto-generated by init-aikido on [DATE] — LIGHT mode*
```

### Phase 7: Role-Based Distribution (AI-KIDO Rule 15)

**STANDARD mode**: Apply full role-based distribution.  
**LIGHT mode**: Optional or minimal RACI (see 7.5).

#### 7.1 Project Role Identification (STANDARD)

Auto-generate roles per domain and **create corresponding subdirectories**:
- **Finance**: solutions-architect, secure-backend-dev, compliance-expert, security-qa
- **E-commerce**: microservices-architect, frontend-ux-dev, performance-expert, scalability-devops
- **Healthcare**: security-architect, gdpr-compliance-dev, audit-expert, business-validation-qa

#### 7.2 Role-Based Structure Creation (STANDARD)

Create specialized subdirectories in `/prompts/gen/` per Rule 15:
```
/prompts/gen/concepts/
├── solutions-architect/
├── backend-developer/
├── compliance-expert/
└── security-qa/

/prompts/gen/techniques/  [same structure]
/prompts/gen/use_cases/   [same structure]
```

#### 7.3 Responsibility Assignment per Subdirectory (STANDARD)

- **Solutions Architect**: system architecture, design patterns, technical decisions
- **Backend Developer**: implementation, APIs, performance, app security
- **Compliance Expert**: regulations, audits, business validation, legal docs
- **Security QA**: secure testing, validation, quality controls, test procedures

#### 7.4 RACI Matrix (STANDARD)

Create `/prompts/gen/concepts/matrice-raci.md`:
```markdown
# RACI Matrix — Responsibilities per Role (AI-KIDO Rule 15)
> Version: 1.0 | Date: [DATE] | Status: Initial

## Subdirectory Structure per Role
- `solutions-architect/`: Architecture, patterns, technical decisions
- `backend-developer/`: Implementation, APIs, performance
- `compliance-expert/`: Regulations, audits, business validation
- `security-qa/`: Testing, validation, quality controls

## RACI Matrix per Concept/Technique

| Concept/Technique          | Architect | Developer | Compliance | QA  |
|---------------------------|-----------|-----------|------------|-----|
| System Architecture       |     R     |     A     |     C      |  I  |
| Application Security      |     C     |     R     |     A      |  R  |
| Performance               |     A     |     R     |     C      |  C  |
| Regulatory Compliance     |     C     |     I     |     R      |  A  |
| Automated Testing         |     I     |     C     |     C      |  R  |
| Deployment                |     A     |     R     |     C      |  C  |

**Legend**: R=Responsible, A=Accountable, C=Consulted, I=Informed

## Git Collaboration Rules
- Each role is primary responsible for their subdirectory
- MRs/PRs touching a subdirectory must be approved by the responsible role
- Cross-cutting changes require validation by all concerned roles

*Auto-generated by init-aikido on [DATE] — AI-KIDO Rule 15 applied*
```

#### 7.5 Minimal or No RACI (LIGHT mode)

Ask:
```
🎯 ROLE MANAGEMENT IN LIGHT MODE

1. Single actor (no RACI) — solo developer approach
2. Minimal RACI (2-3 roles max) — Dev + Lead + Ops example

Your choice (1/2):
```

**Choice 1**: No RACI matrix — proceed to Phase 8.  
**Choice 2**: Create `/prompts/gen/concepts/matrice-raci-light.md` with minimal RACI (2-3 polyvalent roles, shared unified files).

### Phase 8: General AI-KIDO Index Update

#### 8.1 Sectoral Indexes

Update with new created files:
- `/prompts/gen/concepts/index.md`
- `/prompts/gen/techniques/index.md`
- `/prompts/gen/use_cases/index.md`

#### 8.2 Main Index

Update `/prompts/index.md`:
- **STANDARD**: Reference `ai-kido.md`, new project context, business domain, tech stack, links to new files
- **LIGHT**: Reference `ai-kido-light.md`, simplified structure, unified files

#### 8.3 AGENTS.md Update

Create or update `AGENTS.md` at project root:

**STANDARD**:
```markdown
# AI Agents Configuration — STANDARD Mode

## Project Context
- **Project**: [Project Name] | **AI-KIDO Mode**: STANDARD
- **Reference**: prompts/hard_points/ai-kido.md
- **Domain**: [Business Domain] | **Architecture**: [Type] | **Stack**: [Main stack]

## Available Agents
### Concept Specialists [6-12 agents per identified concepts]
### Technical Specialists [per identified techniques]
### Domain Experts [per business domain]

## Agent Interaction Matrix
| Agent Type | Primary Role | Interaction Context | Knowledge Base |

## Usage Guidelines
[Based on identified use cases — RACI coordination rules]

---
*Generated by init-aikido on [DATE] — STANDARD mode*
```

**LIGHT**:
```markdown
# AI Agents Configuration — LIGHT Mode

## Project Context
- **Project**: [Project Name] | **AI-KIDO Mode**: LIGHT
- **Reference**: prompts/hard_points/ai-kido-light.md
- **Architecture**: → /prompts/gen/concepts/core-concepts.md
- **Stack**: → /prompts/gen/techniques/core-techniques.md

## Available Agents (3-5 max)
### Agent 1/2/3: [Name] — polyvalent responsibilities

## Agent Interaction (Optional in Light)
[Minimal RACI matrix if applicable, else "Single Actor"]

## Usage Guidelines → /prompts/gen/use_cases/use-cases-critiques.md

---
*Generated by init-aikido on [DATE] — LIGHT mode*
```

#### 8.4 Final AI-KIDO Validation 🤖

Invoke `agent-aikido-validator`:

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

Prompt:
"Validate ALL files created in /prompts/ during AI-KIDO initialization.

STANDARD files: /prompts/gen/concepts/*.md, /prompts/gen/techniques/*.md, /prompts/gen/use_cases/*.md, matrice-raci.md
LIGHT files: core-concepts.md, core-techniques.md, use-cases-critiques.md

AI-KIDO compliance validation:
1. Rule 4: Line constraints (≤500 standard, ≤1000 commands/personas/agents)
2. Rule 6: Bidirectional links (quick check only)
3. Rule 2: Correct location (concepts/techniques/use_cases)
4. Valid frontmatter (version, date, status, mode for Light)
5. Detect empty or malformed files

For each non-compliant file: file + detected violation with line numbers + actionable quick fix

Generate compliance score:
- Files validated: [TOTAL]
- Compliant: [COUNT] ✅ | Non-compliant: [COUNT] ❌
- Compliance score: [PERCENTAGE]%

Fast optimized mode: <5k tokens total."
```

If score < 90%: display violations and propose auto-corrections.  
If score ≥ 90%: confirm successful initialization.

---

## Output

**STANDARD — Success**:
```
✅ AI-KIDO Memory Bank initialized in STANDARD mode!

Created files:
- /prompts/gen/concepts/glossaire-projet.md (if hard-points available)
- /prompts/gen/concepts/architecture-systeme.md
- /prompts/gen/concepts/matrice-raci.md
- /prompts/gen/techniques/stack-technique.md
- /prompts/gen/use_cases/use-cases-fondamentaux.md
- AGENTS.md (created/updated — STANDARD mode)

Updated indexes: index.md, gen/index.md, concepts/, techniques/, use_cases/

🎯 AI-KIDO STANDARD base ready!
   Full multi-agent structure with 6-12 personas and full RACI.
```

**LIGHT — Success**:
```
✅ AI-KIDO Memory Bank initialized in LIGHT mode!

Created files:
- /prompts/gen/concepts/core-concepts.md (unified file)
- /prompts/gen/techniques/core-techniques.md (unified file)
- /prompts/gen/use_cases/use-cases-critiques.md (3 cases max)
- /prompts/gen/concepts/matrice-raci-light.md (if minimal RACI chosen)
- AGENTS.md (created/updated — LIGHT mode)

Updated indexes: index.md (references ai-kido-light.md), gen/index.md, sectoral indexes

🎯 AI-KIDO LIGHT base ready!
   Minimal structure with 3-5 personas max and unified files.
```

---

## Notes

**Agents used**:

| Agent | Phase | Role |
|-------|-------|------|
| **explore-bank** (DEEP) | 1 | Intelligent extraction from sources (hard-points + code) |
| **truth-evaluator** | 5.4 | Auto-resolution of contradictions between existing and new info |
| **raci-delegator** | 5.5 (STANDARD) | Auto-classification of documents per RACI matrix |
| **validator** | 8.4 | Final AI-KIDO compliance validation of all created files |

**Error handling**:
- Missing specified documents: list missing files, propose manual mode
- Inaccessible project sources: list inaccessible directories, continue with available sources
- Unreadable hard-points: switch to manual mode with warning
- Invalid paths: re-ask with correct path examples
- Failed auto-analysis: switch to manual with partial info
- Stack not detected: ask for manual input
- Information conflicts: use truth-evaluator or ask user
- File conflicts: propose backup with temporal suffix
- Mermaid generation error: create text fallback structure

**AI-KIDO Rules respected**:
- No personas created (focus on concepts/techniques)
- Direct generation in `/prompts/gen/`
- Markdown with metadata
- Mermaid diagrams for semantic density
- Role-based taxonomies and hierarchies (Rule 15)
- RACI matrix for responsibilities
- 500-line constraint per file
- Memory Bank auto-population
- Agents: explore-bank (extraction), truth-evaluator (conflicts), raci-delegator (classification), validator (compliance)
