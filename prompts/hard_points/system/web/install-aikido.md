# Web Skill Installation in AI-KIDO

> **Version**: 1.0.0 | **Date**: 2026-01-08 | **Status**: Active

## Description

This document guides the installation and integration of the Web Skill into the AI-KIDO system. It registers the website download command in the system configuration files.

## Prerequisites

- AI-KIDO system installed and functional
- Write access to configuration files
- Web Skill present in `prompts/hard_points/system/web/`
- **Required software**: `wget`, `pandoc`

## Files to Modify

### 1. skills_list.md

Add the Web Skill:

```markdown
- **web** – Le Skill Web d'AI‑KIDO gère les interactions avec le Web : téléchargement de sites, extraction de contenu pertinent, normalisation du HTML et génération de réponses structurées (texte brut ou JSON). – [`prompts/hard_points/system/web/SKILL.md`](prompts/hard_points/system/web/SKILL.md)
```

### 2. commands_list.md

Add the download-site command (alphabetical order):

```markdown
- **download-site**: Downloads a website and converts its content to Markdown ([`download-site.md`](prompts/hard_points/system/web/commands/download-site.md:2))
```

### 3. .roo/commands/

Create the mapping file for the command:

#### .roo/commands/download-site.md
```markdown
---
description: "Downloads a website and converts its content to Markdown"
---

# Command download-site

This command executes the full command file from `prompts/hard_points/system/web/commands/download-site.md`.

**EXECUTION**: I will now read and execute the full command.

\`\`\`
Reading prompts/hard_points/system/web/commands/download-site.md and executing instructions...
\`\`\`
```

### 4. .claude/commands/

Create the same mapping file in `.claude/commands/` with the same content as `.roo/commands/`.

### 5. .claude/settings.local.json

Add the required permissions for wget and pandoc:

```json
{
  "permissions": {
    "allow": [
      "Bash(prompts/hard_points/system/web/script/download_site.sh:*)",
      "Bash(wget:*)",
      "Bash(pandoc:*)"
    ]
  }
}
```

## Installation Procedure

### Step 1: Verify Prerequisites

```bash
# Verify the Web Skill is present
ls -la prompts/hard_points/system/web/

# Check wget
which wget || echo "⚠️ wget not installed"

# Check pandoc
which pandoc || echo "⚠️ pandoc not installed"
```

**Installing dependencies if needed:**

```bash
# macOS
brew install wget pandoc

# Linux (Debian/Ubuntu)
sudo apt-get update && sudo apt-get install -y wget pandoc

# Linux (RHEL/CentOS)
sudo yum install -y wget pandoc
```

### Step 2: Create Mapping Files

```bash
# Create directories if needed
mkdir -p .roo/commands
mkdir -p .claude/commands

# Create the command in .roo/commands/
touch .roo/commands/download-site.md

# Create the command in .claude/commands/
touch .claude/commands/download-site.md
```

### Step 3: Fill in the Mapping Files

**IMPORTANT**: The files created in Step 2 must be filled with their respective content (see sections 3 and 4 above).

#### 3.1: Fill in .roo/commands/ and .claude/commands/ commands
Copy the content from section 3 into each command file.

### Step 4: Update System Configuration Files

Edit manually or use the following commands:

```bash
# Back up the original files
cp skills_list.md skills_list.md.backup
cp commands_list.md commands_list.md.backup
cp .claude/settings.local.json .claude/settings.local.json.backup
```

**Then:**
1. Add the entry in `skills_list.md` (see section 1)
2. Add the entry in `commands_list.md` (see section 2)
3. Add the permissions in `.claude/settings.local.json` (see section 5)

### Step 5: Make the Script Executable

```bash
chmod +x prompts/hard_points/system/web/script/download_site.sh
```

### Step 6: Validate the Installation

```bash
# Verify the mapping files exist
ls -la .roo/commands/download-site.md
ls -la .claude/commands/download-site.md

# Verify the command is available
/list-command | grep download-site

# Verify the Skill is referenced
grep "web" skills_list.md

# Test the command (example with a simple site)
/download-site https://example.com 1
```

**IMPORTANT**: After making all modifications, **restart VSCode/Claude Code** for the changes to take effect.

## Post-Installation Configuration

### 1. Check Dependencies

```bash
# Check wget
wget --version

# Check pandoc
pandoc --version
```

### 2. Test the Script

```bash
# Manual script test
cd prompts/hard_points/system/web/script
./download_site.sh https://example.com 1
```

### 3. Clean Up Tests

```bash
# Delete test files if needed
rm -rf prompts/hard_points/web/example.com/
```

## Usage

Once installed, use the command with the following syntax:

```bash
# Download the first 2 levels of a site
/download-site https://example.com 2

# Download with prefix filter
/download-site https://example.com 3 "https://example.com/docs"

# Deep download (watch the size)
/download-site https://example.com 5
```

## Uninstallation

To uninstall the Web Skill:

1. Remove the entry from `skills_list.md`
2. Remove the entry from `commands_list.md`
3. Delete the files in `.roo/commands/download-site.md`
4. Delete the files in `.claude/commands/download-site.md`
5. Remove the permissions from `.claude/settings.local.json`
6. (Optional) Delete the directory `prompts/hard_points/system/web/`

## Troubleshooting

### Command Not Recognized

If the command is not recognized after installation:

1. Check that the mapping files exist in `.roo/commands/` and `.claude/commands/`
2. Restart VSCode / Claude Code
3. Check file permissions

### Error "wget not found"

If wget is not found:

```bash
# macOS
brew install wget

# Linux (Debian/Ubuntu)
sudo apt-get install -y wget

# Linux (RHEL/CentOS)
sudo yum install -y wget
```

### Error "pandoc not found"

If pandoc is not found:

```bash
# macOS
brew install pandoc

# Linux (Debian/Ubuntu)
sudo apt-get install -y pandoc

# Linux (RHEL/CentOS)
sudo yum install -y pandoc
```

### Permission Denied

If you get a permission error:

```bash
# Make the script executable
chmod +x prompts/hard_points/system/web/script/download_site.sh

# Check permissions
ls -la prompts/hard_points/system/web/script/download_site.sh
```

### Slow or Blocked Download

Some sites may block or rate-limit automatic downloading:

- Respect the site's robots.txt rules
- Use a low depth (1-3)
- Add a delay between requests if needed

## References

- **[SKILL.md](SKILL.md)** - Full technical documentation of the Skill
- **[download-site.md](commands/download-site.md)** - Command documentation
- **[download_site.sh](script/download_site.sh)** - Bash download script

## Notes

- Installation requires write access to configuration files
- The script requires `bash 4.0+`, `wget`, and `pandoc`
- Downloaded sites are stored in `prompts/hard_points/web/<site-name>/`
- Media files (images, CSS, JS) are automatically excluded
- Use low depths to avoid downloading entire sites

## Limitations

- **Size**: The download can be large depending on depth
- **Duration**: Conversion may take time depending on the number of pages
- **Compliance**: Always respect robots.txt rules and terms of service
- **Performance**: Prefer depths 1-3 for optimal usage

---

**Last updated**: 2026-01-08
**Maintainer**: AI-KIDO Team
