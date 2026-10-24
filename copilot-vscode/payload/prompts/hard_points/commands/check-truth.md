---
description: "Verify coherence between AI-KIDO documentation and source code, detect obsolescence, and propose automatic remediation"
---

# /check-truth

**Purpose**: Verify coherence between the AI-KIDO Memory Bank documentation and project source code, detect obsolescence and conflicts, and propose automatic remediation with maximum optimization (AI-KIDO agents + fast-path via last-check).

---

## Usage

```bash
/check-truth
/check-truth --file /prompts/gen/concepts/oauth.md
/check-truth --domain concepts
/check-truth --search "authentication"
/check-truth --code-path ./src/auth/
/check-truth --force-check
/check-truth --dry-run
/check-truth --verbose
```

## Prerequisites

| Argument | Description | Example |
|----------|-------------|---------|
| `--file <path>` | Single file to verify | `--file /prompts/gen/concepts/oauth.md` |
| `--domain <domain>` | Memory Bank domain | `--domain concepts`, `--domain techniques` |
| `--search <keyword>` | Keyword search | `--search "authentication"` |
| `--code-path <path>` | Code path to analyze | `--code-path ./src/auth/` |
| `--verbose` | Detailed output | - |
| `--dry-run` | Simulation without modifications | - |
| `--force-check` | Force validation (ignore fast-path) | - |

> **Warning**: Major conflicts cause LLM response incoherence. Prioritize immediate remediation of ❌ items.

## Steps

### Phase 0: Scope Detection

Analyze arguments to determine scope:

```
SCOPE DETECTION

Arguments:
- --file       : [PATH or NONE]
- --domain     : [DOMAIN or NONE]
- --search     : [KEYWORD or NONE]
- --code-path  : [PATH or NONE]

Scope: [SINGLE_FILE | DOMAIN | SEARCH | CODE_ANALYSIS | FULL_BANK]
Mode: [NORMAL | VERBOSE | DRY_RUN]
Force check: [YES | NO]
```

Scope determination:
- `--file` → SINGLE_FILE
- `--domain` → DOMAIN
- `--search` → SEARCH
- `--code-path` without `--file/--domain` → CODE_ANALYSIS
- No argument → FULL_BANK

---

### Phase 1: Targeted Inventory (agent-aikido-explore-bank)

Invoke `agent-aikido-explore-bank` in QUICK mode:

```
FORMAT: JSON

Targeted inventory for check-truth with scope [SCOPE].

Scope [SINGLE_FILE]:
- File: [PATH]
- Extract: Header metadata (last-check, truth source, source refs)
- Identify: Referenced source files (code paths)
- Return: Metadata + source files list

Scope [DOMAIN]:
- Domain: /prompts/gen/[DOMAIN]/
- Scan: All .md files (except index.md)
- Extract: Headers with last-check metadata
- Identify: Documents with/without truth source
- Return: File list with metadata

Scope [SEARCH]:
- Keyword: [KEYWORD]
- Search in: /prompts/gen/ (concepts, techniques, use_cases)
- Filter: Files containing keyword
- Extract: Headers with metadata
- Return: Matched files with metadata

Scope [CODE_ANALYSIS]:
- Code path: [PATH]
- Scan: Code files (*.ts, *.js, *.py, etc.)
- Identify: Main modules/functions
- Search: Corresponding Memory Bank documentation
- Return: Code files + associated doc files (or MISSING)

Scope [FULL_BANK]:
- Scan: Entire Memory Bank /prompts/gen/
- Extract: All headers with last-check metadata
- Classify: [✅ Up-to-date | ⚠️ Review | ❌ Outdated | New No metadata]
- Return: Complete inventory by status

For each file, return:
- Path
- Header metadata (version, date, truth source, last-check, source refs)
- Check status (✅|⚠️|❌|New)
- Last check date (if exists)
- Source refs modification dates (if available)
```

Display in real time:
```
TARGETED INVENTORY (agent-aikido-explore-bank QUICK)...

Scope: [SCOPE]
Files detected: [COUNT]

Classification:
✅ Up-to-date     : [COUNT] (fast-path eligible)
⚠️ Review needed  : [COUNT] (requires validation)
❌ Outdated       : [COUNT] (requires immediate check)
New No metadata   : [COUNT] (first-time validation)

Tokens used: [X]k
```

---

