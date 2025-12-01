---
description: "Analyse et met à jour le fichier CLAUDE.md en fonction de la Memory Bank AI-KIDO et des concepts CLAUDE.md"
---

# Commande Check-Claude

Analyse l'état actuel de la Memory Bank AI-KIDO et met à jour le fichier [`CLAUDE.md`](../../CLAUDE.md) pour refléter le mapping réel entre votre structure et la norme CLAUDE.md. Génère également les fichiers de mapping pour Claude Code (`.claude/agents/` et `.claude/commands/`).

## Objectif

Maintenir la synchronisation entre :
- La structure réelle de votre Memory Bank dans `/prompts/gen/`
- Les personas dans `/prompts/gen/personas/` → `.claude/agents/`
- Les commandes dans `.roo/commands/` → `.claude/commands/`
- Le fichier `AGENTS.md`
- La documentation de mapping dans `CLAUDE.md`
- La compatibilité avec Claude Code (via fichiers `.claude/`)

## Exécution

### Phase 1 : Analyse de la Memory Bank AI-KIDO

#### 1.1 Détection du Mode AI-KIDO

**Lire** [`/prompts/gen/index.md`](../../prompts/gen/index.md) pour identifier le mode actuel :

```
🔍 DÉTECTION DU MODE AI-KIDO

Mode détecté : [STANDARD/LIGHT]
Référence : [ai-kido.md / ai-kido-light.md]
```

#### 1.2 Inventaire des Concepts

**Scanner** `/prompts/gen/concepts/` :

```
📊 ANALYSE DES CONCEPTS

Concepts détectés : [NOMBRE]
Fichiers :
- [Liste des fichiers .md]

Structure par rôles :
- /concepts/roles/ : [OUI/NON]
- Rôles identifiés : [LISTE si applicable]

Conformité Règle 4 (≤500 lignes) : [POURCENTAGE]%
Fichiers dépassant 500 lignes : [LISTE si applicable]
```

#### 1.3 Inventaire des Techniques

**Scanner** `/prompts/gen/techniques/` :

```
🔧 ANALYSE DES TECHNIQUES

Techniques détectées : [NOMBRE]
Fichiers :
- [Liste des fichiers .md]

Structure par rôles :
- /techniques/roles/ : [OUI/NON]
- Rôles identifiés : [LISTE si applicable]

Conformité Règle 4 (≤500 lignes) : [POURCENTAGE]%
```

#### 1.4 Inventaire des Personas

**Scanner** `/prompts/gen/personas/` :

```
🤖 ANALYSE DES PERSONAS

Personas détectés : [NOMBRE]
Fichiers :
- [Liste avec slug, nom, spécialisation]

Synchronisation avec .roomodes : [POURCENTAGE]%
Personas non synchronisés : [LISTE si applicable]
```

#### 1.5 Inventaire des Use Cases

**Scanner** `/prompts/gen/use_cases/` :

```
📋 ANALYSE DES USE CASES

Use cases détectés : [NOMBRE]
Fichiers :
- [Liste des fichiers .md]

Structure par rôles :
- /use_cases/roles/ : [OUI/NON]
```

#### 1.6 Inventaire des Commandes

**Scanner** `.roo/commands/` :

```
⚡ ANALYSE DES COMMANDES

Commandes détectées : [NOMBRE]
Fichiers :
- [Liste des fichiers .md]

Commandes AI-KIDO spécifiques :
- init-aikido : [OUI/NON]
- create-persona : [OUI/NON]
- analyse-project : [OUI/NON]
- analyse-aikido : [OUI/NON]
- maj-aikido : [OUI/NON]
- init-glossaire : [OUI/NON]
- check-claude : [OUI/NON]

Namespaces détectés : [LISTE si applicable]
```

#### 1.7 Analyse des Hard Points

**Scanner** `/prompts/hard_points/` :

```
🔒 ANALYSE DES HARD POINTS

Hard points détectés : [NOMBRE]
Fichiers critiques :
- ai-kido.md : [OUI/NON]
- ai-kido-light.md : [OUI/NON]
- gestion-logs-aikido.md : [OUI/NON]

Spécifications RACI :
- Fichiers aikido-raci-*.md : [NOMBRE]
- Organisations configurées : [LISTE]
```

