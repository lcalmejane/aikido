# AI-KIDO Changelog

All notable changes to the AI-KIDO project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## How releases are documented

- **`[1.4]` is the public baseline.** It is a full inventory of what AI-KIDO provides. It is the only entry that describes the project as a whole.
- **Every release after 1.4 is differential.** Its entry (and its GitHub release notes) lists only what changed since the previous tag, grouped as `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` and `Security`. It does not repeat the baseline.
- Each GitHub release body is the matching section of this file, copied as is.
- Add new work under `[Unreleased]` while developing. Rename it to the version number and date at tag time.
- Each release gets an annotated tag matching its heading (e.g. `1.4`).

## Version overview

| Version | Date | Highlights |
|---------|------|-----------|
| **Unreleased** | - | - |
| **1.4** | 2026-10-03 | First public release. English-language baseline, MIT license, secrets hardening |
| **1.3.3** | 2026-02-27 | Skill lifecycle management (install, update, uninstall from a Git group) |
| **1.3.1** | 2026-01-16 | External skills integration, `create-skill` command, technical audit plan |
| **1.2.1** | 2025-12-01 | Claude Code compatibility validated and consolidated |
| **1.3.0** | 2025-12-09 | Centralization of agents, commands and skills under `hard_points/` |
| **1.2** | 2025-11-21 | Core method: Memory Bank structure, 18 rules, first agents and commands |

---

## [Unreleased]

Nothing yet.

---

## [1.4] - 2026-10-03

First public release. This entry is the **baseline**: later releases only document differences from it.

### Baseline inventory

| Component | Count | Location |
|-----------|-------|----------|
| Internal agents | 14 | `prompts/hard_points/agents/` |
| Commands | 22 (21 core + 1 from the `web` skill) | `prompts/hard_points/commands/`, `prompts/hard_points/system/web/commands/` |
| System skills | 5 | `prompts/hard_points/system/` |
| Shell scripts | 59 | `prompts/hard_points/system/*/scripts/`, `prompts/hard_points/system/web/script/` |
| AI-KIDO rules | 18 | `prompts/hard_points/ai-kido.md` |
| Operating modes | 2 (STANDARD, LIGHT) | `ai-kido.md`, `ai-kido-light.md` |
| Roo Code custom modes | 13 | `.roomodes` |
| Claude Code agent mappings | 13 | `.claude/agents/` |
| Claude Code / Roo Code command mappings | 22 each | `.claude/commands/`, `.roo/commands/` |

### Method and Memory Bank

- Memory Bank construction method optimized for LLMs, based on 18 rules: tree structure, theory/practice separation, self-population, balancing, bidirectional links.
- Two modes: **STANDARD** (larger teams) and **LIGHT** (solo or small teams). Rule files are kept concise, with details split into `ai-kido_details.md` and `ai-kido-light_details.md`.
- Four knowledge domains in `prompts/gen/` (evolving) and `prompts/hard_points/` (immutable, validated): `concepts`, `techniques`, `personas`, `use_cases`. `hard_points` always take priority over `gen`.
- Single entry point `prompts/index.md` for both mono-project and multi-project setups.
- Structural constraints: files of at most 500 lines (1000 for agents, personas, commands and skills), tree depth of at most 4, 3 to 7 children per node.
- RACI matrix support to organize the Memory Bank by role, and a four-level persona taxonomy.
- Standard interface files: `AGENTS.md`, `CLAUDE.md`, `agents_list.md`, `commands_list.md`, `skills_list.md`.

### Internal agents (14)

