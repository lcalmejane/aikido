---
description: "Synchroniser les hard_points AI-KIDO et optimiser la memory bank lors des rebase git"
---

# Phase 1 : Détection des Changements AI-KIDO

Analyser les changements dans les fichiers critiques AI-KIDO depuis le dernier rebase :

1. **Vérifier les hard points modifiés** :
   - Lire `/prompts/hard_points/ai-kido.md` et détecter les nouvelles règles
   - Analyser `/prompts/hard_points/gestion-logs-aikido.md` pour les changements de traçabilité
   - Examiner `/prompts/hard_points/index.md` pour les nouvelles références

2. **Détecter les nouvelles commandes** dans `.roo/commands/` :
   - Scanner tous les fichiers `.md` dans `.roo/commands/`
   - Identifier les commandes ajoutées récemment
   - Vérifier qu'elles sont bien référencées dans `/prompts/gen/index.md`
   - S'assurer qu'elles sont documentées dans `AGENTS.md` si nécessaire

# Phase 2 : Analyse des Nouvelles Commandes (LECTURE SEULE)

Pour chaque nouvelle commande détectée :

1. **Analyser l'impact sur la memory bank** :
   - Vérifier si les commandes utilisent des concepts existants
   - Identifier les références aux fichiers de la memory bank
   - Détecter les incohérences potentielles avec la base existante

2. **Contrôler la compatibilité** :
   - Vérifier que les commandes respectent l'architecture AI-KIDO
   - S'assurer qu'elles n'entrent pas en conflit avec les hard points
   - Valider la cohérence terminologique

3. **Documenter les dépendances** :
   - Lister les fichiers de la memory bank référencés
   - Identifier les workflows impactés
   - Noter les personas utilisés

# Phase 3 : Mise à Jour de l'Index Général

1. **Synchroniser `/prompts/gen/index.md`** :
   - Ajouter les références aux nouvelles règles AI-KIDO
   - Mettre à jour la section traçabilité si `LLM_TRACIBILITY` a changé
   - Enrichir les liens vers les nouveaux éléments créés

2. **Créer ou mettre à jour `AGENTS.md`** à la racine selon la norme AI-KIDO :
   - Synchroniser avec la taxonomie des personas
   - Mettre à jour la matrice RACI des agents
   - Assurer la cohérence avec `/prompts/gen/personas/`

# Phase 4 : Diagnostic de Cohérence Memory Bank

1. **Audit de cohérence structurelle** :
   - Vérifier que tous les fichiers respectent la limite de 500 lignes
   - Contrôler les liens bidirectionnels (A→B implique B→A)
   - Détecter les références orphelines et les doublons conceptuels

2. **Calculer les métriques de qualité** :
   - Conformité : % de fichiers respectant les standards
   - Traçabilité : % de fichiers avec références sources
   - Cohérence : nombre de contradictions internes détectées
   - Densité : ratio information utile / tokens utilisés

# Phase 5 : Optimisation de la Memory Bank AI-KIDO

1. **Corriger les incohérences détectées** :
   - Réparer les liens orphelins identifiés en Phase 4
   - Harmoniser la terminologie dans les fichiers existants
   - Synchroniser les références bidirectionnelles manquantes
   - Mettre à jour les index obsolètes

2. **Optimiser la structure existante** :
   - Diviser les fichiers > 500 lignes avec préservation des liens
   - Éliminer les redondances par fusion intelligente
   - Améliorer la navigation entre les concepts liés
   - Standardiser les formats selon les templates AI-KIDO

# Phase 6 : Validation et Rapport Final

1. **Générer le rapport de synchronisation** avec :
   - Nombre de changements traités
   - Nouveaux éléments créés par catégorie
   - Métriques de qualité avant/après
   - État de conformité AI-KIDO

2. **Valider la cohérence globale** :
   - Vérifier que toutes les nouvelles commandes sont supportées
   - Contrôler la synchronisation AGENTS.md ↔ personas
   - Confirmer le respect des règles AI-KIDO

**PRINCIPE FONDAMENTAL** : Cette commande ne modifie JAMAIS les commandes existantes et ne crée JAMAIS de nouveaux fichiers basés sur les commandes. Elle optimise uniquement la cohérence interne de la memory bank AI-KIDO existante en corrigeant les incohérences, liens cassés et problèmes structurels détectés.
