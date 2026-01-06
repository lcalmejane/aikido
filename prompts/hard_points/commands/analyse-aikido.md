---
description: "Audit complet des tables de vérités AI-KIDO pour détecter dérivations, incohérences et liens cassés"
---
# Commande Analyse-Aikido - Version Intégrée
>
> **Objectif** : Audit et redressage automatique de la base AI-KIDO avec corrections directes selon les règles 1-18
> **Principe** : Corrections directes dans `/prompts/gen/` et synchronisation `AGENTS.md` selon règles AI-KIDO

## Vue d'ensemble

Cette commande effectue un audit complet des tables de vérités dans `/prompts/gen/` et `/prompts/hard_points/`, détecte les incohérences selon les règles AI-KIDO 1-18, puis applique automatiquement les corrections nécessaires pour maintenir la cohérence de la memory bank.

**PRINCIPE FONDAMENTAL** : Pas de répertoires d'analyse séparés - corrections directes dans la base AI-KIDO existante selon les règles établies.

## Phase 1 : Audit Structurel selon Règles AI-KIDO

### 1.0 Exploration Automatique de la Memory Bank 🤖

**UTILISER L'AGENT** `agent-aikido-explore-bank` pour scanner intelligemment la structure :

```markdown
🤖 AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

**Prompt pour l'agent** :
"Effectue un scan DEEP de la Memory Bank AI-KIDO. Analyse :
1. Structure complète de /prompts/gen/ et /prompts/hard_points/
2. Tous les fichiers avec leurs métadonnées (taille, date modification, version)
3. L\iens bidirectionnels entre fichiers
4. Répartition par rôles si applicable (Règle 15)
5. Violations potentielles des règles AI-KIDO 1-18

Retourne un inventaire complet avec paths + line numbers pour chaque élément."

**Résultat attendu** : Inventaire structuré de la Memory Bank avec métriques
```

**Avantages de l'agent** :
- ✅ Scan optimisé (<40% contexte)
- ✅ Métadonnées automatiques (dates, versions, dépréc ation)
- ✅ Détection patterns et anomalies
- ✅ Références précises (file_path:line_number)

### 1.1 Validation de la Structure Obligatoire (Règles 1-2, 8, 15)

**Analyser les résultats de l'agent** et vérifier la conformité à [`ai-kido.md`](../prompts/hard_points/ai-kido.md) lignes 79-105 :

```markdown
🔍 AUDIT STRUCTUREL AI-KIDO

Structure obligatoire vérifiée :
✅ /prompts/index.md (point d'entrée principal - Règle 1)
✅ /prompts/gen/concepts/ (théorie - Règle 2)
✅ /prompts/gen/techniques/ (pratique - Règle 2)  
✅ /prompts/gen/personas/ (agents spécialisés - Règle 9)
✅ /prompts/gen/use_cases/ (applications - Règle 2)
✅ /prompts/hard_points/ (vérités immuables - Règle 8)

Répartition par rôles (Règle 15) :
✅ Sous-répertoires avec responsables assignés
✅ Matrice RACI respectée

❌ Corrections automatiques appliquées : [LISTE]
```

### 1.2 Validation des Contraintes d'Équilibrage (Règles 4, 7) 🤖

**UTILISER L'AGENT** `agent-aikido-validator` pour validation rapide des contraintes :

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

**Prompt pour l'agent** :
"Valide TOUS les fichiers de /prompts/gen/ et /prompts/hard_points/ pour conformité :
1. Règle 4 : Contrainte lignes (≤500 standard, ≤1000 commands/personas/agents, EXEMPT ai-kido*.md, prompts/hard_points/system/structure/index.json no limit.)
2. Règle 7 : Profondeur arborescence ≤4 niveaux, facteur branchement 3-7
3. Règle 6 : Liens bidirectionnels (quick check)
4. Règle 2 : Emplacement correct (concepts/techniques/personas/use_cases)
5. Frontmatter valide (name, description, tools pour agents/personas)

Pour chaque fichier non-conforme, retourne :
- Fichier + nombre lignes actuel / limite
- Violations détectées avec références line
- Plan de résolution rapide (split, move, fix frontmatter)

