---
description: "Guide interactif pour créer des commandes AI-KIDO"
---

# Commande Create-Command

Guide interactif pour la création de nouvelles commandes AI-KIDO avec détection de doublons, intégration d'agents experts (personas non-internes), références aux meilleures pratiques de la Memory Bank, et optimisation maximale via agents AI-KIDO internes.

## Objectif

**Créer des commandes AI-KIDO de qualité** en :
- Détectant les commandes similaires existantes (éviter doublons)
- Intégrant les agents experts pertinents (personas non-internes)
- Référençant les meilleures pratiques de la Memory Bank
- Optimisant avec agents AI-KIDO internes et tools disponibles
- Respectant toutes les normes AI-KIDO (≤1000 lignes pour commandes)
- Intégrant automatiquement dans commands_list.md (agent-aikido-maj-md-index), CLAUDE.md (sections 1 et 12), README.md (si section détectée)

## Syntaxe

```bash
# Mode interactif (recommandé)
/create-command

# Mode avec description initiale
/create-command "Description de la commande à créer"

# Mode verbose
/create-command --verbose
```

## Exécution

### Phase 0 : Collecte des Informations Initiales

**Questionnaire interactif** :

```markdown
🎯 CRÉATION DE COMMANDE AI-KIDO

Bienvenue dans l'assistant de création de commandes AI-KIDO !
Je vais vous guider pour créer une commande optimisée.

**Question 1 : Nom de la commande**
Quel nom souhaitez-vous donner à cette commande ?
Format : kebab-case (ex: analyse-project, check-truth)
Convention : verbe-action ou verbe-objet

Nom : _____

**Question 2 : Description courte (1 ligne)**
Décrivez en une phrase l'objectif de cette commande.
Cette description apparaîtra dans le front-matter YAML.

Description : _____

**Question 3 : Spécification détaillée**
Décrivez en détail ce que doit faire cette commande :
- Quel est le problème résolu ?
- Quelles sont les entrées attendues ?
- Quelles sont les sorties produites ?
- Quels sont les cas d'usage principaux ?

Spécification (appuyez sur ENTER deux fois pour terminer) :
_____
_____
```

**Enregistrement des réponses** :
```markdown
📋 INFORMATIONS COLLECTÉES

Nom : [nom-commande]
Description : [description courte]
Spécification :
[spécification détaillée multi-lignes]
```

### Phase 1 : Détection Commandes Similaires (Grep Rapide)

**Rechercher rapidement avec Grep** les commandes similaires ou liées :

```bash
# Extraire keywords depuis nom + description
KEYWORDS=$(echo "[nom-commande] [description]" | tr '[:upper:]' '[:lower:]' | grep -oE '[a-z]{4,}' | head -5)

echo "🔍 DÉTECTION COMMANDES SIMILAIRES (Grep)..."
echo ""
echo "Keywords : $KEYWORDS"
echo ""

# Rechercher dans prompts/hard_points/commands/ par keywords
echo "Recherche dans prompts/hard_points/commands/ :"
SIMILAR_COUNT=0
for kw in $KEYWORDS; do
  MATCHES=$(grep -l -i "$kw" prompts/hard_points/commands/*.md 2>/dev/null | xargs -I{} basename {} .md)
  if [ -n "$MATCHES" ]; then
    echo "  Keyword '$kw' trouvé dans :"
    for match in $MATCHES; do
      DESC=$(grep -m1 '^description:' "prompts/hard_points/commands/$match.md" | sed 's/description: *//; s/"//g' || echo "")
      echo "    - /$match : $DESC"
      ((SIMILAR_COUNT++))
    done
  fi
done

echo ""
echo "Commandes similaires trouvées : $SIMILAR_COUNT"

# Vérifier commands_list.md si déjà listée
if grep -qi "[nom-commande]" agents_list.md 2>/dev/null; then
  echo "⚠️  Commande déjà listée dans agents_list.md !"
fi
```

