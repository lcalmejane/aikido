---
description: "Initialize the AI-KIDO RACI matrix and team specs to define role-based subdirectory hierarchy"
---

# Command: /init-raci-aikido

Initialize the AI-KIDO RACI matrix and team specifications by analyzing available sources or via manual input. Generates a specs file in [`/prompts/hard_points/`](../) as the basis for role-based subdirectory hierarchy per Rule 15.

**AI-KIDO mode adaptive**: auto-detects STANDARD or LIGHT mode and adapts behavior accordingly.

---

## Steps

### Phase 0: AI-KIDO Mode Detection [MANDATORY]

1. Read `/prompts/index.md` to identify the mode
2. Detect reference: `ai-kido.md` (STANDARD) or `ai-kido-light.md` (LIGHT)
3. Store: `AIKIDO_MODE = [STANDARD|LIGHT]`

```
ℹ️ DETECTED AI-KIDO MODE: [STANDARD/LIGHT]

STANDARD mode:
- Full multi-actor RACI
- Role-based structure with subdirectories
- 4-7 roles recommended

LIGHT mode:
- Optional or minimal RACI (2-3 roles max)
- Single actor possible
- Simplified structure

Continuing RACI initialization in [STANDARD/LIGHT] mode...
```

### Phase 1: Team Identification

Ask **Question 1: Team name**
```
What is your team name for this RACI matrix?

Examples:
- dev-team
- product-squad
- architecture-team
- full-stack-crew

Team name: [TEAM-NAME]
```

### Phase 2: Analysis Source Selection

Ask **Question 2: Analysis sources**
```
Which sources do you want to analyze to build the RACI matrix?

Available options:
1. Existing documents (hard_points, team documentation)
2. Analyze existing structures in /prompts/gen/
3. Full manual input (guided questionnaire)
4. Combined analysis (documents + existing structures)

Your choice (1/2/3/4):
```

- **Choice 1**: Scan available documents
  - List auto-detected hard_points files and team docs (TEAM.md, ROLES.md, etc.)
  - Ask: "Analyze all these documents? (y/n)"

- **Choice 2**: Analyze existing structures
  - Show detected structure counts in /prompts/gen/ (concepts, techniques, use_cases, personas)
  - Show roles already identified in existing RACI matrices
  - Ask: "Analyze these structures to infer RACI organization? (y/n)"

- **Choice 3**: Manual mode — skip to Phase 4

- **Choice 4**: Auto-combine documents + structures

### Phase 3: Intelligent Information Extraction 🤖

Invoke `agent-aikido-explore-bank` (DEEP MODE):

```markdown
🤖 AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

Prompt:
"Extract information needed to initialize the AI-KIDO RACI matrix for team [TEAM-NAME].

Sources per user choice:
- Choice 1: hard_points documents, team documentation
- Choice 2: Existing structures in /prompts/gen/
- Choice 3: (Manual mode — skip this phase)
- Choice 4: Combined documents + structures

Extract:
1. Identified roles from documents:
   - Job titles mentioned
   - Described responsibilities
   - Required skills
   - Expertise domains

2. Processes and activities:
   - Described workflows
   - Validation steps
   - Development cycles
   - Review procedures

3. Technologies and domains:
   - Used tech stack
   - Functional domains
   - Tools and platforms

4. Implicit roles from /prompts/gen/:
   - Existing personas analysis
   - Responsibilities in existing RACI matrices
   - Domain specializations
   - Subdirectory structure (roles/)

5. Current organization:
   - Content distribution
   - Responsibility patterns

For each identified role, return:
- Role name
- Description and responsibilities
- Expertise domains
- Source (document or structure)
- Confidence level (HIGH/MEDIUM/LOW)

Return a complete structured report."
```

