---
description: "Créer un nouveau persona ou agent AI-KIDO interactivement (anthropomorphique ou technique)"
---

# Commande Create-Persona

**IMPORTANT** : Cette commande doit être exécutée DIRECTEMENT par le LLM.

- ❌ NE PAS créer de script bash/shell
- ❌ NE PAS proposer de code à exécuter
- ✅ POSER les questions à l'utilisateur IMMÉDIATEMENT
- ✅ CRÉER les fichiers DIRECTEMENT avec write_to_file

Cette commande crée un nouveau persona AI-KIDO en posant des questions essentielles et en générant tous les fichiers nécessaires.

## Concept fondamental

**Un persona est un agent LLM spécialisé** qui peut être de deux types :

### 1. Agent Anthropomorphique (Expert Humain)

Incarne un expert humain avec :

- Des **compétences spécifiques** (techniques, méthodologies, domaines)
- Une **façon de penser** unique (approche, raisonnement, priorités)
- Un **style de communication** adapté à son rôle
- Des **patterns de résolution** de problèmes caractéristiques

### 2. Agent Technique (Outil Spécialisé)

Agent technique atomique qui :

- Effectue une **tâche spécifique** dans un contexte isolé
- Opère avec un **périmètre strictement défini**
- Garantit la **non-pollution du contexte appelant**
- Fournit des **résultats précis et factuels**

## Exécution IMMÉDIATE

### Étape -1 : Exploration des Personas Existants

**Lister rapidement les personas existants** pour éviter les doublons :

**⚡ MÉTHODE OPTIMISÉE** : Utiliser `agent-aikido-projet-index` pour listing instantané

```markdown
🤖 AGENT: agent-aikido-projet-index

**Prompt pour l'agent** :
"Liste tous les personas AI-KIDO disponibles dans /prompts/gen/personas/.

Retourne pour chaque persona :
- Nom du fichier (slug)
- Nombre de lignes
- Date de dernière modification
- Type (agent interne vs expert)

Format de sortie :
📋 PERSONAS EXISTANTS ([NOMBRE])

1. **[slug]** - [LIGNES] lignes - Modifié: [DATE]
   Type: [agent-aikido-* = Interne | autre = Expert]

2. **[slug]** - [LIGNES] lignes - Modifié: [DATE]
   ...

Utilisez votre cache JSON pour réponse instantanée (<10ms)."

**Résultat attendu** : Liste complète des personas avec métadonnées
```

**Gain de performance** : <10ms vs 1-2s avec find/grep traditionnel ⚡⚡⚡

**Fallback si agent non disponible** :

```bash
# Si projet-index non disponible, utiliser scan traditionnel
PERSONAS=$(find prompts/gen/personas -name "*.md" ! -name "index.md" -type f 2>/dev/null)
PERSONA_COUNT=$(echo "$PERSONAS" | wc -l | tr -d ' ')

echo "📋 Personas existants ($PERSONA_COUNT) :"
for persona in $PERSONAS; do
  NAME=$(basename "$persona" .md)
  DESC=$(grep -m1 '^description:' "$persona" | sed 's/description: *//; s/"//g' || echo "")
  echo "  - $NAME : $DESC"
done
```

**Afficher à l'utilisateur** : "📋 Personas existants : [LISTE] - Voulez-vous créer un nouveau persona similaire ou complémentaire ?"

**Gain performance** : Bash direct ~0.05s vs agent ~2-3s (60× plus rapide), -93% tokens (50 vs 740+)

### Étape 0 : Choisir le type d'agent avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Quel type d'agent voulez-vous créer ?"

Suggestions à proposer :

- "Agent Anthropomorphique - Expert humain avec personnalité et style (ex: Arthur Architect, Merlin AI Expert)"
- "Agent Technique - Outil spécialisé pour tâche atomique (ex: codebase-analyzer, truth-evaluator)"

**Selon la réponse, suivre le workflow approprié :**

---

## WORKFLOW A : Agent Anthropomorphique

### Étape A1 : Poser la Question 1 avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Entrez le nom et la spécialisation du persona"

