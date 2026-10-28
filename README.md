> 🌐 **English** | [Français](README_FR.md)

# AI‑KIDO – AI Memory Bank Construction Method by Meta-Harness

## Description

**AI‑KIDO** is a structured method, powered by a **meta-harness**, for creating and maintaining a **memory bank** (knowledge base) optimized for LLM interactions within a human team. This base forms a hierarchical **Truth Tables** system that makes it possible to capitalize, structure and reuse knowledge efficiently and consistently.

The AI‑KIDO method follows an iterative process alternating between **functional/technical** and **global/specific** approaches in order to progressively build a robust and scalable knowledge base.

**Method + meta-harness**: AI‑KIDO is first and foremost a **method**. Its tools are not a fixed harness but a **meta-harness**: the functions built into the knowledge base's agents, skills and tools build **on the fly** the harness each task needs (context, agents, tools, checks). Every harness generated this way becomes a capitalized, reusable **use case**. Details: [Method and meta-harness](prompts/hard_points/ai-kido_details.md#method-and-meta-harness).

## Install AI-KIDO in a project

Choose the package for your assistant to add AI-KIDO to a project, then initialize
its Memory Bank from that assistant. Packages include a reviewable bootstrap
plan and a runtime for updating or removing the project integration.

See the [distribution guide](distribution/README.md) for assistant-specific
installation steps, migration, updates, and removal.

## 🎯 AI‑KIDO Philosophy

AI‑KIDO is based on 18 fundamental rules that guarantee:

- **🌳 Tree structure**: Recursive navigation from a single entry point
- **📊 Theory/practice separation**: Concepts vs techniques, personas vs use cases
- **🔄 Self-feeding**: Continuous improvement based on lessons learned
- **⚖️ Balancing**: Size constraints (≤500 lines standard, ≤1000 for agents/personas/commands/skills, prompts/hard_points/system/structure/index.json no limit.) and depth (4 levels max)
- **🔗 Bidirectional links**: Consistent navigation in every direction
- **👥 Role distribution**: Collaborative organization with a RACI matrix

---

## 🔄 Updating an Existing AI-KIDO Base

### Two Update Methods

#### 📦 Method 1: Direct Update (AI-KIDO Git already cloned)

**If you already have the AI-KIDO Git repository in `/prompts/spec/aikido-source-git/`**:

```bash
# Run the update in UPDATE mode
/maj-aikido --update
```

**Process**:

1. ✅ Automatic detection of the existing Git repository
2. 🔄 `git pull` to fetch the latest changes
3. 📊 Differential analysis: source ↔ target comparison
4. 🎯 User choice per file:
   - **REPLACE**: New version with backup (.bak)
   - **MERGE**: Intelligent merge with agent-aikido-fusion
   - **IGNORE**: Keep the current version
5. 🔒 Hard points replaced automatically (absolute authority)
6. ✅ V1.3 migration if needed
7. 📋 Detailed update report

**Advantages**: Fast, no download, direct synchronization from the GitHub repository

---

#### 🆕 Method 2: Initial Installation or Update from a New Source

**If you do NOT have the AI-KIDO Git repository yet** or want to use another source:

##### Option A: From AI-KIDO Git (First Installation)

```bash
# If you are on an old version (< V1.3), first copy the maj-aikido script into /roo/commands/
cp /prompts/spec/aikido-source-git/prompts/hard_points/commands/maj-aikido /prompts/hard_points/commands/

# Run the update in UPDATE mode
/maj-aikido --update

# Choose option 1: GIT AI-KIDO
Choice: 1
```

**The command will**:

1. 📥 Automatically clone the official repository:

   ```
   git@github.com:lcalmejane/aikido.git
   ```

2. 📂 Install it in `/prompts/spec/aikido-source-git/`
3. 🔄 Continue with the standard update process

##### Option B: From an Archive (tar.gz/zip)

**If you received an AI-KIDO archive**:

```bash
# 1. Place the archive in /prompts/spec/
mv ai-kido-vX.Y.Z.tar.gz /prompts/spec/

# If you are on an old version (< V1.3), first copy the maj-aikido script into /roo/commands/
cp /prompts/spec/aikido-source-git/prompts/hard_points/commands/maj-aikido /prompts/hard_points/commands/

# 2. Run the update
/maj-aikido --update

# 3. Choose option 3: ARCHIVE
Choice: 3

# 4. Provide the path
Archive: /prompts/spec/ai-kido-vX.Y.Z.tar.gz
```

**Supported formats**: `.tar.gz`, `.tgz`, `.zip`

##### Option C: From a Local Directory

**If you have already extracted the sources somewhere**:

```bash
# If you are on an old version (< V1.3), first copy the maj-aikido script into /roo/commands/
cp /path/to/ai-kido-sources/prompts/hard_points/commands/maj-aikido /prompts/hard_points/commands/

# 1. Run the update
/maj-aikido --update

# 2. Choose option 2: LOCAL DIRECTORY
Choice: 2

# 3. Provide the path
Directory: /path/to/ai-kido-sources/
```

---

### 🔀 Intelligent Merge with Agent-Aikido-Fusion

During the update, for each modified file you can choose **"2. MERGE"**:

**Merge process**:

1. 🤖 The agent-aikido-fusion is invoked automatically
2. 📝 A merge script is generated: `/tmp/aikido/aikido-fusion-*.md`
3. ⚡ **Automatic option**: Run `claude < /tmp/aikido/aikido-fusion-*.md`
4. 🔄 The agent applies the merge rules:
   - ✅ **Adopts** the SOURCE formalism and structure (new version)
   - ✅ **Preserves** the TARGET context and examples (your project)
   - ✅ **Integrates** all new SOURCE concepts
   - ✅ **Resolves** conflicts intelligently
5. 📦 Generation of two files:
   - `file.merged.YYYYMMDD-HHMMSS`: Merged file
   - `file.merged.YYYYMMDD-HHMMSS.meta.json`: Merge metadata
6. 👀 User review and validation
7. ✅ Final replacement: `mv file.merged.* file.md`

**Merge rules**:

- 📋 **SOURCE formalism**: Structure, headings, frontmatter of the new version
- 💼 **TARGET context**: Project examples and specific configurations preserved
- 🆕 **SOURCE novelties**: All new concepts integrated
- ⚖️ **Conflict resolution**: SOURCE for form, TARGET for project content
- ✅ **AI-KIDO compliance**: ≤500 lines, bidirectional links, valid frontmatter

**Manual fallback**: If the automatic merge fails, a structured template is created with detailed instructions for a manual merge.

---

### 📊 After the Update

**1. Check the state of the base**:

```bash
/check-claude (If you are using Claude Code)
```

**2. Compliance audit** (recommended):

```bash
/analyse-aikido
```

**3. Restart Claude Code** (if there are new agents/commands)

**4. Check the backups** (if a rollback is needed):

```bash
find . -name "*.bak.*" -type f
```

---

### 🎯 Summary

| Situation | Command | Source |
|-----------|----------|--------|
| **AI-KIDO Git already cloned** | `/maj-aikido --update` | Automatic pull |
| **First installation from Git** | `/maj-aikido --update` → Option 1 | Clone from GitHub |
| **From a tar.gz/zip archive** | `/maj-aikido --update` → Option 3 | Archive extraction |
| **From a local directory** | `/maj-aikido --update` → Option 2 | Copy from directory |

**💡 Recommendation**: After the first AI-KIDO Git installation, always use the direct method (`/maj-aikido --update`) to benefit from automatic updates.

---

## 📁 Project Structure

### Single-Project Structure (Default) - V1.3

