---
description: "Complete audit of AI-KIDO Truth Tables to detect drifts, inconsistencies, and broken links"
---

# /analyse-aikido

**Purpose**: Complete audit and automatic correction of the AI-KIDO base according to rules 1-18.

**Principle**: Direct corrections in `/prompts/gen/` and synchronization of `AGENTS.md` according to AI-KIDO rules.

---

## Usage

```
/analyse-aikido
/analyse-aikido --dry-run
/analyse-aikido --report-only
/analyse-aikido --sync-agents
```

- `--dry-run` : Simulate without applying modifications
- `--report-only` : Generate report only, no corrections
- `--sync-agents` : Synchronize AGENTS.md only

## Prerequisites

- Access to `/prompts/gen/` and `/prompts/hard_points/`
- AI-KIDO rules 1-18 loaded from [`hard_points/ai-kido.md`](../ai-kido.md)

**FUNDAMENTAL PRINCIPLE**: No separate analysis directories — direct corrections in the existing AI-KIDO base according to established rules.

---

## Steps

### Phase 1: Structural Audit according to AI-KIDO Rules

#### 1.0 Automatic Memory Bank Exploration

USE AGENT `agent-aikido-explore-bank` to intelligently scan the structure:

```markdown
AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

Prompt for the agent:
"Perform a DEEP scan of the AI-KIDO Memory Bank. Analyze:
1. Complete structure of /prompts/gen/ and /prompts/hard_points/
2. All files with their metadata (size, modification date, version)
3. Bidirectional links between files
4. Distribution by roles if applicable (Rule 15)
5. Potential violations of AI-KIDO rules 1-18

Return a complete inventory with paths + line numbers for each element."

Expected result: Structured inventory of the Memory Bank with metrics
```

Agent benefits:
- Optimized scan (<40% context)
- Automatic metadata (dates, versions, deprecation)
- Pattern and anomaly detection
- Precise references (file_path:line_number)

#### 1.1 Validation of Mandatory Structure (Rules 1-2, 8, 15)

Analyze agent results and verify compliance with [`ai-kido.md`](../ai-kido.md) lines 79-105:

```markdown
STRUCTURAL AUDIT AI-KIDO

Mandatory structure verified:
- /prompts/index.md (main entry point - Rule 1)
- /prompts/gen/concepts/ (theory - Rule 2)
- /prompts/gen/techniques/ (practice - Rule 2)
- /prompts/gen/personas/ (specialized agents - Rule 9)
- /prompts/gen/use_cases/ (applications - Rule 2)
- /prompts/hard_points/ (immutable truths - Rule 8)

Distribution by roles (Rule 15):
- Sub-directories with assigned owners
- RACI matrix respected

Automatic corrections applied: [LIST]
```

#### 1.2 Validation of Balancing Constraints (Rules 4, 7)

USE AGENT `agent-aikido-validator` for rapid constraint validation:

```markdown
AGENT: agent-aikido-validator
FORMAT: JSON

Prompt for the agent:
"Validate ALL files from /prompts/gen/ and /prompts/hard_points/ for compliance:
1. Rule 4: Line constraints (<=500 standard, <=1000 commands/personas/agents,
   EXEMPT ai-kido*.md, prompts/hard_points/system/structure/index.json no limit.)
2. Rule 7: Tree depth <=4 levels, branching factor 3-7
3. Rule 6: Bidirectional links (quick check)
4. Rule 2: Correct placement (concepts/techniques/personas/use_cases)
5. Valid frontmatter (name, description, tools for agents/personas)

For each non-compliant file, return:
- File + current line count / limit
- Violations detected with line references
- Quick resolution plan (split, move, fix frontmatter)

Use quick checks (<2k tokens per batch)."

Expected result: List of non-compliant files with correction plans
```

Agent benefits:
- Fast validation (<2k tokens per batch)
- Automatic mono/multi-project detection
- Exception handling (ai-kido.md exempt)
- Actionable resolution plans
- Concise reports (pass/fail per file)

---

### Phase 2: Format Correction (Rules 4, 11, 12)

#### 2.1 Standard AI-KIDO Format

Automatically correct all files that do not conform to the format in [`ai-kido.md`](../ai-kido.md) lines 140-163:

```markdown
FORMAT CORRECTIONS APPLIED

Standard AI-KIDO format enforced:
- Metadata added: > Version: X.Y | Date: YYYY-MM-DD | Status: [Status]
- Mandatory sections created: Overview, Key Definitions, etc.
- Semantic density optimized (Rule 11)
- Mermaid diagrams added where relevant (Rule 12)

Files automatically corrected: [COUNT]
```

#### 2.2 Bidirectional Links (Rule 6)

