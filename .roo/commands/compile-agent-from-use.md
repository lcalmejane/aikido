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
SEULEMENT MAINTENANT lister `.roo/commands/` et poser :
```
⚡ Analyse des commandes disponibles...

Commandes trouvées dans .roo/commands/ :
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

### Phase 1 : Analyse et Collecte Ciblée
Afficher en temps réel et analyser SEULEMENT les fichiers nécessaires :
```
🔍 ANALYSE CIBLÉE EN COURS...

✓ Lecture /prompts/gen/index.md (point d'entrée obligatoire AI-KIDO)
✓ Extraction hard points depuis /prompts/hard_points/ai-kido.md (contraintes immuables)
✓ Collecte personas sélectionnés depuis /prompts/gen/personas/ (selon choix utilisateur)
✓ Récupération techniques pertinentes depuis /prompts/gen/techniques/ (selon contexte)
✓ Intégration use-cases ciblés depuis /prompts/gen/use_cases/ (selon spécialisation)
✓ Validation cohérence des éléments collectés
```

**Optimisation tokens** : Ne lire que les fichiers strictement nécessaires selon le choix utilisateur, pas de scan exhaustif.

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

### Phase 4 : Validation et Contrôle Qualité
Afficher en temps réel :
```
🔍 VALIDATION EN COURS...

✓ Conformité hard points : Validation absolue et immuable
✓ Format ChatGPT : Template texte formaté (non-markdown)
✓ Complétude personas : Validation consultants avec techniques
✓ Limite optimale : Respect 500 lignes max avec densité maximale
✓ Tests fonctionnels : Validation sur cas d'usage types
```

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
1. **Parcours obligatoire** `/prompts/gen/index.md` (point d'entrée AI-KIDO)
2. **Extraction Hard Points** depuis `/prompts/hard_points/ai-kido.md` (contraintes immuables)
3. **Lecture Personas** depuis `/prompts/gen/personas/[choisis].md` (selon sélection utilisateur)
4. **Collecte Techniques** depuis `/prompts/gen/techniques/` (si pertinentes au contexte)
5. **Intégration Use-Cases** depuis `/prompts/gen/use_cases/[choisi].md` (si sélectionné)

**Économie tokens** : Lecture ciblée uniquement des fichiers nécessaires, pas de scan exhaustif.

### Optimisation Automatique
- **Suppression doublons** : Élimination contenu redondant
- **Compression sémantique** : Fusion concepts similaires
- **Hiérarchisation** : Réorganisation par importance
- **Validation orale** : Test prononçabilité
- **Standardisation** : Unification terminologique

---

*Commande interactive pour créer des agents AI-KIDO personnalisés selon les besoins utilisateur avec compilation automatique optimisée.*
