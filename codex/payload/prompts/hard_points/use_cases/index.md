# Hard Points - Use Cases

> **Status**: Hard Points - Immutable truths
> **Priority**: Absolute - Cannot be called into question

## Overview

This directory contains the **validated use cases** that have been promoted to Hard Points status in the AI-KIDO system. These use cases constitute immutable applications that have proven themselves and define the mandatory implementation standards.

## Promotion Rules

A use case becomes a Hard Point when:

1. **Operational Validation**: The use case has been tested successfully in real conditions
2. **Guaranteed Reproducibility**: Identical results across 10+ implementations
3. **Standard Reference**: Becomes the mandatory reference for similar situations
4. **Critical Impact**: Failure of the use case = system failure
5. **Business Consensus**: Validation by all concerned stakeholders

## Standard Format

Each Hard Point use case must follow the format:

```markdown
# Hard Point: [Use Case Name]
> Promoted on: YYYY-MM-DD | Validated by: [Authority] | Origin: [Reference gen/use_cases/]

## Frozen use case
[Immutable description of the use case]

## Mandatory scenario
[Steps that cannot be modified]

## Immutable success criteria
[Non-negotiable success conditions]

## Justification for immutability
[Why this use case cannot be modified]

## Impact and dependencies
[System elements that depend on this use case]

## References
[Links to the original truth tables]
```

## Available Hard Point Use Cases

*No use case has yet been promoted to Hard Point status.*

## Promotion Process

To promote a use case from [`../gen/use_cases/`](../../gen/use_cases/) to this directory:

1. Identify the candidate use case in `/gen/use_cases/`
2. Validate the promotion criteria (operational validation, reproducibility)
3. Create the Hard Point file with detailed justification
4. Update this index file
5. Reference from [`../index.md`](../index.md)

## Validation Criteria

### Operational Validation
- Tests in production environment
- Validation by end users
- Documented performance metrics

### Reproducibility
- Step-by-step documented procedures
- Tests across multiple environments
- Validation by independent teams

### Critical Impact
- System dependency analysis
- Failure risk assessment
- Documented continuity plan

## Candidate Use Case Types

- **Critical Integrations**: Essential system connections
- **Business Workflows**: Non-negotiable business processes
- **Security Procedures**: Mandatory security protocols
- **Architecture Patterns**: Standard implementation models

---

**REMINDER**: Hard Point use cases define the mandatory implementation standards in the AI-KIDO system.
