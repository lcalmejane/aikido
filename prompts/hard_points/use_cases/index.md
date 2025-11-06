# Hard Points - Cas d'Usage

> **Statut**: Hard Points - Vérités immuables
> **Priorité**: Absolue - Ne peuvent être remises en question

## Vue d'ensemble

Ce répertoire contient les **cas d'usage validés** qui ont été promus au statut de Hard Points dans le système AI‑KIDO. Ces cas d'usage constituent des applications immuables qui ont fait leurs preuves et définissent les standards obligatoires d'implémentation.

## Règles de Promotion

Un cas d'usage devient Hard Point quand :

1. **Validation Opérationnelle** : Le cas d'usage a été testé en conditions réelles avec succès
2. **Reproductibilité Garantie** : Résultats identiques sur 10+ implémentations
3. **Référence Standard** : Devient la référence obligatoire pour des situations similaires
4. **Impact Critique** : Échec du cas d'usage = échec système
5. **Consensus Métier** : Validation par tous les stakeholders concernés

## Format Standard

Chaque Hard Point de cas d'usage doit suivre le format :

```markdown
# Hard Point: [Nom du Cas d'Usage]
> Promu le: YYYY-MM-DD | Validé par: [Autorité] | Origine: [Référence gen/use_cases/]

## Cas d'usage figé
[Description immuable du cas d'usage]

## Scénario obligatoire
[Étapes qui ne peuvent être modifiées]

## Critères de succès immuables
[Conditions de réussite non négociables]

## Justification de l'immutabilité
[Pourquoi ce cas d'usage ne peut être modifié]

## Impact et dépendances
[Éléments du système qui dépendent de ce cas d'usage]

## Références
[Liens vers les tables de vérité d'origine]
```

## Cas d'Usage Hard Points Disponibles

*Aucun cas d'usage n'a encore été promu au statut de Hard Point.*

## Processus de Promotion

Pour promouvoir un cas d'usage de [`../gen/use_cases/`](../../gen/use_cases/) vers ce répertoire :

1. Identifier le cas d'usage candidat dans `/gen/use_cases/`
2. Valider les critères de promotion (validation opérationnelle, reproductibilité)
3. Créer le fichier Hard Point avec justification détaillée
4. Mettre à jour ce fichier index
5. Référencer depuis [`../index.md`](../index.md)

## Critères de Validation

### Validation Opérationnelle
- Tests en environnement de production
- Validation par les utilisateurs finaux
- Métriques de performance documentées

### Reproductibilité
- Procédures documentées étape par étape
- Tests sur environnements multiples
- Validation par équipes indépendantes

### Impact Critique
- Analyse des dépendances système
- Évaluation des risques d'échec
- Plan de continuité documenté

## Types de Cas d'Usage Candidats

- **Intégrations Critiques** : Connexions système essentielles
- **Workflows Métier** : Processus business non négociables
- **Procédures de Sécurité** : Protocoles de sécurité obligatoires
- **Patterns d'Architecture** : Modèles d'implémentation standards

---

**RAPPEL** : Les Hard Points de cas d'usage définissent les standards obligatoires d'implémentation dans le système AI‑KIDO.
