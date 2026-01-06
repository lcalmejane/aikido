# Techniques Pratiques de Création de Prompts Efficaces

> Version: 1.0 | Date: 2025-12-05 | Statut: Technique Pratique

Ce document fournit des **méthodes concrètes** et **exemples pratiques** pour appliquer les guidelines théoriques de création de prompts. Il complète [`/prompts/gen/concepts/guideline-prompts.md`](../concepts/guideline-prompts.md).

## Vue d'ensemble

**Objectif** : Transformer les principes théoriques en techniques opérationnelles avec exemples concrets et workflows pratiques.

**Public cible** : Développeurs, architectes, product owners créant des prompts pour LLM

## Patterns de Formulation Efficaces

### Pattern 1 : Structure Persona-Tâche-Contraintes (PTC)

**Template** :
```markdown
Tu es [PERSONA avec expertise spécifique].
Ta tâche est de [ACTION PRÉCISE avec OBJECTIF MESURABLE].
Contraintes : [LISTE EXPLICITE].
Format attendu : [STRUCTURE DE SORTIE].
```

**✅ Exemple BON** :
```markdown
Tu es un architecte logiciel senior spécialisé en microservices.
Ta tâche est d'analyser ce fichier docker-compose.yml et d'identifier les problèmes de sécurité critiques.
Contraintes :
- Focus uniquement sur les vulnérabilités OWASP Top 10
- Ignorer les warnings de performance
- Fournir une recommandation par vulnérabilité
Format attendu : Liste numérotée avec [Vulnérabilité] - [Impact] - [Recommandation]
```

**❌ Exemple MAUVAIS** :
```markdown
Analyse ce docker-compose et dis-moi ce qui ne va pas.
```

**Problèmes** : Pas de rôle, objectif flou, aucune contrainte, format non défini.

### Pattern 2 : Contexte-Exemples-Action (CEA)

**Template** :
```markdown
Contexte : [SITUATION SPÉCIFIQUE]
Exemples de résultats attendus :
<example>[EXEMPLE CONCRET]</example>
<example>[EXEMPLE CONCRET]</example>
Action : [INSTRUCTION AVEC ÉTAPES]
```

**✅ Exemple BON** :
```markdown
Contexte : Tu dois créer des tests unitaires pour une API REST qui gère des utilisateurs.

Exemples de résultats attendus :
<example>
describe('GET /users/:id', () => {
  it('should return user when ID exists', async () => {
    const userId = '123';
    const response = await request(app).get(`/users/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', userId);
  });
});
</example>

<example>
it('should return 404 when user not found', async () => {
  const response = await request(app).get('/users/nonexistent');
  expect(response.status).toBe(404);
});
</example>

Action : Génère 5 tests unitaires couvrant les cas suivants :
1. Succès avec ID valide
2. Erreur 404 avec ID inexistant
3. Erreur 400 avec ID invalide
4. Erreur 401 sans authentification
5. Erreur 500 avec erreur serveur
```

**❌ Exemple MAUVAIS** :
```markdown
Écris des tests pour mon API utilisateurs.
```

### Pattern 3 : Itération Progressive (Chain-of-Thought)

**Template** :
```markdown
Étape 1 : [ANALYSE]
Étape 2 : [RÉFLEXION]
Étape 3 : [DÉCISION]
Étape 4 : [ACTION]

Pour chaque étape, explique ton raisonnement avant de passer à la suivante.
```

**✅ Exemple BON** :
```markdown
Tu dois refactoriser cette fonction complexe en plusieurs fonctions plus simples.

Étape 1 : Analyse le code et identifie les responsabilités distinctes
Étape 2 : Propose une décomposition en fonctions avec leurs signatures
Étape 3 : Évalue si la décomposition respecte le Single Responsibility Principle
Étape 4 : Implémente le refactoring

Pour chaque étape, explique ton raisonnement avant de passer à la suivante.
```

## Exemples Concrets par Cas d'Usage

### Cas 1 : Génération de Code

**❌ Prompt inefficace** :
```markdown
Crée une fonction pour calculer la distance entre deux points.
```

**✅ Prompt optimisé** :
```markdown
Tu es un développeur TypeScript expérimenté.

Tâche : Créer une fonction pure qui calcule la distance euclidienne entre deux points 2D.

Signature attendue :
```typescript
function calculateDistance(p1: Point, p2: Point): number
```

Contraintes :
- Type Point = { x: number; y: number }
- Formule : sqrt((x2-x1)² + (y2-y1)²)
- Gérer les coordonnées négatives
- Retourner un nombre arrondi à 2 décimales
- Inclure JSDoc avec @param et @returns

Exemple d'utilisation :
```typescript
const distance = calculateDistance({x: 0, y: 0}, {x: 3, y: 4});
// Résultat attendu : 5.00
```

