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
2. **Use the scripts in the `script/` subdirectory** – call the script [`download_site.sh`](prompts/hard_points/system/web/script/download_site.sh:1) (or its Python equivalent) to retrieve the raw site content.
3. **Normalise the HTML** – clean the HTML, remove unnecessary tags, and extract relevant text (e.g. via `beautifulsoup4`).
4. **Format the output** – return the result either as plain text or JSON according to the requested `format` parameter.

## Resources
- **Scripts**: [`download_site.sh`](prompts/hard_points/system/web/script/download_site.sh:1)
- **Bash/Python libraries**: `curl`, `wget`, `beautifulsoup4`
- **Similar Skills**: [`analyse`](prompts/hard_points/system/analyse/SKILL.md:1), [`search`](prompts/hard_points/system/search/SKILL.md:1)

## Available commands

- [`/download-site`](commands/download-site.md): Downloads a website and converts its content to Markdown

## Usage

### Via command
```bash
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
- **Stateless**: no persistent data is retained between calls.
- **Size limits**: download is limited to 10 MB per call to prevent abuse.
- **Policy compliance**: the Skill must verify the site's access rules (robots.txt, copyright) before downloading.
- **Encoding**: output always in UTF-8.

## Associated Aikido Agents
- No Aikido agent currently uses this Skill.
