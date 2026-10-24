---
description: "Analyze and optimize AI-KIDO commands with available technical agents"
---

# /optimize-command-with-aikido-agents

**Purpose**: Automatically analyze all AI-KIDO commands to identify optimization opportunities with available specialized technical agents, then propose and apply the optimizations.

---

## Usage

```
/optimize-command-with-aikido-agents
```

## Prerequisites

- AI-KIDO Memory Bank initialized with agents in `/prompts/gen/personas/`
- Commands present in `prompts/hard_points/commands/`

## Steps

### CRITICAL CONSTRAINT: Strict Algorithm Preservation

**ABSOLUTE RULE** — Optimization must **NEVER**:
- Modify the algorithm or business logic of commands
- Change the functional workflow steps
- Add or remove features
- Modify the expected final result
- Take initiatives on command functions

**WHAT IS ALLOWED** (Pure substitution only):
- Replace repetitive manual scans (grep/glob) with `agent-aikido-explore-bank` **ONLY IF**:
  - Exploratory search (architecture, concepts, multiple interconnected files)
  - Need for structured context with cross-references
  - Budget allows +89% tokens vs Grep (1,397 vs 740) for 3-5x richer context
  - **DO NOT use** for simple/one-off searches (specific file, single line) — direct Grep preferred
- Replace manual comparisons/arbitrations with `agent-aikido-truth-evaluator`
- Replace manual classifications with `agent-aikido-raci-delegator`
- Replace manual verifications with `agent-aikido-validator`
- Replace manual document creation with `agent-aikido-bank-populate`

**Principle**: Optimization is a **transparent technical substitution** that produces exactly the same functional result with fewer tokens.

**explore-bank Usage Criteria** (empirical tests v5.1):
- Use: Exploratory search, architecture, broad concepts (e.g., "MCP servers", "experimental features")
- Do NOT use: Simple search (e.g., "rooignore.md location"), strict budget, critical performance (<0.05s)

---

### Step 1: Dynamic Inventory of Agents and Commands

Use agent `agent-aikido-explore-bank` for complete inventory and analysis:

```markdown
AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

Prompt for the agent:
"Complete analysis for AI-KIDO command optimization with available technical agents.

## PART 1: Dynamic Inventory of Available Technical Agents

Dynamically scan `/prompts/gen/personas/` to detect ALL AI-KIDO technical agents:
- Pattern: Files `agent-aikido-*.md` (agents starting with 'agent-aikido-')
- Exclude: Non-technical agents, standard consultant personas

For each detected agent, extract:
1. Full name (file slug)
2. Specialization (from frontmatter or title)
3. Use cases (section 'When to use')
4. Key capabilities (section 'Capabilities')
5. Detectable patterns: Automatically identify which manual code patterns this agent can replace
   - Analyze the agent's system prompt
   - Identify main actions (scan, validation, classification, extraction, etc.)
   - Deduce equivalent manual patterns (repetitive greps, comparisons, etc.)

Return table:
| Agent | Specialization | Replaceable patterns | Estimated gain |
|-------|----------------|---------------------|----------------|
| agent-aikido-X | [spec] | [patterns] | [gain]% |

## PART 2: Inventory of Existing Commands

Dynamically scan `prompts/hard_points/commands/`:
- Format: `.md` files only
- Exclude: Backup files (.bak), reports (reports/)

For each command, analyze:
1. Identification:
   - Name (without .md)
   - Description (frontmatter)
   - Size (number of lines)

2. Current Agent Analysis:
   - Search for pattern 'AGENT:' or 'USE AGENT'
   - Extract agent names used
   - Count total number of agents

3. Opportunity Detection:
   For each available agent (PART 1), analyze if its patterns are present in the command:
   - Identify sections/phases of the command
   - Detect manual patterns corresponding to agent capabilities
   - Calculate opportunity score per agent

   CRITICAL CONSTRAINT: Recommend ONLY pure technical substitutions:
   - Replace repetitive scans/greps with explore-bank ONLY IF EXPLORATORY:
     - YES: Architecture search, broad concepts, multiple interconnected files
     - NO: Simple search (specific file/line), strict budget, critical performance
     - Trade-off: +89% tokens (1,397 vs 740) for 3-5x richer context (test v5.1)
   - Replace manual comparisons with truth-evaluator
   - Replace manual classifications with raci-delegator
   - Replace manual verifications with validator
   - NEVER modify the algorithm or business logic
   - NEVER change the functional steps
   - NEVER add or remove features

## PART 3: Scoring and Recommendations

For each command, calculate:
- Detected opportunities: Number of replaceable patterns
- Recommended agents: Agent list + suggested insertion phase
- Estimated token gain: Percentage (based on detected patterns)
- Priority:
  - HIGH: >=3 opportunities AND gain >40%
  - MEDIUM: 2 opportunities OR gain 20-40%
  - LOW: 1 opportunity OR gain <20%
- Complexity: EASY/MEDIUM/HARD (based on command structure)

## FINAL REPORT

Return JSON or Markdown structure:

### Global Summary
- Total available agents: X
- Total commands analyzed: Y
- Total opportunities detected: Z
- Average potential gain: W%

### Opportunity Table by Command
| Command | Current agents | Recommended agents | Opportunities | Estimated gain | Priority | Complexity |
|---------|---------------|-------------------|---------------|----------------|----------|------------|
| [name]  | X agents      | +Y agents         | Z patterns    | W%             | HIGH/MED/LOW | EASY/MEDIUM/HARD |

### Detail by Command (Top 5 priorities)
For each priority command:
#### [Command Name]
- Current agents: [list]
- Detected opportunities (PURE SUBSTITUTIONS only):
  1. Phase/Section [X]: Pattern [Y] -> Recommended agent: [agent-aikido-Z]
     - Type: Technical substitution (no algorithm modification)
     - Replaced manual pattern: [exact description]
     - Estimated gain: [W]%
     - Insertion template: [optimized template for this phase]
     - Guarantee: Identical functional result

Mode: DEEP (exhaustive analysis)
Estimated tokens: <60k"

Expected result: Complete dynamic report with automatically detected opportunities
```

