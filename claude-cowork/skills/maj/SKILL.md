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
1. **Analyse the project context** – with Node.js 24+, run the detector with the explicit project root:

   ```text
   node prompts/hard_points/system/maj/scripts/detect-project-type.mjs detect /path/to/project
   ```

   Check its exit status before reading stdout as `PROJECT_TYPE`.
2. **Select the update plan** – check its status and do not execute plans marked historical or blocked. For a managed package installation, use the packaged Node update planner and review its plan before applying.
3. **Run the migration engines** – invoke the documented `.mjs` CLI directly.
   For host-dependent review, fusion, or agent work, perform the explicit
   action in the plan; do not generate or invoke shell wrappers.
4. **Update index files and metadata** – adjust version references in index files, headers, and configuration files.
5. **Validate success** – run automated tests, check dependency consistency, and ensure versions are correctly recorded.

## Resources
- **Existing scripts**:
  - Read-only Node.js 24+ engines: [`detect-project-type.mjs`](scripts/detect-project-type.mjs), [`detect-version.mjs`](scripts/detect-version.mjs).
  - Version-pair entry point: [`beginning-detect-versions.mjs`](scripts/beginning-detect-versions.mjs).
  - Node engines in `prompts/hard_points/system/maj/scripts/`; see the relevant plan for supported arguments.
- **Version plans**: the [`prompts/hard_points/system/maj/plans/`](plans/#L1) directory contains all detailed plans.
- **Related documentation**: [`prompts/hard_points/system/maj/plans/README.md`](plans/README.md#L1).
- **Validation tools**: `agent-aikido-validator` to check compliance after update.

## Usage
```text
node prompts/hard_points/system/maj/scripts/detect-project-type.mjs detect /path/to/project
```
The host must select the skill and perform the review and approval steps
described by the relevant plan. A CLI call does not perform those host actions.

## Notes
- Plans and engines can write backups, reports and work files; consult their
  contracts and keep each operation's work directory private and exclusive.
- Maximum script size: 5 MB.
- Detection outputs are UTF-8; the detection engines themselves do not write logs or any other files.
- Strict versioning policy compliance: no modification is applied without prior plan validation and testing.

## Detection contracts and Node migration

Characterized from the shell implementations before editing; isolated fixtures
are in `distribution/tests/maj-detection.test.mjs` (from the repository root,
run `node --test distribution/tests/maj-detection.test.mjs`). No jq dependency.

### Preserved contracts
- `detect-project-type`: no arguments means the current project root; `detect
  [root]` appends `/prompts` (the historical help calls this `prompts_dir`).
  Empty root defaults to `.`; trailing arguments are ignored. `-h`/`--help`
  print help on stdout, exit 0; unknown commands print help, exit 1.
- Immediate directories except `gen`, `hard_points`, `spec` count as projects,
  including hidden directories and empty directories; child symlinks and files
  do not count. No project content, including `prompts/spec`, is read.
  Stdout is `MONO\n` or `MULTI\n` plus one project name per line; colored
  mono/multi diagnostics go to stderr. Missing/non-directory `prompts` keeps
  the historical `ERROR: prompts directory not found\n` on stdout, exit 1.
- `detect-version [file]`: defaults to `prompts/hard_points/ai-kido.md`,
  including an empty argument; trailing arguments are ignored. No help/options:
  `--help` is a literal filename. The first exact `> **Version**:` line wins.
  Extraction before `|` and removal of ASCII spaces are retained;
  tabs/CR are retained for nonempty versions.
  No semver validation. Success prints one version plus newline, exit 0;
  missing/non-regular files report `❌ File not found: PATH` on stderr, exit 1.
- Node CLI entry points receive explicit arguments and return an exit status;
  no shell wrapper is required. Node missing: explicit stderr, exit 127; Node
  older than 24: explicit stderr, exit 1.

### Deliberate safety differences
- Directory traversal/stat errors now fail explicitly on stderr, exit 1, with
  no partial classification. The old find errors were hidden and could yield
  MONO. A symlink at `prompts` is refused rather than falsely classified MONO.
  Project names containing CR/LF are refused because line output is ambiguous.
- Names use stable UTF-8 byte order (`LC_ALL=C` equivalent), not host-locale
  sort. Thus non-C locales can differ. Multi diagnostic counts no longer
  include host-specific wc padding; colors and message wording are retained.
- Missing version headers now report an explicit error (previously grep under
  pipefail could exit silently). Many matches no longer risk SIGPIPE; the first
  still wins. Invalid UTF-8/NUL fail explicitly, rather than binary grep behavior.
  Empty/whitespace-only first version fields fail even if a later header is
  valid; the unsafe historical sed fallback exporting `>**Version**:` is removed.
  Files beginning with `-` are literal paths, not grep options. All detection
  failures use exit 1 rather than leaking external-tool-specific pipeline codes.
  Version strings such as `-n` are printed literally, not interpreted as echo
  flags. CR/tab-bearing versions still work in the standalone detector.
- `beginning-detect-versions.mjs SOURCE TARGET` puts CURRENT/
  TARGET diagnostics on stderr and **only** `CURRENT TARGET\n` on stdout.
  It rejects whitespace-bearing version tokens to avoid ambiguous plan parsing.
  On either extraction failure stdout is empty; no version data is written.
  Pair output preserves backslashes literally.
  The host interprets the pair and carries the values into subsequent steps;
  this avoids ambiguous parsing and the formerly contaminated awk extraction.
- Ending-3/4 call the Node engine with explicit `SOURCE` and stop on detection
  failure or an invalid type before later generation/validation steps.
  Both locate the engine in SOURCE rather than the working directory.
  There is no fallback to legacy detection when a Node engine is unavailable.
- CLI entry guards compare both physical paths with `realpathSync`, including
  file/directory aliases and macOS `/var` aliases. Comparing a resolved argv
  string to Node's canonical module URL could formerly skip the CLI silently
  (exit 0, empty stdout), leaving Ending-3/4 with an invalid empty project type.
  Imports with absent, unrelated or nonexistent argv paths do not run the CLI.
- Backup now uses the Node engine with exclusive archive creation and unique
  names. It requires `tar` and currently supports macOS and Linux only; it does
  not guarantee safety against hostile concurrent directory replacement.
- Ending-4 defines the known SOURCE validation script in the parent plan for
  logging; child wrapper variables cannot define it in the parent.

Exact equivalence is claimed only for the characterized textual fixtures and
C-locale project sorting, not arbitrary filesystem races, binary data or
non-C collation. Tests use isolated Node fixtures and do not execute historical
shell implementations.
