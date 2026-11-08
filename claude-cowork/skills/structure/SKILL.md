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
- Run the tree generation engine: [`generate-project-tree.mjs`](scripts/generate-project-tree.mjs)
- Analyse the JSON result to detect missing or extraneous directories.

### 2. Identify missing or extraneous directories
- Compare the current tree against conventions described in [`ARCHITECTURE-V3.md`](ARCHITECTURE-V3.md#L1) and [`ARCHITECTURE-V3.1-HASH-ID.md`](ARCHITECTURE-V3.1-HASH-ID.md#L1).
- Use [`clean-orphans.mjs`](scripts/clean-orphans.mjs) to find and remove orphaned by-id entries, not directories. Its former shell adapter has been removed.

### 3. Apply naming conventions and depth rules
- Inspect the tree against the documented maximum depth (5 levels) and folder-prefix rules. The master generator validates index references but does not check these structural conventions.
- Rename or move non-compliant folders following the rules in the architecture file.

### 4. Generate or remove necessary configuration files
- Create or update the main architecture file: [`ARCHITECTURE-V3.md`](ARCHITECTURE-V3.md#L1).
- Generate indexes with [`generate-all-indexes-v3.1.mjs`](scripts/generate-all-indexes-v3.1.mjs), invoked directly with Node.
- Format individual metadata lines with [`format-file-metadata.mjs`](scripts/format-file-metadata.mjs).

## Resources
### Libraries / tools
- **Node.js ≥24** – tree generation, metadata formatting, change monitoring,
  index generation and orphan cleanup, without jq or bc.
- **Git** – required by by-id generation, project-tree generation and the
  watcher to interpret `.gitignore` files, including nested rules and
  negations. A temporary isolated Git directory is used even for a project
  that is not itself a Git repository; paths are passed unchanged through
  NUL-delimited `check-ignore --stdin` queries (directory paths are not given a
  synthetic trailing slash). A separate direct-Git oracle covers nested
  negations, special names and directory queries; missing Git is an error.

### Useful scripts
- [`clean-orphans.mjs`](scripts/clean-orphans.mjs) – cleans orphaned by-id index entries; `--dry-run`, `--confirm`, `--verbose`, and `--rebuild` can be combined.
- [`generate-index-by-id.mjs`](scripts/generate-index-by-id.mjs) – generates the 16 by-id batches using Git for `.gitignore`; generated indexes, common caches and `.env*` files are excluded. Generation is sequential; the former shell entry points are removed.
- [`generate-all-indexes-v3.1.mjs`](scripts/generate-all-indexes-v3.1.mjs) – builds and cross-validates all indexes in a private temporary directory, then publishes them with rollback for ordinary errors.
- [`update-incremental.mjs`](scripts/update-incremental.mjs) – accepts changed
  paths but currently performs a full rebuild for consistency. It reports this
  fallback; targeted incremental updates and their performance are not implemented.
  Its former shell adapter is removed.
- [`generate-index-by-path.mjs`](scripts/generate-index-by-path.mjs) – regenerates path-to-ID batches from all 16 validated by-id batches; its former `.sh` adapter is removed.
- [`generate-secondary-index.mjs`](scripts/generate-secondary-index.mjs) – regenerates alphabetical, directory or type references from validated by-id batches; invoke with `alpha`, `directory` or `type`. The three former shell adapters are removed.
- [`generate-index-master.mjs`](scripts/generate-index-master.mjs) – validates all secondary references against by-id before atomically replacing the master. Its former shell adapter is removed.
- [`generate-project-tree.mjs`](scripts/generate-project-tree.mjs) – Node engine for the legacy V2.1 JSON schema; output arguments are relative to the caller's working directory, while `PROJECT_ROOT` defaults to the script's project root. The former shell launchers are removed; from the project root invoke `node prompts/hard_points/system/structure/scripts/generate-project-tree.mjs [output-file]`.
- [`format-file-metadata.mjs`](scripts/format-file-metadata.mjs) – read-only replacement for the removed `format-file-metadata.sh`; accepts `<file_path> <tree|agents>` and writes one formatted line to stdout.
- [`watch-changes.mjs`](scripts/watch-changes.mjs) – Node directory-tree watcher; supports `watch`, `start`, `status`, and `stop`. Its former shell adapter is removed.
- [`watch-daemon.mjs`](scripts/watch-daemon.mjs) – authenticated daemon lifecycle and control, used by the watcher.

## Kimono structure provider (optional)

To only **list or navigate** the tree of a path (which files exist, their nature,
whether Kimono indexes them), prefer the optional Kimono tool `aikido_structure`
over generating `index.json`: it answers in a few hundred tokens and reflects the
caller's own snapshot. Apply the
[Kimono capability gate](../search/SKILL.md#kimono-capability-gate); this tool
needs `aikido_snapshot` and `aikido_structure` (possibly namespaced), discovered
from the executor's real tools, never assumed.

1. `aikido_snapshot` `begin`, then `aikido_structure` with `snapshotId`, `path`
   (subtree, no glob), `depth`, `type`, `idx` or `format: "text"` as needed.
2. Keep the returned `v` and pass it as `since`: `{unchanged: true}` means nothing
   moved; another user's change shows up after the next snapshot `begin`.
3. Folders are keys ending in `/`; a file is `[type, idx, size]` with `idx` 1 when
   Kimono indexes it. Kimono ignore rules apply (`.gitignore`, `exclude`, secrets,
   build output, `vendor`), so a few files the local script keeps may be absent.

The local scripts remain the fallback (tool missing, no snapshot, error) and are
required for what Kimono does not provide: `lines`, `modified` and `check_status`
of the V2.1 JSON, and every by-id/master index. Report the backend used.

Kimono types are finer than the V2.1 `type` field. Map them when a V2.1 consumer
(`by_type`) needs the legacy vocabulary:

| Kimono type | V2.1 `type` |
|---|---|
| `agent`, `concept`, `technique`, `use_case`, `hard_point` | same |
| `command`, `md`, `readme`, `changelog`, `skill` (Markdown) | `markdown`, or the memory-bank type of its folder (`hard_point` under `hard_points/`) |
| `shell` | `script` |
| `json` | `config` |
| any other type | `file` |

`README.md` and `SKILL.md` keep their own type in Kimono even under
`hard_points/`; the folder rule of the local script wins only for V2.1 output.
A project can refine natures with `KIMONO_TYPES_FILE` (glob rules, optional
`head` regex on the first 2 KB); the MCP returns them in its `types` legend.

## Usage
Claude automatically invokes this Skill when a query relates to **project structure** or when a **structure change** is detected (e.g. directory added/removed).
The typical process is:
1. Need detection (user query or watch event).
2. Skill execution following the **Instructions** above.
3. Return of a JSON report containing the actions performed and any points of attention.

## Notes
- **Stateless**: the Skill retains no state between invocations; it operates solely on the current state of the file system.
- **Scale**: no validated file-count or performance ceiling is claimed.
- **Encoding**: all outputs are in **UTF-8**.
- **Safety**: no script deletes project files outside `prompts/hard_points/system/structure/` without explicit confirmation. An operation may remove its own uniquely created OS temporary directory.
- **Orphan cleanup**: run from the project root via `/clean-index`. Invalid JSON, incomplete batches, unsafe paths or symlinks stop cleanup. Staged replacements and rollback mitigate ordinary write failures, but are not crash-atomic; avoid concurrent changes. Project files are never deleted.
- **Index limits**: default cleanup updates by-id and selected master fields only; run `/reindex-projet` before relying on secondary indexes. `--rebuild` instead regenerates all indexes from the current tree, including newly visible files, and refreshes metadata. See [`/clean-index`](../../commands/clean-index.md).
- **Secondary publication**: batches are staged before replacement, with rollback on ordinary failures. Changes across multiple files are not crash-atomic; prevent concurrent readers and writers. Each generator updates only its own index; the master and incremental updates remain separate.
- **Full publication**: a complete index is generated and validated before replacing existing generated files. Ordinary publication errors trigger rollback; a crash or concurrent filesystem changes can still leave mixed output, so prevent concurrent readers and writers. Unrelated files in index directories are preserved.
- **Master routing**: use `hash_tables.by_name[name].batch` for exact names, and all `batches` in by-path or by-type routes. The legacy `batch` field points only to the first batch. Generate the master only after all secondary indexes are current.
- **By-id scope**: `.gitignore` evaluation uses an isolated Git directory, not
  repository-local `info/exclude` or a user's global ignore configuration.
  Symlink entries are not indexed. Unsupported filenames, inaccessible files,
  detected file changes and ID collisions stop generation. File checks cannot
  prevent every hostile concurrent filesystem race; prevent concurrent writers.
- **Project tree JSON**: standard cache/build, `.env*`, log, swap and temporary
  paths plus Git-evaluated `.gitignore` rules (including negations and nested
  files) are excluded. Git is required; global excludes and repository-local
  `info/exclude` are deliberately disabled. Ignored directories are filtered
  before descent. Symlinks are skipped, unreadable or changing files stop the
  scan, and the selected output is replaced atomically only after generation.
  Symlink/non-file outputs are refused; the output parent must already exist.
  The JSON file remains the primary result; the historical human-readable size
  line is also written to stdout.
- **Metadata parity**: V2.1 project-tree and by-id entries count a final
  unterminated text line, classify `.mjs` as `script`, and use UTC `YYYY-MM-DD`
  modification dates. Other metadata can differ where the generators have
  distinct legacy contracts (for example text/binary detection and
  `check_status` heuristics).
- **Metadata formatting**: the Node engine preserves the `tree` and `agents`
  formats and their stdout/error exit contract. Text detection uses valid UTF-8
  without binary control bytes; only a missing path receives the friendly
  not-found message, while permission and other inspection/I/O errors remain
  visible. The helper does not modify input files.
- **Watcher**: non-recursive `fs.watch` handles are installed per visible
  directory, after Git evaluates applicable root and nested `.gitignore`
  rules. Git is required; global excludes and repository-local `info/exclude`
  are disabled. Built-in exclusions apply. All visible changes can stale the
  generated index and therefore trigger a full V3.1 rebuild after the
  `--batch-timeout` delay, expressed in seconds. Missing event names and
  inspection failures are logged and cause a conservative rebuild. Rebuilds
  are serialized; stopping closes watchers and waits for active/queued
  publication instead of killing a generator. Startup reports Git failures
  instead of reducing them to a readiness timeout. Notifications are logged;
  no agent is invoked.
  Daemon state and logs are confined to `prompts/spec/system/structure/cache`,
  whose components must not be symlinks. A per-root exclusive start lock
  remains for the daemon lifetime to prevent concurrent instances. Status and
  stop require a token-authenticated, HMAC-proven loopback identity matching
  the stored PID and root. The watcher never signals a PID; unverifiable state
  or locks cause an explicit refusal and require manual recovery. This protects
  against stale/reused PIDs and ordinary unrelated listeners, not a hostile
  process running as the same user that can read the mode-0600 token files.
  Foreground watch exits cleanly on SIGINT/SIGTERM. An old PID-only state file
  requires manual cleanup; it is never trusted as a signal target. The old `test` subcommand is deprecated because it
  could trigger project-wide regeneration; use isolated Node tests instead.
- **Compatibility**: removed shell entry points must be replaced with their
  documented Node invocations. Historical architecture examples are not
  current entry points.

## Associated Aikido Agents
- `agent-aikido-balancer` – ensures tree structure balance by applying depth and branching rules.
- `agent-aikido-maj-md-index` – updates navigation indexes after any structure modification.
- `agent-aikido-projet-index` – maintains the JSON index of the project structure.
- `agent-aikido-explore-all` – uses the **structure** Skill when it needs to analyse the global project structure.
