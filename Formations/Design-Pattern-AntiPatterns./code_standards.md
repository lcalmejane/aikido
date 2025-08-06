# Standards de Code - Formation AI-KIDO
> Version: 1.0 | Date: 2025-01-05 | Statut: Table de Vérité Fondamentale

## Vue d'ensemble

Ces standards de code définissent les **règles de qualité** et les **conventions** pour l'implémentation des Design Patterns et la prévention des Anti-Patterns dans les environnements **PHP et Java**.

## Définitions clés

### Standards PHP

#### PSR (PHP Standards Recommendations)
**PSR-1 : Basic Coding Standard**
- Fichiers PHP : `<?php` ou `<?=` uniquement
- Encodage : UTF-8 sans BOM
- Séparation : Déclarations vs side-effects
- Nommage : Classes en `StudlyCaps`, méthodes en `camelCase`

**PSR-2 : Coding Style Guide (Déprécié, remplacé par PSR-12)**
- Indentation : 4 espaces (pas de tabs)
- Longueur ligne : Limite souple à 120 caractères
- Accolades : Opening brace sur nouvelle ligne pour classes/méthodes

**PSR-4 : Autoloader Standard**
- Namespace : Correspondance avec structure répertoires
- Classe : Un fichier par classe
- Nommage fichier : Identique au nom de classe

**PSR-12 : Extended Coding Style**
```php
<?php

declare(strict_types=1);

namespace Vendor\Package;

use Vendor\Package\{ClassA as A, ClassB, ClassC as C};
use function Vendor\Package\{functionA, functionB, functionC};

class ClassName extends ParentClass implements
    \ArrayAccess,
    \Countable,
    \Serializable
{
    use FirstTrait;
    use SecondTrait {
        SecondTrait::bigTalk insteadof FirstTrait;
        SecondTrait::smallTalk as talk;
    }

    public const VERSION = '1.0';
    protected const POWER = '1.21 gigawatts';
    private const SYSTEM = 'flux capacitor';

    public function sampleMethod(int $a, int $b = null): array
    {
        if ($a === $b) {
            bar();
        } elseif ($a > $b) {
            $foo->bar($arg1);
        } else {
            BazClass::bar($arg2, $arg3);
        }
    }

    final public static function bar()
    {
        // method body
    }
}
```

#### Conventions Spécifiques Formation
**Nommage Patterns**
```php
// Interface pour Strategy Pattern
interface PaymentStrategyInterface
{
    public function processPayment(Money $amount): PaymentResult;
}

// Implémentation concrète
final class CreditCardPaymentStrategy implements PaymentStrategyInterface
{
    public function processPayment(Money $amount): PaymentResult
    {
        // Implementation
    }
}

// Factory Method
abstract class PaymentProcessorFactory
{
    abstract public function createProcessor(): PaymentProcessorInterface;
}
```

**Documentation Patterns**
```php
/**
 * Strategy Pattern implementation for payment processing.
 * 
 * This pattern allows switching between different payment methods
 * at runtime without modifying the client code.
 * 
 * @see https://refactoring.guru/design-patterns/strategy
 */
class PaymentContext
{
    private PaymentStrategyInterface $strategy;

    /**
     * @param PaymentStrategyInterface $strategy The payment strategy to use
     */
    public function __construct(PaymentStrategyInterface $strategy)
    {
        $this->strategy = $strategy;
    }
}
```

### Standards Java

#### Conventions Google Java Style
**Nommage**
```java
// Classes : UpperCamelCase
public class PaymentProcessor {
    
    // Constantes : CONSTANT_CASE
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final String DEFAULT_CURRENCY = "EUR";
    
    // Variables : lowerCamelCase
    private PaymentStrategy paymentStrategy;
    private boolean isProcessingEnabled;
    
    // Méthodes : lowerCamelCase
    public PaymentResult processPayment(Money amount) {
        return paymentStrategy.process(amount);
    }
    
    // Méthodes booléennes : is/has/can prefix
    public boolean isValidAmount(Money amount) {
        return amount.isPositive();
    }
}
```

