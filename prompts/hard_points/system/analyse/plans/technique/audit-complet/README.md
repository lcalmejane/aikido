# Plan d'Analyse Technique - Audit Complet Expert

> **Chemin** : `prompts/hard_points/system/analyse/plans/technique/audit-complet/`  
> **Version** : 1.0 | **Date** : 2026-02-10 | **Type** : Analysis Plan

## 📋 Vue d'Ensemble

Ce répertoire contient le **plan d'analyse technique complet expert** pour réaliser un audit approfondi multi-repository (frontend + backend).

### Fichiers Disponibles

| Fichier | Description |
|---------|-------------|
| [`plan-expert.md`](plan-expert.md) | Plan d'analyse complet (~1200 lignes) avec stratégies, agents, workflows |
| [`config-example.yml`](config-example.yml) | Fichier de configuration exemple à adapter à votre projet |
| `README.md` | Ce fichier |

## 🎯 Objectif

Réaliser un **audit technique complet** couvrant :
- 🏗️ Architecture & code
- 📦 Stack technique
- 🔗 Dépendances
- 🔒 Sécurité
- ✅ Tests & qualité
- ⚡ Performance
- 📊 Observabilité
- 🛠️ Maintenabilité

## 🚀 Démarrage Rapide

### 1. Copier et Adapter la Configuration

```bash
# Copier le fichier exemple
cp prompts/hard_points/system/analyse/plans/technique/audit-complet/config-example.yml ./config-audit.yml

# Éditer les chemins des repositories
nano config-audit.yml
# Modifier :
#   repositories.frontend.path: "./frontend"  ← Votre chemin frontend
#   repositories.backend.path: "./backend"    ← Votre chemin backend
```

### 2. Exécuter l'Audit

**Option A : Avec configuration YAML** (recommandé)
```bash
/analyse-project --config=./config-audit.yml
```

**Option B : Mode interactif**
```bash
/analyse-project
# Puis suivre les prompts :
# - Nature : 6 (Stack générale technique)
# - Profondeur : 4 (Expert)
# - Chemins : Indiquer frontend et backend
```

### 3. Consulter les Rapports

Les rapports sont générés dans `./audits/` :
```
audits/
├── audit-synthese.md              # Synthèse exécutive (5 lignes + tableau priorisé)
├── audit-frontend.md              # Détails frontend (architecture, stack, sécu, perf...)
├── audit-backend.md               # Détails backend (architecture, stack, sécu, perf...)
├── plan-action.md                 # Plan d'action phasé (CRITIQUE/IMPORTANT/RECOMMANDÉ)
└── vulnerabilites-cve.json        # Export JSON vulnérabilités CVE
```

## 📊 Ce Que le Plan Analyse

### 1. Architecture & Code
- Structure modules/packages/composants
- Patterns architecturaux (Layered, Hexagonal, Microservices)
- Respect SOLID, DRY, séparation responsabilités
- Code smells (classes >300 lignes, complexité cyclomatique >10)
- Duplication de code

### 2. Stack Technique
- Versions frameworks (Angular, Spring Boot, React, etc.)
- EOL (End of Life) et support
- Configuration TypeScript (strict mode, typage)
- Configuration build (Maven, Webpack, Vite)

### 3. Dépendances
- **Vulnérabilités CVE** : npm audit, OWASP Dependency-Check
- Librairies obsolètes (>2 versions majeures retard)
- Dépendances inutilisées ou redondantes

### 4. Sécurité
- **Secrets hardcodés** : API keys, passwords, tokens
- **OWASP Top 10** : XSS, CSRF, injection SQL/NoSQL
- Configuration CORS, headers sécurité (CSP, HSTS)
- Chiffrement données sensibles

### 5. Tests & Qualité
- Couverture tests (unitaires, intégration, e2e)
- Qualité des tests (assertions, mocks)
- CI/CD (GitHub Actions, GitLab CI, Jenkins)
- Analyse statique (SonarQube, ESLint)

