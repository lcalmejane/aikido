# Architecture V3.1 - Hash-Based ID Normalization

> **Version**: 3.1 | **Date**: 2025-12-09 | **Status**: Specification
>
> Major evolution from V3.0: Normalization via hash-based IDs for deduplication and O(1) performance.

> **Historical design:** Shell examples, performance estimates and checklists
> below are not the current runtime contract or measured results. For the
> implemented Node generation, Git exclusions, routing and safety limits, use
> [the structure skill](SKILL.md) and its referenced scripts.

## 🎯 Major Innovation V3.1: Hash-Based IDs

### V3.0 Problem (Duplication)

**Metadata duplicated across 4+ indexes**:

- `by-path/index-path-NNN.json`: Full metadata (300 bytes/file)
- `by-alphabetical/index-alpha-XXX.json`: Duplicated metadata (300 bytes/file)
- `by-directory/index-dir-NNN.json`: Duplicated metadata (200 bytes/file)
- `by-type/index-type-XXX.json`: Duplicated metadata (300 bytes/file)

**Cost for a 5000-file project**: 5000 × (300+300+200+300) = **5.5MB** ❌

### V3.1 Solution (Hash-Based Normalization)

**Principle**:

1. **ID = hash(path)** → Unique, predictive, deterministic identifier
2. **Index by-id** → Single source of truth (full metadata)
3. **Other indexes** → ID references only (15 bytes/file)

**Cost for a 5000-file project**:

- by-id: 5000 × 300B = 1.5MB (single source)
- by-path: 5000 × 15B = 75KB (refs)
- by-alpha: 5000 × 15B = 75KB (refs)
- by-dir: 5000 × 15B = 75KB (refs)
- by-type: 5000 × 15B = 75KB (refs)
- **Total**: **1.8MB** ✅ = **67% savings** ⚡⚡⚡

## 🔑 Hash Function

### Hash Function Spec

**Algorithm**: SHA-256 truncated to 12 hexadecimal characters

**Why SHA-256?**

- ✅ Natively available (openssl, shasum)
- ✅ Uniform distribution (good for batch partitioning)
- ✅ No practical collisions (2^48 space with 12 hex chars)
- ✅ Deterministic and reproducible

**Bash Implementation**:

The historical command-interpreter implementation is retired. Use the
[current Node structure contract](SKILL.md) for generation, lookup,
watching and rebuild commands. Historical latency figures are not measurements
of the Node implementation.

**ID Format**: `[a-f0-9]{12}` (12 hex chars)

**Examples**:

```
prompts/hard_points/commands/init-aikido.md           → 7f8a3c4b2e1d
prompts/gen/personas/agent-indexer.md → 9b3e5f1a8c2d
prompts/hard_points/ai-kido.md         → 4d6c1a9f3e7b
```

### Key Properties

1. **Predictive**: Calculate ID without loading any index

   The historical command-interpreter implementation is retired. Use the
[current Node structure contract](SKILL.md) for generation, lookup,
watching and rebuild commands. Historical latency figures are not measurements
of the Node implementation.

2. **Deterministic**: Same path = same ID always

   The historical command-interpreter implementation is retired. Use the
[current Node structure contract](SKILL.md) for generation, lookup,
watching and rebuild commands. Historical latency figures are not measurements
of the Node implementation.

3. **Uniform distribution**: Good for batch partitioning

   The historical command-interpreter implementation is retired. Use the
[current Node structure contract](SKILL.md) for generation, lookup,
watching and rebuild commands. Historical latency figures are not measurements
of the Node implementation.

4. **No collision**: 2^48 space (281 trillion unique IDs)
   - 10K-file project: collision probability < 0.000001%

## 📐 V3.1 File Architecture

### Directory Structure

