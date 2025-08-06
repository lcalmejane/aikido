# Principes Techniques - Formation AI-KIDO
> Version: 1.0 | Date: 2025-01-05 | Statut: Table de Vérité Fondamentale

## Vue d'ensemble

Ces principes techniques définissent les **règles et axiomes** qui gouvernent l'implémentation, la détection et la correction des Design Patterns et Anti-Patterns dans les environnements **PHP et Java**.

## Définitions clés

### Principes de Qualité Code

#### SOLID Principles
**Définition** : Ensemble de cinq principes de conception orientée objet.
- **S** - Single Responsibility Principle : Une classe = une responsabilité
- **O** - Open/Closed Principle : Ouvert à l'extension, fermé à la modification
- **L** - Liskov Substitution Principle : Substituabilité des sous-types
- **I** - Interface Segregation Principle : Interfaces spécialisées
- **D** - Dependency Inversion Principle : Dépendre des abstractions

#### DRY (Don't Repeat Yourself)
**Définition** : Éviter la duplication de code et de logique.
- **Application PHP** : Utilisation de traits, classes abstraites, fonctions
- **Application Java** : Héritage, composition, méthodes utilitaires
- **Anti-pattern associé** : Copy-Paste Programming

#### KISS (Keep It Simple, Stupid)
**Définition** : Privilégier la simplicité dans la conception.
- **Manifestation** : Code lisible, architecture claire, solutions directes
- **Anti-pattern associé** : Over-engineering, God Object
- **Biais associé** : Effet Dunning-Kruger

### Principes de Détection

#### Métriques de Complexité
**Complexité Cyclomatique** : Mesure du nombre de chemins d'exécution.
- **Seuil PHP** : < 10 par méthode (recommandation PSR)
- **Seuil Java** : < 10 par méthode (standard Checkstyle)
- **Outils** : PHPMD, PMD Java

**Profondeur d'Héritage** : Nombre de niveaux dans la hiérarchie.
- **Seuil recommandé** : < 6 niveaux
- **Anti-pattern** : Deep Inheritance Tree
- **Solution** : Composition over Inheritance

#### Code Smells
**Long Method** : Méthodes trop longues.
- **Seuil PHP** : > 20 lignes (PSR-12 recommandation)
- **Seuil Java** : > 30 lignes (convention Google)
- **Refactoring** : Extract Method, Decompose Conditional

**Large Class** : Classes avec trop de responsabilités.
- **Seuil** : > 500 lignes ou > 20 méthodes publiques
- **Anti-pattern** : God Object
- **Solution** : Extract Class, Single Responsibility

## Principes directeurs

### Principe de Prévention
**Axiome** : Il est plus efficace de prévenir les anti-patterns que de les corriger.
- **Stratégies** : Formation équipes, code reviews, outils automatisés
- **Métriques** : Taux de détection précoce, coût de correction
- **Biais ciblés** : Biais d'engagement, biais de confirmation

### Principe de Détection Précoce
**Axiome** : Plus un anti-pattern est détecté tôt, moins il coûte à corriger.
- **Implémentation** : Intégration CI/CD, hooks Git, IDE warnings
- **Outils PHP** : PHPStan niveau max, Psalm strict
- **Outils Java** : SpotBugs, PMD, Checkstyle en mode strict

### Principe de Refactoring Sécurisé
**Axiome** : Tout refactoring doit préserver le comportement externe.
- **Prérequis** : Couverture de tests > 80%
- **Stratégies** : Baby steps, tests de régression, rollback plan
- **Outils** : PHPUnit (PHP), JUnit + Mockito (Java)

## Spécifications techniques

### Standards de Code PHP

#### PSR Standards
```php
// PSR-1: Basic Coding Standard
<?php
namespace Vendor\Package;

class ClassName
{
    // PSR-2: Coding Style Guide
    public function methodName($arg1, &$arg2, $arg3 = [])
    {
        // PSR-4: Autoloader
        // PSR-12: Extended Coding Style
        if ($arg1 === $arg2) {
            throw new \InvalidArgumentException('Arguments must be different');
        }
        
        return $arg3;
    }
}
```

