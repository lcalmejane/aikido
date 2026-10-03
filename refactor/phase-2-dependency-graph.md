# Phase 2 — Formal Dependency Graph (`dependencies.json`)

> **Status**: ⬜ Pending  
> **Depends on**: Phase 0 (translation), Phase 1 (manifest)  
> **Re-runnable**: ✅ Yes — dependencies.json is a new file; agent stub changes are additive

---

## Preconditions — Read Before Starting

**Read [`decisions.md`](decisions.md) Phases 0 and 1 sections first.**

Critical checks:
1. **Agent spec split files (Phase 0-B decisions)**: The `dependencies.json` schema below lists `"spec"` paths for each agent (e.g. `"spec": "prompts/hard_points/agents/agent-aikido-explore-bank.md"`). If Phase 0-B split any spec into `main + _details.md`, the `"spec"` field must point to the **main file**, not the details file. Verify each entry against the split decisions table in `decisions.md`.

2. **SKILL.md section header name (Phase 0-E decisions)**: Task 2.3 instructs to locate the `## Agents Aikido associés` section in SKILL.md files and replace it. But Phase 0-E may have translated this header to a different name (e.g. `## Associated Agents`, `## Aikido Agents`). Check the `decisions.md` 0-E table to get the **exact header name after translation** before searching.

3. **Agent stub frontmatter structure (Phase 0-D decisions)**: Task 2.2 inserts `requires:` and `optional:` after the `model:` field. If Phase 0-D found any stub with non-standard frontmatter structure, check the 0-D decisions table before editing those files.

4. **dependencies.json `spec` paths requiring verification**:

| Agent | Expected spec path | Verify with 0-B split table |
|-------|-------------------|---------------------------|
| agent-aikido-explore-bank | `prompts/hard_points/agents/agent-aikido-explore-bank.md` | ⬜ |
| agent-aikido-projet-index | `prompts/hard_points/agents/agent-aikido-projet-index.md` | ⬜ |
| agent-aikido-maj-md-index | `prompts/hard_points/agents/agent-aikido-maj-md-index.md` | ⬜ |
| agent-aikido-explore-code | `prompts/hard_points/agents/agent-aikido-explore-code.md` | ⬜ |
| agent-aikido-balancer | `prompts/hard_points/agents/agent-aikido-balancer.md` | ⬜ |
| agent-aikido-bank-populate | `prompts/hard_points/agents/agent-aikido-bank-populate.md` | ⬜ |

## Post-execution obligation

After Phase 2 completes, record in [`decisions.md`](decisions.md) Phase 2 section:
- Actual `requires:` and `optional:` values set per agent stub
- Any spec path corrected in `dependencies.json` vs the plan (e.g. split file)
- The SKILL.md section header name used (confirms it matched Phase 0-E result)

---

## Context

Currently dependencies between agents and skills are expressed only in prose (`## Agents associés` sections in SKILL.md files) and scattered `tools:` frontmatter references. There is no machine-readable graph that install tooling can use to determine install order or validate completeness.

This phase introduces:
1. `dependencies.json` — the authoritative dependency graph
2. `requires:` / `optional:` fields in every `.claude/agents/*.md` stub frontmatter
3. Structured YAML blocks in SKILL.md files replacing prose agent sections

**`requires`** = hard dependency: agent cannot function without it  
**`optional`** = soft dependency: agent degrades gracefully without it  
**`install_order`** = topological sort derived from `requires` graph

---

## Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Create `dependencies.json` at project root | ⬜ | Schema below |
| 2.2 | Add `requires:` / `optional:` to all 13 `.claude/agents/*.md` stubs | ⬜ | Frontmatter only — body unchanged |
| 2.3 | Update 5 `SKILL.md` files — structured agents section | ⬜ | Replace prose with YAML block |
| 2.4 | Validate topological sort (no cycles) | ⬜ | Script below |
| 2.5 | Verify frontmatter matches `dependencies.json` | ⬜ | |

---

## File to Create: `dependencies.json`

