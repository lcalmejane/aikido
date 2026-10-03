#!/bin/bash

# watch-changes.sh - File change monitoring for the AI-KIDO system
# Usage: ./watch-changes.sh [--daemon] [--notify=agent] [--exclude=pattern]
#
# Features:
# - Real-time monitoring of file changes
# - Notifications to relevant agents (projet-index, indexer, etc.)
# - Filtrage intelligent (ignore .gitignore, node_modules, etc.)
# - Mode daemon avec logging
# - Batch detection to avoid notification spam

if [ -n "$BASH_VERSION" ]; then
  set -euo pipefail   # Bash‑only, portable sur Rocky, Ubuntu, etc.
else
  set -eu              # Fallback for POSIX‑sh
fi

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../../../../.." && pwd)}"
WATCH_LOG="${PROJECT_ROOT}/prompts/spec/system/structure/cache/watch.log"
PID_FILE="${PROJECT_ROOT}/prompts/spec/system/structure/cache/watch.pid"
PENDING_CHANGES_FILE="${PROJECT_ROOT}/prompts/spec/system/structure/cache/pending-changes.tmp"
BATCH_TIMEOUT="${BATCH_TIMEOUT:-5}"  # secondes avant notification batch
DAEMON_MODE=false
NOTIFY_AGENTS=true
VERBOSE=false

# Patterns d'exclusion (synchrone avec generate-project-tree.sh)
EXCLUDE_PATTERNS=(
    "node_modules"
    ".git"
    ".DS_Store"
    "*.tmp" 
    "*.log"
    "temp"
    "dist"
    "build"
    ".cache"
    "coverage"
    ".nyc_output"
    "*.swp"
    "*.swo"
    "*~"
)

# Variables pour gestion batch
LAST_CHANGE_TIME=0

# Logging
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [[ "$DAEMON_MODE" == "true" ]]; then
        echo "[$timestamp] [$level] $message" >> "$WATCH_LOG"
    fi
    
    if [[ "$VERBOSE" == "true" ]] || [[ "$level" != "DEBUG" ]]; then
        echo "[$level] $message" >&2
    fi
}

