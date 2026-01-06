---
description: Valide la structure et cohérence d'un plan de recherche code par rapport aux exigences de agent-aikido-explore-code. Vérifie sections obligatoires, patterns regex, format output, et cohérence avec README.md.
---

# Commande validate-search-plan

Cette commande exécute le fichier de commande complet depuis `prompts/hard_points/commands/validate-search-plan.md`.

**🎯 OBJECTIF** : Valider qu'un plan de recherche code respecte les exigences de l'agent explore-code et les standards documentés.

**✅ VALIDATIONS EFFECTUÉES** :
1. **Sections obligatoires** : Overview, File Patterns, Search Method, Patterns de Recherche, Extension Strategy, Output Format, Context Extraction, Performance Optimization, Usage Example
2. **Patterns regex** : Import patterns, declaration patterns, function patterns (syntaxe valide)
3. **Output format** : Line numbers présents, catégories (Classes, Interfaces, Functions, Dependencies)
4. **Cohérence README** : Template conforme, métadonnées header
5. **Compatibilité agent** : Patterns extractibles (sed/grep), format parsable

**📊 RAPPORT GÉNÉRÉ** :
- Score global sur 100
- Détail par catégorie (sections, patterns, output, cohérence, compatibilité)
- Recommandations actionnables
- Statut final : ✅ Conforme | ⚠️ Améliorations nécessaires | ❌ Non conforme

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

```
Lecture de prompts/hard_points/commands/validate-search-plan.md et exécution des instructions...
```