### Phase 2: Fast-Path Optimization (agent-aikido-doc-header)

For each ✅ Up-to-date file, verify fast-path eligibility:

```
FAST-PATH CHECK (agent-aikido-doc-header)

File: [PATH]
Last check: [DATE]
Check status: ✅ Up-to-date
Source refs: [LIST]

Verification:
1. Check --force-check flag: [YES → SKIP FAST-PATH | NO → CONTINUE]
2. For each source ref in header:
   - Extract current modification date via stat
   - Compare with recorded date in header
   - Status: [UNCHANGED | MODIFIED]
3. Check staleness: (today - last_check) days
   - If > 90 days → FLAG STALE
   - Else → FRESH

Decision:
- All sources UNCHANGED + FRESH + no --force-check → SKIP VALIDATION (save ~2k tokens)
- Any source MODIFIED OR STALE OR --force-check → REQUIRES VALIDATION

Fast-path eligible: [X] files
Validation required: [Y] files
Tokens saved: ~[X * 2k] tokens
```

Files to validate:
- ⚠️ Review needed (all)
- ❌ Outdated (all)
- New No metadata (all)
- ✅ Up-to-date with modified or stale sources (filtered)

Display:
```
FAST-PATH OPTIMIZATION

Eligible for skip: [X] files (✅ + unchanged sources + fresh)
To validate: [Y] files
Estimated token savings: ~[Z]k tokens
```

---

### Phase 3: Truth Source Validation (agent-aikido-truth-evaluator)

For each file requiring validation, invoke truth-evaluator:

```
FORMAT: JSON

Validate coherence between documentation and sources for file [PATH].

Context:
- File: [PATH]
- Type: [concept|technique|use_case]
- Declared truth source: [Code|Spec|Dual|Config|Tests]
- Last check: [DATE or NEVER]
- Source refs: [LIST]

Validation mode:
1. Check header metadata first (Phase 0 of truth-evaluator):
   - If last-check exists + ✅ + sources unchanged → ALREADY DONE

2. Full validation (file is in validation required list):
   - Read the document
   - Read referenced sources (code, specs, config, tests)
   - Classify scenario: [NEW_FEATURE|BUG_FIX|MAINTENANCE|DOCUMENTATION|etc.]
   - Evaluate coherence:
     * Does documentation correctly describe the implementation?
     * Are there spec ↔ code contradictions?
     * Has code evolved since last validation?
     * Is the documentation obsolete?
   - Detect conflicts
   - Score reliability (95% = perfect, <70% = problem)

3. Generate ranking:
   - Primary authority (95%+)
   - Supporting sources (75%+)
   - Reference (50-75%)
   - Deprecated (<50%)

4. Output:
   - Status: [✅ COHERENT | ⚠️ MINOR_DRIFT | ❌ MAJOR_CONFLICT]
   - Confidence: [XX%]
   - Issues: [LIST]
   - Recommendations: [LIST]
   - New check status: [✅|⚠️|❌]

Return structured report per file.
```

Display in real time:
```
TRUTH SOURCE VALIDATION (agent-aikido-truth-evaluator)...

Files to validate: [Y]

[1/Y] /prompts/gen/concepts/oauth.md
  - Status: ⚠️ MINOR_DRIFT
  - Issue: Implementation uses PKCE, doc doesn't mention it
  - Confidence: 85%
  - Recommendation: UPDATE doc to mention PKCE

[2/Y] /prompts/gen/techniques/jwt-impl.md
  - Status: ✅ COHERENT
  - Confidence: 95%
  - No action required

Summary:
✅ Coherent       : [X] files
⚠️ Minor drift    : [Y] files (requires update)
❌ Major conflict  : [Z] files (requires immediate attention)
```

---

### Phase 4: Gaps Analysis (agent-aikido-explore-bank + truth-evaluator)

If scope includes CODE_ANALYSIS, detect missing documentation:

```
FORMAT: JSON

Step 4.1: Code exploration (agent-aikido-explore-bank)
- Code path: [PATH]
- Scan: Main modules/classes/functions
- Extract: Signatures, docstrings, comments
- Identify: Critical elements requiring documentation
- Return: Code elements list

Step 4.2: Existing doc search (agent-aikido-explore-bank)
- For each code element:
  * Search Memory Bank via keywords
  * Match with existing concepts/techniques
  * Status: [DOCUMENTED | PARTIAL | MISSING]
- Return: Gaps list

Step 4.3: Priority evaluation (agent-aikido-truth-evaluator)
- For each gap:
  * Evaluate criticality (public API = HIGH, internal = MEDIUM)
  * Evaluate complexity (simple = LOW, complex = HIGH)
  * Evaluate usage frequency (frequent = HIGH, rare = LOW)
  * Score priority: CRITICAL | HIGH | MEDIUM | LOW
- Return: Prioritized gaps list
```

