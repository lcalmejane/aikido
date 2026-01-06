# Plan Beginning – Initialisation Post-Sauvegarde

> **Type** : beginning | **Ordre** : -1 | **Bloquant** : OUI

## 🎯 Objectif

Préparer l'environnement de mise à jour AI-KIDO en vérifiant les backups, chargeant le contexte et générant les structures initiales pour comparaison.

Ce plan s'exécute **immédiatement après** la création du backup initial et **avant** la sélection du plan de version.

---

## 📥 Entrées Requises

- `$SOURCE` : Chemin absolu du répertoire contenant la base AI-KIDO actuelle (projet en cours)
- `$TARGET` : Chemin absolu du répertoire contenant les fichiers de mise à jour (source externe validée)

**Exemple** :
```bash
export SOURCE="/Users/lcare/workspace/best-p/ai-kido-best-practices"
export TARGET="/Users/lcare/workspace/best-p/ai-kido-best-practices/prompts/spec/aikido-source-git"
```

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1.1 : Vérification Backup Initial (NON BLOQUANT)

**Action : Vérifier l'existence d'un backup récent**

```bash
LATEST_BACKUP=$(bash prompts/hard_points/system/maj/scripts/beginning-check-backup.sh)
```

Ce script cherche le backup le plus récent dans `backups/aikido-backup-*.tgz`.
- **Sortie** : Chemin du backup ou message d'avertissement
- **Exit code** : 0 (toujours, non bloquant)

---

### 1️⃣ Phase 1.2 : Création Backup de Vérification (BLOQUANT)

**Action : Créer un backup de vérification avant toute modification**

```bash
bash prompts/hard_points/system/maj/scripts/create-backup.sh "$SOURCE" "aikido-verif-backup"
VERIF_BACKUP_EXIT=$?
```

Ce script crée un backup complet du projet avec timestamp.
- **Fichiers sauvegardés** : `.claude .roo .roomodes agents_list.md commands_list.md AGENTS.md CLAUDE.md README.md prompts`
- **Sortie** : `backups/aikido-verif-backup-YYYYMMDD-HHMMSS.tgz`
- **Exit code** : 0 si succès, 1 si échec (BLOQUANT)

---

### 2️⃣ Phase 2 : Chargement Contexte de Mise à Jour (BLOQUANT)

**Action : Charger ou détecter les versions actuelle et cible**

```bash
VERSION_OUTPUT=$(bash prompts/hard_points/system/maj/scripts/beginning-detect-versions.sh "$SOURCE" "$TARGET")
VERSION_EXIT=$?

if [ $VERSION_EXIT -eq 0 ]; then
  MAJ_CURRENT_VERSION=$(echo "$VERSION_OUTPUT" | awk '{print $1}')
  MAJ_TARGET_VERSION=$(echo "$VERSION_OUTPUT" | awk '{print $2}')
else
  echo "❌ ERREUR : Échec détection versions"
  exit 1
fi
```

Ce script détecte automatiquement les versions depuis `prompts/hard_points/ai-kido.md`.
- **Sortie** : `CURRENT_VERSION TARGET_VERSION` (format: "1.3.0 1.3.1")
- **Export** : Variables `$MAJ_CURRENT_VERSION` et `$MAJ_TARGET_VERSION`
- **Exit code** : 0 si succès, 1 si échec (BLOQUANT)

---

### 3️⃣ Phase 3 : Export Variables pour Plans Suivants (BLOQUANT)

**Action : Exporter les variables globales**

**Objectif** : Rendre les variables disponibles pour tous les plans suivants.

```bash
export MAJ_CURRENT_VERSION
export MAJ_TARGET_VERSION
export LATEST_BACKUP
export SOURCE
export TARGET

echo "✅ Variables exportées pour plans suivants"
echo "   MAJ_CURRENT_VERSION = $MAJ_CURRENT_VERSION"
echo "   MAJ_TARGET_VERSION  = $MAJ_TARGET_VERSION"
echo "   SOURCE              = $SOURCE"
echo "   TARGET              = $TARGET"
```

---

### 4️⃣ Phase 4 : Log de Démarrage (NON BLOQUANT)

**Action : Créer le fichier de log initial**

