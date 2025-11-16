# Commande AI-KIDO : Analyse et Audit Hebdomadaire

> **Objectif** : Audit complet des tables de vérités AI-KIDO pour détecter dérivations, incohérences et liens cassés
>
> **Usage** : `analyse-aikido` - Commande de maintenance hebdomadaire ou post-ingestion
>
> **Contexte** : Redressage préventif de la base AI-KIDO pour éviter les dérivations

## Vue d'ensemble

Cette commande effectue un audit complet des tables de vérités dans `/prompts/gen/` et `/prompts/hard_points/`, détecte les incohérences, liens cassés et dérivations par rapport aux règles AI-KIDO, puis propose des corrections avec choix utilisateur pour maintenir la cohérence de la memory bank.

## Phase 1 : Sauvegarde de l'État Actuel

### 1.1 Création du Snapshot d'Analyse

**Générer un état de référence** pour comparaison future :

```bash
# Création du répertoire d'état si inexistant
mkdir -p /prompts/spec/analysis-states/
```

**Créer le fichier d'état** `/prompts/spec/analysis-states/state-[TIMESTAMP].json` :
```json
{
  "timestamp": "YYYY-MM-DD HH:MM:SS",
  "version": "1.0",
  "analysis_type": "weekly_audit",
  "files_analyzed": {
    "gen": {
      "concepts": ["liste des fichiers .md"],
      "techniques": ["liste des fichiers .md"],
      "use_cases": ["liste des fichiers .md"],
      "personas": ["liste des fichiers .md"]
    },
    "hard_points": {
      "root": ["ai-kido.md", "index.md", "gestion-logs-aikido.md"],
      "concepts": ["liste des fichiers .md"],
      "techniques": ["liste des fichiers .md"],
      "use_cases": ["liste des fichiers .md"]
    }
  },
  "metrics": {
    "total_files": 0,
    "total_lines": 0,
    "total_links": 0,
    "files_over_500_lines": [],
    "orphan_links": [],
    "inconsistencies": []
  },
  "rules_compliance": {
    "rule_1_to_15": {}
  }
}
```

### 1.2 Chargement de l'État Précédent

**Si état précédent existe**, charger le dernier fichier d'état pour comparaison :
```markdown
📊 ÉTAT PRÉCÉDENT DÉTECTÉ

Dernière analyse : [DATE] ([NOMBRE] jours)
Fichiers analysés : [NOMBRE]
Incohérences détectées : [NOMBRE]
Corrections appliquées : [NOMBRE]

Continuer avec comparaison différentielle ? (o/n)
```

## Phase 2 : Audit Complet des Tables de Vérités

### 2.1 Analyse Structurelle des Répertoires

#### A. Vérification de la Structure Obligatoire AI-KIDO

**Valider la présence** des répertoires selon [`ai-kido.md`](../prompts/hard_points/ai-kido.md) lignes 76-102 :

```markdown
🔍 AUDIT STRUCTUREL

Structure obligatoire AI-KIDO :
✅ /prompts/gen/index.md (point d'entrée principal)
✅ /prompts/gen/concepts/ (concepts fondamentaux)
✅ /prompts/gen/techniques/ (méthodes pratiques)
✅ /prompts/gen/personas/ (prompts par rôle)
✅ /prompts/gen/use_cases/ (applications par contexte)
✅ /prompts/hard_points/index.md (point d'entrée hard points)
✅ /prompts/hard_points/ai-kido.md (règles fondamentales)

Répartition par rôles (Règle 15) :
✅ /prompts/gen/concepts/roles/ (sous-répertoires par rôle)
✅ /prompts/gen/techniques/roles/ (sous-répertoires par rôle)
✅ /prompts/gen/use_cases/roles/ (sous-répertoires par rôle)

❌ Répertoires manquants détectés : [LISTE]
⚠️ Répertoires non conformes : [LISTE]
```

#### B. Validation des Contraintes d'Équilibrage

**Vérifier les contraintes** selon règle 7 (lignes 31) :
- **Facteur d'équilibrage** : 3-7 enfants par parent
- **Profondeur maximale** : ≤ 4 niveaux
- **Contrainte 500 lignes** : Aucun fichier > 500 lignes

