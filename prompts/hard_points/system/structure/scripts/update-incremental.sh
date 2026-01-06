#!/bin/bash

# update-incremental.sh - Mise à jour incrémentale V3.1 hash-based IDs
# Version 3.1
#
# Usage: ./update-incremental.sh <file_path> [<file_path2> ...]
# Mise à jour ciblée des index affectés par les changements de fichiers

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INDICES_DIR="prompts/hard_points/system/structure/indices"
TIMESTAMP_ISO=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

# Source utilities
source "$SCRIPT_DIR/lib/hash-utils.sh"
source "$SCRIPT_DIR/format-file-metadata.sh"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

# Vérifier présence fichiers index
check_indices_exist() {
    if [[ ! -d "$PROJECT_ROOT/$INDICES_DIR/by-id" ]]; then
        log "ERROR: by-id index directory not found. Run generate-all-indexes-v3.1.sh first."
        exit 1
    fi
}

# Extraire métadonnées d'un fichier
extract_file_metadata() {
    local file_path="$1"

    if [[ ! -f "$file_path" ]]; then
        log "ERROR: File not found: $file_path"
        return 1
    fi

    # Utiliser format-file-metadata.sh pour cohérence
    format_metadata "$file_path"
}

# Mettre à jour entry dans by-id batch
update_by_id_entry() {
    local file_path="$1"
    local id="$2"
    local metadata_json="$3"

    # Déterminer batch file
    local batch_file="$PROJECT_ROOT/$INDICES_DIR/$(get_by_id_batch_file "$id")"

    log "Updating by-id entry: $id in $(basename "$batch_file")"

    if [[ ! -f "$batch_file" ]]; then
        log "ERROR: Batch file not found: $batch_file"
        return 1
    fi

    # Backup batch file
    cp "$batch_file" "${batch_file}.bak"

    # Update ou insert entry
    if jq -e ".files[\"$id\"]" "$batch_file" >/dev/null 2>&1; then
        # Entry existe, update
        jq ".files[\"$id\"] = $metadata_json" "$batch_file" > "${batch_file}.tmp"
        mv "${batch_file}.tmp" "$batch_file"
        log "✅ Updated entry for ID $id"
    else
        # Entry n'existe pas, insert
        jq ".files[\"$id\"] = $metadata_json | .metadata.count += 1" "$batch_file" > "${batch_file}.tmp"
        mv "${batch_file}.tmp" "$batch_file"
        log "✅ Inserted entry for ID $id"
    fi

    # Update timestamp
    jq ".metadata.generated = \"$TIMESTAMP_ISO\"" "$batch_file" > "${batch_file}.tmp"
    mv "${batch_file}.tmp" "$batch_file"

    rm -f "${batch_file}.bak"
}

# Mettre à jour référence dans by-path
update_by_path_ref() {
    local file_path="$1"
    local id="$2"

    log "Updating by-path reference for $file_path → $id"

    # Trouver batch correspondant (simple linear search pour l'instant)
    # TODO: Optimiser avec hash table lookup du master index
    for batch_file in "$PROJECT_ROOT/$INDICES_DIR/by-path"/index-path-*.json; do
        if jq -e ".paths[\"$file_path\"]" "$batch_file" >/dev/null 2>&1; then
            # Trouvé, update
            jq ".paths[\"$file_path\"] = \"$id\"" "$batch_file" > "${batch_file}.tmp"
            mv "${batch_file}.tmp" "$batch_file"
            log "✅ Updated by-path ref in $(basename "$batch_file")"
            return 0
        fi
    done

    # Pas trouvé, déterminer batch d'insertion (TODO: implémenter logique insertion)
    log "⚠️  Path not found in by-path, might need full regeneration"
}

# Mettre à jour référence dans by-alphabetical
update_by_alpha_ref() {
    local filename="$1"
    local id="$2"

    log "Updating by-alphabetical reference for $filename → $id"

    # Trouver batch alphabétique correspondant
    for batch_file in "$PROJECT_ROOT/$INDICES_DIR/by-alphabetical"/index-alpha-*.json; do
        if jq -e ".files[\"$filename\"]" "$batch_file" >/dev/null 2>&1; then
            # Trouvé, vérifier si ID déjà présent
            if jq -e ".files[\"$filename\"] | arrays | index(\"$id\")" "$batch_file" >/dev/null 2>&1; then
                log "✅ ID already in by-alphabetical for $filename"
                return 0
            else
                # Ajouter ID au array
                jq ".files[\"$filename\"] += [\"$id\"]" "$batch_file" > "${batch_file}.tmp"
                mv "${batch_file}.tmp" "$batch_file"
                log "✅ Added ID to by-alphabetical for $filename"
                return 0
            fi
        fi
    done

    log "⚠️  Filename not found in by-alphabetical, might need full regeneration"
}

