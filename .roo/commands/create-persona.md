---
description: "Créer un nouveau persona AI-KIDO interactivement"
---

# Commande Create-Persona

**IMPORTANT** : Cette commande doit être exécutée DIRECTEMENT par le LLM.
- ❌ NE PAS créer de script bash/shell
- ❌ NE PAS proposer de code à exécuter
- ✅ POSER les questions à l'utilisateur IMMÉDIATEMENT
- ✅ CRÉER les fichiers DIRECTEMENT avec write_to_file

Cette commande crée un nouveau persona AI-KIDO en posant 3 questions essentielles et en générant tous les fichiers nécessaires.

## Concept fondamental

**Un persona est un agent LLM spécialisé** qui incarne un expert avec :
- Des **compétences spécifiques** (techniques, méthodologies, domaines)
- Une **façon de penser** unique (approche, raisonnement, priorités)
- Un **style de communication** adapté à son rôle
- Des **patterns de résolution** de problèmes caractéristiques

Le fichier persona sert à **prompter le LLM** pour qu'il adopte complètement l'identité, les compétences et le mode de pensée de l'expert représenté. C'est un système prompt qui transforme le LLM en cet agent spécialisé.

## Exécution IMMÉDIATE

### Étape 1 : Poser la Question 1 avec ask_followup_question

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

### Étape 2 : Poser la Question 2 avec ask_followup_question

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

### Étape 3 : Poser la Question 3 avec ask_followup_question

Utiliser l'outil `ask_followup_question` pour demander :

**Question** : "Quelles permissions sont nécessaires pour cet agent ?"

**Options** : read, edit, browser, command

Suggestions à proposer :
- "read, edit (lecture et modification de fichiers)"
- "read, edit, command (+ exécution de commandes)"
- "read, edit, browser, command (toutes permissions)"
- "read (lecture seule)"

### Étape 4 : Générer automatiquement le slug et l'emoji

Après avoir reçu les 3 réponses :
1. Valider l'unicité du slug dans `.roomodes` existant
2. Si conflit, proposer des alternatives : [slug]-v2, [slug]-alt, etc.

### Étape 5 : Créer les fichiers avec write_to_file

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

## Prompt système

Ce persona sert à prompter le LLM pour qu'il incarne complètement cet expert, avec :
- Ses compétences techniques et méthodologiques
- Sa façon unique d'analyser et résoudre les problèmes
- Son style de communication et d'explication
- Ses priorités et valeurs professionnelles

---
*Agent LLM créé le [date] via create-persona*
```

### Étape 6 : Mettre à jour .roomodes avec apply_diff ou write_to_file

Utiliser l'outil `apply_diff` ou `write_to_file` pour mettre à jour `.roomodes` :
```yaml
customModes:
  - slug: [slug]
    name: [emoji] [nom] - [spécialisation]
    roleDefinition: >-
      Tu es [nom], un agent LLM spécialisé en [spécialisation].
      
      COMPÉTENCES : [résumé des compétences techniques]
      
      MODE DE PENSÉE : [résumé de l'approche et des priorités]
      
      STYLE : [résumé du style de communication]
      
      Tu incarnes complètement cet expert avec ses compétences, sa façon de penser et son style unique.
    whenToUse: >-
      Utilise cet agent LLM quand tu as besoin de [contextes d'utilisation].
      Cet agent apporte son expertise en [domaines] avec une approche [caractéristiques].
    groups:
      [permissions en format liste YAML]
```

### Étape 7 : Mettre à jour AGENTS.md avec apply_diff ou write_to_file

Utiliser l'outil `apply_diff` ou `write_to_file` pour mettre à jour `AGENTS.md` avec la nouvelle section persona.

### Étape 8 : Confirmer la création avec attempt_completion

Utiliser l'outil `attempt_completion` pour afficher le message de confirmation :
```
✅ Agent LLM "[nom]" créé avec succès !

🤖 Cet agent incarne un expert en [spécialisation] avec :
   - Compétences spécifiques en [domaines]
   - Une façon de penser orientée [priorités]
   - Un style de communication [caractéristiques]

📁 Fichiers créés/modifiés :
   - prompts/gen/personas/[slug].md (définition complète de l'agent)
   - .roomodes (configuration du mode)
   - AGENTS.md (documentation)

🚀 Utilisez le slug "[slug]" pour activer cet agent LLM.
   Le LLM adoptera alors les compétences et la façon de penser de cet expert.
```

## Gestion des erreurs

- **Slug existant** : Proposer [slug]-v2, [slug]-alt, etc.
- **Permissions invalides** : Redemander avec liste valide
- **Format incorrect** : Redemander avec exemple
- **Emoji échoué** : Utiliser 🤖 par défaut

---