```bash
LOG_FILE="prompts/spec/logs/maj-aikido-start-$(date +%Y%m%d-%H%M%S).log"
LOG_CONTENT="Démarrage Mise à Jour AI-KIDO

CONTEXTE :
  Backup utilisé      : ${LATEST_BACKUP:-Aucun}
  Backup vérification : ${VERIF_BACKUP:-Non créé}
  Version actuelle    : $MAJ_CURRENT_VERSION
  Version cible       : $MAJ_TARGET_VERSION

RÉPERTOIRES :
  Source : $SOURCE
  Target : $TARGET"

bash prompts/hard_points/system/maj/scripts/create-log.sh "$LOG_FILE" "Démarrage MAJ" "$LOG_CONTENT"
```

Ce script crée un log formaté pour tracer le début du processus.
- **Sortie** : `prompts/spec/logs/maj-aikido-start-YYYYMMDD-HHMMSS.log`
- **Exit code** : 0 (toujours, non bloquant)

---

### 5️⃣ Phase 5 : Génération Structure Initiale Projet (NON BLOQUANT)

**Action : Générer les index JSON pour comparaison future**

```bash
bash prompts/hard_points/system/maj/scripts/beginning-generate-structure.sh "$SOURCE" "$TARGET"
```

Ce script génère les structures JSON des projets TARGET et SOURCE (before).
- **Sorties** :
  - `/tmp/aikido/maj_target.json` : Structure du projet externe
  - `/tmp/aikido/maj_before.json` : Structure du projet actuel avant MAJ
- **Exit code** : 0 (toujours, non bloquant - affiche warnings si échec)

---

## 📤 Sorties Produites

| Variable/Fichier | Description | Portée |
|------------------|-------------|--------|
| `$MAJ_CURRENT_VERSION` | Version AI-KIDO actuelle (ex: `1.3.0-LLM`) | Globale (exportée) |
| `$MAJ_TARGET_VERSION` | Version AI-KIDO cible (ex: `1.3.1-LLM`) | Globale (exportée) |
| `$LATEST_BACKUP` | Chemin backup initial | Globale (exportée) |
| `$VERIF_BACKUP` | Chemin backup vérification | Locale |
| `$LOG_FILE` | Fichier log démarrage | Locale |
| `/tmp/aikido/maj_target.json` | Structure TARGET (JSON) | Fichier temporaire |
| `/tmp/aikido/maj_before.json` | Structure SOURCE avant MAJ (JSON) | Fichier temporaire |

---

## ✅ Conditions de Succès

Le plan `beginning` est considéré réussi si **TOUTES** ces conditions sont remplies :

1. ✅ Un backup de vérification a été créé (`$VERIF_BACKUP` existe)
2. ✅ Les versions CURRENT et TARGET sont détectées (non vides)
3. ✅ Les variables sont exportées correctement
4. ✅ Le log de démarrage est créé

**Conditions non bloquantes** (warnings seulement) :
- ⚠️  Backup initial non trouvé
- ⚠️  Échec génération structures JSON

---

## ❌ Gestion d'Échec

Si une phase **BLOQUANTE** échoue :

1. **Afficher message d'erreur clair** avec cause exacte
2. **NE PAS continuer** vers la sélection du plan de version
3. **EXIT 1** pour arrêter le processus
4. **L'utilisateur doit** :
   - Corriger le problème (permissions, fichiers manquants)
   - Relancer `/maj-aikido --update`

**Exemple de message d'échec** :
```
❌ ERREUR CRITIQUE : Phase 1.2 (Backup vérification) échouée

Cause : Impossible de créer backups/aikido-verif-backup-20260105-143022.tgz
Raison possible : Permissions insuffisantes sur le répertoire backups/

Action requise :
  1. Vérifier les permissions : ls -la backups/
  2. Créer le répertoire si nécessaire : mkdir -p backups && chmod 755 backups
  3. Relancer : /maj-aikido --update

═══════════════════════════════════════════════════════════════
```

---

## 🔗 Enchaînement

Une fois ce plan réussi, le système passe à :

1. **Sélection automatique du plan de version** selon `$MAJ_TARGET_VERSION`
   - Ex: `1.3.0.0` → `plan-V1.3.0.0.md`
   - Ex: `1.3.1.0` → `plan-V1.3.1.0.md`

2. **Exécution du plan de version** (phases spécifiques à la migration)

3. **Chaînage plans ending** : 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7

---

## 📚 Références

- **Script génération structure** : [`prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh`](../../structure/scripts/generate-all-indexes-v3.1.sh)
- **Format index.json** : [`prompts/hard_points/system/structure/SKILL.md`](../../structure/SKILL.md)
- **Plans de version** : [`prompts/hard_points/system/maj/plans/plan-V*.md`](.)

---

*Plan beginning v2.0 – Approche déclarative avec prompts d'action*
