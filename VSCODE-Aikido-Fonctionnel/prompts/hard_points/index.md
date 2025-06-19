# Hard Points - Guide de Référence AI-KIDO & ROO-CODE

> **Version**: 1.0 | **Date**: 2025-01-27 | **Statut**: RÉFÉRENCE PRINCIPALE
> 
> Ce document constitue le point d'entrée principal pour utiliser efficacement AI-KIDO avec ROO-CODE. Il référence tous les Hard Points (vérités immuables) nécessaires à une utilisation optimale.

## Vue d'ensemble

Les **Hard Points** constituent le socle rigide de décisions validées et verrouillées d'AI-KIDO, complémentaire aux Tables de Vérité "meubles". Ce guide centralise l'accès à toutes les informations critiques pour l'utilisation d'AI-KIDO avec ROO-CODE.

## 🎯 Utilisation Directe - Accès Rapide

### Configuration ROO-CODE Obligatoire

**PRÉ-PROMPT CRITIQUE** à configurer dans ROO-CODE :
```
Sauf pour le Mode "Orchestrator",
Après analyse de la question et avant d'y répondre, 
utiliser le fichier prompts/gen/index.md
pour faire un parcours recursif pertinent afin de récupérer les infos 
strictement utiles à la compréhension de la demande.
```

### Règles Fondamentales

1. **Règle de Consultation** : Toujours consulter [`prompts/gen/index.md`](../gen/index.md) en premier
2. **Règle de Priorité** : Hard Points > Tables de vérité > Demande utilisateur
3. **Règle de Structure** : Respecter l'arborescence `/prompts/gen/` obligatoire
4. **Règle de Densité** : Maximiser la pertinence par token utilisé

## 📚 Références AI-KIDO

### Document Principal
- **[`ai-kido.md`](ai-kido.md)** - Guide pratique complet AI-KIDO pour LLM avec toutes les règles et structures essentielles

### Concepts Clés AI-KIDO
- **Tables de Vérité** : Contexte "meuble" évolutif avec le projet
- **Hard Points** : Socle "rigide" de décisions verrouillées
- **Personas** : Prompts adaptés aux différents rôles
- **Parcours Récursif** : Navigation efficace depuis l'index principal

### Structure Obligatoire
```
/prompts/
├── gen/                        # Tables de vérité - CONSULTER EN PREMIER
│   ├── index.md                # Point d'entrée principal
│   ├── concepts/               # Fondamentaux AI-KIDO
│   ├── techniques/             # Méthodes pratiques
│   ├── personas/               # Prompts par rôle
│   └── use_cases/              # Applications par contexte
├── hard_points/                # Vérités immuables - PRIORITÉ ABSOLUE
└── spec/                       # Espaces personnels
```

## 🤖 Références ROO-CODE

### Documentation Principale
- **[`roo-code/docs/index.md`](roo-code/docs/index.md)** - Point d'entrée ROO-CODE
- **[Aperçu des outils](roo-code/docs/advanced-usage/available-tools/tool-use-overview.md)** - Système d'outils complet

### Modes ROO-CODE Disponibles

| Mode | Icône | Accès Outils | Usage Principal |
|------|-------|--------------|-----------------|
| **Code** | 💻 | `read`, `edit`, `browser`, `command`, `mcp` | Développement général, implémentation |
| **Ask** | ❓ | `read`, `browser`, `mcp` | Explication, apprentissage (lecture seule) |
| **Architect** | 🏗️ | `read`, `browser`, `mcp`, `edit` (MD seulement) | Conception, planification système |
| **Debug** | 🪲 | `read`, `edit`, `browser`, `command`, `mcp` | Débogage méthodique |
| **Orchestrator** | 🪃 | `read`, `browser`, `command`, `mcp`, `edit` (config) | Coordination de tâches complexes |

### Groupes d'Outils ROO-CODE

| Groupe | Outils | Fonction |
|--------|--------|----------|
| **Read** | [`read_file`](roo-code/docs/advanced-usage/available-tools/read-file.md), [`list_files`](roo-code/docs/advanced-usage/available-tools/list-files.md), [`list_code_definition_names`](roo-code/docs/advanced-usage/available-tools/list-code-definition-names.md) | Exploration du code |
| **Search** | [`search_files`](roo-code/docs/advanced-usage/available-tools/search-files.md), [`codebase_search`](roo-code/docs/advanced-usage/available-tools/codebase-search.md) | Recherche de patterns |
| **Edit** | [`apply_diff`](roo-code/docs/advanced-usage/available-tools/apply-diff.md), [`insert_content`](roo-code/docs/advanced-usage/available-tools/insert-content.md), [`search_and_replace`](roo-code/docs/advanced-usage/available-tools/search-and-replace.md), [`write_to_file`](roo-code/docs/advanced-usage/available-tools/write-to-file.md) | Modification de fichiers |
| **Browser** | [`browser_action`](roo-code/docs/advanced-usage/available-tools/browser-action.md) | Automatisation web |
| **Command** | [`execute_command`](roo-code/docs/advanced-usage/available-tools/execute-command.md) | Exécution système |
| **MCP** | [`use_mcp_tool`](roo-code/docs/advanced-usage/available-tools/use-mcp-tool.md), [`access_mcp_resource`](roo-code/docs/advanced-usage/available-tools/access-mcp-resource.md) | Intégration externe |
| **Workflow** | [`switch_mode`](roo-code/docs/advanced-usage/available-tools/switch-mode.md), [`new_task`](roo-code/docs/advanced-usage/available-tools/new-task.md), [`ask_followup_question`](roo-code/docs/advanced-usage/available-tools/ask-followup-question.md), [`attempt_completion`](roo-code/docs/advanced-usage/available-tools/attempt-completion.md) | Gestion des tâches |

