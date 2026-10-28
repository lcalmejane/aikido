---
description: "Analyze and update CLAUDE.md based on AI-KIDO Memory Bank and CLAUDE.md concepts"
---

# /check-claude

**Purpose**: Analyze the current state of the AI-KIDO Memory Bank and update [`CLAUDE.md`](../../../CLAUDE.md) to reflect the real mapping between your structure and the CLAUDE.md standard, then generate mapping files for Claude Code (`.claude/agents/` and `.claude/commands/`).

---

## Usage

[MANDATORY]
/check-claude

## Prerequisites

- AI-KIDO Memory Bank initialized in `/prompts/gen/`
- Personas present in `/prompts/gen/personas/`
- Commands present in `prompts/hard_points/commands/`

## Steps

### Phases 1 to 4: Validate CLAUDE.md against Claude CLI standards.

### Phase 5: AGENTS.md Synchronization

#### 5.1 Compliance Verification

**Verify** that [`AGENTS.md`](../../../AGENTS.md) follows rules 16-18:

```
VERIFICATION AGENTS.MD

Rule 16 (Single interface): [COMPLIANT/NON-COMPLIANT]
- Content duplication: [YES/NO]
- Exclusive links to /prompts/gen/: [YES/NO]

Rule 17 (Bidirectionality): [COMPLIANT/NON-COMPLIANT]
- Agents without persona: [LIST]
- Personas without agent: [LIST]

Rule 18 (Standard structure): [COMPLIANT/NON-COMPLIANT]
- Missing sections: [LIST]
```

#### 5.2 Proposed Corrections

**If non-compliant**, propose corrections:

```
PROPOSED CORRECTIONS FOR AGENTS.MD

1. Remove content duplications
2. Add missing links to /prompts/gen/personas/
3. Create missing sections:
   - [List of sections to add]
4. Synchronize agent list with existing personas

Apply these corrections? (y/n):
```

#### 5.3 Apply Corrections

**If accepted**, update [`AGENTS.md`](../../../AGENTS.md) automatically.

### Phase 5bis: Generation of Individual Agent Files

#### 5bis.1 Create the .claude/agents/ Directory

**Goal**: Create individual agent files so the `/agents` command in Claude Code recognizes them.

**Create the directory** if it does not exist:
```bash
mkdir -p .claude/agents/
```

#### 5bis.2 Generate Agent Files (Minimalist and Actionable Mappings)

**For each persona in `/prompts/gen/personas/`**:

1. **Check existence**:
   - Check if `.claude/agents/[slug].md` already exists
   - If it exists, compare the front-matter description with that of the source persona
   - If identical and structure is compliant, **SKIP** (do not recreate)
   - If different or structure is incorrect, **UPDATE**

2. **Extract metadata** (only if the file needs to be created/updated):
   - Persona slug from the file name (e.g., `expert-fonctionnel-ba.md` → `expert-fonctionnel-ba`)
   - Description: Combine specialization (persona) + usage conditions (whenToUse from .roomodes or persona) on **a single line**
   - Tools: Extract permissions or set default `Read, Grep, Glob, Bash`
   - Model: Extract from persona front-matter `model` (keep "inherit" if present)
   - Full name: Extract from front-matter `name` or persona `#` title
   - Lines: Count source persona file lines (for metrics)

3. **Create/Update** a file `.claude/agents/[agent-name].md` with the **minimalist actionable structure**:

```markdown
---
name: [agent-name]
description: [ONE-line description from persona frontmatter]
tools: [Tools from persona]
model: [inherit/sonnet/haiku from persona]
---

# [Emoji] [Agent Full Name]

You are the [Full Name]. [Mission in 1 sentence from persona].

**Full specification**: `/prompts/gen/personas/[agent-name].md` ([X] lines)

---

⚠️ **INTERNAL AGENT - DO NOT LOAD `/prompts/index.md` but still load `aikido.md`** ⚠️

**ONLY for `agent-aikido-*` agents (internal AI-KIDO agents)**:

As an internal AI-KIDO agent, you already have the necessary rules. **NEVER load** the `index.md` entry point — it is intended for external agents and the main LLM, not for specialized agents like you who operate directly on the structure.

**Note**: This warning must appear ONLY for agents whose name starts with `agent-aikido-`. Other agents may load the index normally.

---

## When to Use

**Use this agent when:**
- [Use case 1 from persona/roomodes]
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
[Structure description]

[Metrics section]
\`\`\`

## Performance

- **Tokens**: [average value]
- **Time**: [average value]
- **[Other metric]**: [value]
- **[Other metric]**: [value]

---

**Full details**: Read `/prompts/gen/personas/[agent-name].md`
```