```
prompts/hard_points/system/structure/
├── index.json                              # Master index (hash tables + routing)
├── indices/
│   ├── by-id/                             # ⭐ SINGLE SOURCE OF TRUTH
│   │   ├── index-id-0.json                # IDs starting with 0
│   │   ├── index-id-1.json                # IDs starting with 1
│   │   ├── ...
│   │   └── index-id-f.json                # IDs starting with f (16 batches total)
│   ├── by-path/                           # Path → ID mapping (refs only)
│   │   ├── index-path-000.json            # Paths [0-999]
│   │   └── index-path-NNN.json
│   ├── by-alphabetical/                   # Name → ID(s) mapping (refs only)
│   │   ├── index-alpha-a-d.json
│   │   └── index-alpha-n-z.json
│   ├── by-directory/                      # Directory → ID(s) mapping (refs only)
│   │   └── index-dir-NNN.json
│   └── by-type/                           # Type → ID(s) mapping (refs only)
│       └── index-type-TYPE.json
└── scripts/
    ├── generate-project-tree.sh           # V3.1 orchestrator
    ├── generate-index-master.sh           # Master index
    ├── generate-index-by-id.sh            # ⭐ NEW: by-id index (source of truth)
    ├── generate-index-by-path.sh          # Path → ID refs index
    ├── generate-index-by-alpha.sh         # Name → ID refs index
    ├── generate-index-by-directory.sh     # Directory → ID refs index
    ├── generate-index-by-type.sh          # Type → ID refs index
    └── lib/hash-utils.sh                  # ⭐ NEW: Hash ID utility functions
```

### by-id Partitioning (16 batches)

**Strategy**: First hex character of ID → Batch (0-f = 16 batches)

**Uniform distribution**:

- SHA-256 guarantees uniform distribution
- ~312 files/batch for 5000 files (5000/16)
- ~625 files/batch for 10000 files

**Example**:

```
ID: 7f8a3c4b2e1d → batch: index-id-7.json
ID: 9b3e5f1a8c2d → batch: index-id-9.json
ID: 4d6c1a9f3e7b → batch: index-id-4.json
```

**Advantages**:

- ✅ Automatically balanced batches (uniform hash)
- ✅ Only 16 batches (vs 1000+ for by-path)
- ✅ O(1) lookup: hash → first char extraction → batch determined

## 🔧 V3.1 JSON Formats

### 1. Master Index (index.json)

**Changes vs V3.0**:

