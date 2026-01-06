# Plan Ending-3 – Mise à Jour Index Généraux

> **Type** : ending | **Ordre** : 3 | **Bloquant** : OUI

## 🎯 Objectif

Mettre à jour les fichiers d'index généraux du projet (mono ou multi-projet) après l'analyse des changements de la phase ending-2.

Ce plan génère ou met à jour le point d'entrée unifié `/prompts/index.md` et, en cas de multi-projet, les index intermédiaires `/prompts/{projet}/index.md`.

---

## 📥 Entrées Requises

- `$PROJECT_TYPE` : Type de projet détecté ("MONO" ou "MULTI")
- `$SOURCE` : Répertoire source du projet actuel
- `$TARGET` : Répertoire cible contenant les fichiers de mise à jour
- `/tmp/aikido/maj_diff.json` : Rapport de différences (généré par ending-2)

---

## 📋 Étapes d'Exécution

### 1️⃣ Phase 1 : Détection Type de Projet (SI NON DÉFINI)

**Action : Utiliser le script technique pour détecter mono/multi**

**Condition** : Si `$PROJECT_TYPE` n'est pas déjà défini (cas rare, normalement défini dans plan-beginning)

```bash
if [ -z "$PROJECT_TYPE" ]; then
  echo "⚠️  Variable PROJECT_TYPE non définie, détection automatique..."
  DETECT_SCRIPT="prompts/hard_points/system/maj/scripts/detect-project-type.sh"

  # Exécuter le script technique (un des 4 autorisés)
  DETECT_OUTPUT=$("$DETECT_SCRIPT" detect)
  PROJECT_TYPE=$(echo "$DETECT_OUTPUT" | head -1)

  echo "✅ Type détecté : $PROJECT_TYPE"
  export PROJECT_TYPE
fi
```

**Résultat** :
- ✅ `$PROJECT_TYPE` est maintenant défini (MONO ou MULTI)
- Continuer vers phase 2

---

### 2️⃣ Phase 2.A : Génération Index MONO-PROJET

**Condition** : Exécuter **UNIQUEMENT SI** `$PROJECT_TYPE = "MONO"`

**Action : Créer ou mettre à jour `/prompts/index.md` pour mono-projet**

```bash
if [ "$PROJECT_TYPE" = "MONO" ]; then
  bash prompts/hard_points/system/maj/scripts/ending-3-generate-mono-index.sh "$SOURCE"
fi
```

Ce script génère ou met à jour l'index mono-projet V1.3.
- **Sortie** : `$SOURCE/prompts/index.md`
- **Fonctions** : Vérifie existence, crée/met à jour selon version, backup si nécessaire
- **Exit code** : 0 si succès, 1 si échec (BLOQUANT)

**Passer à Phase 3 (validation)**

---

### 2️⃣ Phase 2.B : Génération Index MULTI-PROJET

**Condition** : Exécuter **UNIQUEMENT SI** `$PROJECT_TYPE = "MULTI"`

**Action : Créer structure d'index à 3 niveaux pour multi-projet**

```bash
if [ "$PROJECT_TYPE" = "MULTI" ]; then
  bash prompts/hard_points/system/maj/scripts/ending-3-generate-multi-index.sh "$SOURCE"
fi
```

Ce script génère la structure complète d'index multi-projet :
- **Index global** : `$SOURCE/prompts/index.md` (liste des projets)
- **Index projets** : `$SOURCE/prompts/{projet}/index.md` (un par projet)
- **Fonctions** : Détecte projets, génère index à 3 niveaux, journalise
- **Exit code** : 0 si succès, 1 si échec (BLOQUANT)

**Passer à Phase 3 (validation)**

---

### 3️⃣ Phase 3 : Validation des Index Créés

**Action : Vérifier que tous les fichiers d'index existent**

```bash
bash prompts/hard_points/system/maj/scripts/ending-3-validate-indexes.sh "$SOURCE" "$PROJECT_TYPE"
```

Ce script valide l'existence et conformité des index créés.
- **Fonction** : Vérifie index selon type (MONO ou MULTI)
- **MONO** : Vérifie `prompts/index.md`
- **MULTI** : Vérifie index global + tous les index projets
- **Exit code** : 0 si OK, 1 si index manquant (BLOQUANT)

---

## 📤 Sorties Produites

### Pour MONO-PROJET :
- `$SOURCE/prompts/index.md` : Point d'entrée unifié V1.3
- `$SOURCE/prompts/spec/logs/phase-3.log` : Log de génération

### Pour MULTI-PROJET :
- `$SOURCE/prompts/index.md` : Index global avec liens vers tous les projets
- `$SOURCE/prompts/{projet}/index.md` : Index intermédiaire pour chaque projet
- `$SOURCE/prompts/spec/logs/phase-3.log` : Log de génération

---

## ✅ Conditions de Succès

Le plan **ending-3** est considéré réussi si :

**Pour MONO-PROJET** :
1. ✅ `$SOURCE/prompts/index.md` existe
2. ✅ Le fichier contient la version 1.3
3. ✅ Le log de phase-3 est créé

**Pour MULTI-PROJET** :
1. ✅ `$SOURCE/prompts/index.md` (global) existe
2. ✅ Tous les `$SOURCE/prompts/{projet}/index.md` existent
3. ✅ Chaque index contient les liens corrects
4. ✅ Le log de phase-3 est créé

---

## ❌ Gestion d'Échec

Si la validation échoue (phase 3) :

1. **Afficher l'erreur précise** (quel fichier manque)
2. **Recommander action** :
   - Vérifier les permissions du répertoire `prompts/`
   - Vérifier que les projets détectés existent réellement
3. **Passer au plan ending-10** (gestion erreurs centralisée)
4. **NE PAS continuer** vers ending-4

**Exemple de message d'échec** :
```
❌ ERREUR CRITIQUE : Plan ending-3 échoué

Type : MULTI-PROJET
Problème : Index projet manquant après génération

Détails :
  ✅ Index global : /prompts/index.md (OK)
  ❌ Index projet  : /prompts/projet-backend/index.md (MANQUANT)
  ✅ Index projet  : /prompts/projet-frontend/index.md (OK)

Action requise :
  1. Vérifier que le répertoire existe : ls -la prompts/projet-backend/
  2. Vérifier les permissions : ls -la prompts/
  3. Relancer : /maj-aikido

Passage au plan ending-10 pour diagnostic approfondi...
```

---

## 🔗 Enchaînement

Une fois ce plan réussi :
- ✅ Les index sont à jour et conformes V1.3
- ✅ Passage au **plan ending-4** (validation structure complète)

---

## 📚 Références

- **Script détection projet** : [`prompts/hard_points/system/maj/scripts/detect-project-type.sh`](../scripts/detect-project-type.sh)
- **Format index V1.3** : [`prompts/index.md`](../../../../index.md)
- **Hard points AI-KIDO** : [`prompts/hard_points/ai-kido.md`](../../ai-kido.md)

---

*Plan ending-3 v2.0 – Génération index par prompts d'action sans scripts manquants*