**Structure Fichier**
```java
/*
 * Copyright (c) 2025 Formation AI-KIDO
 * Licensed under MIT License
 */

package com.formation.aikido.patterns.strategy;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.Optional;

import com.formation.aikido.common.Money;
import com.formation.aikido.common.PaymentResult;

/**
 * Strategy Pattern implementation for payment processing.
 * 
 * <p>This pattern allows switching between different payment methods
 * at runtime without modifying the client code.
 * 
 * @see <a href="https://refactoring.guru/design-patterns/strategy">Strategy Pattern</a>
 * @author Formation AI-KIDO
 * @version 1.0
 * @since 1.0
 */
public final class PaymentProcessor {
    
    private final PaymentStrategy strategy;
    
    /**
     * Creates a new payment processor with the specified strategy.
     * 
     * @param strategy the payment strategy to use, must not be null
     * @throws NullPointerException if strategy is null
     */
    public PaymentProcessor(PaymentStrategy strategy) {
        this.strategy = Objects.requireNonNull(strategy, "Strategy cannot be null");
    }
    
    /**
     * Processes a payment using the configured strategy.
     * 
     * @param amount the amount to process, must not be null and must be positive
     * @return the payment result
     * @throws NullPointerException if amount is null
     * @throws IllegalArgumentException if amount is not positive
     */
    public PaymentResult processPayment(Money amount) {
        Objects.requireNonNull(amount, "Amount cannot be null");
        if (!amount.isPositive()) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        
        return strategy.process(amount);
    }
}
```

#### Conventions Spécifiques Formation
**Nommage Patterns**
```java
// Interface pour Strategy Pattern
public interface PaymentStrategy {
    PaymentResult process(Money amount);
}

// Implémentation concrète
public final class CreditCardPaymentStrategy implements PaymentStrategy {
    @Override
    public PaymentResult process(Money amount) {
        // Implementation
    }
}

// Abstract Factory
public abstract class PaymentProcessorFactory {
    public abstract PaymentProcessor createProcessor();
    
    // Factory Method
    public static PaymentProcessorFactory getInstance(String type) {
        switch (type.toLowerCase()) {
            case "credit_card":
                return new CreditCardProcessorFactory();
            case "paypal":
                return new PayPalProcessorFactory();
            default:
                throw new IllegalArgumentException("Unknown processor type: " + type);
        }
    }
}
```

## Principes directeurs

### Principe de Lisibilité
**Code auto-documenté** : Le code doit être compréhensible sans commentaires excessifs.
```php
// ❌ Mauvais
$d = 86400; // seconds in a day

// ✅ Bon
$secondsInDay = 86400;
```

```java
// ❌ Mauvais
int d = 86400; // seconds in a day

// ✅ Bon
private static final int SECONDS_IN_DAY = 86400;
```

### Principe de Consistance
**Uniformité** : Même style dans tout le projet.
- Indentation identique (4 espaces)
- Nommage cohérent
- Structure de fichiers standardisée
- Documentation homogène

### Principe de Simplicité
**KISS (Keep It Simple, Stupid)** : Privilégier les solutions simples.
```php
// ❌ Complexe
public function isValidUser($user)
{
    if ($user !== null) {
        if (isset($user['name']) && !empty($user['name'])) {
            if (isset($user['email']) && filter_var($user['email'], FILTER_VALIDATE_EMAIL)) {
                return true;
            }
        }
    }
    return false;
}

// ✅ Simple
public function isValidUser(?array $user): bool
{
    return $user !== null
        && !empty($user['name'])
        && filter_var($user['email'] ?? '', FILTER_VALIDATE_EMAIL) !== false;
}
```

## Spécifications techniques

### Outils de Validation PHP

#### Configuration PHPStan
```neon
# phpstan.neon
parameters:
    level: max
    paths:
        - src
        - tests
    excludePaths:
        - src/Legacy/*
    
    # Règles strictes pour formation
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    reportUnmatchedIgnoredErrors: true
    
    # Règles spécifiques patterns
    ignoreErrors:
        - '#Method .* should return .* but returns .*#'
        - path: src/Patterns/Creational/*
          message: '#Factory method should be static#'
```

#### Configuration PHP_CodeSniffer
```xml
<?xml version="1.0"?>
<ruleset name="AI-KIDO Formation Standards">
    <description>Coding standards for AI-KIDO Design Patterns formation</description>
    
    <!-- PSR-12 as base -->
    <rule ref="PSR12"/>
    
    <!-- Additional rules for patterns -->
    <rule ref="Generic.CodeAnalysis.UnusedFunctionParameter"/>
    <rule ref="Generic.Commenting.DocComment"/>
    <rule ref="Squiz.Commenting.ClassComment"/>
    <rule ref="Squiz.Commenting.FunctionComment"/>
    
    <!-- Pattern-specific rules -->
    <rule ref="Generic.NamingConventions.UpperCaseConstantName"/>
    <rule ref="PEAR.NamingConventions.ValidClassName"/>
    
    <!-- Exclude legacy code -->
    <exclude-pattern>*/Legacy/*</exclude-pattern>
    <exclude-pattern>*/vendor/*</exclude-pattern>
</ruleset>
```