Display:
```
GAPS ANALYSIS

Code path: [PATH]
Elements analyzed: [COUNT]

Documentation status:
✅ Documented : [X] elements
⚠️ Partial    : [Y] elements (exists but incomplete)
❌ Missing    : [Z] elements

Gaps by priority:
CRITICAL : [N] (public APIs, core features)
HIGH     : [N] (important features)
MEDIUM   : [N] (secondary features)
LOW      : [N] (internal utils)

Top 5 critical gaps:
1. [module/function] - [reason] - Priority: CRITICAL
2. [module/function] - [reason] - Priority: CRITICAL
```

---

### Phase 5: Header Update (agent-aikido-doc-header)

For all validated files, update headers:

```
FORMAT: JSON

Update headers for all validated files.

Validated files: [LIST with new status]

For each file:
1. Read current header
2. Update:
   - Last Check: [TODAY]
   - Checked By: agent-aikido-truth-evaluator
   - Check Status: [✅|⚠️|❌] (from validation result)
   - Source Refs: refresh modification dates (via stat)
3. Write updated header

Mode: BATCH (all files in a single invocation)
Estimated tokens: ~[200 * file_count] tokens
```

Display:
```
HEADER UPDATE (agent-aikido-doc-header)...

Headers to update: [X]

[1/X] /prompts/gen/concepts/oauth.md → ⚠️ Review needed (updated)
[2/X] /prompts/gen/techniques/jwt-impl.md → ✅ Up-to-date (updated)

✅ Headers updated: [X]
```

---

### Phase 6: Remediation Report

Compile the complete report:

```
CHECK-TRUTH REPORT

Scope: [SCOPE]
Date: [DATE TIME]
Mode: [NORMAL|VERBOSE|DRY_RUN]

## Executive Summary

Files analyzed: [TOTAL]
- Fast-path skip: [X] files (✅ + unchanged) → [Y]k tokens saved
- Validated: [Z] files

Global result:
- ✅ Coherent        : [X] files ([PERCENTAGE]%)
- ⚠️ Minor drift     : [Y] files ([PERCENTAGE]%)
- ❌ Major conflict   : [Z] files ([PERCENTAGE]%)
- New No prior check : [N] files

Performance:
- Tokens used: [TOTAL]k
- Tokens saved (fast-path): [SAVED]k
- Efficiency: [PERCENTAGE]% optimization

## Details by File

### ✅ Coherent Files ([X])

| File | Last Check | Truth Source | Confidence |
|------|------------|--------------|------------|
| [path] | [date] | Code | 95% |

### ⚠️ Minor Drifts ([Y])

| File | Issue | Recommendation | Priority |
|------|-------|----------------|----------|
| [path] | [description] | UPDATE [section] | MEDIUM |

### ❌ Major Conflicts ([Z])

| File | Conflict | Truth Source | Action Required |
|------|----------|--------------|-----------------|
| [path] | [description] | Code (vs doc) | REWRITE [section] |

### Missing Documentation (if CODE_ANALYSIS)

| Code Element | Type | Priority | Suggested Location |
|--------------|------|----------|-------------------|
| [module/function] | [concept/technique] | CRITICAL | /prompts/gen/[type]/[name].md |

## Recommended Actions

IMMEDIATE (Major Conflicts):
1. ❌ Fix [file]: [action description]
2. ❌ Rewrite [file]: [action description]

PRIORITY (Drifts + Critical Gaps):
1. ⚠️ Update [file]: [action description]
2. New Create documentation for [code element]: [action description]

MAINTENANCE (Non-Critical Gaps):
1. Document [code element]: [action description]

## Auto-Remediation Proposal

Choose an option:

Option 1: REMEDIATE ALL (⚠️ + ❌)
- Update [Y] files with minor drifts
- Rewrite [Z] files with major conflicts
- Invoke agent-aikido-bank-populate for critical gaps

Option 2: REMEDIATE MAJOR CONFLICTS ONLY (❌)
- Rewrite [Z] files with major conflicts
- Leave minor drifts for manual review

Option 3: CREATE MISSING DOCUMENTATION (New)
- Analyze code in detail (via /analyse-project on [code-path])
- Invoke agent-aikido-bank-populate for all gaps
- Create [N] new documents

Option 4: REPORT ONLY
- No automatic action
- Report saved to /prompts/spec/check-truth-[DATE].md

Choice: [1|2|3|4]
```

