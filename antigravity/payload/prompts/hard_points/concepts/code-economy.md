# Hard Point: Code Economy

> Promoted on: 2026-11-18 | Validated by: AI-KIDO Architect | Origin: project decision

**Navigation**: [Concepts](index.md) · [AI-KIDO guide](../ai-kido.md) · [/aikido-review](../commands/aikido-review.md) · [Agent Economy](agent-economy.md)

## Frozen concept

Every line produced is context to reload, behavior to test and risk to carry.
Semantic density therefore applies to code as it does to the Memory Bank:
**deliver the complete result with the fewest new concepts.**

### 1. Map the impact before editing

List what the change reaches: callers, exports, tests, fixtures, configuration,
documentation and persisted data. This list is the required scope. Anything
beyond it needs a request from the user.

### 2. Choose the cheapest sufficient route

Stop at the first route that meets the whole need:

| Order | Route | Keep it when |
|---|---|---|
| 1 | No code | Removing, configuring or reusing a behavior meets the need |
| 2 | Project asset | A module, component or convention already covers it |
| 3 | Language or platform | The runtime offers it and the project has no own equivalent |
| 4 | Installed dependency | A current dependency covers it |
| 5 | New local code | Only the missing behavior is written |
| 6 | New dependency | Its value clearly exceeds its upkeep; version checked first |

Unrequested options, extension points and single-use abstractions stay out. Mention
a valuable omission in one line rather than building it.

### 3. Fix causes once

Before fixing a defect, search all users of the faulty code. Correct the shared
cause, and treat comparable cases alike rather than patching the reported example.

### 4. Protected quality

Economy never removes: requested behavior, trust-boundary validation, security,
data-loss protection, accessibility, or the updates that the impact map requires.
Non-trivial logic ships with the least costly proof that would fail if it broke.

### 5. Honest closure

The final report states what was verified, and what was left out or not checked
when this can change the reader's decision.

## Justification of immutability

Less generated code lowers token cost, review effort and defect surface on every
later interaction. The protected list prevents economy from becoming incompleteness.

## Impact and dependencies

Applies to all agents and personas that produce or review code. Reviews follow
[/aikido-review](../commands/aikido-review.md).

## References

- [AI-KIDO guide](../ai-kido.md) — semantic density
- [Refactoring skill](../system/refactoring/SKILL.md) — cheapest deterministic route for mass edits