```bash
# Vérification automatique des contraintes
find /prompts/gen -name "*.md" -exec wc -l {} \; | awk '$1 > 500 {print "❌ " $2 " : " $1 " lignes (> 500)"}'
```

### 2.2 Audit des Fichiers Individuels

#### A. Validation du Format Standard

**Pour chaque fichier .md**, vérifier la conformité au format AI-KIDO (lignes 136-167) :

```markdown
📋 FORMAT STANDARD REQUIS :

# [Titre du Concept/Composant]
> Version: X.Y | Date: YYYY-MM-DD | Statut: [Statut]

## Vue d'ensemble
## Définitions clés
## Principes directeurs
## Spécifications techniques
## Exemples d'application
## Relations et dépendances
```

**Détecter les non-conformités** :
- ❌ Métadonnées manquantes (Version, Date, Statut)
- ❌ Sections obligatoires absentes
- ❌ Format de titre incorrect
- ❌ Liens de navigation manquants

#### B. Validation des Règles AI-KIDO (1-15)

**Vérifier l'application** de chaque règle dans les fichiers :

##### Règle 1 : Arborescence Documentaire
- ✅ Parcours récursif depuis `/prompts/gen/index.md`
- ✅ Navigation hiérarchique cohérente

##### Règle 2 : Séparation Théorie/Pratique
- ✅ `concepts/` + `personas/` (théorie)
- ✅ `techniques/` + `use_cases/` (pratique)

##### Règle 4 : Contrainte 500 Lignes
- ✅ Aucun fichier > 500 lignes
- ❌ Fichiers à diviser : [LISTE]

##### Règle 6 : Liens Bidirectionnels
- ✅ Chaînage A ↔ B systématique
- ❌ Liens orphelins détectés : [LISTE]

##### Règle 15 : Répartition par Rôles Humains
- ✅ Sous-répertoires par rôle créés
- ✅ Responsabilités assignées selon RACI
- ❌ Rôles non assignés : [LISTE]

### 2.3 Détection des Liens Cassés

#### A. Analyse des Références Internes

**Scanner tous les liens** dans les fichiers .md :
```bash
# Extraction automatique des liens markdown
grep -r "\[.*\](.*)" /prompts/gen/ /prompts/hard_points/ | grep -v "http"
```

**Vérifier l'existence** des fichiers référencés :
```markdown
🔗 AUDIT DES LIENS INTERNES

Liens analysés : [NOMBRE]
Liens valides : [NOMBRE] ✅
Liens cassés : [NOMBRE] ❌

Liens cassés détectés :
- [fichier.md:ligne] → [lien_cassé.md] (fichier inexistant)
- [fichier.md:ligne] → [lien_cassé.md#section] (section inexistante)
- [fichier.md:ligne] → [../chemin/invalide.md] (chemin incorrect)
```

#### B. Validation des Liens Bidirectionnels

**Vérifier la réciprocité** des liens selon règle 6 :
```markdown
🔄 AUDIT BIDIRECTIONNALITÉ

Liens unidirectionnels détectés :
- A.md → B.md ✅ mais B.md ↛ A.md ❌
- C.md → D.md ✅ mais D.md ↛ C.md ❌

Actions requises :
- [ ] Ajouter lien retour B.md → A.md
- [ ] Ajouter lien retour D.md → C.md
```

## Phase 3 : Détection des Incohérences

### 3.1 Incohérences Terminologiques

#### A. Analyse du Glossaire vs Usage

**Comparer les définitions** entre :
- [`/prompts/gen/concepts/glossaire-projet.md`](../prompts/gen/concepts/glossaire-projet.md) (si existant)
- Usage dans les autres fichiers de la base

```markdown
📚 AUDIT TERMINOLOGIQUE

Termes définis dans le glossaire : [NOMBRE]
Termes utilisés dans la base : [NOMBRE]

Incohérences détectées :
❌ Terme "X" défini comme "A" dans glossaire mais utilisé comme "B" dans [fichier.md]
❌ Terme "Y" utilisé dans [fichier1.md] mais non défini dans le glossaire
❌ Terme "Z" défini différemment dans [fichier1.md] et [fichier2.md]

Termes orphelins (définis mais non utilisés) : [LISTE]
Termes manquants (utilisés mais non définis) : [LISTE]
```

#### B. Cohérence des Acronymes et Abréviations

