---
description: "Analyse et met à jour le fichier CLAUDE.md en fonction de la Memory Bank AI-KIDO et des concepts CLAUDE.md"
---

# Commande Check-Claude

Analyse l'état actuel de la Memory Bank AI-KIDO et met à jour le fichier [`CLAUDE.md`](../../CLAUDE.md) pour refléter le mapping réel entre votre structure et la norme CLAUDE.md. Génère également les fichiers de mapping pour Claude Code (`.claude/agents/` et `.claude/commands/`).

## Objectif

Maintenir la synchronisation entre :
- La structure réelle de votre Memory Bank dans `/prompts/gen/`
- Les personas dans `/prompts/gen/personas/` → `.claude/agents/`
- Les commandes dans `prompts/hard_points/commands/` → `.claude/commands/`
- Le fichier `AGENTS.md`
- Le fichier `agents_list.md`
- Le fichier `CLAUDE.md`
- La compatibilité avec Claude Code (via fichiers `.claude/`) et CLAUDE.md

---
**IMPORTANT** : Ne modifie QUE le fichier CLAUDE.md et les fichiers de mapping dans `.claude/`. Ne touche PAS aux fichiers originaux dans `/prompts/` ou `prompts/hard_points/commands/` ou AGENTS.md ou agents_list.md. CLAUDE.md <= 100 Lignes.

## Exécution

### Phase 1 à 4 : Valide le Fichier CLAUDE.md par rapport aux normes de CLAUDE CLI.

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

#### 5bis.2 Génération des Fichiers Agents (Mappings Minimalistes et Actionnables)

**Pour chaque persona dans `/prompts/gen/personas/`** :

1. **Vérifier l'existence** :
   - Vérifier si `.claude/agents/[slug].md` existe déjà
   - Si existe, comparer la description du front-matter avec celle du persona source
   - Si identique et structure conforme, **IGNORER** (ne pas recréer)
   - Si différente ou structure incorrecte, **METTRE À JOUR**

2. **Extraire les métadonnées** (seulement si fichier à créer/mettre à jour) :
   - Slug du persona depuis le nom de fichier (ex: `expert-fonctionnel-ba.md` → `expert-fonctionnel-ba`)
   - Description : Combiner spécialisation (persona) + conditions d'utilisation (whenToUse depuis .roomodes ou persona) sur **une seule ligne**
   - Tools : Extraire permissions ou définir par défaut `Read, Grep, Glob, Bash`
   - Model : Extraire depuis front-matter `model` du persona (conserver "inherit" si présent)
   - Nom complet : Extraire depuis front-matter `name` ou titre # du persona
   - Lignes : Compter les lignes du fichier persona source (pour métriques)

3. **Créer/Mettre à jour** un fichier `.claude/agents/[nom-agent].md` avec la **structure minimaliste actionnable** :

```markdown
---
name: [nom-agent]
description: [Description UNE ligne depuis persona frontmatter]
tools: [Tools depuis persona]
model: [inherit/sonnet/haiku depuis persona]
---

# [Emoji] [Nom Complet Agent]

You are the [Nom Complet]. [Mission en 1 phrase depuis persona].

**Full specification**: `/prompts/gen/personas/[nom-agent].md` ([X] lines)

---

⚠️ **AGENT INTERNE - NE PAS CHARGER `/prompts/index.md` mais tout de même `aikido.md`** ⚠️

**UNIQUEMENT pour les agents `agent-aikido-*` (agents internes AI-KIDO)** :

En tant qu'agent interne AI-KIDO, vous possédez déjà les règles nécessaires. **NE chargez JAMAIS** le point d'entrée `index.md` - il est destiné aux agents externes et au LLM principal, pas aux agents spécialisés comme vous qui opérez directement sur la structure.

**Note** : Cet avertissement ne doit apparaître QUE pour les agents dont le nom commence par `agent-aikido-`. Les autres agents peuvent charger l'index normalement.

---

## When to Use

**Use this agent when:**
- [Cas d'usage 1 depuis persona/roomodes]
- [Cas d'usage 2]
- [Cas d'usage 3]
- [Cas d'usage 4]
- [Cas d'usage 5]

**Don't use when:**
- [Anti-pattern 1]
- [Anti-pattern 2]
- [Anti-pattern 3]

## Usage Examples

\`\`\`markdown
"[Exemple input 1]"
"[Exemple input 2]"
"[Exemple input 3]"
"[Exemple input 4]"
\`\`\`

## Input

\`\`\`markdown
[FORMAT]: [description]
[PARAM1]: [description]
[PARAM2]: [description]
\`\`\`

## Output

\`\`\`markdown
# [Titre Output]

## [Section 1]
[Description structure]

## [Section 2]
[Description structure]

[Metrics section]
\`\`\`

## Performance

- **Tokens**: [valeur moyenne]
- **Time**: [valeur moyenne]
- **[Autre métrique]**: [valeur]
- **[Autre métrique]**: [valeur]

---

**Full details**: Read `/prompts/gen/personas/[nom-agent].md`
```

