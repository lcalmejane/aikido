# Recherche – Skill interne d’AI‑KIDO

## Description
Ce Skill fournit les capacités de recherche à travers la *Memory Bank* et le code source du projet.  
Il permet à Claude d’interroger, de filtrer et de récupérer des informations pertinentes depuis les documents, les prompts et les artefacts de code.

## Métadonnées
- **Nom** : search
- - **Version** : 1.0.0
- **Auteur** : AI‑KIDO Team
- **Catégorie** : recherche / exploration
- **Tokens métadonnées** ≈ 100

## Instructions (niveau 2)
1. Recevoir la requête de recherche (mot‑clé, expression régulière, ou description sémantique).
2. Déterminer le scope :
   - **Memory Bank** : parcourir les fichiers sous `prompts/` (index, hard_points, gen, etc.).
   - **Code base** : parcourir les fichiers source du projet (ex. `*.py`, `*.js`, `*.md`).
3. Appliquer les algorithmes de recherche :
   - Recherche textuelle simple.
   - Recherche par expression régulière.
   - Recherche sémantique (via embeddings, si disponible).
4. Retourner un résultat structuré :
   ```json
   {
     "matches": [
       {
         "path": "chemin/vers/fichier.md",
         "line": 42,
         "excerpt": "…extrait contenant le terme…"
       }
     ],
     "summary": "Nombre total de correspondances et aperçu des résultats."
   }
   ```

## Ressources (niveau 3)
- Bibliothèques Python : `re`, `fnmatch`, `whoosh` (optionnel pour recherche full‑text).
- Prompt templates : `templates/search_prompt.txt` (optionnel).
- Exemples d’usage : `examples.md` (optionnel).

## Utilisation
Claude invoque ce Skill automatiquement lorsqu’une requête explicite de recherche est détectée.  
Le Skill charge d’abord les métadonnées, puis les instructions, et enfin les ressources supplémentaires uniquement si nécessaire (progressive disclosure).

## Remarques
- Le Skill est **stateless** : chaque appel est indépendant.
- Limite de taille : la requête de recherche doit être inférieure à 2 k tokens.
- Les résultats sont renvoyés en UTF‑8 sans mise en forme supplémentaire.

## Agents Aikido associés
- `agent-aikido-explore-all` – combine recherche et analyse, utilise le Skill **search**.
- `agent-aikido-explore-code` – explore le code source et utilise le Skill **search** pour localiser des informations.
- `agent-aikido-explore-bank` – recherche dans la Memory Bank en utilisant le Skill **search**.