Display in real time:
```
DYNAMIC ANALYSIS IN PROGRESS (agent-aikido-explore-bank DEEP MODE)...

Scan available agents: /prompts/hard_points/agents/agent-aikido-*.md
Extract capabilities and replaceable patterns (per agent)
Scan existing commands: prompts/hard_points/commands/*.md
Detect optimization opportunities (agents x commands)
Calculate priority scoring + complexity
Generate recommendations per command
Dynamic report ready
```

### Step 2: Display Report

Display the report generated by the agent:

```
DYNAMIC OPTIMIZATION REPORT

[Display global summary]
[Display opportunity table by command]

Top 5 optimization priorities:
[Display top 5 detail with recommended agents + templates]
```

### Step 3: User Question — Selection

Ask the **Question: Select commands to optimize**:
```
Which commands do you want to optimize?

1. All commands with opportunities
2. HIGH priority only
3. Manual selection (enter names separated by commas)
4. A single command (enter name without .md)
5. Dry-Run mode (simulation without modification)
6. Cancel

Enter your choice (1-6):
```

### Step 4: Confirmation

Display selection summary and ask for confirmation:
```
Summary:

Commands to optimize:
- [Command 1]: +X agents -> [Y]% estimated gain
- [Command 2]: +X agents -> [Y]% estimated gain
...

Total estimated token gain: [Z]%

This operation will modify files in prompts/hard_points/commands/ and .claude/commands/
Automatic backups (.bak) created for each file

Confirm? (yes/no)
```

## Automatic Optimization Process

For each selected command:

### Phase 1: Read and Backup

```
OPTIMIZING: [command-name]

Read prompts/hard_points/commands/[command-name].md
Backup created: [command-name].md.bak
Parse command structure
```

### Phase 2: Apply Optimizations

For each opportunity detected by agent-aikido-explore-bank:

```
Insert agent [N]/[Total]: [agent-aikido-X] in Phase/Section [Y]
  - Pattern replaced: [description]
  - Template used: [template generated by explore-bank]
  - Estimated gain: ~[Z]%
```

Automatically applied modifications:
1. Insert `AGENT: [agent-name]` sections with optimized prompts
2. Update frontmatter description (mention number of agents)
3. Add summary section of agents used (end of file)

### Phase 3: Compliance Validation

Use agent `agent-aikido-validator` for post-optimization validation:

```markdown
AGENT: agent-aikido-validator
FORMAT: JSON

Prompt for the agent:
"Validate the optimized command against AI-KIDO rules.

File: prompts/hard_points/commands/[command-name].md

Specific validations for optimized commands:
1. Rule 4: Line constraints (<=1000 lines for commands)
2. Agent format: 'AGENT:' sections correctly formatted
3. Workflow coherence: Agents inserted at correct locations (logical phases)
4. Frontmatter: Description updated with agent mention
5. Recap section: Presence of agent summary section

Return:
- Global compliance score: [X]%
- Detected violations: [list with quick fixes]

Mode: <3k tokens"

Expected result: Score + violations if < 90%
```

Display result:
```
VALIDATION (agent-aikido-validator)...

Compliance score: [X]%
[If < 90%: List of violations + proposed quick fixes]
```

**If score < 90%**: Propose automatic corrections or backup restoration
**If score >= 90%**: Continue to Phase 4

### Phase 4: Update Mapping

```
CLAUDE CODE MAPPING...

Backup: .claude/commands/[command-name].md.bak
Update description + agents used
Mapping file updated
```

