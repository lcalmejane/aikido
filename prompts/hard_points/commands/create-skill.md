---
description: "Guide interactif pour créer un squelette de Skill AI-KIDO complet"
---

# Commande Create-Skill

**IMPORTANT** : Exécution DIRECTE par le LLM — ❌ pas de script bash ✅ `ask_followup_question` + `write_to_file`

Un **Skill** est un module de capacité packagé dans `prompts/hard_points/system/[nom-skill]/` avec progressive disclosure 3 niveaux (métadonnées ~100 tokens / instructions <5k / ressources à la demande).
**Référence** : [`Skills.md`](prompts/hard_points/system/Skills.md)

---

## Exécution IMMÉDIATE

### Étape 0 : Vérification des commandes existantes

Scanner les 3 sources de commandes pour détecter un doublon fonctionnel :

```bash
# AI-KIDO
find prompts/hard_points/commands -name "*.md" | while read f; do
  NAME=$(basename "$f" .md)
  DESC=$(grep -m1 '^description:' "$f" | sed 's/description:[[:space:]]*//' | tr -d '"')
  [ -z "$DESC" ] && DESC=$(grep -m1 '^#' "$f" | sed 's/^#[[:space:]]*//')
  echo "  [AIKIDO] $NAME : $DESC"
done
# Roo
find .roo -name "*.md" 2>/dev/null | while read f; do echo "  [ROO] $(basename "$f" .md) : $(grep -m1 '^#' "$f" | sed 's/^#[[:space:]]*/')"; done
# Claude
find .claude -name "*.md" 2>/dev/null | while read f; do echo "  [CLAUDE] $(basename "$f" .md) : $(grep -m1 '^#' "$f" | sed 's/^#[[:space:]]*/')"; done
```

Afficher la synthèse, puis **`ask_followup_question`** :
> "Une commande existante couvre-t-elle déjà ce besoin ?"
- `"Non – créer un nouveau Skill"`
- `"Oui – packager la commande [NOM] en Skill"`
- `"Incertain – montrer les détails de [NOM]"`
- `"Oui, mais à étendre – créer un Skill basé dessus"`

**Si packaging** : `read_file` sur la commande source → pré-remplir `SKILL_NAME`, `SKILL_DESC`, `SKILL_INSTRUCTIONS`, `SOURCE_COMMAND` → reprendre à l'**Étape 2** avec ces valeurs comme suggestions.

---

### Étape 1 : Inventaire des Skills existants

```bash
find prompts/hard_points/system -name "SKILL.md" | while read f; do
  NAME=$(basename "$(dirname "$f")")
  DESC=$(grep -m1 '^## Description' -A1 "$f" | tail -1 | sed 's/^[[:space:]]*//')
  echo "  - $NAME : $DESC"
done
```

Afficher la liste + `📋 Référence : skills_list.md`

---

### Étape 2 : Nom du Skill (`ask_followup_question`)

> "Quel est le nom du Skill ? (kebab-case)"

Suggestions : `code-review` / `deploy-check` / `doc-generator` / `test-runner`

Valider unicité (`prompts/hard_points/system/[nom]` inexistant). Si conflit → proposer `[nom]-v2`.
**Enregistrer** : `SKILL_NAME`

---

### Étape 3 : Description (`ask_followup_question`)

> "Décrivez en une phrase ce que fait ce Skill."

**Enregistrer** : `SKILL_DESC`

---

### Étape 4 : Catégorie (`ask_followup_question`)

> "Catégorie du Skill ?"

Suggestions : `analyse / compréhension` / `génération / création` / `validation / vérification` / `recherche / exploration`

**Enregistrer** : `SKILL_CATEGORY`

---

### Étape 5 : Instructions principales (`ask_followup_question`)

> "Décrivez les étapes d'exécution (liste numérotée)."

**Enregistrer** : `SKILL_INSTRUCTIONS`

---

### Étape 6 : Format de sortie (`ask_followup_question`)

> "Quel format de sortie ?"

Suggestions : `JSON {status, result, summary, details}` / `Markdown {Résumé, Détails, Recommandations}` / `JSON {matches[], summary, total_count}` / `Texte brut UTF-8`

**Enregistrer** : `SKILL_OUTPUT`

---

### Étape 7 : Ressources (`ask_followup_question`)

> "Dépendances ou bibliothèques ? (optionnel)"

Suggestions : `Aucune` / `Bash POSIX` / `Python stdlib` / `Python NLP (nltk, spacy)`

**Enregistrer** : `SKILL_RESOURCES`

---

### Étape 8 : Agents associés (`ask_followup_question`)

