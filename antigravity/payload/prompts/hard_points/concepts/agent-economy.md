# Hard Point: Agent Economy

> Promoted on: 2026-11-18 | Validated by: AI-KIDO Architect | Origin: project decision

**Navigation**: [Concepts](index.md) · [AI-KIDO guide](../ai-kido.md) · [Code Economy](code-economy.md) · [Swarm and reuse](../system/orchestrator/swarm.md)

## Frozen concept

Tokens, attempts and delegations are budgets. Spend them on new evidence, and never
turn missing evidence into a conclusion.

### 1. Failure is not absence

A failed, denied, truncated or unparsable tool call proves nothing about the data it
targeted. Report the result as **not verified**, with the cause. Claim "none", "empty"
or "passing" only from a call that succeeded over the whole requested scope.

### 2. Every retry needs a new reason

Never repeat an identical failed call unless the failure is transient or its cause has
changed. Read the error, then change the hypothesis, input or route. After two failures
with the same cause, stop and report the cause, the attempts and the decision needed.

### 3. Tool output contract

Tools built or maintained under AI-KIDO return:

| Aspect | Requirement |
|---|---|
| Encoding | Minified JSON, each value sent once |
| Lists | Summary fields, a default bound, and the total or a continuation |
| Detail | Whole objects only through an explicit identifier or option |
| Writes | Identifier, resulting state and revision |
| Errors | Stable cause and the next useful action; never empty or generic output |
| Limits | An exceeded limit is reported explicitly, never silently dropped |

### 4. Targeted context

Search before reading. Read relevant ranges, and whole files only when the task needs
them. Do not reload unchanged content. Filter long command output to the signal needed.

### 5. Bounded delegation

Each delegation states the objective, scope, expected output format and effort limit.
The worker returns a synthesis with verifiable references (paths, lines, commands and
results), never raw logs or full file contents.

## Justification of immutability

Each rule removes a recurring waste: false conclusions, blind retries, oversized tool
results, repeated reads and unbounded workers.

## Impact and dependencies

Applies to all agents, personas, skills, commands and tools. Delegation also follows
[Swarm and reuse](../system/orchestrator/swarm.md).

## References

- [Code Economy](code-economy.md) — economy of produced code
- [Scope-first Search Rule](../system/search/scope-first.md) — exploratory search scope
