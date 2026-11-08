---
name: download-site
description: Downloads a website and converts its content to Markdown
category: web
---

# Command: /download-site

## Description

Recursively downloads the content of a website using `wget`, then converts all HTML files to Markdown format with `pandoc`. The content is stored in `prompts/hard_points/web/<site-name>`.

> **HTTP/HTTPS retrieval**: wget honors robots.txt; the command writes local Markdown/media. Public accessibility does not itself authorize reuse.

## Usage

```text
/download-site <url> <depth> [prefix]
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | URL of the site to download (e.g.: https://example.com) |
| `depth` | integer | Yes | Maximum depth for recursive download (1-5 recommended) |
| `prefix` | string | No | wget extended regex, anchored with `^`. Default: escaped exact host/port with URL boundary |

## Behavior

1. Validates the provided parameters (URL and depth are required)
2. Checks stable Node.js 24+ and executable `wget` and `pandoc` before effects
3. Creates a unique private staging directory under `prompts/hard_points/web/`
4. Downloads the site with `wget`:
   - Recursive up to the specified depth
   - Converts links for local navigation
   - Ignores media files (images, CSS, JS, fonts)
   - Applies the prefix filter if provided
5. Converts all `.html` files with `pandoc` via argument arrays, without a shell
6. Publishes Markdown/media only after every conversion succeeds; refuses any existing top-level output name (including empty directories and symlinks), without modifying existing data
7. Cleans up only this invocation's temporary directory, including on failure

### Direct engine invocation

```text
node prompts/hard_points/system/web/script/download_site.mjs <url> <depth> [prefix]
```

The former `download_site.sh` entry point has been removed. Call the Node
engine directly instead.

## Output

### Success

```
Starting download with wget...
Number of HTML files to convert: 15
Converted: example.com/index.html -> example.com/index.md
Published: example.com/index.md
...
Download and conversion complete: /path/to/prompts/hard_points/web/
```

### Failure

```
Error: Usage: download_site.mjs <url> <depth> [prefix]
```

or

```
Error: pandoc is not installed or not executable in PATH
```

## Prerequisites

### Required Software

- **wget**: recursive website downloading
- **pandoc**: HTML → Markdown conversion
- **Node.js 24+**: stable runtime for the engine

### Installation

Install a stable Node.js 24+ runtime separately and ensure `node` is in PATH.

Install `wget` and `pandoc` using an operator-approved package-management
interface. Do not generate or execute command-interpreter installation scripts.

## Associated Scripts

- [`download_site.mjs`](../script/download_site.mjs) — active engine
- [`Web Skill`](../SKILL.md)

## Dependencies

- wget
- pandoc
- Node.js >=24 (stable)

## Examples

### Example 1: Simple Download

```text
# Download the first 2 levels of a site
/download-site https://example.com 2
```

### Example 2: Download with Prefix Filter

```text
# Download only the /docs/ section
/download-site https://example.com 3 "https://example.com/docs"
```

### Example 3: Deep Download

```text
# Download up to 5 levels (watch the size)
/download-site https://example.com 5
```

## Return Codes

- `0`: Download and conversion successful
- `1`: Invalid parameters, missing/unusable dependencies, download/conversion failure, no HTML, unsafe path, output conflict, publication/cleanup failure or interruption

## Excluded Files

The following file types are automatically excluded from the download:
- Images: jpg, jpeg, gif, png, svg, ico
- Styles: css
- Scripts: js
- Fonts: woff, woff2, ttf, eot

## Output Structure

```
prompts/hard_points/web/
└── example.com/
    ├── index.md
    ├── about.md
    ├── docs/
    │   ├── getting-started.md
    │   └── api-reference.md
    └── [other-pages].md
```

## Notes

- **Limits**: Use low depths (1-3) to avoid downloading entire sites
- **robots.txt compliance**: The script respects site exclusion rules
- **Performance**: Conversion may take time depending on the number of pages
- **Storage**: Files are stored persistently in `prompts/hard_points/web/`
- **Media**: Extracted images and media are placed in `*_media/` subdirectories

## Intentional migration changes and limits

- Native Windows is **not yet supported** and returns an explicit error before
  dependency probes or filesystem effects. Use a POSIX environment such as WSL.
  Path traversal/publication now use native separators (tested with `node:path`
  Windows drive and UNC abstractions), but `.exe`/PATHEXT invocation, filesystem
  permissions and wget's Windows domain/port naming remain unvalidated.
- Only HTTP/HTTPS URLs without credentials/whitespace are accepted. Depth is a
  decimal integer from 0 to 2147483647; **0 is unlimited recursion**, as in wget.
- `prefix` remains a wget extended regex, anchored with `^`; an empty prefix
  uses the default. The default now escapes the exact host **and port** and adds
  a `/` or end boundary, avoiding accidental matches on lookalike domains.
- Wget still owns recursion, robots.txt, `-k` link conversion, `-E`, rejects and
  regex filtering. `-np` is not added (the previous script did not invoke it).
- Wget's on-disk domain/port names are retained (e.g. `localhost:8080` on POSIX);
  no lossy domain sanitization or port merging. Markdown links are not rewritten
  from `.html` to `.md`, matching the previous conversion behavior.
- Downloads/conversions no longer continue to a false success after failure.
  All conversions are staged; existing site outputs require manual relocation
  or another project, not an overwrite flag. Collisions include media paths.
- Symlinks in output ancestors or staging are refused. The historical shared
  `_TMP` directory is never used or deleted. Cleanup is bounded to the unique
  `.download-site-*` directory owned by this invocation.
- No size quota, license verification or comprehensive authorization check is
  implemented. robots.txt compliance relies on wget, not a simulated parser.
- Publication is no-overwrite, but not a multi-directory transaction: an I/O
  failure/interruption during publication can leave newly created partial output.
  It is reported as failure and is not deleted; existing user files remain intact.
- Concurrent hostile replacement of directories is not sandboxed by Node path
  checks. Use a project directory not writable by untrusted concurrent processes.

## Use Cases

1. **Technical documentation**: Download online documentation for offline consultation
2. **Content analysis**: Extract website content for analysis by an LLM
3. **Archiving**: Save a static version of a website
4. **Knowledge base**: Integrate web content into the AI-KIDO Memory Bank
