---
description: "Guide interactif pour créer un squelette de Skill AI-KIDO complet"
---

# Commande `create-skill`

**Paradigme** : Exécution DIRECTE par le LLM — ❌ script bash · ✅ `ask_followup_question` + `write_to_file`  
**Référence Skill** : [`Skills.md`](prompts/hard_points/system/Skills.md) · Structure : `prompts/hard_points/system/{slug}/` · Progressive disclosure 3 niveaux (~100 tokens métadonnées / <5k instructions / ressources à la demande)

## Pipeline

### Étape 0 — Détection Doublons

Scanner les 3 sources et afficher la synthèse :
```bash
find prompts/hard_points/commands -name "*.md" | while read f; do
  NAME=$(basename "$f" .md)
  DESC=$(grep -m1 '^description:' "$f" | sed 's/description:[[:space:]]*//' | tr -d '"')
  [ -z "$DESC" ] && DESC=$(grep -m1 '^#' "$f" | sed 's/^#[[:space:]]*//')
  echo "  [AIKIDO] $NAME : $DESC"
done
find .roo -name "*.md" 2>/dev/null | while read f; do echo "  [ROO] $(basename "$f" .md) : $(grep -m1 '^#' "$f" | sed 's/^#[[:space:]]*/')"; done
find .claude -name "*.md" 2>/dev/null | while read f; do echo "  [CLAUDE] $(basename "$f" .md) : $(grep -m1 '^#' "$f" | sed 's/^#[[:space:]]*/')"; done
```

`ask_followup_question` : `1. Non — nouveau Skill` · `2. Oui — packager [NOM]` · `3. Incertain — détails [NOM]` · `4. Étendre [NOM]`  
Si packaging → `read_file` source → pré-remplir `SKILL_NAME/DESC/INSTRUCTIONS/SOURCE_COMMAND` → **sauter à Étape 2**

### Étape 1 — Inventaire Skills Existants

```bash
find prompts/hard_points/system -name "SKILL.md" | while read f; do
  echo "  - $(basename $(dirname $f)) : $(grep -m1 '^## Description' -A1 "$f" | tail -1 | sed 's/^[[:space:]]*//')"
done
```
Afficher liste + `📋 Référence : skills_list.md`

### Étapes 2–8 — Questionnaire (`ask_followup_question`)

| Étape | Question | Suggestions | Variable |
|-------|----------|-------------|----------|
| 2 | Nom du Skill ? (kebab-case) | `code-review` · `deploy-check` · `doc-generator` · `test-runner` | `SKILL_NAME` |
| 3 | Description en une phrase | *(libre)* | `SKILL_DESC` |
| 4 | Catégorie ? | `analyse/compréhension` · `génération/création` · `validation/vérification` · `recherche/exploration` | `SKILL_CATEGORY` |
| 5 | Étapes d'exécution (liste numérotée) | *(libre)* | `SKILL_INSTRUCTIONS` |
| 6 | Format de sortie ? | `JSON {status,result,summary,details}` · `Markdown {Résumé,Détails,Recommandations}` · `JSON {matches[],summary,total_count}` · `Texte brut UTF-8` | `SKILL_OUTPUT` |
| 7 | Dépendances/bibliothèques ? | `Aucune` · `Bash POSIX` · `Python stdlib` · `Python NLP (nltk,spacy)` | `SKILL_RESOURCES` |
| 8 | Agents AI-KIDO associés ? | `explore-bank` · `explore-code` · `bank-populate` · `Aucun` | `SKILL_AGENTS` |

Étape 2 : valider unicité (`prompts/hard_points/system/{SKILL_NAME}` inexistant) · conflit → proposer `{nom}-v2`

### Étape 9 — Fichiers Optionnels (`ask_followup_question`)