**STRICT MINIMALIST GENERATION PRINCIPLES**:

Include (actionable only):
- YAML front-matter (name, description, tools, model)
- **Internal agent warning** (ONLY for `agent-aikido-*` agents)
- When to Use (5 use cases + 3 anti-patterns)
- Usage Examples (4 short input-only examples)
- Input format (expected parameters)
- Output format (returned structure)
- Performance metrics (tokens, time, key metrics)
- Link to full persona

Exclude (not actionable):
- Detailed internal process (steps, algorithms)
- Detailed inter-phase workflows
- Internal checkpoints
- Theoretical explanations
- Verbose examples with full input → output
- Complex matrix tables
- Implementation details

**GENERATION TEMPLATE**:

The template must be **50-80 lines MAXIMUM** and follow EXACTLY this format:

```
[YAML FRONTMATTER - 5 lines]
---
name: [slug]
description: [1 line]
tools: [list]
model: [inherit/sonnet/haiku]
---

[HEADER - 3 lines]
# [Emoji] [Name]
You are... [1 sentence mission]
**Full specification**: [link] ([X] lines)

[WHEN TO USE - 12 lines]
## When to Use
**Use this agent when:**
- [5 bullet points]
**Don't use when:**
- [3 bullet points]

[USAGE EXAMPLES - 8 lines]
## Usage Examples
```markdown
"[4 input-only examples]"
```

[INPUT - 6 lines]
## Input
```markdown
[Parameter format]
```

[OUTPUT - 8 lines]
## Output
```markdown
[Return structure]
```

[PERFORMANCE - 6 lines]
## Performance
- [4 key metrics]

[FOOTER - 2 lines]
---
**Full details**: [link]
```

**EXTRACTION FROM SOURCE PERSONA**:

To generate the minimalist mapping, extract from the source persona:

1. **Frontmatter**: name, description, tools, model (direct copy)
2. **Mission**: First sentence of the persona or "Core Mission" section
3. **When to Use**:
   - Extract from "When to Use" or "Automatic triggers" section (5 cases)
   - Extract anti-patterns or create generic ones (3 cases)
4. **Usage Examples**:
   - Extract 4 examples from "Quick Usage Examples" section
   - Format: input-only (no detailed output)
5. **Input/Output**: Extract from "Input Format" and "Output Format" sections
6. **Performance**: Extract metrics from "Performance Characteristics" section

**STRICT RULES**:
- Final file: 50-80 lines MAXIMUM
- Preserve exact YAML frontmatter from persona
- 100% focus on "how to use" (when + input/output)
- No duplication of internal process/algorithms
- Link to full persona for details
- **Internal agent warning**: ADD the warning section "⚠️ INTERNAL AGENT - DO NOT LOAD `/prompts/index.md`" ONLY if the agent name starts with `agent-aikido-*`
- No multi-step process descriptions
- No internal checkpoints/validation
- No complex tables
- No verbose examples with full output

**Generation algorithm (dynamic scan)**:
1. **Dynamically scan** all `.md` files in `/prompts/gen/personas/` (excluding `index.md`)
   - Use `find` or `glob` to list files at runtime
   - Never use a hardcoded or predefined list
2. For each detected persona file:
   - Extract the slug from the file name (e.g., `expert-ba.md` → `expert-ba`)
   - **Check if `.claude/agents/[slug].md` already exists**
   - If it exists, read the front-matter to compare description, tools, and model
   - If identical and structure is compliant, **SKIP** (do not recreate)
3. For files to create/update only:
   - **Description**: Extract from persona front-matter `description` (already contains specialization + whenToUse on one line)
   - **Tools**: Deduce from persona context or use default `Read, Grep, Glob, Bash`
   - **Model**: Extract from persona front-matter `model` (keep "inherit" as-is)
   - Create/Overwrite agent file `.claude/agents/[slug].md` with:
     - Complete YAML front-matter (name, description, tools, model)
     - Two blank lines after `---`
     - Instructions to dynamically load the persona (NOT the full content)