Afficher résultat :
```
🔍 DÉTECTION COMMANDES SIMILAIRES...

Commandes similaires trouvées : [NOMBRE]

[SI NOMBRE > 0]
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ COMMANDES SIMILAIRES DÉTECTÉES (par keywords)                │
├─────────────────────────────────────────────────────────────────┤
│ [Liste des commandes trouvées]                                  │
└─────────────────────────────────────────────────────────────────┘

**Gain performance** : Grep direct ~0.1s vs agent ~2-3s (20-30× plus rapide), -85% tokens (150 vs 1,000+)

[SI STOP_DOUBLON]
⛔ ATTENTION : Une commande identique existe déjà !
La commande /[nom-existant] fait exactement la même chose.
Voulez-vous :
1. ARRÊTER la création
2. MODIFIER votre commande pour la différencier
3. CONTINUER quand même (créer doublon)

Choix : _____

[SI PROPOSER_FUSION]
💡 SUGGESTION : Fusion possible
Les commandes /[cmd1] et /[cmd2] ont des objectifs proches.
Voulez-vous :
1. FUSIONNER votre commande avec /[cmd-existante]
2. CRÉER une commande SPÉCIALISÉE (précisez différenciation)
3. CRÉER une NOUVELLE commande distincte

Choix : _____

[SI SPÉCIALISATION_OK]
✅ Spécialisation détectée
Votre commande est une SPÉCIALISATION de /[cmd-existante].
Différenciation : [raison]
Continuer la création : O/n

[SI NOUVELLE_OK]
✅ Aucune commande similaire
Votre commande est unique dans le système.
Continuer la création : O/n
```

**Si choix ARRÊTER ou FUSIONNER** → EXIT avec message approprié

**Si MODIFIER** → Retour Phase 0 Question 1-3

**Si CONTINUER/SPÉCIALISATION/NOUVELLE** → Passer Phase 2

### Phase 2 : Identification Agents Experts Pertinents 🤖 (agent-aikido-explore-bank)

**UTILISER L'AGENT** `agent-aikido-explore-bank` (QUICK MODE) pour trouver personas experts :

```markdown
🤖 AGENT: agent-aikido-explore-bank (QUICK MODE)
FORMAT: JSON

**Prompt pour l'agent** :
"Identifier agents experts (personas NON-INTERNES) pertinents pour la commande.

Commande à créer :
- Nom : [nom-commande]
- Description : [description]
- Spécification : [spec complète]

Recherche dans :
- /prompts/gen/personas/ (EXCLURE agents internes 'agent-aikido-*')

Critères de pertinence :
1. **Domaine d'expertise** : Persona spécialisé dans le domaine de la commande
2. **Compétences requises** : Personas ayant les compétences nécessaires
3. **Cas d'usage** : Personas utiles pour les use cases de la commande

Pour chaque persona NON-INTERNE trouvé :
- Nom persona
- Slug
- Spécialisation
- Pertinence : [TRÈS PERTINENT | PERTINENT | POTENTIELLEMENT UTILE]
- Raison pertinence
- Compétences apportées
- Phase recommandée d'utilisation (analyse/validation/génération/etc.)

Retourner :
- Liste personas experts triés par pertinence (TRÈS PERTINENT en premier)
- Recommandation intégration pour chacun

**IMPORTANT** : Ne retourner QUE les personas d'experts métier/technique.
EXCLURE ABSOLUMENT tous les agents internes AI-KIDO (préfixe 'agent-aikido-*').

Tokens estimés : ~3-5k"

**Résultat attendu** : Liste personas experts pertinents
```

Afficher résultat :
```
👥 IDENTIFICATION AGENTS EXPERTS (agent-aikido-explore-bank)...

Personas experts pertinents trouvés : [NOMBRE]

[SI NOMBRE > 0]
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 AGENTS EXPERTS RECOMMANDÉS                                   │
├─────────────────────────────────────────────────────────────────┤
│ 1. [Nom Expert Persona]                                        │
│    Slug : [expert-slug]                                        │
│    Spécialisation : [description]                              │
│    Pertinence : [TRÈS PERTINENT]                              │
│    Raison : [pourquoi pertinent]                              │
│    Compétences : [liste compétences apportées]                │
│    Phase recommandée : [Analyse | Validation | Génération]   │
│                                                                 │
│ 2. [Autre Expert]                                             │
│    [...]                                                       │
└─────────────────────────────────────────────────────────────────┘

Voulez-vous intégrer ces agents experts dans votre commande ?

Pour chaque agent, sélectionnez :
1. [expert-slug-1] : [O/n] _____
2. [expert-slug-2] : [O/n] _____
3. [expert-slug-3] : [O/n] _____

[SI NOMBRE = 0]
ℹ️ Aucun agent expert spécifique trouvé
Votre commande utilisera uniquement les agents AI-KIDO internes.
Continuer : O/n
```