# Mettre à jour référence dans by-directory
update_by_dir_ref() {
    local dir_path="$1"
    local id="$2"

    log "Updating by-directory reference for $dir_path → $id"

    # Trouver batch directory correspondant
    for batch_file in "$PROJECT_ROOT/$INDICES_DIR/by-directory"/index-dir-*.json; do
        if jq -e ".directories[\"$dir_path\"]" "$batch_file" >/dev/null 2>&1; then
            # Trouvé, vérifier si ID déjà présent
            if jq -e ".directories[\"$dir_path\"].ids | index(\"$id\")" "$batch_file" >/dev/null 2>&1; then
                log "✅ ID already in by-directory for $dir_path"
                return 0
            else
                # Ajouter ID au array
                jq ".directories[\"$dir_path\"].ids += [\"$id\"] | .directories[\"$dir_path\"].files_count += 1" "$batch_file" > "${batch_file}.tmp"
                mv "${batch_file}.tmp" "$batch_file"
                log "✅ Added ID to by-directory for $dir_path"
                return 0
            fi
        fi
    done

    log "⚠️  Directory not found in by-directory, might need full regeneration"
}

# Mettre à jour référence dans by-type
update_by_type_ref() {
    local file_type="$1"
    local id="$2"

    log "Updating by-type reference for type=$file_type → $id"

    # Trouver batch type correspondant
    local batch_file="$PROJECT_ROOT/$INDICES_DIR/by-type/index-type-${file_type}.json"

    if [[ -f "$batch_file" ]]; then
        # Vérifier si ID déjà présent
        if jq -e ".ids | index(\"$id\")" "$batch_file" >/dev/null 2>&1; then
            log "✅ ID already in by-type for $file_type"
            return 0
        else
            # Ajouter ID au array
            jq ".ids += [\"$id\"] | .metadata.count += 1" "$batch_file" > "${batch_file}.tmp"
            mv "${batch_file}.tmp" "$batch_file"
            log "✅ Added ID to by-type for $file_type"
            return 0
        fi
    else
        log "⚠️  Type batch not found: $batch_file, might need full regeneration"
    fi
}

# Supprimer entry complètement (pour fichiers supprimés)
remove_file_entry() {
    local file_path="$1"
    local id="$2"

    log "Removing entry for deleted file: $file_path (ID: $id)"

    # Remove from by-id
    local batch_file="$PROJECT_ROOT/$INDICES_DIR/$(get_by_id_batch_file "$id")"
    if [[ -f "$batch_file" ]]; then
        jq "del(.files[\"$id\"]) | .metadata.count -= 1" "$batch_file" > "${batch_file}.tmp"
        mv "${batch_file}.tmp" "$batch_file"
        log "✅ Removed from by-id"
    fi

    # Remove from by-path
    for batch_file in "$PROJECT_ROOT/$INDICES_DIR/by-path"/index-path-*.json; do
        if jq -e ".paths[\"$file_path\"]" "$batch_file" >/dev/null 2>&1; then
            jq "del(.paths[\"$file_path\"])" "$batch_file" > "${batch_file}.tmp"
            mv "${batch_file}.tmp" "$batch_file"
            log "✅ Removed from by-path"
            break
        fi
    done

    # Remove from by-alphabetical, by-directory, by-type (TODO: implement)
    log "⚠️  Removal from other indexes not fully implemented, recommend full regeneration"
}

# Régénérer master index
regenerate_master_index() {
    log "Regenerating master index..."

    if [[ -x "$SCRIPT_DIR/generate-index-master.sh" ]]; then
        "$SCRIPT_DIR/generate-index-master.sh"
        log "✅ Master index regenerated"
    else
        log "ERROR: generate-index-master.sh not found or not executable"
        return 1
    fi
}

# Process un fichier
process_file() {
    local file_path="$1"

    # Calculer path relatif
    local relative_path="${file_path#"$PROJECT_ROOT"/}"
    relative_path="${relative_path#./}"

    # Générer ID hash
    local id=$(generate_file_id "$relative_path")

    log "Processing: $relative_path (ID: $id)"

    # Vérifier si fichier existe
    if [[ -f "$PROJECT_ROOT/$relative_path" ]]; then
        # Fichier existe, update ou insert

        # Extraire métadonnées
        local metadata_json=$(extract_file_metadata "$PROJECT_ROOT/$relative_path")

        # Update by-id (source de vérité)
        update_by_id_entry "$relative_path" "$id" "$metadata_json"

        # Update refs dans autres index
        update_by_path_ref "$relative_path" "$id"

        local filename=$(basename "$relative_path")
        update_by_alpha_ref "$filename" "$id"

        local dir_path=$(dirname "$relative_path")
        update_by_dir_ref "$dir_path" "$id"

        local file_type=$(echo "$metadata_json" | jq -r '.type')
        update_by_type_ref "$file_type" "$id"

    else
        # Fichier n'existe plus, remove
        remove_file_entry "$relative_path" "$id"
    fi
}

# Main
main() {
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 <file_path> [<file_path2> ...]"
        echo ""
        echo "Update index for specific files incrementally (V3.1 hash-based architecture)"
        echo ""
        echo "Examples:"
        echo "  $0 prompts/gen/personas/agent-new.md"
        echo "  $0 prompts/hard_points/commands/command1.md prompts/hard_points/commands/command2.md"
        exit 1
    fi

    log "=== Incremental Update V3.1 ==="
    log "Files to process: $#"

    cd "$PROJECT_ROOT"

    # Vérifier index existent
    check_indices_exist

    # Process chaque fichier
    for file_path in "$@"; do
        process_file "$file_path"
    done

    # Régénérer master index (stats globales)
    regenerate_master_index

    log "=== Incremental Update Complete ==="
}

main "$@"