**Vérifier l'usage uniforme** des acronymes :
```markdown
🔤 AUDIT DES ACRONYMES

Acronymes détectés : [LISTE]
Usage cohérent : [NOMBRE] ✅
Usage incohérent : [NOMBRE] ❌

Incohérences :
- "API" utilisé tantôt comme "Application Programming Interface" tantôt comme "Interface de Programmation"
- "DB" vs "BDD" utilisés pour désigner la base de données
```

### 3.2 Incohérences Architecturales

#### A. Cohérence entre Architecture et Implémentation

**Comparer** [`/prompts/gen/concepts/architecture-systeme.md`](../prompts/gen/concepts/architecture-systeme.md) avec [`/prompts/gen/techniques/stack-technique.md`](../prompts/gen/techniques/stack-technique.md) :

```markdown
🏗️ AUDIT ARCHITECTURAL

Architecture déclarée vs Stack technique :
✅ Frontend React cohérent avec architecture SPA
❌ Backend déclaré "microservices" mais stack technique monolithique
❌ Base de données PostgreSQL en architecture mais MongoDB en stack

Composants architecturaux vs Use cases :
✅ Composant "Authentification" présent dans use cases
❌ Composant "Notification" absent des use cases
```

#### B. Cohérence des Diagrammes Mermaid

**Valider la syntaxe et cohérence** des schémas :
```bash
# Validation syntaxique des diagrammes Mermaid
grep -A 20 "```mermaid" /prompts/gen/**/*.md | mermaid-cli validate
```

### 3.3 Incohérences de Versioning

#### A. Cohérence des Versions

**Vérifier la cohérence** des métadonnées de version :
```markdown
📊 AUDIT DES VERSIONS

Versions détectées : [PLAGE]
Fichiers à jour : [NOMBRE] ✅
Fichiers obsolètes : [NOMBRE] ❌

Incohérences de versioning :
❌ [fichier1.md] version 1.0 mais référence [fichier2.md] version 2.1
❌ [fichier3.md] date 2024-01-01 mais modifié le 2024-06-15
❌ [fichier4.md] statut "Initial" mais version 3.2
```

#### B. Cohérence des Dates

**Vérifier la chronologie** des modifications :
```markdown
📅 AUDIT CHRONOLOGIQUE

Dates incohérentes détectées :
❌ [fichier.md] date métadonnée 2024-01-01 mais git last-modified 2024-06-15
❌ [parent.md] modifié avant [enfant.md] qui le référence
```

## Phase 4 : Comparaison avec l'État Précédent

### 4.1 Analyse Différentielle

**Si état précédent disponible**, comparer les changements :

```markdown
📈 ÉVOLUTION DEPUIS DERNIÈRE ANALYSE ([DATE])

Nouveaux fichiers : [NOMBRE]
- [liste des nouveaux fichiers]

Fichiers modifiés : [NOMBRE]
- [liste avec dates de modification]

Fichiers supprimés : [NOMBRE]
- [liste des fichiers supprimés]

Nouvelles incohérences : [NOMBRE]
Incohérences résolues : [NOMBRE]
Incohérences persistantes : [NOMBRE]
```

### 4.2 Détection des Dérivations Majeures

**Identifier les changements significatifs** :

#### A. Dérivations Structurelles
- Nouveaux répertoires non conformes à la règle 15
- Suppression de répertoires obligatoires
- Modification de la hiérarchie sans validation

#### B. Dérivations Conceptuelles
- Redéfinition de termes du glossaire sans versioning
- Modification d'architecture sans mise à jour des use cases
- Changement de stack technique sans impact sur les concepts

#### C. Dérivations de Processus
- Non-respect des règles RACI dans les nouveaux fichiers
- Création de contenu sans assignation de responsabilité
- Modification de hard_points sans validation

```markdown
🚨 DÉRIVATIONS MAJEURES DÉTECTÉES

Dérivations Structurelles :
❌ Nouveau répertoire /prompts/gen/custom/ non conforme à la règle 15
❌ Suppression du répertoire /prompts/gen/concepts/roles/

Dérivations Conceptuelles :
❌ Terme "Microservice" redéfini sans versioning dans [fichier.md]
❌ Architecture modifiée mais use cases non mis à jour

