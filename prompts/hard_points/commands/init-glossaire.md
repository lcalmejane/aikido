---
description: "Create or update the project business glossary organized by domains/expert personas in AI-KIDO Memory Bank"
---

# /init-glossaire

**Purpose**: Generate a business glossary split by domains and expert personas in [`/prompts/gen/concepts/glossaires/`](../prompts/gen/concepts/glossaires/), optimized for semantic search and compliant with AI-KIDO rules (≤500 lines, compact, useful).

---

## Usage
[MANDATORY]
/init-glossaire

## Prerequisites

- AI-KIDO Memory Bank initialized (`/prompts/gen/` structure present)
- Agents available: `agent-aikido-explore-bank`, `agent-aikido-truth-evaluator`, `agent-aikido-raci-delegator`, `agent-aikido-validator`
- Source code or business documentation accessible

## Steps
[MANDATORY]

**Orchestration workflow**:

```
explore-bank → truth-evaluator → [Code/Docs Analysis] → raci-delegator → [Split Generation] → validator
(Context        (Source             (Terms Extraction)    (Domain            (Glossaries per     (Compliance
 Detection)      Validation)                               Classification)    domain/persona)     Validation)
```

### Step 1: Contextual Exploration

**USE AGENT** [`agent-aikido-explore-bank`](../prompts/hard_points/agents/agent-aikido-explore-bank.md):

```markdown
AGENT: agent-aikido-explore-bank (QUICK MODE)

Prompt:
"Detect context for business glossary initialization.

Analyze:
1. Existing glossaries in `/prompts/gen/concepts/glossaires/`
2. Available expert personas in `/prompts/gen/personas/`
3. Business domains from Memory Bank and project code structure

Return:
- Existing glossaries: [LIST or "None"]
- Expert personas: [LIST with specializations]
- Identified business domains: [LIST]
- Recommended mode: [CREATION | UPDATE]

Mode: QUICK (<15k tokens)"

Expected result: Full context for glossary generation
```

**Step 1 Output**:
```
DETECTED CONTEXT:

Existing glossaries: [LIST or "None"]
Available expert personas: [LIST]
Identified business domains: [LIST]

Mode: [CREATION | UPDATE]
```

### Step 2: Source Validation

**USE AGENT** [`agent-aikido-truth-evaluator`](../prompts/hard_points/agents/agent-aikido-truth-evaluator.md):

```markdown
AGENT: agent-aikido-truth-evaluator

Prompt:
"Validate business terminology sources for glossary generation.

Identify authoritative sources:
- Source code (business classes/interfaces/enums)
- Existing business documentation
- Code explanatory comments
- Business tests (Given/When/Then)

Automatic Exclusions:
- Generic AI-KIDO terms (`/prompts/hard_points/ai-kido.md`)
- Generic personas/roles
- Standard technologies

Resolve detected Contradictions.
Score credibility of each term.

Return:
- Authoritative sources with credibility (%)
- Extracted vs excluded Terms
- Contradictions + resolutions

Mode: <10k tokens"

Expected result: Validated sources + filtered Terms
```

**Step 2 Output**:
```
VALIDATED SOURCES:

Authoritative sources:
- Business code: [PATHS] (credibility: 90%)
- Business docs: [PATHS] (credibility: 80%)
- Business tests: [PATHS] (credibility: 85%)

Extracted Terms: [COUNT]
Excluded Terms (AI-KIDO): [COUNT]
Detected Contradictions: [COUNT]
```

### Step 3: Terminology Extraction and Analysis

**Automatic multi-source analysis**:

#### 3.1 Code Sources (high priority)
- **Business classes/interfaces**: Explicit domain names
- **Business enums**: Specific business values
- **Business constants**: Codified business rules
- **Business comments**: Business logic explanations

#### 3.2 Documentation Sources
- **Business docs**: Formal terminology
- **README/CONTRIBUTING**: Project-specific concepts
- **Business tests**: Given/When/Then scenarios

#### 3.3 Intelligent Filtering

**Inclusion criteria**:
- Domain-specific business Terms
- Ambiguous/confusing concepts requiring clarification
- Non-standard business acronyms
- Specific business processes
- Complex business rules

**Exclusions criteria**:
- Generic AI-KIDO terms
- Standard technologies
- Classic architectural patterns
- Usual development terms

**Step 3 Output**:
```
TERMINOLOGY EXTRACTION:

Extracted business Terms: [COUNT]
- Business classes: [COUNT]
- Business enums: [COUNT]
- Documentation concepts: [COUNT]
- Test scenarios: [COUNT]

Detected confusing Terms: [COUNT]
Business acronyms: [COUNT]

Continue? (y/n)
```

### Step 4: Classification by Domains

**USE AGENT** [`agent-aikido-raci-delegator`](../prompts/hard_points/agents/agent-aikido-raci-delegator.md):