> "Quels agents AI-KIDO sont liés à ce Skill ? (optionnel)"

Suggestions : `explore-bank` / `explore-code` / `bank-populate` / `Aucun`

**Enregistrer** : `SKILL_AGENTS`

---

### Étape 9 : Fichiers optionnels (`ask_followup_question`)

> "Quels fichiers optionnels générer ?"

Suggestions :
- `SKILL.md uniquement`
- `SKILL.md + references/`
- `SKILL.md + examples/`
- `SKILL.md + references/ + examples/ + documentation/`

**Enregistrer** : `SKILL_WITH_REFERENCE` / `SKILL_WITH_EXAMPLES` / `SKILL_WITH_SCRIPTS` / `SKILL_WITH_TEMPLATES` / `SKILL_WITH_DOCUMENTATION`

---

### Étape 10 : Génération des fichiers

Afficher le récapitulatif puis créer :

#### 10.1 `SKILL.md` — OBLIGATOIRE (`write_to_file`)

```markdown
# [Nom formaté] – Skill interne d'AI‑KIDO

## Description
[SKILL_DESC]

## Métadonnées
```yaml
nom: "[SKILL_NAME]"
version: "1.0.0"
auteur: "AI‑KIDO Team"
catégorie: "[SKILL_CATEGORY]"
tokens_métadonnées: ~100
[Si SOURCE_COMMAND] source_command: "[SOURCE_COMMAND]"
```

## Instructions (niveau 2)
1. [Étape 1 – depuis SKILL_INSTRUCTIONS]
2. [Étape 2]
3. [Étape 3]
4. Retourner un résultat structuré :
   ```[json|markdown|text]
   [SKILL_OUTPUT]
   ```

## Ressources (niveau 3)
[SKILL_RESOURCES]
[Si references]    - `references/` – Documentation de référence
[Si examples]      - `examples/` – Exemples d'usage
[Si scripts]       - `scripts/` – Scripts utilitaires
[Si templates]     - `templates/` – Modèles
[Si documentation] - `documentation/documentation.md` – Documentation détaillée

## Utilisation
Claude invoque ce Skill lorsqu'une requête [décrire le déclenchement].
Progressive disclosure : métadonnées → instructions → ressources à la demande.

## Remarques
- Stateless : chaque appel est indépendant.
- Résultats renvoyés en UTF‑8.

## Agents Aikido associés
[Pour chaque SKILL_AGENTS] - `[agent-slug]` – [rôle lié à ce Skill]
```

#### 10.2 `references/README.md` (si demandé)

Sections : Vue d'ensemble / Paramètres d'entrée (tableau) / Format de sortie / Contraintes / Voir aussi

#### 10.3 `examples/README.md` (si demandé)

2 exemples minimum : Entrée + Sortie attendue par cas d'usage

#### 10.4 `scripts/helper.sh` (si demandé)

Script bash `set -euo pipefail` avec fonction `main()` et TODO logique principale

#### 10.5 `templates/template.txt` (si demandé)

Template avec sections `[SECTION_N]` et variables `{{VARIABLE_N}}`

#### 10.6 `documentation/documentation.md` (si demandé)

Sections : Architecture / Flux Mermaid / Décisions de conception / Limitations / Historique versions

---

### Étape 11 : Mise à jour `skills_list.md` (`apply_diff`)

```markdown
- **[SKILL_NAME]** – [SKILL_DESC] – [`prompts/hard_points/system/[SKILL_NAME]/SKILL.md`](prompts/hard_points/system/[SKILL_NAME]/SKILL.md)
```

Insérer en ordre alphabétique.

---

### Étape 12 : Rapport final (`attempt_completion`)

```
✅ Skill "[SKILL_NAME]" créé | Catégorie: [SKILL_CATEGORY] | v1.0.0 | Stateless

📁 Fichiers créés : SKILL.md [+ references/] [+ examples/] [+ scripts/] [+ templates/] [+ documentation/]
📄 Mis à jour : skills_list.md

🚀 NEXT STEPS
1. Compléter SKILL.md avec l'implémentation réelle
2. Enrichir references/ et examples/ si créés
3. /create-persona → lier les agents associés
4. /analyse-aikido → valider la conformité
```

---

## Référence rapide

| Erreur | Action |
|--------|--------|
| Nom invalide (pas kebab-case) | Correction automatique proposée |
| Skill déjà existant | Proposer `[nom]-v2` ou annuler |
| Description vide | Redemander avec exemples |
| Erreur écriture | Signaler et proposer retry |

**Intégration** : `/create-persona` → `/create-command` → `/analyse-aikido` → `/reindex-projet`
