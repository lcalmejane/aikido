# Web Skill Installation in AI-KIDO

> **Version**: 2.0.0 | **Date**: 2026-11-07 | **Status**: Active

## Prerequisites

- Installed AI-KIDO and authorized write access to the project.
- Stable Node.js 24+, native `wget` and `pandoc` executables.
- A supported POSIX platform; native Windows is refused before filesystem
  effects. WSL requires the dependencies inside WSL.
- Host execution, network and filesystem approval for the intended operation.

The engine launches native executables with separate argument arrays, never
through a command interpreter. Do not install dependencies, change permissions,
or modify host allow rules automatically. If a dependency is absent, report it
and let the operator use an approved package-management interface.

## Installation

Use the host's file listing, reading and editing tools, or equivalent Node
filesystem APIs, for the following actions. Preserve local customizations.

1. List `prompts/hard_points/system/web/` and confirm
   [the skill](SKILL.md), [command](commands/download-site.md) and
   [Node engine](script/download_site.mjs) exist.
2. Probe `node --version`, `wget --version` and `pandoc --version` using direct
   executable invocations with argument arrays. A failed probe is a blocked
   prerequisite, not a successful installation.
3. Read `skills_list.md` and `commands_list.md`. Add the entries below only
   if missing; preserve alphabetical order and existing customizations.
4. For a managed package, use its reviewed bootstrap/update workflow instead
   of manually overwriting adapters. For a legacy installation, create only
   missing host mappings after approval, using the body below in
   `.roo/commands/download-site.md` and `.claude/commands/download-site.md`.
   An existing mapping with different content requires review.
5. Verify the resulting file contents and links with host file tools. Run
   the offline Node tests from the AI-KIDO source repository if available:

```text
node --test distribution/tests/web-download.test.mjs
```

No live URL is needed to verify installation. Tests use private temporary
fixtures and fake native executables; project downloads must not be deleted.
Restart or reload the host integration if that host requires it.

### Catalog entries

```markdown
- **web** – Website download and Markdown conversion. – [Web skill](prompts/hard_points/system/web/SKILL.md)
- **download-site** – [Download a website](prompts/hard_points/system/web/commands/download-site.md)
```

### Legacy host mapping

```markdown
---
description: "Downloads a website and converts its content to Markdown"
---

# /download-site

Read and follow `prompts/hard_points/system/web/commands/download-site.md`.
Use the Node entry point with separate arguments after required approval.
```

## Usage

Invoke the host command:

```text
/download-site <url> <depth> [prefix]
```

Or run the interpreter directly:

```text
node prompts/hard_points/system/web/script/download_site.mjs <url> <depth> [prefix]
```

The former non-Node entry point is removed. No executable bit is necessary
for interpreter invocation. Depth zero is unlimited recursion; prefer 1–3.
Retrieval requires authorization; public access alone does not permit reuse.

## Uninstallation and troubleshooting

- Review removal of catalog entries and host mappings before editing.
  Preserve modified mappings and all downloaded user data.
- A missing command requires checking mapping contents and host diagnostics.
- A missing runtime or native dependency is reported explicitly; install it
  only through an approved operator-controlled procedure.
- Permission failures require inspecting the exact path and host diagnostics,
  not broad permission changes.
- Rate limits and robots.txt restrictions must be respected. The engine has
  no configurable delay or quota.
- Publication is no-overwrite but not crash-atomic across several directories.
  Concurrent hostile path replacement is outside the supported model.

## References

- [Web skill](SKILL.md)
- [Command and safety limits](commands/download-site.md)
- [Node engine](script/download_site.mjs)
- [Offline tests](../../../distribution/tests/web-download.test.mjs)