Automatically create all missing bidirectional links:

```markdown
BIDIRECTIONAL LINKS RESTORED

Rule 6 applied - Systematic A <-> B chaining:
- Return links created automatically
- Hierarchical navigation restored
- Cross-references added

Bidirectional links added: [COUNT]
```

#### 2.3 Post-Correction Validation

USE AGENT `agent-aikido-validator` to validate the applied corrections:

```markdown
AGENT: agent-aikido-validator
FORMAT: JSON

Prompt for the agent:
"Validate ALL files modified during format corrections (Phase 2).
For each corrected file:
1. Verify added frontmatter compliance
2. Verify created bidirectional links
3. Verify semantic density
4. Verify line constraints still respected

Return concise validation report:
- [file] COMPLIANT (corrections OK)
- [file] NON-COMPLIANT (corrections insufficient) + quick fix

Fast mode: <2k tokens total."

Expected result: Corrections validation with success rate
```

Quality guarantee:
- Corrections validated immediately
- Automatic re-application on failure
- Compliance guaranteed before next phase

---

### Phase 3: Synchronization AGENTS.md <-> AI-KIDO (Rules 16-18)

#### 3.0 Automatic RACI Validation

USE AGENT `agent-aikido-raci-delegator` to validate RACI consistency:

```markdown
AGENT: agent-aikido-raci-delegator
FORMAT: JSON

Prompt for the agent:
"Analyze all files from /prompts/gen/ detected in the previous inventory.
For each file:
1. Verify that placement respects the RACI matrix
2. Identify misclassified documents (wrong directory/role)
3. Detect documents without assigned owner
4. Propose necessary reclassifications with confidence score

Return the list of RACI inconsistencies with current and recommended paths."

Expected result: List of documents to reclassify according to RACI
```

Agent benefits:
- High-precision automatic classification
- Mono/multi-project context detection
- Recommendations with alternatives
- Strict respect of AI-KIDO rules

#### 3.1 Automatic Update of AGENTS.md

Automatically synchronize [`AGENTS.md`](../../../AGENTS.md) with `/prompts/gen/` according to rules 16-18:

```markdown
AGENTS.MD SYNCHRONIZATION

Rules 16-18 applied:
- Project Context synchronized with /prompts/index.md
- Available Agents generated from /prompts/gen/personas/
- Agent Interaction Matrix updated
- Usage Guidelines aligned with use_cases/

1:1 Agents <-> Personas correspondence: [PERCENTAGE]%
```

#### 3.2 Compliance Validation

Verify and correct AGENTS.md compliance:

- Standardized structure respected
- Exclusive links to `/prompts/gen/` (no duplication)
- AI-KIDO taxonomy preserved
- RACI specifications aligned

---

### Phase 4: Detection and Correction of Inconsistencies

#### 4.1 Contradiction Resolution

USE AGENT `agent-aikido-truth-evaluator` to arbitrate contradictions:

```markdown
AGENT: agent-aikido-truth-evaluator
FORMAT: JSON

Prompt for the agent:
"Analyze all documents from /prompts/gen/ detected with potential contradictions.
For each contradiction (specs vs code, legacy docs vs implementation, source conflicts):

1. Identify the development scenario (new feature, bug fix, refactoring, etc.)
2. Determine the authoritative source according to the scenario
3. Score the credibility of each source (code, specs, docs, tests, config)
4. Detect conflicts between sources
5. Provide recommendation with confidence level

Respect hierarchy: /prompts/hard_points/ > /prompts/gen/ > code/docs > NEVER /prompts/spec/

Return clear arbitrations for each contradiction:
- Authoritative source identified
- Justification according to scenario
- Action recommendation (keep source X, ignore source Y)
- Confidence level (HIGH/MEDIUM/LOW)"

Expected result: Contradiction arbitration with actionable recommendations
```

Agent benefits:
- Automatic classification of 8 scenarios
- Objective credibility scoring
- Systematic conflict detection
- Recommendations with confidence level
- Respect of AI-KIDO hierarchy

#### 4.2 Terminology Inconsistencies

Automatically harmonize terminology:

```markdown
TERMINOLOGY HARMONIZATION

Unified glossary applied:
- Terms standardized throughout the base
- Acronyms harmonized
- Consistent definitions

Terminology corrections: [COUNT]
```

#### 4.3 Architectural Inconsistencies

Automatically align architecture and implementation:

```markdown
ARCHITECTURAL CONSISTENCY

Automatic alignment:
- Architecture <-> Tech stack
- Components <-> Use cases
- Personas <-> Workflows

Alignments applied: [COUNT]
```

---

### Phase 5: Index Update (Rule 1)

