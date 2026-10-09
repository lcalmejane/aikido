
**Priority** – These instructions take precedence over all past and future general or mode instructions.

## 1️⃣ Creating sub-tasks

- Keep Roo's native orchestrator in charge. `agent-aikido-orchestrator`
  ([mode](../../.roomodes)) collaborates with it: delegate to it (via `new_task`)
  for a dependency-safe JSON plan, direct/MCP tasks, or a parallel batch you
  cannot run yourself. Its replies are JSON (`task-result/1`) following the
  [contract](../../prompts/hard_points/system/orchestrator/contract.schema.json);
  never let it become a second coordinator. See the
  [persona](../../prompts/hard_points/agents/agent-aikido-orchestrator.md).
- Sub-task messages to AI-KIDO agents/modes: give the objective, scope and
  acceptance checks, and require ONE JSON `task-result/1` in `attempt_completion.result`
  (include measured `usage` tokens when the mode knows them).
- Tracking: `agent-aikido-orchestrator` may run commands and journals tasks with
  `node prompts/hard_points/system/orchestrator/tracker.mjs status <req>`. Read
  that JSON to decide which failed sub-tasks to relaunch (it enforces the retry
  and token ceilings) instead of keeping your own counters.

- Model per task: `new_task` has no `model` parameter; in Roo the model is bound
  to the target mode through its API profile. To use the best model for a
  sub-task, pick the mode whose profile matches the route returned by the
  orchestrator (`selectRoute` -> `route.mode`, see the
  [system skill](../../prompts/hard_points/system/orchestrator/SKILL.md)). Never
  invent a mode or a model; if no declared route qualifies, ask the operator.

- Use the **`new_task`** tool for each sub-task.
  Example: [`new_task`](.roo/rules-orchestrator/rules.md)  
- Choose the mode best suited to the specific objective.  
- Check whether the role file (`roleDefinition`) includes a persona file:  
  - If yes, follow the directives in section **1.1️⃣** below.
  - If no, provide complete instructions in the **`message`** parameter.

### 1.1️⃣ If the chosen mode has a role file (`roleDefinition`)

- The target mode is the one defined in the persona file.  
- Include an explicit directive: *the sub-task must only execute what is described in the file*.

### 1.2️⃣ Mandatory directives (to repeat for each sub-task)

1. **Verify** that the persona file is loaded; if not, load it.  
2. Provide **all necessary context** (included files, previous information).  
3. Add a **mandatory** instruction: the sub-task must strictly limit itself to the actions described in the file.  
4. Indicate that the sub-task must report its completion via **`attempt_completion`** with a concise summary in the **`result`** field.  
   Example: [`attempt_completion`](.roo/rules-orchestrator/rules.md)
5. Instructions must be clear, complete, and specific to the sub-task objective, restating the key points from the persona file.

## 2️⃣ Mode locking

- The mode determined by the persona file is **locked** for the sub-task and cannot be changed.

## 3️⃣ Error handling and edge cases

- **Sub-task failure**: return a clear error message indicating the cause (e.g., persona file not loaded, missing context).  
- **Forbidden use cases**:  
  - Do not deviate from the persona file instructions.  
- **Warning messages**: include advice on actions to avoid and best practices to follow.
