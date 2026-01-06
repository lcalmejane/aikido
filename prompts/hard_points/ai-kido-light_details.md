# AI-KIDO LIGHT - Guide Pratique pour Bases Légères

> **Version**: 1.3.1-LIGHT | **Usage**: Configuration allégée d'AI-KIDO pour agents unitaires
>
> Ce document définit les règles spécifiques pour l'initialisation et la gestion d'une base AI-KIDO en mode LIGHT.

## RÉFÉRENCE AU STANDARD

Ce document est une **spécialisation** de [`ai-kido.md`](ai-kido.md). Toutes les règles du standard s'appliquent, sauf celles explicitement redéfinies ci-dessous pour le mode LIGHT.

**PRÉFIX DE PROMPT GENERAL**:

```
Sauf pour les agents internes "agent-aikido-*",Après analyse de la question et avant d'y répondre, utiliser le fichier prompts/index.md pour faire un parcours recursif pertinent afin de récupérer les infos strictement utiles à la compréhension de la demande.
```

**EXCEPTIONS**: Ce pré-prompt ne s'applique PAS :

- Aux agents internes AI-KIDO (préfixe `agent-aikido-*`) qui possèdent déjà les règles nécessaires

**PRINCIPE FONDAMENTAL**: Une base LIGHT privilégie la **densité maximale** et le **minimum de fichiers** pour approcher la notion d'**agent unitaire** définie dans [`AGENTS.md`](../../AGENTS.md).

## CARACTÉRISTIQUES D'UNE BASE LIGHT

### Objectifs du Mode Light

1. **Légèreté**: Minimum de fichiers, maximum d'efficacité
2. **Densité**: Information maximale par fichier
3. **Simplicité**: Structure réduite au strict nécessaire
4. **Agent Unitaire**: Approche mono-agent ou multi-agents très restreint
5. **Rapidité**: Temps de parcours minimal pour le LLM

### Différences avec le Mode Standard

| Aspect | Mode Standard | Mode Light |
|--------|--------------|------------|
| **Fichiers concepts** | Multiple fichiers thématiques | 1 seul fichier unifié |
| **Fichiers techniques** | Multiple fichiers par domaine | 1 seul fichier unifié |
| **Personas** | 6-12 personas spécialisés | 3-5 personas maximum |
| **Use cases** | 8-15 cas d'usage | 3-5 cas d'usage maximum |
| **RACI** | Matrice complète multi-acteurs | Acteur unique ou minimal (optionnel) |
| **Profondeur arbre** | 3-4 niveaux | 2-3 niveaux maximum |
| **Hard points** | Structure complète | Structure minimale |

## RÈGLES ARCHITECTURALES ADAPTÉES

### Règles Modifiées pour Mode Light

Les règles suivantes de [`ai-kido.md`](ai-kido.md) sont **adaptées** pour le mode LIGHT:

1. **🌳 Arborescence Simplifiée**: Parcours réduit depuis [`/prompts/index.md`](../index.md)
2. **📊 Fusion Théorie/Pratique**: Possibilité de fusionner `concepts/` et `techniques/` en fichiers uniques
3. **⚖️ Arbre Minimal**: Facteur 2-4 enfants/parent, profondeur ≤ 3 niveaux
4. **👥 Agents Restreints**: 3-5 personas maximum, approche agent unitaire privilégiée
5. **🎭 Agent Unique**: Pas d'orchestrateur nécessaire en mode light
6. **👨‍💼 RACI Optionnel**: Acteur unique ou RACI minimal (2-3 rôles max)


## STRUCTURE OBLIGATOIRE MODE LIGHT

### Structure Unifiée Light (V1.3+)

**CHANGEMENT MAJEUR V1.3** : Point d'entrée unique `/prompts/index.md` pour mono ET multi-projets light.