Display synthesis for validation:
```
📊 AUTO-ANALYSIS SUMMARY:

Team: [TEAM-NAME]

Identified roles:
- [Role 1]: [Description and responsibilities] (confidence: HIGH/MEDIUM/LOW)
- [Role 2]: [Description and responsibilities] (confidence: HIGH/MEDIUM/LOW)
- [Role 3]: [Description and responsibilities] (confidence: HIGH/MEDIUM/LOW)
- [Role 4]: [Description and responsibilities] (confidence: HIGH/MEDIUM/LOW)

Detected responsibility domains:
- Architecture: [Concerned roles]
- Development: [Concerned roles]
- Business/Functional: [Concerned roles]
- Operations/DevOps: [Concerned roles]
- Quality/Testing: [Concerned roles]

Is this summary correct? (y/n)
If no, which elements to correct?
```

### Phase 4: Manual Information Collection (if manual mode or corrections)

#### 4.1 Team Role Definition

**If AIKIDO_MODE = STANDARD**:

Ask **Question 3: Team roles (STANDARD mode)**
```
Define your team [TEAM-NAME] roles:

STANDARD mode: 4-7 roles recommended for full coverage

Format: Role name | Description | Expertise domains
Example: "Tech Lead | Technical and architecture lead | Backend, APIs, Performance"

Enter roles (one per line, or 'done' to finish):
```

**If AIKIDO_MODE = LIGHT**:

Ask **Question 3: Team roles (LIGHT mode)**
```
Define your team [TEAM-NAME] roles:

LIGHT mode: Choose your approach

1. Single actor (no RACI)
   - One person responsible for everything
   - No RACI matrix needed
   - Skip directly to Phase 7

2. Minimal RACI (2-3 roles max)
   - Dev + Lead + Ops (example)
   - Simplified matrix
   - Clear but limited responsibilities

Your choice (1/2):

If choice 2, define 2-3 roles:
Format: Role name | Description | Expertise domains
Example: "Dev | Development and implementation | Full-stack, Testing"

Enter roles (2-3 max, or 'done' to finish):
```

#### 4.2 Organizational Production Workflow

Ask **Question 4: AI-KIDO production workflow**
```
Define your organization's general production workflow using AI-KIDO.

This workflow represents general knowledge and solution production steps,
independent of your organization's specific business domain.

Standard AI-KIDO workflow (modifiable per your organization):

1. ANALYSIS & RESEARCH
   - Requirements and context analysis
   - Existing solutions research
   - Constraints identification

2. DESIGN & ARCHITECTURE
   - Solution design
   - Component architecture
   - Technical specifications

3. DEVELOPMENT & IMPLEMENTATION
   - Solution realization
   - Component integration
   - Unit testing

4. VALIDATION & QUALITY
   - Integration testing
   - Functional validation
   - Quality control

5. DEPLOYMENT & DELIVERY
   - Production deployment
   - User documentation
   - Training and support

6. MAINTENANCE & EVOLUTION
   - Operational support
   - Fixes and improvements
   - Functional evolution

Use this standard workflow? (y/n)
If no, define your organizational workflow:
```

#### 4.3 Organizational Knowledge Domains

Ask **Question 5: AI-KIDO knowledge domains**
```
What knowledge domains does your organization master in the context of AI-KIDO use?

Domains by category:

CONCEPTS (Core knowledge):
- Architecture and Design Patterns
- Methodologies and Frameworks
- Quality Principles
- Knowledge Management
- Innovation and R&D

TECHNIQUES (Practical know-how):
- Technologies and Tools
- Development Methods
- Validation Techniques
- Integration Processes
- Optimization and Performance

USE CASES (Practical applications):
- Solution Patterns
- Recurring Use Cases
- Deployment Scenarios
- Operational Workflows
- Lessons Learned

BUSINESS (Sector expertise — optional):
- Your organization's activity domain
- Specific regulations
- Sector constraints
- Business standards

Organize your domains by category:
Concepts: [list of mastered concepts]
Techniques: [list of used techniques]
Use Cases: [list of typical use cases]
Business (optional): [sector expertise]
```

### Phase 5: RACI Matrix Construction

#### 5.1 RACI Matrix Generation