**Enregistrer agents sélectionnés** :
```markdown
👥 AGENTS EXPERTS SÉLECTIONNÉS : [NOMBRE]

[Pour chaque agent sélectionné]
- [expert-slug] : [raison intégration] (Phase : [X])
```

### Phase 3 : Identification Ressources Memory Bank 🤖 (agent-aikido-explore-bank)

**UTILISER L'AGENT** `agent-aikido-explore-bank` (DEEP MODE) pour ressources pertinentes :

```markdown
🤖 AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

**Prompt pour l'agent** :
"Identifier ressources Memory Bank pertinentes pour la commande.

Commande à créer :
- Nom : [nom-commande]
- Description : [description]
- Spécification : [spec complète]
- Agents experts sélectionnés : [liste]

Recherche dans :
1. **/prompts/gen/concepts/** : Concepts théoriques liés
2. **/prompts/gen/techniques/** : Techniques pratiques applicables
3. **/prompts/gen/use_cases/** : Cas d'usage similaires
4. **/prompts/hard_points/** : Contraintes/règles impératives

Extraction par catégorie :
- **Technologies** : Langages, frameworks, outils mentionnés
- **Patterns** : Patterns architecturaux, design patterns
- **Best Practices** : Bonnes pratiques applicables
- **Contraintes** : Hard points à respecter absolument
- **Use Cases** : Exemples de workflows similaires

Pour chaque ressource trouvée :
- Path complet
- Type (concept/technique/use_case/hard_point)
- Titre
- Pertinence : [CRITIQUE | IMPORTANTE | UTILE | OPTIONNELLE]
- Raison pertinence
- Section à référencer (si applicable)
- Utilisation recommandée (contexte/validation/implémentation/exemples)

Retourner :
- Ressources classées par pertinence et type
- Recommandations d'intégration

Tokens estimés : ~5-10k (DEEP mode)"

**Résultat attendu** : Ressources Memory Bank pertinentes classées
```

Afficher résultat :
```
📚 IDENTIFICATION RESSOURCES MEMORY BANK (agent-aikido-explore-bank DEEP)...

Ressources pertinentes trouvées : [NOMBRE]

┌─────────────────────────────────────────────────────────────────┐
│ 🔒 HARD POINTS (Contraintes Impératives) : [N]                │
├─────────────────────────────────────────────────────────────────┤
│ 1. [hard-point-file.md]                                        │
│    Pertinence : [CRITIQUE]                                     │
│    Contrainte : [description contrainte]                       │
│    Section : [section à respecter]                            │
│                                                                 │
│ [...]                                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📚 CONCEPTS (Théorie) : [N]                                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. [concept-file.md]                                           │
│    Pertinence : [IMPORTANTE]                                   │
│    Concept : [description concept]                            │
│    Utilisation : [comment l'utiliser dans commande]          │
│                                                                 │
│ [...]                                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔧 TECHNIQUES (Pratique) : [N]                                 │
├─────────────────────────────────────────────────────────────────┤
│ 1. [technique-file.md]                                         │
│    Pertinence : [IMPORTANTE]                                   │
│    Technique : [description technique]                        │
│    Application : [comment appliquer dans commande]           │
│                                                                 │
│ [...]                                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 💼 USE CASES (Exemples) : [N]                                 │
├─────────────────────────────────────────────────────────────────┤
│ 1. [use-case-file.md]                                         │
│    Pertinence : [UTILE]                                       │
│    Use Case : [description]                                   │
│    Inspiration : [ce qu'on peut réutiliser]                  │
│                                                                 │
│ [...]                                                          │
└─────────────────────────────────────────────────────────────────┘

Ces ressources seront automatiquement référencées dans la commande.
Continuer : O/n
```