#### 1.8 Analyse AGENTS.md

**Lire** [`AGENTS.md`](../../AGENTS.md) :

```
📄 ANALYSE AGENTS.MD

Fichier existe : [OUI/NON]
Mode déclaré : [STANDARD/LIGHT/NON SPÉCIFIÉ]
Nombre d'agents listés : [NOMBRE]

Conformité Règle 16 (pas de duplication) : [OUI/NON]
Conformité Règle 17 (correspondance 1:1) : [POURCENTAGE]%
Conformité Règle 18 (structure standard) : [OUI/NON]

Agents sans persona correspondant : [LISTE si applicable]
Personas sans agent correspondant : [LISTE si applicable]
```

### Phase 2 : Détection des Écarts et Incohérences

#### 2.1 Écarts de Structure

**Comparer** la structure réelle avec les attentes CLAUDE.md :

```
⚠️ ÉCARTS DÉTECTÉS

Structure attendue vs réelle :
- Skills (Concepts+Techniques) : [CONFORME/ÉCART]
- Subagents (Personas) : [CONFORME/ÉCART]
- Commands : [CONFORME/ÉCART]
- Resources (Hard Points+Use Cases) : [CONFORME/ÉCART]

Détails des écarts :
[Liste des différences]
```

#### 2.2 Incohérences de Mapping

**Identifier** les incohérences :

```
🔍 INCOHÉRENCES DE MAPPING

Concepts sans technique correspondante : [LISTE]
Techniques sans concept correspondant : [LISTE]
Personas non référencés dans AGENTS.md : [LISTE]
Agents dans AGENTS.md sans persona : [LISTE]
Use cases orphelins (non liés) : [LISTE]
Commandes non documentées : [LISTE]
```

#### 2.3 Violations des Règles AI-KIDO

**Vérifier** la conformité aux règles :

```
📏 CONFORMITÉ AUX RÈGLES AI-KIDO

Règle 1 (Point d'entrée unique) : [CONFORME/NON CONFORME]
Règle 2 (Séparation théorie/pratique) : [POURCENTAGE]%
Règle 4 (≤500 lignes) : [POURCENTAGE]%
Règle 6 (Liens bidirectionnels) : [POURCENTAGE]%
Règle 7 (Équilibrage 3-7, ≤4 niveaux) : [CONFORME/NON CONFORME]
Règle 8 (Hard Points prioritaires) : [CONFORME/NON CONFORME]
Règle 15 (Répartition par rôles) : [APPLICABLE/NON APPLICABLE] - [CONFORME/NON CONFORME]
Règles 16-18 (AGENTS.md) : [CONFORME/NON CONFORME]

Violations critiques : [NOMBRE]
Violations mineures : [NOMBRE]
```

### Phase 3 : Génération du Rapport de Mapping

#### 3.1 Statistiques Globales

**Calculer** les métriques :

```
📊 STATISTIQUES GLOBALES

Memory Bank AI-KIDO :
- Concepts : [NOMBRE] fichiers
- Techniques : [NOMBRE] fichiers
- Personas : [NOMBRE] fichiers
- Use Cases : [NOMBRE] fichiers
- Hard Points : [NOMBRE] fichiers
- Commandes : [NOMBRE] fichiers

Équivalence CLAUDE.md :
- Skills (Concepts+Techniques) : [NOMBRE] équivalents
- Subagents (Personas) : [NOMBRE] équivalents
- Slash Commands : [NOMBRE] équivalents
- Resources : [NOMBRE] équivalents

Taux de couverture : [POURCENTAGE]%
Taux de conformité : [POURCENTAGE]%
```

#### 3.2 Matrice de Correspondance

**Générer** la matrice de mapping :

```markdown
## Matrice de Correspondance Actuelle

| Élément AI-KIDO | Type | Équivalent CLAUDE.md | Statut | Notes |
|-----------------|------|---------------------|--------|-------|
| [concept-1.md] | Concept | Skill (théorie) | ✅ Mappé | [Notes] |
| [technique-1.md] | Technique | Skill (pratique) | ✅ Mappé | [Notes] |
| [persona-1.md] | Persona | Subagent | ✅ Mappé | [Notes] |
| [command-1.md] | Command | Slash Command | ✅ Mappé | [Notes] |
| [use-case-1.md] | Use Case | Resource | ✅ Mappé | [Notes] |
| [hard-point-1.md] | Hard Point | Resource | ✅ Mappé | [Notes] |
```

