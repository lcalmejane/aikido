---
description: "Display the list of available AI-KIDO commands from commands_list.md"
---

# /list-command

**Purpose**: Display available AI-KIDO commands as declared in commands_list.md.

---

## Usage

[MANDATORY]
/list-command

## Prerequisites

- `commands_list.md` must exist at project root

## Steps

[MANDATORY]
1. Read `commands_list.md` and extract the commands section.
2. Display all listed commands with their description.

Output format:
```
AI-KIDO COMMANDS AVAILABLE

(Source: commands_list.md)

Available commands in prompts/hard_points/commands/ :

- /init-raci-aikido : Initialize RACI matrix and team specifications
- /init-glossaire : Create or update the business glossary
- /create-persona : Create a new AI-KIDO persona
- /check-claude : Analyze and update CLAUDE.md
- /check-truth : Verify coherence between documentation and code
- /compile-agent-from-use : Compile agents from usage
- /create-command : Create optimized AI-KIDO commands
- /analyse-project : Analyze project sources
- /maj-aikido : Sync hard_points during rebase
- /init-aikido : Initialize AI-KIDO Memory Bank
- /analyse-aikido : Complete audit of Truth Tables
- /optimize-command-with-aikido-agents : Optimize commands with agents

For more details, consult commands_list.md or prompts/hard_points/commands/[command-name].md
```

## Output

List of available AI-KIDO commands with descriptions.

## Notes

- If `commands_list.md` is not found, report: "commands_list.md not found"