```markdown
AGENT: agent-aikido-raci-delegator

Prompt:
"Classify business Terms by Domains for split glossary generation.

Input: [List of Terms extracted from Step 3]

Analyze:
1. Classify Terms by business domain
2. Map to expert personas (existing or to create)
3. Calculate optimal size per glossary (≤500 lines)
4. Recommend tree structure

Split strategy:
- By business domain (Frontend, Backend, Business, Data, etc.)
- By expert persona (map to `/prompts/gen/personas/`)
- Split if >400 lines (safety margin)

Return:
- Classification by domain with estimated sizes
- Expert personas mapping
- Recommended tree structure with paths

Mode: <10k tokens"

Expected result: Split glossary structure compliant with AI-KIDO
```

**Step 4 Output**:
```
CLASSIFICATION BY DOMAINS:

Detected Domains:
1. [Domain 1]: [X] Terms → glossaire-[domain1].md (≈[Y] lines)
2. [Domain 2]: [X] Terms → glossaire-[domain2].md (≈[Y] lines)
...

Mapped expert personas:
- [Domain 1] → [Existing persona or "To create"]
- [Domain 2] → [Existing persona or "To create"]

Recommended structure:
/prompts/gen/concepts/glossaires/
  ├── index.md (navigation)
  ├── glossaire-[domain1].md
  ├── glossaire-[domain2].md
  └── ...

Validate this structure? (y/n)
```

### Step 5: Manual Enrichment (Optional)

**Propose manual additions**:
```
Add business Terms not automatically detected?

Format: Term | Definition | Domain | Context
Example: "Learning path | Personalized pedagogical sequence | Pedagogy | Evaluation modules"

Enter Terms (one per line, or 'done'):
```

### Step 6: Split Generation by Domains

#### 6.1 Tree Structure

**Create directory** [`/prompts/gen/concepts/glossaires/`](../prompts/gen/concepts/glossaires/):

```
/prompts/gen/concepts/glossaires/
├── index.md                    # Main navigation + search
├── glossaire-[domain1].md      # ≤500 lines, compact
├── glossaire-[domain2].md      # ≤500 lines, compact
└── ...
```

#### 6.2 Main Index Format

**Create** [`/prompts/gen/concepts/glossaires/index.md`](../prompts/gen/concepts/glossaires/index.md):

```markdown
# Business Glossaries by Domains
> Version: 1.0 | Date: [DATE] | Project: [PROJECT_NAME]

## Navigation by Domain

### [Domain 1] ([X] Terms)
**Expert persona**: [`[expert-persona]`](../../personas/[expert-persona].md)
**Glossary**: [`glossaire-[domain1].md`](glossaire-[domain1].md)
**Key concepts**: [List 3-5 main concepts]

### [Domain 2] ([X] Terms)
**Expert persona**: [`[expert-persona]`](../../personas/[expert-persona].md)
**Glossary**: [`glossaire-[domain2].md`](glossaire-[domain2].md)
**Key concepts**: [List 3-5 main concepts]

## Quick Search

### By Term
- **[Term A]** → [`glossaire-[domain]`](glossaire-[domain].md#term-a)
- **[Term B]** → [`glossaire-[domain]`](glossaire-[domain].md#term-b)

### By Category
- **Business processes**: [Links to relevant glossaries]
- **Business rules**: [Links to relevant glossaries]
- **Confusing concepts**: [Links to relevant glossaries]

## Statistics
- **Total Terms**: [COUNT]
- **Covered Domains**: [COUNT]
- **Analyzed sources**: [COUNT] files
- **Last update**: [DATE]

---
*Generated by `/init-glossaire` - AI-KIDO compliant (≤500 lines/file)*
```

#### 6.3 Domain Glossary Format

**Template** [`glossaire-[domain].md`](../prompts/gen/concepts/glossaires/):

```markdown
# Glossary [Domain]
> **Expert persona**: [`[persona]`](../../personas/[persona].md) | **Terms**: [X] | **Lines**: [Y]/500

## Terms (alphabetical order)

### [Term 1]
**Definition**: [Concise, 1-2 sentences max]
**Context**: [Where used in code/docs]
**Example**: `[Code snippet or concrete usage]`
**See also**: [`[related-term]`](#related-term)

### [Term 2]
...

## Category Index

**Processes**: [`term1`](#term-1), [`term2`](#term-2)
**Rules**: [`term3`](#term-3)
**Concepts**: [`term4`](#term-4)

## Confusing Terms

**[Term A]** != **[Term B]**
→ [Key difference in 1 sentence]

---
*Sources*: [Code/docs paths] | *Validated by*: [`truth-evaluator`](../../personas/agent-aikido-truth-evaluator.md)
```

#### 6.4 Size Optimization (≤500 lines)

**Compression strategies**:
1. **Concise definitions**: 1-2 sentences max
2. **Inline examples**: Short code snippets
3. **Links instead of duplication**: Cross-references
4. **Smart grouping**: Related Terms together
5. **Split if needed**: Sub-domains if >400 lines

### Step 7: Compliance Validation

**USE AGENT** [`agent-aikido-validator`](../prompts/hard_points/agents/agent-aikido-validator.md):

