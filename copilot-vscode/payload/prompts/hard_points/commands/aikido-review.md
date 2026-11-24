---
description: Review a change against evidence, reporting only reproducible findings without editing code.
---

# /aikido-review

Review the target named by the user: files, branch, commit or pull request. By
default use uncommitted changes, otherwise the latest commit. Apply
[Code Economy](../concepts/code-economy.md). This command reports and edits nothing.

## Method

1. Read the diff, then the surrounding flow: callers, callees, tests and contracts.
2. When a signature, output or behavior changes, search every consumer.
3. Infer the expected usage level from the project and state that assumption.
4. Examine, in priority order: **correctness, security and data, load, proof,
   performance, economy**.

## Evidence gate

Keep a finding only if all of these hold:

- A concrete input or situation leads to an identified wrong outcome.
- The cited lines were re-read and the scenario is reachable.
- "Unused" claims are backed by a search across code, tests, configuration and
  dynamic references.
- The proposed fix is the smallest one that removes the cause.

Style preferences and hypothetical concerns are not findings. A documented,
deliberate limit is a finding only once real usage exceeds it.

## Report

Number findings continuously so the user can select them, grouped as **Blocking**,
**Important** and **Minor** (omit empty groups). For each one give:

`N. Title (path:line)` — **Scenario**, **Impact**, **Fix**.

Finish with `Verdict`, then `Not verified` when a relevant check could not be run.
With no finding, state the verdict and what was examined.
