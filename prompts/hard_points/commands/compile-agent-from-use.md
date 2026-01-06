---
description: "Compilation interactive d'agents AI-KIDO spécialisés avec questionnaire utilisateur"
---

# Commande Compile-Agent-From-Use

Crée interactivement un agent AI-KIDO spécialisé en posant des questions à l'utilisateur pour déterminer le type de compilation souhaité, puis compile automatiquement la base de connaissances avec versioning SEMVER.

## Exécution Interactive

### Étape 1 : Question initiale (SANS SCAN)
Poser directement la **Question 1 : Mode de compilation** SANS analyser aucun fichier :
```
🤖 Bonjour ! Je vais vous aider à compiler un agent AI-KIDO personnalisé.

Sélectionnez le mode de compilation :

1. 📋 Cas existant - Partir d'un agent déjà compilé pour le modifier
2. ⚡ Commande - Analyser une commande .roo existante pour créer l'agent
3. 🎯 Use-case - Créer depuis un cas d'usage AI-KIDO spécifique
4. ✋ Manuel - Configuration manuelle complète

Entrez votre choix (1-4) :
```

### Étape 2 : Analyse ciblée APRÈS le choix

**Si choix = 1 (Cas existant)** :
SEULEMENT MAINTENANT analyser `/out/agents/index.md` et poser :
```
📋 Analyse des agents existants...

Agents disponibles :
[Lister les agents trouvés avec format :]
- agent-[nom]-v[version].md : [description courte]

Sélectionnez l'agent de base (tapez le nom) ou 'nouveau' pour créer un agent différent :
```

**Si choix = 2 (Commande)** :
SEULEMENT MAINTENANT lister `prompts/hard_points/commands/` et poser :
```
⚡ Analyse des commandes disponibles...

Commandes trouvées dans prompts/hard_points/commands/ :
[Lister les fichiers .md trouvés avec format :]
- [nom-commande].md : [première ligne si accessible]

Sélectionnez la commande à analyser (tapez le nom sans .md) :
```

**Si choix = 3 (Use-case)** :
SEULEMENT MAINTENANT lister `/prompts/gen/use_cases/` et poser :
```
🎯 Analyse des cas d'usage disponibles...

Use-cases trouvés dans /prompts/gen/use_cases/ :
[Lister les fichiers .md trouvés avec format :]
- [nom-usecase].md : [première ligne si accessible]

Sélectionnez le cas d'usage (tapez le nom sans .md) ou 'parcourir' pour explorer les sous-dossiers :
```

**Si choix = 4 (Manuel)** :
Poser directement les questions SANS analyser de fichiers :
```
✋ Configuration manuelle étape par étape :

Question A - Nom de l'agent :
Entrez le nom de votre agent (ex: diplomator, analyzer, consultant-rh) :

Question B - Spécialisation :
Décrivez la spécialisation de cet agent (ex: négociation diplomatique, analyse technique, gestion RH) :

Question C - Personas requis :
Quels personas doivent être intégrés ? (séparez par des virgules)
Ou tapez 'auto' pour sélection automatique selon la spécialisation :

Question D - Techniques spécifiques (optionnel) :
Y a-t-il des techniques particulières à intégrer ? (tapez 'auto' pour sélection automatique ou listez-les) :
```

### Étape 3 : Analyse des personas (si nécessaire)
SEULEMENT si l'utilisateur demande la liste des personas disponibles ou choisit 'auto', ALORS analyser `/prompts/gen/personas/` pour proposer les options.

Poser la **Question 2 : Validation des choix**
```
📋 Récapitulatif de votre sélection :

Mode : [mode choisi]
Base : [élément sélectionné]
[Détails spécifiques selon le mode]

Confirmez-vous cette configuration ? (oui/non)
Si non, retour à la question 1.
```

## Processus de Compilation Automatique

Une fois les choix validés, lancer automatiquement :

### Phase 1 : Analyse et Collecte Ciblée 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-explore-bank` pour extraction intelligente :

