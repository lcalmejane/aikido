# reindex-projet

## Description

Lance l'agent ou switcher dans le mode **`agent-aikido-projet-index`** generate-all-indexes-v3.1.sh en passant les paramètres pour ré-indexer le projet et génère un log de suivi dans `/prompts/spec/logs/`.

**Compatibilité** : Roo-Code + Claude Code

## Syntaxe

```bash
/reindex-projet [chemin]
```

- `chemin` *(optionnel)* : chemin relatif pour une indexation ciblée (ex: `src/Domain`)
- Sans argument : indexation complète du projet

## Instructions

**IMPORTANT** : Exécute ces actions sans poser de questions, directement. NE JAMAIS essayer d'éditer oui modifier un fichier autre que le log.

1. Crée le répertoire `prompts/spec/logs/` s'il n'existe pas

2. Génère un nom de fichier log horodaté au format : `prompts/spec/logs/reindex-projet-YYYY-MM-DD_HH-MM-SS.log`

3. Affiche le header de démarrage :

```
╔══════════════════════════════════════════════════════════╗
║  📊 RÉINDEXATION DU PROJET - DÉMARRAGE                  ║
╚══════════════════════════════════════════════════════════╝
```

4. Lance l'agent/mode `agent-aikido-projet-index` pour qu'il execute generate-all-indexes-v3.1.sh dans une nouvelle tache en arrière-plan avec le chemin fourni si présent (variable `$ARGUMENTS`)

5. Affiche :

```
⚙️  Agent lancé en arrière-plan (ID: [agent-id])
📝 Log: prompts/spec/logs/reindex-projet-[timestamp].log
```

6. Surveille la progression de l'agent/mode et affiche en temps réel :
   - Timestamp au format `[HH:MM:SS]`
   - Symbole de statut : ⚙️ (en cours), ✓ (succès), ⚠️ (avertissement), ✗ (erreur)
   - Message de progression

7. Écris chaque sortie dans le fichier log

8. Quand l'agent/mode termine, affiche le résumé final :

```
╔══════════════════════════════════════════════════════════╗
║  ✓ RÉINDEXATION TERMINÉE AVEC SUCCÈS                    ║
╚══════════════════════════════════════════════════════════╝

⏱️  Durée: [X] secondes
📝 Log complet: prompts/spec/logs/reindex-projet-[timestamp].log
```

## Exemple de sortie attendue

```
╔══════════════════════════════════════════════════════════╗
║  📊 RÉINDEXATION DU PROJET - DÉMARRAGE                  ║
╚══════════════════════════════════════════════════════════╝

⚙️  Agent lancé en arrière-plan (ID: agent-123)
📝 Log: prompts/spec/logs/reindex-projet-2025-01-20_14-30-45.log

[14:30:45] ⚙️  Analyse de la structure du projet...
[14:30:47] ✓ Structure analysée (125 fichiers trouvés)
[14:30:48] ⚙️  Génération de l'index JSON...
[14:31:02] ✓ Index généré (2.4 MB)
[14:31:03] ⚙️  Validation de la structure...
[14:31:05] ✓ Validation terminée

╔══════════════════════════════════════════════════════════╗
║  ✓ RÉINDEXATION TERMINÉE AVEC SUCCÈS                    ║
╚══════════════════════════════════════════════════════════╝

⏱️  Durée: 20 secondes
📝 Log complet: prompts/spec/logs/reindex-projet-2025-01-20_14-30-45.log
```

## Notes

- **Compatibilité sortie** : Le format de sortie fonctionne dans les deux CLI (Roo-Code et Claude Code)
- Le log est conservé pour traçabilité dans `/prompts/spec/logs/`
- En cas d'erreur, le log contient les détails pour le debug
- Les caractères Unicode (✓ ⚙️ ⚠️ ✗ ╔═╗) sont supportés par les deux terminaux
