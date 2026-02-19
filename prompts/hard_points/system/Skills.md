### Skills (Agent Skills)

Les skills implémentés sont dans `skills_list.md` et suivent la norme CLAUDE.md pour les Agent Skills.

#### Qu'est-ce qu'un Skill ?

Un **Skill** est un module de capacité spécialisée qui étend les fonctionnalités de Claude de manière autonome. Il s'agit d'une ressource packagée incluant des instructions, métadonnées et ressources optionnelles.

**Source** : [Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)

#### Caractéristiques principales

* **Invocation autonome** : Claude décide automatiquement quand utiliser un Skill en fonction du contexte de la conversation
* **Architecture modulaire** : Packagé comme un répertoire avec fichiers structurés
* **Progressive disclosure** : Chargement progressif de l'information en 3 niveaux :
  * **Niveau 1** : Métadonnées (~100 tokens, toujours chargées)
  * **Niveau 2** : Instructions (<5k tokens, chargées à l'activation)
  * **Niveau 3** : Ressources (illimité, chargées à la demande)

**Source** : [Skills Overview - Architecture](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)

#### Structure d'un Skill

skill-name/
├── SKILL.md           # Fichier principal (obligatoire)
├── references/       # Documentation de référence (optionnel)
├── examples/        # Exemples d'usage (optionnel)
├── scripts/           # Scripts utilitaires (optionnel)
│   └── helper.py
|── templates/         # Modèles de fichiers (optionnel)
|   └── template.txt
└── documentation/         # Documentation détaillée (optionnel)
    └── documentation.md

**Source** : [Skills Format](https://code.claude.com/docs/en/skills.md)
