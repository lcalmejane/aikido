#!/usr/bin/env bash
# ------------------------------------------------------------
# Script : download_site.sh
# Description : Récupère le contenu texte d'un site web en
#               utilisant wget avec une profondeur spécifiée
#               puis convertit les fichiers HTML en Markdown.
# Usage : ./download_site.sh <url> <depth> [prefix]
# ------------------------------------------------------------


# Vérification du nombre d'arguments
#   $1 = URL du site
#   $2 = profondeur maximale (wget -l)
#   $3 = préfixe d'URL à accepter (optionnel)
if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 <url> <depth> [prefix]"
  exit 1
fi

URL="$1"
DEPTH="$2"
# Extraction du nom d'hôte (ex : example.com) depuis l'URL
HOST=$(echo "$URL" | awk -F/ '{print $3}')

# Préfixe d'URL (masque) à filtrer.
# Si aucun préfixe n'est fourni, on construit un préfixe par défaut
# qui accepte toutes les URLs du même hôte (exemple : https?://example.com)
if [[ -n "${3:-}" ]]; then
  PREFIX="${3}"
else
  PREFIX="https?://$HOST"
fi

# Répertoire cible : prompts/hard_points/web/<nom‑du‑site>
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Chemin absolu du répertoire racine du projet
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
TARGET_DIR="${ROOT_DIR}/prompts/hard_points/web/"
# Répertoire temporaire
TEMP_DIR="${TARGET_DIR}_TMP"

# Création du répertoire temporaire s'il n'existe pas
mkdir -p "$TEMP_DIR"

# Téléchargement avec wget dans le répertoire temporaire
#   -r            : récursif
#   -l <depth>    : profondeur maximale
#   -k            : convertir les liens pour une navigation locale
#   -E            : ajuster les extensions de fichiers
#   -np           : ne pas remonter aux répertoires parents
#   -P <dir>      : répertoire de destination
#   -R            : rejeter les fichiers avec certaines extensions
#   --accept-regex : ne télécharger que les URLs commençant par le préfixe fourni (si spécifié)
# Construction de l'option --accept-regex basée sur le préfixe calculé
wget_opts="--accept-regex=^${PREFIX}"
echo "Début du téléchargement avec wget..."
wget -r –spider -l "$DEPTH" -k -E  -P "$TEMP_DIR" -R "jpg,jpeg,gif,png,css,js,ico,svg,woff,woff2,ttf,eot" "$wget_opts" "$URL" || echo "wget a rencontré des erreurs mais le script continue"
echo "Fin du téléchargement avec wget."
echo "Creation du répertoire cible : $TARGET_DIR"
# Création du répertoire cible s'il n'existe pas
mkdir -p "$TARGET_DIR"

# Convertir les fichiers HTML du répertoire temporaire vers le répertoire cible
echo "Conversion des fichiers HTML en Markdown..."
# Compter le nombre de fichiers HTML à convertir
html_count=$(find "$TEMP_DIR" -name "*.html" -type f | wc -l)
echo "Nombre de fichiers HTML à convertir : $html_count"

# Vérifier si pandoc est disponible
if ! command -v pandoc >/dev/null 2>&1; then
  echo "Erreur : pandoc n'est pas installé ou introuvable dans le PATH."
  echo "Installation recommandée :"
  echo "  macOS : brew install pandoc"
  echo "  Linux (apt) : sudo apt-get update && sudo apt-get install -y pandoc"
  echo "  Linux (yum) : sudo yum install -y pandoc"
  exit 1
fi

find "$TEMP_DIR" -name "*.html" -type f | while read -r html_file; do
  echo "Traitement de : $html_file"
  # Calculer le chemin relatif du fichier par rapport au répertoire temporaire
  relative_path="${html_file#"$TEMP_DIR"/}"
  # Créer le chemin du fichier Markdown dans le répertoire cible
  md_file="$TARGET_DIR/${relative_path%.html}.md"
  
  # Créer les répertoires nécessaires dans le répertoire cible
  mkdir -p "$(dirname "$md_file")"
  
  # Convertir HTML en Markdown avec pandoc
  if pandoc --from html --to markdown_strict-raw_html --extract-media="./${md_file%.*}_media" -o "$md_file" "$html_file"; then
    echo "Converti : $relative_path -> ${relative_path%.html}.md"
  else
    echo "Erreur lors de la conversion de : $relative_path"
  fi
done

# Supprimer le répertoire temporaire
rm -rf "$TEMP_DIR"

echo "Téléchargement et conversion terminés : $TARGET_DIR"
