---
description: "Interactive guide to create AI-KIDO commands"
---

# Command: /create-command

Interactive guide for creating new AI-KIDO commands with duplicate detection, expert agent integration (non-internal personas), Memory Bank best practice references, and maximum optimization via internal AI-KIDO agents.

**Creates**: quality AI-KIDO commands by:
- Detecting similar existing commands (avoid duplicates)
- Integrating relevant expert agents (non-internal personas)
- Referencing Memory Bank best practices
- Optimizing with internal AI-KIDO agents
- Respecting all AI-KIDO norms (≤1000 lines for commands — but no split)
- Auto-integrating into `commands_list.md` (agent-aikido-maj-md-index), `CLAUDE.md` (sections 1 and 12), `README.md` (if section detected)

## Usage

```bash
# Interactive mode (recommended)
/create-command

# With initial description
/create-command "Description of the command to create"

# Verbose mode
/create-command --verbose
```

---

## Steps

### Phase 0: Initial Information Collection

```
🎯 AI-KIDO COMMAND CREATION

Question 1: Command name
Format: kebab-case (e.g.: analyse-project, check-truth)
Convention: verb-action or verb-object

Name: _____

Question 2: Short description (1 line)
Describe the command objective in one sentence.
This will appear in the YAML front-matter.

Description: _____

Question 3: Detailed specification
- What problem does it solve?
- What are the expected inputs?
- What outputs are produced?
- What are the main use cases?

Specification:
_____
```

Confirm collected info:
```
📋 COLLECTED INFORMATION
Name: [command-name]
Description: [short description]
Specification: [detailed multi-line spec]
```

### Phase 1: Similar Command Detection (Fast Grep)

Search for similar or related commands using grep:

Extract keywords from name + description → search in `prompts/hard_points/commands/*.md` + check `commands_list.md`.

Display result:
```
🔍 DETECTING SIMILAR COMMANDS...

Similar commands found: [COUNT]

[IF COUNT > 0]
⚠️ SIMILAR COMMANDS DETECTED (by keywords)
[List of found commands]

**Performance**: Direct Grep ~0.1s vs agent ~2-3s (20-30× faster), -85% tokens

[IF exact duplicate]
⛔ WARNING: An identical command already exists!
/[existing-name] does exactly the same thing.
Options:
1. STOP creation
2. MODIFY your command to differentiate it
3. CONTINUE anyway (create duplicate)

[IF merge suggested]
💡 SUGGESTION: Merge possible
/[cmd1] and /[cmd2] have close objectives.
Options:
1. MERGE with /[existing-cmd]
2. CREATE a SPECIALIZED command (specify differentiation)
3. CREATE a NEW distinct command

[IF specialization OK]
✅ Specialization detected — differentiation: [reason]

[IF new OK]
✅ No similar command — unique in the system
```

- STOP or MERGE → EXIT with appropriate message
- MODIFY → Return to Phase 0
- CONTINUE / SPECIALIZATION / NEW → Phase 2

### Phase 2: Relevant Expert Agent Identification 🤖

Invoke `agent-aikido-explore-bank` (QUICK MODE) to find expert personas:

```markdown
🤖 AGENT: agent-aikido-explore-bank (QUICK MODE)
FORMAT: JSON

Prompt:
"Identify relevant expert agents (NON-INTERNAL personas) for the command.

Command to create:
- Name: [command-name]
- Description: [description]
- Spec: [full spec]

Search in: /prompts/gen/personas/ (EXCLUDE internal agents 'agent-aikido-*')

For each NON-INTERNAL persona found:
- Name, slug, specialization
- Relevance: [HIGHLY RELEVANT | RELEVANT | POTENTIALLY USEFUL]
- Relevance reason, skills contributed
- Recommended usage phase (analysis/validation/generation/etc.)

Return: list sorted by relevance (HIGHLY RELEVANT first) + integration recommendation

IMPORTANT: Return ONLY business/technical expert personas.
ABSOLUTELY EXCLUDE all internal AI-KIDO agents (prefix 'agent-aikido-*').

Estimated tokens: ~3-5k"
```

