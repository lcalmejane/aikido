# AI Agents Configuration

> **Version** : 1.3 | **Date** : 2025-12-09 | **Mode AI-KIDO** : STANDARD

Ce fichier constitue l'**interface standardisée** exposant la Memory Bank AI-KIDO selon la norme LLM. Il référence les personas, concepts, techniques et use cases disponibles via des liens exclusifs (sans duplication de contenu).

## 📋 Project Context

## 📐 Internal Aikido Agent as Tool/Mode

Les agents internes `agent-aikido-*` sont à la fois **outils**, **agents** et **modes** du système Roo‑Code.
Toute interaction de retour entre le **mode** (ex. `code`, `ask`, `debug`, …) et un **agent interne Aikido** doit impérativement être encodée au format **JSON**.

**echanges uniques JSON obligatoires**
Attention de n'appeler qu'une fois l'agent concerné par requête.Factorisez les appels multiples en une seule requête avec paramètres agrégés si besoins.

Cette contrainte garantit une sérialisation explicite des paramètres et une interopérabilité fiable entre les différents composants du framework.

- **Project Name** : AI-KIDO Best Practices
- **Description** : Méthode de construction de Memory Bank optimisée pour les LLM
- **Mode AI-KIDO** : STANDARD (vs LIGHT)
- **Hard Points** : [`/prompts/hard_points/`](prompts/hard_points/) (Vérités immuables - PRIORITÉ ABSOLUE)

### Point d'Entrée Memory Bank (V1.3+ - Unifié)

**RÈGLE CRITIQUE** : Consulter le point d'entrée unifié `/prompts/index.md` en premier pour tout contexte

**EXCEPTIONS** : Les agents internes AI-KIDO (préfixe `agent-aikido-*`) NE doivent PAS charger l'index - Pour le reste ils possèdent déjà les règles nécessaires.

| Type de Projet | Point d'Entrée V1.3+ | Description |
|----------------|----------------------|-------------|
| **Mono-projet** | [`/prompts/index.md`](prompts/index.md) | 🎯 Point d'entrée UNIQUE → référence `/prompts/gen/` |
| **Multi-projet** | [`/prompts/index.md`](prompts/index.md) | 🎯 Point d'entrée UNIQUE → pointe `/prompts/[projet-1]/index.md`, `/prompts/[projet-2]/index.md`, etc. |

**Navigation Multi-Projet** :

1. `/prompts/index.md` → Liste et pointe tous les projets
2. `/prompts/[projet-n]/index.md` → Point d'entrée spécifique du projet
3. `/prompts/[projet-n]/gen/index.md` → Navigation interne du projet

**ANCIEN SYSTÈME (< V1.3)** : `/prompts/gen/index.md` (mono) ou `/prompts/[projet-x]/gen/index.md` (multi) - **OBSOLÈTE**

### Domain & Architecture

- **Domain** : Knowledge Management, LLM Optimization, Collaborative Development
- **Tech Stack** : Markdown, YAML, Git

## 📚 Memory Bank Content Gen ( work in progress )

**Concepts** : [`/prompts/gen/concepts/`](prompts/gen/concepts/) 
**Techniques** : [`/prompts/gen/techniques/`](prompts/gen/techniques/) 
**Agents** : [`/prompts/gen/agents/`](prompts/gen/agents/) 
**Personas** : [`/prompts/gen/personas/`](prompts/gen/personas/)
**Use Cases** : [`/prompts/gen/use_cases/`](prompts/gen/use_cases/)

## 📚 Memory Bank Content Hard Point ( validated content )
**Concepts** : [`/prompts/hard_points/concepts/`](prompts/hard_points/concepts/) 
**Techniques** : [`/prompts/hard_points/techniques/`](prompts/hard_points/techniques/) 
**Agents** : [`/prompts/hard_points/agents/`](prompts/hard_points/agents/) 
**Personas** : [`/prompts/hard_points/personas/`](prompts/hard_points/personas/)
**Use Cases** : [`/prompts/hard_points/use_cases/`](prompts/hard_points/use_cases/)
**System Tools and Skills** : [`/prompts/hard_points/system/`](prompts/hard_points/system/)
**Search Plans** : [`/prompts/hard_points/system/search/plans/`](prompts/hard_points/system/search/plans/) 

### Workflows Principaux

**Patterns de base** :

- explore-bank → truth-evaluator (fast-path check via doc-header) → développement → raci-delegator (Feature avec contexte)
- truth-evaluator → doc-header (MAJ last-check après validation)
- bank-populate → doc-header (création header) → validator (conformité)
- File operation → validator (Auto-validation)
- explore-bank → bank-populate → doc-header → raci-delegator (Peuplement FIN processus avec metadata)
- Source update → fusion → truth-evaluator → doc-header → validator (Mise à jour externe complète)

## 📖 Usage Guidelines

**Point d'entrée V1.3+** : [`/prompts/index.md`](prompts/index.md) - Point d'entrée UNIQUE pour tous les projets
**Hiérarchie** : Hard Points ([`/prompts/hard_points/`](prompts/hard_points/)) > Tables de Vérités ([`/prompts/gen/`](prompts/gen/)) > Specs perso (IGNORER sauf activation)
**Navigation** : Parcours récursif avec liens bidirectionnels depuis `/prompts/index.md`

## 🚀 Getting Started

For all commands , custom modes and personas defined :

- custome mode `agent-aikido-*` = agent `agent-aikido-*`  = persona `agent-aikido-*` .
for all internal AI-KIDO agents , the mode and agent names are identical .


**available agents et personas** : [agents_list.md](agents_list.md).
**available skills** : [skills_list.md](skills_list.md).
**available commands** : [commands_list.md](commands_list.md).
**Hard Points** : [`/prompts/hard_points/ai-kido.md`](prompts/hard_points/ai-kido.md) (règles fondamentales V1.3)
**Point d'entrée** : [`/prompts/index.md`](prompts/index.md) - Point d'entrée UNIQUE unifié
**Search Plans** : [`/prompts/hard_points/system/search/plans/`](prompts/hard_points/system/search/plans/)
**analyse plans** : [`/prompts/hard_points/system/search/analyse/plans/`](prompts/hard_points/system/analyse/plans/)
---

## PRÉFIX DE PROMPT GENERAL

```text
Après analyse de la question et avant d’y répondre, utiliser le fichier prompts/index.md pour faire un parcours récursif pertinent afin de récupérer les infos strictement utiles à la compréhension de la demande.
```

## REMEMBER
- Les agents, personas, commands et skills sont des prompts au format markdown avec des instructions claires et doivent être interprétés, exécutés et gérés comme tels.