### Phase 5: Generate Report

Create `prompts/hard_points/commands/reports/optimize-[command-name]-[timestamp].md`:

```markdown
# Optimization Report: [command-name]

**Date**: [timestamp]

## Summary
- Agents added: X agents
- Lines: [before] -> [after]
- Estimated token gain: [X]%
- Final compliance: [X]%

## Applied Optimizations
[List of agents inserted with phases and gains]

## Backup
- Original: prompts/hard_points/commands/[command-name].md.bak
- Mapping: .claude/commands/[command-name].md.bak

To restore: `mv [file].bak [file]`
```

### Phase 6: Update Documentation

If command is newly optimized, update `commands_list.md`:
```
commands_list.md: Add workflow [command-name] if necessary
Section "Optimized commands" updated
```

## Output

### Per-Command Result

```
[command-name] optimized!

Agents integrated: X
Estimated token gain: Y%
Compliance: Z%
Backups: .bak available
Report: reports/optimize-[name]-[timestamp].md
```

### Global Final Result

After all optimizations:

```
GLOBAL OPTIMIZATION COMPLETE!

Statistics:
- Commands analyzed: X
- Commands optimized: Y
- Total agents added: Z
- Average token gain: W%

Modified files:
- prompts/hard_points/commands/: Y commands
- .claude/commands/: Y mappings
- reports/: Y reports

Agent summary per command:
| Command | Agents before | Agents after | Gain |
|---------|--------------|--------------|------|
[Table from real data]

All backups (.bak) available

Next steps:
- Test optimized commands
- Review reports in reports/
- Commit if satisfied or restore from .bak
```

## Notes

### Error Handling

**Analysis Error**:
```
ERROR: Analysis failed

Detail: [message]
Action: 1. Retry / 2. Cancel
```

**Optimization Error**:
```
ERROR: Optimization failed [command-name]

Backup automatically restored
Action: 1. Retry / 2. Skip / 3. Cancel
```

**Validation Error (Score < 90%)**:
```
VALIDATION FAILED: [command-name]

Score: [X]%
Violations: [list]

Backup available
Action: 1. Apply quick fixes / 2. Restore backup / 3. Force
```

### Mode Options

**Dry-Run mode** (choice 5):
- Generate reports without modifying files
- Create `.preview` files for visualization
- No backup required

**Restore mode**:
```bash
# Restore a single command
mv prompts/hard_points/commands/[name].md.bak prompts/hard_points/commands/[name].md
mv .claude/commands/[name].md.bak .claude/commands/[name].md

# Restore all
find .claude/commands -name "*.bak" -exec bash -c 'mv "$1" "${1%.bak}"' _ {} \;
```

### Perpetual Algorithm

**Principle**: Delegate intelligence to `agent-aikido-explore-bank`

1. **Dynamic agent detection**: Scan `/prompts/hard_points/agents/agent-aikido-*.md`
2. **Capability extraction**: Read descriptions and deduce patterns
3. **Command analysis**: Scan `prompts/hard_points/commands/*.md`
4. **Intelligent matching**: Agent patterns <-> Command patterns
5. **Template generation**: Create optimized prompts based on context
6. **Standard application**: Insert agents with unified format

**Adaptability**:
- New agents detected automatically
- New commands analyzed automatically
- Evolving agent patterns (via persona descriptions)
- No hardcoded agents or commands

### AI-KIDO Agents Summary

This command uses **2 AI-KIDO agents** in dynamic mode:

**Step 1: `agent-aikido-explore-bank` (DEEP MODE)**
- Role: Dynamic inventory of available agents + command opportunity analysis
- Output: Complete report with detected agents, analyzed commands, scored opportunities
- Tokens: ~50-60k (DEEP mode with exhaustive analysis)
- Gain: ~80% tokens vs manual multi-file analysis
- Adaptability: Automatically detects new agents and commands

**Phase 3: `agent-aikido-validator`**
- Role: AI-KIDO compliance validation post-optimization
- Output: Compliance score + possible violations with quick fixes
- Tokens: <3k
- Gain: Quality guarantee + early violation detection

### Optimization Gains

| Aspect | Before (manual) | After (agents) | Gain |
|--------|----------------|----------------|------|
| Agent detection | Static hardcoded | Dynamic scanner | Infinite scalability |
| Command analysis | Manual per command | explore-bank batch | ~80% tokens |
| Opportunity matching | Hardcoded rules | Agent intelligence | Adaptable |
| Compliance validation | Manual or absent | Systematic validator | +Quality guarantee |
| Global workflow | ~100k tokens | ~60k tokens | ~40% efficiency |
| Longevity | Maintenance required | Self-adaptive | 100% |

---

*Automatic and perpetual meta-command for optimization — self-adapts to evolution of agents and commands*