Utilise quick checks (<2k tokens par batch)."

**Résultat attendu** : Liste fichiers non-conformes avec plans de correction
```

**Avantages de l'agent** :
- ⚡ Validation rapide (<2k tokens par batch)
- ✅ Détection automatique mono/multi-projet
- ✅ Gestion exceptions (ai-kido.md exempt)
- ✅ Plans de résolution actionnables
- ✅ Rapports concis (✅/❌ par fichier)

## Phase 2 : Validation et Correction des Formats (Règles 4, 11, 12)

### 2.1 Format Standard AI-KIDO

**Corriger automatiquement** tous les fichiers non conformes au format [`ai-kido.md`](../prompts/hard_points/ai-kido.md) lignes 140-163 :

```markdown
📋 CORRECTIONS DE FORMAT APPLIQUÉES

Format standard AI-KIDO imposé :
✅ Métadonnées ajoutées : > Version: X.Y | Date: YYYY-MM-DD | Statut: [Statut]
✅ Sections obligatoires créées : Vue d'ensemble, Définitions clés, etc.
✅ Densité sémantique optimisée (Règle 11)
✅ Schémas Mermaid ajoutés si pertinent (Règle 12)

Fichiers corrigés automatiquement : [NOMBRE]
```

### 2.2 Liens Bidirectionnels (Règle 6)

**Créer automatiquement** tous les liens bidirectionnels manquants :

```markdown
🔗 LIENS BIDIRECTIONNELS RESTAURÉS

Règle 6 appliquée - Chaînage A ↔ B systématique :
✅ Liens retour créés automatiquement
✅ Navigation hiérarchique rétablie
✅ Références croisées ajoutées

Liens bidirectionnels ajoutés : [NOMBRE]
```

### 2.3 Validation Post-Correction 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-validator` pour valider les corrections appliquées :

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

**Prompt pour l'agent** :
"Valide TOUS les fichiers modifiés pendant les corrections de format (Phase 2).
Pour chaque fichier corrigé :
1. Vérifie conformité frontmatter ajouté
2. Vérifie liens bidirectionnels créés
3. Vérifie densité sémantique
4. Vérifie contraintes lignes toujours respectées

Retourne rapport de validation concis :
- ✅ [fichier] CONFORME (corrections OK)
- ❌ [fichier] NON-CONFORME (corrections insuffisantes) + quick fix

Mode rapide : <2k tokens total."

**Résultat attendu** : Validation des corrections avec taux de réussite
```

**Garantie qualité** :
- ✅ Corrections validées immédiatement
- ✅ Ré-application automatique si échec
- ✅ Conformité garantie avant phase suivante

## Phase 3 : Synchronisation AGENTS.md ↔ AI-KIDO (Règles 16-18)

### 3.0 Validation RACI Automatique 🤖

**UTILISER L'AGENT** `agent-aikido-raci-delegator` pour valider la cohérence RACI :

```markdown
🤖 AGENT: agent-aikido-raci-delegator
FORMAT: JSON

**Prompt pour l'agent** :
"Analyse tous les fichiers de /prompts/gen/ détectés dans l'inventaire précédent.
Pour chaque fichier :
1. Vérifie que le placement respecte la matrice RACI
2. Identifie les documents mal classés (mauvais répertoire/rôle)
3. Détecte les documents sans responsable assigné
4. Propose les reclassifications nécessaires avec confidence

Retourne la liste des incohérences RACI avec chemins actuels et recommandés."

**Résultat attendu** : Liste des documents à reclasser selon RACI
```

**Avantages de l'agent** :
- ✅ Classification automatique haute précision
- ✅ Détection contexte mono/multi-projet
- ✅ Recommandations avec alternatives
- ✅ Respect strict des règles AI-KIDO

### 3.1 Mise à Jour Automatique AGENTS.md

**Synchroniser automatiquement** [`AGENTS.md`](../AGENTS.md) avec `/prompts/gen/` selon règles 16-18 :

```markdown
🤖 SYNCHRONISATION AGENTS.MD

