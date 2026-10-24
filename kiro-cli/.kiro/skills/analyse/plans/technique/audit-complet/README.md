# Technical Analysis Plan - Expert Full Audit

> **Path**: `prompts/hard_points/system/analyse/plans/technique/audit-complet/`  
> **Version**: 1.0 | **Date**: 2026-02-10 | **Type**: Analysis Plan

## 📋 Overview

This directory contains the **expert full technical analysis plan** for carrying out an in-depth multi-repository audit (frontend + backend).

### Available Files

| File | Description |
|------|-------------|
| [`plan-expert.md`](plan-expert.md) | Full analysis plan (~1200 lines) with strategies, agents, workflows |
| [`config-example.yml`](config-example.yml) | Example configuration file to adapt to your project |
| `README.md` | This file |

## 🎯 Goal

Carry out a **full technical audit** covering:
- 🏗️ Architecture & code
- 📦 Technical stack
- 🔗 Dependencies
- 🔒 Security
- ✅ Tests & quality
- ⚡ Performance
- 📊 Observability
- 🛠️ Maintainability

## 🚀 Quick Start

### 1. Copy and Adapt the Configuration

```bash
# Copy the example file
cp prompts/hard_points/system/analyse/plans/technique/audit-complet/config-example.yml ./config-audit.yml

# Edit the repository paths
nano config-audit.yml
# Change:
#   repositories.frontend.path: "./frontend"  ← Your frontend path
#   repositories.backend.path: "./backend"    ← Your backend path
```

### 2. Run the Audit

**Option A: With YAML configuration** (recommended)
```bash
/analyse-project --config=./config-audit.yml
```

**Option B: Interactive mode**
```bash
/analyse-project
# Then follow the prompts:
# - Nature: 6 (General technical stack)
# - Depth: 4 (Expert)
# - Paths: Provide frontend and backend
```

### 3. Read the Reports

Reports are generated in `./audits/`:
```
audits/
├── audit-synthese.md              # Executive summary (5 lines + prioritized table)
├── audit-frontend.md              # Frontend details (architecture, stack, security, perf...)
├── audit-backend.md               # Backend details (architecture, stack, security, perf...)
├── plan-action.md                 # Phased action plan (CRITICAL/IMPORTANT/RECOMMENDED)
└── vulnerabilites-cve.json        # JSON export of CVE vulnerabilities
```

## 📊 What the Plan Analyzes

### 1. Architecture & Code
- Module/package/component structure
- Architectural patterns (Layered, Hexagonal, Microservices)
- SOLID, DRY, separation of concerns
- Code smells (classes >300 lines, cyclomatic complexity >10)
- Code duplication

### 2. Technical Stack
- Framework versions (Angular, Spring Boot, React, etc.)
- EOL (End of Life) and support
- TypeScript configuration (strict mode, typing)
- Build configuration (Maven, Webpack, Vite)

### 3. Dependencies
- **CVE vulnerabilities**: npm audit, OWASP Dependency-Check
- Outdated libraries (>2 major versions behind)
- Unused or redundant dependencies

### 4. Security
- **Hardcoded secrets**: API keys, passwords, tokens
- **OWASP Top 10**: XSS, CSRF, SQL/NoSQL injection
- CORS configuration, security headers (CSP, HSTS)
- Sensitive data encryption

### 5. Tests & Quality
- Test coverage (unit, integration, e2e)
- Test quality (assertions, mocks)
- CI/CD (GitHub Actions, GitLab CI, Jenkins)
- Static analysis (SonarQube, ESLint)

### 6. Performance
- **Frontend**: Lazy loading, bundle size, OnPush change detection, RxJS memory leaks
- **Backend**: N+1 queries, cache (Redis, Caffeine), query optimizations
- Code splitting, dynamic imports

### 7. Observability
- Structured logging (JSON vs text)
- Monitoring and metrics (Prometheus, Grafana)
- Centralized error handling (Sentry, Rollbar)
- Distributed tracing (OpenTelemetry)

### 8. Maintainability
- Code documentation (JSDoc, JavaDoc)
- Internationalization i18n
- Accessibility WCAG 2.1 AA
- Responsive design

## 🤖 AI-KIDO Agents Used

| Agent | Phase | Role | Required |
|-------|-------|------|----------|
| [`agent-aikido-explore-code`](../../../../../../prompts/hard_points/agents/agent-aikido-explore-code.md) | 3.1 | Multi-repository source code scan | ✅ Yes |
| [`agent-aikido-explore-all`](../../../../../../prompts/hard_points/agents/agent-aikido-explore-all.md) | 3.2 | Parallel Memory Bank + Code search | ✅ Yes (depth ≥4) |
| [`agent-aikido-truth-evaluator`](../../../../../../prompts/hard_points/agents/agent-aikido-truth-evaluator.md) | Resolution | Resolution of doc vs code contradictions | If contradictions |
| [`agent-aikido-raci-delegator`](../../../../../../prompts/hard_points/agents/agent-aikido-raci-delegator.md) | Classification | Document classification by domain | If RACI enabled |
| [`agent-aikido-bank-populate`](../../../../../../prompts/hard_points/agents/agent-aikido-bank-populate.md) | Population | Automatic population of detected gaps | If gaps >3 |
| [`agent-aikido-validator`](../../../../../../prompts/hard_points/agents/agent-aikido-validator.md) | Validation | AI-KIDO compliance validation | ✅ Yes |

## 📤 Output Format

### Summary Report (`audit-synthese.md`)

