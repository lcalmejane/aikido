# Practical Techniques for Creating Effective Prompts

> Version: 1.0 | Date: 2025-12-05 | Status: Practical Technique

This document provides **concrete methods** and **practical examples** to apply the theoretical guidelines for prompt creation. It complements [`/prompts/gen/concepts/guideline-prompts.md`](../concepts/guideline-prompts.md).

## Overview

**Objective**: Transform theoretical principles into operational techniques with concrete examples and practical workflows.

**Target audience**: Developers, architects, product owners creating prompts for LLMs

## Effective Formulation Patterns

### Pattern 1: Persona-Task-Constraints Structure (PTC)

**Template**:
```markdown
You are [PERSONA with specific expertise].
Your task is to [PRECISE ACTION with MEASURABLE OBJECTIVE].
Constraints: [EXPLICIT LIST].
Expected format: [OUTPUT STRUCTURE].
```

**✅ Good Example**:
```markdown
You are a senior software architect specializing in microservices.
Your task is to analyze this docker-compose.yml file and identify critical security issues.
Constraints:
- Focus only on OWASP Top 10 vulnerabilities
- Ignore performance warnings
- Provide one recommendation per vulnerability
Expected format: Numbered list with [Vulnerability] - [Impact] - [Recommendation]
```

**❌ Bad Example**:
```markdown
Analyze this docker-compose and tell me what's wrong.
```

**Problems**: No role, vague objective, no constraints, undefined format.

### Pattern 2: Context-Examples-Action (CEA)

**Template**:
```markdown
Context: [SPECIFIC SITUATION]
Examples of expected results:
<example>[CONCRETE EXAMPLE]</example>
<example>[CONCRETE EXAMPLE]</example>
Action: [INSTRUCTION WITH STEPS]
```

**✅ Good Example**:
```markdown
Context: You need to create unit tests for a REST API that manages users.

Examples of expected results:
<example>
describe('GET /users/:id', () => {
  it('should return user when ID exists', async () => {
    const userId = '123';
    const response = await request(app).get(`/users/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', userId);
  });
});
</example>

<example>
it('should return 404 when user not found', async () => {
  const response = await request(app).get('/users/nonexistent');
  expect(response.status).toBe(404);
});
</example>

Action: Generate 5 unit tests covering the following cases:
1. Success with valid ID
2. 404 error with non-existent ID
3. 400 error with invalid ID
4. 401 error without authentication
5. 500 error with server error
```

**❌ Bad Example**:
```markdown
Write tests for my user API.
```

### Pattern 3: Progressive Iteration (Chain-of-Thought)

**Template**:
```markdown
Step 1: [ANALYSIS]
Step 2: [REFLECTION]
Step 3: [DECISION]
Step 4: [ACTION]

For each step, explain your reasoning before moving to the next one.
```

**✅ Good Example**:
```markdown
You need to refactor this complex function into several simpler functions.

Step 1: Analyze the code and identify distinct responsibilities
Step 2: Propose a decomposition into functions with their signatures
Step 3: Evaluate whether the decomposition respects the Single Responsibility Principle
Step 4: Implement the refactoring

For each step, explain your reasoning before moving to the next one.
```

## Concrete Examples by Use Case

### Case 1: Code Generation

**❌ Ineffective prompt**:
```markdown
Create a function to calculate the distance between two points.
```

**✅ Optimized prompt**:
```markdown
You are an experienced TypeScript developer.

Task: Create a pure function that calculates the Euclidean distance between two 2D points.

Expected signature:
```typescript
function calculateDistance(p1: Point, p2: Point): number
```

Constraints:
- Type Point = { x: number; y: number }
- Formula: sqrt((x2-x1)² + (y2-y1)²)
- Handle negative coordinates
- Return a number rounded to 2 decimal places
- Include JSDoc with @param and @returns

Usage example:
```typescript
const distance = calculateDistance({x: 0, y: 0}, {x: 3, y: 4});
// Expected result: 5.00
```