Display and ask:
```
👥 EXPERT AGENTS IDENTIFIED: [COUNT]

[IF COUNT > 0]
🎯 RECOMMENDED EXPERT AGENTS:
1. [Expert Name] — [expert-slug]
   Specialization: [description]
   Relevance: [HIGHLY RELEVANT]
   Skills: [list]
   Recommended phase: [Analysis | Validation | Generation]

For each agent, select (y/n):
1. [expert-slug-1]: ___
2. [expert-slug-2]: ___

[IF COUNT = 0]
ℹ️ No specific expert agent found.
Command will use internal AI-KIDO agents only.
```

### Phase 3: Memory Bank Resource Identification 🤖

Invoke `agent-aikido-explore-bank` (DEEP MODE):

```markdown
🤖 AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

Prompt:
"Identify relevant Memory Bank resources for the command.

Command: [name] | Description: [description] | Spec: [full spec]
Selected expert agents: [list]

Search in:
1. /prompts/gen/concepts/: Related theoretical concepts
2. /prompts/gen/techniques/: Applicable practical techniques
3. /prompts/gen/use_cases/: Similar use cases
4. /prompts/hard_points/: Imperative constraints/rules

For each resource:
- Full path, type (concept/technique/use_case/hard_point), title
- Relevance: [CRITICAL | IMPORTANT | USEFUL | OPTIONAL]
- Relevance reason, section to reference (if applicable)
- Recommended use (context/validation/implementation/examples)

Return: resources sorted by relevance and type + integration recommendations

Estimated tokens: ~5-10k (DEEP mode)"
```

Display categorized results (Hard Points / Concepts / Techniques / Use Cases) — these will be auto-referenced in the command.

### Phase 4: Optimal Internal AI-KIDO Agent Identification

Read `agents_list.md` directly and match spec patterns to agent capabilities:

```
Capability → Agent mapping:
  - Memory Bank inventory/exploration → explore-bank (ONLY if exploratory)
  - Truth source validation → truth-evaluator
  - RACI classification → raci-delegator
  - Header management → doc-header
  - Memory Bank population → bank-populate (END only)
  - Quick compliance validation → validator
  - Tree balancing → balancer
  - Index updates → indexer (maj-md-index)
  - Intelligent merge → fusion

Analyzing spec [command-name]...
Recommended agents: [LIST]
```

**Performance**: Direct `agents_list.md` reference ~0.05s vs agent ~2-3s (50× faster), -97% tokens

### Phase 5: Command Structure Generation 🤖

Compile all collected info and generate the command structure:

```
📝 GENERATING COMMAND STRUCTURE

✅ Name: [command-name]
✅ Description: [description]
✅ Spec: [spec]
✅ Similar commands: [list with differentiation]
✅ Expert agents: [N] selected
✅ Memory Bank resources: [N] identified
✅ Internal AI-KIDO agents: [N] recommended
✅ Optimized workflow: [summary]

Generating...
```

Generated structure template:

```markdown
---
description: "[short description]"
---

# Command: /[command-name]

[Detailed description generated from spec]

**Purpose**: [objective from spec]

## Usage

\`\`\`bash
/[command-name]
/[command-name] --[argument] [value]
/[command-name] --verbose
/[command-name] --dry-run
\`\`\`

## Arguments

| Argument  | Description    | Example |
|-----------|----------------|---------|
| --[arg1]  | [description]  | [value] |
| --verbose | Detailed mode  | —       |
| --dry-run | Simulate only  | —       |

## Memory Bank References

### Hard Points (Imperative Constraints)
[For each hard point from Phase 3]
- **[`[path]`]([path])**: [constraint description] — Respect: [what must be respected]

### Theoretical Concepts
[For each concept from Phase 3]
- **[`[path]`]([path])**: [description] — Application: [how applied]

### Practical Techniques
[For each technique from Phase 3]
- **[`[path]`]([path])**: [description] — Use: [how used]

### Inspiring Use Cases
[For each use case from Phase 3]
- **[`[path]`]([path])**: [description] — Reuse: [what is reused]

---

## Steps

### Phase 0: [Phase Name]
[Phase description — imperative voice]

[IF expert agents selected]
Invoke expert agent \`[expert-slug]\`:
\`\`\`markdown
🤖 EXPERT AGENT: [expert-name]
Prompt: "[Context for expert] [Specific task] Return: [expected output]"
\`\`\`

### Phase 1: [Phase Name]
Invoke \`agent-aikido-[agent-name]\`:
\`\`\`markdown
🤖 AGENT: agent-aikido-[agent-name]
Prompt: "[Prompt from Phase 4 workflow] Return: [expected output]"
\`\`\`

[Repeat for each workflow phase]

---

## Agents Used

### Expert Agents (Business/Technical Personas)
[For each selected expert agent]
- **[Expert Name]** — slug: [expert-slug] | Phase: [X] | Skills: [list] | Tokens: ~[X]k

### Internal AI-KIDO Agents
[For each AI-KIDO agent from Phase 4]
- **[Agent Name]** — Phase: [X] | Input: [input] | Output: [output] | Tokens: ~[X]k

### Estimated Optimization Gains

| Aspect       | Without optimization | With agents | Gain |
|--------------|---------------------|-------------|------|
| [Aspect 1]   | [value]             | [optimized] | [%]  |
| **TOTAL**    | ~[X]k tokens        | ~[Y]k       | [Z]% |

---

## Output

### Success
\`\`\`
✅ [COMMAND-NAME] COMPLETED SUCCESSFULLY!
[Customized success messages]
📄 Report: [path if applicable]
\`\`\`

### Warnings
\`\`\`
⚠️ [WARNING messages]
\`\`\`

## Notes

[Error handling, edge cases]

## AI-KIDO Rules Respected
- ✅ [N] AI-KIDO agents orchestrated
- ✅ Memory Bank resources referenced
- ✅ Identified hard_points respected
- ✅ Relevant expert agents integrated
- ✅ Token optimization via intelligent workflow
- ✅ ≤1000 lines constraint respected

## Integration with Other Commands
[Auto-detected related commands from Phase 1]
**Recommended workflow**: [steps]

---
*Command created via /create-command on [DATE]*
*Expert agents: [list] | AI-KIDO agents: [list]*
```

Preview and confirm:
```
📝 STRUCTURE GENERATED

File: prompts/hard_points/commands/[command-name].md
Size: [X] lines (1000 max) ✅
Integrated agents: [N_experts + N_aikido]
Referenced resources: [N]

Preview: [first 50 lines]
[...]

Options:
1. VALIDATE and create the command
2. MODIFY before creation (back to Phase 0)
3. CANCEL
```

### Phase 6: Compliance Validation 🤖

Invoke `agent-aikido-validator`:

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

Prompt:
"Validate AI-KIDO compliance of the generated command file.

File: prompts/hard_points/commands/[command-name].md
Content: [full generated content]

Validations:
1. Line constraint: ≤1000 lines (extended for commands)
2. YAML frontmatter: description present and valid
3. Markdown format: correct structure
4. Memory Bank references: valid links
5. Referenced agents: all exist
6. Workflow coherence: logical phases

Return: status (✅ COMPLIANT | ⚠️ WARNINGS | ❌ NON-COMPLIANT) + violations + quick fixes
Estimated tokens: ~1-2k"
```

- COMPLIANT or WARNINGS fixed → Phase 7
- NON-COMPLIANT and fixes refused → Return to Phase 5 or CANCEL

### Phase 7: File Creation

Create files:

1. `prompts/hard_points/commands/[command-name].md` — full command
2. `.roo/commands/[command-name].md` — dynamic reference stub
3. `.claude/commands/[command-name].md` — dynamic reference stub

Stub template:
```markdown
---
description: "[short description]"
---

# Command [command-name]

This command executes the full command file from `prompts/hard_points/commands/[command-name].md`.

**EXECUTION**: Reading and executing the complete command now.

\`\`\`
Reading prompts/hard_points/commands/[command-name].md and executing instructions...
\`\`\`
```

### Phase 8: Documentation Integration 🤖

Invoke `agent-aikido-maj-md-index`:

```markdown
🤖 AGENT: agent-aikido-maj-md-index
FORMAT: JSON

Prompt:
"Update commands_list.md with the new command.

New command:
- Name: [command-name]
- Description: [description]
- Agents used: [expert agents + AI-KIDO list]
- Estimated tokens: ~[X]k

Actions:
1. Read commands_list.md 'Optimized commands with agents' section
2. Add line: - /[command-name] 🆕 ([N] agents): [agents-list] + [short description]
3. Increment total command counter
4. Recalculate % optimized with agents
5. Update 'Current State' section
6. Add to 'Main Workflows' section if new pattern

Return: updated commands_list.md + updated statistics
Estimated tokens: ~1k"
```

**Update `CLAUDE.md`**:
1. Read section 1 'AI-KIDO Specific Commands' → add `/[command-name]`
2. Update section 12 'Current Memory Bank State': date, increment **Commands** counter, update compliance if needed
3. Verify consistency with `commands_list.md`

**Check `README.md`**:
- If commands section detected → propose adding `/[command-name]` in detected format
- If no section → note "No commands section detected — manual update if needed"

### Phase 9: Final Report

```
✅ COMMAND CREATED SUCCESSFULLY!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📝 COMMAND: /[command-name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Information
├─ Description: [description]
├─ Size: [X]/1000 lines ✅
├─ AI-KIDO compliance: ✅ 100%
└─ Created: [DATE TIME]

👥 Integrated Agents ([N_total])
├─ Expert agents: [N] — [list with phases]
└─ AI-KIDO agents: [N] — [list with phases]

📚 Memory Bank Resources ([N])
├─ Hard Points: [N] | Concepts: [N]
├─ Techniques: [N] | Use Cases: [N]

⚡ Estimated Performance
├─ Tokens: ~[X]k | Optimization: [Y]% vs naive
└─ Workflow: [N] orchestrated phases

📁 Created Files
├─ ✅ prompts/hard_points/commands/[command-name].md
├─ ✅ .claude/commands/[command-name].md
├─ ✅ .roo/commands/[command-name].md
├─ ✅ commands_list.md (updated)
├─ ✅ CLAUDE.md (updated — sections 1 & 12)
└─ [if detected] README.md (updated)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 NEXT STEPS

1. Test: /[command-name] --dry-run
2. Restart Claude Code (if needed) — detect new command via /list
3. Document use case (optional): create /prompts/gen/use_cases/ example file
4. Share with team — command is ready!

💡 /[command-name] is now available!
```

---

## Notes

**Error handling**:
- Invalid command name: propose correct kebab-case format
- Empty description: re-ask
- Exact duplicate detected: block creation, propose using existing
- Expert agent not found: warning, continue with AI-KIDO agents only
- Broken Memory Bank resource: warning, link marked as broken
- Validation failed: propose quick fixes or return to edit
- File creation error: rollback, report system error

**Agents used (4 total)**:

| Agent | Phase | Role |
|-------|-------|------|
| **explore-bank** (QUICK) | 2 | Identify expert personas (non-internal) |
| **explore-bank** (DEEP) | 3 | Identify Memory Bank resources |
| **validator** | 6 | AI-KIDO compliance validation |
| **maj-md-index** | 8 | Auto-update commands_list.md |

**Phase optimizations**:
- Phase 1: Direct Grep instead of agent — 20-30× faster, -92% tokens
- Phase 4: Direct `agents_list.md` reference instead of agent — 50× faster, -97% tokens
- Total: ~10-18k tokens (vs 15-25k before), ~3-7 min (vs 5-10 min)

**AI-KIDO Rules respected**:
- Systematic duplicate detection
- Relevant expert agent integration (business personas)
- Memory Bank resource references (hard points priority)
- Optimal internal AI-KIDO agent orchestration
- Auto compliance validation (≤1000 lines)
- Auto documentation integration (commands_list.md, CLAUDE.md sections 1 & 12, README.md if applicable)
- Standardized Markdown format
- Guided interactive workflow

**Integration with other commands**:
- `/check-claude` — verify sync after creation
- `/analyse-aikido` — audit new command compliance
- `/optimize-command-with-aikido-agents` — optimize created command
- `/create-persona` — create missing expert agents

**Recommended workflow**:
1. `/create-command` → Create guided new command
2. `/[new-command] --dry-run` → Test
3. `/check-claude` → Verify integration
4. `/analyse-aikido` → Compliance audit