**Important**:
- The persona list is NOT hardcoded. It is discovered at each execution.
- Existing and synchronized agent files are NOT recreated (optimization).

**Concrete example**:
```markdown
---
name: agent-aikido-explore-bank
description: Searches and extracts information from AI-KIDO Memory Bank. Call when users ask about concepts/techniques/personas, before complex tasks, or exploring project patterns proactively.
tools: Read, Grep, Glob, Bash
model: inherit
---

# Agent agent-aikido-explore-bank

This agent executes the full persona from `/prompts/hard_points/agents/agent-aikido-explore-bank.md`.

**EXECUTION**: I will now load and activate the full persona.

\`\`\`
Loading /prompts/hard_points/agents/agent-aikido-explore-bank.md and activating persona...
\`\`\`
```

3. **Validation**:
- One file per persona in `.claude/agents/`
- Valid YAML front-matter with `name`, `description`, `tools`, and `model`
- Description on ONE single line combining specialization + usage conditions
- Model preserved as-is ("inherit" if present in persona)
- Description ends with `\n\n` (two newlines)
- **Dynamic reference** to `/prompts/gen/personas/` (no duplication)
- 1:1 synchronization with files in `/prompts/gen/personas/`

#### 5bis.3 Detection and Synchronization Verification

**Verify consistency** between:
1. `/prompts/gen/personas/*.md` (source of truth)
2. `.roomodes` (project configuration file)
3. `agents_list.md` (agents interface)
4. `AGENTS.md` (central documentation)
5. `.claude/agents/*.md` (agent files for Claude Code)

**Synchronization matrix**:

**Dynamically scan**:
1. List all `.md` files in `/prompts/gen/personas/` (excluding `index.md`)
2. For each detected file, check presence in:
   - `.roomodes` (if the file exists)
   - `agents_list.md` (if the file exists)
   - `.claude/agents/`
3. Generate a matrix with results

Example format:
| Persona | /prompts/gen/personas/ | .roomodes | agents_list.md | .claude/agents/ |
|---------|------------------------|-----------|----------------|-----------------|
| [name-1] | ✅ | [✅/❌/N/A] | [✅/❌/N/A] | [✅/❌] |
| [name-2] | ✅ | [✅/❌/N/A] | [✅/❌/N/A] | [✅/❌] |
| ... | ... | ... | ... | ... |

**Alerts on Desynchronization**:
- Persona in /prompts/gen/personas/ but absent from .claude/agents/
- Agent in .claude/agents/ but persona file not found
- Description inconsistency between .roomodes and agent file

**Display result**:

```
GENERATION .CLAUDE/AGENTS/

Scan /prompts/gen/personas/: [NUMBER] file(s) detected

Agent files analyzed:
- [persona-1].md: Synchronized (not modified)
- [persona-2].md: Created
- [persona-3].md: Updated (description changed)
- ...

Statistics:
- Already synchronized (skipped): [NUMBER]
- Created: [NUMBER]
- Updated: [NUMBER]
- Total: [NUMBER]

Directory: .claude/agents/
YAML Validation: [Valid / Error]
Synchronization with /prompts/gen/personas/: [100% / Desynchronized]

Agents are now available via the /agents command in Claude Code
```

**Important note**: These files **dynamically reference** personas from `/prompts/gen/personas/`, instructing Claude Code to load the persona file at activation time, avoiding any content duplication (compliant with Rule 16).

### Phase 5ter: Generation of Individual Command Files

#### 5ter.1 Create the .claude/commands/ Directory

**Goal**: Create command files so Claude Code recognizes them via the `/list` command.

**Create the directory** if it does not exist:
```bash
mkdir -p .claude/commands/
```

#### 5ter.2 Generate Command Files

**For each command in `prompts/hard_points/commands/`**:

1. **Check existence**:
   - Check if `.claude/commands/[name].md` already exists
   - If it exists, compare the front-matter description with that of the source file
   - If identical and structure is compliant, **SKIP** (do not recreate)
   - If different or structure is incorrect, **UPDATE**

