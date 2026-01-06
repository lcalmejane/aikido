---
description: "Créer un glossaire métier ventilé par domaines/personas experts dans la Memory Bank AI-KIDO, optimisé pour la recherche sémantique (4 agents AI-KIDO: explore-bank, truth-evaluator, raci-delegator, validator)"
---

# Commande Init-Glossaire

Génère un glossaire métier **ventilé par domaines et personas experts** dans [`/prompts/gen/concepts/glossaires/`](../prompts/gen/concepts/glossaires/), optimisé pour la recherche sémantique et conforme aux règles AI-KIDO (≤500 lignes, compact, utile).

**Orchestration** : Utilise les agents [`agent-aikido-explore-bank`](../prompts/hard_points/agents/agent-aikido-explore-bank.md), [`agent-aikido-truth-evaluator`](../prompts/hard_points/agents/agent-aikido-truth-evaluator.md), [`agent-aikido-raci-delegator`](../prompts/hard_points/agents/agent-aikido-raci-delegator.md) et [`agent-aikido-validator`](../prompts/hard_points/agents/agent-aikido-validator.md).

## Workflow d'Orchestration

```
explore-bank → truth-evaluator → [Analyse code/docs] → raci-delegator → [Génération ventilée] → validator
(détection     (validation       (extraction termes)   (classification  (glossaires par      (validation
 contexte)      sources)                                par domaine)     domaine/persona)     conformité)
```

## Exécution

### Phase 1 : Exploration Contextuelle 🤖

**UTILISER L'AGENT** [`agent-aikido-explore-bank`](../prompts/hard_points/agents/agent-aikido-explore-bank.md) :

```markdown
🤖 AGENT: agent-aikido-explore-bank (QUICK MODE)

**Prompt pour l'agent** :
"Détection contexte pour initialisation glossaire métier.

Analyser :
1. Glossaires existants dans `/prompts/gen/concepts/glossaires/`
2. Personas experts disponibles dans `/prompts/gen/personas/`
3. Domaines métier depuis Memory Bank et structure code projet

Retourner :
- Glossaires existants : [LISTE ou "Aucun"]
- Personas experts : [LISTE avec spécialisations]
- Domaines métier identifiés : [LISTE]
- Mode recommandé : [CRÉATION | MISE À JOUR]

Mode : QUICK (<15k tokens)"

**Résultat attendu** : Contexte complet pour génération glossaire
```

**Output Phase 1** :
```
📊 CONTEXTE DÉTECTÉ :

Glossaires existants : [LISTE ou "Aucun"]
Personas experts disponibles : [LISTE]
Domaines métier identifiés : [LISTE]

Mode : [CRÉATION | MISE À JOUR]
```

### Phase 2 : Validation Sources 🤖

**UTILISER L'AGENT** [`agent-aikido-truth-evaluator`](../prompts/hard_points/agents/agent-aikido-truth-evaluator.md) :

```markdown
🤖 AGENT: agent-aikido-truth-evaluator

**Prompt pour l'agent** :
"Validation sources terminologie métier pour génération glossaire.

Identifier sources autoritaires :
- Code source (classes/interfaces/enums métier)
- Documentation métier existante
- Commentaires explicatifs code
- Tests métier (Given/When/Then)

Exclusions automatiques :
- Termes AI-KIDO génériques (`/prompts/hard_points/ai-kido.md`)
- Termes roo-code (`/prompts/hard_points/roo-code/`)
- Personas/rôles génériques
- Technologies standards

Résoudre contradictions détectées.
Scorer crédibilité chaque terme.

Retourner :
- Sources autoritaires avec crédibilité (%)
- Termes extraits vs exclus
- Contradictions + résolutions

Mode : <10k tokens"

**Résultat attendu** : Sources validées + termes filtrés
```