#### 3.3 Graphe de Dépendances

**Générer** un diagramme Mermaid des relations :

```mermaid
graph TB
    subgraph "AI-KIDO Memory Bank"
        Index[/prompts/gen/index.md]
        Concepts[/prompts/gen/concepts/]
        Techniques[/prompts/gen/techniques/]
        Personas[/prompts/gen/personas/]
        UseCases[/prompts/gen/use_cases/]
        HardPoints[/prompts/hard_points/]
        Commands[.roo/commands/]
    end
    
    subgraph "CLAUDE.md Équivalents"
        Skills[Skills]
        Subagents[Subagents]
        SlashCommands[Slash Commands]
        Resources[Resources]
    end
    
    Concepts -->|théorie| Skills
    Techniques -->|pratique| Skills
    Personas -->|1:1| Subagents
    Commands -->|100%| SlashCommands
    UseCases -->|exemples| Resources
    HardPoints -->|contraintes| Resources
    
    Index -.->|navigation| Concepts
    Index -.->|navigation| Techniques
    Index -.->|navigation| Personas
    Index -.->|navigation| UseCases
```

### Phase 4 : Mise à Jour du Fichier CLAUDE.md

#### 4.1 Sauvegarde de l'Existant

**Créer** une sauvegarde avant modification :

```
💾 SAUVEGARDE

Fichier sauvegardé : CLAUDE.md.backup.[TIMESTAMP]
```

#### 4.2 Mise à Jour des Sections

**Mettre à jour** les sections suivantes dans [`CLAUDE.md`](../../CLAUDE.md) :

##### Section 10 : Tableau de Correspondance Complet

Remplacer par la matrice de correspondance actuelle générée en Phase 3.2.

##### Section 11 : Exemples Pratiques

Mettre à jour avec des exemples réels basés sur les fichiers détectés :

```markdown
### 11.1 Exemple Complet : [Premier Concept Détecté]

#### CLAUDE.md Structure Équivalente
[Structure théorique]

#### AI-KIDO Structure Réelle
```
[Structure réelle détectée]
```

#### Fichiers Correspondants
- Concept : [chemin réel]
- Technique : [chemin réel]
- Persona : [chemin réel si applicable]
- Use Case : [chemin réel si applicable]
```

##### Nouvelle Section 13 : État Actuel de la Memory Bank

Ajouter une nouvelle section avec l'état actuel :

```markdown
## 13. État Actuel de la Memory Bank (Généré automatiquement)

> **Dernière analyse** : [DATE ET HEURE]
> **Mode AI-KIDO** : [STANDARD/LIGHT]
> **Conformité globale** : [POURCENTAGE]%

### 13.1 Inventaire Complet

#### Concepts ([NOMBRE])
[Liste avec liens]

#### Techniques ([NOMBRE])
[Liste avec liens]

#### Personas ([NOMBRE])
[Liste avec liens]

#### Use Cases ([NOMBRE])
[Liste avec liens]

#### Commandes ([NOMBRE])
[Liste avec liens]

### 13.2 Métriques de Qualité

- **Conformité Règle 4** (≤500 lignes) : [POURCENTAGE]%
- **Conformité Règle 6** (Liens bidirectionnels) : [POURCENTAGE]%
- **Conformité Règle 7** (Équilibrage) : [CONFORME/NON CONFORME]
- **Conformité Règles 16-18** (AGENTS.md) : [POURCENTAGE]%

### 13.3 Recommandations

[Liste des actions recommandées basées sur les écarts détectés]

---
*Section générée automatiquement par check-claude le [DATE ET HEURE]*
```

#### 4.3 Mise à Jour des Diagrammes

**Régénérer** les diagrammes Mermaid avec les données réelles :

- Section 1 : Philosophie de Mapping (mise à jour des nœuds)
- Section 5.2 : Workflow AI-KIDO Enrichi (mise à jour avec fichiers réels)
- Section 11.2 : Workflow Complet (mise à jour avec chemins réels)

#### 4.4 Mise à Jour des Statistiques

**Actualiser** toutes les statistiques dans le document :