### Outils de Validation Java

#### Configuration Checkstyle
```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">

<module name="Checker">
    <property name="charset" value="UTF-8"/>
    <property name="severity" value="warning"/>
    <property name="fileExtensions" value="java, properties, xml"/>
    
    <!-- Size Violations -->
    <module name="FileLength">
        <property name="max" value="500"/>
    </module>
    
    <module name="TreeWalker">
        <!-- Naming Conventions -->
        <module name="ConstantName"/>
        <module name="LocalFinalVariableName"/>
        <module name="LocalVariableName"/>
        <module name="MemberName"/>
        <module name="MethodName"/>
        <module name="PackageName"/>
        <module name="ParameterName"/>
        <module name="StaticVariableName"/>
        <module name="TypeName"/>
        
        <!-- Design Patterns specific -->
        <module name="InterfaceIsType"/>
        <module name="VisibilityModifier"/>
        <module name="FinalClass"/>
        <module name="HideUtilityClassConstructor"/>
        
        <!-- Complexity -->
        <module name="CyclomaticComplexity">
            <property name="max" value="10"/>
        </module>
        <module name="MethodLength">
            <property name="max" value="30"/>
        </module>
        
        <!-- Comments -->
        <module name="JavadocMethod"/>
        <module name="JavadocType"/>
        <module name="JavadocVariable"/>
    </module>
</module>
```

#### Configuration PMD
```xml
<?xml version="1.0"?>
<ruleset name="AI-KIDO Formation Rules">
    <description>PMD rules for AI-KIDO Design Patterns formation</description>
    
    <!-- Design Rules -->
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
    
    <!-- Pattern-specific rules -->
    <rule ref="category/java/design.xml/AbstractClassWithoutAbstractMethod"/>
    <rule ref="category/java/design.xml/FinalFieldCouldBeStatic"/>
    <rule ref="category/java/design.xml/SingularField"/>
    
    <!-- Best Practices -->
    <rule ref="category/java/bestpractices.xml/AvoidReassigningParameters"/>
    <rule ref="category/java/bestpractices.xml/DefaultLabelNotLastInSwitchStmt"/>
    <rule ref="category/java/bestpractices.xml/ForLoopCanBeForeach"/>
</ruleset>
```

## Exemples d'application

### Exemple Complet : Observer Pattern

#### Implémentation PHP
```php
<?php

declare(strict_types=1);

namespace Formation\AiKido\Patterns\Behavioral;

use SplObjectStorage;
use SplObserver;
use SplSubject;

/**
 * Observer Pattern implementation.
 * 
 * Defines a one-to-many dependency between objects so that when one object
 * changes state, all its dependents are notified automatically.
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
interface SubjectInterface
{
    public function attach(ObserverInterface $observer): void;
    public function detach(ObserverInterface $observer): void;
    public function notify(): void;
}

interface ObserverInterface
{
    public function update(SubjectInterface $subject): void;
}

/**
 * Concrete subject implementation.
 */
final class NewsletterSubject implements SubjectInterface
{
    private SplObjectStorage $observers;
    private string $content = '';

    public function __construct()
    {
        $this->observers = new SplObjectStorage();
    }

    public function attach(ObserverInterface $observer): void
    {
        $this->observers->attach($observer);
    }

    public function detach(ObserverInterface $observer): void
    {
        $this->observers->detach($observer);
    }

    public function notify(): void
    {
        foreach ($this->observers as $observer) {
            $observer->update($this);
        }
    }

    public function setContent(string $content): void
    {
        $this->content = $content;
        $this->notify();
    }

    public function getContent(): string
    {
        return $this->content;
    }
}

/**
 * Concrete observer implementation.
 */
final class EmailSubscriber implements ObserverInterface
{
    private string $email;

    public function __construct(string $email)
    {
        $this->email = $email;
    }

    public function update(SubjectInterface $subject): void
    {
        if ($subject instanceof NewsletterSubject) {
            $this->sendEmail($subject->getContent());
        }
    }

    private function sendEmail(string $content): void
    {
        // Send email implementation
        echo "Sending email to {$this->email}: {$content}\n";
    }
}
```