```
/
├── prompts/
│   ├── index.md                    # 🎯 SINGLE ENTRY POINT (V1.3+)
│   │
│   ├── gen/                        # 🧠 Memory Bank - Truth Tables (Evolving)
│   │   ├── index.md               # 📚 Internal navigator /prompts/gen/
│   │   ├── concepts/              # 📚 Fundamental concepts (theory)
│   │   ├── techniques/            # 🔧 Practical methods (application)
│   │   ├── personas/              # 👤 Business personas (human roles/experts)
│   │   └── use_cases/             # 💼 Concrete applications by context
│   │
│   ├── hard_points/               # 🔒 Immutable Truths (ABSOLUTE PRIORITY)
│   │   ├── index.md              # 📋 Hard points index
│   │   ├── ai-kido.md            # 📖 V1.3 Guide - 18 rules (STANDARD mode)
│   │   ├── ai-kido-light.md      # 📖 V1.3 Guide - LIGHT mode (lightweight bases)
│   │   ├── gestion-logs-aikido.md # 📝 LLM traceability rules
│   │   │
│   │   ├── agents/               # 🤖 Internal AI-KIDO agents (14 technical agents)
│   │   │   ├── agent-aikido-explore-bank.md
│   │   │   ├── agent-aikido-explore-code.md
│   │   │   ├── agent-aikido-explore-all.md
│   │   │   ├── agent-aikido-truth-evaluator.md
│   │   │   ├── agent-aikido-raci-delegator.md
│   │   │   ├── agent-aikido-doc-header.md
│   │   │   ├── agent-aikido-projet-index.md
│   │   │   ├── agent-aikido-bank-populate.md
│   │   │   ├── agent-aikido-validator.md
│   │   │   ├── agent-aikido-balancer.md
│   │   │   ├── agent-aikido-maj-md-index.md
│   │   │   ├── agent-aikido-fusion.md
│   │   │   └── agent-aikido-update-controller.md
│   │   │
│   │   ├── commands/             # ⚡ Centralized AI-KIDO commands (33 commands)
│   │   │   ├── init-aikido.md
│   │   │   ├── init-glossaire.md
│   │   │   ├── init-raci-aikido.md
│   │   │   ├── analyse-project.md
│   │   │   ├── analyse-aikido.md
│   │   │   ├── check-claude.md
│   │   │   ├── check-truth.md
│   │   │   ├── maj-aikido.md
│   │   │   ├── create-persona.md
│   │   │   ├── create-command.md
│   │   │   ├── create-search-plan.md
│   │   │   ├── create-analyse-plan.md
│   │   │   ├── validate-search-plan.md
│   │   │   ├── validate-analyse-plan.md
│   │   │   ├── compile-agent-from-use.md
│   │   │   ├── optimize-command-with-aikido-agents.md
│   │   │   ├── reindex-projet.md
│   │   │   ├── clean-index.md
│   │   │   ├── logllmon.md
│   │   │   ├── logllmoff.md
│   │   │   └── list-command.md
│   │   │
│   │   ├── concepts/             # 📚 Hard concepts (immutable)
│   │   ├── techniques/           # 🔧 Hard techniques (immutable)
│   │   ├── personas/             # 👤 Hard personas (immutable, rarely used)
│   │   ├── use_cases/            # 💼 Hard use cases (immutable)
│   │   │
│   │   └── system/               # ⚙️ AI-KIDO SYSTEM (Skills & Infrastructure)
│   │       ├── Skills.md         # 📖 AI-KIDO Skills definition
│   │       │
│   │       ├── analyse/          # 🔍 Analyse Skill (project analysis plans)
│   │       │   ├── SKILL.md
│   │       │   ├── README.md
│   │       │   └── plans/        # Analysis plans (architectural, technical, etc.)
│   │       │
│   │       ├── search/           # 🔎 Search Skill (code search plans)
│   │       │   ├── SKILL.md
│   │       │   ├── README.md
│   │       │   └── plans/        # Search plans by technology
│   │       │       ├── plan-generic.md      # Multi-language
│   │       │       ├── php/plan.md          # PHP + PSR-4
│   │       │       └── javascript/plan.md   # JS/TS + ES Modules
│   │       │
│   │       ├── structure/        # 🗂️ Structure Skill (JSON project index)
│   │       │   ├── SKILL.md
│   │       │   ├── README.md
│   │       │   ├── index.json    # Complete project index (24h cache)
│   │       │   └── scripts/      # Index generation/maintenance scripts
│   │       │       ├── generate-project-tree.sh
│   │       │       ├── generate-project-tree-json.sh
│   │       │       ├── format-file-metadata.sh
│   │       │       └── watch-changes.sh
│   │       │
│   │       ├── web/              # 🌐 Web Skill (site downloading)
│   │       │   ├── SKILL.md
│   │       │   └── README.md
│   │       │
│   │       └── maj/              # 🔄 Maj Skill (AI-KIDO updates)
│   │           ├── SKILL.md
│   │           └── README.md
│   │
│   └── spec/                     # ⚠️ Personal Spaces (IGNORE unless activated)
│       ├── aikido-source-git/    # 📦 AI-KIDO Git clone (/maj-aikido --update)
│       └── logs/                 # 📊 Interaction logs (LLM_TRACIBILITY=TRUE)
│           └── prompts.log       # Timestamped markdown format
│
├── .roo/                         # 🔧 Roo-Code configuration
│   ├── commands/                 # Command wrappers (33 .md files)
│   │   ├── init-aikido.md
│   │   └── ...                   # Other AI-KIDO commands
│   └── .roomodes                 # Custom agents configuration
│
├── .claude/                      # 🤖 Claude Code configuration
│   ├── agents/                   # Agent mapping (14 .md files)
│   │   ├── agent-aikido-*.md     # 14 internal AI-KIDO agents
│   │   └── ...                   # Converted project personas
│   └── commands/                 # Command mapping (33 .md files)
│       ├── init-aikido.md
│       └── ...                   # Other AI-KIDO commands
│
├── AGENTS.md                     # 🤖 Standardized Memory Bank interface
├── agents_list.md                # 📋 Complete list of agents + usage
├── skills_list.md                # 📦 Complete list of system skills
├── commands_list.md              # ⚡ Complete list of commands
├── CLAUDE.md                     # 📊 AI-KIDO ↔ CLAUDE.md standard mapping
└── README.md                     # 📖 This file
```

### Personas vs Agents Distinction

**Personas** (`/prompts/gen/personas/`):
- 👤 **Business/human roles**: Architect, Developer, Product Owner, etc.
- 🎭 **Domain expertise**: Specific knowledge of a role
- 📝 **Evolving**: Created according to project needs (`/create-persona`)
- 💼 **Usage**: Consultation for a business perspective
- **Examples**: Solution Architect, Security Expert, Scrum Master

**Agents** (`/prompts/hard_points/agents/`):
- 🤖 **Technical tools**: Validation, exploration, synchronization
- ⚙️ **System functions**: Automated AI-KIDO operations
- 🔒 **Immutable**: Core part of the AI-KIDO system
- 🚀 **Usage**: Automatic task execution

**Summary**:
- **Personas** = Who (human roles) → `/gen/personas/`
- **Agents** = What (system tools) → `/hard_points/agents/` + `/hard_points/system/*/agents/`

### System Skills

The **Skills** (`/prompts/hard_points/system/`) group together complete functional capabilities:

| Skill | Description | Agents | Commands | Scripts |
|-------|-------------|--------|-----------|---------|
| **analyse** | Project analysis plans | 0 | 2 | Markdown plans |
| **search** | Tech-aware code search plans | 0 | 2 | Markdown plans |
| **structure** | Project JSON index + 24h cache | 1 | 2 | Bash + JQ |
| **web** | Website downloading | 0 | 0 | Bash + wget |
| **maj** | AI-KIDO system updates | 1 | 1 | Bash + git |

**Each Skill contains**:
- `SKILL.md`: Complete technical specification
- `README.md`: User guide
- `agents/`: Specialized agent(s) of the skill
- `commands/`: Exposed commands
- `scripts/`: Implementation bash/JQ scripts
- `.env.example`: Configuration (if external API)

### Multi-Project Structure - V1.3

```
/
├── prompts/
│   ├── index.md                    # 🎯 SINGLE ENTRY POINT (V1.3+)
│   │                               #    → Lists and references all projects
│   │
│   ├── [project-1]/                # 📁 Project 1 (isolated Memory Bank)
│   │   ├── index.md               # 📚 Project-1 entry point
│   │   ├── gen/                   # 🧠 Project-1 Memory Bank
│   │   │   ├── index.md
│   │   │   ├── concepts/
│   │   │   ├── techniques/
│   │   │   ├── personas/          # Project-1 specific personas
│   │   │   └── use_cases/
│   │   └── hard_points/           # 🔒 Project-1 immutable truths
│   │       ├── ai-kido.md
│   │       ├── concepts/
│   │       ├── techniques/
│   │       └── use_cases/
│   │
│   ├── [project-2]/                # 📁 Project 2 (isolated Memory Bank)
│   │   ├── index.md
│   │   ├── gen/                   # Project-2 Memory Bank
│   │   └── hard_points/           # Project-2 immutable truths
│   │
│   ├── hard_points/               # 🔒 SHARED Hard Points (all projects)
│   │   ├── index.md
│   │   ├── ai-kido.md            # Common AI-KIDO rules
│   │   ├── gestion-logs-aikido.md
│   │   │
│   │   ├── agents/               # 🤖 AI-KIDO agents (14 shared agents)
│   │   │   ├── agent-aikido-explore-bank.md
│   │   │   ├── agent-aikido-explore-code.md
│   │   │   └── ...               # All system agents
│   │   │
│   │   ├── commands/             # ⚡ Shared commands (33 commands)
│   │   │   ├── init-aikido.md
│   │   │   ├── analyse-project.md
│   │   │   └── ...               # All AI-KIDO commands
│   │   │
│   │   └── system/               # ⚙️ AI-KIDO SYSTEM (shared Skills)
│   │       ├── Skills.md
│   │       ├── analyse/          # Analyse Skill
│   │       ├── search/           # Search Skill
│   │       ├── structure/        # Structure Skill
│   │       ├── web/              # Web Skill
│   │       └── maj/              # Maj Skill
│   │
│   └── spec/                     # ⚠️ Personal spaces (IGNORE)
│       └── logs/                 # Logs shared by all projects
│
├── .roo/
│   ├── commands/                 # Command wrappers (33 files)
│   └── .roomodes                 # Multi-project agents
│
├── .claude/
│   ├── agents/                   # Agent mapping (14 agents + personas)
│   └── commands/                 # Command mapping (33 commands)
│
├── AGENTS.md                     # 🤖 Multi-project interface
├── agents_list.md                # 📋 List of agents for all projects
├── skills_list.md                # 📦 List of system skills
├── commands_list.md              # ⚡ List of commands
├── CLAUDE.md                     # 📊 Multi-project mapping
└── README.md                     # 📖 This file
```

**Multi-Project Architecture**:

- **Isolated Memory Banks**: Each project has its own specific `/gen/` and `/hard_points/` tree
- **Shared system**: `/prompts/hard_points/` contains agents, commands and skills common to all projects
- **Single entry point**: `/prompts/index.md` lists and references all projects
- **Navigation**: `/prompts/index.md` → `/prompts/[project-n]/index.md` → `/prompts/[project-n]/gen/index.md`

**⚠️ MAJOR V1.3 CHANGE**: **Unified** entry point `/prompts/index.md` for ALL project types

**Single-Project Navigation**:

1. `/prompts/index.md` → SINGLE entry point (references `/prompts/gen/`, `/prompts/hard_points/`)
2. `/prompts/gen/index.md` → Internal navigation (concepts, techniques, personas, use_cases)