```markdown
🤖 AGENT: agent-aikido-explore-bank (DEEP MODE)
FORMAT: JSON

**Prompt pour l'agent** :
"Extrais les informations nécessaires pour compiler l'agent AI-KIDO selon la configuration suivante :

Configuration utilisateur :
- Mode : [mode choisi : cas existant/commande/use-case/manuel]
- Base : [élément sélectionné]
- Spécialisation : [spécialisation demandée]
- Personas requis : [liste ou 'auto']
- Techniques : [liste ou 'auto']

Informations à extraire depuis Memory Bank :
1. **Hard Points** : Contraintes immuables depuis /prompts/hard_points/ai-kido.md
2. **Personas** : Descriptions complètes depuis /prompts/gen/personas/ (selon liste ou auto-sélection)
3. **Techniques** : Méthodes pertinentes depuis /prompts/gen/techniques/ (selon contexte spécialisation)
4. **Use-Cases** : Cas d'usage ciblés depuis /prompts/gen/use_cases/ (si pertinents)
5. **Concepts** : Concepts fondamentaux depuis /prompts/gen/concepts/ (si nécessaires)

Auto-sélection intelligente (si 'auto') :
- Négociation/Diplomatie → personas RH + Management + Communication
- Analyse Technique → personas Architecte + Développeur + Sécurité
- Gestion Projet → personas Management + QA + DevOps
- Formation/Pédagogie → personas RH + Communication + Qualité

Pour chaque élément extrait, retourne :
- Contenu complet optimisé pour compilation
- Source (fichier)
- Pertinence par rapport à la spécialisation (HIGH/MEDIUM/LOW)

Retourne un rapport structuré JSON ou Markdown avec tous les éléments extraits, organisés par catégorie."

**Résultat attendu** : Package complet des éléments nécessaires à la compilation
```

Afficher en temps réel :
```
🔍 ANALYSE CIBLÉE EN COURS (agent-aikido-explore-bank)...

✓ Extraction hard points depuis /prompts/hard_points/ai-kido.md
✓ Collecte personas sélectionnés (auto-sélection ou liste utilisateur)
✓ Récupération techniques pertinentes (selon spécialisation)
✓ Intégration use-cases ciblés (selon contexte)
✓ Validation cohérence des éléments collectés
✓ Package compilation prêt
```

**Avantages de l'agent** :
- ✅ Extraction intelligente multi-sources
- ✅ Auto-sélection personas selon spécialisation
- ✅ Collecte ciblée (pas de scan exhaustif)
- ✅ Gain : ~60% tokens vs lecture manuelle

### Phase 2 : Optimisation Sémantique Avancée
Afficher en temps réel :
```
⚡ OPTIMISATION EN COURS...

✓ Densité maximale : Élimination redondances et doublons sémantiques
✓ Hiérarchisation intelligente : Réorganisation par importance/fréquence
✓ Compression sémantique : Fusion concepts similaires sans perte
✓ Validation orale : Test prononçabilité et fluidité
✓ Cohérence terminologique : Unification vocabulaire
✓ Suppression historique : Élimination éléments non-opérationnels
```

### Phase 3 : Calcul Version SEMVER
Afficher en temps réel :
```
📊 VERSIONING EN COURS...

✓ Vérification agents existants dans /out/agents/
✓ Analyse différentielle avec version précédente (si applicable)
✓ Classification automatique des changements
✓ Calcul version selon règles SEMVER strictes
✓ Génération nomenclature agent-[usage]-vX.Y.Z.md
```

### Phase 4 : Validation et Contrôle Qualité 🤖 🆕

**UTILISER L'AGENT** `agent-aikido-validator` pour validation conformité :

```markdown
🤖 AGENT: agent-aikido-validator
FORMAT: JSON

**Prompt pour l'agent** :
"Valide l'agent compilé contre les règles AI-KIDO avant finalisation.

Fichier à valider : /out/agents/agent-[usage]-v[X.Y.Z].md (temporaire)

Validation conformité spécifique agents compilés :
1. Règle 4 : Contraintes lignes (≤500 lignes pour agents compilés)
2. Règle 11 : Densité sémantique maximale (élimination redondances)
3. Hard Points : Conformité absolue et immuable
4. Complétude personas : Tous personas déclarés sont intégrés
5. Techniques cohérentes : Pas de techniques contradictoires
6. Format ChatGPT : Template texte formaté (non-markdown brut)
7. Tests fonctionnels : Validation sur cas d'usage types

Pour chaque violation détectée, retourne :
- Violation + ligne concernée
- Sévérité (CRITIQUE/MAJEURE/MINEURE)
- Quick fix actionnable

Génère score conformité :
- Contraintes lignes : ✅/❌ (X/500 lignes)
- Densité sémantique : [POURCENTAGE]%
- Hard points validés : X/X ✅
- Complétude personas : ✅/❌
- Format ChatGPT : ✅/❌
- Score global : [POURCENTAGE]%

Mode optimisé : <3k tokens."

**Résultat attendu** : Score conformité + violations éventuelles avec quick fixes
```

