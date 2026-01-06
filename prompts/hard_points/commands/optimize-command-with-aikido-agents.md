---
description: "Analyse et optimise les commandes AI-KIDO avec les agents techniques disponibles"
---

# Commande Optimize-Command-With-Aikido-Agents

Analyse automatiquement toutes les commandes AI-KIDO pour identifier les opportunités d'optimisation avec les agents techniques spécialisés disponibles, puis propose et applique les optimisations.

## 🎯 Objectif

Maximiser l'utilisation des agents AI-KIDO dans les commandes pour :
- Réduire la consommation de tokens (40-70%)
- Automatiser les tâches répétitives
- Garantir la qualité via validations systématiques
- Standardiser les workflows d'orchestration

## ⚠️ CONTRAINTE CRITIQUE : Préservation Stricte de l'Algorithme

**RÈGLE ABSOLUE** : L'optimisation ne doit **JAMAIS** :
- ❌ Modifier l'algorithme ou la logique métier des commandes
- ❌ Changer les étapes fonctionnelles du workflow
- ❌ Ajouter/supprimer des fonctionnalités
- ❌ Modifier le résultat final attendu
- ❌ Prendre des initiatives sur les fonctions des commandes

**CE QUI EST AUTORISÉ** (substitution pure uniquement) :
- ✅ Remplacer scans manuels répétitifs (grep/glob) par `agent-aikido-explore-bank` **SEULEMENT SI** :
  - Recherche exploratoire (architecture, concepts, multiples fichiers interconnectés)
  - Besoin de contexte structuré avec cross-références
  - Budget permet +89% tokens vs Grep (1,397 vs 740) pour contexte 3-5× plus riche
  - ❌ **NE PAS utiliser** pour recherches simples/ponctuelles (fichier spécifique, ligne unique) → Grep direct préférable
- ✅ Remplacer comparaisons/arbitrages manuels par `agent-aikido-truth-evaluator`
- ✅ Remplacer classifications manuelles par `agent-aikido-raci-delegator`
- ✅ Remplacer vérifications manuelles par `agent-aikido-validator`
- ✅ Remplacer créations manuelles documents par `agent-aikido-bank-populate`

**Principe** : L'optimisation est une **substitution technique transparente** qui produit exactement le même résultat fonctionnel avec moins de tokens.

**⚠️ Critères d'Usage explore-bank** (tests empiriques v5.1 - [rapport](../prompts/spec/docs/rapport-efficacite-claude-explore-bank-v5.1-strict-versus-standard.md)) :
- ✅ **Utiliser** : Recherche exploratoire, architecture, concepts larges (ex: "MCP servers", "experimental features")
- ❌ **Ne PAS utiliser** : Recherche simple (ex: "rooignore.md location"), budget strict, perf critique (<0.05s)

## Exécution Automatique

### Étape 1 : Inventaire Dynamique Agents et Commandes 🤖

**UTILISER L'AGENT** `agent-aikido-explore-bank` pour inventaire complet et analyse :

