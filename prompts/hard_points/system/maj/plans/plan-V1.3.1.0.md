# Plan de migration V1.3.1.0 – Passage du système de commandes **`.roo/commands/`** vers **`prompts/hard_points/commands/`**  

## 🎯 Objectif  

Migrer l’ensemble des commandes de la version **1.3** vers la version **1.3.1** en adoptant le nouveau paradigme :  

- Les fichiers de commande réels sont déplacés dans `prompts/hard_points/commands/`.  
- Un fichier de *mapping* (wrapper) est créé dans `.roo/commands/` **et** `.claude/commands/` qui référence dynamiquement le fichier réel.  

Le plan doit être exécuté séquentiellement par l’agent **`agent-aikido-update-controller`** via la commande `maj-aikido`.

## 📋 Étapes du plan  

### -1️⃣ Phase -1 – Sélection & validation de la source  

1. **Détection du bootstrap**.  

2. **Sélection du type de source** (`git | local | archive`).  
3. **Validation de la source** avec `prompts/hard_points/system/maj/scripts/validate-aikido-source.sh`.

### 0️⃣ Phase 0 – Migration des commandes  

#### 0.1️⃣ Identification des commandes à migrer  

```bash
mkdir -p "/tmp/aikido"
# Liste les fichiers de commande réels (non‑mappings) dans .roo/commands
# Un mapping contient la phrase « Cette commande exécute le fichier de commande complet depuis `prompts/hard_points/commands/` »
find .roo/commands -type f -name "*.md" \
  -exec grep -L "Cette commande exécute le fichier de commande complet depuis \`prompts/hard_points/commands/" {} \; \

  -exec basename {} .md \; > /tmp/aikido/commands-to-migrate.txt
```

#### 0.2️⃣ Déplacement des fichiers de commande  

```bash
while read cmd; do
  # Crée le répertoire cible s’il n’existe pas
  mkdir -p prompts/hard_points/commands
  # Déplace le fichier réel
  mv ".roo/commands/${cmd}.md" "prompts/hard_points/commands/${cmd}.md"
  echo "✅ ${cmd}.md déplacé vers prompts/hard_points/commands/"
done < /tmp/aikido/commands-to-migrate.txt
```

#### 0.3️⃣ Création des fichiers de mapping  

**Template mapping Command (Roo & Claude)** :  

```markdown
---

description: "[description courte]"
---

# Commande {{nom-commande}}


Cette commande exécute le fichier de commande complet depuis \`prompts/hard_points/commands/{{nom-commande}}.md\`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

\`\`\`

Lecture de prompts/hard_points/commands/{{nom-commande}}.md et exécution des instructions...
\`\`\`
```

Création automatisée :  

```bash
while read cmd; do
  # Mapping Roo
  cat > ".roo/commands/${cmd}.md" <<EOF
---
description: "[description courte]"
---

# Commande ${cmd}

Cette commande exécute le fichier de commande complet depuis \`prompts/hard_points/commands/${cmd}.md\`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

\`\`\`
Lecture de prompts/hard_points/commands/${cmd}.md et exécution des instructions...
\`\`\`
EOF

  # Mapping Claude
  cat > ".claude/commands/${cmd}.md" <<EOF
---
description: "[description courte]"

---

# Commande ${cmd}

Cette commande exécute le fichier de commande complet depuis \`prompts/hard_points/commands/${cmd}.md\`.


**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.


\`\`\`
Lecture de prompts/hard_points/commands/${cmd}.md et exécution des instructions...
\`\`\`
EOF


  echo "✅ Mappings créés pour ${cmd}"

done < /tmp/aikido/commands-to-migrate.txt
```

#### 0.4️⃣ Mise à jour des références internes  

```bash
# Remplace toutes les références .roo/commands/* par le nouveau chemin

  sed -i "s|.roo/commands/|prompts/hard_points/commands/|g" "$file"


done
echo "✅ Références internes mises à jour"
```

#### 0.5️⃣ Validation de la migration  

# Vérifie qu’aucun fichier .roo/commands ne reste sans mapping

if find .roo/commands -type f -name "*.md" ! -path ".roo/commands/*-mapping.md" | grep -q .; then
  echo "⚠️ Des commandes non migrées détectées"
  exit 1
fi
echo "✅ Toutes les commandes migrées"

```
### 0.1️⃣ Phase 0.1 – Validation post‑migration (agent‑aikido‑validator)  



```bash
agent-aikido-validator --path prompts/hard_points/commands/
agent-aikido-validator --path .roo/commands/
agent-aikido-validator --path .claude/commands/
```

### 0.3️⃣ Phase 0.3 – Génération du rapport de migration  

```bash
REPORT_SCRIPT="prompts/hard_points/system/maj/scripts/generate-report.sh"
REPORT_FILE="prompts/spec/logs/maj-aikido-report-$(date +%Y%m%d-%H%M%S).md"
"$REPORT_SCRIPT" --template command-migration --data "/tmp/aikido/commands-to-migrate.txt" --output "$REPORT_FILE"
echo "✅ Rapport généré : $REPORT_FILE"
```

## 📦 Résultat attendu  

- Tous les fichiers de commande réels sont dans `prompts/hard_points/commands/`.  
- Deux fichiers de mapping existent pour chaque commande : `.roo/commands/<nom>.md` et `.claude/commands/<nom>.md`.  
- Aucun fichier `.roo/commands/*.md` ne contient plus le code de la commande (seulement le wrapper).  
- Les références du projet pointent vers le nouveau répertoire.  
- Le rapport de migration documente les actions réalisées.

## 🛠️ Exécution  

Le plan doit être invoqué par la commande :  

```bash
/maj-aikido --update
```

L’agent **`agent-aikido-update-controller`** lira ce fichier et exécutera chaque phase dans l’ordre indiqué.  

---  
*Généré par **agent‑aikido‑update‑controller** – Version 1.3.1.0*  
