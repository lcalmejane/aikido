# Installation Skill Web dans AI-KIDO

> **Version** : 1.0.0 | **Date** : 2026-01-08 | **Statut** : Active

## Description

Ce document guide l'installation et l'intégration du Skill Web dans le système AI-KIDO. Il permet d'enregistrer la commande de téléchargement de site web dans les fichiers de configuration du système.

## Prérequis

- Système AI-KIDO installé et fonctionnel
- Accès en écriture aux fichiers de configuration
- Skill Web présent dans `prompts/hard_points/system/web/`
- **Logiciels requis** : `wget`, `pandoc`

## Fichiers à Modifier

### 1. skills_list.md

Ajouter le Skill Web :

```markdown
- **web** – Le Skill Web d'AI‑KIDO gère les interactions avec le Web : téléchargement de sites, extraction de contenu pertinent, normalisation du HTML et génération de réponses structurées (texte brut ou JSON). – [`prompts/hard_points/system/web/SKILL.md`](prompts/hard_points/system/web/SKILL.md)
```

### 2. commands_list.md

Ajouter la commande download-site (ordre alphabétique) :

```markdown
- **download-site** : Télécharge un site web et convertit son contenu en Markdown ([`download-site.md`](prompts/hard_points/system/web/commands/download-site.md:2))
```

### 3. .roo/commands/

Créer le fichier de mapping pour la commande :

#### .roo/commands/download-site.md
```markdown
---
description: "Télécharge un site web et convertit son contenu en Markdown"
---

# Commande download-site

Cette commande exécute le fichier de commande complet depuis `prompts/hard_points/system/web/commands/download-site.md`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

\`\`\`
Lecture de prompts/hard_points/system/web/commands/download-site.md et exécution des instructions...
\`\`\`
```

### 4. .claude/commands/

Créer le même fichier de mapping dans `.claude/commands/` avec le même contenu que `.roo/commands/`.

### 5. .claude/settings.local.json

Ajouter les permissions nécessaires pour wget et pandoc :

```json
{
  "permissions": {
    "allow": [
      "Bash(prompts/hard_points/system/web/script/download_site.sh:*)",
      "Bash(wget:*)",
      "Bash(pandoc:*)"
    ]
  }
}
```

## Procédure d'Installation

### Étape 1 : Vérifier les Prérequis

```bash
# Vérifier que le Skill Web est présent
ls -la prompts/hard_points/system/web/

# Vérifier wget
which wget || echo "⚠️ wget non installé"

# Vérifier pandoc
which pandoc || echo "⚠️ pandoc non installé"
```

**Installation des dépendances si nécessaire :**

```bash
# macOS
brew install wget pandoc

# Linux (Debian/Ubuntu)
sudo apt-get update && sudo apt-get install -y wget pandoc

# Linux (RHEL/CentOS)
sudo yum install -y wget pandoc
```

### Étape 2 : Créer les Fichiers de Mapping

```bash
# Créer les répertoires si nécessaire
mkdir -p .roo/commands
mkdir -p .claude/commands

# Créer la commande dans .roo/commands/
touch .roo/commands/download-site.md

# Créer la commande dans .claude/commands/
touch .claude/commands/download-site.md
```

### Étape 3 : Remplir les Fichiers de Mapping

**IMPORTANT** : Les fichiers créés à l'Étape 2 doivent être remplis avec leur contenu respectif (voir sections 3 et 4 ci-dessus).

#### 3.1 : Remplir les commandes .roo/commands/ et .claude/commands/
Copier le contenu de la section 3 dans chaque fichier de commande.

### Étape 4 : Mettre à Jour les Fichiers de Configuration Système

Éditer manuellement ou utiliser les commandes suivantes :

```bash
# Sauvegarder les fichiers originaux
cp skills_list.md skills_list.md.backup
cp commands_list.md commands_list.md.backup
cp .claude/settings.local.json .claude/settings.local.json.backup
```

**Ensuite :**
1. Ajouter l'entrée dans `skills_list.md` (voir section 1)
2. Ajouter l'entrée dans `commands_list.md` (voir section 2)
3. Ajouter les permissions dans `.claude/settings.local.json` (voir section 5)

### Étape 5 : Rendre le Script Exécutable

```bash
chmod +x prompts/hard_points/system/web/script/download_site.sh
```