```markdown
🤖 AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

**Prompt pour l'agent** :
"Analyse complète pour optimisation des commandes AI-KIDO avec agents techniques disponibles.

## PARTIE 1 : Inventaire Agents Techniques Disponibles

Scanner dynamiquement `/prompts/gen/personas/` pour détecter TOUS les agents techniques AI-KIDO :
- Pattern : Fichiers `agent-aikido-*.md` (agents commençant par 'agent-aikido-')
- Exclure : Agents non-techniques, personas consultants standards

Pour chaque agent détecté, extraire :
1. **Nom complet** (slug du fichier)
2. **Spécialisation** (depuis frontmatter ou titre)
3. **Cas d'usage** (section 'Quand l'utiliser')
4. **Capacités clés** (section 'Capabilities')
5. **Patterns détectables** : Identifier automatiquement quels patterns de code manuel cet agent peut remplacer
   - Analyser le prompt système de l'agent
   - Identifier les actions principales (scan, validation, classification, extraction, etc.)
   - Déduire les patterns manuels équivalents (grep répétitifs, comparaisons, etc.)

Retourner tableau :
| Agent | Spécialisation | Patterns remplaçables | Gain estimé |
|-------|----------------|----------------------|-------------|
| agent-aikido-X | [spec] | [patterns] | [gain]% |

## PARTIE 2 : Inventaire Commandes Existantes

Scanner dynamiquement `prompts/hard_points/commands/` :
- Format : Fichiers `.md` uniquement
- Exclure : Fichiers backup (.bak), rapports (reports/)

Pour chaque commande, analyser :
1. **Identification** :
   - Nom (sans .md)
   - Description (frontmatter)
   - Taille (nombre de lignes)

2. **Analyse Agents Actuels** :
   - Rechercher pattern '🤖 AGENT:' ou 'UTILISER L'AGENT'
   - Extraire noms agents utilisés
   - Compter nombre total agents

3. **Détection Opportunités** :
   Pour chaque agent disponible (PARTIE 1), analyser si ses patterns sont présents dans la commande :
   - Identifier sections/phases de la commande
   - Détecter patterns manuels correspondant aux capacités des agents
   - Calculer score opportunité par agent

   **⚠️ CONTRAINTE CRITIQUE** : Ne recommander QUE des substitutions techniques pures :
   - ✅ Remplacer scans/grep répétitifs par explore-bank **SEULEMENT SI EXPLORATOIRE** :
     - ✅ OUI : Recherche architecture, concepts larges, multiples fichiers interconnectés
     - ❌ NON : Recherche simple (fichier/ligne spécifique), budget strict, perf critique
     - Trade-off : +89% tokens (1,397 vs 740) pour contexte 3-5× plus riche (test v5.1)
   - ✅ Remplacer comparaisons manuelles par truth-evaluator
   - ✅ Remplacer classifications manuelles par raci-delegator
   - ✅ Remplacer vérifications manuelles par validator
   - ❌ NE JAMAIS modifier l'algorithme ou la logique métier
   - ❌ NE JAMAIS changer les étapes fonctionnelles
   - ❌ NE JAMAIS ajouter/supprimer des fonctionnalités

## PARTIE 3 : Scoring et Recommandations

Pour chaque commande, calculer :
- **Opportunités détectées** : Nombre de patterns remplaçables
- **Agents recommandés** : Liste agents + phase d'insertion suggérée
- **Gain tokens estimé** : Pourcentage (basé sur patterns détectés)
- **Priorité** :
  - HIGH : ≥3 opportunités ET gain >40%
  - MEDIUM : 2 opportunités OU gain 20-40%
  - LOW : 1 opportunité OU gain <20%
- **Complexité** : FACILE/MOYEN/DIFFICILE (basé sur structure commande)

## RAPPORT FINAL

Retourner structure JSON ou Markdown :

### Résumé Global
- Total agents disponibles : X
- Total commandes analysées : Y
- Total opportunités détectées : Z
- Gain moyen potentiel : W%

### Tableau Opportunités par Commande
| Commande | Agents actuels | Agents recommandés | Opportunités | Gain estimé | Priorité | Complexité |
|----------|----------------|--------------------|--------------|-------------|----------|------------|
| [nom]    | X agents       | +Y agents          | Z patterns   | W%          | HIGH/MED/LOW | FACILE/MOYEN/DIFFICILE |

### Détail par Commande (Top 5 priorités)
Pour chaque commande prioritaire :
#### [Nom Commande]
- **Agents actuels** : [liste]
- **Opportunités détectées** (SUBSTITUTIONS PURES uniquement) :
  1. Phase/Section [X] : Pattern [Y] → Agent recommandé : [agent-aikido-Z]
     - Type : Substitution technique (pas de modification algorithme)
     - Pattern manuel remplacé : [description exacte]
     - Gain estimé : [W]%
     - Template insertion : [template optimisé pour cette phase]
     - ⚠️ Garantie : Résultat fonctionnel identique
  2. [...]

Mode : DEEP (analyse exhaustive)
Tokens estimés : <60k"

**Résultat attendu** : Rapport complet dynamique avec opportunités détectées automatiquement
```

Afficher en temps réel :
```
🔍 ANALYSE DYNAMIQUE EN COURS (agent-aikido-explore-bank DEEP MODE)...

✓ Scan agents disponibles : /prompts/hard_points/agents/agent-aikido-*.md
✓ Extraction capacités et patterns remplaçables (par agent)
✓ Scan commandes existantes : prompts/hard_points/commands/*.md
✓ Détection opportunités optimisation (agents × commandes)
✓ Calcul scoring priorité + complexité
✓ Génération recommandations par commande
✓ Rapport dynamique prêt
```

### Étape 2 : Présentation Rapport

Afficher le rapport généré par l'agent :

```
📊 RAPPORT D'OPTIMISATION DYNAMIQUE

[Afficher résumé global]
[Afficher tableau opportunités par commande]

🎯 Top 5 priorités d'optimisation :
[Afficher détail top 5 avec agents recommandés + templates]
```

### Étape 3 : Question Utilisateur - Sélection