### Phase 4 : Identification Agents AI-KIDO Internes Optimaux (Référence agents_list.md)

**Lister rapidement les 9 agents techniques** depuis agents_list.md :

```bash
echo "🤖 IDENTIFICATION AGENTS AI-KIDO INTERNES..."
echo ""

# Extraire tableau agents depuis agents_list.md
echo "Agents disponibles (depuis agents_list.md) :"
grep -A1 '| 🔍 \*\*explore-bank\*\*\|| ⚖️ \*\*truth-evaluator\*\*\|| 🎯 \*\*raci-delegator\*\*\|| 📝 \*\*doc-header\*\*\|| 🤖 \*\*bank-populate\*\*\|| ✅ \*\*validator\*\*\|| ⚖️ \*\*balancer\*\*\|| 📑 \*\*indexer\*\*\|| 🔀 \*\*fusion\*\*' agents_list.md | head -20

echo ""
echo "Mapping capacités → agents :"
echo "  - Inventaire/exploration Memory Bank → explore-bank (SEULEMENT SI exploratoire)"
echo "  - Validation sources vérité → truth-evaluator"
echo "  - Classification RACI → raci-delegator"
echo "  - Gestion headers → doc-header"
echo "  - Peuplement Memory Bank → bank-populate (FIN UNIQUEMENT)"
echo "  - Validation conformité rapide → validator"
echo "  - Équilibrage arborescence → balancer"
echo "  - Mise à jour indexes → indexer"
echo "  - Fusion intelligente → fusion"
echo ""

# Analyser spécification pour recommander agents
echo "Analyse spécification [nom-commande] :"
echo "  [Lire spec et matcher patterns avec capacités ci-dessus]"
echo ""
echo "Agents recommandés : [LISTE]"
```

Afficher résultat :
```
🤖 IDENTIFICATION AGENTS AI-KIDO INTERNES...

Agents AI-KIDO recommandés : [NOMBRE]

┌─────────────────────────────────────────────────────────────────┐
│ 🔧 WORKFLOW AGENTS AI-KIDO SUGGÉRÉ                            │
├─────────────────────────────────────────────────────────────────┤
│ [Workflow généré depuis mapping capacités ↔ spec]             │
└─────────────────────────────────────────────────────────────────┘

**Gain performance** : Référence agents_list.md directe ~0.05s vs agent ~2-3s (50× plus rapide), -95% tokens (50 vs 1,000+)

Ce workflow sera intégré automatiquement dans la commande.
Continuer : O/n
```

### Phase 5 : Génération Structure Commande 🤖

**Compiler toutes les informations** et générer structure :

```markdown
📝 GÉNÉRATION STRUCTURE COMMANDE

Compilation des informations :
✅ Nom : [nom-commande]
✅ Description : [description]
✅ Spécification : [spec]
✅ Commandes similaires : [liste avec différenciation]
✅ Agents experts : [N] sélectionnés
✅ Ressources Memory Bank : [N] identifiées
✅ Agents AI-KIDO internes : [N] recommandés
✅ Workflow optimisé : [résumé]

Génération en cours...
```

**Structure générée** (template) :

