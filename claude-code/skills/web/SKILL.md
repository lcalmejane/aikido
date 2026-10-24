---
name: web
description: "AI-KIDO web system skill."
---

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
