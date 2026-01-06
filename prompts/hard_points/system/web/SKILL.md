# Web – Skill interne d’AI‑KIDO

## Description
Le **Skill Web** d’AI‑KIDO gère les interactions avec le Web : téléchargement de sites, extraction de contenu pertinent, normalisation du HTML et génération de réponses structurées (texte brut ou JSON). Il permet aux agents (Claude, etc.) de récupérer dynamiquement des informations en ligne tout en respectant les politiques d’accès.

## Métadonnées
- **Nom** : Web
- - **Version** : 1.0.0
- **Auteur** : AI‑KIDO Team
- **Catégorie** : système / web
- **Tokens métadonnées** ≈ 100

## Instructions
1. **Identifier l’URL cible** – L’agent doit détecter une URL dans la requête ou recevoir l’URL en paramètre.
2. **Utiliser les scripts du sous‑répertoire `script/`** – appeler le script [`download_site.sh`](prompts/hard_points/system/web/script/download_site.sh:1) (ou son équivalent Python) pour récupérer le contenu brut du site.
3. **Normaliser le HTML** – nettoyer le HTML, supprimer les balises inutiles et extraire le texte pertinent (ex. via `beautifulsoup4`).
4. **Formater la sortie** – retourner le résultat soit en texte brut, soit en JSON selon le paramètre `format` demandé.

## Ressources
- **Scripts** : [`download_site.sh`](prompts/hard_points/system/web/script/download_site.sh:1)
- **Bibliothèques Bash/Python** : `curl`, `wget`, `beautifulsoup4`
- **Skills similaires** : [`analyse`](prompts/hard_points/system/analyse/SKILL.md:1), [`search`](prompts/hard_points/system/search/SKILL.md:1)

## Utilisation
```python
result = invoke_skill("web", {
    "url": "https://example.com",
    "format": "json"   # ou "text"
})
```
Le Skill s’active automatiquement lorsqu’une requête contient une URL ou lorsqu’un agent invoque explicitement `invoke_skill("web", …)`.

## Remarques
- **Stateless** : aucune donnée persistante n’est conservée entre les appels.
- **Limites de taille** : le téléchargement est limité à 10 Mo par appel pour éviter les abus.
- **Respect des politiques** : le Skill doit vérifier les règles d’accès du site (robots.txt, droits d’auteur) avant de télécharger.
- **Encodage** : sortie toujours en UTF‑8.

## Agents Aikido associés
- Aucun agent Aikido n’utilise actuellement ce Skill.