**Output Phase 2** :
```
⚖️ SOURCES VALIDÉES :

Sources autoritaires :
- Code métier : [PATHS] (crédibilité: 90%)
- Docs métier : [PATHS] (crédibilité: 80%)
- Tests métier : [PATHS] (crédibilité: 85%)

Termes extraits : [NOMBRE]
Termes exclus (AI-KIDO/roo-code) : [NOMBRE]
Contradictions détectées : [NOMBRE]
```

### Phase 3 : Extraction et Analyse Terminologique

**Analyse automatique multi-sources** :

#### 3.1 Sources Code (priorité haute)
- **Classes/Interfaces métier** : Noms explicites du domaine
- **Enums métier** : Valeurs business spécifiques
- **Constantes métier** : Règles business codifiées
- **Commentaires métier** : Explications logique business

#### 3.2 Sources Documentation
- **Docs métier** : Terminologie formelle
- **README/CONTRIBUTING** : Concepts projet-spécifiques
- **Tests métier** : Scénarios Given/When/Then

#### 3.3 Filtrage Intelligent

**Critères d'inclusion** :
- Termes métier spécifiques au domaine
- Concepts confus/ambigus nécessitant clarification
- Acronymes métier non standards
- Processus business particuliers
- Règles métier complexes

**Critères d'exclusion** :
- Termes AI-KIDO/roo-code génériques
- Technologies standards
- Patterns architecturaux classiques
- Termes développement usuels

**Output Phase 3** :
```
📊 EXTRACTION TERMINOLOGIQUE :

Termes métier extraits : [NOMBRE]
- Classes métier : [NOMBRE]
- Enums métier : [NOMBRE]
- Concepts docs : [NOMBRE]
- Scénarios tests : [NOMBRE]

Termes confus détectés : [NOMBRE]
Acronymes métier : [NOMBRE]

Continuer ? (o/n)
```

### Phase 4 : Classification par Domaines 🤖

**UTILISER L'AGENT** [`agent-aikido-raci-delegator`](../prompts/hard_points/agents/agent-aikido-raci-delegator.md) :

```markdown
🤖 AGENT: agent-aikido-raci-delegator

**Prompt pour l'agent** :
"Classification termes métier par domaines pour génération glossaires ventilés.

Input : [Liste termes extraits depuis Phase 3]

Analyser :
1. Classifier termes par domaine métier
2. Mapper vers personas experts (existants ou à créer)
3. Calculer taille optimale par glossaire (≤500 lignes)
4. Recommander structure arborescente

Stratégie ventilation :
- Par domaine métier (Frontend, Backend, Business, Data, etc.)
- Par persona expert (mapper vers `/prompts/gen/personas/`)
- Découpage si >400 lignes (marge sécurité)

Retourner :
- Classification par domaine avec tailles estimées
- Mapping personas experts
- Structure arborescente recommandée avec paths

Mode : <10k tokens"

**Résultat attendu** : Structure glossaires ventilés conforme AI-KIDO
```

**Output Phase 4** :
```
🎯 CLASSIFICATION PAR DOMAINES :

Domaines détectés :
1. [Domaine 1] : [X] termes → glossaire-[domaine1].md (≈[Y] lignes)
2. [Domaine 2] : [X] termes → glossaire-[domaine2].md (≈[Y] lignes)
...

Personas experts mappés :
- [Domaine 1] → [Persona existant ou "À créer"]
- [Domaine 2] → [Persona existant ou "À créer"]

Structure recommandée :
/prompts/gen/concepts/glossaires/
  ├── index.md (navigation)
  ├── glossaire-[domaine1].md
  ├── glossaire-[domaine2].md
  └── ...

Valider cette structure ? (o/n)
```

### Phase 5 : Enrichissement Manuel (Optionnel)

**Proposition d'ajouts manuels** :
```
Souhaitez-vous ajouter des termes métier non détectés automatiquement ?

Format : Terme | Définition | Domaine | Contexte
Exemple : "Parcours apprenant | Séquence pédagogique personnalisée | Pédagogie | Modules d'évaluation"

Entrez les termes (un par ligne, ou 'fin') :
```