- Nombre de concepts/techniques/personas/use cases/commandes
- Pourcentages de conformité
- Métriques de qualité

### Phase 5 : Synchronisation AGENTS.md

#### 5.1 Vérification de la Conformité

**Vérifier** que [`AGENTS.md`](../../AGENTS.md) respecte les règles 16-18 :

```
🔍 VÉRIFICATION AGENTS.MD

Règle 16 (Interface unique) : [CONFORME/NON CONFORME]
- Duplication de contenu : [OUI/NON]
- Liens exclusifs vers /prompts/gen/ : [OUI/NON]

Règle 17 (Bidirectionnalité) : [CONFORME/NON CONFORME]
- Agents sans persona : [LISTE]
- Personas sans agent : [LISTE]

Règle 18 (Structure standard) : [CONFORME/NON CONFORME]
- Sections manquantes : [LISTE]
```

#### 5.2 Proposition de Corrections

**Si non conforme**, proposer les corrections :

```
🔧 CORRECTIONS PROPOSÉES POUR AGENTS.MD

1. Supprimer les duplications de contenu
2. Ajouter les liens manquants vers /prompts/gen/personas/
3. Créer les sections manquantes :
   - [Liste des sections à ajouter]
4. Synchroniser la liste des agents avec les personas existants

Appliquer ces corrections ? (o/n) :
```

#### 5.3 Application des Corrections

**Si accepté**, mettre à jour [`AGENTS.md`](../../AGENTS.md) automatiquement.

### Phase 5bis : Génération des Fichiers Agents Individuels

#### 5bis.1 Création du Répertoire .claude/agents/

**Objectif** : Créer des fichiers agents individuels pour que la commande `/agents` de Claude Code les reconnaisse

**Créer le répertoire** si inexistant :
```bash
mkdir -p .claude/agents/
```

#### 5bis.2 Génération des Fichiers Agents

**Pour chaque persona dans `/prompts/gen/personas/`** :

1. **Extraire les métadonnées** :
   - Slug du persona depuis le nom de fichier (ex: `expert-fonctionnel-ba.md` → `expert-fonctionnel-ba`)
   - Description depuis `.roomodes` ou première ligne du fichier persona
   - Contenu intégral du fichier persona

2. **Créer** un fichier `.claude/agents/[nom-agent].md` avec la structure suivante :

```markdown
---
name: [nom-agent]
description: [Description courte sur une seule ligne depuis .roomodes ou fichier persona]
---

[Contenu complet du persona chargé depuis prompts/gen/personas/[nom-agent].md]
```

**IMPORTANT** : Le fichier agent doit :
- Avoir un front-matter YAML simple avec `name` et `description` (description sur **une seule ligne**)
- Charger **intégralement** le contenu du fichier persona depuis `/prompts/gen/personas/`
- La description doit finir par `\n` (un seul retour à la ligne après les `---` de fermeture du front-matter)

**Algorithme de génération (scan dynamique)** :
1. **Scanner dynamiquement** tous les fichiers `.md` dans `/prompts/gen/personas/` (sauf `index.md`)
   - Utiliser `find` ou `glob` pour lister les fichiers au moment de l'exécution
   - Ne pas partir d'une liste figée ou prédéfinie
2. Pour chaque fichier persona détecté :
   - Extraire le slug depuis le nom de fichier (ex: `expert-ba.md` → `expert-ba`)
   - Extraire la description depuis `.roomodes` (si disponible) ou depuis le titre du fichier
   - Lire le contenu intégral du fichier persona
3. Créer le fichier agent `.claude/agents/[slug].md` avec :
   - Front-matter YAML (name + description sur 1 ligne)
   - Un saut de ligne unique après `---`
   - Le contenu intégral du persona

**Important** : La liste des personas n'est PAS codée en dur. Elle est découverte à chaque exécution.

**Exemple concret** :
```markdown
---
name: expert-fonctionnel
description: Expert Fonctionnel - Méta-persona avec compétences transversales (analyse métier, facilitation, RGAA, SEO, Opquast, Analytics)
---

# Méta-Persona : Expert Fonctionnel
> Version: 2.0 | Date: 2025-10-07 | Statut: MÉTA-PERSONA AI-KIDO ACTIF

## Vue d'ensemble
**Persona chapeau des "Experts Fonctionnels"** regroupant les compétences...

[... reste du contenu du fichier prompts/gen/personas/expert-fonctionnel.md ...]
```