#### Détection Anti-patterns PHP
```php
// Anti-pattern: God Object (détection)
class UserManager  // > 500 lignes, > 20 méthodes publiques
{
    public function createUser() { /* ... */ }
    public function updateUser() { /* ... */ }
    public function deleteUser() { /* ... */ }
    public function sendEmail() { /* ... */ }     // Responsabilité différente
    public function generateReport() { /* ... */ } // Responsabilité différente
    public function validateData() { /* ... */ }   // Responsabilité différente
}

// Solution: Single Responsibility
class UserService
{
    public function createUser() { /* ... */ }
    public function updateUser() { /* ... */ }
    public function deleteUser() { /* ... */ }
}

class EmailService
{
    public function sendEmail() { /* ... */ }
}

class ReportGenerator
{
    public function generateReport() { /* ... */ }
}
```

### Standards de Code Java

#### Conventions Google/Oracle
```java
// Naming conventions
public class UserService {  // PascalCase pour classes
    private static final int MAX_USERS = 1000;  // UPPER_SNAKE_CASE pour constantes
    private String userName;  // camelCase pour variables
    
    // Method naming
    public boolean isValidUser(String userName) {  // camelCase pour méthodes
        return userName != null && !userName.isEmpty();
    }
    
    // Exception handling
    public User createUser(String name) throws UserCreationException {
        if (!isValidUser(name)) {
            throw new UserCreationException("Invalid user name: " + name);
        }
        return new User(name);
    }
}
```

#### Détection Anti-patterns Java
```java
// Anti-pattern: Golden Hammer (même solution partout)
public class DataProcessor {
    // Utilisation excessive de HashMap pour tous les cas
    private Map<String, Object> config = new HashMap<>();
    private Map<String, Object> cache = new HashMap<>();
    private Map<String, Object> results = new HashMap<>();
    
    // Solution: Types spécialisés
    private Configuration config = new Configuration();
    private Cache<String, ProcessedData> cache = new LRUCache<>();
    private ProcessingResults results = new ProcessingResults();
}
```

### Outils et Configurations

#### Configuration PHPStan
```neon
# phpstan.neon
parameters:
    level: max
    paths:
        - src
        - tests
    ignoreErrors:
        - '#Call to an undefined method#'
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    reportUnmatchedIgnoredErrors: true
```

#### Configuration PMD Java
```xml
<!-- pmd-ruleset.xml -->
<ruleset name="Custom Rules">
    <rule ref="category/java/design.xml/CyclomaticComplexity">
        <properties>
            <property name="methodReportLevel" value="10"/>
        </properties>
    </rule>
    <rule ref="category/java/design.xml/GodClass"/>
    <rule ref="category/java/design.xml/TooManyMethods">
        <properties>
            <property name="maxmethods" value="20"/>
        </properties>
    </rule>
</ruleset>
```

## Exemples d'application

### Exemple Complet : Strategy Pattern

#### Problème (Anti-pattern Golden Hammer)
```php
// PHP - Anti-pattern
class PaymentProcessor
{
    public function processPayment($type, $amount)
    {
        // Même structure pour tous les types de paiement
        if ($type === 'credit_card') {
            // Logique carte de crédit
        } elseif ($type === 'paypal') {
            // Logique PayPal
        } elseif ($type === 'bank_transfer') {
            // Logique virement
        }
        // Violation Open/Closed Principle
    }
}
```

```java
// Java - Anti-pattern
public class PaymentProcessor {
    public void processPayment(String type, double amount) {
        // Même structure rigide
        switch (type) {
            case "CREDIT_CARD":
                // Logique carte de crédit
                break;
            case "PAYPAL":
                // Logique PayPal
                break;
            case "BANK_TRANSFER":
                // Logique virement
                break;
            // Violation Open/Closed Principle
        }
    }
}
```