Build the matrix automatically by crossing:
- Identified roles (columns)
- Activities/Processes (rows)
- Knowledge domains (context)

Present for validation:
```
📋 GENERATED RACI MATRIX FOR TEAM [TEAM-NAME]:

| Activity/Process       | [Role 1] | [Role 2] | [Role 3] | [Role 4] |
|------------------------|----------|----------|----------|----------|
| Architecture Design    |    R     |    C     |    I     |    I     |
| Feature Development    |    C     |    R     |    C     |    I     |
| Code Review            |    A     |    R     |    C     |    I     |
| Testing & Validation   |    I     |    C     |    R     |    A     |
| Deployment             |    I     |    C     |    A     |    R     |
| Documentation          |    C     |    C     |    I     |    R     |

Legend: R=Responsible, A=Accountable, C=Consulted, I=Informed

Is this matrix correct? (y/n)
Desired changes:
```

#### 5.2 Subdirectory Hierarchy Generation 🤖

Invoke `agent-aikido-raci-delegator`:

```markdown
🤖 AGENT: agent-aikido-raci-delegator
FORMAT: JSON

Prompt:
"Generate optimal role-based subdirectory hierarchy for team [TEAM-NAME] RACI matrix.

Inputs:
- Identified roles: [List of roles with responsibilities]
- RACI matrix: [Generated in Phase 5.1]
- Knowledge domains: [Concepts/Techniques/Use Cases]
- AI-KIDO mode: [STANDARD/LIGHT]

Generate structure:
1. Role slugification: Create appropriate directory slugs
2. Domain → role mapping: Assign domain responsibilities
3. Optimal structure: Generate tree compliant with Rule 15
4. Balancing validation: Verify factor 3-7, depth ≤4

For each role, recommend:
- Directory slug (e.g.: solutions-architect, backend-dev)
- Responsibility domains (concepts/techniques/use_cases)
- Target paths:
  - /prompts/gen/concepts/[role-slug]/
  - /prompts/gen/techniques/[role-slug]/
  - /prompts/gen/use_cases/[role-slug]/

Return complete structure with justifications."
```

Present generated structure:
```
🏗️ PROPOSED SUBDIRECTORY HIERARCHY:

/prompts/gen/concepts/
├── [role-1-slug]/          # Responsible for concepts [domains]
├── [role-2-slug]/          # Responsible for concepts [domains]
├── [role-3-slug]/          # Responsible for concepts [domains]
└── [role-4-slug]/          # Responsible for concepts [domains]

/prompts/gen/techniques/
├── [role-1-slug]/          # Responsible for techniques [domains]
└── [same structure]

/prompts/gen/use_cases/
├── [role-1-slug]/          # Responsible for use cases [domains]
└── [same structure]

Is this structure appropriate? (y/n)
```

### Phase 6: Specs File Generation

#### 6.1 Create Hard Point File

Create [`/prompts/hard_points/aikido-raci-[TEAM-NAME].md`](../prompts/hard_points/aikido-raci-[TEAM-NAME].md):

```markdown
# AI-KIDO RACI Specifications — Team [TEAM-NAME]
> Version: 1.0 | Date: [DATE] | Status: Specification | Type: Hard Point

## Overview
RACI matrix specifications and role-based organization for team [TEAM-NAME].
**This file defines the immutable truth of the team's organization.**

## Team [TEAM-NAME]

### Team Composition
[Team description and context]

### Defined Roles

#### [Role 1]
- **Description**: [Role description]
- **Main responsibilities**: [Responsibilities list]
- **Expertise domains**: [Knowledge domains]
- **Directory slug**: `[role-1-slug]`

#### [Role 2]
[same structure]

## RACI Matrix

### Activities and Processes

| Activity/Process | [Role 1] | [Role 2] | [Role 3] | [Role 4] |
|-----------------|----------|----------|----------|----------|
| [Activity 1]    | R/A/C/I  | R/A/C/I  | R/A/C/I  | R/A/C/I  |

**Legend**: R=Responsible, A=Accountable, C=Consulted, I=Informed

### Knowledge Domains by Role

#### Concepts
- **[Role X]**: [Concepts under their responsibility]

#### Techniques
- **[Role X]**: [Techniques under their responsibility]

#### Use Cases
- **[Role X]**: [Use cases under their responsibility]

## AI-KIDO Subdirectory Hierarchy

```
/prompts/gen/concepts/
├── [role-1-slug]/
├── [role-2-slug]/
└── [role-N-slug]/

