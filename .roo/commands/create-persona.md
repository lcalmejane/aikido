---
description: "Créer un nouveau persona AI-KIDO interactivement"
---

# Commande Create-Persona

Crée directement un nouveau persona AI-KIDO et surtout pas un script ou autre commande SH. en posant 3 questions essentielles et en générant tous les fichiers nécessaires.

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

Poser la **Question 2 : Rôle et contexte**
```
Décrivez en format libre :
- Description du rôle
- Domaines d'expertise
- Contextes d'utilisation

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

## Rôle
[description du rôle]

## Spécialisation
[spécialisation]

## Domaines d'expertise
[domaines extraits]

## Contextes d'utilisation
[contextes extraits]

## Permissions
[permissions]

---
*Persona créé le [date] via create-persona*
```

Créer ou mettre à jour `.roomodes` :
```yaml
customModes:
  - slug: [slug]
    name: [emoji] [nom] - [spécialisation]
    roleDefinition: >-
      [description du rôle]
    whenToUse: >-
      [contextes d'utilisation]
    groups:
      [permissions en format liste YAML]
```

Créer ou mettre à jour `AGENTS.md` avec la nouvelle section persona.

Afficher le message de confirmation :
```
✅ Persona "[nom]" créé avec succès !

Fichiers créés/modifiés :
- prompts/gen/personas/[slug].md
- .roomodes (créé/mis à jour)
- AGENTS.md (créé/mis à jour)

Utilisez le slug "[slug]" pour activer ce persona.
```

## Gestion des erreurs

- **Slug existant** : Proposer [slug]-v2, [slug]-alt, etc.
- **Permissions invalides** : Redemander avec liste valide
- **Format incorrect** : Redemander avec exemple
- **Emoji échoué** : Utiliser 🤖 par défaut

---