```markdown
---
description: "[description courte]"
---

# Commande [Nom-Commande]

[Description détaillée générée depuis spécification]

## Objectif

[Reformulation objectif depuis spécification]

**Maintenir** :
[Points clés extraits de la spécification]

**Optimisations** :
[Liste optimisations identifiées en Phase 4]

## Syntaxe

\`\`\`bash
# [Usage principal]
/[nom-commande]

# [Variante avec arguments]
/[nom-commande] --[argument] [value]

# Mode verbose
/[nom-commande] --verbose

# Mode dry-run
/[nom-commande] --dry-run
\`\`\`

## Arguments

| Argument | Description | Exemple |
|----------|-------------|---------|
| --[arg1] | [description] | --[arg1] [value] |
| --verbose | Mode détaillé | - |
| --dry-run | Simulation sans modifications | - |

## Référence Ressources Memory Bank

Cette commande s'appuie sur les ressources suivantes de la Memory Bank AI-KIDO :

### Hard Points (Contraintes Impératives)

[Pour chaque hard point identifié en Phase 3]
- **[`[path]`]([path])** : [description contrainte]
  - Respect : [ce qui doit être respecté]

### Concepts Théoriques

[Pour chaque concept identifié en Phase 3]
- **[`[path]`]([path])** : [description concept]
  - Application : [comment appliqué dans la commande]

### Techniques Pratiques

[Pour chaque technique identifiée en Phase 3]
- **[`[path]`]([path])** : [description technique]
  - Utilisation : [comment utilisée dans la commande]

### Use Cases Inspirants

[Pour chaque use case identifié en Phase 3]
- **[`[path]`]([path])** : [description use case]
  - Réutilisation : [ce qui est réutilisé]

## Exécution

[Générer workflow basé sur Phase 4]

### Phase 0 : [Nom Phase]

[Description phase]

**[SI agents experts sélectionnés]**
**UTILISER L'AGENT EXPERT** \`[expert-slug]\` :

\`\`\`markdown
🤖 AGENT EXPERT: [expert-name]

**Prompt pour l'agent** :
"[Contexte pour l'agent expert]

[Tâche spécifique pour l'agent]

Retourner :
[Output attendu]"

**Résultat attendu** : [Description résultat]
\`\`\`

### Phase 1 : [Nom Phase]

**UTILISER L'AGENT** \`agent-aikido-[agent-name]\` :

\`\`\`markdown
🤖 AGENT: agent-aikido-[agent-name]

**Prompt pour l'agent** :
"[Prompt généré depuis workflow Phase 4]

Retourner :
[Output attendu]"

**Résultat attendu** : [Description]
\`\`\`

Afficher en temps réel :
\`\`\`
[Message utilisateur pour cette phase]
...
\`\`\`

[Répéter pour chaque phase du workflow]

## 🤖 Agents Utilisés

Cette commande utilise **[N] agents** pour optimisation maximale :

### Agents Experts (Personas Métier/Technique)

[Pour chaque agent expert sélectionné en Phase 2]
#### [Nom Expert]
- **Rôle** : [Spécialisation]
- **Phase** : [Quand utilisé]
- **Apport** : [Compétences apportées]
- **Tokens** : ~[X]k

### Agents AI-KIDO Internes

[Pour chaque agent AI-KIDO de Phase 4]
#### [Nom Agent]
- **Rôle** : [Description rôle]
- **Phase** : [Quand utilisé]
- **Input** : [Input]
- **Output** : [Output]
- **Tokens** : ~[X]k

### 📊 Gains d'Optimisation Estimés

| Aspect | Sans Optimisation | Avec Agents | Gain |
|--------|-------------------|-------------|------|
| [Aspect 1] | [valeur] | [valeur optimisée] | [%] |
| [Aspect 2] | [valeur] | [valeur optimisée] | [%] |
| **TOTAL** | ~[X]k tokens | ~[Y]k tokens | **[Z]% efficacité** |

## Messages de Confirmation

### Succès

\`\`\`
✅ [NOM-COMMANDE] TERMINÉ AVEC SUCCÈS !

[Messages de succès personnalisés]

📄 Rapport : [path si applicable]
\`\`\`

### Avertissements

\`\`\`
⚠️ [WARNINGS]

[Messages d'avertissement personnalisés]
\`\`\`

## Options de Commande

[Options générées selon spécification]

## Gestion des Erreurs

[Erreurs typiques + gestion]

## Règles AI-KIDO Respectées

- ✅ Utilisation agents AI-KIDO ([N] agents orchestrés)
- ✅ Référence ressources Memory Bank
- ✅ Respect hard_points identifiés
- ✅ Intégration agents experts pertinents
- ✅ Optimisation tokens via workflow intelligent
- ✅ Format Markdown avec métadonnées
- ✅ Contrainte ≤1000 lignes pour commandes

## Intégration avec Autres Commandes

Cette commande s'intègre avec :
[Détecter automatiquement commandes liées depuis Phase 1]

**Workflow recommandé** :
[Générer workflow basé sur commandes liées]

---

*Commande créée via /create-command le [DATE]*
*Agents experts : [liste] | Agents AI-KIDO : [liste]*
\`\`\`
```