2. **Extract metadata** (only if the file needs to be created/updated):
   - Command name from file name (e.g., `check-claude.md` → `check-claude`)
   - Description from YAML front-matter `description` of the file `prompts/hard_points/commands/*.md`

3. **Create/Update** a file `.claude/commands/[command-name].md` with the following structure:

```markdown
---
description: [Short description on a single line from prompts/hard_points/commands/[command-name].md]
---

# Command [command-name]

This command executes the full command file from `prompts/hard_points/commands/[command-name].md`.

**EXECUTION**: I will now read and execute the full command.

\`\`\`
Reading prompts/hard_points/commands/[command-name].md and executing instructions...
\`\`\`
```

**IMPORTANT**: The command file must:
- Have a simple YAML front-matter with `description` (description on **a single line**)
- The description must end with `\n\n` (two newlines after the closing `---` of the front-matter)
- **NOT duplicate content** — only dynamically reference `prompts/hard_points/commands/[command-name].md`
- Instruct Claude Code to read and execute the source file

**Generation instructions (dynamic scan)**:

1. **Dynamically scan** all `.md` files in `prompts/hard_points/commands/`
   - Use Glob or Find to list files at runtime
   - NEVER use a hardcoded or predefined list

2. **For each detected file**:
   - Extract the file name (e.g., `analyse-aikido.md`)
   - Extract the command name (e.g., `analyse-aikido`)
   - **Check if `.claude/commands/[name].md` already exists**
   - If it exists, read the front-matter to compare the description
   - If identical and structure is compliant, **SKIP** (do not recreate)

3. **For files to create/update only**, create the file `.claude/commands/[name].md` following EXACTLY this template:

```
---
description: [DESCRIPTION_EXTRACTED_FROM_SOURCE_FILE]
---
[BLANK_LINE_HERE]
# Command [command-name]

This command executes the full command file from `prompts/hard_points/commands/[file-name].md`.

**EXECUTION**: I will now read and execute the full command.

```
Reading prompts/hard_points/commands/[file-name].md and executing instructions...
```
```

**STRICT RULES**:
- Follow EXACTLY the template above
- The description must end with `\n\n` (two newlines after the closing `---`)
- Replace only the placeholders in brackets
- Preserve the structure, headings, and exact text
- NEVER duplicate the content of the source file
- NEVER modify the template or add extra content
- Do NOT recreate already synchronized files (check before creating)

**Important**:
- The command list is discovered dynamically at each execution
- Existing and synchronized command files are NOT recreated (optimization)

**Concrete example**:

For file `prompts/hard_points/commands/analyse-aikido.md` with description:
```markdown
---
description: "Complete audit of AI-KIDO truth tables to detect deviations, inconsistencies, and broken links"
---
[... full content ...]
```

Generates file `.claude/commands/analyse-aikido.md`:
```markdown
---
description: "Complete audit of AI-KIDO truth tables to detect deviations, inconsistencies, and broken links"
---

# Command analyse-aikido

This command executes the full command file from `prompts/hard_points/commands/analyse-aikido.md`.

**EXECUTION**: I will now read and execute the full command.

\`\`\`
Reading prompts/hard_points/commands/analyse-aikido.md and executing instructions...
\`\`\`
```

4. **Validation**:
- One file per command in `.claude/commands/`
- Valid YAML front-matter with `description` on 1 line
- Description ends with `\n\n` (two newlines)
- **Dynamic reference** to `prompts/hard_points/commands/` (no duplication)
- 1:1 synchronization with files in `prompts/hard_points/commands/`
- Already synchronized files are not recreated

#### 5ter.3 Detection and Synchronization Verification

**Verify consistency** between:
1. `prompts/hard_points/commands/*.md` (source of truth)
2. `.claude/commands/*.md` (command files for Claude Code)

**Synchronization matrix**:

**Dynamically scan**:
1. List all `.md` files in `prompts/hard_points/commands/`
2. For each detected file, check presence in `.claude/commands/`
3. Generate a matrix with results

Example format:
| Command | prompts/hard_points/commands/ | .claude/commands/ |
|---------|-------------------------------|-------------------|
| [command-1] | ✅ | [✅/❌] |
| [command-2] | ✅ | [✅/❌] |
| ... | ... | ... |

