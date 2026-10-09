# AI-KIDO Agents and Personas List

## Agent Declarations

| Agent | Persona | Specialization |
|-------|---------|----------------|
| **agent-aikido-orchestrator** | [agent-aikido-orchestrator.md](prompts/hard_points/agents/agent-aikido-orchestrator.md) | Always-on coordinator: leads, collaborates with an existing native orchestrator (guide / delegate / take over), or works directly; strict JSON for agent, thread, MCP and direct exchanges |
| 🔍 **agent-aikido-explore-bank** | [agent-aikido-explore-bank.md](prompts/hard_points/agents/agent-aikido-explore-bank.md) | Memory Bank search v5.2 (extended formats + filename scout) |
| 💻 **agent-aikido-explore-code** | [agent-aikido-explore-code.md](prompts/hard_points/agents/agent-aikido-explore-code.md) | Source code search with structured metadata |
| 🔍💻 **agent-aikido-explore-all** | [agent-aikido-explore-all.md](prompts/hard_points/agents/agent-aikido-explore-all.md) | Orchestrator: parallel Bank + Code search |
| ⚖️ **agent-aikido-truth-evaluator** | [agent-aikido-truth-evaluator.md](prompts/hard_points/agents/agent-aikido-truth-evaluator.md) | Determines authoritative sources with last-check optimization |
| 🎯 **agent-aikido-raci-delegator** | [agent-aikido-raci-delegator.md](prompts/hard_points/agents/agent-aikido-raci-delegator.md) | Classifies and routes documents by RACI |
| 📝 **agent-aikido-doc-header** | [agent-aikido-doc-header.md](prompts/hard_points/agents/agent-aikido-doc-header.md) | Standardized AI-KIDO document header management |
| 🗂️ **agent-aikido-projet-index** | [agent-aikido-projet-index.md](prompts/hard_points/agents/agent-aikido-projet-index.md) | Project tree manager with 24H cache |
| 🤖 **agent-aikido-bank-populate** | [agent-aikido-bank-populate.md](prompts/hard_points/agents/agent-aikido-bank-populate.md) | Automatic Memory Bank population from code/context |
| ✅ **agent-aikido-validator** | [agent-aikido-validator.md](prompts/hard_points/agents/agent-aikido-validator.md) | Rapid AI-KIDO compliance validation (<2k tokens) |
| ⚖️ **agent-aikido-balancer** | [agent-aikido-balancer.md](prompts/hard_points/agents/agent-aikido-balancer.md) | Memory Bank tree balancing |
| 📑 **agent-aikido-indexer** | [agent-aikido-maj-md-index.md](prompts/hard_points/agents/agent-aikido-maj-md-index.md) | Automatic index.md + AGENTS.md update |
| 🔀 **agent-aikido-fusion** | [agent-aikido-fusion.md](prompts/hard_points/agents/agent-aikido-fusion.md) | Intelligent file fusion during AI‑KIDO updates |
| 🔧 **agent-aikido-update-controller** | [agent-aikido-update-controller.md](prompts/hard_points/agents/agent-aikido-update-controller.md) | Controls AI‑KIDO system updates: backup, validation, plan execution, rollback |
| 🤖 **agent-aikido-helper** | [agent-aikido-helper.md](prompts/hard_points/agents/agent-aikido-helper.md) | Pedagogical assistant for AI-KIDO usage questions |

## 👥 Available Expert Agent Personas

| Agent / Persona | Description | Link |
|-----------------|-------------|------|

## Agent Usage Guide

### agent-aikido-orchestrator
- Request planning and agent/persona/tool/skill selection; it never answers "inactive".
- Three modes: `lead` (no other general orchestrator, complete inventory),
  `collaborate` (a native orchestrator exists: Claude Code, Kiro, Codex, Roo or
  any registered one), `direct` (host unknown: executes the work itself).
- Collaboration roles: do direct/MCP tasks, guide the native orchestrator with a
  JSON plan, delegate, and take over only what it verifiably cannot do (e.g. a
  parallel batch when the native orchestrator does not parallelize).
- Adaptive multi-agent dispatch using actual context Tools/MCP and verified
  worker capabilities, not fixed Tool names or assumed inherited connections.
- Chooses sequential/parallel ready batches from dependencies, shared-resource
  locks (a retained thread is an exclusive lock), accepted results and concurrency.
