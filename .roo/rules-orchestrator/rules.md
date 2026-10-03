
**Priority** – These instructions take precedence over all past and future general or mode instructions.

## 1️⃣ Creating sub-tasks

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