#### 5.1 Automatic Index Regeneration

Automatically update all index files:

```markdown
INDEXES REGENERATED

Hierarchical navigation restored (Rule 1):
- /prompts/index.md updated
- /prompts/gen/index.md updated
- /prompts/gen/concepts/index.md regenerated
- /prompts/gen/techniques/index.md regenerated
- /prompts/gen/personas/index.md regenerated
- /prompts/gen/use_cases/index.md regenerated

Recursive traversal optimized from main entry point.
```

#### 5.2 Navigation Validation

Verify that recursive traversal from [`/prompts/index.md`](../../index.md) works correctly:

- All files accessible from the entry point
- Consistent hierarchical navigation
- Functional return links

---

### Phase 6: Auto-population Rules Application

#### 6.1 Capitalization of Analyses (Capitalization Rules)

Automatically create missing files according to capitalization rules:

```markdown
AUTOMATIC CAPITALIZATION

Capitalization rules applied:
- Conceptual analyses -> /concepts/
- Technical analyses -> /techniques/
- Case analyses -> /use_cases/
- Role definitions -> /personas/

Files automatically created: [COUNT]
```

#### 6.2 Traceability and Versioning

Apply automatic versioning:

- Modification timestamps applied
- Saved analyses versioned
- Applied corrections traceable

---

### Phase 7: Hard Points Validation (Rule 8)

#### 7.1 Respect of Immutable Truths

Verify that all corrections respect the [`hard_points`](../):

```markdown
HARD POINTS RESPECTED

Immutable truths preserved:
- No hard_points constraint violations
- Hierarchy hard_points > gen/ > requests respected
- Frozen decisions maintained

Hard points compliance: 100%
```

#### 7.2 Final Complete Validation

USE AGENT `agent-aikido-validator` for final audit before report:

```markdown
AGENT: agent-aikido-validator
FORMAT: JSON

Prompt for the agent:
"Validate the ENTIRETY of /prompts/ after all corrections applied (Phases 1-7).
Final AI-KIDO compliance audit:

1. Rule 4: Line constraints on ALL files
2. Rule 6: Complete bidirectional links
3. Rule 2: Correct theory/practice separation
4. Rule 7: Balanced tree structure
5. Valid frontmatter on all agents/personas/commands
6. Correct placement of all files

Generate global compliance score:
- Files validated: [TOTAL]
- Compliant: [COUNT] (pass)
- Non-compliant: [COUNT] (fail)
- Compliance score: [PERCENTAGE]%

For each non-compliant file, list violation + quick fix.

Full but optimized mode: <5k tokens total."

Expected result: Final compliance score + list of residual violations
```

Final quality guarantee:
- Global compliance precisely measured
- Residual violations identified
- Score ready for the report
- Independent validation of all previous phases

---

### Phase 8: Summary Report Generation

#### 8.1 Report Integrated in the AI-KIDO Base

Create the report in [`/prompts/spec/audit-aikido-[DATE].md`](../../spec/):

```markdown
# AI-KIDO Audit - [DATE]

> Version: 1.0 | Date: YYYY-MM-DD | Status: Audit Report
> Compliant with AI-KIDO rules 1-18

## Overview

**Global status**: [EXCELLENT/GOOD/AVERAGE/CRITICAL]
**Rules 1-18 compliance**: [X]%
**Automatic corrections applied**: [COUNT]

## Compliance Metrics

### Structural Rules (1-8)
- Rule 1 (Tree structure): compliant
- Rule 2 (Separation): compliant
- Rule 4 (500 lines): [X] files split
- Rule 6 (Bidirectionality): [Y] links added
- Rule 7 (Balancing): compliant
- Rule 8 (Hard Points): respected

### Optimization Rules (9-15)
- Rule 9 (Agents): [Z] personas validated
- Rule 11 (Density): optimized
- Rule 12 (Mermaid): [W] diagrams added
- Rule 15 (Roles): RACI respected

### AGENTS.md Rules (16-18)
- Rule 16 (Interface): synchronized
- Rule 17 (Bidirectionality): compliant
- Rule 18 (Structure): standard respected

## Applied Corrections

### Automatic Corrections
- Standardized formats: [COUNT]
- Bidirectional links created: [COUNT]
- Files split (>500 lines): [COUNT]
- Indexes regenerated: [COUNT]
- AGENTS.md synchronized: yes

### Improvements Made
- Semantic density optimized
- Hierarchical navigation restored
- Terminology consistency established
- Architecture aligned

## Post-Audit State

**AI-KIDO Base**: Compliant with all 18 rules
**AGENTS.md**: Synchronized and compliant
**Navigation**: Recursive traversal functional
**Links**: Complete bidirectionality

## Relations and Dependencies

- Reference: [ai-kido.md](../ai-kido.md)
- Synchronized with: [AGENTS.md](../../../AGENTS.md)
- Entry point: [index.md](../../index.md)
```