**Multi-Project Navigation**:

1. `/prompts/index.md` → SINGLE entry point (lists and points to all projects)
2. `/prompts/[project-n]/index.md` → Project-specific entry point
3. `/prompts/[project-n]/gen/index.md` → Project internal navigation

**OLD SYSTEM (< V1.3)**: `/prompts/gen/index.md` (single) or `/prompts/[project]/gen/index.md` (multi) - **OBSOLETE**

## 🚀 AI‑KIDO Method: Iterative Process

### Phase 1: Base Initialization

#### 1.1 `init-aikido` - Project Foundations

**Goal**: Create the basic structure of the memory bank

**Iterative process**:

1. **Source analysis** (Functional) → Automatic detection of the project context
2. **System architecture** (Technical) → C1 modeling and components
3. **Technical stack** (Specific) → Identified technologies and tools
4. **Fundamental use cases** (Global) → Basic use cases of the domain

**Result**: `/prompts/gen/` structure initialized with the base files

#### 1.2 `init-glossaire` - Business Terminology

**Goal**: Clarify the project-specific terminology

**Iterative process**:

1. **Terminology extraction** (Specific) → Confusing or ambiguous business terms
2. **Contextual analysis** (Functional) → Business domain and sub-domains
3. **Structured definitions** (Technical) → Glossary organized by categories
4. **Global validation** (Global) → Terminological consistency

**Result**: Business glossary in `/prompts/gen/concepts/glossaire-metier.md`

#### 1.3 `init-raci-aikido` - Team Organization

**Goal**: Define the RACI matrix and the role distribution

**Iterative process**:

1. **Role identification** (Functional) → Team and responsibilities
2. **RACI matrix** (Technical) → R/A/C/I assignment per activity
3. **Specialized subdirectories** (Specific) → Structure by roles
4. **Collaboration workflow** (Global) → Git and validation rules

**Result**: RACI specifications in `/prompts/hard_points/aikido-raci-[TEAM].md`

### Phase 2: Analysis and Enrichment

#### 2.1 `analyse-project` - Contextual Analysis

**Goal**: Analyze the existing project to enrich the memory bank

**Iterative process**:

1. **Functional scan** (Global) → Project overview
2. **Technical analysis** (Specific) → Code, architecture, patterns
3. **Knowledge extraction** (Technical) → Concepts and techniques used
4. **Integration** (Functional) → Memory bank update

### Phase 3: Persona Creation

#### 3.1 `create-persona` - Specialized Agents

**Goal**: Create personas adapted to the project context

**Hierarchical taxonomy**:

```
Level 1: Category (🏗️ DESIGN, ⚙️ DEVELOPMENT, 🔒 SECURITY, 🔍 QUALITY, 🚀 DEPLOYMENT)
└── Level 2: Functional family (Architecture, Backend, Frontend, etc.)
    └── Level 3: Specific persona (Solutions Architect, API Developer, etc.)
        └── Level 4: Contextual specialization (Domain, technology, constraints)
```

**Iterative process**:

1. **Needs identification** (Functional) → Which roles for which contexts?
2. **Technical specialization** (Technical) → Skills and responsibilities
3. **Contextual adaptation** (Specific) → Business domain and constraints
4. **Taxonomic integration** (Global) → Consistency with the hierarchy

### Phase 4: Memory Bank Optimization

#### 4.1 Iterative Knowledge Base Construction

**Functional ↔ Technical alternation**:

- **Functional iteration**: Focus on business needs, use cases, workflows
- **Technical iteration**: Focus on implementation, patterns, optimizations

**Global ↔ Specific alternation**:

- **Global iteration**: Overview, architecture, consistency
- **Specific iteration**: Implementation details, special cases

**Example of an iterative cycle**:

1. **Global + Functional** → General business architecture
2. **Specific + Technical** → Implementation of a component
3. **Global + Technical** → Architectural patterns
4. **Specific + Functional** → Particular use case
5. **Back to 1** with enrichment

## ⚡ AI‑KIDO Commands

### 🏗️ Initialization Commands (Recommended Order)

1. **`init-aikido`** - Memory bank initialization
   - Creates the base structure in `/prompts/gen/`
   - Automatic analysis of the project sources (via `agent-aikido-explore-bank`)
   - Contradiction resolution (via `agent-aikido-truth-evaluator`)
   - STANDARD mode RACI classification (via `agent-aikido-raci-delegator`)
   - Final validation (via `agent-aikido-validator`)
   - **Agents used**: 4 agents (explore-bank, truth-evaluator, raci-delegator, validator)

2. **`init-glossaire`** - Business glossary creation
   - Extraction of specific and confusing business terms (via `agent-aikido-explore-bank`)
   - Terminological contradiction resolution (via `agent-aikido-truth-evaluator`)
   - Classification by domain (via `agent-aikido-raci-delegator`)
   - Compliance validation (via `agent-aikido-validator`)
   - **Agents used**: 4 agents (explore-bank, truth-evaluator, raci-delegator, validator)

3. **`init-raci-aikido`** - RACI matrix and organization
   - Extraction of roles and responsibilities (via `agent-aikido-explore-bank`)
   - Hierarchy generation and slugification (via `agent-aikido-raci-delegator`)
   - RACI compliance validation (via `agent-aikido-validator`)
   - **Agents used**: 3 agents (explore-bank, raci-delegator, validator)

4. **`analyse-project`** - Contextual analysis
   - Scan of the existing project and source extraction
   - Contradiction resolution if detected (via `agent-aikido-truth-evaluator`)
   - Document classification (via `agent-aikido-raci-delegator`)
   - Compliance validation (via `agent-aikido-validator`)
   - **Agents used**: 3 agents (truth-evaluator, raci-delegator, validator)

5. **`create-persona`** - Persona creation
   - Exploration of existing personas to avoid duplicates (via `agent-aikido-explore-bank` in QUICK MODE)
   - Interactive workflow: anthropomorphic (human expert) or technical (specialized tool)
   - Automatic generation of persona files, .roomodes, and .claude/agents/
   - **Agents used**: 1 agent (explore-bank in quick mode)

6. **`create-command`** 🆕 - Command Creation Assistant
   - Interactive guide with user questionnaire
   - Detection of similar commands to avoid duplicates (via `agent-aikido-explore-bank` QUICK)
   - Identification of relevant NON-internal expert agents/personas (via `agent-aikido-explore-bank` QUICK)
   - Memory Bank resource search (hard points, concepts, techniques, use cases) (via `agent-aikido-explore-bank` DEEP)
   - Suggestion of optimal internal AI-KIDO agents (via `agent-aikido-explore-bank` QUICK)
   - Generation of an optimized command structure with compliance validation (via `agent-aikido-validator`)
   - Automatic integration into AGENTS.md, CLAUDE.md, README.md (via `agent-aikido-maj-md-index`)
   - **Agents used**: 6 agents (explore-bank×4 varied modes, validator, indexer)

7. **`create-search-plan`** 🆕 - Code Search Plan Creation
   - Interactive assistant to create technology-aware search plans
   - Pre-configured templates (generic, php, javascript, python, java, rust, go, etc.)
   - Automatic validation against `agent-aikido-explore-code` requirements
   - Support for PSR-4, ES Modules, language-specific imports
   - Regex pattern generation for classes, interfaces, functions, dependencies
   - Integration into `/prompts/hard_points/system/search/plans/`

8. **`validate-search-plan`** 🆕 - Search Plan Validation
   - Compliance check of plans against README.md and requirements
   - Validation of regex patterns, output format, line numbers
   - Complete checklist: imports, declarations, functions, keywords, output
   - Detailed report with correction recommendations
   - Support for all languages (generic, php, javascript, typescript, etc.)

9. **`create-analyse-plan`** 🆕 - Project Analysis Plan Creation
   - Interactive assistant to create project analysis plans for `/analyse-project`
   - Type-specific templates (architectural, technical, functional, methodological)
   - 4 depth levels (overview, standard, in-depth, expert)
   - Generation of agent prompts, extraction strategies, Mermaid workflows
   - Integration into `/prompts/hard_points/system/analyse/plans/`

10. **`validate-analyse-plan`** 🆕 - Analysis Plan Validation

- Compliance check of plans against README.md and `/analyse-project`
- Validation of mandatory sections, metadata, agent orchestration
- Validation of extraction strategies, Mermaid workflow, output format
- Detailed report in `/prompts/spec/` with overall score and recommendations
- Compatibility with the plan resolution algorithm

### 🔧 Maintenance Commands

#### `check-claude` - CLAUDE.md Synchronization and Claude Code Compatibility

**Goal**: Check the state of the Memory Bank and generate the Claude Code compatibility files

**Process**:

1. **Complete inventory** → Memory Bank scan (via `agent-aikido-explore-bank`)
2. **Compliance validation** → AI-KIDO rules (via `agent-aikido-validator`)
3. **Inconsistency detection** → CLAUDE.md ↔ Memory Bank mapping (via `agent-aikido-truth-evaluator`)
4. **.claude/agents/ generation** → Automatic mapping from `/prompts/gen/personas/`
5. **.claude/commands/ generation** → Automatic mapping from `prompts/hard_points/commands/`
6. **CLAUDE.md update** → Section 12 with current status and statistics
7. **Detailed report** → Created in `/prompts/spec/check-claude-[DATE].md`

**Agents used**: 3 agents (explore-bank, validator, truth-evaluator)

**Result**: Base 100% compatible with Claude Code, with commands and agents detected automatically

#### `check-truth` - Documentation ↔ Code Consistency Check 🆕