```markdown
AGENT: agent-aikido-validator

Prompt:
"Validate generated glossaries against AI-KIDO rules.

Files: /prompts/gen/concepts/glossaires/*.md (all glossaries + index.md)

Required validations:
1. Constraint ≤500 lines per glossary (Rule 4)
2. Complete and compliant frontmatter
3. Bidirectional links (glossaries ↔ personas ↔ index) (Rule 6)
4. Correct location in `/prompts/gen/concepts/glossaires/`
5. Complete index navigation

Return:
- Compliance score per file
- Detected issues with actionable quick fixes
- Global decision: PASS/FAIL

Mode: <3k tokens per file"

Expected result: Full validation + quick fixes if needed
```

**Automatic validation output**:
```
AI-KIDO COMPLIANCE VALIDATION:

Validated glossaries:
OK glossaire-[domain1].md: [X]/500 lines, frontmatter OK, links OK
OK glossaire-[domain2].md: [Y]/500 lines, frontmatter OK, links OK
OK index.md: [Z]/500 lines, navigation OK

Global compliance: 100%

Detected issues: [COUNT]
- [List of issues with quick fixes if needed]

Continue with Memory Bank integration? (y/n)
```

**If non-compliance detected**:
- Apply proposed quick fixes automatically
- Split glossaries >500 lines
- Fix missing bidirectional links
- Add missing frontmatter

### Step 8: Memory Bank Integration

#### 8.1 Update Concepts Index

**Update** [`/prompts/gen/concepts/index.md`](../prompts/gen/concepts/index.md):
```markdown
## Available Files

- [`guideline-prompts.md`](guideline-prompts.md): Effective prompts guidelines
- [`glossaires/`](glossaires/index.md): **Business glossaries split by domains** ([X] Terms, [Y] Domains)
```

#### 8.2 Update Main Index

**Update** [`/prompts/index.md`](../prompts/index.md):
```markdown
## Structure

- [`concepts/`](concepts/index.md): Core concepts + **business glossaries by domains**
```

#### 8.3 Bidirectional Links to Personas

**For each mapped expert persona**, add glossary reference:
```markdown
## Domain of Expertise

**Associated glossary**: [`/prompts/gen/concepts/glossaires/glossaire-[domain].md`](../../concepts/glossaires/glossaire-[domain].md)
```

## Output

**Success - Split Generation**:
```
Business glossaries generated successfully!

Created structure:
/prompts/gen/concepts/glossaires/
├── index.md (navigation + search)
├── glossaire-[domain1].md ([X] Terms, [Y] lines)
├── glossaire-[domain2].md ([X] Terms, [Y] lines)
└── ... ([N] glossaries total)

Statistics:
- Total Terms: [X]
- Covered Domains: [Y]
- Mapped expert personas: [Z]
- Compliance <=500 lines: 100%

Memory Bank Integration:
- Concepts index updated
- Main index updated
- Bidirectional persona links created

Agents used:
- explore-bank: Context detection
- truth-evaluator: Source validation
- raci-delegator: Domain Classification
- validator: Compliance validation

Glossaries optimized for semantic search!
```

## Notes

**Error handling**:
- **explore-bank unavailable**: Degraded mode with manual scan
- **truth-evaluator unavailable**: Manual source validation
- **raci-delegator unavailable**: Manual domain Classification
- **validator unavailable**: Manual compliance check (`wc -l`, `grep`)
- **No Terms detected**: Propose manual entry
- **Missing expert persona**: Propose creation via `/create-persona`
- **Glossary >500 lines**: Automatic split via validator
- **Definition conflicts**: Use truth-evaluator for arbitration
- **AI-KIDO non-compliance**: Apply validator quick fixes automatically
- **Insufficient permissions**: Propose alternative directory

**AI-KIDO rules respected**:
- Rule 4: <=500 lines constraint per glossary (validated by validator)
- Rule 6: Bidirectional links (validated by validator)
- Rule 2: gen/hard_points separation (location validated)
- Rules 16-18: Bidirectional links (glossaries ↔ personas ↔ index)
- Agent orchestration: explore-bank, truth-evaluator, raci-delegator, validator
- Automatic validation: AI-KIDO compliance verified by validator
- Domain split: Tree optimized for semantic search
- Expert personas mapping: Glossary ↔ expertise link
- Semantic compression: Concise definitions, inline examples
- AI-KIDO Exclusions: Focus on project business Terms

**Optimization gains (4 AI-KIDO agents)**:

| Aspect | Before (manual) | After (agents) | Gain |
|--------|-----------------|----------------|------|
| **Context detection** | Manual multi-file scan | explore-bank automatic | ~40% tokens |
| **Source validation** | Manual identification + resolution | truth-evaluator intelligent | ~35% tokens |
| **Domain Classification** | Manual mapping + calculations | raci-delegator automatic | ~30% tokens |
| **Compliance validation** | Manual checks | validator systematic | +Quality guarantee |
| **Global workflow** | ~80k tokens estimated | ~36k tokens | ~55% efficiency |

---

*Command optimized with 4 AI-KIDO agents - Estimated global gain: ~55% tokens*
