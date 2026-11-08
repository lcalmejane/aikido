---
name: validate-search-plan
description: "Validate the structure and coherence of a code search plan against agent-aikido-explore-code requirements"
globs: prompts/hard_points/system/search/plans/**/*.md
---

# /validate-search-plan

Validate a search plan without modifying it. Reference:
`prompts/hard_points/system/search/plans/README.md` and
`prompts/hard_points/agents/agent-aikido-explore-code.md`. Requires Node.js 24+.

## Workflow

1. From the project root, list plans with
   `node prompts/hard_points/system/plan-validation/validate.mjs search list`.
   Ask the user to select a listed relative path or provide a custom path.
2. Run `node prompts/hard_points/system/plan-validation/validate.mjs search validate "PLAN_PATH"`.
   Replace the quoted argument with the selected path as one argument; never
   evaluate plan content as shell code. A relative name is resolved under the
   search plans directory; `prompts/...` is relative to the project root.
3. Optionally ask whether to test an explicitly selected project scope. If so,
   add `--project "PROJECT_PATH"`. This counts files with literal extensions
   extracted from the plan; Git evaluates project `.gitignore` files, including
   nested rules and negations. Git is required; failures abort the test. It
   additionally skips symlinks and fixed generated/vendor directories, not
   arbitrary plan-specific exclusions. It does not execute patterns or resolve imports. Explain the
   scope, exclusions and limitations in the result.
4. Present the Markdown report, critical errors, warnings and actionable
   recommendations. Do not assert production readiness from a score alone.
5. Validation never creates or changes a private task plan. If the user wants
   task tracking, offer `/aikido-import-plan` separately; it preserves the
   source and requires explicit approval for both creation and instantiation.

## Criteria and limitations

Blocking: valid Version/Date/Type; file patterns with extensions; identifiable
search method; imports and declarations regex examples; output section with a
fenced example. Overview, language, exclusions, extension strategy, context,
performance, usage example, output categories and line numbers are checked as
recommendations. The generic fallback may omit Language.

The engine parses Markdown headings outside fenced blocks. Use
`regex javascript` (also `js` or `ecmascript`) to declare JavaScript: invalid
JavaScript syntax is blocking. For undeclared or other dialects, JavaScript
syntax compatibility or incompatibility is reported as a warning, with actual
dialect validity unknown; it is not proof of validity or invalidity. An
explicit `regex pcre` or `regex pcre2` uses `pcre2grep` if available; invalid
PCRE2 is blocking and missing or failed tooling produces an unknown warning.
It cannot prove capture groups, semantics, agent execution,
README/agent compatibility, import resolution, or whether
the examples are safe to run. Review these manually. It does not require
specific global find/grep examples: apply the
[scope-first rule](../system/search/scope-first.md) instead.

The score is the percentage of individual checks passed; warnings reduce it,
and any blocking failure makes the result non-compliant. Exit codes: 0 no
blocking errors, 1 blocking errors, 2 invocation or I/O error. Results are
deterministic for identical inputs; optional counts reflect the chosen project.
