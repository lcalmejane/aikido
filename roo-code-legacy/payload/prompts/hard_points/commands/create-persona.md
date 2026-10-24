---
description: "Interactively create a new AI-KIDO persona or agent (anthropomorphic or technical)"
---

# /create-persona

**Purpose**: Interactively collect information from the user and generate all required AI-KIDO persona or agent files.

---

## Usage

```
/create-persona
```

## Prerequisites

Use Claude Code tools directly (Read, Write, Bash, Glob).

## Core concept

**A persona is a specialized LLM agent** that can be one of two types:

### 1. Anthropomorphic Agent (Human Expert)

Embodies a human expert with:

- **Specific skills** (technologies, methodologies, domains)
- A unique **thinking style** (approach, reasoning, priorities)
- An adapted **communication style** tied to the role
- Characteristic **problem-solving patterns**

### 2. Technical Agent (Specialized Tool)

An atomic technical agent that:

- Performs a **specific task** in an isolated context
- Operates within a **strictly defined scope**
- Guarantees **no pollution of the calling context**
- Returns **precise and factual results**

---

## Steps

### Step -1: Explore Existing Personas

List existing personas quickly to avoid duplicates.

**Optimized method**: Use `agent-aikido-projet-index` for instant listing.

```markdown
AGENT: agent-aikido-projet-index

Prompt:
"List all AI-KIDO personas available in /prompts/gen/personas/.

Return for each persona:
- File name (slug)
- Line count
- Last modified date
- Type (internal agent vs expert)

Output format:
EXISTING PERSONAS ([COUNT])

1. **[slug]** - [LINES] lines - Modified: [DATE]
   Type: [agent-aikido-* = Internal | other = Expert]

Use your JSON cache for instant response (<10ms)."

Expected result: Complete list of personas with metadata
```

**Performance gain**: <10ms vs 1-2s with traditional find/grep

**Fallback if agent unavailable**:

```bash
PERSONAS=$(find prompts/gen/personas -name "*.md" ! -name "index.md" -type f 2>/dev/null)
PERSONA_COUNT=$(echo "$PERSONAS" | wc -l | tr -d ' ')

echo "Existing personas ($PERSONA_COUNT):"
for persona in $PERSONAS; do
  NAME=$(basename "$persona" .md)
  DESC=$(grep -m1 '^description:' "$persona" | sed 's/description: *//; s/"//g' || echo "")
  echo "  - $NAME : $DESC"
done
```

Display to user: "Existing personas: [LIST] — Do you want to create a new similar or complementary persona?"

### Step 0: Choose the agent type

Ask the user:

**Question**: "What type of agent do you want to create?"

Suggested options:

- "Anthropomorphic Agent — Human expert with personality and style (e.g.: Arthur Architect, Merlin AI Expert)"
- "Technical Agent — Specialized tool for an atomic task (e.g.: codebase-analyzer, truth-evaluator)"

Follow the appropriate workflow based on the response.

---

## WORKFLOW A: Anthropomorphic Agent

### Step A1: Ask Question 1

Ask the user:

**Question**: "Enter the name and specialization of the persona."

**Expected format**: `Name | Specialization`

**Example**: "Arthur Architect | Software Architecture"

Suggested options:

- "Data Scientist | Data analysis and ML"
- "Security Expert | Application and infrastructure security"
- "DevOps Engineer | CI/CD and automation"
- "Frontend Developer | Modern user interfaces"

Auto-generate the **slug** and **emoji**:

- **Slug**: Convert name to slug format (e.g.: "Arthur Architect" → "arthur-architect")
- **Emoji**: Select based on specialization:
  - Architecture → 🏗️
  - Development → 💻
  - Security → 🔒
  - Quality/Testing → 🔍
  - DevOps/Deployment → 🚀
  - Design → 🎨
  - Data → 📊
  - Mobile → 📱
  - Default → 🤖

### Step A2: Ask Question 2

Ask the user:

**Question**: "Describe the LLM agent you want to create (specific skills, thinking style, communication style)."

**Expected details**:

1. TECHNICAL SKILLS: Technologies, frameworks, tools, methodologies
2. THINKING STYLE: Problem approach, priorities, reasoning process
3. COMMUNICATION STYLE: Expression, pedagogy, level of detail

Suggested options:

- "Microservices architecture expert focused on scalability and resilience"
- "Security specialist with defensive approach and systematic risk analysis"
- "Pragmatic full-stack developer favoring simplicity and maintainability"

### Step A3: Ask Question 3

Ask the user:

**Question**: "What permissions does this agent require?"

**Options**: read, edit, browser, command

Suggested options:

- "read, edit (file read and write)"
- "read, edit, command (+ command execution)"
- "read, edit, browser, command (all permissions)"
- "read (read-only)"

### Step A4: Validate slug uniqueness

After receiving all 3 responses:

1. Validate slug uniqueness in the existing agents list.
2. If conflict, propose alternatives: [slug]-v2, [slug]-alt, etc.

### Step A5: Create files using the Write tool

Use the Write tool to create `prompts/gen/personas/[slug].md`:

```markdown
# [emoji] [name] - [specialization]

> **Specialized LLM Agent** — This persona transforms the LLM into an expert with specific skills and a distinctive thinking style.

## Agent Identity

### Role
[description of the LLM agent's role]

### Specialization
[technical/methodological specialization]

## Agent Skills

### Technical Expertise
[technologies, frameworks, tools mastered]

### Methodologies
[approaches, practices, patterns used]

### Application Domains
[contexts and usage situations]

## Thinking Style

### Problem Approach
[how this agent analyzes and breaks down problems]

### Priorities
[what guides decisions: performance, security, maintainability, etc.]

### Reasoning Process
[typical steps for reflection and resolution]

## Communication Style

### Expression
[tone, vocabulary, level of formality]

### Pedagogy
[how the agent explains and shares knowledge]

### Level of Detail
[depth of explanations and justifications]

## Permissions
[permissions required to operate]

## REMEMBER: Scope and Limits

**You are [name], your role is [main role].**

### What you MUST do:
- [Main responsibility 1]
- [Main responsibility 2]
- [Main responsibility 3]

### What you MUST NOT do:
- Do not operate outside your domain of expertise
- Do not suggest improvements outside your scope
- Do not perform unsolicited analyses
- Do not critique choices outside your specialization

**Stay focused on your expertise and your unique added value.**

## System Prompt

This persona prompts the LLM to fully embody this expert, including:
- Technical and methodological skills
- Unique problem analysis and resolution approach
- Communication and explanation style
- Professional priorities and values
- Clearly defined action scope

---
*LLM agent created on [date] via create-persona*
```

### Step A6: Update agents_list.md

Use the Edit tool to update `agents_list.md` with the new persona section.

---

## WORKFLOW B: Technical Agent

### Step B1: Ask Question 1

Ask the user:

**Question**: "Enter the name and description of the technical agent."

**Expected format**: `agent-name | Short description`

**Example**: "codebase-analyzer | Analyzes code implementation details"

Suggested options:

- "documentation-writer | Generates technical documentation"
- "test-generator | Creates unit and integration tests"
- "security-auditor | Analyzes security vulnerabilities"
- "performance-analyzer | Evaluates code performance"

Auto-generate the **slug** (already in the correct format).

### Step B2: Ask Question 2

Ask the user:

**Question**: "Describe the scope and responsibilities of this technical agent."

**Expected details**:

1. MAIN RESPONSIBILITY: What is its unique atomic task?
2. SCOPE: What must it do EXACTLY (and nothing else)?
3. LIMITS: What is STRICTLY FORBIDDEN?

Suggested options:

- "Analyze existing code implementation without suggesting improvements"
- "Generate documentation from code without evaluating quality"
- "Create tests for existing code without refactoring"

### Step B3: Ask Question 3

Ask the user:

**Question**: "Which tools are required for this agent?"

**Options**: Read, Write, Grep, Glob, LS, Execute

Suggested options:

- "Read, Grep, Glob, LS (code analysis)"
- "Read, Write (file generation)"
- "Read, Grep, Execute (tests and validation)"
- "Read, Glob, LS (structure exploration)"

### Step B4: Ask Question 4

Ask the user:

**Question**: "Which model should this agent use?"

**Options**: inherit, sonnet, haiku, opus

Suggested options:

- "inherit (inherits from the calling context model — recommended)"
- "sonnet (balanced performance/cost)"
- "haiku (fast and economical)"
- "opus (maximum capabilities)"

### Step B4bis: Ask Question 5

Ask the user:

**Question**: "What color identifies this agent in the interface?"

**Options**: yellow, blue, green, red, purple, cyan, orange, magenta

Suggested options:

- "yellow (exploration/research)"
- "blue (validation/verification)"
- "green (creation/modification)"
- "red (classification/routing)"
- "purple (evaluation/arbitration)"
- "cyan (population/orchestration)"
- "orange (balancing/structure)"
- "magenta (indexing/synchronization)"

### Step B5: Create persona and agent files using the Write tool

#### B5.1 Create the persona file at `/prompts/gen/personas/[slug].md`

Use the Write tool to create `/prompts/gen/personas/[slug].md`:

```markdown
---
name: [slug]
description: [short description]. Call the [slug] agent when you need to [use case]. As always, the more detailed your request prompt, the better! :)
tools: [tools list]
model: [model]
color: [color]
---

🚨 **CRITICAL - INTERNAL AI-KIDO AGENT** 🚨

**YOU ARE AN INTERNAL AGENT OF THE AI-KIDO MEMORY BANK.**

**DO NOT EVER LOAD `/prompts/index.md`**

`agent-aikido-*` agents are **specialized internal agents** that operate directly on the Memory Bank structure. They already have intrinsic knowledge of the AI-KIDO architecture and must **NEVER** load the `index.md` entry point, which is intended for external agents and the main LLM.

**Why this restriction?**
- You are already configured with the AI-KIDO rules needed for your mission
- Loading `index.md` would create costly token redundancy
- It would break the mono/multi-project model (you operate as an "architect", not a "user")
- Your execution constraints are optimized to work directly on files

**Correct action**: Operate directly on Memory Bank files according to your execution constraints below.

**IMPORTANT NOTE**: This warning must appear ONLY if the slug starts with `agent-aikido-`. Otherwise, DELETE this entire section.

---

You are a specialist at [main specialization]. Your job is to [main responsibility] with precise file:line references.

## CRITICAL: YOUR ONLY JOB IS [STRICT SCOPE IN UPPERCASE]
- DO NOT [restriction 1] unless the user explicitly asks for them
- DO NOT [restriction 2] unless the user explicitly asks for them
- DO NOT [restriction 3] unless the user explicitly asks for them
- DO NOT [restriction 4]
- DO NOT [restriction 5]
- DO NOT [restriction 6]
- ONLY [what is allowed]

## Core Responsibilities

1. **[Responsibility 1]**
   - [Detail 1]
   - [Detail 2]
   - [Detail 3]

2. **[Responsibility 2]**
   - [Detail 1]
   - [Detail 2]
   - [Detail 3]

3. **[Responsibility 3]**
   - [Detail 1]
   - [Detail 2]
   - [Detail 3]

## [Strategy/Methodology Name]

### Step 1: [First Step]
- [Action 1]
- [Action 2]
- [Action 3]

### Step 2: [Second Step]
- [Action 1]
- [Action 2]
- [Action 3]

### Step 3: [Third Step]
- [Action 1]
- [Action 2]
- [Action 3]

## Output Format

Structure your [output type] like this:

\`\`\`
## [Main Title]

### [Section 1]

[Content with file:line references]

### [Section 2]

[Structured content]

### [Section 3]

[Details with examples]
\`\`\`

## Important Guidelines

- **Always include file:line references** for claims
- **[Guideline 2]** [explanation]
- **[Guideline 3]** [explanation]
- **Focus on [main focus]** not [what to avoid]
- **Be precise** about [precision elements]
- **Note [elements to note]** with [format]

## What NOT to Do

- Don't [detailed restriction 1]
- Don't [detailed restriction 2]
- Don't [detailed restriction 3]
- Don't [detailed restriction 4]
- Don't [detailed restriction 5]
- Don't [detailed restriction 6]
- Don't [detailed restriction 7]
- Don't [detailed restriction 8]

## REMEMBER: You are a [role metaphor], not a [what you are not]

Your sole purpose is to [unique objective] with surgical precision and exact references. You are creating [deliverable type] of the existing [subject], NOT performing a [forbidden action] or [another forbidden action].

Think of yourself as a [professional analogy] documenting an existing system for someone who needs to understand it, not as a [counter-example] evaluating or improving it. Help users [user objective] exactly as it exists today, without any judgment or suggestions for change.

---
*Technical agent created on [date] via create-persona*
```

#### B5.2 Create the minimal mapping file at `.claude/agents/[slug].md`

Use the Write tool to create `.claude/agents/[slug].md` with the **minimal actionable format (50-80 lines)**:

```markdown
---
name: [slug]
description: [short description from persona frontmatter]
tools: [tools list from persona]
model: [model from persona]
---

# [Formatted Agent Name]

You are the [Formatted Name]. [Mission in 1 sentence].

**Full specification**: `/prompts/gen/personas/[slug].md` ([X] lines)

---

⚠️ **INTERNAL AGENT — DO NOT LOAD `/prompts/index.md` but do load `aikido.md`** ⚠️

**ONLY for `agent-aikido-*` agents (internal AI-KIDO agents)**:

As an internal AI-KIDO agent, you already have the necessary rules. **NEVER load** the `index.md` entry point — it is intended for external agents and the main LLM, not for specialized agents like you that operate directly on the structure.

**Note**: This warning must appear ONLY for agents whose name starts with `agent-aikido-`. Other agents may load the index normally.

---

## When to Use

**Use this agent when:**
- [Use case 1 from persona]
- [Use case 2]
- [Use case 3]
- [Use case 4]
- [Use case 5]

**Don't use when:**
- [Anti-pattern 1]
- [Anti-pattern 2]
- [Anti-pattern 3]

## Usage Examples

\`\`\`markdown
"[Example input 1]"
"[Example input 2]"
"[Example input 3]"
"[Example input 4]"
\`\`\`

## Input

\`\`\`markdown
[FORMAT]: [description]
[PARAM1]: [description]
[PARAM2]: [description]
\`\`\`

## Output

\`\`\`markdown
# [Output Title]

## [Section 1]
[Structure description]

## [Section 2]
[Metrics/results]
\`\`\`

## Performance

- **Tokens**: [average value]
- **Time**: [average value]
- **[Metric 3]**: [value]
- **[Metric 4]**: [value]

---

**Full details**: Read `/prompts/gen/personas/[slug].md`
```

**IMPORTANT**: The "INTERNAL AGENT" warning must appear ONLY if the slug starts with `agent-aikido-`. Otherwise, remove this section from the mapping.

### Step B6: Update agents_list.md

Use the Edit tool to update `agents_list.md` with the new technical agent section.

---

## Output

### For Anthropomorphic Agent

```
Anthropomorphic LLM Agent "[name]" created successfully!

This agent embodies an expert in [specialization] with:
   - Specific skills in [domains]
   - A thinking style oriented toward [priorities]
   - A [characteristics] communication style
   - A clearly defined action scope

Files created/modified:
   - prompts/gen/personas/[slug].md (full agent definition)
   - agents_list.md (documentation)

Use the slug "[slug]" to activate this LLM agent.
The LLM will then adopt the skills and thinking style of this expert.
```

### For Technical Agent

```
Technical Agent "[slug]" created successfully!

This technical agent performs [task] in an isolated context:
   - Strict scope: [scope]
   - Available tools: [tools]
   - Model: [model]
   - Guarantees no pollution of the calling context

Files created/modified:
   - /prompts/gen/personas/[slug].md (full source persona)
   - .claude/agents/[slug].md (minimal actionable mapping)
   - agents_list.md (documentation)

Use the slug "[slug]" to activate this technical agent.
The agent will perform its atomic task in an isolated context.
```

## Notes

### Error handling

- **Existing slug**: Propose [slug]-v2, [slug]-alt, etc.
- **Invalid permissions**: Re-ask with valid list
- **Incorrect format**: Re-ask with example
- **Emoji failure**: Use 🤖 by default (anthropomorphic) or 🔧 (technical)
- **Invalid tools**: Re-ask with valid list (Read, Write, Grep, Glob, LS, Execute)
- **Invalid model**: Re-ask with valid list (sonnet, haiku, opus)

### Mandatory REMEMBER Section

**ALL agents (anthropomorphic AND technical) MUST have a REMEMBER section** that:

1. Restates the agent's main role
2. Lists what it MUST do
3. Lists what it MUST NOT do
4. Prevents scope drift

This section is CRITICAL for maintaining specialization and avoiding context drift.

### Anti-Index Warning for Internal AI-KIDO Agents

**ALL technical agents whose slug starts with `agent-aikido-*` MUST include the anti-loading warning for `/prompts/index.md`**:

1. **In the source persona** (`/prompts/gen/personas/[slug].md`): FULL warning with detailed explanation
2. **In the mapping** (`.claude/agents/[slug].md`): MINIMAL warning in the dedicated section
3. **Strict condition**: This warning must appear ONLY for `agent-aikido-*` agents (internal agents)
4. **Reason**: These agents already have the AI-KIDO rules and loading the index would create costly token redundancy

For all other agents: no warning; they may load the index normally.

### Dual File Requirement for Technical Agents

**ALL technical agents MUST create TWO files**:

1. **Source persona**: `/prompts/gen/personas/[slug].md`
   - Full agent definition with frontmatter (name, description, tools, model, color)
   - Warning section (if `agent-aikido-*`)
   - Responsibilities, strategy, output format, guidelines
   - Mandatory REMEMBER section

2. **Minimal mapping**: `.claude/agents/[slug].md`
   - Actionable format 50-80 lines
   - Frontmatter identical to persona
   - Minimal warning section (if `agent-aikido-*`)
   - When to Use, Usage Examples, Input/Output, Performance
   - Link to full persona

Do not create only the mapping — both files are required for consistency and knowledge capitalization.
