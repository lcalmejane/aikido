# AI-KIDO Knowledge Base

Ce fichier constitue le point d'entrée principal des **Tables de Vérités** du projet AI‑KIDO. Il référence les différents répertoires contenant les concepts, techniques, personas, cas d'usage, ainsi que les hard points (vérités immuables) et les spécifications personnelles.

## Système des Tables de Vérités

Les **Tables de Vérités** constituent notre système de mémoire arborescente permettant de capitaliser et structurer les connaissances AI‑KIDO de manière hiérarchique et interconnectée.

### Fonctionnalité de Traçabilité des Logs

LLM_TRACIBILITY=TRUE , Attention garde bien cette donnée pour savoir si la traçabilité est activée ou non.
**Si la traçabilité est activée, lire la doc dans** [`../hard_points/gestion-logs-aikido.md`](../hard_points/gestion-logs-aikido.md)

**🚨 RÈGLE AUTOMATIQUE DE LOGGING :**
Dès qu'une interaction utilisateur est détectée et que `LLM_TRACIBILITY=TRUE`, le système doit :
1. Basculer automatiquement en Mode CODE (si nécessaire)
2. Écrire immédiatement dans `/prompts/spec/logs/prompts.log`
3. Revenir au mode d'origine pour traiter la demande
Cette séquence s'exécute AVANT toute autre opération.

### ⚠️ RÈGLES PRIORITAIRES - AI-KIDO

**[AI-KIDO - Guide Complet](../hard_points/ai-kido.md)** - PRIORITÉ ABSOLUE

- **Architecture** : Arborescence, séparation théorie/pratique, introspection, 500 lignes max
- **Auto-Alimentation** : Déclenchement automatique sur erreur, seuils adaptatifs
- **Agents** : Spécialistes + orchestrateur, densité sémantique, indexation vectorielle
- **Amélioration Continue** : Évolution automatique selon besoins et LLM
- **Logs** : Traçabilité conditionnelle, format markdown, stockage structuré

## Structure

- [`concepts/`](concepts/index.md) : Concepts fondamentaux
- [`techniques/`](techniques/index.md) : Méthodes pratiques
- [`personas/`](personas/index.md) : Prompts par rôle
- [`use_cases/`](use_cases/index.md) : Applications par contexte
- [`hard_points/`](../hard_points/index.md) : Vérités immuables – Priorité absolue
- [`spec/`](../spec/index.md) : Espace personnel – Ignoré sauf activation explicite