Afficher :
```
📝 STRUCTURE GÉNÉRÉE

Fichier : prompts/hard_points/commands/[nom-commande].md
Taille : [X] lignes (sur 1000 max) ✅
Agents intégrés : [N_experts + N_aikido]
Ressources référencées : [N]

Prévisualisation :
[Afficher les 50 premières lignes]
[...]

Voulez-vous :
1. VALIDER et créer la commande
2. MODIFIER avant création (retour Phase 0)
3. ANNULER

Choix : _____
```

### Phase 6 : Validation Conformité 🤖 (agent-aikido-validator)

**Si choix 1 (VALIDER)**, valider la commande générée :

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

**Prompt pour l'agent** :
"Valider conformité AI-KIDO du fichier commande généré.

Fichier : prompts/hard_points/commands/[nom-commande].md
Contenu : [contenu complet généré]

Validations :
1. Contrainte lignes : ≤1000 lignes (extended pour commandes)
2. Frontmatter YAML : description présente et valide
3. Format Markdown : structure correcte
4. Références Memory Bank : liens valides
5. Agents référencés : tous existent
6. Cohérence workflow : phases logiques

Retourner :
- Status : [✅ CONFORME | ⚠️ WARNINGS | ❌ NON CONFORME]
- Violations : [liste si applicable]
- Quick fixes : [corrections suggérées]

Tokens estimés : ~1-2k"

**Résultat attendu** : Rapport conformité
```

Afficher :
```
✅ VALIDATION CONFORMITÉ (agent-aikido-validator)...

Status : [✅ CONFORME]

Validations :
✅ Contrainte lignes : [X]/1000 lignes
✅ Frontmatter YAML : Valide
✅ Format Markdown : Conforme
✅ Références Memory Bank : [N] liens valides
✅ Agents référencés : [N] agents, tous existent
✅ Cohérence workflow : Logique validée

[SI WARNINGS]
⚠️ Warnings :
- [Warning 1]
- [Warning 2]

Corrections appliquées automatiquement.

[SI NON CONFORME]
❌ Violations critiques :
- [Violation 1]
- [Violation 2]

Voulez-vous appliquer les quick fixes ? O/n
```

**Si CONFORME ou WARNINGS corrigés** → Passer Phase 7

**Si NON CONFORME et refus fixes** → Retour Phase 5 ou ANNULER

### Phase 7 : Création Fichiers

**Créer les fichiers** :

```markdown
📝 CRÉATION FICHIERS

1. Fichier principal : prompts/hard_points/commands/[nom-commande].md
   Status : [✅ CRÉÉ]

2. Mapping Claude Code : .roo/commands/[nom-commande].md
   Status : [✅ CRÉÉ]
   Contenu : Référence dynamique vers prompts/hard_points/commands/

3. Mapping Claude Code : .claude/commands/[nom-commande].md
   Status : [✅ CRÉÉ]
   Contenu : Référence dynamique vers prompts/hard_points/commands/
```

**Template mapping Command (Roo et Claude)** :
```markdown
---
description: "[description courte]"
---

# Commande [nom-commande]

Cette commande exécute le fichier de commande complet depuis \`prompts/hard_points/commands/[nom-commande].md\`.

**EXÉCUTION** : Je vais maintenant lire et exécuter la commande complète.

\`\`\`
Lecture de prompts/hard_points/commands/[nom-commande].md et exécution des instructions...
\`\`\`
```

### Phase 8 : Intégration Documentation 🤖 (agent-aikido-maj-md-index)

**UTILISER L'AGENT** `agent-aikido-maj-md-index` pour mise à jour automatique :

```markdown
🤖 AGENT: agent-aikido-maj-md-index
FORMAT: JSON

**Prompt pour l'agent** :
"Mettre à jour commands_list.md avec la nouvelle commande.

Nouvelle commande :
- Nom : [nom-commande]
- Description : [description]
- Agents utilisés : [liste agents experts + AI-KIDO]
- Tokens estimés : ~[X]k

Actions :
1. Lire commands_list.md section 'Commandes optimisées avec agents'
2. Ajouter ligne :
   - \`/[nom-commande]\` 🆕 ([N] agents) : [agents-liste] + [description courte]
3. Incrémenter compteur total commandes
4. Recalculer % optimisées agents
5. Mettre à jour section 'État Actuel'
6. Ajouter dans section 'Workflows Principaux' si pattern nouveau

Retourner :
- commands_list.md mis à jour
- Statistiques actualisées

Tokens estimés : ~1k"

**Résultat attendu** : commands_list.md actualisé
```

