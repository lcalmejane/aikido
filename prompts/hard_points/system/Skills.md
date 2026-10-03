### Skills (Agent Skills)

Implemented skills are listed in `skills_list.md` and follow the CLAUDE.md standard for Agent Skills.

#### What is a Skill?

A **Skill** is a specialized capability module that extends Claude's functionality autonomously. It is a packaged resource including instructions, metadata, and optional resources.

**Source**: [Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)

#### Key Characteristics

* **Autonomous invocation**: Claude automatically decides when to use a Skill based on the conversation context
* **Modular architecture**: Packaged as a directory with structured files
* **Progressive disclosure**: Progressive information loading in 3 levels:
  * **Level 1**: Metadata (~100 tokens, always loaded)
  * **Level 2**: Instructions (<5k tokens, loaded on activation)
  * **Level 3**: Resources (unlimited, loaded on demand)

**Source**: [Skills Overview - Architecture](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)

#### Skill Structure

skill-name/
├── SKILL.md           # Main file (required)
├── references/       # Reference documentation (optional)
├── examples/        # Usage examples (optional)
├── personas/        # Personas (optional)
├── scripts/           # Utility scripts (optional)
│   └── helper.py
|── templates/         # File templates (optional)
|   └── template.txt
└── documentation/         # Detailed documentation (optional)
    └── documentation.md

**Source**: [Skills Format](https://code.claude.com/docs/en/skills.md)
