# AI-KIDO Log Management
> Version: 1.0 | Date: 2025-11-06 | Status: Active

## Overview
Strict rules for log management in the AI-KIDO ecosystem, including location, format, and test procedures.

## Key Definitions
- **LLM_TRACIBILITY**: Control variable in `/prompts/index.md`
- **AI-KIDO Logs**: LLM interaction traceability files
- **Mandatory structure**: `/prompts/spec/logs/prompts.log`

## Guiding Principles

### 🚨 CRITICAL RULE: Log Location
**NEVER** create a `/logs/` directory at the project root.

**ALWAYS** use: `/prompts/spec/logs/prompts.log`

### 🔧 Log Test Procedure

1. **Activation check**
   ```bash
   # Check in /prompts/index.md
   grep "LLM_TRACIBILITY=TRUE" prompts/index.md
   ```

2. **Logger activation**
   - Edit `/prompts/index.md`
   - Section: `### Log Traceability Feature`
   - Variable: `LLM_TRACIBILITY=TRUE`

3. **Functional test**
   - Generate an LLM interaction
   - Verify that writing occurs in `/prompts/spec/logs/prompts.log`

4. **Deactivation**
   - Edit: `LLM_TRACIBILITY=FALSE`
   - Confirm that logging has stopped

## Technical Specifications

### Standard Log Format
```markdown
# DATE: YYYY-MM-DD HH-MM-SS
## PROMPT [Mode used]
[User question]

```

### Mandatory Directory Structure
```
/prompts/
├── spec/
│   └── logs/
│       └── prompts.log    # ← ONLY authorized location
```

### Control Commands
- **Activation / deactivation**: set `LLM_TRACIBILITY=TRUE` or `FALSE` in `/prompts/index.md`.
- The `logllmon` / `logllmoff` commands are no longer part of the core (moved to an external skill in 1.3.3); install it with `/skill-manage` if needed.

### 🔄 Mode Switch Rule for Logs — AUTOMATIC
**AUTOMATIC TRIGGER:** As soon as a user interaction is detected and `LLM_TRACIBILITY=TRUE`:

1. **Check the current mode**: If it is not CODE Mode
2. **Automatically switch to CODE Mode** without manual intervention
3. **Immediately write to `/prompts/spec/logs/prompts.log`** using the format:
   ```markdown
   # DATE: YYYY-MM-DD HH:MM:SS
   ## PROMPT [Origin mode]
   [User question]
   
   ```
4. **Automatically return to the original mode** to process the request

**CRITICAL RULE:** This sequence must execute BEFORE any other operation, ensuring complete traceability without manual intervention.

## Usage Examples

### ✅ Correct
```bash
# Check that the log file exists
ls -la prompts/spec/logs/prompts.log

# View the latest entries
tail -10 prompts/spec/logs/prompts.log
```

### ❌ Incorrect
```bash
# NEVER do this
mkdir logs
touch logs/trace.md
```

## Relations and Dependencies

### Related Files
- [`/prompts/index.md`](../index.md): `LLM_TRACIBILITY` configuration
- [`/prompts/hard_points/ai-kido.md`](ai-kido.md): Fundamental rules
- [`/prompts/hard_points/commands/skill-manage.md`](commands/skill-manage.md): Install the external `logllm` skill

### Validation Rules
1. **Before creation**: Always consult `/prompts/hard_points/ai-kido.md`
2. **Mandatory structure**: Respect the defined directory tree (line 87)
3. **Standard format**: Follow the log template (lines 150-155)

### Alert Signals
- Creation of a `/logs/` directory at the project root
- Log files outside `/prompts/spec/logs/`
- Format non-compliant with AI-KIDO specifications

---

**CRITICAL REMINDER**: This rule is part of the AI-KIDO self-feeding mechanisms to prevent structural errors.