```json
{
  "version": "1.0",
  "generated": "2026-08-05",
  "description": "Machine-readable dependency graph for AI-KIDO agents and skills",
  "nodes": {
    "agents": {
      "agent-aikido-validator": {
        "stub": ".claude/agents/agent-aikido-validator.md",
        "spec": "prompts/hard_points/agents/agent-aikido-validator.md",
        "requires": [],
        "optional": [],
        "tools": ["Read", "Grep", "Glob"]
      },
      "agent-aikido-raci-delegator": {
        "stub": ".claude/agents/agent-aikido-raci-delegator.md",
        "spec": "prompts/hard_points/agents/agent-aikido-raci-delegator.md",
        "requires": [],
        "optional": [],
        "tools": ["Read", "Grep", "Glob"]
      },
      "agent-aikido-truth-evaluator": {
        "stub": ".claude/agents/agent-aikido-truth-evaluator.md",
        "spec": "prompts/hard_points/agents/agent-aikido-truth-evaluator.md",
        "requires": [],
        "optional": ["agent-aikido-doc-header"],
        "tools": ["Read"]
      },
      "agent-aikido-doc-header": {
        "stub": ".claude/agents/agent-aikido-doc-header.md",
        "spec": "prompts/hard_points/agents/agent-aikido-doc-header.md",
        "requires": ["agent-aikido-truth-evaluator"],
        "optional": [],
        "tools": ["Read", "Edit"]
      },
      "agent-aikido-projet-index": {
        "stub": ".claude/agents/agent-aikido-projet-index.md",
        "spec": "prompts/hard_points/agents/agent-aikido-projet-index.md",
        "requires": [],
        "optional": [],
        "tools": ["Read", "Write", "Bash"]
      },
      "agent-aikido-balancer": {
        "stub": ".claude/agents/agent-aikido-balancer.md",
        "spec": "prompts/hard_points/agents/agent-aikido-balancer.md",
        "requires": ["agent-aikido-projet-index"],
        "optional": [],
        "tools": ["Read", "Grep", "Glob", "Edit", "Write"]
      },
      "agent-aikido-fusion": {
        "stub": ".claude/agents/agent-aikido-fusion.md",
        "spec": "prompts/hard_points/agents/agent-aikido-fusion.md",
        "requires": [],
        "optional": [],
        "tools": ["Read", "Edit", "Write", "Grep"]
      },
      "agent-aikido-update-controller": {
        "stub": ".claude/agents/agent-aikido-update-controller.md",
        "spec": "prompts/hard_points/agents/agent-aikido-update-controller.md",
        "requires": [],
        "optional": [],
        "tools": ["Read", "Write", "Bash"]
      },
      "agent-aikido-explore-bank": {
        "stub": ".claude/agents/agent-aikido-explore-bank.md",
        "spec": "prompts/hard_points/agents/agent-aikido-explore-bank.md",
        "requires": [],
        "optional": ["agent-aikido-projet-index"],
        "tools": ["Read", "Grep", "Glob", "Bash"]
      },
      "agent-aikido-explore-code": {
        "stub": ".claude/agents/agent-aikido-explore-code.md",
        "spec": "prompts/hard_points/agents/agent-aikido-explore-code.md",
        "requires": [],
        "optional": ["agent-aikido-projet-index"],
        "tools": ["Read", "Grep", "Glob", "Bash"]
      },
      "agent-aikido-explore-all": {
        "stub": ".claude/agents/agent-aikido-explore-all.md",
        "spec": "prompts/hard_points/agents/agent-aikido-explore-all.md",
        "requires": ["agent-aikido-explore-bank", "agent-aikido-explore-code"],
        "optional": [],
        "tools": ["Task", "AgentOutputTool"]
      },
      "agent-aikido-bank-populate": {
        "stub": ".claude/agents/agent-aikido-bank-populate.md",
        "spec": "prompts/hard_points/agents/agent-aikido-bank-populate.md",
        "requires": [
          "agent-aikido-truth-evaluator",
          "agent-aikido-raci-delegator",
          "agent-aikido-doc-header"
        ],
        "optional": [],
        "tools": ["Read", "Grep", "Glob", "Edit", "Write", "Bash"]
      },
      "agent-aikido-indexer": {
        "stub": ".claude/agents/agent-aikido-indexer.md",
        "spec": "prompts/hard_points/agents/agent-aikido-maj-md-index.md",
        "requires": ["agent-aikido-projet-index", "agent-aikido-bank-populate"],
        "optional": ["agent-aikido-raci-delegator", "agent-aikido-validator"],
        "tools": ["Read", "Grep", "Glob", "Edit", "Write"]
      },
      "agent-aikido-helper": {
        "stub": null,
        "spec": "prompts/hard_points/agents/agent-aikido-helper.md",
        "requires": [],
        "optional": [],
        "tools": ["Read"]
      }
    },
    "skills": {
      "search": {
        "path": "prompts/hard_points/system/search/",
        "skill_md": "prompts/hard_points/system/search/SKILL.md",
        "requires_agents": [
          "agent-aikido-explore-bank",
          "agent-aikido-explore-code",
          "agent-aikido-explore-all"
        ],
        "requires_skills": []
      },
      "analyse": {
        "path": "prompts/hard_points/system/analyse/",
        "skill_md": "prompts/hard_points/system/analyse/SKILL.md",
        "requires_agents": [
          "agent-aikido-update-controller",
          "agent-aikido-bank-populate",
          "agent-aikido-explore-all",
          "agent-aikido-explore-code",
          "agent-aikido-explore-bank"
        ],
        "requires_skills": ["search"]
      },
      "structure": {
        "path": "prompts/hard_points/system/structure/",
        "skill_md": "prompts/hard_points/system/structure/SKILL.md",
        "requires_agents": [
          "agent-aikido-balancer",
          "agent-aikido-indexer",
          "agent-aikido-projet-index"
        ],
        "requires_skills": []
      },
      "web": {
        "path": "prompts/hard_points/system/web/",
        "skill_md": "prompts/hard_points/system/web/SKILL.md",
        "requires_agents": [],
        "requires_skills": []
      },
      "maj": {
        "path": "prompts/hard_points/system/maj/",
        "skill_md": "prompts/hard_points/system/maj/SKILL.md",
        "requires_agents": [
          "agent-aikido-update-controller",
          "agent-aikido-fusion",
          "agent-aikido-validator"
        ],
        "requires_skills": ["structure", "analyse"]
      }
    }
  },
  "install_order": [
    "agent-aikido-validator",
    "agent-aikido-raci-delegator",
    "agent-aikido-truth-evaluator",
    "agent-aikido-doc-header",
    "agent-aikido-projet-index",
    "agent-aikido-balancer",
    "agent-aikido-fusion",
    "agent-aikido-update-controller",
    "agent-aikido-explore-bank",
    "agent-aikido-explore-code",
    "agent-aikido-explore-all",
    "agent-aikido-bank-populate",
    "agent-aikido-indexer",
    "agent-aikido-helper"
  ]
}
```

