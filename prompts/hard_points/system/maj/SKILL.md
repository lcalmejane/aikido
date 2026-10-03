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