- Added `by_id` section in hash_tables
- by-id batching: 16 fixed batches (0-f)

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
    "description": "Hash-based ID routing in O(1) - Calculate ID then direct lookup",
    "examples": {
      "find_by_path": "prompts/gen/personas/agent.md → hash(path) → ID 9b3e5f1a → by-id/index-id-9.json",
      "find_by_name": "agent.md → by-alphabetical → ID 9b3e5f1a → by-id/index-id-9.json",
      "direct_by_id": "ID 9b3e5f1a → extract first char '9' → by-id/index-id-9.json"
    }
  }
}
```

### 2. Index by-id (SINGLE SOURCE OF TRUTH)

**Role**: Contains ALL full metadata, indexed by hash ID

**Size**: ~300KB per batch (342 files × ~900 bytes JSON per file)

**Format**:

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

**Splitting strategy**:

- Partitioning by first hex character of ID (0-f)
- 16 fixed batches, uniform distribution guaranteed by SHA-256

### 3. Index by-path (ID REFERENCES ONLY)

**Role**: Path → hash ID mapping (ultra lightweight)

**Size**: ~15 bytes per file (vs 300 bytes before) = **95% savings** ⚡⚡⚡

**Format**:

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

**Advantages**:

- ✅ **95% size reduction** vs V3.0
- ✅ Ultra-simple format: `path: id` (string: string)
- ✅ Instant parsing

### 4. Index by-alphabetical (ID REFERENCES ONLY)

**Role**: Name → hash ID(s) mapping (handles homonyms)

**Size**: ~15-30 bytes per file (depending on homonyms)

**Format**:

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

**Notes**:

- Array of IDs to handle homonyms (e.g., index.md present in 3 directories)
- If only 1 ID: can be optimized to string (vs array)

### 5. Index by-directory (ID REFERENCES ONLY)

**Role**: Directory → hash ID(s) mapping

**Size**: ~15-200 bytes per directory (depending on number of files)

**Format**:

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

### 6. Index by-type (ID REFERENCES ONLY)

**Role**: Type → hash ID(s) mapping

**Size**: ~15-200 bytes per type

**Format**:

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

## 🔄 V3.1 Workflows

### Workflow 1: Query by Path (O(1) Direct)

**Query**: "Find prompts/hard_points/commands/init-aikido.md"

**V3.1 Process (optimized)**:

The historical command-interpreter implementation is retired. Use the
[current Node structure contract](SKILL.md) for generation, lookup,
watching and rebuild commands. Historical latency figures are not measurements
of the Node implementation.

**Advantages vs V3.0**:

- ✅ **No master index needed** to determine batch (local calculation)
- ✅ **O(1) direct**: hash → batch determined instantly
- ✅ **No need for by-path** if path is known (direct by-id lookup)

**Comparison**:

| Step | V3.0 | V3.1 | Gain |
|------|------|------|------|
| Load master | ~5ms | **0ms** (optional) | ✅ |
| Lookup hash table | ~5ms | **0ms** (local calculation) | ✅ |
| Load batch by-path | ~50ms | - | - |
| Calculate ID | - | **<1ms** (hash) | - |
| Load batch by-id | - | ~50ms | - |
| **Total** | ~60ms | **~50ms** | **17% faster** ⚡ |

### Workflow 2: Query by Name (with by-alphabetical)

**Query**: "Find agent-aikido-maj-md-index.md"

**V3.1 Process**:

The historical command-interpreter implementation is retired. Use the
[current Node structure contract](SKILL.md) for generation, lookup,
watching and rebuild commands. Historical latency figures are not measurements
of the Node implementation.

**Advantages vs V3.0**:

- ✅ **Deduplicated metadata**: single source (by-id)
- ✅ **Reusable cache**: by-id batch can serve multiple queries

### Workflow 3: Incremental Update (OPTIMIZED)

**Trigger**: File modified "prompts/gen/personas/agent-new.md"

**V3.1 Process**:

The historical command-interpreter implementation is retired. Use the
[current Node structure contract](SKILL.md) for generation, lookup,
watching and rebuild commands. Historical latency figures are not measurements
of the Node implementation.

**Advantages vs V3.0**:

- ✅ **Metadata written only once** (by-id only)
- ✅ **Ultra-light refs**: 4 × 15 bytes = 60 bytes total (vs 1200 bytes V3.0)
- ✅ **Guaranteed consistency**: single source of truth

## 📊 V3.0 vs V3.1 Comparison

### File Size (5000-file project)

| Index | V3.0 | V3.1 | Gain |
|-------|------|------|------|
| **by-path** | 1.5MB | 75KB | **95%** ⚡⚡⚡ |
| **by-alphabetical** | 1.5MB | 75KB | **95%** ⚡⚡⚡ |
| **by-directory** | 1MB | 75KB | **93%** ⚡⚡⚡ |
| **by-type** | 1.5MB | 75KB | **95%** ⚡⚡⚡ |
| **by-id** (new) | - | 1.5MB | Single source |
| **TOTAL** | **5.5MB** | **1.8MB** | **67%** ⚡⚡⚡ |

### Query Performance

| Query Type | V3.0 | V3.1 | Note |
|------------|------|------|------|
| **By Path** | ~60ms | ~50ms | V3.1: local ID calculation, no master needed |
| **By Name** | ~60ms | ~60ms | Identical (requires alphabetical lookup) |
| **By Directory** | ~60ms | ~60ms | Identical |
| **By Type** | ~60ms | ~60ms | Identical |
| **By ID Direct** | N/A | ~50ms | ✅ NEW: O(1) lookup if ID known |

### Incremental Update

| Operation | V3.0 | V3.1 | Gain |
|-----------|------|------|------|
| **Update metadata** | 4 batches × 300B = 1.2KB | 1 batch × 300B = 300B | **75%** ⚡⚡ |
| **Update refs** | - | 4 refs × 15B = 60B | Ultra lightweight |
| **Total write** | 1.2KB | 360B | **70%** ⚡⚡ |
| **Time** | ~1-2s | ~0.8-1.5s | **20-25% faster** ⚡ |

### Data Consistency

| Aspect | V3.0 | V3.1 | Advantage |
|--------|------|------|-----------|
| **Sources of truth** | 4 (duplication) | **1** (by-id) | V3.1 ⚡⚡⚡ |
| **Inconsistency risk** | High | **Minimal** | V3.1 ⚡⚡⚡ |
| **Update complexity** | High (4 sources) | **Low** (1 source + refs) | V3.1 ⚡⚡⚡ |

## ⚙️ Implementation

### Script lib/hash-utils.sh (historical, removed)

The Node generator no longer sources this removed shell library. New code uses `node:crypto` in
`scripts/generate-index-by-id.mjs`. The examples below describe the historical
shell architecture, not the current execution path.

The historical command-interpreter implementation is retired. Use the
[current Node structure contract](SKILL.md) for generation, lookup,
watching and rebuild commands. Historical latency figures are not measurements
of the Node implementation.

### Generation Script Modifications

**generate-index-by-id.sh (NEW)**:

The historical command-interpreter implementation is retired. Use the
[current Node structure contract](SKILL.md) for generation, lookup,
watching and rebuild commands. Historical latency figures are not measurements
of the Node implementation.

**Other script modifications**:

- `generate-index-by-path.sh`: Store `path: id` instead of full metadata
- `generate-index-by-alpha.sh`: Store `name: [ids]` instead of full metadata
- `generate-index-by-directory.sh`: Store `dir: {ids: [...]}` instead of full metadata
- `generate-index-by-type.sh`: Store `type: [ids]` instead of full metadata

## 🎯 Key Advantages of V3.1

### 1. Deduplication (67% space savings)

- ✅ Metadata stored ONCE (by-id)
- ✅ Other indexes: ultra-lightweight ID references (15 bytes)

### 2. O(1) Predictability

- ✅ Local hash ID calculation (no index loading needed)
- ✅ Batch determined instantly (1st hex char)
- ✅ Direct lookup without mapping table

### 3. Guaranteed Consistency

- ✅ Single source of truth (by-id)
- ✅ Centralized updates
- ✅ No desynchronization risk

### 4. Optimal Performance

- ✅ Query by-path: ~50ms (17% faster than V3.0)
- ✅ Incremental update: ~0.8-1.5s (20-25% faster)
- ✅ Efficient cache: by-id batch reusable

### 5. Unlimited Scalability

- ✅ Uniform distribution (SHA-256)
- ✅ 16 fixed batches regardless of project size
- ✅ Constant O(1) performance

## 🚀 Migration V3.0 → V3.1

### Breaking Changes

❌ **Incompatible index format**:

- by-path, by-alphabetical, by-directory, by-type: New format (ID refs)
- Addition of by-id (new index)

✅ **Backward compatibility**:

- Master index.json: Compatible (fields added, none removed)
- V3.0 scripts can coexist (fallback if V3.1 fails)

### Migration Path

1. **Full V3.1 generation**: `./generate-project-tree.sh --version 3.1`
2. **Validation test**: Verify all queries work
3. **V3.0 backup**: Keep old indexes for rollback
4. **Progressive activation**: Feature flag to toggle V3.0/V3.1
5. **V3.0 removal**: Once V3.1 is stable

## 📋 V3.1 Implementation Checklist

### New/Modified Scripts

- [ ] `lib/hash-utils.sh` - Hash ID utility functions (NEW)
- [ ] `generate-index-by-id.sh` - by-id index source of truth (NEW)
- [ ] `generate-index-by-path.sh` - Modify for ID refs
- [ ] `generate-index-by-alpha.sh` - Modify for ID refs
- [ ] `generate-index-by-directory.sh` - Modify for ID refs
- [ ] `generate-index-by-type.sh` - Modify for ID refs
- [ ] `generate-index-master.sh` - Add by_id section
- [ ] `update-incremental.sh` - Adapt by-id + refs logic

### Tests

- [ ] Unit tests hash-utils.sh
- [ ] Generation tests by-id (16 batches)
- [ ] Generation tests other indexes (ID refs)
- [ ] Query tests by-path (O(1) direct)
- [ ] Query tests by-name (with by-id lookup)
- [ ] Incremental update tests (by-id + refs)
- [ ] Performance tests vs V3.0
- [ ] Hash collision tests (stress 100K+ files)

### Documentation

- [ ] ARCHITECTURE-V3.1-HASH-ID.md (this document)
- [ ] Update persona agent-aikido-projet-index
- [ ] Migration guide V3.0 → V3.1
- [ ] Performance benchmark V3.0 vs V3.1

---

**Version**: 3.1
**Date**: 2025-12-09
**Author**: agent-aikido-projet-index
**Status**: Complete specification, implementation pending
**Innovation**: Hash-based ID normalization for deduplication and O(1) performance