### 6. Performance
- **Frontend** : Lazy loading, bundle size, OnPush change detection, memory leaks RxJS
- **Backend** : Requêtes N+1, cache (Redis, Caffeine), optimisations queries
- Code splitting, dynamic imports

### 7. Observabilité
- Logging structuré (JSON vs texte)
- Monitoring et métriques (Prometheus, Grafana)
- Gestion centralisée erreurs (Sentry, Rollbar)
- Tracing distribué (OpenTelemetry)

### 8. Maintenabilité
- Documentation code (JSDoc, JavaDoc)
- Internationalisation i18n
- Accessibilité WCAG 2.1 AA
- Responsive design

## 🤖 Agents AI-KIDO Utilisés

| Agent | Phase | Rôle | Obligatoire |
|-------|-------|------|-------------|
| [`agent-aikido-explore-code`](../../../agents/agent-aikido-explore-code.md) | 3.1 | Scan code source multi-repository | ✅ Oui |
| [`agent-aikido-explore-all`](../../../agents/agent-aikido-explore-all.md) | 3.2 | Recherche parallèle Memory Bank + Code | ✅ Oui (prof ≥4) |
| [`agent-aikido-truth-evaluator`](../../../agents/agent-aikido-truth-evaluator.md) | Résolution | Résolution contradictions doc vs code | Si contradictions |
| [`agent-aikido-raci-delegator`](../../../agents/agent-aikido-raci-delegator.md) | Classification | Classification documents par domaine | Si RACI activé |
| [`agent-aikido-bank-populate`](../../../agents/agent-aikido-bank-populate.md) | Peuplement | Peuplement automatique gaps détectés | Si gaps >3 |
| [`agent-aikido-validator`](../../../agents/agent-aikido-validator.md) | Validation | Validation conformité AI-KIDO | ✅ Oui |

## 📤 Format de Sortie

### Rapport de Synthèse (`audit-synthese.md`)

```markdown
# Audit Technique Complet - Synthèse Exécutive

## 📋 SYNTHÈSE EXÉCUTIVE (5 lignes)
> Résumé concis des points clés, impacts et effort total estimé

## 📊 TABLEAU DES POINTS D'AMÉLIORATION

### 🔴 CRITIQUE (Sécurité, EOL, CVE)
| ID | Catégorie | Titre | Localisation | Impact | Effort |
| SEC-001 | Sécurité | Secrets hardcodés | frontend/src/config.ts:12 | CRITIQUE | 2h |

### 🟠 IMPORTANT (Dette technique majeure)
| PERF-001 | Performance | Absence lazy loading | frontend/app-routing.ts | IMPORTANT | 1j |

### 🟡 RECOMMANDÉ (Améliorations continues)
| MAIN-001 | Maintenabilité | JSDoc incomplète | frontend/services/*.ts | RECOMMANDÉ | 1j |

## 📈 STATISTIQUES GLOBALES
| Métrique | Valeur | Status | Cible |
| Couverture tests | 78% | 🟡 | ≥80% |
| Vulnérabilités CVE | 3 HIGH | 🔴 | 0 HIGH |
| Bundle size | 4.2 MB | 🟠 | <3 MB |

## 🎯 PRIORITÉS IMMÉDIATES (Semaine 1)
1. SEC-001 : Externaliser secrets (2h)
2. SEC-002 : Update log4j (1h)
3. SEC-003 : CORS restrictif (30min)
```

### Rapports Détaillés

**`audit-frontend.md`** : 8 sections complètes
- Architecture & Code (structure, patterns, code smells)
- Stack Technique (versions, EOL, config TS/build)
- Dépendances (CVE, obsolètes, inutilisées)
- Sécurité (secrets, XSS, CORS, CSP)
- Tests & Qualité (couverture, CI/CD, ESLint)
- Performance (lazy loading, bundle, memory leaks, OnPush)
- Observabilité (logging, monitoring, error tracking)
- Maintenabilité (JSDoc, i18n, accessibilité, responsive)

