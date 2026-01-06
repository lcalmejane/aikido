# Liste des Agents et personas AI-KIDO

## Déclaration des Agents

| Agent | Persona | Spécialisation |
|-------|---------|----------------|
| 🔍 **agent-aikido-explore-bank** | [agent-aikido-explore-bank.md](prompts/hard_points/agents/agent-aikido-explore-bank.md) | Recherche Memory Bank v5.1 strict (Grep-only) |
| 💻 **agent-aikido-explore-code** 🆕 | [agent-aikido-explore-code.md](prompts/hard_points/agents/agent-aikido-explore-code.md) | Recherche code source avec métadonnées structurées |
| 🔍💻 **agent-aikido-explore-all** 🆕 | [agent-aikido-explore-all.md](prompts/hard_points/agents/agent-aikido-explore-all.md) | Orchestrateur recherche parallèle Bank + Code |
| ⚖️ **agent-aikido-truth-evaluator** | [agent-aikido-truth-evaluator.md](prompts/hard_points/agents/agent-aikido-truth-evaluator.md) | Détermine sources autoritaires avec optimisation last-check |
| 🎯 **agent-aikido-raci-delegator** | [agent-aikido-raci-delegator.md](prompts/hard_points/agents/agent-aikido-raci-delegator.md) | Classifie et route documents selon RACI |
| 📝 **agent-aikido-doc-header** 🆕 | [agent-aikido-doc-header.md](prompts/hard_points/agents/agent-aikido-doc-header.md) | Gestion standardisée en-têtes documents AI-KIDO |
| 🗂️ **agent-aikido-projet-index** 🆕 | [agent-aikido-projet-index.md](prompts/hard_points/agents/agent-aikido-projet-index.md) | Gestionnaire arborescence projet avec cache 24H |
| 🤖 **agent-aikido-bank-populate** | [agent-aikido-bank-populate.md](prompts/hard_points/agents/agent-aikido-bank-populate.md) | Peuplement automatique Memory Bank depuis code/contexte |
| ✅ **agent-aikido-validator** | [agent-aikido-validator.md](prompts/hard_points/agents/agent-aikido-validator.md) | Validation rapide conformité AI-KIDO (<2k tokens) |
| ⚖️ **agent-aikido-balancer** | [agent-aikido-balancer.md](prompts/hard_points/agents/agent-aikido-balancer.md) | Équilibrage arborescence Memory Bank |
| 📑 **agent-aikido-indexer** | [agent-aikido-maj-md-index.md](prompts/hard_points/agents/agent-aikido-maj-md-index.md) | MAJ automatique index.md + AGENTS.md |
| 🔀 **agent-aikido-fusion** | [agent-aikido-fusion.md](prompts/hard_points/agents/agent-aikido-fusion.md) | Fusion intelligente de fichiers lors mises à jour AI‑KIDO |
| 🔧 **agent-aikido-update-controller** | [agent-aikido-update-controller.md](prompts/hard_points/agents/agent-aikido-update-controller.md) | Contrôle les mises à jour du système AI‑KIDO, sauvegarde, validation, exécution des plans de mise à jour et roll‑back. |
| 🔄 **agent-aikido-confluence** | [agent-aikido-confluence.md](prompts/hard_points/system/confluence/agents/agent-aikido-confluence.md) | Synchronisation bidirectionnelle Memory Bank ↔ Confluence Cloud |
| 📊 **agent-aikido-jira** 🆕 | [agent-aikido-jira.md](prompts/hard_points/system/jira/agents/agent-aikido-jira.md) | Synchronisation bidirectionnelle, analyse métriques JIRA et génération rapports interactifs |

## 👥 Available Agents Personas Experts

|Agent / Persona | Description | Lien |
|---------|-------------|------|


## Utilisations des Agents

### agent-aikido-explore-bank
- ✅ Recherche exploratoire (architecture, concepts globaux)
- ✅ Contexte enrichi avec cross-refs
- ✅ Filtrage auto (rapports test exclus)
- ❌ NE PAS UTILISER: recherche simple/ponctuelle, perf critique (<0.05s), budget très strict