### Phase 6 : Génération Ventilée par Domaines

#### 6.1 Structure Arborescente

**Créer répertoire** [`/prompts/gen/concepts/glossaires/`](../prompts/gen/concepts/glossaires/) :

```
/prompts/gen/concepts/glossaires/
├── index.md                    # Navigation principale + recherche
├── glossaire-[domaine1].md     # ≤500 lignes, compact
├── glossaire-[domaine2].md     # ≤500 lignes, compact
└── ...
```

#### 6.2 Format Index Principal

**Créer** [`/prompts/gen/concepts/glossaires/index.md`](../prompts/gen/concepts/glossaires/index.md) :

```markdown
# 📚 Glossaires Métier par Domaines
> Version: 1.0 | Date: [DATE] | Projet: [NOM_PROJET]

## Navigation par Domaine

### [Domaine 1] ([X] termes)
**Persona expert** : [`[persona-expert]`](../../personas/[persona-expert].md)
**Glossaire** : [`glossaire-[domaine1].md`](glossaire-[domaine1].md)
**Concepts clés** : [Liste 3-5 concepts principaux]

### [Domaine 2] ([X] termes)
**Persona expert** : [`[persona-expert]`](../../personas/[persona-expert].md)
**Glossaire** : [`glossaire-[domaine2].md`](glossaire-[domaine2].md)
**Concepts clés** : [Liste 3-5 concepts principaux]

## Recherche Rapide

### Par Terme
- **[Terme A]** → [`glossaire-[domaine]`](glossaire-[domaine].md#terme-a)
- **[Terme B]** → [`glossaire-[domaine]`](glossaire-[domaine].md#terme-b)

### Par Catégorie
- **Processus métier** : [Liens vers glossaires concernés]
- **Règles business** : [Liens vers glossaires concernés]
- **Concepts confus** : [Liens vers glossaires concernés]

## Statistiques
- **Total termes** : [NOMBRE]
- **Domaines couverts** : [NOMBRE]
- **Sources analysées** : [NOMBRE] fichiers
- **Dernière mise à jour** : [DATE]

---
*Généré par `/init-glossaire` - Conforme AI-KIDO (≤500 lignes/fichier)*
```

#### 6.3 Format Glossaire par Domaine

**Template** [`glossaire-[domaine].md`](../prompts/gen/concepts/glossaires/) :

```markdown
# 📖 Glossaire [Domaine]
> **Persona expert** : [`[persona]`](../../personas/[persona].md) | **Termes** : [X] | **Lignes** : [Y]/500

## Termes (ordre alphabétique)

### [Terme 1]
**Définition** : [Concise, 1-2 phrases max]
**Contexte** : [Où utilisé dans le code/docs]
**Exemple** : `[Code snippet ou usage concret]`
**Voir aussi** : [`[terme-lié]`](#terme-lié)

### [Terme 2]
...

## Index Catégories

**Processus** : [`terme1`](#terme-1), [`terme2`](#terme-2)
**Règles** : [`terme3`](#terme-3)
**Concepts** : [`terme4`](#terme-4)

## Termes Confus

**[Terme A]** ≠ **[Terme B]**
→ [Différence clé en 1 phrase]

---
*Sources* : [Paths code/docs] | *Validé par* : [`truth-evaluator`](../../personas/agent-aikido-truth-evaluator.md)
```

#### 6.4 Optimisation Taille (≤500 lignes)

**Stratégies de compression** :
1. **Définitions concises** : 1-2 phrases max
2. **Exemples inline** : Code snippets courts
3. **Liens plutôt que duplication** : Références croisées
4. **Regroupement intelligent** : Termes connexes ensemble
5. **Découpage si nécessaire** : Sous-domaines si >400 lignes

### Phase 7 : Validation Conformité 🤖

