---
name: web
description: "The AI-KIDO **Web Skill** manages interactions with the Web: site downloading, relevant content extraction, HTML normalisation, and generation of structured responses (plain text or JSON). It enables agents (Claude, etc.) to dynamically retrieve online information while respecting access policies."
---

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