### Étape 6 : Valider l'Installation

```bash
# Vérifier que les fichiers de mapping existent
ls -la .roo/commands/download-site.md
ls -la .claude/commands/download-site.md

# Vérifier que la commande est disponible
/list-command | grep download-site

# Vérifier que le Skill est référencé
grep "web" skills_list.md

# Tester la commande (exemple avec un site simple)
/download-site https://example.com 1
```

**IMPORTANT** : Après avoir effectué toutes les modifications, **redémarrer VSCode/Claude Code** pour que les changements soient pris en compte.

## Configuration Post-Installation

### 1. Vérifier les Dépendances

```bash
# Vérifier wget
wget --version

# Vérifier pandoc
pandoc --version
```

### 2. Tester le Script

```bash
# Test manuel du script
cd prompts/hard_points/system/web/script
./download_site.sh https://example.com 1
```

### 3. Nettoyer les Tests

```bash
# Supprimer les fichiers de test si nécessaire
rm -rf prompts/hard_points/web/example.com/
```

## Utilisation

Une fois installé, utilisez la commande avec la syntaxe suivante :

```bash
# Télécharger les 2 premiers niveaux d'un site
/download-site https://example.com 2

# Télécharger avec filtre de préfixe
/download-site https://example.com 3 "https://example.com/docs"

# Télécharger en profondeur (attention à la taille)
/download-site https://example.com 5
```

## Désinstallation

Pour désinstaller le Skill Web :

1. Supprimer l'entrée dans `skills_list.md`
2. Supprimer l'entrée dans `commands_list.md`
3. Supprimer les fichiers dans `.roo/commands/download-site.md`
4. Supprimer les fichiers dans `.claude/commands/download-site.md`
5. Supprimer les permissions dans `.claude/settings.local.json`
6. (Optionnel) Supprimer le répertoire `prompts/hard_points/system/web/`

## Dépannage

### Commande Non Reconnue

Si la commande n'est pas reconnue après installation :

1. Vérifier que les fichiers de mapping existent dans `.roo/commands/` et `.claude/commands/`
2. Redémarrer VSCode / Claude Code
3. Vérifier les permissions des fichiers

### Erreur "wget not found"

Si wget n'est pas trouvé :

```bash
# macOS
brew install wget

# Linux (Debian/Ubuntu)
sudo apt-get install -y wget

# Linux (RHEL/CentOS)
sudo yum install -y wget
```

### Erreur "pandoc not found"

Si pandoc n'est pas trouvé :

```bash
# macOS
brew install pandoc

# Linux (Debian/Ubuntu)
sudo apt-get install -y pandoc

# Linux (RHEL/CentOS)
sudo yum install -y pandoc
```

### Permission Denied

Si vous obtenez une erreur de permission :

```bash
# Rendre le script exécutable
chmod +x prompts/hard_points/system/web/script/download_site.sh

# Vérifier les permissions
ls -la prompts/hard_points/system/web/script/download_site.sh
```

### Téléchargement Lent ou Bloqué

Certains sites peuvent bloquer ou limiter le téléchargement automatique :

- Respecter les règles robots.txt du site
- Utiliser une profondeur faible (1-3)
- Ajouter un délai entre les requêtes si nécessaire

## Références

- **[SKILL.md](SKILL.md)** - Documentation technique complète du Skill
- **[download-site.md](commands/download-site.md)** - Documentation de la commande
- **[download_site.sh](script/download_site.sh)** - Script bash de téléchargement

## Notes

- L'installation nécessite des droits d'écriture sur les fichiers de configuration
- Le script nécessite `bash 4.0+`, `wget`, et `pandoc`
- Les sites téléchargés sont stockés dans `prompts/hard_points/web/<nom-du-site>/`
- Les fichiers médias (images, CSS, JS) sont automatiquement exclus
- Utilisez des profondeurs faibles pour éviter de télécharger des sites entiers

## Limitations

- **Taille** : Le téléchargement peut être volumineux selon la profondeur
- **Durée** : La conversion peut prendre du temps selon le nombre de pages
- **Respect** : Toujours respecter les règles robots.txt et les conditions d'utilisation
- **Performance** : Préférer des profondeurs 1-3 pour un usage optimal

---

**Dernière mise à jour** : 2026-01-08
**Mainteneur** : AI-KIDO Team