```
/prompts/
├── index.md                    # 🎯 POINT D'ENTRÉE UNIQUE - TOUJOURS CONSULTER EN PREMIER
├── gen/                        # Connaissances collectives - VERSION LIGHT
│   ├── concepts/               # 1 SEUL fichier unifié recommandé
│   │   └── core-concepts.md    # Tous les concepts fusionnés
│   ├── techniques/             # 1 SEUL fichier unifié recommandé
│   │   └── core-techniques.md  # Toutes les techniques fusionnées
│   ├── personas/               # 3-5 personas MAXIMUM
│   │   ├── index.md
│   │   ├── persona-1.md
│   │   ├── persona-2.md
│   │   └── persona-3.md        # (optionnels: 4 et 5)
│   └── use_cases/              # 3-5 cas d'usage MAXIMUM
│       ├── index.md
│       ├── use-case-1.md
│       ├── use-case-2.md
│       └── use-case-3.md       # (optionnels: 4 et 5)
├── hard_points/                # Vérités immuables - VERSION MINIMALE
│   ├── index.md                # Index des hard points
│   ├── ai-kido-light.md        # Ce fichier
│   └── [1-3 hard points max]   # Contraintes critiques uniquement
└── spec/                       # Espaces personnels (optionnel)
    └── logs/                   # Logs si LLM_TRACIBILITY=TRUE
```

### Structure Multi-Projet Light (V1.3+)

```
/prompts/
├── index.md                    # 🎯 POINT D'ENTRÉE UNIQUE - Agrège tous les projets
│                               #    Pointe vers /prompts/[projet-1]/index.md, /prompts/[projet-2]/index.md, etc.
├── [projet-1]/
│   ├── index.md                # 📚 Point d'entrée projet-1 (référence gen/, hard_points/)
│   ├── gen/                    # Connaissances projet-1 (light)
│   │   ├── index.md            # Navigateur interne gen/ projet-1
│   │   ├── concepts/core-concepts.md
│   │   ├── techniques/core-techniques.md
│   │   ├── personas/           # 3-5 max
│   │   └── use_cases/          # 3-5 max
│   └── hard_points/            # 1-3 max
├── [projet-2]/
│   ├── index.md                # 📚 Point d'entrée projet-2
│   └── gen/...                 # Idem light pour projet-2
└── spec/                       # Espaces personnels
```

**Navigation Multi-Projet Light** :

1. `/prompts/index.md` → Liste et pointe tous les projets
2. `/prompts/[projet-n]/index.md` → Point d'entrée spécifique du projet
3. `/prompts/[projet-n]/gen/index.md` → Navigation interne du projet

## RÈGLES DE CRÉATION MODE LIGHT

### Fusion des Fichiers Concepts et Techniques

**PRINCIPE**: Privilégier UN SEUL fichier par catégorie pour maximiser la densité.

#### Structure du Fichier Unifié Concepts

```markdown
# Concepts Fondamentaux - Base Light
> Version: X.Y | Date: YYYY-MM-DD | Mode: LIGHT

## Vue d'ensemble
[Vision globale du projet en 2-3 paragraphes maximum]

## Concepts Clés
### Concept 1: [Nom]
[Description ultra-dense avec schéma Mermaid si pertinent]

### Concept 2: [Nom]
[Description ultra-dense avec schéma Mermaid si pertinent]

### Concept 3: [Nom]
[Description ultra-dense avec schéma Mermaid si pertinent]

## Glossaire Essentiel
[Uniquement les 10-15 termes les plus critiques]

## Relations et Dépendances
[Schéma Mermaid de synthèse]
```

#### Structure du Fichier Unifié Techniques

```markdown
# Techniques Pratiques - Base Light
> Version: X.Y | Date: YYYY-MM-DD | Mode: LIGHT

## Vue d'ensemble
[Approche technique globale en 2-3 paragraphes]

## Techniques Essentielles
### Technique 1: [Nom]
[Méthode + exemple concret en format ultra-dense]

### Technique 2: [Nom]
[Méthode + exemple concret en format ultra-dense]

### Technique 3: [Nom]
[Méthode + exemple concret en format ultra-dense]

## Patterns et Best Practices
[Liste condensée des patterns critiques]

## Stack Technique
[Technologies essentielles uniquement]
```

### Personas en Mode Light

**CONTRAINTE**: 3-5 personas MAXIMUM
**PRINCIPE**: Le RACI est **optionnel** ou **minimal** en mode light.
## WORKFLOW LIGHT ADAPTÉ
### Workflow Standard LLM en Mode Light