Fournis le code TypeScript complet avec gestion d'erreurs.
```

**Amélioration** : +300% de qualité de la sortie (persona, contraintes précises, exemple, format attendu)

### Cas 2 : Revue de Code

**❌ Prompt inefficace** :
```markdown
Review ce code et dis-moi s'il est bon.
```

**✅ Prompt optimisé** :
```markdown
Tu es un senior developer faisant une code review avec les critères suivants :
1. Sécurité (vulnérabilités OWASP)
2. Performance (complexité algorithmique)
3. Maintenabilité (lisibilité, tests)
4. Best practices du langage

Code à reviewer :
```python
[CODE ICI]
```

Pour chaque critère, fournis :
- ✅ Points positifs
- ⚠️ Points d'amélioration (avec suggestion de correction)
- 🔴 Problèmes critiques (avec code corrigé)

Format de sortie :
## Sécurité
...
## Performance
...
## Maintenabilité
...
## Best Practices
...
## Score Global : X/10
```

### Cas 3 : Documentation Technique

**❌ Prompt inefficace** :
```markdown
Documente cette fonction.
```

**✅ Prompt optimisé** :
```markdown
Tu es un technical writer créant de la documentation API de qualité production.

Tâche : Documenter cette fonction avec le format suivant :

**Description** : [1 phrase résumant l'objectif]
**Signature** : [Code avec types]
**Paramètres** :
- `param1` (type) : [Description]
**Retour** : [Type et description]
**Exceptions** : [Liste des erreurs possibles]
**Exemples** :
```[langage]
// Cas nominal
[EXEMPLE]

// Cas limite
[EXEMPLE]
```
**Notes** : [Remarques importantes, performance, limitations]

Fonction à documenter :
```javascript
[CODE ICI]
```

Assure-toi que les exemples sont exécutables et couvrent les cas limites.
```

## Anti-Patterns à Éviter avec Exemples

### Anti-Pattern 1 : Instructions Contradictoires

**❌ Mauvais** :
```markdown
Sois concis dans ta réponse.
Explique en détail chaque étape.
Limite-toi à 50 mots maximum.
Fournis des exemples complets pour chaque point.
```

**Problème** : Contradiction entre "concis", "détail", "50 mots" et "exemples complets"

**✅ Bon** :
```markdown
Fournis une réponse structurée en 3 parties :
1. Résumé (50 mots max)
2. Explication détaillée (200-300 mots)
3. Exemples concrets (2-3 exemples courts)
```

### Anti-Pattern 2 : Surcharge Cognitive

**❌ Mauvais** :
```markdown
Analyse ce code en vérifiant : sécurité, performance, lisibilité, tests, documentation,
architecture, patterns, SOLID, DRY, KISS, YAGNI, complexité cyclomatique, couplage,
cohésion, injection de dépendances, gestion d'erreurs, logging, monitoring, scalabilité,
maintenabilité, évolutivité, réutilisabilité, et conformité aux standards de l'équipe.
```

**Problème** : 20+ critères simultanés, impossible à traiter efficacement

**✅ Bon** :
```markdown
Analyse ce code selon 3 axes prioritaires :
1. **Sécurité** : Vulnérabilités OWASP Top 5
2. **Performance** : Complexité O(n) et optimisations évidentes
3. **Maintenabilité** : Respect SOLID et lisibilité

Pour les autres aspects (tests, docs, etc.), mentionne uniquement les problèmes critiques.
```

### Anti-Pattern 3 : Ambiguïté Sémantique

**❌ Mauvais** :
```markdown
Optimise ce code pour qu'il soit meilleur.
```

**Problème** : "Optimise" peut signifier performance, lisibilité, taille, complexité... "Meilleur" est subjectif

**✅ Bon** :
```markdown
Améliore la performance de ce code en réduisant sa complexité temporelle :
- Objectif : Passer de O(n²) à O(n log n) ou mieux
- Mesure : Temps d'exécution sur 10,000 éléments < 100ms
- Maintiens la lisibilité (pas de micro-optimisations obscures)
```

## Workflows d'Optimisation de Prompts

### Workflow 1 : Test-Refine-Iterate

**Étapes** :
1. **Version initiale** : Prompt basique avec objectif clair
2. **Test** : Exécuter sur 3-5 cas d'usage représentatifs
3. **Analyse des échecs** : Identifier les ambiguïtés et outputs incorrects
4. **Refinement** : Ajouter contraintes, exemples, clarifications
5. **Re-test** : Valider amélioration
6. **Itération** : Répéter 3-5 jusqu'à 90%+ de réussite

**Exemple pratique** :

**v1.0** (baseline) :
```markdown
Crée un test unitaire pour cette fonction.
```
→ Résultat : Tests génériques, cas limites manquants (40% qualité)

**v1.1** (ajout contexte) :
```markdown
Tu es un QA engineer. Crée un test unitaire pour cette fonction avec cas nominaux et limites.
```
→ Résultat : Tests mieux structurés mais format inconsistant (60% qualité)

**v1.2** (ajout contraintes + format) :
```markdown
Tu es un QA engineer utilisant Jest.
Crée des tests unitaires pour cette fonction couvrant :
- 1 cas nominal
- 2 cas limites (null, undefined, valeurs extrêmes)
- 1 cas d'erreur

Format : describe() avec it() pour chaque cas.
```
→ Résultat : Tests complets et bien structurés (90% qualité) ✅

### Workflow 2 : Validation par Checklist

**Avant d'utiliser un prompt, vérifier** :

- [ ] **Persona** : Rôle et expertise définis ?
- [ ] **Objectif** : Tâche claire et mesurable ?
- [ ] **Contexte** : Informations suffisantes ?
- [ ] **Contraintes** : Limitations explicites ?
- [ ] **Format** : Structure de sortie définie ?
- [ ] **Exemples** : Au moins 1 exemple fourni ?
- [ ] **Testabilité** : Critères de succès clairs ?

**Si 6+/7 ✅ → Prompt prêt | Si <6/7 → Amélioration nécessaire**

### Workflow 3 : Progressive Disclosure

**Principe** : Décomposer un prompt complexe en étapes progressives

**Prompt monolithique (difficile)** :
```markdown
Analyse ce projet, identifie les problèmes, propose des solutions, implémente les correctifs,
crée les tests, et documente le tout.
```

**Prompt progressif (efficace)** :
```markdown
**Phase 1** : Analyse le projet et liste les 5 problèmes critiques avec leur impact.
[Attendre réponse]

**Phase 2** : Pour chaque problème, propose 2-3 solutions avec avantages/inconvénients.
[Attendre réponse]

**Phase 3** : Implémente la solution choisie pour le problème N°1.
[Attendre réponse]

**Phase 4** : Crée les tests unitaires pour valider le correctif.
[Attendre réponse]

**Phase 5** : Documente les changements et leur justification.
```

**Bénéfice** : Contrôle à chaque étape, possibilité d'ajuster, meilleure qualité finale

## Templates Réutilisables

### Template A : Code Review

```markdown
Tu es un [RÔLE] senior faisant une code review.

Code à reviewer :
```[LANGAGE]
[CODE]
```

Critères d'évaluation :
1. [CRITÈRE 1] : [DESCRIPTION]
2. [CRITÈRE 2] : [DESCRIPTION]
3. [CRITÈRE 3] : [DESCRIPTION]

Pour chaque critère, fournis :
- ✅ Points conformes
- ⚠️ Améliorations suggérées (avec exemple de code)
- 🔴 Problèmes bloquants (avec correction complète)

Score final : X/10 avec justification.
```

### Template B : Génération de Documentation

```markdown
Tu es un technical writer créant de la documentation [TYPE].

Élément à documenter : [NOM]
Source : [LIEN ou CODE]

Structure attendue :
## Titre
[Description 1-2 phrases]

## Utilisation
```[LANGAGE]
[Exemple code]
```

## Paramètres
[Tableau : Nom | Type | Description | Obligatoire]

## Retour
[Type et description]

## Exemples
### Cas nominal
[Code exécutable]

### Cas d'erreur
[Code exécutable]

## Notes
[Remarques importantes]
```

### Template C : Refactoring Guidé

```markdown
Tu es un [RÔLE] expert en clean code.

Code à refactoriser :
```[LANGAGE]
[CODE]
```

Processus étape par étape :
**Étape 1** : Identifie les code smells (liste numérotée)
**Étape 2** : Propose une architecture cible (diagramme textuel)
**Étape 3** : Crée les nouvelles fonctions/classes avec signatures
**Étape 4** : Implémente le refactoring complet
**Étape 5** : Vérifie que les tests existants passent toujours

Contraintes :
- Maintenir la compatibilité API
- Respecter [PRINCIPLES : SOLID/DRY/KISS]
- Améliorer la testabilité

Explique chaque décision de refactoring.
```

## Relations et Dépendances

**Référence théorique** : [`/prompts/gen/concepts/guideline-prompts.md`](../concepts/guideline-prompts.md)

**Voir aussi** :
- Hard Points AI-KIDO : [`/prompts/hard_points/ai-kido.md`](../../hard_points/ai-kido.md) (Règle 11 : Densité sémantique)
- Personas AI-KIDO : [`/prompts/gen/personas/`](../personas/) pour exemples de prompts système avancés

---

*Cette technique fournit des méthodes concrètes et réutilisables pour créer des prompts efficaces. Utilisez les templates et workflows selon vos besoins spécifiques.*