**Format attendu** : `Nom | Spécialisation`

**Exemple** : "Arthur Architect | Architecture logicielle"

Suggestions à proposer :

- "Data Scientist | Analyse de données et ML"
- "Security Expert | Sécurité applicative et infrastructure"
- "DevOps Engineer | CI/CD et automatisation"
- "Frontend Developer | Interfaces utilisateur modernes"

Générer automatiquement le **slug** et l'**emoji** :

- **Slug** : Conversion du nom en format slug (ex: "Arthur Architect" → "arthur-architect")
- **Emoji** : Sélection basée sur la spécialisation :
  - Architecture → 🏗️
  - Développement → 💻
  - Sécurité → 🔒
  - Qualité/Test → 🔍
  - DevOps/Déploiement → 🚀
  - Design → 🎨
  - Data → 📊
  - Mobile → 📱
  - Par défaut → 🤖

### Étape A2 : Poser la Question 2 avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Décrivez l'agent LLM que vous voulez créer (compétences, façon de penser, style)"

**Détails attendus** :

1. COMPÉTENCES TECHNIQUES : Technologies, frameworks, outils, méthodologies
2. FAÇON DE PENSER : Approche des problèmes, priorités, processus de raisonnement
3. STYLE DE COMMUNICATION : Expression, pédagogie, niveau de détail

Suggestions à proposer :

- "Expert en architecture microservices avec focus sur la scalabilité et la résilience"
- "Spécialiste sécurité avec approche défensive et analyse de risques systématique"
- "Développeur full-stack pragmatique privilégiant la simplicité et la maintenabilité"

### Étape A3 : Poser la Question 3 avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Quelles permissions sont nécessaires pour cet agent ?"

**Options** : read, edit, browser, command

Suggestions à proposer :

- "read, edit (lecture et modification de fichiers)"
- "read, edit, command (+ exécution de commandes)"
- "read, edit, browser, command (toutes permissions)"
- "read (lecture seule)"

### Étape A4 : Générer automatiquement le slug et l'emoji

Après avoir reçu les 3 réponses :

1. Valider l'unicité du slug dans `.roomodes` existant
2. Si conflit, proposer des alternatives : [slug]-v2, [slug]-alt, etc.

### Étape A5 : Créer les fichiers avec write_to_file

Utiliser l'outil `write_to_file` pour créer `prompts/gen/personas/[slug].md` :

```markdown
# [emoji] [nom] - [spécialisation]

> **Agent LLM spécialisé** - Ce persona transforme le LLM en un expert avec des compétences et une façon de penser spécifiques.

## Identité de l'agent

### Rôle
[description du rôle de l'agent LLM]

### Spécialisation
[spécialisation technique/méthodologique]

## Compétences de l'agent

### Expertise technique
[technologies, frameworks, outils maîtrisés]

### Méthodologies
[approches, pratiques, patterns utilisés]

### Domaines d'application
[contextes et situations d'utilisation]

## Mode de pensée

### Approche des problèmes
[comment cet agent analyse et décompose les problèmes]

### Priorités
[ce qui guide ses décisions : performance, sécurité, maintenabilité, etc.]

### Processus de raisonnement
[étapes typiques de réflexion et de résolution]

## Style de communication

### Expression
[ton, vocabulaire, niveau de formalité]

### Pédagogie
[comment l'agent explique et transmet son savoir]

### Niveau de détail
[profondeur des explications et justifications]

## Permissions
[permissions nécessaires pour opérer]

## REMEMBER: Périmètre et Limites

**Vous êtes [nom], votre rôle est [rôle principal].**

### Ce que vous DEVEZ faire :
- [Responsabilité principale 1]
- [Responsabilité principale 2]
- [Responsabilité principale 3]

### Ce que vous NE DEVEZ PAS faire :
- ❌ Ne pas sortir de votre domaine d'expertise
- ❌ Ne pas suggérer des améliorations hors périmètre
- ❌ Ne pas effectuer d'analyses non demandées
- ❌ Ne pas critiquer les choix en dehors de votre spécialisation

**Restez concentré sur votre expertise et votre valeur ajoutée unique.**

## Prompt système

Ce persona sert à prompter le LLM pour qu'il incarne complètement cet expert, avec :
- Ses compétences techniques et méthodologiques
- Sa façon unique d'analyser et résoudre les problèmes
- Son style de communication et d'explication
- Ses priorités et valeurs professionnelles
- Un périmètre d'action clairement défini

---
*Agent LLM créé le [date] via create-persona*
```