Dérivations de Processus :
❌ Fichiers créés sans assignation RACI
❌ Hard point modifié sans validation
```

## Phase 5 : Propositions de Corrections

### 5.1 Corrections Automatiques Proposées

#### A. Liens Cassés
```markdown
🔧 CORRECTIONS AUTOMATIQUES PROPOSÉES

Liens cassés - Actions suggérées :
1. [fichier.md:12] → [lien_cassé.md]
   ✅ Correction automatique : Créer fichier manquant avec template
   ✅ Correction manuelle : Corriger le lien vers [fichier_existant.md]
   
2. [fichier.md:25] → [../chemin/invalide.md]
   ✅ Correction automatique : Corriger le chemin vers [../chemin/valide.md]

Appliquer les corrections automatiques ? (o/n)
```

#### B. Format Standard
```markdown
📋 CORRECTIONS DE FORMAT

Fichiers non conformes au format standard :
1. [fichier1.md] - Métadonnées manquantes
   ✅ Ajouter automatiquement : > Version: 1.0 | Date: [DATE] | Statut: Initial
   
2. [fichier2.md] - Section "Relations et dépendances" manquante
   ✅ Ajouter automatiquement la section avec template

Appliquer les corrections de format ? (o/n)
```

### 5.2 Résolution des Incohérences avec Choix Utilisateur

#### A. Incohérences Terminologiques

**Pour chaque incohérence détectée**, proposer les options :

```markdown
❓ RÉSOLUTION D'INCOHÉRENCE TERMINOLOGIQUE

Terme : "API"
Définition A (glossaire) : "Application Programming Interface"
Définition B ([fichier.md]) : "Interface de Programmation d'Application"

Quelle définition conserver ?
1. Conserver définition A (glossaire) et corriger [fichier.md]
2. Conserver définition B ([fichier.md]) et corriger le glossaire
3. Créer nouvelle définition unifiée (précisez)
4. Ignorer cette incohérence

Votre choix (1/2/3/4) :
```

#### B. Incohérences Architecturales

```markdown
❓ RÉSOLUTION D'INCOHÉRENCE ARCHITECTURALE

Incohérence : Backend déclaré "microservices" mais stack technique "monolithique"

Quelle vérité conserver ?
1. Architecture = microservices → Mettre à jour la stack technique
2. Stack = monolithique → Mettre à jour l'architecture
3. Situation transitoire → Documenter la migration en cours
4. Ignorer cette incohérence

Votre choix (1/2/3/4) :
```

#### C. Incohérences de Versioning

```markdown
❓ RÉSOLUTION D'INCOHÉRENCE DE VERSION

Fichier : [fichier.md]
Version métadonnée : 1.0 (2024-01-01)
Dernière modification git : 2024-06-15

Action à effectuer ?
1. Mettre à jour les métadonnées avec la date git
2. Conserver les métadonnées et ignorer git
3. Créer nouvelle version 1.1 avec date actuelle
4. Ignorer cette incohérence

Votre choix (1/2/3/4) :
```

### 5.3 Corrections des Dérivations

#### A. Redressage Structurel

```markdown
🏗️ REDRESSAGE STRUCTUREL PROPOSÉ

Dérivation : Répertoire non conforme /prompts/gen/custom/

Actions possibles :
1. Supprimer le répertoire et redistribuer le contenu selon la règle 15
2. Renommer en /prompts/gen/concepts/roles/custom/ (si rôle valide)
3. Déplacer vers /prompts/spec/ (espace personnel)
4. Conserver et documenter l'exception

Votre choix (1/2/3/4) :
```

#### B. Redressage Conceptuel

```markdown
💡 REDRESSAGE CONCEPTUEL PROPOSÉ

Dérivation : Architecture modifiée sans mise à jour des use cases

Actions possibles :
1. Mettre à jour automatiquement les use cases selon la nouvelle architecture
2. Revenir à l'architecture précédente
3. Créer nouveaux use cases et marquer les anciens comme obsolètes
4. Laisser en l'état et documenter l'incohérence

Votre choix (1/2/3/4) :
```

## Phase 6 : Application des Corrections

### 6.1 Exécution des Corrections Automatiques

**Appliquer les corrections approuvées** :

```markdown
⚙️ APPLICATION DES CORRECTIONS

Corrections automatiques en cours :
✅ [12/15] Liens cassés corrigés
✅ [8/10] Formats standardisés
✅ [5/7] Métadonnées mises à jour