**Goal**: Check the consistency between AI-KIDO documentation and source code, detect obsolescence and propose automatic fixes

**Available syntaxes**:

```bash
/check-truth                           # Complete Memory Bank check
/check-truth --file [path]            # Specific file
/check-truth --domain concepts         # Complete domain
/check-truth --search "keyword"        # Search by keyword
/check-truth --code-path ./src/auth/   # Code + doc analysis
/check-truth --verbose                 # Detailed mode
/check-truth --force-check             # Force validation (ignore fast-path)
```

**Optimized process**:

1. **Targeted inventory** → Scan according to scope (via `agent-aikido-explore-bank` QUICK)
2. **Fast-path optimization** → Skip validation if ✅ + sources unchanged (via `agent-aikido-doc-header`)
3. **Truth sources validation** → doc ↔ code/specs consistency (via `agent-aikido-truth-evaluator`)
4. **Gap analysis** → Detection of missing documentation (via `agent-aikido-explore-bank` + `truth-evaluator`)
5. **Header update** → Refresh last-check metadata (via `agent-aikido-doc-header` batch)
6. **Complete report** → Statistics + recommendations in `/prompts/spec/check-truth-[DATE].md`
7. **Auto-correction** (optional) → Fix inconsistencies + create missing docs (via `agent-aikido-bank-populate`)

**Agents used**: 5 agents (explore-bank×2, doc-header×2, truth-evaluator, [bank-populate optional])

**Key optimizations**:

- ⚡ **Fast-path**: 70-80% token savings on up-to-date documents (via last-check metadata)
- 🎯 **Targeted analysis**: Adjustable scope (file, domain, search, code, full)
- 🤖 **Agent orchestration**: Workflow optimized for maximum performance
- 📊 **Smart detection**: Gaps, obsolescence, major/minor conflicts

**Estimated performance**: ~20-30k tokens (vs ~100k without optimization) = **70-80% efficiency**

**Use cases**:

- Verification after feature development
- Ongoing documentation maintenance
- Regular obsolescence detection
- Analysis of new/refactored code

#### `maj-aikido` - Complete Update and Synchronization

**Goal**: Update from external sources OR synchronize the memory bank after changes

**Two modes available**:

**UPDATE mode** (`/maj-aikido --update`):

1. **Source selection** → AI-KIDO Git, archive, or local directory
2. **Differential analysis** → Source ↔ target comparison with statistics
3. **File update** → User choice (REPLACE/MERGE/IGNORE)
4. **Intelligent merge** → Agent-aikido-fusion for context preservation
5. **Hard points** → Automatic replacement (absolute authority)
6. **V1.3 migration** → If base < V1.3, automatic migration
7. **Synchronization** → Standard phases 0-7

**SYNC mode** (`/maj-aikido`):

1. **Change detection** → Hard points and new commands (via `agent-aikido-explore-bank`)
2. **Impact analysis** → Compatibility with the existing base
3. **Contradiction detection** → Automatic resolution (via `agent-aikido-truth-evaluator`)
4. **Compliance audit** → Post-rebase validation (via `agent-aikido-validator`)
5. **Final validation** → Complete check (via `agent-aikido-validator`)

**Agents used**: 5 agents (explore-bank, truth-evaluator, validator×2, fusion)