/prompts/gen/techniques/
└── [same structure]

/prompts/gen/use_cases/
└── [same structure]
```

## Git Collaboration Rules

### Validation Workflow
1. **Content creation**: Responsible role creates content in their subdirectory
2. **Internal review**: "Consulted" roles validate content
3. **Final approval**: "Accountable" role approves merge
4. **Information**: "Informed" roles are notified of changes

### MR/PR Assignment
- **Changes in `[role-X-slug]/`** → Assigned to [Role X]
- **Cross-cutting changes** → Validation by all concerned roles
- **Responsibility conflicts** → Escalation per RACI matrix

## Metadata
- **Team**: [TEAM-NAME]
- **Roles count**: [COUNT]
- **Covered domains**: [DOMAINS_LIST]
- **Created**: [DATE]
- **Last updated**: [DATE]

---
*Specs auto-generated by init-raci-aikido on [DATE]*
*AI-KIDO Rule 15 applied — Role-based distribution*
```

**LIGHT mode — minimal RACI**: Create [`/prompts/hard_points/aikido-raci-light-[TEAM-NAME].md`](../prompts/hard_points/aikido-raci-light-[TEAM-NAME].md) with simplified template (2-3 polyvalent roles, shared unified files, no role subdirectories).

**LIGHT mode — single actor**: No RACI file — skip to Phase 7.

### Phase 7: General Index Update

#### 7.1 Hard Points Index

Update [`/prompts/hard_points/index.md`](../index.md):
- STANDARD: Add `aikido-raci-[TEAM-NAME].md` under "Team Specifications"
- LIGHT minimal: Add `aikido-raci-light-[TEAM-NAME].md`
- LIGHT single actor: No update needed

#### 7.2 Main Index

Update [`/prompts/index.md`](../../index.md) with team organization reference and mode.

#### 7.3 AGENTS.md Update

Update [`AGENTS.md`](../../../AGENTS.md) with:

**STANDARD mode**:
```markdown
## Team Organization — [TEAM-NAME]

### Mode: STANDARD
- **Specs**: `prompts/hard_points/aikido-raci-[TEAM-NAME].md`
- **Roles**: [COUNT] defined (4-7 recommended)
- **Structure**: Role-based subdirectories per AI-KIDO Rule 15

### Role-Based Knowledge Organization

#### [Role 1] — `[role-1-slug]`
- **Responsibilities**: [Main responsibilities]
- **Knowledge Domains**: [Expertise domains]
- **Directories**: `prompts/gen/concepts/[role-1-slug]/`, `techniques/`, `use_cases/`

[... other roles ...]

### Agent Interaction Guidelines
- Agents MUST respect the RACI matrix for content validation
- Content creation MUST follow role-based directory structure
- Cross-role collaboration MUST follow the defined workflow
- MR/PR assignments based on role responsibilities
```

**LIGHT — single actor**:
```markdown
## Team Organization — [TEAM-NAME]

### Mode: LIGHT — Single Actor
- **Config**: Solo developer / Single agent approach
- **Structure**: Unified files without role-based subdirectories
- Shared files: `core-concepts.md`, `core-techniques.md`, `use-cases-critiques.md`
```

**LIGHT — minimal RACI**:
```markdown
## Team Organization — [TEAM-NAME]

### Mode: LIGHT — Minimal RACI
- **Specs**: `prompts/hard_points/aikido-raci-light-[TEAM-NAME].md`
- **Roles**: 2-3 (polyvalent)
- **Structure**: Unified files, no role subdirectories
```

