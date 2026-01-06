#!/bin/bash

# hash-utils.sh - Fonctions utilitaires pour hash-based IDs
# Version 3.1 - Architecture hash-based ID normalization

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
# Output: batch file path relatif (string)
get_by_id_batch_file() {
    local id="$1"

    # Extraire premier caractère hex (0-f)
    local batch_prefix="${id:0:1}"

    # Construire path batch file
    echo "indices/by-id/index-id-${batch_prefix}.json"
}

# Détermination du batch prefix à partir de l'ID
# Input: id (string 12 chars hex)
# Output: batch prefix (string 1 char hex)
get_batch_prefix() {
    local id="$1"
    echo "${id:0:1}"
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

# Liste batch files pour tous les préfixes (0-f)
# Output: Liste des 16 batch files (array)
list_all_by_id_batches() {
    for prefix in {0..9} {a..f}; do
        echo "indices/by-id/index-id-${prefix}.json"
    done
}

# Liste tous les préfixes batch possibles (0-f)
# Output: Liste des 16 préfixes (array)
list_all_prefixes() {
    echo {0..9} {a..f}
}

# Calcul nombre de fichiers attendus par batch (estimation)
# Input: total_files (integer), num_batches (integer, défaut 16)
# Output: expected_files_per_batch (integer)
estimate_files_per_batch() {
    local total_files="$1"
    local num_batches="${2:-16}"

    echo $(( (total_files + num_batches - 1) / num_batches ))
}

# JSON escape pour path (utilisé dans génération JSON)
json_escape() {
    local str="$1"
    str="${str//\\/\\\\}"
    str="${str//\"/\\\"}"
    str="${str//$'\n'/\\n}"
    str="${str//$'\r'/\\r}"
    str="${str//$'\t'/\\t}"
    echo "$str"
}

# Test unitaire si script exécuté directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "=== Testing hash-utils.sh ==="
    echo ""

    # Test 1: Generate ID
    echo "Test 1: Generate file ID"
    test_path="prompts/hard_points/commands/init-aikido.md"
    test_id=$(generate_file_id "$test_path")
    echo "  Path: $test_path"
    echo "  ID: $test_id"
    echo "  Length: ${#test_id}"
    echo ""

    # Test 2: Get batch file
    echo "Test 2: Get batch file"
    batch_file=$(get_by_id_batch_file "$test_id")
    echo "  ID: $test_id"
    echo "  Batch file: $batch_file"
    echo "  Batch prefix: $(get_batch_prefix "$test_id")"
    echo ""

    # Test 3: Validate ID
    echo "Test 3: Validate ID format"
    if validate_id_format "$test_id"; then
        echo "  ✅ ID format valid: $test_id"
    else
        echo "  ❌ ID format invalid: $test_id"
    fi
    echo ""

    # Test 4: Invalid ID
    echo "Test 4: Invalid ID"
    invalid_id="invalid123"
    if validate_id_format "$invalid_id"; then
        echo "  ❌ Should have failed: $invalid_id"
    else
        echo "  ✅ Correctly rejected: $invalid_id"
    fi
    echo ""

    # Test 5: Deterministic (même input = même output)
    echo "Test 5: Deterministic hash"
    id1=$(generate_file_id "$test_path")
    id2=$(generate_file_id "$test_path")
    if [[ "$id1" == "$id2" ]]; then
        echo "  ✅ Deterministic: $id1 == $id2"
    else
        echo "  ❌ NOT deterministic: $id1 != $id2"
    fi
    echo ""

    # Test 6: List all batches
    echo "Test 6: List all batch files"
    echo "  Total batches: $(list_all_by_id_batches | wc -l)"
    echo "  Prefixes: $(list_all_prefixes)"
    echo ""

    # Test 7: Distribution test (10 paths)
    echo "Test 7: Hash distribution (10 sample paths)"
    sample_paths=(
        "prompts/hard_points/commands/init-aikido.md"
        "prompts/index.md"
        "prompts/gen/personas/agent-indexer.md"
        "prompts/hard_points/ai-kido.md"
        "CLAUDE.md"
        "AGENTS.md"
        "README.md"
        ".gitignore"
        "package.json"
        "src/index.js"
    )

    declare -A prefix_count
    for path in "${sample_paths[@]}"; do
        id=$(generate_file_id "$path")
        prefix=$(get_batch_prefix "$id")
        prefix_count["$prefix"]=$((${prefix_count[$prefix]:-0} + 1))
        echo "  $path → $id (batch: $prefix)"
    done
    echo ""

    echo "  Distribution:"
    for prefix in $(list_all_prefixes); do
        count=${prefix_count[$prefix]:-0}
        if [[ $count -gt 0 ]]; then
            echo "    Batch $prefix: $count files"
        fi
    done
    echo ""

    # Test 8: Estimate files per batch
    echo "Test 8: Estimate files per batch"
    for total in 1000 5000 10000 50000; do
        avg=$(estimate_files_per_batch "$total")
        echo "  $total files → ~$avg files/batch"
    done
    echo ""

    echo "=== All tests completed ==="
fi