**MISE À JOUR CLAUDE.md** :

```markdown
📝 MISE À JOUR CLAUDE.md

Actions :
1. Lire CLAUDE.md section 1 'Commands Spécifiques AI-KIDO' (ligne ~78-79)
2. Ajouter /[nom-commande] dans la liste des commandes
3. Mettre à jour section 12 'État Actuel de la Memory Bank' :
   - MAJ date : [DATE actuelle]
   - Incrémenter compteur **Commandes** : [N] → [N+1]
   - Mettre à jour conformité si nécessaire
4. Mettre à jour section 12 'Équivalence CLAUDE.md' :
   - **Commands** : [N] → [N+1]
5. Vérifier cohérence avec commands_list.md (même nombre de commandes)

Sections modifiées :
✅ Section 1 (ligne ~79) : Ajout /[nom-commande] dans liste
✅ Section 12 (ligne ~398) : Date MAJ mise à jour
✅ Section 12 (ligne ~409) : Compteur commandes incrémenté
✅ Section 12 (ligne ~427) : Équivalence CLAUDE.md mise à jour

Status : ✅ CLAUDE.md MIS À JOUR
```

**VÉRIFICATION README.md** :

```markdown
📝 VÉRIFICATION README.md

Analyse README.md pour détecter section commandes...

[SI section commandes détectée]
Section trouvée : [Nom section]
Format : [Liste à puces | Tableau | Autre]

Ajout recommandé :
[Format détecté avec /[nom-commande] ajoutée]

Voulez-vous mettre à jour le README.md ? O/n

[SI oui]
✅ README.md mis à jour

[SI non]
ℹ️ README.md non modifié (manuel nécessaire)

[SI section NON détectée]
ℹ️ Aucune section commandes détectée dans README.md
Le README ne référence pas les commandes du projet.
Mise à jour manuelle recommandée si nécessaire.
```

### Phase 9 : Rapport Final et Next Steps

**Générer rapport final** :

```markdown
✅ COMMANDE CRÉÉE AVEC SUCCÈS !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📝 COMMANDE : /[nom-commande]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Informations
├─ Description : [description]
├─ Taille : [X]/1000 lignes ✅
├─ Conformité AI-KIDO : ✅ 100%
└─ Date création : [DATE TIME]

👥 Agents Intégrés ([N_total] agents)
├─ Agents Experts : [N_experts]
│  [Pour chaque agent expert]
│  ├─ [expert-name] ([phase])
│  └─ [...]
│
└─ Agents AI-KIDO : [N_aikido]
   [Pour chaque agent AI-KIDO]
   ├─ agent-aikido-[name] ([phase])
   └─ [...]

📚 Ressources Memory Bank ([N] ressources)
├─ Hard Points : [N]
├─ Concepts : [N]
├─ Techniques : [N]
└─ Use Cases : [N]

⚡ Performance Estimée
├─ Tokens estimés : ~[X]k
├─ Optimisation : [Y]% vs approche naïve
└─ Workflow : [N] phases orchestrées

📁 Fichiers Créés
├─ ✅ prompts/hard_points/commands/[nom-commande].md
├─ ✅ .claude/commands/[nom-commande].md
├─ ✅ commands_list.md (mis à jour)
├─ ✅ CLAUDE.md (mis à jour - sections 1 & 12)
└─ [Si section détectée] README.md (mis à jour)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 NEXT STEPS

1. **Tester la commande** :
   \`\`\`bash
   /[nom-commande] --dry-run
   \`\`\`

2. **Relancer Claude Code** (si applicable) :
   Fermez et rouvrez pour détecter la nouvelle commande via /list

3. **Documenter use case** (optionnel) :
   Créer un fichier dans /prompts/gen/use_cases/ avec exemple d'utilisation

4. **Partager avec l'équipe** :
   La commande est prête à être utilisée !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 La commande /[nom-commande] est maintenant disponible !
   Tapez /[nom-commande] pour l'utiliser.
```

