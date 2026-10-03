# Hard Points - Practical Techniques

> **Status**: Hard Points - Immutable truths
> **Priority**: Absolute - Cannot be questioned

## Overview

This directory contains the **validated practical methods** that have been promoted to Hard Point status in the AI‑KIDO system. These techniques constitute immutable approaches that have proven themselves and cannot be modified without explicit validation.

## Promotion Rules

A technique becomes a Hard Point when:

1. **Proven Effectiveness**: The technique has demonstrated its effectiveness in critical contexts
2. **Reproducibility**: Consistent results across 5+ different implementations
3. **Robustness**: Resistance to context and environment variations
4. **Critical Impact**: The technique is essential to system operation
5. **Field Validation**: Tested and approved under real conditions

## Standard Format

Each technical Hard Point must follow the format:

```markdown
# Hard Point: [Technique Name]
> Promoted on: YYYY-MM-DD | Validated by: [Authority] | Origin: [Reference gen/techniques/]

## Frozen technique
[Immutable description of the method]

## Mandatory procedure
[Steps that cannot be modified]

## Justification of immutability
[Why this technique cannot be modified]

## Impact and dependencies
[System elements that depend on this technique]

## References
[Links to the original truth tables]
```

## Available Technique Hard Points

- [`gestion-logs-aikido.md`](../gestion-logs-aikido.md) : **AI‑KIDO Log Management** - Strict rules for traceability, automatic mode switching, log location and format

## Promotion Process

To promote a technique from [`../gen/techniques/`](../../gen/techniques/) to this directory:

1. Identify the candidate technique in `/gen/techniques/`
2. Validate the promotion criteria (effectiveness, reproducibility, robustness)
3. Create the Hard Point file with detailed justification
4. Update this index file
5. Reference from [`../index.md`](../index.md)

## Validation Criteria

### Measurable Effectiveness
- Documented performance metrics
- Comparison with existing alternatives
- Validation by domain experts

### Reproducibility
- Tests on multiple environments
- Complete documentation of prerequisites
- Standardized verification procedures

### Robustness
- Resistance tests to variations
- Error case handling
- Adaptability to system constraints

---

**REMINDER**: Technical Hard Points have absolute priority and define the mandatory methods of the AI‑KIDO system.
