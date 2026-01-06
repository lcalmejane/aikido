# Plan de migration V1.3.0.0 – Passage de `/prompts/gen/index.md` vers `/prompts/index.md`

## 🎯 Objectif
Migrer le point d’entrée unique du projet de **`/prompts/gen/index.md`** vers **`/prompts/index.md`** en respectant le processus complet de mise à jour défini par la commande `maj-aikido`.  
Le plan doit être exécuté séquentiellement par l’agent **agent‑aikido‑update‑controller** et couvrir toutes les phases de sauvegarde, bootstrap, analyse différentielle, mise à jour des hard‑points, fusion critique, synchronisation et validation finale.

## 📋 Étapes du plan

### -1️⃣ Phase -1 – Sélection & validation de la source
1. **Détection d’un éventuel bootstrap**  
   ```bash
   mkdir -p "/tmp/aikido"
   if [ -f "/tmp/aikido/aikido-bootstrap-*.env" ]; then
     source "/tmp/aikido/aikido-bootstrap-*.env"
     echo "🔄 Reprise du bootstrap – source déjà validée"
   fi
   ```
2. **Sélection du type de source** (`git` | `local` | `archive`) – interaction utilisateur via le script intégré.  
3. **Validation de la source** avec `prompts/hard_points/system/maj/scripts/validate-aikido-source.sh`.  
   ```bash
   VALIDATE_SCRIPT="prompts/hard_points/system/maj/scripts/validate-aikido-source.sh"
   "$VALIDATE_SCRIPT" validate "$SOURCE_PATH"
   ```

### -0.7️⃣ Phase -0.7 – Auto‑mise à jour de `maj-aikido` (bootstrap)
1. **Comparaison de la version locale vs source** via `compare-command-versions.sh`.  
2. **Si différence détectée** :  
   - Backup du fichier actuel ` prompts/hard_points/commands/maj-aikido.md `  
   - Remplacement par la version source  
   - Exit 42 pour relancer le processus avec la nouvelle version.  

### -0.5️⃣ Phase -0.5 – Analyse différentielle
1. **Détection de la version cible** (`VERSION_TARGET="1.3"`).  
2. **Analyse des différences** avec `prompts/hard_points/system/maj/scripts/analyze-aikido-update.sh`.  
3. **Rapport d’analyse** stocké dans `/tmp/aikido/aikido-report-data-$$.json`.

### -0️⃣ Phase -0 – Mise à jour des fichiers
#### 0.1 Hard‑points (obligatoire)
```bash
for file in prompts/hard_points/ai-kido.md prompts/hard_points/ai-kido-light.md; do
  cp "$SOURCE_PATH/$file" "$file" && echo "✅ $file remplacé"
done
```
#### 0.2 Documentation & fichiers critiques (fusion intelligente)
- **AGENTS.md**, **CLAUDE.md**, **.roomodes**, **README.md** → fusion via `agent-aikido-fusion`.  
- **Documentation standard** (`prompts/index.md`, `prompts/gen/index.md`) → mise à jour avec `interactive-file-update.sh`.

#### 0.3 Synchronisation des nouvelles fichiers
- Copie des fichiers inexistants localement depuis la source (`sync-files.sh`).  

#### 0.4 Mise à jour de la configuration `.roomodes`
- Fusion via `merge-roomodes.sh`.

#### 0.5 Génération du rapport final
```bash
REPORT_SCRIPT="prompts/hard_points/system/maj/scripts/generate-report.sh"
REPORT_FILE="prompts/spec/logs/maj-aikido-report-$(date +%Y%m%d-%H%M%S).md"
"$REPORT_SCRIPT" --template update --data "$REPORT_DATA" --output "$REPORT_FILE"
```

### 0️⃣ Phase 0 – Migration du point d’entrée
1. **Sauvegarde de l’ancien index**  
   ```bash
   cp prompts/gen/index.md "prompts/gen/index.md.bak.$(date +%Y%m%d-%H%M%S)"
   echo "✅ Sauvegarde de prompts/gen/index.md réalisée"
   ```
2. **Création du nouveau index**  
   ```bash
   cp prompts/gen/index.md prompts/index.md
   # Ajout de l’en‑tête standard
   sed -i '1i\
---\nversion: "1.3.0.0"\ndate: "$(date +%Y-%m-%d)"\nstatus: "draft"\n---\n' prompts/index.md
   echo "✅ Nouveau /prompts/index.md créé"
   ```
3. **Mise à jour des références internes**  
   ```bash
   grep -rl "prompts/gen/index.md" . | while read -r file; do
     sed -i "s|prompts/gen/index.md|prompts/index.md|g" "$file"
   done
   echo "✅ Références mises à jour"
   ```

### 0.1️⃣ Phase 0.1 – Validation post‑migration
- **Détection de résidus**  
  ```bash
  if grep -qr "prompts/gen/index.md" .; then
    echo "⚠️ Références restantes détectées"
    exit 1
  fi
  echo "✅ Aucun résidu trouvé"
  ```
- **Validation du nouveau index** avec l’agent `agent-aikido-validator`  
  ```bash
  agent-aikido-validator --path prompts/index.md
  ```

### 0.2️⃣ Phase 0.2 – Nettoyage (optionnel)
- Suppression de l’ancien index après validation réussie  
  ```bash
  rm -f prompts/gen/index.md
  echo "🗑️ Ancien /prompts/gen/index.md supprimé"
  ```

### 0.3️⃣ Phase 0.3 – Validation de la structure globale
- Exécution de `validate-structure.sh` selon le type de projet (mono)  
  ```bash
  VALIDATE_SCRIPT="prompts/hard_points/system/maj/scripts/validate-structure.sh"
  "$VALIDATE_SCRIPT" "." --type mono --version 1.3
  ```

## 📦 Résultat attendu
- `/prompts/index.md` contient le même contenu que l’ancien index, enrichi d’une en‑tête de version `1.3.0.0`.  
- Toutes les références du projet pointent désormais vers `/prompts/index.md`.  
- Aucun fichier ne référence plus `/prompts/gen/index.md`.  
- Hard‑points, documentation critique et configuration sont à jour et validés.  
- Un rapport de mise à jour complet est généré dans `prompts/spec/logs/`.  

## 🛠️ Exécution
Le plan doit être invoqué par la commande :
```bash
/maj-aikido --update
```
L’agent **agent‑aikido‑update‑controller** lira ce fichier depuis `prompts/hard_points/system/maj/plans/plan-V1.3.0.0.md` et exécutera chaque phase dans l’ordre indiqué.  

---  
*Généré par **agent‑aikido‑update‑controller** – Version 1.3.0.0*  
