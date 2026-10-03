# AI‑KIDO Personas

This directory describes the different AI-KIDO technical agents usable in prompts. Add Markdown files here detailing each role and their responsibilities.

## AI-KIDO Technical Agents

### 🤖 Orchestration Agents

- [`agent-aikido-bank-populate.md`](agent-aikido-bank-populate.md) - **Memory Bank Automatic Populator** - Orchestrates automatic creation of missing or invalid documents by collecting information from code/context and delegating to experts

### 🔍 Exploration and Analysis Agents

- [`agent-aikido-explore-bank.md`](agent-aikido-explore-bank.md) - **Memory Bank Explorer** - Intelligent search and extraction of information from `/prompts/gen/`
- [`agent-aikido-truth-evaluator.md`](agent-aikido-truth-evaluator.md) - **Truth Source Evaluator** - Determines which sources are authoritative based on the scenario
- [`agent-aikido-raci-delegator.md`](agent-aikido-raci-delegator.md) - **RACI Classifier** - Classifies and routes documents to correct locations according to the RACI matrix

### ✅ Validation and Compliance Agents

- [`agent-aikido-validator.md`](agent-aikido-validator.md) - **AI-KIDO Compliance Validator** - Validates files against the 18 AI-KIDO rules and generates compliance reports with detailed resolution plans

### 🔀 Merge and Transformation Agents

- [`agent-aikido-fusion.md`](agent-aikido-fusion.md) - **Intelligent Merger** - Intelligent file merge / fusion during AI-KIDO updates, preserving project context while adopting new formalism