Poser la **Question : Sélection commandes à optimiser**
```
🤖 Quelles commandes souhaitez-vous optimiser ?

1. 🚀 Toutes les commandes avec opportunités
2. 🎯 Priorité HIGH uniquement
3. 📝 Sélection manuelle (entrez les noms séparés par virgules)
4. 🔍 Une seule commande (entrez le nom sans .md)
5. 💾 Mode Dry-Run (simulation sans modification)
6. ❌ Annuler

Entrez votre choix (1-6) :
```

### Étape 4 : Confirmation

Afficher récapitulatif sélection + demander confirmation :
```
✅ Récapitulatif :

Commandes à optimiser :
- [Commande 1] : +X agents → [Y]% gain estimé
- [Commande 2] : +X agents → [Y]% gain estimé
...

Gain tokens total estimé : [Z]%

⚠️ Cette opération va modifier les fichiers dans prompts/hard_points/commands/ et .claude/commands/
💾 Backups automatiques (.bak) créés pour chaque fichier

Confirmez-vous ? (oui/non)
```

## Processus d'Optimisation Automatique

Pour chaque commande sélectionnée :

### Phase 1 : Lecture et Backup

```
🔧 OPTIMISATION : [nom-commande]

✓ Lecture prompts/hard_points/commands/[nom-commande].md
✓ Backup créé : [nom-commande].md.bak
✓ Parsing structure commande
```

### Phase 2 : Application Optimisations

Pour chaque opportunité détectée par agent-aikido-explore-bank :

```
✓ Insertion agent [N]/[Total] : [agent-aikido-X] dans Phase/Section [Y]
  - Pattern remplacé : [description]
  - Template utilisé : [template généré par explore-bank]
  - Gain estimé : ~[Z]%
```

Modifications appliquées automatiquement :
1. Insertion sections `🤖 AGENT: [agent-name]` avec prompts optimisés
2. Ajout emoji 🤖 dans titres phases concernées
3. Mise à jour frontmatter description (mention nombre agents)
4. Ajout section récapitulative agents utilisés (fin de fichier)

### Phase 3 : Validation Conformité 🤖

**UTILISER L'AGENT** `agent-aikido-validator` pour validation post-optimisation :

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

**Prompt pour l'agent** :
"Valide la commande optimisée contre les règles AI-KIDO.

Fichier : prompts/hard_points/commands/[nom-commande].md

Validations spécifiques commandes optimisées :
1. Règle 4 : Contraintes lignes (≤1000 lignes pour commandes)
2. Format agents : Sections '🤖 AGENT:' correctement formatées
3. Cohérence workflow : Agents insérés aux bons endroits (phases logiques)
4. Frontmatter : Description mise à jour avec mention agents
5. Section récap : Présence section récapitulative agents

Retourner :
- Score conformité global : [X]%
- Violations détectées : [liste avec quick fixes]

Mode : <3k tokens"

**Résultat attendu** : Score + violations si < 90%
```

Afficher résultat :
```
🔍 VALIDATION (agent-aikido-validator)...

✓ Score conformité : [X]% [✅/⚠️]
[Si < 90% : Liste violations + quick fixes proposés]
```

**Si score < 90%** : Proposer corrections automatiques ou restauration backup
**Si score ≥ 90%** : Continuer Phase 4

### Phase 4 : Mise à Jour Mapping

```
🔄 MAPPING CLAUDE CODE...

✓ Backup : .claude/commands/[nom-commande].md.bak
✓ Mise à jour description + agents utilisés
✓ Fichier mapping mis à jour
```

### Phase 5 : Génération Rapport

Créer `prompts/hard_points/commands/reports/optimize-[nom-commande]-[timestamp].md` :

```markdown
# Rapport Optimisation : [nom-commande]

**Date** : [timestamp]

## Résumé
- Agents ajoutés : X agents
- Lignes : [avant] → [après]
- Gain tokens estimé : [X]%
- Conformité finale : [X]% ✅

## Optimisations Appliquées
[Liste agents insérés avec phases et gains]

## Backup
- Original : prompts/hard_points/commands/[nom-commande].md.bak
- Mapping : .claude/commands/[nom-commande].md.bak

Pour restaurer : `mv [fichier].bak [fichier]`
```

### Phase 6 : Mise à Jour Documentation

Si commande nouvellement optimisée, mettre à jour `commands_list.md` :
```
✓ commands_list.md : Ajout workflow [nom-commande] si nécessaire
✓ Section "Commandes optimisées" mise à jour
```

## Résultat Final par Commande

```
✅ [nom-commande] optimisée !

🤖 Agents intégrés : X
📊 Gain tokens estimé : Y%
✅ Conformité : Z%
💾 Backups : .bak disponibles
📋 Rapport : reports/optimize-[nom]-[timestamp].md
```

## Résultat Global Final

Après toutes optimisations :

```
🎉 OPTIMISATION GLOBALE TERMINÉE !