#### Solution (Strategy Pattern)
```php
// PHP - Solution
interface PaymentStrategy
{
    public function pay(float $amount): PaymentResult;
}

class CreditCardPayment implements PaymentStrategy
{
    public function pay(float $amount): PaymentResult
    {
        // Logique spécialisée carte de crédit
        return new PaymentResult(true, 'Credit card payment successful');
    }
}

class PaymentProcessor
{
    private PaymentStrategy $strategy;
    
    public function __construct(PaymentStrategy $strategy)
    {
        $this->strategy = $strategy;
    }
    
    public function processPayment(float $amount): PaymentResult
    {
        return $this->strategy->pay($amount);
    }
}
```

```java
// Java - Solution
public interface PaymentStrategy {
    PaymentResult pay(double amount);
}

public class CreditCardPayment implements PaymentStrategy {
    @Override
    public PaymentResult pay(double amount) {
        // Logique spécialisée carte de crédit
        return new PaymentResult(true, "Credit card payment successful");
    }
}

public class PaymentProcessor {
    private final PaymentStrategy strategy;
    
    public PaymentProcessor(PaymentStrategy strategy) {
        this.strategy = strategy;
    }
    
    public PaymentResult processPayment(double amount) {
        return strategy.pay(amount);
    }
}
```

### Exemple Détection Automatisée

#### Règle PHPStan Personnalisée
```php
// Détection God Object
class GodObjectRule implements Rule
{
    public function getNodeType(): string
    {
        return Class_::class;
    }
    
    public function processNode(Node $node, Scope $scope): array
    {
        $methodCount = count($node->getMethods());
        $lineCount = $node->getEndLine() - $node->getStartLine();
        
        if ($methodCount > 20 || $lineCount > 500) {
            return [
                RuleErrorBuilder::message(
                    'Class has too many responsibilities (God Object anti-pattern)'
                )->build()
            ];
        }
        
        return [];
    }
}
```

## Relations et dépendances

### Corrélations Biais ↔ Principes

#### Biais d'Engagement → Violation SOLID
- **Mécanisme** : Résistance au changement d'architecture
- **Manifestation** : Classes monolithiques, couplage fort
- **Prévention** : Code reviews obligatoires, métriques automatisées

#### Biais de Confirmation → Ignorance des Code Smells
- **Mécanisme** : Justification des mauvaises pratiques
- **Manifestation** : Rationalisation de la complexité
- **Prévention** : Outils automatisés, formation continue

### Intégration avec Autres Tables

#### Vers Domain Model
- Principes → Contraintes sur les entités Pattern/AntiPattern
- Métriques → Attributs de détection des anti-patterns
- Standards → Format des exemples de code

#### Vers System Architecture
- Outils → Composants de la couche technique
- Configurations → Spécifications d'intégration
- Workflows → Processus de validation qualité

## Métriques de Conformité

### Métriques Techniques
- [ ] Couverture PSR PHP : 100% des exemples conformes
- [ ] Conventions Java : 100% des exemples respectent Google Style
- [ ] Outils configurés : PHPStan max, PMD strict
- [ ] Seuils définis : Complexité, taille classes, profondeur héritage

### Métriques Qualité
- [ ] Principes SOLID : Exemples pour chaque principe
- [ ] Code Smells : Catalogue complet avec détection
- [ ] Anti-patterns : Corrélation avec violations de principes
- [ ] Refactoring : Guides step-by-step sécurisés

### Métriques Prévention
- [ ] Formation : Intégration principes dans parcours
- [ ] Outils : Automatisation détection en CI/CD
- [ ] Culture : Adoption des bonnes pratiques équipes
- [ ] Mesure : KPIs d'amélioration continue

---

**VALIDATION** : Ces principes techniques fournissent la base normative pour l'évaluation de la qualité du code PHP et Java, l'identification des anti-patterns et l'application correcte des design patterns dans le contexte de la formation AI-KIDO.
