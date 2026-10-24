# Installed State, Managed Blocks and Merge Policy

> **Status**: proposal for AI-KIDO 1.5 (decision D05, pending maintainer validation).
> **Code**: [`lib/lock.mjs`](../lib/lock.mjs), [`lib/managed-blocks.mjs`](../lib/managed-blocks.mjs).
> **Schema**: [`schemas/lock.schema.json`](../schemas/lock.schema.json).

## 1. What a bootstrapped project contains

| Path | Versioned | Written by | Policy |
|---|---|---|---|
| `prompts/hard_points/**` | yes | bootstrap / update | `three-way` (payload, local edits allowed) |
| `prompts/index.md`, `prompts/gen/**/index.md`, `prompts/spec/index.md` | yes | bootstrap, then the user and `/init-aikido` | `create-only` |
| `agents_list.md`, `commands_list.md`, `skills_list.md` | yes | bootstrap, then `agent-aikido-maj-md-index` | `three-way` (generated) |
| Block `core` in `AGENTS.md`, `CLAUDE.md` (Claude hosts) | yes | bootstrap / update | `managed-block` |
| Block `state` in `.gitignore` | yes | bootstrap / update | `managed-block` |
| Host files (`.claude/`, `.roo/`, `.github/agents/`...) | yes | host adapters | `three-way` (origin `adapter`) |
| `.aikido/lock.json` | **yes** | bootstrap / update, after success only | - |
| `.aikido/state/baseline/**` | no | bootstrap / update | cache of installed contents |
| `.aikido/backups/**`, `prompts/spec/logs/**` | no | update, logging | local only |

Everything else (`prompts/gen/**` content, project code, user sections of `AGENTS.md`) is never touched.

## 2. The lock

`.aikido/lock.json` records, for one project:

- `aikido.version` and an immutable `aikido.source` (`git`, `archive`, `plugin` require a full commit SHA;
  `local` is allowed for development and cannot be reproduced by teammates);
- `mode` (`STANDARD`, `LIGHT`, or `UNSET` before `/init-aikido`) and the selected `hosts`;
- `files`: one entry per installed file with its SHA-256 at install time, `origin` and `policy`;
- `managedBlocks`: one entry per block with the SHA-256 of its body.

Rules: project-relative POSIX paths only (no absolute path, `~`, drive letter, `..`, backslash);
no user name, machine path, token or secret; written atomically and only after the installation succeeded.

## 3. Baseline: why a cache is enough

A true three-way merge needs the **installed content** (base), not only its hash.
The base is stored in `.aikido/state/baseline/` (not versioned, see D08). It is a cache:
a teammate who cloned the project can rebuild it from the pinned `aikido.source.commit`,
then verify every file against the lock hashes before trusting it. If the base cannot be
recovered (for example a `local` source), the update falls back to two-way and reports
every locally modified file as a conflict instead of guessing.

## 4. Decisions per file

Inputs are content hashes, `null` when absent: `base` (lock), `local` (project), `next` (new version).

| base | local | next | Decision |
|---|---|---|---|
| B | B | B | `unchanged` |
| B | B | N | `update` |
| B | L | B or L | `keep-local` |
| B | L | N | `conflict` (attempt a text merge, otherwise ask) |
| B | absent | B | `keep-deleted` |
| B | absent | N | `conflict-deleted-locally` |
| B | B | absent | `delete` |
| B | L | absent | `keep-modified-orphan` (reported) |
| absent | absent | N | `add` |
| absent | N | N | `adopt` |
| absent | L | N | `conflict-collision` |

`create-only` files are added when missing at first install and then belong to the project:
they are never overwritten, and a deleted one is not recreated.

Conflicts are never resolved silently. Agents such as `agent-aikido-fusion` may **propose** a merge;
the write itself is decided by these rules and confirmed by the user.

## 5. Managed blocks

A managed block is the only part of a user file that AI-KIDO rewrites:

```markdown
<!-- aikido:begin id=core - managed by AI-KIDO, edit outside this block -->
...
<!-- aikido:end id=core -->
```

`.gitignore` uses `# aikido:begin id=state ...` / `# aikido:end id=state`.

- Insert: appended at the end of the file, user content preserved byte for byte; idempotent.
- Update: only the body is replaced. If the body hash differs from the lock, the block was edited
  locally: report a conflict and offer to move the edit outside the block.
- Remove (uninstall): the block and its separating blank line are removed, nothing else.
- Malformed markers (unclosed, nested, duplicate) stop the operation; nothing is guessed.
- `/init-aikido` writes the project context **outside** the block.

## 6. Legacy installations without a lock

A project initialized before 1.5 has `prompts/hard_points/` but no lock. Migration compares each file
with the release it most likely came from (version detection of `/maj-aikido`), records matching files
as `base = local`, and treats differing files as `keep-local` until the user reviews them.
No re-bootstrap and no overwrite are required.
