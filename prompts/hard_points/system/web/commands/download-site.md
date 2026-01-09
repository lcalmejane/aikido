---
name: download-site
description: Télécharge un site web et convertit son contenu en Markdown
category: web
---

# Commande: /download-site

## Description

Télécharge récursivement le contenu d'un site web en utilisant `wget`, puis convertit tous les fichiers HTML en format Markdown avec `pandoc`. Le contenu est stocké dans `prompts/hard_points/web/<nom-du-site>`.

> **⚠️ MODE READ-ONLY** : Cette commande télécharge uniquement du contenu public accessible via HTTP/HTTPS. Respecte les règles robots.txt du site.

## Usage

```bash
/download-site <url> <depth> [prefix]
```

## Paramètres

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `url` | string | Oui | URL du site à télécharger (ex: https://example.com) |
| `depth` | integer | Oui | Profondeur maximale de téléchargement récursif (1-5 recommandé) |
| `prefix` | string | Non | Préfixe d'URL à accepter (regex). Par défaut: `https?://<host>` |

## Comportement

1. Vérifie les paramètres fournis (URL et profondeur obligatoires)
2. Extrait le nom d'hôte depuis l'URL
3. Crée un répertoire temporaire pour le téléchargement
4. Télécharge le site avec `wget` :
   - Récursif jusqu'à la profondeur spécifiée
   - Convertit les liens pour navigation locale
   - Ignore les fichiers médias (images, CSS, JS, polices)
   - Applique le filtre de préfixe si fourni
5. Convertit tous les fichiers HTML en Markdown avec `pandoc`
6. Stocke le résultat dans `prompts/hard_points/web/<nom-du-site>`
7. Nettoie le répertoire temporaire

## Sortie

### Succès

```
Début du téléchargement avec wget...
Fin du téléchargement avec wget.
Creation du répertoire cible : /path/to/prompts/hard_points/web/
Conversion des fichiers HTML en Markdown...
Nombre de fichiers HTML à convertir : 15
Traitement de : /path/to/temp/index.html
Converti : example.com/index.html -> example.com/index.md
...
Téléchargement et conversion terminés : /path/to/prompts/hard_points/web/
```

### Échec

```
Usage: download_site.sh <url> <depth> [prefix]
```

ou

```
Erreur : pandoc n'est pas installé ou introuvable dans le PATH.
Installation recommandée :
  macOS : brew install pandoc
  Linux (apt) : sudo apt-get update && sudo apt-get install -y pandoc
  Linux (yum) : sudo yum install -y pandoc
```

## Prérequis

### Logiciels requis

- **wget** : téléchargement récursif de sites web
- **pandoc** : conversion HTML → Markdown

### Installation

**macOS:**
```bash
brew install wget pandoc
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install -y wget pandoc
```

**Linux (RHEL/CentOS):**
```bash
sudo yum install -y wget pandoc
```

## Scripts associés

- [`../script/download_site.sh`](../script/download_site.sh)

## Dépendances

- wget
- pandoc
- bash (>=4.0)

## Exemples

### Exemple 1 : Téléchargement simple

```bash
# Télécharger les 2 premiers niveaux d'un site
/download-site https://example.com 2
```

### Exemple 2 : Téléchargement avec filtre de préfixe

```bash
# Télécharger uniquement la section /docs/
/download-site https://example.com 3 "https://example.com/docs"
```

### Exemple 3 : Téléchargement en profondeur

```bash
# Télécharger jusqu'à 5 niveaux (attention à la taille)
/download-site https://example.com 5
```

## Codes de Retour

- `0` : Téléchargement et conversion réussis
- `1` : Paramètres invalides ou dépendances manquantes

## Fichiers exclus

Les types de fichiers suivants sont automatiquement exclus du téléchargement :
- Images : jpg, jpeg, gif, png, svg, ico
- Styles : css
- Scripts : js
- Polices : woff, woff2, ttf, eot

## Structure de sortie

```
prompts/hard_points/web/
└── example.com/
    ├── index.md
    ├── about.md
    ├── docs/
    │   ├── getting-started.md
    │   └── api-reference.md
    └── [other-pages].md
```

## Notes

- **Limites** : Utilisez des profondeurs faibles (1-3) pour éviter de télécharger des sites entiers
- **Respect des robots.txt** : Le script respecte les règles d'exclusion des sites
- **Performance** : La conversion peut prendre du temps selon le nombre de pages
- **Stockage** : Les fichiers sont stockés de manière persistante dans `prompts/hard_points/web/`
- **Médias** : Les images et médias extraits sont placés dans des sous-dossiers `*_media/`

## Cas d'usage

1. **Documentation technique** : Télécharger une documentation en ligne pour consultation offline
2. **Analyse de contenu** : Extraire le contenu d'un site pour analyse par un LLM
3. **Archivage** : Sauvegarder une version statique d'un site web
4. **Knowledge base** : Intégrer du contenu web dans la Memory Bank AI-KIDO
