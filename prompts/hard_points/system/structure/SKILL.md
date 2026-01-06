# Structure – Skill interne d’AI‑KIDO

## Description
Le **Skill « structure »** d’AI‑KIDO a pour rôle de **générer, analyser et maintenir la structure de répertoires et de fichiers du projet**.  
Il assure la conformité aux conventions de nommage, la profondeur d’arborescence définie dans les hard points, et crée ou supprime les artefacts de configuration nécessaires.

## Métadonnées
```yaml
nom: "Structure"
version: "V3.1"
auteur: "AI‑KIDO Team"
catégorie: "Système – Gestion de la structure"
tokens_métadonnées: 102
```

## Instructions
### 1. Scanner l’arborescence du projet
- Exécuter le script de génération d’arbre : [`generate-project-tree.sh`](prompts/hard_points/system/structure/scripts/generate-project-tree.sh:1)
- Analyser le résultat JSON pour détecter les répertoires manquants ou superflus.

### 2. Identifier les répertoires manquants ou superflus
- Comparer l’arbre actuel avec les conventions décrites dans [`ARCHITECTURE‑V3.md`](prompts/hard_points/system/structure/ARCHITECTURE-V3.md:1) et [`ARCHITECTURE‑V3.1‑HASH‑ID.md`](prompts/hard_points/system/structure/ARCHITECTURE-V3.1-HASH-ID.md:1).
- Utiliser le script de nettoyage des orphelins : [`clean-orphans.sh`](prompts/hard_points/system/structure/scripts/clean-orphans.sh:1).

### 3. Appliquer les conventions de nommage et de profondeur
- Vérifier la profondeur maximale (5 niveaux) et les préfixes de dossiers via le script d’analyse : [`generate-index-master.sh`](prompts/hard_points/system/structure/scripts/generate-index-master.sh:1).
- Renommer ou déplacer les dossiers non conformes en suivant les règles du fichier d’architecture.

### 4. Générer ou supprimer les fichiers de configuration nécessaires
- Créer ou mettre à jour le fichier d’architecture principal : [`ARCHITECTURE‑V3.md`](prompts/hard_points/system/structure/ARCHITECTURE-V3.md:1).
- Générer les index de métadonnées avec les scripts :
  - [`generate-all-indexes-v3.1.sh`](prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh:1)
  - [`format-file-metadata.sh`](prompts/hard_points/system/structure/scripts/format-file-metadata.sh:1)

## Ressources
### Bibliothèques / outils
- **Bash** – shell natif macOS, utilisé par tous les scripts.
- **Python `pathlib`** – optionnel pour des traitements avancés (ex. script `detect-project-type.sh`).

### Scripts utiles
- [`clean-orphans.sh`](prompts/hard_points/system/structure/scripts/clean-orphans.sh:1) – supprime les dossiers vides ou non référencés.  
- [`format-file-metadata.sh`](prompts/hard_points/system/structure/scripts/format-file-metadata.sh:1) – normalise les en‑têtes de métadonnées.  
- [`generate-project-tree.sh`](prompts/hard_points/system/structure/scripts/generate-project-tree.sh:1) – produit un arbre JSON du projet.  
- [`generate-index-by-directory.sh`](prompts/hard_points/system/structure/scripts/generate-index-by-directory.sh:1) – crée des index par répertoire.  
- [`watch-changes.sh`](prompts/hard_points/system/structure/scripts/watch-changes.sh:1) – surveille les modifications de structure en temps réel.

## Utilisation
Claude invoque automatiquement ce Skill lorsqu’une requête porte sur la **structure du projet** ou lorsqu’un **changement de structure** est détecté (ex. ajout/suppression de dossiers).  
Le processus typique est :
1. Détection du besoin (requête utilisateur ou événement de watch).  
2. Exécution du Skill qui suit les **Instructions** ci‑dessus.  
3. Retour d’un rapport JSON contenant les actions réalisées et les éventuels points d’attention.

## Remarques
- **Stateless** : le Skill ne conserve aucun état entre les invocations ; il se base uniquement sur l’état actuel du système de fichiers.  
- **Limites de taille** : le Skill traite des arborescences jusqu’à 10 000 fichiers sans dégradation notable.  
- **Encodage** : toutes les sorties sont en **UTF‑8**.  
- **Sécurité** : aucun script ne supprime de fichiers hors du répertoire `prompts/hard_points/system/structure/` sans confirmation explicite.

## Agents Aikido associés
- `agent-aikido-balancer` – assure l’équilibre de l’arborescence en appliquant les règles de profondeur et de branchement.
- `agent-aikido-maj-md-index` – met à jour les index de navigation après toute modification de structure.
- `agent-aikido-projet-index` – maintient l’index JSON de la structure du projet.
- `agent-aikido-explore-all` – utilise le Skill **structure** lorsqu’il doit analyser la structure globale du projet.