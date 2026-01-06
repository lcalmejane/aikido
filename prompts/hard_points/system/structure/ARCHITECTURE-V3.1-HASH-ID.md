# Architecture V3.1 - Hash-Based ID Normalization

> **Version**: 3.1 | **Date**: 2025-12-09 | **Statut**: Specification
>
> Evolution majeure de V3.0 : Normalisation par ID hash-based pour déduplication et performance O(1).

## 🎯 Innovation Majeure V3.1 : Hash-Based IDs

### Problème V3.0 (Duplication)

**Métadonnées dupliquées dans 4+ index** :

- `by-path/index-path-NNN.json` : Métadonnées complètes (300 bytes/fichier)
- `by-alphabetical/index-alpha-XXX.json` : Métadonnées dupliquées (300 bytes/fichier)
- `by-directory/index-dir-NNN.json` : Métadonnées dupliquées (200 bytes/fichier)
- `by-type/index-type-XXX.json` : Métadonnées dupliquées (300 bytes/fichier)

**Coût projet 5000 fichiers** : 5000 × (300+300+200+300) = **5.5MB** ❌

### Solution V3.1 (Hash-Based Normalization)

**Principe** :

1. **ID = hash(path)** → Identifiant unique, prédictif, déterministe
2. **Index by-id** → Source de vérité unique (métadonnées complètes)
3. **Autres index** → Références ID uniquement (15 bytes/fichier)

**Coût projet 5000 fichiers** :

- by-id: 5000 × 300B = 1.5MB (source unique)
- by-path: 5000 × 15B = 75KB (refs)
- by-alpha: 5000 × 15B = 75KB (refs)
- by-dir: 5000 × 15B = 75KB (refs)
- by-type: 5000 × 15B = 75KB (refs)
- **Total** : **1.8MB** ✅ = **67% économie** ⚡⚡⚡

## 🔑 Fonction de Hash

### Hash Function Spec

**Algorithme** : SHA-256 tronqué à 12 caractères hexadécimaux

**Pourquoi SHA-256 ?**

- ✅ Disponible nativement (openssl, shasum)
- ✅ Distribution uniforme (bon pour partitioning)
- ✅ Pas de collision pratique (2^48 espace avec 12 chars hex)
- ✅ Déterministe et reproductible

**Implémentation Bash** :

```bash
# Génération ID hash-based
generate_file_id() {
    local path="$1"
    # SHA-256 du path, tronqué à 12 caractères hexadécimaux
    echo -n "$path" | shasum -a 256 | cut -c1-12
}

# Exemple
# generate_file_id "prompts/hard_points/commands/init-aikido.md"
# → "7f8a3c4b2e1d"
```

**Format ID** : `[a-f0-9]{12}` (12 chars hexadécimal)

**Exemples** :

```
prompts/hard_points/commands/init-aikido.md           → 7f8a3c4b2e1d
prompts/gen/personas/agent-indexer.md → 9b3e5f1a8c2d
prompts/hard_points/ai-kido.md         → 4d6c1a9f3e7b
```

### Propriétés Clés

1. **Prédictif** : Calculer ID sans charger aucun index

   ```bash
   # Connaître l'ID immédiatement
   id=$(generate_file_id "$path")
   # → Lookup direct dans by-id sans table de mapping
   ```

2. **Déterministe** : Même path = même ID toujours

   ```bash
   # ID stable entre régénérations
   generate_file_id "prompts/index.md"  # → abc123def456
   # Toujours le même ID pour ce path
   ```

3. **Distribution uniforme** : Bon pour partitioning batches

   ```bash
   # Premier digit hex pour router vers batch (16 batches max)
   batch_id="${id:0:1}"  # 0-f (16 possibilités)
   batch_file="index-id-${batch_id}.json"
   ```