3. **Validation** :
- ✅ Un fichier par persona dans `.claude/agents/`
- ✅ Front-matter YAML valide avec `name` et `description` sur 1 ligne
- ✅ Description termine par `\n` (un seul retour à la ligne)
- ✅ Contenu intégral du persona chargé depuis `/prompts/gen/personas/`
- ✅ Synchronisation 1:1 avec les fichiers dans `/prompts/gen/personas/`

#### 5bis.3 Vérification de la Détection et Synchronisation

**Vérifier la cohérence** entre :
1. `/prompts/gen/personas/*.md` (source de vérité)
2. `.roomodes` (configuration Roo-Code)
3. `AGENTS.md` (interface standardisée)
4. `.claude/agents/*.md` (fichiers agents pour Claude Code)

**Matrice de synchronisation** :

**Scanner dynamiquement** :
1. Lister tous les fichiers `.md` dans `/prompts/gen/personas/` (sauf `index.md`)
2. Pour chaque fichier détecté, vérifier la présence dans :
   - `.roomodes` (si le fichier existe)
   - `AGENTS.md` (si le fichier existe)
   - `.claude/agents/`
3. Générer une matrice avec les résultats

Exemple de format :
| Persona | /prompts/gen/personas/ | .roomodes | AGENTS.md | .claude/agents/ |
|---------|------------------------|-----------|-----------|-----------------|
| [nom-1] | ✅ | [✅/❌/N/A] | [✅/❌/N/A] | [✅/❌] |
| [nom-2] | ✅ | [✅/❌/N/A] | [✅/❌/N/A] | [✅/❌] |
| ... | ... | ... | ... | ... |

**Alertes si désynchronisation** :
- ⚠️ Persona dans /prompts/gen/personas/ mais absent de .claude/agents/
- ⚠️ Agent dans .claude/agents/ mais fichier persona introuvable
- ⚠️ Incohérence description entre .roomodes et fichier agent

**Afficher le résultat** :

```
🔧 GÉNÉRATION .CLAUDE/AGENTS/

Scanner /prompts/gen/personas/ : [NOMBRE] fichier(s) détecté(s)

Fichiers agents créés : [NOMBRE]
[Liste dynamique générée depuis le scan]
- [persona-1].md : ✅
- [persona-2].md : ✅
- ...

Répertoire : .claude/agents/
Validation YAML : [✅ Valide / ❌ Erreur]
Synchronisation avec /prompts/gen/personas/ : [✅ 100% / ⚠️ Désynchronisé]

💡 Les agents sont maintenant disponibles via la commande /agents dans Claude Code
```

**Note importante** : Ces fichiers chargent **intégralement** le contenu des personas depuis `/prompts/gen/personas/`, assurant que l'agent dispose du contexte complet du persona lors de son activation.

### Phase 5ter : Génération des Fichiers Commands Individuels

#### 5ter.1 Création du Répertoire .claude/commands/

**Objectif** : Créer des fichiers de commandes pour que Claude Code les reconnaisse via la commande `/list`

**Créer le répertoire** si inexistant :
```bash
mkdir -p .claude/commands/
```

#### 5ter.2 Génération des Fichiers Commands

**Pour chaque commande dans `.roo/commands/`** :

1. **Extraire les métadonnées** :
   - Nom de la commande depuis le nom de fichier (ex: `check-claude.md` → `check-claude`)
   - Description depuis le front-matter YAML `description` du fichier `.roo/commands/*.md`

2. **Créer** un fichier `.claude/commands/[nom-commande].md` avec la structure suivante :

```markdown
---
description: [Description courte sur une seule ligne depuis .roo/commands/[nom-commande].md]
---

# Commande [nom-commande]

Cette commande exécute le fichier de commande complet depuis `.roo/commands/[nom-commande].md`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

\`\`\`
Lecture de .roo/commands/[nom-commande].md et exécution des instructions...
\`\`\`
```