Règles 16-18 appliquées :
✅ Project Context synchronisé avec /prompts/index.md
✅ Available Agents générés depuis /prompts/gen/personas/
✅ Agent Interaction Matrix mise à jour
✅ Usage Guidelines alignées avec use_cases/

Correspondance 1:1 Agents ↔ Personas : [POURCENTAGE]%
```

### 3.2 Validation de Conformité

**Vérifier et corriger** la conformité AGENTS.md :

- ✅ Structure standardisée respectée
- ✅ Liens exclusifs vers `/prompts/gen/` (pas de duplication)
- ✅ Taxonomie AI-KIDO préservée
- ✅ Spécifications RACI alignées

## Phase 4 : Détection et Correction des Incohérences

### 4.1 Résolution des Contradictions 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-truth-evaluator` pour arbitrer les contradictions :

```markdown
🤖 AGENT: agent-aikido-truth-evaluator
FORMAT: JSON

**Prompt pour l'agent** :
"Analyse tous les documents de /prompts/gen/ détectés avec contradictions potentielles.
Pour chaque contradiction (specs vs code, docs legacy vs implementation, conflits entre sources) :

1. Identifier le scénario de développement (new feature, bug fix, refactoring, etc.)
2. Déterminer la source autoritaire selon le scénario
3. Scorer la crédibilité de chaque source (code, specs, docs, tests, config)
4. Détecter conflits entre sources
5. Fournir recommandation avec niveau de confiance

Respecte hiérarchie : /prompts/hard_points/ > /prompts/gen/ > code/docs > JAMAIS /prompts/spec/

Retourne arbitrages clairs pour chaque contradiction :
- Source autoritaire identifiée
- Justification selon scénario
- Recommandation d'action (conserver source X, ignorer source Y)
- Niveau de confiance (HIGH/MEDIUM/LOW)"

**Résultat attendu** : Arbitrage de contradictions avec recommandations actionnables
```

**Avantages de l'agent** :
- ✅ Classification automatique de 8 scénarios
- ✅ Scoring objectif de crédibilité
- ✅ Détection conflicts systématique
- ✅ Recommandations avec niveau de confiance
- ✅ Respect hiérarchie AI-KIDO

### 4.2 Incohérences Terminologiques

**Harmoniser automatiquement** la terminologie :

```markdown
📚 HARMONISATION TERMINOLOGIQUE

Glossaire unifié appliqué :
✅ Termes standardisés dans toute la base
✅ Acronymes harmonisés
✅ Définitions cohérentes

Corrections terminologiques : [NOMBRE]
```

### 4.3 Incohérences Architecturales

**Aligner automatiquement** architecture et implémentation :

```markdown
🏗️ COHÉRENCE ARCHITECTURALE

Alignement automatique :
✅ Architecture ↔ Stack technique
✅ Composants ↔ Use cases
✅ Personas ↔ Workflows

Alignements effectués : [NOMBRE]
```

## Phase 5 : Mise à Jour des Index (Règle 1)

### 5.1 Régénération Automatique des Index

**Mettre à jour automatiquement** tous les fichiers d'index :

```markdown
📇 INDEX RÉGÉNÉRÉS

Navigation hiérarchique restaurée (Règle 1) :
✅ /prompts/index.md mis à jour
✅ /prompts/gen/index.md mis à jour
✅ /prompts/gen/concepts/index.md régénéré
✅ /prompts/gen/techniques/index.md régénéré
✅ /prompts/gen/personas/index.md régénéré
✅ /prompts/gen/use_cases/index.md régénéré

Parcours récursif optimisé depuis point d'entrée principal.
```

### 5.2 Validation de la Navigation

**Vérifier** que le parcours récursif depuis [`/prompts/index.md`](../prompts/index.md) fonctionne correctement :

- ✅ Tous les fichiers accessibles depuis le point d'entrée
- ✅ Navigation hiérarchique cohérente
- ✅ Liens de retour fonctionnels

## Phase 6 : Application des Règles d'Auto-Alimentation

### 6.1 Capitalisation des Analyses (Règles de Capitalisation)

**Créer automatiquement** les fichiers manquants selon les règles de capitalisation :