Provide the complete TypeScript code with error handling.
```

**Improvement**: +300% output quality (persona, precise constraints, example, expected format)

### Case 2: Code Review

**❌ Ineffective prompt**:
```markdown
Review this code and tell me if it's good.
```

**✅ Optimized prompt**:
```markdown
You are a senior developer doing a code review with the following criteria:
1. Security (OWASP vulnerabilities)
2. Performance (algorithmic complexity)
3. Maintainability (readability, tests)
4. Language best practices

Code to review:
```python
[CODE HERE]
```

For each criterion, provide:
- ✅ Positive points
- ⚠️ Improvement points (with correction suggestion)
- 🔴 Critical issues (with corrected code)

Output format:
## Security
...
## Performance
...
## Maintainability
...
## Best Practices
...
## Overall Score: X/10
```

### Case 3: Technical Documentation

**❌ Ineffective prompt**:
```markdown
Document this function.
```

**✅ Optimized prompt**:
```markdown
You are a technical writer creating production-quality API documentation.

Task: Document this function using the following format:

**Description**: [1 sentence summarizing the objective]
**Signature**: [Code with types]
**Parameters**:
- `param1` (type): [Description]
**Return**: [Type and description]
**Exceptions**: [List of possible errors]
**Examples**:
```[language]
// Nominal case
[EXAMPLE]

// Edge case
[EXAMPLE]
```
**Notes**: [Important remarks, performance, limitations]

Function to document:
```javascript
[CODE HERE]
```

Make sure the examples are executable and cover edge cases.
```

## Anti-Patterns to Avoid with Examples

### Anti-Pattern 1: Contradictory Instructions

**❌ Bad**:
```markdown
Be concise in your response.
Explain each step in detail.
Limit yourself to 50 words maximum.
Provide complete examples for each point.
```

**Problem**: Contradiction between "concise", "detail", "50 words" and "complete examples"

**✅ Good**:
```markdown
Provide a structured response in 3 parts:
1. Summary (50 words max)
2. Detailed explanation (200-300 words)
3. Concrete examples (2-3 short examples)
```

### Anti-Pattern 2: Cognitive Overload

**❌ Bad**:
```markdown
Analyze this code by checking: security, performance, readability, tests, documentation,
architecture, patterns, SOLID, DRY, KISS, YAGNI, cyclomatic complexity, coupling,
cohesion, dependency injection, error handling, logging, monitoring, scalability,
maintainability, evolvability, reusability, and team standard compliance.
```

**Problem**: 20+ simultaneous criteria, impossible to process effectively

**✅ Good**:
```markdown
Analyze this code along 3 priority axes:
1. **Security**: OWASP Top 5 vulnerabilities
2. **Performance**: O(n) complexity and obvious optimizations
3. **Maintainability**: SOLID compliance and readability

For other aspects (tests, docs, etc.), mention only critical issues.
```

### Anti-Pattern 3: Semantic Ambiguity

**❌ Bad**:
```markdown
Optimize this code to make it better.
```

**Problem**: "Optimize" can mean performance, readability, size, complexity... "Better" is subjective

**✅ Good**:
```markdown
Improve the performance of this code by reducing its time complexity:
- Objective: Move from O(n²) to O(n log n) or better
- Measure: Execution time on 10,000 elements < 100ms
- Maintain readability (no obscure micro-optimizations)
```

## Prompt Optimization Workflows

### Workflow 1: Test-Refine-Iterate

**Steps**:
1. **Initial version**: Basic prompt with a clear objective
2. **Test**: Run on 3-5 representative use cases
3. **Failure analysis**: Identify ambiguities and incorrect outputs
4. **Refinement**: Add constraints, examples, clarifications
5. **Re-test**: Validate improvement
6. **Iteration**: Repeat 3-5 times until 90%+ success

**Practical example**:

**v1.0** (baseline):
```markdown
Create a unit test for this function.
```
→ Result: Generic tests, missing edge cases (40% quality)

**v1.1** (adding context):
```markdown
You are a QA engineer. Create a unit test for this function with nominal and edge cases.
```
→ Result: Better structured tests but inconsistent format (60% quality)

**v1.2** (adding constraints + format):
```markdown
You are a QA engineer using Jest.
Create unit tests for this function covering:
- 1 nominal case
- 2 edge cases (null, undefined, extreme values)
- 1 error case