---

### Phase 9: Auto-population Proposal

#### 9.1 Inventory of Detected Gaps

Compile the complete list of gaps detected during the audit:

```markdown
GAPS DETECTED DURING AUDIT

Missing documents: [COUNT]
- /prompts/gen/concepts/[topic-1].md - Referenced but absent
- /prompts/gen/techniques/[topic-2].md - Referenced but absent
...

Invalid/deprecated documents: [COUNT]
- /prompts/gen/concepts/[topic-3].md - Flagged false by truth-evaluator
- /prompts/gen/use_cases/[topic-4].md - Deprecated (>6 months)
...

Unresolved contradictions: [COUNT]
- Topic [X] - Code vs Documentation (no authoritative source)
...

Total gaps: [COUNT]
```

#### 9.2 Auto-population Proposal

IF gaps are detected (>0), PROPOSE:

```markdown
AUTO-POPULATION PROPOSAL

The audit detected [COUNT] gap(s) in the Memory Bank.

Do you want to invoke agent-aikido-bank-populate to automatically fill these gaps?

The agent will:
1. Collect information from code/context for each gap
2. Classify via agent-aikido-raci-delegator
3. Resolve contradictions via agent-aikido-truth-evaluator
4. Delegate writing to appropriate expert personas
5. Validate AI-KIDO compliance (<=500 lines, bidirectional links)
6. Integrate into Memory Bank with index update

Launch automatic auto-population? (y/n):
```

IF user accepts: Invoke `agent-aikido-bank-populate` with the list of gaps.

IF user declines: Display message "Gaps listed in the report for later manual action."

---

## Output

### Final Result

```markdown
AUDIT AI-KIDO COMPLETE

AI-KIDO base audited and corrected:
- Rules 1-18 compliance: [X]%
- Automatic corrections: [Y] applied
- AGENTS.md synchronized: yes
- Navigation optimized: yes

Gaps detected: [COUNT]
Gaps automatically filled: [COUNT if accepted, 0 if declined]

Report available: /prompts/spec/audit-aikido-[DATE].md

Memory Bank AI-KIDO maintained and optimized.
```

---

## Notes

### AI-KIDO Agents Used

This command uses **5 specialized AI-KIDO agents**:

| Phase | Agent | Role | Tokens |
|-------|-------|------|--------|
| 1.0 | `agent-aikido-explore-bank` (DEEP) | Intelligent Memory Bank scan — structured inventory with metadata | ~25-40k |
| 1.2 + 2.3 + 7.2 | `agent-aikido-validator` (3 invocations) | Constraint validation (rules 4/6/7), post-correction check, final audit | <2k per call |
| 3.0 | `agent-aikido-raci-delegator` | RACI consistency validation — reclassification recommendations | optimized |
| 4.1 | `agent-aikido-truth-evaluator` | Contradiction arbitration (specs vs code, legacy docs) | optimized |
| 9 (optional) | `agent-aikido-bank-populate` | Auto-population of detected gaps — triggered only if user accepts | varies |

### Optimization Gains

| Aspect | Before (manual) | After (agents) | Gain |
|--------|-----------------|----------------|------|
| Constraint validation | Heavy manual scripts | agent-validator fast | ~80% tokens |
| Contradiction resolution | Manual | agent-truth-evaluator auto | 100% automated |
| Post-correction validation | Absent | agent-validator systematic | +Quality guarantee |
| Final validation | Partial | agent-validator complete | 100% coverage |
| Precision | Basic detection | High-precision classification | +60% precision |

### Rules Applied

- Direct corrections: Modifications in `/prompts/gen/` according to AI-KIDO rules
- No analysis directories: Full integration in the existing base
- AGENTS.md synchronization: Compliance with rules 16-18
- Auto-population: Capitalization according to established rules
- Hard Points respected: Absolute priority to immutable truths
- Standard format: Compliance with AI-KIDO template
- Bidirectional links: Rule 6 applied systematically
- Hierarchical navigation: Recursive traversal from main index
- Integrated report: Documentation in `/spec/` according to standards
- Agent optimization: Use of 5 specialized AI-KIDO agents for maximum efficiency
- Continuous validation: agent-validator at 3 key points (constraints, post-correction, final)
- Contradiction arbitration: agent-truth-evaluator for automatic resolution
- RACI consistency: agent-raci-delegator for precise classification
- Smart scan: agent-explore-bank in DEEP mode for complete inventory