**`audit-backend.md`** : Structure similaire adaptée backend

**`plan-action.md`** : Plan d'action phasé
- Phase 1 (Semaine 1) : CRITIQUE → ~1j
- Phase 2 (Semaines 2-3) : IMPORTANT → ~2 semaines
- Phase 3 (Semaines 4-8) : RECOMMANDÉ → ~2 semaines
- Diagramme Gantt (Mermaid)
- Checklist validation par phase

## ⏱️ Durée Estimée

| Phase | Durée |
|-------|-------|
| Configuration et détection | ~2 min |
| Scan code (frontend + backend) | ~16 min |
| Audit CVE (npm/maven) | ~5 min |
| Recherche parallèle | ~10 min |
| Extraction et analyse | ~8 min |
| Résolution contradictions | ~3 min |
| Priorisation et enrichissement | ~5 min |
| Validation et génération rapports | ~5 min |
| **TOTAL** | **~50-60 min** |

## 🎓 Cas d'Usage Idéaux

Ce plan est optimal pour :
- ✅ Audit pré-production (validation avant mise en prod majeure)
- ✅ Due diligence technique (évaluation projet existant)
- ✅ Migration framework majeure (Angular 12→17, Java 11→17)
- ✅ Certification sécurité (ISO 27001, SOC 2)
- ✅ Diagnostic dette technique exhaustif
- ✅ Onboarding nouvelle équipe technique
- ✅ Roadmap refactoring multi-mois
- ✅ Audit performance approfondi

## 📚 Références

- **Plan complet** : [`plan-expert.md`](plan-expert.md)
- **Configuration** : [`config-example.yml`](config-example.yml)
- **Commande principale** : [`/analyse-project`](../../../commands/analyse-project.md)
- **Agents AI-KIDO** : [`/agents/`](../../../agents/)
- **Documentation AI-KIDO** : [`ai-kido.md`](../../../ai-kido.md)

## 🔧 Personnalisation

### Adapter les Thresholds

Modifier dans `config-audit.yml` :
```yaml
performance:
  thresholds:
    bundle_size_mb: 3      # Votre limite
    lazy_loading_ratio: 0.5
    onpush_ratio: 0.5

testing:
  coverage_targets:
    unit_tests: 80         # Votre cible
    integration_tests: 70
```

### Ajouter des Repositories

```yaml
repositories:
  frontend:
    path: "./frontend"
  backend:
    path: "./backend"
  infrastructure:        # ← Nouveau
    path: "./terraform"
    type: "infrastructure"
    priority: "medium"
```

### Désactiver des Catégories

```yaml
scope:
  categories:
    architecture: true
    securite: true
    performance: false    # ← Désactiver si non pertinent
    maintenabilite: false
```

## 💡 Conseils

1. **Avant l'audit** :
   - Vérifier chemins repositories accessibles
   - Installer outils CVE (npm, maven, OWASP)
   - Prévoir ~1h pour exécution complète

2. **Pendant l'audit** :
   - Laisser le plan s'exécuter sans interruption
   - Agents optionnels demanderont confirmation

3. **Après l'audit** :
   - Prioriser corrections CRITIQUES (semaine 1)
   - Planifier IMPORTANTES (sprints suivants)
   - Intégrer RECOMMANDÉES dans backlog

4. **Maintenance** :
   - Réexécuter audit tous les 3-6 mois
   - Après chaque migration majeure
   - Avant mises en production importantes

## 🆘 Support

Questions ou problèmes ? Consulter :
- Documentation complète : [`plan-expert.md`](plan-expert.md)
- Agents AI-KIDO : [`/agents/`](../../../agents/)
- Issues AI-KIDO : [GitHub Issues](https://github.com/votre-repo/issues)

---
*Créé le 2026-02-10 pour audit technique complet multi-repository*
*Voir plan générique : [`../plan-expert.md`](../plan-expert.md)*