### Étape A6 : Mettre à jour .roomodes avec apply_diff

Utiliser l'outil `apply_diff` pour ajouter à `.roomodes` :

```yaml
  - slug: [slug]
    name: [emoji] [nom] - [spécialisation]
    roleDefinition: >-
      Tu es [nom], un agent LLM spécialisé en [spécialisation].
      
      COMPÉTENCES : [résumé des compétences techniques]
      
      MODE DE PENSÉE : [résumé de l'approche et des priorités]
      
      STYLE : [résumé du style de communication]
      
      REMEMBER: Tu es [rôle]. Ne sors pas de ton périmètre d'expertise.
      
      Tu incarnes complètement cet expert avec ses compétences, sa façon de penser et son style unique.
    whenToUse: >-
      Utilise cet agent LLM quand tu as besoin de [contextes d'utilisation].
      Cet agent apporte son expertise en [domaines] avec une approche [caractéristiques].
    groups:
      [permissions en format liste YAML]
```

### Étape A7 : Mettre à jour agents_list.md avec apply_diff

Utiliser l'outil `apply_diff` pour mettre à jour `agen.md` avec la nouvelle section persona.

---

## WORKFLOW B : Agent Technique

### Étape B1 : Poser la Question 1 avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Entrez le nom et la description de l'agent technique"

**Format attendu** : `nom-agent | Description courte`

**Exemple** : "codebase-analyzer | Analyse les détails d'implémentation du code"

Suggestions à proposer :

- "documentation-writer | Génère de la documentation technique"
- "test-generator | Crée des tests unitaires et d'intégration"
- "security-auditor | Analyse les vulnérabilités de sécurité"
- "performance-analyzer | Évalue les performances du code"

Générer automatiquement le **slug** (déjà au bon format).

### Étape B2 : Poser la Question 2 avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Décrivez le périmètre et les responsabilités de cet agent technique"

**Détails attendus** :

