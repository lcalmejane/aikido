---
description: "Créer un nouveau persona AI-KIDO interactivement"
---

# Commande Create-Persona

Crée directement un nouveau persona AI-KIDO et surtout pas un script ou autre commande SH. en posant 3 questions essentielles et en générant tous les fichiers nécessaires.

## Concept fondamental

**Un persona est un agent LLM spécialisé** qui incarne un expert avec :
- Des **compétences spécifiques** (techniques, méthodologies, domaines)
- Une **façon de penser** unique (approche, raisonnement, priorités)
- Un **style de communication** adapté à son rôle
- Des **patterns de résolution** de problèmes caractéristiques

Le fichier persona sert à **prompter le LLM** pour qu'il adopte complètement l'identité, les compétences et le mode de pensée de l'expert représenté. C'est un système prompt qui transforme le LLM en cet agent spécialisé.

## Exécution

Poser la **Question 1 : Identité du persona**
```
Entrez le nom et la spécialisation du persona :
Format : Nom | Spécialisation
Exemple : "Arthur Architect | Architecture logicielle"
```

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

Poser la **Question 2 : Compétences et mode de pensée**
```
Décrivez l'agent LLM que vous voulez créer :

1. COMPÉTENCES TECHNIQUES :
   - Technologies, frameworks, outils maîtrisés
   - Méthodologies et pratiques
   - Domaines d'expertise spécifiques

2. FAÇON DE PENSER :
   - Comment cet expert aborde-t-il les problèmes ?
   - Quelles sont ses priorités (performance, sécurité, maintenabilité...) ?
   - Quel est son processus de raisonnement ?

3. STYLE DE COMMUNICATION :
   - Comment s'exprime cet expert ?
   - Niveau de détail dans les explications
   - Ton et approche pédagogique

Entrez la description complète :
```

Poser la **Question 3 : Permissions**
```
Quelles permissions sont nécessaires ?
Choisir parmi : read, edit, browser, command
Entrez les permissions (séparées par des virgules) :
```

Valider l'unicité du slug dans `.roomodes` existant. Si conflit, proposer des alternatives : [slug]-v2, [slug]-alt, etc.

Créer le fichier `prompts/gen/personas/[slug].md` :
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

Créer ou mettre à jour `.roomodes` :
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

Créer ou mettre à jour `AGENTS.md` avec la nouvelle section persona.

Afficher le message de confirmation :
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