| Agent | Purpose |
|-------|---------|
| `agent-aikido-explore-bank` | Memory Bank search with filtering and cross-references |
| `agent-aikido-explore-code` | Source code search with structured metadata and dependency mapping |
| `agent-aikido-explore-all` | Runs Bank and code search in parallel |
| `agent-aikido-truth-evaluator` | Determines authoritative sources, with last-check optimization |
| `agent-aikido-raci-delegator` | Classifies and routes documents by RACI role |
| `agent-aikido-doc-header` | Standardized document headers, versioning and validation metadata |
| `agent-aikido-projet-index` | Project tree manager backed by a JSON cache |
| `agent-aikido-bank-populate` | Populates the Memory Bank from code and context |
| `agent-aikido-validator` | Fast AI-KIDO compliance validation |
| `agent-aikido-balancer` | Memory Bank tree balancing |
| `agent-aikido-maj-md-index` | Keeps `index.md` files and `AGENTS.md` in sync |
| `agent-aikido-fusion` | Intelligent file fusion during updates |
| `agent-aikido-update-controller` | Controls updates: backup, validation, plan execution, rollback |
| `agent-aikido-helper` | Assistant for AI-KIDO usage questions |

- Internal agents are tools, agents and modes at once. Exchanges with them are encoded as JSON, with a single aggregated call per request.
- Documented inter-agent workflows, for example `explore-bank → truth-evaluator → raci-delegator`, `bank-populate → doc-header → validator` and `source update → fusion → truth-evaluator → doc-header → validator`.

### Commands (22)

- **Initialization**: `init-aikido`, `init-glossaire`, `init-raci-aikido`
- **Analysis and audit**: `analyse-project`, `analyse-aikido`, `check-truth`, `check-claude`
- **Maintenance**: `maj-aikido`, `reindex-projet`, `clean-index`, `list-command`
- **Creation**: `create-persona`, `create-command`, `create-skill`, `create-analyse-plan`, `create-search-plan`
- **Validation**: `validate-analyse-plan`, `validate-search-plan`
- **Skills and export**: `skill-manage` (search, install, update, uninstall), `compile-agent-from-use`, `optimize-command-with-aikido-agents`
- **Web**: `download-site` (provided by the `web` skill)

### System skills (5)

| Skill | Contents |
|-------|----------|
| `analyse` | Reusable analysis plans (survey, standard, in-depth, expert) and a complete technical audit plan |
| `maj` | Update process: ordered plans (`beginning`, `ending-0` to `ending-10`, version migration plans) and scripts for backup, diff, fusion, validation and rollback |
| `search` | Technology-aware code search plans (generic, JavaScript, PHP, Terraform) |
| `structure` | JSON project index (by path, directory, type, name), incremental updates, orphan cleaning, change watching |
| `web` | Website download and HTML to Markdown conversion |

- Skills are described in `prompts/hard_points/system/Skills.md`.
- Additional skills can be installed from a Git group with `skill-manage`. Defaults live in `prompts/hard_points/configuration/skills.cfg`.

### Tool integrations

- **Claude Code**: agent and command mappings in `.claude/`, generated and kept in sync by `check-claude`.
- **Roo Code**: custom modes in `.roomodes`, command wrappers in `.roo/commands/`, orchestrator rules in `.roo/rules-orchestrator/`. Reference documentation for Roo Code is bundled in `prompts/hard_points/roo-code/docs/`.
- Command sources live in `prompts/hard_points/commands/`. Tool-specific folders only hold thin wrappers.

### Update and migration

- `maj-aikido` updates an existing AI-KIDO installation from a Git repository, an archive or a local path. It offers per-file REPLACE, MERGE or IGNORE choices, replaces hard points automatically, creates backups and supports rollback.
- Migration plans are provided from the earlier layouts to V1.3.

### Documentation, license and governance

- `README.md` (English) and `README_FR.md` (French).
- MIT license (`LICENSE`). The AI-KIDO name and identity are covered by `TRADEMARK.md`.
- `refactor/` contains the planning documents for the ongoing refactoring (translation, manifest, dependency graph, install mechanism, common layer, validation).

### Changes made for the public release