---

## Agent Stub Frontmatter Change Pattern

For each `.claude/agents/agent-aikido-*.md`, add `requires:` and `optional:` after `model:`:

**Before** (example: `agent-aikido-explore-all.md`):
```yaml
---
name: agent-aikido-explore-all
description: ...
tools: Task, AgentOutputTool
model: inherit
---
```

**After**:
```yaml
---
name: agent-aikido-explore-all
description: ...
tools: Task, AgentOutputTool
model: inherit
requires:
  - agent-aikido-explore-bank
  - agent-aikido-explore-code
optional: []
---
```

**Body of each stub file is unchanged.**

---

## SKILL.md Agents Section Change Pattern

Replace prose `## Agents Aikido associés` section with structured block.

**Before** (example in `search/SKILL.md`):
```markdown
## Agents Aikido associés

- `agent-aikido-explore-all` : orchestrateur de recherche complète
- `agent-aikido-explore-bank` : spécialiste Memory Bank
- `agent-aikido-explore-code` : spécialiste code source
```

**After**:
```markdown
## Associated Agents

```yaml
associated_agents:
  - id: agent-aikido-explore-all
    relationship: orchestrates
  - id: agent-aikido-explore-bank
    relationship: uses
  - id: agent-aikido-explore-code
    relationship: uses
