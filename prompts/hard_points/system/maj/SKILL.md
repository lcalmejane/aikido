# Maj – Skill interne d’AI‑KIDO

## Description
Ce Skill gère le processus complet de mise à jour du système AI‑KIDO : il détecte le contexte du projet, sélectionne le plan de mise à jour approprié, exécute les scripts de migration, met à jour les métadonnées de version et valide la réussite de l’opération.

## Métadonnées
| Champ          | Valeur                              |
|----------------|-------------------------------------|
| **Nom**        | maj                                 |
| **Version**    | 1.0.0                               |
| **Auteur**     | AI‑KIDO Team                        |
| **Catégorie**  | maj                                 |
| **Tokens**     | ~100                                |
| **Date de création** | 2025‑12‑19                     |

## Instructions
1. **Analyser le contexte du projet** – exécuter le script de détection : [`scripts/detect-project-type.sh`](prompts/hard_points/system/maj/scripts/detect-project-type.sh:1).  
2. **Sélectionner le plan de mise à jour** – choisir le plan correspondant à la version cible, par ex. [`plan-V1.3.0.0.md`](prompts/hard_points/system/maj/plans/plan-V1.3.0.0.md:1).  
3. **Exécuter les scripts de migration** – lancer les scripts situés dans `maj/scripts/…` selon le plan choisi.  
4. **Mettre à jour les fichiers d’index et les métadonnées** – ajuster les références de version dans les fichiers d’index, les headers et les fichiers de configuration.  
5. **Valider la réussite** – lancer les tests automatisés, vérifier la cohérence des dépendances et s’assurer que les versions sont correctement enregistrées.

## Ressources
- **Scripts existants** :  
  - [`detect-project-type.sh`](prompts/hard_points/system/maj/scripts/detect-project-type.sh:1)  
  - Scripts de migration dans `prompts/hard_points/system/maj/scripts/` (ex. `upgrade-db.sh`, `update-config.sh`).  
- **Plans de version** : le répertoire [`prompts/hard_points/system/maj/plans/`](prompts/hard_points/system/maj/plans/:1) contient tous les plans détaillés.  
- **Documentation liée** : [`prompts/hard_points/system/maj/plans/README.md`](prompts/hard_points/system/maj/plans/README.md:1).  
- **Outils de validation** : `agent‑aikido‑validator` pour vérifier la conformité post‑mise à jour.

## Utilisation
```python
invoke_skill("maj", {
    "target_version": "V1.3.0.0",
    "project_path": "/path/to/project"
})
```
Le Skill s’active automatiquement lorsqu’une requête contient les mots‑clés « mise à jour », « upgrade » ou « changement de version ».

## Remarques
- Le Skill est **stateless** : il ne conserve aucune donnée entre les exécutions.  
- Taille maximale des scripts : 5 Mo.  
- Toutes les sorties sont encodées en UTF‑8 et journalisées dans `logs/maj.log`.  
- Respect strict des politiques de versionnage : aucune modification n’est appliquée sans validation préalable du plan et des tests.