```markdown
💾 CAPITALISATION AUTOMATIQUE

Règles de capitalisation appliquées :
✅ Analyses conceptuelles → /concepts/
✅ Analyses techniques → /techniques/
✅ Analyses de cas → /use_cases/
✅ Définitions de rôles → /personas/

Fichiers créés automatiquement : [NOMBRE]
```

### 6.2 Traçabilité et Versioning

**Appliquer** le versioning automatique :

- ✅ Horodatage des modifications
- ✅ Versioning des analyses sauvegardées
- ✅ Traçabilité des corrections appliquées

## Phase 7 : Validation des Hard Points (Règle 8)

### 7.1 Respect des Vérités Immuables

**Vérifier** que toutes les corrections respectent les [`hard_points`](../prompts/hard_points/) :

```markdown
🔒 HARD POINTS RESPECTÉS

Vérités immuables préservées :
✅ Aucune violation des contraintes hard_points
✅ Hiérarchie hard_points > gen/ > demandes respectée
✅ Décisions figées maintenues

Conformité hard_points : 100%
```

### 7.2 Validation Finale Complète 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-validator` pour audit final avant rapport :

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

**Prompt pour l'agent** :
"Valide la TOTALITÉ de /prompts/ après toutes les corrections appliquées (Phases 1-7).
Audit final de conformité AI-KIDO :

1. Règle 4 : Contraintes lignes sur TOUS les fichiers
2. Règle 6 : Liens bidirectionnels complets
3. Règle 2 : Séparation théorie/pratique correcte
4. Règle 7 : Arborescence équilibrée
5. Frontmatter valide sur tous agents/personas/commands
6. Emplacement correct de tous fichiers

Génère score de conformité global :
- Fichiers validés : [TOTAL]
- Conformes : [NOMBRE] (✅)
- Non-conformes : [NOMBRE] (❌)
- Score conformité : [POURCENTAGE]%

Pour chaque fichier non-conforme, liste violation + fix rapide.

Mode complet mais optimisé : <5k tokens total."

**Résultat attendu** : Score de conformité final + liste violations résiduelles
```

**Garantie qualité finale** :
- ✅ Conformité globale mesurée précisément
- ✅ Violations résiduelles identifiées
- ✅ Score prêt pour le rapport
- ✅ Validation indépendante de toutes les phases précédentes

## Phase 8 : Génération du Rapport de Synthèse

### 8.1 Rapport Intégré dans la Base AI-KIDO

**Créer** le rapport dans [`/prompts/spec/audit-aikido-[DATE].md`](../prompts/spec/) :

```markdown
# Audit AI-KIDO - [DATE]

> Version: 1.0 | Date: YYYY-MM-DD | Statut: Rapport d'Audit
> Conforme aux règles AI-KIDO 1-18

## Vue d'ensemble

**Statut global** : [EXCELLENT/BON/MOYEN/CRITIQUE]
**Conformité règles 1-18** : [X]%
**Corrections automatiques appliquées** : [NOMBRE]

## Métriques de Conformité

### Règles Structurelles (1-8)
- Règle 1 (Arborescence) : ✅ Conforme
- Règle 2 (Séparation) : ✅ Conforme
- Règle 4 (500 lignes) : ✅ [X] fichiers divisés
- Règle 6 (Bidirectionnalité) : ✅ [Y] liens ajoutés
- Règle 7 (Équilibrage) : ✅ Conforme
- Règle 8 (Hard Points) : ✅ Respectés

### Règles d'Optimisation (9-15)
- Règle 9 (Agents) : ✅ [Z] personas validés
- Règle 11 (Densité) : ✅ Optimisée
- Règle 12 (Mermaid) : ✅ [W] schémas ajoutés
- Règle 15 (Rôles) : ✅ RACI respecté

### Règles AGENTS.md (16-18)
- Règle 16 (Interface) : ✅ Synchronisée
- Règle 17 (Bidirectionnalité) : ✅ Conforme
- Règle 18 (Structure) : ✅ Standard respecté

## Corrections Appliquées

