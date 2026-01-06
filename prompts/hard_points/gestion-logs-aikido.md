# Gestion des Logs AI‑KIDO
> Version: 1.0 | Date: 2025-11-06 | Statut: Actif

## Vue d'ensemble
Règles strictes pour la gestion des logs dans l'écosystème AI‑KIDO, incluant l'emplacement, le format et les procédures de test.

## Définitions clés
- **LLM_TRACIBILITY** : Variable de contrôle dans `/prompts/index.md`
- **Logs AI‑KIDO** : Fichiers de traçabilité des interactions LLM
- **Structure obligatoire** : `/prompts/spec/logs/prompts.log`

## Principes directeurs

### 🚨 RÈGLE CRITIQUE : Emplacement des Logs
**JAMAIS** créer de répertoire `/logs/` à la racine du projet.

**TOUJOURS** utiliser : `/prompts/spec/logs/prompts.log`

### 🔧 Procédure de Test des Logs

1. **Vérification de l'activation**
   ```bash
   # Vérifier dans /prompts/index.md
   grep "LLM_TRACIBILITY=TRUE" prompts/index.md
   ```

2. **Activation du logger**
   - Modifier `/prompts/index.md`
   - Section : `### Fonctionnalité de Traçabilité des Logs`
   - Variable : `LLM_TRACIBILITY=TRUE`

3. **Test de fonctionnement**
   - Générer une interaction LLM
   - Vérifier l'écriture dans `/prompts/spec/logs/prompts.log`

4. **Désactivation**
   - Modifier : `LLM_TRACIBILITY=FALSE`
   - Confirmer l'arrêt des logs

## Spécifications techniques

### Format Standard des Logs
```markdown
# DATE: YYYY-MM-DD HH-MM-SS
## PROMPT [Mode utilisé]
[Question de l'utilisateur]

```

### Structure de Répertoire Obligatoire
```
/prompts/
├── spec/
│   └── logs/
│       └── prompts.log    # ← SEUL emplacement autorisé
```

### Commandes de Contrôle
- **Activation** : Commande `logllmon` (voir `prompts/hard_points/commands/logllmon.md`)
- **Désactivation** : Commande `logllmoff` (voir `prompts/hard_points/commands/logllmoff.md`)

### 🔄 Règle de Changement de Mode pour Logs - AUTOMATIQUE
**DÉCLENCHEMENT AUTOMATIQUE :** Dès qu'une interaction utilisateur est détectée et que `LLM_TRACIBILITY=TRUE` :

1. **Vérifier le mode actuel** : Si ce n'est pas le Mode CODE
2. **Basculer automatiquement en Mode CODE** sans intervention manuelle
3. **Écrire immédiatement dans `/prompts/spec/logs/prompts.log`** selon le format :
   ```markdown
   # DATE: YYYY-MM-DD HH:MM:SS
   ## PROMPT [Mode d'origine]
   [Question de l'utilisateur]
   
   ```
4. **Revenir automatiquement au mode de départ** pour traiter la demande

**RÈGLE CRITIQUE :** Cette séquence doit s'exécuter AVANT toute autre opération, garantissant une traçabilité complète sans intervention manuelle.

## Exemples d'application

### ✅ Correct
```bash
# Vérifier l'existence du fichier de log
ls -la prompts/spec/logs/prompts.log

# Consulter les dernières entrées
tail -10 prompts/spec/logs/prompts.log
```

### ❌ Incorrect
```bash
# NE JAMAIS faire ceci
mkdir logs
touch logs/trace.md
```

## Relations et dépendances

### Fichiers Liés
- [`/prompts/index.md`](../../index.md) : Configuration `LLM_TRACIBILITY`
- [`/prompts/hard_points/ai-kido.md`](../../hard_points/ai-kido.md) : Règles fondamentales
- [`prompts/hard_points/commands/logllmon.md`](../../prompts/hard_points/commands/logllmon.md) : Activation
- [`prompts/hard_points/commands/logllmoff.md`](../../prompts/hard_points/commands/logllmoff.md) : Désactivation

### Règles de Validation
1. **Avant création** : Toujours consulter `/prompts/hard_points/ai-kido.md`
2. **Structure obligatoire** : Respecter l'arborescence définie (ligne 87)
3. **Format standard** : Suivre le template des logs (lignes 150-155)

### Signaux d'Alerte
- Création de répertoire `/logs/` à la racine
- Fichiers de log en dehors de `/prompts/spec/logs/`
- Format non conforme aux spécifications AI‑KIDO

---

**RAPPEL CRITIQUE** : Cette règle fait partie des mécanismes d'auto-alimentation d'AI‑KIDO pour prévenir les erreurs de structure.