**UTILISER L'AGENT** [`agent-aikido-validator`](../prompts/hard_points/agents/agent-aikido-validator.md) :

```markdown
🤖 AGENT: agent-aikido-validator

**Prompt pour l'agent** :
"Validation glossaires générés contre règles AI-KIDO.

Fichiers : /prompts/gen/concepts/glossaires/*.md (tous les glossaires + index.md)

Validations requises :
1. Contrainte ≤500 lignes par glossaire (Règle 4)
2. Frontmatter complet et conforme
3. Liens bidirectionnels (glossaires ↔ personas ↔ index) (Règle 6)
4. Emplacement correct dans `/prompts/gen/concepts/glossaires/`
5. Navigation index complète

Retourner :
- Score conformité par fichier
- Issues détectées avec quick fixes actionnables
- Décision globale : PASS/FAIL

Mode : <3k tokens par fichier"

**Résultat attendu** : Validation complète + quick fixes si nécessaire
```

**Validation automatique** :
```
📊 VALIDATION CONFORMITÉ AI-KIDO :

Glossaires validés :
✅ glossaire-[domaine1].md : [X]/500 lignes, frontmatter ✓, liens ✓
✅ glossaire-[domaine2].md : [Y]/500 lignes, frontmatter ✓, liens ✓
✅ index.md : [Z]/500 lignes, navigation ✓

Conformité globale : 100% ✅

Issues détectées : [NOMBRE]
- [Liste des issues avec quick fixes si nécessaire]

Continuer avec l'intégration ? (o/n)
```

**Si non-conformités détectées** :
- Appliquer automatiquement les quick fixes proposés
- Découper glossaires >500 lignes
- Corriger liens bidirectionnels manquants
- Ajouter frontmatter manquant

### Phase 8 : Intégration Memory Bank

#### 8.1 Mise à Jour Index Concepts

**Mettre à jour** [`/prompts/gen/concepts/index.md`](../prompts/gen/concepts/index.md) :
```markdown
## Fichiers Disponibles

- [`guideline-prompts.md`](guideline-prompts.md) : Guidelines prompts efficaces
- [`glossaires/`](glossaires/index.md) : **Glossaires métier ventilés par domaines** ([X] termes, [Y] domaines)
```

#### 7.2 Mise à Jour Index Principal

**Mettre à jour** [`/prompts/index.md`](../prompts/index.md) :
```markdown
## Structure

- [`concepts/`](concepts/index.md) : Concepts fondamentaux + **glossaires métier par domaines**
```

#### 7.3 Liens Bidirectionnels Personas

**Pour chaque persona expert mappé**, ajouter référence au glossaire :
```markdown
## Domaine d'Expertise

**Glossaire associé** : [`/prompts/gen/concepts/glossaires/glossaire-[domaine].md`](../../concepts/glossaires/glossaire-[domaine].md)
```

## Messages de Confirmation

### Succès - Génération Ventilée
```
✅ Glossaires métier générés avec succès !

📁 Structure créée :
/prompts/gen/concepts/glossaires/
├── index.md (navigation + recherche)
├── glossaire-[domaine1].md ([X] termes, [Y] lignes)
├── glossaire-[domaine2].md ([X] termes, [Y] lignes)
└── ... ([N] glossaires au total)

📊 Statistiques :
- Total termes : [X]
- Domaines couverts : [Y]
- Personas experts mappés : [Z]
- Conformité ≤500 lignes : ✅ [100%]

🔗 Intégration Memory Bank :
- Index concepts mis à jour
- Index principal mis à jour
- Liens bidirectionnels personas créés

🎯 Agents utilisés :
- explore-bank : Détection contexte
- truth-evaluator : Validation sources
- raci-delegator : Classification domaines

🚀 Glossaires optimisés pour recherche sémantique !
```

## Gestion des Erreurs

