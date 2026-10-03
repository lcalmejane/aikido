---
name: download-site
description: Downloads a website and converts its content to Markdown
category: web
---

# Command: /download-site

## Description

Recursively downloads the content of a website using `wget`, then converts all HTML files to Markdown format with `pandoc`. The content is stored in `prompts/hard_points/web/<site-name>`.

> **⚠️ READ-ONLY MODE**: This command only downloads publicly accessible content via HTTP/HTTPS. Respects the site's robots.txt rules.

## Usage

```bash
/download-site <url> <depth> [prefix]
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | URL of the site to download (e.g.: https://example.com) |
| `depth` | integer | Yes | Maximum depth for recursive download (1-5 recommended) |
| `prefix` | string | No | URL prefix to accept (regex). Default: `https?://<host>` |

## Behavior

1. Validates the provided parameters (URL and depth are required)
2. Extracts the hostname from the URL
3. Creates a temporary directory for the download
4. Downloads the site with `wget`:
   - Recursive up to the specified depth
   - Converts links for local navigation
   - Ignores media files (images, CSS, JS, fonts)
   - Applies the prefix filter if provided
5. Converts all HTML files to Markdown with `pandoc`
6. Stores the result in `prompts/hard_points/web/<site-name>`
7. Cleans up the temporary directory

## Output

### Success

```
Starting download with wget...
Download with wget complete.
Creating target directory: /path/to/prompts/hard_points/web/
Converting HTML files to Markdown...
Number of HTML files to convert: 15
Processing: /path/to/temp/index.html
Converted: example.com/index.html -> example.com/index.md
...
Download and conversion complete: /path/to/prompts/hard_points/web/
```

### Failure

```
Usage: download_site.sh <url> <depth> [prefix]
```

or

```
Error: pandoc is not installed or not found in PATH.
Recommended installation:
  macOS: brew install pandoc
  Linux (apt): sudo apt-get update && sudo apt-get install -y pandoc
  Linux (yum): sudo yum install -y pandoc
```

## Prerequisites

### Required Software

- **wget**: recursive website downloading
- **pandoc**: HTML → Markdown conversion

### Installation

**macOS:**
```bash
brew install wget pandoc
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install -y wget pandoc
```

**Linux (RHEL/CentOS):**
```bash
sudo yum install -y wget pandoc
```

## Associated Scripts

- [`../script/download_site.sh`](../script/download_site.sh)

## Dependencies

- wget
- pandoc
- bash (>=4.0)

## Examples

### Example 1: Simple Download

```bash
# Download the first 2 levels of a site
/download-site https://example.com 2
```

### Example 2: Download with Prefix Filter

```bash
# Download only the /docs/ section
/download-site https://example.com 3 "https://example.com/docs"
```

### Example 3: Deep Download

```bash
# Download up to 5 levels (watch the size)
/download-site https://example.com 5
```

## Return Codes

- `0`: Download and conversion successful
- `1`: Invalid parameters or missing dependencies

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

## Use Cases

1. **Technical documentation**: Download online documentation for offline consultation
2. **Content analysis**: Extract website content for analysis by an LLM
3. **Archiving**: Save a static version of a website
4. **Knowledge base**: Integrate web content into the AI-KIDO Memory Bank
