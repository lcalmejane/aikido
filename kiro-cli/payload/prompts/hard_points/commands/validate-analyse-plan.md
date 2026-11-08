---
name: validate-analyse-plan
description: "Validate the structure and coherence of an analysis plan against /analyse-project requirements"
globs: prompts/hard_points/system/analyse/plans/**/*.md
---

# /validate-analyse-plan

Validate an analysis plan against the documented template in
`prompts/hard_points/system/analyse/plans/README.md` and
`prompts/hard_points/commands/analyse-project.md`. Requires Node.js 24+.

## Workflow

1. From the project root, list plans with
   `node prompts/hard_points/system/plan-validation/validate.mjs analyse list`.
   Ask the user to select a listed relative path or provide a custom path.
2. Run `node prompts/hard_points/system/plan-validation/validate.mjs analyse validate "PLAN_PATH" --report`.
   Pass the selected path as one argument; never evaluate plan text as shell
   code. A relative name is resolved under the analysis plans directory;
   `prompts/...` is relative to the project root. `--report` creates a new,
   timestamped Markdown report under `prompts/spec/` without overwriting one;
   omit it to print only.
3. Optionally ask whether to test an explicitly selected project scope. If so,
   append `--project "PROJECT_PATH"`. The test only counts files matching
   literal extensions extracted from the sources section, skips symlinks and
   standard generated/vendor directories. Git evaluates project `.gitignore`
   files, including nested rules and negations; Git is required and failures
   abort the test. Arbitrary plan-specific exclusions are not applied, and the
   test does not execute plan code.
   Report the chosen scope and exclusions.
4. Present the report, blocking errors, warnings and concrete recommendations.
   Offer complementary `agent-aikido-validator` review if requested, including
   AI-KIDO rules, links and overall coherence.
5. Validation never creates or changes a private task plan. If the user wants
   task tracking, offer `/aikido-import-plan` separately; it preserves the
   source and requires explicit approval for both creation and instantiation.

## Criteria and limitations

Blocking: valid Version/Date/Type/Nature/Depth; nonempty Overview, Selection
Criteria, Sources, Agents, Extraction Strategy, Full Workflow and Output Format;
nature/depth/context and source code/documentation/configuration mentioned;
explore-code and validator plus specialized prompts; Mermaid workflow and
Markdown output example. Other checks (nature/path, depth filename, exclusions,
metadata, diagram styles and output categories) are warnings. Both French
`survol`/`approfondi` and English `overview`/`deep` depth filenames are
recognized, as are `Profondeur` and `Complete Workflow` in existing plans;
generic Nature need not match a path or include a number.

Headings inside fenced examples are ignored. Checks are textual heuristics,
not proof that prompts, links, README compatibility, execution phases,
metadata, diagrams or analysis results are semantically correct. Source
directories and detection patterns are not executed or verified by the
optional file-count test. Apply the
[scope-first rule](../system/search/scope-first.md).

The score is the percentage of individual checks passed; warnings reduce it,
and any blocking failure makes the result non-compliant. Exit codes: 0 no
blocking errors, 1 blocking errors, 2 invocation or I/O error. Identical inputs
produce identical report content; the saved filename contains the current time.
