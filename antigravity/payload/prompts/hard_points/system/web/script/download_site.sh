#!/usr/bin/env bash
# ------------------------------------------------------------
# Script : download_site.sh
# Description : Fetches the text content of a website using
#               wget with a specified depth
#               then converts the HTML files to Markdown.
# Usage : ./download_site.sh <url> <depth> [prefix]
# ------------------------------------------------------------


# Check the number of arguments
#   $1 = site URL
#   $2 = maximum depth (wget -l)
#   $3 = URL prefix to accept (optional)
if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 <url> <depth> [prefix]"
  exit 1
fi

URL="$1"
DEPTH="$2"
# Extract the hostname (e.g. example.com) from the URL
HOST=$(echo "$URL" | awk -F/ '{print $3}')

# URL prefix (mask) to filter on.
# If no prefix is provided, build a default prefix
# that accepts all URLs on the same host (example: https?://example.com)
if [[ -n "${3:-}" ]]; then
  PREFIX="${3}"
else
  PREFIX="https?://$HOST"
fi

# Target directory: prompts/hard_points/web/<site-name>
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Absolute path of the project root directory
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
TARGET_DIR="${ROOT_DIR}/prompts/hard_points/web/"
# Temp directory
TEMP_DIR="${TARGET_DIR}_TMP"

# Create the temp directory if it does not exist
mkdir -p "$TEMP_DIR"

# Download with wget into the temp directory
#   -r            : recursive
#   -l <depth>    : maximum depth
#   -k            : convert links for local browsing
#   -E            : adjust file extensions
#   -np           : do not ascend to parent directories
#   -P <dir>      : destination directory
#   -R            : reject files with certain extensions
#   --accept-regex : only download URLs starting with the provided prefix (if specified)
# Build the --accept-regex option based on the computed prefix
wget_opts="--accept-regex=^${PREFIX}"
echo "Starting download with wget..."
wget -r -l "$DEPTH" -k -E  -P "$TEMP_DIR" -R "jpg,jpeg,gif,png,css,js,ico,svg,woff,woff2,ttf,eot" "$wget_opts" "$URL" || echo "wget reported errors but the script continues"
echo "Download with wget finished."
echo "Creating target directory: $TARGET_DIR"
# Create the target directory if it does not exist
mkdir -p "$TARGET_DIR"

# Convert HTML files from the temp directory to the target directory
echo "Converting HTML files to Markdown..."
# Count the number of HTML files to convert
html_count=$(find "$TEMP_DIR" -name "*.html" -type f | wc -l)
echo "Number of HTML files to convert: $html_count"

# Check whether pandoc is available
if ! command -v pandoc >/dev/null 2>&1; then
  echo "Error: pandoc is not installed or not found in PATH."
  echo "Recommended installation:"
  echo "  macOS : brew install pandoc"
  echo "  Linux (apt) : sudo apt-get update && sudo apt-get install -y pandoc"
  echo "  Linux (yum) : sudo yum install -y pandoc"
  exit 1
fi

find "$TEMP_DIR" -name "*.html" -type f | while read -r html_file; do
  echo "Traitement de : $html_file"
  # Compute the file's relative path with respect to the temp directory
  relative_path="${html_file#"$TEMP_DIR"/}"
  # Build the Markdown file path in the target directory
  md_file="$TARGET_DIR/${relative_path%.html}.md"
  
  # Create the required directories in the target directory
  mkdir -p "$(dirname "$md_file")"
  
  # Convertir HTML en Markdown avec pandoc
  if pandoc --from html --to markdown_strict-raw_html --extract-media="./${md_file%.*}_media" -o "$md_file" "$html_file"; then
    echo "Converti : $relative_path -> ${relative_path%.html}.md"
  else
    echo "Error while converting: $relative_path"
  fi
done

# Remove the temp directory
rm -rf "$TEMP_DIR"

echo "Download and conversion complete: $TARGET_DIR"