**See the complete section**: [🔄 Updating an Existing AI-KIDO Base](#-updating-an-existing-ai-kido-base)

#### `analyse-aikido` - Audit and Correction

**Goal**: Complete audit with automatic corrections according to the 18 rules

**Process**:

1. **Structure scan** → Violation detection (via `agent-aikido-explore-bank`)
2. **Constraint validation** → Rules 4, 6, 7 (via `agent-aikido-validator`)
3. **Correction validation** → Post-correction check (via `agent-aikido-validator`)
4. **RACI consistency** → Matrix validation (via `agent-aikido-raci-delegator`)
5. **Contradiction arbitration** → Conflict resolution (via `agent-aikido-truth-evaluator`)
6. **Final audit** → Complete validation (via `agent-aikido-validator`)

**Agents used**: 4 agents (explore-bank, validator×3, raci-delegator, truth-evaluator)

#### `reindex-projet` - Complete Project Reindexing 🆕

**Goal**: Regenerate the complete JSON index of the project structure with a 24H cache

**Syntax**:

```bash
/reindex-projet              # Complete indexing
/reindex-projet src/Domain   # Indexing targeted at a directory
```

**Process**:

1. **Structure analysis** → Complete project scan (260 files, 37 directories)
2. **JSON index generation** → Optimized V3.2 format (by_path, by_directory, by_type, by_name)
3. **Structure validation** → Consistency and AI-KIDO V1.3 compliance check
4. **Statistics** → Detailed report (files, lines, size, compliance)
5. **24H cache** → Query performance <5ms vs 2500ms markdown

**Agents used**: 1 agent (agent-aikido-projet-index)

**Performance**: ~36s generation, <100ms parse, <5ms query

#### `clean-index` - Smart Index Cleanup 🆕

**Goal**: Selectively clean orphan entries from the index (files indexed but absent from the filesystem)

**Syntax**:

```bash
/clean-index                 # Automatic smart cleanup
/clean-index --dry-run       # Analysis only, no deletion
/clean-index --verbose       # Detailed mode with complete list
```

**Use cases**:

- Files deleted but still in the index
- Orphan entries after refactoring
- Regular index maintenance
- Incremental cleanup without full regeneration

**Smart workflow**:

- `/clean-index` → Detects and removes orphans
- If <10% orphans → Index consistent ✅
- If >10% orphans → Recommends `/reindex-projet`

**Agents used**: 0 agents (bash script optimized with jq)

**Performance**: ~5-10s (3-5× faster than with an agent)
**Prerequisites**: `jq` must be installed (`brew install jq` / `apt-get install jq` / `yum install jq`)
**Advantage**: Ultra-fast selective cleanup without LLM tokens

### 📊 Traceability Commands

#### `logllmon` - Enable Logs

- Enables `LLM_TRACIBILITY=TRUE` in `/prompts/index.md`
- Starts recording interactions in `/prompts/spec/logs/prompts.log`

#### `logllmoff` - Disable Logs

- Disables `LLM_TRACIBILITY=FALSE` in `/prompts/index.md`
- Stops recording interactions

**Log format**:

```markdown
# DATE: YYYY-MM-DD HH:MM:SS
## PROMPT [Mode used]
[User question]

```

**⚠️ Critical rule**: Logs are **ALWAYS** stored in `/prompts/spec/logs/prompts.log`, never at the project root.

### 🚀 Export and External Use Commands

#### `compile-agent-from-use` - Standalone Agent Compilation

**Goal**: Export the AI-KIDO memory bank to standalone agents for external use (ChatGPT, Microsoft Copilot, MCP, etc.)

**Interactive process**:

1. **Mode selection** → 4 options: existing case, command, use-case, manual
2. **Element extraction** → Targeted analysis (via `agent-aikido-explore-bank`)
3. **Semantic optimization** → Compression, prioritization, oral validation
4. **Compliance validation** → Pre-finalization (via `agent-aikido-validator`)
5. **SEMVER versioning** → Automatic version calculation based on the changes

**Agents used**: 2 agents (explore-bank, validator)

**Available modes**:

- **📋 Existing case**: Modify an already compiled agent
- **⚡ Command**: Create from an existing `.roo` command
- **🎯 Use-case**: Start from a specific AI-KIDO use case
- **✋ Manual**: Complete step-by-step configuration

**Result**: Agent compiled in `/out/agents/agent-[usage]-vX.Y.Z.md` with:

- System prompt optimized for external use
- Integrated consulting personas
- Advanced reformulation techniques
- Step-by-step operational workflow
- Quality metrics (semantic density, consistency, ease of oral use)

**Use cases**: Deployment on ChatGPT, MCP integration, Microsoft Copilot agents, or any other context outside Roo-Code/VSCode.

## 🤖 Available AI-KIDO Agents

### Current Specialized Agents

The project currently has **13 specialized agents** in `/prompts/gen/personas/`:

#### 1. **agent-aikido-explore-bank** 🔍 (Memory Bank Explorer)

**Specialization**: Search and extraction of information from the AI-KIDO Memory Bank

**When to use it**:

- When a user asks questions about documented concepts/techniques/personas
- Before running complex tasks requiring Memory Bank context
- To proactively explore the project's patterns and best practices
- To identify the available agents and their capabilities

**Capabilities**:

- Intelligent search in `/prompts/gen/` and `/prompts/hard_points/` only
- **IGNORES `/spec/`**: Personal space, never explored (unless explicitly activated)
- Contextual extraction adapted to the query
- Recursive navigation in the AI-KIDO tree structure
- Automatic detection of relevant patterns

**✅ Optimization done**: 366 lines (meets the 500-line constraint - Rule 4)

#### 2. **agent-aikido-explore-code** 💻 (Source Code Explorer)

**Specialization**: Deep search in the project source code (OUTSIDE the Memory Bank) with structured metadata extraction

**When to use it**:

- To locate classes, interfaces, functions, modules in the source code
- Dependency and import analysis (cross-file relationship graph)
- Code architecture mapping (extends, implements, uses)
- Guided "where to look for what" search by technology (PHP, JavaScript/TypeScript, generic)
- Need for compact metadata with line numbers (NOT the full code)

**Capabilities**:

- **Technology-aware**: Specialized search plans (generic, php, javascript/typescript)
- **Hierarchical resolution**: tech/version → tech → generic (fallback)
- **Structured metadata**: Classes (lines X-Y), Functions (signatures), Dependencies (imports)
- **Compact output**: ~50 lines per file max, <2500 tokens total
- **.gitignore aware**: Automatically excludes ignored patterns
- **PSR-4 aware** (PHP): Namespace → file path resolution via composer.json
- **ES Module aware** (JS/TS): Import path resolution with tsconfig.json
- **IGNORES `/prompts/`**: Searches ONLY in the project source code

**Available Search Plans**:

- `plan-generic.md`: Multi-language fallback (Python, Java, Rust, Go, C++, etc.)
- `php/plan.md`: PHP with PSR-4, Laravel, Symfony, WordPress patterns
- `javascript/plan.md`: JavaScript/TypeScript with ES Modules, React, Node.js

**Output format**:

```markdown
## 📄 `path/to/file.ext`
**Classes** (X):
  - `ClassName` (lines 15-145): 130 lines
    - Extends: `ParentClass`
    - Methods: 8
**Dependencies** (X):
  - `package/module/path` (line 3)
```

**Compliance**: ✅ 650 lines (meets the extended 1000-line constraint - technical agent)

**Integration**: Called manually or via `agent-aikido-explore-all` for parallel search

#### 3. **agent-aikido-explore-all** 🔍💻 (Parallel Search Orchestrator)

**Specialization**: Minimal orchestrator for simultaneous search in the Memory Bank AND the source code

**When to use it**:

- General search without knowing whether it is in documentation or code
- Need for a complete view: documentation + implementation
- Check consistency between specs (bank) and reality (code)
- Global project exploration (docs + code)

**Capabilities**:

- **Parallel orchestration**: Launches explore-bank + explore-code IN PARALLEL (single message, 2 Task calls)
- **Result combination**: Merges outputs into a structured format
- **Cross-reference detection**: Identifies docs ↔ code connections
- **Optimized performance**: Time = max(time_bank, time_code) ≈ 3-5s (NOT the sum)

**Execution pattern**:

```markdown
Task 1: explore-bank (subagent_type: agent-aikido-explore-bank)
Task 2: explore-code (subagent_type: agent-aikido-explore-code)
Wait → Combine → Return structured output
```

**Output format**:

```markdown
# Comprehensive Search Results: [QUERY]

## 📚 Memory Bank Results
[Results from explore-bank]

## 💻 Source Code Results
[Results from explore-code]

## 🔗 Cross-References
[Connections between docs and code]

## 📊 Summary
- Memory Bank: X documents
- Source Code: Y files, Z elements
```

**Performance**:

- Parallel execution (not sequential)
- Total time: ~3-5s (max of both)
- Tokens: ~2,000-3,000 (sum)

**Compliance**: ✅ 150 lines (minimal agent, pure orchestration)

**Trade-offs**:

- ❌ Double cost (2 agents) → Use ONLY when a truly global need exists
- ✅ Optimized time (parallel) → Not 2× slower (max time, not sum)
- ✅ Complete view → Ideal for exploration without a precise scope

#### 4. **agent-aikido-truth-evaluator** ⚖️ (Truth Sources Evaluator)

**Specialization**: Determines the authoritative sources (specs, code, docs, tests) according to the development scenario

**When to use it**:

- Before starting development work (identify authoritative sources)
- When specs and code contradict each other (determine which source to follow)
- During code reviews (validate against the right sources)
- During refactoring (distinguish legacy docs vs current implementation)
- When documentation seems outdated (check against the code)

**Capabilities**:

- Automatic classification by scenario (8 types: new feature, bug fix, refactoring, config, docs, from-scratch, investigation, API integration)
- Source hierarchy: `/hard_points/` (immutable) > `/gen/` (evolving) > code/docs > **NEVER `/spec/`**
- **IGNORES `/spec/`**: Personal space, not a source of truth (unless explicitly activated)
- Conflict detection between sources
- Precise recommendations with confidence level

**Compliance**: ✅ 127 lines (meets the 500-line constraint)

#### 5. **agent-aikido-raci-delegator** 🎯 (RACI Classifier)

**Specialization**: Classifies and routes documents to their correct location in the Memory Bank according to the RACI matrix

**When to use it**:

- To classify a new document in the Memory Bank
- When organizing/reorganizing content
- To determine the role responsible for a type of content
- In a single-project or multi-project context (automatic detection)

**Capabilities**:

- Content analysis (extraction of topic, type, domain, technical level, role)
- Classification by type (concept, technique, persona, use_case, hard_point)
- Project context detection (single vs multi-project)
- RACI mapping (Responsible/Accountable/Consulted/Informed)
- Path recommendation: `/gen/` or `/hard_points/` only (NEVER `/spec/`)
- **IGNORES `/spec/`**: Personal space, not a classification destination

**Compliance**: ✅ 214 lines (meets the 500-line constraint)

#### 6. **agent-aikido-doc-header** 📝 (Document Header Manager)

**Specialization**: Standardizes and manages AI-KIDO document headers with versioning, truth validation metadata, and source traceability

**When to use it**:

- When creating headers for new documents in the Memory Bank
- To validate existing headers against the AI-KIDO standards
- After validation by truth-evaluator to update the last-check metadata
- To refresh source references with current modification dates
- To add inline reference tracking in document sections

**Capabilities**:

- Header creation with complete metadata (version, truth source, last-check, source refs)
- Format and compliance validation of existing headers
- Post-validation update (Last Check, Check Status, Checked By)
- Source reference management (code/specs) with automatic extraction of modification dates
- Support for Greenfield (Spec = truth), TMA (Code = truth), and Dual (Refactoring) scenarios
- Inline reference tracking with status (✅ Up-to-date, ⚠️ Review needed, ❌ Outdated)
- truth-evaluator optimization: Fast-path skips validation if ✅ + sources unchanged (70-80% token savings)

**Header formats**:

- **Minimal** (pure theory): Version, Date, Status
- **Complete** (code-linked): + Truth Source, Last Check, Source Refs, Check Status

**Compliance**: ✅ 475 lines (meets the 500-line constraint)

**Integration**: Invoked by truth-evaluator (post-validation) and bank-populate (document creation)

#### 7. **agent-aikido-bank-populate** 🤖 (Memory Bank Automatic Populator)

**Specialization**: Orchestrates the automatic population of the Memory Bank from code and context when documents are missing or invalid

**⏰ INVOCATION TIMING: END OF PROCESS ONLY**

- Called AFTER a complete analysis/audit
- Called AFTER generation of the final report listing all gaps
- The user explicitly decides whether or not to populate
- ❌ NOT invoked immediately upon gap detection

**When to use it**:

- At the end of an analysis: complete list of missing/invalid documents generated
- After a complete Memory Bank audit with a gap report
- The user validates the automatic population of the detected gaps
- Need to capitalize knowledge from existing code (batch)

**Capabilities**:

- Memory Bank gap detection
- Information collection from code/context/docs without analysis
- Multi-agent orchestration (truth-evaluator, raci-delegator, expert personas)
- AI-KIDO compliance validation (≤500 lines, bidirectional links)
- Automatic integration with index update
- **New**: Invokes doc-header to create complete headers with metadata

**Compliance**: ✅ 477 lines (meets the 500-line constraint)

#### 8. **agent-aikido-validator** ✅ (AI-KIDO Compliance Validator)

**Specialization**: Lightweight and fast validation of files against the essential AI-KIDO rules (line constraints, location, frontmatter, links)

**Automatic trigger**: Invoked on file operations in `/prompts` (create/edit/move)

**When to use it**:

- ✅ Automatically after file creation/modification in `/prompts`
- ✅ Quick compliance check (line constraints, location, frontmatter)
- ✅ Validation of specific files passed as a parameter
- ⚠️ NOT for a complete Memory Bank audit (use `/analyse-aikido`)

**Capabilities**:

- Automatic single/multi-project structure detection
- Targeted validation: Rule 4 (lines), Rule 6 (links), Rule 2 (separation), frontmatter
- Concise reports (<2k tokens per validation)
- Minimal rule loading (from `/prompts/hard_points/ai-kido.md`)
- Exception handling (ai-kido.md exempt from the 500-line limit)

**Optimizations**:

- 🚀 Minimal token usage (<2k per validation)
- ⚡ No recursive navigation (only loads the rules)
- 🎯 Validates ONLY specified files (no exploration)
- 📊 Quick checks (wc -l, grep frontmatter, location validation)

**Compliance**: ✅ 143 lines (optimized for speed)

#### 9. **agent-aikido-balancer** ⚖️ (Tree Structure Balancer)

**Specialization**: Automatic balancing of the Memory Bank tree structure according to AI-KIDO rules (≤500 lines, 3-7 children, ≤4 levels)

**When to use it**:

- After significant Memory Bank modifications
- Files exceeding 500 lines (or 1000 for extended), prompts/hard_points/system/structure/index.json no limit.
- Tree depth >4 levels
- Branching factor outside 3-7 (too many or too few children)
- Broken bidirectional links after a reorganization

**Capabilities**:

- Complete structure analysis (depth, branching, file size)
- Detection of Rule 4, 6, 7 violations
- Semantic split of files >500 lines (preserves consistency)
- Depth reduction (flatten hierarchies)
- Branching optimization (grouping/merging)
- Automatic bidirectional link maintenance

**Estimated gains** (vs manual):

- Time: -70% (60 → 18 min)
- Complexity: -50% (3.5 → 1.8/5)
- Risk: -60% (3.5 → 1.4/5)
- Quality: Intelligent semantic split, guaranteed links

**Compliance**: ✅ 383 lines (meets the 500-line constraint)

#### 10. **agent-aikido-maj-md-index** 📑 (Memory Bank Indexer)

**Specialization**: Automatic update of all Memory Bank index.md files (domains, main, AGENTS.md)

**When to use it**:

- After adding/modifying/deleting files
- Index ↔ actual structure out of sync
- Outdated Memory Bank statistics
- AGENTS.md needs a context/agents update
- Memory Bank status report generation

**Capabilities**:

- Complete structure scan of all domains (concepts, techniques, uses, personas)
- Metadata extraction (title, description, frontmatter, line counts, dates)
- Domain index.md generation (with navigation, stats, subdirs)
- Main index update (/prompts/gen/index.md)
- AGENTS.md synchronization (context, agent list, statistics)
- Subdirectory index creation (if >3 files)

**Estimated gains** (vs manual):

- Time: -80% (45 → 9 min)
- Complexity: -67% (3.0 → 1.0/5)
- Risk: -67% (3.0 → 1.0/5)
- Quality: Guaranteed statistics accuracy, consistent navigation

**Compliance**: ✅ 518 lines (meets the 500-line constraint with extended)

#### 11. **agent-aikido-fusion** 🔀 (Intelligent Merger)

**Specialization**: Intelligent file merging during AI-KIDO updates, preserving project context while adopting the new formalism

**When to use it**:

- During external updates (`/maj-aikido --update`)
- To merge modified files (choice "2. MERGE")
- When the source formalism evolves but the project context must be preserved
- Adopting new AI-KIDO versions (V1.3) with existing context

**Capabilities**:

- Advanced differential analysis (formalism vs content vs concepts)
- Project context preservation (examples, configurations, decisions)
- Source formalism adoption (structure, frontmatter, links)
- Intelligent conflict resolution (clear priorities: SOURCE for form, TARGET for context)
- AI-KIDO compliance validation (≤500 lines, bidirectional links, frontmatter)
- Complete JSON metadata generation (modifications, conformity, recommendations)

**Fundamental principle**: *"Preserve the essence, adopt the form"*

**5-phase workflow**:

1. **Preliminary Analysis**: Metadata extraction, section detection, divergence identification
2. **Semantic Mapping**: SOURCE ↔ TARGET section mapping
3. **Progressive Merge**: Metadata → Structure → Content
4. **Validation and Compliance**: Automatic checks
5. **Result Generation**: Merged file + metadata + notes

**Estimated gains** (vs manual merge):

- Time: -80% (60 → 12 min per file)
- Complexity: -70% (4.5 → 1.4/5)
- Risk: -85% (4.0 → 0.6/5 - guaranteed context preservation)
- Quality: Validated AI-KIDO compliance, no information loss

**Compliance**: ✅ 474 lines (meets the 500-line constraint)

**Integration**: Called automatically by `/maj-aikido --update` when "MERGE" is chosen

#### 12. **agent-aikido-projet-index** 🗂️ (Project Index Manager)

**Specialization**: Generation and maintenance of the project tree in JSON with a memory cache for instant answers on structure and file location

**When to use it**:

- To quickly locate a file in the project ("Where is X?")
- To list the files of a directory
- To get statistics on the project structure
- For repetitive filesystem navigation queries

**Capabilities**:

- Complete JSON index generation (`prompts/hard_points/system/structure/index.json`) via bash scripts
- JSON cache with 4 multi-level indexes: by_path, by_directory, by_type, by_name
- Instant answers (<10ms) from the memory cache (24h TTL)
- Pre-computed metadata: lines, sizes, dates, types, icons
- Automatic exclusion: `.git/`, `node_modules/`, `.gitignore` patterns
- Automatic regeneration via `watch-changes.sh` on filesystem changes

**Performance**:

- **Query time**: <10ms (memory O(1) access)
- **JSON parse**: ~100ms (first read, shared between invocations)
- **Regeneration**: ~36s (1200+ files, asynchronous in the background)
- **Gain vs find/stat/wc**: **300-500x faster** ⚡⚡⚡

**JSON format (v3.0)**:

```json
{
  "metadata": {
    "last_check": {"timestamp": "...", "status": "✅"},
    "statistics": {"total_files": 183, "total_lines": 32930}
  },
  "index": {
    "by_path": {"path/file.md": {name, type, icon, lines, size, modified, ...}},
    "by_directory": {"dir/": {"files": [...]}},
    "by_type": {"agent": [...], "concept": [...]},
    "by_name": {"filename.md": ["path1", "path2"]}
  }
}
```

**Available scripts**:

- `generate-project-tree.sh`: Main wrapper (complete generation)
- `generate-project-tree-json.sh`: Optimized JSON engine
- `format-file-metadata.sh`: Metadata extraction helper
- `watch-changes.sh`: Filesystem monitoring + automatic regeneration

**Integration with other agents**:

- ✅ **agent-aikido-maj-md-index**: Speeds up file scanning 300-500x (3-5s → <10ms)
- ✅ **agent-aikido-explore-bank**: Ultra-fast Phase -0.75 for location queries (2.6s → <5ms, 97% tokens saved)
- ✅ **agent-aikido-balancer**: Instant structure analysis (3-5s → <10ms)
- ⚙️ **agent-aikido-validator**: Instant metadata (lines, dates)
- ⚙️ **agent-aikido-bank-populate**: Instant gap validation
- ⚙️ **agent-aikido-raci-delegator**: Fast RACI location

**Estimated gains** (vs manual scans):

- **Time**: -95% to -99% depending on the agent (3-5s → <10ms)
- **Tokens**: -97% for explore-bank location queries (1400 → 50 tokens)
- **Complexity**: Complete elimination of `find`, `stat`, `wc -l`
- **Quality**: Standardized metadata, shared cache, consistent exclusions

**Compliance**: ✅ 667 lines (meets the extended 1000-line constraint - technical agent)

**Use cases**:

1. **Fast navigation**: "Where is agent-aikido-maj-md-index.md?" → Answer in <5ms
2. **Directory exploration**: "What does /prompts/gen/personas/ contain?" → Instant list
3. **Project statistics**: Total files, lines, distribution by type → Pre-computed
4. **Agent optimization**: All agents using find/grep/stat benefit automatically

**Automatic update**: `watch-changes.sh` detects file changes → asynchronous JSON regeneration (~36s in the background)

### Adaptive Orchestrator

[agent-aikido-orchestrator](prompts/hard_points/agents/agent-aikido-orchestrator.md)
always works and adapts to the orchestrator already in the system:
`lead` when none exists (complete agent-and-Tool inventory), `collaborate` with an
existing native orchestrator (Claude Code, Kiro, Codex, Roo, or any registered
one: it follows its definition, guides it with a JSON plan, runs direct/MCP tasks
itself, and takes over only what it verifiably cannot do, e.g. a parallel batch
the native orchestrator cannot run), or `direct` when the host is unknown.
The [system skill](prompts/hard_points/system/orchestrator/SKILL.md) binds work
to the context's actual Tools and MCP capabilities, including each worker's.
It sequences dependencies and shared-resource work, and parallelizes independent
tasks only when an executor really supports concurrency and resource budgets allow.
Every exchange with agents, threads, MCP tools and direct tools is one strict JSON
object defined by the [contract](prompts/hard_points/system/orchestrator/contract.schema.json)
(`task-request/2` in, `task-result/1` out).
The orchestrator can also run commands and code, and journals every task and
sub-task with [tracker.mjs](prompts/hard_points/system/orchestrator/tracker.mjs):
state, attempts, bounded retries, stale-task detection and the tokens and cost
that executors actually report (never estimated). `tracker.mjs status` returns
one JSON summary used to relaunch failed work and follow consumption.

### 🔄 Inter-Agent Integration: Projet-Index as an Accelerator

The **agent-aikido-projet-index** agent acts as a **performance accelerator** for the other agents by providing a pre-computed JSON cache of the project structure.

#### Integration Mechanism

**Principle**: Fast-path with graceful fallback

```
Agent starts
  → Checks JSON index availability (<24h)
    → YES: Fast path (<10ms) ⚡⚡⚡
    → NO: Traditional fallback (3-5s)
  → No breaking change
```

**Architecture**:

```
prompts/hard_points/system/structure/
├── index.json                    # Shared cache (605KB → 92KB optimized)
└── scripts/
    ├── generate-project-tree.sh  # Generation
    ├── watch-changes.sh          # Auto-update
    └── format-file-metadata.sh   # Helper
```

#### Gains per Agent

| Agent | Optimized Operation | Before | After | Gain |
|-------|---------------------|--------|-------|------|
| **indexer** | File scan + stats | 3-5s | <10ms | **300-500x** ⚡⚡⚡ |
| **explore-bank** | Location queries | 2.6s, 1400 tok | <5ms, 50 tok | **520x, 97% tokens** ⚡⚡⚡💰 |
| **explore-code** | Code search metadata | N/A | Technology-aware | **N/A** (new agent) |
| **explore-all** | Parallel bank+code | N/A | 3-5s (parallel) | **N/A** (orchestrator) |
| **balancer** | Structure analysis | 3-5s | <10ms | **300-500x** ⚡⚡⚡ |
| **validator** | Line counting | 0.5s (wc) | <1ms (cache) | **500x** ⚡⚡ |
| **bank-populate** | Gap validation | 1-2s | <10ms | **100-200x** ⚡⚡ |
| **raci-delegator** | RACI location | 1-2s | <10ms | **100-200x** ⚡⚡ |

**Cumulative impact**: Up to **-95% execution time** on heavy filesystem operations

#### Typical Integration Code

**Pattern used in all optimized agents**:

```bash
# Check availability
if [ -f "prompts/hard_points/system/structure/index.json" ]; then
    AGE=$(( $(date +%s) - $(stat -f%m "index.json" 2>/dev/null || echo "0") ))
    if [ $AGE -lt 86400 ]; then  # <24h
        USE_PROJET_INDEX=true
    fi
fi

# Fast path (with projet-index)
if [ "$USE_PROJET_INDEX" = "true" ]; then
    # Query JSON directly (instant)
    RESULTS=$(jq -r '.index.by_path | keys[]' index.json | grep "$pattern")
    # Performance: <10ms ⚡⚡⚡
fi

# Fallback path (traditional)
if [ "$USE_PROJET_INDEX" != "true" ]; then
    # Use find/grep/wc as before
    RESULTS=$(find . -name "$pattern" ...)
    # Performance: 3-5s (100% compatible)
fi
```

**Advantages**:

- ✅ **No breaking change**: Automatic fallback if the JSON is unavailable
- ✅ **Massive gains**: 300-500x faster when available
- ✅ **Transparent**: Integration invisible to the user
- ✅ **Robust**: 24h TTL with automatic regeneration via watch-changes.sh

### 💼 AI-KIDO Agent Use Cases

#### Use Case 1: **Contextual Exploration Before Development**

**Agent**: `agent-aikido-explore-bank`

**Scenario**: A developer must create a new authentication endpoint

**Workflow**:

1. User: "I need to create an OAuth authentication endpoint"
2. The explore-bank agent searches for: authentication patterns, security specs, existing OAuth techniques
3. The agent returns: established architecture, security constraints (`/hard_points/`), reusable patterns
4. The developer implements while respecting the project standards

**Benefit**: Consistency with existing work, respect of constraints, pattern reuse

#### Use Case 2: **Spec vs Code Conflict Resolution**

**Agent**: `agent-aikido-truth-evaluator`

**Scenario**: The specification says "retry 3 times" but the code retries indefinitely

**Workflow**:

1. User: "Fix the retry bug in the payment processor"
2. The truth-evaluator agent analyzes: scenario = BUG_FIX
3. The agent evaluates sources:
   - 🥇 Current code (process-payment.ts) = source of the bug
   - 🥈 Tests (expected behavior) = validation
   - 🥉 Original spec = context
4. The agent detects a conflict: code ≠ spec ≠ tests
5. Recommendation: "Fix the code to match tests + spec (max 3 retries)"

**Benefit**: Clear decision on which source to follow, avoids team debates

#### Use Case 3: **Automatic Documentation Organization**

**Agent**: `agent-aikido-raci-delegator`

**Scenario**: A document about microservices architecture must be integrated into the Memory Bank

**Workflow**:

1. User provides the "Microservices Architecture" document
2. The raci-delegator agent analyzes:
   - Type: **Concept** (architectural theory)
   - Domain: **Architecture**
   - Responsible role: **Architect Lead** (according to RACI)
   - Context: **Single-project**
3. The agent recommends: `/prompts/gen/concepts/architecture/microservices.md`
4. Validation: 95% confidence, alternatives proposed

**Benefit**: Precise classification, consistent organization, RACI compliance

#### Use Case 4: **Complete Workflow: New Feature with Context**

**Combined agents**: `explore-bank` → `truth-evaluator` → development

**Scenario**: Implement a push notification system

**Workflow**:

1. **Exploration phase** (`explore-bank`):
   - Searches existing notification patterns
   - Identifies `/hard_points/security-*` constraints
   - Extracts messaging techniques
2. **Truth evaluation phase** (`truth-evaluator`):
   - Scenario: NEW_FEATURE
   - Authoritative sources: specs > architecture > patterns
   - Hierarchy: `/hard_points/` > `/gen/` > existing code
3. **Implementation phase**:
   - The developer follows the specs with full context
   - Respects security constraints
   - Reuses validated patterns
4. **Documentation phase** (`raci-delegator`):
   - Classifies the new technical doc
   - Routes to `/prompts/gen/techniques/notifications-push.md`

**Benefit**: Consistent end-to-end workflow, automatic capitalization

#### Use Case 5: **AI-KIDO Update with Project Context Preservation**

**Agent**: `agent-aikido-fusion`

**Scenario**: A new AI-KIDO V1.3 version is available with a new unified entry point, but your project has specific examples and configurations

**Workflow**:

1. **User**: `/maj-aikido --update` → Choose the AI-KIDO Git source
2. **Differential analysis** → Detection: `prompts/gen/concepts/memory-bank.md` modified
3. **User choice**: "2. MERGE"
4. **Fusion agent** analyzes:
   - SOURCE V1.3: New formalism (V1.3 frontmatter, reorganized structure)
   - TARGET V1.2: Real project examples, specific CloudFormation configurations
5. **Fusion agent** executes:
   - ✅ Adopts V1.3 frontmatter: `> Version: 1.3 | Date: 2025-12-08`
   - ✅ Adopts the new SOURCE section structure
   - ✅ Preserves the TARGET CloudFormation examples (project-specific)
   - ✅ Integrates new V1.3 concepts (unified entry point)
   - ✅ Resolves the "Architecture" conflict: keeps the justified TARGET decision, notes the new V1.3 pattern
6. **Generation**:
   - `memory-bank.md.merged.20251208-143022`: Merged file
   - `memory-bank.md.merged.20251208-143022.meta.json`: Metadata
7. **User reviews** → Compliance validation → Replacement: `mv merged.* memory-bank.md`

**Result**:

- ✅ Base up to date with V1.3 formalism
- ✅ Project context preserved (examples, configs)
- ✅ New V1.3 concepts integrated
- ✅ AI-KIDO compliance validated (474 lines, links OK)

**Benefit**: Safe update with zero information loss, gradual adoption of AI-KIDO changes

### 🎯 AI-KIDO Agents Roadmap

**Next agents to create** (depending on project needs):

- **agent-aikido-optimizer**: Optimization of files exceeding their limits (500/1000 lines)
- **agent-aikido-link-validator**: Bidirectional link verification (Rule 6)
- **agent-aikido-semantic-compressor**: Semantic compression for maximum density
- **agent-aikido-raci-matrix-builder**: Interactive RACI matrix construction
- **agent-aikido-multi-project-migrator**: Single-project ↔ multi-project migration

**Recently created agents**:

- ✅ **agent-aikido-explore-code**: Source code search with structured metadata (~650 lines)
- ✅ **agent-aikido-explore-all**: Parallel bank+code search orchestrator (~150 lines)

**Agent creation**: Use `/create-persona` to generate new agents according to the AI-KIDO taxonomy

## 🧠 Memory Bank Construction

### Self-Feeding Principle

The AI-KIDO memory bank enriches itself automatically through several mechanisms:

1. **User signal** → As soon as an error is reported, a preventive rule is created
2. **Auto-detection** → 2+ similar errors trigger proactive self-feeding  
3. **Adaptive thresholds** → Immediate (critical), Fast (major 2x), Standard (minor 3x)
4. **Automatic integration** → Placement in the appropriate directory + index update

### Analysis Capitalization

**Fundamental rule**: Every analysis MUST generate files in the Truth Tables

**Distribution by type**:

- **Conceptual analysis** → `/prompts/gen/concepts/`
- **Technical analysis** → `/prompts/gen/techniques/`  
- **Case analysis** → `/prompts/gen/use_cases/`
- **Role definition** → `/prompts/gen/personas/`

### AGENTS.md ↔ AI-KIDO Synchronization

The `AGENTS.md` file serves as a **standardized interface** exposing the memory bank according to the LLM standard:

**Mandatory structure**:

```markdown
# AI Agents Configuration

## Project Context
[Links to /prompts/index.md and /prompts/gen/]

## Available Agents  
[References to /prompts/gen/personas/]

## Agent Interaction Matrix
[Links to the RACI matrix and specifications]

## Usage Guidelines
[Links to /prompts/gen/use_cases/ and documentation]
```

**Synchronization rules**:

- **Exclusive links**: No content duplication, only references
- **1:1 correspondence**: Each AGENTS.md agent ↔ AI-KIDO persona
- **Automatic update**: Synchronization on changes in `/prompts/gen/`

## 🚀 Quick Start with Claude Code

### Getting Started with a Bootstrap AI-KIDO Base

If you retrieve a bootstrap AI-KIDO repository (empty structure), follow these steps to make it operational under Claude Code:

#### 1️⃣ **Check and Initialize the Base**

Run the following command in Claude Code:

```
Run prompts/hard_points/commands/check-claude.md to check the state of the AI-KIDO Memory Bank and generate the Claude Code compatibility files
```

> 🇬🇧 English equivalent: *Run the file prompts/hard_points/commands/check-claude.md to check the state of the AI-KIDO Memory Bank and generate the Claude Code compatibility files.*

This command will:

- ✅ Analyze the current state of the Memory Bank (bootstrap or populated)
- ✅ Update the `CLAUDE.md` file with the current statistics
- ✅ Automatically generate the `.claude/agents/*.md` files from `/prompts/gen/personas/`
- ✅ Automatically generate the `.claude/commands/*.md` files from `prompts/hard_points/commands/`
- ✅ Create a detailed report in `/prompts/spec/check-claude-[DATE].md`
- ✅ Display the compliance metrics against the AI-KIDO rules

**⚠️ IMPORTANT**: After running this command, you must **restart Claude Code** so that the new commands and agents are detected. The `.claude/` files are loaded when Claude Code starts.

#### 2️⃣ **Restart Claude Code**

Close and reopen Claude Code (or reload the window) so that the generated files are taken into account.

#### 3️⃣ **Check Command Detection**

Type `/` in Claude Code to check that the AI-KIDO commands are available:

```
/list
```

You should see the following commands appear:

- `/analyse-aikido` - Full Memory Bank audit
- `/analyse-project` - Project source analysis
- `/check-claude` - CLAUDE.md and .claude/ files synchronization
- `/create-persona` - New persona creation
- `/init-aikido` - Memory Bank initialization
- `/init-glossaire` - Business glossary creation
- `/init-raci-aikido` - RACI matrix initialization
- `/logllmon` / `/logllmoff` - Traceability management
- `/maj-aikido` - Synchronization after a rebase

#### 4️⃣ **Check Agent Detection** (if present)

If the base already contains personas, check their availability:

```
/agents
```

The available agents will appear in the Claude Code list, generated directly from `/prompts/gen/personas/`.

#### 5️⃣ **Check the State of the Base**

See section 12 of the `CLAUDE.md` file to find:

- 📊 The complete inventory (concepts, techniques, personas, use cases, commands)
- 📈 Quality and compliance metrics
- ⚠️ Detected gaps and recommendations
- 🎯 The recommended workflow to populate the Memory Bank

#### 6️⃣ **Populate the Base (if the bootstrap is empty)**

If the base is empty (bootstrap), follow the recommended workflow in `CLAUDE.md` section 12.5:

```bash
/analyse-project    # Analyze the existing project
/init-aikido        # Initialize the Memory Bank
/create-persona     # Create specialized personas
/init-glossaire     # Create the business glossary
/analyse-aikido     # Check consistency
/check-claude       # Synchronize CLAUDE.md
```

#### ✅ **Operational Base**

After these steps, your AI-KIDO base is **100% compatible with Claude Code**:

- 🤖 Commands available via `/`
- 👥 Agents available via `/agents`
- 📚 Memory Bank accessible from `/prompts/index.md` (V1.3 entry point)
- 🔒 Priority Hard Points in `/prompts/hard_points/`
- 📊 Documentation synchronized in `CLAUDE.md`

---

## 🎯 Standard Usage Workflow

### To Start a New Project

1. **Initialization**:

   ```bash
   init-aikido          # Create the base structure
   init-glossaire       # Clarify the terminology
   init-raci-aikido     # Organize the team
   ```

2. **Enrichment**:

   ```bash
   analyse-project      # Analyze the existing context
   create-persona       # Create the specialized agents
   ```

3. **Enabling traceability** (optional):

   ```bash
   logllmon            # Enable interaction logs
   ```

### To Maintain an Existing Project

1. **Regular synchronization**:

   ```bash
   maj-aikido          # After each rebase/change
   ```

2. **Periodic audit**:

   ```bash
   analyse-aikido      # Full audit with corrections
   ```

3. **Log management**:

   ```bash
   logllmoff           # Disable if necessary
   logllmon            # Re-enable for debugging
   ```

### Navigating the Memory Bank (V1.3)

**Mandatory entry point**: [`/prompts/index.md`](prompts/index.md) - SINGLE entry point since V1.3

**Recursive traversal**: Each file references its dependencies and is referenced by its parents, creating a complete bidirectional navigation.

**Automatic consultation**: LLMs must automatically consult `/prompts/index.md` before any answer (except internal AI-KIDO agents).

**Navigation**:

- **Single-project**: `/prompts/index.md` → `/prompts/gen/index.md` → domains
- **Multi-project**: `/prompts/index.md` → `/prompts/[project-n]/index.md` → `/prompts/[project-n]/gen/index.md` → domains

## 🔧 Quality Rules

### Structural Constraints

- **📏 Line Constraints**:
  - **≤500 lines**: Standard files (concepts, techniques, use cases, docs)
  - **≤1000 lines**: Commands, personas, agents, skills (LLM optimization)
  - **Critical exception**: `ai-kido.md` and `ai-kido-light.md` MUST stay ≤500 lines
  - **Automatic splitting**: If exceeded, intelligent split with links preserved
- **🌳 4 levels maximum** of depth in the tree structure
- **⚖️ 3-7 children** per parent node for optimal balancing
- **🔗 Systematic bidirectional links** (A→B implies B→A)
- **🏗️ Flexible structures**: Single-project and multi-project support

### Standard Format

```markdown
# [Concept/Component Title]
> Version: X.Y | Date: YYYY-MM-DD | Status: [Status]

## Overview
[Concise description]

## Key definitions  
[Essential terminology]

## Guiding principles
[Rules and axioms]

## Technical specifications
[Implementation details]

## Application examples
[Concrete use cases]

## Relations and dependencies
[Connections with other components]
```

### Quality Metrics

- **Compliance**: % of files meeting the standards
- **Traceability**: Presence of references to sources
- **Consistency**: Absence of internal contradictions
- **Semantic density**: Ratio of useful information / tokens used
- **AGENTS.md synchronization**: % of personas ↔ agents compliance

## 🎚️ AI-KIDO Modes: Standard vs Light

AI-KIDO offers two organization modes depending on the size and complexity of the project:

### STANDARD Mode (Default)

**Recommended for**: Large teams (4+), complex projects, enterprise applications

**Characteristics**:

- 📦 **Multiple files**: Concepts and techniques organized by domain
- 👥 **6-12 personas**: Agents specialized by function
- 📋 **8-15 use cases**: Complete scenario coverage
- 🎭 **Full RACI**: Multi-actor matrix with defined roles
- 🌳 **Depth of 3-4 levels**: Rich tree structure

**Rules**: Defined in [`/prompts/hard_points/ai-kido.md`](prompts/hard_points/ai-kido.md)

### LIGHT Mode (Lightweight Bases)

**Recommended for**: Solo/small teams (1-3), prototypes, POCs, microservices

**Characteristics**:

- 📦 **Unified files**: 1 concepts file + 1 techniques file
- 👥 **3-5 personas max**: Versatile agents
- 📋 **3-5 use cases max**: Critical scenarios only
- 🎭 **Optional RACI**: Single or minimal actor (≤3 roles)
- 🌳 **Depth of 2-3 levels**: Flat tree structure

**Rules**: Defined in [`/prompts/hard_points/ai-kido-light.md`](prompts/hard_points/ai-kido-light.md)

**Migration**: Switching LIGHT ↔ STANDARD is possible as the project evolves

## 🚨 Hard Points - Immutable Truths

The **hard points** in `/prompts/hard_points/` are immutable truths that cannot be questioned.

**Priority hierarchy**:

1. **Hard points** (absolute priority)
2. **Truth tables** (`/prompts/gen/`)
3. **User requests**

**Mandatory handling**:

- Check for the existence of hard points for the relevant domain
- ABSOLUTELY respect all listed constraints
- In case of conflict: hard points > truth tables > user request

## 📚 Resources and Documentation

### Reference Files

- **[`prompts/hard_points/ai-kido.md`](prompts/hard_points/ai-kido.md)**: Complete guide to the 18 AI-KIDO rules (STANDARD mode)
- **[`prompts/hard_points/ai-kido-light.md`](prompts/hard_points/ai-kido-light.md)**: AI-KIDO LIGHT mode guide (lightweight bases)
- **[`prompts/hard_points/gestion-logs-aikido.md`](prompts/hard_points/gestion-logs-aikido.md)**: Traceability rules
- **[`prompts/gen/index.md`](prompts/gen/index.md)**: Memory bank entry point (single-project)
- **[`prompts/[project]/gen/index.md`](prompts/)**: Memory bank entry point (multi-project)
- **[`AGENTS.md`](AGENTS.md)**: Standardized interface for LLMs
- **[`CLAUDE.md`](CLAUDE.md)**: AI-KIDO ↔ CLAUDE.md standard mapping with base status

### Available Commands

All commands are documented in [`prompts/hard_points/commands/`](prompts/hard_points/commands/):

- **Initialization commands**: `init-aikido`, `init-glossaire`, `init-raci-aikido`
- **Analysis commands**: `analyse-project`, `analyse-aikido`
- **Creation commands**: `create-persona`, `create-command` 🆕, `create-search-plan` 🆕, `create-analyse-plan` 🆕, `compile-agent-from-use`
- **Maintenance commands**: `check-claude`, `check-truth` 🆕, `maj-aikido`, `validate-search-plan` 🆕, `validate-analyse-plan` 🆕
- **Indexing commands**: `reindex-projet` 🆕, `clean-index` 🆕
- **Traceability commands**: `logllmon`, `logllmoff`
- **Skill management commands**: `create-skill`, `skill-get` 🆕

## 🎓 Philosophy and Benefits

### Why AI-KIDO?

1. **🧠 LLM optimization**: Structure designed to maximize the efficiency of AI interactions
2. **🔄 Continuous evolution**: Self-feeding and improvement based on usage
3. **👥 Collaboration**: Role-based organization with a clear RACI matrix
4. **📈 Scalability**: Balancing constraints to handle growth
5. **🔒 Reliability**: Hard points to preserve critical decisions
6. **🌐 Interoperability**: Standard AGENTS.md interface for LLM tools

### Concrete Benefits

- **Reduced LLM response time** thanks to the optimized structure
- **Response consistency** via shared truth tables  
- **Knowledge capitalization** with self-feeding
- **Effective collaboration** thanks to role distribution
- **Simplified maintenance** with automatic audit tools
- **Complete traceability** of interactions and decisions

---

**🎯 AI-KIDO turns your project into an intelligent, scalable and collaborative memory bank, optimized for the AI era.**

To get started with an AI-KIDO bootstrap under Claude Code:

```
Run prompts/hard_points/commands/check-claude.md to check the state of the AI-KIDO Memory Bank and generate the Claude Code compatibility files
```

> 🇬🇧 English equivalent: *Run the file prompts/hard_points/commands/check-claude.md to check the state of the AI-KIDO Memory Bank and generate the Claude Code compatibility files.*

To initialize a new project: `/init-aikido`
