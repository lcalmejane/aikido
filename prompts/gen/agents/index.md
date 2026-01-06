# Personas AI‑KIDO

Ce répertoire décrit les différents agents techniques AI-KIDO utilisables dans les prompts. Ajoutez ici les fichiers Markdown détaillant chaque rôle et leurs responsabilités.

## Agents Techniques AI-KIDO

### 🤖 Agents d'Orchestration

- [`agent-aikido-bank-populate.md`](agent-aikido-bank-populate.md) - **Peupleur automatique Memory Bank** - Orchestre la création automatique de documents manquants ou invalides en collectant infos du code/contexte et déléguant à des experts

### 🔍 Agents d'Exploration et Analyse

- [`agent-aikido-explore-bank.md`](agent-aikido-explore-bank.md) - **Explorateur Memory Bank** - Recherche et extraction intelligente d'informations depuis `/prompts/gen/`
- [`agent-aikido-truth-evaluator.md`](agent-aikido-truth-evaluator.md) - **Évaluateur Sources de Vérité** - Détermine quelles sources sont autoritaires selon le scénario
- [`agent-aikido-raci-delegator.md`](agent-aikido-raci-delegator.md) - **Classificateur RACI** - Classe et route documents vers emplacements corrects selon matrice RACI

### ✅ Agents de Validation et Conformité

- [`agent-aikido-validator.md`](agent-aikido-validator.md) - **Validateur de Conformité AI-KIDO** - Valide fichiers contre les 18 règles AI-KIDO et génère rapports de conformité avec plans de résolution détaillés

### 🔀 Agents de Fusion et Transformation

- [`agent-aikido-fusion.md`](agent-aikido-fusion.md) - **Fusionneur Intelligent** - Fusion intelligente de fichiers lors des mises à jour AI-KIDO, préservant contexte projet tout en adoptant nouveau formalisme