**IMPORTANT** : Le fichier commande doit :
- Avoir un front-matter YAML simple avec `description` (description sur **une seule ligne**)
- La description doit se terminer par `\n\n` (deux retours à la ligne après les `---` de fermeture du front-matter)
- **NE PAS dupliquer le contenu** - seulement référencer dynamiquement `.roo/commands/[nom-commande].md`
- Instruire Claude Code de lire et exécuter le fichier source

**Instructions de génération (scan dynamique)** :

1. **Scanner dynamiquement** tous les fichiers `.md` dans `.roo/commands/`
   - Utiliser Glob ou Find pour lister les fichiers au moment de l'exécution
   - Ne JAMAIS partir d'une liste figée ou prédéfinie

2. **Pour chaque fichier détecté**, extraire :
   - Le nom du fichier (ex: `analyse-aikido.md`)
   - Le nom de la commande (ex: `analyse-aikido`)
   - La description depuis le front-matter YAML du fichier source

3. **Créer le fichier `.claude/commands/[nom].md` en respectant EXACTEMENT ce template** :

```
---
description: [DESCRIPTION_EXTRAITE_DU_FICHIER_SOURCE]
---
[LIGNE_VIDE_ICI]
# Commande [nom-de-la-commande]

Cette commande exécute le fichier de commande complet depuis `.roo/commands/[nom-fichier].md`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

```
Lecture de .roo/commands/[nom-fichier].md et exécution des instructions...
```
```

**RÈGLES STRICTES** :
- ✅ Respecter EXACTEMENT le template ci-dessus
- ✅ La description doit se terminer par `\n\n` (deux retours à la ligne après les `---` de fermeture)
- ✅ Remplacer uniquement les placeholders entre crochets
- ✅ Conserver la structure, les titres, le texte exact
- ❌ NE JAMAIS dupliquer le contenu du fichier source
- ❌ NE JAMAIS modifier le template ou ajouter du contenu supplémentaire

**Important** : La liste des commandes est découverte dynamiquement à chaque exécution.

**Exemple concret** :

Pour le fichier `.roo/commands/analyse-aikido.md` avec description :
```markdown
---
description: "Audit complet des tables de vérités AI-KIDO pour détecter dérivations, incohérences et liens cassés"
---
[... contenu complet ...]
```

Génère le fichier `.claude/commands/analyse-aikido.md` :
```markdown
---
description: "Audit complet des tables de vérités AI-KIDO pour détecter dérivations, incohérences et liens cassés"
---

# Commande analyse-aikido

Cette commande exécute le fichier de commande complet depuis `.roo/commands/analyse-aikido.md`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

\`\`\`
Lecture de .roo/commands/analyse-aikido.md et exécution des instructions...
\`\`\`
```

3. **Validation** :
- ✅ Un fichier par commande dans `.claude/commands/`
- ✅ Front-matter YAML valide avec `description` sur 1 ligne
- ✅ Description termine par `\n` (un seul retour à la ligne)
- ✅ Contenu intégral de la commande chargé depuis `.roo/commands/`
- ✅ Synchronisation 1:1 avec les fichiers dans `.roo/commands/`

#### 5ter.3 Vérification de la Détection et Synchronisation

**Vérifier la cohérence** entre :
1. `.roo/commands/*.md` (source de vérité)
2. `.claude/commands/*.md` (fichiers commandes pour Claude Code)

**Matrice de synchronisation** :

**Scanner dynamiquement** :
1. Lister tous les fichiers `.md` dans `.roo/commands/`
2. Pour chaque fichier détecté, vérifier la présence dans `.claude/commands/`
3. Générer une matrice avec les résultats

Exemple de format :
| Commande | .roo/commands/ | .claude/commands/ |
|----------|----------------|-------------------|
| [commande-1] | ✅ | [✅/❌] |
| [commande-2] | ✅ | [✅/❌] |
| ... | ... | ... |

**Alertes si désynchronisation** :
- ⚠️ Commande dans .roo/commands/ mais absente de .claude/commands/
- ⚠️ Commande dans .claude/commands/ mais fichier source introuvable
- ⚠️ Incohérence description entre les deux fichiers

**Afficher le résultat** :

