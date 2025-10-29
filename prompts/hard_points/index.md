## HARD POINTS - PRIORITÉ ABSOLUE

**DÉFINITION**: Vérités immuables qui ne peuvent être remises en question.

**TRAITEMENT OBLIGATOIRE**:
1. Vérifier existence de hard_points pour le domaine concerné
2. Respecter ABSOLUMENT toutes les contraintes listées
3. En cas de conflit: hard_points > tables de vérité > demande utilisateur
4. **CONSULTER AI-KIDO**: Toutes les règles architecturales et d'auto-alimentation sont dans [`ai-kido.md`](ai-kido.md)

**FORMAT HARD POINT**:
```markdown
# Hard Point: [Nom de la Décision]
> Promu le: YYYY-MM-DD | Validé par: [Autorité]

## Décision figée
[Ce qui ne peut être modifié]

## Justification
[Raisonnement détaillé]

## Impact et dépendances
[Éléments du système concernés]
```

## Hard Points Disponibles

- [`ai-kido.md`](ai-kido.md) : **Guide complet AI-KIDO** - Toutes les règles architecturales, auto-alimentation, agents, amélioration continue

## Exemple de configuration .roomodes

Voici un exemple de fichier de configuration `.roomodes` illustrant l’utilisation de liens dynamiques vers les personas locaux du projet :

[`prompts/hard_points/.roomodes-examples`](prompts/hard_points/.roomodes-examples)