### Corrections Automatiques
- Formats standardisés : [NOMBRE]
- Liens bidirectionnels créés : [NOMBRE]
- Fichiers divisés (>500 lignes) : [NOMBRE]
- Index régénérés : [NOMBRE]
- AGENTS.md synchronisé : ✅

### Améliorations Apportées
- Densité sémantique optimisée
- Navigation hiérarchique restaurée
- Cohérence terminologique établie
- Architecture alignée

## État Post-Audit

**Base AI-KIDO** : ✅ Conforme aux 18 règles
**AGENTS.md** : ✅ Synchronisé et conforme
**Navigation** : ✅ Parcours récursif fonctionnel
**Liens** : ✅ Bidirectionnalité complète

## Relations et dépendances

- Référence : [ai-kido.md](../hard_points/ai-kido.md)
- Synchronisé avec : [AGENTS.md](../../AGENTS.md)
- Point d'entrée : [index.md](index.md)
```

## Workflow d'Exécution

### Commande Unique

```bash
analyse-aikido
```

### Séquence d'Exécution Automatique (Optimisée avec Agents 🤖)

1. **Audit structurel** → agent-aikido-explore-bank (DEEP) + Corrections immédiates
2. **Validation contraintes** → agent-aikido-validator (Règles 4, 6, 7)
3. **Validation formats** → Standardisation automatique
4. **Validation post-correction** → agent-aikido-validator (vérification corrections)
5. **Résolution contradictions** → agent-aikido-truth-evaluator (arbitrage)
6. **Validation RACI** → agent-aikido-raci-delegator (cohérence)
7. **Synchronisation AGENTS.md** → Mise à jour automatique
8. **Index et navigation** → Régénération automatique
9. **Validation finale** → agent-aikido-validator (audit complet)
10. **Rapport intégré** → Création dans `/spec/` avec score conformité
11. **Peuplement gaps (opt.)** → agent-aikido-bank-populate si accepté

### Options de Commande

- `analyse-aikido` : Audit complet avec corrections automatiques
- `analyse-aikido --dry-run` : Simulation sans modifications
- `analyse-aikido --report-only` : Génération de rapport uniquement
- `analyse-aikido --sync-agents` : Synchronisation AGENTS.md uniquement

## Phase 9 : Proposition de Peuplement Automatique 🤖

### 9.1 Inventaire des Gaps Détectés

**Compiler la liste complète** des gaps détectés pendant l'audit :

```markdown
📋 GAPS DÉTECTÉS PENDANT L'AUDIT

Documents manquants : [NOMBRE]
- /prompts/gen/concepts/[topic-1].md - Référencé mais absent
- /prompts/gen/techniques/[topic-2].md - Référencé mais absent
...

Documents invalides/dépréciés : [NOMBRE]
- /prompts/gen/concepts/[topic-3].md - Flaggé faux par truth-evaluator
- /prompts/gen/use_cases/[topic-4].md - Déprecié (>6 mois)
...

Contradictions non résolues : [NOMBRE]
- Topic [X] - Code vs Documentation (pas de source autoritaire)
...

Total gaps : [NOMBRE]
```

### 9.2 Proposition de Peuplement

**SI des gaps sont détectés (>0), PROPOSER** :

```markdown
💡 PROPOSITION DE PEUPLEMENT AUTOMATIQUE

L'audit a détecté [NOMBRE] gap(s) dans la Memory Bank.

Voulez-vous invoquer agent-aikido-bank-populate pour combler automatiquement ces gaps ?

L'agent va :
1. Collecter informations depuis code/contexte pour chaque gap
2. Classifier via agent-aikido-raci-delegator
3. Résoudre contradictions via agent-aikido-truth-evaluator
4. Déléguer rédaction aux expert personas appropriés
5. Valider conformité AI-KIDO (≤500 lignes, liens bidirectionnels)
6. Intégrer dans Memory Bank avec mise à jour index

