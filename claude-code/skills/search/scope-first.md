# Scope-first Search Rule

This rule applies to exploratory searches of project code and the Memory Bank,
whether performed by an agent, an index/fast path, native tools, or Kimono.

## Required sequence

1. **Establish scope before exploration.** Where possible, list the relevant
   directories first. State the requested/selected paths and file types, plus
   each exclusion and its reason. Preserve the scope the user requested; do not
   silently narrow it.
2. **Search deliberately.** Only after establishing scope, use host-native
   Glob/Grep/Read tool calls or the Node search engine for exploratory
   discovery, globs (including `*.type`), regexes, and content searches. These
   are tool/API operations, never shell commands or shell pipelines. Start with
   the justified scope and widen it progressively when results are insufficient;
   explain each widening.
3. **Respect the request and evidence.** Do not evade requested paths or ignore
   code/files that may be relevant without evidence. If access, permissions,
   tool limits, budgets, or incomplete indexing prevent full coverage, report
   the limitation and partial coverage instead of claiming an exhaustive
   result.
4. **Report coverage.** State the areas searched, justified exclusions,
   progressive expansions, and unresolved limitations. Distinguish “no
   matches” from “not searched / not indexed.”

Reading a **known exact file** requested by the user or already identified in
context does not require exploratory directory listing and must not be blocked by
this rule. A fast path (for example, a known-name lookup or project index) may
answer a genuinely narrow location request, but does not bypass the requested
scope or justify dropping relevant areas from a broader task.

## Optional retrieval tools

RTK may be used only when its flag is ON and its availability and permissions
are confirmed for the current executor. Use it only for eligible native
executable invocations with argument arrays, without a command interpreter or
shell pipeline. When exact structured output is needed, use RTK bypass mode or
the native executable directly; never parse filtered or compressed output as
JSON. Never prefix an API or MCP tool call with RTK, and do not infer or
fabricate an RTK inventory.

Kimono MCP is optional. Use it only when the current executor exposes the
required tools and permissions, and the verified provider corpus/root covers
the requested scope; apply the [Kimono capability gate](SKILL.md#kimono-capability-gate).
Otherwise, use permitted native tools or the Node search engine as fallback and
report any coverage limits. Never invent tools, availability, corpus coverage,
or results.