#### Implémentation Java
```java
package com.formation.aikido.patterns.behavioral;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Observer Pattern implementation.
 * 
 * <p>Defines a one-to-many dependency between objects so that when one object
 * changes state, all its dependents are notified automatically.
 * 
 * @see <a href="https://refactoring.guru/design-patterns/observer">Observer Pattern</a>
 */
public interface Subject {
    void attach(Observer observer);
    void detach(Observer observer);
    void notifyObservers();
}

public interface Observer {
    void update(Subject subject);
}

/**
 * Concrete subject implementation.
 */
public final class NewsletterSubject implements Subject {
    
    private final List<Observer> observers = new ArrayList<>();
    private String content = "";
    
    @Override
    public void attach(Observer observer) {
        Objects.requireNonNull(observer, "Observer cannot be null");
        if (!observers.contains(observer)) {
            observers.add(observer);
        }
    }
    
    @Override
    public void detach(Observer observer) {
        observers.remove(observer);
    }
    
    @Override
    public void notifyObservers() {
        // Create a copy to avoid ConcurrentModificationException
        List<Observer> observersCopy = new ArrayList<>(observers);
        for (Observer observer : observersCopy) {
            observer.update(this);
        }
    }
    
    /**
     * Sets the newsletter content and notifies all observers.
     * 
     * @param content the new content, must not be null
     * @throws NullPointerException if content is null
     */
    public void setContent(String content) {
        this.content = Objects.requireNonNull(content, "Content cannot be null");
        notifyObservers();
    }
    
    public String getContent() {
        return content;
    }
}

/**
 * Concrete observer implementation.
 */
public final class EmailSubscriber implements Observer {
    
    private final String email;
    
    /**
     * Creates a new email subscriber.
     * 
     * @param email the subscriber's email address, must not be null or empty
     * @throws NullPointerException if email is null
     * @throws IllegalArgumentException if email is empty
     */
    public EmailSubscriber(String email) {
        Objects.requireNonNull(email, "Email cannot be null");
        if (email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        this.email = email;
    }
    
    @Override
    public void update(Subject subject) {
        if (subject instanceof NewsletterSubject) {
            NewsletterSubject newsletter = (NewsletterSubject) subject;
            sendEmail(newsletter.getContent());
        }
    }
    
    private void sendEmail(String content) {
        // Send email implementation
        System.out.printf("Sending email to %s: %s%n", email, content);
    }
}
```

## Relations et dépendances

### Intégration avec Autres Tables

#### Vers Domain Model
- Standards → Contraintes sur les exemples de code
- Conventions → Format des structures de données
- Documentation → Métadonnées des entités

#### Vers Technical Principles
- Standards → Implémentation des principes SOLID
- Métriques → Seuils de qualité définis
- Outils → Validation automatisée des principes

#### Vers Business Glossary
- Nommage → Terminologie unifiée dans le code
- Patterns → Conventions de nommage spécifiques
- Documentation → Références aux définitions

### Évolution des Standards

#### Veille Technologique
- **PHP** : Suivi des nouvelles PSR, évolution du langage
- **Java** : Nouvelles versions, évolution des conventions
- **Outils** : Mise à jour des analyseurs statiques

#### Adaptation Formation
- **Exemples** : Mise à jour selon les nouvelles pratiques
- **Outils** : Configuration adaptée aux versions récentes
- **Documentation** : Références actualisées

## Métriques de Conformité

### Métriques Automatisées
- [ ] Conformité PSR-12 : 100% des exemples PHP
- [ ] Conformité Google Style : 100% des exemples Java
- [ ] Couverture documentation : 100% des classes/méthodes publiques
- [ ] Validation outils : PHPStan niveau max, PMD strict

### Métriques Qualité
- [ ] Complexité cyclomatique : < 10 par méthode
- [ ] Longueur méthodes : < 30 lignes
- [ ] Longueur classes : < 500 lignes
- [ ] Duplication code : < 5%

### Métriques Pédagogiques
- [ ] Exemples patterns : Code conforme pour chaque pattern
- [ ] Anti-patterns : Exemples "avant/après" standardisés
- [ ] Progression : Standards adaptés au niveau (junior/senior)
- [ ] Cohérence : Même style dans tous les modules

---

**VALIDATION** : Ces standards de code assurent la qualité et la cohérence de tous les exemples de la formation AI-KIDO, facilitant l'apprentissage et l'application des bonnes pratiques en PHP et Java.
