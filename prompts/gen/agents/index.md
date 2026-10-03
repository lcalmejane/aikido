# AI-KIDO Personas

This directory describes the various technical AI-KIDO agents usable in prompts. Add Markdown files here detailing each role and their responsibilities.

## Technical AI-KIDO Agents

### 🤖 Orchestration Agents

- [`agent-aikido-bank-populate.md`](agent-aikido-bank-populate.md) - **Automatic Memory Bank Populator** - Orchestrates the automatic creation of missing or invalid documents by collecting information from code/context and delegating to experts

### 🔍 Exploration and Analysis Agents

- [`agent-aikido-explore-bank.md`](agent-aikido-explore-bank.md) - **Memory Bank Explorer** - Intelligent search and extraction of information from `/prompts/gen/`
- [`agent-aikido-truth-evaluator.md`](agent-aikido-truth-evaluator.md) - **Truth Source Evaluator** - Determines which sources are authoritative depending on the scenario
- [`agent-aikido-raci-delegator.md`](agent-aikido-raci-delegator.md) - **RACI Classifier** - Classifies and routes documents to correct locations according to the RACI matrix

### ✅ Validation and Compliance Agents

- [`agent-aikido-validator.md`](agent-aikido-validator.md) - **AI-KIDO Compliance Validator** - Validates files against the 18 AI-KIDO rules and generates compliance reports with detailed resolution plans

### 🔀 Merging and Transformation Agents

- [`agent-aikido-fusion.md`](agent-aikido-fusion.md) - **Intelligent Merger** - Intelligent file merging during AI-KIDO updates, preserving project context while adopting new formalism