**Alerts on Desynchronization**:
- Command in prompts/hard_points/commands/ but absent from .claude/commands/
- Command in .claude/commands/ but source file not found
- Description inconsistency between the two files

**Display result**:

```
GENERATION .CLAUDE/COMMANDS/

Scan prompts/hard_points/commands/: [NUMBER] file(s) detected

Command files analyzed:
- [command-1].md: Synchronized (not modified)
- [command-2].md: Created
- [command-3].md: Updated (description changed)
- ...

Statistics:
- Already synchronized (skipped): [NUMBER]
- Created: [NUMBER]
- Updated: [NUMBER]
- Total: [NUMBER]

Directory: .claude/commands/
YAML Validation: [Valid / Error]
Synchronization with prompts/hard_points/commands/: [100% / Desynchronized]

Commands are now available via the /list command in Claude Code
```

**Important note**: These files **do not duplicate content** but instruct Claude Code to dynamically read and execute the source file `prompts/hard_points/commands/[name].md`, preventing any desynchronization.

### Phase 6: Final Report Generation

#### 6.1 Summary Report

**Create** a report in `/prompts/spec/check-claude-[DATE].md`:

```markdown
# Check-Claude Report - [DATE]

> Version: 1.0 | Date: [DATE AND TIME] | Status: Analysis Report

## Overview

**AI-KIDO Mode**: [STANDARD/LIGHT]
**Overall Compliance**: [PERCENTAGE]%
**CLAUDE.md file**: Updated
**agents_list.md file**: [Compliant / Corrected / Non-compliant]
**AGENTS.md file**: [Compliant / Corrected / Non-compliant]

## Statistics

### AI-KIDO Memory Bank
- Concepts: [NUMBER]
- Techniques: [NUMBER]
- Personas: [NUMBER]
- Use Cases: [NUMBER]
- Hard Points: [NUMBER]
- Commands: [NUMBER]

### CLAUDE.md Equivalence
- Equivalent Skills: [NUMBER]
- Equivalent Subagents: [NUMBER]
- Slash Commands: [NUMBER]
- Resources: [NUMBER]

### Compliance
- Rule 4 (<=500 lines): [PERCENTAGE]%
- Rule 6 (Bidirectional links): [PERCENTAGE]%
- Rule 7 (Balancing): [COMPLIANT/NON-COMPLIANT]
- Rules 16-18 (AGENTS.md): [PERCENTAGE]%

## Detected Gaps

### Critical Gaps
[List of critical gaps requiring immediate action]

### Minor Gaps
[List of minor gaps that can be addressed later]

## Inconsistencies

### Concepts without Technique
[List]

### Techniques without Concept
[List]

### Unsynchronized Personas
[List]

### Missing Links
[List]

## Actions Performed

1. Complete Memory Bank analysis
2. CLAUDE.md file updated
3. [Done/Failed] agents_list.md synchronization
4. [Done/Failed] AGENTS.md synchronization
5. Individual agent files generated in .claude/agents/
6. Individual command files generated in .claude/commands/
7. Correspondence matrix generated
8. Diagrams updated
9. Statistics refreshed

## Recommendations

### Priority Actions
1. [Action 1 with justification]
2. [Action 2 with justification]
3. [Action 3 with justification]

### Secondary Actions
1. [Action 1]
2. [Action 2]

### Ongoing Maintenance
- Run `/check-claude` after each major modification
- Run `/maj-aikido` after each git rebase
- Run `/analyse-aikido` monthly for a full audit

## Correspondence Matrix

[Full matrix generated in Phase 3.2]

## Dependency Graph

[Mermaid diagram generated in Phase 3.3]

---
*Report automatically generated by check-claude on [DATE AND TIME]*
```

## Output

- Updated `CLAUDE.md` (CLAUDE.md <= 100 Lines)
- Generated/updated files in `.claude/agents/` (one per persona)
- Generated/updated files in `.claude/commands/` (one per command)
- Summary report in `/prompts/spec/check-claude-[DATE].md`
- Synchronization matrices displayed in console

## Notes

[IMPORTANT]: Only modifies CLAUDE.md and .claude/ mapping files. Does NOT touch files in /prompts/ or AGENTS.md or agents_list.md.

*Command created to maintain synchronization between AI-KIDO and CLAUDE.md*