Afficher en temps réel :
```
🔍 VALIDATION EN COURS (agent-aikido-validator)...

✓ Conformité hard points : Validation absolue et immuable
✓ Format ChatGPT : Template texte formaté (non-markdown)
✓ Complétude personas : Validation consultants avec techniques
✓ Limite optimale : Respect 500 lignes max avec densité maximale
✓ Tests fonctionnels : Validation sur cas d'usage types
✓ Score conformité : [X]%
```

**Avantages de l'agent** :
- ✅ Validation systématique conformité AI-KIDO
- ✅ Score conformité immédiat
- ✅ Détection violations avant finalisation
- ✅ Quick fixes si problèmes détectés

**Si score < 90%** : Afficher violations et proposer corrections automatiques avant Phase 5
**Si score ≥ 90%** : Continuer vers Phase 5 (Finalisation)

### Phase 5 : Génération et Finalisation
Afficher en temps réel :
```
🎯 FINALISATION EN COURS...

✓ Génération fichier /out/agents/agent-[usage]-vX.Y.Z.md
✓ Mise à jour automatique /out/agents/index.md
✓ Création rapport /out/agents/reports/[usage]-vX.Y.Z-report.md
✓ Logs traçabilité avec timestamps détaillés
✓ Archivage version précédente (si applicable)
```

## Format de Sortie Agent Compilé

### Structure Standard
```markdown
# Agent [Usage] - Version [X.Y.Z]

## Configuration
- **Spécialisation** : [Domaine d'expertise]
- **Personas Intégrés** : [Liste des consultants]
- **Techniques Appliquées** : [Méthodes utilisées]
- **Hard Points Respectés** : [Contraintes validées]

## Prompt Système Optimisé
[Prompt unifié et optimisé pour ChatGPT]

## Personas Consultants

### [Persona 1]
[Description et expertise condensée]

### [Persona 2] 
[Description et expertise condensée]

### [Persona 3]
[Description et expertise condensée]

## Techniques Avancées
[Méthodes de reformulation et persuasion intégrées]

## Workflow Opérationnel
[Processus step-by-step pour l'usage]

## Cas d'Usage Types
[Exemples d'application concrets]

## Validation et Métriques
- **Densité sémantique** : [Score]%
- **Cohérence terminologique** : [Score]%  
- **Facilité orale** : [Score]%
- **Complétude fonctionnelle** : [Score]%

---
*Agent compilé le [timestamp] depuis AI-KIDO v[version]*
```

## Résultat Final

Afficher le message de succès :
```
✅ Agent [usage] v[X.Y.Z] compilé avec succès !

📁 Fichiers créés/modifiés :
- /out/agents/agent-[usage]-v[X.Y.Z].md (agent compilé)
- /out/agents/index.md (index mis à jour)
- /out/agents/reports/[usage]-v[X.Y.Z]-report.md (rapport détaillé)

📊 Métriques finales :
- Taille : [X] lignes (limite 500)
- Densité sémantique : [X]%
- Personas intégrés : [X]
- Techniques appliquées : [X]
- Hard points validés : [X]/[X]

🚀 Statut : PRÊT pour déploiement ChatGPT autonome

💡 Prochaines étapes suggérées :
- Testez l'agent avec des cas d'usage réels
- Collectez les retours utilisateurs pour la prochaine version
- Utilisez /update-agent [usage] pour les améliorations futures
```

## Gestion des Erreurs

### Erreurs de Saisie Utilisateur
- **Choix invalide** : Redemander avec options valides
- **Fichier inexistant** : Proposer alternatives disponibles
- **Configuration incomplète** : Guider vers saisie manquante

### Erreurs de Compilation
- **Hard Points violés** : Arrêt avec explication détaillée
- **Personas manquants** : Proposition création automatique
- **Limite 500 lignes dépassée** : Optimisation forcée ou alerte
- **Techniques incompatibles** : Résolution automatique ou choix utilisateur

