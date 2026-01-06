---
description: "Affiche la liste des commandes AI-KIDO disponibles depuis commands_list.md"
---

# Commande List-Command

Liste les commandes AI-KIDO disponibles en lisant directement commands_list.md (source autoritaire).

## Objectif

Afficher rapidement les commandes disponibles telles que déclarées dans commands_list.md, en partant du principe que ce fichier est à jour.
## Syntaxe

```bash
/list-command
```

## Exécution

### Étape 1 : Lecture commands_list.md

Lire le fichier `commands_list.md` et extraire la section "🚀 Getting Started" qui référence les commandes disponibles.

### Étape 2 : Affichage

Afficher les commandes listées dans commands_list.md avec leur description.

```markdown
📋 COMMANDES AI-KIDO DISPONIBLES

(Source : commands_list.md)

Commandes disponibles dans prompts/hard_points/commands/ :

- /init-raci-aikido : Initialiser la matrice RACI et les spécifications d'équipe
- /init-glossaire : Créer ou mettre à jour le glossaire métier
- /create-persona : Créer un nouveau persona AI-KIDO
- /check-claude : Analyser et mettre à jour CLAUDE.md
- /logllmon : Activer la traçabilité des interactions LLM
- /check-truth : Vérifier cohérence entre documentation et code
- /compile-agent-from-use : Compiler des agents depuis l'usage
- /create-command : Créer des commandes AI-KIDO optimisées
- /analyse-project : Analyser les sources projet
- /maj-aikido : Synchroniser hard_points lors des rebase
- /init-aikido : Initialiser la Memory Bank AI-KIDO
- /analyse-aikido : Audit complet des tables de vérités
- /logllmoff : Désactiver la traçabilité LLM
- /optimize-command-with-aikido-agents : Optimiser commandes avec agents

📚 Pour plus de détails, consultez commands_list.md ou prompts/hard_points/commands/[nom-commande].md
```

## Messages

### Succès

```
✅ Liste des commandes affichée depuis commands_list.md
```

### Erreur

```
❌ commands_list.md introuvable
```

---

*Commande simple de lecture commands_list.md*