### agent-aikido-explore-code
- ✅ Recherche profonde code source
- ✅ Localiser éléments (classes, functions, interfaces) avec métadonnées
- ✅ Analyse dépendances (imports graph)
- ✅ Cartographie cross-file (extends, implements)
- ❌ NE PAS UTILISER: Besoin code complet (Read direct), Recherche Memory Bank (explore-bank)

### agent-aikido-explore-all
- ✅ Recherche générale (docs + code simultanément)
- ✅ Vue complète documentation + implémentation
- ✅ Vérifier cohérence specs vs code
- ❌ NE PAS UTILISER: Savoir déjà où chercher (bank OU code), Besoin une seule source

### agent-aikido-truth-evaluator
- Contradictions specs/code
- Validation sources
- Optimisation via métadonnées last-check

### agent-aikido-raci-delegator
- Classer documents Memory Bank
- Organisation contenu
- Déterminer rôle responsable

### agent-aikido-doc-header
- Création/validation/MAJ headers avec versioning
- Truth source tracking
- Last-check metadata

### agent-aikido-projet-index
- Localisation fichiers
- Exploration répertoires
- Questions d'existence
- Vue d'ensemble structure
- Statistiques projet

### agent-aikido-bank-populate
- Peuplement automatique Memory Bank depuis code/contexte
- ⏰ FIN processus UNIQUEMENT (après rapport gaps complet, validation utilisateur)

### agent-aikido-validator
- Auto-trigger create/edit/move dans `/prompts`
- Quick checks (lignes, liens, frontmatter)

### agent-aikido-balancer
- Fichiers >500 lignes
- Profondeur >4
- Branchement hors 3-7
- Liens cassés

### agent-aikido-indexer
- Après ajout/modif/suppression fichiers
- Stats obsolètes
- Sync AGENTS.md

### agent-aikido-fusion
- Mises à jour externes (`/maj-aikido --update`)
- Fusion préservant contexte projet + adoptant nouveau formalisme

### agent-aikido-confluence
- Synchronisation bidirectionnelle Memory Bank ↔ Confluence
- Gestion métadonnées YAML dans documents
- Stratégie last-write-wins
- Conversion Markdown ↔ Confluence Storage Format

### agent-aikido-jira
- ✅ Synchronisation bidirectionnelle Memory Bank ↔ JIRA Cloud
- ✅ Calcul KPI Agile (vélocité, burndown, temps, qualité) avec JQ
- ✅ Génération rapports HTML interactifs (Chart.js, tableaux triables)
- ✅ Analyse JSON performante avec JQ obligatoire
- ✅ Structure hiérarchique EPICS → FEATURES → TICKETS
- ❌ NE PAS UTILISER: Pas de compte JIRA Cloud, pas besoin sync externe, travail purement local

## Workflows Principaux

### Patterns de base
1. explore-bank → truth-evaluator (fast-path check via doc-header) → développement → raci-delegator (Feature avec contexte)
2. truth-evaluator → doc-header (MAJ last-check après validation)
3. bank-populate → doc-header (création header) → validator (conformité)
4. File operation → validator (Auto-validation)
5. explore-bank → bank-populate → doc-header → raci-delegator (Peuplement FIN processus avec metadata)
6. Source update → fusion → truth-evaluator → doc-header → validator (Mise à jour externe complète)

**Utilisation agents** :
- explore-bank : Extraction contextuelle Memory Bank (concepts/techniques/personas)
- explore-code : Recherche code source avec métadonnées (classes, functions, interfaces, dependencies avec line numbers)
- explore-all : Orchestration parallèle explore-bank + explore-code pour recherche complète (docs + code)
- truth-evaluator : Arbitrage contradictions avec optimisation last-check (fast-path si ✅ + sources inchangées)
- raci-delegator : Classification et routing documents par rôle
- doc-header : Gestion headers standardisés (versioning, truth source, last-check, source refs)
- projet-index : Localisation fichiers instantanée via cache JSON, stats projet, navigation structure
- bank-populate : Peuplement FIN processus (après rapport gaps complet) avec headers complets
- validator : Auto-validation (<2k tokens) sur create/edit/move dans `/prompts`
- balancer : Équilibrage arborescence (fichiers >500 lignes, profondeur >4, branchement hors 3-7)
- indexer : MAJ index.md et AGENTS.md après modifications
- fusion : Fusion intelligente lors mises à jour externes (`/maj-aikido --update`)