📊 Statistiques :
- Commandes analysées : X
- Commandes optimisées : Y
- Agents ajoutés au total : Z
- Gain tokens moyen : W%

📁 Fichiers modifiés :
- prompts/hard_points/commands/ : Y commandes
- .claude/commands/ : Y mappings
- reports/ : Y rapports

🤖 Récapitulatif agents par commande :
| Commande | Agents avant | Agents après | Gain |
|----------|--------------|--------------|------|
[Tableau depuis données réelles]

💾 Tous les backups (.bak) disponibles

💡 Prochaines étapes :
- Tester commandes optimisées
- Vérifier rapports dans reports/
- Committer si satisfait ou restaurer depuis .bak
```

## Gestion des Erreurs

### Erreur Analyse
```
❌ ERREUR : Échec analyse

Détail : [message]
Action : 1. Réessayer / 2. Annuler
```

### Erreur Optimisation
```
❌ ERREUR : Échec optimisation [nom-commande]

✅ Backup restauré automatiquement
Action : 1. Réessayer / 2. Ignorer / 3. Annuler
```

### Erreur Validation (Score < 90%)
```
❌ VALIDATION ÉCHOUÉE : [nom-commande]

Score : [X]%
Violations : [liste]

✅ Backup disponible
Action : 1. Appliquer quick fixes / 2. Restaurer backup / 3. Forcer
```

## Options Modes

**Mode Dry-Run** (choix 5) :
- Génère rapports sans modifier fichiers
- Crée fichiers `.preview` pour visualisation
- Aucun backup nécessaire

**Mode Restauration** :
```bash
# Restaurer une commande
mv prompts/hard_points/commands/[nom].md.bak prompts/hard_points/commands/[nom].md
mv .claude/commands/[nom].md.bak .claude/commands/[nom].md

# Restaurer toutes
find .roo/commands -name "*.bak" -exec bash -c 'mv "$1" "${1%.bak}"' _ {} \;
find .claude/commands -name "*.bak" -exec bash -c 'mv "$1" "${1%.bak}"' _ {} \;
```

## Algorithme Pérenne

**Principe** : Déléguer intelligence à `agent-aikido-explore-bank`

1. **Détection dynamique agents** : Scanner `/prompts/hard_points/agents/agent-aikido-*.md`
2. **Extraction capacités** : Lire descriptions et déduire patterns
3. **Analyse commandes** : Scanner `prompts/hard_points/commands/*.md`
4. **Matching intelligent** : Patterns agents ↔ Patterns commandes
5. **Génération templates** : Créer prompts optimisés selon contexte
6. **Application standard** : Insertion agents avec format unifié

**Adaptabilité** :
- ✅ Nouveaux agents détectés automatiquement
- ✅ Nouvelles commandes analysées automatiquement
- ✅ Patterns agents évolutifs (via descriptions personas)
- ✅ Aucun hardcoding agents/commandes

## 🤖 Récapitulatif des Agents AI-KIDO Utilisés

Cette commande utilise **2 agents AI-KIDO** en mode dynamique :

### Étape 1 : `agent-aikido-explore-bank` (DEEP MODE)
- **Rôle** : Inventaire dynamique agents disponibles + analyse opportunités commandes
- **Output** : Rapport complet avec agents détectés, commandes analysées, opportunités scorées
- **Tokens** : ~50-60k (DEEP mode avec analyse exhaustive)
- **Gain** : ~80% tokens vs analyse manuelle multi-fichiers
- **Adaptabilité** : Détecte automatiquement nouveaux agents et commandes

### Phase 3 : `agent-aikido-validator`
- **Rôle** : Validation conformité AI-KIDO post-optimisation
- **Output** : Score conformité + violations éventuelles avec quick fixes
- **Tokens** : <3k
- **Gain** : Garantie qualité + détection précoce violations

### 📊 Gains d'Optimisation

| Aspect | Avant (manuel) | Après (agents) | Gain |
|--------|----------------|----------------|------|
| **Détection agents disponibles** | Hardcodé statique | Scanner dynamique | Évolutif ∞ |
| **Analyse commandes** | Manuelle par commande | explore-bank batch | ~80% tokens |
| **Matching opportunités** | Règles hardcodées | Intelligence agent | Adaptable |
| **Validation conformité** | Manuelle ou absente | validator systématique | +Garantie |
| **Workflow global** | ~100k tokens | ~60k tokens | ~40% efficacité |
| **Pérennité** | Maintenance requise | Auto-adaptatif | 100% |

---

*Meta-commande d'optimisation automatique et pérenne - S'adapte à l'évolution des agents et commandes*