**PRINCIPES STRICTES DE GÉNÉRATION MINIMALISTE** :

✅ **À INCLURE (actionnable uniquement)** :
- Front-matter YAML (name, description, tools, model)
- **Avertissement agents internes** (UNIQUEMENT pour agents `agent-aikido-*`)
- When to Use (5 cas d'usage + 3 anti-patterns)
- Usage Examples (4 exemples courts input-only)
- Input format (paramètres attendus)
- Output format (structure retournée)
- Performance metrics (tokens, temps, métriques clés)
- Lien vers persona complet

❌ **À EXCLURE (pas actionnable)** :
- Process interne détaillé (étapes, algorithmes)
- Workflows détaillés entre phases
- Checkpoints internes
- Explications théoriques
- Exemples verbeux avec input → output complet
- Tableaux de matrices complexes
- Détails d'implémentation

**TEMPLATE GÉNÉRATION** :

Le template doit être **50-80 lignes maximum** et suivre EXACTEMENT ce format :

```
[FRONTMATTER YAML - 5 lignes]
---
name: [slug]
description: [1 ligne]
tools: [liste]
model: [inherit/sonnet/haiku]
---

[HEADER - 3 lignes]
# [Emoji] [Nom]
You are... [1 phrase mission]
**Full specification**: [lien] ([X] lines)

[WHEN TO USE - 12 lignes]
## When to Use
**Use this agent when:**
- [5 bullet points]
**Don't use when:**
- [3 bullet points]

[USAGE EXAMPLES - 8 lignes]
## Usage Examples
```markdown
"[4 exemples input-only]"
```

[INPUT - 6 lignes]
## Input
```markdown
[Format paramètres]
```

[OUTPUT - 8 lignes]
## Output
```markdown
[Structure retour]
```

[PERFORMANCE - 6 lignes]
## Performance
- [4 métriques clés]

[FOOTER - 2 lignes]
---
**Full details**: [lien]
```

**EXTRACTION DEPUIS PERSONA SOURCE** :

Pour générer le mapping minimaliste, extraire depuis le persona source :

1. **Frontmatter** : name, description, tools, model (copie directe)
2. **Mission** : Première phrase du persona ou section "Core Mission"
3. **When to Use** :
   - Extraire depuis section "When to Use" ou "Automatic triggers" (5 cas)
   - Extraire anti-patterns ou créer génériques (3 cas)
4. **Usage Examples** :
   - Extraire 4 exemples depuis section "Quick Usage Examples"
   - Format : input-only (pas de output détaillé)
5. **Input/Output** : Extraire depuis sections "Input Format" et "Output Format"
6. **Performance** : Extraire métriques depuis section "Performance Characteristics"

**RÈGLES STRICTES** :
- ✅ Fichier final : 50-80 lignes MAXIMUM
- ✅ Conserver le frontmatter YAML exact du persona
- ✅ Focus 100% sur "comment utiliser" (when + input/output)
- ✅ Aucune duplication de process/algorithmes internes
- ✅ Lien vers persona complet pour détails
- ✅ **Avertissement agents internes** : AJOUTER la section d'avertissement "⚠️ AGENT INTERNE - NE PAS CHARGER `/prompts/index.md`" UNIQUEMENT si le nom de l'agent commence par `agent-aikido-*`
- ❌ Pas de descriptions de process multi-étapes
- ❌ Pas de checkpoints/validation internes
- ❌ Pas de tableaux complexes
- ❌ Pas d'exemples verbeux avec output complet

**Algorithme de génération (scan dynamique)** :
1. **Scanner dynamiquement** tous les fichiers `.md` dans `/prompts/gen/personas/` (sauf `index.md`)
   - Utiliser `find` ou `glob` pour lister les fichiers au moment de l'exécution
   - Ne pas partir d'une liste figée ou prédéfinie
2. Pour chaque fichier persona détecté :
   - Extraire le slug depuis le nom de fichier (ex: `expert-ba.md` → `expert-ba`)
   - **Vérifier si `.claude/agents/[slug].md` existe déjà**
   - Si existe, lire le front-matter pour comparer la description, tools et model
   - Si identiques et structure conforme, **PASSER AU SUIVANT** (ne pas recréer)
3. Pour les fichiers à créer/mettre à jour uniquement :
   - **Description** : Extraire depuis front-matter `description` du persona (contient déjà spécialisation + whenToUse sur une ligne)
   - **Tools** : Déduire depuis le contexte du persona ou utiliser par défaut `Read, Grep, Glob, Bash`
   - **Model** : Extraire depuis front-matter `model` du persona (conserver "inherit" tel quel)
   - Créer/Écraser le fichier agent `.claude/agents/[slug].md` avec :
     - Front-matter YAML complet (name, description, tools, model)
     - Deux sauts de ligne après `---`
     - Instructions pour charger dynamiquement le persona (PAS le contenu intégral)

**Important** :
- La liste des personas n'est PAS codée en dur. Elle est découverte à chaque exécution.
- Les fichiers agents existants et synchronisés ne sont PAS recréés (optimisation).

**Exemple concret** :
```markdown
---
name: agent-aikido-explore-bank
description: Searches and extracts information from AI-KIDO Memory Bank. Call when users ask about concepts/techniques/personas, before complex tasks, or exploring project patterns proactively.
tools: Read, Grep, Glob, Bash
model: inherit
---

# Agent agent-aikido-explore-bank

Cet agent exécute le persona complet depuis `/prompts/hard_points/agents/agent-aikido-explore-bank.md`.

**EXÉCUTION** : Je vais maintenant charger et activer le persona complet.

\`\`\`
Chargement de /prompts/hard_points/agents/agent-aikido-explore-bank.md et activation du persona...
\`\`\`
```

3. **Validation** :
- ✅ Un fichier par persona dans `.claude/agents/`
- ✅ Front-matter YAML valide avec `name`, `description`, `tools` et `model`
- ✅ Description sur UNE seule ligne combinant spécialisation + conditions d'utilisation
- ✅ Model conservé tel quel ("inherit" si présent dans le persona)
- ✅ Description termine par `\n\n` (deux retours à la ligne)
- ✅ **Référence dynamique** vers `/prompts/gen/personas/` (pas de duplication)
- ✅ Synchronisation 1:1 avec les fichiers dans `/prompts/gen/personas/`

#### 5bis.3 Vérification de la Détection et Synchronisation

**Vérifier la cohérence** entre :
1. `/prompts/gen/personas/*.md` (source de vérité)
2. `.roomodes` (configuration Roo-Code)
3. `agents_list.md` (interface des agents)
4. `AGENTS.md` (documentation centrale)
5. `.claude/agents/*.md` (fichiers agents pour Claude Code)

**Matrice de synchronisation** :

**Scanner dynamiquement** :
1. Lister tous les fichiers `.md` dans `/prompts/gen/personas/` (sauf `index.md`)
2. Pour chaque fichier détecté, vérifier la présence dans :
   - `.roomodes` (si le fichier existe)
   - `agents_list.md` (si le fichier existe)
   - `.claude/agents/`
3. Générer une matrice avec les résultats

Exemple de format :
| Persona | /prompts/gen/personas/ | .roomodes | agents_list.md | .claude/agents/ |
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

Fichiers agents analysés :
- [persona-1].md : ✅ Synchronisé (non modifié)
- [persona-2].md : 🔄 Créé
- [persona-3].md : 🔄 Mis à jour (description modifiée)
- ...

Statistiques :
- Déjà synchronisés (ignorés) : [NOMBRE]
- Créés : [NOMBRE]
- Mis à jour : [NOMBRE]
- Total : [NOMBRE]

Répertoire : .claude/agents/
Validation YAML : [✅ Valide / ❌ Erreur]
Synchronisation avec /prompts/gen/personas/ : [✅ 100% / ⚠️ Désynchronisé]

💡 Les agents sont maintenant disponibles via la commande /agents dans Claude Code
```

**Note importante** : Ces fichiers **référencent dynamiquement** les personas depuis `/prompts/gen/personas/`, instruisant Claude Code de charger le fichier persona au moment de l'activation, évitant toute duplication de contenu (conforme à la Règle 16).

### Phase 5ter : Génération des Fichiers Commands Individuels

#### 5ter.1 Création du Répertoire .claude/commands/

**Objectif** : Créer des fichiers de commandes pour que Claude Code les reconnaisse via la commande `/list`

**Créer le répertoire** si inexistant :
```bash
mkdir -p .claude/commands/
```

#### 5ter.2 Génération des Fichiers Commands

**Pour chaque commande dans `prompts/hard_points/commands/`** :

1. **Vérifier l'existence** :
   - Vérifier si `.claude/commands/[nom].md` existe déjà
   - Si existe, comparer la description du front-matter avec celle du fichier source
   - Si identique et structure conforme, **IGNORER** (ne pas recréer)
   - Si différente ou structure incorrecte, **METTRE À JOUR**

2. **Extraire les métadonnées** (seulement si fichier à créer/mettre à jour) :
   - Nom de la commande depuis le nom de fichier (ex: `check-claude.md` → `check-claude`)
   - Description depuis le front-matter YAML `description` du fichier `prompts/hard_points/commands/*.md`

3. **Créer/Mettre à jour** un fichier `.claude/commands/[nom-commande].md` avec la structure suivante :

```markdown
---
description: [Description courte sur une seule ligne depuis prompts/hard_points/commands/[nom-commande].md]
---

# Commande [nom-commande]

Cette commande exécute le fichier de commande complet depuis `prompts/hard_points/commands/[nom-commande].md`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

\`\`\`
Lecture de prompts/hard_points/commands/[nom-commande].md et exécution des instructions...
\`\`\`
```

**IMPORTANT** : Le fichier commande doit :
- Avoir un front-matter YAML simple avec `description` (description sur **une seule ligne**)
- La description doit se terminer par `\n\n` (deux retours à la ligne après les `---` de fermeture du front-matter)
- **NE PAS dupliquer le contenu** - seulement référencer dynamiquement `prompts/hard_points/commands/[nom-commande].md`
- Instruire Claude Code de lire et exécuter le fichier source

**Instructions de génération (scan dynamique)** :

1. **Scanner dynamiquement** tous les fichiers `.md` dans `prompts/hard_points/commands/`
   - Utiliser Glob ou Find pour lister les fichiers au moment de l'exécution
   - Ne JAMAIS partir d'une liste figée ou prédéfinie

2. **Pour chaque fichier détecté** :
   - Extraire le nom du fichier (ex: `analyse-aikido.md`)
   - Extraire le nom de la commande (ex: `analyse-aikido`)
   - **Vérifier si `.claude/commands/[nom].md` existe déjà**
   - Si existe, lire le front-matter pour comparer la description
   - Si identique et structure conforme, **PASSER AU SUIVANT** (ne pas recréer)

3. **Pour les fichiers à créer/mettre à jour uniquement**, créer le fichier `.claude/commands/[nom].md` en respectant EXACTEMENT ce template :

```
---
description: [DESCRIPTION_EXTRAITE_DU_FICHIER_SOURCE]
---
[LIGNE_VIDE_ICI]
# Commande [nom-de-la-commande]

Cette commande exécute le fichier de commande complet depuis `prompts/hard_points/commands/[nom-fichier].md`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

```
Lecture de prompts/hard_points/commands/[nom-fichier].md et exécution des instructions...
```
```

**RÈGLES STRICTES** :
- ✅ Respecter EXACTEMENT le template ci-dessus
- ✅ La description doit se terminer par `\n\n` (deux retours à la ligne après les `---` de fermeture)
- ✅ Remplacer uniquement les placeholders entre crochets
- ✅ Conserver la structure, les titres, le texte exact
- ❌ NE JAMAIS dupliquer le contenu du fichier source
- ❌ NE JAMAIS modifier le template ou ajouter du contenu supplémentaire
- ❌ NE PAS recréer les fichiers déjà synchronisés (vérifier avant création)

**Important** :
- La liste des commandes est découverte dynamiquement à chaque exécution
- Les fichiers commandes existants et synchronisés ne sont PAS recréés (optimisation)

**Exemple concret** :

Pour le fichier `prompts/hard_points/commands/analyse-aikido.md` avec description :
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

Cette commande exécute le fichier de commande complet depuis `prompts/hard_points/commands/analyse-aikido.md`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

\`\`\`
Lecture de prompts/hard_points/commands/analyse-aikido.md et exécution des instructions...
\`\`\`
```

4. **Validation** :
- ✅ Un fichier par commande dans `.claude/commands/`
- ✅ Front-matter YAML valide avec `description` sur 1 ligne
- ✅ Description termine par `\n\n` (deux retours à la ligne)
- ✅ **Référence dynamique** vers `prompts/hard_points/commands/` (pas de duplication)
- ✅ Synchronisation 1:1 avec les fichiers dans `prompts/hard_points/commands/`
- ✅ Fichiers déjà synchronisés non recréés

#### 5ter.3 Vérification de la Détection et Synchronisation

**Vérifier la cohérence** entre :
1. `prompts/hard_points/commands/*.md` (source de vérité)
2. `.claude/commands/*.md` (fichiers commandes pour Claude Code)

**Matrice de synchronisation** :

**Scanner dynamiquement** :
1. Lister tous les fichiers `.md` dans `prompts/hard_points/commands/`
2. Pour chaque fichier détecté, vérifier la présence dans `.claude/commands/`
3. Générer une matrice avec les résultats

Exemple de format :
| Commande | prompts/hard_points/commands/ | .claude/commands/ |
|----------|----------------|-------------------|
| [commande-1] | ✅ | [✅/❌] |
| [commande-2] | ✅ | [✅/❌] |
| ... | ... | ... |

**Alertes si désynchronisation** :
- ⚠️ Commande dans prompts/hard_points/commands/ mais absente de .claude/commands/
- ⚠️ Commande dans .claude/commands/ mais fichier source introuvable
- ⚠️ Incohérence description entre les deux fichiers

**Afficher le résultat** :

```
🔧 GÉNÉRATION .CLAUDE/COMMANDS/

Scanner prompts/hard_points/commands/ : [NOMBRE] fichier(s) détecté(s)

Fichiers commandes analysés :
- [commande-1].md : ✅ Synchronisé (non modifié)
- [commande-2].md : 🔄 Créé
- [commande-3].md : 🔄 Mis à jour (description modifiée)
- ...

Statistiques :
- Déjà synchronisés (ignorés) : [NOMBRE]
- Créés : [NOMBRE]
- Mis à jour : [NOMBRE]
- Total : [NOMBRE]

Répertoire : .claude/commands/
Validation YAML : [✅ Valide / ❌ Erreur]
Synchronisation avec prompts/hard_points/commands/ : [✅ 100% / ⚠️ Désynchronisé]

💡 Les commandes sont maintenant disponibles via la commande /list dans Claude Code
```

**Note importante** : Ces fichiers **ne dupliquent pas le contenu** mais instruisent Claude Code de lire et exécuter dynamiquement le fichier source `prompts/hard_points/commands/[nom].md`, évitant toute désynchronisation.

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
**Fichier agents_list.md** : [✅ Conforme / ⚠️ Corrigé / ❌ Non conforme]
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
3. [✅/❌] Synchronisation agents_list.md
4. [✅/❌] Synchronisation AGENTS.md
5. ✅ Génération des fichiers agents individuels dans .claude/agents/
6. ✅ Génération des fichiers commandes individuels dans .claude/commands/
7. ✅ Génération de la matrice de correspondance
8. ✅ Mise à jour des diagrammes
9. ✅ Actualisation des statistiques

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

*Commande créée pour maintenir la synchronisation entre AI-KIDO et CLAUDE.md*