## Options de Commande

### Mode Standard
```bash
/create-command
```
Mode interactif complet guidé.

### Mode avec Description Initiale
```bash
/create-command "Analyser les dépendances npm obsolètes"
```
Démarre avec description pré-remplie.

### Mode Verbose
```bash
/create-command --verbose
```
Affiche tous les détails des agents en temps réel.

## Gestion des Erreurs

- **Nom commande invalide** : Proposer format kebab-case correct
- **Description vide** : Redemander description
- **Doublon exact détecté** : Bloquer création, proposer utiliser existante
- **Agent expert introuvable** : Warning, continuer avec agents AI-KIDO seulement
- **Ressource Memory Bank cassée** : Warning, lien marqué comme broken
- **Validation échouée** : Proposer quick fixes ou retour édition
- **Erreur création fichier** : Rollback, signaler erreur système

## 🤖 Agents AI-KIDO Utilisés

Cette commande utilise **4 agents AI-KIDO** pour création optimale :

### Phase 2 : `agent-aikido-explore-bank` (QUICK) ✅
- **Rôle** : Identification agents experts (personas NON-INTERNES)
- **Output** : Liste personas pertinents avec raisons
- **Tokens** : ~3-5k
- **Justification** : Recherche exploratoire personas par expertise

### Phase 3 : `agent-aikido-explore-bank` (DEEP) ✅
- **Rôle** : Identification ressources Memory Bank
- **Output** : Hard points, concepts, techniques, use cases classés
- **Tokens** : ~5-10k
- **Justification** : Cross-référencement 30+ fichiers interconnectés

### Phase 6 : `agent-aikido-validator`
- **Rôle** : Validation conformité AI-KIDO
- **Output** : Status conformité + quick fixes
- **Tokens** : ~1-2k

### Phase 8 : `agent-aikido-maj-md-index`
- **Rôle** : Mise à jour commands_list.md automatique
- **Output** : commands_list.md actualisé avec stats
- **Tokens** : ~1k

### 🚀 Optimisations Appliquées

**Phase 1 optimisée** : explore-bank → Grep direct
- Avant : agent ~2-3s, ~2,000 tokens
- Après : Grep ~0.1s, ~150 tokens
- **Gain** : 20-30× plus rapide, -92% tokens

**Phase 4 optimisée** : explore-bank → Référence agents_list.md
- Avant : agent ~2-3s, ~2,000 tokens
- Après : Grep ~0.05s, ~50 tokens
- **Gain** : 50× plus rapide, -97% tokens

### 📊 Performance Totale

**Tokens utilisés** : ~10-18k (vs 15-25k avant, -30% tokens)
**Temps estimé** : 3-7 minutes (vs 5-10min avant, -35% temps)
**Qualité** : Commande optimisée avec agents + ressources + conformité

## Règles AI-KIDO Respectées

- ✅ Détection doublons systématique
- ✅ Intégration agents experts pertinents (personas métier)
- ✅ Référence ressources Memory Bank (hard points prioritaires)
- ✅ Orchestration agents AI-KIDO internes optimale
- ✅ Validation conformité automatique (≤1000 lignes)
- ✅ Intégration documentation automatique (commands_list.md via agent-aikido-maj-md-index, CLAUDE.md sections 1 & 12, README.md si applicable)
- ✅ Format Markdown standardisé
- ✅ Workflow interactif guidé

## Intégration avec Autres Commandes

Cette commande s'intègre avec :
- `/check-claude` : Vérifier synchronisation après création
- `/analyse-aikido` : Audit conformité de la nouvelle commande
- `/optimize-command-with-aikido-agents` : Optimiser commande créée
- `/create-persona` : Créer agents experts manquants

**Workflow recommandé** :
1. `/create-command` → Créer nouvelle commande guidée
2. `/[nouvelle-commande] --dry-run` → Tester
3. `/check-claude` → Vérifier intégration
4. `/analyse-aikido` → Audit conformité

---

*Commande créée pour faciliter la création de commandes AI-KIDO optimisées*
*Agents : 6 agents AI-KIDO + agents experts intégrables*