Format: describe() with it() for each case.
```
→ Result: Complete and well-structured tests (90% quality) ✅

### Workflow 2: Checklist Validation

**Before using a prompt, check**:

- [ ] **Persona**: Role and expertise defined?
- [ ] **Objective**: Clear and measurable task?
- [ ] **Context**: Sufficient information?
- [ ] **Constraints**: Explicit limitations?
- [ ] **Format**: Output structure defined?
- [ ] **Examples**: At least 1 example provided?
- [ ] **Testability**: Clear success criteria?

**If 6+/7 ✅ → Prompt ready | If <6/7 → Improvement needed**

### Workflow 3: Progressive Disclosure

**Principle**: Decompose a complex prompt into progressive steps

**Monolithic prompt (difficult)**:
```markdown
Analyze this project, identify the issues, propose solutions, implement the fixes,
create the tests, and document everything.
```

**Progressive prompt (effective)**:
```markdown
**Phase 1**: Analyze the project and list the 5 critical issues with their impact.
[Wait for response]

**Phase 2**: For each issue, propose 2-3 solutions with advantages/disadvantages.
[Wait for response]

**Phase 3**: Implement the chosen solution for issue #1.
[Wait for response]

**Phase 4**: Create unit tests to validate the fix.
[Wait for response]

**Phase 5**: Document the changes and their justification.
```

**Benefit**: Control at each step, ability to adjust, better final quality

## Reusable Templates

### Template A: Code Review

```markdown
You are a senior [ROLE] doing a code review.

Code to review:
```[LANGUAGE]
[CODE]
```

Evaluation criteria:
1. [CRITERION 1]: [DESCRIPTION]
2. [CRITERION 2]: [DESCRIPTION]
3. [CRITERION 3]: [DESCRIPTION]

For each criterion, provide:
- ✅ Compliant points
- ⚠️ Suggested improvements (with code example)
- 🔴 Blocking issues (with complete fix)

Final score: X/10 with justification.
```

### Template B: Documentation Generation

```markdown
You are a technical writer creating [TYPE] documentation.

Element to document: [NAME]
Source: [LINK or CODE]

Expected structure:
## Title
[Description 1-2 sentences]

## Usage
```[LANGUAGE]
[Code example]
```

## Parameters
[Table: Name | Type | Description | Required]

## Return
[Type and description]

## Examples
### Nominal case
[Executable code]

### Error case
[Executable code]

## Notes
[Important remarks]
```

### Template C: Guided Refactoring

```markdown
You are a [ROLE] expert in clean code.

Code to refactor:
```[LANGUAGE]
[CODE]
```

Step-by-step process:
**Step 1**: Identify code smells (numbered list)
**Step 2**: Propose a target architecture (text diagram)
**Step 3**: Create the new functions/classes with signatures
**Step 4**: Implement the complete refactoring
**Step 5**: Verify that existing tests still pass

Constraints:
- Maintain API compatibility
- Respect [PRINCIPLES: SOLID/DRY/KISS]
- Improve testability

Explain each refactoring decision.
```

## Relations and Dependencies

**Theoretical reference**: [`/prompts/gen/concepts/guideline-prompts.md`](../concepts/guideline-prompts.md)

**See also**:
- AI-KIDO Hard Points: [`/prompts/hard_points/ai-kido.md`](../../hard_points/ai-kido.md) (Rule 11: Semantic density)
- AI-KIDO Personas: [`/prompts/gen/personas/`](../personas/) for examples of advanced system prompts

---

*This technique provides concrete and reusable methods for creating effective prompts. Use the templates and workflows according to your specific needs.*
