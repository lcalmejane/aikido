# Installed State, Managed Blocks and Merge Policy

> **Status**: approved design for AI-KIDO 1.5 (decision D05, validated by the maintainer on 2026-10-24).
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

## 3. Baseline and hash-based update decisions

The lock stores each installed file's base hash; `.aikido/state/baseline/` stores the corresponding
bytes as a local verification/recovery cache (not versioned, see D08). The current runtime compares
the base, local and incoming hashes. It does not attempt a text merge: if both local and upstream
content differ from the base and from each other, it reports a conflict and writes nothing until the
user resolves it and replans. Missing or damaged baseline bytes can be regenerated from an incoming
file when its hash is sufficient to make the decision; an ambiguous local/upstream change remains a
conflict.

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

## 7. Update transaction and recovery

`scripts/update-plan.mjs` first validates the package and lock, then prints a read-only plan with a
confirmation ID. Applying requires that exact ID; the runtime recomputes the plan and checks every
target again before writing. Conflicts block the entire apply.

Before changing targets, apply stores their prior bytes, existence and permissions in a unique
`.aikido/backups/updates/update-<id>/` directory. This includes the lock and baseline files. Writes
are transactional: detected failures roll back already-applied operations, and the lock is written
last. The returned backup path can also restore the prior state after interruption:

```bash
node /path/to/package/scripts/update-plan.mjs \
  --root /path/to/project --recover .aikido/backups/updates/<update-id>
```

Recovery verifies the backup manifest and every stored hash, restores the lock last, and retains the
backup for audit or a repeated recovery. A backup protects only the files in the update plan; it does
not snapshot unrelated project content.

## 8. Adapter-only uninstall

`scripts/update-plan.mjs --uninstall` previews removal of host wrapper files whose contents still
match the installed lock, plus the exact managed instruction blocks. Modified wrappers and blocks
are kept as user-owned content and reported; malformed blocks are never guessed at. The lock is
retained with method payload and generated-list entries so knowledge remains readable and can still
be updated. Uninstall also removes adapter baselines and saves a targeted backup before writing.

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

A project initialized before 1.5 has `prompts/hard_points/` but no lock. Migration compares existing
three-way files and adapter files with the selected validated package, records the package contents
as their baseline, and never rewrites project files. Exact matches are `adopt`; differing local
contents are `keep-local`. Missing files and create-only indexes are skipped. Managed blocks are
tracked only when their current body exactly matches the package; customized or malformed blocks
remain preserved and unmanaged. Migration writes the baseline and lock only after explicit
confirmation; it does not alter user instructions, `gen/` or `spec/`.
