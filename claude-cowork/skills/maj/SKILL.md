---
name: maj
description: "This Skill manages the complete AI-KIDO system update process: it detects the project context, selects the appropriate update plan, runs migration scripts, updates version metadata, and validates the success of the operation."
---

## Cowork execution boundary

Before following the canonical instructions, verify that the plugin root `${CLAUDE_PLUGIN_ROOT}` resolves to a readable installed package. Resolve relative references from the canonical source file, not this generated wrapper. Use only tools actually exposed in this Cowork session; Claude Code tool names do not prove that those tools are available here.

Before any project write, confirm the user-selected persistent project folder and its access permissions. Do not assume `${CLAUDE_PROJECT_DIR}`, a host filesystem path, or a temporary session directory is the intended project. Bootstrap, migration, update and removal additionally require an available command tool and Node.js. Use the packaged runtime with explicit `--root` and `--package` paths where applicable; review its plan and obtain confirmation of the exact plan ID before applying it. Do not replace the runtime with manual copies.

For `/aikido:init-aikido` without an installed lock, first choose STANDARD, LIGHT or UNSET with the user and run `node "<plugin-root>/scripts/bootstrap-plan.mjs" --root "<project-root>" --package "<plugin-root>" --mode <mode>`. Apply only after confirmation using `--apply --confirm <plan-id>`, then follow the canonical initialization command.

If a required path, tool, runtime or permission is unavailable, stop before writing and report `AIKIDO_COWORK_UNAVAILABLE` with the missing prerequisite. Do not install dependencies, change permissions or claim success to bypass the restriction. Never write into the plugin cache. These are prompt instructions, not a host-enforced sandbox.

When the project has `.aikido/lock.json`, prefer its installed `prompts/hard_points/` source. Otherwise read the bundled source at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/maj/SKILL.md`. Never write into the plugin cache.


# Maj – AI-KIDO Internal Skill

## Description
This Skill manages the complete AI-KIDO system update process: it detects the project context, selects the appropriate update plan, runs migration scripts, updates version metadata, and validates the success of the operation.

## Metadata
| Field          | Value                               |
|----------------|-------------------------------------|
| **Name**       | maj                                 |
| **Version**    | 1.0.0                               |
| **Author**     | AI-KIDO Team                        |
| **Category**   | update                              |
| **Tokens**     | ~100                                |
| **Created**    | 2025-12-19                          |

## Instructions
1. **Analyse the project context** – run the detection script: [`scripts/detect-project-type.sh`](prompts/hard_points/system/maj/scripts/detect-project-type.sh:1).
2. **Select the update plan** – choose the plan corresponding to the target version, e.g. [`plan-V1.3.0.0.md`](prompts/hard_points/system/maj/plans/plan-V1.3.0.0.md:1).
3. **Run the migration scripts** – execute the scripts located in `maj/scripts/…` according to the chosen plan.
4. **Update index files and metadata** – adjust version references in index files, headers, and configuration files.
5. **Validate success** – run automated tests, check dependency consistency, and ensure versions are correctly recorded.

## Resources
- **Existing scripts**:
  - [`detect-project-type.sh`](prompts/hard_points/system/maj/scripts/detect-project-type.sh:1)
  - Migration scripts in `prompts/hard_points/system/maj/scripts/` (e.g. `upgrade-db.sh`, `update-config.sh`).
- **Version plans**: the [`prompts/hard_points/system/maj/plans/`](prompts/hard_points/system/maj/plans/:1) directory contains all detailed plans.
- **Related documentation**: [`prompts/hard_points/system/maj/plans/README.md`](prompts/hard_points/system/maj/plans/README.md:1).
- **Validation tools**: `agent-aikido-validator` to check compliance after update.

## Usage
```python
invoke_skill("maj", {
    "target_version": "V1.3.0.0",
    "project_path": "/path/to/project"
})
```
The Skill activates automatically when a query contains the keywords "update", "upgrade", or "version change".

## Notes
- The Skill is **stateless**: it retains no data between executions.
- Maximum script size: 5 MB.
- All outputs are encoded in UTF-8 and logged in `logs/maj.log`.
- Strict versioning policy compliance: no modification is applied without prior plan validation and testing.