Corrections manuelles appliquées :
✅ Incohérence terminologique "API" résolue (choix 1)
✅ Architecture microservices confirmée, stack mise à jour
✅ Répertoire /custom/ déplacé vers /concepts/roles/custom/
```

### 6.2 Génération des Fichiers de Correction

#### A. Création des Fichiers Manquants

**Pour les liens cassés**, créer les fichiers avec template AI-KIDO :

```markdown
# [Titre Généré]
> Version: 1.0 | Date: [DATE] | Statut: À Compléter

## Vue d'ensemble
[À compléter - Fichier généré automatiquement par analyse-aikido]

## Définitions clés
[À définir]

## Principes directeurs
[À documenter]

## Spécifications techniques
[À spécifier]

## Exemples d'application
[À fournir]

## Relations et dépendances
- Référencé par : [liste des fichiers qui pointent vers celui-ci]

---
*Généré automatiquement par analyse-aikido le [DATE] - À compléter*
```

#### B. Mise à Jour des Index

**Mettre à jour automatiquement** tous les fichiers d'index :
- `/prompts/gen/index.md`
- `/prompts/gen/concepts/index.md`
- `/prompts/gen/techniques/index.md`
- `/prompts/gen/use_cases/index.md`
- `/prompts/gen/personas/index.md`

### 6.3 Validation Post-Correction

**Re-exécuter les vérifications** sur les éléments corrigés :

```markdown
✅ VALIDATION POST-CORRECTION

Liens cassés : 0 (était 15)
Incohérences terminologiques : 2 (était 8)
Incohérences architecturales : 0 (était 3)
Fichiers non conformes : 1 (était 12)
Dérivations majeures : 0 (était 5)

Nouvelles incohérences introduites : 0
Corrections réussies : 95%
Corrections nécessitant intervention manuelle : 2
```

## Phase 7 : Génération du Rapport d'Audit

### 7.1 Rapport Complet d'Analyse

**Créer** `/prompts/spec/analysis-reports/audit-[TIMESTAMP].md` :

```markdown
# Rapport d'Audit AI-KIDO - [DATE]

## Résumé Exécutif

**Statut global** : [EXCELLENT/BON/MOYEN/CRITIQUE]
**Score de conformité** : [X]% (était [Y]% à la dernière analyse)
**Dérivations critiques** : [NOMBRE]
**Actions correctives appliquées** : [NOMBRE]

## Métriques Détaillées

### Structure et Format
- Fichiers analysés : [NOMBRE]
- Conformité format standard : [X]%
- Contrainte 500 lignes : [Y] violations
- Arbre équilibré : [Z]% conforme

### Cohérence et Liens
- Liens totaux : [NOMBRE]
- Liens cassés : [NOMBRE] (corrigés : [NOMBRE])
- Bidirectionnalité : [X]% conforme
- Incohérences terminologiques : [NOMBRE]

### Règles AI-KIDO (1-15)
- Règle 1 (Arborescence) : ✅/❌
- Règle 2 (Séparation) : ✅/❌
- ...
- Règle 15 (Rôles) : ✅/❌

## Évolution depuis Dernière Analyse

### Améliorations
- [Liste des améliorations détectées]

### Régressions
- [Liste des régressions détectées]

### Nouvelles Dérivations
- [Liste des nouvelles dérivations]

## Actions Correctives Appliquées

### Corrections Automatiques
- [Détail des corrections automatiques]

### Corrections Manuelles
- [Détail des choix utilisateur et corrections manuelles]

### Corrections Reportées
- [Liste des corrections nécessitant intervention ultérieure]

## Recommandations

### Actions Immédiates
- [ ] [Action 1 - Priorité Haute]
- [ ] [Action 2 - Priorité Haute]

### Actions à Moyen Terme
- [ ] [Action 3 - Priorité Moyenne]
- [ ] [Action 4 - Priorité Moyenne]

### Améliorations Suggérées
- [ ] [Amélioration 1]
- [ ] [Amélioration 2]

## Prochaine Analyse

**Date recommandée** : [DATE + 7 jours]
**Focus suggéré** : [Domaines nécessitant surveillance]
**Seuils d'alerte** : [Métriques à surveiller]

