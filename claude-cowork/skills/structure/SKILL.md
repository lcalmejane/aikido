---
name: structure
description: "The AI-KIDO **\"structure\" Skill** is responsible for **generating, analysing, and maintaining the project directory and file tree structure**."
---

## Cowork execution boundary

Before following the canonical instructions, verify that the plugin root `${CLAUDE_PLUGIN_ROOT}` resolves to a readable installed package. Resolve relative references from the canonical source file, not this generated wrapper. Use only tools actually exposed in this Cowork session; Claude Code tool names do not prove that those tools are available here.

Before any project write, confirm the user-selected persistent project folder and its access permissions. Do not assume `${CLAUDE_PROJECT_DIR}`, a host filesystem path, or a temporary session directory is the intended project. Bootstrap, migration, update and removal additionally require an available command tool and Node.js. Use the packaged runtime with explicit `--root` and `--package` paths where applicable; review its plan and obtain confirmation of the exact plan ID before applying it. Do not replace the runtime with manual copies.

For `/aikido:init-aikido` without an installed lock, first choose STANDARD, LIGHT or UNSET with the user and run `node "<plugin-root>/scripts/bootstrap-plan.mjs" --root "<project-root>" --package "<plugin-root>" --mode <mode>`. Apply only after confirmation using `--apply --confirm <plan-id>`, then follow the canonical initialization command.

If a required path, tool, runtime or permission is unavailable, stop before writing and report `AIKIDO_COWORK_UNAVAILABLE` with the missing prerequisite. Do not install dependencies, change permissions or claim success to bypass the restriction. Never write into the plugin cache. These are prompt instructions, not a host-enforced sandbox.

When the project has `.aikido/lock.json`, prefer its installed `prompts/hard_points/` source. Otherwise read the bundled source at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/structure/SKILL.md`. Never write into the plugin cache.


# Structure – AI-KIDO Internal Skill

## Description
The AI-KIDO **"structure" Skill** is responsible for **generating, analysing, and maintaining the project directory and file tree structure**.
It ensures compliance with naming conventions, the tree depth defined in the hard points, and creates or removes necessary configuration artifacts.

## Metadata
```yaml
name: "Structure"
version: "V3.1"
author: "AI-KIDO Team"
category: "System – Structure Management"
metadata_tokens: 102
```

## Instructions
### 1. Scan the project tree structure
- Run the tree generation script: [`generate-project-tree.sh`](scripts/generate-project-tree.sh#L1)
- Analyse the JSON result to detect missing or extraneous directories.

### 2. Identify missing or extraneous directories
- Compare the current tree against conventions described in [`ARCHITECTURE-V3.md`](ARCHITECTURE-V3.md#L1) and [`ARCHITECTURE-V3.1-HASH-ID.md`](ARCHITECTURE-V3.1-HASH-ID.md#L1).
- Use the orphan cleanup script: [`clean-orphans.sh`](scripts/clean-orphans.sh#L1).

### 3. Apply naming conventions and depth rules
- Check maximum depth (5 levels) and folder prefixes via the analysis script: [`generate-index-master.sh`](scripts/generate-index-master.sh#L1).
- Rename or move non-compliant folders following the rules in the architecture file.

### 4. Generate or remove necessary configuration files
- Create or update the main architecture file: [`ARCHITECTURE-V3.md`](ARCHITECTURE-V3.md#L1).
- Generate metadata indexes with the scripts:
  - [`generate-all-indexes-v3.1.sh`](scripts/generate-all-indexes-v3.1.sh#L1)
  - [`format-file-metadata.sh`](scripts/format-file-metadata.sh#L1)

## Resources
### Libraries / tools
- **Bash** – native macOS shell, used by all scripts.
- **Python `pathlib`** – optional for advanced processing (e.g. script `detect-project-type.sh`).

### Useful scripts
- [`clean-orphans.sh`](scripts/clean-orphans.sh#L1) – removes empty or unreferenced directories.
- [`format-file-metadata.sh`](scripts/format-file-metadata.sh#L1) – normalises metadata headers.
- [`generate-project-tree.sh`](scripts/generate-project-tree.sh#L1) – produces a JSON tree of the project.
- [`generate-index-by-directory.sh`](scripts/generate-index-by-directory.sh#L1) – creates per-directory indexes.
- [`watch-changes.sh`](scripts/watch-changes.sh#L1) – monitors structure changes in real time.

## Usage
Claude automatically invokes this Skill when a query relates to **project structure** or when a **structure change** is detected (e.g. directory added/removed).
The typical process is:
1. Need detection (user query or watch event).
2. Skill execution following the **Instructions** above.
3. Return of a JSON report containing the actions performed and any points of attention.

## Notes
- **Stateless**: the Skill retains no state between invocations; it operates solely on the current state of the file system.
- **Size limits**: the Skill handles tree structures up to 10,000 files without notable degradation.
- **Encoding**: all outputs are in **UTF-8**.
- **Safety**: no script deletes files outside `prompts/hard_points/system/structure/` without explicit confirmation.

## Associated Aikido Agents
- `agent-aikido-balancer` – ensures tree structure balance by applying depth and branching rules.
- `agent-aikido-maj-md-index` – updates navigation indexes after any structure modification.
- `agent-aikido-projet-index` – maintains the JSON index of the project structure.
- `agent-aikido-explore-all` – uses the **structure** Skill when it needs to analyse the global project structure.