1. **LOGS**: Log si LLM_TRACIBILITY=TRUE (optionnel en light)
2. **ANALYSE**: Identifier le domaine (simplifié)
3. **CONSULTATION**: Vérifier [`/prompts/index.md`](../index.md) (version light)
4. **FICHIERS UNIFIÉS**: Consulter `core-concepts.md` et `core-techniques.md`
5. **HARD POINTS**: Contrôler les 1-3 contraintes critiques
6. **PERSONA**: Adopter un des 3-5 personas disponibles
7. **RÉPONSE**: Générer selon standards (densité maximale)
8. **VALIDATION**: Vérifier cohérence (simplifiée)

### Optimisations Spécifiques Mode Light

- **Parcours Réduit**: Moins de fichiers à consulter
- **Décisions Rapides**: Moins de contexte à analyser
- **Réponses Directes**: Moins de validation croisée nécessaire
- **Tokens Économisés**: Structure minimale = moins de tokens

## INITIALISATION D'UNE BASE LIGHT

### Commande d'Initialisation

La commande d'initialisation doit proposer le choix entre mode STANDARD et mode LIGHT:

```bash
# Exemple de prompt d'initialisation
Quel mode AI-KIDO souhaitez-vous initialiser ?
1. Mode STANDARD (structure complète, multi-agents)
2. Mode LIGHT (structure minimale, agent unitaire)

Choix: [1/2]
```

### Création Automatique en Mode Light

Lors de l'initialisation en mode LIGHT, créer automatiquement:

1. **Structure minimale**:
   - `/prompts/index.md` (point d'entrée unique V1.3)
   - `/prompts/gen/concepts/core-concepts.md`
   - `/prompts/gen/techniques/core-techniques.md`
   - `/prompts/gen/personas/index.md` + 3 personas de base
   - `/prompts/gen/use_cases/index.md` + 3 use cases de base

2. **Hard points minimaux**:
   - `/prompts/hard_points/index.md` (version light)
   - `/prompts/hard_points/ai-kido-light.md` (ce fichier)

3. **AGENTS.md**: Version light avec 3-5 agents maximum

### Migration Standard → Light

Pour convertir une base standard en light:

1. **Fusionner** les fichiers concepts en `core-concepts.md`
2. **Fusionner** les fichiers techniques en `core-techniques.md`
3. **Réduire** les personas à 3-5 maximum (fusion des rôles)
4. **Réduire** les use cases à 3-5 maximum (cas critiques)
5. **Simplifier** ou supprimer le RACI si acteur unique
6. **Mettre à jour** `AGENTS.md` avec la structure light

## MÉTRIQUES DE QUALITÉ MODE LIGHT

### Métriques Spécifiques

- **Nombre de Fichiers**: ≤ 15 fichiers total dans `/prompts/gen/`
- **Nombre de Personas**: 3-5 maximum
- **Nombre de Use Cases**: 3-5 maximum
- **Profondeur Arbre**: ≤ 3 niveaux
- **Densité par Fichier**: > 80% d'information utile
- **Temps de Parcours LLM**: < 50% du mode standard

### Validation de Conformité Light

**Checklist de Validation**:

- ✅ Fichiers concepts fusionnés ou ≤ 3 fichiers
- ✅ Fichiers techniques fusionnés ou ≤ 3 fichiers
- ✅ 3-5 personas maximum
- ✅ 3-5 use cases maximum
- ✅ RACI absent ou minimal (≤ 3 rôles)
- ✅ Hard points ≤ 3 fichiers
- ✅ Profondeur arbre ≤ 3 niveaux
- ✅ Densité sémantique maximale

## QUAND UTILISER LE MODE LIGHT

### Cas d'Usage Recommandés

**Mode LIGHT est recommandé pour**:

- Projets solo ou petites équipes (1-3 personnes)
- Prototypes et POCs
- Microservices unitaires
- Scripts et outils simples
- Projets avec scope bien défini et limité
- Contextes nécessitant rapidité d'exécution LLM

**Mode STANDARD est recommandé pour**:

- Grandes équipes (4+ personnes)
- Projets complexes multi-domaines
- Applications enterprise
- Systèmes distribués complexes
- Projets nécessitant forte traçabilité
- Contextes multi-stakeholders

## ÉVOLUTION D'UNE BASE LIGHT

### Passage Light → Standard

Une base light peut évoluer vers le standard si:

- L'équipe grandit (> 3 personnes)
- La complexité augmente significativement
- Le besoin de spécialisation émerge
- Le RACI devient nécessaire

**Processus de Migration**:

1. Identifier les besoins de spécialisation
2. Éclater `core-concepts.md` en fichiers thématiques
3. Éclater `core-techniques.md` en fichiers par domaine
4. Ajouter des personas spécialisés (jusqu'à 12)
5. Enrichir les use cases (jusqu'à 15)
6. Créer la matrice RACI complète
7. Mettre à jour vers [`ai-kido.md`](ai-kido.md) standard

### Maintien en Mode Light

Pour maintenir une base en mode light:

- **Résister à la tentation** d'ajouter des fichiers
- **Fusionner** plutôt que créer de nouveaux fichiers
- **Densifier** le contenu existant
- **Supprimer** ce qui devient obsolète
- **Valider régulièrement** la conformité light

## COMPATIBILITÉ AVEC AGENTS.MD

### Structure AGENTS.md en Mode Light

```markdown
# AI Agents Configuration - Light Mode

## Project Context
- **Project Name**: [Lien vers /prompts/index.md]
- **Mode**: LIGHT (Agent Unitaire / Multi-agents Minimal)
- **Architecture**: [Lien vers /prompts/gen/concepts/core-concepts.md]
- **Tech Stack**: [Lien vers /prompts/gen/techniques/core-techniques.md]

## Available Agents (3-5 Maximum)

### Agent 1: [Nom]
[Lien vers /prompts/gen/personas/agent-1.md]
**Responsabilités**: [Liste des domaines couverts]

### Agent 2: [Nom]
[Lien vers /prompts/gen/personas/agent-2.md]
**Responsabilités**: [Liste des domaines couverts]

### Agent 3: [Nom]
[Lien vers /prompts/gen/personas/agent-3.md]
**Responsabilités**: [Liste des domaines couverts]

## Agent Interaction (Optionnel en Light)
[Matrice RACI minimale si applicable, sinon "Agent Unitaire"]

## Usage Guidelines
[Lien vers /prompts/gen/use_cases/index.md - 3-5 cas maximum]
```

## RÈGLES CRITIQUES MODE LIGHT

### Règles Non Négociables

1. **Maximum 5 Personas**: Jamais plus, fusion obligatoire si dépassement
2. **Maximum 5 Use Cases**: Sélection des cas critiques uniquement
3. **Fichiers Unifiés Privilégiés**: 1 fichier concepts + 1 fichier techniques recommandé
4. **Densité Maximale**: Chaque mot doit apporter de la valeur
5. **RACI Optionnel**: Acteur unique ou minimal (≤ 3 rôles)
6. **Profondeur ≤ 3**: Arborescence plate privilégiée
7. **Hard Points Minimaux**: ≤ 3 contraintes critiques

### Signaux d'Alerte

**Une base light doit être revue si**:

- Nombre de fichiers > 15 dans `/prompts/gen/`
- Nombre de personas > 5
- Nombre de use cases > 5
- Profondeur arbre > 3 niveaux
- RACI avec > 3 rôles
- Temps de parcours LLM > 50% du standard

**Action**: Soit densifier/fusionner, soit migrer vers mode standard.

---

**RAPPEL CRITIQUE**: Le mode LIGHT privilégie la **densité** et la **simplicité**. Toute complexification doit être justifiée ou doit déclencher une migration vers le mode STANDARD.
**RAPPEL CRITIQUE**: Les agents internes `agent-aikido-*` reviennent toujours au mode ou à l'agent qui les a appelés en exécutant `switch_mode` avec le `mode_slug` du caller. Les retours entre modes/agents internes se font au format JSON.(il ne peux pas s'invoquer lui-même de manière autonome).il faut toujours nomer les agents internes au complet avec le préfixe `agent-aikido-`

**RÉFÉRENCE**: Pour les règles complètes, consulter [`ai-kido.md`](ai-kido.md).