---
*Généré par analyse-aikido le [DATE]*
```

### 7.2 Mise à Jour de l'État de Référence

**Sauvegarder le nouvel état** après corrections :

```json
{
  "timestamp": "YYYY-MM-DD HH:MM:SS",
  "version": "1.1",
  "analysis_type": "weekly_audit_corrected",
  "corrections_applied": {
    "automatic": 15,
    "manual": 8,
    "deferred": 2
  },
  "metrics_post_correction": {
    "conformity_score": 95,
    "broken_links": 0,
    "inconsistencies": 2,
    "major_deviations": 0
  },
  "next_analysis_recommended": "YYYY-MM-DD"
}
```

## Phase 8 : Planification de la Prochaine Analyse

### 8.1 Définition des Seuils d'Alerte

**Configurer les seuils** pour déclenchement automatique :

```markdown
🚨 SEUILS D'ALERTE CONFIGURÉS

Déclenchement automatique si :
- Score de conformité < 80%
- Liens cassés > 10
- Incohérences > 15
- Fichiers > 500 lignes > 5
- Dérivations majeures > 2

Notification recommandée si :
- Score de conformité < 90%
- Nouvelles incohérences > 5
- Fichiers non conformes > 10
```

### 8.2 Recommandations de Fréquence

```markdown
📅 FRÉQUENCE D'ANALYSE RECOMMANDÉE

Basé sur l'activité détectée :
- **Haute activité** (>20 modifications/semaine) : Analyse bi-hebdomadaire
- **Activité normale** (5-20 modifications/semaine) : Analyse hebdomadaire
- **Faible activité** (<5 modifications/semaine) : Analyse bi-mensuelle

Déclencheurs spéciaux :
- Après ingestion massive de données
- Après modification des hard_points
- Avant releases importantes
- Après onboarding nouveaux membres équipe
```

## Résultat Final

```markdown
✅ AUDIT AI-KIDO TERMINÉ

Analyse effectuée sur :
- [X] fichiers dans /prompts/gen/
- [Y] fichiers dans /prompts/hard_points/
- [Z] liens internes vérifiés
- AGENTS.md audité et synchronisé ✅

Corrections appliquées :
- [A] corrections automatiques
- [B] corrections manuelles avec choix utilisateur
- [C] corrections reportées

État de la base :
- Score de conformité : [X]% (objectif : >90%)
- Dérivations critiques : [Y] (objectif : 0)
- Liens cassés : [Z] (objectif : 0)
- Cohérence AGENTS.md : [W]% (objectif : >95%)

Prochaine analyse recommandée : [DATE]

🎯 Base AI-KIDO auditée et redressée avec succès !
```

## Modes d'Exécution

### Options de Commande

- `analyse-aikido --full` : Audit complet (défaut)
- `analyse-aikido --links-only` : Vérification des liens uniquement
- `analyse-aikido --format-only` : Vérification du format uniquement
- `analyse-aikido --diff-only` : Comparaison avec état précédent uniquement
- `analyse-aikido --auto-fix` : Application automatique des corrections sans confirmation
- `analyse-aikido --dry-run` : Simulation sans modifications
- `analyse-aikido --report-only` : Génération de rapport sans corrections

### Intégration Automatique

- **Cron hebdomadaire** : Exécution automatique chaque dimanche
- **Hook post-commit** : Vérification légère après chaque commit
- **CI/CD Pipeline** : Intégration dans les pipelines de déploiement
- **Notification Slack/Teams** : Alertes automatiques si seuils dépassés

---

**RÈGLES APPLIQUÉES** :
- ✅ **Audit complet** : Vérification de toutes les règles AI-KIDO (1-15)
- ✅ **Cohérence AGENTS.md** : Synchronisation avec personas, RACI et contexte projet
- ✅ **Détection proactive** : Identification des dérivations avant qu'elles ne s'aggravent
- ✅ **Choix utilisateur** : Résolution interactive des incohérences
- ✅ **Corrections automatiques** : Redressage intelligent des problèmes simples
- ✅ **Traçabilité** : Sauvegarde des états et historique des corrections
- ✅ **Prévention** : Seuils d'alerte et recommandations de fréquence
- ✅ **Intégration Git** : Hooks et pipelines pour maintenance continue
- ✅ **Rapports détaillés** : Documentation complète des audits et corrections