- Every exchange (agent, thread, MCP, direct, native orchestrator) is one strict
  JSON object: `task-request/2` in, `task-result/1` out, validated by the
  [contract](prompts/hard_points/system/orchestrator/contract.schema.json).
- Executes commands and code with the host's command capability and journals
  every task/sub-task with [tracker.mjs](prompts/hard_points/system/orchestrator/tracker.mjs):
  state, attempts, bounded retries, stale detection, exit codes and the tokens/cost
  REPORTED by executors (never estimated), so failed work can be relaunched and
  consumption followed.
- [System skill](prompts/hard_points/system/orchestrator/SKILL.md): coordination
  mode, JSON batches, measured quality/cost routing, bounded retries.
- Wrappers: [Copilot](.github/agents/agent-aikido-orchestrator.agent.md),
  [Claude Code](.claude/agents/agent-aikido-orchestrator.md),
  [Roo mode](.roomodes). Prompt rules are not platform enforcement.

### agent-aikido-explore-bank
- ✅ Exploratory search (architecture, global concepts)
- ✅ Enriched context with cross-references
- ✅ Auto-filtering (test reports excluded)
- ❌ Skip for: simple/punctual search, performance-critical (<0.05s), very strict token budget

### agent-aikido-explore-code
- ✅ Deep source code search
- ✅ Locate elements (classes, functions, interfaces) with metadata
- ✅ Dependency analysis (imports graph)
- ✅ Cross-file mapping (extends, implements)
- ❌ Skip for: need full code (use Read directly), Memory Bank search (use explore-bank)

### agent-aikido-explore-all
- ✅ General search (docs + code simultaneously)
- ✅ Complete view: documentation + implementation
- ✅ Verify consistency between specs and code
- ❌ Skip when: already know where to search (bank OR code), need single source only

### agent-aikido-truth-evaluator
- Spec/code contradiction resolution
- Source validation
- Optimization via last-check metadata

### agent-aikido-raci-delegator
- Classify Memory Bank documents
- Content organization
- Determine responsible role

### agent-aikido-doc-header
- Create/validate/update headers with versioning
- Truth source tracking
- Last-check metadata

### agent-aikido-projet-index
- File location (instant via JSON cache)
- Directory exploration
- Existence checks
- Structure overview
- Project statistics

### agent-aikido-bank-populate
- Automatic Memory Bank population from code/context
- ⏰ END OF PROCESS ONLY (after complete gap report, user validation)

### agent-aikido-validator
- Auto-trigger on create/edit/move in `/prompts`
- Quick checks (lines, links, frontmatter)

### agent-aikido-balancer
- Files >500 lines
- Depth >4
- Branching outside 3-7
- Broken links

### agent-aikido-indexer
- After add/modify/delete files
- Outdated stats
- AGENTS.md sync

### agent-aikido-fusion
- External updates (`/maj-aikido --update`)
- Fusion preserving project context + adopting new formalism

## Main Workflows

### Base Patterns
1. `explore-bank → truth-evaluator → raci-delegator` (Feature with context)
2. `truth-evaluator → doc-header` (update last-check after validation)
3. `bank-populate → doc-header → validator` (compliance)
4. `file operation → validator` (auto-validation)
5. `explore-bank → bank-populate → doc-header → raci-delegator` (population END of process)
6. `source update → fusion → truth-evaluator → doc-header → validator` (full external update)

**Agent roles**:
- `explore-bank`: Contextual Memory Bank extraction (concepts/techniques/personas)
- `explore-code`: Source code search with metadata (classes, functions, interfaces, dependencies with line numbers)
- `explore-all`: Parallel orchestration explore-bank + explore-code for complete search (docs + code)
- `truth-evaluator`: Contradiction arbitration with last-check optimization (fast-path if ✅ + unchanged sources)
- `raci-delegator`: Document classification and routing by role
- `doc-header`: Standardized header management (versioning, truth source, last-check, source refs)
- `projet-index`: Instant file location via JSON cache, project stats, structure navigation
- `bank-populate`: Population END OF PROCESS (after complete gap report) with full headers
- `validator`: Auto-validation (<2k tokens) on create/edit/move in `/prompts`
- `balancer`: Tree balancing (files >500 lines, depth >4, branching outside 3-7)
- `indexer`: Update index.md and AGENTS.md after modifications
- `fusion`: Intelligent fusion during external updates (`/maj-aikido --update`)