---

### Phase 7: Auto-Remediation (if selected)

#### Options 1 or 2: Update Existing Files

For each file requiring correction:

```
REMEDIATION: [PATH]

Step 7.1: Detailed analysis
- Read complete document
- Read sources (code, specs, config)
- Identify obsolete/conflicting sections
- Extract correct information from sources

Step 7.2: Generate corrections
- For each problematic section:
  * Section: [NAME]
  * Issue: [DESCRIPTION]
  * Current content: [EXTRACT]
  * Truth source: [CODE/SPEC]
  * Corrected content: [NEW_CONTENT]

Step 7.3: Apply corrections
- Use Edit tool for each section
- Preserve global document structure
- Update frontmatter (date, version++)
- Add revision note if major

Step 7.4: Post-correction validation (agent-aikido-validator)
- Verify AI-KIDO compliance (<=500 lines, frontmatter, links)
- If violations → correct
- Return: [VALID | CORRECTED]

Step 7.5: Update header (agent-aikido-doc-header)
- Last Check: [TODAY]
- Check Status: ✅ Up-to-date
- Source Refs: [refresh dates]
```

#### Option 3: Create Missing Documentation (agent-aikido-bank-populate)

Invoke `agent-aikido-bank-populate` at END with gaps list:

```
FORMAT: JSON

Populate Memory Bank for missing documentation detected.

Detected gaps (from Phase 4):
[PRIORITIZED_GAPS_LIST]

For each priority gap:
1. Code element: [module/function]
2. Code path: [path:lines]
3. Suggested type: [concept|technique]
4. Priority: [CRITICAL|HIGH|MEDIUM]
5. Context: [extracted from code]

Standard bank-populate workflow:
- Phase 1: Validate gaps (already done)
- Phase 2: Collect info (from code)
- Phase 3: Truth evaluation (scenario = DOCUMENTATION)
- Phase 4: Classification (via raci-delegator)
- Phase 5: Expert delegation or direct write
- Phase 6: Validation (agent-aikido-validator)
- Phase 7: Integration (with doc-header creation)
- Phase 8: Reporting

Return complete document creation report.
```

---

### Phase 8: Final Report and Save

Generate final report in `/prompts/spec/check-truth-[DATE].md`:

```
# Check-Truth Report - [DATE]

> Version: 1.0 | Date: [DATE TIME] | Status: Check-Truth Report

## Execution Metadata

Command: /check-truth [ARGUMENTS]
Scope: [SCOPE]
Mode: [NORMAL|VERBOSE|DRY_RUN]
Force check: [YES|NO]

## Performance Statistics

Files analyzed: [TOTAL]
- Fast-path skip: [X] ([PERCENTAGE]%)
- Validated: [Y] ([PERCENTAGE]%)
- New (no metadata): [Z]

Tokens:
- Used: [TOTAL]k
- Saved (fast-path): [SAVED]k
- Efficiency: [PERCENTAGE]% optimization

Execution time: [DURATION]

## Validation Results

### Status Distribution

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Coherent | [X] | [PERCENTAGE]% |
| ⚠️ Minor drift | [Y] | [PERCENTAGE]% |
| ❌ Major conflict | [Z] | [PERCENTAGE]% |
| New No prior check | [N] | [PERCENTAGE]% |

### Full Details

[Include detailed tables from Phase 6]

## Actions Performed (if auto-remediation)

Option chosen: [OPTION]

### Updated Files

| File | Action | Status | Details |
|------|--------|--------|---------|
| [path] | UPDATE [section] | ✅ Success | [details] |

### Created Documents

| File | Type | Truth Source | Status |
|------|------|--------------|--------|
| [path] | Concept | Code | ✅ Created |

## Post-Check Recommendations

Continuous maintenance:
1. Run `/check-truth` after each sprint/release
2. Run `/check-truth --code-path [PATH]` after major refactoring
3. Run `/check-truth --domain [DOMAIN]` monthly

Suggested improvements:
1. [Suggestion based on detected patterns]

Next verifications:
- [Domain/file] in [X] days (if drift detected)
- [Domain/file] in [Y] days (regular maintenance)

---
*Report generated automatically by check-truth on [DATE TIME]*
```

