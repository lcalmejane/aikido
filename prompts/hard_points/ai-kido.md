# AI‑KIDO – Guide Pratique pour LLM

> **Version**: 1.3.1‑LLM | **Usage**: Référence directe pour interactions LLM

## PRÉFIX DE PROMPT GENERAL
```text
Sauf pour les agents internes "agent‑aikido‑*", après analyse de la question et avant d’y répondre, utiliser le fichier prompts/index.md pour faire un parcours récursif pertinent afin de récupérer les infos strictement utiles à la compréhension de la demande.
```

## EXCEPTIONS
- Aux agents internes AI‑KIDO (préfixe `agent‑aikido‑*`) qui possèdent déjà les règles nécessaires

## RÈGLES FONDAMENTALES D'UTILISATION (extrait)
1. **🌳 Arborescence Documentaire**: Parcours d'arbre récursif depuis [`/prompts/index.md`](../index.md)
2. **📊 Séparation Théorie/Pratique**: `concepts/` + `personas/` (théorie) vs `techniques/` + `use_cases/` (pratique)
3. **🔄 Introspection**: Les règles de gestion font partie d'elles-mêmes (ce fichier)
4. **📏 Contrainte Lignes**: ≤100 lignes (short),≤500 lignes (standard), ≤1000 lignes (commands, personas, agents, skills). **CRITIQUE**: `/prompts/index.md.md`,`AGENTS.md`,`CLAUDE.md`,`ai-kido.md` et `ai-kido-light.md` DOIVENT rester ≤100 lignes (sinon délester fichiers details), prompts/hard_points/system/structure/index.json no limit.
5. **✂️ Split Automatique**: Division intelligente avec liens préservés si dépassement
6. **🔗 Liens Bidirectionnels**: Chaînage A ↔ B systématique
7. **⚖️ Arbre Équilibré**: Facteur 3-7 enfants/parent, profondeur ≤ 4 niveaux
8. **🏗️ Architecture Bicéphale**: `gen/` (meuble) vs `hard_points/` (rigide)
9. **👥 Agents Spécialistes**: Personas pour optimisation requêtes LLM
10. **🎭 Agent Orchestrateur**: Coordination des agents spécialistes
11. **🗜️ Densité Sémantique**: Information maximale, mots minimaux
12. **📈 Schémas Mermaid**: Compression visuelle pour densité sémantique
13. **🔍 Indexation Vectorielle**: Mode RAG local du workspace
14. **🔄 Amélioration Continue**: Évolution automatique selon besoins et LLM
15. **👨‍💼 Répartition par Rôles Humains**: Sous-répertoires assignés aux membres de l'équipe
16. **🤖 Conformité AGENTS.md**: Synchronisation obligatoire avec la norme AGENTS.md
17. **🔄 Bidirectionnalité Agents-Personas**: Correspondance 1:1 entre agents AGENTS.md et personas AI-KIDO
18. **⚙️ Commandes Roo**: Les commandes sont définies dans [`prompts/hard_points/commands/`](prompts/hard_points/commands/) et ne doivent être référencées que dans [`AGENTS.md`](AGENTS.md), jamais dans [`index.md`](../gen/index.md)

## RÈGLES D'AUTO‑ALIMENTATION (résumé)
- **Signal Utilisateur** : toute erreur signalée crée immédiatement une règle préventive.  
- **Auto‑Détection** : 2+ erreurs similaires déclenchent la génération proactive d’une règle.  
- **Seuils** : Critique (immédiat), Rapide (2×), Standard (3×).  
- **Intégration** : insertion automatique dans le répertoire adéquat + mise à jour de l’index.

## RÈGLES DE CAPITALISATION DES ANALYSES (résumé)
1. Vérifier l’existence avant création.  
2. Consulter systématiquement l’arborescence `/prompts/gen/`.  
3. Maximiser la densité d’information par mot.  
4. Enrichir continuellement les tables de vérité.  
5. Maintenir l’alignement entre tous les éléments.  
6. Documenter chaque décision importante.

## STRUCTURE OBLIGATOIRE DES RÉPERTOIRES (résumé)
```
.claude
├── commands/                  # Mapping des commandes AI-KIDO
├── agents/                    # Mapping des agents AI-KIDO
.roo
├── commands/                  # Mapping des commandes AI-KIDO
├── agents/                    # Mapping des agents AI-KIDO
.roomodes
agents_list.md
commands_list.md
AGENTS.md
CLAUDE.md
README.md
/prompts/
├── index.md                    # POINT D'ENTRÉE UNIQUE
├── gen/
│   ├── concepts/
│   ├── techniques/
│   ├── agents/
│   ├── personas/
│   └── use_cases/
├── hard_points/
│   ├── index.md
│   ├── concepts/
│   ├── techniques/
│   ├── commands/               # Commandes AI-KIDO
│   ├── system/                 # Outils Systemes organisés par Skills
│   ├── agents/
│   ├── personas/
│   └── use_cases/
└── spec/
    └── logs/
```
- La structure **Multi‑Projet** suit le même schéma avec un sous‑dossier `[projet‑n]` contenant `gen/` et `hard_points/`.

## RÈGLES DE CONFORMITÉ (résumé)
- **Maximum 500 lignes** par fichier hard point.  
- **Densité sémantique** > 80 % d’information utile.  
- **Liens bidirectionnels** obligatoires entre concepts, techniques, personas et use_cases.  
- **Hard points** immuables sauf mise à jour via `agent‑aikido‑fusion`.  
- **Commandes Roo** uniquement référencées dans `AGENTS.md`, jamais dans `index.md`.

<details>
<summary>Voir le reste du document détaillé</summary>
[Consulter le contenu complet](`prompts/hard_points/ai-kido_details.md`)
</details>