4. **Pas de collision** : 2^48 espace (281 trillions d'IDs uniques)
   - Projet 10K fichiers : probabilité collision < 0.000001%

## 📐 Architecture Fichiers V3.1

### Structure Répertoires

```
prompts/hard_points/system/structure/
├── index.json                              # Master index (hash tables + routing)
├── indices/
│   ├── by-id/                             # ⭐ SOURCE DE VÉRITÉ UNIQUE
│   │   ├── index-id-0.json                # IDs commençant par 0
│   │   ├── index-id-1.json                # IDs commençant par 1
│   │   ├── ...
│   │   └── index-id-f.json                # IDs commençant par f (16 batches total)
│   ├── by-path/                           # Mapping path → ID (refs uniquement)
│   │   ├── index-path-000.json            # Paths [0-999]
│   │   └── index-path-NNN.json
│   ├── by-alphabetical/                   # Mapping name → ID(s) (refs uniquement)
│   │   ├── index-alpha-a-d.json
│   │   └── index-alpha-n-z.json
│   ├── by-directory/                      # Mapping dir → ID(s) (refs uniquement)
│   │   └── index-dir-NNN.json
│   └── by-type/                           # Mapping type → ID(s) (refs uniquement)
│       └── index-type-TYPE.json
└── scripts/
    ├── generate-project-tree.sh           # Orchestrateur V3.1
    ├── generate-index-master.sh           # Master index
    ├── generate-index-by-id.sh            # ⭐ NOUVEAU : Index by-id (source vérité)
    ├── generate-index-by-path.sh          # Index path → ID refs
    ├── generate-index-by-alpha.sh         # Index name → ID refs
    ├── generate-index-by-directory.sh     # Index dir → ID refs
    ├── generate-index-by-type.sh          # Index type → ID refs
    └── lib/hash-utils.sh                  # ⭐ NOUVEAU : Fonctions hash ID
```

### Partitioning by-id (16 batches)

**Stratégie** : Premier caractère hex de l'ID → Batch (0-f = 16 batches)

**Distribution uniforme** :

- SHA-256 garantit distribution uniforme
- ~312 fichiers/batch pour 5000 fichiers (5000/16)
- ~625 fichiers/batch pour 10000 fichiers

**Exemple** :

```
ID: 7f8a3c4b2e1d → batch: index-id-7.json
ID: 9b3e5f1a8c2d → batch: index-id-9.json
ID: 4d6c1a9f3e7b → batch: index-id-4.json
```

**Avantages** :

- ✅ Batches équilibrés automatiquement (hash uniforme)
- ✅ 16 batches seulement (vs 1000+ pour by-path)
- ✅ Lookup O(1) : calcul ID → extraction 1er char → batch déterminé

## 🔧 Formats JSON V3.1

### 1. Master Index (index.json)

**Changements vs V3.0** :

- Ajout section `by_id` dans hash_tables
- Batching by-id : 16 batches fixes (0-f)

```json
{
  "metadata": {
    "version": "3.1-hash-id",
    "id_format": {
      "algorithm": "sha256",
      "length": 12,
      "charset": "hex",
      "example": "7f8a3c4b2e1d"
    },
    "last_check": {
      "timestamp": "2025-12-09T22:45:16Z",
      "generator": "agent-aikido-projet-index",
      "version": "3.1"
    },
    "statistics": {
      "total_files": 5432,
      "total_dirs": 234,
      "total_lines": 234567,
      "index_files_count": 29
    },
    "batching": {
      "batch_size": 1000,
      "by_id_batches": 16,
      "by_path_batches": 6,
      "by_alphabetical_batches": 3,
      "by_directory_batches": 1,
      "by_type_batches": 8
    }
  },
  "hash_tables": {
    "by_id": {
      "0": {"batch": "indices/by-id/index-id-0.json", "count": 342},
      "1": {"batch": "indices/by-id/index-id-1.json", "count": 339},
      "...": "...",
      "f": {"batch": "indices/by-id/index-id-f.json", "count": 340}
    },
    "by_path": {
      ".roo": {"batch": "indices/by-path/index-path-000.json", "offset": 0, "count": 18},
      "prompts": {"batch": "indices/by-path/index-path-001.json", "offset": 1000, "count": 175}
    },
    "by_alphabetical": {
      "a-d": {"batch": "indices/by-alphabetical/index-alpha-a-d.json", "range": ["a", "d"], "count": 823}
    },
    "by_directory": {
      ".roo/commands": {"batch": "indices/by-directory/index-dir-000.json", "offset": 0, "files_count": 18}
    },
    "by_type": {
      "agent": {"batch": "indices/by-type/index-type-agent.json", "count": 12}
    }
  },
  "routing": {
    "description": "Hash-based ID routing en O(1) - Calcul ID puis lookup direct",
    "examples": {
      "find_by_path": "prompts/gen/personas/agent.md → hash(path) → ID 9b3e5f1a → by-id/index-id-9.json",
      "find_by_name": "agent.md → by-alphabetical → ID 9b3e5f1a → by-id/index-id-9.json",
      "direct_by_id": "ID 9b3e5f1a → extract first char '9' → by-id/index-id-9.json"
    }
  }
}
```

### 2. Index by-id (SOURCE DE VÉRITÉ UNIQUE)

**Rôle** : Contient TOUTES les métadonnées complètes, indexé par ID hash

**Taille** : ~300KB par batch (342 fichiers × ~900 bytes JSON par fichier)

**Format** :

```json
{
  "metadata": {
    "batch_id": "id-7",
    "id_prefix": "7",
    "count": 342,
    "generated": "2025-12-09T22:45:16Z"
  },
  "files": {
    "7f8a3c4b2e1d": {
      "name": "init-aikido.md",
      "path": "prompts/hard_points/commands/init-aikido.md",
      "type": "markdown",
      "icon": "📄",
      "size_bytes": 36065,
      "lines": 1036,
      "modified": "2025-12-09",
      "check_status": "N/A",
      "extension": "md"
    },
    "7a2b4c6d8e9f": {
      "name": "analyse-aikido.md",
      "path": "prompts/hard_points/commands/analyse-aikido.md",
      "type": "markdown",
      "icon": "📄",
      "size_bytes": 21418,
      "lines": 613,
      "modified": "2025-12-08",
      "check_status": "N/A",
      "extension": "md"
    }
  }
}
```

**Stratégie découpage** :

- Partitioning par premier caractère hex de l'ID (0-f)
- 16 batches fixes, distribution uniforme garantie par SHA-256

### 3. Index by-path (RÉFÉRENCES ID UNIQUEMENT)

**Rôle** : Mapping path → ID hash (ultra léger)

**Taille** : ~15 bytes par fichier (vs 300 bytes avant) = **95% économie** ⚡⚡⚡

**Format** :

```json
{
  "metadata": {
    "batch_id": "path-000",
    "offset": 0,
    "count": 1000,
    "generated": "2025-12-09T22:45:16Z"
  },
  "paths": {
    "prompts/hard_points/commands/init-aikido.md": "7f8a3c4b2e1d",
    "prompts/hard_points/commands/analyse-aikido.md": "7a2b4c6d8e9f",
    "prompts/hard_points/commands/maj-aikido.md": "7c3d5e7f9a1b"
  }
}
```

**Avantages** :

- ✅ **95% réduction taille** vs V3.0
- ✅ Format ultra simple : `path: id` (string: string)
- ✅ Parse instantané

### 4. Index by-alphabetical (RÉFÉRENCES ID UNIQUEMENT)

**Rôle** : Mapping name → ID(s) hash (gestion homonymes)

**Taille** : ~15-30 bytes par fichier (selon homonymes)

**Format** :

```json
{
  "metadata": {
    "batch_id": "alpha-i-n",
    "range": ["i", "n"],
    "count": 987,
    "generated": "2025-12-09T22:45:16Z"
  },
  "files": {
    "init-aikido.md": ["7f8a3c4b2e1d"],
    "index.md": ["9b3e5f1a8c2d", "4d6c1a9f3e7b", "2a8f3b9c1d5e"],
    "indexer.md": ["6e2d4a7b9c3f"]
  }
}
```

**Notes** :

- Array d'IDs pour gérer homonymes (ex: index.md présent dans 3 répertoires)
- Si 1 seul ID : peut être optimisé en string (vs array)

### 5. Index by-directory (RÉFÉRENCES ID UNIQUEMENT)

**Rôle** : Mapping directory → ID(s) hash

**Taille** : ~15-200 bytes par répertoire (selon nombre fichiers)

**Format** :

```json
{
  "metadata": {
    "batch_id": "dir-000",
    "offset": 0,
    "directories_count": 45,
    "generated": "2025-12-09T22:45:16Z"
  },
  "directories": {
    ".roo/commands": {
      "files_count": 18,
      "ids": ["7f8a3c4b2e1d", "7a2b4c6d8e9f", "7c3d5e7f9a1b", "..."]
    },
    "prompts/gen/personas": {
      "files_count": 12,
      "ids": ["9b3e5f1a8c2d", "9d4e6f2a9c3e", "..."]
    }
  }
}
```

### 6. Index by-type (RÉFÉRENCES ID UNIQUEMENT)

**Rôle** : Mapping type → ID(s) hash

**Taille** : ~15-200 bytes par type

**Format** :

```json
{
  "metadata": {
    "batch_id": "type-agent",
    "type": "agent",
    "count": 12,
    "generated": "2025-12-09T22:45:16Z"
  },
  "ids": [
    "9b3e5f1a8c2d",
    "9d4e6f2a9c3e",
    "9f5e7a3b1d2c",
    "..."
  ]
}
```

## 🔄 Workflows V3.1

### Workflow 1 : Query by Path (O(1) Direct)

**Query** : "Find prompts/hard_points/commands/init-aikido.md"

**Process V3.1 (optimisé)** :

```bash
# Step 1: Calculer ID hash (0ms - local)
id=$(generate_file_id "prompts/hard_points/commands/init-aikido.md")
# → "7f8a3c4b2e1d"

# Step 2: Déterminer batch by-id (0ms - local)
batch_prefix="${id:0:1}"  # → "7"
batch_file="indices/by-id/index-id-${batch_prefix}.json"
# → "indices/by-id/index-id-7.json"

# Step 3: Load batch if needed (~50ms)
load_batch "$batch_file"

# Step 4: Lookup ID dans batch (0ms - hash lookup)
metadata=$(jq ".files[\"$id\"]" "$batch_file")

# Total: ~50ms (cache MISS), <1ms (cache HIT)
```

**Avantages vs V3.0** :

- ✅ **Pas besoin master index** pour déterminer batch (calcul local)
- ✅ **O(1) direct** : hash → batch déterminé instantanément
- ✅ **Pas besoin by-path** si on connaît le path (lookup direct by-id)

**Comparaison** :

| Étape | V3.0 | V3.1 | Gain |
|-------|------|------|------|
| Load master | ~5ms | **0ms** (optionnel) | ✅ |
| Lookup hash table | ~5ms | **0ms** (calcul local) | ✅ |
| Load batch by-path | ~50ms | - | - |
| Calculate ID | - | **<1ms** (hash) | - |
| Load batch by-id | - | ~50ms | - |
| **Total** | ~60ms | **~50ms** | **17% faster** ⚡ |

### Workflow 2 : Query by Name (avec by-alphabetical)

**Query** : "Find agent-aikido-maj-md-index.md"

**Process V3.1** :

```bash
# Step 1: Load master index (~5ms)
# (pour déterminer batch alphabetical)

# Step 2: Lookup batch alphabetical (~5ms)
range=$(jq '.hash_tables.by_alphabetical | to_entries[] | select(.value.range[0] <= "a" and .value.range[1] >= "a") | .value.batch' index.json)
# → "indices/by-alphabetical/index-alpha-a-d.json"

# Step 3: Load batch alphabetical (~50ms)
ids=$(jq '.files["agent-aikido-maj-md-index.md"]' "$range")
# → ["9b3e5f1a8c2d"]

# Step 4: Pour chaque ID, lookup by-id
for id in $ids; do
    batch_prefix="${id:0:1}"  # → "9"
    batch_file="indices/by-id/index-id-${batch_prefix}.json"

    # Load batch by-id if needed (~50ms first time)
    metadata=$(jq ".files[\"$id\"]" "$batch_file")
done

# Total: ~110ms (cache MISS), ~60ms (partial cache), <5ms (full cache)
```

**Avantages vs V3.0** :

- ✅ **Métadonnées déduplicates** : 1 seule source (by-id)
- ✅ **Cache réutilisable** : by-id batch peut servir plusieurs queries

### Workflow 3 : Incremental Update (OPTIMISÉ)

**Trigger** : File modified "prompts/gen/personas/agent-new.md"

**Process V3.1** :

```bash
# Step 1: Calculate ID
id=$(generate_file_id "prompts/gen/personas/agent-new.md")
# → "a3b5c7d9e1f2"

# Step 2: Determine by-id batch
batch_prefix="${id:0:1}"  # → "a"
batch_file="indices/by-id/index-id-${batch_prefix}.json"

# Step 3: Update by-id ONLY (source de vérité)
# Extract metadata → update batch file
update_by_id_batch "$batch_file" "$id" "$metadata"

# Step 4: Update secondary indexes (refs ID only, ultra light)
# by-path
update_by_path_ref "prompts/gen/personas/agent-new.md" "$id"

# by-alphabetical
update_by_alpha_ref "agent-new.md" "$id"

# by-directory
update_by_dir_ref "prompts/gen/personas" "$id"

# by-type
update_by_type_ref "agent" "$id"

# Total: ~1-2s (1 batch by-id + 4 refs updates ultra légères)
```

**Avantages vs V3.0** :

- ✅ **Métadonnées écrites 1 seule fois** (by-id uniquement)
- ✅ **Refs ultra légères** : 4 × 15 bytes = 60 bytes total (vs 1200 bytes V3.0)
- ✅ **Cohérence garantie** : 1 source de vérité

## 📊 Comparaison V3.0 vs V3.1

### Taille Fichiers (Projet 5000 fichiers)

| Index | V3.0 | V3.1 | Gain |
|-------|------|------|------|
| **by-path** | 1.5MB | 75KB | **95%** ⚡⚡⚡ |
| **by-alphabetical** | 1.5MB | 75KB | **95%** ⚡⚡⚡ |
| **by-directory** | 1MB | 75KB | **93%** ⚡⚡⚡ |
| **by-type** | 1.5MB | 75KB | **95%** ⚡⚡⚡ |
| **by-id** (nouveau) | - | 1.5MB | Source unique |
| **TOTAL** | **5.5MB** | **1.8MB** | **67%** ⚡⚡⚡ |

### Performance Queries

| Query Type | V3.0 | V3.1 | Note |
|------------|------|------|------|
| **By Path** | ~60ms | ~50ms | V3.1 : calcul ID local, pas besoin master |
| **By Name** | ~60ms | ~60ms | Identique (nécessite alphabetical lookup) |
| **By Directory** | ~60ms | ~60ms | Identique |
| **By Type** | ~60ms | ~60ms | Identique |
| **By ID Direct** | N/A | ~50ms | ✅ NOUVEAU : Lookup O(1) si ID connu |

### Mise à Jour Incrémentale

| Opération | V3.0 | V3.1 | Gain |
|-----------|------|------|------|
| **Update metadata** | 4 batches × 300B = 1.2KB | 1 batch × 300B = 300B | **75%** ⚡⚡ |
| **Update refs** | - | 4 refs × 15B = 60B | Ultra léger |
| **Total write** | 1.2KB | 360B | **70%** ⚡⚡ |
| **Time** | ~1-2s | ~0.8-1.5s | **20-25% faster** ⚡ |

### Cohérence Données

| Aspect | V3.0 | V3.1 | Avantage |
|--------|------|------|----------|
| **Sources de vérité** | 4 (duplication) | **1** (by-id) | V3.1 ⚡⚡⚡ |
| **Risque incohérence** | Élevé | **Minimal** | V3.1 ⚡⚡⚡ |
| **Update complexity** | Haute (4 sources) | **Faible** (1 source + refs) | V3.1 ⚡⚡⚡ |

## ⚙️ Implémentation

### Script lib/hash-utils.sh (NOUVEAU)

```bash
#!/bin/bash

# hash-utils.sh - Fonctions utilitaires pour hash-based IDs
# Version 3.1

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Génération ID hash-based à partir du path
# Input: path (string)
# Output: ID hash 12 chars hex (string)
generate_file_id() {
    local path="$1"

    # SHA-256 du path, tronqué à 12 caractères hexadécimaux
    echo -n "$path" | shasum -a 256 | cut -c1-12
}

# Détermination du batch by-id à partir de l'ID
# Input: id (string 12 chars hex)
# Output: batch file path (string)
get_by_id_batch_file() {
    local id="$1"

    # Extraire premier caractère hex (0-f)
    local batch_prefix="${id:0:1}"

    # Construire path batch file
    echo "indices/by-id/index-id-${batch_prefix}.json"
}

# Validation format ID
# Input: id (string)
# Output: 0 (valid) ou 1 (invalid)
validate_id_format() {
    local id="$1"

    # Vérifier longueur 12 et charset hexadécimal
    if [[ "${#id}" -eq 12 ]] && [[ "$id" =~ ^[0-9a-f]{12}$ ]]; then
        return 0
    else
        echo "Invalid ID format: $id (expected 12 hex chars)" >&2
        return 1
    fi
}

# Batch files pour tous les préfixes (0-f)
# Output: Liste des 16 batch files
list_all_by_id_batches() {
    for prefix in {0..9} {a..f}; do
        echo "indices/by-id/index-id-${prefix}.json"
    done
}

# Exemple usage
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Test unitaire
    echo "Testing hash-utils.sh..."

    test_path="prompts/hard_points/commands/init-aikido.md"
    test_id=$(generate_file_id "$test_path")

    echo "Path: $test_path"
    echo "ID: $test_id"
    echo "Batch: $(get_by_id_batch_file "$test_id")"

    validate_id_format "$test_id" && echo "✅ ID format valid" || echo "❌ ID format invalid"
fi
```

### Modifications Scripts Génération

**generate-index-by-id.sh (NOUVEAU)** :

```bash
#!/bin/bash

# generate-index-by-id.sh - Génération index by-id (source de vérité)
# Version 3.1

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

source "$(dirname "$0")/lib/hash-utils.sh"

# Collecter tous fichiers et générer ID
# Group par batch (préfixe 0-f)
collect_files_by_id() {
    cd "$PROJECT_ROOT"

    # Créer 16 fichiers temporaires (un par préfixe hex)
    for prefix in {0..9} {a..f}; do
        temp_files["$prefix"]=$(mktemp)
    done

    # Scanner tous fichiers
    while IFS= read -r -d '' file; do
        if ! should_exclude "$file"; then
            [[ -f "$file" ]] || continue

            relative_path="${file#./}"

            # Générer ID hash
            id=$(generate_file_id "$relative_path")

            # Extraire métadonnées
            metadata=$(extract_metadata "$file")

            # Déterminer batch prefix
            batch_prefix="${id:0:1}"

            # Append au fichier temp correspondant
            echo "\"$id\":$metadata," >> "${temp_files[$batch_prefix]}"
        fi
    done < <(find . -type f -print0 2>/dev/null)

    # Générer 16 fichiers JSON finaux
    for prefix in {0..9} {a..f}; do
        generate_batch_file "$prefix" "${temp_files[$prefix]}"
    done
}

# Générer fichier batch JSON
generate_batch_file() {
    local prefix="$1"
    local temp_file="$2"

    local batch_file="prompts/hard_points/system/structure/indices/by-id/index-id-${prefix}.json"
    local count=$(wc -l < "$temp_file")

    # Header
    echo "{" > "$batch_file"
    echo "  \"metadata\": {" >> "$batch_file"
    echo "    \"batch_id\": \"id-${prefix}\"," >> "$batch_file"
    echo "    \"id_prefix\": \"${prefix}\"," >> "$batch_file"
    echo "    \"count\": $count," >> "$batch_file"
    echo "    \"generated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" >> "$batch_file"
    echo "  }," >> "$batch_file"
    echo "  \"files\": {" >> "$batch_file"

    # Content (enlever dernière virgule)
    sed '$ s/,$//' "$temp_file" >> "$batch_file"

    # Footer
    echo "  }" >> "$batch_file"
    echo "}" >> "$batch_file"

    # Cleanup
    rm "$temp_file"
}

# Main
main() {
    echo "Generating by-id index (hash-based, 16 batches)..."
    collect_files_by_id
    echo "✅ by-id index generated"
}

main "$@"
```

**Modifications autres scripts** :

- `generate-index-by-path.sh` : Stocker `path: id` au lieu de métadonnées complètes
- `generate-index-by-alpha.sh` : Stocker `name: [ids]` au lieu de métadonnées complètes
- `generate-index-by-directory.sh` : Stocker `dir: {ids: [...]}` au lieu de métadonnées complètes
- `generate-index-by-type.sh` : Stocker `type: [ids]` au lieu de métadonnées complètes

## 🎯 Avantages Clés V3.1

### 1. Déduplication (67% économie espace)

- ✅ Métadonnées stockées UNE SEULE FOIS (by-id)
- ✅ Autres index : références ID ultra légères (15 bytes)

### 2. Prédictivité O(1)

- ✅ Calcul ID hash local (pas besoin charger index)
- ✅ Batch déterminé instantanément (1er char hex)
- ✅ Lookup direct sans table de mapping

### 3. Cohérence Garantie

- ✅ 1 source de vérité unique (by-id)
- ✅ Mise à jour centralisée
- ✅ Pas de risque désynchronisation

### 4. Performance Optimale

- ✅ Query by-path : ~50ms (17% faster que V3.0)
- ✅ Incremental update : ~0.8-1.5s (20-25% faster)
- ✅ Cache efficace : by-id batch réutilisable

### 5. Scalabilité Illimitée

- ✅ Distribution uniforme (SHA-256)
- ✅ 16 batches fixes quelque soit taille projet
- ✅ Performance constante O(1)

## 🚀 Migration V3.0 → V3.1

### Breaking Changes

❌ **Format index incompatible** :

- by-path, by-alphabetical, by-directory, by-type : Nouveau format (refs ID)
- Ajout by-id (nouveau index)

✅ **Rétrocompatibilité** :

- Master index.json : Compatible (ajout champs, pas suppression)
- Scripts V3.0 peuvent coexister (fallback si V3.1 échoue)

### Migration Path

1. **Génération V3.1 complète** : `./generate-project-tree.sh --version 3.1`
2. **Test validation** : Vérifier tous les queries fonctionnent
3. **Backup V3.0** : Garder anciens index pour rollback
4. **Activation progressive** : Feature flag pour toggle V3.0/V3.1
5. **Suppression V3.0** : Une fois V3.1 stable

## 📋 Checklist Implémentation V3.1

### Scripts Nouveaux/Modifiés

- [ ] `lib/hash-utils.sh` - Fonctions hash ID (NOUVEAU)
- [ ] `generate-index-by-id.sh` - Index by-id source vérité (NOUVEAU)
- [ ] `generate-index-by-path.sh` - Modifier pour refs ID
- [ ] `generate-index-by-alpha.sh` - Modifier pour refs ID
- [ ] `generate-index-by-directory.sh` - Modifier pour refs ID
- [ ] `generate-index-by-type.sh` - Modifier pour refs ID
- [ ] `generate-index-master.sh` - Ajouter section by_id
- [ ] `update-incremental.sh` - Adapter logique by-id + refs

### Tests

- [ ] Tests unitaires hash-utils.sh
- [ ] Tests génération by-id (16 batches)
- [ ] Tests génération autres index (refs ID)
- [ ] Tests query by-path (O(1) direct)
- [ ] Tests query by-name (with by-id lookup)
- [ ] Tests incremental update (by-id + refs)
- [ ] Tests performance vs V3.0
- [ ] Tests collision hash (stress 100K+ fichiers)

### Documentation

- [ ] ARCHITECTURE-V3.1-HASH-ID.md (ce document)
- [ ] Mise à jour persona agent-aikido-projet-index
- [ ] Guide migration V3.0 → V3.1
- [ ] Benchmark performance V3.0 vs V3.1

---

**Version** : 3.1
**Date** : 2025-12-09
**Auteur** : agent-aikido-projet-index
**Statut** : Specification complète, implémentation pending
**Innovation** : Hash-based ID normalization pour déduplication et performance O(1)