Display:
```
REPORT SAVED

File: /prompts/spec/check-truth-[DATE].md
Size: [X] lines
```

## Output

### Success - Full Check

```
CHECK-TRUTH COMPLETED SUCCESSFULLY

Scope: [SCOPE]
Files analyzed: [TOTAL]

Results:
✅ Coherent       : [X] files ([PERCENTAGE]%)
⚠️ Minor drift    : [Y] files ([PERCENTAGE]%)
❌ Major conflict  : [Z] files ([PERCENTAGE]%)

Performance:
Tokens saved (fast-path): [SAVED]k
Efficiency: [PERCENTAGE]% optimization
Duration: [DURATION]

Actions performed:
[List if auto-remediation selected]

Detailed report: /prompts/spec/check-truth-[DATE].md
```

### Success - Full Fast-Path

```
CHECK-TRUTH ULTRA-FAST

Scope: [SCOPE]
Files analyzed: [TOTAL]

Result: ✅ 100% UP-TO-DATE
- All files are up to date
- All sources unchanged since last-check
- No validation required

Performance:
Tokens saved: [SAVED]k (~80% optimization)
Duration: < 10 seconds

Memory Bank perfectly synchronized with code.
```

### Warning - Major Conflicts

```
MAJOR CONFLICTS DETECTED

Files requiring immediate attention:

❌ [X] major conflicts:
1. [file] - [short description]
2. [file] - [short description]

Recommendations:
- Option 1: Launch auto-remediation (/check-truth [args] with choice 1)
- Option 2: Manual review of listed files
- Option 3: Consult detailed report: /prompts/spec/check-truth-[DATE].md
```

## Notes

### AI-KIDO Agents Used

| Phase | Agent | Role | Tokens |
|-------|-------|------|--------|
| 1 | `agent-aikido-explore-bank` (QUICK) | Targeted inventory by scope | 1k-5k |
| 2 | `agent-aikido-doc-header` | Fast-path eligibility check | ~200/file |
| 3 | `agent-aikido-truth-evaluator` | Coherence validation | ~2k/file |
| 4 | `agent-aikido-explore-bank` + `truth-evaluator` | Gaps detection | variable |
| 5 | `agent-aikido-doc-header` (batch) | Header update | ~200/file |
| 7 | `agent-aikido-bank-populate` (optional) | Create missing docs | variable |
| 7 | `agent-aikido-validator` | Post-correction compliance | ~500/file |

### Optimization Gains

| Aspect | Without optimization | With agents + fast-path | Gain |
|--------|---------------------|------------------------|------|
| Inventory | Manual read all files | explore-bank targeted | ~60% tokens |
| Validation | All files re-verified | Fast-path skip if ✅ | ~70-80% tokens |
| Gaps detection | Manual code review | Automatic (explore+truth) | ~90% time |
| Header update | File by file | Batch update | ~50% tokens |
| Doc creation | Manual | bank-populate orchestrated | ~80% time |
| TOTAL WORKFLOW | ~100k tokens | ~20-30k tokens | 70-80% efficiency |

### Error Handling

- **File not found**: Skip with warning, continue other files
- **Inaccessible source ref**: Mark as "(unavailable)" in report, flag for review
- **Validation failed**: Mark as ❌ with detailed error, propose manual correction
- **Agent timeout**: Retry once, then fallback to degraded mode (without agent)
- **Permission denied**: List inaccessible files in report, suggest permission fix

### Integration with Other Commands

- `/analyse-project`: Analyze code to populate Memory Bank (complementary)
- `/maj-aikido`: Update after rebase (run check-truth after for coherence)
- `/analyse-aikido`: Full AI-KIDO audit (check-truth for code truth)
- `/check-claude`: CLAUDE.md synchronization (check-truth for content)

Recommended workflow:
1. Feature development → code modifications
2. `/check-truth --code-path [PATH]` → verify doc coherence
3. Auto-remediation if needed
4. `/analyse-aikido` → compliance audit
5. `/check-claude` → interface synchronization
