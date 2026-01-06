# Analyse – Skill interne d’AI‑KIDO

## Description
Ce Skill fournit les capacités d’analyse de texte, de code et de données structurées.  
Il permet à Claude d’interpréter, de résumer et d’extraire des informations pertinentes à partir de documents variés.

## Métadonnées
- **Nom** : analyse
- **Version** : 1.0.0
- **Auteur** : AI‑KIDO Team
- **Catégorie** : analyse / compréhension
- **Tokens métadonnées** : ~100 (chargés à chaque invocation)

## Instructions (niveau 2)
1. Recevoir le texte ou le fichier à analyser.
2. Déterminer le type de contenu (plain‑text, code, JSON, etc.).
3. Appliquer les algorithmes d’extraction :
   - Résumé succinct (max 3 phrases).
   - Extraction des entités clés.
   - Détection des sections importantes.
4. Retourner un objet JSON contenant :
   ```json
   {
     "summary": "...",
     "entities": ["..."],
     "highlights": ["..."]
   }
   ```

## Ressources (niveau 3)
- Bibliothèques Python : `nltk`, `spacy`, `tree‑sitter` (pour le code).
- Prompt templates : `templates/analysis_prompt.txt` (optionnel).
- Exemples d’usage : `examples.md` (optionnel).

## Utilisation
Claude invoque ce Skill automatiquement lorsqu’une requête nécessite une compréhension approfondie du contenu fourni.  
Le Skill charge d’abord les métadonnées, puis les instructions, et enfin les ressources supplémentaires uniquement si nécessaire (progressive disclosure).

## Remarques
- Le Skill est **stateless** : chaque appel est indépendant.
- Limite de taille : jusqu’à 10 k tokens d’entrée (au‑delà, le texte doit être découpé).
- Les résultats sont renvoyés en UTF‑8 sans formatage supplémentaire.

## Agents Aikido associés
- `agent-aikido-update-controller` – gère le processus de mise à jour et utilise le Skill analyse.
- `agent-aikido-bank-populate` – utilise le Skill analyse pour extraire et analyser le contenu du projet.
- `agent-aikido-explore-all` – combine recherche et analyse, incluant le Skill analyse.
- `agent-aikido-explore-code` – explore le code source et applique le Skill analyse.
- `agent-aikido-explore-bank` – explore la Memory Bank et utilise le Skill analyse.