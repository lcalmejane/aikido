# AI‑KIDO LIGHT – Guide Pratique pour Bases Légères

> **Version**: 1.3.1‑LIGHT | **Usage**: Configuration allégée d'AI‑KIDO pour agents unitaires

## PRÉFIX DE PROMPT GENERAL
```text
Sauf pour les agents internes "agent‑aikido‑*", après analyse de la question et avant d’y répondre, utiliser le fichier prompts/index.md pour faire un parcours récursif pertinent afin de récupérer les infos strictement utiles à la compréhension de la demande.
```

## EXCEPTIONS
- Aux agents internes AI‑KIDO (préfixe `agent‑aikido‑*`) qui possèdent déjà les règles nécessaires

## PRINCIPES CLÉS DU MODE LIGHT
1. **Légèreté** : Minimum de fichiers, maximum d’efficacité.  
2. **Densité** : Information maximale par fichier.  
3. **Simplicité** : Structure réduite au strict nécessaire.  
4. **Agent Unitaire** : Approche mono‑agent ou multi‑agents très restreint.  
5. **Rapidité** : Temps de parcours minimal pour le LLM.

## DIFFÉRENCES AVEC LE MODE STANDARD
| Aspect | Standard | Light |
|--------|----------|-------|
| **Fichiers concepts** | Multiples | 1 seul fichier unifié |
| **Fichiers techniques** | Multiples | 1 seul fichier unifié |
| **Personas** | 6‑12 | 3‑5 maximum |
| **Use cases** | 8‑15 | 3‑5 maximum |
| **Profondeur arbre** | 3‑4 niveaux | ≤ 3 niveaux |
| **Hard points** | Structure complète | Structure minimale |

## RÈGLES ARCHITECTURALES ADAPTÉES (extraits)
- **Arborescence Simplifiée** : Parcours réduit depuis `prompts/index.md`.  
- **Fusion Théorie/Pratique** : Possibilité de fusionner `concepts/` et `techniques/` en fichiers uniques.  
- **Arbre Minimal** : Facteur 2‑4 enfants/parent, profondeur ≤ 3 niveaux.  
- **Agents Restreints** : 3‑5 personas maximum, approche agent unitaire privilégiée.  
- **RACI Optionnel** : Acteur unique ou minimal (2‑3 rôles max).  

## STRUCTURE OBLIGATOIRE MODE LIGHT
```
/prompts/
├── index.md                    # Point d’entrée unique
├── gen/
│   ├── concepts/               # 1 fichier unifié recommandé
│   │   └── core-concepts.md
│   ├── techniques/             # 1 fichier unifié recommandé
│   │   └── core-techniques.md
│   ├── personas/               # 3‑5 personas max
│   └── use_cases/              # 3‑5 cas d’usage max
└── hard_points/
    ├── index.md
    ├── ai-kido-light.md        # <‑ Ce fichier
    └── [≤ 3 hard points]       # Contraintes critiques uniquement
```

## RÈGLES DE CRÉATION MODE LIGHT
- **Fusion des fichiers Concepts & Techniques** : Un seul fichier par catégorie.  
- **Personas** : Maximum 5, chacun polyvalent.  
- **Use Cases** : Maximum 5, scénarios critiques uniquement.  
- **RACI** : Optionnel ou minimal (≤ 3 rôles).  

## MÉTRIQUES DE QUALITÉ MODE LIGHT
- **Fichiers totaux** : ≤ 15 dans `/prompts/gen/`.  
- **Personas** : 3‑5 max.  
- **Use Cases** : 3‑5 max.  
- **Profondeur** : ≤ 3 niveaux.  
- **Densité** : > 80 % d’information utile.  
- **Temps de parcours LLM** : < 50 % du mode standard.  

<details>
<summary>Voir le reste du document détaillé</summary>
[Consulter le contenu complet](`prompts/hard_points/ai-kido-light_details.md`)
</details>
