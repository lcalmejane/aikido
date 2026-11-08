---
name: web
description: "The AI-KIDO **Web Skill** manages interactions with the Web: site downloading, relevant content extraction, HTML normalisation, and generation of structured responses (plain text or JSON). It enables agents (Claude, etc.) to dynamically retrieve online information while respecting access policies."
---

## Cowork execution boundary

Before following the canonical instructions, verify that the plugin root `${CLAUDE_PLUGIN_ROOT}` resolves to a readable installed package. Resolve relative references from the canonical source file, not this generated wrapper. Use only tools actually exposed in this Cowork session; Claude Code tool names do not prove that those tools are available here.

Before any project write, confirm the user-selected persistent project folder and its access permissions. Do not assume `${CLAUDE_PROJECT_DIR}`, a host filesystem path, or a temporary session directory is the intended project. Bootstrap, migration, update and removal additionally require an available command tool and Node.js. Use the packaged runtime with explicit `--root` and `--package` paths where applicable; review its plan and obtain confirmation of the exact plan ID before applying it. Do not replace the runtime with manual copies.

For `/aikido:init-aikido` without an installed lock, first choose STANDARD, LIGHT or UNSET with the user and run `node "<plugin-root>/scripts/bootstrap-plan.mjs" --root "<project-root>" --package "<plugin-root>" --mode <mode>`. Apply only after confirmation using `--apply --confirm <plan-id>`, then follow the canonical initialization command.

If a required path, tool, runtime or permission is unavailable, stop before writing and report `AIKIDO_COWORK_UNAVAILABLE` with the missing prerequisite. Do not install dependencies, change permissions or claim success to bypass the restriction. Never write into the plugin cache. These are prompt instructions, not a host-enforced sandbox.

When the project has `.aikido/lock.json`, prefer its installed `prompts/hard_points/` source. Otherwise read the bundled source at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/web/SKILL.md`. Never write into the plugin cache.


# Web – AI-KIDO Internal Skill

## Description
The AI-KIDO **Web Skill** manages interactions with the Web: site downloading, relevant content extraction, HTML normalisation, and generation of structured responses (plain text or JSON). It enables agents (Claude, etc.) to dynamically retrieve online information while respecting access policies.

## Metadata
- **Name**: Web
- **Version**: 1.0.0
- **Author**: AI-KIDO Team
- **Category**: system / web
- **Metadata tokens** ≈ 100

## Instructions
1. **Identify the target URL** – The agent must detect a URL in the query or receive the URL as a parameter.
2. **Invoke Node directly** – run `node prompts/hard_points/system/web/script/download_site.mjs <url> <depth> [prefix]`, using [`download_site.mjs`](script/download_site.mjs). Pass arguments separately, never interpolate a shell command.
3. **Convert the HTML** – the engine uses real `wget` (including robots.txt and link conversion) and `pandoc` for Markdown; do not simulate their behavior.
4. **Format the output** – return the result either as plain text or JSON according to the requested `format` parameter.

## Resources
- **Engine**: [`download_site.mjs`](script/download_site.mjs)
- **Dependencies**: stable Node.js 24+, `wget`, `pandoc` in PATH.
- **Platforms**: POSIX environment required. Native Windows is explicitly rejected before dependency probes or filesystem effects; use WSL instead. Portable path helpers do not imply Windows readiness.
- **Similar Skills**: [`analyse`](../analyse/SKILL.md#L1), [`search`](../search/SKILL.md#L1)

## Available commands

- [`/download-site`](commands/download-site.md): Downloads a website and converts its content to Markdown

## Usage

### Via command
```text
/download-site https://example.com 2
```

### Via programmatic invocation
```python
result = invoke_skill("web", {
    "url": "https://example.com",
    "format": "json"   # or "text"
})
```
The Skill activates automatically when a query contains a URL or when an agent explicitly invokes `invoke_skill("web", …)`.

## Notes
- **Storage**: Markdown/media persist in `prompts/hard_points/web/`, with wget's domain/port hierarchy. Existing site directories, files or symlinks cause an explicit conflict; no overwriting.
- **Limits**: no byte quota is implemented. Prefer depths 1–3; depth 0 means unlimited recursion in wget.
- **Policy compliance**: wget is explicitly configured with `robots=on`. This does not verify a license or grant permission to reuse content; the caller must check authorization.
- **Failures**: dependency checks precede filesystem/download effects; any download, conversion, publication or cleanup failure returns nonzero. Conversion failures publish nothing. Only the unique private staging directory is cleaned.
- **Encoding**: output always in UTF-8.

## Associated Aikido Agents
- No Aikido agent currently uses this Skill.