### Phase 8: Final Compliance Validation 🤖

Invoke `agent-aikido-validator`:

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

Prompt:
"Validate AI-KIDO compliance of the generated RACI file and created structure.

Files to validate:
- /prompts/hard_points/aikido-raci-[TEAM-NAME].md (STANDARD)
  OR /prompts/hard_points/aikido-raci-light-[TEAM-NAME].md (LIGHT)
- /prompts/hard_points/index.md (updated)
- /prompts/index.md (updated)
- AGENTS.md (updated)

RACI-specific validation:
1. Rule 4: Line constraints (≤500 lines for RACI hard point)
2. Rule 15: Role-based distribution (if STANDARD mode)
3. Valid frontmatter (version, date, status, type: Hard Point)
4. Coherent RACI matrix (at least one R per activity)
5. Proposed subdirectory hierarchy compliant (factor 3-7, depth ≤4)
6. Bidirectional links (RACI hard point ↔ index ↔ AGENTS.md)

For each violation: file + violation + severity (CRITICAL/MAJOR/MINOR) + quick fix

Fast mode: <3k tokens."
```

If score < 90%: display violations and propose corrections.
If score ≥ 90%: confirm successful initialization.

---

## Output

**STANDARD — Success**:
```
✅ AI-KIDO RACI specs created in STANDARD mode!

Team: [TEAM-NAME] | Mode: STANDARD
File: /prompts/hard_points/aikido-raci-[TEAM-NAME].md

Generated:
- [X] roles defined (4-7 recommended)
- [Y] activities/processes mapped
- [Z] knowledge domains organized
- RACI matrix: ✅ | Subdirectory hierarchy: ✅

Role structure: [COUNT] subdirs per domain
Indexes updated: hard_points/index.md, index.md, AGENTS.md ✅
Compliance score: [PERCENTAGE]%

🎯 STANDARD RACI organization ready for team [TEAM-NAME]!
```

**LIGHT — Single actor**:
```
✅ AI-KIDO LIGHT single actor configuration!

Team: [TEAM-NAME] | Mode: LIGHT — Single Actor
No RACI file — shared unified files used.

Files: core-concepts.md, core-techniques.md, use-cases-critiques.md
Indexes updated: index.md, AGENTS.md ✅
```

**LIGHT — Minimal RACI**:
```
✅ AI-KIDO minimal RACI specs created in LIGHT mode!

Team: [TEAM-NAME] | Mode: LIGHT — Minimal RACI
File: /prompts/hard_points/aikido-raci-light-[TEAM-NAME].md

Generated: [2-3] polyvalent roles | Minimal RACI matrix ✅
Structure: unified files (no subdirectories)
Indexes updated ✅
```

---

## Notes

**Agents used**:

| Agent | Phase | Role |
|-------|-------|------|
| **explore-bank** (DEEP) | 3 | Intelligent role/responsibility extraction from docs and structures |
| **raci-delegator** | 5.2 | Optimal subdirectory hierarchy generation with role slugs |
| **validator** | 8 | Final AI-KIDO compliance validation of RACI file |

**Error handling**:
- Agent unavailable: degraded mode with manual analysis/generation
- Documents not found: list missing files and propose manual mode
- Invalid team name: re-ask with valid format (alphanumeric + hyphens)
- AGENTS.md corrupted: create backup before update
- Mode not detected: ask user to choose STANDARD or LIGHT
- STANDARD: minimum 2 roles required, warn if > 7 roles
- LIGHT: maximum 3 roles — confirm if user attempts more
- Incoherent RACI: validate at least one R per activity

**AI-KIDO Rules respected**:
- Rule 15: Role-based distribution with specialized subdirectories (STANDARD)
- Hard Point: Specs stored as immutable truth
- Full RACI matrix: clear responsibility assignment (4-7 roles in STANDARD)
- Coherent hierarchy: structure respecting balancing constraints
- Complete indexing: all indexes updated
- LIGHT mode: single actor support, minimal RACI (2-3 roles), unified files