# Check whether the file must be ignored
should_ignore() {
    local file_path="$1"
    local filename=$(basename "$file_path")
    local dirname=$(dirname "$file_path")
    
    # Check exclusion patterns
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        case "$filename" in
            $pattern) return 0 ;;
        esac
        case "$dirname" in
            */$pattern|$pattern) return 0 ;;
        esac
    done
    
    # Check .gitignore if present
    if [[ -f "$PROJECT_ROOT/.gitignore" ]]; then
        local relative_path=${file_path#$PROJECT_ROOT/}
        
        while IFS= read -r line; do
            [[ "$line" =~ ^#.*$ ]] && continue
            [[ -z "$line" ]] && continue
            
            # Simple pattern matching (can be improved)
            case "$relative_path" in
                ${line%/}|${line%/}/*) return 0 ;;
            esac
        done < "$PROJECT_ROOT/.gitignore"
    fi
    
    return 1
}

# Get file type for targeted notifications
get_file_category() {
    local file_path="$1"
    local relative_path=${file_path#$PROJECT_ROOT/}

    case "$relative_path" in
        prompts/gen/concepts/*) echo "memory_bank_concepts" ;;
        prompts/gen/techniques/*) echo "memory_bank_techniques" ;;
        prompts/gen/use_cases/*) echo "memory_bank_use_cases" ;;
        prompts/gen/personas/*) echo "memory_bank_personas" ;;
        prompts/hard_points/*) echo "hard_points" ;;
        prompts/index.md) echo "main_index" ;;
        AGENTS.md) echo "agents_config" ;;
        .roo/*) echo "roo_config" ;;
        .claude/*) echo "claude_config" ;;
        *.md) echo "documentation" ;;
        *.json) echo "configuration" ;;
        *.sh) echo "scripts" ;;
        *) echo "other" ;;
    esac
}

# Regenerate the JSON index in the background
regenerate_index() {
    local trigger_reason="$1"

    log "INFO" "Triggering index regeneration: $trigger_reason"

    # Path to the V3.1 generation script (hash-based IDs)
    local script_path="${PROJECT_ROOT}/prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh"

    if [[ ! -x "$script_path" ]]; then
        log "ERROR" "Generation script not found or not executable: $script_path"
        return 1
    fi

    # Start regeneration in the background
    (
        cd "$PROJECT_ROOT"
        "$script_path" 2>&1 | while IFS= read -r line; do
            log "DEBUG" "[regenerate] $line"
        done

        if [[ $? -eq 0 ]]; then
            log "INFO" "Index regeneration completed successfully"
        else
            log "ERROR" "Index regeneration failed"
        fi
    ) &

    local regen_pid=$!
    log "INFO" "Index regeneration started in background (PID: $regen_pid)"
}

# Notify the appropriate agent
notify_agent() {
    local change_type="$1"
    local file_path="$2" 
    local category="$3"
    
    log "DEBUG" "Notifying agents for $change_type: $file_path ($category)"
    
    # Notifications by category
    case "$category" in
        "memory_bank_"*|"main_index"|"agents_config")
            # Notification pour agent-aikido-maj-md-index
            log "INFO" "Memory Bank change detected - triggering index regeneration"

            # Invalidation cache structure
            if command -v "${PROJECT_ROOT}/prompts/hard_points/system/structure/scripts/cache-manager.sh" >/dev/null 2>&1; then
                "${PROJECT_ROOT}/prompts/hard_points/system/structure/scripts/cache-manager.sh" invalidate "$(echo "structure_${category}_$(date +%Y%m%d)" | shasum -a 256 | cut -c1-16)" 2>/dev/null || true
            fi
            ;;
        "hard_points")
            # Notification pour agent-aikido-truth-evaluator + projet-index
            log "INFO" "Hard points change detected - triggering immediate index regeneration"
            # Immediate regeneration for hard points (critical changes)
            regenerate_index "Critical: Hard points modification"
            ;;
        "scripts")
            # Notification for agent-aikido-projet-index (modified scripts)
            log "INFO" "Scripts change detected - projet-index should refresh capabilities"
            ;;
        "configuration")
            # Notification pour agent-aikido-projet-index (structure projet)
            log "INFO" "Configuration change detected - projet-index should rescan"
            ;;
    esac
}

# Traitement des changements en batch
process_batch_changes() {
    local current_time=$(date +%s)

    # Check whether enough time has elapsed
    if [[ $((current_time - LAST_CHANGE_TIME)) -lt $BATCH_TIMEOUT ]]; then
        return
    fi

    # Process all pending changes
    if [[ -f "$PENDING_CHANGES_FILE" ]]; then
        local change_count=$(wc -l < "$PENDING_CHANGES_FILE" | tr -d ' ')

        if [[ "$change_count" -gt 0 ]]; then
            log "INFO" "Processing batch of $change_count changes"

            local memory_bank_changes=0
            local script_changes=0
            local config_changes=0

            while IFS='|' read -r change_type file_path category; do
                case "$category" in
                    memory_bank_*|main_index|agents_config) ((memory_bank_changes++)) ;;
                    scripts) ((script_changes++)) ;;
                    configuration*) ((config_changes++)) ;;
                esac
            done < "$PENDING_CHANGES_FILE"

            # Grouped notifications and regeneration if needed
            if [[ $memory_bank_changes -gt 0 ]]; then
                log "INFO" "Batch notification: $memory_bank_changes Memory Bank changes detected"
                regenerate_index "Memory Bank changes ($memory_bank_changes files)"
            fi

            if [[ $script_changes -gt 0 ]]; then
                log "INFO" "Batch notification: $script_changes script changes - projet-index should refresh"
                regenerate_index "Scripts changes ($script_changes files)"
            fi

            if [[ $config_changes -gt 0 ]]; then
                log "INFO" "Batch notification: $config_changes config changes - projet-index should rescan"
                regenerate_index "Configuration changes ($config_changes files)"
            fi

            # Vider les changements en attente
            > "$PENDING_CHANGES_FILE"
        fi
    fi
}

# File event handler
handle_file_event() {
    local event="$1"
    local file_path="$2"

    # Skip if file is in exclusions
    if should_ignore "$file_path"; then
        log "DEBUG" "Ignoring $event for excluded file: $file_path"
        return
    fi

    # Get file category
    local category=$(get_file_category "$file_path")

    log "DEBUG" "File $event: $file_path (category: $category)"

    # Add to the changes batch (temp file)
    echo "${event}|${file_path}|${category}" >> "$PENDING_CHANGES_FILE"
    LAST_CHANGE_TIME=$(date +%s)

    # Immediate notification for critical changes
    case "$category" in
        "hard_points")
            if [[ "$event" == "MODIFY" ]] || [[ "$event" == "CREATE" ]]; then
                notify_agent "$event" "$file_path" "$category"
            fi
            ;;
    esac
}

# Surveillance avec fswatch (macOS) ou inotifywait (Linux)
start_watching_fswatch() {
    log "INFO" "Starting file watching with fswatch..."
    
    # Construire patterns d'exclusion pour fswatch
    local exclude_args=()
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        exclude_args+=("--exclude" "$pattern")
    done
    
    fswatch "${exclude_args[@]}" \
        --recursive \
        --event Created \
        --event Updated \
        --event Removed \
        --event MovedFrom \
        --event MovedTo \
        "$PROJECT_ROOT" | while read file_path event_flags; do
        
        # Determine event type from flags
        local event_type="MODIFY"
        case "$event_flags" in
            *Created*) event_type="CREATE" ;;
            *Removed*) event_type="DELETE" ;;
            *MovedFrom*) event_type="MOVE_FROM" ;;
            *MovedTo*) event_type="MOVE_TO" ;;
        esac
        
        handle_file_event "$event_type" "$file_path"
        
        # Periodic batch processing
        process_batch_changes
    done
}

# Surveillance avec inotifywait (Linux)
start_watching_inotify() {
    log "INFO" "Starting file watching with inotifywait..."
    
    # Construire patterns d'exclusion pour inotify
    local exclude_args=()
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        exclude_args+=("--exclude" "$pattern")
    done
    
    inotifywait "${exclude_args[@]}" \
        --monitor \
        --recursive \
        --event create,modify,delete,move \
        --format '%w%f %e' \
        "$PROJECT_ROOT" | while read file_path event_type; do
        
        handle_file_event "$event_type" "$file_path"
        
        # Periodic batch processing
        process_batch_changes
    done
}

# Start monitoring depending on the OS
start_watching() {
    cd "$PROJECT_ROOT"

    # Create logs and cache directory if needed (not in git)
    mkdir -p "$(dirname "$WATCH_LOG")"
    mkdir -p "${PROJECT_ROOT}/prompts/spec/system/structure/cache"/{structure,metadata,snapshots,temp}

    # Initialize the pending changes file
    > "$PENDING_CHANGES_FILE"

    log "INFO" "Starting file system watching for project: $PROJECT_ROOT"
    log "INFO" "Batch timeout: ${BATCH_TIMEOUT}s, Daemon mode: $DAEMON_MODE"
    
    # Detect available monitoring tool
    if command -v fswatch >/dev/null 2>&1; then
        start_watching_fswatch
    elif command -v inotifywait >/dev/null 2>&1; then
        start_watching_inotify
    else
        log "ERROR" "No file watching tool available. Install fswatch (macOS) or inotify-tools (Linux)"
        exit 1
    fi
}

# Stop monitoring (daemon)
stop_watching() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log "INFO" "Stopping watch daemon (PID: $pid)"
            kill "$pid"
            rm -f "$PID_FILE"
        else
            log "WARN" "Watch daemon not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        log "WARN" "No watch daemon running"
    fi
}

# Statut surveillance
status_watching() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Watch daemon running (PID: $pid)"
            
            # Statistics if log available
            if [[ -f "$WATCH_LOG" ]]; then
                local log_lines=$(wc -l < "$WATCH_LOG")
                local last_activity=$(tail -n1 "$WATCH_LOG" | cut -d']' -f1 | tr -d '[')
                echo "Log entries: $log_lines"
                echo "Last activity: $last_activity"
            fi
        else
            echo "Watch daemon not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        echo "Watch daemon not running"
    fi
}

# Signal handler for clean shutdown
cleanup() {
    log "INFO" "Stopping file watcher..."

    # Traitement final des changements en attente
    BATCH_TIMEOUT=0
    process_batch_changes

    # Clean up temp files
    rm -f "$PID_FILE" "$PENDING_CHANGES_FILE"
    exit 0
}

# Interface principale
main() {
    local command="${1:-watch}"
    
    # Parsing arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --daemon)
                DAEMON_MODE=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --no-notify)
                NOTIFY_AGENTS=false
                shift
                ;;
            --batch-timeout=*)
                BATCH_TIMEOUT="${1#*=}"
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [COMMAND] [OPTIONS]"
                echo ""
                echo "Commands:"
                echo "  watch               Start file watching (default)"
                echo "  start               Start in daemon mode"
                echo "  stop                Stop daemon"
                echo "  status              Show daemon status"
                echo "  test                Test with sample events"
                echo ""
                echo "Options:"
                echo "  --daemon            Run in background"
                echo "  --verbose, -v       Verbose logging"
                echo "  --no-notify         Disable agent notifications"
                echo "  --batch-timeout=N   Batch timeout in seconds (default: 5)"
                echo ""
                echo "Environment:"
                echo "  PROJECT_ROOT        Project directory to watch"
                echo "  BATCH_TIMEOUT       Default batch timeout"
                exit 0
                ;;
            start|stop|status|test)
                command="$1"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    case "$command" in
        "watch")
            if [[ "$DAEMON_MODE" == "true" ]]; then
                echo $$ > "$PID_FILE"
                trap cleanup INT TERM
            fi
            
            start_watching
            ;;
        "start")
            DAEMON_MODE=true
            if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
                echo "Watch daemon already running"
                exit 1
            fi
            
            echo "Starting watch daemon..."
            nohup "$0" watch --daemon > /dev/null 2>&1 &
            echo $! > "$PID_FILE"
            echo "Watch daemon started (PID: $(cat "$PID_FILE"))"
            ;;
        "stop")
            stop_watching
            ;;
        "status")
            status_watching
            ;;
        "test")
            echo "Testing file change detection..."
            handle_file_event "CREATE" "$PROJECT_ROOT/test-file.tmp"
            handle_file_event "MODIFY" "$PROJECT_ROOT/prompts/index.md"
            handle_file_event "DELETE" "$PROJECT_ROOT/test-file.tmp"
            sleep $((BATCH_TIMEOUT + 1))
            process_batch_changes
            echo "Test completed"
            ;;
        *)
            echo "Unknown command: $command"
            echo "Use '$0 --help' for usage information"
            exit 1
            ;;
    esac
}

# Execution
main "$@"
