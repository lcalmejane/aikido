---
description: Crée un nouveau plan d'analyse projet pour /analyse-project en guidant l'utilisateur à travers le processus. Lit README.md pour template et exigences, demande le type d'analyse et la profondeur, génère la structure complète.
---

# Commande create-analyse-plan

Cette commande exécute le fichier de commande complet depuis `prompts/hard_points/commands/create-analyse-plan.md`.

**🎯 OBJECTIF** : Créer interactivement un plan d'analyse projet avec stratégies adaptées au type d'analyse (architecturale, technique, fonctionnelle, méthodologique).

**📋 PROCESSUS** :
1. Charge README.md (template et guidelines des plans d'analyse)
2. Questionnaire interactif (type analyse 1-18, profondeur 1-4, agents, sources, stratégie)
3. Génère structure complète avec pré-remplissage intelligent
4. Mise à jour automatique du README.md des plans

**🎨 TYPES D'ANALYSE SUPPORTÉS** :
- **Architecturales** : C1 (Contexte), C2 (Conteneurs), C3 (Composants), C4 (Code)
- **Techniques** : Stack générale, Backend, Frontend, Infrastructure, Sécurité
- **Fonctionnelles** : Générale, Domaine, Use cases, Workflows
- **Méthodologiques** : UML2, RUP, Agile, DevOps

**🔬 PROFONDEURS** : Survol (1), Standard (2), Approfondi (3), Expert (4)

**📊 AGENTS AI-KIDO** : Configuration automatique selon type/profondeur (explore-code, explore-all, truth-evaluator, raci-delegator, bank-populate, validator)

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

```
Lecture de prompts/hard_points/commands/create-analyse-plan.md et exécution des instructions...
```