## 🔧 Configuration et Utilisation

### 1. Installation ROO-CODE
```bash
# Installation via marketplace VSCode
# ou via npm
npm install -g roo-code
```

### 2. Configuration AI-KIDO
1. Configurer le pré-prompt obligatoire
2. Structurer le projet selon l'arborescence AI-KIDO
3. Utiliser systématiquement [`prompts/gen/index.md`](../gen/index.md) comme point d'entrée

### 3. Workflow Standard
1. **ANALYSE** : Identifier le domaine et type de demande
2. **CONSULTATION** : Vérifier [`prompts/gen/index.md`](../gen/index.md) et tables pertinentes
3. **HARD POINTS** : Contrôler les contraintes immuables
4. **PERSONA** : Adopter le persona approprié
5. **MODE ROO-CODE** : Sélectionner le mode adapté
6. **RÉPONSE** : Générer selon les standards établis
7. **VALIDATION** : Vérifier cohérence et traçabilité

## 📖 Documentation Détaillée par Domaine

### Utilisation Basique ROO-CODE
- [Interface de chat](roo-code/docs/basic-usage/the-chat-interface.md)
- [Fonctionnement des outils](roo-code/docs/basic-usage/how-tools-work.md)
- [Utilisation des modes](roo-code/docs/basic-usage/using-modes.md)
- [Mentions de contexte](roo-code/docs/basic-usage/context-mentions.md)
- [Saisie des requêtes](roo-code/docs/basic-usage/typing-your-requests.md)

### Features Avancées ROO-CODE
- [Instructions personnalisées](roo-code/docs/features/custom-instructions.md)
- [Modes personnalisés](roo-code/docs/features/custom-modes.mdx)
- [Auto-approbation](roo-code/docs/features/auto-approving-actions.mdx)
- [Tâches boomerang](roo-code/docs/features/boomerang-tasks.mdx)
- [Navigation browser](roo-code/docs/features/browser-use.mdx)
- [Checkpoints](roo-code/docs/features/checkpoints.mdx)

### Providers et Intégrations
- [Anthropic](roo-code/docs/providers/anthropic.md)
- [OpenAI](roo-code/docs/providers/openai.md)
- [Modèles locaux](roo-code/docs/advanced-usage/local-models.md)
- [MCP Overview](roo-code/docs/features/mcp/overview.md)

### Communauté ROO-CODE
- [Index communautaire](roo-code/docs/community/index.md)
- [Modes personnalisés communautaires](roo-code/docs/community/custom-modes/)
- [Tips & Tricks](roo-code/docs/community/tips-and-tricks.md)

## 🎯 Patterns d'Utilisation Recommandés

### Pour le Développement
```
Mode Code + AI-KIDO Persona "Développeur" + Tables techniques pertinentes
```

### Pour la Conception
```
Mode Architect + AI-KIDO Persona "Architecte" + Hard Points architecture
```

### Pour l'Apprentissage
```
Mode Ask + AI-KIDO Personas pédagogiques + Concepts fondamentaux
```

### Pour le Débogage
```
Mode Debug + AI-KIDO Persona "Expert QA" + Tables de résolution
```

### Pour l'Orchestration
```
Mode Orchestrator + AI-KIDO Multi-personas + Workflow complexes
```

## ⚠️ Contraintes et Limitations

### Hard Points Critiques
- **Respect absolu** des contraintes listées dans les Hard Points
- **Consultation obligatoire** de [`prompts/gen/index.md`](../gen/index.md) avant toute réponse
- **Limite de 500 lignes** par fichier de documentation
- **Fractionnement automatique** avec chaînage bidirectionnel

### Restrictions par Mode ROO-CODE
- **Ask Mode** : Aucune modification de fichier
- **Architect Mode** : Édition limitée aux fichiers Markdown
- **Orchestrator Mode** : Édition limitée aux fichiers de configuration

## 🔗 Liens de Référence Rapides

### AI-KIDO
- [Guide principal AI-KIDO](ai-kido.md)
- [Index des concepts](../gen/concepts/index.md)
- [Index des techniques](../gen/techniques/index.md)
- [Index des personas](../gen/personas/index.md)
- [Index des cas d'usage](../gen/use_cases/index.md)

### ROO-CODE
- [Documentation principale](roo-code/docs/index.md)
- [Installation](roo-code/docs/getting-started/installing.mdx)
- [Première tâche](roo-code/docs/getting-started/your-first-task.md)
- [FAQ](roo-code/docs/faq.md)

---

**🎯 RAPPEL CRITIQUE** : Ce document doit être utilisé comme point d'entrée principal pour toute utilisation d'AI-KIDO avec ROO-CODE. Consultez toujours [`prompts/gen/index.md`](../gen/index.md) pour le contexte spécifique avant d'approfondir une section particulière.
