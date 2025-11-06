# Hard Points - Techniques Pratiques

> **Statut**: Hard Points - Vérités immuables
> **Priorité**: Absolue - Ne peuvent être remises en question

## Vue d'ensemble

Ce répertoire contient les **méthodes pratiques validées** qui ont été promues au statut de Hard Points dans le système AI‑KIDO. Ces techniques constituent des approches immuables qui ont fait leurs preuves et ne peuvent être modifiées sans validation explicite.

## Règles de Promotion

Une technique devient Hard Point quand :

1. **Efficacité Prouvée** : La technique a démontré son efficacité dans des contextes critiques
2. **Reproductibilité** : Résultats constants sur 5+ implémentations différentes
3. **Robustesse** : Résistance aux variations de contexte et d'environnement
4. **Impact Critique** : La technique est essentielle au fonctionnement du système
5. **Validation Terrain** : Testée et approuvée en conditions réelles

## Format Standard

Chaque Hard Point technique doit suivre le format :

```markdown
# Hard Point: [Nom de la Technique]
> Promu le: YYYY-MM-DD | Validé par: [Autorité] | Origine: [Référence gen/techniques/]

## Technique figée
[Description immuable de la méthode]

## Procédure obligatoire
[Étapes qui ne peuvent être modifiées]

## Justification de l'immutabilité
[Pourquoi cette technique ne peut être modifiée]

## Impact et dépendances
[Éléments du système qui dépendent de cette technique]

## Références
[Liens vers les tables de vérité d'origine]
```

## Techniques Hard Points Disponibles

- [`gestion-logs-aikido.md`](../gestion-logs-aikido.md) : **Gestion des Logs AI‑KIDO** - Règles strictes pour la traçabilité, switching automatique de mode, emplacement et format des logs

## Processus de Promotion

Pour promouvoir une technique de [`../gen/techniques/`](../../gen/techniques/) vers ce répertoire :

1. Identifier la technique candidate dans `/gen/techniques/`
2. Valider les critères de promotion (efficacité, reproductibilité, robustesse)
3. Créer le fichier Hard Point avec justification détaillée
4. Mettre à jour ce fichier index
5. Référencer depuis [`../index.md`](../index.md)

## Critères de Validation

### Efficacité Mesurable
- Métriques de performance documentées
- Comparaison avec alternatives existantes
- Validation par des experts du domaine

### Reproductibilité
- Tests sur environnements multiples
- Documentation complète des prérequis
- Procédures de vérification standardisées

### Robustesse
- Tests de résistance aux variations
- Gestion des cas d'erreur
- Adaptabilité aux contraintes système

---

**RAPPEL** : Les Hard Points techniques ont priorité absolue et définissent les méthodes obligatoires du système AI‑KIDO.
