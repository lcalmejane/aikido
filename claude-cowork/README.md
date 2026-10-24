# AI-KIDO for Claude Cowork

AI-KIDO is an AI Memory Bank Construction Method by Meta harness. This staging
plugin targets **Claude Cowork**, separately from Claude Code. It contains
native commands in `commands/`, system Skills in `skills/`, all canonical
agents in `agents/`, and the read-only method payload in `payload/`.

Cowork loads these plugin components from your **claude.ai account**. Installing
the plugin with the Claude Code CLI does not install it on that account.
Cowork does not discover local plugins merely because they exist in
`~/.claude`. Claude Code validation is a package check, not a Cowork session test.
Account plugins can also sync to Claude Code. A synced copy still has this
package's `claude-cowork` identity; updates must match the host recorded in the
project lock. Do not install both AI-KIDO variants under the same plugin name
and assume that they are interchangeable.

## Install for testing

Use a package built from a pinned AI-KIDO commit. Zip the **generated Cowork
package**, not the AI-KIDO development repository. Put `.claude-plugin/plugin.json`
at the archive root, or inside a single top-level plugin directory. Keep the
archive outside the directory being zipped:

```bash
cd /path/to/generated/claude-cowork
zip -r /path/to/aikido-cowork.zip .
```

In claude.ai or Claude Desktop, open **Customize > Plugins > Add > Upload
plugin** and upload that zip to your own account. Start a new Cowork task to
check discovery. Organization policy may restrict plugin installation.
Installation alone must not initialize or update a project.

For a shared release, use an authorized marketplace backed by a published,
immutable source. GitHub installation/provenance qualification is a separate
release prerequisite and has not been completed for this staging adapter.
No publication or account upload is performed by the package builder.

## Use and execution prerequisites

- Invoke commands by native slash name, for example `/aikido:init-aikido`,
  `/aikido:list-command`, or `/aikido:maj-aikido --update`. A command is not
  also shipped as a fallback Skill.
- System Skills are independently discoverable. Agents point to their
  canonical role prompts; discovery does not prove that every delegation
  tool or Claude Code-specific frontmatter setting works in Cowork.
- Before project writes, select the intended **persistent project folder**
  and grant the required access. A path on the host computer is not
  necessarily the same path visible inside a Cowork session.
- Bootstrap, migration, update and removal require a usable command tool,
  Node.js, a readable installed plugin root, and access to that project.
  Neither Node.js nor `${CLAUDE_PROJECT_DIR}` or `${CLAUDE_PLUGIN_ROOT}`
  resolution is assumed to work in every Cowork surface.
- Each generated wrapper instructs Claude to stop with
  `AIKIDO_COWORK_UNAVAILABLE` and identify the missing prerequisite if it cannot
  proceed. There is no manual-copy fallback, automatic dependency installation,
  permission escalation, or write into the plugin cache.

These wrapper instructions are **not a host-enforced sandbox**. Native
execution and denied-permission behavior still require a Cowork session test.

## Bootstrap, update and removal

When the prerequisites are available, use the runtime in the installed package.
Use the actual paths visible in that session, not unexpanded path variables.

```bash
node /resolved/plugin-root/scripts/bootstrap-plan.mjs \
  --root /selected/project --package /resolved/plugin-root --mode STANDARD
node /resolved/plugin-root/scripts/bootstrap-plan.mjs \
  --root /selected/project --package /resolved/plugin-root --mode STANDARD \
  --apply --confirm <plan-id>
```

Review every plan and confirm its exact ID before applying it. `LIGHT` and
`UNSET` are also supported. Only after bootstrap should the canonical
initialization workflow populate project knowledge.

Plugin updates and project method updates are separate. Installing a newer
account plugin does not update the project's pinned `.aikido/lock.json`.
Use the newer package's `scripts/update-plan.mjs` with explicit `--root` and
`--package` paths, review the three-way plan, then confirm it with
`--apply --confirm <plan-id>`. Lockless migration adds `--migrate`.

For adapter removal, preview `scripts/update-plan.mjs --root /selected/project
--uninstall`, then confirm that plan. Unchanged managed instruction blocks are
removed; project knowledge and modified adapters are preserved. Updates and
removal produce recovery backups, restored with `--recover <backup-path>`.
Removing the account plugin is a separate action in **Customize > Plugins**.

## Qualification and limits

The generated package is checked for the manifest, marketplace, legal files,
icon, canonical wrappers, and Cowork's published limits of 5,000 files and
200 MB. It has no top-level `bin/` directory, MCP server, hook, or permission
configuration.

Automated tests exercise the extracted Node runtime outside the source
repository. **They do not prove Cowork account installation, native Skill or
agent invocation, path-variable resolution, or permissions.** Native acceptance
remains blocked pending immutable-source installation qualification and an
authorized Cowork test session. No equivalence with Claude Code is claimed.

Official references:

- [Plugin platform support](https://claude.com/docs/plugins/platform-support)
- [Plugin structure and testing](https://claude.com/docs/plugins/build)
- [Cowork overview](https://claude.com/docs/cowork/overview)