### Messages d'Erreur Types
```
❌ ERREUR : [Type d'erreur]

Détail : [Explication claire du problème]
Solution : [Action recommandée]

Voulez-vous :
1. Réessayer avec correction automatique
2. Modifier votre sélection
3. Annuler la compilation
```

## Algorithmes de Compilation

### Stratégie d'Optimisation Tokens

**RÈGLE FONDAMENTALE** : Ne jamais analyser de fichiers avant que l'utilisateur ait fait ses choix.

**Séquence optimisée** :
1. **Question initiale** → AUCUN scan de fichiers
2. **Choix utilisateur** → Analyse SEULEMENT des répertoires pertinents
3. **Sélection spécifique** → Lecture SEULEMENT des fichiers choisis
4. **Compilation** → Traitement SEULEMENT du contenu nécessaire

### Sélection Automatique Personas (si 'auto' choisi)
Selon la spécialisation demandée, sélectionner automatiquement :
- **Négociation/Diplomatie** → Consultant RH + Expert Management + Spécialiste Communication
- **Analyse Technique** → Architecte + Développeur + Expert Sécurité
- **Gestion Projet** → Expert Management + QA Engineer + DevOps Engineer
- **Formation/Pédagogie** → Consultant RH + Spécialiste Communication + Expert Qualité

### Collecte Intelligente Contenu (phase compilation uniquement)

**Remplacé par agent-aikido-explore-bank (Phase 1)** qui gère automatiquement :
1. **Parcours obligatoire** `/prompts/index.md` (point d'entrée AI-KIDO)
2. **Extraction Hard Points** depuis `/prompts/hard_points/ai-kido.md` (contraintes immuables)
3. **Lecture Personas** depuis `/prompts/gen/personas/[choisis].md` (selon sélection ou auto)
4. **Collecte Techniques** depuis `/prompts/gen/techniques/` (si pertinentes au contexte)
5. **Intégration Use-Cases** depuis `/prompts/gen/use_cases/[choisi].md` (si sélectionné)

**Économie tokens** : Lecture ciblée uniquement des fichiers nécessaires, pas de scan exhaustif.

### Optimisation Automatique
- **Suppression doublons** : Élimination contenu redondant
- **Compression sémantique** : Fusion concepts similaires
- **Hiérarchisation** : Réorganisation par importance
- **Validation orale** : Test prononçabilité
- **Standardisation** : Unification terminologique

## 🤖 Récapitulatif des Agents AI-KIDO Utilisés

Cette commande optimise la compilation d'agents spécialisés en utilisant **2 agents AI-KIDO** :

### Phase 1 : `agent-aikido-explore-bank` (DEEP MODE) 🆕
- **Rôle** : Extraction intelligente des éléments nécessaires (hard-points, personas, techniques, use-cases)
- **Output** : Package compilation complet avec pertinence de chaque élément
- **Tokens** : ~25-40k (DEEP mode, selon complexité)
- **Gain** : ~60% tokens vs lecture manuelle multi-fichiers
- **Auto-sélection** : Sélection intelligente personas selon spécialisation si mode 'auto'

### Phase 4 : `agent-aikido-validator` 🆕
- **Rôle** : Validation conformité AI-KIDO de l'agent compilé avant finalisation
- **Output** : Score conformité avec violations éventuelles et quick fixes
- **Tokens** : <3k
- **Gain** : Garantie qualité + détection précoce violations
- **Validations** : Contraintes lignes, densité sémantique, hard points, complétude, format ChatGPT

### 📊 Gains d'Optimisation

| Aspect | Avant (manuel) | Après (agents) | Gain |
|--------|----------------|----------------|------|
| **Extraction personas/techniques** | Lecture manuelle multi-fichiers | agent-explore-bank auto | ~60% tokens |
| **Auto-sélection personas** | Manuelle utilisateur | agent-explore-bank intelligent | Automatisé |
| **Validation conformité** | Manuelle ou absente | agent-validator systématique | +Garantie qualité |
| **Détection violations** | Post-finalisation | Phase 4 pré-finalisation | Correction précoce |
| **Workflow global** | ~80k tokens | ~45k tokens | ~45% efficacité |

---

*Commande interactive pour créer des agents AI-KIDO personnalisés selon les besoins utilisateur avec compilation automatique optimisée par agents spécialisés.*
