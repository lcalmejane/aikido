# AI‑KIDO – Base Commune (Vierge)

## Description

Cette base de connaissances vierge constitue le point de départ idéal pour tout projet **AI‑KIDO**.  
Elle regroupe les répertoires structurés nécessaires à la création, à la
documentation et à l’extension de concepts, techniques, personas et cas d’usage
propres à AI‑KIDO, tout en respectant les **hard points** d’authenticité.

## Structure du projet

- `prompts/gen/concepts/` : concepts fondamentaux (architecture, sécurité, etc.)  
- `prompts/gen/techniques/` : méthodes pratiques et bonnes pratiques  
- `prompts/gen/personas/` : profils de personnages AI‑KIDO (architecte, développeur, etc.)  
- `prompts/gen/use_cases/` : scénarios d’application concrets  
- `prompts/spec/` : spécifications propres au projet ou à l’utilisateur  
- `.roo/` : configuration de l’environnement Roo Code  

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/your-org/ai-kido-base.git
cd ai-kido-base

# (Optionnel) installer les dépendances du workspace
npm install   # si un package.json existe
```

## Utilisation

1. **Ajouter un concept** : créez un fichier Markdown dans `prompts/gen/concepts/`.  
2. **Décrire une technique** : ajoutez‑la sous `prompts/gen/techniques/`.  
3. **Définir un persona** : placez le fichier dans `prompts/gen/personas/`.  
4. **Modéliser un cas d’usage** : écrivez‑le dans `prompts/gen/use_cases/`.  
5. **Interroger avec Roo** : lancez `roo` depuis la racine du projet et utilisez les
   prompts générés.

## Contribution

Les contributions sont les bienvenues ! Veuillez suivre les étapes suivantes :

1. Fork du dépôt.  
2. Créez une branche `feature/…` ou `fix/…`.  
3. Respectez la structure décrite dans la section **Structure du projet**.  
4. Ouvrez une Pull Request avec une description claire des changements.

## Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier `LICENSE` pour plus de détails.

## Support & Contact

Pour toute question, ouvrez une *issue* ou contactez l’équipe mainteneur via
`maintainer@your-org.com`.