```markdown
# Full Technical Audit - Executive Summary

## 📋 EXECUTIVE SUMMARY (5 lines)
> Concise summary of key points, impacts and total estimated effort

## 📊 IMPROVEMENT POINTS TABLE

### 🔴 CRITICAL (Security, EOL, CVE)
| ID | Category | Title | Location | Impact | Effort |
| SEC-001 | Security | Hardcoded secrets | frontend/src/config.ts:12 | CRITICAL | 2h |

### 🟠 IMPORTANT (Major technical debt)
| PERF-001 | Performance | Missing lazy loading | frontend/app-routing.ts | IMPORTANT | 1d |

### 🟡 RECOMMENDED (Continuous improvements)
| MAIN-001 | Maintainability | Incomplete JSDoc | frontend/services/*.ts | RECOMMENDED | 1d |

## 📈 GLOBAL STATISTICS
| Metric | Value | Status | Target |
| Test coverage | 78% | 🟡 | ≥80% |
| CVE vulnerabilities | 3 HIGH | 🔴 | 0 HIGH |
| Bundle size | 4.2 MB | 🟠 | <3 MB |

## 🎯 IMMEDIATE PRIORITIES (Week 1)
1. SEC-001: Externalize secrets (2h)
2. SEC-002: Update log4j (1h)
3. SEC-003: Restrictive CORS (30min)
```

### Detailed Reports

**`audit-frontend.md`**: 8 complete sections
- Architecture & Code (structure, patterns, code smells)
- Technical Stack (versions, EOL, TS/build config)
- Dependencies (CVE, outdated, unused)
- Security (secrets, XSS, CORS, CSP)
- Tests & Quality (coverage, CI/CD, ESLint)
- Performance (lazy loading, bundle, memory leaks, OnPush)
- Observability (logging, monitoring, error tracking)
- Maintainability (JSDoc, i18n, accessibility, responsive)

**`audit-backend.md`**: Similar structure adapted to the backend

**`plan-action.md`**: Phased action plan
- Phase 1 (Week 1): CRITICAL → ~1d
- Phase 2 (Weeks 2-3): IMPORTANT → ~2 weeks
- Phase 3 (Weeks 4-8): RECOMMENDED → ~2 weeks
- Gantt chart (Mermaid)
- Validation checklist per phase

## ⏱️ Estimated Duration

| Phase | Duration |
|-------|----------|
| Configuration and detection | ~2 min |
| Code scan (frontend + backend) | ~16 min |
| CVE audit (npm/maven) | ~5 min |
| Parallel search | ~10 min |
| Extraction and analysis | ~8 min |
| Contradiction resolution | ~3 min |
| Prioritization and enrichment | ~5 min |
| Validation and report generation | ~5 min |
| **TOTAL** | **~50-60 min** |

## 🎓 Ideal Use Cases

This plan is best suited for:
- ✅ Pre-production audit (validation before a major release)
- ✅ Technical due diligence (assessment of an existing project)
- ✅ Major framework migration (Angular 12→17, Java 11→17)
- ✅ Security certification (ISO 27001, SOC 2)
- ✅ Exhaustive technical debt diagnosis
- ✅ Onboarding a new technical team
- ✅ Multi-month refactoring roadmap
- ✅ In-depth performance audit

## 📚 References

- **Full plan**: [`plan-expert.md`](plan-expert.md)
- **Configuration**: [`config-example.yml`](config-example.yml)
- **Main command**: [`/analyse-project`](../../../../../../prompts/hard_points/commands/analyse-project.md)
- **AI-KIDO agents**: [`/agents/`](../../../../../../prompts/hard_points/agents)
- **AI-KIDO documentation**: [`ai-kido.md`](../../../../../../prompts/hard_points/ai-kido.md)

## 🔧 Customization

### Adjust Thresholds

Edit in `config-audit.yml`:
```yaml
performance:
  thresholds:
    bundle_size_mb: 3      # Your limit
    lazy_loading_ratio: 0.5
    onpush_ratio: 0.5

testing:
  coverage_targets:
    unit_tests: 80         # Your target
    integration_tests: 70
```

### Add Repositories

```yaml
repositories:
  frontend:
    path: "./frontend"
  backend:
    path: "./backend"
  infrastructure:        # ← New
    path: "./terraform"
    type: "infrastructure"
    priority: "medium"
```

### Disable Categories

```yaml
scope:
  categories:
    architecture: true
    security: true
    performance: false    # ← Disable if not relevant
    maintainability: false
```

## 💡 Tips

1. **Before the audit**:
   - Check that repository paths are accessible
   - Install CVE tools (npm, maven, OWASP)
   - Plan ~1h for a full run

2. **During the audit**:
   - Let the plan run without interruption
   - Optional agents will ask for confirmation

3. **After the audit**:
   - Prioritize CRITICAL fixes (week 1)
   - Plan IMPORTANT ones (next sprints)
   - Add RECOMMENDED ones to the backlog

4. **Maintenance**:
   - Re-run the audit every 3-6 months
   - After each major migration
   - Before important production releases

## 🆘 Support

Questions or issues? See:
- Full documentation: [`plan-expert.md`](plan-expert.md)
- AI-KIDO agents: [`/agents/`](../../../../../../prompts/hard_points/agents)
- AI-KIDO issues: [GitHub Issues](https://github.com/lcalmejane/aikido/issues)

---
*Created on 2026-02-10 for full multi-repository technical audit*
*See generic plan: [`../../plan-expert.md`](../../plan-expert.md)*
