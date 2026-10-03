---
version: "1.0"
date: "2025-12-09"
type: "concept"
category: "prompts"
truth_source: "AI-KIDO Memory Bank - Concepts"
last_check:
  date: "2025-12-09"
  status: "✅"
  validator: "agent-aikido-doc-header"
  sources_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  notes: "Header created according to AI-KIDO V1.3 standards"
cross_refs:
  technique: "../techniques/guideline-prompts.md"
  hard_points: "../../hard_points/ai-kido.md"
source_refs:
  - type: "internal"
    path: "/prompts/gen/techniques/guideline-prompts.md"
    relation: "implementation"
  - type: "rule"
    path: "/prompts/hard_points/ai-kido.md"
    section: "Rule 11"
    topic: "Semantic density"
tags: ["guidelines", "prompts", "best-practices", "llm-optimization"]
---

# Guidelines for Creating Effective Prompts

## Fundamental Principles

### 1. Clarity and Precision
- **Defined objective**: Each prompt must have a clear and measurable objective
- **Explicit instructions**: Avoid ambiguity, use precise language
- **Sufficient context**: Provide all information necessary for understanding

### 2. Structure and Organization
- **Prioritization**: Organize information in order of importance
- **Distinct sections**: Separate different types of instructions (role, task, constraints)
- **Consistent format**: Use a reproducible and logical structure

### 3. Role Specificity
- **Defined persona**: Assign a specific role with appropriate expertise
- **Explicit skills**: Detail the expected knowledge and capabilities
- **Clear perspective**: Define the point of view and approach to adopt

### 4. Constraints and Limits
- **Defined scope**: Clearly establish what is included and excluded
- **Explicit rules**: Specify technical, ethical, or methodological constraints
- **Guardrails**: Integrate validation and control mechanisms

### 5. Examples and Illustrations
- **Concrete cases**: Provide representative examples of the expected result
- **Counter-examples**: Show what to avoid
- **Output formats**: Illustrate the expected structure of responses

## Best Practices

### Formulating Instructions
- Use the imperative for actions to perform
- Avoid multiple negations that create confusion
- Favor short and direct sentences
- Use technical vocabulary appropriate to the domain

### Context Management
- Provide the necessary context without information overload
- Reference relevant sources and standards
- Maintain consistency with previous instructions
- Adapt the level of detail to the target audience

### Validation and Iteration
- Test the prompt with varied use cases
- Measure the quality and consistency of responses
- Iterate based on results obtained
- Document versions and improvements

## Recommended Structure

```markdown
# [Prompt Title]

## Role and Expertise
[Definition of the persona and their skills]

## Objective
[Clear description of the task to accomplish]

## Context
[Necessary background information]

## Specific Instructions
[Detailed steps and methodology]

## Constraints
[Limitations and rules to follow]

## Output Format
[Expected structure of the response]

## Examples
[Concrete illustrations]
```

## Quality Criteria

### Effectiveness
- Does the prompt produce results consistent with expectations?
- Is the quality consistent across different executions?
- Is the processing time optimal?

### Robustness
- Does the prompt work with varied inputs?
- Does it correctly handle edge cases?
- Does it resist bypass attempts?

### Maintainability
- Is the prompt easy to understand and modify?
- Is the documentation sufficient?
- Are dependencies clearly identified?

## Anti-Patterns to Avoid

### Contradictory Instructions
- Avoid directives that contradict each other
- Check consistency between different sections
- Clearly prioritize in case of potential conflict

### Cognitive Overload
- Do not bury the essential in details
- Avoid overly long lists of instructions
- Structure information hierarchically

### Semantic Ambiguity
- Avoid polysemous terms without definition
- Clarify acronyms and technical jargon
- Use precise references rather than approximations

## Evaluation Metrics

### Quantitative
- Success rate on defined test cases
- Average response time
- Output consistency (variance)

### Qualitative
- Relevance of generated content
- Compliance with specified constraints
- Alignment with business objectives

## Relations and Dependencies

**Associated practical technique**: [`/prompts/gen/techniques/guideline-prompts.md`](../techniques/guideline-prompts.md)
- Formulation patterns with concrete examples
- Step-by-step optimization workflows
- Reusable templates for code review, documentation, refactoring

**See also**:
- AI-KIDO Hard Points: [`/prompts/hard_points/ai-kido.md`](../../hard_points/ai-kido.md) (Rule 11: Semantic density)

---

*These guidelines constitute a reference framework for creating effective prompts, adaptable to specific usage contexts.*