```
🔧 GÉNÉRATION .CLAUDE/COMMANDS/

Scanner .roo/commands/ : [NOMBRE] fichier(s) détecté(s)

Fichiers commandes créés : [NOMBRE]
[Liste dynamique générée depuis le scan]
- [commande-1].md : ✅
- [commande-2].md : ✅
- ...

Répertoire : .claude/commands/
Validation YAML : [✅ Valide / ❌ Erreur]
Synchronisation avec .roo/commands/ : [✅ 100% / ⚠️ Désynchronisé]

💡 Les commandes sont maintenant disponibles via la commande /list dans Claude Code
```

**Note importante** : Ces fichiers **ne dupliquent pas le contenu** mais instruisent Claude Code de lire et exécuter dynamiquement le fichier source `.roo/commands/[nom].md`, évitant toute désynchronisation.

### Phase 6 : Génération du Rapport Final

#### 6.1 Rapport de Synthèse

**Créer** un rapport dans `/prompts/spec/check-claude-[DATE].md` :

```markdown
# Rapport Check-Claude - [DATE]

> Version: 1.0 | Date: [DATE ET HEURE] | Statut: Rapport d'Analyse

## Vue d'ensemble

**Mode AI-KIDO** : [STANDARD/LIGHT]
**Conformité globale** : [POURCENTAGE]%
**Fichier CLAUDE.md** : ✅ Mis à jour
**Fichier AGENTS.md** : [✅ Conforme / ⚠️ Corrigé / ❌ Non conforme]

## Statistiques

### Memory Bank AI-KIDO
- Concepts : [NOMBRE]
- Techniques : [NOMBRE]
- Personas : [NOMBRE]
- Use Cases : [NOMBRE]
- Hard Points : [NOMBRE]
- Commandes : [NOMBRE]

### Équivalence CLAUDE.md
- Skills équivalents : [NOMBRE]
- Subagents équivalents : [NOMBRE]
- Slash Commands : [NOMBRE]
- Resources : [NOMBRE]

### Conformité
- Règle 4 (≤500 lignes) : [POURCENTAGE]%
- Règle 6 (Liens bidirectionnels) : [POURCENTAGE]%
- Règle 7 (Équilibrage) : [CONFORME/NON CONFORME]
- Règles 16-18 (AGENTS.md) : [POURCENTAGE]%

## Écarts Détectés

### Écarts Critiques
[Liste des écarts critiques nécessitant action immédiate]

### Écarts Mineurs
[Liste des écarts mineurs pouvant être corrigés ultérieurement]

## Incohérences

### Concepts sans Technique
[Liste]

### Techniques sans Concept
[Liste]

### Personas non Synchronisés
[Liste]

### Liens Manquants
[Liste]

## Actions Effectuées

1. ✅ Analyse complète de la Memory Bank
2. ✅ Mise à jour du fichier CLAUDE.md
3. [✅/❌] Synchronisation AGENTS.md
4. ✅ Génération des fichiers agents individuels dans .claude/agents/
5. ✅ Génération des fichiers commandes individuels dans .claude/commands/
6. ✅ Génération de la matrice de correspondance
7. ✅ Mise à jour des diagrammes
8. ✅ Actualisation des statistiques

## Recommandations

### Actions Prioritaires
1. [Action 1 avec justification]
2. [Action 2 avec justification]
3. [Action 3 avec justification]

### Actions Secondaires
1. [Action 1]
2. [Action 2]

### Maintenance Continue
- Exécuter `/check-claude` après chaque modification majeure
- Exécuter `/maj-aikido` après chaque rebase git
- Exécuter `/analyse-aikido` mensuellement pour audit complet

## Matrice de Correspondance

[Matrice complète générée en Phase 3.2]

## Graphe de Dépendances

[Diagramme Mermaid généré en Phase 3.3]

---
*Rapport généré automatiquement par check-claude le [DATE ET HEURE]*
```

#### 6.2 Mise à Jour de l'Index

**Mettre à jour** [`/prompts/gen/index.md`](../../prompts/gen/index.md) avec référence au rapport :

```markdown
## Dernière Analyse CLAUDE.md

- **Date** : [DATE]
- **Conformité** : [POURCENTAGE]%
- **Rapport** : [check-claude-[DATE].md](../spec/check-claude-[DATE].md)
```

## Messages de Confirmation

### Succès - Analyse Complète

