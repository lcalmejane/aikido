---
description: "Manage the complete lifecycle of AI-KIDO skills: search, install, update, and uninstall from a remote Git group"
---

# /skill-manage

**Purpose**: Manage the full lifecycle of AI-KIDO skills — search, install, update, and uninstall from a remote Git group.

**Paradigm**: the LLM talks to the user and decides; every file/Git side effect runs through the [deterministic engine](#deterministic-engine) so each execution is identical and bounded.
**Config**: [`skills.cfg`](../configuration/skills.cfg) · Priority: `CLI arg` → `env AIKIDO_GIT_TOKEN` → `skills.local.cfg` (untracked, secrets) → `skills.cfg` → hardcoded default
**Backward-compatible shortcuts**: `/skill-get`, `/skill-update`, `/skill-uninstall` → resolved to this command

**Global invariants**:
- Explicit confirmation before any destructive modification (except `--dry-run`)
- Files `prompts/hard_points/commands/{cmd}.md` modified manually → separate confirmation, never silently deleted
- Pre/post scripts executed **before** any file modification
- Registries (`skills_list.md`, `commands_list.md`) cleaned/updated after each operation

---

## Deterministic engine

Script: [`system/skill-manage/skill-manage.mjs`](../system/skill-manage/skill-manage.mjs) (Node.js 24+, no dependency, one JSON object on stdout, exit code 1 + `{"status":"error","code","message"}` on failure). Installed or updated skills are checked against the [Default Tooling Standard (Node.js)](../system/Skills.md#default-tooling-standard-nodejs): report non-Node scripts (`.sh`, `.py`, `.ps1`…) as a deviation without rewriting third-party skills unasked.

**Rule**: for the `catalog` layout (`GIT_LAYOUT=auto|catalog`), the LLM MUST NOT run `git clone`, `cp`, `mv`, `rm`, `tar` or write into `TARGET_DIR` itself. It calls the engine, reads the JSON `status`, asks the user when the status requires it, then calls the engine again.

```
node prompts/hard_points/system/skill-manage/skill-manage.mjs <config|list|search|get|update|uninstall> [options]
```

| Action | Engine call | Statuses to handle |
|--------|-------------|--------------------|
| config | `config` | `ok` (token always masked) |
| list | `list` | `ok` |
| search | `search --query Q [--scope local\|remote\|all] [--source ID\|all]` | `ok` |
| get | `get --name N [--source catalog\|ID] [--on-conflict M] [--dry-run]` | `installed` · `dry_run` · `conflict` · `skipped` · `confirmation_required` |
| update | `update --name N [--dry-run]` | `installed` · `up_to_date` · `dry_run` · `confirmation_required` |
| uninstall | `uninstall --name N [--purge] [--dry-run]` | `uninstalled` · `dry_run` |

Status handling:
- `confirmation_required` (third-party skill) → show `fileList` and `scripts` to the user; only after an explicit yes, repeat the call with `--confirm-third-party`.
- `conflict` → show `reason`; repeat with `--force` only after explicit confirmation.
- Run `--dry-run` first, then confirm, then run for real (every destructive action).
- Never pass a token on the command line: it comes from `AIKIDO_GIT_TOKEN` or the untracked `skills.local.cfg`.

Guarantees enforced by the engine: skill names `^[a-z0-9][a-z0-9-]*$`; `TARGET_DIR` must stay inside the workspace; repository URLs limited to `https://` (no embedded credentials), SSH or an absolute local path; shallow clones without `.git`; symbolic links, > 2000 files or > 50 MB refused; `SKILL.md` required (≤ 500 lines for published skills); staging directory + atomic rename; previous copy kept in `{TARGET_DIR}/.backups/` (never deleted without `--purge`); provenance in `.aikido-source.json`; skill scripts are never executed.

**Every installed CLI, not only the caller** — pass `--sync-hosts` to the engine call that really writes (`get`, `update`, `uninstall`; ignored by `--dry-run` and read-only actions). The engine then runs [`system/host-sync/host-sync.mjs`](../system/host-sync/host-sync.mjs): it detects the assistant CLIs and editor extensions installed on this machine (PATH and extension folders only, no process spawned), adds the hosts remembered in `.aikido/state/hosts.json`, and brings each one up to date through the same audited `/check-cli` engine (commands, agents/modes, Skills, instruction files). The result is returned as `hostSync` next to the install result. A host problem never turns a successful install into an error: report `hostSync.results[].status` (`conflict` = customized wrapper preserved) and `hostSync.status` (`runtime-missing` = no retained package, tell the user to run `aikido sync` or `/check-cli` once). `hostSync.hints` lists hosts that only have a workspace directory but no CLI on this machine: never synchronise those without asking.

After `installed`, `up_to_date`, or `uninstalled`, run the `/check-cli` registration gate for the **calling CLI**. This is mandatory even when an update reports `up_to_date`: wrappers may be missing, stale, or customized independently of the skill source. Identify the host from the active CLI context (never from model choice or directories); if ambiguous, ask for a host ID from `distribution/catalog.json`. When `--sync-hosts` was used and `hostSync.status` is `ok`, the calling CLI is already covered; the gate then only has to confirm it.

Run `/check-cli --check` first. After install/update, preview and, with explicit approval, apply missing or stale wrappers for the installed skill. After uninstall, preview and apply removal of clean managed wrappers; preserve customizations and report conflicts for manual resolution. Never use `--force` to replace an unmarked wrapper. The engine is read-only except for explicitly approved `--repair`, does not execute skill files, and reports host runtime discovery separately from file conformity.

The `group` layout (one repository per skill) has no install engine yet: show the exact commands to the user and wait for approval before running them. Once an install/update/uninstall is complete, the same `/check-cli` gate still applies.

Tests: `node --test prompts/hard_points/system/skill-manage/skill-manage.test.mjs`.

---

## Usage

```
/skill-manage <action> [options]

  search    Search among remote and/or installed skills
  get       Install a skill from Git
  update    Update one or more installed skills
  uninstall Uninstall a skill and clean registries

/skill-manage search    [--query TERM] [--scope remote|local|all] [--source ID|all] [--group URL] [--token TOKEN] [--target DIR] [--verbose]
/skill-manage get       [--skill NAME] [--source ID] [--group URL] [--target DIR] [--branch REF] [--token TOKEN] [--on-conflict update|reinstall|skip|ask] [--dry-run] [--verbose]
/skill-manage update    [--skill NAME|all] [--group URL] [--target DIR] [--branch REF] [--token TOKEN] [--strategy pull|reinstall] [--backup] [--dry-run] [--verbose]
/skill-manage uninstall [--skill NAME] [--target DIR] [--backup] [--purge] [--dry-run] [--verbose]
```

## Prerequisites

Read and apply [`skills.cfg`](../configuration/skills.cfg) before any action. Apply CLI/env overrides on top.

## Global Configuration

| `skills.cfg` Key | CLI Arg | Default | Description |
|-----------------|---------|---------|-------------|
| `GIT_GROUP` | `--group` | `git@github.com:lcalmejane/aikido-skills` | Git group/org URL (SSH · HTTPS · local) |
| `GIT_LAYOUT` | — | `auto` | `catalog` · `group` · `auto` (catalog if `catalog.json` exists at the repository root) — see [Source layouts](#source-layouts) |
| `GIT_TOKEN` | `--token` | *(empty)* | Private token · masked in logs · env `AIKIDO_GIT_TOKEN` takes priority · never store in versioned `skills.cfg` (use `skills.local.cfg`, git-ignored) |
| `GIT_DEFAULT_BRANCH` | `--branch` | `main` | Target branch/tag |
| `TARGET_DIR` | `--target` | `prompts/hard_points/system` | Root directory for skills |
| `AUTO_RUN_SCRIPTS` | — | `false` | Auto-execute `.sh` scripts without confirmation |
| `VALIDATE_AFTER_INSTALL` | — | `true` | AI-KIDO compliance validation after operation |
| `VALIDATION_LEVEL` | — | `warn` | `strict` blocks · `warn` continues · `skip` disables |
| `AUTO_UPDATE_SKILLS_LIST` | — | `true` | Update `skills_list.md` |
| `AUTO_UPDATE_COMMANDS_LIST` | — | `true` | Update `commands_list.md` |
| `AUTO_CREATE_COMMAND_MAPPINGS` | — | `true` | Create/update `.roo/commands/` + `.claude/commands/` |
| `VERBOSE` | `--verbose` | `true` | Detailed log per file/operation |
| `DISPLAY_FORMAT` | — | `table` | List format: `table` · `list` · `compact` |
| `MAX_PROJECTS_DISPLAY` | — | `50` | Maximum number of skills displayed |

## Local source

`GIT_GROUP` (or `--group`) may be an absolute path to a folder that holds `catalog.json`: a Git repository (cloned
shallowly) or a plain downloaded folder without `.git` (copied; its identity is `local-<content digest>`, so
`update` detects any change and the source folder is never modified). A local source is never refused for its
identity: the result reports `versionChange` (`initial`, `upgrade`, `same`, `downgrade`, `unknown`) and `warnings`
(regression, local origin), and `.aikido-source.json` records `local: true` and, for a regression,
`regression_from`. Tell the user, then proceed once confirmed. Symbolic links and oversized content are still refused.

## Source layouts

**`group`** — one repository per skill; the pipelines below use the group API (`/api/v4/groups/...`).

**`catalog`** — `GIT_GROUP` is one repository (default `aikido-skills`) containing:
- `catalog.json` — AI-KIDO skills ready to install: `name`, `description`, `version`, `category`, `path` (`skills/<name>`)
- `sources.json` — external repositories (`id`, HTTPS `repo`, `ref`, `layout`, `roots`, `trust: third-party`)

Catalog pipelines (replace API calls in `search`, `get` and `update`):
1. **Fetch** — shallow clone of `GIT_GROUP` at `GIT_DEFAULT_BRANCH` into a temporary directory; read `catalog.json` and `sources.json`. The clone is read-only and removed afterwards.
2. **Published skills** — `search` filters `catalog.json` entries (name, description, category); `get` copies `{path}/` into `{TARGET_DIR}/{name}/` without `.git/`.
3. **External skills** (`--source ID|all`, or chosen interactively after the published skills) — shallow clone the source, then list directories containing `SKILL.md`: `skills-dir` → `<root>/<skill>/`; `plugin-marketplace` → `<root>/<plugin>/skills/<skill>/`. Only skills are importable (never hooks, MCP servers or plugin agents).
4. **Third-party safeguard** — before copying an external skill, show its file list and flag scripts/executables; require explicit confirmation; never run its scripts unless the user confirms each one, regardless of `AUTO_RUN_SCRIPTS`.
5. **Provenance** — write `{TARGET_DIR}/{name}/.aikido-source.json` (`source`, `repo`, `ref`, `commit`, `version`, `installed_at`). `update` compares `commit` (external) or `version` (published) with the remote and replaces the directory after confirmation. Registration and registry steps are unchanged.
6. **Name collision** — an installed skill with the same name from another source is never overwritten silently: apply `--on-conflict`.

## Steps

### Phase 0 — Bootstrap (all actions)

1. Load [`skills.cfg`](../configuration/skills.cfg), apply CLI/env overrides.
2. `GIT_GROUP` empty AND action requires Git → ask the user for URL + token (**blocking**).
3. Resolve the layout from `GIT_LAYOUT` (see [Source layouts](#source-layouts)).
4. `TARGET_DIR` does not exist → `❌ Directory not found` (**blocking** for `uninstall`) · create with `mkdir -p` for `get`.
5. Display active config summary (token masked as `****`).

---

### ACTION `search` — Search Skills

**Action-specific parameters**:

| CLI Arg | Default | Semantics |
|---------|---------|-----------|
| `--query` | *(interactive)* | Term(s): name, keyword, description, category |
| `--scope` | `all` | `local` = installed · `remote` = Git repository · `all` = both |

**Pipeline**:

1. **Query** — `--query` absent → ask the user. Display: `🔍 "{query}" | scope: {scope}`
2. **Local** *(scope `local`/`all`)* — `find {TARGET_DIR} -name "SKILL.md" -maxdepth 2` · extract slug / description / commands / version / category · filter on `{query}` (case-insensitive) → `LOCAL_MATCHES[]`
3. **Remote** *(scope `remote`/`all`)* — `GET /api/v4/groups/{group_encoded}/projects?search={query}&per_page=100` · fallback: full list + LLM filter if API unavailable · mark `✅ INSTALLED` if `{TARGET_DIR}/{slug}/SKILL.md` present → `REMOTE_MATCHES[]`
4. **Display**:
   ```
   📦 INSTALLED  # │ Slug │ Version │ Description │ Commands
   🌐 REMOTE     # │ Name │ Description │ Activity │ ✅ INSTALLED / ⬇️ AVAILABLE
   ```
   No results → `ℹ️ No skill found for "{query}" [scope: {scope}]`
5. **Interactive action** *(if uninstalled remote results exist)* → ask the user:
   - `1. Install` → chain `get --skill {NAME}`
   - `2. Details` → `GET /api/v4/projects/{id}/repository/files/SKILL.md/raw?ref={branch}` · display description / commands / version / author
   - `3. New search` · `4. Quit`

**Errors**:

| Error | Resolution | Blocking? |
|-------|-----------|:---------:|
| `--query` empty | Interactive input | ✅ |
| Remote API unreachable | Warning + local results if `all` | ❌ |
| `GIT_GROUP` empty (scope `remote`/`all`) | Ask user for URL + token | ✅ `remote` · ❌ `all` |
| Expired token | Ask user for new token | ✅ remote |

---

### ACTION `get` — Install a Skill

**Action-specific parameters**:

| CLI Arg | Default | Semantics |
|---------|---------|-----------|
| `--on-conflict` | `update` | If skill already present: `update` · `reinstall` · `skip` · `ask` |

**Pipeline**:

1. **Discovery** — `GET /api/v4/groups/{group_encoded}/projects?per_page=100` · display `# │ Name │ Description │ Activity` · mark `✅ INSTALLED` for skills with `SKILL.md` in `TARGET_DIR/`
2. **Selection** — ask the user (number or name) · if already installed → `1. UPDATE` · `2. REINSTALL` · `3. CANCEL` · Variables: `SELECTED_SKILL`, `SKILL_REPO_URL`, `INSTALL_MODE`
3. **Download**:
   - New → `git -c http.extraHeader="PRIVATE-TOKEN:{TOKEN}" clone --depth=1 {URL} {TARGET_DIR}/{SKILL}`
   - Fallback → GitLab API archive `archive.tar.gz?sha={branch}` + tar extraction
   - Existing → `git fetch --all --tags` + branch/tag selection
   - Report: path · version · file count · ✅/❌
4. **Scripts** — detect in `{SKILL_PATH}/`: `SKILL.md` (**mandatory**, absent = ⚠️ partial install) · `install*.md`/`INSTALL*.md` → apply via LLM · `install*.sh`/`setup*.sh` → if `AUTO_RUN_SCRIPTS=false`: confirm Y/n · continue on error
5. **AI-KIDO Registration** — extract from `SKILL.md`: name, description, commands (`## Available Commands`)

   | File | Action |
   |------|--------|
   | `skills_list.md` | Add `- **{slug}** – {desc} – [{SKILL.md link}]` |
   | `commands_list.md` | Add one entry per exposed command |
   | `.roo/commands/{cmd}.md` | Create mapping (template below) |
   | `.claude/commands/{cmd}.md` | Same |
   | `prompts/hard_points/commands/{cmd}.md` | Create if absent |

   Mapping template for `.roo/` and `.claude/`:
   ```markdown
   ---
   description: "{command description}"
   ---
   # Command {name}
   This command executes `{command-path}`.
   **EXECUTION**: Read and apply the instructions from the target file.
   ```

   Agents: `agent-aikido-maj-md-index` (registries) · `agent-aikido-validator` (SKILL.md compliance validation)

---

### ACTION `update` — Update Skills

**Action-specific parameters**:

| CLI Arg | Default | Semantics |
|---------|---------|-----------|
| `--skill` | *(interactive)* | Slug or `all` |
| `--strategy` | `pull` | `pull` = `fetch + merge --ff-only` · `reinstall` = `rm -rf + clone --depth=1` |
| `--backup` | `false` | Copy `{SKILL_PATH}` → `{SKILL_PATH}_backup_{date}` before modification · duplicate → increment `_2`, `_3`… |
| `--dry-run` | `false` | Report without writing, stop after detection |

**Pipeline**:

1. **Inventory** — `find {TARGET_DIR} -name "SKILL.md" -maxdepth 2` · extract slug / version (`git describe` or `log -1`) / status (`.git/` → `✅ git-managed` · absent → `⚠️ archive`) · display `# │ Slug │ Version │ Status │ Path` · no skill found → suggest `get` + **stop**
2. **Scope** — `--skill all` → all · `--skill NAME` → verify existence · absent → interactive selection + `0. All` · Variable: `UPDATE_TARGETS[]`
3. **Update detection**:
   - Git: `fetch --all --tags` + `log HEAD..origin/{branch} --oneline` → `✅ Up to date` · `⬆️ {N} commits` · `❌ Error`
   - Archive: compare `committed_date` API vs `installed_at` SKILL.md · absent → `⚠️ reinstall recommended`
   - `--dry-run` → display report + **stop**
4. **Confirmation & Backup** — summary `Skills to update: {N} · strategy · backup` → ask the user CONFIRM/CANCEL · backup → copy before any write
5. **Apply**:
   - `pull`: `fetch --all --tags` + `checkout {branch}` + `pull --ff-only` · divergence → ask the user MERGE / RESET --hard / SKIP · `RESET --hard` = explicit confirmation required
   - `reinstall`: `rm -rf {SKILL_PATH}` + `clone --depth=1`
   - Archive fallback: extract → `{SKILL_PATH}_tmp/` → replace (preserve `.git/`)
   - Report: `✅ {v_before} → {v_after}` · `⚠️ partial` · `❌ failed`
6. **Post-update scripts** — priority: `update*.md`/`UPDATE*.md` (LLM) → `update*.sh`/`post-update*.sh` (confirm if `AUTO_RUN_SCRIPTS=false`) → fallback `install*.sh` · error → log + continue
7. **Sync registries** — diff `SKILL.md` before/after:

   | File | Condition | Action |
   |------|-----------|--------|
   | `skills_list.md` | version/desc changed | Update line |
   | `commands_list.md` | command added/removed | add/delete |
   | `.roo/commands/{cmd}.md` | command modified/added | recreate |
   | `.claude/commands/{cmd}.md` | same | same |
   | `prompts/hard_points/commands/{cmd}.md` | new command | create |

   `SKILL.md` absent → partial sync + warning · Agents: `agent-aikido-maj-md-index` · `agent-aikido-validator`

8. **Report**:
   ```
   ╔══════════════════════════════════════════════════════╗
   ║              SKILL-UPDATE REPORT                     ║
   ╠══════════╦════════════╦════════════╦════════════════╣
   ║ Skill    ║ Before     ║ After      ║ Status         ║
   ╠══════════╬════════════╬════════════╬════════════════╣
   ║ {slug}   ║ {v_before} ║ {v_after}  ║ ✅ updated     ║
   ╚══════════╩════════════╩════════════╩════════════════╝
   Duration: {t}s  |  Backups: {N}
   ```

---

### ACTION `uninstall` — Uninstall a Skill

**Action-specific parameters**:

| CLI Arg | Default | Semantics |
|---------|---------|-----------|
| `--skill` | *(interactive)* | Target slug |
| `--backup` | `false` | Copy before deletion · duplicate → increment `_2`, `_3`… |
| `--purge` | `false` | Also delete existing backups `{slug}_backup_*` |
| `--dry-run` | `false` | Report without writing, stop after dependency analysis |

**Pipeline**:

1. **Inventory** — `find {TARGET_DIR} -name "SKILL.md" -maxdepth 2` · extract slug / description / commands / existing backups · display `# │ Slug │ Description │ Commands │ Backups │ Path` · no skill → **stop**
2. **Resolution** — `--skill NAME` → verify `SKILL.md` · absent → error + list · without `--skill` → interactive selection · Variables: `SELECTED_SKILL`, `SKILL_PATH`
3. **Dependency analysis** — extract `COMMANDS_LIST` + `MODES_LIST` (grep `.roomodes`) · for each `cmd`: detect manual modification of `prompts/hard_points/commands/{cmd}.md` → mark `⚠️ MODIFIED`

   Planned report:
   ```
   Skill      : {slug} → {SKILL_PATH}/
   Commands   : {cmd1}, {cmd2}, …
   .roo       : .roo/commands/{cmd}.md, …
   .claude    : .claude/commands/{cmd}.md, …
   hard_points: prompts/hard_points/commands/{cmd}.md  [⚠️ MODIFIED?]
   Registries : skills_list.md (1), commands_list.md ({N})
   Backups    : {purge: list | none}
   ```
   `--dry-run` → **stop here**

4. **Confirmation & Backup** — ask the user: CONFIRM / CONFIRM WITH BACKUP / CANCEL · backup → copy before any deletion · `⚠️ MODIFIED` files → individual confirmation (unless `--purge`)
5. **Pre-removal instructions** — inspect `uninstall*.md` and
   `UNINSTALL*.md` with host Read actions. Never execute `.sh` files; report
   their presence and request an explicitly approved non-shell alternative.
6. **Deletion**:
   Delete selected paths with the host's file-delete action only after confirmation. Remove
   clean generated mappings and the approved skill directory; preserve
   modified command sources and retain backups unless `--purge` was explicitly
   selected. Use recursive deletion only for the verified skill directory,
   never a derived or unchecked path.
   Report: `✅ deleted` · `❌ failed` · `⏭️ preserved (manually modified)`
7. **Registry cleanup** — `agent-aikido-maj-md-index`: delete `{slug}` line from `skills_list.md` + all command entries from `commands_list.md` · verify no duplicates/orphans remain
8. **Report**:
   ```
   ╔══════════════════════════════════════════════════════════╗
   ║              SKILL-UNINSTALL REPORT                      ║
   ╠══════════════════════════════════════════════════════════╣
   ║ Skill deleted        : {slug} ({SKILL_PATH})             ║
   ║ Commands             : {N} deleted ({cmd1}, …)           ║
   ║ .roo/.claude mappings: {N} deleted                       ║
   ║ hard_points preserved: {N} (manually modified)           ║
   ║ Registries cleaned   : skills_list.md, commands_list.md  ║
   ║ Backup               : {path | none}                     ║
   ║ Backups purged       : {N | none}                        ║
   ╚══════════════════════════════════════════════════════════╝
   ```
   Reminder: `/skill-manage get {slug}` to reinstall · `/check-claude` to verify consistency

---

## Output

Each action produces a structured report (see report blocks above). Verbose mode logs each file/operation individually.

---

## Notes

### Error Handling (all actions)

| Error | Resolution | Blocking? |
|-------|-----------|:---------:|
| `GIT_GROUP` empty (Git required) | Interactive URL + token questionnaire | ✅ |
| `TARGET_DIR` does not exist | Explicit message · auto-create (`get`) | ✅ (`uninstall`) |
| No skill installed | Message + suggest `get` | ✅ |
| Skill `{NAME}` not found | Error + inventory list | ✅ |
| HTTPS clone blocked | Fallback GitLab API archive | ❌ |
| Token expired/invalid | Ask user for new token | ✅ |
| `SKILL.md` absent after operation | Partial sync + warning | ❌ |
| `git pull` conflict | MERGE / RESET --hard / SKIP | per choice |
| `.sh` script error | Log warning, continue | ❌ |
| Backup already exists | Increment suffix `_2`, `_3`… | ❌ |
| Command file manually modified | Separate confirmation (unless `--purge`) | per choice |

### AI-KIDO Rules

- Structure `prompts/hard_points/system/{slug}/` is mandatory · `SKILL.md` required for complete operation
- Mappings `.roo/commands/` + `.claude/commands/` mandatory for every exposed command
- Systematic duplicate detection before any addition · command files constrained to ≤1000 lines

### Integration

```
/skill-manage search    → discover before installing
/skill-manage get       → initial installation
/skill-manage update    → updates (targeted or --skill all)
/skill-manage uninstall → clean uninstall
/check-claude           → verify consistency after operation
/analyse-aikido         → full compliance audit
```

---
*Agents: `agent-aikido-validator` · `agent-aikido-maj-md-index` · Created 2026-02-27*