- Documentation and comments translated to English.
- `GIT_TOKEN` removed from `skills.cfg`. The token is read from the `AIKIDO_GIT_TOKEN` environment variable or from an untracked `skills.local.cfg`. See *Security*.
- `.gitignore` extended with `*.local.cfg`, `.env*`, `*.pem`, `*.key` and `.claude/settings.local.json`.
- Example `.roomodes` file removed from `prompts/hard_points/` and its reference removed from `prompts/hard_points/index.md`.
- Git history rewritten to remove the removed example file and to redact a previously committed access token. All commit hashes and earlier tags were rewritten. Re-clone any existing copy of the repository.

### Security

- The previously committed token was revoked and redacted from the entire Git history. Never commit secrets to `skills.cfg`.

### Known limitations

- The version string in `prompts/hard_points/ai-kido.md` still reads `1.3.1-LLM`.
- Some Memory Bank content, examples and older Git commit messages are still written in French.
- `.claude/agents/` has no mapping for `agent-aikido-helper`, and `.roomodes` defines no mode for it. The `agent-aikido-maj-md-index` mapping is still named `agent-aikido-indexer`.

---

## Previous versions

These entries are kept for history. Later releases are differential.

### [1.3.3] - 2026-02-27

#### Added
- Skill lifecycle management: install, update and uninstall skills from a remote Git group (`skill-get`, `skill-update`, `skill-uninstall`), configured through `skills.cfg`.

#### Changed
- The three skill commands were merged into `skill-manage`, with the old names kept as shortcuts.
- The `logllm` commands were moved out of the core into a skill.
- Improved semantic density of command files.

### [1.3.1] - 2026-01-16

#### Added
- `create-skill` command, which also packages an existing command into an AI-KIDO skill. The skill skeleton includes a Personas directory.
- Complete technical audit analysis plan (credit: Ludovic Landschoot).
- Integration of external skills (Jira, Confluence) and web search script fixes.

#### Changed
- Jira and Confluence access moved to the aikido.fr MCP servers.

#### Fixed
- `reindex-projet` command errors.

### [1.3.0] - 2025-12-09

#### Added
- Centralization of agents (`prompts/hard_points/agents/`), commands (`prompts/hard_points/commands/`) and skills (`prompts/hard_points/system/`).
- Five base skills: `analyse`, `maj`, `search`, `structure`, `web`.
- Eight new agents: `explore-code`, `explore-all`, `projet-index`, `doc-header`, `fusion`, `update-controller`, `maj-md-index` and `helper`.
- Unified entry point `prompts/index.md`.
- Claude Code mappings in `.claude/`, and `agents_list.md`, `skills_list.md` and `commands_list.md`.
- JSON inter-agent communication format.

#### Changed
- `ai-kido.md` and `ai-kido-light.md` were split into concise rule files plus `*_details.md` files.
- `.roo/commands/` entries became wrappers around `prompts/hard_points/commands/`.
- `agent-aikido-indexer` was renamed `agent-aikido-maj-md-index`.
- `explore-bank` moved to a strict-budget, Grep-only design, and agents use the `projet-index` cache as a fast path.

#### Fixed
- Infinite inter-agent call loops.
- POSIX `sh` compatibility of bash scripts.

### [1.2.1] - 2025-12-01

- AI-KIDO and Claude Code compatibility validated and consolidated.

### [1.2] - 2025-11-21

#### Added
- Base method with 18 rules, STANDARD and LIGHT modes, and the four Memory Bank domains.
- Six base agents: `explore-bank`, `truth-evaluator`, `raci-delegator`, `validator`, `balancer`, `bank-populate`.
- Ten base commands, including `init-aikido`, `init-glossaire`, `init-raci-aikido`, `analyse-project`, `analyse-aikido`, `create-persona` and `compile-agent-from-use`.
- `README.md`, `AGENTS.md`, `CLAUDE.md` and the LLM interaction logging commands.

---

## License

MIT - © 2025-2026 aikido.fr (see [LICENSE](LICENSE)). The AI-KIDO name and identity are covered by [TRADEMARK.md](TRADEMARK.md).
