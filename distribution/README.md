# AI-KIDO distribution

AI-KIDO can be installed into a project for the assistant you use. Each
package contains the host integration and the shared runtime used to initialize,
update, or remove AI-KIDO project files.

## Runtime and execution

The distribution scripts use Node.js and do not bundle a Node executable. The
new shared-runtime baseline is stable Node.js 24 or newer; the compatibility
matrix tests this baseline but is not evidence that every host provides Node or
grants command access. Check `node --version` in the actual executor before invoking a
script. `/check-cli` reports the version and executable of its own process as
`nodeRuntime`; that does not verify a different agent, container or remote host.
If Node or command execution is unavailable, report the blocked operation and
use a documented equivalent only when it preserves the result. Never install
Node or change permissions without approval.

Use dependency-free Node.js modules for new deterministic shared engines when
practical. Keep host adapters thin, validate inputs, return bounded versioned
JSON and explicit errors, and separate read-only planning from approved writes.
The former non-Node AI-KIDO script entry points are removed in this migration:
update external callers to the documented Node commands. Validate platform
behavior and do not assume that changing languages reduces tokens or latency.

GitHub CI and publishing execute JavaScript directly with `shell: node {0}`.
The shared runner, `distribution/scripts/ci.mjs`, expands test lists through
Node filesystem APIs and launches executables with argument arrays, never a
command interpreter. Git, npm and the approved Claude validator remain native
tool dependencies. Publishing remains manual and refuses existing release tags
or an existing temporary worktree; branch and tag are pushed atomically.

## Choose an assistant

See the [host integration guide](docs/host-integrations.md) for package
selection and installation steps. Assistant-specific instructions are available here:

- [Claude Code](docs/host-integrations.md#available-integrations)
- [Claude Cowork](adapters/claude-cowork/README.md)
- [VS Code / GitHub Copilot](docs/host-integrations.md#available-integrations)
- [GitHub Copilot coding agent](docs/host-integrations.md#available-integrations)
- [Codex CLI and IDE](adapters/codex/README.md)
- [Kiro CLI](adapters/kiro-cli/README.md)
- [Zoo Code](adapters/zoo-code/README.md)
- [Roo Code](adapters/roo-code-legacy/README.md)
- [Google Antigravity](adapters/antigravity/README.md)

## Install with npm

`npx @aikido-method/cli init --yes` selects the bundled package, installs the method and
wraps every assistant CLI detected locally; `aikido sync` repeats the wrapping
when a CLI is installed later. See [`npm/README.md`](npm/README.md).

## Initialize a project

Keep the selected package outside the project. Preview the bootstrap plan and
review the files it will add or update:

```text
node /path/to/package/scripts/bootstrap-plan.mjs  --root /path/to/project --package /path/to/package --mode STANDARD
```

Apply the reviewed plan using its exact ID:

```text
node /path/to/package/scripts/bootstrap-plan.mjs  --root /path/to/project --package /path/to/package  --mode STANDARD --apply --confirm <plan-id>
```

Use `LIGHT` for a lighter project entry point or `UNSET` to install AI-KIDO
without choosing a mode. After bootstrap, invoke the AI-KIDO initialization
command in your assistant to begin the project's Memory Bank.

## Update or remove

Use the runtime from the package version you want to install to preview an
update. Review the plan and resolve any listed choices before applying it with
`--apply --confirm <plan-id>`. A project without an AI-KIDO lock can be brought
under management with `--migrate`.

To remove AI-KIDO integration files while retaining project knowledge, preview
and confirm an uninstall with `scripts/update-plan.mjs --uninstall`. Project
knowledge remains in the project when an assistant plugin or workspace
integration is removed.