Lancer le peuplement automatique ? (o/n) :
```

**SI utilisateur accepte** : Invoquer `agent-aikido-bank-populate` avec la liste des gaps

**SI utilisateur refuse** : Afficher message "Gaps listés dans le rapport pour action manuelle ultérieure"

## 🤖 Récapitulatif des Agents AI-KIDO Utilisés

Cette commande optimise l'audit en utilisant **4 agents AI-KIDO spécialisés** :

### Phase 1.0 : `agent-aikido-explore-bank` (DEEP MODE)
- **Rôle** : Scan intelligent de la Memory Bank
- **Output** : Inventaire structuré avec métadonnées
- **Tokens** : ~25-40k (DEEP mode)

### Phase 1.2 + 2.3 + 7.2 : `agent-aikido-validator` (3 invocations) 🆕
- **Phase 1.2** : Validation contraintes (Règles 4, 6, 7, frontmatter)
- **Phase 2.3** : Validation post-correction des formats
- **Phase 7.2** : Validation finale complète avant rapport
- **Output** : Rapports conformité concis (✅/❌ par fichier)
- **Tokens** : <2k par validation (optimisé)

### Phase 3.0 : `agent-aikido-raci-delegator`
- **Rôle** : Validation cohérence RACI
- **Output** : Documents à reclasser avec recommandations
- **Tokens** : Optimisé selon nombre de fichiers

### Phase 4.1 : `agent-aikido-truth-evaluator` 🆕
- **Rôle** : Arbitrage des contradictions (specs vs code, docs legacy, etc.)
- **Output** : Arbitrages avec niveau de confiance
- **Tokens** : Optimisé selon nombre de contradictions

### Phase 9 : `agent-aikido-bank-populate` (optionnel)
- **Rôle** : Peuplement automatique des gaps détectés
- **Trigger** : Si utilisateur accepte après inventaire gaps
- **Output** : Documents créés et intégrés dans Memory Bank

### 📊 Gains d'Optimisation

| Aspect | Avant (scripts bash) | Après (agents) | Gain |
|--------|---------------------|----------------|------|
| **Validation contraintes** | Scripts manuels lourds | agent-validator rapide | ~80% tokens |
| **Résolution contradictions** | Manuelle | agent-truth-evaluator auto | 100% automatisé |
| **Validation post-correction** | Absente | agent-validator systématique | +Garantie qualité |
| **Validation finale** | Partielle | agent-validator complète | 100% couverture |
| **Précision** | Détection basique | Classification ML haute précision | +60% précision |

## Résultat Final

```markdown
✅ AUDIT AI-KIDO TERMINÉ

Base AI-KIDO auditée et corrigée :
- Conformité règles 1-18 : [X]%
- Corrections automatiques : [Y] appliquées
- AGENTS.md synchronisé : ✅
- Navigation optimisée : ✅

Gaps détectés : [NOMBRE]
Gaps peuplés automatiquement : [NOMBRE si accepté, 0 si refusé]

Rapport disponible : /prompts/gen/concepts/audit-aikido-[DATE].md

🎯 Memory Bank AI-KIDO maintenue et optimisée !
```

---

**RÈGLES APPLIQUÉES** :

- ✅ **Corrections directes** : Modifications dans `/prompts/gen/` selon règles AI-KIDO
- ✅ **Pas de répertoires d'analyse** : Intégration complète dans la base existante
- ✅ **Synchronisation AGENTS.md** : Conformité règles 16-18
- ✅ **Auto-alimentation** : Capitalisation selon règles établies
- ✅ **Hard Points respectés** : Priorité absolue aux vérités immuables
- ✅ **Format standard** : Conformité au template AI-KIDO
- ✅ **Liens bidirectionnels** : Règle 6 appliquée systématiquement
- ✅ **Navigation hiérarchique** : Parcours récursif depuis index principal
- ✅ **Rapport intégré** : Documentation dans `/spec/` selon standards
- 🤖 **Optimisation agents** : Utilisation de 4 agents AI-KIDO spécialisés pour efficacité maximale
- 🆕 **Validation continue** : agent-validator en 3 points clés (contraintes, post-correction, finale)
- 🆕 **Arbitrage contradictions** : agent-truth-evaluator pour résolution automatique
- 🆕 **Cohérence RACI** : agent-raci-delegator pour classification précise
- 🆕 **Scan intelligent** : agent-explore-bank en DEEP mode pour inventaire complet