- **Agent explore-bank indisponible** : Mode dégradé avec scan manuel
- **Agent truth-evaluator indisponible** : Validation manuelle sources
- **Agent raci-delegator indisponible** : Classification manuelle domaines
- **Agent validator indisponible** : Validation manuelle conformité (wc -l, grep)
- **Aucun terme détecté** : Proposer saisie manuelle
- **Persona expert manquant** : Proposer création via `/create-persona`
- **Glossaire >500 lignes** : Découpage automatique via validator
- **Conflits définitions** : Utiliser truth-evaluator pour arbitrage
- **Non-conformité AI-KIDO** : Appliquer quick fixes validator automatiquement
- **Permissions insuffisantes** : Proposer répertoire alternatif

## 🤖 Récapitulatif des Agents AI-KIDO Utilisés

Cette commande utilise **4 agents AI-KIDO** pour optimiser la génération du glossaire :

### Phase 1 : `agent-aikido-explore-bank` (QUICK MODE)
- **Rôle** : Détection contexte (glossaires existants, personas experts, domaines métier)
- **Output** : Contexte complet pour génération glossaire
- **Tokens** : <15k
- **Gain** : ~40% vs scan manuel multi-fichiers

### Phase 2 : `agent-aikido-truth-evaluator`
- **Rôle** : Validation sources terminologie métier (code, docs, tests)
- **Output** : Sources autoritaires + termes filtrés avec crédibilité
- **Tokens** : <10k
- **Gain** : ~35% vs identification manuelle sources + résolution contradictions

### Phase 4 : `agent-aikido-raci-delegator`
- **Rôle** : Classification termes par domaines + mapping personas experts
- **Output** : Structure glossaires ventilés conforme AI-KIDO (≤500 lignes)
- **Tokens** : <10k
- **Gain** : ~30% vs classification manuelle + calcul tailles

### Phase 7 : `agent-aikido-validator`
- **Rôle** : Validation conformité AI-KIDO des glossaires générés
- **Output** : Score conformité + quick fixes si nécessaire
- **Tokens** : <3k par fichier
- **Gain** : Garantie qualité + détection précoce violations

### 📊 Gains d'Optimisation Globaux

| Aspect | Avant (manuel) | Après (agents) | Gain |
|--------|----------------|----------------|------|
| **Détection contexte** | Scan manuel multiples fichiers | explore-bank automatique | ~40% tokens |
| **Validation sources** | Identification manuelle + résolution | truth-evaluator intelligent | ~35% tokens |
| **Classification domaines** | Mapping manuel + calculs | raci-delegator automatique | ~30% tokens |
| **Validation conformité** | Vérifications manuelles | validator systématique | +Garantie qualité |
| **Workflow global** | ~80k tokens estimés | ~36k tokens | ~55% efficacité |

## Règles AI-KIDO Respectées

- ✅ **Règle 4** : Contrainte ≤500 lignes par glossaire (validé par validator)
- ✅ **Règle 6** : Liens bidirectionnels (validés par validator)
- ✅ **Règle 2** : Séparation gen/hard_points (emplacement validé)
- ✅ **Règle 16-18** : Liens bidirectionnels (glossaires ↔ personas ↔ index)
- ✅ **Orchestration agents** : explore-bank, truth-evaluator, raci-delegator, validator
- ✅ **Validation automatique** : Conformité AI-KIDO vérifiée par validator
- ✅ **Ventilation par domaines** : Arborescence optimisée pour recherche
- ✅ **Mapping personas experts** : Lien glossaire ↔ expertise
- ✅ **Compression sémantique** : Définitions concises, exemples inline
- ✅ **Exclusion AI-KIDO/roo-code** : Focus termes métier projet
- ✅ **Intégration Memory Bank** : [`/prompts/gen/concepts/glossaires/`](../prompts/gen/concepts/glossaires/)

---

*Commande optimisée avec 4 agents AI-KIDO - Gain global estimé : ~55% tokens*