`1. SKILL.md uniquement` · `2. + references/` · `3. + examples/` · `4. Tout (references/ + examples/ + scripts/ + templates/ + documentation/)`  
→ Variables booléennes : `WITH_REF` · `WITH_EX` · `WITH_SCRIPTS` · `WITH_TPL` · `WITH_DOC`

### Étape 10 — Génération (`write_to_file`)

Afficher récapitulatif puis créer :

**10.1 `SKILL.md`** — OBLIGATOIRE
```markdown
# {Nom formaté} – Skill interne d'AI‑KIDO

## Description
{SKILL_DESC}

## Métadonnées
```yaml
nom: "{SKILL_NAME}"
version: "1.0.0"
auteur: "AI‑KIDO Team"
catégorie: "{SKILL_CATEGORY}"
tokens_métadonnées: ~100
{Si SOURCE_COMMAND → source_command: "{SOURCE_COMMAND}"}
```

## Instructions (niveau 2)
{SKILL_INSTRUCTIONS numérotées}
4. Retourner :
   ```{json|markdown|text}
   {SKILL_OUTPUT}
   ```

## Ressources (niveau 3)
{SKILL_RESOURCES}
{WITH_REF → - `references/` – Documentation de référence}
{WITH_EX  → - `examples/`   – Exemples d'usage}
{WITH_SCRIPTS → - `scripts/` – Scripts utilitaires}
{WITH_TPL → - `templates/`  – Modèles}
{WITH_DOC → - `documentation/documentation.md` – Documentation détaillée}

## Utilisation
Claude invoque ce Skill lorsqu'une requête {déclencheur}.
Progressive disclosure : métadonnées → instructions → ressources à la demande.

## Remarques
- Stateless : chaque appel est indépendant.
- Résultats renvoyés en UTF‑8.

## Agents Aikido associés
{Pour chaque SKILL_AGENTS → - `{slug}` – {rôle}}
```

**10.2** `references/README.md` *(si `WITH_REF`)* — Sections : Vue d'ensemble / Paramètres entrée (tableau) / Format sortie / Contraintes / Voir aussi  
**10.3** `examples/README.md` *(si `WITH_EX`)* — 2 exemples minimum : Entrée + Sortie attendue par cas d'usage  
**10.4** `scripts/helper.sh` *(si `WITH_SCRIPTS`)* — `set -euo pipefail` + `main()` + TODO logique  
**10.5** `templates/template.txt` *(si `WITH_TPL`)* — Sections `[SECTION_N]` + variables `{{VARIABLE_N}}`  
**10.6** `documentation/documentation.md` *(si `WITH_DOC`)* — Architecture / Flux Mermaid / Décisions / Limitations / Historique

### Étape 11 — Enregistrement (`apply_diff`)

Ajouter dans `skills_list.md` (ordre alphabétique) :
```markdown
- **{SKILL_NAME}** – {SKILL_DESC} – [`prompts/hard_points/system/{SKILL_NAME}/SKILL.md`](prompts/hard_points/system/{SKILL_NAME}/SKILL.md)
```

### Étape 12 — Rapport Final (`attempt_completion`)

```
✅ Skill "{SKILL_NAME}" créé | Catégorie: {SKILL_CATEGORY} | v1.0.0 | Stateless

📁 Créés : SKILL.md {+ references/} {+ examples/} {+ scripts/} {+ templates/} {+ documentation/}
📄 MAJ   : skills_list.md

🚀 NEXT : compléter SKILL.md → /create-persona (agents) → /analyse-aikido (conformité)
```

## Référence Rapide

| Erreur | Action |
|--------|--------|
| Nom invalide (pas kebab-case) | Correction automatique proposée |
| Skill déjà existant | Proposer `{nom}-v2` ou annuler |
| Description vide | Redemander avec exemples |
| Erreur écriture | Signaler + retry |

**Intégration** : `/skill-manage search` (vérifier avant création) → `/create-skill` → `/create-persona` → `/create-command` → `/analyse-aikido` → `/reindex-projet`