```
✅ Analyse CLAUDE.md terminée avec succès !

Fichiers mis à jour :
- CLAUDE.md (sections actualisées)
- AGENTS.md (synchronisé si nécessaire)
- .claude/agents/*.md (fichiers agents générés depuis personas)
- .claude/commands/*.md (fichiers commandes générés depuis .roo/commands/)
- /prompts/spec/check-claude-[DATE].md (rapport créé)
- /prompts/gen/index.md (référence ajoutée)

Fichiers agents créés dans .claude/agents/ :
[Liste dynamique générée depuis /prompts/gen/personas/]
- Nombre total : [NOMBRE] fichier(s)
- [persona-1].md ✅
- [persona-2].md ✅
- ...

Fichiers commandes créés dans .claude/commands/ :
[Liste dynamique générée depuis .roo/commands/]
- Nombre total : [NOMBRE] fichier(s)
- [commande-1].md ✅
- [commande-2].md ✅
- ...

Statistiques :
- Concepts : [NOMBRE]
- Techniques : [NOMBRE]
- Personas : [NOMBRE]
- Use Cases : [NOMBRE]
- Commandes : [NOMBRE]

Conformité globale : [POURCENTAGE]%

Écarts critiques : [NOMBRE]
Écarts mineurs : [NOMBRE]

📊 Rapport détaillé : /prompts/spec/check-claude-[DATE].md
```

### Avertissements

```
⚠️ ÉCARTS CRITIQUES DÉTECTÉS

Les écarts suivants nécessitent une attention immédiate :
1. [Écart 1]
2. [Écart 2]
3. [Écart 3]

Recommandations :
- Exécuter /analyse-aikido pour audit complet
- Corriger les violations des règles AI-KIDO
- Synchroniser AGENTS.md avec les personas

Voulez-vous voir le rapport détaillé ? (o/n)
```

## Options de Commande

### Commande Standard
```bash
/check-claude
```
Analyse complète avec mise à jour de CLAUDE.md et génération du rapport.

### Mode Rapport Seul
```bash
/check-claude --report-only
```
Génère le rapport sans modifier CLAUDE.md.

### Mode Dry-Run
```bash
/check-claude --dry-run
```
Simulation sans modifications, affiche ce qui serait fait.

### Mode Silencieux
```bash
/check-claude --silent
```
Exécution sans interaction, applique toutes les corrections automatiquement.

### Mode Détaillé
```bash
/check-claude --verbose
```
Affiche tous les détails de l'analyse en temps réel.

## Gestion des Erreurs

- **CLAUDE.md introuvable** : Proposer de le créer depuis le template
- **AGENTS.md introuvable** : Proposer de le créer via init-aikido
- **Memory Bank vide** : Suggérer d'exécuter init-aikido
- **Permissions insuffisantes** : Lister les fichiers non accessibles
- **Erreur de parsing Markdown** : Signaler les fichiers corrompus
- **Diagrammes Mermaid invalides** : Créer versions textuelles de fallback
- **Sauvegarde échouée** : Demander confirmation avant modification

## Règles AI-KIDO Respectées

- ✅ Analyse complète de la Memory Bank
- ✅ Respect de la hiérarchie hard_points > gen/
- ✅ Génération de rapport dans /prompts/spec/
- ✅ Mise à jour des index
- ✅ Synchronisation AGENTS.md selon règles 16-18
- ✅ Génération des fichiers .claude/agents/ depuis personas
- ✅ Génération des fichiers .claude/commands/ depuis .roo/commands/
- ✅ Mapping complet pour compatibilité Claude Code
- ✅ Format Markdown avec métadonnées
- ✅ Diagrammes Mermaid pour visualisation
- ✅ Traçabilité des modifications

## Intégration avec Autres Commandes

Cette commande s'intègre avec :
- `/init-aikido` : Initialisation de la Memory Bank
- `/analyse-aikido` : Audit complet AI-KIDO
- `/maj-aikido` : Synchronisation après rebase
- `/create-persona` : Création de nouveaux personas
- `/analyse-project` : Analyse des sources projet

**Workflow recommandé** :
1. Modifications dans la Memory Bank
2. `/check-claude` pour synchroniser CLAUDE.md
3. `/analyse-aikido` pour audit complet (mensuel)
4. `/maj-aikido` après rebase git

---

*Commande créée pour maintenir la synchronisation entre AI-KIDO et CLAUDE.md*