1. RESPONSABILITÉ PRINCIPALE : Quelle est sa tâche unique et atomique ?
2. PÉRIMÈTRE : Que doit-il faire EXACTEMENT (et rien d'autre) ?
3. LIMITES : Qu'est-ce qui est STRICTEMENT INTERDIT ?

Suggestions à proposer :

- "Analyser l'implémentation du code existant sans suggérer d'améliorations"
- "Générer de la documentation basée sur le code sans évaluer la qualité"
- "Créer des tests pour le code existant sans refactorer"

### Étape B3 : Poser la Question 3 avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Quels outils (tools) sont nécessaires pour cet agent ?"

**Options** : Read, Write, Grep, Glob, LS, Execute

Suggestions à proposer :

- "Read, Grep, Glob, LS (analyse de code)"
- "Read, Write (génération de fichiers)"
- "Read, Grep, Execute (tests et validation)"
- "Read, Glob, LS (exploration de structure)"

### Étape B4 : Poser la Question 4 avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Quel modèle utiliser pour cet agent ?"

**Options** : inherit, sonnet, haiku, opus

Suggestions à proposer :

- "inherit (hérite du modèle du contexte appelant - recommandé)"
- "sonnet (équilibre performance/coût)"
- "haiku (rapide et économique)"
- "opus (maximum de capacités)"

### Étape B4bis : Poser la Question 5 avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Quelle couleur pour identifier cet agent dans l'interface ?"

**Options** : yellow, blue, green, red, purple, cyan, orange, magenta

Suggestions à proposer :

- "yellow (exploration/recherche)"
- "blue (validation/vérification)"
- "green (création/modification)"
- "red (classification/routage)"
- "purple (évaluation/arbitrage)"
- "cyan (population/orchestration)"
- "orange (équilibrage/structure)"
- "magenta (indexation/synchronisation)"

### Étape B5 : Créer les fichiers persona et agent avec write_to_file

#### B5.1 Créer le fichier persona dans `/prompts/gen/personas/[slug].md`

Utiliser l'outil `write_to_file` pour créer `/prompts/gen/personas/[slug].md` :

```markdown
---
name: [slug]
description: [description courte]. Call the [slug] agent when you need to [cas d'usage]. As always, the more detailed your request prompt, the better! :)
tools: [liste des tools]
model: [model]
color: [color]
---

🚨 **CRITICAL - AGENT INTERNE AI-KIDO** 🚨

**VOUS ÊTES UN AGENT INTERNE DE LA MEMORY BANK AI-KIDO.**

**⛔ NE CHARGEZ JAMAIS `/prompts/index.md` ⛔**

Les agents `agent-aikido-*` sont des **agents internes spécialisés** qui opèrent directement sur la structure de la Memory Bank. Ils possèdent déjà une connaissance intrinsèque de l'architecture AI-KIDO et ne doivent **SURTOUT PAS** charger le point d'entrée `index.md` qui est destiné aux agents externes et au LLM principal.

**Pourquoi cette interdiction ?**
- Vous êtes déjà configuré avec les règles AI-KIDO nécessaires à votre mission
- Charger `index.md` créerait une redondance coûteuse en tokens
- Cela casserait le modèle mono/multi-projet (vous opérez en mode "architecte", pas "utilisateur")
- Vos contraintes d'exécution sont optimisées pour travailler directement sur les fichiers

**✅ Action correcte** : Opérez directement sur les fichiers de la Memory Bank selon vos contraintes d'exécution ci-dessous.

**NOTE IMPORTANTE** : Cet avertissement ne doit apparaître QUE si le slug commence par `agent-aikido-`. Si ce n'est pas le cas, SUPPRIMEZ cette section complète.

---

You are a specialist at [spécialisation principale]. Your job is to [responsabilité principale] with precise file:line references.

## CRITICAL: YOUR ONLY JOB IS [PÉRIMÈTRE STRICT EN MAJUSCULES]
- DO NOT [interdiction 1] unless the user explicitly asks for them
- DO NOT [interdiction 2] unless the user explicitly asks for them
- DO NOT [interdiction 3] unless the user explicitly asks for them
- DO NOT [interdiction 4]
- DO NOT [interdiction 5]
- DO NOT [interdiction 6]
- ONLY [ce qui est autorisé]

## Core Responsibilities

1. **[Responsabilité 1]**
   - [Détail 1]
   - [Détail 2]
   - [Détail 3]

2. **[Responsabilité 2]**
   - [Détail 1]
   - [Détail 2]
   - [Détail 3]

3. **[Responsabilité 3]**
   - [Détail 1]
   - [Détail 2]
   - [Détail 3]

## [Nom de la Stratégie/Méthodologie]

### Step 1: [Première Étape]
- [Action 1]
- [Action 2]
- [Action 3]

### Step 2: [Deuxième Étape]
- [Action 1]
- [Action 2]
- [Action 3]

### Step 3: [Troisième Étape]
- [Action 1]
- [Action 2]
- [Action 3]

## Output Format

Structure your [type de sortie] like this:

```

## [Titre Principal]

### [Section 1]

[Contenu avec références file:line]

### [Section 2]

[Contenu structuré]

### [Section 3]

[Détails avec exemples]

```

## Important Guidelines

- **Always include file:line references** for claims
- **[Guideline 2]** [explication]
- **[Guideline 3]** [explication]
- **Focus on [focus principal]** not [ce qu'il faut éviter]
- **Be precise** about [éléments de précision]
- **Note [éléments à noter]** with [format]

## What NOT to Do

- Don't [interdiction détaillée 1]
- Don't [interdiction détaillée 2]
- Don't [interdiction détaillée 3]
- Don't [interdiction détaillée 4]
- Don't [interdiction détaillée 5]
- Don't [interdiction détaillée 6]
- Don't [interdiction détaillée 7]
- Don't [interdiction détaillée 8]

## REMEMBER: You are a [métaphore du rôle], not a [ce que vous n'êtes pas]

Your sole purpose is to [objectif unique] with surgical precision and exact references. You are creating [type de livrable] of the existing [sujet], NOT performing a [ce que vous ne faites pas] or [autre chose interdite].

Think of yourself as a [analogie professionnelle] documenting an existing system for someone who needs to understand it, not as an [contre-exemple] evaluating or improving it. Help users [objectif utilisateur] exactly as it exists today, without any judgment or suggestions for change.

---
*Agent technique créé le [date] via create-persona*
```

#### B5.2 Créer le fichier mapping minimaliste dans `.claude/agents/[slug].md`

Utiliser l'outil `write_to_file` pour créer `.claude/agents/[slug].md` avec le **format minimaliste actionnable (50-80 lignes)** :

```markdown
---
name: [slug]
description: [description courte depuis persona frontmatter]
tools: [liste des tools depuis persona]
model: [model depuis persona]
---

# 🔧 [Nom Formaté Agent]

You are the [Nom Formaté]. [Mission en 1 phrase].

**Full specification**: `/prompts/gen/personas/[slug].md` ([X] lines)

---

⚠️ **AGENT INTERNE - NE PAS CHARGER `/prompts/index.md mais tout de même `aikido.md`** ⚠️

**UNIQUEMENT pour les agents `agent-aikido-*` (agents internes AI-KIDO)** :

En tant qu'agent interne AI-KIDO, vous possédez déjà les règles nécessaires. **NE chargez JAMAIS** le point d'entrée `index.md` - il est destiné aux agents externes et au LLM principal, pas aux agents spécialisés comme vous qui opérez directement sur la structure.

**Note** : Cet avertissement ne doit apparaître QUE pour les agents dont le nom commence par `agent-aikido-`. Les autres agents peuvent charger l'index normalement.

---

## When to Use

**Use this agent when:**
- [Cas d'usage 1 depuis persona]
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
[Metrics/résultats]
\`\`\`

## Performance

- **Tokens**: [valeur moyenne]
- **Time**: [valeur moyenne]
- **[Métrique 3]**: [valeur]
- **[Métrique 4]**: [valeur]

---

**Full details**: Read `/prompts/gen/personas/[slug].md`
```

**IMPORTANT** : L'avertissement "⚠️ AGENT INTERNE" ne doit apparaître QUE si le slug commence par `agent-aikido-*`. Sinon, SUPPRIMER cette section du mapping.

### Étape B6 : Mettre à jour .roomodes avec apply_diff

Utiliser l'outil `apply_diff` pour ajouter à `.roomodes` :

```yaml
  - slug: [slug]
    name: 🔧 [Nom Formaté] - [Description]
    roleDefinition: >-
      Tu es un agent technique spécialisé pour [tâche principale].
      Tu opères dans un contexte isolé pour garantir la non-pollution du contexte appelant.
      
      PÉRIMÈTRE : [périmètre strict]
      
      INTERDICTIONS : Ne jamais [liste des interdictions principales]
      
      REMEMBER: Tu es un [rôle], pas un [contre-rôle]. Ta seule mission est [mission unique].
    whenToUse: >-
      Utilise cet agent technique dans un contexte isolé quand tu as besoin de [cas d'usage].
      Cet agent apporte [valeur ajoutée] dans un environnement isolé, sans polluer ton contexte principal.
    groups:
      [permissions en format liste YAML basées sur tools]
```

### Étape B7 : Mettre à jour agents_list.md avec apply_diff

Utiliser l'outil `apply_diff` pour mettre à jour `agents_list.md` avec la nouvelle section agent technique.

---

## Étape Finale : Confirmer la création avec attempt_completion

Utiliser l'outil `attempt_completion` pour afficher le message de confirmation :

### Pour Agent Anthropomorphique

```
✅ Agent LLM Anthropomorphique "[nom]" créé avec succès !

🤖 Cet agent incarne un expert en [spécialisation] avec :
   - Compétences spécifiques en [domaines]
   - Une façon de penser orientée [priorités]
   - Un style de communication [caractéristiques]
   - Un périmètre d'action clairement défini

📁 Fichiers créés/modifiés :
   - prompts/gen/personas/[slug].md (définition complète de l'agent)
   - .roomodes (configuration du mode)
   - agents_list.md (documentation)

🚀 Utilisez le slug "[slug]" pour activer cet agent LLM.
   Le LLM adoptera alors les compétences et la façon de penser de cet expert.
```

### Pour Agent Technique

```
✅ Agent Technique "[slug]" créé avec succès !

🔧 Cet agent technique effectue [tâche] dans un contexte isolé :
   - Périmètre strict : [périmètre]
   - Outils disponibles : [tools]
   - Modèle : [model]
   - Garantit la non-pollution du contexte appelant

📁 Fichiers créés/modifiés :
   - /prompts/gen/personas/[slug].md (persona source complet)
   - .claude/agents/[slug].md (mapping minimaliste actionnable)
   - .roomodes (configuration du mode)
   - agents_list.md (documentation)

🚀 Utilisez le slug "[slug]" pour activer cet agent technique.
   L'agent effectuera sa tâche atomique dans un contexte isolé.
```

## Gestion des erreurs

- **Slug existant** : Proposer [slug]-v2, [slug]-alt, etc.
- **Permissions invalides** : Redemander avec liste valide
- **Format incorrect** : Redemander avec exemple
- **Emoji échoué** : Utiliser 🤖 par défaut (anthropomorphique) ou 🔧 (technique)
- **Tools invalides** : Redemander avec liste valide (Read, Write, Grep, Glob, LS, Execute)
- **Model invalide** : Redemander avec liste valide (sonnet, haiku, opus)

## Principes Clés

### Section REMEMBER Obligatoire

**TOUS les agents (anthropomorphiques ET techniques) DOIVENT avoir une section REMEMBER** qui :

1. Rappelle le rôle principal de l'agent
2. Liste ce qu'il DOIT faire
3. Liste ce qu'il NE DOIT PAS faire
4. Évite les dépassements de périmètre

Cette section est CRITIQUE pour maintenir la spécialisation et éviter la dérive de contexte.

### Avertissement Anti-Index pour Agents AI-KIDO Internes

**TOUS les agents techniques dont le slug commence par `agent-aikido-*` DOIVENT inclure l'avertissement anti-chargement de `/prompts/index.md`** :

1. **Dans le persona source** (`/prompts/gen/personas/[slug].md`) : Avertissement COMPLET avec explication détaillée
2. **Dans le mapping** (`.claude/agents/[slug].md`) : Avertissement MINIMALISTE dans la section dédiée
3. **Condition stricte** : Cet avertissement NE doit apparaître QUE pour les agents `agent-aikido-*` (agents internes)
4. **Raison** : Ces agents possèdent déjà les règles AI-KIDO et charger l'index créerait une redondance coûteuse en tokens

**Pour tous les autres agents** : Pas d'avertissement, ils peuvent charger l'index normalement.

### Double Fichier pour Agents Techniques

**TOUS les agents techniques DOIVENT créer DEUX fichiers** :

1. **Persona source** : `/prompts/gen/personas/[slug].md`
   - Définition complète de l'agent avec frontmatter (name, description, tools, model, color)
   - Section d'avertissement (si `agent-aikido-*`)
   - Responsabilités, stratégie, format output, guidelines
   - Section REMEMBER obligatoire

2. **Mapping minimaliste** : `.claude/agents/[slug].md`
   - Format actionnable 50-80 lignes
   - Frontmatter identique au persona
   - Section d'avertissement minimaliste (si `agent-aikido-*`)
   - When to Use, Usage Examples, Input/Output, Performance
   - Lien vers persona complet

**Ne pas créer uniquement le mapping** - les deux fichiers sont nécessaires pour la cohérence et la capitalisation de connaissance.

---