```
```

---

## Prompt to Execute

```
You are adding a formal dependency graph to the AI-KIDO memory bank.

CONTEXT:
- Project: /Users/lcare/workspace/best-p/ai-kido-best-practices
- Reference file: refactor/phase-2-dependency-graph.md contains the exact JSON schema and change patterns

TASK 1 — Create dependencies.json:
- Create the file at project root using the exact schema from refactor/phase-2-dependency-graph.md
- Verify each stub path and spec path exists before finalizing

TASK 2 — Update agent stubs (13 files in .claude/agents/):
- Add requires: and optional: fields to each stub's YAML frontmatter
- Use values from dependencies.json nodes.agents for each agent
- PRESERVE: all existing frontmatter fields and entire body content unchanged
- Add fields AFTER the model: line

TASK 3 — Update SKILL.md files (5 files):
- Replace the "Agents Aikido associés" prose section with a structured YAML block
- Use the pattern from refactor/phase-2-dependency-graph.md
- PRESERVE: all other sections unchanged
- Translate section header to English: "Associated Agents"

MANDATORY RULES:
1. Never remove existing frontmatter fields
2. Never modify the body/instructions of any agent stub
3. Never change any section of SKILL.md other than the agents section
4. If requires: or optional: field already exists in a stub, update it (do not duplicate)
5. Maintain AI-KIDO line limits (stubs ≤1000 lines)

CHAIN-OF-THOUGHT before each file edit:
- Read current file
- Identify exact insertion point
- Verify no duplicate fields
- Apply minimal change

OUTPUT FORMAT:
## dependencies.json
- Created: [yes/no]
- Agent nodes: X defined
- Skill nodes: X defined
- install_order: X entries

## Agent stubs updated: X/13
- [agent-name]: requires=[X], optional=[X]

## SKILL.md files updated: X/5
- [skill-name]: [status]

## Validation issues found: [list]
```

---

## Verification

```bash
# Validate JSON
python3 -m json.tool dependencies.json > /dev/null && echo "✅ Valid" || echo "❌ Invalid"

# Check install_order is complete (matches agent count)
python3 -c "
import json
d = json.load(open('dependencies.json'))
agents = set(d['nodes']['agents'].keys())
order = set(d['install_order'])
missing = agents - order
extra = order - agents
print(f'Agents in graph: {len(agents)}')
print(f'Agents in order: {len(order)}')
print(f'Missing from order: {missing}' if missing else '✅ All agents in install_order')
print(f'Extra in order: {extra}' if extra else '✅ No phantom entries')
"

# Verify no cycles (topological sort check)
python3 -c "
import json
d = json.load(open('dependencies.json'))
agents = d['nodes']['agents']
# Kahn's algorithm
in_degree = {a: 0 for a in agents}
for a, info in agents.items():
    for req in info.get('requires', []):
        if req in agents:
            in_degree[req]  # just check it exists
            # note: in_degree[a] should increase for each thing that requires a
# Simple reachability check
visited = set()
def dfs(node, path):
    if node in path: return False  # cycle
    if node in visited: return True
    visited.add(node)
    for req in agents.get(node, {}).get('requires', []):
        if req in agents:
            if not dfs(req, path | {node}): return False
    return True
all_ok = all(dfs(a, set()) for a in agents)
print('✅ No cycles detected' if all_ok else '❌ Cycle detected!')
"

# Check frontmatter has requires: in all stubs
for f in .claude/agents/agent-aikido-*.md; do
  grep -q "^requires:" "$f" && echo "✅ $f" || echo "❌ Missing requires: in $f"
done
```

---

## Result

> _Fill this section after execution_

**Date completed**: —  
**dependencies.json created**: ⬜  
**Agent nodes defined**: — / 14  
**Skill nodes defined**: — / 5  
**Agent stubs updated**: — / 13  
**SKILL.md files updated**: — / 5  
**Topological sort valid**: ⬜  
**No cycles**: ⬜  
**Validation**: ⬜ Pending

### Notes

_Record any dependency decisions, edge cases with optional vs required, cycle risks._
